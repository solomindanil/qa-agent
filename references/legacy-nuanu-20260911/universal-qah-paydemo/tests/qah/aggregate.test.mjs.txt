import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { aggregateEvidence, resolveArtifactVersionForSlot, validateFullTestPlan } from "../../scripts/qah/aggregate.mjs";
import { classifyGraphCriticality, createSyntheticGraphPlan } from "../../scripts/qah/graph-plan.mjs";
import { parseProfileBytes } from "../../scripts/qah/profile.mjs";

const qtest = import.meta.url.includes("fixtures-only") ? () => {} : test;
const BRANCHES = ["code", "api", "ui", "domain"];
const commit = "a".repeat(40);
const contentHash = `sha256:${"c".repeat(64)}`;
const nonce = "11111111-1111-4111-8111-111111111111";
const repositoryOrigin = "https://example.test/generic/product.git";
const runId = "99999999-9999-4999-8999-999999999999";
const attemptId = "attempt-1";
const workspaceId = "22222222-2222-4222-8222-222222222222";
const projectId = "55555555-5555-4555-8555-555555555555";
const workItemId = "66666666-6666-4666-8666-666666666666";
const sourceArtifact = {
  artifact_id: "33333333-3333-4333-8333-333333333333",
  version_id: "44444444-4444-4444-8444-444444444444",
  kind: "flow_item",
  role: "source",
};
const PROFILE_PATH = "qa-harness.yaml";

const evidenceKinds = {
  code: ["repository-diff", "static-analysis"],
  api: ["api-contract", "automated-api-test"],
  ui: ["playwright", "screenshot"],
  domain: ["domain-data", "sandbox-test"],
};
const passCodes = { code: "COMMAND_PASSED", api: "API_CONTRACT_VERIFIED", ui: "UI_FLOW_VERIFIED", domain: "DOMAIN_RULE_VERIFIED" };
const systemRoles = new Set(["output", "implementation", "evidence", "source"]);

function uuidFor(value) {
  return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function refKey(ref) {
  return `${ref.artifact_id}@${ref.version_id}`;
}

function digestBytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function profile(overrides = {}) {
  return {
    schema_version: "nuanu.qa-project-profile.v1",
    project_key: "generic-product",
    repository: { allowed_origin: repositoryOrigin },
    environment: { strategy: "managed_command", prepare_command: ["node", "prepare.mjs"], cleanup_command: ["node", "cleanup.mjs"], health_path: "/build-info" },
    checks: { code: ["npm", "run", "typecheck"], api: ["node", "adapter.mjs", "api"], ui: ["node", "adapter.mjs", "ui"], domain: ["node", "adapter.mjs", "domain"] },
    outcome_codes: {
      code: { pass: ["COMMAND_PASSED"], fail: ["COMMAND_FAILED"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
      api: { pass: ["API_CONTRACT_VERIFIED"], fail: ["API_CONTRACT_VIOLATION"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
      ui: { pass: ["UI_FLOW_VERIFIED"], fail: ["UI_CONTRACT_VIOLATION"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
      domain: { pass: ["DOMAIN_RULE_VERIFIED"], fail: ["DOMAIN_CONTRACT_VIOLATION"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
    },
    safety: { mutation_mode: "sandbox_only", irreversible_actions: "deny", secret_output: "deny", allowed_origins: ["http://127.0.0.1:4173"] },
    execution: { shell: false, environment: "minimal", timeout_ms: 2_000, max_output_bytes: 32_768 },
    test_data: { profiles: ["default", "sandbox"] },
    areas: { ui: { paths: ["web/**"], labels: ["ui"] }, api: { paths: ["server/**"], labels: ["api"] }, domain: { paths: ["domain/**"], labels: ["domain"] } },
    risk: { confidence_threshold: 0.95 },
    ...overrides,
  };
}

function plan(rawProfile, applicability = { code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "REQUIRED" }) {
  const artifactSlot = {
    schema_version: "nuanu.qa-test-plan.v1",
    project_key: rawProfile.project_key,
    commit,
    profile_digest: sha256(rawProfile),
    branches: BRANCHES.filter((branch) => applicability[branch] === "REQUIRED"),
  };
  const unsigned = {
    ...artifactSlot,
    source_artifact: { ...sourceArtifact },
    content_hash: contentHash,
    applicability,
    branch_reasons: Object.fromEntries(BRANCHES.map((branch) => [branch, applicability[branch] === "REQUIRED" ? [{ code: branch === "code" ? "ALWAYS_CODE" : "PATH_RULE" }] : []])),
    expected_evidence: Object.fromEntries(BRANCHES.map((branch) => [branch, applicability[branch] === "REQUIRED" ? evidenceKinds[branch] : []])),
    risk_level: "MEDIUM",
    artifact_slot: artifactSlot,
  };
  return { ...unsigned, plan_sha256: sha256(unsigned) };
}

function graphEvent(projectKey) {
  return {
    schema_version: "nuanu.qa-column-ticket-event.v1",
    event_id: "event-generic-101-ready-for-qa",
    ticket_id: "GEN-101",
    project_key: projectKey,
    from_state: "in_progress",
    to_state: "ready_for_qa",
    candidate: {
      candidate_id: "candidate-profile-change",
      candidate_revision: sha256("offline-candidate-profile-change"),
      environment_id: "offline-generic",
      change_hints: ["profile-api", "profile-ui"],
    },
    triggered_at: "2026-08-12T00:00:00.000Z",
  };
}

function graphBinding(event, graphPlan) {
  return {
    schema_version: "nuanu.qa-graph-binding.v1",
    event_id: event.event_id,
    ticket_id: event.ticket_id,
    candidate_id: event.candidate.candidate_id,
    candidate_revision: event.candidate.candidate_revision,
    graph_revision: graphPlan.graph_revision,
    graph_digest: graphPlan.graph_digest,
    knowledge_revision: graphPlan.knowledge_revision,
    knowledge_digest: graphPlan.knowledge_digest,
    graph_plan_digest: graphPlan.plan_digest,
    criticality: classifyGraphCriticality(graphPlan).status,
  };
}

function readyReceipt(overrides = {}) {
  const environmentId = overrides.environment_id ?? "generic-env";
  const targetNamespace = overrides.target_namespace ?? sha256({ run_id: runId, attempt_id: attemptId, environment_id: environmentId }).slice(7);
  const directory = `/tmp/qah/${targetNamespace}`;
  return {
    environment_status: "READY",
    run_id: runId,
    attempt_id: attemptId,
    environment_id: environmentId,
    target_namespace: targetNamespace,
    repository_origin: repositoryOrigin,
    commit,
    content_hash: contentHash,
    instance_nonce: nonce,
    base_url: "http://127.0.0.1:4173",
    pid_file: `${directory}/server.pid`,
    state_file: `${directory}/environment.json`,
    ...overrides,
  };
}

function materialize(store, { index, semanticRole, payload, bytes, metadata = {}, role = "output" }) {
  assert.equal(systemRoles.has(role), true);
  const immutableBytes = bytes ?? Buffer.from(canonicalJson(payload));
  const artifactId = uuidFor(index * 2 + 10);
  const versionId = uuidFor(index * 2 + 11);
  const name = semanticRole === "project_profile" ? PROFILE_PATH : `${semanticRole.replaceAll("_", "-")}.json`;
  const mediaType = semanticRole === "project_profile" ? "application/yaml" : "application/json";
  const record = {
    workspace_id: workspaceId,
    enforced_max_bytes: null,
    byte_length: immutableBytes.byteLength,
    links: [],
    artifact: {
      id: artifactId,
      workspace_id: workspaceId,
      status: "stored",
      current_version: versionId,
      kind: "document",
      name,
      mime_type: mediaType,
      versions: [{
        id: versionId,
        version: 1,
        file_asset: uuidFor(index * 2 + 12),
        size: immutableBytes.byteLength,
        checksum: createHash("sha256").update(immutableBytes).digest("hex"),
      }],
    },
    bytes: immutableBytes,
    ...metadata,
  };
  const ref = { artifact_id: artifactId, version_id: versionId, kind: "document", role };
  store.set(refKey(ref), record);
  return ref;
}

export function material(store, ref) {
  return store.get(refKey(ref));
}

function registerSourceMaterial(store) {
  const representation = {
    type: "platform_entity",
    entityType: "work_item",
    entityId: workItemId,
    snapshot: { id: workItemId, project_id: projectId },
  };
  const observedBytes = Buffer.byteLength(canonicalJson(representation), "utf8");
  store.set(refKey(sourceArtifact), {
    workspace_id: workspaceId,
    enforced_max_bytes: null,
    observed_bytes: observedBytes,
    artifact: {
      id: sourceArtifact.artifact_id,
      workspace_id: workspaceId,
      status: "stored",
      current_version: sourceArtifact.version_id,
      kind: "flow_item",
      name: "flow-item.json",
      mime_type: "application/vnd.nuanu.flow-item+json",
      metadata: { project_id: projectId, work_item_id: workItemId },
      links: [
        { entity_type: "project", entity_id: projectId, relation: "about" },
        { entity_type: "work_item", entity_id: workItemId, relation: "about" },
      ],
      versions: [{
        id: sourceArtifact.version_id,
        version: 1,
        file_asset: null,
        representation,
      }],
    },
  });
}

export function platformMaterial(store, ref) {
  return store.get(refKey(ref));
}

export function rewriteMaterial(store, ref, payload, metadata = {}) {
  const old = material(store, ref);
  const bytes = Buffer.from(canonicalJson(payload));
  store.set(refKey(ref), {
    ...old,
    byte_length: bytes.byteLength,
    bytes,
    artifact: {
      ...old.artifact,
      versions: old.artifact.versions.map((version) => version.id === ref.version_id
        ? { ...version, size: bytes.byteLength, checksum: createHash("sha256").update(bytes).digest("hex") }
        : version),
    },
    ...metadata,
  });
}

function artifactLink(store, ref) {
  return { ...ref };
}

function occurrencePayload({ store, branch, rawPlan, payloadRef, evidenceRef, receipt, run = runId, attempt = attemptId }) {
  const unsigned = {
    schema_version: "nuanu.qa-evidence-occurrence.v1",
    source_artifact: { ...sourceArtifact },
    plan_sha256: rawPlan.plan_sha256,
    branch,
    repository_origin: repositoryOrigin,
    commit,
    content_hash: contentHash,
    environment_id: receipt.environment_id,
    instance_nonce: receipt.instance_nonce ?? null,
    run_id: run,
    attempt_id: attempt,
    branch_payload_artifact: artifactLink(store, payloadRef),
    evidence_artifact: artifactLink(store, evidenceRef),
  };
  return { ...unsigned, occurrence_key: sha256(unsigned) };
}

function branchEntry(store, branch, rawPlan, receipt, index, overrides = {}) {
  const applicability = rawPlan.applicability[branch];
  const required = applicability === "REQUIRED";
  const candidate = {
    schema_version: "nuanu.qa-evidence-candidate.v1",
    run_id: overrides.run_id ?? runId,
    attempt_id: overrides.attempt_id ?? attemptId,
    attempt_namespace: overrides.attempt_namespace ?? sha256({ run_id: overrides.run_id ?? runId, attempt_id: overrides.attempt_id ?? attemptId }).slice(7),
    branch_namespace: overrides.branch_namespace ?? sha256({ run_id: overrides.run_id ?? runId, attempt_id: overrides.attempt_id ?? attemptId, branch }).slice(7),
    branch,
    environment_identity: receipt.environment_status === "READY" ? {
      environment_id: overrides.environment_id ?? receipt.environment_id,
      target_namespace: overrides.target_namespace ?? receipt.target_namespace,
      repository_origin: overrides.repository_origin ?? receipt.repository_origin,
      commit: overrides.commit ?? receipt.commit,
      content_hash: overrides.content_hash ?? receipt.content_hash,
      instance_nonce: overrides.instance_nonce ?? receipt.instance_nonce,
      base_url: overrides.base_url ?? receipt.base_url,
    } : null,
    product_result: overrides.product_result ?? (required ? "PASS" : "SKIPPED"),
    environment_status: overrides.environment_status ?? (receipt.environment_status === "READY" ? "HEALTHY" : "NOT_REQUIRED"),
    evidence_status: overrides.evidence_status ?? "VERIFIED",
    confidence: overrides.confidence ?? 1,
    code: overrides.code ?? (required ? passCodes[branch] : "NOT_APPLICABLE"),
    evidence_kinds: overrides.evidence_kinds ?? (required ? evidenceKinds[branch] : []),
    observations: overrides.observations ?? (required ? [{ code: "ASSERTION_PASSED", status: "PASS", value_sha256: `sha256:${String(index + 1).repeat(64)}` }] : []),
    candidates: overrides.candidates ?? (required ? (branch === "ui" ? [
      { kind: "screenshot", name: "ui.png", media_type: "image/png", size_bytes: 1, sha256: sha256("x"), content_base64: "eA==" },
      { kind: "trace", name: "ui.zip", media_type: "application/zip", size_bytes: 1, sha256: sha256("x"), content_base64: "eA==" },
    ] : [{ kind: "document", name: `${branch}.md`, media_type: "text/markdown", size_bytes: 1, sha256: sha256("x"), content_base64: "eA==" }]) : []),
    ...(overrides.candidate_extra ?? {}),
  };
  const executionData = {
    schema_version: "nuanu.qa-branch-execution.v1",
    run_id: candidate.run_id,
    attempt_id: candidate.attempt_id,
    attempt_namespace: candidate.attempt_namespace,
    branch_namespace: candidate.branch_namespace,
    environment_status: candidate.environment_status,
    confidence: candidate.confidence,
    code: candidate.code,
    evidence_sha256: sha256(canonicalJson(candidate)),
    evidence_candidate: canonicalJson(candidate),
    ...(overrides.execution_extra ?? {}),
  };
  const branchResult = {
    schema_version: "nuanu.qa-branch-result.v1",
    project_key: rawPlan.project_key,
    commit: overrides.result_commit ?? rawPlan.commit,
    profile_digest: rawPlan.profile_digest,
    branch,
    applicability,
    product_result: candidate.product_result,
    evidence_status: candidate.evidence_status,
  };
  const branchPayload = { schema_version: "nuanu.qa-materialized-branch-payload.v1", branch_result: branchResult, execution_data: executionData };
  const payloadRef = materialize(store, { index: index * 3 + 100, semanticRole: "branch_payload", payload: branchPayload });
  const evidencePayload = {
    schema_version: "nuanu.qa-materialized-evidence.v1",
    source_artifact: { ...sourceArtifact },
    plan_sha256: rawPlan.plan_sha256,
    branch,
    branch_payload_sha256: `sha256:${material(store, payloadRef).artifact.versions[0].checksum}`,
    evidence_sha256: executionData.evidence_sha256,
    evidence_candidate: candidate,
    confirmed_findings: overrides.confirmed_findings ?? 0,
  };
  const evidenceRef = materialize(store, { index: index * 3 + 101, semanticRole: "evidence", payload: evidencePayload, role: "evidence" });
  const occurrence = occurrencePayload({ store, branch, rawPlan, payloadRef, evidenceRef, receipt, run: candidate.run_id, attempt: candidate.attempt_id });
  const occurrenceRef = materialize(store, { index: index * 3 + 102, semanticRole: "occurrence", payload: occurrence, role: "evidence" });
  return {
    output: {
      branch_result: branchResult,
      envelope: {
        item: { key: overrides.item_key ?? `verify_${branch}`, description: overrides.item_description ?? `${branch} QA`, data: executionData, artifacts: { evidence_report: evidenceRef } },
        artifact_outputs: { "item.artifacts.evidence_report": evidenceRef },
      },
    },
    artifacts: { branch_payload: payloadRef, occurrence: occurrenceRef, evidence: evidenceRef },
  };
}

export function aggregateFixture({ applicability, receipt = readyReceipt(), entryOverrides = {}, inputOverrides = {}, profileOverrides = {} } = {}) {
  const store = new Map();
  const platformStore = new Map();
  registerSourceMaterial(platformStore);
  const rawProfile = profile(profileOverrides);
  const rawPlan = plan(rawProfile, applicability);
  const committedProfileBytes = Buffer.from(YAML.stringify(rawProfile));
  const profileRef = materialize(store, { index: 1, semanticRole: "project_profile", bytes: committedProfileBytes, role: "implementation" });
  const planRef = materialize(store, { index: 2, semanticRole: "test_plan", payload: rawPlan });
  const branches = BRANCHES.map((branch, index) => branchEntry(store, branch, rawPlan, receipt, index, entryOverrides[branch] ?? {}));
  const resolveArtifactVersion = async ({ workspace_id, ref, max_bytes }) => {
    const record = store.get(`${ref.artifact_id}@${ref.version_id}`);
    if (!record || workspace_id !== workspaceId || record.byte_length > max_bytes) return null;
    return { ...record, enforced_max_bytes: max_bytes, bytes: Buffer.from(record.bytes) };
  };
  const resolvePlatformEntityVersion = async ({ workspace_id, ref, max_bytes }) => {
    const record = platformStore.get(`${ref.artifact_id}@${ref.version_id}`);
    if (!record || workspace_id !== workspaceId || record.observed_bytes > max_bytes) return null;
    return structuredClone({ ...record, enforced_max_bytes: max_bytes });
  };
  const resolveProfileAtCommit = async ({ repository_origin, commit: requestedCommit, path, max_bytes }) => {
    if (repository_origin !== repositoryOrigin || requestedCommit !== commit || path !== PROFILE_PATH || committedProfileBytes.byteLength > max_bytes) return null;
    return {
      repository_origin,
      commit: requestedCommit,
      path,
      byte_length: committedProfileBytes.byteLength,
      enforced_max_bytes: max_bytes,
      sha256: digestBytes(committedProfileBytes),
      bytes: Buffer.from(committedProfileBytes),
    };
  };
  return {
    input: {
      workspace_id: workspaceId,
      plan: rawPlan,
      plan_artifact: planRef,
      profile_artifact: profileRef,
      branches,
      environment_receipt: receipt,
      repository_origin: repositoryOrigin,
      run_id: runId,
      attempt_id: attemptId,
      ...inputOverrides,
    },
    dependencies: { resolveArtifactVersion, resolvePlatformEntityVersion, resolveProfileAtCommit },
    profile: rawProfile,
    plan: rawPlan,
    branches,
    store,
    platformStore,
  };
}

export async function aggregateFixtureResult(fixture) {
  return aggregateEvidence(fixture.input, fixture.dependencies);
}

qtest("finalization_report resolves only exact canonical immutable bytes", async () => {
  const fixture = aggregateFixture();
  const report = {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: true,
    target_state: "ready_for_production",
    reason_codes: [],
    kind: "qa",
    verdict: "pass",
    tested_head_sha: "a".repeat(40),
    checks: [{ name: "universal_qah_code", status: "passed", evidence: "artifact:33333333-3333-4333-8333-333333333333@44444444-4444-4444-8444-444444444444" }],
  };
  const ref = materialize(fixture.store, { index: 400, semanticRole: "finalization_report", payload: report });
  material(fixture.store, ref).artifact.name = "finalization.json";
  const resolved = await resolveArtifactVersionForSlot(ref, "finalization_report", {
    workspaceId,
    resolveArtifactVersion: fixture.dependencies.resolveArtifactVersion,
  }, 262_144);
  assert.deepEqual(resolved.reference, ref);
  assert.deepEqual(resolved.payload, report);
  assert.equal(resolved.bytes.toString("utf8"), canonicalJson(report));
});

qtest("finalization_report rejects every mutable or mismatched Artifact axis", async (t) => {
  const mutations = [
    ["wrong version", ({ ref }) => { ref.version_id = "17171717-1717-4717-8717-171717171717"; }],
    ["latest substitution", ({ ref, record }) => { record.artifact.current_version = "18181818-1818-4818-8818-181818181818"; ref.version_id = record.artifact.current_version; }],
    ["wrong role", ({ ref }) => { ref.role = "evidence"; }],
    ["wrong workspace", ({ record }) => { record.workspace_id = "19191919-1919-4919-8919-191919191919"; }],
    ["wrong name", ({ record }) => { record.artifact.name = "latest.json"; }],
    ["wrong MIME", ({ record }) => { record.artifact.mime_type = "text/plain"; }],
    ["wrong checksum", ({ record }) => { record.artifact.versions[0].checksum = "f".repeat(64); }],
    ["wrong bytes", ({ record }) => { record.bytes = Buffer.from("{}"); }],
  ];
  for (const [name, mutate] of mutations) await t.test(name, async () => {
    const fixture = aggregateFixture();
    const ref = materialize(fixture.store, { index: 400, semanticRole: "finalization_report", payload: { schema_version: "nuanu.qa-finalization-result.v1" } });
    const record = material(fixture.store, ref);
    record.artifact.name = "finalization.json";
    mutate({ ref, record });
    await assert.rejects(resolveArtifactVersionForSlot(ref, "finalization_report", {
      workspaceId,
      resolveArtifactVersion: fixture.dependencies.resolveArtifactVersion,
    }, 262_144), undefined, name);
  });
});

function reasons(aggregate) {
  return new Set(aggregate.reason_codes);
}

qtest("trusted resolver makes clean UI, API, mixed, and docs inputs deterministic", async () => {
  const classes = [
    { code: "ui", applicability: { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "REQUIRED", domain: "NOT_APPLICABLE" } },
    { code: "api", applicability: { code: "REQUIRED", api: "REQUIRED", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" } },
    { code: "mixed", applicability: { code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "REQUIRED" } },
    { code: "docs", applicability: { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" } },
  ];
  for (const ticket of classes) {
    const fixture = aggregateFixture({ applicability: ticket.applicability });
    const first = await aggregateFixtureResult(fixture);
    const second = await aggregateEvidence(structuredClone(fixture.input), fixture.dependencies);
    assert.equal(first.invariants_passed, true, ticket.code);
    assert.deepEqual(first.reason_codes, []);
    assert.deepEqual(first.expected_branches, BRANCHES);
    assert.deepEqual(first.branches.map(({ branch, validity }) => [branch, validity]), BRANCHES.map((branch) => [branch, "VALID"]));
    assert.equal(first.confidence_threshold, fixture.profile.risk.confidence_threshold);
    assert.equal(canonicalJson(first), canonicalJson(second));
  }
});

qtest("aggregate accepts arbitrary project outcome codes only through the trusted profile mapping", async () => {
  const outcome_codes = Object.fromEntries(BRANCHES.map((branch) => [branch, {
    pass: [`${branch.toUpperCase()}_READY`],
    fail: [`${branch.toUpperCase()}_FAILED`],
    infra: [`${branch.toUpperCase()}_INFRA`],
    skipped: [`${branch.toUpperCase()}_SKIPPED`],
  }]));
  const entryOverrides = Object.fromEntries(BRANCHES.map((branch) => [branch, { code: `${branch.toUpperCase()}_READY` }]));
  const fixture = aggregateFixture({ profileOverrides: { outcome_codes }, entryOverrides });
  const aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, true);
  assert.deepEqual(aggregate.reason_codes, []);
  const undeclared = aggregateFixture({ profileOverrides: { outcome_codes }, entryOverrides: { ...entryOverrides, api: { code: "PRODUCT_MAGIC" } } });
  assert.equal((await aggregateFixtureResult(undeclared)).reason_codes.includes("UNKNOWN_CODE"), true);
  const skippedApplicability = Object.fromEntries(BRANCHES.map((branch) => [branch, "NOT_APPLICABLE"]));
  const skippedOverrides = Object.fromEntries(BRANCHES.map((branch) => [branch, { code: `${branch.toUpperCase()}_SKIPPED` }]));
  const skipped = aggregateFixture({ applicability: skippedApplicability, profileOverrides: { outcome_codes }, entryOverrides: skippedOverrides });
  assert.equal((await aggregateFixtureResult(skipped)).invariants_passed, true);
});

qtest("trusted full TestPlan rejects consistently rehashed extra top-level and nested keys", async () => {
  for (const mutate of [
    (rawPlan) => { rawPlan.attacker_policy = { release: "READY" }; },
    (rawPlan) => { rawPlan.artifact_slot.attacker_policy = { release: "READY" }; },
  ]) {
    const fixture = aggregateFixture();
    const forgedPlan = structuredClone(fixture.plan);
    delete forgedPlan.plan_sha256;
    mutate(forgedPlan);
    forgedPlan.plan_sha256 = sha256(forgedPlan);
    fixture.input.plan = forgedPlan;
    rewriteMaterial(fixture.store, fixture.input.plan_artifact, forgedPlan);
    for (const entry of fixture.input.branches) {
      const evidence = JSON.parse(material(fixture.store, entry.artifacts.evidence).bytes.toString("utf8"));
      evidence.plan_sha256 = forgedPlan.plan_sha256;
      rewriteMaterial(fixture.store, entry.artifacts.evidence, evidence);
      const occurrence = JSON.parse(material(fixture.store, entry.artifacts.occurrence).bytes.toString("utf8"));
      occurrence.plan_sha256 = forgedPlan.plan_sha256;
      delete occurrence.occurrence_key;
      occurrence.occurrence_key = sha256(occurrence);
      rewriteMaterial(fixture.store, entry.artifacts.occurrence, occurrence);
    }
    const aggregate = await aggregateFixtureResult(fixture);
    assert.equal(aggregate.invariants_passed, false);
    assert.equal(aggregate.reason_codes.includes("INVALID_FULL_PLAN"), true);
  }
});

qtest("missing trusted resolvers and arbitrary locally fabricated Artifact refs can never READY", async () => {
  const fixture = aggregateFixture();
  const withoutResolver = await aggregateEvidence(fixture.input);
  assert.equal(withoutResolver.invariants_passed, false);
  assert.equal(reasons(withoutResolver).has("TRUSTED_ARTIFACT_RESOLVER_REQUIRED"), true);

  fixture.input.branches[0].artifacts.evidence = {
    artifact_id: "99999999-9999-4999-8999-999999999999",
    version_id: "88888888-8888-4888-8888-888888888888",
    kind: "document", role: "evidence",
  };
  const fabricated = await aggregateFixtureResult(fixture);
  assert.equal(fabricated.invariants_passed, false);
  assert.equal(reasons(fabricated).has("INVALID_TRUSTED_ARTIFACT"), true);
});

qtest("nonexistent, swapped, wrong-workspace, wrong-role, wrong-media, and checksum resolver results fail closed", async () => {
  const cases = [
    [() => null, "INVALID_TRUSTED_ARTIFACT"],
    [(record) => ({ ...record, artifact: { ...record.artifact, id: "99999999-9999-4999-8999-999999999999" } }), "INVALID_TRUSTED_ARTIFACT"],
    [(record) => ({ ...record, workspace_id: "33333333-3333-4333-8333-333333333333" }), "INVALID_TRUSTED_ARTIFACT"],
    [(record) => ({ ...record, artifact: { ...record.artifact, mime_type: "text/plain" } }), "INVALID_TRUSTED_ARTIFACT"],
    [(record) => ({ ...record, artifact: { ...record.artifact, versions: record.artifact.versions.map((version) => ({ ...version, checksum: "f".repeat(64) })) } }), "INVALID_TRUSTED_ARTIFACT"],
  ];
  for (const [mutate, expected] of cases) {
    const fixture = aggregateFixture();
    const target = fixture.input.branches[0].artifacts.evidence;
    const baseResolver = fixture.dependencies.resolveArtifactVersion;
    const aggregate = await aggregateEvidence(fixture.input, {
      ...fixture.dependencies,
      resolveArtifactVersion: async (request) => {
        const record = await baseResolver(request);
        return request.ref.artifact_id === target.artifact_id && request.ref.version_id === target.version_id ? mutate(record) : record;
      },
    });
    assert.equal(aggregate.invariants_passed, false);
    assert.equal(reasons(aggregate).has(expected), true);
  }
});

qtest("Nuanu Artifact refs use UUID versions and semantic positions cannot be swapped", async () => {
  const fixture = aggregateFixture();
  assert.deepEqual(Object.keys(fixture.input.plan_artifact).sort(), ["artifact_id", "kind", "role", "version_id"]);
  assert.match(fixture.input.plan_artifact.artifact_id, /^[0-9a-f-]{36}$/);
  assert.match(fixture.input.plan_artifact.version_id, /^[0-9a-f-]{36}$/);
  assert.equal(fixture.input.plan_artifact.role, "output");
  assert.equal(fixture.input.profile_artifact.role, "implementation");
  assert.equal(fixture.input.branches[0].artifacts.branch_payload.role, "output");
  assert.equal(fixture.input.branches[0].artifacts.occurrence.role, "evidence");
  assert.equal(fixture.input.branches[0].artifacts.evidence.role, "evidence");

  [fixture.input.plan_artifact, fixture.input.profile_artifact] = [fixture.input.profile_artifact, fixture.input.plan_artifact];
  const aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal([...reasons(aggregate)].some((code) => ["INVALID_AGGREGATE_INPUT", "INVALID_ARTIFACT_REFERENCE"].includes(code)), true);
});

qtest("an exact immutable Nuanu version remains valid when it is not the current version", async () => {
  const fixture = aggregateFixture();
  const target = fixture.input.branches[0].artifacts.evidence;
  const baseResolver = fixture.dependencies.resolveArtifactVersion;
  const aggregate = await aggregateEvidence(fixture.input, {
    ...fixture.dependencies,
    resolveArtifactVersion: async (request) => {
      const record = await baseResolver(request);
      if (request.ref.artifact_id !== target.artifact_id || request.ref.version_id !== target.version_id) return record;
      return { ...record, artifact: { ...record.artifact, current_version: "99999999-9999-4999-8999-999999999999" } };
    },
  });
  assert.equal(aggregate.invariants_passed, true);
});

qtest("Nuanu readback finds the exact version in artifact.versions and slot roles are closed", async () => {
  let fixture = aggregateFixture();
  const target = fixture.input.branches[0].artifacts.evidence;
  const liveShape = material(fixture.store, target);
  assert.equal("role" in liveShape.artifact, false);
  assert.deepEqual(Object.keys(liveShape.artifact).sort(), ["current_version", "id", "kind", "mime_type", "name", "status", "versions", "workspace_id"]);
  assert.deepEqual(Object.keys(liveShape.artifact.versions[0]).sort(), ["checksum", "file_asset", "id", "size", "version"]);
  const baseResolver = fixture.dependencies.resolveArtifactVersion;
  let aggregate = await aggregateEvidence(fixture.input, {
    ...fixture.dependencies,
    resolveArtifactVersion: async (request) => {
      const record = await baseResolver(request);
      if (request.ref.artifact_id !== target.artifact_id || request.ref.version_id !== target.version_id) return record;
      return { ...record, artifact: { ...record.artifact, versions: [] } };
    },
  });
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("INVALID_TRUSTED_ARTIFACT"), true);

  fixture = aggregateFixture();
  fixture.input.branches[0].artifacts.evidence.role = "output";
  aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("INVALID_ARTIFACT_REFERENCE"), true);
});

qtest("materialized profile must equal a second read from the pinned Git commit", async () => {
  let fixture = aggregateFixture();
  const lowered = { ...fixture.profile, risk: { confidence_threshold: 0 } };
  rewriteMaterial(fixture.store, fixture.input.profile_artifact, lowered);
  let aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("PROFILE_COMMIT_MISMATCH"), true);

  fixture = aggregateFixture();
  aggregate = await aggregateEvidence(fixture.input, {
    ...fixture.dependencies,
    resolveProfileAtCommit: async (request) => {
      const result = await fixture.dependencies.resolveProfileAtCommit(request);
      return { ...result, commit: "b".repeat(40) };
    },
  });
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("INVALID_COMMIT_PROFILE"), true);

  aggregate = await aggregateEvidence(fixture.input, { ...fixture.dependencies, resolveProfileAtCommit: async () => null });
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("INVALID_COMMIT_PROFILE"), true);

  aggregate = await aggregateEvidence(fixture.input, { resolveArtifactVersion: fixture.dependencies.resolveArtifactVersion, resolvePlatformEntityVersion: fixture.dependencies.resolvePlatformEntityVersion });
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("TRUSTED_PROFILE_RESOLVER_REQUIRED"), true);
});

qtest("raw YAML blob hash is distinct from the canonical parsed profile digest", async () => {
  const repositoryProfileBytes = readFileSync(new URL("../../qa-harness.yaml", import.meta.url));
  const repositoryProfile = parseProfileBytes(repositoryProfileBytes);
  assert.notEqual(digestBytes(repositoryProfileBytes), sha256(repositoryProfile));

  const fixture = aggregateFixture();
  const rawProfileBytes = material(fixture.store, fixture.input.profile_artifact).bytes;
  assert.equal(rawProfileBytes.toString("utf8").startsWith("schema_version:"), true);
  assert.notEqual(rawProfileBytes.toString("utf8"), canonicalJson(fixture.profile));

  const aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, true);
  assert.equal(aggregate.profile_blob_sha256, digestBytes(rawProfileBytes));
  assert.equal(aggregate.profile_digest, sha256(fixture.profile));
  assert.notEqual(aggregate.profile_blob_sha256, aggregate.profile_digest);
});

qtest("trusted resolvers receive and attest hard prefetch byte limits", async () => {
  const fixture = aggregateFixture();
  const artifactRequests = [];
  const profileRequests = [];
  let aggregate = await aggregateEvidence(fixture.input, {
    resolvePlatformEntityVersion: fixture.dependencies.resolvePlatformEntityVersion,
    resolveArtifactVersion: async (request) => {
      artifactRequests.push(structuredClone(request));
      return fixture.dependencies.resolveArtifactVersion(request);
    },
    resolveProfileAtCommit: async (request) => {
      profileRequests.push(structuredClone(request));
      return fixture.dependencies.resolveProfileAtCommit(request);
    },
  });
  assert.equal(aggregate.invariants_passed, true);
  assert.equal(artifactRequests.every(({ max_bytes }) => Number.isSafeInteger(max_bytes) && max_bytes > 0), true);
  assert.deepEqual(profileRequests, [{ repository_origin: repositoryOrigin, commit, path: PROFILE_PATH, max_bytes: 262_144 }]);

  const baseResolver = fixture.dependencies.resolveArtifactVersion;
  aggregate = await aggregateEvidence(fixture.input, {
    ...fixture.dependencies,
    resolveArtifactVersion: async (request) => {
      const record = await baseResolver(request);
      return record ? { ...record, enforced_max_bytes: null } : record;
    },
  });
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("UNATTESTED_ARTIFACT_BOUND"), true);

  const target = fixture.input.branches[0].artifacts.evidence;
  const targetRecord = material(fixture.store, target);
  let bytesMaterialized = false;
  Object.defineProperty(targetRecord, "bytes", { configurable: true, get() { bytesMaterialized = true; throw new Error("must not materialize oversized bytes"); } });
  targetRecord.byte_length = fixture.profile.execution.max_output_bytes + 1;
  aggregate = await aggregateEvidence(fixture.input, {
    ...fixture.dependencies,
    resolveArtifactVersion: async (request) => {
      const record = fixture.store.get(`${request.ref.artifact_id}@${request.ref.version_id}`);
      if (!record || record.byte_length > request.max_bytes) return null;
      return { ...record, enforced_max_bytes: request.max_bytes, bytes: Buffer.from(record.bytes) };
    },
  });
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(bytesMaterialized, false);
});

qtest("trusted materialized full plan and profile must exactly match caller and digest linkage", async () => {
  const fixture = aggregateFixture();
  fixture.input.plan = { ...fixture.input.plan, risk_level: "LOW" };
  let aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("PLAN_MATERIAL_MISMATCH"), true);

  const forgedPlan = { ...fixture.plan, unknown_policy: "allow" };
  const { plan_sha256: _old, ...forgedUnsigned } = forgedPlan;
  forgedPlan.plan_sha256 = sha256(forgedUnsigned);
  fixture.input.plan = forgedPlan;
  rewriteMaterial(fixture.store, fixture.input.plan_artifact, forgedPlan);
  aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("INVALID_FULL_PLAN"), true);

  const fresh = aggregateFixture();
  const hostileProfile = { ...fresh.profile, risk: { confidence_threshold: 0 } };
  rewriteMaterial(fresh.store, fresh.input.profile_artifact, hostileProfile);
  aggregate = await aggregateFixtureResult(fresh);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("PROFILE_COMMIT_MISMATCH"), true);
});

qtest("caller cannot lower trusted confidence threshold and evidence cannot exceed trusted profile max", async () => {
  let fixture = aggregateFixture({ entryOverrides: { api: { confidence: 0.5 } }, inputOverrides: { confidence_threshold: 0 } });
  let aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(aggregate.confidence_threshold, 0.95);
  assert.equal(reasons(aggregate).has("INVALID_AGGREGATE_INPUT"), true);
  assert.equal(reasons(aggregate).has("LOW_CONFIDENCE"), true);

  fixture = aggregateFixture({ profileOverrides: { execution: { shell: false, environment: "minimal", timeout_ms: 2_000, max_output_bytes: 4_096 } } });
  const target = fixture.input.branches[0].artifacts.evidence;
  const record = material(fixture.store, target);
  const oversized = Buffer.alloc(4_097, 120);
  fixture.store.set(refKey(target), {
    ...record,
    byte_length: oversized.byteLength,
    bytes: oversized,
    artifact: {
      ...record.artifact,
      versions: record.artifact.versions.map((version) => version.id === target.version_id
        ? { ...version, size: oversized.byteLength, checksum: createHash("sha256").update(oversized).digest("hex") }
        : version),
    },
  });
  aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal([...reasons(aggregate)].some((code) => ["ARTIFACT_SIZE_LIMIT", "INVALID_TRUSTED_ARTIFACT"].includes(code)), true);
});

qtest("missing and duplicate branches become explicit invalid records", async () => {
  const fixture = aggregateFixture();
  fixture.input.branches = [fixture.branches[0], fixture.branches[0], fixture.branches[2], fixture.branches[3]];
  const aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.branches.find(({ branch }) => branch === "api").validity, "MISSING");
  assert.equal(aggregate.branches.find(({ branch }) => branch === "code").validity, "INVALID");
  assert.equal(reasons(aggregate).has("MISSING_BRANCH"), true);
  assert.equal(reasons(aggregate).has("DUPLICATE_BRANCH"), true);
});

qtest("required SKIPPED and inapplicable PASS fail the exact applicability contract", async () => {
  for (const { applicability, entryOverrides, code } of [
    { applicability: undefined, entryOverrides: { api: { product_result: "SKIPPED", code: "NOT_APPLICABLE" } }, code: "REQUIRED_BRANCH_NOT_PASS" },
    { applicability: { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" }, entryOverrides: { api: { product_result: "PASS", code: "API_CONTRACT_VERIFIED" } }, code: "INAPPLICABLE_BRANCH_NOT_SKIPPED" },
  ]) {
    const aggregate = await aggregateFixtureResult(aggregateFixture({ applicability, entryOverrides }));
    assert.equal(aggregate.invariants_passed, false);
    assert.equal(reasons(aggregate).has(code), true);
  }
});

qtest("PASS assertions, NOT_APPLICABLE emptiness, namespace, origin, and receipt state linkage are independently enforced", async () => {
  const cases = [
    [{ api: { observations: [{ code: "ASSERTION_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } }, undefined, "PASS_ASSERTION_MISMATCH"],
    [{ api: { target_namespace: "f".repeat(64) } }, undefined, "ENVIRONMENT_ID_MISMATCH"],
    [{ api: { base_url: "http://127.0.0.1:9999" } }, undefined, "ENVIRONMENT_ID_MISMATCH"],
    [{ api: { candidate_extra: { unknown: true } } }, undefined, "INVALID_EVIDENCE_CANDIDATE"],
    [{ api: { observations: [{ code: "SHOULD_BE_EMPTY", status: "PASS", value_sha256: sha256("x") }] } }, { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" }, "NOT_APPLICABLE_EVIDENCE_MISMATCH"],
  ];
  for (const [entryOverrides, applicability, expected] of cases) {
    const aggregate = await aggregateFixtureResult(aggregateFixture({ applicability, entryOverrides }));
    assert.equal(aggregate.invariants_passed, false, expected);
    assert.equal(reasons(aggregate).has(expected), true, expected);
  }
  const fixture = aggregateFixture({ receipt: readyReceipt({ state_file: "/tmp/attacker/environment.json" }) });
  const aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("INVALID_ENVIRONMENT_RECEIPT"), true);

  for (const receipt of [
    readyReceipt({ target_namespace: "e".repeat(64) }),
    readyReceipt({ base_url: "http://evil.example.test" }),
  ]) {
    const invalid = await aggregateFixtureResult(aggregateFixture({ receipt }));
    assert.equal(invalid.invariants_passed, false);
    assert.equal(reasons(invalid).has("INVALID_ENVIRONMENT_RECEIPT"), true);
  }
});

qtest("branch execution envelope and candidate axes remain independently closed", async () => {
  const cases = [
    [{ api: { environment_status: "ALIEN" } }, "INVALID_EVIDENCE_CANDIDATE"],
    [{ api: { evidence_status: "ALIEN" } }, "INVALID_EVIDENCE_CANDIDATE"],
    [{ api: { confidence: 2 } }, "INVALID_EVIDENCE_CANDIDATE"],
    [{ api: { execution_extra: { schema_version: "attacker.v1" } } }, "INVALID_BRANCH_OUTPUT"],
    [{ api: { execution_extra: { branch_namespace: "f".repeat(64) } } }, "INVALID_BRANCH_OUTPUT"],
    [{ api: { item_key: "verify_ui" } }, "INVALID_BRANCH_OUTPUT"],
    [{ ui: { candidates: [{ kind: "document", name: "ui.md", media_type: "text/markdown", size_bytes: 1, sha256: sha256("x"), content_base64: "eA==" }] } }, "INVALID_EVIDENCE_CANDIDATE"],
  ];
  for (const [entryOverrides, expected] of cases) {
    const aggregate = await aggregateFixtureResult(aggregateFixture({ entryOverrides }));
    assert.equal(aggregate.invariants_passed, false, expected);
    assert.equal(reasons(aggregate).has(expected), true, expected);
  }
  const readyButNotRequired = await aggregateFixtureResult(aggregateFixture({
    applicability: { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" },
    entryOverrides: { api: { environment_status: "NOT_REQUIRED" } },
  }));
  assert.equal(readyButNotRequired.invariants_passed, false);
  assert.equal(reasons(readyButNotRequired).has("INVALID_EVIDENCE_CANDIDATE"), true);
});

qtest("candidate counts, base64 bounds, decoded cumulative bytes, and media types are hard bounded", async () => {
  const tooManyObservations = Array.from({ length: 65 }, (_, index) => ({ code: "ASSERTION_PASSED", status: "PASS", value_sha256: `sha256:${String((index % 9) + 1).repeat(64)}` }));
  let aggregate = await aggregateFixtureResult(aggregateFixture({ entryOverrides: { api: { observations: tooManyObservations } } }));
  assert.equal(reasons(aggregate).has("EVIDENCE_COUNT_LIMIT"), true);

  const wrongMedia = [{ kind: "screenshot", name: "x.png", media_type: "text/html", size_bytes: 1, sha256: sha256("x"), content_base64: "eA==" }];
  aggregate = await aggregateFixtureResult(aggregateFixture({ entryOverrides: { api: { candidates: wrongMedia } } }));
  assert.equal(reasons(aggregate).has("INVALID_EVIDENCE_CANDIDATE"), true);

  const hugeBase64 = "eA==".repeat(20_000);
  const oversizedCandidate = [{ kind: "document", name: "x.md", media_type: "text/markdown", size_bytes: 20_000, sha256: sha256("x"), content_base64: hugeBase64 }];
  aggregate = await aggregateFixtureResult(aggregateFixture({ entryOverrides: { api: { candidates: oversizedCandidate } } }));
  assert.equal(aggregate.invariants_passed, false);
  assert.equal([...reasons(aggregate)].some((code) => ["ARTIFACT_SIZE_LIMIT", "EVIDENCE_BYTE_LIMIT", "INVALID_EVIDENCE_CANDIDATE", "INVALID_TRUSTED_ARTIFACT"].includes(code)), true);
});

qtest("stale runs, mixed attempts/builds, low confidence, unknown codes, infra, findings, and reused versions fail closed", async () => {
  const cases = [
    [{ api: { run_id: "old-run" } }, "RUN_MISMATCH"],
    [{ api: { attempt_id: "attempt-2" } }, "ATTEMPT_MISMATCH"],
    [{ api: { repository_origin: "https://example.test/other.git" } }, "REPOSITORY_MISMATCH"],
    [{ api: { commit: "b".repeat(40) } }, "COMMIT_MISMATCH"],
    [{ api: { content_hash: `sha256:${"b".repeat(64)}` } }, "CONTENT_HASH_MISMATCH"],
    [{ api: { environment_id: "other-env" } }, "ENVIRONMENT_ID_MISMATCH"],
    [{ api: { instance_nonce: "22222222-2222-4222-8222-222222222222" } }, "INSTANCE_NONCE_MISMATCH"],
    [{ api: { confidence: 0.94 } }, "LOW_CONFIDENCE"],
    [{ api: { code: "UNKNOWN_SUCCESS" } }, "UNKNOWN_CODE"],
    [{ api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION" } }, "PRODUCT_FAILURE"],
    [{ api: { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0, code: "TRANSPORT_FAILURE" } }, "INFRA_FAILURE"],
    [{ api: { confirmed_findings: 1 } }, "CONFIRMED_FINDINGS"],
  ];
  for (const [entryOverrides, expected] of cases) {
    const aggregate = await aggregateFixtureResult(aggregateFixture({ entryOverrides }));
    assert.equal(aggregate.invariants_passed, false, expected);
    assert.equal(reasons(aggregate).has(expected), true, expected);
  }
  const fixture = aggregateFixture();
  fixture.input.branches[1].artifacts.evidence = fixture.input.branches[0].artifacts.evidence;
  const aggregate = await aggregateFixtureResult(fixture);
  assert.equal(reasons(aggregate).has("REUSED_ARTIFACT_VERSION"), true);
});

qtest("source, plan, profile, and branch materials must use distinct immutable versions", async () => {
  const fixture = aggregateFixture();
  fixture.plan.source_artifact = {
    ...fixture.plan.source_artifact,
    artifact_id: fixture.input.profile_artifact.artifact_id,
    version_id: fixture.input.profile_artifact.version_id,
  };
  const { plan_sha256: _oldDigest, ...unsignedPlan } = fixture.plan;
  fixture.plan.plan_sha256 = sha256(unsignedPlan);
  rewriteMaterial(fixture.store, fixture.input.plan_artifact, fixture.plan);

  const aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, false);
  assert.equal(reasons(aggregate).has("REUSED_ARTIFACT_VERSION"), true);
});

qtest("forged occurrence, evidence linkage, source version, and materialization slots fail closed", async () => {
  const fixture = aggregateFixture();
  const occurrenceRef = fixture.input.branches[0].artifacts.occurrence;
  const occurrence = JSON.parse(material(fixture.store, occurrenceRef).bytes.toString("utf8"));
  occurrence.occurrence_key = `sha256:${"f".repeat(64)}`;
  rewriteMaterial(fixture.store, occurrenceRef, occurrence);
  let aggregate = await aggregateFixtureResult(fixture);
  assert.equal(reasons(aggregate).has("OCCURRENCE_KEY_MISMATCH"), true);

  const evidenceRef = fixture.input.branches[1].artifacts.evidence;
  const evidence = JSON.parse(material(fixture.store, evidenceRef).bytes.toString("utf8"));
  evidence.evidence_sha256 = `sha256:${"f".repeat(64)}`;
  rewriteMaterial(fixture.store, evidenceRef, evidence);
  aggregate = await aggregateFixtureResult(fixture);
  assert.equal(reasons(aggregate).has("EVIDENCE_LINK_MISMATCH"), true);

  const sourceOccurrenceRef = fixture.input.branches[2].artifacts.occurrence;
  const sourceOccurrence = JSON.parse(material(fixture.store, sourceOccurrenceRef).bytes.toString("utf8"));
  sourceOccurrence.source_artifact.version_id = "77777777-7777-4777-8777-777777777777";
  const { occurrence_key: _key, ...unsigned } = sourceOccurrence;
  sourceOccurrence.occurrence_key = sha256(unsigned);
  rewriteMaterial(fixture.store, sourceOccurrenceRef, sourceOccurrence);
  aggregate = await aggregateFixtureResult(fixture);
  assert.equal(reasons(aggregate).has("SOURCE_ARTIFACT_MISMATCH"), true);

  fixture.input.branches[3].output.envelope.artifact_outputs["item.artifacts.evidence_report"] = { id: "attacker", version: 99 };
  aggregate = await aggregateFixtureResult(fixture);
  assert.equal(reasons(aggregate).has("MATERIALIZATION_REF_MISMATCH"), true);
});

qtest("circular and hostile Proxy inputs never escape the public aggregation boundary", async () => {
  const circular = {}; circular.self = circular;
  const hostile = new Proxy({}, { ownKeys() { throw new Error("hostile ownKeys"); }, get() { throw new Error("hostile get"); } });
  for (const input of [circular, hostile]) {
    let aggregate;
    await assert.doesNotReject(async () => { aggregate = await aggregateEvidence(input, { resolveArtifactVersion: async () => null, resolvePlatformEntityVersion: async () => null, resolveProfileAtCommit: async () => null }); });
    assert.equal(aggregate.invariants_passed, false);
    assert.equal(reasons(aggregate).has("INVALID_AGGREGATE_INPUT"), true);
  }
});

qtest("full-plan validation binds graph authority identically in plan and artifact slot", () => {
  const rawProfile = profile();
  const event = graphEvent(rawProfile.project_key);
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");
  const binding = graphBinding(event, graphPlan);
  const graphBoundPlan = plan(rawProfile, { code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "NOT_APPLICABLE" });
  graphBoundPlan.graph_binding = structuredClone(binding);
  graphBoundPlan.artifact_slot.graph_binding = structuredClone(binding);
  const { plan_sha256: _old, ...unsigned } = graphBoundPlan;
  graphBoundPlan.plan_sha256 = sha256(unsigned);

  assert.deepEqual(validateFullTestPlan(graphBoundPlan), []);

  const substituted = structuredClone(graphBoundPlan);
  substituted.artifact_slot.graph_binding.graph_digest = `sha256:${"f".repeat(64)}`;
  const { plan_sha256: _previous, ...substitutedUnsigned } = substituted;
  substituted.plan_sha256 = sha256(substitutedUnsigned);
  assert.deepEqual(validateFullTestPlan(substituted), ["INVALID_FULL_PLAN"]);
});
