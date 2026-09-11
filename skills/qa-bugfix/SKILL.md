---
name: qa-bugfix
description: Use when the user asks to prepare fix prompts, cluster confirmed bugs, or process a product's bug backlog.
---

# QA Bugfix Mode

Turn confirmed bugs into self-contained fix prompts for the product's coding agent. This QA task does not edit product code. A generated prompt is a work artifact, not evidence of a fix or permission to execute it.

## Resolve scope

Read the selected product's registration/pack and owner checkpoint before choosing a checkout, environment, tracker or workflow. The current directory alone is not the product. Reuse an existing workspace; do not require Linear or create another registration.

- Use the pack's tracker and current supported connector. For Nuanu Flow use its official plugin and work-items instructions; Linear remains valid when selected. If the connector is unavailable, use sufficient supplied issue snapshots for prompt preparation and identify any missing evidence.
- A prepare-only request writes no tracker states, comments or product files. Available tools are capabilities, not write authorization.
- If the request is actually deployed-fix verification, hand off to the current product QA specialist (Freeland: `freeland-release-qa`; registered Starter: `qa-product-v0`; otherwise `qa-check`). That evidence/workflow contract governs; do not continue an old global Done/Todo recipe.

## 1. Read the selected bugs

Use the pack's actual project, bug classification, states and pagination. Read issue descriptions, evidence and comments, or use the supplied snapshots. Confirm scope only when it remains ambiguous. Do not invent missing identifiers, credentials, reproduction steps or a confirmed status for an unverified report.

## 2. Cluster with a reason

One prompt should describe a coherent, reviewable change. Group a demonstrated shared cause; a common screen or subsystem is only a clue, not proof. Keep unrelated owners and materially different risks separate. Use available product-map dependencies to identify adjacent behavior that must remain correct, not to guess a root cause. Label hypotheses and unresolved business expectations.

## 3. Produce the fix prompt

Fill `references/fix-prompt.md`, starting with its **Resolved target** fields and including **Implementation handoff / QA acceptance**. Copy product, tracker/project, exact issue IDs and literal state names with their roles from the original pack/snapshot. Product and tracker are separate fields; each independent case gets its own target block.

For product identity, include the exact source clause/reference that establishes the product, then derive the product name from it. Resolve the checkout separately from a supplied registration locator. When no locator is supplied, mark checkout unresolved and give checkout-neutral implementation instructions pending that resolution; a tracker name or heading is not a checkout locator. Prompt preparation can still continue.

- Inline original preconditions, actions, expected/actual behavior, evidence references and observed environment/candidate. Separate the observed buggy candidate from the future fixed/deployed candidate.
- Define acceptance as observable original-scenario outcomes plus relevant adjacent regressions. Inspect existing fixture/assertions before using a regression as evidence.
- An unexpected `test.fail()` PASS is an investigation signal, not proof of a fix. Never make that signal the sole acceptance criterion or weaken assertions to obtain green.
- Preserve the distinction between developer completion and QA acceptance. The coding agent returns implementation evidence and unresolved checks; it does not promote a ticket into a QA-qualified state just because code/tests are ready.
- Name an implementation handoff state only if the pack defines its role and the executor has authority. If only a QA-qualified state such as `Ready for prod` is known, leave the implementation state unspecified and return evidence to QA.
- Recommendations use tools actually available to the executor: source inspection, focused tests, browser reproduction and independent review when supported. No mandatory tool or approval is invented.

## 4. Deliver

Before delivery, compare every target ID, product, environment and state name used in the prompt against the original pack/snapshot, not just against your generated header. Keep literal state names rather than substituting synonyms. Correct mismatches; if the source cannot resolve a target, deliver a clearly unresolved draft without a transition instruction for it.

Return the prompts, ordered by the product's risk/severity contract, with clustering rationale and missing information. A blocked issue does not prevent preparation for independent well-understood issues.

Only if requested and authorized, attach a prompt to the exact issue using the selected connector; read back the saved content. On an unknown write outcome reconcile before retrying. A prepare-only artifact does not grant its future executor additional tracker or financial authority.

## 5. Deployed fix verification

Use the selected QA workflow to check the actual original scenario on the current candidate. Inspect assertions, fixture, environment and fresh evidence; a green smoke or unexpected PASS alone cannot qualify the fix.

Only accepted deployed evidence and the pack's transition authority justify a QA state change. Read back persisted state. Still-broken, partial or unassessed cases remain explicit; do not silently narrow the original requirement, close the issue, or rewrite evidence to make it pass.
