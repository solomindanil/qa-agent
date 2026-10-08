import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const canonicalPath = 'skills/qa-check/scripts/request-contract.mjs';
function verify(canonical, vendor, provenance) {
  assert.deepEqual(vendor, canonical);
  assert.deepEqual(provenance, {
    schemaVersion: 'qa-request-contract-distribution.v1', canonicalPath,
    bytes: canonical.byteLength, sha256: createHash('sha256').update(canonical).digest('hex'),
  });
}
test('Console request contract is an exact provenance-bound canonical distribution', async () => {
  const canonical = await readFile(new URL('../' + canonicalPath, import.meta.url));
  const vendor = await readFile(new URL('../components/console/vendor/qa-request/request-contract.mjs', import.meta.url));
  const provenance = JSON.parse(await readFile(new URL('../components/console/vendor/qa-request/PROVENANCE.json', import.meta.url), 'utf8'));
  verify(canonical, vendor, provenance);
  const changed = Buffer.from(vendor); changed[0] ^= 1;
  assert.throws(() => verify(canonical, changed, provenance));
  assert.throws(() => verify(canonical, vendor, { ...provenance, sha256: '0'.repeat(64) }));
});
