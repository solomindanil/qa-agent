import { createServer } from 'node:http';
import { createHash } from 'node:crypto';

const initializer = `fetch('/openapi.json').then(r=>r.json()).then(s=>{const root=document.getElementById('reference');for(const text of [s.info.title,'GET /v1/widgets',s.paths['/v1/widgets'].get.summary]){const p=document.createElement('p');p.textContent=text;root.append(p)}})`;
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Service reference</title></head><body><main id="reference"></main><script>${initializer}</script></body></html>`;
const schema = {
  openapi: '3.0.3',
  info: { title: 'Widget API', version: '1.0.0' },
  paths: { '/v1/widgets': { get: {
    summary: 'List widgets', responses: { '200': { description: 'OK' } },
  } } },
};
const hash = createHash('sha256').update(initializer).digest('base64');

export async function startFixture({ blockedInitializer = false } = {}) {
  const hits = [];
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://fixture.invalid').pathname;
    hits.push({ method: req.method, path, at: new Date().toISOString() });
    res.setHeader('cache-control', 'no-store');
    if (req.method !== 'GET') {
      res.writeHead(405); res.end(); return;
    }
    if (path === '/docs/') {
      res.setHeader('Content-Security-Policy',
        `default-src 'self'; script-src 'self'${blockedInitializer ? '' : ` 'sha256-${hash}'`}; connect-src 'self'`);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html); return;
    }
    if (path === '/openapi.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(schema)); return;
    }
    if (path === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'operational' })); return;
    }
    if (path === '/member/audit') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'member_required' })); return;
    }
    if (path === '/favicon.ico') {
      res.writeHead(204); res.end(); return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/`,
    hits,
    close: () => new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve())),
  };
}
