# Freeland source consolidation and CI boundary — 20 September 2026

## Status

**Canonical source adopted** in local root commit `2e546fb73444c6d9d0e41f53abd8c00d13340c9e`. Its tree is identical to independently approved candidate `c17410ffcff1d2c5c38b25cc6eb37a9c01bc5457`. No push, active campaign or installed-skill migration occurred. This source update is not product acceptance or release GO.

Selected Freeland successor in this candidate:

- Commit `d4754f7ddbcb8183f695f479ef21aa7728c1ace0`, tree `2fffdb008347b3337a5b58eea8f3cda8889d584c`.
- [Complete-history bundle](../../sources/candidates/freeland-pay-readiness-d4754f7.bundle), SHA256 `9195aeea5c0995ca937876e8b7e569a1e3cbe6700147e32f67779781620651f0`.
- Lineage: previous selected `3ee1cb3` → committed readiness `aa1d0ae` → PAY01 composition integration `0644108` → test-boundary successor `d4754f7`.
- Kernel `aa5d2d1`, Console `48e4628` and inactive reporting reference `10d398d` unchanged.

## What changed

The reviewed PAY01 API/DOM composition repair is retained with readiness/payment-projection improvements from the committed owner lineage. PAY01 v2 remains shadow-only: its old receipt reference was removed, not renewed. Sixteen other binding declarations and nine historical receipt files remain unchanged by the PAY01 integration. Seven other qualified declarations still have stale receipts and no current receipt authority. Strict registry reads remain fail-closed.

The CI correction changes no oracle, schema, receipt or product behavior. It moves 36 existing PAY01 behavioral tests into a dependency-free file and leaves 60 mixed smoke tests, including real PAY07 TypeScript projection and shared registry contracts, in the old file. All 96 tests retain their names and multiplicities. Existing product-graph globs execute both files. Provenance gains only the extracted test row plus necessary final-byte seals and owning list/count expectations.

Source-only CI now explicitly runs **PAY01 composition only**, not the entire mixed smoke file. Its other restore, verify, root-test and provenance steps, permissions, environment reduction and no-install boundary are unchanged. Dependency-backed tests remain in ordinary local qualification; they are not silently claimed to run in source-only CI. [Exact workflow boundary](safe-gate.md).

## Executed evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Old no-dependency mixed smoke command | Failed before assertions: missing TypeScript | [Original failure](evidence/freeland-source-adoption-20260920/freeland-source-ci-red.log) |
| CI command contract before/after workflow update | RED 1/2 → GREEN 2/2 | [RED](evidence/freeland-source-adoption-20260920/ci-root-contract-red.log), [GREEN](evidence/freeland-source-adoption-20260920/ci-root-contract-green.log) |
| Split smoke + registry + provenance on d4754f7 | 160/160, zero skips; provenance VALID 274/129/80 | [Final component gate](evidence/freeland-source-adoption-20260920/freeland-ci-boundary-final-precommit.log) |
| Test preservation | 96 before = 36 extracted + 60 retained; same title multiplicities | [Conservation](evidence/freeland-source-adoption-20260920/freeland-ci-boundary-conservation.log) |
| Independent d4754f7 clone without dependencies | PAY01 36/36, clean, no node_modules | [Cold component gate](evidence/freeland-source-adoption-20260920/freeland-ci-boundary-cold.log) |
| Actual five source-only shell steps from candidate workflow in independent root clone | Restore/verify all four exact pins; root61/61; provenance VALID; PAY01 36/36; clean, no node_modules | [Cold workflow output](evidence/freeland-source-adoption-20260920/ci-cold-workflow.log) |
| Canonical root after exact transfer | Root61/61; source verification all four pins; purePAY01 36/36 and provenance VALID | [Fresh root output](evidence/freeland-source-adoption-20260920/ci-main-final-tests.log) |
| Retained readiness/DOM consumers, prior integration stage | 131/131; these files and dependencies are unchanged by d4754f7 | [Readiness output](evidence/freeland-source-adoption-20260920/freeland-integration-main-readiness-131.log) |

The prior integration also passed TypeScript noEmit. Dependency-backed local tests used an existing ordinary dependency-directory copy, not a new dependency installation or clean dependency attestation. Bundle closure and isolated exact source verification passed. The actual five shell steps from `.github/workflows/qa-source.yml` passed locally in an independent cold clone at root `170bc02b091cb2195d1e768b985f21daa580c142`, using their declared reduced environment and working directories. Checkout/setup-node hosted actions were not executed: this is a local workflow-body check, not a hosted CI run or OS-level egress-isolation proof. Later candidate commits changed only documentation/evidence; final review approved through c17410f.

## Reviews and limits

- [Final whole-delivery review](evidence/freeland-source-adoption-20260920/ci-delivery-final-review.md): independent Lead AQA/source-delivery review approved through c17410f with no findings. Main transferred exactly the 21 reviewed path blobs and verified identical committed tree. Three entry files retained their unrelated working-copy changes through narrow edits and exact reviewed-blob staging; all 43 other pre-existing dirty paths retained their hashes. Old Freeland3ee source is preserved by a local ref and its previous committed bundle. Raw evidence whitespace is retained; source/config diff checks exclude raw copied evidence rather than normalize it.
- [Integration review](evidence/freeland-source-adoption-20260920/freeland-integration-review.md): independent fresh-context Lead AQA approved exact aa1→064 five-file integration. It reviewed recorded tests rather than rerunning them.
- [Component implementation and test details](evidence/freeland-source-adoption-20260920/freeland-ci-boundary-report.md): exact four-path boundary follow-up; independent fresh-context Lead AQA [review](evidence/freeland-source-adoption-20260920/freeland-ci-boundary-review.md) approved with no findings.
- Historical full readiness and product runs are not reattributed to this new source. No fresh staging/product suite, payment, provider request, financial disposition, Flow/Buzz write, deploy, push, installed-skill update or cloud run occurred.
- Recorded method correspondence is not proof of per-tile visibility, click execution or live payment correctness. No product coverage debt or stale acceptance is closed by packaging.
- The frozen owner runtime, including its dirty private graph, is untouched. Existing campaigns require their own deliberate successor selection and fresh identity-bound evidence.

Next global work after delivery: the separately scoped P1 real consumer, then P2 semantic execution and subsequent plan slices. This change does not declare P1–P7 complete.
