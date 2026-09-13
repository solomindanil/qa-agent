# First QA report — public household catalog

Result: **INCONCLUSIVE** campaign, with an agent-diagnosed public search problem. Eight authored public checks ran: **5 pass, 3 needs_review**, plus **1 blocked staff target**. This is a bounded owned-local exercise, not whole-product or universal QA qualification.

Exact observed target: `http://127.0.0.1:61051/catalog`. Registered origin: `http://127.0.0.1:61051/`. No alternate route or external origin used. Root source `5fb22a19d3f2ceb6328384e9c8ae713be3b3b4ec`; Console `881a93e43fd9b90f3dcf9812812f6cf8ad854789`, Kernel `657894dbd61561a634f36669a0874dccccbea59e`. Source verification passed before and after work. Product deployment SHA is unknown; source pins identify the QA runtime only.

## What was checked

The supplied product-brief.md establishes literal case-insensitive substring search, category intersection, clear preserving category, supported empty results, and summary/item agreement. Rendered UI supplied selectors and the local inventory: Apple/Pear/Hammer, Fruit→Apple/Pear, Tools→Hammer. These inventory assignments are observations, not an independent inventory specification. No order was asserted.

| Check | Campaign result | Exact scope/diagnosis |
| --- | --- | --- |
| Baseline | pass | Three visible names and matching 3-results summary |
| Search `pP`, All | needs_review | Both attempts expected Apple only; actual item count 3 |
| Literal `.`, All | needs_review | Both attempts expected no items; actual count 3 |
| Tools category | pass | Hammer only, count/summary 1 |
| Search `a` + Fruit | pass | Apple/Pear and summary 2; this does not independently prove search, because both fruits contain `a` |
| Search `pP` + Tools | needs_review | Both attempts expected no items; actual Hammer/count 1 |
| Clear search in Fruit | pass | Final Fruit/empty-search state has Apple/Pear; intermediate narrowing was not asserted and was not established |
| Clear no-match search in All | pass | Final empty-search state has all three; actual recovery from an empty intermediate state is not established |

Three non-pass checks each have the runner's original two attempts, not manually repeated campaigns. Navigation and search/category value assertions passed before count mismatches. Their later summary assertions did not execute after count failed. All 11 traces were inspected; no console errors or failed requests recorded.

## Diagnosis

Observed search text does not restrict the displayed set: category-only results remain. Independent CUA inspection at the same exact URL reproduced `pP`/All→all three, `.`/All→all three, and `pP`/Tools→Hammer. The `pP` result remained after an intervening diagnostic interval and a fresh screenshot. This supports a product-behavior issue rather than a wrong locator or only an immediate snapshot race. The issue is not inferred from test failure alone: the literal rule and observed names give independently derived expected subsets, controls held the correct values, and rendered results corroborated the count evidence.

Underlying implementation cause is uninspected. No response-time SLA was supplied, so bounded later observation is not a universal timing guarantee. Campaign screenshots intentionally mask input values; traces include successful value assertions. Separately stored reviews are **agent_authored_unattested** and do not promote the immutable campaign verdict or create bugs automatically.

## Persisted evidence

Exercise root: `/private/var/folders/wb/zqtxc1qs7sqgspnt3vwlmr640000gn/T/qa-public-agent-4fv1s9`.

- Canonical plan: `nuanu-readonly-qa/tests/qa-campaign.v0.json`; digest `sha256:007f3a3fcdbeaabf56f5dd04d9e9d4b9e18a857c1a3a1cfe63a353c6d6139c13`.
- Actual immutable receipt: `nuanu-readonly-qa/tests/campaign-runs/run-32f3edec64096686-e6fd30aa-058b-4afc-81e8-1e4fb3d04198/receipt.json`; digest `sha256:47ceaa8e0b4eb156fc250f2ecb9449f1895c8f547c4b60a5ff5dad8ce4cd68f4`.
- Actual `readLatestCampaignEvidence` return saved as `latest-evidence.json`; it contains the plan, receipt, all 33 artifact paths/hashes/sizes, blockers and classifications. Verdict remains `INCONCLUSIVE`, `dossiers: []`; no ticket created.
- Original screenshot/trace/result artifacts live under that run's `checks/<artifact-token>/attempt-1` and, for each non-pass, `attempt-2`. Search case token: `check-c5aaeb78fa549e6327338c4881678a7856a4459eaa4a8df98e900c56247051dd`; punctuation: `check-a5f4ef691ea0530bdb37ccdd2315db9c0c0a111dc9a923110c8a2843618746b7`; empty intersection: `check-4eb145edbcfff37654814960cab2fb1873e7de338b5601d85bd9e50817c17a6c`.
- Three current-binding review readbacks: `review-readbacks.json`; immutable originals under `nuanu-readonly-qa/.qa-private/findings/campaign-review-{digest}.json`, digests `d1c8e615d148ed686f1549215bc21960b02a8e4a1e547dc74d9a14ffec9c784a`, `1debcf1d88158058cb75e92f82cc1b9b0644b18bbebed8931d8f28da6c7ee3c0`, `353c6378b16aacc5766433fa1e2c412a73a1fe213f32014f8466651cc009a452`.
- Reviewed knowledge and API readback: `knowledge-proposal.json`, `knowledge-preview.json`, `publication-readback.json`, `plan-write.json`, `proposed-checks.json`. Publication used existing Kernel preview/apply, never hand-edited managed graph/catalog. Every original target and staff gap retained.
- Reusable local API-calling script: `author-campaign.mts`; complete attempt history/difficulties: `execution-journal.md`; resume instructions: `checkpoint.md`.

## Remaining scope and next action

Staff inventory management is blocked: no staff account/surface, and no inventory mutation authority. Do not delegate public needs_review cases to a human; the agent has diagnosed those supported cases. Responsive, accessibility, performance/load, security, authenticated scope and additional input equivalence classes are unassessed. No sorting requirement exists. Public clear recovery remains only partially supported because the preceding search restriction never took effect.

Next bounded action: the owner may inspect/fix search filtering in a separately authorized development scope, then run the preserved regression plan against the identified candidate; retain these original failed attempts. Strengthen future clear/intersection testing by separately asserting a genuinely narrowed intermediate state before claiming recovery. No redundant campaign rerun, tracker write, staff login, installation, source change or product mutation was performed here.
