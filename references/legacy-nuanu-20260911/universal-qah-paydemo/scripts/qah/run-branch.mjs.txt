#!/usr/bin/env node

import { execFile as execFileCallback, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile as readFileFs, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { promisify } from "node:util";
import { canonicalJson, sha256 } from "./canonical.mjs";
import { BRANCHES, validateBranchResult, validateOutcomeCode, validateProfile, validateTestPlan } from "./contracts.mjs";
import { targetNamespace } from "./environment.mjs";

const execFile = promisify(execFileCallback);
const DEFAULT_STATE_ROOT = join(tmpdir(), "nuanu-qah-environments");
const PLAN_KEYS = ["schema_version", "project_key", "commit", "profile_digest", "branches", "source_artifact", "content_hash", "applicability", "branch_reasons", "expected_evidence", "risk_level", "artifact_slot", "plan_sha256"];
const GRAPH_PLAN_KEYS = [...PLAN_KEYS, "graph_binding"];
const READY_RECEIPT_KEYS = ["environment_status", "run_id", "attempt_id", "environment_id", "target_namespace", "repository_origin", "commit", "content_hash", "instance_nonce", "base_url", "pid_file", "state_file"];
const NOT_REQUIRED_RECEIPT_KEYS = ["environment_status", "run_id", "attempt_id", "environment_id", "target_namespace"];
const FAILURE_RECEIPT_KEYS = [...NOT_REQUIRED_RECEIPT_KEYS, "reason"];
const ADAPTER_RESULT_KEYS = ["schema_version", "branch", "product_result", "environment_status", "evidence_status", "confidence", "code", "observations", "evidence_kinds", "candidates"];
const OBSERVATION_KEYS = ["code", "status", "value_sha256"];
const CANDIDATE_KEYS = ["kind", "name", "media_type", "size_bytes", "sha256", "content_base64"];
const MINIMAL_ENVIRONMENT = ["PATH", "LANG", "LC_ALL", "LC_CTYPE", "TMPDIR", "TMP", "TEMP", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT"];
const UI_WORKER_ENVIRONMENT = ["NUANU_QA_BROWSER_CDP_URL", "NUANU_QA_PLAYWRIGHT_MODULE"];
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const NAMESPACE = /^[a-f0-9]{64}$/;
const NONCE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CODE = /^[A-Z][A-Z0-9_]{0,63}$/;
const EVIDENCE_KIND = /^[a-z][a-z0-9-]{0,63}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SOURCE_ARTIFACT_KEYS = ["artifact_id", "version_id", "kind", "role"];
const MAX_STDIN_BYTES = 65_536;
const MAX_STATE_BYTES = 1024 * 1024;

function exactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  if (canonicalJson(Object.keys(value).sort()) !== canonicalJson([...keys].sort())) throw new Error(`${label} must have exact keys`);
  return value;
}

function exactId(value, label) {
  if (typeof value !== "string" || !ID.test(value)) throw new Error(`${label} is invalid`);
  return value;
}

function exactUrl(value, label) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${label} must be an absolute URL`); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.hash) throw new Error(`${label} must be credential-free HTTP or HTTPS`);
  return parsed;
}

function digestBytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function validatePlan(plan, profile) {
  exactKeys(plan, plan?.graph_binding === undefined ? PLAN_KEYS : GRAPH_PLAN_KEYS, "test plan");
  validateTestPlan(plan.artifact_slot);
  const artifact = plan.artifact_slot;
  if (plan.schema_version !== artifact.schema_version || plan.project_key !== artifact.project_key || plan.commit !== artifact.commit || plan.profile_digest !== artifact.profile_digest || canonicalJson(plan.branches) !== canonicalJson(artifact.branches)) throw new Error("test plan artifact slot must match the full plan");
  if ((plan.graph_binding === undefined) !== (artifact.graph_binding === undefined)
    || (plan.graph_binding !== undefined && canonicalJson(plan.graph_binding) !== canonicalJson(artifact.graph_binding))) throw new Error("test plan graph binding must match the artifact slot");
  if (plan.project_key !== profile.project_key || plan.profile_digest !== sha256(profile)) throw new Error("test plan identity must match the exact profile");
  exactKeys(plan.source_artifact, SOURCE_ARTIFACT_KEYS, "test plan source artifact");
  if (!UUID.test(plan.source_artifact.artifact_id) || !UUID.test(plan.source_artifact.version_id)
    || plan.source_artifact.kind !== "flow_item" || plan.source_artifact.role !== "source") throw new Error("source artifact reference is invalid");
  if (!DIGEST.test(plan.content_hash) || !DIGEST.test(plan.plan_sha256)) throw new Error("test plan digest is invalid");
  const { plan_sha256, ...unsigned } = plan;
  if (sha256(unsigned) !== plan_sha256) throw new Error("test plan digest does not match canonical plan bytes");
  exactKeys(plan.applicability, BRANCHES, "test plan applicability");
  exactKeys(plan.branch_reasons, BRANCHES, "test plan branch reasons");
  exactKeys(plan.expected_evidence, BRANCHES, "test plan expected evidence");
  if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(plan.risk_level)) throw new Error("test plan risk level is invalid");
  for (const branch of BRANCHES) {
    const applicability = plan.applicability[branch];
    if (!["REQUIRED", "NOT_APPLICABLE"].includes(applicability)) throw new Error(`test plan ${branch} applicability is invalid`);
    if (!Array.isArray(plan.branch_reasons[branch]) || plan.branch_reasons[branch].some((reason) => {
      try { exactKeys(reason, ["code"], `${branch} reason`); return !CODE.test(reason.code); } catch { return true; }
    })) throw new Error(`test plan ${branch} reasons are invalid`);
    if (!Array.isArray(plan.expected_evidence[branch]) || plan.expected_evidence[branch].some((kind) => typeof kind !== "string" || !EVIDENCE_KIND.test(kind))) throw new Error(`test plan ${branch} evidence is invalid`);
    if (applicability === "REQUIRED" && plan.expected_evidence[branch].length === 0) throw new Error(`required ${branch} must declare expected evidence`);
    if (applicability === "NOT_APPLICABLE" && (plan.branch_reasons[branch].length !== 0 || plan.expected_evidence[branch].length !== 0)) throw new Error(`not-applicable ${branch} must not declare reasons or evidence`);
  }
  const expectedBranches = BRANCHES.filter((branch) => plan.applicability[branch] === "REQUIRED");
  if (canonicalJson(expectedBranches) !== canonicalJson(plan.branches)) throw new Error("test plan branches must match applicability");
  return plan;
}

function expectedReceiptPaths(trustedStateRoot, receipt) {
  const root = resolve(trustedStateRoot);
  if (root === resolve("/")) throw new Error("trusted state root cannot be the filesystem root");
  const namespace = targetNamespace({ runId: receipt.run_id, attemptId: receipt.attempt_id, environmentId: receipt.environment_id });
  const environmentDirectory = join(root, namespace);
  return { root, namespace, environmentDirectory, stateFile: join(environmentDirectory, "environment.json"), pidFile: join(environmentDirectory, "server.pid"), checkout: join(environmentDirectory, "checkout") };
}

function validateReceipt(receipt, { plan, profile, runId, attemptId, trustedStateRoot }) {
  const keys = receipt?.environment_status === "READY" ? READY_RECEIPT_KEYS
    : receipt?.environment_status === "NOT_REQUIRED" ? NOT_REQUIRED_RECEIPT_KEYS
      : receipt?.environment_status === "INFRA_FAILURE" ? FAILURE_RECEIPT_KEYS : null;
  if (!keys) throw new Error("environment receipt status is invalid");
  exactKeys(receipt, keys, "environment receipt");
  exactId(receipt.run_id, "environment receipt run_id");
  exactId(receipt.attempt_id, "environment receipt attempt_id");
  exactId(receipt.environment_id, "environment receipt environment_id");
  if (receipt.run_id !== runId || receipt.attempt_id !== attemptId) throw new Error("environment receipt run and attempt must match execution fence");
  const paths = expectedReceiptPaths(trustedStateRoot, receipt);
  if (receipt.target_namespace !== paths.namespace || !NAMESPACE.test(receipt.target_namespace)) throw new Error("environment receipt target namespace does not match its exact fence");
  if (receipt.environment_status === "READY") {
    if (receipt.state_file !== paths.stateFile || receipt.pid_file !== paths.pidFile) throw new Error("environment receipt state and PID paths must be exact under the trusted namespace");
    if (receipt.repository_origin !== profile.repository.allowed_origin || receipt.commit !== plan.commit || receipt.content_hash !== plan.content_hash) throw new Error("environment receipt build identity must match plan and profile");
    if (!SHA.test(receipt.commit) || !DIGEST.test(receipt.content_hash) || !NONCE.test(receipt.instance_nonce)) throw new Error("environment receipt identity is invalid");
    exactUrl(receipt.repository_origin, "environment receipt repository origin");
    exactUrl(receipt.base_url, "environment receipt base URL");
  }
  if (receipt.environment_status === "INFRA_FAILURE" && (typeof receipt.reason !== "string" || receipt.reason.length === 0 || receipt.reason.length > 1024)) throw new Error("environment failure reason is invalid");
  return { receipt, paths };
}

async function boundedJsonFile(path, maximumBytes, readFile = readFileFs) {
  const metadata = await lstat(path);
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > maximumBytes) throw new Error("persisted environment state exceeds its bound");
  const source = await readFile(path, "utf8");
  if (Buffer.byteLength(source) > maximumBytes) throw new Error("persisted environment state exceeds its bound");
  try { return JSON.parse(source); } catch { throw new Error("persisted environment state is invalid JSON"); }
}

function validateGeneratedEntries(entries) {
  if (!Array.isArray(entries) || new Set(entries).size !== entries.length) throw new Error("persisted generated-entry policy is invalid");
  for (const entry of entries) {
    if (typeof entry !== "string" || !entry.startsWith("?? ")) throw new Error("persisted generated-entry policy is invalid");
    const path = entry.slice(3);
    if (!path || path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) throw new Error("persisted generated-entry policy is unsafe");
  }
  return entries;
}

function validateTask3ReadyState(state, { receipt, plan, profile, paths, runId, attemptId }) {
  const requiredState = ["schema", "phase", "fence", "declared_request_digest", "request_digest", "runtime_contract_digest", "runtime_contract", "repository_origin", "commit", "state_root", "checkout", "state_file", "target_namespace", "pid_file", "executable_identity", "executable_realpath", "entrypoint_identity", "entrypoint_realpath", "process_start_token", "instance_nonce", "owner_token", "content_hash", "base_url", "health_path", "timeout_ms", "max_output_bytes", "allowed_generated_entries", "pid", "receipt"];
  if (!state || typeof state !== "object" || Array.isArray(state) || requiredState.some((key) => !(key in state))) throw new Error("persisted Task 3 state is incomplete");
  if (state.schema !== "qah.generic-environment-state.v3" || state.phase !== "READY") throw new Error("persisted Task 3 state is not READY v3 state");
  if (canonicalJson(state.fence) !== canonicalJson({ run_id: runId, attempt_id: attemptId, environment_id: receipt.environment_id })) throw new Error("persisted Task 3 fence does not match the branch attempt");
  if (state.state_root !== paths.root || state.checkout !== paths.checkout || state.state_file !== paths.stateFile || state.pid_file !== paths.pidFile || state.target_namespace !== paths.namespace) throw new Error("persisted Task 3 paths do not match the trusted namespace");
  if (canonicalJson(state.receipt) !== canonicalJson(receipt)) throw new Error("persisted Task 3 receipt does not match the supplied receipt");
  if (state.repository_origin !== receipt.repository_origin || state.commit !== receipt.commit || state.commit !== plan.commit || state.content_hash !== receipt.content_hash || state.base_url !== receipt.base_url || state.instance_nonce !== receipt.instance_nonce) throw new Error("persisted Task 3 build identity does not match the receipt");
  if (!NONCE.test(state.instance_nonce) || !Number.isSafeInteger(state.pid) || state.pid <= 1 || typeof state.process_start_token !== "string" || state.process_start_token.length === 0 || typeof state.owner_token !== "string" || state.owner_token.length < 16) throw new Error("persisted Task 3 ownership state is malformed");
  for (const path of [state.executable_identity, state.executable_realpath, state.entrypoint_identity, state.entrypoint_realpath]) if (typeof path !== "string" || !isAbsolute(path)) throw new Error("persisted Task 3 executable identity is malformed");
  if (typeof state.health_path !== "string" || state.health_path !== profile.environment.health_path || state.timeout_ms !== profile.execution.timeout_ms || state.max_output_bytes !== profile.execution.max_output_bytes) throw new Error("persisted Task 3 execution policy does not match the profile");
  validateGeneratedEntries(state.allowed_generated_entries);
  const runtime = exactKeys(state.runtime_contract, ["command", "base_url", "content_hash", "environment", "identity_environment", "allowed_generated_entries", "state_fields", "configuration"], "persisted Task 3 runtime contract");
  if (!Array.isArray(runtime.command) || runtime.command.length === 0 || runtime.command.some((part) => typeof part !== "string" || part.length === 0 || /[\0\r\n]/.test(part))) throw new Error("persisted Task 3 runtime command is invalid");
  if (!runtime.state_fields || typeof runtime.state_fields !== "object" || Array.isArray(runtime.state_fields)) throw new Error("persisted Task 3 runtime state fields are invalid");
  if (!DIGEST.test(state.declared_request_digest) || sha256(runtime) !== state.runtime_contract_digest || sha256({ declared_request_digest: state.declared_request_digest, actual_runtime_contract: runtime }) !== state.request_digest) throw new Error("persisted Task 3 runtime contract digest is invalid");
  if (runtime.content_hash !== receipt.content_hash || runtime.base_url !== receipt.base_url || canonicalJson(runtime.allowed_generated_entries) !== canonicalJson(state.allowed_generated_entries)) throw new Error("persisted Task 3 runtime contract does not match its state");
  for (const [name, value] of Object.entries(runtime.state_fields)) if (canonicalJson(state[name]) !== canonicalJson(value)) throw new Error(`persisted Task 3 runtime field ${name} does not match its state`);
  return state;
}

async function defaultVerifyCheckout({ checkout, expectedCommit, allowedGeneratedEntries, timeoutMs, maxOutputBytes, execFileImpl = execFile }) {
  const options = { encoding: "utf8", timeout: timeoutMs, maxBuffer: maxOutputBytes, killSignal: "SIGKILL", shell: false };
  const head = (await execFileImpl("git", ["-C", checkout, "rev-parse", "HEAD"], options)).stdout.trim();
  if (head !== expectedCommit) throw new Error("verified isolated checkout does not match the pinned commit");
  const status = (await execFileImpl("git", ["-C", checkout, "status", "--porcelain", "--untracked-files=normal"], options)).stdout.trim();
  const allowed = new Set(allowedGeneratedEntries);
  const unexpected = status.split("\n").filter(Boolean).filter((entry) => !allowed.has(entry));
  if (unexpected.length > 0) throw new Error("verified isolated checkout is dirty");
}

export async function verifyPreparedEnvironment({ receipt, plan, profile, runId, attemptId }, dependencies = {}) {
  const trustedStateRoot = dependencies.trustedStateRoot ?? DEFAULT_STATE_ROOT;
  const validated = validateReceipt(receipt, { plan, profile, runId, attemptId, trustedStateRoot });
  if (receipt.environment_status !== "READY") throw new Error("verified isolated checkout requires a READY environment receipt");
  const [realRoot, realEnvironmentDirectory, realCheckout, realStateFile, realPidFile] = await Promise.all([
    realpath(validated.paths.root), realpath(validated.paths.environmentDirectory), realpath(validated.paths.checkout), realpath(validated.paths.stateFile), realpath(validated.paths.pidFile),
  ]);
  if (realEnvironmentDirectory !== join(realRoot, validated.paths.namespace) || realCheckout !== join(realEnvironmentDirectory, "checkout") || realStateFile !== join(realEnvironmentDirectory, "environment.json") || realPidFile !== join(realEnvironmentDirectory, "server.pid")) throw new Error("persisted Task 3 paths escape the trusted namespace");
  const state = await boundedJsonFile(validated.paths.stateFile, MAX_STATE_BYTES, dependencies.readFile ?? readFileFs);
  validateTask3ReadyState(state, { receipt, plan, profile, paths: validated.paths, runId, attemptId });
  const pidSource = await (dependencies.readFile ?? readFileFs)(validated.paths.pidFile, "utf8");
  if (pidSource !== `${state.pid}\n`) throw new Error("persisted Task 3 PID file does not match ownership state");
  const verifyCheckout = dependencies.verifyCheckout ?? defaultVerifyCheckout;
  await verifyCheckout({ checkout: validated.paths.checkout, expectedCommit: receipt.commit, allowedGeneratedEntries: state.allowed_generated_entries, timeoutMs: profile.execution.timeout_ms, maxOutputBytes: profile.execution.max_output_bytes, execFileImpl: dependencies.execFile ?? execFile });
  return { receipt, checkout: validated.paths.checkout, state };
}

function attemptNamespace(runId, attemptId) {
  return sha256({ run_id: runId, attempt_id: attemptId }).slice("sha256:".length);
}

function branchNamespace(runId, attemptId, branch) {
  return sha256({ run_id: runId, attempt_id: attemptId, branch }).slice("sha256:".length);
}

export function runtimeEnvironmentForBranch(branch, environment) {
  if (!BRANCHES.includes(branch)) throw new Error("branch is invalid");
  const names = branch === "ui" ? [...MINIMAL_ENVIRONMENT, ...UI_WORKER_ENVIRONMENT] : MINIMAL_ENVIRONMENT;
  return Object.fromEntries(names.filter((name) => typeof environment?.[name] === "string").map((name) => [name, environment[name]]));
}

function validateCandidate(value, maximumBytes) {
  exactKeys(value, CANDIDATE_KEYS, "evidence candidate");
  if (!["document", "screenshot", "trace"].includes(value.kind) || typeof value.name !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.name)) throw new Error("evidence candidate identity is invalid");
  const mediaTypes = { document: "text/markdown", screenshot: "image/png", trace: "application/zip" };
  if (value.media_type !== mediaTypes[value.kind] || !Number.isSafeInteger(value.size_bytes) || value.size_bytes < 1 || value.size_bytes > maximumBytes || !DIGEST.test(value.sha256) || typeof value.content_base64 !== "string") throw new Error("evidence candidate bounds are invalid");
  const bytes = Buffer.from(value.content_base64, "base64");
  if (bytes.toString("base64") !== value.content_base64 || bytes.byteLength !== value.size_bytes || digestBytes(bytes) !== value.sha256) throw new Error("evidence candidate bytes do not match their digest");
  return value;
}

function validateAdapterResult(value, branch, expectedEvidence, maximumBytes, profile) {
  exactKeys(value, ADAPTER_RESULT_KEYS, "branch adapter result");
  if (value.schema_version !== "nuanu.qa-branch-adapter-result.v1" || value.branch !== branch) throw new Error("branch adapter result identity is invalid");
  if (!["PASS", "FAIL", "INCONCLUSIVE"].includes(value.product_result) || !["HEALTHY", "INFRA_FAILURE", "NOT_REQUIRED"].includes(value.environment_status) || !["VERIFIED", "PARTIAL", "UNVERIFIED"].includes(value.evidence_status)) throw new Error("branch adapter axes are invalid");
  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1 || !CODE.test(value.code)) throw new Error("branch adapter confidence or code is invalid");
  if (value.product_result === "PASS" && (value.environment_status !== "HEALTHY" || value.evidence_status !== "VERIFIED")) throw new Error("passing adapter result requires healthy verified evidence");
  if (value.product_result === "FAIL" && value.environment_status !== "HEALTHY") throw new Error("product failure requires a healthy environment");
  if (value.environment_status === "INFRA_FAILURE" && value.product_result !== "INCONCLUSIVE") throw new Error("infrastructure failure must be inconclusive");
  validateOutcomeCode(profile, branch, {
    applicability: "REQUIRED",
    product_result: value.product_result,
    environment_status: value.environment_status,
  }, value.code);
  if (!Array.isArray(value.observations) || value.observations.length === 0 || value.observations.length > 64) throw new Error("verified adapter evidence requires nonempty bounded assertions");
  for (const observation of value.observations) {
    exactKeys(observation, OBSERVATION_KEYS, "adapter observation");
    if (!CODE.test(observation.code) || !["PASS", "FAIL", "INCONCLUSIVE"].includes(observation.status) || !DIGEST.test(observation.value_sha256)) throw new Error("adapter observation is invalid");
  }
  if (value.product_result === "PASS" && value.observations.some((observation) => observation.status !== "PASS")) throw new Error("passing adapter result requires passing assertion observations");
  if (value.product_result === "FAIL" && !value.observations.some((observation) => observation.status === "FAIL")) throw new Error("failing adapter result requires a failing assertion observation");
  if (!Array.isArray(value.evidence_kinds) || new Set(value.evidence_kinds).size !== value.evidence_kinds.length || value.evidence_kinds.some((kind) => !EVIDENCE_KIND.test(kind))) throw new Error("adapter evidence kinds are invalid");
  if (canonicalJson([...value.evidence_kinds].sort()) !== canonicalJson([...expectedEvidence].sort())) throw new Error("adapter evidence must exactly match the plan");
  if (!Array.isArray(value.candidates) || value.candidates.length === 0 || value.candidates.length > 8) throw new Error("adapter evidence candidates are invalid");
  let total = 0;
  for (const candidate of value.candidates) { validateCandidate(candidate, maximumBytes); total += candidate.size_bytes; }
  if (total > maximumBytes) throw new Error("combined evidence candidates exceed the output bound");
  if (branch === "ui") {
    const kinds = value.candidates.map((candidate) => candidate.kind);
    if (!kinds.includes("screenshot") || !kinds.includes("trace")) throw new Error("UI evidence requires same-interaction screenshot and trace candidates");
  }
  return value;
}

function materialReference(value, role, expectedRole) {
  exactKeys(value, SOURCE_ARTIFACT_KEYS, `${role} Artifact reference`);
  if (!UUID.test(value.artifact_id) || !UUID.test(value.version_id) || value.kind !== "document" || value.role !== expectedRole) {
    throw new Error(`${role} Artifact reference is invalid`);
  }
  return { ...value };
}

function safeOutputDirectory(value) {
  if (typeof value !== "string" || !isAbsolute(value) || resolve(value) === resolve("/")) throw new Error("outputDir must be an absolute bounded task directory");
  return resolve(value);
}

export async function materializeBranchFiles({ output, plan, environmentReceipt, repositoryOrigin, refs, outputDir }) {
  validateBranchExecutionOutput(output);
  validateTestPlan(plan?.artifact_slot);
  let repository;
  try { repository = exactUrl(repositoryOrigin, "repository origin"); } catch { repository = null; }
  if (!plan || plan.plan_sha256 !== sha256(Object.fromEntries(Object.entries(plan).filter(([key]) => key !== "plan_sha256")))
    || repository?.protocol !== "https:" || repository.search || repository.href !== repositoryOrigin || !plan.source_artifact) throw new Error("materialization plan identity is invalid");
  const branch = output.branch_result.branch;
  const payloadRef = materialReference(refs?.branch_payload, "branch_payload", "output");
  const occurrenceRef = materialReference(refs?.occurrence, "occurrence", "evidence");
  const evidenceRef = materialReference(refs?.evidence, "evidence", "evidence");
  const directory = safeOutputDirectory(outputDir);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const executionData = output.envelope.item.data;
  let evidenceCandidate;
  try { evidenceCandidate = JSON.parse(executionData.evidence_candidate); } catch { throw new Error("branch evidence candidate is invalid JSON"); }
  if (canonicalJson(evidenceCandidate) !== executionData.evidence_candidate || sha256(executionData.evidence_candidate) !== executionData.evidence_sha256) throw new Error("branch evidence candidate digest is invalid");
  const payload = { schema_version: "nuanu.qa-materialized-branch-payload.v1", branch_result: output.branch_result, execution_data: executionData };
  const payloadBytes = Buffer.from(canonicalJson(payload));
  const evidence = {
    schema_version: "nuanu.qa-materialized-evidence.v1",
    source_artifact: { ...plan.source_artifact },
    plan_sha256: plan.plan_sha256,
    branch,
    branch_payload_sha256: digestBytes(payloadBytes),
    evidence_sha256: executionData.evidence_sha256,
    evidence_candidate: evidenceCandidate,
    confirmed_findings: output.branch_result.product_result === "FAIL" ? 1 : 0,
  };
  const unsignedOccurrence = {
    schema_version: "nuanu.qa-evidence-occurrence.v1",
    source_artifact: { ...plan.source_artifact },
    plan_sha256: plan.plan_sha256,
    branch,
    repository_origin: repositoryOrigin,
    commit: plan.commit,
    content_hash: plan.content_hash,
    environment_id: environmentReceipt.environment_id,
    instance_nonce: environmentReceipt.instance_nonce ?? null,
    run_id: executionData.run_id,
    attempt_id: executionData.attempt_id,
    branch_payload_artifact: payloadRef,
    evidence_artifact: evidenceRef,
  };
  const occurrence = { ...unsignedOccurrence, occurrence_key: sha256(unsignedOccurrence) };
  const files = [
    ["branch-payload.json", payload],
    ["evidence.json", evidence],
    ["occurrence.json", occurrence],
  ];
  for (const [name, value] of files) await writeFile(join(directory, name), canonicalJson(value), { mode: 0o600, flag: "w" });
  const completed = structuredClone(output);
  completed.envelope.item.artifacts = { evidence_report: evidenceRef };
  completed.envelope.artifact_outputs = { "item.artifacts.evidence_report": evidenceRef };
  return {
    output: completed,
    refs: { branch_payload: payloadRef, occurrence: occurrenceRef, evidence: evidenceRef },
    files: files.map(([name, value]) => ({ name, sha256: sha256(canonicalJson(value)), size_bytes: Buffer.byteLength(canonicalJson(value), "utf8") })),
  };
}

function validateBranchExecutionOutput(value) {
  exactKeys(value, ["branch_result", "envelope"], "branch execution output");
  validateBranchResult(value.branch_result);
  exactKeys(value.envelope, ["item", "artifact_outputs"], "branch execution envelope");
  exactKeys(value.envelope.item, ["key", "description", "data", "artifacts"], "branch execution item");
  exactKeys(value.envelope.item.data, ["schema_version", "run_id", "attempt_id", "attempt_namespace", "branch_namespace", "environment_status", "confidence", "code", "evidence_sha256", "evidence_candidate"], "branch execution data");
  exactKeys(value.envelope.item.artifacts, [], "branch execution artifacts");
  exactKeys(value.envelope.artifact_outputs, ["item.artifacts.evidence_report"], "branch artifact outputs");
  if (value.envelope.artifact_outputs["item.artifacts.evidence_report"] !== null || value.envelope.item.data.schema_version !== "nuanu.qa-branch-execution.v1") throw new Error("branch evidence report must be an honest null materialization slot");
  if (typeof value.envelope.item.data.evidence_candidate !== "string" || sha256(value.envelope.item.data.evidence_candidate) !== value.envelope.item.data.evidence_sha256) throw new Error("branch evidence candidate digest is invalid");
  JSON.parse(value.envelope.item.data.evidence_candidate);
  return value;
}

function buildOutput({ plan, branch, runId, attemptId, attemptNs, branchNs, receipt, productResult, environmentStatus, evidenceStatus, confidence, code, observations = [], evidenceKinds = [], candidates = [] }) {
  const branchResult = validateBranchResult({ schema_version: "nuanu.qa-branch-result.v1", project_key: plan.project_key, commit: plan.commit, profile_digest: plan.profile_digest, branch, applicability: plan.applicability[branch], product_result: productResult, evidence_status: evidenceStatus });
  const evidenceCandidate = canonicalJson({
    schema_version: "nuanu.qa-evidence-candidate.v1", run_id: runId, attempt_id: attemptId, attempt_namespace: attemptNs,
    branch_namespace: branchNs, branch, environment_identity: receipt.environment_status === "READY" ? {
      environment_id: receipt.environment_id, target_namespace: receipt.target_namespace, repository_origin: receipt.repository_origin,
      commit: receipt.commit, content_hash: receipt.content_hash, instance_nonce: receipt.instance_nonce, base_url: receipt.base_url,
    } : null,
    product_result: productResult, environment_status: environmentStatus, evidence_status: evidenceStatus, confidence, code,
    evidence_kinds: evidenceKinds, observations, candidates,
  });
  return validateBranchExecutionOutput({
    branch_result: branchResult,
    envelope: {
      item: {
        key: `verify_${branch}`, description: `${branch} QA: ${productResult} (${code})`,
        data: { schema_version: "nuanu.qa-branch-execution.v1", run_id: runId, attempt_id: attemptId, attempt_namespace: attemptNs, branch_namespace: branchNs, environment_status: environmentStatus, confidence, code, evidence_sha256: sha256(evidenceCandidate), evidence_candidate: evidenceCandidate },
        artifacts: {},
      },
      artifact_outputs: { "item.artifacts.evidence_report": null },
    },
  });
}

function declaredOutcomeCode(context, classification, preferred) {
  const codes = context.profile.outcome_codes[context.branch][classification];
  return codes.includes(preferred) ? preferred : codes[0];
}

function infraOutput(context, code = "TRANSPORT_FAILURE") {
  return buildOutput({
    ...context,
    productResult: "INCONCLUSIVE",
    environmentStatus: "INFRA_FAILURE",
    evidenceStatus: "UNVERIFIED",
    confidence: 0,
    code: declaredOutcomeCode(context, "infra", code),
  });
}

function unavailableCodeOutput(context, command) {
  const evidenceBytes = Buffer.from(canonicalJson({
    schema_version: "nuanu.qa-code-evidence.v1",
    commit: context.plan.commit,
    command,
    outcome: "EVIDENCE_UNAVAILABLE",
  }));
  const candidate = validateCandidate({
    kind: "document", name: "code-evidence.md", media_type: "text/markdown", size_bytes: evidenceBytes.byteLength,
    sha256: digestBytes(evidenceBytes), content_base64: evidenceBytes.toString("base64"),
  }, context.profile.execution.max_output_bytes);
  return buildOutput({
    ...context,
    productResult: "INCONCLUSIVE",
    environmentStatus: "NOT_REQUIRED",
    evidenceStatus: "PARTIAL",
    confidence: 0,
    code: declaredOutcomeCode(context, "infra", "TRANSPORT_FAILURE"),
    observations: [{ code: "COMMAND_EVIDENCE_MISSING", status: "INCONCLUSIVE", value_sha256: sha256({ commit: context.plan.commit, command }) }],
    evidenceKinds: context.plan.expected_evidence.code,
    candidates: [candidate],
  });
}

async function defaultExecute(file, args, options) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(file, args, { cwd: options.cwd, env: options.env, shell: false, stdio: ["pipe", "pipe", "pipe"], detached: true });
    let stdout = Buffer.alloc(0); let stderr = Buffer.alloc(0); let totalOutputBytes = 0; let settled = false; let timer;
    const stop = (error) => { if (settled) return; settled = true; if (timer) clearTimeout(timer); try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); } rejectPromise(error); };
    const append = (current, chunk) => {
      totalOutputBytes += chunk.byteLength;
      if (totalOutputBytes > options.maxOutputBytes) { const error = new Error("branch output exceeds configured bound"); error.code = "EOUTPUTLIMIT"; stop(error); }
      return Buffer.concat([current, chunk]);
    };
    child.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); });
    child.once("error", stop);
    timer = setTimeout(() => { const error = new Error("branch execution timed out"); error.code = "ETIMEDOUT"; stop(error); }, options.timeoutMs);
    child.once("close", (exitCode, signal) => { clearTimeout(timer); if (settled) return; settled = true; resolvePromise({ exitCode, signal, stdout: stdout.toString("utf8"), stderr: stderr.toString("utf8") }); });
    child.stdin.end(options.stdin);
  });
}

export async function runBranch({ branch, plan: rawPlan, profile: rawProfile, environmentReceipt: rawReceipt, runId, attemptId, testDataProfile, execute = defaultExecute, environment = process.env, dependencies = {} }) {
  if (!BRANCHES.includes(branch)) throw new Error("branch is invalid");
  exactId(runId, "run_id"); exactId(attemptId, "attempt_id");
  const profile = validateProfile(rawProfile);
  const plan = validatePlan(rawPlan, profile);
  const trustedStateRoot = dependencies.trustedStateRoot ?? DEFAULT_STATE_ROOT;
  const { receipt } = validateReceipt(rawReceipt, { plan, profile, runId, attemptId, trustedStateRoot });
  const attemptNs = attemptNamespace(runId, attemptId);
  const branchNs = branchNamespace(runId, attemptId, branch);
  const context = { plan, profile, branch, runId, attemptId, attemptNs, branchNs, receipt };

  if (plan.applicability[branch] === "NOT_APPLICABLE") return buildOutput({
    ...context,
    productResult: "SKIPPED",
    environmentStatus: receipt.environment_status === "READY" ? "HEALTHY" : "NOT_REQUIRED",
    evidenceStatus: "VERIFIED",
    confidence: 1,
    code: profile.outcome_codes[branch].skipped[0],
  });
  if (receipt.environment_status === "NOT_REQUIRED" && profile.environment.strategy !== "none") throw new Error("required branch with NOT_REQUIRED receipt requires the exact environment none profile");
  if (branch === "domain") {
    if (typeof testDataProfile !== "string" || !profile.test_data.profiles.includes(testDataProfile)) throw new Error("domain branch requires a declared named test-data profile");
  } else if (testDataProfile !== undefined) throw new Error("test-data profile is valid only for the domain branch");
  const repositoryOnlyCode = receipt.environment_status === "NOT_REQUIRED" && branch === "code";
  if (receipt.environment_status !== "READY" && !repositoryOnlyCode) return infraOutput(context, "ENVIRONMENT_NOT_READY");

  const verifyEnvironment = repositoryOnlyCode
    ? dependencies.verifyRepository
    : dependencies.verifyEnvironment ?? ((input) => verifyPreparedEnvironment(input, { ...dependencies, trustedStateRoot }));
  let verified;
  try {
    if (typeof verifyEnvironment !== "function") throw new Error("trusted repository verifier is required");
    verified = await verifyEnvironment({ receipt, plan, profile, runId, attemptId });
    if (!verified || verified.receipt !== receipt || typeof verified.checkout !== "string" || !isAbsolute(verified.checkout)) throw new Error("environment verifier returned an invalid trusted checkout");
    if (repositoryOnlyCode) {
      exactKeys(verified, ["receipt", "checkout", "repository_origin", "commit", "source_artifact", "profile_digest"], "trusted repository execution context");
      if (verified.repository_origin !== profile.repository.allowed_origin || verified.commit !== plan.commit
        || verified.profile_digest !== plan.profile_digest || canonicalJson(verified.source_artifact) !== canonicalJson(plan.source_artifact)) {
        throw new Error("trusted repository execution context does not match the plan");
      }
    }
  } catch {
    return repositoryOnlyCode ? unavailableCodeOutput(context, profile.checks.code) : infraOutput(context, "ENVIRONMENT_VERIFICATION_FAILED");
  }
  if (branch === "ui") {
    const prepared = exactUrl(receipt.base_url, "prepared UI origin");
    if (receipt.base_url !== prepared.origin || !profile.safety.allowed_origins.includes(prepared.origin)) throw new Error("prepared UI origin must exactly match a profile allowed origin");
  }

  const adapterInput = {
    schema_version: "nuanu.qa-branch-adapter-input.v1", branch, run_id: runId, attempt_id: attemptId,
    attempt_namespace: attemptNs, branch_namespace: branchNs, test_data_profile: branch === "domain" ? testDataProfile : null,
    environment: receipt.environment_status === "READY"
      ? { base_url: receipt.base_url, commit: receipt.commit, content_hash: receipt.content_hash, environment_id: receipt.environment_id, instance_nonce: receipt.instance_nonce }
      : { base_url: null, commit: plan.commit, content_hash: plan.content_hash, environment_id: receipt.environment_id, instance_nonce: null },
  };
  const stdin = canonicalJson(adapterInput);
  if (Buffer.byteLength(stdin) > Math.min(MAX_STDIN_BYTES, profile.execution.max_output_bytes)) throw new Error("canonical branch stdin exceeds configured bound");
  const command = profile.checks[branch];
  let execution;
  try {
    execution = await execute(command[0], command.slice(1), { cwd: verified.checkout, env: runtimeEnvironmentForBranch(branch, environment), shell: false, timeoutMs: profile.execution.timeout_ms, maxOutputBytes: profile.execution.max_output_bytes, stdin });
  } catch { return repositoryOnlyCode ? unavailableCodeOutput(context, command) : infraOutput(context); }
  if (!execution || typeof execution !== "object" || typeof execution.stdout !== "string" || typeof execution.stderr !== "string" || !Number.isInteger(execution.exitCode) || execution.signal !== null || Buffer.byteLength(execution.stdout) + Buffer.byteLength(execution.stderr) > profile.execution.max_output_bytes) return repositoryOnlyCode ? unavailableCodeOutput(context, command) : infraOutput(context);

  if (branch === "code") {
    const passed = execution.exitCode === 0;
    const observations = [
      { code: "PINNED_CHECKOUT_VERIFIED", status: "PASS", value_sha256: sha256({ checkout: verified.checkout, commit: plan.commit }) },
      { code: passed ? "COMMAND_EXIT_ZERO" : "COMMAND_EXIT_NONZERO", status: passed ? "PASS" : "FAIL", value_sha256: sha256({ stdout: execution.stdout, stderr: execution.stderr, exit_code: execution.exitCode }) },
    ];
    const evidenceBytes = Buffer.from(canonicalJson({
      schema_version: "nuanu.qa-code-evidence.v1", commit: plan.commit, command,
      exit_code: execution.exitCode, stdout_sha256: digestBytes(Buffer.from(execution.stdout)), stderr_sha256: digestBytes(Buffer.from(execution.stderr)),
    }));
    const candidate = validateCandidate({
      kind: "document", name: "code-evidence.md", media_type: "text/markdown", size_bytes: evidenceBytes.byteLength,
      sha256: digestBytes(evidenceBytes), content_base64: evidenceBytes.toString("base64"),
    }, profile.execution.max_output_bytes);
    return buildOutput({
      ...context,
      productResult: passed ? "PASS" : "FAIL",
      environmentStatus: receipt.environment_status === "READY" ? "HEALTHY" : "NOT_REQUIRED",
      evidenceStatus: "VERIFIED",
      confidence: 1,
      code: declaredOutcomeCode(context, passed ? "pass" : "fail", passed ? "COMMAND_PASSED" : "COMMAND_FAILED"),
      observations,
      evidenceKinds: plan.expected_evidence.code,
      candidates: [candidate],
    });
  }
  if (execution.exitCode !== 0) return infraOutput(context, "ADAPTER_EXIT_FAILURE");
  try {
    const parsed = JSON.parse(execution.stdout);
    if (canonicalJson(parsed) !== execution.stdout) throw new Error("adapter stdout must be exact canonical bytes");
    const adapter = validateAdapterResult(parsed, branch, plan.expected_evidence[branch], profile.execution.max_output_bytes, profile);
    return buildOutput({ ...context, productResult: adapter.product_result, environmentStatus: adapter.environment_status, evidenceStatus: adapter.evidence_status, confidence: adapter.confidence, code: adapter.code, observations: adapter.observations, evidenceKinds: adapter.evidence_kinds, candidates: adapter.candidates });
  } catch { return infraOutput(context, "INVALID_ADAPTER_OUTPUT"); }
}
