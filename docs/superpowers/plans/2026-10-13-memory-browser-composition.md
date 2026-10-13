# Memory + browser composition implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox tracking. The existing actual Sol6.1 authors code/checks; the same Astra decides contracts and reviews the coherent result. Three delivery blocks have internal steps, not separate reviewer gates.

**Goal:** Compose the accepted ordinary memory task cycle with the peer's existing Claude owner-output/browser gateway in one isolated source candidate.

**Architecture:** Retain Kernel6d and the existing owner, task, report and gateway APIs. Add only the designed Claude memory profile, shared prepared session/deadline and joined cleanup. Browser artifacts stay tool facts until an existing owning observation/checkpoint admits them; memory never becomes a browser runner or a verdict engine.

**Tech Stack:** Existing Node/TypeScript/Python, Zod, tsx and locked Playwright runtime. No new dependency, registry, store, actor runner or installed configuration.

**Spec:** [composition design](../specs/2026-10-13-memory-browser-composition-design.md), including its exact preparation diagnostic and session/deadline appendices. Read it fully before execution. The earlier [ordinary memory plan](2026-10-13-ordinary-qa-memory-cycle.md) supplies retained evidence, not instructions to replay it.

## Global constraints

- This plan is conditional source preparation. Implementation starts only after the coordinator supplies the exact clean, accepted, immutable gateway carrier. This is an external source prerequisite, not another user approval gate.
- F baseline: root `4a3c0b5cd4eca8586e91e3af470e4e77e91a9c63`, Console `4daf3cf93acc44c8f7cbb2a3bc7c3162616bc29c`, Kernel `6d38980ab77621f4c1fe85872985600a3cf13c9f`; source verification passed. Root and Console are already on `codex/memory-browser-composition-20261013` in the existing isolated normal F clone `/Users/danilsolomin/projectsnew/qa-agent-product-memory-foundation-20261013`, at those unchanged baseline HEADs. No new clone is needed.
- Inspected peer root `d2a19b190119b632c87ddebe786cbca1091b5f05` / Console `5c8113d20a279768f4934d8441de2a7681f5e2dd` / Kernel `09300746bd7857e7a5973bd9d81065b746eb72d8` plus dirty gateway changes is **not** a delivery source. Final accepted carrier is peer root `ffbe06aacfdcfac4d93f9b5ce0780594eb0affc4` / Console `65d5698066ad216d12735cfc1480d89a33515def` tree `2066b254882cb48b8a89619dd1a5921ec63b1ebf` / unchanged Kernel093. Root independently verified clean status and source verification. Bundle `sources/candidates/console-brokered-browser-gateway-65d5698.bundle` SHA256 `50686ff8811c9c9faae8197e92c6eb8092608f997bc15fb63bbde2b95d83c699` is the exact source carrier; never substitute the formerly inspected dirty body.
- Console branches share `afed2bc74e4da5fce8b32c9b244b851fbb6ccd87`. Kernel merge-base(6d,093)=093; keep6d as the target. Ancestry is not proof that the gateway's native/report execution works on6d.
- Do not import peer root `.github/workflows/qa-runtime.yml`, `tools/ci-impact.mjs`, `tests/ci-impact.test.mjs` or `tests/qa-runtime-workflow.test.mjs`. No CI execution, workflow/job/classifier changes or root whole-suite replay belongs to this slice.
- Existing product owners, requests, graph/publications and frozen runtimes remain frozen. No peer owner/store copy, migration, registration, implicit slug join, live ToolShop/provider/browser diagnostic, fresh acceptance actor, installation, benchmark,1001/10k experiment or push.
- Gateway remains `claude-qa-owner-output` only. Claude read-only rejects memoryAccess/imageCapability; Codex gateway remains unsupported. Codex memory and all no-memory contracts remain accepted behavior.
- Preserve capability.v1, browser action/result grammar, memory task input/results, v1/v2 memory and v4/v5/v8/v9 report compatibility. No new actor root/path/token/deadline field.
- Existing host prompt cap16KiB, bridge input64KiB and activity read1MiB remain. Existing task stdin64KiB/result1MiB, learn1–3 per call, intent128KiB/item512KiB/operation and16 exclusive outcome slots remain unchanged.
- Preserve Claude binary hash/version2.1.295, exact tools/settings/MCP/init contract, sandbox/domain scope and selected run caps. Existing stage limits are upper bounds: workspace validate15s, version probe15s, browser startup30s, native selected timeout≤9,000,000ms, plus only existing bounded cleanup overhead. Memory-enabled preparation spends the original whole deadline.
- Preserve FIRST, actual source identity, terminal close/custody and unsupported scope. No blanket retry, force unlock, verdict manufacture, metadata-to-inspection promotion or automatic semantic learning.

## Review focus

1. A caller changes host/session or carries an ambient capability: admission must derive the host from the verified profile and scrub unselected memory/gateway variables before any actor action.
2. Association succeeds but later launch fails: the bounded existing diagnostic must distinguish verified-created from no-effect/unknown; no rollback or fresh-key escape.
3. Slow setup consumes the deadline: grant and gateway publication must clamp after awaited setup, not restart the duration or leave an orphan in-process write.
4. A cleanup path rejects: memory revocation, browser/server cleanup and process drain must all run; primary failure and cleanup uncertainty remain visible.
5. A report or screenshot belongs to another request/authority: exact v5 owner admission is required, and exploratory pixels cannot be cast into native_artifact evidence.

## Block 1: Reconcile the exact accepted source closure

**Files adopted from the final accepted carrier:**

| Category | Exact Console paths | Treatment |
|---|---|---|
| Gateway implementation | `server/qa-browser-gateway.mjs`; `server/browser-gateway/{artifacts,contract,native,report-view,session,traffic}.mjs`; `server/browser-gateway/native.d.mts` | Import only accepted final bytes, then apply the narrowly designed composition deltas below. |
| Fixed existing commands | `scripts/qa-browser-client.mjs`; `scripts/qa-browser-native-read.mts`; `scripts/qa-agent-host-activity.mjs` | Preserve fixed client/native CLI and truthful operator cleanup reporting. |
| Claude activity closure | `src/lib/agent-activity.mjs`, `.d.mts`; `src/node/agent-activity.mjs`, `agent-activity-process.mjs`, `agent-host-activity.mjs`, `agent-host-activity.d.mts`; `src/primary-ui/owner/agent-activity.ts`; `src/primary-ui/views/AgentActivityCard.tsx` | Semantic merge, not wholesale replacement: keep F prepared-session branding, memory metadata handling and current report/UI behavior while adding accepted v3. |
| Python source attribution/bridge | `tools/agent-adapters/qa_agent_adapters/host_bridge.py`, `process_engine.py`; `tools/agent-adapters/PROVENANCE.md` | Retain F's three completed Codex tool classifications and peer's strict Claude initialization/image/deadline behavior. |
| Owning carrier controls | `tests/fixtures/qa-browser-gateway.mjs`; `tests/unit/qa-browser-gateway.test.mjs`; `tests/integration/qa-browser-gateway.test.mjs`; `tests/integration/agent-adapter-fixture.test.ts`; `tests/unit/agent-activity.test.ts`, `agent-activity-store.test.ts`, `qa-product-skill.test.ts`; `tsconfig.fixture-repair.json` | Retain accepted assertions, adapt candidate pin paths only where necessary, and select affected named bodies. No wholesale rerun. |
| Source guidance | `skills/qa-product-v0/SKILL.md`, `references/browser-gateway.md`; identical `.claude/skills/qa-product-v0` paths | Merge memory start/decision/end guidance with gateway discovery. Preserve the existing `references/agent-memory.md` and mirror byte parity. |

**F-owned paths preserved/adapted:** `src/node/agent-memory-host-grant.mjs`, `agent-memory-runtime.ts`, `agent-memory-task.ts`, `agent-memory-evidence-reader.ts`, existing memory supervisor/worker; `scripts/qa-memory.ts`; current v5 monitor/HTTP/request/report/export paths and `src/primary-ui/owner/AssessmentReasoning.tsx`. No Kernel or memory schema/graph change is planned. Do not replace F's monitor/report/UI closure with peer's older afed bytes.

**Interfaces:** Consume the final immutable carrier and its actual review/control disposition. Produce one clean candidate source pair with6d authority, preserved F memory and accepted Claude/gateway closure; there is no new public interface in this block.

- [ ] Receive from coordinator: exact root/Console/Kernel commit and tree identities, clean status, immutable carrier location/digest, sole author/same-reviewer acceptance, repaired paths, retained FIRST and completed/unentered controls. Check that the five formerly unfinished peer repairs are resolved or explicitly excluded by its reviewer; do not count silence as acceptance. Preserve the final accepted carrier's configuration/source-pin binding, v3 deadline/terminal and primary-failure/cleanup-order repairs, including any additional required files or affected controls. This table describes the inspected closure; it does not freeze old5c bytes or authorize overwriting final repairs with earlier peer/F variants.
- [ ] Read final carrier source as Git objects. Compare its common ancestor and changed file list against the table; if final repairs add required files, record the exact dependency reason rather than importing unrelated root policy/runtime. Keep peer checkout/owners untouched.
- [ ] Use the already selected normal F composition checkout at the fixed absolute root and unchanged baseline pins. Confirm its branch/source state and read-only source verification before edits; do not restore over present dirty or foreign children. Use its existing locked dependencies/runtime; do not point imports at the peer working tree.
- [ ] Reconcile coupled activity files as one body. Preserve F `getPreparedActivitySession` branding and prepared writer validation, but let actual v3 starts/read envelopes/UI render accepted Claude facts. The activity reader must recognize only the existing exact grant metadata members, without treating them as activity or silently ignoring arbitrary files.
- [ ] Preserve the strict Codex classifier delta for completed `command_execution`, `file_change`, `web_search`; do not double-count started/updated items or infer conformance from exit/thread start. Retain Claude explicit cost/turn provenance and all eight init checks.
- [ ] Confirm the final source diff contains the exact closure and no source pin downgrade, old-owner write, root workflow change, dependency update or source-instruction overwrite. Root owns manifests/bundles, not this block's code author.

## Block 2: Joint trusted entry, preparation, deadline and cleanup

**Modify:** `src/node/agent-host-activity.mjs`, `.d.mts`; `agent-memory-host-grant.mjs`; `agent-memory-runtime.ts`; `agent-activity-process.mjs`; `agent-activity.mjs`; Python `host_bridge.py`; gateway `server/qa-browser-gateway.mjs`, `server/browser-gateway/native.mjs`, `report-view.mjs`. Change `scripts/qa-agent-host-activity.mjs` only to retain the existing bounded diagnostic/cleanup serialization. Task and owning report APIs stay unchanged.

**Interfaces from the spec:**

```ts
// HostActivityInput: additions only on the existing Claude owner-output member.
memoryAccess?: 'current_owner' | {
  memoryHomeWorkspacePath: string;
  evidenceWorkspacePaths: string[];
};
imageCapability?: 'available' | 'unavailable';

type HostMemoryPreparationDiagnostic = {
  state: 'not_attempted' | 'verified_existing' | 'verified_created' | 'outcome_unknown';
  preparationRequestId: string | null;
  associationDigest: `sha256:${string}` | null;
};
type HostAdmissionDeadline = {
  monotonicDeadlineMs: number;
  expiresAt: string;
};
// Internal optional fields, never actor input/env/action/capability wire fields:
// prepareHostMemoryAccess options: onPreparation?: (value: HostMemoryPreparationDiagnostic) => void
// buildMemoryHostGrant options: admissionDeadline?: HostAdmissionDeadline
// startBrowserGateway binding: admissionDeadline?: HostAdmissionDeadline; activitySessionRef?: string
```

`prepareHostMemoryAccess` still returns the existing selected roots. `hostPreflightDiagnostic(error)` still returns `qa-host-preflight-diagnostic.v1` with unchanged stage/reason enums and optional strict `memoryPreparation`. `startHostActivity` still returns sessionRef/done/cancel/getDiagnostic and the peer's optional getGatewayCleanup; no new getter/store. The gateway client/action/result protocol is unchanged.

- [ ] Author causal finite negatives before implementation: wrong launch-host/grant profile/session, Claude readonly memory, extra deadline/action fields, and capability filename mismatch. Use the existing pure Python/JS source fixture methods; a dirty-source refusal is not the desired RED.
- [ ] Extend the grant enum by exactly `claude-qa-owner-output` and enforce the closed mapping at construction/read/runtime/process/bridge:

```js
const expected = {
  'codex-read-only': {host:'codex', mode:'read'},
  'codex-qa-owner-output': {host:'codex', mode:'write'},
  'claude-qa-owner-output': {host:'claude', mode:'write'},
}[grant.profileId];
if (!expected || grant.mode !== expected.mode || environment.QA_MONITOR_HOST !== expected.host) throw fail();
```

Use the owning helper's existing finite refusal, not a new authority grant. JS/Python additionally match the selected launch profile/CLI and exact sessionRef. Scrub inherited memory and gateway fields before applying selected explicit capabilities; missing fields never activate a lane.

- [ ] For memory-enabled entry, normalize shorthand before root properties. Retain registered `captured.owner.workspacePath` for owners/grants/native commands while Claude's execution cwd stays private notes. Derive sandbox write roots from that exact owner, verified home and external notes/monitor; evidence roots stay readonly/disjoint. Protect Console/Kernel/activity/config/bridge/P01 helper roots. Finish actual source/workspace/binary/version/config/final16KiB prompt preflight before association. For memory-enabled instructions, resolve the already installed absolute tsx loader using trusted Console `createRequire(import.meta.url).resolve('tsx')` (file URL preferred for --import), and validate/use actual `process.execPath` and the absolute selected script path; POSIX-single-quote every argv element rather than JSON.stringify; never rely on bare package resolution from external notes or create/install node_modules. The no-memory prompt remains unchanged.
- [ ] Add the trusted observer without changing the public association algorithm/key or returned roots. The pinned Kernel6d public `associateAgentMemoryOwner` returns `AgentMemoryAssociateResultV1Schema.associationDigest` and `effect` (`components/kernel/src/kernel/agent-memory-product.ts:161–165`); public `recallAgentMemory` returns `AgentMemoryContextV2Schema.associationDigest` (`components/kernel/src/contracts/agent-memory-v2.ts:161`). Existing ordinary task reconciliation already exercised the latter getter. Make the helper's private verification return that actual parsed recall context for observer bookkeeping; its public roots return stays unchanged. No private binding-file fallback is needed.

```js
// Before invoking the public association, retain uncertainty in host bookkeeping.
onPreparation?.({state:'outcome_unknown', preparationRequestId:stablePreparationKey, associationDigest:null});
// After the existing actual receipt and owning follow-up recall succeed:
onPreparation?.({state:association.effect === 'private_write' ? 'verified_created' : 'verified_existing',
  preparationRequestId:stablePreparationKey, associationDigest:verifiedRecall.context.associationDigest});
```

Existing successful recall without association reports verified_existing. The host callback is nonthrowing and cannot override identity or authority. Preserve this bounded diagnostic through annotate/final source/grant/startup refusal; malformed attached metadata becomes outcome_unknown/null identifiers. No-memory diagnostic bytes remain exact. A created association surviving later failure is a historical effect, never effect:none or rollback.

- [ ] Allocate one sessionRef; use it for the v3 expected start, protected prepared activity session, memory grant, bridge payload and pump. Publish the grant before spawn/first task action. For joint gateway only pass internal activitySessionRef and publish exclusively `browser-capability-${sessionRef}.json`; bridge validates exact parent and filename UUID=payload.sessionRef. Gateway-only keeps its legacy random filename.
- [ ] Construct the internal deadline once from invocation start, applying it only to memory-enabled composition. Recompute a positive integer remaining duration before stages, bound workspace/version/browser subprocesses by min(existing cap, remaining), and clamp grant/capability expiry after their awaited setup immediately before publication. Refuse expired work and await noncancelable owning settlement; no orphan raced promise or restarted duration.

```js
const startedAt = performance.now();
const admissionDeadline = {monotonicDeadlineMs:startedAt + deadlineMs,
  expiresAt:new Date(Date.now() + deadlineMs).toISOString()};
const remaining = Math.floor(admissionDeadline.monotonicDeadlineMs - performance.now());
// Pass only from this trusted host to the grant/gateway helpers; each rechecks
// after its own awaits. No-memory callers omit the internal object.
```

- [ ] Compose terminal/prelaunch-failure/cancel cleanup over the existing child drain, memory revocation and gateway.close. Await every owning path even if another rejects; preserve primary failure plus cleanup_unconfirmed, and keep gateway cleanup separate from actor terminal facts. Existing task post-write revocation must retain unknown item/attempt/note identity and original recovery intent; do not return saved after closing refusal.
- [ ] Strip `QA_MEMORY_HOST_SESSION`, `QA_MEMORY_HOST_GRANT_DIGEST`, `QA_MEMORY_IMAGE_CAPABILITY`, `QA_MEMORY_SESSION_OUTPUT_ROOT`, `QA_BROWSER_GATEWAY_FILE` from fixed native CLI/readback children even when inherited through process.env. They receive only the existing pinned owner/request/monitor/native authority. No arbitrary argv, executor or receipt writer.
- [ ] Add only `checkpoint_v5` to the report.reference owner-type set and use F's existing verified selection/run/checkpoint/ticket routes. Preserve v4 and native references, bound-only metadata projection, pending admission, explicit unsupported outcomes and all mutation/foreign-route refusals.
- [ ] Merge source guide/mirror instructions: existing task recall/read/evidence/learn/recover/reasoning plus fixed browser client, agent-authored semantic decisions, explicit unread qualification and no-useful-learning skip. Gateway JSON/PNG/P01 paths are not native_artifact evidence; only actual native receipt+checkpoint membership admits that selector. Image capability declaration is not pixel inspection. Preserve source_snapshot unavailable without an admitted registration binding.
- [ ] Run the affected standard compilers and exact guide parity; restore only generated compiler artifacts before a clean coherent Console checkpoint. Do not weaken pins or let the protected owning tests run against dirty source.

## Block 3: One finite affected control set and same review

**Create:** `components/console/tests/integration/agent-memory-browser-composition.test.ts` only for the new joint owning seam. Keep local fixture construction in that test unless a genuinely repeated existing fixture requires one small test helper; no production fixture hook/brand or second runner.

**Reuse actual fixture APIs:** Kernel `foundationFixture`, `foundationDraft`, `foundationQuery`; `observationRecord` and public `recordAgentToolObservation`/`readAgentToolObservation`; Console `captureRequest`, `requestBinding`, `announceMission`, `recordAgentRequestCheckpoint`, `captureAgentRequestReport`, `exportAgentRequestOutcomes`, `readAgentRequestOutcomes`; accepted `browserFixture`, `builtConsoleFixture`; existing `registerAuthoredFixture`, `publishNuanuAuthoredRevision`, `authoredCampaignPlan` only inside the already delivered disposable native-control fixture. No frozen owner or invalid managed bytes.

**Planned new named bodies and unchanged bounds:**

| Body | Max | Exact observable obligation |
|---|---:|---|
| `joint Claude first task and browser action use one prepared session and exact owner` |120000ms | Actual inert Claude host, strict synthetic v3/init, first task recall before provider rows, fixed client call, same request/session, no premature conformance claim; current_owner/existing-home roots and honest terminal/closed grant/gateway/group absence. |
| `Claude grant reads selected v4 and v5 basis and retains grounded original learning intent` |240000ms | Public owning v4 artifact+v5 primary membership/bytes under Claude grant, one explicit unattested grounded save plus exact replay, original context/key preserved; gateway screenshot/native selector cast rejected; closed-after-write unknown retained. |
| `joint v5 saved reasoning follows verified gateway report admission without foreign routes` |180000ms | Actual normal v5 checkpoint/typed reasoning/actual recall snapshot, v4 preserved, built Console bound report.reference→pending/current admission→Report/SSR/export reopen; request/revision/mutation route denied, unsupported/native denominator unchanged. |
| `joint startup partial effects and cleanup preserve deadline uncertainty` |120000ms | Prompt overflow before association0writes; genuine created association then failed startup has verified_created; failure after invocation has outcome_unknown; mismatched cap UUID/request no actor effect; cancel/deadline/cleanup failure drains each owned path, with no automatic retry or private-file rollback. |

The120/180/240s body caps come from accepted memory entry/report/grounded controls; native's existing owning body below already uses240s. Do not combine all these obligations into one timeout-prone aggregate or raise a failing bound. Use small distinct negative subcases in the owning lifecycle body, not a Cartesian matrix or per-function review. The120s first-action body contains only admission/one recall/one fixed synthetic gateway call/terminal cleanup. Grounded write/replay, v4/v5/report and slow-startup faults stay in their separate bodies. Preserve0-write and pending-close assertions; split a control only after actual causal budget evidence makes its existing bound impossible, never by increasing a timeout or treating unentered assertions as passed. Scope/timing must be retained per operation so an incomplete control leaves its particular assertions unproved.

- [ ] New fixtures prepare authentic selected request/checkpoints through public APIs and one protected grant. A fake executable answers the existing version probe and emits the exact accepted init fields; all task/browser calls use the real fixed scripts. Label it inert source evidence, never provider/model/sandbox/image acceptance. Trap/delegate actual writes and spawns where0effect is asserted; do not replace authority with forged callbacks or mark init matched on mere exit.

```ts
// Insert assertions in the real controlled-child owning body after its actual
// CLI result has been read, using the existing emitted/result shapes.
assert.equal(taskResult.request.digest, captured.digest);
assert.equal(taskResult.access.sessionRef, pump.sessionRef);
assert.equal(rows[0].schemaVersion, 'qa-agent-activity.v3');
assert.equal(rows[0].sessionRef, pump.sessionRef);
assert.equal(browserResult.request.requestDigest, captured.digest);
assert.equal(await readFile(requestPath, 'utf8'), originalCapturedBytes);
assert.deepEqual(pump.getGatewayCleanup(), {state:'confirmed'});
```

- [ ] Use actual public v4 observation bytes and v5 checkpoint selection, not copied history or fabricated artifact receipts. The v4/v5 control uses distinct public request identities, or an explicitly admitted historical v4 reference under a new v5 request. Never write v5 over the same v4 key or convert a frozen request format in place. Semantic draft fields remain explicit unknown/inference; returned rank/receipt never becomes normative basis or PASS. Read back the entire original canonical note and owning report. Do not infer an overall outcome from the method returning.
- [ ] Pin the shared deadline negative with genuinely delayed controlled setup and actual owned close, not a fabricated date or a timeout multiplier. Validate optional nested preparation diagnostics against their strict finite type; compare no-memory diagnostics/launch argv/prompt/settings/MCP/env literal bytes using the accepted named controls below. Preserve memory read-only compatibility without adding Claude read-only memory support.
- [ ] For joint cleanup tests, retain error, finite diagnostic, known note/attempt identity and pending scope. Wait actual child/process-group/HTTP/browser close before removing only owned successful fixture directories. On timeout/failure retain the new private owner and its exact original artifacts, drain pending operations and confirm terminal; never whole-host cleanup.
- [ ] After a clean candidate is frozen, run serially only the new four bodies and the affected named inherited controls. Existing accepted controls selected for interface collisions: adapter `gateway capability environment remains optional and closed to Claude owner output`, `Claude launch keeps explicit caps, fixed isolation flags and derived hostname-only sandbox scope`, `private diagnostic consumer strictly admits closed init fields and preserves v1 exact bytes`; memory `ordinary task addition preserves literal no-memory Codex argv and prompt bytes`; gateway `native argv is fixed and never accepts traversal or unapproved effects`, `same-reference continuation preserves pending admission and follows one exact link`, `owned close aborts one dispatched operation and refuses new work`. Pure Python invocations retain their existing35s process cap; do not run the entire adapter file. Add one10s-capped help-only command control to the joint first-action test: invoke the literal emitted instruction command from a new empty external cwd, using only the help suffix in place of the task payload. Read the actual instruction rather than substituting manually assembled absolute loader argv. Verify quoted paths with spaces/apostrophes/literal dollar/backtick characters, exact stdout help schema, exit0/stderr0, no new node_modules or owner files. The real joint first task then uses that same emitted prefix with task --input - under its genuine grant.
- [ ] Run exactly the existing `gateway native invokes real registered CLI and reads exact PASS and non-PASS receipts` on the composed6d candidate with its existing240s body bound. Adapt only its explicit093 candidate literals to6d and fixed MEMORY_ACTIVITY_ROOT where the joint host requires it. The existing disposable helper/publication provides native checks; do not author a new product graph. Retain actual native CLI exit, sealed receipt/readback/PNG and explicit non-PASS, plus capability-env scrub assertions. Neither exploratory capture nor source ancestry substitutes for this control.

**Execution commands after clean carrier/implementation/freeze, from the candidate Console:**

```sh
QA_STARTER_REPO=/Users/danilsolomin/projectsnew/qa-agent-product-memory-foundation-20261013/components/kernel QA_STARTER_EXPECTED_SHA=6d38980ab77621f4c1fe85872985600a3cf13c9f QA_AGENT_FIXTURE_PYTHON=/opt/homebrew/bin/python3 node --import tsx --test --test-concurrency=1 tests/integration/agent-memory-browser-composition.test.ts
node --import tsx --test --test-name-pattern='gateway capability environment|Claude launch keeps explicit caps|private diagnostic consumer' tests/integration/agent-adapter-fixture.test.ts
node --import tsx --test --test-name-pattern='ordinary task addition preserves literal no-memory' tests/unit/agent-memory-task-entry.test.ts
node --test --test-name-pattern='native argv is fixed|same-reference continuation|owned close aborts' tests/unit/qa-browser-gateway.test.mjs
QA_STARTER_REPO=/Users/danilsolomin/projectsnew/qa-agent-product-memory-foundation-20261013/components/kernel QA_STARTER_EXPECTED_SHA=6d38980ab77621f4c1fe85872985600a3cf13c9f QA_AGENT_FIXTURE_PYTHON=/opt/homebrew/bin/python3 node --import tsx --test --test-name-pattern='gateway native invokes real registered CLI' tests/integration/qa-browser-gateway.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/typescript/bin/tsc -p tsconfig.fixture-repair.json --noEmit --incremental false
npm run build:primary-ui
git diff --check
```

The absolute commands use the coordinator-selected existing normal F root, never cwd/peer/oldowner fallback. Run them only from its `components/console` after the clean accepted carrier and coherent composed pin are recorded in the private control checkpoint. Source/helper/importer env must be set in every owning process, not rely on an earlier shell; use the already selected executable interpreter after X_OK verification, no installation. Capture FIRST stdout/stderr/pins/actual terminal and private custody. Heavy owning controls are serial in a coordinated source-quiet window. The actual accepted carrier may narrow the inherited selected bodies if its source repairs leave them unchanged; record that scope rather than claiming unrun bodies passed.

- [ ] Self-review the exact diff/spec, inspect every observed failure, and repair only the affected body with the same Astra. Do not replay the ten memory foundation/cycle controls, whole root packaging, P14/scale/provider or the peer's original full gateway matrix. Source changed by a repair needs only its meaningful affected verification and a clean checkpoint.
- [ ] Same Astra reviews one coherent candidate plus retained FIRST and actual partial scope. Sol commits only owned Console code/tests/guides; root publishes exact source manifests/bundles/current/navigation and performs necessary read-only source verification. Keep delivery, installed runtime and product acceptance distinct.

## Current handoff disposition

The clean accepted carrier above is independently verified and implementation is authorized by root and the refined same-Astra design. Peer engineering acceptance retains unit15/browser11/I5-only1 and its earlier FIRST/unknown/unentered scope; residual report OWNER_UNAVAILABLE remains causally unknown, and external WS/SW/live-provider scope is not blanket qualified. This plan does not itself claim source adoption, runtime execution or joint acceptance. This source prerequisite does not stop the peer's own repair/live programme, change its authority or ask the user to approve the same work again.

## Retained command-loader FIRST

A tiny help-only source proof on Node22.23.1 confirmed the old literal `node --import tsx /ABS/Console/scripts/qa-memory.ts --help` fails from a new empty external cwd with exit1/stdout0 and ERR_MODULE_NOT_FOUND for tsx. The same installed Console script with its already installed absolute `require.resolve('tsx')` loader returned exit0/help JSON/stderr0. Each process was capped10s, selected owner/grant env was absent, and the temporary cwd was removed. Proof remains private `.local/memory-foundation/gateway-composition/command-loader-7f9105d2-ad7b-43cb-bfe4-26f1044c9f72/`. This is command ergonomics evidence, not provider, product or joint runtime acceptance. Production is unchanged; the planned preflight/instruction repair belongs to memory-enabled composition.

## Completed local engineering disposition — 13 October 2026

Implementation and affected finite controls are complete on manifest-selected Console48b50c90 / unchanged Kernel6d38980. Same independent Astra gave bounded engineering GO with no open source finding. Four joint controls passed across their retained exact tested pins; existing registered synthetic native passed110.61s under240s. Original fixture refusals and genuine current-request tab mismatch retain their logs; only affected controls were repeated. The repaired tab mapping has its own focused pure and actual report proof. Complete source packaging verifies all four selected components and selected-pair controls2/2. See [current qualification](../../qualification/current.md) for results, provenance and limits.

This closes the authorized mechanism slice only. No live provider/product run, experiment, graph expansion, CI, installed/shared adoption or public delivery occurred. The transport proof is inert: escaped memory-shaped JSON can exceed the existing frame ceiling, and its conservative unknown label is not observed canonical write recovery. Existing campaign owners retain frozen runtimes; the peer chat receives an exact local handoff without automatic adoption.
