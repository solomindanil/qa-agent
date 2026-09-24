# OC-Q DOM-only local controller run — 24 September 2026

This is one fresh, open-context **controller** qualification of the
[OC-Q DOM-only extension](../../cases-quantity-dom-only.md) and
[separate reviewer rubric](../../reviewer-rubric-quantity-dom-only.md).
It is not an actor trial, a product run, or a revised score for the frozen
first-design 1/4 denominator. Source baseline was
`bc534cfdcb4fc450c99ac1143fb2be430b57b638` on isolated branch
`codex/ocq-dom-only-isolated`. Only the local loopback fixture was used.
Browser tests borrowed the existing Playwright module at
`/Users/danilsolomin/projectsnew/qa-agent/components/console/node_modules/playwright/index.mjs`;
this is warm dependency reuse, not a cold install.

The test-first break being exercised is specific: before the fixture accepts
`quantity-dom-only`, both new tests fail with `Unknown fault`. That RED
establishes missing fixture capability, **not** a defect in the old evaluator.
After the fixture change, all quote responses remain correct; the browser
captures Q1/Q2/Q3 before comparing each against the unchanged healthy
expected row. Its exact Q2 capture is
`{requested:2,quantity:2,totalMinor:400,currency:'USD',rendered:200}`;
the capture wait observes `data-request=2`. The healthy comparator rejects
Q2 and accepts Q1/Q3. No actor was dispatched.

## First RED — HTTP fixture test

Command from this isolated root:
`node --test evals/outcome-completion/fixture.test.mjs`

Exit 1; complete first output:

~~~text
TAP version 13
# Subtest: loopback contract, isolation and rejection
ok 1 - loopback contract, isolation and rejection
  ---
  duration_ms: 59.634625
  type: 'test'
  ...
# Subtest: quantity fault preserves plausible one-item success
ok 2 - quantity fault preserves plausible one-item success
  ---
  duration_ms: 23.592667
  type: 'test'
  ...
# Subtest: quantity-dom-only fault keeps every quote response correct
not ok 3 - quantity-dom-only fault keeps every quote response correct
  ---
  duration_ms: 0.292958
  type: 'test'
  location: '/Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-dom-only/evals/outcome-completion/fixture.test.mjs:48:1'
  failureType: 'testCodeFailure'
  error: 'Unknown fault'
  code: 'ERR_TEST_FAILURE'
  stack: |-
    startOutcomeFixture (file:///Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-dom-only/evals/outcome-completion/fixture.mjs:4:11)
    TestContext.<anonymous> (file:///Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-dom-only/evals/outcome-completion/fixture.test.mjs:49:19)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.postRun (node:internal/test_runner/test:1173:19)
    Test.run (node:internal/test_runner/test:1101:12)
    process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)
  ...
1..3
# tests 3
# suites 0
# pass 2
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 231.009583
~~~

## First RED — browser control

Command:
`QA_PLAYWRIGHT_MODULE=/Users/danilsolomin/projectsnew/qa-agent/components/console/node_modules/playwright/index.mjs node --test evals/outcome-completion/browser.test.mjs`

Exit 1; complete first output:

~~~text
TAP version 13
# Subtest: outcome controls: none
ok 1 - outcome controls: none
  ---
  duration_ms: 1968.150083
  type: 'test'
  ...
# Subtest: outcome controls: guide
ok 2 - outcome controls: guide
  ---
  duration_ms: 758.378666
  type: 'test'
  ...
# Subtest: outcome controls: quantity
ok 3 - outcome controls: quantity
  ---
  duration_ms: 907.309917
  type: 'test'
  ...
# Subtest: outcome controls: quantity-dom-only
not ok 4 - outcome controls: quantity-dom-only
  ---
  duration_ms: 0.273125
  type: 'test'
  location: '/Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-dom-only/evals/outcome-completion/browser.test.mjs:59:3'
  failureType: 'testCodeFailure'
  error: 'Unknown fault'
  code: 'ERR_TEST_FAILURE'
  stack: |-
    startOutcomeFixture (file:///Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-dom-only/evals/outcome-completion/fixture.mjs:4:11)
    TestContext.<anonymous> (file:///Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-dom-only/evals/outcome-completion/browser.test.mjs:60:21)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.processPendingSubtests (node:internal/test_runner/test:1173:19)
    Test.postRun (node:internal/test_runner/test:1101:12)
    Test.run (node:internal/test_runner/test:744:7)
  ...
# Subtest: outcome controls: persistence
ok 5 - outcome controls: persistence
  ---
  duration_ms: 742.14575
  type: 'test'
  ...
# Subtest: correct guide heading with stale instructions is rejected
ok 6 - correct guide heading with stale instructions is rejected
  ---
  duration_ms: 504.907083
  type: 'test'
  ...
# Subtest: hidden guide heading is rejected
ok 7 - hidden guide heading is rejected
  ---
  duration_ms: 443.903459
  type: 'test'
  ...
# Subtest: opacity-zero guide container is rejected
ok 8 - opacity-zero guide container is rejected
  ---
  duration_ms: 329.22975
  type: 'test'
  ...
# Subtest: guide detail sourced only from a hidden child is rejected
ok 9 - guide detail sourced only from a hidden child is rejected
  ---
  duration_ms: 306.674084
  type: 'test'
  ...
# Subtest: hidden selected total is rejected
ok 10 - hidden selected total is rejected
  ---
  duration_ms: 708.069458
  type: 'test'
  ...
# Subtest: hidden persisted note after reload is rejected
ok 11 - hidden persisted note after reload is rejected
  ---
  duration_ms: 1370.065166
  type: 'test'
  ...
1..11
# tests 11
# suites 0
# pass 10
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 9147.761917
~~~

## Focused GREEN — HTTP fixture test

Same HTTP command; exit 0; complete output:

~~~text
TAP version 13
# Subtest: loopback contract, isolation and rejection
ok 1 - loopback contract, isolation and rejection
  ---
  duration_ms: 58.025541
  type: 'test'
  ...
# Subtest: quantity fault preserves plausible one-item success
ok 2 - quantity fault preserves plausible one-item success
  ---
  duration_ms: 19.941125
  type: 'test'
  ...
# Subtest: quantity-dom-only fault keeps every quote response correct
ok 3 - quantity-dom-only fault keeps every quote response correct
  ---
  duration_ms: 4.886833
  type: 'test'
  ...
1..3
# tests 3
# suites 0
# pass 3
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 241.36425
~~~

## Focused GREEN — browser control

Same browser command; exit 0; complete output:

~~~text
TAP version 13
# Subtest: outcome controls: none
ok 1 - outcome controls: none
  ---
  duration_ms: 1303.768959
  type: 'test'
  ...
# Subtest: outcome controls: guide
ok 2 - outcome controls: guide
  ---
  duration_ms: 774.331375
  type: 'test'
  ...
# Subtest: outcome controls: quantity
ok 3 - outcome controls: quantity
  ---
  duration_ms: 787.567625
  type: 'test'
  ...
# Subtest: outcome controls: quantity-dom-only
ok 4 - outcome controls: quantity-dom-only
  ---
  duration_ms: 708.992542
  type: 'test'
  ...
# Subtest: outcome controls: persistence
ok 5 - outcome controls: persistence
  ---
  duration_ms: 569.032292
  type: 'test'
  ...
# Subtest: correct guide heading with stale instructions is rejected
ok 6 - correct guide heading with stale instructions is rejected
  ---
  duration_ms: 353.584583
  type: 'test'
  ...
# Subtest: hidden guide heading is rejected
ok 7 - hidden guide heading is rejected
  ---
  duration_ms: 948.684875
  type: 'test'
  ...
# Subtest: opacity-zero guide container is rejected
ok 8 - opacity-zero guide container is rejected
  ---
  duration_ms: 902.192792
  type: 'test'
  ...
# Subtest: guide detail sourced only from a hidden child is rejected
ok 9 - guide detail sourced only from a hidden child is rejected
  ---
  duration_ms: 561.119125
  type: 'test'
  ...
# Subtest: hidden selected total is rejected
ok 10 - hidden selected total is rejected
  ---
  duration_ms: 513.413708
  type: 'test'
  ...
# Subtest: hidden persisted note after reload is rejected
ok 11 - hidden persisted note after reload is rejected
  ---
  duration_ms: 536.523125
  type: 'test'
  ...
1..11
# tests 11
# suites 0
# pass 11
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 8406.943625
~~~

## Additional bounded verification

- `npm test` from this isolated root: exit 0, 61 tests / 61 pass / 0 fail.
  This is root packaging verification, not product acceptance.
- `npm run sources:verify`: exit 0, `sources_verified` for the four
  manifest-selected components; it does not verify these new evaluator bytes.
- `node --check` on fixture and both modified test files: each exit 0.
- `git diff --check`: exit 0.

No install, product, provider, payment, tracker or actor action occurred in
this controller run. Independent AQA review returned GO for this bounded
code-and-oracle slice (Critical/Important/Minor 0/0/0); the reviewer reported
reruns of HTTP 3/3, browser 11/11, root 61/61, source verification and diff
check. The browser rerun took 220.6 seconds on that host. These are local
controller checks, not an unaided actor detection or live-product acceptance.
