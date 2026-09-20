# P2-B controller-owned graph and preflight integration

Base Freeland `0ea2df10f1b6d613e01d50011c269ca0fa999877`; isolated `codex/p2-card-topup-ui`. Component candidate `8aefe795a3f260d27657b3d44f64235683b55fda`, tree`2b2c9545bab031ab4a43dab1ee59b1e8b76e5ebb`. Full gate passed; independent review and delivery are pending. This report supplements the implementer's report; it does not replace independent review.

## Graph

Added exactly `apps/web/src/pages/cards/CardTopupCheckoutSheet.tsx` -> `flow:card.topup` and the exact named new `tests/freeland/card-topup-quote.spec.ts` selector -> that flow. The executable tests use existing graph build, impact and plan APIs. Removed dependency remains unmapped and chooses full fallback. Existing safety selectors and pending manual requirements remain; private `current` is not changed.

Initial graph controls RED3/3 (`p2b-graph-red-20260921.log`), GREEN3/3 (`p2b-graph-green-20260921.log`). First aggregate exposed the S2 source inventory count, then the focused compatibility run passed4/4 (`p2b-graph-compat-green-20260921.log`): prior98 relations plus the exact new one, total99. Existing136 requirements,89 manual cases and65 product CI checks are not reduced. The standard Playwright list-only invocation found one named top-up test plus ordinary auth setup without execution or HTML reporter writes (`p2b-catalog-20260921.log`).

## Private safety preflight compatibility

The second aggregate passed main767/release1583/replacements670/transport70, then failed with `SAFETY_SPINE_INVALID` at `assertSelectorImportsTrusted` because the original card-SBP spec now imports the extracted quote assertions. No later aggregate stages ran. The earlier extraction location was also outside the recursive QA corpus.

The helper now lives at `tests/freeland/quote-assertions.ts`, already covered by the existing recursive corpus. No corpus roots/schema are added. Preflight accepts only the exact named import from `./quote-assertions` in the card-SBP selector source, and examines its no-follow, already-collected bytes. It requires declaration-only initialization, the exact assertion/type imports and two exported arrow-function bindings; existing dynamic authority, process escape and assertion-shadow/escape checks apply. This checks import safety, not the business oracle itself. Helper body changes alter qaCorpusDigest/projectionDigest; browser controls qualify its semantics.

Focused RED (`node --test --test-name-pattern='extracted quote assertions' tests/product-graph/freeland-private-safety-spine-preflight.test.mjs`):18tests/15pass/3fail, including intended valid-helper rejection and incorrect missing-helper classification. Raw `p2b-preflight-extraction-red-20260921.log`.

GREEN (`node --test tests/product-graph/freeland-private-safety-spine-preflight.test.mjs`):208/208,0fail/skip. Controls include preserved safety facts, changed dependency digest, missing/symlink bytes, additional dependency/test import/alias/re-export, top-level call/assignment/IIFE and dynamic import/expect escape. Raw `p2b-preflight-extraction-green-20260921.log`.

Actual candidate CLI `node tools/freeland-graph/private-safety-spine-preflight.mjs --qa-repo . --require-bindings` passed with5 safety selectors,7 qualified replacements and all four source facts; raw `p2b-actual-preflight-20260921.log`. Projection digest is intermediate while the implementer still finalizes privacy; not a frozen campaign input.

## Provenance and remaining gate

Existing assembled fixture/preflight blob and SHA fields plus changed private SHA rows are refreshed against actual bytes; sourceBlobs/history/counts are retained. `npm run provenance:verify` returned VALID8sources/274git/129assembled/80private (`p2b-integrated-provenance-20260921.log`). A preliminary invocation guessed an absent `tools/provenance/verify.mjs`; it exited MODULE_NOT_FOUND before work. Package scripts were then read and the actual supported command above used. This diagnostic failure is not claimed as evidence.

No product state, current graph, replacement promotion, installed skill, package/lockfile, deployment, financial action or canonical pin has changed. Full aggregate, independent review and portable source delivery remain pending both repairs' final freeze.

## Final frozen-source aggregate

`qa:verify:all` completed exit0 on21September: main773, release1601, replacements670, transport70, baseline23, canaries115 and embedded legacy Console65; every group0failed/0skipped. These counts overlap and are not product coverage. Typechecks, private preflight5selectors/7qualified, provenance and embedded build passed. The known500.44kB embedded Console bundle warning is retained, not suppressed and not performance qualification. Raw `p2b-integrated-fullgate-20260921.log`.

Invocation: a dedicated canonical `/private/tmp/qa-p2b-integrated-20260921.*`, `env -i` retaining only HOME/PATH/TMPDIR and explicit `FREELAND_QA_NODE20_BIN=/opt/homebrew/opt/node@20/bin/node`, then `npm run qa:verify:all`. No dependency installation or live target. All14 source-file SHA256 values match the pre-run freeze. Exact14paths were staged and committed after diff checks; source tree is clean. The commit is a review candidate, not a selected canonical runtime. Earlier failed aggregates remain historical evidence.
