import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Driver} from './driver.mjs';
async function fixture(t,mode){
 let clicks=0;
 const server=createServer((req,res)=>{
  let value;
  if(req.url.endsWith('/elements')) value=(mode==='ambiguous'?['a','b']:['a']).map(id=>({'element-6066-11e4-a52e-4f735466cecf':id}));
  else if(req.url.endsWith('/displayed')) value=true;
  else if(req.url.endsWith('/enabled')) value=mode!=='disabled';
  else if(req.url.endsWith('/click')){clicks++;value=null;}
  else {res.statusCode=500;value={error:'unknown error',message:'driver unavailable'};}
  res.setHeader('content-type','application/json');res.end(JSON.stringify({value}));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());
 return {driver:new Driver(`http://127.0.0.1:${server.address().port}`,'s'),clicks:()=>clicks};
}
test('ambiguous visible selector never clicks an arbitrary match',async t=>{const f=await fixture(t,'ambiguous');await assert.rejects(f.driver.tap('Wallet'),/Ambiguous/);assert.equal(f.clicks(),0);});
test('disabled controls are refused',async t=>{const f=await fixture(t,'disabled');await assert.rejects(f.driver.tap('Continue'),/disabled/);assert.equal(f.clicks(),0);});
test('unique visible enabled match can be activated',async t=>{const f=await fixture(t,'ok');await f.driver.tap('Wallet');assert.equal(f.clicks(),1);});
test('protocol errors propagate rather than producing success',async t=>{const f=await fixture(t,'ok');await assert.rejects(f.driver.back(),/driver unavailable/);});
test('cloud authorization is sent in headers, never URL',async t=>{
 let authorized=false;
 const server=createServer((req,res)=>{authorized=req.headers.authorization==='Basic fixture';res.setHeader('content-type','application/json');res.end('{"value":null}');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());
 await new Driver(`http://127.0.0.1:${server.address().port}`,'s',null,{Authorization:'Basic fixture'}).back();
 assert.equal(authorized,true);
});
test('onboarding waits through an empty initial hierarchy before choosing a branch',async t=>{
 let polls=0,clicks=0;
 const server=createServer((req,res)=>{
 let body='';req.on('data',b=>body+=b);req.on('end',()=>{
 let value=true;
 if(req.url.endsWith('/elements')){const {value:selector}=JSON.parse(body);if(selector==='Not now')polls++;value=selector==='Not now'&&polls>=2?[{'element-6066-11e4-a52e-4f735466cecf':'a'}]:[];}
 if(req.url.endsWith('/click')){clicks++;value=null;}
 res.setHeader('content-type','application/json');res.end(JSON.stringify({value}));
 });});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());
 const d=new Driver(`http://127.0.0.1:${server.address().port}`,'s');
 assert.equal(await d.tapIfPresent('Not now','Wallet'),true);assert.equal(clicks,1);
});
