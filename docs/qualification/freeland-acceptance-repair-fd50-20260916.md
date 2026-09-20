# Freeland acceptance repair — 16 September 2026

## Scope and status

Owner: current QA dialogue. Original product source: `fd50fd6d547437abc53d9758bdb1491af25850c7` (read-only). During verification staging advanced to `e3711b6ff87659bec0bde6c493ca2893f69e6373`; the successor results are recorded separately below. This report describes QA-harness changes, not a product fix or a release permission.

The previous sealed campaign remains `BLOCK_RELEASE`: 238 passed, 14 failed, 18 skipped, 6 expected failures across 276 scheduled product tests. Its historical observations are not rewritten. The repaired corpus requires fresh discovery, planning and runtime evidence before any new acceptance claim.

Implementation is isolated under `qa-agent/.local/qa-h003-fix-20260915.FppuIJ/freeland`; canonical component pins and installed skills have not changed.

Latest checkpoint: the additionally approved readiness/financial packet is now
implemented and independently reviewed. See the final section below; earlier
"design only" sections are historical checkpoints, not the current task state.

## Implemented, independently reviewed

- Desktop VPN checks recognize the distinct active generic-link, managed-access and available-plan branches. They require the branch's actionable UI without reading secret subscription links. Existing inventory-unavailable skips are preserved, not expanded.
- Store checks use four actual product destinations and enabled semantic controls instead of retired marketing headings. The virtual-number tile accepts only the source-backed optional `Оффлайн` badge. Wrong destinations, disabled controls, duplicate/unknown badges and missing titles still fail.
- A tokenless reset route must show the unavailable classification, no password-entry form and the exact return-to-login action. It does not assert that a fresh recovery link is expired, nor claim that a mailed recovery round trip passed.
- Mobile readiness recognizes the CTA's semantic label without its decorative arrow, the real `/join` landing root and the exact English/Russian Freeman title. Existing H1 and overflow assertions are retained.
- `SET-D2a` checks that both language choices are visible and enabled without clicking. `SET-D2` persistence stays explicitly pending: selecting a language mutates Supabase and CRM. Availability does not prove persistence.
- TC-ВХОД-05 now retains sanitized preflight stage/cause/cleanup diagnostics. Original acceptance oracle and authorization are unchanged. Failed mailbox creation remains `partial_or_unknown`; the old failed run is not retried or retroactively explained.
- Graph mappings connect reset-page/lifecycle sources to the tokenless route check and settings to the read-only language check. Two real graph/impact regression tests prove selection and owner-removal behavior; no requirement classification or manual acceptance is promoted.

Independent review caught and closed the offline-badge false negative and verified the inline tokenless callback after the closed-import fix. Final focused results: desktop 44/44, mobile 26/26, language 7/7, graph selection 2/2; recovery diagnostic expanded controls 233/233. These are local harness controls, not deployed-product passes.

## Remaining acceptance debt: exact next actions

The 22 release-tier cases are not equivalent to 22 human tasks:

| Group | Cases | Required next action |
| --- | --- | --- |
| Previously qualified, now stale | ВХОД-01/03, PAY-01/02/04/19, SEC-01 | Renew through the existing governed workflow with fresh exact-release evidence. Do not edit old receipts to look current. |
| Existing shadow automation needing account states | PAY-05/07/09, SERV-01, WAL-01/13, API-01a | Read back and assign suitable existing staging fixtures, then execute and qualify only the proven scope. |
| No registered replacement lane | ВХОД-04, TMA-01, VPN-01, ESIM-03, VN-02, CARD-03, WAL-10/11 | Check each actual case contract; reuse scoped evidence where admissible, request only the missing session/data/authority, and retain unsupported parts as pending. |

The saved pool readback has all six roles unconfigured and no candidate SHA. This does **not** mean no suitable accounts exist. Required states:

- A1/A2: distinct clean, zero-balance accounts without owned products, active VPN or open checkout.
- A1B: clean account with at least $60 balance for the prescribed wallet/payment cases.
- A3A: eSIM + virtual number + card, inactive VPN; A3B: those products plus active VPN.
- M: clean purchase fixture for the separately authorized paid cases.

Never manufacture fixture compliance by deleting subscriptions, resetting balances, buying products or assigning arbitrary account labels. Existing accounts must first be checked against invariants. PAY-19's unpaid checkout is a distinct authority boundary. Telegram cases need a real identity/session; SMS requires an active number and agreed sender. Earlier VELVET, FREEL-435 and FREEL-439 evidence retains its bounded scope and does not automatically close these complete cases.

## Validation checkpoint

Fresh baseline `qa:verify` passed before edits. Post-edit provenance validation passed. Integration exposed stale inventory assertions (125→126 assembled, 59→64 locally hashed assets; 92→95 graph source mappings). Exact inventory/lineage checks were updated with negative controls, not weakened. Independent provenance controls passed 34/34.

The second full gate passed main 478/478, graph/verdict 1463/1463, replacements 670/670 and transport 70/70, then correctly rejected a new helper import in the closed session-safety source (`auth-flows.spec.ts`). The repair kept tokenless assertions in that spec and tests its actual callback, without broadening the trusted import allowlist.

That repair is now independently approved: actual private preflight verifies all five selectors with unchanged guard bytes. Fresh sequential `qa:verify:all` completed with exit0: **2886 tests, zero failures and zero skips** (main480, graph/verdict1463, replacements670, transport70, baseline23, canaries115, Console65). Provenance validation, typechecks and Console build passed. Log SHA256: `8b631eb729915973f5601b7a8d45b5ac7819f4283d9482adfa630f541f9e2b93`. Historical failed gate logs remain available.

Fresh admitted preflight confirms unchanged staging fd50 and production baseline
`98262828a3f506a6e5ce9094968bed917433abc6`. New graph build, structural validation,
full plan and dry-run passed. Actual discovery contains both new selectors and
selects267desktop +10mobile product tests, plus1setup;89manual cases remain pending.
Corpus digest: `sha256:6fed030517806661ba29f17c69c5c6f0aec414a118b17fccbb6800be1bf29971`.
Strict graph coverage debt remains (252 unmapped changed files); structural
validity is not complete dependency/requirement coverage. It has not been waived.
The isolated standard runtime recheck completed at `2026-09-16T03:57:34.139Z`:

| Product outcome | Count |
| --- | ---: |
| Passed | 252 |
| Failed | 1 |
| Expected failure | 6 |
| Skipped | 18 |
| Flaky / not run | 0 / 0 |

These are277product tests; the separate setup also passed. JSON reporter's
259expected outcomes include252product passes,6expected failures and1setup;
they must not be presented as259product passes. The child exited1 for the Wallet
i18n failure. Tokenless reset and new SET-D2a both passed. The13previous stale
UI/readiness failures are absent. Standard retry policy was unchanged; no
controlled replacement, email/recovery or paid lane executed.

All four runtime identity fields and the QA corpus stayed identical before/after;
global admission released successfully. Report SHA256:
`9970b64225524f5e80d17eec04b6cc05f31edc646bc2d0dc3885aa5d3f9d21e6`.
Plan digest: `sha256:a68a14b3fcf905a2a769b2716b0910b6d1d219cd9cc85cc053126fdfadbe9e42`.
This remains `UNSEALED_POST_REPAIR_STANDARD_RUN`, not a replacement release
receipt. The prior sealed BLOCK_RELEASE is unchanged; no releaseGo is granted.

Six expected failures remain: Store navigation FREEL-247, Freeman390 overflow,
PWA FREEL-263 deploy-mismatch fixture, SEO FREEL-123 locale contract, and semantic
join H1 on Pixel5/iPhone13. Their assertion/contract classification is under
separate read-only review; expected-failure is not synonymous with acceptance.

### Follow-up classification and current edit status

The first frozen corpus above is independently reviewed. A subsequent source
audit found two further QA defects now under repair: the SEO contract is45URLs
(23EN +22RU, localized hubs retained), not42; PWA automatic recovery requires a
real controlling Service Worker, which the old cold-navigation fixture never
established. Neither old expected failure proves a remaining product defect.

The fresh saved errors confirm Freeman right edge397.109375 against390.5 and
both mobile join failures at the H1 assertion after route readiness succeeds.
Mobile profiles are Chromium emulations, not physical devices or native Safari.
FREEL-247 still has an unresolved Store-entry versus route-owned Products design
contract; no assertion is inverted merely to agree with implementation.

The Wallet history graph gap is also repaired locally: three backend/SQL paths
now select the existing localization witness, while original WalletPage owners
and every requirement coverage status are retained. RED2→GREEN4; independent
Lead AQA review approved. This mapping is not hold/ledger acceptance.

These follow-up source edits supersede the first corpus for **future** execution.
They still require source freeze, provenance refresh, full offline gate, fresh
plan and deployed verification. The preceding2886/277results prove their exact
frozen corpus only; they must not be relabeled as verification of unfinished edits.

## Product defect retained, not explained away as a stale test

Independent read-only source review confirmed the Wallet English error path at fd50:
`money-holds.ts:304` → `20260910102100_card_decline_fee_wallet_feed.sql:75` →
`wallet-activity.ts:164` → `WalletPage.tsx:2266`. The system-generated sentence
“Insufficient available balance to place a hold.” is rendered verbatim in RU.
Product i18n policy supports the localization expectation; this is not arbitrary
merchant/customer content. The existing Wallet i18n regression is retained.

A safe fresh reproduction uses an existing affected history row in a clean
authorized session on plain `/app/wallet`; no failed purchase should be created.
Payment-return query/state must be absent because Wallet can restore a purchase
intent automatically. Exact selector-to-history-source graph ownership was a
separate mapping gap; the reviewed follow-up repairs it without suppressing this
failure. The first repaired runtime reproduced the English text. The follow-up
runtime and tracker deduplication remain separate from this source audit.

## Newly discovered financial-contract repairs — not implemented yet

Independent audit compared the actual shadow oracles and manual U1 acceptance to the approved `docs/fee-schedule.md` at fd50, not merely current UI output. These five discrepancies must be corrected before qualifying the affected shadow scenarios:

1. **PAY-05 issuance variants:** manual 25 + 8% and oracle 25 + 12.9% are not universal contracts. Versioned VIP has a fixed $35 total including its fee; standard/unversioned issuance follows different accepted terms. Capture public program/version/policy and principal/fee/total, then assert the correct branch. Never globally substitute either percentage or $35.
2. **PAY-07 top-up source:** wallet input is gross (100 debit → 98 credit at 2%); external and eligible Freeland Balance input is card credit (100 credit → 112.90 debit). Current oracle accepts wrong 2%/8% uplift alternatives without identifying the selected source. Add named source and monetary breakdown plus boundary/rounding controls.
3. **WAL-13 captions:** absence of a fee subtitle on the Balance tile is required, not automatically a known bug. A “no fee” promise is not equivalent to the absence of a caption. Caption checks do not establish actual ledger debit, which remains a separate WAL-10 evidence gap.
4. **WAL-01 available funding:** aggregate wallet display is not the amount available from one eligible payment source. Do not sum partial funding buckets or Stars for a single charge. A missing displayed available amount must remain unobserved, not invented from an aggregate.
5. **PAY-07 number renewal:** fresh Yesim single-period renewal is explicitly unavailable before money/provider mutation. Check that exact refusal separately from historical replay/recovery; a synthetic active-number fixture does not make the current unsupported renewal a valid checkout.

Implementation should reuse public quote/version fields already exposed by the product; do not decode quote fingerprints, sealed issuance contracts or persist provider/customer secrets. PAY-07 also currently compares catalogue input with API quote only: the rendered PaySheet amount is not observed. Do not call it complete catalogue→UI-price acceptance until that evidence exists.

These are QA defects, not new product bug reports. They stay separate from the completed UI-oracle repair and from the prior sealed release verdict.

No product mutation, purchase, checkout creation, transfer, deployment, tracker write, qualified-receipt renewal or active-component promotion was performed by this repair.

## Latest checkpoint: reviewed repair and e371 staging, 04:39 UTC

The follow-up SEO/PWA/Wallet-source repair is implemented and independently
reviewed. SEO controls: 43/43. PWA controls: 11/11, including real warm and cold
page-closure negatives; only an actual timeout may establish absence of a reload.
The final provenance gate verifies 402 Git rows (276 frozen + 126 assembled)
and 66 private assets. All 23 repaired source files match the recorded freeze;
all eight qualified declarations and receipt bytes remain HEAD-identical.

Fresh sequential `qa:verify:all` completed with exit 0: **2941 passed, zero
failures or skips** (534 main, 1464 graph/verdict, 670 replacements, 70 transport,
23 baseline, 115 canaries, 65 Console). Typechecks and build passed; the existing
Console bundle-size warning remains. Log SHA256:
`3ecdeaf7911969e7ae3454e91b4d901cad4783c2f397d19596238087887322c2`.
This supersedes the 2886-test gate for the final repaired source bytes.

### Candidate change and binding

Fresh fd50 preflight correctly refused runtime identity drift. An admitted
read-only diagnostic found API and manifest consistently at e371, with live and
ready both HTTP200. Exact source was obtained in a separate clean copy; fd50
source and historical runtime proof remain intact. The first successor preflight
also correctly refused an absent production Git baseline object in that clone;
fetching the exact object from the existing local mirror resolved this setup
gap without changing product files or weakening the check.

PR424 introduces 8 commits / 11 monitoring-infrastructure, environment, CI and
documentation files. Application, packages, SQL, fee policy and each repaired
SEO/PWA/reset/Wallet source are byte-identical to fd50. Independent CI review
confirmed a tested tree identical to e371 and successful exact-SHA staging deploy.
This does not prove production observability activation: infra PR323 remains
open, staging monitoring is disabled, and host/ACL/dual-sink/rollback evidence is
separate operator scope. No SSH, Ansible apply or monitoring activation occurred.

The successful e371 preflight binds production baseline
`98262828a3f506a6e5ce9094968bed917433abc6`. Fresh graph build and structural
validation, full planning and dry-run completed. The plan contains 268 desktop
and 10 mobile cases plus one setup; 89 manual cases remain pending, and strict
coverage debt remains with 259 unmapped changed files. No full-coverage claim.

- QA corpus: `sha256:bf28b5f156ea3804568e44cce31a9dea3318fdfd5b25f8c1086314aab48dbbf7`.
- Plan: `sha256:484fca821f84a317d730bec593402136cb0c2f3673217196902533051069b50d`.
- Runtime identity: `sha256:3ab0c67a3db740ce03c3e14d1e28ac5348116198281ae4063f1c1339b550eab1`.

### Successor standard runtime — not green

The standard-only run completed at `2026-09-16T04:36:59.533Z` with exit 1:

| Product outcome | Count |
| --- | ---: |
| Passed | 238 |
| Unexpected failure | 19 |
| Expected failure | 4 |
| Skipped | 17 |
| Flaky / not run | 0 / 0 |

Total: 278 product cases; setup passed separately. Reporter `expected=243`
includes 238 passes, four expected failures and setup, not 243 product passes.
No retry was added; with zero retries, `flaky=0` is not proof of flake-free tests.
The skip count decreased 18→17 only because FREEL-248 failed at initial Store
readiness before reaching its unchanged conditional skip; no skip debt closed.
All four runtime identity fields and the source corpus were stable before/after;
global admission was released. Report SHA256:
`40d245ea442b81b9739a937e4a2da0a53ec3d132350d0086a36f5623ec936a29`.

Both repaired PWA cases and SET-D2a passed. PWA evidence proves the injected
controlled-shell mismatch and cold blocked branches; it does not prove an actual
old-assets-to-new-deployment upgrade or automatically close FREEL-263.

Failures are not 19 confirmed product bugs:

1. Wallet again exposes the same English system error in RU. The assertion is
   reached and the retained product defect is reproduced.
2. SEO-06 stops at `redirected=true` for `/ru`, before canonical/sitemap assertions.
   A separate admitted read-only probe at 04:38:53Z established exact behavior:
   `/ru` → `/ru/` and `/en` → `/en/`, final200, one H1 and correct same-origin
   slashless canonical. Sitemaps return200 without redirects and contain22RU +
   23EN URLs. Source build correctly rewrites canonicals to staging. Production
   Nginx has explicit no-redirect locale roots; staging has directory fallback.
   This is a staging-routing/acceptance-contract discrepancy, not proof of a
   new app regression. Do not change expected origin to production or allow all
   redirects merely to make the case pass.
3. Seventeen other failures remain diagnostic gaps. The independently inspected
   initial nine stop on `Loading` / startup UI before their feature assertions.
   Other failures include anonymous redirects, responsive/marketing entry,
   English Store readiness, VPN quote-response timeout and eSIM keyboard flow.
   They cannot yet be called product defects or repaired test expectations.

Four retained expected failures are navigation FREEL-247 (unresolved design
contract), Freeman 390px overflow and mobile join H1 on both Chromium-emulated
devices. They are not acceptance passes.

### Next bounded readiness repair — design only, not implemented

`waitForEnvironmentVerifier` currently accepts absence of obsolete English copy.
Both current RU and EN bootstrap strings bypass that check. Call-site audit
found 15 direct and 65 `gotoAppSection` uses, all SPA routes; no static locale
page uses this helper. Proposed correction keeps its signature and 45-second
ceiling: positively require verified environment and ready startup, reject
blocked/failed phases, and keep route/Suspense/business assertions separate.
Actual helper controls must cover valid RU/EN, intermediate phases, missing or
contradictory state, and delayed route content without unblocking deliberately
held referral requests. Only two of the nine inspected failures call this helper;
fixing it alone must not be claimed to solve all failures. Closed auth imports
and their guards remain unchanged.

Diagnostic limitation: local retries=0 with trace=on-first-retry produced no
network trace/HAR or recorded HTML phase attributes for these failures. A scoped,
sanitized GET/phase diagnostic is needed before changing other waits; do not
guess the network cause or indiscriminately increase timeouts. The readiness
change and the five financial contract changes above await explicit design
approval under the current brainstorming workflow. No further source edits.

Evidence root: `.local/qa-h003-fix-20260915.FppuIJ/acceptance-repair-20260916.niAcFc`.
Final run is in `followup-standard.mKIfFJ`; first repair evidence remains separate.
The canonical component pin and installed skills are unchanged. No sealed
release receipt has been replaced, and **no release Go is issued**.

## Approved financial/readiness packet — implementation checkpoint

The user approved this bounded packet. The implementation preserves current
product bytes, staging state, all historical receipts, and zero-money/checkout
guards. It adds no payment engine and does not activate a new installed pack.

- App readiness requires both verified environment and ready startup, independent
  of UI language. Startup is not treated as route/Suspense/business readiness.
- PAY05/PAY07 distinguish program, issuance version and observed policy; VIP
  fixed total35 is not a universal25-plus-fee assumption. Top-up wallet gross
  debit and acquiring requested credit are checked independently per method.
- Fresh number renewal requires its exact unsupported409 contract with no priced
  facts; arbitrary errors and contradictory quote-bearing409 cannot pass.
- WAL01 compares available eligible sources, not aggregate/held/Stars funds.
- WAL13 requires omitted Balance fee copy and source-bound external copy,
  including real RU/EN "Fee included" for the fixed-total VIP presentation.
  Neither captions nor API amounts prove an actual debit.
- The opt-in collector excludes unrecognized text from the entire saved envelope,
  observes only requests begun after listener registration, preserves conflicting
  pricing via a typed error, and keeps legacy default behavior unchanged.

Independent Lead AQA review initially found three shared-collector defects and
the included-caption false negative; all were reproduced with negative controls,
fixed and independently re-reviewed. Integrated focused controls: **228/228**,
zero failures/skips. Typecheck and diff whitespace check passed. The first full
offline gate passed3064 controls. A real graph rebuild then exposed two stale
PAY05/PAY07 selectors; both registry/mappings links were repaired and a real,
isolated Playwright discovery regression added (RED5/6, GREEN6/6). Independent
Lead AQA approved this integration repair.

The subsequent full gate caught a readiness regression-fixture scheduling race
(583/584 main controls): its test-only250ms budget expired between DOM changes.
Both locales reproduced the actual timeout under controlled scheduling delay.
The final test observes every real callback phase with no timed pending assertion,
preserving the helper and negative checks; focused12/12 and independent review
passed. The final serialized full gate completed with exit0 in
`financial-qa-verify-accepted.log`, against `financial-source-freeze-accepted.json`:
**3065 passed,0 failed,0 skipped,0 cancelled**. Breakdown:584 main,1538 graph/verdict,
670 replacement controls,70 transport,23 baseline,115 canaries and65 Console.
Typechecks, private preflight, provenance verification and Console build passed.
The existing500.44kB bundle warning remains, not a newly introduced test failure.
Final log SHA256:
`e9197477f6361fd5c6f01416bc920568ca7073cf81eff1322c074a317f8432ae`.
After completion all46 frozen source files and8 historical receipt files still
matched exactly; diff whitespace check passed and product source remained clean.
This verifies the local QA repair, not deployed product acceptance. Earlier
aggregate logs are retained as historical evidence, not substituted for this run.
The final independent Lead AQA artifact audit explicitly APPROVED the bounded
offline repair after independently checking the final log and frozen bytes;
`PAY-SHARED-INDEPENDENT-REVIEW.md` records its scope and remaining limitations.

Only four canonical manual case sections and their U0/U1 projections changed;
the other85 case contracts, counts, roles and priorities remain unchanged.
PAY05/PAY07/WAL01/WAL13 declarations are still **shadow**, now oracleVersion2.
Rendered selected-source summaries, backend mutation absence, actual debit and
unregistered WAL10 acceptance remain unproved. Other historical financial text
outside this packet is being inventoried separately, not silently endorsed.

### Historical acceptance correction

The strict derived refresh first rejected stale receipts. Independent read-only
reconstruction of the f11 baseline confirmed **all eight** historical qualified
declarations were already stale, including controlled-email TC-ВХОД-02 (not only
the seven release-tier staging cases listed above). No current qualification is
inferred from their stored `state: qualified` field.

The existing explicitly scoped archival resolver preserved all eight binding
objects and receipt files byte-for-byte, returning `receipt:null` and stale causes
for exactly those eight IDs. No validator changed, no receipt was re-signed, and
strict acceptance still rejects them. The derived registry/manual inventory now
includes the repaired shadow contracts; provenance records402 Git rows with128
assembled and76 private assets. This is a corpus update, not fresh QA evidence.

### Graph integration and remaining coverage debt

The repaired graph was built from exact product source
`e3711b6ff87659bec0bde6c493ca2893f69e6373`; structural validation passed.
Its semantic digest is
`sha256:96036218ad81e05d3b513ca442f12021607a4df20c348c076daa9d35b8e5d68f`
and QA corpus digest is
`sha256:2b5b9e8acbe88a89ef4efe9c81f2fe134eb51356cbd2b0919fee6704ca2e34de`.
Strict coverage validation still fails with176 issues:37 missing requirement test
owners,36 excluded requirements without automation,1 requirement coverage gap,
85 unresolved source locators and17 orphan semantic nodes. These are graph debt,
not176 discovered product bugs, and no edges were invented to suppress them.

The retained previous test plan refers to graph`2c51d37e…` and corpus`bf28b5f1…`;
it is stale and must not be executed. A new admitted live verification needs fresh
environment identity, graph plan and dry-run, not reuse of the previous report.

Current release status remains **NOT GO / incomplete acceptance**. The most recent
actual staging result remains238 product passes,19 unexpected failures,4 expected
failures and17 skips on e371. It is not evidence for the newly repaired corpus.

### Next bounded acceptance-debt slice

Read-only Lead AQA audit found active obsolete acceptance outside the approved
four-case packet. Repair in this order, with source-backed assertions and separate
historical observations; do not blanket-replace percentages or amounts:

1. TC-CARD-01/02: remove universal25/27USD and selection by8% label; bind actual
   program/version/policy and named source. Preserve valid Standard versus VIP
   distinctions and real provider-quote/spend-authority boundaries.
2. TC-CARD-03: gross wallet input10 means fee0.20/net9.80/debit10, not debit10.20;
   acquiring input10 has different credit/debit semantics. TC-CARD-05 needs the
   actual shared acquiring cap, not a universal daily cap over every Balance.
3. TC-PAY-06 / TC-VN-03: split unsupported fresh Yesim renewal from historical
   operation replay. Buying a number or inventing an extension cannot close it.
4. Shared active matrices, budget examples, navigation labels and dated09.08
   caption tables must refer to current bound contracts. Keep historical evidence
   dated; remove its use as a blanket present-day exception.

The existing four repaired dry oracles do not inherit those stale numeric tables,
so the audit does not invalidate their scoped approval. It does prevent treating
all89 manual contracts or the shared prose as fully current. After this repair,
perform fresh graph/preflight/plan/dry-run before deployed verification. Also
resolve the17 runtime diagnostic gaps, locale redirects and real Wallet locale
defect; local harness GREEN alone does not turn any of those into product PASS.

The next six-case/shared-prose design received independent Lead AQA APPROVED
after correcting exact-eight archival metadata handling and requiring all
historical-renewal witnesses jointly. It remains design-only, awaiting the user's
approval before implementation; no new execution lane or money action is proposed.
