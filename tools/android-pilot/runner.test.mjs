import test from 'node:test';
import assert from 'node:assert/strict';
import {runSteps} from './runner.mjs';

// Broken final assertions must not be reported green; later actions must remain unrun.
test('failed assertion stops execution and retains the whole denominator', async () => {
  const result = await runSteps([{id:'first',op:'assert',selector:'Age',attribute:'text',equals:'29'}, {id:'later',op:'tap',selector:'Continue'}], {
    inspect: async()=>({displayed:true,enabled:true,text:'28'}),
    tap:async()=>{throw Error('Must not tap after failed assertion');},
    capture:async()=>({xml:'evidence.xml',png:'evidence.png'})
  });
  assert.equal(result.status,'ASSERTION_FAILED');
  assert.deepEqual(result.steps.map(x=>x.status),['ASSERTION_FAILED','UNRUN']);
  assert.equal(result.steps[0].actual,'28');
  assert.equal(result.steps[0].evidence.png,'evidence.png');
});
test('driver failure is an execution error rather than a product assertion failure', async()=>{
  const r=await runSteps([{id:'first',op:'tap',selector:'Wallet'}],{tap:async()=>{throw Error('connection refused');},capture:async()=>({})});
  assert.equal(r.status,'EXECUTION_ERROR');
});
test('successful action and explicit assertions finish all steps',async()=>{
  const r=await runSteps([{id:'tap',op:'tap',selector:'Wallet'},{id:'visible',op:'assert',selector:'Wallet',attribute:'displayed',equals:true}],{tap:async()=>{},inspect:async()=>({displayed:true}),capture:async()=>({png:'a.png'})});
  assert.equal(r.status,'OBSERVED_AS_EXPECTED');
  assert.equal(r.steps.length,2);
});
test('missing evidence prevents an observed-as-expected result',async()=>{
  const r=await runSteps([{id:'visible',op:'assert',selector:'Wallet',attribute:'displayed',equals:true}],{inspect:async()=>({displayed:true}),capture:async()=>{throw Error('disk failure');}});
  assert.equal(r.status,'EXECUTION_ERROR');
});
test('unsupported operation is refused before any action',async()=>{
  let touched=false;
  await assert.rejects(runSteps([{id:'tap',op:'tap',selector:'Wallet'},{id:'bad',op:'purchase'}],{tap:async()=>{touched=true;}}),/Unsupported/);
  assert.equal(touched,false);
});
test('a modal left open after Back fails the explicit absence check',async()=>{
 const r=await runSteps([{id:'closed',op:'absent',selector:'Choose your visit'}],{absent:async()=>false,capture:async()=>({png:'modal.png'})});
 assert.equal(r.status,'ASSERTION_FAILED');
});
test('optional onboarding action records whether it was actually performed',async()=>{
 const r=await runSteps([{id:'onboarding',op:'tapIfPresent',selector:'Not now'}],{tapIfPresent:async()=>false,capture:async()=>({png:'no-onboarding.png'})});
 assert.equal(r.status,'OBSERVED_AS_EXPECTED');assert.equal(r.steps[0].performed,false);
});
