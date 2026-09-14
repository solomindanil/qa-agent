import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { lstat, readFile } from 'node:fs/promises';
// @ts-expect-error Source-owned semantic fixture is plain ESM.
import { recordsFixture, publishRecords, addFixtureReceipt } from '../../components/console/tests/fixtures/campaign-continuation-records.mjs';
// @ts-expect-error Actual reader uses plain ESM.
import { readCampaignContinuation } from '../../components/console/server/campaign-continuation-reader.mjs';
import { digestCanonical } from '../../components/console/src/lib/canonical-digest.ts';
import { acquireContinuationWriteAdmission } from '../../components/console/src/node/campaign-continuation-files.ts';
import { createCampaignContinuationPublication } from '../../components/console/src/node/qa-campaign-continuation.ts';
import { createContinuationTarget } from '../../components/console/tests/unit/fixtures/campaign-continuation-target.ts';

// Catches an identity field silently omitted from the real publication boundary.
// The current-authority callback represents this fixed synthetic test authority;
// it does not qualify the registered CLI's live collector by itself.
for (const changed of [null, 'planDigest', 'graphDigest', 'catalogDigest', 'registrationDigest',
  'publicationDigest', 'oracleApprovalDigest', 'dependencyDigest', 'bindingDigest', 'console', 'kernel'] as const) {
  test(`publication rejects changed static identity before target reads: ${changed ?? 'unchanged control'}`, async () => {
    const target = await createContinuationTarget();
    let admission: Awaited<ReturnType<typeof acquireContinuationWriteAdmission>> | undefined;
    let primaryFailure: unknown;
    try {
      const records = recordsFixture();
      records.input.run.plan.baseUrl = target.baseUrl;
      Object.assign(records.input.run.identity, { origin: target.baseUrl,
        planDigest: digestCanonical(records.input.run.plan), target: target.targetIdentity });
      const tree = await publishRecords(records.input);
      admission = await acquireContinuationWriteAdmission(tree);
      const frozen = structuredClone(records.input.run.identity);
      const publish = createCampaignContinuationPublication({ ...tree,
        fixture: { origin: target.baseUrl, identityUrl: target.identityUrl,
          targetIdentity: target.targetIdentity, repeatSafePaths: target.repeatSafePaths },
        verifyStaticIdentity: async received => { assert.deepEqual(received, frozen); } });
      const current = structuredClone(frozen);
      if (changed === 'console' || changed === 'kernel') current.sources[changed] = '9'.repeat(40);
      else if (changed) current[changed] = `sha256:${'9'.repeat(64)}`;
      const pending = publish(admission, { runId: tree.runId, ownerGeneration: 1,
        sourceDigest: `sha256:${'1'.repeat(64)}`, workspacePath: tree.workspacePath, storeRoot: tree.storeRoot },
      { operation: 'initialize', identity: current, plan: records.input.run.plan });
      if (changed) {
        await assert.rejects(pending, /Current static campaign identity changed/);
        assert.deepEqual(target.counters(), { A: 0, B: 0, C: 0, identity: 0, rejected: 0 });
      } else {
        const snapshot = await pending as { phase: string; receipt: unknown };
        assert.equal(snapshot.phase, 'partial'); assert.equal(snapshot.receipt, null);
        assert.deepEqual(target.counters(), { A: 0, B: 0, C: 0, identity: 1, rejected: 0 });
      }
    } catch (error) { primaryFailure = error; throw error; } finally {
      const results = await Promise.allSettled([admission?.release(), target.close()]);
      const errors = results.flatMap(result => result.status === 'rejected' ? [result.reason] : []);
      if (errors.length) throw new AggregateError(
        [...(primaryFailure === undefined ? [] : [primaryFailure]), ...errors], 'Owned identity fixture finalization failed');
    }
  });
}

// Detects terminal permission recovery accidentally replaying a request/probe,
// altering accepted bytes, or sealing before current static authority is checked.
for (const stale of [false, true]) {
  test(`real publication consumer handles terminal sealing_pending without target reads: stale=${stale}`, async () => {
    const target = await createContinuationTarget();
    let admission: Awaited<ReturnType<typeof acquireContinuationWriteAdmission>> | undefined;
    let primaryFailure: unknown;
    try {
      const records = recordsFixture();
      records.input.run.plan.baseUrl = target.baseUrl;
      Object.assign(records.input.run.identity, { origin: target.baseUrl,
        planDigest: digestCanonical(records.input.run.plan), target: target.targetIdentity });
      for (const id of ['A', 'B', 'C']) records.complete(records.start(id));
      addFixtureReceipt(records.input);
      const tree = await publishRecords(records.input), before = await readCampaignContinuation(tree);
      assert.equal(before.phase, 'sealing_pending'); assert.equal(before.receipt, null);
      const original = await Promise.all(before.sealingInventory.files.map(async (entry: { path: string }) => {
        const absolute = path.join(tree.runPath, entry.path);
        return { absolute, bytes: await readFile(absolute), mtimeMs: (await lstat(absolute)).mtimeMs };
      }));
      admission = await acquireContinuationWriteAdmission(tree);
      let staticReads = 0;
      const publish = createCampaignContinuationPublication({ ...tree,
        fixture: { origin: target.baseUrl, identityUrl: target.identityUrl,
          targetIdentity: target.targetIdentity, repeatSafePaths: target.repeatSafePaths },
        verifyStaticIdentity: async received => { staticReads++; assert.deepEqual(received, records.input.run.identity);
          if (stale) throw new Error('Owned test authority changed'); } });
      const session = { runId: tree.runId, ownerGeneration: 2, sourceDigest: `sha256:${'1'.repeat(64)}`,
        workspacePath: tree.workspacePath, storeRoot: tree.storeRoot };
      const request = { operation: 'initialize' as const, identity: records.input.run.identity, plan: records.input.run.plan };
      if (stale) {
        await assert.rejects(publish(admission, session, request), /Owned test authority changed/);
        assert.equal((await readCampaignContinuation(tree)).phase, 'sealing_pending');
        assert.equal((await lstat(tree.runPath)).mode & 0o777, 0o700);
      } else {
        const after = await publish(admission, session, request) as { phase: string; receipt: { verdict: string } };
        assert.equal(after.phase, 'terminal'); assert.equal(after.receipt.verdict, 'NEEDS_HUMAN');
        assert.deepEqual(after.receipt, records.input.receipt);
        const repeated = await publish(admission, session, request) as { receipt: unknown };
        assert.deepEqual(repeated.receipt, after.receipt);
        assert.equal((await lstat(tree.runPath)).mode & 0o777, 0o500);
      }
      assert.equal(staticReads, 1);
      for (const entry of original) { assert.deepEqual(await readFile(entry.absolute), entry.bytes);
        assert.equal((await lstat(entry.absolute)).mtimeMs, entry.mtimeMs); }
      assert.deepEqual(target.counters(), { A: 0, B: 0, C: 0, identity: 0, rejected: 0 });
    } catch (error) { primaryFailure = error; throw error; } finally {
      const results = await Promise.allSettled([admission?.release(), target.close()]);
      const errors = results.flatMap(result => result.status === 'rejected' ? [result.reason] : []);
      if (errors.length) throw new AggregateError(
        [...(primaryFailure === undefined ? [] : [primaryFailure]), ...errors], 'Owned sealing fixture finalization failed');
    }
  });
}
