# P2-B product contract audit — card top-up

Status: **source-grounded and implementation-ready for Wallet, Card, SBP, USDT TRC20, and USDC ERC20 in the existing dry lane. Freeland Balance quote acceptance remains a separate controlled-classification gap because its nominal quote path can conditionally write `provider_clients`.** This is a product-source audit, not live acceptance.

## Attribution and boundary

- QA root inspected: `/Users/danilsolomin/projectsnew/qa-agent` at `45a74c33b3df091411a253ef894f1dfa1f946995`.
- Selected QA Freeland source: `/Users/danilsolomin/projectsnew/qa-agent/components/freeland` at `0ea2df10f1b6d613e01d50011c269ca0fa999877`.
- Corrected product oracle: clean detached checkout `/Users/danilsolomin/projectsnew/qa-agent/.local/freel440-c469-retest-20260916.TttK0C/product` at exact user-supplied commit `c46911d99ef5da75f26e19866a5d429beba3fb90` (merge of PR 426). This is the source used for all corrected-contract line references below.
- A separate retained checkout, `/Users/danilsolomin/projectsnew/qa-agent/.local/freeland-velvet-recheck-20260918.W8HApt/product`, is clean at local `origin/staging` snapshot `403d3e4459c3b00a98fccfb9e99bca9f4c675972`. That commit contains `c469` and has byte-identical blobs for `CardPage.tsx`, `CardTopupCheckoutSheet.tsx`, `PaySheet.tsx`, and `card-freeland-balance-topups.ts`. This attributes the corrected source to a later local staging snapshot; it does **not** establish what is deployed live.
- The requested retained PR430 checkout `/Users/danilsolomin/projectsnew/qa-agent/.local/freeland-pr430-review-20260920.LOurYb/product` is clean at `e531408f41fcd2e68d4ca4fb7af54e6e31d014f9`. Its `CardPage.tsx` is a divergent/pre-correction implementation: it can select `cardFiatQuoteData ?? freelandBalanceQuoteData`, carries fixed 12.9% captions, and applies the fallback limit too broadly. It is evidence of a conflicting lineage, not the P2-B corrected oracle. Do not implement its stale semantics.
- No product/browser flow was executed and no product, Git ref, source, account, or state was changed. This report is the only written artifact. One read-only remote metadata query was accidentally issued during inspection; it did not fetch or update refs or files. No claim below depends on it.

## Actual user path and owned-card binding

The real route is `/app/card` (`apps/web/src/App.tsx:399`). The top-up flow is not a generic payment page:

1. `CardPage` loads `me.cards`, falling back to `me.card` (`apps/web/src/pages/CardPage.tsx:926-932`). It reduces cards to the first card per `subscriptions`/`wallet` program (`:934-957`). This means multiple cards within one program are already collapsed by product source.
2. Each issued card renders an `IssuedCardTile`; its localized **Top up** action calls `openTopupForProgram(programKey)` and is disabled unless that card is active (`:3195-3222`). The action has no card-specific test ID. Two active programs therefore expose duplicate Top up accessible names.
3. The opener rejects missing/non-active cards, then stores `{ cardId, program, maskedPan }` in `topupTarget`, clears the amount, selects Wallet, and opens the top-up screen (`:2358-2370`). While open, the current program card must still have the same `cardId` and remain active; otherwise the sheet and target are cleared (`:1036-1056`).
4. `CardTopupCheckoutSheet` is the outer drawer. Its dialog is `data-testid="card-topup-checkout-sheet"` with `data-step="checkout" | "crypto"` (`apps/web/src/pages/cards/CardTopupCheckoutSheet.tsx:107-119`). Method buttons have localized `aria-label` and `aria-pressed`, but no `data-payment-method` (`:167-209`). The amount control is the drawer's `input[type=number]` (`:212-235`), summary rows are direct label/value sibling spans (`:238-251`), and the bottom CTA is `:274-286`.
5. For target Card/SBP, clicking the **outer** Continue only sets `cardPaySheetAction="topup"` (`CardPage.tsx:3825-3847`). The nested `PaySheet` then receives the original target in both `productRef` and `productPayload.cardId`, plus normalized amount (`:4209-4244`). This is the exact request identity that reaches `POST /api/payment/options`.

Consumer precondition: derive active owned cards from the current authenticated response in memory. Proceed only when exactly one active product-visible card is eligible, or when the test is explicitly parameterized by program. Emit a typed `NO_ACTIVE_OWNED_CARD` or `MULTIPLE_ACTIVE_OWNED_CARDS` outcome otherwise. Never use `.first()` across duplicate Top up buttons. Retain the chosen raw card ID only in memory, and require the observed options request to satisfy:

```text
productType = card
productAction = topup
productRef = expected owned cardId
productPayload.cardId = expected owned cardId
productPayload.amount = exact normalized amount
```

The existing financial waiter only proves that some entity ID is present (`tests/freeland-staging-replacements/support/paysheet-observation.ts:167-220`, especially `:186`); it must be tightened to compare both raw fields to the expected in-memory ID. Persist only presence/equality booleans, never the ID.

## Corrected outer-drawer contract at `c469`

### Method identities and selected caption

Product state IDs are:

| User-visible source | State ID | Tile caption | Selected summary rows |
|---|---|---|---|
| Wallet | `balance` (legacy alias `wallet`) | no fee caption | Selected payment method; Selected fee rate `2%`; Amount; Top-up fee; Card receives; Wallet balance after |
| Freeland Balance | `freeland_balance` | no fee caption | Selected payment method; selected quote fee rate; Card receives; source fee; Balance debit; Remaining limit; Freeland balance after |
| SBP | `sbp` | selected legacy quote rate or estimated `12.9%` | Selected payment method; selected/estimated rate; Card receives; fee; payment total; Remaining limit |
| Card | `ru_card` (legacy alias `card`) | selected legacy quote rate or estimated `12.9%` | same shape as SBP |
| USDT TRC20 | `usdt_trc20` | `2%` | Selected payment method; Selected fee rate `2%`; Card receives; fee; payment total |
| USDC ERC20 | `usdc_erc20` | `2%` | same shape as USDT |

Evidence:

- Source availability/order is Wallet; conditional Freeland; conditional SBP/Card; USDT; USDC (`CardPage.tsx:1333-1351`).
- Wallet and Freeland deliberately omit tile fee captions; crypto uses `CARD_TOPUP_FEE_RATE_BPS`; fiat shows a quote-owned rate only on the selected legacy route and otherwise marks 12.9% as estimated (`:1363-1395`).
- The selected source, not a cached response from a different source, owns `selectedTopupSourceQuote` and `selectedTopupFeeRate` (`:1270-1291`). An explicit zero rate is preserved because only `null` suppresses the row.
- Every summary begins with localized **Selected payment method** and, when non-null, **Selected fee rate** (`:1435-1441`). Source-fee and wallet row sets are defined at `:1442-1503`.
- Only external/Freeland methods are constrained by the acquiring remaining limit; crypto is not (`:1403-1417`). Wallet/Freeland insufficiency uses their respective gross/debit values (`:1418-1433`).

The corrected selected-caption rows are absent from retained PR430 `e531`; P2-A caption/numeric assertions must target the `c469` contract and must not be weakened to accommodate that stale branch.

### Wallet: independently grounded gross-input contract

Wallet is the one local outer calculation. It does not request `/api/payment/options` on drawer open, method selection, or amount edit. The wallet balance comes from the already loaded wallet view (`CardPage.tsx:783-786`); calculations use the shared rate constant and local preview (`:1209-1213`, `:1284-1303`).

This is not a TC-PAY-07 inference:

- `packages/shared/src/constants.ts:129-134` fixes the existing-card top-up rate at `200` bps and the minimum gross wallet charge at `5.00`.
- `docs/fee-schedule.md:232-245` says the entered amount is the gross wallet charge, fee is 2%, and card credit is gross minus fee. At the minimum, `5.00 -> 0.10 fee -> 4.90 credit`.
- Server unified-payment parity uses the same gross model: for card/topup, `walletFundingBreakdown` returns principal `gross - fee`, fee, and total `gross` (`apps/api/src/services/payment-checkouts.ts:720-732`).

Therefore a test input of `10.00` may independently expect `Amount 10.00`, `Top-up fee 0.20`, `Card receives 9.80`, but those values are derived from this exact product contract, not copied from the old test oracle. Do not assert a `10.00` minimum; the corrected minimum is `5.00`.

### Freeland Balance: own quote, but not admitted by the current dry guard

Freeland is shown only when `cardFreelandBalanceTopupEnabled === true` and the eligible Lava-card balance is positive (`CardPage.tsx:1214-1218`). Selecting it with a positive amount automatically issues **POST** `/api/cards/:cardId/freeland-balance-topups/quote`—not GET and not `/api/payment/options` (`apps/web/src/hooks/useApi.ts:1012-1024`; `apps/web/src/lib/api-client.ts:1031-1039`). Its own response supplies `cardCreditAmount`, `sourceFeeAmount`, `sourceDebitAmount`, `feeRateBps`, `remainingLimit`, and balance-after inputs (`CardPage.tsx:1265-1329`). A consumer must never allow the initial local estimate or another source's cached quote to satisfy this state.

The quote route is not safely classifiable as mutation-free from source alone:

- Route `apps/api/src/routes/card-write-routes.ts:499-527` authenticates/validates and calls `quoteCardFreelandBalanceTopup`.
- Quote service `apps/api/src/services/card-freeland-balance-topups.ts:267-285` calls `buildQuoteForUser`; that path validates policy/minimum, reads the owned active card, security state, cap counter, and eligible balance (`:154-285`).
- During owned-card validation it calls `ensureProviderClient` (`:171`). `apps/api/src/services/card-operations.ts:724-741` reads an existing provider client but conditionally performs a Supabase `provider_clients.upsert` when none exists (`:730-735`). No provider top-up, fund hold, ledger operation, or top-up record is created in the quote function, but the conditional DB upsert is still a state mutation.
- The money-writing create endpoint is separately guarded as `/api/cards/:cardId/freeland-balance-topups` with `moneyWrite` policy and required idempotency (`card-write-routes.ts:529-565`); it must remain forbidden.

The existing strong dry policy only admits `/api/payment/options` and optional `/api/auth/session-surface` POSTs (`components/freeland/tests/freeland-staging-replacements/support/pay-sheet.ts:144-170,283-338`). It will correctly block the Freeland quote. P2-B must report this as a controlled `FREELAND_QUOTE_MUTATION_RISK`/unsupported acceptance outcome, not PASS, skip, or stale-estimate success. Any later admission needs a separately reviewed policy decision; this audit does not prescribe one.

### Crypto outer continuation

USDT/USDC outer summaries are local requested-card-credit calculations using 200 bps (`CardPage.tsx:1272-1278,1292-1316`). `10.00` means Card receives `10.00`, fee `0.20`, total to deposit `10.20`. Crypto has no acquiring remaining-limit row/gate after the correction (`:1414-1417,1465-1472`). Selecting/editing crypto emits no quote POST.

Clicking the outer crypto CTA is unnecessary for the requested summary check. It changes the same drawer to its crypto step and passes `topupSourceDebitAmount` plus exact preferred rail (`usdt_trc20` or `usdc_erc20`) into `CryptoDepositPaymentView` (`:3825-3832`; `CardTopupCheckoutSheet.tsx:143-159`). Funding completion subsequently executes a wallet top-up (`CardPage.tsx:3785-3791`). Address creation and actual funding are outside this dry contract, so P2-B should verify outer source selection, caption, numeric rows, and absence of a limit notice without clicking Continue.

## Nested PaySheet contract (Card/SBP entry only)

When target PaySheet capability is enabled, outer Card/SBP does not use the legacy fiat quote hook. Outer Continue opens the nested `PaySheet`; `usePaymentOptions` then sends the exact card/amount request to `POST /api/payment/options` (`CardPage.tsx:4209-4244`; `apps/web/src/lib/api-client.ts:1326-1334`). This POST is already the explicitly admitted read contract in the strong dry guard.

The nested dialog is distinct: `data-testid="pay-sheet"`, `data-step="checkout" | "crypto" | "payment-link"`, and it supports Escape (`apps/web/src/components/payments/PaySheet.tsx:868-878,1528-1537`). Its buttons expose exact `data-payment-method` identities, translating UI `ru_card` to backend `card` (`:1618-1678`). Corrected `c469` keeps Wallet and Freeland as separate tiles, and maps crypto rails by `depositRailKey` (`:227-338`).

Backend option identity is authoritative:

| optionId | method | action | key availability source |
|---|---|---|---|
| `wallet_balance` | `wallet_balance` | `wallet_balance` | wallet balance covers gross wallet debit |
| `freeland_balance` | `freeland_balance` | `freeland_balance` | capability, eligible balance, and acquiring cap |
| `card` | `card` | `external_checkout` | provider route, minimum, and acquiring cap |
| `sbp` | `sbp` | `external_checkout` | provider route, minimum, and acquiring cap |
| `usdt_trc20` | `crypto` | `wallet_deposit` | rail available; exact `depositRailKey` |
| `usdc_erc20` | `crypto` | `wallet_deposit` | multirail/ERC20 flags; exact `depositRailKey` |

Types preserve `optionId`, `action`, `available`, `unavailableReason`, full principal/fee/total/rate breakdown, and deposit rail/terms (`packages/shared/src/types.ts:294-408`). Server construction is at `apps/api/src/services/payment-checkouts.ts:637-709,775-965`; acquiring-cap unavailability affects Freeland/Card/SBP, while Wallet and crypto are not cap-blocked (`:760-839`). Product validation re-resolves the owned card from the exact reference and quotes the requested amount (`apps/api/src/services/payment-product-adapters.ts:426-448`).

The nested summary uses the selected option's exact breakdown when present (`PaySheet.tsx:1330-1458`); crypto continuation uses that rail's fee-inclusive total (`:366-385,965-979`). Selecting a tile is safe. Clicking the **inner** final CTA is forbidden: for Card/SBP it proceeds toward `POST /api/payment/checkouts` (`:981-1005` onward). P2-B may open the nested sheet through outer Card/SBP Continue, assert the exact options request, tiles, selected breakdown, availability/reason, and then close by Escape/backdrop. It must never click the nested submit.

## Existing helper compatibility

- Use `test` from `components/freeland/tests/freeland-staging-replacements/support/dry-test.ts:1-12`; it owns a fresh page/context via `withDryBrowserPage`. Do not use the legacy Card/SBP spec's POST-only checkout guard.
- `withDryBrowserPage` establishes the fail-closed request and response boundary before product navigation and verifies zero forbidden attempts at context close (`support/pay-sheet.ts:144-170,283-350,369-402`).
- The financial projection already preserves option ID, method, action, availability/reason, balances, and exact breakdown (`support/paysheet-observation.ts:104-165`). Extend only its in-memory request matcher for exact `productRef` and payload card ID equality; do not persist IDs.
- Inner `readSheetTiles`/`tileLocator` require `data-payment-method`; they apply to `pay-sheet`, not the outer drawer. For the outer drawer, reuse the exact label/value sibling-row assertion pattern and localized method button names. The outer drawer has no `data-payment-method`.
- The old `tests/freeland/card-sbp.spec.ts` helper is not a top-up opener, does not resolve zero/multiple active cards, and its waiter does not prove the original card ID. Its generic Card/SBP availability and ordering assumptions must not be inherited as acceptance requirements.

## Minimal compatible dry consumer

1. Enter `/app/card` under the owned strong dry fixture. Capture/project the current owned-card catalog in memory.
2. Resolve exactly one active eligible card (or explicit program); otherwise emit the typed precondition outcome. Click that card's Top up action and assert outer dialog `data-step=checkout`.
3. Fill an independently valid amount (for example `10.00`; corrected minimum is `5.00`).
4. Exercise outer Wallet, USDT, and USDC without their CTA: assert `aria-pressed`, exact selected-method/rate rows, source-specific numeric rows, and absence/presence of limit/insufficiency state. Switching source must replace the selected caption and must not retain prior source rows.
5. Treat visible Freeland as a reported controlled gap under the current guard; do not trigger its quote POST and do not count the local estimate as evidence.
6. Select outer Card, register the exact financial-options waiter before clicking outer Continue, then assert request card ID and amount equality, projected `optionId/method/action/breakdown`, and nested Card selection. Close without inner submit.
7. Repeat the fresh flow for SBP if both identities are required; do not reuse a stale request or cached sheet. Method order is not an oracle.
8. At teardown require no forbidden attempts and no checkout/top-up/address/hold/ledger mutation.

## Required independent controls

1. **Card binding control:** a request for a sibling/different owned card ID must fail even if type/action/amount match. Persist only `exactProductRefMatch` and `exactPayloadCardIdMatch` booleans.
2. **Card population controls:** zero active cards -> `NO_ACTIVE_OWNED_CARD`; more than one eligible active card without explicit program -> `MULTIPLE_ACTIVE_OWNED_CARDS`.
3. **Wallet semantic control:** `10.00 -> 9.80 principal + 0.20 fee = 10.00 gross`; reject requested-credit interpretations such as `10.00 + fee`.
4. **Selected-source control:** changing Wallet -> USDT -> USDC -> Card/SBP must update selected caption and source-owned rows; a cached prior caption/breakdown cannot pass.
5. **Crypto rail control:** USDT and USDC remain distinct identities, not generic `crypto`; neither displays an acquiring remaining-limit gate.
6. **Options freshness control:** waiter is registered before outer Continue and accepts only a newly started same-origin POST with exact type/action/card/amount.
7. **Backend-option control:** selected inner tile must correspond to the exact `optionId/method/action` and its own breakdown/availability; do not infer from order or fixed caption.
8. **Dry closure control:** no inner submit, no crypto continuation/address, no wallet/Freeland top-up submit, no checkout creation, and zero guard attempts at context close.

## Unresolved limitations

- This audit cannot establish live deployment SHA or runtime behavior. Source parity with local staging snapshot `403d3e...` is attribution only.
- Freeland Balance outer quote cannot be accepted in the existing zero-mutation browser lane because the c469 POST quote path can conditionally upsert `provider_clients`. It remains explicitly pending controlled classification.
- Product source collapses multiple cards in the same program to the first source-order card and provides no card-specific top-up selector/test ID. The consumer can safely handle one active card or explicit unique program, but cannot disambiguate multiple same-program cards through this UI.
- Outer Card/SBP values are estimates until nested `/api/payment/options` returns its source-owned breakdown. Do not accept the fixed estimated 12.9% as the live option contract.
- Availability and limit conditions depend on authenticated account state and backend configuration. Absence/unavailability must be recorded as typed product facts, not silently skipped or forced to PASS.
