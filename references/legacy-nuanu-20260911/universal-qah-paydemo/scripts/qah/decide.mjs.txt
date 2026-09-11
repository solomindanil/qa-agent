import { createHash } from "node:crypto";
import { canonicalJson, sha256 } from "./canonical.mjs";
import {
  AGGREGATE_REASON_CODES,
  ARTIFACT_SLOT_POLICY,
  resolveArtifactVersionForSlot,
  resolveCommitProfile,
  resolvePlatformEntityVersion,
  validateFullTestPlan,
  validateMaterializedBranch,
} from "./aggregate.mjs";
import { parseProfileBytes } from "./profile.mjs";
import { RELEASE_ROUTES, classifyValidatedRelease } from "./release-policy.mjs";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const PROJECT_KEY = /^[a-z][a-z0-9-]*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const NONCE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const NAMESPACE = /^[a-f0-9]{64}$/;
const ROUTES = new Set(RELEASE_ROUTES);
const AGGREGATE_KEYS = ["schema_version", "workspace_id", "source_artifact", "plan_artifact", "profile_artifact", "plan_binding", "profile_binding", "plan_sha256", "profile_blob_sha256", "profile_digest", "project_key", "repository_origin", "commit", "content_hash", "environment_id", "target_namespace", "instance_nonce", "base_url", "run_id", "attempt_id", "confidence_threshold", "max_evidence_bytes", "environment_status", "expected_branches", "branches", "invariants_passed", "reason_codes", "aggregate_sha256"];
const BRANCH_KEYS = ["branch", "validity", "applicability", "product_result", "environment_status", "evidence_status", "confidence", "code", "confirmed_findings", "identity", "artifacts", "reason_codes"];
const ARTIFACT_REF_KEYS = ["artifact_id", "version_id", "kind", "role"];
const PLAN_BINDING_KEYS = ["source_artifact", "plan_artifact", "profile_artifact", "plan_sha256", "profile_blob_sha256", "profile_digest", "project_key", "repository_origin", "commit", "content_hash"];
const PROFILE_BINDING_KEYS = ["artifact", "profile_blob_sha256", "profile_digest", "repository_origin", "commit", "path", "confidence_threshold", "max_evidence_bytes", "allowed_origins"];
const IDENTITY_KEYS = ["source_artifact", "plan_artifact", "profile_artifact", "plan_sha256", "profile_blob_sha256", "profile_digest", "project_key", "repository_origin", "commit", "content_hash", "environment_id", "target_namespace", "instance_nonce", "run_id", "attempt_id"];
const SYSTEM_ROLES = new Set(["output", "implementation", "evidence", "source"]);
const EXPLANATION_CODES = new Set(["EVIDENCE_VERIFIED", "EVIDENCE_INCOMPLETE", "POLICY_BLOCKED"]);
const AUTHENTICATED_OUTCOME_REASONS = new Set([
  "CONFIRMED_FINDINGS", "EVIDENCE_NOT_VERIFIED", "INFRA_FAILURE", "LOW_CONFIDENCE",
  "PRODUCT_FAILURE", "REQUIRED_BRANCH_NOT_PASS",
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return isObject(value) && canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort());
}

function exactHttps(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.hash && parsed.href === value;
  } catch { return false; }
}

function artifactRef(value) {
  return exactKeys(value, ARTIFACT_REF_KEYS) && UUID.test(value.artifact_id) && UUID.test(value.version_id)
    && ["document", "flow_item"].includes(value.kind) && SYSTEM_ROLES.has(value.role);
}

function slotRef(value, slot) {
  const policy = ARTIFACT_SLOT_POLICY[slot];
  return artifactRef(value) && value.kind === policy?.kind && value.role === policy?.role;
}

function same(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}

function identityKey(value) {
  return `${value?.artifact_id}@${value?.version_id}`;
}

function exactOrigin(value) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password && !parsed.search && !parsed.hash && value === parsed.origin;
  } catch { return false; }
}

function boundedSummary(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[\0\r\n]/g, " ").slice(0, 512);
}

function normalizeExplanation(proposal) {
  try {
    const reasonCodes = Array.isArray(proposal?.reason_codes)
      ? [...new Set(proposal.reason_codes.filter((code) => EXPLANATION_CODES.has(code)))].sort().slice(0, 8)
      : [];
    return { summary: boundedSummary(proposal?.summary), reason_codes: reasonCodes };
  } catch { return { summary: "", reason_codes: [] }; }
}

function validateAggregate(aggregate) {
  const reasons = new Set();
  if (!exactKeys(aggregate, AGGREGATE_KEYS) || aggregate.schema_version !== "nuanu.qa-evidence-aggregate.v1") reasons.add("INVALID_AGGREGATE_SHAPE");
  if (!DIGEST.test(aggregate?.aggregate_sha256 ?? "")) reasons.add("INVALID_AGGREGATE_DIGEST");
  if (isObject(aggregate)) {
    const { aggregate_sha256: claimed, ...unsigned } = aggregate;
    if (sha256(unsigned) !== claimed) reasons.add("INVALID_AGGREGATE_DIGEST");
  }
  if (!UUID.test(aggregate?.workspace_id ?? "")
    || !slotRef(aggregate?.source_artifact, "source_flow_item")
    || !slotRef(aggregate?.plan_artifact, "plan")
    || !slotRef(aggregate?.profile_artifact, "profile")
    || identityKey(aggregate?.source_artifact) === identityKey(aggregate?.plan_artifact)
    || identityKey(aggregate?.source_artifact) === identityKey(aggregate?.profile_artifact)
    || identityKey(aggregate?.plan_artifact) === identityKey(aggregate?.profile_artifact)
    || !DIGEST.test(aggregate?.plan_sha256 ?? "")
    || !DIGEST.test(aggregate?.profile_blob_sha256 ?? "")
    || !DIGEST.test(aggregate?.profile_digest ?? "")
    || !PROJECT_KEY.test(aggregate?.project_key ?? "")
    || !exactHttps(aggregate?.repository_origin)
    || !COMMIT.test(aggregate?.commit ?? "")
    || !DIGEST.test(aggregate?.content_hash ?? "")
    || !ID.test(aggregate?.environment_id ?? "")
    || !NAMESPACE.test(aggregate?.target_namespace ?? "")
    || aggregate?.target_namespace !== sha256({ run_id: aggregate?.run_id, attempt_id: aggregate?.attempt_id, environment_id: aggregate?.environment_id }).slice(7)
    || !ID.test(aggregate?.run_id ?? "")
    || !ID.test(aggregate?.attempt_id ?? "")
    || !Number.isFinite(aggregate?.confidence_threshold) || aggregate.confidence_threshold <= 0 || aggregate.confidence_threshold > 1
    || !Number.isSafeInteger(aggregate?.max_evidence_bytes) || aggregate.max_evidence_bytes < 1 || aggregate.max_evidence_bytes > 10_485_760
    || !["READY", "NOT_REQUIRED"].includes(aggregate?.environment_status)
    || (aggregate?.environment_status === "READY" && (!NONCE.test(aggregate?.instance_nonce ?? "") || !exactOrigin(aggregate?.base_url)))
    || (aggregate?.environment_status === "NOT_REQUIRED" && (aggregate?.instance_nonce !== null || aggregate?.base_url !== null))) reasons.add("INVALID_AGGREGATE_IDENTITY");
  const expectedPlanBinding = {
    source_artifact: aggregate?.source_artifact,
    plan_artifact: aggregate?.plan_artifact,
    profile_artifact: aggregate?.profile_artifact,
    plan_sha256: aggregate?.plan_sha256,
    profile_blob_sha256: aggregate?.profile_blob_sha256,
    profile_digest: aggregate?.profile_digest,
    project_key: aggregate?.project_key,
    repository_origin: aggregate?.repository_origin,
    commit: aggregate?.commit,
    content_hash: aggregate?.content_hash,
  };
  if (!exactKeys(aggregate?.plan_binding, PLAN_BINDING_KEYS) || !same(aggregate.plan_binding, expectedPlanBinding)) reasons.add("INVALID_AGGREGATE_IDENTITY");
  const profileBinding = aggregate?.profile_binding;
  if (!exactKeys(profileBinding, PROFILE_BINDING_KEYS) || !same(profileBinding?.artifact, aggregate?.profile_artifact)
    || profileBinding?.profile_blob_sha256 !== aggregate?.profile_blob_sha256 || profileBinding?.profile_digest !== aggregate?.profile_digest || profileBinding?.repository_origin !== aggregate?.repository_origin
    || profileBinding?.commit !== aggregate?.commit || profileBinding?.path !== "qa-harness.yaml"
    || profileBinding?.confidence_threshold !== aggregate?.confidence_threshold || profileBinding?.max_evidence_bytes !== aggregate?.max_evidence_bytes
    || !Array.isArray(profileBinding?.allowed_origins) || profileBinding.allowed_origins.length < 1 || profileBinding.allowed_origins.length > 16
    || new Set(profileBinding?.allowed_origins).size !== profileBinding?.allowed_origins.length
    || profileBinding?.allowed_origins?.some((origin) => !exactOrigin(origin))
    || (aggregate?.environment_status === "READY" && !profileBinding?.allowed_origins?.includes(aggregate?.base_url))) reasons.add("INVALID_AGGREGATE_IDENTITY");
  if (!Array.isArray(aggregate?.reason_codes) || aggregate.reason_codes.length > 64 || new Set(aggregate.reason_codes).size !== aggregate.reason_codes.length || aggregate.reason_codes.some((code) => !AGGREGATE_REASON_CODES.includes(code))) reasons.add("UNKNOWN_AGGREGATE_CODE");
  const expectedBranches = ["code", "api", "ui", "domain"];
  if (!Array.isArray(aggregate?.expected_branches) || canonicalJson(aggregate.expected_branches) !== canonicalJson(expectedBranches)) reasons.add("INVALID_AGGREGATE_SHAPE");
  if (!Array.isArray(aggregate?.branches) || aggregate.branches.length !== 4 || aggregate.branches.some((branch, index) => branch?.branch !== expectedBranches[index])) reasons.add("INVALID_AGGREGATE_SHAPE");
  if (Array.isArray(aggregate?.branches) && aggregate.branches.some((branch) => branch?.environment_status !== (aggregate?.environment_status === "READY" ? "HEALTHY" : "NOT_REQUIRED"))) reasons.add("INVALID_AGGREGATE_POLICY");
  if (aggregate?.environment_status === "NOT_REQUIRED" && aggregate?.branches?.some((branch) => branch?.applicability === "REQUIRED" && branch?.branch !== "code")) reasons.add("INVALID_AGGREGATE_POLICY");
  const usedArtifacts = new Set();
  for (const topArtifact of [aggregate?.source_artifact, aggregate?.plan_artifact, aggregate?.profile_artifact]) usedArtifacts.add(identityKey(topArtifact));
  const expectedIdentity = {
    source_artifact: aggregate?.source_artifact,
    plan_artifact: aggregate?.plan_artifact,
    profile_artifact: aggregate?.profile_artifact,
    plan_sha256: aggregate?.plan_sha256,
    profile_blob_sha256: aggregate?.profile_blob_sha256,
    profile_digest: aggregate?.profile_digest,
    project_key: aggregate?.project_key,
    repository_origin: aggregate?.repository_origin,
    commit: aggregate?.commit,
    content_hash: aggregate?.content_hash,
    environment_id: aggregate?.environment_id,
    target_namespace: aggregate?.target_namespace,
    instance_nonce: aggregate?.instance_nonce,
    run_id: aggregate?.run_id,
    attempt_id: aggregate?.attempt_id,
  };
  if (Array.isArray(aggregate?.branches)) for (const branch of aggregate.branches.slice(0, 4)) {
    let invalidPolicy = !exactKeys(branch, BRANCH_KEYS)
      || branch.validity !== "VALID"
      || !Array.isArray(branch.reason_codes) || branch.reason_codes.length !== 0
      || !["REQUIRED", "NOT_APPLICABLE"].includes(branch.applicability)
      || branch.evidence_status !== "VERIFIED"
      || !Number.isFinite(branch.confidence) || branch.confidence < aggregate.confidence_threshold || branch.confidence > 1
      || branch.confirmed_findings !== 0
      || !exactKeys(branch.identity, IDENTITY_KEYS) || !same(branch.identity, expectedIdentity);
    if (branch.applicability === "REQUIRED") {
      invalidPolicy ||= branch.product_result !== "PASS" || typeof branch.code !== "string" || branch.code.length < 1;
      invalidPolicy ||= branch.environment_status !== (aggregate?.environment_status === "NOT_REQUIRED" && branch.branch === "code" ? "NOT_REQUIRED" : "HEALTHY");
    } else invalidPolicy ||= branch.product_result !== "SKIPPED" || typeof branch.code !== "string" || branch.code.length < 1 || !["HEALTHY", "NOT_REQUIRED"].includes(branch.environment_status);
    if (!exactKeys(branch.artifacts, ["branch_payload", "occurrence", "evidence"])) invalidPolicy = true;
    else for (const [slot, material] of Object.entries(branch.artifacts)) {
      if (!slotRef(material, slot)) invalidPolicy = true;
      const key = identityKey(material);
      if (usedArtifacts.has(key)) invalidPolicy = true;
      usedArtifacts.add(key);
    }
    if (invalidPolicy) reasons.add("INVALID_AGGREGATE_POLICY");
  }
  const localReasons = Array.isArray(aggregate?.reason_codes) ? aggregate.reason_codes : [];
  const expectedInvariant = reasons.size === 0 && localReasons.length === 0 && aggregate?.branches?.every((branch) => branch.validity === "VALID");
  if (aggregate?.invariants_passed !== expectedInvariant) reasons.add("INVALID_AGGREGATE_POLICY");
  return [...reasons].sort();
}

function digestBytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

async function validateTrustedArtifactBindings(aggregate, dependencies) {
  const reasons = new Set();
  if (typeof dependencies?.resolveArtifactVersion !== "function") reasons.add("TRUSTED_ARTIFACT_RESOLVER_REQUIRED");
  if (typeof dependencies?.resolvePlatformEntityVersion !== "function") reasons.add("TRUSTED_PLATFORM_ENTITY_RESOLVER_REQUIRED");
  if (typeof dependencies?.resolveProfileAtCommit !== "function") reasons.add("TRUSTED_PROFILE_RESOLVER_REQUIRED");
  if (reasons.size > 0) return { reasons: [...reasons].sort(), profile: null, authoritative_policy: null };
  const context = {
    workspaceId: aggregate?.workspace_id,
    resolveArtifactVersion: dependencies.resolveArtifactVersion,
    resolvePlatformEntityVersion: dependencies.resolvePlatformEntityVersion,
    resolveProfileAtCommit: dependencies.resolveProfileAtCommit,
  };
  const resolved = {};
  const read = async (key, ref, slot, maximumBytes, parseJson = true) => {
    try { resolved[key] = await resolveArtifactVersionForSlot(ref, slot, context, maximumBytes, parseJson); }
    catch (error) { reasons.add(error?.code ?? "INVALID_TRUSTED_ARTIFACT"); }
  };
  const fixedLimit = 256 * 1024;
  const evidenceLimit = Number.isSafeInteger(aggregate?.max_evidence_bytes) && aggregate.max_evidence_bytes > 0 && aggregate.max_evidence_bytes <= 10_485_760
    ? aggregate.max_evidence_bytes
    : fixedLimit;
  try { resolved.source = await resolvePlatformEntityVersion(aggregate?.source_artifact, context, fixedLimit); }
  catch (error) { reasons.add(error?.code ?? "INVALID_PLATFORM_ENTITY_ARTIFACT"); }
  await read("plan", aggregate?.plan_artifact, "plan", fixedLimit);
  await read("profile", aggregate?.profile_artifact, "profile", fixedLimit, false);
  let commitProfile;
  try { commitProfile = await resolveCommitProfile(context, aggregate?.repository_origin, aggregate?.commit); }
  catch (error) { reasons.add(error?.code ?? "INVALID_COMMIT_PROFILE"); }
  if (resolved.plan) {
    const plan = resolved.plan.payload;
    for (const reason of validateFullTestPlan(plan)) reasons.add(reason);
    const { plan_sha256: claimed, ...unsigned } = plan ?? {};
    if (!DIGEST.test(claimed ?? "") || sha256(unsigned) !== claimed || claimed !== aggregate?.plan_sha256
      || !same(plan?.source_artifact, aggregate?.source_artifact) || plan?.profile_digest !== aggregate?.profile_digest
      || plan?.project_key !== aggregate?.project_key || plan?.repository_origin !== undefined
      || plan?.commit !== aggregate?.commit || plan?.content_hash !== aggregate?.content_hash) reasons.add("PLAN_DIGEST_MISMATCH");
  }
  if (resolved.profile) {
    let profile;
    try { profile = parseProfileBytes(resolved.profile.bytes); } catch { reasons.add("INVALID_TRUSTED_PROFILE"); }
    if (digestBytes(resolved.profile.bytes) !== aggregate?.profile_blob_sha256) reasons.add("PROFILE_COMMIT_MISMATCH");
    if (!commitProfile || !resolved.profile.bytes.equals(commitProfile.bytes) || commitProfile.sha256 !== aggregate?.profile_blob_sha256) reasons.add("PROFILE_COMMIT_MISMATCH");
    if (profile && (sha256(profile) !== aggregate?.profile_digest || profile.project_key !== aggregate?.project_key
      || profile.repository.allowed_origin !== aggregate?.repository_origin
      || profile.risk.confidence_threshold !== aggregate?.confidence_threshold
      || profile.execution.max_output_bytes !== aggregate?.max_evidence_bytes
      || !same(profile.safety.allowed_origins, aggregate?.profile_binding?.allowed_origins))) reasons.add("PROFILE_DIGEST_MISMATCH");
    if (profile && commitProfile && !same(profile, commitProfile.payload)) reasons.add("PROFILE_COMMIT_MISMATCH");
  }
  const usedArtifacts = new Set([aggregate?.source_artifact, aggregate?.plan_artifact, aggregate?.profile_artifact].map(identityKey));
  const authoritativeReasons = new Set();
  const authoritativeBranches = [];
  if (resolved.plan && Array.isArray(aggregate?.branches)) for (const branch of aggregate.branches.slice(0, 4)) {
    const materials = {};
    for (const slot of ["branch_payload", "occurrence", "evidence"]) {
      try { materials[slot] = await resolveArtifactVersionForSlot(branch?.artifacts?.[slot], slot, context, evidenceLimit); }
      catch (error) { reasons.add(error?.code ?? "INVALID_TRUSTED_ARTIFACT"); }
    }
    const payload = materials.branch_payload?.payload;
    const evidenceRef = branch?.artifacts?.evidence;
    const entry = {
      output: {
        branch_result: payload?.branch_result,
        envelope: {
          item: {
            key: `verify_${branch?.branch}`,
            description: `Decision-time ${branch?.branch} QA validation`,
            data: payload?.execution_data,
            artifacts: { evidence_report: evidenceRef },
          },
          artifact_outputs: { "item.artifacts.evidence_report": evidenceRef },
        },
      },
      artifacts: branch?.artifacts,
    };
    const normalized = await validateMaterializedBranch(branch?.branch, [entry], {
      ...context,
      plan: resolved.plan.payload,
      receipt: {
        environment_status: aggregate?.environment_status,
        environment_id: aggregate?.environment_id,
        target_namespace: aggregate?.target_namespace,
        repository_origin: aggregate?.repository_origin,
        commit: aggregate?.commit,
        content_hash: aggregate?.content_hash,
        instance_nonce: aggregate?.instance_nonce,
        base_url: aggregate?.base_url,
      },
      repositoryOrigin: aggregate?.repository_origin,
      runId: aggregate?.run_id,
      attemptId: aggregate?.attempt_id,
      confidenceThreshold: aggregate?.confidence_threshold,
      maximumBytes: evidenceLimit,
      usedArtifacts,
      planArtifactLink: aggregate?.plan_artifact,
      profileArtifactLink: aggregate?.profile_artifact,
      profileBlobSha256: aggregate?.profile_blob_sha256,
      profile: commitProfile?.payload,
    }, materials);
    authoritativeBranches.push(normalized.record);
    for (const reason of normalized.reasons) authoritativeReasons.add(reason);
    for (const reason of normalized.reasons) reasons.add(reason);
    if (!same(normalized.record, branch)) reasons.add("INVALID_AGGREGATE_POLICY");
  }
  const authoritativePolicy = resolved.plan && Array.isArray(aggregate?.branches) && aggregate.branches.length === 4 && authoritativeBranches.length === 4
    ? {
      reason_codes: [...authoritativeReasons].sort(),
      invariants_passed: authoritativeReasons.size === 0 && authoritativeBranches.every((branch) => branch.validity === "VALID"),
    }
    : null;
  return { reasons: [...reasons].sort(), profile: commitProfile?.payload ?? null, authoritative_policy: authoritativePolicy };
}

function decisionFrom(aggregateSha, route, reasonCodes, proposal) {
  const proposedRoute = (() => { try { return ROUTES.has(proposal?.proposed_route) ? proposal.proposed_route : null; } catch { return null; } })();
  const unsigned = {
    schema_version: "nuanu.qa-release-route.v1",
    aggregate_sha256: DIGEST.test(aggregateSha ?? "") ? aggregateSha : null,
    route,
    reason_codes: [...new Set(reasonCodes)].sort().slice(0, 64),
    policy_override_rejected: proposedRoute !== null && proposedRoute !== route,
    explanation: normalizeExplanation(proposal),
  };
  return { ...unsigned, decision_sha256: sha256(unsigned) };
}

export async function decideRelease(aggregate, proposal = {}, dependencies = {}) {
  try {
    const validated = await validateAggregateForDecision(aggregate, dependencies);
    const classification = classifyValidatedRelease(validated);
    return decisionFrom(validated.aggregate_sha256, classification.route, validated.reason_codes, proposal);
  } catch {
    return decisionFrom(null, "HOLD_IN_READY_FOR_QA", ["INVALID_AGGREGATE_INPUT"], {});
  }
}

export async function validateAggregateForDecision(aggregate, dependencies = {}) {
  try {
    const validationReasons = validateAggregate(aggregate);
    const trusted = await validateTrustedArtifactBindings(aggregate, dependencies);
    const aggregateReasons = Array.isArray(aggregate?.reason_codes) ? aggregate.reason_codes.filter((code) => AGGREGATE_REASON_CODES.includes(code)) : [];
    const reasonCodes = [...new Set([...aggregateReasons, ...validationReasons, ...trusted.reasons])].sort();
    const fatalValidation = validationReasons.filter((code) => code !== "INVALID_AGGREGATE_POLICY");
    const fatalTrusted = trusted.reasons.filter((code) => !AUTHENTICATED_OUTCOME_REASONS.has(code));
    const fatalLocal = aggregateReasons.filter((code) => !AUTHENTICATED_OUTCOME_REASONS.has(code));
    const policyShapeIsAuthenticated = trusted.authoritative_policy !== null
      && same(aggregate?.reason_codes, trusted.authoritative_policy.reason_codes)
      && aggregate?.invariants_passed === trusted.authoritative_policy.invariants_passed;
    const valid = fatalValidation.length === 0 && fatalTrusted.length === 0 && fatalLocal.length === 0
      && policyShapeIsAuthenticated && trusted.profile !== null;
    const requiredBranches = Array.isArray(aggregate?.branches) ? aggregate.branches.filter((branch) => branch?.applicability === "REQUIRED") : [];
    const productOnly = (codes) => Array.isArray(codes) && codes.length > 0 && new Set(codes).size === codes.length
      && codes.every((code) => ["PRODUCT_FAILURE", "CONFIRMED_FINDINGS"].includes(code));
    const normalizedProductFailure = policyShapeIsAuthenticated && requiredBranches.length > 0
      && requiredBranches.every((branch) => (branch?.validity === "INVALID" && productOnly(branch.reason_codes))
        || (branch?.validity === "VALID" && branch?.evidence_status === "VERIFIED" && branch?.product_result === "PASS"
          && branch?.confirmed_findings === 0 && Array.isArray(branch?.reason_codes) && branch.reason_codes.length === 0))
      && requiredBranches.some((branch) => branch?.validity === "INVALID")
      && aggregate.branches.filter((branch) => branch?.applicability !== "REQUIRED").every((branch) => branch?.validity === "VALID"
        && branch?.evidence_status === "VERIFIED" && branch?.product_result === "SKIPPED" && branch?.confirmed_findings === 0
        && Array.isArray(branch?.reason_codes) && branch.reason_codes.length === 0)
      && productOnly(aggregateReasons)
      && [...new Set([...validationReasons, ...trusted.reasons, ...aggregateReasons])]
        .every((code) => code === "INVALID_AGGREGATE_POLICY" || ["PRODUCT_FAILURE", "CONFIRMED_FINDINGS"].includes(code));
    return {
      valid,
      aggregate: valid ? structuredClone(aggregate) : null,
      profile: valid ? structuredClone(trusted.profile) : null,
      aggregate_sha256: DIGEST.test(aggregate?.aggregate_sha256 ?? "") ? aggregate.aggregate_sha256 : null,
      reason_codes: normalizedProductFailure ? reasonCodes.filter((code) => code !== "INVALID_AGGREGATE_POLICY") : reasonCodes,
    };
  } catch {
    return { valid: false, aggregate: null, profile: null, aggregate_sha256: null, reason_codes: ["INVALID_AGGREGATE_INPUT"] };
  }
}
