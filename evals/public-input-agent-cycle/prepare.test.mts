import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { startPublicAgentExercise } from "./prepare.mts";

// Failure caught: exercise setup supplies an unregistered/wrong target or seeds
// an authored campaign, making later "agent-chosen" execution untrustworthy.
test("preparation retains a real registered workspace without authoring a campaign", { timeout: 120_000 }, async () => {
  const exercise = await startPublicAgentExercise();
  try {
    const packet = JSON.parse(await readFile(exercise.packetPath, "utf8"));
    const response = await fetch(packet.targetUrl);
    assert.equal(response.status, 200);
    assert.equal(new URL(packet.targetUrl).hostname, "127.0.0.1");
    assert.equal(packet.targetUrl, new URL("catalog", exercise.registration.baseUrl).href,
      "The packet must point at the exact registered exercise route, not another healthy page");
    const validation = await exercise.registration.kernel.validateWorkspace(
      packet.workspacePath, exercise.registration.workspaceDependencies);
    assert.equal(validation.valid, true);
    assert.equal(validation.publicationAuthorityDigest, exercise.registration.authority.semanticDigest);
    assert.equal(packet.baseUrl, exercise.registration.baseUrl);
    await assert.rejects(access(path.join(packet.workspacePath, "tests/qa-campaign.v0.json")),
      { code: "ENOENT" }, "Preparation must not supply the actor a prewritten plan");
    assert.ok((await readFile(packet.briefPath, "utf8")).length > 0);
  } finally { await exercise.close(); }
  await assert.rejects(fetch(exercise.targetUrl), "The actor target must close when its owner stops it");
});
