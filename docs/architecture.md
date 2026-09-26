# Architecture and supported boundaries

QA-agent is an agent-led workflow over existing product-owned tools, not one cross-product execution engine. The agent grounds expectations, chooses risk-based checks, investigates discrepancies and explains the conclusion. The selected pack validates identities and effects, runs bounded checks, stores evidence and applies its own verdict contract.

```text
request → product/owner routing → complete specialist skill → bounded plan
                                              ↓
                    permitted browser/API/agent capabilities
                                              ↓
                    owning evidence, readback and verdict tools
```

## Source lanes

The [manifest](../sources/manifest.v1.json) selects exact delivered commits and bundle digests. Restore currently materializes all manifest-selected component repositories; the lanes below are *logical* choices for work, not an optional or partial restore mechanism.

| Lane | Purpose | Boundary |
| --- | --- | --- |
| Console + Kernel | General Starter analysis, managed campaigns, plans, observations and evidence contracts | Use the exact paired source and current component instructions. New work needs its own product registration/authority where applicable. |
| Freeland harness | Freeland-specific graph, tests, campaign routes and verdict knowledge | Keep its specialized owner/runtime, staging and financial guards. Its embedded older Console is not the general Starter Console. |
| Reporting reference and candidate bundles | Historical or experimental source for deliberate review | Inactive unless a later manifest selection and qualification says otherwise. |

An existing campaign may deliberately use a frozen runtime other than the latest delivered source. Product routing and the owner checkpoint choose that campaign's runtime, environment, candidate, registration and permissions. Restoring bundles never migrates it. Freeland's separate harness is justified by its domain-specific graph, product tests and effect/acceptance boundaries; it is a specialist behind common routing, not a competing universal platform.

The optionality is in selecting the *workflow and capabilities*: an unfamiliar product can begin read-only analysis without a managed workspace, Flow, a browser account or every host plugin. Particular checks may require those capabilities, at which point the dependent lane stays blocked until its owner supplies them. Browser/API/Playwright/native tools are used only when available and appropriate to the selected specialist. There is no claim that every stack, device, platform or product flow is supported or tested.

## Four distinct decisions

1. Source delivery: bundle/checkout bytes match the manifest.
2. Runtime readiness: the selected component and its required environment work for a bounded task.
3. Product evidence: the current deployment, account, oracle and expected outcomes are verified under permitted effects.
4. Acceptance or delivery: the product owner applies its criteria and, if authorized, the product-selected tracker/communication workflow persists a read-back decision.

Passing one decision does not imply the next. A tracker write, payment, deployment, registration, plugin/skill installation or cloud experiment requires its own authority. Preserve verified, failed, blocked and unassessed scope; reconcile unknown effects before retry.

## What to unify next, and what not to merge

The target is one understandable QA workflow, not one forced execution engine. The [canonical plan](superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md) prioritizes four boundary contracts: execution identity, permitted effects, verified evidence generation, and outcome/qualification. These are proposed repair/design boundaries, not an implemented universal adapter API. The [external-review reconciliation](reviews/2026-09-27-external-review-reconciliation.md) documents known route-specific gaps; do not assume every current entry enforces all four.

Keep product expectations, payment rules, graph knowledge and acceptance criteria inside their pack. Consider extracting a utility only when at least two active consumers need identical semantics, golden and negative controls prove compatibility, schema/version ownership is explicit, historical receipts remain readable, and a consumer gets measurable correctness or maintenance benefit. Similar function names alone do not justify moving twenty oracles into a new shared engine.

No new runner, universal business-verdict DSL, shared mutable status registry, or forced Freeland-to-Starter migration is selected. Selective source packaging and a reduction of retained archive bytes would each be separate implementation decisions, not consequences of cleaner documentation.
