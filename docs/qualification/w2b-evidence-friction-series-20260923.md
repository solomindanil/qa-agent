# W2b synthetic browser/API/MCP evidence series — 23 September 2026

## Scope and source

This is a controlled, read-only local fixture, not QA of rw-int, Freeland or another deployed product. Root source was `a8a618c44b66a1e159453cea3c37a543fc2dd4e6` on `codex/p2-semantic-source-delivery`; the selected Kernel was `aa5d2d188606cbcf7e3111c130347a36970ec786` and Console `a94571175ca893a5a66eafb5c3d06801238ad04d`. The Console change was reference-only; no runtime or installed host skill was modified by this trial.

The private fixture lives at `/private/var/folders/wb/zqtxc1qs7sqgspnt3vwlmr640000gn/T/qa-w2b-series-uXnZwe/nuanu-readonly-qa`. Its publication is `sha256:66e94b4b6c0dc74681e0905d8516e1f9d5998f5efd6ae9793e9e0dfc90abc63b`. The existing reviewed synthetic oracle says only urgent Backlog issues are returned, with `NFE2E-105` as exact witness. The HTTP endpoint, a separate in-app browser view, and a disposable local stdio MCP `filter_issues` tool all read the same loopback fixture. The MCP tool fetched that HTTP endpoint; it was not a production connector. No external product/tracker action, payment, account change, or actual campaign run occurred.

## Capture and storage

| Lane | Observed capture (UTC) | Narrow result | Stored evidence ID |
| --- | --- | --- | --- |
| HTTP API | 15:30:29.113 | 200; `count=1`; only `NFE2E-105`, urgent/Backlog | `urn:qa:evidence:35b44848a5b8c23e75c62f8f` |
| Browser | 15:31:18.591 | Accessibility state rendered one matching list item and `Completed: 0 issues`; marked **partial** because rendered text does not attest the network request or hidden results | `urn:qa:evidence:9515e63664384b8702b1072c` |
| MCP | 15:43:51.537 | Stdio initialize/list/call returned `isError=false` and the same HTTP-backed JSON | `urn:qa:evidence:b129fb31b564e4c299b6d9c2` |

The caller-authored `captureTime` values are distinct from `author.authoredAt` (15:45:40.567, 15:45:41.786, 15:45:43.037 UTC). They were transcribed from the actual capture outputs, not backdated to the publication. The Kernel verifies stored bytes/bindings, not tool invocation or clock truth; all three payloads remain `agent_authored_unattested` with `attachments: []`. No screenshot was put in the JSON channel.

Registration took 30.52 s and publication 10.47 s. Per-record envelope preparation after the fixture and oracle were known was 0.13–0.20 ms of compute-only work; it excludes the agent's reasoning and tool capture. Direct Kernel append **including its verified readback** took 1.22 s (API), 1.25 s (browser), 1.30 s (MCP). A separate `validateWorkspace` proxy took 2.06/1.18/0.81 s across three calls; it is not a separately instrumented duration of the writer's internal authority-validation step, so the exact component split remains unknown.

A new Node process read the saved IDs independently in 1.04/0.84/0.85 s and the full target report in 3.38 s. The report retained **2 targets / 3 current observations / 1 `not_observed` target / 2 global blockers / 0 diagnostics**. Recorded observations did not convert the other target into PASS or disappear from history. A same-ID/same-envelope retry returned the same payload and manifest in ~1.23–1.28 s without a new observation. A correctly rehashed conflicting payload was rejected as `AGENT_TOOL_OBSERVATION_CONFLICT`; a different existing target without the reviewed check relationship was rejected as `AGENT_TOOL_OBSERVATION_INVALID`.

For an interruption control, only the exact MCP record's synthetic manifest file was temporarily removed after its path and current binding were verified. A read then returned `AGENT_TOOL_OBSERVATION_MISSING`; an identical-envelope retry restored the manifest with the original payload, binding and artifact inode. No material data remains deleted. This is an artifact-only interruption simulation, not an OS crash or a proof of exactly-once external effects.

## Decision and remaining boundaries

The earlier API-only diagnostic measured a 12.09–15.04 s separate Console CLI read and showed three repeated provenance checks account for much of that path; its paired Console bridge trial timed out and is **not** retrospectively a PASS. This new direct-Kernel series is not an apples-to-apples CLI-vs-API benchmark, but it verifies the three capture classes can use the existing writer's returned readback, a genuinely fresh reader, and the full-scope report. No recurring schema/binding failure was observed in these three prepared records. **Do not add an observation constructor/exporter or weaken authority checks now.** The delivered Console reference already removes the unnecessary immediate second read for the same caller. The distinct D13-479 graph/catalog/coverage authoring decision still needs its own API/browser/manual examples and controls; evidence-write success does not close it.

W1 live remaining-only remains open. A read-only attempt to bind the known rw-int Chrome owner tab timed out in the browser tool, so this trial did not verify a current signed-in account or execute another product assertion. The existing rw-int owner report already contains same-day observations; no completed product action was replayed. A supported owner-session readback and a selected unobserved assertion are required before any live W1 claim.
