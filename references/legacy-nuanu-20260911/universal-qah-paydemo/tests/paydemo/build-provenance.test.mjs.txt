import assert from 'node:assert/strict';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const execFile = promisify(execFileCallback);
const testDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDirectory, '../..');

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-build-provenance-'));
  await mkdir(join(root, 'apps'), { recursive: true });
  await mkdir(join(root, 'scripts'), { recursive: true });
  await cp(join(repositoryRoot, 'apps/paydemo'), join(root, 'apps/paydemo'), { recursive: true });
  await cp(join(repositoryRoot, 'scripts/build-paydemo.mjs'), join(root, 'scripts/build-paydemo.mjs'));
  await writeFile(join(root, '.gitignore'), 'dist/\n');
  await execFile('git', ['init', '-q'], { cwd: root });
  await execFile('git', ['config', 'user.name', 'QA Harness Test'], { cwd: root });
  await execFile('git', ['config', 'user.email', 'qa-harness@example.invalid'], { cwd: root });
  await execFile('git', ['add', '.'], { cwd: root });
  await execFile('git', ['commit', '-q', '-m', 'exact fixture'], { cwd: root });
  const { stdout } = await execFile('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return { root, commit: stdout.trim() };
}

async function runBuild(root, variant = 'fixed-v2') {
  const child = spawn(process.execPath, ['scripts/build-paydemo.mjs'], {
    cwd: root,
    env: { ...process.env, PAYDEMO_VARIANT: variant },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const [exitCode] = await once(child, 'close');
  return { exitCode, stdout, stderr };
}

async function listRegularFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return listRegularFiles(absolute);
    assert.equal(entry.isFile(), true, `unexpected non-file in fixture: ${absolute}`);
    return [absolute];
  }));
  return nested.flat().sort();
}

async function canonicalTreeHash(root, files) {
  const hash = createHash('sha256');
  for (const file of [...files].sort()) {
    hash.update(file);
    hash.update('\0');
    hash.update(await readFile(join(root, file)));
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

test('clean build records exact source provenance and a deterministic hash of the distributed public tree', async () => {
  const fixture = await createFixture();
  try {
    const first = await runBuild(fixture.root, 'buggy-v1');
    assert.equal(first.exitCode, 0, first.stderr);
    const manifestPath = join(fixture.root, 'dist/paydemo/build-manifest.json');
    const firstManifestText = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(firstManifestText);

    assert.equal(manifest.commit, fixture.commit);
    assert.equal(manifest.variant, 'buggy-v1');
    assert.match(manifest.sourceHash, /^sha256:[a-f0-9]{64}$/);
    assert.match(manifest.contentHash, /^sha256:[a-f0-9]{64}$/);
    assert.notEqual(manifest.sourceHash, manifest.contentHash);
    assert.equal(manifest.sourceFiles.includes('apps/paydemo/server.mjs'), true);

    const publicRoot = join(fixture.root, 'dist/paydemo/public');
    const actualContentFiles = (await listRegularFiles(publicRoot))
      .map((file) => `public/${relative(publicRoot, file)}`)
      .sort();
    assert.deepEqual(manifest.contentFiles, actualContentFiles);
    assert.equal(
      manifest.contentHash,
      await canonicalTreeHash(join(fixture.root, 'dist/paydemo'), actualContentFiles),
    );
    assert.equal(
      manifest.sourceHash,
      await canonicalTreeHash(fixture.root, manifest.sourceFiles),
    );
    assert.match(
      await readFile(join(publicRoot, 'app.mjs'), 'utf8'),
      /^globalThis\.PAYDEMO_VARIANT = "buggy-v1";\n/,
    );

    const second = await runBuild(fixture.root, 'buggy-v1');
    assert.equal(second.exitCode, 0, second.stderr);
    assert.equal(await readFile(manifestPath, 'utf8'), firstManifestText);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('build rejects dirty tracked source instead of labeling changed bytes as HEAD', async () => {
  const fixture = await createFixture();
  try {
    const sourcePath = join(fixture.root, 'apps/paydemo/public/index.html');
    await writeFile(sourcePath, `${await readFile(sourcePath, 'utf8')}\n<!-- dirty -->\n`);
    const result = await runBuild(fixture.root);
    assert.notEqual(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /clean|dirty|provenance/i);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('build rejects untracked source bytes under PayDemo', async () => {
  const fixture = await createFixture();
  try {
    await writeFile(join(fixture.root, 'apps/paydemo/public/rogue.mjs'), 'throw new Error("rogue");\n');
    const result = await runBuild(fixture.root);
    assert.notEqual(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /clean|dirty|untracked|provenance/i);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test('build rejects a modified build recipe', async () => {
  const fixture = await createFixture();
  try {
    const recipe = join(fixture.root, 'scripts/build-paydemo.mjs');
    await writeFile(recipe, `${await readFile(recipe, 'utf8')}\n// dirty recipe\n`);
    const result = await runBuild(fixture.root);
    assert.notEqual(result.exitCode, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /clean|dirty|provenance/i);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});
