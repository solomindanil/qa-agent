# Independent Lead AQA and operations review — P6 tracked entry

## Verdict

**Spec compliance: NEEDS ONE CORRECTION.** The candidate satisfies the requested docs-only scope, source/runtime/owner/authority separation, exact historical preservation, no-loss plan delivery, bounded P1 attribution and operational prohibitions. One active-plan preamble defect remains: it still presents obsolete P0 work as the immediate start despite the current entry selecting only the P2 fee-caption regression.

**Task quality: NEEDS FIX BEFORE CANONICAL ADOPTION.** No runtime, manifest, source, skill, campaign, permission or secret defect was found. The remaining issue is small in bytes but material to the slice's purpose: a fresh reader can receive two conflicting next-action instructions from documents that are both presented as current.

This verdict is limited to the tracked-entry candidate `aa31ba548f049633350d7602ccf2902273fe0e31..c35e433ce3db63558c3d89cf01b527592b9cc1b0`. It is not a product PASS, whole-P6 acceptance, universal-readiness claim, Claude/cloud qualification, or approval for installation, registration, migration, tracker, payment, deployment or live-product work.

## Finding

### Important — the active plan still advertises obsolete P0 work as the immediate start

`docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md:7` remains headed “Ближайший результат” and says to start with P0 source/CI and adoption of ready repairs. `:21` also says the P0 source candidates are implemented but still awaiting delivery acceptance. Both statements are outside an explicitly historical section and conflict with:

- the updated status at `:5`, which says the P0 repairs and bounded P1 writer/reader/reference are in the selected successors and must not be repeated;
- `docs/qualification/current.md:22`, which names the single next implementation as the P2 semantic fee-caption regression and says not to rebuild completed P0/P1 mechanisms; and
- `docs/qualification/current.md:30-33`, which records bounded P0/P1 acceptance while keeping overall P0–P6, full P1, broader agent quality, Claude and end-to-end gates open.

The status paragraph points readers back to the current checkpoint, so the conflict is mitigated, but not eliminated: the very next bold paragraph is still an imperative current-looking instruction. That undermines the entry correction's core operational goal and can cause duplicate P0 work.

**Required correction:** update or explicitly label the stale action/status phrases at plan lines 7 and 21 so they preserve historical meaning without competing with the current P2 next action. This should not alter any P0–P7 obligation or acceptance gate. Retain the exact `3accb18` snapshot as the historical original.

## Compliance evidence

- Candidate identity is exact: HEAD `c35e433ce3db63558c3d89cf01b527592b9cc1b0` has sole parent `aa31ba548f049633350d7602ccf2902273fe0e31`; the candidate worktree was clean during review.
- The change is ten documentation files only. `AGENTS.md`, `CLAUDE.md`, manifest, products, package/lock files, sources, components, tools, tests and skills have no base-to-head diff. `git diff --check` passed.
- `docs/qualification/current.md:9-16` exactly projects the manifest commits: Kernel `aa5d2d1…`, Console `c421160…`, Freeland `d4754f7…`, and inactive reporting reference `10d398d…`. Lines 3, 16, 47, 51-53 and 61 keep source selection distinct from frozen campaign runtime/owner, host capability and product authority.
- The current entry retains one narrow P2 next implementation at `docs/qualification/current.md:22`, keeps the original card-top-up wallet-dialog gap separate and open, and explicitly leaves larger P3–P6 exits plus P7 authority open at `:20-24` and `:33`.
- The bounded P1 evidence is not relabelled from the earlier process-only trial. `docs/qualification/observation-skill-reference-20260920.md:32-38` distinguishes that older process check from the separate fresh-context agent that reused A, performed C, wrote/read back an unattested observation and retained 21 targets / 2 observed / 19 unobserved. Full P1, statistical reliability, installed-Claude parity and cloud remain open.
- Exact preservation passed against the audited canonical owner bytes: pre-entry current `1f72c2d…`, pre-entry roadmap `4f376744…`, D10 `f49e739…`, original P0–P7 plan `3accb18…`, D13 `072bea2…`, and the 6 September plan `7576b46…`. The current plan is byte-identical to the original snapshot after excluding only the replacement Status paragraph and the appended portability section; no obligation body changed.
- Mechanical no-loss reconciliation passed: D13 contains 55 checkbox entries, 14 checked, and the matrix lists all 55 exactly once; D10 contains 42 checkbox entries, one checked, and the matrix lists all 42 exactly once. Missing, duplicate and extraneous references were all zero.
- All 50 relative Markdown links in `AGENTS.md`, current, roadmap and the skill entry page resolve in the restored candidate. The two active fragment links also match their target headings. Four deliberately absent plan links are identified by the portability appendix as optional historical material, not onboarding prerequisites.
- The supplied `p6-entry-c35e433.diff` names the exact base/head, includes the expected ten-file stat, and its embedded patch passes `git apply --reverse --check --index` against the exact candidate. Its larger merged context hunk is a presentation difference, not a content or applicability mismatch.
- A redacted signature scan of all ten changed files found no private-key, OpenAI/GitHub/AWS/Slack token, or assigned-secret pattern. No referenced private locator or credential was opened.

## Review limits

Per the brief, this review did not rerun the 61-test root package, source verification, component/product suites, browsers, networks or live products; it did not install dependencies or skills; and it did not perform the separately pending cold-clone or fresh-actor gate. The implementer's reported 61/61 and four-source verification remain supplied evidence, not a duplicate run by this reviewer. Apart from this requested report, no candidate repository file or Git state was changed by this review.

---

## Scoped fix re-review — `c35e433..a2f8b64`

**Original Important finding: ADDRESSED.** `docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md:7` now explicitly labels the former P0 order as historical, says it does not select current work, and routes the current next step to the checkpoint's P2 semantic fee-caption regression. Line 21 likewise dates the old P0 candidate/adoption status and routes present status and priority to the current checkpoint. The two formerly current-looking statements no longer compete with `docs/qualification/current.md:22`.

**New fix-introduced breakage: none found.** The fix changes exactly the plan and its delivery record. The plan is byte-identical before and after the fix from `## Неизменные ограничения исполнения` onward, so checklists, obligations and acceptance gates are unchanged. The exact `3accb18` snapshot remains untouched. `docs/qualification/tracked-entry-delivery-20260920.md:9` accurately discloses the two preamble status annotations without claiming review acceptance, cold/fresh completion or canonical adoption.

Focused mechanical checks passed: exact head `a2f8b648fd762a79d4335f2c9523577e1500a0ec` with parent `c35e433ce3db63558c3d89cf01b527592b9cc1b0`, clean candidate worktree, two expected documentation paths only, `git diff --check`, invariant plan-body equality, and reverse/index applicability of the supplied fix patch.

**Scoped spec verdict: COMPLIANT. Task quality: APPROVED for the two-file fix.** This clears the original review finding only. All original limits remain: no repeated suites, source verification, link crawl, product/browser/network work, cold-clone trial or fresh-actor trial was performed here; those separately pending delivery gates are not converted into PASS by this re-review.
