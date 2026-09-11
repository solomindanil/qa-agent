# QAH Product Graph Offline Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the complete Ready-for-QA to deterministic routing flow with a synthetic Product Graph plan and the real local QAH contracts, without reading or executing a Freeland product repository.

**Architecture:** Add a closed graph-plan boundary in front of the existing QAH planner, compile it into the existing four bounded execution branches, and wrap the local QAH result in a graph-bound decision receipt. A CLI runs three offline scenarios; future Product Graph and repository-builder integrations replace only provider/executor ports.

**Tech Stack:** Node.js ESM, `node:test`, existing QAH contracts, canonical SHA-256 receipts, stock Nuanu worker 0.3.14 validator.

## Global Constraints

- Do not read, clone, fetch, checkout, build, or execute a Freeland product repository.
- Ticket and graph inputs cannot supply a repository URL, product URL, credential, path, cwd, command, executable, or environment key.
- Do not mutate Nuanu Flow backend, plugin, worker, live Process, binding, or Flow item.
- Product Graph remains external; QAH consumes only a closed graph test plan.
- A graph-required run has no path/label fallback.
- Stale, unknown, conflicted, foreign, malformed, or digest-mismatched plans never produce PASS.
- Human-only obligations map to human review even when all automated checks pass.
- Existing QAH execution, aggregate, finalization, and Proof Gate contracts remain authoritative for automated evidence.
- Follow RED -> minimal GREEN -> focused GREEN before every commit. Add no runtime dependency.

---

### Task 1: Closed graph-plan and criticality contracts

**Files:**
- Create: `scripts/qah/graph-plan.mjs`
- Create: `tests/qah/graph-plan.test.mjs`

**Interfaces:**
- Consumes: `canonicalJson(value)` and `sha256(value)` from `scripts/qah/canonical.mjs`.
- Produces: `validateColumnTicketEvent(value)`, `createSyntheticGraphPlan(event, scenario)`, `admitGraphTestPlan(event, value)`, `classifyGraphCriticality(plan)`, and `compileGraphExecutionAssignment(event, plan)`.

- [ ] **Step 1: Write failing tests**

Use one literal `nuanu.qa-column-ticket-event.v1` fixture for `in_progress -> ready_for_qa`. Add these complete behaviors:

```js
test("synthetic graph plan compiles exact impacted and always-on checks", () => {
  const event = ticketEvent();
  const plan = createSyntheticGraphPlan(event, "noncritical");
  const assignment = compileGraphExecutionAssignment(event, plan);
  assert.equal(admitGraphTestPlan(event, plan).status, "ACCEPTED");
  assert.deepEqual(assignment.branches, ["code", "api", "ui"]);
  assert.deepEqual(assignment.automated_checks.map(({ check_id }) => check_id), [
    "qah.contracts", "profile.api", "profile.ui",
  ]);
  assert.deepEqual(assignment.human_checks, []);
});

test("payment business obligations cannot become automated only", () => {
  const plan = createSyntheticGraphPlan(ticketEvent(), "critical");
  assert.deepEqual(classifyGraphCriticality(plan), {
    status: "HUMAN_REQUIRED",
    human_check_ids: ["payment.card-human-approval"],
    reason_codes: ["HUMAN_ONLY_BUSINESS_FUNCTION", "PAYMENT_IMPACT"],
  });
});

test("foreign stale unknown conflicted tampered and incomplete plans hold", () => {
  const event = ticketEvent();
  const valid = createSyntheticGraphPlan(event, "noncritical");
  for (const value of hostilePlans(valid)) {
    assert.equal(admitGraphTestPlan(event, value).status, "HOLD");
  }
});

test("ticket and graph inputs reject authority bearing fields", () => {
  const event = ticketEvent();
  assert.throws(() => validateColumnTicketEvent({ ...event, repository_url: "https://example.test/product.git" }));
  assert.equal(admitGraphTestPlan(event, { ...createSyntheticGraphPlan(event, "noncritical"), cwd: "/tmp/product" }).status, "HOLD");
});
```

`hostilePlans` returns literal cases for foreign ticket, each non-current freshness, unchanged digest after payload mutation, missing transitive check, missing human provenance, extra key, cycle, and throwing Proxy.

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/graph-plan.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/qah/graph-plan.mjs`.

- [ ] **Step 3: Implement minimal contracts**

Use closed records, maximum 16 impact paths, 32 checks, 16 facts, unique IDs, and `plan_digest = sha256(unsignedPlan)`. `admitGraphTestPlan` catches hostile values and returns sorted reason codes. It verifies exact event/candidate/environment identity, every mandatory check is reachable from an impact path, every always-on check is mandatory, and every human check has an exact `human_only` fact with provenance digest.

- [ ] **Step 4: Run GREEN and commit**

```bash
node --test tests/qah/graph-plan.test.mjs
git add scripts/qah/graph-plan.mjs tests/qah/graph-plan.test.mjs
git commit -m "feat: add closed qah graph plan contracts"
```

---

### Task 2: Graph-driven QAH planning without heuristic fallback

**Files:**
- Modify: `scripts/qah/plan.mjs`
- Modify: `scripts/qah/contracts.mjs`
- Modify: `scripts/qah/task-runtime.mjs`
- Modify: `scripts/qah/aggregate.mjs`
- Modify: `tests/qah/plan.test.mjs`
- Modify: `tests/qah/task-runtime.test.mjs`
- Modify: `tests/qah/aggregate.test.mjs`

**Interfaces:**
- Consumes: `compileGraphExecutionAssignment(event, graphPlan)`.
- Produces: `planQaScope(context, profile, graphInput?)`, where graph input is absent for legacy runs or exactly `{ event, plan }`.

- [ ] **Step 1: Write planner and aggregate RED tests**

```js
test("graph planning ignores contradictory path and label heuristics", async () => {
  const context = await fixture("docs");
  context.changed_files = ["docs/readme.md"];
  context.labels = [];
  const event = ticketEvent();
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");
  const plan = planQaScope(context, profile, { event, plan: graphPlan });
  assert.deepEqual(plan.applicability, {
    code: "REQUIRED", api: "REQUIRED", ui: "REQUIRED", domain: "NOT_APPLICABLE",
  });
  assert.equal(plan.graph_binding.graph_plan_digest, graphPlan.plan_digest);
  assert.deepEqual(plan.graph_binding, plan.artifact_slot.graph_binding);
});

test("graph required planning never falls back after admission failure", async () => {
  const event = ticketEvent();
  const graphPlan = createSyntheticGraphPlan(event, "noncritical");
  graphPlan.plan_digest = "sha256:" + "0".repeat(64);
  assert.throws(() => planQaScope(await fixture("mixed"), profile, { event, plan: graphPlan }), /graph plan admission failed/i);
});
```

Add the exact runtime and aggregate assertions:

```js
const prepared = await runTaskCommand("plan-qa-scope", {
  phase: "prepare", context, profile, graph_input: { event, plan: graphPlan },
  carry: { profile_ref, workspace_id },
}, options);
const persisted = JSON.parse(await readFile(join(outputDir, "test-plan.json"), "utf8"));
assert.deepEqual(persisted.graph_binding, persisted.artifact_slot.graph_binding);
assert.equal(persisted.graph_binding.graph_plan_digest, graphPlan.plan_digest);

assert.deepEqual(validateFullTestPlan(graphBoundPlan), []);
const substituted = structuredClone(graphBoundPlan);
substituted.artifact_slot.graph_binding.graph_digest = "sha256:" + "f".repeat(64);
const { plan_sha256: _old, ...unsigned } = substituted;
substituted.plan_sha256 = sha256(unsigned);
assert.deepEqual(validateFullTestPlan(substituted), ["INVALID_FULL_PLAN"]);
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/plan.test.mjs tests/qah/task-runtime.test.mjs tests/qah/aggregate.test.mjs`

Expected: FAIL because `planQaScope` ignores graph input and full-plan validation rejects graph fields.

- [ ] **Step 3: Implement graph planning**

When graph input exists, derive applicability only from assignment branches; derive reasons from exact check IDs; use the existing evidence-kind map; use CRITICAL risk for human-required and HIGH otherwise. Add exact `nuanu.qa-graph-binding.v1` to both plan and artifact slot with event, ticket, candidate, graph, knowledge, plan digests, and criticality.

`validateTestPlan` accepts only the optional closed graph binding. `validateFullTestPlan` admits either the legacy exact key set or graph exact key set, requires full/artifact binding equality, and hashes every unsigned field. `task-runtime` accepts exactly legacy input or graph input, never extra keys.

- [ ] **Step 4: Run GREEN and commit**

```bash
node --test tests/qah/graph-plan.test.mjs tests/qah/plan.test.mjs tests/qah/task-runtime.test.mjs tests/qah/aggregate.test.mjs
git add scripts/qah/plan.mjs scripts/qah/contracts.mjs scripts/qah/task-runtime.mjs scripts/qah/aggregate.mjs tests/qah/plan.test.mjs tests/qah/task-runtime.test.mjs tests/qah/aggregate.test.mjs
git commit -m "feat: plan qah scope from product graph receipts"
```

---

### Task 3: Offline Ready-for-QA orchestration and routing

**Files:**
- Create: `scripts/qah/offline-graph-flow.mjs`
- Modify: `scripts/qah/local-harness.mjs`
- Modify: `scripts/qah/run-branch.mjs`
- Create: `tests/qah/offline-graph-flow.test.mjs`
- Modify: `tests/qah/e2e.test.mjs`

**Interfaces:**
- Produces: `runOfflineGraphQaFlow({ event, graphPlan, executeAssignment })` and `createOfflineHarnessExecutor({ runHarness, buildCanonicalCompletion, finalizationOutputDefinition })`.

- [ ] **Step 1: Write orchestration RED tests**

```js
test("Ready for QA noncritical event executes graph scope and proposes production", async () => {
  const receipt = await runScenario("noncritical");
  assert.equal(receipt.trigger, "column:ready_for_qa");
  assert.equal(receipt.execution_attempts, 1);
  assert.deepEqual(receipt.executed_check_ids, ["qah.contracts", "profile.api", "profile.ui"]);
  assert.equal(receipt.route, "READY_FOR_PRODUCTION");
  assert.equal(receipt.proof_gate_outcome, "passed");
});

test("critical payment impact runs automation but routes to a human", async () => {
  const receipt = await runScenario("critical");
  assert.equal(receipt.execution.automated_route, "READY_FOR_PRODUCTION");
  assert.equal(receipt.route, "HUMAN_REVIEW");
  assert.equal(receipt.proof_gate_outcome, "unable_to_verify");
  assert.deepEqual(receipt.human_check_ids, ["payment.card-human-approval"]);
});

test("confirmed impacted failure returns the ticket to work", async () => {
  const receipt = await runScenario("product-failure");
  assert.equal(receipt.route, "RETURN_TO_WORK");
  assert.equal(receipt.proof_gate_outcome, "not_passed");
});

test("invalid graph authority holds before executor call", async () => {
  let calls = 0;
  const receipt = await runOfflineGraphQaFlow({ event: ticketEvent(), graphPlan: tamperedPlan(), executeAssignment: async () => { calls += 1; } });
  assert.equal(calls, 0);
  assert.equal(receipt.route, "HOLD");
});
```

The real local harness runs through the pinned worker validator. Assert exact zero telemetry for product repository reads, Git commands, product-network requests, and credential reads.

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/offline-graph-flow.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `offline-graph-flow.mjs`.

- [ ] **Step 3: Implement minimal orchestration**

`local-harness.mjs` accepts `graphInput` and forwards it only to `plan-qa-scope`. `run-branch.mjs` accepts either the legacy exact plan key set or the graph-bound exact key set and requires the root/artifact graph bindings to match. The executor uses fixed local fixtures, requires local plan branches to equal assignment branches, and hashes a sanitized evidence summary. Route precedence is integrity HOLD, authenticated product failure, human obligation, then fully verified production readiness.

- [ ] **Step 4: Run GREEN and commit**

```bash
node --test tests/qah/offline-graph-flow.test.mjs tests/qah/e2e.test.mjs tests/qah/branch-runner.test.mjs
git add scripts/qah/offline-graph-flow.mjs scripts/qah/local-harness.mjs scripts/qah/run-branch.mjs tests/qah/offline-graph-flow.test.mjs docs/superpowers/plans/2026-08-12-qah-product-graph-offline-integration.md
git commit -m "feat: run offline graph driven qah flow"
```

---

### Task 4: Canonical demo report and full verification

**Files:**
- Create: `scripts/qah/worker-contract.mjs`
- Create: `scripts/qah/offline-graph-demo.mjs`
- Modify: `tests/qah/helpers/worker-contract.mjs`
- Create: `tests/qah/offline-graph-demo.test.mjs`
- Modify: `package.json`
- Create: `docs/operations/OFFLINE-GRAPH-DEMO.md`

**Interfaces:**
- Produces: `runOfflineGraphDemo()` and CLI `npm run demo:qah:graph-offline` emitting one canonical JSON document.

- [ ] **Step 1: Write CLI RED tests**

```js
test("offline demo emits canonical sanitized routes", async () => {
  const report = await runOfflineGraphDemo();
  assert.deepEqual(report.scenarios.map(({ route }) => route), [
    "READY_FOR_PRODUCTION", "HUMAN_REVIEW", "RETURN_TO_WORK",
  ]);
  assert.deepEqual(report.summary, {
    scenarios: 3,
    product_repository_reads: 0,
    git_commands: 0,
    product_network_requests: 0,
    credential_reads: 0,
  });
  assert.doesNotMatch(canonicalJson(report), /token|password|Authorization:|github\.com\/.*Freeland/i);
});
```

Spawn the CLI and assert stdout equals `canonicalJson(JSON.parse(stdout))`, with no trailing newline and empty stderr.

- [ ] **Step 2: Run RED**

Run: `node --test tests/qah/offline-graph-demo.test.mjs`

Expected: FAIL because demo modules do not exist.

- [ ] **Step 3: Implement demo**

Move the existing bounded worker 0.3.14 loader from the test helper into `scripts/qah/worker-contract.mjs`; make the helper re-export it. Run the three scenarios in fixed order, aggregate only authority counters, and write `canonicalJson(report)` with no newline. Document the command, routes, zero-authority proof, and future adapter swap without claiming live Nuanu activation.

- [ ] **Step 4: Run focused and full GREEN**

```bash
node --test tests/qah/offline-graph-demo.test.mjs tests/qah/offline-graph-flow.test.mjs tests/qah/e2e.test.mjs
npm run demo:qah:graph-offline
npm run verify:qah:proof-gate
npm run verify:qah
git diff --check
```

Expected: all tests/typecheck PASS; demo prints the three exact routes and zero authority counters.

- [ ] **Step 5: Commit and inspect final state**

```bash
git add scripts/qah/worker-contract.mjs scripts/qah/offline-graph-demo.mjs tests/qah/helpers/worker-contract.mjs tests/qah/offline-graph-demo.test.mjs package.json docs/operations/OFFLINE-GRAPH-DEMO.md
git commit -m "feat: add offline product graph qah demo"
git status --short
git log -6 --oneline
```

Expected: empty status and the design, plan, and four implementation commits in dependency order.
