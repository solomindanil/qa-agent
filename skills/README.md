# Source skills and host routing

These are links to **complete delivered directories**, not partial copies or installed skills. Root qa-check request capture/read/report needs only Node >=22.12.0 and its own complete bundle, not component restoration or installation. Restore component source before using component instructions. Read each selected SKILL.md in full and its required references before acting. No installation is performed by this repository's bootstrap.

For first use, start with [the portable setup](../docs/getting-started.md). A new user's product analysis is not a continuation of a historical owner's campaign: `qa-product-v0` can analyze before registration, and `qa-init` is selected only when a new managed workspace, registration recovery or a separately authorized I2 review is actually required. After successful registration and typed readback, return to `qa-product-v0`; I2 is not a universal post-registration prerequisite.

| Request | Source instruction |
| --- | --- |
| Ordinary new or explicitly amended QA request; product/release/ticket QA before a specialist is selected | [qa-check](qa-check/SKILL.md) — bundled [request capture/report recipe](qa-check/references/request-intake.md), then root-owned routing; not another runner |
| Product test account, session or fixture needed for QA (not QA-workspace registration) | [qa-check](qa-check/SKILL.md) routes to the product specialist; use the existing-access map below for source discovery, not execution authority |
| Open bugs / evidenced cause clusters / developer fix prompts | [qa-bugfix](qa-bugfix/SKILL.md) — complete root-owned bundle, product-selected tracker; preparing a prompt is not QA acceptance |
| Actual setup/registration, registration recovery, separate I2 first-evidence review | [qa-init](../components/console/skills/qa-init/SKILL.md) |
| Unfamiliar product analysis, existing Starter pack, declarative/authored checks, agent-led browser work, human help | [qa-product-v0](../components/console/skills/qa-product-v0/SKILL.md) |
| Product-specific test design, clarification or delegated investigation | [product-analysis reference](../components/console/skills/qa-product-v0/references/product-analysis.md) |
| Starter plan/oracle/managed knowledge operations | [declarative-campaign reference](../components/console/skills/qa-product-v0/references/declarative-campaign.md) |
| Agent tools and observation-storage limitations | [agent-observations reference](../components/console/skills/qa-product-v0/references/agent-observations.md) |
| Read an interrupted run; bounded continuation with original surviving owner | [continuation protocol and qualification](../docs/qualification/campaign-continuation-20260914.md) — source-selected v1 only; not host restart, browser or payment replay |
| Freeland full/smoke, QA column/current cycle, one ticket or product area | [freeland-release-qa](../components/freeland/skills/freeland-release-qa/SKILL.md) |

Root qa-check's complete portable bundle includes both ordinary Node document
scripts and its request-intake reference. It preserves no-doc/full input in the
selected owner's existing private notes, validates readback and hands exact
request ID/revision/digest and report paths to the unchanged specialist. No
source installation, child runtime, managed registration or MCP is required for
capture/analysis. Source-selected, installed/copied and frozen-runtime identities
remain distinct; installed skills and existing campaigns are untouched.

The intake result is NOT_EVALUATED and caller-authored/unattested, with managed
binding not_owner_attested. A selected pilot retains full scope and unknowns;
source tests do not prove final QA, graph completeness, deployment or product
PASS. This is bounded B00 capture/report and partial I01, not B01/D01/E00/V01 or
N01/Q1 acceptance. Saved-JSON-only Markdown recovery is explicit render-report;
read never mutates or repairs documents.

## Existing product account access — source discovery only

Resolve the product's selected specialist, existing campaign owner, frozen runtime, environment/candidate and action-time authority before using any interface. The manifest-selected source below does not establish a live fixture or authorize an account action.

| Task and source route | Existing interface and effects | Result, readiness and disposition |
| --- | --- | --- |
| Freeland staging role pool; route through the current [freeland-release-qa](../components/freeland/skills/freeland-release-qa/SKILL.md) owner, using selected source only as an interface reference. | The [pool CLI](../components/freeland/tools/freeland-pool/cli.mjs) exposes `npm run qa:pool -- status` from the resolved owner checkout. It has **no role selector** and processes all configured roles. Its [readback](../components/freeland/tools/freeland-pool/readback.mjs) logs in through staging UI, makes authenticated product reads, then writes and reads back digest-sealed private `docs/local/freeland/product-graph/current/account-pool-readback.json`. It does not provision accounts. | Redacted role configuration, invariants and violations are a current readback only for the matched candidate. A suitable role, current staging identity, satisfied invariants and a working product read are needed; config, old status or login alone is not readiness. This is neither a retained session nor permission to use another role. |
| Freeland staging disposable email/signup; route through the same [freeland-release-qa](../components/freeland/skills/freeland-release-qa/SKILL.md) owner. | The selected package exposes `npm run test:staging:controlled-email` through its [controlled-email wrapper](../components/freeland/tools/freeland-replacements/run-tc-vhod-02-controlled-email.mjs), not a general account service. Subject to staging preflight, explicit creation gate and separately applicable authority, it can create/authenticate/poll/delete a Mail.tm inbox and submit/verify Freeland signup; it writes private test output. The separate [fresh-accounts.spec.ts](../components/freeland/tests/freeland/fresh-accounts.spec.ts) is a gated private test helper, not a callable retained-account service. | Under the [controlled-email oracle](../components/freeland/tools/freeland-replacements/tc-vhod-02-oracle.mjs), a clean valid observation yields `SHADOW_PASS`, violations yield `FAIL`, and `promotionEligible=false` in either result; product-user retirement and account-cardinality readback gaps remain. Mail.tm DELETE 204 proves inbox cleanup, **not** deletion of the Freeland user. Neither test supplies a retained fixture or future working product access; preserve unknown effects for reconciliation. |
| Retained access or another product without a selected account route. | **Unsupported until the selected product owner supplies its own callable interface and effect/authority contract.** Do not transplant Freeland mail, pool, credentials or session semantics. | A retained resume needs product/environment-bound stable ID, owner, role/state, expiry, resource ownership, effect/readback and retention/disposition, followed by a current working product read. Name the exact missing contract or help gap; continue independent authorized QA. |

Console also preserves its original `.claude/skills/` compatibility sources. Root CLAUDE.md deliberately routes to the same full source instructions used by Codex. Host-level support skills (e2e-testing, browser-qa, verification/debugging, Nuanu Flow work-items/human-input) are not bundled. When a selected lane requires one, discover its availability and read its current instructions; do not silently install it.

Those host skills are capability-specific enhancements, not mandatory packages for generic product analysis. A selected lane may still require a real capability—for example, authenticated Nuanu Flow access before reading or publishing there. If the host has no asynchronous human-input tool, ordinary dialogue is a valid way to request nonblocking help while independent authorized work continues.

Current sources are selected in the manifest and [current checkpoint](../docs/qualification/current.md). The accepted Kernel/Console pair now supports `recordAgentToolObservation`, `readAgentToolObservation` and `readTargetObservationReport`, exposed by Console's existing `qa-campaign` CLI as `record-observation`, `read-observation` and `observations`. See [exact qualification and remaining consumer gate](../docs/qualification/agent-observations-20260920.md). This is a bounded text/JSON channel with `attachments: []`, exact published check/target/oracle bindings and `agent_authored_unattested` provenance, not arbitrary screenshot ingestion or a managed PASS. A matching record does not promote coverage or release verdicts. Existing frozen runtimes may lack this channel: preserve their owner and report the storage limitation rather than switching sources or activating the historical reporting sibling.

The separate `record-review`/`read-review` commands interpret an already-saved campaign artifact; they do not replace the new-observation channel. [Earlier analysis evaluation](../docs/qualification/product-analysis.md) and [material expectation grounding](../docs/qualification/product-oracle-grounding.md) retain their original scope. Source parity is not installed-host, live-product or general oracle-reliability proof.
