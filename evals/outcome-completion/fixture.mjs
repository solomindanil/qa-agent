import { createServer } from 'node:http';
export async function startOutcomeFixture({ fault = 'none' } = {}) {
  if (!['none', 'guide', 'quantity', 'persistence'].includes(fault))
    throw new Error('Unknown fault');
  const requirements = {
    cohort: 'nebula', guide: 'Nebula setup',
    unitMinor: 200, currency: 'USD', noteTitle: 'Daily plan'
  };
  let title = null;
  const hits = [];
  const page = body => '<!doctype html><meta charset="utf-8"><main>' + body + '</main>';
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://fixture.invalid');
    hits.push({ method: req.method, path: url.pathname, search: url.search,
      at: new Date().toISOString() });
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
      if (fault !== 'persistence') title = requirements.noteTitle;
      json(202, { message: 'Saved' }); return;
    }
    if (req.method !== 'GET') { json(405, { error: 'method_not_allowed' }); return; }
    if (url.pathname === '/requirements') { json(200, requirements); return; }
    if (url.pathname === '/guide') {
      html('<h1 data-testid="guide">' +
        (fault === 'guide' ? 'Atlas setup' : requirements.guide) + '</h1>'); return;
    }
    if (url.pathname === '/quote') {
      const input = url.searchParams.get('quantity');
      if (!['1', '2', '3'].includes(input)) { json(400, { error: 'quantity' }); return; }
      const quantity = fault === 'quantity' ? 1 : Number(input);
      json(200, { quantity, unitMinor: 200, currency: 'USD', totalMinor: quantity * 200 });
      return;
    }
    if (url.pathname === '/quantity') {
      html('<label>Quantity<select id="q"><option>1</option><option>2</option>' +
        '<option>3</option></select></label><output id="total" data-testid="total"></output>' +
        '<script>const q=document.querySelector("#q"),t=document.querySelector("#total");' +
        'async function update(){const n=q.value;const r=await fetch("/quote?quantity="+n);' +
        'const j=await r.json();t.textContent=String(j.totalMinor);t.dataset.request=n;}' +
        'q.addEventListener("change",update);update();</script>'); return;
    }
    if (url.pathname === '/notes-state') { json(200, { title }); return; }
    if (url.pathname === '/notes') {
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
