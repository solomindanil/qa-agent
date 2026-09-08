# Product analysis and clarification — reviewed source integration

Date:2026-09-08. This is a bounded source/skill slice, not a product QA verdict or installed-host qualification.

## Exact source and behavior

Console `deb262c5e9701d9d216c28ca53521dafb9f94be8`, tree `c371a6dc74a4cef68a215b24acd6f97ec3b69375`, follows reviewed docs-only `d6963a8b75f98b04792ade52c0053a864effa8d5`. Since the prior candidate784eda0, only one fixture README and seven skill/reference files changed. Kernel authority, runtime, tests and dependency bytes are unchanged.

Existing `qa-product-v0` now covers unfamiliar-product analysis before check selection: sourced purpose/roles/states/journeys/dependencies, risk-based design, graph/catalog reconciliation and explicit coverage gaps. Material uncertainty produces a focused question with the choice to answer or delegate investigation. Available permitted sources may resolve it; an unresolved normative conflict stays open while independent work continues. `qa-init` reuses this analysis before registration, without a second registration path or expanded authority.

The Codex/Claude source bundles are byte-identical. The pre-existing Claude declarative-reference drift was repaired to the previously reviewed Codex bytes. This is source parity, not an actual Claude process test or global installation.

## Independent evidence and limits

Independent Lead AQA source review: **GO**, no Critical/Important/Minor source finding. Existing skill packaging tests passed2/2 on deb262c. A separate frozen offline semantic exercise retained16 replies:5initial baseline/5initial candidate, two alternate follow-ups for only the prospectively selected first sample of each arm, and one candidate-only held-out product with continuation.

Explicit investigation choice improved0/5→5/5; both arms already handled the predetermined follow-ups. Domain-specific design, useful independent progress and bounded evidence claims were retained, and the held-out workflow transferred. No false live/whole-product PASS, product-defect verdict, execution claim or authority expansion occurred in these16 replies. This small, non-blinded study is not a statistical reliability estimate.

**Semantic decision: GO WITH LIMITATIONS.** Unsupported proposed normative assertions remained in4/5 baseline and5/5 candidate initials, chiefly audit requirements; general oracle discipline did not improve. Review each proposed expectation against its real source before graph/catalog confirmation or a defect/acceptance verdict. Do not treat the new wording as proof that the agent never fabricates a requirement.

Official `quick_validate.py` could not start in the checked Python runtimes because PyYAML is absent. No dependency was installed and that validator is not PASS. Existing packaging/reference tests and independent source/frontmatter review have their narrower scopes.

Host-local source/evaluation delivery is retained in `/Users/danilsolomin/projectsnew/qa-agent/.local/qualification/product-analysis-20260908/`:34 files/160621bytes independently copied/read back, including all raw answers and frozen packets. Source review SHA256`3ade4ef5b268c7617665cf721be73abb6a07f33f466672997ad1b9840916d926`; semantic grade SHA256`951cedc5d79931f545143c7d4a8dc048ef2723ad883d34328500974b50bc55d7`. Those private packets/reports are not automatically embedded in the portable repository.

## Integration qualification

The new manifest uses a **complete-history** Console bundle, not the earlier incremental handoff bundle. Kernel/Freeland/reference bundles and exact commits remain unchanged. Root skill/product routing points to the complete delivered Console files. The previous root4533638 and accepted root48bccef are preserved.

Fresh isolated integration checks on these bundle/manifest/tool bytes: own `npm run sources:restore` and subsequent `npm run sources:verify` exited0; all four clean independent child stores restored with129 Kernel +169 Console +547 Freeland +134 reference =979 tracked entries checked by the existing verifier. Root `npm test` passed52/52 in31902.920625ms,0failed/skipped/cancelled/todo. The restored Console's existing skill packaging test passed2/2 in95.925667ms under Node22.23.1 (npm10.9.8 for root commands), without dependency installation. `git diff --check` passed. No earlier root52 or Console32 result is reattributed here.

Host-local logs: `/private/tmp/qa-analysis-integration.no7pqlcT/`. SHA256: root-tests.tap`3e260bafd379a219305b1b71e36d90feb527d25b6590aa02f17c9a804ba810dd`; skill-tests.tap`99954afea7649ff419ecfe63ef0ccc63b8c6d8b0a1a4da633ed02f830615b678`; verify.log`79f3ca57fd65954d40c786c401ee0d31af1fcf7f2c62ae67197a95c69da7e59e`. Initial restore output/exit were read directly from the tool result; no separate raw restore log is claimed for this pre-commit run. Independent integration review and exact committed cold receiver remain separate gates, recorded in the final private delivery report.

No dependencies, browser sessions, managed registrations, current graphs, secrets or owner permissions are transferred. Source restore continues to refuse conflicting/dirty components. Product execution, accepted-root promotion, installed-skill update, remote push and cloud setup are outside this integration slice.
