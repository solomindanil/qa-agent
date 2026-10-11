import {constants} from 'node:fs';
import {lstat,mkdir,open,realpath,link,unlink,readdir} from 'node:fs/promises';
import {join,dirname,parse,isAbsolute,normalize} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {validateRequest,requestBinding} from './request-contract.mjs';
import {MONITOR_LIMITS,missionIdentity,monitorDigest,validateManifest,validateEvent,validatedBytes,COMMAND_CODES,monitorError} from './monitor-contract.mjs';

const uid=typeof process.getuid==='function'?process.getuid():null;
const same=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.ctimeMs===b.ctimeMs;
function owned(info){if(uid!==null&&info.uid!==uid)throw monitorError();}
export async function safeDirectory(path,{create=false,ownedLeaf=true,privateLeaf=false}={}){
  if(typeof path!=='string'||!isAbsolute(path)||normalize(path)!==path||path.includes('\0'))throw monitorError();
  const root=parse(path).root;let current=root;
  for(const segment of path.slice(root.length).split('/').filter(Boolean)){
    current=join(current,segment);
    let info;try{info=await lstat(current);}catch(e){if(e.code!=='ENOENT'||!create)throw e;try{await mkdir(current,{mode:0o700});}catch(x){if(x.code!=='EEXIST')throw x;}info=await lstat(current);}
    if(!info.isDirectory()||info.isSymbolicLink())throw monitorError();
  }
  const info=await lstat(path);if(ownedLeaf)owned(info);if(privateLeaf&&(info.mode&0o777)!==0o700)throw monitorError();
  if(await realpath(path)!==path)throw monitorError();return path;
}
export async function readMonitorFile(path,limit){
  await safeDirectory(dirname(path));const before=await lstat(path);owned(before);
  if(!before.isFile()||before.isSymbolicLink()||(before.mode&0o777)!==0o600)throw monitorError();if(before.size>limit)throw monitorError('MONITOR_LIMIT');
  const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const admitted=await handle.stat();if(!same(before,admitted))throw monitorError();const bytes=await handle.readFile();if(bytes.length>limit)throw monitorError('MONITOR_LIMIT');if(!same(admitted,await handle.stat())||!same(admitted,await lstat(path)))throw monitorError();return bytes;}finally{await handle.close();}
}
export async function readMonitorRequest(path){const bytes=await readMonitorFile(path,1048576);const request=validateRequest(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes)));await safeDirectory(request.owner.notesDirectory);if(path!==join(request.owner.notesDirectory,`qa-request-${request.requestId}-r${request.revision}.json`))throw monitorError();return request;}
export async function publishMonitorMember(path,bytes){
  const parent=dirname(path);await safeDirectory(parent,{create:true,privateLeaf:true});
  const temporary=join(parent,`.tmp-${randomUUID()}`);const handle=await open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}
  try{
    await link(temporary,path);
    const directory=await open(parent,constants.O_RDONLY);try{await directory.sync();}finally{await directory.close();}
    if(!(await readMonitorFile(path,bytes.length)).equals(bytes))throw monitorError('MONITOR_CONFLICT');
  }catch(e){if(e.code==='EEXIST'){if(!(await readMonitorFile(path,bytes.length)).equals(bytes))throw monitorError('MONITOR_CONFLICT');}else throw e;}
  finally{await unlink(temporary);}
}
export function monitorRoot(env=process.env){return env.QA_MONITOR_ROOT??join(homedir(),'.qa-console-private','monitor-v1');}
export async function announceMission(requestPath,{root=monitorRoot()}={}){
  const request=await readMonitorRequest(requestPath),binding=requestBinding(request),missionId=missionIdentity(binding);
  const manifest={schemaVersion:'qa-monitor-mission.v1',missionId,request:binding,requestPath,notesDirectory:request.owner.notesDirectory,capturedAt:request.capturedAt,label:`QA request ${request.requestId.slice(0,8)}`,product:request.owner.product,originalScope:request.originalScope,previousMissionId:request.previousDigest===null?null:missionIdentity({requestId:request.requestId,revision:request.revision-1,requestDigest:request.previousDigest})};
  const journalDirectory=join(request.owner.notesDirectory,'.qa-monitor','v1',missionId);
  await safeDirectory(root,{create:true,privateLeaf:true});
  for(const directory of [join(request.owner.notesDirectory,'.qa-monitor'),join(request.owner.notesDirectory,'.qa-monitor','v1'),journalDirectory,join(journalDirectory,'events')])await safeDirectory(directory,{create:true,privateLeaf:true});
  await publishMonitorMember(join(journalDirectory,'mission.json'),validatedBytes(manifest,MONITOR_LIMITS.manifest,validateManifest));
  const discovery={schemaVersion:'qa-monitor-discovery.v1',missionId,requestPath,requestDigest:request.digest,journalDirectory};
  const bytes=Buffer.from(JSON.stringify(discovery)+'\n');if(bytes.length>MONITOR_LIMITS.manifest)throw monitorError('MONITOR_LIMIT');
  await publishMonitorMember(join(root,`${missionId}.json`),bytes);return manifest;
}
export async function countPublishedEvents(journal){
  let count=0;for(const operation of await readdir(join(journal,'events'),{withFileTypes:true})){
    if(operation.name.startsWith('.tmp-'))continue;
    if(!operation.isDirectory()||operation.isSymbolicLink())throw monitorError();
    for(const member of await readdir(join(journal,'events',operation.name))){if(member.endsWith('.json')&&!member.startsWith('.tmp-'))count++;if(count>MONITOR_LIMITS.members)throw monitorError('MONITOR_LIMIT');}
  }return count;
}
export async function startMonitorOperation(requestPath,producer,{root=monitorRoot(),operationId=randomUUID(),now=()=>new Date().toISOString()}={}){
  if(typeof operationId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(operationId))throw monitorError();
  const mission=await announceMission(requestPath,{root});
  const journal=join(mission.notesDirectory,'.qa-monitor','v1',mission.missionId),directory=join(journal,'events',operationId);
  await safeDirectory(directory,{create:true,privateLeaf:true});let sequence=0,tail=Promise.resolve();
  const publish=payload=>{
    const run=async()=>{
      if(await countPublishedEvents(journal)>=MONITOR_LIMITS.members)throw monitorError('MONITOR_LIMIT');
      // Reread the immutable request before every member publication.
      const request=await readMonitorRequest(requestPath);if(request.digest!==mission.request.requestDigest)throw monitorError();
      const body={schemaVersion:'qa-monitor-event.v1',missionId:mission.missionId,request:mission.request,operationId,localSequence:sequence+1,observedAt:now(),producer,payload};
      const event={...body,digest:monitorDigest(body)};const bytes=validatedBytes(event,MONITOR_LIMITS.event,validateEvent);
      await publishMonitorMember(join(directory,`${sequence+1}.json`),bytes);sequence++;return event;
    };const next=tail.then(run);tail=next.catch(()=>{});return next;
  };
  return {mission,operationId,publish,finish:(outcome,code)=>publish({kind:'command_finished',outcome,code:COMMAND_CODES.includes(code)?code:null}),close:()=>tail};
}
export async function bestEffortMonitor(requestPath,producer,options={}){
  if((options.env??process.env).QA_MONITOR==='off')return null;
  const diagnostic=options.diagnostic??(value=>process.stderr.write(JSON.stringify(value)+'\n'));let reported=false;
  const report=e=>{if(reported)return;reported=true;const code=['MONITOR_INVALID_CONTEXT','MONITOR_LIMIT','MONITOR_CONFLICT'].includes(e?.monitorCode)?e.monitorCode:'MONITOR_UNAVAILABLE';try{diagnostic({schemaVersion:'qa-monitor-diagnostic.v1',code});}catch{}};
  try{
    const operation=await startMonitorOperation(requestPath,producer,{...options,root:options.root??monitorRoot(options.env??process.env)});
    const safe=fn=>async(...args)=>{try{return await fn(...args);}catch(e){report(e);return null;}};
    return {...operation,publish:safe(operation.publish),finish:safe(operation.finish),close:safe(operation.close)};
  }catch(e){report(e);return null;}
}
