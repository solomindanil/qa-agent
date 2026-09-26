import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const sha = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const fixture = async () => {
  const root = await mkdtemp(path.join(await realpath(os.tmpdir()), "w4-frozen-run-test-"));
  const workspacePath = path.join(root, "workspace");
  const archiveRoot = path.join(root, "archive");
  await mkdir(path.join(workspacePath, "tests"), { recursive: true });
  await mkdir(path.join(workspacePath, "model"));
  await writeFile(path.join(workspacePath, "model/test-strategy.draft.json"), JSON.stringify({ semanticDigest: "strategy" }));
  await mkdir(archiveRoot);
  const firstPlanPath = path.join(archiveRoot, "first-attempt/M/plan.original.json");
  await mkdir(path.dirname(firstPlanPath), { recursive: true });
  const plan = { productSlug: "example", baseUrl: "http://127.0.0.1:45123/", graphDigest: "graph", checks: [{ checkId: "A" }], blockers: [{ targetId: "D" }] };
  const firstBytes = Buffer.from(JSON.stringify(plan, null, 2) + "\n");
  await writeFile(firstPlanPath, firstBytes);
  return { root, workspacePath, archiveRoot, firstPlanPath, firstBytes, plan };
};

test("freeze publishes one canonical plan and preserves first bytes and blockers", async () => {
  const { freezeFirstPlan } = await import("./frozen-run.mts");
  const f = await fixture();
  let writes = 0;
  const deps = {
    validateWorkspace: async () => ({ valid: true, publicationAuthorityDigest: "authority" }),
    readCampaignWorkspace: async () => ({ graph: { semanticDigest: "graph", nodes: [{ coverageTarget: true }, { coverageTarget: true }, { coverageTarget: true }, { coverageTarget: true }] }, catalog: { semanticDigest: "catalog" }, project: {} }),
    parsePlan: (raw: unknown) => raw as typeof f.plan,
    validateClosure: ({ plan }: { plan: typeof f.plan }) => ({ plan, readyToRun: false, executableTargetIds: ["A"], blockedTargetIds: ["D"] }),
    writeNewCampaignPlan: async (_workspace: string, destination: string, plan: unknown) => { writes++; await writeFile(destination, JSON.stringify(plan) + "\n", { flag: "wx" }); return destination; },
    readCampaignPlan: async (_workspace: string, destination: string) => JSON.parse(await readFile(destination, "utf8")),
    canonicalJson: (value: unknown) => JSON.stringify(value) + "\n",
    digestCanonical: (value: unknown) => sha(Buffer.from(JSON.stringify(value) + "\n")),
  };
  const input = { caseId: "M" as const, workspacePath: f.workspacePath, archiveRoot: f.archiveRoot, firstPlanPath: f.firstPlanPath, expectedFirstPlanSha256: sha(f.firstBytes), originalBaseUrl: f.plan.baseUrl, expectedProductSlug: "example", expectedAuthorityDigest: "authority", expectedGraphDigest: "graph", expectedCatalogDigest: "catalog", expectedStrategyDigest: "strategy" };
  await assert.rejects(freezeFirstPlan({ ...input, expectedFirstPlanSha256: sha(Buffer.from("wrong")) }, deps), /graded.*sha|first.*sha/i);
  assert.equal(writes, 0);
  const result = await freezeFirstPlan(input, deps);
  assert.equal(writes, 1);
  assert.equal(result.readyToRun, false);
  assert.deepEqual(result.blockedTargetIds, ["D"]);
  assert.deepEqual(await readFile(f.firstPlanPath), f.firstBytes);
  assert.equal(await readFile(path.join(f.workspacePath, "tests/qa-campaign.v0.json"), "utf8"), JSON.stringify(f.plan) + "\n");
  assert.equal(result.firstPlanSha256, sha(f.firstBytes));
  await assert.rejects(freezeFirstPlan(input, deps), /already exists|EEXIST/);
  assert.equal(writes, 1, "a frozen record forbids a second writer call");
});

test("freeze rejects changed strategy before creating any plan", async () => {
  const { freezeFirstPlan } = await import("./frozen-run.mts");
  const f = await fixture();
  let writes = 0;
  const deps = {
    validateWorkspace: async () => ({ valid: true, publicationAuthorityDigest: "authority" }),
    readCampaignWorkspace: async () => ({ graph: { semanticDigest: "graph", nodes: Array.from({ length: 4 }, () => ({ coverageTarget: true })) }, catalog: { semanticDigest: "catalog" }, project: {} }),
    parsePlan: (raw: unknown) => raw as typeof f.plan,
    validateClosure: ({ plan }: { plan: typeof f.plan }) => ({ plan, readyToRun: false, executableTargetIds: ["A"], blockedTargetIds: ["D"] }),
    writeNewCampaignPlan: async () => { writes++; return "unused"; },
  };
  await assert.rejects(freezeFirstPlan({ caseId: "M", workspacePath: f.workspacePath, archiveRoot: f.archiveRoot, firstPlanPath: f.firstPlanPath, expectedFirstPlanSha256: sha(f.firstBytes), originalBaseUrl: f.plan.baseUrl, expectedProductSlug: "example", expectedAuthorityDigest: "authority", expectedGraphDigest: "graph", expectedCatalogDigest: "catalog", expectedStrategyDigest: "changed" }, deps), /strategy/i);
  assert.equal(writes, 0);
});

test("ordinary and AggregateError writer failures inspect matching, absent, and mismatching leaves, then stop", async () => {
  const { freezeFirstPlan } = await import("./frozen-run.mts");
  for (const [state, writerError] of [["matching", new Error("close acknowledgement lost")], ["absent", new Error("write failed")], ["mismatching", new AggregateError([new Error("publish failed"), new Error("rollback failed")], "publication uncertain")]] as const) {
    const f = await fixture();
    let writes = 0;
    const deps = {
      validateWorkspace: async () => ({ valid: true, publicationAuthorityDigest: "authority" }),
      readCampaignWorkspace: async () => ({ graph: { semanticDigest: "graph", nodes: Array.from({ length: 4 }, () => ({ coverageTarget: true })) }, catalog: { semanticDigest: "catalog" }, project: {} }),
      parsePlan: (raw: unknown) => raw as typeof f.plan,
      validateClosure: ({ plan }: { plan: typeof f.plan }) => ({ plan, readyToRun: false, executableTargetIds: ["A"], blockedTargetIds: ["D"] }),
      writeNewCampaignPlan: async (_workspace: string, destination: string, plan: unknown) => {
        writes++;
        if (state !== "absent") await writeFile(destination, state === "matching" ? JSON.stringify(plan) + "\n" : '{"wrong":true}\n', { flag: "wx" });
        throw writerError;
      },
      readCampaignPlan: async (_workspace: string, destination: string) => JSON.parse(await readFile(destination, "utf8")),
      canonicalJson: (value: unknown) => JSON.stringify(value) + "\n",
      digestCanonical: (value: unknown) => sha(Buffer.from(JSON.stringify(value) + "\n")),
    };
    const input = { caseId: "M" as const, workspacePath: f.workspacePath, archiveRoot: f.archiveRoot, firstPlanPath: f.firstPlanPath, expectedFirstPlanSha256: sha(f.firstBytes), originalBaseUrl: f.plan.baseUrl, expectedProductSlug: "example", expectedAuthorityDigest: "authority", expectedGraphDigest: "graph", expectedCatalogDigest: "catalog", expectedStrategyDigest: "strategy" };
    await assert.rejects(freezeFirstPlan(input, deps), (error: any) => error.cause === writerError && error.message.includes(state));
    assert.equal(writes, 1);
    await assert.rejects(readFile(path.join(f.archiveRoot, "M-frozen.json")), { code: "ENOENT" });
  }
});

test("selected mode archives original receipt and all artifact bytes, then re-reads healthy by ID", async () => {
  const { runFrozenMode } = await import("./frozen-run.mts");
  const f = await fixture();
  const planPath = path.join(f.workspacePath, "tests/qa-campaign.v0.json");
  await writeFile(planPath, JSON.stringify(f.plan) + "\n");
  const recordPath = path.join(f.archiveRoot, "M-frozen.json");
  await writeFile(recordPath, JSON.stringify({ caseId: "M", workspacePath: f.workspacePath, archiveRoot: f.archiveRoot, originalBaseUrl: f.plan.baseUrl, expectedProductSlug: "example", expectedAuthorityDigest: "authority", expectedGraphDigest: "graph", expectedCatalogDigest: "catalog", expectedStrategyDigest: "strategy", planDigest: "plan", planPath, firstPlanPath: f.firstPlanPath, firstPlanSha256: sha(f.firstBytes), expectedFirstPlanSha256: sha(f.firstBytes) }));
  const runId = "run-aaaaaaaaaaaaaaaa-11111111-1111-4111-8111-111111111111";
  const runDirectory = `tests/campaign-runs/${runId}`;
  const artifactPath = `${runDirectory}/checks/a/attempt-1/trace.json`;
  const artifactBytes = Buffer.from('{"trace":"original"}\n');
  const receipt = { schemaVersion: "qa-campaign-receipt.v0", runId, runDirectory, planDigest: "plan", bindingDigest: "binding", artifacts: [{ path: artifactPath, sha256: sha(artifactBytes), bytes: artifactBytes.length }] };
  await mkdir(path.join(f.workspacePath, runDirectory, "checks/a/attempt-1"), { recursive: true });
  await writeFile(path.join(f.workspacePath, artifactPath), artifactBytes);
  const receiptBytes = Buffer.from(JSON.stringify(receipt) + "\n");
  await writeFile(path.join(f.workspacePath, runDirectory, "receipt.json"), receiptBytes);
  let readerCalls: string[] = [];
  let runnerCalls = 0;
  let currentReceipt = receipt;
  const receiptById = new Map([[runId, { receipt, bytes: receiptBytes }]]);
  const deps = {
    validateWorkspace: async () => ({ valid: true, publicationAuthorityDigest: "authority" }),
    readCampaignWorkspace: async () => ({ graph: { semanticDigest: "graph", nodes: Array.from({ length: 4 }, () => ({ coverageTarget: true })) }, catalog: { semanticDigest: "catalog" }, project: {} }),
    parsePlan: (raw: unknown) => raw as typeof f.plan,
    validateClosure: ({ plan }: { plan: typeof f.plan }) => ({ plan, readyToRun: false, executableTargetIds: ["A"], blockedTargetIds: ["D"] }),
    digestCanonical: () => "plan",
    runCampaign: async () => { runnerCalls++; return currentReceipt; },
    readEvidence: async (input: { runId: string }) => { readerCalls.push(input.runId); const found = receiptById.get(input.runId)!; return { plan: f.plan, receipt: found.receipt, receiptDigest: sha(found.bytes), receiptObservedAt: new Date().toISOString() }; },
    probeEnvironment: async () => ({ status: 200, body: { candidateRevision: "v2" } }),
  };
  await assert.rejects(runFrozenMode({ recordPath, archiveRoot: path.join(f.root, "not-approved"), mode: "healthy", controllerStatus: { event: "status", baseUrl: f.plan.baseUrl, candidateRevision: "v2", mode: "healthy", alive: true } }, deps), /archive root|binding/i);
  assert.equal(runnerCalls, 0);
  await assert.rejects(runFrozenMode({ recordPath, archiveRoot: f.archiveRoot, mode: "healthy", priorHealthyRunId: runId, controllerStatus: { event: "status", baseUrl: f.plan.baseUrl, candidateRevision: "v2", mode: "healthy", alive: true } }, deps), /priorHealthyRunId/i);
  assert.equal(runnerCalls, 0);
  await writeFile(f.firstPlanPath, '{"changed":true}\n');
  await assert.rejects(runFrozenMode({ recordPath, archiveRoot: f.archiveRoot, mode: "healthy", controllerStatus: { event: "status", baseUrl: f.plan.baseUrl, candidateRevision: "v2", mode: "healthy", alive: true } }, deps), /first plan/i);
  await writeFile(f.firstPlanPath, f.firstBytes);
  const result = await runFrozenMode({ recordPath, archiveRoot: f.archiveRoot, mode: "healthy", controllerStatus: { event: "status", baseUrl: f.plan.baseUrl, candidateRevision: "v2", mode: "healthy", alive: true } }, deps);
  assert.deepEqual(readerCalls, [runId]);
  assert.equal(result.runId, runId);
  assert.equal(result.archivePath, path.join(f.archiveRoot, "runs/M/healthy"));
  assert.deepEqual((await readdir(result.archivePath)).sort(), ["artifact-inventory.json", "artifacts", "candidate-readback.json", "reader.original.json", "receipt.original.json", "run-boundaries.json"].sort());
  assert.deepEqual(await readFile(path.join(result.archivePath, "receipt.original.json")), receiptBytes);
  assert.deepEqual(await readFile(path.join(result.archivePath, "artifacts/checks/a/attempt-1/trace.json")), artifactBytes);
  const readerBytes = await readFile(path.join(result.archivePath, "reader.original.json"), "utf8");
  assert.deepEqual(JSON.parse(readerBytes).receipt, receipt);
  assert.doesNotMatch(readerBytes, /mapped_broken|unmapped_broken|"mode"/);
  assert.deepEqual(JSON.parse(await readFile(path.join(result.archivePath, "candidate-readback.json"), "utf8")), { status: 200, body: { candidateRevision: "v2" } });
  assert.deepEqual(JSON.parse(await readFile(path.join(result.archivePath, "artifact-inventory.json"), "utf8")), [{ sourcePath: artifactPath, archiveRelativePath: "checks/a/attempt-1/trace.json", sha256: sha(artifactBytes), bytes: artifactBytes.length }]);
  await assert.rejects(runFrozenMode({ recordPath, archiveRoot: f.archiveRoot, mode: "healthy", controllerStatus: { event: "status", baseUrl: f.plan.baseUrl, candidateRevision: "v2", mode: "healthy", alive: true } }, deps), /already exists|EEXIST/);
  assert.deepEqual(readerCalls, [runId], "one-shot admission prevents an accidental second runner/readback");
  const brokenRunId = "run-aaaaaaaaaaaaaaaa-22222222-2222-4222-8222-222222222222";
  const brokenDirectory = `tests/campaign-runs/${brokenRunId}`;
  const brokenArtifact = `${brokenDirectory}/checks/a/attempt-1/trace.json`;
  const brokenReceipt = { ...receipt, runId: brokenRunId, runDirectory: brokenDirectory, artifacts: [{ path: brokenArtifact, sha256: sha(artifactBytes), bytes: artifactBytes.length }] };
  const brokenReceiptBytes = Buffer.from(JSON.stringify(brokenReceipt) + "\n");
  await mkdir(path.join(f.workspacePath, brokenDirectory, "checks/a/attempt-1"), { recursive: true });
  await writeFile(path.join(f.workspacePath, brokenArtifact), artifactBytes);
  await writeFile(path.join(f.workspacePath, brokenDirectory, "receipt.json"), brokenReceiptBytes);
  receiptById.set(brokenRunId, { receipt: brokenReceipt, bytes: brokenReceiptBytes });
  currentReceipt = brokenReceipt;
  await assert.rejects(runFrozenMode({ recordPath, archiveRoot: f.archiveRoot, mode: "mapped_broken",
    controllerStatus: { event: "status", baseUrl: f.plan.baseUrl, candidateRevision: "v2", mode: "mapped_broken", alive: true } }, deps), /priorHealthyRunId/i);
  assert.equal(runnerCalls, 1);
  const broken = await runFrozenMode({ recordPath, archiveRoot: f.archiveRoot, mode: "mapped_broken", priorHealthyRunId: runId,
    controllerStatus: { event: "status", baseUrl: f.plan.baseUrl, candidateRevision: "v2", mode: "mapped_broken", alive: true } }, deps);
  assert.equal(broken.runId, brokenRunId);
  assert.deepEqual(readerCalls, [runId, brokenRunId, runId]);
  assert.equal(broken.archivePath, path.join(f.archiveRoot, "runs/M/broken"));
  assert.deepEqual(JSON.parse(await readFile(path.join(broken.archivePath, "run-boundaries.json"), "utf8")).priorHealthy, { runId, receiptDigest: sha(receiptBytes) });
});

test("throwing runner consumes the one-shot mode admission and is never retried", async () => {
  const { runFrozenMode } = await import("./frozen-run.mts");
  const f = await fixture();
  const planPath = path.join(f.workspacePath, "tests/qa-campaign.v0.json");
  await writeFile(planPath, JSON.stringify(f.plan) + "\n");
  const recordPath = path.join(f.archiveRoot, "M-frozen.json");
  await writeFile(recordPath, JSON.stringify({ caseId: "M", workspacePath: f.workspacePath, archiveRoot: f.archiveRoot,
    originalBaseUrl: f.plan.baseUrl, expectedProductSlug: "example", expectedAuthorityDigest: "authority",
    expectedGraphDigest: "graph", expectedCatalogDigest: "catalog", expectedStrategyDigest: "strategy",
    planDigest: "plan", planPath, firstPlanPath: f.firstPlanPath,
    firstPlanSha256: sha(f.firstBytes), expectedFirstPlanSha256: sha(f.firstBytes) }));
  let calls = 0;
  const deps = {
    validateWorkspace: async () => ({ valid: true, publicationAuthorityDigest: "authority" }),
    readCampaignWorkspace: async () => ({ graph: { semanticDigest: "graph", nodes: Array.from({ length: 4 }, () => ({ coverageTarget: true })) }, catalog: { semanticDigest: "catalog" }, project: {} }),
    parsePlan: (raw: unknown) => raw as typeof f.plan,
    validateClosure: ({ plan }: { plan: typeof f.plan }) => ({ plan, readyToRun: false, executableTargetIds: ["A"], blockedTargetIds: ["D"] }),
    digestCanonical: () => "plan",
    probeEnvironment: async () => ({ status: 200, body: { candidateRevision: "v2" } }),
    runCampaign: async () => { calls++; throw new Error("runner outcome unknown"); },
  };
  const input = { recordPath, archiveRoot: f.archiveRoot, mode: "healthy" as const,
    controllerStatus: { event: "status", baseUrl: f.plan.baseUrl, candidateRevision: "v2", mode: "healthy", alive: true } };
  await assert.rejects(runFrozenMode(input, deps), /runner outcome unknown/);
  await assert.rejects(runFrozenMode(input, deps), /EEXIST/);
  assert.equal(calls, 1);
  await assert.rejects(readFile(path.join(f.archiveRoot, "runs/M/healthy/receipt.original.json")), { code: "ENOENT" });
});

test("CLI accepts only an explicit freeze or run request file", async () => {
  const { parseFrozenRunCommand } = await import("./frozen-run.mts");
  assert.deepEqual(parseFrozenRunCommand(["freeze", "/private/example/request.json"]), { command: "freeze", requestPath: "/private/example/request.json" });
  assert.deepEqual(parseFrozenRunCommand(["run", "/private/example/request.json"]), { command: "run", requestPath: "/private/example/request.json" });
  for (const argv of [["execute"], ["run"], ["run", "relative.json"], ["freeze", "/private/example/request.json", "again"]]) {
    assert.throws(() => parseFrozenRunCommand(argv));
  }
});
