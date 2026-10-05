#!/usr/bin/env node
import {constants} from 'node:fs';
import {open, lstat, realpath} from 'node:fs/promises';
import {isAbsolute, normalize, dirname, join, parse} from 'node:path';
import {randomUUID, createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {
  captureRequest, validateRequest, validateIntakeReport,
  buildIntakeReport, renderIntakeReport,
} from './request-contract.mjs';

// Local immutable notes only. These operations neither execute QA nor attest an owner.
const JSON_LIMIT = 1024 * 1024;
const multiple = new Set(['source-file','partial-source-file','exclude','select','evidence-note']);
const grammar = {
  capture: ['text-file','scope','product','specialist','checkpoint','notes-dir','workspace','source-file','partial-source-file','partial-reason','exclude'],
  amend: ['request','text-file','source-file','partial-source-file','partial-reason'],
  read: ['request','report'],
  report: ['request','select','reason','evidence-note'],
  'render-report': ['report'],
};
const help = `Local QA request documents (Node >=22.12.0):
capture --text-file ABS --scope full|subscope|tickets|documents --product TEXT --specialist TEXT --checkpoint ABS --notes-dir ABS [--workspace ABS] [--source-file ABS ...] [--partial-source-file ABS ... --partial-reason TEXT] [--exclude TEXT ...]
amend --request ABS --text-file ABS [--source-file ABS ...] [--partial-source-file ABS ... --partial-reason TEXT]
read --request ABS | read --report ABS
report --request ABS --reason TEXT [--select clause-N ...] [--evidence-note ABS ...]
render-report --report ABS
--help
Exit 0 means document operation only. Intake result is NOT_EVALUATED; no QA execution or owner attestation.
`;

function operationError(code, message, path, reason) {
  const error = new Error(message);
  error.operationCode = code;
  if (code === 'WRITE_OUTCOME_UNKNOWN') error.path = path;
  if (reason) error.reason = reason;
  return error;
}
function argument(condition) {
  if (!condition) throw operationError('INVALID_ARGUMENT','Invalid command arguments');
}
function limit(condition) {
  if (!condition) throw operationError('LIMIT_EXCEEDED','Document input exceeds supported limits');
}
function localPath(value) {
  if (typeof value !== 'string' || !isAbsolute(value) || value.includes('\0') || normalize(value) !== value || value.split('/').some(x => x === '.' || x === '..')) {
    throw operationError('UNSAFE_PATH','Expected an absolute normalized local path');
  }
  return value;
}
function readFailure(error) {
  if (error.operationCode) return error;
  if (error.code === 'ELOOP') return operationError('UNSAFE_PATH','Symlink paths are not supported');
  return operationError('INPUT_UNAVAILABLE','Local input could not be read',undefined,error.code === 'ENOENT' ? 'not_found' : 'not_readable');
}
async function directoryComponents(path) {
  localPath(path);
  const root = parse(path).root;
  let current = root;
  for (const segment of path.slice(root.length).split('/').filter(Boolean)) {
    current = join(current, segment);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw operationError('UNSAFE_PATH','Symlink paths are not supported');
    if (!info.isDirectory()) throw operationError('INPUT_UNAVAILABLE','Local directory is unavailable',undefined,'not_readable');
  }
}
async function notesDirectory(path) {
  try {
    await directoryComponents(path);
    if (await realpath(path) !== path) throw operationError('UNSAFE_PATH','Notes directory is not canonical');
  } catch (error) { throw readFailure(error); }
  return path;
}
async function readBoundedRegularFile(path, maximum = JSON_LIMIT) {
  localPath(path);
  let handle;
  try {
    await directoryComponents(dirname(path));
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw operationError('UNSAFE_PATH','Symlink paths are not supported');
    if (!info.isFile()) throw operationError('INPUT_UNAVAILABLE','Expected a regular local file',undefined,'not_readable');
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile()) throw operationError('INPUT_UNAVAILABLE','Expected a regular local file',undefined,'not_readable');
    limit(opened.size <= maximum);
    const buffer = Buffer.alloc(maximum + 1);
    let length = 0;
    while (length < buffer.length) {
      const {bytesRead} = await handle.read(buffer,length,buffer.length - length,null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    limit(length <= maximum);
    return buffer.subarray(0,length);
  } catch (error) { throw readFailure(error); }
  finally { if (handle) await handle.close().catch(() => { throw operationError('INPUT_UNAVAILABLE','Local input could not be closed',undefined,'not_readable'); }); }
}
function decode(bytes) {
  try { return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes); }
  catch { throw operationError('INPUT_UNAVAILABLE','Local input is not valid UTF-8',undefined,'invalid_utf8'); }
}
async function readJson(path, validator) {
  const text = decode(await readBoundedRegularFile(path));
  try { return validator(JSON.parse(text)); }
  catch { throw operationError('INVALID_DOCUMENT','Document schema, digest or consistency is invalid'); }
}
function validateCall(callback, code = 'INVALID_DOCUMENT') {
  try { return callback(); }
  catch (error) {
    if (error instanceof TypeError && ['Serialized document limit','Source count limit','Aggregate content limit','Revision limit'].includes(error.message)) {
      throw operationError('LIMIT_EXCEEDED','Document input exceeds supported limits');
    }
    throw operationError(code,'Document schema, digest or consistency is invalid');
  }
}
function serialized(value) {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`,'utf8');
  limit(bytes.length <= JSON_LIMIT);
  return bytes;
}
async function existingPublication(target, bytes, idempotent, maximum, rendered) {
  let existing;
  try { existing = await readBoundedRegularFile(target,maximum); }
  catch (error) {
    if (rendered && error.operationCode === 'LIMIT_EXCEEDED') {
      throw operationError('DOCUMENT_CONFLICT','Existing document must be reconciled; no bytes changed');
    }
    throw error;
  }
  if (!idempotent || !existing.equals(bytes)) throw operationError('DOCUMENT_CONFLICT','Existing document must be reconciled; no bytes changed');
  return 'already_present';
}
async function publish(target, bytes, {idempotent = false, validate, rendered = false} = {}) {
  localPath(target);
  // Validated report projection supplies the exact trusted Markdown bound, not a new cap.
  const maximum = rendered ? bytes.length : JSON_LIMIT;
  limit(bytes.length <= maximum);
  let handle;
  try {
    handle = await open(target,constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,0o600);
  } catch (error) {
    if (error.code === 'EEXIST') return existingPublication(target,bytes,idempotent,maximum,rendered);
    throw readFailure(error);
  }
  // Once exclusively created, any uncertainty retains bytes and names exactly this target.
  try {
    try { await handle.writeFile(bytes); await handle.sync(); }
    finally { await handle.close(); }
    const reopened = await readBoundedRegularFile(target,maximum);
    if (!reopened.equals(bytes)) throw new Error('Readback mismatch');
    if (validate) validate(JSON.parse(decode(reopened)));
    return 'created';
  } catch {
    throw operationError('WRITE_OUTCOME_UNKNOWN','Document publication or readback is uncertain; inspect the attempted path',target);
  }
}
function commandArgs(argv) {
  if (argv.length === 1 && argv[0] === '--help') return null;
  const command = argv[0];
  argument(Object.hasOwn(grammar,command));
  if (argv.length === 2 && argv[1] === '--help') return null;
  const options = Object.fromEntries(grammar[command].map(name => [name,{type:'string',multiple:multiple.has(name)}]));
  let parsed;
  try { parsed = parseArgs({args:argv.slice(1), options, strict:true, allowPositionals:true, tokens:true}); }
  catch { throw operationError('INVALID_ARGUMENT','Invalid command arguments'); }
  argument(parsed.positionals.length === 0);
  const seen = new Set();
  for (const token of parsed.tokens) {
    if (token.kind !== 'option') continue;
    argument(!seen.has(token.name) || multiple.has(token.name));
    seen.add(token.name);
  }
  const required = {capture:['text-file','scope','product','specialist','checkpoint','notes-dir'],amend:['request','text-file'],report:['request','reason'],'render-report':['report'],read:[]};
  for (const name of required[command]) argument(typeof parsed.values[name] === 'string' && parsed.values[name].trim().length > 0);
  if (command === 'read') argument(Number(seen.has('request')) + Number(seen.has('report')) === 1);
  if (command === 'capture' || command === 'amend') {
    argument(seen.has('partial-source-file') === seen.has('partial-reason'));
    if (seen.has('partial-reason')) argument(parsed.values['partial-reason'].trim().length > 0 && Buffer.byteLength(parsed.values['partial-reason'],'utf8') <= 1024);
  }
  return {command,values:parsed.values,tokens:parsed.tokens};
}
async function sourceItems(tokens, values, firstId) {
  const files = tokens.filter(x => x.kind === 'option' && ['source-file','partial-source-file'].includes(x.name));
  limit(files.length <= 32);
  const sources = [];
  for (const [index,token] of files.entries()) {
    const path = localPath(token.value);
    let content = null, availability = 'unavailable', limitation = null;
    try {
      content = decode(await readBoundedRegularFile(path,262144));
      availability = content.length === 0 ? 'empty' : token.name === 'partial-source-file' ? 'partial' : 'complete';
      limitation = availability === 'partial' ? values['partial-reason'] : null;
    } catch (error) {
      if (error.operationCode !== 'INPUT_UNAVAILABLE') throw error;
      limitation = error.reason ?? 'not_readable';
    }
    sources.push({id:`item-${firstId + index}`,kind:'text_file',locator:path,content,contentDigest:content === null ? null : `sha256:${createHash('sha256').update(content,'utf8').digest('hex')}`,availability,limitation});
  }
  return sources;
}
function envelope(kind, path, record) {
  const binding = record.request ?? record;
  return {kind,path,digest:record.digest,requestId:binding.requestId,revision:binding.revision};
}
function reportPaths(report) {
  const path = join(localPath(report.owner.notesDirectory),`qa-request-report-${report.request.requestId}-r${report.request.revision}-${report.digest.slice(7)}.json`);
  return {path,markdownPath:path.slice(0,-5) + '.md'};
}
async function run({command,values,tokens}) {
  if (command === 'read') {
    return values.request ? readJson(values.request,validateRequest) : readJson(values.report,validateIntakeReport);
  }
  if (command === 'render-report') {
    const report = await readJson(values.report,validateIntakeReport);
    const paths = reportPaths(report);
    if (localPath(values.report) !== paths.path) throw operationError('UNSAFE_PATH','Saved report path does not match its canonical identity');
    await notesDirectory(report.owner.notesDirectory);
    const bytes = Buffer.from(renderIntakeReport(report),'utf8');
    const markdownStatus = await publish(paths.markdownPath,bytes,{idempotent:true,rendered:true});
    return {...envelope('report_rendered',paths.path,report),markdownPath:paths.markdownPath,markdownStatus};
  }
  if (command === 'capture' || command === 'amend') {
    const previous = command === 'amend' ? await readJson(values.request,validateRequest) : undefined;
    const owner = previous?.owner ?? {
      product:values.product,specialist:values.specialist,checkpointPath:localPath(values.checkpoint),
      notesDirectory:localPath(values['notes-dir']),workspacePath:values.workspace === undefined ? null : localPath(values.workspace),
    };
    await notesDirectory(owner.notesDirectory);
    const text = decode(await readBoundedRegularFile(values['text-file'],65536));
    argument(text.trim().length > 0);
    const sources = await sourceItems(tokens,values,(previous?.items.length ?? 0) + 2);
    limit((previous?.items.filter(x => x.kind === 'text_file').length ?? 0) + sources.length <= 32);
    limit(Buffer.byteLength(text,'utf8') + [...(previous?.items ?? []),...sources].reduce((sum,x) => sum + Buffer.byteLength(x.content ?? '','utf8'),0) <= 524288);
    const record = validateCall(() => captureRequest({requestId:previous?.requestId ?? randomUUID(),capturedAt:new Date().toISOString(),owner,scope:previous?.originalScope ?? values.scope,text,sourceItems:sources,exclusions:previous?.exclusions ?? values.exclude ?? []},previous),'INVALID_ARGUMENT');
    const path = join(owner.notesDirectory,`qa-request-${record.requestId}-r${record.revision}.json`);
    await publish(path,serialized(record),{validate:validateRequest});
    return envelope(command === 'capture' ? 'request_captured' : 'request_amended',path,record);
  }
  const request = await readJson(values.request,validateRequest);
  const evidence = [];
  for (const path of values['evidence-note'] ?? []) {
    // Validate via the existing report contract; arbitrary owner receipts are not imported.
    const reference = await readJson(path,value => {
      buildIntakeReport(request,{clauseIds:[],rationale:'Validate caller-authored reference'},[value]);
      return value;
    });
    evidence.push(reference);
  }
  const report = validateCall(() => buildIntakeReport(request,{clauseIds:values.select ?? [],rationale:values.reason},evidence));
  await notesDirectory(report.owner.notesDirectory);
  const paths = reportPaths(report);
  const json = serialized(report), markdown = Buffer.from(renderIntakeReport(report),'utf8');
  await publish(paths.path,json,{idempotent:true,validate:validateIntakeReport});
  await publish(paths.markdownPath,markdown,{idempotent:true,rendered:true});
  return {...envelope('intake_report',paths.path,report),markdownPath:paths.markdownPath};
}

try {
  const args = commandArgs(process.argv.slice(2));
  if (args === null) process.stdout.write(help);
  else process.stdout.write(`${JSON.stringify(await run(args))}\n`);
} catch (error) {
  const code = error.operationCode ?? 'INVALID_DOCUMENT';
  const detail = {code,message:error.operationCode ? error.message : 'Document operation could not be completed'};
  if (code === 'WRITE_OUTCOME_UNKNOWN') detail.path = error.path;
  process.stderr.write(`${JSON.stringify({error:detail})}\n`);
  process.exitCode = 2;
}
