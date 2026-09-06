# Ticket reasoning — fresh-context evaluation and live inventory

2026-09-07. This qualifies selected agent decisions using the existing source instructions, not a new classifier, release engine or tracker SDK. It does not close the full G2 milestone.

## Independent evaluation

Claude prepared seven explicitly synthetic tickets across Freeland, MagicCard and Nuanu, in three tracker pages. A fresh Codex agent received only the inputs and current instructions, not the generator, author's decisions or answer key. A separate fresh agent assessed only the two Nuanu cases through Starter instructions. Lead AQA then compared both results with the actual inputs and design intent.

| Evidence situation | Fresh agent decision |
| --- | --- |
| Old fix evidence, different candidate | Current candidate unassessed |
| Exact original path, expected effect and dependent readback | Fixed only for the supplied ticket scope |
| Green neighboring test with different balance precondition | Ticket remains unassessed |
| Approved request still stuck, no completion | Defect reproduced with identity/storage limits |
| Duplicate on the last tracker page | Retained in the denominator, related to the evidenced original; no second independently proven defect |
| Two assertions before page hydration | Harness timing confound, not a confirmed product defect |
| API passes but UI requirement is unresolved | API result retained; UI claim remains unassessed |

All seven items and all three pages were accounted for. The Starter-only evaluation independently reached the same evidence classes for its two items. Lead AQA found no material reasoning gap. Different defensible vocabulary for a duplicate was not treated as an error: linked evidence and a separate reproduction are different claims.

No instruction change was needed. There is no measured improvement claim over a prior version and no statistical reliability estimate from this small set. Missing referenced screenshots/network files were not represented as inspected artifacts. Synthetic results are not evidence about real ticket existence, deployment or product behavior.

## First live inventory step

The coordinator used the current official Nuanu Flow plugin read gateway and freshly resolved project/state descriptors. The Freeland QA query had no cycle filter and returned exactly two tickets, FREEL-398 and FREEL-426, with one page and `next_page_results=false`. The API returned a nonempty `next_cursor`; that string alone does not mean a next page exists. Both tickets' descriptions, comments, relation/link lists and attachment metadata were read. Attachment bodies and external links were not opened.

Read-only staging identity returned HTTP 200 and `releaseSha=2981985e6eaebddbdb1b6691a261bc7e9369bcaa`. The assembled Freeland checkout's existing sprint preflight correctly refused generation-based assessment: `SPRINT_EVIDENCE_NOT_GENERATION_BOUND`, `pointer: missing`. No old generation was imported, no outbox was created, no ticket state/comment was changed and no product behavior was claimed fixed. The missing private campaign pointer is an execution prerequisite, not a diagnosed product bug.

The saved graph was older than that deployment and did not express all notification/referral/cache-recovery acceptance branches. The agent retained those gaps instead of inferring coverage from nearby checks. The next step is owner-coordinated fresh candidate/generation and the original reproduction paths; a successful tracker read alone cannot close G2.

## Evidence

| Artifact | SHA-256 |
| --- | --- |
| Claude fixture report | `c9b7b8f121ae1f4afd4506d6a902c4fbaf42d744ed2632d9b3578c3746508255` |
| Fresh mixed-ticket report | `e82bbb6cd1e7a9c2e488fe65dc66d31b2e183ab578159a3a480b01bd1b69cfcd` |
| Fresh mixed-ticket read log | `2d92df183bf8b88cd87b0b995b9515b89b85bcd90809e80d9f7b7a5692bda00f` |
| Fresh Starter-only decisions | `d08d4f43a3f211a41d2f2ca28ea17e35fb11790421e0344d916978160bb20da8` |
| Independent Lead AQA adjudication | `39e9c671fbefa8b500ca31ad1938c6fe479d57b2b6ead4b7fd93f7b2e8b174a3` |
| Live saved-snapshot contracts | `08cbb150acef223c669248fd92da7b83fffb1818d59d82f0c103d20a0e1ab807` |

Coordinator checked the fixture's 60-file SHA manifest, including its separate 51-file input manifest. Private raw Flow responses and the contract report are retained at the coordinator root's `.local/qualification/g2-live-flow.GOMve6/`; source actor IDs and provider/account details are not copied into this public-facing summary. No new live campaign, payment, tracker write or permission was created by this evaluation.
