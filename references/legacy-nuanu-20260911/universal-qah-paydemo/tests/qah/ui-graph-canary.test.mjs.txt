import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { canonicalJson } from "../../scripts/qah/canonical.mjs";
import { validateFinalProofGateClaim } from "../../scripts/qah/claim-adapter.mjs";
import { runOfflineGraphQaFlow } from "../../scripts/qah/offline-graph-flow.mjs";
import {
  deriveUiGraphCanaryScenario,
  runUiGraphCanaryPhase,
} from "../../scripts/qah/ui-graph-canary.mjs";

const SOURCE_REF = Object.freeze({
  artifact_id: "92400946-cc1f-5731-b1aa-af14a9765b7a",
  version_id: "103a0d1b-7d39-4512-b5f6-06cc1b64a527",
  kind: "flow_item",
  role: "source",
});
const VERIFICATION_REF = Object.freeze({
  artifact_id: "11111111-1111-4111-8111-111111111111",
  version_id: "22222222-2222-4222-8222-222222222222",
  kind: "document",
  role: "output",
});
const FINALIZATION_REF = Object.freeze({
  artifact_id: "33333333-3333-4333-8333-333333333333",
  version_id: "44444444-4444-4444-8444-444444444444",
  kind: "document",
  role: "output",
});

const CRITICAL_SNAPSHOT = Object.freeze({
  issue_id: "ac868a24-f0c4-4012-adac-e7b38b4b87f8",
  identifier: "PAYD-29",
  title: "[CANARY] Verify card checkout change",
  description: "The ticket changes card payment confirmation and checkout business rules.",
  project_key: "payd",
  state_name: "Ready for QA",
  labels: ["canary", "payments"],
  updated_at: "2026-08-12T00:00:00.000Z",
});

function prepareInput(snapshot = CRITICAL_SNAPSHOT) {
  return {
    phase: "prepare",
    source_ref: SOURCE_REF,
    source_name: `${snapshot.identifier} · ${snapshot.title}`,
    source_media_type: "application/vnd.nuanu.flow-item+json",
    source_snapshot: structuredClone(snapshot),
  };
}

async function fixture(t) {
  const taskRoot = await mkdtemp(join(tmpdir(), "qah-ui-graph-canary-"));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  return { taskRoot, outputDir: join(taskRoot, "qah", "ui-graph-canary") };
}

test("payment and business-function facts deterministically require a human", () => {
  assert.deepEqual(deriveUiGraphCanaryScenario(CRITICAL_SNAPSHOT), {
    scenario: "critical",
    change_hints: ["payment-checkout"],
    matched_knowledge_rules: ["business-function", "payment"],
  });
});

test("ordinary UI and API changes remain machine-analyzable", () => {
  const snapshot = {
    ...CRITICAL_SNAPSHOT,
    title: "Update profile avatar",
    description: "Change profile API response and avatar UI rendering.",
    labels: ["profile"],
  };
  assert.deepEqual(deriveUiGraphCanaryScenario(snapshot), {
    scenario: "noncritical",
    change_hints: ["profile-api", "profile-ui"],
    matched_knowledge_rules: [],
  });
});

test("an exact Onyx target directive selects the code-owned public browser profile", () => {
  const snapshot = {
    ...CRITICAL_SNAPSHOT,
    title: "Verify Onyx landing-page navigation",
    description: "QAH target: https://onyxcampus.com/\nCheck the public UI without submitting the application form.",
    labels: ["onyx", "public-ui"],
  };
  assert.deepEqual(deriveUiGraphCanaryScenario(snapshot), {
    scenario: "noncritical",
    change_hints: ["profile-ui"],
    matched_knowledge_rules: ["onyx-public-ui"],
    browser_target: "https://onyxcampus.com/",
  });
});

test("real Onyx browser evidence is bound into verification and a product failure returns the ticket to work", async (t) => {
  const value = await fixture(t);
  const snapshot = {
    ...CRITICAL_SNAPSHOT,
    identifier: "PAYD-38",
    title: "Verify Onyx public UI",
    description: "QAH target: https://onyxcampus.com/",
    labels: ["onyx", "public-ui"],
  };
  const browserProbe = {
    schema_version: "nuanu.qah-onyx-browser-probe.v1",
    status: "failed",
    target_url: "https://onyxcampus.com/",
    checked_at: "2026-08-12T00:00:00.000Z",
    pages: [],
    form_count: 1,
    apply_cta_count: 9,
    ignored_media_aborts: 0,
    product_network_requests: 3,
    failure_codes: ["HTTP_500"],
  };
  await runUiGraphCanaryPhase("prepare", prepareInput(snapshot), {
    ...value,
    readRepositoryHead: async () => "d".repeat(40),
    runBrowserProbe: async () => browserProbe,
  });
  const verification = JSON.parse(await readFile(join(value.outputDir, "qah-verification.json"), "utf8"));
  assert.deepEqual(verification.browser_probe, browserProbe);
  assert.equal(verification.receipt.route, "RETURN_TO_WORK");
  assert.equal(verification.receipt.proof_gate_outcome, "not_passed");
  assert.equal(verification.receipt.proof_gate_claim.verdict, "fail");
  assert.equal(verification.receipt.authority_telemetry.product_network_requests, 3);
});

test("an unavailable browser runtime produces bounded unable-to-verify evidence instead of a false product failure", async (t) => {
  const value = await fixture(t);
  const snapshot = {
    ...CRITICAL_SNAPSHOT,
    identifier: "PAYD-39",
    title: "Verify Onyx public UI",
    description: "QAH target: https://onyxcampus.com/",
    labels: ["onyx", "public-ui"],
  };
  await runUiGraphCanaryPhase("prepare", prepareInput(snapshot), {
    ...value,
    readRepositoryHead: async () => "e".repeat(40),
    runBrowserProbe: async () => { throw new Error("sensitive host detail"); },
  });
  const verification = JSON.parse(await readFile(join(value.outputDir, "qah-verification.json"), "utf8"));
  assert.deepEqual(verification.browser_probe, {
    schema_version: "nuanu.qah-onyx-browser-probe.v1",
    status: "blocked",
    target_url: "https://onyxcampus.com/",
    failure_codes: ["BROWSER_RUNTIME_UNAVAILABLE"],
    product_network_requests: 0,
  });
  assert.equal(verification.receipt.route, "HOLD");
  assert.deepEqual(verification.receipt.reason_codes, ["EXECUTION_FAILED"]);
});

test("Ready for QA UI canary executes the graph plan and publishes a human-review Proof Gate claim", async (t) => {
  const value = await fixture(t);
  const testedHeadSha = "b".repeat(40);
  const prepared = await runUiGraphCanaryPhase("prepare", prepareInput(), {
    ...value,
    readRepositoryHead: async () => testedHeadSha,
  });
  assert.equal(prepared.phase, "prepared");
  assert.deepEqual(prepared.files.map(({ slot, media_type }) => ({ slot, media_type })), [
    { slot: "qah_verification", media_type: "application/json" },
  ]);

  const verificationSource = await readFile(join(value.outputDir, "qah-verification.json"), "utf8");
  const verification = JSON.parse(verificationSource);
  assert.equal(verificationSource, canonicalJson(verification));
  assert.equal(verification.schema_version, "nuanu.qah-ui-graph-verification.v1");
  assert.equal(verification.source_snapshot.identifier, "PAYD-29");
  assert.equal(verification.source_snapshot.project_key, "payd");
  assert.equal(verification.event.project_key, "paydemo");
  assert.equal(verification.graph_scenario, "critical");
  assert.equal(verification.receipt.trigger, "column:ready_for_qa");
  assert.equal(verification.receipt.route, "HUMAN_REVIEW");
  assert.equal(verification.receipt.proof_gate_outcome, "unable_to_verify");
  assert.equal(verification.receipt.criticality, "HUMAN_REQUIRED");
  assert.equal(verification.receipt.proof_gate_claim.tested_head_sha, testedHeadSha);
  assert.deepEqual(verification.receipt.human_check_ids, ["payment.card-human-approval"]);
  assert.deepEqual(verification.receipt.executed_check_ids, ["qah.contracts", "payment.api", "payment.domain"]);
  assert.deepEqual(verification.receipt.authority_telemetry, {
    product_repository_reads: 0,
    git_commands: 0,
    product_network_requests: 0,
    credential_reads: 0,
  });

  const finalized = await runUiGraphCanaryPhase("finalize", {
    phase: "finalize",
    artifact_refs: { qah_verification: VERIFICATION_REF },
  }, value);
  assert.equal(finalized.phase, "finalization_prepared");
  const report = JSON.parse(await readFile(join(value.outputDir, "finalization.json"), "utf8"));
  assert.equal(report.schema_version, "nuanu.qah-ui-graph-finalization.v1");
  assert.equal(report.route, "HUMAN_REVIEW");
  assert.deepEqual(report.reason_codes, ["HUMAN_ONLY_BUSINESS_FUNCTION", "PAYMENT_IMPACT"]);
  assert.deepEqual(report.claim, {
    transition_allowed: true,
    target_state: "ready_for_qa",
    reason_codes: [],
    kind: "qa",
    verdict: "blocked",
    tested_head_sha: verification.receipt.proof_gate_claim.tested_head_sha,
    checks: verification.receipt.proof_gate_claim.checks,
  });

  const completed = await runUiGraphCanaryPhase("complete", {
    phase: "complete",
    artifact_refs: {
      qah_verification: VERIFICATION_REF,
      finalization_report: FINALIZATION_REF,
    },
  }, value);
  assert.deepEqual(completed.item.data, report.claim);
  assert.deepEqual(completed.artifact_outputs, {
    "item.artifacts.qah_verification": VERIFICATION_REF,
    "item.artifacts.finalization_report": FINALIZATION_REF,
  });

  const noRepositoryCompletion = await runUiGraphCanaryPhase("complete-no-repository", {
    phase: "complete-no-repository",
    artifact_refs: {
      qah_verification: VERIFICATION_REF,
      finalization_report: FINALIZATION_REF,
    },
  }, value);
  assert.deepEqual(noRepositoryCompletion.item.data, {
    schema_version: "nuanu.qah-no-repository-result.v1",
    transition_allowed: true,
    target_state: "ready_for_qa",
    reason_codes: [],
    verdict: "blocked",
    checks: report.claim.checks,
    harness_head_sha: report.claim.tested_head_sha,
  });
  assert.equal(Object.hasOwn(noRepositoryCompletion.item.data, "kind"), false);
  assert.equal(Object.hasOwn(noRepositoryCompletion.item.data, "tested_head_sha"), false);
  assert.deepEqual(noRepositoryCompletion.artifact_outputs, completed.artifact_outputs);
  assert.equal(report.claim.kind, "qa");
  assert.equal(report.claim.tested_head_sha, verification.receipt.proof_gate_claim.tested_head_sha);
});

test("executor failure still reaches stock Proof Gate as truthful unable-to-verify evidence", async (t) => {
  const value = await fixture(t);
  const testedHeadSha = "c".repeat(40);
  const prepared = await runUiGraphCanaryPhase("prepare", prepareInput(), {
    ...value,
    readQaProjectKey: async () => "paydemo",
    readRepositoryHead: async () => testedHeadSha,
    execute: async (event, graphPlan) => runOfflineGraphQaFlow({
      event,
      graphPlan,
      executeAssignment: async () => { throw new Error("synthetic executor failure"); },
    }),
  });
  assert.equal(prepared.phase, "prepared");
  const verification = JSON.parse(await readFile(join(value.outputDir, "qah-verification.json"), "utf8"));
  assert.equal(verification.receipt.route, "HOLD");
  assert.equal(verification.receipt.proof_gate_claim, null);
  assert.deepEqual(verification.receipt.reason_codes, ["EXECUTION_FAILED"]);
  assert.equal(verification.tested_head_sha, testedHeadSha);

  await runUiGraphCanaryPhase("finalize", {
    phase: "finalize",
    artifact_refs: { qah_verification: VERIFICATION_REF },
  }, value);
  const report = JSON.parse(await readFile(join(value.outputDir, "finalization.json"), "utf8"));
  assert.deepEqual(report.claim, {
    transition_allowed: true,
    target_state: "ready_for_qa",
    reason_codes: [],
    kind: "qa",
    verdict: "blocked",
    tested_head_sha: testedHeadSha,
    checks: [{
      name: "graph_qah_execution",
      status: "failed",
      evidence: `artifact:${VERIFICATION_REF.artifact_id}@${VERIFICATION_REF.version_id}`,
    }],
  });
  assert.equal(validateFinalProofGateClaim(report.claim), true);
});

test("UI canary rejects unbounded or identity-conflicting Flow snapshots before execution", async (t) => {
  const value = await fixture(t);
  const conflictingIdentity = prepareInput({ ...CRITICAL_SNAPSHOT, identifier: "PAYD-30" });
  conflictingIdentity.source_name = `PAYD-29 · ${conflictingIdentity.source_snapshot.title}`;
  for (const hostile of [
    { ...prepareInput(), ambient_token: "forbidden" },
    conflictingIdentity,
    prepareInput({ ...CRITICAL_SNAPSHOT, state_name: "In Progress" }),
    prepareInput({ ...CRITICAL_SNAPSHOT, labels: Array.from({ length: 17 }, (_, index) => `label-${index}`) }),
    prepareInput({ ...CRITICAL_SNAPSHOT, description: "x".repeat(20_001) }),
  ]) {
    await assert.rejects(() => runUiGraphCanaryPhase("prepare", hostile, value));
  }
});
