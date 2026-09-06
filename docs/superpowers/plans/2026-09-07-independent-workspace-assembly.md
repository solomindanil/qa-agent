# Independent QA Workspace Assembly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the existing QA components from reviewed portable sources in one independent workspace, verify the assembly, and retain the existing continuation plan.

**Architecture:** A small Node/Git bootstrap restores pinned standalone child repositories from local self-contained bundles. Existing components remain the only runners, graph owners and verdict engines; root documents route agents to them. Source restoration and component/runtime qualification are separate results.

**Tech Stack:** Node.js >=22.12, built-in node:test, Git, existing per-component npm lockfiles. No new dependency, service or runner.

**Spec:** `docs/superpowers/specs/2026-09-07-independent-workspace-design.md` (user approved 2026-09-07: «делаем»).

## Global Constraints

- Keep existing component Git identities; do not flatten them or build another runner, graph engine, verdict or tracker SDK.
- Original repositories, product deployments and installed skills remain intact.
- No bootstrap step installs dependencies, runs product commands, sends Flow messages or changes a product.
- Require a normal child-local `.git` directory: canonical Git dir, common dir and object storage must belong to that child.
- Wrong, dirty, symlinked or conflicting destinations are rejected without deletion or overwrite.
- Keep component lockfiles separate. Browser binaries, dependencies and host plugins are environment dependencies, not copied logged-in installations.
- No push until the included source/history audit and relevant assembly checks are complete.
- The Console fixture repair is still pending; do not silently include that patch in432 or declare these scenarios working after copying files.

## File ownership and sequence

| Task | Owner/files | Independently testable result |
| --- | --- | --- |
| 1 | Implementer: `tools/workspace.mjs`, `tools/lib/source-workspace.mjs`, `tests/workspace.test.mjs`, `package.json` | Real local Git restore and rejection cases |
| 2 | Root: `sources/`, `sources/manifest.v1.json`, `sources/README.md`, audit index | Audited exact sources restored without donors |
| 3 | Root: README/AGENTS/CLAUDE, routing indexes, qualification report | Existing commands and agent entrypoints resolve in delivered workspace |

Task2 bundle preparation can run during Task1 because it neither imports nor changes Task1 files. Final restore waits for Task1 review. Task3 uses the verified restored paths and does not change component source. Root performs integration qualification; a fresh Lead AQA reviewer reviews the whole deliverable. No automatic source-pin update is part of this plan.

### Task 1: Minimal source restore and verify

**Files:** Create `tools/workspace.mjs`, `tools/lib/source-workspace.mjs`, `tests/workspace.test.mjs`, `package.json`.

**Interfaces:**
- CLI: `node tools/workspace.mjs restore|verify [--root ABSOLUTE_WORKSPACE]`. Default root is the parent of the tools directory, not caller cwd. Read only `sources/manifest.v1.json` inside that root. Unknown commands/flags fail with a nonzero exit and JSON error code.
- Library: `assembleWorkspace({ root, mode })` returns `{ status: 'sources_verified', components: [{ id, commit, tree, path, runtimeAuthority }] }` only after all entries verify; throws an Error with `code` otherwise. `mode` is `restore` or `verify`.
- Manifest: `{ schemaVersion: 1, components: [{ id, path, commit, tree, bundle, sha256, runtimeAuthority, qualification }] }`. `path` begins `components/`; `bundle` begins `sources/`; both are normalized relative POSIX paths, no traversal/absolute/backslash/empty segments. IDs and paths unique; commits/trees lowercase40hex, sha256 lowercase64hex. runtimeAuthority boolean; qualification nonempty string; entries do not grant execution authority.
- Root is a canonical normal Git workspace, not a symlink or Git worktree pointer. Tasks2/3 populate its manifest; Task1 tests generate synthetic fixtures instead.

- [ ] **Step 1: Write real Git-based RED tests before implementation.**

Use node:test, assert/strict, fs promises, os.tmpdir and execFileSync. Each test owns a fresh mkdtemp directory; no owner checkout or existing report is touched. Create a tiny source repository, commit one harmless text file with explicit test author/committer and disabled hooks, bundle HEAD, initialize a separate root and write its manifest. Hash bundle bytes using createHash('sha256'). The first behavioral test invokes the CLI as a child and asserts a successful restore, so the absent entrypoint fails the expected behavior assertion rather than breaking an import.

```js
const run = spawnSync(process.execPath, [cli, 'restore', '--root', fixture.root], { encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr);
assert.equal(JSON.parse(run.stdout).status, 'sources_verified');
assert.equal(git(fixture.child, 'rev-parse', 'HEAD').trim(), fixture.commit);
assert.equal(git(fixture.child, 'rev-parse', 'HEAD^{tree}').trim(), fixture.tree);
assert.equal(await readFile(join(fixture.child, 'example.txt'), 'utf8'), 'synthetic source\n');
```

Run `node --test tests/workspace.test.mjs`; retain RED output in the SDD report. Then add cases incrementally and observe expected failures for missing behavior before fixing it.

- [ ] **Step 2: Implement the smallest local bootstrap.**

Use execFile/spawn argument arrays, never a shell command assembled from manifest data. Strip inherited GIT_* overrides and disable global/system Git configuration, hooks and fsmonitor for these operations. No fetch URL is supported. Keep file/path guards and source restore in the library and CLI argument/error presentation in the entrypoint.

```js
// Required order; helpers are private implementation details.
// 1. Read/validate root, manifest, all destination and bundle paths.
// 2. Verify every bundle digest and its complete/no-prerequisite Git header;
//    `git bundle verify` must succeed. Check advertised tip equals entry.commit.
// 3. Preflight every existing child; fail before restoring any entry if conflicting.
// 4. restore: exclusively claim only missing child directories and clone the local
//    bundle without shared/hardlinked donor objects; checkout entry.commit detached.
//    verify: any missing child fails. Never repair/remove/overwrite a conflicting child.
// 5. Verify each child HEAD/tree, clean tracked+untracked status (normal ignores),
//    canonical top-level/.git/common/object dirs and no alternates/external Git storage.
// 6. Return the source-only summary. Partial failure returns error, never full success.
```

Reject symlinks on all existing path segments, bundle files, child .git/common/object storage (including symlinks inside Git storage), and Git alternates. Create missing destination with exclusive mkdir; if another writer claims it, fail without deleting anything. A failed clone remains an explicit partial directory. No automatic cleanup of unknown/stale state. Existing correct children are verified without checking out or changing them. Verify preserves pre-existing bytes. Bootstrap does not execute package scripts or installed hooks/filters.

- [ ] **Step 3: Finish the deterministic acceptance matrix.**

Tests must prove: successful cold restore and repeat; verify-only refuses missing child; wrong bundle SHA256; missing bundle; advertised wrong commit; wrong tree; incremental bundle rejected; wrong/dirty existing child; non-repository directory retained; matching external-gitdir worktree rejected; alternates rejected; bundle/child/intermediate symlink and path traversal rejected; duplicate component IDs/destinations rejected; inherited GIT_DIR/GIT_WORK_TREE/GIT_OBJECT_DIRECTORY do not redirect work; no implicit install/script/network behavior. Corrupt the second entry and prove the first missing child is not created during failed preflight. Record checksums/sentinel bytes before/after refusal. Use actual Git/files, not mock expected results.

```js
const before = await readFile(conflictSentinel);
const result = spawnSync(process.execPath, [cli, 'restore', '--root', fixture.root], { encoding: 'utf8' });
assert.notEqual(result.status, 0);
assert.equal(typeof JSON.parse(result.stderr).code, 'string');
assert.deepEqual(await readFile(conflictSentinel), before);
```

Package scripts only: `test` -> `node --test tests/*.test.mjs`, `sources:restore` -> `node tools/workspace.mjs restore`, `sources:verify` -> `node tools/workspace.mjs verify`; private true, engines.node >=22.12.0, no dependencies. Task1 never runs component tests.

- [ ] **Step 4: Run focused GREEN, git diff --check, self-review and commit only Task1 files.**

`node --test tests/workspace.test.mjs` must finish with no skipped or failed case. Record exact command, exit and counts. Independent reviewer checks spec compliance and code quality against the Task1 diff before source restoration.

### Task 2: Audited self-contained source delivery

**Files:** Create `sources/*.bundle`, `sources/manifest.v1.json`, `sources/README.md`, `docs/qualification/source-delivery.md`. Preserve redacted audit evidence under ignored `.local/source-audits/` and export only reviewed metadata needed by source inventory.

**Consumes:** Task1 manifest/CLI contract. **Produces:** Four pinned child source entries, no donor path used by bootstrap.

| ID/path | Selected commit | Authority |
| --- | --- | --- |
| kernel / components/kernel | 393af209a7629d075258fd1050224db071817a47 | true |
| console / components/console | 43262b2202532d9ea5648e27dafe0fc5177689fe | true |
| freeland / components/freeland | 3d0088ec86b16a2802aa09cca975ca65cc2ede32 | true, Freeland scoped |
| kernel-reporting-reference / components/kernel-reporting-reference | 10d398d8a077068c2184f33958e9b654a2f2947c | false |

- [ ] **Step 1: Read the completed history audits and independently confirm donor HEAD/clean status.**

Kernel/Console/Freeland full closures were reviewed, including committed synthetic PNGs. Reporting10d adds25 audited objects beyond393 and is a sibling, not a replacement. Preserve original MIT/attribution and private Freeland scope. No original/source Git ref or working file is changed.

- [ ] **Step 2: Mechanically generate one complete selected-tip bundle per entry.**

```sh
git -C DONOR bundle create ABSOLUTE_NEW_BUNDLE HEAD
git bundle list-heads ABSOLUTE_NEW_BUNDLE
git -C EMPTY_BARE_REVIEW_REPO bundle verify ABSOLUTE_NEW_BUNDLE
git clone --no-local --no-checkout ABSOLUTE_NEW_BUNDLE FRESH_REVIEW_CHILD
git -C FRESH_REVIEW_CHILD checkout --detach EXPECTED_COMMIT
git -C FRESH_REVIEW_CHILD fsck --full
```

DONOR/EXPECTED_COMMIT resolve from the exact table, never a guessed branch or --all. Each NEW_BUNDLE path must be absent. Read actual tree IDs and sha256 hashes into the manifest. For each fresh clone compare all reachable object IDs to its audited population, check zero external alternates and read lockfile/source bytes against the original commit. An incremental25-object reporting delta is not a standalone backup.

- [ ] **Step 3: Execute the reviewed bootstrap and cold-copy proof.**

Run `npm run sources:restore` and `npm run sources:verify` in qa-agent. Copy only root tracked delivery files into a fresh initialized Git directory, with no old donor/config access or node_modules; run its own `node tools/workspace.mjs restore`, then verify twice. Record local Git/common/object directories and exact four IDs. This is source restoration, not product runtime PASS.

- [ ] **Step 4: Review inventory/closure evidence and commit only Task2 artifacts.**

Retain byte-size/digest/object counts, source audit hashes and limitations in source-delivery.md. No remote publication until the whole assembly review.

### Task 3: Agent routing, selective reuse and source/tool qualification

**Files:** Create `README.md`, `AGENTS.md`, `CLAUDE.md`, `skills/README.md`, `products/README.md`, `references/README.md`, `evals/README.md`, `templates/README.md`, `docs/qualification/assembly.md`; copy the existing approved global plan with provenance into `docs/roadmap/`.

**Consumes:** Verified Task2 child paths. **Produces:** One unambiguous entrypoint for Codex/Claude and an evidence-backed continuation checkpoint.

- [ ] **Step 1: Author routing from actual delivered source, not session memory.**

Read each child README/package/skills. Root instructions select product first and existing execution/knowledge owner, then exact child cwd and env. Link full existing skill directories/references, not copied partial SKILL files or stale installed paths. Do not invent a universal completed capability. Declare host plugins/auth as external preflight, human-help requests nonblocking for independent lanes, and verified graph updates only. References/evals/templates indexes point to selected bundled existing material; any donor not yet included is explicitly inventoried as retained external/pending, never claimed delivered. Tect remains reference-only and unvendored.

- [ ] **Step 2: Restore separate dependencies deliberately and run safe source/tool checks.**

Inspect lifecycle scripts before `npm ci`; use fresh writable npm/browser caches and explicit source dirs. No owner managed workspace/registry/state path may be inherited. Kernel build, selected safe unit gates, Console type/build checks and Freeland existing offline provenance verification are candidates only after reading actual commands. Do not run default Console E2E or Freeland live/watch/publish/deliver. Keep all command/exit evidence under .local with a concise tracked report. Failures remain visible and are separated from bootstrap defects.

- [ ] **Step 3: Independent fresh-context routing/Lead AQA review.**

Give a fresh reviewer only the new workspace and ask it to locate: restore/preflight; full/ticket Freeland lane; new product Starter lane; graph authority; unavailable capabilities; pending timeout fix. Verify all local references resolve. Review source/test/package diff and qualification evidence, including negative controls and absence of new-engine duplication. Apply bounded fixes with regression tests.

- [ ] **Step 4: Commit verified deliverable and report remaining work.**

Run root tests, source verify and diff check after final changes. Report exact passed/failed/not-run lanes. Do not call all product QA complete or enable payments/cloud/scheduler. Resume the existing fixture fix and G1/G2 work from this delivered checkpoint; preserve G3–G6 obligations. Push only the reviewed private delivery when all publication conditions are satisfied.
