# Reviewed catalog regression revision — 14 September 2026

Approved bounded repair of the [original local agent cycle](public-agent-cycle-20260914.md)
and its [continuation/graph findings](catalog-continuation-20260914.md). Root base
`ba432ba78a791597163127ed3d4e2e86a98287a2`; selected Console881a93e,
Kernel657894d and Freeland21c1c61 are unchanged. No product, campaign migration,
installed skill, tracker, payment or cloud operation. No new runtime engine.

This is a **parent-authored known-answer regression**, not a new independent
first-attempt agent success. The earlier actor's report, plan, graph and receipt
remain untouched. Preparation still uses the existing controlled registration
helper's deterministic IDs, clock and discovery; it is not full onboarding.

## What changed in executable QA

The portable [recipe](../../evals/public-input-agent-cycle/regression.mts) reuses
the existing Kernel knowledge revision, preview/publication, Console campaign and
actual evidence reader. The [integration test](../../evals/public-input-agent-cycle/regression.test.mts)
creates a new private registration, publishes the reviewed graph/catalog, validates
it and executes the same substantive expectations against healthy and broken
implementations. Only their explicitly selected route/URL differs.

| Check | Healthy fixed | Seeded broken | Meaning |
| --- | --- | --- | --- |
| Baseline items | pass | pass | Exact three-item set |
| Interior substring pP | pass | needs_review | Case-insensitive interior match, not a convenient full-name search |
| Literal punctuation . | pass | needs_review | No item name contains a literal dot |
| Tools category | pass | pass | Hammer only |
| Fruit + pP | pass | needs_review | Discriminating category/search composition: Apple only |
| Tools + pP | pass | needs_review | Empty category/search intersection |
| Clear Fruit final state | pass | pass | Empty query/Fruit ends with Apple and Pear; no intermediate-state claim |
| Clear All final state | pass | pass | Empty query/All ends with all three; no intermediate-state claim |

Exact item count plus item-scoped name membership is asserted without ordering.
The exact phrase `0 results` is no longer an invented requirement. Summary
meaning remains separately assessed; a presence-only summary check would not
satisfy its relational requirement.

Graph publication retains all four target identities, assigns the eight checks
to the surface/search targets and explicitly retains summary/staff as unautomated
scope. Automated coverage explanations now describe planned item checks, not the
stale claim that they have no oracle. Assignment does not mean execution passed.
Generated historical strategy blockers and unresolved graph records remain: the
selected Kernel protects prior strategy blockers and does not provide a safe
semantic migration for every old no-oracle record. This is disclosed residual
metadata, not an excuse to hand-edit managed files or suppress real scope.

The healthy runner verdict remains **NEEDS_HUMAN** because the plan has two
blockers; the broken verdict is **INCONCLUSIVE**. All four needs_review checks
retain two count-mismatch attempts. No automatic bug dossier is manufactured.
These enums do not prevent the agent from completing supported browser diagnosis.

## Negative control and actual verification

Independent Lead AQA design review identified global exact-text membership as a
remaining weakness. A decoy page has one wrong item card and `Apple` elsewhere.
After correcting the decoy's missing HTML response type, the old global-text
oracle actually returned **pass**, failing the regression expectation. Evidence
root suffix `qa-public-agent-OqZaIk`; integration exit1,45.857s. Earlier missing
module, missing paired-Kernel environment and plain-text decoy setup failures are
setup failures, not behavioral RED evidence.

Minimal change: scope exact name membership to `[data-testid="item"]`. Same
decoy then returned oracle_failure; trace confirms the fifth assertion (item
membership) failed with zero matches after URL, input, category and total count
passed. First complete corrected integration passed1/1,47.135s; strict TypeScript
check passed. An additional assertion now verifies this exact failure location,
so an unrelated URL/action error cannot satisfy the control.

First corrected evidence root suffix `qa-public-agent-8tC8Pm`:

- Healthy plan canonical digest: `sha256:3ee7094d6f73eb2b2e7e0b3652724c5e872d7eb83ae766616febf1c187c90438`.
- Broken plan canonical digest: `sha256:3cdf1bf5fdb8e204125c84d90cfedb4f0cf86cb3428c9657e2236e08518904e7`.
- Graph semantic digest: `sha256:82b70d2d2588e054b8c6e058f66440acb4f6c0f676d5329ba769340f8b48436f`.
- Healthy receipt bytes SHA256: `aba227e2ef61b04bfbed4c63ac8d13eb1f490a22515a574deb9066d7bb95f571`.
- Broken receipt bytes SHA256: `aabdf67de407648a0e785b2afc2115f5ad29a3caddabeea5db8d636a1cd919d6`.

Final test source, including the exact decoy-failure-location assertion, passed
1/1 in46.031s (no fail/skip/cancel); strict TypeScript passed again. Retained root
suffix `qa-public-agent-1WIvEk`; healthy plan
`sha256:c938b7083ffd162d1714ebf575f5897dc0a3a9b19bd1a801f1baab60fac0c64d`,
broken plan `sha256:cbde2ca087fa66a94a6100f730abf4799195cdb510a2d0e2df5c8242ac889358`.

Final independent Lead AQA review: **APPROVED**, no open critical/important/minor
finding. Reviewer called the actual final evidence reader (receipt
`sha256:9b03a3c6c8dcf2af5d3f4c3b67b3ac6d92c9095c82b3a51c54cfb96a53248f70`,
8 checks/2 blockers/36 broken-run artifacts), checked all60 healthy/broken artifact
byte sizes and hashes, published mappings and RED/GREEN decoy traces. This is
independent evidence inspection, not independent replay of the CUA lane.

Isolated-root source verification passed for all four pinned components;
packaging59/59 passed (30.471s, no fail/skip/cancel). These are delivery controls,
not additional product coverage. No component bytes changed in this repair.

Receipts were loaded by the actual `readLatestCampaignEvidence`, not just parsed
as JSON. Their canonical receipt digest matched the returned runtime receipt.
The healthy receipt stayed byte-identical after the broken run. Temp origins and
run IDs naturally differ on a new execution; replay instructions are portable
in the [eval README](../../evals/public-input-agent-cycle/README.md), not dependent
on these original-machine artifact paths.

## Agent-led work that the declarative runner does not prove

Root separately used CUA on another instance of the same verified owned fixture,
in one tab with an observation after each meaningful action. Healthy Fruit2 →
pP1 → clear2 and All → dot0 → clear3 were observed; the category was retained.
`No results` correctly described zero items. Broken search failed the preceding
narrowed/empty state, so its final empty-query screen was not credited as
successful recovery. The observed summaries agreed with displayed items even
where filtering itself was wrong.

[Timestamped selected observations](../../evals/public-input-agent-cycle/20260914/regression-agent-observations.md)
are explicitly agent-authored/unsealed, using the current skill's report fallback.
Kernel657 has no `recordAgentToolObservation` writer; the historical reporting
source was not activated. New captures are not inserted into the original sealed
artifact inventory through `record-review`. Staff remains untested for a real
access/authority gap. No human was asked to perform the supported public checks.

## Qualification boundary and next step

The approved slice repairs a concrete oracle, discriminating test design and
graph assignment, with actual publication/execution/readback and a negative
control. It does **not** establish universal coverage, dependency-based selection,
fresh blind competence, completed Stage2, interrupted-process recovery, dual-host
operation or cloud readiness.

Next global work is Stage3's actual interruption → fresh process → remaining-only
execution. Existing terminal readers ignore unsealed runs and ordinary execution
starts every check anew. That needs a separately reviewed bounded continuation
contract across the existing runner/reader/CLI and Kernel run-file grammar.
Retain completed attempts and uncertainty; do not invent a second runner or treat
the already-proven completed-campaign reader as crash recovery.
