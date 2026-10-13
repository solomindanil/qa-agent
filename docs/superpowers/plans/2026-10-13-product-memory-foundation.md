# Product Memory Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the actual Sol 6.1 implementation. Steps use checkbox (`- [ ]`) syntax for tracking. The user selected the implementation method and three large delivery blocks; do not introduce a new reviewer or user approval per function.

**Goal:** Build one usable product-memory foundation that accumulates scoped knowledge, resolves exact primary support, derives bounded task context, and participates in ordinary QA→saved result→UI→fresh continuation without losing historical knowledge.

**Architecture:** Canonical immutable memory remains under the selected existing Kernel memoryHome; campaign evidence owners are associated explicitly. JSON-sharded retrieval and applicability dossiers are derived consumers, while the current request/report/native-coverage owners retain their authority. Selectively compose donor memory/v5 capabilities onto current main; no second runner, external graph database, or new model dependency.

**Tech Stack:** Existing Node ≥22.12.0, TypeScript, Zod, private filesystem primitives, Vitest, Console Node tests, React and current Playwright fixture controls. No new runtime dependency.

**Spec:** [Authoritative design](../specs/2026-10-13-product-memory-foundation-design.md). Its public type/field names and error semantics govern implementation; this plan does not select alternative schema semantics.

**Execution checkpoint, 13 October:** local candidate Kernel6d38980 / Consolea2e2bbb implements the three blocks' source paths with same-Astra source and affected-repair review. [Current qualification](../../qualification/current.md) records actual source controls and retained FIRST failures. The later instrumented P14 CLI/SSR/export control passed at150.53s with unchanged240s/90s limits; final exceptional journal-error handling and tool-event accounting have affected passing controls. The whole-block checkboxes remain incomplete: large-corpus acceptance and ordinary gateway/provider prerequisites remain open, and the user excludes fresh-agent comparison from this engineering pass. No comparative score exists. Code presence or local packaging does not close those exits. Existing native graph, old product owners, installed skills and parallel Claude/Freeland work remain unchanged.

## Global Constraints

- Start from verified normal root `/Users/danilsolomin/projectsnew/qa-agent-product-memory-foundation-20261013`, branch `codex/product-memory-foundation-20261013`, base `a81732955709ac32506c2defc20efd4e774f2786`; initial actual Console `afed2bc74e4da5fce8b32c9b244b851fbb6ccd87`, Kernel `09300746bd7857e7a5973bd9d81065b746eb72d8`.
- Product identity is `memoryProductId`, generated from verified origin owner/native product identity. Slug equality never associates owners. One existing memoryHome owns canonical memory; trusted association selects permitted campaign evidence owners.
- Canonical records remain immutable, nonnormative and `agent_authored_unattested`; Kernel verifies form/identity/bytes/effects, not the truth of a claim. Native graph/catalog/oracle/coverage publication remains its existing operation.
- V1 notes and legacy request histories retain bytes, IDs, receipts and captured contexts. New note v2/request v5/export v9 are explicit versions; main request v4/export v8 remain supported. Never convert the same request key silently or downgrade parser after a version refusal.
- Query v2: terms≤8, each≤256 Unicode chars; conceptIds≤16; relationKinds≤8; hops0..2; maxVisitedRecords≤1000; pageSize≤20; returnedEvidenceSelections≤8; output≤1MiB; `narrowingAllowed:false`.
- Support target:10,000 canonical records≤160MiB total; each record≤16KiB,≤16references/corrections,≤8concepts,≤1structured claim. Rebuild≤60s/peakRSS≤512MiB;32fixed queries×3orders, warm median≤2s/p95≤5s; cold-process timing reported separately against retained index, not claimed OS-disk-cache-cold. Transport hard output≤1MiB; acceptance actor-context selection≤64KiB is a separate soft budget. Primary detail costs remain separately visible and inside actor budget. Canonical fallback≤1000records/16MiB per call; inventory scan retry≤2.
- Normalize with `text.normalize("NFC").toLowerCase()`, version `literal-nfc-lowercase.v1`; do not claim full Unicode casefold. Without explicit aliases ß/SS and ё/е remain distinct. No stemming, automatic translation or entity merge.
- The measured native-read overhead repair follows design §26 only: an internal guarded native leaf reader within one readpoint, fresh file bytes and initial-inventory metadata, immediate-parent checks and closing full ancestor/root/tree proof at all three operation points. Generic/full/v1/evidence/private-store readers remain their existing owners. Check actual path/leaf mutation interleavings before claiming the scoped guarantee; neither atomic snapshot nor transient-ABA exclusion is promised. Repeat the same short measurement on the clean repair before the unchanged 10k protocol.
- Historical support, current use, receipt integrity and binding are separate. Unknown condition is not wildcard; source-hash change is not semantic invalidation; an unchanged hash does not establish deployment applicability.
- Existing action-time/owner guards remain. A trusted memoryHome binding is not an arbitrary writable directory. Preserve `agent-host-activity.mjs` registered-root/preflight boundary and integrate the accepted Claude/A7 adapter through that owner rather than build another host runner.
- Ordinary multi-owner memory access uses design §23: optional trusted `startHostActivity.memoryAccess`, an immutable request/profile/runtime-bound access grant in the existing protected activity session root, and an exact finite owner route map. CLI owner selectors choose within hosted grants; they cannot create grants. The associated memoryHome is writable only in the owner-output profile; additional evidence owners remain read-only. Missing routing is a launch/setup gap, not permission to import a helper or copy managed owners.
- Ordinary image delivery uses design §25: trusted optional `imageCapability`, unavailable by default, with a session directory derived from the validated notes directory and bound inside the same host grant. Runtime revalidates the grant rather than trusting environment paths. Export retains `inspection:not_performed`; S18 requires a separate actual image-tool read and its exact product context.
- Normal locked local dependency setup and reversible source/fixture tests are part of implementation. No CI, push, watcher, installed-skill adoption, active campaign migration, real ToolShop requests, old actors A/B/C replay or unscoped product effects are included.
- Current docs preparation performs no product implementation or benchmark execution. After design/plan issues are resolved, continue the already chosen implementation without a repeated user approval; coordinator implementation GO remains the phase handoff.

## Review Focus

1. Same-slug independent products and foreign owner references must refuse association/read/write; genuine associated campaigns must share stable product memory without weakening their original owner guards (block1/3).
2. A later append changes record file digest but must preserve exact prior primary selection and expose relevant newer restrictions; forged same-ID evidence must fail integrity (block1/3).
3. A missing/corrupt/stale/partially rebuilt index or exhausted query budget cannot hide new canonical knowledge, erase old notes, yield complete empty retrieval or narrow original obligations (block2).
4. Different roles/builds/states, ambiguous RU/EN aliases, contradictory sources and repeated copies cannot become same entity, independent support, normative oracle or current PASS by schema/ranking alone (block1/2/3).
5. A successful canonical commit with failed index maintenance or uncertain final readback must expose its actual effect/recovery; competing writes/corrections retain all winning history, and ordinary host/report/UI must show those same facts (block1/3).

## Source selection and composition rules

The checked map is `.local/memory-foundation/SOURCE-MAP.md`. Donor K is `/Users/danilsolomin/projectsnew/qa-agent-k02-memory-impact-20261013`: Console8463b57/Kernel2cf13c4, root6f52da4. It is a local donor, not the selected runtime or an installed skill. Kernel differs from main in16tracked paths; Console differs in96, including removals of current afed summary/drawer/thumbnail/Now UI. Compose exact needed additions/branches into the main child repositories; preserve their current files and main behavior. No wholesale replacement or recapture of old owners.

Main v4 record/readback/proposal are in Console `src/lib/agent-request-checkpoint.ts:205`; v4 packet is `src/node/qa-outcomes-export.ts:105` (v8). Donor v5 definitions are `agent-request-checkpoint.ts:569–575`, embedded evidence is `src/lib/agent-request-execution-evidence.ts`, and v9 is `qa-outcomes-export.ts:110`. Donor `storedV5Pair` rejects same-key legacy/v4 history. Adopt these exact branches and their owning tests together; v4 references select existing observation/native grammar, v5 selects explicit execution/artifact IDs. Do not infer one format from another.

Keep fixture/runtime/environment defaults closed. Execute child commands from their actual child. No component default `npm test` is used as a generic product smoke check. Lockfile installation, if needed for local implementation, is `npm ci --ignore-scripts` using the current lock without browser/plugin downloads. Do not silently change dependencies or tracked compiler artifacts; Console compile uses `--incremental false`.

## Block 1 — Canonical knowledge and owning integrity

**Files — Kernel:**

- Selectively add donor `src/contracts/agent-memory.ts`, `src/kernel/agent-memory.ts`, `agent-memory-context.ts`, `agent-memory-notes.ts`, and their existing memory tests/helper; extend these additive v2 branches under the Spec.
- Create `src/kernel/agent-memory-product.ts` for stable binding/association, `src/kernel/agent-memory-details.ts` for bounded exact references, `src/kernel/agent-memory-access.ts` for the internal trusted access factory, `src/kernel/agent-memory-dependencies.ts` for the narrow trusted runtime dependency, and `src/kernel/agent-memory-write-recovery.ts` for the exact supervised attempt reconciliation.
- Modify public `src/index.ts`, `src/kernel/workspace-validator.ts` and the narrow owned memory runtime dependency declaration as required by the Spec. Extend existing `src/kernel/private-store.ts` with opt-in `qa-private-write.v2` admission/recovery for new memory writers only; v1 callers/admissions retain their behavior. The same private-store primitives remain the sole atomic write/read/CAS machinery.
- Modify `src/kernel/registration-store.ts` existing session/source snapshot reader and its public input validation to support explicit no-repair reads; preserve current default for every unrelated caller.
- Create `tests/helpers/product-memory.ts`, `tests/kernel/agent-memory-product.test.ts`, `agent-memory-typed.test.ts`, `agent-memory-details.test.ts`, `agent-memory-write-recovery.test.ts`; extend the existing private-store tests and `tests/registration/store.test.ts` with no-change v1/zero-repair detail controls.

**Files — Console:**

- Add donor `scripts/qa-memory.ts`, `src/node/agent-memory-runtime.ts` and owning package script/tests.
- Create `src/node/agent-memory-evidence-reader.ts`, `agent-memory-write-worker.ts`, `agent-memory-write-supervisor.ts`, `tests/unit/agent-memory-evidence-reader.test.ts`, and `agent-memory-write-recovery.test.ts`. The supervised child performs one owning filesystem operation only; it is not a browser/model/product/QA runner.
- Selectively compose v5 exact evidence prerequisites in `src/lib/agent-request-execution-evidence.ts`, `agent-request-checkpoint.ts`, `src/node/agent-request-checkpoint.ts`, `agent-request-runtime.ts`, `agent-request-report.ts`, `qa-outcomes-export.ts`, `src/lib/qa-outcomes.ts`; add donor grounded request helper and contract/IO/owner tests. Broader transport/UI exposure remains block3.

**Interfaces:**

- Consume Spec §14 `NoteDraftV2`, `ContextV2`, `MemoryReferenceV2`, `ReferenceResolution`, `SelectionReceipt`, product-binding.v1 and exact finite error codes. Unknown fields refuse; the v1 schema is not silently widened.
- Produce `saveAgentMemory(input: SaveInputV2, deps?: WorkspaceKernelDependencies & MemoryRuntimeDependenciesV2): Promise<SaveResultV2>`, `associateAgentMemoryOwner(input: AssociateInputV1, deps?): Promise<AssociateResultV1>` and `readAgentMemoryDetails(input: DetailInputV2, deps?): Promise<DetailResultV2>`, retaining separate old overloads. `deps` for all v2 operations is the same intersection as save.
- Trusted dependency is `readRequestEvidence(ref: RequestEvidenceRef, access: VerifiedMemoryAccess, budget: Readonly<MemoryEvidenceReadBudget>): Promise<ResolvedRequestSelection>` in `agent-memory-dependencies.ts` (design §22). `VerifiedMemoryAccess` is an in-process capability from the existing Console owner authority, never wire data. The callback shares the owning operation's remaining selection and byte budgets; nested qualifications cannot reset them. Public callback/URL injection and caller-authored receipts are not accepted inputs.
- V2 contexts and trusted owner bindings explicitly identify `workspaceDigestScope:'memory-native-definition.v1'` (design §22). This is the directly validated native definition projection, not the full workspace validation receipt. Independent output append does not invalidate this identity; selected primary evidence retains its separate owning validation. V1 and request basis digests keep their existing full-workspace semantics.
- Internal Kernel factory is `resolveVerifiedMemoryAccess(workspacePath: string, host: TrustedMemoryHostAccess, deps: WorkspaceKernelDependencies): Promise<VerifiedMemoryAccess>` in `agent-memory-access.ts`; recheck actual home/request bindings and allowed roots through owning guards. Neither `ContextV2` nor copied binding constructs permission.
- Public recovery is `recoverAgentMemoryWrite(input: RecoverInputV1, deps: WorkspaceKernelDependencies & MemoryRuntimeDependenciesV2): Promise<RecoverResultV1>`; trusted dependency `readWriterTermination(attemptId: string, access: VerifiedMemoryAccess): Promise<VerifiedWriterTermination|null>`. `RecoverInputV1` contains only original exact `SaveInputV2` plus returned attemptId, never caller termination witness/PID/force flag.
- Console resolver consumes current public versioned request readers and returns only selected primary plus relevant owning qualifications and inspected/unread boundaries. Kernel receives normalized receipts through the pinned in-process runtime, revalidates association/bytes before commit, and never imports Console.

- [ ] **1. Pin the deterministic controls before implementation.** Extend the existing `makeMemoryFixture` helper with independent product homes, same-slug products, trusted campaign association, old v1 note bytes, typed source/v4/v5 fixtures and injected persistence boundaries. Preserve immutable failed input/context before every mutation. Fixture factories return the exact Spec types; they do not construct authoritative receipts from raw caller input.
- [ ] **2. Record failing authority and no-loss assertions.** Tests cover same/different immutable intent, stable memoryProductId across new requests/revisions, same-slug collision, foreign record/ref, copied workspace carrying another home's binding, stale authority, concept collision, concurrent keys/corrections, unknown primary, circular empirical→expectation laundering, invalid/secret/oversize input, link topology and permissions. Readonly capability cannot create product binding, save a note, repair registration cache or publish an index; recall/read must preserve an explicit missing setup/capability outcome. Retain the existing baseline control below as a compatibility anchor; v2 coexistence must leave its original content/ID unchanged.

```ts
import {test, expect} from 'vitest';
import * as qa from '../../src/index.js';
import {makeMemoryFixture, noteDraft} from '../helpers/agent-memory.js';

test('legacy immutable intent remains exact after unrelated knowledge', async () => {
  const f = await makeMemoryFixture();
  try {
    const input = {workspacePath: f.workspacePath, context: f.context,
      draft: noteDraft('legacy-preserved')};
    const first = await qa.saveAgentMemory(input, f.dependencies);
    await qa.saveAgentMemory({...input, draft: noteDraft('unrelated')}, f.dependencies);
    const replay = await qa.saveAgentMemory(input, f.dependencies);
    expect(replay.resource).toEqual(first.resource);
    expect(replay.content).toEqual(first.content);
    expect(replay.replayed).toBe(true);
    expect(replay.effect).toBe('none');
    await expect(qa.saveAgentMemory({...input,
      draft: {...input.draft, body: 'Changed meaning'}}, f.dependencies))
      .rejects.toMatchObject({code: 'MEMORY_REQUEST_CONFLICT'});
  } finally {await f.cleanup();}
}, 60_000);
```

The new `tests/helpers/product-memory.ts` exports `makeProductMemoryFixture(): Promise<{memoryHomeWorkspacePath: string; context: ContextV2; dependencies: WorkspaceKernelDependencies & MemoryRuntimeDependenciesV2; cleanup(): Promise<void>}>`. It reuses the verified registered fixture setup and owning authority readers; it never constructs caller authority from convenient hashes. For the initial same-home fixture, setup calls explicit `associateAgentMemoryOwner` with `AssociateInputV1`, identical memoryHome/campaign paths, an immutable operation key and both current public authority digests before returning the first real v2 context. Recall/save perform no hidden binding initialization. Associated/foreign fixtures use the same setup with explicit trusted owner selection. This exact v2 test requires canonical save, generated concept identity, replay and conflict behavior rather than an instruction-text assertion:

```ts
import {test, expect} from 'vitest';
import * as qa from '../../src/index.js';
import type {Condition, NoteDraftV2, SaveInputV2} from '../../src/index.js';
import {makeProductMemoryFixture} from '../helpers/product-memory.js';

test('v2 records retain generated identity and immutable meaning', async () => {
  const f = await makeProductMemoryFixture();
  try {
    const axes: Condition['axis'][] = ['environment','candidate','role','state','input','rule'];
    const conditions: Condition[] = axes.map(axis => ({axis, state:'unknown',
      reason:'Not established by this controlled knowledge step'}));
    const draft: NoteDraftV2 = {
      schemaVersion:'agent-memory-note-draft.v2', requestId:'typed-unknown-01',
      memoryProductId:f.context.memoryProductId, title:'Catalogue deployment identity',
      body:'The available catalogue evidence does not establish a deployed revision.',
      author:{agent:'Foundation fixture', host:'codex'},
      concepts:[{localId:'catalogue',label:'Catalogue',aliases:['каталог']}],
      knowledge:{epistemicKind:'unknown',statement:'Catalogue deployed revision is unknown',
        subjects:[{kind:'local',localId:'catalogue'}],conditions,basis:[],
        limitations:['Controlled fixture; no product requests']},
      references:[],links:[],limitations:['Deployment is not independently known']
    };
    const input: SaveInputV2 = {schemaVersion:'agent-memory-save-input.v2',
      workspacePath:f.memoryHomeWorkspacePath,context:f.context,draft};
    const first = await qa.saveAgentMemory(input,f.dependencies);
    const replay = await qa.saveAgentMemory(input,f.dependencies);
    expect(first.content.schemaVersion).toBe('agent-memory-note.v2');
    expect(first.content.conceptIds).toHaveLength(1);
    expect(replay.content).toEqual(first.content);
    expect(replay.effect).toBe('none');
    await expect(qa.saveAgentMemory({...input,draft:{...draft,
      knowledge:{...draft.knowledge,statement:'A different claim'}}},f.dependencies))
      .rejects.toMatchObject({code:'MEMORY_REQUEST_CONFLICT'});
  } finally {await f.cleanup();}
}, 60_000);
```

- [ ] **3. Implement the one canonical write path.** Dispatch explicit v1/v2; generate product/concept/record identities from verified binding and operation key; validate finite conditions/basis/links; capture primary refs and revalidate context/association across the commit window; append through existing `writePrivateFileAtomic` expected-target CAS and verified readback. No global publication lock is introduced; nonparticipating source/publication writers are detected by before/after authority/reference checks. Authority change before commit refuses; change after possible commit is historical/contextChanged or WRITE_UNCONFIRMED according to verified outcome. Existing same-input replay remains valid after unrelated writes. Index failure after commit is saved-with-indexUnavailable; possible commit plus failed readback is `MEMORY_WRITE_UNCONFIRMED`. Never remove a crash lock solely by PID/age; owning recovery verifies token/target/intent or keeps busy/unresolved. No lock is held during a model call, source network request or rebuild.
- [ ] **4. Implement exact source/request detail resolution.** Use no-repair source reads. Selective v5 readers and old v4 readers keep their own strict schema/chain checks. For selected cp3, verify immutable selected digests and expose relevant cp5 restrictions without exposing prior planning text; recordFileDigestAtRead is read provenance, not a permanent selection key. Missing selector/reader/version stays finite unavailable/unsupported; no latest fallback or direct managed-file read.
- [ ] **5. Implement and verify actual abrupt-death recovery.** `qa-memory save --format v2` supervises the pinned file-writer child, retains the real process handle/input digest/session-instance-attempt IDs, and persists `agent-memory-writer-termination.v1` only after actual exit/close. Before/after commit kill tests use genuine child death, not handled exceptions. Recovery acquires the exact per-attempt guard, rereads old admission/target/temp under root/inode/mode/no-follow checks and verifies durable termination/intent before retrying the same operation key. Exact committed target returns the original resource; different/unknown target, alive/stale/forged witness or unsupported v1 admission refuses. Supervisor/recovery death without durable witness retains the documented recovery-unavailable gap. Include supervisor IPC/persistence overhead in write timing.
- [ ] **6. Run the owning source tests and inspect effects.** From Kernel run the selected memory/product/details/recovery/registration tests below; from Console run memory CLI/pair/evidence reader/recovery and grounded contract/IO/owner tests. Confirm rejected writes leave intended canonical bytes unchanged and unknown outcomes reconcile the same operation. Include competing process/reconciler barriers and no-repair-call instrumentation; serial success is not a concurrency test. Do not launch historical product owners.

```sh
# components/kernel
./node_modules/.bin/vitest run tests/kernel/agent-memory-notes.test.ts tests/kernel/agent-memory-observation.test.ts tests/kernel/agent-memory-output-limit.test.ts tests/kernel/agent-memory-recall.test.ts tests/kernel/agent-memory-product.test.ts tests/kernel/agent-memory-typed.test.ts tests/kernel/agent-memory-details.test.ts tests/kernel/agent-memory-write-recovery.test.ts tests/registration/store.test.ts
npm run typecheck

# components/console
node --import tsx --test tests/unit/qa-memory-cli.test.ts tests/unit/qa-memory-pair.test.ts tests/unit/agent-memory-evidence-reader.test.ts tests/unit/agent-memory-write-recovery.test.ts tests/unit/agent-request-grounded-contract.test.ts tests/unit/agent-request-grounded-io.test.ts tests/unit/agent-request-grounded-owner.test.ts
./node_modules/.bin/tsc --noEmit --incremental false
```

**Block exit:** Canonical v2 and v1 coexist; exact selected refs have honest statuses; stable product association and immutable recovery are exercised. No ordinary entry advertises a partially supported capability. Preserve FIRST and test identity; do not create a reviewer ceremony per API or function.

## Block 2 — Derived retrieval, applicability and scale

**Files:**

- Create Kernel `src/kernel/agent-memory-index.ts`; extend `agent-memory-details.ts`, existing recall/context/notes, and `src/contracts/agent-memory.ts` under Spec query/result/applicability contracts.
- Add selective donor recommendation `src/contracts/journey-check-recommendations.ts`, `src/kernel/journey-check-recommendations.ts`, public exports and owning test/helper if consumed; advisory paths remain separate from native graph expansion.
- Create `tests/kernel/agent-memory-index.test.ts`, `agent-memory-query.test.ts`, `agent-memory-applicability.test.ts`, `agent-memory-scale.test.ts`; extend `tests/helpers/product-memory.ts` and existing recall/output-limit controls.
- Extend Console `scripts/qa-memory.ts`, `src/node/agent-memory-runtime.ts` and owning CLI/pair tests for explicit v2 recall/read/index rebuild. Setup/recovery operations remain distinct from everyday recall→inspect→save.

**Interfaces:** Consume immutable v1/v2 records and trusted details from block1. Produce `recallAgentMemory(input: RecallInputV2, deps?): Promise<RecallResultV2>`, `readAgentMemoryDetails(input: DetailInputV2, deps?): Promise<DetailResultV2>`, `rebuildAgentMemoryIndex(input: RebuildInputV1, deps?): Promise<RebuildResultV1>`; `deps` is the same `WorkspaceKernelDependencies & MemoryRuntimeDependenciesV2` intersection. `RecallResultV2.page` exposes `complete`, `uninspected`, `budgetExhausted`, counts and cursor; unavailable values are explicit null, not guessed counts. Derived `agent-memory-applicability.v1` retains agent-declared judgement and its task context. No generic semantic model/graph API is introduced.

Extend the same fixture with `seedUnknownNotes(count: number): Promise<void>`: write `count` separate canonical v2 notes through `saveAgentMemory`, each with unique operation/local concept IDs, label `Catalogue`, alias `каталог`, six unknown axes, no fabricated primary support and explicit controlled limits. The fixture's original native graph denominator is not modified. The following test is a real public query/rebuild/pagination control, not a mocked timing check:

```ts
import {test, expect} from 'vitest';
import * as qa from '../../src/index.js';
import type {RecallInputV2, RebuildInputV1} from '../../src/index.js';
import {makeProductMemoryFixture} from '../helpers/product-memory.js';

test('v2 pagination exposes remainder and binds its cursor to the query', async () => {
  const f = await makeProductMemoryFixture();
  try {
    await f.seedUnknownNotes(25);
    const rebuild: RebuildInputV1 = {schemaVersion:'agent-memory-index-input.v1',
      workspacePath:f.memoryHomeWorkspacePath,context:f.context,expectedGeneration:null};
    const index = await qa.rebuildAgentMemoryIndex(rebuild,f.dependencies);
    expect(index.recordCount).toBe(25);
    const input: RecallInputV2 = {schemaVersion:'agent-memory-recall-input.v2',
      workspacePath:f.memoryHomeWorkspacePath,query:{terms:['catalogue'],conceptIds:[],
        relationKinds:[],hops:0,maxVisitedRecords:1000,pageSize:20}};
    const first = await qa.recallAgentMemory(input,f.dependencies);
    expect(first.records).toHaveLength(20);
    expect(first.page).toMatchObject({total:25,matched:25,returned:20,complete:false});
    expect(first.page.nextCursor).not.toBeNull();
    expect(first.denominator.narrowingAllowed).toBe(false);
    const next = await qa.recallAgentMemory({...input,cursor:first.page.nextCursor!},f.dependencies);
    expect(next.records).toHaveLength(5);
    expect(next.page.nextCursor).toBeNull();
    expect(new Set([...first.records,...next.records].map(note => note.noteId)).size).toBe(25);
    await expect(qa.recallAgentMemory({...input,cursor:first.page.nextCursor!,
      query:{...input.query,terms:['unrelated']}},f.dependencies)).rejects.toBeInstanceOf(qa.QaError);
  } finally {await f.cleanup();}
}, 60_000);
```

- [ ] **1. Pin meaningful retrieval and change controls.** Generate fixed controlled records with exact aliases, ambiguous alias collisions, typed graph directions, healthy siblings, independent/duplicate support, equal-authority contradiction, supported supersession, deleted/unavailable basis and scalar/type/role/state/build deltas. Every case keeps original obligations and expected unknowns; naturally unknown conditions do not count as an incorrect failure. Include source hash changed without relevant content change and identical source hash under different deployment scope; NFC-equivalent text matches, ß/SS and ё/е remain distinct without explicit aliases, and aliases containing tool instructions remain inert data.
- [ ] **2. Implement the deterministic derived projection.** Store immutable JSON shards and generation manifest with record digests/provenance pointers; rank exact IDs/aliases/literal terms deterministically and preserve ambiguous matches. Traverse only selected relation kinds/directions under bounded hops/visited records. Return conflict/correction branches outside the first note page, honest paths/reasons, complete native denominator and explicit unread/budget state. If relevant branches exceed the budget, retain unknown link/qualification completeness and separate link cursor; absence of corrections is asserted only on a verified complete generation. Normalization follows the Spec's named/versioned rule; never quietly claim fuzzy/translation/semantic retrieval.
- [ ] **3. Implement index publication and fallback.** Page the owning canonical inventory, validate note bytes/digests, write a new generation into verified private temporary paths, then atomically publish its manifest. Never rewrite canonical notes/bindings. Crash/failure retains the old generation; a successful new save marks incompleteness or publishes a bounded delta. Stale/absent/corrupt index takes bounded canonical fallback with exact cursor or explicit rebuild-required, never hidden full scan or complete empty result. Before/after inventory bindings enforce snapshot or at most two retries.
- [ ] **4. Add real scale and failure assertions.** The same existing Vitest harness generates10,000 records≤160MiB with seed20261013, writes through the canonical fixture lane and measures32 frozen queries in three seeded orders per warm/cold-process path. Perform one timed rebuild and retain its index; do not rebuild96times or claim OS-disk-cache-cold. Capture exact Node/source/host identity, rebuild elapsed time, peakRSS, per-query durations, outputs and FIRST failures. Assert60s/512MiB rebuild, warm median2s/p95five seconds and exact expected counts/pages independently; don't average a failed large corpus with a small one. Keep transport1MiB and selection64KiB budgets distinct. Dispose only fixture-owned generated corpus. Runtime measurements are local support evidence, not product-memory superiority.
- [ ] **5. Run changed query/index/applicability owners once.** Re-run only affected failures after repair; keep incompatible old cursors, corrupt shard/hash, new-note-after-index, interrupted publish, corrupted manifest, context changes, ambiguous aliases and exhausted budgets as negative controls. Compare authoritative note/association inventory before/after rebuild to prove no-loss. The benchmark writes generated IO facts only; it is not a second product runner.

```sh
# components/kernel
./node_modules/.bin/vitest run tests/kernel/agent-memory-recall.test.ts tests/kernel/agent-memory-output-limit.test.ts tests/kernel/agent-memory-index.test.ts tests/kernel/agent-memory-query.test.ts tests/kernel/agent-memory-applicability.test.ts tests/kernel/journey-check-recommendations.test.ts
./node_modules/.bin/vitest run tests/kernel/agent-memory-scale.test.ts
npm run typecheck

# components/console
node --import tsx --test tests/unit/qa-memory-cli.test.ts tests/unit/qa-memory-pair.test.ts
./node_modules/.bin/tsc --noEmit --incremental false
```

**Block exit:** The10k support target has measured local results; canonical fallback/index recovery retain scope and authority; applicability distinguishes historical support/current use; no absent field/hash/rank can turn into product truth. Missing performance target is an explicit repair/unsupported limit, not an acceptance bypass.

## Block 3 — Ordinary host, owning result, UI and one coherent acceptance

**Files — runtime/result integration:**

- Extend Console `src/node/agent-memory-runtime.ts`, `agent-memory-evidence-reader.ts`, versioned request checkpoint/report/CLI/export files above; `scripts/qa-campaign.ts`, `src/node/agent-request-cli-format.ts`, `src/lib/selected-agent-request.ts`, `src/lib/qa-outcomes.ts`.
- Create shared Console `src/lib/agent-memory-report.ts` and its strict parser/encoder tests. New dossier travels as whole canonical `qa-memory-assessment-reasoning.v1` JSON string in existing `Assessment.reasoning`; no outer v4/v5/v8/v9 grammar or sidecar verdict extension.
- Extend actual owning entry/association and capability routing at its selected source; `server/agent-observation-cli.mjs`, `bridge.mjs`, `monitor-owner-reference.mjs`, `monitor-reader.mjs`, `selected-campaign-readback.mjs`, `src/lib/root-monitor/monitor-contract.mjs`/HTTP declarations only for changed transport. Do not add a competing request owner or universal routing registry.
- Consume the independently accepted Claude/A7 host adoption on the then-current exact source. If that source has not delivered, retain honest unsupported Claude capability while preserving Codex source integration; no copying unfinished source or moving A7 owner. Host grant for another memoryHome is derived solely from verified trusted association and exact allowed roots; preserve existing protected source/activity roots and registered preflight.

**Files — UI/instructions/tests:**

- Extend current main `src/primary-ui/owner/OwnerAgentRequestReport.tsx`, `CheckDetail.tsx`, `projection.ts`, `monitor-projection.ts`, `gate-sampled.ts`, routing and exact selection consumers. Preserve main summary/drawer/thumbnail/Now files; graph/claim display does not compute a new verdict.
- Update the complete Console carrier `components/console/skills/qa-product-v0/SKILL.md` and its references `agent-memory.md`, `domain-memory.md`, `agent-request-checkpoints.md`, `agent-observations.md`, with byte-identical Console `.claude` mirrors. Paths elsewhere in this block are relative to the Console component unless stated otherwise. Do not create a duplicate root skill or install source skills. Ordinary entry discovers product/memoryHome/campaign and exact capabilities, records after actual owning readback, and resumes through public readers without coordinator-supplied IDs/old transcript/ready queue.
- Create `tests/unit/agent-memory-foundation-runtime.test.ts`, `agent-memory-report-ui.test.ts`; extend current request checkpoint/report/CLI/selection/export tests and `agent-request-grounded-ui.test.ts`, `primary-ui-report.test.ts`, `primary-ui-owner-shell.test.ts`, `primary-ui-routing.test.ts`, activity tests and the owning `tests/e2e/primary-ui-delivery.spec.ts` fixture only as actually affected.
- Retain the single [acceptance protocol](../specs/2026-10-13-product-memory-acceptance.md); report measured results/limits in its selected output format, without a new metrics service or duplicate per-slice ledger.

**Interfaces:** Consume the same block1/2 public operations/receipts/dossier. Existing `captureAgentRequestReport`, `recordAgentRequestCheckpoint`, explicit discovery, `exportAgentRequestOutcomes`/`readAgentRequestOutcomes` remain the owning result. Main v4/v8 and composed v5/v9 select exact format/revision; memory refs and applicability are structured report inputs, never alternative coverage/result receipts. `encodeMemoryAssessmentReasoning(value: MemoryAssessmentReasoningV1): string` and `parseMemoryAssessmentReasoning(text: string): {kind:'typed';value:MemoryAssessmentReasoningV1}|{kind:'legacy';text:string}|{kind:'unsupported_or_invalid';text:string;reason:string}` share Spec §16 `MemoryApplicabilityV1`. Encoder refuses >65,536characters or existing whole-input budgets; parser preserves invalid/unknown/plain text with honest warning and never silently truncates or evaluates embedded instructions. CLI/main UI/offline reopen use the same parser for one selected revision. Representative version boundary code reuses the actual selectively adopted parser names; malformed/future locators refuse instead of falling back:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAgentRequestRunId,agentRequestRecordFormatOf}
  from '../../src/lib/selected-agent-request';

test('old v4 and added v5 remain distinct explicit selections', () => {
  const requestId = '11111111-2222-4333-8444-555555555555';
  const v4 = `agent-request-v4-${requestId}-r1`;
  const v5 = `agent-request-v5-${requestId}-r1`;
  assert.equal(agentRequestRecordFormatOf(v4),'v4');
  assert.equal(agentRequestRecordFormatOf(v5),'v5');
  assert.deepEqual(parseAgentRequestRunId(v4),{requestId,requestRevision:1});
  assert.deepEqual(parseAgentRequestRunId(v5),{requestId,requestRevision:1});
  assert.throws(() => parseAgentRequestRunId(`agent-request-v6-${requestId}-r1`));
  assert.throws(() => parseAgentRequestRunId(`agent-request-v05-${requestId}-r1`));
});
```

- [ ] **1. Pin old-version and host-boundary regressions.** Keep complete legacy/v4/v8 fixtures and malformed future/unsupported variants; add valid v5/v9 selected primary fixtures. Verify a new request uses the stable memoryProductId but its distinct request identity. Verify trusted associated memoryHome grants are exact, foreign arbitrary roots refuse, and failure/unknown provider activity remains distinct from QA result. Ordinary workflow fixture must perform actual public save/read/checkpoint/export operations rather than assert instruction text alone.
- [ ] **2. Compose request/discovery/export branches onto current main.** Preserve old exact readers, separate filenames/locators, full request scope and current v4 predecessor semantics. New v5 request key is explicit. v9 packet offline read verifies selected embedded bytes and declared history; malformed v9 never uses v8 fallback. Encode typed memory references/applicability inside the existing assessment reasoning string, leaving every outer strict record/packet grammar unchanged. Render human reasoning plus memory panel, preserve legacy/plain/unsupported text and unverified/caller-authored labels; the envelope's checkpoint digest/export preserves that exact decision history.
- [ ] **3. Integrate ordinary host and UI discovery.** Trusted entry resolves memoryHome/product/campaign once and supplies actual capability/pin configuration; supported host executes through current activity adapter. Reader displays selected knowledge/exact primary navigation, qualifications and current declared applicability beside original remainder, without exposing prior-planning text or inventing verdict. Escape labels/body/links and prove source/alias/embedded-document instructions cannot expand tools, permissions, owner or schema authority. Binary evidence uses an actual image-capable owning reader; non-image capability keeps not-inspected rather than treating MIME type as sufficient evidence. Browser fixture reopens the same selected owner/report/export and verifies displayed facts match its public readback. Current actor/host authority remains source-resolved, not granted by a note or path.
- [ ] **4. Execute one frozen coherent acceptance package after structural owners pass.** Freeze exact new source pair, deterministic targets, semantic case manifest, model/settings, actor scope/access/budgets, source atoms, S/R/L content parity and all expected unknowns before dispatch. Full first package is ONE producer plus S/R/L×two fresh stages, six consumer slots, covering three related taskcards. Missing supported L leaves comparison blocked; do not silently drop that arm. Every actor gets the unchanged15min/32call slot and full original taskcard denominator. Package serial ceiling225min includes45min deterministic controls,30min scale,15min producer,90min consumers,45min integrated review, with no padding or fabricated PASS at deadline. Use one acceptance product-private owner and explicit campaign associations through supported setup. Do not copy old managed trees, authority records, notes, registrations or request IDs. Existing retained source bytes are history; controlled variants are clearly controlled. Producer and fresh consumers recover through ordinary entry; later learned facts are projected equally into all comparison arms before the next consumer. No new live ToolShop request or old actor replay follows.
- [ ] **5. Preserve the four acceptance decisions.** Report authoritative storage, derived retrieval, ordinary continuation and comparative benefit separately.33semantic subcases and15lifecycle controls retain their exact acceptance IDs/denominators; correct unknown/refusal may be a passing negative control. For each arm retain36decision atoms; ordinary S readiness requires≥30/36 and each related taskcard≥9/12 with zero unsupported promotions. Benefit requires S−R≥3atoms and wins in≥2of3taskcards, S−L≥1 without additional supported atom loss; tied quality can claim time improvement only under the predeclared20% aggregate paired total criterion with all setup/projection/readback/retry cost. Unsupported oracle/PASS promotion remains a safety failure even with a high total. Full remainder and failed/blocked/unassessed slots stay visible. Mechanisms may pass while comparative benefit stays inconclusive; no fresh tasks, threshold tuning, coordinator coaching or silent replacement arm to manufacture a win. This is bounded foundation acceptance, not whole K02/L02/V01 or universal product PASS.
- [ ] **6. Perform one combined self-review and same independent actual Astra AQA.** Review the complete coherent code/source/affected tests and single acceptance package, then affected repairs with that reviewer. No author-distinct reviewer per helper/function and no new full-package/source/doc ceremonial ladders. Retain exact FIRST, test identity, meaningful measurements and remaining uncertainty. Update final source bundle/manifest only through the normal owned delivery procedure after review; no public CI/push or installed/runtime/old-owner adoption in this scope.

```sh
# components/console: exact affected integration owners
node --import tsx --test tests/unit/agent-memory-foundation-runtime.test.ts tests/unit/agent-memory-report-ui.test.ts tests/unit/agent-request-checkpoint.test.ts tests/unit/agent-request-report.test.ts tests/unit/agent-request-cli.test.ts tests/unit/agent-request-native.test.ts tests/unit/agent-request-native-cli.test.ts tests/unit/selected-agent-request.test.ts tests/unit/selected-agent-request-read.test.ts tests/unit/qa-outcomes-export.test.ts tests/unit/agent-request-grounded-ui.test.ts tests/unit/primary-ui-report.test.ts tests/unit/primary-ui-owner-shell.test.ts tests/unit/primary-ui-routing.test.ts tests/unit/agent-activity.test.ts tests/unit/primary-ui-activity.test.ts tests/unit/qa-product-skill.test.ts
./node_modules/.bin/tsc --noEmit --incremental false
npm run build:primary-ui
./node_modules/.bin/playwright test tests/e2e/primary-ui-delivery.spec.ts

# root: after final reviewed local source composition, packaging only
npm run sources:verify
```

## Dependency order and implementation handoff

Block1 establishes identity, association, immutable v2 persistence and exact source/request evidence resolution. Block2 consumes those records/readers and produces bounded retrieval/dossier/cache recovery. Block3 exposes the same facts through ordinary host/report/UI and performs the one fixed acceptance package. Local test fixtures may be prepared independently after their exact interfaces are frozen, but common source changes and owning writes remain serial. Active Claude/A7 work is neither paused nor migrated; reconcile its final source interface during block3.

The foundation is one end-to-end implementation. A standalone typed record or instruction-only consumer is not its completion. Components retain exact source identities; no acceptance result silently installs instructions or updates frozen owners. Failed feature remains unavailable and preserves FIRST; repair changed controls only. Current docs phase must finish the Spec/plan self-review and coordinator issues before implementation GO; that handoff is not a repeated human authorization request.

## Plan self-review

- [ ] Every design section has a block owner: identity/association/claims/refs/concurrency/legacy in1; retrieval/applicability/scale in2; ordinary host/report/UI/versioned compatibility/coherent acceptance in3.
- [ ] Every Review Focus input has a named owning test/control; old-history no-loss and same-slug/foreign-path controls are not represented by positive-only schema tests.
- [ ] Exact public interfaces/field names/error codes match authoritative Spec; helper names do not substitute new architecture contracts. Typed refs preserve selected primaries plus later relevant qualifications.
- [ ] v1/v4/v8 compatibility and v2/v5/v9 additions are selective, old UI source retained, no unknown-version downgrade or runtime migration.
- [ ] Source map and proposed commands name existing/new actual owners; commands are prospective and no test/benchmark PASS is claimed by this plan.
- [ ] One coherent review/acceptance, no per-function gates or user reapproval between already authorized phases; no CI/live/installation effects outside scope.
