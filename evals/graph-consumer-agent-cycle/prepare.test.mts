import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

async function loadPreparation() {
  try {
    return await import("./prepare.mts");
  } catch {
    return {};
  }
}

function withoutFreshGraphDigest(item: Record<string, any>) {
  const copy = structuredClone(item);
  delete copy.freshness.graphDigest;
  return copy;
}

test("prepares equal registered bases and publishes one reviewed dependency without a campaign plan", { timeout: 180_000 }, async () => {
  const { startGraphConsumerExercise } = await loadPreparation();
  assert.equal(
    typeof startGraphConsumerExercise,
    "function",
    "the bounded graph-consumer preparation must be implemented",
  );

  let reviewCalls = 0;
  const exercise = await startGraphConsumerExercise({
    beforeRelationApply: ({ candidate, preview, relation, delta }: Record<string, any>) => {
      reviewCalls += 1;
      assert.equal(candidate.compilation.graph.edges.some((edge: any) => edge.id === relation.id), true);
      assert.equal(delta.valid, true);
      assert.match(preview.previewDigest, /^sha256:/);
      return {
        approved: true,
        kind: "test-controller-review",
        candidateDigest: candidate.semanticDigest,
        previewDigest: preview.previewDigest,
      };
    },
  });
  try {
    assert.equal(exercise.actors.length, 2);
    assert.notEqual(exercise.actors[0].actorRoot, exercise.actors[1].actorRoot);
    assert.notEqual(exercise.actors[0].workspacePath, exercise.actors[1].workspacePath);
    assert.notEqual(exercise.actors[0].storeRoot, exercise.actors[1].storeRoot);
    assert.equal(exercise.actors[0].baseUrl, exercise.baseUrl);
    assert.equal(exercise.actors[1].baseUrl, exercise.baseUrl);
    assert.deepEqual(exercise.actors[0].initialAuthority, exercise.actors[1].initialAuthority);
    assert.deepEqual(exercise.actors[0].commonAuthority, exercise.actors[1].commonAuthority);

    const initial = exercise.actors[0].initialAuthority.compilation;
    const common = exercise.actors[0].commonAuthority.compilation;
    const journey = common.graph.nodes.find((node: any) => node.id === exercise.targets.journeyId);
    const invariant = common.graph.nodes.find((node: any) => node.id === exercise.targets.invariantId);
    const journeyCheck = common.graph.nodes.find((node: any) => node.id === exercise.checks.journeyCheckId);
    const invariantCheck = common.graph.nodes.find((node: any) => node.id === exercise.checks.invariantCheckId);

    assert.deepEqual(
      journey,
      initial.graph.nodes.find((node: any) => node.id === exercise.targets.journeyId),
      "the existing journey identity, kind, subkind and provenance must be retained",
    );
    assert.equal(invariant.kind, "invariant");
    assert.equal(invariant.subkind, "invariant");
    assert.deepEqual(invariant.provenance, journey.provenance);
    assert.equal(journeyCheck.kind, "automated_check");
    assert.equal(journeyCheck.subkind, "journey");
    assert.equal(invariantCheck.kind, "automated_check");
    assert.equal(invariantCheck.subkind, "invariant");
    assert.deepEqual(common.graph.edges.filter((edge: any) => edge.kind === "requires"), []);
    assert.deepEqual(
      common.graph.edges.filter((edge: any) => edge.kind === "verifies" && [exercise.checks.journeyCheckId, exercise.checks.invariantCheckId].includes(edge.from))
        .map((edge: any) => ({ from: edge.from, to: edge.to, reviewStatus: edge.reviewStatus }))
        .sort((left: any, right: any) => left.from.localeCompare(right.from)),
      [
        { from: exercise.checks.invariantCheckId, to: exercise.targets.invariantId, reviewStatus: "reviewed" },
        { from: exercise.checks.journeyCheckId, to: exercise.targets.journeyId, reviewStatus: "reviewed" },
      ].sort((left, right) => left.from.localeCompare(right.from)),
    );

    const catalogByCheck = new Map(common.catalog.entries.map((entry: any) => [entry.checkId, entry]));
    assert.deepEqual(catalogByCheck.get(exercise.checks.journeyCheckId)?.oracle, {
      state: "resolved",
      description: "GET /api/catalog returns status 200, catalogName Stage Four, and ready true.",
    });
    assert.deepEqual(catalogByCheck.get(exercise.checks.invariantCheckId)?.oracle, {
      state: "resolved",
      description: "GET /api/catalog-integrity returns status 200, invariantSatisfied true, and unlabeledItemCount 0.",
    });
    assert.deepEqual(common.strategy.blockers, initial.strategy.blockers);
    assert.deepEqual(common.graph.unresolved, initial.graph.unresolved);
    assert.equal(common.coverage.items.length, initial.coverage.items.length + 1);
    for (const item of initial.coverage.items) {
      assert.ok(common.coverage.items.some((candidate: any) => candidate.targetId === item.targetId));
    }

    const changed = exercise.actors[exercise.changedActorIndex];
    const unchanged = exercise.actors[1 - exercise.changedActorIndex];
    assert.deepEqual(unchanged.currentAuthority, unchanged.commonAuthority);
    assert.equal(changed.validation.valid, true);
    assert.equal(changed.validation.publicationAuthorityDigest, changed.currentAuthority.semanticDigest);
    assert.equal(changed.currentAuthority.basePublicationDigest, changed.commonAuthority.semanticDigest);
    assert.equal(reviewCalls, 1);
    assert.equal(changed.preview.previewDigest, changed.preApplyDecision.previewDigest);
    assert.equal(changed.receipt.workspaceDigestAfter, changed.validation.workspaceDigest);
    assert.equal(exercise.delta.valid, true);

    const post = changed.currentAuthority.compilation;
    const added = post.graph.edges.filter((edge: any) => !common.graph.edges.some((before: any) => before.id === edge.id));
    assert.deepEqual(added, [exercise.relation]);
    assert.equal(exercise.relation.kind, "requires");
    assert.equal(exercise.relation.reviewStatus, "reviewed");
    assert.equal(exercise.relation.from, exercise.targets.journeyId);
    assert.equal(exercise.relation.to, exercise.targets.invariantId);
    assert.deepEqual(post.profile, common.profile);
    assert.deepEqual(post.graph.nodes, common.graph.nodes);
    assert.deepEqual(post.graph.unresolved, common.graph.unresolved);
    assert.deepEqual(post.catalog.entries, common.catalog.entries);
    assert.deepEqual(post.coverage.unresolved, common.coverage.unresolved);
    assert.deepEqual(post.strategy.blockers, common.strategy.blockers);
    assert.deepEqual(post.strategy.proposedAutomatedChecks, common.strategy.proposedAutomatedChecks);
    assert.deepEqual(post.strategy.manualHandoffs, common.strategy.manualHandoffs);
    assert.deepEqual(post.strategy.unresolvedOracles, common.strategy.unresolvedOracles);
    assert.deepEqual(
      post.coverage.items.map(withoutFreshGraphDigest),
      common.coverage.items.map(withoutFreshGraphDigest),
    );
    assert.notEqual(post.graph.semanticDigest, common.graph.semanticDigest);
    assert.equal(post.coverage.graphDigest, post.graph.semanticDigest);
    assert.equal(post.catalog.graphDigest, post.graph.semanticDigest);
    assert.equal(post.strategy.graphDigest, post.graph.semanticDigest);
    assert.equal(post.strategy.coverageDigest, post.coverage.semanticDigest);
    assert.equal(post.strategy.testCatalogDigest, post.catalog.semanticDigest);

    const packetKeys = [
      "actorRoot", "baseUrl", "briefPath", "catalogPath", "consolePath", "graphPath",
      "kernelPath", "productSlug", "requestedJourneyName", "sourceRoot", "storeRoot", "workspacePath",
    ].sort();
    for (const actor of exercise.actors) {
      const packet = JSON.parse(await readFile(actor.packetPath, "utf8"));
      assert.deepEqual(Object.keys(packet).sort(), packetKeys);
      assert.equal(packet.requestedJourneyName, "Read the public catalog");
      assert.equal(packet.graphPath, path.join(packet.workspacePath, "model/product.graph.json"));
      assert.equal(packet.catalogPath, path.join(packet.workspacePath, "model/test-catalog.json"));
      assert.ok((await readFile(packet.briefPath, "utf8")).includes("Read the public catalog"));
      await assert.rejects(access(path.join(packet.workspacePath, "tests/qa-campaign.v0.json")), { code: "ENOENT" });
      assert.equal("condition" in packet, false);
      assert.equal("expectedSelection" in packet, false);
      assert.equal("plan" in packet, false);
    }

    await fetch(new URL("/api/catalog", exercise.baseUrl));
    await fetch(new URL("/api/catalog-integrity", exercise.baseUrl));
  } finally {
    await exercise.close();
  }
  assert.deepEqual(JSON.parse(await readFile(exercise.journalPath, "utf8")), [
    { method: "GET", path: "/api/catalog" },
    { method: "GET", path: "/api/catalog-integrity" },
  ]);
  await assert.rejects(fetch(new URL("/api/catalog", exercise.baseUrl)));
});
