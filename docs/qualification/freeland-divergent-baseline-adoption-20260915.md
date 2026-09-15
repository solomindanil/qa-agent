# Freeland divergent-baseline source adoption — 15 September 2026

The owner approved packaging and selecting the independently reviewed QA-H003
repair. Root base before adoption is
`fab1e5fcc3f26560ada9348245cb21a8ea2c7308`. Only the Freeland source selector
changes: `21c1c617a2dbe5d1131215dc738dba2556851ae3` to
`3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`, tree
`52e0e23be1ad6413fd8bb549ce7f043b2b0fa07b`. Kernel185d3e7,
Console66ac7db and inactive reporting10d398d remain exact. No existing campaign,
account, registration or installed skill is migrated.

## Qualified behavior

The ten-file Freeland change retains strict schema-V1 ancestry and schema-V2
merge-wrapper behavior and adds one fail-closed schema-V3 authority for a real
single-merge-base divergence:

- `relationship: "divergent_exact_trees"` binds the exact production,
  candidate and unique merge-base commit/tree identities. Its strict key set
  excludes the V2-only `baselineParentShas` field, and the merge base must differ
  from both endpoints.
- Planning continues to diff the production tree directly to the candidate tree,
  including production-only deletions. The merge base is proof context, not a
  substitute baseline.
- V3 is accepted only for an explicitly requested `mode: "full"`. Any other
  mode, including `impacted`, fails with
  `DIVERGENT_BASELINE_REQUIRES_FULL_MODE` before replacing the prior campaign.
  Full mode retains all mandatory automated, manual, product-CI and mobile sets.
- Plan schema V7 and release-verdict contract `freeland-release-verdict-v0.7.2-shadow`
  bind these rules. Stored field forgery, tree mismatch, drift, tampering,
  equality/reversed ancestry, unrelated histories and multiple merge bases stay
  rejected. V1/V2 compatibility tests remain green.

This repairs source authority and planning for the observed topology. It does
not weaken coverage selection into a guessed narrow plan and does not add a new
runner, CLI, permissions path, product schema or verdict engine.

## Source qualification and review

The clean selected commit passed its owning `npm run qa:verify:all`: **2786/2786**
tests,0 failed/skipped/cancelled. The seven TAP groups were427 main/launcher,
1428 graph/verdict,658 replacements,70 staging transport,23 bound private-corpus
unit,115 bound browser-transport and65 bound Console controls. Freeland and bound
source typechecks, baseline controls, Console build, provenance and the private
safety-spine binding preflight also exited0. Provenance reported8 sources,
277 Git files,125 assembled files and59 private files;8 private bindings were
verified. The Console build retained its500.44kB chunk warning rather than
misreporting it as a failure or performance result.

Raw final gate output remains private at
`.local/qa-h003-fix-20260915.FppuIJ/qa-verify-all-final.log`, SHA256
`2c5f0f08f3ad072cfc82be79ab0416dbc4cd92fd3a171ecd87d0ed66c24750e7`.
The final reviewed-files inventory covered all ten changed source files; their
bytes were unchanged at the reviewed commit. Independent Lead AQA final review
had no open findings after the strict-base and documentation findings were
repaired. These are deterministic harness/source gates, not live product tests.

## Portable delivery

`sources/candidates/freeland-divergent-baseline-3ee1cb3.bundle` advertises the
selected commit as its sole HEAD and records complete history. `git bundle
verify` passed; bundle SHA256 is
`3577569dc5be28497dfd4ac86d7f46d5b276533015d6bb664575f0c5735b0671`.
An independent normal clone from that bundle checked out the exact selected
commit/tree, stayed clean and passed `git fsck --full`.

This root candidate is itself a fresh normal clone with an internal `.git`.
With all component directories initially absent, the existing local restore
materialized all four exact manifest selections. `sources:restore` and
`sources:verify` exited0, followed by root **59/59** packaging controls with0
failed/skipped/cancelled. Those controls verify self-contained delivery,
component identity and the unchanged Console–Kernel pair; they are not59 product
acceptance cases. No dependency install, browser, network, product, tracker,
payment or cloud action was part of packaging.

Replay from a new normal root clone using the existing entrypoint:

```sh
npm run sources:restore
npm run sources:verify
npm test
```

Restore refuses dirty or conflicting children. A matching source manifest does
not authorize switching a frozen campaign runtime or running the product.

## Remaining boundary

This adoption establishes only the reviewed source contract and its portable
root selection. Release acceptance still requires a separately authorized live
preflight/campaign against the exact deployed candidate and current controlled
account, with its own evidence and Verdict. It grants no purchase or payment
authority and makes no claim of full product, native TMA, provider, performance,
load, tracker-delivery or cloud coverage. Historical21c1c61 evidence and earlier
campaign outcomes retain their original attribution.
