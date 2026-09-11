#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE_ACCESS } from './constants.mjs';
import {
  prepareSourceAccess,
  SourceAccessError,
  verifySourceAccess,
} from './lib.mjs';

const FAILURE_REASONS = new Set([
  'SOURCE_ACCESS_ATTESTATION_COLLISION',
  'SOURCE_ACCESS_ATTESTATION_FAILED',
  'SOURCE_ACCESS_ATTESTATION_INVALID',
  'SOURCE_ACCESS_CUSTODY_CHANGED',
  'SOURCE_ACCESS_CUSTODY_INVALID',
  'SOURCE_ACCESS_CUSTODY_NOT_READY',
  'SOURCE_ACCESS_DESTINATION_COLLISION',
  'SOURCE_ACCESS_DIRECTORY_INVALID',
  'SOURCE_ACCESS_HANDOFF_INVALID',
  'SOURCE_ACCESS_KEY_INVALID',
  'SOURCE_ACCESS_KEY_MISMATCH',
  'SOURCE_ACCESS_LOCAL_GIT_FAILED',
  'SOURCE_ACCESS_PARTIAL_STATE',
  'SOURCE_ACCESS_PREPARE_FAILED',
  'SOURCE_ACCESS_READ_FAILED',
  'SOURCE_ACCESS_RUNNER_EXIT',
  'SOURCE_ACCESS_RUNNER_FAILED',
  'SOURCE_ACCESS_RUNNER_OUTPUT_OVERFLOW',
  'SOURCE_ACCESS_RUNNER_SIGNAL',
  'SOURCE_ACCESS_RUNNER_TIMEOUT',
  'SOURCE_ACCESS_RUNNER_UNAVAILABLE',
  'SOURCE_ACCESS_RUNNER_UNEXPECTED',
  'SOURCE_ACCESS_TEMPORARY_DIRECTORY_INVALID',
  'SOURCE_ACCESS_VERIFY_FAILED',
  'SOURCE_ACCESS_VERIFY_TEMPORARY_DIRECTORY_INVALID',
  'SOURCE_ACCESS_WRITE_DENIAL_UNEXPECTED',
  'SOURCE_WRITE_CAPABILITY_DETECTED',
]);

const BASE_ENVIRONMENT = Object.freeze({
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_TERMINAL_PROMPT: '0',
  LANG: 'C',
  LC_ALL: 'C',
  PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
  SSH_ASKPASS_REQUIRE: 'never',
});

function runnerFailure(executable = '') {
  return {
    executable,
    code: null,
    signal: null,
    stdout: '',
    stderr: '',
    timedOut: false,
    overflow: false,
  };
}

function validInvocation(invocation) {
  if (!invocation || typeof invocation !== 'object') return false;
  if (typeof invocation.command !== 'string' || invocation.command.length === 0) return false;
  if (!Array.isArray(invocation.args) || invocation.args.some((arg) => typeof arg !== 'string')) return false;
  if (invocation.shell !== false) return false;
  if (invocation.cwd !== undefined && (typeof invocation.cwd !== 'string' || invocation.cwd.length === 0)) return false;
  if (!Number.isInteger(invocation.timeoutMs) || invocation.timeoutMs <= 0 || invocation.timeoutMs > SOURCE_ACCESS.networkTimeoutMs) return false;
  if (!Number.isInteger(invocation.maxOutputBytes) || invocation.maxOutputBytes <= 0 || invocation.maxOutputBytes > SOURCE_ACCESS.maxOutputBytes) return false;
  if (invocation.env === undefined) return true;
  if (!invocation.env || typeof invocation.env !== 'object' || Array.isArray(invocation.env)) return false;
  const keys = Object.keys(invocation.env);
  return keys.length === 1 && keys[0] === 'GIT_SSH_COMMAND' && typeof invocation.env.GIT_SSH_COMMAND === 'string';
}

function sanitizedEnvironment(env) {
  return env ? { ...BASE_ENVIRONMENT, GIT_SSH_COMMAND: env.GIT_SSH_COMMAND } : { ...BASE_ENVIRONMENT };
}

function canSignalGroup(pid) {
  return process.platform !== 'win32' && Number.isInteger(pid) && pid > 0;
}

function signalProcessGroup(child, signal) {
  try {
    if (canSignalGroup(child.pid)) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    // ESRCH means the closed group no longer needs termination.
  }
}

function processGroupExists(child) {
  try {
    if (canSignalGroup(child.pid)) process.kill(-child.pid, 0);
    else if (child.exitCode === null && child.signalCode === null) return true;
    else return false;
    return true;
  } catch {
    return false;
  }
}

function terminateProcessGroup(child) {
  signalProcessGroup(child, 'SIGTERM');
  return new Promise((resolveTermination) => {
    const startedAt = Date.now();
    let sentKill = false;
    const check = () => {
      if (!processGroupExists(child)) {
        resolveTermination();
        return;
      }
      if (!sentKill && Date.now() - startedAt >= 100) {
        sentKill = true;
        signalProcessGroup(child, 'SIGKILL');
      }
      setTimeout(check, 10);
    };
    check();
  });
}

export function runCommand(invocation) {
  const executable = typeof invocation?.command === 'string' ? invocation.command : '';
  if (!validInvocation(invocation)) return Promise.resolve(runnerFailure(executable));

  return new Promise((resolveResult) => {
    let child;
    try {
      child = spawn(invocation.command, invocation.args, {
        cwd: invocation.cwd,
        detached: process.platform !== 'win32',
        env: sanitizedEnvironment(invocation.env),
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch {
      resolveResult(runnerFailure(executable));
      return;
    }

    let stdout = [];
    let stderr = [];
    let outputBytes = 0;
    let timedOut = false;
    let overflow = false;
    let interruptedSignal = null;
    let spawnFailed = false;
    let termination;
    let settled = false;

    const scrubOutput = () => {
      stdout = [];
      stderr = [];
    };
    const terminate = () => {
      if (!termination) termination = terminateProcessGroup(child);
      return termination;
    };
    const capture = (target, chunk) => {
      if (timedOut || overflow || interruptedSignal || spawnFailed) return;
      outputBytes += chunk.length;
      if (outputBytes > invocation.maxOutputBytes) {
        overflow = true;
        scrubOutput();
        void terminate();
        return;
      }
      target.push(Buffer.from(chunk));
    };

    child.stdout.on('data', (chunk) => capture(stdout, chunk));
    child.stderr.on('data', (chunk) => capture(stderr, chunk));

    const onInterrupt = (signal) => {
      interruptedSignal = signal;
      scrubOutput();
      void terminate();
    };
    const onSigint = () => onInterrupt('SIGINT');
    const onSigterm = () => onInterrupt('SIGTERM');
    process.on('SIGINT', onSigint);
    process.on('SIGTERM', onSigterm);

    const timeout = setTimeout(() => {
      timedOut = true;
      scrubOutput();
      void terminate();
    }, invocation.timeoutMs);

    child.on('error', () => {
      spawnFailed = true;
      scrubOutput();
      void terminate();
    });

    child.on('exit', (_code, signal) => {
      if (signal) {
        scrubOutput();
        void terminate();
      }
    });

    child.on('close', async (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (signal && !termination) {
        scrubOutput();
        terminate();
      }
      if (termination) await termination;
      process.removeListener('SIGINT', onSigint);
      process.removeListener('SIGTERM', onSigterm);
      const unsafeOutput = timedOut || overflow || interruptedSignal || signal || spawnFailed;
      resolveResult({
        executable,
        code: spawnFailed ? null : code,
        signal: interruptedSignal ?? signal ?? null,
        stdout: unsafeOutput ? '' : Buffer.concat(stdout).toString('utf8'),
        stderr: unsafeOutput ? '' : Buffer.concat(stderr).toString('utf8'),
        timedOut,
        overflow,
      });
    });
  });
}

function hasExactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key, index) => actual[index] === key);
}

function validFingerprint(value) {
  return typeof value === 'string' && /^SHA256:[A-Za-z0-9+/]{43}$/.test(value);
}

function closePrepareResult(value) {
  const keys = ['schemaVersion', 'status', 'repository', 'title', 'fingerprint', 'handoffPath'];
  const expectedHandoff = join(SOURCE_ACCESS.baseDir, SOURCE_ACCESS.handoffBasename);
  if (!hasExactKeys(value, keys)
    || value.schemaVersion !== SOURCE_ACCESS.schemaVersion
    || value.status !== 'AWAITING_ADMIN'
    || value.repository !== SOURCE_ACCESS.repository
    || value.title !== SOURCE_ACCESS.title
    || !validFingerprint(value.fingerprint)
    || value.handoffPath !== expectedHandoff) {
    throw new Error('closed result validation failed');
  }
  return {
    schemaVersion: value.schemaVersion,
    status: value.status,
    repository: value.repository,
    title: value.title,
    fingerprint: value.fingerprint,
    handoffPath: value.handoffPath,
  };
}

function closeVerifyResult(value) {
  const keys = [
    'schemaVersion', 'status', 'repository', 'title', 'fingerprint', 'readOnly',
    'allowWrite', 'readSucceeded', 'writeDenied', 'attestationMatch',
  ];
  if (!hasExactKeys(value, keys)
    || value.schemaVersion !== SOURCE_ACCESS.schemaVersion
    || value.status !== 'SOURCE_ACCESS_READY'
    || value.repository !== SOURCE_ACCESS.repository
    || value.title !== SOURCE_ACCESS.title
    || !validFingerprint(value.fingerprint)
    || value.readOnly !== true
    || value.allowWrite !== false
    || value.readSucceeded !== true
    || value.writeDenied !== true
    || value.attestationMatch !== true) {
    throw new Error('closed result validation failed');
  }
  return {
    schemaVersion: value.schemaVersion,
    status: value.status,
    repository: value.repository,
    title: value.title,
    fingerprint: value.fingerprint,
    readOnly: value.readOnly,
    allowWrite: value.allowWrite,
    readSucceeded: value.readSucceeded,
    writeDenied: value.writeDenied,
    attestationMatch: value.attestationMatch,
  };
}

function failure(reason) {
  return {
    schemaVersion: SOURCE_ACCESS.schemaVersion,
    status: 'SOURCE_ACCESS_FAIL',
    reason,
  };
}

function writeLine(stdout, value) {
  stdout.write(`${JSON.stringify(value)}\n`);
}

function productionOperations() {
  return {
    prepare: () => prepareSourceAccess({ runner: runCommand }),
    verify: () => verifySourceAccess({ runner: runCommand }),
  };
}

export async function main({
  argv = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
  operations = productionOperations(),
} = {}) {
  void stderr;
  const [command, ...extra] = argv;
  if (!['prepare', 'verify'].includes(command) || extra.length !== 0) {
    writeLine(stdout, failure('SOURCE_ACCESS_USAGE'));
    return 1;
  }

  try {
    const result = await operations[command]();
    writeLine(stdout, command === 'prepare' ? closePrepareResult(result) : closeVerifyResult(result));
    return 0;
  } catch (error) {
    const reason = error instanceof SourceAccessError && FAILURE_REASONS.has(error.message)
      ? error.message
      : 'SOURCE_ACCESS_INTERNAL';
    writeLine(stdout, failure(reason));
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = await main();
}
