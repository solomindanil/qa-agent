import assert from "node:assert/strict";
import { test } from "node:test";

async function loadFixture() {
  try {
    return await import("./fixture.mjs");
  } catch {
    return {};
  }
}

async function readJson(baseUrl, route, init) {
  const response = await fetch(new URL(route, baseUrl), init);
  return { response, body: await response.json() };
}

test("serves deterministic healthy and independently defective catalog facts", async () => {
  const { startGraphConsumerFixture } = await loadFixture();
  assert.equal(
    typeof startGraphConsumerFixture,
    "function",
    "the bounded graph-consumer fixture must be implemented",
  );
  const fixture = await startGraphConsumerFixture();
  try {
    const first = await readJson(fixture.baseUrl, "/api/catalog?sample=first");
    const second = await readJson(fixture.baseUrl, "/api/catalog?sample=second");
    const integrity = await readJson(fixture.baseUrl, "/api/catalog-integrity");

    assert.equal(first.response.status, 200);
    assert.deepEqual(first.body, {
      catalogName: "Stage Four",
      ready: true,
      entries: [
        { id: "item-labeled", displayLabel: "Linen basket" },
        { id: "item-unlabeled", displayLabel: "" },
      ],
    });
    assert.deepEqual(second.body, first.body);
    assert.equal(integrity.response.status, 200);
    assert.deepEqual(integrity.body, {
      invariantSatisfied: false,
      unlabeledItemCount: 1,
    });
  } finally {
    await fixture.close();
  }
});

test("allows GET only, records real requests, and stops without erasing its journal", async () => {
  const { startGraphConsumerFixture } = await loadFixture();
  assert.equal(
    typeof startGraphConsumerFixture,
    "function",
    "the bounded graph-consumer fixture must be implemented",
  );
  const fixture = await startGraphConsumerFixture();
  let closed = false;
  try {
    const post = await readJson(fixture.baseUrl, "/api/catalog", { method: "POST" });
    const missing = await readJson(fixture.baseUrl, "/missing");
    const favicon = await fetch(new URL("/favicon.ico", fixture.baseUrl));

    assert.equal(post.response.status, 405);
    assert.deepEqual(post.body, { error: "method_not_allowed" });
    assert.equal(missing.response.status, 404);
    assert.deepEqual(missing.body, { error: "not_found" });
    assert.equal(favicon.status, 204);
    assert.deepEqual(fixture.hits, [
      { method: "POST", path: "/api/catalog" },
      { method: "GET", path: "/missing" },
      { method: "GET", path: "/favicon.ico" },
    ]);

    await fixture.close();
    closed = true;
  } finally {
    if (!closed) await fixture.close();
  }
  assert.deepEqual(fixture.hits, [
    { method: "POST", path: "/api/catalog" },
    { method: "GET", path: "/missing" },
    { method: "GET", path: "/favicon.ico" },
  ]);
  await assert.rejects(fetch(new URL("/api/catalog", fixture.baseUrl)));
});
