import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtemp, mkdir, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const serverPath = resolve('apps/paydemo/server.mjs');

const canonicalHash = (entries) => {
  const hash = createHash('sha256');
  for (const [path, bytes] of [...entries].sort(([left], [right]) => left.localeCompare(right))) {
    hash.update(path);
    hash.update('\0');
    hash.update(bytes);
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
};

const runServerAgainstManifest = async ({
  manifestVariant,
  runtimeVariant,
  tamperSource = false,
  tamperServed = false,
  missingServed = false,
  environmentId = 'identity-test',
  instanceNonce = '11111111-1111-4111-8111-111111111111',
}) => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'paydemo-identity-'));
  try {
    await mkdir(join(fixtureRoot, 'dist/paydemo/public'), { recursive: true });
    await mkdir(join(fixtureRoot, 'apps/paydemo'), { recursive: true });
    const sourceFile = 'apps/paydemo/source.txt';
    const source = 'trusted-source\n';
    await writeFile(join(fixtureRoot, sourceFile), source);
    const contentEntries = [
      ['public/app.mjs', 'globalThis.PAYDEMO_VARIANT = "fixed-v2";\n'],
      ['public/index.html', '<!doctype html>\n'],
      ['public/styles.css', 'body {}\n'],
    ];
    for (const [file, bytes] of contentEntries) {
      await writeFile(join(fixtureRoot, 'dist/paydemo', file), bytes);
    }
    await writeFile(
      join(fixtureRoot, 'dist/paydemo/build-manifest.json'),
      `${JSON.stringify({
        app: 'PayDemo',
        variant: manifestVariant,
        commit: 'a'.repeat(40),
        sourceHash: canonicalHash([[sourceFile, source]]),
        sourceFiles: [sourceFile],
        contentHash: canonicalHash(contentEntries),
        contentFiles: contentEntries.map(([file]) => file),
      })}\n`,
    );
    if (tamperSource) await writeFile(join(fixtureRoot, sourceFile), 'tampered-source\n');
    if (tamperServed) await writeFile(join(fixtureRoot, 'dist/paydemo/public/app.mjs'), 'tampered-app\n');
    if (missingServed) await unlink(join(fixtureRoot, 'dist/paydemo/public/styles.css'));

    try {
      await execFileAsync(process.execPath, [serverPath], {
        cwd: fixtureRoot,
        env: {
          ...process.env,
          PAYDEMO_VARIANT: runtimeVariant,
          PAYDEMO_ENVIRONMENT_ID: environmentId,
          PAYDEMO_INSTANCE_NONCE: instanceNonce,
          // An invalid port proves which check ran first without opening a listener.
          PAYDEMO_PORT: 'not-a-port',
        },
      });
      assert.fail('PayDemo server unexpectedly started');
    } catch (error) {
      return {
        code: error.code,
        stderr: error.stderr ?? '',
      };
    }
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
};

test('server rejects a runtime variant that differs from the built artifact before listen', async () => {
  const result = await runServerAgainstManifest({
    manifestVariant: 'fixed-v2',
    runtimeVariant: 'buggy-v1',
  });

  assert.equal(result.code, 1);
  assert.match(
    result.stderr,
    /PayDemo build identity mismatch: runtime variant "buggy-v1" does not match manifest variant "fixed-v2"/,
  );
  assert.doesNotMatch(result.stderr, /ERR_SOCKET_BAD_PORT/);
});

test('matching runtime and build variants pass identity validation before listen', async () => {
  const result = await runServerAgainstManifest({
    manifestVariant: 'fixed-v2',
    runtimeVariant: 'fixed-v2',
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /ERR_SOCKET_BAD_PORT/);
  assert.doesNotMatch(result.stderr, /PayDemo build identity mismatch/);
});

test('server rejects source bytes that no longer match the build manifest before listen', async () => {
  const result = await runServerAgainstManifest({
    manifestVariant: 'fixed-v2',
    runtimeVariant: 'fixed-v2',
    tamperSource: true,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /PayDemo build identity mismatch: source content hash/);
  assert.doesNotMatch(result.stderr, /ERR_SOCKET_BAD_PORT/);
});

test('server rejects tampered distributed public bytes before listen', async () => {
  const result = await runServerAgainstManifest({
    manifestVariant: 'fixed-v2',
    runtimeVariant: 'fixed-v2',
    tamperServed: true,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /PayDemo build identity mismatch: distributed content hash/);
  assert.doesNotMatch(result.stderr, /ERR_SOCKET_BAD_PORT/);
});

test('server rejects a missing distributed public file before listen', async () => {
  const result = await runServerAgainstManifest({
    manifestVariant: 'fixed-v2',
    runtimeVariant: 'fixed-v2',
    missingServed: true,
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /PayDemo build identity mismatch: distributed file set/);
  assert.doesNotMatch(result.stderr, /ERR_SOCKET_BAD_PORT/);
});

test('server rejects malformed public environment identity before listen', async () => {
  const result = await runServerAgainstManifest({
    manifestVariant: 'fixed-v2',
    runtimeVariant: 'fixed-v2',
    environmentId: '../not-safe',
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /PayDemo runtime identity mismatch: environment id/);
  assert.doesNotMatch(result.stderr, /ERR_SOCKET_BAD_PORT/);
});

test('server rejects malformed public instance nonce before listen', async () => {
  const result = await runServerAgainstManifest({
    manifestVariant: 'fixed-v2',
    runtimeVariant: 'fixed-v2',
    instanceNonce: 'not-a-nonce',
  });

  assert.equal(result.code, 1);
  assert.match(result.stderr, /PayDemo runtime identity mismatch: instance nonce/);
  assert.doesNotMatch(result.stderr, /ERR_SOCKET_BAD_PORT/);
});

test('server keeps serving the exact attested bytes after a post-start filesystem mutation', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'paydemo-runtime-snapshot-'));
  const portProbe = createServer();
  await new Promise((resolvePromise, rejectPromise) => {
    portProbe.once('error', rejectPromise);
    portProbe.listen(0, '127.0.0.1', resolvePromise);
  });
  const address = portProbe.address();
  assert.equal(typeof address, 'object');
  const port = address.port;
  await new Promise((resolvePromise) => portProbe.close(resolvePromise));
  let child;
  try {
    await mkdir(join(fixtureRoot, 'dist/paydemo/public'), { recursive: true });
    await mkdir(join(fixtureRoot, 'apps/paydemo'), { recursive: true });
    const sourceFile = 'apps/paydemo/source.txt';
    const source = 'trusted-source\n';
    const originalApp = 'globalThis.PAYDEMO_VARIANT = "fixed-v2";\n';
    const contentEntries = [
      ['public/app.mjs', originalApp],
      ['public/index.html', '<!doctype html>\n'],
      ['public/styles.css', 'body {}\n'],
    ];
    await writeFile(join(fixtureRoot, sourceFile), source);
    for (const [file, bytes] of contentEntries) {
      await writeFile(join(fixtureRoot, 'dist/paydemo', file), bytes);
    }
    await writeFile(join(fixtureRoot, 'dist/paydemo/build-manifest.json'), `${JSON.stringify({
      app: 'PayDemo',
      variant: 'fixed-v2',
      commit: 'a'.repeat(40),
      sourceHash: canonicalHash([[sourceFile, source]]),
      sourceFiles: [sourceFile],
      contentHash: canonicalHash(contentEntries),
      contentFiles: contentEntries.map(([file]) => file),
    })}\n`);

    child = spawn(process.execPath, [serverPath], {
      cwd: fixtureRoot,
      env: {
        ...process.env,
        PAYDEMO_VARIANT: 'fixed-v2',
        PAYDEMO_ENVIRONMENT_ID: 'snapshot-test',
        PAYDEMO_INSTANCE_NONCE: '11111111-1111-4111-8111-111111111111',
        PAYDEMO_PORT: String(port),
      },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    const baseUrl = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + 5_000;
    while (true) {
      try {
        const response = await fetch(`${baseUrl}/build-info`, { redirect: 'error' });
        if (response.status === 200) {
          assert.deepEqual(Object.keys(await response.json()).sort(), [
            'app',
            'commit',
            'contentHash',
            'environmentId',
            'instanceNonce',
            'variant',
          ]);
          break;
        }
      } catch {
        if (Date.now() >= deadline) throw new Error('PayDemo server did not start in time');
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
      }
    }

    assert.equal(await (await fetch(`${baseUrl}/app.mjs`)).text(), originalApp);
    const resetResponse = await fetch(`${baseUrl}/api/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ runId: 'content-length-check' }),
    });
    const resetBytes = Buffer.from(await resetResponse.text());
    assert.equal(resetResponse.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(resetResponse.headers.get('content-length'), String(resetBytes.byteLength));
    await writeFile(join(fixtureRoot, 'dist/paydemo/public/app.mjs'), 'tampered-after-listen\n');
    assert.equal(await (await fetch(`${baseUrl}/app.mjs`)).text(), originalApp);
  } finally {
    if (child && child.exitCode === null) {
      child.kill('SIGTERM');
      await once(child, 'close');
    }
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
