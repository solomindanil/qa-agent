export const RELEASE_ROUTES = Object.freeze([
  "READY_FOR_PRODUCTION",
  "RETURN_TO_IN_PROGRESS",
  "HOLD_IN_READY_FOR_QA",
]);

export const RELEASE_CLASSIFICATIONS = Object.freeze({
  READY_FOR_PRODUCTION: Object.freeze({ target_state: "ready_for_production", verdict: "pass" }),
  RETURN_TO_IN_PROGRESS: Object.freeze({ target_state: "in_progress", verdict: "fail" }),
  HOLD_IN_READY_FOR_QA: Object.freeze({ target_state: "ready_for_qa", verdict: "blocked" }),
});

const BRANCHES = Object.freeze(["code", "api", "ui", "domain"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PRODUCT_REASONS = new Set(["PRODUCT_FAILURE", "CONFIRMED_FINDINGS"]);

function hold(checks = []) {
  return { route: "HOLD_IN_READY_FOR_QA", ...RELEASE_CLASSIFICATIONS.HOLD_IN_READY_FOR_QA, checks };
}

function object(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function productReasons(value) {
  return Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every((reason) => PRODUCT_REASONS.has(reason));
}

function evidenceReference(value) {
  return object(value) && UUID.test(value.artifact_id) && UUID.test(value.version_id)
    && value.kind === "document" && value.role === "evidence";
}

function expectedEnvironment(aggregate) {
  if (aggregate.environment_status === "READY") return "HEALTHY";
  if (aggregate.environment_status === "NOT_REQUIRED") return "NOT_REQUIRED";
  return null;
}

function checkFor(aggregate, branch) {
  const evidence = branch.artifacts?.evidence;
  const eligible = branch.applicability === "REQUIRED"
    && branch.evidence_status === "VERIFIED"
    && Number.isFinite(branch.confidence) && branch.confidence >= aggregate.confidence_threshold
    && branch.environment_status === expectedEnvironment(aggregate)
    && evidenceReference(evidence);
  if (!eligible) return null;
  const passed = branch.validity === "VALID" && Array.isArray(branch.reason_codes) && branch.reason_codes.length === 0
    && branch.product_result === "PASS" && branch.confirmed_findings === 0;
  const failed = branch.validity === "INVALID" && productReasons(branch.reason_codes)
    && (branch.product_result === "FAIL" || (Number.isSafeInteger(branch.confirmed_findings) && branch.confirmed_findings > 0));
  if (!passed && !failed) return null;
  return {
    name: `universal_qah_${branch.branch}`,
    status: failed ? "failed" : "passed",
    evidence: `artifact:${evidence.artifact_id}@${evidence.version_id}`,
  };
}

function inputShape(value) {
  if (!object(value) || value.valid !== true || !object(value.aggregate) || !Array.isArray(value.reason_codes)) return null;
  const aggregate = value.aggregate;
  if (!Array.isArray(aggregate.branches) || aggregate.branches.length !== BRANCHES.length
    || !Number.isFinite(aggregate.confidence_threshold) || aggregate.confidence_threshold <= 0 || aggregate.confidence_threshold > 1
    || typeof aggregate.invariants_passed !== "boolean"
    || expectedEnvironment(aggregate) === null
    || aggregate.branches.some((branch, index) => !object(branch) || branch.branch !== BRANCHES[index])) return null;
  return aggregate;
}

export function classifyValidatedRelease(input) {
  try {
    const aggregate = inputShape(input);
    if (aggregate === null) return hold();
    const required = aggregate.branches.filter((branch) => branch.applicability === "REQUIRED");
    const checks = required.map((branch) => checkFor(aggregate, branch)).filter(Boolean);
    const allRequiredRepresented = checks.length === required.length;
    const allPassed = checks.every((check) => check.status === "passed");
    const hasFailed = checks.some((check) => check.status === "failed");
    const reasons = input.reason_codes;
    if (input.valid === true && reasons.length === 0 && aggregate.invariants_passed === true
      && required.length > 0 && allRequiredRepresented && allPassed) {
      return { route: "READY_FOR_PRODUCTION", ...RELEASE_CLASSIFICATIONS.READY_FOR_PRODUCTION, checks };
    }
    if (input.valid === true && required.length > 0 && allRequiredRepresented && hasFailed && productReasons(reasons)) {
      return { route: "RETURN_TO_IN_PROGRESS", ...RELEASE_CLASSIFICATIONS.RETURN_TO_IN_PROGRESS, checks };
    }
    return hold(checks.filter((check) => check.status === "passed"));
  } catch {
    return hold();
  }
}
