import {createHash} from 'node:crypto';
import {isAbsolute,normalize} from 'node:path';

export const MONITOR_LIMITS = Object.freeze({manifest:16384,event:8192,members:4096,page:100});
export const OPERATIONS = Object.freeze({root_request:['capture','amend','report','monitor-announce','monitor-close'],qa_init:['submit','reconnect','resume','approve-baseline','approve-run','run'],qa_campaign:['author-checks','apply-authored-checks','record-observation','record-agent-request','validate','run','resume','prepare','approve-oracles','generate-baseline','export-outcomes','export-agent-request']});
export const COMMAND_CODES = Object.freeze(['OWNER_READ_BUSY','PRIVATE_WRITE_BUSY','COMMITTED_READBACK_UNCONFIRMED','WRITE_OUTCOME_UNKNOWN','RECORD_NOT_FOUND','REVISION_NOT_FOUND','RECORD_INVALID','LIMIT_EXCEEDED']);
const hex=/^[0-9a-f]{64}$/, sha=/^sha256:[0-9a-f]{64}$/, uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function monitorError(code='MONITOR_INVALID_CONTEXT') {return Object.assign(new TypeError('Monitor metadata unavailable'),{monitorCode:code});}
const check=(v)=>{if(!v)throw monitorError();};
function object(v,keys) {check(v!==null&&typeof v==='object'&&!Array.isArray(v));check(Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k)));}
function text(v,n=256) {check(typeof v==='string'&&v.length>0&&Buffer.byteLength(v)<=n&&!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(v));}
function digest(v){check(typeof v==='string'&&sha.test(v));}
function id(v){text(v);check(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(v));}
function path(v){text(v,4096);check(isAbsolute(v)&&normalize(v)===v&&!v.includes('\0'));}
function time(v){text(v);check(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v);}
export function canonical(value) {
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value!==null&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  const result=JSON.stringify(value);check(result!==undefined);return result;
}
export function monitorDigest(value){return `sha256:${createHash('sha256').update(`${canonical(value)}\n`).digest('hex')}`;}
export function missionIdentity(request){validateRequestKey(request);return monitorDigest(request).slice(7);}
export function validateRequestKey(v){object(v,['requestId','revision','requestDigest']);check(uuid.test(v.requestId));check(Number.isSafeInteger(v.revision)&&v.revision>0);digest(v.requestDigest);return v;}
export function validateManifest(v){
  object(v,['schemaVersion','missionId','request','requestPath','notesDirectory','capturedAt','label','product','originalScope','previousMissionId']);
  check(v.schemaVersion==='qa-monitor-mission.v1');validateRequestKey(v.request);check(v.missionId===missionIdentity(v.request));path(v.requestPath);path(v.notesDirectory);time(v.capturedAt);text(v.label);text(v.product);check(['full','subscope','tickets','documents'].includes(v.originalScope));check(v.previousMissionId===null||hex.test(v.previousMissionId));return v;
}
export function validateReference(v){
  const definitions={intake_report:['reportPath','reportDigest'],registration:['workspaceDir','productSlug','sessionId','receiptDigest'],publication:['workspaceDir','productSlug','publicationDigest','planDigest'],observation:['workspaceDir','evidenceId','artifactDigest','manifestDigest'],checkpoint:['workspaceDir','requestId','requestRevision','requestDigest','checkpointRevision','checkpointDigest','fileDigest'],native_run:['workspaceDir','runId','receiptDigest','requestBinding']};
  const fields=definitions[v?.type];check(fields);object(v,['type',...fields]);
  for(const k of fields){
    if(k.endsWith('Digest'))digest(v[k]);
    else if(k==='workspaceDir'||k==='reportPath')path(v[k]);
    else if(k==='requestRevision'||k==='checkpointRevision')check(Number.isSafeInteger(v[k])&&v[k]>0);
    else if(k==='requestBinding')check(['exact_owner_admission','navigation_only'].includes(v[k]));
    else if(k==='requestId')check(uuid.test(v[k]));
    else id(v[k]);
  }return v;
}
export function validatePayload(v){
  const fields={command_started:[],command_finished:['outcome','code'],registration_observed:['sessionId','jobId','lifecycle','phase','productSlug'],owner_reference:['reference'],native_check_started:['runId','checkId','attempt'],native_check_finished:['runId','checkId','attempt','recording'],episode_closed:['disposition']};
  const keys=fields[v?.kind];check(keys);object(v,['kind',...keys]);
  if(v.kind==='command_finished'){check(['returned','refused','write_outcome_unknown'].includes(v.outcome));check(v.code===null||COMMAND_CODES.includes(v.code));}
  if(v.kind==='owner_reference')validateReference(v.reference);
  if(v.kind==='registration_observed'){
    id(v.sessionId);if(v.jobId!==null)id(v.jobId);id(v.productSlug);
    check(['INTERVIEWING','NEEDS_INPUT','BUILD_QUEUED','BUILDING','REGISTERED','BLOCKED'].includes(v.lifecycle));
    check(v.phase===null||['QUEUED','INITIALIZING','DISCOVERING','COMPILING','PUBLISHING','VALIDATING','COMPLETE','BLOCKED'].includes(v.phase));
  }
  if(v.kind.startsWith('native_check_')){id(v.runId);id(v.checkId);check(Number.isSafeInteger(v.attempt)&&v.attempt>0);if(v.kind==='native_check_finished')check(['persisted_unsealed','sealed','not_persisted'].includes(v.recording));}
  if(v.kind==='episode_closed')check(['paused','ended'].includes(v.disposition));return v;
}
export function validateEvent(v){
  object(v,['schemaVersion','missionId','request','operationId','localSequence','observedAt','producer','payload','digest']);
  check(v.schemaVersion==='qa-monitor-event.v1');validateRequestKey(v.request);check(v.missionId===missionIdentity(v.request));check(uuid.test(v.operationId));check(Number.isSafeInteger(v.localSequence)&&v.localSequence>0);time(v.observedAt);
  object(v.producer,['kind','operation','host']);check(OPERATIONS[v.producer.kind]?.includes(v.producer.operation));check(['codex','claude','other','unknown'].includes(v.producer.host));validatePayload(v.payload);
  const {digest:ignored,...body}=v;digest(v.digest);check(v.digest===monitorDigest(body));return v;
}
export function validatedBytes(value,limit,validate){const body=Buffer.from(`${canonical(validate(value))}\n`);if(body.length>limit)throw monitorError('MONITOR_LIMIT');return body;}
