import { canonicalJson, sha256 } from "./canonical.mjs";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const TICKET = /^[A-Z][A-Z0-9]+-[1-9][0-9]*$/;
const PROJECT = /^[a-z][a-z0-9-]{0,63}$/;
const BRANCHES = Object.freeze(["code", "api", "ui", "domain"]);
const FRESHNESS = new Set(["current", "stale", "unknown", "conflicted"]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exact(value, keys, label) {
  if (!isObject(value) || canonicalJson(Object.keys(value).sort()) !== canonicalJson([...keys].sort())) {
    throw new Error(`${label} must contain exact keys`);
  }
}

function identifier(value, label) {
  if (typeof value !== "string" || !ID.test(value)) throw new Error(`${label} must be a bounded identifier`);
  return value;
}

function digest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) throw new Error(`${label} must be a sha256 digest`);
  return value;
}

function uniqueArray(value, maximum, label) {
  if (!Array.isArray(value) || value.length > maximum || new Set(value).size !== value.length) {
    throw new Error(`${label} must be a bounded unique array`);
  }
  return value;
}

function timestamp(value, label) {
  if (typeof value !== "string" || new Date(value).toISOString() !== value) throw new Error(`${label} must be canonical ISO time`);
  return value;
}

export function validateColumnTicketEvent(value) {
  exact(value, ["schema_version", "event_id", "ticket_id", "project_key", "from_state", "to_state", "candidate", "triggered_at"], "column ticket event");
  if (value.schema_version !== "nuanu.qa-column-ticket-event.v1") throw new Error("column ticket event schema is invalid");
  identifier(value.event_id, "event_id");
  if (!TICKET.test(value.ticket_id)) throw new Error("ticket_id is invalid");
  if (!PROJECT.test(value.project_key)) throw new Error("project_key is invalid");
  if (value.from_state !== "in_progress" || value.to_state !== "ready_for_qa") throw new Error("column transition is not Ready for QA ingress");
  timestamp(value.triggered_at, "triggered_at");
  exact(value.candidate, ["candidate_id", "candidate_revision", "environment_id", "change_hints"], "candidate");
  identifier(value.candidate.candidate_id, "candidate_id");
  digest(value.candidate.candidate_revision, "candidate_revision");
  identifier(value.candidate.environment_id, "environment_id");
  for (const hint of uniqueArray(value.candidate.change_hints, 16, "change_hints")) identifier(hint, "change_hint");
  if (value.candidate.change_hints.length === 0) throw new Error("change_hints cannot be empty");
  return value;
}

function validateProvenance(value) {
  exact(value, ["source_id", "revision", "digest"], "criticality provenance");
  identifier(value.source_id, "provenance.source_id");
  identifier(value.revision, "provenance.revision");
  digest(value.digest, "provenance.digest");
}

export function validateGraphTestPlan(value) {
  exact(value, [
    "schema_version", "ticket_id", "project_key", "candidate_id", "candidate_revision", "environment_id",
    "graph_revision", "graph_digest", "knowledge_revision", "knowledge_digest", "freshness", "impact_paths",
    "mandatory_checks", "always_on_checks", "criticality_facts", "plan_digest",
  ], "graph test plan");
  if (value.schema_version !== "nuanu.qa-graph-test-plan.v1") throw new Error("graph test plan schema is invalid");
  if (!TICKET.test(value.ticket_id)) throw new Error("graph ticket_id is invalid");
  if (!PROJECT.test(value.project_key)) throw new Error("graph project_key is invalid");
  identifier(value.candidate_id, "graph candidate_id");
  digest(value.candidate_revision, "graph candidate_revision");
  identifier(value.environment_id, "graph environment_id");
  identifier(value.graph_revision, "graph_revision");
  digest(value.graph_digest, "graph_digest");
  identifier(value.knowledge_revision, "knowledge_revision");
  digest(value.knowledge_digest, "knowledge_digest");
  if (!FRESHNESS.has(value.freshness)) throw new Error("graph freshness is invalid");

  const paths = uniqueArray(value.impact_paths, 16, "impact_paths");
  const pathIds = new Set();
  const reachableChecks = new Set();
  for (const path of paths) {
    exact(path, ["path_id", "change_hint", "capability", "check_ids"], "impact path");
    identifier(path.path_id, "impact path_id");
    identifier(path.change_hint, "impact change_hint");
    identifier(path.capability, "impact capability");
    if (pathIds.has(path.path_id)) throw new Error("impact path_id is duplicate");
    pathIds.add(path.path_id);
    const checkIds = uniqueArray(path.check_ids, 16, "impact check_ids");
    if (checkIds.length === 0) throw new Error("impact path must reach a check");
    for (const checkId of checkIds) reachableChecks.add(identifier(checkId, "impact check_id"));
  }

  const checks = uniqueArray(value.mandatory_checks, 32, "mandatory_checks");
  if (checks.length === 0) throw new Error("mandatory_checks cannot be empty");
  const checkIds = new Set();
  for (const check of checks) {
    exact(check, ["check_id", "branch", "execution", "criticality", "impact_path_ids", "expected_evidence"], "mandatory check");
    identifier(check.check_id, "mandatory check_id");
    if (checkIds.has(check.check_id)) throw new Error("mandatory check_id is duplicate");
    checkIds.add(check.check_id);
    if (!BRANCHES.includes(check.branch)) throw new Error("mandatory check branch is invalid");
    if (!["automated", "human"].includes(check.execution)) throw new Error("mandatory check execution is invalid");
    if (!["normal", "critical"].includes(check.criticality)) throw new Error("mandatory check criticality is invalid");
    const impactIds = uniqueArray(check.impact_path_ids, 16, "mandatory impact_path_ids");
    if (impactIds.length === 0 || impactIds.some((id) => !pathIds.has(id))) throw new Error("mandatory check impact path is invalid");
    const evidence = uniqueArray(check.expected_evidence, 8, "expected_evidence");
    if (evidence.length === 0) throw new Error("mandatory check expected evidence is empty");
    for (const kind of evidence) identifier(kind, "expected evidence");
    if (!reachableChecks.has(check.check_id)) throw new Error("mandatory check is not reachable from impact paths");
  }
  if ([...reachableChecks].some((checkId) => !checkIds.has(checkId))) throw new Error("impact path references a non-mandatory check");

  for (const checkId of uniqueArray(value.always_on_checks, 16, "always_on_checks")) {
    identifier(checkId, "always_on check_id");
    if (!checkIds.has(checkId)) throw new Error("always-on check must be mandatory");
  }
  if (value.always_on_checks.length === 0) throw new Error("always_on_checks cannot be empty");

  const facts = uniqueArray(value.criticality_facts, 16, "criticality_facts");
  const factIds = new Set();
  for (const fact of facts) {
    exact(fact, ["fact_id", "capability", "classification", "provenance"], "criticality fact");
    identifier(fact.fact_id, "criticality fact_id");
    identifier(fact.capability, "criticality capability");
    if (factIds.has(fact.fact_id)) throw new Error("criticality fact_id is duplicate");
    factIds.add(fact.fact_id);
    if (!["machine_analyzable", "human_only"].includes(fact.classification)) throw new Error("criticality classification is invalid");
    validateProvenance(fact.provenance);
  }
  const humanChecks = checks.filter(({ execution }) => execution === "human");
  for (const check of humanChecks) {
    const capabilities = paths.filter(({ path_id }) => check.impact_path_ids.includes(path_id)).map(({ capability }) => capability);
    if (!facts.some((fact) => fact.classification === "human_only" && capabilities.includes(fact.capability))) {
      throw new Error("human check lacks human-only knowledge provenance");
    }
  }

  const { plan_digest: claimed, ...unsigned } = value;
  digest(claimed, "plan_digest");
  if (sha256(unsigned) !== claimed) throw new Error("graph plan digest mismatch");
  return value;
}

export function admitGraphTestPlan(event, value) {
  const reasons = new Set();
  let validatedEvent;
  let validatedPlan;
  try { validatedEvent = validateColumnTicketEvent(event); } catch { reasons.add("INVALID_TICKET_EVENT"); }
  try { validatedPlan = validateGraphTestPlan(value); } catch { reasons.add("INVALID_GRAPH_PLAN"); }
  if (validatedEvent && validatedPlan) {
    const candidate = validatedEvent.candidate;
    if (validatedPlan.ticket_id !== validatedEvent.ticket_id || validatedPlan.project_key !== validatedEvent.project_key
      || validatedPlan.candidate_id !== candidate.candidate_id || validatedPlan.candidate_revision !== candidate.candidate_revision
      || validatedPlan.environment_id !== candidate.environment_id) reasons.add("GRAPH_PLAN_IDENTITY_MISMATCH");
    if (validatedPlan.freshness !== "current") reasons.add("GRAPH_PLAN_NOT_CURRENT");
  }
  return reasons.size === 0
    ? { status: "ACCEPTED", reason_codes: [], plan: validatedPlan }
    : { status: "HOLD", reason_codes: [...reasons].sort(), plan: null };
}

export function classifyGraphCriticality(plan) {
  validateGraphTestPlan(plan);
  const humanCheckIds = plan.mandatory_checks.filter(({ execution }) => execution === "human").map(({ check_id }) => check_id).sort();
  if (humanCheckIds.length === 0) return { status: "AUTOMATED_ONLY", human_check_ids: [], reason_codes: [] };
  const capabilities = new Set(plan.criticality_facts.filter(({ classification }) => classification === "human_only").map(({ capability }) => capability));
  const reasons = ["HUMAN_ONLY_BUSINESS_FUNCTION"];
  if ([...capabilities].some((capability) => capability.includes("payment") || capability.includes("money"))) reasons.push("PAYMENT_IMPACT");
  return { status: "HUMAN_REQUIRED", human_check_ids: humanCheckIds, reason_codes: reasons.sort() };
}

export function validateGraphBinding(value) {
  exact(value, [
    "schema_version", "event_id", "ticket_id", "candidate_id", "candidate_revision", "graph_revision",
    "graph_digest", "knowledge_revision", "knowledge_digest", "graph_plan_digest", "criticality",
  ], "graph binding");
  if (value.schema_version !== "nuanu.qa-graph-binding.v1") throw new Error("graph binding schema is invalid");
  identifier(value.event_id, "graph binding event_id");
  if (!TICKET.test(value.ticket_id)) throw new Error("graph binding ticket_id is invalid");
  identifier(value.candidate_id, "graph binding candidate_id");
  digest(value.candidate_revision, "graph binding candidate_revision");
  identifier(value.graph_revision, "graph binding graph_revision");
  digest(value.graph_digest, "graph binding graph_digest");
  identifier(value.knowledge_revision, "graph binding knowledge_revision");
  digest(value.knowledge_digest, "graph binding knowledge_digest");
  digest(value.graph_plan_digest, "graph binding graph_plan_digest");
  if (!["AUTOMATED_ONLY", "HUMAN_REQUIRED"].includes(value.criticality)) throw new Error("graph binding criticality is invalid");
  return value;
}

export function createGraphBinding(event, plan) {
  const admitted = admitGraphTestPlan(event, plan);
  if (admitted.status !== "ACCEPTED") throw new Error(`graph plan admission failed: ${admitted.reason_codes.join(",")}`);
  return validateGraphBinding({
    schema_version: "nuanu.qa-graph-binding.v1",
    event_id: event.event_id,
    ticket_id: event.ticket_id,
    candidate_id: event.candidate.candidate_id,
    candidate_revision: event.candidate.candidate_revision,
    graph_revision: plan.graph_revision,
    graph_digest: plan.graph_digest,
    knowledge_revision: plan.knowledge_revision,
    knowledge_digest: plan.knowledge_digest,
    graph_plan_digest: plan.plan_digest,
    criticality: classifyGraphCriticality(plan).status,
  });
}

export function compileGraphExecutionAssignment(event, plan) {
  const admitted = admitGraphTestPlan(event, plan);
  if (admitted.status !== "ACCEPTED") throw new Error(`graph plan admission failed: ${admitted.reason_codes.join(",")}`);
  const criticality = classifyGraphCriticality(admitted.plan);
  const automatedChecks = admitted.plan.mandatory_checks.filter(({ execution }) => execution === "automated").map((check) => structuredClone(check));
  const humanChecks = admitted.plan.mandatory_checks.filter(({ execution }) => execution === "human").map((check) => structuredClone(check));
  const branches = BRANCHES.filter((branch) => automatedChecks.some((check) => check.branch === branch));
  const unsigned = {
    schema_version: "nuanu.qa-graph-execution-assignment.v1",
    event_id: event.event_id,
    ticket_id: event.ticket_id,
    project_key: event.project_key,
    candidate_id: event.candidate.candidate_id,
    candidate_revision: event.candidate.candidate_revision,
    environment_id: event.candidate.environment_id,
    graph_plan_digest: admitted.plan.plan_digest,
    graph_digest: admitted.plan.graph_digest,
    knowledge_digest: admitted.plan.knowledge_digest,
    criticality,
    automated_checks: automatedChecks,
    human_checks: humanChecks,
    branches,
    timeout_ms: 300_000,
  };
  return { ...unsigned, assignment_digest: sha256(unsigned) };
}

function provenance(sourceId, revision) {
  return { source_id: sourceId, revision, digest: sha256({ source_id: sourceId, revision }) };
}

function check(checkId, branch, execution, criticality, impactPathIds, expectedEvidence) {
  return { check_id: checkId, branch, execution, criticality, impact_path_ids: impactPathIds, expected_evidence: expectedEvidence };
}

function buildSyntheticGraphPlan(event, scenario) {
  validateColumnTicketEvent(event);
  const firstHint = event.candidate.change_hints[0];
  let impactPaths;
  let mandatoryChecks;
  let facts;
  if (scenario === "noncritical") {
    impactPaths = [
      { path_id: "impact-always-on", change_hint: firstHint, capability: "qah-contract", check_ids: ["qah.contracts"] },
      { path_id: "impact-profile-api", change_hint: firstHint, capability: "profile-api", check_ids: ["profile.api"] },
      { path_id: "impact-profile-ui", change_hint: firstHint, capability: "profile-ui", check_ids: ["profile.ui"] },
    ];
    mandatoryChecks = [
      check("qah.contracts", "code", "automated", "normal", ["impact-always-on"], ["static-analysis"]),
      check("profile.api", "api", "automated", "normal", ["impact-profile-api"], ["api-contract"]),
      check("profile.ui", "ui", "automated", "normal", ["impact-profile-ui"], ["playwright", "screenshot"]),
    ];
    facts = [{ fact_id: "fact-profile-machine", capability: "profile-ui", classification: "machine_analyzable", provenance: provenance("kb.profile", "offline-v1") }];
  } else if (scenario === "critical") {
    impactPaths = [
      { path_id: "impact-always-on", change_hint: firstHint, capability: "qah-contract", check_ids: ["qah.contracts"] },
      { path_id: "impact-payment-api", change_hint: firstHint, capability: "payment-api", check_ids: ["payment.api"] },
      { path_id: "impact-payment-domain", change_hint: firstHint, capability: "payment-card", check_ids: ["payment.domain", "payment.card-human-approval"] },
    ];
    mandatoryChecks = [
      check("qah.contracts", "code", "automated", "normal", ["impact-always-on"], ["static-analysis"]),
      check("payment.api", "api", "automated", "critical", ["impact-payment-api"], ["api-contract"]),
      check("payment.domain", "domain", "automated", "critical", ["impact-payment-domain"], ["domain-data", "sandbox-test"]),
      check("payment.card-human-approval", "domain", "human", "critical", ["impact-payment-domain"], ["human-approval"]),
    ];
    facts = [{ fact_id: "fact-payment-human", capability: "payment-card", classification: "human_only", provenance: provenance("kb.payment", "offline-v1") }];
  } else if (scenario === "product-failure") {
    impactPaths = [
      { path_id: "impact-always-on", change_hint: firstHint, capability: "qah-contract", check_ids: ["qah.contracts"] },
      { path_id: "impact-profile-api", change_hint: firstHint, capability: "profile-api", check_ids: ["profile.api"] },
    ];
    mandatoryChecks = [
      check("qah.contracts", "code", "automated", "normal", ["impact-always-on"], ["static-analysis"]),
      check("profile.api", "api", "automated", "normal", ["impact-profile-api"], ["api-contract"]),
    ];
    facts = [{ fact_id: "fact-profile-machine", capability: "profile-api", classification: "machine_analyzable", provenance: provenance("kb.profile", "offline-v1") }];
  } else throw new Error("synthetic graph scenario is invalid");

  const unsigned = {
    schema_version: "nuanu.qa-graph-test-plan.v1",
    ticket_id: event.ticket_id,
    project_key: event.project_key,
    candidate_id: event.candidate.candidate_id,
    candidate_revision: event.candidate.candidate_revision,
    environment_id: event.candidate.environment_id,
    graph_revision: "synthetic-product-graph.offline-v1",
    graph_digest: sha256({ scenario, impact_paths: impactPaths }),
    knowledge_revision: "synthetic-freeland-kb.offline-v1",
    knowledge_digest: sha256({ scenario, criticality_facts: facts }),
    freshness: "current",
    impact_paths: impactPaths,
    mandatory_checks: mandatoryChecks,
    always_on_checks: ["qah.contracts"],
    criticality_facts: facts,
  };
  return { ...unsigned, plan_digest: sha256(unsigned) };
}

export function createSyntheticGraphPlan(event, scenario) {
  const plan = buildSyntheticGraphPlan(event, scenario);
  validateGraphTestPlan(plan);
  return plan;
}
