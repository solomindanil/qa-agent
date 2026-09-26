import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { registerAuthoredFixture, rehashCompilation } from "../../components/console/tests/fixtures/nuanu-readonly/fixture.ts";
import { startW4AgentChangeScopeFixture } from "./fixture.mjs";

type RecordValue = Record<string, any>;
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const productSlug = "cedar-public-catalog-w4";
const expectations = {
  A: "GET /api/catalog returns HTTP 200 with catalogName Cedar and ready true.",
  B: "GET /api/catalog-integrity returns HTTP 200 with unlabeledItemCount 0.",
  C: "GET /api/catalog-publication returns HTTP 200 with staleItemCount 0.",
};
const product = {
  productSlug,
  name: "Cedar public catalog",
  description: "Public read-only Cedar catalog API. GET /api/catalog returns HTTP 200 with catalogName Cedar and ready true. Independently, GET /api/catalog-integrity returns HTTP 200 with unlabeledItemCount 0, and GET /api/catalog-publication returns HTTP 200 with staleItemCount 0. The API-wide surface has no finite public oracle and remains unsupported. For an unmapped behavioral change, owner approval is to run the complete known safe public GET check set while retaining the mapping gap and unsupported areas.",
  surfaces: [{ kind: "api" as const, name: "Cedar API-wide surface" }],
  journeys: [{ name: "Read the public Cedar catalog", expectedOutcome: expectations.A }],
  authoredJourneyName: "Read the public Cedar catalog",
};

async function createOnly(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + "\n", { flag: "wx", mode: 0o600 });
}

function buildCompilation(registration: RecordValue) {
  const { kernel } = registration;
  const next = structuredClone(registration.authority.compilation) as RecordValue;
  const targets = next.graph.nodes.filter((node: RecordValue) => node.coverageTarget);
  if (targets.length !== 2) throw new Error(`Registration created ${targets.length} targets, expected exactly A and D before augmentation`);
  const A = targets.find((node: RecordValue) => node.id === registration.authoredTargetId);
  const D = targets.find((node: RecordValue) => node.kind === "surface" && node.subkind === "surface:api");
  if (!A || A.kind !== "journey" || !D) throw new Error("Exact authored journey and generated API-wide surface were not preserved");
  const dEntries = next.catalog.entries.filter((entry: RecordValue) => entry.targetIds.includes(D.id));
  if (dEntries.length !== 1 || dEntries[0].oracle.state === "resolved") throw new Error("Generated D candidate is missing or unexpectedly resolved");
  const originalA = next.catalog.entries.filter((entry: RecordValue) => entry.targetIds.includes(A.id));
  if (originalA.length !== 0) throw new Error("Selected compiler unexpectedly generated an A candidate; review the complete catalog before changing it");
  const B = { ...structuredClone(A), id: kernel.stableId("invariant", { fixture: productSlug, key: "B" }), kind: "invariant", subkind: "invariant", name: "Published catalog entries have labels" };
  const C = { ...structuredClone(A), id: kernel.stableId("invariant", { fixture: productSlug, key: "C" }), kind: "invariant", subkind: "invariant", name: "Public catalog publication is fresh" };
  next.graph.nodes.push(B, C);
  next.graph.edges.push({ id: kernel.stableId("edge", { fixture: productSlug, relation: "A-requires-B" }), kind: "requires", from: A.id, to: B.id, reviewStatus: "reviewed", assuranceLevel: "declared", provenance: A.provenance, semanticDigest: kernel.digestCanonical("pending") });
  const targetMap = { A: A.id, B: B.id, C: C.id, D: D.id };
  const checks: Record<string, string> = {};
  const aCoverage = next.coverage.items.find((item: RecordValue) => item.targetId === A.id);
  if (!aCoverage) throw new Error("A coverage item missing");
  for (const name of ["A", "B", "C"] as const) {
    const target = { A, B, C }[name];
    const checkId = kernel.stableId("check", { fixture: productSlug, target: name });
    const entryId = kernel.stableId("catalog-entry", { fixture: productSlug, checkId });
    checks[name] = checkId;
    next.graph.nodes.push({ ...structuredClone(target), id: checkId, kind: "automated_check", coverageTarget: false, name: `${name} public GET assertion`, semanticDigest: kernel.digestCanonical("pending") });
    next.graph.edges.push({ id: kernel.stableId("edge", { fixture: productSlug, checkId, targetId: target.id }), kind: "verifies", from: checkId, to: target.id, reviewStatus: "reviewed", assuranceLevel: "declared", provenance: target.provenance, semanticDigest: kernel.digestCanonical("pending") });
    next.catalog.entries.push({ entryId, checkId, targetIds: [target.id], executionKind: "automated", runnerId: "playwright", candidatePath: "tests/api/generated/registration.candidates.spec.ts", requiredSecretRefs: [], sideEffectClasses: ["read_only"], expectedEvidenceTypes: ["http_response"], oracle: { state: "resolved", description: expectations[name] }, provenance: target.provenance });
    next.strategy.proposedAutomatedChecks.push({ proposalId: kernel.stableId("proposal", { fixture: productSlug, entryId }), catalogEntryId: entryId, checkId, targetIds: [target.id], reason: "Reviewed distinct public read-only GET contract." });
    const item = name === "A" ? aCoverage : { ...structuredClone(aCoverage), targetId: target.id, provenance: target.provenance };
    item.status = "automated";
    item.verificationMode = "automated";
    item.checkIds = [checkId];
    item.reason = "Resolved independent public read-only GET oracle; registration is not execution evidence.";
    if (name !== "A") next.coverage.items.push(item);
  }
  next.coverage.unresolved = next.coverage.unresolved.filter((item: RecordValue) => item.targetId !== A.id);
  next.strategy.sideEffectClasses = [...new Set(next.catalog.entries.flatMap((entry: RecordValue) => entry.sideEffectClasses))];
  next.strategy.expectedEvidenceTypes = [...new Set(next.catalog.entries.flatMap((entry: RecordValue) => entry.expectedEvidenceTypes))];
  const compilation = rehashCompilation(kernel, next);
  if (compilation.coverage.items.length !== 4 || compilation.catalog.entries.length !== 4 || compilation.catalog.entries.find((entry: RecordValue) => entry.checkId === dEntries[0].checkId)?.oracle.state === "resolved") throw new Error("Exact four-target denominator or unresolved D was not retained");
  return { compilation, targets: targetMap, checks };
}

function observation(kernel: RecordValue, authority: RecordValue, targets: RecordValue, checks: RecordValue, response: RecordValue) {
  const entry = authority.compilation.catalog.entries.find((item: RecordValue) => item.checkId === checks.A);
  const candidateIdentity = { state: "known", value: { candidateRevision: "v1" } };
  const environmentIdentity = { state: "known", value: { candidateRevision: "v1" } };
  const captureTime = new Date().toISOString();
  const payload = { schemaVersion: "agent-tool-observation.v1", provenance: "agent_authored_unattested", scope: "Cedar public catalog read", expectedBehavior: expectations.A, expectationBasis: "Reviewed source contract and current resolved catalog oracle.", actual: `Caller reports HTTP ${response.status} with ${JSON.stringify(response.body)}.`, result: "passed", tool: "controller/read-only-http", author: { agent: "w4-preparation-controller", host: "codex", authoredAt: captureTime }, limitations: ["Caller-authored/unattested; actual HTTP response archived separately by controller.", "Candidate v1 does not attest candidate v2."], attachments: [] };
  const artifactBytes = Buffer.from(JSON.stringify(payload), "utf8");
  const evidenceId = kernel.stableId("evidence", { fixture: productSlug, target: "A", revision: "v1" });
  const token = evidenceId.slice(evidenceId.lastIndexOf(":") + 1);
  const value = { schemaVersion: "evidence-manifest.v1", planDigest: authority.compilation.strategy.semanticDigest, redactionPolicyVersion: "kernel-secret-policy.v1", entries: [{ evidenceId, kind: "agent_tool_observation", adapterId: "agent/tool", checkId: checks.A, stepId: "observe-public-catalog-v1", candidateDigest: kernel.digestCanonical(candidateIdentity), environmentDigest: kernel.digestCanonical(environmentIdentity), captureTime, rawPrivatePath: `.qa-private/evidence/agent-tool-observations/${token}/artifact.json`, byteSize: artifactBytes.byteLength, contentDigest: kernel.digestBytes(artifactBytes), redactionStatus: "passed", retentionClass: "private_observation", metadata: { publicationAuthorityDigest: authority.semanticDigest, requirementId: targets.A, oracleDigest: kernel.digestCanonical(entry.oracle), candidateIdentity, environmentIdentity, identityProvenance: "caller_declared", observationProvenance: "agent_authored_unattested", provenanceLimitation: "Digests prove stored-byte integrity only; they do not attest tool invocation or live deployment identity." } }] };
  const manifest = kernel.EvidenceManifestV1Schema.parse({ ...value, semanticDigest: kernel.digestCanonical(kernel.projectEvidenceManifestSemantics(value)) });
  return { manifest, artifactBytes };
}

async function getJson(baseUrl: string, route: string) {
  const response = await fetch(new URL(route, baseUrl));
  return { status: response.status, body: await response.json() };
}

export async function startW4AgentChangeScopePreparation() {
  const exerciseRoot = await mkdtemp(path.join(await realpath(os.tmpdir()), "qa-w4-preparation-"));
  const journalPath = path.join(exerciseRoot, "controller", "http-journal.json");
  let fixture: Awaited<ReturnType<typeof startW4AgentChangeScopeFixture>> | undefined;
  let closePromise: Promise<void> | undefined;
  const close = () => closePromise ??= (async () => {
    if (fixture) { await fixture.close(); await createOnly(journalPath, fixture.getJournal()); }
  })();
  try {
    fixture = await startW4AgentChangeScopeFixture();
    const actors = [];
    for (const [index, dossier] of ["change-mapped.md", "change-unmapped.md"].entries()) {
      const actorRoot = path.join(exerciseRoot, `actor-${index + 1}`);
      await mkdir(actorRoot, { recursive: true, mode: 0o700 });
      const registration = await registerAuthoredFixture(fixture.baseUrl, actorRoot, product);
      const { kernel } = registration;
      const built = buildCompilation(registration);
      const authority = kernel.buildRegistrationKnowledgeRevision(registration.authority, built.compilation);
      const preview = await kernel.previewRegistrationPublication(registration.workspacePath, authority, registration.workspaceDependencies);
      const receipt = await kernel.applyRegistrationPublication(registration.workspacePath, authority, preview.previewDigest, registration.workspaceDependencies);
      const validation = await kernel.validateWorkspace(registration.workspacePath, registration.workspaceDependencies);
      if (validation.valid !== true || validation.publicationAuthorityDigest !== authority.semanticDigest || validation.workspaceDigest !== receipt.workspaceDigestAfter) throw new Error("Managed publication failed exact validateWorkspace readback");
      await createOnly(path.join(exerciseRoot, "controller", `actor-${index + 1}-publication.json`), { initial: registration.authority, authority, preview, receipt, validation });
      actors.push({ actorRoot, workspacePath: registration.workspacePath, baseUrl: fixture.baseUrl, dossier, registration, authority, validation, targets: built.targets, checks: built.checks });
    }
    const kernel = actors[0].registration.kernel;
    if (kernel.canonicalJson(actors[0].authority.compilation) !== kernel.canonicalJson(actors[1].authority.compilation)) throw new Error("Actor graph/catalog/strategy semantic bytes differ");
    const v1Environment = await getJson(fixture.baseUrl, "/api/environment");
    const v1Catalog = await getJson(fixture.baseUrl, "/api/catalog");
    if (v1Environment.status !== 200 || v1Environment.body.candidateRevision !== "v1" || v1Catalog.status !== 200 || v1Catalog.body.catalogName !== "Cedar" || v1Catalog.body.ready !== true) throw new Error("Real v1 controller readback contradicts source contract");
    await createOnly(path.join(exerciseRoot, "controller", "v1-http-responses.json"), { v1Environment, v1Catalog });
    for (const actor of actors) {
      const authored = observation(kernel, actor.authority, actor.targets, actor.checks, v1Catalog);
      const recorded = await kernel.recordAgentToolObservation({ workspacePath: actor.workspacePath, ...authored }, actor.registration.workspaceDependencies);
      if (recorded.currentBinding !== "current") throw new Error("v1 observation lacked current publication binding");
      await createOnly(path.join(exerciseRoot, "controller", `${path.basename(actor.actorRoot)}-observation-write.json`), { manifest: authored.manifest, readback: { paths: recorded.paths, currentBinding: recorded.currentBinding, payload: recorded.payload } });
      Object.assign(actor, { evidenceId: authored.manifest.entries[0].evidenceId });
    }
    fixture.setCandidateRevision("v2");
    const v2Environment = await getJson(fixture.baseUrl, "/api/environment");
    if (v2Environment.status !== 200 || v2Environment.body.candidateRevision !== "v2") throw new Error("v2 fixture identity readback failed");
    await createOnly(path.join(exerciseRoot, "controller", "v2-http-response.json"), v2Environment);
    for (const actor of actors) {
      const direct = await kernel.readAgentToolObservation({ workspacePath: actor.workspacePath, evidenceId: actor.evidenceId }, actor.registration.workspaceDependencies);
      const report = await kernel.readTargetObservationReport({ workspacePath: actor.workspacePath }, actor.registration.workspaceDependencies);
      if (direct.currentBinding !== "current" || report.targets.length !== 4 || report.diagnostics.length !== 0 || report.publicationAuthorityDigest !== actor.authority.semanticDigest || report.strategyDigest !== actor.authority.compilation.strategy.semanticDigest) throw new Error("Post-v2 observation readback failed exact current publication binding");
      const observed = report.targets.find((row: RecordValue) => row.targetId === actor.targets.A);
      if (observed?.observations.length !== 1 || observed.observations[0].identity.candidate.value.candidateRevision !== "v1" || report.targets.filter((row: RecordValue) => row.targetId !== actor.targets.A).some((row: RecordValue) => row.observationState !== "not_observed")) throw new Error("Observation report lost v1/complete-denominator distinction");
      const actorNumber = path.basename(actor.actorRoot);
      await createOnly(path.join(exerciseRoot, "controller", `${actorNumber}-observation-readback.json`), { direct: { currentBinding: direct.currentBinding, payload: direct.payload, manifest: direct.manifest }, report });
      const briefPath = path.join(actor.actorRoot, "product-brief.md");
      const dossierPath = path.join(actor.actorRoot, actor.dossier);
      const observationReportPath = path.join(actor.actorRoot, "observation-report.json");
      await createOnly(briefPath, await readFile(new URL("./product-brief.md", import.meta.url)));
      await createOnly(dossierPath, await readFile(new URL(`./${actor.dossier}`, import.meta.url)));
      await createOnly(observationReportPath, report);
      const packet = { skillPath: path.join(sourceRoot, "components/console/skills/qa-product-v0/SKILL.md"), graphPath: path.join(actor.workspacePath, "model/product.graph.json"), catalogPath: path.join(actor.workspacePath, "model/test-catalog.json"), observationReportPath, briefPath, dossierPath, baseUrl: fixture.baseUrl, planPath: path.join(actor.actorRoot, "qa-campaign.v0.json"), outputPath: path.join(actor.actorRoot, "first-answer.md") };
      const packetPath = path.join(actor.actorRoot, "actor-context.json");
      await createOnly(packetPath, packet);
      Object.assign(actor, { report, packetPath, dossierPath });
    }
    const preparationPath = path.join(exerciseRoot, "controller", "preparation.json");
    await createOnly(preparationPath, { schemaVersion: "w4-preparation.v1", baseUrl: fixture.baseUrl, targets: actors[0].targets, checks: actors[0].checks, publicationDigest: actors[0].authority.semanticDigest, strategyDigest: actors[0].authority.compilation.strategy.semanticDigest, v1Environment, v1Catalog, v2Environment, actorPacketPaths: actors.map(actor => actor.packetPath) });
    return { exerciseRoot, baseUrl: fixture.baseUrl, actors, targets: actors[0].targets, checks: actors[0].checks, v1Environment, v1Catalog, v2Environment, preparationPath, journalPath, setWorldMode: (mode: "healthy" | "mapped_broken" | "unmapped_broken") => fixture!.setWorldMode(mode), close };
  } catch (error) { await close(); throw error; }
}
