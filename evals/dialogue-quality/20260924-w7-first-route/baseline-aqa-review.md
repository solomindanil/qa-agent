# W7 S1–S3 baseline — independent post-actor AQA

24 September 2026. **NO-GO for clean source-only W7 discovery
qualification.** Critical 0 / Important 3 / Minor 1. The first
[answers](baseline-first-answers.md), parent-copied
[dispatches](baseline-dispatches.md), frozen
[cases](../w7-first-route-cases.md) and
[rubric](../w7-first-route-rubric.md) remain separate. No actor was corrected
or retried. This is one open-context answer-text baseline, not a new
index/graph adoption, installed-host qualification, behavioral healthy/broken
fixture check or product result.

| Case | First-answer grade | Decisive observation |
| --- | --- | --- |
| S1 ordinary status | **Inadequate** | Correctly discovers ordinary exact-run `status` and distinguishes `resume`, but only says generic replay limits. It does not explicitly rule out browser/dependency replay or reconcile unknown effects, and does not state the v1 read branch. These were predeclared meanings, not a command-name check. |
| S2 workspace integrity | **Inadequate** | Correct raw Kernel validate and distinct apply/recover/adopt bindings, but omits Console bridge validation/preview and their local receipt writes, and leaves later mutation authority/readback under-specified. |
| S3 Freeland recovery | **Adequate** | Finds the controlled recovery lane without a target hint, refuses present execution, names external account/mailbox/reset/password effects, separates fresh from retained access, and preserves `NEEDS_AGENT_REVIEW`/shadow rather than PASS. |

The independent Astra reviewer checked the retained final texts against the
selected sources: ordinary v0/v1 status, surviving inherited host and
browser/dependency replay rejection are in
[Console CLI](../../../components/console/scripts/qa-campaign.ts);
validate/preview receipt persistence and distinct integrity mutations are in
[Console bridge](../../../components/console/server/bridge.mjs) and
[Kernel CLI](../../../components/kernel/src/cli.ts);
the recovery admission and pending result are in
[Freeland runner](../../../components/freeland/tools/freeland-replacements/run-tc-vhod-05-controlled-recovery.mjs).

## Protocol and provenance

The source-only control failed independently of answer quality. Native local
session logs show S1 reading installed `.codex/skills/qa-check`, S2 reading
installed `.codex/skills/qa-check` and `.codex/skills/qa-product-v0`, and S3
reading installed `.agents/skills/freeland-release-qa`; all three also read
installed `using-superpowers`. The actor `turn_context` cwd was the ambient
`NuanuFlowQA`, even though source-inspection shell commands explicitly used
the pinned independent clone. Thus the result cannot be attributed to the
selected source index alone or relabeled after the fact as an installed-host
test. The clone was clean at `5e494b1202d53f1ef6796b08f420da4d2145d196`,
its case/rubric files were absent, and `sources:verify` succeeded for the
selected pins.

The reviewer independently matched all three full JSONL hashes and native
final-text SHA-256 values in the [answer table](baseline-first-answers.md),
including the exact fenced first answers. Native `turn_context` showed
`gpt-6-sol`/medium, tool wrappers 12/13/16 and durations
56.010/69.805/87.127 seconds. All observed tool invocations were local
inspection; no product/browser/provider/tracker/account/repair/install action
was observed. Monetary cost is unavailable. Native `NEW_TASK` fields are
encrypted; exact dispatched-prompt equality and `fork_turns=none` cannot be
independently reauthenticated from these logs and remain parent-attributed.

The bounded observation is useful but narrow: S1 found the ordinary-status
route, S3 explained the recovery boundary, S2 omitted the Console bridge
effects, and S1's replay explanation was incomplete. None of that repairs the
earlier I06a D1/D2/H1/H2 adoption NO-GO or closes W7. No `3/3` score, speed
claim, graph benefit, live PASS or host readiness follows. The next design
must either isolate actor skills/context before a **new predeclared source-only
test**, or define a separate actual-host test with its installed-byte identity;
the present answers are never substituted for either.
