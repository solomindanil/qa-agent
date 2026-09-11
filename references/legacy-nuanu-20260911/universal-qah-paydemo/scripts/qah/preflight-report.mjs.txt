#!/usr/bin/env node

import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { types } from "node:util";

import { canonicalJson, sha256 } from "./canonical.mjs";
import {
  consumeDirectInstallAttestation,
  normalizeDecisionAgentMetadata,
  projectPlatformStart,
  projectPlatformStartEdge,
  runDirectInstallPreflight,
} from "./install-preflight.mjs";

const MAX_REQUEST_BYTES = 262_144;
const REPORT_SCHEMA = "nuanu.qah-preflight-report.v1";
const REPORT_FIELDS = Object.freeze([
  "bindings",
  "definition_etag",
  "graph_hash",
  "install_ready",
  "policy_digest",
  "profile_digest",
  "test_mode",
  "unmet_preconditions",
]);
const BINDING_FIELDS = Object.freeze([
  "project_process_binding_id",
  "project_id",
  "ready_for_qa_state_id",
  "in_progress_state_id",
  "ready_for_production_state_id",
  "qa_agent_employee_id",
  "qa_agent_version_id",
  "decision_agent_employee_id",
  "decision_agent_version_id",
  "decision_agent_metadata",
  "platform_start_node",
  "platform_start_edge",
  "platform_start_fingerprint",
  "platform_start_edge_fingerprint",
  "profile_artifact",
]);
const DECISION_AGENT_METADATA_FIELDS = Object.freeze(["requested_model", "required_capabilities"]);
const PROFILE_ARTIFACT_FIELDS = Object.freeze(["artifact_id", "version_id", "kind", "role"]);
const PLATFORM_START_FIELDS = Object.freeze(["config", "id", "key", "name", "trigger", "type"]);
const PLATFORM_START_EDGE_FIELDS = Object.freeze(["id", "source", "target"]);
const ALLOWED_ENVIRONMENT_FIELDS = Object.freeze([
  "NUANU_API_URL",
  "NUANU_API_KEY",
  "NUANU_QA_AGENT_KEY",
  "NUANU_DECISION_AGENT_KEY",
]);
const SECRET_ENVIRONMENT_FIELDS = Object.freeze([
  "NUANU_API_KEY",
  "NUANU_QA_AGENT_KEY",
  "NUANU_DECISION_AGENT_KEY",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;

function exactOwnKeys(value, expected, label) {
  if (types.isProxy(value) || value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be a non-proxy object`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string") || canonicalJson([...keys].sort()) !== canonicalJson([...expected].sort())) {
    throw new TypeError(`${label} must have exact fields`);
  }
}

function assertClosedJson(value, label, stack = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value !== "object" || types.isProxy(value)) throw new TypeError(`${label} must contain only non-proxy JSON values`);
  if (stack.has(value)) throw new TypeError(`${label} must not contain cycles`);
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError(`${label} must contain only plain JSON objects`);
  }
  stack.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) throw new TypeError(`${label} must not contain sparse arrays`);
      assertClosedJson(value[index], `${label}[${index}]`, stack);
    }
    if (Reflect.ownKeys(value).some((key) => key !== "length" && !/^(0|[1-9][0-9]*)$/.test(String(key)))) {
      throw new TypeError(`${label} arrays must not have extra fields`);
    }
  } else {
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") throw new TypeError(`${label} must not contain symbol fields`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !("value" in descriptor)) throw new TypeError(`${label}.${key} must be an enumerable data field`);
      assertClosedJson(descriptor.value, `${label}.${key}`, stack);
    }
  }
  stack.delete(value);
}

function productionEnvironment(environment) {
  if (environment?.NUANU_QAH_PREFLIGHT_TEST_MODE !== undefined) {
    throw new Error("NUANU_QAH_PREFLIGHT_TEST_MODE is forbidden for the production report command");
  }
  const result = {};
  for (const key of ALLOWED_ENVIRONMENT_FIELDS) {
    if (environment?.[key] !== undefined) result[key] = environment[key];
  }
  return result;
}

function validateConsumedPayload(payload) {
  exactOwnKeys(payload, REPORT_FIELDS, "consumed preflight payload");
  assertClosedJson(payload, "consumed preflight payload");
  exactOwnKeys(payload.bindings, BINDING_FIELDS, "bindings");
  exactOwnKeys(payload.bindings.decision_agent_metadata, DECISION_AGENT_METADATA_FIELDS, "decision_agent_metadata");
  exactOwnKeys(payload.bindings.profile_artifact, PROFILE_ARTIFACT_FIELDS, "profile_artifact");
  exactOwnKeys(payload.bindings.platform_start_node, PLATFORM_START_FIELDS, "platform_start_node");
  exactOwnKeys(payload.bindings.platform_start_edge, PLATFORM_START_EDGE_FIELDS, "platform_start_edge");
  for (const field of [
    "project_process_binding_id", "project_id", "ready_for_qa_state_id", "in_progress_state_id", "ready_for_production_state_id",
    "qa_agent_employee_id", "qa_agent_version_id", "decision_agent_employee_id", "decision_agent_version_id",
  ]) if (typeof payload.bindings[field] !== "string" || !UUID.test(payload.bindings[field])) throw new TypeError(`${field} must be a UUID`);
  if (!UUID.test(payload.bindings.profile_artifact.artifact_id)
    || !UUID.test(payload.bindings.profile_artifact.version_id)
    || payload.bindings.profile_artifact.kind !== "document"
    || payload.bindings.profile_artifact.role !== "implementation") {
    throw new TypeError("profile_artifact must be the exact implementation document reference");
  }
  const decisionMetadata = normalizeDecisionAgentMetadata(payload.bindings.decision_agent_metadata);
  if (canonicalJson(decisionMetadata) !== canonicalJson(payload.bindings.decision_agent_metadata)) {
    throw new TypeError("decision_agent_metadata is not canonical");
  }
  const start = projectPlatformStart(payload.bindings.platform_start_node, payload.bindings);
  const edge = projectPlatformStartEdge(payload.bindings.platform_start_edge, start);
  if (canonicalJson(start) !== canonicalJson(payload.bindings.platform_start_node)
    || canonicalJson(edge) !== canonicalJson(payload.bindings.platform_start_edge)) {
    throw new TypeError("platform Start bindings must be exact safe projections");
  }
  if (payload.bindings.platform_start_fingerprint !== sha256(start)
    || payload.bindings.platform_start_edge_fingerprint !== sha256(edge)) {
    throw new TypeError("platform Start fingerprints must cover the emitted projections");
  }
  for (const field of ["graph_hash", "definition_etag", "profile_digest", "policy_digest"]) {
    if (typeof payload[field] !== "string" || !DIGEST.test(payload[field])) throw new TypeError(`${field} must be a SHA-256 digest`);
  }
  if (typeof payload.test_mode !== "boolean" || payload.test_mode) throw new TypeError("test_mode must be false for a production report");
  if (typeof payload.install_ready !== "boolean") throw new TypeError("install_ready must be a boolean");
  if (!Array.isArray(payload.unmet_preconditions) || !payload.unmet_preconditions.every((value) => typeof value === "string")) {
    throw new TypeError("unmet_preconditions must be an array of strings");
  }
}

function containsReportText(value, text) {
  if (typeof value === "string") return value.includes(text);
  if (Array.isArray(value)) return value.some((entry) => containsReportText(entry, text));
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, entry]) => key.includes(text) || containsReportText(entry, text));
  }
  return false;
}

function rejectSecretReflection(report, environment) {
  for (const key of SECRET_ENVIRONMENT_FIELDS) {
    if (containsReportText(report, key)) throw new Error("preflight report reflects a credential field name");
    const secret = environment?.[key];
    if (typeof secret === "string" && secret.length > 0 && containsReportText(report, secret)) {
      throw new Error("preflight report reflects an environment credential");
    }
  }
}

async function readCanonicalRequest(path) {
  if (!isAbsolute(path)) throw new Error("request path must be absolute");
  let handle;
  try {
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const metadata = await handle.stat();
    if (!metadata.isFile()) throw new Error("request path must name a regular file");
    if (metadata.size < 2 || metadata.size > MAX_REQUEST_BYTES) throw new Error("request is outside byte bounds");
    const bytes = await handle.readFile();
    if (bytes.byteLength !== metadata.size || bytes.byteLength < 2 || bytes.byteLength > MAX_REQUEST_BYTES) {
      throw new Error("request changed during bounded read");
    }
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error("request must be valid UTF-8 JSON");
    }
    let request;
    try {
      request = JSON.parse(text);
    } catch {
      throw new Error("request must be valid JSON");
    }
    if (canonicalJson(request) !== text) throw new Error("request must be canonical JSON");
    return request;
  } finally {
    await handle?.close();
  }
}

export async function createPreflightReport(request, {
  environment = process.env,
  runAndConsume = async (value, options) => consumeDirectInstallAttestation(
    await runDirectInstallPreflight(value, options),
  ),
} = {}) {
  const boundedEnvironment = productionEnvironment(environment);
  const payload = await runAndConsume(request, { environment: boundedEnvironment });
  validateConsumedPayload(payload);
  const report = JSON.parse(canonicalJson({
    schema_version: REPORT_SCHEMA,
    bindings: payload.bindings,
    graph_hash: payload.graph_hash,
    definition_etag: payload.definition_etag,
    profile_digest: payload.profile_digest,
    policy_digest: payload.policy_digest,
    test_mode: payload.test_mode,
    install_ready: payload.install_ready,
    unmet_preconditions: payload.unmet_preconditions,
  }));
  rejectSecretReflection(report, environment);
  return report;
}

export async function main(argv = process.argv.slice(2), dependencies = {}) {
  if (argv.length !== 2 || argv[0] !== "--request" || typeof argv[1] !== "string" || !isAbsolute(argv[1])) {
    throw new Error("usage: preflight-report.mjs --request /absolute/path.json");
  }
  const request = await readCanonicalRequest(argv[1]);
  const report = await createPreflightReport(request, dependencies);
  const write = dependencies.write ?? ((value) => process.stdout.write(value));
  write(canonicalJson(report));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
