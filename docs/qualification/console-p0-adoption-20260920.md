# Console P0 source adoption — 20 September 2026

## Decision and boundary

This record qualifies the source-selection change from Console `66ac7db` to the
reviewed P0 successor `d28d774` in an isolated delivery clone. It adopts the
existing replacement-ref authority repair and contained findings-write repair;
it does not reimplement either change.

The result is source-only. It does not establish product acceptance, execute a
campaign, migrate a registration, update installed skills, run a browser or
payment flow, or qualify cloud or dual-host behavior. The existing safe CI gate
remains source/pure only and does not run the dependency-backed findings tests;
this adoption does not expand that workflow or add dependency installation.
Canonical integration and focused verification are now complete; the exact
source transition and limits are recorded below. Existing campaign owners and
their frozen runtime sources were not switched.

## Exact source selection

| Field | Previous selected Console | Adopted Console candidate |
| --- | --- | --- |
| Commit | `66ac7db55a25f56b199b2cb00ad83df3b8dad868` | `d28d7743e9aac370a726df6c6288ad2ef0e52c78` |
| Tree | `8c0a426b3133e326eb120f09a2e0c9408eb68eb5` | `09adfece9000a4d5d79fa63877b46c00febf180b` |
| Bundle | `sources/candidates/console-browser-journeys-66ac7db.bundle` | `sources/candidates/console-p0-findings-d28d774.bundle` |
| Bundle SHA-256 | `9f9046afdf7f222a37f87ffca6a35badf1763fbf09c170b29ba0bbfdba366f8c` | `446fd21decd97fba6f2c7fa8f35f36b89cf9f83e2a84091bb91585069f93ab44` |
| Runtime authority | `true` | `true` |

`git bundle verify` accepted the adopted bundle, advertised only the exact
candidate at `HEAD`, and reported complete history. The candidate is the linear
successor of the previous pin through the reviewed P0.1 parent `bb9b739`. The
selected-to-candidate delta is exactly:

```text
M server/bridge.mjs
M server/kernel-authority.mjs
A tests/unit/findings-write-containment.test.ts
A tests/unit/kernel-replace-authority.test.ts
```

The Console lockfile is unchanged, including SHA-256
`cae849c1b392666de92efe7f2b2f1536b07a0a35d6d21bd803c822a3e359a88b`.
The selected Kernel remains commit
`185d3e72309a4362db57cf2e805d1c00a5035909`, tree
`c6cb0331c2cca666d3cc4fef4524e3d2b62b3a52`, with `runtimeAuthority: true`.
All non-Console manifest rows, Console's path, and its runtime-authority role are
unchanged.

## Historical candidate evidence

The following evidence was produced and reviewed on 17 September 2026. It is
historical candidate evidence, not a new 20 September execution and not evidence
for earlier or broader Console suites:

- Exact `d28d774` plus Kernel `185d3e7`: combined P0.1/P0.2 focused tests passed
  `21/21`, with no failures, cancellations, or skips. The same `21/21` result
  was retained from an independently bundle-restored Console/Kernel pair.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false` exited `0`
  for the candidate and for the retained cold pair, with clean source state.
- The combined test required the unchanged lockfile's `tsx` dependency. Its
  historical cold dependency reconstruction used an existing cache in offline
  mode with lifecycle scripts disabled and browser download skipped; it did not
  prove fresh registry availability.

Those results remain attributed to the exact dated candidate checkout. No old
full-suite count is transferred to `d28d774` by this adoption.

## Fresh adoption checks

Node `v22.23.1` was used with reduced child-command environments. No global
`GIT_NO_REPLACE_OBJECTS` override was set, so the replacement-ref adversarial
controls remained active.

1. Before the selection change, normal restore and verify resolved Console
   `66ac7db` and Kernel `185d3e7`; the selected-pair test passed `2/2`.
2. After changing only the Console manifest row while leaving the clean old
   Console in place, both normal verify and normal restore refused it with
   `SOURCE_HEAD` and exit `1`. Before/after HEAD, tree and index stayed at the
   old identity, status stayed clean, and complete tracked-file digest lists
   were byte-identical.
3. The old checkout was moved intact to a task-local ignored directory and
   validated at the exact old commit/tree with clean status and successful
   `git fsck --full --no-progress`. Normal restore then materialized the missing
   selected Console from the adopted bundle without overwriting a conflicting
   checkout.
4. Source verification reported the exact selected Kernel/Console pair; all
   four component checkouts were clean. The selected-pair test passed `2/2`.
5. The dependency-free replacement-authority test passed `7/7` from the
   selected Console against the absolute selected Kernel path.
6. The root source/packaging suite passed `61/61`, with no failures,
   cancellations, skips, or todos. Final source verification again reported the
   exact selected commits and trees.

The principal commands were:

```sh
node tools/workspace.mjs restore
node tools/workspace.mjs verify
node --test tests/selected-pair.test.mjs

QA_STARTER_REPO=<absolute-selected-kernel> \
  node --test tests/unit/kernel-replace-authority.test.ts

npm test
```

The dependency-backed combined `21/21` command and nonincremental TypeScript
check were deliberately not rerun in the dependency-free adoption clone. The
subsequent canonical checks below used the existing lockfile-matching
dependencies. No whole Console
suite, build, product/browser test, hosted CI job, or new-machine registry test
ran here.

## Portable delivery and canonical readback

An independent normal `--no-local` cold clone of delivery commit
`f8b3bbf95eb10e867439be4ed0071276ac24af2d` (tree
`6fd7767fe807074214f38ac27db542cdb27cedd1`) restored from its own committed
bundles with no shared alternates or `node_modules`. Source restore/verify,
selected-pair `2/2`, and standalone authority `7/7` passed. All component
checkouts stayed clean. This proves portable source selection, not dependency
installation, fresh registry availability or product behavior. Later edits to
this record describe actual canonical results; they are not another cold run.

Independent Lead AQA review accepted the exact three-file delivery and the
recoverable canonical switch before it was performed. The reviewer was a
separate agent context; this is not external human audit or proof of universal
QA quality.

The main owner checked clean old Console source and an empty local process
snapshot for canonical Console/Kernel, preserved old `66ac7db` at local ref
`refs/heads/codex/preserved-console-before-p0-20260920`, fetched the reviewed
local bundle with hooks and external Git configuration disabled, and checked
out exact `d28d774` detached without force. Old source bundles remain. The
brief manifest/checkout mismatch was fail-closed; this is not an atomic
multi-repository deployment or an exhaustive external process-ownership proof.

Fresh checks on the canonical selected source:

| Gate | Result |
| --- | --- |
| Source verify before and after focused checks | Exact four manifest identities, exit `0` |
| Combined replacement-authority/findings tests | `21/21`, no failures, cancellations or skips |
| TypeScript, `--noEmit --incremental false` | Exit `0` |
| Root source/packaging suite | `61/61`, no failures, cancellations or skips |

Canonical commands, each run in a reduced environment and without a global
`GIT_NO_REPLACE_OBJECTS` override:

```sh
# From the selected Console:
QA_STARTER_REPO=<absolute-selected-kernel> node --import tsx --test \
  tests/unit/kernel-replace-authority.test.ts \
  tests/unit/findings-write-containment.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
# From the root:
node --test tests/*.test.mjs
node tools/workspace.mjs verify
```

Existing ordinary `node_modules` was retained under the identical lockfile.
These are local dependency-backed checks, not fresh verification of every
installed dependency byte or cold-machine dependency reconstruction. The safe
CI remains source/pure-only; no full Console suite/build or hosted CI ran.
The fixes cover the tested replacement-ref and static findings path/collision
cases; they do not establish cross-process transactions, hostile path-swap
safety, or a crash-atomic two-file findings move.
