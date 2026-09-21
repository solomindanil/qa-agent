# Ordinary campaign status — Lead AQA round 1 re-review

Scope: tests-only fix `a09405562533386708673102aa52e88feb18a190..94083bf55d3237b6e60870211b034bfbc4b9dcc2`. Reviewed the complete supplied fix diff, appended implementation report, and both complete covering TAP logs. Runtime code is unchanged.

**Verdict: Spec ✅; quality Approved for this bounded repair.** Original required findings are addressed. No new actionable defect found in the fix diff. This is review approval, not a claim that the parent-owned full delivery gate has run.

## Original findings

### P2: New approval/dependency CLI boundary proof — ADDRESSED

Approval path: `tests/unit/qa-campaign-cli.test.ts:239` now constructs its own unresolved-oracle workspace, creates actual independent approval authority in an external temporary store through the existing approval command, and publishes a real sealed campaign receipt. `status` uses `QA_CONSOLE_PRIVATE_ROOT`, succeeds with full receipt equality, and fails with no receipt for an absent selected store and corrupted authority. Workspace and relevant authority-tree bytes/modes are checked around readback; the loopback request count remains zero. The missing-store negative also proves no store creation. The fixture does not rely on a retained private path.

Dependency path: `tests/unit/campaign-dependency-cli.test.ts:162` invokes the actual `status` subprocess for the existing freshly generated dependency-enabled sealed receipt. The correct configured pin succeeds and returns the exact receipt; missing Kernel and wrong SHA fail with no receipt. Request counters and workspace bytes/modes remain unchanged. This now detects the omitted/miswired callback regression that the previous direct-reader calls could not detect.

Publication freshness: `tests/unit/campaign-dependency-cli.test.ts:201` restores the exact plan and proves successful status immediately before publishing a controlled coverage-only revision. It checks changed publication identity and unchanged public graph/catalog semantic digests, then requires status rejection without new requests or persistent changes. Inspected the existing `publishAuthoredCompilation` helper solely to resolve the possible false-positive risk of publishing an invalid fixture: the helper validates the workspace and asserts its publicationAuthorityDigest equals the new revision before returning. Thus this negative is not merely malformed registration or leftover plan drift.

### Missing campaign-runs directory control — ADDRESSED

`tests/unit/qa-campaign-cli.test.ts:132` now calls status with a canonical ordinary run ID after materializing the readable workspace/plan but before the first campaign run. It requires nonzero exit, no receipt, and confirms `tests/campaign-runs` remains absent. This closes the explicit null/unavailable-path proof gap.

## New-breakage assessment

- Only the two relevant test files changed. No source behavior, authority, flags, receipt formats, runner, or storage surface expanded.
- The dependency command helper preserves inherited environment by default and adds explicit per-call overrides for the negative controls.
- Existing dependency execution assertions remain; the extension runs against isolated local fixtures. No dependency/runtime installation or external product action was introduced.
- The 600-second integration budget is unchanged. The saved run consumed about 479 seconds overall; this is a substantial existing integration test, but the supplied result is within budget and supplies no concrete evidence of new flakiness requiring another change.

## Evidence and limits

- `ordinary-status-round1-cli.log`: 3 tests, 3 passed, 0 failed, 0 skipped; approximately 23.5 seconds.
- `ordinary-status-round1-dependency-cli.log`: 2 tests, 2 passed, 0 failed, 0 skipped; approximately 479.2 seconds.
- Typecheck and diff-check success are recorded in the implementation report, not independently rerun by this reviewer.
- The original saved consumer RED/GREEN and complementary reader evidence remain applicable because this round changes tests only.

No unresolved required proof remains from my original bounded AQA findings. Parent still owns full delivery verification and integration. No tests were rerun; no checkout, source, HEAD, index, product, or tracker state was changed. This report is the only write in this re-review.
