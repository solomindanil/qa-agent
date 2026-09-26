# Reviewed source delivery

`manifest.v1.json` is the sole selector for exact delivered component commits, trees, bundle paths and SHA-256 digests. The root bootstrap restores self-contained Git bundles into independent repositories under ignored `components/`; these are source, not build output or an installed product environment. Do not replace a child with a copy of an old worktree. Verify the selected bytes and child status before source-dependent work.

| Component | Role |
| --- | --- |
| `kernel` | Reusable Starter contracts and execution/evidence boundaries. |
| `console` | Starter interface, adapters and integrated product-analysis skills; selected as a pair with Kernel. |
| `freeland` | Freeland-specific QA harness, graph, tests, skills and scoped knowledge; **not** the Freeland product repository. |
| `kernel-reporting-reference` | Inactive sibling source retained for review; never substitute it for the selected Kernel. |

Restore currently materializes all components named in the manifest. Choosing a Starter, Freeland or another product workflow is a *logical* choice after restore, not an optional partial-restore feature. `runtimeAuthority: true` is eligibility as a source owner; it is neither proof that a runtime or product passed nor permission to execute actions. Existing campaigns keep their owner-selected frozen runtime, which may differ from this manifest. Each child retains its own Git history, lockfile, license/attribution and dependencies; do not share writable `node_modules`.

The public source delivery includes Freeland-specific knowledge and dated qualification material. Those are not generic rules or current execution authority. Credentials, installed plugins/skills, browser sessions, live campaign stores, generated dependencies and managed registrations are not supplied. The [release record](../docs/releases/2026-09-26.md) states public-delivery checks and limits; [source qualification](../docs/qualification/source-delivery.md) and [bundle results](../docs/qualification/source-bundles.v1.json) retain exact evidence. Audits are heuristic/semantic reviews, not a guarantee that no unknown secret encoding exists.

[Development archives](candidates/README.md) retain earlier and experimental bundles with their original claims. They are provenance, not a second selection registry. No archive is safely disposable solely because its status is historical.
