import test from "node:test";
import assert from "node:assert/strict";

import { sha256 } from "../../scripts/qah/canonical.mjs";
import { validateAggregateForDecision } from "../../scripts/qah/decide.mjs";
import { RELEASE_ROUTES, classifyValidatedRelease } from "../../scripts/qah/release-policy.mjs";
import { aggregateFixture, aggregateFixtureResult } from "./aggregate.test.mjs?fixtures-only";

const FULL = Object.freeze({ code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "REQUIRED" });
const DOCS = Object.freeze({ code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
const NONE = Object.freeze({ code: "NOT_APPLICABLE", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
const FAIL_API = Object.freeze({
  product_result: "FAIL",
  code: "API_CONTRACT_VIOLATION",
  observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }],
});
const HOLD = Object.freeze({ route: "HOLD_IN_READY_FOR_QA", target_state: "ready_for_qa", verdict: "blocked" });

function expectedCheck(branch, status) {
  return {
    name: `universal_qah_${branch.branch}`,
    status,
    evidence: `artifact:${branch.artifacts.evidence.artifact_id}@${branch.artifacts.evidence.version_id}`,
  };
}

async function classifyFixture(options = {}) {
  const fixture = aggregateFixture(options);
  const aggregate = await aggregateFixtureResult(fixture);
  const validated = await validateAggregateForDecision(aggregate, fixture.dependencies);
  const classification = classifyValidatedRelease(validated);
  return { fixture, aggregate, validated, classification };
}

test("clean authenticated required branches are READY with exact evidence refs", async () => {
  assert.deepEqual(RELEASE_ROUTES, ["READY_FOR_PRODUCTION", "RETURN_TO_IN_PROGRESS", "HOLD_IN_READY_FOR_QA"]);
  const { aggregate, classification } = await classifyFixture({ applicability: FULL });
  assert.deepEqual(classification, {
    route: "READY_FOR_PRODUCTION",
    target_state: "ready_for_production",
    verdict: "pass",
    checks: aggregate.branches.map((branch) => expectedCheck(branch, "passed")),
  });
});

test("authenticated product failure is RETURN and normalizes only its generic meta diagnostic", async () => {
  const { aggregate, validated, classification } = await classifyFixture({
    applicability: FULL,
    entryOverrides: { api: FAIL_API },
  });
  const api = aggregate.branches.find((branch) => branch.branch === "api");
  assert.equal(validated.valid, true);
  assert.equal(api.validity, "INVALID");
  assert.deepEqual(api.reason_codes, ["PRODUCT_FAILURE"]);
  assert.deepEqual(validated.reason_codes, ["PRODUCT_FAILURE"]);
  assert.deepEqual(classification, {
    route: "RETURN_TO_IN_PROGRESS",
    target_state: "in_progress",
    verdict: "fail",
    checks: aggregate.branches.map((branch) => expectedCheck(branch, branch.branch === "api" ? "failed" : "passed")),
  });
});

test("authenticated confirmed finding is also RETURN", async () => {
  const { aggregate, classification } = await classifyFixture({
    applicability: FULL,
    entryOverrides: { api: { confirmed_findings: 1 } },
  });
  assert.deepEqual(classification, {
    route: "RETURN_TO_IN_PROGRESS",
    target_state: "in_progress",
    verdict: "fail",
    checks: aggregate.branches.map((branch) => expectedCheck(branch, branch.branch === "api" ? "failed" : "passed")),
  });
});

test("uncertainty and mixed blocker shapes HOLD without a fabricated failed check", async (t) => {
  const cases = [
    ["finding on N/A branch", { applicability: DOCS, entryOverrides: { api: { confirmed_findings: 1 } } }],
    ["product failure plus unverified evidence", { applicability: FULL, entryOverrides: { api: { ...FAIL_API, evidence_status: "UNVERIFIED" } } }],
    ["product failure plus low confidence", { applicability: FULL, entryOverrides: { api: { ...FAIL_API, confidence: 0.1 } } }],
    ["inconclusive infrastructure failure", { applicability: FULL, entryOverrides: { api: { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0, code: "TRANSPORT_FAILURE" } } }],
    ["missing required evidence", { applicability: FULL, entryOverrides: { api: { evidence_status: "UNVERIFIED" } } }],
    ["zero required checks", { applicability: NONE, profileOverrides: { environment: { strategy: "none" } } }],
  ];
  for (const [name, options] of cases) await t.test(name, async () => {
    const { classification } = await classifyFixture(options);
    assert.deepEqual(
      { route: classification.route, target_state: classification.target_state, verdict: classification.verdict },
      HOLD,
    );
    assert.equal(classification.checks.some(({ status }) => status === "failed"), false);
    if (name === "zero required checks") assert.deepEqual(classification.checks, []);
  });
});

test("invalid cyclic proxy and unknown inputs HOLD with no checks", () => {
  const cyclic = {}; cyclic.aggregate = cyclic;
  const hostile = new Proxy({}, { ownKeys() { throw new Error("hostile"); } });
  for (const input of [null, {}, { valid: false, aggregate: null, reason_codes: ["UNKNOWN"] }, cyclic, hostile]) {
    assert.deepEqual(classifyValidatedRelease(input), { ...HOLD, checks: [] });
  }
});
