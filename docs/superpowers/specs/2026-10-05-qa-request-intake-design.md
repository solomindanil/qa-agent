# B00/I01: host-native QA request capture and bounded intake report

Date: 2026-10-05. Architecture author: Astra. Status: exact design for independent pre-code AQA; not implementation or QA acceptance. The user has resumed implementation and accepted the global direction; this document does not ask for that approval again.

## 1. Decision and boundary

Use ordinary Codex/Claude chat plus supplied text/local UTF-8 files through the root `qa-check` skill. Add one dependency-free, bundled local **document helper**, not another QA runner. It creates immutable request/revision and intake-report documents in the selected owner's **existing private pack/checkpoint notes directory**. There is no global registry, database, mutable `current` file, execution service, scheduler, installation, network access, tracker write or MCP prerequisite.

**NO-NEW-OWNER-API:** do not alter Console/Kernel schemas, runtime source, bundles or manifest pins in this slice. There is a new root skill-local CLI and document format, explicitly not a Console/Kernel API. Ordinary users supply prose, not JSON, component paths or a registration interview. The host agent resolves ownership and invokes the helper using the recipe. The helper never chooses a product specialist or establishes action authority.

This completes B00's narrow executable input/report contract and a **bounded, partial I01 implementation**: durable request capture, original full-scope preservation, revisions and request-local report association. It does **not** complete B01's managed execution binding, D01 semantics, E00 full-scope reconciliation, V01, N01 or Q1. Existing campaign receipts have no request ID. A request-local reference to one is caller-authored association, not owner-attested request membership. No helper result is a product PASS or current-deployment assertion.

## 2. Source evidence and selection

Inspected integration root: `/Users/danilsolomin/projectsnew/qa-agent-release-20260926/.local/quality-mcp-clone`, branch `develop`, HEAD `378f9f778420c431d256a2f1df61ac216a4377b9`. `npm run sources:verify` returned `sources_verified` for all four components. Selected active pair remains Kernel `847777a7a87c55a7648ac155da2e18d6593aa16a` and Console `014940a4a59cd9c6f51add59acde710cfdbaa1ba`. The root's current qualification still contains earlier paused/branch prose; the explicit resumed task controls implementation authorization, not runtime acceptance. Other dirty root documents belong to the parent workflow and are not this design's edit targets. No child AGENTS.md or CLAUDE.md was found under the selected Console/Kernel trees.

Source-bound reasons for the decision:

| Existing source | Actual capability / limitation | Design use |
| --- | --- | --- |
| `skills/qa-check/SKILL.md` | Routes once; preserves owner, specialist and unknowns | Capture before routing handoff; specialist still owns QA |
| `components/console/skills/qa-product-v0/references/product-analysis.md` | Analysis before registration; existing pack/checkpoint notes hold sourced knowledge/gaps | Store request/report as ordinary owner notes, never managed graph fields |
| `components/console/src/lib/intake-build.ts`, `buildRecordedIntakeSubmission(input: IntakeBuildInput): Promise<RecordedIntakeSubmission>` | Brief-only supported; optional snapshots; structured brief permits exactly product/surfaces/journeys/risks | Derive established product facts without inserting the new envelope into `briefText` |
| `components/kernel/src/contracts/recorded-intake.ts`, `RecordedIntakeV1Schema` | Strict registration contract; no per-request full/subscope/revision | Do not extend or overload it |
| `components/console/skills/qa-init/SKILL.md` and `scripts/qa-init.ts` | Existing dry/submit/reconnect route; black-box public HTTPS web/landing baseline; optional docs | Actual registration only if absent and separately authorized |
| `components/console/src/lib/qa-campaign-v0.ts`, `QaCampaignPlanV0Schema` / `QaCampaignReceiptV0Schema` | Strict plan and receipt; graph/plan/run identities, no request identity | Reuse exact owner commands, do not add fields or reinterpret verdict |
| `components/console/src/node/qa-campaign-files.ts` | Managed plan CAS/exclusive creation and campaign artifact writes | Leave unchanged; do not create fake run directories to store requests |
| `components/console/skills/qa-product-v0/references/agent-observations.md` | Existing attributed observations/reviews and owner checkpoint fallback; not managed PASS | Report provenance and storage limits remain explicit |

Required component references were read: product-analysis, declarative-campaign, agent-observations. Registration readiness is not a universal no-doc QA prerequisite. Native/API-only/repository-only requests can be recorded and analyzed even when this registration lane is unsupported. A missing registration does not authorize replacement of an existing workspace.

## 3. Exact files and interfaces

Create only these implementation files:

- `skills/qa-check/scripts/request-contract.mjs`: pure validation, digesting, revision, association and report projection. Node built-ins only.
- `skills/qa-check/scripts/request.mjs`: bounded file I/O CLI for ordinary document capture/read/report. No child imports, fetch, subprocesses, environment-derived owner paths or execution commands.
- `skills/qa-check/references/request-intake.md`: complete bundled host recipe and examples; no dependencies on sibling repository paths in this copied bundle.
- `tests/qa-request-contract.test.mjs`, `tests/qa-request-cli.test.mjs`: local synthetic tests using Node's test runner and temporary owner notes.

Modify `skills/qa-check/SKILL.md`, `tests/generic-skill-bundles.test.mjs`, `docs/getting-started.md`, `skills/README.md`. No dependency/lock/package-script changes. No child or manifest changes; therefore no child bundle publication is needed. The implementation is root-source delivery only; installed host skills and frozen campaigns remain untouched.

Public module signatures (JSDoc typedefs, runtime strict validation):

```ts
captureRequest(input: CaptureInput, previous?: RequestRecord): RequestRecord
validateRequest(value: unknown): RequestRecord
validateIntakeReport(value: unknown): IntakeReport
requestBinding(record: RequestRecord): RequestBinding
associateEvidence(request: RequestRecord, evidence: EvidenceAssociation): AssociationCheck
buildIntakeReport(request: RequestRecord, selection: Selection, evidence: EvidenceAssociation[]): IntakeReport
renderIntakeReport(report: IntakeReport): string
documentDigest(value: unknown): string // sha256:<64 lowercase hex>
```

`captureRequest` is pure: IDs/time are inputs, not hidden globals. `documentDigest` accepts only finite JSON values, plain objects, no undefined or sparse arrays; recursively sort object keys using JS code-unit order, retain array order and **exact strings** (no NFC normalization), serialize compact JSON plus one newline, hash UTF-8. Emit object properties directly in that sorted order; do not sort into an ordinary object and then JSON.stringify it, because integer-index keys would be reordered numerically. Scalars and property names use JSON.stringify escaping/number formatting; arrays join recursively serialized values in their original order. This is a distinct local document protocol, not Kernel canonical semantics. Reject unpaired UTF-16 surrogates so exact UTF-8 round trips are meaningful. Every envelope digest excludes only its own top-level `digest` field. Nested digests are included. Verify supplied digests on read rather than trusting them.

Independent fixed canonical vector: input `{"2":"two","a":"A","10":"ten"}` serializes to the UTF-8 bytes `{"10":"ten","2":"two","a":"A"}` followed by one LF byte. Expected digest is `sha256:da02c0e348f56f105931b549df300c43e518593fb3235ec7fa6d7a3e06949373`. This constant was computed from that explicitly authored byte string, not by the proposed documentDigest algorithm; the test must use the fixed constant as its oracle.

### Request data

```ts
type Scope = 'full' | 'subscope' | 'tickets' | 'documents';
type RequestBinding = { requestId: string; revision: number; requestDigest: string };
type OwnerRef = {
  product: string; specialist: string;
  checkpointPath: string; notesDirectory: string; workspacePath: string | null;
};
type SourceItem = {
  id: string; kind: 'request' | 'text_file'; locator: string;
  content: string | null; contentDigest: string | null;
  availability: 'complete' | 'empty' | 'partial' | 'unavailable';
  limitation: string | null;
};
type Clause = { id: string; sourceItemId: string; text: string; status: 'unassessed' };
type Unknown = { id: string; kind: 'scope' | 'source' | 'oracle' | 'capability'; text: string; sourceItemIds: string[] };
type CaptureInput = {
  requestId: string; capturedAt: string; owner: OwnerRef; scope: Scope;
  text: string; sourceItems: SourceItem[]; exclusions: string[];
};
type RequestRecord = {
  schemaVersion: 'qa-request-note.v1'; provenance: 'caller_authored_unattested';
  requestId: string; revision: number; previousDigest: string | null; capturedAt: string;
  owner: OwnerRef; originalText: string; originalScope: Scope;
  items: SourceItem[]; clauses: Clause[]; exclusions: string[]; unknowns: Unknown[];
  decomposition: 'pending'; digest: string;
};
```

All fields above are required and extra fields are rejected recursively. IDs: request UUID v4 lowercase; item/clauses/unknown IDs are local `item-N`, `clause-N`, `unknown-N`, positive decimal without leading zero. Revision positive safe integer. Timestamp strict ISO UTC with milliseconds and a valid round-trip Date. Paths are absolute local paths without NUL; the helper does not make their mere existence into proof of owner identity. `product`, `specialist` are nonblank text, no product-specific whitelist. `checkpointPath` and `notesDirectory` must be resolved by the host from the selected owner; first-use analysis can select a private notes directory for this product with user-authorized local authoring, without creating a managed workspace. If there is no permitted destination, report capture unavailable and continue independent in-chat analysis, never write to an arbitrary home default.

Initial capture:

- `text` is nonblank original nonsecret user wording, at most 64 KiB UTF-8. Preserve all bytes of supplied text, including whitespace and combining characters; do not trim the saved original. Reject empty/whitespace-only input, not an incomplete meaningful brief.
- Create `item-1` (`kind=request`, `locator=host:request`, exact text/content digest). `clause-1` points at it and contains that same text. This is a source-preservation clause, **not** a decomposed acceptance criterion. Add a single whole-content clause for each readable nonempty supplied file. No LLM parsing inside the helper.
- At most 32 additional source items; each retained content at most 256 KiB, aggregate retained text including request at most 512 KiB. Reject oversized input before publishing anything; never silently truncate. Explicit partial source input preserves exactly the available text and its limitation. Empty/unavailable source has no clause but a retained item and source unknown. Missing file after an explicitly named attachment is an unavailable item, not silently omitted. Other read failures likewise become unavailable with bounded machine reason (`not_found`, `not_readable`, `invalid_utf8`), never raw private error bodies.
- Every request starts with scope unknown `Scope inventory and clause decomposition have not been assessed` and oracle unknown `No business oracle has been established by request capture`. No-document input is `sourceItems=[]`, not an error or an invented document. Source incompleteness adds one source unknown per affected item.
- Exclusions are explicit verbatim user restrictions (repeatable CLI flags), not limitations inferred from missing tools. Full mode remains full even with exclusions; those exclusions need later E00 scrutiny. Operationally impossible checks belong to unknowns/remaining, not exclusions.

Amendment:

- Explicit `amend --request` only, never automatic lookup by product/workspace. Validate the prior record/digest. Keep request ID and exact owner, originalText, originalScope, previous items/clauses/exclusions/unknowns. Increment revision by one and set previousDigest to prior digest. Append the amendment text as the next request item and a new unassessed source clause, plus new source items. Do not remove/relabel old scope. Scope/exclusion replacement is unsupported in this slice: capture a separately authorized new request with the old one linked in ordinary owner notes if that is genuinely intended. This avoids inventing scope-change authority.
- New `capture` always obtains a new UUID even for identical wording in the same workspace. `amend` is an explicit continuation; a routine new task is not.

### Selection, evidence and report data

```ts
type Selection = { clauseIds: string[]; rationale: string };
type EvidenceAssociation = {
  request: RequestBinding; owner: OwnerRef;
  runId: string; artifactPath: string; artifactDigest: string;
  kind: 'owner_receipt' | 'agent_observation' | 'documentary';
  observedIdentity: string | null;
};
type AssociationCheck = {
  state: 'matching_request_unattested' | 'historical_or_other_request' | 'owner_mismatch';
  reasons: string[];
};
type IntakeReport = {
  schemaVersion: 'qa-request-intake-report.v1'; provenance: 'caller_authored_unattested';
  request: RequestBinding; owner: OwnerRef; originalScope: Scope;
  selectedClauseIds: string[]; remainingClauseIds: string[];
  clauses: Clause[]; sourceItems: SourceItem[]; exclusions: string[]; unknowns: Unknown[];
  rationale: string;
  evidence: { reference: EvidenceAssociation; association: AssociationCheck }[];
  result: 'NOT_EVALUATED'; fullScopeReconciliation: 'not_performed';
  executionBinding: 'not_owner_attested'; digest: string;
};
```

Report selection IDs must be unique and present; remaining is the exact original-order complement. Empty selection is allowed and means no executable/decomposed scope selected; blank rationale is rejected. Selected clauses stay `unassessed`; selection is not execution. A full request with any bounded family remains full + NOT_EVALUATED, all clauses retained. Even selecting every current clause cannot prove full inventory: decomposition remains pending and fullScopeReconciliation is not_performed. There is no percentage or count-derived PASS.

Evidence association compares **all** request binding fields and the exact owner fields, not workspace alone. Owner mismatch takes precedence. A same-request older revision is historical, a second request on the same workspace is another request. Matching does not attest authenticity, fresh execution, provenance, source applicability or build identity. The helper never reads a receipt as proof of its own request membership. `observedIdentity=null` remains unknown. Unknown extra fields such as `current:true`, `PASS`, `verified` are rejected rather than ignored. Existing owner receipt verdicts are not copied into intake `result`.

The report renderer includes: original scope/request ID/revision; What (every source clause and selected/remaining); How (intake capture only; no execution bound); Why (user scope and selection rationale, not hidden reasoning); Evidence (references + their association and identity limits); Result (NOT_EVALUATED); Remaining (all clauses unassessed, source gaps, exclusions, owner follow-up); checkpoint/workspace/source paths as plain escaped text, not executable HTML. Markdown metacharacters in supplied text must be fenced safely or escaped; use dynamic fences longer than any input backtick run. No raw HTML rendering. The complete JSON report is the authoritative document projection; Markdown is rebuildable from it, not another store.

## 4. Executable host path and persistence

The user says, for example: “Check the whole product at https://example.test; start read-only. I have no docs.” The host reads root source instructions, resolves the specialist/current owner, writes that **sanitized original message verbatim** to an owner-private scratch text file, and runs the bundled script. No real hostname is contacted by this helper.

Supported commands (Node >=22.12.0; flags are strict; repeated flags only where stated):

```sh
node skills/qa-check/scripts/request.mjs capture --text-file /private/owner/request.txt --scope full --product sample --specialist qa-product-v0 --checkpoint /private/owner/CURRENT.md --notes-dir /private/owner --workspace /private/workspace
node skills/qa-check/scripts/request.mjs amend --request /private/owner/qa-request-UUID-r1.json --text-file /private/owner/clarification.txt
node skills/qa-check/scripts/request.mjs read --request /private/owner/qa-request-UUID-r1.json
node skills/qa-check/scripts/request.mjs read --report /private/owner/qa-request-report-UUID-r1-DIGEST.json
node skills/qa-check/scripts/request.mjs render-report --report /private/owner/qa-request-report-UUID-r1-DIGEST.json
node skills/qa-check/scripts/request.mjs report --request /private/owner/qa-request-UUID-r1.json --select clause-1 --reason "First bounded discovery family; the full request remains open"
```

`--workspace` optional on capture → null, never guessed. `--source-file` and `--exclude` repeatable on capture; `--source-file` repeatable on amend. For explicit partial text use repeatable `--partial-source-file path` paired with one required `--partial-reason` applied to those entries; reject reason without partial file. Caller source order is CLI occurrence order. `--select` repeatable on report, omission means empty selection. `--evidence-note` repeatable on report accepts an existing caller-authored association document as specified above (advanced agent input only; ordinary user never writes JSON). It does not import arbitrary owner receipts or upgrade them. This advanced input exists solely to retain accurately attributed references and test wrong-request evidence; first capture/report needs none. `read` requires exactly one of `--request` or `--report`; both forms validate full schema, digest and internal consistency. `validateIntakeReport` recomputes the selected/remaining partition, evidence association classifications and fixed result/boundary fields from the embedded data and binding rather than trusting claimed classifications.

Output of mutation-like document commands is one JSON line with `{kind, path, digest, requestId, revision}`; report additionally returns `markdownPath`. `read` returns the validated full selected request or report JSON, marked private in recipe, and never writes. Errors emit `{error:{code,message}}` to stderr, exit 2, no success envelope; WRITE_OUTCOME_UNKNOWN alone adds `error.path` naming the exact attempted publication path. Supported codes: INVALID_ARGUMENT, INVALID_DOCUMENT, LIMIT_EXCEEDED, INPUT_UNAVAILABLE, UNSAFE_PATH, DOCUMENT_CONFLICT, WRITE_OUTCOME_UNKNOWN. Diagnostics never echo contents or secret-bearing input. Exits 0 indicate document operation only, not QA success.

`render-report --report <absolute-saved-report.json>` is the exact recovery operation. Its only input flag is `--report`; it accepts no request, selection, reason, evidence-note or output flag. A fresh process needs only this saved JSON and the existing writable owner notes directory identified inside it. Strictly read and validate the saved report, require its canonical path to equal `<report.owner.notesDirectory>/qa-request-report-<requestId>-r<revision>-<full report digest hex>.json`, and derive the Markdown target by replacing that exact `.json` suffix with `.md`. Refuse a mismatched location/basename with UNSAFE_PATH before writing; validate the notes directory as below. Do not read original request/evidence-input files, contact an owner runtime, rewrite JSON or refresh any digest/timestamp. Render from the validated report with `renderIntakeReport`, exclusively create only missing Markdown, and read back exact rendered bytes. If existing regular Markdown is byte-identical, return an idempotent readback without writing; different bytes give DOCUMENT_CONFLICT with both files preserved. Symlinks/unsafe paths are UNSAFE_PATH; unreadable files are INPUT_UNAVAILABLE, never treated as missing. The exact success envelope is `{kind:"report_rendered",path:<unchanged JSON path>,digest:<unchanged report digest>,requestId:<saved request ID>,revision:<saved revision>,markdownPath:<derived path>,markdownStatus:"created"|"already_present"}`. Interrupted/uncertain Markdown write or readback emits WRITE_OUTCOME_UNKNOWN with `error.path=markdownPath`, no success, and leaves JSON and any Markdown bytes untouched; recover by inspecting that exact path and repeating this same command. A partial/different existing Markdown remains a conflict requiring owner reconciliation, not permission to overwrite.

Persistence rules:

1. Use the explicit, already existing private notes directory; require its realpath equals the supplied absolute normalized path and every component is a real directory, not symlink. Reject a missing directory; do not initialize or migrate an owner. Host resolves/creates a permitted first-use private notes directory separately from managed registration. Only sanitized nonsecret documents are allowed; no automatic credential redaction guarantee.
2. Capture generates UUID v4 with `crypto.randomUUID()`. Save `qa-request-<uuid>-r1.json`; amend saves `qa-request-<same-uuid>-r<N>.json`. Report saves `qa-request-report-<uuid>-r<N>-<full report digest hex>.json` and same basename `.md`. No `latest`, index or auto-resume by mtime.
3. New files exclusively create with O_CREAT|O_EXCL|O_NOFOLLOW, mode0600, write+fsync+close, then bounded strict readback and digest validation. Do not overwrite. Existing same-name same-byte report is an idempotent readback; different bytes conflict. Existing amendment revision (even matching) must be read/reconciled, not overwritten or silently forked. Keep original bytes on every error. This is single-owner trusted local note handling, not a hostile-filesystem concurrency/security qualification; no claim that path preflight eliminates parent-directory TOCTOU.
4. JSON maximum serialized input/read size 1 MiB. Read using a bounded handle after regular-file/no-symlink check; UTF-8 fatal decoding, never replacement characters. Reject traversal/symlink inputs for request/evidence notes. Source attachment locators can refer to supplied absolute local files; never follow network URLs or auto-fetch.
5. If publication/readback is uncertain, return WRITE_OUTCOME_UNKNOWN with `error.path` naming only the attempted publication path, keep bytes, inspect that exact path before retry. A report JSON may exist without Markdown: run the explicit `render-report --report <saved JSON>` recovery above, never an implicitly mutating read. Do not delete partial artifacts. A failed read is unavailable, never absence proof. No automatic cleanup of user artifacts.
6. Host adds the explicit returned request/report paths to the existing owner checkpoint using ordinary host file tools, preserving previous entries. This is navigation in an existing checkpoint, not a helper-owned status queue. On reopen, read those exact paths, validate bytes and confirm current owner/candidate/authority through the selected specialist. If checkpoint update fails, return the paths and the navigation gap; request capture is not silently lost.

## 5. Existing-owner integration, no automatic execution

After readback, the generic skill hands the validated request path/binding, full original scope, selected discovery family, unknowns and limits to the complete selected specialist. It then stops generic QA instructions. Do not reset a paused campaign, switch source pins, replace a plan or import another product's rules.

For a new Starter registration, the host derives only established facts into the existing `IntakeBuildInput` and invokes existing `qa-init --answers ... --workspace ... --console-url ... --dry`; actual submit requires that exact operation's existing authority. `sources:[]`, `secretRefs:[]`, optional supported `sourceSnapshots:[]`, and structured `briefText` remain unchanged. Request items/IDs are **not** smuggled into structured brief keys or managed facts. If required environment/product facts are missing, save the intake report and continue supported product analysis; do not fabricate facts to satisfy the builder.

For an existing registered workspace, the specialist reads existing publication/graph/catalog/plan and uses existing `qa-campaign validate`, guarded authored plan APIs and authorized `run` as appropriate. B00/I01 does not run these commands or mark B01 delivered. The owner checkpoint records both the request reference and subsequent original owner run/evidence references; this is explicit caller-authored linkage. Later B01/D01 can introduce reviewed owner-attested request binding if needed; do not pre-design that API here.

Final QA reporting stays with the owner's existing report/evidence path. It must cite request ID/revision/digest, original versus attempted scope, selected source/runtime and actual environment/build/run identities (unknown when unknown), what/how/why/evidence/result/remaining, and separate documented analysis from executed checks. The helper's intake report is an entry/reopen artifact, **not that final QA report**. Missing capability and ambiguous oracle remain scoped blockers; neither blocks capture or independent permitted discovery. Tickets are preserved supplied text only: no tracker import is implemented. Documentation review is recorded as requested, not executed or certified by this helper.

## 6. Healthy/broken acceptance controls

All controls use synthetic private temporary notes; no product, tracker, server, installation or child default test command.

| Control | Must demonstrate |
| --- | --- |
| Brief only, unfamiliar product | Plain-text CLI creates/readbacks original full request and NOT_EVALUATED report with zero optional docs |
| Empty/incomplete | Blank brief rejected without files; meaningful incomplete brief retained with scope/oracle unknowns; empty attachment retained as gap |
| Full versus narrowed pilot | Two request clauses, select one: original full survives, both clauses retained, complement contains second; all statuses unassessed; no full-completion field |
| Two requests same workspace | Two capture invocations produce different IDs and independent reports; no shared singleton/current/old result inheritance |
| Partial source | Exact available text and reason retained; unavailable attachment also retained; lost-item mutation fails structural/source-clause consistency validation |
| Capability unavailable | No browser/dependency/Console availability needed for helper; no spawn/network imports; report keeps execution unbound, specialist recipe scopes the blocker |
| Ambiguous oracle | No expectation generated from prose; oracle unknown retained even when supplied document describes observed behavior |
| Wrong/stale evidence | Use actual old capture→saved report→association with a known run/path/digest; feed it to a second same-workspace request, and to amended revision: neither becomes matching_request_unattested; unchanged original request does match but stays NOT_EVALUATED |
| Wrong owner | Same request tuple plus another owner is owner_mismatch; local file existence does not repair it |
| Tamper/injection | Changed request bytes with old digest rejected; duplicate clause/source IDs, unknown keys, unsupported statuses, malformed UTF-8, symlinks, oversized sources and unsafe report markup do not become valid success |
| Reopen/failure | Fresh process given only saved report JSON, with original request/temporary evidence inputs absent, runs render-report; missing Markdown is derived, repeated identical Markdown is read-only/idempotent, conflicting bytes and original JSON bytes/digest are preserved; uncertain write names only the Markdown path and returns no success |

Unit tests establish document integrity and selection association, not independently authenticated evidence or real actor task quality. Root packaging tests cannot close B01/V01. Independent pre-code AQA must review this distinction and the exact plan before Sol implements. Pending N01/Q1 is not a blocker for this independent capture slice and is not granted acceptance by it.
