import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '../../components/console/node_modules/playwright/index.mjs';
import { startFixture } from './fixture.mjs';

test('CSP-only variant preserves HTTP/schema yet prevents rendered reference', async () => {
  const good = await startFixture();
  let bad, browser;
  try {
    bad = await startFixture({ blockedInitializer: true });
    const pages = await Promise.all([good, bad].map(f => fetch(new URL('docs/', f.baseUrl))));
    assert.deepEqual(pages.map(r => r.status), [200, 200]);
    for (const page of pages) assert.match(page.headers.get('content-type'), /^text\/html(?:;|$)/i);
    assert.equal(await pages[0].text(), await pages[1].text());
    assert.notEqual(pages[0].headers.get('content-security-policy'), pages[1].headers.get('content-security-policy'));
    const schemaResponses = await Promise.all([good, bad].map(f => fetch(new URL('openapi.json', f.baseUrl))));
    assert.deepEqual(schemaResponses.map(r => r.status), [200, 200]);
    for (const response of schemaResponses) assert.match(response.headers.get('content-type'), /^application\/json(?:;|$)/i);
    const schemaBodies = await Promise.all(schemaResponses.map(r => r.text()));
    assert.equal(schemaBodies[0], schemaBodies[1]);
    const schema = JSON.parse(schemaBodies[0]);
    assert.equal(schema.openapi, '3.0.3');
    assert.equal(schema.info.title, 'Widget API');
    assert.equal(schema.paths['/v1/widgets'].get.summary, 'List widgets');
    const statuses = await Promise.all([good, bad].map(f => fetch(new URL('api/status', f.baseUrl))));
    assert.deepEqual(statuses.map(r => r.status), [200, 200]);
    for (const status of statuses) assert.equal((await status.json()).status, 'operational');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ bypassCSP: false });
    const healthy = await context.newPage(), faulty = await context.newPage();
    const errors = [];
    faulty.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await healthy.goto(new URL('docs/', good.baseUrl).href);
    await healthy.getByText('Widget API', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
    for (const text of ['GET /v1/widgets', 'List widgets']) {
      assert.equal(await healthy.getByText(text, { exact: true }).isVisible(), true);
    }
    await faulty.goto(new URL('docs/', bad.baseUrl).href);
    assert.equal((await faulty.locator('body').innerText()).trim(), '');
    assert.ok(errors.some(e => /Content Security Policy|script-src/i.test(e)),
      'browser must identify CSP, not just missing content');
    assert.ok([...good.hits, ...bad.hits].every(h => h.method === 'GET'));
  } finally {
    const cleanup = await Promise.allSettled([browser?.close(), good.close(), bad?.close()]);
    const failures = cleanup.filter(result => result.status === 'rejected').map(result => result.reason);
    if (failures.length) throw new AggregateError(failures, 'Fixture cleanup failed');
  }
});
