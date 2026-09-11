#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson, sha256 } from "../canonical.mjs";
import { runProbe as existingPaydemoProbe } from "../../paydemo-qah-probe.mjs";

const INPUT_KEYS = ["schema_version", "branch", "run_id", "attempt_id", "attempt_namespace", "branch_namespace", "test_data_profile", "environment"];
const ENVIRONMENT_KEYS = ["base_url", "commit", "content_hash", "environment_id", "instance_nonce"];
const MODES = Object.freeze({ api: "amount", domain: "idempotency" });
const EVIDENCE_KINDS = Object.freeze({ api: ["api-contract", "automated-api-test"], ui: ["playwright", "screenshot"], domain: ["domain-data", "sandbox-test"] });
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const DEFAULT_MAX_ARTIFACT_BYTES = 256 * 1024;
const MAX_UI_REQUEST_BYTES = 4 * 1024;
const MAX_UI_RECEIPT_BYTES = 1024;

function exactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || canonicalJson(Object.keys(value).sort()) !== canonicalJson([...keys].sort())) throw new Error(`${label} must have exact keys`);
}

function digestBytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function expectedAttemptNamespace(input) {
  return sha256({ run_id: input.run_id, attempt_id: input.attempt_id }).slice("sha256:".length);
}

function expectedBranchNamespace(input) {
  return sha256({ run_id: input.run_id, attempt_id: input.attempt_id, branch: input.branch }).slice("sha256:".length);
}

function validateInput(input) {
  exactKeys(input, INPUT_KEYS, "adapter input");
  if (input.schema_version !== "nuanu.qa-branch-adapter-input.v1" || !["api", "ui", "domain"].includes(input.branch)) throw new Error("adapter branch identity is invalid");
  for (const [label, value] of [["run_id", input.run_id], ["attempt_id", input.attempt_id]]) if (typeof value !== "string" || !ID.test(value)) throw new Error(`${label} is invalid`);
  if (input.attempt_namespace !== expectedAttemptNamespace(input) || input.branch_namespace !== expectedBranchNamespace(input)) throw new Error("adapter attempt and branch namespaces do not match the exact fence");
  if (input.branch === "domain") {
    if (input.test_data_profile !== "payment_sandbox") throw new Error("PayDemo domain checks require the named payment_sandbox profile");
  } else if (input.test_data_profile !== null) throw new Error("test-data profile is valid only for the domain branch");
  exactKeys(input.environment, ENVIRONMENT_KEYS, "adapter environment");
  const base = new URL(input.environment.base_url);
  if (!["127.0.0.1", "localhost", "::1"].includes(base.hostname) || base.origin !== input.environment.base_url) throw new Error("PayDemo adapter requires an exact loopback origin");
  if (!/^[a-f0-9]{40}$/.test(input.environment.commit) || !DIGEST.test(input.environment.content_hash)) throw new Error("adapter build identity is invalid");
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(input.environment.environment_id) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(input.environment.instance_nonce)) throw new Error("adapter environment identity is invalid");
  return input;
}

async function boundedCandidate(path, { kind, name, mediaType, maximumBytes }) {
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size < 1 || metadata.size > maximumBytes) throw new Error(`${kind} artifact size exceeds its bound`);
  const bytes = await readFile(path);
  if (bytes.byteLength !== metadata.size || bytes.byteLength > maximumBytes) throw new Error(`${kind} artifact size changed or exceeds its bound`);
  return { kind, name, media_type: mediaType, size_bytes: bytes.byteLength, sha256: digestBytes(bytes), content_base64: bytes.toString("base64") };
}

function exactCheckoutResponse(response, origin) {
  try {
    const url = new URL(response.url());
    return url.origin === origin && url.pathname === "/api/checkout" && url.search === "" && url.hash === "" && response.request().method() === "POST";
  } catch { return false; }
}

function classifyBoundedUi({ selectedPaymentMethod, requestPaymentMethod, receiptText, responseStatus }) {
  if (!Number.isInteger(responseStatus) || responseStatus < 200 || responseStatus >= 300) return { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0, code: "UI_PROBE_UNAVAILABLE" };
  if (selectedPaymentMethod === "bank" && requestPaymentMethod === "bank" && responseStatus === 201 && receiptText === "Payment recorded by bank transfer.") return { product_result: "PASS", environment_status: "HEALTHY", evidence_status: "VERIFIED", confidence: 1, code: "BANK_TRANSFER_CONFIRMED" };
  if (selectedPaymentMethod === "bank" && (requestPaymentMethod !== "bank" || /\bcard\b/i.test(receiptText))) return { product_result: "FAIL", environment_status: "HEALTHY", evidence_status: "VERIFIED", confidence: 1, code: "BANK_SHOWN_AS_CARD" };
  return { product_result: "FAIL", environment_status: "HEALTHY", evidence_status: "VERIFIED", confidence: 1, code: "BANK_UI_CONTRACT_VIOLATION" };
}

function allowedWebSocketOrigin(httpOrigin) {
  const value = new URL(httpOrigin);
  value.protocol = value.protocol === "https:" ? "wss:" : "ws:";
  return value.origin;
}

async function boundedCheckoutRequest(response, input, maximumBytes = MAX_UI_REQUEST_BYTES) {
  const request = response.request();
  const sizes = await request.sizes();
  if (!sizes || typeof sizes !== "object" || Array.isArray(sizes) || !Number.isSafeInteger(sizes.requestBodySize) || sizes.requestBodySize < 1 || sizes.requestBodySize > maximumBytes) throw new Error("UI request body size metadata is missing or outside its bound");
  const bytes = request.postDataBuffer();
  if (!Buffer.isBuffer(bytes) || bytes.byteLength !== sizes.requestBodySize || bytes.byteLength > maximumBytes) throw new Error("UI request body bytes do not match bounded metadata");
  let source;
  let payload;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    payload = JSON.parse(source);
  } catch { throw new Error("UI request body is not bounded valid UTF-8 JSON"); }
  exactKeys(payload, ["runId", "planId", "amountCents", "paymentMethod"], "UI request body");
  if (source !== JSON.stringify(payload) || payload.runId !== input.branch_namespace || payload.planId !== "starter" || payload.amountCents !== 1000 || !["bank", "card"].includes(payload.paymentMethod)) throw new Error("UI request body has an invalid closed shape");
  return { paymentMethod: payload.paymentMethod };
}

async function boundedReceiptText(session, page, input, maximumBytes = MAX_UI_RECEIPT_BYTES) {
  const frameTree = await session.send("Page.getFrameTree");
  const frame = frameTree?.frameTree?.frame;
  const pageUrl = page.url();
  let frameOrigin;
  try { frameOrigin = new URL(frame?.url).origin; } catch { throw new Error("UI receipt CDP frame URL is invalid"); }
  if (typeof frame?.id !== "string" || frame.id.length === 0 || frame.parentId !== undefined || frame.url !== pageUrl || frameOrigin !== input.environment.base_url) throw new Error("UI receipt CDP frame does not match the exact current origin");
  const world = await session.send("Page.createIsolatedWorld", { frameId: frame.id, worldName: `qah-receipt-${input.branch_namespace}`, grantUniveralAccess: false });
  exactKeys(world, ["executionContextId"], "UI receipt isolated world");
  if (!Number.isSafeInteger(world.executionContextId) || world.executionContextId < 1) throw new Error("UI receipt isolated world context is invalid");
  const expression = `(() => {
    const matches = document.querySelectorAll("#payment-status[role=\\"status\\"]");
    if (matches.length !== 1) return { oversized: false };
    const value = matches[0].textContent;
    if (typeof value !== "string") return { oversized: false };
    if (new TextEncoder().encode(value).byteLength > ${maximumBytes}) return { oversized: true };
    return { oversized: false, value };
  })()`;
  const evaluated = await session.send("Runtime.evaluate", { contextId: world.executionContextId, expression, returnByValue: true, awaitPromise: false, userGesture: false });
  exactKeys(evaluated, ["result"], "UI receipt CDP evaluation");
  exactKeys(evaluated.result, ["type", "value"], "UI receipt CDP result");
  if (evaluated.result.type !== "object") throw new Error("UI receipt CDP result type is invalid");
  const summary = evaluated.result.value;
  if (summary?.oversized === true) {
    exactKeys(summary, ["oversized"], "UI receipt summary");
    throw new Error("UI receipt DOM value exceeds its UTF-8 bound");
  }
  exactKeys(summary, ["oversized", "value"], "UI receipt summary");
  if (summary.oversized !== false || typeof summary.value !== "string" || Buffer.byteLength(summary.value, "utf8") > maximumBytes) throw new Error("UI receipt DOM summary has an invalid type or size");
  return summary.value.trim();
}

async function loadWorkerChromium(modulePath) {
  if (typeof modulePath !== "string" || !isAbsolute(modulePath)) throw new Error("NUANU_QA_PLAYWRIGHT_MODULE must be an absolute pinned module path");
  const metadata = await lstat(modulePath);
  if (!metadata.isFile() || metadata.isSymbolicLink() || await realpath(modulePath) !== resolve(modulePath)) throw new Error("NUANU_QA_PLAYWRIGHT_MODULE must be an exact real file");
  const loaded = await import(pathToFileURL(modulePath).href);
  const chromium = loaded.chromium ?? loaded.default?.chromium;
  if (!chromium?.connectOverCDP) throw new Error("pinned Playwright module has no chromium.connectOverCDP");
  return chromium;
}

function workerCdpUrl(value) {
  let parsed;
  try { parsed = new URL(value); } catch { parsed = null; }
  if (!parsed || parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1" || !parsed.port || parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password || parsed.origin !== value) throw new Error("NUANU_QA_BROWSER_CDP_URL must be an exact loopback origin");
  return value;
}

async function disconnectWorkerBrowserClient(browser) {
  if (typeof browser?.disconnect === "function") return browser.disconnect();
  if (browser?._connection && typeof browser._connection.close === "function") {
    browser._connection.close();
    return;
  }
  throw new Error("worker CDP client transport cannot be safely detached");
}

export async function runPaydemoUiProbe(rawInput, {
  chromium, artifactRoot = join(tmpdir(), "nuanu-qah-ui"), maxArtifactBytes = DEFAULT_MAX_ARTIFACT_BYTES,
  browserMode = "worker", environment = process.env,
} = {}) {
  const input = validateInput(rawInput);
  if (input.branch !== "ui") throw new Error("UI probe requires the UI branch");
  if (!["worker", "standalone"].includes(browserMode)) throw new Error("UI browser mode must be explicitly worker or standalone");
  if (browserMode === "worker") {
    workerCdpUrl(environment.NUANU_QA_BROWSER_CDP_URL);
    if (!chromium) chromium = await loadWorkerChromium(environment.NUANU_QA_PLAYWRIGHT_MODULE);
    if (!chromium?.connectOverCDP) throw new Error("worker UI requires chromium.connectOverCDP");
  } else {
    if (!chromium) ({ chromium } = await import("@playwright/test"));
    if (!chromium?.launch) throw new Error("standalone UI requires chromium.launch");
  }
  if (!Number.isInteger(maxArtifactBytes) || maxArtifactBytes < 1 || maxArtifactBytes > 1024 * 1024) throw new Error("UI artifact bound is invalid");
  await mkdir(artifactRoot, { recursive: true, mode: 0o700 });
  const temporary = await mkdtemp(join(artifactRoot, `${input.branch_namespace}-`));
  const screenshotName = "ui-main.png";
  const traceName = "ui-trace.zip";
  const screenshotPath = join(temporary, screenshotName);
  const tracePath = join(temporary, traceName);
  let browser;
  let context;
  let traceStarted = false;
  let traceStopped = false;
  let cdpSession;
  let originViolation = false;
  let result;
  let primaryError;
  const cleanupErrors = [];
  try {
    browser = browserMode === "worker"
      ? await chromium.connectOverCDP(workerCdpUrl(environment.NUANU_QA_BROWSER_CDP_URL))
      : await chromium.launch({ headless: true, timeout: 10_000 });
    context = await browser.newContext({ serviceWorkers: "block" });
    context.setDefaultTimeout(10_000);
    await context.route("**/*", async (route) => {
      let allowed = false;
      try { allowed = new URL(route.request().url()).origin === input.environment.base_url; } catch {}
      if (!allowed) { originViolation = true; await route.abort(); return; }
      await route.continue();
    });
    const websocketOrigin = allowedWebSocketOrigin(input.environment.base_url);
    await context.routeWebSocket(/.*/, async (websocketRoute) => {
      let allowed = false;
      try { allowed = new URL(websocketRoute.url()).origin === websocketOrigin; } catch {}
      if (!allowed) {
        originViolation = true;
        await websocketRoute.close({ code: 1008, reason: "origin denied" });
        return;
      }
      websocketRoute.connectToServer();
    });
    await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
    traceStarted = true;
    const page = await context.newPage();
    const target = `${input.environment.base_url}/?runId=${encodeURIComponent(input.branch_namespace)}`;
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 10_000 });
    if (originViolation || new URL(page.url()).origin !== input.environment.base_url) throw new Error("UI navigation or request escaped the exact prepared origin");
    const bank = page.getByLabel("Bank transfer");
    await bank.check();
    const selectedPaymentMethod = await bank.isChecked() ? "bank" : "unknown";
    const responsePromise = page.waitForResponse((response) => exactCheckoutResponse(response, input.environment.base_url));
    await page.getByRole("button", { name: "Pay $10.00" }).click();
    const response = await responsePromise;
    const requestBody = await boundedCheckoutRequest(response, input);
    const receipt = page.getByRole("status").filter({ hasText: /Payment (recorded|could not)/ });
    await receipt.waitFor({ state: "visible" });
    cdpSession = await context.newCDPSession(page);
    const receiptText = await boundedReceiptText(cdpSession, page, input);
    if (originViolation || new URL(page.url()).origin !== input.environment.base_url) throw new Error("UI interaction escaped the exact prepared origin");
    const observation = { selectedPaymentMethod, requestPaymentMethod: requestBody?.paymentMethod ?? null, receiptText, responseStatus: response.status() };
    const classification = classifyBoundedUi(observation);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const screenshot = await boundedCandidate(screenshotPath, { kind: "screenshot", name: screenshotName, mediaType: "image/png", maximumBytes: maxArtifactBytes });
    await context.tracing.stop({ path: tracePath });
    traceStopped = true;
    const trace = await boundedCandidate(tracePath, { kind: "trace", name: traceName, mediaType: "application/zip", maximumBytes: maxArtifactBytes });
    result = { classification, observation_sha256: sha256({ selected_payment_method: selectedPaymentMethod, request_payment_method: observation.requestPaymentMethod, response_status: observation.responseStatus, receipt_sha256: sha256(receiptText) }), candidates: [screenshot, trace] };
  } catch (error) {
    primaryError = error;
  } finally {
    if (cdpSession) try { await cdpSession.detach(); } catch (error) { cleanupErrors.push(error); }
    if (traceStarted && !traceStopped && context) {
      try { await context.tracing.stop({ path: tracePath }); } catch (error) { cleanupErrors.push(error); }
    }
    if (context) try { await context.close(); } catch (error) { cleanupErrors.push(error); }
    if (browser) {
      try {
        if (browserMode === "worker") await disconnectWorkerBrowserClient(browser);
        else await browser.close();
      } catch (error) { cleanupErrors.push(error); }
    }
    try { await rm(temporary, { recursive: true, force: true }); } catch (error) { cleanupErrors.push(error); }
  }
  if (cleanupErrors.length > 0) throw new AggregateError(primaryError ? [primaryError, ...cleanupErrors] : cleanupErrors, "UI probe cleanup failed");
  if (primaryError) throw primaryError;
  if (originViolation) throw new Error("UI interaction attempted a cross-origin transport");
  return result;
}

async function runDocumentProbe(input, dependencies) {
  const evidenceRoot = dependencies.artifactRoot ?? join(tmpdir(), "nuanu-qah-paydemo");
  await mkdir(evidenceRoot, { recursive: true, mode: 0o700 });
  const evidenceDirectory = await mkdtemp(join(evidenceRoot, `${input.branch_namespace}-`));
  try {
    const result = await (dependencies.runProbe ?? existingPaydemoProbe)({
      mode: MODES[input.branch], baseUrl: input.environment.base_url,
      expectedBuild: { app: "PayDemo", variant: "fixed-v2", commit: input.environment.commit, contentHash: input.environment.content_hash, environmentId: input.environment.environment_id, instanceNonce: input.environment.instance_nonce },
      runId: input.branch_namespace, evidenceDirectory, environment: dependencies.environment ?? process.env,
    });
    if (typeof result.evidence?.markdown_path !== "string" || !result.evidence.markdown_path.startsWith(`${evidenceDirectory}/`)) throw new Error("PayDemo probe evidence path is outside its isolated directory");
    const candidate = await boundedCandidate(result.evidence.markdown_path, { kind: "document", name: `${input.branch}-evidence.md`, mediaType: "text/markdown", maximumBytes: dependencies.maxArtifactBytes ?? DEFAULT_MAX_ARTIFACT_BYTES });
    return { result, candidates: [candidate] };
  } finally {
    await rm(evidenceDirectory, { recursive: true, force: true });
  }
}

export async function runPaydemoAdapter(rawInput, dependencies = {}) {
  const input = validateInput(rawInput);
  if (input.branch === "ui") {
    const ui = await (dependencies.runUiProbe ?? runPaydemoUiProbe)(input, dependencies);
    return {
      schema_version: "nuanu.qa-branch-adapter-result.v1", branch: "ui",
      product_result: ui.classification.product_result, environment_status: ui.classification.environment_status,
      evidence_status: ui.classification.evidence_status, confidence: ui.classification.confidence, code: ui.classification.code,
      observations: [{ code: "UI_ASSERTION", status: ui.classification.product_result, value_sha256: ui.observation_sha256 }],
      evidence_kinds: EVIDENCE_KINDS.ui, candidates: ui.candidates,
    };
  }
  const { result, candidates } = dependencies.documentProbe
    ? await dependencies.documentProbe(input)
    : await runDocumentProbe(input, dependencies);
  return {
    schema_version: "nuanu.qa-branch-adapter-result.v1", branch: input.branch,
    product_result: result.axes.product_result, environment_status: result.axes.environment_status,
    evidence_status: result.axes.evidence_status, confidence: result.axes.confidence, code: result.code,
    observations: [{ code: "PROBE_RESULT", status: result.axes.product_result, value_sha256: result.occurrence_key }],
    evidence_kinds: EVIDENCE_KINDS[input.branch], candidates,
  };
}

async function readBoundedStdin(stream, maximumBytes = 65_536) {
  const chunks = []; let total = 0;
  for await (const chunk of stream) { total += chunk.byteLength; if (total > maximumBytes) throw new Error("adapter stdin exceeds bound"); chunks.push(Buffer.from(chunk)); }
  return Buffer.concat(chunks, total).toString("utf8");
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1 || !["api", "ui", "domain"].includes(argv[0])) throw new Error("exactly one PayDemo adapter branch is required");
  const source = await readBoundedStdin(process.stdin);
  const input = JSON.parse(source);
  if (canonicalJson(input) !== source || input.branch !== argv[0]) throw new Error("adapter argv and exact canonical stdin must match");
  process.stdout.write(canonicalJson(await runPaydemoAdapter(input)));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2; });
