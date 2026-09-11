#!/usr/bin/env node

import { execFile as execFileCallback } from "node:child_process";
import { access, readFile, realpath, stat } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { prepareEnvironment, cleanupEnvironment } from "./qah/environment.mjs";
import { canonicalJson, sha256 } from "./qah/canonical.mjs";

const execFile = promisify(execFileCallback);
const ALLOWED_VARIANTS = new Set(["buggy-v1", "fixed-v2"]);
const DEFAULT_STATE_ROOT = join(tmpdir(), "paydemo-qah-environments");
const DEFAULT_TRUSTED_REPOSITORY = "https://github.com/solomindanil/NuanuFlowQA.git";
const STARTUP_TIMEOUT_MS = 10_000;
const BUILD_INFO_TIMEOUT_MS = 1_000;
const MAX_BUILD_INFO_BYTES = 32 * 1024;
const BUILD_INFO_KEYS = ["app", "commit", "contentHash", "environmentId", "instanceNonce", "variant"];

function fail(message) {
  throw new Error(message);
}

function parseFlags(argv) {
  if (argv.length === 0) fail("Usage: paydemo-qah-environment.mjs <prepare|cleanup> [options]");
  const [mode, ...tokens] = argv;
  if (!["prepare", "cleanup"].includes(mode)) fail(`Unsupported mode: ${mode}`);
  if (tokens.length % 2 !== 0) fail(`Missing value for ${tokens.at(-1)}`);
  const flags = new Map();
  for (let index = 0; index < tokens.length; index += 2) {
    const flag = tokens[index];
    const value = tokens[index + 1];
    if (!flag.startsWith("--") || value.startsWith("--")) fail(`Invalid option pair: ${flag} ${value}`);
    if (flags.has(flag)) fail(`Duplicate option: ${flag}`);
    flags.set(flag, value);
  }
  return { mode, flags };
}

function onlyKnownFlags(flags, allowed) {
  for (const flag of flags.keys()) if (!allowed.has(flag)) fail(`Unsupported option: ${flag}`);
}

function requiredFlag(flags, name) {
  const value = flags.get(name);
  if (typeof value !== "string" || value.length === 0) fail(`Missing required option: ${name}`);
  return value;
}

function parseEnvironmentId(value) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(value)) fail("environment_id must match ^[a-z0-9][a-z0-9-]{0,63}$");
  return value;
}

function parseItemKey(value, fallback) {
  const itemKey = value ?? fallback;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(itemKey)) fail("item key contains unsupported characters");
  return itemKey;
}

function parseCommit(value) {
  if (!/^[a-f0-9]{40}$/.test(value)) fail("commit must be an exact 40-character lowercase Git SHA");
  return value;
}

function parseVariant(value) {
  if (!ALLOWED_VARIANTS.has(value)) fail(`Unsupported PayDemo variant: ${value}`);
  return value;
}

function parsePort(value) {
  if (!/^[0-9]+$/.test(value)) fail("port must be an integer");
  const port = Number.parseInt(value, 10);
  if (port < 1024 || port > 65535) fail("port must be between 1024 and 65535");
  return port;
}

function parseUrl(value) {
  let url;
  try { url = new URL(value); } catch { fail("repository URL is malformed"); }
  if (url.username || url.password || url.search || url.hash) fail("repository URL must not embed credentials, query parameters, or fragments");
  return url;
}

function normalizeHttpsRepository(value) {
  const url = parseUrl(value);
  if (url.protocol !== "https:" || !url.hostname) fail("trusted repository allowlist accepts exact HTTPS URLs only");
  if (!url.pathname.endsWith(".git") || url.pathname.includes("//")) fail("trusted repository URL must identify an exact .git path");
  return url.href;
}

function trustedHttpsRepositories() {
  const configured = process.env.NUANU_QA_ALLOWED_REPOSITORIES;
  if (configured === undefined) return new Set([DEFAULT_TRUSTED_REPOSITORY]);
  if (configured.trim() === "") return new Set();
  const entries = configured.split(",").map((entry) => entry.trim());
  if (entries.some((entry) => entry === "")) fail("NUANU_QA_ALLOWED_REPOSITORIES contains an empty repository entry");
  return new Set(entries.map(normalizeHttpsRepository));
}

async function parseRepoUrl(value) {
  const url = parseUrl(value);
  if (url.protocol === "https:") {
    const normalized = normalizeHttpsRepository(value);
    if (!trustedHttpsRepositories().has(normalized)) fail("repository is not present in the trusted exact HTTPS allowlist");
    return normalized;
  }
  if (url.protocol !== "file:") fail("repository URL must use trusted https://; file:// is test-only");
  if (process.env.NUANU_QA_ALLOW_FILE_REPO !== "1") fail("file repository support is disabled; set NUANU_QA_ALLOW_FILE_REPO=1 only in controlled tests");
  if (url.hostname && url.hostname !== "localhost") fail("file repository URL must resolve on the local host");
  let repositoryPath;
  try { repositoryPath = await realpath(fileURLToPath(url)); } catch { fail("file repository path cannot be resolved safely"); }
  if (!(await stat(repositoryPath)).isDirectory()) fail("file repository path must resolve to a directory");
  return pathToFileURL(repositoryPath).href;
}

function resolveStateRoot(value) {
  const root = resolve(value ?? DEFAULT_STATE_ROOT);
  if (root === resolve(sep)) fail("state root cannot be the filesystem root");
  return root;
}

function legacyPaths(root, environmentId) {
  const directory = resolve(root, environmentId);
  if (!directory.startsWith(`${root}${sep}`)) fail("environment path escapes state root");
  return { directory, stateFile: join(directory, "environment.json"), pidFile: join(directory, "server.pid") };
}

async function runChecked(command, args, options = {}) {
  try {
    const result = await execFile(command, args, {
      cwd: options.cwd,
      env: options.env,
      encoding: "utf8",
      maxBuffer: options.maxOutputBytes ?? MAX_BUILD_INFO_BYTES,
      timeout: options.timeoutMs ?? STARTUP_TIMEOUT_MS,
      killSignal: "SIGKILL",
      shell: false,
    });
    return result.stdout.trim();
  } catch (error) {
    const detail = String(error?.stderr ?? error?.message ?? error).trim();
    fail(`${options.label ?? command} failed${detail ? `: ${detail}` : ""}`);
  }
}

async function verifyPayDemoCheckout(checkout, commit, { allowBuild = false, timeoutMs = STARTUP_TIMEOUT_MS, maxOutputBytes = MAX_BUILD_INFO_BYTES } = {}) {
  const actual = await runChecked("git", ["-C", checkout, "rev-parse", "HEAD"], { label: "Commit verification", timeoutMs, maxOutputBytes });
  if (actual !== commit) fail(`exact commit verification failed: expected ${commit}, received ${actual}`);
  const status = await runChecked("git", ["-C", checkout, "status", "--porcelain", "--untracked-files=normal"], { label: "Clean checkout verification", timeoutMs, maxOutputBytes });
  const unexpected = status.split("\n").filter(Boolean).filter((entry) => !(allowBuild && entry === "?? dist/"));
  if (unexpected.length > 0) fail(`isolated checkout is not clean; unexpected tracked or untracked entries: ${unexpected.join(", ")}`);
}

async function buildPayDemo(checkout, variant, commit, { timeoutMs, maxOutputBytes }) {
  await runChecked(process.execPath, ["scripts/build-paydemo.mjs"], {
    cwd: checkout,
    env: { PATH: process.env.PATH, LANG: process.env.LANG, TMPDIR: process.env.TMPDIR, PAYDEMO_VARIANT: variant },
    label: "PayDemo build",
    timeoutMs,
    maxOutputBytes,
  });
  const manifest = JSON.parse(await readFile(join(checkout, "dist/paydemo/build-manifest.json"), "utf8"));
  if (manifest?.app !== "PayDemo" || manifest.variant !== variant || manifest.commit !== commit || !/^sha256:[a-f0-9]{64}$/.test(manifest.contentHash)) {
    fail("built PayDemo manifest does not match the requested exact build identity");
  }
  await verifyPayDemoCheckout(checkout, commit, { allowBuild: true, timeoutMs, maxOutputBytes });
  return manifest;
}

async function isPortInUse(port) {
  return new Promise((resolvePromise, rejectPromise) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(500);
    socket.once("connect", () => { socket.destroy(); resolvePromise(true); });
    socket.once("timeout", () => { socket.destroy(); rejectPromise(new Error(`port ${port} availability check timed out`)); });
    socket.once("error", (error) => { socket.destroy(); error?.code === "ECONNREFUSED" ? resolvePromise(false) : rejectPromise(error); });
  });
}

function validateBuildInfoShape(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(BUILD_INFO_KEYS)) {
    fail("/build-info JSON contains an unexpected field or is missing a required field");
  }
  const valid = value.app === "PayDemo"
    && ALLOWED_VARIANTS.has(value.variant)
    && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value.commit)
    && /^sha256:[a-f0-9]{64}$/.test(value.contentHash)
    && /^[a-z0-9][a-z0-9-]{0,63}$/.test(value.environmentId)
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.instanceNonce);
  if (!valid) fail("/build-info JSON does not match the exact safe build identity shape");
  return value;
}

async function readBoundedBuildInfoBody(response) {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null && (!/^[0-9]+$/.test(declaredLength) || Number.parseInt(declaredLength, 10) > MAX_BUILD_INFO_BYTES)) fail("/build-info body exceeds the 32KB limit");
  if (!response.body?.getReader) fail("/build-info response body is unavailable");
  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BUILD_INFO_BYTES) {
      await reader.cancel("/build-info body exceeds the 32KB limit");
      fail("/build-info body exceeds the 32KB limit");
    }
    chunks.push(Buffer.from(value));
  }
  try { return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, totalBytes)); } catch { fail("/build-info body is not valid UTF-8"); }
}

export async function fetchBuildInfo(baseUrl) {
  const response = await fetch(`${baseUrl}/build-info`, { redirect: "error", signal: AbortSignal.timeout(BUILD_INFO_TIMEOUT_MS) });
  if (!response.ok) fail(`/build-info returned HTTP ${response.status}`);
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") fail("/build-info content-type must be application/json");
  const text = await readBoundedBuildInfoBody(response);
  let value;
  try { value = JSON.parse(text); } catch { fail("/build-info body is not valid JSON"); }
  return validateBuildInfoShape(value);
}

function profile(repositoryOrigin) {
  return {
    project_key: "paydemo",
    repository: { allowed_origin: repositoryOrigin },
    environment: { strategy: "managed_command", prepare_command: [process.execPath, "apps/paydemo/server.mjs"], cleanup_command: [process.execPath, "apps/paydemo/server.mjs"], health_path: "/build-info" },
    execution: { timeout_ms: STARTUP_TIMEOUT_MS, max_output_bytes: MAX_BUILD_INFO_BYTES },
  };
}

function adapter({ repositoryOrigin, variant, port, environmentId }) {
  const runtimeIdentity = {
    protocol: "paydemo-build-info-v1",
    executable: "node apps/paydemo/server.mjs",
    base_url: `http://127.0.0.1:${port}`,
    environment_names: ["PAYDEMO_PORT", "PAYDEMO_VARIANT", "PAYDEMO_ENVIRONMENT_ID", "PAYDEMO_INSTANCE_NONCE"],
    content_hash_source: "exact-commit-build-manifest",
    variant,
  };
  function runtimeContract(checkout, contentHash, identityEnvironment) {
    const runtime = {
      command: [process.execPath, join(checkout, "apps/paydemo/server.mjs")],
      base_url: `http://127.0.0.1:${port}`,
      content_hash: contentHash,
      environment: {
        PAYDEMO_PORT: String(port),
        PAYDEMO_VARIANT: variant,
        PAYDEMO_ENVIRONMENT_ID: environmentId,
      },
      allowed_generated_entries: ["?? dist/"],
      state_fields: { repo_url: repositoryOrigin, environment_id: environmentId, variant, port },
    };
    if (identityEnvironment) runtime.identity_environment = identityEnvironment;
    else runtime.environment_for_identity = (state) => ({ PAYDEMO_INSTANCE_NONCE: state.instance_nonce });
    return runtime;
  }
  return {
    adapter_id: "paydemo-environment-v1",
    adapter_version: "1",
    adapter_digest: sha256(canonicalJson({ adapter: "paydemo-environment", version: 1, runtime_identity: runtimeIdentity })),
    configuration: { variant, port },
    runtime_identity: runtimeIdentity,
    environment_prefix: "PAYDEMO_",
    environment_allowlist: ["PAYDEMO_PORT", "PAYDEMO_VARIANT", "PAYDEMO_ENVIRONMENT_ID", "PAYDEMO_INSTANCE_NONCE"],
    async prepareCheckout({ checkout, commit, timeout_ms: timeoutMs, max_output_bytes: maxOutputBytes }) {
      if (await isPortInUse(port)) fail(`port ${port} is already in use; refusing to stop its owner`);
      const manifest = await buildPayDemo(checkout, variant, commit, { timeoutMs, maxOutputBytes });
      if (await isPortInUse(port)) fail(`port ${port} became occupied before startup`);
      const executable = join(checkout, "apps/paydemo/server.mjs");
      await access(executable);
      return runtimeContract(checkout, manifest.contentHash);
    },
    async inspectRuntime({ checkout, commit, state }) {
      const manifest = JSON.parse(await readFile(join(checkout, "dist/paydemo/build-manifest.json"), "utf8"));
      if (manifest?.app !== "PayDemo" || manifest.variant !== variant || manifest.commit !== commit || !/^sha256:[a-f0-9]{64}$/.test(manifest.contentHash)) {
        fail("stored PayDemo manifest does not match the requested exact runtime identity");
      }
      await access(join(checkout, "apps/paydemo/server.mjs"));
      return runtimeContract(checkout, manifest.contentHash, { PAYDEMO_INSTANCE_NONCE: state.instance_nonce });
    },
    normalize_identity(value) {
      const buildInfo = validateBuildInfoShape(value);
      return {
        repository_origin: repositoryOrigin,
        commit: buildInfo.commit,
        content_hash: buildInfo.contentHash,
        environment_id: buildInfo.environmentId,
        instance_nonce: buildInfo.instanceNonce,
      };
    },
  };
}

function prepareEnvelope(receipt, variant, itemKey) {
  return {
    item: {
      key: itemKey,
      description: `Изолированное окружение PayDemo ${variant} готово на точном commit ${receipt.commit}.`,
      data: {
        environment_status: "READY",
        environment_id: receipt.environment_id,
        instance_nonce: receipt.instance_nonce,
        base_url: receipt.base_url,
        variant,
        commit: receipt.commit,
        content_hash: receipt.content_hash,
        pid_file: receipt.pid_file,
      },
      artifacts: {},
    },
    artifact_outputs: { "item.artifacts.environment_manifest": null },
  };
}

function cleanupEnvelope({ environmentId, pidFile, status, itemKey }) {
  return {
    item: {
      key: itemKey,
      description: status === "STOPPED" ? `Изолированное окружение ${environmentId} остановлено.` : `Изолированное окружение ${environmentId} уже отсутствует.`,
      data: { environment_status: status, environment_id: environmentId, pid_file: pidFile },
      artifacts: {},
    },
    artifact_outputs: { "item.artifacts.environment_manifest": null },
  };
}

async function prepare(flags) {
  const repositoryOrigin = await parseRepoUrl(requiredFlag(flags, "--repo-url"));
  const commit = parseCommit(requiredFlag(flags, "--commit"));
  const variant = parseVariant(requiredFlag(flags, "--variant"));
  const port = parsePort(requiredFlag(flags, "--port"));
  const environmentId = parseEnvironmentId(requiredFlag(flags, "--environment-id"));
  const root = resolveStateRoot(flags.get("--state-root"));
  const itemKey = parseItemKey(flags.get("--item-key"), "prepare_environment");
  const receipt = await prepareEnvironment({
    profile: profile(repositoryOrigin),
    repositoryOrigin,
    commit,
    runId: environmentId,
    attemptId: "legacy",
    environmentId,
    stateRoot: root,
    namespaceOverride: environmentId,
    allowFileRepository: repositoryOrigin.startsWith("file:"),
    managed: adapter({ repositoryOrigin, variant, port, environmentId }),
  });
  if (receipt.environment_status !== "READY") fail(receipt.reason ?? `environment preparation returned ${receipt.environment_status}`);
  return prepareEnvelope(receipt, variant, itemKey);
}

async function cleanup(flags) {
  const environmentId = parseEnvironmentId(requiredFlag(flags, "--environment-id"));
  const root = resolveStateRoot(flags.get("--state-root"));
  const itemKey = parseItemKey(flags.get("--item-key"), "cleanup_environment");
  const paths = legacyPaths(root, environmentId);
  const suppliedPidFile = resolve(requiredFlag(flags, "--pid-file"));
  if (suppliedPidFile !== paths.pidFile || !isAbsolute(suppliedPidFile)) fail("PID file must be the exact file for environment_id under state root");

  let state = {};
  try { state = JSON.parse(await readFile(paths.stateFile, "utf8")); } catch {}
  const repositoryOrigin = state.repository_origin ?? DEFAULT_TRUSTED_REPOSITORY;
  if (repositoryOrigin.startsWith("https:")) {
    const normalized = normalizeHttpsRepository(repositoryOrigin);
    if (!trustedHttpsRepositories().has(normalized)) fail("repository is not present in the trusted exact HTTPS allowlist");
  }
  const commit = /^[a-f0-9]{40}$/.test(state.commit) ? state.commit : "a".repeat(40);
  const receipt = await cleanupEnvironment({
    profile: profile(repositoryOrigin),
    repositoryOrigin,
    commit,
    runId: environmentId,
    attemptId: "legacy",
    environmentId,
    stateRoot: root,
    namespaceOverride: environmentId,
    allowFileRepository: repositoryOrigin.startsWith("file:"),
    quarantineRecovery: false,
  });
  if (receipt.environment_status === "RECOVERY_REQUIRED") fail(receipt.reason ?? "environment cleanup requires recovery");
  return cleanupEnvelope({ environmentId, pidFile: suppliedPidFile, status: receipt.environment_status, itemKey });
}

export async function main(argv) {
  const { mode, flags } = parseFlags(argv);
  if (mode === "prepare") {
    onlyKnownFlags(flags, new Set(["--repo-url", "--commit", "--variant", "--port", "--environment-id", "--state-root", "--item-key"]));
    return prepare(flags);
  }
  onlyKnownFlags(flags, new Set(["--environment-id", "--state-root", "--pid-file", "--item-key"]));
  return cleanup(flags);
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main(process.argv.slice(2)).then((envelope) => process.stdout.write(`${JSON.stringify(envelope)}\n`)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
