# Browser journey assertions — reviewed portable candidate

This record preserves candidate qualification before adoption. The owner-approved
[canonical adoption](browser-journey-adoption-20260914.md) now selects the same
source66ac7db; the historical inactive wording below is not a current selector.

14 September 2026. **Implemented, independently reviewed and cold-checked;
not manifest-selected.** This extends the existing Console evaluator, not the
product or a second QA engine. Existing campaigns, installed skills, Kernel,
Freeland, tracker and cloud remain unchanged.

## Exact delivery

- Console commit: `66ac7db55a25f56b199b2cb00ad83df3b8dad868`.
- Parent: `b54b849ac0438408a2c92f899e5221c7496611d7`.
- Tree: `8c0a426b3133e326eb120f09a2e0c9408eb68eb5`.
- [Complete-history bundle](../../sources/candidates/console-browser-journeys-66ac7db.bundle),
  SHA256 `9f9046afdf7f222a37f87ffca6a35badf1763fbf09c170b29ba0bbfdba366f8c`.
- Unchanged exact Kernel authority: `185d3e72309a4362db57cf2e805d1c00a5035909`.
- Source `qa-product-v0` and its Claude mirror have the same Git tree:
  `2ddb904c8d78b7679e895675ecfec9912e30e996`.

Only nine files change: producer schema, persisted reader schema, browser adapter,
owned public-input fixture, new journey tests, existing finalization tests,
README and both source declarative-campaign references. Tests and source are
inside the bundle; author-machine files are not prerequisites for reproduction.

## User-visible improvement

Before: an authored check executed all actions and only then its assertions.
Search followed by clear therefore could not prove that search first narrowed
the results. Two separate browser checks did not prove the same-session journey.

Now: an assertion can specify optional zero-based `afterOperationIndex`. The same
page executes an action, settles, checks its scheduled assertions, then proceeds.
Failed intermediate assertions stop the remaining actions. A healthy search then
clear passes; a broken search and a broken clear fail at different original
assertion indices. All sibling assertions at a boundary are exercised in order.

Omission retains the previous terminal behavior and unchanged canonical plan
bytes. Boundaries must be integer, nonnegative, in range and nondecreasing;
at least one assertion must observe the final operation. API checks reject this
browser-only field. Original failure `assertion-N` IDs are preserved; trace
events use numeric indices. The existing trace cap/totalEventCount remains explicit.

Both the plan producer and actual persisted evidence reader validate the new
contract. Existing runner, sanitizer, classifier, observation budgets, sticky
request/origin guard and final close reconciliation remain authoritative.
An oracle failure is still `needs_review`/`INCONCLUSIVE`, not an automatic bug.

## Executed qualification and retained failures

- Baseline controls:30/30. Initial new-test RED:4 schema failures; with schema
  support but old execution order:3 runtime failures, including clearing after
  failed search and misidentifying the clear failure. These were not relaxed.
- New journey plus finalization controls:27/27. Review strengthened exact full
  assertion order and every sibling check before the next action.
- Expanded ten-file gate on the resulting runtime/test bytes:321/321, no failures,
  cancellations or skips. It includes schemas, runner, actual receipt ingestion,
  observation, browser/dependency adapters, continuation, journeys and finalization.
  Log SHA256 `7ce1b2db02698f563ee671dd0768e2e44ab5bdaf0b44042256b123f243ada652`.
- Earlier expanded invocation and repeat each had183 passing tests and2 test-file
  setup failures: missing paired Kernel test helper and missing explicit
  `QA_STARTER_REPO`. The corrected gate used the exact isolated Kernel185 source
  and its own lockfile installation; no source or assertion was weakened.
  Retained repeat log SHA256
  `9d51cc028424b0598a58f3b509ba1af53c3f1d13d9c74ac306aea54e3cbb820a`.
- Nonincremental TypeScript and Vite build:exit0. Existing Vite warning about
  the567.52kB minified chunk remains; no performance improvement is claimed.
- Final review corrected only reference wording about numeric trace indices;
  source/mirror packaging then passed2/2.
- **Cold exact-commit clone from the bundle:** independent Git store, no
  alternates, fsck0, own296-package lockfile install, clean source. Journey15,
  finalization12 and source-skill2 controls passed29/29; typecheck0.
  Cold log SHA256 `b4cef7c0b0d5d4eebb78414ba54dbca8cc304ffb387dc1fcdcf2d6f783d7bdbb`.

All target operations in these tests are on owned loopback fixtures. The delayed
observation control denies a POST; finalization controls prove a late denied
request or close fault does not preserve PASS, both with and without dependencies.
These are bounded local qualification gates, not the complete Console suite or
a product QA campaign. The dossier timing path was source-inspected, not newly
executed: the new oracle failures correctly do not create automatic dossiers.

## Reproduce from this repository

Use an unused review directory, Node>=22.12, Git and a permitted installed
Playwright Chromium. Missing browser/dependency capability is setup work, not
permission for a live fallback. From the qa-agent root:

```sh
git bundle verify sources/candidates/console-browser-journeys-66ac7db.bundle
git clone sources/candidates/console-browser-journeys-66ac7db.bundle /absolute/new-journey-review/console
cd /absolute/new-journey-review/console
git rev-parse HEAD
npm ci --ignore-scripts --no-audit --no-fund
node --import tsx --test --test-concurrency=2 tests/unit/browser-journey.test.ts tests/unit/campaign-browser-finalization.test.ts tests/unit/qa-product-skill.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

For the expanded321-test gate, additionally clone the delivered
`sources/candidates/kernel-continuation-185d3e7.bundle` into the sibling `kernel`
directory and install its lockfile independently. Run the following from Console
with `QA_STARTER_REPO` set to that absolute Kernel directory:

```sh
QA_STARTER_REPO=/absolute/new-journey-review/kernel node --import tsx --test --test-concurrency=2 \
  tests/unit/qa-campaign-v0.test.ts tests/unit/qa-campaign-runner.test.ts \
  tests/unit/public-input-campaign.test.ts tests/unit/campaign-receipt-ingestion.test.ts \
  tests/unit/campaign-observation.test.ts tests/unit/playwright-campaign-adapter.test.ts \
  tests/unit/campaign-dependency-adapter.test.ts tests/unit/campaign-continuation-v1.test.ts \
  tests/unit/browser-journey.test.ts tests/unit/campaign-browser-finalization.test.ts
```

Do not use the child default `npm test` as an offline gate. Raw diagnostic logs
on the original host live in `.local/browser-journeys-20260914/`; they are optional,
not runtime inputs. Above commands and bundled tests are the portable reproduction.

## Agent instructions and remaining work

Two separate fresh documentation consumers read the old source and the candidate
reference. The old-source consumer correctly identified its same-session gap;
the new-source consumer authored an intermediate search oracle and terminal
restoration, retained source validation and payment restrictions. This is a
controlled documentation-application sample, not evidence of improved general
agent reliability, actual product execution or actual Claude behavior.

Independent Lead AQA approved implementation and strengthened tests (no Critical
or Important findings); both minor findings were corrected: sibling assertion
coverage and numeric trace wording. Final independent delivery/current-entry
review is **APPROVED**, no remaining findings: source identities, complete bundle,
actual321/29 logs, portable commands and selected-versus-candidate pointers checked.
Root source verification passed and root packaging passed59/59, no skips/failures.
The manifest remains Consoleb54/Kernel185; these checks do not select this candidate.

Next: adopt this bounded reviewed source through the existing manifest procedure,
preserving dirty user work and frozen product runtimes. Then use it in a fresh
consumer's meaningful journey, exercise partial developer/human handoffs and
prove a reviewed graph change affects actual executed checks. This is not browser
crash replay, authenticated/payment automation, whole-product coverage, general
cloud readiness or permission to repeat the completed Freeland purchases.
