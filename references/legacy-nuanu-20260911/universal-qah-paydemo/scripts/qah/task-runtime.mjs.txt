#!/usr/bin/env node

import { execFile as execFileCallback } from "node:child_process";
import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { aggregateEvidence, resolveArtifactVersionForSlot, resolveCommitProfile, resolvePlatformEntityVersion } from "./aggregate.mjs";
import { canonicalJson, sha256 } from "./canonical.mjs";
import {
  buildFinalizationFlowStepResult,
  encodeFinalizationWorkerTransport,
  materializeFinalizationWorkerTransport,
} from "./claim-adapter.mjs";
import { resolveContext } from "./context.mjs";
import { decideRelease } from "./decide.mjs";
import { cleanupEnvironment, prepareEnvironment } from "./environment.mjs";
import { finalizeTransitionAdmission } from "./finalize.mjs";
import { planQaScope } from "./plan.mjs";
import { parseProfileBytes } from "./profile.mjs";
import { publishComment, COMMENT_LIST_MAX_BYTES, COMMENT_LIST_MAX_COMMENTS } from "./render-comment.mjs";
import { runBranch, runtimeEnvironmentForBranch } from "./run-branch.mjs";

export { materializeFinalizationWorkerTransport, runtimeEnvironmentForBranch };

const execFile = promisify(execFileCallback);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ARTIFACT_REF_KEYS = ["artifact_id", "version_id", "kind", "role"];
const BUNDLE_KEYS = ["schema_version", "artifact_versions", "platform_entity_versions", "commit_profiles", "comment_reads", "branch_execution"];
const MAX_INPUT_BYTES = 1024 * 1024;
const TASK_KEYS = Object.freeze({
  "resolve-flow-item": "resolve_flow_item",
  "load-project-context": "load_project_context",
  "plan-qa-scope": "plan_qa_scope",
  "prepare-environment": "prepare_environment",
  "verify-requirements-and-code": "verify_requirements_and_code",
  "verify-api-contracts": "verify_api_contracts",
  "verify-ui-with-playwright": "verify_ui_with_playwright",
  "prepare-and-verify-domain-data": "prepare_and_verify_domain_data",
  "aggregate-evidence": "aggregate_evidence",
  "independent-release-decision": "independent_release_decision",
  "publish-flow-item-comment": "publish_flow_item_comment",
  "cleanup-environment": "cleanup_environment",
  "finalize-transition": "finalize_transition",
});
export const TASK_COMMAND_KEYS = TASK_KEYS;
export const GRAPH_TASK_COMMANDS = Object.freeze(Object.keys(TASK_KEYS));
export const TASK_PROTOCOLS = Object.freeze(Object.fromEntries(Object.values(TASK_KEYS).map((taskKey) => [taskKey, Object.freeze({
  artifact_slots: Object.freeze(({
    resolve_flow_item: ["resolved_item"], load_project_context: ["resolved_context"], plan_qa_scope: ["test_plan"],
    prepare_environment: ["environment_manifest"], verify_requirements_and_code: ["branch_payload"], verify_api_contracts: ["branch_payload"],
    verify_ui_with_playwright: ["branch_payload"], prepare_and_verify_domain_data: ["branch_payload"], aggregate_evidence: ["aggregate_report"],
    independent_release_decision: [], publish_flow_item_comment: ["comment_receipt_report"], cleanup_environment: ["cleanup_receipt_report"],
    finalize_transition: ["finalization_report"],
  })[taskKey]),
})])));

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exact(value, keys, label) {
  if (!isObject(value) || canonicalJson(Object.keys(value).sort()) !== canonicalJson([...keys].sort())) throw new Error(`${label} must have exact keys`);
  return value;
}

function uuid(value, label) {
  if (typeof value !== "string" || !UUID.test(value)) throw new Error(`${label} must be a UUID`);
  return value;
}

function artifactRef(value, kind, role, label) {
  exact(value, ARTIFACT_REF_KEYS, label);
  uuid(value.artifact_id, `${label}.artifact_id`);
  uuid(value.version_id, `${label}.version_id`);
  if (value.kind !== kind || value.role !== role) throw new Error(`${label} kind or role is invalid`);
  return { ...value };
}

function outputDirectory(value) {
  if (typeof value !== "string" || !isAbsolute(value) || resolve(value) === resolve("/")) throw new Error("outputDir must be an absolute task directory");
  return resolve(value);
}

async function verifiedOutputDirectory(value, taskRoot) {
  if (typeof taskRoot !== "string" || !isAbsolute(taskRoot)) throw new Error("NUANU_TASK_DIR must be an absolute real directory");
  const rootMetadata = await lstat(taskRoot).catch(() => null);
  if (!rootMetadata?.isDirectory() || rootMetadata.isSymbolicLink()) throw new Error("NUANU_TASK_DIR must be an absolute real directory");
  const root = await realpath(taskRoot);
  const requested = outputDirectory(value);
  const lexicalParts = relative(resolve(taskRoot), requested).split(sep);
  if (lexicalParts.length !== 2 || lexicalParts[0] !== "qah" || !/^[a-z][a-z0-9-]{1,63}$/.test(lexicalParts[1])) throw new Error("outputDir must be one exact NUANU_TASK_DIR/qah/<step> directory");
  const qah = join(root, "qah");
  const qahMetadata = await lstat(qah).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
  if (qahMetadata === null) await mkdir(qah, { recursive: false, mode: 0o700 });
  else if (!qahMetadata.isDirectory() || qahMetadata.isSymbolicLink()) throw new Error("NUANU_TASK_DIR/qah must be a real directory, not a symlink");
  if (await realpath(qah) !== qah) throw new Error("NUANU_TASK_DIR/qah must stay inside the real task directory");
  const requestedMetadata = await lstat(requested).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
  if (requestedMetadata === null) await mkdir(requested, { recursive: false, mode: 0o700 });
  const outputMetadata = await lstat(requested);
  if (!outputMetadata.isDirectory() || outputMetadata.isSymbolicLink()) throw new Error("outputDir must not be a symlink");
  const actual = await realpath(requested);
  const child = relative(root, actual);
  if (child.split(sep).length !== 2 || !child.startsWith(`qah${sep}`) || child.includes(`${sep}..${sep}`) || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    throw new Error("outputDir must be contained by NUANU_TASK_DIR/qah");
  }
  return actual;
}

async function writeCanonical(directory, name, value) {
  const root = outputDirectory(directory);
  const metadata = await lstat(root);
  if (!metadata.isDirectory() || metadata.isSymbolicLink() || await realpath(root) !== root) throw new Error("canonical output directory must remain a real directory");
  const bytes = canonicalJson(value);
  await writeFile(join(root, name), bytes, { mode: 0o600, flag: "w" });
  return {
    name,
    size_bytes: Buffer.byteLength(bytes, "utf8"),
    sha256: sha256(bytes),
  };
}

function candidateManifest(taskKey, files) {
  return { schema_version: "nuanu.qa-task-artifact-candidates.v1", task_key: taskKey, files };
}

function completion(taskKey, description, data = {}) {
  return { item: { key: taskKey, description, data, artifacts: {} }, artifact_outputs: {} };
}

async function writeCompletionState(outputDir, taskKey, data, auxiliarySlots = []) {
  await writeCanonical(outputDir, ".completion-state.json", {
    schema_version: "nuanu.qa-task-completion-state.v1",
    task_key: taskKey,
    data,
    artifact_slots: [...TASK_PROTOCOLS[taskKey].artifact_slots],
    auxiliary_slots: auxiliarySlots,
  });
}

async function completePreparedTask(taskKey, input, outputDir) {
  exact(input, ["phase", "artifact_refs"], `${taskKey} completion input`);
  if (input.phase !== "complete") throw new Error(`${taskKey} phase must be complete`);
  const state = await readCanonicalInputFile(join(outputDir, ".completion-state.json"));
  exact(state, ["schema_version", "task_key", "data", "artifact_slots", "auxiliary_slots"], `${taskKey} completion state`);
  if (state.schema_version !== "nuanu.qa-task-completion-state.v1" || state.task_key !== taskKey
    || canonicalJson(state.artifact_slots) !== canonicalJson(TASK_PROTOCOLS[taskKey].artifact_slots)) throw new Error(`${taskKey} completion state is invalid`);
  exact(input.artifact_refs, [...state.artifact_slots, ...state.auxiliary_slots], `${taskKey} actual artifact refs`);
  const refs = {};
  for (const slot of state.artifact_slots) refs[slot] = artifactRef(input.artifact_refs[slot], "document", "output", `artifact_refs.${slot}`);
  for (const slot of state.auxiliary_slots) refs[slot] = artifactRef(input.artifact_refs[slot], "document", "evidence", `artifact_refs.${slot}`);
  const data = structuredClone(state.data);
  if (refs.review_bundle) data.review_bundle_ref = refs.review_bundle;
  if (data.test_plan_ref === null && refs.test_plan) data.test_plan_ref = refs.test_plan;
  return {
    item: { key: taskKey, description: `${taskKey} completed by deterministic task runtime`, data, artifacts: {} },
    artifact_outputs: Object.fromEntries(state.artifact_slots.map((slot) => [`item.artifacts.${slot}`, refs[slot]])),
  };
}

async function completeFinalizationTask(input, dependencies) {
  exact(input, ["phase", "artifact_refs", "finalization_input"], "finalize_transition completion input");
  if (input.phase !== "complete") throw new Error("finalize_transition phase must be complete");
  exact(input.artifact_refs, ["finalization_report"], "finalize_transition actual artifact refs");
  const finalizationReport = artifactRef(input.artifact_refs.finalization_report, "document", "output", "artifact_refs.finalization_report");
  const admitted = await finalizeTransitionAdmission(input.finalization_input, dependencies);
  if (admitted.report.transition_allowed !== true || !admitted.aggregate || !admitted.decision) {
    throw new Error(`finalization blocked: ${admitted.report.reason_codes.join(",")}`);
  }
  const flowStepResult = await buildFinalizationFlowStepResult({
    workspace_id: input.finalization_input.workspace_id,
    finalization_report: finalizationReport,
    expected_report: admitted.report,
    aggregate: admitted.aggregate,
    decision: admitted.decision,
  }, dependencies);
  return encodeFinalizationWorkerTransport(flowStepResult);
}

function prepareInput(input, keys, label) {
  exact(input, ["phase", ...keys], label);
  if (input.phase !== "prepare") throw new Error(`${label} phase must be prepare or complete`);
  return input;
}

function branchOutputFromPayload(payload) {
  exact(payload, ["schema_version", "branch_result", "execution_data"], "branch payload");
  if (payload.schema_version !== "nuanu.qa-materialized-branch-payload.v1") throw new Error("branch payload schema is invalid");
  return {
    branch_result: payload.branch_result,
    envelope: {
      item: { key: `verify_${payload.branch_result.branch}`, description: `${payload.branch_result.branch} QA materialization`, data: payload.execution_data, artifacts: {} },
      artifact_outputs: { "item.artifacts.evidence_report": null },
    },
  };
}

async function prepareBranchCandidates(taskKey, output, plan, outputDir) {
  const branch = output.branch_result.branch;
  const candidate = JSON.parse(output.envelope.item.data.evidence_candidate);
  const payload = { schema_version: "nuanu.qa-materialized-branch-payload.v1", branch_result: output.branch_result, execution_data: output.envelope.item.data };
  const payloadFile = await writeCanonical(outputDir, "branch-payload.json", payload);
  const evidence = {
    schema_version: "nuanu.qa-materialized-evidence.v1",
    source_artifact: { ...plan.source_artifact },
    plan_sha256: plan.plan_sha256,
    branch,
    branch_payload_sha256: payloadFile.sha256,
    evidence_sha256: output.envelope.item.data.evidence_sha256,
    evidence_candidate: candidate,
    confirmed_findings: output.branch_result.product_result === "FAIL" ? 1 : 0,
  };
  const evidenceFile = await writeCanonical(outputDir, "evidence.json", evidence);
  return candidateManifest(taskKey, [
    { ...payloadFile, slot: "branch_payload", kind: "document", role: "output", media_type: "application/json" },
    { ...evidenceFile, slot: "evidence", kind: "document", role: "evidence", media_type: "application/json" },
  ]);
}

async function linkBranchOccurrence(taskKey, input, outputDir) {
  exact(input, ["phase", "primary_refs", "occurrence_context"], "branch link input");
  exact(input.primary_refs, ["branch_payload", "evidence"], "primary refs");
  const payloadRef = artifactRef(input.primary_refs.branch_payload, "document", "output", "primary_refs.branch_payload");
  const evidenceRef = artifactRef(input.primary_refs.evidence, "document", "evidence", "primary_refs.evidence");
  exact(input.occurrence_context, ["repository_origin", "content_hash", "environment_id", "instance_nonce"], "occurrence context");
  const payload = await readCanonicalInputFile(join(outputDirectory(outputDir), "branch-payload.json"));
  const evidence = await readCanonicalInputFile(join(outputDirectory(outputDir), "evidence.json"));
  const output = branchOutputFromPayload(payload);
  if (evidence.branch !== output.branch_result.branch || evidence.branch_payload_sha256 !== sha256(canonicalJson(payload))
    || evidence.evidence_sha256 !== output.envelope.item.data.evidence_sha256) throw new Error("branch primary material cross-link is invalid");
  let repository;
  try { repository = new URL(input.occurrence_context.repository_origin); } catch { repository = null; }
  if (repository?.protocol !== "https:" || repository.username || repository.password || repository.search || repository.hash
    || repository.href !== input.occurrence_context.repository_origin || !/^sha256:[a-f0-9]{64}$/.test(input.occurrence_context.content_hash)
    || typeof input.occurrence_context.environment_id !== "string") throw new Error("occurrence context is invalid");
  const unsigned = {
    schema_version: "nuanu.qa-evidence-occurrence.v1",
    source_artifact: evidence.source_artifact,
    plan_sha256: evidence.plan_sha256,
    branch: output.branch_result.branch,
    repository_origin: input.occurrence_context.repository_origin,
    commit: output.branch_result.commit,
    content_hash: input.occurrence_context.content_hash,
    environment_id: input.occurrence_context.environment_id,
    instance_nonce: input.occurrence_context.instance_nonce,
    run_id: output.envelope.item.data.run_id,
    attempt_id: output.envelope.item.data.attempt_id,
    branch_payload_artifact: payloadRef,
    evidence_artifact: evidenceRef,
  };
  const file = await writeCanonical(outputDir, "occurrence.json", { ...unsigned, occurrence_key: sha256(unsigned) });
  return candidateManifest(taskKey, [{ ...file, slot: "occurrence", kind: "document", role: "evidence", media_type: "application/json" }]);
}

async function completeBranchTask(taskKey, input, outputDir) {
  exact(input, ["phase", "material_refs", "completion_context"], "branch completion input");
  exact(input.material_refs, ["branch_payload", "occurrence", "evidence"], "material refs");
  const refs = {
    branch_payload: artifactRef(input.material_refs.branch_payload, "document", "output", "material_refs.branch_payload"),
    occurrence: artifactRef(input.material_refs.occurrence, "document", "evidence", "material_refs.occurrence"),
    evidence: artifactRef(input.material_refs.evidence, "document", "evidence", "material_refs.evidence"),
  };
  const contextKeys = ["source_ref", "profile_ref", "test_plan_ref", "environment_receipt", "workspace_id", "project_id", "issue_id", "run_id", "attempt_id"];
  exact(input.completion_context, contextKeys, "branch completion context");
  for (const key of ["workspace_id", "project_id", "issue_id", "run_id", "attempt_id"]) uuid(input.completion_context[key], `completion_context.${key}`);
  const payload = await readCanonicalInputFile(join(outputDirectory(outputDir), "branch-payload.json"));
  const evidence = await readCanonicalInputFile(join(outputDirectory(outputDir), "evidence.json"));
  const occurrence = await readCanonicalInputFile(join(outputDirectory(outputDir), "occurrence.json"));
  const { occurrence_key: claimed, ...unsigned } = occurrence;
  if (claimed !== sha256(unsigned) || canonicalJson(occurrence.branch_payload_artifact) !== canonicalJson(refs.branch_payload)
    || canonicalJson(occurrence.evidence_artifact) !== canonicalJson(refs.evidence)
    || evidence.branch_payload_sha256 !== sha256(canonicalJson(payload))) throw new Error("branch material completion cross-link is invalid");
  const pending = branchOutputFromPayload(payload);
  pending.envelope.item.artifacts = { evidence_report: refs.evidence };
  pending.envelope.artifact_outputs = { "item.artifacts.evidence_report": refs.evidence };
  return {
    item: {
      key: taskKey,
      description: `${payload.branch_result.branch} QA materialized`,
      data: { branch_result: payload.branch_result, envelope: pending.envelope, material_refs: refs, ...input.completion_context },
      artifacts: {},
    },
    artifact_outputs: { "item.artifacts.branch_payload": refs.branch_payload },
  };
}

export async function readCanonicalInputFile(path, maximumBytes = MAX_INPUT_BYTES) {
  if (typeof path !== "string" || !Number.isSafeInteger(maximumBytes) || maximumBytes < 2 || maximumBytes > MAX_INPUT_BYTES) throw new Error("input file bound is invalid");
  const metadata = await lstat(path);
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size < 2 || metadata.size > maximumBytes) throw new Error("input file is empty or exceeds its bound");
  const source = await readFile(path, "utf8");
  if (Buffer.byteLength(source, "utf8") !== metadata.size || Buffer.byteLength(source, "utf8") > maximumBytes) throw new Error("input file changed or exceeds its bound");
  let value;
  try { value = JSON.parse(source); } catch { throw new Error("input file is invalid JSON"); }
  if (canonicalJson(value) !== source) throw new Error("input file must contain exact canonical JSON bytes");
  return value;
}

export function normalizeRawIssueComments(raw, identity, limits = {}) {
  exact(identity, ["workspace_id", "project_id", "issue_id"], "comment identity");
  for (const [key, value] of Object.entries(identity)) uuid(value, `comment identity.${key}`);
  const maximumBytes = limits.max_bytes ?? COMMENT_LIST_MAX_BYTES;
  const maximumComments = limits.max_comments ?? COMMENT_LIST_MAX_COMMENTS;
  if (maximumBytes !== COMMENT_LIST_MAX_BYTES || maximumComments !== COMMENT_LIST_MAX_COMMENTS) throw new Error("comment pilot limits are fixed");
  if (!Array.isArray(raw) || raw.length > maximumComments) throw new Error("comment count exceeds pilot limit");
  const rawBytes = Buffer.byteLength(canonicalJson(raw), "utf8");
  if (rawBytes > maximumBytes) throw new Error("raw comment response exceeds post-fetch byte limit");
  const comments = raw.map((comment) => {
    if (!isObject(comment) || !Object.hasOwn(comment, "id") || !Object.hasOwn(comment, "comment_html")) throw new Error("raw comment must have own id and comment_html fields");
    uuid(comment.id, "raw comment.id");
    if (typeof comment.comment_html !== "string" || comment.comment_html.includes("\0") || Buffer.byteLength(comment.comment_html, "utf8") > 8192) throw new Error("raw comment body is invalid");
    return { comment_id: comment.id, ...identity, comment_html: comment.comment_html };
  });
  const observedBytes = Buffer.byteLength(canonicalJson(comments), "utf8");
  if (observedBytes > maximumBytes) throw new Error("normalized comments exceed post-fetch byte limit");
  return {
    comments,
    source_operation: "get_issue_comments",
    complete: true,
    total_count: comments.length,
    truncated: false,
    enforced_max_bytes: maximumBytes,
    enforced_max_comments: maximumComments,
    observed_bytes: observedBytes,
  };
}

function decodedBytes(value, label) {
  if (typeof value !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error(`${label} must be canonical base64`);
  const bytes = Buffer.from(value, "base64");
  if (bytes.toString("base64") !== value) throw new Error(`${label} must be canonical base64`);
  return bytes;
}

function entriesMap(entries, label) {
  if (!Array.isArray(entries) || entries.length > 128) throw new Error(`${label} must be a bounded array`);
  const map = new Map();
  for (const entry of entries) {
    exact(entry, ["key", "response"], `${label} entry`);
    if (typeof entry.key !== "string" || entry.key.length < 3 || entry.key.length > 256 || map.has(entry.key)) throw new Error(`${label} key is invalid or duplicate`);
    map.set(entry.key, structuredClone(entry.response));
  }
  return map;
}

export function createResolverAdapters(bundle) {
  exact(bundle, BUNDLE_KEYS, "resolver bundle");
  if (bundle.schema_version !== "nuanu.qa-runtime-resolver-bundle.v1") throw new Error("resolver bundle schema is invalid");
  const artifactVersions = entriesMap(bundle.artifact_versions, "artifact_versions");
  const platformVersions = entriesMap(bundle.platform_entity_versions, "platform_entity_versions");
  const commitProfiles = entriesMap(bundle.commit_profiles, "commit_profiles");
  if (!Array.isArray(bundle.comment_reads) || bundle.comment_reads.length > 4) throw new Error("comment_reads must be a bounded array");
  const commentReads = bundle.comment_reads.map((entry) => {
    exact(entry, ["attestation"], "comment read");
    exact(entry.attestation, ["comments", "source_operation", "complete", "total_count", "truncated", "enforced_max_bytes", "enforced_max_comments", "observed_bytes"], "comment attestation");
    if (!Array.isArray(entry.attestation.comments)) throw new Error("comment attestation comments must be an array");
    return structuredClone(entry.attestation);
  });
  if (bundle.branch_execution !== null) exact(bundle.branch_execution, ["checkout", "result"], "branch_execution");
  let commentIndex = 0;
  return {
    resolveArtifactVersion: async ({ workspace_id, ref, max_bytes }) => {
      const response = artifactVersions.get(`${ref.artifact_id}@${ref.version_id}`);
      if (!response) return null;
      const bytes = decodedBytes(response.bytes_base64, "artifact bytes");
      const normalized = { ...response, enforced_max_bytes: max_bytes, bytes };
      delete normalized.bytes_base64;
      if (normalized.workspace_id !== workspace_id || !Number.isSafeInteger(max_bytes) || bytes.byteLength > max_bytes) return null;
      return normalized;
    },
    resolvePlatformEntityVersion: async ({ workspace_id, ref, max_bytes }) => {
      const response = platformVersions.get(`${ref.artifact_id}@${ref.version_id}`);
      if (!response || response.workspace_id !== workspace_id || response.observed_bytes > max_bytes) return null;
      return structuredClone({ ...response, enforced_max_bytes: max_bytes });
    },
    resolveProfileAtCommit: async ({ repository_origin, commit, path, max_bytes }) => {
      const response = commitProfiles.get(`${repository_origin}@${commit}:${path}`);
      if (!response) return null;
      const bytes = decodedBytes(response.bytes_base64, "commit profile bytes");
      const normalized = { ...response, enforced_max_bytes: max_bytes, bytes };
      delete normalized.bytes_base64;
      if (bytes.byteLength > max_bytes) return null;
      return normalized;
    },
    listIssueComments: async (request) => {
      if (commentIndex >= commentReads.length) throw new Error("resolver bundle has no exact comment read for this call");
      const attestation = commentReads[commentIndex++];
      if (attestation.source_operation !== "get_issue_comments" || attestation.complete !== true || attestation.truncated !== false
        || attestation.enforced_max_bytes !== request.max_bytes || attestation.enforced_max_comments !== request.max_comments
        || attestation.total_count !== attestation.comments.length || attestation.total_count > request.max_comments
        || attestation.observed_bytes !== Buffer.byteLength(canonicalJson(attestation.comments), "utf8") || attestation.observed_bytes > request.max_bytes) {
        throw new Error("comment attestation is incomplete or outside its post-fetch bound");
      }
      for (const comment of attestation.comments) {
        exact(comment, ["comment_id", "workspace_id", "project_id", "issue_id", "comment_html"], "attested comment");
        uuid(comment.comment_id, "attested comment.comment_id");
        if (comment.workspace_id !== request.workspace_id || comment.project_id !== request.project_id || comment.issue_id !== request.issue_id) throw new Error("comment attestation identity mismatch");
      }
      return structuredClone(attestation);
    },
    addIssueComment: async () => ({ accepted: true }),
    repositoryCheckout: bundle.branch_execution?.checkout,
    verifyEnvironment: bundle.branch_execution === null ? undefined : async ({ receipt }) => ({ receipt, checkout: bundle.branch_execution.checkout }),
    execute: bundle.branch_execution === null ? undefined : async () => structuredClone(bundle.branch_execution.result),
  };
}

async function verifyRepositoryCheckout({ checkout, receipt, plan, profile }) {
  if (typeof checkout !== "string" || !isAbsolute(checkout)) throw new Error("repository checkout must be an absolute path");
  const metadata = await lstat(checkout);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) throw new Error("repository checkout must be a real directory");
  const exactCheckout = await realpath(checkout);
  if (exactCheckout !== resolve(checkout)) throw new Error("repository checkout path must be exact");
  const git = async (args) => {
    const result = await execFile("git", args, {
      cwd: exactCheckout,
      encoding: "utf8",
      env: runtimeEnvironmentForBranch("code", process.env),
      maxBuffer: 65_536,
      timeout: 10_000,
    });
    if (typeof result.stdout !== "string" || typeof result.stderr !== "string" || result.stderr !== "") throw new Error("Git repository verification emitted unexpected output");
    return result.stdout;
  };
  const root = (await git(["rev-parse", "--show-toplevel"])).trimEnd();
  if (!isAbsolute(root) || await realpath(root) !== exactCheckout || root !== exactCheckout) throw new Error("repository checkout must be the exact Git root");
  const head = (await git(["rev-parse", "--verify", "HEAD^{commit}"])).trimEnd();
  if (head !== plan.commit || !/^[a-f0-9]{40}$/.test(head)) throw new Error("repository HEAD does not match the pinned plan commit");
  if ((await git(["status", "--porcelain=v1", "--untracked-files=all"])) !== "") throw new Error("repository checkout must be clean");
  const origins = (await git(["remote", "get-url", "--all", "origin"])).trimEnd().split("\n");
  if (origins.length !== 1 || origins[0] !== profile.repository.allowed_origin) throw new Error("repository origin does not match the pinned profile");
  return {
    receipt,
    checkout: exactCheckout,
    repository_origin: origins[0],
    commit: head,
    source_artifact: plan.source_artifact,
    profile_digest: plan.profile_digest,
  };
}

export async function verifyProfileInstallPrecondition(input, dependencies) {
  exact(input, ["workspace_id", "profile_artifact", "repository_origin", "commit", "profile_digest"], "profile install precondition");
  uuid(input.workspace_id, "workspace_id");
  artifactRef(input.profile_artifact, "document", "implementation", "profile_artifact");
  const context = { workspaceId: input.workspace_id, ...dependencies };
  let artifact; let committed;
  try {
    [artifact, committed] = await Promise.all([
      resolveArtifactVersionForSlot(input.profile_artifact, "profile", context, 262144, false),
      resolveCommitProfile(context, input.repository_origin, input.commit),
    ]);
  } catch (error) {
    throw new Error(`profile install precondition could not verify exact Artifact/Git bytes: ${error?.message ?? "invalid resolver response"}`);
  }
  if (!artifact.bytes.equals(committed.bytes) || `sha256:${artifact.checksum}` !== committed.sha256) throw new Error("profile Artifact bytes do not equal pinned Git bytes");
  const profile = parseProfileBytes(committed.bytes);
  if (sha256(profile) !== input.profile_digest) throw new Error("profile digest does not match exact installed Git bytes");
  return { installed: true, profile_artifact: { ...input.profile_artifact }, profile_digest: input.profile_digest, profile_blob_sha256: committed.sha256, commit: input.commit };
}

function branchName(command) {
  return ({
    "verify-requirements-and-code": "code",
    "verify-api-contracts": "api",
    "verify-ui-with-playwright": "ui",
    "prepare-and-verify-domain-data": "domain",
  })[command];
}

async function writeSingleArtifact(taskKey, outputDir, name, slot, value, extraData = {}) {
  const file = await writeCanonical(outputDir, name, value);
  return candidateManifest(taskKey, [{ ...file, slot, kind: "document", role: "output", media_type: "application/json" }], extraData);
}

export async function runTaskCommand(command, input, options = {}) {
  const outputDir = await verifiedOutputDirectory(options.outputDir, options.taskRoot ?? process.env.NUANU_TASK_DIR);
  if (command === "normalize-comments") {
    exact(input, ["raw_comments", "identity"], "normalize-comments input");
    const attestation = normalizeRawIssueComments(input.raw_comments, input.identity);
    await writeCanonical(outputDir, "comments-attestation.json", attestation);
    return { schema_version: "nuanu.qa-comment-list-attestation.v1", attestation };
  }
  if (!GRAPH_TASK_COMMANDS.includes(command)) throw new Error("unknown task-runtime subcommand");
  const taskKey = TASK_KEYS[command];
  const dependencies = options.dependencies ?? (options.resolverBundle ? createResolverAdapters(options.resolverBundle) : {});

  if (command === "finalize-transition" && input?.phase === "complete") {
    return completeFinalizationTask(input, dependencies);
  }
  if (input?.phase === "complete" && !branchName(command) && TASK_PROTOCOLS[taskKey].artifact_slots.length) {
    return completePreparedTask(taskKey, input, outputDir);
  }

  if (command === "resolve-flow-item") {
    prepareInput(input, ["workspace_id", "project_id", "issue_id", "source_artifact", "profile_artifact"], "resolve-flow-item input");
    artifactRef(input.profile_artifact, "document", "implementation", "profile_artifact");
    const source = await resolvePlatformEntityVersion(input.source_artifact, { workspaceId: input.workspace_id, ...dependencies }, 262144);
    if (source.project_id !== input.project_id || source.work_item_id !== input.issue_id) throw new Error("source Flow item identity mismatch");
    const value = { schema_version: "nuanu.qa-resolved-flow-item.v1", source_ref: input.source_artifact, profile_ref: input.profile_artifact, workspace_id: input.workspace_id, project_id: input.project_id, issue_id: input.issue_id };
    await writeCompletionState(outputDir, taskKey, { source_ref: input.source_artifact, profile_ref: input.profile_artifact, workspace_id: input.workspace_id, project_id: input.project_id, issue_id: input.issue_id });
    return writeSingleArtifact(taskKey, outputDir, "resolve-flow-item.json", "resolved_item", value);
  }
  if (command === "load-project-context") {
    prepareInput(input, ["raw_context", "profile", "profile_install"], "load-project-context input");
    const installed = await verifyProfileInstallPrecondition(input.profile_install, dependencies);
    if (sha256(input.profile) !== input.profile_install.profile_digest) throw new Error("resolved profile does not match the installed Artifact/Git digest");
    const context = resolveContext(input.raw_context, input.profile.repository);
    await writeCompletionState(outputDir, taskKey, {
      source_ref: context.source_artifact, profile_ref: input.profile_install.profile_artifact, workspace_id: input.profile_install.workspace_id,
      project_id: context.project_uuid, issue_id: context.issue_uuid, repository_origin: context.repository_origin, commit: context.commit,
      content_hash: context.content_hash, profile_blob_sha256: installed.profile_blob_sha256, context_sha256: sha256(context),
    });
    return writeSingleArtifact(taskKey, outputDir, "load-project-context.json", "resolved_context", context);
  }
  if (command === "plan-qa-scope") {
    prepareInput(input, "graph_input" in input ? ["context", "profile", "graph_input", "carry"] : ["context", "profile", "carry"], "plan-qa-scope input");
    exact(input.carry, ["profile_ref", "workspace_id"], "plan-qa-scope carry");
    const plan = planQaScope(input.context, input.profile, input.graph_input);
    await writeCompletionState(outputDir, taskKey, {
      source_ref: plan.source_artifact, profile_ref: input.carry.profile_ref, test_plan_ref: null, workspace_id: input.carry.workspace_id,
      project_id: input.context.project_uuid, issue_id: input.context.issue_uuid, repository_origin: input.context.repository_origin,
      commit: plan.commit, content_hash: plan.content_hash, plan_sha256: plan.plan_sha256, applicability: plan.applicability, risk_level: plan.risk_level,
    });
    const manifest = await writeSingleArtifact(taskKey, outputDir, "test-plan.json", "test_plan", plan);
    return manifest;
  }
  if (command === "prepare-environment") {
    prepareInput(input, ["environment_input", "carry"], "prepare-environment input");
    exact(input.carry, ["source_ref", "profile_ref", "test_plan_ref", "workspace_id", "project_id", "issue_id"], "prepare-environment carry");
    const receipt = await prepareEnvironment(input.environment_input);
    await writeCompletionState(outputDir, taskKey, { ...input.carry, run_id: receipt.run_id, attempt_id: receipt.attempt_id, environment_receipt: receipt });
    return writeSingleArtifact(taskKey, outputDir, "environment-manifest.json", "environment_manifest", receipt);
  }
  const branch = branchName(command);
  if (branch) {
    if (input?.phase === "link") return linkBranchOccurrence(taskKey, input, outputDir);
    if (input?.phase === "complete") return completeBranchTask(taskKey, input, outputDir);
    exact(input, ["phase", "branch_input"], "branch execute input");
    if (input.phase !== "prepare") throw new Error("branch phase must be prepare, link, or complete");
    const raw = { ...input.branch_input, branch };
    const repositoryOnly = branch === "code" && raw.profile?.environment?.strategy === "none" && raw.environmentReceipt?.environment_status === "NOT_REQUIRED";
    const branchDependencies = { ...dependencies, verifyEnvironment: dependencies.verifyEnvironment };
    if (repositoryOnly) {
      branchDependencies.verifyRepository = ({ receipt, plan, profile }) => verifyRepositoryCheckout({
        checkout: dependencies.repositoryCheckout,
        receipt,
        plan,
        profile,
      });
    }
    const output = await runBranch({ ...raw, execute: repositoryOnly ? undefined : dependencies.execute, dependencies: branchDependencies });
    return prepareBranchCandidates(taskKey, output, raw.plan, outputDir);
  }
  if (command === "aggregate-evidence") {
    prepareInput(input, ["aggregate_input", "project_id", "issue_id"], "aggregate-evidence input");
    const aggregate = await aggregateEvidence(input.aggregate_input, dependencies);
    const review = { schema_version: "nuanu.qa-review-bundle.v1", workspace_id: input.aggregate_input.workspace_id, project_id: input.project_id, work_item_id: input.issue_id, source_artifact: aggregate.source_artifact, aggregate, stored_decision: null };
    const files = [
      { ...(await writeCanonical(outputDir, "aggregate-report.json", aggregate)), slot: "aggregate_report", kind: "document", role: "output", media_type: "application/json" },
      { ...(await writeCanonical(outputDir, "review-bundle.json", review)), slot: "review_bundle", kind: "document", role: "evidence", media_type: "application/json" },
    ];
    await writeCompletionState(outputDir, taskKey, {
      aggregate, source_ref: aggregate.source_artifact, profile_ref: aggregate.profile_artifact, review_bundle_ref: null,
      workspace_id: aggregate.workspace_id, project_id: input.project_id, issue_id: input.issue_id, run_id: aggregate.run_id, attempt_id: aggregate.attempt_id,
    }, ["review_bundle"]);
    return candidateManifest(taskKey, files);
  }
  if (command === "independent-release-decision") {
    exact(input, ["aggregate", "proposal", "completion_context"], "independent-release-decision input");
    const carryKeys = ["source_ref", "profile_ref", "review_bundle_ref", "cleanup_lease", "workspace_id", "project_id", "issue_id"];
    exact(input.completion_context, carryKeys, "decision completion context");
    for (const key of ["workspace_id", "project_id", "issue_id"]) uuid(input.completion_context[key], `decision completion context.${key}`);
    const decision = await decideRelease(input.aggregate, input.proposal, dependencies);
    return completion(taskKey, `release decision: ${decision.route}`, { decision, ...input.completion_context });
  }
  if (command === "publish-flow-item-comment") {
    prepareInput(input, ["publication_input", "completion_context"], "publish-flow-item-comment input");
    exact(input.completion_context, ["decision", "cleanup_lease", "profile_ref"], "publish-flow-item-comment completion context");
    const receipt = await publishComment(input.publication_input, dependencies);
    await writeCompletionState(outputDir, taskKey, {
      comment_receipt: receipt, decision: input.completion_context.decision, cleanup_lease: input.completion_context.cleanup_lease,
      source_ref: input.publication_input.source_artifact, profile_ref: input.completion_context.profile_ref, review_bundle_ref: input.publication_input.review_bundle,
      workspace_id: input.publication_input.workspace_id, project_id: input.publication_input.project_id, issue_id: input.publication_input.issue_id,
    });
    return writeSingleArtifact(taskKey, outputDir, "comment-receipt.json", "comment_receipt_report", receipt);
  }
  if (command === "cleanup-environment") {
    prepareInput(input, ["environment_input", "completion_context"], "cleanup-environment input");
    exact(input.completion_context, ["source_ref", "review_bundle_ref"], "cleanup-environment completion context");
    const receipt = await cleanupEnvironment(input.environment_input);
    await writeCompletionState(outputDir, taskKey, { cleanup_receipt: receipt, ...input.completion_context });
    return writeSingleArtifact(taskKey, outputDir, "cleanup-receipt.json", "cleanup_receipt_report", receipt);
  }
  if (command === "finalize-transition") {
    prepareInput(input, ["finalization_input"], "finalize-transition input");
    const admitted = await finalizeTransitionAdmission(input.finalization_input, dependencies);
    if (admitted.report.transition_allowed !== true) throw new Error(`finalization blocked: ${admitted.report.reason_codes.join(",")}`);
    await writeCompletionState(outputDir, taskKey, {
      transition_allowed: admitted.report.transition_allowed,
      target_state: admitted.report.target_state,
      reason_codes: admitted.report.reason_codes,
      kind: admitted.report.kind,
      verdict: admitted.report.verdict,
      tested_head_sha: admitted.report.tested_head_sha,
      checks: admitted.report.checks,
    });
    return writeSingleArtifact(taskKey, outputDir, "finalization.json", "finalization_report", admitted.report);
  }
  throw new Error("unreachable task-runtime command");
}

function parseArgs(argv) {
  if (argv.length < 5 || !GRAPH_TASK_COMMANDS.includes(argv[0]) && argv[0] !== "normalize-comments") throw new Error("usage: task-runtime.mjs <subcommand> --input FILE --output-dir DIR [--resolver-bundle FILE]");
  const result = { command: argv[0] };
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index]; const value = argv[index + 1];
    if (!value || !["--input", "--output-dir", "--resolver-bundle"].includes(flag) || result[flag]) throw new Error("task-runtime arguments are invalid");
    result[flag] = value;
  }
  if (!result["--input"] || !result["--output-dir"]) throw new Error("task-runtime requires input and output directory");
  return result;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = await readCanonicalInputFile(args["--input"]);
  const resolverBundle = args["--resolver-bundle"] ? await readCanonicalInputFile(args["--resolver-bundle"]) : undefined;
  const output = await runTaskCommand(args.command, input, { outputDir: args["--output-dir"], resolverBundle, taskRoot: process.env.NUANU_TASK_DIR });
  process.stdout.write(canonicalJson(output));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2; });
