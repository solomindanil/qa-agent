### Spec Compliance

- ❌ Issues found: the selected-caption comparison is correct for the requested literal `12.9%`/`12,9%` controls, but it does not implement the general exact basis-point comparison reliably. Valid one-decimal percentage captions such as `1.1%` and `2.3%` are rejected because the implementation converts through binary floating point and then demands an integer (`tests/freeland/card-sbp.spec.ts:289-291`). This conflicts with the binding requirement that a selected UI percentage agree with the exact selected option's `sourceFeeRateBps`.

### Strengths

- The new controls independently bind the literal 1290-bps quote and 25.00/3.23/28.23 amounts to both dot and comma `12.9%` captions, and reject the identical quote with `99%` (`tests/freeland-main/card-sbp-quote-contract.test.mjs:152-164`).
- The per-option control gives Card and SBP different literal source rates and captions, so a global or historical policy rate cannot satisfy both (`tests/freeland-main/card-sbp-quote-contract.test.mjs:167-172`).
- Unknown-rate, fixed-amount-without-rate, wrong-fixed-amount, and no-promised-caption distinctions are covered directly (`tests/freeland-main/card-sbp-quote-contract.test.mjs:175-196`), while the helper compares a recognized fixed fee to the selected source amount (`tests/freeland/card-sbp.spec.ts:294-298`).
- Existing selected-state, principal/total, and zero-fee guards remain adjacent and intact (`tests/freeland/card-sbp.spec.ts:270-276`), and the included-fee control now explicitly proves it does not depend on a source rate (`tests/freeland-main/card-sbp-quote-contract.test.mjs:222-227`).

### Issues

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- `tests/freeland/card-sbp.spec.ts:289-291` — `Number(percentage) * 100` is not an exact decimal-to-basis-points conversion. For example, Node evaluates `Number('1.1') * 100` as `110.00000000000001` and `Number('2.3') * 100` as `229.99999999999997`, so `Number.isInteger` rejects healthy captions whose exact selected source rates are 110 and 230 bps. The existing `12.9%` test happens to use a floating-point value that multiplies to an integer and therefore misses the defect. Parse the decimal digits as a string into whole basis points (supporting both separators and rejecting unsupported precision), and add healthy dot/comma controls for at least one affected rate such as 110 or 230 bps.

#### Minor (Nice to Have)

- None.

### Checks Run

- Reviewer-focused counterexample only: `node -e "for (const s of ['12.9','1.1','2.3','5']) { const bps=Number(s)*100; console.log(s, bps, Number.isInteger(bps)); }"` → `12.9 1290 true`, `1.1 110.00000000000001 false`, `2.3 229.99999999999997 false`, `5 500 true`.
- No module or package suite was rerun. The implementer report records RED 31/34 with the three intended failures, GREEN 34/34, provenance verification, provenance module 34/34, typecheck, and clean diff checks; those runs were not repeated by this review.
- Focused unchanged-code risk check: `sourceFeeRateBps` is consumed by this helper as `number | null` (`tests/freeland/card-sbp.spec.ts:28-33`); no alternative decimal representation in the inspected contract removes the conversion defect.

### Assessment

**Task quality:** Needs fixes

**Reasoning:** The diff is narrow, preserves the surrounding guards, and covers nearly every requested semantic distinction well. The floating-point conversion nevertheless makes the core exact-caption contract reject legitimate whole-basis-point rates, so the task cannot be approved until percentage parsing is exact and the affected rate receives a regression control.

---

## Scoped Re-review — Fix Round 1

### Finding Verdicts

- **Floating-point percentage conversion rejects valid exact whole-basis-point captions** — **ADDRESSED**. `tests/freeland/card-sbp.spec.ts:289-292` now splits the captured dot/comma decimal text, limits precision to two decimal places, and constructs basis points from decimal digits with `BigInt`; no binary floating-point multiplication remains. Healthy `1.1%` → 110 bps and `2,3%` → 230 bps controls cover both separators (`tests/freeland-main/card-sbp-quote-contract.test.mjs:162-174`), and unsupported sub-basis-point precision is rejected (`tests/freeland-main/card-sbp-quote-contract.test.mjs:181-186`).

### New Breakage in the Fix Diff

- None. The exact parser preserves integer percentages, one- and two-decimal percentages, the existing selected-source comparison, and the unknown/invalid-rate guard.

### Out-of-Scope Observations

- None. The separately reported graph-fixture failures and dependency-missing full gate were not part of this task repair or this scoped re-review.

### Checks Run

- No tests were rerun. The appended implementer evidence names the focused module and records RED 35/37 with only the two new drift controls failing, then GREEN/final 37/37, provenance verification, provenance module 34/34, typecheck, and clean diff checks.

### Verdict

**Fix round:** All findings addressed, no new Critical/Important breakage.
