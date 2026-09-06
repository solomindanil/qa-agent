# Human-help continuation — bounded local qualification

2026-09-07, active Kernel `393af209a7629d075258fd1050224db071817a47` / Console `b38a8b48cf7dd1646998b3d98427efd99a59d14f`. Existing APIs support the tested continuation strategy without a runtime change. This is not a durable-resume API, a live human handoff, or completion of G3.

## Observed behavior

The disposable fixture used the real campaign CLI and Playwright API adapter against loopback HTTP. Initial setup registered/published one fixture. Before saving the caller checkpoint, it revised the canonical plan through the existing compare-and-swap writer. A new process then reopened that checkpoint, current plan and prior receipt. No graph/catalog/registration change occurred during recovery.

| Control | Observed result |
| --- | --- |
| Capability unavailable (503) | The dependent check remained blocked; an independent authored check actually passed |
| Simulated help says ready, capability still 503 | Fresh caller remained blocked; no new CLI run |
| Capability actually ready (200) | Fresh process executed only the remaining check and created a new receipt |
| Actual remaining-check response deliberately wrong | Unchanged oracle failed on the runner's two built-in attempts; independent check was not repeated |
| Omitted prior check relationship, changed resolved oracle, stale plan CAS | Existing guards rejected before adapter calls or new run artifacts |
| Final readback | Three separate immutable run trees and all indexed artifacts remained unchanged |

The independent endpoint was called **once in total**. The remaining endpoint was called once successfully and twice in the deliberate negative. There were four capability readbacks and no unexpected fixture requests.

All three real CLI runs exited 1 as expected: `NEEDS_HUMAN`, `NEEDS_HUMAN`, then deliberate fixture `PRODUCT_FAIL`. The qualification test itself exited 0: **7 TAP records = 6 subtests + 1 parent**, no failures/skips/cancellations. This is not seven product scenarios. The catalog retained three checks and three targets; both executed checks share one target, so executable and blocked target counts overlap and must not be summed.

## Limits that remain important

- The checkpoint and previous/current receipt link are caller-owned. The runtime does not import the earlier pass or issue a cumulative sealed verdict. Text in a blocker is not runtime proof; the fixture caller separately verifies the linked receipt's bytes.
- Recovery writes a **new run**, not a continuation of the old receipt. The checkpoint is not consumed: another invocation can execute the remaining plan again. This does not prove exactly-once recovery or authorize retry of unknown mutations/payments.
- The operator and capability are simulated. Real human-input plugin, device/account handoff, Claude↔Codex recovery, live deployment drift, automatic wakeup and cloud execution are not qualified.
- Two qualification test files are still disposable sources. The accepted component pins, runtime, skills and installed environment are unchanged. Reusable regression packaging is a separate reviewed candidate.

## Evidence and failed first attempt

Root read the complete test sources, report, TAP, HTTP journal and independent review; verified all 202 indexed files (920458 bytes), then separately reread three receipts and all 10 indexed artifact byte counts/hashes. Independent Lead AQA review found no blocker to this scoped result.

The first attempt was retained: 3 passing / 4 failing TAP records. An absolute host path in fixture-authored public blocker text correctly triggered `PRIVATE_HOST_PATH_DETECTED`. A separate corrected copy changed one line to the workspace-relative receipt path, keeping the receipt hash. No guard, assertion or timeout was weakened. Root also verified its 216 indexed files (864170 bytes).

| Artifact | SHA-256 |
| --- | --- |
| Qualified REPORT | `428209da226a683982cea343b2da456e606fa9f5ce9413f43cd7580ba27258a5` |
| Qualified MANIFEST (202 members) | `ba08bd5aa8ea8f610447b649507c44baf1c3d5148a744ac6c7a949714dfc6b56` |
| Failed first-attempt MANIFEST (216 members) | `c118e02b0f84e5be5a9d171ec22c04a12a3bc0044ed4c7cb52bc58f295d0bd4f` |
| Qualified caller test source | `738017196ab97d7bad9558bbc7c78e9b6db48c1f9a637a8d9abf73c642c18afe` |
| Qualified unit test source | `bd103fbdbd698c5042810503765dfc336346efcee7aa8c3bd53b231cb43f0df4` |

Byte-preserving private copies and the original→copy map are in the coordinator root's ignored `.local/qualification/human-help-20260907.oL9lHS/`. They preserve original report paths and are evidence, not relocated runnable workspaces. Dependencies/Git/cache directories were not copied. No campaign should be rerun against the closed retained fixture server.

Next: preserve the useful regression through ordinary source review, then qualify a real host/human-help case when it occurs. Do not build a second scheduler or resume engine merely to turn this scoped result into a larger claim.
