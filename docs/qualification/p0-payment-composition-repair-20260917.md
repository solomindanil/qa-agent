<!-- QA_LOCAL_HISTORY_20260920 -->
> Historical record retained during local consolidation on 20 September 2026. Status, approvals, pauses, source paths and next actions below belong to the original dated scope; they are not current instructions, new test results or execution authority. Use the [current checkpoint](current.md) and [consolidation index](local-consolidation-20260920.md). Private/absolute historical evidence links are optional locators, not clone prerequisites. Original body bytes are preserved below.
<!-- /QA_LOCAL_HISTORY_20260920 -->

# P0.3: payment-method correspondence repair — 17 September 2026

Status: independently reviewed, cold-restored source candidate. Not selected in the manifest, not installed, not pushed and not a live product verdict. This record and its portable delivery are currently working-tree additions.

## Portable source

- Base: `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`.
- Candidate: `510e08a38565e8f8074d36d5f8eaa62d9d93bd7b`.
- [Complete-history bundle](../../sources/candidates/freeland-p0-pay-composition-510e08a.bundle), SHA-256 `0fcde7d97b90d2a559c91fa48d49b290cc19723239fe4da8ac3c55b6f84e12da`.
- Bundle verification confirms complete history and the candidate HEAD. Main restored it to a new independent directory using only this repository file. No dependencies were installed or borrowed. Node version: `v22.23.1`.

Five changed files: `tools/freeland-replacements/tc-pay-01-oracle.mjs`, `tests/product-graph/freeland-smoke-u0-oracles.test.mjs`, `config/freeland/manual-replacements.v1.json`, `tests/product-graph/freeland-manual-replacements.test.mjs`, and their owning `provenance/source-manifest.v1.json` rows. No product source, runtime collector, installed skill, campaign or payment changed.

## Defect and correction

The actual selected v1 oracle accepted an empty or balance-only payment sheet when the API advertised other methods. Candidate v2 checks method identities, cardinality, supported currencies/actions and corresponding recorded DOM identities. It rejects missing, duplicate, unknown, contradictory or ambiguously mapped methods. It preserves healthy row reordering, the supported card aliases, distinct wallet/Freeland balances and optional unavailable crypto rails. Null or negative fixture balance explicitly blocks the check.

These are structural assertions over the existing observation. They do **not** newly prove tile visibility, click execution, label semantics or real payment success. Observation schema remains v1, every outcome remains `promotionEligible:false`, and collector/semantic improvements remain P2 work.

## Fresh evidence retained in this repository

| Gate | Actual result |
| --- | --- |
| Main actual v1/v2 comparison, 16 inputs | 11 faulty compositions/actions: old shadow-pass → new shadow-fail; 2 unverifiable balances: old shadow-pass → blocked; 3 healthy controls remain shadow-pass |
| Cold-restored pure oracle file | Exit 0; 68/68, no failures/cancellations/skips |
| Cold-restored four named registry/projection tests | Exit 0; 4/4, no failures/cancellations/skips |
| Cold-restored provenance verifier | VALID; 8 sources, 277 Git files, 125 assembled files, 59 private files |
| Cold-restored diff check and worktree | Exit 0; clean |
| Independent Lead AQA exact five-file review | Spec compliant; quality approved; no actionable source findings |

Retained raw outputs: [16 before/after comparisons](evidence/p0-pay-composition-20260917/main-comparison.log), [68-test cold run](evidence/p0-pay-composition-20260917/p0-3-cold-oracle.log), [four-test cold run](evidence/p0-pay-composition-20260917/p0-3-cold-registry.log).

Commands from the restored candidate:

```sh
node --test tests/product-graph/freeland-smoke-u0-oracles.test.mjs
node --test --test-name-pattern='builds and validates the seventeen-binding|emits a computed projection|scoped stale-receipt tolerance|staticOracleVersion' tests/product-graph/freeland-manual-replacements.test.mjs
node tools/freeland-main/provenance.mjs --verify .
git diff --check
git status --porcelain=v1
```

The 68 tests are the focused file's count, not 68 newly created cases. Four named tests are not the whole registry suite. Initial full `qa:verify` could not run without dependencies; full component qualification remains open. The original implementer's RED/GREEN outputs were retained only in tool transcripts and transcribed report counts, not standalone raw files. The fresh evidence above must not be presented as that original TDD chronology.

## Old acceptance is not renewed

PAY01's binding now has oracle version 2, state `shadow`, and no historical receipt reference. The other 16 bindings are unchanged. Seven other existing qualified bindings already have stale receipts on the selected base; scoped test tolerance diagnoses this known condition and does not qualify them. Strict whole-registry resolution therefore remains stale, rather than silently gaining a pass.

- Oracle digest: `sha256:62c639b190f5a8f19d99f23cc06a43b7f0b7e181d3c6675d53601ce3923b692c`.
- Binding digest: `sha256:efaa079be2bb3c734fa2da84a1144d4ed60bd45edf6e247518f7fcf9ddee5bc6`.
- Historical PAY01 receipt bytes remain unchanged; SHA-256 `f772ffd38cea498d9507c0166a0123d99e2f320c02e3ce5d32c1ab2bfc9502c2`.

Source adoption requires a separate reviewed integration. Preserve the existing [readiness/selected-quote repair](freeland-harness-readiness-repair-20260917.md); its shared test file must not be overwritten with this candidate's whole file. The old sealed product verdict and remaining coverage are unchanged.

## Next bounded work

P0.2 findings-write containment remains pending its explicitly requested isolated dependency install. Safe command/CI work has an audit, not an implementation. P1 agent-observation persistence has a reviewed design, not runtime code. Neither this candidate nor the [Console authority candidate](p0-authority-repair-20260917.md) completes P0 or qualifies cloud execution.
