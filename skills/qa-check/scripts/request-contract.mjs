import {createHash} from 'node:crypto';
import {isAbsolute} from 'node:path';

/**
 * @typedef {'full'|'subscope'|'tickets'|'documents'} Scope
 * @typedef {{requestId:string, revision:number, requestDigest:string}} RequestBinding
 * @typedef {{product:string, specialist:string, checkpointPath:string, notesDirectory:string, workspacePath:string|null}} OwnerRef
 * @typedef {{id:string, kind:'request'|'text_file', locator:string, content:string|null, contentDigest:string|null, availability:'complete'|'empty'|'partial'|'unavailable', limitation:string|null}} SourceItem
 * @typedef {{id:string, sourceItemId:string, text:string, status:'unassessed'}} Clause
 * @typedef {{id:string, kind:'scope'|'source'|'oracle'|'capability', text:string, sourceItemIds:string[]}} Unknown
 * @typedef {{requestId:string, capturedAt:string, owner:OwnerRef, scope:Scope, text:string, sourceItems:SourceItem[], exclusions:string[]}} CaptureInput
 * @typedef {{schemaVersion:'qa-request-note.v1', provenance:'caller_authored_unattested', requestId:string, revision:number, previousDigest:string|null, capturedAt:string, owner:OwnerRef, originalText:string, originalScope:Scope, items:SourceItem[], clauses:Clause[], exclusions:string[], unknowns:Unknown[], decomposition:'pending', digest:string}} RequestRecord
 * @typedef {{clauseIds:string[], rationale:string}} Selection
 * @typedef {{request:RequestBinding, owner:OwnerRef, runId:string, artifactPath:string, artifactDigest:string, kind:'owner_receipt'|'agent_observation'|'documentary', observedIdentity:string|null}} EvidenceAssociation
 * @typedef {{state:'matching_request_unattested'|'historical_or_other_request'|'owner_mismatch', reasons:string[]}} AssociationCheck
 * @typedef {{schemaVersion:'qa-request-intake-report.v1', provenance:'caller_authored_unattested', request:RequestBinding, owner:OwnerRef, originalScope:Scope, selectedClauseIds:string[], remainingClauseIds:string[], clauses:Clause[], sourceItems:SourceItem[], exclusions:string[], unknowns:Unknown[], rationale:string, evidence:{reference:EvidenceAssociation, association:AssociationCheck}[], result:'NOT_EVALUATED', fullScopeReconciliation:'not_performed', executionBinding:'not_owner_attested', digest:string}} IntakeReport
 */

/** Pure, caller-authored request documents. No owner, execution, or deployment attestation. */
const sha = text => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
const digestPattern = /^sha256:[0-9a-f]{64}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const scopeValues = ['full', 'subscope', 'tickets', 'documents'];
const availabilityValues = ['complete', 'empty', 'partial', 'unavailable'];
const unknownKinds = ['scope', 'source', 'oracle', 'capability'];
const evidenceKinds = ['owner_receipt', 'agent_observation', 'documentary'];
const ownerKeys = ['product', 'specialist', 'checkpointPath', 'notesDirectory', 'workspacePath'];
const itemKeys = ['id', 'kind', 'locator', 'content', 'contentDigest', 'availability', 'limitation'];
const clauseKeys = ['id', 'sourceItemId', 'text', 'status'];
const unknownKeys = ['id', 'kind', 'text', 'sourceItemIds'];
const bindingKeys = ['requestId', 'revision', 'requestDigest'];
const evidenceKeys = ['request', 'owner', 'runId', 'artifactPath', 'artifactDigest', 'kind', 'observedIdentity'];
const requestKeys = ['schemaVersion', 'provenance', 'requestId', 'revision', 'previousDigest', 'capturedAt', 'owner', 'originalText', 'originalScope', 'items', 'clauses', 'exclusions', 'unknowns', 'decomposition', 'digest'];
const reportKeys = ['schemaVersion', 'provenance', 'request', 'owner', 'originalScope', 'selectedClauseIds', 'remainingClauseIds', 'clauses', 'sourceItems', 'exclusions', 'unknowns', 'rationale', 'evidence', 'result', 'fullScopeReconciliation', 'executionBinding', 'digest'];
const scopeUnknown = 'Scope inventory and clause decomposition have not been assessed';
const oracleUnknown = 'No business oracle has been established by request capture';

function fail(message = 'Invalid request document') { throw new TypeError(message); }
function check(condition, message) { if (!condition) fail(message); }
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null); }
function keys(value, expected) {
  check(plain(value), 'Expected plain object');
  const actual = Object.keys(value);
  check(actual.length === expected.length && actual.every(key => expected.includes(key)), 'Unexpected or missing field');
}
function string(value, {nonblank = false, maxBytes = 1024 * 1024} = {}) {
  check(typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= maxBytes, 'Invalid string or limit');
  check(!nonblank || value.trim().length > 0, 'Blank text');
  check(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value), 'Unpaired surrogate');
  return value;
}
function path(value) { string(value, {nonblank:true}); check(isAbsolute(value) && !value.includes('\0'), 'Invalid absolute path'); return value; }
function literal(value, allowed) { check(allowed.includes(value), 'Unsupported value'); return value; }
function array(value) { check(Array.isArray(value) && Object.keys(value).length === value.length, 'Expected dense array'); return value; }
function unique(values) { check(new Set(values).size === values.length, 'Duplicate ID'); }
function id(value, stem) { string(value); check(new RegExp(`^${stem}-[1-9][0-9]*$`).test(value), 'Invalid local ID'); }
function digest(value) { check(typeof value === 'string' && digestPattern.test(value), 'Invalid digest'); return value; }
function revision(value) { check(Number.isSafeInteger(value) && value > 0, 'Invalid revision'); }
function uuid(value) { check(typeof value === 'string' && uuidPattern.test(value), 'Invalid request ID'); }
function timestamp(value) { check(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && new Date(value).toISOString() === value, 'Invalid UTC timestamp'); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function same(a, b) { return documentDigest(a) === documentDigest(b); }
function envelope(value) { const {digest: ignored, ...body} = value; return documentDigest(body); }

function assertJson(value, depth = 0, seen = new Set()) {
  check(depth <= 32, 'JSON nesting limit');
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'string') { string(value); return; }
  if (typeof value === 'number') { check(Number.isFinite(value), 'Nonfinite JSON number'); return; }
  check(typeof value === 'object', 'Non-JSON value');
  check(!seen.has(value), 'Cyclic JSON');
  seen.add(value);
  if (Array.isArray(value)) {
    check(Object.keys(value).length === value.length, 'Sparse or decorated array');
    for (let i = 0; i < value.length; i++) { check(Object.hasOwn(value, i), 'Sparse array'); assertJson(value[i], depth + 1, seen); }
  } else {
    check(plain(value), 'Non-plain JSON object');
    for (const key of Object.keys(value)) { string(key); assertJson(value[key], depth + 1, seen); }
  }
  seen.delete(value);
}
function serializeJson(value) {
  if (Array.isArray(value)) return `[${value.map(serializeJson).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${serializeJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
/** Canonical local document digest; exact strings, sorted object keys, one trailing LF. @param {unknown} value @returns {string} */
export function documentDigest(value) {
  assertJson(value);
  const serialized = `${serializeJson(value)}\n`;
  check(Buffer.byteLength(serialized, 'utf8') <= 1024 * 1024, 'Serialized document limit');
  return sha(serialized);
}

function validateOwner(value) {
  keys(value, ownerKeys);
  string(value.product, {nonblank:true}); string(value.specialist, {nonblank:true});
  path(value.checkpointPath); path(value.notesDirectory);
  if (value.workspacePath !== null) path(value.workspacePath);
  return clone(value);
}
function validateItem(value) {
  keys(value, itemKeys); id(value.id, 'item'); literal(value.kind, ['request', 'text_file']);
  string(value.locator, {nonblank:true});
  if (value.kind === 'request') check(value.locator === 'host:request', 'Request locator');
  else path(value.locator);
  literal(value.availability, availabilityValues);
  if (value.content === null) {
    check(value.availability === 'unavailable' && value.contentDigest === null, 'Unavailable content mismatch');
  } else {
    string(value.content, {maxBytes: value.kind === 'request' ? 65536 : 262144});
    digest(value.contentDigest);
    check(value.contentDigest === sha(value.content), 'Source digest mismatch');
    check(value.availability !== 'unavailable', 'Available content mismatch');
  }
  if (value.availability === 'complete') check(value.content !== null && value.content.length > 0 && value.limitation === null, 'Complete source mismatch');
  if (value.availability === 'empty') check(value.content === '' && value.limitation === null, 'Empty source mismatch');
  if (value.availability === 'partial') check(value.content !== null && value.content.length > 0 && typeof value.limitation === 'string', 'Partial source mismatch');
  if (value.availability === 'unavailable') check(value.limitation !== null, 'Missing source limitation');
  if (value.limitation !== null) string(value.limitation, {nonblank:true, maxBytes:1024});
  if (value.kind === 'request') check(value.availability === 'complete' && value.limitation === null && value.content?.trim().length > 0, 'Invalid request wording');
  return clone(value);
}
function validateClause(value) {
  keys(value, clauseKeys); id(value.id, 'clause'); id(value.sourceItemId, 'item');
  string(value.text, {maxBytes:262144}); check(value.text.length > 0, 'Empty source clause'); literal(value.status, ['unassessed']);
  return clone(value);
}
function validateUnknown(value) {
  keys(value, unknownKeys); id(value.id, 'unknown'); literal(value.kind, unknownKinds);
  string(value.text, {nonblank:true}); array(value.sourceItemIds);
  value.sourceItemIds.forEach(x => id(x, 'item')); unique(value.sourceItemIds);
  return clone(value);
}
function validateSources(items, clauses, unknowns, originalText) {
  array(items); array(clauses); array(unknowns);
  check(items.length >= 1, 'Source count limit');
  items.forEach((x, i) => { validateItem(x); check(x.id === `item-${i + 1}`, 'Nonsequential item ID'); });
  clauses.forEach((x, i) => { validateClause(x); check(x.id === `clause-${i + 1}`, 'Nonsequential clause ID'); });
  unknowns.forEach((x, i) => { validateUnknown(x); check(x.id === `unknown-${i + 1}`, 'Nonsequential unknown ID'); });
  check(items[0].kind === 'request' && items[0].content === originalText, 'Original request source mismatch');
  const readable = items.filter(x => x.content !== null && x.content.length > 0);
  check(clauses.length === readable.length, 'Whole-source clause count mismatch');
  readable.forEach((item, i) => check(clauses[i].sourceItemId === item.id && clauses[i].text === item.content, 'Whole-source clause mismatch'));
  check(items.slice(1).every(x => x.kind === 'text_file' || x.kind === 'request'), 'Invalid source kind');
  check(items.filter(x => x.kind === 'text_file').length <= 32, 'Source count limit');
  check(items.reduce((sum, x) => sum + Buffer.byteLength(x.content ?? '', 'utf8'), 0) <= 524288, 'Aggregate content limit');
  check(unknowns.length >= 2 && unknowns[0].kind === 'scope' && unknowns[0].text === scopeUnknown && unknowns[0].sourceItemIds.length === 0, 'Missing scope unknown');
  check(unknowns[1].kind === 'oracle' && unknowns[1].text === oracleUnknown && unknowns[1].sourceItemIds.length === 0, 'Missing oracle unknown');
  const affected = items.filter(x => ['partial', 'empty', 'unavailable'].includes(x.availability));
  const sourceUnknowns = unknowns.filter(x => x.kind === 'source');
  check(sourceUnknowns.length === affected.length, 'Source gap count mismatch');
  affected.forEach((item, i) => check(same(sourceUnknowns[i].sourceItemIds, [item.id]), 'Source gap association mismatch'));
  for (const x of unknowns) check(x.sourceItemIds.every(sourceId => items.some(item => item.id === sourceId)), 'Unknown references missing source');
}
function validateExclusions(values) { array(values); values.forEach(x => string(x, {nonblank:true})); return clone(values); }
function validateBinding(value) { keys(value, bindingKeys); uuid(value.requestId); revision(value.revision); digest(value.requestDigest); return clone(value); }
function validateEvidence(value) {
  keys(value, evidenceKeys); validateBinding(value.request); validateOwner(value.owner);
  string(value.runId, {nonblank:true}); path(value.artifactPath); digest(value.artifactDigest);
  literal(value.kind, evidenceKinds);
  if (value.observedIdentity !== null) string(value.observedIdentity, {nonblank:true});
  return clone(value);
}
function validateInput(value) {
  keys(value, ['requestId', 'capturedAt', 'owner', 'scope', 'text', 'sourceItems', 'exclusions']);
  uuid(value.requestId); timestamp(value.capturedAt); validateOwner(value.owner); literal(value.scope, scopeValues);
  string(value.text, {nonblank:true, maxBytes:65536}); array(value.sourceItems); check(value.sourceItems.length <= 32, 'Source count limit');
  value.sourceItems.forEach(x => { validateItem(x); check(x.kind === 'text_file', 'Expected file source'); });
  validateExclusions(value.exclusions);
  return clone(value);
}
function sourceUnknown(item, index) {
  return {id:`unknown-${index}`, kind:'source', text:`Source ${item.id} is ${item.availability}${item.limitation ? ` (${item.limitation})` : ''}`, sourceItemIds:[item.id]};
}
function appendItems(record, text, sources) {
  const nextItems = [{id:`item-${record.items.length + 1}`, kind:'request', locator:'host:request', content:text, contentDigest:sha(text), availability:'complete', limitation:null}, ...sources];
  for (const item of nextItems) {
    record.items.push(item);
    if (item.content !== null && item.content.length > 0) record.clauses.push({id:`clause-${record.clauses.length + 1}`, sourceItemId:item.id, text:item.content, status:'unassessed'});
    if (['partial', 'empty', 'unavailable'].includes(item.availability)) record.unknowns.push(sourceUnknown(item, record.unknowns.length + 1));
  }
}
/** @param {CaptureInput} input Caller-supplied identity, wording and source items. @param {RequestRecord} [previous] Explicit validated prior revision. @returns {RequestRecord} */
export function captureRequest(input, previous) {
  const next = validateInput(input);
  const prior = previous === undefined ? null : validateRequest(previous);
  if (prior) {
    check(next.requestId === prior.requestId && same(next.owner, prior.owner) && next.scope === prior.originalScope && same(next.exclusions, prior.exclusions), 'Amendment cannot change identity, owner, scope or exclusions');
    check(prior.revision < Number.MAX_SAFE_INTEGER, 'Revision limit');
  }
  const start = prior ? prior.items.length + 2 : 2;
  next.sourceItems.forEach((item, i) => check(item.id === `item-${start + i}`, 'Nonsequential new source ID'));
  const record = prior ? clone(prior) : {
    schemaVersion:'qa-request-note.v1', provenance:'caller_authored_unattested', requestId:next.requestId,
    revision:1, previousDigest:null, capturedAt:next.capturedAt, owner:next.owner,
    originalText:next.text, originalScope:next.scope, items:[], clauses:[], exclusions:next.exclusions,
    unknowns:[
      {id:'unknown-1', kind:'scope', text:scopeUnknown, sourceItemIds:[]},
      {id:'unknown-2', kind:'oracle', text:oracleUnknown, sourceItemIds:[]},
    ], decomposition:'pending',
  };
  if (prior) { record.revision++; record.previousDigest = prior.digest; record.capturedAt = next.capturedAt; delete record.digest; }
  appendItems(record, next.text, next.sourceItems);
  record.digest = envelope(record);
  return validateRequest(record);
}
/** @param {unknown} value @returns {RequestRecord} */
export function validateRequest(value) {
  keys(value, requestKeys);
  literal(value.schemaVersion, ['qa-request-note.v1']); literal(value.provenance, ['caller_authored_unattested']);
  uuid(value.requestId); revision(value.revision); timestamp(value.capturedAt); validateOwner(value.owner);
  string(value.originalText, {nonblank:true, maxBytes:65536}); literal(value.originalScope, scopeValues);
  if (value.revision === 1) check(value.previousDigest === null, 'Initial revision cannot have predecessor');
  else digest(value.previousDigest);
  validateSources(value.items, value.clauses, value.unknowns, value.originalText);
  validateExclusions(value.exclusions); literal(value.decomposition, ['pending']); digest(value.digest);
  check(value.digest === envelope(value), 'Request digest mismatch');
  return clone(value);
}
/** @param {RequestRecord} record @returns {RequestBinding} */
export function requestBinding(record) {
  const value = validateRequest(record);
  return {requestId:value.requestId, revision:value.revision, requestDigest:value.digest};
}
function compareAssociation(binding, owner, evidence) {
  if (!same(owner, evidence.owner)) return {state:'owner_mismatch', reasons:['Selected owner differs']};
  if (!same(binding, evidence.request)) return {state:'historical_or_other_request', reasons:['Request ID, revision or digest differs']};
  return {state:'matching_request_unattested', reasons:['Caller-authored association only; no owner-attested request or deployment binding']};
}
/** @param {RequestRecord} request @param {EvidenceAssociation} evidence @returns {AssociationCheck} */
export function associateEvidence(request, evidence) {
  const record = validateRequest(request);
  const reference = validateEvidence(evidence);
  return compareAssociation(requestBinding(record), record.owner, reference);
}
function validateSelection(value, clauses) {
  keys(value, ['clauseIds', 'rationale']); array(value.clauseIds); value.clauseIds.forEach(x => id(x, 'clause'));
  unique(value.clauseIds); check(value.clauseIds.every(x => clauses.some(c => c.id === x)), 'Unknown selected clause');
  string(value.rationale, {nonblank:true}); return clone(value);
}
/** @param {RequestRecord} request @param {Selection} selection @param {EvidenceAssociation[]} evidence @returns {IntakeReport} */
export function buildIntakeReport(request, selection, evidence) {
  const record = validateRequest(request);
  const selected = validateSelection(selection, record.clauses);
  array(evidence);
  const references = evidence.map(validateEvidence);
  const binding = requestBinding(record);
  const report = {
    schemaVersion:'qa-request-intake-report.v1', provenance:'caller_authored_unattested',
    request:binding, owner:record.owner, originalScope:record.originalScope,
    selectedClauseIds:selected.clauseIds,
    remainingClauseIds:record.clauses.map(x => x.id).filter(x => !selected.clauseIds.includes(x)),
    clauses:record.clauses, sourceItems:record.items, exclusions:record.exclusions, unknowns:record.unknowns,
    rationale:selected.rationale,
    evidence:references.map(reference => ({reference, association:compareAssociation(binding, record.owner, reference)})),
    result:'NOT_EVALUATED', fullScopeReconciliation:'not_performed', executionBinding:'not_owner_attested',
  };
  report.digest = envelope(report);
  return validateIntakeReport(report);
}
/** @param {unknown} value @returns {IntakeReport} */
export function validateIntakeReport(value) {
  keys(value, reportKeys);
  literal(value.schemaVersion, ['qa-request-intake-report.v1']); literal(value.provenance, ['caller_authored_unattested']);
  validateBinding(value.request); validateOwner(value.owner); literal(value.originalScope, scopeValues);
  check(value.sourceItems?.[0]?.content !== undefined, 'Missing report sources');
  validateSources(value.sourceItems, value.clauses, value.unknowns, value.sourceItems[0].content);
  validateExclusions(value.exclusions);
  validateSelection({clauseIds:value.selectedClauseIds, rationale:value.rationale}, value.clauses);
  array(value.remainingClauseIds); value.remainingClauseIds.forEach(x => id(x, 'clause'));
  const remaining = value.clauses.map(x => x.id).filter(x => !value.selectedClauseIds.includes(x));
  check(same(remaining, value.remainingClauseIds), 'Report partition mismatch');
  array(value.evidence);
  for (const entry of value.evidence) {
    keys(entry, ['reference', 'association']); const reference = validateEvidence(entry.reference);
    keys(entry.association, ['state', 'reasons']);
    literal(entry.association.state, ['matching_request_unattested', 'historical_or_other_request', 'owner_mismatch']);
    array(entry.association.reasons); entry.association.reasons.forEach(x => string(x, {nonblank:true}));
    check(same(entry.association, compareAssociation(value.request, value.owner, reference)), 'Association classification mismatch');
  }
  literal(value.result, ['NOT_EVALUATED']); literal(value.fullScopeReconciliation, ['not_performed']);
  literal(value.executionBinding, ['not_owner_attested']); digest(value.digest);
  check(value.digest === envelope(value), 'Report digest mismatch');
  return clone(value);
}
function escapeHtml(value) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function escapedText(value) {
  return escapeHtml(value).replace(/[\\`*_{}\[\]()#+\-.!|~]/g, '\\$&').replaceAll('\r', '\\\\r').replaceAll('\n', '\\\\n');
}
function fenced(value) {
  const escaped = escapeHtml(value);
  let longest = 0;
  for (const match of escaped.matchAll(/`+/g)) longest = Math.max(longest, match[0].length);
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `${fence}\n${escaped}${escaped.endsWith('\n') ? '' : '\n'}${fence}`;
}
/** Safe, rebuildable Markdown projection. The validated JSON report remains authoritative. @param {IntakeReport} report @returns {string} */
export function renderIntakeReport(report) {
  const value = validateIntakeReport(report);
  const lines = [
    '# QA request intake — NOT_EVALUATED', '',
    `Request: ${value.request.requestId} revision ${value.request.revision}`, `Original scope: ${value.originalScope}`,
    `Request digest: ${value.request.requestDigest}`, `Owner: ${escapedText(value.owner.product)} / ${escapedText(value.owner.specialist)}`,
    `Checkpoint: ${escapedText(value.owner.checkpointPath)}`, `Notes: ${escapedText(value.owner.notesDirectory)}`,
    `Workspace: ${value.owner.workspacePath === null ? 'unknown' : escapedText(value.owner.workspacePath)}`, '',
    '## What', '', 'Every source clause is a preservation unit, not an acceptance criterion.', '',
  ];
  for (const clause of value.clauses) {
    const item = value.sourceItems.find(x => x.id === clause.sourceItemId);
    lines.push(`### ${clause.id} — ${value.selectedClauseIds.includes(clause.id) ? 'selected' : 'remaining'}; unassessed`,
      `Source: ${escapedText(item.locator)} (${item.availability})`, fenced(clause.text), '');
  }
  lines.push('## How', '', 'Intake capture and caller-authored association only; no execution is bound or owner-attested.', '',
    '## Why', '', `Original scope: ${value.originalScope}. Selection rationale:`, fenced(value.rationale), '',
    '## Evidence', '');
  if (value.evidence.length === 0) lines.push('No references supplied.');
  for (const entry of value.evidence) lines.push(`- ${escapedText(entry.reference.runId)}; ${escapedText(entry.reference.artifactPath)}; ${entry.reference.artifactDigest}; ${entry.reference.kind}; ${entry.association.state}; observed identity: ${entry.reference.observedIdentity === null ? 'unknown' : escapedText(entry.reference.observedIdentity)}. Caller-authored reference only; no freshness, authenticity, source applicability or deployment attestation.`);
  lines.push('', '## Result', '', 'NOT_EVALUATED; full-scope reconciliation not_performed; execution binding not_owner_attested.', '',
    '## Remaining', '', `All ${value.clauses.length} source clauses remain unassessed, including selected clauses.`,
    `Selected: ${value.selectedClauseIds.join(', ') || 'none'}; remaining: ${value.remainingClauseIds.join(', ') || 'none'}.`,
    'Owner follow-up must establish current environment, executable scope, oracles and independently read back evidence.', '');
  for (const item of value.sourceItems.filter(x => x.availability !== 'complete')) lines.push(`- Source gap: ${item.id} ${escapedText(item.locator)} (${item.availability}; ${item.limitation === null ? 'none' : escapedText(item.limitation)}).`);
  for (const unknown of value.unknowns) lines.push(`- Unknown ${unknown.id} (${unknown.kind}): ${escapedText(unknown.text)}.`);
  for (const exclusion of value.exclusions) lines.push(`- User exclusion: ${escapedText(exclusion)}.`);
  return `${lines.join('\n')}\n`;
}
