import { execFileSync } from 'node:child_process';
import { expect, test, type Request } from '@playwright/test';

const runId = 'fixed-api-amount';

test('checkout API rejects a forged amount instead of trusting client input', async ({ request }) => {
  const reset = await request.post('/api/reset', { data: { runId } });
  expect(reset.status()).toBe(200);

  const response = await request.post('/api/checkout', {
    data: { runId, planId: 'starter', amountCents: 100, paymentMethod: 'card' },
  });

  expect(response.status()).toBe(422);
  await expect(response.json()).resolves.toEqual({ error: 'AMOUNT_MISMATCH' });
});

test('build info identifies the exact fixed build', async ({ request }) => {
  const response = await request.get('/build-info');
  expect(response.status()).toBe(200);
  const info = await response.json();

  expect(info.app).toBe('PayDemo');
  expect(Object.keys(info).sort()).toEqual([
    'app',
    'commit',
    'contentHash',
    'environmentId',
    'instanceNonce',
    'variant',
  ]);
  expect(info.variant).toBe('fixed-v2');
  expect(info.commit).toBe(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
  expect(info.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  expect(info.environmentId).toMatch(/^[a-z0-9][a-z0-9-]{0,63}$/);
  expect(info.instanceNonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('reset rejects a request without its own run id', async ({ request }) => {
  const response = await request.post('/api/reset', { data: {} });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: 'INVALID_RUN_ID' });
});

test('checkout API reuses the first payment for an idempotency key', async ({ request }) => {
  const idempotencyRunId = 'fixed-api-idempotency';
  const payload = { runId: idempotencyRunId, planId: 'starter', amountCents: 1000, paymentMethod: 'card' };
  await request.post('/api/reset', { data: { runId: idempotencyRunId } });

  const first = await request.post('/api/checkout', {
    data: payload,
    headers: { 'idempotency-key': 'fixed-api-idempotency-key' },
  });
  const second = await request.post('/api/checkout', {
    data: payload,
    headers: { 'idempotency-key': 'fixed-api-idempotency-key' },
  });

  expect(first.status()).toBe(201);
  expect(second.status()).toBe(200);
  await expect(second.json()).resolves.toEqual(await first.json());
});

test('bank selection reaches checkout API and receipt', async ({ page, request }) => {
  const uiRunId = 'fixed-ui-bank';
  await request.post('/api/reset', { data: { runId: uiRunId } });
  await page.goto(`/?runId=${uiRunId}`);

  await page.getByLabel('Bank transfer').check();
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/checkout') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Pay $10.00' }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON()).toMatchObject({
    runId: uiRunId,
    planId: 'starter',
    amountCents: 1000,
    paymentMethod: 'bank',
  });
  await expect(page.getByRole('status')).toHaveText('Payment recorded by bank transfer.');
});

test('pay button creates only one checkout for a fast double click', async ({ page, request }) => {
  const uiRunId = 'fixed-ui-single-submit';
  await request.post('/api/reset', { data: { runId: uiRunId } });
  const requests: Request[] = [];
  page.on('request', (requestEvent) => {
    if (requestEvent.url().endsWith('/api/checkout')) requests.push(requestEvent);
  });

  await page.goto(`/?runId=${uiRunId}`);
  await page.getByRole('button', { name: 'Pay $10.00' }).evaluate((button) => {
    const submitButton = button as HTMLButtonElement;
    submitButton.click();
    submitButton.click();
  });

  await expect(page.getByRole('status')).toHaveText('Payment recorded by card.');
  expect(requests).toHaveLength(1);
});
