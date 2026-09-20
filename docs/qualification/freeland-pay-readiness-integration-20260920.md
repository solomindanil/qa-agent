<!-- QA_LOCAL_HISTORY_20260920 -->
> Historical record retained during local consolidation on 20 September 2026. Status, approvals, pauses, source paths and next actions below belong to the original dated scope; they are not current instructions, new test results or execution authority. Use the [current checkpoint](current.md) and [consolidation index](local-consolidation-20260920.md). Private/absolute historical evidence links are optional locators, not clone prerequisites. Original body bytes are preserved below.
<!-- /QA_LOCAL_HISTORY_20260920 -->

# Freeland PAY01 / readiness integration — 20 September 2026

## Status

Source integration candidate only. **Not manifest-selected, not a product verdict.** Independent fresh-context Lead AQA [review](evidence/freeland-pay-readiness-20260920/review.md) passed spec compliance and code quality with no source findings; it did not rerun the tests. Canonical Freeland remains `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`; existing campaigns keep their frozen runtime.

The reviewed PAY01 repair `510e08a38565e8f8074d36d5f8eaa62d9d93bd7b` was integrated into committed readiness lineage `aa1d0ae5a126e508ed796eb29d4c7488cd6bcf35`, producing `064410869c2e63a4b7c23cc3753c717a337f8a3a` (tree `ac2348210a1f7e7f86475c037b03d7d27ae3c438`). Only five files changed against the readiness base; its dirty private graph was not imported.

## Portable source

- [Complete-history candidate bundle](../../sources/candidates/freeland-pay-readiness-0644108.bundle).
- Bundle SHA256: `47e3ad82eb9266623f386eb7b8ed4f952b02b82d2ddcf20804d31bfddd57054a`.
- Bundle verification, independent bundle-only clone, `git fsck --full`, exact HEAD and provenance verification passed. The cold clone has no `node_modules` or Git alternates. This proves source delivery, not dependency provisioning or a full cold test run.
- Candidate source provenance: VALID; 274 Git rows, 128 assembled rows, 80 private rows.

## Change and evidence

PAY01 v2 compares recorded API/DOM method identities, card/SBP action and currency, distinct balance identities, crypto currency mapping, duplicates and missing/unbound methods. Its declaration is shadow-only with `promotionEligible:false`; its historical receipt authority was removed. Sixteen other bindings and nine historical receipt files are preserved. Seven other historically qualified bindings remain stale and authority-free; this repair does not requalify them.

| Check | Result | Evidence |
| --- | --- | --- |
| Actual old-v1 implementation with new assertions | 68 passed / 28 failed | [RED log](evidence/freeland-pay-readiness-20260920/freeland-integration-red-old-v1.log) |
| Combined oracle, registry and provenance controls | 160/160 passed | [Final log](evidence/freeland-pay-readiness-20260920/freeland-integration-final-verification.log) |
| Existing readiness / DOM / quote fixture controls | 131/131 passed | [Readiness log](evidence/freeland-pay-readiness-20260920/freeland-integration-main-readiness-131.log) |
| Non-PAY01 bindings and historical receipts | Unchanged | [Invariant check](evidence/freeland-pay-readiness-20260920/freeland-integration-invariants.log) |
| Strict registry / explicit stale tolerance | Strict rejection retained; seven stale receipts have no authority | [Registry check](evidence/freeland-pay-readiness-20260920/freeland-integration-registry-source-state.log) |
| Current source-only CI command without dependencies | FAIL before assertions: missing TypeScript | [CI reproduction](evidence/freeland-pay-readiness-20260920/freeland-source-ci-red.log) |

TypeScript `--noEmit` exited 0 in the dependency-provisioned candidate. Local controls used an ordinary existing dependency-directory copy after matching lockfile SHA256 `704a0b43e1cd9d4e9c9e6c3cd4417f649b8550ad864c29f63a665f95992e9a45`; no installation or network provisioning occurred. This is not fresh dependency-byte attestation. Browser fixtures intercepted page requests with local responses/abort; no live product campaign was run. Environment scrubbing is not an OS-level network isolation claim.

## Adoption blocker and next action

The retained PAY07 real-projection controls import TypeScript at module load. The current source-only workflow invokes that module without installing dependencies. Adopting this candidate unchanged would therefore break that workflow.

Proposed bounded follow-up, awaiting the user's design confirmation: extract the existing dependency-free PAY01 controls into their own file, retain all dependency-backed controls, update the source-only CI target and its contract tests, refresh owned provenance and review the exact successor. Do not add dependency installation to source-only CI or weaken assertions to force a green result.

No manifest change until that seam and independent review are resolved. No product requests, payment, provider action, Flow/Buzz write, deployment, installed-skill change, push or cloud work follows this candidate. Recorded method correspondence does not prove tile visibility, click-handler execution, live payment correctness, product coverage or release GO. P1's non-fixture consumer and the wider P2–P7 plan remain open.
