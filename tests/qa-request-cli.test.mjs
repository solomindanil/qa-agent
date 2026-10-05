import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, writeFile, readFile, readdir, realpath, stat, unlink, symlink, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {documentDigest, renderIntakeReport} from '../skills/qa-check/scripts/request-contract.mjs';

const exec = promisify(execFile);
const cli = fileURLToPath(new URL('../skills/qa-check/scripts/request.mjs', import.meta.url));
const rawDigest = text => `sha256:${createHash('sha256').update(text).digest('hex')}`;
async function processResult(args, nodeArgs = []) {
  try { return {...await exec(process.execPath, [...nodeArgs, cli, ...args], {timeout:10000, maxBuffer:2 * 1024 * 1024}), code:0}; }
  catch (error) { return {stdout:error.stdout, stderr:error.stderr, code:error.code}; }
}
async function invoke(args, nodeArgs) {
  const result = await processResult(args, nodeArgs);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout.trim().split('\n').length, 1);
  return JSON.parse(result.stdout);
}
async function fails(args, code, nodeArgs) {
  const result = await processResult(args, nodeArgs);
  assert.equal(result.code, 2, result.stderr);
  assert.equal(result.stdout, '');
  const parsed = JSON.parse(result.stderr);
  assert.deepEqual(Object.keys(parsed), ['error']);
  assert.equal(parsed.error.code, code);
  assert.equal(typeof parsed.error.message, 'string');
  assert.ok(parsed.error.message.length <= 160);
  assert.deepEqual(Object.keys(parsed.error).sort(), code === 'WRITE_OUTCOME_UNKNOWN' ? ['code','message','path'] : ['code','message']);
  return parsed.error;
}
async function fixture(text = '  Check the whole unfamiliar product. No docs. e\u0301\n') {
  const notes = await realpath(await mkdtemp(join(tmpdir(), 'qa-request-cli-')));
  const brief = join(notes, 'brief.txt');
  await writeFile(brief, text);
  await writeFile(join(notes, 'CURRENT.md'), '# Synthetic owner\n');
  const args = ['capture','--text-file',brief,'--scope','full','--product','sample','--specialist','qa-product-v0','--checkpoint',join(notes,'CURRENT.md'),'--notes-dir',notes,'--workspace',join(notes,'workspace')];
  return {notes, brief, text, args};
}
const readRequest = path => invoke(['read','--request',path]);
const readReport = path => invoke(['read','--report',path]);
const report = (path, extra = []) => invoke(['report','--request',path,'--reason','Bounded discovery, full scope remains open',...extra]);
async function evidenceFixture(f, first) {
  const record = await readRequest(first.path);
  const evidence = {request:{requestId:record.requestId, revision:record.revision, requestDigest:record.digest}, owner:record.owner, runId:'old-owner-run', artifactPath:join(f.notes,'old-receipt.json'), artifactDigest:`sha256:${'a'.repeat(64)}`, kind:'owner_receipt', observedIdentity:null};
  const path = join(f.notes,'association.json');
  await writeFile(path, JSON.stringify(evidence));
  return {path, evidence};
}

// Catches identity reuse, byte normalization, implicit workspace state and false execution.
test('ordinary no-doc capture twice gives independent private request-local reports', async () => {
  const f = await fixture();
  const first = await invoke([...f.args,'--exclude','No purchases']);
  const second = await invoke(f.args);
  assert.notEqual(first.requestId, second.requestId);
  assert.deepEqual(Object.keys(first).sort(), ['digest','kind','path','requestId','revision']);
  assert.equal(first.kind, 'request_captured');
  assert.match(first.requestId, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  for (const saved of [first, second]) {
    const record = await readRequest(saved.path);
    assert.equal(record.originalText, f.text);
    assert.equal(record.originalScope, 'full');
    assert.equal(record.items.length, 1);
    assert.equal(record.items[0].contentDigest, rawDigest(f.text));
    assert.deepEqual(record.unknowns.map(x => x.kind), ['scope','oracle']);
    const output = await report(saved.path);
    assert.equal(output.kind, 'intake_report');
    assert.deepEqual(Object.keys(output).sort(), ['digest','kind','markdownPath','path','requestId','revision']);
    const reopened = await readReport(output.path);
    assert.equal(reopened.request.requestId, saved.requestId);
    assert.equal(reopened.result, 'NOT_EVALUATED');
    assert.equal(reopened.executionBinding, 'not_owner_attested');
    assert.deepEqual(reopened.remainingClauseIds, ['clause-1']);
    assert.match(await readFile(output.markdownPath, 'utf8'), /NOT_EVALUATED/);
    for (const path of [saved.path, output.path, output.markdownPath]) assert.equal((await stat(path)).mode & 0o777, 0o600);
  }
  assert.ok(!(await readdir(f.notes)).some(x => x !== 'CURRENT.md' && /^(current|latest|registry|store)(\.|$)/i.test(x)));
  const noWorkspace = await invoke(f.args.slice(0,-2));
  assert.equal((await readRequest(noWorkspace.path)).owner.workspacePath, null);
});

// Catches stale evidence relabeling or amendment scope/history loss.
test('real saved old association stays historical for a new capture and amendment', async () => {
  const f = await fixture();
  const first = await invoke([...f.args,'--exclude','No purchases']);
  const old = await evidenceFixture(f, first);
  const oldOutput = await report(first.path, ['--select','clause-1','--evidence-note',old.path]);
  assert.equal((await readReport(oldOutput.path)).evidence[0].association.state, 'matching_request_unattested');
  const second = await invoke(f.args);
  const clarification = join(f.notes,'clarification.txt');
  await writeFile(clarification, 'Also include reports and exports.\n');
  const amended = await invoke(['amend','--request',first.path,'--text-file',clarification]);
  assert.equal(amended.kind, 'request_amended');
  const record = await readRequest(amended.path);
  assert.equal(record.requestId, first.requestId);
  assert.equal(record.revision, 2);
  assert.equal(record.previousDigest, first.digest);
  assert.equal(record.originalText, f.text);
  assert.equal(record.originalScope, 'full');
  assert.deepEqual(record.exclusions, ['No purchases']);
  assert.equal(record.clauses[1].text, 'Also include reports and exports.\n');
  for (const saved of [second, amended]) {
    const output = await report(saved.path, ['--select','clause-1','--evidence-note',old.path]);
    const reopened = await readReport(output.path);
    assert.equal(reopened.evidence[0].association.state, 'historical_or_other_request');
    assert.deepEqual(reopened.evidence[0].reference, old.evidence);
    assert.equal(reopened.result, 'NOT_EVALUATED');
    assert.equal(reopened.originalScope, 'full');
    assert.ok(reopened.clauses.every(x => x.status === 'unassessed'));
    if (saved === amended) assert.deepEqual(reopened.remainingClauseIds, ['clause-2']);
  }
  const bytes = await readFile(amended.path);
  await fails(['amend','--request',first.path,'--text-file',clarification], 'DOCUMENT_CONFLICT');
  assert.deepEqual(await readFile(amended.path), bytes);
  old.evidence.owner.product = 'wrong-owner';
  await writeFile(old.path, JSON.stringify(old.evidence));
  const wrongOwner = await report(first.path, ['--evidence-note',old.path]);
  assert.equal((await readReport(wrongOwner.path)).evidence[0].association.state, 'owner_mismatch');
});

// Catches optional source disappearance, input order changes and lossy UTF-8 decoding.
test('ordered complete partial empty missing unreadable and invalid UTF-8 attachments remain visible', async () => {
  const f = await fixture('Check incomplete product');
  const complete = join(f.notes,'complete.txt'), partial = join(f.notes,'partial.txt'), empty = join(f.notes,'empty.txt'), missing = join(f.notes,'missing.txt'), invalid = join(f.notes,'invalid.txt'), directory = join(f.notes,'directory');
  await writeFile(complete, '<script>bad()</script>\n```` literal e\u0301');
  await writeFile(partial, 'Known fragment\n');
  await writeFile(empty, '');
  await writeFile(invalid, Buffer.from([0xc3,0x28]));
  await mkdir(directory);
  const saved = await invoke([...f.args,'--source-file',complete,'--partial-source-file',partial,'--partial-reason','Only supplied excerpt','--source-file',empty,'--source-file',missing,'--source-file',invalid,'--source-file',directory]);
  const record = await readRequest(saved.path);
  assert.deepEqual(record.items.slice(1).map(x => x.locator), [complete,partial,empty,missing,invalid,directory]);
  assert.deepEqual(record.items.slice(1).map(x => x.availability), ['complete','partial','empty','unavailable','unavailable','unavailable']);
  assert.deepEqual(record.items.slice(2).map(x => x.limitation), ['Only supplied excerpt',null,'not_found','invalid_utf8','not_readable']);
  assert.equal(record.items[2].content, 'Known fragment\n');
  assert.equal(record.clauses.length, 3);
  assert.equal(record.unknowns.filter(x => x.kind === 'source').length, 5);
  const output = await report(saved.path, ['--select','clause-1']);
  const md = await readFile(output.markdownPath,'utf8');
  assert.doesNotMatch(md, /<script>/);
  assert.match(md, /&lt;script&gt;/);
  assert.match(md, /`````/);
  const lost = {...record, items:record.items.slice(0,-1)};
  const {digest:ignored, ...body} = lost;
  lost.digest = documentDigest(body);
  await writeFile(saved.path, JSON.stringify(lost));
  await fails(['read','--request',saved.path], 'INVALID_DOCUMENT');
});

// Catches publish-before-validation, oversized acceptance and diagnostics leaking text.
test('mandatory blank malformed missing and oversized inputs publish nothing', async () => {
  const f = await fixture('   \n\t');
  await fails(f.args, 'INVALID_ARGUMENT');
  await unlink(f.brief);
  await fails(f.args, 'INPUT_UNAVAILABLE');
  await writeFile(f.brief, Buffer.from([0xff]));
  await fails(f.args, 'INPUT_UNAVAILABLE');
  await writeFile(f.brief, 'x'.repeat(65537));
  await fails(f.args, 'LIMIT_EXCEEDED');
  await writeFile(f.brief, 'Check product');
  const large = join(f.notes,'large.txt');
  await writeFile(large,'x'.repeat(262145));
  await fails([...f.args,'--source-file',large], 'LIMIT_EXCEEDED');
  await writeFile(large,'x'.repeat(262144));
  await fails([...f.args,'--source-file',large,'--source-file',large], 'LIMIT_EXCEEDED');
  await fails([...f.args,...Array.from({length:33},() => ['--source-file',join(f.notes,'absent')]).flat()], 'LIMIT_EXCEEDED');
  assert.ok(!(await readdir(f.notes)).some(x => x.startsWith('qa-request-')));
});

// Catches ignored/duplicate flags, hidden defaults and command-shape ambiguity.
test('strict per-command grammar rejects unknown duplicate missing and foreign flags', async () => {
  const f = await fixture();
  for (const extra of [['--wat','secret-value'],['--scope','full'],['--workspace'],['stray'],['--partial-reason','reason'],['--partial-source-file',f.brief],['--scope=full'],['--help']]) await fails([...f.args,...extra], 'INVALID_ARGUMENT');
  for (const args of [[],['unknown'],['read'],['read','--request',f.brief,'--report',f.brief],['amend','--request',f.brief,'--text-file',f.brief,'--exclude','x'],['render-report','--report',f.brief,'--reason','x'],['render-report','--report',f.brief,'--report',f.brief],['report','--request',f.brief]]) await fails(args,'INVALID_ARGUMENT');
  const help = await processResult(['--help']);
  assert.equal(help.code,0);
  assert.match(help.stdout,/render-report --report/);
  assert.match(help.stdout,/NOT_EVALUATED/);
});

// Catches digest trust, invalid classifications and arbitrary evidence acceptance.
test('read rejects tampering and report rejects unsupported references before writes', async () => {
  const f = await fixture();
  const saved = await invoke(f.args);
  const output = await report(saved.path);
  const bytes = await readFile(saved.path);
  const record = JSON.parse(bytes);
  record.originalText = 'Secretly narrower';
  await writeFile(saved.path,JSON.stringify(record));
  await fails(['read','--request',saved.path],'INVALID_DOCUMENT');
  await writeFile(saved.path,bytes);
  const old = await evidenceFixture(f,saved);
  old.evidence.current = true;
  await writeFile(old.path,JSON.stringify(old.evidence));
  await fails(['report','--request',saved.path,'--reason','Discovery','--evidence-note',old.path],'INVALID_DOCUMENT');
  await fails(['report','--request',saved.path,'--reason','Discovery','--evidence-note',join(f.notes,'absent.json')],'INPUT_UNAVAILABLE');
  await fails(['report','--request',saved.path,'--reason','Discovery','--select','clause-99'],'INVALID_DOCUMENT');
  await fails(['report','--request',saved.path,'--reason','Discovery','--select','clause-1','--select','clause-1'],'INVALID_DOCUMENT');
  const doc = await readReport(output.path);
  doc.remainingClauseIds = [];
  const {digest:ignored,...body} = doc;
  doc.digest = documentDigest(body);
  await writeFile(output.path,JSON.stringify(doc));
  await fails(['read','--report',output.path],'INVALID_DOCUMENT');
});

// Catches symlink following or creation of implicit owner destinations.
test('notes input evidence and output symlinks and traversal are refused', async () => {
  const f = await fixture();
  const link = join(f.notes,'link');
  await symlink(f.notes,link);
  const linkedArgs = [...f.args];
  linkedArgs[linkedArgs.indexOf('--notes-dir') + 1] = link;
  await fails(linkedArgs,'UNSAFE_PATH');
  linkedArgs[linkedArgs.indexOf('--notes-dir') + 1] = join(f.notes,'absent');
  await fails(linkedArgs,'INPUT_UNAVAILABLE');
  await fails([...f.args.slice(0,2),`${f.notes}/../${f.notes.split('/').at(-1)}/brief.txt`,...f.args.slice(3)],'UNSAFE_PATH');
  const saved = await invoke(f.args);
  const requestLink = join(f.notes,'request-link.json');
  await symlink(saved.path,requestLink);
  await fails(['read','--request',requestLink],'UNSAFE_PATH');
  await fails([...f.args,'--source-file',requestLink],'UNSAFE_PATH');
  const old = await evidenceFixture(f,saved);
  const evidenceLink = join(f.notes,'evidence-link.json');
  await symlink(old.path,evidenceLink);
  await fails(['report','--request',saved.path,'--reason','Discovery','--evidence-note',evidenceLink],'UNSAFE_PATH');
  const output = await report(saved.path);
  await unlink(output.markdownPath);
  await symlink(f.brief,output.markdownPath);
  await fails(['render-report','--report',output.path],'UNSAFE_PATH');
});

// Catches non-idempotent writes, conflict overwrites and recovery needing removed inputs.
test('fresh JSON-only recovery is exact idempotent nonmutating on read and conflict-preserving', async () => {
  const f = await fixture();
  const saved = await invoke(f.args);
  const old = await evidenceFixture(f,saved);
  const output = await report(saved.path,['--evidence-note',old.path]);
  const json = await readFile(output.path), markdown = await readFile(output.markdownPath);
  const originalStats = await Promise.all([stat(output.path),stat(output.markdownPath)]);
  assert.deepEqual(await report(saved.path,['--evidence-note',old.path]),output);
  assert.deepEqual((await Promise.all([stat(output.path),stat(output.markdownPath)])).map(x=>x.mtimeMs),originalStats.map(x=>x.mtimeMs));
  await unlink(saved.path);
  await unlink(old.path);
  await unlink(output.markdownPath);
  const beforeRead = await stat(output.path);
  await readReport(output.path);
  assert.deepEqual(await readFile(output.path),json);
  assert.equal((await stat(output.path)).mtimeMs,beforeRead.mtimeMs);
  assert.ok(!(await readdir(f.notes)).includes(output.markdownPath.split('/').at(-1)));
  const recoveryArgs = ['render-report','--report',output.path];
  const expected = {kind:'report_rendered',path:output.path,digest:output.digest,requestId:output.requestId,revision:output.revision,markdownPath:output.markdownPath,markdownStatus:'created'};
  assert.deepEqual(await invoke(recoveryArgs),expected);
  assert.deepEqual(await readFile(output.path),json);
  assert.deepEqual(await readFile(output.markdownPath),markdown);
  const before = await Promise.all([stat(output.path),stat(output.markdownPath)]);
  assert.deepEqual(await invoke(recoveryArgs),{...expected,markdownStatus:'already_present'});
  assert.deepEqual((await Promise.all([stat(output.path),stat(output.markdownPath)])).map(x=>x.mtimeMs),before.map(x=>x.mtimeMs));
  await writeFile(output.markdownPath,'Known conflicting bytes\n');
  await fails(recoveryArgs,'DOCUMENT_CONFLICT');
  assert.equal(await readFile(output.markdownPath,'utf8'),'Known conflicting bytes\n');
  assert.deepEqual(await readFile(output.path),json);
  const wrongName = join(f.notes,'wrong-name.json');
  await writeFile(wrongName,json);
  await fails(['render-report','--report',wrongName],'UNSAFE_PATH');
  const other = await fixture();
  const outside = join(other.notes,output.path.split('/').at(-1));
  await writeFile(outside,json);
  await fails(['render-report','--report',outside],'UNSAFE_PATH');
  assert.deepEqual(await readdir(other.notes),['CURRENT.md','brief.txt',outside.split('/').at(-1)].sort());
});

// Catches success after uncertain fsync or deletion/overwrite of retained Markdown.
test('uncertain Markdown publication names exact path preserves bytes and recovers in fresh process', async () => {
  const f = await fixture();
  const saved = await invoke(f.args), output = await report(saved.path);
  const json = await readFile(output.path), markdown = await readFile(output.markdownPath);
  await unlink(output.markdownPath);
  const preload = `import fs from 'node:fs/promises'; import {syncBuiltinESMExports} from 'node:module'; const original=fs.open; fs.open=async function(path,...args){ const handle=await original.call(this,path,...args); if(path===${JSON.stringify(output.markdownPath)}) handle.sync=async()=>{throw new Error('synthetic sync uncertainty');}; return handle; }; syncBuiltinESMExports();`;
  const error = await fails(['render-report','--report',output.path],'WRITE_OUTCOME_UNKNOWN',['--import',`data:text/javascript,${encodeURIComponent(preload)}`]);
  assert.equal(error.path,output.markdownPath);
  assert.deepEqual(await readFile(output.path),json);
  assert.deepEqual(await readFile(output.markdownPath),markdown);
  const recovered = await invoke(['render-report','--report',output.path]);
  assert.equal(recovered.markdownStatus,'already_present');
  assert.deepEqual(await readFile(output.path),json);
});

// Catches misclassified canonical serialization limits despite valid raw content sizes.
test('serialization expansion exceeds the document limit without publication', async () => {
  const f = await fixture('Check product');
  const quoted = join(f.notes,'quoted.txt');
  await writeFile(quoted,'"'.repeat(262144));
  await fails([...f.args,'--source-file',quoted],'LIMIT_EXCEEDED');
  assert.ok(!(await readdir(f.notes)).some(x => x.startsWith('qa-request-')));
});

// Catches read failure treated as absence and overwriting an existing differing JSON.
test('existing unreadable Markdown and differing report JSON are preserved', async () => {
  const f = await fixture(), saved = await invoke(f.args), output = await report(saved.path);
  const json = await readFile(output.path), markdown = await readFile(output.markdownPath);
  const preload = `import fs from 'node:fs/promises'; import {syncBuiltinESMExports} from 'node:module'; const original=fs.open; fs.open=async function(path,...args){if(path===${JSON.stringify(output.markdownPath)}) {const error=new Error('synthetic unreadable');error.code='EACCES';throw error;}return original.call(this,path,...args);};syncBuiltinESMExports();`;
  await fails(['render-report','--report',output.path],'INPUT_UNAVAILABLE',['--import',`data:text/javascript,${encodeURIComponent(preload)}`]);
  assert.deepEqual(await readFile(output.path),json);
  assert.deepEqual(await readFile(output.markdownPath),markdown);
  await writeFile(output.path,'Different existing JSON bytes\n');
  await fails(['report','--request',saved.path,'--reason','Bounded discovery, full scope remains open'],'DOCUMENT_CONFLICT');
  assert.equal(await readFile(output.path,'utf8'),'Different existing JSON bytes\n');
  assert.deepEqual(await readFile(output.markdownPath),markdown);
});

// Catches trusting claimed association classifications on fresh report reads.
test('fresh report read rejects forged matching association and over-limit JSON inputs', async () => {
  const f = await fixture(), first = await invoke(f.args), old = await evidenceFixture(f,first), second = await invoke(f.args);
  const output = await report(second.path,['--evidence-note',old.path]);
  const value = await readReport(output.path);
  value.evidence[0].association = {state:'matching_request_unattested',reasons:['Caller-authored association only; no owner-attested request or deployment binding']};
  const {digest:ignored,...body} = value;
  value.digest = documentDigest(body);
  await writeFile(output.path,JSON.stringify(value));
  await fails(['read','--report',output.path],'INVALID_DOCUMENT');
  const large = join(f.notes,'large.json');
  await writeFile(large,' '.repeat(1024 * 1024 + 1));
  await fails(['read','--request',large],'LIMIT_EXCEEDED');
  const before = await readdir(f.notes);
  await fails(['report','--request',second.path,'--reason','Discovery','--evidence-note',large],'LIMIT_EXCEEDED');
  assert.deepEqual(await readdir(f.notes),before);
});

// Catches cleanup after partial publication and unsafe overwrite on recovery.
test('partial uncertain Markdown remains a conflict requiring reconciliation', async () => {
  const f = await fixture(), saved = await invoke(f.args), output = await report(saved.path);
  const json = await readFile(output.path);
  await unlink(output.markdownPath);
  const preload = `import fs from 'node:fs/promises'; import {syncBuiltinESMExports} from 'node:module'; const original=fs.open; fs.open=async function(path,...args){const handle=await original.call(this,path,...args);if(path===${JSON.stringify(output.markdownPath)}){const write=handle.writeFile.bind(handle);handle.writeFile=async()=>{await write('Retained partial bytes');throw new Error('synthetic interruption');};}return handle;};syncBuiltinESMExports();`;
  const error = await fails(['render-report','--report',output.path],'WRITE_OUTCOME_UNKNOWN',['--import',`data:text/javascript,${encodeURIComponent(preload)}`]);
  assert.equal(error.path,output.markdownPath);
  assert.equal(await readFile(output.markdownPath,'utf8'),'Retained partial bytes');
  await fails(['render-report','--report',output.path],'DOCUMENT_CONFLICT');
  assert.equal(await readFile(output.markdownPath,'utf8'),'Retained partial bytes');
  assert.deepEqual(await readFile(output.path),json);
});

// Catches using the JSON size cap for a complete, legitimately larger rendered projection.
test('valid bounded JSON publishes and recovers complete Markdown above one MiB', async () => {
  const f = await fixture('Check all sources.');
  const sourceA = join(f.notes,'source-a.txt'), sourceB = join(f.notes,'source-b.txt');
  const content = '`'.repeat(200000);
  await writeFile(sourceA,content);
  await writeFile(sourceB,content);
  const saved = await invoke([...f.args,'--source-file',sourceA,'--source-file',sourceB]);
  assert.ok((await readFile(saved.path)).length < 1024 * 1024);
  const output = await report(saved.path);
  const json = await readFile(output.path), reportDocument = await readReport(output.path);
  assert.ok(json.length < 1024 * 1024);
  assert.equal(reportDocument.sourceItems[1].content,content);
  assert.equal(reportDocument.sourceItems[2].content,content);
  assert.equal(reportDocument.result,'NOT_EVALUATED');
  // Unchanged, independently reviewed pure renderer is the projection oracle for CLI I/O.
  const expected = Buffer.from(renderIntakeReport(reportDocument),'utf8');
  assert.ok(expected.length > 1024 * 1024);
  assert.equal(expected.toString().split('`'.repeat(200001)).length,5);
  assert.deepEqual(await readFile(output.markdownPath),expected);
  const initialStats = await Promise.all([stat(output.path),stat(output.markdownPath)]);
  assert.deepEqual(await report(saved.path),output);
  assert.deepEqual((await Promise.all([stat(output.path),stat(output.markdownPath)])).map(x=>x.mtimeMs),initialStats.map(x=>x.mtimeMs));
  for (const path of [saved.path,f.brief,sourceA,sourceB,output.markdownPath]) await unlink(path);
  const args = ['render-report','--report',output.path];
  const recovered = {kind:'report_rendered',path:output.path,digest:output.digest,requestId:output.requestId,revision:output.revision,markdownPath:output.markdownPath,markdownStatus:'created'};
  assert.deepEqual(await invoke(args),recovered);
  assert.deepEqual(await readFile(output.markdownPath),expected);
  assert.deepEqual(await readFile(output.path),json);
  const before = await Promise.all([stat(output.path),stat(output.markdownPath)]);
  assert.deepEqual(await invoke(args),{...recovered,markdownStatus:'already_present'});
  assert.deepEqual((await Promise.all([stat(output.path),stat(output.markdownPath)])).map(x=>x.mtimeMs),before.map(x=>x.mtimeMs));
  const oversizedConflict = Buffer.concat([expected,Buffer.from('extra retained byte')]);
  await writeFile(output.markdownPath,oversizedConflict);
  await fails(args,'DOCUMENT_CONFLICT');
  assert.deepEqual(await readFile(output.markdownPath),oversizedConflict);
  assert.deepEqual(await readFile(output.path),json);
  await writeFile(output.markdownPath,'Different shorter retained bytes');
  await fails(args,'DOCUMENT_CONFLICT');
  assert.equal(await readFile(output.markdownPath,'utf8'),'Different shorter retained bytes');
  assert.deepEqual(await readFile(output.path),json);
});
