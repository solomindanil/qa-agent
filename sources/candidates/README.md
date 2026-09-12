# Inactive development sources

These bundles preserve unfinished development without depending on the author's local checkout. They are **not selected by sources/manifest.v1.json**, are not restored by sources:restore, and grant no product/runtime/skill-installation authority. The manifest remains the only active source selector. Do not copy an archived skill over an accepted one.

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
