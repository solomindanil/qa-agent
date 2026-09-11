import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { sha256 } from "../../scripts/qah/canonical.mjs";
import * as paydemoAdapter from "../../scripts/qah/adapters/paydemo.mjs";
import * as renderer from "../../scripts/qah/render-process.mjs";
import * as runtime from "../../scripts/qah/task-runtime.mjs";

const installAdapter = await import("../../scripts/qah/nuanu-install-adapter.mjs").catch(() => ({}));
const workerContract = await import("./helpers/worker-contract.mjs").catch(() => ({}));
const liveStart = JSON.parse(await readFile(new URL("fixtures/live-column-start.json", import.meta.url), "utf8"));
const ids = Object.freeze({
  workspace: "22222222-2222-4222-8222-222222222222",
  project: liveStart.node.config.project_process_start.project_id,
  binding: liveStart.node.config.project_process_start.binding_id,
  template: "33333333-3333-4333-8333-333333333333",
  ready: liveStart.node.config.project_process_start.state_id,
  progress: "44444444-4444-4444-8444-444444444444",
  production: "55555555-5555-4555-8555-555555555555",
  qa: "66666666-6666-4666-8666-666666666666",
  qaVersion: "77777777-7777-4777-8777-777777777777",
  decision: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  decisionVersion: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  artifact: "88888888-8888-4888-8888-888888888888",
  artifactVersion: "99999999-9999-4999-8999-999999999999",
});
test("output validation never creates a leaf through a symlinked qah parent", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-root-symlink-"));
  const outside = await mkdtemp(join(tmpdir(), "qah-outside-symlink-"));
  t.after(() => Promise.all([root, outside].map((path) => rm(path, { recursive: true, force: true }))));
  await symlink(outside, join(root, "qah"));
  await assert.rejects(runtime.runTaskCommand("normalize-comments", { raw_comments: [], identity: {
    workspace_id: ids.workspace, project_id: ids.project, issue_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  } }, { outputDir: join(root, "qah", "normalize-comments"), taskRoot: root }), /symlink|contain|real/i);
  assert.deepEqual(await readdir(outside), []);
});

test("legacy caller-authored install adapters cannot mint an install render", async () => {
  assert.equal(installAdapter.createNuanuInstallAdapter, undefined);
  await assert.rejects(renderer.renderForInstall({}, {}, { executeRead() {} }), /install request|direct|environment/i);
});

function minimalUiHarness() {
  const events = [];
  let routeHandler;
  let websocketHandler;
  let workerReachable = true;
  const branchNamespace = sha256({ run_id: "run", attempt_id: "attempt", branch: "ui" }).slice(7);
  const requestBytes = Buffer.from(JSON.stringify({ runId: branchNamespace, planId: "starter", amountCents: 1000, paymentMethod: "bank" }));
  const response = { url: () => "http://127.0.0.1:4173/api/checkout", status: () => 201, request: () => ({ method: () => "POST", sizes: async () => ({ requestBodySize: requestBytes.byteLength }), postDataBuffer: () => requestBytes }) };
  const page = {
    goto: async () => { await routeHandler({ request: () => ({ url: () => "http://127.0.0.1:4173/app.js" }), continue: async () => events.push("route-continue"), abort: async () => events.push("route-abort") }); },
    url: () => "http://127.0.0.1:4173/", getByLabel: () => ({ check: async () => {}, isChecked: async () => true }),
    waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; },
    getByRole: (role) => role === "button" ? { click: async () => {} } : { filter: () => ({ waitFor: async () => {} }) },
    screenshot: async ({ path }) => writeFile(path, "screenshot"),
  };
  const context = {
    tracing: { start: async () => {}, stop: async ({ path }) => writeFile(path, "trace") }, setDefaultTimeout: () => {},
    route: async (_pattern, handler) => { routeHandler = handler; }, routeWebSocket: async (_pattern, handler) => { websocketHandler = handler; },
    newPage: async () => page,
    newCDPSession: async () => ({ send: async (method) => method === "Page.getFrameTree" ? { frameTree: { frame: { id: "main", url: page.url() } } } : method === "Page.createIsolatedWorld" ? { executionContextId: 1 } : { result: { type: "object", value: { oversized: false, value: "Payment recorded by bank transfer." } } }, detach: async () => {} }),
    close: async () => events.push("context-close"),
  };
  const browser = { newContext: async (options) => { events.push({ contextOptions: options }); return context; }, disconnect: async () => events.push("client-disconnect"), close: async () => { workerReachable = false; events.push("browser-close"); } };
  const chromium = {
    connectOverCDP: async (url) => { events.push({ connectOverCDP: url }); return browser; },
    launch: async () => { events.push("launch"); throw new Error("worker mode must not launch"); },
  };
  return { chromium, events, websocket: () => websocketHandler, workerReachable: () => workerReachable };
}

test("worker UI uses pinned CDP, owns one isolated context, disconnects without killing Chrome, and receives only exact UI env", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-worker-cdp-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const harness = minimalUiHarness();
  const input = {
    schema_version: "nuanu.qa-branch-adapter-input.v1", branch: "ui", run_id: "run", attempt_id: "attempt",
    attempt_namespace: sha256({ run_id: "run", attempt_id: "attempt" }).slice(7), branch_namespace: sha256({ run_id: "run", attempt_id: "attempt", branch: "ui" }).slice(7), test_data_profile: null,
    environment: { base_url: "http://127.0.0.1:4173", commit: "a".repeat(40), content_hash: "sha256:" + "b".repeat(64), environment_id: "env", instance_nonce: "11111111-1111-4111-8111-111111111111" },
  };
  const environment = { NUANU_QA_BROWSER_CDP_URL: "http://127.0.0.1:9222", NUANU_QA_PLAYWRIGHT_MODULE: "/opt/worker/playwright/index.mjs" };
  await paydemoAdapter.runPaydemoUiProbe(input, { chromium: harness.chromium, artifactRoot: root, maxArtifactBytes: 1024, browserMode: "worker", environment });
  assert.deepEqual(harness.events.filter((entry) => typeof entry === "object").slice(0, 2), [
    { connectOverCDP: environment.NUANU_QA_BROWSER_CDP_URL }, { contextOptions: { serviceWorkers: "block" } },
  ]);
  assert.equal(harness.events.includes("launch"), false);
  assert.deepEqual(harness.events.slice(-2), ["context-close", "client-disconnect"]);
  assert.equal(harness.workerReachable(), true);
  assert.equal(typeof harness.websocket(), "function");
  assert.deepEqual(runtime.runtimeEnvironmentForBranch?.("ui", { PATH: "/bin", HOME: "/secret", TOKEN: "secret", ...environment }), { PATH: "/bin", ...environment });
  assert.deepEqual(runtime.runtimeEnvironmentForBranch?.("api", { PATH: "/bin", ...environment }), { PATH: "/bin" });
});

test("worker 0.3.14 completion validator is discovered portably and pinned by bytes", async () => {
  assert.equal(typeof workerContract.loadWorkerCompletionValidator, "function");
  const loaded = await workerContract.loadWorkerCompletionValidator();
  assert.equal(loaded.version, "0.3.14");
  assert.equal(loaded.sha256, "sha256:9105a1b134fdd74b7aa5454aa4f622522939d683c413e83925ddbe3cadab4a41");
  assert.equal(typeof loaded.buildCanonicalCompletion, "function");
});
