import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import YAML from "yaml";
import { loadWorkerCompletionValidator } from "./helpers/worker-contract.mjs";

import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { resolveContext } from "../../scripts/qah/context.mjs";
import { decideRelease } from "../../scripts/qah/decide.mjs";
import { createSyntheticGraphPlan } from "../../scripts/qah/graph-plan.mjs";
import { renderComment } from "../../scripts/qah/render-comment.mjs";
import {
  GRAPH_TASK_COMMANDS,
  TASK_COMMAND_KEYS,
  TASK_PROTOCOLS,
  createResolverAdapters,
  normalizeRawIssueComments,
  readCanonicalInputFile,
  runTaskCommand,
  verifyProfileInstallPrecondition,
} from "../../scripts/qah/task-runtime.mjs";
import { aggregateFixture, aggregateFixtureResult } from "./aggregate.test.mjs?fixtures-only";

const { buildCanonicalCompletion } = await loadWorkerCompletionValidator();
const execFile = promisify(execFileCallback);

const GRAPH_COMMANDS = [
  "resolve-flow-item", "load-project-context", "plan-qa-scope", "prepare-environment",
  "verify-requirements-and-code", "verify-api-contracts", "verify-ui-with-playwright",
  "prepare-and-verify-domain-data", "aggregate-evidence", "independent-release-decision",
  "publish-flow-item-comment", "cleanup-environment", "finalize-transition",
];
let artifactSequence = 200;

function actualRef(role = "output") {
  artifactSequence += 1;
  return {
    artifact_id: `20000000-0000-4000-8000-${String(artifactSequence).padStart(12, "0")}`,
    version_id: `30000000-0000-4000-8000-${String(artifactSequence).padStart(12, "0")}`,
    kind: "document",
    role,
  };
}

function validateWorkerCompletion(command, result) {
  const stepKey = TASK_COMMAND_KEYS[command];
  assert.ok(stepKey, command);
  const artifactSlots = TASK_PROTOCOLS[stepKey].artifact_slots;
  const outputDefinition = {
    data: Object.fromEntries(Object.entries(result.item.data).map(([key, value]) => [key, {
      type: typeof value === "boolean" ? "boolean" : typeof value === "number" ? "number" : typeof value === "string" ? "string" : "json",
      description: `Closed ${stepKey}.${key} test contract`,
    }])),
    artifacts: Object.fromEntries(artifactSlots.map((slot) => [slot, {
      kind: "document",
      description: `Closed ${stepKey}.${slot} test artifact`,
      restrictions: { media_types: ["application/json"] },
    }])),
  };
  const completion = buildCanonicalCompletion({
    task_id: `task-${command}`, attempt: 1,
    request: { process: { step_key: stepKey }, output_definition: outputDefinition },
  }, { output: canonicalJson(result), publishedArtifacts: [] });
  assert.equal(completion.result.item.key, stepKey);
  assert.deepEqual(Object.keys(completion.result.artifact_outputs).sort(), artifactSlots.map((slot) => `item.artifacts.${slot}`).sort());
  for (const output of Object.values(completion.result.artifact_outputs)) assert.equal(output.mode, "reference");
}

function base64(value) {
  return Buffer.from(value).toString("base64");
}

function runtimeOptions(root, command, extra = {}) {
  return { outputDir: join(root, "qah", command), taskRoot: root, ...extra };
}

async function completePrepared(root, command, artifact_refs, extra = {}) {
  const result = await runTaskCommand(command, { phase: "complete", artifact_refs }, runtimeOptions(root, command, extra));
  validateWorkerCompletion(command, result);
  return result;
}

function graphEvent(projectKey) {
  return {
    schema_version: "nuanu.qa-column-ticket-event.v1",
    event_id: "event-generic-101-ready-for-qa",
    ticket_id: "GEN-101",
    project_key: projectKey,
    from_state: "in_progress",
    to_state: "ready_for_qa",
    candidate: {
      candidate_id: "candidate-profile-change",
      candidate_revision: sha256("offline-candidate-profile-change"),
      environment_id: "offline-generic",
      change_hints: ["profile-api", "profile-ui"],
    },
    triggered_at: "2026-08-12T00:00:00.000Z",
  };
}

function serializedBundle(fixture, comments = []) {
  const artifact_versions = [...fixture.store.entries()].map(([key, record]) => ({
    key,
    response: {
      ...record,
      bytes_base64: base64(record.bytes),
      bytes: undefined,
    },
  })).map(({ key, response }) => ({ key, response: Object.fromEntries(Object.entries(response).filter(([, value]) => value !== undefined)) }));
  const platform_entity_versions = [...fixture.platformStore.entries()].map(([key, response]) => ({ key, response }));
  const profileBytes = Buffer.from(YAML.stringify(fixture.profile));
  return {
    schema_version: "nuanu.qa-runtime-resolver-bundle.v1",
    artifact_versions,
    platform_entity_versions,
    commit_profiles: [{
      key: `${fixture.input.repository_origin}@${fixture.input.plan.commit}:qa-harness.yaml`,
      response: {
        repository_origin: fixture.input.repository_origin,
        commit: fixture.input.plan.commit,
        path: "qa-harness.yaml",
        byte_length: profileBytes.byteLength,
        enforced_max_bytes: 262144,
        sha256: `sha256:${createHash("sha256").update(profileBytes).digest("hex")}`,
        bytes_base64: profileBytes.toString("base64"),
      },
    }],
    comment_reads: [{ attestation: normalizeRawIssueComments(comments, {
      workspace_id: fixture.input.workspace_id,
      project_id: "55555555-5555-4555-8555-555555555555",
      issue_id: "66666666-6666-4666-8666-666666666666",
    }) }],
    branch_execution: null,
  };
}

async function cleanGitCheckout(t, origin = "https://example.test/generic/product.git") {
  const checkout = await mkdtemp(join(tmpdir(), "qah-runtime-git-"));
  t.after(() => rm(checkout, { recursive: true, force: true }));
  await execFile("git", ["init", "--quiet"], { cwd: checkout });
  await execFile("git", ["config", "user.email", "qa@example.test"], { cwd: checkout });
  await execFile("git", ["config", "user.name", "QA Harness"], { cwd: checkout });
  await execFile("git", ["remote", "add", "origin", origin], { cwd: checkout });
  await writeFile(join(checkout, "tracked.txt"), "pinned\n");
  await execFile("git", ["add", "tracked.txt"], { cwd: checkout });
  await execFile("git", ["commit", "--quiet", "-m", "fixture"], { cwd: checkout });
  const { stdout } = await execFile("git", ["rev-parse", "HEAD"], { cwd: checkout });
  return { checkout: await realpath(checkout), commit: stdout.trim(), origin };
}

function repositoryOnlyBranchInput(fixture, commit, command = [process.execPath, "--version"]) {
  const profile = structuredClone(fixture.profile);
  profile.environment = { strategy: "none" };
  profile.checks.code = command;
  const plan = structuredClone(fixture.plan);
  plan.commit = commit;
  plan.profile_digest = sha256(profile);
  plan.artifact_slot = { ...plan.artifact_slot, commit, profile_digest: plan.profile_digest };
  const { plan_sha256: _old, ...unsigned } = plan;
  plan.plan_sha256 = sha256(unsigned);
  const runId = "99999999-9999-4999-8999-999999999999";
  const attemptId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const environmentId = "repository-only";
  return {
    plan,
    profile,
    environmentReceipt: {
      environment_status: "NOT_REQUIRED",
      run_id: runId,
      attempt_id: attemptId,
      environment_id: environmentId,
      target_namespace: sha256({ run_id: runId, attempt_id: attemptId, environment_id: environmentId }).slice(7),
    },
    runId,
    attemptId,
  };
}

async function repositoryOnlyResult(t, branchInput, branch_execution) {
  const root = await mkdtemp(join(tmpdir(), "qah-runtime-repository-only-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = aggregateFixture();
  const bundle = serializedBundle(fixture);
  bundle.branch_execution = {
    result: { exitCode: 0, signal: null, stdout: "fabricated success", stderr: "" },
    ...branch_execution,
  };
  await runTaskCommand("verify-requirements-and-code", {
    phase: "prepare",
    branch_input: branchInput,
  }, runtimeOptions(root, "verify-requirements-and-code", { resolverBundle: bundle }));
  const payload = JSON.parse(await readFile(join(root, "qah", "verify-requirements-and-code", "branch-payload.json"), "utf8"));
  return { ...payload.branch_result, execution_data: payload.execution_data };
}

test("runtime exposes one explicit executable subcommand for every graph Agent Task", () => {
  assert.deepEqual(GRAPH_TASK_COMMANDS, GRAPH_COMMANDS);
  for (const command of GRAPH_COMMANDS) assert.equal(typeof runTaskCommand, "function", command);
});

test("canonical input reader is bounded, exact, and never accepts empty or padded JSON", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-runtime-input-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = join(root, "input.json");
  await writeFile(file, canonicalJson({ value: 1 }));
  assert.deepEqual(await readCanonicalInputFile(file, 32), { value: 1 });
  await writeFile(file, `${canonicalJson({ value: 1 })}\n`);
  await assert.rejects(readCanonicalInputFile(file, 32), /canonical/);
  await writeFile(file, "");
  await assert.rejects(readCanonicalInputFile(file, 32), /empty|bound/);
  await writeFile(file, canonicalJson({ value: "x".repeat(100) }));
  await assert.rejects(readCanonicalInputFile(file, 32), /bound/);
});

test("raw full get_issue_comments adapter attests only a complete post-fetch bounded list", () => {
  const identity = {
    workspace_id: "22222222-2222-4222-8222-222222222222",
    project_id: "55555555-5555-4555-8555-555555555555",
    issue_id: "66666666-6666-4666-8666-666666666666",
  };
  const raw = [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", comment_html: "<p>ok</p>" }];
  const result = normalizeRawIssueComments(raw, identity);
  assert.deepEqual(result, {
    comments: [{ comment_id: raw[0].id, ...identity, comment_html: raw[0].comment_html }],
    source_operation: "get_issue_comments",
    complete: true,
    total_count: 1,
    truncated: false,
    enforced_max_bytes: 1048576,
    enforced_max_comments: 100,
    observed_bytes: Buffer.byteLength(canonicalJson([{ comment_id: raw[0].id, ...identity, comment_html: raw[0].comment_html }]), "utf8"),
  });
  assert.throws(() => normalizeRawIssueComments(Array(101).fill(raw[0]), identity), /comment.*limit/i);
  assert.deepEqual(normalizeRawIssueComments([{ ...raw[0], extra: true }], identity).comments, result.comments);
});

test("resolver bundle adapter is exact and profile install precondition proves Artifact bytes equal pinned Git bytes", async () => {
  const fixture = aggregateFixture({ profileOverrides: { environment: { strategy: "none" } } });
  const bundle = serializedBundle(fixture);
  const dependencies = createResolverAdapters(bundle);
  const installed = await verifyProfileInstallPrecondition({
    workspace_id: fixture.input.workspace_id,
    profile_artifact: fixture.input.profile_artifact,
    repository_origin: fixture.input.repository_origin,
    commit: fixture.input.plan.commit,
    profile_digest: sha256(fixture.profile),
  }, dependencies);
  assert.equal(installed.installed, true);
  assert.equal(installed.profile_digest, sha256(fixture.profile));
  assert.equal(installed.profile_blob_sha256, bundle.commit_profiles[0].response.sha256);
  const hostile = structuredClone(bundle);
  hostile.unknown = true;
  assert.throws(() => createResolverAdapters(hostile), /resolver bundle.*exact/i);
  const changed = structuredClone(bundle);
  changed.commit_profiles[0].response.bytes_base64 = Buffer.from("changed").toString("base64");
  const changedDependencies = createResolverAdapters(changed);
  await assert.rejects(verifyProfileInstallPrecondition({
    workspace_id: fixture.input.workspace_id,
    profile_artifact: fixture.input.profile_artifact,
    repository_origin: fixture.input.repository_origin,
    commit: fixture.input.plan.commit,
    profile_digest: sha256(fixture.profile),
  }, changedDependencies), /profile.*(?:bytes|digest|Git)/i);
});

test("repository-only runtime fails closed for nonexistent, wrong-commit, and dirty Git checkouts", async (t) => {
  const fixture = aggregateFixture();
  const repository = await cleanGitCheckout(t);
  const nonexistent = repositoryOnlyBranchInput(fixture, repository.commit);
  const nonexistentResult = await repositoryOnlyResult(t, nonexistent, { checkout: join(repository.checkout, "missing") });
  assert.deepEqual([nonexistentResult.product_result, nonexistentResult.evidence_status], ["INCONCLUSIVE", "PARTIAL"]);

  const wrongCommit = repositoryOnlyBranchInput(fixture, "b".repeat(40));
  const wrongCommitResult = await repositoryOnlyResult(t, wrongCommit, { checkout: repository.checkout });
  assert.deepEqual([wrongCommitResult.product_result, wrongCommitResult.evidence_status], ["INCONCLUSIVE", "PARTIAL"]);

  await writeFile(join(repository.checkout, "tracked.txt"), "dirty\n");
  const dirty = repositoryOnlyBranchInput(fixture, repository.commit);
  const dirtyResult = await repositoryOnlyResult(t, dirty, { checkout: repository.checkout });
  assert.deepEqual([dirtyResult.product_result, dirtyResult.evidence_status], ["INCONCLUSIVE", "PARTIAL"]);
});

test("repository-only runtime executes the pinned profile argv and never accepts a fabricated success result", async (t) => {
  const fixture = aggregateFixture();
  const repository = await cleanGitCheckout(t);
  const passingInput = repositoryOnlyBranchInput(fixture, repository.commit);
  const passing = await repositoryOnlyResult(t, passingInput, { checkout: repository.checkout });
  assert.equal(passing.product_result, "PASS", JSON.stringify(passing));
  const branchInput = repositoryOnlyBranchInput(fixture, repository.commit, [process.execPath, "-p", "missingIdentifier"]);
  const fabricated = serializedBundle(fixture);
  fabricated.branch_execution = {
    checkout: repository.checkout,
    result: { exitCode: 0, signal: null, stdout: "forged success", stderr: "" },
  };
  const result = await repositoryOnlyResult(t, branchInput, fabricated.branch_execution);
  assert.equal(result.product_result, "FAIL", JSON.stringify(result));
  assert.equal(result.execution_data.code, "COMMAND_FAILED");
  assert.equal(result.execution_data.environment_status, "NOT_REQUIRED");
});

test("non-interactive graph commands execute real Task1-6 functions with trusted adapters", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-runtime-commands-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const applicability = { code: "NOT_APPLICABLE", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" };
  const fixture = aggregateFixture({ applicability, profileOverrides: { environment: { strategy: "none" } } });
  const bundle = serializedBundle(fixture);
  const dependencies = createResolverAdapters(bundle);
  const raw_context = {
    source_artifact: fixture.plan.source_artifact,
    issue_uuid: "66666666-6666-4666-8666-666666666666",
    project_uuid: "55555555-5555-4555-8555-555555555555",
    project_key: fixture.profile.project_key,
    repository_origin: fixture.profile.repository.allowed_origin,
    commit: fixture.plan.commit,
    content_hash: fixture.plan.content_hash,
    profile_digest: sha256(fixture.profile),
    changed_files: ["README.md"], labels: [], acceptance_capabilities: [], wiki_artifacts: [],
  };
  const profile_install = {
    workspace_id: fixture.input.workspace_id, profile_artifact: fixture.input.profile_artifact,
    repository_origin: fixture.input.repository_origin, commit: fixture.plan.commit, profile_digest: sha256(fixture.profile),
  };
  const resolved = await runTaskCommand("resolve-flow-item", {
    phase: "prepare",
    workspace_id: fixture.input.workspace_id, project_id: raw_context.project_uuid, issue_id: raw_context.issue_uuid,
    source_artifact: fixture.plan.source_artifact,
    profile_artifact: fixture.input.profile_artifact,
  }, runtimeOptions(root, "resolve-flow-item", { dependencies }));
  assert.equal(resolved.files[0].name, "resolve-flow-item.json");
  const resolvedFinal = await completePrepared(root, "resolve-flow-item", { resolved_item: actualRef() }, { dependencies });
  assert.deepEqual(resolvedFinal.item.data.profile_ref, fixture.input.profile_artifact);
  const loaded = await runTaskCommand("load-project-context", { phase: "prepare", raw_context, profile: fixture.profile, profile_install }, runtimeOptions(root, "load-project-context", { dependencies }));
  const context = JSON.parse(await readFile(join(root, "qah", "load-project-context", "load-project-context.json"), "utf8"));
  assert.equal(loaded.files[0].name, "load-project-context.json");
  const loadedFinal = await completePrepared(root, "load-project-context", { resolved_context: actualRef() }, { dependencies });
  const planned = await runTaskCommand("plan-qa-scope", { phase: "prepare", context, profile: fixture.profile, carry: { profile_ref: fixture.input.profile_artifact, workspace_id: fixture.input.workspace_id } }, runtimeOptions(root, "plan-qa-scope", { dependencies }));
  assert.equal(planned.files[0].name, "test-plan.json");
  const plannedFinal = await completePrepared(root, "plan-qa-scope", { test_plan: actualRef() }, { dependencies });
  assert.deepEqual(plannedFinal.item.data.test_plan_ref, plannedFinal.artifact_outputs["item.artifacts.test_plan"]);
  const runId = "99999999-9999-4999-8999-999999999999";
  const attemptId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const environmentInput = { profile: fixture.profile, repositoryOrigin: fixture.input.repository_origin, commit: fixture.plan.commit, runId, attemptId, environmentId: "generic-env" };
  const carry = { source_ref: fixture.plan.source_artifact, profile_ref: fixture.input.profile_artifact, test_plan_ref: fixture.input.plan_artifact, workspace_id: fixture.input.workspace_id, project_id: raw_context.project_uuid, issue_id: raw_context.issue_uuid };
  const prepared = await runTaskCommand("prepare-environment", { phase: "prepare", environment_input: environmentInput, carry }, runtimeOptions(root, "prepare-environment", { dependencies }));
  const cleaned = await runTaskCommand("cleanup-environment", { phase: "prepare", environment_input: environmentInput, completion_context: { source_ref: fixture.plan.source_artifact, review_bundle_ref: fixture.input.plan_artifact } }, runtimeOptions(root, "cleanup-environment", { dependencies }));
  assert.deepEqual([prepared.files[0].name, cleaned.files[0].name], ["environment-manifest.json", "cleanup-receipt.json"]);
  const preparedFinal = await completePrepared(root, "prepare-environment", { environment_manifest: actualRef() }, { dependencies });
  const cleanedFinal = await completePrepared(root, "cleanup-environment", { cleanup_receipt_report: actualRef() }, { dependencies });
  const aggregated = await runTaskCommand("aggregate-evidence", {
    phase: "prepare", aggregate_input: fixture.input, project_id: raw_context.project_uuid, issue_id: raw_context.issue_uuid,
  }, runtimeOptions(root, "aggregate-evidence", { dependencies }));
  assert.deepEqual(aggregated.files.map((file) => file.name), ["aggregate-report.json", "review-bundle.json"]);
  const aggregatedFinal = await completePrepared(root, "aggregate-evidence", { aggregate_report: actualRef(), review_bundle: actualRef("evidence") }, { dependencies });
  assert.equal(aggregatedFinal.item.data.review_bundle_ref.role, "evidence");
  const aggregate = await aggregateFixtureResult(fixture);
  const decided = await runTaskCommand("independent-release-decision", {
    aggregate, proposal: {},
    completion_context: {
      source_ref: fixture.plan.source_artifact, profile_ref: fixture.input.profile_artifact,
      review_bundle_ref: { artifact_id: "77777777-7777-4777-8777-777777777777", version_id: "88888888-8888-4888-8888-888888888888", kind: "document", role: "evidence" },
      cleanup_lease: { run_id: aggregate.run_id, attempt_id: aggregate.attempt_id, environment_id: aggregate.environment_id, target_namespace: aggregate.target_namespace, instance_nonce: aggregate.instance_nonce },
      workspace_id: fixture.input.workspace_id, project_id: raw_context.project_uuid, issue_id: raw_context.issue_uuid,
    },
  }, runtimeOptions(root, "independent-release-decision", { dependencies }));
  assert.equal(decided.item.data.decision.route, "HOLD_IN_READY_FOR_QA");
  validateWorkerCompletion("independent-release-decision", decided);
  for (const final of [resolvedFinal, loadedFinal, plannedFinal, preparedFinal, cleanedFinal, aggregatedFinal, decided]) assert.deepEqual(JSON.parse(canonicalJson(final)), final);
  for (const result of [resolved, loaded, planned, prepared, cleaned, aggregated, decided]) assert.deepEqual(JSON.parse(canonicalJson(result)), result);
});

test("every Task 4 CLI command uses actual refs across execute, link, and complete phases", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-runtime-branch-phases-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const applicability = { code: "NOT_APPLICABLE", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" };
  const fixture = aggregateFixture({ applicability, profileOverrides: { environment: { strategy: "none" } } });
  const run_id = "99999999-9999-4999-8999-999999999999";
  const attempt_id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const environment_id = "generic-env";
  const environmentReceipt = {
    environment_status: "NOT_REQUIRED", run_id, attempt_id, environment_id,
    target_namespace: sha256({ run_id, attempt_id, environment_id }).slice(7),
  };
  const branchCommands = GRAPH_COMMANDS.filter((command) => /verify|requirements/.test(command));
  for (const [index, command] of branchCommands.entries()) {
    const outputDir = join(root, "qah", command);
    const execute = await runTaskCommand(command, {
      phase: "prepare",
      branch_input: { plan: fixture.plan, profile: fixture.profile, environmentReceipt, runId: run_id, attemptId: attempt_id },
    }, { outputDir, taskRoot: root });
    assert.deepEqual(execute.files.map((file) => file.name).sort(), ["branch-payload.json", "evidence.json"]);
    const primary_refs = {
      branch_payload: { artifact_id: `00000000-0000-4000-8000-${String(index * 6 + 1).padStart(12, "0")}`, version_id: `00000000-0000-4000-8000-${String(index * 6 + 2).padStart(12, "0")}`, kind: "document", role: "output" },
      evidence: { artifact_id: `00000000-0000-4000-8000-${String(index * 6 + 3).padStart(12, "0")}`, version_id: `00000000-0000-4000-8000-${String(index * 6 + 4).padStart(12, "0")}`, kind: "document", role: "evidence" },
    };
    const linked = await runTaskCommand(command, {
      phase: "link", primary_refs,
      occurrence_context: { repository_origin: fixture.profile.repository.allowed_origin, content_hash: fixture.plan.content_hash, environment_id, instance_nonce: null },
    }, { outputDir, taskRoot: root });
    assert.deepEqual(linked.files.map((file) => file.name), ["occurrence.json"]);
    const occurrence = { artifact_id: `00000000-0000-4000-8000-${String(index * 6 + 5).padStart(12, "0")}`, version_id: `00000000-0000-4000-8000-${String(index * 6 + 6).padStart(12, "0")}`, kind: "document", role: "evidence" };
    const material_refs = { ...primary_refs, occurrence };
    const completed = await runTaskCommand(command, {
      phase: "complete", material_refs,
      completion_context: {
        source_ref: fixture.plan.source_artifact, profile_ref: fixture.input.profile_artifact, test_plan_ref: fixture.input.plan_artifact,
        environment_receipt: environmentReceipt, workspace_id: fixture.input.workspace_id,
        project_id: "55555555-5555-4555-8555-555555555555", issue_id: "66666666-6666-4666-8666-666666666666",
        run_id, attempt_id,
      },
    }, { outputDir, taskRoot: root });
    assert.deepEqual(completed.item.data.material_refs, material_refs);
    assert.deepEqual(completed.artifact_outputs, { "item.artifacts.branch_payload": primary_refs.branch_payload });
    validateWorkerCompletion(command, completed);
    assert.deepEqual((await Promise.all(["branch-payload.json", "occurrence.json", "evidence.json"].map((name) => readFile(join(outputDir, name), "utf8")))).map(JSON.parse).length, 3);
  }
});

async function preparedFinalizationFixture(t) {
  const root = await mkdtemp(join(tmpdir(), "qah-runtime-finalization-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = aggregateFixture();
  const aggregate = await aggregateFixtureResult(fixture);
  const decision = await decideRelease(aggregate, {}, fixture.dependencies);
  const review_bundle = { artifact_id: "77777777-7777-4777-8777-777777777777", version_id: "88888888-8888-4888-8888-888888888888", kind: "document", role: "evidence" };
  const project_id = "55555555-5555-4555-8555-555555555555";
  const issue_id = "66666666-6666-4666-8666-666666666666";
  const review = {
    schema_version: "nuanu.qa-review-bundle.v1", workspace_id: fixture.input.workspace_id, project_id, work_item_id: issue_id,
    source_artifact: fixture.plan.source_artifact, aggregate, stored_decision: decision,
  };
  const reviewBytes = Buffer.from(canonicalJson(review));
  fixture.store.set(`${review_bundle.artifact_id}@${review_bundle.version_id}`, {
    workspace_id: fixture.input.workspace_id, enforced_max_bytes: null, byte_length: reviewBytes.byteLength,
    links: [
      { entity_type: "project", entity_id: project_id, relation: "output" },
      { entity_type: "work_item", entity_id: issue_id, relation: "output" },
      { entity_type: "process_run", entity_id: aggregate.run_id, relation: "output" },
    ],
    artifact: {
      id: review_bundle.artifact_id, workspace_id: fixture.input.workspace_id, status: "stored", current_version: review_bundle.version_id,
      kind: "document", name: "review-bundle.json", mime_type: "application/json",
      versions: [{ id: review_bundle.version_id, version: 1, file_asset: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", size: reviewBytes.byteLength, checksum: createHash("sha256").update(reviewBytes).digest("hex") }],
    },
    bytes: reviewBytes,
  });
  const publication_input = { workspace_id: fixture.input.workspace_id, project_id, issue_id, source_artifact: fixture.plan.source_artifact, review_bundle };
  const rendered = renderComment({
    source_artifact: fixture.plan.source_artifact, decision, review_bundle,
    review_summary: {
      selected_checks: aggregate.branches.filter((branch) => branch.applicability === "REQUIRED").map((branch) => branch.branch),
      skipped_checks: aggregate.branches.filter((branch) => branch.applicability === "NOT_APPLICABLE").map((branch) => branch.branch),
      commit: aggregate.commit, content_hash: aggregate.content_hash,
      finding_count: aggregate.branches.reduce((sum, branch) => sum + branch.confirmed_findings, 0),
    },
  });
  const rawComment = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", comment_html: rendered.comment_html };
  const publishBundle = serializedBundle(fixture);
  publishBundle.comment_reads = [[], [rawComment]].map((comments) => ({ attestation: normalizeRawIssueComments(comments, {
    workspace_id: fixture.input.workspace_id, project_id, issue_id,
  }) }));
  await runTaskCommand("publish-flow-item-comment", { phase: "prepare", publication_input, completion_context: {
    decision, profile_ref: fixture.input.profile_artifact,
    cleanup_lease: { run_id: aggregate.run_id, attempt_id: aggregate.attempt_id, environment_id: aggregate.environment_id, target_namespace: aggregate.target_namespace, instance_nonce: aggregate.instance_nonce },
  } }, runtimeOptions(root, "publish-flow-item-comment", { resolverBundle: publishBundle }));
  const comment_receipt = JSON.parse(await readFile(join(root, "qah", "publish-flow-item-comment", "comment-receipt.json"), "utf8"));
  const cleanup_receipt = {
    environment_status: "STOPPED", run_id: aggregate.run_id, attempt_id: aggregate.attempt_id,
    environment_id: aggregate.environment_id, target_namespace: aggregate.target_namespace, instance_nonce: aggregate.instance_nonce,
  };
  const finalization_input = { ...publication_input, comment_receipt, cleanup_receipt };
  const prepared = await runTaskCommand("finalize-transition", {
    phase: "prepare", finalization_input,
  }, runtimeOptions(root, "finalize-transition", { resolverBundle: serializedBundle(fixture, [rawComment]) }));
  const reportBytes = await readFile(join(root, "qah", "finalize-transition", "finalization.json"));
  const finalization_report = actualRef();
  fixture.store.set(`${finalization_report.artifact_id}@${finalization_report.version_id}`, {
    workspace_id: fixture.input.workspace_id, enforced_max_bytes: null, byte_length: reportBytes.byteLength, links: [],
    artifact: {
      id: finalization_report.artifact_id, workspace_id: fixture.input.workspace_id, status: "stored", current_version: finalization_report.version_id,
      kind: "document", name: "finalization.json", mime_type: "application/json",
      versions: [{ id: finalization_report.version_id, version: 1, file_asset: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", size: reportBytes.byteLength, checksum: createHash("sha256").update(reportBytes).digest("hex") }],
    },
    bytes: reportBytes,
  });
  const freshResolverBundle = serializedBundle(fixture, [rawComment]);
  const key = `${finalization_report.artifact_id}@${finalization_report.version_id}`;
  const record = freshResolverBundle.artifact_versions.find((entry) => entry.key === key).response;
  return {
    prepared,
    report: JSON.parse(reportBytes.toString("utf8")),
    complete: { phase: "complete", artifact_refs: { finalization_report }, finalization_input },
    runtimeOptions: runtimeOptions(root, "finalize-transition", { resolverBundle: freshResolverBundle }),
    record,
    freshResolverBundle,
  };
}

test("finalization complete requires fresh admitted authority and exact published report", async (t) => {
  const state = await preparedFinalizationFixture(t);
  assert.equal(state.prepared.files[0].name, "finalization.json");
  assert.equal(state.report.transition_allowed, true);
  assert.equal(state.report.kind, "qa");
  assert.ok(["pass", "fail", "blocked"].includes(state.report.verdict));
  const raw = await runTaskCommand("finalize-transition", state.complete, state.runtimeOptions);
  assert.deepEqual(Object.keys(raw).sort(), ["artifact_outputs", "item"]);
  assert.deepEqual(Object.keys(raw.item.data).sort(), [
    "checks", "kind", "reason_codes", "target_state", "tested_head_sha", "transition_allowed", "verdict",
  ]);
  assert.deepEqual(raw.artifact_outputs, {
    "item.artifacts.finalization_report": state.complete.artifact_refs.finalization_report,
  });

  for (const [name, mutate] of [
    ["missing finalization_input", ({ complete }) => { delete complete.finalization_input; }],
    ["missing report ref", ({ complete }) => { delete complete.artifact_refs.finalization_report; }],
    ["wrong version", ({ complete }) => { complete.artifact_refs.finalization_report.version_id = "17171717-1717-4717-8717-171717171717"; }],
    ["wrong bytes", ({ record }) => { record.bytes_base64 = Buffer.from("{}").toString("base64"); }],
    ["wrong MIME", ({ record }) => { record.artifact.mime_type = "text/plain"; }],
    ["cross workspace", ({ record }) => { record.workspace_id = "18181818-1818-4818-8818-181818181818"; }],
    ["stale comment attestation", ({ freshResolverBundle }) => { freshResolverBundle.comment_reads[0].attestation.complete = false; }],
  ]) await t.test(name, async () => {
    const state = await preparedFinalizationFixture(t);
    mutate(state);
    await assert.rejects(runTaskCommand("finalize-transition", state.complete, state.runtimeOptions));
  });
});

test("normalizer command writes canonical attestation and never has silent stdout semantics", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-comments-cli-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = await runTaskCommand("normalize-comments", {
    raw_comments: [],
    identity: {
      workspace_id: "22222222-2222-4222-8222-222222222222",
      project_id: "55555555-5555-4555-8555-555555555555",
      issue_id: "66666666-6666-4666-8666-666666666666",
    },
  }, runtimeOptions(root, "normalize-comments"));
  assert.equal(result.schema_version, "nuanu.qa-comment-list-attestation.v1");
  assert.equal(await readFile(join(root, "qah", "normalize-comments", "comments-attestation.json"), "utf8"), canonicalJson(result.attestation));
});

test("aggregate, universal blueprint, and universal runtime contain no payment policy literals", async () => {
  const sources = await Promise.all([
    "../../scripts/qah/aggregate.mjs",
    "../../scripts/qah/task-runtime.mjs",
    "../../processes/universal-qa-flow.graph.json",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const source of sources) assert.doesNotMatch(source, /payment|paydemo|bank_transfer|idempotent_replay|amount_rejected/i);
});

test("plan task persists an exact graph binding when graph input is present", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-runtime-graph-plan-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = aggregateFixture();
  const rawContext = {
    source_artifact: fixture.plan.source_artifact,
    issue_uuid: "66666666-6666-4666-8666-666666666666",
    project_uuid: "55555555-5555-4555-8555-555555555555",
    project_key: fixture.profile.project_key,
    repository_origin: fixture.profile.repository.allowed_origin,
    commit: fixture.plan.commit,
    content_hash: fixture.plan.content_hash,
    profile_digest: sha256(fixture.profile),
    changed_files: ["README.md"],
    labels: [],
    acceptance_capabilities: [],
    wiki_artifacts: [],
  };
  const context = resolveContext(rawContext, fixture.profile.repository);
  const event = graphEvent(fixture.profile.project_key);
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");

  await runTaskCommand("plan-qa-scope", {
    phase: "prepare",
    context,
    profile: fixture.profile,
    graph_input: { event, plan: graphPlan },
    carry: { profile_ref: fixture.input.profile_artifact, workspace_id: fixture.input.workspace_id },
  }, runtimeOptions(root, "plan-qa-scope"));

  const persisted = JSON.parse(await readFile(join(root, "qah", "plan-qa-scope", "test-plan.json"), "utf8"));
  assert.deepEqual(persisted.graph_binding, persisted.artifact_slot.graph_binding);
  assert.equal(persisted.graph_binding.graph_plan_digest, graphPlan.plan_digest);
});
