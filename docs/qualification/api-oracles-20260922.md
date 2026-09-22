# API semantic assertions — 22 September 2026

## Approved bounded change

The docs-render consumer exposed an expression gap: exact Content-Type matching
cannot state a parameter-tolerant media type, and the restricted json_path cannot
address OpenAPI keys containing `/`. The owner approved two assertions in the
existing Console adapter, negative controls, local HTTP execution, independent
AQA review and commit. No new runner, verdict or product action was authorized.

Console `8065713fba11446e32ec2f76832d65110550989b` succeeds `94083bf`.
Source tree: `a836c6072f8b8600df3300deead925772d73438f`.
The paired Kernel remains `aa5d2d1`; Freeland and the inactive reporting reference
retain their manifest pins. Installed skills and existing campaigns are unchanged.

- `media_type` validates one syntactically valid Content-Type, compares bare
  type/subtype case-insensitively and allows valid parameters. Missing, malformed,
  duplicated or wrong media types fail. Status and body remain separate assertions.
- `json_pointer` handles plain RFC 6901 escaping, root/empty keys, nested values
  and canonical array indices. Own properties only; no expression evaluation,
  URI-fragment interpretation, implicit percent decoding or prototype traversal.
- Expected JSON is validated without transformation. Prototype-sensitive keys,
  non-JSON values, accessors, sparse/custom arrays and cycles are rejected before
  HTTP. Missing is not null; scalar types/array order/extra keys remain significant.
- Execution and the plain-ESM persisted reader use the same new validators.
  Existing assertions, classification, saved identities and integrity checks are
  unchanged. Two oracle mismatches still mean needs_review/INCONCLUSIVE, not an
  automatically confirmed product defect or dossier.

Usage and deliberately bounded standard semantics are in the selected component's
[API assertion reference](../../components/console/docs/API-ASSERTIONS.md).
Body parsing retains JSON.parse's duplicate-key/number behavior; this is not a
duplicate-member or arbitrary-precision JSON validator. Parameter meanings and
charset decoding are not qualified. Expected values are public plan data, not a
place for secrets. Response evidence retains byte-count/digest summaries.

## Verification and review

Initial implementation qualification used an isolated normal Console clone and
loopback fixtures; canonical/root/cold delivery checks are listed separately below.
Existing installed dependencies were reused without installation or version changes.

- Baseline schema **29/29**. Initial new feature test **10 failures / 2 passes**
  demonstrated unavailable kinds, not an HTTP setup failure.
- AQA independently reproduced a real false PASS in the first implementation:
  z.json stripped expected `__proto__` into `{}`. The original
  [NO-GO](evidence/api-oracles-20260922/aqa-initial.md) is retained. A new failing
  regression preceded the non-transforming validator; the corrected value is
  rejected with zero HTTP requests. The subsequent
  [GO](evidence/api-oracles-20260922/aqa-final.md) has no open findings.
- Final [semantic scope](evidence/api-oracles-20260922/final-semantic.tap):
  **15/15**, including schema/real HTTP, malformed/duplicate MIME, pointer escape
  ordering, array/scalar/null/missing distinctions, legacy assertions, canary
  privacy, unsafe expected values and four actual runner controls. Healthy is
  PASS; wrong JSON/media/status are INCONCLUSIVE, no automatic dossier.
  All four sealed receipts also round-trip in a fresh plain Node process without
  a TS loader. Plan digests are exact; changing the plan invalidates readback.
- [Compatibility](evidence/api-oracles-20260922/compatibility.tap): **257/257**,
  zero failed/cancelled/skipped, across the new semantic test plus schema,
  Playwright adapter, runner, ingestion, CLI and vertical local fixture files.
  This run predates only the final test-only fresh-process readback addition;
  the final 15-case run includes it. These overlapping counts are not additive.
- Typecheck, scoped changed-source ESLint and diff-check passed. Build passed via
  `npm run build -- --configLoader runner`; the default bundled loader first hit
  the sandbox boundary writing into shared dependency `.vite-temp`. This is a
  loader invocation change, not a config/source repair. Dynamic import analysis
  and a 575.21 kB JS chunk warning remain in the
  [build log](evidence/api-oracles-20260922/build.txt) (one trailing space removed
  for tracked diff hygiene; original bytes retained locally).
- Initial end-to-end fixture mistakes (catalog path missing `generated`, then
  cleanup of sealed directories) are retained in local evidence, not counted as
  feature RED. Cleanup now closes the fixture server first and thaws only its
  own temporary tree. The two old hanging test processes were stopped explicitly.
  Generated tsconfig cache was preserved, then restored to baseline before commit.

TDD, systematic debugging, verification-before-completion and independent AQA
review governed this slice. The AQA finding materially changed expected-value
validation; no legacy oracle relaxation was used to make tests pass.

## Source delivery

Complete-history bundle `console-api-oracles-8065713.bundle`, SHA-256
`e4789e60284fd4f6f8f8446db59a3b955f95a4da11c2d3174014eb19d85747fb`,
independently cloned with exact HEAD/tree and clean fsck, without dependencies or
product state. Canonical Console was clean and advanced fast-forward to the exact
reviewed source; no unrelated changes were overwritten.

Canonical [source verification](evidence/api-oracles-20260922/source-verify.txt)
passed all four components; [semantic re-run](evidence/api-oracles-20260922/canonical-semantic.tap)
passed **15/15**. Root [packaging](evidence/api-oracles-20260922/root-gate.tap)
passed **61/61**, zero failed/cancelled/skipped. A fresh source-only export of
staged tree `eddb4ff8a5f9a310bdfcf1f1c9b3cf95590a0e6c` independently
[restored](evidence/api-oracles-20260922/cold-restore.txt) and
[verified](evidence/api-oracles-20260922/cold-verify.txt) every component;
[paired-source controls](evidence/api-oracles-20260922/cold-pair.tap) passed **2/2**.
No dependencies, credentials or product state were copied into that cold source
export. This does not claim cold runtime installation. Later report/evidence
additions do not change the reviewed component or its bundle.

Independent [source-delivery review](evidence/api-oracles-20260922/delivery-review.md)
approved staged tree `9799438f2fdb6c54a4a22fd6556c00dacbc77b4d`, with no critical or
important findings. Its one minor locality-wording correction is applied above;
component bytes are unchanged. The final additions retain that review.

Complete local command logs, including initial failures and generated cache, are
retained in `.local/api-oracles-20260922.lbrbAM/evidence/`; the original isolated
source and bundle proof remain under `/private/tmp/qa-api-oracles-20260922.lbrbAM`.

## Remaining limits and next step

This is component semantics and local-fixture qualification, not full Console/
Kernel suites, full P2/P5, installed-skill promotion, live-product acceptance,
tracker delivery, hosted CI or cloud autonomy. No product account, payment,
Freeland action or existing campaign was changed. No unsupported confirmed-bug
dossier emission was introduced or claimed.

Next: a fresh consumer authors a complete API contract from the delivered source
and distinguishes healthy from contradictory controls (especially correct media
type with wrong JSON meaning) in a new bound fixture/campaign. Keep the retained
docs-render campaign evidence intact. Live guest/help/resume still requires its
actual readiness and existing owner; source work does not take over that lane.
