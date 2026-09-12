// Registration/CLI grammar diagnostic, NOT an actual CLI crash or resume test.
// Real registration, no product requests. A synthetic unsealed directory models
// one entry that the separately executed SIGKILL probe leaves behind.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

assert.notEqual(process.platform, "win32", "POSIX fixture permissions are required");
async function sourceRoot(name, sha) {
  assert.ok(process.env[name] && path.isAbsolute(process.env[name]), `${name} must be explicit and absolute`);
  const root = await realpath(process.env[name]);
  assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), sha);
  assert.equal(execFileSync("git", ["diff", "HEAD", "--name-only"], { cwd: root, encoding: "utf8" }).trim(), "");
  return root;
}
const consoleRoot = await sourceRoot("QA_CONTINUATION_CONSOLE_ROOT", "6e84afbeef9dc660fd7b5b4c7096c17e7cfd72f0");
const kernelRoot = await sourceRoot("QA_CONTINUATION_KERNEL_ROOT", "15a067c9a694de26460102ce5dadb9707c7977b1");
const load = relative => import(pathToFileURL(path.join(consoleRoot, relative)).href);
const kernel = await import(pathToFileURL(path.join(kernelRoot, "src/index.ts")).href);
const { buildRecordedIntakeSubmission } = await load("src/lib/intake-build.ts");
const { createRegistrationRuntime } = await load("server/registration-runtime.mjs");
const audit = await mkdtemp(path.join(await realpath(tmpdir()), "qa-registered-continuation-"));
const workspace = path.join(audit, "workspace");
const baseUrl = "https://continuation.fixture.test/";
const briefText = "Owned synthetic product for workspace grammar diagnostics. Do not contact its URL or execute any product checks.";
const submission = await buildRecordedIntakeSubmission({
  productName: "Continuation Fixture", slug: "continuation-fixture", description: "An offline registration/CLI grammar fixture.",
  assuranceMode: "black_box", surfaces: ["api"],
  environments: [{ kind: "staging", name: "Owned fixture", baseUrl }], sources: [{ kind: "url", locator: baseUrl }],
  briefText,
});
const scheduled = [], backgroundErrors = [];
let target, settle;
const jobFinished = new Promise(resolve => { settle = resolve; });
const runtime = createRegistrationRuntime({
  starterRepo: kernelRoot,
  kernel: { ...kernel, async runRegistrationJob(input, service) {
    try { const result = await kernel.runRegistrationJob(input, service); settle({}); return result; }
    catch (error) { settle({ error: String(error) }); throw error; }
  } },
  broker: { execute: async () => { throw new Error("Registration must not launch product execution"); } },
  targetRegistry: {
    registerTarget: async value => { target = value; return value; },
    resolveTargetWorkspace: async targetWorkspaceId => { assert.equal(target?.targetWorkspaceId, targetWorkspaceId); return target; },
  },
  storeRoot: path.join(audit, "registration-store"),
  idempotencyStorePath: path.join(audit, "console-authority/submit.json"),
  schedule: task => scheduled.push(task), onBackgroundError: error => backgroundErrors.push(String(error)),
});
const submitted = await runtime.submitIntake({ workspacePath: workspace, briefText,
  intakeDraft: submission.intakeDraft, sourceSnapshots: submission.sourceSnapshots,
  idempotencyKey: "register-continuation-fixture-0001" });
assert.equal(scheduled.length, 1);
scheduled.shift()();
const outcome = await jobFinished;
assert.equal(outcome.error, undefined, outcome.error);
assert.deepEqual(backgroundErrors, []);
const registered = await runtime.read(submitted.registration.session.sessionId);
assert.equal(registered.session.lifecycle, "REGISTERED");
assert.equal(registered.job.phase, "COMPLETE");
const dependencies = kernel.createDefaultWorkspaceKernelDependencies();
const before = await kernel.validateWorkspace(workspace, dependencies);
assert.equal(before.valid, true, JSON.stringify(before));

const childEnv = { QA_STARTER_REPO: kernelRoot, QA_STARTER_EXPECTED_SHA: "15a067c9a694de26460102ce5dadb9707c7977b1",
  TMPDIR: audit, TSX_DISABLE_CACHE: "1", NODE_DISABLE_COMPILE_CACHE: "1" };
for (const name of ["PATH", "LANG", "LC_ALL"]) if (process.env[name]) childEnv[name] = process.env[name];
// A deliberately absent plan is a pre-dispatch boundary even if workspace
// validation later learns to admit unfinished runs. No fabricated product PASS.
const absentPlan = path.join(workspace, "tests/continuation-absent-plan.json");
async function runCli() {
  const child = spawn(process.execPath, ["--import", "tsx", "scripts/qa-campaign.ts", "run",
    "--workspace", workspace, "--plan", absentPlan], {
    cwd: consoleRoot, env: childEnv, detached: true, stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "", stderr = "";
  child.stdout.on("data", bytes => { stdout += bytes; });
  child.stderr.on("data", bytes => { stderr += bytes; });
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { process.kill(-child.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") reject(error); }
    }, 90000);
    child.once("error", error => { clearTimeout(timer); reject(error); });
    child.once("close", (code, signal) => { clearTimeout(timer); resolve({ code, signal, stdout, stderr }); });
  });
  assert.equal(result.signal, null, JSON.stringify(result));
  assert.equal(result.code, 1, JSON.stringify(result));
  return { ...result, value: JSON.parse(stdout) };
}
async function inventory(directory, root = directory) {
  const entries = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const info = await stat(full);
    entries.push({ path: path.relative(root, full), mode: info.mode & 0o777,
      ...(entry.isFile() ? { sha256: createHash("sha256").update(await readFile(full)).digest("hex") } : {}) });
    if (entry.isDirectory()) entries.push(...await inventory(full, root));
    else assert.ok(entry.isFile(), "Unexpected fixture entry");
  }
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}
const initialFiles = await inventory(path.join(workspace, "tests"));
const healthyCli = await runCli();
assert.match(healthyCli.value.error, /ENOENT|no such file|does not exist/i);
assert.doesNotMatch(healthyCli.value.error, /workspace validation failed/i);
assert.deepEqual(await inventory(path.join(workspace, "tests")), initialFiles);

// Match a real runner's unsealed entry, but keep the synthetic provenance explicit.
const runRoot = path.join(workspace, "tests/campaign-runs");
await mkdir(runRoot, { mode: 0o700 });
await mkdir(path.join(runRoot, "run-0000000000000000-00000000-0000-4000-8000-000000000001"), { mode: 0o700 });
const withUnsealed = await inventory(path.join(workspace, "tests"));
const after = await kernel.validateWorkspace(workspace, dependencies);
assert.equal(after.valid, false, "Update this diagnostic if nonterminal grammar becomes supported");
assert.deepEqual(after.diagnostics, [{ code: "WORKSPACE_ENTRY_INVALID",
  path: "tests/campaign-runs/run-0000000000000000-00000000-0000-4000-8000-000000000001" }],
"An unrelated grammar error is not evidence for the unsealed-mode limitation");
const interruptedShapeCli = await runCli();
assert.match(interruptedShapeCli.value.error, /workspace validation failed before campaign artifacts/);
assert.deepEqual(await inventory(path.join(workspace, "tests")), withUnsealed);
const report = { diagnosticOnly: true, fixtureKind: "synthetic-unsealed-directory-after-real-registration",
  consoleRoot, kernelRoot, workspace, registrationSessionId: registered.session.sessionId,
  before, healthyCli, initialFiles, withUnsealed, after, interruptedShapeCli,
  conclusion: "Real registration validates; an unsealed campaign directory blocks the real CLI at workspace preflight, earlier than the absent-plan boundary. No product checks were executed." };
await writeFile(path.join(audit, "REPORT.json"), JSON.stringify(report, null, 2), { flag: "wx", mode: 0o600 });
console.log(JSON.stringify({ audit, conclusion: report.conclusion }));
