# Global-plan continuation audit — 20 September 2026

## Scope and current identity

Owner resumed global QA-agent development while the Freeland merchant dispositions remain pending. Today's target is the agreed pre-cloud work; completion still requires the plan's actual exit evidence. No deadline turns unverified work into accepted work. Cloud implementation and product/merchant actions remain separate.

Audited canonical root: `aa31ba548f049633350d7602ccf2902273fe0e31`. Manifest-selected Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`, Console `c421160a71c0679a357f29828029ec3550791d16`, Freeland `d4754f7ddbcb8183f695f479ef21aa7728c1ace0`; reporting `10d398d8a077068c2184f33958e9b654a2f2947c` remains inactive. Fresh source verification passed all four components. Source identity does not select an existing product campaign's runtime or grant product authority.

The app goal is still paused. `create_goal` refused a replacement because an unfinished goal already exists. The available goal API cannot resume it; the owner was asked to use the UI. Normal current-turn work resumed, but no active automatic-goal continuation is claimed.

## Confirmed entry defect

Independent read-only Lead AQA review and coordinator readback agree:

- `git cat-file -e HEAD:docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md` fails: the current P0–P7 plan exists only in the working copy.
- Its no-loss reconciliation is also untracked. A new clean clone therefore cannot use the currently asserted plan from those paths.
- Current entry and roadmap contain repeated historical source selectors and former next actions. Some are explicitly historical, but later paragraphs still call old tuples current and direct already-completed observation/reference and Freeland reconciliation work.
- Correct current sources and complete skill bundles already ship through the manifest. This is an entry/delivery defect, not evidence that a new runtime, skill system or runner is needed.
- Existing dirty pages must not be committed wholesale. Preserve unrelated owner changes and dated evidence; distinguish active instructions from optional historical context.

The follow-up link audit found an additional exact-byte dependency: the reconciliation's D10 snapshot SHA-256 `f49e7397774763d6c6062a64705fa83be4b9cb6a7ea43aad59e18672738a3ed9` matches the current dirty 10 September plan, not its HEAD version (`4108c91afaeb035ae47ca7251c3ec4f33a453e8964a9ccb806e96c8921294729`). Preserve that snapshot byte-for-byte separately and point the reconciliation at it; do not silently commit the mutable owner's file. D13's tracked bytes already match `072bea250ed35fe304710cdfd76ec5de2814865a2bc9b466bfa6262e066e31db`. Optional historical report locators are not active onboarding dependencies and need not drag private material into delivery.

## P2 baseline checked

Executed `node --test tests/freeland-main/card-sbp-quote-contract.test.mjs` in an existing isolated normal Freeland clone at exact `d4754f7`, with a clean source tree and an existing dependency directory. Its lockfile matches the selected component (SHA-256 `704a0b43e1cd9d4e9c9e6c3cd4417f649b8550ad864c29f63a665f95992e9a45`). Result: **26/26, no skipped/cancelled/failed tests**, exit 0, 6.429 seconds.

This is an offline DOM/API-fixture qualification of the actual Card/SBP helper, not a staging or financial check. Browser requests are intercepted by the existing fixture. No dependencies were installed and no product/provider request or purchase was made.

Existing tests already reject zero-fee percentage fallback, wrong amounts/selection, wrong product, missing breakdown, expired quotes and attempted checkout on selection. They do not by themselves qualify the original FREEL-440 card-top-up wallet caption path. WAL-13 is an issuance/purchase tile oracle, not proof of first-dialog top-up coverage. The private historical fee-caption recipe contains useful observations but is not an accepted shared regression. A separate read-only semantic audit is identifying the smallest reusable repair before implementation.

### Executed nonzero-caption counterexample

Without editing any source file, the coordinator evaluated the same test module with exactly one in-memory fixture change: in `card issue waits for options and checks selected summary despite two differently named dialogs and repeated tile fees`, replace the inner tile caption `Комиссия оплаты: 3,23 $` with `Комиссия 99%`. API literals remain `sourceFeeRateBps: 1290`, principal `2500`, fee `323`, total `2823`; all assertions and the actual campaign helper remain unchanged. The original module URL and dependency resolution were preserved during in-memory evaluation.

The altered test still passed, and the complete module reported **26/26**, exit 0, 5.802 seconds. The isolated source checkout remained clean afterwards. This confirms a specific harness false acceptance for a nonzero selected-method caption. It is **not** a new staging defect, full original FREEL-440 wallet-top-up reproduction, or a general release false-PASS claim. No repaired source or successful RED→GREEN regression exists yet.

Independent read-only Lead AQA audit agreed on a first two-file repair: validate the fee meaning actually asserted by the selected Card/SBP tile against that method's quote, with healthy 12.9% and broken 99% literal controls. An explicit percentage with unknown rate must not pass by fallback; valid fixed-amount and verified included-fee models do not require a percentage. Preserve existing zero-fee, selection, amounts and checkout guards. Do not infer other rails or the current live tariff. The full original top-up first-dialog consumer is a separate follow-up in existing TC-PAY-07, whose current contract deliberately says API-only; do not claim that follow-up complete from this narrower test.

## Bounded next delivery

Proposed docs-only slice: deliver the accepted plan and necessary reconciliation context, make one concise current projection from existing authority, retain history separately, and verify a genuinely fresh reader in a clean clone. Do not change component pins, bundles, installed skills, campaign state, product state or permissions.

Acceptance: baseline absence retained; active links available from tracked delivery or explicitly restored manifest sources; unchanged source identities; a fresh actor identifies the accepted tuple, distinguishes frozen runtime/owner from source, locates the plan, preserves unknown scope and chooses one justified next action. Independent Lead AQA review is required. Merely making links exist is not dialogue-ready qualification.

At the audit checkpoint, the bounded docs change was awaiting the owner's answer and P2 implementation had not started. The owner subsequently approved continuation and clarified that the whole global improvement plan—not just documentation—remains the objective. The isolated entry correction and separate P2 implementation then began. See the [delivery record](tracked-entry-delivery-20260920.md) for subsequent qualification; this paragraph does not retroactively change the earlier audit results.
