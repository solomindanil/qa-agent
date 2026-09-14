import path from "node:path";
import { registerAuthoredFixture, rehashCompilation, publishAuthoredCompilation } from "../../components/console/tests/fixtures/nuanu-readonly/fixture.ts";
import { readCampaignWorkspace, writeNewCampaignPlan } from "../../components/console/src/node/qa-campaign-files.ts";
import { validateCampaignClosure, type QaCampaignPlanV0 } from "../../components/console/src/lib/qa-campaign-v0.ts";

// The existing controlled registration fixture exposes dynamic Kernel records.
type RecordValue = Record<string, any>;

/** Local qualification setup through real Kernel publication; never product onboarding. */
export async function registerContinuationWorkspace(target: { readonly baseUrl: string }, root: string) {
  const fixture = await registerAuthoredFixture(target.baseUrl, root, {
    productSlug: "continuation-owned-fixture",
    name: "Owned continuation API",
    description: "Three fixed anonymous repeat-safe reads for interrupted campaign qualification.",
    surfaces: [{ kind: "api", name: "Owned repeat-safe API" }],
    journeys: [{ name: "Read the three fixture checks", expectedOutcome: "A, B and C return their matching check and ok true." }],
    authoredJourneyName: "Read the three fixture checks",
  });
  const { kernel } = fixture;
  const next = structuredClone(fixture.authority.compilation) as RecordValue;
  const journey = next.graph.nodes.find((node: RecordValue) => node.id === fixture.authoredTargetId);
  if (!journey) throw new Error("Registered fixture journey missing");
  const replaced = next.catalog.entries.filter((entry: RecordValue) => entry.targetIds.includes(journey.id));
  if (replaced.some((entry: RecordValue) => entry.targetIds.length !== 1)) {
    throw new Error("Fixture replacement must not alter shared target coverage");
  }
  const oldChecks = new Set(replaced.map((entry: RecordValue) => entry.checkId));
  const oldEntries = new Set(replaced.map((entry: RecordValue) => entry.entryId));
  next.graph.nodes = next.graph.nodes.filter((node: RecordValue) => !oldChecks.has(node.id));
  next.graph.edges = next.graph.edges.filter((edge: RecordValue) => !oldChecks.has(edge.from) && !oldChecks.has(edge.to));
  next.catalog.entries = next.catalog.entries.filter((entry: RecordValue) => !oldEntries.has(entry.entryId));
  for (const field of ["proposedAutomatedChecks", "manualHandoffs", "unresolvedOracles"]) {
    next.strategy[field] = next.strategy[field].filter((entry: RecordValue) => !oldEntries.has(entry.catalogEntryId));
  }
  const definitions = ["A", "B", "C"].map(check => ({
    check,
    checkId: kernel.stableId("check", { fixture: "continuation-owned-fixture", check }),
    expectation: `GET /${check} returns status 200, check ${check}, and ok true.`,
  }));
  const coverage = next.coverage.items.find((item: RecordValue) => item.targetId === journey.id);
  if (!coverage) throw new Error("Registered fixture coverage missing");
  coverage.status = "automated";
  coverage.verificationMode = "automated";
  coverage.checkIds = definitions.map(definition => definition.checkId);
  next.coverage.unresolved = next.coverage.unresolved.filter((entry: RecordValue) => entry.targetId !== journey.id);
  for (const definition of definitions) {
    const entryId = kernel.stableId("catalog-entry", { checkId: definition.checkId });
    next.graph.nodes.push({ ...journey, id: definition.checkId, kind: "automated_check", coverageTarget: false,
      name: `Owned ${definition.check} API assertion` });
    next.graph.edges.push({ id: kernel.stableId("edge", { checkId: definition.checkId, targetId: journey.id }),
      kind: "verifies", from: definition.checkId, to: journey.id, reviewStatus: "reviewed", assuranceLevel: "declared",
      provenance: journey.provenance, semanticDigest: kernel.digestCanonical("pending") });
    next.catalog.entries.push({ entryId, checkId: definition.checkId, targetIds: [journey.id], executionKind: "automated",
      runnerId: "playwright", candidatePath: "tests/api/generated/registration.candidates.spec.ts", requiredSecretRefs: [],
      sideEffectClasses: ["read_only"], expectedEvidenceTypes: ["http_response"],
      oracle: { state: "resolved", description: definition.expectation }, provenance: journey.provenance });
    next.strategy.proposedAutomatedChecks.push({ proposalId: kernel.stableId("proposal", { entryId }), catalogEntryId: entryId,
      checkId: definition.checkId, targetIds: [journey.id], reason: "Known owned fixture contract." });
  }
  next.strategy.sideEffectClasses = [...new Set(next.catalog.entries.flatMap((entry: RecordValue) => entry.sideEffectClasses))];
  next.strategy.expectedEvidenceTypes = [...new Set(next.catalog.entries.flatMap((entry: RecordValue) => entry.expectedEvidenceTypes))];
  const authority = await publishAuthoredCompilation(fixture, rehashCompilation(kernel, next));
  const workspace = await readCampaignWorkspace(fixture.workspacePath);
  const plan: QaCampaignPlanV0 = {
    schemaVersion: "qa-campaign.v0", productSlug: "continuation-owned-fixture", baseUrl: target.baseUrl,
    graphDigest: workspace.graph.semanticDigest,
    checks: definitions.map(definition => ({
      checkId: definition.checkId, title: `Owned fixture ${definition.check}`, targetIds: [journey.id],
      disposition: "executable", sideEffectClass: "read_only", surface: "api", kind: "api", method: "GET",
      path: `/${definition.check}`, preconditions: ["Use only the trusted owned continuation fixture."],
      reproductionSteps: [`GET /${definition.check}`], expectedBehavior: definition.expectation,
      severity: "medium", severityJustification: "Controlled recovery check; not a production incident severity.",
      assertions: [{ kind: "status", value: 200 }, { kind: "json_path", path: "$.check", value: definition.check },
        { kind: "json_path", path: "$.ok", value: true }],
    })),
    blockers: workspace.graph.nodes.filter(node => node.coverageTarget && node.id !== journey.id).map(node => {
      const catalogCheckIds = workspace.catalog.entries.filter(entry => entry.targetIds.includes(node.id)).map(entry => entry.checkId).sort();
      return { targetId: node.id, ...(catalogCheckIds.length ? { catalogCheckIds } : {}), disposition: "blocked" as const,
        reason: "Owned continuation fixture does not exercise this retained registered target.",
        recovery: "Provide target-specific capability and evidence; preserve the original denominator." };
    }).sort((left, right) => left.targetId.localeCompare(right.targetId)),
  };
  validateCampaignClosure({ graph: workspace.graph, catalog: workspace.catalog, plan,
    expectedProductSlug: plan.productSlug, allowedBaseUrls: [plan.baseUrl], approvalReceipts: [] });
  const planPath = path.join(fixture.workspacePath, "tests", "qa-campaign.v0.json");
  await writeNewCampaignPlan(fixture.workspacePath, planPath, plan);
  const validation = await kernel.validateWorkspace(fixture.workspacePath, fixture.workspaceDependencies);
  if (validation.valid !== true || validation.publicationAuthorityDigest !== authority.semanticDigest) {
    throw new Error("Actual registered continuation plan/publication did not validate");
  }
  return { fixture, validation, authority, workspacePath: fixture.workspacePath, planPath, plan,
    graph: workspace.graph, catalog: workspace.catalog };
}
