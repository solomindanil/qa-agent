import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, realpath, readdir, lstat, readlink, symlink, rename, copyFile, chmod, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../tools/workspace.mjs', import.meta.url));
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
const env = { ...cleanEnv, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_AUTHOR_NAME: 'Synthetic Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'Synthetic Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' };
const git = (cwd, ...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', ...args],
  { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function fixture() {
  // Each case owns fresh synthetic state; leave it available for failure inspection.
  const base = await realpath(await mkdtemp(join(tmpdir(), 'qa-source-workspace-')));
  const donor = join(base, 'donor');
  const root = join(base, 'root');
  await mkdir(donor); await mkdir(root);
  git(donor, 'init', '--template='); git(root, 'init', '--template=');
  await writeFile(join(donor, 'example.txt'), 'synthetic source\n');
  await writeFile(join(donor, 'executable.sh'), '#!/bin/sh\nexit 0\n');
  await chmod(join(donor, 'executable.sh'), 0o755);
  await symlink('example.txt', join(donor, 'example-link'));
  git(donor, 'add', '.'); git(donor, 'commit', '-m', 'Synthetic fixture');
  const commit = git(donor, 'rev-parse', 'HEAD').trim();
  const tree = git(donor, 'rev-parse', 'HEAD^{tree}').trim();
  await mkdir(join(root, 'sources'));
  const bundle = join(root, 'sources', 'example.bundle');
  git(donor, 'bundle', 'create', bundle, 'HEAD');
  const component = { id: 'example', path: 'components/example', commit, tree,
    bundle: 'sources/example.bundle', sha256: digest(await readFile(bundle)),
    runtimeAuthority: false, qualification: 'Synthetic source only' };
  const manifest = { schemaVersion: 1, components: [component] };
  const save = () => writeFile(join(root, 'sources', 'manifest.v1.json'), JSON.stringify(manifest));
  await save();
  return { base, root, donor, bundle, commit, tree, manifest, component, save, child: join(root, 'components', 'example') };
}
function run(f, mode = 'restore', extra = {}) {
  return spawnSync(process.execPath, [cli, mode, '--root', f.root], { encoding: 'utf8', env, ...extra });
}
async function snapshot(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) return { link: await readlink(path) };
  if (!stat.isDirectory()) return { hash: digest(await readFile(path)), mode: stat.mode };
  const result = {};
  for (const name of (await readdir(path)).sort()) result[name] = await snapshot(join(path, name));
  return result;
}
async function refusesUnchanged(f, code, mode = 'restore', extra = {}) {
  const before = await snapshot(f.root);
  const result = run(f, mode, extra);
  assert.notEqual(result.status, 0, result.stdout);
  assert.equal(JSON.parse(result.stderr).code, code, result.stderr);
  assert.deepEqual(await snapshot(f.root), before, 'Refusal must retain pre-existing bytes and paths');
}
function succeeds(f, mode = 'restore', extra = {}) {
  const result = run(f, mode, extra);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'sources_verified');
}

test('cold restore materializes the exact independent source and returns a source-only summary', async () => {
  const f = await fixture();
  const result = run(f);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { status: 'sources_verified', components: [{
    id: 'example', commit: f.commit, tree: f.tree, path: 'components/example', runtimeAuthority: false,
  }] });
  assert.equal(git(f.child, 'rev-parse', 'HEAD').trim(), f.commit);
  assert.equal(git(f.child, 'rev-parse', 'HEAD^{tree}').trim(), f.tree);
  assert.equal(await readFile(join(f.child, 'example.txt'), 'utf8'), 'synthetic source\n');
  assert.equal((await lstat(join(f.child, 'example.txt'))).mode & 0o111, 0);
  assert.equal(await readFile(join(f.child, 'executable.sh'), 'utf8'), '#!/bin/sh\nexit 0\n');
  assert.equal((await lstat(join(f.child, 'executable.sh'))).mode & 0o111, 0o111);
  assert.equal((await lstat(join(f.child, 'example-link'))).isSymbolicLink(), true);
  assert.equal(await readlink(join(f.child, 'example-link')), 'example.txt');
  assert.equal(git(f.child, 'rev-parse', '--absolute-git-dir').trim(), resolve(f.child, '.git'));
  assert.equal(spawnSync('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: f.child, env }).status, 1);
});

test('repeat restore and verify preserve existing matching bytes and an attached HEAD', async () => {
  const f = await fixture(); succeeds(f);
  git(f.child, 'switch', '-c', 'keep-attached');
  const before = await snapshot(f.root);
  succeeds(f); succeeds(f, 'verify');
  assert.deepEqual(await snapshot(f.root), before);
  assert.equal(git(f.child, 'symbolic-ref', '--short', 'HEAD').trim(), 'keep-attached');
});

test('verify reads tracked bytes when allowed stat settings leave same-size tampering clean', async () => {
  const f = await fixture(); succeeds(f);
  const path = join(f.child, 'example.txt');
  git(f.child, 'config', 'core.trustctime', 'false');
  git(f.child, 'config', 'core.checkStat', 'minimal');
  await utimes(path, 1_600_000_000, 1_600_000_000);
  git(f.child, 'update-index', '--refresh');
  const before = await lstat(path);
  const tampered = 'tampered source!\n';
  assert.equal(Buffer.byteLength(tampered), before.size);
  await writeFile(path, tampered);
  await utimes(path, before.atime, before.mtime);
  const after = await lstat(path);
  assert.equal(after.size, before.size);
  assert.equal(Math.trunc(after.mtimeMs), Math.trunc(before.mtimeMs));
  assert.equal(git(f.child, 'status', '--porcelain=v1'), '');
  await refusesUnchanged(f, 'SOURCE_DIRTY', 'verify');
});

test('verify compares tracked executable mode independently from matching bytes', async () => {
  const f = await fixture(); succeeds(f);
  const path = join(f.child, 'example.txt');
  const bytes = await readFile(path);
  git(f.child, 'config', 'core.filemode', 'false');
  await chmod(path, 0o755);
  assert.deepEqual(await readFile(path), bytes);
  assert.equal(git(f.child, 'status', '--porcelain=v1'), '');
  await refusesUnchanged(f, 'SOURCE_DIRTY', 'verify');
});

for (const [name, file, pinnedMode, workingMode, accepted] of [
  ['rejects missing owner execute for a pinned executable', 'executable.sh', '100755', 0o655, false],
  ['accepts group and other execute for a pinned nonexecutable', 'example.txt', '100644', 0o655, true],
  ['accepts owner-only execute for a pinned executable', 'executable.sh', '100755', 0o744, true],
]) {
  test(`verify uses Git owner-execute semantics: ${name}`, async () => {
    const f = await fixture(); succeeds(f);
    const path = join(f.child, file);
    const bytes = await readFile(path);
    assert.equal(git(f.child, 'ls-tree', 'HEAD', '--', file).split(' ', 1)[0], pinnedMode);
    git(f.child, 'config', 'core.filemode', 'false');
    await chmod(path, workingMode);
    assert.equal((await lstat(path)).mode & 0o777, workingMode);
    assert.deepEqual(await readFile(path), bytes);
    assert.equal(git(f.child, 'status', '--porcelain=v1'), '');
    assert.equal(git(f.child, '-c', 'core.filemode=true', 'diff', '--summary', '--', file).trim(),
      accepted ? '' : 'mode change 100755 => 100644 executable.sh');
    if (accepted) {
      const before = await snapshot(f.root);
      succeeds(f, 'verify');
      assert.deepEqual(await snapshot(f.root), before);
    } else {
      await refusesUnchanged(f, 'SOURCE_DIRTY', 'verify');
    }
  });
}

test('verify refuses a missing child without creating paths', async () => {
  const f = await fixture(); await refusesUnchanged(f, 'MISSING_CHILD', 'verify');
});

for (const [name, change, code] of [
  ['wrong bundle digest', f => { f.component.sha256 = '0'.repeat(64); }, 'BUNDLE_DIGEST'],
  ['missing bundle', f => { f.component.bundle = 'sources/missing.bundle'; }, 'MISSING_BUNDLE'],
  ['advertised wrong commit', f => { f.component.commit = '0'.repeat(40); }, 'BUNDLE_TIP'],
  ['path traversal', f => { f.component.path = 'components/../escape'; }, 'MANIFEST_INVALID'],
  ['absolute path', f => { f.component.path = '/components/example'; }, 'MANIFEST_INVALID'],
  ['backslash path', f => { f.component.path = 'components/example\\escape'; }, 'MANIFEST_INVALID'],
  ['empty path segment', f => { f.component.path = 'components//example'; }, 'MANIFEST_INVALID'],
  ['bundle traversal', f => { f.component.bundle = 'sources/../example.bundle'; }, 'MANIFEST_INVALID'],
  ['remote bundle URL', f => { f.component.bundle = 'https://example.invalid/source.bundle'; }, 'MANIFEST_INVALID'],
  ['duplicate IDs', f => { f.manifest.components.push({ ...f.component, path: 'components/second' }); }, 'MANIFEST_INVALID'],
  ['duplicate destinations', f => { f.manifest.components.push({ ...f.component, id: 'second' }); }, 'MANIFEST_INVALID'],
  ['nested destinations', f => { f.manifest.components.push({ ...f.component, id: 'second', path: 'components/example/nested' }); }, 'MANIFEST_INVALID'],
  ['invalid schema', f => { f.manifest.schemaVersion = 2; }, 'MANIFEST_INVALID'],
  ['empty qualification', f => { f.component.qualification = ' '; }, 'MANIFEST_INVALID'],
  ['nonboolean authority', f => { f.component.runtimeAuthority = 'true'; }, 'MANIFEST_INVALID'],
  ['uppercase commit', f => { f.component.commit = 'A'.repeat(40); }, 'MANIFEST_INVALID'],
]) {
  test(`preflight rejects ${name} before creating any child`, async () => {
    const f = await fixture(); change(f); await f.save();
    await refusesUnchanged(f, code);
  });
}

test('a bad second bundle prevents restoring the valid first missing child', async () => {
  const f = await fixture();
  f.manifest.components.push({ ...f.component, id: 'second', path: 'components/second', sha256: '0'.repeat(64) });
  await f.save(); await refusesUnchanged(f, 'BUNDLE_DIGEST');
});

test('wrong tree never returns success and leaves any new partial checkout visible', async () => {
  const f = await fixture(); f.component.tree = '0'.repeat(40); await f.save();
  const result = run(f);
  assert.notEqual(result.status, 0, result.stdout);
  assert.equal(JSON.parse(result.stderr).code, 'SOURCE_TREE');
  assert.equal(result.stdout, '');
  await refusesUnchanged(f, 'SOURCE_TREE', 'verify');
});

test('incremental bundle is rejected despite a matching tip and digest', async () => {
  const f = await fixture();
  await writeFile(join(f.donor, 'second.txt'), 'second synthetic file\n');
  git(f.donor, 'add', '.'); git(f.donor, 'commit', '-m', 'Second fixture');
  const incremental = join(f.root, 'sources', 'incremental.bundle');
  git(f.donor, 'bundle', 'create', incremental, 'HEAD', `^${f.commit}`);
  f.component.commit = git(f.donor, 'rev-parse', 'HEAD').trim();
  f.component.tree = git(f.donor, 'rev-parse', 'HEAD^{tree}').trim();
  f.component.bundle = 'sources/incremental.bundle';
  f.component.sha256 = digest(await readFile(incremental));
  await f.save(); await refusesUnchanged(f, 'BUNDLE_INCOMPLETE');
});

test('matching digest does not make invalid bundle bytes acceptable', async () => {
  const f = await fixture();
  await writeFile(f.bundle, '# v2 git bundle\n' + f.commit + ' HEAD\n\ninvalid pack');
  f.component.sha256 = digest(await readFile(f.bundle)); await f.save();
  const result = run(f);
  assert.notEqual(result.status, 0);
  assert.equal(typeof JSON.parse(result.stderr).code, 'string');
  assert.equal(JSON.parse(result.stdout || 'null'), null);
});

test('existing wrong revision is refused without checkout or repair', async () => {
  const f = await fixture(); succeeds(f);
  await writeFile(join(f.child, 'extra.txt'), 'owner changes\n');
  git(f.child, 'add', '.'); git(f.child, 'commit', '-m', 'Owner revision');
  await refusesUnchanged(f, 'SOURCE_HEAD');
});
for (const dirty of ['tracked', 'untracked']) {
  test(`existing ${dirty} dirt is preserved and refused`, async () => {
    const f = await fixture(); succeeds(f);
    await writeFile(join(f.child, dirty === 'tracked' ? 'example.txt' : 'owner.txt'), 'owner bytes\n');
    await refusesUnchanged(f, 'SOURCE_DIRTY');
    await refusesUnchanged(f, 'SOURCE_DIRTY', 'verify');
  });
}
for (const [name, flag] of [
  ['assume-unchanged', '--assume-unchanged'],
  ['skip-worktree', '--skip-worktree'],
]) {
  test(`tracked tamper hidden by ${name} is preserved and refused by restore and verify`, async () => {
    const f = await fixture(); succeeds(f);
    git(f.child, 'update-index', flag, 'example.txt');
    await writeFile(join(f.child, 'example.txt'), 'tampered bytes!!\n');
    await refusesUnchanged(f, 'SOURCE_DIRTY');
    await refusesUnchanged(f, 'SOURCE_DIRTY', 'verify');
  });
}
test('normal ignored files are permitted and preserved', async () => {
  const f = await fixture(); succeeds(f);
  await mkdir(join(f.child, '.git', 'info'));
  await writeFile(join(f.child, '.git', 'info', 'exclude'), 'ignored.txt\n');
  await writeFile(join(f.child, 'ignored.txt'), 'owner ignored bytes\n');
  const before = await snapshot(f.root); succeeds(f, 'verify');
  assert.deepEqual(await snapshot(f.root), before);
});

test('non-repository destination is retained', async () => {
  const f = await fixture(); await mkdir(f.child, { recursive: true });
  await writeFile(join(f.child, 'sentinel.txt'), 'never overwrite\n');
  await refusesUnchanged(f, 'GIT_STORAGE');
});
test('a conflicting second child prevents creating the first child', async () => {
  const f = await fixture();
  f.manifest.components.push({ ...f.component, id: 'second', path: 'components/second' });
  await f.save(); await mkdir(join(f.root, 'components', 'second'), { recursive: true });
  await writeFile(join(f.root, 'components', 'second', 'sentinel.txt'), 'owner content\n');
  await refusesUnchanged(f, 'GIT_STORAGE');
});

test('matching external-gitdir worktree is not accepted as independent', async () => {
  const f = await fixture(); await mkdir(join(f.root, 'components'));
  git(f.donor, 'worktree', 'add', '--detach', f.child, f.commit);
  assert.equal(git(f.child, 'rev-parse', 'HEAD').trim(), f.commit);
  await refusesUnchanged(f, 'GIT_STORAGE');
});
test('alternates are rejected even with matching HEAD and local objects', async () => {
  const f = await fixture(); succeeds(f);
  await writeFile(join(f.child, '.git', 'objects', 'info', 'alternates'), join(f.donor, '.git', 'objects') + '\n');
  await refusesUnchanged(f, 'GIT_STORAGE');
});

for (const location of ['bundle', 'child', 'intermediate', 'git-storage', 'manifest', 'root']) {
  test(`rejects a ${location} symlink without following it`, async () => {
    const f = await fixture();
    if (location === 'bundle') {
      await rename(f.bundle, join(f.base, 'outside.bundle'));
      await symlink(join(f.base, 'outside.bundle'), f.bundle);
    } else if (location === 'child') {
      await mkdir(join(f.root, 'components')); await symlink(f.donor, f.child);
    } else if (location === 'intermediate') {
      await symlink(f.base, join(f.root, 'components'));
    } else if (location === 'git-storage') {
      succeeds(f); await symlink(join(f.donor, '.git', 'objects'), join(f.child, '.git', 'objects', 'escape'));
    } else if (location === 'manifest') {
      await rename(join(f.root, 'sources', 'manifest.v1.json'), join(f.base, 'manifest.json'));
      await symlink(join(f.base, 'manifest.json'), join(f.root, 'sources', 'manifest.v1.json'));
    } else {
      await symlink(f.root, join(f.base, 'root-link')); f.root = join(f.base, 'root-link');
    }
    const donorBefore = await snapshot(f.donor);
    await refusesUnchanged(f, 'UNSAFE_PATH');
    assert.deepEqual(await snapshot(f.donor), donorBefore);
  });
}

test('a worktree pointer cannot serve as the assembly root', async () => {
  const f = await fixture();
  const pointerRoot = join(f.base, 'pointer-root');
  git(f.donor, 'worktree', 'add', '--detach', pointerRoot, f.commit);
  await refusesUnchanged({ ...f, root: pointerRoot }, 'GIT_STORAGE');
});

test('inherited Git overrides cannot redirect clone, objects, or verification', async () => {
  const f = await fixture();
  const before = await snapshot(f.donor);
  const hostile = { ...env, GIT_DIR: join(f.donor, '.git'), GIT_WORK_TREE: f.donor,
    GIT_OBJECT_DIRECTORY: join(f.donor, '.git', 'objects'), GIT_INDEX_FILE: join(f.donor, '.git', 'index'),
    GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'core.worktree', GIT_CONFIG_VALUE_0: f.donor };
  succeeds(f, 'restore', { env: hostile }); succeeds(f, 'verify', { env: hostile });
  assert.deepEqual(await snapshot(f.donor), before);
  assert.equal(await realpath(join(f.child, '.git', 'objects')), join(f.child, '.git', 'objects'));
});

test('restore works with the donor moved away and never runs scripts, hooks or global filters', async () => {
  const f = await fixture();
  const marker = join(f.base, 'unexpected-execution');
  const trap = join(f.base, 'trap.sh');
  await writeFile(trap, `#!/bin/sh\nprintf unexpected > '${marker}'\n`); await chmod(trap, 0o755);
  await writeFile(join(f.donor, 'package.json'), JSON.stringify({ scripts: { postinstall: trap, test: trap } }));
  await writeFile(join(f.donor, '.gitattributes'), 'example.txt filter=trap\n');
  git(f.donor, 'add', '.'); git(f.donor, 'commit', '-m', 'Passive script fixtures');
  f.component.commit = git(f.donor, 'rev-parse', 'HEAD').trim();
  f.component.tree = git(f.donor, 'rev-parse', 'HEAD^{tree}').trim();
  const nextBundle = join(f.root, 'sources', 'passive.bundle');
  git(f.donor, 'bundle', 'create', nextBundle, 'HEAD');
  f.component.bundle = 'sources/passive.bundle'; f.component.sha256 = digest(await readFile(nextBundle)); await f.save();
  const globalConfig = join(f.base, 'global.gitconfig');
  await writeFile(globalConfig, `[core]\n hooksPath = ${f.base}\n fsmonitor = ${trap}\n[filter "trap"]\n smudge = ${trap}\n clean = ${trap}\n required = true\n`);
  await copyFile(trap, join(f.base, 'post-checkout')); await chmod(join(f.base, 'post-checkout'), 0o755);
  await rename(f.donor, join(f.base, 'unavailable-donor'));
  succeeds(f, 'restore', { env: { ...env, GIT_CONFIG_GLOBAL: globalConfig } });
  assert.equal(await readFile(join(f.child, 'example.txt'), 'utf8'), 'synthetic source\n');
  await assert.rejects(lstat(marker), { code: 'ENOENT' });
  await assert.rejects(lstat(join(f.child, 'node_modules')), { code: 'ENOENT' });
});

test('existing local Git filters cannot execute during verification', async () => {
  const f = await fixture(); succeeds(f);
  git(f.child, 'config', 'filter.trap.clean', 'false');
  await refusesUnchanged(f, 'UNSAFE_GIT_CONFIG', 'verify');
});

test('unknown commands and flags and nonabsolute roots return JSON errors', async () => {
  const f = await fixture();
  for (const args of [[], ['run'], ['restore', '--force'], ['restore', '--root'],
    ['restore', '--root', f.root, '--extra'], ['restore', '--root', 'relative']]) {
    const result = spawnSync(process.execPath, [cli, ...args], { env, encoding: 'utf8', cwd: f.base });
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(result.stderr).code, 'INVALID_ARGUMENT');
  }
});

test('CLI default root is relative to its own entrypoint rather than caller cwd', async () => {
  const f = await fixture();
  await mkdir(join(f.root, 'tools', 'lib'), { recursive: true });
  await copyFile(cli, join(f.root, 'tools', 'workspace.mjs'));
  await copyFile(fileURLToPath(new URL('../tools/lib/source-workspace.mjs', import.meta.url)), join(f.root, 'tools', 'lib', 'source-workspace.mjs'));
  const result = spawnSync(process.execPath, [join(f.root, 'tools', 'workspace.mjs'), 'restore'],
    { env, encoding: 'utf8', cwd: f.base });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'sources_verified');
  assert.equal(await readFile(join(f.child, 'example.txt'), 'utf8'), 'synthetic source\n');
});

test('library exposes the same verified summary and coded failure contract', async () => {
  const f = await fixture();
  const { assembleWorkspace } = await import('../tools/lib/source-workspace.mjs');
  await assert.rejects(assembleWorkspace({ root: f.root, mode: 'verify' }), { code: 'MISSING_CHILD' });
  const result = await assembleWorkspace({ root: f.root, mode: 'restore' });
  assert.equal(result.status, 'sources_verified');
  await assert.rejects(assembleWorkspace({ root: f.root, mode: 'invalid' }), { code: 'INVALID_ARGUMENT' });
});

test('malformed manifest JSON is a coded manifest failure', async () => {
  const f = await fixture();
  await writeFile(join(f.root, 'sources', 'manifest.v1.json'), '{ invalid json');
  await refusesUnchanged(f, 'MANIFEST_INVALID');
  const { assembleWorkspace } = await import('../tools/lib/source-workspace.mjs');
  await assert.rejects(assembleWorkspace({ root: f.root, mode: 'verify' }), { code: 'MANIFEST_INVALID' });
});
