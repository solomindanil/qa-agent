import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startOutcomeFixture } from './fixture.mjs';

const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE ??
  '../../components/console/node_modules/playwright/index.mjs');

async function renderedText(locator, label) {
  assert.equal(await locator.isVisible(), true, 'visible ' + label);
  assert.equal(await locator.evaluate(element =>
    element.checkVisibility({ opacityProperty: true })), true,
  'non-transparent ' + label);
  return locator.innerText();
}

async function checkGuide(page, f, expected) {
  await page.goto(f.baseUrl + 'guide');
  const heading = page.getByTestId('guide');
  const detail = page.getByTestId('guide-detail');
  assert.equal(await renderedText(heading, 'guide'), expected.guide, 'guide cohort');
  assert.equal(await renderedText(detail, 'guide instructions'),
    expected.guideDetail, 'guide instructions');
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
    const rendered = Number(await renderedText(page.getByTestId('total'), 'quantity total ' + n));
    observed.push({ requested: n, quantity: quote.quantity, totalMinor: quote.totalMinor,
      currency: quote.currency, rendered });
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
  const persisted = page.getByTestId('persisted');
  assert.equal(record.title, expected.noteTitle, 'persisted independent read');
  const rendered = await renderedText(persisted, 'persisted note');
  assert.equal(rendered, expected.noteTitle, 'persisted reload');
}

for (const fault of ['none', 'guide', 'quantity', 'quantity-dom-only', 'persistence']) {
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
      if (fault === 'quantity-dom-only') {
        assert.equal(quantities.length, 3, 'captured all quantity choices');
        assert.deepEqual(quantities[1], {
          requested: 2, quantity: 2, totalMinor: 400, currency: 'USD', rendered: 200
        }, 'Q2 DOM-only contradiction');
      }
      for (const row of quantities) {
        const n = row.requested;
        const check = () => assert.deepEqual(row, { requested: n, quantity: n,
          totalMinor: n * expected.unitMinor, currency: expected.currency,
          rendered: n * expected.unitMinor }, 'quantity result ' + n);
        if ((fault === 'quantity' && n > 1) ||
            (fault === 'quantity-dom-only' && n === 2)) assert.throws(check,
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

async function withHealthyPage(run) {
  const f = await startOutcomeFixture();
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
    await run({ f, context, page, expected });
  } finally {
    const results = await Promise.allSettled([browser?.close(), f.close()]);
    const failures = results.filter(r => r.status === 'rejected').map(r => r.reason);
    if (failures.length) throw new AggregateError(failures, 'Cleanup failed');
  }
}

test('correct guide heading with stale instructions is rejected', async () => {
  await withHealthyPage(async ({ f, context, page, expected }) => {
    await context.route('**/guide', route => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<main><h1 data-testid="guide">Nebula setup</h1>' +
        '<p data-testid="guide-detail">Import the old Atlas profile.</p></main>'
    }));
    await assert.rejects(() => checkGuide(page, f, expected),
      { name: 'AssertionError', message: /^guide instructions\n/ });
  });
});

test('hidden guide heading is rejected', async () => {
  await withHealthyPage(async ({ f, context, page, expected }) => {
    await context.route('**/guide', route => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<main><h1 data-testid="guide" hidden>Nebula setup</h1>' +
        '<p data-testid="guide-detail">Import the Nebula profile, then connect in Nebula.</p></main>'
    }));
    await assert.rejects(() => checkGuide(page, f, expected),
      { name: 'AssertionError', message: /^visible guide\n/ });
  });
});

test('opacity-zero guide container is rejected', async () => {
  await withHealthyPage(async ({ f, context, page, expected }) => {
    await context.route('**/guide', route => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<main style="opacity:0"><h1 data-testid="guide">Nebula setup</h1>' +
        '<p data-testid="guide-detail">Import the Nebula profile, then connect in Nebula.</p></main>'
    }));
    await assert.rejects(() => checkGuide(page, f, expected),
      { name: 'AssertionError', message: /^non-transparent guide\n/ });
  });
});

test('guide detail sourced only from a hidden child is rejected', async () => {
  await withHealthyPage(async ({ f, context, page, expected }) => {
    await context.route('**/guide', route => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<main><h1 data-testid="guide">Nebula setup</h1>' +
        '<p data-testid="guide-detail" style="min-height:1px">' +
        '<span hidden>Import the Nebula profile, then connect in Nebula.</span></p></main>'
    }));
    await assert.rejects(() => checkGuide(page, f, expected),
      { name: 'AssertionError', message: /^guide instructions\n/ });
  });
});

test('hidden selected total is rejected', async () => {
  await withHealthyPage(async ({ f, context, page }) => {
    await context.route('**/quantity', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        '<output id="total" data-testid="total">',
        '<output id="total" data-testid="total" hidden>'
      );
      await route.fulfill({ response, body });
    });
    await assert.rejects(() => captureQuantities(page, f),
      { name: 'AssertionError', message: /^visible quantity total 1\n/ });
  });
});

test('hidden persisted note after reload is rejected', async () => {
  await withHealthyPage(async ({ f, context, page, expected }) => {
    await context.route('**/notes', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        '<p data-testid="persisted">',
        '<p data-testid="persisted" hidden>'
      );
      await route.fulfill({ response, body });
    });
    await assert.rejects(() => checkPersisted(page, f, expected),
      { name: 'AssertionError', message: /^visible persisted note\n/ });
  });
});
