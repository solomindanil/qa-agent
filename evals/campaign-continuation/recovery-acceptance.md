# Registered CLI recovery — candidate qualification

Status: actual registered process qualification and independent final Lead AQA
review passed for this bounded fixture. Cold-source representative recovery
also passed; [whole-delivery qualification](../../docs/qualification/campaign-continuation-20260914.md)
is independently approved as a portable candidate, not canonical adoption.
This is not a product QA result, source adoption, or cloud-readiness verdict.

## Candidate and entrypoint

- Console: `b54b849ac0438408a2c92f899e5221c7496611d7`.
- Kernel: `185d3e72309a4362db57cf2e805d1c00a5035909`.
- Controlled registration setup: root `757ec0e`.
- Consumer: [recovery.mts](recovery.mts), using the existing registered CLI,
  adapter, classifier, Kernel validation and versioned evidence reader.
- At the original Task6 gate the root manifest still selected its prior pair.
  The separate [Task7 delivery candidate](../../docs/qualification/campaign-continuation-20260914.md)
  now prepares this exact pair through the manifest. It does not migrate the
  user's canonical checkout, installed skills or existing product campaigns.

From an explicit candidate root with its own lockfile-installed dependencies:

```sh
TSX_DISABLE_CACHE=1 QA_STARTER_REPO="$PWD/components/kernel" \
QA_STARTER_EXPECTED_SHA=185d3e72309a4362db57cf2e805d1c00a5035909 \
node --import ./components/console/node_modules/tsx/dist/loader.mjs \
  --test --test-reporter=spec evals/campaign-continuation/recovery.mts
```

No historical registration, original-machine private directory, credentials,
product account or external endpoint is required. The command registers fresh
synthetic workspaces, retains their artifacts, and contacts only its own loopback
API. The source checkpoint must actually be clean; do not substitute a claimed
SHA or loosen the source verifier to run a dirty development tree.

## Reading a selected interrupted run

The caller supplies the exact workspace and run ID from its retained report.
Use the candidate Console's existing `scripts/qa-campaign.ts status --workspace
<absolute-workspace> --run-id <run-id>` through its installed tsx loader. This
operation reads immutable history and makes no target request. Read the selected
run, not the newest directory or a previous PASS. Its original scope, blockers,
accepted results and uncertain executions remain distinct from current authority.

The command `resume` alone cannot manufacture execution permission. Only the
original surviving same-host launcher, holding the original worker handle and
admission, may establish a successor session after actual termination checks.
Host loss or unknown descendants remain blocked. A fresh agent should identify
what is retained, what is incomplete, and the next supported action without
requesting the user to repeat completed work or treating uncertainty as a bug.

For the optional fresh-agent exercise set `QA_CONTINUATION_FRESH_AGENT=1` on the
qualification command. It pauses the healthy case at its actual interrupted
checkpoint for at most180 seconds, printing workspace/run and an external review
marker path. After the independent read-only assessment, the coordinator writes
`ready` plus a newline to that exact owned marker. This resumes only the test
driver; marker contents confer no ownership, death proof or product capability.
The default repeatable tool gate requires no such pause or human participation.

## Acceptance boundaries

The process consumer must demonstrate registered pre/post validation, original
worker termination and helper-group drain, remaining-only requests, preserved
accepted bytes/times and private interrupted files, healthy and seeded-broken
remaining checks, retained blockers, and terminal repeat with zero target probes.
Other crash boundaries, invalid inventory, permission-only recovery, changed
authority/target and duplicate-owner controls retain their explicitly named
filesystem/runner/process evidence classes; they are not all real CLI kills.

## Observed qualification, 14 September 2026

The original two-case driver, with the optional fresh-agent pause enabled, finished exit0:
2/2 tests, no failures, skips or cancellations, 470487.402875ms. Node22.23.1,
macOS arm64. Component sources remained the exact clean pair listed above.
These are harness tests, not two passing product campaigns.

| Observation | Healthy remaining checks | Seeded broken C |
| --- | --- | --- |
| Before original worker SIGKILL | A1 / B1 / C0 | A1 / B1 / C0 |
| After remaining-only execution | A1 / B2 / C1 | A1 / B2 / C2 |
| Final check statuses | pass / pass / pass | pass / pass / needs_review |
| Actual campaign verdict | NEEDS_HUMAN | INCONCLUSIVE |
| Retained independent catalog blocker | 1 | 1 |
| Rejected target requests | 0 | 0 |

Both original worker handles reported SIGKILL; their observed Node/esbuild group
was absent after close. The fresh status process returned partial/null receipt,
A finalized, B uncertain, C unstarted. Real Kernel validation succeeded before
and after continuation with unchanged private/publication-authority digests.
The resumed CLI stdout matched the actual versioned reader receipt; exit1 is
expected for both non-PASS campaign verdicts, and stderr was empty.

All four accepted A files retained original hashes and modification times.
A third terminal invocation made zero additional requests, including identity
probes, and preserved the complete run's file hashes, modes and timestamps.
Both owned-resource finalizers completed. Interrupted B's private directory was
empty in these runs because its response was held; this is **not** evidence for
preserving nonempty partial adapter output. Separate filesystem controls cover
nonempty private-byte preservation.

Raw retained report SHA256s (runtime paths are printed by each reproducible run,
not required from the original machine):

- Healthy: `24e01e59101b1d86b60982fa8e99d70ff671cd532d019bfe8e19aefb95d99de4`.
- Seeded C: `32a0f038d855e8e118ebc6ec2aea6f400c4473a6f394234ae72cdd61a557bedd`.

An independent fresh-context agent received only this entry and the selected
interrupted workspace/run. It used the real status CLI and accepted A result,
reported the exact remaining scope and blocker, and correctly routed B/C to the
original surviving launcher. Observed: zero redundant human questions, repeated
checks, lost scope items or unsupported PASS claims. This is one known-fixture
assessment, not a general reasoning benchmark or another host qualification.

### Additional boundary qualification

The later third case in `recovery.mts` holds the actual host's success reply after
durable B-start publication, before the registered CLI can enter the adapter.
An actual SIGKILL then leaves A1/B0/C0; remaining-only resume yields A1/B1/C1,
retains NEEDS_HUMAN and preserves original accepted bytes. Targeted run:1/1,
exit0,178261.504833ms. Report SHA256
`0db7a334636d10f1ca86987106a72221b7ff37c4d70abf20d485bc7e60c93e0d`.

[sealing-recovery.mts](sealing-recovery.mts) runs the actual registered CLI to
completion, injects a permission-only terminal interruption in that owned run,
and resumes through the same surviving host twice. Original receipt bytes and
mtimes remain unchanged; A1/B1/C1 and all8 identity requests remain unchanged.
Run:1/1,exit0,157107.267167ms; report SHA256
`c29893271c73415f1706ad9f9482e5217437a847951a714e273bb6a959e3f4e1`.
This is explicitly filesystem fault injection followed by real CLI recovery,
not a process kill during chmod. Strict TypeScript subsequently found an inference
error in the new driver; its fix adds only the existing worker type annotation.
All four root eval TypeScript files then passed strict no-emit validation.

The separate [publication boundary tests](publication-boundaries.test.mts) and
[identity boundary tests](identity-boundaries.test.mts) passed18/18 together,
exit0,1987.814667ms. They cover semantic byte-publisher kills around start,
nonempty partial accepted output and retry lineage; fieldwise synthetic authority
drift; and healthy/stale direct terminal sealing. They are lower-layer controls,
not additional registered CLI kills or live identity collector qualification.

Final independent Lead AQA review: spec PASS, source/test quality APPROVED;
no open findings in the frozen b54b849/185d3e7 and reviewed root evals. This
acceptance includes the stated lower-layer proof composition, not a claim that
every crash point was reproduced through the actual CLI.

Cold restored source consumer subsequently passed the healthy and modeled sealing
cases2/2, along with18 boundary controls and59 root packaging checks. This does
not reattribute the warm three-variant gate or add another fresh-agent sample.
Final delivery review is approved; canonical adoption remains separate. Browser/auth/
payment replay, host restart, cross-host recovery and arbitrary mutable products
are outside this slice. The healthy campaign's blocker is intentionally retained,
not a request to the user to intervene in this completed mechanism test.
