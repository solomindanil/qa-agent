# Independent Lead AQA — persisted execution review

Status: **bounded campaign evidence accepted; continuation review pending.** This is not a product PASS. The managed verdict remains **INCONCLUSIVE**, with two `needs_review` checks, two blocked targets and zero dossiers.

Review date: 21 September 2026. Read the controller's actual-reader output, before-resume snapshot, all four attempt traces/results, both stored diagnoses, Phase 3 log/checkpoint, and healthy countercontrol report/traces/screenshots. Independently invoked the accepted `read-review` CLI for both diagnoses. No product request, new run, publication, observation write, source change or managed-evidence edit was performed.

## Binding and integrity

- Run: `run-8faed1fa237a0a75-fd0ed7dc-d955-4ec8-9377-937292a081d7`.
- Receipt digest independently recomputed: `sha256:f6c1a34ff8dfa18bc929a742f90274fd4985beaf8c89c20a7f45616c5658884d`.
- Plan: `sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85`; graph: `sha256:6090fad12b80304bdf164e9e3ed9a2f674c2573f26e57cba0154271116de5c59`; binding: `sha256:8faed1fa237a0a75301f1b962f70d22ae30cb943ceda24be93b67c233b6825d4`.
- Independently confirmed reader plan = snapshot plan = reviewed proposal semantically, receipt reader = snapshot receipt, catalog/graph/receipt links, and recomputed registered-identity binding. Canonical serialization changes the pretty proposal file bytes but not the approved plan semantic digest.
- All **12/12 snapshot artifacts** match receipt byte counts/hashes. All **12/12 corresponding live artifacts** still match at review time. Live canonical plan still matches. Both duplicate-attempt screenshots are byte-identical per check; one image from each was visually inspected with its trace. Control values are masked in images, so their values are supported by the successful frozen-plan value assertions, not inferred from screenshots.
- Initial registration's **four coverage targets remain exactly present**; no denominator reduction. The snapshot has two executable target/check relationships and explicit summary/staff blockers.

## Actual executed scope

| Check | Both attempts | Proven prefix / unassessed remainder |
| --- | --- | --- |
| Search / category / clear (`c39dd2…`) | `oracle_failure`, assertion 1: expected count 1, actual 3 | Navigation, `AMM` fill and Search value assertion passed. Count failed; Hammer visibility assertion 2 and assertions 3–13 are unexecuted, as are category-select and clear operations. Screenshot shows Apple, Pear, Hammer. Each complete trace has 8/8 retained events. |
| Controls / literal period (`23d962…`) | `oracle_failure`, assertion 8: expected count 0, actual 1 | All three operations and assertions 0–7 passed, including Tools value, Hammer witness, visible controls, period value and retained Tools. Final absence assertion failed with Hammer remaining. No later assertion suffix exists. Each complete trace has 24/24 retained events. |

The failing absence-window assertion retained its declared 1000 ms budget but stopped on the first contradictory sample (1 ms, 1 sample), as the adapter contract permits. It does not prove continuous observation or a completed one-second passing window. Neither check has a managed PASS. Repeated attempts are not additional distinct requirements or independently confirmed root causes.

The two diagnoses are substantively supported at the rendered behavior boundary: intended public control state is evidenced, counts contradict the independently reviewed brief-derived witnesses, repeated attempts and screenshots agree, and no console/request errors are recorded. This does not distinguish implementation causes such as ignored input versus pattern interpretation, prove arbitrary input behavior, or prove the unexecuted category/clear suffix.

## Separate diagnoses, not promoted verdicts

Accepted CLI `read-review` returned current local binding for:

- `sha256:10a2500fbcbf5d3d5f2036d57e25f4839682f2370063a1545eadad953efb675b` — search prefix.
- `sha256:bc4abdb0725451a5dd1888b13f1789e517c7f7948d10a2d1dc3f81f917df4b2c` — literal-period mismatch.

Both retain `assessment.kind: product_issue`, `agent_authored_unattested` attribution and the unchanged original receipt. The records explicitly limit scope, identify the stopped suffix and avoid source-cause claims. Current local binding does not attest today's deployment or turn the runner's INCONCLUSIVE into FAIL/PASS automatically. No tracker publication or dossier follows from these records.

Phase 3's prefix/suffix and four-target accounting agrees with the persisted evidence. Its nonzero wrapper exit is propagation of the intentional INCONCLUSIVE result, not a second harness failure. There is no false aggregate PASS in the reviewed checkpoint/log.

## Controller-only healthy countercontrol

- Driver still matches approved SHA-256 `81950465bc6450ad6c99b213eea07352b0bb04afd297e125c261428dfc18a058`.
- `healthy-control-result.json` binds the original pretty plan hash `d3e3ee3fceb8d9ddf3a8b1de478d2dbeca19d469f81b76c3279c146e2c535736`. It substitutes only navigation `/catalog` → `/fixed`, keeps assertions/expectations unchanged, uses the selected default adapter budget and writes outside the managed workspace.
- The two actual control traces have complete 36/36 and 24/24 events, with **14/14 and 9/9 assertions passed**. Three absence windows pass with 10 samples each and approximately 1000 ms elapsed. Screenshots show Fruit recovery with Apple/Pear and a supported empty state saying `No results`.
- This supports that the reviewed deterministic controls can pass on the owned healthy route. It is a controller-known countercontrol, not a second campaign, actor first-attempt success, target `/catalog` repair, summary-semantic acceptance, or product coverage. Do not add these two passes to the two original `needs_review` checks and report a misleading combined success rate.

## Operating friction — follow-up only

1. **Ordinary run status versus v1 continuation routing.** Phase 3's first two status probes used wrong arguments; the third passed an ordinary `run-…` ID to the v1-only reader. Console `scripts/qa-campaign.ts` routes `status` to `readCampaignContinuation`; `server/campaign-continuation-reader.mjs` line 20 requires `CONTINUATION_RUN_ID`, whose definition in `src/lib/campaign-continuation-v1.mjs` line 11 starts `run-v1-`. The generic “explicit canonical workspace/run required” diagnostic obscures the version mismatch. Actual receipt/review readers successfully recover the ordinary run, so this is not corruption or a current execution blocker. A future bounded CLI/help-routing improvement could make the proper reader discoverable without guessing or retries.
2. **Per-run glue is substantial.** This bounded cycle needed a 291-line publication/plan wrapper and hand-assembled observation bindings; structural preview allowed a draft-link continuation problem that independent design review caught. This is operating-friction evidence, not permission to add another runner, change source pins or automate semantic PASS. Future simplification should preserve exact reviewed digests, original denominators, accepted APIs and readable non-success output.
3. **Exit-code interpretation needs care.** A successful persisted INCONCLUSIVE campaign surfaces as `execFile` rejection. The original stdout and actual reader were necessary to distinguish a completed non-PASS run from command infrastructure failure. Preserve that distinction in delivery and any future wrapper work.

No implementation change is requested within this review.

## Pending final evidence gate

Review the fresh actor's actual persisted observations and reader outputs when complete. Remaining search/category/clear clauses and summary plural/singular/empty states must retain achieved/unachieved distinctions; setup for the remaining suffix is not a rerun of the whole campaign. Summary is blocked in the immutable campaign even if later caller observation adds bounded evidence. Staff remains unsupported. Re-verify original receipt and all artifact bytes after continuation.

The completed portion demonstrates a corrected independent-review workflow and actual persisted controlled execution. It remains shared-filesystem open-context synthetic evaluation, not hidden-answer testing, unfamiliar live-product qualification, real human-help resolution, crash recovery, cross-host parity, cloud autonomy or full global-plan acceptance.
