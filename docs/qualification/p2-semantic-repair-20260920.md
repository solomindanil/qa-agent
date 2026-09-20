# P2-A selected fee-caption repair — 20 September 2026

## Delivery status

This source-selection candidate contains reviewed P2-A implementation and the two approved test-fixture repairs. Final broad verification, independent cold source/root checks and [whole-delivery Lead AQA review](evidence/p2-semantic-repair-20260920/p2-delivery-review.md) passed. Review covers the package through root `314431d110cce323857fd5cd4f433507da5fb44b`; this final supplement only records the review/status. Canonical adoption, push, active campaign migration and installed-skill promotion have **not** occurred. This is harness qualification, not product acceptance or release GO.

- Selected Freeland commit: `0ea2df10f1b6d613e01d50011c269ca0fa999877`; tree: `1f9913fc1118a2582dd62c4d5dfd63cd8aac0ffb`.
- [Complete-history bundle](../../sources/candidates/freeland-p2-semantics-0ea2df1.bundle), SHA256 `f340ee8b630dfdd46d927008f2dd992a3e019780693741cbdb42c1dc6a447266`.
- Lineage: accepted `d4754f7` → caption `d688916` → exact decimal repair `d45c91f` → fixture compatibility `f1b2bd6` → fixture diagnostic guard `0ea2df1`.
- Kernel `aa5d2d1`, Console `c421160` and inactive reporting reference `10d398d` are unchanged. The embedded legacy Console tested by Freeland's aggregate gate is **not** that active universal Console.

## Bounded claim and observable

| Claim | Observable and check | Boundary |
| --- | --- | --- |
| A selected tile's explicit percentage matches its own quote | Actual existing Card/SBP browser helper reads the selected tile and compares exact decimal digits to that option's `sourceFeeRateBps` | No global rate, fee/principal-derived rate or historical tariff substituted |
| A fixed displayed fee agrees even when summary totals look correct | Commission-labelled fee amount compared with `sourceFeeAmountMinor` | No compulsory percent if the UI only promises a fixed/included fee, or no caption |
| Healthy decimals do not fail on binary rounding | `1.1%` / `2,3%` become exact 110 / 230 bps; unsupported finer precision rejected | Bounded dot/comma format, not a generic locale engine |
| Existing authority and readiness survive fixture repair | Exact seven qualified declarations asserted; each selected test's real transitive dependency closure copied | PAY01 remains shadow; no registry, receipt or production resolver changed |

The browser controls call the actual TypeScript campaign helper in Chromium against literal API/DOM fixtures; all browser requests are intercepted. They distinguish healthy and broken rendering, not current business-price correctness or a deployed product. Selection, source correlation, readiness, summary arithmetic, included/zero-fee behavior and checkout guards remain in place.

## Executed checks

| Check | Result | Retained evidence |
| --- | --- | --- |
| Initial caption controls before implementation | RED 31/34, three intended missing-rejection failures | [Original RED](evidence/p2-semantic-repair-20260920/p2-fee-caption-red.log) |
| Review-found decimal drift | RED 35/37, exactly the two healthy decimal controls fail; repaired helper 37/37 | [Decimal RED](evidence/p2-semantic-repair-20260920/p2-fee-caption-fix1-red.log), [focused GREEN](evidence/p2-semantic-repair-20260920/p2-fee-caption-fix1-final-focused.log) |
| Existing incompatible graph fixtures | RED 193/213: one obsolete cohort expectation, nineteen missing support-import setup failures; first repair 213/213 | [Original fixture RED](evidence/p2-semantic-repair-20260920/p2-fixture-resume-red.log), [first GREEN](evidence/p2-semantic-repair-20260920/p2-fixture-repair-focused-final.log) |
| Review-requested malformed-binding diagnostic | Null/missing selector becomes case-labelled assertion; final fixture pair 213/213, provenance controls 34/34 and manifest VALID | [Fixture report](evidence/p2-semantic-repair-20260920/p2-fixture-repair-report.md) |
| First aggregate `qa:verify:all`, f1b2bd6 | Main736, release1583, replacements670, transport70, baseline23 passed; private binding preflight and typechecks passed. Canary113/115, then stop | [Exact failure excerpt and full-log digest](evidence/p2-semantic-repair-20260920/full-gate-first-canary-excerpt.log) |
| Final aggregate, exact 0ea2df1 | `qa:verify:all` exit0: main736/736, release1583/1583, replacements670/670, transport70/70, baseline23/23, canaries115/115, embedded Console65/65; zero failures/skips. Provenance, required binding preflight, all typechecks and guarded Console build passed | [Complete raw output](evidence/p2-semantic-repair-20260920/p2-0ea2-full-verify.log), SHA256 `2919d17640658bf044549f244e529048a7aea3c3d14841e54cceffa442253369` |
| Candidate root and independent `git clone --no-local` at9dc5650 | Restore/verify all four exact sources; root61/61 in each; cold root and restored children clean, no component dependencies in the cold clone | [Candidate root](evidence/p2-semantic-repair-20260920/p2-root-candidate-tests.log), [cold gate](evidence/p2-semantic-repair-20260920/p2-cold-root-gate.log) |
| Fresh non-author actual-browser consumer | Exact0ea helper accepts7.25%/725bps and rejects7.26% with the same coherent100.00/7.25/107.25 amounts;2/2 harness controls, zero checkout/unknown requests | [Report](evidence/p2-semantic-repair-20260920/p2-fresh-consumer-report.md), [raw TAP](evidence/p2-semantic-repair-20260920/p2-fresh-consumer-raw.log), [archived probe](evidence/p2-semantic-repair-20260920/p2-fresh-consumer-probe.mjs.txt) |

The first aggregate's two canary failures were command-environment errors: `env -i` removed `TMPDIR`, `os.tmpdir()` became `/tmp`, and on this host `/tmp` is a symlink to `/private/tmp`. The existing evidence writer correctly refused that parent. The unchanged [seven-test evidence-writer module](evidence/p2-semantic-repair-20260920/p2-canary-tempdir-control.log) passed with explicit real `/private/tmp`. The final aggregate used a separately created canonical temporary directory; no writer or symlink guard was weakened. This is configuration repair, not a product or canary-code fix. The final Freeland working tree stayed clean. Suite counts are not unique coverage totals: the aggregate intentionally repeats some transport controls.

The embedded Console build still warns about its 500.44kB minified JavaScript chunk (143.65kB gzip). This warning is retained, not suppressed or claimed to be a product performance result. It does not affect this selected-caption/fixture source change; bundle-size work belongs to a separately scoped maintenance task.

Root and Freeland expose no lint script; no lint PASS or code-coverage percentage is claimed. The aggregate's configured typechecks/build and the selected tests are the actual gate. A bounded obvious-secret-pattern scan found no matching credentials in34 changed delivery text files and five changed component files before the final review-record addition; this is not a comprehensive security audit.

## Dependency and reproducibility boundary

The owner approved `npm ci --ignore-scripts --no-audit --no-fund` in the isolated embedded Console and baseline, using their existing lockfiles and distinct empty npm configs. Console installed294 packages and baseline19; no versions/lockfiles were changed, no install scripts or browser download ran. [Console install](evidence/p2-semantic-repair-20260920/p2-console-deps-install2.log), [baseline install](evidence/p2-semantic-repair-20260920/p2-baseline-deps-install2.log). Pinned ESLint deprecation and npm notices remain visible. Root dependencies and local Chromium already existed; this is not a from-zero dependency/browser installation qualification.

Aggregate replay, from the selected Freeland checkout, requires its declared dependency trees, baseline Node20 and a real temporary directory on macOS. Use an explicitly verified host PATH, the absolute Node20 binary, and a task-created canonical TMPDIR with `npm run qa:verify:all`. Retain raw stdout/stderr and exit status. This command checks tools/local fixtures, not the live staging product. Reduced environment and intercepted browser requests are not an OS-level egress sandbox. Do not use the child's default `npm test` as a substitute.

Source delivery uses the ordinary root `sources:restore` / `sources:verify` and root packaging tests; these do not install dependencies or grant execution rights. The complete bundle, source references and retained outputs travel with this repository. Historical absolute paths inside raw reports identify the original run; they are not prerequisites or fallback authorities.

The fresh consumer independently read the cold entry and manifest, verified exact helper blob parity and used an explicitly permitted dependency-bearing execution copy. It did not install dependencies into the cold clone. Its archived `.mjs.txt` is the original scratch probe, preserved byte-for-byte including its original local execution path; it is evidence data, not an installed command or a runtime prerequisite. For portable ordinary replay use the selected component's `node --test tests/freeland-main/card-sbp-quote-contract.test.mjs` with its declared dependencies/browser. The fresh probe's separate synthetic7.25/7.26 contrast is not claimed as new reusable product coverage or a current tariff contract.

## Independent review and remaining gaps

- [Semantic repair review](evidence/p2-semantic-repair-20260920/p2-fee-caption-review.md): fresh-context Lead AQA first found binary-decimal drift; scoped re-review accepted the exact digit parser and regression controls.
- [Fixture review](evidence/p2-semantic-repair-20260920/p2-fixture-repair-review.md): fresh-context Lead AQA requested a nested-shape guard; scoped re-review approved0ea2df1. This is an internal independent agent context, not external human certification.
- [Implementation details](evidence/p2-semantic-repair-20260920/p2-fee-caption-report.md) and both [caption](evidence/p2-semantic-repair-20260920/p2-fee-caption-brief.md) / [fixture](evidence/p2-semantic-repair-20260920/p2-fixture-repair-brief.md) briefs preserve exact scope.
- [Original card-top-up seam audit](evidence/p2-semantic-repair-20260920/p2-topup-seam-audit.md): current TC-PAY-07 is shadow and API-only for this path. Its encoded tariffs are not independently established current product requirements. Actual top-up UI/selected switching remains unverified by this slice. Future work must ground the current contract and use the fresh quote for each selection.
- Seven `qualified` registry declarations and a structural binding preflight do **not** renew historical owner receipts or establish current live acceptance. PAY01/PAY07 remain shadow. No graph gap or ticket is closed by these counts.
- No staging request, purchase, provider operation, tracker/Buzz write, product change, hosted CI, cloud setup or existing-campaign migration occurred. Full P2–P6 acceptance remains open.

Next bounded action after delivery: the original dry card-top-up UI consumer, grounded in the current product contract, with selected quote/caption/total/rail switching controls and no checkout. Existing P1 observations, P3 scope/resume, P4 graph learning and P5 evaluation remain in the global plan; this source repair does not replace them.
