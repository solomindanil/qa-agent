import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { decideRelease } from "../../scripts/qah/decide.mjs";
import { cleanupEnvironment } from "../../scripts/qah/environment.mjs";
import {
  COMMENT_HTML_MAX_BYTES,
  COMMENT_LIST_MAX_BYTES,
  COMMENT_LIST_MAX_COMMENTS,
  escapeHtml,
  markerFor,
  publishComment,
  renderComment,
} from "../../scripts/qah/render-comment.mjs";
import {
  finalizeTransition,
  finalizeTransitionAdmission,
  validateFinalizationClassification,
} from "../../scripts/qah/finalize.mjs";
import {
  aggregateFixture,
  aggregateFixtureResult,
  material,
  platformMaterial,
} from "./aggregate.test.mjs?fixtures-only";

const workspaceId = "22222222-2222-4222-8222-222222222222";
const projectId = "55555555-5555-4555-8555-555555555555";
const issueId = "66666666-6666-4666-8666-666666666666";
const processRunId = "99999999-9999-4999-8999-999999999999";
const commentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const reviewBundle = {
  artifact_id: "77777777-7777-4777-8777-777777777777",
  version_id: "88888888-8888-4888-8888-888888888888",
  kind: "document",
  role: "evidence",
};
const reviewLinks = [
  { entity_type: "project", entity_id: projectId, relation: "output" },
  { entity_type: "work_item", entity_id: issueId, relation: "output" },
  { entity_type: "process_run", entity_id: processRunId, relation: "output" },
];

function refKey(ref) {
  return `${ref.artifact_id}@${ref.version_id}`;
}

function digestBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function reviewPayload(sourceArtifact, aggregate, storedDecision) {
  return {
    schema_version: "nuanu.qa-review-bundle.v1",
    workspace_id: workspaceId,
    project_id: projectId,
    work_item_id: issueId,
    source_artifact: structuredClone(sourceArtifact),
    aggregate: structuredClone(aggregate),
    stored_decision: storedDecision === undefined ? null : structuredClone(storedDecision),
  };
}

function installReviewMaterial(store, payload, links = reviewLinks) {
  const bytes = Buffer.from(canonicalJson(payload));
  store.set(refKey(reviewBundle), {
    workspace_id: workspaceId,
    enforced_max_bytes: null,
    byte_length: bytes.byteLength,
    links: structuredClone(links),
    artifact: {
      id: reviewBundle.artifact_id,
      workspace_id: workspaceId,
      status: "stored",
      current_version: reviewBundle.version_id,
      kind: "document",
      name: "review-bundle.json",
      mime_type: "application/json",
      versions: [{
        id: reviewBundle.version_id,
        version: 1,
        file_asset: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        size: bytes.byteLength,
        checksum: digestBytes(bytes),
      }],
    },
    bytes,
  });
}

function noneReceipt(runId = processRunId, attemptId = "attempt-1") {
  const environmentId = "generic-env";
  return {
    environment_status: "NOT_REQUIRED",
    run_id: runId,
    attempt_id: attemptId,
    environment_id: environmentId,
    target_namespace: sha256({ run_id: runId, attempt_id: attemptId, environment_id: environmentId }).slice(7),
  };
}

async function trustedFixture({ none = false, storedDecision = "derived", reviewMutator, sourceMutator, entryOverrides = {}, expectedRoute = "READY_FOR_PRODUCTION" } = {}) {
  const applicability = none ? { code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" } : undefined;
  const aggregateBase = aggregateFixture({
    applicability,
    receipt: none ? noneReceipt() : undefined,
    entryOverrides,
    profileOverrides: none ? { environment: { strategy: "none" } } : {},
  });
  const sourceArtifact = aggregateBase.plan.source_artifact;
  const aggregate = await aggregateFixtureResult(aggregateBase);
  if (expectedRoute === "READY_FOR_PRODUCTION") assert.equal(aggregate.invariants_passed, true);
  const decision = await decideRelease(aggregate, {}, aggregateBase.dependencies);
  assert.equal(decision.route, expectedRoute);
  if (sourceMutator) sourceMutator(platformMaterial(aggregateBase.platformStore, sourceArtifact));
  const stored = storedDecision === "derived" ? decision : storedDecision;
  const review = reviewPayload(sourceArtifact, aggregate, stored);
  installReviewMaterial(aggregateBase.store, reviewMutator ? reviewMutator(review) : review);
  const calls = { resolve: 0, profile: 0, list: 0, add: 0 };
  const state = { comments: [] };
  const dependencies = {
    resolveArtifactVersion: async (request) => {
      calls.resolve += 1;
      assert.equal(request.max_bytes <= 262_144 || request.max_bytes === aggregate.max_evidence_bytes, true);
      const record = aggregateBase.store.get(refKey(request.ref));
      if (!record || request.workspace_id !== workspaceId || record.byte_length > request.max_bytes) return null;
      return { ...record, enforced_max_bytes: request.max_bytes, links: structuredClone(record.links), bytes: Buffer.from(record.bytes) };
    },
    resolvePlatformEntityVersion: async (request) => aggregateBase.dependencies.resolvePlatformEntityVersion(request),
    resolveProfileAtCommit: async (request) => {
      calls.profile += 1;
      return aggregateBase.dependencies.resolveProfileAtCommit(request);
    },
    listIssueComments: async (request) => {
      calls.list += 1;
      assert.deepEqual(request, {
        workspace_id: workspaceId,
        project_id: projectId,
        issue_id: issueId,
        max_comments: COMMENT_LIST_MAX_COMMENTS,
        max_bytes: COMMENT_LIST_MAX_BYTES,
      });
      return boundedCommentList(state.comments);
    },
    addIssueComment: async (request) => {
      calls.add += 1;
      state.comments.push(comment(request.comment_html));
      return { accepted: true };
    },
  };
  return { aggregateBase, aggregate, decision, sourceArtifact, calls, state, dependencies };
}

function publicationInput(fixture, overrides = {}) {
  return {
    workspace_id: workspaceId,
    project_id: projectId,
    issue_id: issueId,
    source_artifact: structuredClone(fixture.sourceArtifact),
    review_bundle: structuredClone(reviewBundle),
    ...overrides,
  };
}

function comment(commentHtml, overrides = {}) {
  return {
    comment_id: commentId,
    workspace_id: workspaceId,
    project_id: projectId,
    issue_id: issueId,
    comment_html: commentHtml,
    ...overrides,
  };
}

function boundedCommentList(comments, overrides = {}) {
  const cloned = structuredClone(comments);
  return {
    comments: cloned,
    source_operation: "get_issue_comments",
    complete: true,
    total_count: cloned.length,
    truncated: false,
    enforced_max_bytes: COMMENT_LIST_MAX_BYTES,
    enforced_max_comments: COMMENT_LIST_MAX_COMMENTS,
    observed_bytes: Buffer.byteLength(canonicalJson(cloned), "utf8"),
    ...overrides,
  };
}

function stoppedReceipt(aggregate, overrides = {}) {
  return {
    environment_status: "STOPPED",
    run_id: aggregate.run_id,
    attempt_id: aggregate.attempt_id,
    environment_id: aggregate.environment_id,
    target_namespace: aggregate.target_namespace,
    instance_nonce: aggregate.instance_nonce,
    ...overrides,
  };
}

function finalizationInput(fixture, receipt, cleanup, overrides = {}) {
  return {
    ...publicationInput(fixture),
    comment_receipt: receipt,
    cleanup_receipt: cleanup,
    ...overrides,
  };
}

test("escapeHtml escapes every HTML-significant dynamic character", () => {
  assert.equal(escapeHtml(`<tag a="x">Tom & 'Ada'</tag>`), "&lt;tag a=&quot;x&quot;&gt;Tom &amp; &#39;Ada&#39;&lt;/tag&gt;");
});

test("renderer is deterministic, bounded by UTF-8 bytes, escaped, and omits aggregate bodies", async () => {
  const fixture = await trustedFixture();
  const summary = {
    selected_checks: ["code", "api", "ui", "domain"], skipped_checks: [], commit: fixture.aggregate.commit,
    content_hash: fixture.aggregate.content_hash, finding_count: 0,
  };
  const input = { source_artifact: fixture.sourceArtifact, decision: fixture.decision, review_bundle: reviewBundle, review_summary: summary };
  const first = renderComment(input);
  assert.deepEqual(first, renderComment(structuredClone(input)));
  assert.ok(Buffer.byteLength(first.comment_html, "utf8") <= COMMENT_HTML_MAX_BYTES);
  assert.equal(first.comment_html.includes("aggregate"), false);
  const hugeUnicode = structuredClone(input);
  hugeUnicode.decision.explanation.summary = "💣".repeat(COMMENT_HTML_MAX_BYTES);
  hugeUnicode.decision.decision_sha256 = sha256(Object.fromEntries(Object.entries(hugeUnicode.decision).filter(([key]) => key !== "decision_sha256")));
  assert.throws(() => renderComment(hugeUnicode), /INVALID_RELEASE_DECISION|COMMENT_HTML_SIZE_LIMIT/);
});

test("marker binds canonical source version, independently derived decision, and review version", async () => {
  const fixture = await trustedFixture();
  const marker = markerFor({ source_artifact: fixture.sourceArtifact, decision_sha256: fixture.decision.decision_sha256, review_bundle: reviewBundle });
  assert.match(marker, /^<!-- nuanu-qah-comment:v1:[a-f0-9]{64} -->$/);
  assert.notEqual(marker, markerFor({ source_artifact: fixture.sourceArtifact, decision_sha256: `sha256:${"f".repeat(64)}`, review_bundle: reviewBundle }));
});

test("caller decision and route substitution have zero authority", async () => {
  const fixture = await trustedFixture();
  await assert.rejects(publishComment(publicationInput(fixture, { decision: { route: "RETURN_TO_IN_PROGRESS" } }), fixture.dependencies), /INVALID_PUBLICATION_INPUT/);
  assert.equal(fixture.calls.list, 0);
});

test("trusted review aggregate is independently revalidated and stored decision must exactly match", async () => {
  const wrong = { schema_version: "nuanu.qa-release-route.v1", route: "RETURN_TO_IN_PROGRESS" };
  const fixture = await trustedFixture({ storedDecision: wrong });
  await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /STORED_DECISION_MISMATCH/);
  assert.equal(fixture.calls.list, 0);
  assert.ok(fixture.calls.resolve > 2, "Task5 material refs were re-read");
  assert.ok(fixture.calls.profile > 0, "profile was re-read at pinned commit");
});

test("review bundle requires three output links and permits only the documented automatic work_item/about link", async () => {
  const fixture = await trustedFixture();
  const record = material(fixture.aggregateBase.store, reviewBundle);
  record.links = [...reviewLinks, { entity_type: "work_item", entity_id: issueId, relation: "about" }];
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  assert.equal(receipt.publication_status, "ADDED");
  for (const extra of [
    { entity_type: "project", entity_id: projectId, relation: "about" },
    { entity_type: "work_item", entity_id: issueId, relation: "attachment" },
  ]) {
    const hostile = await trustedFixture();
    material(hostile.aggregateBase.store, reviewBundle).links = [...reviewLinks, extra];
    await assert.rejects(publishComment(publicationInput(hostile), hostile.dependencies), /REVIEW_BUNDLE_MISMATCH/);
  }
  const missing = await trustedFixture();
  material(missing.aggregateBase.store, reviewBundle).links = reviewLinks.slice(1);
  await assert.rejects(publishComment(publicationInput(missing), missing.dependencies), /REVIEW_BUNDLE_MISMATCH/);
});

test("invalid aggregate axes never become cleanup authority even with null or matching stored decision", async () => {
  for (const stored of ["null", "matching"]) {
    const fixture = await trustedFixture();
    const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
    const forged = structuredClone(fixture.aggregate);
    forged.attempt_id = "forged-attempt";
    forged.environment_id = "forged-env";
    forged.target_namespace = sha256({ run_id: forged.run_id, attempt_id: forged.attempt_id, environment_id: forged.environment_id }).slice(7);
    forged.instance_nonce = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    delete forged.aggregate_sha256;
    forged.aggregate_sha256 = sha256(forged);
    const storedDecision = stored === "matching" ? await decideRelease(forged, {}, fixture.dependencies) : null;
    installReviewMaterial(fixture.aggregateBase.store, reviewPayload(fixture.sourceArtifact, forged, storedDecision));
    const cleanup = stoppedReceipt(forged);
    await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /INVALID_AGGREGATE/);
    const result = await finalizeTransition(finalizationInput(fixture, receipt, cleanup), fixture.dependencies);
    assert.equal(result.transition_allowed, false);
    assert.equal(result.target_state, "ready_for_qa");
    assert.deepEqual(result.reason_codes, ["INVALID_AGGREGATE"]);
  }
});

test("authenticated FAIL cannot publish or finalize with caller-forged invariants", async () => {
  const fixture = await trustedFixture({
    entryOverrides: { api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION", observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } },
    expectedRoute: "RETURN_TO_IN_PROGRESS",
  });
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  const forged = structuredClone(fixture.aggregate);
  forged.invariants_passed = true;
  delete forged.aggregate_sha256;
  forged.aggregate_sha256 = sha256(forged);
  const matchingFailClosedDecision = await decideRelease(forged, {}, fixture.dependencies);
  installReviewMaterial(fixture.aggregateBase.store, reviewPayload(fixture.sourceArtifact, forged, matchingFailClosedDecision));

  await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /INVALID_AGGREGATE/);
  const result = await finalizeTransition(finalizationInput(fixture, receipt, stoppedReceipt(forged)), fixture.dependencies);
  assert.deepEqual(result, {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: false,
    target_state: "ready_for_qa",
    reason_codes: ["INVALID_AGGREGATE"],
  });
});

test("unrelated source/review bundles and wrong entity/version identity fail before comments", async () => {
  for (const setup of [
    { sourceMutator: (value) => { value.artifact.metadata.project_id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"; } },
    { reviewMutator: (value) => ({ ...value, project_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }) },
  ]) {
    const fixture = await trustedFixture(setup);
    await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /SOURCE_IDENTITY_MISMATCH|REVIEW_BUNDLE_MISMATCH/);
    assert.equal(fixture.calls.list, 0);
  }
  const fixture = await trustedFixture();
  material(fixture.aggregateBase.store, reviewBundle).links = [{ entity_type: "project", entity_id: projectId, relation: "output" }];
  await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /REVIEW_BUNDLE_MISMATCH|INVALID_TRUSTED_ARTIFACT/);
  await assert.rejects(publishComment(publicationInput(fixture, { review_bundle: { ...reviewBundle, version_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" } }), fixture.dependencies), /INVALID_TRUSTED_ARTIFACT|REVIEW_BUNDLE_MISMATCH/);
});

test("live Column Start source requires exact platform entity version, MIME, snapshot, metadata, and about links", async () => {
  const mutations = [
    (record) => { record.artifact.mime_type = "application/json"; },
    (record) => { record.artifact.versions[0].file_asset = "dddddddd-dddd-4ddd-8ddd-dddddddddddd"; },
    (record) => { record.artifact.versions[0].representation.type = "file"; },
    (record) => { record.artifact.versions[0].representation.entityId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd"; },
    (record) => { record.artifact.versions[0].representation.snapshot.project_id = "dddddddd-dddd-4ddd-8ddd-dddddddddddd"; },
    (record) => { record.artifact.links[0].relation = "source"; },
    (record) => { record.artifact.links.push({ entity_type: "process_run", entity_id: processRunId, relation: "source" }); },
  ];
  for (const mutate of mutations) {
    const fixture = await trustedFixture({ sourceMutator: mutate });
    await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /SOURCE_IDENTITY_MISMATCH|INVALID_AGGREGATE/);
    assert.equal(fixture.calls.list, 0);
  }
  const immutable = await trustedFixture({ sourceMutator: (record) => { record.artifact.current_version = "dddddddd-dddd-4ddd-8ddd-dddddddddddd"; } });
  const receipt = await publishComment(publicationInput(immutable), immutable.dependencies);
  assert.equal(receipt.source_artifact.version_id, immutable.sourceArtifact.version_id);
});

test("already-present is idempotent; zero markers uses add plus authoritative global read-back", async () => {
  let fixture = await trustedFixture();
  const added = await publishComment(publicationInput(fixture), fixture.dependencies);
  assert.equal(added.publication_status, "ADDED");
  assert.equal(fixture.calls.add, 1);
  assert.equal(fixture.calls.list, 2);

  fixture = await trustedFixture();
  const rendered = renderComment({
    source_artifact: fixture.sourceArtifact,
    decision: fixture.decision,
    review_bundle: reviewBundle,
    review_summary: { selected_checks: ["code", "api", "ui", "domain"], skipped_checks: [], commit: fixture.aggregate.commit, content_hash: fixture.aggregate.content_hash, finding_count: 0 },
  });
  fixture.state.comments.push(comment(rendered.comment_html));
  const present = await publishComment(publicationInput(fixture), fixture.dependencies);
  assert.equal(present.publication_status, "ALREADY_PRESENT");
  assert.equal(fixture.calls.add, 0);
  assert.equal(fixture.calls.list, 1);
});

test("ambiguous writes reconcile by global read-back but never claim exactly-once", async () => {
  const fixture = await trustedFixture();
  fixture.dependencies.addIssueComment = async (request) => {
    fixture.calls.add += 1;
    fixture.state.comments.push(comment(request.comment_html));
    throw new Error("unknown transport outcome with raw body");
  };
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  assert.equal(receipt.publication_status, "RECONCILED");
  assert.equal(canonicalJson(receipt).includes("raw body"), false);
});

test("duplicate, other-comment, entity-encoded, and zero-after-write markers fail closed", async () => {
  for (const mutate of [
    (fixture, html) => fixture.state.comments.push(comment(html), comment(html, { comment_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" })),
    (fixture, html) => fixture.state.comments.push(comment(html), comment(`<!-- nuanu-qah-comment:v1:${"f".repeat(64)} -->`, { comment_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" })),
    (fixture, html) => fixture.state.comments.push(comment(html.replace("<!--", "&lt;!--").replace("-->", "--&gt;"))),
  ]) {
    const fixture = await trustedFixture();
    const first = await publishComment(publicationInput(fixture), fixture.dependencies);
    const html = fixture.state.comments[0].comment_html;
    fixture.state.comments.length = 0;
    mutate(fixture, html);
    await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /DUPLICATE_COMMENT_MARKER|ENCODED_COMMENT_MARKER/);
    assert.ok(first.marker);
  }
  const fixture = await trustedFixture();
  fixture.dependencies.addIssueComment = async () => ({ accepted: true });
  await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /COMMENT_NOT_FOUND_AFTER_WRITE/);
});

test("comment adapter must attest exact global bounds/bytes and reject cyclic output", async () => {
  for (const result of [
    { comments: [], enforced_max_bytes: COMMENT_LIST_MAX_BYTES, enforced_max_comments: COMMENT_LIST_MAX_COMMENTS },
    boundedCommentList([], { observed_bytes: 99 }),
    boundedCommentList([], { enforced_max_bytes: COMMENT_LIST_MAX_BYTES + 1 }),
    boundedCommentList([], { complete: false }),
    boundedCommentList([], { total_count: 1 }),
    boundedCommentList([], { truncated: true }),
    boundedCommentList([], { source_operation: "search_issue_comments" }),
  ]) {
    const fixture = await trustedFixture();
    fixture.dependencies.listIssueComments = async () => result;
    await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /INVALID_COMMENT_READBACK|UNATTESTED_COMMENT_BOUND/);
  }
  const fixture = await trustedFixture();
  const cyclic = []; cyclic.push(cyclic);
  fixture.dependencies.listIssueComments = async () => ({ comments: cyclic, source_operation: "get_issue_comments", complete: true, total_count: 1, truncated: false, enforced_max_bytes: COMMENT_LIST_MAX_BYTES, enforced_max_comments: COMMENT_LIST_MAX_COMMENTS, observed_bytes: 1 });
  await assert.rejects(publishComment(publicationInput(fixture), fixture.dependencies), /INVALID_COMMENT_READBACK/);

  const hostile = await trustedFixture();
  hostile.dependencies.listIssueComments = async () => new Proxy({}, { ownKeys() { throw new Error("hostile raw body"); } });
  await assert.rejects(publishComment(publicationInput(hostile), hostile.dependencies), /UNATTESTED_COMMENT_BOUND|INVALID_COMMENT_READBACK/);
});

test("managed STOPPED exact lease plus one trusted global marker gates READY transition", async () => {
  const fixture = await trustedFixture();
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  const result = await finalizeTransition(finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)), fixture.dependencies);
  assert.deepEqual(result, {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: true,
    target_state: "ready_for_production",
    reason_codes: [],
    kind: "qa",
    verdict: "pass",
    tested_head_sha: fixture.aggregate.commit,
    checks: fixture.aggregate.branches.map((branch) => ({
      name: `universal_qah_${branch.branch}`,
      status: "passed",
      evidence: `artifact:${branch.artifacts.evidence.artifact_id}@${branch.artifacts.evidence.version_id}`,
    })),
  });
});

test("a structurally and authentically valid FAIL aggregate still cleans up and maps to in_progress", async () => {
  const fixture = await trustedFixture({
    entryOverrides: { api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION", observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } },
    expectedRoute: "RETURN_TO_IN_PROGRESS",
  });
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  const result = await finalizeTransition(finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)), fixture.dependencies);
  assert.deepEqual(result, {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: true,
    target_state: "in_progress",
    reason_codes: [],
    kind: "qa",
    verdict: "fail",
    tested_head_sha: fixture.aggregate.commit,
    checks: fixture.aggregate.branches.map((branch) => ({
      name: `universal_qah_${branch.branch}`,
      status: branch.branch === "api" ? "failed" : "passed",
      evidence: `artifact:${branch.artifacts.evidence.artifact_id}@${branch.artifacts.evidence.version_id}`,
    })),
  });
});

test("managed ABSENT/missing nonce and recovery uncertainty always block", async () => {
  const fixture = await trustedFixture();
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  for (const cleanup of [
    { ...stoppedReceipt(fixture.aggregate), environment_status: "ABSENT", instance_nonce: undefined },
    { ...stoppedReceipt(fixture.aggregate), environment_status: "STOPPED", instance_nonce: undefined },
    { ...stoppedReceipt(fixture.aggregate), environment_status: "RECOVERY_REQUIRED", reason: "uncertain" },
  ]) {
    if (cleanup.instance_nonce === undefined) delete cleanup.instance_nonce;
    const result = await finalizeTransition(finalizationInput(fixture, receipt, cleanup), fixture.dependencies);
    assert.equal(result.transition_allowed, false);
    assert.equal(result.target_state, "ready_for_qa");
    assert.ok(result.reason_codes.some((code) => code.startsWith("CLEANUP_")));
  }
});

test("strategy none accepts only the exact real Task3 lease-free ABSENT receipt", async (t) => {
  const fixture = await trustedFixture({ none: true });
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  const root = await mkdtemp(join(tmpdir(), "qah-finalize-none-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cleanup = await cleanupEnvironment({
    profile: fixture.aggregateBase.profile,
    repositoryOrigin: fixture.aggregate.repository_origin,
    commit: fixture.aggregate.commit,
    runId: fixture.aggregate.run_id,
    attemptId: fixture.aggregate.attempt_id,
    environmentId: fixture.aggregate.environment_id,
    root,
  });
  assert.equal(cleanup.environment_status, "ABSENT");
  assert.equal("instance_nonce" in cleanup, false);
  const result = await finalizeTransition(finalizationInput(fixture, receipt, cleanup), fixture.dependencies);
  assert.equal(result.transition_allowed, true);
  assert.equal(result.target_state, "ready_for_production");
  const stopped = await finalizeTransition(finalizationInput(fixture, receipt, { ...cleanup, environment_status: "STOPPED", instance_nonce: "11111111-1111-4111-8111-111111111111" }), fixture.dependencies);
  assert.equal(stopped.transition_allowed, false);
});

test("finalizer performs a fresh full global read and catches TOCTOU UUID/body/marker changes", async () => {
  for (const mutate of [
    (fixture) => { fixture.state.comments[0].comment_id = "ffffffff-ffff-4fff-8fff-ffffffffffff"; },
    (fixture) => { fixture.state.comments[0].comment_html += "changed"; },
    (fixture) => { fixture.state.comments.push(comment(`<!-- nuanu-qah-comment:v1:${"e".repeat(64)} -->`, { comment_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" })); },
  ]) {
    const fixture = await trustedFixture();
    const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
    mutate(fixture);
    const result = await finalizeTransition(finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)), fixture.dependencies);
    assert.equal(result.transition_allowed, false);
    assert.ok(result.reason_codes.some((code) => code.startsWith("COMMENT_")));
  }
});

test("finalizer rejects a comment adapter that stops attesting complete get_issue_comments output", async () => {
  const fixture = await trustedFixture();
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  fixture.dependencies.listIssueComments = async () => boundedCommentList(fixture.state.comments, { complete: false });
  const result = await finalizeTransition(finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)), fixture.dependencies);
  assert.equal(result.transition_allowed, false);
  assert.deepEqual(result.reason_codes, ["COMMENT_READBACK_INVALID"]);
});

test("final output is closed and no caller mutation callback is invoked", async () => {
  const fixture = await trustedFixture();
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  let mutationCalls = 0;
  fixture.dependencies.updateIssue = async () => { mutationCalls += 1; };
  const result = await finalizeTransition(finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)), fixture.dependencies);
  assert.deepEqual(Object.keys(result).sort(), ADMITTED_KEYS);
  assert.equal(mutationCalls, 0);
});

const ADMITTED_KEYS = [
  "checks", "kind", "reason_codes", "schema_version", "target_state",
  "tested_head_sha", "transition_allowed", "verdict",
];
const DIAGNOSTIC_KEYS = ["reason_codes", "schema_version", "target_state", "transition_allowed"];

async function admit(fixture) {
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  return finalizeTransitionAdmission(
    finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)),
    fixture.dependencies,
  );
}

test("admission returns the exact PASS report plus separate trusted authority", async () => {
  const fixture = await trustedFixture();
  const admitted = await admit(fixture);
  assert.deepEqual(Object.keys(admitted).sort(), ["aggregate", "decision", "report"]);
  assert.deepEqual(Object.keys(admitted.report).sort(), ADMITTED_KEYS);
  assert.deepEqual(admitted.report, {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: true,
    target_state: "ready_for_production",
    reason_codes: [],
    kind: "qa",
    verdict: "pass",
    tested_head_sha: fixture.aggregate.commit,
    checks: fixture.aggregate.branches.map((branch) => ({
      name: `universal_qah_${branch.branch}`,
      status: "passed",
      evidence: `artifact:${branch.artifacts.evidence.artifact_id}@${branch.artifacts.evidence.version_id}`,
    })),
  });
  assert.deepEqual(admitted.aggregate, fixture.aggregate);
  assert.deepEqual(admitted.decision, fixture.decision);
  assert.notEqual(admitted.aggregate, fixture.aggregate);
  assert.notEqual(admitted.decision, fixture.decision);
});

test("admission returns exact FAIL and HOLD reports without laundering blockers", async (t) => {
  const cases = [
    ["product failure", {
      fixture: {
        entryOverrides: { api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION", observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } },
        expectedRoute: "RETURN_TO_IN_PROGRESS",
      },
      expected: { target_state: "in_progress", verdict: "fail", failed: ["universal_qah_api"] },
    }],
    ["infrastructure uncertainty", {
      fixture: {
        entryOverrides: { api: { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0, code: "TRANSPORT_FAILURE" } },
        expectedRoute: "HOLD_IN_READY_FOR_QA",
      },
      expected: { target_state: "ready_for_qa", verdict: "blocked", failed: [] },
    }],
  ];
  for (const [name, row] of cases) await t.test(name, async () => {
    const fixture = await trustedFixture(row.fixture);
    const admitted = await admit(fixture);
    assert.deepEqual(Object.keys(admitted.report).sort(), ADMITTED_KEYS);
    assert.equal(admitted.report.target_state, row.expected.target_state);
    assert.equal(admitted.report.verdict, row.expected.verdict);
    assert.deepEqual(admitted.report.checks.filter(({ status }) => status === "failed").map(({ name: checkName }) => checkName), row.expected.failed);
    assert.equal(admitted.report.tested_head_sha, fixture.aggregate.commit);
  });
});

test("every post-review integrity failure returns only a neutral diagnostic", async () => {
  const fixture = await trustedFixture();
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  fixture.dependencies.listIssueComments = async () => boundedCommentList(fixture.state.comments, { complete: false });
  const admitted = await finalizeTransitionAdmission(
    finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)),
    fixture.dependencies,
  );
  assert.deepEqual(admitted, {
    report: {
      schema_version: "nuanu.qa-finalization-result.v1",
      transition_allowed: false,
      target_state: "ready_for_qa",
      reason_codes: ["COMMENT_READBACK_INVALID"],
    },
    aggregate: null,
    decision: null,
  });
  assert.deepEqual(Object.keys(admitted.report).sort(), DIAGNOSTIC_KEYS);
});

test("pure classification agreement rejects a digest-valid route mismatch", async () => {
  const fixture = await trustedFixture();
  const { decision_sha256: ignored, ...unsigned } = fixture.decision;
  const mismatchedUnsigned = { ...unsigned, route: "RETURN_TO_IN_PROGRESS" };
  const mismatched = { ...mismatchedUnsigned, decision_sha256: sha256(mismatchedUnsigned) };
  assert.throws(
    () => validateFinalizationClassification({ aggregate: fixture.aggregate, decision: mismatched }),
    /FINALIZATION_CLASSIFICATION_INVALID/,
  );
});

test("pure classification agreement normalizes malformed boundary inputs", () => {
  for (const input of [null, undefined, {}, { aggregate: null }, { decision: null }, { aggregate: null, decision: null, extra: true }]) {
    assert.throws(
      () => validateFinalizationClassification(input),
      /FINALIZATION_CLASSIFICATION_INVALID/,
    );
  }
});
