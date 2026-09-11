import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderProcess, renderProcessJson, validateFinalProofGate } from "../../scripts/qah/render-process.mjs";
import { sha256 } from "../../scripts/qah/canonical.mjs";

const blueprintUrl = new URL("../../processes/universal-qa-flow.graph.json", import.meta.url);
const blueprint = JSON.parse(await readFile(blueprintUrl, "utf8"));
const liveStart = JSON.parse(await readFile(new URL("fixtures/live-column-start.json", import.meta.url), "utf8"));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const bindings = Object.freeze({
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
  profile_artifact: {
    artifact_id: "88888888-8888-4888-8888-888888888888",
    version_id: "99999999-9999-4999-8999-999999999999",
    kind: "document",
    role: "implementation",
  },
});
const expectedFinalStates = Object.freeze({
  ready_for_production_state_id: bindings.ready_for_production_state_id,
  in_progress_state_id: bindings.in_progress_state_id,
});
const stockProofGateOutput = Object.freeze({
  artifacts: {},
  data: {
    completion_verification_id: { description: "Exact persisted verification receipt", type: "string" },
    outcome: { description: "Closed proof outcome used for BPMN routing", type: "string" },
    reason_code: { description: "Deterministic reason for the proof outcome", type: "string" },
    resolution: { description: "Proof outcome repeated as the routing resolution", type: "string" },
  },
});

const expectedKeys = [
  "project_start",
  "finalize_transition",
  "transition_proof_gate",
  "ready_for_production_end",
  "in_progress_end",
  "qa_needs_human_end",
];

function byKey(graph) {
  return new Map(graph.nodes.map((node) => [node.key, node]));
}

function edgePairs(graph) {
  const keyById = new Map(graph.nodes.map((node) => [node.id, node.key]));
  return graph.edges.map((edge) => [keyById.get(edge.source), keyById.get(edge.target), edge.when]);
}

test("renders the exact stock-compatible single-task topology", () => {
  const graph = renderProcess(blueprint, bindings);
  assert.equal(graph.schema_version, 1);
  assert.deepEqual(graph.nodes.map((node) => node.key), expectedKeys);
  assert.equal(graph.nodes.length, 6);
  assert.equal(graph.edges.length, 5);
  assert.deepEqual(edgePairs(graph).map(([source, target]) => [source, target]), [
    ["project_start", "finalize_transition"],
    ["finalize_transition", "transition_proof_gate"],
    ["transition_proof_gate", "ready_for_production_end"],
    ["transition_proof_gate", "in_progress_end"],
    ["transition_proof_gate", "qa_needs_human_end"],
  ]);
});

test("preserves the live generated Column Start byte-equivalently and authors no trigger", () => {
  assert.equal(blueprint.graph.nodes.some((node) => node.type === "start"), false);
  assert.equal(blueprint.graph.edges.some((edge) => edge.source === liveStart.node.id), false);
  const graph = renderProcess(blueprint, bindings);
  const renderedStart = graph.nodes.find((node) => node.type === "start");
  assert.deepEqual(renderedStart, liveStart.node);
  assert.equal(JSON.stringify(renderedStart), JSON.stringify(liveStart.node));
  assert.deepEqual(graph.edges.find((edge) => edge.source === renderedStart.id), {
    id: liveStart.edge.id,
    source: renderedStart.id,
    target: byKey(graph).get("finalize_transition").id,
  });
  for (const mutation of [
    undefined,
    { ...liveStart.node, type: "agent_task" },
    { ...liveStart.node, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
    { ...liveStart.node, trigger: { mode: "manual" } },
    { ...liveStart.node, config: { ...liveStart.node.config, output: { ...liveStart.node.config.output, data: { ...liveStart.node.config.output.data, payload: { description: "stale payload", type: "json" } } } } },
    { ...liveStart.node, config: { ...liveStart.node.config, project_process_start: { ...liveStart.node.config.project_process_start, state_id: bindings.in_progress_state_id } } },
  ]) assert.throws(() => renderProcess(blueprint, { ...bindings, platform_start_node: mutation }), /platform_start_node|platform Start|Column Start/);
});

test("single Agent Task consumes only the platform-owned Column Start and uses no cross-task Artifact read", () => {
  const graph = renderProcess(blueprint, bindings);
  const nodes = byKey(graph);
  const instructions = Object.fromEntries(
    graph.nodes.filter((node) => node.type === "agent_task").map((node) => [node.key, node.config.instruction]),
  );
  assert.deepEqual(Object.keys(instructions), ["finalize_transition"]);
  assert.match(instructions.finalize_transition, /input\.project_start\.artifacts\.flow_item/);
  assert.match(instructions.finalize_transition, /ui-graph-canary\.mjs/);
  assert.match(instructions.finalize_transition, /node scripts\/qah\/ui-graph-canary\.mjs/);
  assert.match(instructions.finalize_transition, /source_snapshot/);
  assert.match(instructions.finalize_transition, /Product Graph|граф/i);
  assert.match(instructions.finalize_transition, /browser/i);
  assert.doesNotMatch(instructions.finalize_transition, /NUANU_CODEX_CWD|absolute runner|абсолютн(?:ый|ого) runner/i);
  assert.match(instructions.finalize_transition, /prepare.*finalize.*complete/is);
  assert.match(instructions.finalize_transition, /не вызывай get_artifact|do not call get_artifact/i);

  const serialized = JSON.stringify(graph);
  assert.doesNotMatch(serialized, /input_bindings|\$\{steps|process_context|backward_lookup/);
  assert.equal(nodes.get("finalize_transition").type, "agent_task");
  assert.deepEqual(nodes.get("finalize_transition").config.runtime_hints, {
    required_worker_capabilities: ["browser_qa_v1"],
  });
});

test("uses closed Process v1 outputs and worker 0.3.14 Artifact contracts", () => {
  const graph = renderProcess(blueprint, bindings);
  const agents = graph.nodes.filter((node) => node.type === "agent_task");
  assert.ok(agents.length > 0);
  for (const node of agents) {
    assert.deepEqual(Object.keys(node.config.output).sort(), ["artifacts", "data"]);
    assert.equal(Object.getPrototypeOf(node.config.output.data), Object.prototype);
    assert.equal(Object.getPrototypeOf(node.config.output.artifacts), Object.prototype);
    for (const descriptor of Object.values(node.config.output.data)) {
      assert.ok(["string", "number", "boolean", "json", "choices"].includes(descriptor.type));
      assert.equal(typeof descriptor.description, "string");
      assert.ok(descriptor.description.length > 0);
    }
    for (const [slot, descriptor] of Object.entries(node.config.output.artifacts)) {
      if (slot === "verified_commit") {
        assert.deepEqual(descriptor, {
          description: "Server-verified task branch commit used by the stock Proof Gate",
          kind: "git.commit",
        });
      } else {
        assert.equal(descriptor.kind, "document");
        assert.deepEqual(descriptor.restrictions, { media_types: ["application/json"] });
        assert.equal(typeof descriptor.description, "string");
      }
    }
    assert.match(node.config.instruction, /scripts\/qah\/ui-graph-canary\.mjs/);
    assert.match(node.config.instruction, /artifact_id, version_id, kind, role/);
    assert.doesNotMatch(node.config.instruction, /artifact_id, version_id, kind, role, name|latest.version/i);
    assert.doesNotMatch(node.config.instruction, /scripts\/qah\/(?:aggregate|context|decide|environment|finalize|plan|render-comment|run-branch)\.mjs/);
  }

  assert.deepEqual(Object.keys(byKey(graph).get("finalize_transition").config.output.artifacts), ["finalization_report", "qah_verification", "verified_commit"]);
});

test("binds the immutable Column Start and exactly one pinned QA Agent version", () => {
  const graph = renderProcess(blueprint, bindings);
  const nodes = byKey(graph);
  assert.deepEqual(nodes.get("project_start").config.project_process_start, {
    binding_id: bindings.project_process_binding_id,
    project_id: bindings.project_id,
    state_id: bindings.ready_for_qa_state_id,
  });
  assert.deepEqual(nodes.get("project_start"), liveStart.node);
  const agent = graph.nodes.filter((entry) => entry.type === "agent_task");
  assert.equal(agent.length, 1);
  assert.equal(agent[0].config.agent_employee_id, bindings.qa_agent_employee_id);
  assert.equal(agent[0].config.agent_version_id, bindings.qa_agent_version_id);
  const serialized = JSON.stringify(graph);
  assert.equal(serialized.includes(bindings.profile_artifact.artifact_id), false);
  assert.equal(serialized.includes(bindings.profile_artifact.version_id), false);
  assert.equal(serialized.includes(bindings.decision_agent_employee_id), false);
});

test("does not delegate the compatibility canary to a second racing worker", () => {
  const graph = renderProcess(blueprint, bindings);
  assert.deepEqual(graph.nodes.filter((node) => node.type === "agent_task").map((node) => node.key), ["finalize_transition"]);
  assert.doesNotMatch(JSON.stringify(graph), /independent_release_decision|task-scoped Nuanu MCP.*get_artifact/is);
});

test("declares one supervisor-pushed commit output for stock provider verification", () => {
  const graph = renderProcess(blueprint, bindings);
  const finalizer = byKey(graph).get("finalize_transition");
  assert.deepEqual(finalizer.config.output.artifacts.verified_commit, {
    description: "Server-verified task branch commit used by the stock Proof Gate",
    kind: "git.commit",
  });
  assert.match(finalizer.config.instruction, /repository supervisor/i);
  assert.match(finalizer.config.instruction, /verified_commit/);
  assert.match(finalizer.config.instruction, /pre-supervisor raw result/i);
  assert.match(finalizer.config.instruction, /stdout.*phase=complete/is);
  assert.match(finalizer.config.instruction, /artifact_outputs.*finalization_report.*qah_verification/is);
  assert.match(finalizer.config.instruction, /artifact_outputs.*must not contain verified_commit/is);
  assert.match(finalizer.config.instruction, /no markdown|без markdown/i);
});

test("uses a fresh Proof Gate identity instead of mutating the legacy gateway type", () => {
  const graph = renderProcess(blueprint, bindings);
  const nodes = byKey(graph);
  const route = nodes.get("transition_proof_gate");
  assert.equal(nodes.has("transition_route"), false);
  assert.equal(graph.nodes.some(({ id }) => id === "10000000-0000-5000-8000-000000000019"), false);
  assert.equal(route.id, "10000000-0000-5000-8000-000000000026");
  assert.equal(route.type, "proof_gate");
});

test("routes only through the exact stock qa_result_v1 Proof Gate outcomes", () => {
  const graph = renderProcess(blueprint, bindings);
  const nodes = byKey(graph);
  const finalizer = nodes.get("finalize_transition");
  const route = nodes.get("transition_proof_gate");
  const ready = nodes.get("ready_for_production_end");
  const rejected = nodes.get("in_progress_end");
  const hold = nodes.get("qa_needs_human_end");
  assert.deepEqual([finalizer.id, route.id, ready.id, rejected.id, hold.id], [
    "10000000-0000-5000-8000-000000000018",
    "10000000-0000-5000-8000-000000000026",
    "10000000-0000-5000-8000-000000000020",
    "10000000-0000-5000-8000-000000000021",
    "10000000-0000-5000-8000-000000000022",
  ]);
  assert.equal(route.type, "proof_gate");
  assert.deepEqual(route.config, { profile_key: "qa_result_v1", profile_version: "1", ai_assessment: "off" });
  assert.deepEqual(graph.edges.filter(({ target }) => target === route.id), [{
    id: "20000000-0000-5000-8000-000000000022", source: finalizer.id, target: route.id,
  }]);
  assert.deepEqual(graph.edges.filter(({ source }) => source === route.id), [
    { id: "20000000-0000-5000-8000-000000000023", source: route.id, target: ready.id, name: "passed", when: { outcome: "passed" } },
    { id: "20000000-0000-5000-8000-000000000024", source: route.id, target: rejected.id, name: "not_passed", when: { outcome: "not_passed" } },
    { id: "20000000-0000-5000-8000-000000000025", source: route.id, target: hold.id, name: "unable_to_verify", when: { outcome: "unable_to_verify" } },
  ]);
  assert.equal(ready.config.project_status.target_state_id, bindings.ready_for_production_state_id);
  assert.equal(rejected.config.project_status.target_state_id, bindings.in_progress_state_id);
  assert.equal(hold.config.project_status.target_state_id, null);
  for (const edge of graph.edges.filter(({ source }) => source === route.id)) {
    for (const key of ["var", "raw", "otherwise", "branch"]) assert.equal(Object.hasOwn(edge.when, key), false);
  }
  assert.deepEqual(finalizer.config.output.data, {
    transition_allowed: { type: "boolean", description: "True only after authoritative comment and cleanup verification" },
    target_state: { type: "string", description: "ready_for_production, in_progress, or ready_for_qa" },
    reason_codes: { type: "json", description: "Closed sorted finalization reason codes" },
    kind: { type: "string", description: "Literal qa admitted by QAH" },
    verdict: { type: "string", description: "pass, fail, or blocked admitted by QAH" },
    tested_head_sha: { type: "string", description: "Exact trusted 40-character repository commit" },
    checks: { type: "json", description: "Closed checks derived from exact verified branch ArtifactVersions" },
  });
  for (const field of ["kind", "verdict", "tested_head_sha", "checks"]) {
    assert.deepEqual(graph.nodes.filter((node) => Object.hasOwn(node.config?.output?.data ?? {}, field)).map(({ key }) => key), ["finalize_transition"]);
  }
  assert.doesNotThrow(() => validateFinalProofGate(graph, expectedFinalStates));
});

test("accepts only the exact stock server-normalized Proof Gate output", () => {
  const clean = renderProcess(blueprint, bindings);
  const route = byKey(clean).get("transition_proof_gate");
  route.config.output = structuredClone(stockProofGateOutput);
  const routeEdges = clean.edges.filter(({ source }) => source === route.id);
  const nonRouteEdges = clean.edges.filter(({ source }) => source !== route.id);
  clean.edges = [nonRouteEdges[0], ...routeEdges.slice(0, 2).reverse(), routeEdges[2], ...nonRouteEdges.slice(1)];
  assert.doesNotThrow(() => validateFinalProofGate(clean, expectedFinalStates));

  for (const [name, mutate] of [
    ["extra output field", (output) => { output.data.synthetic = { description: "Synthetic", type: "string" }; }],
    ["changed outcome description", (output) => { output.data.outcome.description = "Untrusted"; }],
    ["unexpected output artifact", (output) => { output.artifacts.synthetic = { kind: "document" }; }],
  ]) {
    const hostile = structuredClone(clean);
    mutate(byKey(hostile).get("transition_proof_gate").config.output);
    assert.throws(() => validateFinalProofGate(hostile, expectedFinalStates), /FINAL_PROOF_GATE_INVALID/, name);
  }
});

test("final Proof Gate validator rejects every alternate routing dialect", () => {
  const clean = renderProcess(blueprint, bindings);
  const mutations = [
    ["missing outcome", (graph) => { delete graph.edges.find(({ id }) => id.endsWith("025")).when; }],
    ["duplicate outcome", (graph) => { graph.edges.find(({ id }) => id.endsWith("025")).when = { outcome: "passed" }; }],
    ["raw condition", (graph) => { graph.edges.find(({ id }) => id.endsWith("023")).when = { raw: "true" }; }],
    ["var condition", (graph) => { graph.edges.find(({ id }) => id.endsWith("024")).when = { var: "finalize_transition.data.target_state", op: "eq", value: "in_progress" }; }],
    ["wrong profile", (graph) => { byKey(graph).get("transition_proof_gate").config.profile_key = "custom_qa"; }],
    ["wrong profile version", (graph) => { byKey(graph).get("transition_proof_gate").config.profile_version = "2"; }],
    ["non-neutral hold", (graph) => { byKey(graph).get("qa_needs_human_end").config.project_status.target_state_id = bindings.in_progress_state_id; }],
    ["indirect End", (graph) => { graph.edges.find(({ id }) => id.endsWith("025")).target = byKey(graph).get("finalize_transition").id; }],
    ["changed route UUID", (graph) => {
      const route = byKey(graph).get("transition_proof_gate"); const old = route.id;
      route.id = "17171717-1717-4717-8717-171717171717";
      for (const edge of graph.edges) { if (edge.source === old) edge.source = route.id; if (edge.target === old) edge.target = route.id; }
    }],
    ["legacy gateway parallel route", (graph) => {
      graph.nodes.push({
        id: "10000000-0000-5000-8000-000000000019",
        key: "transition_route",
        type: "gateway",
        name: "Legacy final route",
      });
      graph.edges.push({
        id: "20000000-0000-5000-8000-000000000026",
        source: byKey(graph).get("finalize_transition").id,
        target: "10000000-0000-5000-8000-000000000019",
      });
    }],
    ["unrelated extra node", (graph) => {
      graph.nodes.push({
        id: "19191919-1919-4919-8919-191919191919",
        key: "synthetic_side_path",
        type: "end",
        name: "Synthetic side path",
        config: { project_status: { target_state_id: null } },
      });
    }],
    ["changed outcome edge UUID", (graph) => { graph.edges.find(({ id }) => id.endsWith("023")).id = "18181818-1818-4818-8818-181818181818"; }],
  ];
  for (const [name, mutate] of mutations) {
    const hostile = structuredClone(clean); mutate(hostile);
    assert.throws(() => validateFinalProofGate(hostile, expectedFinalStates), /FINAL_PROOF_GATE_INVALID/, name);
  }
});

test("places the single verified canary task before either End", () => {
  const graph = renderProcess(blueprint, bindings);
  const pairs = edgePairs(graph);
  const incoming = new Map(expectedKeys.map((key) => [key, []]));
  for (const [source, target] of pairs) incoming.get(target).push(source);
  assert.deepEqual(incoming.get("finalize_transition"), ["project_start"]);
  assert.deepEqual(incoming.get("transition_proof_gate"), ["finalize_transition"]);
  assert.deepEqual(incoming.get("ready_for_production_end"), ["transition_proof_gate"]);
  assert.deepEqual(incoming.get("in_progress_end"), ["transition_proof_gate"]);
  assert.deepEqual(incoming.get("qa_needs_human_end"), ["transition_proof_gate"]);
});

test("blueprint is universal and contains no product, host, path, model, or installation literals", () => {
  const raw = JSON.stringify(blueprint);
  assert.doesNotMatch(raw, /PayDemo|paydemo|Grok|grok|\/Users\/|\/private\/tmp\/|https?:\/\/(?!example\.invalid)|127\.0\.0\.1|localhost|906cbb3d|20b71a86|1eb21488|ba38ce41|c312fa9e/);
  assert.doesNotMatch(raw, /checkout|payment-method|real-money|scripts\/qah\/adapters\//i);
  for (const node of blueprint.graph.nodes) {
    assert.match(node.id, UUID);
    assert.equal(typeof node.name, "string");
    assert.ok(node.name.length > 0 && node.name.length <= 40);
  }
});

test("renderer is canonical, immutable, and rejects invalid or unresolved bindings", () => {
  const first = renderProcessJson(blueprint, bindings);
  const second = renderProcessJson(blueprint, structuredClone(bindings));
  assert.equal(first, second);
  assert.deepEqual(JSON.parse(first), renderProcess(blueprint, bindings));
  assert.doesNotMatch(first, /__BINDING_[A-Z0-9_]+__/);

  const rendered = JSON.parse(first);
  const ids = [...rendered.nodes.map((node) => node.id), ...rendered.edges.map((edge) => edge.id)];
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, UUID);
  assert.equal(JSON.stringify(blueprint).includes(bindings.project_id), false);

  assert.throws(() => renderProcess(blueprint, { ...bindings, in_progress_state_id: bindings.ready_for_qa_state_id }), /state UUIDs must be distinct/);
  assert.throws(() => renderProcess(blueprint, { ...bindings, project_id: "not-a-uuid" }), /project_id must be a UUID/);
  assert.throws(() => renderProcess(blueprint, { ...bindings, profile_artifact: { ...bindings.profile_artifact, role: "output" } }), /profile_artifact/);
  assert.throws(() => renderProcess(blueprint, { ...bindings, decision_agent_employee_id: undefined }), /decision agent/);
  assert.throws(() => renderProcess({ ...blueprint, graph: { ...blueprint.graph, name: "__BINDING_UNKNOWN__" } }, bindings), /unresolved binding token/);
  assert.throws(() => renderProcess({ ...blueprint, graph: { ...blueprint.graph, name: "prefix __BINDING malformed" } }, bindings), /unresolved binding token/);
  const deletedEdge = structuredClone(blueprint);
  deletedEdge.graph.edges.pop();
  assert.throws(() => renderProcess(deletedEdge, bindings), /topology fingerprint|blueprint integrity/);
  const mutatedConfig = structuredClone(blueprint);
  mutatedConfig.graph.nodes.find((node) => node.key === "finalize_transition").config.failure_handling.mode = "continue";
  assert.throws(() => renderProcess(mutatedConfig, bindings), /topology fingerprint|blueprint integrity/);
});
