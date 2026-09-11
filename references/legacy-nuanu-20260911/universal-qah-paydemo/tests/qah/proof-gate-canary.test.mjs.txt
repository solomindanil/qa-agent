import assert from "node:assert/strict";
import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { runProofGateCanaryPhase } from "../../scripts/qah/proof-gate-canary.mjs";

test("remote Proof Gate verification excludes host-only listener suites", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(
    packageJson.scripts["verify:qah:proof-gate"],
    "npm run test:qah:proof-gate && npm run typecheck",
  );
  assert.doesNotMatch(packageJson.scripts["verify:qah:proof-gate"], /test:paydemo:harness/);
});

const SOURCE_REF = Object.freeze({
  artifact_id: "92400946-cc1f-5731-b1aa-af14a9765b7a",
  version_id: "103a0d1b-7d39-4512-b5f6-06cc1b64a527",
  kind: "flow_item",
  role: "source",
});
const VERIFICATION_REF = Object.freeze({
  artifact_id: "11111111-1111-4111-8111-111111111111",
  version_id: "22222222-2222-4222-8222-222222222222",
  kind: "document",
  role: "output",
});
const FINALIZATION_REF = Object.freeze({
  artifact_id: "33333333-3333-4333-8333-333333333333",
  version_id: "44444444-4444-4444-8444-444444444444",
  kind: "document",
  role: "output",
});

async function fixture(t, verification = { exit_code: 0, stdout: "verified", stderr: "" }) {
  const taskRoot = await mkdtemp(join(tmpdir(), "qah-proof-gate-canary-"));
  t.after(() => rm(taskRoot, { recursive: true, force: true }));
  const outputDir = join(taskRoot, "qah", "proof-gate-canary");
  const checkout = "/virtual/repository";
  const commit = "a".repeat(40);
  const origin = "https://github.com/solomindanil/NuanuFlowQA.git";
  const profile = {
    schema_version: "nuanu.qa-project-profile.v1",
    project_key: "paydemo",
    repository: { allowed_origin: origin },
  };
  const dependencies = {
    checkout,
    readRepositoryIdentity: async () => ({ checkout, commit, origin, clean: true }),
    prepareVerificationWorkspace: async (root) => root,
    readProfile: async () => ({ profile, bytes: Buffer.from("profile-bytes") }),
    runVerification: async () => verification,
  };
  return { taskRoot, outputDir, checkout, commit, origin, profile, dependencies };
}

test("production canary ignores the launcher checkout and verifies the supervisor task worktree", async (t) => {
  const value = await fixture(t);
  const previous = process.env.NUANU_CODEX_CWD;
  process.env.NUANU_CODEX_CWD = "/foreign/launcher-checkout";
  t.after(() => {
    if (previous === undefined) delete process.env.NUANU_CODEX_CWD;
    else process.env.NUANU_CODEX_CWD = previous;
  });
  let observedCheckout = null;
  const { checkout: _testCheckout, ...options } = value;
  options.dependencies = {
    ...value.dependencies,
    readRepositoryIdentity: async (checkout) => {
      observedCheckout = checkout;
      return { checkout, commit: value.commit, origin: value.origin, clean: true };
    },
  };

  await runProofGateCanaryPhase("prepare", {
    phase: "prepare",
    source_ref: SOURCE_REF,
    source_name: "PAYD-33 · Task-owned repository authority",
    source_media_type: "application/vnd.nuanu.flow-item+json",
  }, options);

  assert.equal(observedCheckout, process.cwd());
  const verification = JSON.parse(await readFile(join(value.outputDir, "qah-verification.json"), "utf8"));
  assert.equal(verification.tested_head_sha, value.commit);
});

test("prepare exports the exact clean index and installs dependencies only in the private task workspace", async (t) => {
  const value = await fixture(t);
  const calls = [];
  const commandEnvironments = [];
  const { prepareVerificationWorkspace: _fixtureWorkspace, ...fixtureDependencies } = value.dependencies;
  const snapshot = join(await realpath(value.taskRoot), "qah", "proof-gate-canary", ".source");
  value.dependencies = {
    ...fixtureDependencies,
    readRepositoryIdentity: async (checkout) => {
      calls.push("repository");
      return { checkout, commit: value.commit, origin: value.origin, clean: true };
    },
    execFile: async (file, args, options) => {
      calls.push({ file, args, cwd: options.cwd, shell: options.shell });
      commandEnvironments.push(options.env);
      return { stdout: "installed", stderr: file === "npm" ? "npm warn fixture\n" : "" };
    },
    readProfile: async (checkout) => {
      calls.push("profile");
      assert.equal(checkout, snapshot);
      return { profile: value.profile, bytes: Buffer.from("profile-bytes") };
    },
    runVerification: async (checkout) => {
      calls.push("verification");
      assert.equal(checkout, snapshot);
      return { exit_code: 0, stdout: "verified", stderr: "" };
    },
  };

  await runProofGateCanaryPhase("prepare", {
    phase: "prepare",
    source_ref: SOURCE_REF,
    source_name: "PAYD-33 · Fresh checkout bootstrap",
    source_media_type: "application/vnd.nuanu.flow-item+json",
  }, value);

  assert.deepEqual(calls, [
    "repository",
    {
      file: "git",
      args: ["-C", value.checkout, "checkout-index", "--all", `--prefix=${snapshot}/`],
      cwd: value.checkout,
      shell: false,
    },
    {
      file: "npm",
      args: ["ci", "--ignore-scripts", "--no-audit", "--no-fund"],
      cwd: snapshot,
      shell: false,
    },
    "repository",
    "profile",
    "verification",
  ]);
  assert.equal(commandEnvironments[0].NUANU_AGENT_KEY, undefined);
  assert.equal(commandEnvironments[1].NUANU_AGENT_KEY, undefined);
  assert.equal(commandEnvironments[1].TMPDIR, join(snapshot, ".qah-runtime", "tmp"));
  assert.equal(commandEnvironments[1].NPM_CONFIG_CACHE, join(snapshot, ".qah-runtime", "npm-cache"));
});

test("single-task canary publishes exact verification and finalization refs before Proof Gate completion", async (t) => {
  const value = await fixture(t);
  const prepared = await runProofGateCanaryPhase("prepare", {
    phase: "prepare",
    source_ref: SOURCE_REF,
    source_name: "PAYD-29 · [CANARY] Verify universal QA pipeline",
    source_media_type: "application/vnd.nuanu.flow-item+json",
  }, value);
  assert.deepEqual(prepared, {
    schema_version: "nuanu.qah-proof-gate-canary-phase.v1",
    phase: "prepared",
    files: [{
      slot: "qah_verification",
      name: "qah-verification.json",
      kind: "document",
      role: "output",
      media_type: "application/json",
      size_bytes: prepared.files[0].size_bytes,
      sha256: prepared.files[0].sha256,
    }],
  });
  const verification = JSON.parse(await readFile(join(value.outputDir, "qah-verification.json"), "utf8"));
  assert.equal(verification.status, "passed");
  assert.equal(verification.tested_head_sha, value.commit);
  assert.deepEqual(verification.source_ref, SOURCE_REF);
  assert.equal(verification.command, "npm run verify:qah:proof-gate");

  const finalized = await runProofGateCanaryPhase("finalize", {
    phase: "finalize",
    artifact_refs: { qah_verification: VERIFICATION_REF },
  }, value);
  assert.equal(finalized.phase, "finalization_prepared");
  assert.deepEqual(finalized.files.map(({ slot, media_type }) => ({ slot, media_type })), [
    { slot: "finalization_report", media_type: "application/json" },
  ]);
  const report = JSON.parse(await readFile(join(value.outputDir, "finalization.json"), "utf8"));
  assert.equal(report.schema_version, "nuanu.qah-proof-gate-canary-finalization.v1");
  assert.deepEqual(report.verification_ref, VERIFICATION_REF);
  assert.deepEqual(report.claim, {
    transition_allowed: true,
    target_state: "ready_for_production",
    reason_codes: [],
    kind: "qa",
    verdict: "pass",
    tested_head_sha: value.commit,
    checks: [{
      name: "universal_qah_repository_verification",
      status: "passed",
      evidence: `artifact:${VERIFICATION_REF.artifact_id}@${VERIFICATION_REF.version_id}`,
    }],
  });

  const completed = await runProofGateCanaryPhase("complete", {
    phase: "complete",
    artifact_refs: {
      qah_verification: VERIFICATION_REF,
      finalization_report: FINALIZATION_REF,
    },
  }, value);
  assert.deepEqual(completed.item.data, report.claim);
  assert.deepEqual(completed.item.artifacts, {});
  assert.deepEqual(completed.artifact_outputs, {
    "item.artifacts.qah_verification": VERIFICATION_REF,
    "item.artifacts.finalization_report": FINALIZATION_REF,
  });
  assert.equal(completed.item.key, "finalize_transition");
});

test("failed repository verification becomes fail-closed blocked evidence, never product failure", async (t) => {
  const value = await fixture(t, { exit_code: 2, stdout: "", stderr: "test failed" });
  await runProofGateCanaryPhase("prepare", {
    phase: "prepare",
    source_ref: SOURCE_REF,
    source_name: "PAYD-29 · Canary",
    source_media_type: "application/vnd.nuanu.flow-item+json",
  }, value);
  await runProofGateCanaryPhase("finalize", {
    phase: "finalize",
    artifact_refs: { qah_verification: VERIFICATION_REF },
  }, value);
  const report = JSON.parse(await readFile(join(value.outputDir, "finalization.json"), "utf8"));
  assert.equal(report.claim.verdict, "blocked");
  assert.equal(report.claim.target_state, "ready_for_qa");
  assert.deepEqual(report.claim.checks, [{
    name: "universal_qah_repository_verification",
    status: "failed",
    evidence: `artifact:${VERIFICATION_REF.artifact_id}@${VERIFICATION_REF.version_id}`,
  }]);
  assert.equal(report.qa_reason_code, "HARNESS_VERIFICATION_FAILED");
});

test("canary rejects mutable, foreign, malformed, or out-of-order inputs", async (t) => {
  const value = await fixture(t);
  const prepare = {
    phase: "prepare",
    source_ref: SOURCE_REF,
    source_name: "PAYD-29 · Canary",
    source_media_type: "application/vnd.nuanu.flow-item+json",
  };
  for (const hostile of [
    { ...prepare, source_ref: { ...SOURCE_REF, role: "output" } },
    { ...prepare, source_ref: { ...SOURCE_REF, name: "extra" } },
    { ...prepare, source_media_type: "text/markdown" },
    { ...prepare, source_name: "no issue identity" },
    { ...prepare, ambient_token: "forbidden" },
  ]) await assert.rejects(() => runProofGateCanaryPhase("prepare", hostile, value));

  await assert.rejects(() => runProofGateCanaryPhase("finalize", {
    phase: "finalize", artifact_refs: { qah_verification: VERIFICATION_REF },
  }, value), /prepared state/i);
  await runProofGateCanaryPhase("prepare", prepare, value);
  await assert.rejects(() => runProofGateCanaryPhase("prepare", prepare, value), /empty|already|state/i);
  await assert.rejects(() => runProofGateCanaryPhase("complete", {
    phase: "complete",
    artifact_refs: { qah_verification: VERIFICATION_REF, finalization_report: FINALIZATION_REF },
  }, value), /finalization state/i);
  await assert.rejects(() => runProofGateCanaryPhase("finalize", {
    phase: "finalize",
    artifact_refs: { qah_verification: { ...VERIFICATION_REF, media_type: "application/json" } },
  }, value), /exact/i);

  const symlinkValue = await fixture(t);
  await runProofGateCanaryPhase("prepare", prepare, symlinkValue);
  const foreign = join(symlinkValue.taskRoot, "foreign.json");
  await writeFile(foreign, "sentinel");
  await symlink(foreign, join(symlinkValue.outputDir, "finalization.json"));
  await assert.rejects(() => runProofGateCanaryPhase("finalize", {
    phase: "finalize", artifact_refs: { qah_verification: VERIFICATION_REF },
  }, symlinkValue), /exist|symlink|file/i);
  assert.equal(await readFile(foreign, "utf8"), "sentinel");
});

test("canary evidence files are canonical JSON without a trailing newline", async (t) => {
  const value = await fixture(t);
  await runProofGateCanaryPhase("prepare", {
    phase: "prepare",
    source_ref: SOURCE_REF,
    source_name: "PAYD-29 · Canary",
    source_media_type: "application/vnd.nuanu.flow-item+json",
  }, value);
  const source = await readFile(join(value.outputDir, "qah-verification.json"), "utf8");
  assert.equal(source, canonicalJson(JSON.parse(source)));
  assert.equal(source.endsWith("\n"), false);
  assert.equal(sha256(source), JSON.parse(await readFile(join(value.outputDir, ".canary-state.json"), "utf8")).verification_file_sha256);
});
