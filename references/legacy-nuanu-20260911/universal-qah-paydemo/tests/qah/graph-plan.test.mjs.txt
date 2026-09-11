import assert from "node:assert/strict";
import test from "node:test";

import { sha256 } from "../../scripts/qah/canonical.mjs";
import {
  admitGraphTestPlan,
  classifyGraphCriticality,
  compileGraphExecutionAssignment,
  createSyntheticGraphPlan,
  validateColumnTicketEvent,
} from "../../scripts/qah/graph-plan.mjs";

function ticketEvent() {
  return {
    schema_version: "nuanu.qa-column-ticket-event.v1",
    event_id: "event-payd-101-ready-for-qa",
    ticket_id: "PAYD-101",
    project_key: "paydemo",
    from_state: "in_progress",
    to_state: "ready_for_qa",
    candidate: {
      candidate_id: "candidate-profile-change",
      candidate_revision: sha256("offline-candidate-profile-change"),
      environment_id: "offline-paydemo",
      change_hints: ["profile-api", "profile-ui"],
    },
    triggered_at: "2026-08-12T00:00:00.000Z",
  };
}

function redigest(plan) {
  const copy = structuredClone(plan);
  delete copy.plan_digest;
  return { ...copy, plan_digest: sha256(copy) };
}

function hostilePlans(event, valid) {
  const foreign = redigest({ ...valid, ticket_id: "PAYD-foreign" });
  const stale = redigest({ ...valid, freshness: "stale" });
  const unknown = redigest({ ...valid, freshness: "unknown" });
  const conflicted = redigest({ ...valid, freshness: "conflicted" });
  const tampered = { ...valid, graph_digest: sha256("tampered") };
  const missingTransitive = redigest({
    ...valid,
    mandatory_checks: valid.mandatory_checks.filter(({ check_id }) => check_id !== "profile.ui"),
  });
  const critical = createSyntheticGraphPlan(event, "critical");
  const missingHumanProvenance = redigest({ ...critical, criticality_facts: [] });
  const extra = { ...valid, cwd: "/tmp/product" };
  const cyclic = structuredClone(valid);
  cyclic.self = cyclic;
  const throwingProxy = new Proxy({}, { get() { throw new Error("hostile getter"); } });
  return [foreign, stale, unknown, conflicted, tampered, missingTransitive, missingHumanProvenance, extra, cyclic, throwingProxy];
}

test("synthetic graph plan compiles exact impacted and always-on checks", () => {
  const event = ticketEvent();
  const plan = createSyntheticGraphPlan(event, "noncritical");
  const assignment = compileGraphExecutionAssignment(event, plan);

  assert.equal(admitGraphTestPlan(event, plan).status, "ACCEPTED");
  assert.deepEqual(assignment.branches, ["code", "api", "ui"]);
  assert.deepEqual(assignment.automated_checks.map(({ check_id }) => check_id), [
    "qah.contracts",
    "profile.api",
    "profile.ui",
  ]);
  assert.deepEqual(assignment.human_checks, []);
  assert.equal(assignment.graph_plan_digest, plan.plan_digest);
});

test("payment and business obligations cannot become automated only", () => {
  const plan = createSyntheticGraphPlan(ticketEvent(), "critical");
  assert.deepEqual(classifyGraphCriticality(plan), {
    status: "HUMAN_REQUIRED",
    human_check_ids: ["payment.card-human-approval"],
    reason_codes: ["HUMAN_ONLY_BUSINESS_FUNCTION", "PAYMENT_IMPACT"],
  });
});

test("foreign stale unknown conflicted tampered and incomplete plans hold", () => {
  const event = ticketEvent();
  const valid = createSyntheticGraphPlan(event, "noncritical");
  for (const value of hostilePlans(event, valid)) {
    const admitted = admitGraphTestPlan(event, value);
    assert.equal(admitted.status, "HOLD");
    assert.equal(admitted.plan, null);
    assert.ok(admitted.reason_codes.length > 0);
  }
});

test("ticket and graph inputs reject authority-bearing fields", () => {
  const event = ticketEvent();
  assert.throws(
    () => validateColumnTicketEvent({ ...event, repository_url: "https://example.test/product.git" }),
    /exact|field|key/i,
  );
  assert.equal(
    admitGraphTestPlan(event, { ...createSyntheticGraphPlan(event, "noncritical"), cwd: "/tmp/product" }).status,
    "HOLD",
  );
});

test("synthetic fixtures are canonical and scenario-bounded", () => {
  const event = ticketEvent();
  for (const scenario of ["noncritical", "critical", "product-failure"]) {
    const first = createSyntheticGraphPlan(event, scenario);
    const second = createSyntheticGraphPlan(event, scenario);
    assert.deepEqual(first, second);
    assert.equal(first.plan_digest, sha256(Object.fromEntries(Object.entries(first).filter(([key]) => key !== "plan_digest"))));
  }
  assert.throws(() => createSyntheticGraphPlan(event, "unknown-scenario"), /scenario/i);
});

export { ticketEvent };
