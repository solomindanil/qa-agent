import { createServer } from "node:http";

const candidateSha = "cccccccccccccccccccccccccccccccccccccccc";
const accountId = "rel-17";

const provider = {
  providerId: "number-provider-1",
  supportsRenewal: false,
};

const renewal = {
  providerId: "number-provider-1",
  renewalAvailable: true,
  quote: { amount: 3, currency: "TEST" },
};

const card = { accountId, last4: "1074" };

const history = {
  accountId,
  operations: [
    {
      id: "op-vpn-17",
      amount: 12,
      currency: "TEST",
      status: "completed",
    },
  ],
};

const originalRecords = {
  subscription: { id: "subscription-original-17", status: "expired" },
  assignment: { id: "assignment-original-17", status: "retained" },
};

const originalEvidence = {
  candidateSha,
  accountId,
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
};

const numbersHtml = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Numbers</title></head>
  <body><main><h1>Numbers</h1><p role="status">No numbers yet</p></main></body>
</html>`;

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export async function startMixedHandoffFixture() {
  const hits = [];
  let originalEvidenceReady = false;
  const server = createServer((request, response) => {
    hits.push({ method: request.method, path: request.url });
    if (request.method !== "GET") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    const { pathname } = new URL(request.url ?? "/", "http://fixture.invalid");
    if (pathname === "/api/environment") {
      sendJson(response, 200, { candidateSha, accountId, originalEvidenceReady });
      return;
    }
    if (pathname === "/api/provider") {
      sendJson(response, 200, provider);
      return;
    }
    if (pathname === "/api/renewal") {
      sendJson(response, 200, renewal);
      return;
    }
    if (pathname === "/api/card") {
      sendJson(response, 200, card);
      return;
    }
    if (pathname === "/api/history") {
      sendJson(response, 200, history);
      return;
    }
    if (pathname === "/api/vpn/original-evidence") {
      if (!originalEvidenceReady) {
        sendJson(response, 503, { error: "original_evidence_not_ready" });
        return;
      }
      sendJson(response, 200, originalEvidence);
      return;
    }
    if (pathname === "/numbers") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(numbersHtml);
      return;
    }
    if (pathname === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }
    sendJson(response, 404, { error: "not_found" });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    hits,
    enableOriginalEvidence() {
      originalEvidenceReady = true;
    },
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}
