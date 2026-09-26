# Getting started from a fresh clone

This public repository delivers reusable QA harness source, including Freeland-specific knowledge and historical records. It does not deliver a ready-made product session. Keep your own credentials, account data, registrations and run evidence private.

## 1. Restore and verify the delivered source

Install Node.js >=22.12 and Git, then run from a normal Git clone:

```sh
npm run sources:restore
npm run sources:verify
npm test
```

`sources/` contains complete Git bundles. Restore materializes independent repositories under `components/` without donor repositories, network access, dependency installation or old machine paths. The outer repository intentionally ignores `components/`; never use outer ignore/status output alone to decide that source is missing. `sources:verify` checks the manifest-selected commits, bundle bytes, child source bytes and clean authority state.

The root `npm test` covers packaging, restore/verify safety and bundled root skills. It is not a Console/Kernel runtime test, browser test, product test, deployment check or release verdict. Do not run a component's `npm test` as a bootstrap shortcut: Console and Freeland may start browser or product work.

## Agent entry without changing installed skills

Open this clone as the project in Codex or Claude. Ask the agent to read this
clone's `AGENTS.md`, `docs/qualification/current.md` and the complete selected
source skill from `skills/README.md` before testing. For example:

> Read this checkout's AGENTS.md and the complete qa-check source skill. Analyze
> my product at the URL I provide, select the appropriate specialist, and use
> this checkout's pinned sources. Start with read-only work; report evidence,
> failures and unassessed scope separately.

Do not assume a `$qa-check` installed in a home directory has the same bytes.
Source-directed use needs no global skill installation and leaves other chats'
installed skills alone. If you later install skills, copy the full reviewed
skill directories including references into your host's supported skill location,
back up collisions and verify bytes. Installation and host routing need their
own validation; bootstrap does not perform either.

## 2. Choose new work or an existing campaign

For an unfamiliar or separately authorized new product, read [product routing](../products/README.md), then the complete [qa-product-v0 skill](../components/console/skills/qa-product-v0/SKILL.md) and its required references. Product analysis can happen before registration and does not require Nuanu Flow.

Use [qa-init](../components/console/skills/qa-init/SKILL.md) only when a new managed workspace, recovery of a known registration, or a separately authorized I2 first-evidence review is needed. After a registration is read back successfully, return to `qa-product-v0` to choose or author the applicable plan. I2 is a separate lane, not a universal prerequisite.

The selected Console README still contains legacy wording that makes I2 sound mandatory after every registration. Follow the current `qa-init` skill route above; repairing that owning README requires its own reviewed component change and repin and remains in the [maintenance backlog](qualification/maintenance-backlog-20260913.md).

For an existing live campaign, resolve its current owner checkpoint and keep its frozen source, workspace, registration, evidence, permissions and unknown outcomes. Historical task IDs or paths can help that owner but are not required for first use. Missing owner state blocks continuation of that exact campaign, not separately authorized new analysis or registration. Existing frozen campaigns are not migrated by this repository.

## 3. Configure Console and Kernel explicitly

Full Console campaign execution is currently supported only on macOS and Linux. This guide makes no Windows or cloud-execution claim. Before any permitted local operation, choose an existing absolute workspace-parent directory and a separate absolute private-state location. The workspace parent is an allowlist root, not a managed workspace. Do not create the target workspace yourself; registration owns that path and its durable readback.

Set the following in one shell so the values persist across build, Console and CLI commands. Replace every `/absolute/...` value; do not reuse a historical product's directories.

```sh
cd /absolute/path/to/qa-agent
export QA_AGENT_ROOT="$(pwd -P)"
export QA_STARTER_REPO="$QA_AGENT_ROOT/components/kernel"
export QA_STARTER_EXPECTED_SHA="$(node -e 'const m=require("./sources/manifest.v1.json");process.stdout.write(m.components.find(({id})=>id==="kernel").commit)')"
export QA_WORKSPACE_ROOTS=/absolute/path/to/qa-workspace-parents
export QA_CONSOLE_STATE=/absolute/path/to/private-qa-state/receipts.json
export QA_CONSOLE_PRIVATE_ROOT=/absolute/path/to/private-qa-state/console-private
export QA_REGISTRATION_STORE=/absolute/path/to/private-qa-state/registrations
export QA_REGISTRATION_TARGET_REGISTRY=/absolute/path/to/private-qa-state/registration-targets.v1.json
unset QA_WORKSPACE
```

The optional `QA_STARTER_EXPECTED_SHA` above is derived from the current manifest rather than copied from historical guidance. Confirm that manifest selection, the restored Kernel `HEAD` and the Console's embedded Kernel authority agree; the Console runtime performs its own exact revision/source-integrity check.

`QA_WORKSPACE_ROOTS` is a colon-separated allowlist of parent directories on the supported platforms; every registration target must resolve below one. `QA_CONSOLE_STATE` is the Console receipt file. `QA_CONSOLE_PRIVATE_ROOT`, `QA_REGISTRATION_STORE` and `QA_REGISTRATION_TARGET_REGISTRY` keep oracle approvals, registration events/receipts and target ownership outside product workspaces. These explicit values avoid selecting home-directory defaults. Never put credentials in these examples or in the tracked repository.

Install each restored child's locked dependencies separately and build the exact Kernel before starting the loopback-only Console:

```sh
(cd "$QA_STARTER_REPO" && npm ci --ignore-scripts && npm run build)
cd "$QA_AGENT_ROOT/components/console"
npm ci --ignore-scripts
npm run dev -- --host 127.0.0.1 --port 5173
```

These commands do not grant permission to register or execute against a product. In another shell, export the same values or source an operator-owned private environment file. Inspect the approved intake without mutation, obtain authority for the exact target, then use the existing `qa-init` command from `components/console`. The target must be an absolute path below `QA_WORKSPACE_ROOTS`; do not `mkdir` it or fake `.qa-managed.json`.

Build the `--answers` file against the delivered [`IntakeBuildInput`](../components/console/src/lib/intake-build.ts) and the current `qa-init` skill, not an unvalidated generic template. `briefText` is a string containing the structured product/surfaces/journeys/risks JSON described by that skill; preserve only established facts and observable outcomes. The current registration route is `black_box`; for a web or landing target it requires one public HTTPS root, top-level `surfaces` are supported kind strings, `sources` and `secretRefs` stay empty, and optional `sourceSnapshots` contain only exact supplied nonsecret Markdown or OpenAPI JSON. Do not invent product facts to make the input complete.

```sh
npm run qa-init -- --answers /absolute/path/to/intake.json \
  --workspace /absolute/path/to/qa-workspace-parents/product-slug \
  --console-url http://127.0.0.1:5173 --dry

# Only after authorization for this exact intake and target:
npm run qa-init -- --answers /absolute/path/to/intake.json \
  --workspace /absolute/path/to/qa-workspace-parents/product-slug \
  --console-url http://127.0.0.1:5173
```

Save the typed session/job/receipt and path bindings. Reconnect using the exact command printed by `qa-init` when needed. Set `QA_WORKSPACE` only after the registration tools report `registered`, durable readback identifies that same workspace, and the existing Kernel validation accepts it:

```sh
export QA_WORKSPACE=/absolute/path/to/qa-workspace-parents/product-slug
```

## 4. Supply lane-specific capabilities and authority

Dependencies, browser binaries, debug/E2E helpers, credentials, test data, account sessions, provider plugins and action permissions are not source. Install or connect only what the selected skill and lane require. Browser QA, E2E structure and debugging skills can improve work but are not mandatory runtime packages for generic analysis. Nuanu Flow reads or publication require the official host capability and current authentication; Flow is not required for generic product analysis.

If no asynchronous human-input tool exists, normal dialogue is valid for a focused help request. Continue independent safe work while dependent scope remains blocked. Never inherit credentials, account identity, payment permission or mutation authority from historical evidence. A prior registration, oracle approval or browser session does not authorize a current run or external write.

Source restoration does not promise full product readiness, whole-product coverage, live deployment identity, product acceptance, campaign migration or integration of every historical commit. Report verified, failed, blocked and unassessed scope separately, and follow the [current checkpoint](qualification/current.md) and [maintenance backlog](qualification/maintenance-backlog-20260913.md) for known limitations.

## Release verification without touching existing campaigns

Run release checks in a separate normal clone. Use a private temporary directory
whose path is canonical (`pwd -P`), especially on macOS where `/var` and `/tmp`
may be symlinks. Point `TMPDIR`, `QA_STARTER_REPO`, Console state and registration
stores into that clone. Never inherit a live `QA_WORKSPACE` for harness checks.
The public runtime CI file lists the exact bounded smoke commands; the existing
source-safety job deliberately remains dependency-free. Neither job runs a live
product campaign. See the release record for wider local test results and limits.
