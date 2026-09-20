# Current QA-agent source and execution entry

Updated 20 September 2026. This page is the active entry, not a history of every former priority. The [manifest](../../sources/manifest.v1.json) selects source bytes; the [product owner](../../products/README.md) selects an existing campaign's frozen runtime. Neither the latest source nor this page authorizes product actions.

## Selected source

This is a dated projection of the manifest, not a second version registry. If it differs from the manifest, verify the manifest-selected bytes and repair the projection before relying on it.

| Component | Exact manifest source | Role and evidence |
| --- | --- | --- |
| Kernel | `aa5d2d188606cbcf7e3111c130347a36970ec786` | Active; paired [observation implementation](agent-observations-20260920.md) |
| Console | `c421160a71c0679a357f29828029ec3550791d16` | Active; [reference correction and fresh-agent consumer](observation-skill-reference-20260920.md) |
| Freeland | `d4754f7ddbcb8183f695f479ef21aa7728c1ace0` | Active specialist source; [readiness/PAY01 adoption](freeland-source-adoption-20260920.md) |
| Reporting reference | `10d398d8a077068c2184f33958e9b654a2f2947c` | Historical, **inactive**; never substitute it for Kernel |

Those sources and their complete source skill bundles are delivered through local Git bundles. Source adoption did not install host skills, update registrations, migrate product campaigns or attest a live product build. An existing runtime may deliberately be older.

## Active plan and next action

The owner resumed the [global P0–P7 improvement plan](../superpowers/plans/2026-09-16-cross-product-qa-global-plan.md), targeting the agreed pre-cloud work. Its [no-loss reconciliation](../reviews/2026-09-16-global-plan-reconciliation.md) preserves previous obligations. A deadline is not acceptance evidence. Cloud P7 remains separately authorized.

Next bounded implementation: **P2 semantic fee-caption regression** in the existing Freeland Card/SBP helper. The [executed counterexample](global-plan-entry-audit-20260920.md#executed-nonzero-caption-counterexample) accepted a 99% tile caption with a 12.9% API rate and correct sums. Add sensitive healthy/broken controls and repair that seam, then independent review and source delivery. The original card-top-up wallet dialog remains a separate open consumer gap; neither a fixture PASS nor this narrow repair closes it. Do not rebuild completed P0/P1 mechanisms.

In parallel, qualify this short P6 entry from a clean clone and fresh context. The next larger exits remain P3 full/ticket/help/resume, P4 useful graph/regression consumption, P5 cross-domain agent evaluation and P6 dialogue-ready delivery. Exact scope and evidence are in the plan, not inferred from unchecked-box counts.

Freeland merchant/migration questions are a separate waiting product lane. Global QA-source work does not authorize merchant disposition, production SQL, deployment, payments or tracker/Buzz writes. Read that product owner's checkpoint only when resuming its separately requested work.

## Accepted work and limits

- P0 bounded integrity/findings repairs, Freeland PAY01 composition/readiness and source delivery are accepted in the selected lineage. [Console qualification](console-p0-adoption-20260920.md) and [Freeland qualification](freeland-source-adoption-20260920.md) retain exact scopes. The local source-only workflow body passed; hosted CI is not claimed.
- P1 writer/reader and full source references are accepted. A [real fresh-context consumer](observation-skill-reference-20260920.md#real-consumer-and-plan-boundary) reused completed A without rerunning it and continued C. Scope remained 21 targets / 2 recorded / 19 unobserved. Observations remain text/JSON, zero attachments, caller-authored/unattested; they do not become managed PASS or release GO.
- [Intermediate browser assertions](browser-journey-adoption-20260914.md), [bounded continuation](campaign-continuation-20260914.md), [controlled mixed handoff](mixed-handoff-execution-20260914.md) and the [graph-consumer pair](graph-consumer-20260914.md) already exist. Their bounded results are not full live mixed-ticket coverage, arbitrary browser/payment replay, host restart or demonstrated incremental graph benefit.
- Overall P0–P6 acceptance is still open. Source parity is not actual current Claude execution. Installed-skill drift, broader agent-quality/coverage and declared end-to-end gates remain explicit. Do not use the unqualified generic manual-receipt API as an observation shortcut.

## Start from one place

Read root `AGENTS.md` (also routed from `CLAUDE.md`). From a normal repository clone:

```sh
npm run sources:restore
npm run sources:verify
npm test
```

Restore/verify use bundled local Git sources and refuse dirty/conflicting children. The final command is the **root packaging test**, not product QA; it requires restoration first. A child's default `npm test` can launch Playwright or product work and must not be run by habit.

Dependencies, browsers, plugins, credentials and execution permissions are explicit prerequisites, not included or granted by restore. Discover what the current host actually supports; do not install missing dependencies/skills or copy account state implicitly. Use [portable setup](../getting-started.md) and the [complete source skills index](../../skills/README.md), including required references. Historical installed copies do not override selected reviewed sources.

## Explicit runtime selection

For an existing Freeland, Agentify or MagicPay campaign, resolve the [execution/knowledge owner](../../products/README.md) and its latest checkpoint. Retain frozen source/runtime, registration, account, scope and unknown outcomes. If that owner cannot be resolved, continuation of that exact campaign is blocked; independent authorized analysis need not stop. Do not re-register a replacement or repeat an uncertain financial action.

For a new permitted Starter operation, use the selected Console's full `qa-product-v0` skill and actual CLI help. Supply exact Kernel checkout via `QA_STARTER_REPO` / `--starter-repo`, intended workspace via `QA_WORKSPACE` / `--workspace`, and separate explicit state/store/registration paths required by that operation. Use `qa-init` only for actual setup/recovery. Never paste another product's historical environment or invent a universal full/ticket command.

## Workflow and capability boundaries

The agent owns product/design understanding, grounded expectations, risk-based test design, diagnosis and the QA conclusion. Existing tools own execution boundaries, bindings, durable results and readback. Graphs guide dependencies and coverage gaps; a graph link is not evidence that a check ran.

Full QA retains the known inventory and unassessed/blocked paths. Ticket QA uses the selected tracker, original reproduction and related risks; a tracker read alone cannot prove FIXED. Ask humans only for concrete gaps and continue independent permitted checks. After help, recheck actual account/environment/readiness; unknown effects require reconciliation before retry.

Nuanu Flow uses the available official host plugin and current product policy; delivery requires suitable authorization, dedupe and persisted readback. Product acceptance, owner risk acceptance and deployment readiness are separate decisions. No source gate overrides a production migration guard.

## Historical material

The [pre-correction entry snapshot](current.20260920-pre-entry.historical.md) preserves previous working-copy text byte-for-byte; [the roadmap](../roadmap/README.md) locates older plans and snapshots. Their former “current”, “next” and “paused” phrases describe those sessions, not present instructions. Historical links may refer to optional, undelivered private records; they are not prerequisites or authority for first use. Missing evidence remains unavailable rather than silently reconstructed.

For active-code searches, scope to selected components and current root tools/tests/skills. Search archived `references/` and `*.historical.md` only for a deliberate historical question. Prior outcomes and unsupported boundaries remain attributed to their original bytes.
