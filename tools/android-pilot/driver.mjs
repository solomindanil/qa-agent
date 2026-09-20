import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const elementKey='element-6066-11e4-a52e-4f735466cecf';
export class Driver {
  constructor(endpoint,sessionId,out,headers={}){this.headers=headers;this.endpoint=endpoint;this.sessionId=sessionId;this.out=out;}
  async command(method,path,body){
    const r=await fetch(`${this.endpoint}/session/${this.sessionId}${path}`,{method,headers:{...this.headers,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
    const data=await r.json();
    if(!r.ok || data.value?.error) throw Error(data.value?.message || `HTTP ${r.status}`);
    return data.value;
  }
  async unique(selector){
    const end=Date.now()+10000;
    do {
      const found=await this.command('POST','/elements',{using:selector.startsWith('//')?'xpath':'accessibility id',value:selector});
      const visible=[];
      for(const e of found){const id=e[elementKey];if(await this.command('GET',`/element/${id}/displayed`)) visible.push(id);}
      if(visible.length>1) throw Error(`Ambiguous visible selector: ${selector}`);
      if(visible.length===1)return visible[0];
      await new Promise(r=>setTimeout(r,300));
    }while(Date.now()<end);
    throw Error(`No visible element: ${selector}`);
  }
  async tapIfPresent(selector,readySelector){
    const deadline=Date.now()+30000;
    const find=value=>this.command('POST','/elements',{using:value.startsWith('//')?'xpath':'accessibility id',value});
    do {
      if((await find(selector)).length){await this.tap(selector);return true;}
      if(readySelector && (await find(readySelector)).length)return false;
      if(!readySelector)return false;
      await new Promise(r=>setTimeout(r,300));
    }while(Date.now()<deadline);
    throw Error('Neither onboarding nor ready screen appeared');
  }
  async tap(selector){const id=await this.unique(selector);if(!await this.command('GET',`/element/${id}/enabled`))throw Error('Element disabled');await this.command('POST',`/element/${id}/click`,{});}
  async inspect(selector){const id=await this.unique(selector);return {displayed:await this.command('GET',`/element/${id}/displayed`),enabled:await this.command('GET',`/element/${id}/enabled`),text:await this.command('GET',`/element/${id}/text`)};}
  async absent(selector){
    const end=Date.now()+10000;
    do {
      const found=await this.command('POST','/elements',{using:selector.startsWith('//')?'xpath':'accessibility id',value:selector});
      if(found.length===0)return true;
      await new Promise(r=>setTimeout(r,300));
    }while(Date.now()<end);
    return false;
  }
  async back(){await this.command('POST','/back',{});}
  async capture(id){
    const xml=await this.command('GET','/source');const png=await this.command('GET','/screenshot');
    await writeFile(join(this.out,`${id}.xml`),xml);await writeFile(join(this.out,`${id}.png`),Buffer.from(png,'base64'));
    return {xml:`${id}.xml`,png:`${id}.png`};
  }
}
