# Inactive development sources

These bundles preserve unfinished development without depending on the author's local checkout. They are **not selected by sources/manifest.v1.json**, are not restored by sources:restore, and grant no product/runtime/skill-installation authority. The manifest remains the only active source selector. Do not copy an archived skill over an accepted one.

## Console public input, 13 September 2026

Latest integrated successor: Console`ce80729994ec812dcf10b54910cde0bddf306e1a`,
tree`3f76d017f98afcf38850a3acaaa3ff1370b841b4`,
archive`console-public-input-integrated-ce80729.bundle`, SHA256
`9208220904604b5b378b58a19f0c0895ef5e5c3b0bf03185b1e9ed25d2a36dcd`.
**INTEGRATED SOURCE REVIEWED / NOT ACTIVE.** Exact reviewed M3 handover correction
on ad9e58e, with E1 runtime/reader/skills unchanged. Combined154/154 controls,
TypeScript and independent review passed; cold exact restore and mirror2/2 passed.
No active adoption or real unfamiliar-product acceptance follows from these gates.

Prior source-reference successor: Console`ad9e58e08937f50fdc8f6bf8102086cda4c63ed3`,
tree`7340bbe07bc4b1ed99f1dec4d7bb5ae87ecee756`,
archive`console-public-input-reference-ad9e58e.bundle`, SHA256
`8329a352ecb12c7b3aa611cab788f15bb69db58512ec4c5fb9fff5a321e70cfa`.
**SOURCE/REFERENCE REVIEWED / NOT ACTIVE.** Five documentation files only;
fresh reference application and cold2/2 mirror controls passed. Runtime remains
6e84afb; it lacks the M3 correction now present in ce80729 above.

Prior [E1 runtime candidate](../../docs/qualification/public-input-candidate-20260913.md):
Console6e84afbeef9dc660fd7b5b4c7096c17e7cfd72f0, treee35b38ae136258104fa287b5c3c632bcbe328885,
archive `console-public-input-readback-6e84afb.bundle`, SHA256
`f59331434c8476cf26f10e502a3c787c54e7d627e1552de76d962473e03821ad`.
124/124 input/receipt-ingestion/dependency controls and cold4/4 actual reader checks.
**RUNTIME SOURCE REVIEWED / NOT ACTIVE.** Reference successor above; actual
unfamiliar-product qualification and adoption remain separate.

The preceding incomplete source remains retained:
Console00e410253d59d4f913eaf290c4abaa6bd0605446, tree3fc9bbb45062ab132c0a09e0de581270003c28aa,
archive `console-public-input-00e4102.bundle`, SHA256
`1d08b598cd6f40ba5f79792dd3cfd7b0109f90df3420672025ec2989eb16591e`.
Its262/262 controls did not exercise the actual evidence reader; that integration
failed and is repaired in6e84afb above. Both are based on inactive M3 and preserve
the existing needs_review policy.

## Freeland source-locator formatting, 13 September 2026

Latest reviewed successor: `21c1c617a2dbe5d1131215dc738dba2556851ae3`,
tree `f691a01e33aabb8a72673326ec524d955c4794e8`,
archive `freeland-graph-url-boundary-21c1c61.bundle`, SHA256
`2646e64b1a623530d0cab99f07a2d5d0a920245e75bb858001e9fc3c645ca066`.
**SOURCE REVIEWED / NOT ACTIVE.** URL query/fragment regression repaired;
fresh full owning offline2759 executions and cold51 graph/provenance controls
passed. Independent source review passed. The first full invocation's TMPDIR
configuration failure remains recorded in the repair report, not counted green.

Historical initial candidate:

- Commit: `b30ef1316d3db08c71ccaa398a2b4fac76fd4ae9`, based on9f848bb below.
- Tree: `250ff11d6d578de8e38f1b678c4afbe4cdc40639`.
- Archive: `freeland-graph-locators-b30ef13.bundle`, complete history, sole HEAD.
- SHA256: `1691fa2f702767837bf0854e91862ea5f6b37f1a6e9e1b9913cf678a3540e917`.
- **CHANGES REQUESTED / NOT ACTIVE.** Review found URL query/fragment false
  dependencies; reviewed successor is above. Historical full owning offline gate2758/2758;
  cold source restore and19 pure controls passed without dependencies.
  [Exact scope, failed attempts and replay](../../docs/qualification/graph-locator-candidate-20260913.md).
  No source-pin switch, receipt promotion, live product proof or graph-debt closure.

## Console conditional plan write, 13 September 2026

Latest reviewed successor: `4fddb679f84619a7e8e7ac871efa84a1493cb5ed`,
tree `e4e319dc45a71cc1856817efe890cae719353826`,
archive `console-plan-write-handover-4fddb67.bundle`, SHA256
`f542175a2d0206cd634fe1c3e9eefbc23768a14cd101b30d7f3c8406705d24d2`.
**SOURCE REVIEWED / NOT ACTIVE.** Legitimate admission-lock handover stays
definite; focused28 and expanded216 controls passed, independent Lead AQA approved.
Cold source-only restoration passed; it does not contain the separate E1 lane.

Historical initial candidate:

- Commit: `b474d52fb6b8b2d13fe362a3f551f8ef6b6ee17a`, based on dc8eb59 below.
- Tree: `53aa0c134f1bbe599c5de98f56638bb5f6355cd7`.
- Archive: `console-plan-write-b474d52.bundle`, complete history, sole HEAD.
- SHA256: `1cebf0c95a785bc3787bda315c02abb930857836742c0cfabe6e3184cd0bd070`.
- **CHANGES REQUESTED / NOT ACTIVE.** Review found a false UNKNOWN after
  legitimate lock handover; reviewed successor is above.
  Historical215/215 with cold restore. [Diff scope, replay and unresolved-operation
  instructions](../../docs/qualification/console-plan-write-candidate-20260913.md).
  Do not substitute this candidate for a manifest-selected runtime.

## Console finalization repair, 13 September 2026

- Source commit: `dc8eb59dfeb2b5231617379096e945f0ccfc09da`.
- Tree: `b2b9d32c0a4e27b930d7e1053772440cfa335015`.
- Bundle SHA256: `cd6c4b97baa5c5f19f0942c857eb6338f6ba283e969ceeb4b8b4c682a75961c4`.
- Bundle: `console-finalization-dc8eb59.bundle`, complete reachable history, sole `HEAD` reference.
- Status: **reviewed M2 development candidate, NOT ACTIVE**. Only the browser adapter and six source-owned loopback regression controls changed from canonical b392. [Exact results and replay](../../docs/qualification/console-finalization-review-20260913.md): actual RED4/6, GREEN6/6, fresh combined121/121, TypeScript/lint/build0. No full-product or all-unit qualification is implied.

For deliberate review, from the repository root, use a fresh directory:

```sh
git bundle verify sources/candidates/console-finalization-dc8eb59.bundle
git clone --no-checkout -- sources/candidates/console-finalization-dc8eb59.bundle /absolute/new-console-review
git -C /absolute/new-console-review switch -c codex/console-review dc8eb59dfeb2b5231617379096e945f0ccfc09da
```

This does not restore or replace an active component. Follow the repair report for
bounded local replay; do not run Console's default `npm test` as an offline gate.

## Freeland browser-guard repair, 13 September 2026

- Source commit: `9f848bb01f0fdde3f6b0841019243e64494e24b5`.
- Tree: `d28fb587203937aab748e8d935e710ea881ab18a`.
- Bundle SHA256: `56e45dcc9bacd0e8461f927d39c2ad4f6c5c83efcb90e36f1a3cf0079932c7b9`.
- Bundle: `freeland-browser-guard-9f848bb.bundle`, complete history with sole `HEAD` reference; includes the older722bf1b maintenance source, scoped M1 repair, test correction and four-shadow source-binding refresh. Intermediate25d6ac2/c47e90a commits remain in this history, not competing active bundles.
- Status: **reviewed M1 development candidate, NOT ACTIVE**. Current gates and limits are in [the portable repair report](../../docs/qualification/browser-guard-admission-review-20260913.md). Other maintenance findings are not closed by this archive.
- A new independent clone recovered the exact HEAD/tree, passed `git fsck --full`, provenance verification and clean QA source-authority collection, without an alternates store or installed dependencies. This establishes source portability, not browser/product acceptance on another machine.

For deliberate review, use a fresh path (not a component or campaign directory):

```sh
git bundle verify sources/candidates/freeland-browser-guard-9f848bb.bundle
git clone --no-checkout -- sources/candidates/freeland-browser-guard-9f848bb.bundle /absolute/new-guard-review
git -C /absolute/new-guard-review switch -c codex/browser-guard-review 9f848bb01f0fdde3f6b0841019243e64494e24b5
```

Existing campaigns retain their frozen runtime. Do not transfer an older receipt to
this changed source or install its skills implicitly. The old rejected archive
below is retained for history and reproduction, not recommended as a fallback.

## Freeland maintenance, 13 September 2026

- Source commit: `722bf1be5f08cc1904808af749e9c1c7f5b96881`.
- Tree: `aab9c1c340c2cafca6e5f5d914c2a1f045c3d2c4`.
- Delivered bundle SHA256: `46671a34826db1bbea989a21b709f741b7026f872aa7357a473fd5585a2618bd`. This regenerated pack has the same source commit/tree as the earlier private candidate but a different pack checksum; do not substitute the older checksum.
- Status: **NOT READY TO ADOPT**. See [current counterexamples and repair criteria](../../docs/qualification/maintenance-backlog-20260913.md).
- Bundle: `freeland-maintenance-722bf1b.bundle`, complete history reachable from its sole `HEAD` reference. It contains source and source-controlled tests, not the original private review workspace, logs, sessions or credentials provisioned at runtime. Historical product-specific permissions in source do not authorize this consumer.

For deliberate source review/development only, use a new independent directory; never overwrite components/freeland or a campaign runtime. Replace the example absolute path and run these from this repository root:

```sh
git bundle verify sources/candidates/freeland-maintenance-722bf1b.bundle
git clone --no-checkout -- sources/candidates/freeland-maintenance-722bf1b.bundle /absolute/new-development-copy
git -C /absolute/new-development-copy switch -c codex/freeland-maintenance 722bf1be5f08cc1904808af749e9c1c7f5b96881
```

Check its exact commit/tree and bundle checksum before review. The first command validates Git closure, not product or policy correctness. No installation, testing against a product, source promotion or cloud execution follows automatically. After a repair, use owning tests/review and the existing accepted-source delivery procedure; retain the rejected candidate's attribution.
