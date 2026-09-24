# W7 declared capability-family inventory — 24 September 2026

Status: **source-only first inventory for independent AQA review**, not an
accepted routing change, installed-skill qualification, or W7 exit. The entry
source is root `b30f58be33f8700ed8fb14a3a80b0f358dab3b1b` on
`codex/p2-semantic-source-delivery`. The [manifest](../../sources/manifest.v1.json)
selects Kernel `a0a20e65`, Console `f75d9630`, Freeland `0ea2df10` and the
inactive reporting reference `10d398d`; an existing campaign can retain older
runtime bytes. This audit made no product or host-skill change.

## Boundary and counting rule

The [active W7 requirement](../superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md) asks for one index of public, repeatable user-facing QA outcomes, including
useful read/status operations. Count an independently requested outcome once;
put its CLI commands, typed APIs, product variants and read/write phases under
that family. The generic [`qa-check`](../../skills/qa-check/SKILL.md) is a
selection entry, not another runner or an additional execution family.
`qa-product-v0` and `freeland-release-qa` span several outcomes rather than
being one capability apiece. A source-present interface with no discoverable
recipe remains in the denominator as **unmapped**; an unsupported desired
variant is an explicit gap, not an executable capability. Internal helpers,
packaging prerequisites and quarantined operations have their own section.

This is a declared inventory of the root, selected Console and selected
Freeland sources, **not an exhaustive capability proof**. The twelve rows below
are candidate family groupings awaiting reconciliation against public
interfaces and independent AQA. No `12/12` documentation or qualification
percentage is claimed.

## Candidate user-outcome families

| Requested outcome | Current source route and callable boundary | Effects, result and known discovery limit |
| --- | --- | --- |
| Analyze an unfamiliar product and design checks | Console [`qa-product-v0`](../../components/console/skills/qa-product-v0/SKILL.md) → [product analysis](../../components/console/skills/qa-product-v0/references/product-analysis.md); may precede workspace registration. | Sourced purpose, roles, journeys, risks, expectations and open questions; proposed checks are not execution. Selected source exists; the complete installed Console bundle has reference drift. |
| Register or recover a QA workspace | Console [`qa-init`](../../components/console/skills/qa-init/SKILL.md): exact intake dry run/submit, read-only session reconnect, separately authorized blocked resume and I2 approval/execution. The raw Kernel `qa-starter init` CLI is source-present but not an equivalent promoted registration recipe. | Registration persists a workspace and typed receipt; `registered` ends at `BASELINE_APPROVAL_REQUIRED`/`NOT_EVALUATED`, not product access or QA PASS. I2 execution needs its own digest-bound approval and may read the product. Current `qa-init` installed bundle matched source in the dated [byte audit](i04-installed-skill-delta-20260924.md); host behavior was not tested. |
| Inspect an existing workspace and its evidence | Console [bridge read endpoints](../../components/console/README.md#bridge-endpoints-dev-and-standalone), selected workspace and campaign reader; Kernel `readTargetObservationReport` is a source-present target-scope report. | Workspace/graph/coverage/file previews, receipts and observation diagnostics are reads of the selected local owner; a graph link or unattested observation is not an executed/qualified check. The root [index](../../skills/README.md) does not separately name the general inspect/status path. |
| Validate and maintain workspace integrity | Console [bridge validate/regenerate/recover/adopt routes](../../components/console/README.md#bridge-endpoints-dev-and-standalone) under its owner and exact Kernel pin; raw Kernel `qa-starter validate`, `regenerate` and `ownership adopt` are source-present CLI routes. | Console `validate` writes a local command receipt, so it is not a pure read. Regeneration, recovery and ownership adoption change local managed state. Their existence is not permission to repair a user's workspace; the root index has no explicit task recipe for this family. |
| Maintain QA knowledge, plan and oracle | Console [declarative recipe](../../components/console/skills/qa-product-v0/references/declarative-campaign.md): current graph/catalog read, reviewed Kernel revision/preview/apply, authored plan write/CAS, `qa-campaign prepare`, optional baseline, oracle preview/approval, `validate`. Freeland [graph and dry-run plan](../../components/freeland/skills/freeland-release-qa/SKILL.md) and replacement-corpus qualification are product-specific variants. | Knowledge publication, oracle approval and Freeland replacement promotion with `--write` are mutations with separate authority; approval is not execution permission. A valid plan retains blocked/unassessed targets. Console and Freeland installed bundles have dated drift, and their runners are not interchangeable. |
| Execute bounded QA and read a disposition | Console [public declarative campaign](../../components/console/skills/qa-product-v0/references/declarative-campaign.md) or separately authorized [agent-led tool lane](../../components/console/skills/qa-product-v0/SKILL.md); approved Kernel/Console I2 discovery-read is a bounded registration subroute; Freeland [full/smoke/area campaign and sealed verdict](../../components/freeland/skills/freeland-release-qa/SKILL.md). | Source self-tests, I2 receipts, campaign receipts, agent observations and live-product acceptance are different claims. Starter declarative checks are public read-only; Freeland has its own staging gates. Preserve failed, blocked and unassessed scope. Installed and live qualifications remain separate. |
| Recover progress and continue only pending work | Console `qa-campaign status --workspace … --run-id …` reads **ordinary v0** evidence as well as v1 continuation; `resume` requires the [surviving inherited host](../../components/console/scripts/qa-campaign.ts) and rejects browser/dependency replay. Starter [human-help/checkpoint route](../../components/console/skills/qa-product-v0/SKILL.md) is a separate variant. | A status read does not resume execution. The root [index](../../skills/README.md) currently advertises only the interrupted-run/v1 case; it omits ordinary exact-run status. Unknown effects and changed identity require reconciliation, never automatic replay. |
| Preserve and retrieve observations and interpretations | Console [agent-observations reference](../../components/console/skills/qa-product-v0/references/agent-observations.md): `record-observation`/`read-observation`/`observations` for a new bounded text/JSON observation; `record-review`/`read-review` for interpretation of an existing artifact. | Both store local evidence; neither seals an agent-authored PASS or alters a campaign verdict. The two subroutes are not substitutes, and installed Console references differ from selected source. |
| Inspect account/fixture readiness or run an authorized access check | Freeland [role-pool](../../components/freeland/tools/freeland-pool/cli.mjs) `qa:pool -- status`, [controlled-email signup](../../components/freeland/tools/freeland-replacements/run-tc-vhod-02-controlled-email.mjs), and separately authorized [controlled recovery](../../components/freeland/tools/freeland-replacements/run-tc-vhod-05-controlled-recovery.mjs). | Pool status logs in across **all configured roles**, reads the staging product and writes private readback; controlled email creates/deletes an inbox and can create a Freeland user but yields only shadow/non-promotion evidence. Recovery may create a test account, request reset and change its password; even successful collection ends `NEEDS_AGENT_REVIEW`, not PASS. The root [account map](../../skills/README.md) lacks recovery. No generic retained-account service is supported. I06a index/router remains experimental and current `qa-check` installed bytes differ. |
| Assess a ticket and verify a deployed fix | Freeland [QA column/current sprint/exact ticket](../../components/freeland/skills/freeland-release-qa/SKILL.md) uses official tracker reads, candidate binding and original-path reproduction; another product uses its selected specialist/tracker. | A read-only inventory is not FIXED; exact-ticket acceptance needs current product evidence. Current Freeland source has an exact-ticket reference absent from installed bundles. Tracker writes require separate action-time authority and readback. |
| Prepare a developer handoff | Root [`qa-bugfix`](../../skills/qa-bugfix/SKILL.md) clusters evidenced causes and fills its fix-prompt reference for the product-selected tracker. | Prepare-only creates a local prompt, not product code, tracker mutation or QA acceptance. Optional authorized attachment has its own exact-issue readback. Its complete root bundle matched installed bytes in the dated [audit](i04-installed-skill-delta-20260924.md), not a fresh trigger test. |
| Record findings and deliver authorized evidence | Console [owned findings ledger](../../components/console/README.md#bridge-endpoints-dev-and-standalone) and [specialist dossier publication](../../components/console/skills/qa-product-v0/SKILL.md); Freeland [`qa:publish`](../../components/freeland/tools/freeland-main/publish.mjs) stages a local outbox entry. | Local record, queued outbox and external tracker delivery are separate effects. Nuanu Flow create/upload/state change needs exact-batch authority, dedupe and persisted issue/attachment readback. Freeland `--deliver` only queues for an interactive agent; it performs no network delivery. |

The matrix is a family census candidate, **not** a claim that every row has a
complete root recipe. In particular, the ordinary campaign-status read, Console
integrity operations and Freeland controlled recovery are source-present but
under-described by the current entry index. Those are concrete next AQA
consumer questions; adding graph nodes alone would not repair their effect or
readiness semantics.

## Outside the active QA denominator

- Root `sources:restore`/`sources:verify`, Freeland `qa:install`, local builds
  and test suites are delivery/operator prerequisites or harness verification,
  not product QA outcomes. An install requires separate scope; none was run.
- Freeland [`qa:watch`](../../components/freeland/tools/freeland-main/watch.mjs)
  is source-present but explicitly quarantined before external action because
  parent-to-child admission handoff is undesigned. Do not count it as an active
  autonomous QA capability or quietly omit its operational risk.
- Inactive reporting reference, archived graph donors and experimental
  Android/Jev/cloud lanes are not selected, installed or qualified by this
  inventory. A Console UI fixture or an external-graph visualization is not a
  new managed product capability.
- Generic retained product-account provisioning, arbitrary host-restart
  campaign replay and cross-product credentials are unsupported requests or
  unqualified variants. Keep their desired outcome visible without inventing
  an interface.

## Pinned public-interface reconciliation

A separate read-only pass over the root and all three manifest-selected active
components found **no justified thirteenth user-outcome family**. This is a
source-interface mapping within those pins, not proof of complete fresh-dialogue
discovery, current installed behavior, or a supported recipe for every exposed
API. It makes these distinctions explicit for the next index consumer:

- Kernel exports a local `qa-starter` binary with raw `init`, `validate`,
  `regenerate` preview/apply/recover and `ownership adopt` commands
  ([CLI](../../components/kernel/src/cli.ts)). The raw I0 `init` and Console's
  durable [`qa-init`](../../components/console/skills/qa-init/SKILL.md) are not
  interchangeable registrations. The CLI is source-present; its direct route
  is not promoted by the current root index as a second onboarding recipe.
- Kernel's [`readTargetObservationReport`](../../components/kernel/src/kernel/target-observation-report.ts)
  projects the complete current target denominator, observations and
  diagnostics. It belongs to inspection/observation retrieval, not coverage
  earned by an agent-authored record. Console's workspace, preview and
  screenshot reads are separate local inspection routes
  ([bridge](../../components/console/server/bridge.mjs)).
- Console's bridge `validate` writes a local command receipt. Its
  regenerate/recover/adopt routes can change managed state, whereas ordinary
  `qa-campaign status --run-id` reads v0 or v1 evidence without resuming it
  ([bridge](../../components/console/server/bridge.mjs),
  [campaign CLI](../../components/console/scripts/qa-campaign.ts)). Its
  `prepare`, oracle approval, agent-observation and review commands remain
  subroutes of the plan and evidence families, not new verdicts.
- The I2 approval and approved discovery-run APIs are bounded registration
  subroutes with separate effects and readback
  ([Kernel exports](../../components/kernel/src/index.ts),
  [Console recipe](../../components/console/skills/qa-init/SKILL.md)); a
  registration receipt is not a passed product campaign.
- Freeland's replacement-corpus `promote --write` changes owner-acceptance
  config, controlled recovery ends `NEEDS_AGENT_REVIEW`, exact-ticket binding
  is neither FIXED nor a release verdict, and `qa:publish --deliver` only
  queues a local outbox entry
  ([replacement CLI](../../components/freeland/tools/freeland-graph/manual-replacements-cli.mjs),
  [recovery runner](../../components/freeland/tools/freeland-replacements/run-tc-vhod-05-controlled-recovery.mjs),
  [ticket recipe](../../components/freeland/skills/freeland-release-qa/references/exact-ticket-evidence.md),
  [publisher](../../components/freeland/tools/freeland-main/publish.mjs)).
  Source `qa:watch` still refuses before external action; an older operator
  runbook describing it as operational does not promote it.

This reconciliation changes the **effect/route classification**, not the
candidate denominator or the earlier I06a actor grades. The material root
index gaps remain ordinary exact-run status, workspace inspection/integrity,
and Freeland controlled recovery. The exact-ticket source recipe also remains
missing from installed bundles. A future graph could project this inventory
read-only, but cannot supply omitted authority or result semantics by itself.

## Qualification and next controlled check

The current [installed-byte delta](i04-installed-skill-delta-20260924.md) is
**27/42 exact file slots, 12 differing, 3 missing**, across three host roots;
that is not a family-level score or proof of implicit skill discovery. The
frozen [I06a D1/D2 and H1/H2](current.md#active-plan-and-next-action)
experiments retain their first replies and adoption NO-GO. This inventory does
not regrade them, install a skill, change `skills/README.md`, or create a
capability graph.

Next: independently review the family boundary and exact interfaces, then
freeze a small new-dialogue comparison for the material omissions (ordinary
status, controlled recovery, exact-ticket installed reference) against the
current index. Measure first-route correctness, effect/authority claims and
actual selected source; treat missing host parity as unqualified, not success.
Only an accepted design may then alter the index or derive a read-only
capability graph. The existing product graphs remain for requirement/test
dependencies and impact; a graph edge is neither execution authority nor an
observed QA result.
