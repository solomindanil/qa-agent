# Browser guard repair: diagnostic checkpoint

Status: **M1 repair qualified and delivered as inactive source9f848bb** after
independent review, complete offline verification and cold restoration. No active
source adoption or product acceptance is claimed. This continues M1/M2 in
[the maintenance backlog](maintenance-backlog-20260913.md). Earlier sections below
retain the diagnostic sequence; the final section identifies the current repair.

## Source and verification

- Root at inspection: `d44a6f2e3364c1e14e79736496e1363f8c779e42`.
- `sources:verify` returned `sources_verified`; active component pins did not change.
- The [inactive Freeland archive](../../sources/candidates/README.md) was verified
  and restored to a new independent development clone: commit
  `722bf1be5f08cc1904808af749e9c1c7f5b96881`, tree
  `aab9c1c340c2cafca6e5f5d914c2a1f045c3d2c4`, clean source.
- Its initial `qa:verify` returned `DEPENDENCIES_MISSING`, before test execution.
  There was no fresh browser result at that initial checkpoint. Do not borrow another
  checkout's dependencies or interpret this environment blocker as a product bug.
- No product, tracker, payment, deployment, installed skill or active campaign was
  changed. The complete source archive, not an author's old working copy, is the
  repair input.

## M1: settle ownership before adding another scan

In candidate `tests/freeland-staging-replacements/support/pay-sheet.ts`,
`installDryBrowserGuard` accepts an externally supplied page. It takes a
`Target.getTargets` snapshot, then asynchronously exposes a binding and replaces
worker constructors with init scripts and evaluation. That ordering explains the
previously reproduced setup-interleaving escape; a later snapshot alone does not
establish that product JavaScript could never have run between setup steps.

The bounded Lead AQA recommendation is to reuse a Playwright `test.extend` page
fixture: take its inherited, test-scoped empty context, create the page internally,
install protection before `use(page)`, and reject attempts to retrofit protection
onto an already exposed page. Preserve inherited role storage, browser options,
mesh launch settings and existing oracle logic. A private page-to-guard-state map
can let the existing helpers read attempts without reinstalling the guard. This is
a proposed boundary, not accepted working code.

Affected consumers are four direct specs (`tc-api-01a`, `tc-pay-01`, `tc-pay-07`,
`tc-pay-09`) and `support/dry-paysheet-run.ts`, used by `tc-pay-02/04/05`.
Setup failure must close owned resources without exposing an unprotected page.
Finalization must not erase a previously recorded failure.

Required local browser controls before accepting this boundary:

1. The actual SharedWorker setup interleaving from M1 must not obtain a successful
   guard plus an unrecorded forbidden checkout GET.
2. Reject an externally loaded/pre-existing page or worker; a URL-only
   `about:blank` check is not proof of ownership.
3. Probe synchronous borrowing of `iframe.contentWindow.SharedWorker` immediately
   after iframe insertion, without waiting for frame load. Existing worker tests
   wait for load and do not establish this case. This is an untested risk, not a
   newly confirmed defect; fixture ownership alone does not prove it safe.
4. Test current/future documents, descendants and setup failure; forbidden
   requests must not reach a real loopback sentinel.
5. Preserve safe main-frame reads, permitted redirect behavior, and the two exact
   existing POST contracts under their current explicit options. Preserve role
   and browser configuration. Do not broaden authorization.

Trusted QA code, Node fetch and APIRequestContext remain outside this browser
helper's guarantee. If these controls expose a deeper browser capability gap,
revise the supported boundary explicitly rather than adding unproven layers or
calling the product defective.

## M2: optional metadata must not decide final safety

Independent read-only Lead AQA review and main-agent inspection of active Console
`b392e888bc8bfc98a756ba7e971a86000d6f2098` confirm the seam in
`src/node/playwright-campaign-adapter.ts`: `execute()` produces a tentative result,
closure can set failure flags, but reconciliation is inside the optional dependency
summary condition. The persisted no-dependency result can therefore retain PASS.
No fresh runtime counterexample was executed here.

Next regression: after a real loopback heading assertion succeeds, use a
test-scoped wrapper around the real `page.close` to inject either a close rejection
or a real, awaited browser POST that the guard aborts. Repeat with no dependency
metadata and with a valid unused registered dependency scope. Check zero POST
sentinel hits, safe controls, and agreement of returned result, saved trace,
saved result and sealed receipt. Empty dependency arrays are invalid and cannot
serve as the comparison fixture. Reconciliation belongs after closure regardless
of whether a dependency summary is requested; retain typed failure precedence.

## Original bounded next action (subsequently approved)

Provision dependencies from the existing lockfile in the isolated repair copy
with explicit installation authority, then run the local counterexamples. No
live QA is needed. Confirm the exact bounded repair design against those results
before implementation, run RED → GREEN and independent Lead AQA review, then
deliver reviewed source through the canonical repository. Do not silently adopt
the inactive candidate or close the other maintenance findings.

## Approved repair: fresh local baseline

The user subsequently approved the bounded fixture repair and isolated lockfile
installation. Root, baseline, canary and embedded-Console dependencies were
installed inside the new repair clone with install scripts disabled; installed
browser binaries were reused only for loopback checks. No product account was used.

On unchanged `722bf1b`, the existing support suite passed **49/49**, with zero
failures/skips/cancellations. A separate actual-Chromium diagnostic then interleaved
SharedWorker creation after the real `Target.getTargets` response and before guard
setup continued. Its request followed `/redirect` to a local
`/api/payment/checkouts/probe`, received HTTP 200, left `attempts: []`, and the final
no-mutation assertion passed. This is a fresh counterexample to the old guard, not
a live-product incident.

The immediate synchronous iframe-constructor probe threw `SecurityError`, recorded
one `SHARED_WORKER` denial and made no redirect/checkout request. It remains a
required durable regression, not a claim about every browser capability.

The source-owned regression retains the actual failing behavior; the old 49 green
checks alone do not qualify the new boundary.

## Reviewed M1 repair

- Base: `722bf1be5f08cc1904808af749e9c1c7f5b96881`.
- Implementation: `25d6ac2c2bd665de72f92ad9c2b1cc2d46d10c41`.
- Test/review correction: `c47e90ad954b765e05ea509ce13442aaf281e711`.
- Source-binding integration: `9f848bb01f0fdde3f6b0841019243e64494e24b5`.
- Final tree: `d28fb587203937aab748e8d935e710ea881ab18a`.

The thin `support/dry-test.ts` Playwright fixture inherits the test context and
creates its page internally. The guard is installed before the page reaches the
test body. The low-level installer is private; an arbitrary active or blank page
cannot acquire accepted guard state. Existing helpers read the owned state rather
than reinstalling protection. Setup failures close owned resources, and the final
attempt check runs after context closure, so an earlier empty assertion cannot
erase a later denial. The seven named specs retain their original business checks,
roles, retry/media configuration and admitted request contracts.

### Review found a defect in the new test itself

The first 61-test runner result was genuinely green but **insufficient**: a child's
failed body assertion plus its expected teardown failure could satisfy the parent
test. Lead AQA required successful body completion to be checked independently.
The resulting negative control demonstrated that the original validator accepted
the combined failure. A marker emitted only after all body assertions now makes
that combination fail validation.

This exposed a previously hidden iframe assertion error: a borrowed constructor
threw `SecurityError` from the iframe's DOMException realm, not the parent's.
The corrected test requires the exact non-constructed/SecurityError/DOMException
shape, exact `SHARED_WORKER` denial and zero worker-script/checkout sentinel hits.
It does not accept an arbitrary exception or weaken runtime protection. Initial
61-test evidence does not establish successful completion of that body and is
superseded by the corrected run.

The controller's first full gate also stopped at **425/426** main tests: an exact
provenance assertion still expected398 rows instead of401 after three regression
assets were added. The correction preserves exact membership and frozen lineage;
omission, substitution and misattribution of each added asset are rejected.

The next full gate on `c47e90a` passed **427/427** main tests, then stopped at
**1394/1395** graph/verdict tests: the four shadow declarations still named their
pre-fixture spec digests. The failure was not bypassed. The existing replacement
resolver identifies exactly TC-API-01a and TC-PAY-05/07/09 for a source-metadata
refresh: their `replacementTestDigest` and `bindingDigest`, plus the enclosing
`manifestDigest`. Oracle, selector, status and receipt fields must not change.

In that candidate, all eight historical qualified declarations resolve with
`receiptStatus: stale` and `receipt: null` when explicitly inspected through the
existing stale-tolerance mode. PAY-01/02/04 additionally name the changed spec
bytes. Their declarations and stored receipts remain intact; they confer no
current acceptance. A declaration count such as `replacementCounts().qualified`
is not a count of valid current receipts. Strict resolution still refuses stale
evidence. Requalification is a separate later action, not metadata refresh.

### Current scoped evidence

- Corrected focused command below: **93/93**, zero failed/skipped/cancelled:
  49 existing support controls +13 ownership/real-fixture controls +31 provenance
  tests. These are tool tests, not 93 product acceptance cases.
- TypeScript, diff-check and provenance verification: exit0. Manifest counts are
  278 imported +123 assembled =401 controlled rows; no new controlled root or
  source pin was introduced.
- Independent Lead AQA reviewed the correction's exact commit bytes and returned
  **APPROVED**. A separate runtime/caller reviewer approved the unchanged runtime
  slice, including seven consumers and normal/error/skip unwinding. Both reviews
  were static; neither reviewer claimed a separate browser run.
- Real list-only discovery found18 replacement tests and the existing setup
  dependency, including all seven migrated files. Listing does not execute them.

After restoring the candidate to an independent checkout and installing its own
lockfile dependencies, the focused regression command is:

```sh
node --test --test-concurrency=1 tests/product-graph/freeland-staging-replacements-support.test.mjs tests/product-graph/dry-browser-owned-page.test.mjs tests/freeland-main/provenance.test.mjs
```

Qualification used Node22.23.1 and the installed Playwright Chromium on macOS.
The checks create only owned loopback fixtures. They require local browser
capability, not a Freeland account. Complete verification additionally needs the
canary, embedded Console and baseline lockfiles installed and an explicit local
Node20 binary via `FREELAND_QA_NODE20_BIN`; see the candidate's existing verifier.
Nothing here instructs a product campaign, install of host skills or active pin
promotion.

From the restored candidate root, after those explicit prerequisites are provided:

```sh
FREELAND_QA_NODE20_BIN=/absolute/path/to/node20 npm run qa:verify:all
```

The full gate is the existing offline verifier, not `npm test` (which can select
product Playwright projects). The Node20 binary must satisfy the verifier's sibling
npm requirement. Runtime fixture artifacts remain in unique ignored output
directories; private logs are not required to reproduce the source-owned controls.

### Graph and identity boundary

No product graph was rewritten and no product dependency was invented for this
tool repair. The replacement lane still uses its existing graph/catalog pipeline.
The narrower historical `qaCorpusDigest` does not include every staging helper;
the full clean Git HEAD/tree is separately bound by the existing QA source
authority. The controller checked dirty-source rejection and clean-source binding.
Fresh evidence must use the new source identity, never the previous candidate's
receipt. Full-fallback debt and the separate M5 formatting/parser defect remain.

### Remaining acceptance and next task

The full gate and portable archive checks below are complete. Active pins,
installed skills and running campaigns remain unchanged. M2 Console
late-finalization, M3/M4 conditional writes, M5 graph parser and M6 manual receipt
are not closed by this M1 repair. The next bounded runtime task is the M2 local
counterexample and final-result reconciliation described above.

## Final acceptance and portable delivery

Frozen source `9f848bb01f0fdde3f6b0841019243e64494e24b5` completed the controller's
fresh `qa:verify:all` with **exit0**. There were no failed, skipped or cancelled
tests. Composition is deliberately explicit:

| Existing gate | Test executions |
| --- | ---: |
| Main/launcher | 427 |
| Graph/verdict | 1395 |
| Replacements | 658 |
| Transport (overlaps graph/verdict) | 70 |
| Node20 baseline | 23 |
| Product-canary unit tests | 115 |
| Embedded legacy Console unit tests | 65 |
| **Aggregate executions, not unique product tests** | **2753** |

Provenance, root/baseline/embedded-Console TypeScript, structural private preflight
and embedded-Console build also exited0. The build retains its existing warning
about a minified chunk over500kB (500.44kB); no dependency or threshold was changed.
The embedded Console is not the active universal Console and this result does not
close M2. Private-preflight `qualifiedBindingCount:8` is a declaration count, not
current receipt authority; the eight stale receipts remain unavailable as PASS.

Independent Lead AQA approved the final two-file integration; the whole-delivery
reviewer verified source/bundle/delta/portable clone and approved delivery
conditional on this final green gate. That condition is now met. Reviewers did not
claim extra live/browser runs. The controller also reran root packaging **57/57**
and `sources:verify`; all active pins remain unchanged. Source remained clean at
the final HEAD after the full gate and QA source authority remained sealed.

The [delivered archive and restore instructions](../../sources/candidates/README.md)
include complete reachable Git history and the source-owned regressions. A new
independent clone of the final archive reproduced exact HEAD/tree, clean Git state,
`fsck`, provenance and QA source authority without installed dependencies, old
repositories or an alternates object store. Browser tests were run in the isolated
repair clone with its own installed dependencies, not rerun in the dependency-free
cold clone. No cross-platform or cloud qualification is inferred.

Raw logs are retained privately; their hashes preserve attribution but are not
substitutes for replaying the delivered controls:

- Final full gate: `2c38b6511725df0e6346e11497bd93a0bb32b634feda94ca952cce679a8393fe`.
- Root packaging: `25c9e44ad6d0bf6f3c2462a352859ae75e86b5e720f05d724752e09d78004c8a`.
- Earlier failed25d6ac2 gate: `1a8f9b9c7836e3fd1e2da490e9ce7212cf682bbf390eedd829f750a4040ae3b4`.
- Earlier failedc47e90a gate: `34afe6d81f8e115c5c9410422eb74b76bc72bcf9133cd7769784fa67c0f4ce56`.

No staging request, real account, payment, Flow/Buzz write, product change,
installed-skill update, active pin adoption or remote push occurred in this repair.
