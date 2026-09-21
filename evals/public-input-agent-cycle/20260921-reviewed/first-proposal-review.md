# Independent Lead AQA — first proposal review

Decision: **NEEDS FIXES — not approved for managed publication or campaign execution.**

Reviewed 21 September 2026. This review concerns the first frozen actor proposal for the owned loopback exercise, not live-product readiness. No campaign/publication, product request, fixture-source inspection, old-answer report inspection, source edit, or actor-artifact edit was performed. Review is independent; fixes remain with the actor/coordinator.

## Exact reviewed bytes

Files below are in `/private/var/folders/wb/zqtxc1qs7sqgspnt3vwlmr640000gn/T/qa-public-agent-F78BwN/`. The four copies in `reviewed-cycle/first-proposal/` have matching SHA-256 hashes.

| File | SHA-256 |
| --- | --- |
| `phase1-proposed-qa-campaign.v0.json` | `2a11ce1edf2c4aa3366f0ea1a780152b0156bb8dccfee42b1146888fdb55ed80` |
| `phase1-publication-and-execution.mts` | `05a443ada9f66eae3622e93157c2e536b0faba7d506b7674dbece66c2c64c31a` |
| `phase1-test-design-report.md` | `cbeadff81d08f7e8eb045c20363ed48a3600807fcfa37596e52a7bc2a334c88b` |
| `phase1-checkpoint.md` | `16c98d4a050580ec4df9c6f39fa20ee5885f4a41aac908b9dfd6f9980b97ad44` |

Selected source remains Console c421160 / Kernel aa5d2d1. An independent, offline parse with the selected `QaCampaignPlanV0Schema` succeeded: 3 browser checks, 1 blocker, assertion counts 15/4/10, 5 absence windows. This is schema evidence only. Publication preview success and proposal digests in the checkpoint are actor-reported, not a reviewer-run campaign or publication.

## Required findings

### R1 — P1: Exact summary copy is an unsupported oracle, not numeric agreement

Locations: plan lines 43–50, 74–81, 133–139, 233–239, 352–358; report lines 27, 33–40; checkpoint line 41. The selected adapter compares text by strict `actual === assertion.value` (`components/console/src/node/playwright-campaign-adapter.ts`, lines 722–724).

The assertions require exactly `1 result`, `0 results`, and `2 results`. The brief promises agreement with displayed items, not those strings. The report's “operational witness, not a new product promise” label does not change executable semantics. Indeed the report records `3 results` and `2 results` but offers no observed singular or empty wording. A healthy state with one displayed item and `1 item found`, or zero items and `No matching items`, meets the brief and fails this plan. Those are logical healthy counterexamples, not claims about unseen fixture implementation. A full sentence that contradicts the item set must also not be accepted simply because one token or numeral agrees.

Required evidence for closure: revised exact assertions/expectations and lane accounting that accept supported complete meanings without inventing a wording requirement or permissive string classifier. If the declarative adapter cannot establish a semantic clause, keep that clause explicitly unassessed and cover it through the separately attributed observation lane where authorized. Demonstrate that healthy singular/empty paraphrases are not classified as product defects, and that contradictory complete meaning is not silently accepted. Preserve this original failed design and all corresponding hashes.

### R2 — P1: Draft verifies edges prevent the planned current observation continuation

Location: publication script lines 97–113, specifically line 109 (`reviewStatus: "draft"`). All three newly authored public check-to-target relationships are draft. Kernel `src/kernel/agent-tool-observation.ts`, lines 363–373, requires `edge.kind === "verifies"` and `edge.reviewStatus === "reviewed"` for a current observation binding; otherwise it rejects the relationship. The initial graph had no alternate verifies edges.

The proposed publication can therefore support the campaign catalog while leaving all three public checks unusable by the required accepted observation writer. A later knowledge publication to repair the edges would change graph/publication/strategy identity after the frozen campaign, complicating the intended unchanged-receipt/current-observation continuation. A preview/schema success does not validate observation readiness.

Required evidence for closure: a reviewed publication proposal whose current exact graph relationships satisfy the actual observation contract, justified by the independent review rather than fabricated approval. Show binding readiness for the intended public observation check/target/oracle/publication/strategy before initial apply. Retain the staff gap and do not promote observation results into the campaign verdict. No runtime change or inactive Kernel is warranted.

### R3 — P2: Compound visible-controls expectation exceeds actual assertions

Locations: plan lines 289–312 and 369; report line 35. The surface expectation says both Search and Category are visible, but terminal assertions check Search visibility and Category's value only. Selecting Category earlier establishes an action on it, not that it remains visible in the resulting state. A control hidden after selection can retain value `tools` and satisfy these assertions while contradicting the stored expected behavior.

Required evidence for closure: either evidence for the supported visibility clause at the claimed boundary, or an honestly narrowed expectation/report with the remainder explicitly unassessed. Review every compound clause under the same rule. Do not label the whole target verified from a proper subset of its expectation.

### R4 — P2: Search examples do not discriminate the declared substring/literal semantics

Locations: plan lines 155–163 and 255–263; report lines 18 and 33; title at plan line 205. `HAM` is a prefix of Hammer. The second probe is simply absent. A case-insensitive prefix-only implementation passes both selected probes while violating the name-substring requirement. These inputs likewise do not discriminate literal matching from pattern interpretation. This does not make the expectation for `HAM` incorrect; it makes the “all declared clauses” coverage description too broad.

Required evidence for closure: a bounded, sourced design that discriminates the material internal-substring/literal behavior, or explicit unresolved/unassessed accounting for those semantic cases. Use only rendered public witnesses and the brief; no fixture internals, invented inventory, or generalized all-input correctness claim is required. Preserve the useful existing category/clear scenario and all four original target obligations.

## Positive findings and bounded acceptance conditions

- The original four targets and four catalog checks are retained: three executable public checks and the exact staff target/check blocked. Staff recovery remains scoped; public work is independent. The lack of a staff surface is an artificial exercise gap, not proof of a human-help integration.
- Category composition, clearing only the text restriction, retained `fruit` value, restored Apple/Pear and excluded Hammer are concretely represented at correct same-session boundaries. They are intended assertions, not yet executed evidence.
- Public literal fill/select/clear operations, origin, side-effect class and candidate scope are compatible with c421160. No sort assertion, login, mutation, credentials, additional origin, tracker or custom PASS engine appears.
- The authored graph preserves prior nodes and adds non-target check nodes/links; prior target IDs and catalog mappings match the first registration. Exact expected behavior strings match the script's catalog definitions. Resolved oracles do not fabricate `oracleBasis`.
- Publication uses accepted build/preview/apply/validation and guarded new-plan writer APIs. Publish arguments bind fresh plan and publication preview digests. The execute wrapper checks current canonical plan digest before the existing CLI validation/run. Approved source/plan bytes must remain frozen under one owner through execution; the wrapper's HEAD-only check is not working-tree integrity evidence, and no generic cross-process approval-race guarantee is claimed.
- Retaining the four predecessor discovery blockers is compatible with the accepted Kernel transition rule (`src/kernel/knowledge-revision.ts`, lines 90–93). Their presence is documented. This does not mean four current executable blockers or four verified requirements; distinguish campaign blocker accounting, generic discovery metadata and actual execution results.
- Original source/UI tooling errors and the first proposal-preview corrections are disclosed in the checkpoint. Design-time observations are correctly kept separate from sealed campaign evidence and unknown product identity remains unknown.

## Additional report/evidence corrections

- Report line 40 says there are two one-second absence windows; the exact plan contains five (two in the compound journey, one empty probe, two Tools exclusions). Correct the count in the revised report; no budget should be tuned after failure.
- `no_console_errors` and desktop overflow are useful bounded observations, but the brief supplies no explicit zero-console-error/no-overflow acceptance rule. Treat these as declared investigation/hygiene criteria or provide their authority; do not silently classify any diagnostic failure as violation of the catalog's sourced business contract.
- The selected adapter stops at the first failed assertion. For this first check, a failed search item count at assertion index 1 leaves Hammer visibility, summary, category selection and clear entirely unexecuted; even later assertions at the same boundary are unassessed. Both attempts repeat the failing prefix, not the omitted suffix. Persist the precise prefix/suffix and use remaining-scope continuation rather than report all compound clauses failed or passed.
- `publish` writes the registration before the canonical plan and prints validation rather than making the two operations transactional. If a later write/validation fails, reconcile actual publication and plan state before any retry; do not rerun a fresh proposal blindly. No such failure has been observed in this review.

## Next gate

Actor/coordinator may prepare a bounded revision; this reviewer has not implemented one. Preserve these exact first-proposal files and the rejected design result. Re-review changed plan, script, report, checkpoint and regenerated graph/plan/preview digests before any managed apply/run. Controller healthy countercontrols, if separately authorized, remain evaluator evidence and cannot rescue an unsourced oracle by teaching the actor fixture-specific copy.

This is an open-context owned synthetic workflow evaluation. Even a corrected reviewed cycle cannot establish first-attempt independent oracle reliability, unfamiliar real-product qualification, full global-plan completion, hidden-key benchmark success or universal readiness.
