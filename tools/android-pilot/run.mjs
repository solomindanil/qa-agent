#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Driver} from './driver.mjs';
import {runSteps} from './runner.mjs';
const [configPath,out,...flags]=process.argv.slice(2);
if(!configPath || !out) throw Error('Usage: node run.mjs CONFIG.json OUTPUT_DIR [--execute]');
const config=JSON.parse(await fs.readFile(configPath));
const planPath=new URL('./wallet-visit.json',import.meta.url);
const planBytes=await fs.readFile(planPath);const plan=JSON.parse(planBytes);
const url=new URL(config.endpoint);
if(!['127.0.0.1','hub-cloud.browserstack.com'].includes(url.hostname)||url.username||url.password)throw Error('Unsupported endpoint');
if(!flags.includes('--execute')){console.log(JSON.stringify({mode:'preview',endpoint:config.endpoint,device:config.device,scope:plan.scope,steps:plan.steps},null,2));process.exit(0);}
await fs.mkdir(out,{recursive:false});
let headers={'content-type':'application/json'};
if(url.hostname==='hub-cloud.browserstack.com'){
 if(url.protocol!=='https:')throw Error('Cloud requires HTTPS');
 const c=JSON.parse(await fs.readFile(process.env.BROWSERSTACK_CREDENTIALS_FILE));
 if(!c.username||!c.accessKey)throw Error('Missing BrowserStack credentials');
 headers.Authorization='Basic '+Buffer.from(`${c.username}:${c.accessKey}`).toString('base64');
}
let sessionId;let report;const start=Date.now();
const request=async(method,suffix,body)=>{
 const r=await fetch(config.endpoint+suffix,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(180000)});
 const data=await r.json();if(!r.ok||data.value?.error)throw Error(data.value?.message||`HTTP ${r.status}`);return data.value;
};
try{
 await fs.writeFile(path.join(out,'request.json'),JSON.stringify({startedAt:new Date().toISOString(),config,planSha256:createHash('sha256').update(planBytes).digest('hex')},null,2));
 const session=await request('POST','/session',{capabilities:{alwaysMatch:config.capabilities,firstMatch:[{}]}});sessionId=session.sessionId;
 await fs.writeFile(path.join(out,'session.json'),JSON.stringify(session,null,2));
 const d=new Driver(config.endpoint,sessionId,out,headers);
 await d.command('POST','/appium/settings',{settings:{waitForIdleTimeout:0,waitForSelectorTimeout:0}});
 report=await runSteps(plan.steps,d);
}catch(e){report={status:'EXECUTION_ERROR',error:e.message,steps:report?.steps||plan.steps.map(s=>({...s,status:'UNRUN'})),sessionCreationOutcome:sessionId?'known':'reconcile provider before retry'};}
finally{
 if(sessionId){try{await request('DELETE',`/session/${sessionId}`);report.sessionClosed=true;}catch(e){report.sessionClosed=false;report.cleanupError=e.message;}}
 report.totalDurationMs=Date.now()-start;report.device=config.device;report.sealed=false;report.fullAcceptance=false;
 await fs.writeFile(path.join(out,'result.json'),JSON.stringify(report,null,2));
 const entries=[];for(const name of await fs.readdir(out)){const bytes=await fs.readFile(path.join(out,name));entries.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
 await fs.writeFile(path.join(out,'MANIFEST.json'),JSON.stringify(entries,null,2));
 console.log(JSON.stringify({status:report.status,steps:report.steps.length,totalDurationMs:report.totalDurationMs,sessionClosed:report.sessionClosed}));
 if(report.status!=='OBSERVED_AS_EXPECTED'||!report.sessionClosed)process.exitCode=1;
}
