import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
// Disposable exact-branch diagnostic only. Never a product runner or merge qualification.
const packet=process.env.QA_DIAGNOSTIC_DIR,consoleRoot=process.env.QA_CONSOLE_ROOT,kernelRoot=process.env.QA_STARTER_REPO;
for(const p of [packet,consoleRoot,kernelRoot])assert.ok(typeof p==='string'&&path.isAbsolute(p));
const fixtureFile=path.join(packet,'FRESH-FIXTURE.json');
let fixtureRoot=fs.existsSync(fixtureFile)?JSON.parse(fs.readFileSync(fixtureFile)).root:undefined;
let workspace=fixtureRoot?path.join(fixtureRoot,'nuanu-readonly-qa'):undefined;
const requestId='a2a42cea-6ea7-4a36-b326-734b81e13903';
const key={requestId,requestRevision:1};
const sourceCommit='c43fc0161aa4d22923f2d0badfc4992f4510a611';
const kernelCommit='794e9fbae372ebf1fe8261556ec1ea0a4bceab26';
const sha=b=>createHash('sha256').update(b).digest('hex');
const error=e=>({name:e?.name??'Error',code:typeof e?.code==='string'?e.code:null,message:String(e?.message??e).slice(0,1000)});
let ordinal=0,recordBytes=0;
function phase(stage,fields={}){const line=JSON.stringify({ordinal:++ordinal,stage,at:new Date().toISOString(),monotonicMs:performance.now(),...fields})+'\n';recordBytes+=Buffer.byteLength(line);if(ordinal>256||recordBytes>65536)throw Error('Diagnostic phase limit');fs.writeSync(1,line);}
const sourceImport=async rel=>{phase('import-begin',{rel});const m=await import(pathToFileURL(path.join(consoleRoot,rel)));phase('import-end',{rel});return m;};
if(process.argv[2]==='child'){
 const probe=process.argv[3];phase('child-start',{probe});
 try{
  if(probe==='setup'){
   const {registerAuthoredFixture,publishNuanuAuthoredRevision}=await sourceImport('tests/fixtures/nuanu-readonly/fixture.ts');
   const {canonicalJson}=await sourceImport('src/lib/canonical-digest.ts');
   const {mkdtemp,realpath}=await import('node:fs/promises');const os=await import('node:os');
   const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'qa-request-read-diagnostic-fixture-')));phase('fresh-diagnostic-fixture-start');
 const fixture=await registerAuthoredFixture('http://127.0.0.1:59126/',root,{productSlug:'request-ui-consumer',name:'Request UI consumer',description:'Literal local registered model, not product acceptance',
  surfaces:[{kind:'api',name:'Fixture API'}],journeys:Array.from({length:5},(_,i)=>({name:`Inspect fixture ${i+1}`,expectedOutcome:`Literal fixture ${i+1}`})),authoredJourneyName:'Inspect fixture 1'});
 const authority=await publishNuanuAuthoredRevision(fixture);
 const kernel=fixture.kernel,workspaceDir=fixture.workspacePath;
 // Independent literal oracle pinned by the additive fixture card, not copied from a fresh response.
 const expectedBlockers=[
  ['urn:qa:draft-blocker:3bf21ca58e62552ac29c53d0','The generated automated candidate has no approved oracle'],
  ['urn:qa:draft-blocker:8d2939a67c6a5e646edcf95b','No honest runnable check can be generated from current inputs'],
  ['urn:qa:draft-blocker:a57dd63f254fd55721871d0a','No honest runnable check can be generated from current inputs'],
  ['urn:qa:draft-blocker:c727b74272bf00041d03ff5c','No honest runnable check can be generated from current inputs'],
  ['urn:qa:draft-blocker:ca91c6b8204fbf8645c9a92f','No honest runnable check can be generated from current inputs'],
  ['urn:qa:draft-blocker:e6852df3d93f4551c54639c8','No honest runnable check can be generated from current inputs'],
 ].map(([blockerId,reason])=>({blockerId,code:'COVERAGE_GAP',reason,recovery:['Resolve the discovery item and recompile registration']}));
 assert.equal(authority.compilation.coverage.items.length,6);
 assert.deepEqual(authority.compilation.strategy.blockers,expectedBlockers);
 assert.deepEqual(authority.compilation.strategy.blockers,fixture.authority.compilation.strategy.blockers);
 const entries=authority.compilation.catalog.entries.filter(e=>e.oracle.state==='resolved'),observations=[];
 assert.ok(entries.length>=2);
 for(let i=0;i<2;i++){
  const entry=entries[i],evidenceId=kernel.stableId('evidence',{fixture:'request-ui-consumer',i}),identity={state:'unknown',reason:'Local synthetic fixture; no deployment'};
  const payload={schemaVersion:'agent-tool-observation.v1',provenance:'agent_authored_unattested',scope:`Scope ${i+1}`,expectedBehavior:entry.oracle.description,expectationBasis:'Reviewed fixture oracle',
   actual:i===0?'Literal caller-observed issue':'Partial local observation',result:i===0?'failed':'passed',tool:'Local source fixture',author:{agent:'Sol 6.1 consumer',host:'codex',authoredAt:'2026-10-09T00:00:01.000Z'},limitations:['Unattested caller observation, not product PASS'],attachments:[]};
  const artifactBytes=Buffer.from(canonicalJson(payload));
  const body={schemaVersion:'evidence-manifest.v1',planDigest:authority.compilation.strategy.semanticDigest,redactionPolicyVersion:'kernel-secret-policy.v1',entries:[{evidenceId,kind:'agent_tool_observation',adapterId:'agent/tool',checkId:entry.checkId,stepId:'fixture-observe',candidateDigest:kernel.digestCanonical(identity),environmentDigest:kernel.digestCanonical(identity),captureTime:'2026-10-09T00:00:01Z',rawPrivatePath:`.qa-private/evidence/agent-tool-observations/${evidenceId.split(':').at(-1)}/artifact.json`,byteSize:artifactBytes.length,contentDigest:kernel.digestBytes(artifactBytes),redactionStatus:'passed',retentionClass:'private_observation',metadata:{publicationAuthorityDigest:authority.semanticDigest,requirementId:entry.targetIds[0],oracleDigest:kernel.digestCanonical(entry.oracle),candidateIdentity:identity,environmentIdentity:identity,identityProvenance:'caller_declared',observationProvenance:'agent_authored_unattested',provenanceLimitation:'Digests prove stored-byte integrity only; they do not attest tool invocation or live deployment identity.'}}]};
  await kernel.recordAgentToolObservation({workspacePath:workspaceDir,artifactBytes,manifest:{...body,semanticDigest:kernel.digestCanonical(kernel.projectEvidenceManifestSemantics(body))}});observations.push(evidenceId);
 }
 const contract=await sourceImport('vendor/qa-request/request-contract.mjs');
 const capture=requestId=>contract.captureRequest({requestId,capturedAt:'2026-10-09T00:00:00.000Z',owner:{product:'request-ui-consumer',specialist:'qa-product-v0',workspacePath:workspaceDir,checkpointPath:path.join(root,'CURRENT.md'),notesDirectory:root},scope:'full',text:'Inspect complete cafe\u0301 scope; preserve every original clause.',exclusions:['No product actions'],sourceItems:Array.from({length:5},(_,i)=>{const content=`Literal source clause ${i+2}`;return {id:`item-${i+2}`,kind:'text_file',locator:path.join(root,`source-${i+2}.txt`),content,contentDigest:`sha256:${createHash('sha256').update(content).digest('hex')}`,availability:'complete',limitation:null};})});
 const requestRecord=capture('a2a42cea-6ea7-4a36-b326-734b81e13903'),runId=`agent-request-${requestRecord.requestId}-r1`;
 const dispositions=['observed_issue','partial','blocked','unassessed','excluded','observed_as_expected'];
 const checkpoint={author:{agent:'Sol 6.1 consumer',host:'codex'},stop:{kind:'unknown_effects',reason:'Reconcile literal unknown effect before further work'},definitions:dispositions.map((_,i)=>{const mapped=i<2||i===5,entry=entries[i===0?0:1];return {id:`obligation-${i+1}`,clauseIds:[`clause-${i+1}`],title:`Scope ${i+1}`,expectedBehavior:`Expected ${i+1}`,expectationBasis:'Literal caller fixture source',targetIds:mapped?entry.targetIds:[],checkIds:mapped?[entry.checkId]:[],mappingLimitation:mapped?null:'Explicitly unmapped'};}),assessments:dispositions.map((disposition,i)=>({obligationId:`obligation-${i+1}`,disposition,actual:i===0?'Literal caller-observed issue':`Actual ${i+1}`,reasoning:`Literal reasoning ${i+1}`,limitations:['Not full oracle completeness'],evidenceIds:i<2||i===5?[observations[i===0?0:1]]:[],effectState:i===0?'unknown':'none_declared',effectExplanation:'Explicit local caller declaration',remainingAction:i>0&&i<4?`Remaining ${i+1}`:null,supersedesReason:null}))};

   Object.assign(process.env,{QA_CONSOLE_STATE:path.join(root,'console-receipts.json'),QA_WORKSPACE_ROOTS:root,QA_REGISTRATION_STORE:fixture.storeRoot,QA_REGISTRATION_TARGET_REGISTRY:path.join(root,'registration-targets.json'),QA_CONSOLE_PRIVATE_ROOT:path.join(root,'console-private')});
   phase('initial-writer-begin');const started=performance.now();const tsx=createRequire(path.join(consoleRoot,'package.json')).resolve('tsx');
   const r=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--import',tsx,path.join(consoleRoot,'scripts/qa-campaign.ts'),'record-agent-request','--workspace',workspaceDir],{cwd:consoleRoot,env:process.env,shell:false,stdio:['pipe','pipe','pipe']});let stdout='',stderr='',bytes=0;const timer=setTimeout(()=>child.kill('SIGKILL'),180000);
    const collect=(b,keep)=>{bytes+=b.length;if(bytes>8*1024*1024){child.kill('SIGKILL');return;}if(keep)stdout+=b.toString();else stderr+=b.toString();};
    child.stdout.on('data',b=>collect(b,true));child.stderr.on('data',b=>collect(b,false));child.once('error',reject);child.once('close',(status,signal)=>{clearTimeout(timer);resolve({status,signal,stdout,stderr,elapsedMs:performance.now()-started});});child.stdin.end(JSON.stringify({requestRecord,expectedFileDigest:null,checkpoint}));});
   fs.writeFileSync(path.join(packet,'INITIAL-WRITER.json'),JSON.stringify(r,null,2)+'\n');phase('initial-writer-end',{status:r.status,signal:r.signal,elapsedMs:r.elapsedMs,stdoutBytes:Buffer.byteLength(r.stdout),stderrBytes:Buffer.byteLength(r.stderr)});
   assert.equal(r.status,0);assert.equal(r.signal,null);assert.equal(r.stderr,'');const envelope=JSON.parse(r.stdout);assert.equal(envelope.ok,true);assert.equal(envelope.command,'record-agent-request');assert.equal(envelope.result.status,'created');assert.equal(envelope.result.readback.binding,'current');
   const recordBytes=fs.readFileSync(path.join(workspaceDir,'.qa-private/evidence',`agent-request-${requestId}-r1.json`));assert.deepEqual(JSON.parse(recordBytes),envelope.result.readback.record);
   fs.writeFileSync(fixtureFile,JSON.stringify({root,workspaceDir,sourceCommit,kernelCommit,requestId,requestRevision:1,selectedCheckpoint:1,recordSha256:sha(recordBytes),basis:envelope.result.readback.record.basis,createdBinding:envelope.result.readback.binding},null,2)+'\n');phase('fresh-checkpoint1-created',{coverageTargets:authority.compilation.coverage.items.length,blockers:expectedBlockers.length,observations:observations.length,checkpoints:1});
  }else if(probe==='bridge'){
   const {createServer}=await import('node:http');const {createBridge}=await sourceImport('server/bridge.mjs');
   const {listenSelectedCampaignServer,finishSelectedCampaignConsumer}=await sourceImport('tests/fixtures/selected-campaign-consumer-lifecycle.mjs');
   const bridge=createBridge({workspaceDir:workspace,starterRepo:kernelRoot});const server=createServer((req,res)=>{if(!bridge.handleRequest(req,res)){res.writeHead(404);res.end();}});
   let failure;try{await listenSelectedCampaignServer(server);phase('server-listening',{port:server.address().port,coldStartupElapsedMs:performance.now()});
    const url='http://127.0.0.1:'+server.address().port+'/api/workspace?'+new URLSearchParams({dir:workspace,runKind:'agent_request',run:`agent-request-${requestId}-r1`,checkpoint:'1'});
    phase('bridge-get-begin',{handlerReadBudgetMs:15000});const start=performance.now();const r=await fetch(url);const bytes=Buffer.from(await r.arrayBuffer()),elapsedMs=performance.now()-start;if(bytes.length>8*1024*1024)throw Error('Response limit');fs.writeFileSync(path.join(packet,'BRIDGE-RESPONSE.json'),bytes);phase('bridge-get-end',{status:r.status,elapsedMs,bytes:bytes.length,sha256:sha(bytes),non200Body:r.status===200?null:bytes.toString('utf8').slice(0,8192)});
    assert.equal(r.status,200,'Actual bridge must return200, not a faster unavailable response');assert.ok(elapsedMs<15000,'Late200 is not production15s admission');
    const body=JSON.parse(bytes),value=body.agentRequest?.value;
    const {projectOwnerSnapshot}=await sourceImport('src/primary-ui/owner/projection.ts');
    const projection=projectOwnerSnapshot(body,{source:'live',workspaceDir:workspace,run:{kind:'agent_request',runId:`agent-request-${requestId}-r1`,checkpointRevision:1}});
    assert.equal(body.agentRequest.kind,'selected');assert.equal(projection.requestModel.kind,'same_basis');assert.equal(value.readback.binding,'current');assert.equal(value.readback.selectedCheckpointRevision,1);
    const storedBytes=fs.readFileSync(path.join(workspace,'.qa-private/evidence',`agent-request-${requestId}-r1.json`));
    assert.deepEqual(value.readback.record,JSON.parse(storedBytes));assert.equal(value.readback.fileDigest,`sha256:${sha(storedBytes)}`);
    assert.equal(value.readback.record.request.clauses.length,6);assert.equal(value.readback.record.revisions.length,1);assert.equal(value.readback.record.revisions[0].definitions.length,6);
    assert.equal(value.readback.evidenceStatus.length,2);assert.ok(value.readback.evidenceStatus.every(s=>s.state==='verified_current'));
    assert.deepEqual(value.view.remainderIds,['obligation-1','obligation-2','obligation-3','obligation-4']);assert.deepEqual(value.readback.resumeEligible,[]);
    assert.equal(body.coverage.items.length,6);assert.equal(body.testStrategyDraft.blockers.length,6);
    phase('bridge-qualified-current',{status:r.status,elapsedMs,requestModel:projection.requestModel.kind,binding:value.readback.binding,clauses:6,obligations:6,observations:2,coverageTargets:6,blockers:6,checkpoint:1});
   }catch(e){failure=e;phase('bridge-error',{error:error(e)});}finally{await finishSelectedCampaignConsumer({server,primaryFailure:failure,recordEvidence:async(f,attempts)=>phase('server-cleanup',{attempts,serverListening:server.listening,primaryFailure:f?error(f):null})});}
  }else if(probe==='base'){
   const {readWorkspaceSnapshot}=await sourceImport('server/workspace-snapshot.mjs');let forbiddenCalls=0;
   const sentinel=new Proxy({}, {get(){return()=>{forbiddenCalls++;throw Error('DIAGNOSTIC_FORBIDDEN_EVIDENCE_CALL');};}});
   phase('base-snapshot-begin',{diagnosticSentinel:true});const s=await readWorkspaceSnapshot({workspaceDir:workspace,workspaceRoots:[fixtureRoot],registrationRuntime:sentinel,oracleApprovalStoreRoot:path.join(packet,'private','oracle-approvals'),consoleReceipts:[],evidenceMode:'base_only'});
   const b=Buffer.from(JSON.stringify(s));phase('base-snapshot-end',{bytes:b.length,sha256:sha(b),forbiddenCalls,campaignEvidence:s.campaignEvidence,firstEvidence:s.firstEvidence});assert.equal(forbiddenCalls,0);
  }else if(probe==='core'){
   const {createBoundAgentObservationRuntime}=await sourceImport('src/node/agent-request-runtime.ts');const {captureAgentRequestReport}=await sourceImport('src/node/agent-request-report.ts');
   phase('actual-factory-begin');const runtime=await createBoundAgentObservationRuntime();phase('actual-factory-end');const wrapped={...runtime};
   for(const name of ['capture','readPrivate','readObservation']){const original=runtime[name];wrapped[name]=async function(...args){phase('runtime-method-begin',{name});try{const result=await Reflect.apply(original,runtime,args);phase('runtime-method-end',{name});return result;}catch(e){phase('runtime-method-error',{name,error:error(e)});throw e;}};}
   phase('actual-report-begin');const r=await captureAgentRequestReport({workspacePath:workspace,key,checkpointRevision:1},wrapped);const b=Buffer.from(JSON.stringify(r));phase('actual-report-end',{binding:r.readback.binding,evidenceStatus:r.readback.evidenceStatus.map(s=>({state:s.state,code:s.code})),bytes:b.length,sha256:sha(b),selectedCheckpointRevision:r.readback.selectedCheckpointRevision});
  }else throw Error('Unknown diagnostic probe');
  phase('child-complete',{probe});
 }catch(e){phase('child-error',{probe,error:error(e)});process.exitCode=1;}
}else{
 const diagnosticStarted=performance.now(),results=[];let totalPhaseBytes=0,totalRecords=0;
 const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',timeout:10000}).trim();
 const inventory=()=>{const rows=[];function visit(dir){for(const n of fs.readdirSync(dir).sort()){const p=path.join(dir,n),s=fs.lstatSync(p);assert.equal(s.isSymbolicLink(),false);if(s.isDirectory())visit(p);else{assert.ok(s.isFile());const b=fs.readFileSync(p);rows.push({path:path.relative(workspace,p),sha256:sha(b),size:b.length,mode:s.mode&0o777});}}}visit(workspace);return rows.sort((a,b)=>a.path.localeCompare(b.path));};
 const require=createRequire(path.join(consoleRoot,'package.json')),tsx=require.resolve('tsx');
 const env={PATH:process.env.PATH,LANG:'C.UTF-8',QA_CONSOLE_ROOT:consoleRoot,QA_DIAGNOSTIC_DIR:packet,QA_STARTER_REPO:kernelRoot,QA_STARTER_EXPECTED_SHA:kernelCommit,TSX_DISABLE_CACHE:'1',QA_CONSOLE_STATE:path.join(packet,'read-only-missing-receipts.json'),QA_CONSOLE_PRIVATE_ROOT:path.join(packet,'private'),QA_REGISTRATION_TARGET_REGISTRY:path.join(packet,'read-only-missing-registry.json'),TMPDIR:packet};
 async function ownedProbe(probe,limitMs){
  return new Promise(resolve=>{
   const start=performance.now(),child=spawn(process.execPath,['--import',tsx,fileURLToPath(import.meta.url),'child',probe],{cwd:consoleRoot,env,shell:false,detached:true,stdio:['ignore','pipe','pipe']});let out='',err='',timedOut=false,closed=false,code=null,signal=null,extraGroups=[];
   const stdout=fs.openSync(path.join(packet,`${probe.toUpperCase()}-PHASES.jsonl`),'wx',0o600),stderr=fs.openSync(path.join(packet,`${probe.toUpperCase()}-STDERR.txt`),'wx',0o600);
   const kill=()=>{try{const rows=execFileSync('ps',['-axo','pid=,ppid=,pgid='],{encoding:'utf8',timeout:1000}).trim().split('\n').map(l=>l.trim().split(/\s+/).map(Number));const owned=new Set([child.pid]);let grew=true;while(grew){grew=false;for(const [pid,ppid]of rows)if(owned.has(ppid)&&!owned.has(pid)){owned.add(pid);grew=true;}}extraGroups=[...new Set(rows.filter(([pid])=>owned.has(pid)).map(r=>r[2]))].filter(g=>g!==process.pid);for(const g of extraGroups)try{process.kill(-g,'SIGKILL');}catch{}}catch{}try{process.kill(-child.pid,'SIGKILL');}catch{}try{child.kill('SIGKILL');}catch{}};
   const timer=setTimeout(()=>{timedOut=true;kill();},limitMs);
   const absent=g=>{try{process.kill(-g,0);return false;}catch(e){return e.code==='ESRCH';}};
   child.stdout.on('data',b=>{out+=b.toString();totalPhaseBytes+=b.length;totalRecords+=b.toString().split('\n').length-1;fs.writeSync(stdout,b);fs.writeSync(1,b);if(totalPhaseBytes>65536||totalRecords>256)kill();});
   child.stderr.on('data',b=>{err+=b.toString();fs.writeSync(stderr,b);if(Buffer.byteLength(err)>65536)kill();});
   child.once('error',e=>{err+=JSON.stringify(error(e));});child.once('close',(c,s)=>{closed=true;code=c;signal=s;});
   const check=setInterval(()=>{const elapsed=performance.now()-start,gone=absent(child.pid)&&extraGroups.every(absent);if((closed&&gone)||(elapsed>=limitMs+1000)){clearInterval(check);clearTimeout(timer);fs.closeSync(stdout);fs.closeSync(stderr);resolve({probe,limitMs,elapsedMs:elapsed,timedOut,code,signal,closed,ownedProcessGroupAbsent:gone,cleanupConfirmed:closed&&gone,records:out.trim().split('\n').filter(Boolean).length,stderrBytes:Buffer.byteLength(err),cleanupWarnings:/CLEANUP_UNCONFIRMED/.test(err)});}},10);
  });
 }
 let before,readStarted;
 try{
  assert.equal(git(consoleRoot,'rev-parse','HEAD'),sourceCommit);assert.equal(git(consoleRoot,'status','--porcelain=v1'),'');assert.equal(git(kernelRoot,'rev-parse','HEAD'),kernelCommit);assert.equal(git(kernelRoot,'status','--porcelain=v1'),'');
  const setup=await ownedProbe('setup',180000);results.push(setup);phase('setup-result',setup);assert.ok(setup.cleanupConfirmed&&!setup.cleanupWarnings);assert.equal(setup.code,0);assert.equal(setup.timedOut,false);
  const metadata=JSON.parse(fs.readFileSync(fixtureFile));fixtureRoot=metadata.root;workspace=metadata.workspaceDir;env.QA_WORKSPACE_ROOTS=fixtureRoot;env.QA_REGISTRATION_STORE=path.join(fixtureRoot,'registration-store');
  readStarted=performance.now();const adminDeadline=readStarted+90000;assert.equal(fs.realpathSync(workspace),workspace);
  before=inventory();fs.writeFileSync(path.join(packet,'BEFORE-INVENTORY.json'),JSON.stringify(before,null,2)+'\n');
  const recordBytes=fs.readFileSync(path.join(workspace,'.qa-private/evidence',`agent-request-${requestId}-r1.json`)),record=JSON.parse(recordBytes);
  assert.equal(sha(recordBytes),metadata.recordSha256);assert.deepEqual(record.basis,metadata.basis);assert.equal(record.request.requestId,requestId);assert.equal(record.request.revision,1);assert.deepEqual(record.revisions.map(c=>c.revision),[1]);assert.equal(record.basis.workspaceDir,workspace);
  // Only ONE cold bridge GET. The real handler owns15s and its existing
  // cleanup; the90s outer administration includes cold startup and closure.
  // Reserve the existing1s supervisor cleanup inside that administration.
  const remaining=adminDeadline-performance.now();if(remaining<16000)throw Error('Administrative remaining budget prevents bridge');
  const r=await ownedProbe('bridge',Math.floor(remaining-1000));results.push(r);phase('probe-result',r);
  assert.ok(r.cleanupConfirmed&&!r.cleanupWarnings,'Cleanup unconfirmed');assert.equal(r.timedOut,false);assert.equal(r.code,0);
  assert.ok(performance.now()<=adminDeadline,'Read administration90s exceeded');
 }catch(e){phase('diagnostic-error',{error:error(e)});process.exitCode=1;}
 finally{
  let parity=null,inventoryFiles=null;if(before){const after=inventory();fs.writeFileSync(path.join(packet,'AFTER-INVENTORY.json'),JSON.stringify(after,null,2)+'\n');parity=JSON.stringify(before)===JSON.stringify(after);inventoryFiles=after.length;if(!parity)process.exitCode=1;}
  const result={diagnosticOnly:true,noMergeGateCredit:true,sourceCommit,kernelCommit,node:process.version,platform:process.platform,at:new Date().toISOString(),totalElapsedMs:performance.now()-diagnosticStarted,readElapsedMs:readStarted===undefined?null:performance.now()-readStarted,setupBudgetMs:180000,readBudgetMs:90000,perReadMs:15000,cleanupGraceMs:1000,results,workspaceByteModeParity:parity,inventoryFiles,sourceClean:git(consoleRoot,'status','--porcelain=v1')==='',kernelClean:git(kernelRoot,'status','--porcelain=v1')==='',exitCode:process.exitCode??0};
  const line=JSON.stringify(result);assert.ok(Buffer.byteLength(line)<=65536);console.log(line);
 }
}
