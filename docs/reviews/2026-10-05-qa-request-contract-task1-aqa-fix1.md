# B00/I01 Task 1 — independent affected-scope AQA fix 1

Date: 2026-10-05. Reviewer: independent Astra, not the repair implementer.

## Decision

**GO: Critical 0 / Important 0 / Minor 0 open.** Specification compliance and code-quality readiness both pass for the reviewed Task 1 scope after this repair. I1 from the [initial Task 1 NO-GO](2026-10-05-qa-request-contract-task1-aqa.md) is closed. Task 2 may proceed under the coordinating authorization; this does not itself approve product execution or delivery.

The review checked only the one-line production correction, three appended regression tests and retained repair evidence. The earlier complete Task 1 review remains applicable to unchanged bytes. Neither that NO-GO nor any failed attempt was replaced.

## Exact bytes and delta verification

Root: `/Users/danilsolomin/projectsnew/qa-agent-release-20260926/.local/quality-mcp-clone`; coordinating base remains `8d1870d87479dfbd7ef1998a3d16ef7bb1bed6b6`.

| Reviewed material | SHA-256 |
| --- | --- |
| `skills/qa-check/scripts/request-contract.mjs` | `ec01b4054f5c5e0865ae7df0d7a3b71ad8f8d609f2c91976c0f703d395296aad` |
| `tests/qa-request-contract.test.mjs` | `1756e7e993862ea9a4efde37f5f1a521e28937276df1223c624c633292578b6d` |
| `B00-task1-fix1-report.md` in the ignored SDD workspace | `2698a2bb3eb9261b65e65edfc7a70c9805d4158ccc91ac37b439e0df8117b5b7` |
| `B00-task1-fix1-full-context.diff` in the same workspace | `b4d8ad47e062e78d65751e28231f4fbe72dd3fa7213e05ff5748ed2a9494c845` |

Read the repair report completely and inspected the exact affected delta. A read-only in-memory restoration of the old condition reproduced the previously reviewed production hash `e01f8a8227defbe4d5a067737a4b72284a21604bc75941b33461415678f72dfc`. Hashing the first 196 test lines reproduced the previously reviewed test hash `4cd3ac144fed179db6778b47bc7b029f13da79bdbe620e9e501864fadfab9fa2`. Thus the production difference is exactly the removal of `&& items.length <= 33` at line 137, and the earlier tests are unchanged.

The accepted design `1ff8d16bfb15906262bc35c20db802135547403c59103cd3d668a38a628613e3` and plan `f18f1c1116a04e897b54a37397fa2c98ece502d9f5ad0c45181d67154a7dbfba` were not amended to rationalize the bug.

## I1 closure and regression meaning

The source retains a nonempty request history, incoming/cumulative 32-file limits, sequential IDs, complete source/clause consistency and the existing content/aggregate/JSON limits. No substitute amendment-count ceiling was added.

The added tests at lines 198, 238 and 255 cover:

- 32 one-byte files followed by the first text-only amendment, then request validation and report reopen. Literal expectations retain all 34 items/clauses, the new `clause-34`, original full scope, revision/predecessor and NOT_EVALUATED/unattested/unreconciled report boundaries.
- A no-file history crossing the former ceiling to 34 revisions/items, with literal 171-byte content and unchanged original scope.
- Rejection of 33 incoming files and of a cumulative 33rd file added by amendment, while preserving the original record.

These are behavioral controls through real pure exports, not mock or digest-equality tautologies. They establish the effective 32-file contract, not independent mutation coverage of each redundant guard: removing the incoming-file guard alone could still be caught by the cumulative validator. No such per-guard mutation qualification is claimed by this AQA.

Read the targeted RED: the two healthy controls fail specifically at the old line-137 ceiling while the negative control passes. Read the final retained focused TAP: **16 passed / 0 failed / 0 skipped**, duration 151.547708 ms. The intermediate 15/16 run's literal byte oracle correction is justified independently: 24 + 32 + 18 = 74, not 73; the failed log remains preserved.

All three repair log hashes match the report: RED `536b77d947461490c4d248129d74cc970423836ec1434018582f034724e635ce`; intermediate `73bc71167482985ea41b6f7b265de76e8f49c3e60fd370c45f13bb6510b5fe74`; final `7a46fe77a915a24a7eac48e015e56f6a5e96117b1d7c3c095bd338f98d55beeb`. These are the implementer's retained executions, not a fresh reviewer test run. No known-passing suite was repeated and no new unresolved risk required another probe.

## Limits

Only this follow-up review was written. No implementation/Git mutation, installation, product operation, UI re-review or delegation occurred. Task 1 qualifies pure document behavior only; CLI/persistence/recovery and portable host-consumer work remain subsequent tasks. B00 is not complete, I01 remains bounded/partial, and B01/D01/E00/V01/N01/Q1 remain unaccepted as applicable. No helper test is owner-attested execution or product PASS.
