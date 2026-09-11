import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { loadWorkerCompletionValidator } from "./helpers/worker-contract.mjs";
import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import * as renderer from "../../scripts/qah/render-process.mjs";
import * as runtime from "../../scripts/qah/task-runtime.mjs";

const { buildCanonicalCompletion } = await loadWorkerCompletionValidator();

const blueprint = JSON.parse(await readFile(new URL("../../processes/universal-qa-flow.graph.json", import.meta.url), "utf8"));
const liveStart = JSON.parse(await readFile(new URL("fixtures/live-column-start.json", import.meta.url), "utf8"));
const execFileAsync = promisify(execFile);
const ref = (seed, role = "output") => ({
  artifact_id: `00000000-0000-4000-8000-${String(seed).padStart(12, "0")}`,
  version_id: `10000000-0000-4000-8000-${String(seed).padStart(12, "0")}`,
  kind: "document",
  role,
});

const bindings = {
  project_process_binding_id: liveStart.node.config.project_process_start.binding_id,
  project_id: liveStart.node.config.project_process_start.project_id,
  ready_for_qa_state_id: liveStart.node.config.project_process_start.state_id,
  in_progress_state_id: "44444444-4444-4444-8444-444444444444",
  ready_for_production_state_id: "55555555-5555-4555-8555-555555555555",
  qa_agent_employee_id: "66666666-6666-4666-8666-666666666666",
  qa_agent_version_id: "77777777-7777-4777-8777-777777777777",
  decision_agent_employee_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  decision_agent_version_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  decision_agent_metadata: {
    requested_model: "openai/gpt-5.6-sol-pro",
    required_capabilities: ["git", "nuanu_mcp", "tool_execution"],
  },
  platform_start_node: liveStart.node,
  platform_start_edge: liveStart.edge,
  platform_start_edge_fingerprint: sha256(liveStart.edge),
  platform_start_fingerprint: sha256(liveStart.node),
  profile_artifact: ref(8, "implementation"),
};

test("live-shaped comments are bounded before parse and secret extras never cross the adapter", async (t) => {
  const identity = {
    workspace_id: "22222222-2222-4222-8222-222222222222",
    project_id: "55555555-5555-4555-8555-555555555555",
    issue_id: "66666666-6666-4666-8666-666666666666",
  };
  const raw = [{
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    comment_html: "<p>verified</p>",
    actor: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "secret@example.test" },
    created_at: "2026-08-09T00:00:00Z",
    access_token: "must-not-cross-boundary",
  }];
  const normalized = runtime.normalizeRawIssueComments(raw, identity);
  assert.deepEqual(normalized.comments, [{ comment_id: raw[0].id, ...identity, comment_html: raw[0].comment_html }]);
  assert.doesNotMatch(canonicalJson(normalized), /secret@example|must-not-cross-boundary|created_at|actor/);
  assert.throws(() => runtime.normalizeRawIssueComments([{ comment_html: "<p>x</p>" }], identity), /id/i);
  assert.throws(() => runtime.normalizeRawIssueComments([{ id: raw[0].id, comment_html: 42 }], identity), /body|html/i);

  const root = await mkdtemp(join(tmpdir(), "qah-comments-bound-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, "oversize.json");
  await writeFile(path, canonicalJson([{ ...raw[0], padding: "x".repeat(1_048_576) }]));
  await assert.rejects(runtime.readCanonicalInputFile(path), /bound/i);
});

test("runtime output is confined to a real NUANU_TASK_DIR/qah child and authored commands use that literal", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-task-root-"));
  const outside = await mkdtemp(join(tmpdir(), "qah-task-outside-"));
  t.after(() => Promise.all([root, outside].map((path) => rm(path, { recursive: true, force: true }))));
  await mkdir(join(root, "qah"));
  const input = { raw_comments: [], identity: {
    workspace_id: "22222222-2222-4222-8222-222222222222",
    project_id: "55555555-5555-4555-8555-555555555555",
    issue_id: "66666666-6666-4666-8666-666666666666",
  } };
  const contained = join(root, "qah", "publish-flow-item-comment");
  await runtime.runTaskCommand("normalize-comments", input, { outputDir: contained, taskRoot: root });
  assert.equal(await realpath(contained), join(await realpath(root), "qah", "publish-flow-item-comment"));
  await assert.rejects(runtime.runTaskCommand("normalize-comments", input, { outputDir: outside, taskRoot: root }), /NUANU_TASK_DIR|contain/i);
  await assert.rejects(runtime.runTaskCommand("normalize-comments", input, { outputDir: "relative", taskRoot: root }), /absolute/i);
  await symlink(outside, join(root, "qah", "escape"));
  await assert.rejects(runtime.runTaskCommand("normalize-comments", input, { outputDir: join(root, "qah", "escape"), taskRoot: root }), /symlink|contain/i);

  const inputPath = join(root, "raw-comments.json");
  await writeFile(inputPath, canonicalJson(input));
  const { stdout } = await execFileAsync("/bin/sh", ["-c", 'node scripts/qah/task-runtime.mjs normalize-comments --input "$NUANU_TASK_DIR/raw-comments.json" --output-dir "$NUANU_TASK_DIR/qah/publish-flow-item-comment"'], {
    cwd: new URL("../..", import.meta.url), env: { ...process.env, NUANU_TASK_DIR: root }, maxBuffer: 1024 * 1024,
  });
  assert.equal(JSON.parse(stdout).schema_version, "nuanu.qa-comment-list-attestation.v1");
  assert.equal(JSON.parse(await readFile(join(root, "qah", "publish-flow-item-comment", "comments-attestation.json"), "utf8")).complete, true);

  const graph = renderer.renderProcess(blueprint, bindings);
  const [node] = graph.nodes.filter((entry) => entry.type === "agent_task");
  assert.equal(node.key, "finalize_transition");
  assert.match(node.config.instruction, /scripts\/qah\/ui-graph-canary\.mjs/);
  assert.match(node.config.instruction, /--output-dir "\$NUANU_TASK_DIR\/qah\/ui-graph-canary"/);
});

test("the single graph task has one same-lease final worker 0.3.14 envelope protocol", () => {
  const graph = renderer.renderProcess(blueprint, bindings);
  const [node] = graph.nodes.filter((entry) => entry.type === "agent_task");
  assert.equal(node.key, "finalize_transition");
  const slots = Object.keys(node.config.output.artifacts);
  assert.deepEqual(slots, ["finalization_report", "qah_verification", "verified_commit"]);
  assert.match(node.config.instruction, /prepare.*finalize.*complete/is);
  const rawSlots = slots.filter((slot) => slot !== "verified_commit");
  const artifact_outputs = Object.fromEntries(rawSlots.map((slot, index) => [`item.artifacts.${slot}`, ref(index + 20)]));
  const typedFinalizerData = {
    transition_allowed: true,
    target_state: "ready_for_qa",
    reason_codes: [],
    kind: "qa",
    verdict: "blocked",
    tested_head_sha: "a".repeat(40),
    checks: [],
  };
  const raw = { item: { key: node.key, description: "Universal QAH repository canary held", data: typedFinalizerData, artifacts: {} }, artifact_outputs };
  const completion = buildCanonicalCompletion({ task_id: "task", attempt: 1, request: { process: { step_key: node.key }, output_definition: node.config.output } }, { output: canonicalJson(raw), publishedArtifacts: [] });
  assert.equal(completion.result.item.key, node.key);
  assert.deepEqual(Object.keys(completion.result.item.data).sort(), Object.keys(node.config.output.data).sort());
  assert.deepEqual(Object.keys(completion.result.artifact_outputs).sort(), rawSlots.map((slot) => `item.artifacts.${slot}`).sort());
});

test("renderer preserves the live Start identity and atomically retargets its edge to the single canary", () => {
  const graph = renderer.renderProcess(blueprint, bindings);
  assert.deepEqual(graph.nodes[0], liveStart.node);
  assert.deepEqual(graph.edges[0], {
    id: liveStart.edge.id,
    source: liveStart.edge.source,
    target: "10000000-0000-5000-8000-000000000018",
  });
  assert.equal(graph.nodes.find((node) => node.key === "finalize_transition").id, graph.edges[0].target);
  assert.throws(() => renderer.renderProcess(blueprint, { ...bindings, platform_start_edge: { ...liveStart.edge, target: bindings.qa_agent_employee_id } }), /target|collision|edge/i);
  assert.throws(() => renderer.renderProcess(blueprint, { ...bindings, platform_start_edge: { ...liveStart.edge, source: bindings.qa_agent_employee_id } }), /source|edge/i);
});

test("install rendering rejects the former caller-authoritative resolver and attestation APIs", async () => {
  assert.equal(typeof renderer.verifyInstallPreconditions, "function");
  assert.equal(typeof renderer.renderForInstall, "function");
  const install = { workspace_id: "22222222-2222-4222-8222-222222222222", repository_origin: "https://example.invalid/repository.git", commit: "a".repeat(40) };
  await assert.rejects(renderer.renderForInstall(blueprint, bindings, install), /install request|direct|environment/i);
  assert.throws(() => renderer.renderProcessForInstall(blueprint, { verified: true }), /attestation|direct/i);
});
