import { createServer } from "node:http";

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export async function startW4AgentChangeScopeFixture() {
  let candidateRevision = "v1";
  let worldMode = "healthy";
  let closePromise;
  const journal = [];

  const server = createServer((request, response) => {
    const method = request.method;
    const path = request.url;
    let status;
    let body;

    if (method !== "GET") {
      status = 405;
      body = { error: "method_not_allowed" };
    } else if (path === "/api/environment") {
      status = 200;
      body = { candidateRevision };
    } else if (path === "/api/catalog") {
      status = 200;
      body = { catalogName: "Cedar", ready: true };
    } else if (path === "/api/catalog-integrity") {
      status = 200;
      body = { unlabeledItemCount: worldMode === "mapped_broken" ? 1 : 0 };
    } else if (path === "/api/catalog-publication") {
      status = 200;
      body = { staleItemCount: worldMode === "unmapped_broken" ? 1 : 0 };
    } else {
      status = 404;
      body = { error: "not_found" };
    }

    journal.push({ method, path, status, candidateRevision, worldMode });
    sendJson(response, status, body);
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
    throw new Error("W4 fixture did not bind an IPv4 loopback port");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}/`,
    setCandidateRevision(revision) {
      if (revision !== "v1" && revision !== "v2") {
        throw new Error("Unsupported candidate revision");
      }
      candidateRevision = revision;
    },
    setWorldMode(mode) {
      if (mode !== "healthy" && mode !== "mapped_broken" && mode !== "unmapped_broken") {
        throw new Error("Unsupported world mode");
      }
      worldMode = mode;
    },
    getJournal() {
      return journal.map((entry) => ({ ...entry }));
    },
    close() {
      closePromise ??= new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
      return closePromise;
    },
  };
}
