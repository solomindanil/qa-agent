# Post-review dialogue QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement each approved bounded slice. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing dialogue-driven QA workflow reliable across selected products, for both scoped full QA and ticket reproduction, before transferring execution to cloud.

**Architecture:** Codex/Claude provide reasoning; existing Console/Kernel and the Freeland harness provide execution, permissions, validation and evidence. Product-specific packs retain requirements, graph, rules, accounts and findings. Reuse existing publication, continuation and tracker tools; do not add another runner, verdict engine or universal learner.

**Tech Stack:** Existing Node.js/TypeScript, Playwright, Git bundles, product graph/catalog, host browser/API tools and official Nuanu Flow plugin.

**Spec:** [Existing master plan](../../roadmap/2026-09-06-master-plan.historical.md), [current roadmap](../../roadmap/README.md), and the user-supplied local audit at `/Users/danilsolomin/projectsnew/qa-agent/.local/critical-review-20260907/REPORT.md` with its `aqa.md`, `automation.md` and `cto.md`. This is a coordinated sequencing update to G0–G5, not a new architecture or an executable blanket authorization.

**Execution update, 2026-09-08:** the user paused Claude and assigned its unfinished work to Main. Main plus Codex subagents now own the Console lane; do not wait on or dispatch Claude. Original source/history are preserved. Current reviewed commits, evidence and unresolved gates are in [post-review correctness](../../qualification/post-review-correctness.md); the dated checkpoint below is historical. Actual Claude cross-host acceptance remains pending, not implied by Codex source qualification.

## Global Constraints

- Product Freeland remains read-only for code: no product push, deployment or migration.
- One owner per product campaign; source edits use isolated component worktrees. Only the coordinator integrates root pins/bundles and status documents.
- A published branch, accepted source, fresh product evidence and release acceptance are separate states.
- Keep credentials, sessions, private evidence and managed registrations out of tracked delivery. Do not move existing product workspaces.
- A request for a plan does not authorize the new implementation slices, tracker writes or live campaign expansion described here.
- Effects require the current product/environment authority. Freeland payment permission is not authority for another product or production.
- Unknown, blocked, shadow and unrun do not become PASS. A repeated oracle failure alone does not establish a product defect.
- Use installed/source skills selected by the current project. No bulk installation, inactive reporting-kernel substitution or unreviewed dependency changes.
- Every approved code slice follows focused RED → minimal fix → healthy and faulty controls → independent Lead AQA review → dependent checks. Keep earlier failed evidence.
- G6/cloud is excluded from this delivery. Do not promise exhaustive quality for every possible product.

## Verified coordination checkpoint — 2026-09-07

| Owner / source | Current result | Remaining boundary |
| --- | --- | --- |
| Root qa-agent | Accepted checkout `48bccef6996496d795874ef47ea11d0ae089237a`; integration candidate `787d3df963fe1ff71c80457a49753653e44505e7` | Candidate is not silently substituted for accepted root |
| Integration candidate components | Console `f4b0d56c0885ca96f310c675872a9adabee9a0e9`, Kernel `393af209a7629d075258fd1050224db071817a47`, Freeland `ca9d9b4844f940d5f544652f22bbca7ebf9c4754` | Audit findings remain open on these sources |
| Main / Freeland follow-up | `d31a80c5a5d68dd1d9f3d535db5f0fefbaa553f6`: cancellation-fixture synchronization fixed; frozen `qa:verify` 2363/2363; independent complete bundle proof | Not yet in root candidate manifest; does not repair pool/oracle findings or prove a product release |
| Claude, “Шлифовка QA Freeland” | Third actual loopback authored-regression run exit 0, 8/8 TAP records; root read report/log and checked their hashes | Synthetic same-machine qualification only; CAS plan mode under umask 077 remains open; prior RED runs retained |
| QA Starter, task `01a071f1-05cf-7eb2-8a18-ccf204874345` | Earlier real Nuanu state/priority slice accepted separately; latest 20 reads found explicit null cycle IDs in all 20 | Cycle membership oracle not executed: no positive witness; no additional scope authorized, no fixture created |
| MagicCard owner, task `01a0720c-a6b5-7dc0-b1e0-86527a8f5856` | Original six UI assertions passed in both attempts; supported receipt readback accepted exact saved run | Sealed ENV_BLOCKED: external Telegram script HTTP 404. Auth, funding and 32 blocked targets are not covered by these six assertions |

Fresh evidence pointers (host-local, not portable source authority):

- Freeland frozen gate: `/private/tmp/qa-precloud-freeland-live.ab8E8g/qa-verify-final-readiness.tap`.
- Freeland source delivery: `/private/tmp/freeland-d31-source-delivery.FWkvPx/delivery-proof.v1.json`.
- Claude report: `/private/tmp/claude-g45-run3-lg1kMi/out/RUN-REPORT.md`, SHA256 `9e77f2391c9f64b6ae5d5bee3fbfe34e83ecaf25bbe5d179c96e5e910ad0b171`.
- Nuanu cycle result: `/private/tmp/qa-nuanu-cycle-live-boifnx_f/RESULT.json`.
- MagicCard readback: `/Users/danilsolomin/projectsnew/magiccard-qa-20260905/restart-20260906/audit/g1-f4-actual-root-readback.md`.

Subsequent owner diagnosis, read back by Main: `STG-RESTART-014` identifies the product's wrong Telegram SDK URL (`telegram-webapp.js`, missing the hyphen in `web-app`). Retained HTTP and browser records confirm 404/HTML and ORB; the separately checked documented URL returns JavaScript. Report: `/Users/danilsolomin/projectsnew/magiccard-qa-20260905/restart-20260906/BUG-STG-RESTART-014-TELEGRAM-SDK.md`. This is a separate confirmed loader defect, not a rewrite of the sealed G1 ENV_BLOCKED receipt. Later browser observation is attributed to web/MCP 8bc8014/API979, not the earlier G1 candidate. Actual Mini App acceptance remains unrun.

## Work allocation and ownership

| Lane | Proposed implementation owner | Exclusive implementation scope | Independent acceptance |
| --- | --- | --- | --- |
| Root integration / source verification | Main + bounded local subagent | `tools/lib/source-workspace.mjs`, root tests, bundles/pins, roadmap | Fresh reviewer + Main exact-byte readback |
| Console correctness | Main + Codex subagents (Claude takeover) | Adapter, runner triage, findings reader, existing CAS plan writer and their tests | Lead AQA not authoring these fixes; Main integration |
| Kernel safety / reusable product-pack seams | QA Starter Codex task | Active Kernel scanner/validator tests; later only the pack seam required by a demonstrated scenario | Independent reviewer; Main resolves cross-component changes |
| Freeland pool, payment oracles and graph/ticket QA | Main + bounded subagents | Freeland-owned tools/tests/skills and private campaign under one owner | Lead AQA; candidate-specific evidence |
| MagicCard live testing | Existing MagicCard task only | Its registered product workspace, tests, knowledge and authorized product tools | Main/reviewer readback; no shared Kernel/Console edits |

No two workers edit the same component file concurrently. Console-to-Kernel API changes require coordination before editing. The table is the next work allocation; this planning turn does not dispatch implementation.

## Step 0 — preserve completed work and establish one integration checkpoint (G0/G5)

Files: `sources/manifest.v1.json`, `docs/roadmap/README.md`, `docs/qualification/`, `products/README.md`, `skills/README.md`.

- [ ] Record accepted vs candidate vs component-only revisions and the exact evidence boundaries above in the integration checkpoint.
- [ ] Preserve d31 delivery and Claude's successful third run without rewriting either earlier RED run.
- [ ] Synchronize current routing/status at integration; distinguish real Nuanu product evidence from the synthetic Nuanu-named fixture.
- [ ] Freeze the implementation baseline for each worker. Do not migrate pins, graph digests or old receipts mid-campaign.

Exit: a fresh session identifies current owners, executable versions, accepted results and open defects without reconciling contradictory historic prose itself.

## Step 1 — repair current false diagnoses and trust boundaries in parallel (G0/G2)

### 1A. Main: exact-source verification and Freeland observations

Files: `tools/lib/source-workspace.mjs`, `tests/workspace.test.mjs`; Freeland `tools/freeland-pool/pool-state.mjs`, `tests/freeland-staging-replacements/support/pool.ts`, `tools/freeland-replacements/tc-pay-07-oracle.mjs`, `tools/freeland-replacements/tc-pay-09-oracle.mjs`, `tests/freeland-staging-replacements/tc-pay-09.spec.ts` and corresponding existing focused tests.

- [ ] QA-08: turn the retained synthetic same-size/mtime source change into a failing root regression; compare tracked bytes/modes with pinned Git objects, retaining existing index/path guards. Verify with `node --test tests/workspace.test.mjs` and `npm run sources:verify` in the approved isolated source.
- [ ] QA-03: reproduce readable zero balance plus null/invalid operations/products/VPN. Preserve unknown as unknown; require valid evidence only for the resources a scenario actually needs.
- [ ] Add the resource-family matrix: explicit empty, populated, missing, wrong envelope, invalid JSON, HTTP/auth failure and unexpected VPN state. The first two are observations; others cannot prove absence.
- [ ] QA-04: require readable before/after observations for each claimed unchanged property. `null/null` cannot prove unchanged; an unavailable UI read does not erase a valid API observation or qualify the entire case.
- [ ] QA-05: check amount, currency and the applicable unit/rounding rule; keep API-price proof separate from rendered-UI-price proof.
- [ ] Confirm the collection-time pool-binding issue with a focused regression before fixing; use the existing runtime fixture where applicable.
- [ ] Keep PAY-07/PAY-09 shadow until their own qualification gates pass on valid evidence. Neighboring fixes do not promote them.

### 1B. Main/Codex takeover: Console oracle/triage, findings reader and CAS portability

Files: Console `src/node/playwright-campaign-adapter.ts`, `src/node/qa-campaign-runner.ts`, `src/node/qa-campaign-files.ts`, `server/bridge.mjs`, `tests/unit/playwright-campaign-adapter.test.ts`, `tests/unit/qa-campaign-runner.test.ts`, `tests/unit/public-auth-authored-revision.test.ts` and focused reader/writer tests.

- [ ] QA-01: make readiness semantics explicit. A healthy element appearing after 1.2s within a 3s budget must pass; a truly absent element must fail within that budget. Preserve intentional snapshot/absence checks where they have a valid contract.
- [ ] QA-02: semantic JSON object equality, retaining array order and distinguishing missing/null, number/string and unequal values. Controls include `{a:1,b:2}` versus `{b:2,a:1}`, `[1,2]` versus `[2,1]`, and `1` versus `"1"`.
- [ ] Verify the complete diagnostic path: repeatable selector/readiness/oracle mistakes must not automatically create a confirmed product defect. Qualified expectations and agent root-cause review must be visible; do not require a human for every assertion.
- [ ] QA-07: repair active findings-reader containment. Preserve ordinary findings reads; refuse outside-workspace file and ancestor symlinks. Do not overclaim untested race/hardlink protection.
- [ ] In a separate bounded approved slice, fix the observed CAS writer mode mismatch under umask 077 without weakening Kernel validation; repeat both 077 and 022 controls. Do not call the third GREEN run a fix for this issue.

### 1C. QA Starter: active Kernel secret guard

Files: Kernel `src/kernel/secret-policy.ts`, `src/kernel/workspace-validator.ts`, `tests/security/secret-policy.test.ts` and the existing workspace validation tests.

- [ ] QA-06: quoted JSON keys, quoted/escaped YAML values and known-secret behavior; preserve safe environment-reference/redacted-value acceptance.
- [ ] Add one actual validator-path regression, not just scanner unit tests. Keep statements bounded: scanner success does not guarantee screenshots or arbitrary binary artifacts contain no PII.
- [ ] Preserve active Kernel authority. QA-09/QA-10 exported-API defects remain explicit backlog until an active caller or bounded maintenance slice requires them.

Exit for Step 1: every touched defect has an original failing control, healthy control, family negatives, independent review and exact source identity. The evaluation in Step 2 starts alongside this work, not after all development.

## Step 2 — evaluate the agent's decisions, not only tool tests (G2/G4)

Owners: independent Lead AQA prepares ground truth; Main runs comparisons. Reuse existing fixture/eval material and ordinary tool outputs.

- [ ] Freeze a small named set before fixes are judged: delayed healthy UI, genuine missing UI, equivalent/different JSON, unreadable account state, changed balance/operations, wrong currency, unavailable dependency, stale candidate and wrong oracle.
- [ ] Include unseen variants and independently sourced expectations. The fix author is not the sole author of the success criterion.
- [ ] Run baseline and candidate with recorded host/model/skills/tool versions, no best-attempt cherry-picking. Evaluate diagnosis, final outcome and prohibited actions separately.
- [ ] Record false product bugs, false PASS, missed known defects, correct blocker classification, human interventions and elapsed time. Small-set counts stay counts; no unsupported universal percentage.

Exit: selected required controls show no false PASS or false confirmed bug and distinguish all known healthy/faulty/blocked cases. A failure stays visible and blocks the affected capability; unrelated safe lanes can continue.

## Step 3 — integrate reviewed sources, then qualify real business slices (G1/G2)

- [ ] Main integrates reviewed component commits/bundles, verifies raw bytes/modes, runs affected component checks and clean-restore checks. Refresh stale source-dependent evidence only through its existing supported path.
- [ ] Before any campaign, classify its tests as read-only, provisioning, mutation/security probe or payment. Existing full/dry names are not permission boundaries. Test a deliberately writing fixture against the read-only guard before using that claim.
- [ ] Freeland: refresh environment/candidate and QA-column inventory; repair required graph mappings from actual code/requirements, then run the safe admitted scope. Original reproduction and relevant dependency outcomes are required before a ticket is accepted as fixed.
- [ ] MagicCard owner: retain the six-check ENV_BLOCKED receipt and separate STG-RESTART-014 loader finding. After a deployed fix, verify the actual script URL/JavaScript load, review the changed dependency scope through its supported publication path, and separately test actual Mini App behavior. Meanwhile select an authorized independent business scenario beyond the existing public login-boundary assertions; do not suppress the dependency error to obtain GREEN.
- [ ] QA Starter/Nuanu: preserve the missing-cycle-witness result. Obtain an existing positive witness through approved bounded discovery or request that concrete input; meanwhile select an independently runnable case. Do not create product fixture data merely to manufacture a passing result.
- [ ] Admit required auth/role/async capabilities one demonstrated seam at a time, reusing host browser/API tools. Confirm usable evidence storage and private-artifact handling; public Console schema alone does not prove authenticated support.

Exit per business slice: independent expectation → actual role/state → executed original path → observed final business state → diagnosis → repeatable check. Local/unsealed agent observations remain useful investigation, not silently upgraded release evidence.

## Step 4 — deliver both dialogue workflows and explicit coverage (G2)

- [ ] Full QA: requirements/roles/states/integrations/dependencies inventory; risk-based design with boundaries, negative cases and state transitions; execute supported lanes and list every remaining gap.
- [ ] Ticket QA: official Nuanu Flow plugin → current QA items → original reproduction + relevant dependencies → evidence-backed result. Dedupe/template/state contract/readback govern authorized writes. No second Flow client or invented universal ticket CLI.
- [ ] Keep release-risk verdict separate from full-QA coverage. Review critical monitoring cases explicitly; past evidence reuse requires current applicability, and waivers must be explicit, scoped and time-bounded.
- [ ] Include UI/responsive, accessibility, performance, security and reliability in the applicability inventory. Execute available relevant tools; unsupported lanes stay unassessed. Do not infer these results from screenshots or functional PASS.
- [ ] Skills route and explain the process; deterministic code enforces the minimum necessary constraints. Update existing complete source skills and references for these proven paths instead of creating one skill per test.

Exit: the same product can be requested as full QA or QA-column reproduction; both reports preserve total/selected/executed/pass/fail/blocked/unrun/waived scope without equating ticket coverage with product completeness.

## Step 5 — non-blocking human help and controlled graph improvement (G3/G4)

- [ ] On an actual capability gap, record the specific required input, attempted alternatives, affected cases and resume checkpoint. Continue independent authorized work.
- [ ] On reply or resumed session, recheck product/account/candidate and complete only the unresolved dependent work. Do not repeat unknown side effects; retain earlier receipts.
- [ ] Use one real product finding to add a confirmed graph dependency/regression via existing proposal/validation/publication/readback mechanisms. Keep requirements separate from guesses and observations separate from interpretation.
- [ ] Demonstrate the next task retrieves and uses the improvement; evaluate buggy/fixed and held-out variants with unchanged expectations. Keep rollback and contradiction/staleness handling.
- [ ] When discovery context changes, use a supported successor-context path or expose the specific missing capability. Adding edges to stale discovery is not a valid context update.

Exit: human assistance blocks only dependent lanes, and at least one real subsequent task benefits from a checked knowledge/test improvement. Every run may add experience; not every run must change behavior.

## Step 6 — pre-cloud dialogue acceptance on Codex and Claude (G0/G5)

- [ ] Fresh Codex and Claude sessions resolve the accepted source/skills and their actual tool capabilities without copying secrets or relying on donor directories.
- [ ] They complete comparable real product tasks with consistent semantic outcomes; exact prose and tool sequences need not match. Differences and missing capabilities are explicit.
- [ ] Qualify one real help/resume handoff plus restart/duplicate/cancel controls for admitted workflows. Same-machine loopback GREEN does not prove another OS, remote host or reboot recovery.
- [ ] Lead AQA independently checks the end-to-end result against requirements and known healthy/faulty controls, not just source digests.

Definition of this milestone: dependable dialogue QA for agreed scopes on multiple products; full and ticket modes; visible gaps; minimal human help; safe evidence/graph improvement; reviewed reusable modules and shared skills. This is not a claim of zero defects, all possible products or full replacement of every specialist QA task.

## Deferred work

- Cloud host/daemon, scheduling and unattended deployment (G6).
- Automatic expansion of spend authority or unbounded network permissions.
- Switching to inactive reporting code to obtain APIs; migrating all state into a new engine.
- Large oracle frameworks, model fine-tuning, broad refactoring or a mandatory 60-task benchmark before the first useful corrected slice.

## Execution and review rule

Follow the ownership table using already requested parallel agents/tasks after approval of the affected bounded slices. Main also implements its own lane and is the single integration owner. Independent Lead AQA review is mandatory for oracle/diagnostic and acceptance changes; review disagreement is resolved with a concrete counterexample. Refresh this checkpoint when a source/capability changes, preserving historical RED/blocked records.
