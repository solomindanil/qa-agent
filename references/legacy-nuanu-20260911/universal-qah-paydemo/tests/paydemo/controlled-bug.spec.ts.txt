import { expect, test, type Request } from '@playwright/test';

test('controlled BUG-1: checkout must reject an amount forged by the browser', async ({ request }) => {
  const runId = 'bug-client-amount';
  await request.post('/api/reset', { data: { runId } });

  const response = await request.post('/api/checkout', {
    data: { runId, planId: 'starter', amountCents: 100, paymentMethod: 'card' },
  });

  expect(response.status()).toBe(201);
  await expect(response.json()).resolves.toEqual({
    paymentId: `demo-${runId}-1`,
    amountCents: 100,
    paymentMethod: 'card',
  });

  test.fail(true, 'buggy-v1 trusts the browser-supplied amount');
  expect(response.status()).toBe(422);
});

test('controlled BUG-2: bank selection must reach the checkout API', async ({ page, request }) => {
  const runId = 'bug-stale-method';
  await request.post('/api/reset', { data: { runId } });
  await page.goto(`/?runId=${runId}`);

  await page.getByLabel('Bank transfer').check();
  const responsePromise = page.waitForResponse((response) => response.url().endsWith('/api/checkout'));
  await page.getByRole('button', { name: 'Pay $10.00' }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON()).toEqual({
    runId,
    planId: 'starter',
    amountCents: 1000,
    paymentMethod: 'card',
  });
  await expect(page.getByRole('status')).toHaveText('Payment recorded by card.');

  test.fail(true, 'buggy-v1 keeps card as a stale payment method');
  expect(response.request().postDataJSON()).toMatchObject({ paymentMethod: 'bank' });
});

test('controlled BUG-3: a fast double click must create one checkout', async ({ page, request }) => {
  const runId = 'bug-duplicate-race';
  await request.post('/api/reset', { data: { runId } });
  const requests: Request[] = [];
  page.on('request', (requestEvent) => {
    if (requestEvent.url().endsWith('/api/checkout')) requests.push(requestEvent);
  });

  await page.goto(`/?runId=${runId}`);
  await page.getByRole('button', { name: 'Pay $10.00' }).evaluate((button) => {
    const submitButton = button as HTMLButtonElement;
    submitButton.click();
    submitButton.click();
  });
  await expect(page.getByRole('status')).toHaveText('Payment recorded by card.');
  await expect.poll(() => requests.length).toBe(2);
  expect(requests.map((checkoutRequest) => checkoutRequest.headers()['idempotency-key'])).toEqual([
    `paydemo-${runId}`,
    `paydemo-${runId}`,
  ]);

  test.fail(true, 'buggy-v1 admits two payment submissions before completion');
  expect(requests).toHaveLength(1);
});
