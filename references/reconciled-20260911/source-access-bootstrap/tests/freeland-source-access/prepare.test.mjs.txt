import { execFile as execFileCallback } from 'node:child_process';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPaths, prepareSourceAccess } from '../../scripts/freeland-source-access/lib.mjs';

const execFile = promisify(execFileCallback);
const fixtureKey = makeRuntimeKeyFixture();
const otherFixtureKey = makeRuntimeKeyFixture();
const fixturePrivate = fixtureKey.private;
const fixturePublic = fixtureKey.public;
const otherFixturePublic = otherFixtureKey.public;
const fixtureFingerprint = fixtureKey.fingerprint;
const sshKeygenAvailable = await isExecutableAvailable('ssh-keygen');

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
    sshString('FreelandQA read-only source checkout'),
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
  const publicMaterial = `ssh-ed25519 ${blob.toString('base64')} FreelandQA read-only source checkout\n`;
  return {
    seed,
    publicKey: rawPublic,
    private: encodeOpenSshPrivate(seed, rawPublic),
    public: publicMaterial,
    fingerprint: fingerprintOf(publicMaterial),
  };
}

async function isExecutableAvailable(command) {
  try {
    await execFile(command, ['-V']);
    return true;
  } catch (error) {
    return error?.code !== 'ENOENT';
  }
}

function fingerprintOf(publicMaterial) {
  const encoded = publicMaterial.trim().split(/\s+/)[1];
  return `SHA256:${createHash('sha256').update(Buffer.from(encoded, 'base64')).digest('base64').replace(/=$/, '')}`;
}

function corruptFixtureSeed() {
  const seed = Buffer.from(fixtureKey.seed);
  seed[0] ^= 0x01;
  return encodeOpenSshPrivate(seed, fixtureKey.publicKey);
}

async function makeFixture() {
  const baseDir = await fs.mkdtemp(join(tmpdir(), 'freeland-source-access-case-'));
  await fs.chmod(baseDir, 0o700);
  return { baseDir, paths: buildPaths(baseDir) };
}

async function cleanFixture(fixture) {
  await fs.rm(fixture.baseDir, { recursive: true, force: true });
}

function fakeRunner({ behavior = 'success', calls = [] } = {}) {
  return async (request) => {
    calls.push(request);
    if (behavior === 'timeout') return { timedOut: true };
    if (behavior === 'overflow') return { overflow: true };
    if (behavior === 'signal') return { code: null, signal: 'SIGTERM' };
    if (behavior === 'exit') return { code: 1, signal: null };
    if (behavior === 'wrong-executable') return { code: 0, signal: null, executable: 'not-ssh-keygen' };
    if (behavior === 'throw') throw new Error('runner failed');
    const outputPath = request.args.at(-1);
    if (behavior === 'malformed') {
      await fs.writeFile(outputPath, 'not a private key', { mode: 0o600 });
      await fs.writeFile(`${outputPath}.pub`, 'ssh-ed25519 invalid fixture\n', { mode: 0o600 });
    } else if (behavior === 'mismatch') {
      await fs.writeFile(outputPath, fixturePrivate, { mode: 0o600 });
      await fs.writeFile(`${outputPath}.pub`, otherFixturePublic, { mode: 0o600 });
    } else if (behavior === 'seed-corruption') {
      await fs.writeFile(outputPath, corruptFixtureSeed(), { mode: 0o600 });
      await fs.writeFile(`${outputPath}.pub`, fixturePublic, { mode: 0o600 });
    } else if (behavior === 'non-ed25519') {
      await fs.writeFile(outputPath, fixturePrivate, { mode: 0o600 });
      await fs.writeFile(`${outputPath}.pub`, publicWithKeyLength('ssh-rsa', 32), { mode: 0o600 });
    } else if (behavior === '384-bit') {
      await fs.writeFile(outputPath, fixturePrivate, { mode: 0o600 });
      await fs.writeFile(`${outputPath}.pub`, publicWithKeyLength('ssh-ed25519', 48), { mode: 0o600 });
    } else if (behavior === '512-bit') {
      await fs.writeFile(outputPath, fixturePrivate, { mode: 0o600 });
      await fs.writeFile(`${outputPath}.pub`, publicWithKeyLength('ssh-ed25519', 64), { mode: 0o600 });
    } else {
      await fs.writeFile(outputPath, fixturePrivate, { mode: 0o600 });
      await fs.writeFile(`${outputPath}.pub`, fixturePublic, { mode: 0o600 });
    }
    return { code: 0, signal: null };
  };
}

function publicWithKeyLength(algorithm, keyLength) {
  const type = Buffer.from(algorithm);
  const blob = Buffer.alloc(8 + type.length + keyLength, 0x11);
  blob.writeUInt32BE(type.length, 0);
  type.copy(blob, 4);
  blob.writeUInt32BE(keyLength, 4 + type.length);
  return `${algorithm} ${blob.toString('base64')} FreelandQA read-only source checkout\n`;
}

function expectedResult(paths) {
  return {
    schemaVersion: 1,
    status: 'AWAITING_ADMIN',
    repository: 'nuanu-ai/freeland_app',
    title: 'FreelandQA read-only source checkout',
    fingerprint: fixtureFingerprint,
    handoffPath: paths.handoff,
  };
}

async function writeValidAwaiting(paths) {
  await fs.writeFile(paths.privateKey, fixturePrivate, { mode: 0o600 });
  await fs.writeFile(paths.publicKey, fixturePublic, { mode: 0o600 });
  await fs.writeFile(paths.handoff, [
    'repository=nuanu-ai/freeland_app',
    'title=FreelandQA read-only source checkout',
    'allowWrite=false',
    `fingerprint=${fixtureFingerprint}`,
    `publicKey=${fixturePublic.trim()}`,
    '',
  ].join('\n'), { mode: 0o600 });
  await fs.chmod(paths.privateKey, 0o600);
  await fs.chmod(paths.publicKey, 0o600);
  await fs.chmod(paths.handoff, 0o600);
}

async function snapshot(paths) {
  const names = ['privateKey', 'publicKey', 'handoff'];
  return Object.fromEntries(await Promise.all(names.map(async (name) => [name, {
    digest: createHash('sha256').update(await fs.readFile(paths[name])).digest('hex'),
    stat: statMetadata(await fs.lstat(paths[name])),
  }])));
}

function statMetadata(stat) {
  return {
    mode: stat.mode,
    nlink: stat.nlink,
    uid: stat.uid,
    gid: stat.gid,
    size: stat.size,
    ino: stat.ino,
    mtimeMs: stat.mtimeMs,
  };
}

async function writePlaceholder(path) {
  await fs.writeFile(path, 'placeholder', { mode: 0o600 });
}

describe('prepareSourceAccess', () => {
  test('builds the fixed custody paths below the supplied root', () => {
    assert.deepEqual(buildPaths('/tmp/freelandqa-fixture'), {
      baseDir: '/tmp/freelandqa-fixture',
      privateKey: '/tmp/freelandqa-fixture/freeland_app_readonly_ed25519',
      publicKey: '/tmp/freelandqa-fixture/freeland_app_readonly_ed25519.pub',
      handoff: '/tmp/freelandqa-fixture/freeland_app_readonly_admin_handoff.txt',
      attestation: '/tmp/freelandqa-fixture/freeland_app_readonly_attestation.json',
    });
  });

  test('promotes an absent fixture to the closed administrator handoff state', async () => {
    const fixture = await makeFixture();
    const calls = [];
    try {
      const result = await prepareSourceAccess({ baseDir: fixture.baseDir, runner: fakeRunner({ calls }) });
      assert.deepEqual(result, expectedResult(fixture.paths));
      assert.equal(calls.length, 1);
      assert.equal(calls[0].command, 'ssh-keygen');
      assert.equal(calls[0].shell, false);
      assert.deepEqual(calls[0].args.slice(0, -1), [
        '-q', '-t', 'ed25519', '-N', '', '-C', 'FreelandQA read-only source checkout', '-f',
      ]);
      assert.equal(basename(calls[0].args.at(-1)), 'freeland_app_readonly_ed25519');
      for (const file of [fixture.paths.privateKey, fixture.paths.publicKey, fixture.paths.handoff]) {
        const stat = await fs.lstat(file);
        assert.equal(stat.isFile(), true);
        assert.equal(stat.nlink, 1);
        assert.equal(stat.mode & 0o777, 0o600);
      }
      const handoff = await fs.readFile(fixture.paths.handoff, 'utf8');
      assert.deepEqual(handoff.split('\n'), [
        'repository=nuanu-ai/freeland_app',
        'title=FreelandQA read-only source checkout',
        'allowWrite=false',
        `fingerprint=${fixtureFingerprint}`,
        `publicKey=${fixturePublic.trim()}`,
        '',
      ]);
      const privatePayloadCanary = fixturePrivate.toString('utf8').split('\n')[1];
      assert.equal(handoff.includes(privatePayloadCanary), false);
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('rejects every non-empty partial subset without running a key generator', async () => {
    const names = ['privateKey', 'publicKey', 'handoff', 'attestation'];
    for (let bits = 1; bits < 16; bits += 1) {
      if (bits === 7) continue;
      const fixture = await makeFixture();
      let calls = 0;
      try {
        for (let index = 0; index < names.length; index += 1) {
          if (bits & (1 << index)) await writePlaceholder(fixture.paths[names[index]]);
        }
        await assert.rejects(
          prepareSourceAccess({ baseDir: fixture.baseDir, runner: async () => { calls += 1; } }),
          { message: 'SOURCE_ACCESS_PARTIAL_STATE' },
        );
        assert.equal(calls, 0, `subset ${bits} must not call runner`);
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('replays an exact awaiting state byte-for-byte without running a key generator', async () => {
    const fixture = await makeFixture();
    try {
      await writeValidAwaiting(fixture.paths);
      const before = await snapshot(fixture.paths);
      let calls = 0;
      const result = await prepareSourceAccess({ baseDir: fixture.baseDir, runner: async () => { calls += 1; } });
      const after = await snapshot(fixture.paths);
      assert.deepEqual(result, expectedResult(fixture.paths));
      assert.equal(calls, 0);
      assert.deepEqual(after, before);
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('replays exact awaiting custody without requiring a generator runner', async () => {
    const fixture = await makeFixture();
    try {
      await writeValidAwaiting(fixture.paths);
      assert.deepEqual(await prepareSourceAccess({ baseDir: fixture.baseDir }), expectedResult(fixture.paths));
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('rejects unsafe existing custody entries before running a key generator', async () => {
    for (const scenario of ['symlink-directory', 'symlink-file', 'hard-link', 'wrong-mode', 'non-regular', 'wrong-uid']) {
      const fixture = await makeFixture();
      let calls = 0;
      try {
        if (scenario === 'symlink-directory') {
          const target = await fs.mkdtemp(join(tmpdir(), 'freeland-source-access-target-'));
          await fs.rm(fixture.baseDir, { recursive: true, force: true });
          await fs.symlink(target, fixture.baseDir);
        } else {
          await writeValidAwaiting(fixture.paths);
          if (scenario === 'symlink-file') {
            await fs.rm(fixture.paths.handoff);
            await fs.symlink(fixture.paths.publicKey, fixture.paths.handoff);
          }
          if (scenario === 'hard-link') {
            await fs.rm(fixture.paths.handoff);
            await fs.link(fixture.paths.publicKey, fixture.paths.handoff);
          }
          if (scenario === 'wrong-mode') await fs.chmod(fixture.paths.publicKey, 0o644);
          if (scenario === 'non-regular') {
            await fs.rm(fixture.paths.handoff);
            await fs.mkdir(fixture.paths.handoff);
          }
          if (scenario === 'wrong-uid') {
          await assert.rejects(
            prepareSourceAccess({ baseDir: fixture.baseDir, expectedUid: Number.MAX_SAFE_INTEGER, runner: async () => { calls += 1; } }),
              { message: /SOURCE_ACCESS_(DIRECTORY|CUSTODY)_INVALID/ },
            );
            assert.equal(calls, 0);
            continue;
          }
        }
        await assert.rejects(
          prepareSourceAccess({ baseDir: fixture.baseDir, runner: async () => { calls += 1; } }),
          { message: /SOURCE_ACCESS_(DIRECTORY|CUSTODY)_INVALID/ },
        );
        assert.equal(calls, 0);
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('rejects failing or unexpected generator outcomes and generated key material', async () => {
    for (const behavior of ['timeout', 'overflow', 'signal', 'exit', 'wrong-executable', 'throw', 'malformed', 'mismatch', 'seed-corruption', 'non-ed25519', '384-bit', '512-bit']) {
      const fixture = await makeFixture();
      try {
        await assert.rejects(
          prepareSourceAccess({ baseDir: fixture.baseDir, runner: fakeRunner({ behavior }) }),
          { message: /SOURCE_ACCESS_(RUNNER|KEY)_/ },
          behavior,
        );
        for (const path of [fixture.paths.privateKey, fixture.paths.publicKey, fixture.paths.handoff]) {
          await assert.rejects(fs.lstat(path), { code: 'ENOENT' });
        }
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('rejects an awaiting handoff with a malformed fingerprint or extra field', async () => {
    for (const replacement of ['fingerprint=SHA256:invalid', 'unexpected=true']) {
      const fixture = await makeFixture();
      try {
        await writeValidAwaiting(fixture.paths);
        const handoff = await fs.readFile(fixture.paths.handoff, 'utf8');
        await fs.writeFile(fixture.paths.handoff, handoff.replace(`fingerprint=${fixtureFingerprint}`, replacement), { mode: 0o600 });
        await fs.chmod(fixture.paths.handoff, 0o600);
        await assert.rejects(
          prepareSourceAccess({ baseDir: fixture.baseDir }),
          { message: 'SOURCE_ACCESS_HANDOFF_INVALID' },
        );
      } finally {
        await cleanFixture(fixture);
      }
    }
  });

  test('fails closed when a destination appears before promotion and preserves a partial promotion for review', async () => {
    const collision = await makeFixture();
    try {
      await assert.rejects(prepareSourceAccess({
        baseDir: collision.baseDir,
        runner: fakeRunner(),
        hooks: { beforePromote: async ({ paths, index }) => { if (index === 0) await writePlaceholder(paths.privateKey); } },
      }), { message: 'SOURCE_ACCESS_DESTINATION_COLLISION' });
      await assert.rejects(fs.lstat(collision.paths.publicKey), { code: 'ENOENT' });
      await assert.rejects(fs.lstat(collision.paths.handoff), { code: 'ENOENT' });
    } finally {
      await cleanFixture(collision);
    }

    const partial = await makeFixture();
    try {
      await assert.rejects(prepareSourceAccess({
        baseDir: partial.baseDir,
        runner: fakeRunner(),
        hooks: { beforePromote: async ({ paths, index }) => { if (index === 1) await writePlaceholder(paths.publicKey); } },
      }), { message: 'SOURCE_ACCESS_DESTINATION_COLLISION' });
      assert.equal((await fs.lstat(partial.paths.privateKey)).isFile(), true);
      assert.equal((await fs.lstat(partial.paths.publicKey)).isFile(), true);
      await assert.rejects(fs.lstat(partial.paths.handoff), { code: 'ENOENT' });
    } finally {
      await cleanFixture(partial);
    }
  });

  test('never overwrites a destination created after the preflight check', async () => {
    const fixture = await makeFixture();
    try {
      await assert.rejects(prepareSourceAccess({
        baseDir: fixture.baseDir,
        runner: fakeRunner(),
        hooks: {
          afterDestinationCheck: async ({ paths, index }) => {
            if (index === 0) await writePlaceholder(paths.privateKey);
          },
        },
      }), { message: 'SOURCE_ACCESS_DESTINATION_COLLISION' });
      assert.deepEqual(await fs.readFile(fixture.paths.privateKey, 'utf8'), 'placeholder');
      await assert.rejects(fs.lstat(fixture.paths.publicKey), { code: 'ENOENT' });
      await assert.rejects(fs.lstat(fixture.paths.handoff), { code: 'ENOENT' });
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('preserves post-link pre-unlink ambiguity for review', async () => {
    const fixture = await makeFixture();
    try {
      await assert.rejects(prepareSourceAccess({
        baseDir: fixture.baseDir,
        runner: fakeRunner(),
        hooks: {
          afterLinkBeforeUnlink: async ({ index }) => {
            if (index === 0) throw new Error('test interruption');
          },
        },
      }), { message: 'SOURCE_ACCESS_PREPARE_FAILED' });
      const promoted = await fs.lstat(fixture.paths.privateKey);
      assert.equal(promoted.isFile(), true);
      assert.equal(promoted.nlink, 2);
      const entries = await fs.readdir(fixture.baseDir);
      assert.equal(entries.some((entry) => entry.startsWith('.prepare-')), true);
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('preserves a swapped temporary directory rather than recursively cleaning it', async () => {
    const fixture = await makeFixture();
    const outside = await fs.mkdtemp(join(tmpdir(), 'freeland-source-access-outside-'));
    let swappedPath;
    try {
      await fs.writeFile(join(outside, 'sentinel'), 'preserve');
      await assert.rejects(prepareSourceAccess({
        baseDir: fixture.baseDir,
        runner: fakeRunner({ behavior: 'exit' }),
        hooks: {
          beforeTemporaryCleanup: async ({ temporaryDir }) => {
            swappedPath = temporaryDir;
            await fs.rm(temporaryDir, { recursive: true, force: true });
            await fs.symlink(outside, temporaryDir);
          },
        },
      }), { message: 'SOURCE_ACCESS_DIRECTORY_INVALID' });
      assert.equal((await fs.lstat(swappedPath)).isSymbolicLink(), true);
      assert.equal(await fs.readFile(join(outside, 'sentinel'), 'utf8'), 'preserve');
    } finally {
      await cleanFixture(fixture);
      await fs.rm(outside, { recursive: true, force: true });
    }
  });

  test('preserves an identity-swapped owned temporary directory rather than removing its contents', async () => {
    const fixture = await makeFixture();
    let swappedPath;
    try {
      await assert.rejects(prepareSourceAccess({
        baseDir: fixture.baseDir,
        runner: fakeRunner({ behavior: 'exit' }),
        hooks: {
          beforeTemporaryCleanup: async ({ temporaryDir }) => {
            swappedPath = temporaryDir;
            await fs.rm(temporaryDir, { recursive: true, force: true });
            await fs.mkdir(temporaryDir, { mode: 0o700 });
            await fs.chmod(temporaryDir, 0o700);
            await fs.writeFile(join(temporaryDir, 'sentinel'), 'preserve');
          },
        },
      }), { message: 'SOURCE_ACCESS_TEMPORARY_DIRECTORY_INVALID' });
      assert.equal(await fs.readFile(join(swappedPath, 'sentinel'), 'utf8'), 'preserve');
    } finally {
      await cleanFixture(fixture);
    }
  });

  test('uses real ssh-keygen only inside a test temporary directory', { skip: !sshKeygenAvailable && 'ssh-keygen is unavailable locally' }, async () => {
    const fixture = await makeFixture();
    try {
      const runner = async ({ command, args }) => {
        assert.equal(command, 'ssh-keygen');
        await execFile(command, args);
        return { code: 0, signal: null };
      };
      const result = await prepareSourceAccess({ baseDir: fixture.baseDir, runner });
      assert.equal(result.fingerprint, fingerprintOf(await fs.readFile(fixture.paths.publicKey, 'utf8')));
      assert.match(await fs.readFile(fixture.paths.publicKey, 'utf8'), /^ssh-ed25519 /);
      for (const path of [fixture.paths.privateKey, fixture.paths.publicKey, fixture.paths.handoff]) {
        assert.equal((await fs.lstat(path)).mode & 0o777, 0o600);
      }
    } finally {
      await cleanFixture(fixture);
    }
  });
});
