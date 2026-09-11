import assert from 'node:assert/strict';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { once } from 'node:events';
import { access, chmod, cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

import * as environmentModule from '../../scripts/paydemo-qah-environment.mjs';

const execFile = promisify(execFileCallback);
const testDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDirectory, '../..');
const cliPath = join(repositoryRoot, 'scripts/paydemo-qah-environment.mjs');
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

async function run(command, args, options = {}) {
  return execFile(command, args, {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
    ...options,
  });
}

async function runCli(args, options = {}) {
  const child = spawn(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? repositoryRoot,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const [exitCode, signal] = await once(child, 'close');
  return { exitCode, signal, stdout, stderr };
}

async function unusedPort() {
  const server = createNetServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;
  server.close();
  await once(server, 'close');
  assert.equal(typeof port, 'number');
  return port;
}

async function createGitRemote({ serverSource } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-environment-test-'));
  const source = join(root, 'source');
  const remote = join(root, 'remote.git');
  const remoteAlias = join(root, 'remote-alias.git');
  const stateRoot = join(root, 'state');
  await mkdir(join(source, 'apps/paydemo'), { recursive: true });
  await mkdir(join(source, 'scripts'), { recursive: true });
  await cp(join(repositoryRoot, 'apps/paydemo'), join(source, 'apps/paydemo'), { recursive: true });
  await cp(join(repositoryRoot, 'scripts/build-paydemo.mjs'), join(source, 'scripts/build-paydemo.mjs'));
  if (serverSource) await writeFile(join(source, 'apps/paydemo/server.mjs'), serverSource);
  await run('git', ['init', '-q'], { cwd: source });
  await run('git', ['config', 'user.name', 'QA Harness Test'], { cwd: source });
  await run('git', ['config', 'user.email', 'qa-harness@example.invalid'], { cwd: source });
  await run('git', ['add', 'apps', 'scripts'], { cwd: source });
  await run('git', ['commit', '-q', '-m', 'fixture'], { cwd: source });
  const { stdout } = await run('git', ['rev-parse', 'HEAD'], { cwd: source });
  const commit = stdout.trim();
  await run('git', ['clone', '-q', '--bare', source, remote]);
  await symlink(remote, remoteAlias, 'dir');
  return {
    root,
    source,
    remote,
    repoUrl: pathToFileURL(remoteAlias).href,
    canonicalRepoUrl: pathToFileURL(await realpath(remote)).href,
    stateRoot,
    commit,
  };
}

function prepareArgs(fixture, { environmentId = 'demo-env', port, commit = fixture.commit } = {}) {
  return [
    'prepare',
    '--repo-url', fixture.repoUrl,
    '--commit', commit,
    '--variant', 'buggy-v1',
    '--port', String(port),
    '--environment-id', environmentId,
    '--state-root', fixture.stateRoot,
    '--item-key', 'prepare_paydemo_environment',
  ];
}

function runFileRepoCli(args, options = {}) {
  return runCli(args, {
    ...options,
    env: {
      NUANU_QA_ALLOW_FILE_REPO: '1',
      ...options.env,
    },
  });
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

async function waitUntil(predicate, timeoutMs = 3_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
  }
  assert.fail('Condition was not met before timeout');
}

async function cleanupEnvironment(fixture, environmentId, pidFile) {
  return runCli([
    'cleanup',
    '--environment-id', environmentId,
    '--state-root', fixture.stateRoot,
    '--pid-file', pidFile,
    '--item-key', 'cleanup_paydemo_environment',
  ]);
}

test('prepare clones the exact commit, starts PayDemo, emits only the strict Nuanu envelope, and is idempotent', { timeout: 30_000 }, async () => {
  const fixture = await createGitRemote();
  const port = await unusedPort();
  const environmentId = 'exact-demo';
  let pidFile;
  try {
    const first = await runFileRepoCli(prepareArgs(fixture, { environmentId, port }));
    assert.equal(first.exitCode, 0, first.stderr);
    assert.equal(first.stdout.trim().startsWith('{'), true);
    const envelope = JSON.parse(first.stdout);
    pidFile = envelope.item?.data?.pid_file;
    assert.deepEqual(Object.keys(envelope).sort(), ['artifact_outputs', 'item']);
    assert.deepEqual(Object.keys(envelope.item).sort(), ['artifacts', 'data', 'description', 'key']);
    assert.equal(envelope.item.key, 'prepare_paydemo_environment');
    assert.deepEqual(envelope.item.artifacts, {});
    assert.deepEqual(envelope.artifact_outputs, {
      'item.artifacts.environment_manifest': null,
    });
    assert.deepEqual(Object.keys(envelope.item.data).sort(), [
      'base_url',
      'commit',
      'content_hash',
      'environment_id',
      'environment_status',
      'instance_nonce',
      'pid_file',
      'variant',
    ]);
    assert.equal(envelope.item.data.environment_status, 'READY');
    assert.equal(envelope.item.data.environment_id, environmentId);
    assert.match(envelope.item.data.instance_nonce, UUID_V4_PATTERN);
    assert.equal(envelope.item.data.base_url, `http://127.0.0.1:${port}`);
    assert.equal(envelope.item.data.variant, 'buggy-v1');
    assert.equal(envelope.item.data.commit, fixture.commit);
    assert.match(envelope.item.data.content_hash, /^sha256:[a-f0-9]{64}$/);
    const response = await fetch(`${envelope.item.data.base_url}/build-info`);
    assert.equal(response.status, 200);
    const buildInfo = await response.json();
    assert.equal(buildInfo.commit, fixture.commit);
    assert.equal(buildInfo.variant, 'buggy-v1');
    assert.equal(buildInfo.contentHash, envelope.item.data.content_hash);
    assert.equal(buildInfo.environmentId, environmentId);
    assert.equal(buildInfo.instanceNonce, envelope.item.data.instance_nonce);

    const stateFile = join(fixture.stateRoot, environmentId, 'environment.json');
    assert.equal(JSON.parse(await readFile(stateFile, 'utf8')).repo_url, fixture.canonicalRepoUrl);

    const checkout = join(fixture.stateRoot, environmentId, 'checkout');
    const { stdout: checkoutCommit } = await run('git', ['rev-parse', 'HEAD'], { cwd: checkout });
    assert.equal(checkoutCommit.trim(), fixture.commit);
    const { stdout: trackedDiff } = await run('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: checkout });
    assert.equal(trackedDiff, '');

    const firstPid = Number.parseInt((await readFile(pidFile, 'utf8')).trim(), 10);
    assert.equal(processExists(firstPid), true);
    const second = await runFileRepoCli(prepareArgs(fixture, { environmentId, port }));
    assert.equal(second.exitCode, 0, second.stderr);
    assert.deepEqual(JSON.parse(second.stdout), envelope);
    const secondPid = Number.parseInt((await readFile(pidFile, 'utf8')).trim(), 10);
    assert.equal(secondPid, firstPid);

    const originalStateText = await readFile(stateFile, 'utf8');
    const wrongInstanceState = JSON.parse(originalStateText);
    wrongInstanceState.instance_nonce = envelope.item.data.instance_nonce === '22222222-2222-4222-8222-222222222222'
      ? '33333333-3333-4333-8333-333333333333'
      : '22222222-2222-4222-8222-222222222222';
    await writeFile(stateFile, `${JSON.stringify(wrongInstanceState, null, 2)}\n`);
    const wrongInstance = await runFileRepoCli(prepareArgs(fixture, { environmentId, port }));
    assert.notEqual(wrongInstance.exitCode, 0);
    assert.equal(wrongInstance.stdout, '');
    assert.match(wrongInstance.stderr, /instance|identity|nonce/i);
    assert.equal(processExists(firstPid), true);
    await writeFile(stateFile, originalStateText);

    await writeFile(join(checkout, 'rogue-source.mjs'), 'throw new Error("must not be trusted");\n');
    const tampered = await runFileRepoCli(prepareArgs(fixture, { environmentId, port }));
    assert.notEqual(tampered.exitCode, 0);
    assert.equal(tampered.stdout, '');
    assert.match(tampered.stderr, /clean|untracked/i);
    assert.equal(processExists(firstPid), true);

    const cleaned = await cleanupEnvironment(fixture, environmentId, pidFile);
    assert.equal(cleaned.exitCode, 0, cleaned.stderr);
    const cleanupEnvelope = JSON.parse(cleaned.stdout);
    assert.equal(cleanupEnvelope.item.data.environment_status, 'STOPPED');
    await waitUntil(() => !processExists(firstPid));
    pidFile = undefined;
  } finally {
    if (pidFile) await cleanupEnvironment(fixture, environmentId, pidFile);
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('prepare rejects non-allowlisted Git protocols before creating state', async () => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-environment-protocol-'));
  try {
    for (const repoUrl of [
      'http://example.invalid/paydemo.git',
      'ssh://git@example.invalid/paydemo.git',
      'git@example.invalid:paydemo.git',
    ]) {
      const result = await runCli([
        'prepare',
        '--repo-url', repoUrl,
        '--commit', 'a'.repeat(40),
        '--variant', 'fixed-v2',
        '--port', '43123',
        '--environment-id', 'blocked-protocol',
        '--state-root', root,
      ]);
      assert.notEqual(result.exitCode, 0);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /trusted https:\/\/|file:\/\/.*test-only|repository URL/i);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('prepare rejects an arbitrary HTTPS repository before clone or environment directory creation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-environment-trust-'));
  const stateRoot = join(root, 'state');
  const fakeBin = join(root, 'bin');
  const gitMarker = join(root, 'git-invoked');
  try {
    await mkdir(fakeBin);
    const fakeGit = join(fakeBin, 'git');
    await writeFile(fakeGit, `#!${process.execPath}\nrequire('node:fs').writeFileSync(process.env.GIT_MARKER, process.argv.slice(2).join('\\n'));\nprocess.exit(71);\n`);
    await chmod(fakeGit, 0o755);
    const result = await runCli([
      'prepare',
      '--repo-url', 'https://github.com/attacker/arbitrary-code.git',
      '--commit', 'a'.repeat(40),
      '--variant', 'fixed-v2',
      '--port', '43123',
      '--environment-id', 'blocked-repository',
      '--state-root', stateRoot,
    ], { env: { PATH: fakeBin, GIT_MARKER: gitMarker } });
    assert.notEqual(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /trusted|allowlist|repository/i);
    await assert.rejects(access(gitMarker));
    await assert.rejects(access(join(stateRoot, 'blocked-repository')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('configured repository allowlist can narrow the production default before Git runs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-environment-narrow-'));
  const stateRoot = join(root, 'state');
  const fakeBin = join(root, 'bin');
  const gitMarker = join(root, 'git-invoked');
  try {
    await mkdir(fakeBin);
    const fakeGit = join(fakeBin, 'git');
    await writeFile(fakeGit, `#!${process.execPath}\nrequire('node:fs').writeFileSync(process.env.GIT_MARKER, 'invoked\\n');\nprocess.exit(71);\n`);
    await chmod(fakeGit, 0o755);
    const result = await runCli([
      'prepare',
      '--repo-url', 'https://github.com/solomindanil/NuanuFlowQA.git',
      '--commit', 'a'.repeat(40),
      '--variant', 'fixed-v2',
      '--port', '43123',
      '--environment-id', 'narrowed-default',
      '--state-root', stateRoot,
    ], {
      env: {
        PATH: fakeBin,
        GIT_MARKER: gitMarker,
        NUANU_QA_ALLOWED_REPOSITORIES: 'https://github.com/example/explicitly-trusted.git',
      },
    });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /trusted|allowlist|repository/i);
    await assert.rejects(access(gitMarker));
    await assert.rejects(access(join(stateRoot, 'narrowed-default')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('configured repository allowlist can explicitly add one exact trusted HTTPS repository', async () => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-environment-add-'));
  const stateRoot = join(root, 'state');
  const fakeBin = join(root, 'bin');
  const gitMarker = join(root, 'git-invoked');
  const trustedRepository = 'https://github.com/example/explicitly-trusted.git';
  try {
    await mkdir(fakeBin);
    const fakeGit = join(fakeBin, 'git');
    await writeFile(fakeGit, `#!${process.execPath}\nrequire('node:fs').writeFileSync(process.env.GIT_MARKER, process.argv.slice(2).join('\\n'));\nprocess.exit(71);\n`);
    await chmod(fakeGit, 0o755);
    const result = await runCli([
      'prepare',
      '--repo-url', trustedRepository,
      '--commit', 'a'.repeat(40),
      '--variant', 'fixed-v2',
      '--port', '43123',
      '--environment-id', 'explicitly-trusted',
      '--state-root', stateRoot,
    ], {
      env: {
        PATH: fakeBin,
        GIT_MARKER: gitMarker,
        NUANU_QA_ALLOWED_REPOSITORIES: trustedRepository,
      },
    });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /Git clone failed/i);
    assert.match(await readFile(gitMarker, 'utf8'), /^-c\nhttp\.followRedirects=false\nclone(?:\n|$)/);
    await assert.rejects(access(join(stateRoot, 'explicitly-trusted')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('file repository is rejected unless the explicit test-only gate is enabled', async () => {
  const fixture = await createGitRemote();
  let unexpectedPidFile;
  try {
    const result = await runCli(prepareArgs(fixture, {
      environmentId: 'file-disabled',
      port: 43124,
    }));
    if (result.exitCode === 0) {
      unexpectedPidFile = JSON.parse(result.stdout).item.data.pid_file;
      await cleanupEnvironment(fixture, 'file-disabled', unexpectedPidFile);
      unexpectedPidFile = undefined;
    }
    assert.notEqual(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /NUANU_QA_ALLOW_FILE_REPO|file.*disabled/i);
    await assert.rejects(access(join(fixture.stateRoot, 'file-disabled')));
  } finally {
    if (unexpectedPidFile) await cleanupEnvironment(fixture, 'file-disabled', unexpectedPidFile);
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('prepare rejects a commit other than the exact fetched commit', async () => {
  const fixture = await createGitRemote();
  const port = await unusedPort();
  try {
    const result = await runFileRepoCli(prepareArgs(fixture, {
      environmentId: 'wrong-commit',
      port,
      commit: 'f'.repeat(40),
    }));
    assert.notEqual(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /exact commit|fetch/i);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('cleanup refuses a forged PID file and leaves the foreign process alive', { timeout: 30_000 }, async () => {
  const fixture = await createGitRemote();
  const port = await unusedPort();
  const environmentId = 'pid-ownership';
  let pidFile;
  let originalPidText;
  const foreign = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
  });
  try {
    const prepared = await runFileRepoCli(prepareArgs(fixture, { environmentId, port }));
    assert.equal(prepared.exitCode, 0, prepared.stderr);
    const envelope = JSON.parse(prepared.stdout);
    pidFile = envelope.item.data.pid_file;
    originalPidText = await readFile(pidFile, 'utf8');
    await writeFile(pidFile, `${foreign.pid}\n`);

    const refused = await cleanupEnvironment(fixture, environmentId, pidFile);
    assert.notEqual(refused.exitCode, 0);
    assert.equal(refused.stdout, '');
    assert.match(refused.stderr, /ownership|PID/i);
    assert.equal(processExists(foreign.pid), true);

    await writeFile(pidFile, originalPidText);
    const cleaned = await cleanupEnvironment(fixture, environmentId, pidFile);
    assert.equal(cleaned.exitCode, 0, cleaned.stderr);
    pidFile = undefined;
  } finally {
    if (pidFile && originalPidText) {
      await writeFile(pidFile, originalPidText).catch(() => {});
      await cleanupEnvironment(fixture, environmentId, pidFile);
    }
    foreign.kill('SIGTERM');
    if (processExists(foreign.pid)) await once(foreign, 'close').catch(() => {});
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('prepare never kills a foreign listener occupying the requested port', { timeout: 20_000 }, async () => {
  const fixture = await createGitRemote();
  const port = await unusedPort();
  const foreign = spawn(process.execPath, [
    '-e',
    'require("node:http").createServer((_,r)=>r.end("foreign")).listen(Number(process.argv[1]),"127.0.0.1",()=>process.stdout.write("ready\\n"));',
    String(port),
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await once(foreign.stdout, 'data');
    const result = await runFileRepoCli(prepareArgs(fixture, { environmentId: 'port-owned-elsewhere', port }));
    assert.notEqual(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /port.*in use/i);
    assert.equal(processExists(foreign.pid), true);
    const response = await fetch(`http://127.0.0.1:${port}`);
    assert.equal(await response.text(), 'foreign');
  } finally {
    foreign.kill('SIGTERM');
    if (processExists(foreign.pid)) await once(foreign, 'close').catch(() => {});
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('the started product does not inherit unrelated worker secrets', { timeout: 30_000 }, async () => {
  const fixture = await createGitRemote({
    serverSource: `
      import { createServer } from 'node:http';
      import { readFileSync } from 'node:fs';
      const buildInfo = JSON.parse(readFileSync('dist/paydemo/build-manifest.json', 'utf8'));
      createServer((request, response) => {
        response.setHeader('content-type', 'application/json');
        if (request.url === '/build-info') {
          return response.end(JSON.stringify({
            app: buildInfo.app,
            variant: buildInfo.variant,
            commit: buildInfo.commit,
            contentHash: buildInfo.contentHash,
            environmentId: process.env.PAYDEMO_ENVIRONMENT_ID,
            instanceNonce: process.env.PAYDEMO_INSTANCE_NONCE,
          }));
        }
        if (request.url === '/env-check') {
          return response.end(JSON.stringify({ leaked: process.env.QAH_SHOULD_NOT_LEAK ?? null }));
        }
        response.statusCode = 404;
        return response.end('{}');
      }).listen(Number(process.env.PAYDEMO_PORT), '127.0.0.1');
    `,
  });
  const port = await unusedPort();
  const environmentId = 'secret-boundary';
  let pidFile;
  try {
    const prepared = await runFileRepoCli(prepareArgs(fixture, { environmentId, port }), {
      env: { QAH_SHOULD_NOT_LEAK: 'worker-secret-value' },
    });
    assert.equal(prepared.exitCode, 0, prepared.stderr);
    const envelope = JSON.parse(prepared.stdout);
    pidFile = envelope.item.data.pid_file;
    const response = await fetch(`${envelope.item.data.base_url}/env-check`);
    assert.deepEqual(await response.json(), { leaked: null });
  } finally {
    if (pidFile) await cleanupEnvironment(fixture, environmentId, pidFile);
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('build-info reader rejects redirects, unsafe media, oversized bodies, and extra fields before use', { timeout: 10_000 }, async () => {
  const safeBuildInfo = {
    app: 'PayDemo',
    variant: 'fixed-v2',
    commit: 'a'.repeat(40),
    contentHash: `sha256:${'c'.repeat(64)}`,
    environmentId: 'safe-environment',
    instanceNonce: '11111111-1111-4111-8111-111111111111',
  };
  let redirectTargetHits = 0;
  const server = createHttpServer((request, response) => {
    if (request.url === '/redirect/build-info') {
      response.writeHead(302, { location: '/redirect-target' });
      return response.end();
    }
    if (request.url === '/redirect-target') {
      redirectTargetHits += 1;
      response.setHeader('content-type', 'application/json');
      return response.end(JSON.stringify(safeBuildInfo));
    }
    if (request.url === '/wrong-type/build-info') {
      response.setHeader('content-type', 'text/html');
      return response.end(JSON.stringify(safeBuildInfo));
    }
    if (request.url === '/oversized/build-info') {
      response.setHeader('content-type', 'application/json');
      return response.end(`${JSON.stringify(safeBuildInfo)}${' '.repeat(33 * 1024)}`);
    }
    if (request.url === '/extra/build-info') {
      response.setHeader('content-type', 'application/json; charset=utf-8');
      return response.end(JSON.stringify({ ...safeBuildInfo, execute: 'arbitrary-code' }));
    }
    response.statusCode = 404;
    return response.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.equal(typeof address, 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    await assert.rejects(environmentModule.fetchBuildInfo(`${origin}/redirect`), /redirect|fetch|build-info/i);
    assert.equal(redirectTargetHits, 0);
    await assert.rejects(environmentModule.fetchBuildInfo(`${origin}/wrong-type`), /content-type|application\/json/i);
    await assert.rejects(environmentModule.fetchBuildInfo(`${origin}/oversized`), /32|large|size/i);
    await assert.rejects(environmentModule.fetchBuildInfo(`${origin}/extra`), /shape|field|key/i);
  } finally {
    server.close();
    await once(server, 'close');
  }
});
