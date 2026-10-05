# B00/I01 Task 2 — independent CLI spec/code AQA

Date: 2026-10-05. Reviewer: independent Astra, not the implementing Sol6.1. Root: `/Users/danilsolomin/projectsnew/qa-agent-release-20260926/.local/quality-mcp-clone`; dispatched parent HEAD `d4ea6041ebb7ed3c8beca09fce9f98229692eba4` on local `develop`.

## Verdict

**NO-GO for Task 2; Task 3 remains gated.** Spec compliance: NO-GO. Code quality: NO-GO for the same bounded publication defect, not an additional finding. Counts: **0 Critical / 1 Important / 0 Minor**. No new user decision or owner API is needed: implement the already accepted distinction between bounded JSON and its rebuildable Markdown projection.

Review scope: complete Task 2 brief/report and both complete new files through the 621-line full-context diff, against the previously fully read accepted intake design/plan and accepted Task 1. After that complete diff read, source checks were limited to the named Markdown-size risk. Inspected retained execution evidence and verified hashes; did not rerun the known-passing suite. One new, read-only, in-memory contract probe was run. Only this review document was written; no implementation, source/index/branch mutation, installation, build, product action or further agent delegation.

## I1 — JSON-only resource limit incorrectly rejects supported Markdown projection

Locations: `skills/qa-check/scripts/request.mjs:244` explicitly rejects rendered Markdown above `JSON_LIMIT`; shared publication repeats that cap at line 128. Existing-file comparison at line 122 and post-publication readback at line 140 also use the default 1 MiB JSON read bound. `render-report` reaches the same publisher from lines 204–211. Accepted design lines 156 and 163 require saved-JSON-only recovery and specify **JSON** maximum serialized input/read size 1 MiB, not a Markdown-size acceptance cap.

Concrete supported counterexample: brief `Check all sources.` plus two complete text-file sources, each exactly 200,000 ASCII backticks. This is two files below the 32-file limit; each is below 256 KiB and aggregate retained content is 400,018 bytes, below 512 KiB. Independent read-only probe used the unchanged accepted contract to capture, build, validate and render, and returned:

```json
{"sourceFileBytes":200000,"aggregateSourceBytes":400018,"requestJsonBytes":801743,"reportJsonBytes":801968,"markdownBytes":1201457,"jsonLimit":1048576,"result":"NOT_EVALUATED"}
```

The fixture used fixed UUID `00000000-0000-4000-8000-000000000001`, timestamp `2026-10-05T00:00:00.000Z`, owner `{product:"sample",specialist:"qa-product-v0",checkpointPath:"/private/sample/CURRENT.md",notesDirectory:"/private/sample",workspacePath:null}`, source locators `/private/sample/source-2.txt` and `/private/sample/source-3.txt`, empty exclusions/selection/evidence and rationale `Retain all scope.`. Source digests were independently computed with Node SHA-256 over the exact source bytes. No fixture file or product state was created.

The pure validators accept both documents; safe dynamic fences legitimately expand Markdown beyond 1 MiB. Static CLI control flow then deterministically returns `LIMIT_EXCEEDED` at line 244 before report publication. A canonical saved JSON report of this supported shape likewise cannot be recovered by `render-report`, because line 128 rejects the derived bytes. This is a source-confirmed CLI result, not a claim that an extra CLI process test was executed. Merely removing line 244 is insufficient: the publisher and both readback paths retain the same incompatible bound, with post-create readback otherwise becoming `WRITE_OUTCOME_UNKNOWN` after a successful larger Markdown write.

Required correction: retain the exact 1 MiB JSON input/document bound, while allowing the complete Markdown produced from a validated bounded report. Make publication and comparison/readback bounds appropriate to the expected rendered bytes (still bounded; do not switch to unbounded reads or add a new undocumented acceptance limit). Preserve exact bytes, exclusive creation, identical-file idempotency, conflict/unsafe/unreadable distinctions, unknown-outcome behavior and JSON-only recovery.

Required regression controls: a real-process capture/report using supported sources whose JSON fits but Markdown exceeds 1 MiB; exact complete Markdown bytes; fresh `render-report --report <saved JSON>` after originals and Markdown are absent; repeat read-only idempotency with unchanged mtimes; differing existing Markdown remains a preserved conflict. Retain the current oversized-JSON/serialization-expansion negatives and uncertainty controls. Witness the new counterexample fail before the bounded correction, preserve that raw failure, then supply the affected passing evidence and exact new hashes for independent re-review.

## Other reviewed behavior and test quality

- The CLI uses Node built-ins and the accepted sibling contract only. Commands, strict per-command flags, explicitly supplied owner context, independent ordinary request UUIDs, explicit immutable amendments and nonmutating selected-document reads follow the bounded interface. No owner/runtime or registry-derived authority is introduced.
- Full scope, original wording, exclusions, incomplete/no-document input, source gaps and unknowns remain visible. Old saved associations passed to a same-workspace new capture or amendment stay historical; even matching references remain caller-authored and unattested. No local document success promotes receipts or means product PASS.
- Inputs are validated before initial output publication; normalized local paths, no-symlink checks, exclusive private creation, sync/close and readback, strict UTF-8, sanitized error envelopes and preservation after uncertain outcomes are implemented coherently within the accepted trusted-local-owner boundary. The finding above concerns a format bound, not an invitation to broaden this into hostile-filesystem qualification.
- Existing tests are meaningful process/filesystem controls, not digest-only tautologies: independently asserted source bytes and literal statuses, shape/source/partition/classification tampering with recomputed digests, real saved old references, private file modes, exact recovery envelopes, original-input removal, mtime preservation, differing/unreadable files and injected sync/partial-write failures. Fault injection is confined to synthetic test preloads, not a production switch. Their current gap is valid JSON with a larger rendered projection.

## Retained evidence

Read final TAP: 29 passed, 0 failed, 0 skipped, 5190.105 ms (13 CLI + 16 unchanged contract). The retained initial missing-CLI RED is 0/9, first implementation 9/9, serialization-expansion RED 0/1 (`INVALID_ARGUMENT` versus expected `LIMIT_EXCEEDED`), and earlier combined result 29/29. These are author-run evidence, not independently rerun results. The named new probe above identifies a gap despite that green suite. Final source-verification output records all four selected pins unchanged; no new owner acceptance follows from it.

| Reviewed bytes | SHA-256 |
| --- | --- |
| Accepted intake design | `1ff8d16bfb15906262bc35c20db802135547403c59103cd3d668a38a628613e3` |
| Accepted intake plan | `f18f1c1116a04e897b54a37397fa2c98ece502d9f5ad0c45181d67154a7dbfba` |
| `skills/qa-check/scripts/request.mjs` | `7a10dc164312bda485f3c6c80e2d4fd77332a068e4e3fdac00c9671d01376d8a` |
| `tests/qa-request-cli.test.mjs` | `c15e8b143c0e35c62bb8d6a52547770abb2822b3270f21eed1daec964e53e75e` |
| Unchanged `request-contract.mjs` | `ec01b4054f5c5e0865ae7df0d7a3b71ad8f8d609f2c91976c0f703d395296aad` |
| Unchanged contract tests | `1756e7e993862ea9a4efde37f5f1a521e28937276df1223c624c633292578b6d` |
| `B00-task2-full-context.diff` | `f1b8600762ebd73d1ce7c4de2a91f2d1b710376455b6a4d65baea6d7fb53732b` |
| `B00-task2-implementation-report.md` | `1789046d62a4dc0bae2bdce6251d62a4b5bd08026d276508858dace9beaa7a22` |
| `B00-task2-red.log` | `263099e9afae5a2f76355dc43929502bfaeb480bc104d8c8a262245ecd967c5e` |
| `B00-task2-first-implementation.log` | `204ffc53204242ae84b1c6d74639bc92f4cfab1f3efc6be406a1136e26e7a00f` |
| `B00-task2-limit-red.log` | `2886b9c4367afff5d104ad3fde749b8057971df86009efef198d44b06495aee2` |
| `B00-task2-focused-green.log` | `99eac1b4806de00214e098cdc81d1df33c10407dd6d1fb139b5124b4fdbc4dd5` |
| `B00-task2-final-focused.log` | `421b26216b864e41478659b7948295056965cc335dd063443bec202584c10f78` |
| Preflight and final source-verification logs (identical bytes) | `d9c37a566787b8034b072c8adf9361cef13af908e0cc9d30146ffcb9b784ed3f` |
| Empty `B00-task2-diff-check.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

Logs/diff/report reside under `.superpowers/sdd/2026-10-05-universal-qa-product-plan/`; retained failures are not superseded or relabeled by this review. Tested environment remains Node 22.23.1 on the author's macOS/POSIX host; no exact-22.12 or cross-platform claim. B00 overall, Task 3 delivery, B01/V01, live owner integration and product QA acceptance remain outside this verdict. The separate accepted U00 design is unaffected.
