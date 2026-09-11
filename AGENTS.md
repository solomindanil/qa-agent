# Agent entrypoint — shared by Codex and Claude

This branch is the reviewed-source integration candidate, not the accepted workspace. See [current checkpoint](docs/qualification/reviewed-source-chain.md). Source restore/verify is permitted locally; a matching manifest does not authorize product execution. The accepted root remains at48bccef until separately qualified promotion. Earlier qualification records retain their original source attribution.

## Before work

1. Resolve this normal Git root, read `sources/manifest.v1.json` and `docs/qualification/assembly.md`, then run `npm run sources:verify`. If components are absent, `sources:restore` is local-only; do not overwrite conflicting children. Root self-tests verify packaging, not products.
2. Select the requested product and its existing execution/knowledge owner in `products/README.md`. For general QA requests without a selected specialist, start with the root-owned [qa-check](skills/qa-check/SKILL.md). Read the full selected source skill and its required references in `skills/README.md`. Child-relative commands run from that child, not this root or an old session cwd.
3. Verify component HEAD, product environment/candidate, available tools and permitted actions. A copied account policy, old acceptance, saved path or `runtimeAuthority` does not grant new execution authority. Do not infer current identity from an old graph or receipt.
4. Check other active campaigns and ownership before writing shared state. Keep one owner per product campaign. Do not re-register or manually move a managed workspace to this root; reconcile existing registration through its owning tools.

## Responsibilities

- Agent reasoning: inspect requirements and tickets, choose risk-based test design, explore gaps, diagnose harness vs product failures, request missing human help and propose verified improvements.
- Existing deterministic tools: validate schemas/identities/permissions, execute checks, reconcile outcomes and retain provenance. Reuse Console/Kernel for Starter and Freeland's own graph/campaign/verdict tools for Freeland. Do not replace either with handwritten PASS logic.
- Preserve coverage denominators: list verified, failed, blocked and unassessed checks. Never make an unsupported/no-coverage requirement green. A green tool self-test is not product acceptance.
- Human help blocks only dependent lanes. Record the case, attempted methods, missing input and resume checkpoint; continue independent safe work. On reply, recheck current origin/account/candidate before resuming. Do not ask for passwords, OTPs or payment secrets in reports.
- Nuanu Flow is accessed through the available official host plugin. Read its current skill/catalog first; ticket reads are not changes. Before writes follow the selected product's confirmation, dedupe, exact target and persisted readback rules. Unknown outcomes must be reconciled before retry.
- Graphs improve from confirmed dependencies, outcomes and regression findings. Propose then validate/publish through the owning graph API; unresolved claims remain gaps. Never hand-edit a managed Starter graph or claim local observation is sealed evidence.

## Component and environment boundaries

- Candidate `components/kernel`15a067c and `components/console`f3660d0 are the paired Starter sources. Console adds receipt-bound attributed agent reviews, a qualified interruption fixture, and recorded-event totals before trace truncation. Reviews do not change verdicts; the fixture is not production recovery; event totals do not prove unrecorded actions or product coverage. Console's embedded authority is authoritative; historical README examples are not current pins. Kernel only re-exports its existing safe private reader. See [exact source chain and qualification](docs/qualification/reviewed-source-chain.md). Source restoration is not assembled-runtime qualification. Never switch to `components/kernel-reporting-reference`10d to make an API available.
- Candidate `components/freeland`9c2509e is the selected FreelandQAmain descendant. Its [source-locator repair](docs/qualification/graph-reuse-pilot.md) preserves coverage debt; the earlier [catalog/guest qualification](docs/qualification/catalog-discovery.md) stays attributed to04b771a. Neither closes full product or graph coverage. Its embedded legacy Console is not the active universal Starter Console. Product Freeland is read-only: no push, deployment or migration.
- Read `docs/qualification/commands.md` before tool qualification. Default Console/Freeland `npm test` may start browser/product work: it is not the root packaging test. No implicit live fallback, dependency install, skill/plugin install, watcher, delivery, payment or cloud setup.
- Keep credentials, sessions, private provider/account data, traces, active graphs, outboxes and managed registrations outside tracked delivery. `.local/` is ignored but not a security boundary; use distinct product/run roots and explicit registries. Never transfer Freeland business rules or payment permission to another product.
- Keep source pins frozen during a campaign. Changes to tests/oracles/graph inputs require their owning identity refresh and relevant requalification. Refuse dirty-source restore; preserve source history and independent user work.

## Resume

Read `docs/roadmap/README.md` and `docs/qualification/assembly.md`. Full product campaigns, authored Starter timeout repair and cloud autonomy are not complete merely because assembly passes. End with exact results, blockers and the next bounded action, not a blanket “everything works”.
