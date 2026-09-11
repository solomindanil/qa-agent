import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { decideRelease, validateAggregateForDecision } from "../../scripts/qah/decide.mjs";
import { classifyValidatedRelease } from "../../scripts/qah/release-policy.mjs";
import {
  buildFinalizationFlowStepResult,
  encodeFinalizationWorkerTransport,
  materializeFinalizationWorkerTransport,
} from "../../scripts/qah/claim-adapter.mjs";
import { loadWorkerCompletionValidator } from "./helpers/worker-contract.mjs";
import { aggregateFixture, aggregateFixtureResult, material } from "./aggregate.test.mjs?fixtures-only";

const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
const REPORT_REF = Object.freeze({
  artifact_id: "12121212-1212-4212-8212-121212121212",
  version_id: "13131313-1313-4313-8313-131313131313",
  kind: "document",
  role: "output",
});
const FINALIZER_OUTPUT = Object.freeze({
  data: {
    transition_allowed: { type: "boolean", description: "True only after authoritative comment and cleanup verification" },
    target_state: { type: "string", description: "ready_for_production, in_progress, or ready_for_qa" },
    reason_codes: { type: "json", description: "Closed sorted finalization reason codes" },
    kind: { type: "string", description: "Literal qa admitted by QAH" },
    verdict: { type: "string", description: "pass, fail, or blocked admitted by QAH" },
    tested_head_sha: { type: "string", description: "Exact trusted 40-character repository commit" },
    checks: { type: "json", description: "Closed checks derived from exact verified branch ArtifactVersions" },
  },
  artifacts: {
    finalization_report: {
      kind: "document",
      description: "Verified final transition gate result",
      restrictions: { media_types: ["application/json"] },
    },
  },
});

function installReport(fixture, report, overrides = {}) {
  const bytes = Buffer.from(canonicalJson(report));
  fixture.store.set(`${REPORT_REF.artifact_id}@${REPORT_REF.version_id}`, {
    workspace_id: WORKSPACE_ID,
    enforced_max_bytes: null,
    byte_length: bytes.byteLength,
    links: [],
    artifact: {
      id: REPORT_REF.artifact_id,
      workspace_id: WORKSPACE_ID,
      status: "stored",
      current_version: REPORT_REF.version_id,
      kind: "document",
      name: "finalization.json",
      mime_type: "application/json",
      versions: [{
        id: REPORT_REF.version_id,
        version: 1,
        file_asset: "14141414-1414-4414-8414-141414141414",
        size: bytes.byteLength,
        checksum: createHash("sha256").update(bytes).digest("hex"),
      }],
    },
    bytes,
    ...overrides,
  });
  return structuredClone(REPORT_REF);
}

async function adapterCase({ entryOverrides = {} } = {}) {
  const fixture = aggregateFixture({ entryOverrides });
  const aggregate = await aggregateFixtureResult(fixture);
  const validated = await validateAggregateForDecision(aggregate, fixture.dependencies);
  const decision = await decideRelease(aggregate, {}, fixture.dependencies);
  const classification = classifyValidatedRelease(validated);
  const report = {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: true,
    target_state: classification.target_state,
    reason_codes: [],
    kind: "qa",
    verdict: classification.verdict,
    tested_head_sha: aggregate.commit,
    checks: classification.checks,
  };
  const finalization_report = installReport(fixture, report);
  return {
    fixture,
    report,
    input: { workspace_id: WORKSPACE_ID, finalization_report, expected_report: report, aggregate, decision },
  };
}

function rewriteInstalledReport({ fixture, input }) {
  const bytes = Buffer.from(canonicalJson(input.expected_report));
  const record = material(fixture.store, REPORT_REF);
  record.byte_length = bytes.byteLength;
  record.bytes = bytes;
  record.artifact.versions[0].size = bytes.byteLength;
  record.artifact.versions[0].checksum = createHash("sha256").update(bytes).digest("hex");
}

function redigestDecision(decision, changes) {
  const { decision_sha256: ignored, ...unsigned } = decision;
  const changed = { ...unsigned, ...changes };
  return { ...changed, decision_sha256: sha256(changed) };
}

test("PASS FAIL and blocked claims have one exact closed FlowStepResult shape", async (t) => {
  const rows = [
    ["pass", {}, "pass", "ready_for_production", ["passed"]],
    ["fail", { api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION", observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } }, "fail", "in_progress", ["failed", "passed"]],
    ["blocked", { api: { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0, code: "TRANSPORT_FAILURE" } }, "blocked", "ready_for_qa", ["passed"]],
  ];
  for (const [name, entryOverrides, verdict, target, allowedStatuses] of rows) await t.test(name, async () => {
    const { fixture, input } = await adapterCase({ entryOverrides });
    const flow = await buildFinalizationFlowStepResult(input, fixture.dependencies);
    assert.deepEqual(Object.keys(flow), ["schema_version", "item"]);
    assert.equal(flow.schema_version, "nuanu.flow-step-result.v1");
    assert.deepEqual(Object.keys(flow.item).sort(), ["artifacts", "data", "description", "key"]);
    assert.deepEqual(Object.keys(flow.item.data).sort(), ["checks", "kind", "reason_codes", "target_state", "tested_head_sha", "transition_allowed", "verdict"]);
    assert.deepEqual(Object.keys(flow.item.artifacts), ["finalization_report"]);
    assert.equal(flow.item.data.verdict, verdict);
    assert.equal(flow.item.data.target_state, target);
    assert.equal(flow.item.data.checks.every(({ status }) => allowedStatuses.includes(status)), true);
    if (verdict === "pass") assert.ok(flow.item.data.checks.length > 0);
    if (verdict === "fail") assert.ok(flow.item.data.checks.some(({ status }) => status === "failed"));
    if (verdict === "blocked") assert.equal(flow.item.data.checks.some(({ status }) => status === "failed"), false);
  });
});

test("worker 0.3.14 canonicalizes the raw ref and only canonical result materializes", async () => {
  const { fixture, input } = await adapterCase();
  const flow = await buildFinalizationFlowStepResult(input, fixture.dependencies);
  const raw = encodeFinalizationWorkerTransport(flow);
  const { buildCanonicalCompletion } = await loadWorkerCompletionValidator();
  const completion = buildCanonicalCompletion({
    task_id: "task-finalize",
    attempt: 1,
    request: { process: { step_key: "finalize_transition" }, output_definition: FINALIZER_OUTPUT },
  }, { output: canonicalJson(raw), publishedArtifacts: [] });
  assert.deepEqual(completion.result.artifact_outputs["item.artifacts.finalization_report"], {
    mode: "reference",
    artifact: REPORT_REF,
  });
  assert.throws(() => materializeFinalizationWorkerTransport(raw), /worker|canonical|reference/i);
  assert.deepEqual(materializeFinalizationWorkerTransport(completion.result), flow);
  assert.throws(() => encodeFinalizationWorkerTransport({ ...flow, extra: true }));
  for (const hostile of [
    { ...completion.result, extra: true },
    { ...completion.result, qa_proof_claim: {} },
    { ...completion.result, artifact_outputs: {} },
    { ...completion.result, artifact_outputs: { "item.artifacts.finalization_report": REPORT_REF } },
    { ...completion.result, artifact_outputs: { "item.artifacts.finalization_report": { mode: "latest", artifact: REPORT_REF } } },
    { ...completion.result, item: { ...completion.result.item, data: { ...completion.result.item.data, extra: true } } },
  ]) assert.throws(() => materializeFinalizationWorkerTransport(hostile));
});

test("claim authority rejects semantic and immutable-Artifact substitutions", async (t) => {
  const semanticRows = [
    ["empty PASS evidence", async ({ input }) => { input.expected_report.checks = []; }],
    ["failed PASS check", async ({ input }) => { input.expected_report.checks[0].status = "failed"; }],
    ["target mismatch", async ({ input }) => { input.expected_report.target_state = "in_progress"; }],
    ["arbitrary evidence", async ({ input }) => { input.expected_report.checks[0].evidence = "https://example.invalid/evidence"; }],
    ["extra report key", async ({ input }) => { input.expected_report.qa_proof_claim = {}; }],
    ["bad report schema", async ({ input }) => { input.expected_report.schema_version = "nuanu.qa-finalization-result.v2"; }],
    ["false transition", async ({ input }) => { input.expected_report.transition_allowed = false; }],
    ["non-empty finalization reasons", async ({ input }) => { input.expected_report.reason_codes = ["PRODUCT_FAILURE"]; }],
  ];
  for (const [name, mutate] of semanticRows) await t.test(name, async () => {
    const state = await adapterCase();
    await mutate(state);
    rewriteInstalledReport(state);
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  const structuralAndArtifactRows = [
    ["extra input root key", async ({ input }) => { input.extra = true; }],
    ["wrong immutable version", async ({ input }) => { input.finalization_report.version_id = "15151515-1515-4515-8515-151515151515"; }],
    ["wrong ref role", async ({ input }) => { input.finalization_report.role = "evidence"; }],
    ["cross workspace", async ({ fixture }) => { material(fixture.store, REPORT_REF).workspace_id = "16161616-1616-4616-8616-161616161616"; }],
    ["wrong name", async ({ fixture }) => { material(fixture.store, REPORT_REF).artifact.name = "latest.json"; }],
    ["wrong MIME", async ({ fixture }) => { material(fixture.store, REPORT_REF).artifact.mime_type = "text/plain"; }],
    ["wrong checksum", async ({ fixture }) => { material(fixture.store, REPORT_REF).artifact.versions[0].checksum = "f".repeat(64); }],
    ["wrong bytes", async ({ fixture }) => { material(fixture.store, REPORT_REF).bytes = Buffer.from("{}"); }],
  ];
  for (const [name, mutate] of structuralAndArtifactRows) await t.test(name, async () => {
    const state = await adapterCase();
    await mutate(state);
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  for (const [name, entryOverrides, mutate] of [
    ["fail without failed check", { api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION", observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } }, (report) => { for (const check of report.checks) check.status = "passed"; }],
    ["blocked with failed check", { api: { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0, code: "TRANSPORT_FAILURE" } }, (report) => { report.checks[0].status = "failed"; }],
  ]) await t.test(name, async () => {
    const state = await adapterCase({ entryOverrides });
    mutate(state.input.expected_report);
    rewriteInstalledReport(state);
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  for (const [name, changes] of [
    ["foreign route", { route: "RETURN_TO_IN_PROGRESS" }],
    ["foreign aggregate digest", { aggregate_sha256: `sha256:${"f".repeat(64)}` }],
    ["foreign outcome reasons", { reason_codes: ["PRODUCT_FAILURE"] }],
  ]) await t.test(name, async () => {
    const state = await adapterCase();
    state.input.decision = redigestDecision(state.input.decision, changes);
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  await t.test("raw decision digest corruption", async () => {
    const state = await adapterCase();
    state.input.decision.decision_sha256 = `sha256:${"0".repeat(64)}`;
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  for (const [name, mutate] of [
    ["branch evidence wrong workspace", (record) => { record.workspace_id = "20202020-2020-4020-8020-202020202020"; }],
    ["branch evidence wrong checksum", (record) => { record.artifact.versions[0].checksum = "f".repeat(64); }],
    ["branch evidence wrong bytes", (record) => { record.bytes = Buffer.from("{}"); }],
  ]) await t.test(name, async () => {
    const state = await adapterCase();
    const evidenceRef = state.input.aggregate.branches[0].artifacts.evidence;
    mutate(material(state.fixture.store, evidenceRef));
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });
});
