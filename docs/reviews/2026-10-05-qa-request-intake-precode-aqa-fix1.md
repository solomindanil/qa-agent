# B00/I01 request intake — affected-scope pre-code AQA fix 1

Date: 2026-10-05. Reviewer: independent Astra, not the design/plan author.

## Decision and exact scope

**GO for the corrected pre-code design/plan: Critical 0 / Important 0 / Minor 0 open in this review scope.** I1/M1/M2 from the [initial NO-GO](2026-10-05-qa-request-intake-precode-aqa.md) are resolved. Preserve that original review unchanged as first-attempt evidence. Sol may begin Task 1 under the existing coordinating authorization; no further global user approval is requested.

This was an affected-scope re-review only: the corrected recovery grammar/semantics/control/recipe, selected-document read wording and canonical serialization/vector. Unrelated architecture, source qualification and global cards were not replayed. No implementation or recovery runtime exists as an accepted result yet; this GO accepts the written executable contract, not successful execution of the planned tests.

| Reviewed input | SHA-256 |
| --- | --- |
| `docs/superpowers/specs/2026-10-05-qa-request-intake-design.md` | `1ff8d16bfb15906262bc35c20db802135547403c59103cd3d668a38a628613e3` |
| `docs/superpowers/plans/2026-10-05-qa-request-intake-implementation.md` | `f18f1c1116a04e897b54a37397fa2c98ece502d9f5ad0c45181d67154a7dbfba` |
| Preserved initial review | `85eae00ce8400319bb5f67fabd43feecc2a4728216cf12d0913316eeb3092ec1` |

## Disposition

**I1 resolved.** The design now names `render-report --report <saved JSON>` as an explicit mutation, separate from read. It validates the saved report and canonical location/basename, derives the Markdown destination from the embedded notes directory/request tuple/report digest, and requires no original request, temporary evidence inputs or command history. It never rewrites JSON or refreshes identities. The exact `report_rendered` envelope includes created/already_present. Identical existing Markdown is read-only idempotent; differing bytes conflict; unsafe/unreadable inputs are not absence; uncertain publication returns WRITE_OUTCOME_UNKNOWN with the precise Markdown path and retained bytes.

Task 2 and the portable recipe match that contract. The planned fresh subprocess receives only the saved JSON after the named synthetic request/evidence/Markdown fixtures are removed, checks equal original rendered bytes and unchanged JSON, verifies repeat bytes/mtimes, tests conflict and incorrect destinations, and proves that `read --report` leaves Markdown absent. The bounded test-only sync-failure injection covers unknown publication and a fresh-process reconciliation without introducing a production backdoor/module. This is the missing normal recovery path, not an owner/store expansion.

**M1 resolved.** Design and plan now both say read returns the validated full selected request or report JSON and never writes. Existing `validateIntakeReport` and report-read modes remain intact.

**M2 resolved.** The plan now emits object properties directly in code-unit-sorted order, recursively serializes arrays and uses JSON.stringify only for scalars/property escaping. This matches the design and avoids JavaScript's integer-key enumeration reorder. Both documents pin an independent expected digest for the explicitly authored byte string `{"10":"ten","2":"two","a":"A"}` plus one LF. An independent read-only Node SHA-256 calculation in this re-review returned `sha256:da02c0e348f56f105931b549df300c43e518593fb3235ec7fa6d7a3e06949373`, exactly matching the fixed test oracle; it did not call the proposed documentDigest implementation.

## Retained limits and next action

The helper remains root-only, dependency-free and caller-authored/unattested. NOT_EVALUATED is intake status, not final QA. Existing owners/runtime/bundles/pins and installed skills remain outside this change. B01/D01/E00/V01/N01/Q1 remain unaccepted as applicable; this correction does not close them or certify the future fresh human-language consumer.

Proceed with accepted Task 1 and actual RED/GREEN evidence, then independent code AQA at the planned boundary. This review wrote only this follow-up report; no source, branch/index, product or installation action was taken.
