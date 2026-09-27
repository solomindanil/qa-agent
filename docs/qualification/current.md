# Current QA-agent source and execution entry

Updated 27 September 2026 (Bali), after bounded A1 source delivery and cold-clone readback. This page is the current qualification projection, **not** a run log or a second task queue.

The [manifest](../../sources/manifest.v1.json) selects delivered source; the [product owner](../../products/README.md) selects an existing campaign's frozen runtime. The published [26 September release](../releases/2026-09-26.md) remains a dated source-delivery result, not product acceptance. Development continues on `codex/stable-20260926`; the release tag is not moved. Source, installed host skills and campaign runtime may differ and must not be conflated.

## Selected source

This is a dated projection of the manifest, not a second version registry. If it differs from the manifest, verify the manifest-selected bytes and repair the projection before relying on it.

| Component | Exact manifest source | Role and evidence |
| --- | --- | --- |
| Kernel | `ece24e865f7ea37cff32c24c7e3739c9d0059f81` | Public-release repair: durable claim-receipt stage ownership, portable deleted-inode fixture and scoped integration budgets. [Release evidence](../releases/2026-09-26.md): full Linux collection passes 1,787 with one native case-alias skip; that case passes on macOS. Prior W2a results retain their original source attribution. |
| Console | `5634b7f456999a967cc64704c58f7d6e040f0e57` | [A1 legacy CLI source-authority repair](a1-cli-source-authority-20260927.md), paired with unchanged Kernel. The [26 September release](../releases/2026-09-26.md) retains its 163 Console / 19 browser counts at the earlier `a8f6679` source; those are not retagged to A1. |
| Freeland | `0ea2df10f1b6d613e01d50011c269ca0fa999877` | Active specialist source, adopted locally; [P2-A semantic repair and qualification](p2-semantic-repair-20260920.md) |
| Reporting reference | `10d398d8a077068c2184f33958e9b654a2f2947c` | Historical, **inactive**; never substitute it for Kernel |

Those sources and their complete source skill bundles are delivered through local Git bundles. Source adoption did not install host skills, update registrations, migrate product campaigns or attest a live product build. An existing runtime may deliberately be older.

## Active plan and next action

Use the [single canonical implementation plan](../superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md#3-порядок-и-зависимости) for the ordered queue. A1 is a bounded source-only result. The [W2 route-contract probe](w2-route-contract-probe-20260927.md) found safe status/refusal in one synthetic host-lost negative control; no code or active-skill repair was adopted. The [A1 measured source/CI first-run gate](measured-ci-a1-selection-20260927.md) is accepted on its exact source root; broader timing/repeatability remains open. The next universal-quality priority is a genuinely fresh, owner-qualified agent field task. Freeland-owned A3 fee semantics and A4 publisher integrity remain separate residuals, not universal prerequisites. None authorizes product work.

Hosted [source safety](https://github.com/solomindanil/qa-agent/actions/runs/36293311894) and the full [runtime run](https://github.com/solomindanil/qa-agent/actions/runs/36293311924) succeeded on exact implementation root `0cdc6ef`, attempt 1: isolated Console **167/167** including A1; disjoint full Kernel **1,787 passed, one skipped / 1,788**. This is one green current-source run, not stable-CI or agent-quality qualification. At earlier root `db396b1`, [workspace](https://github.com/solomindanil/qa-agent/actions/runs/36270720927) had one timeout with **433 passed**. At `56e3156`, [remaining compiler](https://github.com/solomindanil/qa-agent/actions/runs/36270260922) had one timeout with **1,338 passed and one skip**. Both earlier runs used the same selected Kernel and retained 30-second/10-second deadlines; the underlying timing cause is unproved. These are revision-specific outcomes, not a basis to relax assertions.

Read the [complete claim audit](../reviews/2026-09-27-external-review-reconciliation.md) for source-confirmed, conditional, unreproduced and inaccurate report statements. “Every item assessed” does not mean every reported runtime reproduction was rerun.

## Accepted work and limits

| Accepted bounded result | What remains outside it |
| --- | --- |
| [W0 baseline reconciliation](w0-baseline-reconciliation-20260927.md) and [W1 outcome/remaining consumer](w1-outcome-and-remaining-consumer-20260927.md) | The synthetic run retains **1/4 unaided first designs** and later assistance. Agentify T7 retains **21 original targets, one current PARTIAL caller-authored/unattested observation, 20 unobserved targets and 15 blockers**. Neither result closes W6/W7/I10, P2/P3/P5 or Agentify acceptance. Do not replay T7. |
| P0 integrity/findings and local source delivery: [Console](console-p0-adoption-20260920.md), [Freeland](freeland-source-adoption-20260920.md), later [public release](../releases/2026-09-26.md) | Earlier local-only gates and later hosted gates keep their own revisions and denominators. These do not establish every route's execution identity or every product's acceptance. |
| P1 immutable text/JSON observation writer/reader and [fresh consumer](observation-skill-reference-20260920.md#real-consumer-and-plan-boundary) | Caller-authored/unattested, zero attachments; not a managed PASS, generic manual-receipt acceptance or release GO. |
| [P2-A fee-caption helper](p2-semantic-repair-20260920.md), [intermediate browser assertions](browser-journey-adoption-20260914.md), media-type/JSON assertions | Preserve adopted repairs. A separate composite-fee assertion in `card-sbp.spec.ts` remains a source-backed gap; helper acceptance did not cover it. |
| [W2a registration snapshot source pair](w2a-registration-snapshot-adoption-20260924.md) | No live-plan synchronization or retained-workspace migration. W2a itself supplied no blanket legacy CLI guard; A1 below is a later separate repair. Do not reimplement W2a. |
| [A1 legacy CLI selected-source authority](a1-cli-source-authority-20260927.md) | All six shared CLI routes refuse wrong/dirty Kernel source before preparation and recheck immediately before spawn. Focused 4/4, related 21/21, fresh source consumer 4/4, root and cold-clone packaging 61/61; independent Astra AQA GO. This is not dependency/build attestation, immutable execution or product PASS. Five existing GET artifact tests remain non-green on a historical Kernel fixture path; unchanged-baseline reproduction was not performed. |
| [W0/W7 A1 measured CI selection](measured-ci-a1-selection-20260927.md) | The isolated Console list now includes A1: first hosted run executed its four cases, passed 167/167 selected Console cases and full Kernel 1,787 passed / one skipped / 1,788; root packaging 62/62. This is one source-gate run, not repeatability, agent-quality reliability or product acceptance. |
| [W2 status→recovery route probe](w2-route-contract-probe-20260927.md) | One synthetic host-lost negative control reached status and refused bare resume; independent Astra AQA GO for this control and targeted selected-source CLI tests 5/5. No product run, generalized replay, skill repair or W6/W7 acceptance. |
| [W2b evidence-write series](w2b-evidence-friction-series-20260923.md) | No new observation helper justified. [D13-479 authoring](d13-479-authoring-probe-20260924.md) is a separate bounded design decision, not adopted runtime code. |
| Ordinary status, [bounded continuation](campaign-continuation-20260914.md), [mixed handoff](mixed-handoff-execution-20260914.md), [graph consumer](graph-consumer-20260914.md) | Not full live mixed-ticket/help→reply→resume, process/host recovery, or demonstrated incremental graph-selection benefit. |
| [W7 installed-skill inventory](w7-installed-skill-drift-20260924.md) and source delivery | Inventory is not installation or fresh-host qualification. Full W7 and actual Claude execution remain open. |

Overall P0–P6 and universal QA reliability remain open. Freeland stays a **product pack with specialized execution/verdict semantics**, not the generic default. See [architecture and supported boundaries](../architecture.md).

## Known gaps and affected lanes

| Source-backed gap or limitation | Current disposition |
| --- | --- |
| Legacy Console CLI now checks selected Kernel source before preparation and spawn | [A1 qualifies this narrow guard](a1-cli-source-authority-20260927.md). It does not attest dependencies/build, prevent external source changes after the final check or migrate frozen campaigns. |
| Composite fixed-fee caption can evade the Freeland assertion; publisher uses weaker verdict/outbox validation than the strict reader | Narrow owning repairs queued. A passing current assertion does not validate the skipped fee clause; strict-reader acceptance does not qualify publisher consumption of a mutable outbox. |
| Console response-header oracle can persist actual `Set-Cookie`; generic OpenAPI handling does not prove Basic-credential redaction | Known artifact confidentiality gaps. Do not widen collection/export of sensitive artifacts on affected lanes. Record the exact owner decision if that lane is needed; independent public/synthetic work may continue. |
| Broker DNS/IP policy, browser route policy and Freeland Node/API requests have different enforcement | Do not claim one universal network/effect boundary. Qualify only the route actually used. Route-specific resource/worker guards remain required before expanding an affected lane. |
| V0/V1 recovery differs; watcher admission handoff is not implemented; HTTP approval digest is not authenticated human identity | Declared contracts must reflect actual routes. Historical reader or persisted receipt availability does not prove arbitrary recovery, concurrency safety or human approval. |
| CI selects subsets; code coverage and flake/agent-quality trends are not established as repository-wide metrics | Inventory exact test/command classes before adding unattended CI. Local full-suite results, hosted subsets and agent-quality trials have distinct denominators. |

[P2-B](p2-topup-ui-20260921.md) remains an **unaccepted, owner-deferred** candidate; the new header/OpenAPI findings do not silently revive that work. Existing restrictions remain in force. A1 fixes only the legacy CLI source check described above, not the other runtime gaps in this table.

<a id="retained-execution-record-and-former-queue-through-22-september"></a>

## Selected retained decisions

Historical chronology is in the [pre-review entry snapshot](current.20260927-pre-review.historical.md) and dated qualification/eval records. It is evidence, not the current queue.

- I06a.1 is documentary accepted; I06a.2–.4 are **not adopted** after [held-out NO-GO](../../evals/dialogue-quality/20260924-account-capabilities/heldout-h1h2-aqa-review.md); .5 needs product-owned retained-fixture authority.
- I07a's local paired-capture/consumer benefit was bounded and used a weaker requested-input protocol. General overlap/delay extension remains stopped **NO-NEW-CODE** after [source review](i07-correlation-source-review-20260926.md); no automatic Task4/5 or repeat consumer.
- [I10 compound decision](i10-final-compound-20260926.md) stops repeated synthetic microdiagnostics. Admit a genuinely fresh field task only with a normative oracle, binding, permitted effects and evidence destination. No prompt/controller expansion from failed improvement gates.
- [W7 public-source attempt](../../evals/dialogue-quality/20260926-public-source/RESULT.md) is partial; [lifetime preflight](w7-lifecycle-preflight-20260926.md) did not prove cross-turn survival. Earlier lifecycle causes remain unknown.
- I02/I03 VPN work is owner-gated/deferred, not the next universal-QA task. The prior proposal is not a normative oracle. A current production baseline supports future change comparison only in its declared scope.
- Realweb, MagicPay, Nuanu App and Freeland campaigns keep their own histories and blockers. An old local “pending” label does not reopen accepted Agentify T7 or authorize a product action.

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

When the product-selected integration is Nuanu Flow, use the available official host plugin and current product policy; delivery requires suitable authorization, dedupe and persisted readback. Product acceptance, owner risk acceptance and deployment readiness are separate decisions. No source gate overrides a production migration guard.

## Historical material

See the [documentation map](../README.md) and [archive policy/index](../archive/README.md). The [pre-review entry](current.20260927-pre-review.historical.md), [pre-correction entry](current.20260920-pre-entry.historical.md), dated plans, rejected candidates and first attempts are retained for provenance. Former “current”, “next” and “paused” text in snapshots describes those sessions, not present instructions.

Historical links may refer to optional, undelivered private records. Missing evidence stays unavailable, not silently reconstructed. For active-code searches, scope to selected components and root tools/tests/skills; search `references/`, dated evidence and `*.historical.md` for a deliberate historical question. Do not delete old bundles merely because they are not manifest-selected.
