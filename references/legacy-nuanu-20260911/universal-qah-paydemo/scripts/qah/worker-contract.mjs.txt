import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VERSION = "0.3.14";
const ADAPTER_SHA256 = "9105a1b134fdd74b7aa5454aa4f622522939d683c413e83925ddbe3cadab4a41";
const MAX_ADAPTER_BYTES = 1024 * 1024;

function roots(environment) {
  const configured = String(environment.NUANU_FLOW_WORKER_ROOT ?? "").trim();
  const codexRoot = String(environment.CODEX_HOME ?? "").trim() || join(homedir(), ".codex");
  return [...new Set([configured, join(codexRoot, "plugins", "cache", "nuanu", "nuanu-flow-worker", VERSION)].filter(Boolean))].slice(0, 2);
}

export async function loadWorkerCompletionValidator(environment = process.env) {
  let lastError;
  for (const candidate of roots(environment)) {
    try {
      if (!isAbsolute(candidate)) throw new Error("worker root must be absolute");
      const root = await realpath(candidate);
      if (root !== resolve(candidate) || root.split(/[\\/]/).at(-1) !== VERSION) throw new Error("worker root is not the exact pinned version");
      const adapterPath = join(root, "scripts", "worker", "adapter.mjs");
      const metadata = await lstat(adapterPath);
      if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size < 2 || metadata.size > MAX_ADAPTER_BYTES || await realpath(adapterPath) !== adapterPath) throw new Error("worker adapter path is invalid");
      const bytes = await readFile(adapterPath);
      const digest = createHash("sha256").update(bytes).digest("hex");
      if (digest !== ADAPTER_SHA256) throw new Error("worker adapter bytes do not match pinned 0.3.14");
      const loaded = await import(pathToFileURL(adapterPath).href);
      if (typeof loaded.buildCanonicalCompletion !== "function") throw new Error("worker completion validator export is missing");
      return { version: VERSION, sha256: `sha256:${digest}`, buildCanonicalCompletion: loaded.buildCanonicalCompletion };
    } catch (error) { lastError = error; }
  }
  throw new Error(`Nuanu worker ${VERSION} completion validator is unavailable: ${lastError?.message ?? "no bounded candidate"}`);
}
