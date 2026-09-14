import { mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerAuthoredFixture } from "../../components/console/tests/fixtures/nuanu-readonly/fixture.ts";
import { startMixedHandoffFixture } from "./fixture.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Eval preparation only. The fresh agent owns test design, publication and runs.
export async function startMixedHandoffExercise() {
  const root = await mkdtemp(path.join(await realpath(os.tmpdir()), "qa-mixed-agent-"));
  const server = await startMixedHandoffFixture();
  try {
    const baseUrl = new URL(server.baseUrl).href;
    const briefBytes = await readFile(new URL("./product-brief.md", import.meta.url));
    const registration = await registerAuthoredFixture(baseUrl, root, {
      productSlug: "relay-mixed-retest",
      name: "Relay controlled ticket retest",
      description: "Owned synthetic read-only VPN, numbers and card ticket projections; no payment or database execution.",
      surfaces: [{ kind: "api", name: "Public ticket evidence API" }, { kind: "web", name: "Numbers page" }],
      journeys: [
        { name: "QA-701 Original VPN replacement evidence", expectedOutcome: "Original op-vpn-17 public projection:30days, exactly one reservation-assignment link, original records preserved; no SQL/concurrency claim." },
        { name: "QA-702 Supported number renewal", expectedOutcome: "A renewal quote is offered only when the matching number provider supports renewal." },
        { name: "QA-703 PostgreSQL fee persistence", expectedOutcome: "One qualifying event persists exactly one fee row in PostgreSQL; replay preserves amount and count; database capability missing." },
        { name: "QA-704 Masked card API", expectedOutcome: "Only last4 digits, no full PAN or security code in the complete API response; no UI criterion." },
        { name: "QA-705 Original payment history", expectedOutcome: "Original seeded op-vpn-17 appears once, amount12 TEST, completed; no new payment." },
        { name: "QA-706 Original financial chain", expectedOutcome: "Original treasury, settlement and card credit link and reconcile with one fee; original chain evidence missing." },
        { name: "QA-707 Empty numbers UI", expectedOutcome: "Rendered Numbers page shows No numbers yet and zero number cards." },
      ],
      authoredJourneyName: "QA-702 Supported number renewal",
    });
    const briefPath = path.join(root, "product-brief.md");
    await writeFile(briefPath, briefBytes, { flag: "wx", mode: 0o600 });
    const packet = {
      sourceRoot, consolePath: path.join(sourceRoot, "components/console"),
      kernelPath: path.join(sourceRoot, "components/kernel"), exerciseRoot: root,
      workspacePath: registration.workspacePath, storeRoot: registration.storeRoot,
      productSlug: "relay-mixed-retest", baseUrl, briefPath,
    };
    const packetPath = path.join(root, "actor-context.json");
    await writeFile(packetPath, JSON.stringify(packet, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    return { ...packet, packetPath, registration, server };
  } catch (error) {
    await server.close();
    throw new Error("Mixed exercise preparation failed; evidence retained at " + root, { cause: error });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exercise = await startMixedHandoffExercise();
  // Controller-only local signal; deliberately no HTTP mutation/control endpoint.
  process.on("SIGUSR2", () => {
    exercise.server.enableOriginalEvidence();
    console.log(JSON.stringify({ status: "original_evidence_enabled", pid: process.pid }));
  });
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await exercise.server.close();
    const journalPath = path.join(exercise.exerciseRoot, "controller-http-journal.json");
    await writeFile(journalPath, JSON.stringify(exercise.server.hits, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    console.log(JSON.stringify({ status: "stopped", journalPath }));
  };
  process.once("SIGINT", () => void stop().catch(error => { console.error(error); process.exitCode = 1; }));
  process.once("SIGTERM", () => void stop().catch(error => { console.error(error); process.exitCode = 1; }));
  console.log(JSON.stringify({ status: "ready", pid: process.pid, packetPath: exercise.packetPath, baseUrl: exercise.baseUrl }));
}
