# M5 — formatting-safe source locators

13 September 2026. **21c1c61: SOURCE REVIEWED / NOT ACTIVE.** Independent
Lead AQA reproduced invented dependencies from URL queries/fragments in b30ef13.
Its bounded correction passed focused controls, independent review, the full
owning offline gate and cold delivery. This source maintenance is not
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
confirmed unchanged real-corpus semantics. The historical b30ef13 gate below is
not reattributed to the correction; the successor has its own results.

## Reviewed URL-boundary successor

- Parent: `b30ef1316d3db08c71ccaa398a2b4fac76fd4ae9`.
- Source: `21c1c617a2dbe5d1131215dc738dba2556851ae3`.
- Tree: `f691a01e33aabb8a72673326ec524d955c4794e8`.
- [Complete-history archive](../../sources/candidates/freeland-graph-url-boundary-21c1c61.bundle), sole HEAD, 3621835 bytes.
- Archive SHA256: `2646e64b1a623530d0cab99f07a2d5d0a920245e75bb858001e9fc3c645ca066`.

Exactly three files changed (+38/-5):

| Relative path | SHA256 |
| --- | --- |
| `tools/freeland-graph/model.mjs` | `a6afda42bb13055a4177c29a6f07a0311a2a31f45a5188ceadda17c214348a63` |
| `tests/product-graph/freeland-source-locator-format.test.mjs` | `45b70f86eaedab4bf528248fc28035b4c9e953e61490b991a03297bb2e384e03` |
| `provenance/source-manifest.v1.json` | `8e220b5aa45427e5b100ecfc30c1072fc95f337a3f2402c8c8ce969725bae0c4` |

New parse/build/impact regression was RED on b30ef13; focused controls passed
20/20 after the correction, and provenance controls31/31. Lead AQA approved the
exact three source files and exercised20 additional URL/neighbor variants.
The first full invocation failed two canary checks because its clean environment
omitted TMPDIR and macOS `/tmp` resolves through a symlink. The evidence guard
correctly refused it; no guard or canary source was weakened. After configuring
an explicit private real TMPDIR, the **entire** owning `qa:verify:all` was repeated
on identical source bytes: exit0, **2759 aggregate executions**, zero failures,
skips or cancellations in every set (427 main,1401 graph/verdict,658 replacements,
70 overlapping transport,23 baseline,115 canaries,65 embedded legacy Console).
Provenance, source preflight, typechecks and builds passed. Existing Vite chunk
warning remains. These are tool tests, not2759 distinct product acceptance cases.

A fresh normal clone from the bundle recovered the exact commit/tree, passed
`git fsck --full`, owning provenance CLI and51/51 pure graph/provenance controls.
It remained clean, with neither object alternates nor node_modules. This proves
source portability and the bounded parser regression, not another OS or live QA.

Retained log SHA256: failed initial full invocation
`0ff6cfa4501ac51bf27c6d3f0e802c016702c3ed3eb3792e3f3c0c1d01f4efab`;
fresh full GREEN `93714a9c370be903200328b5e95e2c40172569bad98b2457757497e18419b401`;
cold51 `a58f2d514fb73be465b757e64953fc6a0ac8a5ee8640feb290ef226031a86326`.
Regression source and replay instructions travel with the archive; private raw
logs are historical evidence, not required local dependencies.

## Historical b30ef13 source and delivery

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

Use an explicit existing private `TMPDIR` resolving to a real directory (not a
symlink) and an environment without product/auth/Node-loader variables. On macOS
the default `/tmp` may not satisfy the owning evidence-root contract. For the
successor's cold51 controls, add `tests/freeland-main/provenance.test.mjs` to the
pure test command above.

Qualified here: macOS, Node22.23.1 and Node20.20.2. No other OS or live staging was
tested. Do not substitute Freeland's default `npm test` (product Playwright).
The original four-file change and the successor's three-file correction have
separate attribution. Independent review accepted the correction; active source
adoption and any product qualification remain separate.

Retained log SHA256: corrected RED `c805b987b379f15914d1b1fafc497ff4ab2d74450cb1d6f76c89cbc6bffe0adb`;
namespace RED `632416a86c79acfc7945cdf7980de6a5d9afe30bf5428404334219246fd75e37`;
focused GREEN `470f63a51532ac01226037a8ca2155d9b0c724c35bade129f1fd55a913b9d98d`;
full GREEN `2c217645054e545588ddce9d9debe5e9df99c1b423f3a56e994beaa669cdcd52`.
Logs remain historical local evidence; replayable regression source is delivered.
