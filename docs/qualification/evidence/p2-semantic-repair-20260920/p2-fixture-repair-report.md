# P2 fixture compatibility repair report

Date: 2026-09-20

Status: **DONE**

## Revision

- Approved base: `d45c91f7f9f4517ba6da8c47da5d4b0a4147f295`
- Scoped repair head: `0ea2df10f1b6d613e01d50011c269ca0fa999877`
- Branch: `codex/p2-fee-caption`
- Initial repair commit: `f1b2bd6 test(qa): repair stale fixture compatibility`
- Review-fix commit: `0ea2df1 test(qa): guard malformed renewal bindings`

The commit contains only the two approved test modules and their two existing assembled-provenance rows:

- `tests/product-graph/freeland-private-safety-spine-preflight.test.mjs`
- `tests/product-graph/freeland-stale-staging-renewal.test.mjs`
- `provenance/source-manifest.v1.json`

No runtime source, resolver, registry, receipt, graph, product, canonical source, credential, or installed-skill bytes were changed. This implementation performed no network, product, or dependency-install action.

## Repair

The private-safety-spine fixture now independently declares the exact sorted qualified cohort:

- `TC-PAY-02`
- `TC-PAY-04`
- `TC-PAY-19`
- `TC-SEC-01`
- `TC-ВХОД-01`
- `TC-ВХОД-02`
- `TC-ВХОД-03`

It first asserts that the stored registry's qualified IDs equal that literal cohort, then checks `result.qualifiedBindingCount` against the cohort length. `TC-PAY-01` remains shadow.

The stale-staging-renewal fixture now explicitly resolves every selected binding, requires one declared test plus string spec/oracle paths, unions `manualReplacementAuthoritativePaths(...)` with the exported production `stagingHarnessPaths(ROOT, { specPath, oraclePath })` closure for every selected case, and asserts every selected closure path exists after copying. This includes the shadow PAY01 spec's transitive `support/pay-sheet-observe.ts` import without duplicating or weakening the production resolver.

All renewal, permission, receipt, digest, rollback, partial-selection, and fail-closed assertions were retained. The existing production resolver and renewal implementation were not changed.

## Evidence

Existing focused RED evidence, reproduced by root before this task:

```text
node --test --test-concurrency=1 tests/product-graph/freeland-private-safety-spine-preflight.test.mjs tests/product-graph/freeland-stale-staging-renewal.test.mjs
exit 1
tests 213 / pass 193 / fail 20 / skipped 0
duration_ms 6868.218375
```

The failures were one obsolete `8`-qualified fixture expectation and nineteen common setup failures with `MANUAL_REPLACEMENTS_HARNESS_IMPORT_UNRESOLVED` for PAY01's `./support/pay-sheet-observe`. The renewal failures occurred before their intended assertions.

Final focused test pair on committed bytes:

```text
node --test --test-concurrency=1 tests/product-graph/freeland-private-safety-spine-preflight.test.mjs tests/product-graph/freeland-stale-staging-renewal.test.mjs
exit 0
tests 213 / pass 213 / fail 0 / skipped 0
duration_ms 45458.0555
```

Related provenance controls:

```text
node --test tests/freeland-main/provenance.test.mjs
exit 0
tests 34 / pass 34 / fail 0 / skipped 0
duration_ms 555.867792
```

Manifest verification:

```text
npm run provenance:verify
exit 0
{"schemaVersion":1,"sourceCount":8,"gitFileCount":274,"assembledFileCount":129,"privateFileCount":80,"status":"VALID"}
```

Whitespace/error check:

```text
git diff --check
exit 0
no output
```

Post-commit inspection confirmed a clean worktree and exactly the three owned changed paths listed above. No broad `qa:verify`, `qa:verify:all`, default `npm test`, or `qa:run` was started; root owns the frozen-byte broad gate.

Raw logs:

- `p2-fixture-resume-red.log`
- `p2-fixture-repair-focused-final.log`
- `p2-fixture-repair-provenance-controls-final.log`
- `p2-fixture-repair-provenance-verify-final.log`
- `p2-fixture-repair-diff-check.log`

## Qualification boundary

This is a test-fixture compatibility repair and prerequisite to qualifying the already-reviewed P2-A candidate. It does not establish a new runtime defect, change runtime behavior, prove a deployed product state, or by itself qualify P2-A. The focused GREEN evidence proves the repaired fixture reaches and preserves its intended assertions; the independent broad owning gate and final adoption decision remain with root.

## Concerns

None within the approved scope.

## Independent-review fix round

Independent review found that `binding.tests?.length === 1` still allowed malformed selected bindings such as `tests: [null]` or `tests: [{}]` to reach `binding.tests[0].selector.file` and throw a generic `TypeError`. A local pre-fix probe reproduced both generic errors.

The follow-up changes only that extraction to `binding.tests[0]?.selector?.file`, allowing the existing case-labelled string-path assertion to reject both shapes. No helper, export, schema, framework, runtime source, or test seam was added. Only `tests/product-graph/freeland-stale-staging-renewal.test.mjs` and its existing provenance row changed in review-fix commit `0ea2df10f1b6d613e01d50011c269ca0fa999877`.

Review-fix evidence:

```text
malformed-binding probe: exit 0
null test: case-labelled AssertionError
missing selector: case-labelled AssertionError

focused two modules: exit 0; tests 213 / pass 213 / fail 0 / skipped 0; duration_ms 42294.295167
provenance controls: exit 0; tests 34 / pass 34 / fail 0 / skipped 0; duration_ms 586.012625
npm run provenance:verify: exit 0; status VALID
git diff --check: exit 0; no output
```

Additional raw logs:

- `p2-fixture-repair-review-red.log`
- `p2-fixture-repair-review-green.log`
- `p2-fixture-repair-review-focused.log`
- `p2-fixture-repair-review-provenance-controls.log`
- `p2-fixture-repair-review-provenance-verify.log`
- `p2-fixture-repair-review-diff-check.log`

The root-owned broad gate reported main 736, graph/verdict 1583, replacements 670, transport 70, private preflight, and baseline 23 passing on frozen `f1b2bd6` bytes before this one-line review fix. Canary failures were separately attributed by root to a reduced-environment `/tmp` symlink and are outside this fixture repair; root retains broad-gate and final qualification ownership for the new head.
