#!/usr/bin/env node

import { execFile as execFileCallback } from "node:child_process";
import { lstat, mkdir, readFile, readdir, realpath, rename, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { canonicalJson, sha256 } from "./canonical.mjs";
import { validateProfile } from "./contracts.mjs";

const execFile = promisify(execFileCallback);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA = /^[a-f0-9]{40}$/;
const ISSUE_NAME = /^[A-Z][A-Z0-9]{0,15}-[1-9][0-9]{0,9} · [^\0\r\n]{1,400}$/;
const SOURCE_MEDIA_TYPE = "application/vnd.nuanu.flow-item+json";
const MAX_INPUT_BYTES = 64 * 1024;
const MAX_COMMAND_BYTES = 2 * 1024 * 1024;
const STATE_NAME = ".canary-state.json";
const VERIFICATION_NAME = "qah-verification.json";
const FINALIZATION_NAME = "finalization.json";
const REF_KEYS = Object.freeze(["artifact_id", "version_id", "kind", "role"]);
const SAFE_ENV = Object.freeze(["PATH", "LANG", "LC_ALL", "LC_CTYPE", "TMPDIR", "TMP", "TEMP", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT"]);

function exact(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} must have exact keys`);
  return value;
}

function artifactRef(value, kind, role, label) {
  exact(value, REF_KEYS, label);
  if (!UUID.test(value.artifact_id) || !UUID.test(value.version_id)) throw new Error(`${label} must pin UUID artifact and version IDs`);
  if (value.kind !== kind || value.role !== role) throw new Error(`${label} must be an exact ${kind}/${role} reference`);
  return { ...value };
}

function minimalEnvironment(source = process.env) {
  return Object.fromEntries(SAFE_ENV.filter((key) => typeof source[key] === "string").map((key) => [key, source[key]]));
}

async function privateCommandEnvironment(root) {
  const runtime = join(root, ".qah-runtime");
  const cache = join(runtime, "npm-cache");
  const temporary = join(runtime, "tmp");
  await mkdir(cache, { recursive: true, mode: 0o700 });
  await mkdir(temporary, { recursive: true, mode: 0o700 });
  return {
    ...minimalEnvironment(),
    TMPDIR: temporary,
    TMP: temporary,
    TEMP: temporary,
    NPM_CONFIG_CACHE: cache,
  };
}

async function runGit(checkout, args) {
  const result = await execFile("git", ["-C", checkout, ...args], {
    cwd: checkout,
    env: minimalEnvironment(),
    encoding: "utf8",
    maxBuffer: 128 * 1024,
    timeout: 10_000,
    shell: false,
  });
  if (result.stderr !== "") throw new Error("Git repository verification emitted stderr");
  return result.stdout.trimEnd();
}

async function readRepositoryIdentity(checkout) {
  const root = await realpath(checkout);
  const gitRoot = await runGit(root, ["rev-parse", "--show-toplevel"]);
  if (gitRoot !== root) throw new Error("canary checkout must be the exact Git root");
  const commit = await runGit(root, ["rev-parse", "--verify", "HEAD^{commit}"]);
  if (!SHA.test(commit)) throw new Error("canary checkout HEAD is invalid");
  const status = await runGit(root, ["status", "--porcelain=v1", "--untracked-files=all"]);
  const origins = (await runGit(root, ["remote", "get-url", "--all", "origin"])).split("\n").filter(Boolean);
  if (origins.length !== 1) throw new Error("canary checkout must have exactly one origin URL");
  return { checkout: root, commit, origin: origins[0], clean: status === "" };
}

async function readProfile(checkout) {
  const { default: YAML } = await import("yaml");
  const bytes = await readFile(join(checkout, "qa-harness.yaml"));
  if (bytes.byteLength < 1 || bytes.byteLength > 262_144) throw new Error("qa-harness.yaml is outside its byte bound");
  return { profile: validateProfile(YAML.parse(bytes.toString("utf8"))), bytes };
}

async function prepareVerificationWorkspace(checkout, outputDir, command = execFile) {
  const snapshot = join(outputDir, ".source");
  await mkdir(snapshot, { mode: 0o700 });
  const exported = await command("git", ["-C", checkout, "checkout-index", "--all", `--prefix=${snapshot}${sep}`], {
    cwd: checkout,
    env: minimalEnvironment(),
    encoding: "utf8",
    maxBuffer: MAX_COMMAND_BYTES,
    timeout: 60_000,
    killSignal: "SIGKILL",
    shell: false,
  });
  if ((exported.stderr ?? "") !== "") throw new Error("verified source export emitted stderr");
  const environment = await privateCommandEnvironment(snapshot);
  await command("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: snapshot,
    env: environment,
    encoding: "utf8",
    maxBuffer: MAX_COMMAND_BYTES,
    timeout: 15 * 60_000,
    killSignal: "SIGKILL",
    shell: false,
  });
  return snapshot;
}

async function runVerification(checkout) {
  const environment = await privateCommandEnvironment(checkout);
  try {
    const result = await execFile("npm", ["run", "verify:qah:proof-gate"], {
      cwd: checkout,
      env: environment,
      encoding: "utf8",
      maxBuffer: MAX_COMMAND_BYTES,
      timeout: 15 * 60_000,
      killSignal: "SIGKILL",
      shell: false,
    });
    return { exit_code: 0, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  } catch (error) {
    const exitCode = Number.isSafeInteger(error?.code) ? error.code : -1;
    return {
      exit_code: exitCode,
      stdout: typeof error?.stdout === "string" ? error.stdout.slice(0, MAX_COMMAND_BYTES) : "",
      stderr: typeof error?.stderr === "string" ? error.stderr.slice(0, MAX_COMMAND_BYTES) : "",
    };
  }
}

async function secureOutputDirectory(taskRoot, requested) {
  if (typeof taskRoot !== "string" || !isAbsolute(taskRoot)) throw new Error("NUANU_TASK_DIR must be an absolute path");
  const root = await realpath(taskRoot);
  const requestedRoot = resolve(taskRoot);
  const requestedOutput = resolve(requested);
  const child = relative(requestedRoot, requestedOutput);
  if (!child || child.startsWith(`..${sep}`) || isAbsolute(child) || child.split(sep).some((part) => part === "..")) throw new Error("output directory escapes NUANU_TASK_DIR");
  const output = resolve(root, child);
  let cursor = root;
  for (const segment of child.split(sep)) {
    cursor = join(cursor, segment);
    const metadata = await lstat(cursor).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
    if (metadata === null) await mkdir(cursor, { mode: 0o700 });
    else if (!metadata.isDirectory() || metadata.isSymbolicLink()) throw new Error("output directory components must be real directories");
  }
  if (await realpath(output) !== output) throw new Error("output directory must resolve exactly");
  return output;
}

async function writeCanonical(directory, name, value) {
  const source = canonicalJson(value);
  await writeFile(join(directory, name), source, { mode: 0o600, flag: "wx" });
  return { size_bytes: Buffer.byteLength(source, "utf8"), sha256: sha256(source) };
}

async function replaceCanonical(directory, name, value) {
  const target = join(directory, name);
  const metadata = await lstat(target);
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`${name} must remain a real file`);
  const source = canonicalJson(value);
  const temporary = join(directory, `.${name}.next`);
  await writeFile(temporary, source, { mode: 0o600, flag: "wx" });
  await rename(temporary, target);
  return { size_bytes: Buffer.byteLength(source, "utf8"), sha256: sha256(source) };
}

async function readCanonical(directory, name) {
  const path = join(directory, name);
  const metadata = await lstat(path);
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size < 1 || metadata.size > MAX_INPUT_BYTES) throw new Error(`${name} is not a bounded real file`);
  const source = await readFile(path, "utf8");
  const value = JSON.parse(source);
  if (source !== canonicalJson(value)) throw new Error(`${name} must be canonical JSON without a trailing newline`);
  return value;
}

function manifest(phase, slot, name, file) {
  return {
    schema_version: "nuanu.qah-proof-gate-canary-phase.v1",
    phase,
    files: [{ slot, name, kind: "document", role: "output", media_type: "application/json", ...file }],
  };
}

function validatePrepareInput(input) {
  exact(input, ["phase", "source_ref", "source_name", "source_media_type"], "prepare input");
  if (input.phase !== "prepare") throw new Error("prepare input phase is invalid");
  const sourceRef = artifactRef(input.source_ref, "flow_item", "source", "source_ref");
  if (input.source_media_type !== SOURCE_MEDIA_TYPE) throw new Error("source media type is invalid");
  if (typeof input.source_name !== "string" || !ISSUE_NAME.test(input.source_name)) throw new Error("source name must contain one exact Flow item identifier");
  return { sourceRef, sourceName: input.source_name };
}

function streamDigest(value) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > MAX_COMMAND_BYTES) throw new Error("verification output exceeded its bound");
  return { bytes: Buffer.byteLength(value, "utf8"), sha256: sha256(value) };
}

async function prepare(input, context) {
  const { sourceRef, sourceName } = validatePrepareInput(input);
  const repository = await context.readRepositoryIdentity(context.checkout);
  if (repository.checkout !== context.checkout || !SHA.test(repository.commit) || typeof repository.origin !== "string" || repository.clean !== true) {
    throw new Error("repository identity is not exact and clean");
  }
  const verificationWorkspace = await context.prepareVerificationWorkspace(context.checkout, context.outputDir);
  const installedRepository = await context.readRepositoryIdentity(context.checkout);
  if (canonicalJson(installedRepository) !== canonicalJson(repository)) throw new Error("repository identity changed during dependency installation");
  const { profile, bytes } = await context.readProfile(verificationWorkspace);
  if (!profile || profile.repository?.allowed_origin !== repository.origin || !Buffer.isBuffer(bytes)) throw new Error("profile and repository origin are not bound");
  const result = await context.runVerification(verificationWorkspace);
  if (!Number.isSafeInteger(result?.exit_code)) throw new Error("verification result exit code is invalid");
  const stdout = streamDigest(result.stdout);
  const stderr = streamDigest(result.stderr);
  const status = result.exit_code === 0 ? "passed" : "blocked";
  const verification = {
    schema_version: "nuanu.qah-repository-verification.v1",
    status,
    command: "npm run verify:qah:proof-gate",
    exit_code: result.exit_code,
    tested_head_sha: repository.commit,
    repository_origin: repository.origin,
    profile_digest: sha256(profile),
    profile_blob_sha256: sha256(bytes),
    source_ref: sourceRef,
    source_name_sha256: sha256(sourceName),
    stdout_bytes: stdout.bytes,
    stdout_sha256: stdout.sha256,
    stderr_bytes: stderr.bytes,
    stderr_sha256: stderr.sha256,
  };
  const verificationFile = await writeCanonical(context.outputDir, VERIFICATION_NAME, verification);
  await writeCanonical(context.outputDir, STATE_NAME, {
    schema_version: "nuanu.qah-proof-gate-canary-state.v1",
    stage: "prepared",
    verification,
    verification_file_sha256: verificationFile.sha256,
    verification_ref: null,
    claim: null,
    finalization_file_sha256: null,
  });
  return manifest("prepared", "qah_verification", VERIFICATION_NAME, verificationFile);
}

async function finalize(input, context) {
  exact(input, ["phase", "artifact_refs"], "finalize input");
  if (input.phase !== "finalize") throw new Error("finalize input phase is invalid");
  exact(input.artifact_refs, ["qah_verification"], "finalize artifact_refs");
  const verificationRef = artifactRef(input.artifact_refs.qah_verification, "document", "output", "qah_verification ref");
  const state = await readCanonical(context.outputDir, STATE_NAME).catch(() => { throw new Error("prepared state is required"); });
  if (state.schema_version !== "nuanu.qah-proof-gate-canary-state.v1" || state.stage !== "prepared") throw new Error("prepared state is required");
  const verificationSource = await readFile(join(context.outputDir, VERIFICATION_NAME), "utf8");
  if (verificationSource !== canonicalJson(state.verification) || sha256(verificationSource) !== state.verification_file_sha256) throw new Error("verification evidence changed after prepare");
  const passed = state.verification.status === "passed" && state.verification.exit_code === 0;
  const claim = {
    transition_allowed: true,
    target_state: passed ? "ready_for_production" : "ready_for_qa",
    reason_codes: [],
    kind: "qa",
    verdict: passed ? "pass" : "blocked",
    tested_head_sha: state.verification.tested_head_sha,
    checks: [{
      name: "universal_qah_repository_verification",
      status: passed ? "passed" : "failed",
      evidence: `artifact:${verificationRef.artifact_id}@${verificationRef.version_id}`,
    }],
  };
  const report = {
    schema_version: "nuanu.qah-proof-gate-canary-finalization.v1",
    qa_reason_code: passed ? "HARNESS_VERIFIED" : "HARNESS_VERIFICATION_FAILED",
    verification_ref: verificationRef,
    verification_file_sha256: state.verification_file_sha256,
    claim,
  };
  const file = await writeCanonical(context.outputDir, FINALIZATION_NAME, report);
  await replaceCanonical(context.outputDir, STATE_NAME, {
    ...state,
    stage: "finalized",
    verification_ref: verificationRef,
    claim,
    finalization_file_sha256: file.sha256,
  });
  return manifest("finalization_prepared", "finalization_report", FINALIZATION_NAME, file);
}

async function complete(input, context) {
  exact(input, ["phase", "artifact_refs"], "complete input");
  if (input.phase !== "complete") throw new Error("complete input phase is invalid");
  exact(input.artifact_refs, ["qah_verification", "finalization_report"], "complete artifact_refs");
  const verificationRef = artifactRef(input.artifact_refs.qah_verification, "document", "output", "qah_verification ref");
  const finalizationRef = artifactRef(input.artifact_refs.finalization_report, "document", "output", "finalization_report ref");
  const state = await readCanonical(context.outputDir, STATE_NAME).catch(() => { throw new Error("finalization state is required"); });
  if (state.schema_version !== "nuanu.qah-proof-gate-canary-state.v1" || state.stage !== "finalized" || canonicalJson(state.verification_ref) !== canonicalJson(verificationRef)) {
    throw new Error("finalization state is required and must preserve the verification ref");
  }
  const reportSource = await readFile(join(context.outputDir, FINALIZATION_NAME), "utf8");
  const report = JSON.parse(reportSource);
  if (reportSource !== canonicalJson(report) || sha256(reportSource) !== state.finalization_file_sha256 || canonicalJson(report.claim) !== canonicalJson(state.claim)) {
    throw new Error("finalization report changed before completion");
  }
  return {
    item: {
      key: "finalize_transition",
      description: state.claim.verdict === "pass" ? "Universal QAH repository canary admitted" : "Universal QAH repository canary held",
      data: state.claim,
      artifacts: {},
    },
    artifact_outputs: {
      "item.artifacts.qah_verification": verificationRef,
      "item.artifacts.finalization_report": finalizationRef,
    },
  };
}

export async function runProofGateCanaryPhase(phase, input, options = {}) {
  if (!["prepare", "finalize", "complete"].includes(phase)) throw new Error("unknown proof-gate canary phase");
  const taskRoot = options.taskRoot ?? process.env.NUANU_TASK_DIR;
  const outputDir = await secureOutputDirectory(taskRoot, options.outputDir ?? join(taskRoot, "qah", "proof-gate-canary"));
  if (phase === "prepare" && (await readdir(outputDir)).length !== 0) throw new Error("prepare output directory must be empty");
  const checkout = options.checkout ?? process.cwd();
  const injected = options.dependencies ?? options;
  const context = {
    outputDir,
    checkout,
    readRepositoryIdentity: injected.readRepositoryIdentity ?? readRepositoryIdentity,
    prepareVerificationWorkspace: injected.prepareVerificationWorkspace ?? ((root, directory) => prepareVerificationWorkspace(root, directory, injected.execFile ?? execFile)),
    readProfile: injected.readProfile ?? readProfile,
    runVerification: injected.runVerification ?? runVerification,
  };
  if (phase === "prepare") return prepare(input, context);
  if (phase === "finalize") return finalize(input, context);
  return complete(input, context);
}

async function readInput(path, taskRoot) {
  if (typeof path !== "string" || !isAbsolute(path)) throw new Error("--input must be an absolute task-local path");
  const root = await realpath(taskRoot);
  const resolved = await realpath(path);
  const child = relative(root, resolved);
  if (!child || child.startsWith(`..${sep}`) || isAbsolute(child)) throw new Error("input path escapes NUANU_TASK_DIR");
  const metadata = await lstat(resolved);
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size < 1 || metadata.size > MAX_INPUT_BYTES) throw new Error("input must be a bounded real file");
  const source = await readFile(resolved, "utf8");
  const value = JSON.parse(source);
  if (source !== canonicalJson(value)) throw new Error("input must be canonical JSON without a trailing newline");
  return value;
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 5 || !["prepare", "finalize", "complete"].includes(argv[0]) || argv[1] !== "--input" || argv[3] !== "--output-dir") {
    throw new Error("usage: proof-gate-canary.mjs <prepare|finalize|complete> --input <absolute-task-file> --output-dir <absolute-task-dir>");
  }
  const taskRoot = process.env.NUANU_TASK_DIR;
  const input = await readInput(argv[2], taskRoot);
  process.stdout.write(canonicalJson(await runProofGateCanaryPhase(argv[0], input, { taskRoot, outputDir: argv[4] })));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2; });
