import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
// @ts-expect-error Existing source fixture deliberately uses plain ESM.
import { recordsFixture, publishRecords, recordBytes } from '../../components/console/tests/fixtures/campaign-continuation-records.mjs';
// @ts-expect-error Actual versioned reader uses plain ESM.
import { readCampaignContinuation } from '../../components/console/server/campaign-continuation-reader.mjs';
import { acquireContinuationWriteAdmission } from '../../components/console/src/node/campaign-continuation-files.ts';

const worker = fileURLToPath(new URL('./publication-boundary-worker.mjs', import.meta.url));
const loader = fileURLToPath(new URL('../../components/console/node_modules/tsx/dist/loader.mjs', import.meta.url));
const failure = { kind: 'oracle_failure', oracle: { assertionId: 'status', failureCode: 'status',
  actual: '503', message: 'Expected HTTP 200' }, observations: { consoleErrors: [], failedRequests: [] } };

async function inventory(root: string): Promise<Record<string, { bytes: string; mode: number; mtimeMs: number }>> {
  const files: Record<string, { bytes: string; mode: number; mtimeMs: number }> = {};
  async function visit(relative = '') {
    for (const name of (await readdir(path.join(root, relative))).sort()) {
      const key = path.join(relative, name), absolute = path.join(root, key), stat = await lstat(absolute);
      assert.equal(stat.isSymbolicLink(), false);
      if (stat.isDirectory()) await visit(key);
      else { assert.ok(stat.isFile()); files[key] = { bytes: (await readFile(absolute)).toString('hex'),
        mode: stat.mode & 0o777, mtimeMs: stat.mtimeMs }; }
    }
  }
  await visit(); return files;
}

// Detects premature public visibility, loss of durable start/failure history,
// publication of partial accepted bytes, and auto-unlock after a writer death.
// These are semantic byte-publisher SIGKILL controls, not registered CLI replay.
for (const scenario of ['start_prepared', 'start_published', 'accepted_mid_prepare',
  'retry_before_start', 'retry_started'] as const) {
  test(`semantic publication SIGKILL: ${scenario}`, { timeout: 30_000 }, async t => {
    const records = recordsFixture();
    const isRetry = scenario.startsWith('retry_');
    let first;
    if (scenario === 'accepted_mid_prepare' || isRetry) {
      first = records.start('A');
      if (isRetry) records.complete(first, failure);
    }
    const tree = await publishRecords(records.input);
    const original = await inventory(tree.runPath);
    const start = scenario === 'accepted_mid_prepare' ? first : records.start('A', isRetry ? {
      attempt: 2, executionId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', startedAt: '2026-09-14T00:00:03.000Z',
    } : {});
    let relativePath = `tests/campaign-runs/${tree.runId}/${path.posix.dirname(start.path)}`;
    let files = [{ path: 'start.json', bytes: recordBytes(start.record).toString('base64'), mode: 0o400 }];
    if (scenario === 'accepted_mid_prepare') {
      const complete = records.complete(first);
      relativePath += '/accepted';
      files = records.input.artifacts.map((entry: { path: string; bytes: Buffer }) => ({
        path: path.posix.basename(entry.path), bytes: entry.bytes.toString('base64'), mode: 0o400,
      }));
      files.push({ path: 'complete.json', bytes: recordBytes(complete).toString('base64'), mode: 0o400 });
    } else await mkdir(path.dirname(path.join(tree.workspacePath, relativePath)), { recursive: true, mode: 0o700 });
    const configPath = path.join(tree.root, 'boundary.json');
    await writeFile(configPath, JSON.stringify({ ...tree, scenario, relativePath, files }), { mode: 0o600 });
    const child = fork(worker, [configPath], { execArgv: ['--import', loader],
      env: { TSX_DISABLE_CACHE: '1' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    let diagnostics = '', closed = false;
    child.stdout!.on('data', chunk => { diagnostics += chunk; });
    child.stderr!.on('data', chunk => { diagnostics += chunk; });
    const closedResult = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(resolve =>
      child.once('close', (code, signal) => { closed = true; resolve({ code, signal }); }));
    t.after(async () => { if (!closed) child.kill('SIGKILL'); await closedResult; });
    const message = once(child, 'message');
    const earlyClose = closedResult.then(() => { throw new Error(`Worker closed before boundary: ${diagnostics}`); });
    const [ready] = await Promise.race([message, earlyClose]);
    assert.deepEqual(ready, { boundary: scenario });
    const before = await readCampaignContinuation(tree);
    assert.equal(before.phase, 'partial'); assert.equal(before.receipt, null);
    const state = scenario === 'start_prepared' ? ['unstarted', 1]
      : scenario === 'retry_before_start' ? ['retry_pending', 2]
      : ['uncertain', isRetry ? 2 : 1];
    assert.deepEqual([before.progress.checks[0].state, before.progress.checks[0].nextAttempt], state);
    const publicBefore = await inventory(tree.runPath), privateBefore = await inventory(tree.storeRoot);
    if (scenario === 'accepted_mid_prepare') {
      assert.equal(Object.keys(privateBefore).length, 1);
      const partial = Object.entries(privateBefore)[0]!;
      assert.ok(partial[0].endsWith('/result.json'));
      assert.deepEqual(JSON.parse(Buffer.from(partial[1].bytes, 'hex').toString()),
        { kind: 'pass', observations: { consoleErrors: [], failedRequests: [] } });
      assert.equal(before.progress.checks[0].acceptedExecutionIds.length, 0);
    }
    if (isRetry) assert.deepEqual(before.progress.checks[0].acceptedExecutionIds, ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']);
    assert.equal(child.kill('SIGKILL'), true);
    assert.deepEqual(await closedResult, { code: null, signal: 'SIGKILL' });
    const lockPath = path.join(tree.workspacePath, '.qa-private/.campaign-continuation', `${tree.runId}.lock`);
    const lock = await readFile(lockPath), lockStat = await lstat(lockPath);
    await assert.rejects(acquireContinuationWriteAdmission(tree), { code: 'CAMPAIGN_CONTINUATION_WRITE_BUSY' });
    assert.deepEqual(await readFile(lockPath), lock); assert.equal((await lstat(lockPath)).ino, lockStat.ino);
    assert.deepEqual(await inventory(tree.storeRoot), privateBefore);
    assert.deepEqual(await inventory(tree.runPath), publicBefore);
    for (const [key, value] of Object.entries(original)) assert.deepEqual(publicBefore[key], value);
    const after = await readCampaignContinuation(tree);
    assert.deepEqual(after.progress, before.progress); assert.equal(after.receipt, null);
    assert.equal(diagnostics, '');
    t.diagnostic(`retained semantic byte-layer boundary: ${tree.root}`);
  });
}
