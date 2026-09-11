import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import YAML from "yaml";

import { canonicalJson, sha256 } from "./canonical.mjs";
import { BRANCHES } from "./contracts.mjs";
import { resolveContext } from "./context.mjs";
import { validateAggregateForDecision } from "./decide.mjs";
import { runPaydemoAdapter } from "./adapters/paydemo.mjs";
import { materializeFinalizationWorkerTransport, normalizeRawIssueComments, runTaskCommand } from "./task-runtime.mjs";

const execFile = promisify(execFileCallback);

const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const ISSUE_ID = "11111111-1111-4111-8111-111111111111";
const RUN_ID = "99999999-9999-4999-8999-999999999999";
const ATTEMPT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PROCESS_RUN_ID = RUN_ID;
const COMMENT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const SOURCE_REF = {
  artifact_id: "33333333-3333-4333-8333-333333333333",
  version_id: "44444444-4444-4444-8444-444444444444",
  kind: "flow_item",
  role: "source",
};
const BRANCH_COMMANDS = {
  code: "verify-requirements-and-code",
  api: "verify-api-contracts",
  ui: "verify-ui-with-playwright",
  domain: "prepare-and-verify-domain-data",
};
export const FULL_QAH_FINALIZATION_OUTPUT_DEFINITION = Object.freeze({
  data: {
    transition_allowed: { type: "boolean", description: "True only after authoritative comment and cleanup verification" },
    target_state: { type: "string", description: "ready_for_production, in_progress, or ready_for_qa" },
    reason_codes: { type: "json", description: "Closed sorted finalization reason codes" },
    kind: { type: "string", description: "Literal qa admitted by QAH" },
    verdict: { type: "string", description: "pass, fail, or blocked admitted by QAH" },
    tested_head_sha: { type: "string", description: "Exact trusted 40-character repository commit" },
    checks: { type: "json", description: "Closed checks derived from exact verified branch ArtifactVersions" },
  },
  artifacts: {
    finalization_report: { description: "Verified final transition gate result", kind: "document", restrictions: { media_types: ["application/json"] } },
  },
});

function validateFinalizationHarnessBindings(buildCanonicalCompletion, finalizationOutputDefinition) {
  if (typeof buildCanonicalCompletion !== "function") throw new Error("buildCanonicalCompletion injection is required");
  if (!finalizationOutputDefinition || typeof finalizationOutputDefinition !== "object" || Array.isArray(finalizationOutputDefinition)
    || canonicalJson(finalizationOutputDefinition) !== canonicalJson(FULL_QAH_FINALIZATION_OUTPUT_DEFINITION)) {
    throw new Error("finalizationOutputDefinition must be the exact source-owned full-QAH seven-field output definition");
  }
}

function uuid(value) {
  return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function checksum(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

class LocalArtifactVersions {
  constructor(profileBytes) {
    this.next = 1;
    this.records = new Map();
    this.profileBytes = Buffer.from(profileBytes);
    const representation = {
      type: "platform_entity",
      entityType: "work_item",
      entityId: ISSUE_ID,
      snapshot: { id: ISSUE_ID, project_id: PROJECT_ID },
    };
    this.source = {
      workspace_id: WORKSPACE_ID,
      enforced_max_bytes: null,
      observed_bytes: Buffer.byteLength(canonicalJson(representation)),
      artifact: {
        id: SOURCE_REF.artifact_id,
        workspace_id: WORKSPACE_ID,
        status: "stored",
        current_version: SOURCE_REF.version_id,
        kind: "flow_item",
        name: "flow-item.json",
        mime_type: "application/vnd.nuanu.flow-item+json",
        metadata: { project_id: PROJECT_ID, work_item_id: ISSUE_ID },
        links: [
          { entity_type: "project", entity_id: PROJECT_ID, relation: "about" },
          { entity_type: "work_item", entity_id: ISSUE_ID, relation: "about" },
        ],
        versions: [{ id: SOURCE_REF.version_id, version: 1, file_asset: null, representation }],
      },
    };
  }

  persist({ name, bytes, role, links = [] }) {
    bytes = Buffer.from(bytes);
    const artifactId = uuid(this.next++);
    const versionId = uuid(this.next++);
    const fileAsset = uuid(this.next++);
    const ref = { artifact_id: artifactId, version_id: versionId, kind: "document", role };
    this.records.set(`${artifactId}@${versionId}`, {
      workspace_id: WORKSPACE_ID,
      enforced_max_bytes: null,
      byte_length: bytes.byteLength,
      links: structuredClone(links),
      artifact: {
        id: artifactId,
        workspace_id: WORKSPACE_ID,
        status: "stored",
        current_version: versionId,
        kind: "document",
        name,
        mime_type: name === "qa-harness.yaml" ? "application/yaml" : "application/json",
        versions: [{ id: versionId, version: 1, file_asset: fileAsset, size: bytes.byteLength, checksum: checksum(bytes) }],
      },
      bytes,
    });
    return ref;
  }

  dependencies(profile, comments, pinnedCommit) {
    return {
      resolveArtifactVersion: async ({ workspace_id, ref, max_bytes }) => {
        const record = this.records.get(`${ref.artifact_id}@${ref.version_id}`);
        if (!record || workspace_id !== WORKSPACE_ID || record.byte_length > max_bytes) return null;
        return { ...record, enforced_max_bytes: max_bytes, links: structuredClone(record.links), bytes: Buffer.from(record.bytes) };
      },
      resolvePlatformEntityVersion: async ({ workspace_id, ref, max_bytes }) => {
        if (workspace_id !== WORKSPACE_ID || canonicalJson(ref) !== canonicalJson(SOURCE_REF) || this.source.observed_bytes > max_bytes) return null;
        return structuredClone({ ...this.source, enforced_max_bytes: max_bytes });
      },
      resolveProfileAtCommit: async ({ repository_origin, commit, path, max_bytes }) => {
        if (repository_origin !== profile.repository.allowed_origin || commit !== pinnedCommit || path !== "qa-harness.yaml" || this.profileBytes.byteLength > max_bytes) return null;
        return {
          repository_origin,
          commit,
          path,
          byte_length: this.profileBytes.byteLength,
          enforced_max_bytes: max_bytes,
          sha256: `sha256:${checksum(this.profileBytes)}`,
          bytes: Buffer.from(this.profileBytes),
        };
      },
      listIssueComments: async (request) => normalizeRawIssueComments(comments.map(({ comment_id: id, comment_html }) => ({ id, comment_html })), {
        workspace_id: request.workspace_id,
        project_id: request.project_id,
        issue_id: request.issue_id,
      }),
      addIssueComment: async ({ comment_html }) => {
        comments.push({ comment_id: COMMENT_ID, workspace_id: WORKSPACE_ID, project_id: PROJECT_ID, issue_id: ISSUE_ID, comment_html });
        return { accepted: true };
      },
    };
  }
}

async function createPinnedDocsCheckout(root, profileBytes, repositoryOrigin) {
  const checkout = join(root, "docs-repository");
  await mkdir(checkout);
  await execFile("git", ["init", "--quiet"], { cwd: checkout });
  await execFile("git", ["config", "user.email", "qa@example.test"], { cwd: checkout });
  await execFile("git", ["config", "user.name", "Universal QA Harness"], { cwd: checkout });
  await execFile("git", ["remote", "add", "origin", repositoryOrigin], { cwd: checkout });
  await writeFile(join(checkout, "qa-harness.yaml"), profileBytes);
  await writeFile(join(checkout, "README.md"), "# Deterministic docs repository\n");
  await execFile("git", ["add", "qa-harness.yaml", "README.md"], { cwd: checkout });
  await execFile("git", ["commit", "--quiet", "-m", "docs fixture"], { cwd: checkout });
  const { stdout } = await execFile("git", ["rev-parse", "--verify", "HEAD"], { cwd: checkout });
  return { checkout: await realpath(checkout), commit: stdout.trim() };
}

async function persistManifest(store, directory, manifest, linksFor = {}) {
  const refs = {};
  for (const file of manifest.files) {
    refs[file.slot] = store.persist({
      name: file.name,
      bytes: await readFile(join(directory, file.name)),
      role: file.role,
      links: linksFor[file.slot] ?? [],
    });
  }
  return refs;
}

function evidenceCandidate(kind, name, content) {
  const bytes = Buffer.from(content);
  return {
    kind,
    name,
    media_type: kind === "screenshot" ? "image/png" : kind === "trace" ? "application/zip" : "text/markdown",
    size_bytes: bytes.byteLength,
    sha256: `sha256:${checksum(bytes)}`,
    content_base64: bytes.toString("base64"),
  };
}

function adapterExecution({ mode, timings, counters }) {
  return async (_file, _args, options) => {
    const input = JSON.parse(options.stdin);
    const timing = timings[input.branch];
    timing.body_invoked = true;
    timing.started_at = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 20));
    let result;
    if (input.branch === "code") {
      result = { exitCode: 0, signal: null, stdout: "typecheck passed; 4111111111111111 raw-response-body", stderr: "" };
    } else {
      if (input.branch === "ui") counters.playwright += 1;
      const passCode = { api: "API_CONTRACT_VERIFIED", ui: "UI_FLOW_VERIFIED", domain: "DOMAIN_RULE_VERIFIED" }[input.branch];
      const missingEvidence = mode === "missing-evidence" && input.branch === "api";
      const axes = missingEvidence
        ? { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0 }
        : mode === "product-failure" && input.branch === "api"
          ? { product_result: "FAIL", environment_status: "HEALTHY", evidence_status: "VERIFIED", confidence: 1 }
          : { product_result: "PASS", environment_status: "HEALTHY", evidence_status: "VERIFIED", confidence: 1 };
      const candidates = missingEvidence
        ? [evidenceCandidate("document", "api-failed-probe.md", "Authenticated API probe failed before product behavior could be verified.")]
        : input.branch === "ui"
          ? [evidenceCandidate("screenshot", "ui-main.png", "screenshot"), evidenceCandidate("trace", "ui-trace.zip", "trace")]
          : [evidenceCandidate("document", `${input.branch}-evidence.md`, `${input.branch} evidence`)];
      const adapter = await runPaydemoAdapter(input, input.branch === "ui" ? {
        runUiProbe: async () => ({
          classification: { ...axes, code: passCode },
          observation_sha256: sha256("bounded-ui-observation"),
          candidates,
        }),
      } : {
        documentProbe: async () => ({
          result: {
            axes,
            code: missingEvidence ? "TRANSPORT_FAILURE" : mode === "product-failure" && input.branch === "api" ? "AMOUNT_MISMATCH_ACCEPTED" : passCode,
            occurrence_key: sha256(`bounded-${input.branch}-observation`),
          },
          candidates,
        }),
      });
      result = { exitCode: 0, signal: null, stdout: canonicalJson(adapter), stderr: "" };
    }
    timing.ended_at = Date.now();
    return result;
  };
}

async function environmentHarness(root, contentHash) {
  const processes = new Map();
  let nextPid = 41000;
  const executableRealpath = await realpath(process.execPath);
  const dependencies = {
    async execFile(command, args) {
      if (command === "git" && args.includes("clone")) await mkdir(args.at(-1), { recursive: true });
      if (command === "git" && args.includes("rev-parse")) return { stdout: `${"a".repeat(40)}\n`, stderr: "" };
      if (command === "git" && args.includes("status")) return { stdout: "", stderr: "" };
      return { stdout: "", stderr: "" };
    },
    spawn(command, args) {
      const child = new EventEmitter();
      child.pid = nextPid++;
      child.unref = () => {};
      processes.set(child.pid, { alive: true, argv: [command, ...args], start_token: `start-${child.pid}` });
      queueMicrotask(() => child.emit("spawn"));
      return child;
    },
    processKill(pid) {
      const process = processes.get(pid);
      if (!process?.alive) throw Object.assign(new Error("gone"), { code: "ESRCH" });
      process.alive = false;
    },
    async inspectProcess(pid) {
      const process = processes.get(pid);
      return process?.alive ? { executable_realpath: executableRealpath, argv: [...process.argv], start_token: process.start_token } : null;
    },
    async fetch(_url) {
      const process = [...processes.values()].at(-1);
      const argument = (name) => decodeURIComponent(process.argv.find((value) => value.startsWith(`${name}=`)).slice(name.length + 1));
      return new Response(JSON.stringify({
        repository_origin: argument("--qah-repository-origin"),
        commit: argument("--qah-commit"),
        content_hash: contentHash,
        environment_id: argument("--qah-environment-id"),
        instance_nonce: argument("--qah-instance-nonce"),
      }), { headers: { "content-type": "application/json" } });
    },
  };
  const managed = {
    adapter_id: "local-e2e-v1",
    adapter_version: "1",
    adapter_digest: `sha256:${"d".repeat(64)}`,
    configuration: { release: "local" },
    runtime_identity: { release: "local", protocol: "local-v1" },
    environment_prefix: "PAYDEMO_",
    environment_allowlist: [],
    async prepareCheckout({ checkout }) {
      await writeFile(join(checkout, "server.mjs"), "// local deterministic environment\n");
      return { command: [process.execPath, join(checkout, "server.mjs")], base_url: "http://127.0.0.1:4173", content_hash: contentHash, environment: {} };
    },
    async inspectRuntime({ checkout }) {
      return { command: [process.execPath, join(checkout, "server.mjs")], base_url: "http://127.0.0.1:4173", content_hash: contentHash, environment: {}, allowed_generated_entries: [], state_fields: {} };
    },
  };
  return { stateRoot: join(root, "environment-state"), dependencies, managed };
}

async function task(root, command, input, options = {}) {
  const outputDir = join(root, "qah", command);
  const result = await runTaskCommand(command, input, { outputDir, taskRoot: root, ...options });
  return { result, outputDir };
}

async function complete(root, store, command, manifest, options = {}, linksFor = {}, completionFields = {}) {
  const outputDir = join(root, "qah", command);
  const refs = await persistManifest(store, outputDir, manifest, linksFor);
  const envelope = await runTaskCommand(command, { phase: "complete", artifact_refs: refs, ...completionFields }, { outputDir, taskRoot: root, ...options });
  return { refs, envelope };
}

export async function runLocalQaHarness({ fixture, mode = "pass", graphInput = undefined, buildCanonicalCompletion, finalizationOutputDefinition }) {
  validateFinalizationHarnessBindings(buildCanonicalCompletion, finalizationOutputDefinition);
  if (!["api", "ui", "docs", "mixed"].includes(fixture) || !["pass", "product-failure", "missing-evidence"].includes(mode)) throw new Error("invalid local harness fixture");
  const root = await mkdtemp(join(tmpdir(), "universal-qah-e2e-"));
  const events = [];
  try {
    const profilePath = fixture === "docs" ? "tests/qah/fixtures/qa-harness.docs.yaml" : "qa-harness.yaml";
    const profileBytes = await readFile(new URL(`../../${profilePath}`, import.meta.url));
    const profile = YAML.parse(profileBytes.toString("utf8"));
    const repository = fixture === "docs"
      ? await createPinnedDocsCheckout(root, profileBytes, profile.repository.allowed_origin)
      : { checkout: await realpath(root), commit: "a".repeat(40) };
    const store = new LocalArtifactVersions(profileBytes);
    const comments = [];
    const dependencies = store.dependencies(profile, comments, repository.commit);
    const profileRef = store.persist({ name: "qa-harness.yaml", bytes: profileBytes, role: "implementation" });
    const contextFixture = JSON.parse(await readFile(new URL(`../../tests/qah/fixtures/context-${fixture}.json`, import.meta.url), "utf8"));
    const rawContext = { ...contextFixture, commit: repository.commit, profile_digest: sha256(profile) };
    const profileInstall = { workspace_id: WORKSPACE_ID, profile_artifact: profileRef, repository_origin: profile.repository.allowed_origin, commit: rawContext.commit, profile_digest: rawContext.profile_digest };
    const workerEnvelopes = {};

    const resolved = await task(root, "resolve-flow-item", { phase: "prepare", workspace_id: WORKSPACE_ID, project_id: PROJECT_ID, issue_id: ISSUE_ID, source_artifact: SOURCE_REF, profile_artifact: profileRef }, { dependencies });
    ({ envelope: workerEnvelopes.resolve_flow_item } = await complete(root, store, "resolve-flow-item", resolved.result, { dependencies }));

    const loaded = await task(root, "load-project-context", { phase: "prepare", raw_context: rawContext, profile, profile_install: profileInstall }, { dependencies });
    // Keep the Task 2 object identity when passing to Task 2's planner. A
    // canonical JSON round-trip reorders object keys, while the current
    // boundary validator intentionally checks the normalized wiki tuple order.
    const context = resolveContext(rawContext, profile.repository);
    ({ envelope: workerEnvelopes.load_project_context } = await complete(root, store, "load-project-context", loaded.result, { dependencies }));

    const planned = await task(root, "plan-qa-scope", {
      phase: "prepare",
      context,
      profile,
      ...(graphInput === undefined ? {} : { graph_input: graphInput }),
      carry: { profile_ref: profileRef, workspace_id: WORKSPACE_ID },
    }, { dependencies });
    const plan = JSON.parse(await readFile(join(planned.outputDir, "test-plan.json"), "utf8"));
    const planComplete = await complete(root, store, "plan-qa-scope", planned.result, { dependencies });
    workerEnvelopes.plan_qa_scope = planComplete.envelope;
    const planRef = planComplete.refs.test_plan;

    const envHarness = await environmentHarness(root, plan.content_hash);
    const environmentInput = {
      profile,
      repositoryOrigin: profile.repository.allowed_origin,
      commit: plan.commit,
      runId: RUN_ID,
      attemptId: ATTEMPT_ID,
      environmentId: "local-e2e",
      ...(fixture === "docs" ? {} : envHarness),
    };
    const carry = { source_ref: SOURCE_REF, profile_ref: profileRef, test_plan_ref: planRef, workspace_id: WORKSPACE_ID, project_id: PROJECT_ID, issue_id: ISSUE_ID };
    const prepared = await task(root, "prepare-environment", { phase: "prepare", environment_input: environmentInput, carry }, { dependencies });
    const environment = JSON.parse(await readFile(join(prepared.outputDir, "environment-manifest.json"), "utf8"));
    ({ envelope: workerEnvelopes.prepare_environment } = await complete(root, store, "prepare-environment", prepared.result, { dependencies }));

    const timings = Object.fromEntries(BRANCHES.map((branch) => [branch, { started_at: Date.now(), ended_at: Date.now(), body_invoked: false }]));
    const counters = { playwright: 0 };
    const execute = adapterExecution({ mode, timings, counters });
    const branchEntries = await Promise.all(BRANCHES.map(async (branch) => {
      const command = BRANCH_COMMANDS[branch];
      const branchStart = Date.now();
      const branchTask = await task(root, command, {
        phase: "prepare",
        branch_input: { plan, profile, environmentReceipt: environment, runId: RUN_ID, attemptId: ATTEMPT_ID, ...(branch === "domain" ? { testDataProfile: "payment_sandbox" } : {}) },
      }, { dependencies: {
        ...dependencies,
        trustedStateRoot: envHarness.stateRoot,
        repositoryCheckout: repository.checkout,
        execute,
        verifyEnvironment: async ({ receipt }) => ({ receipt, checkout: root }),
      } });
      if (mode === "product-failure" && branch === "api") {
        const evidencePath = join(branchTask.outputDir, "evidence.json");
        const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
        evidence.confirmed_findings = 0;
        await writeFile(evidencePath, canonicalJson(evidence));
      }
      const primaryRefs = await persistManifest(store, branchTask.outputDir, branchTask.result);
      const linked = await runTaskCommand(command, {
        phase: "link",
        primary_refs: primaryRefs,
        occurrence_context: { repository_origin: profile.repository.allowed_origin, content_hash: plan.content_hash, environment_id: environment.environment_id, instance_nonce: environment.instance_nonce ?? null },
      }, { outputDir: branchTask.outputDir, taskRoot: root, dependencies });
      const occurrenceRef = (await persistManifest(store, branchTask.outputDir, linked)).occurrence;
      const refs = { ...primaryRefs, occurrence: occurrenceRef };
      const envelope = await runTaskCommand(command, {
        phase: "complete",
        material_refs: refs,
        completion_context: { source_ref: SOURCE_REF, profile_ref: profileRef, test_plan_ref: planRef, environment_receipt: environment, workspace_id: WORKSPACE_ID, project_id: PROJECT_ID, issue_id: ISSUE_ID, run_id: RUN_ID, attempt_id: ATTEMPT_ID },
      }, { outputDir: branchTask.outputDir, taskRoot: root, dependencies });
      workerEnvelopes[envelope.item.key] = envelope;
      const data = envelope.item.data;
      const timing = timings[branch];
      if (fixture === "docs" && branch === "code" && data.branch_result.evidence_status === "VERIFIED") timing.body_invoked = true;
      if (!timing.body_invoked) { timing.started_at = branchStart; timing.ended_at = Date.now(); }
      return {
        output: { branch_result: data.branch_result, envelope: data.envelope },
        artifacts: refs,
        timing,
      };
    }));

    const aggregateInput = {
      workspace_id: WORKSPACE_ID,
      plan,
      plan_artifact: planRef,
      profile_artifact: profileRef,
      branches: branchEntries.map(({ output, artifacts }) => ({ output, artifacts })),
      environment_receipt: environment,
      repository_origin: profile.repository.allowed_origin,
      run_id: RUN_ID,
      attempt_id: ATTEMPT_ID,
    };
    const aggregated = await task(root, "aggregate-evidence", { phase: "prepare", aggregate_input: aggregateInput, project_id: PROJECT_ID, issue_id: ISSUE_ID }, { dependencies });
    const aggregate = JSON.parse(await readFile(join(aggregated.outputDir, "aggregate-report.json"), "utf8"));
    const reviewLinks = [
      { entity_type: "project", entity_id: PROJECT_ID, relation: "output" },
      { entity_type: "work_item", entity_id: ISSUE_ID, relation: "output" },
      { entity_type: "process_run", entity_id: PROCESS_RUN_ID, relation: "output" },
    ];
    const aggregateComplete = await complete(root, store, "aggregate-evidence", aggregated.result, { dependencies }, { review_bundle: reviewLinks });
    workerEnvelopes.aggregate_evidence = aggregateComplete.envelope;
    const reviewRef = aggregateComplete.refs.review_bundle;

    const cleanupLease = { run_id: aggregate.run_id, attempt_id: aggregate.attempt_id, environment_id: aggregate.environment_id, target_namespace: aggregate.target_namespace, instance_nonce: aggregate.instance_nonce };
    const decided = await task(root, "independent-release-decision", {
      aggregate,
      proposal: {},
      completion_context: { source_ref: SOURCE_REF, profile_ref: profileRef, review_bundle_ref: reviewRef, cleanup_lease: cleanupLease, workspace_id: WORKSPACE_ID, project_id: PROJECT_ID, issue_id: ISSUE_ID },
    }, { dependencies });
    workerEnvelopes.independent_release_decision = decided.result;
    const decision = decided.result.item.data.decision;
    const publicationInput = { workspace_id: WORKSPACE_ID, project_id: PROJECT_ID, issue_id: ISSUE_ID, source_artifact: SOURCE_REF, review_bundle: reviewRef };
    const publicationValidation = await validateAggregateForDecision(aggregate, dependencies);
    if (publicationValidation.valid !== true) throw new Error(`local publication aggregate invalid: ${publicationValidation.reason_codes.join(",")}`);
    const publicationValidationResult = Object.freeze({
      valid: true,
      reason_codes: Object.freeze([...publicationValidation.reason_codes]),
    });

    const [published, cleaned] = await Promise.all([
      task(root, "publish-flow-item-comment", { phase: "prepare", publication_input: publicationInput, completion_context: { decision, cleanup_lease: cleanupLease, profile_ref: profileRef } }, { dependencies }).then((value) => { events.push("comment-complete"); return value; }),
      task(root, "cleanup-environment", { phase: "prepare", environment_input: environmentInput, completion_context: { source_ref: SOURCE_REF, review_bundle_ref: reviewRef } }, { dependencies }).then((value) => { events.push("cleanup-complete"); return value; }),
    ]);
    const commentReceipt = JSON.parse(await readFile(join(published.outputDir, "comment-receipt.json"), "utf8"));
    const cleanupReceipt = JSON.parse(await readFile(join(cleaned.outputDir, "cleanup-receipt.json"), "utf8"));
    ({ envelope: workerEnvelopes.publish_flow_item_comment } = await complete(root, store, "publish-flow-item-comment", published.result, { dependencies }));
    ({ envelope: workerEnvelopes.cleanup_environment } = await complete(root, store, "cleanup-environment", cleaned.result, { dependencies }));

    const finalizationInput = { ...publicationInput, comment_receipt: commentReceipt, cleanup_receipt: cleanupReceipt };
    const finalized = await task(root, "finalize-transition", { phase: "prepare", finalization_input: finalizationInput }, { dependencies });
    events.push("transition");
    const finalization = JSON.parse(await readFile(join(finalized.outputDir, "finalization.json"), "utf8"));
    const finalizationComplete = await complete(root, store, "finalize-transition", finalized.result, { dependencies }, {}, { finalization_input: finalizationInput });
    const finalizationRawTransport = finalizationComplete.envelope;
    workerEnvelopes.finalize_transition = finalizationRawTransport;
    const finalizationCanonicalCompletion = buildCanonicalCompletion({
      task_id: "local-finalize-transition",
      attempt: 1,
      request: { process: { step_key: "finalize_transition" }, output_definition: structuredClone(finalizationOutputDefinition) },
    }, { output: canonicalJson(finalizationRawTransport), publishedArtifacts: [] });
    const finalizationFlowStepResult = materializeFinalizationWorkerTransport(finalizationCanonicalCompletion.result);

    return {
      fixture,
      profile_source: {
        path: profilePath,
        environment_strategy: profile.environment.strategy,
        git_blob_sha256: `sha256:${checksum(profileBytes)}`,
      },
      plan,
      environment,
      environment_created: environment.environment_status === "READY",
      branches: branchEntries.map(({ output, artifacts, timing }) => ({
        branch: output.branch_result.branch,
        applicability: output.branch_result.applicability,
        product_result: output.branch_result.product_result,
        artifact_refs: artifacts,
        ...timing,
      })),
      aggregate,
      decision,
      comment_receipt: commentReceipt,
      cleanup_receipt: cleanupReceipt,
      finalization,
      publication_validation: publicationValidationResult,
      finalization_raw_transport: finalizationRawTransport,
      finalization_canonical_completion: finalizationCanonicalCompletion,
      finalization_flow_step_result: finalizationFlowStepResult,
      playwright_adapter_invocations: counters.playwright,
      worker_envelopes: workerEnvelopes,
      events,
    };
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 20 });
  }
}
