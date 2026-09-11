import assert from "node:assert/strict";
import test from "node:test";

import { sha256 } from "../../scripts/qah/canonical.mjs";
import { createSyntheticGraphPlan } from "../../scripts/qah/graph-plan.mjs";
import { FULL_QAH_FINALIZATION_OUTPUT_DEFINITION, runLocalQaHarness } from "../../scripts/qah/local-harness.mjs";
import { createOfflineHarnessExecutor, runOfflineGraphQaFlow } from "../../scripts/qah/offline-graph-flow.mjs";
import { loadWorkerCompletionValidator } from "./helpers/worker-contract.mjs";

const { buildCanonicalCompletion } = await loadWorkerCompletionValidator();

function ticketEvent(scenario = "noncritical") {
  return {
    schema_version: "nuanu.qa-column-ticket-event.v1",
    event_id: `event-payd-${scenario}-ready-for-qa`,
    ticket_id: scenario === "critical" ? "PAYD-202" : scenario === "product-failure" ? "PAYD-203" : "PAYD-201",
    project_key: "paydemo",
    from_state: "in_progress",
    to_state: "ready_for_qa",
    candidate: {
      candidate_id: `candidate-${scenario}`,
      candidate_revision: sha256(`offline-candidate-${scenario}`),
      environment_id: "offline-paydemo",
      change_hints: scenario === "critical" ? ["payment-checkout"] : ["profile-api", "profile-ui"],
    },
    triggered_at: "2026-08-12T00:00:00.000Z",
  };
}

async function runScenario(scenario) {
  const event = ticketEvent(scenario);
  const graphPlan = createSyntheticGraphPlan(event, scenario);
  const executeAssignment = createOfflineHarnessExecutor({
    runHarness: runLocalQaHarness,
    buildCanonicalCompletion,
    finalizationOutputDefinition: structuredClone(FULL_QAH_FINALIZATION_OUTPUT_DEFINITION),
    mode: scenario === "product-failure" ? "product-failure" : "pass",
  });
  return runOfflineGraphQaFlow({ event, graphPlan, executeAssignment });
}

test("Ready for QA noncritical event executes graph scope and proposes production", async () => {
  const receipt = await runScenario("noncritical");
  assert.equal(receipt.trigger, "column:ready_for_qa");
  assert.equal(receipt.execution_attempts, 1);
  assert.deepEqual(receipt.executed_check_ids, ["qah.contracts", "profile.api", "profile.ui"]);
  assert.equal(receipt.route, "READY_FOR_PRODUCTION");
  assert.equal(receipt.proof_gate_outcome, "passed");
  assert.equal(receipt.proof_gate_claim.verdict, "pass");
  assert.equal(receipt.proof_gate_claim.target_state, "ready_for_production");
  assert.equal(receipt.graph_plan_digest, receipt.execution.graph_binding.graph_plan_digest);
  assert.deepEqual(receipt.authority_telemetry, {
    product_repository_reads: 0,
    git_commands: 0,
    product_network_requests: 0,
    credential_reads: 0,
  });
});

test("critical payment impact runs automation but routes to a human", async () => {
  const receipt = await runScenario("critical");
  assert.equal(receipt.execution.automated_route, "READY_FOR_PRODUCTION");
  assert.equal(receipt.route, "HUMAN_REVIEW");
  assert.equal(receipt.proof_gate_outcome, "unable_to_verify");
  assert.equal(receipt.proof_gate_claim.verdict, "blocked");
  assert.equal(receipt.proof_gate_claim.target_state, "ready_for_qa");
  assert.deepEqual(receipt.proof_gate_claim.reason_codes, []);
  assert.equal(receipt.proof_gate_claim.checks.some(({ status }) => status === "failed"), false);
  assert.deepEqual(receipt.human_check_ids, ["payment.card-human-approval"]);
  assert.deepEqual(receipt.executed_check_ids, ["qah.contracts", "payment.api", "payment.domain"]);
});

test("confirmed impacted check failure returns the ticket to work", async () => {
  const receipt = await runScenario("product-failure");
  assert.equal(receipt.route, "RETURN_TO_WORK");
  assert.equal(receipt.proof_gate_outcome, "not_passed");
  assert.equal(receipt.proof_gate_claim.verdict, "fail");
  assert.equal(receipt.proof_gate_claim.target_state, "in_progress");
  assert.equal(receipt.execution.automated_route, "RETURN_TO_IN_PROGRESS");
});

test("invalid graph authority holds before the executor is called", async () => {
  const event = ticketEvent();
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");
  graphPlan.graph_digest = sha256("tampered-without-redigest");
  let calls = 0;

  const receipt = await runOfflineGraphQaFlow({
    event,
    graphPlan,
    executeAssignment: async () => { calls += 1; },
  });

  assert.equal(calls, 0);
  assert.equal(receipt.execution_attempts, 0);
  assert.equal(receipt.route, "HOLD");
  assert.equal(receipt.proof_gate_outcome, "unable_to_verify");
  assert.deepEqual(receipt.reason_codes, ["INVALID_GRAPH_PLAN"]);
});

test("one column event is executed once even when the executor fails", async () => {
  const event = ticketEvent();
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");
  let calls = 0;
  const receipt = await runOfflineGraphQaFlow({
    event,
    graphPlan,
    executeAssignment: async () => { calls += 1; throw new Error("offline fixture failed"); },
  });
  assert.equal(calls, 1);
  assert.equal(receipt.execution_attempts, 1);
  assert.equal(receipt.route, "HOLD");
  assert.deepEqual(receipt.reason_codes, ["EXECUTION_FAILED"]);
});

test("executor output without an exact Proof Gate claim fails closed", async () => {
  const event = ticketEvent();
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");
  const receipt = await runOfflineGraphQaFlow({
    event,
    graphPlan,
    executeAssignment: async (assignment) => ({
      assignment_digest: assignment.assignment_digest,
      graph_binding: { graph_plan_digest: graphPlan.plan_digest },
      executed_check_ids: assignment.automated_checks.map(({ check_id }) => check_id),
      automated_route: "READY_FOR_PRODUCTION",
      authority_telemetry: {
        product_repository_reads: 0,
        git_commands: 0,
        product_network_requests: 0,
        credential_reads: 0,
      },
    }),
  });
  assert.equal(receipt.route, "HOLD");
  assert.equal(receipt.proof_gate_claim, null);
  assert.deepEqual(receipt.reason_codes, ["EXECUTION_INTEGRITY_FAILED"]);
});

export { runScenario, ticketEvent };
