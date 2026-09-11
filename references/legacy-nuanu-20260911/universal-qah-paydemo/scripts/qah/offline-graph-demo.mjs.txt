#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import { canonicalJson, sha256 } from "./canonical.mjs";
import { createSyntheticGraphPlan } from "./graph-plan.mjs";
import { FULL_QAH_FINALIZATION_OUTPUT_DEFINITION, runLocalQaHarness } from "./local-harness.mjs";
import { createOfflineHarnessExecutor, runOfflineGraphQaFlow } from "./offline-graph-flow.mjs";
import { loadWorkerCompletionValidator } from "./worker-contract.mjs";

const SCENARIOS = Object.freeze(["noncritical", "critical", "product-failure"]);

function ticketEvent(scenario) {
  const sequence = scenario === "noncritical" ? "201" : scenario === "critical" ? "202" : "203";
  return {
    schema_version: "nuanu.qa-column-ticket-event.v1",
    event_id: `event-payd-${scenario}-ready-for-qa`,
    ticket_id: `PAYD-${sequence}`,
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

export async function runOfflineGraphDemo() {
  const { buildCanonicalCompletion } = await loadWorkerCompletionValidator();
  const scenarios = [];
  for (const scenario of SCENARIOS) {
    const event = ticketEvent(scenario);
    const graphPlan = createSyntheticGraphPlan(event, scenario);
    const executeAssignment = createOfflineHarnessExecutor({
      runHarness: runLocalQaHarness,
      buildCanonicalCompletion,
      finalizationOutputDefinition: structuredClone(FULL_QAH_FINALIZATION_OUTPUT_DEFINITION),
      mode: scenario === "product-failure" ? "product-failure" : "pass",
    });
    scenarios.push(await runOfflineGraphQaFlow({ event, graphPlan, executeAssignment }));
  }
  const summary = {
    scenarios: scenarios.length,
    product_repository_reads: scenarios.reduce((sum, item) => sum + item.authority_telemetry.product_repository_reads, 0),
    git_commands: scenarios.reduce((sum, item) => sum + item.authority_telemetry.git_commands, 0),
    product_network_requests: scenarios.reduce((sum, item) => sum + item.authority_telemetry.product_network_requests, 0),
    credential_reads: scenarios.reduce((sum, item) => sum + item.authority_telemetry.credential_reads, 0),
  };
  const unsigned = { schema_version: "nuanu.qa-offline-graph-demo.v1", scenarios, summary };
  return { ...unsigned, report_digest: sha256(unsigned) };
}

export async function main() {
  process.stdout.write(canonicalJson(await runOfflineGraphDemo()));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
