import { canonicalJson, sha256 } from "./canonical.mjs";
import { resolveArtifactVersionForSlot } from "./aggregate.mjs";
import { validateAggregateForDecision } from "./decide.mjs";
import { RELEASE_ROUTES, classifyValidatedRelease } from "./release-policy.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const CODE = /^[A-Z][A-Z0-9_]{0,63}$/;
const EVIDENCE = /^artifact:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}@[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const INPUT_KEYS = ["workspace_id", "finalization_report", "expected_report", "aggregate", "decision"];
const REPORT_KEYS = ["schema_version", "transition_allowed", "target_state", "reason_codes", "kind", "verdict", "tested_head_sha", "checks"];
const DATA_KEYS = ["transition_allowed", "target_state", "reason_codes", "kind", "verdict", "tested_head_sha", "checks"];
const DECISION_KEYS = ["schema_version", "aggregate_sha256", "route", "reason_codes", "policy_override_rejected", "explanation", "decision_sha256"];
const REF_KEYS = ["artifact_id", "version_id", "kind", "role"];
const BRANCHES = ["code", "api", "ui", "domain"];
const FINALIZATION_LIMIT = 262_144;

class ClaimPolicyError extends Error {
  constructor(code) { super(code); this.code = code; }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys) {
  if (!isObject(value)) return false;
  try { return canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort()); }
  catch { return false; }
}

function same(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); }
  catch { return false; }
}

function exactReference(value) {
  return exactKeys(value, REF_KEYS)
    && UUID.test(value.artifact_id ?? "") && UUID.test(value.version_id ?? "")
    && value.kind === "document" && value.role === "output";
}

function validChecks(checks) {
  if (!Array.isArray(checks) || checks.length > BRANCHES.length) return false;
  let previous = -1;
  for (const check of checks) {
    if (!exactKeys(check, ["name", "status", "evidence"]) || !["passed", "failed"].includes(check.status)) return false;
    const branch = typeof check.name === "string" && check.name.startsWith("universal_qah_")
      ? check.name.slice("universal_qah_".length)
      : "";
    const index = BRANCHES.indexOf(branch);
    if (index <= previous) return false;
    previous = index;
    if (!EVIDENCE.test(check.evidence ?? "")) return false;
  }
  return true;
}

function validExecutionFailureCheck(checks) {
  return Array.isArray(checks) && checks.length === 1
    && exactKeys(checks[0], ["name", "status", "evidence"])
    && checks[0].name === "graph_qah_execution"
    && checks[0].status === "failed"
    && EVIDENCE.test(checks[0].evidence ?? "");
}

function validClaimData(value) {
  if (!exactKeys(value, DATA_KEYS) || value.transition_allowed !== true || !Array.isArray(value.reason_codes)
    || value.reason_codes.length !== 0 || value.kind !== "qa" || !COMMIT.test(value.tested_head_sha ?? "")
    || !Array.isArray(value.checks)) return false;
  if (value.verdict === "pass") return value.target_state === "ready_for_production"
    && validChecks(value.checks) && value.checks.length > 0 && value.checks.every(({ status }) => status === "passed");
  if (value.verdict === "fail") return value.target_state === "in_progress"
    && validChecks(value.checks) && value.checks.some(({ status }) => status === "failed");
  if (value.verdict === "blocked") return value.target_state === "ready_for_qa"
    && ((validChecks(value.checks) && value.checks.length > 0 && value.checks.every(({ status }) => status === "passed"))
      || validExecutionFailureCheck(value.checks));
  return false;
}

export function validateFinalProofGateClaim(value) {
  return validClaimData(value);
}

function validateExpectedReport(value) {
  if (!exactKeys(value, REPORT_KEYS) || value.schema_version !== "nuanu.qa-finalization-result.v1"
    || !validClaimData(Object.fromEntries(DATA_KEYS.map((key) => [key, value[key]])))) {
    throw new ClaimPolicyError("INVALID_FINALIZATION_REPORT");
  }
  return value;
}

function validateDecision(value, validated) {
  if (!exactKeys(value, DECISION_KEYS) || value.schema_version !== "nuanu.qa-release-route.v1"
    || !DIGEST.test(value.aggregate_sha256 ?? "") || !RELEASE_ROUTES.includes(value.route)
    || typeof value.policy_override_rejected !== "boolean"
    || !Array.isArray(value.reason_codes) || value.reason_codes.length > 64
    || new Set(value.reason_codes).size !== value.reason_codes.length
    || value.reason_codes.some((code) => typeof code !== "string" || !CODE.test(code))
    || !exactKeys(value.explanation, ["summary", "reason_codes"]) || typeof value.explanation.summary !== "string"
    || value.explanation.summary.length > 512 || value.explanation.summary.includes("\0")
    || !Array.isArray(value.explanation.reason_codes) || value.explanation.reason_codes.length > 8
    || new Set(value.explanation.reason_codes).size !== value.explanation.reason_codes.length
    || value.explanation.reason_codes.some((code) => typeof code !== "string" || !CODE.test(code))
    || !DIGEST.test(value.decision_sha256 ?? "")) throw new ClaimPolicyError("INVALID_RELEASE_DECISION");
  const { decision_sha256: claimed, ...unsigned } = value;
  if (sha256(unsigned) !== claimed || value.aggregate_sha256 !== validated.aggregate_sha256
    || !same(value.reason_codes, validated.reason_codes)) throw new ClaimPolicyError("INVALID_RELEASE_DECISION");
  return value;
}

function validateFlowStepResult(value) {
  if (!exactKeys(value, ["schema_version", "item"]) || value.schema_version !== "nuanu.flow-step-result.v1"
    || !exactKeys(value.item, ["key", "description", "data", "artifacts"])
    || value.item.key !== "finalize_transition" || value.item.description !== "Universal QAH finalization admitted"
    || !validClaimData(value.item.data) || !exactKeys(value.item.artifacts, ["finalization_report"])
    || !exactReference(value.item.artifacts.finalization_report)) throw new ClaimPolicyError("INVALID_FLOW_STEP_RESULT");
  return value;
}

export async function buildFinalizationFlowStepResult(input, dependencies = {}) {
  if (!exactKeys(input, INPUT_KEYS) || !UUID.test(input.workspace_id ?? "")
    || !exactReference(input.finalization_report)) throw new ClaimPolicyError("INVALID_CLAIM_INPUT");
  const report = validateExpectedReport(input.expected_report);
  const validated = await validateAggregateForDecision(input.aggregate, dependencies);
  if (validated.valid !== true || !validated.aggregate || validated.aggregate.workspace_id !== input.workspace_id
    || validated.aggregate_sha256 !== input.aggregate?.aggregate_sha256
    || report.tested_head_sha !== validated.aggregate.commit) throw new ClaimPolicyError("INVALID_AGGREGATE_AUTHORITY");
  const decision = validateDecision(input.decision, validated);
  const classification = classifyValidatedRelease({
    valid: true,
    aggregate: validated.aggregate,
    reason_codes: decision.reason_codes,
  });
  if (classification.route !== decision.route || report.target_state !== classification.target_state
    || report.verdict !== classification.verdict || !same(report.checks, classification.checks)) {
    throw new ClaimPolicyError("INVALID_CLAIM_CLASSIFICATION");
  }

  const context = { workspaceId: input.workspace_id, resolveArtifactVersion: dependencies.resolveArtifactVersion };
  for (const branch of validated.aggregate.branches) {
    await resolveArtifactVersionForSlot(branch.artifacts.evidence, "evidence", context, validated.aggregate.max_evidence_bytes);
  }
  const resolvedReport = await resolveArtifactVersionForSlot(input.finalization_report, "finalization_report", context, FINALIZATION_LIMIT);
  if (!same(resolvedReport.reference, input.finalization_report) || !same(resolvedReport.payload, report)
    || resolvedReport.bytes.toString("utf8") !== canonicalJson(report)) throw new ClaimPolicyError("FINALIZATION_REPORT_MISMATCH");

  return {
    schema_version: "nuanu.flow-step-result.v1",
    item: {
      key: "finalize_transition",
      description: "Universal QAH finalization admitted",
      data: {
        transition_allowed: report.transition_allowed,
        target_state: report.target_state,
        reason_codes: structuredClone(report.reason_codes),
        kind: report.kind,
        verdict: report.verdict,
        tested_head_sha: report.tested_head_sha,
        checks: structuredClone(report.checks),
      },
      artifacts: { finalization_report: structuredClone(input.finalization_report) },
    },
  };
}

export function encodeFinalizationWorkerTransport(flowStepResult) {
  const flow = validateFlowStepResult(flowStepResult);
  return {
    item: {
      key: "finalize_transition",
      description: "Universal QAH finalization admitted",
      data: structuredClone(flow.item.data),
      artifacts: {},
    },
    artifact_outputs: {
      "item.artifacts.finalization_report": structuredClone(flow.item.artifacts.finalization_report),
    },
  };
}

export function materializeFinalizationWorkerTransport(workerResult) {
  const canonicalError = () => { throw new ClaimPolicyError("INVALID_CANONICAL_WORKER_REFERENCE"); };
  if (!exactKeys(workerResult, ["item", "artifact_outputs"])
    || !exactKeys(workerResult.item, ["key", "description", "data", "artifacts"])
    || workerResult.item.key !== "finalize_transition"
    || workerResult.item.description !== "Universal QAH finalization admitted"
    || !validClaimData(workerResult.item.data) || !exactKeys(workerResult.item.artifacts, [])
    || !exactKeys(workerResult.artifact_outputs, ["item.artifacts.finalization_report"])) canonicalError();
  const output = workerResult.artifact_outputs["item.artifacts.finalization_report"];
  if (!exactKeys(output, ["mode", "artifact"]) || output.mode !== "reference" || !exactReference(output.artifact)) canonicalError();
  return validateFlowStepResult({
    schema_version: "nuanu.flow-step-result.v1",
    item: {
      key: workerResult.item.key,
      description: workerResult.item.description,
      data: structuredClone(workerResult.item.data),
      artifacts: { finalization_report: structuredClone(output.artifact) },
    },
  });
}
