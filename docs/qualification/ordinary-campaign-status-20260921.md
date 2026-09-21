# Ordinary campaign status — 21 September 2026

## Bounded repair

The existing `qa-campaign status` command dispatched every run to the historical
continuation reader, which only accepts `run-v1-*` identities. A real sealed
ordinary campaign therefore failed with `Invalid campaign continuation: explicit
canonical workspace/run required`. Its ordinary evidence reader already worked.
This was a harness readback defect, not a failed or missing product execution.

The owner approved reuse of the existing ordinary reader, continuation/integrity
preservation, regressions and independent Lead AQA review. No second runner,
receipt migration, new approval mechanism or latest-run selection is needed.

The bounded contract keeps explicit `--workspace` and `--run-id`. Continuation
readback remains historical and independent of current models/Kernel. Ordinary
readback is bound to the current public project/graph/catalog/plan; independent
oracle approvals and fresh dependency validation remain mandatory when required.
This does not independently attest registration or grant execution authority.

Status reads do not execute a campaign. A successful read may return exit 0 with
an unchanged `INCONCLUSIVE` or failed receipt; that is not campaign PASS. Missing,
corrupt or stale selected evidence must fail without selecting a different run.
Ordinary historical evidence after model/plan drift may remain unavailable through
this reader; continuation has its existing different historical contract.

From the selected `components/console` checkout, use the existing command:

```sh
npm run qa-campaign -- status --workspace /absolute/registered/workspace --run-id 'EXACT_RUN_ID'
```

The placeholders are caller-supplied existing identities, not a request to create
another workspace or campaign. If the plan references oracle approvals, configure
the existing external private store with `QA_CONSOLE_PRIVATE_ROOT`; dependency
plans also require `QA_STARTER_REPO` to identify the exact paired Kernel checkout.
No such Kernel requirement is added to ordinary nondependency readback or v1
historical status.

## Real retained consumer

The original ordinary campaign was read in a new CLI process, with its owned
fixture server still stopped and without a repeat campaign. Baseline returned
exit 1; the provisional fix returned the original receipt verbatim, including
`INCONCLUSIVE`, with receipt SHA-256
`f6c1a34ff8dfa18bc929a742f90274fd4985beaf8c89c20a7f45616c5658884d`.
All 180 workspace entries retained their content and modes, tree digest
`96f211105f0a3470912e6a4d583a52f1ff55f14f26b90539f02636ef86517014`.
The portable regression lives with the component source; this retained private
fixture is additional actual-consumer evidence, not a clean-clone prerequisite.

## Verification and delivery

The implementation is Console `a09405562533386708673102aa52e88feb18a190`,
followed by tests-only review fixes `94083bf55d3237b6e60870211b034bfbc4b9dcc2`,
both descendants of selected baseline `c421160`.

- TDD: real sealed ordinary `ENV_BLOCKED` fixture failed through the original
  CLI dispatch, then passed with the unchanged non-PASS receipt after repair.
- Initial CLI/continuation/dependency gate: **138/138**, reported by the
  implementer. Its raw output remains in the execution transcript, not a tracked
  log. An earlier invocation without the explicit paired Kernel had six fixture
  location failures; it is not counted as a passing run.
- Coordinator's complementary receipt-ingestion gate: **89/89**. Ordinary and
  positive v1 CLI cases also passed in separate fresh processes, **1/1 each**.
- Independent Lead AQA initially withheld approval because approvals/dependencies
  were tested inside readers, not through the new `status` wiring. The follow-up
  added actual CLI positive/negative authority, stale publication and missing
  run-directory controls. No runtime code was changed in that round.
- Covering follow-up: **3/3 CLI cases** and **2/2 dependency integration cases**,
  zero failures/cancellations/skips. The integration file took 479.2 seconds
  within its unchanged 600-second test budget. Typecheck and diff-check passed.
  Only generated `tsconfig.tsbuildinfo` was restored to the exact baseline.
- Before adoption, canonical source verification passed all four components and
  root packaging passed **61/61**, with zero failures/cancellations/skips.

These are overlapping tool-check scopes, not additive product coverage. Full
Console/Kernel suites, live-product QA, build and cloud qualification are not
claimed. [Scoped Lead AQA re-review](evidence/ordinary-campaign-status-20260921/lead-aqa-final.md)
approved the final source with no unresolved findings. The
[initial review](evidence/ordinary-campaign-status-20260921/lead-aqa-initial.md)
remains retained, not replaced with a retroactive first-pass approval.

Complete-history candidate bundle `console-ordinary-status-94083bf.bundle`:
SHA-256 `3c48b02a3feceff1a87a1ebe826d7b76194e909626fa6d1e5a28387245dd8dd7`,
source tree `355005e4f3eb2f1132d22e996b3de2da8a6f7332`. Independent local
bundle clone/check-out/fsck succeeded without dependency or product-state copies.

Canonical source now selects Console94083bf; Kernel, Freeland and the inactive
reporting reference retain their exact prior pins. Fresh
[source verification](evidence/ordinary-campaign-status-20260921/source-verify.txt)
passed all four components. Canonical [root packaging](evidence/ordinary-campaign-status-20260921/root-gate.txt)
passed **61/61**, 0 failed/cancelled/skipped, in 101.6 seconds. The
[canonical consumer](evidence/ordinary-campaign-status-20260921/consumer-canonical.json)
reads the same original receipt with full equality and unchanged workspace.

A fresh source-only export of staged root tree
`798f697e05b57dc1e73d9992232b3293cce978f8` restored all four bundled components
without dependency, credential or product-state copies. Its independent
[restore](evidence/ordinary-campaign-status-20260921/cold-restore.txt) and
[verification](evidence/ordinary-campaign-status-20260921/cold-verify.txt)
reported the exact selected identities; the
[paired-source controls](evidence/ordinary-campaign-status-20260921/cold-pair.txt)
passed **2/2**. This is portable source restoration, not a remote clone or a cold
runtime-install qualification. Subsequent additions are these retained logs and
delivery documentation, not component/runtime changes.

An independent [source-delivery review](evidence/ordinary-campaign-status-20260921/delivery-review.md)
approved root base `716352063d4c56aff681f31d794de37ab7fa651e` to staged tree
`4fbc2fe3a63acb6c0593fb7aa86a9363ef64b097`, with no findings. It independently
verified source identities and complete bundle history. Final additions preserve
that review and record completion; the approved component bytes remain unchanged.

Retained nonsecret controls: [CLI3/3](evidence/ordinary-campaign-status-20260921/cli-gate.txt),
[dependency2/2](evidence/ordinary-campaign-status-20260921/dependency-gate.txt),
[reader89/89](evidence/ordinary-campaign-status-20260921/receipt-gate.txt),
[original failure](evidence/ordinary-campaign-status-20260921/consumer-before.json)
and [initial repaired consumer](evidence/ordinary-campaign-status-20260921/consumer-candidate.json).
TDD, systematic debugging, subagent-driven implementation and independent Lead
AQA review governed the repair; verification-before-completion required the
original consumer and source-delivery checks rather than relying on the patch alone.

## Deliberate limits

The existing default/environment oracle approval store remains supported; this
slice adds no `status --approval-store` flag. Nonstandard explicit stores that
cannot be resolved through that configuration remain unavailable, never bypassed.
No skills, products, account roles, working campaigns, receipts, tracker entries,
payments, cloud workers or external Git repositories are changed. Freeland PR431
acceptance still has its separate pending two-actor fixture gate.

This closes one measured entry/readback friction point only. P3/P5 still require
an unfamiliar permitted product and the separate ticket/help/mixed-batch exits;
the broader P0–P7 plan is not declared complete.
