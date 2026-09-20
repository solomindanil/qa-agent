# Global QA-agent plan: resume checkpoint — 17 September 2026

## Pause checkpoint — VELVET acceptance

Latest user priority on17September pauses implementation for Freeland VELVET readiness and connection onboarding. Completed source repairs, candidate bundles, reviews and limits below are preserved. Resume at minimal existing-tool CI/source-adoption work, then separately approved P1 implementation; do not restart P0.1–P0.3. Active source pins and frozen campaign owners remain unchanged. Product checks do not authorize new purchases, inventory changes or deployment.

## Decision and current state

The user explicitly resumed the [latest P0–P7 plan](../superpowers/plans/2026-09-16-cross-product-qa-global-plan.md). Its16September Freeland pause is lifted. This does not imply that Freeland shipped, that its complete suite is green, or that release ownership changed. The [no-loss reconciliation](../reviews/2026-09-16-global-plan-reconciliation.md) remains the map to earlier obligations.

**Current step: P0 entry/source baseline complete; all three bounded P0 defect repairs independently reviewed and cold-tested in isolated, portable candidates. Complete P0 acceptance remains open.** Safe CI and explicit source adoption remain pending. No whole P0 checkbox is closed by packaging checks or these scoped repairs. P1 is a reviewed design, not an implemented observation API.

The normal root checkout is at `e0347a68391b8c33df2cacc6c76244d4d24fbf1c`, branch `codex/workspace-assembly`, with pre-existing modified/untracked documentation preserved. The16September plan and reconciliation were untracked at entry; these continuation documents remain working-tree work, not a new committed/pushed delivery.

| Source | Selected commit |
| --- | --- |
| Kernel | `185d3e72309a4362db57cf2e805d1c00a5035909` |
| Console | `66ac7db55a25f56b199b2cb00ad83df3b8dad868` |
| Freeland | `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0` |
| Reporting reference, inactive | `10d398d8a077068c2184f33958e9b654a2f2947c` |

The manifest remains the authority, not this historical table. Existing campaigns retain their own frozen owner/runtime; no product runtime is required for the next source-only repair.

## Fresh checks actually completed

- Main `npm run sources:verify`: exit0, all four exact sources verified.
- Main root `npm test`: exit0, **59/59**, zero failures/cancelled/skipped. These are packaging tests, not product or component-wide QA.
- Independent fresh-context entry actor read actual repository entrypoints, selected current source and preserved campaign ownership. Its [first response](../../evals/source-entry/20260917/first-response.md) is retained unchanged. It correctly distinguished the user's resumption from an unproven Freeland release.
- Main invoked the actual selected TC-PAY-01 oracle with its existing healthy fixture, then changed only `sheet.tiles` to balance-only and empty. All three returned `SHADOW_PASS`; all retained `promotionEligible:false`. This reproduces an oracle sensitivity defect, not a live missing-payment-method defect or a false overall release GO.
- Independent Lead AQA inspected current Console authority and findings write paths; main read the same seams. Git replacement and findings parent-symlink/collision gaps remain in source. Only healthy authority readback was executed in that audit; adversarial Console reproductions are still the next step.
- Architect inspected active Kernel/Console and inactive reporting reference for P1 reuse. Main independently read the reference writer and active review-store boundary. No code was ported.

No product, browser, network, tracker/Buzz, payment, install, migration, component source write, commit or push was performed in this resume slice. Root packaging tests use their own disposable filesystem fixtures; they are not product runs.

## Entry baseline and corrected documentation

Before changing entrypoints, the fresh actor observed:

1. Roadmap still selected13September while current working-tree notes linked16September.
2. Current notes still required waiting for a Freeland release, despite the user's new continuation instruction.
3. A host locator advertised older component pins. It is a locator, not source authority.
4. Installed `qa-product-v0/SKILL.md` matched source but two references differed; installed Freeland bundle differed and lacked `exact-ticket-evidence.md`. Matching one skill file is not full-bundle qualification.

Current/roadmap/plan now point to the same latest queue and label the old priorities historical. Source skills and installed copies were not edited. Use complete source bundles for selected work; any selective installation remains a separate scoped operation. This limited actor exercise is not blind, statistically reliable, a full skill-consumption test, or proof of a new product campaign. No answer-key filesystem isolation was enforced.

Independent Lead AQA documentation review initially found remaining old forward pointers. After the targeted current/roadmap correction, scoped re-review: **APPROVED — resume documentation only**. `git diff --check` exited0;17 relative local targets in the four new/linked plan/eval/reconciliation documents existed. No runtime repair or P0/P1 acceptance follows from that review.

## First implementation slice: P0, bounded and source-only

### Implementation update —17September

Console candidate commit `bb9b739822d3302b525007949c2ee9854843bd5a` from selected66ac fixes Git replacement interpretation in the single authority wrapper; no Kernel/pin/path/error-policy change. Actual imported authority on independent disposable Git clones: baseline5/7 with two assertion failures (commit and blob replacement accepted), fixed7/7 with healthy, harmless replacement metadata, dirty/staged, symlink and configured-SHA controls. Independent Lead AQA: spec compliant and quality approved, no findings. [Portable candidate and cold check](p0-authority-repair-20260917.md): complete-history bundle; fresh Console/Kernel restored from repository bundles and7/7 passed without dependencies. Full component integration/build and adopted/pushed delivery are not claimed. Canonical manifest, campaigns and installed skills remain unchanged.

The payment oracle's structural repair is complete in candidate `510e08a38565e8f8074d36d5f8eaa62d9d93bd7b`, not adopted. [Portable candidate, raw outputs and limits](p0-payment-composition-repair-20260917.md): independent Lead AQA approved; main restored the bundle without local dependencies and observed 68/68 pure tests plus 4/4 named registry tests and provenance VALID. Sixteen actual v1/v2 comparisons caught 11 faulty compositions and blocked 2 unverified balances, retaining 3 healthy controls. PAY01 is now shadow/version2 with no old receipt reference; the other16 bindings and historical receipt bytes remain unchanged. Seven other pre-existing stale receipts remain unresolved. These are structural assertions, not new visibility/click/payment evidence. The separately reviewed readiness repair remains untouched.

Findings containment is complete in Console successor `d28d7743e9aac370a726df6c6288ad2ef0e52c78`, including its reviewed P0.1 parent. [Portable candidate, original RED/GREEN and independent review](p0-findings-repair-20260917.md): original6/14 → fixed14/14; main combined authority/findings21/21, then cold Console/Kernel restored from repository bundles21/21; post-fix and cold TypeScript checks pass. Source-symlink test attribution was corrected after the sole minor review finding. User-approved isolated installation used the unchanged lockfile with scripts/browser download disabled; cold installation used the task-local npm cache offline. Canonical components and installed skills remain unchanged. The P0 safe-command audit now recommends ordinary explicit CI steps over existing tools, not another runner; no CI implementation is claimed. The minimal P1 writer/reader design is reviewed but awaits its contract approval before implementation.

### Scope retained

1. **Console Git authority.** Existing owner: `components/console/server/kernel-authority.mjs`, `gitBytes()`. Git currently observes replace objects while comparing supposedly pinned content. Reproduce commit and blob replacement on disposable clones; healthy exact bytes must pass and altered authority must fail before build/import. Minimal candidate: disable replacement interpretation in the single Git wrapper, retaining exact pin/path/error boundaries. Do not weaken checks or change Kernel. Avoid incidental Kernel builds from the existing TS fixture's top-level import; a focused plain Node test can import the authority module without provisioning.
2. **Console findings containment.** Existing owner: `components/console/server/bridge.mjs`, `findingsCreate`/`findingsResolve` and contained reader. Reproduce parent symlink and destination collision via direct request mocks, without a network listener. Reuse contained-directory checks; refuse unsafe parents/leaves, use exclusive destination publication, preserve original on failed resolve, and read back healthy create→resolve. Existing code already leaves the original when its destination write actually rejects: do not claim a reproduced unconditional loss bug. Static containment repair does not establish hostile concurrent filesystem-swap or crash-transaction guarantees.
3. **Freeland missing-UI oracle.** Existing owner: `tools/freeland-replacements/tc-pay-01-oracle.mjs` and `tests/product-graph/freeland-smoke-u0-oracles.test.mjs` within the selected component. Cover healthy/empty/balance-only/missing/duplicate/misbinding through API↔DOM evidence and the actual collector. Preserve `promotionEligible:false` and explicit precondition gaps. Do not use the current permissive negative outcomes as product PASS. Inspect the separately reviewed repair lineage before selecting a successor; no change to a running campaign's corpus.
4. **Safe commands and entry qualification.** Keep source/pure/owned-fixture/product execution separate. A safe gate must not acquire a live target merely from ambient environment. Preserve first reasoning answers before any skill edits; then review and execute a distinct fresh consumer rather than coaching the old answer into PASS.

For each source repair: isolated owning candidate → executed RED/healthy controls → minimal correction → relevant GREEN → independent Lead AQA review → reviewed delivery and actual reader. Adoption/installed skills/product campaigns remain separate. No need to rerun unrelated large suites simply to obtain a new total.

## P1 in parallel: proposed seam, not code

The active Console `recordAgentReview` is tied to an existing campaign receipt and inventoried attempt artifacts; it cannot honestly store a newly executed CUA/MCP check. Do not fabricate receipt IDs to use it.

Preferred proposal: selectively reuse reference `agent-tool-observation.ts` / `target-observation-report.ts` in a reviewed successor of **active Kernel**, retaining the active private writer and publication authority. A thin Console writer/reader and separate observation projection consume it; existing managed receipt/coverage/verdict stay unchanged. Do not activate reference10d, replace the engine, copy its older private store, or port its historical fixture pins.

Before implementation, bound the new payload contract to scope/check/target, expectation basis, observed identity or unknowns, lane, actual outcome, limitations and safe artifact references. Preserve `agent_authored_unattested`; a stored digest proves bytes, not capture or business truth. Reference `planDigest` means published strategy, not executed campaign plan. Incomplete/altered/conflicting/stale records stay visible without promoting current acceptance; verified and unverified artifact references must be distinguished.

Practical first exit: harmless observation A persists and is read by a fresh actor; capability gap B remains visible; independent C continues. Historical/managed receipts are unchanged. New storage/API contract requires its bounded design review before implementation. This seam assessment is not such implementation acceptance.

## Preserve the Freeland work

The [17September repair](freeland-harness-readiness-repair-20260917.md) is reviewed in an isolated uncommitted source successor based on `377354b2ad8d98c5efe104919b41ed5d7a93352e`. Its final owning gate3219/3219 and targeted35product PASS +setup +2expected-fail293 belong to that separate corpus. Keep this work for **P2 reusable readiness/selected-quote checks and P6 source delivery**; do not implement it from scratch or silently attribute it to Freeland3ee.

The full old sealed `BLOCK_RELEASE`, unrun scope, graph debt and partial dry ticket acceptance remain unchanged. Returning to this global plan does not initiate another full Freeland run or require another payment/reset test.

## Where the rest of the plan goes

After bounded P0, P1/P2 provide useful saved agent-led outcomes and sensitive checks. P3 proves full/ticket/help/resume without lost scope. P4 proves graph/knowledge improvements consumed by the next run. P5 qualifies independent decisions across product classes; P6 provides cold dialogue-ready delivery and explicit host limits. P7 is a separately authorized cloud pilot, not the next implementation action.

Completed M1–M5, intermediate browser assertions, bounded continuation and the original graph comparison remain completed within their recorded limits. Do not reopen them because an old goal or dated roadmap still names their former next step.
