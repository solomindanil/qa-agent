<!-- Original actor report retained after execution, before independent review.
Original raw SHA256: 748124f5c314aa4b39e7b29e6d1af2668450d9624f272f43b376bc7d038c9069.
Only the private absolute exercise path is replaced by <exercise-root>.
This is historical evidence text, not executable instructions or current QA acceptance.
-->

# Fresh public catalog journey exercise

Result: **INCONCLUSIVE** from the unchanged existing runner: **1 pass, 5 needs_review, 1 blocked catalog candidate**. Eleven original attempts and 33 original artifacts are retained. One bounded search-behavior defect is supported by the actor's diagnosis; this is not an automatically confirmed dossier or a changed runner verdict.

## Observed result and scope

| Check | Runner result | Evidence interpretation |
| --- | --- | --- |
| Tools category, then All recovery | pass, one attempt | Same page: three cards → Hammer only → all three cards. Count and item-scoped exact-name visible assertions execute before and after recovery; all 26 trace events retained. |
| Mixed-case pE, then clear | needs_review, two attempts | pE leaves 3 cards instead of Pear only. Clear was never reached. |
| Fruit with pP, then clear | needs_review, two attempts | Fruit correctly shows Apple/Pear; pP leaves both instead of Apple only. Clear was never reached. |
| Absent zzq, then clear | needs_review, two attempts | 3 cards instead of 0. Clear was never reached. |
| Literal dot, then clear | needs_review, two attempts | 3 cards instead of 0. This does not establish a separate regex/wildcard defect; search appears ineffective more generally. |
| Summary across categories, empty and clear | needs_review, two attempts | Summary and membership guards pass at 3/1/2 for All/Tools/Fruit. zzq leaves 2 cards, failing before the zero-summary assertion. Empty summary and subsequent clear remain unassessed, not an independent summary bug. |
| Staff inventory candidate | blocked, not attempted | No staff account, authenticated surface or inventory-write authority. |

All four known coverage targets remain in the graph and plan closure; three public targets were selected, one staff target blocked. Only the public surface category-recovery check is fully verified. Search and summary target coverage remain partial despite authored automated mappings. Sorting, responsive/accessibility, load/security, backend inventory integrity and authenticated staff operations are not qualified.

## Diagnosis, not receipt promotion

The declared rule is literal case-insensitive name substring matching. Rendered inventory was Apple, Pear, Hammer; therefore pE must match Pear, pP within Fruit must match Apple, and zzq/dot must match nothing. Failures happen at item-count assertions, not brittle summary wording or a global text locator. Both attempts contain successful fill events and matching failures; no console errors or failed requests were recorded. All 11 traces have retained event count equal to totalEventCount (26; 6/6; 14/14; 6/6; 6/6; 34/34).

A separately labelled unsealed diagnostic checked the unique observed #query input: lowercase pe is actually present, but all three cards remain immediately, after one diagnostic second, and after blur. zzq also leaves all three. Fruit still narrows to Apple/Pear; pP does not narrow further; clearing empties the input and retains Fruit with Apple/Pear. This supports ineffective search behavior on this target, rather than an uppercase-only rule, selector collision, or ordinary readiness timing. It does **not** prove an internal implementation cause; fixture implementation was not inspected. The one-second delay is a diagnostic observation, not a rewritten assertion budget.

The same-session category restriction/recovery is sealed runner evidence. Search-clear operations in failed runner checks were correctly stopped at the failed intermediate boundary. The diagnostic's clearing observation is unsealed and cannot qualify restoration from a successfully narrowed search state. No additional campaign was run to manufacture a second failure or green result.

## Evidence and publication

Exercise root: `<exercise-root>`.

Main authoring and actual reader script: `actor.mts`; bounded diagnostic: `diagnose.mts`; persisted review API script: `review.mts`. Pre-run review: `PRE-RUN.md`. Exact public plan: `nuanu-readonly-qa/tests/qa-campaign.v0.json`.

Plan digest `sha256:27939f272210ab3ed4d2c4cfcf5c7868a5e61761d0d0441924700b25922e414c`; graph digest `sha256:0716c4dc7a9b763243887064d1703238e1a6ce7dc7db522cc34a774ecb7b2701`. Reviewed publication `sha256:a87b8b8a85059b61a9a70d082a9b91a70bf4cba5614d27aa46faac311ae279c3`, preview `sha256:fad18ce1d7170f0254be352baf6c664add8d657c1923527f818d1f3644e7bd13`; applied transaction `sha256:f163d9a13206612565c03a89ec12e3d2b0c6d412b9a6b6e9603f2158fd598061`. Publication before/proposed/preview/applied and workspace validation JSON files are retained alongside this report. Original requirements, kinds, staff coverage and discovery blockers were preserved. Generic original graph/discovery gap descriptions remain preserved historical metadata debt; they are not evidence that resolved expectations or product acceptance were automatically cleared.

Receipt: `nuanu-readonly-qa/tests/campaign-runs/run-1fd11eeaac7b6f21-c261ec49-3a34-4b54-bb99-f14409255a10/receipt.json`.
Receipt digest: `sha256:b75ff2d5504c635fb7ed74a0ceaae3238f3c502ee8b0e2710938d9022281eb75`.
Actual reader output: `evidence-readback-corrected.json`; full original trace/result inspection: `trace-inspection.json`; diagnostic: `diagnostic-observations.json`, `diagnostic-final.png`.

Six persisted reviews were read back through the existing review API, all `currentBinding.state=current`, all `agent_authored_unattested`, all retaining campaign verdict INCONCLUSIVE. `review-readbacks.json` contains full records, exact workspace-relative review paths and digests. The pass review is `sha256:8a0269676bc86a17a28eec864e515264d7732b8ee031558ce134bf3e90d8fe8c`; primary search diagnosis `sha256:5a791de7aceab40935ad3341a0c1b24015c274010e2881e1a0d30d92451fc4a9`; summary remains unresolved in `sha256:300aeb6aceb7780fa6822fd18b1c234435df55169dc7ed2b3207c92008bf944e`. No dossier or tracker ticket was created.

## Preserved actor mistakes and corrections

Before any publication, prepare attempt 1 failed compilation reconciliation. Diagnostic attempt 2 incorrectly assumed an index export and failed TypeError. Attempt 3 used the owning graph contract and exposed missing check-node target subkind plus noncanonical graph order. Corrected authoring adds that required shape/order; API validation and publication then succeeded. Scripts `actor-attempt1.mts`, `actor-attempt2.mts`, `actor-attempt3.mts` preserve these versions.

First evidence-reader call omitted required current product/graph/catalog bindings and returned invalid; `evidence-readback.json` and `actor-reader-attempt1.mts` preserve it. Supplying the actual readCampaignWorkspace bindings made the unchanged reader accept the original receipt. An exploratory shell trace read guessed a hash token and got ENOENT; the corrected diagnostic imports campaignCheckArtifactToken and selects exact receipt inventory paths. No artifact was missing or repaired.

First unsealed diagnostic used exact Category accessible-label matching and timed out before input changes; `diagnose-attempt1.mts` is preserved. The observed select id #category and input id #query were used in the corrected diagnostic, with a bounded five-second tool timeout. The campaign's supported nonexact label locators had already succeeded and were not changed. These are actor/harness-call errors, not extra product failures. Original tool outputs remain in the task transcript. Receipts and original campaign attempts were never edited.

## Limits and next action

Target is the owned local exercise `http://127.0.0.1:59431/catalog`, not a live product. Preparation used synthetic IDs/clock/discovery and an existing controlled registration. Source pair is Console66ac7db55a25f56b199b2cb00ad83df3b8dad868 / Kernel185d3e72309a4362db57cf2e805d1c00a5035909 from the packet's independent normal clone. Source identity is not a deployed-product SHA. No blind benchmark, autonomous onboarding, full-product, source-change, restart-recovery, cloud or dual-host qualification is claimed.

Next bounded step: independent parent review of the preserved plan, receipt, item expectations and diagnosis; if search is repaired under separate authority, re-establish target identity and authorize the same search/narrow/empty/clear regressions on that candidate. Keep staff and unassessed dimensions open. No automatic rerun, repair, publication or user-help request is pending from this actor.

Verification is scoped to unchanged source integrity, managed workspace validation, actual campaign evidence and review readback. Build/type/lint and full source test suites were not rerun: no implementation source changed, fixture/evaluator tests were excluded, and source self-tests would not establish product acceptance.

Final verification: root sources:verify exited 0 with the selected exact component pair; Console and Kernel git status were clean. Receipt hash still equals b75ff2d5504c635fb7ed74a0ceaae3238f3c502ee8b0e2710938d9022281eb75 with mode 0400. All 33 original artifact sizes and SHA-256 values match the receipt; all six stored review hashes match their readback digests and current bindings, with INCONCLUSIVE unchanged. This is integrity verification, not a new product run.
