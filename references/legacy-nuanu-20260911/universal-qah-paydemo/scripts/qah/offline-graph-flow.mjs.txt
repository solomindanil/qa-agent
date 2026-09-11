import { canonicalJson, sha256 } from "./canonical.mjs";
import { validateFinalProofGateClaim } from "./claim-adapter.mjs";
import { admitGraphTestPlan, compileGraphExecutionAssignment } from "./graph-plan.mjs";

const EMPTY_TELEMETRY = Object.freeze({
  product_repository_reads: 0,
  git_commands: 0,
  product_network_requests: 0,
  credential_reads: 0,
});

function exactTelemetry(value) {
  return value && Number.isSafeInteger(value.product_network_requests) && value.product_network_requests >= 0
    && value.product_repository_reads === 0 && value.git_commands === 0 && value.credential_reads === 0
    && canonicalJson(Object.keys(value).sort()) === canonicalJson(Object.keys(EMPTY_TELEMETRY).sort());
}

function receipt(fields) {
  const unsigned = {
    schema_version: "nuanu.qa-offline-graph-flow-receipt.v1",
    event_id: fields.event_id,
    ticket_id: fields.ticket_id,
    trigger: "column:ready_for_qa",
    graph_plan_digest: fields.graph_plan_digest,
    knowledge_digest: fields.knowledge_digest,
    criticality: fields.criticality,
    execution_attempts: fields.execution_attempts,
    executed_check_ids: fields.executed_check_ids,
    human_check_ids: fields.human_check_ids,
    route: fields.route,
    proof_gate_outcome: fields.proof_gate_outcome,
    proof_gate_claim: fields.proof_gate_claim,
    reason_codes: fields.reason_codes,
    authority_telemetry: fields.authority_telemetry,
    execution: fields.execution,
  };
  return { ...unsigned, receipt_digest: sha256(unsigned) };
}

function hold(event, graphPlan, reasonCodes, executionAttempts = 0, execution = null) {
  return receipt({
    event_id: typeof event?.event_id === "string" ? event.event_id : null,
    ticket_id: typeof event?.ticket_id === "string" ? event.ticket_id : null,
    graph_plan_digest: typeof graphPlan?.plan_digest === "string" ? graphPlan.plan_digest : null,
    knowledge_digest: typeof graphPlan?.knowledge_digest === "string" ? graphPlan.knowledge_digest : null,
    criticality: null,
    execution_attempts: executionAttempts,
    executed_check_ids: [],
    human_check_ids: [],
    route: "HOLD",
    proof_gate_outcome: "unable_to_verify",
    proof_gate_claim: null,
    reason_codes: [...reasonCodes].sort(),
    authority_telemetry: { ...EMPTY_TELEMETRY },
    execution,
  });
}

export async function runOfflineGraphQaFlow({ event, graphPlan, executeAssignment }) {
  const admitted = admitGraphTestPlan(event, graphPlan);
  if (admitted.status !== "ACCEPTED") return hold(event, graphPlan, admitted.reason_codes);
  if (typeof executeAssignment !== "function") return hold(event, graphPlan, ["EXECUTOR_UNAVAILABLE"]);

  const assignment = compileGraphExecutionAssignment(event, admitted.plan);
  let execution;
  try {
    execution = await executeAssignment(assignment, { event, graphPlan: admitted.plan });
  } catch {
    return hold(event, graphPlan, ["EXECUTION_FAILED"], 1);
  }
  const expectedChecks = assignment.automated_checks.map(({ check_id }) => check_id);
  if (!execution || execution.assignment_digest !== assignment.assignment_digest
    || execution.graph_binding?.graph_plan_digest !== graphPlan.plan_digest
    || canonicalJson(execution.executed_check_ids) !== canonicalJson(expectedChecks)
    || !exactTelemetry(execution.authority_telemetry)
    || !validateFinalProofGateClaim(execution.proof_gate_claim)) {
    return hold(event, graphPlan, ["EXECUTION_INTEGRITY_FAILED"], 1);
  }

  let route;
  let proofGateOutcome;
  let reasonCodes = [];
  if (execution.automated_route === "RETURN_TO_IN_PROGRESS") {
    route = "RETURN_TO_WORK";
    proofGateOutcome = "not_passed";
    reasonCodes = ["PRODUCT_FAILURE"];
  } else if (execution.automated_route !== "READY_FOR_PRODUCTION") {
    route = "HOLD";
    proofGateOutcome = "unable_to_verify";
    reasonCodes = ["AUTOMATED_EVIDENCE_NOT_READY"];
  } else if (assignment.human_checks.length > 0) {
    route = "HUMAN_REVIEW";
    proofGateOutcome = "unable_to_verify";
    reasonCodes = assignment.criticality.reason_codes;
  } else {
    route = "READY_FOR_PRODUCTION";
    proofGateOutcome = "passed";
  }

  const proofGateClaim = structuredClone(execution.proof_gate_claim);
  if (proofGateOutcome === "unable_to_verify") {
    proofGateClaim.verdict = "blocked";
    proofGateClaim.target_state = "ready_for_qa";
    proofGateClaim.reason_codes = [];
  }
  if (!validateFinalProofGateClaim(proofGateClaim)) return hold(event, graphPlan, ["EXECUTION_INTEGRITY_FAILED"], 1);

  return receipt({
    event_id: event.event_id,
    ticket_id: event.ticket_id,
    graph_plan_digest: graphPlan.plan_digest,
    knowledge_digest: graphPlan.knowledge_digest,
    criticality: assignment.criticality.status,
    execution_attempts: 1,
    executed_check_ids: expectedChecks,
    human_check_ids: assignment.human_checks.map(({ check_id }) => check_id),
    route,
    proof_gate_outcome: proofGateOutcome,
    proof_gate_claim: proofGateClaim,
    reason_codes: [...reasonCodes].sort(),
    authority_telemetry: execution.authority_telemetry,
    execution,
  });
}

export function createOfflineHarnessExecutor({ runHarness, buildCanonicalCompletion, finalizationOutputDefinition, mode = "pass", testedHeadSha = null }) {
  if (typeof runHarness !== "function" || typeof buildCanonicalCompletion !== "function" || !finalizationOutputDefinition) throw new Error("offline harness dependencies are required");
  if (!["pass", "product-failure"].includes(mode)) throw new Error("offline harness mode is invalid");
  if (testedHeadSha !== null && !/^[0-9a-f]{40}$/u.test(testedHeadSha)) throw new Error("tested head SHA is invalid");
  return async function executeAssignment(assignment, { event, graphPlan }) {
    const result = await runHarness({
      fixture: "mixed",
      mode,
      graphInput: { event, plan: graphPlan },
      buildCanonicalCompletion,
      finalizationOutputDefinition,
    });
    if (canonicalJson(result.plan.branches) !== canonicalJson(assignment.branches)) throw new Error("local QAH branch scope differs from graph assignment");
    const graphBinding = result.plan.graph_binding;
    if (!graphBinding || graphBinding.graph_plan_digest !== graphPlan.plan_digest) throw new Error("local QAH omitted graph binding");
    const evidenceSummary = {
      plan_sha256: result.plan.plan_sha256,
      aggregate_sha256: result.aggregate.aggregate_sha256,
      finalization: {
        route: result.decision.route,
        verdict: result.finalization_flow_step_result.item.data.verdict,
        target_state: result.finalization_flow_step_result.item.data.target_state,
      },
    };
    const proofGateClaim = structuredClone(result.finalization_flow_step_result.item.data);
    if (testedHeadSha !== null) proofGateClaim.tested_head_sha = testedHeadSha;
    return {
      schema_version: "nuanu.qa-offline-harness-execution.v1",
      assignment_digest: assignment.assignment_digest,
      graph_binding: graphBinding,
      executed_check_ids: assignment.automated_checks.map(({ check_id }) => check_id),
      automated_route: result.decision.route,
      proof_gate_claim: proofGateClaim,
      evidence_digest: sha256(evidenceSummary),
      authority_telemetry: { ...EMPTY_TELEMETRY },
    };
  };
}
