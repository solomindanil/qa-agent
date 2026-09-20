# P2 fresh non-author consumer — bounded semantic helper qualification

Date: 2026-09-20 (Asia/Makassar)

## Result

The selected Freeland helper showed the required semantic contrast in an actual headless Chromium consumer:

- **Healthy control:** selected `7.25%` was accepted for authoritative `725` bps with principal `100.00`, fee `7.25`, and total `107.25`.
- **Broken control:** selected `7.26%` was rejected against the same authoritative amounts and `725` bps. The exact helper failure began `selected fee percentage must match its source rate`.
- Both controls recorded `checkoutAttempts: []` and `unknownRequests: []`.

The two Node subtests pass because the second subtest requires and observes the helper rejection. This is not a claim that the broken UI fixture is healthy.

## Source identity and selected path

The cold candidate entry was read at:

- `/Users/danilsolomin/projectsnew/qa-agent/.local/p2-delivery-cold-20260920.Cp0DI9/repo/AGENTS.md`
- `/Users/danilsolomin/projectsnew/qa-agent/.local/p2-delivery-cold-20260920.Cp0DI9/repo/docs/qualification/current.md`
- `/Users/danilsolomin/projectsnew/qa-agent/.local/p2-delivery-cold-20260920.Cp0DI9/repo/sources/manifest.v1.json`

The manifest selects Freeland commit `0ea2df10f1b6d613e01d50011c269ca0fa999877` and tree `1f9913fc1118a2582dd62c4d5dfd63cd8aac0ffb`.

The permitted dependency-bearing execution copy was:

`/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/freeland`

Fresh readback before reporting showed:

- execution `HEAD`: `0ea2df10f1b6d613e01d50011c269ca0fa999877`
- cold restored component `HEAD`: `0ea2df10f1b6d613e01d50011c269ca0fa999877`
- both trees: `1f9913fc1118a2582dd62c4d5dfd63cd8aac0ffb`
- both working trees: clean (`git status --porcelain=v1` returned no lines)
- actual helper blob in both copies: `4d65da207820c4ec08fb101a38d6a9363a0675cf`
- reference seam blob in both copies: `3bde1b4cba58412246e39761650682ea7a988404`
- execution helper SHA-256: `bc5476358fe70d97438b3e15f2004ab02ba41361d4756d6dae5147ffa7b338dd`

## Exact helper invocation

The scratch probe read `tests/freeland/card-sbp.spec.ts`, transpiled those bytes in memory, and appended only the same test-local export seam used by `tests/freeland-main/card-sbp-quote-contract.test.mjs`. No source file or reusable runtime export was changed.

Each control called the actual local symbol with this shape:

```js
openAndVerifyCardSbpSheet({
  page,
  open: page.locator('#open'),
  evidenceName,
  testInfo,
  expectedProduct: {
    productType: 'esim',
    productAction: 'purchase',
  },
})
```

The literal API breakdown supplied independently for both `card` and `sbp` was:

```json
{
  "principalAmountMinor": "10000",
  "sourceFeeAmountMinor": "725",
  "sourceTotalAmountMinor": "10725",
  "sourceFeeRateBps": 725,
  "assetCode": "USD",
  "assetScale": 2
}
```

The literal rendered summary remained `100,00 $`, `7,25 $`, and `107,25 $` in both controls. Only the selected method captions differed: `7.25%` versus `7.26%`.

## Browser and transport boundary

- Node: `v22.23.1`.
- Real headless Chromium was launched through the execution copy's preexisting Playwright dependency.
- Every browser request passed through `context.route('**/*', ...)`.
- Only `GET /fixture` and `POST /api/payment/options` were fulfilled locally.
- `POST /api/payment/checkouts` was explicitly recorded and aborted; neither control attempted it.
- Every other route was recorded as unknown and aborted; neither control generated one.
- Browser contexts used `serviceWorkers: 'block'` and Chromium used `--no-proxy-server`.
- No provider, product, tracker, registry, campaign, or live environment was contacted.

## Evidence files

- Probe: `p2-fresh-consumer-probe.mjs` (SHA-256 `1db889f2ff377fc2e7aabf84a203c7348f768a92d0a5d7e654d9808985ce247b`)
- Raw TAP: `p2-fresh-consumer-raw.log`
- Exact command: `node --test /Users/danilsolomin/projectsnew/qa-agent/.superpowers/sdd/2026-09-16-cross-product-qa-global-plan/p2-fresh-consumer-probe.mjs`
- Command result: exit `0`; `2` subtests, `2` pass, `0` fail/skip/cancel/todo.

No 37-test module or broader repository suite was rerun.

## Authority and coverage limits

This is a narrow P2-A fresh-consumer qualification of the existing semantic helper. It proves that these selected helper bytes, when consumed independently through an actual intercepted browser, accept the coherent 7.25% control and reject the one-basis-point-wrong 7.26% control while preserving exact selected rows and the no-checkout boundary.

It is wholly synthetic and supplies its own API/DOM fixture. It provides **no current tariff proof**, no current product contract proof, no evidence for the original dry card-top-up UI path, no deployed-build or live-product acceptance, no full P2 exit, and no graph, campaign, tracker, financial, cloud, or release authority. It also does not extend the product test framework or create a reusable pipeline.
