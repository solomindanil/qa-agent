import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { createPreflightReport, main } from "../../scripts/qah/preflight-report.mjs";

const ref = (digit) => `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`;
const platformStartNode = {
  id: ref("a"),
  key: "project_start",
  type: "start",
  name: "Enter Ready for QA",
  trigger: { mode: "from_project" },
  config: {
    project_process_start: { binding_id: ref("1"), project_id: ref("2"), state_id: ref("3") },
    output: {
      data: {
        invoked_at: { description: "When this Process run was invoked", type: "string" },
        trigger: { description: "How this Process run started", type: "string" },
      },
      artifacts: {
        flow_item: { description: "Exact Flow item snapshot that invoked this Process", kind: "flow_item" },
      },
    },
  },
};
const platformStartEdge = { id: ref("b"), source: ref("a"), target: ref("c") };
const payload = Object.freeze({
  bindings: {
    project_process_binding_id: ref("1"),
    project_id: ref("2"),
    ready_for_qa_state_id: ref("3"),
    in_progress_state_id: ref("4"),
    ready_for_production_state_id: ref("5"),
    qa_agent_employee_id: ref("6"),
    qa_agent_version_id: ref("7"),
    decision_agent_employee_id: ref("8"),
    decision_agent_version_id: ref("9"),
    decision_agent_metadata: {
      requested_model: "openai/gpt-5.6-sol-pro",
      required_capabilities: ["git", "nuanu_mcp", "tool_execution"],
    },
    platform_start_node: platformStartNode,
    platform_start_edge: platformStartEdge,
    platform_start_fingerprint: sha256(platformStartNode),
    platform_start_edge_fingerprint: sha256(platformStartEdge),
    profile_artifact: { artifact_id: ref("d"), version_id: ref("e"), kind: "document", role: "implementation" },
  },
  graph_hash: `sha256:${"a".repeat(64)}`,
  definition_etag: `sha256:${"b".repeat(64)}`,
  profile_digest: `sha256:${"c".repeat(64)}`,
  policy_digest: `sha256:${"d".repeat(64)}`,
  test_mode: false,
  install_ready: false,
  unmet_preconditions: ["public worker observability unavailable"],
});

test("preflight report consumes in-process authority and emits only sanitized canonical fields", async () => {
  const report = await createPreflightReport({ exact: "request" }, {
    environment: { NUANU_API_KEY: "must-not-leak", NUANU_QA_AGENT_KEY: "must-not-leak", NUANU_DECISION_AGENT_KEY: "must-not-leak" },
    runAndConsume: async (request) => { assert.deepEqual(request, { exact: "request" }); return structuredClone(payload); },
  });
  assert.deepEqual(report, { schema_version: "nuanu.qah-preflight-report.v1", ...payload });
  assert.doesNotMatch(canonicalJson(report), /must-not-leak|NUANU_.*KEY/);
});

test("CLI accepts one bounded absolute canonical request and writes canonical JSON only", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-preflight-report-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, "request.json");
  await writeFile(path, canonicalJson({ exact: "request" }));
  let stdout = "";
  await main(["--request", path], {
    environment: {},
    runAndConsume: async () => structuredClone(payload),
    write: (value) => { stdout += value; },
  });
  assert.equal(stdout, canonicalJson({ schema_version: "nuanu.qah-preflight-report.v1", ...payload }));
  await writeFile(path, `${canonicalJson({ exact: "request" })}\n`);
  await assert.rejects(main(["--request", path], { runAndConsume: async () => payload, write() {} }), /canonical/);
  assert.equal((await readFile(path)).byteLength > 0, true);
});

test("CLI rejects every argv path and byte-custody violation", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-preflight-negative-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, "request.json");
  const link = join(root, "request-link.json");
  const tiny = join(root, "tiny.json");
  const huge = join(root, "huge.json");
  await writeFile(target, canonicalJson({ exact: "request" }));
  await symlink(target, link);
  await writeFile(tiny, "{");
  await writeFile(huge, Buffer.alloc(262_145, 0x20));
  const dependencies = {
    environment: {},
    runAndConsume: async () => structuredClone(payload),
    write() {},
  };
  for (const [name, argv] of [
    ["missing argv", []],
    ["missing path", ["--request"]],
    ["unknown flag", ["--unknown", target]],
    ["extra argv", ["--request", target, "extra"]],
    ["relative path", ["--request", "request.json"]],
    ["directory path", ["--request", root]],
    ["symlink path", ["--request", link]],
    ["too few bytes", ["--request", tiny]],
    ["too many bytes", ["--request", huge]],
  ]) await t.test(name, async () => {
    await assert.rejects(main(argv, dependencies));
  });
});

test("report rejects closed-shape coercion hostile values and secret reflection", async (t) => {
  const missing = structuredClone(payload); delete missing.graph_hash;
  const cyclic = structuredClone(payload); cyclic.bindings.self = cyclic.bindings;
  const proxy = new Proxy({}, { ownKeys() { throw new Error("hostile"); } });
  const cases = [
    ["extra consumed field", { result: { ...payload, extra: true }, environment: {} }],
    ["operator token in consumed bindings", {
      result: { ...payload, bindings: { ...payload.bindings, operator_token: "must-not-cross-boundary" } },
      environment: {},
    }],
    ["operator token in decision metadata", {
      result: {
        ...payload,
        bindings: {
          ...payload.bindings,
          decision_agent_metadata: { ...payload.bindings.decision_agent_metadata, operator_token: "must-not-cross-boundary" },
        },
      },
      environment: {},
    }],
    ["operator token in profile artifact", {
      result: {
        ...payload,
        bindings: {
          ...payload.bindings,
          profile_artifact: { ...payload.bindings.profile_artifact, operator_token: "must-not-cross-boundary" },
        },
      },
      environment: {},
    }],
    ["operator token nested in server-owned binding data", {
      result: {
        ...payload,
        bindings: {
          ...payload.bindings,
          platform_start_node: { ...payload.bindings.platform_start_node, operator_token: "must-not-cross-boundary" },
        },
      },
      environment: {},
    }],
    ["synthetic capability in decision metadata", {
      result: {
        ...payload,
        bindings: {
          ...payload.bindings,
          decision_agent_metadata: {
            ...payload.bindings.decision_agent_metadata,
            required_capabilities: [...payload.bindings.decision_agent_metadata.required_capabilities, "synthetic-secret"],
          },
        },
      },
      environment: {},
    }],
    ["arbitrary requested model in decision metadata", {
      result: {
        ...payload,
        bindings: {
          ...payload.bindings,
          decision_agent_metadata: {
            ...payload.bindings.decision_agent_metadata,
            requested_model: "synthetic-secret-like-model",
          },
        },
      },
      environment: {},
    }],
    ["reordered decision capabilities", {
      result: {
        ...payload,
        bindings: {
          ...payload.bindings,
          decision_agent_metadata: {
            ...payload.bindings.decision_agent_metadata,
            required_capabilities: ["tool_execution", "nuanu_mcp", "git"],
          },
        },
      },
      environment: {},
    }],
    ["access token in platform Start", {
      result: {
        ...payload,
        bindings: {
          ...payload.bindings,
          platform_start_node: { ...payload.bindings.platform_start_node, access_token: "synthetic-secret" },
        },
      },
      environment: {},
    }],
    ["secret in platform Start edge", {
      result: {
        ...payload,
        bindings: {
          ...payload.bindings,
          platform_start_edge: { ...payload.bindings.platform_start_edge, secret: "synthetic-secret" },
        },
      },
      environment: {},
    }],
    ["stale platform Start fingerprint", {
      result: { ...payload, bindings: { ...payload.bindings, platform_start_fingerprint: `sha256:${"0".repeat(64)}` } },
      environment: {},
    }],
    ["stale platform Start edge fingerprint", {
      result: { ...payload, bindings: { ...payload.bindings, platform_start_edge_fingerprint: `sha256:${"0".repeat(64)}` } },
      environment: {},
    }],
    ["missing consumed field", { result: missing, environment: {} }],
    ["cycle", { result: cyclic, environment: {} }],
    ["Proxy", { result: proxy, environment: {} }],
    ["install_ready string coercion", { result: { ...payload, install_ready: "false" }, environment: {} }],
    ["test mode in production", { result: { ...payload, test_mode: true }, environment: {} }],
    ["secret reflected in output", {
      result: { ...payload, unmet_preconditions: ["must-not-leak"] },
      environment: { NUANU_API_KEY: "must-not-leak" },
    }],
    ["newline secret reflected in output", {
      result: { ...payload, unmet_preconditions: ["line\nsecret"] },
      environment: { NUANU_API_KEY: "line\nsecret" },
    }],
    ["quote secret reflected in output", {
      result: { ...payload, unmet_preconditions: ["quote\"secret"] },
      environment: { NUANU_QA_AGENT_KEY: "quote\"secret" },
    }],
    ["backslash secret reflected in output", {
      result: { ...payload, unmet_preconditions: ["slash\\secret"] },
      environment: { NUANU_DECISION_AGENT_KEY: "slash\\secret" },
    }],
  ];
  for (const [name, { result, environment }] of cases) await t.test(name, async () => {
    await assert.rejects(createPreflightReport({ exact: "request" }, {
      environment,
      runAndConsume: async () => result,
    }));
  });
});

test("operator runbook separates admitted QA uncertainty from finalization-integrity failure", async () => {
  const runbook = await readFile(new URL("../../docs/operations/universal-qa-proof-gate-runbook.md", import.meta.url), "utf8");
  assert.match(
    runbook,
    /Ordinary authenticated QA uncertainty[^\n]*\|[^\n]*`verdict: blocked`, `target_state: ready_for_qa`[^\n]*\|[^\n]*`unable_to_verify`/,
  );
  assert.match(
    runbook,
    /Finalization integrity failure[^\n]*(?:cleanup[^\n]*publication[^\n]*identity[^\n]*classification admission|classification admission[^\n]*identity[^\n]*publication[^\n]*cleanup)[^\n]*\|[^\n]*No `ProcessItem` or claim[^\n]*\|[^\n]*Do not visit Proof Gate[^\n]*\|[^\n]*unbound ArtifactVersion/,
  );
  assert.doesNotMatch(
    runbook,
    /Evidence, transport, cleanup, publication, identity, or classification is uncertain[^\n]*`unable_to_verify`/,
  );
});
