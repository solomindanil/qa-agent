import { canonicalJson, sha256 } from "./canonical.mjs";
import { resolveArtifactVersionForSlot, resolvePlatformEntityVersion } from "./aggregate.mjs";
import { decideRelease, validateAggregateForDecision } from "./decide.mjs";
import { RELEASE_ROUTES } from "./release-policy.mjs";

export const COMMENT_HTML_MAX_BYTES = 8_192;
export const COMMENT_LIST_MAX_BYTES = 1_048_576;
export const COMMENT_LIST_MAX_COMMENTS = 100;
const TRUSTED_ARTIFACT_MAX_BYTES = 262_144;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const CODE = /^[A-Z][A-Z0-9_]{0,63}$/;
const MARKER = /^<!-- nuanu-qah-comment:v1:[a-f0-9]{64} -->$/;
const ANY_MARKER = /<!-- nuanu-qah-comment:v1:[a-f0-9]{64} -->/g;
const ANY_MARKER_LIKE = /<!--\s*nuanu-qah-comment:v1:[\s\S]{0,128}?-->/g;
const ARTIFACT_KEYS = ["artifact_id", "version_id", "kind", "role"];
const DECISION_KEYS = ["schema_version", "aggregate_sha256", "route", "reason_codes", "policy_override_rejected", "explanation", "decision_sha256"];
const SUMMARY_KEYS = ["selected_checks", "skipped_checks", "commit", "content_hash", "finding_count"];
const REVIEW_PAYLOAD_KEYS = ["schema_version", "workspace_id", "project_id", "work_item_id", "source_artifact", "aggregate", "stored_decision"];
const COMMENT_KEYS = ["comment_id", "workspace_id", "project_id", "issue_id", "comment_html"];
const COMMENT_LIST_KEYS = ["comments", "source_operation", "complete", "total_count", "truncated", "enforced_max_bytes", "enforced_max_comments", "observed_bytes"];

class CommentPolicyError extends Error {
  constructor(code) { super(code); this.code = code; }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function exactKeys(value, keys) {
  if (!isObject(value)) return false;
  try { return canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort()); }
  catch { return false; }
}

export function same(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); }
  catch { return false; }
}

export function artifactReference(value, expectedKind, expectedRole) {
  if (!exactKeys(value, ARTIFACT_KEYS) || !UUID.test(value.artifact_id ?? "") || !UUID.test(value.version_id ?? "")
    || value.kind !== expectedKind || value.role !== expectedRole) throw new CommentPolicyError("INVALID_ARTIFACT_REFERENCE");
  return { ...value };
}

function validateDecision(value) {
  if (!exactKeys(value, DECISION_KEYS) || value.schema_version !== "nuanu.qa-release-route.v1"
    || !(value.aggregate_sha256 === null || DIGEST.test(value.aggregate_sha256))
    || !RELEASE_ROUTES.includes(value.route)
    || typeof value.policy_override_rejected !== "boolean"
    || !Array.isArray(value.reason_codes) || value.reason_codes.length > 64 || new Set(value.reason_codes).size !== value.reason_codes.length
    || value.reason_codes.some((code) => typeof code !== "string" || !CODE.test(code))
    || !exactKeys(value.explanation, ["summary", "reason_codes"]) || typeof value.explanation.summary !== "string"
    || value.explanation.summary.length > 512 || value.explanation.summary.includes("\0")
    || !Array.isArray(value.explanation.reason_codes) || value.explanation.reason_codes.length > 8
    || value.explanation.reason_codes.some((code) => typeof code !== "string" || !CODE.test(code))
    || !DIGEST.test(value.decision_sha256 ?? "")) throw new CommentPolicyError("INVALID_RELEASE_DECISION");
  const { decision_sha256: claimed, ...unsigned } = value;
  if (sha256(unsigned) !== claimed) throw new CommentPolicyError("INVALID_RELEASE_DECISION");
  return value;
}

function normalizeSummary(value) {
  const branches = ["code", "api", "ui", "domain"];
  if (!exactKeys(value, SUMMARY_KEYS) || !Array.isArray(value.selected_checks) || !Array.isArray(value.skipped_checks)
    || new Set([...value.selected_checks, ...value.skipped_checks]).size !== branches.length
    || !same([...value.selected_checks, ...value.skipped_checks].sort(), [...branches].sort())
    || !COMMIT.test(value.commit ?? "") || !DIGEST.test(value.content_hash ?? "")
    || !Number.isSafeInteger(value.finding_count) || value.finding_count < 0 || value.finding_count > 1_000_000) {
    throw new CommentPolicyError("INVALID_REVIEW_SUMMARY");
  }
  return value;
}

function markerDigestInput(source, decisionSha, bundle) {
  return {
    source_artifact_id: source.artifact_id,
    source_version_id: source.version_id,
    decision_sha256: decisionSha,
    review_bundle_artifact_id: bundle.artifact_id,
    review_bundle_version_id: bundle.version_id,
  };
}

export function escapeHtml(value) {
  if (typeof value !== "string") throw new CommentPolicyError("INVALID_HTML_VALUE");
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function markerFor(input) {
  if (!exactKeys(input, ["source_artifact", "decision_sha256", "review_bundle"]) || !DIGEST.test(input.decision_sha256 ?? "")) throw new CommentPolicyError("INVALID_MARKER_INPUT");
  const source = artifactReference(input.source_artifact, "flow_item", "source");
  const bundle = artifactReference(input.review_bundle, "document", "evidence");
  const marker = `<!-- nuanu-qah-comment:v1:${sha256(markerDigestInput(source, input.decision_sha256, bundle)).slice(7)} -->`;
  if (!MARKER.test(marker)) throw new CommentPolicyError("INVALID_MARKER_INPUT");
  return marker;
}

function listHtml(values) {
  return `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

export function renderComment(input) {
  if (!exactKeys(input, ["source_artifact", "decision", "review_bundle", "review_summary"])) throw new CommentPolicyError("INVALID_COMMENT_INPUT");
  const source = artifactReference(input.source_artifact, "flow_item", "source");
  const bundle = artifactReference(input.review_bundle, "document", "evidence");
  const decision = validateDecision(input.decision);
  const summary = normalizeSummary(input.review_summary);
  const marker = markerFor({ source_artifact: source, decision_sha256: decision.decision_sha256, review_bundle: bundle });
  const html = [
    marker,
    `<p><strong>QA result:</strong> ${escapeHtml(decision.route)}</p>`,
    "<p><strong>Reason codes:</strong></p>", listHtml(decision.reason_codes.length ? decision.reason_codes : ["NONE"]),
    "<p><strong>Selected checks:</strong></p>", listHtml(summary.selected_checks.length ? summary.selected_checks : ["NONE"]),
    "<p><strong>Skipped checks:</strong></p>", listHtml(summary.skipped_checks.length ? summary.skipped_checks : ["NONE"]),
    `<p><strong>Build commit:</strong> ${escapeHtml(summary.commit)}</p>`,
    `<p><strong>Build content hash:</strong> ${escapeHtml(summary.content_hash)}</p>`,
    `<p><strong>Confirmed findings:</strong> ${escapeHtml(String(summary.finding_count))}</p>`,
    `<p><strong>Source Artifact@version:</strong> ${escapeHtml(`${source.artifact_id}@${source.version_id}`)}</p>`,
    `<p><strong>Review bundle Artifact@version:</strong> ${escapeHtml(`${bundle.artifact_id}@${bundle.version_id}`)}</p>`,
  ].join("");
  if (Buffer.byteLength(html, "utf8") > COMMENT_HTML_MAX_BYTES) throw new CommentPolicyError("COMMENT_HTML_SIZE_LIMIT");
  return { marker, comment_html: html, comment_html_sha256: sha256(html) };
}

function validReviewLinks(links, expected, input) {
  if (!Array.isArray(links) || links.length < expected.length || links.length > expected.length + 1) return false;
  if (links.some((link) => !exactKeys(link, ["entity_type", "entity_id", "relation"]))) return false;
  const normalized = links.map((link) => canonicalJson(link));
  if (new Set(normalized).size !== normalized.length) return false;
  const actual = new Set(normalized);
  if (expected.some((link) => !actual.has(canonicalJson(link)))) return false;
  const optional = canonicalJson({ entity_type: "work_item", entity_id: input.issue_id, relation: "about" });
  return normalized.every((link) => expected.some((required) => canonicalJson(required) === link) || link === optional);
}

function expectedReviewLinks(input, runId) {
  return [
    { entity_type: "project", entity_id: input.project_id, relation: "output" },
    { entity_type: "work_item", entity_id: input.issue_id, relation: "output" },
    { entity_type: "process_run", entity_id: runId, relation: "output" },
  ];
}

function reviewSummary(aggregate) {
  return {
    selected_checks: aggregate.branches.filter((branch) => branch.applicability === "REQUIRED").map((branch) => branch.branch),
    skipped_checks: aggregate.branches.filter((branch) => branch.applicability === "NOT_APPLICABLE").map((branch) => branch.branch),
    commit: aggregate.commit,
    content_hash: aggregate.content_hash,
    finding_count: aggregate.branches.reduce((sum, branch) => sum + branch.confirmed_findings, 0),
  };
}

export async function resolveTrustedPublication(input, dependencies) {
  if (typeof dependencies?.resolveArtifactVersion !== "function" || typeof dependencies?.resolvePlatformEntityVersion !== "function"
    || typeof dependencies?.resolveProfileAtCommit !== "function") throw new CommentPolicyError("TRUSTED_RESOLVER_REQUIRED");
  const context = {
    workspaceId: input.workspace_id,
    resolveArtifactVersion: dependencies.resolveArtifactVersion,
    resolvePlatformEntityVersion: dependencies.resolvePlatformEntityVersion,
    resolveProfileAtCommit: dependencies.resolveProfileAtCommit,
  };
  let source;
  try { source = await resolvePlatformEntityVersion(input.source_artifact, context, TRUSTED_ARTIFACT_MAX_BYTES); }
  catch { throw new CommentPolicyError("SOURCE_IDENTITY_MISMATCH"); }
  if (source.project_id !== input.project_id || source.work_item_id !== input.issue_id) throw new CommentPolicyError("SOURCE_IDENTITY_MISMATCH");
  let review;
  try { review = await resolveArtifactVersionForSlot(input.review_bundle, "review_bundle", context, TRUSTED_ARTIFACT_MAX_BYTES); }
  catch { throw new CommentPolicyError("REVIEW_BUNDLE_MISMATCH"); }
  const payload = review.payload;
  if (!exactKeys(payload, REVIEW_PAYLOAD_KEYS) || payload.schema_version !== "nuanu.qa-review-bundle.v1"
    || payload.workspace_id !== input.workspace_id || payload.project_id !== input.project_id || payload.work_item_id !== input.issue_id
    || !same(payload.source_artifact, input.source_artifact)
    || payload.aggregate?.workspace_id !== input.workspace_id || !same(payload.aggregate?.source_artifact, input.source_artifact)
    || !UUID.test(payload.aggregate?.run_id ?? "")
    || !validReviewLinks(review.links, expectedReviewLinks(input, payload.aggregate.run_id), input)) throw new CommentPolicyError("REVIEW_BUNDLE_MISMATCH");
  const validated = await validateAggregateForDecision(payload.aggregate, dependencies);
  if (!validated.valid) throw new CommentPolicyError("INVALID_AGGREGATE");
  const decision = await decideRelease(validated.aggregate, {}, dependencies);
  validateDecision(decision);
  if (payload.stored_decision !== null && !same(payload.stored_decision, decision)) throw new CommentPolicyError("STORED_DECISION_MISMATCH");
  return { sourceIdentity: source, aggregate: validated.aggregate, decision, profile: validated.profile, review_summary: normalizeSummary(reviewSummary(validated.aggregate)) };
}

function validateComment(value, input) {
  if (!exactKeys(value, COMMENT_KEYS) || !UUID.test(value.comment_id ?? "") || value.workspace_id !== input.workspace_id
    || value.project_id !== input.project_id || value.issue_id !== input.issue_id || typeof value.comment_html !== "string"
    || value.comment_html.includes("\0") || Buffer.byteLength(value.comment_html, "utf8") > COMMENT_HTML_MAX_BYTES) throw new CommentPolicyError("INVALID_COMMENT_READBACK");
  return value;
}

export async function readGlobalComments(input, dependencies) {
  if (typeof dependencies?.listIssueComments !== "function") throw new CommentPolicyError("COMMENT_READBACK_REQUIRED");
  let result;
  try {
    result = await dependencies.listIssueComments({
      workspace_id: input.workspace_id, project_id: input.project_id, issue_id: input.issue_id,
      max_comments: COMMENT_LIST_MAX_COMMENTS, max_bytes: COMMENT_LIST_MAX_BYTES,
    });
  } catch { throw new CommentPolicyError("COMMENT_READBACK_UNCERTAIN"); }
  try {
    if (!exactKeys(result, COMMENT_LIST_KEYS) || result.enforced_max_bytes !== COMMENT_LIST_MAX_BYTES
      || result.enforced_max_comments !== COMMENT_LIST_MAX_COMMENTS || result.source_operation !== "get_issue_comments"
      || result.complete !== true || result.truncated !== false) throw new CommentPolicyError("UNATTESTED_COMMENT_BOUND");
    if (!Array.isArray(result.comments) || result.comments.length > COMMENT_LIST_MAX_COMMENTS
      || result.total_count !== result.comments.length
      || !Number.isSafeInteger(result.observed_bytes) || result.observed_bytes < 2 || result.observed_bytes > COMMENT_LIST_MAX_BYTES) throw new CommentPolicyError("INVALID_COMMENT_READBACK");
    const comments = structuredClone(result.comments);
    if (Buffer.byteLength(canonicalJson(comments), "utf8") !== result.observed_bytes) throw new CommentPolicyError("INVALID_COMMENT_READBACK");
    return comments.map((comment) => validateComment(comment, input));
  } catch (error) {
    if (error instanceof CommentPolicyError) throw error;
    throw new CommentPolicyError("INVALID_COMMENT_READBACK");
  }
}

function decodeMarkerEntities(value) {
  let decoded = value;
  for (let index = 0; index < 2; index += 1) decoded = decoded
    .replace(/&(?:lt|#0*60|#x0*3c);/gi, "<")
    .replace(/&(?:gt|#0*62|#x0*3e);/gi, ">")
    .replace(/&amp;/gi, "&");
  return decoded;
}

export function locateMarker(comments, marker) {
  const occurrences = [];
  for (const comment of comments) {
    const raw = comment.comment_html.match(ANY_MARKER) ?? [];
    const rawLike = comment.comment_html.match(ANY_MARKER_LIKE) ?? [];
    const decodedHtml = decodeMarkerEntities(comment.comment_html);
    const decoded = decodedHtml.match(ANY_MARKER) ?? [];
    const decodedLike = decodedHtml.match(ANY_MARKER_LIKE) ?? [];
    if (decoded.length !== raw.length || decodedLike.length !== rawLike.length) throw new CommentPolicyError("ENCODED_COMMENT_MARKER");
    if (rawLike.length !== raw.length) throw new CommentPolicyError("DUPLICATE_COMMENT_MARKER");
    for (const candidate of raw) occurrences.push({ candidate, comment });
  }
  if (occurrences.some(({ candidate }) => candidate !== marker) || occurrences.length > 1) throw new CommentPolicyError("DUPLICATE_COMMENT_MARKER");
  return occurrences.length === 1 ? occurrences[0].comment : null;
}

function receipt(input, rendered, comment, status, decision) {
  return {
    schema_version: "nuanu.qa-comment-receipt.v1", publication_status: status,
    workspace_id: input.workspace_id, project_id: input.project_id, issue_id: input.issue_id,
    comment_id: comment.comment_id, source_artifact: { ...input.source_artifact }, review_bundle: { ...input.review_bundle },
    decision_sha256: decision.decision_sha256, marker: rendered.marker, comment_html_sha256: rendered.comment_html_sha256,
  };
}

export async function publishComment(input, dependencies = {}) {
  if (!exactKeys(input, ["workspace_id", "project_id", "issue_id", "source_artifact", "review_bundle"])
    || !UUID.test(input.workspace_id ?? "") || !UUID.test(input.project_id ?? "") || !UUID.test(input.issue_id ?? "")) throw new CommentPolicyError("INVALID_PUBLICATION_INPUT");
  artifactReference(input.source_artifact, "flow_item", "source");
  artifactReference(input.review_bundle, "document", "evidence");
  const trusted = await resolveTrustedPublication(input, dependencies);
  const rendered = renderComment({ source_artifact: input.source_artifact, decision: trusted.decision, review_bundle: input.review_bundle, review_summary: trusted.review_summary });
  let comments = await readGlobalComments(input, dependencies);
  let found = locateMarker(comments, rendered.marker);
  if (found) {
    if (found.comment_html !== rendered.comment_html) throw new CommentPolicyError("INVALID_COMMENT_READBACK");
    return receipt(input, rendered, found, "ALREADY_PRESENT", trusted.decision);
  }
  if (typeof dependencies?.addIssueComment !== "function") throw new CommentPolicyError("COMMENT_WRITER_REQUIRED");
  let ambiguous = false;
  try { await dependencies.addIssueComment({ workspace_id: input.workspace_id, project_id: input.project_id, issue_id: input.issue_id, comment_html: rendered.comment_html }); }
  catch { ambiguous = true; }
  comments = await readGlobalComments(input, dependencies);
  found = locateMarker(comments, rendered.marker);
  if (!found) throw new CommentPolicyError("COMMENT_NOT_FOUND_AFTER_WRITE");
  if (found.comment_html !== rendered.comment_html) throw new CommentPolicyError("INVALID_COMMENT_READBACK");
  return receipt(input, rendered, found, ambiguous ? "RECONCILED" : "ADDED", trusted.decision);
}
