# Source skills and host routing

These are links to **complete delivered directories**, not partial copies or installed skills. Restore first. Read each SKILL.md in full and its required references before acting. No installation is performed by this repository's bootstrap.

For first use, start with [the portable setup](../docs/getting-started.md). A new user's product analysis is not a continuation of a historical owner's campaign: `qa-product-v0` can analyze before registration, and `qa-init` is selected only when a new managed workspace, registration recovery or a separately authorized I2 review is actually required. After successful registration and typed readback, return to `qa-product-v0`; I2 is not a universal post-registration prerequisite.

| Request | Source instruction |
| --- | --- |
| General product/release/ticket QA before a specialist is selected | [qa-check](qa-check/SKILL.md) — root-owned routing only; not another runner |
| Open bugs / evidenced cause clusters / developer fix prompts | [qa-bugfix](qa-bugfix/SKILL.md) — complete root-owned bundle, product-selected tracker; preparing a prompt is not QA acceptance |
| Actual setup/registration, registration recovery, separate I2 first-evidence review | [qa-init](../components/console/skills/qa-init/SKILL.md) |
| Unfamiliar product analysis, existing Starter pack, declarative/authored checks, agent-led browser work, human help | [qa-product-v0](../components/console/skills/qa-product-v0/SKILL.md) |
| Product-specific test design, clarification or delegated investigation | [product-analysis reference](../components/console/skills/qa-product-v0/references/product-analysis.md) |
| Starter plan/oracle/managed knowledge operations | [declarative-campaign reference](../components/console/skills/qa-product-v0/references/declarative-campaign.md) |
| Agent tools and observation-storage limitations | [agent-observations reference](../components/console/skills/qa-product-v0/references/agent-observations.md) |
| Read an interrupted run; bounded continuation with original surviving owner | [continuation protocol and qualification](../docs/qualification/campaign-continuation-20260914.md) — source-selected v1 only; not host restart, browser or payment replay |
| Freeland full/smoke, QA column/current cycle, one ticket or product area | [freeland-release-qa](../components/freeland/skills/freeland-release-qa/SKILL.md) |

Console also preserves its original `.claude/skills/` compatibility sources. Root CLAUDE.md deliberately routes to the same full source instructions used by Codex. Host-level support skills (e2e-testing, browser-qa, verification/debugging, Nuanu Flow work-items/human-input) are not bundled. When a selected lane requires one, discover its availability and read its current instructions; do not silently install it.

Those host skills are capability-specific enhancements, not mandatory packages for generic product analysis. A selected lane may still require a real capability—for example, authenticated Nuanu Flow access before reading or publishing there. If the host has no asynchronous human-input tool, ordinary dialogue is a valid way to request nonblocking help while independent authorized work continues.

Current sources are selected in the manifest and [current checkpoint](../docs/qualification/current.md). The accepted Kernel/Console pair now supports `recordAgentToolObservation`, `readAgentToolObservation` and `readTargetObservationReport`, exposed by Console's existing `qa-campaign` CLI as `record-observation`, `read-observation` and `observations`. See [exact qualification and remaining consumer gate](../docs/qualification/agent-observations-20260920.md). This is a bounded text/JSON channel with `attachments: []`, exact published check/target/oracle bindings and `agent_authored_unattested` provenance, not arbitrary screenshot ingestion or a managed PASS. A matching record does not promote coverage or release verdicts. Existing frozen runtimes may lack this channel: preserve their owner and report the storage limitation rather than switching sources or activating the historical reporting sibling.

The separate `record-review`/`read-review` commands interpret an already-saved campaign artifact; they do not replace the new-observation channel. [Earlier analysis evaluation](../docs/qualification/product-analysis.md) and [material expectation grounding](../docs/qualification/product-oracle-grounding.md) retain their original scope. Source parity is not installed-host, live-product or general oracle-reliability proof.
