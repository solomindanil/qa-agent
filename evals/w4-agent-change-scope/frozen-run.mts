import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { canonicalJson, digestCanonical } from "../../components/console/src/lib/canonical-digest.ts";
import { QaCampaignPlanV0Schema, validateCampaignClosure } from "../../components/console/src/lib/qa-campaign-v0.ts";
import { readCampaignPlan, readCampaignWorkspace, writeNewCampaignPlan } from "../../components/console/src/node/qa-campaign-files.ts";
import { runQaCampaign } from "../../components/console/src/node/qa-campaign-runner.ts";
import { PlaywrightCampaignAdapter } from "../../components/console/src/node/playwright-campaign-adapter.ts";
// @ts-expect-error the selected ESM reader has no declaration
import { readLatestCampaignEvidence } from "../../components/console/server/campaign-receipts.mjs";
import { assertPinnedKernelRevision } from "../../components/console/server/kernel-authority.mjs";

type CaseId = "M" | "U";
type Mode = "healthy" | "mapped_broken" | "unmapped_broken";
type Json = Record<string, any>;
const sha = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const strictUrl = (value: string) => new URL(value).href;

export interface FreezeInput {
  caseId: CaseId;
  workspacePath: string;
  archiveRoot: string;
  firstPlanPath: string;
  expectedFirstPlanSha256: string;
  originalBaseUrl: string;
  expectedProductSlug: string;
  expectedAuthorityDigest: string;
  expectedGraphDigest: string;
  expectedCatalogDigest: string;
  expectedStrategyDigest: string;
}

export interface RunInput {
  recordPath: string;
  archiveRoot: string;
  mode: Mode;
  controllerStatus: { event: string; baseUrl: string; candidateRevision: string; mode: string; alive: boolean };
  priorHealthyRunId?: string;
}

async function selectedKernel() {
  const root = process.env.QA_STARTER_REPO;
  if (!root || !path.isAbsolute(root)) throw new Error("QA_STARTER_REPO must identify the selected absolute Kernel checkout");
  assertPinnedKernelRevision(root);
  return import(pathToFileURL(path.join(root, "src/index.ts")).href);
}

const production = {
  validateWorkspace: async (workspacePath: string) => (await selectedKernel()).validateWorkspace(workspacePath),
  readCampaignWorkspace,
  parsePlan: (raw: unknown) => QaCampaignPlanV0Schema.parse(raw),
  validateClosure: validateCampaignClosure,
  writeNewCampaignPlan,
  readCampaignPlan,
  canonicalJson,
  digestCanonical,
  runCampaign: (input: Json) => runQaCampaign(input as Parameters<typeof runQaCampaign>[0], new PlaywrightCampaignAdapter({ baseUrl: input.plan.baseUrl, environment: {} })),
  readEvidence: readLatestCampaignEvidence,
  probeEnvironment: async (baseUrl: string) => {
    const response = await fetch(new URL("/api/environment", baseUrl), { redirect: "error" });
    return { status: response.status, body: await response.json() };
  },
};

function assertAbsolute(input: string, label: string) {
  if (!path.isAbsolute(input) || path.resolve(input) !== input) throw new Error(`${label} must be an absolute normalized path`);
}

async function assertWorkspace(input: FreezeInput, deps: typeof production) {
  assertAbsolute(input.workspacePath, "Workspace");
  assertAbsolute(input.archiveRoot, "Archive root");
  const validation = await deps.validateWorkspace(input.workspacePath);
  if (validation.valid !== true || validation.publicationAuthorityDigest !== input.expectedAuthorityDigest) throw new Error("Current managed publication validation does not match frozen authority");
  const workspace = await deps.readCampaignWorkspace(input.workspacePath);
  if (workspace.graph.semanticDigest !== input.expectedGraphDigest || workspace.catalog.semanticDigest !== input.expectedCatalogDigest) throw new Error("Current graph/catalog identity differs from frozen authority");
  const strategy = JSON.parse(await readFile(path.join(input.workspacePath, "model/test-strategy.draft.json"), "utf8"));
  if (strategy.semanticDigest !== input.expectedStrategyDigest) throw new Error("Current strategy digest differs from frozen authority");
  if (workspace.graph.nodes.filter((node: Json) => node.coverageTarget).length !== 4) throw new Error("Four-target denominator changed");
  return workspace;
}

export async function freezeFirstPlan(input: FreezeInput, override: Partial<typeof production> = {}) {
  const deps = { ...production, ...override };
  if (input.caseId !== "M" && input.caseId !== "U") throw new Error("Case must be M or U");
  assertAbsolute(input.firstPlanPath, "First plan");
  if (input.firstPlanPath !== path.join(input.archiveRoot, "first-attempt", input.caseId, "plan.original.json")) throw new Error("First plan must be the exact archived original under the approved attempt root");
  const recordPath = path.join(input.archiveRoot, `${input.caseId}-frozen.json`);
  try { await lstat(recordPath); throw new Error("Frozen case already exists"); } catch (error: any) { if (error.code !== "ENOENT") throw error; }
  const workspace = await assertWorkspace(input, deps);
  const firstBytes = await readFile(input.firstPlanPath);
  if (sha(firstBytes) !== input.expectedFirstPlanSha256) throw new Error("Archived first plan SHA does not match independently graded SHA");
  const plan = deps.parsePlan(JSON.parse(firstBytes.toString("utf8")));
  if (plan.productSlug !== input.expectedProductSlug || strictUrl(plan.baseUrl) !== strictUrl(input.originalBaseUrl)) throw new Error("First plan product/origin differs from frozen identity");
  if (plan.graphDigest !== input.expectedGraphDigest) throw new Error("First plan graph digest differs from frozen identity");
  const closure = deps.validateClosure({ graph: workspace.graph, catalog: workspace.catalog, expectedProductSlug: input.expectedProductSlug, allowedBaseUrls: [input.originalBaseUrl], plan });
  if (closure.plan.checks.length === 0) throw new Error("First plan has no safe executable checks");
  const planPath = path.join(input.workspacePath, "tests/qa-campaign.v0.json");
  const expectedBytes = Buffer.from(deps.canonicalJson(closure.plan));
  try {
    await deps.writeNewCampaignPlan(input.workspacePath, planPath, closure.plan);
  } catch (error) {
    let leafState: "matching" | "absent" | "mismatching" | "unreadable";
    try {
      leafState = (await readFile(planPath)).equals(expectedBytes) ? "matching" : "mismatching";
    } catch (readError: any) {
      leafState = readError?.code === "ENOENT" ? "absent" : "unreadable";
    }
    throw new Error(`Campaign plan writer failed; canonical leaf ${leafState}; outcome remains uncertain and must not be retried automatically`, { cause: error });
  }
  const readback = deps.parsePlan(await deps.readCampaignPlan(input.workspacePath, planPath));
  const actualBytes = await readFile(planPath);
  if (!actualBytes.equals(expectedBytes) || deps.canonicalJson(readback) !== expectedBytes.toString("utf8")) throw new Error("Canonical plan readback differs from frozen first submission");
  const record = {
    caseId: input.caseId, workspacePath: input.workspacePath, archiveRoot: input.archiveRoot, originalBaseUrl: input.originalBaseUrl,
    expectedProductSlug: input.expectedProductSlug, expectedAuthorityDigest: input.expectedAuthorityDigest,
    expectedGraphDigest: input.expectedGraphDigest, expectedCatalogDigest: input.expectedCatalogDigest,
    expectedStrategyDigest: input.expectedStrategyDigest,
    planPath, firstPlanPath: input.firstPlanPath, firstPlanSha256: sha(firstBytes), expectedFirstPlanSha256: input.expectedFirstPlanSha256,
    planDigest: deps.digestCanonical(readback), writeOutcome: "created", readyToRun: closure.readyToRun,
    executableTargetIds: closure.executableTargetIds, blockedTargetIds: closure.blockedTargetIds,
  };
  await writeFile(recordPath, JSON.stringify(record, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  return { ...record, recordPath };
}

function safeRunPath(runDirectory: string, artifactPath: string) {
  const prefix = `${runDirectory}/`;
  if (!artifactPath.startsWith(prefix) || artifactPath.split("/").some((part) => part === "" || part === "." || part === "..")) throw new Error("Receipt artifact escapes its original run");
  return artifactPath;
}

async function originalBytes(workspacePath: string, relativePath: string) {
  const full = path.join(workspacePath, ...relativePath.split("/"));
  const handle = await open(full, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stats = await handle.stat();
    if (!stats.isFile() || stats.nlink !== 1) throw new Error("Original evidence is not a singly linked regular file");
    return await handle.readFile();
  } finally { await handle.close(); }
}

async function createArchiveFile(root: string, relative: string, bytes: Uint8Array | string) {
  const destination = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
  await writeFile(destination, bytes, { flag: "wx", mode: 0o600 });
}

export async function runFrozenMode(input: RunInput, override: Partial<typeof production> = {}) {
  const deps = { ...production, ...override };
  assertAbsolute(input.recordPath, "Frozen record");
  assertAbsolute(input.archiveRoot, "Archive root");
  if (!["healthy", "mapped_broken", "unmapped_broken"].includes(input.mode)) throw new Error("Unsupported run mode");
  const record = JSON.parse(await readFile(input.recordPath, "utf8")) as FreezeInput & { planPath: string; planDigest: string; firstPlanSha256: string };
  if (record.caseId !== "M" && record.caseId !== "U") throw new Error("Frozen case identity is invalid");
  if (record.archiveRoot !== input.archiveRoot || input.recordPath !== path.join(record.archiveRoot, `${record.caseId}-frozen.json`)) throw new Error("Frozen record/archive root binding changed");
  if (record.firstPlanPath !== path.join(record.archiveRoot, "first-attempt", record.caseId, "plan.original.json")
    || record.firstPlanSha256 !== record.expectedFirstPlanSha256) throw new Error("Frozen graded first plan binding changed");
  if ((record.caseId === "M" && input.mode === "unmapped_broken") || (record.caseId === "U" && input.mode === "mapped_broken")) throw new Error("Mode does not match frozen case");
  if (input.mode === "healthy" && input.priorHealthyRunId !== undefined) throw new Error("Healthy run must not specify priorHealthyRunId");
  if (input.mode !== "healthy") {
    if (!input.priorHealthyRunId) throw new Error("Broken run requires priorHealthyRunId");
    const previous = JSON.parse(await readFile(path.join(input.archiveRoot, "runs", record.caseId, "healthy", "run-boundaries.json"), "utf8"));
    if (previous.runId !== input.priorHealthyRunId || previous.caseId !== record.caseId || previous.mode !== "healthy") throw new Error("priorHealthyRunId does not match this case's archived healthy run");
  }
  if (input.controllerStatus.event !== "status" || input.controllerStatus.alive !== true
    || input.controllerStatus.candidateRevision !== "v2" || input.controllerStatus.mode !== input.mode
    || strictUrl(input.controllerStatus.baseUrl) !== strictUrl(record.originalBaseUrl)) throw new Error("Controller status is not the selected same-origin v2 mode");
  if (sha(await readFile(record.firstPlanPath)) !== record.firstPlanSha256) throw new Error("Frozen first plan bytes changed after grading");
  const workspace = await assertWorkspace({ ...record, archiveRoot: input.archiveRoot, firstPlanPath: record.firstPlanPath }, deps);
  const plan = deps.parsePlan(JSON.parse(await readFile(record.planPath, "utf8")));
  const closure = deps.validateClosure({ graph: workspace.graph, catalog: workspace.catalog, expectedProductSlug: record.expectedProductSlug, allowedBaseUrls: [record.originalBaseUrl], plan });
  if (deps.digestCanonical(closure.plan) !== record.planDigest || closure.plan.checks.length === 0) throw new Error("Persisted frozen plan changed or has no executable checks");
  const environment = await deps.probeEnvironment(record.originalBaseUrl);
  if (environment.status !== 200 || environment.body?.candidateRevision !== "v2") throw new Error("Live origin is not candidate v2");
  const caseRoot = path.join(input.archiveRoot, "runs", record.caseId);
  await mkdir(caseRoot, { recursive: true, mode: 0o700 });
  if (await realpath(caseRoot) !== caseRoot) throw new Error("Archive case directory is not canonical");
  const modeRoot = path.join(caseRoot, input.mode === "healthy" ? "healthy" : "broken");
  await mkdir(modeRoot, { mode: 0o700 }); // durable one-shot admission; no automatic retry after uncertain runner outcome
  const startedAt = new Date().toISOString();
  const returned = await deps.runCampaign({ workspacePath: record.workspacePath, graph: workspace.graph, catalog: workspace.catalog,
    expectedProductSlug: record.expectedProductSlug, allowedBaseUrls: [record.originalBaseUrl], plan: closure.plan, environment: {} });
  const endedAt = new Date().toISOString();
  const evidence = await deps.readEvidence({ workspaceDir: record.workspacePath, workspaceRoots: [record.workspacePath], productSlug: record.expectedProductSlug,
    project: workspace.project, graph: workspace.graph, catalog: workspace.catalog, allowedBaseUrls: [record.originalBaseUrl], runId: returned.runId });
  if (!evidence || evidence.kind === "invalid" || evidence.receipt?.runId !== returned.runId
    || evidence.receipt.planDigest !== record.planDigest || evidence.receipt.bindingDigest !== returned.bindingDigest
    || deps.digestCanonical(evidence.plan) !== record.planDigest) throw new Error("Explicit run-ID evidence readback is invalid or changed");
  const receipt = evidence.receipt;
  if (receipt.runDirectory !== `tests/campaign-runs/${receipt.runId}`) throw new Error("Receipt run directory is not canonical");
  const receiptBytes = await originalBytes(record.workspacePath, `${receipt.runDirectory}/receipt.json`);
  if (sha(receiptBytes) !== evidence.receiptDigest || JSON.stringify(JSON.parse(receiptBytes.toString("utf8"))) !== JSON.stringify(receipt)) throw new Error("Original receipt bytes differ from explicit reader output");
  const originals: Array<{ sourcePath: string; archiveRelativePath: string; sha256: string; bytes: number; content: Buffer }> = [];
  for (const artifact of receipt.artifacts) {
    const relative = safeRunPath(receipt.runDirectory, artifact.path);
    const bytes = await originalBytes(record.workspacePath, relative);
    if (bytes.length !== artifact.bytes || sha(bytes) !== artifact.sha256) throw new Error(`Original artifact changed after reader validation: ${relative}`);
    originals.push({ sourcePath: relative, archiveRelativePath: relative.slice(receipt.runDirectory.length + 1), sha256: artifact.sha256, bytes: artifact.bytes, content: bytes });
  }
  let priorHealthy: { runId: string; receiptDigest: string } | undefined;
  if (input.priorHealthyRunId) {
    const prior = await deps.readEvidence({ workspaceDir: record.workspacePath, workspaceRoots: [record.workspacePath], productSlug: record.expectedProductSlug,
      project: workspace.project, graph: workspace.graph, catalog: workspace.catalog, allowedBaseUrls: [record.originalBaseUrl], runId: input.priorHealthyRunId });
    if (!prior || prior.kind === "invalid" || prior.receipt?.runId !== input.priorHealthyRunId || deps.digestCanonical(prior.plan) !== record.planDigest) throw new Error("Earlier healthy receipt no longer validates by explicit run ID");
    priorHealthy = { runId: input.priorHealthyRunId, receiptDigest: prior.receiptDigest };
  }
  const archivePath = modeRoot;
  await createArchiveFile(archivePath, "receipt.original.json", receiptBytes);
  await createArchiveFile(archivePath, "reader.original.json", JSON.stringify(evidence, null, 2) + "\n");
  await createArchiveFile(archivePath, "artifact-inventory.json", JSON.stringify(originals.map(({ content: _content, ...reference }) => reference), null, 2) + "\n");
  await createArchiveFile(archivePath, "candidate-readback.json", JSON.stringify(environment, null, 2) + "\n");
  for (const artifact of originals) await createArchiveFile(archivePath, `artifacts/${artifact.archiveRelativePath}`, artifact.content);
  await createArchiveFile(archivePath, "run-boundaries.json", JSON.stringify({ caseId: record.caseId, mode: input.mode, baseUrl: record.originalBaseUrl,
    startedAt, endedAt, runId: receipt.runId, planDigest: record.planDigest, receiptDigest: evidence.receiptDigest,
    ...(priorHealthy === undefined ? {} : { priorHealthy }), journalStatus: "awaiting-controller-close-and-reconciliation" }, null, 2) + "\n");
  return { archivePath, runId: receipt.runId, receiptDigest: evidence.receiptDigest, startedAt, endedAt };
}

export function parseFrozenRunCommand(argv: readonly string[]) {
  if (argv.length !== 2 || (argv[0] !== "freeze" && argv[0] !== "run") || !path.isAbsolute(argv[1]!)) {
    throw new Error("Usage: frozen-run.mts freeze|run /absolute/request.json");
  }
  return { command: argv[0], requestPath: argv[1]! };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { command, requestPath } = parseFrozenRunCommand(process.argv.slice(2));
  const request = JSON.parse(await readFile(requestPath, "utf8"));
  const result = command === "freeze" ? await freezeFirstPlan(request) : await runFrozenMode(request);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
