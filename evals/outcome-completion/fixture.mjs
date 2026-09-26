import { createServer } from 'node:http';
export async function startOutcomeFixture({ fault = 'none', noteId } = {}) {
  if (!['none', 'guide', 'quantity', 'quantity-dom-only',
    'quantity-response-only', 'persistence', 'v2-healthy', 'v2-all-broken',
    'v2-control-open', 'v2-state-missing'].includes(fault))
    throw new Error('Unknown fault');
  const v2 = fault.startsWith('v2-');
  if (v2 && (typeof noteId !== 'string' || !/^[A-Za-z0-9-]{1,64}$/.test(noteId)))
    throw new Error('v2 requires a safe noteId');
  const requirements = {
    cohort: 'nebula', guide: 'Nebula setup',
    guideDetail: 'Import the Nebula profile, then connect in Nebula.',
    unitMinor: 200, currency: 'USD', noteTitle: v2 ? 'Shift log' : 'Daily plan'
  };
  let title = null;
  let stateCommitted = false;
  let renderedCommitted = false;
  let controlDisabled = false;
  const hits = [];
  const page = body => '<!doctype html><meta charset="utf-8"><main>' + body + '</main>';
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://fixture.invalid');
    const hit = { seq: hits.length + 1, method: req.method, path: url.pathname,
      search: url.search, noteId: v2 ? noteId : null, at: new Date().toISOString() };
    hits.push(hit);
    res.once('finish', () => {
      hit.status = res.statusCode;
      hit.completedAt = new Date().toISOString();
    });
    res.setHeader('cache-control', 'no-store');
    const json = (code, data) => {
      res.writeHead(code, { 'content-type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    const html = body => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(page(body));
    };
    if (req.method === 'POST' && url.pathname === '/notes') {
      if (v2) {
        stateCommitted = fault !== 'v2-all-broken' && fault !== 'v2-state-missing';
        renderedCommitted = fault !== 'v2-all-broken';
        controlDisabled = fault === 'v2-healthy' || fault === 'v2-state-missing';
      } else if (fault !== 'persistence') title = requirements.noteTitle;
      json(202, { message: 'Saved' }); return;
    }
    if (req.method !== 'GET') { json(405, { error: 'method_not_allowed' }); return; }
    if (url.pathname === '/requirements') { json(200, requirements); return; }
    if (url.pathname === '/guide') {
      html('<h1 data-testid="guide">' +
        (fault === 'guide' ? 'Atlas setup' : requirements.guide) + '</h1>' +
        '<p data-testid="guide-detail">' + requirements.guideDetail + '</p>'); return;
    }
    if (url.pathname === '/quote') {
      const input = url.searchParams.get('quantity');
      if (!['1', '2', '3'].includes(input)) { json(400, { error: 'quantity' }); return; }
      const quantity = fault === 'quantity' ? 1 : Number(input);
      const totalMinor = fault === 'quantity-response-only' && quantity === 2
        ? 200 : quantity * 200;
      json(200, { quantity, unitMinor: 200, currency: 'USD', totalMinor });
      return;
    }
    if (url.pathname === '/quantity') {
      const displayedTotal = fault === 'quantity-dom-only'
        ? 'n==="2"?200:j.totalMinor'
        : fault === 'quantity-response-only' ? 'Number(n)*200' : 'j.totalMinor';
      html('<label>Quantity<select id="q"><option>1</option><option>2</option>' +
        '<option>3</option></select></label><output id="total" data-testid="total"></output>' +
        '<script>const q=document.querySelector("#q"),t=document.querySelector("#total");' +
        'async function update(){const n=q.value;const r=await fetch("/quote?quantity="+n);' +
        'const j=await r.json();t.textContent=String(' + displayedTotal +
        ');t.dataset.request=n;}' +
        'q.addEventListener("change",update);update();</script>'); return;
    }
    if (url.pathname === '/notes-state') {
      json(200, v2 ? { note: stateCommitted
        ? { noteId, revision: 1, title: 'Shift log' } : null } : { title });
      return;
    }
    if (url.pathname === '/notes') {
      if (v2) {
        html('<button id="save"' + (controlDisabled ? ' disabled' : '') +
          '>Save note</button><p data-testid="saved"></p>' +
          '<p data-testid="persisted">' + (renderedCommitted
            ? noteId + ' · Revision 1 · Shift log' : '') + '</p>' +
          '<script>document.querySelector("#save").onclick=async()=>{' +
          'const r=await fetch("/notes",{method:"POST"});const j=await r.json();' +
          'document.querySelector("[data-testid=saved]").textContent=j.message;};</script>');
        return;
      }
      html('<button id="save">Save note</button><p data-testid="saved"></p>' +
        '<p data-testid="persisted">' + (title ?? '') + '</p>' +
        '<script>document.querySelector("#save").onclick=async()=>{' +
        'const r=await fetch("/notes",{method:"POST"});const j=await r.json();' +
        'document.querySelector("[data-testid=saved]").textContent=j.message;};</script>');
      return;
    }
    json(404, { error: 'not_found' });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
  });
  return {
    baseUrl: 'http://127.0.0.1:' + server.address().port + '/',
    hits,
    close: () => new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()))
  };
}
