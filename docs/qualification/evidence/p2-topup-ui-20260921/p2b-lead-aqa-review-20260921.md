# P2-B independent Lead AQA review

## Spec compliance

**❌ Issues found.** The original-path consumer, exact-bound quote handling, five-method scope, graph integration and shared-helper extraction substantially match the brief. Requirement 8 is not fully met: assertion failures can persist arbitrary received DOM text, including sensitive values, in the named scenario's automatic failure artifacts. This was reproduced against the actual imported spec and actual Playwright runner with intercepted synthetic traffic.

**Code quality: Needs fixes.** One Important finding blocks this bounded task's approval. No Critical finding.

Reviewed exact base `0ea2df10f1b6d613e01d50011c269ca0fa999877` → head `8aefe795a3f260d27657b3d44f64235683b55fda`, using the supplied 1,641-line diff in bounded sections. File:line references below resolve within `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/freeland` unless explicitly stated otherwise. The implementation and controller reports were treated as claims, not approval evidence.

## Strengths

- `tests/freeland-staging-replacements/support/card-topup-quote.ts:35` captures authenticated bootstrap observations, rejects absent/ambiguous active ownership and unavailable capabilities, and uses the exact card-specific opener rather than the global Wallet header. Its exact payment request/response binding subsequently proves the chosen card identity; unavailable fixtures are non-PASS.
- `tests/freeland-staging-replacements/support/card-topup-quote.ts:70` keeps Wallet gross debit separate from crypto requested credit. The fiat estimate section at `:86` is explicitly distinct from the fresh nested backend breakdown. The nested sheet is opened once at `:97`, and both fiat options are checked within that invocation, respecting the cache constraint rather than fabricating freshness.
- `tests/freeland-staging-replacements/support/paysheet-observation.ts:133` and `:183` add opt-in equality of both `productRef` and `productPayload.cardId` without persisting identity or changing old callers' projection. The unchanged surrounding waiter retains same-origin/path/method, observed-request-window and exact-amount checks, with listener removal in `finally`.
- `tests/freeland/quote-assertions.ts:19` preserves the existing selected-method arithmetic/caption oracle once, including integer money, zero-fee absence and decimal percentage precision. `tests/freeland/card-sbp.spec.ts:251` delegates to that oracle; the old 37 controls are retained rather than replaced by new mocks.
- `tests/freeland-staging-replacements/support/card-topup-quote.ts:154` returns an allowlisted successful result with explicit `FREELAND_QUOTE_MUTATION_RISK`, estimate-only context and local-source-only acceptance. No Freeland tile click, nested submit, provider/create path, TC-PAY-07 promotion, tariff claim or live GO is introduced.
- `tests/freeland/card-topup-quote.spec.ts:12` restores the prior snapshot policy in a nested `finally` and retains the actual guard attempt array across context-close failure. Actual-runner controls in `tests/freeland-main/card-topup-artifact-privacy.test.mjs:121` qualify unexpected failure, same-worker restoration for unset/empty/nonempty values, setup failure and close/late-guard failure. These are useful lifecycle controls, although their sensitive-text placement misses the finding below.
- `tools/freeland-graph/private-safety-spine-preflight.mjs:1533` constrains the shared module's topology, exact import bindings and declaration-only initialization; `:2238` obtains its already-collected no-follow corpus bytes. The consumer allowance is exact, not a generic import relaxation. The added preflight controls preserve source facts and digest sensitivity and reject missing/symlink bytes, aliases, extra imports, IIFEs, top-level mutation and dynamic authority.
- `docs/local/freeland/product-graph/mappings.v1.json:837` adds the exact drawer dependency and `:1288` binds only the named top-up consumer to its flow. `tests/freeland-main/card-topup-graph-selection.test.mjs:63` exercises the real planner with retained safety selectors, source-only identity, pending manual status and full fallback after removing the dependency. `tests/product-graph/freeland-graph.test.mjs:8230` retains the prior 98 relations and adds exactly one, without denominator reduction or current/registry promotion.

## Issues

### Critical

None found.

### Important — Raw assertion values still leak into persisted failure evidence

**Location:** [quote-assertions.ts:15](/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/freeland/tests/freeland/quote-assertions.ts:15), propagated without sanitization through [card-topup-quote.spec.ts:42](/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/freeland/tests/freeland/card-topup-quote.spec.ts:42). The privacy control's fixture is at `tests/freeland-main/card-topup-artifact-privacy.test.mjs:15`.

`PLAYWRIGHT_NO_COPY_PROMPT` removes the ambient page snapshot, but does not sanitize ordinary Playwright assertion errors. `expectQuoteRow` passes raw summary spans into `toHaveText`; when those spans contain unexpected sensitive text, the runner serializes the received value into both `error-context.md` and the JSON reporter's errors. Other locator assertion failures merit the same failure-boundary treatment. The existing privacy fixture places sentinels outside the asserted surface and fails earlier on a missing input, so its passing result does not cover this path.

**Reproduction:** one isolated probe reused the existing actual-runner qualification transport and actual imported named spec, changing only the synthetic drawer to contain its required input and selected Wallet tile plus a selected-source summary value `SECRET-PAN SECRET-EMAIL`. No live URL or provider was contacted. The scenario remained failed, and the snapshot remained absent, but both sentinel values were persisted in error details.

- Reproducer: [/tmp/p2b-lead-aqa-privacy.VvqBl8/probe.mjs](/tmp/p2b-lead-aqa-privacy.VvqBl8/probe.mjs).
- Persisted leak: [error-context.md:25](/tmp/p2b-lead-aqa-privacy.VvqBl8/output/probe-Freeland-card-top-up-cc6cc-ce-specific-without-payment/error-context.md:25).
- The same values appear in [report.json](/tmp/p2b-lead-aqa-privacy.VvqBl8/report.json) under the test result's error message.
- Probe output: `status: failed`, `rawErrorContainsPan: true`, `rawErrorContainsEmail: true`, `includesSnapshot: false`, `containsPan: true`, `containsEmail: true`.

**Why this blocks:** brief requirement 8 expressly excludes PAN/email/arbitrary server text from attachments. An assertion-triggered regression is precisely when failure evidence is generated, so suppressing only ambient snapshots does not establish the promised safe-evidence boundary. This is a harness privacy defect, not evidence of a live product leak.

**Required correction:** preserve an unexpected FAIL while converting errors from product-observed assertions to stable allowlisted diagnostics before the runner serializes them; do not retain raw message/cause/received text in the persisted error. Preserve all final guard and environment-restoration behavior. Extend actual-runner qualification with a sentinel in an asserted summary value (and a locator-error path), and inspect both failure attachments and reporter errors. Do not weaken assertions, mark the source test expected-fail or suppress the underlying failure.

### Minor — Existing aggregate build warning remains

The frozen log at [p2b-integrated-fullgate-20260921.log:21115](/Users/danilsolomin/projectsnew/qa-agent/.superpowers/sdd/2026-09-16-cross-product-qa-global-plan/p2b-integrated-fullgate-20260921.log:21115) contains Vite's >500 kB chunk warning (500.44 kB). It is not pristine output, but is already disclosed, outside this diff's frontend scope and not an additional P2-B blocker. Do not describe the gate as warning-free or as performance qualification; do not raise the warning threshold merely to hide it.

## Named checks and evidence

1. **Requirements and change inventory:** read the complete brief, both implementation reports, task-reviewer rubric and supplied diff. All 14 changed-file entries are accounted for, including controller-owned graph/preflight/provenance integration. No diff regeneration, git mutation, source edits, suite rerun, installation or delegation was performed.
2. **Exact request identity / cleanup:** the waiter diff hunk cut off the enclosing `waitForFinancialPaymentOptions` function, so I read only that named function's surrounding source (`paysheet-observation.ts:167–222`). It verifies fresh request membership, same origin/path/POST, type/action, input amount and exact card identifiers and removes the request listener on every exit. Wrong echoed response identity yields non-PASS rather than reuse. Existing controls include stale pre-observation requests and listener cleanup.
3. **Guard teardown integration:** inspected only unchanged `dry-test.ts:1–14` and `pay-sheet.ts:357–403`. The existing lifecycle closes the owned context before its ordinary final guard check; a close exception bypasses that ordinary check. The new spec's retained attempt array and outer fixture `finally` independently preserve that check in the named scenario. Existing actual-runner close-failure evidence tests this exact interaction; no guard allowlist widening was found in the diff.
4. **One source-grounding doubt — balance/default-limit semantics:** inspected the exact read-only c469 `apps/web/src/pages/CardPage.tsx:1146–1151` and `:1250–1515` to check that wallet balance precedence, negative post-debit display, source-fee estimates and the default 200 limit were not invented by the literal fixture. These match the new consumer's bounded assumptions. This is source inspection, not product execution or current tariff evidence.
5. **Shared-helper trust / graph conservation:** reviewed the exact import allowance, declaration topology, sealed-byte lookup and all new adversarial controls in the supplied diff, alongside the source mapping and impact-planner assertions. No broader corpus-root or assertion-authority relaxation was found. The source-only/pending-manual distinction remains explicit.
6. **Frozen aggregate:** inspected the supplied raw log summaries, not just the report. Groups are 773, 1601, 670, 70, 23, 115 and 65, all zero failed/skipped; provenance is VALID. Counts overlap and are harness checks, not product-acceptance coverage. The raw build warning is retained above. No aggregate was rerun.
7. **One focused reproduction:** ran `/opt/homebrew/opt/node@20/bin/node /tmp/p2b-lead-aqa-privacy.VvqBl8/probe.mjs` from the frozen checkout. It imports the actual named scenario under the actual runner and reuses fully intercepted `.invalid` transport. The probe's privacy assertion detected the leaked sentinel; direct inspection confirmed it in the persisted error attachment and JSON report. Scratch is retained for controller reproduction. Only scratch artifacts and this review report were written.

## Scope and assessment

**⚠️ Not live acceptance:** deployment identity, live account eligibility, provider behavior, current tariffs and all-method/full-P2 acceptance cannot be verified from this diff and were expressly out of scope. Freeland Balance remains pending/excluded; TC-PAY-07 remains shadow/API-only. These are scope limitations, not extra implementation defects.

**Task quality: Needs fixes.** Request binding, arithmetic reuse, guarded interaction scope and graph/preflight integration are well targeted. The remaining failure-evidence leak violates a mandatory privacy invariant despite the successful existing frozen gate; address and qualify that narrow boundary before approval.
