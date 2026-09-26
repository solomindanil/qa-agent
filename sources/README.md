# Reviewed source delivery

This directory contains self-contained Git bundles, not build outputs or installed environments. `manifest.v1.json` selects exact commits and SHA-256 digests. Restore them with the root bootstrap; do not replace a child with a directory copied from an old worktree.

- `kernel` is the selected reusable Starter Kernel.
- `console` is the existing Starter interface/adapters and integrated skills. The authored-fixture repair is included at b38a8b4; its selected22-record local gate passed. See [qualification](../docs/qualification/authored-fixture.md); this is not live-product acceptance.
- `freeland` is the existing Freeland-specific QA harness, graph, tests, skills, provenance and scoped knowledge. It is not the Freeland product repository.
- `kernel-reporting-reference` preserves useful observation/report work from a sibling branch. It is **not** the active Kernel and does not include Kernel393's reviewed journey/invariant admission.

`runtimeAuthority: true` means eligible to be selected as a source owner, not proof that a product passed QA or permission to execute writes. The reporting reference cannot be substituted for the active Kernel. Existing component LICENSE/attribution files remain in their original history.

The owner has selected public distribution of this source repository. It includes Freeland-specific knowledge and historical qualification material; these are not generic product rules or current execution authority. Earlier private-delivery reviews retain their original scope. The [public release record](../docs/releases/2026-09-26.md) records the additional delivery checks and their limits. Credentials, installed plugins, browser sessions, live campaign stores, generated dependencies and managed workspace registrations are not supplied by restore.

See [source qualification](../docs/qualification/source-delivery.md) and [exact bundle results](../docs/qualification/source-bundles.v1.json). Audits are heuristic/semantic reviews, not a guarantee that no unknown secret encoding exists.
