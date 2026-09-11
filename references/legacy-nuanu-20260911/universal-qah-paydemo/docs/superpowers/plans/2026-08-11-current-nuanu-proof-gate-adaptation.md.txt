# Current Nuanu Proof Gate Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt Universal QAH to the stock Nuanu Flow Process v1 runtime by replacing the incompatible final variable gateway with `qa_result_v1`, while preserving deterministic PASS, product-failure, and hold-for-human outcomes.

**Architecture:** Nuanu Flow remains the native control plane: Column Process entry, Agent Tasks, Proof Gate outcomes, Ends, Journeys, Artifacts, and Assist/Auto semantics stay platform-owned. This repository remains the execution and trust plane: it validates exact immutable evidence, classifies a closed three-way release decision, materializes one admitted `nuanu.flow-step-result.v1`, and temporarily encodes it through the pinned worker transport. The live Process is patched only after local GREEN, server validation, a fresh ETag, and exact read-back; the first run is an Assist compatibility probe and cannot move the Flow item automatically.

**Tech Stack:** Node.js 22.23.1, ESM, Node test runner, JSON, Nuanu Flow Process v1, `nuanu-flow-worker` 0.3.14, Playwright/TypeScript as already pinned by the repository.

## Global Constraints

- Execute all local code changes in `/Users/danilsolomin/projectsnew/NuanuFlowQA/.worktrees/universal-qah` on branch `codex/universal-qah`.
- Do not edit Nuanu Flow backend, frontend, engine, plugin cache, MCP schemas, decompiler/compiler, Proof Gate profiles, or worker package bytes.
- Do not author or upload raw BPMN XML. Author only the structured Process v1 graph.
- Do not add a QA-column poller, a custom ticket-state router, a second decision inbox, a custom Journey database, or a duplicate Artifact registry. Nuanu already owns those capabilities.
- Preserve the server-owned Column Start node and edge byte-for-byte.
- Preserve existing End UUIDs `10000000-0000-5000-8000-000000000020` and `...021` plus edge UUIDs `...022` through `...024`. Because stock Nuanu makes node type immutable, remove the legacy gateway `...019` only after reconnecting those edges to the new Proof Gate `...026`.
- Product failure is not the fallback for uncertainty. Infra/provider failure, low confidence, missing evidence, stale identity, unknown codes, and human-required checks route to `HOLD_IN_READY_FOR_QA`.
- A failed finalization-integrity check produces no admitted or linked Artifact reference, ProcessItem, claim, or Proof Gate visit. If complete-phase read-back rejects an already published immutable `finalization.json` ArtifactVersion, record it as unbound/orphaned evidence and do not delete it without a separately authorized Artifact lifecycle operation.
- The local classifier does not claim that the Nuanu repository workspace exists. The stock Proof Gate owns the final repository-head check and may downgrade any local verdict to `unable_to_verify`.
- The first live canary uses a dedicated non-production Flow item in Assist mode. Auto remains disabled until separate observed `passed`, `not_passed`, and `unable_to_verify` canaries are reviewed.
- No payment, production, OTP, CAPTCHA, native Telegram, or irreversible external action is part of this plan.
- Every implementation task follows RED -> minimal GREEN -> focused regression -> exact commit. Do not begin a later task from a dirty worktree.

---

## Task 1: Pin and prove the current Nuanu worker boundary

**Files:**

- Modify: `tests/qah/helpers/worker-contract.mjs`
- Modify: `tests/qah/task7-round2.test.mjs`
- Modify: `tests/qah/task7-round3.test.mjs`

This task is an explicit compatibility decision, not a silent version bump. Version 0.3.14 is locally installed, and its adapter bytes currently match the already reviewed digest `9105a1b134fdd74b7aa5454aa4f622522939d683c413e83925ddbe3cadab4a41`.

- [ ] **Step 1: Confirm the exact installed adapter before changing tests**

Run:

```bash
test -f /Users/danilsolomin/.codex/plugins/cache/nuanu/nuanu-flow-worker/0.3.14/scripts/worker/adapter.mjs
shasum -a 256 /Users/danilsolomin/.codex/plugins/cache/nuanu/nuanu-flow-worker/0.3.14/scripts/worker/adapter.mjs
```

Expected second command output begins exactly with:

```text
9105a1b134fdd74b7aa5454aa4f622522939d683c413e83925ddbe3cadab4a41
```

Stop this task if the digest differs. Do not update the pinned digest to accommodate unreviewed bytes.

- [ ] **Step 2: Write the 0.3.14 contract expectation first**

In `tests/qah/task7-round3.test.mjs`, rename the worker test to `worker 0.3.14 completion validator is discovered portably and pinned by bytes` and change its exact expected version to `0.3.14` while leaving the helper unchanged.

In `tests/qah/task7-round2.test.mjs`, rename the protocol test to `every graph task has a runtime-owned final worker 0.3.14 envelope protocol` without changing behavior.

- [ ] **Step 3: Run RED against the old helper**

Run:

```bash
node --test tests/qah/task7-round2.test.mjs tests/qah/task7-round3.test.mjs
```

Expected: non-zero exit because `tests/qah/helpers/worker-contract.mjs` still resolves only 0.3.13 or returns `version: "0.3.13"`.

- [ ] **Step 4: Update only the reviewed worker version pin**

Apply these exact semantic changes in `tests/qah/helpers/worker-contract.mjs`:

```js
const VERSION = "0.3.14";
const ADAPTER_SHA256 = "9105a1b134fdd74b7aa5454aa4f622522939d683c413e83925ddbe3cadab4a41";
```

The digest remains unchanged. Update the digest-mismatch message to name pinned 0.3.14. Keep absolute-root, realpath, regular-file, non-symlink, size, basename, and bounded-candidate checks unchanged.

- [ ] **Step 5: Run GREEN and the worker-boundary regression**

Run:

```bash
node --test tests/qah/task7-round2.test.mjs tests/qah/task7-round3.test.mjs tests/qah/task-runtime.test.mjs
```

Expected: all tests pass; `buildCanonicalCompletion` is loaded from 0.3.14 and remains pinned by exact bytes.

- [ ] **Step 6: Commit the isolated compatibility change**

Run:

```bash
git add tests/qah/helpers/worker-contract.mjs tests/qah/task7-round2.test.mjs tests/qah/task7-round3.test.mjs
git diff --cached --check
git commit -m "fix: align qah worker contract with 0.3.14"
test -z "$(git status --short)"
```

---

## Task 2: Classify a closed three-way release policy

**Files:**

- Create: `scripts/qah/release-policy.mjs`
- Create: `tests/qah/release-policy.test.mjs`
- Modify: `scripts/qah/decide.mjs`
- Modify: `scripts/qah/render-comment.mjs`
- Modify: `tests/qah/decision.test.mjs`

- [ ] **Step 1: Write the release-policy RED tests**

Create `tests/qah/release-policy.test.mjs` with this complete test body. Do not invent a second fixture builder; the query suffix reuses the existing exported aggregate fixture without registering its own tests.

```js
import test from "node:test";
import assert from "node:assert/strict";

import { sha256 } from "../../scripts/qah/canonical.mjs";
import { validateAggregateForDecision } from "../../scripts/qah/decide.mjs";
import { RELEASE_ROUTES, classifyValidatedRelease } from "../../scripts/qah/release-policy.mjs";
import { aggregateFixture, aggregateFixtureResult } from "./aggregate.test.mjs?fixtures-only";

const FULL = Object.freeze({ code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "REQUIRED" });
const DOCS = Object.freeze({ code: "REQUIRED", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
const NONE = Object.freeze({ code: "NOT_APPLICABLE", api: "NOT_APPLICABLE", ui: "NOT_APPLICABLE", domain: "NOT_APPLICABLE" });
const FAIL_API = Object.freeze({
  product_result: "FAIL",
  code: "API_CONTRACT_VIOLATION",
  observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }],
});
const HOLD = Object.freeze({ route: "HOLD_IN_READY_FOR_QA", target_state: "ready_for_qa", verdict: "blocked" });

function expectedCheck(branch, status) {
  return {
    name: `universal_qah_${branch.branch}`,
    status,
    evidence: `artifact:${branch.artifacts.evidence.artifact_id}@${branch.artifacts.evidence.version_id}`,
  };
}

async function classifyFixture(options = {}) {
  const fixture = aggregateFixture(options);
  const aggregate = await aggregateFixtureResult(fixture);
  const validated = await validateAggregateForDecision(aggregate, fixture.dependencies);
  const classification = classifyValidatedRelease(validated);
  return { fixture, aggregate, validated, classification };
}

test("clean authenticated required branches are READY with exact evidence refs", async () => {
  assert.deepEqual(RELEASE_ROUTES, ["READY_FOR_PRODUCTION", "RETURN_TO_IN_PROGRESS", "HOLD_IN_READY_FOR_QA"]);
  const { aggregate, classification } = await classifyFixture({ applicability: FULL });
  assert.deepEqual(classification, {
    route: "READY_FOR_PRODUCTION",
    target_state: "ready_for_production",
    verdict: "pass",
    checks: aggregate.branches.map((branch) => expectedCheck(branch, "passed")),
  });
});

test("authenticated product failure is RETURN and normalizes only its generic meta diagnostic", async () => {
  const { aggregate, validated, classification } = await classifyFixture({
    applicability: FULL,
    entryOverrides: { api: FAIL_API },
  });
  const api = aggregate.branches.find((branch) => branch.branch === "api");
  assert.equal(validated.valid, true);
  assert.equal(api.validity, "INVALID");
  assert.deepEqual(api.reason_codes, ["PRODUCT_FAILURE"]);
  assert.deepEqual(validated.reason_codes, ["PRODUCT_FAILURE"]);
  assert.deepEqual(classification, {
    route: "RETURN_TO_IN_PROGRESS",
    target_state: "in_progress",
    verdict: "fail",
    checks: aggregate.branches.map((branch) => expectedCheck(branch, branch.branch === "api" ? "failed" : "passed")),
  });
});

test("authenticated confirmed finding is also RETURN", async () => {
  const { aggregate, classification } = await classifyFixture({
    applicability: FULL,
    entryOverrides: { api: { confirmed_findings: 1 } },
  });
  assert.deepEqual(classification, {
    route: "RETURN_TO_IN_PROGRESS",
    target_state: "in_progress",
    verdict: "fail",
    checks: aggregate.branches.map((branch) => expectedCheck(branch, branch.branch === "api" ? "failed" : "passed")),
  });
});

test("uncertainty and mixed blocker shapes HOLD without a fabricated failed check", async (t) => {
  const cases = [
    ["finding on N/A branch", { applicability: DOCS, entryOverrides: { api: { confirmed_findings: 1 } } }],
    ["product failure plus unverified evidence", { applicability: FULL, entryOverrides: { api: { ...FAIL_API, evidence_status: "UNVERIFIED" } } }],
    ["product failure plus low confidence", { applicability: FULL, entryOverrides: { api: { ...FAIL_API, confidence: 0.1 } } }],
    ["inconclusive infrastructure failure", { applicability: FULL, entryOverrides: { api: { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0, code: "TRANSPORT_FAILURE" } } }],
    ["missing required evidence", { applicability: FULL, entryOverrides: { api: { evidence_status: "UNVERIFIED" } } }],
    ["zero required checks", { applicability: NONE, profileOverrides: { environment: { strategy: "none" } } }],
  ];
  for (const [name, options] of cases) await t.test(name, async () => {
    const { classification } = await classifyFixture(options);
    assert.deepEqual(
      { route: classification.route, target_state: classification.target_state, verdict: classification.verdict },
      HOLD,
    );
    assert.equal(classification.checks.some(({ status }) => status === "failed"), false);
    if (name === "zero required checks") assert.deepEqual(classification.checks, []);
  });
});

test("invalid cyclic proxy and unknown inputs HOLD with no checks", () => {
  const cyclic = {}; cyclic.aggregate = cyclic;
  const hostile = new Proxy({}, { ownKeys() { throw new Error("hostile"); } });
  for (const input of [null, {}, { valid: false, aggregate: null, reason_codes: ["UNKNOWN"] }, cyclic, hostile]) {
    assert.deepEqual(classifyValidatedRelease(input), { ...HOLD, checks: [] });
  }
});
```

The public contract under test is:

```js
export const RELEASE_ROUTES = Object.freeze([
  "READY_FOR_PRODUCTION",
  "RETURN_TO_IN_PROGRESS",
  "HOLD_IN_READY_FOR_QA",
]);

export function classifyValidatedRelease(input) {
  // Guard and extract valid, aggregate, and reason_codes inside the function;
  // do not destructure the parameter before the fail-closed try/catch.
  return { route, target_state, verdict, checks };
}
```

- [ ] **Step 2: Run RED for the absent policy module**

Run:

```bash
node --test tests/qah/release-policy.test.mjs
```

Expected: non-zero exit because `scripts/qah/release-policy.mjs` does not exist.

- [ ] **Step 3: Implement the minimal deterministic classifier**

In `scripts/qah/release-policy.mjs`, use the canonical branch order `code`, `api`, `ui`, `domain` and the exact mapping:

```js
export const RELEASE_CLASSIFICATIONS = Object.freeze({
  READY_FOR_PRODUCTION: Object.freeze({ target_state: "ready_for_production", verdict: "pass" }),
  RETURN_TO_IN_PROGRESS: Object.freeze({ target_state: "in_progress", verdict: "fail" }),
  HOLD_IN_READY_FOR_QA: Object.freeze({ target_state: "ready_for_qa", verdict: "blocked" }),
});
```

Implement these rules in order:

1. Reject malformed input to HOLD.
2. Select only branches with `applicability === "REQUIRED"`.
3. Every check requires evidence `VERIFIED`, confidence meeting `aggregate.confidence_threshold`, the exact expected environment (`HEALTHY` for managed or `NOT_REQUIRED` for repository-only), and an exact document/evidence UUID pair in `artifacts.evidence`.
4. A passed check additionally requires branch validity `VALID`, empty branch reasons, `product_result === "PASS"`, and `confirmed_findings === 0`.
5. A failed check additionally requires branch validity `INVALID`, a non-empty branch-reason set containing only `PRODUCT_FAILURE` and/or `CONFIRMED_FINDINGS`, plus `product_result === "FAIL"` or `confirmed_findings > 0`.
6. READY requires `valid === true`, no reasons, `invariants_passed === true`, at least one required branch, every required branch represented by a check, and every check passed.
7. RETURN requires `valid === true`, at least one required branch, every required branch represented, at least one failed check, and every reason belonging to the closed set `PRODUCT_FAILURE`, `CONFIRMED_FINDINGS`.
8. HOLD wins for every other combination, including a product-failure reason mixed with any blocker.
9. A HOLD result returns only eligible passed checks; it removes every failed check. This guarantees that a mixed product-failure-plus-blocker result cannot reach the Proof Gate as a product failure.

Checks have exactly these keys:

```js
const check = {
  name: `universal_qah_${branch.branch}`,
  status: branchHasProductFailure ? "failed" : "passed",
  evidence: `artifact:${branch.artifacts.evidence.artifact_id}@${branch.artifacts.evidence.version_id}`,
};
```

- [ ] **Step 4: Route `decideRelease` through the classifier**

In `scripts/qah/decide.mjs`:

- import `RELEASE_ROUTES` and `classifyValidatedRelease`;
- build the private `ROUTES` set from `RELEASE_ROUTES`;
- keep both public signatures unchanged;
- inside `validateAggregateForDecision`, after `policyShapeIsAuthenticated` is proven, remove `INVALID_AGGREGATE_POLICY` from the returned `reason_codes` only when every invalid required branch has a non-empty reason subset of `PRODUCT_FAILURE`/`CONFIRMED_FINDINGS`, every other required branch is a valid verified PASS, aggregate reasons are a non-empty subset of those same two codes, and no blocker is present; preserve that diagnostic for every other shape;
- after `validateAggregateForDecision` returns those normalized reasons, call the classifier with `valid`, authenticated `aggregate`, and `reason_codes`;
- use only `classification.route` in `decisionFrom`;
- change the catch route from `RETURN_TO_IN_PROGRESS` to `HOLD_IN_READY_FOR_QA` with `INVALID_AGGREGATE_INPUT`;
- keep `AUTHENTICATED_OUTCOME_REASONS` unchanged because authenticated infra/evidence failures must reach the classifier and become HOLD;
- continue rejecting caller route proposals through `policy_override_rejected`.

In `scripts/qah/render-comment.mjs`, allow exactly the three values in `RELEASE_ROUTES` inside the private decision validator. Do not change the decision schema, digest, marker, receipt, or comment read-back contracts.

- [ ] **Step 5: Update decision regressions to the new fail-closed semantics**

In `tests/qah/decision.test.mjs`:

- keep authenticated applicable product failure and confirmed finding assertions on RETURN;
- change low confidence, infra, missing/unverified evidence, invalid aggregate, tampered aggregate, cyclic input, Proxy input, and unknown input expectations to HOLD;
- add explicit N/A-finding and product-failure-plus-blocker HOLD cases;
- assert the exact current authenticated product-failure shape (`valid:true`, branch `validity:"INVALID"`) normalizes only the generic meta-diagnostic and still preserves `PRODUCT_FAILURE` or `CONFIRMED_FINDINGS`;
- assert `policy_override_rejected` for proposed READY or RETURN when policy selects HOLD;
- assert a proposed HOLD has no authority to override READY or RETURN.

- [ ] **Step 6: Run GREEN and focused decision regressions**

Run:

```bash
node --test tests/qah/release-policy.test.mjs tests/qah/decision.test.mjs
```

Expected: all tests pass and no uncertainty case returns `RETURN_TO_IN_PROGRESS`.

- [ ] **Step 7: Commit the policy boundary**

Run:

```bash
git add scripts/qah/release-policy.mjs scripts/qah/decide.mjs scripts/qah/render-comment.mjs tests/qah/release-policy.test.mjs tests/qah/decision.test.mjs
git diff --cached --check
git commit -m "feat: classify closed qah release outcomes"
test -z "$(git status --short)"
```

---

## Task 3: Admit finalization only after comment, cleanup, and policy agreement

**Files:**

- Modify: `scripts/qah/finalize.mjs`
- Modify: `tests/qah/finalize.test.mjs`

- [ ] **Step 1: Write finalization admission RED tests**

In `tests/qah/finalize.test.mjs`, extend the existing finalize import to include the two new APIs and append this complete block. It deliberately reuses the file-local `trustedFixture`, `publicationInput`, `finalizationInput`, `stoppedReceipt`, `boundedCommentList`, and `publishComment` helpers.

```js
import {
  finalizeTransition,
  finalizeTransitionAdmission,
  validateFinalizationClassification,
} from "../../scripts/qah/finalize.mjs";

const ADMITTED_KEYS = [
  "checks", "kind", "reason_codes", "schema_version", "target_state",
  "tested_head_sha", "transition_allowed", "verdict",
];
const DIAGNOSTIC_KEYS = ["reason_codes", "schema_version", "target_state", "transition_allowed"];

async function admit(fixture) {
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  return finalizeTransitionAdmission(
    finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)),
    fixture.dependencies,
  );
}

test("admission returns the exact PASS report plus separate trusted authority", async () => {
  const fixture = await trustedFixture();
  const admitted = await admit(fixture);
  assert.deepEqual(Object.keys(admitted).sort(), ["aggregate", "decision", "report"]);
  assert.deepEqual(Object.keys(admitted.report).sort(), ADMITTED_KEYS);
  assert.deepEqual(admitted.report, {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: true,
    target_state: "ready_for_production",
    reason_codes: [],
    kind: "qa",
    verdict: "pass",
    tested_head_sha: fixture.aggregate.commit,
    checks: fixture.aggregate.branches.map((branch) => ({
      name: `universal_qah_${branch.branch}`,
      status: "passed",
      evidence: `artifact:${branch.artifacts.evidence.artifact_id}@${branch.artifacts.evidence.version_id}`,
    })),
  });
  assert.deepEqual(admitted.aggregate, fixture.aggregate);
  assert.deepEqual(admitted.decision, fixture.decision);
  assert.notEqual(admitted.aggregate, fixture.aggregate);
  assert.notEqual(admitted.decision, fixture.decision);
});

test("admission returns exact FAIL and HOLD reports without laundering blockers", async (t) => {
  const cases = [
    ["product failure", {
      fixture: {
        entryOverrides: { api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION", observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } },
        expectedRoute: "RETURN_TO_IN_PROGRESS",
      },
      expected: { target_state: "in_progress", verdict: "fail", failed: ["universal_qah_api"] },
    }],
    ["infrastructure uncertainty", {
      fixture: {
        entryOverrides: { api: { product_result: "INCONCLUSIVE", environment_status: "INFRA_FAILURE", evidence_status: "UNVERIFIED", confidence: 0, code: "TRANSPORT_FAILURE" } },
        expectedRoute: "HOLD_IN_READY_FOR_QA",
      },
      expected: { target_state: "ready_for_qa", verdict: "blocked", failed: [] },
    }],
  ];
  for (const [name, row] of cases) await t.test(name, async () => {
    const fixture = await trustedFixture(row.fixture);
    const admitted = await admit(fixture);
    assert.deepEqual(Object.keys(admitted.report).sort(), ADMITTED_KEYS);
    assert.equal(admitted.report.target_state, row.expected.target_state);
    assert.equal(admitted.report.verdict, row.expected.verdict);
    assert.deepEqual(admitted.report.checks.filter(({ status }) => status === "failed").map(({ name: checkName }) => checkName), row.expected.failed);
    assert.equal(admitted.report.tested_head_sha, fixture.aggregate.commit);
  });
});

test("every post-review integrity failure returns only a neutral diagnostic", async () => {
  const fixture = await trustedFixture();
  const receipt = await publishComment(publicationInput(fixture), fixture.dependencies);
  fixture.dependencies.listIssueComments = async () => boundedCommentList(fixture.state.comments, { complete: false });
  const admitted = await finalizeTransitionAdmission(
    finalizationInput(fixture, receipt, stoppedReceipt(fixture.aggregate)),
    fixture.dependencies,
  );
  assert.deepEqual(admitted, {
    report: {
      schema_version: "nuanu.qa-finalization-result.v1",
      transition_allowed: false,
      target_state: "ready_for_qa",
      reason_codes: ["COMMENT_READBACK_INVALID"],
    },
    aggregate: null,
    decision: null,
  });
  assert.deepEqual(Object.keys(admitted.report).sort(), DIAGNOSTIC_KEYS);
});

test("pure classification agreement rejects a digest-valid route mismatch", async () => {
  const fixture = await trustedFixture();
  const { decision_sha256: ignored, ...unsigned } = fixture.decision;
  const mismatchedUnsigned = { ...unsigned, route: "RETURN_TO_IN_PROGRESS" };
  const mismatched = { ...mismatchedUnsigned, decision_sha256: sha256(mismatchedUnsigned) };
  assert.throws(
    () => validateFinalizationClassification({ aggregate: fixture.aggregate, decision: mismatched }),
    /FINALIZATION_CLASSIFICATION_INVALID/,
  );
});
```

Keep the existing `strategy none` test repository-only: change its applicability to `code: "REQUIRED"` and only `api`, `ui`, and `domain` to `NOT_APPLICABLE`, so a legitimate PASS always carries at least one exact evidence check.

Update every pre-existing diagnostic assertion in this file from `in_progress` or `ready_for_production` to `ready_for_qa`, and update the two old successful four-field expectations to the eight-field admitted report asserted above. Do not delete the existing comment, cleanup, TOCTOU, identity, and resolver regression cases.

- [ ] **Step 2: Run RED against the three-field finalizer**

Run:

```bash
node --test tests/qah/finalize.test.mjs
```

Expected: non-zero exit because the current successful result has only three decision-derived fields and every diagnostic still targets `in_progress`.

- [ ] **Step 3: Add the admission API while preserving the old wrapper**

Export this exact interface from `scripts/qah/finalize.mjs`:

```js
export function validateFinalizationClassification({ aggregate, decision }) {
  return classification;
}

export async function finalizeTransitionAdmission(input, dependencies = {}) {
  return { report, aggregate, decision };
}

export async function finalizeTransition(input, dependencies = {}) {
  return (await finalizeTransitionAdmission(input, dependencies)).report;
}
```

For an admitted result:

1. Reuse `resolveTrustedPublication`, exact marker/comment read-back, and cleanup verification.
2. Call `validateFinalizationClassification({ aggregate: trusted.aggregate, decision: trusted.decision })`; that pure boundary checks exact input keys, calls `classifyValidatedRelease({ valid: true, aggregate, reason_codes: decision.reason_codes })`, throws `FINALIZATION_CLASSIFICATION_INVALID` unless `classification.route === decision.route`, and returns the classification.
3. Return this exact report shape plus separate structured clones of the trusted aggregate and trusted decision:

```js
{
  schema_version: "nuanu.qa-finalization-result.v1",
  transition_allowed: true,
  target_state: classification.target_state,
  reason_codes: [],
  kind: "qa",
  verdict: classification.verdict,
  tested_head_sha: trusted.aggregate.commit,
  checks: classification.checks,
}
```

For any integrity failure, return `aggregate: null`, `decision: null`, and exactly:

```js
{
  schema_version: "nuanu.qa-finalization-result.v1",
  transition_allowed: false,
  target_state: "ready_for_qa",
  reason_codes: [...new Set(reasons)].sort(),
}
```

Do not place the aggregate or decision inside `report`; both are in-memory authority for the next adapter only.

- [ ] **Step 4: Run GREEN and the decision/finalization pair**

Run:

```bash
node --test tests/qah/release-policy.test.mjs tests/qah/decision.test.mjs tests/qah/finalize.test.mjs
```

Expected: all tests pass; blocker precedence remains intact through finalization.

- [ ] **Step 5: Commit the admission boundary**

Run:

```bash
git add scripts/qah/finalize.mjs tests/qah/finalize.test.mjs
git diff --cached --check
git commit -m "feat: admit trusted qah finalization claims"
test -z "$(git status --short)"
```

---

## Task 4: Materialize an exact FlowStepResult through the current worker transport

**Files:**

- Create: `scripts/qah/claim-adapter.mjs`
- Create: `tests/qah/claim-adapter.test.mjs`
- Modify: `scripts/qah/aggregate.mjs`
- Modify: `tests/qah/aggregate.test.mjs`

- [ ] **Step 1: Write claim-adapter RED tests**

Create `tests/qah/claim-adapter.test.mjs` with the following imports, fixtures, and complete positive/negative table. The test owns only synthetic immutable records; it reuses the existing aggregate fixture and the byte-pinned worker canonicalizer.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { canonicalJson, sha256 } from "../../scripts/qah/canonical.mjs";
import { decideRelease, validateAggregateForDecision } from "../../scripts/qah/decide.mjs";
import { classifyValidatedRelease } from "../../scripts/qah/release-policy.mjs";
import {
  buildFinalizationFlowStepResult,
  encodeFinalizationWorkerTransport,
  materializeFinalizationWorkerTransport,
} from "../../scripts/qah/claim-adapter.mjs";
import { loadWorkerCompletionValidator } from "./helpers/worker-contract.mjs";
import { aggregateFixture, aggregateFixtureResult, material } from "./aggregate.test.mjs?fixtures-only";

const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
const REPORT_REF = Object.freeze({
  artifact_id: "12121212-1212-4212-8212-121212121212",
  version_id: "13131313-1313-4313-8313-131313131313",
  kind: "document",
  role: "output",
});
const FINALIZER_OUTPUT = Object.freeze({
  data: {
    transition_allowed: { type: "boolean", description: "True only after authoritative comment and cleanup verification" },
    target_state: { type: "string", description: "ready_for_production, in_progress, or ready_for_qa" },
    reason_codes: { type: "json", description: "Closed sorted finalization reason codes" },
    kind: { type: "string", description: "Literal qa admitted by QAH" },
    verdict: { type: "string", description: "pass, fail, or blocked admitted by QAH" },
    tested_head_sha: { type: "string", description: "Exact trusted 40-character repository commit" },
    checks: { type: "json", description: "Closed checks derived from exact verified branch ArtifactVersions" },
  },
  artifacts: {
    finalization_report: {
      kind: "document",
      description: "Verified final transition gate result",
      restrictions: { media_types: ["application/json"] },
    },
  },
});

function installReport(fixture, report, overrides = {}) {
  const bytes = Buffer.from(canonicalJson(report));
  fixture.store.set(`${REPORT_REF.artifact_id}@${REPORT_REF.version_id}`, {
    workspace_id: WORKSPACE_ID,
    enforced_max_bytes: null,
    byte_length: bytes.byteLength,
    links: [],
    artifact: {
      id: REPORT_REF.artifact_id,
      workspace_id: WORKSPACE_ID,
      status: "stored",
      current_version: REPORT_REF.version_id,
      kind: "document",
      name: "finalization.json",
      mime_type: "application/json",
      versions: [{
        id: REPORT_REF.version_id,
        version: 1,
        file_asset: "14141414-1414-4414-8414-141414141414",
        size: bytes.byteLength,
        checksum: createHash("sha256").update(bytes).digest("hex"),
      }],
    },
    bytes,
    ...overrides,
  });
  return structuredClone(REPORT_REF);
}

async function adapterCase({ entryOverrides = {} } = {}) {
  const fixture = aggregateFixture({ entryOverrides });
  const aggregate = await aggregateFixtureResult(fixture);
  const validated = await validateAggregateForDecision(aggregate, fixture.dependencies);
  const decision = await decideRelease(aggregate, {}, fixture.dependencies);
  const classification = classifyValidatedRelease(validated);
  const report = {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: true,
    target_state: classification.target_state,
    reason_codes: [],
    kind: "qa",
    verdict: classification.verdict,
    tested_head_sha: aggregate.commit,
    checks: classification.checks,
  };
  const finalization_report = installReport(fixture, report);
  return {
    fixture,
    report,
    input: { workspace_id: WORKSPACE_ID, finalization_report, expected_report: report, aggregate, decision },
  };
}

function rewriteInstalledReport({ fixture, input }) {
  const bytes = Buffer.from(canonicalJson(input.expected_report));
  const record = material(fixture.store, REPORT_REF);
  record.byte_length = bytes.byteLength;
  record.bytes = bytes;
  record.artifact.versions[0].size = bytes.byteLength;
  record.artifact.versions[0].checksum = createHash("sha256").update(bytes).digest("hex");
}

function redigestDecision(decision, changes) {
  const { decision_sha256: ignored, ...unsigned } = decision;
  const changed = { ...unsigned, ...changes };
  return { ...changed, decision_sha256: sha256(changed) };
}

test("PASS FAIL and blocked claims have one exact closed FlowStepResult shape", async (t) => {
  const rows = [
    ["pass", {}, "pass", "ready_for_production", ["passed"]],
    ["fail", { api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION", observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } }, "fail", "in_progress", ["failed", "passed"]],
    ["blocked", { api: { evidence_status: "UNVERIFIED" } }, "blocked", "ready_for_qa", ["passed"]],
  ];
  for (const [name, entryOverrides, verdict, target, allowedStatuses] of rows) await t.test(name, async () => {
    const { fixture, input } = await adapterCase({ entryOverrides });
    const flow = await buildFinalizationFlowStepResult(input, fixture.dependencies);
    assert.deepEqual(Object.keys(flow), ["schema_version", "item"]);
    assert.equal(flow.schema_version, "nuanu.flow-step-result.v1");
    assert.deepEqual(Object.keys(flow.item).sort(), ["artifacts", "data", "description", "key"]);
    assert.deepEqual(Object.keys(flow.item.data).sort(), ["checks", "kind", "reason_codes", "target_state", "tested_head_sha", "transition_allowed", "verdict"]);
    assert.deepEqual(Object.keys(flow.item.artifacts), ["finalization_report"]);
    assert.equal(flow.item.data.verdict, verdict);
    assert.equal(flow.item.data.target_state, target);
    assert.equal(flow.item.data.checks.every(({ status }) => allowedStatuses.includes(status)), true);
    if (verdict === "pass") assert.ok(flow.item.data.checks.length > 0);
    if (verdict === "fail") assert.ok(flow.item.data.checks.some(({ status }) => status === "failed"));
    if (verdict === "blocked") assert.equal(flow.item.data.checks.some(({ status }) => status === "failed"), false);
  });
});

test("worker 0.3.14 canonicalizes the raw ref and only canonical result materializes", async () => {
  const { fixture, input } = await adapterCase();
  const flow = await buildFinalizationFlowStepResult(input, fixture.dependencies);
  const raw = encodeFinalizationWorkerTransport(flow);
  const { buildCanonicalCompletion } = await loadWorkerCompletionValidator();
  const completion = buildCanonicalCompletion({
    task_id: "task-finalize",
    attempt: 1,
    request: { process: { step_key: "finalize_transition" }, output_definition: FINALIZER_OUTPUT },
  }, { output: canonicalJson(raw), publishedArtifacts: [] });
  assert.deepEqual(completion.result.artifact_outputs["item.artifacts.finalization_report"], {
    mode: "reference",
    artifact: REPORT_REF,
  });
  assert.throws(() => materializeFinalizationWorkerTransport(raw), /worker|canonical|reference/i);
  assert.deepEqual(materializeFinalizationWorkerTransport(completion.result), flow);
  assert.throws(() => encodeFinalizationWorkerTransport({ ...flow, extra: true }));
  for (const hostile of [
    { ...completion.result, extra: true },
    { ...completion.result, qa_proof_claim: {} },
    { ...completion.result, artifact_outputs: {} },
    { ...completion.result, artifact_outputs: { "item.artifacts.finalization_report": REPORT_REF } },
    { ...completion.result, artifact_outputs: { "item.artifacts.finalization_report": { mode: "latest", artifact: REPORT_REF } } },
    { ...completion.result, item: { ...completion.result.item, data: { ...completion.result.item.data, extra: true } } },
  ]) assert.throws(() => materializeFinalizationWorkerTransport(hostile));
});

test("claim authority rejects semantic and immutable-Artifact substitutions", async (t) => {
  const semanticRows = [
    ["empty PASS evidence", async ({ input }) => { input.expected_report.checks = []; }],
    ["failed PASS check", async ({ input }) => { input.expected_report.checks[0].status = "failed"; }],
    ["target mismatch", async ({ input }) => { input.expected_report.target_state = "in_progress"; }],
    ["arbitrary evidence", async ({ input }) => { input.expected_report.checks[0].evidence = "https://example.invalid/evidence"; }],
    ["extra report key", async ({ input }) => { input.expected_report.qa_proof_claim = {}; }],
    ["bad report schema", async ({ input }) => { input.expected_report.schema_version = "nuanu.qa-finalization-result.v2"; }],
    ["false transition", async ({ input }) => { input.expected_report.transition_allowed = false; }],
    ["non-empty finalization reasons", async ({ input }) => { input.expected_report.reason_codes = ["PRODUCT_FAILURE"]; }],
  ];
  for (const [name, mutate] of semanticRows) await t.test(name, async () => {
    const state = await adapterCase();
    await mutate(state);
    rewriteInstalledReport(state);
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  const structuralAndArtifactRows = [
    ["extra input root key", async ({ input }) => { input.extra = true; }],
    ["wrong immutable version", async ({ input }) => { input.finalization_report.version_id = "15151515-1515-4515-8515-151515151515"; }],
    ["wrong ref role", async ({ input }) => { input.finalization_report.role = "evidence"; }],
    ["cross workspace", async ({ fixture }) => { material(fixture.store, REPORT_REF).workspace_id = "16161616-1616-4616-8616-161616161616"; }],
    ["wrong name", async ({ fixture }) => { material(fixture.store, REPORT_REF).artifact.name = "latest.json"; }],
    ["wrong MIME", async ({ fixture }) => { material(fixture.store, REPORT_REF).artifact.mime_type = "text/plain"; }],
    ["wrong checksum", async ({ fixture }) => { material(fixture.store, REPORT_REF).artifact.versions[0].checksum = "f".repeat(64); }],
    ["wrong bytes", async ({ fixture }) => { material(fixture.store, REPORT_REF).bytes = Buffer.from("{}"); }],
  ];
  for (const [name, mutate] of structuralAndArtifactRows) await t.test(name, async () => {
    const state = await adapterCase();
    await mutate(state);
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  for (const [name, entryOverrides, mutate] of [
    ["fail without failed check", { api: { product_result: "FAIL", code: "API_CONTRACT_VIOLATION", observations: [{ code: "CONTRACT_FAILED", status: "FAIL", value_sha256: sha256("fail") }] } }, (report) => { for (const check of report.checks) check.status = "passed"; }],
    ["blocked with failed check", { api: { evidence_status: "UNVERIFIED" } }, (report) => { report.checks[0].status = "failed"; }],
  ]) await t.test(name, async () => {
    const state = await adapterCase({ entryOverrides });
    mutate(state.input.expected_report);
    rewriteInstalledReport(state);
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  for (const [name, changes] of [
    ["foreign route", { route: "RETURN_TO_IN_PROGRESS" }],
    ["foreign aggregate digest", { aggregate_sha256: `sha256:${"f".repeat(64)}` }],
    ["foreign outcome reasons", { reason_codes: ["PRODUCT_FAILURE"] }],
  ]) await t.test(name, async () => {
    const state = await adapterCase();
    state.input.decision = redigestDecision(state.input.decision, changes);
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  await t.test("raw decision digest corruption", async () => {
    const state = await adapterCase();
    state.input.decision.decision_sha256 = `sha256:${"0".repeat(64)}`;
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });

  for (const [name, mutate] of [
    ["branch evidence wrong workspace", (record) => { record.workspace_id = "20202020-2020-4020-8020-202020202020"; }],
    ["branch evidence wrong checksum", (record) => { record.artifact.versions[0].checksum = "f".repeat(64); }],
    ["branch evidence wrong bytes", (record) => { record.bytes = Buffer.from("{}"); }],
  ]) await t.test(name, async () => {
    const state = await adapterCase();
    const evidenceRef = state.input.aggregate.branches[0].artifacts.evidence;
    mutate(material(state.fixture.store, evidenceRef));
    await assert.rejects(buildFinalizationFlowStepResult(state.input, state.fixture.dependencies));
  });
});
```

The implementation must expose exactly:

```js
export async function buildFinalizationFlowStepResult(input, dependencies = {}) {}
export function encodeFinalizationWorkerTransport(flowStepResult) {}
export function materializeFinalizationWorkerTransport(workerResult) {}
```

- [ ] **Step 2: Run RED for the absent adapter**

Run:

```bash
node --test tests/qah/claim-adapter.test.mjs
```

Expected: non-zero exit because `scripts/qah/claim-adapter.mjs` does not exist.

- [ ] **Step 3: Write and observe the Artifact-slot RED before changing policy**

In `tests/qah/aggregate.test.mjs`, add `resolveArtifactVersionForSlot` to the existing aggregate import and append this exact test. It uses the file-local `materialize`, `material`, `workspaceId`, and fixture resolver.

```js
qtest("finalization_report resolves only exact canonical immutable bytes", async () => {
  const fixture = aggregateFixture();
  const report = {
    schema_version: "nuanu.qa-finalization-result.v1",
    transition_allowed: true,
    target_state: "ready_for_production",
    reason_codes: [],
    kind: "qa",
    verdict: "pass",
    tested_head_sha: "a".repeat(40),
    checks: [{ name: "universal_qah_code", status: "passed", evidence: "artifact:33333333-3333-4333-8333-333333333333@44444444-4444-4444-8444-444444444444" }],
  };
  const ref = materialize(fixture.store, { index: 400, semanticRole: "finalization_report", payload: report });
  material(fixture.store, ref).artifact.name = "finalization.json";
  const resolved = await resolveArtifactVersionForSlot(ref, "finalization_report", {
    workspaceId,
    resolveArtifactVersion: fixture.dependencies.resolveArtifactVersion,
  }, 262_144);
  assert.deepEqual(resolved.reference, ref);
  assert.deepEqual(resolved.payload, report);
  assert.equal(resolved.bytes.toString("utf8"), canonicalJson(report));
});
```

Run only the named test before changing `ARTIFACT_SLOT_POLICY`:

```bash
node --test --test-name-pattern='finalization_report resolves' tests/qah/aggregate.test.mjs
```

Expected: non-zero exit with `INVALID_ARTIFACT_REFERENCE` because the slot is not yet declared. A skipped or zero-test run is not acceptable.

- [ ] **Step 4: Add finalization report to the exact Artifact slot policy and prove hostile records**

In `scripts/qah/aggregate.mjs`, extend `ARTIFACT_SLOT_POLICY` with exactly:

```js
finalization_report: Object.freeze({
  kind: "document",
  role: "output",
  name: "finalization.json",
  media_type: "application/json",
}),
```

Append this mutation table to the same aggregate test file; each case builds a fresh record, changes only one trusted axis, and must reject:

```js
qtest("finalization_report rejects every mutable or mismatched Artifact axis", async (t) => {
  const mutations = [
    ["wrong version", ({ ref }) => { ref.version_id = "17171717-1717-4717-8717-171717171717"; }],
    ["latest substitution", ({ ref, record }) => { record.artifact.current_version = "18181818-1818-4818-8818-181818181818"; ref.version_id = record.artifact.current_version; }],
    ["wrong role", ({ ref }) => { ref.role = "evidence"; }],
    ["wrong workspace", ({ record }) => { record.workspace_id = "19191919-1919-4919-8919-191919191919"; }],
    ["wrong name", ({ record }) => { record.artifact.name = "latest.json"; }],
    ["wrong MIME", ({ record }) => { record.artifact.mime_type = "text/plain"; }],
    ["wrong checksum", ({ record }) => { record.artifact.versions[0].checksum = "f".repeat(64); }],
    ["wrong bytes", ({ record }) => { record.bytes = Buffer.from("{}"); }],
  ];
  for (const [name, mutate] of mutations) await t.test(name, async () => {
    const fixture = aggregateFixture();
    const ref = materialize(fixture.store, { index: 400, semanticRole: "finalization_report", payload: { schema_version: "nuanu.qa-finalization-result.v1" } });
    const record = material(fixture.store, ref);
    record.artifact.name = "finalization.json";
    mutate({ ref, record });
    await assert.rejects(resolveArtifactVersionForSlot(ref, "finalization_report", {
      workspaceId,
      resolveArtifactVersion: fixture.dependencies.resolveArtifactVersion,
    }, 262_144), undefined, name);
  });
});
```

Run:

```bash
node --test --test-name-pattern='finalization_report' tests/qah/aggregate.test.mjs
```

Expected: the positive test and all mutation subtests pass. Do not weaken `resolveArtifactVersionForSlot`.

- [ ] **Step 5: Implement the strict claim adapter**

`buildFinalizationFlowStepResult` accepts exactly:

```js
{
  workspace_id,
  finalization_report,
  expected_report,
  aggregate,
  decision,
}
```

It must:

1. Accept only the admitted eight-key report from Task 3.
2. Require `tested_head_sha === aggregate.commit`.
3. Validate the trusted decision shape/digest, re-derive classification from `aggregate` plus `decision.reason_codes`, require `classification.route === decision.route`, and require exact equality of target, verdict, and checks. Never use the successful finalization report's intentionally empty `reason_codes` as outcome reasons.
4. Require passed checks only from required verified PASS branches and failed checks only from required verified product-failure/finding branches.
5. Re-resolve every branch evidence ref by exact ArtifactVersion.
6. Resolve `finalization_report` through slot `finalization_report` and require canonical payload equality with `expected_report`.
7. Reject all extra keys and nested claim alternatives.
8. Return exactly:

```js
{
  schema_version: "nuanu.flow-step-result.v1",
  item: {
    key: "finalize_transition",
    description: "Universal QAH finalization admitted",
    data: {
      transition_allowed: expected_report.transition_allowed,
      target_state: expected_report.target_state,
      reason_codes: expected_report.reason_codes,
      kind: expected_report.kind,
      verdict: expected_report.verdict,
      tested_head_sha: expected_report.tested_head_sha,
      checks: expected_report.checks,
    },
    artifacts: { finalization_report },
  },
}
```

`encodeFinalizationWorkerTransport` must convert only that exact result to:

```js
{
  item: {
    key: "finalize_transition",
    description: "Universal QAH finalization admitted",
    data: flowStepResult.item.data,
    artifacts: {},
  },
  artifact_outputs: {
    "item.artifacts.finalization_report": flowStepResult.item.artifacts.finalization_report,
  },
}
```

`materializeFinalizationWorkerTransport` is the strict server-boundary decoder, not the inverse of the raw encoder. It accepts only `buildCanonicalCompletion(...).result`, requires `artifact_outputs["item.artifacts.finalization_report"]` to be exactly `{mode:"reference",artifact:ref}`, rejects a raw four-field ref and every extra/missing key, unwraps the exact ref, and returns the exact `nuanu.flow-step-result.v1` above.

- [ ] **Step 6: Run focused GREEN for the core adapter**

Run:

```bash
node --test tests/qah/claim-adapter.test.mjs tests/qah/aggregate.test.mjs tests/qah/finalize.test.mjs
```

Expected: all tests pass; the core adapter has no dependency on the not-yet-updated Process blueprint or task runtime.

- [ ] **Step 7: Commit the core claim boundary**

Run:

```bash
git add scripts/qah/claim-adapter.mjs scripts/qah/aggregate.mjs tests/qah/claim-adapter.test.mjs tests/qah/aggregate.test.mjs
git diff --cached --check
git commit -m "feat: validate trusted qah proof claims"
test -z "$(git status --short)"
```

---

## Task 5: Replace the final variable gateway with the stock Proof Gate

**Files:**

- Modify: `processes/universal-qa-flow.graph.json`
- Modify: `scripts/qah/render-process.mjs`
- Modify: `scripts/qah/task-runtime.mjs`
- Modify: `scripts/qah/local-harness.mjs`
- Modify: `tests/qah/process-blueprint.test.mjs`
- Modify: `tests/qah/task-runtime.test.mjs`
- Modify: `tests/qah/e2e.test.mjs`
- Modify: `tests/qah/task7-round2.test.mjs`

- [ ] **Step 1: Write proof-gate topology RED tests**

In `tests/qah/process-blueprint.test.mjs`, import `validateFinalProofGate` next to `renderProcess` and `renderProcessJson`, add `qa_needs_human_end` after `in_progress_end` in `expectedKeys`, change authored counts to 21/24 and rendered counts to 22/25, and rename the worker-contract title to 0.3.14. Define `const expectedFinalStates = Object.freeze({ ready_for_production_state_id: bindings.ready_for_production_state_id, in_progress_state_id: bindings.in_progress_state_id });`. Replace the old XOR test with this exact block:

```js
test("routes only through the exact stock qa_result_v1 Proof Gate outcomes", () => {
  const graph = renderProcess(blueprint, bindings);
  const nodes = byKey(graph);
  const finalizer = nodes.get("finalize_transition");
  const route = nodes.get("transition_proof_gate");
  const ready = nodes.get("ready_for_production_end");
  const rejected = nodes.get("in_progress_end");
  const hold = nodes.get("qa_needs_human_end");
  assert.deepEqual([finalizer.id, route.id, ready.id, rejected.id, hold.id], [
    "10000000-0000-5000-8000-000000000018",
    "10000000-0000-5000-8000-000000000026",
    "10000000-0000-5000-8000-000000000020",
    "10000000-0000-5000-8000-000000000021",
    "10000000-0000-5000-8000-000000000022",
  ]);
  assert.equal(route.type, "proof_gate");
  assert.deepEqual(route.config, { profile_key: "qa_result_v1", profile_version: "1", ai_assessment: "off" });
  assert.deepEqual(graph.edges.filter(({ target }) => target === route.id), [{
    id: "20000000-0000-5000-8000-000000000022", source: finalizer.id, target: route.id,
  }]);
  assert.deepEqual(graph.edges.filter(({ source }) => source === route.id), [
    { id: "20000000-0000-5000-8000-000000000023", source: route.id, target: ready.id, name: "passed", when: { outcome: "passed" } },
    { id: "20000000-0000-5000-8000-000000000024", source: route.id, target: rejected.id, name: "not_passed", when: { outcome: "not_passed" } },
    { id: "20000000-0000-5000-8000-000000000025", source: route.id, target: hold.id, name: "unable_to_verify", when: { outcome: "unable_to_verify" } },
  ]);
  assert.equal(ready.config.project_status.target_state_id, bindings.ready_for_production_state_id);
  assert.equal(rejected.config.project_status.target_state_id, bindings.in_progress_state_id);
  assert.equal(hold.config.project_status.target_state_id, null);
  for (const edge of graph.edges.filter(({ source }) => source === route.id)) {
    for (const key of ["var", "raw", "otherwise", "branch"]) assert.equal(Object.hasOwn(edge.when, key), false);
  }
  assert.deepEqual(finalizer.config.output.data, {
    transition_allowed: { type: "boolean", description: "True only after authoritative comment and cleanup verification" },
    target_state: { type: "string", description: "ready_for_production, in_progress, or ready_for_qa" },
    reason_codes: { type: "json", description: "Closed sorted finalization reason codes" },
    kind: { type: "string", description: "Literal qa admitted by QAH" },
    verdict: { type: "string", description: "pass, fail, or blocked admitted by QAH" },
    tested_head_sha: { type: "string", description: "Exact trusted 40-character repository commit" },
    checks: { type: "json", description: "Closed checks derived from exact verified branch ArtifactVersions" },
  });
  for (const field of ["kind", "verdict", "tested_head_sha", "checks"]) {
    assert.deepEqual(graph.nodes.filter((node) => Object.hasOwn(node.config?.output?.data ?? {}, field)).map(({ key }) => key), ["finalize_transition"]);
  }
  assert.doesNotThrow(() => validateFinalProofGate(graph, expectedFinalStates));
});

test("final Proof Gate validator rejects every alternate routing dialect", () => {
  const clean = renderProcess(blueprint, bindings);
  const mutations = [
    ["missing outcome", (graph) => { delete graph.edges.find(({ id }) => id.endsWith("025")).when; }],
    ["duplicate outcome", (graph) => { graph.edges.find(({ id }) => id.endsWith("025")).when = { outcome: "passed" }; }],
    ["raw condition", (graph) => { graph.edges.find(({ id }) => id.endsWith("023")).when = { raw: "true" }; }],
    ["var condition", (graph) => { graph.edges.find(({ id }) => id.endsWith("024")).when = { var: "finalize_transition.data.target_state", op: "eq", value: "in_progress" }; }],
    ["wrong profile", (graph) => { byKey(graph).get("transition_proof_gate").config.profile_key = "custom_qa"; }],
    ["wrong profile version", (graph) => { byKey(graph).get("transition_proof_gate").config.profile_version = "2"; }],
    ["non-neutral hold", (graph) => { byKey(graph).get("qa_needs_human_end").config.project_status.target_state_id = bindings.in_progress_state_id; }],
    ["indirect End", (graph) => { graph.edges.find(({ id }) => id.endsWith("025")).target = byKey(graph).get("publication_cleanup_join").id; }],
    ["changed route UUID", (graph) => {
      const route = byKey(graph).get("transition_proof_gate"); const old = route.id;
      route.id = "17171717-1717-4717-8717-171717171717";
      for (const edge of graph.edges) { if (edge.source === old) edge.source = route.id; if (edge.target === old) edge.target = route.id; }
    }],
    ["legacy gateway parallel route", (graph) => {
      graph.nodes.push({
        id: "10000000-0000-5000-8000-000000000019",
        key: "transition_route",
        type: "gateway",
        name: "Legacy final route",
      });
      graph.edges.push({
        id: "20000000-0000-5000-8000-000000000026",
        source: byKey(graph).get("finalize_transition").id,
        target: "10000000-0000-5000-8000-000000000019",
      });
    }],
    ["changed outcome edge UUID", (graph) => { graph.edges.find(({ id }) => id.endsWith("023")).id = "18181818-1818-4818-8818-181818181818"; }],
  ];
  for (const [name, mutate] of mutations) {
    const hostile = structuredClone(clean); mutate(hostile);
    assert.throws(() => validateFinalProofGate(hostile, expectedFinalStates), /FINAL_PROOF_GATE_INVALID/, name);
  }
});
```

Also add `stockProofGateOutput` with exact empty `artifacts` and exact string
definitions for `completion_verification_id`, `outcome`, `reason_code`, and
`resolution`. A dedicated test adds that output to the rendered Proof Gate and
reorders its outcome edges exactly as the server read-back does; it must pass,
while an extra data field, changed description, or Artifact slot must each throw
`FINAL_PROOF_GATE_INVALID`. This models deterministic stock normalization without
weakening authored-graph checks or treating edge-array order as routing authority.

Also add `assert.deepEqual(incoming.get("qa_needs_human_end"), ["transition_proof_gate"]);` to the existing immediate-incoming-edge test.

- [ ] **Step 2: Run RED against the old exclusive gateway**

Run:

```bash
node --test tests/qah/process-blueprint.test.mjs
```

Expected: non-zero exit because the graph still has 20/23 authored topology and `when.var` plus `otherwise`.

- [ ] **Step 3: Apply the exact structured graph change**

In `processes/universal-qa-flow.graph.json`:

1. Change `resolve_flow_item` instruction text from worker 0.3.13 to worker 0.3.14.
2. Extend the decision instruction's final sentence to: `Runtime выдаёт только READY_FOR_PRODUCTION, RETURN_TO_IN_PROGRESS либо HOLD_IN_READY_FOR_QA.`
3. Replace the finalizer instruction with this exact text:

```text
Ты финализируешь только из непосредственных {{input.publish_flow_item_comment}} и {{input.cleanup_environment}}. Через task-scoped Nuanu MCP повторно прочитай exact source/review и raw полный get_issue_comments; node scripts/qah/task-runtime.mjs normalize-comments использует --output-dir "$NUANU_TASK_DIR/qah/finalize-transition". Затем запусти node scripts/qah/task-runtime.mjs finalize-transition с phase=prepare и тем же output-dir. При failed ProcessItem, неединственном marker, неточной cleanup receipt или transition_allowed=false это ошибка: runtime завершится nonzero, не создавай ProcessItem и не достигай Proof Gate/End. При успехе опубликуй finalization.json как item.artifacts.finalization_report, затем через get_artifact прочитай actual exact ArtifactVersion, повтори raw полный get_issue_comments и normalize-comments, добавь ArtifactVersion и свежую comment attestation в новый resolver bundle; передай phase=complete input с тем же finalization_input и actual ref ровно artifact_id, version_id, kind, role, затем верни только runtime completion с плоскими kind, verdict, tested_head_sha и checks. Не синтезируй эти поля вручную и статус не меняй.
```

4. Replace `finalize_transition.config.output.data` with these exact bytes after JSON formatting:

```json
{
  "transition_allowed": { "type": "boolean", "description": "True only after authoritative comment and cleanup verification" },
  "target_state": { "type": "string", "description": "ready_for_production, in_progress, or ready_for_qa" },
  "reason_codes": { "type": "json", "description": "Closed sorted finalization reason codes" },
  "kind": { "type": "string", "description": "Literal qa admitted by QAH" },
  "verdict": { "type": "string", "description": "pass, fail, or blocked admitted by QAH" },
  "tested_head_sha": { "type": "string", "description": "Exact trusted 40-character repository commit" },
  "checks": { "type": "json", "description": "Closed checks derived from exact verified branch ArtifactVersions" }
}
```
5. Add node `10000000-0000-5000-8000-000000000026`, key `transition_proof_gate`, type `proof_gate`, with:

```json
{
  "profile_key": "qa_result_v1",
  "profile_version": "1",
  "ai_assessment": "off"
}
```

6. Retarget edge `...022` from `finalize_transition` to the new Proof Gate.
7. Change edge `...023` source/name/condition to the new Proof Gate / `passed` / `{"outcome":"passed"}`.
8. Change edge `...024` source/name/condition to the new Proof Gate / `not_passed` / `{"outcome":"not_passed"}`.
9. Add node `10000000-0000-5000-8000-000000000022`, key `qa_needs_human_end`, name `Keep in Ready for QA`, type `end`, config `{"project_status":{"target_state_id":null}}`.
10. Add edge `20000000-0000-5000-8000-000000000025` from the new Proof Gate to hold End, name `unable_to_verify`, condition `{"outcome":"unable_to_verify"}`.
11. Remove legacy gateway `transition_route` (`...019`) after all three incident edges have been reconnected.

After these exact edits, the canonical parsed-blueprint fingerprint must be:

```text
sha256:b85c9e7490f8abf1812c942527ad0a16181d21db8f9d8f145980306e325ccf34
```

- [ ] **Step 4: Harden renderer validation around the final topology**

In `scripts/qah/render-process.mjs`:

- set `BLUEPRINT_FINGERPRINT` to the exact value above;
- update authored topology counts to 21/24;
- export `validateFinalProofGate(graph, expectedStates)`, requiring the exact two-key `{ ready_for_production_state_id, in_progress_state_id }` object and throwing a `TypeError` whose message begins `FINAL_PROOF_GATE_INVALID:`; it rejects legacy node key `transition_route` and legacy node ID `...019`, checks exact new route ID/type/config, accepts only the authored three-key config or that same config plus the exact four-field server-owned stock output, requires `finalize_transition` to have only the one incoming Proof Gate edge, three unique direct outcome edges, exact target IDs, Ready/In Progress End target-state equality to `expectedStates`, neutral hold target `null`, retained non-route IDs, and absence of `var`, `raw`, `otherwise`, `branch`;
- compare the three Proof Gate outcome edges after sorting only by immutable edge ID, so stock read-back ordering is irrelevant while every edge byte remains exact;
- call it from `validateRenderedGraph` with only the two normalized state IDs from renderer bindings;
- reuse it in Task 7 against the bounded server read-back so local render and live verification enforce one invariant;
- keep `renderProcess`, `renderProcessJson`, `renderProcessForInstall`, and blueprint version unchanged.

- [ ] **Step 5: Run the blueprint GREEN before runtime integration**

Run:

```bash
node --test tests/qah/process-blueprint.test.mjs
```

Expected: all tests pass; final route contains no JavaScript-style variable expression.

- [ ] **Step 6: Write the runtime integration RED before modifying runtime code**

In `tests/qah/task-runtime.test.mjs`, extract the setup already present in `comment publisher and finalizer CLI wrappers consume complete normalized MCP reads end to end` into exactly:

```js
async function preparedFinalizationFixture(t) {
  const root = await mkdtemp(join(tmpdir(), "qah-runtime-finalization-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = aggregateFixture();
  const aggregate = await aggregateFixtureResult(fixture);
  const decision = await decideRelease(aggregate, {}, fixture.dependencies);
  const review_bundle = { artifact_id: "77777777-7777-4777-8777-777777777777", version_id: "88888888-8888-4888-8888-888888888888", kind: "document", role: "evidence" };
  const project_id = "55555555-5555-4555-8555-555555555555";
  const issue_id = "66666666-6666-4666-8666-666666666666";
  const review = {
    schema_version: "nuanu.qa-review-bundle.v1", workspace_id: fixture.input.workspace_id, project_id, work_item_id: issue_id,
    source_artifact: fixture.plan.source_artifact, aggregate, stored_decision: decision,
  };
  const reviewBytes = Buffer.from(canonicalJson(review));
  fixture.store.set(`${review_bundle.artifact_id}@${review_bundle.version_id}`, {
    workspace_id: fixture.input.workspace_id, enforced_max_bytes: null, byte_length: reviewBytes.byteLength,
    links: [
      { entity_type: "project", entity_id: project_id, relation: "output" },
      { entity_type: "work_item", entity_id: issue_id, relation: "output" },
      { entity_type: "process_run", entity_id: aggregate.run_id, relation: "output" },
    ],
    artifact: {
      id: review_bundle.artifact_id, workspace_id: fixture.input.workspace_id, status: "stored", current_version: review_bundle.version_id,
      kind: "document", name: "review-bundle.json", mime_type: "application/json",
      versions: [{ id: review_bundle.version_id, version: 1, file_asset: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", size: reviewBytes.byteLength, checksum: createHash("sha256").update(reviewBytes).digest("hex") }],
    },
    bytes: reviewBytes,
  });
  const publication_input = { workspace_id: fixture.input.workspace_id, project_id, issue_id, source_artifact: fixture.plan.source_artifact, review_bundle };
  const rendered = renderComment({
    source_artifact: fixture.plan.source_artifact, decision, review_bundle,
    review_summary: {
      selected_checks: aggregate.branches.filter((branch) => branch.applicability === "REQUIRED").map((branch) => branch.branch),
      skipped_checks: aggregate.branches.filter((branch) => branch.applicability === "NOT_APPLICABLE").map((branch) => branch.branch),
      commit: aggregate.commit, content_hash: aggregate.content_hash,
      finding_count: aggregate.branches.reduce((sum, branch) => sum + branch.confirmed_findings, 0),
    },
  });
  const rawComment = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", comment_html: rendered.comment_html };
  const publishBundle = serializedBundle(fixture);
  publishBundle.comment_reads = [[], [rawComment]].map((comments) => ({ attestation: normalizeRawIssueComments(comments, {
    workspace_id: fixture.input.workspace_id, project_id, issue_id,
  }) }));
  await runTaskCommand("publish-flow-item-comment", { phase: "prepare", publication_input, completion_context: {
    decision, profile_ref: fixture.input.profile_artifact,
    cleanup_lease: { run_id: aggregate.run_id, attempt_id: aggregate.attempt_id, environment_id: aggregate.environment_id, target_namespace: aggregate.target_namespace, instance_nonce: aggregate.instance_nonce },
  } }, runtimeOptions(root, "publish-flow-item-comment", { resolverBundle: publishBundle }));
  const comment_receipt = JSON.parse(await readFile(join(root, "qah", "publish-flow-item-comment", "comment-receipt.json"), "utf8"));
  const cleanup_receipt = {
    environment_status: "STOPPED", run_id: aggregate.run_id, attempt_id: aggregate.attempt_id,
    environment_id: aggregate.environment_id, target_namespace: aggregate.target_namespace, instance_nonce: aggregate.instance_nonce,
  };
  const finalization_input = { ...publication_input, comment_receipt, cleanup_receipt };
  const prepared = await runTaskCommand("finalize-transition", {
    phase: "prepare", finalization_input,
  }, runtimeOptions(root, "finalize-transition", { resolverBundle: serializedBundle(fixture, [rawComment]) }));
  const reportBytes = await readFile(join(root, "qah", "finalize-transition", "finalization.json"));
  const finalization_report = actualRef();
  fixture.store.set(`${finalization_report.artifact_id}@${finalization_report.version_id}`, {
    workspace_id: fixture.input.workspace_id, enforced_max_bytes: null, byte_length: reportBytes.byteLength, links: [],
    artifact: {
      id: finalization_report.artifact_id, workspace_id: fixture.input.workspace_id, status: "stored", current_version: finalization_report.version_id,
      kind: "document", name: "finalization.json", mime_type: "application/json",
      versions: [{ id: finalization_report.version_id, version: 1, file_asset: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", size: reportBytes.byteLength, checksum: createHash("sha256").update(reportBytes).digest("hex") }],
    },
    bytes: reportBytes,
  });
  const freshResolverBundle = serializedBundle(fixture, [rawComment]);
  const key = `${finalization_report.artifact_id}@${finalization_report.version_id}`;
  const record = freshResolverBundle.artifact_versions.find((entry) => entry.key === key).response;
  return {
    prepared,
    report: JSON.parse(reportBytes.toString("utf8")),
    complete: { phase: "complete", artifact_refs: { finalization_report }, finalization_input },
    runtimeOptions: runtimeOptions(root, "finalize-transition", { resolverBundle: freshResolverBundle }),
    record,
    freshResolverBundle,
  };
}
```

The extracted helper is the sole owner of this fixture; replace the duplicated old end-to-end test with the table below. Add a test named `finalization complete requires fresh admitted authority and exact published report` with these exact assertions:

```js
const state = await preparedFinalizationFixture(t);
assert.equal(state.prepared.files[0].name, "finalization.json");
assert.equal(state.report.transition_allowed, true);
assert.equal(state.report.kind, "qa");
assert.ok(["pass", "fail", "blocked"].includes(state.report.verdict));
const raw = await runTaskCommand("finalize-transition", state.complete, state.runtimeOptions);
assert.deepEqual(Object.keys(raw).sort(), ["artifact_outputs", "item"]);
assert.deepEqual(Object.keys(raw.item.data).sort(), [
  "checks", "kind", "reason_codes", "target_state", "tested_head_sha", "transition_allowed", "verdict",
]);
assert.deepEqual(raw.artifact_outputs, {
  "item.artifacts.finalization_report": state.complete.artifact_refs.finalization_report,
});
```

Use this complete negative mutation table in the same test. Each row must start from a fresh prepared fixture and call complete exactly once:

```js
for (const [name, mutate] of [
  ["missing finalization_input", ({ complete }) => { delete complete.finalization_input; }],
  ["missing report ref", ({ complete }) => { delete complete.artifact_refs.finalization_report; }],
  ["wrong version", ({ complete }) => { complete.artifact_refs.finalization_report.version_id = "17171717-1717-4717-8717-171717171717"; }],
  ["wrong bytes", ({ record }) => { record.bytes_base64 = Buffer.from("{}").toString("base64"); }],
  ["wrong MIME", ({ record }) => { record.artifact.mime_type = "text/plain"; }],
  ["cross workspace", ({ record }) => { record.workspace_id = "18181818-1818-4818-8818-181818181818"; }],
  ["stale comment attestation", ({ freshResolverBundle }) => { freshResolverBundle.comment_reads[0].attestation.complete = false; }],
]) await t.test(name, async () => {
  const state = await preparedFinalizationFixture(t);
  mutate(state);
  await assert.rejects(runTaskCommand("finalize-transition", state.complete, state.runtimeOptions));
});
```

In `tests/qah/e2e.test.mjs`, change the existing mode table to this exact expected matrix and assertions:

```js
const qahBlueprint = JSON.parse(await readFile(new URL("../../processes/universal-qa-flow.graph.json", import.meta.url), "utf8"));
const finalizationOutputDefinition = structuredClone(
  qahBlueprint.graph.nodes.find(({ key }) => key === "finalize_transition").config.output,
);
const finalizationCases = [
  ["pass", "READY_FOR_PRODUCTION", "pass", "ready_for_production", []],
  ["product-failure", "RETURN_TO_IN_PROGRESS", "fail", "in_progress", ["PRODUCT_FAILURE"]],
  ["missing-evidence", "HOLD_IN_READY_FOR_QA", "blocked", "ready_for_qa", [
    "EVIDENCE_NOT_VERIFIED", "INFRA_FAILURE", "INVALID_AGGREGATE_POLICY", "LOW_CONFIDENCE", "REQUIRED_BRANCH_NOT_PASS",
  ]],
];
for (const [mode, route, verdict, target, reason_codes] of finalizationCases) {
  const result = await runLocalQaHarness({ fixture: "mixed", mode, buildCanonicalCompletion, finalizationOutputDefinition });
  assert.deepEqual(result.publication_validation, { valid: true, reason_codes });
  assert.equal(result.decision.route, route);
  assert.equal(result.finalization_flow_step_result.item.data.verdict, verdict);
  assert.equal(result.finalization_flow_step_result.item.data.target_state, target);
  assert.equal(result.finalization_flow_step_result.item.data.tested_head_sha, result.aggregate.commit);
  assert.equal(result.finalization_flow_step_result.item.data.checks.every(({ evidence }) => /^artifact:[0-9a-f-]{36}@[0-9a-f-]{36}$/.test(evidence)), true);
  assert.equal("artifact_outputs" in result.finalization_flow_step_result, false);
  if (verdict === "blocked") assert.equal(result.finalization_flow_step_result.item.data.checks.some(({ status }) => status === "failed"), false);
}
```

Import the pinned `{ buildCanonicalCompletion }` from `loadWorkerCompletionValidator()` in the test. Update every pre-existing `runLocalQaHarness({ fixture ... })` call in `tests/qah/e2e.test.mjs` to include both `buildCanonicalCompletion` and `finalizationOutputDefinition`; `scripts/qah/local-harness.mjs` has no ambient fallback and throws before execution when either is absent.

In `tests/qah/task7-round2.test.mjs`, replace the current field-name data generator with:

```js
const typedFinalizerData = {
  transition_allowed: true,
  target_state: "ready_for_qa",
  reason_codes: [],
  kind: "qa",
  verdict: "blocked",
  tested_head_sha: "a".repeat(40),
  checks: [],
};
const data = node.key === "finalize_transition"
  ? typedFinalizerData
  : Object.fromEntries(Object.keys(node.config.output.data).map((key) => [key, key === "transition_allowed" ? true : key === "target_state" ? "in_progress" : key === "reason_codes" ? [] : key]));
```

Then assert the finalizer's canonical result materializes through `materializeFinalizationWorkerTransport`, while ordinary tasks preserve their existing envelope.

- [ ] **Step 7: Run the runtime RED**

Run:

```bash
node --test tests/qah/task-runtime.test.mjs tests/qah/e2e.test.mjs tests/qah/task7-round2.test.mjs
```

Expected: non-zero exit because the current runtime neither accepts the fresh complete input nor emits/materializes the seven-field claim. Confirm the named new tests executed and were not skipped.

- [ ] **Step 8: Integrate the task runtime and local harness**

In `scripts/qah/task-runtime.mjs`:

- import `finalizeTransitionAdmission` and the three adapter functions;
- route `finalize-transition` complete before generic `completePreparedTask`;
- keep prepare input exactly `{ phase: "prepare", finalization_input }`;
- on prepare, call admission and throw before any output if `transition_allowed !== true`;
- write canonical `finalization.json` and completion state only for an admitted report;
- accept complete input exactly `{ phase: "complete", artifact_refs: { finalization_report }, finalization_input }`;
- on complete, rerun `finalizeTransitionAdmission` from the freshly supplied resolver bundle;
- never trust `.completion-state.json` as claim authority;
- resolve and compare the published finalization ArtifactVersion;
- build the FlowStepResult, encode it as the raw model transport expected by the worker, and return only that raw transport.

The complete phase receives a fresh resolver bundle containing the actual published finalization ArtifactVersion and a fresh normalized full-comment attestation. Missing/tampered Artifact or stale/missing comment read-back fails before any worker result.

In `scripts/qah/local-harness.mjs`:

- let the generic `complete` helper accept exact additional completion fields;
- pass the original `finalization_input` during finalization complete;
- persist and re-resolve `finalization.json` before complete;
- replace the current incoherent `missing-evidence` injection: do not throw from the code adapter, do not dirty the checkout, and do not delete an API evidence candidate. For only the required API branch in `mode === "missing-evidence"`, have `adapterExecution` return the exact authenticated blocker axes `{ product_result:"INCONCLUSIVE", environment_status:"INFRA_FAILURE", evidence_status:"UNVERIFIED", confidence:0 }`, code `TRANSPORT_FAILURE`, and one bounded `document` candidate describing the failed probe. That Artifact is diagnostic custody, not verified product evidence; its presence prevents the unrelated `EVIDENCE_KIND_MISMATCH` while `evidence_status` remains `UNVERIFIED`;
- keep the existing `validateAggregateForDecision(aggregate, dependencies)` boundary before comment publication, require `valid === true`, and expose only frozen `{ valid, reason_codes }` as `publication_validation` in the local result. Never bypass, coerce, or replace publication validation for HOLD;
- accept injected `buildCanonicalCompletion` and `finalizationOutputDefinition` values in `runLocalQaHarness`; production code must not import a test helper, plugin-cache path, test fixture, or renderer binding;
- strictly validate that `finalizationOutputDefinition` has only `data` and `artifacts`, the exact seven data descriptors and one `finalization_report` descriptor already asserted by the blueprint test, then pass raw runtime transport to the injected canonicalizer and store `finalization_raw_transport`, `finalization_canonical_completion`, and `finalization_flow_step_result` separately;
- reject raw transport passed directly to the materializer;
- retain modes `pass`, `product-failure`, and `missing-evidence`.

- [ ] **Step 9: Run focused cross-layer GREEN**

Run:

```bash
node --test tests/qah/process-blueprint.test.mjs tests/qah/claim-adapter.test.mjs tests/qah/aggregate.test.mjs tests/qah/finalize.test.mjs tests/qah/task-runtime.test.mjs tests/qah/e2e.test.mjs tests/qah/task7-round2.test.mjs
```

Expected: all tests pass and no diagnostic finalization emits a ProcessItem.

- [ ] **Step 10: Commit the Process and runtime boundary together**

Run:

```bash
git add processes/universal-qa-flow.graph.json scripts/qah/render-process.mjs scripts/qah/task-runtime.mjs scripts/qah/local-harness.mjs tests/qah/process-blueprint.test.mjs tests/qah/task-runtime.test.mjs tests/qah/e2e.test.mjs tests/qah/task7-round2.test.mjs
git diff --cached --check
git commit -m "feat: route universal qah through trusted proof gate"
test -z "$(git status --short)"
```

---

## Task 6: Add the operator runbook and prove the complete local product

**Files:**

- Create: `docs/operations/universal-qa-proof-gate-runbook.md`
- Create: `scripts/qah/preflight-report.mjs`
- Create: `tests/qah/preflight-report.test.mjs`
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Write a RED test for the read-only preflight report CLI**

Create `tests/qah/preflight-report.test.mjs` with this exact body:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { canonicalJson } from "../../scripts/qah/canonical.mjs";
import { createPreflightReport, main } from "../../scripts/qah/preflight-report.mjs";

const payload = Object.freeze({
  bindings: { project_process_binding_id: "11111111-1111-4111-8111-111111111111" },
  graph_hash: `sha256:${"a".repeat(64)}`,
  definition_etag: `sha256:${"b".repeat(64)}`,
  profile_digest: `sha256:${"c".repeat(64)}`,
  policy_digest: `sha256:${"d".repeat(64)}`,
  test_mode: false,
  install_ready: false,
  unmet_preconditions: ["public worker observability unavailable"],
});

test("preflight report consumes in-process authority and emits only sanitized canonical fields", async () => {
  const report = await createPreflightReport({ exact: "request" }, {
    environment: { NUANU_API_KEY: "must-not-leak", NUANU_QA_AGENT_KEY: "must-not-leak", NUANU_DECISION_AGENT_KEY: "must-not-leak" },
    runAndConsume: async (request) => { assert.deepEqual(request, { exact: "request" }); return structuredClone(payload); },
  });
  assert.deepEqual(report, { schema_version: "nuanu.qah-preflight-report.v1", ...payload });
  assert.doesNotMatch(canonicalJson(report), /must-not-leak|NUANU_.*KEY/);
});

test("CLI accepts one bounded absolute canonical request and writes canonical JSON only", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-preflight-report-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, "request.json");
  await writeFile(path, canonicalJson({ exact: "request" }));
  let stdout = "";
  await main(["--request", path], {
    environment: {},
    runAndConsume: async () => structuredClone(payload),
    write: (value) => { stdout += value; },
  });
  assert.equal(stdout, canonicalJson({ schema_version: "nuanu.qah-preflight-report.v1", ...payload }));
  await writeFile(path, `${canonicalJson({ exact: "request" })}\n`);
  await assert.rejects(main(["--request", path], { runAndConsume: async () => payload, write() {} }), /canonical/);
  assert.equal((await readFile(path)).byteLength > 0, true);
});

test("CLI rejects every argv path and byte-custody violation", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qah-preflight-negative-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, "request.json");
  const link = join(root, "request-link.json");
  const tiny = join(root, "tiny.json");
  const huge = join(root, "huge.json");
  await writeFile(target, canonicalJson({ exact: "request" }));
  await symlink(target, link);
  await writeFile(tiny, "{");
  await writeFile(huge, Buffer.alloc(262_145, 0x20));
  const dependencies = {
    environment: {},
    runAndConsume: async () => structuredClone(payload),
    write() {},
  };
  for (const [name, argv] of [
    ["missing argv", []],
    ["missing path", ["--request"]],
    ["unknown flag", ["--unknown", target]],
    ["extra argv", ["--request", target, "extra"]],
    ["relative path", ["--request", "request.json"]],
    ["directory path", ["--request", root]],
    ["symlink path", ["--request", link]],
    ["too few bytes", ["--request", tiny]],
    ["too many bytes", ["--request", huge]],
  ]) await t.test(name, async () => {
    await assert.rejects(main(argv, dependencies));
  });
});

test("report rejects closed-shape coercion hostile values and secret reflection", async (t) => {
  const missing = structuredClone(payload); delete missing.graph_hash;
  const cyclic = {}; cyclic.self = cyclic;
  const proxy = new Proxy({}, { ownKeys() { throw new Error("hostile"); } });
  const cases = [
    ["extra consumed field", { result: { ...payload, extra: true }, environment: {} }],
    ["missing consumed field", { result: missing, environment: {} }],
    ["cycle", { result: cyclic, environment: {} }],
    ["Proxy", { result: proxy, environment: {} }],
    ["install_ready string coercion", { result: { ...payload, install_ready: "false" }, environment: {} }],
    ["test mode in production", { result: { ...payload, test_mode: true }, environment: { NUANU_QAH_PREFLIGHT_TEST_MODE: "1" } }],
    ["secret reflected in output", {
      result: { ...payload, unmet_preconditions: ["must-not-leak"] },
      environment: { NUANU_API_KEY: "must-not-leak" },
    }],
  ];
  for (const [name, { result, environment }] of cases) await t.test(name, async () => {
    await assert.rejects(createPreflightReport({ exact: "request" }, {
      environment,
      runAndConsume: async () => result,
    }));
  });
});
```

Run:

```bash
node --test tests/qah/preflight-report.test.mjs
```

Expected: non-zero exit because `scripts/qah/preflight-report.mjs` does not exist.

- [ ] **Step 2: Implement the bounded same-process report command**

Create `scripts/qah/preflight-report.mjs` with these exact public signatures:

```js
export async function createPreflightReport(request, {
  environment = process.env,
  runAndConsume = async (value, options) => consumeDirectInstallAttestation(
    await runDirectInstallPreflight(value, options),
  ),
} = {}) {}

export async function main(argv = process.argv.slice(2), dependencies = {}) {}
```

Requirements:

- accept exactly `--request /absolute/path.json` and no other argument;
- reject symlink/non-file, non-canonical JSON, fewer than 2 or more than 262144 bytes;
- invoke `runDirectInstallPreflight` and `consumeDirectInstallAttestation` inside the same process;
- return/write exactly `schema_version`, `bindings`, `graph_hash`, `definition_etag`, `profile_digest`, `policy_digest`, `test_mode`, `install_ready`, `unmet_preconditions`;
- reject extra/missing consumed fields, cycles, proxies, stdout secrets, and any `install_ready` coercion;
- use only `NUANU_API_URL` (optional), `NUANU_API_KEY`, `NUANU_QA_AGENT_KEY`, `NUANU_DECISION_AGENT_KEY`; production rejects `NUANU_QAH_PREFLIGHT_TEST_MODE`;
- never call `renderProcessForInstall`, save, activate, patch, or any mutation tool.

Run GREEN:

```bash
node --test tests/qah/preflight-report.test.mjs tests/qah/task7-round4.test.mjs
```

- [ ] **Step 3: Add focused proof-gate and preflight commands**

Add these exact scripts to `package.json`:

```json
"test:qah:proof-gate": "node --test tests/qah/release-policy.test.mjs tests/qah/decision.test.mjs tests/qah/finalize.test.mjs tests/qah/claim-adapter.test.mjs tests/qah/task-runtime.test.mjs tests/qah/e2e.test.mjs tests/qah/process-blueprint.test.mjs tests/qah/preflight-report.test.mjs",
"qah:preflight-report": "node scripts/qah/preflight-report.mjs"
```

Do not change the meaning of `test:qah` or `verify:qah`.

- [ ] **Step 4: Document the final product behavior**

Update the Universal QA section in `README.md` to state:

- Nuanu owns Column triggers, BPMN, Journeys, Artifacts, status Ends, retries, and Assist/Auto control;
- QAH owns deterministic browser/API/code/domain execution, immutable evidence verification, three-way policy, and claim materialization;
- READY maps to `passed`, product failure maps to `not_passed`, uncertainty maps to `unable_to_verify` and remains in Ready for QA;
- `npm run test:qah:proof-gate` is the focused local proof;
- live Auto remains NO_GO until the Assist compatibility probe and all three outcome canaries are observed.

Create `docs/operations/universal-qa-proof-gate-runbook.md` with sections:

1. Scope and prohibited Nuanu/source changes.
2. Exact local verification commands.
3. Finalization prepare -> publish JSON Artifact -> exact read-back -> complete -> worker transport -> FlowStepResult boundary.
4. Closed outcome matrix.
5. Read-only server validation checklist.
6. Fresh-ETag patch and exact read-back checklist.
7. Assist compatibility probe checklist.
8. Pause/rollback response matrix.
9. Auto promotion prerequisites.
10. Sanitized evidence fields: product commit, blueprint hash, binding ID, template ID, definition ETag before/after, graph hash, canary item ID, run ID, journey ID, mode, outcome, intended target, applied-transition flag, Artifact IDs/versions, and final binding status.

State explicitly that `scripts/qah/install-process.mjs` renders only and is not a save/activation receipt. Do not weaken `runDirectInstallPreflight` to accept a paused-invalid binding.

- [ ] **Step 5: Run the focused product proof**

Run:

```bash
npm run test:qah:proof-gate
```

Expected: all focused tests pass.

- [ ] **Step 6: Run the full QAH and legacy regression suites**

Run:

```bash
npm run test:qah
npm run verify:qah
```

Expected: both commands pass. If the restricted execution environment is the sole cause of `listen EPERM 127.0.0.1`, rerun the same exact command with approved unsandboxed test execution. Do not convert a worker-pin failure, assertion failure, timeout, or product failure into an environment exception.

- [ ] **Step 7: Run structural and security scans**

Run:

```bash
npm run typecheck
git diff --check
if rg -n 'when"?:\s*\{[^}]*"?(var|raw|otherwise|branch)"?|worker 0\.3\.13|READY_FOR_PRODUCTION либо RETURN_TO_IN_PROGRESS' processes/universal-qa-flow.graph.json scripts/qah tests/qah README.md docs/operations; then exit 1; else qah_scan_rc=$?; test "$qah_scan_rc" -eq 1; fi
if rg -n '4111111111111111|Authorization: Bearer|raw-response-body' scripts/qah processes/universal-qa-flow.graph.json docs/operations README.md --glob '!local-harness.mjs'; then exit 1; else secret_scan_rc=$?; test "$secret_scan_rc" -eq 1; fi
```

Expected: typecheck passes; both `rg` commands return no matches. The bounded local harness and test files may retain synthetic secret canaries; production runtime modules, graph, docs, and runbook must not contain them.

- [ ] **Step 8: Commit the runbook and commands**

Run:

```bash
git add package.json README.md docs/operations/universal-qa-proof-gate-runbook.md scripts/qah/preflight-report.mjs tests/qah/preflight-report.test.mjs
git diff --cached --check
git commit -m "docs: add universal qah proof gate runbook"
test -z "$(git status --short)"
```

- [ ] **Step 9: Record the local handoff evidence**

Run:

```bash
git log --oneline -6
git status --short
```

Expected: the six task commits appear in dependency order and status is empty. Record the exact commit at `HEAD` and blueprint fingerprint in the handoff; do not claim any live Nuanu mutation yet.

---

## Task 7: Validate, patch, read back, and run one Assist compatibility probe

**Files:**

- Modify after observed live results only: `docs/operations/universal-qa-proof-gate-runbook.md`

**Nuanu skill:** Load `nuanu-flow:bpmn-processes` and use current full tool descriptors before calls. The only authorized live mutations in this task are one atomic Process graph patch, one verified binding activation, one idempotent explicit Assist run on a pre-existing synthetic item, and a mandatory binding pause. Do not create or move a Flow item, use raw BPMN, or access a database in this task.

- [ ] **Step 1: Verify the immutable local deployment input**

Require:

- local worktree clean;
- the exact `codex/universal-qah` commit pushed or otherwise reachable by the worker's repository checkout;
- worker adapter 0.3.14 digest still equals the Task 1 pin;
- rendered graph fingerprint still equals `sha256:b85c9e7490f8abf1812c942527ad0a16181d21db8f9d8f145980306e325ccf34`;
- MCP transport available. A repeated HTTP 522 blocks only this live task; it does not invalidate local GREEN.

- [ ] **Step 2: Rebuild fresh read-only Nuanu state**

Read, in this order:

1. exact project Process binding for Ready for QA;
2. current binding status and invalid/attention flags;
3. current Process graph summary;
4. bounded selection containing `resolve_flow_item`, `independent_release_decision`, `finalize_transition`, the legacy `transition_route`, all current End nodes, and incident edges;
5. active Process runs and Journeys for the binding;
6. exact pinned QA/decision Agent versions and current worker identity;
7. a pre-existing synthetic PayDemo canary item already in Ready for QA, with no active run and `get_flow_item_process_control` proving Assist mode before binding activation.

Require the binding's exact status to be `paused`. Stop without mutation if it is active or in any other state, an active run exists, the Column Start identity differs, touched UUIDs drifted, the target is not the dedicated PayDemo/sandbox binding, the canary item is absent/not Assist, or the binding was concurrently edited. Do not create or move a canary item while the binding is active.

- [ ] **Step 3: Run one read-only server validation**

Render the full candidate locally using the freshly read binding values. Call `validate_process_graph` once with the complete structured graph.

Require exactly:

```text
valid=true
blocking_errors=[]
ready_to_save=true
```

Record advisory warnings without rewriting the contract. Layout warnings do not trigger graph reordering or another validation call.

- [ ] **Step 4: Fetch the edit lease immediately before mutation**

After all dependent lookups, call `get_process_graph` again with the bounded touched selection. Use only that response's `definition_etag` as `expected_definition_etag`.

Immediately after that graph read, reread the exact binding plus active runs. Require the binding still paused and the active-run set still empty. If the selection, binding status, or run set no longer matches Step 2, stop without retry. Do not reuse an earlier ETag.

- [ ] **Step 5: Apply one atomic structured patch**

Call `patch_process_graph` with the fresh ETag and one ordered operation list that:

1. updates `resolve_flow_item` instruction to worker 0.3.14;
2. updates the decision instruction to include HOLD;
3. updates `finalize_transition` instruction and seven-field output;
4. adds `transition_proof_gate` (`...026`) with the exact Proof Gate config;
5. retargets incoming edge `...022` to the new Proof Gate;
6. updates edge `...023` source and outcome to `passed`;
7. updates edge `...024` source and outcome to `not_passed`;
8. adds the neutral hold End `...022`;
9. adds outcome edge `...025`;
10. removes the now-disconnected legacy gateway `transition_route` (`...019`).

Because update operations use JSON Merge Patch, explicitly set obsolete edge fields to `null`: `raw`, `var`, `op`, `value`, `otherwise`, and `branch`. Do not send `{}` to remove an old object, and do not attempt an immutable `gateway -> proof_gate` type update.

On `STALE_PROCESS_GRAPH`, use the returned recovery selection, then reread the exact binding, active runs, fresh project states, Column Start, touched nodes/edges, and final Ends. Require binding still paused, active-run set empty, and every Start/state/End/touched identity unchanged. If any candidate graph byte changed, rerun `validate_process_graph` once against the newly rendered complete candidate and require the same exact valid/ready result. Only then use the newly returned ETag for one retry. Do not auto-merge any other conflict or reuse the first run-safety lease.

- [ ] **Step 6: Read back before activation**

Verify the mutation receipt, then call `get_process_graph` with a new post-patch selection containing `resolve_flow_item`, `independent_release_decision`, `finalize_transition`, `transition_proof_gate`, all three End nodes, and every incident edge. Do not request the deleted legacy key `transition_route`, because a selection containing any missing key fails closed. Separately require the graph summary and returned selection to contain neither legacy key `transition_route` nor legacy node ID `...019`. Require:

- exact Proof Gate type/config;
- exact server-normalized Proof Gate output: empty `artifacts` plus only
  `completion_verification_id`, `outcome`, `reason_code`, and `resolution` with
  the stock type/description bytes;
- exact three `when.outcome` values;
- zero `when.raw`, `when.var`, `otherwise`, or `branch` on the final route;
- exact Ready for Production and In Progress End `target_state_id` values from the fresh project-state read;
- exact neutral target `null`;
- exact seven finalizer output fields;
- preserved Column Start and every retained UUID, with legacy route UUID `...019` absent;
- new graph hash and definition ETag from the server.

Persist only the bounded structured `selection` response to `/private/tmp/nuanu-qah-final-route-readback.json`. Persist the exact freshly read Ready for Production and In Progress state UUIDs to canonical `/private/tmp/nuanu-qah-final-states.json` with exactly keys `ready_for_production_state_id` and `in_progress_state_id`. Then run the same invariant used by local rendering:

```bash
node --input-type=module -e 'import {readFile} from "node:fs/promises"; import {validateFinalProofGate} from "./scripts/qah/render-process.mjs"; const value=JSON.parse(await readFile("/private/tmp/nuanu-qah-final-route-readback.json","utf8")); const states=JSON.parse(await readFile("/private/tmp/nuanu-qah-final-states.json","utf8")); validateFinalProofGate(value.selection ?? value, states);'
```

Expected: exit 0 with no output. The file must be canonical JSON, at most 262144 bytes, and contain no credentials or unrestricted response fields.

If any assertion fails, leave the binding paused and stop. Do not restore `when.var`.

- [ ] **Step 7: Activate the Column binding and read it back**

Arm the pause/read-back cleanup guard before sending any activation request. Use `activate_project_process_binding`, not `activate_process_template`. Read the exact binding again and require active status, no invalid flag, the same template identity, and the read-back graph hash.

An activation error, timeout, or ambiguous response is not proof that activation failed. In that case, the already-armed guard must read the exact binding, pause it if active, and verify paused before returning. If exact binding state cannot be read, stop with status `UNRESOLVED_ACTIVE_BINDING_RISK`; do not dispatch a run or claim safe recovery.

- [ ] **Step 8: Capture both independent read-only preflights**

Create `/private/tmp/nuanu-qah-preflight-request.json` as canonical JSON with exactly the request keys already enforced by `install-preflight.mjs`: `workspace_slug`, `workspace_id`, `project_id`, `project_process_binding_id`, `process_template_id`, the three state IDs, both Agent employee/version pairs, `decision_agent_metadata`, `profile_artifact`, `repository_origin`, `repository_path`, and `commit`. Every value comes from Steps 1–7; the file contains no credential.

Require `NUANU_API_KEY`, `NUANU_QA_AGENT_KEY`, and `NUANU_DECISION_AGENT_KEY` to be present only in the process environment, then run the exact same-process command:

```bash
env -u NUANU_QAH_PREFLIGHT_TEST_MODE node scripts/qah/preflight-report.mjs --request /private/tmp/nuanu-qah-preflight-request.json
```

Expected: one canonical `nuanu.qah-preflight-report.v1` JSON object and no other stdout. Record that sanitized payload. Do not call `renderProcessForInstall` and do not change `install_ready`.

Require the report's `graph_hash` and `definition_etag` to equal exactly the post-patch values read in Steps 6–7. Any mismatch is concurrent graph drift and enters the mandatory pause path; do not dispatch.

Require every binding/Start/Git/profile/Agent/worker-whoami check to pass. The only permitted unmet condition is the exact documented public-observability gap for worker adapter version/capabilities/strongest model. Pair that result with Task 1's exact local worker digest and Step 2's exact AgentVersion/model read-back as the bounded Assist compatibility attestation. Any other unmet condition blocks the canary and enters the mandatory pause path.

This records the approved second preflight; it does not claim a general install-ready attestation or authorize Auto.

- [ ] **Step 9: Run one dedicated Assist compatibility probe**

Immediately before dispatch, reread the exact active binding, active-run set, the Step 6 post-patch final-route selection (new Proof Gate and three Ends, explicitly omitting deleted `transition_route`), graph summary/hash/definition ETag, and the pre-existing synthetic PayDemo item's process control. Require binding active, no active run, final-route invariant still valid against the fresh project-state UUIDs, the legacy key/ID still absent, graph hash/ETag equal Steps 6–8, and item mode still Assist. Any drift enters the mandatory pause path without dispatch.

Only after that last lease succeeds, use one stable idempotency key for `run_flow_item_column_process` and never retrigger on an ambiguous response.

Poll the exact run and `get_project_process_journey` until terminal or the runbook timeout. Record:

- run and journey IDs;
- frozen graph/template identity;
- actual Proof Gate outcome;
- intended End target;
- `applied_transition === false`;
- item status still Ready for QA;
- exact finalization/evidence ArtifactVersion refs;
- worker and Agent-version identity.

Do not predeclare `passed`. Interpret outcomes as:

- `passed`: compatibility probe succeeds; the item still does not move in Assist;
- `unable_to_verify`: platform repository-workspace prerequisite is missing/stale; pause binding after evidence capture;
- `not_passed`: only valid for an intentionally negative fixture with current revision and verified failed check; for the first clean probe it is a regression, so pause binding;
- failed/stuck/wrong transition: pause binding and report the exact failed step/diagnostics.

- [ ] **Step 10: Preserve and prove the safe post-probe state on every exit**

From immediately before the activation call, execute binding read/pause/read-back as a required `finally` action on every path: ambiguous activation, activation timeout/error, preflight block, mode mismatch, read failure, ambiguous dispatch, timeout, run failure, wrong outcome, or success. After `pause_project_process_binding`, read the exact binding and require `status === "paused"`, the same template identity, and the expected graph hash before returning or committing evidence. If the binding cannot be read or paused, report `UNRESOLVED_ACTIVE_BINDING_RISK` prominently and stop all further automation.

Keep Auto disabled. This task proves one bounded compatibility run; it does not leave unattended execution enabled. Do not call stop/takeover as silent recovery; those actions require a separate explicit confirmation.

Even after observed `passed`, do not promote to Auto in this task. Schedule separate negative `not_passed` and `unable_to_verify` canaries and a human review of all three Journey receipts.

- [ ] **Step 11: Record sanitized evidence and commit docs only**

Append one dated canary record to `docs/operations/universal-qa-proof-gate-runbook.md` using only exact read-back fields listed in Task 6. Exclude prompts, tokens, credentials, raw comments, PAN/CVV, and unrestricted screenshots.

Run:

```bash
git add docs/operations/universal-qa-proof-gate-runbook.md
git diff --cached --check
git commit -m "docs: record qah proof gate assist canary"
test -z "$(git status --short)"
```

If live execution was blocked before a Nuanu mutation, do not create a false canary record or commit; report the precise blocker and retain the locally verified product state.

---

## Task 8: Prove stock-profile revision precedence before any Auto-readiness claim

**Files:**

- Modify after observed live results only: `docs/operations/universal-qa-proof-gate-runbook.md`

This is a required follow-up to a clean Task 7 `passed` probe. It is not permission to invent fixture state from a card description. Each fixture must already be a deterministic sandbox product/repository fixture with an immutable source Artifact, exact pushed commit, exact profile, and pre-existing Assist Flow item while the binding is paused.

- [ ] **Step 1: Prepare and review the closed server-canary matrix while paused**

Require six pre-existing synthetic fixtures:

| Local admitted verdict | Server repository relation | Required Proof Gate outcome |
| --- | --- | --- |
| `pass` | current exact head | `passed` |
| `fail` | current exact head | `not_passed` |
| `blocked` | current exact head | `unable_to_verify` |
| `pass` | missing or stale head | `unable_to_verify` |
| `fail` | missing or stale head | `unable_to_verify` |
| `blocked` | missing or stale head | `unable_to_verify` |

For every fixture, read exact process control and require Assist, no active run, no previous idempotency-key reuse, and a distinct source ArtifactVersion. Product failure must come from the controlled buggy product fixture with verified failed evidence; blocked must come from a controlled missing-evidence/infra fixture; neither may be selected by free text in the Flow item.

- [ ] **Step 2: Run each fixture through the same bounded activation protocol**

For each row, serially:

1. Require binding paused and no active run.
2. Arm the same pause/read-back guard from Task 7, then activate and read back the exact binding; ambiguous activation enters that guard without dispatch.
3. Run the exact preflight pair from Task 7 and require its graph hash/ETag equal the row's activation read-back.
4. Immediately before dispatch reread active binding, bounded final-route selection/hash/ETag, active runs, and the fixture's Assist control; require unchanged graph/state identities and an empty active-run set.
5. Dispatch once with a row-specific stable idempotency key only after Step 4 succeeds.
6. Poll the exact run and Journey to terminal.
7. Record local verdict, server-observed head relation, Proof Gate outcome, intended target, and `applied_transition === false`.
8. In the already-armed unconditional finally block, pause and read back `status === "paused"` before the next row; unreadable/unpausable state is `UNRESOLVED_ACTIVE_BINDING_RISK` and ends the matrix.

Never retry an ambiguous dispatch and never run rows concurrently.

- [ ] **Step 3: Assert repository precedence across all local verdicts**

Require the exact matrix above. In particular, the stale/missing product-failure row must end `unable_to_verify`, never `not_passed`; a trusted local FAIL cannot bypass the server's repository workspace/head gate.

Any mismatch is a live compatibility failure. Preserve the binding paused, keep Auto disabled, and record the exact server diagnostics without editing Nuanu.

- [ ] **Step 4: Record sanitized matrix evidence**

Append the six exact run/Journey receipts and a matrix verdict to the runbook. Exclude raw prompts, secrets, unrestricted responses, and mutable latest references.

Run:

```bash
git add docs/operations/universal-qa-proof-gate-runbook.md
git diff --cached --check
git commit -m "docs: record qah proof gate precedence canaries"
test -z "$(git status --short)"
```

Task 8 completion permits the label `LIVE ROUTING VERIFIED`; it still does not activate Auto. Auto requires a separate human review and explicit promotion request.

---

## Final Verification Matrix

Before claiming the adaptation complete, require all rows below:

| Layer | Required evidence |
| --- | --- |
| Worker boundary | 0.3.14 exact adapter digest and canonical completion GREEN |
| Local policy | PASS, product failure, and uncertainty produce three distinct closed routes |
| Finalization | comment, cleanup, identity, decision, commit, and Artifact checks agree |
| Claim adapter | exact ArtifactVersion read-back and strict FlowStepResult round-trip GREEN |
| Blueprint | 21/24 authored, 22/25 rendered, no final `var/raw/otherwise/branch` |
| Full repository | `npm run test:qah`, legacy PayDemo harness, and typecheck GREEN |
| Nuanu save | atomic patch receipt and exact bounded read-back agree |
| Compatibility | one Assist run is terminal, status did not move, and outcome is evidence-backed |
| Revision precedence | pass/fail/blocked current and stale/missing matrix matches all six stock-profile outcomes |
| Automation | Auto remains disabled until separately approved three-outcome canary review |

Completion status must distinguish:

- **LOCAL COMPLETE:** Tasks 1–6 GREEN and committed.
- **LIVE COMPATIBILITY VERIFIED:** Task 7 patch/read-back and one Assist compatibility canary observed, then binding verified paused.
- **LIVE ROUTING VERIFIED:** Task 8 six-row current/stale precedence matrix observed and binding verified paused after every row.
- **BLOCKED:** exact external prerequisite unavailable; no guessed success.
- **NOT INCLUDED:** payments, production, native Telegram, OTP/CAPTCHA, or Auto promotion.
