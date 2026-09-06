# Reviewed source delivery

This directory contains self-contained Git bundles, not build outputs or installed environments. `manifest.v1.json` selects exact commits and SHA-256 digests. Restore them with the root bootstrap; do not replace a child with a directory copied from an old worktree.

- `kernel` is the selected reusable Starter Kernel.
- `console` is the existing Starter interface/adapters and integrated skills. Its pending authored-fixture repair is not included.
- `freeland` is the existing Freeland-specific QA harness, graph, tests, skills, provenance and scoped knowledge. It is not the Freeland product repository.
- `kernel-reporting-reference` preserves useful observation/report work from a sibling branch. It is **not** the active Kernel and does not include Kernel393's reviewed journey/invariant admission.

`runtimeAuthority: true` means eligible to be selected as a source owner, not proof that a product passed QA or permission to execute writes. The reporting reference cannot be substituted for the active Kernel. Existing component LICENSE/attribution files remain in their original history.

These sources were reviewed for this user's **private** qa-agent repository. Do not make this repository public: the Freeland child contains project-scoped private knowledge. Credentials, installed plugins, browser sessions, raw product-run evidence, generated dependencies and managed workspace registrations are not supplied.

See [source qualification](../docs/qualification/source-delivery.md) and [exact bundle results](../docs/qualification/source-bundles.v1.json). Audits are heuristic/semantic reviews, not a guarantee that no unknown secret encoding exists.
