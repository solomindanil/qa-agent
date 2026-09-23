import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startOutcomeFixture } from './fixture.mjs';

const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE ??
  '../../components/console/node_modules/playwright/index.mjs');

async function checkGuide(page, f, expected) {
  await page.goto(f.baseUrl + 'guide');
  assert.equal(await page.getByTestId('guide').textContent(), expected.guide, 'guide cohort');
}

async function captureQuantities(page, f) {
  const observed = [];
  for (const n of [1, 2, 3]) {
    const received = page.waitForResponse(r =>
      r.url() === f.baseUrl + 'quote?quantity=' + n && r.request().method() === 'GET');
    if (n === 1) await page.goto(f.baseUrl + 'quantity');
    else await page.getByLabel('Quantity').selectOption(String(n));
    const response = await received;
    assert.equal(response.status(), 200, 'quote transport');
    const quote = await response.json();
    await page.waitForFunction(value =>
      document.querySelector('#total').dataset.request === String(value), n);
    observed.push({ requested: n, quantity: quote.quantity, totalMinor: quote.totalMinor,
      currency: quote.currency, rendered: Number(await page.getByTestId('total').textContent()) });
  }
  return observed;
}

async function checkPersisted(page, f, expected) {
  await page.goto(f.baseUrl + 'notes');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByTestId('saved').filter({ hasText: /^Saved$/ }).waitFor();
  const response = await fetch(f.baseUrl + 'notes-state');
  assert.equal(response.status, 200, 'note read transport');
  const record = await response.json();
  await page.reload();
  const rendered = await page.getByTestId('persisted').textContent();
  assert.equal(record.title, expected.noteTitle, 'persisted independent read');
  assert.equal(rendered, expected.noteTitle, 'persisted reload');
}

for (const fault of ['none', 'guide', 'quantity', 'persistence']) {
  test('outcome controls: ' + fault, async () => {
    const f = await startOutcomeFixture({ fault });
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      await context.route('**/*', route => {
        if (new URL(route.request().url()).origin === new URL(f.baseUrl).origin)
          return route.continue();
        return route.abort();
      });
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      page.setDefaultNavigationTimeout(5000);
      const expected = await (await fetch(f.baseUrl + 'requirements')).json();
      if (fault === 'guide') await assert.rejects(() => checkGuide(page, f, expected),
        { name: 'AssertionError', message: /guide cohort/ });
      else await checkGuide(page, f, expected);

      const quantities = await captureQuantities(page, f);
      for (const row of quantities) {
        const n = row.requested;
        const check = () => assert.deepEqual(row, { requested: n, quantity: n,
          totalMinor: n * expected.unitMinor, currency: expected.currency,
          rendered: n * expected.unitMinor }, 'quantity result ' + n);
        if (fault === 'quantity' && n > 1) assert.throws(check,
          { name: 'AssertionError', message: new RegExp('quantity result ' + n) });
        else check();
      }
      if (fault === 'persistence') await assert.rejects(() => checkPersisted(page, f, expected),
        { name: 'AssertionError', message: /persisted independent read/ });
      else await checkPersisted(page, f, expected);
    } finally {
      const results = await Promise.allSettled([browser?.close(), f.close()]);
      const failures = results.filter(r => r.status === 'rejected').map(r => r.reason);
      if (failures.length) throw new AggregateError(failures, 'Cleanup failed');
    }
  });
}
