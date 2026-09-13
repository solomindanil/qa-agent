import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const { components } = JSON.parse(await readFile(new URL('sources/manifest.v1.json', root), 'utf8'));

test('selected Console accepts exactly the manifest-selected Kernel source', async () => {
  const consoleSource = components.find(({ id }) => id === 'console');
  const kernelSource = components.find(({ id }) => id === 'kernel');
  assert.ok(consoleSource && kernelSource, 'Both paired sources must be selected');
  // Restore first, as documented by the root entrypoint. Importing this module
  // does not build Kernel, load a registration, or contact a product.
  const authority = await import(new URL(`${consoleSource.path}/server/kernel-authority.mjs`, root));
  assert.equal(authority.resolvePinnedKernelRevision(kernelSource.commit), kernelSource.commit);
  assert.equal(authority.PINNED_I1_KERNEL_REVISION, kernelSource.commit);
  for (const rejected of [
    '15a067c9a694de26460102ce5dadb9707c7977b1',
    '10d398d8a077068c2184f33958e9b654a2f2947c',
  ]) {
    assert.throws(() => authority.resolvePinnedKernelRevision(rejected), { code: 'KERNEL_REVISION_MISMATCH' });
  }
});

test('selected source roles keep reporting reference non-active', () => {
  assert.deepEqual(components.map(({ id, runtimeAuthority }) => [id, runtimeAuthority]), [
    ['kernel', true], ['console', true], ['freeland', true], ['kernel-reporting-reference', false],
  ]);
  assert.equal(components.find(({ id }) => id === 'kernel-reporting-reference').commit,
    '10d398d8a077068c2184f33958e9b654a2f2947c');
});
