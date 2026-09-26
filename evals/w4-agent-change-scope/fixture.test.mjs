import assert from "node:assert/strict";
import { test } from "node:test";

async function startFixture() {
  let startW4AgentChangeScopeFixture;
  try {
    ({ startW4AgentChangeScopeFixture } = await import("./fixture.mjs"));
  } catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
  }
  assert.equal(typeof startW4AgentChangeScopeFixture, "function", "W4 fixture must be implemented");
  return startW4AgentChangeScopeFixture();
}

async function getJson(baseUrl, path, init) {
  const response = await fetch(new URL(path, baseUrl), init);
  return { status: response.status, body: await response.json() };
}

function journalWithoutPayload(fixture) {
  return fixture.getJournal().map(({ body: _body, timestamp: _timestamp, ...entry }) => entry);
}

test("one loopback origin survives revision and world switches", async () => {
  const fixture = await startFixture();
  try {
    const origin = new URL(fixture.baseUrl);
    assert.equal(origin.hostname, "127.0.0.1");
    assert.ok(Number(origin.port) > 0);

    for (const mode of ["healthy", "mapped_broken", "unmapped_broken"]) {
      fixture.setWorldMode(mode);
      for (const revision of ["v1", "v2"]) {
        fixture.setCandidateRevision(revision);
        assert.equal(fixture.baseUrl, origin.href);
        assert.deepEqual(await getJson(fixture.baseUrl, "/api/environment"), {
          status: 200,
          body: { candidateRevision: revision },
        });
      }
    }
  } finally {
    await fixture.close();
  }
});

test("healthy GET routes exactly match the frozen source contract", async () => {
  const fixture = await startFixture();
  try {
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/environment"), {
      status: 200,
      body: { candidateRevision: "v1" },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog"), {
      status: 200,
      body: { catalogName: "Cedar", ready: true },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-integrity"), {
      status: 200,
      body: { unlabeledItemCount: 0 },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-publication"), {
      status: 200,
      body: { staleItemCount: 0 },
    });
  } finally {
    await fixture.close();
  }
});

test("mapped break changes only B's promised JSON field", async () => {
  const fixture = await startFixture();
  try {
    fixture.setCandidateRevision("v2");
    fixture.setWorldMode("mapped_broken");
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/environment"), {
      status: 200,
      body: { candidateRevision: "v2" },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog"), {
      status: 200,
      body: { catalogName: "Cedar", ready: true },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-integrity"), {
      status: 200,
      body: { unlabeledItemCount: 1 },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-publication"), {
      status: 200,
      body: { staleItemCount: 0 },
    });
  } finally {
    await fixture.close();
  }
});

test("unmapped break changes only C's promised JSON field", async () => {
  const fixture = await startFixture();
  try {
    fixture.setCandidateRevision("v2");
    fixture.setWorldMode("unmapped_broken");
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/environment"), {
      status: 200,
      body: { candidateRevision: "v2" },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog"), {
      status: 200,
      body: { catalogName: "Cedar", ready: true },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-integrity"), {
      status: 200,
      body: { unlabeledItemCount: 0 },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-publication"), {
      status: 200,
      body: { staleItemCount: 1 },
    });
  } finally {
    await fixture.close();
  }
});

test("v1 A observation precedes an actual v2 environment identity GET", async () => {
  const fixture = await startFixture();
  try {
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog"), {
      status: 200,
      body: { catalogName: "Cedar", ready: true },
    });
    fixture.setCandidateRevision("v2");
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/environment"), {
      status: 200,
      body: { candidateRevision: "v2" },
    });
    assert.deepEqual(journalWithoutPayload(fixture), [
      { method: "GET", path: "/api/catalog", status: 200, candidateRevision: "v1", worldMode: "healthy" },
      { method: "GET", path: "/api/environment", status: 200, candidateRevision: "v2", worldMode: "healthy" },
    ]);
  } finally {
    await fixture.close();
  }
});

test("unsupported methods and paths are refused without changing controls", async () => {
  const fixture = await startFixture();
  try {
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog", { method: "POST" }), {
      status: 405,
      body: { error: "method_not_allowed" },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog?alternate=1"), {
      status: 404,
      body: { error: "not_found" },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/control/world-mode"), {
      status: 404,
      body: { error: "not_found" },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/favicon.ico"), {
      status: 404,
      body: { error: "not_found" },
    });
    assert.throws(() => fixture.setCandidateRevision("v3"), /unsupported candidate revision/i);
    assert.throws(() => fixture.setWorldMode("other"), /unsupported world mode/i);
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/environment"), {
      status: 200,
      body: { candidateRevision: "v1" },
    });
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-integrity"), {
      status: 200,
      body: { unlabeledItemCount: 0 },
    });
    assert.deepEqual(journalWithoutPayload(fixture), [
      { method: "POST", path: "/api/catalog", status: 405, candidateRevision: "v1", worldMode: "healthy" },
      { method: "GET", path: "/api/catalog?alternate=1", status: 404, candidateRevision: "v1", worldMode: "healthy" },
      { method: "GET", path: "/control/world-mode", status: 404, candidateRevision: "v1", worldMode: "healthy" },
      { method: "GET", path: "/favicon.ico", status: 404, candidateRevision: "v1", worldMode: "healthy" },
      { method: "GET", path: "/api/environment", status: 200, candidateRevision: "v1", worldMode: "healthy" },
      { method: "GET", path: "/api/catalog-integrity", status: 200, candidateRevision: "v1", worldMode: "healthy" },
    ]);
  } finally {
    await fixture.close();
  }
});

test("journal is a read-only snapshot and close is idempotent", async (t) => {
  const fixture = await startFixture();
  t.after(() => fixture.close());
  await getJson(fixture.baseUrl, "/api/catalog");
  const snapshot = fixture.getJournal();
  snapshot[0].path = "/forged";
  snapshot.push({ method: "GET", path: "/forged" });
  assert.deepEqual(journalWithoutPayload(fixture), [
    { method: "GET", path: "/api/catalog", status: 200, candidateRevision: "v1", worldMode: "healthy" },
  ]);
  await fixture.close();
  await fixture.close();
  assert.deepEqual(journalWithoutPayload(fixture), [
    { method: "GET", path: "/api/catalog", status: 200, candidateRevision: "v1", worldMode: "healthy" },
  ]);
  await assert.rejects(fetch(new URL("/api/catalog", fixture.baseUrl)));
});

test("journal preserves actual response bodies and timestamps across modes as deep snapshots", async () => {
  const fixture = await startFixture();
  try {
    fixture.setCandidateRevision("v2");
    fixture.setWorldMode("mapped_broken");
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-integrity"), { status: 200, body: { unlabeledItemCount: 1 } });
    fixture.setWorldMode("unmapped_broken");
    assert.deepEqual(await getJson(fixture.baseUrl, "/api/catalog-publication"), { status: 200, body: { staleItemCount: 1 } });
    assert.deepEqual(await getJson(fixture.baseUrl, "/missing"), { status: 404, body: { error: "not_found" } });
    const journal = fixture.getJournal();
    assert.deepEqual(journal.map(({ method, path, status, body, candidateRevision, worldMode }) => ({ method, path, status, body, candidateRevision, worldMode })), [
      { method: "GET", path: "/api/catalog-integrity", status: 200, body: { unlabeledItemCount: 1 }, candidateRevision: "v2", worldMode: "mapped_broken" },
      { method: "GET", path: "/api/catalog-publication", status: 200, body: { staleItemCount: 1 }, candidateRevision: "v2", worldMode: "unmapped_broken" },
      { method: "GET", path: "/missing", status: 404, body: { error: "not_found" }, candidateRevision: "v2", worldMode: "unmapped_broken" },
    ]);
    assert.ok(journal.every(({ timestamp }) => !Number.isNaN(Date.parse(timestamp))));
    journal[0].body.unlabeledItemCount = 99;
    journal[0].worldMode = "forged";
    assert.deepEqual(fixture.getJournal()[0].body, { unlabeledItemCount: 1 });
    assert.equal(fixture.getJournal()[0].worldMode, "mapped_broken");
  } finally {
    await fixture.close();
  }
});
