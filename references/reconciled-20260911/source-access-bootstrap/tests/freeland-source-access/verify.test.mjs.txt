import { createHash, generateKeyPairSync } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPaths,
  classifyWriteDenial,
  SourceAccessError,
  verifySourceAccess,
} from '../../scripts/freeland-source-access/lib.mjs';

const REPOSITORY = 'nuanu-ai/freeland_app';
const REPOSITORY_SSH = 'git@github.com:nuanu-ai/freeland_app.git';
const TITLE = 'FreelandQA read-only source checkout';
const fixtureKey = makeRuntimeKeyFixture();
const privateCanary = fixtureKey.private.toString('utf8').split('\n')[1];
const sourceRefCanary = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef\trefs/heads/private-source-canary';

function u32(value) {
  const output = Buffer.alloc(4);
  output.writeUInt32BE(value);
  return output;
}

function sshString(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  return Buffer.concat([u32(bytes.length), bytes]);
}

function encodeOpenSshPrivate(seed, publicKey) {
  const check = Buffer.from([0x51, 0x62, 0x73, 0x84]);
  const body = Buffer.concat([
    check,
    check,
    sshString('ssh-ed25519'),
    sshString(publicKey),
    sshString(Buffer.concat([seed, publicKey])),
    sshString(TITLE),
  ]);
  const paddingLength = 8 - (body.length % 8);
  const privateBlock = Buffer.concat([body, Buffer.from(Array.from({ length: paddingLength }, (_, index) => index + 1))]);
  const publicBlob = Buffer.concat([sshString('ssh-ed25519'), sshString(publicKey)]);
  const bytes = Buffer.concat([
    Buffer.from('openssh-key-v1\0', 'utf8'),
    sshString('none'),
    sshString('none'),
    sshString(Buffer.alloc(0)),
    u32(1),
    sshString(publicBlob),
    sshString(privateBlock),
  ]);
  const encoded = bytes.toString('base64').match(/.{1,70}/g).join('\n');
  return Buffer.from(`-----BEGIN OPENSSH PRIVATE KEY-----\n${encoded}\n-----END OPENSSH PRIVATE KEY-----\n`, 'utf8');
}

function makeRuntimeKeyFixture() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const seed = Buffer.from(privateKey.export({ format: 'der', type: 'pkcs8' })).subarray(-32);
  const rawPublic = Buffer.from(publicKey.export({ format: 'der', type: 'spki' })).subarray(-32);
  const blob = Buffer.concat([sshString('ssh-ed25519'), sshString(rawPublic)]);
  const publicLine = `ssh-ed25519 ${blob.toString('base64')} ${TITLE}`;
  return {
    private: encodeOpenSshPrivate(seed, rawPublic),
    public: `${publicLine}\n`,
    fingerprint: `SHA256:${createHash('sha256').update(blob).digest('base64').replace(/=$/, '')}`,
    publicLine,
  };
}

async function makeFixture() {
  const baseDir = await fs.mkdtemp(join(tmpdir(), 'freeland-source-access-verify-'));
  await fs.chmod(baseDir, 0o700);
  return { baseDir, paths: buildPaths(baseDir) };
}

async function cleanFixture(fixture) {
  await fs.rm(fixture.baseDir, { recursive: true, force: true });
}

async function writeValidAwaiting(paths) {
  await fs.writeFile(paths.privateKey, fixtureKey.private, { mode: 0o600 });
  await fs.writeFile(paths.publicKey, fixtureKey.public, { mode: 0o600 });
  await fs.writeFile(paths.handoff, [
    `repository=${REPOSITORY}`,
    `title=${TITLE}`,
    'allowWrite=false',
    `fingerprint=${fixtureKey.fingerprint}`,
    `publicKey=${fixtureKey.publicLine}`,
    '',
  ].join('\n'), { mode: 0o600 });
  for (const path of [paths.privateKey, paths.publicKey, paths.handoff]) await fs.chmod(path, 0o600);
}

function exactAttestation() {
  return `{"repository":"${REPOSITORY}","title":"${TITLE}","fingerprint":"${fixtureKey.fingerprint}","readOnly":true,"allowWrite":false}\n`;
}

function successfulRunner(calls, writeStderr = `ERROR: Permission to ${REPOSITORY} denied to deploy key.\n`) {
  return async (request) => {
    calls.push(request);
    if (request.args[0] === 'push') return { code: 1, signal: null, stderr: writeStderr };
    if (request.args[0] === 'ls-remote') return { code: 0, signal: null, stdout: sourceRefCanary };
    return { code: 0, signal: null, stdout: '', stderr: '' };
  };
}

function safeInvocation(request) {
  return {
    command: request.command,
    args: request.args,
    cwd: request.cwd,
    shell: request.shell,
    timeoutMs: request.timeoutMs,
    maxOutputBytes: request.maxOutputBytes,
    gitSshCommand: request.env?.GIT_SSH_COMMAND,
  };
}

function assertNoDisclosure(values) {
  const text = JSON.stringify(values);
  assert.equal(text.includes(privateCanary), false);
  assert.equal(text.includes(sourceRefCanary), false);
}

async function rejectionOf(promise) {
  let rejected;
  await promise.catch((error) => { rejected = error; });
  assert.ok(rejected, 'expected a rejection');
  return rejected;
}

describe('classifyWriteDenial', () => {
  test('accepts only exact deploy-key and write-access denials', () => {
    for (const denial of [
      `ERROR: Permission to ${REPOSITORY} denied to deploy key.\n`,
      `ERROR: Permission to ${REPOSITORY}.git denied to deploy key.\r\n`,
      'ERROR: Write access to repository not granted.\n',
    ]) {
      assert.equal(classifyWriteDenial(denial), true, denial);
    }
  });

  test('rejects non-allowlisted, decorated, and malformed denial output', () => {
    for (const output of [
      'git@github.com: Permission denied (publickey).\n',
      'Host key verification failed.\n',
      'ssh: connect to host github.com port 22: Operation timed out\n',
      `remote: Repository ${REPOSITORY} not found.\n`,
      'remote: error: GH006: Protected branch update failed.\n',
      'remote: error: GH013: Repository rule violations found.\n',
      'SOURCE_ACCESS_RUNNER_TIMEOUT',
      'SOURCE_ACCESS_RUNNER_SIGNAL',
      'SOURCE_ACCESS_RUNNER_OUTPUT_OVERFLOW',
      'ERROR: Permission denied.\n',
      `prefix ERROR: Permission to ${REPOSITORY} denied to deploy key.\n`,
      `ERROR: Permission to ${REPOSITORY} denied to deploy key. suffix\n`,
      `ERROR: Permission to another-owner/freeland_app denied to deploy key.\n`,
      `ERROR: Permission to ${REPOSITORY} denied to deploy key.\nextra`,
      '',
      null,
      { stderr: 'not a string' },
    ]) {
      assert.equal(classifyWriteDenial(output), false, String(output));
    }
  });
});

describe('verifySourceAccess', () => {
  test('proves read access then records an exact read-only attestation', async () => {
    const fixture = await makeFixture();
    const calls = [];
    try {
      await writeValidAwaiting(fixture.paths);
      const result = await verifySourceAccess({ baseDir: fixture.baseDir, runner: successfulRunner(calls) });
      assert.deepEqual(result, {
        schemaVersion: 1,
        status: 'SOURCE_ACCESS_READY',
        repository: REPOSITORY,
        title: TITLE,
        fingerprint: fixtureKey.fingerprint,
        readOnly: true,
        allowWrite: false,
        readSucceeded: true,
        writeDenied: true,
        attestationMatch: true,
      });
      assert.equal(calls.length, 6);
      const safeCalls = calls.map(safeInvocation);
      assert.deepEqual(safeCalls.slice(0, 5).map(({ command, args, shell, timeoutMs, maxOutputBytes }) => ({ command, args, shell, timeoutMs, maxOutputBytes })), [
        { command: 'git', args: ['ls-remote', REPOSITORY_SSH], shell: false, timeoutMs: 30_000, maxOutputBytes: 1024 * 1024 },
        { command: 'git', args: ['init', '--quiet'], shell: false, timeoutMs: 10_000, maxOutputBytes: 1024 * 1024 },
        { command: 'git', args: ['config', 'user.name', 'FreelandQA read-only probe'], shell: false, timeoutMs: 10_000, maxOutputBytes: 1024 * 1024 },
        { command: 'git', args: ['config', 'user.email', 'freelandqa-readonly@invalid'], shell: false, timeoutMs: 10_000, maxOutputBytes: 1024 * 1024 },
        { command: 'git', args: ['commit', '--allow-empty', '--quiet', '-m', 'FreelandQA read-only probe'], shell: false, timeoutMs: 10_000, maxOutputBytes: 1024 * 1024 },
      ]);
      assert.deepEqual(safeCalls[5], {
        command: 'git',
        args: [
          'push', '--dry-run', REPOSITORY_SSH,
          safeCalls[5].args[3],
        ],
        cwd: safeCalls[1].cwd,
        shell: false,
        timeoutMs: 30_000,
        maxOutputBytes: 1024 * 1024,
        gitSshCommand: safeCalls[5].gitSshCommand,
      });
      assert.match(safeCalls[5].args[3], /^HEAD:refs\/heads\/freelandqa-readonly-probe-[0-9a-f]{24}$/);
      const expectedSsh = `ssh -F /dev/null -i ${fixture.paths.privateKey} -o BatchMode=yes -o IdentitiesOnly=yes -o ForwardAgent=no -o StrictHostKeyChecking=yes`;
      assert.equal(safeCalls[0].gitSshCommand, expectedSsh);
      assert.equal(safeCalls[5].gitSshCommand, expectedSsh);
      for (const call of safeCalls.slice(1, -1)) assert.equal(call.gitSshCommand, undefined);
      const attestation = await fs.readFile(fixture.paths.attestation, 'utf8');
      assert.equal(attestation, exactAttestation());
      const stat = await fs.lstat(fixture.paths.attestation);
      assert.equal(stat.isFile(), true);
      assert.equal(stat.isSymbolicLink(), false);
      assert.equal(stat.nlink, 1);
      assert.equal(stat.mode & 0o777, 0o600);
      assertNoDisclosure([result, safeCalls]);
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('refuses non-awaiting or unsafe custody before any runner call', async () => {
    for (const scenario of ['absent', 'partial', 'wrong-mode', 'wrong-owner', 'symlink', 'hard-link']) {
      const fixture = await makeFixture();
      let calls = 0;
      try {
        if (scenario !== 'absent') await writeValidAwaiting(fixture.paths);
        if (scenario === 'partial') await fs.rm(fixture.paths.handoff);
        if (scenario === 'wrong-mode') await fs.chmod(fixture.paths.publicKey, 0o644);
        if (scenario === 'symlink') {
          await fs.rm(fixture.paths.handoff);
          await fs.symlink(fixture.paths.publicKey, fixture.paths.handoff);
        }
        if (scenario === 'hard-link') {
          await fs.rm(fixture.paths.handoff);
          await fs.link(fixture.paths.publicKey, fixture.paths.handoff);
        }
        await assert.rejects(
          verifySourceAccess({
            baseDir: fixture.baseDir,
            expectedUid: scenario === 'wrong-owner' ? Number.MAX_SAFE_INTEGER : undefined,
            runner: async () => { calls += 1; return { code: 0 }; },
          }),
          { name: 'SourceAccessError' },
          scenario,
        );
        assert.equal(calls, 0, scenario);
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('fails closed for a read error and every unsafe runner result', async () => {
    for (const result of [
      { code: 1, signal: null, stderr: 'read failed' },
      { timedOut: true },
      { overflow: true },
      { code: null, signal: 'SIGTERM' },
      { code: '0', signal: null },
      { code: 0, signal: null, stdout: { malformed: true } },
      null,
    ]) {
      const fixture = await makeFixture();
      const calls = [];
      try {
        await writeValidAwaiting(fixture.paths);
        await assert.rejects(
          verifySourceAccess({ baseDir: fixture.baseDir, runner: async (request) => { calls.push(request); return result; } }),
          { name: 'SourceAccessError' },
        );
        assert.equal(calls.length, 1);
        await assert.rejects(fs.lstat(fixture.paths.attestation), { code: 'ENOENT' });
        assertNoDisclosure(calls.map(safeInvocation));
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('collapses every runner-thrown error without disclosing private-key or source-ref canaries', async () => {
    for (const canary of [privateCanary, sourceRefCanary]) {
      const fixture = await makeFixture();
      try {
        await writeValidAwaiting(fixture.paths);
        const error = await rejectionOf(verifySourceAccess({
          baseDir: fixture.baseDir,
          runner: async () => { throw new SourceAccessError(canary); },
        }));
        if (error.message !== 'SOURCE_ACCESS_RUNNER_FAILED') {
          throw new Error('runner error was not collapsed');
        }
        assertNoDisclosure([error.message, error.stack]);
        await assert.rejects(fs.lstat(fixture.paths.attestation), { code: 'ENOENT' });
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('rejects write capability and every non-allowlisted write outcome', async () => {
    const rejected = [
      { code: 0, signal: null, stderr: '' },
      { code: 1, signal: null, stderr: 'git@github.com: Permission denied (publickey).\n' },
      { code: 1, signal: null, stderr: 'Host key verification failed.\n' },
      { code: 1, signal: null, stderr: 'ssh: connect to host github.com port 22: Operation timed out\n' },
      { code: 1, signal: null, stderr: `remote: Repository ${REPOSITORY} not found.\n` },
      { code: 1, signal: null, stderr: 'remote: error: GH006: Protected branch update failed.\n' },
      { code: 1, signal: null, stderr: 'remote: error: GH013: Repository rule violations found.\n' },
      { timedOut: true },
      { overflow: true },
      { code: null, signal: 'SIGTERM' },
      { code: 1, signal: null, stderr: `prefix ERROR: Permission to ${REPOSITORY} denied to deploy key.\n` },
      { code: 1, signal: null, stderr: `ERROR: Permission to another-owner/freeland_app denied to deploy key.\n` },
      { code: 1, signal: null, stderr: { malformed: true } },
    ];
    for (const writeResult of rejected) {
      const fixture = await makeFixture();
      const calls = [];
      try {
        await writeValidAwaiting(fixture.paths);
        await assert.rejects(verifySourceAccess({
          baseDir: fixture.baseDir,
          runner: async (request) => {
            calls.push(request);
            if (request.args[0] === 'ls-remote') return { code: 0, signal: null, stdout: sourceRefCanary };
            if (request.args[0] === 'push') return writeResult;
            return { code: 0, signal: null };
          },
        }), { name: 'SourceAccessError' });
        assert.equal(calls.at(-1).args[0], 'push');
        await assert.rejects(fs.lstat(fixture.paths.attestation), { code: 'ENOENT' });
        assertNoDisclosure(calls.map(safeInvocation));
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('accepts each allowlisted dry-run denial', async () => {
    for (const denial of [
      `ERROR: Permission to ${REPOSITORY} denied to deploy key.\n`,
      `ERROR: Permission to ${REPOSITORY}.git denied to deploy key.\n`,
      'ERROR: Write access to repository not granted.\n',
    ]) {
      const fixture = await makeFixture();
      try {
        await writeValidAwaiting(fixture.paths);
        const result = await verifySourceAccess({ baseDir: fixture.baseDir, runner: successfulRunner([], denial) });
        assert.equal(result.status, 'SOURCE_ACCESS_READY');
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('replays only the exact ready attestation without runner calls or byte changes', async () => {
    const fixture = await makeFixture();
    try {
      await writeValidAwaiting(fixture.paths);
      await fs.writeFile(fixture.paths.attestation, exactAttestation(), { mode: 0o600 });
      await fs.chmod(fixture.paths.attestation, 0o600);
      const before = await fs.readFile(fixture.paths.attestation);
      let calls = 0;
      const result = await verifySourceAccess({ baseDir: fixture.baseDir, runner: async () => { calls += 1; } });
      assert.equal(result.status, 'SOURCE_ACCESS_READY');
      assert.equal(calls, 0);
      assert.deepEqual(await fs.readFile(fixture.paths.attestation), before);
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('rejects any attestation collision or custody mismatch without runner calls or overwrite', async () => {
    const wrongBytes = [
      `${exactAttestation()} `,
      `{"title":"${TITLE}","repository":"${REPOSITORY}","fingerprint":"${fixtureKey.fingerprint}","readOnly":true,"allowWrite":false}\n`,
      exactAttestation().replace('"readOnly":true', '"readOnly":false'),
      exactAttestation().trimEnd(),
      exactAttestation().replace('"allowWrite":false', '"allowWrite":false,"extra":true'),
      exactAttestation().replace(fixtureKey.fingerprint, 'SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
    ];
    for (const scenario of ['collision', 'wrong-mode', 'wrong-type', 'link', 'wrong-owner']) {
      const fixture = await makeFixture();
      let calls = 0;
      try {
        await writeValidAwaiting(fixture.paths);
        await fs.writeFile(fixture.paths.attestation, scenario === 'collision' ? wrongBytes[0] : exactAttestation(), { mode: 0o600 });
        if (scenario === 'wrong-mode') await fs.chmod(fixture.paths.attestation, 0o644);
        if (scenario === 'wrong-type') {
          await fs.rm(fixture.paths.attestation);
          await fs.mkdir(fixture.paths.attestation);
        }
        if (scenario === 'link') {
          await fs.rm(fixture.paths.attestation);
          await fs.link(fixture.paths.handoff, fixture.paths.attestation);
        }
        const before = scenario === 'wrong-type' ? null : await fs.readFile(fixture.paths.attestation);
        await assert.rejects(verifySourceAccess({
          baseDir: fixture.baseDir,
          expectedUid: scenario === 'wrong-owner' ? Number.MAX_SAFE_INTEGER : undefined,
          runner: async () => { calls += 1; },
        }), { name: 'SourceAccessError' });
        assert.equal(calls, 0, scenario);
        if (before) assert.deepEqual(await fs.readFile(fixture.paths.attestation), before);
      } finally {
        await cleanFixture(fixture);
      }
    }
    for (const bytes of wrongBytes) {
      const fixture = await makeFixture();
      let calls = 0;
      try {
        await writeValidAwaiting(fixture.paths);
        await fs.writeFile(fixture.paths.attestation, bytes, { mode: 0o600 });
        const before = await fs.readFile(fixture.paths.attestation);
        await assert.rejects(verifySourceAccess({ baseDir: fixture.baseDir, runner: async () => { calls += 1; } }), { name: 'SourceAccessError' });
        assert.equal(calls, 0);
        assert.deepEqual(await fs.readFile(fixture.paths.attestation), before);
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('does not overwrite an attestation that appears after the write probe', async () => {
    const fixture = await makeFixture();
    const calls = [];
    const collision = '{"collision":true}\n';
    try {
      await writeValidAwaiting(fixture.paths);
      await assert.rejects(verifySourceAccess({
        baseDir: fixture.baseDir,
        runner: async (request) => {
          calls.push(request);
          if (request.args[0] === 'ls-remote') return { code: 0, signal: null, stdout: sourceRefCanary };
          if (request.args[0] === 'push') {
            await fs.writeFile(fixture.paths.attestation, collision, { mode: 0o600, flag: 'wx' });
            return { code: 1, signal: null, stderr: `ERROR: Permission to ${REPOSITORY} denied to deploy key.\n` };
          }
          return { code: 0, signal: null };
        },
      }), { message: 'SOURCE_ACCESS_ATTESTATION_COLLISION' });
      assert.equal(await fs.readFile(fixture.paths.attestation, 'utf8'), collision);
      assertNoDisclosure(calls.map(safeInvocation));
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('stops without attesting when custody changes after the dry-run', async () => {
    const fixture = await makeFixture();
    try {
      await writeValidAwaiting(fixture.paths);
      await assert.rejects(verifySourceAccess({
        baseDir: fixture.baseDir,
        runner: async (request) => {
          if (request.args[0] === 'ls-remote') return { code: 0, signal: null, stdout: sourceRefCanary };
          if (request.args[0] === 'push') {
            await fs.writeFile(fixture.paths.publicKey, 'drifted custody\n', { mode: 0o600 });
            return { code: 1, signal: null, stderr: `ERROR: Permission to ${REPOSITORY} denied to deploy key.\n` };
          }
          return { code: 0, signal: null };
        },
      }), { name: 'SourceAccessError' });
      await assert.rejects(fs.lstat(fixture.paths.attestation), { code: 'ENOENT' });
    } finally {
      await cleanFixture(fixture);
    }
  });
});
