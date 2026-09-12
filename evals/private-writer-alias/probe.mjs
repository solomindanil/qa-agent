// Diagnostic: aliases of one physical target must not grant two commits from
// the same expected state. Run from a selected Kernel's own dependency context.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

assert.ok(process.argv[2] && path.isAbsolute(process.argv[2]), 'Pass one explicit absolute Kernel checkout');
const source = await realpath(process.argv[2]);
const { writePrivateFileAtomic } = await import(pathToFileURL(path.join(source, 'src/kernel/private-store.ts')));
const { nodeWorkspaceFileSystem } = await import(pathToFileURL(path.join(source, 'src/kernel/effects.ts')));
const { digestBytes } = await import(pathToFileURL(path.join(source, 'src/kernel/digest.ts')));
const root = await mkdtemp(path.join(await realpath(tmpdir()), 'qa-private-case-alias-'));
await mkdir(path.join(root, '.qa-private'), { mode: 0o700 });
await mkdir(path.join(root, '.qa-private/runs'), { mode: 0o700 });
const lower = path.join(root, '.qa-private/runs/state.json');
const upper = path.join(root, '.qa-private/runs/STATE.json');
const initial = Buffer.from('initial');
await writeFile(lower, initial, { flag: 'wx', mode: 0o600 });
const before = await lstat(lower);
const alias = await lstat(upper).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (alias === null || alias.ino !== before.ino || alias.dev !== before.dev) {
  console.log(JSON.stringify({ outcome: 'NOT_APPLICABLE_CASE_SENSITIVE_FILESYSTEM', root }));
  process.exitCode = 2;
} else {
  const expected = { state: 'digest', digest: digestBytes(initial) };
  function start(relativePath, value) {
    let markReady, release;
    const ready = new Promise(resolve => { markReady = resolve; });
    const barrier = new Promise(resolve => { release = resolve; });
    const settled = writePrivateFileAtomic(root, relativePath, Buffer.from(value), expected, {
      randomBytes,
      secretPolicy: { knownSecrets: [], fingerprintKey: Buffer.from('0123456789abcdef0123456789abcdef') },
      fileSystem: { ...nodeWorkspaceFileSystem, async rename(from, to) {
        markReady({ phase: 'before-rename' });
        await barrier;
        return nodeWorkspaceFileSystem.rename(from, to);
      } },
    }).then(receipt => ({ ok: true, receipt }), error => ({ ok: false, code: error.code, message: error.message }));
    return { ready: Promise.race([ready, settled]), settled, release };
  }
  let first, second;
  const timer = setTimeout(() => { first?.release(); second?.release(); }, 10000);
  try {
    first = start('.qa-private/runs/state.json', 'first');
    assert.equal((await first.ready).phase, 'before-rename');
    second = start('.qa-private/runs/STATE.json', 'second');
    const secondAdmission = await second.ready;
    first.release();
    const firstResult = await first.settled;
    const afterFirst = await readFile(lower, 'utf8');
    second.release();
    const secondResult = await second.settled;
    const final = await readFile(lower, 'utf8');
    const report = { source, root, samePhysicalTarget: true, initial: 'initial',
      secondAdmission, firstResult, afterFirst, secondResult, final };
    console.log(JSON.stringify(report, null, 2));
    await writeFile(path.join(root, 'REPORT.json'), JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
    assert.equal([firstResult, secondResult].filter(result => result.ok).length, 1,
      'two case aliases admitted successful writes from the same expected state');
  } finally {
    clearTimeout(timer);
    first?.release(); second?.release();
    await Promise.all([first?.settled, second?.settled]);
  }
}
