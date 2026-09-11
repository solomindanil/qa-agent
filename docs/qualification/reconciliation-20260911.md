# Cross-repository reconciliation — 2026-09-11

## What was reconciled

This is a QA-harness source and local functional qualification, **not a new product release campaign**. The starting main directory was `48bccef`; the latest reviewed outer source was `c3f9ca2`. All 28 discovered outer reachable/reflog commits were already included in that source. New integration does not recreate or replace the existing runners.

The census distinguished real repositories from normal clones, worktrees, orphaned worktree remnants, 227 synthetic test Git repositories, product-owned workspaces and private evidence. It compared actual source bytes, reachable histories, branch-only commits, patch equivalents and unique dirty source, rather than choosing by modification date.

Independent detailed audits are preserved with their original locators and limitations:

- [Console / Kernel / QA Starter, Lead AQA](../../references/reconciled-20260911/reconciliation-audits/CORE-AUDIT.md.txt).
- [Freeland / legacy / graph](../../references/reconciled-20260911/reconciliation-audits/FREELAND-AUDIT.md.txt).
- [Complete skills / host delivery / other products](../../references/reconciled-20260911/reconciliation-audits/SKILLS-PROJECTS-AUDIT.md.txt).
- [Distinct QAH, Nuanu App, Nuanu Flow E2E and acceptance-boundary branches](../../references/legacy-nuanu-20260911/reconciliation-audit/LEGACY-NUANU-AUDIT.md.txt).

Configured QA remote tips were checked read-only. The qa-agent remote had no newer source than the local reviewed lineage; the separate ai-native draft remained at its known tips. Several local-only repositories have no network remote. This does not attest every product remote, deleted temporary object, unknown private probe or all application tests.

## Source decisions

| Area | Decision |
| --- | --- |
| Outer qa-agent | Adopt the complete reviewed lineage into the main directory, with current source/skill routing and qualification |
| Console + Kernel | Existing accepted pair includes the substantive runtime work; correct Console's discovered stale entry defaults separately, keep exact authority validation |
| FreelandQAmain | Keep `9c2509e32462319d5b96ccb49d5ae2070df7b18d`; donor imports and later replacements are recorded in its provenance |
| Kernel reporting `10d398d` | Preserve inactive; activating it would lose later reviewed graph/security changes |
| Generic qa-check | Deliver the reviewed thin router **and** matching product-aware UI metadata |
| Generic qa-bugfix | Adopt exact historically reviewed V3 plus its self-contained template/metadata; no unconditional Linear or premature QA acceptance |
| qa-init / qa-product-v0 | All 15 installed members already match accepted source across three host directories; preserve rather than reinstall unnecessarily |
| Freeland specialist | Exact matching source and three host copies remain frozen for the active owner |
| Unique historical work | [122 cross-project snapshots](../../references/reconciled-20260911/README.md) +[269 legacy Nuanu snapshots](../../references/legacy-nuanu-20260911/README.md), including applicable notices and audits; retained inactive, no wholesale legacy repository or secret copy |
| Product workspaces / credentials | Remain with their existing owners; registration and payment/session authority are not migrated by source adoption |

The additional four legacy Nuanu ranges account for188 unique commits outside their comparison base. Their ledger lists every commit/parent/subject in that scope; it does not bundle every historical blob. Selected HEAD snapshots and25 dirty/untracked overlays are separate, including3 explicit working-tree deletions. Historical platform identifiers remain private metadata, never current permission. Accessibility/performance and broader Nuanu E2E source **do exist** in this archive; they have not been qualified as current generic capabilities. Original donor repositories and excluded shared dependencies remain available in place for deliberate later reuse.

## Fresh qualification

### Actual consolidation defects addressed

1. The main qa-agent directory still selected older components despite a newer reviewed assembly existing privately. Canonical adoption must move the reviewed lineage into the main directory, not merely create another scratch checkout.
2. Generic installed `qa-check`/`qa-bugfix` still carried Linear-only routing/metadata, while reviewed product-aware source already existed. The complete selected bundles now include their resource and license, not only SKILL.md.
3. Console's README, default Playwright config, registration runtime and fixture helper selected obsolete sibling/machine paths or an old Kernel pin. The bounded correction requires explicit selected paths while preserving the existing exact Kernel authority.
4. Independent review caught an additional unconfigured Console read of the historical home receipt store. The fix suppresses that read/persistence without a selected workspace/state, with positive controls preserving explicitly configured behavior.
5. Unique QAH/Nuanu/product/reference work had not been represented by the active assembly inventory. It is now preserved and dispositioned separately instead of either losing it or activating another incompatible engine.

These are harness/source-delivery changes. They do not fix product bugs, fill every graph requirement, replace a missing provider capability or migrate an active owner's data.

Raw command records, full logs, generated build output, inventories and copy/readback records are retained privately under `.local/full-reconciliation-20260911.0l1hJ4/`. Separate source attribution is mandatory: tests of an old component are not automatically tests of its successor.

| Exact source | Selected fresh gate | Result |
| --- | --- | --- |
| Outer `c3f9ca2` | Root restore / verify and packaging controls | 52/52; four source bundles restored and verified |
| Kernel `15a067c` | Typecheck, build, seven contract/knowledge/private-store/security files | Exit 0; 270/270 |
| Console `f3660d0` | Typecheck, build, six real local fixture/CLI/review/help files | Exit 0; 53/53 |
| Freeland `9c2509e` | Provenance, typecheck, main + staging-launcher controls | Exit 0; 376/376 |

Freeland was then qualified more broadly on the same unchanged component: release/graph/verdict controls **1,335**, replacement controls **658**, and transport **70**. Transport is already included in the release set, so the fresh total is **2,369 unique passing tests**, including the earlier376, not2,439. The private binding preflight also passed (five selectors/eight bindings); it reads source contracts and is not a product run.

Three mobile-discovery controls in `tests/product-graph/freeland-staging-mobile-gate.test.mjs` were deliberately **not run**: standard mobile scheduling, HTML report preservation while listing, and emulation metadata. Their subprocess invokes `test:staging --list` through an unconditional global admission lock at `/var/tmp/freeland-qa-coordination`. Acquiring or provisioning that shared lock is outside this isolated reconciliation and may conflict with the live owner. The native test filter excludes them before TAP accounting: `skipped:0` in those logs must not be reported as all tests executed. Therefore this reconciliation does **not** claim a fresh full `qa:verify` PASS. A separately scoped hermetic discovery test or explicitly coordinated admission test remains open.

The complete generic skill bundles passed five packaging controls and the outer suite57/57 twice. Three fresh no-write agent consumer cases covered missing tracker capability, an unexpected regression PASS, and a developer handoff that must not be misrepresented as deployed QA acceptance. Independent Lead AQA review approved that bounded source adoption. These are known-case decision samples, not a blind reliability benchmark or actual Claude-host execution. Donor MIT notices travel with both bundles.

The Console portable-entry candidate passed the six functional files53/53, then independent review found and reproduced the implicit receipt read. Final reviewed commit **`718bf86f6649b1c15ae1ce1999c4a6ffd5a902ac`** passed **120/120 compatibility controls**, **8/8 affected public-auth/graph/regression records**, and typecheck/build exit0. The other45 functional records have unchanged inspected dependencies; they remain attributed to the earlier six-file run, not a claimed rerun of all53 on the final commit. Independent final source review found no open Critical/Important issue. This correction keeps `server/kernel-authority.mjs` byte-identical and the exact Kernel15a067c requirement intact.

Console lint is **not green**: three pre-existing unused destructuring variables remain in unchanged `src/lib/qa-agent-review-v0.ts:91`. Its bytes equal the base; no suppression or unrelated change was added. Changed frontend code passed scoped lint. The build still warns about a large bundle. These are maintenance findings, separate from the fresh functional results.

The Console fixture exercises healthy versus leaking pages, authored execution, finding-to-reviewed-graph/regression publication, stale-input rejection, independent progress while waiting for help, interrupted unknown-outcome handling and separately attributed agent reviews. Kernel checks include actual graph publication/readback and preservation of previous run history. These are local fixtures, not a substitute for product-specific acceptance or a percentage of all-product coverage.

Observed non-product issues are retained: the first dependency-install attempts were rejected because the private recorder incorrectly used the same npm file for user/global configuration; distinct files resolved this before installation. Console's compiler rewrote its tracked cache; the generated output was preserved and only that known artifact restored. Its build reports a large bundle warning; pinned eslint reports deprecation. No check was weakened to hide these observations.

### Canonical local delivery

Reviewed source commit `0f508ba54d6a7e2dd356a460db5ce3efa852c536`, tree `078a321108f516fd4d113c415e287df3c3f37dfe`, was restored in a new normal clone using only its own bundles: source restore/verify exit0, root57/57 and450/450 tracked root files identical. Independent Lead AQA accepted that exact tree and the post-cold adoption gate.

The main qa-agent directory was then fast-forwarded from48bccef to that reviewed source. Three old component directories and both differing untracked plans were preserved under `.local/full-reconciliation-20260911.0l1hJ4/main-before.A7fgRs/`, with original hashes/HEADs rechecked; the unchanged inactive reporting child was retained in place. The original root also remains at local ref `codex/pre-reconciliation-20260911`. Nothing was deleted or pushed remotely.

Main components were restored from the new manifest. Dependencies were separately installed offline from each lockfile with lifecycle scripts disabled: Kernel54, Console296 and Freeland8 packages. Main Kernel/Console builds and Freeland typecheck exited0. Generated Console compiler cache was preserved before restoring only that known artifact; main source verification passed again. This makes the main source locally provisioned, not a configured product campaign or a cloud service.

The reviewed complete `qa-check`/`qa-bugfix` bundles were selectively delivered to the three host skill directories:21/21 files match canonical source. The other18 qa-init/product/Freeland files remain unchanged and also match their selected source. The existing machine index now points to the main source; both Freeland and Agentify owner-binding lines are byte-identical to its backup. Backups/readbacks and raw installation/build logs remain in the reconciliation's private directory. File delivery to Claude is not an actual Claude execution result.

Full staged whitespace checking reports preserved donor whitespace and the copied historical September10 plan's final blank line. Those exact snapshots were not reformatted to manufacture a green result. The scoped current-code check excluding those historical paths passed. Earlier `git diff --check` results applied to unstaged changes and must not be relabeled as a full staged-history check.

### Fresh entry-consumer readback

A separate fresh-context Codex consumer exercised three read-only routing/intake requests on main source `0f508ba`: continue Freeland QA-column review, continue Agentify, and start an unfamiliar appointment-booking product. It checked installed instruction parity (7/7 selected files), root source verification, actual owner identities and existing product models. No live product, browser, tracker or account operation occurred.

The consumer kept Freeland's frozen harness/private graph with its active owner, and kept Agentify on its existing Console `f3660d0` / Kernel `15a067c` runtime rather than silently adopting the newer source. Agentify's existing `read-review` and `validate` CLI paths exited0: the former distinguished a historical agent review from the current retained receipt; the latter reported `readyToRun:false`, one executable target and20 blocked targets. Those are local evidence/plan readbacks, not a new product campaign.

For the unfamiliar product, the consumer requested the missing target/environment, offered to investigate roles/materials itself, and separated hypothetical risks from sourced expectations. It retained product-design, dependency, accessibility/security/performance questions without inventing requirements or permitting bookings/payments. This is one known-case Codex routing sample, not a blind benchmark or actual Claude qualification.

Full private report, including the post-sample attribution correction below: `.local/full-reconciliation-20260911.0l1hJ4/FRESH-CONSUMER.md`, SHA-256 `ce4c11a7669f7007f645a6ea3a90cbe045e3793a5aa4a98902110705eab288b2`.

Final independent review corrected one consumer-report omission: the baseline-first paragraph and false automatic-bug claim were present in both the frozen Agentify README and canonical Console718, not only the owner copy. The actual runner already returns `needs_review` / `INCONCLUSIVE` with no dossier for two matching oracle failures. Its existing exact control was rerun successfully (1/1); no runtime fix was needed.

Separately reviewed Console **`b392e888bc8bfc98a756ba7e971a86000d6f2098`**, tree `3de13e3512835a66f00d9b57032709c6b2658523`, changes only README relative to718. It corrects analysis-before-registration, registration/recovery/I2 routing, existing/authored plans, optional baseline and unresolved-only oracle approval, and diagnosis rather than automatic bug confirmation. All runtime, test and skill bytes are unchanged. The final manifest selects this README-only successor and its complete-history bundle. The consumer remains attributed to0f508ba/Console718; it is not relabeled as a new-source execution.

Two residual instruction hazards need a separately reviewed owner-compatible follow-up:

- The frozen Agentify owner checkout's old README still names an obsolete Kernel and baseline/oracle guidance. Current complete installed skills, checkpoint and embedded exact Kernel authority resolved the conflict in this sample. The final canonical README successor above corrects that guidance; the old owner checkout was deliberately not edited during its campaign.
- The frozen Freeland specialist's area-exploration paragraph references recon/matrix content no longer present in routing-only `qa-check`. The explicit QA-column route worked; that does not qualify the separate area-exploration cross-reference. Repair it in the specialist source after coordination, preserving current owner identities and scope.

Historical runbook access/spend examples also remain dated references, not current authority. Final documentation readbacks retain their own attribution. This delivery does not establish a full component-suite, product or cloud readiness claim.

## What this does not close

- An arbitrary new product still needs product analysis, sources of expectations, roles/journeys, test data and capabilities. An empty generated graph is not coverage.
- Graph incompleteness and unmapped changes remain visible; historical proof snapshots do not turn them green.
- Real Freeland checkout/payment and exact-session issues remain with the product owner; no payment or product campaign ran during this reconciliation.
- Agent-led observations without supported storage remain explicitly unsealed. Reporting was not activated to bypass that limit.
- File parity across Codex/Claude is not actual execution on both hosts. Actual current Claude and cloud operation remain separate qualification steps.
- Specialized native/mobile, provider-internal, performance, security and agent/MCP contracts require scoped tools and evidence; the current harness does not claim universal coverage out of the box.

The next useful product task must both use the canonical source/skills and turn a demonstrated reusable gap into a reviewed shared change. A one-off script or extra report alone is not an improvement to the harness.
