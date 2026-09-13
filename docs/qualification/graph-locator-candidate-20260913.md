# M5 — formatting-safe source locators

13 September 2026. **b30ef13: CHANGES REQUESTED / NOT ACTIVE.** Independent
Lead AQA reproduced invented dependencies from URL queries/fragments. Its bounded
correction has passed focused controls and independent review; full verification
and portable successor delivery are pending. This source maintenance is not
product acceptance. No active source pin, installed skill or campaign was changed.

## Independent finding and correction

A backticked `https://example.test/?next=apps/provider.ts` or fragment equivalent
was parsed as a local file. If the file existed, actual build/validation accepted
an `implements` edge and impact selected a test; the old base created neither.
The initial URL-path negative did not cover this. The fix excludes whole URL
tokens before file extraction. A new real parse/build/impact regression failed
before the fix;20 focused controls and31 provenance controls now pass, including
query, fragment, protocol-relative and parenthesized-query text while preserving
a genuine neighboring source. Independent review executed20 further variants and
confirmed unchanged real-corpus semantics. Full owning verification is still
running; the historical b30ef13 gate below is not reattributed to the correction.

## Source and exact delivery

- Base: Freeland `9f848bb01f0fdde3f6b0841019243e64494e24b5`, inactive M1 repair.
- Candidate: `b30ef1316d3db08c71ccaa398a2b4fac76fd4ae9`.
- Tree: `250ff11d6d578de8e38f1b678c4afbe4cdc40639`.
- [Complete-history archive](../../sources/candidates/freeland-graph-locators-b30ef13.bundle), sole HEAD.
- Archive SHA256: `1691fa2f702767837bf0854e91862ea5f6b37f1a6e9e1b9913cf678a3540e917`.

Four files changed; no runtime dependencies or private-corpus edits:

| Relative path in Freeland | SHA256 |
| --- | --- |
| `tools/freeland-graph/model.mjs` | `b22c1a678432a2cd2cb2aeeb9214efaae4ca5243c109ad3a3c719c77fc7ffd3d` |
| `tests/product-graph/freeland-source-locator-format.test.mjs` | `aa97be1bd23f2989cfc943d563ec935df5b4cd49397e0d51dc4f60ec17fa75c8` |
| `tests/freeland-main/provenance.test.mjs` | `e9b030b4446904ad17f6116ac61b68c8042cac38e52b5767afec6f4d1ccc8b53` |
| `provenance/source-manifest.v1.json` | `1479d25680852a2c5c44fd03db08b5c5ca9246ccaef9ff9046fa52f61f38076d` |

## Defect, repair and measured benefit

Previously any backtick span replaced the set of plain source paths. Quoting an
error identifier removed real links, including five C5 references. The repair
scans file-shaped tokens inside and outside code emphasis, preserves escaped
filename pipes and line references, and excludes namespace/URL substrings.
Existing exact-file resolution and unresolved-source review remain. This is not
a general Markdown parser or support for every possible filename syntax.

Unchanged real corpus: **449→443 locators**. Five true paths hidden by code spans
were restored; eleven non-source tokens were removed (routes, domains, i18n keys,
a commit abbreviation, query and prose). Parsed nodes, semantic edges and
unresolved semantic records were identical. No test-acceptance edge was created.

Tests use real parse/build/validate/impact: formatting retains targeted selection;
removing a true source link removes the targeted check. Existing VELVET
source-owner controls remain green. This is tool/selection evidence, not executed
product coverage, a new live map or closure of the separately documented graph debt.

## Verification, including unsuccessful attempts

1. Initial fixture omitted its section header and safety input; corrected before
   implementation. Corrected RED failed4/4 on actual old behavior.
2. Initial GREEN18/18; a subsequent namespace/URL negative failed before its
   token-boundary correction. Final focused controls passed19/19.
3. First broad invocation incorrectly used Node20 globally:1325 passed with three
   TypeScript import failures. It is not a successful gate; main host requires
   Node22 while only the baseline package uses Node20.
4. Correct full gate initially caught two inventory assertions expecting401
   files. Added the exact new regression to the assembled allowlist (402 total,
   138 Safety-informed), retaining omission/substitution/wrong-ancestry negatives.
   Focused provenance31/31 passed.
5. Fresh owning `qa:verify:all` on final bytes exited0: **2758 aggregate test
   executions** — main427, graph/verdict1400, replacements658, overlapping
   transport70, baseline23, canaries115, embedded legacy Console65. Every set
   had zero failures/skips/cancellations. Source provenance, typechecks, private
   source preflight and builds succeeded; existing Vite chunk warning remains.
   These are not2758 distinct product acceptance cases. No shadow or historical
   receipt was promoted; preflight binding counts are not fresh runtime evidence.
6. A cold normal clone recovered the exact SHA/tree/hashes, passed `git fsck
   --full`, owning provenance CLI and19 pure tests, without node_modules or
   alternates. Checkout stayed clean. A prior direct verifier call supplied the
   wrong parameter name; it failed and was not counted as verification.

## Reproduce and review

Clone the archive into a new directory, select the exact candidate, then on Node22:

```sh
node tools/freeland-main/provenance.mjs --verify .
node --test tests/product-graph/freeland-source-locator-format.test.mjs tests/product-graph/freeland-real-corpus-format.test.mjs tests/product-graph/freeland-velvet-source-mapping.test.mjs
```

For full replay, separately provision each package from its own lockfile following
the owning setup instructions. Do not copy writable dependencies. Use Node22 for
the main host and an explicit absolute Node20 override for baseline:

```sh
FREELAND_QA_NODE20_BIN=/absolute/node20 npm run qa:verify:all
```

Qualified here: macOS, Node22.23.1 and Node20.20.2. No other OS or live staging was
tested. Do not substitute Freeland's default `npm test` (product Playwright).
Independent review must inspect the exact four-file diff, formatting invariance
and the absence of invented accepted file dependencies. No active adoption before
that review; source delivery alone does not approve a runtime.

Retained log SHA256: corrected RED `c805b987b379f15914d1b1fafc497ff4ab2d74450cb1d6f76c89cbc6bffe0adb`;
namespace RED `632416a86c79acfc7945cdf7980de6a5d9afe30bf5428404334219246fd75e37`;
focused GREEN `470f63a51532ac01226037a8ca2155d9b0c724c35bade129f1fd55a913b9d98d`;
full GREEN `2c217645054e545588ddce9d9debe5e9df99c1b423f3a56e994beaa669cdcd52`.
Logs remain historical local evidence; replayable regression source is delivered.
