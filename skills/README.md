# Source skills and host routing

These are links to **complete delivered directories**, not partial copies or installed skills. Restore first. Read each SKILL.md in full and its required references before acting. No installation is performed by this repository's bootstrap.

| Request | Source instruction |
| --- | --- |
| General product/release/ticket QA before a specialist is selected | [qa-check](qa-check/SKILL.md) — root-owned routing only; not another runner |
| Open bugs / evidenced cause clusters / developer fix prompts | [qa-bugfix](qa-bugfix/SKILL.md) — complete root-owned bundle, product-selected tracker; preparing a prompt is not QA acceptance |
| Actual setup/registration, registration recovery, separate I2 first-evidence review | [qa-init](../components/console/skills/qa-init/SKILL.md) |
| Unfamiliar product analysis, existing Starter pack, declarative/authored checks, agent-led browser work, human help | [qa-product-v0](../components/console/skills/qa-product-v0/SKILL.md) |
| Product-specific test design, clarification or delegated investigation | [product-analysis reference](../components/console/skills/qa-product-v0/references/product-analysis.md) |
| Starter plan/oracle/managed knowledge operations | [declarative-campaign reference](../components/console/skills/qa-product-v0/references/declarative-campaign.md) |
| Agent tools and observation-storage limitations | [agent-observations reference](../components/console/skills/qa-product-v0/references/agent-observations.md) |
| Freeland full/smoke, QA column/current cycle, one ticket or product area | [freeland-release-qa](../components/freeland/skills/freeland-release-qa/SKILL.md) |

Console also preserves its original `.claude/skills/` compatibility sources. Root CLAUDE.md deliberately routes to the same full source instructions used by Codex. Host-level support skills (e2e-testing, browser-qa, verification/debugging, Nuanu Flow work-items/human-input) are external prerequisites: discover their availability and read current instructions; do not claim they were bundled or silently install them.

Current sources are selected in the manifest and [current checkpoint](../docs/qualification/current.md). The existing campaign CLI can record/read a separately attributed agent review bound to saved evidence. This does not ingest arbitrary browser observations or promote verdicts/coverage. Kernel still does not export `recordAgentToolObservation` / `readAgentToolObservation`; unsupported browser evidence stays local/unsealed. The preserved reporting sibling is not activated to bypass this limitation. See the [earlier analysis evaluation](../docs/qualification/product-analysis.md) and [material expectation grounding](../docs/qualification/product-oracle-grounding.md). Source parity is not installed-host or general oracle-reliability proof.
