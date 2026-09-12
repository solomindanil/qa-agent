# Console campaign interruption — diagnostic counterexample

This is a reproducible **known gap**, not a recovery implementation, acceptance
test, independent agent evaluation or product QA. It is deliberately outside the
root packaging test glob. An exit0 means the stated limitation was reproduced.
Do not count it as a passing resume gate or keep its limitation assertion once
the owning runtime gains real continuation support.

## Measured behavior

On inactive Console6e84afbeef9dc660fd7b5b4c7096c17e7cfd72f0:

1. The actual catalog-bound runner and Playwright API adapter finish `GET /first`.
2. The owned server receives and holds `GET /second`; the parent sends SIGKILL to
   its owned worker process group. No fabricated timeout or synthetic exception.
3. The first attempt's actual result/trace and canonical plan survive byte-for-byte.
   No terminal receipt exists and no owned process remains.
4. A new process calls the actual evidence reader. It returns `null`, not a
   partial, completed or resumable campaign result.
5. Ordinary execution in another process creates a new run and calls `/first`
   again. The reader accepts this new complete run. This is **rerun, not resume**.

Both read-only requests are strictly confined to a newly allocated127.0.0.1
server. All temporary files belong to the probe and are retained. The test child
receives a narrow environment without copied credentials or product URLs.
It does not initialize a managed registration or exercise the registered CLI,
browser process recovery, host restart, native devices or payment retries.

## Portable replay

Restore `sources/candidates/console-public-input-readback-6e84afb.bundle` into a
fresh normal clone and install **that clone's** lockfile (`npm ci --ignore-scripts
--no-audit --no-fund`). Node22 and a POSIX host are required. From that clone,
run the root-owned [probe.mjs](probe.mjs), passing its absolute path:

```sh
export QA_CONTINUATION_CONSOLE_ROOT="$PWD"
node --import tsx /absolute/path/to/qa-agent/evals/campaign-continuation/probe.mjs
```

The source input is explicit, constrained to6e84afb, and requires unchanged tracked
`src/` and `server/` bytes. This is a local fixture guard, not an attestation service.
No author registry or original-machine file is needed. The final JSON prints the
retained audit directory; `REPORT.json` includes process IDs, requests, byte hashes
and the outcome of the separate reader processes.

Fresh portable run13 September2026: exit0, interrupted worker killed by SIGKILL,
first request observed twice across original/rerun, no product network calls.
Raw report SHA256 `2ccd2cf4b55bab7d4c412f5edbcdb8a606e35f041f999d924e5c4283bf421a5f`.
The historical raw report is private; this nonsecret source makes the behavior
reproducible. The first development probe independently reproduced the same gap.

## Owning next step — design before implementation

`runQaCampaign` already persists per-attempt artifacts; `readLatestCampaignEvidence`
deliberately ignores nonterminal runs. Registration/discovery resume APIs concern
different state and are not a campaign resume implementation. Do not make the
reader accept half-written receipts or relabel the old trace as newly sealed PASS.

Reuse existing campaign identity, artifact writer/reader, status classification,
scope and effect policy. The next bounded design must resolve:

- how a run records its complete input identity before first dispatch;
- how a finished check becomes a durable checkpoint only after adapter finalization;
- how a fresh consumer distinguishes completed, unstarted and uncertain attempts;
- one continuation owner, exact unchanged product/source/plan boundary, no stale
  transfer to a new candidate, and readable nonterminal scope;
- preserving completed work while unknown operations require reconciliation, not
  blind replay; the present runtime is read-only, not a money authorization layer.

Compare a small extension to the current run's artifacts against a per-check
terminal-run orchestration using existing tools. Choose based on the actual
consumer contract; do not create a second runner/journal or broaden I2 without
need. Required acceptance is this actual interruption followed by remaining-only
execution and a valid final readback, plus a stale-input/second-owner negative.
Until then, human-help fixture success and durable individual files do not close
Stage3's real campaign recovery exit.

### Additional source seams found before implementation

The following are source inspection findings on Console6e84afb and Kernel15a067c,
not extra outcomes of the two-request probe:

- `scripts/qa-campaign.ts` validates the managed workspace before invoking the
  runner. Kernel `src/kernel/workspace-validator.ts` accepts the campaign run
  directories as sealed0500 and result files0400. The interrupted runner leaves
  unsealed0700/0600 entries. The registered CLI boundary therefore needs its own
  actual recovery test; bypassing it with a direct API is not sufficient.
- Console `server/campaign-receipts.mjs` mirrors that file grammar and exact
  artifact inventory. Adding arbitrary checkpoint files without updating both
  owning consumers would invalidate completed evidence. Do not loosen unknown
  file admission generally or delete abandoned evidence to unblock validation.
- The current binding covers graph, plan and registered product/baseURL/catalog;
  it does not itself freshly collect a live deployment identity or account state.
  Resume must not claim an unchanged candidate from that binding alone. Qualify
  the supported fresh-context mechanism and retain explicit uncertainty where a
  product cannot provide it.
- A per-check terminal-run workaround changes the canonical whole-scope plan and
  needs new aggregation semantics. It is not automatically simpler than extending
  the existing run and should not silently replace the current full-scope reader.

The next design must cover this actual execution path, not just a helper returning
the desired status. No continuation runtime or interface has been changed here.

### Registered workspace/CLI grammar — separately executed diagnostic

[registered-probe.mjs](registered-probe.mjs) now exercises the real Console intake
builder, registration service, Kernel publication/validation and CLI. It does
**not** repeat the two-request crash through the CLI:

1. Register a fresh synthetic HTTPS product with real immutable source bindings.
   Registration completes; Kernel validates the new workspace.
2. Invoke the real CLI with a deliberately absent plan. It passes workspace
   validation and stops at ENOENT, before adapter creation or product dispatch.
3. Create one **synthetic**0700 campaign directory with the actual accepted run-ID
   grammar. This models the directory mode observed in the separate SIGKILL probe.
4. Kernel now reports exactly WORKSPACE_ENTRY_INVALID for that entry. The same CLI
   stops earlier, at workspace preflight. It does not delete, rewrite or seal the
   directory, and all other test files remain unchanged.

This proves the registered preflight limitation, not real CLI crash recovery,
successful product execution or an assertion that every restart corrupts a
workspace. The earlier runner/reader SIGKILL result retains its separate scope.
A first draft attempted loopback intake and was correctly refused: this Console
registration lane requires a canonical public HTTPS root. No URL policy, TLS,
DNS, source validator or production interface was weakened for the diagnostic.
The synthetic URL is never contacted; the absent plan prevents dispatch even if
the workspace validator later accepts nonterminal entries.

Replay from an independent Console6e84afb clone with its own lockfile dependencies;
restore Kernel15a067c from the repository's active source bundle and install its
own lockfile dependencies as well. Both paths must be explicit and tracked source
bytes unchanged. Node22/POSIX, no original-machine registry or credentials:

```sh
export QA_CONTINUATION_CONSOLE_ROOT="$PWD"
export QA_CONTINUATION_KERNEL_ROOT=/absolute/path/to/restored-kernel
node --import tsx /absolute/path/to/qa-agent/evals/campaign-continuation/registered-probe.mjs
```

Exit0 means the known preflight limitation was reproduced. REPORT.json records
registration identity, both validator outputs, both actual child CLI exits and
the retained file inventory. It remains a diagnostic outside root packaging
tests, not a passing recovery gate. A fixture with an invalid run-ID would only
prove generic path rejection; this probe explicitly rejects that false evidence.

Fresh run13 September2026 exited0 on the exact source pair above. Registration
completed, the clean workspace validated, and the only post-fixture diagnostic was
WORKSPACE_ENTRY_INVALID at the modeled run directory. The two child CLI exits were
both1, intentionally at different pre-dispatch boundaries. This is not two passed
campaigns. Raw report SHA256:
`4fe804d1d8032eac4f9c05993a9169d2caa35e7587be4e4b7c0b4c133cb01648`.
