import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  validateProfile,
  validateResolvedContext,
  validateTestPlan,
  validateBranchResult,
  validateReleaseDecision,
} from "../../scripts/qah/contracts.mjs";
import { loadProfile } from "../../scripts/qah/profile.mjs";
import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";

const sha = "a".repeat(40);
const digest = `sha256:${"b".repeat(64)}`;
const execFile = promisify(execFileCallback);

test("canonical helpers produce a sorted JSON representation and prefixed digest", () => {
  assert.equal(canonicalJson({ z: [true, null], a: { y: 2, b: 1 } }), '{"a":{"b":1,"y":2},"z":[true,null]}');
  assert.equal(sha256("abc"), "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("canonical JSON preserves an own __proto__ key without prototype mutation", () => {
  const value = JSON.parse('{"z":1,"__proto__":{"polluted":true}}');
  assert.equal(canonicalJson(value), '{"__proto__":{"polluted":true},"z":1}');
  assert.equal({}.polluted, undefined);
});

function profile(overrides = {}) {
  return {
    schema_version: "nuanu.qa-project-profile.v1",
    project_key: "paydemo",
    repository: { allowed_origin: "https://github.com/solomindanil/NuanuFlowQA.git" },
    environment: {
      strategy: "managed_command",
      prepare_command: ["node", "scripts/qah/environment.mjs", "prepare"],
      cleanup_command: ["node", "scripts/qah/environment.mjs", "cleanup"],
      health_path: "/build-info",
    },
    checks: {
      code: ["npm", "run", "typecheck"],
      api: ["node", "scripts/qah/adapters/paydemo.mjs", "api"],
      ui: ["node", "scripts/qah/adapters/paydemo.mjs", "ui"],
      domain: ["node", "scripts/qah/adapters/paydemo.mjs", "domain"],
    },
    outcome_codes: {
      code: { pass: ["COMMAND_PASSED"], fail: ["COMMAND_FAILED"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
      api: { pass: ["API_CONTRACT_VERIFIED", "AMOUNT_REJECTED"], fail: ["API_CONTRACT_VIOLATION", "AMOUNT_MISMATCH_ACCEPTED"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE", "AMOUNT_PROBE_UNAVAILABLE"], skipped: ["NOT_APPLICABLE"] },
      ui: { pass: ["UI_FLOW_VERIFIED", "BANK_TRANSFER_CONFIRMED"], fail: ["BANK_SHOWN_AS_CARD", "BANK_UI_CONTRACT_VIOLATION"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE", "UI_PROBE_UNAVAILABLE"], skipped: ["NOT_APPLICABLE"] },
      domain: { pass: ["DOMAIN_RULE_VERIFIED", "IDEMPOTENT_REPLAY"], fail: ["DUPLICATE_PAYMENT_IDS", "IDEMPOTENCY_CONTRACT_VIOLATION"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE", "IDEMPOTENCY_PROBE_UNAVAILABLE"], skipped: ["NOT_APPLICABLE"] },
    },
    safety: {
      mutation_mode: "sandbox_only",
      irreversible_actions: "deny",
      secret_output: "deny",
      allowed_origins: ["http://127.0.0.1"],
    },
    execution: {
      shell: false,
      environment: "minimal",
      timeout_ms: 300000,
      max_output_bytes: 1048576,
    },
    test_data: { profiles: ["default", "payment_sandbox"] },
    areas: {
      ui: { paths: ["apps/paydemo/public/**", "tests/**/ui/**"], labels: ["ui", "frontend"] },
      api: { paths: ["apps/paydemo/server.mjs", "tests/**/api/**"], labels: ["api", "backend"] },
      domain: { paths: ["apps/paydemo/**/payment*", "tests/**/domain/**"], labels: ["payments", "auth", "data"] },
    },
    risk: {
      high_keywords: ["payment", "authentication", "authorization", "pii", "webhook"],
      critical_keywords: ["real-money", "production-migration"],
      confidence_threshold: 0.95,
    },
    ...overrides,
  };
}

function resolvedContext(overrides = {}) {
  return {
    schema_version: "nuanu.qa-resolved-context.v1",
    project_key: "paydemo",
    commit: sha,
    profile_digest: digest,
    environment_status: "HEALTHY",
    base_url: "http://127.0.0.1:3000",
    ...overrides,
  };
}

function testPlan(overrides = {}) {
  return {
    schema_version: "nuanu.qa-test-plan.v1",
    project_key: "paydemo",
    commit: sha,
    profile_digest: digest,
    branches: ["code", "api", "ui", "domain"],
    ...overrides,
  };
}

function branchResult(overrides = {}) {
  return {
    schema_version: "nuanu.qa-branch-result.v1",
    project_key: "paydemo",
    commit: sha,
    profile_digest: digest,
    branch: "ui",
    applicability: "REQUIRED",
    product_result: "PASS",
    evidence_status: "VERIFIED",
    ...overrides,
  };
}

async function git(directory, ...args) {
  return execFile("git", ["-C", directory, ...args]);
}

async function committedProfile(source) {
  const directory = await mkdtemp(join(tmpdir(), "qah-profile-git-"));
  await execFile("git", ["init", "--quiet", directory]);
  await writeFile(join(directory, "qa-harness.yaml"), source);
  await git(directory, "add", "qa-harness.yaml");
  await git(directory, "-c", "user.name=QAH test", "-c", "user.email=qah@example.test", "commit", "--quiet", "-m", "fixture");
  const { stdout } = await git(directory, "rev-parse", "HEAD");
  return { directory, path: join(directory, "qa-harness.yaml"), commit: stdout.trim() };
}

function schemaAllowsInvariants(schema, value) {
  const matches = (rule, candidate) => {
    if (!rule) return true;
    if ("const" in rule && candidate !== rule.const) return false;
    if (rule.not && matches(rule.not, candidate)) return false;
    if (rule.required && (!candidate || typeof candidate !== "object" || rule.required.some((key) => !(key in candidate)))) return false;
    if (rule.properties && (!candidate || typeof candidate !== "object" || Object.entries(rule.properties).some(([key, child]) => key in candidate && !matches(child, candidate[key])))) return false;
    if (rule.contains && (!Array.isArray(candidate) || !candidate.some((entry) => matches(rule.contains, entry)))) return false;
    return true;
  };
  return (schema.allOf ?? []).every((rule) => !matches(rule.if, value) || matches(rule.then, value));
}

function releaseDecision(overrides = {}) {
  return {
    schema_version: "nuanu.qa-release-decision.v1",
    project_key: "paydemo",
    commit: sha,
    profile_digest: digest,
    decision: "APPROVE",
    branch_results: [branchResult()],
    ...overrides,
  };
}

test("profile rejects shell strings, secrets, and unknown keys", () => {
  assert.throws(() => validateProfile({
    schema_version: "nuanu.qa-project-profile.v1",
    project_key: "paydemo",
    repository: { allowed_origin: "https://github.com/solomindanil/NuanuFlowQA.git" },
    environment: { strategy: "managed_command", prepare_command: "npm start" },
    checks: {}, safety: {}, test_data: {}, token: "secret",
  }), /exact profile contract/);
});

test("profile accepts safe named command arrays", () => {
  assert.deepEqual(validateProfile(profile()), profile());
});

test("profile requires a closed per-branch outcome code mapping", async () => {
  assert.deepEqual(validateProfile(profile()), profile());
  const missing = profile();
  delete missing.outcome_codes;
  assert.throws(() => validateProfile(missing), /outcome_codes/);
  assert.throws(() => validateProfile(profile({ outcome_codes: { ...profile().outcome_codes, api: { ...profile().outcome_codes.api, pass: ["BAD-CODE"] } } })), /outcome_codes/);
  const schema = JSON.parse(await readFile(new URL("../../schemas/qah/project-profile.schema.json", import.meta.url), "utf8"));
  assert.ok(schema.required.includes("outcome_codes"));
});

test("profile accepts only the exact lease-free environment none contract", () => {
  const value = profile({ environment: { strategy: "none" } });
  assert.deepEqual(validateProfile(value), value);
  assert.throws(() => validateProfile(profile({ environment: { strategy: "none", cleanup_command: ["node", "cleanup.mjs"] } })), /unknown cleanup_command/);
});

test("profile rejects unsafe command entries and secret-bearing URLs", () => {
  assert.throws(() => validateProfile(profile({
    checks: { ...profile().checks, code: ["npm", "run", "typecheck", "$TOKEN"] },
  })), /environment interpolation/);
  assert.throws(() => validateProfile(profile({
    repository: { allowed_origin: "https://alice:secret@github.com/solomindanil/NuanuFlowQA.git" },
  })), /credentials/);
  assert.throws(() => validateProfile(profile({
    repository: { allowed_origin: "https://github.com/solomindanil/NuanuFlowQA.git?token=secret" },
  })), /credentials/);
  assert.throws(() => validateProfile(profile({
    safety: { ...profile().safety, allowed_origins: ["http://127.0.0.1/#access_token=secret"] },
  })), /credentials/);
  assert.throws(() => validateProfile(profile({
    checks: { ...profile().checks, code: ["npm", "run", "typecheck", "--token=secret"] },
  })), /secret/);
  assert.throws(() => validateProfile(profile({
    checks: { ...profile().checks, api: ["curl", "-H", "Authorization: Bearer secret"] },
  })), /secret/);
  assert.throws(() => validateProfile(profile({
    checks: { ...profile().checks, ui: ["curl", "-H", "x-api-key: secret"] },
  })), /secret/);
  assert.throws(() => validateProfile(profile({
    environment: { ...profile().environment, prepare_command: ["node\u0000bad"] },
  })), /NUL/);
});

test("profile requires a closed execution policy", () => {
  assert.deepEqual(validateProfile(profile()), profile());
  assert.throws(() => validateProfile(profile({ execution: { ...profile().execution, shell: true } })), /execution.shell/);
  assert.throws(() => validateProfile(profile({ execution: { ...profile().execution, environment: "inherit" } })), /execution.environment/);
  assert.throws(() => validateProfile(profile({ execution: { ...profile().execution, timeout_ms: Infinity } })), /timeout_ms/);
  assert.throws(() => validateProfile(profile({ execution: { ...profile().execution, max_output_bytes: 0 } })), /max_output_bytes/);
  assert.throws(() => validateProfile(profile({ execution: { ...profile().execution, extra: true } })), /unknown extra/);
});

test("resolved context rejects malformed commit and digest", () => {
  assert.throws(() => validateResolvedContext(resolvedContext({ commit: "ABC" })), /lowercase 40-character Git SHA/);
  assert.throws(() => validateResolvedContext(resolvedContext({ profile_digest: "sha256:short" })), /sha256 digest/);
});

test("test plan rejects extra keys and duplicate branches", () => {
  assert.throws(() => validateTestPlan(testPlan({ extra: true })), /unknown extra/);
  const ownProtoKey = JSON.parse(JSON.stringify(testPlan()).replace(/}$/, ',"__proto__":{"release":"READY"}}'));
  assert.throws(() => validateTestPlan(ownProtoKey), /unknown __proto__/);
  assert.throws(() => validateTestPlan(testPlan({ branches: ["code", "code"] })), /unique branches/);
  assert.deepEqual(validateTestPlan(testPlan({ branches: [] })), testPlan({ branches: [] }));
});

test("branch result cannot call an applicable check SKIPPED", () => {
  assert.throws(() => validateBranchResult(branchResult({ product_result: "SKIPPED" })), /required branch cannot be skipped/);
});

test("branch result rejects skipped required and unverified passing states", () => {
  assert.throws(() => validateBranchResult(branchResult({ product_result: "SKIPPED" })), /required branch cannot be skipped/);
  assert.throws(() => validateBranchResult(branchResult({ evidence_status: "UNVERIFIED" })), /passing branch requires verified evidence/);
  assert.throws(() => validateBranchResult(branchResult({ applicability: "NOT_APPLICABLE", product_result: "PASS" })), /not-applicable branch must be skipped/);
});

test("release decision rejects APPROVE with a failing required branch", () => {
  assert.throws(() => validateReleaseDecision(releaseDecision({
    branch_results: [branchResult({ product_result: "FAIL", evidence_status: "VERIFIED" })],
  })), /approval requires passing branches/);
});

test("release decision rejects undocumented READY while APPROVE remains valid", () => {
  assert.deepEqual(validateReleaseDecision(releaseDecision()), releaseDecision());
  assert.throws(() => validateReleaseDecision(releaseDecision({ decision: "READY" })), /invalid decision/);
});

test("branch results require a commit-bound project identity", () => {
  const result = branchResult();
  delete result.project_key;
  assert.throws(() => validateBranchResult(result), /missing project_key/);
});

test("release decision rejects mixed branch identity", () => {
  assert.throws(() => validateReleaseDecision(releaseDecision({
    branch_results: [branchResult({ commit: "c".repeat(40) })],
  })), /branch result identity/);
});

test("JSON schemas and runtime reject the same branch and approval invariants", async () => {
  const branchSchema = JSON.parse(await readFile("schemas/qah/branch-result.schema.json", "utf8"));
  const releaseSchema = JSON.parse(await readFile("schemas/qah/release-decision.schema.json", "utf8"));
  const requiredSkipped = branchResult({ product_result: "SKIPPED" });
  const unverifiedPass = branchResult({ evidence_status: "UNVERIFIED" });
  const approvalWithFailure = releaseDecision({ branch_results: [branchResult({ product_result: "FAIL", evidence_status: "VERIFIED" })] });

  for (const invalidBranch of [requiredSkipped, unverifiedPass]) {
    assert.equal(schemaAllowsInvariants(branchSchema, invalidBranch), false);
    assert.throws(() => validateBranchResult(invalidBranch));
  }
  assert.equal(schemaAllowsInvariants(releaseSchema, approvalWithFailure), false);
  assert.throws(() => validateReleaseDecision(approvalWithFailure));
});

test("profile loader rejects aliases, custom tags, duplicate keys, and multiple documents", async () => {
  const invalidDocuments = [
    "profile: &p paydemo\nproject_key: *p\n",
    "schema_version: !unsafe nuanu.qa-project-profile.v1\n",
    "schema_version: one\nschema_version: two\n",
    "schema_version: nuanu.qa-project-profile.v1\n---\nschema_version: nuanu.qa-project-profile.v1\n",
  ];
  for (const [index, yaml] of invalidDocuments.entries()) {
    const { path, commit } = await committedProfile(yaml);
    await assert.rejects(loadProfile(path, commit), /YAML|exact profile contract/);
  }
});

test("profile loader reads profile bytes from the requested commit", async () => {
  const committed = profile({ project_key: "committed" });
  const altered = profile({ project_key: "altered" });
  const { path, commit } = await committedProfile(JSON.stringify(committed));
  await writeFile(path, JSON.stringify(altered));
  const loaded = await loadProfile(path, commit);
  assert.equal(loaded.project_key, "committed");
});
