# Source skills and host routing

These are links to **complete delivered directories**, not partial copies or installed skills. Restore first. Read each SKILL.md in full and its required references before acting. No installation is performed by this repository's bootstrap.

| Request | Source instruction |
| --- | --- |
| New product, registration recovery, separate I2 first-evidence review | [qa-init](../components/console/skills/qa-init/SKILL.md) |
| Existing Starter product pack, declarative/authored checks, agent-led browser work, human help | [qa-product-v0](../components/console/skills/qa-product-v0/SKILL.md) |
| Starter plan/oracle/managed knowledge operations | [declarative-campaign reference](../components/console/skills/qa-product-v0/references/declarative-campaign.md) |
| Agent tools and observation-storage limitations | [agent-observations reference](../components/console/skills/qa-product-v0/references/agent-observations.md) |
| Freeland full/smoke, QA column/current cycle, one ticket or product area | [freeland-release-qa](../components/freeland/skills/freeland-release-qa/SKILL.md) |

Console also preserves its original `.claude/skills/` compatibility sources. Root CLAUDE.md deliberately routes to the same full source instructions used by Codex. Host-level support skills (e2e-testing, browser-qa, verification/debugging, Nuanu Flow work-items/human-input) are external prerequisites: discover their availability and read current instructions; do not claim they were bundled or silently install them.

Known boundary: active Kernel393 does not export `recordAgentToolObservation` / `readAgentToolObservation`. Agent observations can still help investigation, but are labelled local/unsealed with a storage blocker; they cannot qualify a release. The preserved reporting sibling is not activated to bypass this limitation.
