import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, realpath, mkdir, chmod, lstat, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { registerContinuationWorkspace } from './registered-fixture.mts';
import { createContinuationTarget } from '../../components/console/tests/unit/fixtures/campaign-continuation-target.ts';
import { createRegisteredCampaignContinuationHost } from '../../components/console/scripts/qa-campaign.ts';
import type { OwnedContinuationWorker } from '../../components/console/src/node/campaign-continuation-owner.ts';
// @ts-expect-error Actual reader uses plain ESM.
import { readCampaignContinuation } from '../../components/console/server/campaign-continuation-reader.mjs';

const kernelRoot = fileURLToPath(new URL('../../components/kernel', import.meta.url));
function deadline<T>(pending: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Owned sealing CLI exceeded qualification deadline')), 180_000);
    pending.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

test('registered CLI repairs modeled terminal sealing interruption without target reads', { timeout: 600_000 }, async t => {
  assert.equal(process.env.QA_STARTER_REPO, kernelRoot);
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'qa-continuation-sealing-cli-')));
  t.diagnostic(`retained registered sealing evidence: ${root}`);
  process.stdout.write(`QA_CONTINUATION_SEALING_ROOT ${root}\n`);
  const target = await createContinuationTarget();
  let host: Awaited<ReturnType<typeof createRegisteredCampaignContinuationHost>> | undefined;
  let primaryFailure: unknown;
  const report: Record<string, unknown> = { executionClass: 'registered-cli-permission-fault-injection', phase: 'setup' };
  try {
    const registered = await registerContinuationWorkspace(target, root);
    const storeRoot = path.join(root, 'private'), approvalStoreRoot = path.join(root, 'approvals');
    await mkdir(storeRoot, { mode: 0o700 }); await mkdir(approvalStoreRoot, { mode: 0o700 });
    host = await createRegisteredCampaignContinuationHost({ workspacePath: registered.workspacePath,
      planPath: registered.planPath, storeRoot, approvalStoreRoot, starterRepo: kernelRoot,
      fixture: { origin: target.baseUrl, identityUrl: target.identityUrl,
        targetIdentity: target.targetIdentity, repeatSafePaths: target.repeatSafePaths } });
    const tree = { workspacePath: registered.workspacePath, runId: host.runId };
    const initial = await host.launch({ runId: host.runId });
    assert.deepEqual(await deadline(initial.closed), { exitCode: 1, signal: null });
    assert.equal(initial.readOutput().stderr, ''); assert.equal(initial.readOutput().truncated, false);
    const before = await readCampaignContinuation(tree);
    assert.equal(before.phase, 'terminal'); assert.equal(before.receipt.verdict, 'NEEDS_HUMAN');
    const runPath = path.join(tree.workspacePath, 'tests/campaign-runs', tree.runId);
    const files = await Promise.all(before.sealingInventory.files.map(async (entry: { path: string }) => {
      const absolute = path.join(runPath, entry.path);
      return { absolute, bytes: await readFile(absolute), mtimeMs: (await lstat(absolute)).mtimeMs };
    }));
    const counts = target.counters();
    assert.deepEqual({ A: counts.A, B: counts.B, C: counts.C }, { A: 1, B: 1, C: 1 });
    // Exact owned fixture fault, modeling an interrupted final chmod. No claim
    // of a real process kill at this boundary, and no alteration of receipt bytes.
    await chmod(runPath, 0o700);
    const pending = await readCampaignContinuation(tree);
    assert.equal(pending.phase, 'sealing_pending'); assert.equal(pending.receipt, null);
    const validationPending = await registered.fixture.kernel.validateWorkspace(tree.workspacePath, registered.fixture.workspaceDependencies);
    assert.equal(validationPending.valid, true);
    for (let generation = 0; generation < 2; generation++) {
      const resumed: OwnedContinuationWorker = await host.resume({ runId: host.runId });
      assert.deepEqual(await deadline(resumed.closed), { exitCode: 1, signal: null });
      const output = resumed.readOutput(); assert.equal(output.truncated, false); assert.equal(output.stderr, '');
      const actual = await readCampaignContinuation(tree);
      assert.equal(actual.phase, 'terminal'); assert.deepEqual(actual.receipt, before.receipt);
      assert.deepEqual(JSON.parse(output.stdout).receipt, before.receipt);
      assert.equal((await lstat(runPath)).mode & 0o777, 0o500);
      assert.deepEqual(target.counters(), counts);
      for (const file of files) { assert.deepEqual(await readFile(file.absolute), file.bytes);
        assert.equal((await lstat(file.absolute)).mtimeMs, file.mtimeMs); }
    }
    const validationFinal = await registered.fixture.kernel.validateWorkspace(tree.workspacePath, registered.fixture.workspaceDependencies);
    assert.equal(validationFinal.valid, true);
    for (const validation of [validationPending, validationFinal]) {
      assert.equal(validation.privateStateDigest, registered.validation.privateStateDigest);
      assert.equal(validation.publicationAuthorityDigest, registered.validation.publicationAuthorityDigest);
    }
    Object.assign(report, { phase: 'qualified', ...tree, sources: before.identity.sources,
      beforeCounts: counts, afterCounts: target.counters(), receipt: before.receipt, validationPending, validationFinal });
  } catch (error) { primaryFailure = error; Object.assign(report, { phase: 'failed', error: String(error) }); throw error;
  } finally {
    const results = await Promise.allSettled([host?.close(), target.close()]);
    report.finalization = results.map(result => result.status === 'fulfilled' ? 'closed' : String(result.reason));
    const errors = results.flatMap(result => result.status === 'rejected' ? [result.reason] : []);
    if (errors.length) report.phase = 'failed';
    await writeFile(path.join(root, 'REPORT.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
    if (errors.length) throw new AggregateError([...(primaryFailure === undefined ? [] : [primaryFailure]), ...errors], 'Owned sealing finalization failed');
  }
});
