# Ordinary QA memory cycle implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. Steps use checkbox tracking; the existing actual Sol6.1 author and same Astra reviewer are retained.

**Goal:** Connect the existing protected memory APIs to ordinary QA startup, explicit decisions, learning and the owning report without requiring human-authored memory JSON.

**Architecture:** Console prepares only the verified selected owner, then exposes a strict grant-bound task facade over existing Kernel memory and owning checkpoint readers. Exact intent is retained before supervised writes. The agent supplies meaning and applicability; the existing report remains the sole QA result.

**Tech Stack:** Existing Node/TypeScript, Zod, tsx, private filesystem helpers and Kernel6d; no new dependency, runner, DB or registry.

**Spec:** [ordinary memory cycle design](../specs/2026-10-13-ordinary-qa-memory-cycle-design.md).

## Global constraints

- Source-only implementation and finite local controls; no provider/fresh actors/SRL/benchmark/CI/product calls, graph changes or peer gateway adoption.
- Task stdin ≤64 KiB; result ≤1 MiB; operation key `/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/`.
- Read ≤20 notes/≤8 root refs/≤16 expanded leaves; evidence1..8 selectors, v5 artifacts1..8; existing PNG/text budgets retained.
- Learn1..3 drafts per call, not per task. Zero useful new knowledge needs no learn call and is explained in ordinary reasoning.
- Intent each≤128 KiB and operation≤512 KiB; private0700 directories/exclusive0600 files; result each≤1 MiB and≤16 attempt/result files per item.
- Preserve original contexts/keys/bytes; no implicit reconciliation, stale retry, rank-to-evidence promotion or batch atomicity.
- No-memory launch/input/report versions remain byte-compatible. UI/report grammar unchanged; source guides belong to the parallel guide author.

## Review focus

1. A string shorthand must normalize before object property/root access, but association writes must await trusted registered/source/root preflight.
2. A reused operation key with changed semantics must conflict even when auto-context or an enclosing checkpoint file changed.
3. Failed journal publication after a canonical save must stay unknown; remaining items must not run.
4. Symlink/hardlink/foreign notes paths cannot turn the task journal into new managed or source write authority.
5. Empty identity recall is not empty memory, and candidate qualifications/pixel metadata are not inspected evidence.

### Block 1: Trusted entry and strict task surface

**Files:** modify Console `src/node/agent-host-activity.mjs`, `.d.mts`, `src/node/agent-memory-host-grant.mjs`, `scripts/qa-memory.ts`; create `src/node/agent-memory-task.ts`, `tests/unit/agent-memory-task.test.ts`.

**Interfaces:** `prepareHostMemoryAccess` consumes the verified captured request, shorthand/object selection and paired pins, returns the existing memoryAccess object. `loadAgentMemoryTaskRuntime()` resolves only a live protected grant. `runAgentMemoryTask(input)` accepts the exact six-operation task schema and returns the strict task result/access envelope. Existing low-level commands and protected grant remain authoritative.

- [x] Add schema/route negative FIRST before production implementation; the causal failure must be missing task support rather than an incidental dirty-source guard.

```ts
test('task input rejects caller roots and oversized selection before effects', async () => {
  const {parseMemoryTaskInput}=await import('../../src/node/agent-memory-task');
  assert.throws(()=>parseMemoryTaskInput({schemaVersion:'qa-memory-task-input.v1',operation:'recall',workspacePath:'/foreign',query:{}},qa));
});
```

- [x] Add task-only CLI branch with `task --input -`; reuse bounded stdin and existing safe error transport. Construct schemas from accepted public Kernel shapes; validate complete filled drafts before writes.
- [x] Normalize `current_owner` from the captured registered workspace before early root computation. After existing preflight, public bounded recall validates an existing self-home. Only shorthand+owner-output+`MEMORY_ASSOCIATION_REQUIRED` may call initial self-association using verified authority and `ordinary-self-`+canonical digest. Other errors/foreign homes remain gaps.
- [x] Append only the trusted generic task instructions and validate the final launch prompt again against16KiB. Preserve all no-memory bytes.
- [x] Run only named schema/current-owner/no-memory controls; retain FIRST. Clean coherent source checkpoint precedes protected grant tests. Do not weaken source guards.

### Block 2: Exact evidence, original intents and supervised learning

**Files:** create task module above; modify `src/node/agent-memory-evidence-reader.ts`; tests in `tests/unit/agent-memory-task.test.ts` and `tests/unit/agent-memory-task-cycle.test.ts`. Existing supervisor/worker/Kernel remain unchanged.

**Interfaces:** `resolveTaskEvidenceSelections` consumes verified current owner/request, exact checkpoint format/revision and explicit selectors, produces strict RequestEvidenceRefs from owning capture. Task facade uses `loadAgentMemoryRuntime`, `runtime.snapshotRecall`, `runtime.saveV2`, `runtime.recover`, `runtime.readV2` and `encodeMemoryAssessmentReasoning`.

- [x] Build evidence refs from `captureAgentRequestReport`; verify checkpoint membership and selected artifacts/native assertion. No latest/all-artifacts fallback or invented qualification refs. Return existing details resolution and unread qualification context.
- [x] For read/evidence use bounded empty public recall solely for current identity. Recall returns the actual selected query result and snapshot; no context output file in read-only mode.
- [x] Create request/operation-bound notes journal only after grant/mode/layout checks. Retain exact request+checkpoint anchor+caller payload and each original validated SaveInput before any managed save. Strict canonical digests, bounded no-follow reads, exclusive synchronized publication/readback; no overwrite/eviction.
- [x] Derive request IDs as `ordinary-`+digest of `{requestDigest,operationKey,item}`; reuse original intent/context on repeated payload. Different payload under same key returns `MEMORY_TASK_OPERATION_CONFLICT`.
- [x] Save sequentially through existing supervisor; exact public note readback verifies the entire canonical note, expected identity/product/home/request and content digest. Persist per-item outcomes; failed/unknown stops remaining items. Recovery selects only retained original intent/attempt, never caller witness.

```ts
const first=await task({schemaVersion:'qa-memory-task-input.v1',operation:'learn',operationKey:'capture-claim',checkpoint,drafts});
assert.equal(first.result.items[0].status,'saved');
const same=await task({schemaVersion:'qa-memory-task-input.v1',operation:'learn',operationKey:'capture-claim',checkpoint,drafts});
assert.equal(same.result.items[0].result.resource.id,first.result.items[0].result.resource.id);
await assert.rejects(task({...input,drafts:[{...drafts[0],title:'Changed meaning'}]}),{code:'MEMORY_TASK_OPERATION_CONFLICT'});
```

- [x] Add finite faults for partial save, missing result artifact/readback and lost retained recovery metadata; original intents and first canonical note remain intact. Reuse unchanged existing recovery tests, not their full heavy suite.

### Block 3: One owning local cycle and affected review

**Files:** task-cycle test above; source guide author owns Console SKILL/agent-memory reference and exact Claude mirrors; no report/UI grammar edits.

- [x] Freeze clean coherent Console after compiler/schema checks and coordinate one serial owning fixture window with root.
- [x] Existing new synthetic owner + actual protected grant → task recall/read/exact evidence → normal owning checkpoint → explicit learning → reasoning encoder → ordinary successor checkpoint → CLI/SSR/export reopen. No provider or product call; original native denominator/dispositions stay unchanged. A source-only unassessed anchor remains unassessed.
- [x] Prove first self-association once, read-only missing writes zero, caller-authority/foreign/closed grant refusal (expiry remains the existing grant-reader contract, not a new fixture claim), no-memory literal prompt/argv compatibility, exact selected evidence and stable-key conflict, per-item partial/unknown and retained-intent recovery.
- [x] Run affected compiler: `npm run typecheck` (actual compiler command; generated tracked tsbuildinfo restored before freeze); named local controls: `node --import tsx --test tests/unit/agent-memory-task.test.ts` and the coordinated selected owning task-cycle bodies. Python fixture checks only when the new inert host test needs the already selected interpreter. No default npm test or unrelated replay.
- [x] Self-review spec coverage and actual results; same Astra performs one affected source review. Repair only concrete findings, retain FIRST, commit only owning Console paths. Root handles manifests/bundles/current/roadmap. Engineering completion does not close prior provider/native/semantic/scale acceptance gaps.

## Observed completion

Console final `4daf3cf93acc44c8f7cbb2a3bc7c3162616bc29c`, clean; Kernel unchanged `6d38980ab77621f4c1fe85872985600a3cf13c9f`. Production body committed at58527f2; successor commits are guides/tests only. Same Astra final affected review accepted the exact pair on2026-10-13.

Ten distinct owning bodies passed across preserved serial runs; seven pure schema/normalization bodies and the affected compiler passed. Original combined cycle FIRST timed out240s after a verified canonical save. Only that control was split into three lifecycle bodies with unchanged or smaller limits. Two subsequent test-only defects (compact host hash vs Kernel newline hash, and forbidden deletion of prior finding identity) were corrected without production changes. Independent passing controls were not replayed.

Exact result/source/custody mapping is private `.local/memory-foundation/ordinary-cycle/STATUS.md`; no real provider/product/native execution, experiment, benchmark or CI ran. The finite fixtures exercised the task v5/source-only cycle; they do not close existing provider, browser/native image, semantic quality, scale or peer gateway-composition gaps. Missing admitted source-store binding remains explicit source_snapshot unavailable. Default no-memory entry remains unchanged and opt-in setup is required.
