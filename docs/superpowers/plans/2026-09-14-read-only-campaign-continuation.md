# Read-only Campaign Continuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover a registered read-only campaign after an owned worker dies, retain completed checks and execute only eligible remaining work through the existing runner.

**Architecture:** Add opt-in v1 run records and a versioned reader to Console; extend the paired Kernel's workspace grammar. Immutable completion records are continuation authority, while the existing classifier remains QA-verdict authority. A live same-host launcher controls worker handover; no second runner or cloud service.

**Tech Stack:** Node.js 22, existing TypeScript/ESM, node:test, existing Playwright API adapter, Zod and filesystem helpers. No new package or database.

**Spec:** [Approved design](../specs/2026-09-14-read-only-campaign-continuation-design.md), document SHA256 `9e3485425d10e5300f58e14ebcbef31ea52256f8541949a7d4334de7241b0837`, approved by user after independent Lead AQA review.

**Approved portability addendum:** [accepted-directory publication order](../specs/2026-09-14-continuation-publication-portability-amendment.md), approved 2026-09-14. Prepare/publish the complete accepted bundle0700/0400, then seal through its retained descriptor to0500/0400; exact valid bytes interrupted before chmod are nonterminal `bundle_sealing_pending`. The original spec digest is retained, not silently replaced.

## Global Constraints

- Extend Console `881a93e43fd9b90f3dcf9812812f6cf8ad854789` / Kernel `657894dbd61561a634f36669a0874dccccbea59e` in independent candidate checkouts; root design commit `d0239eebe2e2d5cb39d0068cb63fa1aee6978da4`.
- Old `run-*` and `qa-campaign-receipt.v0` remain strict, unchanged historical evidence. New runs use `run-v1-<binding16>-<uuid>` and `qa-campaign-receipt.v1`.
- Logical attempts remain `[1]` or `[1,2]`; a transport execution UUID is not an assertion retry. First pass/harness_failure finishes a check; other first outcomes require attempt2.
- Partial progress never returns a terminal verdict or authorization to dispatch. Exact completed evidence must not be rewritten, sanitized again or replayed.
- Raw/staging stays in an explicit private store; managed workspace contains only bounded validated records and accepted artifacts. No implicit original-machine path.
- Qualification is owned same-origin public repeat-safe GET, anonymous, no cross-origin dependencies, no payment, browser replay, host restart or cloud recovery.
- Single live launcher owns worker handover. PID absence, timeout or an editable JSON death claim never permits takeover.
- No active source/skill/campaign migration, product/tracker changes or push. Candidate component commits and root source delivery are separate gates.

## File boundaries and execution

Paths beginning `components/` refer to independent child Git repositories, not root-tracked source. Root commits deliver reviewed child history through bundles only at Task7. Existing files stay with their current owners; introduce small modules rather than a second large runner.

| Task | Owns | Depends on |
| --- | --- | --- |
| 1 | Pure continuation projection and retry decision, tests | Existing outcome kinds and approved spec |
| 2 | Private staging, exclusive publication and immutable directory lifecycle | Task1 identities; existing secure-path patterns |
| 3 | Snapshot/receipt v1 validation, Kernel grammar, partial reader | Tasks1–2 record format |
| 4 | Same-host launcher admission and worker handover | Task2 private store; Task3 identity |
| 5 | Existing runner + registered CLI integration | Tasks1–4 |
| 6 | Actual interruption proof and fresh consumer | Task5 exact reviewed source pair |
| 7 | Portable delivery, documentation and root qualification | All previous reviews |

Use the already isolated normal clone. Root packaging `npm test` is a baseline, not product QA. For child TS gates, install each child's own lockfile only into that isolated candidate (`npm ci --ignore-scripts --no-audit --no-fund`); no browser download or dependency upgrade. Do not run Console/Freeland default `npm test`.

The user previously requested the coordinator to implement as well as delegate. Coordinator owns implementation/integration; isolated subagents perform concrete audits/reviews without shared-file writes. Preserve a ledger in `.superpowers/sdd/2026-09-14-read-only-campaign-continuation/`. Every task has focused RED→GREEN and an independent spec/quality review before its commit is accepted. Do not stop for another scope approval between these already approved tasks.

### Task 1: Derive remaining work without inventing a verdict

**Files:**
- Create Console `src/lib/campaign-continuation-state.mjs`.
- Create Console `src/lib/campaign-continuation-state.d.mts` for the TS runner and plain ESM reader, following the existing dependency-module pattern.
- Create Console `tests/unit/campaign-continuation-state.test.ts`.
- Existing runner retry decision is inspected here and consumed from the shared helper in Task5.

**Interfaces:**
- Export `requiresSecondCampaignAttempt(outcome)` for the existing five kinds: `pass`, `oracle_failure`, `environment_failure`, `harness_failure`, `action_failure`.
- Export `deriveCampaignContinuation({checkIds, executions, blockedTargets})`.
- An execution projection has exactly `checkId`, `attempt:1|2`, `executionId`, positive integer `ownerGeneration`, `previousExecutionId:string|null`, and `committedOutcome:kind|null`. This is an internal projection from verified records, not a substitute for Task3 hash/schema validation.
- Return `{checks, blockedTargets, counts}`. Each check contains `checkId`, `state:'unstarted'|'uncertain'|'retry_pending'|'finalized'`, `nextAttempt:1|2|null`, ordered `acceptedExecutionIds`, and retained `uncertainExecutionIds`. Counts are `{total, finalized, uncertain, retryPending, unstarted}`. No verdict, timestamps, I/O or dispatch capability.

- [x] Write a failing behavior test for A completed/B uncertain/C unstarted. Use literal expected states/counts, not output-derived expectations:

```js
assert.deepEqual(deriveCampaignContinuation({
  checkIds: ['A', 'B', 'C'], blockedTargets: [], executions: [
    { checkId: 'A', attempt: 1, executionId: 'a1', ownerGeneration: 1,
      previousExecutionId: null, committedOutcome: 'pass' },
    { checkId: 'B', attempt: 1, executionId: 'b1', ownerGeneration: 1,
      previousExecutionId: null, committedOutcome: null },
  ],
}).checks.map(({checkId, state, nextAttempt}) => [checkId, state, nextAttempt]),
[['A', 'finalized', null], ['B', 'uncertain', 1], ['C', 'unstarted', 1]]);
```

- [x] Run `node --import tsx --test tests/unit/campaign-continuation-state.test.ts` from Console. Record the first behavior RED; a missing import alone is not behavioral evidence. A new module may initially expose a minimal empty projection solely to reach the assertion.
- [x] Implement pure grouping by check/logical attempt. For each nonempty attempt, require one linear predecessor chain, no missing predecessor/cycle/fork, increasing ownerGeneration on replay, and a sole committed tail. Reject duplicate IDs, foreign checks, unsupported outcomes, duplicate completions or replay after completion. Filesystem input order must not choose a winner.
- [x] Derive attempt2 only after a finalized first outcome that requires it; reject attempt2 after first pass/harness failure or before finalized attempt1. Keep earlier uncertain execution IDs as history after successful replay. Return fresh immutable data, preserving blockers without changing their semantics.

```js
// Shared retry decision; outcome validation precedes this expression.
return outcome !== 'pass' && outcome !== 'harness_failure';
```

- [x] Add and observe RED before each behavior family: retry_pending and second-attempt replay; out-of-order input; conflicting chains/completions; blocker/input immutability. Null is uncertain, not a passing outcome. No generic parser framework.
- [x] Run the focused file to GREEN and typecheck its declaration/consumer; review module+types+tests independently. Commit only those three Console files: `feat: derive campaign continuation progress`.

### Task 2: Publish immutable records without identity-less crash debris

**Files:**
- Create Console `src/node/campaign-continuation-files.ts`.
- Create Console `tests/unit/campaign-continuation-files.test.ts`.
- Reuse Console `src/node/qa-campaign-files.ts` secure path/identity patterns without weakening its v0 contract.

**Interfaces:**
- `acquireContinuationWriteAdmission({workspacePath, storeRoot, runId})` creates a real exclusive local write admission and returns identity-checked `assertCurrent()` / `release()` methods. This authorizes internal filesystem publication only, not product dispatch or takeover of an existing admission. Task4 adds worker lifecycle ownership; there is no allow-by-default death callback.
- `prepareContinuationDirectory({storeRoot, relativePath, files})` builds bounded private staging, where files contain `{path, bytes, mode}`; returns a prepared directory with exact inventories. `publishPreparedContinuationDirectory({workspacePath, prepared, admission})` publishes to a missing contained target. `sealContinuationDirectory({workspacePath, runId, admission})` changes only verified known modes.
- These are byte-level internal primitives. Task3 supplies record schemas; Task5 composes validated `publishRun`/`publishStart`/`publishAccepted`/`publishReceipt` operations from them. Tests here prove atomic bytes, not that arbitrary test JSON constitutes valid campaign evidence. Private paths never enter public record fields.
- Sealer interface refinement: also require `relativePath` (the exact run or one exact accepted subtree) and ephemeral `expected:{directories:[{path,identity:{dev,ino}}],files:[{path,identity:{dev,ino},size,sha256}]}`. Paths are relative to that subtree, with the root directory represented by `""`. Copy and bound inputs before yielding; verify the whole exact inventory before any chmod, then seal only700→500 bottom-up with retained descriptors and readback. Files remain400 and unchanged. Task3 supplies this inventory only after semantic validation; it is not a second checkpoint, CLI authority or a `validated:true` callback. Failure after permission mutation/finalization retains uncertain ownership; the primitive never unlocks it. Fully sealed repeat is read-only.
- Receipt publication seam: `publishPreparedContinuationReceipt({workspacePath,runId,admission,prepared,expectedRunIdentity:{dev,ino}})` reuses the same private preparation/publication lifecycle for one file, `receipt.json`, into the exact existing run. Preparation has `relativePath` equal to the run directory, only receipt.json400 and private directory700. Expected run identity comes from Task3 readback. Rename the complete private file, not a hardlink or direct public write; verify absence, retained descriptors,400 bytes, source/destination parent sync and readback. Shared unknown-outcome handling applies. This filesystem publication alone is not a terminal QA result.

- [x] Write filesystem tests using fresh owned temporary directories: run identity appears atomically; start+execution appear together; already-existing targets are never replaced; foreign root/symlink/hardlink fails; raw interrupted bytes remain private and unchanged.
- [x] Run `node --import tsx --test tests/unit/campaign-continuation-files.test.ts` and capture expected RED.
- [x] Implement contained private staging on the same filesystem, complete validation/readback before publication, fsync writes, then exclusive-owner atomic publication. Only known structural ancestors may pre-exist. A crash before publication leaves no identity-less public run/execution.

```ts
await admission.assertCurrent();
await prepared.verifyExactBytes();
await prepared.publishAbsentTarget();
await published.verifyExactBytes();
```

`prepared`/`published` are private implementation objects inside this module: they hold opened directory/leaf identities, bounded files and the exact destination. Their methods must refuse replacements or unknown publication outcomes, not return a guessed success. Public store methods remain the interface above.

- [x] Publish accepted as a whole complete bundle0700/0400, then descriptor-bound seal/readback0500/0400 per the approved portability addendum. Keep run/start records0400, active ancestors0700. Scope sanitizer to new execution; previous commits are hash-verified and never repaired. Admission metadata lives outside run inventory.
- [x] Kill owned publisher processes at prepared/published boundaries and verify all-or-absent data. Add partial chmod/sealing_pending tests; do not treat a helper-thrown exception as the only crash proof.
- [x] Focused tests GREEN, independent review, Console commit `feat: publish immutable campaign continuation records`.

Task2 accepted as a byte-level filesystem layer at Console
`01c4d294d081cd26a1320c06461cb7d863434c2b`:123/123 combined with Task1,
strict scoped TS, worker syntax and diff checks; independent Lead AQA spec and
quality APPROVED. Runtime qualification here is macOS/process kill, not Linux
execution or power loss. The semantic `sealing_pending` reader, dispatch owner,
registered CLI recovery and root adoption remain Tasks3–7.

### Task 3: Validate v1 partial and terminal evidence through real consumers

**Files:**
- Create Console `src/lib/campaign-continuation-v1.mjs` (strict record schemas and semantic validation).
- Create Console `server/campaign-continuation-reader.mjs` (bounded file reads, inventory/hash binding).
- Modify Console `server/campaign-receipts.mjs` (version dispatch/discovery only).
- Create Console `tests/unit/campaign-continuation-readback.test.ts`.
- Create Kernel `src/kernel/console-campaign-v1.ts` (narrow structural/permission policy).
- Modify Kernel `src/kernel/workspace-validator.ts` (delegate v1 path policy; retain v0).
- Create Kernel `tests/console-campaign-v1.test.ts` following existing workspace-test fixture conventions.

**Interfaces:**
- `validateContinuationRecords({run, starts, completes, artifacts, receipt})` validates exact strict versions, IDs, digest bindings, declared inventory and legal lineage; produces Task1 projections only after validation.
- `readCampaignContinuation({workspacePath, runId})` returns `{phase:'partial'|'bundle_sealing_pending'|'sealing_pending'|'terminal', identity, progress, receipt}`; receipt is null unless fully sealed. `bundle_sealing_pending` requires complete exact run/start/complete bindings and inventory; it grants neither PASS nor dispatch. No mutations, product requests or auto-selection by mtime.
- Identity includes canonical original plan and original blockers, graph/catalog/binding, source pair, registration/publication/oracle/dependency bindings, origin and supported target identity. Hash run/start canonically; complete hashes result/trace/required screenshot but not itself; terminal inventory hashes complete.
- Kernel `consoleCampaignV1EntryPolicy(relativePath, phase)` recognizes only spec grammar. Semantic parent admission comes from parsed run/plan and exact receipt when phase is sealing_pending, not just a regex or claimed phase string.

- [ ] Create real on-disk A/B/C partial tree with Task2 writer. Assert actual Kernel preflight and reader accept its safe partial state; a raw v0 writable directory remains rejected. Assert reader cannot obtain final verdict from a partial run.

```ts
assert.equal(snapshot.phase, 'partial');
assert.equal(snapshot.receipt, null);
assert.deepEqual(snapshot.progress.counts,
  {total: 3, finalized: 1, uncertain: 1, retryPending: 0, unstarted: 1});
```

- [ ] Observe RED on both consumers, then implement strict v1 schemas/readback and delegate to Task1. Reject changed result/trace/complete, missing screenshot when required, extra files, unknown IDs and duplicate complete. Do not re-sanitize rejected history.
- [ ] Add valid receipt + mixed ancestor0700/0500 tree: Kernel may accept sealing_pending; reader must not expose terminal receipt until fully sealed. Broken inventory still refuses all recovery.
- [ ] New discovery lists v1 partial independently from older v0 PASS; explicit v1 selection never falls back to v0. Unknown version is refused; unchanged old binaries are unsupported for v1 rather than patched retroactively.
- [ ] Run new Console/Kernel tests plus existing `campaign-receipt-ingestion.test.ts`, `qa-campaign-v0.test.ts` and Kernel workspace validation controls. Review both candidate diffs. Commit per repository, then pin the reviewed candidate Kernel in candidate Console only; no root active-manifest change.

### Task 4: Admit one live worker and transfer only after known termination

**Files:**
- Create Console `src/node/campaign-continuation-owner.ts`.
- Create Console `tests/unit/campaign-continuation-owner.test.ts`.
- Create Console `tests/unit/fixtures/campaign-continuation-owner-worker.mjs`.
- Use existing child-launch patterns in Console `server/bridge.mjs`; no new server/daemon.

**Interfaces:**
- `createContinuationHost({workspacePath, storeRoot})` owns ChildProcess handles and a private local channel. `host.launch({runId, command, args})` creates an owned worker; `host.resume({runId, command, args})` requires proven previous child/descendant exit. `host.close()` stops only owned resources.
- Worker obtains an unforgeable-in-protocol session through its inherited host channel, not a supplied JSON death file. `session.assertCurrent()`, `session.nextExecution({checkId, attempt})` and `session.close()` bind run, source, private root and owner generation. No session can outlive host/channel termination.
- Process proof uses original handle/nonce+actual exit/close and owned descendant termination, not a liveness query alone. Unsupported platform/descendant ownership => `ownership_unresolved` without unlock.

- [ ] Write real child-process tests: second contender denied before dispatch; host observes exact worker close; resume admits successor only after owned group ends; fake death JSON cannot acquire; alternate store cannot become second owner.
- [ ] Observe RED, implement local channel and campaign admission using Task2 exclusive/identity patterns. Do not persist a second authoritative check-progress snapshot in host state.

```ts
await priorWorker.closed;
await priorWorker.assertOwnedDescendantsExited();
await admission.releaseExactPriorOwner();
return launchNextGeneration();
```

These operations are private to the host module and use retained handles/identities. There is no public `forceUnlock` or external callback that may simply assert death.

- [ ] Add host-disconnect, descendant-alive and delayed old-worker controls. New host after host loss remains blocked; unsupported recovery is not a failed product check.
- [ ] Focused child tests GREEN, independent concurrency review, Console commit `feat: admit bounded same-host campaign continuation`.

### Task 5: Connect the existing runner and registered CLI

**Files:**
- Modify Console `src/node/qa-campaign-runner.ts`, `scripts/qa-campaign.ts`.
- Modify Console `tests/unit/qa-campaign-runner.test.ts`, `tests/unit/qa-campaign-cli.test.ts`.
- Create Console `tests/unit/campaign-continuation-runner.test.ts`.
- Create Console `tests/unit/fixtures/campaign-continuation-target.ts` (owned API fixture and explicit stable identity).

**Interfaces:**
- Extend existing `runQaCampaign` input with optional `continuation` session; v0 default stays unchanged. Existing loop consumes `progress.checks`, reads committed results and invokes existing classifier; replace duplicated first-retry predicate with Task1 helper.
- Extend same CLI with `status --workspace --run-id` and `resume --workspace --run-id --execution-store`; `run` gets opt-in continuation and explicit store/host channel. No second CLI executor.
- Fixture capability binds a concrete repeat-safe route set plus instance/build/data and anonymous context. An agent-authored `read_only` flag alone cannot grant replay.

- [ ] Add runner test where A already finalized and B uncertain: adapter is called only for B and C, A artifact bytes unchanged. Assert real output receipt via Task3 reader, not a handcrafted expected JSON.
- [ ] Observe RED. Introduce resume initialization in current loop; start before adapter; await adapter including finalization; publish accepted after validation/sanitation; keep logical retries intact. Rehydrate owned artifact identities before handling any old evidence.

```ts
const snapshot = await readCampaignContinuation({workspacePath, runId});
await continuation.assertCurrent();
await verifyStaticIdentity(snapshot.identity);
await verifyFixtureIdentity(snapshot.identity);
// Existing check loop selects nextAttempt or reuses accepted results.
// Existing classifyCheck / verdictForStatus compute the final QA result.
```

Identity verification compares exact current source/plan/authority before target reads, then the explicit fixture identity response before test dispatch and after execution. Its implementation lives with runner continuation integration, not a new global identity service.

- [ ] Preserve current post-adapter late-guard semantics and both actual CLI Kernel validations. Unsupported browser/dependency/payment replay refuses before dispatch; result errors never become missing-data PASS.
- [ ] Terminal repeat is read-only without target probe/request; sealing_pending finishes only permissions and actual reader. Static mismatch yields zero target reads; target mismatch permits identity read only.
- [ ] Run new tests plus runner/CLI, receipt-ingestion, dependency and browser-finalization regressions. Independent review, then Console commit `feat: resume registered read-only campaigns`.

### Task 6: Prove actual process interruption and fresh-session use

**Files:**
- Create root `evals/campaign-continuation/recovery.mts`.
- Extend root `evals/campaign-continuation/README.md` without rewriting historical diagnostic claims.
- Create root `evals/campaign-continuation/recovery-acceptance.md`.
- Reuse Console `tests/fixtures/nuanu-readonly/fixture.ts` `registerAuthoredFixture` and existing Kernel publication, with the owned API target replacing the fixture web routes.

- [ ] Register an owned loopback fixture through real fixture registration/Kernel publication, freeze exact candidate pair, plan and fixture identity. No weakening of public HTTPS intake and no copied product credentials.
- [ ] Through the actual CLI finish A, let server hold B, then SIGKILL only the owned worker. Fresh process reads progress and resumes through the same launcher. Actual final reader must accept the receipt.

```ts
assert.deepEqual(serverCounts, {A: 1, B: 2, C: 1});
assert.equal(hashAfterA, hashBeforeA);
assert.equal(timestampAfterA, timestampBeforeA);
assert.equal(finalReader.phase, 'terminal');
```

- [ ] Repeat terminal read/resume and assert no count changes. Seed broken C and retain a blocked target: neither disappears or becomes PASS. Preserve old private/raw interrupted generation without publishing it.
- [ ] Exercise each spec crash boundary, mid-sealing modes, static/target drift and concurrent-owner negative. Each test records whether it is an actual process kill, filesystem fault injection or source-only check; do not conflate those evidence classes.
- [ ] Fresh independent agent gets source entry + run ID, reads actual progress and states the concrete next action. Record redundant user questions, lost scope, repeated requests and unsupported claims, not only whether the tool exited0.
- [ ] Independent Lead AQA reviews source plus observed artifacts/counts. Commit the reproducible eval and a report retaining exact source attribution; no real-product recovery claim.

### Task 7: Deliver the reviewed pair without changing active campaigns

**Files:**
- New reviewed complete-history candidate bundles under root `sources/candidates/`.
- Modify root `sources/manifest.v1.json` only after explicit adoption gate.
- Add root `docs/qualification/campaign-continuation-20260914.md`.
- Update root `docs/qualification/current.md`, global plan and relevant source-skill continuation reference.

- [ ] Run exact candidate focused/full owning offline gates proportional to changed surfaces, nonincremental typecheck and consumer tests; retain warnings/failures by source. Root packaging is a separate test.
- [ ] Generate and hash complete-history bundles, restore into a fresh normal root clone, verify exact sources and run the recovery consumer from those restored sources with its own dependencies.
- [ ] Prepare adoption diff referencing reviewed hashes, source roles and old/new evidence scope. Independent whole-delivery review must include Kernel/Console pairing and no implicit campaign/installed-skill switch.
- [ ] With adoption authority, change source manifest and current-entry links; otherwise retain candidates and report the remaining integration gate. No product push, deployment or tracker writes.
- [ ] Record exact passing and blocked scope, next capability to qualify, and known host-loss/browser/cloud exclusions. Do not mark global Stage3 complete from this single recovery proof.

## Self-review and requirement map

Spec1–2 → scope/global constraints + Tasks5–7; spec3 → Tasks1–3; spec4 → Tasks2–3;
spec5 → Tasks1/5; spec6 → Task4; spec7 → Tasks3/5/6; spec8 → Tasks2–7.
Task1 produces progress only, Task3 proves file identity, Task4 authorizes dispatch,
Task5 alone creates final verdict through the existing classifier. Their outputs
are deliberately not interchangeable. Private staging has no competing progress
authority. Do not parallel-write common schemas, runner or selected-source pins.
