# M3 — two processes can lose a plan update

13 September 2026. **Historical counterexample.** Follow-up repair b474d52 is
[implemented and locally verified](console-plan-write-candidate-20260913.md), but
not independently accepted or active. The original reproduction below is retained.

Source: Console `dc8eb59dfeb2b5231617379096e945f0ccfc09da`, whose
`src/node/qa-campaign-files.ts` is unchanged from canonical b392. This does not
change M2's bounded finalization acceptance. No active source pin changed.

## Actual local probe

The controller created a private temporary workspace and its `tests` directory,
then used the real `writeNewCampaignPlan` to publish a schema-valid empty plan:

```json
{"schemaVersion":"qa-campaign.v0","productSlug":"race-fixture","graphDigest":"sha256:7777777777777777777777777777777777777777777777777777777777777777","baseUrl":"https://fixture.invalid/","checks":[],"blockers":[]}
```

Its canonical digest was
`sha256:9337711c4d12893558f8065dce82cc07fc1ccfcdc6d80a85163cc89941ea7443`.
No campaign or browser was executed; the URL is fixture data, never requested.

Two independent Node22 processes imported the real `writeCampaignPlan`, each
with that same expected digest. Writer A added one blocker with target/reason
`writer-a`; writer B independently added `writer-b`. Both used disposition
`blocked` and recovery `Fixture only`.

A diagnostic wrapper around each process's native `fs.promises.rename`, exposed
to ESM with `syncBuiltinESMExports`, paused only the final destination rename and
sent an IPC ready signal. This held both processes **after both of their real
digest reads**, without changing any returned filesystem data. The controller
released A, waited for successful return and read A's blocker from disk. Then it
released B, waited for successful return and read B's blocker from disk. Both real
renames executed, both processes exited0, and A's update was gone. The temporary
workspace and raw log were retained; source files were not modified by the probe.

This is a controlled filesystem scheduling counterexample, not a measured
frequency in a production race or proof of a corrupted live registration. Probe
exit0 means the **defect was reproduced**, not that the writer passed QA.

## Root cause and bounded proposed repair

Two digest comparisons followed by unconditional rename do not provide an atomic
conditional update. An in-process CLI busy flag cannot coordinate these writers.
Console has no reusable cross-process per-plan admission API; Kernel's private
transaction admission is a different authority, not a drop-in function.

Proposed next slice: use the existing filesystem safety helpers at this owning
writer to acquire exclusive per-plan admission before reading the expected
version, retain it through publication/readback, return a typed conflict to the
loser, and never silently clear an unknown/stale lock. Preserve mode0644,
no-follow/containment controls, old digest rejection and exact owner cleanup.
Qualify interrupted/uncertain publication separately from a definite no-write.
No public Kernel API or second generic lock service is proposed.

The owner subsequently approved the bounded implementation; independent
Lead AQA review is still pending. Required controls: real separate processes, one committed
winner, explicit loser conflict, sequential success, stale digest, restrictive
umask, unsafe path/foreign lock, and interruption without silent retry or cleanup.

Retained raw log SHA256:
`fc86d27636d20586002facf9bb7e9bbb755c9c41269600e9aca7e688140d00e9`.
Raw author paths are not prerequisites for understanding this counterexample.
The eventual repair must deliver its source-owned regression, not rely on this
prose or an unavailable raw log as a gate.
