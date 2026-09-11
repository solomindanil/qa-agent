import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import YAML from "yaml";

import { loadWorkerCompletionValidator } from "./helpers/worker-contract.mjs";
import { BRANCHES } from "../../scripts/qah/contracts.mjs";
import { FULL_QAH_FINALIZATION_OUTPUT_DEFINITION, runLocalQaHarness } from "../../scripts/qah/local-harness.mjs";

const { buildCanonicalCompletion } = await loadWorkerCompletionValidator();

const expectedApplicability = {
  api: { code: "REQUIRED", api: "REQUIRED", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" },
  ui: { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "REQUIRED", domain: "NOT_APPLICABLE" },
  docs: { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" },
  mixed: { code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "REQUIRED" },
};

const secretCanaries = ["4111111111111111", "Authorization: Bearer", "raw-response-body"];
const finalizationOutputDefinition = structuredClone(FULL_QAH_FINALIZATION_OUTPUT_DEFINITION);

function assertExactBranchMatrix(result, fixture) {
  assert.deepEqual(result.plan.applicability, expectedApplicability[fixture]);
  assert.deepEqual(result.branches.map((entry) => entry.branch), BRANCHES);
  for (const entry of result.branches) {
    const expected = expectedApplicability[fixture][entry.branch];
    assert.equal(entry.applicability, expected, `${fixture}:${entry.branch} applicability`);
    assert.equal(entry.product_result, expected === "NOT_APPLICABLE" ? "SKIPPED" : "PASS");
  }
}

function assertWorkerBoundaries(result) {
  for (const [key, envelope] of Object.entries(result.worker_envelopes)) {
    assert.deepEqual(Object.keys(envelope).sort(), ["artifact_outputs", "item"], key);
    assert.equal(envelope.item.key, key);
    assert.equal(typeof envelope.item.description, "string");
    assert.deepEqual(Object.keys(envelope.item).sort(), ["artifacts", "data", "description", "key"]);
    for (const ref of Object.values(envelope.artifact_outputs)) {
      assert.match(ref.artifact_id, /^[0-9a-f-]{36}$/);
      assert.match(ref.version_id, /^[0-9a-f-]{36}$/);
      assert.ok(["document", "flow_item"].includes(ref.kind));
      assert.ok(["output", "evidence", "implementation", "source"].includes(ref.role));
    }
  }
}

test("canonical API, UI, docs, and mixed tickets traverse the real universal QA contracts", async (t) => {
  for (const fixture of ["api", "ui", "docs", "mixed"]) {
    await t.test(fixture, async () => {
      const result = await runLocalQaHarness({ fixture, buildCanonicalCompletion, finalizationOutputDefinition });
      assertExactBranchMatrix(result, fixture);
      assert.equal(result.playwright_adapter_invocations, expectedApplicability[fixture].ui === "REQUIRED" ? 1 : 0);
      assert.equal(result.environment_created, fixture !== "docs");
      assert.equal(result.decision.route, "READY_FOR_PRODUCTION");
      assert.equal(result.finalization.transition_allowed, true);
      assert.equal(result.finalization.target_state, "ready_for_production");
      if (fixture === "docs") {
        assert.equal(result.branches.find(({ branch }) => branch === "code").body_invoked, true);
        assert.equal(result.branches.filter(({ branch }) => branch !== "code").some(({ body_invoked }) => body_invoked), false);
      }
      assert.deepEqual(result.events.slice(-3).sort(), ["cleanup-complete", "comment-complete", "transition"]);
      assert.ok(result.events.indexOf("transition") > result.events.indexOf("comment-complete"));
      assert.ok(result.events.indexOf("transition") > result.events.indexOf("cleanup-complete"));
      assertWorkerBoundaries(result);
      const serialized = JSON.stringify(result);
      for (const canary of secretCanaries) assert.equal(serialized.includes(canary), false, canary);
    });
  }
});

test("mixed applicable branch bodies overlap and materialize independent evidence", async () => {
  const result = await runLocalQaHarness({ fixture: "mixed", buildCanonicalCompletion, finalizationOutputDefinition });
  const required = result.branches.filter(({ applicability }) => applicability === "REQUIRED");
  const overlaps = required.some((left, index) => required.slice(index + 1).some((right) =>
    left.started_at < right.ended_at && right.started_at < left.ended_at));
  assert.equal(overlaps, true);
  assert.ok(required.filter(({ body_invoked }) => body_invoked).length >= 2);
  assert.equal(new Set(required.flatMap(({ artifact_refs }) => Object.values(artifact_refs).map(({ version_id }) => version_id))).size, required.length * 3);
});

test("pass, product failure, and missing evidence materialize exact final Proof Gate claims", async () => {
  const finalizationCases = [
    ["pass", "READY_FOR_PRODUCTION", "pass", "ready_for_production", []],
    ["product-failure", "RETURN_TO_IN_PROGRESS", "fail", "in_progress", ["PRODUCT_FAILURE"]],
    ["missing-evidence", "HOLD_IN_READY_FOR_QA", "blocked", "ready_for_qa", [
      "EVIDENCE_NOT_VERIFIED", "INFRA_FAILURE", "INVALID_AGGREGATE_POLICY", "LOW_CONFIDENCE", "REQUIRED_BRANCH_NOT_PASS",
    ]],
  ];
  for (const [mode, route, verdict, target, reason_codes] of finalizationCases) {
    const result = await runLocalQaHarness({ fixture: "mixed", mode, buildCanonicalCompletion, finalizationOutputDefinition });
    assert.deepEqual(result.publication_validation, { valid: true, reason_codes });
    assert.equal(result.decision.route, route);
    assert.equal(result.finalization_flow_step_result.item.data.verdict, verdict);
    assert.equal(result.finalization_flow_step_result.item.data.target_state, target);
    assert.equal(result.finalization_flow_step_result.item.data.tested_head_sha, result.aggregate.commit);
    assert.equal(result.finalization_flow_step_result.item.data.checks.every(({ evidence }) => /^artifact:[0-9a-f-]{36}@[0-9a-f-]{36}$/.test(evidence)), true);
    assert.equal("artifact_outputs" in result.finalization_flow_step_result, false);
    if (verdict === "blocked") assert.equal(result.finalization_flow_step_result.item.data.checks.some(({ status }) => status === "failed"), false);
  }
});

test("docs uses exact committed none-profile bytes while PayDemo keeps its managed profile", async () => {
  const productProfile = YAML.parse(await readFile(new URL("../../qa-harness.yaml", import.meta.url), "utf8"));
  const docsBytes = await readFile(new URL("./fixtures/qa-harness.docs.yaml", import.meta.url));
  const docsProfile = YAML.parse(docsBytes.toString("utf8"));
  assert.equal(productProfile.environment.strategy, "managed_command");
  assert.equal(docsProfile.environment.strategy, "none");

  const result = await runLocalQaHarness({ fixture: "docs", buildCanonicalCompletion, finalizationOutputDefinition });
  assert.deepEqual(result.profile_source, {
    path: "tests/qah/fixtures/qa-harness.docs.yaml",
    environment_strategy: "none",
    git_blob_sha256: `sha256:${createHash("sha256").update(docsBytes).digest("hex")}`,
  });
});
