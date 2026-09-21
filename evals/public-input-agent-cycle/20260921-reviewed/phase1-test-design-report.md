# Phase 1 test design — public household catalog

Status: **PROPOSED / NOT PUBLISHED / NOT EXECUTED**. Independent Lead AQA byte review is the next gate.

## Authority and identity

- Task authority: owned loopback, public read-only UI discovery and proposal authoring only.
- Target: `http://127.0.0.1:53783/catalog`; registered base URL: `http://127.0.0.1:53783/`.
- Existing owner workspace: `/private/var/folders/wb/zqtxc1qs7sqgspnt3vwlmr640000gn/T/qa-public-agent-F78BwN/nuanu-readonly-qa`.
- Selected source only: Console `c421160a71c0679a357f29828029ec3550791d16` and Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`. `npm run sources:verify` passed for the source root. The inactive reporting reference was not used.
- Registration state observed before design: `BASELINE_APPROVAL_REQUIRED`, next action `REVIEW_BASELINE`, graph digest `sha256:cbf04ecf9739d64381a3610e6abb6f633a616f3c771c54177c5869d71569842c`, catalog digest `sha256:76ba9629d74e93c44d8cc31b6fee027d702900c98873c807e989d29fb8f24e03`. No canonical `tests/qa-campaign.v0.json` existed.
- Deployment/candidate SHA is unknown. Source HEADs identify the QA tools, not the product build.

## Sources and product model

Normative source: `/private/var/folders/wb/zqtxc1qs7sqgspnt3vwlmr640000gn/T/qa-public-agent-F78BwN/product-brief.md`.

The public visitor can find household items by literal, case-insensitive name substring and category. Category and search compose. Clearing search removes the text restriction only. Empty results are valid, and the result summary must agree with displayed items. No sorting order is promised. Inventory management is a separate staff-role journey with no account or authenticated surface supplied.

Rendered discovery on 2026-09-21 grounded only examples and locators, not extra business rules:

- heading `Catalog`;
- Search label and DOM id `query`;
- Category label and DOM id `category`, values `all`, `fruit`, `tools`;
- `data-testid=item` and `data-testid=summary`;
- visible witnesses Apple, Pear, Hammer; Fruit showed Apple/Pear and Tools showed Hammer;
- current summary rendering used `3 results`, `2 results`, etc.; no console errors were observed.

## Proposed denominator and checks

All four original registered coverage targets remain accounted for: **3 proposed executable, 1 blocked, 0 omitted**.

1. `Find matching public items` — one same-session compound check. `HAM` must match Hammer case-insensitively; Fruit must compose with that search to an empty result; clearing Search must retain Fruit and restore Apple/Pear while excluding Hammer; summary/item agreement is asserted at every meaningful boundary. This preserves each clause instead of replacing the journey with a generic page check.
2. `Read the result summary` — an absent literal probe must display zero items and a zero numeric summary. This independently covers the supported empty outcome and summary agreement.
3. `Public item catalog` — Search and Category remain visible; selecting Tools displays only Hammer, excludes Fruit witnesses, and reports one displayed result; desktop horizontal overflow and console errors are also checked.
4. `Manage inventory as staff` — **BLOCKED/UNASSESSED**. Recovery requires a separately authorized staff test surface and test identity. No public control is treated as inventory-write capability.

Exact proposal: `phase1-proposed-qa-campaign.v0.json`.

The current visible `N result(s)` copy is an operational witness for numeric agreement, not a new product promise. The semantic expectations do not require a separate no-results message or other wording. No sorting assertion is present. The two one-second absence windows are predeclared only to make zero-item/excluded-item observations meaningful; they are not to be tuned after a failure.

## Publication and execution design

`phase1-publication-and-execution.mts` uses the accepted APIs and existing Console CLI only:

- it retains the registered profile, discovery, all prior coverage targets and the unsupported staff gap;
- it proposes resolved catalog expectations and check-to-target graph bindings for the three public checks;
- default `preview` is read-only and checks exact source pins, plan schema, plan/catalog expectation equality, and the Kernel publication preview;
- `publish` requires the independently reviewed plan and preview digests, then uses `applyRegistrationPublication`, `writeNewCampaignPlan`, and `validateWorkspace`;
- `execute` rechecks the exact current plan digest, prints base URL/check/blocker counts, invokes the existing CLI `validate`, then invokes the existing CLI `run`;
- no custom runner, semantic classifier, tracker operation, credentials, new registration, external origin, or side-effect override is introduced.

The Kernel transition requires all four old generic discovery blockers to remain byte-identical in the proposed strategy, even though three oracles become resolved. The staff target stays unresolved and blocked. This retained generic-blocker mismatch is explicit for reviewer judgment; it is not hidden or hand-edited away.

## Discovery diagnostics and limitations

- Setting non-empty Search values through both AX input and the managed browser's Playwright `fill` changed the visible value but did **not** change the list or summary; for example, `HAM` still showed three items and `3 results`. Category selection did update the list. This is a fresh discovery diagnostic, not a sealed campaign result: it may be a product regression or an interaction/event mismatch and must be classified from the later approved runner evidence.
- A managed-browser label locator timed out while reading Category option values. The bounded recovery used the freshly rendered id `#category` and returned `all`, `fruit`, `tools`.
- Managed-browser `fill("")` returned without clearing the visible value. AX `setValue("")` successfully restored the field. The campaign proposal nevertheless uses Console's supported literal empty `fill`; the approved run must determine the runner behavior rather than inheriting this CUA quirk.
- Broad responsive, accessibility, performance, security and reliability claims remain unassessed. Visible labels and one 1280×720 overflow check do not establish WCAG or whole-product quality.
- The exact current inventory is a controlled rendered witness, not a promise of sorting or a general immutable production inventory.
- No screenshot is stored as campaign evidence in Phase 1; browser inspection is caller-observed design input only.

## Next action

Independent Lead AQA reviews the exact proposal bytes and digests. If APPROVED without changes, continue in this same context: run script `preview`, read the exact changes and digest, use `publish` with reviewed digests, validate/read back the managed publication and plan, then present the current plan digest/base URL/3 executable/1 blocker immediately before the separately gated read-only campaign run. Any requested byte change invalidates prior digests and requires a fresh review.
