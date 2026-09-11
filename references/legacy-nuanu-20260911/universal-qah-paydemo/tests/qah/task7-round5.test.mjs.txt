import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const module = await import("../../scripts/qah/install-preflight.mjs");

test("management and worker routes use the two current production ingress contracts", () => {
  assert.equal(module.managementPath("/api/workspaces/demo/agent-employees/"), "/be/api/workspaces/demo/agent-employees/");
  assert.equal(module.workerPath("/agent-worker/whoami/"), "/be/api/agent-worker/whoami/");
});

test("real native remote snapshot has no model, exact empty MCP, and only the stock terminal-LF normalization", async () => {
  const prompt = await readFile(new URL("../../qah/generic-qa.v1.md", import.meta.url));
  assert.equal(prompt.at(-1), 0x0a);
  const persistedPrompt = prompt.subarray(0, -1).toString("utf8");
  const snapshot = { configuration_schema_version: 1, runtime: "remote", remote_protocol: "native", system_prompt: persistedPrompt, endpoint_url: "", health_path: "", tools: ["git", "tool_execution"], skills: [{ source: "git", url: "https://github.com/solomindanil/NuanuFlowQA.git", subpath: "skills/qa-check", pinned_sha: "a".repeat(40) }], integrations: [], memory_loadout: { enabled: false, bindings: [] }, mcp_servers: [], a2a: null, capability_ceiling: { tools: ["git", "tool_execution"], integrations: [], mcp_servers: [], memory: [] }, execution_policy: { external_side_effects: "remote_admission_policy" }, catalog_provenance: { version: 1, curated_skill_catalog_revision: 1 } };
  assert.doesNotThrow(() => module.validateRemoteSnapshot(snapshot, { prompt_bytes: prompt, tools: ["git", "tool_execution"], integrations: [], skills: snapshot.skills }));
  assert.throws(() => module.validateRemoteSnapshot({ ...snapshot, system_prompt: prompt.toString("utf8") }, { prompt_bytes: prompt, tools: snapshot.tools, integrations: [], skills: snapshot.skills }), /prompt bytes/i);
  assert.throws(() => module.validateRemoteSnapshot({ ...snapshot, system_prompt: persistedPrompt.slice(0, -1) }, { prompt_bytes: prompt, tools: snapshot.tools, integrations: [], skills: snapshot.skills }), /prompt bytes/i);
  assert.throws(() => module.validateRemoteSnapshot({ ...snapshot, base_model: "openai/gpt" }, { prompt_bytes: prompt, tools: snapshot.tools, integrations: [], skills: snapshot.skills }), /base_model|remote snapshot/i);
});

test("bounded reader cancels chunked bodies before allocating beyond the cap", async () => {
  let cancelled = false; let reads = 0;
  const reader = { async read() { reads += 1; return reads === 1 ? { done: false, value: new Uint8Array(8) } : { done: false, value: new Uint8Array(8) }; }, async cancel() { cancelled = true; } };
  const response = { headers: new Headers(), body: { getReader: () => reader } };
  await assert.rejects(module.readBoundedResponse(response, 10, "fixture"), /oversized/i);
  assert.equal(cancelled, true); assert.equal(reads, 2);
});

test("only internal file Artifact representation is downloadable", () => {
  assert.throws(() => module.validateFileArtifactVersion({ file_asset: null, representation: { type: "external_resource", canonicalUrl: "https://attacker.invalid/x" } }), /external|file/i);
  assert.doesNotThrow(() => module.validateFileArtifactVersion({ file_asset: "11111111-1111-4111-8111-111111111111", representation: { type: "file", fileAssetId: "11111111-1111-4111-8111-111111111111" } }));
});

test("platform Start requires exactly one outgoing edge and no incoming or duplicate Start", () => {
  const start = { id: "11111111-1111-4111-8111-111111111111", key: "project_start", type: "start", config: { project_process_start: { binding_id: "22222222-2222-4222-8222-222222222222", project_id: "33333333-3333-4333-8333-333333333333", state_id: "44444444-4444-4444-8444-444444444444" } } };
  const target = { id: "55555555-5555-4555-8555-555555555555", key: "next", type: "agent_task" };
  const request = { project_process_binding_id: start.config.project_process_start.binding_id, project_id: start.config.project_process_start.project_id, ready_for_qa_state_id: start.config.project_process_start.state_id };
  assert.throws(() => module.validateLiveStartSelection({ nodes: [start, target], edges: [{ id: "66666666-6666-4666-8666-666666666666", source: start.id, target: target.id }, { id: "77777777-7777-4777-8777-777777777777", source: start.id, target: target.id }] }, request), /exactly one|outgoing/i);
});
