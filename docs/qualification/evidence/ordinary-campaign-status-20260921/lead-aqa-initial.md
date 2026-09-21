# Ordinary campaign status — independent Lead AQA review

Reviewed scope: Console `c421160a71c0679a357f29828029ec3550791d16..a09405562533386708673102aa52e88feb18a190`, against `ordinary-status-brief.md`.

Verdict: **Spec ❌ (verification contract incomplete); quality Needs fixes.** The runtime implementation is aligned with the bounded functional contract on inspection. No concrete runtime correctness defect was found. Approval is withheld for the specific portable regression-evidence gap below, not for a request to expand implementation scope.

## Required finding

### P2 — Exercise the new approval/dependency context through the status subprocess

Location: `tests/unit/qa-campaign-cli.test.ts:129` and `:147`; new production plumbing at `scripts/qa-campaign.ts:682`–`:683`.

The only ordinary status fixture uses a resolved API oracle and has no dependency-enabled check. Its `QA_CONSOLE_PRIVATE_ROOT` value therefore does not exercise an approval lookup: `assertOracleApprovalReceipts` returns immediately when no unresolved oracle is referenced (`server/campaign-receipts.mjs:816`). That value even points inside the campaign workspace, which would be rejected if an approval store were actually needed. All status calls also set `QA_STARTER_REPO` to an empty string, so the new lazy pinned-Kernel callback is never invoked. This is good evidence for the no-Kernel legacy path, but no evidence for the newly connected dependency path.

The complementary suites do not close this boundary gap. `campaign-dependency-cli.test.ts:141` calls `readLatestCampaignEvidence` directly with `fixture.kernel.validateWorkspace`; its CLI commands exercise `validate`/`run`, not `status`. `campaign-dependency-readback.test.ts:136` supplies its own validator. The ingestion suite validates approval integrity through the bridge and its configured store, not this new command. For example, removing the callback at `qa-campaign.ts:683` would leave the added status tests passing while making every dependency-enabled ordinary receipt unreadable. Incorrect approval-store wiring likewise remains untested at this command boundary. These are test-sensitivity observations from source inspection, not executed mutations.

Required bounded fix: add real sealed-fixture `status` subprocess checks for (a) an approval-referenced receipt using an external temporary store selected through `QA_CONSOLE_PRIVATE_ROOT`, with success and unavailable/tampered authority rejection; and (b) a dependency-enabled ordinary receipt with the exact pinned Kernel, with success and missing/wrong pin or stale publication rejection. Reuse existing fixture support; no new runner/storage/flag and no duplicated deep reader matrix are needed. For readback, assert the original receipt, unchanged bytes/modes, and unchanged target request counters. Tests must construct their own evidence, not depend on a retained private fixture path.

This finding follows the brief's explicit requirement to protect actual new approval/dependency plumbing. Passing low-level validator tests does not establish the CLI passes the right context or calls the right runtime.

## Other required proof still absent

- Add the explicitly requested missing `tests/campaign-runs` directory control on an otherwise readable public-model workspace. The existing nonexistent selected ID is tested only while the runs directory and other valid runs exist. The reader handles missing directories with `null`, and the new CLI rejects `null`, so this is a small missing contract assertion rather than an observed runtime defect. It can be added to the current fixture before publishing its first run.
- The supplied 138/138 run and typecheck are implementation-report claims, not new executions by this reviewer. The supplied complementary raw log records 89/89. Root retains ownership of the full delivery gate.

## Confirmed by source and assertion review

- Explicit workspace and run ID remain required. The exact ID is forwarded to the existing reader; there is no implicit latest fallback.
- Valid v1 IDs dispatch before current-model or Kernel loading and preserve the original v1 envelope. The new positive test genuinely uses historical records without public model files, checks partial counts, and requires a null receipt.
- Ordinary readback uses the current public graph/catalog/project, declared product slug, and all declared environment URLs. It does not claim independently attested registration or broader UI validation.
- Default/environment approval-root resolution and lazy pinned-Kernel validation are correctly wired on inspection. The dependency reader checks publication authority before and after artifact readback. Missing authority fails closed; it does not create approvals.
- Invalid/null results and receipt run-ID mismatches fail nonzero. Existing-reader integrity checks remain in place; no new reader or runner was introduced.
- A successful read prints the original receipt and its digest/observed time. Full receipt deep equality protects non-PASS verdict, checks, and blockers; exit zero correctly describes read success, not campaign PASS.
- The portable ordinary test exercises older exact selection despite a newer run, corrupt exact selection despite a valid older run, malformed/unsupported/missing IDs, unsupported custom-store argument, current catalog drift, and artifact tampering.
- The positive ordinary readback snapshots all descendant fixture bytes/modes and observes zero local target requests. Production status contains no ownership, adapter invocation, writes, repairs, chmod, or sealing operation. The missing approval/dependency-path assertions above limit how far that dynamic no-mutation evidence can be generalized.

## Retained consumer evidence

Inspected `ordinary-status-consumer-before.json` and `ordinary-status-consumer-candidate.json`. The saved baseline returns code 1 with the continuation-ID error. The candidate returns code 0 for exact run `run-8faed1fa237a0a75-fd0ed7dc-d955-4ec8-9377-937292a081d7`, retains verdict `INCONCLUSIVE`, and records receipt equality with persisted bytes. Both snapshots show 180 entries and the same tree digest before/after (`96f211105f0a3470912e6a4d583a52f1ff55f14f26b90539f02636ef86517014`). This is valuable independent consumer evidence; it does not replace portable tests for the conditional contexts above.

## Review boundaries

Read the requirements, report, and complete diff once. Inspected unchanged helpers only for named risks: approval-root handling, pinned-Kernel invocation, public-model reads, exact selection/null handling, and coverage of approval/dependency contexts. No tests were rerun, no agents spawned, and no product, checkout, index, HEAD, or tracker state was changed. This review report is the only write.
