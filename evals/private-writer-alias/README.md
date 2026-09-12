# Private writer: case-alias counterexample

This diagnostic exercises concurrent calls to the real Kernel private writer on
a filesystem where `state.json` and `STATE.json` are the **same physical file**.
It is not product QA, a passing recovery gate, or an independent review.

The M4 candidate locks a hash of the textual target path. Both calls can therefore
reach the real rename with one expected digest, but different locks. The probe
allows the first to finish, then lets the second overwrite it. The required
outcome is exactly one successful write, not two successful receipts.

## Replay

Use an explicit normal Kernel checkout with its own lockfile dependencies and
Node22. From that checkout:

```sh
node --import tsx /absolute/path/to/qa-agent/evals/private-writer-alias/probe.mjs "$PWD"
```

The probe creates and retains only a fresh OS-temporary private store. No product,
registered workspace, remote request, account, or installed runtime is used. It
calls the public writer implementation directly. Its two writers are concurrent
calls in **one process**; the other M4 controls test separate processes. Delays
are injected immediately before the native rename; the rename, reads, locks,
mode checks and returned receipts remain real.

- Exit1 with `two case aliases admitted successful writes` reproduces the bug.
- Exit0 means this one alias conflict was rejected as required, not full M4 acceptance.
- Exit2 means the allocated filesystem does not expose this ASCII case alias;
  that is not a PASS. Other failures are fixture/runtime errors to diagnose.

The printed directory contains `REPORT.json` with both actual outcomes and the
final bytes. An unreviewed candidate or a machine with different filename
semantics must not inherit another source's result.

Observed13 September2026 on the M4 candidate whose
`src/kernel/private-store.ts` SHA256 is
`48e4a4fa7bfc4df1a71f105d403bac8077b4ead7ebd8883facaf03cd9b5fef5d`:
both calls succeeded, the first readback was `first`, and final content was
`second`. No fix or source adoption is claimed. The proposed lock-namespace
correction requires agreement and its own RED/GREEN/compatibility review.
