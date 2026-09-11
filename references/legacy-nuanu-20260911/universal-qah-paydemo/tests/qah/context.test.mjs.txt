import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveContext } from "../../scripts/qah/context.mjs";

const allowedOrigin = "https://github.com/solomindanil/NuanuFlowQA.git";

async function fixture(name) {
  return JSON.parse(await readFile(new URL(`./fixtures/context-${name}.json`, import.meta.url), "utf8"));
}

test("normalizes labels and references while retaining only pinned context", async () => {
  const input = await fixture("ui");
  input.labels = ["Frontend", "ui"];
  const context = resolveContext(input, { allowed_origin: allowedOrigin });
  assert.deepEqual(Object.keys(context.source_artifact).sort(), ["artifact_id", "kind", "role", "version_id"]);
  assert.deepEqual(context.labels, ["frontend", "ui"]);
  assert.deepEqual(context.wiki_artifacts, [{ id: "wiki-paydemo", version: 3, sha256: `sha256:${"d".repeat(64)}` }]);
  assert.equal("wiki_text" in context, false);
  assert.equal("commands" in context, false);
});

test("rejects repository drift, traversal, duplicate paths, and free-form commands", async () => {
  const input = await fixture("api");
  await assert.rejects(Promise.resolve().then(() => resolveContext({ ...input, repository_origin: "https://github.com/other/repo.git" }, { allowed_origin: allowedOrigin })), /repository origin/);
  await assert.rejects(Promise.resolve().then(() => resolveContext({ ...input, changed_files: ["../server.mjs"] }, { allowed_origin: allowedOrigin })), /traversal/);
  await assert.rejects(Promise.resolve().then(() => resolveContext({ ...input, changed_files: ["apps/paydemo/server.mjs", "apps/paydemo/server.mjs"] }, { allowed_origin: allowedOrigin })), /unique/);
  await assert.rejects(Promise.resolve().then(() => resolveContext({ ...input, commands: ["npm test"] }, { allowed_origin: allowedOrigin })), /unknown commands/);
});
