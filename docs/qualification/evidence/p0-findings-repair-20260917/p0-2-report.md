# P0.2 implementation report — findings create/resolve filesystem containment

## Status

Implemented and committed in the isolated Console clone only:

- Clone: `/Users/danilsolomin/projectsnew/qa-agent/.local/p0-integrity-20260917.L7Rk7x/console`
- Base: `bb9b739822d3302b525007949c2ee9854843bd5a`
- Branch: `codex/p0-console-integrity-20260917`
- Commit: `d28d7743e9aac370a726df6c6288ad2ef0e52c78` (`Contain findings filesystem writes`)
- Push: not performed

The committed diff contains exactly:

- `server/bridge.mjs`
- `tests/unit/findings-write-containment.test.ts`

`package-lock.json` has no base-to-commit diff. No package, configuration, skill, source pin, product, Kernel, or registry file changed.

## Root cause and correction

The existing read path already walked each workspace-relative component with `lstat()` and refused symlinks and non-directory parents. The findings write paths did not share that invariant:

- create used recursive `mkdir()` on `findings/open`, which followed an existing `findings` or `open` symlink and published the new finding outside the workspace;
- resolve read its source with ordinary `readFile()`, recursively created the resolved parent, wrote its destination with the default overwriting mode, and then removed the source;
- consequently a resolved-parent symlink redirected publication outside the workspace, while an existing regular destination or destination symlink was overwritten before the source was deleted.

The bounded correction adds one local contained-directory helper beside the contained reader. It walks the fixed workspace-relative directory path one segment at a time, creates a missing segment with non-recursive `mkdir()`, verifies the resulting entry with `lstat()`, and rejects symlink or non-directory components.

Create obtains `findings/open` through that helper before ledger inspection and retains its existing exclusive `wx` finding publication. Resolve now:

1. re-reads the selected source through `readContainedFile()`;
2. obtains `findings/resolved` through the contained-directory helper;
3. publishes the destination with exclusive `wx` semantics;
4. removes the source only after that destination write completes successfully.

ID sequencing, malformed-filename reservation, dedupe/force behavior, response status/body conventions, and the existing per-bridge findings lock are preserved.

## Test construction

The new focused test imports the actual `createBridge()` module and dispatches only findings create/resolve and workspace readback routes through direct request/response doubles. The response helper settles only when the real asynchronous route calls `res.end()`; it does not treat the synchronous `handleRequest()` return as completion.

Every case uses its own `mkdtemp()` root with an explicit minimal workspace and private roots. Filesystem assertions inspect actual entry types, paths, directory snapshots, and bytes before and after each route. Cleanup removes only the fixture-owned temporary root. The test does not import the Kernel-building fixture, start a listener, touch a product, construct a Kernel, use the global registration registry, or perform network operations.

## RED evidence

Command on untouched production code:

```sh
node --import tsx --test tests/unit/findings-write-containment.test.ts
```

Result: exit `1`; 14 tests, 6 passed, 8 failed. The expected failures showed HTTP `200` where the containment contract required refusal for:

- create through the `findings` parent symlink;
- create through the `findings/open` parent symlink;
- resolve through the `findings/resolved` parent symlink;
- resolve onto an existing regular destination;
- resolve onto a destination symlink to a regular outside file;
- resolve onto a dangling destination symlink.

The remaining two failures were the Node test runner's two parent aggregation nodes for the paired create and destination-symlink subtests. Unsafe-source retention, healthy create/read/resolve/read, dedupe/force, malformed filename reservation, concurrent distinct creates, and a real non-writable-destination source-retention control already passed on the original code.

Complete generated RED output, including `EXIT_STATUS=1`:

`/Users/danilsolomin/projectsnew/qa-agent/.superpowers/sdd/2026-09-16-cross-product-qa-global-plan/p0-2-red.log`

## GREEN evidence

Command after the bounded production change:

```sh
node --import tsx --test tests/unit/findings-write-containment.test.ts
```

Result: exit `0`; 14 tests, 14 passed, 0 failed.

Complete generated GREEN output, including `EXIT_STATUS=0`:

`/Users/danilsolomin/projectsnew/qa-agent/.superpowers/sdd/2026-09-16-cross-product-qa-global-plan/p0-2-green.log`

## Filesystem invariants proven

- A symlink at either `findings` or `findings/open` makes create fail without changing the outside directory snapshot or sentinel bytes and without creating a new outside file.
- A symlink at `findings/resolved` makes resolve fail while preserving the exact open-source and outside bytes.
- An existing regular resolved destination remains byte-identical and the open source remains byte-identical.
- A resolved destination symlink is not followed whether its target is a regular outside file or is absent; the link, target state, and open source remain unchanged.
- A source-file symlink is not copied or removed, and its outside target remains byte-identical.
- Missing healthy findings directories are created, then create/read/resolve/read persists one finding through the expected open and resolved states.
- Duplicate suppression remains the default, explicit `force` creates the next finding, malformed `F-007.md` reserves sequence 007, and two concurrent distinct creates on one bridge persist distinct IDs.
- A valid regular resolved parent made non-writable with real filesystem permissions reaches an actual destination write failure, returns an error, creates no destination, and preserves the exact source bytes.

The failure modes are intentionally distinct:

- parent symlinks are rejected during contained-parent preflight;
- existing destination entries are rejected by the exclusive destination open/write rather than overwritten;
- the non-writable regular destination directory is a real write failure after parent validation, not an injected or fabricated validator failure.

## Diff and self-review gates

The following scoped gates completed successfully before the commit:

```sh
git diff --check
git diff --cached --check
git diff --cached --name-only
git diff --cached --stat
git diff --cached -- server/bridge.mjs tests/unit/findings-write-containment.test.ts
git diff --quiet bb9b739822d3302b525007949c2ee9854843bd5a -- package-lock.json
```

The staged-name gate contained exactly the two owned files. The post-commit comparison from the required base to `d28d7743e9aac370a726df6c6288ad2ef0e52c78` also contains exactly those two files and no lockfile diff. `git show --check` reports no whitespace error. The working tree was clean after the commit.

Self-review checked the mutation points explicitly: removing either parent-component check reopens a symlink test; removing destination `wx` reopens regular/symlink overwrite tests; moving `rm(src)` above the completed write reopens the relevant source-retention assertions. The static unsafe-source test covers the existing early-rejection behavior: `readFindings()` skips that source and the route returns 404 before the new second contained read. The second contained read is defense in depth for a source inspected after selection, but this suite has no mutation-sensitive control of that branch.

**Independent-review correction:** an earlier version of this report incorrectly claimed that the unsafe-source test exercised the second contained reread. Lead AQA confirmed that the case passes on the original code through early rejection; the corrected attribution above does not change the approved code/spec assessment.

## Limitations and integration boundary

- This change does not claim safety against hostile concurrent directory-component swaps, cross-process transaction isolation, or crash-atomic multi-file movement. The existing lock remains per bridge and findings-only.
- Full `npm test` is Playwright and was forbidden. The existing `bridge-findings-containment.test.ts` was not executed because it imports the Kernel-building fixture.
- The seven P0.1 Kernel-authority controls were not rerun because this commit changes only the findings bridge and its new test; their previously captured result remains the reviewed base. Main owns the final combined integration gate.
- Typecheck/build were intentionally not run by this implementation worker. Main subsequently reported that post-fix `node node_modules/typescript/bin/tsc --noEmit --incremental false`, its diff check, and clean-status check all exited `0` with no generated changes. A production build remains outside this worker's gate.
- No dependency installation/update, HTTP listener, browser, live server, network, product operation, Kernel operation, registry operation, runtime switch, or push occurred.
