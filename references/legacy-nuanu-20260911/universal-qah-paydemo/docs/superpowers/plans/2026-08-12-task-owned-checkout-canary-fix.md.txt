# Task-Owned Checkout Canary Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the stock Nuanu Assist canary verify and report only the supervisor-owned task repository head, then prove the corrected path with one bounded live run.

**Architecture:** The runner keeps its existing three-phase task-local protocol, but its production checkout authority becomes `process.cwd()` and never `NUANU_CODEX_CWD`. The process instruction invokes the CLI relatively from the task worktree. The complete verified branch is fast-forwarded to the GitHub default branch before a new Flow item creates its canonical repository workspace.

**Tech Stack:** Node.js 20, `node:test`, Git, Nuanu Flow stock BPMN/Column Process, nuanu-flow-worker 0.3.14.

## Global Constraints

- Do not modify Nuanu Flow backend, plugin, worker package, compiler, or Proof Gate profiles.
- Binding remains paused except for one bounded Assist dispatch guarded by unconditional pause/read-back.
- Never retry an ambiguous mutation or reuse the failed PAYD-32 run identity.
- `tested_head_sha` must equal the server-admitted repository head and the worker `repository_result.head_sha`.
- Auto remains disabled.

---

### Task 1: Bind canary verification to the task worktree

**Files:**
- Modify: `tests/qah/proof-gate-canary.test.mjs`
- Modify: `tests/qah/process-blueprint.test.mjs`
- Modify: `scripts/qah/proof-gate-canary.mjs`
- Verify: `processes/universal-qa-flow.graph.json`

**Interfaces:**
- Consumes: worker-owned `process.cwd()` and task-local `NUANU_TASK_DIR`.
- Produces: unchanged `runProofGateCanaryPhase(phase, input, options)` with test-only `options.checkout`; production ignores `NUANU_CODEX_CWD`.

- [x] **Step 1: Write the failing runner authority test**

Add a test that sets `NUANU_CODEX_CWD=/foreign/launcher`, omits top-level `options.checkout`, and injects `readRepositoryIdentity(checkout)` which asserts `checkout === process.cwd()`. The prepare phase must succeed and persist the current working directory's injected commit.

- [x] **Step 2: Write the failing blueprint instruction test**

Assert the rendered `finalize_transition` instruction contains `node scripts/qah/proof-gate-canary.mjs`, does not contain `NUANU_CODEX_CWD`, and does not describe an absolute runner.

- [x] **Step 3: Run RED**

Run:

```bash
node --test tests/qah/proof-gate-canary.test.mjs tests/qah/process-blueprint.test.mjs
```

Expected: the runner authority test fails because the foreign launcher checkout is selected.

- [x] **Step 4: Implement the minimal fix**

Use:

```js
const checkout = options.checkout ?? process.cwd();
```

Keep all existing repository identity, clean-tree, origin, profile, and canonical evidence checks unchanged.

- [x] **Step 5: Run GREEN and the full proof gate suite**

Run:

```bash
node --test tests/qah/proof-gate-canary.test.mjs tests/qah/process-blueprint.test.mjs
npm run verify:qah:proof-gate
git diff --check
```

Expected: zero failures, zero skips/TODOs, TypeScript exit 0, diff check exit 0.

- [ ] **Step 6: Commit and push the feature branch**

```bash
git add docs/superpowers/specs/2026-08-12-stock-nuanu-single-task-canary-design.md docs/superpowers/plans/2026-08-12-task-owned-checkout-canary-fix.md tests/qah/proof-gate-canary.test.mjs tests/qah/process-blueprint.test.mjs scripts/qah/proof-gate-canary.mjs
git commit -m "fix: bind qah canary to task checkout"
git push origin codex/universal-qah
```

### Task 2: Align canonical Git and run one guarded Assist canary

**Files:**
- Modify after live read-back only: `docs/operations/universal-qa-proof-gate-runbook.md`

**Interfaces:**
- Consumes: clean verified Task 1 commit, current GitHub `main`, fresh Nuanu catalog revision, binding ETag, and zero-active-run lease.
- Produces: one new dedicated Assist item/run and a sanitized canary receipt, with the binding confirmed paused.

- [ ] **Step 1: Verify fast-forward release eligibility**

Require `git rev-list --left-right --count origin/main...HEAD` to return `0 N`, both worktrees clean, and the full Task 1 verification commit to be pushed.

- [ ] **Step 2: Fast-forward the canonical default branch**

```bash
git push origin HEAD:main
```

Read back the exact `refs/heads/main` SHA and require equality to Task 1 HEAD.

- [ ] **Step 3: Patch only the process instruction with a fresh ETag**

While the binding is paused and active-run counts are zero, update only `finalize_transition.config.instruction` to the rendered repository-relative instruction, validate the graph, and read the touched node plus graph hash/ETag back.

- [ ] **Step 4: Create a fresh dedicated canary authority**

Create a new synthetic Flow item after the default-branch read-back, leave it in `Ready for QA`, set it to Assist while the binding is paused, and verify it has no active run. Do not reuse PAYD-29, PAYD-31, PAYD-32, or their idempotency keys.

- [ ] **Step 5: Run exactly one worker and one Assist dispatch**

Start one `universal-qah` worker with concurrency 1. Enter the cleanup guard before activation. Activate, read back, dispatch once with a new idempotency key, immediately pause and read back, then wait only for that run's terminal state without retriggering.

- [ ] **Step 6: Verify the result and safe state**

Require matching `tested_head_sha`, repository result, exact JSON Artifact versions, Proof Gate outcome, no automatic status movement in Assist, binding paused, no active run, canary Manual/uncontrolled after cleanup, and no worker process.

- [ ] **Step 7: Record only verified sanitized evidence**

Append IDs, hashes, commit, outcome, Artifact IDs/versions, and final paused state to the runbook only after successful exact read-back. If blocked, record the blocker without claiming a canary pass.

### Task 3: Make provider branch publication worker-owned

**Files:**
- Modify: `processes/universal-qa-flow.graph.json`
- Modify: `tests/qah/process-blueprint.test.mjs`
- Modify: `scripts/qah/render-process.mjs`
- Modify: `docs/superpowers/specs/2026-08-12-stock-nuanu-single-task-canary-design.md`
- Modify: `docs/operations/universal-qa-proof-gate-runbook.md`

**Interfaces:**
- Consumes: the exact clean supervisor-owned task HEAD and stock worker 0.3.14 repository supervision.
- Produces: one server-owned `verified_commit` output of kind `git.commit`; QAH still produces only the two canonical JSON document outputs.

- [x] **Step 1: Write and run the failing output-contract test**

Require `finalize_transition` to declare exactly `verified_commit: { kind: "git.commit" }`, retain the two JSON document outputs, and explicitly forbid the Agent from creating a commit. Run the focused blueprint tests and observe failure because the output is absent.

- [x] **Step 2: Add the minimal stock-native contract and run GREEN**

Add the commit output and instruction, update the reviewed blueprint fingerprint, and rerun the focused blueprint and canary tests with zero failures and zero skips.

- [ ] **Step 3: Run the complete repository gate and publish the product commit**

Run `npm run verify:qah:proof-gate`, `git diff --check`, commit the exact reviewed paths, push `codex/universal-qah`, fast-forward `main`, and read back both remote refs at the exact commit.

- [ ] **Step 4: Patch and read back the paused Process**

With a fresh ETag, paused binding, and zero active runs, update only the exact Agent instruction/output contract. Validate and read back the graph, output slots, hash, ETag, and paused binding.

- [ ] **Step 5: Prove one fresh Assist run without manual task-branch push**

Create a fresh Assist item after the default-branch push. Do not create or push its task branch manually. Run one dedicated worker and one guarded dispatch, then require the stock supervisor-created remote task branch, injected `verified_commit`, matching `tested_head_sha`, `passed` Proof Gate, suppressed Assist transition, unchanged Ready-for-QA item state, paused binding, and zero active run.
