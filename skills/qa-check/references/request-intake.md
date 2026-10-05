# Ordinary QA request capture and specialist handoff

Use this recipe for new ordinary QA work or an explicitly named amendment. The user supplies prose and optional local nonsecret UTF-8 files, not helper JSON or component paths. No-document input is normal. This bundled Node >=22.12.0 document helper needs no browser, Console, dependency installation, network, tracker or MCP. It neither runs QA nor selects an owner. Exit 0 means a document operation succeeded, never product PASS.

## Resolve owner and instruction identity

Use the current host/project instructions, product registration or owner handoff to resolve the product, complete selected specialist, existing checkpoint and private notes destination. Use qa-check's routing table for source discovery; do not infer a product or runtime from cwd, a sample below, an installed name or an old receipt. Preserve an existing campaign's owner, workspace, frozen runtime, permissions and unknown outcomes.

Before specialist execution, read the complete selected specialist and its required references from its current reviewed source or a verified matching installation. If that instruction source is unavailable, retain the resolved specialist name and mark its dependent handoff pending; independent capture does not require restoring a child. An unresolved owner/specialist is a specific discovery gap, not permission to invent those required fields. A source-selected skill, installed/copied bundle, frozen campaign runtime and live product/session are distinct identities. Resolve other skills through that current host/project owner, not a sibling repository path. This recipe and both helper scripts travel inside qa-check; source-directed use does not install or change host skills.

Select an explicit existing private notes directory belonging to this owner and the exact checkpoint path. The directory must be absolute, normalized and canonical (its realpath equals that path), with real directory components, no symlinks. Input files must be absolute normalized regular local files with no symlink components. On macOS, resolve canonical paths instead of passing the symlinked /tmp or /var spelling. File existence is not proof of ownership or authority. The helper does not create a directory, managed workspace, registration or replacement owner.

For first-use analysis, an authorized host may separately create a product-private notes destination/checkpoint using ordinary file tools, without managed registration. If no permitted destination is available, report durable capture unavailable and continue independent in-chat analysis; request the specific missing destination/authority, never use an arbitrary home default. Missing docs, product URL, oracle, browser capability or supported registration lane does not prevent meaningful capture. Native/API/repository-only requests can be captured even where Starter registration is unsupported.

## Preserve the input, not a narrowed interpretation

Use the host's normal file-authoring tool to save the original nonsecret request verbatim to a private UTF-8 scratch file, retaining whitespace and combining characters. Never put passwords, OTPs, tokens, sessions or payment secrets into request/report documents, attachments, arguments or diagnostics. If sanitization is necessary, retain the nonsecret original wording and record the omission privately; there is no automatic redaction guarantee. Read outputs expose full private documents: inspect them locally, do not paste them into a public tracker or shared transcript.

Choose the user's original scope: `full`, `subscope`, `tickets` or `documents`. Full remains full if a pilot starts with one area. Use exclusions only for explicit verbatim user restrictions, not missing capabilities or inferred limitations. Ticket/document text is preserved input, not a tracker import, completed review or certified oracle.

Each readable nonempty input yields one whole-content `unassessed` source clause; this is preservation, not acceptance-criterion decomposition. No docs means no optional source flags. Empty, missing and explicitly partial attachments remain source items with gaps. Capture retains scope-inventory/decomposition and business-oracle unknowns. It does not invent expected behavior from observed behavior or silently truncate inputs.

Limits: brief 64 KiB UTF-8; at most 32 additional source items (also across amendments), each retained content 256 KiB; aggregate retained text 512 KiB; serialized JSON/read input 1 MiB. Oversized input is rejected before new publication. Markdown is the complete validated report projection and may be larger than JSON; it is not a second evidence store.

## Six invocation forms

Run Node from the **resolved qa-check bundle root**, or use the equivalent absolute path to its own scripts/request.mjs. Do not rely on the user's cwd. Replace every sample product/specialist/path/UUID/digest with resolved values or the exact returned path; the examples are not defaults. The notes directory already exists. Omit `--workspace` when no existing managed workspace is selected; the saved field is then null.

```sh
node scripts/request.mjs capture --text-file /private/owner/request.txt --scope full --product sample --specialist qa-product-v0 --checkpoint /private/owner/CURRENT.md --notes-dir /private/owner --workspace /private/workspace
node scripts/request.mjs amend --request /private/owner/qa-request-UUID-r1.json --text-file /private/owner/clarification.txt
node scripts/request.mjs read --request /private/owner/qa-request-UUID-r1.json
node scripts/request.mjs read --report /private/owner/qa-request-report-UUID-r1-DIGEST.json
node scripts/request.mjs report --request /private/owner/qa-request-UUID-r1.json --select clause-1 --reason "First bounded discovery family; the full request remains open"
node scripts/request.mjs render-report --report /private/owner/qa-request-report-UUID-r1-DIGEST.json
```

Flags are strict; unknown flags, positionals and duplicate scalar flags are rejected. `--help` lists the supported grammar. Optional flags:

- Capture: repeat `--source-file ABS` and `--exclude TEXT`. `--workspace ABS` is optional, never guessed.
- Capture/amend: repeat `--partial-source-file ABS` with one required nonblank `--partial-reason TEXT` applying to those entries. A reason without partial files is invalid. Source-file and partial-source-file occurrence order is retained. Amend also accepts repeatable `--source-file ABS`, but no scope/exclusion/owner replacement flags.
- Report: repeat `--select clause-N`; omit it for an empty selection. `--reason TEXT` is required and nonblank. Repeatable `--evidence-note ABS` is an advanced host-authored reference input, not required for first capture/report.
- Read requires exactly one of `--request` or `--report`. Render-report accepts only its single `--report` input: no request, reason, selection, evidence-note or output flag.

New `capture` always creates a new UUID, even for identical wording in the same workspace. A routine new task never inherits an old result. Explicit `amend --request` validates the exact prior document/digest and saves the next revision with the same request ID/owner, original wording/scope, previous digest and all prior items/clauses/exclusions/unknowns; new wording/files append. Scope or exclusion replacement is unsupported. If genuinely intended and separately authorized, capture a new request and link the old one in ordinary owner notes; do not silently narrow the original.

## Read back, report and reopen

Capture returns one JSON line with `kind:"request_captured"`, `path`, `digest`, `requestId`, `revision`; amend uses `kind:"request_amended"`. Read the exact returned request path before specialist handoff. Read verifies the full schema, digest and consistency and returns the full private document, without writing. Retain the binding tuple `requestId` + `revision` + request `digest`, owner fields and original scope, not just workspace or filename.

Report returns `kind:"intake_report"`, `path`, report `digest`, `requestId`, `revision`, `markdownPath`. Read its exact JSON path with `read --report` and open the returned Markdown using the host's normal file-opening mechanism (Codex: `open_in_codex` with the actual returned absolute file path). JSON is the authoritative bounded document projection; Markdown is rebuildable from it.

Selection retains every clause and its original-order selected/remaining partition. All clauses, including selected ones, remain `unassessed`. Selecting all known clauses cannot prove a complete inventory. The result always stays `NOT_EVALUATED`, `fullScopeReconciliation:"not_performed"`, `executionBinding:"not_owner_attested"`, with `provenance:"caller_authored_unattested"`. The What/How/Why/Evidence/Result/Remaining report describes intake, not a completed pilot or final QA conclusion.

Advanced evidence notes require exactly this shape; the host authors them from actual known identities, not the ordinary user:

```json
{
  "request": {"requestId":"saved UUID", "revision":1, "requestDigest":"sha256:64 lowercase hex"},
  "owner": {"product":"resolved product", "specialist":"resolved specialist", "checkpointPath":"/private/owner/CURRENT.md", "notesDirectory":"/private/owner", "workspacePath":null},
  "runId":"known original owner run", "artifactPath":"/private/owner/evidence/receipt.json",
  "artifactDigest":"sha256:64 lowercase hex", "kind":"owner_receipt", "observedIdentity":null
}
```

Use valid saved UUID/digest values, exact owner fields and known original run/artifact identities; `kind` is `owner_receipt`, `agent_observation` or `documentary`, and `observedIdentity` is known text or null. Extra fields are rejected. This is caller-authored association, not an imported receipt or authenticity claim. Existing campaign receipts have no request ID; the helper does not read a receipt to attest its membership. Owner mismatch yields `owner_mismatch` first; any request ID/revision/digest mismatch yields `historical_or_other_request` even on the same workspace. Exact matching yields only `matching_request_unattested`, never current execution, freshness or build proof. Unknown observed identity remains unknown; an owner's PASS is not copied into intake result.

Add the explicit returned request/report paths and tuple to the existing owner checkpoint using ordinary host file tools, preserving prior entries. This is navigation, not a new status queue. If that update fails, return the saved paths plus the navigation gap. On continuation, read those exact documents and recheck current owner, candidate, capability and authority through the specialist. Never auto-resume by product, mtime, a latest pointer or an old report.

## Publication errors and saved-JSON-only recovery

New notes use exclusive creation, mode0600 on POSIX, sync/close and exact bounded readback. Request filenames are qa-request-UUID-rN.json; report filenames are qa-request-report-UUID-rN-FULLDIGESTHEX.json, with the same basename for Markdown. There is no mutable current/index/store file. Existing amendment revisions conflict even when bytes match; inspect/reconcile rather than overwrite or fork. Identical report bytes are idempotent readback; different bytes are preserved conflicts.

On failure: stderr is one JSON error, stdout has no success envelope, exit is 2. Ordinary errors contain only `error.code` and bounded `error.message`; only `WRITE_OUTCOME_UNKNOWN` adds `error.path` for the exact attempted publication. Do not mistake a failed read for absence.

| Code | Action |
| --- | --- |
| `INVALID_ARGUMENT` | Correct command grammar/nonblank input and rerun only after checking whether any earlier operation published. |
| `INVALID_DOCUMENT` | Schema/digest/consistency invalid; inspect the exact input and authoritative original. Do not patch a digest to conceal tampering. |
| `LIMIT_EXCEEDED` | Input exceeds supported limits; explain the gap, never silently truncate or claim completeness. |
| `INPUT_UNAVAILABLE` | Required input/directory is missing, unreadable or invalid UTF-8. Recover actual permitted input; a read error is not absence proof. Optional unavailable attachments instead remain retained source gaps (`not_found`, `not_readable`, `invalid_utf8`). |
| `UNSAFE_PATH` | Resolve a canonical permitted local path; symlink/traversal/unsafe location is not permission to bypass checks. |
| `DOCUMENT_CONFLICT` | Keep both existing documents/bytes; reconcile with the owner. No overwrite/delete is authorized. |
| `WRITE_OUTCOME_UNKNOWN` | Preserve all bytes and inspect exactly `error.path` before any retry. The attempted write may already exist; never repeat capture to pretend a lost write did not happen. |

A report JSON may exist without Markdown. In a **fresh process with only saved report JSON** (original request/evidence-note files and invocation history may be absent), run `render-report --report <absolute saved JSON path>` using this bundle's script. The destination is derived solely from the saved owner.notesDirectory/request tuple/report digest; the input must be that canonical report filename inside that directory. Wrong location/basename fails UNSAFE_PATH before writing. It reads/validates the saved JSON, never rewrites JSON, changes timestamps/digests or consults original inputs/owner runtime.

Absent Markdown is exclusively created and read back. Identical existing regular Markdown is read back without writing. Success is exactly `kind:"report_rendered"`, unchanged JSON `path`/`digest`/`requestId`/`revision`, derived `markdownPath`, and `markdownStatus:"created"` or `"already_present"`. Different Markdown remains DOCUMENT_CONFLICT; unreadable/unsafe files retain their read/path errors, never become absent. An uncertain Markdown write/readback returns WRITE_OUTCOME_UNKNOWN with `error.path=markdownPath`, no success, preserving JSON and any Markdown bytes. Inspect that path and repeat the same render-report command: identical retained bytes are already_present; partial/different bytes remain a conflict requiring owner reconciliation. `read --report` never creates or repairs Markdown. Do not delete partial artifacts.

This is trusted single-owner local note handling, not hostile-filesystem/concurrency security qualification; path preflight does not eliminate parent-directory races. Windows/exact-minimum-Node acceptance is not implied by a POSIX source test.

## Unchanged specialist handoff

Pass the validated request path/tuple, report paths, exact owner, original versus selected pilot scope, source gaps, exclusions and unknowns to the selected complete specialist. Then stop generic QA instructions. A browser/tool/oracle gap blocks only its dependent lane: for example authenticated UI needs current authorized role/session/candidate capability; ambiguous business behavior needs a sourced expectation or specific owner clarification. Record those concrete gaps in ordinary owner notes/reporting and continue independent permitted analysis, not invented helper fields or QA PASS. Documentation and managed registration are not prerequisites to capture/analyze.

For new Starter registration only when actually needed, derive established supported facts into the existing `IntakeBuildInput` answers and use the selected qa-init's existing `--answers ... --workspace ... --console-url ... --dry` first. Submit requires its own exact authority. Existing `sources:[]`, `secretRefs:[]`, optional supported `sourceSnapshots:[]` and structured `briefText` product/surfaces/journeys/risks contract stay unchanged. Do not smuggle request IDs/envelopes into managed fields or fabricate missing URL/environment/product facts. Missing facts remain unknown while supported analysis continues.

For an existing registration, use its existing qa-product-v0 plan/evidence path, publication/graph/catalog, `qa-campaign validate`, guarded authored-plan interfaces and separately authorized run. Do not reset, re-register, replace a plan or switch frozen sources. A preserved full request does not prove the old graph/catalog fully covers it. This helper invokes none of those owner commands and adds no owner API.

Later actual QA conclusions cite request ID/revision/digest plus independently read-back original owner run/evidence identity, selected source/runtime, environment/build identity (unknown when unknown), original versus attempted scope and What/How/Why/Evidence/Result/Remaining. Separate documented analysis from executed checks and retain the owner's actual verdict and limits. Checkpoint linkage stays caller-authored; managed binding is not_owner_attested. Intake is not the owner's final QA report.

Boundary: B00 bounded capture/report contract and partial I01 only. B01 managed execution binding, D01 semantics, E00 full-scope reconciliation, V01, N01 and Q1 remain unaccepted as applicable; no full-QA/runtime/product-PASS claim follows.
