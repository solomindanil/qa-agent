import { validateResolvedContext } from "./contracts.mjs";

const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TOKEN = /^[a-z][a-z0-9-]{0,63}$/;
const ARTIFACT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ARTIFACT_REF_KEYS = ["artifact_id", "version_id", "kind", "role"];
const RAW_CONTEXT_KEYS = ["source_artifact", "issue_uuid", "project_uuid", "project_key", "repository_origin", "commit", "content_hash", "profile_digest", "changed_files", "labels", "acceptance_capabilities", "wiki_artifacts"];
const RESOLVED_CONTEXT_KEYS = ["schema_version", "project_key", "commit", "profile_digest", "environment_status", ...RAW_CONTEXT_KEYS, "artifact_slot"];

function exactKeys(value, required) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("context must be an object");
  for (const key of required) if (!(key in value)) throw new Error(`missing ${key}`);
  for (const key of Object.keys(value)) if (!required.includes(key)) throw new Error(`unknown ${key}`);
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function digest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) throw new Error(`${label} must be a sha256 digest`);
  return value;
}

function token(value, label) {
  if (!TOKEN.test(value)) throw new Error(`${label} must be a normalized token`);
  return value;
}

function normalizedToken(value, label) {
  requiredString(value, label);
  return token(value.trim().toLowerCase(), label);
}

function uniqueNormalizedTokens(values, label) {
  if (!Array.isArray(values)) throw new Error(`${label} must be an array`);
  const result = values.map((value) => normalizedToken(value, label));
  if (new Set(result).size !== result.length) throw new Error(`${label} must contain unique values`);
  return result.sort();
}

function changedFiles(value) {
  if (!Array.isArray(value)) throw new Error("changed_files must be an array");
  const result = [];
  const seen = new Set();
  for (const entry of value) {
    requiredString(entry, "changed_files");
    if (entry.startsWith("/") || entry.includes("\\") || entry.split("/").some((part) => part === "" || part === "." || part === "..")) throw new Error("changed_files contains traversal or an unsafe path");
    if (seen.has(entry)) throw new Error("changed_files must contain unique paths");
    seen.add(entry);
    result.push(entry);
  }
  return result.sort();
}

function sourceArtifact(value) {
  try { exactKeys(value, ARTIFACT_REF_KEYS); } catch (error) { throw new Error(`source_artifact ${error.message}`); }
  if (!UUID.test(value.artifact_id) || !UUID.test(value.version_id)) throw new Error("source_artifact must pin UUID artifact_id and version_id");
  if (value.kind !== "flow_item" || value.role !== "source") throw new Error("source_artifact must be a Nuanu Flow-item source reference");
  return { ...value };
}

function wikiArtifacts(value) {
  if (!Array.isArray(value) || value.length > 16) throw new Error("wiki_artifacts must contain at most sixteen references");
  const result = value.map((entry) => {
    exactKeys(entry, ["id", "version", "sha256"]);
    if (typeof entry.id !== "string" || !ARTIFACT_ID.test(entry.id)) throw new Error("wiki_artifacts.id must be a bounded identifier");
    if (!Number.isSafeInteger(entry.version) || entry.version < 1) throw new Error("wiki_artifacts.version must be a positive integer");
    digest(entry.sha256, "wiki_artifacts.sha256");
    return { id: entry.id, version: entry.version, sha256: entry.sha256 };
  });
  const identities = result.map((entry) => `${entry.id}:${entry.version}`);
  if (new Set(identities).size !== identities.length) throw new Error("wiki_artifacts must contain unique references");
  return result.sort((left, right) => `${left.id}:${left.version}`.localeCompare(`${right.id}:${right.version}`));
}

function exactRepositoryOrigin(value, allowedOrigin) {
  requiredString(value, "repository_origin");
  requiredString(allowedOrigin, "allowed_origin");
  let parsed;
  let allowed;
  try {
    parsed = new URL(value);
    allowed = new URL(allowedOrigin);
  } catch {
    throw new Error("repository origin must be an absolute URL");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || value !== allowedOrigin || parsed.href !== allowed.href) throw new Error("repository origin is outside the profile repository");
  return value;
}

export function resolveContext(input, profileRepository) {
  exactKeys(input, RAW_CONTEXT_KEYS);
  if (!profileRepository || typeof profileRepository !== "object") throw new Error("profile repository is required");
  const source = sourceArtifact(input.source_artifact);
  if (typeof input.issue_uuid !== "string" || !UUID.test(input.issue_uuid)) throw new Error("issue_uuid must be an exact UUID");
  if (typeof input.project_uuid !== "string" || !UUID.test(input.project_uuid)) throw new Error("project_uuid must be an exact UUID");
  token(input.project_key, "project_key");
  exactRepositoryOrigin(input.repository_origin, profileRepository.allowed_origin);
  if (typeof input.commit !== "string" || !SHA.test(input.commit)) throw new Error("commit must be a lowercase 40-character Git SHA");
  digest(input.content_hash, "content_hash");
  digest(input.profile_digest, "profile_digest");
  const contextArtifact = { schema_version: "nuanu.qa-resolved-context.v1", project_key: input.project_key, commit: input.commit, profile_digest: input.profile_digest, environment_status: "NOT_REQUIRED" };
  validateResolvedContext(contextArtifact);
  return validateResolvedContextBoundary({
    ...contextArtifact,
    source_artifact: source,
    issue_uuid: input.issue_uuid,
    project_uuid: input.project_uuid,
    repository_origin: input.repository_origin,
    content_hash: input.content_hash,
    changed_files: changedFiles(input.changed_files),
    labels: uniqueNormalizedTokens(input.labels, "labels"),
    acceptance_capabilities: uniqueNormalizedTokens(input.acceptance_capabilities, "acceptance_capabilities"),
    wiki_artifacts: wikiArtifacts(input.wiki_artifacts),
    artifact_slot: contextArtifact,
  }, profileRepository);
}

export function validateResolvedContextBoundary(context, profileRepository) {
  exactKeys(context, RESOLVED_CONTEXT_KEYS);
  if (!profileRepository || typeof profileRepository !== "object") throw new Error("profile repository is required");
  if (context.schema_version !== "nuanu.qa-resolved-context.v1" || context.environment_status !== "NOT_REQUIRED") throw new Error("resolved context must use the closed context artifact identity");
  token(context.project_key, "project_key");
  if (typeof context.issue_uuid !== "string" || !UUID.test(context.issue_uuid)) throw new Error("issue_uuid must be an exact UUID");
  if (typeof context.project_uuid !== "string" || !UUID.test(context.project_uuid)) throw new Error("project_uuid must be an exact UUID");
  exactRepositoryOrigin(context.repository_origin, profileRepository.allowed_origin);
  if (typeof context.commit !== "string" || !SHA.test(context.commit)) throw new Error("commit must be a lowercase 40-character Git SHA");
  digest(context.content_hash, "content_hash");
  digest(context.profile_digest, "profile_digest");
  sourceArtifact(context.source_artifact);
  const normalizedFiles = changedFiles(context.changed_files);
  const normalizedLabels = uniqueNormalizedTokens(context.labels, "labels");
  const normalizedCapabilities = uniqueNormalizedTokens(context.acceptance_capabilities, "acceptance_capabilities");
  const normalizedWiki = wikiArtifacts(context.wiki_artifacts);
  if (JSON.stringify(normalizedFiles) !== JSON.stringify(context.changed_files) || JSON.stringify(normalizedLabels) !== JSON.stringify(context.labels) || JSON.stringify(normalizedCapabilities) !== JSON.stringify(context.acceptance_capabilities) || JSON.stringify(normalizedWiki) !== JSON.stringify(context.wiki_artifacts)) throw new Error("resolved context must be canonicalized");
  validateResolvedContext(context.artifact_slot);
  if (context.artifact_slot.schema_version !== context.schema_version || context.artifact_slot.project_key !== context.project_key || context.artifact_slot.commit !== context.commit || context.artifact_slot.profile_digest !== context.profile_digest || context.artifact_slot.environment_status !== context.environment_status) throw new Error("resolved context artifact slot must match context identity");
  return context;
}

export function loadProjectContextEnvelope(context) {
  if (!context || typeof context !== "object" || !context.artifact_slot) throw new Error("resolved context artifact slot is required");
  validateResolvedContext(context.artifact_slot);
  return { item: { key: "load_project_context" }, artifacts: { context: context.artifact_slot } };
}
