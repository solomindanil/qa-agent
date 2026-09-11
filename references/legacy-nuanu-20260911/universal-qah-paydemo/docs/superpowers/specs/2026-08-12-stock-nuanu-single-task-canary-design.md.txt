# Stock Nuanu single-task QAH canary

## Status

Approved implementation correction after the first live Assist probe. Nuanu Flow,
its backend, plugin, worker package, BPMN compiler, Proof Gate profiles, and MCP
contracts remain unchanged. Only this repository and the project-owned Process
graph are changed.

## Observed incompatibility

The first bounded Assist run (`a9da17f1-3355-4695-bebe-f035cd669164`)
completed its first Agent Task and failed in its second task. Exact read-back
showed two stock boundaries:

- a task-scoped Agent credential cannot read the platform-owned Flow item
  ArtifactVersion or an ArtifactVersion published by another Agent Task lease;
- the failed worker generation materialized a JSON-only `document` output as
  `text/markdown`, which the Process output contract rejected.

The binding was paused and read back paused after the failure. That run is
terminal and must never be retried or silently reconstructed.

The first boundary makes the previous 15-Agent-Task pipeline structurally
incompatible with the current stock Nuanu task-artifact authority. A later task
cannot safely consume the previous task's evidence through task-scoped tools.

## Replacement topology

The compatibility canary is reduced to the smallest stock-native graph:

```text
Column Start
  -> finalize_transition (one repository-bound Agent Task)
  -> transition_proof_gate (stock qa_result_v1@1, AI off)
       | passed            -> Ready for Production
       | not_passed        -> In Progress
       ` unable_to_verify  -> neutral hold in Ready for QA
```

There is exactly one Agent Task and no cross-task Artifact read. Nuanu owns the
Column trigger, execution mode, run/journey lifecycle, Artifact publication,
Proof Gate evaluation, and End behavior. QAH owns only deterministic repository
verification and the closed claim emitted by that one task.

## Three-phase same-task protocol

`scripts/qah/proof-gate-canary.mjs` is invoked three times inside the same task
lease and task directory:

1. `prepare` validates the platform source reference, exact clean Git root,
   single origin, profile/origin binding, and runs `npm run verify:qah:proof-gate` with a
   minimal environment. It writes canonical `qah-verification.json`.
2. The Agent publishes that file to the declared `qah_verification` output slot
   as `document/output/application-json` and passes only the actual closed
   `{artifact_id, version_id, kind, role}` reference to `finalize`.
3. `finalize` binds the exact verification reference and writes canonical
   `finalization.json`. The Agent publishes it to `finalization_report`, then
   passes both actual closed references to `complete`.
4. `complete` verifies the task-local state and exact canonical files, then
   returns the raw worker completion `{item, artifact_outputs}`. The stock
   worker materializes both same-task output references into the Process item.
   Because the Agent output contract also declares `verified_commit` with kind
   `git.commit`, the repository supervisor verifies and pushes the unchanged
   task HEAD, then injects that server-owned commit reference into the same
   completion before Proof Gate evaluation.

No task invokes `get_artifact`. No raw stdout/stderr, credential, environment,
prompt, or response body enters an Artifact; only bounded byte counts and
SHA-256 digests are recorded.

## Repository authority correction

The live Assist probe proved that `NUANU_CODEX_CWD` is launcher configuration,
not task repository authority. The worker correctly executes the Agent inside
the supervisor-owned repository worktree, but the canary runner previously
preferred `NUANU_CODEX_CWD` when selecting the checkout to verify. That allowed
the runner to report the launcher branch commit while Nuanu held a different
canonical `WorkItemRepositoryWorkspace` head; stock stage-handoff validation
correctly rejected the result as stale.

The corrected contract is:

- the canary CLI is loaded from `./scripts/qah/proof-gate-canary.mjs` in the
  supervisor-owned task worktree;
- `process.cwd()` is the default and sole production checkout authority;
- an explicit `options.checkout` remains test-only dependency injection;
- `NUANU_CODEX_CWD` is ignored by repository identity and evidence generation;
- the QAH implementation must first be reachable from the project repository's
  canonical default branch, so the server-admitted head contains the exact CLI,
  profile, package scripts, and tests being executed.

No host checkout commit may appear in `tested_head_sha`, repository evidence,
or a Proof Gate claim.

## Provider branch publication

Stock `qa_result_v1@1` verifies a passing claim against the remote task branch,
not merely against the local task worktree. That publication is worker-owned:

- `finalize_transition.config.output.artifacts.verified_commit` is exactly one
  `git.commit` output;
- QAH does not create a commit and never receives GitHub credentials;
- the stock repository supervisor verifies the task worktree HEAD and pushes
  that exact unchanged HEAD to the canonical task branch;
- the worker injects the resulting verified commit reference, so free-form
  Agent output cannot forge it;
- Proof Gate verifies the same branch and `tested_head_sha` before returning
  `passed`.

The operator pushes the intended product commit to the canonical default branch
before creating the Flow item. The final flow contains no manual pre-push of a
task branch.

## Canary semantics

This iteration proves repository/worker/Process/Proof-Gate compatibility. It is
not yet a full Freeland product verdict.

- clean repository plus `verify:qah:proof-gate` exit `0` emits `kind=qa`, `verdict=pass`,
  the exact tested HEAD, and one passed evidence check;
- any verification failure emits `verdict=blocked`, an empty check list, and a
  neutral Ready-for-QA target;
- it never turns a harness, worker, environment, provider, or repository error
  into a product failure or an In-Progress transition.

Stock `qa_result_v1` still requires a server-observed repository workspace with
the same head. A missing or stale workspace produces `unable_to_verify`, even
when local repository verification passed. The stock worker repository
supervisor, activated by the declared `git.commit` output, owns publication of
that exact workspace branch; the QAH runtime must not emulate it.

## Live execution rules

- Patch only while the binding is paused, after a fresh ETag and zero-active-run
  read-back. Validate the complete candidate before one atomic patch.
- Read back exactly six nodes and five edges, the stock Proof Gate configuration,
  the three outcome edges, End targets, AgentVersion, graph hash, and ETag.
- Commit and push the repository before starting a worker or canary.
- Use a new dedicated Assist item and a new idempotency key. Never reuse the
  failed run or PAYD-29 run identity.
- Enter the pause guard before activation. On success, error, timeout, or an
  ambiguous response, read the binding, pause if necessary, and prove the final
  paused state. Never blindly retrigger.
- Auto remains disabled until isolated `passed`, `not_passed`, and
  `unable_to_verify` behavior is proven with exact read-back.

## Extension path

Freeland Playwright, TMA, Computer Use, Telegram, and payment checks can later
be composed behind this same single task and closed finalization boundary. The
Nuanu control plane and BPMN topology do not need to be reimplemented.
