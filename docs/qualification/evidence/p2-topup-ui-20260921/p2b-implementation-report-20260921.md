# P2-B original dry top-up UI consumer — implementation report

Status: source ready for freeze and controller integration. Focused verification is GREEN; the owning final aggregate gate and independent Lead AQA review remain controller-owned. No commit has been created by this implementer.

## Attribution and scope

- QA checkout: `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/freeland`, branch `codex/p2-card-topup-ui`, base `0ea2df10f1b6d613e01d50011c269ca0fa999877`.
- Corrected product contract: read-only `/Users/danilsolomin/projectsnew/qa-agent/.local/freel440-c469-retest-20260916.TttK0C/product`, exact `c46911d99ef5da75f26e19866a5d429beba3fb90`. Read the entire `p2b-product-contract-report-20260921.md`; inspected actual CardPage, CardTopupCheckoutSheet, PaySheet, shared types/money/constants, API client and useApi source. No use of e531 as corrected oracle.
- Covered: Wallet `balance`, Card RF, SBP, USDT TRC20, USDC ERC20. Freeland Balance remains explicitly excluded in the sanitized result with `FREELAND_QUOTE_MUTATION_RISK`; its tile is never clicked. No claim of all-method/P2/live acceptance.
- This is local QA-harness source qualification, not live staging acceptance. TC-PAY-07 remains unchanged shadow/API-only. No live URL, provider, login, money, tracker, registry/current, installed skill, package/config or product-source action occurred.

## Implemented contract

The new named spec uses the existing `dry-test` owned lifecycle and disables screenshot, trace and video. The reusable helper navigates `/app/card`, observes authenticated `/api/me/shell`, wallet balance and payment capabilities, requires exactly one active owned card and one enabled corresponding Top-up control, and enters `card-topup-checkout-sheet`. Missing/ambiguous identity, content or capability is typed non-PASS, never skip or successful early return. Raw identity remains in memory.

For input 10.00, the original drawer requires Wallet debit10.00/fee0.20/credit9.80 versus crypto credit10.00/fee0.20/funding10.20. Every selection asserts actual pressed state and selected-source/rate rows. Wallet availability derives from the observed wallet response using the product's source precedence. Insufficient Wallet remains inspectable without inventing funds. Both fiat outer contexts are explicitly estimated12.9% with estimate labels and their own limit context; neither estimate is treated as an authoritative backend tariff.

The exact-bound financial waiter extension is opt-in `exactCardId`. Both request and response productRef and payload.cardId must equal the in-memory chosen card; existing amount/type/action/origin/path/method/fresh-request checks remain. Identity is excluded from the safe projection; old callers retain their shape and behavior. Existing listener cleanup on success, timeout and exceptional exits remains unchanged.

Source review additionally found `useApi.ts:1433-1457` caches identical payment options for15seconds. With controller approval, the consumer verifies both outer fiat estimates, opens nested PaySheet once from confirmed target Card, captures one fresh exact-bound response, and selects BOTH Card and SBP within that same sheet against each option's own breakdown. It does not force an immediate second identical fetch, clear cache, sleep, or reuse an earlier invocation's response. The fixture retains the quote to model this cache boundary.

P2-A exact row/numeric/caption assertions were extracted once into `quote-assertions.ts` and reused by both old and new consumers. Integer USD arithmetic, source-owned principal/fee/total, zero-fee absence, decimal percentage basis-point comparison and fixed-fee captions remain intact. Both crypto rails and final Wallet are checked after fiat; a bounded201.00 edit exposes stale fiat disabled/limit state without clicking any CTA. Only the outer target-fiat Continue is used; no nested submit, Wallet/Freeland/crypto Continue, reveal, block, create or funding action is performed.

Results/attachments contain only bounded status, source/rail/method, amounts/rates, scope and equality facts. No raw API body, ID, PAN, account/email, token, fingerprint or arbitrary server text is attached. New evidence uses a Playwright JSON attachment, never another campaign's output directory.

## Executable controls and verification

All new browser traffic is intercepted at `.invalid`; unknown fixture requests are aborted. The actual helper and unchanged strong dry lifecycle execute in Chromium. Intentional forbidden-request fixtures use the existing `throwOnForbidden:false` test option solely to avoid an out-of-band Node route-handler rejection; the request is still aborted, recorded, and rejected by final lifecycle assertion. The real spec retains the default guard behavior. One control attempts a checkout after the helper has returned, proving context-close verification still rejects it. No forbidden create reaches the fixture transport.

New26 controls cover healthy original path, exact response and request identity, wrong amount/product, stale pre-observation in-flight quote, listener cleanup, no/ambiguous active card, unauthenticated shell, no/ambiguous control, missing route, unavailable fiat option, correct sums with wrong caption, Wallet semantic leakage, stale selected source/total/limit/disabled state, background text not satisfying outer rows, insufficient Wallet, forbidden writes during selection and after helper return, zero fee and valid1.1% source rate, and sanitized secret-sentinel exclusion. All existing37 P2-A controls and32 financial projection/waiter controls remain GREEN.

Commands ran in the isolated QA checkout; raw logs are beside this report:

1. `node --test tests/freeland-main/card-topup-quote-contract.test.mjs` — intended RED for absent consumer and missing exact identity binding; `p2b-red-20260921.log`.
2. `node --test --test-name-pattern='corresponding Top-up' tests/freeland-main/card-topup-quote-contract.test.mjs` — RED: untyped missing/ambiguous control errors; `p2b-typed-control-red-20260921.log`.
3. `node --test --test-name-pattern='original drawer covers' tests/freeland-main/card-topup-quote-contract.test.mjs` — RED: two fetches instead of one freshly bound shared quote; `p2b-cache-window-red-20260921.log`.
4. `node --test tests/freeland-main/card-topup-quote-contract.test.mjs tests/freeland-main/card-sbp-quote-contract.test.mjs tests/freeland-main/payment-financial-projection.test.mjs` —95/95 PASS,0fail/skip; `p2b-green-focused-20260921.log`.
5. `npm run typecheck` — PASS; `p2b-typecheck-20260921.log`.
6. `npm run provenance:verify` — VALID, source8/git274/assembled129/private80, counts unchanged; `p2b-provenance-20260921.log`.
7. `git diff --check` — PASS. Actual diff and owned new files self-reviewed; no secret/debug logging or unexpected external endpoints in consumers. No standalone build/lint scripts apply to this bounded harness change; aggregate builds and owning suites are controller-owned. Product builds were prohibited and were not run.

Intermediate diagnostic logs `p2b-green-attempt1-20260921.log` and `p2b-green-attempt2-20260921.log` preserve fixture quoting/UTF-8 corrections and the intentional route-handler async-rejection discovery; these are not claimed GREEN evidence.

## Changed files and handoff

Implementer-owned source files:

- `tests/freeland/card-topup-quote.spec.ts` (new named dry scenario).
- `tests/freeland-staging-replacements/support/card-topup-quote.ts` (new consumer).
- `tests/freeland-staging-replacements/support/quote-assertions.ts` (shared extraction).
- `tests/freeland-staging-replacements/support/paysheet-observation.ts` (opt-in exact binding).
- `tests/freeland/card-sbp.spec.ts` (reuse extraction only; controls retained).
- `tests/freeland-main/card-sbp-quote-contract.test.mjs` (loader supports extraction; assertions unchanged).
- `tests/freeland-main/card-topup-quote-contract.test.mjs` (independent literal fixtures/control suite).
- `provenance/source-manifest.v1.json` (four existing SHA rows only: old spec, old loader, waiter, plus controller-coordinated mapping SHA `8c35e9e1993b5e91396cba360183490cb1ffe9064f85d18a4aafc270adef10ad`; no counts/history/root changes).

Controller-owned graph mapping and `card-topup-graph-selection.test.mjs` were not edited or staged by this implementer. No source files have been staged by this implementer; exact staging/commit must occur only after the controller's final integrated gate. New files outside controlledRoots are ordinary Git-delivered source, not fabricated private-manifest history.

Commit: pending coordinated aggregate gate and controller instruction. Freeland Balance controlled classification, live deployed evidence, complete P2 acceptance and release GO remain pending/outside this source slice.

## Source-fidelity correction after controller review

The initial95/95 focused result above is retained as pre-review evidence, not final acceptance. Controller review found that two literals in the new consumer/fixtures had not faithfully represented the actual c469 components. The first aggregate run in `p2b-fullgate-20260921.log` also failed an independently controller-owned graph-inventory expectation; it is not acceptance evidence. The controller released the source freeze for this narrow correction, after read-only diagnosis.

Exact source audit and correction:

- Owned-card opener: `CardPage.tsx:3205–3208` passes `card:actions.topUpCard` to the card tile and binds `openTopupForProgram(programKey)`; `packages/i18n/src/resources/ru/card.ts:136` resolves it to **Пополнить карту**. `cards/card-list-ui.tsx:183–189` renders that label unchanged. The global **Пополнить** instead comes from `common:actions.topUp` (`ru/common.ts:444`) and navigates `/wallet` through `AppTopBar.tsx:102–125`. Consumer now selects exact **Пополнить карту**, still requires exactly one enabled control and one active owned card, and never uses `.first()`. The fixture now includes both distinct buttons with an intercepted header-navigation trap; the healthy test explicitly rejects any `GET /wallet`. Missing/ambiguous card-control tests remain intact despite the visible global header.
- Nested card identity: `PaySheet.tsx:1646–1650` overrides the generic UX `ru_card` data attribute to **card** when productType is card. New consumer and healthy fixture now require `data-payment-method="card"`; SBP remains `sbp`. A new negative control rejects generic `ru_card` for this card-product sheet. P2-A already had the correct card-specific behavior and was not modified in this correction.
- Healthy nested fee captions: `PaySheet.tsx:1622–1632` renders a known positive breakdown as **Комиссия оплаты: <amount>** and hides the zero-fee caption. Healthy independent literals now use1,29$/0,11$ fixed fees; the already shared oracle required no change. The valid1.1% case is retained as an explicitly named independent caption/rate control, rather than misrepresenting the default product rendering.
- Remaining captions were audited against actual c469 resources and call sites: outer method names, selected-method/rate rows, Wallet/source-fee/estimate/limit rows and CTA labels match `ru/card.ts:446–480` and `CardPage.tsx:1435–1503,3794–3820`; insufficient balance matches `ru/card.ts:336` and `CardPage.tsx:3805`; outer close matches `ru/common.ts:449` and `CardTopupCheckoutSheet.tsx:120–129`; nested principal/fee/total labels match `PaySheet.tsx:1419–1448`. No additional exercised-label mismatch was found.

Separate preserved RED/GREEN evidence:

1. `node --test --test-name-pattern='original drawer covers' tests/freeland-main/card-topup-quote-contract.test.mjs` with actual distinct labels, header trap and actual nested attribute — intended RED: **owned-card opener must not navigate through the global Wallet header**. Raw `p2b-source-fidelity-opener-red-20260921.log`.
2. Same command after correcting only the opener — intended RED: expected `ru_card`, observed actual `card`. Raw `p2b-source-fidelity-method-red-20260921.log`.
3. After the minimal nested-attribute correction: `node --test tests/freeland-main/card-topup-quote-contract.test.mjs tests/freeland-main/card-sbp-quote-contract.test.mjs tests/freeland-main/payment-financial-projection.test.mjs` — **97/97 PASS,0fail/skip** (new28 + unchanged P2-A37 + financial32). Raw `p2b-source-fidelity-green-20260921.log`.
4. `npm run typecheck` — PASS, raw `p2b-source-fidelity-typecheck-20260921.log`; `git diff --check` — PASS.

Only new `support/card-topup-quote.ts` and new `card-topup-quote-contract.test.mjs` were changed in this correction. No manifest, controller graph test/mapping, old P2-A files, guard, package, product source, registry/current or external state was modified. All previous logs remain unchanged. Controller owns the graph-inventory compatibility correction, its provenance and the fresh final aggregate gate. Source is frozen again pending that gate and independent review; no commit/staging or live acceptance is claimed.

## Failure-artifact privacy correction and sealed-helper relocation

The next integrated aggregate reached the preflight import boundary after main767/release1583/replacements670/transport70 passed; it was not a successful full gate. Controller separately owns the narrow preflight compatibility fix and all current provenance updates. A second review also found a concrete privacy omission: the installed Playwright recorder writes an ambient ARIA snapshot into `error-context.md` independently of screenshot/trace/video flags. The actual named source spec, run with fully intercepted broken literal UI, persisted `SECRET-PAN` and `SECRET-EMAIL` from surrounding content. Original reproduction is retained at `/tmp/p2b-error-context-probe.4FFbVp` (`probe.log`, `report.json`, and `output/.../error-context.md`, sentinel lines34/37). Separate scratch suppressed unexpected-exit1 and same-worker restoration proofs remain there; none is live-product evidence.

The narrow correction is entirely local to `tests/freeland/card-topup-quote.spec.ts`: a public `contextOptions` fixture saves the previous `PLAYWRIGHT_NO_COPY_PROMPT` environment value (including unset), enables the installed runner's snapshot opt-out, and restores it in `finally`. Installed `playwright/lib/index.js` sets up `_setupArtifacts` through `_combinedContextOptions`; it finishes the recorder before the public context-options fixture tears down. Thus suppression encloses page setup, context close, and recorder finish without patching the recorder or changing another campaign's configuration. The real page's guard-attempt array is retained via a public page fixture, and the unchanged final guard assertion runs before environment restoration even when owned context-close fails; a setup failure before page exposure has an empty attempt array. A guard rejection remains a failure. Screenshots/trace/video remain off, safe error details remain available, and no process-wide flag is left changed after the scenario.

New `tests/freeland-main/card-topup-artifact-privacy.test.mjs` executes the **actual named spec under the actual Playwright runner**, not merely its helper or JSON projection. Each temporary run has isolated report/output/auth paths and transport installed before the existing dry guard; only synthetic `.invalid` GETs are fulfilled and unknown traffic is aborted. Its six controls prove:

- Broken original path remains unexpected FAIL / child exit1, with safe error context but no ambient PAN/email, snapshot or media attachment.
- Following unrelated tests in the **same worker** observe exact prior policy for unset, empty-string and nonempty values; ordinary ambient snapshots remain available when previously enabled.
- Failure before owned page setup still restores the policy for the next same-worker test.
- Injected context-close failure plus a blocked checkout attempt preserves both close failure and final dry-guard rejection. A public browser-worker fixture journal observes restoration in the original worker after all test fixtures tear down. Playwright restarts after fixture-teardown errors, even when marked expected; this control does not swallow errors to force reuse. Same-worker restoration is independently proven by the ordinary and setup-failure controls.

Expected-failure annotations occur **only** in the isolated qualification's paired runs, allowing an unrelated test to follow a deliberately broken scenario in one worker. The production scenario has no such annotation. An attempted `afterAll` observation was rejected because hooks themselves reactivate test fixtures and changed the observed artifact lifecycle; the final worker-fixture journal is nonintrusive. Both diagnostic logs remain preserved, not relabeled as successful evidence.

Controller also identified that the existing sealed QA corpus covers `tests/freeland`, not the replacements support directory. The new shared extraction was therefore moved to `tests/freeland/quote-assertions.ts`, with old P2-A import `./quote-assertions`, top-up import `../../freeland/quote-assertions`, and the exact old test loader updated. No corpus root/schema broadening was needed. Controller owns the exact import recognition, negative trust controls, and refreshed provenance hashes; implementer did not edit those during this correction.

Final focused evidence (all retained beside this report):

1. `p2b-artifact-privacy-red-20260921.log`: actual-runner regression RED for ambient PAN leakage (six controls, four fail).
2. `p2b-artifact-privacy-green-20260921.log`: retained **failed diagnostic**, two pass/four fail, from the intrusive afterAll observer; not acceptance evidence.
3. `node --test tests/freeland-main/card-topup-artifact-privacy.test.mjs` under Node20 — **6/6 PASS**, `p2b-artifact-privacy-green-worker-journal-20260921.log`.
4. Original/top-up/financial focused controls after relocation — **97/97 PASS**, unchanged old37 included, `p2b-relocated-quote-green-20260921.log`.
5. `npm run typecheck` — PASS, `p2b-artifact-privacy-final-typecheck-20260921.log`; final `git diff --check` — PASS.

Final implementer-owned source list (supersedes the earlier pre-relocation list):

- `tests/freeland/card-topup-quote.spec.ts` (new).
- `tests/freeland/quote-assertions.ts` (new, relocated shared extraction).
- `tests/freeland/card-sbp.spec.ts` (shared import/call only).
- `tests/freeland-staging-replacements/support/card-topup-quote.ts` (new).
- `tests/freeland-staging-replacements/support/paysheet-observation.ts` (opt-in exact identity binding).
- `tests/freeland-main/card-topup-quote-contract.test.mjs` (new28 controls).
- `tests/freeland-main/card-topup-artifact-privacy.test.mjs` (new6 actual-runner controls).
- `tests/freeland-main/card-sbp-quote-contract.test.mjs` (exact shared-module loader; existing37 assertions preserved).

The obsolete `tests/freeland-staging-replacements/support/quote-assertions.ts` does not remain. All mapping, graph/preflight tests, preflight code and the current provenance manifest are controller-owned. Implementer source is now **frozen** for the controller's one fresh aggregate and independent Lead AQA review. No aggregate rerun, staging, commit or live acceptance was performed by this implementer.
