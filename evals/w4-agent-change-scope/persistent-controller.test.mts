import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { test } from "node:test";

test("controller command parser allowlists exact operations and rejects mode injection", async () => {
  const { parseControllerCommand } = await import("./persistent-controller.mts");
  assert.deepEqual(parseControllerCommand('{"command":"status"}'), { command: "status" });
  assert.deepEqual(parseControllerCommand('{"command":"setMode","mode":"mapped_broken"}'), { command: "setMode", mode: "mapped_broken" });
  assert.deepEqual(parseControllerCommand('{"command":"close"}'), { command: "close" });
  for (const raw of [
    '{"command":"setMode","mode":"other"}',
    '{"command":"setMode","mode":"mapped_broken","baseUrl":"http://example.invalid"}',
    '{"command":"status","mode":"mapped_broken"}',
    '{"command":"restart"}',
    '{"command":"setMode"}',
    '{"command":"setMode","mode":"healthy","candidateRevision":"v1"}',
    '{broken json}',
  ]) assert.throws(() => parseControllerCommand(raw));
});

test("invalid mode or dead origin cannot switch controller state", async () => {
  const { handleControllerCommand } = await import("./persistent-controller.mts");
  const calls: string[] = [];
  const fake = { baseUrl: "http://127.0.0.1:1/", setWorldMode: (mode: string) => calls.push(mode), close: async () => undefined };
  const state = { mode: "healthy" as const, closed: false };
  await assert.rejects(handleControllerCommand(fake, state, '{"command":"setMode","mode":"other"}', async () => ({ candidateRevision: "v2" })));
  await assert.rejects(handleControllerCommand(fake, state, '{"command":"setMode","mode":"mapped_broken"}', async () => { throw new Error("origin unavailable"); }), /origin unavailable/);
  assert.deepEqual(calls, []);
  assert.equal(state.mode, "healthy");
});

test("post-switch origin failure closes the attempt and refuses further commands", async () => {
  const { handleControllerCommand } = await import("./persistent-controller.mts");
  let closed = 0;
  let probes = 0;
  const state = { mode: "healthy" as "healthy" | "mapped_broken" | "unmapped_broken", closed: false };
  const fake = { baseUrl: "http://127.0.0.1:1/", setWorldMode: (_mode: string) => undefined, close: async () => { closed += 1; } };
  const probe = async () => { probes += 1; if (probes === 2) throw new Error("origin lost after switch"); return { candidateRevision: "v2" }; };
  await assert.rejects(handleControllerCommand(fake, state, '{"command":"setMode","mode":"mapped_broken"}', probe), /origin lost after switch/);
  assert.equal(state.closed, true);
  assert.equal(closed, 1);
  await assert.rejects(handleControllerCommand(fake, state, '{"command":"status"}', probe), /closed/);
});

test("persistent controller keeps one live origin through switches and closes with a body-complete journal", { timeout: 240_000 }, async (t) => {
  const sourceRoot = path.resolve(import.meta.dirname, "../..");
  const child = spawn(process.execPath, ["--import", path.join(sourceRoot, "components/console/node_modules/tsx/dist/loader.mjs"), path.join(import.meta.dirname, "persistent-controller.mts")], {
    cwd: sourceRoot,
    env: { ...process.env, QA_STARTER_REPO: path.join(sourceRoot, "components/kernel") },
    stdio: ["pipe", "pipe", "pipe"],
  });
  t.after(() => { if (child.exitCode === null) child.kill("SIGTERM"); });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const lines: string[] = [];
  const waiters: Array<(line: string) => void> = [];
  createInterface({ input: child.stdout }).on("line", (line) => {
    const waiter = waiters.shift();
    if (waiter) waiter(line); else lines.push(line);
  });
  const next = (timeoutMs = 20_000) => new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Controller response timed out; stderr: ${stderr}`)), timeoutMs);
    const onExit = (code: number | null) => {
      clearTimeout(timer);
      reject(new Error(`Controller exited before response (${code}); stderr: ${stderr}`));
    };
    const deliver = (line: string) => {
      clearTimeout(timer);
      child.off("exit", onExit);
      try { resolve(JSON.parse(line)); } catch (error) { reject(error); }
    };
    if (lines.length) deliver(lines.shift()!);
    else if (child.exitCode !== null) onExit(child.exitCode);
    else { child.once("exit", onExit); waiters.push(deliver); }
  });
  const send = async (command: unknown) => {
    child.stdin.write(JSON.stringify(command) + "\n");
    return next();
  };

  const ready = await next(180_000);
  assert.equal(ready.event, "ready");
  assert.equal(new URL(ready.baseUrl).hostname, "127.0.0.1");
  assert.equal(ready.actorPacketPaths.length, 2);
  assert.notEqual(ready.actorPacketPaths[0], ready.actorPacketPaths[1]);
  const origin = ready.baseUrl;
  assert.deepEqual(await send({ command: "status" }), { event: "status", baseUrl: origin, candidateRevision: "v2", mode: "healthy", alive: true });
  const baseline = await fetch(new URL("/api/catalog-integrity", origin));
  assert.deepEqual(await baseline.json(), { unlabeledItemCount: 0 });
  const refused = await send({ command: "setMode", mode: "other" });
  assert.equal(refused.event, "error");
  assert.deepEqual(await send({ command: "status" }), { event: "status", baseUrl: origin, candidateRevision: "v2", mode: "healthy", alive: true });
  assert.deepEqual(await send({ command: "setMode", mode: "mapped_broken" }), { event: "status", baseUrl: origin, candidateRevision: "v2", mode: "mapped_broken", alive: true });
  assert.deepEqual(await (await fetch(new URL("/api/catalog-integrity", origin))).json(), { unlabeledItemCount: 1 });
  assert.deepEqual(await send({ command: "setMode", mode: "unmapped_broken" }), { event: "status", baseUrl: origin, candidateRevision: "v2", mode: "unmapped_broken", alive: true });
  assert.deepEqual(await (await fetch(new URL("/api/catalog-publication", origin))).json(), { staleItemCount: 1 });
  assert.deepEqual(await send({ command: "setMode", mode: "healthy" }), { event: "status", baseUrl: origin, candidateRevision: "v2", mode: "healthy", alive: true });
  assert.deepEqual(await (await fetch(new URL("/api/catalog-publication", origin))).json(), { staleItemCount: 0 });
  const closed = await send({ command: "close" });
  assert.equal(closed.event, "closed");
  assert.equal(closed.baseUrl, origin);
  assert.equal(closed.journalPath, ready.journalPath);
  const exitCode = child.exitCode !== null ? child.exitCode : await new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Controller did not exit after close; stderr: ${stderr}`)), 10_000);
    child.once("exit", (code) => { clearTimeout(timer); resolve(code); });
  });
  assert.equal(exitCode, 0, stderr);
  const journal = JSON.parse(await readFile(ready.journalPath, "utf8"));
  assert.ok(journal.length >= 9);
  assert.ok(journal.every((hit: any) => hit.status === 200 && hit.body !== undefined && !Number.isNaN(Date.parse(hit.timestamp))));
  assert.deepEqual(journal.filter((hit: any) => hit.path === "/api/catalog-integrity").map((hit: any) => [hit.worldMode, hit.body.unlabeledItemCount]), [["healthy", 0], ["mapped_broken", 1]]);
  assert.deepEqual(journal.filter((hit: any) => hit.path === "/api/catalog-publication").map((hit: any) => [hit.worldMode, hit.body.staleItemCount]), [["unmapped_broken", 1], ["healthy", 0]]);
  await assert.rejects(fetch(new URL("/api/environment", origin)));
});
