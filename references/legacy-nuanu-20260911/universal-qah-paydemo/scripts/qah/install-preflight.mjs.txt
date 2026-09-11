import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { lstat, realpath } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { promisify, types } from "node:util";
import { canonicalJson, sha256 } from "./canonical.mjs";

const execFile = promisify(execFileCallback);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const MAX_JSON = 262144;
const MAX_FILE = 262144;
const POLICY_PATH = "qah/install-policy.v1.json";
const ALLOWED_REPOSITORY_ORIGIN = "https://github.com/solomindanil/NuanuFlowQA.git";
const INSTALL_POLICY_SHA256 = "sha256:ae833be3ff1ea80b19d39b3f575becf9e5e564246bbe355663ffb79b848d4c27";
export const REQUIRED_DECISION_MODEL = "openai/gpt-5.6-sol-pro";
export const REQUIRED_DECISION_CAPABILITIES = Object.freeze(["git", "nuanu_mcp", "tool_execution"]);
const CURRENT_PLATFORM_START_OUTPUT = Object.freeze({
  data: Object.freeze({
    invoked_at: Object.freeze({ description: "When this Process run was invoked", type: "string" }),
    trigger: Object.freeze({ description: "How this Process run started", type: "string" }),
  }),
  artifacts: Object.freeze({
    flow_item: Object.freeze({ description: "Exact Flow item snapshot that invoked this Process", kind: "flow_item" }),
  }),
});
const ATTESTATIONS = new WeakMap();
const GIT_CHILD_ENVIRONMENT = Object.freeze({
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_TERMINAL_PROMPT: "0",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_LAZY_FETCH: "1",
  GIT_NO_REPLACE_OBJECTS: "1",
});

export const DIRECT_READ_PATH_KINDS = Object.freeze(["binding", "graph", "agents", "agent_version", "artifact", "artifact_download", "worker_whoami"]);

const hexDigest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const prefixedDigest = (bytes) => `sha256:${hexDigest(bytes)}`;

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function dataObject(value, label) {
  object(value, label);
  if (types.isProxy(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${label} must be a plain data object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new TypeError(`${label} must contain only string fields`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) throw new TypeError(`${label} must contain only enumerable data fields`);
  }
  return value;
}

function required(value, keys, label) {
  object(value, label);
  for (const key of keys) if (!Object.hasOwn(value, key)) throw new TypeError(`${label} is missing ${key}`);
  return value;
}

function exactDataObject(value, keys, label) {
  dataObject(value, label);
  const actual = Reflect.ownKeys(value);
  if (actual.some((key) => typeof key !== "string") || canonicalJson([...actual].sort()) !== canonicalJson([...keys].sort())) {
    throw new TypeError(`${label} must have exact fields`);
  }
  return value;
}

function uuid(value, label) {
  if (typeof value !== "string" || !UUID.test(value)) throw new TypeError(`${label} must be a UUID`);
  return value;
}

function exactCurrentPlatformStartOutput(value) {
  exactDataObject(value, ["data", "artifacts"], "platform Start output");
  exactDataObject(value.data, ["invoked_at", "trigger"], "platform Start output.data");
  exactDataObject(value.data.invoked_at, ["description", "type"], "platform Start invoked_at descriptor");
  exactDataObject(value.data.trigger, ["description", "type"], "platform Start trigger descriptor");
  exactDataObject(value.artifacts, ["flow_item"], "platform Start output.artifacts");
  exactDataObject(value.artifacts.flow_item, ["description", "kind"], "platform Start flow_item descriptor");
  if (canonicalJson(value) !== canonicalJson(CURRENT_PLATFORM_START_OUTPUT)) {
    throw new TypeError("platform Start output must match the current closed Column contract");
  }
  return JSON.parse(canonicalJson(CURRENT_PLATFORM_START_OUTPUT));
}

export function normalizeDecisionAgentMetadata(value) {
  exactDataObject(value, ["requested_model", "required_capabilities"], "decision metadata");
  if (value.requested_model !== REQUIRED_DECISION_MODEL) throw new TypeError("decision metadata model must match the code-owned contract");
  if (!Array.isArray(value.required_capabilities) || types.isProxy(value.required_capabilities)
    || value.required_capabilities.length !== REQUIRED_DECISION_CAPABILITIES.length) {
    throw new TypeError("decision metadata capabilities and order must match the code-owned contract");
  }
  const keys = Reflect.ownKeys(value.required_capabilities);
  if (canonicalJson(keys.map(String).sort()) !== canonicalJson(["0", "1", "2", "length"].sort())) {
    throw new TypeError("decision metadata capabilities must be a closed array");
  }
  for (let index = 0; index < REQUIRED_DECISION_CAPABILITIES.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value.required_capabilities, index);
    if (!descriptor?.enumerable || !("value" in descriptor) || descriptor.value !== REQUIRED_DECISION_CAPABILITIES[index]) {
      throw new TypeError("decision metadata capabilities and order must match the code-owned contract");
    }
  }
  return { requested_model: REQUIRED_DECISION_MODEL, required_capabilities: [...REQUIRED_DECISION_CAPABILITIES] };
}

export function projectPlatformStart(value, expected) {
  dataObject(value, "platform_start_node");
  uuid(value.id, "platform Start id");
  if (value.key !== "project_start" || value.type !== "start") throw new TypeError("platform Start identity is invalid");
  if (typeof value.name !== "string" || value.name.length < 1 || value.name.length > 80 || Buffer.byteLength(value.name, "utf8") > 256) {
    throw new TypeError("platform Start name is outside bounds");
  }
  dataObject(value.trigger, "platform Start trigger");
  if (value.trigger.mode !== "from_project") throw new TypeError("platform Start trigger mode must be from_project");
  exactDataObject(value.config, ["project_process_start", "output"], "platform Start config");
  const generated = exactDataObject(
    value.config.project_process_start,
    ["binding_id", "project_id", "state_id"],
    "platform Start project binding",
  );
  for (const field of ["binding_id", "project_id", "state_id"]) uuid(generated[field], `platform Start ${field}`);
  if (generated.binding_id !== expected.project_process_binding_id
    || generated.project_id !== expected.project_id
    || generated.state_id !== expected.ready_for_qa_state_id) {
    throw new TypeError("platform Start project binding is foreign");
  }
  const projected = {
    id: value.id,
    key: "project_start",
    type: "start",
    name: value.name,
    trigger: { mode: "from_project" },
    config: {
      project_process_start: {
        binding_id: generated.binding_id,
        project_id: generated.project_id,
        state_id: generated.state_id,
      },
      output: exactCurrentPlatformStartOutput(value.config.output),
    },
  };
  return JSON.parse(canonicalJson(projected));
}

export function projectPlatformStartEdge(value, start) {
  dataObject(value, "platform Start edge");
  for (const field of ["id", "source", "target"]) uuid(value[field], `platform Start edge ${field}`);
  if (value.source !== start.id || value.target === start.id) throw new TypeError("platform Start edge identity is foreign");
  return JSON.parse(canonicalJson({ id: value.id, source: value.source, target: value.target }));
}

function requestShape(value) {
  const keys = ["workspace_slug", "workspace_id", "project_id", "project_process_binding_id", "process_template_id", "ready_for_qa_state_id", "in_progress_state_id", "ready_for_production_state_id", "qa_agent_employee_id", "qa_agent_version_id", "decision_agent_employee_id", "decision_agent_version_id", "decision_agent_metadata", "profile_artifact", "repository_origin", "repository_path", "commit"];
  exactDataObject(value, keys, "install request");
  for (const key of keys.filter((key) => key.endsWith("_id"))) if (!UUID.test(value[key])) throw new TypeError(`${key} must be a UUID`);
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(value.workspace_slug) || !COMMIT.test(value.commit) || !isAbsolute(value.repository_path)) throw new TypeError("install request workspace/commit/repository path is invalid");
  const origin = new URL(value.repository_origin);
  if (origin.username || origin.password || origin.search || origin.hash || origin.href !== value.repository_origin) throw new TypeError("repository origin must be exact and credential-free");
  if (new Set([value.ready_for_qa_state_id, value.in_progress_state_id, value.ready_for_production_state_id]).size !== 3) throw new TypeError("states must be distinct");
  if (value.qa_agent_employee_id === value.decision_agent_employee_id || value.qa_agent_version_id === value.decision_agent_version_id) throw new TypeError("agents must be distinct");
  const decisionAgentMetadata = normalizeDecisionAgentMetadata(value.decision_agent_metadata);
  exactDataObject(value.profile_artifact, ["artifact_id", "version_id", "kind", "role"], "profile ref");
  if (!UUID.test(value.profile_artifact.artifact_id) || !UUID.test(value.profile_artifact.version_id) || value.profile_artifact.kind !== "document" || value.profile_artifact.role !== "implementation") throw new TypeError("profile ref is invalid");
  const normalized = structuredClone(value);
  normalized.decision_agent_metadata = decisionAgentMetadata;
  return normalized;
}

export function managementPath(path) { if (!path.startsWith("/api/")) throw new TypeError("management path must start /api/"); return `/be${path}`; }
export function workerPath(path) { if (!path.startsWith("/agent-worker/")) throw new TypeError("worker path must start /agent-worker/"); return `/be/api${path}`; }

function apiOrigin(environment) {
  const value = environment.NUANU_API_URL ?? "https://flow.nuanu.com";
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || url.href.slice(0, -1) !== url.origin) throw new TypeError("Nuanu API origin must be exact");
  const testMode = environment.NUANU_QAH_PREFLIGHT_TEST_MODE === "1";
  if (testMode) {
    if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || !url.port) throw new TypeError("test API origin must be exact loopback");
  } else if (url.origin !== "https://flow.nuanu.com") throw new TypeError("production API origin must be https://flow.nuanu.com");
  return { origin: url.origin, testMode };
}

export async function readBoundedResponse(response, limit, label) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) throw new Error(`${label} response is oversized`);
  if (!response.body?.getReader) throw new Error(`${label} response has no bounded stream`);
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error(`${label} response is oversized`); }
      chunks.push(Buffer.from(value));
    }
  } catch (error) { try { await reader.cancel(); } catch {} throw error; }
  return Buffer.concat(chunks, size);
}

async function get(origin, path, key, label, accept = "application/json") {
  const response = await fetch(`${origin}${path}`, { method: "GET", redirect: "manual", headers: { Accept: accept, ...(key ? { "X-Api-Key": key } : {}) }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`${label} HTTP ${response.status}`);
  return readBoundedResponse(response, accept === "application/json" ? MAX_JSON : MAX_FILE, label);
}

async function json(origin, path, key, label, agentKey = false) {
  const response = await fetch(`${origin}${path}`, { method: "GET", redirect: "manual", headers: { Accept: "application/json", [agentKey ? "X-Agent-Key" : "X-Api-Key"]: key }, signal: AbortSignal.timeout(10000) });
  if (!response.ok || response.redirected || response.status >= 300) throw new Error(`${label} HTTP/redirect rejected`);
  const bytes = await readBoundedResponse(response, MAX_JSON, label);
  let text; try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw new Error(`${label} returned invalid UTF-8`); }
  try { return JSON.parse(text); } catch { throw new Error(`${label} returned invalid JSON`); }
}

export function buildGitReadSpawnSpec(repositoryPath, args, maxBuffer = MAX_FILE) {
  return {
    file: "git",
    args: ["-C", repositoryPath, ...args],
    options: {
      encoding: "buffer",
      timeout: 10000,
      maxBuffer,
      env: { ...GIT_CHILD_ENVIRONMENT },
    },
  };
}

async function git(repositoryPath, args, maxBuffer = MAX_FILE) {
  const metadata = await lstat(repositoryPath);
  if (!metadata.isDirectory() || metadata.isSymbolicLink() || await realpath(repositoryPath) !== repositoryPath) throw new Error("repository path must be an exact real directory");
  const spec = buildGitReadSpawnSpec(repositoryPath, args, maxBuffer);
  const result = await execFile(spec.file, spec.args, spec.options);
  return Buffer.from(result.stdout);
}

function list(value, label) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.results)) return value.results;
  throw new TypeError(`${label} must be an array or results page`);
}

export function validateRemoteSnapshot(snapshot, expected) {
  object(snapshot, "remote snapshot");
  if (Object.hasOwn(snapshot, "base_model") || snapshot.runtime !== "remote" || snapshot.remote_protocol !== "native" || canonicalJson(snapshot.mcp_servers) !== "[]") throw new Error("remote snapshot runtime/base_model/MCP contract is invalid");
  const persistedPromptBytes = expected.prompt_bytes.at(-1) === 0x0a ? expected.prompt_bytes.subarray(0, -1) : expected.prompt_bytes;
  if (!Buffer.from(snapshot.system_prompt ?? "", "utf8").equals(persistedPromptBytes)) throw new Error("remote snapshot prompt bytes do not match trusted policy template");
  for (const field of ["tools", "skills", "integrations"]) if (canonicalJson(snapshot[field]) !== canonicalJson(expected[field])) throw new Error(`remote snapshot ${field} do not exactly match trusted policy`);
}

function verifyProfilePolicy(policy, role, version, promptBytes) {
  required(policy, ["schema_version", "profiles", "repository"], "Git install policy");
  if (policy.schema_version !== "nuanu.qah-install-policy.v1") throw new Error("Git install policy version is unsupported");
  const expected = required(policy.profiles?.[role], ["prompt_path", "prompt_sha256", "tools", "skills", "integrations"], `${role} policy`);
  if (prefixedDigest(promptBytes) !== expected.prompt_sha256) throw new Error(`${role} trusted prompt template hash differs from policy`);
  validateRemoteSnapshot(version.configuration_snapshot, { prompt_bytes: promptBytes, tools: expected.tools, skills: expected.skills, integrations: expected.integrations });
}

export function validateFileArtifactVersion(version) {
  if (!UUID.test(version?.file_asset) || version.representation?.type !== "file" || version.representation.fileAssetId !== version.file_asset) throw new Error("ArtifactVersion must be an exact internal file representation; external resources are forbidden");
}

export function validateLiveStartSelection(selection, request) {
  const starts = selection?.nodes?.filter((node) => node?.type === "start" || node?.key === "project_start") ?? [];
  if (starts.length !== 1 || starts[0].key !== "project_start" || starts[0].type !== "start") throw new Error("current graph must contain exactly one server-owned Start");
  const rawStart = starts[0];
  const outgoing = selection.edges?.filter((edge) => edge?.source === rawStart.id) ?? [];
  const incoming = selection.edges?.filter((edge) => edge?.target === rawStart.id) ?? [];
  if (outgoing.length !== 1 || incoming.length !== 0) throw new Error("platform Start requires exactly one outgoing edge and no incoming edge");
  if (!selection.nodes.some((node) => node.id === outgoing[0].target)) throw new Error("live Start/edge readback is foreign");
  const start = projectPlatformStart(rawStart, request);
  const edge = projectPlatformStartEdge(outgoing[0], start);
  return { start, edge };
}

function verifyAgent(agent, version, whoami, request, role) {
  const employee = role === "qa" ? request.qa_agent_employee_id : request.decision_agent_employee_id;
  const versionId = role === "qa" ? request.qa_agent_version_id : request.decision_agent_version_id;
  if (agent?.id !== employee || agent.runtime !== "remote" || agent.is_active !== true || agent.active_version?.id !== versionId || agent.remote_profile?.health_status !== "online") throw new Error(`${role} agent is foreign, inactive, or offline`);
  if (version?.id !== versionId || version.agent_employee !== employee || version.workspace !== request.workspace_id || !DIGEST.test(`sha256:${version.content_hash}`) || !version.published_at) throw new Error(`${role} AgentVersion readback is foreign`);
  if (whoami?.agent_id !== employee || whoami.workspace !== request.workspace_slug || whoami.is_active !== true) throw new Error(`${role} worker whoami binding is foreign`);
}

export async function runDirectInstallPreflight(rawRequest, { environment = process.env } = {}) {
  const request = requestShape(rawRequest);
  const { origin, testMode } = apiOrigin(environment);
  if (!testMode && request.repository_origin !== ALLOWED_REPOSITORY_ORIGIN) throw new Error("repository origin is not on the code-owned production allowlist");
  const apiKey = environment.NUANU_API_KEY;
  const qaKey = environment.NUANU_QA_AGENT_KEY;
  const decisionKey = environment.NUANU_DECISION_AGENT_KEY;
  if (![apiKey, qaKey, decisionKey].every((key) => typeof key === "string" && key.length >= 6)) throw new Error("Nuanu API and worker credentials are required from environment");
  const ws = encodeURIComponent(request.workspace_slug);
  const binding = await json(origin, managementPath(`/api/workspaces/${ws}/projects/${request.project_id}/process-bindings/${request.project_process_binding_id}/`), apiKey, "binding");
  if (binding.id !== request.project_process_binding_id || binding.kind !== "column" || binding.project_state?.id !== request.ready_for_qa_state_id || binding.process_template?.id !== request.process_template_id || binding.process_template?.workspace_id !== request.workspace_id || binding.status !== "active" || binding.invalid !== false || binding.needs_attention !== false) throw new Error("binding readback is foreign");
  const graph = await json(origin, managementPath(`/api/workspaces/${ws}/process-templates/${request.process_template_id}/graph/?view=selection&node_keys=project_start&include_neighbors=true&include_incident_edges=true`), apiKey, "graph");
  if (graph.process_template_id !== request.process_template_id || graph.schema_version !== 1) throw new Error("Process graph identity is foreign");
  const { start, edge } = validateLiveStartSelection(graph.selection, request);
  const agents = list(await json(origin, managementPath(`/api/workspaces/${ws}/agent-employees/`), apiKey, "agents"), "agents");
  const qaVersion = await json(origin, managementPath(`/api/workspaces/${ws}/agent-employees/${request.qa_agent_employee_id}/versions/${request.qa_agent_version_id}/`), apiKey, "QA AgentVersion");
  const decisionVersion = await json(origin, managementPath(`/api/workspaces/${ws}/agent-employees/${request.decision_agent_employee_id}/versions/${request.decision_agent_version_id}/`), apiKey, "decision AgentVersion");
  const qaWhoami = await json(origin, workerPath("/agent-worker/whoami/"), qaKey, "QA worker whoami", true);
  const decisionWhoami = await json(origin, workerPath("/agent-worker/whoami/"), decisionKey, "decision worker whoami", true);
  verifyAgent(agents.find((agent) => agent.id === request.qa_agent_employee_id), qaVersion, qaWhoami, request, "qa");
  verifyAgent(agents.find((agent) => agent.id === request.decision_agent_employee_id), decisionVersion, decisionWhoami, request, "decision");
  const remote = (await git(request.repository_path, ["remote", "get-url", "origin"], 4096)).toString("utf8").trim();
  if (remote !== request.repository_origin) throw new Error("Git repository origin is foreign");
  try {
    await git(request.repository_path, ["cat-file", "-e", `${request.commit}^{commit}`], 4096);
  } catch {
    throw new Error("pinned Git commit is not present locally");
  }
  const policyBytes = await git(request.repository_path, ["show", `${request.commit}:${POLICY_PATH}`]);
  if (prefixedDigest(policyBytes) !== INSTALL_POLICY_SHA256) throw new Error("Git install policy bytes do not match the code-owned pinned SHA");
  let policy; try { policy = JSON.parse(policyBytes.toString("utf8")); } catch { throw new Error("Git install policy is invalid JSON"); }
  if (policy.repository?.origin !== ALLOWED_REPOSITORY_ORIGIN || policy.repository?.profile_path !== "qa-harness.yaml") throw new Error("Git install policy repository contract is invalid");
  const qaPrompt = await git(request.repository_path, ["show", `${request.commit}:${policy.profiles.qa.prompt_path}`]);
  const decisionPrompt = await git(request.repository_path, ["show", `${request.commit}:${policy.profiles.decision.prompt_path}`]);
  verifyProfilePolicy(policy, "qa", qaVersion, qaPrompt); verifyProfilePolicy(policy, "decision", decisionVersion, decisionPrompt);
  const profileGit = await git(request.repository_path, ["show", `${request.commit}:qa-harness.yaml`]);
  const artifact = await json(origin, managementPath(`/api/workspaces/${ws}/artifacts/${request.profile_artifact.artifact_id}/`), apiKey, "profile Artifact");
  const stored = artifact.versions?.find((version) => version.id === request.profile_artifact.version_id);
  if (artifact.id !== request.profile_artifact.artifact_id || artifact.workspace !== request.workspace_id || artifact.kind !== "document" || artifact.status !== "stored" || !stored) throw new Error("profile ArtifactVersion readback is foreign");
  validateFileArtifactVersion(stored);
  const profileArtifact = await get(origin, managementPath(`/api/workspaces/${ws}/artifacts/${artifact.id}/download/?version=${stored.id}&proxy=1`), apiKey, "profile Artifact bytes", "*/*");
  if (profileArtifact.byteLength !== stored.size || hexDigest(profileArtifact) !== stored.checksum || !profileArtifact.equals(profileGit)) throw new Error("profile ArtifactVersion bytes/checksum differ from pinned Git");
  const bindings = { project_process_binding_id: request.project_process_binding_id, project_id: request.project_id, ready_for_qa_state_id: request.ready_for_qa_state_id, in_progress_state_id: request.in_progress_state_id, ready_for_production_state_id: request.ready_for_production_state_id, qa_agent_employee_id: request.qa_agent_employee_id, qa_agent_version_id: request.qa_agent_version_id, decision_agent_employee_id: request.decision_agent_employee_id, decision_agent_version_id: request.decision_agent_version_id, decision_agent_metadata: request.decision_agent_metadata, platform_start_node: start, platform_start_edge: edge, platform_start_fingerprint: sha256(start), platform_start_edge_fingerprint: sha256(edge), profile_artifact: request.profile_artifact };
  const attestation = Object.freeze({ kind: "nuanu.qah-direct-install-attestation.v1" });
  ATTESTATIONS.set(attestation, { bindings, graph_hash: graph.graph_hash, definition_etag: graph.definition_etag, profile_digest: prefixedDigest(profileArtifact), policy_digest: prefixedDigest(policyBytes), test_mode: testMode, install_ready: false, unmet_preconditions: ["Task9 must authoritatively observe Codex worker adapter version, capabilities, and strongest published model; current server whoami does not expose them"] });
  return attestation;
}

export function isInstallAttestation(value) { return ATTESTATIONS.has(value); }

export function consumeDirectInstallAttestation(value) {
  const payload = ATTESTATIONS.get(value);
  if (!payload) throw new TypeError("direct install attestation from this process is required");
  return structuredClone(payload);
}
