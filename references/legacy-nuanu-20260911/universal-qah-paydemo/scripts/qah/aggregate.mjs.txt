import { createHash } from "node:crypto";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { canonicalJson, sha256 } from "./canonical.mjs";
import { BRANCHES, validateBranchResult, validateOutcomeCode, validateTestPlan } from "./contracts.mjs";
import { parseProfileBytes } from "./profile.mjs";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const NONCE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const NAMESPACE = /^[a-f0-9]{64}$/;
const CODE = /^[A-Z][A-Z0-9_]{0,63}$/;
const EVIDENCE_KIND = /^[a-z][a-z0-9-]{0,63}$/;
const CHECKSUM = /^[a-f0-9]{64}$/;
const FIXED_ARTIFACT_LIMIT = 256 * 1024;
const MAX_BRANCH_INPUTS = 8;
const MAX_OBSERVATIONS = 64;
const MAX_CANDIDATES = 8;
const MAX_EVIDENCE_KINDS = 16;

const INPUT_KEYS = ["workspace_id", "plan", "plan_artifact", "profile_artifact", "branches", "environment_receipt", "repository_origin", "run_id", "attempt_id"];
const PLAN_KEYS = ["schema_version", "project_key", "commit", "profile_digest", "branches", "source_artifact", "content_hash", "applicability", "branch_reasons", "expected_evidence", "risk_level", "artifact_slot", "plan_sha256"];
const GRAPH_PLAN_KEYS = [...PLAN_KEYS, "graph_binding"];
const EXECUTION_KEYS = ["schema_version", "run_id", "attempt_id", "attempt_namespace", "branch_namespace", "environment_status", "confidence", "code", "evidence_sha256", "evidence_candidate"];
const READY_RECEIPT_KEYS = ["environment_status", "run_id", "attempt_id", "environment_id", "target_namespace", "repository_origin", "commit", "content_hash", "instance_nonce", "base_url", "pid_file", "state_file"];
const NOT_REQUIRED_RECEIPT_KEYS = ["environment_status", "run_id", "attempt_id", "environment_id", "target_namespace"];
const FAILURE_RECEIPT_KEYS = [...NOT_REQUIRED_RECEIPT_KEYS, "reason"];
const ARTIFACT_REF_KEYS = ["artifact_id", "version_id", "kind", "role"];
const RESOLVED_ARTIFACT_KEYS = ["workspace_id", "enforced_max_bytes", "byte_length", "links", "artifact", "bytes"];
const RESOLVED_ARTIFACT_META_KEYS = ["id", "workspace_id", "status", "current_version", "kind", "name", "mime_type", "versions"];
const RESOLVED_VERSION_KEYS = ["id", "version", "file_asset", "size", "checksum"];
const PLATFORM_RESULT_KEYS = ["workspace_id", "enforced_max_bytes", "observed_bytes", "artifact"];
const PLATFORM_ARTIFACT_KEYS = ["id", "workspace_id", "status", "current_version", "kind", "name", "mime_type", "metadata", "links", "versions"];
const PLATFORM_METADATA_KEYS = ["project_id", "work_item_id"];
const PLATFORM_VERSION_KEYS = ["id", "version", "file_asset", "representation"];
const PLATFORM_REPRESENTATION_KEYS = ["type", "entityType", "entityId", "snapshot"];
const PLATFORM_SNAPSHOT_KEYS = ["id", "project_id"];
const ARTIFACT_LINK_KEYS = ["entity_type", "entity_id", "relation"];
const ARTIFACT_LINK_TYPES = new Set(["project", "work_item", "process_run"]);
const ARTIFACT_LINK_RELATIONS = new Set(["about", "source", "output", "attachment"]);
const COMMIT_PROFILE_KEYS = ["repository_origin", "commit", "path", "byte_length", "enforced_max_bytes", "sha256", "bytes"];
const ARTIFACT_ROLES = ["branch_payload", "occurrence", "evidence"];
const CANDIDATE_KEYS = ["schema_version", "run_id", "attempt_id", "attempt_namespace", "branch_namespace", "branch", "environment_identity", "product_result", "environment_status", "evidence_status", "confidence", "code", "evidence_kinds", "observations", "candidates"];
const ENVIRONMENT_IDENTITY_KEYS = ["environment_id", "target_namespace", "repository_origin", "commit", "content_hash", "instance_nonce", "base_url"];
const SYSTEM_ROLES = new Set(["output", "implementation", "evidence", "source"]);
const PROFILE_PATH = "qa-harness.yaml";
export const ARTIFACT_SLOT_POLICY = Object.freeze({
  source_flow_item: Object.freeze({ kind: "flow_item", role: "source", media_type: "application/vnd.nuanu.flow-item+json" }),
  plan: Object.freeze({ kind: "document", role: "output", name: "test-plan.json", media_type: "application/json" }),
  profile: Object.freeze({ kind: "document", role: "implementation", name: PROFILE_PATH, media_type: "application/yaml" }),
  branch_payload: Object.freeze({ kind: "document", role: "output", name: "branch-payload.json", media_type: "application/json" }),
  occurrence: Object.freeze({ kind: "document", role: "evidence", name: "occurrence.json", media_type: "application/json" }),
  evidence: Object.freeze({ kind: "document", role: "evidence", name: "evidence.json", media_type: "application/json" }),
  review_bundle: Object.freeze({ kind: "document", role: "evidence", name: "review-bundle.json", media_type: "application/json" }),
  finalization_report: Object.freeze({
    kind: "document",
    role: "output",
    name: "finalization.json",
    media_type: "application/json",
  }),
});

class PolicyError extends Error {
  constructor(code) { super(code); this.code = code; }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return isObject(value) && canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort());
}

function same(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}

function digestBytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function reference(value) {
  return exactKeys(value, ARTIFACT_REF_KEYS)
    && UUID.test(value.artifact_id) && UUID.test(value.version_id)
    && ["document", "flow_item"].includes(value.kind) && SYSTEM_ROLES.has(value.role)
    ? { ...value }
    : null;
}

function slotReference(value, slot) {
  const ref = reference(value);
  const policy = ARTIFACT_SLOT_POLICY[slot];
  return ref && policy && ref.kind === policy.kind && ref.role === policy.role ? ref : null;
}

function trustedLink(artifact) {
  return artifact ? { ...artifact.reference } : null;
}

function sourceReference(value) {
  return slotReference(value, "source_flow_item");
}

function exactHttps(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.hash && parsed.href === value;
  } catch { return false; }
}

function exactHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password && !parsed.hash;
  } catch { return false; }
}

function exactOrigin(value) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password && !parsed.search && !parsed.hash && value === parsed.origin;
  } catch { return false; }
}

function invalidBranch(branch, reason = "INVALID_BRANCH_RECORD") {
  return { branch, validity: "INVALID", applicability: null, product_result: null, environment_status: null, evidence_status: null, confidence: null, code: null, confirmed_findings: null, identity: null, artifacts: null, reason_codes: [reason] };
}

function finalizeAggregate(fields, reasonSet) {
  const reasonCodes = [...reasonSet].sort();
  const branches = Array.isArray(fields.branches) && fields.branches.length === 4 ? fields.branches : BRANCHES.map((branch) => invalidBranch(branch));
  const unsigned = {
    schema_version: "nuanu.qa-evidence-aggregate.v1",
    workspace_id: fields.workspace_id ?? null,
    source_artifact: fields.source_artifact ?? null,
    plan_artifact: fields.plan_artifact ?? null,
    profile_artifact: fields.profile_artifact ?? null,
    plan_binding: fields.plan_binding ?? null,
    profile_binding: fields.profile_binding ?? null,
    plan_sha256: fields.plan_sha256 ?? null,
    profile_blob_sha256: fields.profile_blob_sha256 ?? null,
    profile_digest: fields.profile_digest ?? null,
    project_key: fields.project_key ?? null,
    repository_origin: fields.repository_origin ?? null,
    commit: fields.commit ?? null,
    content_hash: fields.content_hash ?? null,
    environment_id: fields.environment_id ?? null,
    target_namespace: fields.target_namespace ?? null,
    instance_nonce: fields.instance_nonce ?? null,
    base_url: fields.base_url ?? null,
    run_id: fields.run_id ?? null,
    attempt_id: fields.attempt_id ?? null,
    confidence_threshold: fields.confidence_threshold ?? null,
    max_evidence_bytes: fields.max_evidence_bytes ?? null,
    environment_status: fields.environment_status ?? null,
    expected_branches: [...BRANCHES],
    branches,
    invariants_passed: reasonCodes.length === 0 && branches.every(({ validity }) => validity === "VALID"),
    reason_codes: reasonCodes,
  };
  return { ...unsigned, aggregate_sha256: sha256(unsigned) };
}

function failureAggregate(code = "INVALID_AGGREGATE_INPUT") {
  return finalizeAggregate({}, new Set([code]));
}

/**
 * resolveArtifactVersion is the bounded adapter for Nuanu get_artifact plus
 * exact-version download. It receives { workspace_id, ref, max_bytes }, must
 * apply max_bytes before downloading, and returns a normalized get_artifact
 * readback whose artifact.versions is the API's immutable version collection.
 * Artifact roles are not API metadata: the four-field ref is checked against
 * ARTIFACT_SLOT_POLICY before this trusted readback is requested.
 */
export async function resolveArtifactVersionForSlot(refValue, slot, context, maximumBytes, parseJson = true) {
  const ref = slotReference(refValue, slot);
  if (!ref) throw new PolicyError("INVALID_ARTIFACT_REFERENCE");
  let result;
  const request = { workspace_id: context.workspaceId, ref, max_bytes: maximumBytes };
  try { result = await context.resolveArtifactVersion(request); } catch { throw new PolicyError("INVALID_TRUSTED_ARTIFACT"); }
  if (!exactKeys(result, RESOLVED_ARTIFACT_KEYS)) throw new PolicyError("INVALID_TRUSTED_ARTIFACT");
  if (result.enforced_max_bytes !== maximumBytes) throw new PolicyError("UNATTESTED_ARTIFACT_BOUND");
  if (!exactKeys(result.artifact, RESOLVED_ARTIFACT_META_KEYS) || !Array.isArray(result.artifact.versions) || result.artifact.versions.length < 1 || result.artifact.versions.length > 64) throw new PolicyError("INVALID_TRUSTED_ARTIFACT");
  if (!Array.isArray(result.links) || result.links.length > 64 || result.links.some((link) => !exactKeys(link, ARTIFACT_LINK_KEYS)
    || !ARTIFACT_LINK_TYPES.has(link.entity_type) || !UUID.test(link.entity_id) || !ARTIFACT_LINK_RELATIONS.has(link.relation))) {
    throw new PolicyError("INVALID_TRUSTED_ARTIFACT");
  }
  const version = result.artifact.versions.find((candidate) => candidate?.id === ref.version_id);
  if (!exactKeys(version, RESOLVED_VERSION_KEYS)) throw new PolicyError("INVALID_TRUSTED_ARTIFACT");
  const policy = ARTIFACT_SLOT_POLICY[slot];
  if (result.workspace_id !== context.workspaceId
    || result.artifact.workspace_id !== context.workspaceId || result.artifact.id !== ref.artifact_id
    || result.artifact.status !== "stored" || !UUID.test(result.artifact.current_version)
    || result.artifact.kind !== policy.kind || result.artifact.name !== policy.name || result.artifact.mime_type !== policy.media_type
    || !Number.isSafeInteger(version.version) || version.version < 1
    || !UUID.test(version.file_asset) || !CHECKSUM.test(version.checksum)) throw new PolicyError("INVALID_TRUSTED_ARTIFACT");
  if (!(Buffer.isBuffer(result.bytes) || result.bytes instanceof Uint8Array)) throw new PolicyError("INVALID_TRUSTED_ARTIFACT");
  const byteLength = result.byte_length;
  if (!Number.isSafeInteger(byteLength) || byteLength < 2 || byteLength > maximumBytes || version.size !== byteLength || result.bytes.byteLength !== byteLength) throw new PolicyError("ARTIFACT_SIZE_LIMIT");
  const bytes = Buffer.from(result.bytes.buffer, result.bytes.byteOffset, byteLength);
  if (createHash("sha256").update(bytes).digest("hex") !== version.checksum) throw new PolicyError("INVALID_TRUSTED_ARTIFACT");
  let payload = null;
  if (parseJson) {
    let text;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw new PolicyError("INVALID_TRUSTED_ARTIFACT"); }
    try { payload = JSON.parse(text); } catch { throw new PolicyError("INVALID_TRUSTED_ARTIFACT"); }
    if (canonicalJson(payload) !== text) throw new PolicyError("INVALID_TRUSTED_ARTIFACT");
  }
  return { reference: ref, checksum: version.checksum, version_number: version.version, payload, bytes, byte_length: byteLength, links: structuredClone(result.links) };
}

export async function resolvePlatformEntityVersion(refValue, context, maximumBytes) {
  const ref = slotReference(refValue, "source_flow_item");
  if (!ref) throw new PolicyError("INVALID_ARTIFACT_REFERENCE");
  if (typeof context.resolvePlatformEntityVersion !== "function") throw new PolicyError("TRUSTED_PLATFORM_ENTITY_RESOLVER_REQUIRED");
  let result;
  try { result = await context.resolvePlatformEntityVersion({ workspace_id: context.workspaceId, ref, max_bytes: maximumBytes }); }
  catch { throw new PolicyError("INVALID_PLATFORM_ENTITY_ARTIFACT"); }
  if (!exactKeys(result, PLATFORM_RESULT_KEYS) || result.workspace_id !== context.workspaceId
    || result.enforced_max_bytes !== maximumBytes || !Number.isSafeInteger(result.observed_bytes)
    || result.observed_bytes < 2 || result.observed_bytes > maximumBytes
    || !exactKeys(result.artifact, PLATFORM_ARTIFACT_KEYS)) throw new PolicyError("INVALID_PLATFORM_ENTITY_ARTIFACT");
  const artifact = result.artifact;
  if (artifact.id !== ref.artifact_id || artifact.workspace_id !== context.workspaceId || artifact.status !== "stored"
    || !UUID.test(artifact.current_version ?? "") || artifact.kind !== "flow_item" || typeof artifact.name !== "string" || artifact.name.length > 500
    || artifact.mime_type !== "application/vnd.nuanu.flow-item+json" || !exactKeys(artifact.metadata, PLATFORM_METADATA_KEYS)
    || !UUID.test(artifact.metadata.project_id ?? "") || !UUID.test(artifact.metadata.work_item_id ?? "")
    || !Array.isArray(artifact.versions) || artifact.versions.length < 1 || artifact.versions.length > 64) throw new PolicyError("INVALID_PLATFORM_ENTITY_ARTIFACT");
  const version = artifact.versions.find((candidate) => candidate?.id === ref.version_id);
  if (!exactKeys(version, PLATFORM_VERSION_KEYS) || !Number.isSafeInteger(version.version) || version.version < 1 || version.file_asset !== null
    || !exactKeys(version.representation, PLATFORM_REPRESENTATION_KEYS)) throw new PolicyError("INVALID_PLATFORM_ENTITY_ARTIFACT");
  const representation = version.representation;
  if (representation.type !== "platform_entity" || representation.entityType !== "work_item"
    || representation.entityId !== artifact.metadata.work_item_id || !exactKeys(representation.snapshot, PLATFORM_SNAPSHOT_KEYS)
    || representation.snapshot.id !== artifact.metadata.work_item_id || representation.snapshot.project_id !== artifact.metadata.project_id
    || Buffer.byteLength(canonicalJson(representation), "utf8") !== result.observed_bytes) throw new PolicyError("INVALID_PLATFORM_ENTITY_ARTIFACT");
  const expectedLinks = [
    { entity_type: "project", entity_id: artifact.metadata.project_id, relation: "about" },
    { entity_type: "work_item", entity_id: artifact.metadata.work_item_id, relation: "about" },
  ].map((link) => canonicalJson(link)).sort();
  if (!Array.isArray(artifact.links) || artifact.links.length !== 2 || artifact.links.some((link) => !exactKeys(link, ARTIFACT_LINK_KEYS))
    || !same(artifact.links.map((link) => canonicalJson(link)).sort(), expectedLinks)) throw new PolicyError("INVALID_PLATFORM_ENTITY_ARTIFACT");
  return {
    reference: ref,
    project_id: artifact.metadata.project_id,
    work_item_id: artifact.metadata.work_item_id,
    version_number: version.version,
    representation: structuredClone(representation),
    links: structuredClone(artifact.links),
  };
}

export async function resolveCommitProfile(context, repositoryOrigin, commit) {
  const request = { repository_origin: repositoryOrigin, commit, path: PROFILE_PATH, max_bytes: FIXED_ARTIFACT_LIMIT };
  let result;
  try { result = await context.resolveProfileAtCommit(request); } catch { throw new PolicyError("INVALID_COMMIT_PROFILE"); }
  if (!exactKeys(result, COMMIT_PROFILE_KEYS) || result.repository_origin !== repositoryOrigin || result.commit !== commit
    || result.path !== PROFILE_PATH || result.enforced_max_bytes !== FIXED_ARTIFACT_LIMIT
    || !Number.isSafeInteger(result.byte_length) || result.byte_length < 2 || result.byte_length > FIXED_ARTIFACT_LIMIT
    || !DIGEST.test(result.sha256) || !(Buffer.isBuffer(result.bytes) || result.bytes instanceof Uint8Array)
    || result.bytes.byteLength !== result.byte_length) throw new PolicyError("INVALID_COMMIT_PROFILE");
  const bytes = Buffer.from(result.bytes.buffer, result.bytes.byteOffset, result.byte_length);
  if (digestBytes(bytes) !== result.sha256) throw new PolicyError("INVALID_COMMIT_PROFILE");
  let payload;
  try {
    payload = parseProfileBytes(bytes);
  } catch { throw new PolicyError("INVALID_COMMIT_PROFILE"); }
  return { payload, bytes, sha256: result.sha256 };
}

export function validateFullTestPlan(plan) {
  const reasons = new Set();
  const expectedKeys = plan?.graph_binding === undefined ? PLAN_KEYS : GRAPH_PLAN_KEYS;
  if (!exactKeys(plan, expectedKeys)) {
    reasons.add("INVALID_FULL_PLAN");
    return [...reasons];
  }
  try { validateTestPlan(plan.artifact_slot); } catch { reasons.add("INVALID_FULL_PLAN"); }
  if (plan.schema_version !== plan.artifact_slot?.schema_version || plan.project_key !== plan.artifact_slot?.project_key || plan.commit !== plan.artifact_slot?.commit || plan.profile_digest !== plan.artifact_slot?.profile_digest || !same(plan.branches, plan.artifact_slot?.branches)) reasons.add("INVALID_FULL_PLAN");
  if ((plan.graph_binding === undefined) !== (plan.artifact_slot?.graph_binding === undefined) || (plan.graph_binding !== undefined && !same(plan.graph_binding, plan.artifact_slot?.graph_binding))) reasons.add("INVALID_FULL_PLAN");
  if (!sourceReference(plan.source_artifact) || !DIGEST.test(plan.content_hash) || !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(plan.risk_level)) reasons.add("INVALID_FULL_PLAN");
  if (!exactKeys(plan.applicability, BRANCHES) || !exactKeys(plan.branch_reasons, BRANCHES) || !exactKeys(plan.expected_evidence, BRANCHES)) reasons.add("INVALID_FULL_PLAN");
  for (const branch of BRANCHES) {
    const applicability = plan.applicability?.[branch];
    if (!["REQUIRED", "NOT_APPLICABLE"].includes(applicability)) reasons.add("INVALID_FULL_PLAN");
    const branchReasons = plan.branch_reasons?.[branch];
    const evidence = plan.expected_evidence?.[branch];
    if (!Array.isArray(branchReasons) || branchReasons.length > 16 || branchReasons.some((item) => !exactKeys(item, ["code"]) || !CODE.test(item.code))) reasons.add("INVALID_FULL_PLAN");
    if (!Array.isArray(evidence) || evidence.length > MAX_EVIDENCE_KINDS || new Set(evidence).size !== evidence.length || evidence.some((kind) => !EVIDENCE_KIND.test(kind))) reasons.add("INVALID_FULL_PLAN");
    if (applicability === "REQUIRED" && evidence?.length === 0) reasons.add("INVALID_FULL_PLAN");
    if (applicability === "NOT_APPLICABLE" && (branchReasons?.length !== 0 || evidence?.length !== 0)) reasons.add("INVALID_FULL_PLAN");
  }
  const expected = BRANCHES.filter((branch) => plan.applicability?.[branch] === "REQUIRED");
  if (!same(plan.branches, expected)) reasons.add("INVALID_FULL_PLAN");
  const { plan_sha256: claimed, ...unsigned } = plan;
  if (!DIGEST.test(claimed) || sha256(unsigned) !== claimed) reasons.add("PLAN_DIGEST_MISMATCH");
  return [...reasons].sort();
}

function validateReceipt(receipt, input, profile, reasons) {
  if (!isObject(receipt) || !["READY", "NOT_REQUIRED", "INFRA_FAILURE"].includes(receipt.environment_status)) { reasons.add("INVALID_ENVIRONMENT_RECEIPT"); return; }
  const keys = receipt.environment_status === "READY" ? READY_RECEIPT_KEYS : receipt.environment_status === "NOT_REQUIRED" ? NOT_REQUIRED_RECEIPT_KEYS : FAILURE_RECEIPT_KEYS;
  if (!exactKeys(receipt, keys) || !ID.test(receipt.run_id ?? "") || !ID.test(receipt.attempt_id ?? "") || !ID.test(receipt.environment_id ?? "") || !NAMESPACE.test(receipt.target_namespace ?? "")) reasons.add("INVALID_ENVIRONMENT_RECEIPT");
  if (receipt.run_id !== input.run_id) reasons.add("RUN_MISMATCH");
  if (receipt.attempt_id !== input.attempt_id) reasons.add("ATTEMPT_MISMATCH");
  if (receipt.target_namespace !== sha256({ run_id: input.run_id, attempt_id: input.attempt_id, environment_id: receipt.environment_id }).slice(7)) reasons.add("INVALID_ENVIRONMENT_RECEIPT");
  if (receipt.environment_status === "INFRA_FAILURE") reasons.add("INFRA_FAILURE");
  if (receipt.environment_status === "NOT_REQUIRED" && profile.environment.strategy !== "none") reasons.add("INVALID_ENVIRONMENT_RECEIPT");
  if (receipt.environment_status === "READY") {
    if (receipt.repository_origin !== input.repository_origin) reasons.add("REPOSITORY_MISMATCH");
    if (receipt.commit !== input.plan?.commit) reasons.add("COMMIT_MISMATCH");
    if (receipt.content_hash !== input.plan?.content_hash) reasons.add("CONTENT_HASH_MISMATCH");
    if (!NONCE.test(receipt.instance_nonce ?? "") || !exactHttpUrl(receipt.base_url) || !exactOrigin(receipt.base_url) || !profile.safety.allowed_origins.includes(receipt.base_url)) reasons.add("INVALID_ENVIRONMENT_RECEIPT");
    for (const [path, name] of [[receipt.state_file, "environment.json"], [receipt.pid_file, "server.pid"]]) {
      if (typeof path !== "string" || !isAbsolute(path) || resolve(path) !== path || basename(path) !== name || basename(dirname(path)) !== receipt.target_namespace) reasons.add("INVALID_ENVIRONMENT_RECEIPT");
    }
    if (dirname(receipt.state_file ?? "") !== dirname(receipt.pid_file ?? "")) reasons.add("INVALID_ENVIRONMENT_RECEIPT");
  }
}

function validateCandidate(candidate, context, reasons) {
  if (!exactKeys(candidate, CANDIDATE_KEYS) || candidate.schema_version !== "nuanu.qa-evidence-candidate.v1") { reasons.add("INVALID_EVIDENCE_CANDIDATE"); return; }
  if (!["PASS", "FAIL", "INCONCLUSIVE", "SKIPPED"].includes(candidate.product_result)
    || !["HEALTHY", "INFRA_FAILURE", "NOT_REQUIRED"].includes(candidate.environment_status)
    || !["VERIFIED", "PARTIAL", "UNVERIFIED"].includes(candidate.evidence_status)
    || !Number.isFinite(candidate.confidence) || candidate.confidence < 0 || candidate.confidence > 1
    || !CODE.test(candidate.code ?? "")) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  try {
    validateOutcomeCode(context.profile, context.branch, {
      applicability: context.applicability,
      product_result: candidate.product_result,
      environment_status: candidate.environment_status,
    }, candidate.code);
  } catch { reasons.add("UNKNOWN_CODE"); }
  const repositoryOnlyCode = context.branch === "code" && context.receipt.environment_status === "NOT_REQUIRED" && candidate.environment_status === "NOT_REQUIRED";
  if (candidate.product_result === "PASS" && ((!repositoryOnlyCode && candidate.environment_status !== "HEALTHY") || candidate.evidence_status !== "VERIFIED")) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  if (candidate.product_result === "FAIL" && !repositoryOnlyCode && candidate.environment_status !== "HEALTHY") reasons.add("INVALID_EVIDENCE_CANDIDATE");
  if (candidate.environment_status === "INFRA_FAILURE" && candidate.product_result !== "INCONCLUSIVE") reasons.add("INVALID_EVIDENCE_CANDIDATE");
  if (context.applicability === "NOT_APPLICABLE" && candidate.environment_status !== (context.receipt.environment_status === "READY" ? "HEALTHY" : "NOT_REQUIRED")) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  if (candidate.run_id !== context.runId) reasons.add("RUN_MISMATCH");
  if (candidate.attempt_id !== context.attemptId) reasons.add("ATTEMPT_MISMATCH");
  if (candidate.branch !== context.branch) reasons.add("BRANCH_IDENTITY_MISMATCH");
  if (candidate.attempt_namespace !== sha256({ run_id: context.runId, attempt_id: context.attemptId }).slice(7) || candidate.branch_namespace !== sha256({ run_id: context.runId, attempt_id: context.attemptId, branch: context.branch }).slice(7)) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  if (!Array.isArray(candidate.evidence_kinds) || candidate.evidence_kinds.length > MAX_EVIDENCE_KINDS || new Set(candidate.evidence_kinds).size !== candidate.evidence_kinds.length || candidate.evidence_kinds.some((kind) => !EVIDENCE_KIND.test(kind))) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  if (!Array.isArray(candidate.observations) || candidate.observations.length > MAX_OBSERVATIONS || !Array.isArray(candidate.candidates) || candidate.candidates.length > MAX_CANDIDATES) reasons.add("EVIDENCE_COUNT_LIMIT");
  if (!Array.isArray(candidate.observations) || !Array.isArray(candidate.candidates)) return;
  for (const observation of candidate.observations) if (!exactKeys(observation, ["code", "status", "value_sha256"]) || !CODE.test(observation.code ?? "") || !["PASS", "FAIL", "INCONCLUSIVE"].includes(observation.status) || !DIGEST.test(observation.value_sha256 ?? "")) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  if (candidate.product_result === "PASS" && candidate.observations.some(({ status }) => status !== "PASS")) reasons.add("PASS_ASSERTION_MISMATCH");
  if (candidate.product_result === "FAIL" && !candidate.observations.some(({ status }) => status === "FAIL")) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  let totalDecoded = 0;
  const maxBase64Length = Math.ceil(context.maximumBytes / 3) * 4 + 4;
  const allowedMedia = { document: "text/markdown", screenshot: "image/png", trace: "application/zip" };
  for (const item of candidate.candidates.slice(0, MAX_CANDIDATES)) {
    if (!exactKeys(item, ["kind", "name", "media_type", "size_bytes", "sha256", "content_base64"]) || !Object.hasOwn(allowedMedia, item.kind) || item.media_type !== allowedMedia[item.kind] || !ID.test(item.name ?? "") || !Number.isSafeInteger(item.size_bytes) || item.size_bytes < 1 || item.size_bytes > context.maximumBytes || !DIGEST.test(item.sha256 ?? "") || typeof item.content_base64 !== "string" || item.content_base64.length > maxBase64Length) { reasons.add("INVALID_EVIDENCE_CANDIDATE"); continue; }
    const approximate = Math.floor(item.content_base64.length * 3 / 4);
    if (approximate > context.maximumBytes || totalDecoded + approximate > context.maximumBytes) { reasons.add("EVIDENCE_BYTE_LIMIT"); continue; }
    const bytes = Buffer.from(item.content_base64, "base64");
    totalDecoded += bytes.byteLength;
    if (bytes.toString("base64") !== item.content_base64 || bytes.byteLength !== item.size_bytes || digestBytes(bytes) !== item.sha256 || totalDecoded > context.maximumBytes) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  }
  if (context.applicability === "REQUIRED") {
    if (candidate.observations.length === 0 || candidate.candidates.length === 0 || !same(candidate.evidence_kinds, context.expectedEvidence)) reasons.add("EVIDENCE_KIND_MISMATCH");
    if (context.branch === "ui" && (!candidate.candidates.some(({ kind }) => kind === "screenshot") || !candidate.candidates.some(({ kind }) => kind === "trace"))) reasons.add("INVALID_EVIDENCE_CANDIDATE");
  } else if (candidate.product_result !== "SKIPPED"
    || candidate.environment_status !== (context.receipt.environment_status === "READY" ? "HEALTHY" : "NOT_REQUIRED")
    || candidate.evidence_status !== "VERIFIED" || candidate.confidence !== 1
    || candidate.evidence_kinds.length !== 0 || candidate.observations.length !== 0 || candidate.candidates.length !== 0) reasons.add("NOT_APPLICABLE_EVIDENCE_MISMATCH");
  const identity = candidate.environment_identity;
  if (context.receipt.environment_status === "READY") {
    if (!exactKeys(identity, ENVIRONMENT_IDENTITY_KEYS)) reasons.add("ENVIRONMENT_ID_MISMATCH");
    if (identity?.environment_id !== context.receipt.environment_id || identity?.target_namespace !== context.receipt.target_namespace || identity?.base_url !== context.receipt.base_url) reasons.add("ENVIRONMENT_ID_MISMATCH");
    if (identity?.repository_origin !== context.receipt.repository_origin) reasons.add("REPOSITORY_MISMATCH");
    if (identity?.commit !== context.receipt.commit) reasons.add("COMMIT_MISMATCH");
    if (identity?.content_hash !== context.receipt.content_hash) reasons.add("CONTENT_HASH_MISMATCH");
    if (identity?.instance_nonce !== context.receipt.instance_nonce) reasons.add("INSTANCE_NONCE_MISMATCH");
  } else if (identity !== null) reasons.add("ENVIRONMENT_ID_MISMATCH");
}

function expectedOccurrence(context, payloadArtifact, evidenceArtifact) {
  return {
    schema_version: "nuanu.qa-evidence-occurrence.v1",
    source_artifact: context.plan.source_artifact,
    plan_sha256: context.plan.plan_sha256,
    branch: context.branch,
    repository_origin: context.repositoryOrigin,
    commit: context.plan.commit,
    content_hash: context.plan.content_hash,
    environment_id: context.receipt.environment_id,
    instance_nonce: context.receipt.instance_nonce ?? null,
    run_id: context.runId,
    attempt_id: context.attemptId,
    branch_payload_artifact: trustedLink(payloadArtifact),
    evidence_artifact: trustedLink(evidenceArtifact),
  };
}

function aggregateIdentity(context) {
  return {
    source_artifact: context.plan.source_artifact,
    plan_artifact: context.planArtifactLink,
    profile_artifact: context.profileArtifactLink,
    plan_sha256: context.plan.plan_sha256,
    profile_blob_sha256: context.profileBlobSha256,
    profile_digest: context.plan.profile_digest,
    project_key: context.plan.project_key,
    repository_origin: context.repositoryOrigin,
    commit: context.plan.commit,
    content_hash: context.plan.content_hash,
    environment_id: context.receipt.environment_id,
    target_namespace: context.receipt.target_namespace,
    instance_nonce: context.receipt.instance_nonce ?? null,
    run_id: context.runId,
    attempt_id: context.attemptId,
  };
}

export async function validateMaterializedBranch(branch, entries, context, resolvedArtifacts = null) {
  const reasons = new Set();
  if (entries.length === 0) return { record: { ...invalidBranch(branch, "MISSING_BRANCH"), applicability: context.plan.applicability[branch], validity: "MISSING" }, reasons: new Set(["MISSING_BRANCH"]) };
  if (entries.length !== 1) reasons.add("DUPLICATE_BRANCH");
  const entry = entries[0];
  if (!exactKeys(entry, ["output", "artifacts"]) || !exactKeys(entry.artifacts, ARTIFACT_ROLES)) reasons.add("INVALID_BRANCH_RECORD");
  const output = entry?.output;
  const result = output?.branch_result;
  const data = output?.envelope?.item?.data;
  if (!exactKeys(output, ["branch_result", "envelope"]) || !exactKeys(data, EXECUTION_KEYS)) reasons.add("INVALID_BRANCH_OUTPUT");
  const expectedAttemptNamespace = sha256({ run_id: context.runId, attempt_id: context.attemptId }).slice(7);
  const expectedBranchNamespace = sha256({ run_id: context.runId, attempt_id: context.attemptId, branch }).slice(7);
  if (data?.schema_version !== "nuanu.qa-branch-execution.v1"
    || data?.attempt_namespace !== expectedAttemptNamespace || data?.branch_namespace !== expectedBranchNamespace
    || !["HEALTHY", "INFRA_FAILURE", "NOT_REQUIRED"].includes(data?.environment_status)
    || !Number.isFinite(data?.confidence) || data.confidence < 0 || data.confidence > 1
    || !CODE.test(data?.code ?? "")) reasons.add("INVALID_BRANCH_OUTPUT");
  try { validateBranchResult(result); } catch { reasons.add("INVALID_BRANCH_OUTPUT"); }
  if (result?.branch !== branch || result?.project_key !== context.plan.project_key || result?.profile_digest !== context.plan.profile_digest) reasons.add("BRANCH_IDENTITY_MISMATCH");
  if (result?.commit !== context.plan.commit) reasons.add("COMMIT_MISMATCH");
  const applicability = context.plan.applicability[branch];
  if (result?.applicability !== applicability) reasons.add("APPLICABILITY_MISMATCH");
  if (applicability === "REQUIRED" && result?.product_result !== "PASS") reasons.add(result?.product_result === "FAIL" ? "PRODUCT_FAILURE" : "REQUIRED_BRANCH_NOT_PASS");
  if (applicability === "NOT_APPLICABLE" && result?.product_result !== "SKIPPED") reasons.add("INAPPLICABLE_BRANCH_NOT_SKIPPED");
  if (result?.product_result === "FAIL") reasons.add("PRODUCT_FAILURE");
  if (result?.evidence_status !== "VERIFIED") reasons.add("EVIDENCE_NOT_VERIFIED");
  if (data?.run_id !== context.runId) reasons.add("RUN_MISMATCH");
  if (data?.attempt_id !== context.attemptId) reasons.add("ATTEMPT_MISMATCH");
  if (data?.environment_status === "INFRA_FAILURE") reasons.add("INFRA_FAILURE");
  if (!Number.isFinite(data?.confidence) || data.confidence < context.confidenceThreshold) reasons.add("LOW_CONFIDENCE");
  try {
    validateOutcomeCode(context.profile, branch, {
      applicability,
      product_result: result?.product_result,
      environment_status: data?.environment_status,
    }, data?.code);
  } catch { reasons.add("UNKNOWN_CODE"); }

  const refs = entry?.artifacts ?? {};
  for (const role of ARTIFACT_ROLES) {
    const ref = slotReference(refs[role], role);
    if (!ref) reasons.add("INVALID_ARTIFACT_REFERENCE");
    else {
      const key = `${ref.artifact_id}@${ref.version_id}`;
      if (context.usedArtifacts.has(key)) reasons.add("REUSED_ARTIFACT_VERSION");
      context.usedArtifacts.add(key);
    }
  }
  let payloadArtifact; let occurrenceArtifact; let evidenceArtifact;
  if (resolvedArtifacts) {
    payloadArtifact = resolvedArtifacts.branch_payload;
    occurrenceArtifact = resolvedArtifacts.occurrence;
    evidenceArtifact = resolvedArtifacts.evidence;
  } else {
    try { payloadArtifact = await resolveArtifactVersionForSlot(refs.branch_payload, "branch_payload", context, context.maximumBytes); } catch (error) { reasons.add(error.code ?? "INVALID_TRUSTED_ARTIFACT"); }
    try { occurrenceArtifact = await resolveArtifactVersionForSlot(refs.occurrence, "occurrence", context, context.maximumBytes); } catch (error) { reasons.add(error.code ?? "INVALID_TRUSTED_ARTIFACT"); }
    try { evidenceArtifact = await resolveArtifactVersionForSlot(refs.evidence, "evidence", context, context.maximumBytes); } catch (error) { reasons.add(error.code ?? "INVALID_TRUSTED_ARTIFACT"); }
  }

  const evidenceRef = slotReference(refs.evidence, "evidence");
  if (output?.envelope?.item?.key !== `verify_${branch}`
    || typeof output?.envelope?.item?.description !== "string" || output.envelope.item.description.length < 1 || output.envelope.item.description.length > 256 || /[\0\r\n]/.test(output.envelope.item.description)) reasons.add("INVALID_BRANCH_OUTPUT");
  if (!exactKeys(output?.envelope, ["item", "artifact_outputs"])
    || !exactKeys(output?.envelope?.item, ["key", "description", "data", "artifacts"])
    || output?.envelope?.item?.key !== `verify_${branch}`
    || typeof output?.envelope?.item?.description !== "string" || output.envelope.item.description.length < 1 || output.envelope.item.description.length > 256 || /[\0\r\n]/.test(output.envelope.item.description)
    || !exactKeys(output?.envelope?.item?.artifacts, ["evidence_report"])
    || !exactKeys(output?.envelope?.artifact_outputs, ["item.artifacts.evidence_report"])
    || !same(output.envelope.item.artifacts.evidence_report, evidenceRef)
    || !same(output.envelope.artifact_outputs["item.artifacts.evidence_report"], evidenceRef)) reasons.add("MATERIALIZATION_REF_MISMATCH");

  const expectedPayload = { schema_version: "nuanu.qa-materialized-branch-payload.v1", branch_result: result, execution_data: data };
  if (!payloadArtifact || !same(payloadArtifact.payload, expectedPayload)) reasons.add("BRANCH_PAYLOAD_DIGEST_MISMATCH");
  let candidate;
  if (typeof data?.evidence_candidate !== "string" || Buffer.byteLength(data.evidence_candidate) > context.maximumBytes || !DIGEST.test(data?.evidence_sha256 ?? "")) reasons.add("INVALID_BRANCH_OUTPUT");
  else {
    try {
      candidate = JSON.parse(data.evidence_candidate);
      if (canonicalJson(candidate) !== data.evidence_candidate || sha256(data.evidence_candidate) !== data.evidence_sha256) reasons.add("EVIDENCE_DIGEST_MISMATCH");
    } catch { reasons.add("INVALID_BRANCH_OUTPUT"); }
  }
  if (candidate) validateCandidate(candidate, { ...context, branch, applicability, expectedEvidence: context.plan.expected_evidence[branch] }, reasons);
  if (candidate && (candidate.product_result !== result?.product_result || candidate.evidence_status !== result?.evidence_status || candidate.environment_status !== data?.environment_status || candidate.confidence !== data?.confidence || candidate.code !== data?.code)) reasons.add("BRANCH_PAYLOAD_MISMATCH");

  const evidence = evidenceArtifact?.payload;
  if (!exactKeys(evidence, ["schema_version", "source_artifact", "plan_sha256", "branch", "branch_payload_sha256", "evidence_sha256", "evidence_candidate", "confirmed_findings"]) || evidence?.schema_version !== "nuanu.qa-materialized-evidence.v1") reasons.add("INVALID_MATERIALIZED_ARTIFACT");
  if (!same(evidence?.source_artifact, context.plan.source_artifact)) reasons.add("SOURCE_ARTIFACT_MISMATCH");
  if (evidence?.plan_sha256 !== context.plan.plan_sha256) reasons.add("PLAN_DIGEST_MISMATCH");
  if (evidence?.branch !== branch || evidence?.branch_payload_sha256 !== (payloadArtifact ? `sha256:${payloadArtifact.checksum}` : null) || evidence?.evidence_sha256 !== data?.evidence_sha256 || !same(evidence?.evidence_candidate, candidate)) reasons.add("EVIDENCE_LINK_MISMATCH");
  if (!Number.isSafeInteger(evidence?.confirmed_findings) || evidence.confirmed_findings < 0) reasons.add("INVALID_MATERIALIZED_ARTIFACT");
  if (evidence?.confirmed_findings > 0) reasons.add("CONFIRMED_FINDINGS");

  const occurrence = occurrenceArtifact?.payload;
  const unsignedOccurrence = payloadArtifact && evidenceArtifact ? expectedOccurrence({ ...context, branch }, payloadArtifact, evidenceArtifact) : null;
  const expectedFull = unsignedOccurrence ? { ...unsignedOccurrence, occurrence_key: sha256(unsignedOccurrence) } : null;
  if (!isObject(occurrence)) reasons.add("OCCURRENCE_KEY_MISMATCH");
  else {
    const { occurrence_key: claimed, ...unsigned } = occurrence;
    if (!DIGEST.test(claimed ?? "") || sha256(unsigned) !== claimed) reasons.add("OCCURRENCE_KEY_MISMATCH");
  }
  if (!same(occurrence?.source_artifact, context.plan.source_artifact)) reasons.add("SOURCE_ARTIFACT_MISMATCH");
  if (!expectedFull || !same(occurrence, expectedFull)) reasons.add("OCCURRENCE_LINK_MISMATCH");
  if (occurrence?.repository_origin !== context.repositoryOrigin) reasons.add("REPOSITORY_MISMATCH");
  if (occurrence?.commit !== context.plan.commit) reasons.add("COMMIT_MISMATCH");
  if (occurrence?.content_hash !== context.plan.content_hash) reasons.add("CONTENT_HASH_MISMATCH");
  if (occurrence?.environment_id !== context.receipt.environment_id) reasons.add("ENVIRONMENT_ID_MISMATCH");
  if (occurrence?.instance_nonce !== (context.receipt.instance_nonce ?? null)) reasons.add("INSTANCE_NONCE_MISMATCH");
  if (occurrence?.run_id !== context.runId) reasons.add("RUN_MISMATCH");
  if (occurrence?.attempt_id !== context.attemptId) reasons.add("ATTEMPT_MISMATCH");

  const reasonCodes = [...reasons].sort();
  return {
    record: {
      branch,
      validity: reasonCodes.length === 0 ? "VALID" : "INVALID",
      applicability,
      product_result: result?.product_result ?? null,
      environment_status: data?.environment_status ?? null,
      evidence_status: result?.evidence_status ?? null,
      confidence: Number.isFinite(data?.confidence) ? data.confidence : null,
      code: typeof data?.code === "string" ? data.code : null,
      confirmed_findings: Number.isSafeInteger(evidence?.confirmed_findings) ? evidence.confirmed_findings : null,
      identity: aggregateIdentity(context),
      artifacts: payloadArtifact && occurrenceArtifact && evidenceArtifact ? { branch_payload: trustedLink(payloadArtifact), occurrence: trustedLink(occurrenceArtifact), evidence: trustedLink(evidenceArtifact) } : null,
      reason_codes: reasonCodes,
    },
    reasons,
  };
}

async function aggregateUnsafe(input, dependencies) {
  const globalReasons = new Set();
  const exactInput = exactKeys(input, INPUT_KEYS);
  if (!exactInput) globalReasons.add("INVALID_AGGREGATE_INPUT");
  if (typeof dependencies?.resolveArtifactVersion !== "function") return failureAggregate("TRUSTED_ARTIFACT_RESOLVER_REQUIRED");
  if (typeof dependencies?.resolvePlatformEntityVersion !== "function") return failureAggregate("TRUSTED_PLATFORM_ENTITY_RESOLVER_REQUIRED");
  if (typeof dependencies?.resolveProfileAtCommit !== "function") return failureAggregate("TRUSTED_PROFILE_RESOLVER_REQUIRED");
  if (!exactInput && (!slotReference(input?.profile_artifact, "profile") || !slotReference(input?.plan_artifact, "plan"))) return failureAggregate("INVALID_AGGREGATE_INPUT");
  if (!UUID.test(input?.workspace_id ?? "") || !ID.test(input?.run_id ?? "") || !ID.test(input?.attempt_id ?? "") || !exactHttps(input?.repository_origin)) globalReasons.add("INVALID_AGGREGATE_INPUT");
  if (!Array.isArray(input?.branches) || input.branches.length > MAX_BRANCH_INPUTS) globalReasons.add("INVALID_AGGREGATE_INPUT");
  if (!slotReference(input?.profile_artifact, "profile") || !slotReference(input?.plan_artifact, "plan")) globalReasons.add("INVALID_ARTIFACT_REFERENCE");
  const resolutionContext = { resolveArtifactVersion: dependencies.resolveArtifactVersion, resolvePlatformEntityVersion: dependencies.resolvePlatformEntityVersion, resolveProfileAtCommit: dependencies.resolveProfileAtCommit, workspaceId: input?.workspace_id };
  let profileArtifact; let planArtifact;
  try { planArtifact = await resolveArtifactVersionForSlot(input?.plan_artifact, "plan", resolutionContext, FIXED_ARTIFACT_LIMIT); } catch (error) { return failureAggregate(error.code ?? "INVALID_TRUSTED_ARTIFACT"); }
  const trustedPlan = planArtifact.payload;
  for (const reason of validateFullTestPlan(trustedPlan)) globalReasons.add(reason);
  if (globalReasons.has("INVALID_FULL_PLAN")) return failureAggregate("INVALID_FULL_PLAN");
  if ([input.plan_artifact, input.profile_artifact].some((ref) => ref?.artifact_id === trustedPlan.source_artifact.artifact_id && ref?.version_id === trustedPlan.source_artifact.version_id)) return failureAggregate("REUSED_ARTIFACT_VERSION");
  try { await resolvePlatformEntityVersion(trustedPlan.source_artifact, resolutionContext, FIXED_ARTIFACT_LIMIT); } catch (error) { return failureAggregate(error.code ?? "INVALID_PLATFORM_ENTITY_ARTIFACT"); }
  try { profileArtifact = await resolveArtifactVersionForSlot(input?.profile_artifact, "profile", resolutionContext, FIXED_ARTIFACT_LIMIT, false); } catch (error) { return failureAggregate(error.code ?? "INVALID_TRUSTED_ARTIFACT"); }
  let artifactProfile;
  try { artifactProfile = parseProfileBytes(profileArtifact.bytes); } catch { return failureAggregate("INVALID_TRUSTED_PROFILE"); }
  let commitProfile;
  try { commitProfile = await resolveCommitProfile(resolutionContext, input.repository_origin, trustedPlan.commit); } catch (error) { return failureAggregate(error.code ?? "INVALID_COMMIT_PROFILE"); }
  const trustedProfile = commitProfile.payload;
  const maximumBytes = trustedProfile.execution.max_output_bytes;
  if (!profileArtifact.bytes.equals(commitProfile.bytes) || profileArtifact.checksum !== commitProfile.sha256.slice(7) || !same(artifactProfile, trustedProfile)) globalReasons.add("PROFILE_COMMIT_MISMATCH");
  if (!same(input?.plan, trustedPlan)) globalReasons.add("PLAN_MATERIAL_MISMATCH");
  if (trustedPlan.profile_digest !== sha256(trustedProfile)) globalReasons.add("PROFILE_DIGEST_MISMATCH");
  if (trustedPlan.project_key !== trustedProfile.project_key || input.repository_origin !== trustedProfile.repository.allowed_origin) globalReasons.add("PROFILE_POLICY_MISMATCH");
  validateReceipt(input?.environment_receipt, { ...input, plan: trustedPlan }, trustedProfile, globalReasons);

  const entries = Array.isArray(input?.branches) ? input.branches.slice(0, MAX_BRANCH_INPUTS) : [];
  const planArtifactLink = trustedLink(planArtifact);
  const profileArtifactLink = trustedLink(profileArtifact);
  const usedArtifacts = new Set([
    `${trustedPlan.source_artifact.artifact_id}@${trustedPlan.source_artifact.version_id}`,
    `${profileArtifact.reference.artifact_id}@${profileArtifact.reference.version_id}`,
    `${planArtifact.reference.artifact_id}@${planArtifact.reference.version_id}`,
  ]);
  if (planArtifact.reference.artifact_id === profileArtifact.reference.artifact_id && planArtifact.reference.version_id === profileArtifact.reference.version_id) globalReasons.add("REUSED_ARTIFACT_VERSION");
  if (trustedPlan.source_artifact.artifact_id === planArtifact.reference.artifact_id && trustedPlan.source_artifact.version_id === planArtifact.reference.version_id) globalReasons.add("REUSED_ARTIFACT_VERSION");
  if (trustedPlan.source_artifact.artifact_id === profileArtifact.reference.artifact_id && trustedPlan.source_artifact.version_id === profileArtifact.reference.version_id) globalReasons.add("REUSED_ARTIFACT_VERSION");
  const normalizedBranches = [];
  for (const branch of BRANCHES) {
    const matching = entries.filter((entry) => entry?.output?.branch_result?.branch === branch);
    const normalized = await validateMaterializedBranch(branch, matching, {
      ...resolutionContext,
      plan: trustedPlan,
      receipt: input.environment_receipt,
      repositoryOrigin: input.repository_origin,
      runId: input.run_id,
      attemptId: input.attempt_id,
      confidenceThreshold: trustedProfile.risk.confidence_threshold,
      maximumBytes,
      usedArtifacts,
      planArtifactLink,
      profileArtifactLink,
      profileBlobSha256: commitProfile.sha256,
      profile: trustedProfile,
    });
    normalizedBranches.push(normalized.record);
    for (const reason of normalized.reasons) globalReasons.add(reason);
  }
  if (entries.some((entry) => !BRANCHES.includes(entry?.output?.branch_result?.branch))) globalReasons.add("UNEXPECTED_BRANCH");
  if (entries.length !== BRANCHES.length) globalReasons.add("BRANCH_COUNT_MISMATCH");
  return finalizeAggregate({
    workspace_id: input.workspace_id,
    source_artifact: trustedPlan.source_artifact,
    plan_artifact: planArtifactLink,
    profile_artifact: profileArtifactLink,
    plan_binding: {
      source_artifact: trustedPlan.source_artifact,
      plan_artifact: planArtifactLink,
      profile_artifact: profileArtifactLink,
      plan_sha256: trustedPlan.plan_sha256,
      profile_blob_sha256: commitProfile.sha256,
      profile_digest: trustedPlan.profile_digest,
      project_key: trustedPlan.project_key,
      repository_origin: input.repository_origin,
      commit: trustedPlan.commit,
      content_hash: trustedPlan.content_hash,
    },
    profile_binding: {
      artifact: profileArtifactLink,
      profile_blob_sha256: commitProfile.sha256,
      profile_digest: trustedPlan.profile_digest,
      repository_origin: input.repository_origin,
      commit: trustedPlan.commit,
      path: PROFILE_PATH,
      confidence_threshold: trustedProfile.risk.confidence_threshold,
      max_evidence_bytes: maximumBytes,
      allowed_origins: [...trustedProfile.safety.allowed_origins],
    },
    plan_sha256: trustedPlan.plan_sha256,
    profile_blob_sha256: commitProfile.sha256,
    profile_digest: trustedPlan.profile_digest,
    project_key: trustedPlan.project_key,
    repository_origin: input.repository_origin,
    commit: trustedPlan.commit,
    content_hash: trustedPlan.content_hash,
    environment_id: input.environment_receipt?.environment_id ?? null,
    target_namespace: input.environment_receipt?.target_namespace ?? null,
    instance_nonce: input.environment_receipt?.instance_nonce ?? null,
    base_url: input.environment_receipt?.base_url ?? null,
    run_id: input.run_id,
    attempt_id: input.attempt_id,
    confidence_threshold: trustedProfile.risk.confidence_threshold,
    max_evidence_bytes: maximumBytes,
    environment_status: input.environment_receipt?.environment_status ?? null,
    branches: normalizedBranches,
  }, globalReasons);
}

export async function aggregateEvidence(input, dependencies = {}) {
  try { return await aggregateUnsafe(input, dependencies); } catch { return failureAggregate("INVALID_AGGREGATE_INPUT"); }
}

export const AGGREGATE_REASON_CODES = Object.freeze([
  "APPLICABILITY_MISMATCH", "ARTIFACT_SIZE_LIMIT", "ATTEMPT_MISMATCH", "BRANCH_COUNT_MISMATCH",
  "BRANCH_IDENTITY_MISMATCH", "BRANCH_PAYLOAD_DIGEST_MISMATCH", "BRANCH_PAYLOAD_MISMATCH", "COMMIT_MISMATCH",
  "CONFIRMED_FINDINGS", "CONTENT_HASH_MISMATCH", "DUPLICATE_BRANCH", "ENVIRONMENT_ID_MISMATCH",
  "EVIDENCE_BYTE_LIMIT", "EVIDENCE_COUNT_LIMIT", "EVIDENCE_DIGEST_MISMATCH", "EVIDENCE_KIND_MISMATCH",
  "EVIDENCE_LINK_MISMATCH", "EVIDENCE_NOT_VERIFIED", "INAPPLICABLE_BRANCH_NOT_SKIPPED", "INFRA_FAILURE",
  "INSTANCE_NONCE_MISMATCH", "INVALID_AGGREGATE_INPUT", "INVALID_ARTIFACT_REFERENCE", "INVALID_BRANCH_OUTPUT",
  "INVALID_BRANCH_RECORD", "INVALID_COMMIT_PROFILE", "INVALID_EVIDENCE_CANDIDATE", "INVALID_ENVIRONMENT_RECEIPT", "INVALID_FULL_PLAN",
  "INVALID_MATERIALIZED_ARTIFACT", "INVALID_PLATFORM_ENTITY_ARTIFACT", "INVALID_TRUSTED_ARTIFACT", "INVALID_TRUSTED_PROFILE", "LOW_CONFIDENCE",
  "MATERIALIZATION_REF_MISMATCH", "MISSING_BRANCH", "NOT_APPLICABLE_EVIDENCE_MISMATCH", "OCCURRENCE_KEY_MISMATCH",
  "OCCURRENCE_LINK_MISMATCH", "PASS_ASSERTION_MISMATCH", "PLAN_DIGEST_MISMATCH", "PLAN_MATERIAL_MISMATCH",
  "PRODUCT_FAILURE", "PROFILE_COMMIT_MISMATCH", "PROFILE_DIGEST_MISMATCH", "PROFILE_POLICY_MISMATCH", "REPOSITORY_MISMATCH",
  "REQUIRED_BRANCH_NOT_PASS", "REUSED_ARTIFACT_VERSION", "RUN_MISMATCH", "SOURCE_ARTIFACT_MISMATCH",
  "TRUSTED_ARTIFACT_RESOLVER_REQUIRED", "TRUSTED_PLATFORM_ENTITY_RESOLVER_REQUIRED", "TRUSTED_PROFILE_RESOLVER_REQUIRED", "UNATTESTED_ARTIFACT_BOUND", "UNEXPECTED_BRANCH", "UNKNOWN_CODE",
]);
