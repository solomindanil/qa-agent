# B00/I01 Task 1 — independent specification and code AQA

Date: 2026-10-05. Reviewer: independent Astra. Task 1 only: pure request/report contract and its tests, not CLI, host recipe, product QA or final box acceptance.

## Decision

**NO-GO: Critical 0 / Important 1 / Minor 0.** Specification compliance: NO-GO for the additional total-item restriction below. Code-quality/release readiness: NO-GO for that same finding and its missing boundary regression; it is counted once. The remaining inspected implementation is suitably small and source-bound. Task 2 must wait for correction and affected-scope independent acceptance.

No renewed global design approval is needed. Do not normalize this mismatch by silently expanding the accepted specification to match the code.

## Exact reviewed material

Root: `/Users/danilsolomin/projectsnew/qa-agent-release-20260926/.local/quality-mcp-clone`; observed HEAD `8d1870d87479dfbd7ef1998a3d16ef7bb1bed6b6`. The earlier brief's start HEAD and this coordinating documentation checkpoint are explicitly distinguished in the implementation report; this reviewer made no branch/index/commit operation.

| Material | SHA-256 |
| --- | --- |
| Accepted design | `1ff8d16bfb15906262bc35c20db802135547403c59103cd3d668a38a628613e3` |
| Accepted implementation plan | `f18f1c1116a04e897b54a37397fa2c98ece502d9f5ad0c45181d67154a7dbfba` |
| `.superpowers/sdd/2026-10-05-universal-qa-product-plan/B00-task1-full-context.diff` | `46fa53b2f01535de92a367208b9ce3adac0ad86e104d1266c9be7d3f75197b56` |
| `skills/qa-check/scripts/request-contract.mjs` | `e01f8a8227defbe4d5a067737a4b72284a21604bc75941b33461415678f72dfc` |
| `tests/qa-request-contract.test.mjs` | `4cd3ac144fed179db6778b47bc7b029f13da79bdbe620e9e501864fadfab9fa2` |
| Implementation report | `6544d4cd86e40b33806353ef3b78278f59eda69af5cc65dd9cbfcca2188e801f` |

Read the brief/report and the complete full-context diff once: 327 module lines and 196 test lines. `git apply --check --reverse` against that diff exited 0, proving its additions match the actual files without applying anything. Subsequent source lookup was limited to the named count-limit finding's three line locations. No broad source/pre-code re-review or known-passing test rerun was performed.

## Important I1 — Total-item cap rejects otherwise valid explicit amendments

Location: `skills/qa-check/scripts/request-contract.mjs:137`. The condition `items.length >= 1 && items.length <= 33` introduces a total request-history cap in addition to the 32-file limit at line 146 and the incoming source-file limit at line 168. Request items include every explicit amendment, not only attached files.

The accepted design admits up to 32 additional source files for the initial capture and says an explicit amendment preserves the previous content and appends its new request item. It also has wording/content/aggregate/serialized limits. It does not allocate the same 33 slots to files and amendment messages or cap the history at 33 total items. Consequently a maximum-file but tiny valid capture cannot accept even its first ordinary text clarification. The implementation report candidly describes this extra cap, but reporting it does not make it an accepted semantic decision.

**Targeted read-only reproduction, not a repeat of the passing suite:** build 32 complete one-byte file sources with valid raw content digests, capture the full request `Check the whole product.`, then call `captureRequest({...base, text:'Also check mobile.'}, first)` with no new files and unchanged request/owner/scope/exclusions. Initial capture succeeds. Amendment throws `Source count limit`. The initial record contains 32 files and only 56 retained UTF-8 content bytes; the amendment remains far below all accepted byte limits. No files or product state were created by this probe.

**Required repair:** remove the undocumented upper bound on total items, retaining the required nonempty request list, accepted file-source and byte/depth limits, sequential IDs, source/clause checks and preservation semantics. Add a literal regression that captures 32 small files, appends a text-only amendment, validates the revised request, and builds/reopens its intake report with all original items plus the new unassessed clause retained. A small no-file history crossing 33 total request items should also remain valid while under the accepted byte limits. Keep a negative control for more than 32 file sources so this does not accidentally remove the real limit. Do not add a different undocumented history ceiling.

Preserve the initial attempts and this negative result. Run only the affected/focused verification needed for the repair, and return exact new source/test hashes for re-review before Task 2.

## Other inspected compliance and test quality

- Eight expected synchronous exports are present. The module uses only crypto and the pure absolute-path predicate; no file I/O, network, child runtime, subprocess, random identity/time generation or tracker effect is introduced. Returned request/report data are cloned, and owner state is not mutated.
- Exact wording, raw UTF-8 source digests and original full scope survive capture/amendment. Readable nonempty files, including whitespace-only files, retain whole-source clauses. Partial/empty/unavailable sources remain represented with source unknowns. Scope and oracle unknowns remain mandatory; a selected clause is never evaluated merely by selection.
- Request/evidence/owner/report shapes are checked; normal JSON extra fields are rejected. Whole-source clause mapping, sequential IDs, selected/remaining complement, fixed result/boundary fields and evidence classification are recomputed. The re-digested source/shape/partition/classification tests exercise semantic checks beyond an old-digest mismatch.
- Same-workspace requests and older revisions do not inherit current execution. Owner mismatch has precedence; a matching tuple remains `matching_request_unattested`. The saved-reference tests are useful association controls, not claims of receipt authenticity or fresh execution.
- The canonical implementation emits object keys directly in code-unit order and uses an independent fixed digest vector. Nonfinite/unsupported values, sparse arrays and lone surrogates are rejected. Exact strings are preserved without NFC conversion; source digesting is distinct from document digesting.
- Renderer checks retain every clause and report limits. Dynamic fences and metadata escaping address the actual Markdown contexts; the dense-backtick regression checks a previously failing legal-size source instead of only a tiny illustrative fixture. JSON remains authoritative; rendered output never changes NOT_EVALUATED to a QA verdict.
- The missing coverage is the accepted file-limit versus amendment-history boundary identified above, not a demand for future B01/runtime tests. CLI readback, filesystem confidentiality/path handling and saved-report recovery are Task 2, not accepted by these pure tests.

## Evidence attribution and retained attempts

Read the final raw TAP log: **13 passed / 0 failed / 0 skipped**, duration 114.5925 ms. This is the implementer's retained final run, not a fresh reviewer execution. Its SHA-256 `ea52ec6a208a379a7f0648503ccfa829a53bbb27e18edc381aff725a1f3c5ba4` matches the implementation report. All six raw-log hashes were checked and match the report, including the first missing-module RED, first 9-pass GREEN, and three subsequent non-green self-review attempts. The misleading filename `selfreview-green.log` is explicitly reported as a failed attempt rather than erased or counted as success.

The four earlier self-review repairs and their retained regressions do not excuse I1, but their evidence is preserved. No new source test success is claimed from this AQA, and no synthetic test is product PASS, managed binding or a live acceptance claim.

This reviewer wrote only this review file. B00 remains incomplete until its later tasks; I01 remains bounded/partial. B01/D01/E00/V01/N01/Q1 remain unaccepted as applicable.
