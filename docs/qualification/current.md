# Current QA-agent source and execution entry

Updated 2026-09-11. This is the current source index. [Manifest](../../sources/manifest.v1.json) pins executable component **source**, while [product owners](../../products/README.md) select existing campaign runtimes. [Reconciliation](reconciliation-20260911.md) records the audit, adoption and actual gates. Older pages are dated evidence, not competing current manifests.

## Start from one place

The canonical local source workspace is `qa-agent`. Read its root `AGENTS.md` (also from `CLAUDE.md`) and complete selected skills. From a normal Git clone:

```sh
npm run sources:restore
npm run sources:verify
npm test
```

The first two commands use bundled local Git sources; the last is the **root packaging test**, not product QA. Restore refuses dirty/conflicting children. Do not run a child's `npm test` by habit: Console and Freeland use that name for Playwright.

Source does not include installed dependencies, browsers, plugin authentication, account credentials or permission to run an existing campaign. Provision dependencies from each selected child's lockfile separately, in its own directory; do not copy writable node_modules between children. Current local qualification used Node22.23.1, npm10.9.8, separate npm config/cache and `npm ci --ignore-scripts --no-audit --no-fund`. Browser binaries already installed on the host were used only for owned loopback fixtures.

## Real workflows and their owners

| Work | Agent decision | Existing deterministic implementation | Boundary |
| --- | --- | --- | --- |
| Understand unfamiliar product | Promise, users, roles, business journeys, UI/design, states, dependencies and risks; clarify or investigate | Console `qa-init` / `qa-product-v0`, profile/graph/catalog contracts in Kernel | No inference becomes a requirement merely because it appears in current UI |
| Broad QA | Inventory all known areas, choose depth by risk, include appropriate functional/NFR checks | Existing authored/declarative campaign API/CLI and available specialist tools | Report unrun, blocked and unknown areas; no generic guaranteed-complete test pack |
| QA tickets | Read selected tracker, reconstruct original path, inspect dependencies and adjacent risks | Official host Nuanu Flow plugin; Freeland's existing sprint/graph/verdict tools where selected | Read-only inventory is independent of runtime; state changes require product rules and persisted readback |
| Execute and diagnose | Select supported browser/API/MCP/native capabilities; distinguish product, harness, timing and environment failures | Existing adapters, Playwright tests, recorded runs and result validation | A tool's success is not business acceptance; unsupported agent observations stay unsealed |
| Ask for help | Record the concrete gap and continue independent work | Existing help/continuation records and host input tools | An answer does not authorize unrelated effects or make stale account/version state current |
| Improve knowledge | Propose confirmed dependency/requirement/regression changes, review their meaning | Kernel knowledge revision/preview/apply and each product's graph owner | Keep hypotheses and old evidence separate; graph presence is not tested coverage |
| Developer handoff | Cluster only evidenced common causes and describe exact expected fix | Complete `qa-bugfix` bundle and template | Developer completion is not a deployed QA PASS |
| Release judgement | Explain risk, supported outcomes and important residual gaps | Freeland Release Verdict; Starter's actual current receipt/result contracts | No second verdict engine, no manual rewrite of evidence to obtain green |

Read the [full skills index](../../skills/README.md). These workflows reuse existing modules; the table is not a new orchestrator or a claim that every tool is available on every host.

For active-code searches, scope to the selected component or `tools/`, `tests/` and `skills/`. Exclude `references/` when assessing current behavior: its historical source snapshots deliberately preserve obsolete implementations and rejected variants for explicit review, not automatic retrieval as current instructions.

## Explicit runtime selection

For a new permitted Console operation, supply the exact Kernel checkout using existing `QA_STARTER_REPO` / `--starter-repo`, the intended workspace using `QA_WORKSPACE` / `--workspace`, and separate explicit state/private-store/registration paths appropriate to that operation. Consult the selected Console's README and CLI help, then its full skill; do not paste a historical complete environment from another product. The embedded Kernel authority still checks exact revision/source integrity.

For an **existing** Freeland, Agentify or MagicCard campaign, first read the owner's checkpoint and retain its frozen source/runtime/registration/session and any unknown outcomes. Source adoption is not campaign migration. Freeland's historical credential dependency remains private and owner-managed; no credential file was copied here. Neither archived graph proofs nor current source locators attest the live product revision.

## Qualification and remaining exits

Fresh results and exact source attribution: [2026-09-11 reconciliation](reconciliation-20260911.md). Existing controlled fixture evidence covers useful execution, bug sensitivity, knowledge/regression publication, preserved uncertainty, human-help continuation and review storage. Root packaging/integrity controls are separate. No product was purchased, deployed, migrated or written to a tracker during source consolidation.

Next: a new substantive authorized full/ticket product slice consumes this source and current owner skills, then a fresh session resumes it. Convert only demonstrated reusable gaps into shared reviewed helpers. Actual current Claude execution and a bounded cloud pilot follow as separate exits; native/mobile, performance/load and provider internals are not silently covered. The detailed [seven-slice plan](../superpowers/plans/2026-09-10-universal-qa-next-plan.md) and deferred Freeland coverage work remain intact.
