# P0.2: contained findings writes — 17 September 2026

Status: independently reviewed source candidate, restored and tested from repository bundles. Not selected in the manifest, installed into canonical components, pushed, or accepted as product/cloud QA. Root delivery files remain working-tree additions.

## Result

Creating a finding no longer follows a static symlink in `findings/` or `findings/open/`. Resolving a finding rejects a symlinked resolved directory, publishes the destination exclusively, and deletes the source only after the destination write succeeds. Existing destination files and symlinks are not overwritten. Actual create → read → resolve → read, duplicate detection, force, malformed-ID reservation and same-bridge concurrent creation remain functional.

This is a small change to the existing bridge, not a new storage engine. It does not claim cross-process transactions, protection against hostile concurrent path swaps, or crash-atomic two-file movement. The static unsafe-source control proves the existing early rejection, not the second contained-read branch separately; independent review corrected that evidence attribution.

## Source delivery

- Task base: Console `bb9b739822d3302b525007949c2ee9854843bd5a`.
- Final Console candidate: `d28d7743e9aac370a726df6c6288ad2ef0e52c78`.
- [Complete-history source bundle](../../sources/candidates/console-p0-findings-d28d774.bundle), SHA-256 `446fd21decd97fba6f2c7fa8f35f36b89cf9f83e2a84091bb91585069f93ab44`.
- This candidate also contains the independently reviewed [P0.1 authority fix](p0-authority-repair-20260917.md); its embedded Kernel pin remains `185d3e72309a4362db57cf2e805d1c00a5035909`.
- P0.2 changes only `server/bridge.mjs` and `tests/unit/findings-write-containment.test.ts`.
- Lockfile unchanged: SHA-256 `cae849c1b392666de92efe7f2b2f1536b07a0a35d6d21bd803c822a3e359a88b`.

The source is reconstructible from the bundle without private author checkouts. Runtime prerequisites still include Node, Git and dependencies from the existing lockfile. User-approved installation occurred only under task-owned isolated copies with lifecycle scripts disabled and browser download skipped; the cold copy used `npm ci --offline` against the populated task-local npm cache, not borrowed writable `node_modules`. That proves cached dependency reconstruction, not a brand-new machine's registry availability. npm reported the existing eslint deprecation warning; dependencies were not upgraded.

## Executed evidence

| Gate | Observed result |
| --- | --- |
| Original production RED | Exit1; 6/14 pass, 8 fail: six unsafe behavioral leaves plus two parent aggregation failures |
| Fixed owning test | Exit0; 14/14, zero skipped/cancelled/failed |
| Main combined P0.1 + P0.2 run | Exit0; 21/21, zero skipped/cancelled/failed |
| Fresh Console + Kernel restored independently from repository bundles | Same combined gate exit0; 21/21 |
| Post-fix and cold TypeScript check | Exit0, using non-incremental no-emit mode |
| Candidate/cold diff check and worktrees | Clean; no generated source changes |
| Independent Lead AQA review | Spec and quality approved; one report-only minor corrected and re-reviewed as addressed |

Counts include Node parent aggregation nodes; they are not product scenarios or numbers of defects. Tests call the actual bridge routes with real disposable files and await asynchronous response completion. No listener, browser, product request, registration operation, payment, tracker write or deployment ran.

Evidence retained here: [original RED](evidence/p0-findings-repair-20260917/p0-2-red.log), [original GREEN](evidence/p0-findings-repair-20260917/p0-2-green.log), [main combined run](evidence/p0-findings-repair-20260917/main-combined.log), [cold combined run](evidence/p0-findings-repair-20260917/cold-combined.log), [implementation report](evidence/p0-findings-repair-20260917/p0-2-report.md), [independent review and correction](evidence/p0-findings-repair-20260917/p0-2-review.md). Absolute paths inside original reports/logs identify historical execution, not required runtime donors.

Focused commands from the restored Console with approved dependencies:

```sh
QA_STARTER_REPO=<absolute-restored-selected-kernel> node --import tsx --test tests/unit/kernel-replace-authority.test.ts tests/unit/findings-write-containment.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
git status --porcelain=v1
```

Do not substitute Console `npm test`: it invokes Playwright. Full Console build/suite, hostile filesystem concurrency and Linux/cloud behavior were not qualified by these checks.

## Remaining P0 work

Three bounded defects now have reviewed portable candidates, including the separate [payment-composition repair](p0-payment-composition-repair-20260917.md). This is not complete P0 acceptance: the minimal safe CI/source gate and explicit source adoption remain pending. Existing campaigns, their frozen runtimes and installed skills were not switched. The reviewed P1 observation-storage design remains unimplemented.
