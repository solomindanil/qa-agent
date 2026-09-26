import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

test("prepares two identical four-target managed workspaces with historical v1 evidence", { timeout: 180_000 }, async () => {
  const { startW4AgentChangeScopePreparation } = await import("./prepare.mts");
  const prepared = await startW4AgentChangeScopePreparation();
  try {
    assert.equal(prepared.actors.length, 2);
    assert.notEqual(prepared.actors[0].workspacePath, prepared.actors[1].workspacePath);
    assert.equal(prepared.actors[0].baseUrl, prepared.actors[1].baseUrl);
    assert.deepEqual(prepared.v1Environment.body, { candidateRevision: "v1" });
    assert.deepEqual(prepared.v1Catalog.body, { catalogName: "Cedar", ready: true });
    assert.deepEqual(prepared.v2Environment.body, { candidateRevision: "v2" });
    assert.deepEqual(prepared.actors[0].authority.compilation, prepared.actors[1].authority.compilation);

    for (const actor of prepared.actors) {
      const compilation = actor.authority.compilation;
      const initial = actor.registration.authority.compilation;
      assert.equal(actor.validation.valid, true);
      assert.equal(actor.validation.publicationAuthorityDigest, actor.authority.semanticDigest);
      assert.equal(actor.report.publicationAuthorityDigest, actor.authority.semanticDigest);
      assert.equal(actor.report.strategyDigest, compilation.strategy.semanticDigest);
      assert.deepEqual(actor.report.diagnostics, []);
      assert.equal(compilation.graph.nodes.filter((node: any) => node.coverageTarget).length, 4);
      assert.deepEqual(new Set(compilation.coverage.items.map((item: any) => item.targetId)), new Set(Object.values(prepared.targets)));
      assert.deepEqual(new Set(actor.report.targets.map((row: any) => row.targetId)), new Set(Object.values(prepared.targets)));
      assert.deepEqual(compilation.graph.edges.filter((edge: any) => edge.kind === "requires").map((edge: any) => [edge.from, edge.to, edge.reviewStatus]), [[prepared.targets.A, prepared.targets.B, "reviewed"]]);
      assert.equal(compilation.graph.edges.filter((edge: any) => edge.kind === "verifies").length, 3, "exactly three reviewed GET check relationships");
      const initialD = initial.catalog.entries.find((entry: any) => entry.targetIds.includes(prepared.targets.D));
      assert.deepEqual(compilation.catalog.entries.find((entry: any) => entry.checkId === initialD.checkId), initialD, "D's generated catalog relationship remains byte-semantically unchanged");
      assert.deepEqual(compilation.coverage.items.find((item: any) => item.targetId === prepared.targets.D).checkIds, initial.coverage.items.find((item: any) => item.targetId === prepared.targets.D).checkIds);
      for (const name of ["A", "B", "C"] as const) {
        const targetId = prepared.targets[name];
        const checkId = prepared.checks[name];
        const entry = compilation.catalog.entries.find((item: any) => item.checkId === checkId);
        assert.deepEqual(entry.targetIds, [targetId]);
        assert.equal(entry.oracle.state, "resolved");
        assert.deepEqual(compilation.coverage.items.find((item: any) => item.targetId === targetId).checkIds, [checkId]);
        assert.equal(compilation.graph.edges.filter((edge: any) => edge.kind === "verifies" && edge.from === checkId && edge.to === targetId && edge.reviewStatus === "reviewed").length, 1);
      }
      const d = compilation.coverage.items.find((item: any) => item.targetId === prepared.targets.D);
      assert.notEqual(d.status, "automated");
      assert.ok(compilation.catalog.entries.some((entry: any) => entry.targetIds.includes(prepared.targets.D) && entry.oracle.state !== "resolved"));
      const a = actor.report.targets.find((row: any) => row.targetId === prepared.targets.A);
      assert.equal(a.observationState, "recorded");
      assert.equal(a.observations.length, 1);
      assert.equal(a.observations[0].currentBinding, "current");
      assert.equal(a.observations[0].provenance, "agent_authored_unattested");
      assert.equal(a.observations[0].payload.result, "passed");
      assert.deepEqual(a.observations[0].identity.candidate.value, { candidateRevision: "v1" });
      assert.deepEqual(a.observations[0].identity.environment.value, { candidateRevision: "v1" });
      assert.equal(a.observations[0].payload.expectedBehavior, "GET /api/catalog returns HTTP 200 with catalogName Cedar and ready true.");
      assert.ok(actor.report.targets.filter((row: any) => row.targetId !== prepared.targets.A).every((row: any) => row.observationState === "not_observed" && row.observations.length === 0));
      const packet = JSON.parse(await readFile(actor.packetPath, "utf8"));
      assert.deepEqual(Object.keys(packet).sort(), ["baseUrl", "briefPath", "catalogPath", "dossierPath", "graphPath", "observationReportPath", "outputPath", "planPath", "skillPath"].sort());
      assert.equal(packet.baseUrl, prepared.baseUrl);
      assert.ok((await readFile(packet.briefPath, "utf8")).includes("unmapped"));
      await assert.rejects(access(packet.planPath), { code: "ENOENT" });
      assert.equal(path.dirname(packet.planPath), actor.actorRoot);
      const source = compilation.profile.sources[0];
      const sessions = await readdir(path.join(actor.registration.storeRoot, ".qa-private/registration-members"));
      assert.equal(sessions.length, 1);
      const content = await readFile(path.join(actor.registration.storeRoot, ".qa-private/registration-members", sessions[0], "sources", source.contentDigest.slice(7), "content"));
      assert.equal(actor.registration.kernel.digestBytes(content), source.contentDigest);
      const sourceBrief = JSON.parse(content.toString("utf8"));
      assert.match(sourceBrief.product.description, /unlabeledItemCount 0/);
      assert.match(sourceBrief.product.description, /staleItemCount 0/);
      assert.match(sourceBrief.product.description, /unmapped behavioral change/);
    }
    assert.notEqual(prepared.actors[0].dossierPath, prepared.actors[1].dossierPath);
  } finally {
    await prepared.close();
    await prepared.close();
  }
  const journal = JSON.parse(await readFile(prepared.journalPath, "utf8"));
  assert.deepEqual(journal.slice(0, 2).map((hit: any) => [hit.path, hit.candidateRevision]), [["/api/environment", "v1"], ["/api/catalog", "v1"]]);
  assert.deepEqual(journal.at(-1).path, "/api/environment");
  assert.equal(journal.at(-1).candidateRevision, "v2");
});
