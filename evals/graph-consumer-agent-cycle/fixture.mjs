import { createServer } from "node:http";

const catalog = {
  catalogName: "Stage Four",
  ready: true,
  entries: [
    { id: "item-labeled", displayLabel: "Linen basket" },
    { id: "item-unlabeled", displayLabel: "" },
  ],
};

const integrity = {
  invariantSatisfied: false,
  unlabeledItemCount: 1,
};

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export async function startGraphConsumerFixture() {
  const hits = [];
  const server = createServer((request, response) => {
    hits.push({ method: request.method, path: request.url });
    if (request.method !== "GET") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    const { pathname } = new URL(request.url ?? "/", "http://fixture.invalid");
    if (pathname === "/api/catalog") {
      sendJson(response, 200, catalog);
      return;
    }
    if (pathname === "/api/catalog-integrity") {
      sendJson(response, 200, integrity);
      return;
    }
    if (pathname === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }
    sendJson(response, 404, { error: "not_found" });
  });

  await new Promise((resolve, reject) => {
    const onError = (error) => reject(error);
    server.once("error", onError);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", onError);
      resolve();
    });
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    await new Promise((resolve) => server.close(resolve));
    throw new Error("Bounded fixture did not bind an IPv4 loopback port");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}/`,
    hits,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}
