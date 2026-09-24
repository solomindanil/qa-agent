# OC-Q response-only local controller run — 24 September 2026

This is one bounded, open-context **controller** qualification of the
[response-only case](../../cases-quantity-response-only.md) and
[separate reviewer rubric](../../reviewer-rubric-quantity-response-only.md).
It is not an actor trial, a product run or a change to the frozen first-design
1/4 denominator. Base SHA was `652d27bc05d684f789642fbf04bcf30b68b01aa1`
on isolated normal-clone branch `codex/ocq-response-only-isolated`. Only the
owned loopback fixture was touched. Playwright used the existing module at
`/Users/danilsolomin/projectsnew/qa-agent/components/console/node_modules/playwright/index.mjs`;
there was no dependency install.

Before edits, `npm run sources:restore` and `npm run sources:verify` each
exited 0 and reported `sources_verified` for all four manifest components.
Baseline `node --test evals/outcome-completion/fixture.test.mjs` passed 3/3;
the browser command below passed 11/11; root `npm test` passed 61/61.

The TDD break was a missing opt-in fixture capability. Each first focused RED
below failed with `Unknown fault` **before** quantity evaluation, not because
an old evaluator detected the seeded response error. After the minimal fixture
change, both focused tests passed. HTTP now asserts status and exact fields
for Q1/Q2/Q3 on healthy and response-only origins. The browser captures all
three matching GET responses and visible totals, asserting each frozen unit
price, actual native select value and `data-request` marker. Its Q2 row is
`{requested:2,quantity:2,totalMinor:200,currency:'USD',rendered:400}`;
the unchanged normative comparison rejects only Q2. Q1/Q3 and the older
controls remain accepted. The DOM-only control remains distinct.

## First RED — HTTP

Command: `node --test --test-name-pattern='quantity-response-only fault changes only' evals/outcome-completion/fixture.test.mjs`

Exit 1; complete output:

~~~text
TAP version 13
# Subtest: quantity-response-only fault changes only the Q2 quote total
not ok 1 - quantity-response-only fault changes only the Q2 quote total
  ---
  duration_ms: 32.839125
  type: 'test'
  location: '/Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-response-only/evals/outcome-completion/fixture.test.mjs:61:1'
  failureType: 'testCodeFailure'
  error: 'Unknown fault'
  code: 'ERR_TEST_FAILURE'
  stack: |-
    startOutcomeFixture (file:///Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-response-only/evals/outcome-completion/fixture.mjs:4:11)
    TestContext.<anonymous> (file:///Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-response-only/evals/outcome-completion/fixture.test.mjs:66:21)
    process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    async Test.run (node:internal/test_runner/test:1054:7)
    async Test.processPendingSubtests (node:internal/test_runner/harness:296:3)
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 167.687125
~~~

## First RED — browser

Command: `QA_PLAYWRIGHT_MODULE=/Users/danilsolomin/projectsnew/qa-agent/components/console/node_modules/playwright/index.mjs node --test --test-name-pattern='outcome controls: quantity-response-only' evals/outcome-completion/browser.test.mjs`

Exit 1; complete output:

~~~text
TAP version 13
# Subtest: outcome controls: quantity-response-only
not ok 1 - outcome controls: quantity-response-only
  ---
  duration_ms: 1.108667
  type: 'test'
  location: '/Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-response-only/evals/outcome-completion/browser.test.mjs:65:3'
  failureType: 'testCodeFailure'
  error: 'Unknown fault'
  code: 'ERR_TEST_FAILURE'
  stack: |-
    startOutcomeFixture (file:///Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-response-only/evals/outcome-completion/fixture.mjs:4:11)
    TestContext.<anonymous> (file:///Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-response-only/evals/outcome-completion/browser.test.mjs:66:21)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.startSubtestAfterBootstrap (node:internal/test_runner/harness:296:17)
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 355.04525
~~~

## Focused GREEN — HTTP

Same HTTP command; exit 0; complete output:

~~~text
TAP version 13
# Subtest: quantity-response-only fault changes only the Q2 quote total
ok 1 - quantity-response-only fault changes only the Q2 quote total
  ---
  duration_ms: 59.396
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 208.961041
~~~

## Focused GREEN — browser

Same browser command; exit 0; complete output:

~~~text
TAP version 13
# Subtest: outcome controls: quantity-response-only
ok 1 - outcome controls: quantity-response-only
  ---
  duration_ms: 1393.087625
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1793.259709
~~~

## Scoped verification and limits

- Full HTTP fixture suite: exit 0, 4/4 passed.
- Full browser suite: exit 0, 12/12 passed.
- Final root `npm test`: exit 0, 61/61 passed, 0 failed/skipped. This is
  packaging verification, not product acceptance.
- Final `npm run sources:verify`: exit 0, `sources_verified` for the four
  exact manifest components; this verifies source pins, not these new
  evaluator bytes.
- `node --check` on `fixture.mjs`, `fixture.test.mjs`, and
  `browser.test.mjs`: all exit 0. `git diff --check`: exit 0.
- No actor trial, product/provider/payment/tracker action, install, source pin,
  public API/schema, runner, verdict or storage change. Independent AQA review
  gave **GO** for this bounded controller slice (Critical/Important/Minor
  0/0/0) after inspecting the final seven-path diff, first RED, focused GREEN
  and full-check record; the reviewer did not rerun tests and relied on the
  Sol checks recorded here. This is not full I07 or live acceptance.
