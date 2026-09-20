/** Local caller-authored observations; never a managed acceptance receipt. */
export async function runSteps(steps, driver) {
  const ops = new Set(['tap','assert','back','absent','tapIfPresent']);
  const ids = new Set();
  for (const step of steps) {
    if (!ops.has(step.op)) throw Error(`Unsupported operation: ${step.op}`);
    if (!/^[a-zA-Z0-9_-]+$/.test(step.id) || ids.has(step.id)) throw Error('Invalid or duplicate step id');
    ids.add(step.id);
    if (step.op !== 'back' && (typeof step.selector !== 'string' || !step.selector)) throw Error('Missing selector');
    if (step.op === 'assert' && (!['displayed','enabled','text'].includes(step.attribute) || step.equals === undefined)) throw Error('Invalid assertion');
  }
  const report={status:'OBSERVED_AS_EXPECTED',sealed:false,steps:steps.map(s=>({...s,status:'UNRUN'}))};
  for (const step of report.steps) {
    const start=Date.now();
    try {
      if(step.op==='tapIfPresent') step.performed=await driver.tapIfPresent(step.selector,step.readySelector);
      else if(step.op==='tap') await driver.tap(step.selector);
      else if(step.op==='back') await driver.back();
      else if(step.op==='absent') {
        step.actual=await driver.absent(step.selector);
        if(!step.actual){step.status='ASSERTION_FAILED';report.status='ASSERTION_FAILED';}
      }
      else {
        const actual=(await driver.inspect(step.selector))[step.attribute];
        step.actual=actual;
        if(actual!==step.equals) {
          step.status='ASSERTION_FAILED';
          report.status='ASSERTION_FAILED';
        }
      }
      step.evidence=await driver.capture(step.id);
      if(step.status==='UNRUN') step.status='OBSERVED_AS_EXPECTED';
    } catch(e) {
      step.status='EXECUTION_ERROR';step.error=String(e.message);report.status='EXECUTION_ERROR';
      try {step.evidence=await driver.capture(`${step.id}-error`);} catch(c) {step.captureError=String(c.message);}
    }
    step.durationMs=Date.now()-start;
    if(report.status!=='OBSERVED_AS_EXPECTED') break;
  }
  return report;
}
