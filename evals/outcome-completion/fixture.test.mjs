import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startOutcomeFixture } from './fixture.mjs';
test('loopback contract, isolation and rejection', async () => {
  await assert.rejects(startOutcomeFixture({ fault: 'invalid' }), /Unknown fault/);
  const good = await startOutcomeFixture();
  const bad = await startOutcomeFixture({ fault: 'persistence' });
  try {
    for (const f of [good, bad]) {
      const r = await fetch(f.baseUrl + 'requirements');
      assert.equal(r.status, 200);
      assert.deepEqual(await r.json(), {
        cohort: 'nebula', guide: 'Nebula setup',
        unitMinor: 200, currency: 'USD', noteTitle: 'Daily plan'
      });
      assert.equal((await fetch(f.baseUrl + 'quote?quantity=0')).status, 400);
      assert.equal((await fetch(f.baseUrl + 'missing')).status, 404);
      assert.equal((await fetch(f.baseUrl + 'guide', { method: 'DELETE' })).status, 405);
      assert.equal((await fetch(f.baseUrl + 'notes', { method: 'POST' })).status, 202);
    }
    assert.deepEqual(await (await fetch(good.baseUrl + 'notes-state')).json(),
      { title: 'Daily plan' });
    assert.deepEqual(await (await fetch(bad.baseUrl + 'notes-state')).json(), { title: null });
  } finally {
    const results = await Promise.allSettled([good.close(), bad.close()]);
    const failures = results.filter(r => r.status === 'rejected').map(r => r.reason);
    if (failures.length) throw new AggregateError(failures, 'Fixture cleanup failed');
  }
});

test('quantity fault preserves plausible one-item success', async () => {
  for (const fault of ['none', 'quantity']) {
    const f = await startOutcomeFixture({ fault });
    try {
      for (const requested of [1, 2, 3]) {
        const response = await fetch(f.baseUrl + 'quote?quantity=' + requested);
        assert.equal(response.status, 200);
        const quantity = fault === 'quantity' ? 1 : requested;
        assert.deepEqual(await response.json(), {
          quantity, unitMinor: 200, currency: 'USD', totalMinor: quantity * 200
        });
      }
    } finally { await f.close(); }
  }
});
