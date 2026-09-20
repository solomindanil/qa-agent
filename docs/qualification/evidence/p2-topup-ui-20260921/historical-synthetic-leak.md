# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: probe.spec.ts >> Freeland card top-up quote contract >> selected Wallet, Card, SBP and crypto quotes stay source-specific without payment
- Location: tests/freeland/card-topup-quote.spec.ts:8:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByTestId('card-topup-checkout-sheet').locator('input[type="number"]')
Expected: 1
Received: 0
Timeout:  150ms

Call log:
  - Expect "toHaveCount" with timeout 150ms
  - waiting for getByTestId('card-topup-checkout-sheet').locator('input[type="number"]')
    7 × locator resolved to 0 elements
      - unexpected value "0"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - paragraph [ref=e2]: SECRET-PAN
  - generic [ref=e3]:
    - text: Receipt
    - textbox "Receipt" [ref=e4]: SECRET-EMAIL
  - button "Пополнить карту" [active] [ref=e5]
  - dialog [ref=e6]: "Broken literal drawer: amount input is missing."
```

# Test source

```ts
  1   | import { expect, type Locator, type Page } from '@playwright/test';
  2   | import { expectNoDryBrowserMutations, requireDryBrowserGuard } from './pay-sheet';
  3   | import { waitForFinancialPaymentOptions } from './paysheet-observation';
  4   | import { expectQuoteRow, expectSelectedQuote } from './quote-assertions';
  5   | 
  6   | const record = (value: unknown): Record<string, unknown> =>
  7   |   value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  8   | function fail(code: string): never { throw new Error(`CARD_TOPUP_FIXTURE:${code}`); }
  9   | const minor = (value: unknown): bigint | null => typeof value === 'string' && /^\d+\.\d{2}$/.test(value) ? BigInt(value.replace('.', '')) : null;
  10  | const money = (value: bigint): string => {
  11  |   const sign = value < 0n ? '-' : '';
  12  |   const digits = (value < 0n ? -value : value).toString().padStart(3, '0');
  13  |   return `${sign}${digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')},${digits.slice(-2)} $`;
  14  | };
  15  | const labels = { balance: 'Баланс', card: 'Карта РФ', sbp: 'СБП', usdt_trc20: 'USDT trc20', usdc_erc20: 'USDC erc20' } as const;
  16  | type Source = keyof typeof labels;
  17  | const selected = async (sheet: Locator, source: Source) => {
  18  |   const tile = sheet.getByRole('button', { name: labels[source], exact: true });
  19  |   if (await tile.count() !== 1 || !await tile.isVisible() || !await tile.isEnabled()) fail('SOURCE_TILE_UNAVAILABLE');
  20  |   await tile.click();
  21  |   await expect(tile).toHaveAttribute('aria-pressed', 'true');
  22  |   await expect(sheet.locator('button[aria-pressed="true"]')).toHaveCount(1);
  23  |   await expectQuoteRow(sheet, 'Выбранный способ оплаты', labels[source]);
  24  |   return tile;
  25  | };
  26  | 
  27  | /** Exact c469 source contract only. No current tariff or live release acceptance claim. */
  28  | export const verifyOriginalCardTopupQuote = async ({ page, baseURL, timeout = 15_000 }: {
  29  |   page: Page; baseURL: string | undefined; timeout?: number;
  30  | }) => {
  31  |   const attempts = requireDryBrowserGuard(page);
  32  |   const origin = new URL(baseURL ?? fail('BASE_URL_REQUIRED')).origin;
  33  |   // Fresh test-owned page: capture the real authenticated product bootstrap before navigation.
  34  |   const read = (pathname: string) => page.waitForResponse(response => {
  35  |     const url = new URL(response.url());
  36  |     return url.origin === origin && url.pathname === pathname && response.request().method() === 'GET';
  37  |   }, { timeout }).then(async response => response.status() === 200 ? record(await response.json()) : null).catch(() => null);
  38  |   const reads = Promise.all([read('/api/me/shell'), read('/api/wallet/balance'), read('/api/payment/capabilities')]);
  39  |   await page.goto(`${origin}/app/card`);
  40  |   const [me, wallet, capabilities] = await reads;
  41  |   if (!me || typeof me.userId !== 'string' || !me.userId) fail('AUTHENTICATED_CARD_CATALOG_UNAVAILABLE');
  42  |   const cards = Array.isArray(me.cards) ? me.cards.map(record) : me.card ? [record(me.card)] : [];
  43  |   const active = cards.filter(card => card.status === 'active');
  44  |   if (!active.length) fail('NO_ACTIVE_OWNED_CARD');
  45  |   if (active.length !== 1) fail('MULTIPLE_ACTIVE_OWNED_CARDS');
  46  |   const cardId = active[0]!.cardId;
  47  |   if (typeof cardId !== 'string' || !cardId) fail('OWNED_CARD_ID_UNAVAILABLE');
  48  |   if (!capabilities || record(capabilities.actions)['card.topup'] !== true
  49  |     || record(capabilities.externalMethods).card !== true || record(capabilities.externalMethods).sbp !== true) fail('TARGET_TOPUP_ROUTE_UNAVAILABLE');
  50  |   if (!wallet) fail('WALLET_BALANCE_UNAVAILABLE');
  51  |   const balance = minor(record(wallet.cardSpendableBalance).available
  52  |     ?? record(record(wallet.sourceBalances).wallet).available ?? wallet.balance ?? me.balance);
  53  |   if (balance === null) fail('WALLET_BALANCE_UNAVAILABLE');
  54  |   // c469 card:actions.topUpCard; common:actions.topUp is the unrelated Wallet header.
  55  |   const open = page.getByRole('button', { name: 'Пополнить карту', exact: true }).and(page.locator('button:enabled'));
  56  |   // No first-card fallback: matching authenticated ownership plus one enabled control is required.
  57  |   await expect(open).toBeVisible({ timeout }).catch(() => fail('TOPUP_CONTROL_UNAVAILABLE'));
  58  |   if (await open.count() !== 1) fail('TOPUP_CONTROL_UNAVAILABLE');
  59  |   await open.click();
  60  |   const outer = page.getByTestId('card-topup-checkout-sheet');
  61  |   await expect(outer).toBeVisible();
  62  |   await expect(outer).toHaveAttribute('data-step', 'checkout');
  63  |   const input = outer.locator('input[type="number"]');
> 64  |   await expect(input).toHaveCount(1);
      |                       ^ Error: expect(locator).toHaveCount(expected) failed
  65  |   await input.fill('10.00');
  66  |   const noFiatLeak = async () => {
  67  |     await expect(outer.getByText('Остаток лимита оплаты картой', { exact: true })).toHaveCount(0);
  68  |     await expect(outer.getByText('Оценка комиссии оплаты', { exact: true })).toHaveCount(0);
  69  |     await expect(outer.getByText('Оценка суммы к оплате', { exact: true })).toHaveCount(0);
  70  |     await expect(outer.getByText(/Сумма больше остатка лимита/)).toHaveCount(0);
  71  |     await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  72  |   };
  73  |   const walletCheck = async () => {
  74  |     await selected(outer, 'balance');
  75  |     await expectQuoteRow(outer, 'Комиссия выбранного способа', '2%');
  76  |     await expectQuoteRow(outer, 'Спишется с крипто баланса', '10,00 $');
  77  |     await expectQuoteRow(outer, 'Комиссия пополнения карты', '0,20 $');
  78  |     await expectQuoteRow(outer, 'На карту поступит', '9,80 $');
  79  |     await expectQuoteRow(outer, 'Останется крипто баланс', money(balance! - 1000n));
  80  |     await noFiatLeak();
  81  |     await expect(outer.getByText('К оплате', { exact: true })).toHaveCount(0);
  82  |     const submit = outer.getByRole('button', { name: 'Пополнить', exact: true });
  83  |     const insufficient = outer.getByText('На балансе аккаунта недостаточно средств', { exact: true });
  84  |     if (balance! < 1000n) { await expect(submit).toBeDisabled(); await expect(insufficient).toBeVisible(); }
  85  |     else { await expect(submit).toBeEnabled(); await expect(insufficient).toHaveCount(0); }
  86  |   };
  87  |   await walletCheck();
  88  |   const fiat: Array<{ method: 'card' | 'sbp'; principalMinor: string; feeMinor: string; totalMinor: string; rateBps: number | null }> = [];
  89  |   for (const source of ['card', 'sbp'] as const) {
  90  |     const tile = await selected(outer, source);
  91  |     await expect(tile).toContainText('Оценка комиссии 12,9%');
  92  |     await expect(outer.getByText('Комиссия выбранного способа', { exact: true })).toHaveCount(0);
  93  |     await expectQuoteRow(outer, 'На карту поступит', '10,00 $');
  94  |     await expectQuoteRow(outer, 'Оценка комиссии оплаты', '1,29 $');
  95  |     await expectQuoteRow(outer, 'Оценка суммы к оплате', '11,29 $');
  96  |     await expectQuoteRow(outer, 'Остаток лимита оплаты картой', '200,00 $');
  97  |   }
  98  |   // c469 caches identical options for 15 seconds. One freshly opened PaySheet owns
  99  |   // both offered method breakdowns; do not reopen and pretend a cached response is fresh.
  100 |   await selected(outer, 'card');
  101 |   const proceed = outer.getByRole('button', { name: 'Перейти к оплате', exact: true });
  102 |   if (!await proceed.isEnabled()) fail('TARGET_TOPUP_CONTINUE_UNAVAILABLE');
  103 |   // Register before the sole permitted submit-like click. Await completion even if click fails.
  104 |   const optionsPromise = waitForFinancialPaymentOptions(page, {
  105 |     productType: 'card', productAction: 'topup', inputAmountMinor: '1000', existingEntityPresent: true, exactCardId: cardId as string,
  106 |   }, undefined, timeout);
  107 |   const [observation, click] = await Promise.allSettled([optionsPromise, proceed.click()]);
  108 |   if (click.status === 'rejected') fail('TARGET_TOPUP_CONTINUE_UNAVAILABLE');
  109 |   if (observation.status === 'rejected') fail('OPTIONS_OBSERVATION_FAILED');
  110 |   const options = observation.value;
  111 |   if (options.errorCode) fail(options.errorCode);
  112 |   if (options.status !== 200 || !options.financial) fail('OPTIONS_UNAVAILABLE');
  113 |   const inner = page.getByTestId('pay-sheet');
  114 |   await expect(inner).toBeVisible();
  115 |   for (const source of ['card', 'sbp'] as const) {
  116 |     const candidates = options.financial.methods.filter(method => method.optionId === source && method.method === source && method.action === 'external_checkout');
  117 |     if (candidates.length !== 1 || candidates[0]!.available !== true) fail('FIAT_OPTION_UNAVAILABLE');
  118 |     const option = candidates[0]!;
  119 |     const innerTile = inner.getByRole('button', { name: labels[source], exact: true });
  120 |     // PaySheet c469 maps UX ru_card to data-payment-method=card for card products.
  121 |     await expect(innerTile).toHaveAttribute('data-payment-method', source);
  122 |     await expect(innerTile).toBeEnabled();
  123 |     if (option.breakdown.principalAmountMinor !== '1000') fail('FIAT_PRINCIPAL_MISMATCH');
  124 |     await expectSelectedQuote(inner, innerTile, option.breakdown);
  125 |     fiat.push({ method: source, principalMinor: option.breakdown.principalAmountMinor!, feeMinor: option.breakdown.sourceFeeAmountMinor!, totalMinor: option.breakdown.sourceTotalAmountMinor!, rateBps: option.breakdown.sourceFeeRateBps });
  126 |   }
  127 |   await page.keyboard.press('Escape');
  128 |   await expect(inner).toBeHidden();
  129 |   await expect(outer).toBeVisible();
  130 |   for (const source of ['usdt_trc20', 'usdc_erc20'] as const) {
  131 |     const tile = await selected(outer, source);
  132 |     await expect(tile).toContainText('Комиссия 2%');
  133 |     await expectQuoteRow(outer, 'Комиссия выбранного способа', '2%');
  134 |     await expectQuoteRow(outer, 'На карту поступит', '10,00 $');
  135 |     await expectQuoteRow(outer, 'Комиссия оплаты', '0,20 $');
  136 |     await expectQuoteRow(outer, 'К оплате', '10,20 $');
  137 |     await noFiatLeak();
  138 |     await expect(outer.getByText('Спишется с крипто баланса', { exact: true })).toHaveCount(0);
  139 |     await expect(outer.getByText('На балансе аккаунта недостаточно средств', { exact: true })).toHaveCount(0);
  140 |     await expect(outer.getByRole('button', { name: 'Перейти к оплате', exact: true })).toBeEnabled();
  141 |   }
  142 |   // Bounded high-amount edit catches a stale 200 fiat gate. Never click any CTA here.
  143 |   await selected(outer, 'card');
  144 |   await input.fill('201.00');
  145 |   await expect(outer.getByRole('button', { name: 'Перейти к оплате', exact: true })).toBeDisabled();
  146 |   for (const source of ['usdt_trc20', 'usdc_erc20'] as const) {
  147 |     await selected(outer, source);
  148 |     await noFiatLeak();
  149 |     await expect(outer.getByRole('button', { name: 'Перейти к оплате', exact: true })).toBeEnabled();
  150 |   }
  151 |   await input.fill('10.00');
  152 |   await walletCheck();
  153 |   await outer.getByRole('button', { name: 'Закрыть', exact: true }).click({ position: { x: 5, y: 5 } });
  154 |   await expect(outer).toBeHidden();
  155 |   expectNoDryBrowserMutations(attempts);
  156 |   return {
  157 |     status: 'SOURCE_QUALIFIED' as const,
  158 |     covered: ['balance', 'card', 'sbp', 'usdt_trc20', 'usdc_erc20'],
  159 |     excluded: [{ source: 'freeland_balance', reason: 'FREELAND_QUOTE_MUTATION_RISK' }],
  160 |     amountMinor: '1000', wallet: { principalMinor: '980', feeMinor: '20', totalMinor: '1000', rateBps: 200, sufficient: balance! >= 1000n },
  161 |     crypto: { principalMinor: '1000', feeMinor: '20', totalMinor: '1020', rateBps: 200 },
  162 |     fiat, outerFiat: 'ESTIMATE_ONLY', exactProductRefMatch: true, exactPayloadCardIdMatch: true,
  163 |     acceptance: 'LOCAL_SOURCE_CONTRACT_ONLY',
  164 |   };
```