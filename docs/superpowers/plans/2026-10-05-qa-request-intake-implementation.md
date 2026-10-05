# QA Request Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The established execution method is actual Sol implementation after independent pre-code AQA; do not ask the user to approve the global design again or spawn additional agents from this plan without parent authorization.

**Goal:** Capture an ordinary no-doc QA request durably in existing owner notes, preserve its original full scope and revision, and reopen an honest intake report without creating another owner/store/runner.

**Architecture:** A dependency-free helper travels inside the root `qa-check` source bundle. Its pure document contract preserves request/source/selection identity; its small CLI writes exclusive immutable note files and reads them back. The host recipe hands those references to the unchanged selected specialist and existing Console/Kernel workflow; no managed receipt claims request binding in this slice.

**Tech Stack:** Node.js >=22.12.0, JavaScript ESM, Node built-in crypto/fs/path/util/test/assert; existing host file tools and source skills. No npm installation or dependency additions.

**Spec:** `docs/superpowers/specs/2026-10-05-qa-request-intake-design.md` (read in full before this plan).

## Global Constraints

- NO-NEW-OWNER-API: do not alter Console/Kernel schemas, runtime source, bundles or manifest pins in this slice.
- There is no global registry, database, mutable `current` file, execution service, scheduler, installation, network access, tracker write or MCP prerequisite.
- New `capture` always obtains a new UUID even for identical wording in the same workspace. `amend` is an explicit continuation; a routine new task is not.
- Selected clauses stay `unassessed`; selection is not execution.
- Existing campaign receipts have no request ID. A request-local reference to one is caller-authored association, not owner-attested request membership.
- The helper's intake report is an entry/reopen artifact, not the final QA report.
- This implements bounded/partial I01, not B01/D01/E00/V01/N01/Q1 acceptance.
- No source commits, push, child edit or skill installation is authorized by this document alone. At each task boundary prepare a scoped diff for review; commit only under the coordinating user's actual delivery authorization.
- Preserve existing root edits. Implementation root is the resolved `develop` integration checkout; do not return to historical NuanuFlowQA or use its dependencies.

## Review Focus

1. Identical wording and identical workspace in two ordinary user requests must not reuse identity or results — Task 1 association test and Task 2 two-capture CLI test.
2. Full scope narrowed to a pilot must retain the original denominator even when all currently known clauses were selected — Task 1 partition/all-selected tests and Task 3 recipe review.
3. Missing, empty or partially read attachments must remain visible rather than silently shrink input — Task 1 consistency test and Task 2 attachment tests.
4. A valid old run receipt attached to a new request/revision must remain historical, not become current execution through a matching workspace or digest — Task 1 saved-association controls and Task 2 reopened report test.
5. Incomplete brief and absent browser/Console must still permit useful capture while oracle/deployment/execution remain unknown — Task 2 minimal plain-text command and Task 3 fresh source-only consumer.

## File map and unchanged owner seams

| File | Responsibility |
| --- | --- |
| `skills/qa-check/scripts/request-contract.mjs` | Pure strict document validation, digest, request capture/amend, association, report/render |
| `skills/qa-check/scripts/request.mjs` | CLI arguments, bounded local reads, exclusive immutable publication/readback |
| `skills/qa-check/references/request-intake.md` | Complete portable host recipe; owner discovery, safe persistence, unchanged specialist handoff |
| `tests/qa-request-contract.test.mjs` | Pure healthy/broken source/identity/partition controls |
| `tests/qa-request-cli.test.mjs` | Real subprocess and filesystem capture/read/report controls |
| `tests/generic-skill-bundles.test.mjs` | Copied complete skill works without root or child paths |
| `skills/qa-check/SKILL.md`, `skills/README.md`, `docs/getting-started.md` | Discoverability and narrow qualification wording |

Existing functions remain unchanged: `buildRecordedIntakeSubmission(IntakeBuildInput)`, `QaCampaignPlanV0Schema.parse`, `writeNewCampaignPlan(workspacePath, planPath, plan)`, `writeCampaignPlan(workspacePath, planPath, plan, expectedCurrentDigest)`. Existing commands remain `qa-init` dry/submit/reconnect and `qa-campaign` validate/run/observation reads. The helper does not invoke them. No child bundle/manifest task exists because none of their bytes change.

---

### Task 1: Immutable request documents and truthful intake report projection

**Files:**

- Create: `skills/qa-check/scripts/request-contract.mjs`
- Create/Test: `tests/qa-request-contract.test.mjs`

**Interfaces:**

- Consumes: exact types/invariants in spec section 3; Node `createHash` only.
- Produces: `captureRequest(input, previous?)`, `validateRequest(value)`, `validateIntakeReport(value)`, `requestBinding(record)`, `associateEvidence(request,evidence)`, `buildIntakeReport(request,selection,evidence)`, `renderIntakeReport(report)`, `documentDigest(value)`. All are synchronous, pure and strictly validate inputs. Types are JSDoc declarations with spec field names. No filesystem imports here.

- [ ] **Step 1: Write failing contract tests with fixed synthetic identities**

Start the test file with these complete fixtures and assertions; use fresh clones for mutations so a test cannot repair its own input accidentally:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureRequest, validateRequest, validateIntakeReport, requestBinding,
  associateEvidence, buildIntakeReport, renderIntakeReport, documentDigest,
} from '../skills/qa-check/scripts/request-contract.mjs';

const owner = {
  product: 'sample', specialist: 'qa-product-v0',
  checkpointPath: '/private/sample/CURRENT.md', notesDirectory: '/private/sample',
  workspacePath: '/private/workspaces/sample',
};
function input(id = '00000000-0000-4000-8000-000000000001') {
  return {
    requestId: id, capturedAt: '2026-10-05T00:00:00.000Z', owner,
    scope: 'full', text: 'Check the whole product. No docs are available.\n',
    sourceItems: [], exclusions: ['No purchases'],
  };
}
function reference(record) {
  return {
    request: requestBinding(record), owner: structuredClone(owner),
    runId: 'owner-run-a', artifactPath: '/private/sample/evidence/receipt.json',
    artifactDigest: `sha256:${'a'.repeat(64)}`, kind: 'owner_receipt',
    observedIdentity: null,
  };
}

test('brief-only is durable data, not an oracle or execution result', () => {
  const first = captureRequest(input());
  const reopened = validateRequest(JSON.parse(JSON.stringify(first)));
  assert.equal(reopened.originalText, input().text);
  assert.equal(reopened.originalScope, 'full');
  assert.equal(reopened.items.length, 1);
  assert.equal(reopened.clauses[0].status, 'unassessed');
  assert.ok(reopened.unknowns.some(x => x.kind === 'oracle'));
  const report = buildIntakeReport(reopened, {clauseIds: [], rationale: 'Discover scope first'}, []);
  assert.equal(report.result, 'NOT_EVALUATED');
  assert.equal(report.executionBinding, 'not_owner_attested');
  assert.deepEqual(report.remainingClauseIds, ['clause-1']);
  assert.deepEqual(validateIntakeReport(JSON.parse(JSON.stringify(report))), report);
});

test('saved old association is not current for another request or revision', () => {
  const first = captureRequest(input());
  const savedReference = JSON.parse(JSON.stringify(reference(first)));
  const oldReport = buildIntakeReport(first, {clauseIds: ['clause-1'], rationale: 'Discovery'}, [savedReference]);
  assert.equal(oldReport.evidence[0].association.state, 'matching_request_unattested');
  assert.equal(oldReport.result, 'NOT_EVALUATED');
  const second = captureRequest(input('00000000-0000-4000-8000-000000000002'));
  const amended = captureRequest({...input(), text: 'Include mobile layout.', capturedAt: '2026-10-05T00:01:00.000Z'}, first);
  for (const current of [second, amended]) {
    const report = buildIntakeReport(current, {clauseIds: ['clause-1'], rationale: 'Bounded pilot'}, [savedReference]);
    assert.equal(report.evidence[0].association.state, 'historical_or_other_request');
    assert.equal(report.result, 'NOT_EVALUATED');
  }
  assert.equal(amended.originalText, first.originalText);
  assert.equal(amended.originalScope, 'full');
  assert.equal(amended.previousDigest, first.digest);
  assert.equal(amended.revision, 2);
});

test('full request survives a one-clause pilot and all-known-clause selection', () => {
  const first = captureRequest(input());
  const next = captureRequest({...input(), text: 'Also review reports and exports.'}, first);
  const pilot = buildIntakeReport(next, {clauseIds: ['clause-1'], rationale: 'Only first family selected'}, []);
  assert.equal(pilot.originalScope, 'full');
  assert.deepEqual(pilot.remainingClauseIds, ['clause-2']);
  assert.equal(pilot.clauses.length, 2);
  const all = buildIntakeReport(next, {clauseIds: ['clause-1', 'clause-2'], rationale: 'All known input clauses'}, []);
  assert.equal(all.fullScopeReconciliation, 'not_performed');
  assert.equal(all.result, 'NOT_EVALUATED');
  assert.ok(all.clauses.every(x => x.status === 'unassessed'));
});

test('unknown fields, dropped sources and digest tampering are rejected', () => {
  const first = captureRequest(input());
  assert.throws(() => validateRequest({...first, originalText: 'Narrowed secretly'}));
  const forged = {...first, current: true};
  forged.digest = documentDigest(Object.fromEntries(Object.entries(forged).filter(([k]) => k !== 'digest')));
  assert.throws(() => validateRequest(forged));
  const lost = {...first, clauses: []};
  lost.digest = documentDigest(Object.fromEntries(Object.entries(lost).filter(([k]) => k !== 'digest')));
  assert.throws(() => validateRequest(lost));
  const badOwner = reference(first);
  badOwner.owner = {...owner, product: 'different'};
  assert.equal(associateEvidence(first, badOwner).state, 'owner_mismatch');
});
```

Add named assertions in the same test file for exact non-NFC text preservation; deterministic key ordering and array order; duplicate IDs; invalid finite/JSON values; UTF-16 surrogate rejection; zero/malformed revision; blank brief/rationale; nonblank incomplete brief; partial/empty/unavailable source retention and source unknown; readable source without its whole-content clause rejected; unknown selection/duplicate selection; `PASS`/`current` injection rejected even with a recomputed envelope digest; report partition/classification tampering rejected; Markdown containing HTML and nested backtick fences remains literal. Use raw UTF-8 SHA-256 for source contentDigest, not `documentDigest` or JSON-string hashing (see Step 3).

Pin integer-like key ordering with this independent expected digest, computed from the explicitly authored serialization `{"10":"ten","2":"two","a":"A"}\n`, not by the implementation being tested:

```js
test('canonical code-unit ordering includes integer-like property keys', () => {
  assert.equal(documentDigest({'2': 'two', a: 'A', '10': 'ten'}),
    'sha256:da02c0e348f56f105931b549df300c43e518593fb3235ec7fa6d7a3e06949373');
});
```

- [ ] **Step 2: Run the focused test and preserve the actual RED**

Run from root: `node --test tests/qa-request-contract.test.mjs`.
Expected: module-not-found failure before implementation. Preserve the raw command/output in the task's existing private execution notes; do not reconstruct it later.

- [ ] **Step 3: Implement the pure contract and renderer**

Implement the spec's exact schemas with small explicit validators: plain object + exact keys, bounded nonblank string, allowed literal/enum, unique ID arrays, valid digest/UUID/time/path. Validate every nested object, and return new plain data rather than retaining mutable caller references. Use the following digest basis; `assertJson` must first reject non-JSON values/sparse arrays/unpaired surrogates and enforce resource limits:

```js
import {createHash} from 'node:crypto';
const sha = text => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
const serializeJson = value => Array.isArray(value) ? `[${value.map(serializeJson).join(',')}]`
  : value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${serializeJson(value[k])}`).join(',')}}`
    : JSON.stringify(value);
export function documentDigest(value) {
  assertJson(value);
  return sha(`${serializeJson(value)}\n`);
}
```

`assertJson` is an internal helper in this same file, not an imported dependency. Set maximum traversal depth32 and maximum serialized bytes1MiB; reject before hashing. Source contentDigest is `sha(source.content)`, not `documentDigest(source.content)`. Exact-key checking must handle property names safely with `Object.hasOwn`, never merge arbitrary keys into a prototype. Exported functions validate their inputs; unchecked internal helpers may avoid recursive revalidation.

Implement initial capture and amendment exactly as the spec: retain original fields, append items with next sequential IDs, derive one unassessed whole-content clause per readable nonempty item, derive initial scope/oracle unknowns and source gaps, include previous digest only for explicit amendment. All item IDs and clause IDs are sequential, item-to-clause mapping is one-to-one for readable content, text and digest agree, and item-1 equals originalText. A revision greater than1 requires a valid nonnull previousDigest; revision1 requires null. Never regenerate the original scope from the amendment text.

Association code must compare owner before request, and never return `current`:

```js
const same = (a, b) => documentDigest(a) === documentDigest(b);
function compareAssociation(binding, owner, evidence) {
  if (!same(owner, evidence.owner)) return {state: 'owner_mismatch', reasons: ['Selected owner differs']};
  if (!same(binding, evidence.request)) return {state: 'historical_or_other_request', reasons: ['Request ID, revision or digest differs']};
  return {state: 'matching_request_unattested', reasons: ['Caller-authored association only; no owner-attested request or deployment binding']};
}
```

For report validation, build expected remaining IDs and association classifications again from the embedded request binding, owner and references; compare exact values. Fixed fields must remain NOT_EVALUATED/not_performed/not_owner_attested. Renderer can only print this bounded report, never infer owner PASS. Preserve all items/clauses and gaps in JSON even if the Markdown summary is compact; links to raw supplied locations are escaped text. Use a safe dynamic fenced block for original content and no HTML.

- [ ] **Step 4: Run focused tests, inspect the diff, prepare task review**

Run `node --test tests/qa-request-contract.test.mjs` and `git diff --check`. Expected all selected tests pass and no whitespace errors. Verify the file has no fs, network, subprocess or child-runtime imports. Record actual counts/commands and limits, not expected counts. Prepare only this task's diff; no commit without coordinating authority.

### Task 2: Plain-text capture/read/report CLI in the existing owner notes

**Files:**

- Create: `skills/qa-check/scripts/request.mjs`
- Create/Test: `tests/qa-request-cli.test.mjs`

**Interfaces:**

- Consumes: every Task 1 export and spec section4 CLI flags, filenames, envelopes, error codes and persistence rules.
- Produces: local commands `capture`, `amend`, `read --request`, `read --report`, `report`, `render-report --report`; new immutable note files only in the explicit existing notes directory. No global helper state. Exit0 is document success only.

- [ ] **Step 1: Write subprocess tests before the CLI exists**

Use real Node subprocesses and private temporary directories, not mocked capture functions:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, writeFile, readFile, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const exec = promisify(execFile);
const cli = fileURLToPath(new URL('../skills/qa-check/scripts/request.mjs', import.meta.url));
async function invoke(args) {
  const {stdout, stderr} = await exec(process.execPath, [cli, ...args], {timeout: 10000, maxBuffer: 2 * 1024 * 1024});
  assert.equal(stderr, '');
  return JSON.parse(stdout);
}
test('ordinary no-doc capture twice gives two request-local reopened reports', async () => {
  const raw = await mkdtemp(join(tmpdir(), 'qa-request-'));
  const {realpath} = await import('node:fs/promises');
  const notes = await realpath(raw);
  const text = join(notes, 'request.txt');
  const checkpoint = join(notes, 'CURRENT.md');
  await writeFile(text, 'Check the whole product, start read-only.\n');
  await writeFile(checkpoint, 'Synthetic owner checkpoint\n');
  const args = ['capture', '--text-file', text, '--scope', 'full', '--product', 'sample',
    '--specialist', 'qa-product-v0', '--checkpoint', checkpoint, '--notes-dir', notes,
    '--workspace', join(notes, 'workspace-not-created')];
  const a = await invoke(args), b = await invoke(args);
  assert.notEqual(a.requestId, b.requestId);
  const saved = await invoke(['read', '--request', b.path]);
  assert.equal(saved.originalScope, 'full');
  assert.equal(saved.revision, 1);
  assert.equal(saved.items.length, 1);
  const report = await invoke(['report', '--request', b.path, '--select', 'clause-1', '--reason', 'Bounded discovery']);
  const reopened = await invoke(['read', '--report', report.path]);
  assert.equal(reopened.request.requestId, b.requestId);
  assert.equal(reopened.result, 'NOT_EVALUATED');
  assert.match(await readFile(report.markdownPath, 'utf8'), /NOT_EVALUATED/);
  assert.ok(!(await readdir(notes)).some(x => x !== 'CURRENT.md' && /^(current|latest|registry|store)(\.|$)/i.test(x)));
});
```

Add real-file controls for: amendment retaining original/full and adding clause; missing/empty/partial attachment retained; invalid UTF-8 and >limit attachment not silently truncated; whitespace brief publishes no qa-request files; request digest tamper; notes/request/evidence symlink refusal; conflicting report Markdown not overwritten; absent Markdown recreated from identical report JSON; report same-byte idempotency; CLI unknown/duplicate/unpaired flags rejected; fresh `read --report` recomputes classifications. Save an actual first request and evidence-association JSON fixture, pass it with `--evidence-note` to request2 and amendment reports, and assert historical_or_other_request with original run/path/digest preserved and result NOT_EVALUATED. This control must not merely compare two hand-computed digest strings.

The missing-Markdown control must exercise the saved-JSON-only path, not replay the original report command: arrange one real capture and report with an evidence-note; save the exact report JSON and Markdown bytes in the test's memory; remove only the named temporary request, evidence-note and Markdown fixture files. Start a **fresh subprocess** with exactly `render-report --report <saved report JSON path>`. Assert JSON bytes/digest unchanged, derived Markdown equals the previously saved bytes, and the exact success envelope has kind `report_rendered`, original JSON path/digest/requestId/revision, derived markdownPath and markdownStatus `created`. Repeat the identical fresh-process command: status `already_present`, both files' bytes and mtimes unchanged. Replace only the synthetic Markdown fixture with known conflicting bytes, repeat and assert exit2/DOCUMENT_CONFLICT, no success envelope, conflict bytes and original JSON unchanged. A saved JSON outside its embedded notesDirectory or with a wrong basename must fail UNSAFE_PATH without writing. `read --report` in the same JSON-only condition must leave Markdown absent.

Cover unknown write outcome without adding a production flag or module: the test can pass a Node `--import` data-URL preload that wraps `node:fs/promises.open`, calls `syncBuiltinESMExports()`, and changes `handle.sync` only for the exact synthetic Markdown output path to throw after write. The preload's replacement calls the original open for every path and leaves all reads intact. Run render-report in that process; expect exit2 and exactly `{error:{code:"WRITE_OUTCOME_UNKNOWN",message:<bounded diagnostic>,path:<derived Markdown path>}}`, empty stdout, saved JSON bytes unchanged and written Markdown retained. Then run unmodified render-report in a fresh process: identical retained bytes yield `already_present`; partial/different bytes would remain DOCUMENT_CONFLICT. Keep this fault injector as an inline string in `tests/qa-request-cli.test.mjs`, not a new runtime module or environment-controlled production behavior.

- [ ] **Step 2: Run focused tests and preserve RED**

Run `node --test tests/qa-request-cli.test.mjs`. Expected missing CLI errors, with no live fallback or install.

- [ ] **Step 3: Implement strict command routing and bounded local publication**

Use `parseArgs({strict:true,allowPositionals:true,tokens:true,...})` from `node:util` and a per-command allowlist. Reject duplicate scalar flags by inspecting tokens (parseArgs alone permits duplicates). Preserve occurrence order of source-file and partial-source-file tokens. `--help` prints only supported grammar and the NOT_EVALUATED/no-execution boundary. Resolve no home defaults and read no environment for owner selection. ID/time generation occurs only in capture/amend CLI; use crypto.randomUUID and new Date().toISOString().

The low-level writer is internal to this file, not a new shared store API:

```js
const handle = await open(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
try {
  await handle.writeFile(bytes);
  await handle.sync();
} finally {
  await handle.close();
}
const reopened = await readBoundedRegularFile(target);
if (!reopened.equals(bytes)) throw operationError('WRITE_OUTCOME_UNKNOWN', 'Document readback differed', target);
```

Define `readBoundedRegularFile` in this same file: reject symlink path components, open O_RDONLY|O_NOFOLLOW, require regular-file stat, refuse initial size>1MiB, read at most1MiB+1 to enforce growth bound, fatal UTF-8 decode for JSON/text, close in finally. Validate note directory components/realpath before writes. Only helper-derived safe UUID/revision/digest filenames are writable; user flag paths are inputs or an explicit directory, never arbitrary output names. Use bounded sanitized errors, including attempted path only on unknown write outcome. Never interpolate content into shell, HTML or command execution.

Attachment reading uses same bounded reader with content limits; unavailable attachment is data, unavailable mandatory brief/request/evidence note is INPUT_UNAVAILABLE. Capture/amend parse **all** inputs before the first output write. `read` verifies schema and digest and returns the validated full selected request or report JSON without writing; `report` validates request and every reference before creating files, builds JSON, writes/readbacks JSON first, then Markdown. On EEXIST, identical report bytes may be reread; changed report bytes/Markdown conflict, existing amendment revision conflicts. Preserve partial files on error and document recovery instead of deleting/replacing them. stdout success contains only the exact spec envelope (or validated full selected document for read).

Implement `render-report` in this same CLI file, composing existing `validateIntakeReport` and `renderIntakeReport`; no extra pure export is needed. Strictly allow only its single --report input. Read/bound/validate saved JSON; derive the expected canonical JSON and Markdown paths from saved owner.notesDirectory, request ID/revision and report digest as in the spec; require the supplied canonical path to equal the expected JSON path before any write. Validate the existing notes directory, and use the same exclusive publication/readback routine to create only absent Markdown or read identical existing bytes. Return the exact `report_rendered` envelope with markdownStatus created/already_present; never modify JSON, regenerate a request, consult evidence inputs or change timestamps. Different existing bytes conflict, input reads remain read errors, and any uncertain Markdown publication/readback maps to WRITE_OUTCOME_UNKNOWN with error.path naming that Markdown only. Do not silently make `read` call this mutation.

- [ ] **Step 4: Verify both focused suites and unchanged source pair**

Run `node --test tests/qa-request-contract.test.mjs tests/qa-request-cli.test.mjs`, `npm run sources:verify`, `git diff --check`. Expected document tests pass, all four selected sources verify unchanged. Inspect test temp outputs for exact originals, current revision link, report limits and private mode0600. Report inability to verify POSIX modes on another OS rather than claiming it. Prepare scoped Task2 diff for independent review.

### Task 3: Source-native discovery, owner handoff and fresh consumer

**Files:**

- Create: `skills/qa-check/references/request-intake.md`
- Modify: `skills/qa-check/SKILL.md` (entry before Route once, owner handoff, preserve-scope section)
- Modify: `tests/generic-skill-bundles.test.mjs` (required bundle members and portable CLI consumer)
- Modify: `docs/getting-started.md` (Agent entry and Choose new work sections)
- Modify: `skills/README.md` (root qa-check entry row and source-only boundaries)

**Interfaces:**

- Consumes: source-local CLI from Task2, unchanged selected specialist instruction discovery, existing owner checkpoint.
- Produces: one discoverable host request→capture/readback→specialist path plus an opened intake report. No new owner API or mandatory child runtime install.

- [ ] **Step 1: Add failing packaging and portable-consumer tests**

Extend qa-check's required member array with `references/request-intake.md`, `scripts/request.mjs`, `scripts/request-contract.mjs`. Generalize the existing Markdown reference-resolution test so qa-check's own reference stays within the copied skill bundle. Assert scripts are ordinary files, not symlinks, and use no external imports. In a real copied bundle with no root/children, run its `scripts/request.mjs capture/read/report/read --report` against synthetic existing notes with `process.execPath`; use no Console paths, environment, browser or network. Assert request identity, full scope and NOT_EVALUATED report survive.

```js
test('qa-check copied bundle preserves full no-doc request without child source', async () => {
  const bundle = await standaloneBundle('qa-check');
  const cli = join(bundle, 'scripts/request.mjs');
  assert.ok((await exists(cli))?.isFile());
  const recipe = await readFile(join(bundle, 'references/request-intake.md'), 'utf8');
  assert.match(recipe, /NOT_EVALUATED/);
  assert.match(recipe, /not_owner_attested/);
  assert.doesNotMatch(recipe, /\.\.\/\.\.\/components\//);
});
```

The snippet is the initial bundle check; retain the real subprocess consumer specified above as the behavioral control. Run `node --test tests/generic-skill-bundles.test.mjs` before documentation changes and retain RED.

- [ ] **Step 2: Write the complete portable host recipe and exact source entry**

Use this entry instruction in qa-check, preserving its current routing/authority rules:

> For a new ordinary QA request or an explicitly amended one, read [request-intake.md](references/request-intake.md). Preserve the original wording/full scope in the selected owner's existing private notes and read back the request document before the specialist handoff. Do not require documentation or a managed registration to capture/analyze a request. New work gets a new request; continuation names the exact saved request/revision. Capture is not execution, and this helper does not bind managed campaign receipts to requests. Then route once and stop the generic QA workflow.

The recipe must include all six documented invocation forms (capture, amend, read --request, read --report, report, render-report --report), with the exact flags from the spec, private-file/no-secret rules, command outcome recovery, owner/specialist lookup (not hardcoded product defaults), missing-destination behavior, source versus installed identity, full/pilot distinction and concrete capability/oracle blockers. Specifically document `render-report --report <saved JSON>` for a fresh process with no original request/evidence-note files or invocation history: destination is derived from the saved record, JSON is never rewritten, identical Markdown is read back, conflicting/uncertain bytes are preserved. `read` alone never repairs files. Use script paths relative to the installed/copied skill's own root; root docs can use repository-relative paths; never require a sibling `components` path from within the portable recipe. Selected skills are resolved through the current host/project owner.

Provide this ordinary user example in getting-started:

> Check the whole product at the URL I supply, starting read-only. I have no documentation. Preserve the full request even if you begin with one area. Save an intake report and tell me what remains unknown before dependent execution.

Document that the host resolves the private notes destination and specialist, invokes plain-text capture, reads back, adds explicit references to existing checkpoint and opens the returned Markdown via the host's normal file-opening mechanism. For this Codex implementation use `open_in_codex` only on the actual synthetic report after the consumer test if showing it helps. Do not create a managed workspace for a demo.

Explain exact unchanged Starter handoff: new registration derives supported established facts into existing answers and uses qa-init dry first; missing facts remain unknown. Existing registration goes to existing qa-product-v0 and its plan/evidence path without resetting. Preserved full request does not mean old graph/catalog fully covers it. Every later actual QA conclusion cites request tuple + owner run/evidence identity and independent readback, with original owner verdict and limits unchanged. Keep helper result NOT_EVALUATED and managed binding not_owner_attested.

- [ ] **Step 3: Run focused, whole-root and source gates**

Run from root:

```sh
node --test tests/qa-request-contract.test.mjs tests/qa-request-cli.test.mjs tests/generic-skill-bundles.test.mjs
npm test
npm run sources:verify
git diff --check
```

Expected all new controls and root packaging pass; selected component pins/trees unchanged. Do not run child `npm test`, install, browse a product, or claim runtime/product acceptance. If an unrelated root gate fails, retain its exact output and diagnose scope without editing unrelated user changes.

- [ ] **Step 4: Fresh source-only human-language consumer and truthful handoff**

After independent code AQA, the coordinator may run one fresh bounded actor using only the documented user example, synthetic supplied text and temporary existing owner notes. Actor must discover the root skill recipe, create/read a request/report, preserve full scope, explain unknowns and locate the selected specialist without prefilled child paths. No actual Console registration or product run occurs in this slice. If no fresh actor is authorized/available, record this consumer as pending; portable subprocess controls are not its replacement. The actor must not see the test assertion answer key.

Publish the exact implemented file list, fresh test counts, source verification and real output paths, plus the explicit boundary: **B00 capture/report contract implemented; I01 bounded/partial; B01/D01/E00/V01 and N01/Q1 remain unaccepted as applicable.** Record originals and failures. Do not describe a pure helper or an intake report as a working full QA box. Prepare the source diff for parent delivery; preserve installed skills/frozen owners unchanged.

## Completion self-review

- [ ] Spec sections1–2 boundaries appear in recipe and handoff; no child change slipped in.
- [ ] Every section3 field/function matches all tests/call sites; captured originals and revision links survive JSON round trips.
- [ ] Section4 CLI is executed with prose and files, not only unit-tested JSON; creation/readback/reopen and failure cases are retained.
- [ ] Section5 route preserves existing specialist, one owner, registration authority and no auto-execution; no mandatory docs/MCP.
- [ ] Every section6 control maps to Tasks1–3; wrong-request control uses a saved old association and a newly captured request, not a digest tautology.
- [ ] No result claims N01/Q1, managed request binding, full QA or fresh product execution. B01/D01 follow-up is named rather than implemented speculatively.
