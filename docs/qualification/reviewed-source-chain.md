# Reviewed source-chain assembly — 2026-09-10

Integration candidate, not accepted-root promotion or a new product verdict. Root base is `d326eb561dc81bdada5007a3d72f26770b67d40c`. Existing packaging/restore tools are unchanged. Current exact pins, trees and bundle hashes are in [manifest](../../sources/manifest.v1.json).

## What this combines

| Component | New reviewed source | Change and scoped prior evidence |
| --- | --- | --- |
| Kernel | `15a067c9a694de26460102ce5dadb9707c7977b1` | Existing safe private reader exported publicly; implementation unchanged. Public-consumer/private-store24/24 and built-package check. Earlier1701-test result belongs to11d013c, not this successor. |
| Console | `1c5c502c81f080fa0bc336d5df95bd247ab10cb3` | Exact receipt/check/attempt/artifact-bound attributed reviews via existing private store and CLI; current/historical/unavailable binding. Final corrected serialized CLI16/16 satisfied independent review's final condition. Earlier concurrent timeout preserved; no automatic verdict/graph/coverage/tracker promotion. |
| Console | `af832c935a49b3c8dfc49188c37cb77bd94902e6` | Real CLI in a caller-authored loopback interruption fixture;9/9 TAP. Fresh callers preserve unknown outcome without redispatch. Not production recovery or an exactly-once cloud claim; two minor fail-closed startup races remain. |
| Console tip | `f3660d0eed9c442aec974f1b57dcaa6b7a8bcc3b` | Add `totalEventCount` before unchanged100-event retention.4focused RED→GREEN,30adapter tests,152runner/readback compatibility tests, configured-source typecheck. Focused cases overlap adapter total. Legacy traces without count have unknown retention completeness. |

The reviewed Console authority selects the exact Kernel15a067c. The full selected-tip bundles include those ancestors, not unrelated refs. Freeland9c2509e and reporting-reference10d398d are byte-unchanged; reporting remains inactive.

## Qualification for this assembly

Fresh main-executed source gates passed on staged root tree `e064b90f72c782d6fc44ef2fd92c5e9ce45903d8`. It was exported with git archive into an empty normal-Git root, without component directories or node_modules. Its own unchanged entrypoint restored all four components from bundled history, then verified them; both exit0. This is a staged-tree consumer with an unborn root HEAD, not a claimed committed-root clone.

- Own root self-tests:52/52, zero failures/skips/cancellations,37.97seconds.
- Own Console authority module accepts the restored Kernel15a067c and rejects old11d013c; reporting remains inactive; four source skill/reference files equal their Claude mirrors. No distribution build or product execution in this gate.
- Separate independent Lead AQA source inspection verified all four selected object closures and985tracked child entries (bytes/modes), clean exact donor Console/Kernel and unchanged other bundles. Its final documentation review is pending at this checkpoint.
- The earlier baseline rootd326eb5 separately passed sources:verify and52/52self-tests. These are not added to current product coverage.

Raw logs are retained under the private assembly task `source-assembly-20260910.hT28L8`; hashes make their attribution explicit:

| Log | SHA-256 |
| --- | --- |
| cold-restore.log and cold-verify.log, identical summaries | ef7a9bc1f890d67057a3bc8feec6214f8d02eef8336a4b72e8f914fa37e22fa3 |
| cold-tests.tap | f5133b7c69384acb976c4dce43c0f1b88b68b79c24087b00f0832302a910bf6c |
| cold-authority.log | e57d03b202846eb2c39d8a493641fbfc1f1385294e8177e9e2cd3e9a83046dd7 |

Subsequent documentation updates do not reattribute these results to a new root tree. Commit-qualified cold clone/readback remains the next delivery gate. Previous source-slice results above were read from retained reports, not rerun by assembling bundles.

## Evidence and limitations

Detailed existing source reviews and raw logs remain in the private owner task `product-discovery-20260909.SVbw3S`: U3-REPORT, U3-CONSOLE-FINAL-REVIEW, U3-KERNEL-AQA-REVIEW, U5-SOURCE-CHECKPOINT and2026-09-10-CONTINUATION-REPORT. This document retains their scope; private browser/account/runtime state is not copied into delivery.

Agentify's current managed result remains U4, one selected check and20unassessed targets; the old U3 review is historical. Later CUA visual observations are separate and unsealed. Assembly neither reruns the product nor turns these records into whole-product acceptance.

No dependency installation, new browser tool, installed-skill change, tracker write, payment, product deployment, managed registration migration, remote push or cloud setup is part of this packet. Cold source verification is not authenticated browser startup, actual dual-host behavior, production recovery, test-design completeness or readiness for every product.

Next useful work is a new authorized full/ticket/host scope, using current owners and known gaps. Browser backend adoption requires a measured capability improvement with preserved failure/effect/evidence boundaries, not a new top-level QA engine.
