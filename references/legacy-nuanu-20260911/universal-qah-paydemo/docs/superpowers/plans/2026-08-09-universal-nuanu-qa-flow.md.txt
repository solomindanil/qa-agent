# Universal Nuanu QA Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the PayDemo-specific Column Process with one reusable QA blueprint that classifies any ticket, runs only applicable checks in parallel, publishes evidence, and moves the ticket to `Ready for Production` or `In Progress`.

**Architecture:** A repository-bound context step reads the pinned Flow item, Wiki context, exact commit, and `qa-harness.yaml`. Deterministic local contracts create a test plan and validate four parallel branch results; a separate Codex decision step may explain but cannot override the fail-closed policy. Product-specific commands and safety rules live in the project profile, while the versioned BPMN blueprint remains unchanged across projects and is rendered with project-specific state and agent UUIDs during installation.

**Tech Stack:** Node.js 22.23.1 ESM, JSON Schema, `yaml` 2.8.1, Playwright 1.61.1, Node test runner, Nuanu Flow ProcessItem v1, Nuanu Flow worker 0.3.13, Codex App Server.

## Global Constraints

- Start automatically only when a Flow item in execution mode `auto` enters `Ready for QA`.
- Keep product names, endpoint paths, repository URLs, absolute worker paths, and project UUIDs out of the BPMN blueprint.
- Read commands only from a `nuanu.qa-project-profile.v1` profile pinned to the tested commit.
- Execute command arrays with `execFile` or `spawn`, `shell:false`, a minimal environment, finite timeouts, and bounded output.
- Never expose credentials, payment data, tokens, unrestricted response bodies, or worker capabilities in Process output or Artifacts.
- Never make real purchases, payments, emails, destructive changes, or irreversible external side effects.
- Keep `product_result`, `environment_status`, and `evidence_status` independent.
- An inapplicable branch returns `SKIPPED`; it never fabricates `PASS`.
- Unknown codes, missing evidence, mixed build identity, insufficient confidence, and infrastructure uncertainty fail closed.
- Only BPMN End nodes change Flow-item state, and only after comment read-back plus confirmed environment cleanup.
- The implementation starts from `codex/paydemo` because that branch contains the current verified harness. Create a fresh isolated worktree at execution time; do not overwrite its two existing uncommitted route files.

---

## File Structure

Create or modify the following focused units in the execution worktree:

- `qa-harness.yaml` — first real project profile for DEMO/PayDemo.
- `schemas/qah/project-profile.schema.json` — machine-readable profile contract.
- `schemas/qah/resolved-context.schema.json` — trusted context handed to the planner.
- `schemas/qah/test-plan.schema.json` — closed applicability and risk contract.
- `schemas/qah/branch-result.schema.json` — one uniform result for every executor.
- `schemas/qah/release-decision.schema.json` — closed final routing contract.
- `scripts/qah/canonical.mjs` — canonical JSON and SHA-256 helpers only.
- `scripts/qah/contracts.mjs` — strict runtime validators and exact key checks.
- `scripts/qah/profile.mjs` — YAML parsing, profile validation, and commit binding.
- `scripts/qah/context.mjs` — normalize pinned Flow-item, Wiki, and repository identity.
- `scripts/qah/plan.mjs` — deterministic applicability and risk policy.
- `scripts/qah/environment.mjs` — generic profile-driven prepare/cleanup adapter.
- `scripts/qah/run-branch.mjs` — one branch runner parameterized by `code|api|ui|domain`.
- `scripts/qah/aggregate.mjs` — evidence, identity, and plan completeness validation.
- `scripts/qah/decide.mjs` — deterministic route policy and Codex-facing normalized input.
- `scripts/qah/render-comment.mjs` — bounded escaped comment HTML and marker.
- `scripts/qah/finalize.mjs` — comment/cleanup receipt gate.
- `scripts/qah/render-process.mjs` — render one project-specific graph from the universal blueprint.
- `processes/universal-qa-flow.graph.json` — versioned BPMN graph blueprint with semantic bindings.
- `tests/qah/fixtures/*.json` — exact UI, API, mixed, docs, failure, and tamper cases.
- `tests/qah/*.test.mjs` — unit and contract tests for each focused module.
- `docs/operations/universal-qa-flow-runbook.md` — installation, canary, rollback, worker, and recovery instructions.
- `package.json` — `test:qah`, `verify:qah`, and focused subcommands.

The existing `scripts/paydemo-qah-*.mjs` files remain frozen as comparison fixtures until the new flow passes the full canary. Delete or archive them only in a later, separately reviewed cleanup.

---

### Task 1: Universal contracts and the DEMO project profile

**Files:**
- Create: `schemas/qah/project-profile.schema.json`
- Create: `schemas/qah/resolved-context.schema.json`
- Create: `schemas/qah/test-plan.schema.json`
- Create: `schemas/qah/branch-result.schema.json`
- Create: `schemas/qah/release-decision.schema.json`
- Create: `scripts/qah/canonical.mjs`
- Create: `scripts/qah/contracts.mjs`
- Create: `scripts/qah/profile.mjs`
- Create: `qa-harness.yaml`
- Create: `tests/qah/contracts.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `canonicalJson(value): string`, `sha256(value): string`, `validateProfile(value): Profile`, `validateResolvedContext(value): ResolvedContext`, `validateTestPlan(value): TestPlan`, `validateBranchResult(value): BranchResult`, `validateReleaseDecision(value): ReleaseDecision`, `loadProfile(path, expectedCommit): Promise<Profile>`.
- Consumes: Node.js built-ins and exact dependency `yaml@2.8.1`; YAML aliases, custom tags, duplicate keys, and multi-document input are rejected.

- [ ] **Step 1: Write failing strict-contract tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProfile,
  validateTestPlan,
  validateBranchResult,
} from "../../scripts/qah/contracts.mjs";

test("profile rejects shell strings, secrets, and unknown keys", () => {
  assert.throws(() => validateProfile({
    schema_version: "nuanu.qa-project-profile.v1",
    project_key: "paydemo",
    repository: { allowed_origin: "https://github.com/solomindanil/NuanuFlowQA.git" },
    environment: { strategy: "managed_command", prepare_command: "npm start" },
    checks: {}, safety: {}, test_data: {}, token: "secret",
  }), /exact profile contract/);
});

test("branch result cannot call an applicable check SKIPPED", () => {
  assert.throws(() => validateBranchResult({
    schema_version: "nuanu.qa-branch-result.v1",
    branch: "ui", applicability: "REQUIRED", product_result: "SKIPPED",
  }), /required branch cannot be skipped/);
});
```

- [ ] **Step 2: Run the RED test**

Run: `node --test tests/qah/contracts.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/qah/contracts.mjs`.

- [ ] **Step 3: Install the exact YAML parser**

Run: `npm install --save-exact yaml@2.8.1`

Expected: `package.json` and `package-lock.json` pin `yaml` 2.8.1 exactly.

- [ ] **Step 4: Implement canonical helpers and exact validators**

```js
export function exactKeys(value, required, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("expected object");
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  for (const key of required) if (!keys.includes(key)) throw new Error(`missing ${key}`);
  for (const key of keys) if (!allowed.has(key)) throw new Error(`unknown ${key}`);
  return value;
}

export const BRANCHES = Object.freeze(["code", "api", "ui", "domain"]);
export const PRODUCT_RESULTS = Object.freeze(["PASS", "FAIL", "INCONCLUSIVE", "SKIPPED"]);
export const ENVIRONMENT_STATUSES = Object.freeze(["HEALTHY", "INFRA_FAILURE", "NOT_REQUIRED"]);
export const EVIDENCE_STATUSES = Object.freeze(["VERIFIED", "PARTIAL", "UNVERIFIED"]);
```

Require command values to be non-empty string arrays; reject NUL, environment interpolation, credentials in URLs, unknown top-level keys, and profile secrets. Require lowercase 40-character Git SHA and `sha256:` digests where relevant.

- [ ] **Step 5: Add the actual DEMO profile**

The committed profile must bind the current repository and expose only safe named commands:

```yaml
schema_version: nuanu.qa-project-profile.v1
project_key: paydemo
repository:
  allowed_origin: https://github.com/solomindanil/NuanuFlowQA.git
environment:
  strategy: managed_command
  prepare_command: [node, scripts/qah/environment.mjs, prepare]
  cleanup_command: [node, scripts/qah/environment.mjs, cleanup]
  health_path: /build-info
checks:
  code: [npm, run, typecheck]
  api: [node, scripts/qah/adapters/paydemo.mjs, api]
  ui: [node, scripts/qah/adapters/paydemo.mjs, ui]
  domain: [node, scripts/qah/adapters/paydemo.mjs, domain]
safety:
  mutation_mode: sandbox_only
  irreversible_actions: deny
  secret_output: deny
  allowed_origins: [http://127.0.0.1]
test_data:
  profiles: [default, payment_sandbox]
```

- [ ] **Step 6: Add package commands and run GREEN**

Add:

```json
"test:qah:contracts": "node --test tests/qah/contracts.test.mjs",
"test:qah": "node --test tests/qah/*.test.mjs"
```

Run: `npm run test:qah:contracts`

Expected: PASS, including negative cases for extra keys, malformed commit/digest, shell strings, secret-bearing URLs, and invalid cross-field states.

- [ ] **Step 7: Commit Task 1**

```bash
git add qa-harness.yaml schemas/qah scripts/qah/canonical.mjs scripts/qah/contracts.mjs scripts/qah/profile.mjs tests/qah/contracts.test.mjs package.json package-lock.json
git commit -m "feat: define universal QA contracts"
```

---

### Task 2: Deterministic context and test-plan policy

**Files:**
- Create: `scripts/qah/plan.mjs`
- Create: `scripts/qah/context.mjs`
- Create: `tests/qah/plan.test.mjs`
- Create: `tests/qah/context.test.mjs`
- Create: `tests/qah/fixtures/context-ui.json`
- Create: `tests/qah/fixtures/context-api.json`
- Create: `tests/qah/fixtures/context-mixed.json`
- Create: `tests/qah/fixtures/context-docs.json`
- Create: `tests/qah/fixtures/context-fintech.json`
- Modify: `qa-harness.yaml`
- Modify: `schemas/qah/project-profile.schema.json`

**Interfaces:**
- Consumes: pinned Flow-item identity, bounded Wiki Artifact references, repository origin/commit/content hash/changed files, `validateResolvedContext`, `validateTestPlan`, and profile area rules.
- Produces: `resolveContext(input): ResolvedContext`, `planQaScope(context, profile): TestPlan`, and CLI envelopes with `item.key="load_project_context"` or `item.key="plan_qa_scope"` plus materialized context/test-plan Artifact slots.

- [ ] **Step 1: Write failing classification tests**

```js
test("UI-only change requires code and UI but skips API and domain", () => {
  const plan = planQaScope(uiContext, profile);
  assert.deepEqual(plan.applicability, {
    code: "REQUIRED", api: "NOT_APPLICABLE", ui: "REQUIRED", domain: "NOT_APPLICABLE",
  });
});

test("fintech authentication change is never below HIGH risk", () => {
  assert.equal(planQaScope(fintechContext, profile).risk_level, "HIGH");
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/plan.test.mjs`

Expected: FAIL because `scripts/qah/plan.mjs` does not exist.

- [ ] **Step 3: Add exact area rules to the profile**

```yaml
areas:
  ui:
    paths: [apps/paydemo/public/**, tests/**/ui/**]
    labels: [ui, frontend]
  api:
    paths: [apps/paydemo/server.mjs, tests/**/api/**]
    labels: [api, backend]
  domain:
    paths: [apps/paydemo/**/payment*, tests/**/domain/**]
    labels: [payments, auth, data]
risk:
  high_keywords: [payment, authentication, authorization, pii, webhook]
  critical_keywords: [real-money, production-migration]
  confidence_threshold: 0.95
```

The YAML parser must treat these values as data only. Match changed files with `path.matchesGlob` and normalized labels with exact lowercase equality.

- [ ] **Step 4: Implement exact context normalization**

`resolveContext` requires the source Artifact id/version, exact issue/project UUIDs, repository origin, 40-character commit, content hash, changed-file array, and bounded Wiki Artifact references. It rejects free-form commands, URLs outside the profile repository, duplicate paths, changed paths containing traversal, and Wiki text in the Process result. The agent may read Wiki and code through Nuanu tools, but only normalized references and hashes cross this boundary.

- [ ] **Step 5: Implement the deterministic planner**

Always require `code`. Require other branches only when a declared path, label, or explicit acceptance-criterion capability matches. Store reasons per branch, expected evidence kinds, risk level, source Artifact identity, commit, content hash, and a canonical `plan_sha256`.

Do not let prose lower risk. An unrecognized change with no file list produces a fail-closed plan that marks all four branches `REQUIRED` with reason code `UNKNOWN_SCOPE`.

- [ ] **Step 6: Run the fixture matrix**

Run: `node --test tests/qah/context.test.mjs tests/qah/plan.test.mjs`

Expected: five fixtures PASS; repeated planning produces byte-identical canonical JSON and SHA-256.

- [ ] **Step 7: Commit Task 2**

```bash
git add qa-harness.yaml schemas/qah/project-profile.schema.json scripts/qah/context.mjs scripts/qah/plan.mjs tests/qah
git commit -m "feat: plan ticket-specific QA scope"
```

---

### Task 3: Generic environment lifecycle

**Files:**
- Create: `scripts/qah/environment.mjs`
- Create: `tests/qah/environment.test.mjs`
- Modify: `scripts/paydemo-qah-environment.mjs`

**Interfaces:**
- Consumes: validated profile, exact repository origin, exact 40-character commit, run id, attempt id, and environment id.
- Produces: `prepareEnvironment(input): EnvironmentReceipt` and `cleanupEnvironment(input): CleanupReceipt` with closed statuses `READY|NOT_REQUIRED|INFRA_FAILURE` and `STOPPED|ABSENT|RECOVERY_REQUIRED`.

- [ ] **Step 1: Write failing lifecycle and safety tests**

Cover `none`, exact HTTPS checkout, dirty checkout rejection, same idempotency replay, different-body conflict, origin mismatch, redirect rejection, timeout, foreign PID, instance nonce mismatch, and cleanup after interrupted prepare.

```js
test("docs profile returns NOT_REQUIRED without spawning product", async () => {
  const receipt = await prepareEnvironment({ profile: noneProfile, runId, attemptId });
  assert.equal(receipt.environment_status, "NOT_REQUIRED");
  assert.equal(spawnCalls.length, 0);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/environment.test.mjs`

Expected: FAIL because generic environment adapter is absent.

- [ ] **Step 3: Extract only proven lifecycle primitives**

Reuse ownership, build identity, immutable served-byte, repository allowlist, and cleanup checks from `scripts/paydemo-qah-environment.mjs`. Do not copy PayDemo variant names, ports, repo URL, or task keys. Keep the old file as a wrapper around the generic implementation so its existing tests remain valid.

- [ ] **Step 4: Implement fenced attempts and bounded execution**

Use a target namespace derived from canonical `{run_id,attempt_id,environment_id}`. Persist ownership before returning READY. Never kill or clean a process whose nonce, executable identity, repository, and state-root tuple do not all match.

- [ ] **Step 5: Run old and new lifecycle suites**

Run: `node --test tests/qah/environment.test.mjs tests/paydemo-environment/environment.test.mjs tests/paydemo/build-provenance.test.mjs tests/paydemo/server-identity.test.mjs`

Expected: all PASS and no listener remains on the test ports.

- [ ] **Step 6: Commit Task 3**

```bash
git add scripts/qah/environment.mjs scripts/paydemo-qah-environment.mjs tests/qah/environment.test.mjs
git commit -m "feat: generalize isolated QA environments"
```

---

### Task 4: Uniform parallel branch runner

**Files:**
- Create: `scripts/qah/run-branch.mjs`
- Create: `scripts/qah/adapters/paydemo.mjs`
- Create: `tests/qah/branch-runner.test.mjs`
- Create: `tests/qah/fixtures/branch-code-pass.json`
- Create: `tests/qah/fixtures/branch-api-pass.json`
- Create: `tests/qah/fixtures/branch-ui-pass.json`
- Create: `tests/qah/fixtures/branch-domain-pass.json`
- Create: `tests/qah/fixtures/branch-infra-failure.json`

**Interfaces:**
- Consumes: exact `TestPlan`, profile, environment receipt, branch name, run id, and attempt id.
- Produces: exact `BranchResult` and one `evidence_report` document slot.

- [ ] **Step 1: Write RED tests for all four branches**

```js
test("NOT_APPLICABLE UI emits verified SKIPPED without Playwright", async () => {
  const result = await runBranch({ branch: "ui", plan: docsPlan, execute: forbiddenExecute });
  assert.equal(result.product_result, "SKIPPED");
  assert.equal(result.evidence_status, "VERIFIED");
});

test("transport failure is not a product defect", async () => {
  const result = await runBranch({ branch: "api", plan: apiPlan, execute: timeoutExecute });
  assert.equal(result.product_result, "INCONCLUSIVE");
  assert.equal(result.environment_status, "INFRA_FAILURE");
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/branch-runner.test.mjs`

Expected: FAIL because branch runner is absent.

- [ ] **Step 3: Implement one runner with four closed adapters**

The runner validates input before any side effect, enforces the plan applicability, executes only the command array declared for its branch, passes canonical bounded input through stdin, strips the worker environment to an allowlist, caps stdout/stderr, and converts the adapter's canonical JSON into `BranchResult`. `scripts/qah/adapters/paydemo.mjs` is the first product adapter and wraps the already-tested PayDemo probes without exposing PayDemo behavior to BPMN.

For `ui`, require the profile origin to equal the prepared origin and use Playwright in a new isolated context. Record only allowed assertion fields, screenshots/traces as Artifacts, and hashes of unexpected values. For `domain`, resolve only a named worker test-data profile and never serialize its values.

- [ ] **Step 4: Prove branch and retry isolation**

Add concurrent tests where all branches share `run_id` but receive distinct branch namespaces and two overlapping attempts receive distinct attempt namespaces. A reset or fixture created by one branch/attempt must not change another.

- [ ] **Step 5: Run GREEN and typecheck**

Run: `node --test tests/qah/branch-runner.test.mjs`

Run: `npm run typecheck`

Expected: PASS; UI `SKIPPED` never launches Playwright; required UI produces a versioned screenshot/trace reference in the test adapter.

- [ ] **Step 6: Commit Task 4**

```bash
git add scripts/qah/run-branch.mjs scripts/qah/adapters/paydemo.mjs tests/qah/branch-runner.test.mjs tests/qah/fixtures
git commit -m "feat: run applicable QA branches uniformly"
```

---

### Task 5: Evidence aggregation and release decision

**Files:**
- Create: `scripts/qah/aggregate.mjs`
- Create: `scripts/qah/decide.mjs`
- Create: `tests/qah/aggregate.test.mjs`
- Create: `tests/qah/decision.test.mjs`

**Interfaces:**
- Consumes: one `TestPlan`, four `BranchResult` values, exact evidence Artifact references, and environment receipt.
- Produces: `aggregateEvidence(input): AggregateResult` and `decideRelease(aggregate): ReleaseDecision` where route is exactly `READY_FOR_PRODUCTION|RETURN_TO_IN_PROGRESS`.

- [ ] **Step 1: Write adversarial RED tests**

Cover missing branch, required SKIPPED, inapplicable PASS, mixed commit/content hash/nonce, duplicate evidence versions, forged digest, stale run, different attempts, low confidence, unknown code, product FAIL, infra failure, clean UI-only, clean API-only, clean mixed, and clean docs.

```js
test("Codex explanation cannot override deterministic failure", () => {
  const result = decideRelease(failedAggregate, { proposed_route: "READY_FOR_PRODUCTION" });
  assert.equal(result.route, "RETURN_TO_IN_PROGRESS");
  assert.equal(result.policy_override_rejected, true);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/aggregate.test.mjs tests/qah/decision.test.mjs`

Expected: FAIL because modules are absent.

- [ ] **Step 3: Implement canonical aggregation**

Recompute plan SHA, branch payload SHA, occurrence key, and evidence linkage. Require one shared source Flow-item version, repository, commit, content hash, environment id, instance nonce, run id, and attempt id for all applicable runtime branches. Treat a missing or invalid branch as an explicit invalid record, never as omission.

- [ ] **Step 4: Implement the closed decision policy**

`READY_FOR_PRODUCTION` requires every planned branch valid, applicable results PASS, inapplicable results SKIPPED, environment healthy or not required, evidence verified, confidence at least the profile threshold, and zero confirmed findings. The Codex agent receives only the normalized aggregate and returns explanation fields; local policy calculates the route. Comment and cleanup receipts are checked later by `finalize_transition`, never predicted here.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/qah/aggregate.test.mjs tests/qah/decision.test.mjs`

Expected: all adversarial cases fail closed and all four clean ticket classes receive the expected route.

- [ ] **Step 6: Commit Task 5**

```bash
git add scripts/qah/aggregate.mjs scripts/qah/decide.mjs tests/qah/aggregate.test.mjs tests/qah/decision.test.mjs
git commit -m "feat: decide QA release from verified evidence"
```

---

### Task 6: Comment receipt and final transition gate

**Files:**
- Create: `scripts/qah/render-comment.mjs`
- Create: `scripts/qah/finalize.mjs`
- Create: `tests/qah/finalize.test.mjs`

**Interfaces:**
- Consumes: source Artifact identity, `ReleaseDecision`, review-bundle reference, comment read-back receipt, and cleanup receipt.
- Produces: escaped bounded HTML, deterministic marker, and `FinalizationResult` with `transition_allowed` plus target semantic state.

- [ ] **Step 1: Write RED tests**

Test HTML escaping, no secrets, stable marker, marker already present, duplicate marker, ambiguous write reconciliation, wrong issue/project UUID, missing Artifact version, cleanup STOPPED, cleanup ABSENT, cleanup RECOVERY_REQUIRED, and comment not found after write.

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/finalize.test.mjs`

Expected: FAIL because render/finalize modules are absent.

- [ ] **Step 3: Implement deterministic rendering and receipts**

Marker input is canonical `{source_artifact_id,source_version_id,decision_sha256,review_bundle_artifact_id,review_bundle_version_id}`. Render only result, reason codes, selected/skipped checks, build identity, finding count, and exact Artifact@version references. Escape every dynamic string.

Allow transition only when comment read-back contains exactly one marker and cleanup is `STOPPED` or `ABSENT` for the exact environment lease. Route `READY_FOR_PRODUCTION` maps to semantic target `ready_for_production`; every other valid decision maps to `in_progress`.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/qah/finalize.test.mjs`

Expected: PASS; publication or cleanup uncertainty leaves `transition_allowed=false`.

- [ ] **Step 5: Commit Task 6**

```bash
git add scripts/qah/render-comment.mjs scripts/qah/finalize.mjs tests/qah/finalize.test.mjs
git commit -m "feat: gate QA transitions on comment and cleanup"
```

---

### Task 7: Versioned universal BPMN blueprint

**Files:**
- Create: `processes/universal-qa-flow.graph.json`
- Create: `scripts/qah/render-process.mjs`
- Create: `tests/qah/process-blueprint.test.mjs`

**Interfaces:**
- Consumes: exact project UUID, three state UUIDs, QA Codex agent version UUID, optional final decision agent version UUID, and project profile Artifact/version.
- Produces: a complete Nuanu Process graph v1 with immutable UUID nodes/edges and no unresolved semantic bindings.

- [ ] **Step 1: Write blueprint RED tests**

Assert the exact semantic node keys from the design, paired parallel gateways, one default fail-closed edge, End-only state dispositions, no `PayDemo`, no endpoint/path/host UUID literals, output contracts for every Agent Task, and comment/cleanup join before either End.

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/process-blueprint.test.mjs`

Expected: FAIL because blueprint and renderer are absent.

- [ ] **Step 3: Author the graph blueprint**

Use the exact topology:

```text
project_start -> resolve_flow_item -> load_project_context -> plan_qa_scope
-> prepare_environment -> parallel_checks_fork
-> [verify_requirements_and_code, verify_api_contracts,
    verify_ui_with_playwright, prepare_and_verify_domain_data]
-> parallel_checks_join -> aggregate_evidence -> independent_release_decision
-> publication_cleanup_fork
-> [publish_flow_item_comment, cleanup_environment]
-> publication_cleanup_join -> finalize_transition -> transition_route
-> [ready_for_production_end, in_progress_end]
```

Agent instructions must invoke repository-bound relative commands or task-scoped MCP operations. They must not contain `/Users/...`, `/private/tmp/...`, fixed repository URLs, PayDemo endpoints, payment-specific rules, or state UUIDs.

- [ ] **Step 4: Implement semantic rendering**

`renderProcess(blueprint, bindings)` resolves only declared binding tokens, requires all three states to be different, pins published Agent versions, and rejects leftover token syntax. Rendering twice with the same inputs must produce byte-identical canonical JSON.

- [ ] **Step 5: Run local graph tests**

Run: `node --test tests/qah/process-blueprint.test.mjs`

Expected: PASS and graph contains exactly two End dispositions.

- [ ] **Step 6: Commit Task 7**

```bash
git add processes/universal-qa-flow.graph.json scripts/qah/render-process.mjs tests/qah/process-blueprint.test.mjs
git commit -m "feat: define universal QA process blueprint"
```

---

### Task 8: Local end-to-end harness and regression matrix

**Files:**
- Create: `tests/qah/e2e.test.mjs`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: all Tasks 1–7 modules.
- Produces: one local proof for each ticket class and one `npm run verify:qah` entry point.

- [ ] **Step 1: Write a RED end-to-end matrix**

Drive canonical fixtures through profile → context → plan → environment → four concurrent branches → aggregate → decision → comment/cleanup receipts → finalization. Record branch start/end times and assert overlap for at least two applicable branches in the mixed fixture.

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/e2e.test.mjs`

Expected: FAIL until the full orchestration adapter is wired.

- [ ] **Step 3: Add package verification**

```json
"test:qah": "node --test tests/qah/*.test.mjs",
"verify:qah": "npm run test:qah && npm run test:paydemo:harness && npm run typecheck"
```

- [ ] **Step 4: Run full local verification**

Run: `npm run verify:qah`

Expected: all universal and legacy PayDemo harness tests PASS; UI fixture invokes Playwright adapter, API fixture does not, docs fixture creates no environment, mixed fixture overlaps applicable branches.

- [ ] **Step 5: Commit Task 8**

```bash
git add tests/qah/e2e.test.mjs package.json README.md
git commit -m "test: verify universal QA flow locally"
```

---

### Task 9: Nuanu Flow canary deployment

**Files:**
- Create: `docs/operations/universal-qa-flow-runbook.md`
- Modify: `processes/universal-qa-flow.graph.json` only if Nuanu validation reveals a documented contract mismatch.

**Interfaces:**
- Consumes: locally verified rendered graph, workspace `demo`, project `906cbb3d-32a1-4f44-b569-4e2b792ac3d3`, exact state UUIDs read from the project, and published agent versions.
- Produces: one active canary Column Process and immutable run/evidence receipts.

- [ ] **Step 1: Verify worker and project prerequisites read-only**

Confirm `nuanu-flow-worker 0.3.13`, QA Codex Runner online, Codex App Server adapter, concurrency 3 or greater, repository binding available, Playwright module pinned, no active Ready-for-QA runs, and all candidate cards in `In Progress`.

- [ ] **Step 2: Render and dry-run the graph**

Read the exact three state UUIDs and published Agent version UUIDs, render the graph, and call `validate_process_graph` no more than three times. Expected: `valid:true`, no blocking errors, paired structured gateways, and legal topology-derived inputs.

- [ ] **Step 3: Deactivate, patch, validate, and activate the DEMO binding**

Deactivate the existing PayDemo-specific template, patch only with the validated rendered graph and current definition etag, read back the graph, validate the saved definition, and activate it. Do not reuse a frozen old run.

- [ ] **Step 4: Run one API canary ticket**

Create or choose a synthetic API-only ticket, set `execution_mode=auto`, comment the canary reason, and move it to `Ready for QA`. Expected: code+API required, UI+domain SKIPPED, verified comment, cleanup receipt, final `Ready for Production` only for the fixed profile.

- [ ] **Step 5: Run one UI canary ticket**

Expected: Playwright branch executes with screenshot/trace Artifact, API/domain follow the plan, comment is read back, and final state matches the deterministic decision.

- [ ] **Step 6: Run one controlled failure canary**

Expected: confirmed finding or missing evidence returns to `In Progress`; comment names the reason and Artifact versions; no server/port/worktree remains.

- [ ] **Step 7: Record and commit the runbook**

The runbook must contain exact worker start/status/stop commands, safe rollback to the prior template version, quarantine recovery, canary checklist, comment verification, and port/process cleanup checks.

```bash
git add docs/operations/universal-qa-flow-runbook.md
git commit -m "docs: operate universal Nuanu QA flow"
```

---

### Task 10: Final verification and rollout gate

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: local verification and three successful canary receipts.
- Produces: rollout recommendation `GO|NO_GO`; it does not silently enable Auto for existing cards.

- [ ] **Step 1: Run fresh local verification**

Run: `npm run verify:qah`

Expected: exit 0 with no skipped universal tests.

- [ ] **Step 2: Verify Nuanu read-back**

Confirm active graph hash/etag, worker version 0.3.13, no waiting Human Tasks, no active canary runs, exact comments on all three tickets, correct states, versioned evidence, and cleanup receipts.

- [ ] **Step 3: Review safety and scale limits**

Document as `NO_GO` if the pilot still shares worker credentials with tested product code, lacks attempt fencing, cannot route repository worktrees, or cannot guarantee comment-before-End. A project may enter Auto only after its own profile and canary pass.

- [ ] **Step 4: Update README with the supported onboarding path**

Describe: add `qa-harness.yaml`, validate locally, install the blueprint instance, run API/UI/failure canaries, then explicitly enable Auto per Flow item or project policy.

- [ ] **Step 5: Commit final documentation**

```bash
git add README.md
git commit -m "docs: onboard projects to universal QA"
```

- [ ] **Step 6: Produce the final evidence summary**

Report commit range, test counts, three Nuanu run IDs, issue references, graph hash/etag, worker identity/version, branch overlap evidence, Artifact@version references, final states, and known scale limitations. Do not claim universal rollout from only the DEMO profile.
