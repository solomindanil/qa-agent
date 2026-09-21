# Reviewed-cycle continuation checkpoint

2026-09-21. Owned loopback public household catalog only. This is an agent-authored checkpoint, not a sealed verdict or deployment attestation.

## Original immutable campaign and independent readbacks

- Selected clean Console `c421160a71c0679a357f29828029ec3550791d16` and Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`; no source change.
- `readLatestCampaignEvidence` returned current bound run `run-8faed1fa237a0a75-fd0ed7dc-d955-4ec8-9377-937292a081d7`, receipt digest `sha256:f6c1a34ff8dfa18bc929a742f90274fd4985beaf8c89c20a7f45616c5658884d`, plan digest `sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85`, binding digest `sha256:8faed1fa237a0a75301f1b962f70d22ae30cb943ceda24be93b67c233b6825d4`, verdict `INCONCLUSIVE`; 12 artifacts were validated by the reader against exact inventory, sizes, modes and hashes.
- Both attempts of the search check stopped at assertion 1 (expected 1 displayed item after AMM, actual 3); traces each retain 8/8 events. Fruit composition and clear were not run by that campaign.
- Both attempts of the public-surface check reached terminal assertion 8 (expected 0 displayed item for literal period under Tools, actual 1); traces each retain 24/24 events. The supported category and control assertions before it passed. Each attempt returned `oracle_failure`; each check remains `needs_review`, not a sealed product-fail dossier.
- Actual `read-review` for `sha256:10a2500fbcbf5d3d5f2036d57e25f4839682f2370063a1545eadad953efb675b` and `sha256:bc4abdb0725451a5dd1888b13f1789e517c7f7948d10a2d1dc3f81f917df4b2c` returned `currentBinding: current` against that same receipt. Both are bounded `product_issue` interpretations with `agent_authored_unattested` attribution and no verdict change. The former explicitly leaves the search suffix unexecuted; the latter leaves summary wording outside its scope.
- Original receipt, all 12 artifacts, both reviews, and managed graph/catalog/plan were not changed.

## Browser continuation: exact action and error log

Browser CUA in-app browser selection returned `Browser is not available: iab` before opening a tab; no product action occurred through it. Chrome CUA then opened a new session tab `14853873` at `http://127.0.0.1:53783/catalog`. The accessibility state confirmed that exact URL, Search, Category, summary and visible items. Actions were public, read-only selections/text entry; no login, staff route, write or external origin.

1. Initial rendered state: Category All, empty Search, complete summary `3 results`, displayed Apple, Pear, Hammer. This was used for summary semantics, not a rerun of the campaign.
2. Clicked Category and selected Tools: Category Tools, complete summary `1 results`, displayed Hammer. The count meaning agrees with the sole item; grammar was not part of the promised oracle.
3. Selected All to set up the unexecuted suffix: summary `3 results`, Apple, Pear, Hammer.
4. Set Search to `AMM` as setup (the initial AMM-only failure already had campaign evidence): value AMM, Category All, still `3 results`, Apple, Pear, Hammer.
5. Selected Fruit without clearing Search: value AMM and Category Fruit, but complete summary `2 results` and displayed Apple, Pear. Expected composed empty set was not achieved.
6. Cleared Search: Category Fruit persisted, Search empty, complete summary `2 results`, Apple and Pear visible, Hammer absent. Category retention and visible restoration were observed; removal of an *effective* text restriction was not demonstrated.
7. Set public absent probe `zzzz-unlisted` under Fruit: input value persisted, but `2 results`, Apple and Pear remained. Pressed Tab to commit/blur: unchanged.
8. Selected Tools with that probe: `1 results`, Hammer remained. Thus no empty displayed state was captured; zero-result summary behavior stays unassessed.
9. Rendered screenshots were inspected for the Fruit + absent probe and Tools + absent probe states. These are not attached to the storage channel; its contract requires `attachments: []`. No other CUA action error occurred.

Complete-meaning comparison: the three captured nonempty summaries convey counts 3, 2 and 1 respectively, agreeing with the complete displayed item sets in those states. This is not inferred from a generic keyword or first-number classifier. No claim is made that `1 results` is grammatically correct, nor that an empty summary was exercised.

## New immutable observation readbacks

The exact current publication authority was `sha256:54bbc74129669965d6f2eb980f70ba85f60af074da8174d82117cd43eb451a2c`; strategy digest `sha256:ea2154ddc60a9141688482f21770ced57d6f7e1464e86dd41bc601af90dd2555`. Each envelope was validated against the selected Kernel schemas and canonical payload hash/size before `record-observation`. Both writes and subsequent independent `read-observation` calls returned `currentBinding: current`, `agent_authored_unattested`, `result: partial`, `attachments: []`, exact current check-to-target and resolved-oracle bindings:

| Scope | Evidence ID | Payload bytes / digest | Stored manifest bytes / digest |
| --- | --- | --- | --- |
| Search composition and clear suffix; composition failed, clear category retention observed | `urn:qa:evidence:0ca722f42e32631bde627a6c` | `2000` / `sha256:cb8fd037be1b6132e2c0c7012ba0e546012e72a9c984d35be0cc25597fd56b14` | `2102` / `sha256:4ffcc669b7cbca0b905cbb18d201aa65e1ddd014b20af901f1fa5a4367a262de` |
| Summary semantics for three nonempty states; empty unassessed | `urn:qa:evidence:53f650203ee3acdbb054a860` | `1981` / `sha256:880b035abf7d34cfbfe564af9367ddc4582435a22fe6b9f8fca01f760674b12e` | `2108` / `sha256:6f894263b45f95ae8228b339b56d280993d57fc5e208468ed12025daba960655` |

Private input envelopes: `continuation-search-observation.json`, `continuation-summary-observation.json` in this exercise root. Stored artifacts and manifests are under the evidence-ID-derived paths `.qa-private/evidence/agent-tool-observations/<24-hex>/{artifact,manifest}.json` in the canonical workspace. Identity is caller-declared: observed origin is known, deployed build is unknown. Stored-byte integrity is verified; browser invocation and semantic judgment are not attested by the writer.

Final `observations` readback returned complete denominator **4 targets**, with 2 current partial records (search and summary), 2 `not_observed` rows (public surface and staff), no observation diagnostics, and **four retained `COVERAGE_GAP` strategy blockers**. Empty diagnostics do not mean zero blockers. The public surface has a separate immutable campaign review, not an agent observation. Staff inventory remains unassessed: no account, authenticated surface or authority was provided.

## Remaining scope and stop

The current managed campaign stays `INCONCLUSIVE`; the two product-behavior interpretations remain agent-authored and bounded. Search composition failed in a fresh public continuation. Search-clear retained Fruit and visible items, but an effective text-to-clear transition is unproven. Nonempty summary meanings agreed with displayed sets; the promised empty state could not be reached through the bounded no-match probe, so its summary remains unassessed. Staff remains an explicit access/authority gap. No new campaign, graph/source revision, tracker publication, mutation, login, install or external-origin request was made. Further acceptance requires a new candidate/fix or concrete staff access and scoped authority; do not rerun the completed campaign merely to reconstruct state.
