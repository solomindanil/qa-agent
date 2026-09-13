# Current QA-agent source and execution entry

Updated 2026-09-14. This is the current source index. [Manifest](../../sources/manifest.v1.json) pins executable component **source**, while [product owners](../../products/README.md) select existing campaign runtimes. [Source adoption](source-adoption-20260914.md) records this selection and its actual gates. Older pages, including the [11 September reconciliation](reconciliation-20260911.md), are dated evidence, not competing current manifests.

## Selected source — 14 September

| Component | Selected source | Included bounded repairs |
| --- | --- | --- |
| Kernel | `657894dbd61561a634f36669a0874dccccbea59e` | M4 conditional-write admission, alias arbitration and owned-temp cleanup |
| Console | `881a93e43fd9b90f3dcf9812812f6cf8ad854789` | Same1c715a1 runtime/skills and exact Kernel657 authority; extracted owned catalog fixture for fresh-agent execution |
| Freeland | `21c1c617a2dbe5d1131215dc738dba2556851ae3` | M1 bounded browser admission and M5 format/URL-safe source locators |
| Reporting reference | `10d398d8a077068c2184f33958e9b654a2f2947c` | Historical, **not active** |

These reviewed repairs are now the manifest-selected sources for new permitted
work. Bundle directory names do not select versions; the manifest does. No
existing campaign, registration, account, installed skill or live product build
is migrated. Their owner checkpoints still govern continuation. Complete source
skills are consumed from this restore, not from a historical installed copy.

Console881a93e adds only a reviewed test-fixture extraction on top of the repair
source1c715a1:5 focused controls and source typecheck passed. Prior repair gates
stay attributed to1c715a1. The [fresh-agent local exercise](../../evals/public-input-agent-cycle/README.md)
uses this fixture, existing registration, knowledge publication and campaign APIs;
its setup is not autonomous product QA or campaign migration.

Next: a fresh agent must choose and execute meaningful checks through the
existing E1/knowledge/campaign path, then read the results back. Tool gates alone
do not establish autonomous QA. Stage3 crash recovery, M6 generic manual-receipt
API qualification, remaining graph/business gaps and actual dual-host/cloud
execution remain open. M6 is not used by the current Console/E1 path and must not
be connected as a shortcut.

The [fresh source-entry observation](../../evals/source-entry/20260914/README.md)
selected current sources and preserved frozen campaign ownership, but its answer
conflated resume with migration and requested redundant checkpoint fields.
Lead AQA assessed it as conditional. This is one retained reasoning sample, not
actual product execution or completed current-entry/continuation qualification.

## Historical candidate qualification — 13–14 September

The following records describe the candidates **before this source selection**.
Their former inactive/next-adoption language does not override the table above;
original test results and rejected versions retain their attribution.

Maintenance checkpoint, 13 September: [portable maintenance summary](maintenance-backlog-20260913.md) records exact-ticket binding, continuation and guard/readiness/knowledge fixes. These isolated candidates have **not** replaced manifest pins or existing campaign runtimes. A passing tool test is not source adoption or a product verdict.

Latest scoped repairs: [M1 browser admission](browser-guard-admission-review-20260913.md),
source9f848bb, and [M2 Console finalization](console-finalization-review-20260913.md),
source dc8eb59. M1 passed full offline2753 test executions; M2 passed its fresh
121/121 adapter/dependency/runner gate after actual false-PASS reproduction.
Both passed independent Lead AQA review and are delivered as **inactive** candidates.
Independent reviews resumed. [M3b474d52](console-plan-write-candidate-20260913.md)
was rejected for false UNKNOWN on legitimate lock handover; successor4fddb67
passed28 focused and216 expanded controls, independent review and cold delivery.
[M5b30ef13](graph-locator-candidate-20260913.md) was rejected for URL query/fragment
text creating local dependencies. Successor21c1c61 passed full owning offline
2759 executions, independent review and cold51 graph/provenance controls.
Historical215/215 and2758/2758 are not reattributed to these fixes.
M4, M6 and adoption remain separate; campaign runtimes have not changed.

M4's [historical full gate1719 passed/1 timeout and alias counterexample](kernel-write-candidate-20260913.md)
remain recorded on their original bytes. The [14 September successor](kernel-admission-20260914.md)
implements the approved reserved metadata namespace, native basename arbitration
and verified owned-temp cleanup. Fresh55 writer and10 actual consumer controls,
typecheck/build and independent Lead AQA source review passed. The broader
five-file compatibility gate passed244/244; exact source657894d is delivered in
an inactive complete-history bundle, cold-restored with build0 and55/55.
There is no fresh full-suite or active adoption claim. Existing cache-repair
semantics were retained after rejecting an early-admission variant.

The [exact Console–Kernel successor pair](console-kernel-pair-20260914.md) is now
qualified: Console1c715a1 pins Kernel657894d;121 authority,21 actual consumer and160
E1/M3/M2 executions passed, typecheck/Vite and independent source review passed.
Both complete-history bundles are delivered inactive. Next: review and cold-check
the root adoption before changing manifest-selected sources; keep frozen product
campaigns and installed skills separate. This is not full product QA or cloud readiness.

The first Stage2 mechanism is [inactive E1, integrated successor ce80729](public-input-candidate-20260913.md):
public literal search/filter input. Follow-up found the old00e4102 reader did not
consume these plans despite its passing raw-JSON fixture. The successor fixes that
seam:124/124 input/ingestion/dependency controls and cold4/4 actual consumer checks.
Earlier262/262 and33/33 remain attributed to00e4102, not re-run on the successor.
It preserves needs_review and all public-lane boundaries. Runtime and source
reference reviews passed. A fresh reference consumer now selects public input
automation while retaining blocked auth and agent diagnosis; source mirrors and
cold packaging passed2/2. M3 chain reconciliation is now source-reviewed in
ce80729:154 combined controls and independent cold restoration passed. This was
not product execution. Adoption and substantive fresh-agent product use remain open.

Stage3 now has a [reproducible process-interruption gap](../../evals/campaign-continuation/README.md):
attempt files survive, but the fresh campaign reader has no partial/resume state
and ordinary execution repeats a finished check. A separate actual registration
and CLI probe now confirms that a synthetic unsealed campaign directory blocks
workspace preflight before plan loading. That is an executed grammar check, not
an actual CLI crash or successful product campaign. The two probes cover distinct
boundaries; neither repairs or establishes crash recovery.

New consumers start with [portable setup](../getting-started.md); original-machine files and chat history are not prerequisites. Current delivery and pending component fixes are distinct. The [approved global plan](../superpowers/plans/2026-09-13-universal-qa-global-plan.md) is the continuation order.

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

Current packaging and selection: [14 September source adoption](source-adoption-20260914.md). Earlier results retain exact attribution in the [2026-09-11 reconciliation](reconciliation-20260911.md). Existing controlled fixture evidence covers useful execution, bug sensitivity, knowledge/regression publication, preserved uncertainty, human-help continuation and review storage. Root packaging/integrity controls are separate. No product was purchased, deployed, migrated or written to a tracker during source consolidation.

Earlier rejected checkpoint: candidate `722bf1b` completed2739 aggregate executions, but independent review reproduced a SharedWorker admission escape. That old candidate remains NOT READY TO ADOPT. The selected Freeland21c1c61 includes the reviewed M1 successor and M5 URL-boundary repair. This closes those bounded source findings, not product coverage or every browser boundary. Other [maintenance findings](maintenance-backlog-20260913.md) remain separately scoped. Historical campaigns using older helpers do not gain these repairs until their owners deliberately requalify a new runtime.

Then a new substantive authorized full/ticket product slice consumes the accepted source and current owner skills, and a fresh session resumes it. Convert only demonstrated reusable gaps into shared reviewed helpers. Actual current Claude execution and a bounded cloud pilot follow as separate exits; native/mobile, performance/load and provider internals are not silently covered. The [global plan](../superpowers/plans/2026-09-13-universal-qa-global-plan.md) preserves the previous seven substantive exits and deferred Freeland coverage work.
