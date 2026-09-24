# H1/H2 held-out account-discovery comparison — independent AQA

24 September 2026. **Candidate adoption: NO-GO.** This is one final,
source-selected, open-context comparison under the frozen [cases](../account-discovery-heldout-cases.md)
and [rubric](../account-discovery-heldout-rubric.md), not an installed-skill,
live-account, campaign or product acceptance. The earlier [D1/D2 result](discovery-aqa-review.md)
remains unchanged: D2 was inadequate in both arms. No third tuned arm follows
from these answers.

The independent Astra Lead AQA review graded the first unaided [H1-A](heldout-h1-arm-a-first-answer.md),
[H1-B](heldout-h1-arm-b-first-answer.md), [H2-A](heldout-h2-arm-a-first-answer.md)
and [H2-B](heldout-h2-arm-b-first-answer.md) texts. Critical 0, Important 2,
Minor 1. A separate read-only provenance/link audit found that all cited local
files and numeric line anchors exist and support their neighboring assertions;
both normal-clone root and shared Freeland pins matched the frozen packet.

## Frozen inputs and execution boundary

| Input | Exact identity |
| --- | --- |
| A root | `8f40e6eb98abbea8d11cad01f13482c6ec91c02f` |
| B root | `ee04085c2c400bf3809b657f64be7f33a6df311c` |
| Shared Freeland source | `0ea2df10f1b6d613e01d50011c269ca0fa999877` |
| Case packet | `4621208225a70941b0be03d29d7f3fbcbc0daa379dba440b63d417864541abbf` SHA-256 |
| Rubric | `fc9151b73b7df9913133cf452798d63285e833996b53e4e857aa38f8b8db842c` SHA-256 |
| First-answer commit | `92e82edf27f7805a9512cd2c3f63c446d158348d`; four answers committed before post-actor AQA |

Four fresh actor contexts used two arm-specific normal local clones, because the intentional
`GIT_STORAGE` integrity guard rejects the `.git` pointer in linked worktrees
for source restoration. Both clones restored and verified the same manifest
sources, and their root `npm test` runs were observed at 61/61 each. These are
source/packaging observations, not product tests. The linked-worktree attempt
made no restored-source changes and did not relax the guard.

Native Codex actor logs were discovered **after** the first-answer files were
committed. Thus those files' metadata about unavailable logs describes capture
time, not the final audit state. The complete local actor-turn logs verify each
committed first reply exactly after outer-whitespace trimming; there was one
final reply per actor and no intervening corrective agent message. Their
`turn_context` records all four as `gpt-6-sol`/medium. Logged tool calls are
local source inspection (plus root `sources:verify` in H1-A); no product,
provider, browser, account or tracker action appears in those actor turns.
The raw logs remain private local session files, not committed QA artifacts:

| Actor | Local session basename | SHA-256 |
| --- | --- | --- |
| H1-A | `rollout-2026-09-24T17-58-41-01a0d2da-5b9c-73c0-b743-5c8b846a4008.jsonl` | `47dae629eb2e1cd9554e368cacc2726a40e1aaa213388bd9d136b85cb9cb0408` |
| H1-B | `rollout-2026-09-24T17-58-50-01a0d2da-82b8-7841-9109-2b83f073dfd5.jsonl` | `51aa46b970f1b90b8cbb8dec7ec96a212927534ddd98d8b17dd2b916de6a4162` |
| H2-A | `rollout-2026-09-24T18-00-30-01a0d2dc-07ae-7c32-ac55-7114eab178fb.jsonl` | `069590c350671c08ff3b2d135f696a3a57a2e82c7f074dad5bba8f3daefbc73d` |
| H2-B | `rollout-2026-09-24T18-00-41-01a0d2dc-3181-76a2-b474-75f7585bcca7.jsonl` | `2f87f62055357843013ae8e5963b340a20c936449fa16dfb1d3cd33e7332a6c0` |

The native `NEW_TASK` dispatch bodies are encrypted in these actor logs. Their
common plaintext user-context scaffold matches, but does not contain the H1/H2
request. The controller reports matching case prompts apart from clone paths;
**exact dispatch-byte equivalence cannot be independently verified** from
retained local logs. Ordinary repository access was not isolated from the
rubric or previous answers: this is open-context, not blind. H1's request
itself supplies lifecycle cautions; repeating those cautions is not proof of
unprompted cold discovery.

## First-answer semantic review

| Case | A | B | Decisive comparison |
| --- | --- | --- | --- |
| H1 — signup lifecycle | **Adequate** | **Adequate** | Both separate the controlled, disposable Mail.tm/Freeland-user path from the private fresh-accounts helper; DELETE 204 covers only the inbox, not the product user. Both retain `SHADOW_PASS`, product-user retirement/cardinality debt, owner authority and no retained-account promise. This is parity. |
| H2 — pool restoration | **Inadequate** | **Adequate** | Both reject declarative `mint_fresh` as callable and identify status-only CLI, unknown readiness and private readback. A says status “входит в аккаунты” but never establishes **all configured roles** or absence of a role selector for an A1-specific request. B says “под всеми настроенными ролями” and asks authority for the entire login/readback scope. |

The H2 scope is material, not a keyword requirement. The [CLI](</Users/danilsolomin/projectsnew/qa-agent/.local/i06a-heldout-cold-b/components/freeland/tools/freeland-pool/cli.mjs:23>)
accepts `status` but no `restore`/role selection. The [readback loop](</Users/danilsolomin/projectsnew/qa-agent/.local/i06a-heldout-cold-b/components/freeland/tools/freeland-pool/readback.mjs:174>)
iterates configured `POOL_ROLES`, and the same file implements authenticated
requests and private persistence. For H1, [Mail.tm disposal](</Users/danilsolomin/projectsnew/qa-agent/.local/i06a-heldout-cold-b/components/freeland/tools/freeland-replacements/mail-tm.mjs:132>)
requires DELETE 204 for the provider account only; the [controlled test](</Users/danilsolomin/projectsnew/qa-agent/.local/i06a-heldout-cold-b/components/freeland/tests/freeland-controlled/tc-vhod-02.spec.ts:240>)
retains a unique non-reused product user, and the [oracle](</Users/danilsolomin/projectsnew/qa-agent/.local/i06a-heldout-cold-b/components/freeland/tools/freeland-replacements/tc-vhod-02-oracle.mjs:479>)
blocks promotion pending retirement/cardinality evidence. The separate
[fresh-accounts helper](</Users/danilsolomin/projectsnew/qa-agent/.local/i06a-heldout-cold-b/components/freeland/tests/freeland/fresh-accounts.spec.ts:21>)
does not implement comparable disposal or retained handoff.

Both arms' **answer text** preserves the owner, staging/source-only boundary,
no unproven readiness, no credential collection and no promised retained
lifecycle. Complete actor-turn logs support no executed external action in
this run. This is not an operational product-safety or readiness qualification.
B's H1 opening “подходит только” is a conservative overstatement: it supports
recommending this bounded path, not excluding every other possible one-time
test. AQA categorized this as Minor, without overturning H1 adequacy.

## Measured inspection, not an efficiency PASS

Native token usage below is cumulative turn usage, including repeated context;
cached input is a subset of input. Each tool call is one `exec` wrapper with
one `exec_command`, not two separately counted actions. Monetary cost is
unavailable, not zero.

| Actor | Duration | Tool calls | Input tokens | Cached input | Output tokens | Total tokens |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| H1-A | 77.986 s | 13 | 944,891 | 854,912 | 3,603 | 948,494 |
| H1-B | 68.603 s | 16 | 887,688 | 832,896 | 2,817 | 890,505 |
| H2-A | 50.663 s | 9 | 493,285 | 445,952 | 1,925 | 495,210 |
| H2-B | 57.620 s | 9 | 452,604 | 410,368 | 2,277 | 454,881 |

The path denominator follows the frozen rubric: each content-bearing file
read or search-result path counts once per case; filename-only listings and
`wc` do not count; only the rubric's common bootstrap files are excluded.
Truncated output may hide middle paths, so the numbers are **visible,
retained-output counts**, not an invented complete hidden inventory. A
truncation-corrupted pseudo-path was rejected.

| Case | A inspected paths | B inspected paths | Difference |
| --- | ---: | ---: | ---: |
| H1 | 63 | 29 | −34 |
| H2 | 32 | 17 | −15 |
| **Sum** | **95** | **46** | **−49 / 51.58%** |

Although both per-case observed counts decrease, the predeclared efficiency
gate **cannot pass** because H2-A is semantically inadequate; H2-B also takes
longer than H2-A. Do not state a general speed, cost or inspection-efficiency
improvement. The inspected-path inventories are recorded below for audit.

<details><summary>H1-A — 63 paths</summary>

```text
F/README.md
F/apps/qa-console/src/lib/registration.ts
F/config/freeland/account-pool.v1.json
F/docs/local/freeland/AGENT-RUNBOOK.md
F/docs/local/freeland/CANONICAL-REPOSITORY.md
F/docs/local/freeland/COVERAGE-MAP.md
F/docs/local/freeland/FREELAND-U0.md
F/docs/local/freeland/FREELAND-U1.md
F/docs/local/freeland/MANUAL-TEST-CASES.md
F/docs/local/freeland/PRODUCT-BRIEF.md
F/docs/local/freeland/PRODUCT-MAP.md
F/docs/local/freeland/ZERO-TOUCH-OPERATIONS.md
F/docs/reviews/2026-09-02-S2-S3.md
F/playwright.freeland-controlled-email.config.ts
F/provenance/source-manifest.v1.json
F/skills/freeland-release-qa/SKILL.md
F/tests/freeland-controlled-password-recovery/tc-vhod-05.spec.ts
F/tests/freeland-controlled/tc-vhod-02.spec.ts
F/tests/freeland-replacements/mail-tm.test.mjs
F/tests/freeland-replacements/standing-authorization.test.mjs
F/tests/freeland-replacements/tc-vhod-02-oracle.test.mjs
F/tests/freeland-replacements/tc-vhod-02-policy.test.mjs
F/tests/freeland-replacements/tc-vhod-02-section-collector.test.mjs
F/tests/freeland-replacements/tc-vhod-05-authorization.test.mjs
F/tests/freeland-replacements/tc-vhod-05-evidence.test.mjs
F/tests/freeland-replacements/tc-vhod-05-harness.test.mjs
F/tests/freeland-replacements/tc-vhod-05-oracle.test.mjs
F/tests/freeland-replacements/tc-vhod-05-preflight.test.mjs
F/tests/freeland-replacements/tc-vhod-05-readback.test.mjs
F/tests/freeland-staging-replacements/pool.setup.ts
F/tests/freeland-staging-replacements/support/pool.ts
F/tests/freeland-verdict/freeland-campaign-cli.test.mjs
F/tests/freeland/access-control.spec.ts
F/tests/freeland/account-data.spec.ts
F/tests/freeland/api.spec.ts
F/tests/freeland/app.spec.ts
F/tests/freeland/auth-flows.spec.ts
F/tests/freeland/fresh-accounts.spec.ts
F/tests/freeland/i18n.spec.ts
F/tests/freeland/mail.spec.ts
F/tests/freeland/mobile-devices.spec.ts
F/tests/freeland/responsive.spec.ts
F/tests/freeland/route-readiness.ts
F/tests/freeland/sections.spec.ts
F/tests/freeland/seo.spec.ts
F/tests/freeland/web-frontend-audit.spec.ts
F/tools/freeland-graph/cli.mjs
F/tools/freeland-graph/standing-authorization.mjs
F/tools/freeland-pool/cli.mjs
F/tools/freeland-pool/pool-state.mjs
F/tools/freeland-replacements/issue-tc-vhod-05-authorization.mjs
F/tools/freeland-replacements/mail-tm.mjs
F/tools/freeland-replacements/run-tc-vhod-02-controlled-email.mjs
F/tools/freeland-replacements/tc-sec-01-observation.mjs
F/tools/freeland-replacements/tc-sec-01-oracle.mjs
F/tools/freeland-replacements/tc-vhod-02-oracle.mjs
F/tools/freeland-replacements/tc-vhod-02-policy.mjs
F/tools/freeland-replacements/tc-vhod-02-section-collector.mjs
F/tools/freeland-replacements/tc-vhod-05-authorization.mjs
F/tools/freeland-replacements/tc-vhod-05-oracle.mjs
F/tools/freeland-replacements/tc-vhod-05-policy.mjs
F/tools/freeland-replacements/tc-vhod-05-readback.mjs
F/tools/freeland-verdict/campaign-cli.mjs
```

</details>

<details><summary>H1-B — 29 paths</summary>

```text
F/config/freeland/account-pool.v1.json
F/docs/local/freeland/AGENT-RUNBOOK.md
F/skills/freeland-release-qa/SKILL.md
F/tests/freeland-controlled-password-recovery/tc-vhod-05.spec.ts
F/tests/freeland-controlled/tc-vhod-02.spec.ts
F/tests/freeland-main/process-group.test.mjs
F/tests/freeland-main/provenance.test.mjs
F/tests/freeland-public/tc-vhod-09.spec.ts
F/tests/freeland-replacements/tc-vhod-02-action-link.test.mjs
F/tests/freeland-replacements/tc-vhod-02-harness.test.mjs
F/tests/freeland-replacements/tc-vhod-02-section-collector.test.mjs
F/tests/freeland-replacements/tc-vhod-05-harness.test.mjs
F/tests/freeland-verdict/freeland-campaign-cli.test.mjs
F/tests/freeland/fresh-accounts.spec.ts
F/tests/freeland/route-readiness.ts
F/tests/product-graph/freeland-agent-promotion.test.mjs
F/tests/product-graph/freeland-manual-replacements.test.mjs
F/tests/product-graph/freeland-receipt-resource-disposition.test.mjs
F/tools/freeland-pool/cli.mjs
F/tools/freeland-pool/readback.mjs
F/tools/freeland-replacements/mail-tm.mjs
F/tools/freeland-replacements/run-tc-vhod-02-controlled-email.mjs
F/tools/freeland-replacements/tc-vhod-02-capability-preload.cjs
F/tools/freeland-replacements/tc-vhod-02-oracle.mjs
F/tools/freeland-replacements/tc-vhod-02-policy.mjs
F/tools/freeland-replacements/tc-vhod-02-section-collector.mjs
F/tools/freeland-replacements/tc-vhod-05-action-link.mjs
F/tools/freeland-replacements/tc-vhod-05-policy.mjs
F/tools/freeland-replacements/tc-vhod-05-readback.mjs
```

</details>

<details><summary>H2-A — 32 paths</summary>

```text
F/AGENTS.md
F/config/freeland/account-pool.v1.json
F/docs/local/freeland/AGENT-RUNBOOK.md
F/docs/local/freeland/ZERO-TOUCH-OPERATIONS.md
F/skills/freeland-release-qa/SKILL.md
F/tests/freeland-controlled-password-recovery/tc-vhod-05.spec.ts
F/tests/freeland-main/cancellation-integration.test.mjs
F/tests/freeland-main/card-sbp-quote-contract.test.mjs
F/tests/freeland-main/cold-route-readiness.test.mjs
F/tests/freeland-main/commands.test.mjs
F/tests/freeland-main/provenance.test.mjs
F/tests/freeland-staging-replacements/support/session-surface.ts
F/tests/freeland-staging-replacements/tc-pay-19.spec.ts
F/tests/freeland-staging-replacements/tc-vpn-03.spec.ts
F/tools/freeland-pool/cli.mjs
F/tools/freeland-pool/pool-state.d.mts
F/tools/freeland-pool/pool-state.mjs
F/tools/freeland-pool/readback.mjs
docs/getting-started.md
docs/qualification/reviews/graph-consumer-packaging.tap
docs/reviews/2026-09-14-qatech-applicability.md
docs/reviews/2026-09-16-global-plan-reconciliation.md
docs/reviews/2026-09-23-global-plan-reconciliation.md
docs/roadmap/2026-09-06-master-plan.historical.md
docs/roadmap/2026-09-20-pre-entry.historical.md
docs/superpowers/plans/2026-09-07-independent-workspace-assembly.md
docs/superpowers/plans/2026-09-07-post-review-dialogue-qa-plan.md
docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.3accb18.snapshot.md
docs/superpowers/plans/2026-09-20-local-consolidation.md
docs/superpowers/plans/2026-09-23-w0-w1-outcome-completion-tasks.md
docs/superpowers/specs/2026-09-07-independent-workspace-design.md
docs/superpowers/specs/2026-09-14-read-only-campaign-continuation-design.md
```

</details>

<details><summary>H2-B — 17 paths</summary>

```text
F/README.md
F/config/freeland/account-pool.v1.json
F/docs/local/freeland/AGENT-RUNBOOK.md
F/docs/local/freeland/PRODUCT-BRIEF.md
F/docs/local/freeland/PRODUCT-MAP.md
F/docs/local/freeland/ZERO-TOUCH-OPERATIONS.md
F/package.json
F/skills/freeland-release-qa/SKILL.md
F/tools/freeland-pool/cli.mjs
F/tools/freeland-pool/readback.mjs
docs/qualification/capabilities.md
docs/qualification/current.20260920-pre-entry.historical.md
docs/qualification/evidence/git-preservation-20260921/p3-existing-baseline-map-20260921.md
docs/roadmap/README.md
docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.3accb18.snapshot.md
docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md
docs/superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md
```

</details>

`F/` means `components/freeland/` in the actor's selected clone. These lists
are audit denominators only: reading a file does not qualify its capability,
and graph-test filenames do not show that a graph was consumed as an oracle.

## Gate and next bounded step

The B answers meet the frozen **answer-text semantic threshold**: both H1 and
H2 are adequate, and B corrects A's material H2 omission without H1 loss.
This is bounded benefit in the preserved texts, not a verified causal result
of the two-file treatment: exact actor-task dispatch equality is unverified,
and the previous D2 failure remains. The efficiency gate is ineligible for
PASS because H2-A is inadequate; that does not undo B's H2 adequacy. Overall
the candidate is **not adopted**. I06a.2–.4 and the proposed
`qa-test-account` skill remain unaccepted; I06a.5 needs separate product-owned
retained-account lifecycle and action authority. Decide the experimental root
index/router disposition with Astra before changing active routing; proceed on
independent, already-authorized pre-cloud controls without pretending that
source GREEN is live PASS.
