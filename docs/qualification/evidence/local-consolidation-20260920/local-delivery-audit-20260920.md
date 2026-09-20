# Local non-bundle delivery audit — 20 September 2026

## Scope, result and exact inventory

Read-only consolidation audit of canonical root `c65a8f540b31857033a6cb12e2bf4687755ebac4`, compared with reviewed successor `48e9fc91177c4866e1e10e958fbfb6e93ac2d327` at `.local/p6-entry-20260920.pnU6mK/root`. Canonical selected Freeland is d4754f7; the reviewed successor selects 0ea2df1. These are source selections, not campaign migrations or live deployment claims.

The initial `git status --porcelain=v1 -uall` contained **49 paths: 3 modified tracked files, 43 untracked non-bundle files, and 3 untracked bundles**. This audit owns all **46 non-bundle files**, not the three bundles. Classification: **6 current-delivery candidates, 31 historical records, 9 inactive drafts/prototypes**. Privacy is an additional restriction, not an additive file count. No file is recommended for deletion.

All 43 untracked non-bundle paths are absent at the same path in the reviewed successor. The three tracked modified files differ there. Two content-identical historical duplicates already exist at other accepted paths; preserve that equivalence explicitly instead of promoting them again.

**Disposition:** integrate the six current-document/eval changes after review; retain historical material with immutable attribution and an archival index; retain the Android prototype as inactive source, not as a newly accepted execution lane. Do not bulk-promote old checkpoints as current guidance. Two conditional P1 delivery blockers are below.

## P1 consolidation blockers

### P1-A — silently omitted raw evidence would make archival delivery incomplete

The historical qualification pages link to **13 existing raw `.log` files absent from the reviewed successor**. Root `.gitignore` ignores `*.log`; an ordinary add of the 46-path status inventory does not collect these. All linked targets exist on this machine, so a local link-existence check alone falsely suggests portability.

Affected qualification sources:

- `docs/qualification/freeland-pay-readiness-integration-20260920.md:22`: six logs under its original evidence directory.
- `docs/qualification/p0-findings-repair-20260917.md:38`: four original/combined logs.
- `docs/qualification/p0-payment-composition-repair-20260917.md:31`: three comparison/cold logs.

Exact missing-in-successor paths:

1. `docs/qualification/evidence/freeland-pay-readiness-20260920/freeland-integration-red-old-v1.log`
2. `docs/qualification/evidence/freeland-pay-readiness-20260920/freeland-integration-final-verification.log`
3. `docs/qualification/evidence/freeland-pay-readiness-20260920/freeland-integration-main-readiness-131.log`
4. `docs/qualification/evidence/freeland-pay-readiness-20260920/freeland-integration-invariants.log`
5. `docs/qualification/evidence/freeland-pay-readiness-20260920/freeland-integration-registry-source-state.log`
6. `docs/qualification/evidence/freeland-pay-readiness-20260920/freeland-source-ci-red.log`
7. `docs/qualification/evidence/p0-findings-repair-20260917/p0-2-red.log`
8. `docs/qualification/evidence/p0-findings-repair-20260917/p0-2-green.log`
9. `docs/qualification/evidence/p0-findings-repair-20260917/main-combined.log`
10. `docs/qualification/evidence/p0-findings-repair-20260917/cold-combined.log`
11. `docs/qualification/evidence/p0-pay-composition-20260917/main-comparison.log`
12. `docs/qualification/evidence/p0-pay-composition-20260917/p0-3-cold-oracle.log`
13. `docs/qualification/evidence/p0-pay-composition-20260917/p0-3-cold-registry.log`

Safe resolution: separately inspect/redact/hash these exact logs and deliberately include approved bytes, or explicitly mark the unavailable evidence in the archival index and avoid claiming a complete portable evidence packet. Some later adoption logs already carry equivalent historical runs under another directory; verify byte equivalence before mapping them. Do not broadly unignore all logs, import whole `.local` roots, or recreate original RED chronology. These 13 files are discovered dependencies, not part of the initial 46-file count and not fully privacy-reviewed by this audit.

### P1-B — historical candidate/paused instructions must not regain current authority

Several files contain valid historical statements that contradict the already accepted successor if read as today's entry:

- `docs/qualification/p0-authority-repair-20260917.md:3` and `p0-findings-repair-20260917.md:3`: candidate not selected; findings conclusion also says P1 unimplemented.
- `docs/qualification/p0-payment-composition-repair-20260917.md:55`: P0.2 still awaiting install, CI not implemented and P1 design-only.
- `docs/qualification/freeland-pay-readiness-integration-20260920.md:5`: canonical Freeland3ee; CI seam still an adoption blocker. That seam is resolved in accepted d475 and inherited by successor0ea.
- `docs/qualification/p0-safe-ci-20260920.md:34`: selected Freeland3ee and source adoption is next, though current delivery has already advanced.
- `docs/qualification/freeland-freel440-c469-20260916.md:21`, `freeland-preproduction-c469-20260916.md:80`, `freeland-velvet-onboarding-20260917.md:9`, `freeland-migration-blockers-20260920.md:5`: global source work paused. These describe former product sessions, not the current consolidation authorization.
- `docs/qualification/freeland-velvet-legacy-handoff-20260917.md:7`: calls `docs/qualification/current.md` the then-current product owner/checkpoint. Today that root page selects source/next global work, not the historical campaign owner.
- `docs/superpowers/plans/2026-09-18-next-package-after-403d3e4.md`: lower sections propose immediate product execution and tracker work. Its opening pause disclaimer already overrides those instructions; keep that disclaimer and historical status.

Safe resolution: an unambiguous, linked archival boundary that names the exact current entry and original source/runtime/date. Do not edit old result counts to the new pin, silently reactivate proposals, mark their pending historical claims as newly passed, or replace the successor's P2/P6 entry with these files. Historical document content can remain byte-identical behind that boundary. The blockers are against an **unqualified bulk consolidation**, not evidence of a runtime defect in the reviewed successor.

### Exact historical-claim → accepted-evidence map

All right-hand paths below refer to the reviewed successor tree, not a proposal to change canonical pins in this audit. The manifest plus `docs/qualification/current.md` resolves the latest selection; dated adoption pages establish the narrower historical transitions only.

| Historical source / superseded claim | Accepted evidence to link from archive index |
| --- | --- |
| `p0-authority-repair-20260917.md`, `p0-findings-repair-20260917.md`: bb/d28 not selected | `docs/qualification/console-p0-adoption-20260920.md` records adopted d28; `docs/qualification/agent-observations-20260920.md` and `observation-skill-reference-20260920.md` record subsequent selected Console/Kernel lineage. |
| `p0-payment-composition-repair-20260917.md`, `freeland-pay-readiness-integration-20260920.md`:510/064 not adopted, CI seam unresolved | `docs/qualification/freeland-source-adoption-20260920.md` records3ee→aa1→064→d475 and the dependency-free CI correction; `docs/qualification/p2-semantic-repair-20260920.md` records successor0ea. |
| `freeland-harness-readiness-repair-20260917.md`: uncommitted isolated readiness source, adoption pending | `docs/qualification/freeland-source-adoption-20260920.md` records committed aa1 lineage inclusion; its retained131 controls must not replace or redate the historical3219/product results. |
| `p0-safe-ci-20260920.md`: CI targets3ee, source adoption next | `docs/qualification/safe-gate.md`, `.github/workflows/qa-source.yml`, `docs/qualification/freeland-source-adoption-20260920.md`, and `p2-semantic-repair-20260920.md` define later exact gate/selection. Hosted CI remains unproved. |
| `global-plan-resume-20260917.md` and P0 records: P1 design-only/no API | `docs/qualification/agent-observations-20260920.md` for implementation; `docs/qualification/observation-skill-reference-20260920.md` for source references and actual fresh consumer. Storage remains unattested, zero-attachment and not managed PASS. |
| `dialogue-maintenance-20260912.md`,12-Sep retrospective: R0–R4 repairs/source adoption pending | `docs/qualification/source-adoption-20260914.md` and subsequent `freeland-divergent-baseline-adoption-20260915.md`; preserve each earlier exact range and rejected attempt. Current source is selected by manifest, not by these transitions. |
| Old global pauses and17-Sep product handoff's current-owner locator | `docs/qualification/current.md` and `docs/roadmap/README.md` for source work; `products/README.md` for the separately frozen campaign owner. No archive entry becomes a live product-resume command. |
| R1 D1–D12 and next-package proposed permissions/budgets/deletion/known-only verdict | `docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md` accepted§10; `docs/reviews/2026-09-16-global-plan-reconciliation.md`; current entry. Retain R1's explicit20-Sep disclaimer. |
| Dirty10-Sep mutable original priorities | Existing exact `docs/superpowers/plans/2026-09-10-universal-qa-next-plan.f49e739.snapshot.md`, linked by `docs/roadmap/README.md`; do not overwrite successor's active-path wrapper. |
| PR430 e531 technical findings vs migration follow-up f3b | Neither is new current QA-agent implementation acceptance. The migration note itself dates the changed head and limits; preserve e531 findings as historical, not automatically open or fixed at f3b. Current entry keeps merchant/migration as a waiting product lane. |

## Exact per-file decision list

`C` = current-delivery candidate; `H` = historical record only; `D` = inactive draft/prototype. Landing paths below are proposed, not writes performed by this auditor.

| # | Canonical path | Class | Safe landing / decision |
| --- | --- | --- | --- |
| 1 | `AGENTS.md` | C | Apply only the one-line Buzz-contract addition to successor AGENTS; never replace its newer source entry wholesale. |
| 2 | `docs/superpowers/plans/2026-09-10-universal-qa-next-plan.md` | H | Exact bytes already delivered as `2026-09-10-universal-qa-next-plan.f49e739.snapshot.md`; record equivalence, do not overwrite newer historical wrapper. |
| 3 | `evals/README.md` | C | Integrate qualified22/36/8-test historical attribution and dialogue-controls link; successor currently retains the stale blanket positive-runtime-pending sentence. |
| 4 | `docs/communication/buzz.md` | C | Deliver communication contract with its no-send-authority boundary; private team/channel metadata must stay in authorized private repository. |
| 5 | `docs/qualification/dialogue-maintenance-20260912.md` | H | Preserve dated R0–R4 source/review chronology; old pending-adoption statements are not current blockers. |
| 6 | `docs/qualification/evidence/freeland-pay-readiness-20260920/review.md` | H | Exact duplicate of accepted `evidence/freeland-source-adoption-20260920/freeland-integration-review.md`; preserve historical link or map equivalence in index. |
| 7 | `docs/qualification/evidence/freeland-pr430-20260920/late-callback-repeat.txt` | H | Archive diagnostic output with exact e531 product attribution. |
| 8 | `docs/qualification/evidence/freeland-pr430-20260920/late-repeat-source.ts.txt` | H | Archive as `.txt` diagnostic source, not installed harness; test buyer email is synthetic. |
| 9 | `docs/qualification/evidence/freeland-pr430-20260920/sql-probe-results.jsonl` | H | Archive minimal synthetic PostgreSQL results, not full migration/provider evidence. |
| 10 | `docs/qualification/evidence/freeland-pr430-20260920/sql-probe-source.mjs.txt` | H | Keep inert diagnostic source and exact migration SHA; local Homebrew/product paths need explicit prerequisites for any future replay. |
| 11 | `docs/qualification/evidence/p0-findings-repair-20260917/p0-2-report.md` | H | Preserve original14-test chronology and corrected attribution; raw-log dependency handled separately. |
| 12 | `docs/qualification/evidence/p0-findings-repair-20260917/p0-2-review.md` | H | Preserve independent review plus addressed minor; do not claim reviewer reran tests. |
| 13 | `docs/qualification/freeland-acceptance-repair-fd50-20260916.md` | H | Archive multi-checkpoint source-repair record; latest sections supersede earlier design-only paragraphs inside the file. |
| 14 | `docs/qualification/freeland-freel440-c469-20260916.md` | H | Archive bounded product retest; no source-adoption or full-release inference. |
| 15 | `docs/qualification/freeland-harness-readiness-repair-20260917.md` | H | Retain 3219-tool /35-product-plus-expected-fail provenance; source lineage later adopted, not a fresh current run. |
| 16 | `docs/qualification/freeland-migration-blockers-20260920.md` | H | Private historical financial/technical triage; f3b head follow-up does not revalidate e531 findings. No current source pause authority. |
| 17 | `docs/qualification/freeland-pay-readiness-integration-20260920.md` | H | Preserve064 candidate and pre-CI-fix failure; link current source adoption separately. |
| 18 | `docs/qualification/freeland-pr430-technical-review-20260920.md` | H | Preserve e531 exact-head findings; no claim about later f3b state. Keep separate from qa-agent source acceptance. |
| 19 | `docs/qualification/freeland-preproduction-c469-20260916.md` | H | Archive shadow BLOCK_RELEASE, triage and denominator; private receipts stay owner-held. |
| 20 | `docs/qualification/freeland-preproduction-fd50-20260915.md` | H | Archive two setup-blocked attempts, not276 failures; old requested repair approval is historical. |
| 21 | `docs/qualification/freeland-preproduction-fd50-20260916.md` | H | Archive276-outcome campaign and89-not-run denominator, unchanged receipt identity. |
| 22 | `docs/qualification/freeland-velvet-legacy-handoff-20260917.md` | H | Private product handoff; never activate old current-owner locator or proposed changes. |
| 23 | `docs/qualification/freeland-velvet-onboarding-20260917.md` | H | Archive observed onboarding/provider gaps and scopes; no fresh real-key readiness assertion. |
| 24 | `docs/qualification/freeland-velvet-recheck-403d3e4-20260918.md` | H | Archive exact candidate/campaign and unsealed89-case checklist; avoid importing its QR/session/raw-account evidence. |
| 25 | `docs/qualification/global-plan-resume-20260917.md` | H | Archive fresh-entry baseline and then-current candidate proposals; not today's queue. |
| 26 | `docs/qualification/p0-authority-repair-20260917.md` | H | Historicalbb candidate7/7 evidence; source now inherited by current Console. Bundle handled by separate owner. |
| 27 | `docs/qualification/p0-findings-repair-20260917.md` | H | Historicald28 candidate21/21 evidence; retain original14-test RED, not a current full-suite claim. |
| 28 | `docs/qualification/p0-payment-composition-repair-20260917.md` | H | Historical510 candidate68+4 controls; later integration/adoption supersedes its next-work paragraph. |
| 29 | `docs/qualification/p0-safe-ci-20260920.md` | H | Preserve368 workflow acceptance,61/61 and local-not-hosted boundary; current CI target is later source. |
| 30 | `docs/retrospectives/2026-09-12-freeland-dialogue-audit.md` | H | Archive measured pilot lessons and proposed order; private evidence locators optional, not cold prerequisites. |
| 31 | `docs/retrospectives/2026-09-18-freeland-403d3e4-qa-agent-retrospective.md` | H | Archive observations/proposals, not blanket known-defect suppression or deletion authorization. |
| 32 | `docs/reviews/2026-09-20-plan-clarifications-review.md` | H | Preserve approval of exact document delta only, no source/product gates inferred. |
| 33 | `docs/superpowers/plans/2026-09-18-global-plan-r1-draft.md` | D | Keep historical proposal with existing20-Sep disclaimer; only accepted§10 amendments govern, not D1–D12. |
| 34 | `docs/superpowers/plans/2026-09-18-next-package-after-403d3e4.md` | D | Keep superseded paused package, no active links as next-step instructions. |
| 35 | `evals/dialogue-quality/README.md` | C | Deliver reasoning-control procedure, open-context limits and existing14-Sep sample links. |
| 36 | `evals/dialogue-quality/cases.md` | C | Deliver six synthetic exercise inputs; no execution authority or empirical pass claims. |
| 37 | `evals/dialogue-quality/reviewer-rubric.md` | C | Deliver semantic rubric; prompt separation is not enforced blind isolation. |
| 38 | `evals/source-entry/20260917/README.md` | H | Preserve exact actor/source/environment attribution and first-answer digest. |
| 39 | `evals/source-entry/20260917/first-response.md` | H | Preserve verbatim answer, including obsolete paths and findings; wrap with historical portability boundary. |
| 40 | `tools/android-pilot/README.md` | D | Archive as inactive Android prototype; example SDK paths and private dependency lock are not portable prerequisites. |
| 41 | `tools/android-pilot/driver.mjs` | D | Preserve prototype source with raw capture/privacy caveat, no managed-runtime registration. |
| 42 | `tools/android-pilot/driver.test.mjs` | D | Preserve six loopback unit controls; newly rerun here. |
| 43 | `tools/android-pilot/run.mjs` | D | Preserve executable prototype but do not present Appium/BrowserStack path as accepted or newly authorized. |
| 44 | `tools/android-pilot/runner.mjs` | D | Preserve caller-authored/unsealed sequencing code; no managed PASS semantics. |
| 45 | `tools/android-pilot/runner.test.mjs` | D | Preserve seven in-process controls; newly rerun here. |
| 46 | `tools/android-pilot/wallet-visit.json` | D | Preserve fixed guest Nuanu visit-picker plan; no generic product/catalog coverage claim. |

For H/D material, a portable landing can preserve original relative directory layout under a dedicated `references/local-history/20260920/` tree with an index recording original path, SHA256, source/date and current supersession. Relative links that leave that tree need explicit historical/unavailable classification. Alternatively retain existing paths but put a conspicuous historical boundary on each human entry; preserve an exact original snapshot before editing history. Do not copy machine-private dependencies just to make historical paths resolve.

## Concrete equivalences and link findings

- Dirty10-Sep plan SHA256 `f49e7397774763d6c6062a64705fa83be4b9cb6a7ea43aad59e18672738a3ed9` exactly matches accepted `docs/superpowers/plans/2026-09-10-universal-qa-next-plan.f49e739.snapshot.md`. The successor intentionally has a different active-path version. This is not lost work requiring restoration over it.
- Original PAY/readiness review SHA256 `96d3c01c37e3e9642655ab4663766b7c90c025ede9847663d82c802556888b87` exactly matches accepted `docs/qualification/evidence/freeland-source-adoption-20260920/freeland-integration-review.md`.
- `evals/source-entry/20260917/first-response.md` actual SHA256 `88242444a30722b565d344090a5c15a4b4cb742df0d60116a2874ca00914f8a0` matches its README claim. Its absolute paths describe the original observed workstation, not a consumer setup requirement.
- Parsed **134 non-HTTP Markdown target occurrences, including seven absolute targets**. All resolve in canonical local context; this did not validate remote URLs or Markdown anchors. Many `.local` links and the13 logs above fail in a clean successor. No remote URL was fetched.
- Buzz addition and dialogue eval index depend on untracked companions; apply each cluster atomically. Existing mixed-handoff cases and14-Sep answers are already tracked and need not be recreated.

## Privacy and Android prototype boundary

No literal credential, bearer/JWT token, private subscription URL or real buyer email was identified in these46 source/text files by focused pattern checks plus contextual inspection. The email-like match in the archived callback source is an explicit `example.com` synthetic fixture. A deliberately wrong login-test password in the18-Sep report is test input, not an account secret. This is not a formal comprehensive secret-scanner certification.

The files still carry private business context: team/channel/project identifiers, merchant-resolution amounts and account-state summaries, internal source paths, authorized-product observations and review details. Safe for the user-authorized **private** repository only; not automatically appropriate for a public repository, email attachment or team-wide evidence dump. Credentials, browser state, QR images, real provider access links, full merchant payloads, raw screenshots/traces and campaign stores remain excluded. In particular the18-Sep retrospective documents a previous QR leak in local evidence; do not ingest that evidence directory by default.

Android source-specific findings:

- The current13 tests exercise `Driver` and `runSteps`, **not** `run.mjs` session creation/deletion, request/session manifest persistence or provider-error recovery.
- `driver.mjs:46–49` saves complete XML and screenshot bytes; `run.mjs:29–31` persists full config and returned session payload. No sanitizer or explicit private-file mode is applied. With retained app state (`noReset:true`), failure captures can contain account/UI secrets even though the plan intends a guest flow. Treat generated output as private; do not import it with source or call this a privacy-qualified generic probe kit.
- `run.mjs` preview is default and cloud credentials are read only on explicit execution. Tests prove an authorization header, not provider credential redaction or cloud security. BrowserStack support in source is not permission to open a session, upload an APK or incur costs.
- README depends on a private `.local/tools/nuanu-appium` lockfile and machine-specific SDK/JDK. Source preservation is portable; an exact dependency/runtime delivery is not established by these seven files.
- No Appium server/device/Android SDK/cloud/provider/product execution was performed. No prototype changes were made.

## Fresh audit evidence and limits

Read root `AGENTS.md`, full current manifest, assembly, current checkpoint and roadmap before the audit. Fresh `npm run sources:verify` exited0 against the canonical four selected components. It did not select successor pins or move a campaign.

Fresh local-only command:

```sh
node --test tools/android-pilot/driver.test.mjs tools/android-pilot/runner.test.mjs
```

Result: **13/13 PASS, zero failures/cancelled/skipped/todo**, six loopback driver controls plus seven mock-runner controls. Inspected test code before execution; no live endpoints or credentials are used. This is one audit run, not independent implementation review, Appium E2E, cloud readiness or product acceptance.

Historical reports document distinct7/14/21 authority/findings gates,68+4 composition gates,160 integration and131 readiness controls,61 root packaging tests,3219 owning-readiness checks, exact-source reviews and attributed product campaigns. This audit did **not** rerun those or turn their summaries into new acceptance. Original missing P0.3 raw implementer RED/GREEN chronology remains explicitly unavailable in its report; fresh comparison/cold logs must not be relabelled as original TDD runs. PR430 evidence remains e531/minimal-schema/mock-scoped; newer head and full migration harness are not qualified here.

No source, index, branch, installed skill, product, active campaign, dependency, secret store or external service was changed. No commit, push, install, network fetch, cloud operation or deployment was performed. The only written artifact is this audit report. Main integration owns final selected-file diff, secret review of additionally selected logs, historical wrappers/index, clean-clone link/restore/root gates and independent review of the final delivery.
