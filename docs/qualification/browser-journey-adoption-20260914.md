# Canonical browser-journey adoption — 14 September2026

The owner approved adopting the [reviewed journey source](browser-journeys-20260914.md)
and then exercising it with a fresh consumer. Root base before adoption:
`e82e60096072a4630e7c8afff9d9e753d4dbbf33`.

Only the Console selector changes: b54b849 to
`66ac7db55a25f56b199b2cb00ad83df3b8dad868`, tree
`8c0a426b3133e326eb120f09a2e0c9408eb68eb5`, complete bundle SHA256
`9f9046afdf7f222a37f87ffca6a35badf1763fbf09c170b29ba0bbfdba366f8c`.
Kernel185d3e7, Freeland21c1c61 and inactive reporting10d398d are unchanged.

## Execution and preservation

- An independent normal Git clone restored the new manifest's four exact
  components and passed source verification and root59/59 packaging.
- It installed its own54 Kernel and296 Console lockfile packages without scripts
  or upgrades. Console's first network install aborted with ECONNRESET; an
  accidentally attempted focused run then failed3 module loads because tsx was
  absent. These are retained setup failures, not source regressions. Offline
  lockfile retry used the previously populated content-addressed npm cache,
  not another checkout's node_modules. Correct focused controls then passed29/29.
- Kernel build exited0. No browser download occurred; installed Chromium was
  used only against owned loopback fixtures.
- Independent Lead AQA precheck verified bundle/parent/tree/pair and required
  explicit old-child replacement plus preservation of overlapping documents.
- Canonical pre-existing14 files were hashed and backed up with their binary
  diff before integration. All14 were byte-identical after selector restoration,
  before the intentional current-pointer documentation merge.
- No process was observed referencing canonical component paths. The clean old
  Console directory was moved recoverably into the private adoption folder;
  the owning source restore then materialized66ac7db. Source verification passed
  for all four canonical components; no existing product runtime was migrated.

Private backup/log folder on the original machine:
`.local/journey-adoption-20260914.tGokny/`. Backup archive SHA256:
`895c4998c2a676c2522967c80ba4cbf8fcd7603bea24c647996dfe3ea0958c32`.
The folder is not needed to use the repository: source histories, lockfiles,
skills, tests and replay instructions are delivered through the existing bundles.

Setup correction retained: the initial clone command's subsequent branch switch
ran from the canonical parent instead of the independent clone. It changed only
the branch name at the same HEAD; immediately restored codex/workspace-assembly
and verified the dirty files. No commit, source byte or product state changed.

## Qualification boundary

Reproducible local gates, with the paired Kernel environment resolved from the
manifest and each child's own locked dependencies:

```sh
# Root: packaging and bundled source identities, not product QA.
npm run sources:verify
npm test
# From components/kernel:
npm run build
# From components/console:
node --import tsx --test tests/unit/browser-journey.test.ts tests/unit/campaign-browser-finalization.test.ts tests/unit/qa-product-skill.test.ts
```

The independent clone's focused29/29 log SHA256 is
`46c93f3ae34a96faa3683acbcc4d527104de64d66dbaae07e60b0442fb794786`.

Canonical packaging passed59/59, no failures/skips/cancellations,30005.387375ms;
log SHA256 `0a79bad8cf585f0ad221d0ffc34e17c597a02d738dad9769fa6a84e6b7b23a20`.
Independent Lead AQA delivery review approved the ten-file pre-actor slice,
including preservation, source identities and portable link closure, with no
Critical/Important finding. It was committed as
`5e955ec5fb760d92741c948016452cf5ad94d3a7`; nine excluded pre-existing files stayed
byte-identical. An independent normal clone of that exact commit restored and
verified all four sources and passed root59/59, no failures/skips/cancellations,
29947.059833ms; log SHA256
`d770b9d41fcda26da3ac04b4fb0d85b8c2be52c1f0b126ef80f95ad18d5388e1`.
The cold clone had no child dependencies and remained clean. These gates used
only the delivered repository, not untracked drafts or private campaign files.

The [fresh-consumer execution and its review](browser-journey-agent-20260914.md)
are recorded separately. Candidate321/29 evidence retains
its original qualification; it is not a fresh agent's product result.
The prepared public-catalog exercise uses an isolated registration and the same
selected66ac7db/185 source pair. Preparation is not autonomous onboarding.

No installed skill, existing campaign/account/managed graph, Freeland product,
tracker, payment, provider integration or cloud host changed. No push occurred.
The actual authored journey/reader result must retain its own limits; then follow
mixed-handoff and graph-consumer qualification. Source adoption alone does not
complete those exits.
