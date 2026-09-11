import { validateGraphBinding } from "./graph-plan.mjs";

export const BRANCHES = Object.freeze(["code", "api", "ui", "domain"]);
export const PRODUCT_RESULTS = Object.freeze(["PASS", "FAIL", "INCONCLUSIVE", "SKIPPED"]);
export const ENVIRONMENT_STATUSES = Object.freeze(["HEALTHY", "INFRA_FAILURE", "NOT_REQUIRED"]);
export const EVIDENCE_STATUSES = Object.freeze(["VERIFIED", "PARTIAL", "UNVERIFIED"]);
export const OUTCOME_CODE_CLASSES = Object.freeze(["pass", "fail", "infra", "skipped"]);

const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const SECRET_KEY = /(secret|token|password|credential|authorization|api[_-]?key)/i;
const SHELL_SYNTAX = /(?:\$\{?[A-Za-z_][A-Za-z0-9_]*\}?|%[A-Za-z_][A-Za-z0-9_]*%|[`;&|<>]|\r|\n)/;
const SECRET_ARGV = /(?:--?(?:secret|token|password|credential|authorization|api[_-]?key)(?:=|\s|$)|\b(?:secret|token|password|credential|authorization|api[_-]?key)\s*[:=]|\bbearer\s+\S+)/i;

export function exactKeys(value, required, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("expected object");
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  for (const key of required) if (!keys.includes(key)) throw new Error(`missing ${key}`);
  for (const key of keys) if (!allowed.has(key)) throw new Error(`unknown ${key}`);
  return value;
}

function member(value, values, label) {
  if (!values.includes(value)) throw new Error(`invalid ${label}`);
  return value;
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  if (value.includes("\0")) throw new Error(`${label} contains NUL`);
  return value;
}

function command(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty string array`);
  for (const part of value) {
    nonEmptyString(part, label);
    if (SHELL_SYNTAX.test(part)) {
      if (/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?|%[A-Za-z_][A-Za-z0-9_]*%/.test(part)) throw new Error(`${label} contains environment interpolation`);
      throw new Error(`${label} contains shell syntax`);
    }
    if (SECRET_ARGV.test(part)) throw new Error(`${label} contains secret-bearing argv`);
  }
  return value;
}

function url(value, label) {
  nonEmptyString(value, label);
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${label} must be an absolute URL`); }
  if (!/^https?:$/.test(parsed.protocol)) throw new Error(`${label} must use http or https`);
  if (parsed.username || parsed.password || SECRET_KEY.test(decodeURIComponent(parsed.search)) || SECRET_KEY.test(decodeURIComponent(parsed.hash))) throw new Error(`${label} contains credentials`);
  if (parsed.hash) throw new Error(`${label} must not contain a fragment`);
  return value;
}

function safeStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} must be a non-empty string array`);
  const seen = new Set();
  for (const entry of value) {
    nonEmptyString(entry, label);
    if (seen.has(entry)) throw new Error(`${label} must contain unique ${label}`);
    seen.add(entry);
  }
  return value;
}

function noSecrets(value, label = "profile") {
  if (Array.isArray(value)) {
    for (const item of value) noSecrets(item, label);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (key !== "secret_output" && SECRET_KEY.test(key)) throw new Error(`${label} contains secret field ${key}`);
    noSecrets(item, label);
  }
}

function projectKey(value) {
  nonEmptyString(value, "project_key");
  if (!/^[a-z][a-z0-9-]*$/.test(value)) throw new Error("project_key must be a lowercase slug");
  return value;
}

function commit(value) {
  if (typeof value !== "string" || !SHA.test(value)) throw new Error("commit must be a lowercase 40-character Git SHA");
  return value;
}

function digest(value, label = "profile_digest") {
  if (typeof value !== "string" || !DIGEST.test(value)) throw new Error(`${label} must be a sha256 digest`);
  return value;
}

function schema(value, expected) {
  if (value !== expected) throw new Error(`schema_version must be ${expected}`);
}

export function validateProfile(value) {
  try {
    exactKeys(value, ["schema_version", "project_key", "repository", "environment", "checks", "outcome_codes", "safety", "execution", "test_data", "areas", "risk"]);
    schema(value.schema_version, "nuanu.qa-project-profile.v1");
    projectKey(value.project_key);
    noSecrets(value);

    exactKeys(value.repository, ["allowed_origin"]);
    url(value.repository.allowed_origin, "repository.allowed_origin");

    member(value.environment?.strategy, ["managed_command", "none"], "environment.strategy");
    if (value.environment.strategy === "none") exactKeys(value.environment, ["strategy"]);
    else {
      exactKeys(value.environment, ["strategy", "prepare_command", "cleanup_command", "health_path"]);
      command(value.environment.prepare_command, "environment.prepare_command");
      command(value.environment.cleanup_command, "environment.cleanup_command");
      nonEmptyString(value.environment.health_path, "environment.health_path");
      if (!value.environment.health_path.startsWith("/") || value.environment.health_path.includes("..") || value.environment.health_path.includes("?")) throw new Error("environment.health_path must be an absolute safe path");
    }

    exactKeys(value.checks, BRANCHES);
    for (const branch of BRANCHES) command(value.checks[branch], `checks.${branch}`);

    exactKeys(value.outcome_codes, BRANCHES);
    for (const branch of BRANCHES) {
      exactKeys(value.outcome_codes[branch], OUTCOME_CODE_CLASSES);
      const allCodes = [];
      for (const classification of OUTCOME_CODE_CLASSES) {
        const codes = value.outcome_codes[branch][classification];
        if (!Array.isArray(codes) || codes.length < 1 || codes.length > 32 || new Set(codes).size !== codes.length
          || codes.some((code) => typeof code !== "string" || !/^[A-Z][A-Z0-9_]{0,63}$/.test(code))) {
          throw new Error(`outcome_codes.${branch}.${classification} must be a non-empty unique closed code array`);
        }
        allCodes.push(...codes);
      }
      if (new Set(allCodes).size !== allCodes.length) throw new Error(`outcome_codes.${branch} classes must not overlap`);
    }

    exactKeys(value.safety, ["mutation_mode", "irreversible_actions", "secret_output", "allowed_origins"]);
    member(value.safety.mutation_mode, ["sandbox_only"], "safety.mutation_mode");
    member(value.safety.irreversible_actions, ["deny"], "safety.irreversible_actions");
    member(value.safety.secret_output, ["deny"], "safety.secret_output");
    safeStringArray(value.safety.allowed_origins, "safety.allowed_origins");
    for (const allowedOrigin of value.safety.allowed_origins) url(allowedOrigin, "safety.allowed_origins");

    exactKeys(value.execution, ["shell", "environment", "timeout_ms", "max_output_bytes"]);
    if (value.execution.shell !== false) throw new Error("execution.shell must be false");
    member(value.execution.environment, ["minimal"], "execution.environment");
    if (!Number.isInteger(value.execution.timeout_ms) || value.execution.timeout_ms <= 0 || value.execution.timeout_ms > 600000) throw new Error("execution.timeout_ms must be a finite bounded integer");
    if (!Number.isInteger(value.execution.max_output_bytes) || value.execution.max_output_bytes <= 0 || value.execution.max_output_bytes > 10485760) throw new Error("execution.max_output_bytes must be a finite bounded integer");

    exactKeys(value.test_data, ["profiles"]);
    safeStringArray(value.test_data.profiles, "test_data.profiles");

    exactKeys(value.areas, ["ui", "api", "domain"]);
    for (const area of ["ui", "api", "domain"]) {
      exactKeys(value.areas[area], ["paths", "labels"]);
      safeStringArray(value.areas[area].paths, `areas.${area}.paths`);
      for (const path of value.areas[area].paths) {
        if (path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) throw new Error(`areas.${area}.paths must contain safe relative globs`);
      }
      safeStringArray(value.areas[area].labels, `areas.${area}.labels`);
      for (const label of value.areas[area].labels) {
        if (!/^[a-z][a-z0-9-]*$/.test(label)) throw new Error(`areas.${area}.labels must contain normalized labels`);
      }
    }

    exactKeys(value.risk, ["confidence_threshold"], ["high_keywords", "critical_keywords"]);
    for (const key of ["high_keywords", "critical_keywords"]) {
      if (!(key in value.risk)) continue;
      safeStringArray(value.risk[key], `risk.${key}`);
      for (const keyword of value.risk[key]) {
        if (!/^[a-z][a-z0-9-]*$/.test(keyword)) throw new Error(`risk.${key} must contain normalized keywords`);
      }
    }
    if (typeof value.risk.confidence_threshold !== "number" || !Number.isFinite(value.risk.confidence_threshold) || value.risk.confidence_threshold < 0 || value.risk.confidence_threshold > 1) throw new Error("risk.confidence_threshold must be a number from zero through one");
    return value;
  } catch (error) {
    throw new Error(`exact profile contract: ${error.message}`);
  }
}

export function outcomeCodeClass({ applicability, product_result, environment_status }) {
  if (applicability === "NOT_APPLICABLE" && product_result === "SKIPPED") return "skipped";
  if (environment_status === "INFRA_FAILURE" || product_result === "INCONCLUSIVE") return "infra";
  if (product_result === "PASS") return "pass";
  if (product_result === "FAIL") return "fail";
  throw new Error("outcome axes do not select a declared code class");
}

export function validateOutcomeCode(profile, branch, axes, code) {
  const classification = outcomeCodeClass(axes);
  if (!profile?.outcome_codes?.[branch]?.[classification]?.includes(code)) {
    throw new Error(`outcome code ${code} is not declared for ${branch}.${classification}`);
  }
  return code;
}

export function validateResolvedContext(value) {
  exactKeys(value, ["schema_version", "project_key", "commit", "profile_digest", "environment_status"], ["base_url"]);
  schema(value.schema_version, "nuanu.qa-resolved-context.v1");
  projectKey(value.project_key);
  commit(value.commit);
  digest(value.profile_digest);
  member(value.environment_status, ENVIRONMENT_STATUSES, "environment_status");
  if (value.environment_status === "HEALTHY") {
    if (!("base_url" in value)) throw new Error("healthy environment requires base_url");
    url(value.base_url, "base_url");
  } else if ("base_url" in value) {
    throw new Error("non-healthy environment cannot include base_url");
  }
  return value;
}

export function validateTestPlan(value) {
  exactKeys(value, ["schema_version", "project_key", "commit", "profile_digest", "branches"], ["graph_binding"]);
  schema(value.schema_version, "nuanu.qa-test-plan.v1");
  projectKey(value.project_key);
  commit(value.commit);
  digest(value.profile_digest);
  if (!Array.isArray(value.branches) || value.branches.length > BRANCHES.length || new Set(value.branches).size !== value.branches.length) throw new Error("branches must be a bounded array with unique branches");
  for (const branch of value.branches) member(branch, BRANCHES, "branch");
  if ("graph_binding" in value) validateGraphBinding(value.graph_binding);
  return value;
}

export function validateBranchResult(value) {
  exactKeys(value, ["schema_version", "project_key", "commit", "profile_digest", "branch", "applicability", "product_result"], ["evidence_status"]);
  schema(value.schema_version, "nuanu.qa-branch-result.v1");
  projectKey(value.project_key);
  commit(value.commit);
  digest(value.profile_digest);
  member(value.branch, BRANCHES, "branch");
  member(value.applicability, ["REQUIRED", "NOT_APPLICABLE"], "applicability");
  member(value.product_result, PRODUCT_RESULTS, "product_result");
  if (value.applicability === "REQUIRED" && value.product_result === "SKIPPED") throw new Error("required branch cannot be skipped");
  if (value.applicability === "NOT_APPLICABLE" && value.product_result !== "SKIPPED") throw new Error("not-applicable branch must be skipped");
  if (value.product_result === "PASS") {
    if (value.evidence_status !== "VERIFIED") throw new Error("passing branch requires verified evidence");
  } else if ("evidence_status" in value) {
    member(value.evidence_status, EVIDENCE_STATUSES, "evidence_status");
  }
  return value;
}

export function validateReleaseDecision(value) {
  exactKeys(value, ["schema_version", "project_key", "commit", "profile_digest", "decision", "branch_results"]);
  schema(value.schema_version, "nuanu.qa-release-decision.v1");
  projectKey(value.project_key);
  commit(value.commit);
  digest(value.profile_digest);
  member(value.decision, ["APPROVE", "BLOCK", "INCONCLUSIVE"], "decision");
  if (!Array.isArray(value.branch_results) || value.branch_results.length === 0) throw new Error("branch_results must be a non-empty array");
  const branches = new Set();
  for (const result of value.branch_results) {
    validateBranchResult(result);
    if (result.project_key !== value.project_key || result.commit !== value.commit || result.profile_digest !== value.profile_digest) throw new Error("branch result identity must match release decision");
    if (branches.has(result.branch)) throw new Error("branch_results must contain unique branches");
    branches.add(result.branch);
  }
  if (value.decision === "APPROVE" && value.branch_results.some((result) => result.applicability === "REQUIRED" && result.product_result !== "PASS")) throw new Error("approval requires passing branches");
  return value;
}
