import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,realpath,symlink,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {captureRequest} from '../skills/qa-check/scripts/request-contract.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);

async function fixture() {
  const dir=await realpath(await mkdtemp(join(tmpdir(),'qa-monitor-test-')));
  const notes=join(dir,'notes'),root=join(dir,'discovery');
  await mkdir(notes,{mode:0o700});
  const request=captureRequest({requestId:'12345678-1234-4123-8123-123456789abc',capturedAt:'2026-10-11T09:00:00.000Z',owner:{product:'fixture',specialist:'qa-product-v0',checkpointPath:join(notes,'owner.md'),notesDirectory:notes,workspacePath:null},scope:'full',text:'PRIVATE_PROMPT_SENTINEL',sourceItems:[],exclusions:[]});
  const path=join(notes,`qa-request-${request.requestId}-r1.json`);
  await writeFile(path,JSON.stringify(request),{mode:0o600});
  return {dir,root,request,path};
}
test('actual saved request announces once and emits immutable command metadata without prompt',async()=>{
  const api=await import('../skills/qa-check/scripts/monitor.mjs').catch(()=>null);
  assert.equal(typeof api?.announceMission,'function','monitor publication missing');
  const f=await fixture();
  const mission=await api.announceMission(f.path,{root:f.root});
  assert.equal(mission.request.requestDigest,f.request.digest);
  assert.equal(mission.label,'QA request 12345678');
  assert.equal(JSON.stringify(mission).includes('PRIVATE_PROMPT_SENTINEL'),false);
  assert.deepEqual(await api.announceMission(f.path,{root:f.root}),mission);
  assert.equal((await readdir(f.root)).length,1);
  const operation=await api.startMonitorOperation(f.path,{kind:'root_request',operation:'report',host:'unknown'},{root:f.root});
  await operation.publish({kind:'command_started'});
  await operation.finish('refused','PRIVATE_WRITE_BUSY');
  const events=await readdir(join(mission.notesDirectory,'.qa-monitor','v1',mission.missionId,'events',operation.operationId));
  assert.deepEqual(events.sort(),['1.json','2.json']);
  const end=JSON.parse(await readFile(join(mission.notesDirectory,'.qa-monitor','v1',mission.missionId,'events',operation.operationId,'2.json'),'utf8'));
  assert.deepEqual(end.payload,{kind:'command_finished',outcome:'refused',code:'PRIVATE_WRITE_BUSY'});
});
test('symlink discovery refuses without changing immutable request',async()=>{
  const api=await import('../skills/qa-check/scripts/monitor.mjs').catch(()=>null);
  assert.equal(typeof api?.announceMission,'function','monitor publication missing');
  const f=await fixture(),before=await readFile(f.path);
  await symlink(f.request.owner.notesDirectory,f.root);
  await assert.rejects(api.announceMission(f.path,{root:f.root}));
  assert.deepEqual(await readFile(f.path),before);
});
test('ordinary capture and blocked intake report automatically publish in private test roots',async()=>{
  const f=await fixture();await writeFile(join(f.dir,'brief.txt'),'PRIVATE_PROMPT_SENTINEL');
  const env={...process.env,QA_MONITOR:'on',QA_MONITOR_ROOT:f.root};
  const cli=new URL('../skills/qa-check/scripts/request.mjs',import.meta.url).pathname;
  const captured=await exec(process.execPath,[cli,'capture','--text-file',join(f.dir,'brief.txt'),'--scope','full','--product','fixture','--specialist','qa-product-v0','--checkpoint',join(f.request.owner.notesDirectory,'owner.md'),'--notes-dir',f.request.owner.notesDirectory],{env});
  assert.equal(captured.stderr,'');
  const result=JSON.parse(captured.stdout),announcements=await readdir(f.root).catch(()=>[]);
  assert.equal(announcements.length,1,'ordinary capture must announce before workspace');
  const report=await exec(process.execPath,[cli,'report','--request',result.path,'--reason','Registration refused; documentary batch one'],{env});
  assert.equal(report.stderr,'');
  const discovery=JSON.parse(await readFile(join(f.root,announcements[0]),'utf8'));
  const operations=await readdir(join(discovery.journalDirectory,'events'));
  const events=[];for(const operation of operations)for(const file of await readdir(join(discovery.journalDirectory,'events',operation)))events.push(JSON.parse(await readFile(join(discovery.journalDirectory,'events',operation,file),'utf8')));
  assert.equal(events.filter(e=>e.payload.kind==='owner_reference'&&e.payload.reference.type==='intake_report').length,1);
  assert.equal(JSON.stringify(events).includes('PRIVATE_PROMPT_SENTINEL'),false);
});
test('invalid operation identity cannot create an escaped directory',async()=>{
 const api=await import('../skills/qa-check/scripts/monitor.mjs'),f=await fixture();
 await assert.rejects(api.startMonitorOperation(f.path,{kind:'root_request',operation:'report',host:'unknown'},{root:f.root,operationId:'../../escaped'}));
 const mission=await api.announceMission(f.path,{root:f.root});
 assert.ok(!(await readdir(join(f.request.owner.notesDirectory,'.qa-monitor','v1',mission.missionId))).includes('escaped'));
});
test('nonprivate metadata destination refuses without changing the request',async()=>{
 const api=await import('../skills/qa-check/scripts/monitor.mjs'),f=await fixture(),before=await readFile(f.path);
 await mkdir(f.root,{mode:0o700});await chmod(f.root,0o755);
 await assert.rejects(api.announceMission(f.path,{root:f.root}));assert.deepEqual(await readFile(f.path),before);
});
