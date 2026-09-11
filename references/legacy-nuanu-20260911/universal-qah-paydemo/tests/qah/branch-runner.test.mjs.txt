import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { materializeBranchFiles, runBranch as productionRunBranch } from "../../scripts/qah/run-branch.mjs";
import { runPaydemoAdapter } from "../../scripts/qah/adapters/paydemo.mjs";
import * as paydemoAdapterModule from "../../scripts/qah/adapters/paydemo.mjs";
import { targetNamespace } from "../../scripts/qah/environment.mjs";
import { validateProfile } from "../../scripts/qah/contracts.mjs";
import YAML from "yaml";
import { chromium as realChromium } from "@playwright/test";
import { aggregateFixture, aggregateFixtureResult, rewriteMaterial } from "./aggregate.test.mjs?fixtures-only";

const commit = "a".repeat(40);
const contentHash = `sha256:${"c".repeat(64)}`;
const instanceNonce = "11111111-1111-4111-8111-111111111111";
const artifactDigest = `sha256:${"d".repeat(64)}`;

function profile(overrides = {}) {
  const value = {
    schema_version: "nuanu.qa-project-profile.v1",
    project_key: "generic-product",
    repository: { allowed_origin: "https://example.test/generic/product.git" },
    environment: {
      strategy: "managed_command",
      prepare_command: ["node", "scripts/qah/environment.mjs", "prepare"],
      cleanup_command: ["node", "scripts/qah/environment.mjs", "cleanup"],
      health_path: "/build-info",
    },
    checks: {
      code: ["npm", "run", "typecheck"],
      api: ["node", "adapters/product.mjs", "api"],
      ui: ["node", "adapters/product.mjs", "ui"],
      domain: ["node", "adapters/product.mjs", "domain"],
    },
    outcome_codes: {
      code: { pass: ["COMMAND_PASSED"], fail: ["COMMAND_FAILED"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
      api: { pass: ["API_CONTRACT_VERIFIED"], fail: ["API_CONTRACT_VIOLATION"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
      ui: { pass: ["UI_FLOW_VERIFIED"], fail: ["UI_CONTRACT_VIOLATION"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
      domain: { pass: ["DOMAIN_RULE_VERIFIED"], fail: ["DOMAIN_CONTRACT_VIOLATION"], infra: ["ENVIRONMENT_NOT_READY", "ENVIRONMENT_VERIFICATION_FAILED", "ADAPTER_EXIT_FAILURE", "INVALID_ADAPTER_OUTPUT", "TRANSPORT_FAILURE"], skipped: ["NOT_APPLICABLE"] },
    },
    safety: {
      mutation_mode: "sandbox_only",
      irreversible_actions: "deny",
      secret_output: "deny",
      allowed_origins: ["http://127.0.0.1:4173"],
    },
    execution: { shell: false, environment: "minimal", timeout_ms: 2_000, max_output_bytes: 16_384 },
    test_data: { profiles: ["default", "sandbox"] },
    areas: {
      ui: { paths: ["web/**"], labels: ["ui"] },
      api: { paths: ["server/**"], labels: ["api"] },
      domain: { paths: ["domain/**"], labels: ["domain"] },
    },
    risk: { confidence_threshold: 0.95 },
    ...overrides,
  };
  return value;
}

function plan(rawProfile = profile(), applicability = { code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "REQUIRED" }) {
  const profileDigest = sha256(rawProfile);
  const artifactSlot = {
    schema_version: "nuanu.qa-test-plan.v1",
    project_key: rawProfile.project_key,
    commit,
    profile_digest: profileDigest,
    branches: Object.entries(applicability).filter(([, value]) => value === "REQUIRED").map(([branch]) => branch),
  };
  const unsigned = {
    ...artifactSlot,
    source_artifact: {
      artifact_id: "33333333-3333-4333-8333-333333333333",
      version_id: "44444444-4444-4444-8444-444444444444",
      kind: "flow_item", role: "source",
    },
    content_hash: contentHash,
    applicability,
    branch_reasons: Object.fromEntries(Object.entries(applicability).map(([branch, value]) => [branch, value === "REQUIRED" ? [{ code: branch === "code" ? "ALWAYS_CODE" : "PATH_RULE" }] : []])),
    expected_evidence: Object.fromEntries(Object.entries(applicability).map(([branch, value]) => [branch, value === "REQUIRED" ? evidenceKinds(branch) : []])),
    risk_level: "MEDIUM",
    artifact_slot: artifactSlot,
  };
  return { ...unsigned, plan_sha256: sha256(unsigned) };
}

function environmentReceipt(overrides = {}) {
  const fence = {
    runId: overrides.run_id ?? "run-1",
    attemptId: overrides.attempt_id ?? "attempt-1",
    environmentId: overrides.environment_id ?? "generic-env",
  };
  const namespace = targetNamespace(fence);
  const stateRoot = overrides.state_root ?? "/tmp/qah-fixture";
  const environmentDirectory = join(stateRoot, namespace);
  const value = {
    environment_status: "READY",
    run_id: fence.runId,
    attempt_id: fence.attemptId,
    environment_id: fence.environmentId,
    target_namespace: namespace,
    repository_origin: "https://example.test/generic/product.git",
    commit,
    content_hash: contentHash,
    instance_nonce: instanceNonce,
    base_url: "http://127.0.0.1:4173",
    pid_file: join(environmentDirectory, "server.pid"),
    state_file: join(environmentDirectory, "environment.json"),
  };
  for (const [key, entry] of Object.entries(overrides)) if (key !== "state_root") value[key] = entry;
  return value;
}

function evidenceKinds(branch) {
  return {
    code: ["repository-diff", "static-analysis"],
    api: ["api-contract", "automated-api-test"],
    ui: ["playwright", "screenshot"],
    domain: ["domain-data", "sandbox-test"],
  }[branch];
}

function evidenceCandidate(kind, name, content = `${kind}-bytes`) {
  const bytes = Buffer.from(content);
  return { kind, name, media_type: kind === "screenshot" ? "image/png" : kind === "trace" ? "application/zip" : "text/markdown", size_bytes: bytes.byteLength, sha256: sha256(content), content_base64: bytes.toString("base64") };
}

function reviewAdapterResult(branch, overrides = {}) {
  return {
    schema_version: "nuanu.qa-branch-adapter-result.v1",
    branch,
    product_result: "PASS",
    environment_status: "HEALTHY",
    evidence_status: "VERIFIED",
    confidence: ({ api: 0.99, ui: 0.98, domain: 0.97 })[branch],
    code: `${branch.toUpperCase()}_${branch === "ui" ? "FLOW" : branch === "domain" ? "RULE" : "CONTRACT"}_VERIFIED`,
    observations: [{ code: "ASSERTION_PASSED", status: "PASS", value_sha256: artifactDigest }],
    evidence_kinds: evidenceKinds(branch),
    candidates: branch === "ui" ? [evidenceCandidate("screenshot", "ui-main.png"), evidenceCandidate("trace", "ui-trace.zip")] : [evidenceCandidate("document", `${branch}-evidence.md`)],
    ...overrides,
  };
}

function paydemoInput(branch, overrides = {}) {
  const value = {
    schema_version: "nuanu.qa-branch-adapter-input.v1", branch, run_id: "run-1", attempt_id: "attempt-1",
    attempt_namespace: sha256({ run_id: "run-1", attempt_id: "attempt-1" }).slice("sha256:".length),
    branch_namespace: sha256({ run_id: "run-1", attempt_id: "attempt-1", branch }).slice("sha256:".length),
    test_data_profile: branch === "domain" ? "payment_sandbox" : null,
    environment: { base_url: "http://127.0.0.1:4173", commit, content_hash: contentHash, environment_id: "generic-env", instance_nonce: instanceNonce },
    ...overrides,
  };
  return value;
}

async function persistedEnvironmentFixture(t, { runId = "run-1", attemptId = "attempt-1", environmentId = "generic-env" } = {}) {
  const root = await mkdtemp(join(tmpdir(), "qah-branch-state-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const receipt = environmentReceipt({ run_id: runId, attempt_id: attemptId, environment_id: environmentId, state_root: root });
  const environmentDirectory = dirname(receipt.state_file);
  const checkout = join(environmentDirectory, "checkout");
  await mkdir(checkout, { recursive: true });
  const runtimeContract = {
    command: [process.execPath, join(checkout, "server.mjs")], base_url: receipt.base_url, content_hash: receipt.content_hash,
    environment: {}, identity_environment: {}, allowed_generated_entries: [], state_fields: {}, configuration: {},
  };
  const declaredRequestDigest = `sha256:${"8".repeat(64)}`;
  const state = {
    schema: "qah.generic-environment-state.v3", phase: "READY",
    fence: { run_id: runId, attempt_id: attemptId, environment_id: environmentId },
    declared_request_digest: declaredRequestDigest,
    request_digest: sha256({ declared_request_digest: declaredRequestDigest, actual_runtime_contract: runtimeContract }),
    runtime_contract_digest: sha256(runtimeContract), runtime_contract: runtimeContract,
    repository_origin: receipt.repository_origin, commit: receipt.commit, state_root: root, checkout,
    state_file: receipt.state_file, target_namespace: receipt.target_namespace, pid_file: receipt.pid_file,
    executable_identity: process.execPath, executable_realpath: process.execPath, entrypoint_identity: process.execPath,
    entrypoint_realpath: process.execPath, process_start_token: "fixture-start", instance_nonce: receipt.instance_nonce,
    owner_token: "fixture-owner-token", content_hash: receipt.content_hash, base_url: receipt.base_url,
    health_path: "/build-info", timeout_ms: 2_000, max_output_bytes: 16_384,
    allowed_generated_entries: [], pid: process.pid, receipt,
  };
  await writeFile(receipt.state_file, `${JSON.stringify(state)}\n`);
  await writeFile(receipt.pid_file, `${process.pid}\n`);
  return { root, receipt, state, checkout };
}

function successfulExecute(calls) {
  return async (file, args, options) => {
    const input = JSON.parse(options.stdin);
    calls.push({ file, args, options, input });
    if (input.branch === "code") return { exitCode: 0, signal: null, stdout: "typecheck passed", stderr: "" };
    return { exitCode: 0, signal: null, stdout: canonicalJson(reviewAdapterResult(input.branch)), stderr: "" };
  };
}

function runBranch(input) {
  const receipt = input.environmentReceipt;
  const trustedStateRoot = receipt?.state_file ? dirname(dirname(receipt.state_file)) : "/tmp/qah-fixture";
  if (input.dependencies) return productionRunBranch({ ...input, dependencies: { trustedStateRoot, ...input.dependencies } });
  return productionRunBranch({
    ...input,
    dependencies: {
      trustedStateRoot,
      verifyEnvironment: async ({ receipt: verifiedReceipt }) => ({ receipt: verifiedReceipt, checkout: join(dirname(verifiedReceipt.state_file), "checkout") }),
    },
  });
}

async function fixture(name) {
  return JSON.parse(await readFile(new URL(`./fixtures/branch-${name}.json`, import.meta.url), "utf8"));
}

function projection(result) {
  const data = result.envelope.item.data;
  return {
    branch: result.branch_result.branch,
    applicability: result.branch_result.applicability,
    product_result: result.branch_result.product_result,
    environment_status: data.environment_status,
    evidence_status: result.branch_result.evidence_status,
    confidence: data.confidence,
    code: data.code,
  };
}

function assertEnvironmentVerificationFailure(result, branch = "api") {
  assert.deepEqual(projection(result), {
    branch, applicability: "REQUIRED", product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE",
    evidence_status: "UNVERIFIED", confidence: 0, code: "ENVIRONMENT_VERIFICATION_FAILED",
  });
  assert.deepEqual(Object.keys(result).sort(), ["branch_result", "envelope"]);
  assert.equal(result.envelope.artifact_outputs["item.artifacts.evidence_report"], null);
  assert.deepEqual(JSON.parse(result.envelope.item.data.evidence_candidate).candidates, []);
}

test("all four branches produce the closed fixture result and one evidence-report slot", async () => {
  const calls = [];
  const rawProfile = profile();
  const rawPlan = plan(rawProfile);
  for (const branch of ["code", "api", "ui", "domain"]) {
    const result = await runBranch({
      branch,
      plan: rawPlan,
      profile: rawProfile,
      environmentReceipt: environmentReceipt(),
      runId: "run-1",
      attemptId: "attempt-1",
      testDataProfile: branch === "domain" ? "sandbox" : undefined,
      execute: successfulExecute(calls),
      environment: { PATH: "/usr/bin", LANG: "C", HOME: "/secret-home", ACCESS_TOKEN: "must-not-leak" },
    });
    assert.deepEqual(projection(result), await fixture(`${branch}-pass`));
    assert.deepEqual(Object.keys(result).sort(), ["branch_result", "envelope"]);
    assert.equal(result.envelope.artifact_outputs["item.artifacts.evidence_report"], null);
    assert.equal(result.envelope.item.data.evidence_sha256, sha256(result.envelope.item.data.evidence_candidate));
  }
});

test("profile-declared arbitrary outcome codes classify Task 4 without core product literals", async () => {
  const outcome_codes = Object.fromEntries(["code", "api", "ui", "domain"].map((branch) => [branch, {
    pass: [`${branch.toUpperCase()}_READY`],
    fail: [`${branch.toUpperCase()}_FAILED`],
    infra: [`${branch.toUpperCase()}_INFRA`],
    skipped: [`${branch.toUpperCase()}_SKIPPED`],
  }]));
  const rawProfile = profile({ outcome_codes });
  const rawPlan = plan(rawProfile);
  const result = await runBranch({
    branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => ({ exitCode: 0, signal: null, stdout: canonicalJson(reviewAdapterResult("api", { code: "API_READY" })), stderr: "" }),
  });
  assert.equal(result.envelope.item.data.code, "API_READY");
  const undeclared = await runBranch({
    branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => ({ exitCode: 0, signal: null, stdout: canonicalJson(reviewAdapterResult("api", { code: "PRODUCT_SPECIFIC_MAGIC" })), stderr: "" }),
  });
  assert.equal(undeclared.envelope.item.data.code, "API_INFRA");
  const skippedPlan = plan(rawProfile, { code: "NOT_APPLICABLE", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
  const skipped = await runBranch({
    branch: "api", plan: skippedPlan, profile: rawProfile,
    environmentReceipt: { environment_status: "NOT_REQUIRED", run_id: "run-1", attempt_id: "attempt-1", environment_id: "generic-env", target_namespace: targetNamespace({ runId: "run-1", attemptId: "attempt-1", environmentId: "generic-env" }) },
    runId: "run-1", attemptId: "attempt-1",
  });
  assert.equal(skipped.envelope.item.data.code, "API_SKIPPED");
  const codeReady = await runBranch({
    branch: "code", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => ({ exitCode: 0, signal: null, stdout: "", stderr: "" }),
    dependencies: { verifyEnvironment: async ({ receipt }) => ({ receipt, checkout: "/tmp/qah/verified" }) },
  });
  assert.equal(codeReady.envelope.item.data.code, "CODE_READY");
  const codeInfra = await runBranch({
    branch: "code", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => { throw new Error("transport"); },
    dependencies: { verifyEnvironment: async ({ receipt }) => ({ receipt, checkout: "/tmp/qah/verified" }) },
  });
  assert.equal(codeInfra.envelope.item.data.code, "CODE_INFRA");
});

test("Task 4 materializes exactly three canonical files with digest and Artifact cross-links", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-branch-material-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const rawProfile = profile();
  const rawPlan = plan(rawProfile, { code: "NOT_APPLICABLE", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
  const receipt = { environment_status: "NOT_REQUIRED", run_id: "run-1", attempt_id: "attempt-1", environment_id: "generic-env", target_namespace: targetNamespace({ runId: "run-1", attemptId: "attempt-1", environmentId: "generic-env" }) };
  const output = await runBranch({ branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: receipt, runId: "run-1", attemptId: "attempt-1" });
  const refs = {
    branch_payload: { artifact_id: "11111111-1111-4111-8111-111111111111", version_id: "22222222-2222-4222-8222-222222222222", kind: "document", role: "output" },
    occurrence: { artifact_id: "33333333-3333-4333-8333-333333333333", version_id: "44444444-4444-4444-8444-444444444444", kind: "document", role: "evidence" },
    evidence: { artifact_id: "55555555-5555-4555-8555-555555555555", version_id: "66666666-6666-4666-8666-666666666666", kind: "document", role: "evidence" },
  };
  const result = await materializeBranchFiles({ output, plan: rawPlan, environmentReceipt: receipt, repositoryOrigin: rawProfile.repository.allowed_origin, refs, outputDir: root });
  assert.deepEqual((await readdir(root)).sort(), ["branch-payload.json", "evidence.json", "occurrence.json"]);
  const payloadBytes = await readFile(join(root, "branch-payload.json"), "utf8");
  const evidence = JSON.parse(await readFile(join(root, "evidence.json"), "utf8"));
  const occurrence = JSON.parse(await readFile(join(root, "occurrence.json"), "utf8"));
  assert.equal(evidence.branch_payload_sha256, `sha256:${createHash("sha256").update(payloadBytes).digest("hex")}`);
  assert.deepEqual(occurrence.branch_payload_artifact, refs.branch_payload);
  assert.deepEqual(occurrence.evidence_artifact, refs.evidence);
  const { occurrence_key, ...unsigned } = occurrence;
  assert.equal(occurrence_key, sha256(unsigned));
  assert.deepEqual(result.refs, refs);
});

test("Task 4 files and actual refs form a complete branch-to-aggregate chain", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-branch-chain-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = aggregateFixture();
  for (const [index, entry] of fixture.input.branches.entries()) {
    const directory = join(root, entry.output.branch_result.branch);
    const pending = structuredClone(entry.output);
    pending.envelope.item.artifacts = {};
    pending.envelope.artifact_outputs = { "item.artifacts.evidence_report": null };
    const materialized = await materializeBranchFiles({
      output: pending,
      plan: fixture.plan,
      environmentReceipt: fixture.input.environment_receipt,
      repositoryOrigin: fixture.input.repository_origin,
      refs: entry.artifacts,
      outputDir: directory,
    });
    for (const [slot, filename] of Object.entries({ branch_payload: "branch-payload.json", occurrence: "occurrence.json", evidence: "evidence.json" })) {
      rewriteMaterial(fixture.store, materialized.refs[slot], JSON.parse(await readFile(join(directory, filename), "utf8")));
    }
    fixture.input.branches[index] = { output: materialized.output, artifacts: materialized.refs };
  }
  const aggregate = await aggregateFixtureResult(fixture);
  assert.equal(aggregate.invariants_passed, true);
  assert.deepEqual(aggregate.reason_codes, []);
  assert.deepEqual(aggregate.branches.map(({ branch, validity }) => [branch, validity]), [
    ["code", "VALID"], ["api", "VALID"], ["ui", "VALID"], ["domain", "VALID"],
  ]);
});

test("NOT_APPLICABLE UI emits verified SKIPPED without executing Playwright", async () => {
  const rawProfile = profile();
  const rawPlan = plan(rawProfile, { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
  const forbiddenExecute = async () => { throw new Error("Playwright must not execute"); };
  const result = await runBranch({ branch: "ui", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1", execute: forbiddenExecute });
  assert.equal(result.branch_result.product_result, "SKIPPED");
  assert.equal(result.envelope.item.data.environment_status, "HEALTHY");
  assert.equal(result.branch_result.evidence_status, "VERIFIED");
  assert.equal(result.envelope.item.data.code, "NOT_APPLICABLE");
});

test("transport failure is INCONCLUSIVE plus INFRA_FAILURE and never a product defect", async () => {
  const rawProfile = profile();
  const timeout = new Error("adapter timed out");
  timeout.code = "ETIMEDOUT";
  const result = await runBranch({
    branch: "api", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => { throw timeout; },
  });
  assert.deepEqual(projection(result), await fixture("infra-failure"));
  assert.equal(canonicalJson(result).includes("defect"), false);
});

test("profile, full plan, receipt, branch, run, and attempt are exact before side effects", async () => {
  const cases = [];
  const rawProfile = profile();
  const rawPlan = plan(rawProfile);
  cases.push({ label: "profile", input: { branch: "api", plan: rawPlan, profile: { ...rawProfile, unknown: true }, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1" } });
  cases.push({ label: "plan", input: { branch: "api", plan: { ...rawPlan, plan_sha256: artifactDigest }, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1" } });
  cases.push({ label: "receipt", input: { branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt({ run_id: "other-run" }), runId: "run-1", attemptId: "attempt-1" } });
  cases.push({ label: "branch", input: { branch: "other", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1" } });
  cases.push({ label: "run", input: { branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "../run", attemptId: "attempt-1" } });
  cases.push({ label: "attempt", input: { branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt({ attempt_id: "attempt-2" }), runId: "run-1", attemptId: "attempt-1" } });
  let calls = 0;
  for (const entry of cases) {
    await assert.rejects(runBranch({ ...entry.input, execute: async () => { calls += 1; } }), Error, entry.label);
  }
  assert.equal(calls, 0);
});

test("executes only declared argv with shell false, a minimal environment, finite bounds, and canonical bounded stdin", async () => {
  const calls = [];
  const rawProfile = profile();
  await runBranch({
    branch: "api", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: successfulExecute(calls), environment: { PATH: "/usr/bin", LANG: "C", HOME: "/private", ACCESS_TOKEN: "secret" },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].file, "node");
  assert.deepEqual(calls[0].args, ["adapters/product.mjs", "api"]);
  assert.equal(calls[0].options.shell, false);
  assert.deepEqual(calls[0].options.env, { PATH: "/usr/bin", LANG: "C" });
  assert.equal(calls[0].options.timeoutMs, 2_000);
  assert.equal(calls[0].options.maxOutputBytes, 16_384);
  assert.equal(calls[0].options.cwd, join(dirname(environmentReceipt().state_file), "checkout"));
  assert.equal(calls[0].options.stdin, canonicalJson(calls[0].input));
  assert.equal(Buffer.byteLength(calls[0].options.stdin) <= 65_536, true);
});

test("UI requires the prepared exact origin and versioned screenshot plus trace references", async () => {
  const rawProfile = profile();
  let calls = 0;
  await assert.rejects(runBranch({
    branch: "ui", plan: plan(rawProfile), profile: rawProfile,
    environmentReceipt: environmentReceipt({ base_url: "http://127.0.0.1:4174" }), runId: "run-1", attemptId: "attempt-1",
    execute: async () => { calls += 1; },
  }), /origin/);
  assert.equal(calls, 0);
  await assert.rejects(runBranch({
    branch: "ui", plan: plan(rawProfile), profile: rawProfile,
    environmentReceipt: environmentReceipt({ base_url: "http://127.0.0.1:4173/app" }), runId: "run-1", attemptId: "attempt-1",
    execute: async () => { calls += 1; },
  }), /origin/);
  assert.equal(calls, 0);

  const result = await runBranch({
    branch: "ui", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: successfulExecute([]),
  });
  const uiEvidence = JSON.parse(result.envelope.item.data.evidence_candidate);
  assert.deepEqual(uiEvidence.candidates.map(({ kind }) => kind), ["screenshot", "trace"]);
  assert.equal(uiEvidence.candidates.some((candidate) => "version" in candidate), false);
});

test("domain accepts only a declared profile name and never serializes test-data values", async () => {
  const rawProfile = profile();
  const calls = [];
  await assert.rejects(runBranch({
    branch: "domain", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    testDataProfile: "production", execute: successfulExecute(calls),
  }), /test-data profile/);
  const secretValue = "4111111111111111";
  const result = await runBranch({
    branch: "domain", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    testDataProfile: "sandbox", execute: successfulExecute(calls), environment: { TEST_DATA_VALUE: secretValue },
  });
  assert.equal(calls.at(-1).input.test_data_profile, "sandbox");
  assert.equal(canonicalJson(calls.at(-1).input).includes(secretValue), false);
  assert.equal(canonicalJson(result).includes(secretValue), false);
});

test("concurrent branches and overlapping attempts receive isolated namespaces", async () => {
  const rawProfile = profile();
  const rawPlan = plan(rawProfile);
  const state = new Map();
  const execute = async (_file, _args, options) => {
    const input = JSON.parse(options.stdin);
    state.set(input.branch_namespace, (state.get(input.branch_namespace) ?? 0) + 1);
    if (input.branch === "code") return { exitCode: 0, signal: null, stdout: "ok", stderr: "" };
    return { exitCode: 0, signal: null, stdout: canonicalJson(reviewAdapterResult(input.branch)), stderr: "" };
  };
  const firstAttempt = ["code", "api", "ui", "domain"].map((branch) => runBranch({
    branch, plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    testDataProfile: branch === "domain" ? "sandbox" : undefined, execute,
  }));
  const secondAttempt = runBranch({
    branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt({ attempt_id: "attempt-2" }),
    runId: "run-1", attemptId: "attempt-2", execute,
  });
  const results = await Promise.all([...firstAttempt, secondAttempt]);
  assert.equal(new Set(results.map((result) => result.envelope.item.data.branch_namespace)).size, 5);
  assert.deepEqual([...state.values()], [1, 1, 1, 1, 1]);
});

test("closed adapter output rejects extra keys and oversized stdout as infrastructure uncertainty", async () => {
  const rawProfile = profile();
  for (const execute of [
    async () => ({ exitCode: 0, signal: null, stdout: canonicalJson({ ...reviewAdapterResult("api"), secret: "leak" }), stderr: "" }),
    async () => ({ exitCode: 0, signal: null, stdout: "x".repeat(16_385), stderr: "" }),
    async () => ({ exitCode: 0, signal: null, stdout: canonicalJson(reviewAdapterResult("api")) + " ".repeat(8_000), stderr: "x".repeat(9_000) }),
  ]) {
    const result = await runBranch({ branch: "api", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1", execute });
    assert.equal(result.branch_result.product_result, "INCONCLUSIVE");
    assert.equal(result.envelope.item.data.environment_status, "INFRA_FAILURE");
  }
});

test("PayDemo adapter is the only wrapper that maps generic branches to the existing probes", async () => {
  const calls = [];
  const probeResult = {
    axes: { product_result: "PASS", environment_status: "HEALTHY", evidence_status: "VERIFIED", confidence: 1 },
    code: "AMOUNT_REJECTED",
    occurrence_key: artifactDigest,
    occurrence: { observed: { unsafe: "not forwarded" } },
    evidence: { sha256: artifactDigest, markdown_path: "/private/evidence.md" },
  };
  const input = paydemoInput("api");
  const result = await runPaydemoAdapter(input, {
    runProbe: async (options) => {
      calls.push(options);
      const markdownPath = join(options.evidenceDirectory, "api.md");
      await writeFile(markdownPath, "api evidence");
      return { ...probeResult, evidence: { sha256: artifactDigest, markdown_path: markdownPath } };
    },
  });
  assert.equal(calls[0].mode, "amount");
  assert.equal(result.branch, "api");
  assert.equal(canonicalJson(result).includes("/private/evidence.md"), false);
  assert.equal(canonicalJson(result).includes("not forwarded"), false);
});

test("PayDemo UI wrapper returns candidates captured by the asserted interaction", async () => {
  const uiInput = paydemoInput("ui");
  const captured = [];
  const result = await runPaydemoAdapter(uiInput, {
    runUiProbe: async (input) => {
      captured.push(input.branch_namespace);
      return {
        classification: { product_result: "PASS", environment_status: "HEALTHY", evidence_status: "VERIFIED", confidence: 1, code: "BANK_TRANSFER_CONFIRMED" },
        observation_sha256: artifactDigest,
        candidates: [evidenceCandidate("screenshot", "ui-main.png"), evidenceCandidate("trace", "ui-trace.zip")],
      };
    },
  });
  assert.deepEqual(captured, [uiInput.branch_namespace]);
  assert.deepEqual(result.candidates.map((candidate) => candidate.kind), ["screenshot", "trace"]);
});

test("PayDemo UI wrapper forwards only the explicitly supplied environment to its probe", async () => {
  const uiInput = paydemoInput("ui");
  const environments = [];
  await runPaydemoAdapter(uiInput, {
    runUiProbe: async (_input, options) => {
      environments.push(options.environment);
      return {
        classification: { product_result: "PASS", environment_status: "HEALTHY", evidence_status: "VERIFIED", confidence: 1, code: "BANK_TRANSFER_CONFIRMED" },
        observation_sha256: artifactDigest,
        candidates: [evidenceCandidate("screenshot", "ui-main.png"), evidenceCandidate("trace", "ui-trace.zip")],
      };
    },
    environment: { PATH: "/usr/bin" },
  });
  assert.equal(environments[0].PATH, "/usr/bin");
  assert.equal("NUANU_QA_BROWSER_CDP_URL" in environments[0], false);
});

test("persisted Task 3 state is the sole source of checkout trust and retry paths cannot be reused", async (t) => {
  const fixture = await persistedEnvironmentFixture(t);
  const rawProfile = profile();
  const rawPlan = plan(rawProfile);
  const calls = [];
  const dependencies = {
    trustedStateRoot: fixture.root,
    verifyCheckout: async ({ checkout, expectedCommit }) => {
      assert.equal(checkout, fixture.checkout);
      assert.equal(expectedCommit, commit);
    },
  };
  const result = await runBranch({
    branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: fixture.receipt,
    runId: "run-1", attemptId: "attempt-1", execute: async (file, args, options) => {
      calls.push({ file, args, options });
      return { exitCode: 0, signal: null, stdout: canonicalJson(reviewAdapterResult("api")), stderr: "" };
    }, dependencies,
  });
  assert.equal(calls[0].options.cwd, fixture.checkout);
  assert.equal(result.branch_result.product_result, "PASS");

  const forgedPath = { ...fixture.receipt, state_file: "/tmp/attacker/environment.json", pid_file: "/tmp/attacker/server.pid" };
  await assert.rejects(runBranch({ branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: forgedPath, runId: "run-1", attemptId: "attempt-1", execute: async () => { calls.push("forged"); }, dependencies }), /state|path|namespace/);

  const retryReuse = { ...fixture.receipt, attempt_id: "attempt-2" };
  await assert.rejects(runBranch({ branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: retryReuse, runId: "run-1", attemptId: "attempt-2", execute: async () => { calls.push("retry"); }, dependencies }), /namespace|path|state/);

  const tamperedState = structuredClone(fixture.state);
  tamperedState.receipt = { ...tamperedState.receipt, base_url: "http://127.0.0.1:4174" };
  await writeFile(fixture.receipt.state_file, JSON.stringify(tamperedState));
  assertEnvironmentVerificationFailure(await runBranch({ branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: fixture.receipt, runId: "run-1", attemptId: "attempt-1", execute: async () => { calls.push("state"); }, dependencies }));

  await writeFile(fixture.receipt.state_file, JSON.stringify({ ...fixture.state, owner_token: "" }));
  assertEnvironmentVerificationFailure(await runBranch({ branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: fixture.receipt, runId: "run-1", attemptId: "attempt-1", execute: async () => { calls.push("owner"); }, dependencies }));

  await writeFile(fixture.receipt.state_file, JSON.stringify(fixture.state));
  await writeFile(fixture.receipt.pid_file, `${process.pid + 1}\n`);
  assertEnvironmentVerificationFailure(await runBranch({ branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: fixture.receipt, runId: "run-1", attemptId: "attempt-1", execute: async () => { calls.push("pid"); }, dependencies }));

  await rm(fixture.receipt.state_file);
  assertEnvironmentVerificationFailure(await runBranch({ branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: fixture.receipt, runId: "run-1", attemptId: "attempt-1", execute: async () => { calls.push("missing"); }, dependencies }));
  assert.deepEqual(calls.filter((entry) => typeof entry === "string"), []);
});

test("environment verifier exceptions become the uniform infrastructure envelope before execute", async () => {
  const rawProfile = profile();
  let executions = 0;
  const result = await runBranch({
    branch: "api", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => { executions += 1; },
    dependencies: { verifyEnvironment: async () => { throw new Error("persisted state disappeared"); } },
  });
  assertEnvironmentVerificationFailure(result);
  assert.equal(executions, 0);
});

test("code requires a verified READY checkout and never falls back to the worker cwd", async () => {
  const rawProfile = profile();
  const rawPlan = plan(rawProfile);
  const failureReceipt = {
    environment_status: "INFRA_FAILURE", run_id: "run-1", attempt_id: "attempt-1", environment_id: "generic-env",
    target_namespace: targetNamespace({ runId: "run-1", attemptId: "attempt-1", environmentId: "generic-env" }), reason: "prepare failed",
  };
  let calls = 0;
  const result = await runBranch({ branch: "code", plan: rawPlan, profile: rawProfile, environmentReceipt: failureReceipt, runId: "run-1", attemptId: "attempt-1", execute: async () => { calls += 1; } });
  assert.equal(result.branch_result.product_result, "INCONCLUSIVE");
  assert.equal(result.envelope.item.data.environment_status, "INFRA_FAILURE");
  assert.equal(calls, 0);
});

test("PASS cannot be forged without nonempty assertions, every planned evidence kind, and verified candidate bytes", async () => {
  const rawProfile = profile();
  const rawPlan = plan(rawProfile);
  const cases = [
    reviewAdapterResult("api", { observations: [] }),
    reviewAdapterResult("api", { observations: [{ code: "ASSERTION_FAILED", status: "FAIL", value_sha256: artifactDigest }] }),
    reviewAdapterResult("api", { evidence_kinds: ["api-contract"] }),
    reviewAdapterResult("api", { evidence_kinds: [...evidenceKinds("api"), "unplanned-evidence"] }),
    reviewAdapterResult("api", { candidates: [{ ...evidenceCandidate("document", "api.md"), sha256: artifactDigest }] }),
  ];
  for (const adapter of cases) {
    const result = await runBranch({
      branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
      execute: async () => ({ exitCode: 0, signal: null, stdout: canonicalJson(adapter), stderr: "" }),
      dependencies: { verifyEnvironment: async ({ receipt }) => ({ receipt, checkout: dirname(receipt.state_file) + "/checkout" }) },
    });
    assert.equal(result.branch_result.product_result, "INCONCLUSIVE");
    assert.equal(result.envelope.item.data.environment_status, "INFRA_FAILURE");
  }
});

test("branch output is an exact validator-backed envelope with honest null materialization slots", async () => {
  const rawProfile = profile();
  const result = await runBranch({
    branch: "api", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => ({ exitCode: 0, signal: null, stdout: canonicalJson(reviewAdapterResult("api")), stderr: "" }),
    dependencies: { verifyEnvironment: async ({ receipt }) => ({ receipt, checkout: dirname(receipt.state_file) + "/checkout" }) },
  });
  assert.deepEqual(Object.keys(result).sort(), ["branch_result", "envelope"]);
  assert.deepEqual(Object.keys(result.branch_result).sort(), ["applicability", "branch", "commit", "evidence_status", "product_result", "profile_digest", "project_key", "schema_version"]);
  assert.deepEqual(result.envelope.artifact_outputs, { "item.artifacts.evidence_report": null });
  assert.deepEqual(result.envelope.item.artifacts, {});
  assert.equal(canonicalJson(result).includes('"version":1'), false);
});

test("code VERIFIED output contains a bounded candidate bound to the executed command digests", async () => {
  const rawProfile = profile();
  const result = await runBranch({
    branch: "code", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => ({ exitCode: 0, signal: null, stdout: "typecheck passed", stderr: "" }),
    dependencies: { verifyEnvironment: async ({ receipt }) => ({ receipt, checkout: dirname(receipt.state_file) + "/checkout" }) },
  });
  const evidence = JSON.parse(result.envelope.item.data.evidence_candidate);
  assert.deepEqual(evidence.evidence_kinds, evidenceKinds("code"));
  assert.equal(evidence.candidates.length, 1);
  assert.equal(evidence.candidates[0].kind, "document");
  assert.equal(Buffer.from(evidence.candidates[0].content_base64, "base64").toString("utf8").includes("typecheck passed"), false);
});

test("signal, null exit, and missing exit code are transport failures for every branch", async () => {
  const rawProfile = profile();
  for (const branch of ["code", "api"]) {
    for (const execution of [
      { exitCode: null, signal: "SIGKILL", stdout: "", stderr: "" },
      { signal: null, stdout: "", stderr: "" },
    ]) {
      const result = await runBranch({
        branch, plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
        execute: async () => execution,
        dependencies: { verifyEnvironment: async ({ receipt }) => ({ receipt, checkout: dirname(receipt.state_file) + "/checkout" }) },
      });
      assert.equal(result.branch_result.product_result, "INCONCLUSIVE");
      assert.equal(result.envelope.item.data.environment_status, "INFRA_FAILURE");
    }
  }
});

test("adapter stdout must be exact canonical bytes with no trailing whitespace", async () => {
  const rawProfile = profile();
  const result = await runBranch({
    branch: "api", plan: plan(rawProfile), profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    execute: async () => ({ exitCode: 0, signal: null, stdout: `${canonicalJson(reviewAdapterResult("api"))}\n`, stderr: "" }),
    dependencies: { verifyEnvironment: async ({ receipt }) => ({ receipt, checkout: dirname(receipt.state_file) + "/checkout" }) },
  });
  assert.equal(result.branch_result.product_result, "INCONCLUSIVE");
});

test("concurrent reset and fixture mutations remain isolated behind a real overlap barrier", async () => {
  const rawProfile = profile();
  const rawPlan = plan(rawProfile);
  const store = new Map();
  let arrivals = 0;
  let releaseBarrier;
  const barrier = new Promise((resolvePromise) => { releaseBarrier = resolvePromise; });
  const execute = async (_file, _args, options) => {
    const input = JSON.parse(options.stdin);
    assert.match(input.attempt_namespace, /^[a-f0-9]{64}$/);
    assert.match(input.branch_namespace, /^[a-f0-9]{64}$/);
    store.set(input.branch_namespace, { owner: input.attempt_namespace, reset: true, fixtures: [input.branch] });
    arrivals += 1;
    if (arrivals === 5) releaseBarrier();
    await barrier;
    const own = store.get(input.branch_namespace);
    assert.equal(own.owner, input.attempt_namespace);
    assert.deepEqual(own.fixtures, [input.branch]);
    if (input.branch === "code") return { exitCode: 0, signal: null, stdout: "ok", stderr: "" };
    return { exitCode: 0, signal: null, stdout: canonicalJson(reviewAdapterResult(input.branch)), stderr: "" };
  };
  const verifyEnvironment = async ({ receipt }) => ({ receipt, checkout: dirname(receipt.state_file) + "/checkout" });
  const first = ["code", "api", "ui", "domain"].map((branch) => runBranch({
    branch, plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt(), runId: "run-1", attemptId: "attempt-1",
    testDataProfile: branch === "domain" ? "sandbox" : undefined, execute, dependencies: { verifyEnvironment },
  }));
  const retry = runBranch({
    branch: "api", plan: rawPlan, profile: rawProfile, environmentReceipt: environmentReceipt({ attempt_id: "attempt-2" }),
    runId: "run-1", attemptId: "attempt-2", execute, dependencies: { verifyEnvironment },
  });
  const results = await Promise.all([...first, retry]);
  assert.equal(new Set(results.map((entry) => entry.envelope.item.data.branch_namespace)).size, 5);
  assert.equal(store.size, 5);
});

function fakeUiBrowser({ finalUrl = "http://127.0.0.1:4173/", screenshotBytes = "screenshot", traceBytes = "trace", requestUrl = "http://127.0.0.1:4173/app.js", interactionRequestUrl = "http://127.0.0.1:4173/api/checkout", webSocketUrl = null, responseBodyError = null, contextCloseError = null, browserCloseError = null, requestBodyObject = { runId: paydemoInput("ui").branch_namespace, planId: "starter", amountCents: 1000, paymentMethod: "bank" }, requestSizes, requestBodyBytes, receiptText = "Payment recorded by bank transfer.", receiptEvaluation, cdpSessionError = null, cdpDetachError = null, cdpFrameUrl = finalUrl, cdpWorldResult, cdpEvaluationResult } = {}) {
  const events = [];
  let routeHandler;
  let webSocketHandler;
  const state = { contextOptions: null, cdpCalls: [] };
  const responseBody = Buffer.from(JSON.stringify({ paymentId: "id", amountCents: 1000, paymentMethod: "bank" }));
  const defaultRequestBodyBytes = Buffer.from(JSON.stringify(requestBodyObject));
  const request = {
    method: () => "POST",
    sizes: async () => {
      events.push("request-sizes");
      return requestSizes ?? { requestBodySize: defaultRequestBodyBytes.byteLength, requestHeadersSize: 128, responseBodySize: responseBody.byteLength, responseHeadersSize: 128 };
    },
    postDataBuffer: () => { events.push("post-data-buffer"); return requestBodyBytes ?? defaultRequestBodyBytes; },
    postDataJSON: () => { events.push("post-data-json"); return requestBodyObject; },
  };
  const response = {
    url: () => "http://127.0.0.1:4173/api/checkout", status: () => 201,
    request: () => request,
    headerValue: async (name) => name === "content-type" ? "application/json" : String(responseBody.byteLength),
    body: async () => { events.push("response-body"); if (responseBodyError) throw responseBodyError; return responseBody; },
  };
  const page = {
    async goto() {
      const route = { request: () => ({ url: () => requestUrl }), continue: async () => events.push("route-continue"), abort: async () => events.push("route-abort") };
      await routeHandler(route);
      events.push("goto");
    },
    url: () => finalUrl,
    getByLabel: () => ({ check: async () => events.push("check"), isChecked: async () => true }),
    waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; },
    getByRole(role) {
      if (role === "button") return { click: async () => {
        const route = { request: () => ({ url: () => interactionRequestUrl }), continue: async () => events.push("interaction-continue"), abort: async () => events.push("interaction-abort") };
        await routeHandler(route);
        if (webSocketUrl && webSocketHandler) await webSocketHandler({
          url: () => webSocketUrl,
          close: async () => events.push("websocket-close"),
          connectToServer: () => { events.push("websocket-connect"); return {}; },
        });
        else if (webSocketUrl) events.push("websocket-unrouted");
        events.push("click");
      } };
      return { filter: () => ({
        waitFor: async () => events.push("receipt"),
        evaluate: async (pageFunction, maximumBytes) => {
          events.push("receipt-evaluate");
          return receiptEvaluation ?? pageFunction({ textContent: receiptText }, maximumBytes);
        },
        textContent: async () => { events.push("receipt-text-content"); return receiptText; },
      }) };
    },
    async screenshot({ path }) { events.push("screenshot"); await writeFile(path, screenshotBytes); },
  };
  const context = {
    tracing: { start: async () => events.push("trace-start"), stop: async ({ path }) => { events.push("trace-stop"); await writeFile(path, traceBytes); } },
    route: async (_pattern, handler) => { routeHandler = handler; },
    routeWebSocket: async (_pattern, handler) => { webSocketHandler = handler; },
    newPage: async () => page,
    newCDPSession: async () => {
      state.cdpCalls.push("new-session");
      if (cdpSessionError) throw cdpSessionError;
      return {
        send: async (method, parameters = {}) => {
          state.cdpCalls.push({ method, parameters });
          if (method === "Page.getFrameTree") return { frameTree: { frame: { id: "main-frame", url: cdpFrameUrl } } };
          if (method === "Page.createIsolatedWorld") return cdpWorldResult ?? { executionContextId: 17 };
          if (method === "Runtime.evaluate") {
            const value = receiptEvaluation ?? (Buffer.byteLength(receiptText, "utf8") > 1024 ? { oversized: true } : { oversized: false, value: receiptText });
            return cdpEvaluationResult ?? { result: { type: "object", value } };
          }
          throw new Error(`unexpected CDP method ${method}`);
        },
        detach: async () => { state.cdpCalls.push("detach"); if (cdpDetachError) throw cdpDetachError; },
      };
    },
    close: async () => { events.push("context-close"); if (contextCloseError) throw contextCloseError; }, setDefaultTimeout: () => {},
  };
  const browser = {
    newContext: async (options) => { state.contextOptions = options; return context; },
    close: async () => { events.push("browser-close"); if (browserCloseError) throw browserCloseError; },
  };
  return { chromium: { launch: async () => browser }, events, state };
}

test("UI assertion, screenshot, and trace share one isolated context and clean temporary files", async (t) => {
  const artifactRoot = await mkdtemp(join(tmpdir(), "qah-ui-same-context-"));
  t.after(() => rm(artifactRoot, { recursive: true, force: true }));
  const harness = fakeUiBrowser();
  const input = paydemoInput("ui");
  const result = await paydemoAdapterModule.runPaydemoUiProbe(input, { chromium: harness.chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" });
  assert.equal(harness.events.indexOf("click") < harness.events.indexOf("screenshot"), true);
  assert.equal(harness.events.indexOf("screenshot") < harness.events.indexOf("trace-stop"), true);
  assert.deepEqual(result.candidates.map((entry) => entry.kind), ["screenshot", "trace"]);
  assert.deepEqual(harness.state.contextOptions, { serviceWorkers: "block" });
  assert.deepEqual(await readdir(artifactRoot), []);
  assert.deepEqual(harness.events.slice(-2), ["context-close", "browser-close"]);
});

test("UI rejects cross-origin navigation or requests and removes oversized evidence on every path", async (t) => {
  for (const [index, configuration] of [
    { finalUrl: "https://evil.example/" },
    { requestUrl: "https://evil.example/script.js" },
    { interactionRequestUrl: "https://evil.example/exfiltrate" },
    { webSocketUrl: "wss://evil.example/exfiltrate" },
    { screenshotBytes: "x".repeat(1025) },
  ].entries()) {
    const artifactRoot = await mkdtemp(join(tmpdir(), `qah-ui-reject-${index}-`));
    t.after(() => rm(artifactRoot, { recursive: true, force: true }));
    const harness = fakeUiBrowser(configuration);
    const input = paydemoInput("ui");
    await assert.rejects(paydemoAdapterModule.runPaydemoUiProbe(input, { chromium: harness.chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" }), /origin|artifact|size|scope/i);
    assert.deepEqual(await readdir(artifactRoot), []);
    assert.equal(harness.events.includes("context-close"), true);
    assert.equal(harness.events.includes("browser-close"), true);
  }
});

test("UI assertion never materializes an untrusted response body", async (t) => {
  const artifactRoot = await mkdtemp(join(tmpdir(), "qah-ui-no-body-"));
  t.after(() => rm(artifactRoot, { recursive: true, force: true }));
  const harness = fakeUiBrowser({ responseBodyError: new Error("body is decompressed and unbounded") });
  const result = await paydemoAdapterModule.runPaydemoUiProbe(paydemoInput("ui"), { chromium: harness.chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" });
  assert.equal(result.classification.product_result, "PASS");
  assert.equal(harness.events.includes("response-body"), false);
  assert.deepEqual(await readdir(artifactRoot), []);
});

test("UI rejects oversized request metadata before any POST body crosses the Playwright boundary", async (t) => {
  const artifactRoot = await mkdtemp(join(tmpdir(), "qah-ui-request-oversize-"));
  t.after(() => rm(artifactRoot, { recursive: true, force: true }));
  const harness = fakeUiBrowser({ requestSizes: { requestBodySize: 4097, requestHeadersSize: 128, responseBodySize: 1, responseHeadersSize: 128 } });
  await assert.rejects(paydemoAdapterModule.runPaydemoUiProbe(paydemoInput("ui"), { chromium: harness.chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" }), /request|body|size/i);
  assert.equal(harness.events.includes("post-data-buffer"), false);
  assert.equal(harness.events.includes("post-data-json"), false);
  assert.deepEqual(await readdir(artifactRoot), []);
});

test("UI rejects missing, mismatched, or non-closed bounded POST bodies", async (t) => {
  const cases = [
    { requestSizes: { requestHeadersSize: 128, responseBodySize: 1, responseHeadersSize: 128 }, expectedBufferRead: false },
    { requestSizes: { requestBodySize: 2, requestHeadersSize: 128, responseBodySize: 1, responseHeadersSize: 128 }, expectedBufferRead: true },
    { requestBodyObject: { runId: paydemoInput("ui").branch_namespace, planId: "starter", amountCents: 1000, paymentMethod: "bank", secret: "must-not-cross" }, expectedBufferRead: true },
  ];
  for (const [index, configuration] of cases.entries()) {
    const artifactRoot = await mkdtemp(join(tmpdir(), `qah-ui-request-invalid-${index}-`));
    t.after(() => rm(artifactRoot, { recursive: true, force: true }));
    const harness = fakeUiBrowser(configuration);
    await assert.rejects(paydemoAdapterModule.runPaydemoUiProbe(paydemoInput("ui"), { chromium: harness.chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" }), /request|body|size|shape/i);
    assert.equal(harness.events.includes("post-data-buffer"), configuration.expectedBufferRead);
    assert.equal(harness.events.includes("post-data-json"), false);
    assert.equal(canonicalJson(harness.events).includes("must-not-cross"), false);
    assert.deepEqual(await readdir(artifactRoot), []);
  }
});

test("UI isolated world never transfers oversized or malformed receipt DOM values", async (t) => {
  const cases = [
    { receiptText: "x".repeat(1025) },
    { receiptEvaluation: { oversized: false } },
    { receiptEvaluation: { oversized: false, value: 7 } },
    { receiptEvaluation: { oversized: false, value: "ok", extra: "must-not-cross" } },
  ];
  for (const [index, configuration] of cases.entries()) {
    const artifactRoot = await mkdtemp(join(tmpdir(), `qah-ui-receipt-invalid-${index}-`));
    t.after(() => rm(artifactRoot, { recursive: true, force: true }));
    const harness = fakeUiBrowser(configuration);
    await assert.rejects(paydemoAdapterModule.runPaydemoUiProbe(paydemoInput("ui"), { chromium: harness.chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" }), /receipt|DOM|size|shape|type/i);
    assert.equal(harness.events.includes("receipt-text-content"), false);
    assert.equal(canonicalJson(harness.events).includes("must-not-cross"), false);
    assert.deepEqual(await readdir(artifactRoot), []);
  }
});

test("real Chromium receipt cap uses a pristine world despite a main-world TextEncoder monkeypatch", async (t) => {
  let checkoutBody = "";
  const hugeReceipt = `Payment recorded by bank transfer. ${"x".repeat(2048)}`;
  const server = createServer((request, response) => {
    if (request.method === "POST" && request.url === "/api/checkout") {
      request.setEncoding("utf8");
      request.on("data", (chunk) => { checkoutBody += chunk; });
      request.on("end", () => {
        response.writeHead(201, { "content-type": "application/json" });
        response.end('{"paymentId":"id","amountCents":1000,"paymentMethod":"bank"}');
      });
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html><body>
      <label><input type="radio" name="payment-method" value="bank">Bank transfer</label>
      <button type="button">Pay $10.00</button><p id="payment-status" role="status"></p>
      <script>
        window.__mainWorldEncoderCalls = 0;
        window.TextEncoder = class { encode() { window.__mainWorldEncoderCalls += 1; return new Uint8Array(0); } };
        document.querySelector('button').addEventListener('click', async () => {
          const runId = new URL(location.href).searchParams.get('runId');
          await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ runId, planId: 'starter', amountCents: 1000, paymentMethod: 'bank' }) });
          document.querySelector('#payment-status').textContent = ${JSON.stringify(hugeReceipt)};
        });
      </script></body></html>`);
  });
  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  t.after(() => new Promise((resolvePromise) => server.close(resolvePromise)));
  const address = server.address();
  assert.equal(typeof address, "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const state = { mainWorldEncoderCalls: null };
  const chromium = {
    async launch(options) {
      const browser = await realChromium.launch(options);
      return {
        async newContext(contextOptions) {
          const context = await browser.newContext(contextOptions);
          return {
            setDefaultTimeout: context.setDefaultTimeout.bind(context), route: context.route.bind(context),
            routeWebSocket: context.routeWebSocket.bind(context), tracing: context.tracing,
            newPage: context.newPage.bind(context), newCDPSession: context.newCDPSession.bind(context),
            async close() {
              const [page] = context.pages();
              if (page) state.mainWorldEncoderCalls = await page.evaluate(() => window.__mainWorldEncoderCalls);
              await context.close();
            },
          };
        },
        close: browser.close.bind(browser),
      };
    },
  };
  const input = paydemoInput("ui", { environment: { ...paydemoInput("ui").environment, base_url: origin } });
  const artifactRoot = await mkdtemp(join(tmpdir(), "qah-ui-real-isolated-world-"));
  t.after(() => rm(artifactRoot, { recursive: true, force: true }));
  let observedError;
  try { await paydemoAdapterModule.runPaydemoUiProbe(input, { chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" }); } catch (error) { observedError = error; }
  assert.match(String(observedError), /receipt|DOM|size/i);
  assert.equal(state.mainWorldEncoderCalls, 0);
  assert.equal(String(observedError).includes(hugeReceipt), false);
  assert.deepEqual(JSON.parse(checkoutBody), { runId: input.branch_namespace, planId: "starter", amountCents: 1000, paymentMethod: "bank" });
  assert.deepEqual(await readdir(artifactRoot), []);
});

test("UI rejects unavailable or malformed isolated CDP worlds and observes detach failures", async (t) => {
  const cases = [
    { cdpSessionError: new Error("CDP unavailable"), pattern: /CDP|isolated/i },
    { cdpFrameUrl: "https://evil.example/", pattern: /frame|origin/i },
    { cdpWorldResult: {}, pattern: /world|context/i },
    { cdpEvaluationResult: { result: { type: "string", value: "forged" } }, pattern: /CDP|result|shape/i },
    { cdpDetachError: new Error("CDP detach cleanup failed"), pattern: /cleanup/i },
  ];
  for (const [index, configuration] of cases.entries()) {
    const artifactRoot = await mkdtemp(join(tmpdir(), `qah-ui-cdp-invalid-${index}-`));
    t.after(() => rm(artifactRoot, { recursive: true, force: true }));
    const harness = fakeUiBrowser(configuration);
    await assert.rejects(paydemoAdapterModule.runPaydemoUiProbe(paydemoInput("ui"), { chromium: harness.chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" }), configuration.pattern);
    assert.deepEqual(await readdir(artifactRoot), []);
    assert.equal(harness.events.includes("context-close"), true);
    assert.equal(harness.events.includes("browser-close"), true);
    if (configuration.cdpDetachError) assert.equal(harness.state.cdpCalls.includes("detach"), true);
  }
});

test("UI cleanup failures reject the adapter, attempt all cleanup, and remove evidence", async (t) => {
  for (const [index, configuration] of [
    { contextCloseError: new Error("context cleanup failed") },
    { browserCloseError: new Error("browser cleanup failed") },
  ].entries()) {
    const artifactRoot = await mkdtemp(join(tmpdir(), `qah-ui-cleanup-${index}-`));
    t.after(() => rm(artifactRoot, { recursive: true, force: true }));
    const harness = fakeUiBrowser(configuration);
    await assert.rejects(paydemoAdapterModule.runPaydemoUiProbe(paydemoInput("ui"), { chromium: harness.chromium, artifactRoot, maxArtifactBytes: 1024, browserMode: "standalone" }), /cleanup/i);
    assert.deepEqual(await readdir(artifactRoot), []);
    assert.equal(harness.events.includes("context-close"), true);
    assert.equal(harness.events.includes("browser-close"), true);
  }
});

test("committed PayDemo profile validates the exact managed runtime origin including port 4173", async () => {
  const committedProfile = validateProfile(YAML.parse(await readFile("qa-harness.yaml", "utf8")));
  assert.deepEqual(committedProfile.safety.allowed_origins, ["http://127.0.0.1:4173"]);
});
