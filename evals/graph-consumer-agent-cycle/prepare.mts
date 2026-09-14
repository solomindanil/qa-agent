import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  registerAuthoredFixture,
  rehashCompilation,
} from "../../components/console/tests/fixtures/nuanu-readonly/fixture.ts";
import { startGraphConsumerFixture } from "./fixture.mjs";

type JsonRecord = Record<string, any>;

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRODUCT_SLUG = "stage-four-public-catalog";
const JOURNEY_NAME = "Read the public catalog";
const INVARIANT_NAME = "Published catalog entries have nonblank display labels";
const JOURNEY_EXPECTATION = "GET /api/catalog returns status 200, catalogName Stage Four, and ready true.";
const INVARIANT_EXPECTATION = "GET /api/catalog-integrity returns status 200, invariantSatisfied true, and unlabeledItemCount 0.";

const product = {
  productSlug: PRODUCT_SLUG,
  name: "Stage Four public catalog",
  description: "GET /api/catalog returns status 200, catalogName Stage Four, and ready true. Every published catalog entry has a nonblank displayLabel; GET /api/catalog-integrity returns status 200, invariantSatisfied true, and unlabeledItemCount 0.",
  surfaces: [{ kind: "api" as const, name: "Public catalog API" }],
  journeys: [{
    name: JOURNEY_NAME,
    expectedOutcome: JOURNEY_EXPECTATION,
  }],
  authoredJourneyName: JOURNEY_NAME,
};

function same(kernel: JsonRecord, left: unknown, right: unknown): boolean {
  return kernel.canonicalJson(left) === kernel.canonicalJson(right);
}

function requireSame(kernel: JsonRecord, left: unknown, right: unknown, message: string): void {
  if (!same(kernel, left, right)) throw new Error(message);
}

function buildCommonCompilation(registration: JsonRecord) {
  const { kernel } = registration;
  const next = structuredClone(registration.authority.compilation) as JsonRecord;
  const journey = next.graph.nodes.find((node: JsonRecord) => node.id === registration.authoredTargetId);
  if (journey === undefined || journey.kind !== "journey" || journey.subkind !== "journey") {
    throw new Error("Registered named journey is missing its exact kind/subkind");
  }

  const replacedEntries = next.catalog.entries.filter((entry: JsonRecord) => entry.targetIds.includes(journey.id));
  if (replacedEntries.some((entry: JsonRecord) => entry.targetIds.length !== 1)) {
    throw new Error("Named journey catalog replacement is not independently bounded");
  }
  const replacedEntryIds = new Set(replacedEntries.map((entry: JsonRecord) => entry.entryId));
  const replacedCheckIds = new Set(replacedEntries.map((entry: JsonRecord) => entry.checkId));
  next.graph.nodes = next.graph.nodes.filter((node: JsonRecord) => !replacedCheckIds.has(node.id));
  next.graph.edges = next.graph.edges.filter((edge: JsonRecord) => (
    !replacedCheckIds.has(edge.from) && !replacedCheckIds.has(edge.to)
  ));
  next.catalog.entries = next.catalog.entries.filter((entry: JsonRecord) => !replacedEntryIds.has(entry.entryId));
  next.strategy.proposedAutomatedChecks = next.strategy.proposedAutomatedChecks.filter(
    (entry: JsonRecord) => !replacedEntryIds.has(entry.catalogEntryId),
  );
  next.strategy.manualHandoffs = next.strategy.manualHandoffs.filter(
    (entry: JsonRecord) => !replacedEntryIds.has(entry.catalogEntryId),
  );
  next.strategy.unresolvedOracles = next.strategy.unresolvedOracles.filter(
    (entry: JsonRecord) => !replacedEntryIds.has(entry.catalogEntryId),
  );

  const invariantId = kernel.stableId("invariant", { fixture: PRODUCT_SLUG, name: INVARIANT_NAME });
  const journeyCheckId = kernel.stableId("check", { fixture: PRODUCT_SLUG, target: "journey" });
  const invariantCheckId = kernel.stableId("check", { fixture: PRODUCT_SLUG, target: "invariant" });
  const invariant = {
    ...journey,
    id: invariantId,
    kind: "invariant",
    subkind: "invariant",
    name: INVARIANT_NAME,
    semanticDigest: kernel.digestCanonical("pending"),
  };
  next.graph.nodes.push(invariant);

  const journeyCoverage = next.coverage.items.find((item: JsonRecord) => item.targetId === journey.id);
  if (journeyCoverage === undefined) throw new Error("Named journey coverage item is missing");
  journeyCoverage.status = "automated";
  journeyCoverage.verificationMode = "automated";
  journeyCoverage.checkIds = [journeyCheckId];
  journeyCoverage.reason = "Resolved read-only catalog journey check.";
  next.coverage.unresolved = next.coverage.unresolved.filter((item: JsonRecord) => item.targetId !== journey.id);
  next.coverage.items.push({
    ...structuredClone(journeyCoverage),
    targetId: invariantId,
    checkIds: [invariantCheckId],
    reason: "Resolved read-only published-label invariant check.",
    provenance: invariant.provenance,
  });

  const definitions = [
    {
      checkId: journeyCheckId,
      target: journey,
      name: "Ready public catalog assertion",
      expectation: JOURNEY_EXPECTATION,
    },
    {
      checkId: invariantCheckId,
      target: invariant,
      name: "Published catalog label invariant assertion",
      expectation: INVARIANT_EXPECTATION,
    },
  ];
  for (const definition of definitions) {
    const entryId = kernel.stableId("catalog-entry", { fixture: PRODUCT_SLUG, checkId: definition.checkId });
    next.graph.nodes.push({
      ...definition.target,
      id: definition.checkId,
      kind: "automated_check",
      coverageTarget: false,
      name: definition.name,
      semanticDigest: kernel.digestCanonical("pending"),
    });
    next.graph.edges.push({
      id: kernel.stableId("edge", { fixture: PRODUCT_SLUG, checkId: definition.checkId, targetId: definition.target.id }),
      kind: "verifies",
      from: definition.checkId,
      to: definition.target.id,
      reviewStatus: "reviewed",
      assuranceLevel: "declared",
      provenance: definition.target.provenance,
      semanticDigest: kernel.digestCanonical("pending"),
    });
    next.catalog.entries.push({
      entryId,
      checkId: definition.checkId,
      targetIds: [definition.target.id],
      executionKind: "automated",
      runnerId: "playwright",
      candidatePath: "tests/api/generated/registration.candidates.spec.ts",
      requiredSecretRefs: [],
      sideEffectClasses: ["read_only"],
      expectedEvidenceTypes: ["http_response"],
      oracle: { state: "resolved", description: definition.expectation },
      provenance: definition.target.provenance,
    });
    next.strategy.proposedAutomatedChecks.push({
      proposalId: kernel.stableId("proposal", { fixture: PRODUCT_SLUG, entryId }),
      catalogEntryId: entryId,
      checkId: definition.checkId,
      targetIds: [definition.target.id],
      reason: "Existing independently specified read-only product contract.",
    });
  }
  next.strategy.sideEffectClasses = [...new Set(next.catalog.entries.flatMap(
    (entry: JsonRecord) => entry.sideEffectClasses,
  ))];
  next.strategy.expectedEvidenceTypes = [...new Set(next.catalog.entries.flatMap(
    (entry: JsonRecord) => entry.expectedEvidenceTypes,
  ))];
  return {
    compilation: rehashCompilation(kernel, next),
    journeyId: journey.id,
    invariantId,
    journeyCheckId,
    invariantCheckId,
  };
}

function buildRelationCompilation(registration: JsonRecord, common: JsonRecord, targets: JsonRecord) {
  const { kernel } = registration;
  const next = structuredClone(common) as JsonRecord;
  const journey = next.graph.nodes.find((node: JsonRecord) => node.id === targets.journeyId);
  if (journey === undefined) throw new Error("Common-base journey disappeared");
  const relation = {
    id: kernel.stableId("edge", { fixture: PRODUCT_SLUG, relation: "journey-requires-invariant" }),
    kind: "requires",
    from: targets.journeyId,
    to: targets.invariantId,
    reviewStatus: "reviewed",
    assuranceLevel: "declared",
    provenance: journey.provenance,
    semanticDigest: kernel.digestCanonical("pending"),
  };
  next.graph.edges.push(relation);
  const compilation = rehashCompilation(kernel, next);
  const sealedRelation = compilation.graph.edges.find((edge: JsonRecord) => edge.id === relation.id);
  if (sealedRelation === undefined) throw new Error("Reviewed relation was not sealed into the candidate graph");
  return { compilation, relation: sealedRelation };
}

function verifyRelationOnlyDelta(kernel: JsonRecord, before: JsonRecord, after: JsonRecord, relation: JsonRecord) {
  const stripCompilation = ({ graph: _graph, coverage: _coverage, catalog: _catalog, strategy: _strategy, semanticDigest: _digest, ...rest }: JsonRecord) => rest;
  requireSame(kernel, stripCompilation(before), stripCompilation(after), "Relation publication changed registration context");
  requireSame(kernel, before.profile, after.profile, "Relation publication changed the product profile");

  const stripGraph = ({ edges: _edges, semanticDigest: _digest, ...rest }: JsonRecord) => rest;
  requireSame(kernel, stripGraph(before.graph), stripGraph(after.graph), "Relation publication changed graph content other than edges");
  const afterEdges = new Map(after.graph.edges.map((edge: JsonRecord) => [edge.id, edge]));
  if (afterEdges.size !== before.graph.edges.length + 1) throw new Error("Relation publication changed the graph edge denominator");
  for (const edge of before.graph.edges) requireSame(kernel, edge, afterEdges.get(edge.id), `Relation publication changed retained edge ${edge.id}`);
  requireSame(kernel, relation, afterEdges.get(relation.id), "Relation publication did not add the exact reviewed edge");

  const stripCoverage = ({ items: _items, graphDigest: _graphDigest, semanticDigest: _digest, ...rest }: JsonRecord) => rest;
  requireSame(kernel, stripCoverage(before.coverage), stripCoverage(after.coverage), "Relation publication changed coverage content");
  if (before.coverage.items.length !== after.coverage.items.length) throw new Error("Relation publication changed the coverage denominator");
  for (const beforeItem of before.coverage.items) {
    const afterItem = after.coverage.items.find((item: JsonRecord) => item.targetId === beforeItem.targetId);
    if (afterItem === undefined) throw new Error(`Relation publication removed coverage target ${beforeItem.targetId}`);
    const stripFreshGraph = (item: JsonRecord) => {
      const copy = structuredClone(item);
      delete copy.freshness.graphDigest;
      return copy;
    };
    requireSame(kernel, stripFreshGraph(beforeItem), stripFreshGraph(afterItem), `Relation publication changed coverage target ${beforeItem.targetId}`);
    if (afterItem.freshness.graphDigest !== after.graph.semanticDigest) throw new Error("Coverage freshness missed the graph digest cascade");
  }

  const stripCatalog = ({ graphDigest: _graphDigest, semanticDigest: _digest, ...rest }: JsonRecord) => rest;
  requireSame(kernel, stripCatalog(before.catalog), stripCatalog(after.catalog), "Relation publication changed catalog entries or identity");
  const stripStrategy = ({ graphDigest: _graphDigest, coverageDigest: _coverageDigest, testCatalogDigest: _catalogDigest, semanticDigest: _digest, ...rest }: JsonRecord) => rest;
  requireSame(kernel, stripStrategy(before.strategy), stripStrategy(after.strategy), "Relation publication changed strategy content");

  const cascade = {
    graph: { before: before.graph.semanticDigest, after: after.graph.semanticDigest },
    coverage: { before: before.coverage.semanticDigest, after: after.coverage.semanticDigest },
    catalog: { before: before.catalog.semanticDigest, after: after.catalog.semanticDigest },
    strategy: { before: before.strategy.semanticDigest, after: after.strategy.semanticDigest },
    compilation: { before: before.semanticDigest, after: after.semanticDigest },
  };
  for (const [name, digests] of Object.entries(cascade)) {
    if (digests.before === digests.after) throw new Error(`Relation publication missed the ${name} digest cascade`);
  }
  if (
    after.coverage.graphDigest !== after.graph.semanticDigest
    || after.catalog.graphDigest !== after.graph.semanticDigest
    || after.strategy.graphDigest !== after.graph.semanticDigest
    || after.strategy.coverageDigest !== after.coverage.semanticDigest
    || after.strategy.testCatalogDigest !== after.catalog.semanticDigest
  ) throw new Error("Relation publication produced inconsistent graph/catalog/strategy identity bindings");

  return {
    schemaVersion: "graph-consumer-delta.v1",
    valid: true,
    relationId: relation.id,
    unchanged: {
      registrationContext: true,
      profile: true,
      graphNodesAndUnresolved: true,
      retainedEdges: true,
      coverageDenominatorAndContent: true,
      catalogEntriesAndIdentity: true,
      strategyContent: true,
    },
    cascade,
  };
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, JSON.stringify(value, null, 2) + "\n", { flag: "wx", mode: 0o600 });
}

export async function startGraphConsumerExercise(options: {
  readonly beforeRelationApply?: (input: {
    readonly candidate: JsonRecord;
    readonly preview: JsonRecord;
    readonly relation: JsonRecord;
    readonly delta: JsonRecord;
  }) => Promise<JsonRecord> | JsonRecord;
} = {}) {
  const exerciseRoot = await mkdtemp(path.join(await realpath(os.tmpdir()), "qa-graph-consumer-"));
  const journalPath = path.join(exerciseRoot, "controller-http-journal.json");
  let fixture: Awaited<ReturnType<typeof startGraphConsumerFixture>> | undefined;
  let closePromise: Promise<void> | undefined;
  const close = () => {
    closePromise ??= (async () => {
      if (fixture !== undefined) await fixture.close();
      await writeJson(journalPath, fixture?.hits ?? []);
    })();
    return closePromise;
  };

  try {
    fixture = await startGraphConsumerFixture();
    const actorRoots = [path.join(exerciseRoot, "actor-1"), path.join(exerciseRoot, "actor-2")];
    await Promise.all(actorRoots.map((root) => mkdir(root, { recursive: true, mode: 0o700 })));
    const registrations = [];
    for (const actorRoot of actorRoots) {
      registrations.push(await registerAuthoredFixture(fixture.baseUrl, actorRoot, product));
    }
    const kernel = registrations[0].kernel;
    requireSame(kernel, registrations[0].authority, registrations[1].authority, "Independent registrations did not produce the same initial semantic base");

    const actors: JsonRecord[] = [];
    for (const [index, registration] of registrations.entries()) {
      const actorEvidence = path.join(exerciseRoot, "controller", `actor-${index + 1}`);
      await writeJson(path.join(actorEvidence, "initial-authority.json"), registration.authority);
      const built = buildCommonCompilation(registration);
      const candidate = kernel.buildRegistrationKnowledgeRevision(registration.authority, built.compilation);
      await writeJson(path.join(actorEvidence, "common-candidate.json"), candidate);
      const preview = await kernel.previewRegistrationPublication(registration.workspacePath, candidate, registration.workspaceDependencies);
      await writeJson(path.join(actorEvidence, "common-preview.json"), preview);
      const receipt = await kernel.applyRegistrationPublication(registration.workspacePath, candidate, preview.previewDigest, registration.workspaceDependencies);
      const validation = await kernel.validateWorkspace(registration.workspacePath, registration.workspaceDependencies);
      if (validation.valid !== true || validation.publicationAuthorityDigest !== candidate.semanticDigest || validation.workspaceDigest !== receipt.workspaceDigestAfter) {
        throw new Error(`Common-base publication ${index + 1} failed exact managed readback`);
      }
      await writeJson(path.join(actorEvidence, "common-apply-receipt.json"), receipt);
      await writeJson(path.join(actorEvidence, "common-readback.json"), validation);
      actors.push({
        actorRoot: actorRoots[index],
        workspacePath: registration.workspacePath,
        storeRoot: registration.storeRoot,
        baseUrl: fixture.baseUrl,
        registration,
        initialAuthority: registration.authority,
        commonAuthority: candidate,
        commonPreview: preview,
        commonReceipt: receipt,
        currentAuthority: candidate,
        validation,
        ...built,
      });
    }
    requireSame(kernel, actors[0].commonAuthority, actors[1].commonAuthority, "Independent workspaces did not reach the same common base B");
    await writeJson(path.join(exerciseRoot, "controller", "common-base-comparison.json"), {
      schemaVersion: "graph-consumer-common-base.v1",
      equal: true,
      initialAuthorityDigest: actors[0].initialAuthority.semanticDigest,
      commonAuthorityDigest: actors[0].commonAuthority.semanticDigest,
      compilationDigest: actors[0].commonAuthority.compilation.semanticDigest,
    });

    const changedActorIndex = 1;
    const changed = actors[changedActorIndex];
    const relationBuild = buildRelationCompilation(changed.registration, changed.commonAuthority.compilation, changed);
    const relationEvidence = path.join(exerciseRoot, "controller", "relation-publication");
    await writeJson(path.join(relationEvidence, "proposed-relation.json"), relationBuild.relation);
    const relationCandidate = kernel.buildRegistrationKnowledgeRevision(changed.commonAuthority, relationBuild.compilation);
    await writeJson(path.join(relationEvidence, "candidate-authority.json"), relationCandidate);
    const delta = verifyRelationOnlyDelta(kernel, changed.commonAuthority.compilation, relationCandidate.compilation, relationBuild.relation);
    await writeJson(path.join(relationEvidence, "pre-apply-delta-verification.json"), delta);
    const relationPreview = await kernel.previewRegistrationPublication(changed.workspacePath, relationCandidate, changed.registration.workspaceDependencies);
    await writeJson(path.join(relationEvidence, "preview.json"), relationPreview);
    const preApplyDecision = options.beforeRelationApply === undefined
      ? {
        approved: true,
        kind: "task-authorized-synthetic-preparation",
        limitation: "No independent controller review callback was supplied.",
      }
      : await options.beforeRelationApply({
        candidate: relationCandidate,
        preview: relationPreview,
        relation: relationBuild.relation,
        delta,
      });
    if (preApplyDecision.approved !== true) throw new Error("Controller did not approve the exact relation candidate and preview");
    await writeJson(path.join(relationEvidence, "pre-apply-decision.json"), preApplyDecision);
    const relationReceipt = await kernel.applyRegistrationPublication(
      changed.workspacePath,
      relationCandidate,
      relationPreview.previewDigest,
      changed.registration.workspaceDependencies,
    );
    const relationValidation = await kernel.validateWorkspace(changed.workspacePath, changed.registration.workspaceDependencies);
    if (relationValidation.valid !== true || relationValidation.publicationAuthorityDigest !== relationCandidate.semanticDigest || relationValidation.workspaceDigest !== relationReceipt.workspaceDigestAfter) {
      throw new Error("Reviewed relation publication failed exact managed readback");
    }
    Object.assign(changed, {
      currentAuthority: relationCandidate,
      preview: relationPreview,
      preApplyDecision,
      receipt: relationReceipt,
      validation: relationValidation,
    });
    await writeJson(path.join(relationEvidence, "apply-receipt.json"), relationReceipt);
    await writeJson(path.join(relationEvidence, "readback.json"), relationValidation);
    await writeJson(path.join(relationEvidence, "delta-verification.json"), delta);

    const briefBytes = await readFile(new URL("./product-brief.md", import.meta.url));
    for (const actor of actors) {
      const briefPath = path.join(actor.actorRoot, "product-brief.md");
      await writeFile(briefPath, briefBytes, { flag: "wx", mode: 0o600 });
      const packet = {
        sourceRoot,
        consolePath: path.join(sourceRoot, "components/console"),
        kernelPath: path.join(sourceRoot, "components/kernel"),
        actorRoot: actor.actorRoot,
        workspacePath: actor.workspacePath,
        storeRoot: actor.storeRoot,
        productSlug: PRODUCT_SLUG,
        baseUrl: fixture.baseUrl,
        briefPath,
        requestedJourneyName: JOURNEY_NAME,
        graphPath: path.join(actor.workspacePath, "model/product.graph.json"),
        catalogPath: path.join(actor.workspacePath, "model/test-catalog.json"),
      };
      const packetPath = path.join(actor.actorRoot, "actor-context.json");
      await writeJson(packetPath, packet);
      Object.assign(actor, { briefPath, packetPath });
    }

    const preparationPath = path.join(exerciseRoot, "controller", "preparation.json");
    await writeJson(preparationPath, {
      schemaVersion: "graph-consumer-preparation.v1",
      baseUrl: fixture.baseUrl,
      productSlug: PRODUCT_SLUG,
      changedActorIndex,
      relation: relationBuild.relation,
      initialAuthorityDigest: actors[0].initialAuthority.semanticDigest,
      commonAuthorityDigest: actors[0].commonAuthority.semanticDigest,
      candidateAuthorityDigest: relationCandidate.semanticDigest,
      previewDigest: relationPreview.previewDigest,
      appliedWorkspaceDigest: relationReceipt.workspaceDigestAfter,
      readbackAuthorityDigest: relationValidation.publicationAuthorityDigest,
      delta,
      actorPacketPaths: actors.map((actor) => actor.packetPath),
    });
    return {
      sourceRoot,
      exerciseRoot,
      baseUrl: fixture.baseUrl,
      actors,
      changedActorIndex,
      targets: { journeyId: actors[0].journeyId, invariantId: actors[0].invariantId },
      checks: { journeyCheckId: actors[0].journeyCheckId, invariantCheckId: actors[0].invariantCheckId },
      relation: relationBuild.relation,
      delta,
      preparationPath,
      journalPath,
      close,
    };
  } catch (error) {
    await close().catch(() => undefined);
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Graph-consumer preparation failed (${detail}); artifacts retained at ${exerciseRoot}`, { cause: error });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exercise = await startGraphConsumerExercise();
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await exercise.close();
    console.log(JSON.stringify({ status: "stopped", journalPath: exercise.journalPath }));
  };
  process.once("SIGINT", () => void stop().catch((error) => { console.error(error); process.exitCode = 1; }));
  process.once("SIGTERM", () => void stop().catch((error) => { console.error(error); process.exitCode = 1; }));
  console.log(JSON.stringify({
    status: "ready",
    pid: process.pid,
    baseUrl: exercise.baseUrl,
    preparationPath: exercise.preparationPath,
    packetPaths: exercise.actors.map((actor: JsonRecord) => actor.packetPath),
  }));
}
