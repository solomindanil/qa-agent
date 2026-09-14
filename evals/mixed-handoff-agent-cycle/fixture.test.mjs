import assert from "node:assert/strict";
import { test } from "node:test";

import { startMixedHandoffFixture } from "./fixture.mjs";

const CANDIDATE_SHA = "cccccccccccccccccccccccccccccccccccccccc";
const ACCOUNT_ID = "rel-17";

async function getJson(baseUrl, path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();
  return { response, body };
}

test("identity stays stable while only the local control changes original-evidence readiness", async () => {
  const fixture = await startMixedHandoffFixture();
  try {
    const first = await getJson(fixture.baseUrl, "/api/environment?sample=first");
    const second = await getJson(fixture.baseUrl, "/api/environment?sample=second");

    assert.equal(first.response.status, 200);
    assert.deepEqual(first.body, {
      candidateSha: CANDIDATE_SHA,
      accountId: ACCOUNT_ID,
      originalEvidenceReady: false,
    });
    assert.deepEqual(second.body, first.body);

    fixture.enableOriginalEvidence();
    const enabled = await getJson(fixture.baseUrl, "/api/environment?sample=enabled");
    assert.deepEqual(enabled.body, {
      candidateSha: CANDIDATE_SHA,
      accountId: ACCOUNT_ID,
      originalEvidenceReady: true,
    });
  } finally {
    await fixture.close();
  }
});

test("read-only routes ignore queries and expose the deliberate renewal defect", async () => {
  const fixture = await startMixedHandoffFixture();
  try {
    const provider = await getJson(fixture.baseUrl, "/api/provider?cacheBust=1");
    const renewal = await getJson(fixture.baseUrl, "/api/renewal?cacheBust=2");
    const card = await getJson(fixture.baseUrl, "/api/card?cacheBust=3");
    const history = await getJson(fixture.baseUrl, "/api/history?cacheBust=4");
    const favicon = await fetch(`${fixture.baseUrl}/favicon.ico?cacheBust=5`);

    assert.deepEqual(provider.body, {
      providerId: "number-provider-1",
      supportsRenewal: false,
    });
    assert.deepEqual(renewal.body, {
      providerId: "number-provider-1",
      renewalAvailable: true,
      quote: { amount: 3, currency: "TEST" },
    });
    assert.deepEqual(card.body, { accountId: ACCOUNT_ID, last4: "1074" });
    assert.deepEqual(history.body, {
      accountId: ACCOUNT_ID,
      operations: [
        {
          id: "op-vpn-17",
          amount: 12,
          currency: "TEST",
          status: "completed",
        },
      ],
    });
    assert.equal(favicon.status, 204);
    assert.equal(await favicon.text(), "");
    assert.deepEqual(fixture.hits, [
      { method: "GET", path: "/api/provider?cacheBust=1" },
      { method: "GET", path: "/api/renewal?cacheBust=2" },
      { method: "GET", path: "/api/card?cacheBust=3" },
      { method: "GET", path: "/api/history?cacheBust=4" },
      { method: "GET", path: "/favicon.ico?cacheBust=5" },
    ]);
  } finally {
    await fixture.close();
  }
});

test("HTTP requests cannot unlock evidence or reach a payment endpoint", async () => {
  const fixture = await startMixedHandoffFixture();
  try {
    const unlockPost = await fetch(`${fixture.baseUrl}/api/vpn/original-evidence`, {
      method: "POST",
    });
    const queryUnlock = await fetch(
      `${fixture.baseUrl}/api/vpn/original-evidence?enable=true`,
    );
    const paymentPost = await fetch(`${fixture.baseUrl}/api/pay`, { method: "POST" });
    const paymentGet = await fetch(`${fixture.baseUrl}/api/pay`);
    const unknownGet = await fetch(`${fixture.baseUrl}/unknown`);
    const environment = await getJson(fixture.baseUrl, "/api/environment");

    assert.equal(unlockPost.status, 405);
    assert.equal(queryUnlock.status, 503);
    assert.equal(paymentPost.status, 405);
    assert.equal(paymentGet.status, 404);
    assert.equal(unknownGet.status, 404);
    assert.equal(environment.body.originalEvidenceReady, false);
  } finally {
    await fixture.close();
  }
});

test("original evidence becomes readable without changing history or original rows", async () => {
  const fixture = await startMixedHandoffFixture();
  try {
    const historyBefore = await getJson(fixture.baseUrl, "/api/history");
    const unavailable = await fetch(`${fixture.baseUrl}/api/vpn/original-evidence`);
    assert.equal(unavailable.status, 503);

    fixture.enableOriginalEvidence();
    const evidence = await getJson(fixture.baseUrl, "/api/vpn/original-evidence");
    const historyAfter = await getJson(fixture.baseUrl, "/api/history");

    const originalRecords = {
      subscription: { id: "subscription-original-17", status: "expired" },
      assignment: { id: "assignment-original-17", status: "retained" },
    };
    assert.equal(evidence.response.status, 200);
    assert.deepEqual(evidence.body, {
      candidateSha: CANDIDATE_SHA,
      accountId: ACCOUNT_ID,
      operationId: "op-vpn-17",
      durationDays: 30,
      links: [
        {
          reservationId: "res-17",
          assignmentId: "assign-17",
          operationId: "op-vpn-17",
        },
      ],
      originalRecordsBefore: originalRecords,
      originalRecordsAfter: originalRecords,
    });
    assert.deepEqual(evidence.body.originalRecordsAfter, evidence.body.originalRecordsBefore);
    assert.deepEqual(historyAfter.body, historyBefore.body);
  } finally {
    await fixture.close();
  }
});

test("numbers page serves the empty state and no number cards", async () => {
  const fixture = await startMixedHandoffFixture();
  try {
    const response = await fetch(`${fixture.baseUrl}/numbers?account=rel-17`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/);
    assert.match(html, /<h1>Numbers<\/h1>/);
    assert.match(html, />No numbers yet</);
    assert.equal((html.match(/data-testid=["']number-card["']/g) ?? []).length, 0);
  } finally {
    await fixture.close();
  }
});

test("two starts have isolated readiness and request journals", async () => {
  const first = await startMixedHandoffFixture();
  const second = await startMixedHandoffFixture();
  try {
    assert.notEqual(first.baseUrl, second.baseUrl);
    first.enableOriginalEvidence();

    const firstEnvironment = await getJson(first.baseUrl, "/api/environment");
    const secondEnvironment = await getJson(second.baseUrl, "/api/environment");

    assert.equal(firstEnvironment.body.originalEvidenceReady, true);
    assert.equal(secondEnvironment.body.originalEvidenceReady, false);
    assert.deepEqual(first.hits, [{ method: "GET", path: "/api/environment" }]);
    assert.deepEqual(second.hits, [{ method: "GET", path: "/api/environment" }]);
    assert.notEqual(first.hits, second.hits);
  } finally {
    await first.close();
    await second.close();
  }
});
