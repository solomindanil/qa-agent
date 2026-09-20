# P2-A selected nonzero fee-caption repair report

Date: 2026-09-20

## Status

Bounded candidate implemented and committed in the isolated clone. No canonical adoption, push, live product/tracker action, campaign, graph mutation, dependency install, or full product suite was performed. This is not a live `FIXED` verdict and is not a claim that full P2 is complete.

## Candidate identity

- Clone: `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/freeland`
- Branch: `codex/p2-fee-caption`
- Base: `d4754f7ddbcb8183f695f479ef21aa7728c1ace0`
- Head: `d688916e7e4a7c68eb02002d572d992279c29adf`
- Commit: `test(qa): bind selected fee captions to quote`
- Worktree after commit: clean

## Reviewed candidate paths

- `tests/freeland/card-sbp.spec.ts`
- `tests/freeland-main/card-sbp-quote-contract.test.mjs`
- `provenance/source-manifest.v1.json` (only the two changed private-file SHA-256 rows)

## Semantic expectation source

Owner-approved brief: `/Users/danilsolomin/projectsnew/qa-agent/.superpowers/sdd/2026-09-16-cross-product-qa-global-plan/p2-fee-caption-brief.md`.

The selected tile is checked against that exact option's `sourceFeeRateBps`; no global/historical rate and no fee/principal-derived rate is used. Explicit dot/comma percentages are normalized and must match the source rate. An explicit percentage requires a valid integer rate. An explicit fee amount must match `sourceFeeAmountMinor`, even when the summary is correct. A fixed fee amount, an included-fee caption, or no promised caption does not require a percentage rate. Existing zero-fee, versioned included-fee, selection, summary, arithmetic, readiness, and checkout guards remain exercised.

## TDD evidence

Baseline command:

```text
node --test tests/freeland-main/card-sbp-quote-contract.test.mjs
```

Result before new controls: 26/26 passed. Log: `p2-fee-caption-baseline.log`.

RED command (tests added before helper change):

```text
node --test tests/freeland-main/card-sbp-quote-contract.test.mjs
```

Result: exit 1; 31/34 passed and three intended controls failed with `Missing expected rejection`: selected 99% against literal 1290 bps, explicit percentage with unknown rate, and wrong fixed selected fee amount despite a correct summary. Healthy 12.9%/12,9%, per-option rates, fixed amount without a rate, included fee without a rate, and no-caption cases passed. Log: `p2-fee-caption-red.log`.

GREEN command:

```text
node --test tests/freeland-main/card-sbp-quote-contract.test.mjs
```

Result: exit 0; 34/34 passed. Log: `p2-fee-caption-green.log`.

## Related verification

- `npm run provenance:verify`: exit 0, `VALID` (`274` Git files, `129` assembled files, `80` private files). Log: `p2-fee-caption-provenance.log`.
- `node --test tests/freeland-main/provenance.test.mjs`: exit 0, 34/34 passed. Log: `p2-fee-caption-provenance-test.log`.
- `npm run typecheck`: exit 0. Log: `p2-fee-caption-typecheck.log`.
- `git diff --check` and staged `git diff --cached --check`: clean.
- Approved dependency check: candidate `package-lock.json` byte-equal to `.local/p0-freeland-reconcile-20260920.O5fVBF/freeland/package-lock.json`, SHA-256 `704a0b43e1cd9d4e9c9e6c3cd4417f649b8550ad864c29f63a665f95992e9a45`; ordinary `node_modules` present, no install used.
- `npm test`, full product suites, build, and lint were not run: the brief explicitly prohibited default/full suites, and this package exposes neither build nor lint scripts.

The pre-refresh provenance check intentionally failed on the first changed private hash, proving the owned-byte seal was active; see `p2-fee-caption-provenance-before.log`.

## Remaining limit and concerns

The original wallet top-up path associated with original440 remains outside this narrow repair and is not covered here. No TC-PAY-07 or broader locale/parser framework was added. The caption recognition is intentionally bounded to explicit `%` text and commission-labelled two-decimal `$`/`USDT` amounts on the selected tile; widening supported caption shapes requires a separately reviewed contract.

## Review fix round 1

Review source: `/Users/danilsolomin/projectsnew/qa-agent/.superpowers/sdd/2026-09-16-cross-product-qa-global-plan/p2-fee-caption-review.md`.

- Parent commit: `d688916e7e4a7c68eb02002d572d992279c29adf`
- Fix commit / new head: `d45c91f7f9f4517ba6da8c47da5d4b0a4147f295`
- Scope remained the same three reviewed paths.
- Root cause: `Number(decimal) * 100` introduces binary floating-point drift for exact one-decimal captions such as `1.1%` and `2.3%`.
- Repair: split the captured dot/comma decimal string, reject more than two fractional digits, and construct exact basis points from decimal digits with `BigInt`; no floating-point multiply and no fee arithmetic are used.
- RED: `node --test tests/freeland-main/card-sbp-quote-contract.test.mjs` exited 1 with 35/37 passed. Only healthy `1.1% → 110 bps` and `2,3% → 230 bps` controls failed with the expected whole-basis-point error. The wrong-rate and `1.111%` unsupported-precision controls passed. Log: `p2-fee-caption-fix1-red.log`.
- GREEN/final focused verification: the same module exited 0 with 37/37 passed. Logs: `p2-fee-caption-fix1-green.log`, `p2-fee-caption-fix1-final-focused.log`.
- `npm run provenance:verify`: exit 0, `VALID`. Log: `p2-fee-caption-fix1-provenance.log`.
- `node --test tests/freeland-main/provenance.test.mjs`: exit 0, 34/34 passed. Log: `p2-fee-caption-fix1-provenance-test.log`.
- `npm run typecheck`: exit 0. Log: `p2-fee-caption-fix1-typecheck.log`.
- `git diff --check` and staged `git diff --cached --check`: clean; post-commit worktree clean.

The owning `qa:verify` failures in two unrelated graph fixtures and the full-gate `DEPENDENCIES_MISSING` result were not repaired or rerun in this bounded review fix, as instructed. No broad gate, live action, install, adoption, or push was performed.
