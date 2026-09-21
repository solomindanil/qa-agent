# Phase 2 revised test design — public household catalog

Status: **REVISED PROPOSAL / NOT PUBLISHED / NOT EXECUTED**. Independent Lead AQA re-review is required.

The rejected Phase 1 files remain preserved byte-for-byte under `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/reviewed-cycle/first-proposal/`; this revision uses new `phase2-*` paths.

## Fixed review findings

### R1 — summary meaning is separated from strict text equality

The declarative plan contains no summary-text assertion and makes no exact-copy promise. It has two deterministic browser checks and two blockers. The original `Read the result summary` target/check is retained as a plan blocker because the selected adapter uses strict text equality and cannot establish paraphrase-sensitive complete meaning.

The catalog oracle for that target remains the sourced semantic rule: for each concretely captured catalog state, the complete summary meaning must agree with the displayed item set, including empty. Healthy wording such as `1 item found` or `No matching items` is acceptable when its complete meaning agrees. A contradictory complete sentence is not accepted merely because it contains the expected numeral. These examples are review countercontrols, not executable copy rules or a reusable text classifier.

The authorized agent-observation lane will assess the actual captured text only:

1. After approved publication and declarative execution, open `/catalog` in a fresh managed-browser tab and confirm the exact loopback origin.
2. Capture the full summary text and complete displayed item-name list at the actual baseline, Tools singular state, literal-period empty state, cleared-Tools singular state, and Fruit plural state. Do not invent a missing state. If a prerequisite filter/search state is not reached, mark the affected summary clause `partial`/unassessed rather than a summary defect.
3. Interpret each captured complete sentence against the captured item set. Record exact text and names in `actual`, the brief in `expectationBasis`, and the concrete reasoning for this capture. Do not apply regex/token heuristics.
4. Create one canonical `agent-tool-observation.v1` JSON payload with `attachments: []`, `provenance: agent_authored_unattested`, deployment identity explicitly unknown, and limitations covering caller authorship and any unachieved state.
5. Build the exact one-entry evidence manifest from the then-current publication and strategy: check `urn:qa:automated-check:61bf0b7efd50f8d797ac3e93`, requirement `urn:qa:discovery-target:d6735977b5d37ae97d565205`, current oracle digest, owner-derived artifact path, canonical payload bytes/hash/size, and caller-declared candidate/environment identities.
6. Use the existing Console `record-observation` command with explicit aa5 Kernel, then `read-observation` and `observations`. Verify current binding, payload bytes/hash/size, target report and limitations. This stored observation remains unattested and does not change the campaign receipt, coverage result or release verdict.

The Phase 2 preview proves pre-publication binding shape only: resolved semantic oracle, current catalog target, automated check node, coverage target, and a reviewed verifies relationship. It does not claim a capture exists.

### R2 — observation relationship is structurally reviewed

All three authored public check-to-target `verifies` relationships now use `reviewStatus: reviewed`. This records the independent Lead AQA's structural mapping review and requested correction; it is not evidence that the product passed. The preview reports the exact summary relationship:

- relationship `urn:qa:graph-edge:a39d1e57e9d0ea572cadbef2`;
- publication `sha256:54bbc74129669965d6f2eb980f70ba85f60af074da8174d82117cd43eb451a2c`;
- strategy `sha256:ea2154ddc60a9141688482f21770ced57d6f7e1464e86dd41bc601af90dd2555`;
- oracle `sha256:39196acbe0505e04a06ec1ebb3ce92f3b3d25c7445e2766a9063e2086f2d09a6`.

The actual writer remains the authority after publication; no observation was recorded during design.

### R3 — terminal control visibility is asserted

Both deterministic checks now assert Search and Category visibility at their relevant terminal boundaries. The surface check also asserts Category remains `tools`; the compound expectation no longer exceeds the executable evidence.

### R4 — discriminating search witnesses

- `AMM` is an uppercase non-prefix substring of the rendered `Hammer` witness. Matching it discriminates substring behavior from prefix-only behavior while checking case insensitivity.
- Literal `.` is absent from rendered `Hammer`. With Tools selected, the expected zero-item result discriminates literal matching from common wildcard/regex interpretation.
- No all-input or sorting claim is made. These are bounded witnesses derived only from the rendered public catalog and the brief.

## Revised denominator

All four original targets remain accounted for:

- **2 declarative executable** — internal substring/category/clear journey; visible public controls/category/literal-period behavior.
- **1 agent-observation lane, blocked in declarative plan** — complete summary meaning and item-set agreement.
- **1 unsupported/blocker** — staff inventory management; no staff account or surface exists.
- **0 omitted** and **0 campaign checks executed** in Phase 2 design.

The plan contains exactly three one-second absence windows: composed empty items, Hammer excluded after clear, and literal-period empty items. Budgets are fixed before execution.

Console-error and horizontal-overflow assertions were removed from the sourced business campaign. They remain optional diagnostic observations only; a diagnostic does not become a catalog contract violation without separate authority and diagnosis.

## Failure-prefix and continuation rule

The adapter stops a check at its first failed assertion. If the first `AMM` item-count assertion fails, only the executed prefix is evidence; Hammer visibility, Fruit composition and clear/recovery are unassessed in that attempt, and the second automatic attempt repeats the same prefix. The report must name the unexecuted suffix. Diagnose the retained attempts first. Continue the remaining authorized suffix through a justified agent-led observation or a separately approved revised campaign; do not mark every compound clause failed/passed and do not launch another campaign merely to spend attempts.

The independent literal-period surface check remains a separate campaign check and should run normally even if the compound search check needs review. No public check is intentionally left unexecuted to manufacture resume evidence.

## Publication/execution boundaries

`phase2-publication-and-execution.mts` uses the accepted c421/aa5 APIs and existing Console CLI. Default `preview` is read-only. `publish` requires the independently reviewed plan and preview digests; `execute` requires the current canonical plan digest and invokes existing `validate` then `run`.

Publication precedes exclusive canonical-plan creation and is not one cross-file transaction. If publication, plan write or validation fails, inspect current publication/state/plan bytes and reconcile that same operation before retry; never rerun a fresh proposal blindly.

Selected source remains Console `c421160a71c0679a357f29828029ec3550791d16` and Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`. Product deployment SHA remains unknown. No new parser, runner, source change, fixture inspection, evaluator answer, registration, credential, external origin, product mutation or tracker operation is introduced.

The script's exact-HEAD guard is not a working-tree-integrity attestation. Before any approved publish/run, the owner must preserve the reviewed source/plan bytes and rerun source verification; a matching HEAD alone is insufficient if the checkout is dirty.

## Dry-preview result and next gate

The exact Phase 2 proposal passed the actual read-only Kernel knowledge-revision/publication preview:

- next publication `sha256:54bbc74129669965d6f2eb980f70ba85f60af074da8174d82117cd43eb451a2c`;
- graph `sha256:6090fad12b80304bdf164e9e3ed9a2f674c2573f26e57cba0154271116de5c59`;
- catalog `sha256:11576c1fde53a9bf232d2f79041c0e65794840a66d41344409c744554e89a0a2`;
- plan digest `sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85`;
- preview `sha256:1ee62526b285437062c3fe0b4ef133292ad5d44b4c2084eb827cce05ce1c9d68`;
- 2 executable, 2 blocked, 3 absence windows, `mutationPerformed: false`.

Next action: independent Lead AQA re-reviews exact Phase 2 bytes and digests. No publication or campaign execution occurs before APPROVED.
