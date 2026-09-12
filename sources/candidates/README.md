# Inactive development sources

These bundles preserve unfinished development without depending on the author's local checkout. They are **not selected by sources/manifest.v1.json**, are not restored by sources:restore, and grant no product/runtime/skill-installation authority. The manifest remains the only active source selector. Do not copy an archived skill over an accepted one.

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
