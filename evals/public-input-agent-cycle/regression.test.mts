import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { test } from "node:test";
import { startPublicAgentExercise } from "./prepare.mts";
import { buildCatalogRegression } from "./regression.mts";
import { digestCanonical } from "../../components/console/src/lib/canonical-digest.ts";
import { readCampaignWorkspace, writeCampaignPlan, writeNewCampaignPlan } from "../../components/console/src/node/qa-campaign-files.ts";
import { PlaywrightCampaignAdapter } from "../../components/console/src/node/playwright-campaign-adapter.ts";
import { runQaCampaign } from "../../components/console/src/node/qa-campaign-runner.ts";
// @ts-expect-error existing ESM reader has no declaration
import { readLatestCampaignEvidence } from "../../components/console/server/campaign-receipts.mjs";

// Catches wrong oracle wording, non-discriminating intersection, lost targets,
// stale no-oracle explanations and incorrect graph-to-check mapping in the recipe.
// Real publication + pipeline + reader; no handwritten replacement verdict.
test("reviewed catalog recipe distinguishes healthy and broken with retained semantic gaps", { timeout: 180_000 }, async () => {
  const exercise = await startPublicAgentExercise();
  console.log("Retained regression evidence: " + exercise.exerciseRoot);
  try {
    const { kernel, authority, workspaceDependencies: deps } = exercise.registration;
    const sourceBefore = kernel.canonicalJson(authority);
    const healthy = buildCatalogRegression(exercise.registration, "/fixed");
    assert.equal(kernel.canonicalJson(authority), sourceBefore, "Recipe mutated its input authority");
    const graph = healthy.revision.compilation.graph;
    assert.deepEqual(graph.nodes.filter((n: any) => n.coverageTarget).map((n: any) => [n.id,n.kind,n.subkind]).sort(),
      authority.compilation.graph.nodes.filter((n: any) => n.coverageTarget).map((n: any) => [n.id,n.kind,n.subkind]).sort());
    assert.equal(healthy.plan.checks.length, 8);
    assert.equal(healthy.plan.blockers.length, 2);
    const targetName = new Map(graph.nodes.map((n: any) => [n.id,n.name]));
    assert.deepEqual(healthy.plan.blockers.map(b=>targetName.get(b.targetId)).sort(),
      ["Manage inventory as staff","Read the result summary"]);
    const summary = healthy.revision.compilation.coverage.items.find((i: any)=>targetName.get(i.targetId)==="Read the result summary");
    assert.equal(summary.status, "coverage_gap");
    for (const item of healthy.revision.compilation.coverage.items.filter((i: any)=>i.status==="automated")) {
      assert.ok(item.reason.includes("Planned item-state checks"));
      assert.ok(!item.reason.includes("no approved oracle"));
    }
    assert.deepEqual(healthy.revision.compilation.strategy.blockers, authority.compilation.strategy.blockers);
    assert.deepEqual(healthy.plan.checks.map(c=>c.title), ["Baseline items","Interior substring","Literal punctuation","Tools category",
      "Narrowed Fruit prefix","Empty Tools intersection","Clear Fruit final state","Clear All final state"]);
    const preview = await kernel.previewRegistrationPublication(exercise.workspacePath, healthy.revision, deps);
    await kernel.applyRegistrationPublication(exercise.workspacePath, healthy.revision, preview.previewDigest, deps);
    assert.equal((await kernel.validateWorkspace(exercise.workspacePath,deps)).valid,true);
    const ws = await readCampaignWorkspace(exercise.workspacePath);
    const planPath = path.join(exercise.workspacePath,"tests/qa-campaign.v0.json");
    await writeNewCampaignPlan(exercise.workspacePath,planPath,healthy.plan);
    let priorReceiptPath = "", priorReceiptBytes = "";
    for (const [route, expectedVerdict, statuses] of [
      ["/fixed", "NEEDS_HUMAN", ["pass","pass","pass","pass","pass","pass","pass","pass"]],
      ["/catalog", "INCONCLUSIVE", ["pass","needs_review","needs_review","pass","needs_review","needs_review","pass","pass"]],
    ] as const) {
      const { plan } = buildCatalogRegression(exercise.registration,route);
      if(route==="/catalog") await writeCampaignPlan(exercise.workspacePath,planPath,plan,digestCanonical(healthy.plan));
      console.log(JSON.stringify({route,planDigest:digestCanonical(plan),checks:8,blocked:2}));
      const receipt = await runQaCampaign({workspacePath:exercise.workspacePath,graph:ws.graph,catalog:ws.catalog,plan,
        expectedProductSlug:exercise.productSlug,allowedBaseUrls:[exercise.baseUrl],environment:{}},
        new PlaywrightCampaignAdapter({baseUrl:exercise.baseUrl,environment:{},timeoutMs:3000}));
      assert.equal(receipt.verdict,expectedVerdict);
      assert.deepEqual(receipt.checks.map(c=>c.status),statuses);
      assert.deepEqual(receipt.dossiers,[]);
      const evidence = await readLatestCampaignEvidence({workspaceDir:exercise.workspacePath,workspaceRoots:[exercise.workspacePath],
        project:ws.project,productSlug:exercise.productSlug,graph:ws.graph,catalog:ws.catalog,allowedBaseUrls:[exercise.baseUrl],
        validateDependencyWorkspace:()=>kernel.validateWorkspace(exercise.workspacePath,deps)});
      assert.equal(evidence.receiptDigest,digestCanonical(receipt));
      if(route==="/fixed") {
        priorReceiptPath=path.join(exercise.workspacePath,receipt.runDirectory,"receipt.json");
        priorReceiptBytes=await readFile(priorReceiptPath,"utf8");
      } else {
        assert.equal(await readFile(priorReceiptPath,"utf8"),priorReceiptBytes);
        for(const c of receipt.checks.filter(c=>c.status==="needs_review")) {
          assert.equal(c.attempts.length,2);
          for(const a of c.attempts) assert.equal(a.oracle?.failureCode,"count_mismatch");
        }
      }
    }
    // Adversarial healthy-format page: correct count, wrong card, expected name
    // elsewhere. A global text witness must not establish item membership.
    const decoy = createServer((_req,res)=>{
      res.setHeader("content-type","text/html; charset=utf-8");
      res.end('<!doctype html><label>Search <input value="pP"></label><label>Category <select><option value="all">All</option></select></label><article data-testid="item">Wrong item</article><p>Apple</p>');
    });
    await new Promise<void>((resolve,reject)=>{decoy.once("error",reject);decoy.listen(0,"127.0.0.1",resolve);});
    try {
      const address=decoy.address(); assert.ok(address && typeof address!=="string");
      const baseUrl=`http://127.0.0.1:${address.port}/`;
      const check=structuredClone(healthy.plan.checks[1]!);
      assert.equal(check.kind,"browser"); if(check.kind!=="browser") throw new Error("Expected browser check");
      check.assertions[0]={kind:"url",value:new URL("/fixed",baseUrl).href};
      const output=path.join(exercise.exerciseRoot,"membership-decoy"); await mkdir(output);
      const outcome=await new PlaywrightCampaignAdapter({baseUrl,environment:{},timeoutMs:3000}).runCheck(check,1,output);
      assert.equal(outcome.kind,"oracle_failure","A name outside an item card was accepted as membership");
      if(outcome.kind!=="oracle_failure") throw new Error("Expected item membership failure");
      assert.equal(outcome.oracle.failureCode,"count_mismatch");
      const trace=JSON.parse(await readFile(path.join(output,"trace.json"),"utf8"));
      assert.deepEqual(trace.events.filter((e: any)=>e.phase==="assertion"&&e.outcome==="failed").map((e: any)=>e.index),[4]);
    } finally { await new Promise<void>((resolve,reject)=>decoy.close(e=>e?reject(e):resolve())); }
  } finally { await exercise.close(); }
});
