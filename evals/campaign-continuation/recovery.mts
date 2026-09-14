import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { mkdtemp, mkdir, realpath, readFile, readdir, lstat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { registerContinuationWorkspace } from "./registered-fixture.mts";
import { createContinuationTarget } from "../../components/console/tests/unit/fixtures/campaign-continuation-target.ts";
import { createRegisteredCampaignContinuationHost } from "../../components/console/scripts/qa-campaign.ts";
import type { OwnedContinuationWorker } from "../../components/console/src/node/campaign-continuation-owner.ts";
import type { CampaignContinuationSnapshot } from "../../components/console/src/node/qa-campaign-continuation.ts";
// @ts-expect-error The actual versioned reader is plain ESM.
import { readCampaignContinuation } from "../../components/console/server/campaign-continuation-reader.mjs";

const exec = promisify(execFile);
const consoleRoot = fileURLToPath(new URL("../../components/console", import.meta.url));
const kernelRoot = fileURLToPath(new URL("../../components/kernel", import.meta.url));
const hash = (bytes: Buffer) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const gitHead = (cwd: string) => execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();

function capture(worker: OwnedContinuationWorker) {
  const checked = () => {
    const output = worker.readOutput();
    assert.equal(output.truncated, false, "Bounded worker output was truncated; no CLI completion claim");
    return output;
  };
  return { stdout: () => checked().stdout, stderr: () => checked().stderr };
}

function deadline<T>(pending: Promise<T>, label: string, milliseconds = 180_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Qualification deadline awaiting ${label}`)), milliseconds);
    pending.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

// This is a qualification barrier, not a product timeout or takeover proof.
async function waitForHeldRequest(target: Awaited<ReturnType<typeof createContinuationTarget>>,
  worker: OwnedContinuationWorker, diagnostic: ReturnType<typeof capture>) {
  const controller = new AbortController();
  const stopped = worker.closed.then(result => {
    throw new Error(`Worker stopped before B was held: ${JSON.stringify(result)} ${diagnostic.stderr()}`);
  });
  const waiting = (async () => {
    const until = Date.now() + 180_000;
    while (target.pendingBCount() !== 1) {
      if (Date.now() > until) throw new Error(`No held B within qualification deadline: ${diagnostic.stderr()}`);
      await pause(50, undefined, { signal: controller.signal });
    }
  })();
  try { await Promise.race([waiting, stopped]); } finally { controller.abort(); }
}

async function freshStatus(workspacePath: string, runId: string) {
  const result = await exec(process.execPath,
    ["--import", path.join(consoleRoot, "node_modules/tsx/dist/loader.mjs"),
      path.join(consoleRoot, "scripts/qa-campaign.ts"), "status", "--workspace", workspacePath, "--run-id", runId],
    { cwd: consoleRoot, env: { TSX_DISABLE_CACHE: "1", QA_STARTER_REPO: kernelRoot }, timeout: 30_000, maxBuffer: 16 * 1024 * 1024 });
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}

async function filesBelow(root: string): Promise<Record<string, { hash: string; mtimeMs: number; mode: number }>> {
  const captured: Record<string, { hash: string; mtimeMs: number; mode: number }> = {};
  async function visit(relative: string) {
    for (const name of (await readdir(path.join(root, relative))).sort()) {
      const child = path.join(relative, name), absolute = path.join(root, child), stats = await lstat(absolute);
      assert.equal(stats.isSymbolicLink(), false);
      if (stats.isDirectory()) await visit(child);
      else {
        assert.ok(stats.isFile() && stats.size < 16 * 1024 * 1024);
        captured[child] = { hash: hash(await readFile(absolute)), mtimeMs: stats.mtimeMs, mode: stats.mode & 0o777 };
      }
    }
  }
  await visit("");
  return captured;
}

function ownedGroup(worker: OwnedContinuationWorker) {
  assert.ok(worker.child.pid);
  const output = execFileSync("ps", ["-axo", "pid=,ppid=,pgid=,comm="], { encoding: "utf8", timeout: 5_000 });
  return output.trim().split("\n").map(line => line.trim().split(/\s+/)).filter(row => Number(row[2]) === worker.child.pid)
    .map(([pid, ppid, pgid, ...command]) => ({ pid: Number(pid), ppid: Number(ppid), pgid: Number(pgid), command: command.join(" ") }));
}

// Controlled loss of the real host's successful start reply: publication and
// readback have finished, but the actual CLI cannot invoke its adapter yet.
// No fabricated start, death receipt, new runtime hook, or product permission.
function holdStartReply(worker: OwnedContinuationWorker, checkId: string) {
  let requestId: number | undefined;
  let resolve!: () => void;
  const ready = new Promise<void>(done => { resolve = done; });
  const child = worker.child, nativeSend = child.send;
  const observe = (message: any) => {
    if (message?.type === 'qa-continuation-session.v1' && message.operation === 'publication'
      && message.payload?.operation === 'start' && message.payload.checkId === checkId) requestId = message.id;
  };
  child.on('message', observe);
  child.send = ((message: any, ...args: any[]) => {
    if (message?.type === 'qa-continuation-session.v1' && requestId !== undefined
      && message.id === requestId && message.ok === true && typeof message.value?.executionId === 'string'
      && typeof message.value?.outputDirectory === 'string') { resolve(); return true; }
    return (nativeSend as Function).call(child, message, ...args);
  }) as typeof child.send;
  return { ready, restore() { child.send = nativeSend; child.off('message', observe); } };
}

// Catches duplicate A dispatch, lost uncertainty/retry/blocker scope, invented
// terminal PASS, and accepted evidence rewritten by a new worker generation.
for (const { brokenC, preDispatch } of [{ brokenC: false, preDispatch: false },
  { brokenC: true, preDispatch: false }, { brokenC: false, preDispatch: true }]) {
  test(`registered CLI SIGKILL then remaining-only resume (${preDispatch ? "before adapter dispatch" : brokenC ? "seeded C failure" : "healthy checks"})`,
    { timeout: 600_000 }, async t => {
      assert.equal(process.env.QA_STARTER_REPO, kernelRoot, "Use the explicit paired candidate Kernel");
      const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "qa-continuation-recovery-")));
      t.diagnostic(`retained recovery: ${root}`);
      process.stdout.write(`QA_CONTINUATION_EVIDENCE_ROOT ${root}\n`);
      const target = await createContinuationTarget({ holdB: true, brokenC });
      let host: Awaited<ReturnType<typeof createRegisteredCampaignContinuationHost>> | undefined;
      let restoreReply = () => {};
      let primaryFailure: unknown;
      const report: Record<string, unknown> = { schemaVersion: "qa-continuation-qualification.v1", brokenC, preDispatch,
        executionClass: "owned-local-registered-cli", node: process.version, executable: process.execPath,
        sources: { console: gitHead(consoleRoot), kernel: gitHead(kernelRoot) }, root, phase: "setup" };
      try {
        const registered = await registerContinuationWorkspace(target, root);
        const storeRoot = path.join(root, "private-executions");
        const approvalStoreRoot = path.join(root, "oracle-approvals");
        await mkdir(storeRoot, { mode: 0o700 }); await mkdir(approvalStoreRoot, { mode: 0o700 });
        const { workspacePath, planPath, plan } = registered;
        host = await createRegisteredCampaignContinuationHost({ workspacePath, storeRoot, planPath, approvalStoreRoot,
          starterRepo: kernelRoot, fixture: { origin: target.baseUrl, identityUrl: target.identityUrl,
            targetIdentity: target.targetIdentity, repeatSafePaths: target.repeatSafePaths } });
        const runId = host.runId, tree = { workspacePath, runId };
        const runRoot = path.join(workspacePath, "tests/campaign-runs", runId);
        Object.assign(report, { workspacePath, storeRoot, runId, planPath, targetIdentity: target.targetIdentity, phase: "launched" });
        const first = await host.launch({ runId }), firstOutput = capture(first);
        if (preDispatch) {
          const held = holdStartReply(first, plan.checks[1]!.checkId); restoreReply = held.restore;
          await deadline(Promise.race([held.ready, first.closed.then(result => {
            throw new Error(`CLI closed before durable-start reply: ${JSON.stringify(result)} ${firstOutput.stderr()}`);
          })]), 'durable start before adapter dispatch');
          assert.deepEqual({ A: target.counters().A, B: target.counters().B, C: target.counters().C }, { A: 1, B: 0, C: 0 });
        } else await waitForHeldRequest(target, first, firstOutput);
        const partial = await readCampaignContinuation(tree) as CampaignContinuationSnapshot;
        assert.equal(partial.phase, "partial"); assert.equal(partial.receipt, null);
        assert.deepEqual(partial.progress.checks.map(check => [check.state, check.nextAttempt]),
          [["finalized", null], ["uncertain", 1], ["unstarted", 1]]);
        assert.deepEqual(partial.run.plan.blockers, plan.blockers);
        const aExecution = partial.progress.checks[0]!.acceptedExecutionIds[0]!;
        const aFiles = partial.sealingInventory.files.filter(file => file.path.includes(`/execution-${aExecution}/`));
        assert.equal(aFiles.length, 4);
        const acceptedBefore = Object.fromEntries(await Promise.all(aFiles.map(async file => {
          const absolute = path.join(runRoot, file.path), stats = await lstat(absolute);
          return [file.path, { hash: hash(await readFile(absolute)), mtimeMs: stats.mtimeMs }];
        })));
        const uncertainB = partial.progress.checks[1]!.uncertainExecutionIds[0]!;
        const privateB = (await readdir(storeRoot)).filter(name => name.startsWith(`work-${uncertainB}-`));
        assert.equal(privateB.length, 1);
        const privateRoot = path.join(storeRoot, privateB[0]!);
        const groupBefore = ownedGroup(first);
        assert.ok(groupBefore.some(process => process.pid === first.child.pid));
        // Signal ONLY the original ChildProcess. Never kill by a saved/reused PID.
        assert.equal(first.child.kill("SIGKILL"), true);
        const firstClosed = await deadline(first.closed, "original owned worker close", 15_000);
        restoreReply();
        assert.equal(firstClosed.signal, "SIGKILL");
        assert.deepEqual(ownedGroup(first), [], "Known helper group must drain before takeover");
        const privateBefore = await filesBelow(privateRoot);
        const status = await freshStatus(workspacePath, runId);
        assert.equal(status.phase, "partial"); assert.equal(status.receipt, null);
        assert.deepEqual(status.progress, partial.progress);
        const validationPartial = await registered.fixture.kernel.validateWorkspace(workspacePath, registered.fixture.workspaceDependencies);
        assert.equal(validationPartial.valid, true);
        assert.equal(validationPartial.privateStateDigest, registered.validation.privateStateDigest);
        assert.equal(validationPartial.publicationAuthorityDigest, registered.validation.publicationAuthorityDigest);
        Object.assign(report, { phase: "interrupted", before: { counters: target.counters(), accepted: acceptedBefore,
          privateFiles: privateBefore, group: groupBefore }, firstClosed, freshStatus: status, validationPartial });
        await writeFile(path.join(root, "REPORT.json"), JSON.stringify(report, null, 2), { mode: 0o600 });
        if (!brokenC && !preDispatch && process.env.QA_CONTINUATION_FRESH_AGENT === "1") {
          // Optional reasoning-eval pause outside managed evidence. This marker
          // only resumes this owned test driver; it proves neither death nor
          // dispatch authority. The real live host still admits the successor.
          const marker = path.join(root, "FRESH-AGENT-REVIEWED");
          t.diagnostic(`fresh-agent checkpoint: ${workspacePath} ${runId}; release marker ${marker}`);
          process.stdout.write(`QA_CONTINUATION_AGENT_CHECKPOINT ${JSON.stringify({ workspacePath, runId, marker })}\n`);
          const until = Date.now() + 180_000;
          for (;;) {
            try {
              const stat = await lstat(marker);
              assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size === 6);
              assert.equal(await readFile(marker, "utf8"), "ready\n");
              break;
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
              if (Date.now() > until) throw new Error("Fresh-agent evaluation pause expired; checkpoint retained");
              await pause(200);
            }
          }
        }
        target.releaseB();
        const second = await host.resume({ runId }), secondOutput = capture(second);
        const secondClosed = await deadline(second.closed, "resumed CLI completion");
        // Retained blocked targets keep even healthy executed checks non-PASS.
        assert.equal(secondClosed.exitCode, 1, secondOutput.stderr()); assert.equal(secondClosed.signal, null);
        assert.equal(secondOutput.stderr(), "");
        const final = await readCampaignContinuation(tree) as CampaignContinuationSnapshot;
        assert.equal(final.phase, "terminal"); assert.ok(final.receipt);
        assert.equal(JSON.parse(secondOutput.stdout()).phase, "terminal");
        assert.deepEqual(JSON.parse(secondOutput.stdout()).receipt, final.receipt);
        assert.deepEqual(final.receipt.checks.map(check => check.status), brokenC ? ["pass", "pass", "needs_review"] : ["pass", "pass", "pass"]);
        assert.equal(final.receipt.verdict, brokenC ? "INCONCLUSIVE" : "NEEDS_HUMAN");
        assert.deepEqual(final.receipt.blockedTargets, plan.blockers);
        assert.deepEqual(final.receipt.interruptedExecutionIds, [uncertainB]);
        assert.deepEqual({ A: target.counters().A, B: target.counters().B, C: target.counters().C },
          { A: 1, B: preDispatch ? 1 : 2, C: brokenC ? 2 : 1 });
        assert.equal(target.counters().rejected, 0);
        for (const [relative, before] of Object.entries(acceptedBefore)) {
          const absolute = path.join(runRoot, relative);
          assert.deepEqual({ hash: hash(await readFile(absolute)), mtimeMs: (await lstat(absolute)).mtimeMs }, before);
        }
        assert.deepEqual(await filesBelow(privateRoot), privateBefore);
        const finalFiles = await filesBelow(runRoot), finalCounts = target.counters();
        const repeated = await host.resume({ runId }), repeatedOutput = capture(repeated);
        assert.equal((await deadline(repeated.closed, "terminal repeat completion", 30_000)).exitCode, 1);
        assert.equal(repeatedOutput.stderr(), "");
        assert.deepEqual(JSON.parse(repeatedOutput.stdout()).receipt, final.receipt);
        assert.deepEqual(target.counters(), finalCounts, "Terminal repeat must not even probe target identity");
        assert.deepEqual(await filesBelow(runRoot), finalFiles);
        const validationFinal = await registered.fixture.kernel.validateWorkspace(workspacePath, registered.fixture.workspaceDependencies);
        assert.equal(validationFinal.valid, true);
        assert.equal(validationFinal.privateStateDigest, registered.validation.privateStateDigest);
        assert.equal(validationFinal.publicationAuthorityDigest, registered.validation.publicationAuthorityDigest);
        Object.assign(report, { phase: "qualified", secondClosed, finalCounts, finalReceipt: final.receipt,
          finalFiles, validationFinal, coverageClaim: "Owned API worker interruption only; retained blockers are not tested." });
      } catch (error) {
        primaryFailure = error;
        Object.assign(report, { phase: "failed", error: error instanceof Error ? error.message : String(error) });
        throw error;
      } finally {
        restoreReply();
        const finalized = await Promise.allSettled([host?.close(), target.close()]);
        report.finalization = finalized.map(result => result.status === "fulfilled" ? "closed" : String(result.reason));
        const cleanupFailures = finalized.flatMap(result => result.status === "rejected" ? [result.reason] : []);
        if (cleanupFailures.length) report.phase = "failed";
        await writeFile(path.join(root, "REPORT.json"), JSON.stringify(report, null, 2), { mode: 0o600 });
        if (cleanupFailures.length) throw new AggregateError(
          [...(primaryFailure === undefined ? [] : [primaryFailure]), ...cleanupFailures],
          "Qualification and/or owned resource finalization failed; see retained REPORT.json");
      }
    });
}
