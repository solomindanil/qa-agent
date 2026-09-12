// Diagnostic, not an accepted resume implementation or a passing recovery gate.
// Only an owned loopback API is exercised. No external registration or product.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const self = fileURLToPath(import.meta.url);
const configuredRoot = process.env.QA_CONTINUATION_CONSOLE_ROOT;
assert.ok(configuredRoot && path.isAbsolute(configuredRoot), "QA_CONTINUATION_CONSOLE_ROOT must be explicit and absolute");
const sourceRoot = await realpath(configuredRoot);
assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim(),
  "6e84afbeef9dc660fd7b5b4c7096c17e7cfd72f0", "This diagnostic is attributed to the inactive6e84afb candidate");
assert.equal(execFileSync("git", ["diff", "HEAD", "--name-only", "--", "src", "server"], { cwd: sourceRoot, encoding: "utf8" }).trim(), "",
  "Do not diagnose modified runtime bytes as the frozen candidate");
const load = relative => import(pathToFileURL(path.join(sourceRoot, relative)).href);
const { digestCanonical } = await load("src/lib/canonical-digest.ts");
const { writeNewCampaignPlan } = await load("src/node/qa-campaign-files.ts");
const { runQaCampaign } = await load("src/node/qa-campaign-runner.ts");
const { PlaywrightCampaignAdapter } = await load("src/node/playwright-campaign-adapter.ts");
const { readLatestCampaignEvidence } = await load("server/campaign-receipts.mjs");

if (process.argv[2] === "worker") {
  const input = JSON.parse(await readFile(process.argv[4], "utf8"));
  let result;
  if (process.argv[3] === "read") result = await readLatestCampaignEvidence({
    workspaceDir: input.workspacePath, workspaceRoots: [input.workspacePath],
    productSlug: input.expectedProductSlug, graph: input.graph, catalog: input.catalog,
    allowedBaseUrls: input.allowedBaseUrls,
  });
  else result = await runQaCampaign(input, new PlaywrightCampaignAdapter({
    baseUrl: input.plan.baseUrl, environment: {}, timeoutMs: 60_000,
  }));
  process.stdout.write(JSON.stringify(result) + "\n");
} else {
  assert.notEqual(process.platform, "win32", "This diagnostic requires owned POSIX process groups");
  const audit = await mkdtemp(path.join(await realpath(tmpdir()), "qa-campaign-interruption-"));
  const workspace = path.join(audit, "workspace");
  await mkdir(path.join(workspace, "tests"), { recursive: true });
  const arrivals = [];
  let hold = true;
  let arrived;
  const secondArrived = new Promise(resolve => { arrived = resolve; });
  const server = createServer((request, response) => {
    arrivals.push({ method: request.method, path: request.url, held: hold && request.url === "/second" });
    if (request.method !== "GET" || !["/first", "/second"].includes(request.url)) {
      response.writeHead(405).end(); return;
    }
    if (hold && request.url === "/second") { arrived(); return; }
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ ready: true }));
  });
  const active = new Set();
  const childEnv = {};
  for (const name of ["PATH", "LANG", "LC_ALL"]) if (process.env[name]) childEnv[name] = process.env[name];
  Object.assign(childEnv, { QA_CONTINUATION_CONSOLE_ROOT: sourceRoot, TMPDIR: audit, TSX_DISABLE_CACHE: "1", NODE_DISABLE_COMPILE_CACHE: "1" });
  function killGroup(pid) {
    try { process.kill(-pid, "SIGKILL"); }
    catch (error) { if (error.code !== "ESRCH") throw error; }
  }
  function launch(mode, inputPath) {
    const child = spawn(process.execPath, ["--import", "tsx", self, "worker", mode, inputPath], {
      cwd: sourceRoot, env: childEnv, detached: true, stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "", stderr = "";
    child.stdout.on("data", bytes => { stdout += bytes; });
    child.stderr.on("data", bytes => { stderr += bytes; });
    const entry = { child };
    const done = new Promise((resolve, reject) => {
      const timer = setTimeout(() => killGroup(child.pid), 80_000);
      child.once("error", error => { clearTimeout(timer); active.delete(entry); reject(error); });
      child.once("close", (code, signal) => {
        clearTimeout(timer); active.delete(entry);
        resolve({ pid: child.pid, code, signal, stdout, stderr });
      });
    });
    entry.done = done; active.add(entry);
    return { child, done };
  }
  async function complete(mode, inputPath) {
    const outcome = await launch(mode, inputPath).done;
    assert.equal(outcome.code, 0, outcome.stderr);
    assert.equal(outcome.signal, null);
    return { ...outcome, value: JSON.parse(outcome.stdout) };
  }
  async function files(directory) {
    const found = [];
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, item.name);
      if (item.isDirectory()) found.push(...await files(full));
      else if (item.isFile()) found.push({ path: path.relative(workspace, full),
        sha256: createHash("sha256").update(await readFile(full)).digest("hex") });
      else throw new Error("Unexpected nonregular fixture artifact");
    }
    return found;
  }
  try {
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}/`;
    const graphBody = { schemaVersion: "product-graph.v1", graphId: "interruption",
      profileDigest: `sha256:${"7".repeat(64)}`, nodes: [{ id: "inventory", coverageTarget: true }] };
    const graph = { ...graphBody, semanticDigest: digestCanonical(graphBody) };
    const checks = ["first", "second"].map(id => ({
      checkId: id, title: `${id} read`, targetIds: ["inventory"], disposition: "executable",
      sideEffectClass: "read_only", surface: "api", preconditions: ["Owned fixture API"],
      reproductionSteps: [`GET /${id}`], expectedBehavior: "The owned API returns ready=true.",
      severity: "medium", severityJustification: "Fixture availability", kind: "api", method: "GET", path: `/${id}`,
      assertions: [{ kind: "status", value: 200 }, { kind: "json_path", path: "$.ready", value: true }],
    }));
    const catalogBody = { schemaVersion: "test-catalog.v1", catalogId: "interruption-catalog",
      profileDigest: graph.profileDigest, graphDigest: graph.semanticDigest, entries: checks.map(check => ({
        entryId: `entry-${check.checkId}`, checkId: check.checkId, targetIds: check.targetIds,
        executionKind: "automated", runnerId: "playwright", candidatePath: `tests/api/generated/${check.checkId}.spec.ts`,
        requiredSecretRefs: [], sideEffectClasses: ["read_only"], expectedEvidenceTypes: ["http_response"],
        oracle: { state: "resolved", description: check.expectedBehavior }, provenance: [{ source: {
          sourceId: "urn:qa:source:222222222222222222222222", authority: "approved_decision",
          contentDigest: digestCanonical({ ownedFixture: "GET first and second return ready=true" }),
        }, priority: 1, confidence: "declared", reviewStatus: "reviewed" }],
      })) };
    const plan = { schemaVersion: "qa-campaign.v0", productSlug: "interruption-fixture",
      graphDigest: graph.semanticDigest, baseUrl, checks, blockers: [] };
    const input = { workspacePath: workspace, graph,
      catalog: { ...catalogBody, semanticDigest: digestCanonical(catalogBody) }, plan,
      expectedProductSlug: plan.productSlug, allowedBaseUrls: [baseUrl], environment: {} };
    const inputPath = path.join(audit, "input.json");
    await writeFile(inputPath, JSON.stringify(input), { flag: "wx", mode: 0o600 });
    await writeNewCampaignPlan(workspace, path.join(workspace, "tests/qa-campaign.v0.json"), plan);
    const initial = launch("execute", inputPath);
    let readyTimer;
    try { await Promise.race([secondArrived, initial.done.then(outcome => { throw new Error(`Worker finished before interruption: ${JSON.stringify(outcome)}`); }),
      new Promise((_, reject) => { readyTimer = setTimeout(() => reject(new Error("Second request never arrived")), 15_000); })]); }
    finally { clearTimeout(readyTimer); }
    const beforeKill = await files(workspace);
    assert.equal(arrivals.filter(item => item.path === "/first").length, 1);
    assert.ok(beforeKill.some(item => item.path.endsWith("/result.json")), "First attempt must actually finish before the kill");
    assert.ok(!beforeKill.some(item => item.path.endsWith("/receipt.json")));
    killGroup(initial.child.pid);
    const stopped = await initial.done;
    assert.equal(stopped.signal, "SIGKILL");
    server.closeAllConnections();
    const members = execFileSync("ps", ["-axo", "pid=,pgid=,stat="], { encoding: "utf8" }).split("\n")
      .map(line => line.trim().split(/\s+/)).filter(parts => Number(parts[1]) === initial.child.pid);
    assert.equal(members.length, 0, "Owned worker group survived SIGKILL");
    const afterKill = await files(workspace);
    assert.deepEqual(afterKill, beforeKill, "Interruption modified already completed evidence");
    const freshRead = await complete("read", inputPath);
    // This is the observed limitation, not a desired long-term behavior or PASS.
    assert.equal(freshRead.value, null, "Update this diagnostic when real resume support exists");
    hold = false;
    const rerun = await complete("execute", inputPath);
    const freshTerminal = await complete("read", inputPath);
    assert.equal(freshTerminal.value.receipt.runId, rerun.value.runId);
    assert.equal(rerun.value.verdict, "PASS");
    const firstReads = arrivals.filter(item => item.path === "/first").length;
    assert.equal(firstReads, 2);
    const report = { diagnosticOnly: true, baseSource: execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim(),
      workspace, arrivals, stopped, freshReaderPid: freshRead.pid, freshReaderResult: freshRead.value,
      completedEvidenceBeforeKill: beforeKill, retainedEvidenceAfterKill: afterKill,
      resumedByCurrentApi: false, ordinaryRerunRepeatsCompletedFirstCheck: firstReads === 2,
      rerunId: rerun.value.runId, terminalReaderPid: freshTerminal.pid,
      boundary: "Owned actual API adapter and runner; not registered CLI, agent decision, payment or recovery qualification" };
    await writeFile(path.join(audit, "REPORT.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    process.stdout.write(JSON.stringify({ audit, conclusion: "Completed attempt files survive, but no terminal receipt/resume; ordinary rerun repeats first check" }) + "\n");
  } finally {
    for (const entry of active) killGroup(entry.child.pid);
    await Promise.all([...active].map(entry => entry.done));
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

