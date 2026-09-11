import { matchesGlob } from "node:path";
import { canonicalJson, sha256 } from "./canonical.mjs";
import { BRANCHES, validateProfile, validateTestPlan } from "./contracts.mjs";
import { validateResolvedContextBoundary } from "./context.mjs";
import { compileGraphExecutionAssignment, createGraphBinding } from "./graph-plan.mjs";

const EVIDENCE = Object.freeze({
  code: ["repository-diff", "static-analysis"],
  api: ["api-contract", "automated-api-test"],
  ui: ["playwright", "screenshot"],
  domain: ["domain-data", "sandbox-test"],
});
const MINIMUM_HIGH_RISK = Object.freeze(["payment", "payments", "auth", "authentication", "authorization", "pii", "webhook"]);
const MINIMUM_CRITICAL_RISK = Object.freeze(["real-money", "production-migration"]);

function matchingReasons(context, profile, branch) {
  if (branch === "code") return [{ code: "ALWAYS_CODE" }];
  const reasons = [];
  const area = profile.areas[branch];
  if (context.changed_files.some((file) => area.paths.some((pattern) => matchesGlob(file, pattern)))) reasons.push({ code: "PATH_RULE" });
  if (context.labels.some((label) => area.labels.includes(label))) reasons.push({ code: "LABEL_RULE" });
  return reasons;
}

function riskLevel(context, profile) {
  const tokens = new Set([...context.labels, ...context.acceptance_capabilities]);
  const matchesKeyword = (keyword) => tokens.has(keyword) || context.changed_files.some((file) => file.toLowerCase().includes(keyword));
  if ([...MINIMUM_CRITICAL_RISK, ...(profile.risk.critical_keywords ?? [])].some(matchesKeyword)) return "CRITICAL";
  if ([...MINIMUM_HIGH_RISK, ...(profile.risk.high_keywords ?? [])].some(matchesKeyword)) return "HIGH";
  return "MEDIUM";
}

function graphReason(checkId) {
  return `GRAPH_CHECK_${checkId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

function exactGraphInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || canonicalJson(Object.keys(value).sort()) !== canonicalJson(["event", "plan"])) throw new Error("graph input must contain exact event and plan keys");
  return value;
}

export function planQaScope(context, rawProfile, graphInput = undefined) {
  const profile = validateProfile(rawProfile);
  context = validateResolvedContextBoundary(context, profile.repository);
  const slot = context.artifact_slot;
  if (context.project_key !== profile.project_key) throw new Error("context project_key must match profile");

  const branch_reasons = {};
  const applicability = {};
  let graphBinding;
  let graphAssignment;
  if (graphInput !== undefined) {
    const graph = exactGraphInput(graphInput);
    graphAssignment = compileGraphExecutionAssignment(graph.event, graph.plan);
    graphBinding = createGraphBinding(graph.event, graph.plan);
    if (graph.event.project_key !== context.project_key) throw new Error("graph event project_key must match context");
    for (const branch of BRANCHES) {
      const checks = graphAssignment.automated_checks.filter((check) => check.branch === branch);
      branch_reasons[branch] = checks.map(({ check_id }) => ({ code: graphReason(check_id) }));
      applicability[branch] = checks.length > 0 ? "REQUIRED" : "NOT_APPLICABLE";
    }
  } else {
    const unknownScope = context.changed_files.length === 0;
    for (const branch of BRANCHES) {
      const reasons = unknownScope ? [{ code: "UNKNOWN_SCOPE" }] : matchingReasons(context, profile, branch);
      branch_reasons[branch] = reasons;
      applicability[branch] = branch === "code" || unknownScope || reasons.length > 0 ? "REQUIRED" : "NOT_APPLICABLE";
    }
  }
  const branches = BRANCHES.filter((branch) => applicability[branch] === "REQUIRED");
  const planArtifact = {
    schema_version: "nuanu.qa-test-plan.v1",
    project_key: slot.project_key,
    commit: slot.commit,
    profile_digest: slot.profile_digest,
    branches,
    ...(graphBinding ? { graph_binding: graphBinding } : {}),
  };
  validateTestPlan(planArtifact);
  const unsigned = {
    ...planArtifact,
    source_artifact: { ...context.source_artifact },
    content_hash: context.content_hash,
    applicability,
    branch_reasons,
    expected_evidence: Object.fromEntries(BRANCHES.map((branch) => [branch, applicability[branch] === "REQUIRED" ? EVIDENCE[branch] : []])),
    risk_level: graphAssignment ? (graphAssignment.criticality.status === "HUMAN_REQUIRED" ? "CRITICAL" : "HIGH") : riskLevel(context, profile),
    artifact_slot: planArtifact,
    ...(graphBinding ? { graph_binding: graphBinding } : {}),
  };
  return { ...unsigned, plan_sha256: sha256(canonicalJson(unsigned)) };
}

export function planQaScopeEnvelope(plan) {
  if (!plan || typeof plan !== "object" || !plan.artifact_slot) throw new Error("test plan artifact slot is required");
  validateTestPlan(plan.artifact_slot);
  return { item: { key: "plan_qa_scope" }, artifacts: { test_plan: plan.artifact_slot } };
}
