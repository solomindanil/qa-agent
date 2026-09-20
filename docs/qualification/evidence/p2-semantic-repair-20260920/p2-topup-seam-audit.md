# P2 next-seam audit: original FREEL-440 card top-up UI

Date: 2026-09-20  
Mode: read-only Lead AQA code/coverage audit; no live QA, product/tracker/network action, implementation, registry/graph mutation, install, commit, or push.

## Audit basis

- QA checkout: `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/freeland`
- Exact audited HEAD: `d45c91f7f9f4517ba6da8c47da5d4b0a4147f295`
- Registry readback: `TC-PAY-07` is `state: "shadow"`, oracle version 2, in `config/freeland/manual-replacements.v1.json`; it is not a qualified/accepted replacement.
- The three requested files and the cited helpers/fixtures were byte-identical to HEAD when checked. Concurrent unrelated worktree changes were outside the audited paths and were not modified.
- This report is a proposal only. It does not authorize source, provenance, registry, graph, campaign, or product changes.

## Verdict

The original FREEL-440 card top-up **rendered UI path is not covered**.

- `tests/freeland-staging-replacements/tc-pay-07.spec.ts:29-32,58-96,183-189` sends a direct authenticated `POST /api/payment/options` for a fixed `10.00` card top-up. It does not navigate `/app/card`, choose an active card, press Top up, enter 10, open the product sheet, or select any rendered payment tile.
- The oracle states this boundary explicitly: `tools/freeland-replacements/tc-pay-07-oracle.mjs:1-7` says there is no rendered PaySheet amount and the top-up rule remains unverified at runtime; `:329` declares `rendered PaySheet price is unobserved`.
- `tests/freeland/card-sbp.spec.ts:79-320` does exercise the real product UI and verifies that each selected Card/SBP tile owns its displayed principal, fee, total, rate/caption, and pressed state. But its only Card UI entry is **issuance**, not top-up (`:436-473`).
- `tests/freeland/freel-277.spec.ts:9-25,38-64` is also Card issuance only.
- `tests/freeland-staging-replacements/tc-wal-01.spec.ts:257-267` visits the card screen only to read the amount available for top-up; it never opens top-up.
- `tests/freeland-staging-replacements/tc-wal-13.spec.ts:14-18,65-88` opens number, eSIM, VPN, and card-issue sheets only. Card top-up is absent.

The graph currently reflects only adjacent evidence:

- `docs/local/freeland/product-graph/mappings.v1.json:1275-1281` maps the selected Card/SBP UI test only to `flow:card.issue`.
- `:1360-1384` maps `flow:card.topup` to the capability boolean test, which proves availability flags, not the top-up UI.
- `:1471-1482` maps the API-only TC-PAY-07 replacement to `manual:TC-PAY-07`, not to a rendered top-up witness.

Therefore neither an API `SHADOW_PASS` nor the existing Card-issue selected-summary test closes original FREEL-440.

## Keep the three identities separate

1. **Card program `wallet`** is an issuance-program identity. `openCardIssueCatalog(..., { program: 'wallet' })` binds a named card program and public card catalog in `tests/freeland-staging-replacements/support/product-flows.ts:94-183`. It is not a funding source for top-up.
2. **Wallet balance `wallet_balance`** is the card-top-up source that the existing QA projection/oracle labels `gross_wallet_debit`. For input `$10.00`, oracle v2 encodes principal/card credit `$9.80`, fee `$0.20` at 200 bps, and total wallet debit `$10.00`. This is an observation about the current QA contract bytes in `tests/freeland-staging-replacements/support/paysheet-observation.ts:152-154` and `tools/freeland-replacements/tc-pay-07-oracle.mjs:291-302`, not independent live/current business acceptance.
3. **Freeland Balance `freeland_balance`** is a distinct source (backed by the `lavaCard` bucket in the current balance oracle), with `requested_card_credit` semantics; it must bind to its own option/breakdown and availability, never be inferred from a generic “Balance” label. See `tools/freeland-replacements/tc-wal-01-oracle.mjs:352-376`.

For a `$10` fixture, oracle v2 currently calculates Card/SBP/Freeland Balance as requested-card-credit sources: principal `$10.00`, encoded 1290-bps fee `$1.29`, total debit `$11.29`. That 1290-bps rule is source-review/manual/oracle-derived (`tools/freeland-replacements/tc-pay-07-oracle.mjs:1-7,253-302`; `docs/local/freeland/MANUAL-TEST-CASES.md:1234-1273`), while the registry remains `shadow` and the last top-up campaign row cited by the oracle was blocked. It must not be described as an independently confirmed current product rate. The older product-pack prose also contains historical 8% and `$10.20` wording, so the follow-up must first confirm the current product contract and then bind every rendered selected method to that run's own selected quote. No fixed global/historical rate may substitute for the selected quote.

### Observation versus inference

- **Observed in this audit:** the exact QA source encodes Wallet 200 bps/gross semantics and Card/SBP/Freeland Balance 1290 bps/requested-credit semantics; independent fixtures enforce those bytes; TC-PAY-07 is registered only as `shadow`; no browser test renders card top-up.
- **Inferred from those sources:** `$10.00` becomes `980/20/1000` for Wallet and `1000/129/1129` for the other three methods under oracle v2.
- **Not observed or established:** that staging/live product currently offers those exact rates, that the values are approved business terms, or that the UI renders them. This audit made no live probe.
- **Required for implementation:** confirm the exact current source/product contract at the selected candidate, then treat the fresh, exact `card/topup` option breakdown as the runtime source for each selected method's UI. A mismatch between that quote and UI is the consumer failure; a mismatch between current product contract and oracle is a separate QA-contract issue, not permission to make the UI test follow stale oracle constants.

## Reusable code already present

### Best consumer location

`tests/freeland/card-sbp.spec.ts` is the minimum existing consumer because it already:

- installs a checkout-creation guard (`installCheckoutCreationGuard`, `:47-60`);
- waits for the exact product/action `/api/payment/options` response before judging UI (`openAndVerifyCardSbpSheet`, `:79-105`);
- redacts receipt/payer fields before any evidence (`:112-117,222-235,305-313`);
- binds Card and SBP independently to their own API method and breakdown (`:187-207,256-303`);
- proves the clicked tile is actually selected and checks exact summary rows, including zero-fee removal and selected caption/rate/amount (`:246-303`);
- closes without creating checkout (`:315-319` and every caller's empty-attempt assertion).

The smallest implementation should stay in this file, adding one focused Card-top-up test and extracting/reusing only the local selected-method summary assertion currently embedded at `:246-303`. It should not create a new runner, oracle family, or generic money schema.

### Safe projection helpers worth reusing, not duplicating

- `projectFinancialPaymentOptions` in `tests/freeland-staging-replacements/support/paysheet-observation.ts:104-164` preserves option identity, source-specific input semantics, availability, payment money, and full breakdown without raw bodies or PII.
- `waitForFinancialPaymentOptions` at `:167-220` admits only a fresh, same-origin, exact product/action/input response. It prevents an earlier or unrelated quote from satisfying the test.
- `readSheetTiles`, `tileLocator`, and strict visible-only identity at `:322-353` preserve `data-payment-method` and selected state without inferring the source from a translated label.

These helpers already have independent local fixture coverage in `tests/freeland-main/payment-financial-projection.test.mjs:31-110,133-218,226-245`. That is code-level evidence, not a registry or live-product qualification. The top-up consumer still needs a real UI opener; none exists today.

### Missing opener

`tests/freeland-staging-replacements/support/product-flows.ts` has `openCardIssueCatalog` only (`:94-183`). A bounded `openCardTopup...` helper would need to:

1. navigate to `/app/card`;
2. bind one active owned card without persisting its ID;
3. open its Top up action;
4. enter `10.00` in the original product UI;
5. return the CTA/locator that triggers the exact `card/topup` options request.

It must return a typed blocker when no active card exists; it must not silently fall back to Card issuance or create a card for setup.

## Exact coverage gap to close

A single dry browser round trip must prove all of the following on the actual Card top-up UI, before any checkout or debit:

1. The request is exactly `productType=card`, `productAction=topup`, the owned card is present, and input is `10.00` / `1000` minor units.
2. After confirming that the owner-scoped original FREEL-440 `$10` / 2% / `$0.20` Wallet requirement is still the current product contract, selecting `wallet_balance` shows the fresh option's own breakdown (oracle v2's expected shape is `$9.80` to card, `$0.20` fee, `$10.00` gross debit); the selected tile is pressed and any explicit fee caption agrees with that same option.
3. Selecting Card and then SBP refreshes the summary from **each selected option's own fresh breakdown**. A correct Card summary cannot satisfy SBP; the test must not hardcode 1290 bps merely because oracle v2 does.
4. Selecting each crypto rail proves `method=crypto`, the rail-specific `optionId`, and `action=wallet_deposit`; it must not retain the previously selected fiat fee, fiat unavailable/limit notice, pressed state, or disabled-submit state.
5. Selecting `freeland_balance` proves that exact source's own fresh breakdown and availability. It must not inherit a previous Card/SBP or crypto summary/limit state, a generic label must not substitute for source identity, and no fixed 1290-bps expectation is accepted without current contract evidence.
6. Switching back to `wallet_balance` restores that fresh Wallet option's method-local summary (expected `$9.80/$0.20/$10.00` only if the confirmed current contract retains the original FREEL-440 semantics), proving state is derived from the current option rather than first-opened or last-fiat state.
7. Zero checkout creation, zero money writes, no raw card/user identifiers in artifacts, and closure by Escape/backdrop remain mandatory.

The stale-state assertions should target exact selected-summary rows and method-specific visible notices/state. A broad `sheet contains/does not contain 2%` assertion is insufficient because unselected tile captions may legitimately remain visible.

## Existing independent fixtures

### Healthy arithmetic and identity controls encoded by oracle v2 (API only)

`tests/product-graph/freeland-smoke-u0-oracles.test.mjs:228-307` already supplies strong independent fixtures:

- mixed wallet vs requested-credit sources remain valid after method reordering (`:243-260`);
- healthy `$5.00`, `$100.00`, and `$5.25` rounding boundaries (`:262-274`);
- wrong semantic, swapped identity, wallet/acquiring cross-use, fee-on-fee, legacy 8%, unknown/duplicate/missing source, malformed units, availability mismatch, and wrong rate all fail (`:276-299`);
- wallet gross `$100` is explicitly not `$102` (`:300-306`).

These qualify the projection/oracle implementation against its own declared contract but intentionally do not render the Card top-up UI, qualify TC-PAY-07, or independently prove current product rates.

### Healthy/broken selected-UI controls (wrong product action today)

`tests/freeland-main/card-sbp-quote-contract.test.mjs` runs the actual `card-sbp.spec.ts` helper against fully intercepted API/DOM fixtures (`:11-37,93-135`). It already has independent healthy and broken controls for:

- selected Card/SBP totals and per-option refresh (`:138-174,188-194,258-260`);
- wrong selected percentage/fixed amount, unknown rate, and malformed arithmetic (`:176-212,236-240`);
- wrong selection, outer-dialog/unselected-tile contamination, missing summary, and checkout-on-select (`:225-233,270-301`).

Its fixture only renders Card/SBP and emits either `card/issue` or non-card purchase (`:73-86,93-118`). It has no card-top-up amount entry, Wallet, Freeland Balance, crypto rails, source-specific availability/limit notice, or multi-source switch sequence.

### Minimum new independent controls

Add source-shaped top-up fixtures beside the existing Card/SBP contract fixture (or a narrowly named sibling module if keeping the fixture readable):

- **Healthy:** exact input `10.00`; after current-contract confirmation, Wallet `980 + 20 = 1000` for the original 2% requirement; Card, SBP, and Freeland Balance each use the fixture's own explicit option breakdown rather than a shared 1290-bps constant; crypto is `wallet_deposit`; sequence Wallet → Card → SBP → crypto → Freeland Balance → Wallet clears and restores the correct method-local state.
- **Broken wallet:** Wallet selection retains requested-credit/fiat rows or displays `$10.20`/`$11.29` instead of `980/20/1000`.
- **Broken Card/SBP:** SBP selection leaves Card's summary/rate or Card selection reads SBP's values.
- **Broken crypto:** after fiat is unavailable or fee-bearing, crypto keeps the fiat fee row, limit/unavailability notice, disabled submit, or old pressed state.
- **Broken Freeland Balance:** selecting it retains the prior fiat/crypto summary or an unrelated method's availability/limit; a generic `Balance` label without exact `data-payment-method="freeland_balance"` cannot pass.
- **Broken return switch:** returning to Wallet does not restore `980/20/1000`.

The API-only fixtures should remain; they are independent controls, not substitutes for this DOM consumer seam.

## Smallest proposed next change

One bounded follow-up slice:

1. In `tests/freeland/card-sbp.spec.ts`, add a single dry actual-product Card-top-up test and reuse/extract the existing selected-summary assertion. Keep the current Card-issue test unchanged.
2. Add only the minimal active-card top-up opener needed by that test, preferably in `tests/freeland-staging-replacements/support/product-flows.ts` if it is shared by the replacement lane; otherwise keep it local to avoid widening the helper API.
3. Extend `tests/freeland-main/card-sbp-quote-contract.test.mjs` with the healthy and broken top-up switch fixtures above. Reuse `projectFinancialPaymentOptions`/`waitForFinancialPaymentOptions`; do not add a new schema or engine.
4. Refresh only owned provenance rows required by the changed private files.
5. After independent review, add one exact graph selector from the new test to `flow:card.topup` (and to `manual:TC-PAY-07` only if the rendered observation is deliberately incorporated into that accepted case). Do not relabel the existing API-only TC-PAY-07 result as UI evidence.

Before RED, the implementation brief should cite the current candidate's product contract for Wallet semantics and method availability/rate ownership. At runtime the test should compare the selected UI to the exact fresh selected quote. Oracle v2 values remain independent fixture controls, not business-authority inputs.

Do **not** make TC-PAY-07 oracle v3 merely to carry DOM state unless the owner explicitly chooses that broader registry/qualification task. The lower-risk first seam is the already-reviewed, independently fixture-tested Card/SBP selected-summary consumer plus new top-up fixtures.

## Non-claims

- No live staging behavior was observed.
- No FREEL-440 `FIXED`/acceptance verdict is made.
- No 200-bps or 1290-bps rate is declared independently accepted/current from the QA oracle alone; TC-PAY-07 remains `shadow`.
- This does not cover provider checkout, actual top-up settlement, daily-limit backend enforcement, or post-payment card/wallet balances.
- No source, provenance, registry, receipt, graph, product, or tracker state was changed by this audit.
