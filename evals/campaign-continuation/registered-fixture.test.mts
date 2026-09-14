import assert from "node:assert/strict";
import { mkdtemp, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { readCampaignPlan } from "../../components/console/src/node/qa-campaign-files.ts";
import { validateCampaignClosure } from "../../components/console/src/lib/qa-campaign-v0.ts";
import { createContinuationTarget } from "../../components/console/tests/unit/fixtures/campaign-continuation-target.ts";
import { registerContinuationWorkspace } from "./registered-fixture.mts";

test("actual Kernel registration supplies catalog-bound A/B/C without target calls", async (t) => {
  const target = await createContinuationTarget();
  t.after(() => target.close());
  const root = await mkdtemp(path.join(await realpath(os.tmpdir()), "qa-continuation-registered-"));
  // Retain synthetic registration/evidence for inspection; no cleanup of managed state.
  t.diagnostic(`retained fixture: ${root}`);
  const registered = await registerContinuationWorkspace(target, root);
  assert.equal(registered.validation.valid, true);
  assert.equal(registered.plan.checks.length, 3, "real publication must expose all three declared executable checks");
  assert.deepEqual(registered.plan.checks.map(check => check.kind === "api" ? check.path : "wrong-kind"), ["/A", "/B", "/C"]);
  assert.deepEqual(registered.plan.checks.map(check => check.kind === "api" ? {
    method: check.method, expectedBehavior: check.expectedBehavior, assertions: check.assertions,
  } : null), [
    { method: "GET", expectedBehavior: "GET /A returns status 200, check A, and ok true.",
      assertions: [{ kind: "status", value: 200 }, { kind: "json_path", path: "$.check", value: "A" },
        { kind: "json_path", path: "$.ok", value: true }] },
    { method: "GET", expectedBehavior: "GET /B returns status 200, check B, and ok true.",
      assertions: [{ kind: "status", value: 200 }, { kind: "json_path", path: "$.check", value: "B" },
        { kind: "json_path", path: "$.ok", value: true }] },
    { method: "GET", expectedBehavior: "GET /C returns status 200, check C, and ok true.",
      assertions: [{ kind: "status", value: 200 }, { kind: "json_path", path: "$.check", value: "C" },
        { kind: "json_path", path: "$.ok", value: true }] },
  ], "registration must preserve the independently specified request and oracle contract");
  assert.deepEqual(await readCampaignPlan(registered.workspacePath, registered.planPath), registered.plan);
  assert.equal(registered.validation.publicationAuthorityDigest, registered.authority.semanticDigest);
  assert.match(registered.validation.privateStateDigest, /^sha256:[0-9a-f]{64}$/);
  const executableTargets = new Set(registered.plan.checks.flatMap(check => check.targetIds));
  assert.deepEqual(registered.plan.blockers.map(blocker => blocker.targetId).sort(),
    registered.graph.nodes.filter(node => node.coverageTarget && !executableTargets.has(node.id)).map(node => node.id).sort());
  assert.ok(registered.plan.blockers.length > 0, "unrelated registered scope is retained, not silently removed");
  assert.throws(() => validateCampaignClosure({ graph: registered.graph, catalog: registered.catalog,
    plan: { ...registered.plan, checks: registered.plan.checks.slice(0, 2) },
    expectedProductSlug: registered.plan.productSlug, allowedBaseUrls: [registered.plan.baseUrl], approvalReceipts: [] }),
    /catalog|coverage|check/i, "dropping C must break actual catalog closure");
  assert.deepEqual(target.counters(), { A: 0, B: 0, C: 0, identity: 0, rejected: 0 });
});
