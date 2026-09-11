# Universal QA Proof Gate operator runbook

## 0. Current stock-compatible operating mode

The current compatibility canary uses the single-task design in
`docs/superpowers/specs/2026-08-12-stock-nuanu-single-task-canary-design.md`.
That amendment supersedes the earlier multi-Agent-Task handoff for live canary
execution. Nuanu Flow and its installed worker package are not modified.

The first Assist probe, run `a9da17f1-3355-4695-bebe-f035cd669164`, is terminal
failed and must not be retried. It proved that stock task-scoped authority cannot
read a platform Flow item ArtifactVersion or an ArtifactVersion owned by another
Agent Task lease. Its second task also produced `text/markdown` for a declared
`application/json` output and was rejected. The exact binding was paused and
read back paused after failure.

The replacement graph is exactly:

```text
Column Start -> finalize_transition -> stock qa_result_v1 Proof Gate -> 3 Ends
```

`finalize_transition` is the only Agent Task. It runs
`scripts/qah/proof-gate-canary.mjs` as `prepare -> finalize -> complete` inside
one task lease, publishes `qah_verification` and `finalization_report` as its own
declared JSON outputs, declares one server-owned `verified_commit` output of
kind `git.commit`, and never calls `get_artifact`. A harness failure is
`blocked`/neutral hold, never a product failure. The canary proves the native
Nuanu trigger/worker/Artifact/Proof-Gate loop; full Freeland product lanes remain
a later extension behind the same single task.

The QAH Agent never creates a Git commit and never receives GitHub credentials.
The stock worker repository supervisor verifies and pushes the unchanged task
HEAD, then injects `verified_commit` before Proof Gate evaluation. Operators
must push the intended product commit to the default branch before creating the
canary item, but must not manually create or push the generated task branch.

## 1. Scope and prohibited Nuanu/source changes

This runbook proves the repository-owned Universal QAH product locally and defines the later, approval-gated Nuanu validation sequence. Local verification is not evidence that a live Process was saved, activated, attached to a Column, or exercised by Auto.

During preflight and local proof:

- do not save, activate, patch, or replace a Process template, binding, Agent, Artifact, Journey, Flow item, comment, run, or status;
- do not edit the live server graph, generated Column Start, repository source, pinned profile, prompts, or install policy to make observed state pass;
- do not accept a paused or invalid binding: the direct preflight requires the exact active binding with `invalid: false` and `needs_attention: false`;
- do not retry an ambiguous write. Read back the exact object and obtain a fresh definition ETag before any separately authorized write;
- do not expose API or worker credentials in command arguments, logs, reports, Artifacts, or handoff evidence.

`scripts/qah/preflight-report.mjs` is a production-only, server-read-only command. It accepts one absolute canonical JSON request, runs and consumes direct preflight authority in the same process, and writes only a closed canonical report. It reads only the optional API origin and the three required Nuanu credentials from the environment. Test mode is forbidden. `scripts/qah/install-process.mjs` renders only; its output is not a save or activation receipt.

## 2. Exact local verification commands

Run from the repository root at the exact intended commit:

```bash
node --test tests/qah/preflight-report.test.mjs tests/qah/task7-round4.test.mjs
npm run test:qah:proof-gate
npm run test:qah
npm run verify:qah
npm run typecheck
git diff --check
if rg -n 'when"?:\s*\{[^}]*"?(var|raw|otherwise|branch)"?|worker 0\.3\.'\
'13|READY_FOR_PRODUCTION либо RETURN_TO_IN_'\
'PROGRESS' processes/universal-qa-flow.graph.json scripts/qah tests/qah README.md docs/operations; then exit 1; else qah_scan_rc=$?; test "$qah_scan_rc" -eq 1; fi
if rg -n '411111111111111'\
'1|Authorization: Bear'\
'er|raw-response-'\
'body' scripts/qah processes/universal-qa-flow.graph.json docs/operations README.md --glob '!local-harness.mjs'; then exit 1; else secret_scan_rc=$?; test "$secret_scan_rc" -eq 1; fi
```

The complete host gate above includes the real Chromium isolation regression.
The stock Nuanu App Server task runs `npm run verify:qah:proof-gate` instead:
App Server intentionally uses a workspace-write sandbox that cannot acquire
macOS Chromium Mach ports. Browser/product execution remains a separate
host/browser-worker lane and is never inferred from this orchestration canary.

The continued adjacent shell literals above form the exact required regular expressions while preventing the runbook from becoming a match in its own scan. In each wrapper, `rg` status `0` is a prohibited match and exits `1`; only native no-match status `1` is accepted and normalized to wrapper status `0`. Any other `rg` status remains a failure.

Generate a sanitized production preflight report only after placing the canonical request in an operator-controlled regular file:

```bash
npm run qah:preflight-report -- --request /absolute/operator-owned/preflight-request.json
```

The report is not an installation receipt. A false `install_ready` or any `unmet_preconditions` preserves `NO_GO`. A loopback-listener `EPERM` may be classified as a restricted test-execution limitation only when the exact command passes under approved unsandboxed execution; assertion, timeout, worker-pin, or product failures are not environment exceptions.

## 3. Finalization and FlowStepResult boundary

For the current single-task compatibility canary, use this exact boundary:

1. Run `proof-gate-canary.mjs prepare` from the clean pinned checkout.
2. Publish its canonical `qah-verification.json` to the same task's declared
   `qah_verification` slot and retain the actual closed reference.
3. Run `finalize` with that reference, publish canonical `finalization.json` to
   `finalization_report`, and retain the actual closed reference.
4. Run `complete` with both references and return only its exact raw worker
   completion. Do not call `get_artifact`, synthesize `item.data`, create a Git
   commit, or populate `verified_commit`; the stock repository supervisor owns
   that third output.

The pre-supervisor response is deliberately narrower than the frozen Process
output definition: it is the verbatim JSON stdout of `phase=complete`, with
exactly `item` and `artifact_outputs`; `item.artifacts` is empty and
`artifact_outputs` contains only `finalization_report` and `qah_verification`.
It contains no Markdown, prose, or `verified_commit`. The stock worker validates
that raw response first, then verifies and pushes the task branch and injects
the server-owned `verified_commit` candidate.

The longer custody chain below remains the target for the later full product QA
extension, but it must be composed within one task authority or another stock
Nuanu-supported shared custody boundary; it cannot be spread across task-scoped
Agent credentials.

For every Agent Task that materializes an output, preserve this exact custody chain:

1. Run the repository runtime with `phase=prepare`; do not synthesize its output.
2. Publish the prepared canonical JSON as an `application/json` ArtifactVersion in the declared output slot.
3. Read back that exact Artifact and version, including bytes and the closed reference `{artifact_id, version_id, kind, role}`.
4. Run `phase=complete` with the prepared input and the actual read-back reference.
5. Encode the admitted result into the worker transport envelope: scalar data stays under `item.data`, `item.artifacts` stays empty, and the reference is placed in `artifact_outputs` for its declared slot.
6. Materialize and validate the transport back to the closed `nuanu.flow-step-result.v1` boundary before Proof Gate routing.

For finalization, publication and cleanup must both have exact receipts. The finalization ArtifactVersion is reread byte-for-byte; aggregate authority, decision, evidence versions, comment attestation, cleanup receipt, tested commit, verdict, and checks must agree. Ordinary QA uncertainty may produce a blocked claim only after the authenticated result is admitted into the closed hold classification and every finalization-integrity check passes.

If cleanup, publication read-back, identity, or classification admission is missing, uncertain, or contradictory, finalization fails before output materialization: emit no `ProcessItem`, no claim, and do not visit Proof Gate. If an immutable finalization ArtifactVersion was already published before a later integrity check failed, record its exact ID and version as unbound evidence. Do not link, delete, or rewrite it without a separately authorized Artifact lifecycle operation.

## 4. Closed outcome matrix

| QAH authority | FlowStepResult claim | Proof Gate outcome | End behavior |
| --- | --- | --- | --- |
| All required checks are trusted and pass | `verdict: pass`, `target_state: ready_for_production` | `passed` | Move to the exact Ready for Production state |
| Trusted evidence proves a product failure | `verdict: fail`, `target_state: in_progress` | `not_passed` | Move to the exact In Progress state |
| Ordinary authenticated QA uncertainty whose closed hold classification is admitted and whose finalization integrity remains valid | `verdict: blocked`, `target_state: ready_for_qa` | `unable_to_verify` | Neutral End; remain in Ready for QA |
| Finalization integrity failure: cleanup, publication, identity, or classification admission is missing, uncertain, or contradictory | No `ProcessItem` or claim is materialized | Do not visit Proof Gate | Stop before routing; remain in Ready for QA and record any already published finalization file as an unbound ArtifactVersion |

There is no default or free-form branch. Unknown, missing, extra, coerced, or contradictory claim data fails closed before routing; it is not converted into a blocked claim.

## 5. Read-only server validation checklist

- Confirm the workspace, project, Column binding, Process template, and three state IDs are the intended objects.
- Confirm the binding is `active`, `invalid: false`, `needs_attention: false`, targets the exact Ready for QA state, and references the exact workspace Process template.
- Read the selection view for `project_start` plus its neighbor and incident edge. Confirm one generated Start, no incoming edge, one outgoing edge, exact binding/project/state identities, `trigger.mode: from_project`, and the current closed output contract (`invoked_at`, `trigger`, and `flow_item`; no legacy `payload`).
- Record the current definition ETag and graph hash; do not infer either from a previous response.
- Confirm the QA and decision Agents are distinct, active, online, and pinned to the exact published AgentVersion IDs.
- Confirm each worker identity independently using its scoped worker credential.
- Confirm the repository origin, commit, install-policy digest, prompt bytes, profile bytes, and profile ArtifactVersion checksum match the pinned Git material.
- Confirm the profile is an internal file ArtifactVersion, not an external resource.
- Run the same-process preflight report and retain only its sanitized closed fields. Any rejected read or unmet precondition remains `NO_GO`.

## 6. Fresh-ETag patch and exact read-back checklist

This checklist applies only after separate authorization for the live mutation:

1. Reread the exact template graph immediately before the write and capture its fresh definition ETag and graph hash.
2. Reconfirm binding, template, state, AgentVersion, and profile ArtifactVersion identities against the approved install request.
3. Render from the committed blueprint and same-process direct preflight authority. Never use the report JSON as render authority.
4. Submit one bounded patch/save with the fresh ETag. Do not activate in the same ambiguous operation.
5. If the write response is ambiguous, stop. Do not retry until exact template and graph read-back proves whether the write applied.
6. Reread the template, full graph, node/edge counts, generated Start, final Proof Gate, three outcome edges, Ends, Agent pins, and output contracts.
7. Record definition ETag before and after plus the exact post-write graph hash. Any unexpected change triggers pause and rollback assessment.
8. Activate only through a separately authorized operation, then reread template activation and final binding status.

## 7. Assist compatibility probe checklist

- Use one dedicated canary Flow item and Assist mode; do not enable Auto.
- Record the exact item, template, binding, commit, graph hash, definition ETag, AgentVersion IDs, run, journey, and mode before execution.
- Observe `prepare`, same-task JSON publication, `finalize`, second same-task JSON publication, `complete`, worker transport, materialized FlowStepResult, Proof Gate outcome, and End behavior.
- Confirm task-scoped tools cannot write outside the declared comment/Artifact duties and that source instructions cannot add commands, URLs, policy, or output fields.
- Confirm all output Artifacts use the declared kind, role, media type, and exact version reference.
- Confirm the canonical verification and finalization files precede the final claim and that their actual output references are preserved exactly.
- Confirm the remote task branch did not exist before dispatch, was created by the stock repository supervisor, resolves to the exact `tested_head_sha`, and matches the injected server-owned `verified_commit`.
- Confirm the applied transition flag and final binding status by exact read-back.
- Treat any schema coercion, missing output, stale input, retry drift, unexpected tool, or manual repair as a failed probe.

## 8. Pause and rollback response matrix

| Observation | Immediate response | Resume condition |
| --- | --- | --- |
| Preflight rejects identity, bytes, binding health, Agent pin, or worker identity | Stop before render/save | Exact read-only validation passes with fresh evidence |
| Save/patch response is ambiguous | Pause; perform exact read-back; do not retry | Applied/not-applied state is authoritative and reconciled |
| Post-write graph, ETag, Start, Proof Gate, or Agent pins differ | Keep inactive or pause binding; preserve evidence | Approved graph is restored and exact read-back passes |
| Authenticated QA result is inconclusive but its closed classification and finalization integrity are valid | Permit only the blocked claim and neutral `unable_to_verify` End | Exact read-back proves the item remained in Ready for QA |
| Cleanup, publication, identity, classification admission, transport materialization, or Artifact read-back fails integrity validation | Stop finalization; emit no `ProcessItem` or claim and do not visit Proof Gate; record any already published file as an unbound ArtifactVersion | Root cause fixed and a new isolated Assist probe passes without repair |
| Product failure routes anywhere except In Progress | Pause binding and Auto promotion | `not_passed` canary proves the exact In Progress End |
| Uncertainty changes item status | Pause binding and Auto promotion | `unable_to_verify` canary proves the neutral Ready for QA End |
| Credentials or protected response content appear in output | Stop, contain evidence, rotate affected credentials | Sanitized rerun passes and exposure response is complete |
| Auto produces an unexpected run or duplicate side effect | Disable/pause Auto and binding; reconcile by IDs | Ownership, idempotency, and retry behavior are proven again |

Rollback uses the last exact approved template definition and a fresh server ETag. Never reconstruct rollback state from console text, screenshots, or a rendered file alone. Read back the restored graph and binding before resuming.

## 9. Auto promotion prerequisites

Auto remains `NO_GO` until all of the following are observed on the intended live objects:

- local focused proof, full QAH, legacy regression, typecheck, structural scan, and secret scan pass at the recorded product commit and blueprint fingerprint;
- the production direct preflight has no unmet preconditions and uses authoritative worker version, capabilities, and strongest published model observations;
- one Assist compatibility probe completes the full Artifact/transport/FlowStepResult boundary without repair;
- isolated `passed`, `not_passed`, and `unable_to_verify` canaries reach their exact Ends and read back the expected applied-transition behavior;
- retries, comment idempotency, cleanup ownership, run/journey observability, and final binding health are proven;
- an operator has an exact pause/rollback target and evidence set, and explicitly approves Auto promotion.

## 10. Sanitized handoff evidence fields

Record only the following bounded fields, with no credentials, headers, raw response bodies, prompts containing protected values, or unrestricted logs:

- product commit;
- blueprint hash;
- binding ID;
- template ID;
- definition ETag before and after;
- graph hash;
- canary item ID;
- run ID;
- journey ID;
- mode (`local`, `Assist`, or `Auto`);
- outcome (`passed`, `not_passed`, or `unable_to_verify`);
- intended target;
- applied-transition flag;
- Artifact IDs and exact versions;
- final binding status.

Local handoff must state that no live Nuanu mutation has been proved. A rendered graph, successful local suite, report JSON, command exit code, or UI toast is not a durable save, activation, canary, transition, or Auto receipt.
