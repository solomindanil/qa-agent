# NuanuFlowQA

**Agent-driven QA platform.** Point it at your web product and let a coding agent (Claude Code) hunt bugs, file them to Linear with screenshots, and generate ready-to-paste fix prompts for whatever agent maintains your product's codebase.

Two modes, shipped as Claude Code skills:

| Mode | Skill | What it does |
|------|-------|--------------|
| **Check** | `/qa-check` | Recon → test matrix (landing, auth, core flows, payments, i18n, 404, responsive on 320–1440px) → Playwright specs → every confirmed bug filed to Linear with screenshots → `test.fail()` regression test per bug |
| **Bugfix** | `/qa-bugfix` | Pulls open bugs from Linear, clusters them by root cause (merge where one PR fixes several, split where risk differs), and generates a self-contained fix prompt per cluster — paste it into your product's coding agent |

## Quickstart

```bash
git clone <this repo> && cd NuanuFlowQA
npm install
npx playwright install chromium
cp .env.example .env          # fill in your product's URL (+ test account)
```

MCP servers ship preconfigured in `.mcp.json` — when you first open the repo in Claude Code it will offer to enable them:

- **linear-server** (bug tracker for both modes) — authorize once via OAuth when prompted (or run `/mcp`)
- **chrome-devtools** (browser for recon and bug screenshots) — requires Chrome installed; runs via `npx chrome-devtools-mcp@latest`

(Manual alternative: `claude mcp add --transport http linear-server https://mcp.linear.app/mcp`.)

Add your product:

1. Copy `tests/_template/` → `tests/<product>/` (specs are ready-made patterns: SPA hydration waits, locale-agnostic selectors, viewport matrix).
2. Set `<PRODUCT>_BASE_URL` (+ `_TEST_EMAIL`/`_TEST_PASSWORD`) in `.env` and register the project in `playwright.config.ts` (one-liner, follow the pattern).
3. Copy `docs/templates/TEST-CASES.md` → `docs/local/<product>/TEST-CASES.md`.
4. Create a Linear project for the product; add a `Bug` label + product-area labels to the team.

Then open Claude Code in this repo and run `/qa-check`. When the backlog has bugs, run `/qa-bugfix`.

```bash
npm test                                  # all configured products
npx playwright test --project=<product>   # one product
```

## How bugs are filed

Every ticket follows `templates/bug-report.md`: `[BUG]` title, `Bug` + area labels, priority = severity (rubric included), steps / expected / actual / evidence / environment, mandatory screenshot uploaded via Linear MCP. Every bug gets a `test.fail()` regression test annotated with the ticket ID — when the fix ships, the suite flags it automatically.

## How fix prompts work

`templates/fix-prompt.md` produces prompts that are self-contained (zero context assumed), evidence-first (exact strings and endpoints so the agent can grep its way to the code), with acceptance criteria as a checklist and capability-adaptive recommendations (subagents, browser tools, Linear MCP — used if the executing agent has them).

## Layout

```
.claude/skills/     qa-check + qa-bugfix skills (slash commands)
templates/          bug-report.md, fix-prompt.md
tests/_template/    copy-me starter specs for a new product
tests/<product>/    your per-product suites (gitignored by default for privacy)
docs/templates/     TEST-CASES.md template
docs/local/         your real test cases & product notes (gitignored)
CLAUDE.local.md     private product context for the agent (gitignored)
```

Local-only by design: product credentials (`.env`), real test cases, per-product specs and agent context never leave your machine.

## PayDemo

PayDemo is a self-contained, simulated checkout used to exercise the QA harness. It uses only a local Node HTTP server and a browser page; it has no provider, credentials, network calls, or real money movement.

```bash
npm run build:paydemo       # writes ignored dist/paydemo/build-manifest.json
npm run start:paydemo       # build and serve fixed-v2 on http://127.0.0.1:4173
npm run test:paydemo:harness    # deterministic probe, synthesis, and environment contracts
npm run test:paydemo:broker     # loopback broker security, replay, lifecycle, and fail-closed checks
npm run test:paydemo:provenance # clean Git source and served-byte provenance
npm run test:paydemo:identity   # runtime identity and immutable served-byte checks
npm run test:paydemo        # fixed-v2: 6 normal Playwright checks
npm run test:paydemo:bugs   # buggy-v1: 3 intentional expected failures
npm run verify:paydemo      # all harness, provenance, identity, fixed, and defect checks
```

`dist/paydemo/build-manifest.json` pins the exact Git commit, source hash/file set, and hash/file set of the bytes actually served. The server verifies both sets before listening and snapshots verified public bytes in memory. `/build-info` exposes only the closed six-field runtime identity needed by remote probes: app, variant, commit, served-content hash, environment id, and instance nonce. `POST /api/reset` accepts only a bounded `runId` and clears only that in-memory run; it cannot clear another run or persistent data.

The default `fixed-v2` rejects forged client amounts, sends the selected payment method, disables duplicate submission, and reuses a payment for the same idempotency key. `buggy-v1` is deliberately isolated to the three corresponding defects so the controlled suite can demonstrate their detection.

### Nuanu Flow environment broker

The broker gives sandboxed Nuanu Flow tasks a narrow loopback capability without giving them repository, process, or filesystem choices. An operator fixes one campaign profile at broker startup; an agent request contains only `campaign_id`, `environment_id`, and `idempotency_key`. Cleanup additionally supplies the `instance_nonce` emitted by prepare as `lease`. HTTP responses remain the exact `{item, artifact_outputs}` Agent Task envelope.

```bash
export PAYDEMO_QAH_BROKER_CAMPAIGN_ID=paydemo-demo
export PAYDEMO_QAH_BROKER_ENVIRONMENT_ID=paydemo-buggy
export PAYDEMO_QAH_BROKER_REPOSITORY=https://github.com/solomindanil/NuanuFlowQA.git
export PAYDEMO_QAH_BROKER_COMMIT=<exact-40-character-commit>
export PAYDEMO_QAH_BROKER_VARIANT=buggy-v1
export PAYDEMO_QAH_BROKER_PRODUCT_PORT=4173
export PAYDEMO_QAH_BROKER_CLEANUP_ITEM_KEY=cleanup_risk_environment
export PAYDEMO_QAH_BROKER_STATE_ROOT=/absolute/operator-owned/paydemo-state
node scripts/paydemo-qah-broker.mjs \
  --token-file /absolute/scoped-capability/broker.token \
  --curl-config /absolute/scoped-capability/broker.curl.conf
```

The broker binds only literal `127.0.0.1`, generates owner-only (`0600`) credential files, accepts only the configured exact HTTPS repository/commit/variant/port/state-root tuple, and invokes the environment CLI with absolute executable paths, explicit arguments, `shell:false`, and a minimal environment. The agent uses `curl --config /absolute/scoped-capability/broker.curl.conf`; no bearer token is placed in its prompt, command arguments, standard output, or BPMN fields. That readable config is a scoped demo capability, not proof of per-task identity, so its directory must be exposed only to the intended worker account.

State and the bounded idempotency replay window live for one broker process. Shutdown stops admission and drains in-flight CLI work but deliberately does not kill a ready product. Invalid or uncertain prepare/cleanup output moves the profile to `QUARANTINED`; stop the broker, reconcile through the ownership-checking `paydemo-qah-environment.mjs cleanup` command with the fixed profile paths, then restart it. The pilot does not yet persist broker state across host restarts or provide per-task attribution.

## Scaling to large products

Templates and config are ready for big suites: Page Objects + fixtures (`tests/_template/pages/`, `tests/_template/fixtures.ts`), an API-layer spec template, a cross-browser matrix per product (`browsers` option in `playwright.config.ts`), one-login-per-run auth via storageState (`authSetup` option), and a ready CI pipeline (`.github/workflows/e2e.yml`: manual + nightly, JUnit + HTML artifacts, sharding hint). Details in the `/qa-check` skill, section "Scaling to large products".

## Universal QA harness verification

Nuanu owns the Column triggers, BPMN topology and execution, Journeys, Artifacts, status Ends, retries, and Assist/Auto control. QAH owns deterministic browser/API/code/domain execution, immutable evidence verification, the closed three-way release policy, and final claim materialization. The local universal-flow proof drives canonical API-only, UI-only, docs-only, and mixed tickets through the committed profile, resolved context, deterministic plan, environment lifecycle, concurrent branch runners, immutable ArtifactVersion materialization, evidence aggregation, independent release decision, comment publication, cleanup, and final transition gate.

```bash
npm run test:qah:proof-gate # focused local Proof Gate product proof
npm run test:qah            # universal contracts and local end-to-end matrix
npm run verify:qah          # universal matrix + legacy PayDemo harness + TypeScript
```

The matrix proves exact required/skipped branches, UI-adapter invocation only for UI scope, no managed product environment for docs while the pinned repository code/static-analysis branch still runs, overlapping mixed-ticket branch bodies, fail-closed product/missing-evidence routing, and the comment-plus-cleanup gate before either final state. A READY claim maps to Proof Gate outcome `passed`; a proven product failure maps to `not_passed`; uncertainty maps to `unable_to_verify` and the neutral End leaves the item in Ready for QA. The docs case loads the committed `tests/qah/fixtures/qa-harness.docs.yaml` bytes without rewriting them; the runtime independently verifies the temporary checkout's exact real Git root, origin, clean status, and HEAD before executing the profile's code argv itself. The main `qa-harness.yaml` remains the managed PayDemo profile. The proof is deterministic and local: it does not save or activate a Nuanu process or mutate any live Nuanu Artifact, Agent, comment, work item, run, or state.

Live Auto remains explicit `NO_GO` until the Assist compatibility probe and all three outcome canaries (`passed`, `not_passed`, and `unable_to_verify`) are observed with exact read-back. The direct install preflight, pinned generic AgentVersions, exact profile ArtifactVersion, and other installation attestations must all pass before a canary; local proof does not weaken those preconditions. See `docs/operations/universal-qa-proof-gate-runbook.md` for the bounded operator sequence.

## Safety rules

Tests are read-only against real accounts: no purchases, no settings mutations, no real payments, no password-reset emails to third parties. Payment flows are verified up to the external payment step; real-money checks happen only with the product owner in the loop.

## Roadmap

This repo is designed to become part of a larger product — the skills/templates layer is portable and will be packaged (Claude Code plugin) in a future iteration.

## License

MIT
