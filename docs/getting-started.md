# Getting started from a fresh clone

This public repository delivers reusable QA harness source, specialist product knowledge and historical records. It does not deliver a ready-made product session. Keep your own credentials, account data, registrations and run evidence private. See the [architecture](architecture.md) for the distinction between general Starter and specialist lanes.

For ordinary request capture, start at [Agent entry](#agent-entry-without-changing-installed-skills)
and the complete root qa-check bundle. Node >=22.12.0 is sufficient for its
local capture/read/report helper; restoring components, installing dependencies
or starting a managed runtime is not a prerequisite. The bootstrap below is
for delivered component source when the selected specialist needs it.

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

> Check the whole product at the URL I supply, starting read-only. I have no documentation. Preserve the full request even if you begin with one area. Save an intake report and tell me what remains unknown before dependent execution.

The source [qa-check entry](../skills/qa-check/SKILL.md) discovers the bundled
[request-intake recipe](../skills/qa-check/references/request-intake.md). The host
resolves the current specialist, owner checkpoint and permitted existing private
notes destination, saves the original nonsecret prose, invokes plain-text capture
and reads it back before handoff. It saves/reads an intake report, adds the exact
request/report paths and request ID/revision/digest to the existing checkpoint,
preserving earlier entries, and opens the returned Markdown through its normal
file-opening mechanism. No managed workspace is created for a demo. Missing
destination/authority is reported while independent in-chat analysis continues.

For an existing registered Starter workspace, `--product` / `owner.product` is
the exact current registered `product.slug`, not its display label, project title
or a guessed directory name; use verified registration/readback and retain the
same canonical workspace and `qa-product-v0` ([checkpoint binding](../components/console/skills/qa-product-v0/references/agent-request-checkpoints.md)).
Intake read success alone is not owning admission. Preserve an unbound/mismatched
capture; a separately authorized new capture retains it and true chronology—no rebinding or backdating.

This helper needs only Node >=22.12.0 and its complete qa-check bundle, not a
running child runtime, docs, browser or MCP. The intake result is NOT_EVALUATED,
caller-authored/unattested, with managed execution binding not_owner_attested;
it is not the final QA report. A pilot never replaces the original full scope.
New work receives a new request; explicit continuation names the saved request
and revision. Reopen using exact saved paths, not an inferred latest request.
If Markdown is missing, use the recipe's saved-JSON-only `render-report --report`
operation; `read` never repairs files or changes an intake result.

Do not assume a `$qa-check` installed in a home directory has the same bytes.
Source-directed use needs no global skill installation and leaves other chats'
installed skills alone. If you later install skills, copy the full reviewed
skill directories including references into your host's supported skill location,
back up collisions and verify bytes. Installation and host routing need their
own validation; bootstrap does not perform either.

## 2. Choose new work or an existing campaign

For an unfamiliar or separately authorized new product, read [product routing](../products/README.md). The generic [qa-check source](../skills/qa-check/SKILL.md) routes to the selected specialist; where no product pack is already selected, read the complete [qa-product-v0 skill](../components/console/skills/qa-product-v0/SKILL.md) and its required references. Product analysis can happen before registration and does not require Nuanu Flow.

Use [qa-init](../components/console/skills/qa-init/SKILL.md) only when a new managed workspace, recovery of a known registration, or a separately authorized I2 first-evidence review is needed. After a registration is read back successfully, return to `qa-product-v0` to choose or author the applicable plan. I2 is a separate lane, not a universal prerequisite.

The selected Console README still contains legacy wording that makes I2 sound mandatory after every registration. Follow the current `qa-init` skill route above; repairing that owning README requires its own reviewed component change and repin and remains in the [maintenance backlog](qualification/maintenance-backlog-20260913.md).

For an existing live campaign, resolve its current owner checkpoint and keep its frozen source, workspace, registration, evidence, permissions and unknown outcomes. Historical task IDs or paths can help that owner but are not required for first use. Missing owner state blocks continuation of that exact campaign, not separately authorized new analysis or registration. Existing frozen campaigns are not migrated by this repository.

Request capture does not change either route. New Starter registration derives
only established supported facts into the existing answers and uses qa-init dry
first; unknown facts stay unknown, and submission needs separate exact authority.
An existing registration goes to its existing qa-product-v0 plan/evidence path
without resetting. A full request does not mean an old graph/catalog covers it.
Every later actual QA conclusion cites the request tuple plus original owner
run/evidence identity and independent readback, preserving that owner's verdict
and limits. B00 capture/report is bounded and I01 partial; B01/D01/E00/V01 and
N01/Q1 are not accepted by source/helper tests.

<a id="3-configure-console-and-kernel-explicitly"></a>

## 3. Configure Console and Kernel explicitly (Starter lane only)

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

The optional `QA_STARTER_EXPECTED_SHA` above is derived from the current manifest rather than copied from historical guidance. Confirm that manifest selection, the restored Kernel `HEAD` and the Console's embedded Kernel authority agree. Use the selected registration/campaign commands and their current guards; do not infer that every legacy Console CLI command independently enforces the same exact-pin/source-integrity check. A legacy CLI bypass needs its own owning repair and qualification; it is not permission to bypass a guard.

`QA_WORKSPACE_ROOTS` is a colon-separated allowlist of parent directories on the supported platforms; every registration target must resolve below one. `QA_CONSOLE_STATE` is the Console receipt file. `QA_CONSOLE_PRIVATE_ROOT`, `QA_REGISTRATION_STORE` and `QA_REGISTRATION_TARGET_REGISTRY` keep oracle approvals, registration events/receipts and target ownership outside product workspaces. These explicit values avoid selecting home-directory defaults. Never put credentials in these examples or in the tracked repository.

Only if this Starter runtime is selected and the operator approves local dependency installation, install each restored child's locked dependencies separately and build the exact Kernel before starting the loopback-only Console:

```sh
(cd "$QA_STARTER_REPO" && npm ci --ignore-scripts && npm run build)
cd "$QA_AGENT_ROOT/components/console"
npm ci --ignore-scripts
npm run dev -- --host 127.0.0.1 --port 5173
```

These commands do not grant permission to register or execute against a product. In another shell, export the same values or source an operator-owned private environment file. Inspect the approved intake without mutation, obtain authority for the exact target, then use the existing `qa-init` command from `components/console`. The target must be an absolute path below `QA_WORKSPACE_ROOTS`; do not `mkdir` it or fake `.qa-managed.json`.

Build the `--answers` file against the delivered [`IntakeBuildInput`](../components/console/src/lib/intake-build.ts) and the current `qa-init` skill, not an unvalidated generic template. `briefText` is a string containing the structured product/surfaces/journeys/risks JSON described by that skill; preserve only established facts and observable outcomes. The current registration route is `black_box`. A web or landing target normally declares one public HTTPS root; an operator-authorized product on exact `localhost` or `127.0.0.1` ports instead uses the [explicit owned loopback target](../components/console/skills/qa-init/SKILL.md#explicit-owned-loopback-target) route (`targetClass: "loopback_http"` in a `local` environment, plus the matching Console origin grant: `QA_LOOPBACK_ORIGINS` for either server; `serve` also accepts repeatable `--loopback-origin`, which takes precedence). Top-level `surfaces` are supported kind strings. For web/landing, `sources: []` lets the CLI derive the URL; API-only answers instead need [one explicit matching URL source](../components/console/skills/qa-init/SKILL.md#api-only-registration), without an invented web surface. `secretRefs` stay empty, and optional `sourceSnapshots` contain only exact supplied nonsecret Markdown or OpenAPI JSON. Do not invent product facts to make the input complete.

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

### Open an existing workspace or saved request report

A continuing agent or reviewer registers nothing. Use the same exported values the workspace was registered with: export them as above or source the operator's private environment file (plain `KEY=value` lines need `set -a` before sourcing so `npm` sees them), including any loopback origin grant. Check read-only that Console dependencies are present and the selected Kernel is prepared as in the block above; if either is missing, ask the operator instead of installing or building in a frozen or shared clone. Then start the Vite dev server from `components/console`:

```sh
npm run dev -- --host 127.0.0.1 --port 5173
```

The dev server serves the UI and the bridge directly from source; it needs no Console build. Port 5173 is strict, so a second server on that port fails instead of moving. `npm run serve` (default port 8791) runs the same bridge but serves only a prebuilt `dist-primary-ui/` bundle: without one, `/api/*` answers while the page itself returns 404. Use `serve` only where an operator already built that bundle in the selected checkout; `npm run build` writes inside the Console child, so do not run it in a frozen or shared clone. The Console README's "serves the built `dist/`" refers to this `dist-primary-ui/` output.

When the Console opens the mission monitor, choose the exact mission in its
**Mission** selector, then the desired checkpoint in **Saved report history**.
That is a saved display, not current admission. Follow **Open verified report**
to acquire a separate current owner read for that exact request/checkpoint;
pending, unavailable or background re-verification is not a ready report.
If explicitly configured, `QA_MONITOR_ROOT` is a dedicated private discovery
directory shared exactly by producer and viewer—not `notes/.qa-monitor` or its
`v1` journal tree. This advice does not migrate or repair an existing root.

In the workspace view, choose the workspace in the selector (it lists managed workspaces that are direct children of a `QA_WORKSPACE_ROOTS` entry, or of the parent of `QA_WORKSPACE` when no roots are set; `QA_WORKSPACE` is optional), open **Requests**, and on the saved request use **Open checkpoint K**, which opens its recorded latest checkpoint. An older checkpoint is opened from that report's **Immutable checkpoint history** card. The selected view verifies before it shows facts and is bounded at 240 seconds. Without the UI, read or export the same checkpoint with `read-agent-request` or `export-agent-request` as described in [agent-request checkpoints](../components/console/skills/qa-product-v0/references/agent-request-checkpoints.md). Opening or reading a report does not authorize product actions.

### Read usage and timing without inferring missing measurements

In the mission activity card, read the observed timestamps, terminal status and
usage together with their source. Configured CLI/model/version describes the
launch, not proof that every background request used that model. Supervisor
activity and a successful process exit are not a QA verdict.

Codex unmetered or absent cost is **unknown**, not a numeric `$0`. An explicit
Claude zero remains a measured CLI-reported estimate; it is not an invoice or
exclusive-model billing proof. Missing usage cannot establish that a run was free.

The Timeline shows recorded command intervals and their observed window, not
whole-agent walltime or discovery→verification→report phase latency. Overlapping
commands remain separate: do not sum parallel intervals into elapsed time.
A missing finish stays “finish not recorded”; it does not mean “still running”.
Agent activity retains an observed cancelled/failed/unknown status rather than
turning cancellation or incomplete observation into successful completion.

Use those observations to locate recorded work and uncertainty. Setup, review,
retry overhead and end-to-end QA phase totals are not measured merely because
some command timestamps exist. Evolution comparisons are currently unavailable:
a current campaign receipt is not a cohort or a compatible cross-run history.
See the selected Console's activity card, Timeline and Evolution views for the
same distinctions; the source selection is in [the current entry](qualification/current.md).

### Prepare a new hosted request with product memory

Use the manifest-selected Console/Kernel pair in a separate verified checkout
for a new launch. Restoring source does not change a running campaign, install
host skills or grant product authority. Existing campaigns keep their frozen
source, owner, request and unknown outcomes. The Console UI reads activity and
reports; it does not currently provide an agent-start or memory-configuration
launcher.

Read the complete source `qa-product-v0` skill and its
[ordinary memory cycle](../components/console/skills/qa-product-v0/references/agent-memory.md#ordinary-memory-enabled-task-cycle).
The supervising agent or trusted operator prepares the existing
[HostActivityInput](../components/console/src/node/agent-host-activity.d.mts)
from the selected registered workspace, exact saved request, approved host and
private output roots. The person supplies scope and authority, not hand-written
JSON, note IDs or a ready-made product dossier. The existing
[host entry](../components/console/scripts/qa-agent-host-activity.mjs) takes one
explicit local JSON filepath, bounded at 65,536 bytes; this is not a stdin recipe or a new registration
command. Keep that input private and invoke it from its actual selected source.
For owner-output, use the selected `starterRepo` and manifest-derived
`starterExpectedSha` plus the existing verified `writableOutputRoots`. Claude
also requires its exact executable/configuration; the browser gateway is a
separately admitted capability. Memory does not imply browser access.

For an already captured and announced request, the trusted operator can assemble
this private Claude owner-output input. Placeholders are not runnable values or
authority: resolve canonical absolute paths, the manifest Kernel SHA, the actual
Claude executable SHA-256 and authorized bounds before saving the JSON.

```json
{
  "executable": "/ABS/CLAUDE",
  "executableSha256": "ACTUAL_EXECUTABLE_SHA256",
  "pythonExecutable": "/ABS/PYTHON",
  "workingDirectory": "/ABS/REGISTERED_WORKSPACE",
  "prompt": "Authorized scope and selected source instructions",
  "requestPath": "/ABS/NOTES/SAVED_REQUEST.json",
  "monitorRoot": "/ABS/MONITOR",
  "activityRoot": "/ABS/CONSOLE/.local/host-activity",
  "deadlineMs": 600000,
  "route": {"cli": "claude", "model": "claude-opus-5-5", "profileId": "claude-qa-owner-output"},
  "starterRepo": "/ABS/KERNEL",
  "starterExpectedSha": "MANIFEST_KERNEL_COMMIT",
  "writableOutputRoots": ["/ABS/MONITOR", "/ABS/NOTES"],
  "claudeConfiguration": {
    "runDirectory": "/ABS/CONSOLE/.local/host-activity/UNIQUE_CONFIG",
    "maxTurns": 12,
    "maxBudgetUsd": 0.5,
    "loopbackOrigins": [],
    "externalAssets": null,
    "trustedPath": "/ABS/TRUSTED_BIN:/usr/bin:/bin"
  },
  "memoryAccess": "current_owner"
}
```

Run the existing entry from the selected Console, not a historical operator script:

```sh
node scripts/qa-agent-host-activity.mjs /ABS/PRIVATE/host-input.json
```

`workingDirectory` must equal the captured request's registered workspace. The
supervisor derives the effective Claude cwd from its plain external notes directory;
do not substitute notes for the registered workspace in the input. `writableOutputRoots`
is the sorted, unique exact set of notes, monitor and any separately admitted memory
home outside that workspace; the workspace is added internally. Roots must not overlap
each other, source or protected activity/configuration. With memory enabled,
`activityRoot` is exactly the selected Console's `.local/host-activity`;
`runDirectory` is a unique strict descendant. The source checks the pinned executable
and currently requires Claude Code `2.1.295`; these placeholders do not bypass it.

Omit `memoryAccess` for an intentionally no-memory launch; unavailable memory is
not an empty recalled corpus. Omit `browserGateway` without separately admitted
browser capability. When admitted, its existing [configuration](../components/console/src/node/agent-host-activity.d.mts)
requires `rootSourceDirectory` (the normal root checkout), `productOrigins`,
`externalAssets`, `allowedMethods`, `attachmentTypes`, `reportOrigin`, and
`native: {requestPath, intakeReportPath, approvalStoreRoot, allowedSideEffects, timeoutMs}`.
Gateway product origins must match `claudeConfiguration.loopbackOrigins` exactly,
and both external-assets declarations must match. The current gateway admits explicit
HTTP loopback origins with ports; the report origin is distinct. Select methods,
attachments and native effects from actual authority, not this example. Do not insert
unknown optional keys or null capability objects. After admission the host supplies
`QA_BROWSER_GATEWAY_FILE` for the [fixed actor client](../components/console/skills/qa-product-v0/references/browser-gateway.md),
not a caller-created token or endpoint. `imageCapability` is a separate optional
memory-delivery declaration (`available` or `unavailable`); `available` requires an
admitted writable memory launch and is not proof of browser access or pixel inspection.

Memory is an explicit trusted launch capability. Set
`memoryAccess: 'current_owner'` for an admitted memory-enabled profile when the
selected workspace is the memory home. This supports a new request under the
same owner: existing knowledge is recalled afresh, and a missing writable
self-association can be initialized during checked startup. Omission preserves
the existing no-memory behavior. Read-only access cannot initialize a home;
Claude read-only does not admit memory. A pre-existing foreign association is
not reset by `current_owner`.

For a different campaign, the trusted launch must supply the explicitly
verified `memoryHomeWorkspacePath` and admitted `evidenceWorkspacePaths`, with
the required existing association. Owner IDs and product names are not paths
or routing authority. There is no automatic cross-campaign home registry or
same-name join in this source. An unresolved home is a routing gap; continue
independent permitted QA while preserving that gap, rather than migrating an
old owner or inventing a directory.

After successful preparation, use the actual absolute task command emitted by
the host, including its task-help command, from the actor's notes directory.
The agent chooses recall terms, reads exact evidence, performs permitted checks
and saves one to three useful explicit claims, or explains why no claim should
be saved. Preserve saved, failed, unknown and not-attempted outcomes separately.
Reconciliation uses the retained original operation key and payload in that
same captured request; a new request cannot recover an earlier request's
unknown intent by generating a replacement key.

Keep the complete QA remainder and memory limitations in the ordinary owning
checkpoint, then read back and reopen that exact report/export. Storage success,
historical PASS and retrieved dependencies do not establish current product
acceptance. The current local engineering checks do not prove a real provider
used the knowledge or that the memory improves testing decisions.

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

The continuation source-integrity guard refuses executable Git helper settings
(for example system-wide Git LFS filters). For an isolated local QA invocation,
you can exclude inherited system/global settings without editing the host:

```sh
GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null node tools/workspace.mjs verify
```

The example runs source verification from the repository root; apply the same
process-scoped variables to the selected continuation command. Repository-local helper
settings still fail the existing guard. This is process-scoped environment
isolation, not permission to disable source checks or change another campaign's
configuration. The release CI uses the same isolation and records helper key
names without exposing configuration values.
