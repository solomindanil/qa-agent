# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: probe.spec.ts >> Freeland card top-up quote contract >> selected Wallet, Card, SBP and crypto quotes stay source-specific without payment
- Location: tests/freeland/card-topup-quote.spec.ts:39:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: getByTestId('card-topup-checkout-sheet').getByText('Выбранный способ оплаты', { exact: true }).locator('..').locator(':scope > span')
Timeout: 150ms
- Expected  - 1
+ Received  + 1

  Array [
    "Выбранный способ оплаты",
-   "Баланс",
+   "SECRET-PAN SECRET-EMAIL",
  ]

Call log:
  - Expect "toHaveText" with timeout 150ms
  - waiting for getByTestId('card-topup-checkout-sheet').getByText('Выбранный способ оплаты', { exact: true }).locator('..').locator(':scope > span')
    7 × locator resolved to 2 elements

```

# Test source

```ts
  1  | import { expect, type Locator } from '@playwright/test';
  2  | 
  3  | export type QuoteBreakdown = {
  4  |   principalAmountMinor: string | null;
  5  |   sourceFeeAmountMinor: string | null;
  6  |   sourceTotalAmountMinor: string | null;
  7  |   sourceFeeRateBps: number | null;
  8  |   assetCode: string | null;
  9  |   assetScale: number | null;
  10 | };
  11 | export const expectQuoteRow = async (sheet: Locator, label: string, value: string) => {
  12 |   const heading = sheet.getByText(label, { exact: true });
  13 |   await expect(heading).toBeVisible();
  14 |   expect(await heading.evaluate((node) => node.closest('button') === null), 'summary must not be a method tile caption').toBe(true);
> 15 |   await expect(heading.locator('..').locator(':scope > span')).toHaveText([label, value]);
     |                                                                ^ Error: expect(locator).toHaveText(expected) failed
  16 | };
  17 | 
  18 | /** Shared P2-A/P2-B oracle: exact selected source, integer USD arithmetic and captions. */
  19 | export const expectSelectedQuote = async (
  20 |   sheet: Locator, tile: Locator, breakdown: QuoteBreakdown | null | undefined,
  21 |   principalLabel = 'На карту поступит', feeLabel = 'Комиссия оплаты', versionedIssue = false,
  22 | ): Promise<void> => {
  23 |   expect(breakdown, 'each offered method requires its own authoritative breakdown').toBeTruthy();
  24 |   if (!breakdown) throw new Error('PAYMENT_BREAKDOWN_MISSING');
  25 |   expect(breakdown.assetCode).toBe('USD');
  26 |   expect(breakdown.assetScale).toBe(2);
  27 |   for (const amount of [breakdown.principalAmountMinor!, breakdown.sourceFeeAmountMinor!, breakdown.sourceTotalAmountMinor!]) {
  28 |     expect(amount, 'quote amounts must be nonnegative integer minor units').toMatch(/^\d+$/);
  29 |   }
  30 |   expect(BigInt(breakdown.principalAmountMinor!) + BigInt(breakdown.sourceFeeAmountMinor!)).toBe(BigInt(breakdown.sourceTotalAmountMinor!));
  31 |   const money = (minor: string) => {
  32 |     const digits = BigInt(minor).toString().padStart(3, '0');
  33 |     return `${digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')},${digits.slice(-2)} $`;
  34 |   };
  35 |   await tile.click();
  36 |   await expect(tile).toHaveAttribute('aria-pressed', 'true');
  37 |   await expectQuoteRow(sheet, principalLabel, money(breakdown.principalAmountMinor!));
  38 |   await expectQuoteRow(sheet, 'К оплате', money(breakdown.sourceTotalAmountMinor!));
  39 |   if (BigInt(breakdown.sourceFeeAmountMinor!) === 0n) {
  40 |     await expect(sheet.getByText(feeLabel, { exact: true })).toHaveCount(0);
  41 |     await expect(tile).not.toContainText(/комиссия|\d+(?:[.,]\d+)?%/i);
  42 |   } else {
  43 |     await expectQuoteRow(sheet, feeLabel, money(breakdown.sourceFeeAmountMinor!));
  44 |     const tileText = await tile.textContent() ?? '';
  45 |     const percentages = [...tileText.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)];
  46 |     if (percentages.length > 0) {
  47 |       expect(
  48 |         Number.isInteger(breakdown.sourceFeeRateBps)
  49 |           && breakdown.sourceFeeRateBps! >= 0
  50 |           && breakdown.sourceFeeRateBps! <= 10_000,
  51 |         'selected fee percentage requires a valid source rate',
  52 |       ).toBe(true);
  53 |       for (const percentage of percentages) {
  54 |         const [wholePercent, fractionalPercent = ''] = percentage[1]!.split(/[.,]/);
  55 |         expect(fractionalPercent.length, 'selected fee percentage must resolve to whole basis points').toBeLessThanOrEqual(2);
  56 |         const displayedRateBps = BigInt(wholePercent!) * 100n + BigInt(fractionalPercent.padEnd(2, '0'));
  57 |         expect(displayedRateBps, 'selected fee percentage must match its source rate').toBe(BigInt(breakdown.sourceFeeRateBps!));
  58 |       }
  59 |     }
  60 |     const fixedFee = tileText.match(/комисси[яи][^0-9%]*?(\d[\d \u00a0]*(?:[.,]\d{2}))\s*(?:USDT|\$)/iu);
  61 |     if (fixedFee) {
  62 |       const [major, minor] = fixedFee[1]!.replace(/[ \u00a0]/g, '').split(/[.,]/);
  63 |       const displayedFeeMinor = BigInt(major!) * 100n + BigInt(minor!);
  64 |       expect(displayedFeeMinor, 'selected fee amount must match its source fee').toBe(BigInt(breakdown.sourceFeeAmountMinor!));
  65 |     }
  66 |   }
  67 |   if (versionedIssue) await expectQuoteRow(sheet, 'Начальный баланс карты', '0,00 $');
  68 | };
  69 | 
```