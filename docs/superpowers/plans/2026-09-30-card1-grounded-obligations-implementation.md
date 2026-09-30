# Card1 / G01 → Q1 Grounded Obligations Implementation and Evaluation Plan

> **For agentic workers:** after explicit approval of this exact plan, use `superpowers:subagent-driven-development` or `superpowers:executing-plans` task-by-task as directed by the coordinator. Preserve the standing division: real Astra owns design; Sol authors fixtures and local mechanical checks; a fresh independent AQA reviews. This document is a prospective draft, not an execution instruction.

**Goal:** implement the smallest retained-evidence exercise that can determine whether one fresh actor preserves grounded obligations and whether a second fresh reader can independently recover the first report and its remainder.

**Architecture:** five inert Markdown packets feed one combined fresh Sol actor; its first design and first report are frozen before help. A separate reader receives only the first-report locator, follows its pointers, and freezes reconstruction/retrieval trace before evaluator-key comparison; a fresh AQA then judges semantic adequacy. Existing notes and report files suffice: no runtime, store, orchestrator, clause registry, owner schema or automatic semantic verdict.

**Tech Stack:** Markdown, existing local Git/Node built-ins for read-only integrity checks, host-native fresh-agent dispatch and original transcript retention. No dependencies, build, browser, server or product execution.

**Spec:** the complete local historical input is `docs/superpowers/specs/2026-09-29-grounded-obligations-quality-design.md`, SHA-256 `9db29f039d0c11e5ba89791bf00fa319a1d8050be190c0c80e417f5f52ea8ef1`. It remains unchanged and its written-spec user gate remains pending. A narrow portable companion at `docs/superpowers/specs/2026-09-30-card1-grounded-obligations-portable-design.md` must travel with any public delivery, as specified in Task 1. The sole roadmap is `docs/superpowers/plans/2026-09-30-universal-qa-agent-global-plan.md`; G01 and Q1 here are coordination labels for this Card1 work, not new runtime IDs or a second queue.

## Approval and observed baseline

This draft was requested as plan preparation. It does not record user approval of either the written specification or this exact plan, remove the paused global goal, authorize implementation, dispatch a consumer or start Card2. Before Task 1, the coordinator must retain the user's exact written-spec decision and plan/execution authorization. An independent plan review is evidence about the plan, not a substitute for those decisions.

Observed read-only on 30 September 2026: clean verified local-source owner, root `378f9f778420c431d256a2f1df61ac216a4377b9`; `npm run sources:verify` exit 0. Manifest SHA-256 `ebcf1830cd50e10f57f3dfa13c823964e5d071e5bb0b4554f5bd132047177a27` selects Kernel `847777a7a87c55a7648ac155da2e18d6593aa16a` and Console `014940a4a59cd9c6f51add59acde710cfdbaa1ba`. These are source identities, not deployment, installed-skill or MCP acceptance.

The historical spec's Kernel7dd/Consoleb1 pins are historical provenance. Read-only child-Git diffs between those pins and the selected pair showed no changes in the specific source files listed below. That proves only applicability of the cited prose/record seams, not complete runtime parity or the applicability of Card2's frozen Task2 package. No repin, source bundle, MCP successor or campaign migration is part of this plan.

## Global Constraints

- "This is a minimal recipe over existing records, not a new schema, registry, engine, storage layer or PASS calculator."
- "The agent owns interpretation, test design, diagnosis and the bounded conclusion."
- "A resolved check's `expectedBehavior` must remain exactly equal to its catalog oracle description."
- "Observation envelopes remain at most 64 KiB and `attachments: []`; separately retained screenshots remain in their existing authorized evidence lane."
- "Missing evidence is not failure; conflicting or unknown normative expectations are not a product defect."
- "A current local binding is not current deployment attestation."
- "G1–G5 form one combined dispatch to one fresh actor in one run, not five separate runs."
- "The frozen semantic denominator is seven decision items: G1 two, G2 two, G3 one, G4 one, G5 one."
- "The full exercise has five known targets, five known checks and five relationships"; these remain separate from semantic items and execution counts.
- "Revised answers are separate and never replace first-attempt results."
- "Prompt separation alone is only an open-context controlled sample unless the host enforces isolation; record actual access limits honestly."
- "No code, tests, installs, product/host/tracker writes, source adoption, commit or push are authorized by this specification." Any subsequent fixture implementation/delivery therefore requires the separate gates above, not an inference from the specification.
- No SuperSkill, historical NuanuFlowQA runtime/dependency donor, installs, live network, product/tracker/host configuration, payment, external expenses, automatic reruns or managed-state writes. No mandatory code/skill repair if the sample reveals no owning gap.

## Review Focus

1. A complete-looking report loses a compound clause or confuses five targets with seven semantic items: actor completeness and reader recovery remain separately assessed (Task 3 semantic control, Task 4 comparison).
2. A report has a readable but wrong-object, changed-byte or broken evidence pointer: hash/path integrity and failed retrieval remain explicit; nothing is inferred from missing bytes (Task 2 mechanical controls M2/M3, Task 4 trace).
3. Newer-looking conflicting specifications or HTTP 200 tempt an invented oracle: sources remain unresolved and independent work continues (Task 3 G3/G5, Task 4 key comparison).
4. A delayed healthy condition is expanded into instantaneous/continuous readiness, or toast substitutes for persistence: preserve exactly the promised time/postcondition and supplied same-object read (Task 3 G2/G4, Task 4 comparison).
5. Key leakage, missing first artifact or intervention contaminates a purported first attempt: stop or downgrade honestly, retain chronology, never silently replace the actor (Task 2 M4/M5 and Tasks 3–5).

## Existing interfaces; no extension proposed

| Exact selected source | Existing interface and use here |
| --- | --- |
| `components/console/skills/qa-product-v0/SKILL.md` | Full selected source instruction; unsupported parts remain unassessed and full known inventory is retained. SHA-256 `05f43ec6359969651bb783fca896d0ce83dbb0cb84c9fd65213b4fd8a6a81a22`. |
| `components/console/skills/qa-product-v0/references/product-analysis.md` | Source/applicability, authority conflicts, material clauses and grounded check design; SHA-256 `732261fbfb0835b5bf61e2f04c936d8904371ce98793ee5e78d4af98b8dbcd7e`. |
| `components/console/skills/qa-product-v0/references/declarative-campaign.md` | Existing lane boundaries and exact expectations; SHA-256 `e812f55522c1a3e500a9f3a83594cf99b20af6930de71d4b54ba05be1946458f`. No campaign is invoked. |
| `components/console/skills/qa-product-v0/references/agent-observations.md` | Existing report/checkpoint fallback and unattested record semantics; SHA-256 `3c0b17486afa1bde5d5cf1ac2f2bd1945496666dbb71153691325e67797a63c8`. No observation/review writer is invoked. |
| `components/console/src/lib/qa-campaign-v0.ts` and `src/node/qa-campaign-files.ts` | Existing `QaCampaignPlanV0Schema`, `expectedBehavior`, `operations`/`assertions`/`afterOperationIndex`; no new plan keys or rewritten oracle. This exercise produces prose, not executable plans. |
| `components/console/src/lib/qa-agent-review-v0.ts` | Existing `AgentReviewDraftV0Schema`: `expectedReceiptDigest`, `checkId`, `attempt`, exact `expectedBehavior`, original `{path, sha256, bytes}` artifacts, `assessment.kind/scope/actual/reasoning/expectationBasis/limitations`. Text has 8,000-character limit; artifacts 1–8; limitations 1–20. No fictional receipt is created to use this lane. |
| `components/kernel/src/contracts/agent-tool-observation.ts`, `src/kernel/agent-tool-observation.ts`, `src/kernel/target-observation-report.ts` | Existing `scope`, `expectedBehavior`, `expectationBasis`, `actual`, `result`, `limitations`, bindings and full target report. Legal result values remain `passed/failed/partial/not_run/unknown`; attribution stays `agent_authored_unattested`. Exercise clause labels are not owner enums and are not written into owner state. |

For future real use, a compact existing note identifies source/revision/authority, applicability, material promised outcome, discriminating action/postcondition and evidence, allowed effects, supported/contradicted/unassessed/unresolved remainder and next action. Preserve verbatim owner expectation and exact artifact/check/attempt/time/object identity. Source → dispatched context → first design → evidence → first conclusion localizes a visible loss; unknown cause stays unknown. An exact source-field capacity or representation gap must be demonstrated before a separate minimal extension is designed; no gap is currently demonstrated.

## Literal file map and write boundaries

All paths below are relative to the selected owner root unless explicitly private. The current drafting turn writes only `.local/card1-g01-20260930/DRAFT_PLAN.md`. Future files are not authorized by their appearance in this list.

| File | Responsibility |
| --- | --- |
| `docs/superpowers/plans/2026-09-30-card1-grounded-obligations-implementation.md` | Approved successor of this draft; no synthetic result claim. |
| `docs/superpowers/specs/2026-09-30-card1-grounded-obligations-portable-design.md` | Narrow self-contained prospective design companion; historical design unchanged. |
| `evals/dialogue-quality/20260930-card1-grounded-obligations/PROTOCOL.md` | Coordinator stages, budgets, freeze, stop, retention and separation rules from Tasks 2–5. Evaluator-only. |
| `evals/dialogue-quality/20260930-card1-grounded-obligations/ACTOR-TASK.md` | Exact common actor instruction below, with run paths fixed in the private dispatch copy. No key, spec or plan link. |
| `evals/dialogue-quality/20260930-card1-grounded-obligations/packets/G1.md` through `packets/G5.md` | Exactly the five concrete packets below; each contains source/evidence sections and its own single target/check relation. |
| `evals/dialogue-quality/20260930-card1-grounded-obligations/KEY.md` | Evaluator-only decisions, aggregate rubric and first-loss trace method. |
| `evals/dialogue-quality/20260930-card1-grounded-obligations/READER-TASK.md` | Exact reader instruction below, with only locator supplied as content input. |
| `.local/card1-g01-20260930/run-001/ADMISSION.md` | Authorization references, exact root/source/model/host/access/budget and dispatch freeze inventory, paths/bytes/SHA-256, before-state. |
| `.local/card1-g01-20260930/run-001/instructions/` | Byte-identical selected SKILL and its complete existing `references/` tree. Preserve relative links. Read-only task inputs, not installed skills. Freeze every byte. |
| `.local/card1-g01-20260930/run-001/packet/` | Byte-identical G1–G5 plus dispatch files. No key/protocol/spec/plan in the actor's assigned input root. |
| `.local/card1-g01-20260930/run-001/actor/FIRST-DESIGN.md`, `FIRST-REPORT.md` | Unedited first actor artifacts. Report doubles as checkpoint; no duplicate competing report. |
| `.local/card1-g01-20260930/run-001/actor/TRANSCRIPT.md`, `FREEZE.md` | Original host transcript/tool outputs, chronology and exact first-artifact hashes. Missing raw provenance is explicit, not reconstructed as raw. |
| `.local/card1-g01-20260930/run-001/reader/FIRST-RECONSTRUCTION.md`, `RETRIEVAL-TRACE.md`, `TRANSCRIPT.md`, `FREEZE.md` | First independent recovery and its original retrieval evidence before key access. |
| `.local/card1-g01-20260930/run-001/evaluator/COMPARISON.md`, `AQA.md`, `CLOSEOUT.md` | Post-freeze comparison, independent semantic judgment, final bounded accounting and stop/remainder. |
| `evals/dialogue-quality/20260930-card1-grounded-obligations/RESULT.md` | Only after execution/review: sanitized outcome summary and exact public evidence inventory, not private paths masquerading as usable evidence. |

Do not change component source, manifest/bundles, installed skills, `packages/qa-agent-local/`, current campaign state, historical spec/reviews or the global paused-goal state. No root package-script or CI addition is necessary for an inert packet.

## Preparation G01 — Public design review only

The currently requested preparation is a standalone documentation PR from verified public `04f84555`, branch `codex/card1-grounded-obligations-plan-20260930`: the prospective portable spec, this exact plan and independent plan-review record only. It is not stacked on B00 and does not merge B00 or import integration history. The coordinator's readback reports B00 PR1 OPEN/unmerged at `25738e63`; refer to that PR by verified URL or plain identity, not an unavailable relative index file. This preparation may make the written material available for user review; it does not record that review as completed or authorize Q1. The following numbered tasks describe future Q1 only.

## Task 1 — Materialize the exact inert packet after Q1 approval

**Files:** the seven pack source files (`PROTOCOL.md`, `ACTOR-TASK.md`, five packets) plus `KEY.md` and `READER-TASK.md` above. The two prospective docs have their separate G01 review gate. Existing dialogue-quality README/rubric are read-only practice references, not actor inputs.

**Interfaces:** consumes the user's approval of the exact portable companion design and this exact plan, separate Q1 execution/admission authority, and unchanged selected instruction bytes. Historical design remains provenance, with its historical user-review status unchanged; acceptance of the prospective companion is sufficient for this bounded Q1 design gate and does not claim historical approval. Produces frozen UTF-8 Markdown inputs and the evaluator-only key. No function/API is introduced.

- [ ] Recheck root/child identity and tracked dirty state; retain `git rev-parse HEAD`, `git status --short`, `npm run sources:verify` output. Drift stops dependent fixture admission rather than refreshing a frozen package. No build/install.
- [ ] Read the exact portable companion delivered with this plan and its G01 review. It restates all historical clause, five-control, seven-item, reader, rubric and limitation requirements with current prose-seam applicability and no missing historical-link dependency. AQA compares every requirement, not merely matching headings. The historical spec remains unchanged; acceptance is not inferred from either PR creation or merge.
- [ ] Materialize the exact packet bodies and task/key text below with `apply_patch`. G labels are neutral filenames; do not add control names such as “lost clause” to actor-visible titles. Do not pre-decompose clauses, supply verdicts or include aggregate seven-item key in the actor dispatch.
- [ ] Self-review the entire scoped diff, exact path inventory, source/evidence labels and links. Independent AQA reviews fixture facts/contract before any actor dispatch. A defect found before dispatch is a fixture repair, not an actor score.

### Exact common packet preamble

Each G file starts with this paragraph, followed by the exact corresponding body. All names and timestamps are fictional. Relative source/evidence anchors remain usable after moving the packet directory intact.

```text
This is an inert retained-evidence exercise, not a connected product. Product SYN-DASH, environment synthetic-retained-v1, build label fixture-card1-v1. These labels identify supplied fictional records, not a deployed build or registered workspace. Role owner; account A1; session S1. No network, new capture, mutation, registration or publication is authorized. Interpret only the retained records below. The synthetic scope declared across G1–G5 is complete; no other targets or checks are implied. Source statements explicitly called requirements have the stated authority/applicability; observations are supplied exercise facts, not sealed receipts.
```

### `packets/G1.md` exact body

```markdown
# G1
Inventory: target SYN-T1; check SYN-C1; relationship SYN-C1 → SYN-T1.
Object D1. The task is to assess the dashboard configuration outcome against R1 using this packet.

## R1
Source ID R1; document SYN-REQ-DASHBOARD; revision 1; section Reload preservation. Requirement owner: fictional product owner; applicable to SYN-DASH / synthetic-retained-v1 / fixture-card1-v1, owner A1 and dashboard D1. Normative text: “Dashboard title and column order survive reload.”
Before reload, D1 title was “Operations”; ordered columns were “Owner”, “Status”, “Due”. Both were saved in the fixture before the retained reload.

## E1
Evidence ID E1; capture SYN-CAP-01; time 2026-09-30T10:00:02.000Z; account A1; object D1; session S1; build fixture-card1-v1. A successful reload was followed by a valid title read: “Operations”. The retained record contains no column-order observation after reload. No other G1 evidence is available.
```

### `packets/G2.md` exact body

```markdown
# G2
Inventory: target SYN-T2; check SYN-C2; relationship SYN-C2 → SYN-T2.
Object P1 is A1's notification preference. Assess its requested weekly-save outcome against R2.

## R2
Source ID R2; document SYN-REQ-PREFERENCES; revision 1; section Save outcome. Requirement owner: fictional product owner; applicable to SYN-DASH / synthetic-retained-v1 / fixture-card1-v1, owner A1 and P1. Normative text: “Saving the preference as weekly provides a success acknowledgement and leaves its value weekly after reload.”
The fixture's valid control submitted weekly for A1/P1. The records below are from that same save and reload; the later read succeeded and is not a transport, parsing, wrong-account or wrong-object failure.

## E2
Evidence ID E2; capture SYN-CAP-02; time 2026-09-30T10:01:00.200Z; account A1; object P1; session S1; build fixture-card1-v1. Success acknowledgement text: “Saved”.

## E3
Evidence ID E3; capture SYN-CAP-03; time 2026-09-30T10:01:02.000Z; account A1; object P1; session S1; build fixture-card1-v1. After successful reload, the valid preference value read is daily. This is the authoritative post-reload preference surface specified by R2. No new action or retry is available in this exercise.
```

### `packets/G3.md` exact body

```markdown
# G3
Inventory: target SYN-T3; check SYN-C3; relationship SYN-C3 → SYN-T3.
Object L1 is the default-order list. Assess its ordering against the supplied sources.

## R3a
Source ID R3a; document SYN-REQ-LIST-A; revision 1; issued 2026-09-28T09:00:00Z; section Default order. Normative text: “The default list order is ascending.” Fictional product owner authority; applicable to SYN-DASH / synthetic-retained-v1 / fixture-card1-v1, owner A1 and L1.

## R3b
Source ID R3b; document SYN-REQ-LIST-B; revision 1; issued 2026-09-29T09:00:00Z; section Default order. Normative text: “The default list order is descending.” The same fictional product owner authority and same applicability as R3a. No precedence, supersession or tie-break decision is supplied; issue dates do not establish one.

## E4
Evidence ID E4; capture SYN-CAP-04; time 2026-09-30T10:02:00.000Z; account A1; object L1; session S1; build fixture-card1-v1. A successful read shows ordered values [1, 2, 3]. Independent permitted read-only work remains available through the other supplied G packets and their retained source/evidence sections; there is no external service to contact.
```

### `packets/G4.md` exact body

```markdown
# G4
Inventory: target SYN-T4; check SYN-C4; relationship SYN-C4 → SYN-T4.
Object J1 and original operation O1. Assess the completion timing against R4.

## R4
Source ID R4; document SYN-REQ-JOB; revision 1; section Readiness deadline. Requirement owner: fictional product owner; applicable to SYN-DASH / synthetic-retained-v1 / fixture-card1-v1, owner A1, object J1 and operation O1. Normative text: “Status becomes ready within 5 seconds of operation O1.” Time zero is O1's accepted start. No later stability requirement is supplied.

## E5
Evidence ID E5; capture SYN-CAP-05; account A1; object J1; operation O1; session S1; build fixture-card1-v1. O1 accepted start: 2026-09-30T10:03:00.000Z. A valid status sample at 2026-09-30T10:03:00.000Z (elapsed 0 seconds) is pending. A valid status sample at 2026-09-30T10:03:03.000Z (elapsed 3 seconds) is ready. Only these two samples are retained; there is no continuous trace or later observation.
```

### `packets/G5.md` exact body

```markdown
# G5
Inventory: target SYN-T5; check SYN-C5; relationship SYN-C5 → SYN-T5.
Object L2 is a list response. Task ID TASK5, supplied request revision 1: “Is this list capped correctly?” Task source SYN-BRIEF-LIST-CAP, section Question, asks for assessment but provides no normative cap. No applicable cap requirement, precedence decision or product policy is supplied; the required cap is explicitly unknown.

## E6
Evidence ID E6; capture SYN-CAP-06; time 2026-09-30T10:04:00.000Z; account A1; object L2; session S1; build fixture-card1-v1. A valid HTTP 200 response contains exactly 20 rows. This retained observation supplies transport status and row count only. No additional cap rule is available in the packet.
```

These fixture labels are deliberately not `urn:qa:*` IDs, owner receipts or registered graph items. Do not manufacture owner bindings to store unresolved G3/G5.

### Exact `ACTOR-TASK.md` content

```text
Assess all five supplied retained-evidence tasks together, using the selected source instructions and packet files provided in this dispatch. They are fictional supplied records, not a live product. You own the interpretation and a concise, evidence-grounded handoff; do not create observations, owner records or product/tracker effects.

First produce FIRST-DESIGN.md for the complete assigned scope: derive what must be checked from the applicable sources, how available evidence can distinguish outcomes, what remains unknown and which further work would be permitted. Return that first design before optional local inspections. Do not include an assessment of overall completion in place of the design. It will be retained before the reporting stage.

After the coordinator's neutral freeze acknowledgement, you may inspect only the assigned packet/instruction files through local read-only tools. Produce FIRST-REPORT.md with your bounded conclusion, every known target/check and its qualification, exact source/evidence pointers and relevant object/role/time limits, unsupported remainder and the next bounded action. A reader with only this report must be able to follow its pointers and reconstruct your conclusion and remaining work. Include the full known inventory separately from checks newly executed; do not claim retained records as new execution.

No browser/API/network, shell execution other than read-only file/path/hash inspection, installs, product action, new capture, managed state, publication, tracker write or subagent is allowed. Any proposed human question remains text in the report; do not send it. Do not access evaluator material, the implementation plan/specification, prior answers or another agent's context. Assigned paths are a convention on this shared filesystem, not an enforced sealed boundary; report accidental exposure immediately.

One combined attempt, no replacement or scored retry. At most 15 minutes elapsed from first dispatch to first report, 6,000 output tokens across design/report and 12 local read calls after the design; not a promise that token limits are host-enforced. Stop at the first exhausted bound, preserve all output already produced and mark remaining scope incomplete. The coordinator records actual host/model/tool access and any unavailable metering. No extra time or repaired evidence will be supplied to improve the answer.
```

The private dispatch appends the full contents of G1–G5 and exact relative paths to each, plus the selected instruction files/bytes or complete source-file reads. It does not append this plan, companion spec, protocol, key, expected semantic count, control names, verdict hints or clause list. The complete supplied facts are available before first design; “first design” therefore measures source/evidence interpretation, not unaided product discovery. Both this limitation and the selected-source direction must appear in closeout.

## Task 2 — Mechanical admission checks and freeze

**Files:** inert pack inputs from Task 1; private `ADMISSION.md` and copied instruction/packet inputs only after execution authority. No persistent validator or new test engine.

**Interfaces:** consumes exact pack bytes, approved effects and host capability inventory. Produces a list of `{relative path, byte length, SHA-256}` in an existing Markdown record, exact dispatch bytes, actual model/settings/host identities, permitted roots and event times. These are documentary tuples, not a new owner schema.

- [ ] Run mechanical negative controls before final fixture acceptance using in-memory copies only. M1 healthy accepts all five inventory rows and source/evidence labels; deleting G1's R1 or changing G2's SYN-C2 relationship is rejected. M2 one-byte drift is detected by digest; M3 a missing filename or wrong section pointer cannot be marked resolved. M4 adding KEY.md or plan/spec/rubric to the dispatch allowlist is rejected; M5 missing FIRST-DESIGN.md cannot satisfy a first-output freeze. Negative controls never mutate the real packet or produce actor scores.
- [ ] Use this exact read-only Node command from the owner root after materializing the pack. It exercises those five input classes mechanically. It deliberately never reads or grades actor meaning.

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const base = 'evals/dialogue-quality/20260930-card1-grounded-obligations';
const hash = b => createHash('sha256').update(b).digest('hex');
const names = ['G1','G2','G3','G4','G5'];
const required = [['R1','E1'],['R2','E2','E3'],['R3a','R3b','E4'],['R4','E5'],['E6']];
const packets = names.map(n => readFileSync(`${base}/packets/${n}.md`, 'utf8'));
function fixtureOK(values) {
  assert.equal(values.length, 5);
  values.forEach((s,i) => {
    assert.ok(s.includes(`Inventory: target SYN-T${i+1}; check SYN-C${i+1}; relationship SYN-C${i+1} → SYN-T${i+1}.`));
    required[i].forEach(id => assert.ok(s.includes(`## ${id}\n`)));
  });
}
fixtureOK(packets);
assert.throws(() => fixtureOK(packets.map((s,i) => i ? s : s.replace('## R1\n',''))));
assert.throws(() => fixtureOK(packets.map((s,i) => i !== 1 ? s : s.replace('SYN-C2 → SYN-T2','SYN-C2 → SYN-T3'))));
const original = Buffer.from(packets[0]);
assert.notEqual(hash(original), hash(Buffer.concat([original, Buffer.from('x')])));
function pointerOK(file, section) {
  assert.ok(existsSync(file), 'missing-file');
  assert.ok(readFileSync(file, 'utf8').includes(`## ${section}\n`), 'missing-section');
}
pointerOK(`${base}/packets/G1.md`, 'E1');
assert.throws(() => pointerOK(`${base}/packets/ABSENT.md`, 'E1'), /missing-file/);
assert.throws(() => pointerOK(`${base}/packets/G1.md`, 'E99'), /missing-section/);
const allowed = new Set(['ACTOR-TASK.md', ...names.map(n => `packets/${n}.md`)]);
const assertDispatch = list => list.forEach(p => assert.ok(allowed.has(p), `forbidden-dispatch:${p}`));
assertDispatch([...allowed]);
for (const forbidden of ['KEY.md','PROTOCOL.md','reviewer-rubric.md','implementation.md','spec.md']) {
  assert.throws(() => assertDispatch([...allowed, forbidden]), /forbidden-dispatch/);
}
const assertFreeze = list => assert.ok(list.includes('FIRST-DESIGN.md') && list.includes('FIRST-REPORT.md'));
assertFreeze(['FIRST-DESIGN.md','FIRST-REPORT.md']);
assert.throws(() => assertFreeze(['FIRST-REPORT.md']));
for (const name of ['PROTOCOL.md','ACTOR-TASK.md','KEY.md','READER-TASK.md', ...names.map(n => `packets/${n}.md`)]) {
  const bytes = readFileSync(`${base}/${name}`);
  process.stdout.write(`${hash(bytes)} ${bytes.length} ${base}/${name}\n`);
}
process.stdout.write('Mechanical controls only: M1-M5 satisfied; no semantic score.\n');
NODE
```

This command is intentionally small and disposable. Dispatch allowlist logic tests the declared filenames, not security against semantic leakage; AQA must manually inspect the actual full dispatch bytes. It neither tests host interception nor enforces artifact immutability. Section checking is deliberately limited to these exact supplied headings, not a generic Markdown parser. An existing file named ABSENT.md is fixture pollution and stops admission.

- [ ] Record separately the exact instructions, five packet hashes, key/rubric/protocol hashes, evidence IDs and section locators, effect budget, actual host/model/settings and access. Actor model is fresh Sol, not the current author; reviewer is a different fresh agent, not a renamed role. If actual model cannot be confirmed, record requested vs observed/unknown rather than claim an attested model.
- [ ] Copy only accepted instruction tree and packets to the declared run roots, using scoped file editing/copying appropriate for verbatim inputs; hash copied bytes and compare with source inventory. No evaluator material in assigned actor root. Current skill `references/` files resolve locally; neither installed copy nor historical donor is selected. References to absent non-instruction runtime source do not authorize restoring/building it for this exercise.
- [ ] Before dispatch, save exact prompt and hash in ADMISSION.md together with model/host/capabilities, source/root identities, start/bounds, full five-target/five-check/five-edge inventory and seven-item evaluator denominator, token/cost telemetry availability, approved execution scope and first-output destinations. Hash the key before the actor starts. AQA must GO the exact freeze; any changed fixture/key/dispatch invalidates that admission and requires a fresh pre-dispatch review.

Actual isolation is **shared-filesystem, prompt-separated, open-context**. The actor is not OS-sandboxed away from KEY.md. Withholding means not supplied/not authorized, not impossible to read. Record visible tools and any access outside assigned roots. If the host lacks raw tool transcript export, state that before admission: the run can at most support supplied-evidence semantic interpretation with limited provenance; it cannot make an independent no-leak/access-compliance claim. Do not counterfeit a transcript or elevate prose attestation into sealed access evidence.

## Task 3 — One combined first actor, design then report

**Files:** private actor artifacts/transcript/freezes above; no tracked fixture changes once dispatched.

**Interfaces:** consumes the admitted combined dispatch. Produces two first artifacts as unchanged UTF-8 bytes with separate freeze times/hashes. The design is frozen before optional inspection and before the report-stage prompt; the report is frozen before feedback/reader/key comparison.

- [ ] Dispatch one fresh Sol with no inherited conversation, all five complete packets and selected instruction tree. Preserve exact original dispatch and actual requested/observed model/settings. No five separate actors and no subagents.
- [ ] Retain its first design unchanged and hash immediately. If the actor combines a final report into that first answer, retain the entire first answer as first evidence; record the protocol deviation rather than asking for a cleaner replacement. Missing design is an explicit incomplete/deviating first attempt.
- [ ] Send only: “Your first design has been retained unchanged. Continue within the original scope and remaining budget to your first report; no new facts or feedback are supplied.” Preserve that prompt. Optional reads cannot become product actions or new source searches.
- [ ] Retain FIRST-REPORT.md, original outputs and any tool/error evidence, then freeze hashes and elapsed time before any comments. No coordinator content repairs, link repair, paraphrase or suppression of limits in the first report. If output saving is coordinator-mediated, retain the exact original answer plus saved-byte comparison and mark the intervention as persistence only.
- [ ] Evaluate no result yet. Missing artifacts, budget expiry, accidental key access or authority deviation terminate the affected protocol without replacing the actor. Retain completed and unattempted scope. Unknown tool/effect outcomes are reconciled from original output, not retried. There are zero newly executed product checks regardless of how many retained records were interpreted.

The prescribed semantic controls are G1 incomplete evidence, G2 broken persistence, G3 conflicting authority, G4 healthy delay and G5 unknown oracle. Do not add or swap scored cases after outcomes are seen. The first design/report must be evaluated even if the eventual finding is NO-NEW-CODE.

## Task 4 — Fresh reader, freeze, then comparison

**Files:** READER-TASK.md, private reader artifacts and evaluator COMPARISON.md. Input first-report path is absolute at dispatch and frozen; its referenced inputs remain available at their frozen paths.

**Interfaces:** reader consumes only a report locator plus this generic task, not the actor conversation, spec, key, packet root, inventory/count or ready-made item list. It produces first reconstruction/retrieval trace; only after freeze does evaluation consume full packet/key and both first artifacts.

### Exact `READER-TASK.md` content

```text
Read the saved report at the supplied locator. Recover the task's known target/check scope, conclusions, source/evidence provenance, qualifications, unknowns and remaining work by following the report's own pointers as needed. Do not assume a missing file or failed read means that the underlying evidence does not exist.

Your only initial content input is this report locator. Do not read evaluator files, another agent's conversation or unlinked workspace material. Follow a report pointer only into the referenced document/section and necessary directly referenced sources. If unavailable or ambiguous, retain the gap; do not search the whole repository to discover an answer key.

Produce FIRST-RECONSTRUCTION.md and RETRIEVAL-TRACE.md. For each attempted retrieval record the parent pointer, exact requested file/section, success/failure, retrieved material and any supplemental information, request or intervention. Distinguish what the report itself says from what you recover through a source link. Include elapsed time and what you could not recover. No product/API/browser/network, edits to source/report, new observations, messages to owners, or subagents are allowed.

Maximum 10 minutes, 4,000 output tokens and 15 local read-only retrieval calls. Stop at the first exhausted bound and retain the partial result. Do not seek the evaluator key or expected answer. This is a shared-filesystem, prompt-separated sample, not enforced blind isolation. Freeze your first artifacts before any comparison or feedback.
```

- [ ] Launch a different fresh reader with no inherited history and only the exact first-report locator; do not disclose the five/seven denominators. Preserve actual dispatch/tool access/model and first read time.
- [ ] Freeze reconstruction and trace plus original transcript, hashes and elapsed time. If the reader cannot open a broken pointer, record it without feeding the missing material. If supplemental material is nonetheless supplied, record it as an intervention; it is not unaided recovery. At budget cutoff retain partial output unchanged.
- [ ] Only after both reader artifacts are frozen, a separate evaluator reads the full admitted packet/key and writes COMPARISON.md with three separate columns: (a) actor explicitly retained, (b) reader recovered from report/pointers before key, (c) only later key comparison revealed. Each cell quotes exact artifact text and points to hashes/sections; unknown/unavailable stays explicit.
- [ ] In comparison, enumerate SYN-T1/C1 through SYN-T5/C5 and each of seven decision items. A source link that lets the reader discover an actor-omitted clause does not repair the actor score. Every unmatched ID, clause, qualification, unsupported claim, broken pointer or intervention is recorded. No post-feedback wording replaces either frozen output.

## Exact evaluator-only KEY.md content and decision contract

The key includes this table and the following paragraphs verbatim; it is not an actor instruction or runtime schema.

| Item | Source and evidence | Required bounded decision |
| --- | --- | --- |
| G1-title | R1; E1, A1/D1/S1 at 10:00:02 | Title survives reload supported; retain pre/post value Operations and same-context qualification. |
| G1-order | R1; no post-reload order observation | Column-order preservation unassessed, not passed or failed. Next action is an authorized retained/new same-context post-reload column-order read; no execution occurs here. |
| G2-ack | R2; E2, A1/P1/S1 at 10:01:00.200 | Acknowledgement supported, not completion of persistence. |
| G2-value | R2; E3, A1/P1/S1 at 10:01:02 | Persistence contradicted: expected weekly, actual daily after valid reload/read. Preserve bounded diagnosis; no automatic confirmed product bug, tracker write or release verdict. |
| G3-order | R3a/R3b; E4, A1/L1 | Oracle unresolved. Both equally applicable sources retained; no recency/UI tie-break. Ask the precise authority/preference question in notes or propose authorized investigation while independent packet work continues. |
| G4-ready | R4; E5, A1/J1/O1 | The within-5-seconds condition supported by ready at 3 seconds; pending at 0 is not failure. Neither instantaneous nor continuous/later readiness is established. No budget extension or new O1. |
| G5-cap | TASK5 request; E6, A1/L2 | Normative cap unresolved, 200/20 merely observed. Request/investigate the missing applicable cap rule; no invented expected cap or resolved owner oracle. |

Expected bounded semantic account is three supported, one contradicted, one unassessed, two oracle-unresolved = seven. Inventory is five targets, five checks, five relationships; newly executed product checks = zero. These are different denominators. G1/G2 each have two semantic items; G3/G4/G5 one each. No extra assumed targets may be silently added as covered or removed as nonexistent.

Score each G control adequate/inadequate/indeterminate semantically, with actual first-output quotes and source/evidence pointers. Adequate requires all its applicable clauses and qualifications, grounded discriminating decision, explicit unresolved/unassessed remainder and bounded next action, with no unsupported claim or authority violation. No phrase matching. Missing exercise information preventing judgment is indeterminate, not an actor failure or PASS; contradictory statements remain findings even if another sentence is correct.

Separately record every aggregate condition: all seven items identifiable with no added normative clause; source/conflict/unknown/object/role/time preserved; each supported/contradicted claim tied to discriminating evidence; all five intended distinctions and no unsupported PASS/confirmed bug/normative failure; all five target/check pairs plus separate item accounting and full remainder/main-conclusion caveats; concrete next step for G1-order/G3/G5 without freezing unrelated work; no fabricated evidence/receipt/authority expansion/unknown-effect retry/historical overwrite/automatic publication. Five-control gate requires 5/5 adequate from this one actor AND every aggregate condition. Aggregate failure does not rewrite unaffected per-control scores. No averaging, automatic PASS calculator or reliability percentage.

Reader transfer is a separate finding: all five target/check pairs and seven items recoverable with no unsupported acceptance claim; list omissions and provenance differences. Judge actor completeness independently. A truthful failed/partial sample is useful evidence, not reason to retry. For every loss compare source → exact dispatched context → first design → retained evidence → first conclusion; identify first visible retrieval/interpretation/capture/verdict-reporting loss, or unknown if unlocatable. Omitted dispatch facts are not blamed on actor interpretation. Propose no-new-code/no-skill-adopt unless an exact owning defect is demonstrated.

## Task 5 — Independent AQA and bounded closeout

**Files:** private AQA.md/CLOSEOUT.md; RESULT.md only for separately scoped sanitized delivery.

**Interfaces:** consumes the exact freeze inventories, raw first artifacts, reader trace, evaluator key and comparison. Produces independent judgments for each of five controls, every aggregate condition, actor vs reader recovery, protocol/access deviations, and the next bounded gate. The reviewer must not be the author, actor, reader or evaluator; actual identity/model/settings are recorded.

- [ ] Fresh independent AQA recomputes hashes from retained bytes and inspects relevant raw records itself. It checks all five control decisions, every aggregate condition and all five Review Focus classes. Reading actor evidence is not independent reproduction; no live reproduction is requested.
- [ ] AQA reports adequacy, limits and every mismatch, including frozen first-output defects that later writing corrected. If evidence access fails, retain INCOMPLETE/indeterminate and the exact missing path; do not reconstruct evidence from a summary. Missing raw transcript limits access/protocol claims even if semantic text is adequate.
- [ ] Closeout retains all attempts, RED/blocked/incomplete outcomes, assistance and stop decisions. Record actor/reader/AQA elapsed time, tool-call counts, supplied/output tokens and cost where available; unknown is not zero. A content revision gets a new exact revision/hash and cannot inherit old review automatically.
- [ ] Minimal repair disposition is NO-NEW-CODE/NO-SKILL-ADOPT unless trace demonstrates a specific owner gap. A defect in the fixture or dispatch is repaired as admission material for a separately admitted future case, not used to re-score a replacement first attempt. No automatic G1–G5 replay, Card2/MCP work or product campaign follows.
- [ ] State exact claim: at most this bounded source-directed, supplied-evidence, open-context reasoning and transfer sample. No causal improvement, universal reliability, live-product acceptance, installed-host discovery, sealed attachments, independent live reproduction, MCP readiness or W/P completion. Card2 must separately preserve owner source/expected text/full scope/evidence through its approved MCP interface; local file success does not qualify that interface. Card4 still needs its own fresh useful task, oracle, authority, attainable retention and first design/report/reader gates.

## Budget, stops and preservation across all tasks

The prospective semantic run has exactly one actor, one reader, one later comparison and one independent AQA; no adaptive loops. Actor: 15 minutes/6,000 output tokens/12 optional reads. Reader: 10 minutes/4,000 output tokens/15 reads. Evaluator comparison: 15 minutes/5,000 output tokens/20 reads. AQA: 20 minutes/6,000 output tokens/25 reads. Whole admitted run elapsed ceiling: 75 minutes including persistence/dispatch overhead. Setup/design review is separate and not represented as free or zero-cost. Use observed host accounting when available; the token ceilings are instructed output limits, not unverified platform enforcement. On exhaustion stop and keep partial output, never silently increase bounds.

Admission fails on missing approvals, missing/changed packet/source/key bytes, unsupported persistence, inability to obtain a fresh actor/reader, or unexpected required effect. During execution stop affected scope on contamination, unsupported action, unknown tool outcome or loss of artifact retention. Do not kill unrelated work or delete partial files. Original first outputs remain unchanged; corrections are separate files explicitly marked assisted, outside first-attempt gate. No auto-scheduler/retry/controller is added.

Private retention stays under the exact ignored run root. `.local/` is not a security boundary. Never include real credentials/accounts/session state in these synthetic fixtures. Hash after sanitization before freeze; post-freeze sanitization of a public derivative is a new artifact with its own mapping/hash, not the original evidence. Preserve original raw artifacts privately; missing original bytes are stated, not regenerated. No cleanup/deletion is part of this plan.

## Public delivery without held ancestry

The coordinator verified B00 PR1 OPEN/unmerged at `25738e63` over public base `04f84555`, three docs only; no merge is authorized. B00 commit is not present in this author's owner object database, so the author relies on the coordinator's separately attributed readback and performed no network fetch. G01 is an independent spec+plan+review documentation PR from the verified public base, not a stack on B00. Before future Q1 public delivery, the delivery owner must re-resolve exact public base and status via its separately authorized workflow. Do not publish the 39 held ancestors by pushing or merging the integration branch.

The narrow portable companion is necessary: the historical spec and its recursive historical plan/review links are not guaranteed present on the public baseline. Merely linking the plan to that absent closure is not a usable public implementation handoff. Do not import the approximately 24-document historical closure; carry the self-contained prospective companion and this exact plan, then only the inert pack files within the independently reviewed allowlist. Historical origin path/hash may be plain provenance, not a broken required navigation link. The selected instruction snapshot is a prerequisite of a future local run, not permission to ship new source bundles or claim the old public manifest selects Console014/Kernel847.

After separate delivery authority: one implementation PR for this scoped fixture/doc change; Sol self-review, current-base conflict check, independent AQA and public-tree readback precede push/PR. Use a branch from the verified public base and explicit allowlisted file transfer, not whole-branch merge/cherry-pick that drags held history. Verify `git rev-list public-base..candidate` contains only intended new commits and `git diff --name-only public-base...candidate` only the approved files. Exact base reference is determined from read-only remote evidence at delivery, never guessed from this draft. No merge follows automatically. Actor/key files are public synthetic fixtures, but future claimed key isolation must still be honest about their public availability.

If accepted execution results are to be delivered, include sanitized exact first artifacts plus their referenced synthetic packet bytes and hash mapping in the same bounded PR or a separately requested result PR; a RESULT.md pointing only at private `.local/` is not portable evidence. Do not publish host transcripts until reviewed for private paths/account metadata. Publication permission and enough portable evidence are independent gates; absent permission, keep the complete local run and report a public-delivery remainder.

## Author self-review — this prospective draft

- Spec coverage: existing owner/prose seams and representability gate are in Interfaces; source/applicability/clause/evidence/remainder recipe and exact expectations are preserved; compound, async/persistence and conflicting/unknown semantics are in packets/key; five-target/five-check/seven-item denominator and all per-control/aggregate gates are explicit; first design/report freezes and staged fresh-reader trace are Tasks 3–4; independent AQA, first-loss tracing, no-replay/no-adopt and Card2/Card4 limits are Task 5. No known spec requirement omitted.
- Placeholder review: concrete packet values, exact file paths, literal actor/reader prompts, evaluator decisions and mechanical command are supplied. At-run identities/hashes/timestamps and user authorization cannot honestly be invented in advance; their exact derivation and stop rule are specified rather than fabricated. No runtime extension or undefined helper is proposed.
- Interface review: G1→SYN-T1/SYN-C1 through G5→SYN-T5/SYN-C5; R1/R2/R3a/R3b/R4/TASK5 and E1–E6 match across packets/key. E2/E3 share A1/P1/S1; E5 preserves J1/O1 timestamps; owner enums never acquire the prose item labels. FIRST-REPORT.md is the one reader locator; reader freezes before COMPARISON.md/key access.
- Review Focus coverage: compound/denominator (G1/G2 + aggregate + reader comparison); wrong/missing pointers and bytes (M2/M3 + retrieval trace); oracle conflicts/unknown cap (G3/G5); persistence/time overclaim (G2/G4); contamination/first-artifact loss (M4/M5 + protocol stops). Mechanical tests verify only fixture integrity and deliberate negative controls, not semantic behavior or sandboxing.
- Current status: authored design/plan draft only. No files in the tracked tree, index, branches or HEAD were changed by drafting. No consumer, key scoring, code test, build, installation, product/tracker/host/network action or delivery was performed. Separate independent plan AQA and the exact user gates remain pending.
