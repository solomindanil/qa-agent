import { readFile, mkdir, lstat, readdir, realpath, readlink, open } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, resolve, dirname, isAbsolute, parse } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

function fail(code, message) { throw Object.assign(new Error(message), { code }); }

function git(cwd, args) {
  // Do not inherit alternate object stores, injected config, worktrees, or hooks.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  Object.assign(env, { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0',
    GIT_NO_REPLACE_OBJECTS: '1', GIT_NO_LAZY_FETCH: '1' });
  try {
    return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false',
      '-c', 'core.attributesFile=/dev/null', '-c', 'protocol.allow=never',
      '-c', 'protocol.file.allow=always', '-c', 'gc.auto=0', ...args],
    { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    fail('GIT_COMMAND', `Git ${args[0]} failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}

async function statIfPresent(path) {
  try { return await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

// Check every existing segment, including ancestors of the caller-supplied root.
async function guardPath(path) {
  const parts = resolve(path).slice(parse(path).root.length).split('/');
  let current = parse(path).root;
  for (let index = 0; index < parts.length; index++) {
    current = join(current, parts[index]);
    const stat = await statIfPresent(current);
    if (!stat) return null;
    if (stat.isSymbolicLink()) fail('UNSAFE_PATH', `Symlink is not allowed: ${current}`);
    if (index < parts.length - 1 && !stat.isDirectory()) fail('UNSAFE_PATH', `Not a directory: ${current}`);
    if (index === parts.length - 1) return stat;
  }
}

async function guardGitStorage(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) fail('UNSAFE_PATH', `Symlink in Git storage: ${path}`);
  if (stat.isDirectory()) {
    for (const name of await readdir(path)) await guardGitStorage(join(path, name));
  } else if (!stat.isFile()) fail('GIT_STORAGE', `Non-file in Git storage: ${path}`);
}

async function verifyRepository(root) {
  const dotgit = join(root, '.git');
  const stat = await guardPath(dotgit);
  if (!stat?.isDirectory()) fail('GIT_STORAGE', `A normal local .git directory is required: ${root}`);
  await guardGitStorage(dotgit);
  for (const name of ['alternates', 'http-alternates']) {
    if (await statIfPresent(join(dotgit, 'objects', 'info', name))) fail('GIT_STORAGE', `Git alternates are forbidden: ${root}`);
  }
  // Read local config without includes before commands that could invoke filters.
  const config = git(root, ['config', '--file', join(dotgit, 'config'), '--no-includes', '--null', '--list']);
  for (const item of config.split('\0').filter(Boolean)) {
    const key = item.split('\n', 1)[0].toLowerCase();
    if (/^(include\.|includeif\.|filter\.)/.test(key) ||
        ['core.worktree', 'extensions.partialclone', 'extensions.worktreeconfig'].includes(key) ||
        /^remote\..*\.promisor$/.test(key)) {
      fail('UNSAFE_GIT_CONFIG', `Git configuration is outside the source-only boundary: ${key}`);
    }
  }
  const top = git(root, ['rev-parse', '--show-toplevel']).trim();
  const gitdir = git(root, ['rev-parse', '--absolute-git-dir']).trim();
  const common = git(root, ['rev-parse', '--path-format=absolute', '--git-common-dir']).trim();
  const objects = git(root, ['rev-parse', '--path-format=absolute', '--git-path', 'objects']).trim();
  if (top !== root || gitdir !== dotgit || common !== dotgit || objects !== join(dotgit, 'objects') ||
      git(root, ['rev-parse', '--is-bare-repository']).trim() !== 'false') {
    fail('GIT_STORAGE', `Git paths are not child-local: ${root}`);
  }
  for (const path of [root, dotgit, objects]) {
    if (await realpath(path) !== path) fail('GIT_STORAGE', `Git storage is not canonical: ${path}`);
  }
}

function relativePath(value, prefix) {
  return typeof value === 'string' && value.startsWith(`${prefix}/`) &&
    !/[\\\x00-\x1f\x7f]/.test(value) &&
    value.split('/').every(part => part && part !== '.' && part !== '..');
}

function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.components) || !manifest.components.length) {
    fail('MANIFEST_INVALID', 'Expected a nonempty schemaVersion 1 component inventory');
  }
  const ids = new Set(); const paths = [];
  for (const entry of manifest.components) {
    if (!entry || typeof entry.id !== 'string' || !entry.id.trim() || ids.has(entry.id) ||
        !relativePath(entry.path, 'components') || !relativePath(entry.bundle, 'sources') ||
        !/^[a-f0-9]{40}$/.test(entry.commit) || !/^[a-f0-9]{40}$/.test(entry.tree) ||
        !/^[a-f0-9]{64}$/.test(entry.sha256) || typeof entry.runtimeAuthority !== 'boolean' ||
        typeof entry.qualification !== 'string' || !entry.qualification.trim() ||
        paths.some(path => path === entry.path || path.startsWith(`${entry.path}/`) || entry.path.startsWith(`${path}/`))) {
      fail('MANIFEST_INVALID', 'Invalid, duplicate, or overlapping component entry');
    }
    ids.add(entry.id); paths.push(entry.path);
  }
}

async function verifyBundle(root, entry) {
  const path = join(root, entry.bundle);
  const bytes = await readFile(path);
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) fail('BUNDLE_DIGEST', `Bundle digest mismatch: ${entry.id}`);
  const end = bytes.indexOf('\n\n');
  if (end < 0) fail('BUNDLE_INVALID', `Missing Git bundle header: ${entry.id}`);
  const [signature, ...lines] = bytes.subarray(0, end).toString('utf8').split('\n');
  if (!['# v2 git bundle', '# v3 git bundle'].includes(signature)) fail('BUNDLE_INVALID', `Unsupported bundle format: ${entry.id}`);
  if (lines.some(line => line.startsWith('-') || line.startsWith('@filter='))) {
    fail('BUNDLE_INCOMPLETE', `Bundle requires external objects: ${entry.id}`);
  }
  const refs = lines.filter(line => !line.startsWith('@'));
  if (!refs.length || refs.some(line => !/^[a-f0-9]{40} .+$/.test(line) || line.slice(0, 40) !== entry.commit)) {
    fail('BUNDLE_TIP', `Bundle advertised tip differs from the inventory: ${entry.id}`);
  }
  git(root, ['bundle', 'verify', path]);
}

async function trackedBytes(path, mode, entry) {
  if (!(await guardPath(dirname(path)))?.isDirectory()) {
    fail('SOURCE_DIRTY', `Tracked path is missing in ${entry.id}`);
  }
  const stat = await statIfPresent(path);
  if (!stat) fail('SOURCE_DIRTY', `Tracked path is missing in ${entry.id}`);
  if (mode === '120000') {
    if (!stat.isSymbolicLink()) fail('SOURCE_DIRTY', `Tracked mode differs in ${entry.id}`);
    try { return await readlink(path, { encoding: 'buffer' }); }
    catch { fail('SOURCE_DIRTY', `Tracked symlink is unreadable in ${entry.id}`); }
  }
  if (!['100644', '100755'].includes(mode) || !stat.isFile() || stat.isSymbolicLink() ||
      Boolean(stat.mode & 0o100) !== (mode === '100755')) {
    fail('SOURCE_DIRTY', `Tracked mode differs in ${entry.id}`);
  }
  let handle;
  try {
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino ||
        Boolean(opened.mode & 0o100) !== (mode === '100755')) {
      fail('SOURCE_DIRTY', `Tracked mode differs in ${entry.id}`);
    }
    return await handle.readFile();
  } catch (error) {
    if (error.code === 'SOURCE_DIRTY') throw error;
    fail('SOURCE_DIRTY', `Tracked file is unreadable in ${entry.id}`);
  } finally {
    await handle?.close();
  }
}

async function verifyTrackedTree(child, entry) {
  const records = git(child, ['ls-tree', '-rz', '--full-tree', entry.tree]).split('\0').filter(Boolean);
  for (const record of records) {
    const separator = record.indexOf('\t');
    const match = /^(100644|100755|120000) blob ([a-f0-9]{40})$/.exec(record.slice(0, separator));
    const path = record.slice(separator + 1);
    if (separator < 0 || !match || !path || isAbsolute(path) ||
        path.split('/').some(part => !part || part === '.' || part === '..')) {
      fail('SOURCE_DIRTY', `Unsupported tracked entry in ${entry.id}`);
    }
    const bytes = await trackedBytes(join(child, path), match[1], entry);
    const object = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (object !== match[2]) fail('SOURCE_DIRTY', `Tracked bytes differ in ${entry.id}`);
  }
}

async function verifyChild(root, entry) {
  const child = join(root, entry.path);
  await verifyRepository(child);
  if (git(child, ['rev-parse', '--verify', 'HEAD']).trim() !== entry.commit) fail('SOURCE_HEAD', `HEAD mismatch: ${entry.id}`);
  if (git(child, ['rev-parse', '--verify', 'HEAD^{tree}']).trim() !== entry.tree) fail('SOURCE_TREE', `Tree mismatch: ${entry.id}`);
  const indexEntries = git(child, ['ls-files', '-v', '-z']).split('\0').filter(Boolean);
  if (indexEntries.some(record => record.startsWith('S ') || /^[a-z] /.test(record))) {
    fail('SOURCE_DIRTY', `Index flags can hide tracked changes in ${entry.id}`);
  }
  if (git(child, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignore-submodules=none']).length) {
    fail('SOURCE_DIRTY', `Tracked or untracked changes in ${entry.id}`);
  }
  await verifyTrackedTree(child, entry);
}

async function createParents(root, path) {
  // Recheck each parent at creation time; a destination itself is always claimed exclusively.
  let current = root;
  for (const part of path.split('/').slice(0, -1)) {
    current = join(current, part);
    if (!(await guardPath(current))) {
      try { await mkdir(current); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
    }
    if (!(await guardPath(current))?.isDirectory()) fail('UNSAFE_PATH', `Invalid destination parent: ${current}`);
  }
}

export async function assembleWorkspace({ root, mode }) {
  if (!['restore', 'verify'].includes(mode) || typeof root !== 'string' || !isAbsolute(root)) {
    fail('INVALID_ARGUMENT', 'Expected restore|verify and an absolute workspace root');
  }
  root = resolve(root);
  if (!(await guardPath(root))?.isDirectory()) fail('UNSAFE_PATH', 'Workspace root must be a canonical directory');
  await verifyRepository(root);
  const manifestPath = join(root, 'sources', 'manifest.v1.json');
  if (!(await guardPath(manifestPath))?.isFile()) fail('MANIFEST_INVALID', 'Missing regular sources/manifest.v1.json');
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch (error) {
    if (error instanceof SyntaxError) fail('MANIFEST_INVALID', 'Malformed sources/manifest.v1.json');
    throw error;
  }
  validateManifest(manifest);
  // Complete path, bundle, and existing-child preflight before creating any child.
  const missing = [];
  for (const entry of manifest.components) {
    await guardPath(join(root, entry.path));
    if (!(await guardPath(join(root, entry.bundle)))?.isFile()) fail('MISSING_BUNDLE', `Missing regular bundle: ${entry.id}`);
  }
  for (const entry of manifest.components) await verifyBundle(root, entry);
  for (const entry of manifest.components) {
    if (await statIfPresent(join(root, entry.path))) await verifyChild(root, entry);
    else missing.push(entry);
  }
  if (mode === 'verify' && missing.length) fail('MISSING_CHILD', `Missing component: ${missing[0].id}`);
  for (const entry of missing) {
    await createParents(root, entry.path);
    const child = join(root, entry.path);
    try { await mkdir(child); }
    catch (error) {
      if (error.code === 'EEXIST') fail('DESTINATION_CLAIMED', `Destination claimed by another writer: ${entry.id}`);
      throw error;
    }
    // On failure this explicitly claimed directory remains visible; never clean up owner state.
    git(root, ['clone', '--no-checkout', '--no-hardlinks', '--template=', '--', join(root, entry.bundle), child]);
    git(child, ['checkout', '--detach', entry.commit]);
  }
  for (const entry of manifest.components) await verifyChild(root, entry);
  const components = manifest.components.map(({ id, commit, tree, path, runtimeAuthority }) => ({ id, commit, tree, path, runtimeAuthority }));
  return { status: 'sources_verified', components };
}
