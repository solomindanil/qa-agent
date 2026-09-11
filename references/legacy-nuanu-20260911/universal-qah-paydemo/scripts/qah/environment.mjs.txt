import { execFile as execFileCallback, spawn as spawnChild } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { canonicalJson, sha256 } from "./canonical.mjs";

const execFile = promisify(execFileCallback);
const STATE_SCHEMA = "qah.generic-environment-state.v3";
const DEFAULT_STATE_ROOT = join(tmpdir(), "nuanu-qah-environments");
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_OUTPUT_BYTES = 32 * 1024;
const IDENTITY_KEYS = ["commit", "content_hash", "environment_id", "instance_nonce", "repository_origin"];
const CHILD_ENV_ALLOWLIST = ["PATH", "LANG", "LC_ALL", "LC_CTYPE", "TMPDIR", "TMP", "TEMP", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT"];
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ENVIRONMENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SHA_PATTERN = /^[a-f0-9]{40}$/;
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
const NONCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

class HealthProtocolError extends Error {}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function dependencies(input) {
  const resolved = {
    execFile,
    spawn: spawnChild,
    processKill: process.kill.bind(process),
    fetch: globalThis.fetch,
    randomUUID,
    now: Date.now,
    sleep: (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)),
    ...input.dependencies,
  };
  resolved.inspectProcess ??= (pid) => inspectLiveProcess(pid, resolved);
  return resolved;
}

function requireId(value, label, pattern = ID_PATTERN) {
  if (typeof value !== "string" || !pattern.test(value)) throw new Error(`${label} is invalid`);
  return value;
}

function requireCommit(value) {
  if (typeof value !== "string" || !SHA_PATTERN.test(value)) throw new Error("commit must be an exact lowercase 40-character Git SHA");
  return value;
}

function normalizeHttpsOrigin(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("repository origin must be an exact HTTPS URL"); }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.search || url.hash || !url.pathname.endsWith(".git") || url.pathname.includes("//")) {
    throw new Error("repository origin must be an exact credential-free HTTPS .git URL");
  }
  return url.href;
}

async function normalizeOrigin(value, input) {
  if (input.allowFileRepository === true) {
    let url;
    try { url = new URL(value); } catch { return normalizeHttpsOrigin(value); }
    if (url.protocol === "file:") {
      if (url.hostname && url.hostname !== "localhost") throw new Error("file repository must be local");
      const path = await realpath(fileURLToPath(url));
      if (!(await stat(path)).isDirectory()) throw new Error("file repository must resolve to a directory");
      return pathToFileURL(path).href;
    }
  }
  return normalizeHttpsOrigin(value);
}

function stateRoot(value) {
  const root = resolve(value ?? DEFAULT_STATE_ROOT);
  if (root === resolve(sep)) throw new Error("state root cannot be the filesystem root");
  return root;
}

function fenceFrom(input) {
  return {
    run_id: requireId(input.runId, "run_id"),
    attempt_id: requireId(input.attemptId, "attempt_id"),
    environment_id: requireId(input.environmentId, "environment_id", ENVIRONMENT_ID_PATTERN),
  };
}

export function targetNamespace(input) {
  const fence = fenceFrom(input);
  return sha256(canonicalJson(fence)).slice("sha256:".length);
}

function pathsFor(root, namespace) {
  const environmentDirectory = resolve(root, namespace);
  if (!environmentDirectory.startsWith(`${root}${sep}`)) throw new Error("environment path escapes state root");
  return {
    environmentDirectory,
    checkout: join(environmentDirectory, "checkout"),
    stateFile: join(environmentDirectory, "environment.json"),
    pidFile: join(environmentDirectory, "server.pid"),
    lockDirectory: `${environmentDirectory}.lock`,
  };
}

async function exists(path) {
  try { await access(path); return true; } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeAtomic(path, contents, deps) {
  const temporary = `${path}.${process.pid}.${deps.randomUUID()}.tmp`;
  await writeFile(temporary, contents, { mode: 0o600 });
  await rename(temporary, path);
}

async function withLock(paths, operation) {
  try { await mkdir(paths.lockDirectory); } catch (error) {
    if (error?.code === "EEXIST") throw new Error("environment attempt is already being modified");
    throw error;
  }
  try { return await operation(); } finally { await rm(paths.lockDirectory, { recursive: true, force: true }); }
}

function commandResult(result) {
  if (typeof result === "string") return result;
  return result?.stdout ?? "";
}

async function runChecked(deps, command, args, options = {}) {
  try {
    const result = await deps.execFile(command, args, {
      cwd: options.cwd,
      env: options.env,
      encoding: "utf8",
      maxBuffer: options.maxOutputBytes ?? 8 * 1024 * 1024,
      timeout: options.timeoutMs,
      killSignal: "SIGKILL",
      shell: false,
    });
    return commandResult(result).trim();
  } catch (error) {
    const detail = String(error?.stderr ?? errorMessage(error)).trim();
    throw new Error(`${options.label ?? command} failed${detail ? `: ${detail}` : ""}`);
  }
}

async function inspectLiveProcess(pid, deps) {
  const probe = { pid };
  if (!processExists(probe, deps)) return null;
  let executableRealpath;
  try {
    if (process.platform === "linux" && await exists(`/proc/${pid}/exe`)) {
      executableRealpath = await realpath(`/proc/${pid}/exe`);
    } else {
      const executable = await runChecked(deps, "ps", ["-p", String(pid), "-o", "comm="], { label: "live executable verification", timeoutMs: 1_000, maxOutputBytes: 16 * 1024 });
      executableRealpath = await realpath(executable);
    }
    const argvText = await runChecked(deps, "ps", ["-ww", "-p", String(pid), "-o", "command="], { label: "live argv verification", timeoutMs: 1_000, maxOutputBytes: 64 * 1024 });
    const startToken = await runChecked(deps, "ps", ["-p", String(pid), "-o", "lstart="], { label: "live process start verification", timeoutMs: 1_000, maxOutputBytes: 16 * 1024 });
    if (!startToken) return null;
    return { executable_realpath: executableRealpath, argv_text: argvText, start_token: startToken };
  } catch {
    return processExists(probe, deps) ? { uncertain: true } : null;
  }
}

async function cloneExactCommit({ deps, repositoryOrigin, commit, checkout, timeoutMs, maxOutputBytes }) {
  await runChecked(deps, "git", ["-c", "http.followRedirects=false", "clone", "--quiet", "--no-checkout", "--filter=blob:none", "--", repositoryOrigin, checkout], { label: "Git clone", timeoutMs, maxOutputBytes });
  await runChecked(deps, "git", ["-c", "http.followRedirects=false", "-C", checkout, "fetch", "--quiet", "--no-tags", "--depth=1", "origin", commit], { label: "exact commit fetch", timeoutMs, maxOutputBytes });
  await runChecked(deps, "git", ["-C", checkout, "checkout", "--quiet", "--detach", commit], { label: "detached checkout", timeoutMs, maxOutputBytes });
  await verifyCheckout({ deps, checkout, commit, timeoutMs, maxOutputBytes });
}

async function verifyCheckout({ deps, checkout, commit, timeoutMs, maxOutputBytes, allowedGeneratedEntries = [] }) {
  const actualCommit = await runChecked(deps, "git", ["-C", checkout, "rev-parse", "HEAD"], { label: "commit verification", timeoutMs, maxOutputBytes });
  if (actualCommit !== commit) throw new Error(`exact commit verification failed: expected ${commit}, received ${actualCommit}`);
  const status = await runChecked(deps, "git", ["-C", checkout, "status", "--porcelain", "--untracked-files=normal"], { label: "clean checkout verification", timeoutMs, maxOutputBytes });
  const allowed = new Set(allowedGeneratedEntries);
  const unexpected = status.split("\n").filter(Boolean).filter((entry) => !allowed.has(entry));
  if (unexpected.length > 0) throw new Error(`isolated checkout is not clean; unexpected tracked or untracked entries: ${unexpected.join(", ")}`);
}

function minimalEnvironment(overrides = {}) {
  const environment = {};
  for (const name of CHILD_ENV_ALLOWLIST) if (typeof process.env[name] === "string") environment[name] = process.env[name];
  return { ...environment, ...overrides };
}

function validateGeneratedEntries(entries) {
  if (!Array.isArray(entries)) throw new Error("allowed generated entries must be an array");
  const seen = new Set();
  for (const entry of entries) {
    if (typeof entry !== "string" || !entry.startsWith("?? ")) throw new Error("generated output policy may allow only explicit untracked paths");
    const path = entry.slice(3);
    if (!path || path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) throw new Error("generated output policy contains an unsafe path");
    if (seen.has(entry)) throw new Error("generated output policy contains duplicate entries");
    seen.add(entry);
  }
  return entries;
}

const FORBIDDEN_ENVIRONMENT_NAME = /^(?:PATH|NODE_OPTIONS|NODE_PATH|LD_PRELOAD|LD_AUDIT|LD_LIBRARY_PATH|PYTHONPATH|RUBYOPT|PERL5OPT|BASH_ENV|ENV|IFS|SHELLOPTS|GITHUB_PAT)$|^(?:DYLD_|CODEX_|NUANU_|OPENAI_|QAH_)/;
const CREDENTIAL_ENVIRONMENT_NAME = /(?:SECRET|TOKEN|PASSWORD|CREDENTIAL|AUTHORIZATION|API_?KEY|PRIVATE_?KEY|(?:^|_)PAT(?:_|$))/;

function validateAdapterEnvironment(managed, environment) {
  if (!environment || typeof environment !== "object" || Array.isArray(environment)) throw new Error("adapter environment must be an object");
  const allowed = new Set(managed?.environment_allowlist ?? []);
  for (const name of allowed) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) throw new Error("adapter environment allowlist contains an invalid name");
    if (!name.startsWith(managed.environment_prefix)) throw new Error(`adapter environment name ${name} is outside the project namespace ${managed.environment_prefix}`);
    if (FORBIDDEN_ENVIRONMENT_NAME.test(name) || CREDENTIAL_ENVIRONMENT_NAME.test(name)) throw new Error(`adapter environment name ${name} is forbidden`);
  }
  for (const [name, value] of Object.entries(environment)) {
    if (!allowed.has(name)) throw new Error(`adapter environment name ${name} is not allowlisted`);
    if (FORBIDDEN_ENVIRONMENT_NAME.test(name) || CREDENTIAL_ENVIRONMENT_NAME.test(name)) throw new Error(`adapter environment name ${name} is forbidden`);
    if (typeof value !== "string" || value.length > 4096 || /[\0\r\n]/.test(value)) throw new Error(`adapter environment value ${name} is unsafe`);
  }
  return environment;
}

function expectedEnvironmentPrefix(profile) {
  return `${profile.project_key.toUpperCase().replace(/-/g, "_")}_`;
}

function validateManagedDeclaration(managed, profile) {
  requireId(managed.adapter_id, "adapter_id");
  requireId(managed.adapter_version, "adapter_version");
  if (!DIGEST_PATTERN.test(managed.adapter_digest ?? "")) throw new Error("adapter_digest must be an exact sha256 digest");
  canonicalJson(managed.configuration ?? {});
  canonicalJson(managed.runtime_identity ?? {});
  if (managed.environment_prefix !== expectedEnvironmentPrefix(profile)) throw new Error("adapter environment_prefix must be the exact project namespace");
  if (!Array.isArray(managed.environment_allowlist) || managed.environment_allowlist.some((name) => typeof name !== "string")) throw new Error("adapter environment_allowlist must be a closed string array");
  if (new Set(managed.environment_allowlist).size !== managed.environment_allowlist.length) throw new Error("adapter environment_allowlist must contain unique names");
  validateAdapterEnvironment(managed, {});
  if (typeof managed.inspectRuntime !== "function") throw new Error("managed adapter requires a read-only inspectRuntime contract");
}

function requestDigest({ input, fence, repositoryOrigin, root }) {
  const managed = input.managed ?? {};
  return sha256(canonicalJson({
    fence,
    state_root: root,
    namespace_override: input.namespaceOverride ?? null,
    allow_file_repository: input.allowFileRepository === true,
    repository_origin: repositoryOrigin,
    commit: input.commit,
    project_key: input.profile?.project_key,
    profile_repository: input.profile?.repository,
    environment: input.profile?.environment,
    execution: input.profile?.execution,
    adapter_id: managed.adapter_id ?? "profile-command-v1",
    adapter_version: managed.adapter_version ?? "1",
    adapter_digest: managed.adapter_digest ?? null,
    configuration: managed.configuration ?? {},
    runtime_identity: managed.runtime_identity ?? {
      base_url: input.baseUrl ?? null,
      content_hash: input.contentHash ?? null,
      command: input.profile?.environment?.prepare_command,
    },
    environment_prefix: managed.environment_prefix ?? null,
    environment_allowlist: managed.environment_allowlist ?? [],
  }));
}

function normalizedRuntimeContract(rawRuntime, state, managed) {
  if (!rawRuntime || typeof rawRuntime !== "object" || Array.isArray(rawRuntime)) throw new Error("actual runtime contract must be an object");
  if (!Array.isArray(rawRuntime.command) || rawRuntime.command.length === 0 || rawRuntime.command.some((part) => typeof part !== "string" || part.length === 0 || /[\0\r\n]/.test(part))) {
    throw new Error("actual runtime command must be a safe non-empty argv array");
  }
  let baseUrl;
  try { baseUrl = new URL(rawRuntime.base_url); } catch { throw new Error("actual runtime base_url must be absolute"); }
  if (!["http:", "https:"].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password || baseUrl.hash) throw new Error("actual runtime base_url must be credential-free HTTP or HTTPS");
  if (!DIGEST_PATTERN.test(rawRuntime.content_hash ?? "")) throw new Error("actual runtime content_hash must be an exact sha256 digest");
  const environment = validateAdapterEnvironment(managed, rawRuntime.environment ?? {});
  const identityEnvironment = validateAdapterEnvironment(managed, rawRuntime.environment_for_identity?.(state) ?? rawRuntime.identity_environment ?? {});
  for (const name of Object.keys(identityEnvironment)) if (Object.hasOwn(environment, name)) throw new Error(`actual runtime environment duplicates ${name} across static and identity channels`);
  const stateFields = rawRuntime.state_fields ?? {};
  if (!stateFields || typeof stateFields !== "object" || Array.isArray(stateFields)) throw new Error("actual runtime state_fields must be an object");
  canonicalJson(stateFields);
  const configuration = rawRuntime.configuration ?? managed?.configuration ?? {};
  canonicalJson(configuration);
  return {
    command: [...rawRuntime.command],
    base_url: baseUrl.href.replace(/\/$/, ""),
    content_hash: rawRuntime.content_hash,
    environment: { ...environment },
    identity_environment: { ...identityEnvironment },
    allowed_generated_entries: [...validateGeneratedEntries(rawRuntime.allowed_generated_entries ?? [])],
    state_fields: structuredClone(stateFields),
    configuration: structuredClone(configuration),
  };
}

function runtimeContractDigest(contract) {
  return sha256(canonicalJson(contract));
}

function actualRequestDigest(declaredRequestDigest, runtimeContract) {
  return sha256(canonicalJson({ declared_request_digest: declaredRequestDigest, actual_runtime_contract: runtimeContract }));
}

async function inspectRuntimeContract(input, state) {
  const rawRuntime = input.managed
    ? await input.managed.inspectRuntime({ input, checkout: state.checkout, repositoryOrigin: state.repository_origin, commit: state.commit, fence: state.fence, state: structuredClone(state) })
    : await defaultPrepareCheckout({ input, checkout: state.checkout });
  return normalizedRuntimeContract(rawRuntime, state, input.managed ?? { environment_prefix: "", environment_allowlist: [] });
}

function failureReceipt(fence, namespace, reason) {
  return { environment_status: "INFRA_FAILURE", ...fence, target_namespace: namespace, reason: errorMessage(reason) };
}

function cleanupReceipt(fence, namespace, status, extra = {}) {
  return { environment_status: status, ...fence, target_namespace: namespace, ...extra };
}

function processExists(state, deps) {
  try { deps.processKill(state.pid, 0); return true; } catch (error) {
    if (error?.code === "ESRCH") return false;
    throw error;
  }
}

function ownershipArguments(state) {
  return [
    `--qah-run-id=${encodeURIComponent(state.fence.run_id)}`,
    `--qah-attempt-id=${encodeURIComponent(state.fence.attempt_id)}`,
    `--qah-environment-id=${encodeURIComponent(state.fence.environment_id)}`,
    `--qah-instance-nonce=${encodeURIComponent(state.instance_nonce)}`,
    `--qah-repository-origin=${encodeURIComponent(state.repository_origin)}`,
    `--qah-state-root=${encodeURIComponent(state.state_root)}`,
    `--qah-owner-token=${encodeURIComponent(state.owner_token)}`,
    `--qah-commit=${encodeURIComponent(state.commit)}`,
  ];
}

async function processOwnership(state, deps) {
  if (!processExists(state, deps)) return "absent";
  try {
    if (await realpath(state.entrypoint_identity) !== state.entrypoint_realpath) return "foreign";
  } catch {
    return "foreign";
  }
  const live = await deps.inspectProcess(state.pid);
  if (!live) return "absent";
  if (live.uncertain || live.executable_realpath !== state.executable_realpath || live.start_token !== state.process_start_token) return "foreign";
  const exactArguments = [state.entrypoint_identity, ...ownershipArguments(state)];
  const containsExact = (argument) => {
    if (Array.isArray(live.argv)) return live.argv.includes(argument);
    const escaped = argument.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`).test(live.argv_text ?? "");
  };
  return exactArguments.every(containsExact) ? "owned" : "foreign";
}

async function waitForExit(state, deps, timeoutMs = 3_000) {
  const deadline = deps.now() + timeoutMs;
  while (deps.now() < deadline) {
    if (!processExists(state, deps)) return true;
    await deps.sleep(25);
  }
  return !processExists(state, deps);
}

async function stopOwned(state, deps) {
  const ownership = await processOwnership(state, deps);
  if (ownership === "absent") return "absent";
  if (ownership !== "owned") return "uncertain";
  deps.processKill(state.pid, "SIGTERM");
  if (!await waitForExit(state, deps)) return "uncertain";
  return "stopped";
}

async function quarantine(paths, deps) {
  const quarantinePath = `${paths.environmentDirectory}.quarantine-${deps.now()}-${deps.randomUUID()}`;
  await rename(paths.environmentDirectory, quarantinePath);
  return quarantinePath;
}

async function recoveryReceipt(input, paths, deps, fence, namespace, reason) {
  if (input.quarantineRecovery === false) {
    return cleanupReceipt(fence, namespace, "RECOVERY_REQUIRED", { reason: errorMessage(reason) });
  }
  const quarantinePath = await quarantine(paths, deps);
  return cleanupReceipt(fence, namespace, "RECOVERY_REQUIRED", { reason: errorMessage(reason), quarantine_path: quarantinePath });
}

async function persistBlockingRecovery(paths, state, deps, reason) {
  const blocked = {
    ...state,
    phase: "RECOVERY_REQUIRED",
    recovery_status: "OWNERSHIP_UNCERTAIN",
    recovery_reason: errorMessage(reason),
  };
  await writeAtomic(paths.stateFile, `${JSON.stringify(blocked, null, 2)}\n`, deps);
  return blocked;
}

function validateIdentityShape(identity, { allowFileRepository = false } = {}) {
  if (!identity || typeof identity !== "object" || Array.isArray(identity) || JSON.stringify(Object.keys(identity).sort()) !== JSON.stringify(IDENTITY_KEYS)) {
    throw new HealthProtocolError("health identity must be an exact object");
  }
  if (!SHA_PATTERN.test(identity.commit) || !DIGEST_PATTERN.test(identity.content_hash) || !ENVIRONMENT_ID_PATTERN.test(identity.environment_id) || !NONCE_PATTERN.test(identity.instance_nonce)) {
    throw new HealthProtocolError("health identity has an invalid commit, content hash, environment id, or instance nonce");
  }
  if (allowFileRepository && identity.repository_origin.startsWith("file:")) {
    let url;
    try { url = new URL(identity.repository_origin); } catch { throw new HealthProtocolError("health identity repository origin is invalid"); }
    if (url.protocol !== "file:" || (url.hostname && url.hostname !== "localhost")) throw new HealthProtocolError("health identity repository origin is invalid");
  } else {
    normalizeHttpsOrigin(identity.repository_origin);
  }
  return identity;
}

async function readBoundedJson(response, maxOutputBytes) {
  if (response.status >= 300 && response.status < 400) throw new HealthProtocolError("health endpoint redirect rejected");
  if (response.redirected) throw new HealthProtocolError("health endpoint redirect rejected");
  if (!response.ok) throw new HealthProtocolError(`health endpoint returned HTTP ${response.status}`);
  const type = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (type !== "application/json") throw new HealthProtocolError("health endpoint content-type must be application/json");
  const declared = response.headers.get("content-length");
  if (declared !== null && (!/^[0-9]+$/.test(declared) || Number(declared) > maxOutputBytes)) throw new HealthProtocolError("health response exceeds output bound");
  if (!response.body?.getReader) throw new HealthProtocolError("health response body is unavailable");
  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxOutputBytes) {
      await reader.cancel("health response exceeds output bound");
      throw new HealthProtocolError("health response exceeds output bound");
    }
    chunks.push(Buffer.from(value));
  }
  const bytes = Buffer.concat(chunks, totalBytes);
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw new HealthProtocolError("health response is not valid UTF-8"); }
  try { return JSON.parse(text); } catch { throw new HealthProtocolError("health response is not valid JSON"); }
}

async function readHealthIdentity(state, input, deps, signal) {
  const response = await deps.fetch(new URL(state.health_path, state.base_url), { redirect: "error", signal });
  const body = await readBoundedJson(response, state.max_output_bytes);
  const identity = input.managed?.normalize_identity ? input.managed.normalize_identity(body) : body;
  return validateIdentityShape(identity, input);
}

function identityMatches(identity, state) {
  return identity.repository_origin === state.repository_origin
    && identity.commit === state.commit
    && identity.content_hash === state.content_hash
    && identity.environment_id === state.fence.environment_id
    && identity.instance_nonce === state.instance_nonce;
}

async function waitForIdentity(state, input, deps) {
  const deadline = deps.now() + state.timeout_ms;
  let lastError = new Error("health endpoint has not responded");
  while (deps.now() < deadline) {
    try {
      const signal = AbortSignal.timeout(Math.max(1, Math.min(1_000, deadline - deps.now())));
      const identity = await readHealthIdentity(state, input, deps, signal);
      if (!identityMatches(identity, state)) throw new HealthProtocolError("health identity does not match the requested instance nonce and build identity");
      return identity;
    } catch (error) {
      lastError = error;
      if (error instanceof HealthProtocolError) throw error;
      await deps.sleep(25);
    }
  }
  throw new Error(`environment startup timed out: ${errorMessage(lastError)}`);
}

function validateState(state, expected) {
  const phase = state?.phase;
  const started = phase === "STARTED" || phase === "READY" || phase === "RECOVERED_STOPPED" || phase === "RECOVERY_REQUIRED";
  const blocking = phase === "RECOVERY_REQUIRED";
  if (state?.schema !== STATE_SCHEMA || !["PREPARING", "STARTED", "READY", "RECOVERED_STOPPED", "RECOVERY_REQUIRED"].includes(phase) || state.state_root !== expected.root || state.checkout !== expected.paths.checkout || state.state_file !== expected.paths.stateFile || state.pid_file !== expected.paths.pidFile || !/^[a-f0-9]{64}$/.test(state.target_namespace) || !NONCE_PATTERN.test(state.instance_nonce) || typeof state.owner_token !== "string" || state.owner_token.length < 16 || !DIGEST_PATTERN.test(state.declared_request_digest) || !DIGEST_PATTERN.test(state.request_digest) || !DIGEST_PATTERN.test(state.runtime_contract_digest) || !state.runtime_contract || typeof state.runtime_contract !== "object" || !isAbsolute(state.executable_identity) || !isAbsolute(state.executable_realpath) || !isAbsolute(state.entrypoint_identity) || !isAbsolute(state.entrypoint_realpath) || (started && (!Number.isSafeInteger(state.pid) || state.pid <= 1 || typeof state.process_start_token !== "string" || state.process_start_token.length === 0)) || (blocking && (state.recovery_status !== "OWNERSHIP_UNCERTAIN" || typeof state.recovery_reason !== "string" || state.recovery_reason.length === 0))) {
    throw new Error("environment ownership state is malformed");
  }
  if (canonicalJson(state.fence) !== canonicalJson(expected.fence) || state.repository_origin !== expected.repositoryOrigin) throw new Error("environment ownership tuple does not match the requested fence, repository, and state root");
  if (runtimeContractDigest(state.runtime_contract) !== state.runtime_contract_digest
    || actualRequestDigest(state.declared_request_digest, state.runtime_contract) !== state.request_digest
    || state.runtime_contract.content_hash !== state.content_hash
    || state.runtime_contract.base_url !== state.base_url
    || canonicalJson(state.runtime_contract.allowed_generated_entries) !== canonicalJson(state.allowed_generated_entries)) {
    throw new Error("environment actual runtime contract does not match ownership state");
  }
  for (const [name, value] of Object.entries(state.runtime_contract.state_fields ?? {})) {
    if (canonicalJson(state[name]) !== canonicalJson(value)) throw new Error(`environment runtime state field ${name} does not match ownership state`);
  }
  return state;
}

async function readState(paths, expected) {
  return validateState(JSON.parse(await readFile(paths.stateFile, "utf8")), expected);
}

function validReadyReceipt(receipt, state) {
  const expectedKeys = ["attempt_id", "base_url", "commit", "content_hash", "environment_id", "environment_status", "instance_nonce", "pid_file", "repository_origin", "run_id", "state_file", "target_namespace"];
  return receipt && JSON.stringify(Object.keys(receipt).sort()) === JSON.stringify(expectedKeys)
    && receipt.environment_status === "READY"
    && receipt.run_id === state.fence.run_id
    && receipt.attempt_id === state.fence.attempt_id
    && receipt.environment_id === state.fence.environment_id
    && receipt.repository_origin === state.repository_origin
    && receipt.commit === state.commit
    && receipt.content_hash === state.content_hash
    && receipt.instance_nonce === state.instance_nonce
    && receipt.base_url === state.base_url
    && receipt.pid_file === state.pid_file
    && receipt.state_file === state.state_file
    && receipt.target_namespace === state.target_namespace;
}

async function resolveExecutable(command) {
  if (!Array.isArray(command) || command.length === 0 || command.some((part) => typeof part !== "string" || part.length === 0)) throw new Error("managed command must be a non-empty argv array");
  const executableIdentity = command[0];
  const entrypointIdentity = command.length > 1 && isAbsolute(command[1]) ? command[1] : command[0];
  if (!isAbsolute(executableIdentity) || !isAbsolute(entrypointIdentity)) throw new Error("managed executable and entrypoint identities must be absolute");
  return {
    executableIdentity,
    executableRealpath: await realpath(executableIdentity),
    entrypointIdentity,
    entrypointRealpath: await realpath(entrypointIdentity),
  };
}

async function defaultPrepareCheckout({ input, checkout }) {
  if (!input.baseUrl || !DIGEST_PATTERN.test(input.contentHash ?? "")) throw new Error("profile command requires exact baseUrl and contentHash inputs");
  return { command: input.profile.environment.prepare_command, base_url: input.baseUrl, content_hash: input.contentHash, environment: {} };
}

async function startManaged(state, runtime, managed, deps) {
  const args = [...runtime.command.slice(1), ...ownershipArguments(state)];
  const adapterEnvironment = validateAdapterEnvironment(managed, { ...runtime.environment, ...runtime.identity_environment });
  const child = deps.spawn(runtime.command[0], args, {
    cwd: state.checkout,
    env: minimalEnvironment(adapterEnvironment),
    detached: true,
    stdio: "ignore",
    shell: false,
  });
  await new Promise((resolvePromise, rejectPromise) => {
    child.once("spawn", resolvePromise);
    child.once("error", rejectPromise);
  });
  child.unref();
  if (!Number.isSafeInteger(child.pid) || child.pid <= 1) throw new Error("managed product did not provide a valid PID");
  const live = await deps.inspectProcess(child.pid);
  const exactArguments = [state.entrypoint_identity, ...ownershipArguments(state)];
  const hasArgument = (argument) => Array.isArray(live?.argv)
    ? live.argv.includes(argument)
    : new RegExp(`(?:^|\\s)${argument.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`).test(live?.argv_text ?? "");
  if (!live || live.uncertain || live.executable_realpath !== state.executable_realpath || typeof live.start_token !== "string" || !exactArguments.every(hasArgument)) {
    const error = new Error("spawned process live executable or ownership tuple could not be verified");
    error.ownershipUncertain = true;
    throw error;
  }
  return { pid: child.pid, processStartToken: live.start_token };
}

function executionBounds(profile) {
  const timeoutMs = profile?.execution?.timeout_ms ?? DEFAULT_TIMEOUT_MS;
  const maxOutputBytes = profile?.execution?.max_output_bytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 600_000) throw new Error("execution timeout is invalid");
  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes <= 0 || maxOutputBytes > 10 * 1024 * 1024) throw new Error("execution output bound is invalid");
  return { timeoutMs, maxOutputBytes };
}

async function normalizedInput(input) {
  if (!input?.profile?.environment || !input.profile.repository) throw new Error("validated profile is required");
  const strategy = input.profile.environment.strategy;
  if (!["none", "managed_command"].includes(strategy)) throw new Error("unsupported environment strategy");
  if (strategy === "managed_command" && input.managed) validateManagedDeclaration(input.managed, input.profile);
  const fence = fenceFrom(input);
  const namespace = targetNamespace(input);
  const root = stateRoot(input.stateRoot);
  const repositoryOrigin = await normalizeOrigin(input.repositoryOrigin, input);
  const allowedOrigin = await normalizeOrigin(input.profile.repository.allowed_origin, input);
  if (repositoryOrigin !== allowedOrigin) throw new Error("repository origin does not match the profile allowlist");
  const commit = requireCommit(input.commit);
  const paths = pathsFor(root, input.namespaceOverride ?? namespace);
  const bounds = executionBounds(input.profile);
  return { strategy, fence, namespace, root, paths, repositoryOrigin, commit, ...bounds };
}

export async function prepareEnvironment(input) {
  let normalized;
  try { normalized = await normalizedInput(input); } catch (error) {
    let fence;
    try { fence = fenceFrom(input); } catch { fence = { run_id: input?.runId, attempt_id: input?.attemptId, environment_id: input?.environmentId }; }
    let namespace = "invalid";
    try { namespace = targetNamespace(input); } catch {}
    return failureReceipt(fence, namespace, error);
  }
  const { strategy, fence, namespace, root, paths, repositoryOrigin, commit, timeoutMs, maxOutputBytes } = normalized;
  if (strategy === "none") return { environment_status: "NOT_REQUIRED", ...fence, target_namespace: namespace };
  const deps = dependencies(input);
  const declaredDigest = requestDigest({ input: { ...input, commit }, fence, repositoryOrigin, root });
  await mkdir(root, { recursive: true, mode: 0o700 });
  try {
    return await withLock(paths, async () => {
      if (await exists(paths.stateFile)) {
        let state;
        try { state = await readState(paths, { root, paths, fence, repositoryOrigin }); } catch (error) {
          const quarantinePath = await quarantine(paths, deps);
          throw new Error(`RECOVERY_REQUIRED: malformed ownership state was quarantined at ${quarantinePath}: ${errorMessage(error)}`);
        }
        if (state.declared_request_digest !== declaredDigest) throw new Error("attempt fence conflicts with a different request body");
        if (state.phase === "STARTED") {
          if (!await exists(paths.pidFile) || (await readFile(paths.pidFile, "utf8")).trim() !== String(state.pid)) {
            const reason = "STARTED PID file is missing or mismatched; refusing to signal and blocking the canonical namespace";
            await persistBlockingRecovery(paths, state, deps, reason);
            throw new Error(`RECOVERY_REQUIRED: ${reason}`);
          }
          const ownership = await processOwnership(state, deps);
          if (ownership === "foreign") {
            const reason = "STARTED PID ownership is foreign or uncertain; refusing to signal it and blocking the canonical namespace";
            await persistBlockingRecovery(paths, state, deps, reason);
            throw new Error(`RECOVERY_REQUIRED: ${reason}`);
          }
          const stopped = ownership === "absent" ? "absent" : await stopOwned(state, deps);
          if (stopped === "uncertain") {
            const reason = "exact-owned STARTED process could not be reconciled; blocking the canonical namespace";
            await persistBlockingRecovery(paths, state, deps, reason);
            throw new Error(`RECOVERY_REQUIRED: ${reason}`);
          }
          state = { ...state, phase: "RECOVERED_STOPPED", recovery_status: stopped === "stopped" ? "STOPPED" : "ABSENT" };
          await writeAtomic(paths.stateFile, `${JSON.stringify(state, null, 2)}\n`, deps);
          throw new Error(`RECOVERY_REQUIRED: exact-owned STARTED environment was safely ${stopped === "stopped" ? "stopped" : "reconciled as absent"}; cleanup is required`);
        }
        if (state.phase === "RECOVERED_STOPPED") {
          throw new Error("RECOVERY_REQUIRED: recovered environment remains visible until cleanup");
        }
        if (state.phase === "RECOVERY_REQUIRED") {
          throw new Error(`RECOVERY_REQUIRED: canonical environment namespace is blocked: ${state.recovery_reason}`);
        }
        if (state.phase !== "READY") {
          const quarantinePath = await quarantine(paths, deps);
          throw new Error(`RECOVERY_REQUIRED: ${state.phase} environment attempt is not replayable and was quarantined at ${quarantinePath}`);
        }
        const inspectedRuntime = await inspectRuntimeContract(input, state);
        const inspectedRuntimeDigest = runtimeContractDigest(inspectedRuntime);
        const inspectedRequestDigest = actualRequestDigest(declaredDigest, inspectedRuntime);
        if (canonicalJson(inspectedRuntime) !== canonicalJson(state.runtime_contract)
          || inspectedRuntimeDigest !== state.runtime_contract_digest
          || inspectedRequestDigest !== state.request_digest) {
          throw new Error("actual runtime identity contract conflicts with the READY ownership state");
        }
        if (!validReadyReceipt(state.receipt, state)) throw new Error("instance identity receipt is invalid; recovery is required before replay");
        if (!await exists(paths.pidFile) || (await readFile(paths.pidFile, "utf8")).trim() !== String(state.pid)) throw new Error("PID file does not match ownership state");
        const ownership = await processOwnership(state, deps);
        if (ownership !== "owned") throw new Error(ownership === "foreign" ? "instance identity ownership failed: foreign PID prevents safe idempotent replay" : "owned process is absent; recovery is required");
        await verifyCheckout({ deps, checkout: paths.checkout, commit, timeoutMs, maxOutputBytes, allowedGeneratedEntries: state.allowed_generated_entries });
        await waitForIdentity(state, input, deps);
        return state.receipt;
      }
      if (await exists(paths.environmentDirectory)) throw new Error("interrupted environment preparation requires explicit recovery cleanup");
      await mkdir(paths.environmentDirectory, { mode: 0o700 });
      let state;
      try {
        await cloneExactCommit({ deps, repositoryOrigin, commit, checkout: paths.checkout, timeoutMs, maxOutputBytes });
        const prepareCheckout = input.managed?.prepareCheckout ?? defaultPrepareCheckout;
        const instanceNonce = deps.randomUUID();
        const ownerToken = deps.randomUUID();
        const provisionalState = {
          schema: STATE_SCHEMA,
          phase: "PREPARING",
          fence,
          repository_origin: repositoryOrigin,
          commit,
          state_root: root,
          checkout: paths.checkout,
          state_file: paths.stateFile,
          target_namespace: namespace,
          pid_file: paths.pidFile,
          instance_nonce: instanceNonce,
          owner_token: ownerToken,
          health_path: input.profile.environment.health_path,
          timeout_ms: timeoutMs,
          max_output_bytes: maxOutputBytes,
        };
        const rawRuntime = await prepareCheckout({ input, checkout: paths.checkout, repositoryOrigin, commit, fence, timeout_ms: timeoutMs, max_output_bytes: maxOutputBytes });
        const managedDeclaration = input.managed ?? { environment_prefix: "", environment_allowlist: [], configuration: {} };
        const runtime = normalizedRuntimeContract(rawRuntime, provisionalState, managedDeclaration);
        const inspectedRuntime = await inspectRuntimeContract(input, { ...provisionalState, ...runtime.state_fields });
        if (canonicalJson(runtime) !== canonicalJson(inspectedRuntime)) throw new Error("actual runtime contract is not reproducible by read-only inspection");
        await verifyCheckout({ deps, checkout: paths.checkout, commit, timeoutMs, maxOutputBytes, allowedGeneratedEntries: runtime.allowed_generated_entries });
        const { executableIdentity, executableRealpath, entrypointIdentity, entrypointRealpath } = await resolveExecutable(runtime.command);
        const stateFields = runtime.state_fields;
        const protectedStateFields = new Set(["schema", "phase", "fence", "declared_request_digest", "request_digest", "runtime_contract_digest", "runtime_contract", "repository_origin", "commit", "state_root", "checkout", "state_file", "target_namespace", "pid_file", "executable_identity", "executable_realpath", "entrypoint_identity", "entrypoint_realpath", "process_start_token", "instance_nonce", "owner_token", "content_hash", "base_url", "health_path", "timeout_ms", "max_output_bytes", "allowed_generated_entries", "pid", "receipt", "recovery_status", "recovery_reason"]);
        if (Object.keys(stateFields).some((key) => protectedStateFields.has(key))) throw new Error("managed adapter attempted to override generic ownership state");
        const runtimeDigest = runtimeContractDigest(runtime);
        state = {
          ...provisionalState,
          declared_request_digest: declaredDigest,
          request_digest: actualRequestDigest(declaredDigest, runtime),
          runtime_contract_digest: runtimeDigest,
          runtime_contract: runtime,
          executable_identity: executableIdentity,
          executable_realpath: executableRealpath,
          entrypoint_identity: entrypointIdentity,
          entrypoint_realpath: entrypointRealpath,
          content_hash: runtime.content_hash,
          base_url: runtime.base_url,
          allowed_generated_entries: runtime.allowed_generated_entries,
          ...stateFields,
        };
        await writeAtomic(paths.stateFile, `${JSON.stringify(state, null, 2)}\n`, deps);
        const { pid, processStartToken } = await startManaged(state, runtime, managedDeclaration, deps);
        state = { ...state, phase: "STARTED", pid, process_start_token: processStartToken };
        await writeAtomic(paths.stateFile, `${JSON.stringify(state, null, 2)}\n`, deps);
        await writeAtomic(paths.pidFile, `${pid}\n`, deps);
        await waitForIdentity(state, input, deps);
        const receipt = {
          environment_status: "READY",
          ...fence,
          target_namespace: namespace,
          repository_origin: repositoryOrigin,
          commit,
          content_hash: state.content_hash,
          instance_nonce: state.instance_nonce,
          base_url: state.base_url,
          pid_file: paths.pidFile,
          state_file: paths.stateFile,
        };
        state = { ...state, phase: "READY", receipt };
        await writeAtomic(paths.stateFile, `${JSON.stringify(state, null, 2)}\n`, deps);
        return receipt;
      } catch (error) {
        if (error?.ownershipUncertain) {
          await quarantine(paths, deps);
          throw new Error(`${errorMessage(error)}; uncertain spawned process was quarantined without a signal`);
        }
        if (state?.pid) {
          const stopped = await stopOwned(state, deps);
          if (stopped === "uncertain") {
            await quarantine(paths, deps);
            throw new Error(`${errorMessage(error)}; process ownership became uncertain and state was quarantined`);
          }
        }
        await rm(paths.environmentDirectory, { recursive: true, force: true });
        throw error;
      }
    });
  } catch (error) {
    return failureReceipt(fence, namespace, error);
  }
}

export async function cleanupEnvironment(input) {
  let normalized;
  try { normalized = await normalizedInput(input); } catch (error) {
    let fence;
    try { fence = fenceFrom(input); } catch { fence = { run_id: input?.runId, attempt_id: input?.attemptId, environment_id: input?.environmentId }; }
    let namespace = "invalid";
    try { namespace = targetNamespace(input); } catch {}
    return cleanupReceipt(fence, namespace, "RECOVERY_REQUIRED", { reason: errorMessage(error) });
  }
  const { fence, namespace, root, paths, repositoryOrigin } = normalized;
  if (normalized.strategy === "none") return cleanupReceipt(fence, namespace, "ABSENT");
  const deps = dependencies(input);
  await mkdir(root, { recursive: true, mode: 0o700 });
  try {
    return await withLock(paths, async () => {
      if (!await exists(paths.environmentDirectory)) return cleanupReceipt(fence, namespace, "ABSENT");
      if (!await exists(paths.stateFile)) {
        return recoveryReceipt(input, paths, deps, fence, namespace, "ownership state is missing after interrupted prepare");
      }
      let state;
      try { state = await readState(paths, { root, paths, fence, repositoryOrigin }); } catch (error) {
        return recoveryReceipt(input, paths, deps, fence, namespace, error);
      }
      if (state.phase === "RECOVERED_STOPPED") {
        await rm(paths.environmentDirectory, { recursive: true, force: true });
        return cleanupReceipt(fence, namespace, "STOPPED", { instance_nonce: state.instance_nonce });
      }
      if (state.phase === "RECOVERY_REQUIRED") {
        return cleanupReceipt(fence, namespace, "RECOVERY_REQUIRED", { reason: state.recovery_reason });
      }
      if (state.phase === "PREPARING") {
        return recoveryReceipt(input, paths, deps, fence, namespace, `${state.phase} environment attempt is not safe for automatic cleanup`);
      }
      if (!(await exists(paths.pidFile)) || (await readFile(paths.pidFile, "utf8")).trim() !== String(state.pid)) {
        if (state.phase === "STARTED") {
          const reason = "STARTED PID file is missing or mismatched; refusing to signal and blocking the canonical namespace";
          await persistBlockingRecovery(paths, state, deps, reason);
          return cleanupReceipt(fence, namespace, "RECOVERY_REQUIRED", { reason });
        }
        return recoveryReceipt(input, paths, deps, fence, namespace, "PID file does not match ownership state");
      }
      if (state.phase === "READY" && !validReadyReceipt(state.receipt, state)) {
        return recoveryReceipt(input, paths, deps, fence, namespace, "READY environment receipt is invalid");
      }
      const stopped = await stopOwned(state, deps);
      if (stopped === "uncertain") {
        if (state.phase === "STARTED") {
          const reason = "STARTED PID ownership is foreign or uncertain; refusing to signal it and blocking the canonical namespace";
          await persistBlockingRecovery(paths, state, deps, reason);
          return cleanupReceipt(fence, namespace, "RECOVERY_REQUIRED", { reason });
        }
        return recoveryReceipt(input, paths, deps, fence, namespace, "PID ownership is foreign or uncertain; refusing to signal it");
      }
      await rm(paths.environmentDirectory, { recursive: true, force: true });
      return cleanupReceipt(fence, namespace, "STOPPED", { instance_nonce: state.instance_nonce });
    });
  } catch (error) {
    return cleanupReceipt(fence, namespace, "RECOVERY_REQUIRED", { reason: errorMessage(error) });
  }
}
