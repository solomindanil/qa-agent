import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';
import { SOURCE_ACCESS } from '../../scripts/freeland-source-access/constants.mjs';
import { SourceAccessError } from '../../scripts/freeland-source-access/lib.mjs';
import { main, runCommand } from '../../scripts/freeland-source-access/cli.mjs';

const testDir = dirname(fileURLToPath(import.meta.url));
const cliPath = join(testDir, '..', '..', 'scripts', 'freeland-source-access', 'cli.mjs');
const privateCanary = 'PRIVATE-KEY-CANARY-4fe3c2';
const publicCanary = 'ssh-ed25519 PUBLIC-KEY-CANARY';
const sourceRefCanary = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef\trefs/heads/private-source-canary';
const diagnosticCanary = 'git@github.com: Permission denied (publickey).';

function memoryStream() {
  let value = '';
  return {
    write(chunk) {
      value += String(chunk);
      return true;
    },
    value() {
      return value;
    },
  };
}

async function invoke(argv, operations) {
  const stdout = memoryStream();
  const stderr = memoryStream();
  const exitCode = await main({ argv, stdout, stderr, operations });
  return { exitCode, stdout: stdout.value(), stderr: stderr.value() };
}

function prepareResult() {
  return {
    schemaVersion: 1,
    status: 'AWAITING_ADMIN',
    repository: 'nuanu-ai/freeland_app',
    title: 'FreelandQA read-only source checkout',
    fingerprint: 'SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    handoffPath: join(SOURCE_ACCESS.baseDir, SOURCE_ACCESS.handoffBasename),
  };
}

function verifyResult() {
  return {
    schemaVersion: 1,
    status: 'SOURCE_ACCESS_READY',
    repository: 'nuanu-ai/freeland_app',
    title: 'FreelandQA read-only source checkout',
    fingerprint: 'SHA256:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    readOnly: true,
    allowWrite: false,
    readSucceeded: true,
    writeDenied: true,
    attestationMatch: true,
  };
}

function assertClosedOutput(result) {
  const captured = `${result.stdout}${result.stderr}`;
  for (const canary of [privateCanary, publicCanary, sourceRefCanary, diagnosticCanary]) {
    assert.equal(captured.includes(canary), false, `disclosed ${canary}`);
  }
  assert.equal(captured.includes('/private/custody/path'), false);
  assert.equal(captured.includes('Error:'), false);
  assert.equal(captured.includes(' at '), false);
}

async function makeProcessFixture() {
  const directory = await fs.mkdtemp(join(tmpdir(), 'freeland-source-runner-'));
  return { directory, pidFile: join(directory, 'descendant.pid') };
}

async function readPid(pidFile) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      return Number.parseInt(await fs.readFile(pidFile, 'utf8'), 10);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw new Error('descendant pid was not recorded');
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    throw error;
  }
}

async function assertProcessGone(pid) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (!processExists(pid)) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(`descendant process ${pid} is still running`);
}

async function cleanProcessFixture(fixture, knownPid) {
  let pid = knownPid;
  if (!Number.isInteger(pid)) {
    try {
      pid = Number.parseInt(await fs.readFile(fixture.pidFile, 'utf8'), 10);
    } catch {
      pid = undefined;
    }
  }
  if (Number.isInteger(pid) && pid > 0 && processExists(pid)) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Best effort cleanup for a test whose primary assertion already failed.
    }
  }
  await fs.rm(fixture.directory, { recursive: true, force: true });
}

function descendantProgram(pidFile, action) {
  return `
    const { spawn } = require('node:child_process');
    const { writeFileSync } = require('node:fs');
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    writeFileSync(${JSON.stringify(pidFile)}, String(child.pid));
    ${action}
    setInterval(() => {}, 1000);
  `;
}

async function runNode(program, options = {}) {
  return runCommand({
    command: process.execPath,
    args: ['-e', program],
    shell: false,
    timeoutMs: options.timeoutMs ?? 2_000,
    maxOutputBytes: options.maxOutputBytes ?? SOURCE_ACCESS.maxOutputBytes,
    env: options.env,
  });
}

describe('main', () => {
  test('rejects every missing, unknown, flagged, or additional argument without calling an operation', async () => {
    let calls = 0;
    const operations = {
      prepare: async () => { calls += 1; return prepareResult(); },
      verify: async () => { calls += 1; return verifyResult(); },
    };
    for (const argv of [[], ['unknown'], ['--help'], ['prepare', 'extra'], ['verify', '--force'], ['prepare', 'verify']]) {
      const result = await invoke(argv, operations);
      assert.deepEqual(result, {
        exitCode: 1,
        stdout: '{"schemaVersion":1,"status":"SOURCE_ACCESS_FAIL","reason":"SOURCE_ACCESS_USAGE"}\n',
        stderr: '',
      });
    }
    assert.equal(calls, 0);
  });

  test('routes each exact command and emits one canonical success line', async () => {
    const calls = [];
    const operations = {
      prepare: async () => { calls.push('prepare'); return prepareResult(); },
      verify: async () => { calls.push('verify'); return verifyResult(); },
    };
    const prepared = await invoke(['prepare'], operations);
    const verified = await invoke(['verify'], operations);
    assert.deepEqual(calls, ['prepare', 'verify']);
    assert.deepEqual(prepared, { exitCode: 0, stdout: `${JSON.stringify(prepareResult())}\n`, stderr: '' });
    assert.deepEqual(verified, { exitCode: 0, stdout: `${JSON.stringify(verifyResult())}\n`, stderr: '' });
  });

  test('emits only an allowlisted reason for a known failure', async () => {
    const result = await invoke(['verify'], {
      prepare: async () => prepareResult(),
      verify: async () => { throw new SourceAccessError('SOURCE_ACCESS_KEY_INVALID'); },
    });
    assert.deepEqual(result, {
      exitCode: 1,
      stdout: '{"schemaVersion":1,"status":"SOURCE_ACCESS_FAIL","reason":"SOURCE_ACCESS_KEY_INVALID"}\n',
      stderr: '',
    });
  });

  test('collapses unexpected errors and unsafe success values without disclosing diagnostics', async () => {
    const unsafeValues = [
      new Error(`${privateCanary} ${sourceRefCanary} ${diagnosticCanary} /private/custody/path`),
      new SourceAccessError(`${publicCanary} /private/custody/path`),
    ];
    for (const error of unsafeValues) {
      const result = await invoke(['prepare'], {
        prepare: async () => { throw error; },
        verify: async () => verifyResult(),
      });
      assert.deepEqual(result, {
        exitCode: 1,
        stdout: '{"schemaVersion":1,"status":"SOURCE_ACCESS_FAIL","reason":"SOURCE_ACCESS_INTERNAL"}\n',
        stderr: '',
      });
      assertClosedOutput(result);
    }

    const unsafeSuccess = await invoke(['prepare'], {
      prepare: async () => ({ ...prepareResult(), privateKey: privateCanary }),
      verify: async () => verifyResult(),
    });
    assert.deepEqual(unsafeSuccess, {
      exitCode: 1,
      stdout: '{"schemaVersion":1,"status":"SOURCE_ACCESS_FAIL","reason":"SOURCE_ACCESS_INTERNAL"}\n',
      stderr: '',
    });
    assertClosedOutput(unsafeSuccess);
  });

  test('production subprocess rejects arguments without touching custody state', () => {
    for (const argv of [[], ['--help'], ['prepare', 'extra']]) {
      const result = spawnSync(process.execPath, [cliPath, ...argv], {
        encoding: 'utf8',
        timeout: 2_000,
        env: { PATH: process.env.PATH },
      });
      assert.equal(result.status, 1);
      assert.equal(result.signal, null);
      assert.equal(result.stdout, '{"schemaVersion":1,"status":"SOURCE_ACCESS_FAIL","reason":"SOURCE_ACCESS_USAGE"}\n');
      assert.equal(result.stderr, '');
    }
  });
});

describe('runCommand', () => {
  test('returns a closed structured result when the executable cannot start', async () => {
    const result = await runCommand({
      command: 'freeland-source-access-missing-executable',
      args: [],
      shell: false,
      timeoutMs: 500,
      maxOutputBytes: SOURCE_ACCESS.maxOutputBytes,
    });
    assert.deepEqual(result, {
      executable: 'freeland-source-access-missing-executable',
      code: null,
      signal: null,
      stdout: '',
      stderr: '',
      timedOut: false,
      overflow: false,
    });
    assertClosedOutput(result);
  });

  test('uses shell false and a fixed sanitized environment', async () => {
    const inheritedName = 'FREELAND_RUNNER_PRIVATE_CANARY';
    const original = process.env[inheritedName];
    process.env[inheritedName] = privateCanary;
    try {
      const result = await runNode('process.stdout.write(JSON.stringify(process.env))', {
        env: { GIT_SSH_COMMAND: 'ssh -F /dev/null -i /fixed/private/key' },
      });
      assert.equal(result.code, 0);
      assert.equal(result.signal, null);
      assert.equal(result.timedOut, false);
      assert.equal(result.overflow, false);
      assert.equal(result.stderr, '');
      const childEnvironment = JSON.parse(result.stdout);
      if (process.platform === 'darwin') {
        assert.match(childEnvironment.__CF_USER_TEXT_ENCODING, /^0x[0-9A-F]+:0x[0-9A-F]+:0x[0-9A-F]+$/);
        delete childEnvironment.__CF_USER_TEXT_ENCODING;
      }
      assert.deepEqual(childEnvironment, {
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_SSH_COMMAND: 'ssh -F /dev/null -i /fixed/private/key',
        GIT_TERMINAL_PROMPT: '0',
        LANG: 'C',
        LC_ALL: 'C',
        PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
        SSH_ASKPASS_REQUIRE: 'never',
      });
      assert.equal(result.stdout.includes(privateCanary), false);
    } finally {
      if (original === undefined) delete process.env[inheritedName];
      else process.env[inheritedName] = original;
    }
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    test(`terminates the whole process group when the runner host receives ${signal}`, async () => {
      const fixture = await makeProcessFixture();
      let descendantPid;
      try {
        const baselineListeners = process.listenerCount(signal);
        const running = runNode(descendantProgram(fixture.pidFile, ''));
        descendantPid = await readPid(fixture.pidFile);
        assert.equal(process.listenerCount(signal), baselineListeners + 1);
        process.emit(signal);
        const result = await running;
        assert.equal(result.signal, signal);
        assert.equal(result.stdout, '');
        assert.equal(result.stderr, '');
        await assertProcessGone(descendantPid);
        assert.equal(process.listenerCount(signal), baselineListeners);
      } finally {
        await cleanProcessFixture(fixture, descendantPid);
      }
    });
  }

  test('times out, scrubs captured output, and leaves no descendant running', async () => {
    const fixture = await makeProcessFixture();
    let descendantPid;
    try {
      const result = await runNode(descendantProgram(
        fixture.pidFile,
        `process.stdout.write(${JSON.stringify(`${publicCanary}\n${sourceRefCanary}\n`)});`,
      ), { timeoutMs: 75 });
      descendantPid = await readPid(fixture.pidFile);
      assert.equal(result.timedOut, true);
      assert.equal(result.overflow, false);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, '');
      await assertProcessGone(descendantPid);
      assertClosedOutput({ stdout: result.stdout, stderr: result.stderr });
    } finally {
      await cleanProcessFixture(fixture, descendantPid);
    }
  });

  test('caps combined output, scrubs diagnostics, and leaves no descendant running', async () => {
    const fixture = await makeProcessFixture();
    let descendantPid;
    try {
      const result = await runNode(descendantProgram(
        fixture.pidFile,
        `process.stdout.write(${JSON.stringify(privateCanary.repeat(24))}); process.stderr.write(${JSON.stringify(diagnosticCanary.repeat(15))});`,
      ), { maxOutputBytes: 1_024 });
      descendantPid = await readPid(fixture.pidFile);
      assert.equal(result.timedOut, false);
      assert.equal(result.overflow, true);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, '');
      await assertProcessGone(descendantPid);
      assertClosedOutput({ stdout: result.stdout, stderr: result.stderr });
    } finally {
      await cleanProcessFixture(fixture, descendantPid);
    }
  });
});
