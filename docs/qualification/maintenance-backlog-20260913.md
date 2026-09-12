# Current maintenance: facts, limits and next controls

13 September 2026. This is the portable decision summary for the [approved global plan](../superpowers/plans/2026-09-13-universal-qa-global-plan.md). It is sufficient to understand the current gaps without the author's chats or `.local` reports. It does not replace missing raw evidence, confer product permissions or qualify a repair. Older records retain their original attribution.

## What a clone actually contains

The [manifest](../../sources/manifest.v1.json) selects complete local Git bundles: Kernel `15a067c9a694de26460102ce5dadb9707c7977b1`, Console `b392e888bc8bfc98a756ba7e971a86000d6f2098`, Freeland `9c2509e32462319d5b96ccb49d5ae2070df7b18d`. Reporting Kernel `10d398d8a077068c2184f33958e9b654a2f2947c` is reference-only. `sources:restore` materializes the ignored `components/` directories; their absence before restore is expected, not a missing-source defect. The separate Console is the universal owner; Freeland's embedded legacy Console is not its replacement.

On a new independent normal clone of root `b604df4f0b2684a64d69d6e53ae45679020eb986`, local bundle restore succeeded and root tests passed **57/57**, no failed/skipped/cancelled. Those checks include cold restoration and donor-independence controls. They do not prove browser installation, every OS, live product access, full QA or cloud operation. Component libraries remain separately installed from lockfiles.

This private repository carries product-specific source knowledge. Do not publish it publicly or export client materials merely because they are not passwords. Credentials, sessions, live registrations, campaign outcomes and action authority are separate runtime inputs. Frozen donor paths in provenance are historical identity strings, not automatically file reads; do not rewrite them without their owning verifier/tests.

## Open correctness findings and owning seams

Source links resolve after restore. Evidence strength is intentionally explicit; a retained local probe is not re-executed by reading this page.

| ID / priority | Finding and scope | Owning source / required acceptance |
| --- | --- | --- |
| M1 / P1 | Freeland guard admits a SharedWorker created between its target scan and async constructor ban. A real loopback sentinel followed a redirect to forbidden checkout GET, got 200, left no attempts and passed the no-mutation assertion. Reproduced on repair `722bf1b`; not measured in a live product. | [pay-sheet.ts](../../components/freeland/tests/freeland-staging-replacements/support/pay-sheet.ts), whose delivered source is still 9c. Settle the supported admission boundary before product JS runs; repeat actual setup-interleaving negative plus safe reads. Do not claim read-only from the vulnerable helper alone. |
| M2 / P1 | Actual loopback reproduction on b392 retained PASS in trace/result/receipt after a blocked POST or close rejection without dependency metadata. Fixed and reviewed in inactive dc8eb59, fresh121/121 gate; active pin remains unchanged. | [Repair, exact source and replay](console-finalization-review-20260913.md). Final flags now reconciled regardless of optional summary; six real-browser controls verify all persisted outcomes and safe positive. Adoption remains pending. |
| M3 / P1 | Reproduced with two independent processes: both succeeded from one expected digest. A per-plan admission repair is implemented in inactive b474d52, with215/215 selected controls; independent review remains pending because its host is unavailable. | [Exact source, replay, outcomes and review gate](console-plan-write-candidate-20260913.md); owner writeCampaignPlan. One owner covers condition, publish and readback; interrupted/uncertain writes are not blindly retried. No live corruption or active adoption claimed. |
| M4 / P1 integrity | Kernel's public expected-absent writer has the same check/rename flaw. Controlled probe accepted two different writes. Higher registration/discovery owners have additional fences; lost authoritative dispatch/registration is not established. | [private-store.ts](../../components/kernel/src/kernel/private-store.ts), writePrivateFileAtomic: test absent and digest cases in separate processes; retain existing higher fences and interrupted-write reconciliation. Avoid rewriting all callers as an inferred necessity. |
| M5 / P2 | Markdown backticks hid true file links. Fixed in inactive b30ef13: full owning offline2758/2758, cold19/19, independent review pending. The active old parser is unchanged. | [Exact repair and replay](graph-locator-candidate-20260913.md): real corpus restores five paths and drops eleven non-source tokens without inventing acceptance; parse/build/impact controls retained. |
| M6 / before new consumer | Public generic manual receipt validation accepted plain text instead of required screenshot and capture after an old handoff expiry. Stored negative probe reviewed, not live Console/I2 acceptance. | [run-receipt contract](../../components/kernel/src/contracts/run-receipt.ts): agree action/capture/expiry semantics first; enforce kinds/identity/time as supported. Keep legitimate historical evidence and shared-check cases. Do not connect an unqualified public API to a new runtime. |

Until these fixes pass relevant controls and review, do not claim the affected path's guarantee. A missing capability or unsafe path blocks that path, not independently authorized work with another supported mechanism. Fresh identity and scope remain necessary even on previously accepted code.

## Latest Freeland repair — explicitly not adopted

**M1 follow-up:** source `9f848bb01f0fdde3f6b0841019243e64494e24b5` closes the
bounded SharedWorker setup-admission defect with an owned Playwright page fixture,
including first-document, iframe, cleanup and late-denial controls. Independent
Lead AQA and whole-delivery review passed; fresh full offline gate2753 test
executions passed, root packaging57/57 and cold archive restoration passed.
[The repair report](browser-guard-admission-review-20260913.md) records both failed
intermediate gates, the test-quality correction, exact identities and limits.
This source is delivered as an inactive archive, not selected by the active
manifest. Historical qualified declarations remain stale with no receipt authority;
no old PASS was transferred. M2 has since been repaired in separate inactive
Console dc8eb59 ([report](console-finalization-review-20260913.md)). M3 and M5
are implemented and locally verified but await independent review; M4's isolated
repair passed41 focused and56 registration controls after fixing a real recovery
compatibility regression; its unfiltered full gate is still running. M6 and
active-source adoption remain open. Do not restart M1 or mistake archive delivery
for adoption.

Stage2 E1 has an [inactive successor6e84afb](public-input-candidate-20260913.md):
124/124 input/ingestion controls and4/4 cold reader checks. Earlier00e4102 had262/262
controls but its separate receipt reader rejected literal plans; raw JSON readback
was insufficient. That concrete integration defect is repaired in the successor. Source review, current
skill-reference qualification and fresh-agent use are still separate open exits.

The preceding rejected source and its original evidence remain historical:

Candidate `722bf1be5f08cc1904808af749e9c1c7f5b96881`, tree `aab9c1c340c2cafca6e5f5d914c2a1f045c3d2c4`, includes reviewed work on single-ticket binding, continuation instructions, route readiness, bounded request journaling, source-grounded graph links and Obsidian UNCOMPUTED views. Its full internal gate completed 2739 executions with no failures/skips/cancellations: 426 main, 1382 graph/verdict, 658 replacements, 70 overlapping transport, 23 baseline, 115 canaries, 65 embedded Console. These are **not 2739 unique product tests**.

Independent final review reproduced M1 despite that green gate. Therefore **NOT READY TO ADOPT**. Canonical Freeland pin, installed skills and existing campaigns have not switched. The code is preserved in the repository as an [explicitly inactive development bundle](../../sources/candidates/README.md), with independent review/repair instructions and an exact pack checksum. It is not in the active manifest and is not restored automatically. A new developer can inspect that source without the author's checkout; a product consumer must not silently fall back to it. Cold source integrity is not adoption approval.

Historical full-gate log SHA256: `54c6dbde6bff6d8c9d1265df7cec90349e78c5f48424c58f5082ac0cc20c902d`. The private raw log is not included here; this summary preserves attribution, not independently replayable proof. Repairs must ship their nonsecret regression controls and relevant source with the accepted bundle.

## Does the graph help?

Yes, in a measured narrow dependency: selector source → VPN provider-selection flow → two original Product-CI tests. Actual builder/impact/planner selected both; removing the new edge removed targeted selection. Unmapped source retained full fallback. A fresh reasoning consumer used the trace but needed factual/proportionality corrections; this was not a clean blind first-attempt success.

On the repaired graph, inventory remains 136 requirements, 89 manual nodes, 97 mapped automated nodes. Strict validation still reports 176 overlapping diagnostics: 37 requirements without test owner, 36 excluded from automation, 1 coverage gap, 85 unresolved critical source locators, 17 orphan semantic nodes. These are not 176 separate untested requirements. Eight historical ticket nodes are not coverage of the new QA queue.

Actual release policy still falls back to full on this debt. A synthetic two-test selection is not a narrowed accepted release or executed provider check. Full-mode readiness follows its explicit policy; a valid graph build is not live-deployment or release proof. Current planner JSON priority also does not control actual Playwright order: wire and measure the existing order before experimenting with ML.

## Useful execution and dialogue gaps

- Catalog-bound Console fill/select currently has no admitted representation for an ordinary nonsecret text value. Underlying browser interaction exists, but bypassing catalog validation is not an accepted workaround. First qualification target: normal search/filter, missing-result defect and healthy unusual behavior, with correct persisted evidence.
- Receipt-bound agent review interprets existing saved artifacts. It does not ingest arbitrary new browser observations or upgrade verdict. The active Kernel lacks the optional reporting API; do not activate reference-only Kernel to obtain it. Local fallback observations must retain their unsealed status.
- Continuation improvements recovered eight Freeland tickets plus VELVET without asking for repeated purchases in a bounded fresh-consumer exercise. They do not prove complete crash recovery. Next: actual interruption, fresh process, preserved completed checks, remaining-only work and unknown-effect reconciliation.
- A [portable real interruption probe](../../evals/campaign-continuation/README.md)
  now reproduces the specific Console gap on6e84afb: completed attempt files survive
  SIGKILL, but the fresh reader returns null without a terminal receipt; ordinary
  execution repeats the finished first check. This is a diagnosed missing campaign
  continuation contract, not a false product PASS or an accepted recovery feature.
- Preserve full acceptance conditions and original reproduction. Missing fixture or access is QA-blocked, not automatically development In Progress; a workaround or generic green suite is not a ticket FIXED. Human requests name exactly what to do, where, and what resumes; independent work continues.
- Six source-skill reasoning controls were adequate after review, but were open-context answers, not autonomous execution against withheld seeded defects. Qualify actual independent test design/execution, false bug/pass, lost scope and unnecessary human blocks before an autonomy claim.
- Read/repair of the shared registration store may touch unrelated product history. Measure target-scoped continuation and damaged-neighbour behavior before adding new indexes or memory services.

## Remaining portability work after first-use documentation

1. Continue delivering reviewed reusable code and nonsecret regression/eval material, with candidate/accepted/historical status. The unadopted repair source is now archived here; its raw private review workspace and locally retained evaluation material are not delivered. No blanket claim that every historical commit has now been incorporated.
2. Console build/typecheck currently changes tracked tsconfig.tsbuildinfo. Fix its owning source/ignore policy and repin after review; do not disable source integrity checks or auto-reset a dirty checkout.
3. Correct owning Console README's old mandatory-I2 sequence; current source qa-init already routes to qa-product-v0 after registration. Root first-use guidance names that current route.
4. Freeland full verification has an explicit Node20 override and local platform/temp/lock assumptions. Configure/qualify the chosen host; Node22 root packaging success is not cross-platform runtime qualification. Reconcile old operational runbook commands with actual CLI; watcher remains intentionally blocked pending its admission design.
5. Product permissions must be re-established for a new user. In particular, Freeland contains historical committed standing-authorization data: cloning it is not consent. Before transferable paid execution, verify how fresh product/owner authority is enforced; no inherited spending on a new host.
6. Existing private account/registration/session data may still refer to legacy owner storage. Either explicitly import through owning tools with permission, or create separately scoped new state. Do not copy author secrets into Git, fake a registration or repeat an unresolved operation to reconstruct it.

## Next implementation order

Complete portable entry and tracked current knowledge; close M1/M2 and conditional-write boundaries with their owning regressions, repair M5, then integrate exact accepted bundles. Run a useful independent product slice and executable agent-quality baseline in parallel wherever those boundaries do not affect it. After acceptance, use the existing graph/help/learning tools in a fresh continuation. Cloud, actual Claude-host operation and new paid capabilities remain separately qualified exits in the global plan.
