import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { planQaScope } from "../../scripts/qah/plan.mjs";
import { resolveContext } from "../../scripts/qah/context.mjs";
import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { createSyntheticGraphPlan } from "../../scripts/qah/graph-plan.mjs";

const profile = {
  schema_version: "nuanu.qa-project-profile.v1",
  project_key: "paydemo",
  repository: { allowed_origin: "https://github.com/solomindanil/NuanuFlowQA.git" },
  environment: { strategy: "managed_command", prepare_command: ["node", "prepare"], cleanup_command: ["node", "cleanup"], health_path: "/build-info" },
  checks: { code: ["npm", "run", "typecheck"], api: ["node", "api"], ui: ["node", "ui"], domain: ["node", "domain"] },
  outcome_codes: Object.fromEntries(["code", "api", "ui", "domain"].map((branch) => [branch, { pass: [`${branch.toUpperCase()}_PASS`], fail: [`${branch.toUpperCase()}_FAIL`], infra: [`${branch.toUpperCase()}_INFRA`], skipped: [`${branch.toUpperCase()}_SKIPPED`] }])),
  safety: { mutation_mode: "sandbox_only", irreversible_actions: "deny", secret_output: "deny", allowed_origins: ["http://127.0.0.1"] },
  execution: { shell: false, environment: "minimal", timeout_ms: 300000, max_output_bytes: 1048576 },
  test_data: { profiles: ["default"] },
  areas: {
    ui: { paths: ["apps/paydemo/public/**", "tests/**/ui/**"], labels: ["ui", "frontend"] },
    api: { paths: ["apps/paydemo/server.mjs", "tests/**/api/**"], labels: ["api", "backend"] },
    domain: { paths: ["apps/paydemo/**/payment*", "tests/**/domain/**"], labels: ["payments", "auth", "data"] },
  },
  risk: { high_keywords: ["payment", "authentication", "authorization", "pii", "webhook"], critical_keywords: ["real-money", "production-migration"], confidence_threshold: 0.95 },
};

async function fixture(name) {
  const raw = JSON.parse(await readFile(new URL(`./fixtures/context-${name}.json`, import.meta.url), "utf8"));
  return resolveContext(raw, profile.repository);
}

function graphEvent(projectKey = "paydemo") {
  return {
    schema_version: "nuanu.qa-column-ticket-event.v1",
    event_id: "event-payd-101-ready-for-qa",
    ticket_id: "PAYD-101",
    project_key: projectKey,
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

test("UI-only change requires code and UI but skips API and domain", async () => {
  const plan = planQaScope(await fixture("ui"), profile);
  assert.deepEqual(plan.applicability, { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "REQUIRED", domain: "NOT_APPLICABLE" });
});

test("fixture matrix classifies API, mixed, and documentation-only changes", async () => {
  const [api, mixed, docs] = await Promise.all([fixture("api"), fixture("mixed"), fixture("docs")]);
  assert.deepEqual(planQaScope(api, profile).applicability, { code: "REQUIRED", api: "REQUIRED", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
  assert.deepEqual(planQaScope(mixed, profile).applicability, { code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "REQUIRED" });
  assert.deepEqual(planQaScope(docs, profile).applicability, { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
});

test("fintech authentication change is never below HIGH risk", async () => {
  assert.equal(planQaScope(await fixture("fintech"), profile).risk_level, "HIGH");
});

test("empty changed files fail closed across every branch", async () => {
  const context = await fixture("docs");
  context.changed_files = [];
  const plan = planQaScope(context, profile);
  assert.deepEqual(plan.applicability, { code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "REQUIRED" });
  assert.deepEqual(plan.branch_reasons.api, [{ code: "UNKNOWN_SCOPE" }]);
});

test("planning is byte-deterministic and hashes the plan without its digest", async () => {
  const context = await fixture("mixed");
  const first = planQaScope(context, profile);
  const second = planQaScope(context, profile);
  assert.equal(canonicalJson(first), canonicalJson(second));
  const { plan_sha256, ...unsigned } = first;
  assert.equal(plan_sha256, sha256(unsigned));
});

test("planner rejects malformed full context instead of signing its artifact slot", async () => {
  const malformedSource = await fixture("ui");
  malformedSource.source_artifact = { id: "", version: 0 };
  assert.throws(() => planQaScope(malformedSource, profile), /source_artifact/);

  const malformedHash = await fixture("ui");
  malformedHash.content_hash = "not-a-digest";
  assert.throws(() => planQaScope(malformedHash, profile), /content_hash/);

  const unsafePath = await fixture("ui");
  unsafePath.changed_files = ["../checkout.js"];
  assert.throws(() => planQaScope(unsafePath, profile), /traversal/);
});

test("immutable risk floors keep auth and payment changes HIGH without profile keyword lists", async () => {
  const profileWithoutRiskKeywords = structuredClone(profile);
  delete profileWithoutRiskKeywords.risk.high_keywords;
  delete profileWithoutRiskKeywords.risk.critical_keywords;

  const auth = await fixture("docs");
  auth.labels = ["auth"];
  assert.equal(planQaScope(auth, profileWithoutRiskKeywords).risk_level, "HIGH");

  const payments = await fixture("docs");
  payments.changed_files = ["apps/paydemo/lib/payment-service.mjs"];
  payments.labels = ["payments"];
  assert.equal(planQaScope(payments, profileWithoutRiskKeywords).risk_level, "HIGH");
});

test("capability-only tokens do not activate a branch without a profile mapping", async () => {
  const context = await fixture("docs");
  context.acceptance_capabilities = ["api"];
  const plan = planQaScope(context, profile);
  assert.equal(plan.applicability.api, "NOT_APPLICABLE");
  assert.deepEqual(plan.branch_reasons.api, []);
});

test("graph-driven planning ignores contradictory path and label heuristics", async () => {
  const context = await fixture("docs");
  context.changed_files = ["docs/readme.md"];
  context.labels = [];
  const event = graphEvent();
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");

  const plan = planQaScope(context, profile, { event, plan: graphPlan });

  assert.deepEqual(plan.applicability, {
    code: "REQUIRED",
    api: "REQUIRED",
    ui: "REQUIRED",
    domain: "NOT_APPLICABLE",
  });
  assert.equal(plan.graph_binding.graph_plan_digest, graphPlan.plan_digest);
  assert.deepEqual(plan.graph_binding, plan.artifact_slot.graph_binding);
  assert.deepEqual(plan.branches, ["code", "api", "ui"]);
});

test("graph-required planning never falls back after admission failure", async () => {
  const event = graphEvent();
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");
  graphPlan.plan_digest = `sha256:${"0".repeat(64)}`;
  const context = await fixture("mixed");

  assert.throws(
    () => planQaScope(context, profile, { event, plan: graphPlan }),
    /graph plan admission failed/i,
  );
});
