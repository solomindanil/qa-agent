import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, lstat, mkdtemp, readFile, readdir, realpath, unlink, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../skills/', import.meta.url));
const bundles = [
  ['qa-check', ['SKILL.md', 'agents/openai.yaml', 'references/request-intake.md',
    'scripts/request.mjs', 'scripts/request-contract.mjs']],
  ['qa-bugfix', ['SKILL.md', 'agents/openai.yaml', 'references/fix-prompt.md']],
];

async function exists(path) {
  return lstat(path).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
}

async function standaloneBundle(name) {
  const source = join(sourceRoot, name);
  assert.ok((await exists(source))?.isDirectory(), `${name}: source bundle must exist`);
  const base = await realpath(await mkdtemp(join(tmpdir(), 'qa-generic-skill-bundle-')));
  const bundle = join(base, name);
  await cp(source, bundle, { recursive: true, dereference: false });
  return bundle;
}

async function filesUnder(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    assert.equal(entry.isSymbolicLink(), false, `${path}: bundle must not depend on a donor symlink`);
    if (entry.isDirectory()) paths.push(...await filesUnder(path));
    else paths.push(path);
  }
  return paths;
}

for (const [name, required] of bundles) {
  test(`${name} remains a complete ordinary-file bundle when copied independently`, async () => {
    const bundle = await standaloneBundle(name);
    await filesUnder(bundle);
    for (const member of required) {
      const path = join(bundle, member);
      assert.ok((await exists(path))?.isFile(), `${name}: missing bundled ${member}`);
      assert.ok((await readFile(path)).length > 0, `${name}: empty bundled ${member}`);
    }
  });

  test(`${name} metadata does not force a tracker connector before product selection`, async () => {
    const metadataPath = join(sourceRoot, name, 'agents/openai.yaml');
    assert.ok((await exists(metadataPath))?.isFile(), `${name}: UI metadata must be delivered`);
    const metadata = await readFile(metadataPath, 'utf8');
    // These generic entrypoints select their provider from the product pack.
    // Host dependency declarations are unconditional, unlike that runtime choice.
    // Inspect the configuration key, not the skill's natural-language instructions.
    assert.doesNotMatch(metadata, /^(?:dependencies|"dependencies"|'dependencies')\s*:/m,
      `${name}: a generic entrypoint must not impose an unconditional connector dependency`);
  });
}

for (const [name] of bundles) {
  test(`${name} can read its linked Markdown resources without the donor repository`, async () => {
    const bundle = await standaloneBundle(name);
    const markdown = (await filesUnder(bundle)).filter(path => path.endsWith('.md'));
    const resources = [];
    for (const document of markdown) {
      const content = await readFile(document, 'utf8');
      // Resource locators may be inline code or Markdown links. This resolves
      // file dependencies only; it is not an assertion about agent behavior.
      const locators = [
        ...content.matchAll(/`([^`\n]+\.md)`/g),
        ...content.matchAll(/\]\(([^)\s]+\.md)(?:#[^)]*)?\)/g),
      ].map(match => match[1]);
      for (const locator of locators) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(locator)) continue;
        const resource = resolve(dirname(document), locator);
        const inside = relative(bundle, resource);
        assert.ok(inside !== '..' && !inside.startsWith(`..${sep}`) && !inside.startsWith(sep),
          `${locator}: resource must resolve within its copied skill bundle`);
        assert.ok((await exists(resource))?.isFile(), `${locator}: referenced resource must be bundled`);
        assert.ok((await readFile(resource)).length > 0, `${locator}: referenced resource must not be empty`);
        resources.push(resource);
      }
    }
    assert.ok(resources.length > 0, `${name} must expose its bundled reference resource`);
  });
}

test('qa-check scripts resolve only ordinary bundled modules and Node built-ins', async () => {
  const bundle = await standaloneBundle('qa-check');
  for (const member of ['scripts/request.mjs', 'scripts/request-contract.mjs']) {
    const path = join(bundle, member);
    const info = await lstat(path);
    assert.ok(info.isFile() && !info.isSymbolicLink(), `${member}: ordinary bundled script required`);
    const content = await readFile(path, 'utf8');
    const imports = [...content.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g)]
      .map(match => match[1]);
    assert.ok(imports.length > 0, `${member}: inspect actual module dependencies`);
    for (const locator of imports) {
      if (locator.startsWith('node:')) continue;
      const resource = resolve(dirname(path), locator);
      const inside = relative(bundle, resource);
      assert.ok(locator.startsWith('.') && inside !== '..' && !inside.startsWith(`..${sep}`)
        && !inside.startsWith(sep), `${locator}: module must resolve inside copied bundle`);
      const dependency = await lstat(resource);
      assert.ok(dependency.isFile() && !dependency.isSymbolicLink(), `${locator}: ordinary module required`);
    }
  }
});

test('qa-check copied CLI preserves a full no-doc request and pilot remainder without child source', async t => {
  // Catches missing portable resources, child/root dependencies, lost scope or identity,
  // omitted unknowns and promotion of a selected source clause to an executed result.
  const bundle = await standaloneBundle('qa-check');
  const cli = join(bundle, 'scripts/request.mjs');
  assert.ok((await exists(join(bundle, 'references/request-intake.md')))?.isFile(),
    'portable intake recipe must travel with the helper');
  const notes = await realpath(await mkdtemp(join(tmpdir(), 'qa-copied-intake-notes-')));
  const checkpoint = join(notes, 'CURRENT.md');
  const brief = join(notes, 'request.txt');
  const original = 'Check the whole synthetic product, starting read-only. I have no documentation.\n';
  await writeFile(checkpoint, 'Synthetic owner checkpoint; no managed registration.\n');
  await writeFile(brief, original);
  const exec = promisify(execFile);
  async function invoke(args) {
    const { stdout, stderr } = await exec(process.execPath, [cli, ...args], {
      cwd: notes, env: {}, timeout: 10000, maxBuffer: 2 * 1024 * 1024,
    });
    assert.equal(stderr, '');
    return JSON.parse(stdout);
  }
  const captureArgs = ['capture', '--text-file', brief, '--scope', 'full', '--product', 'synthetic',
    '--specialist', 'qa-product-v0', '--checkpoint', checkpoint, '--notes-dir', notes,
    '--exclude', 'No purchases'];
  const captured = await invoke(captureArgs);
  const distinct = await invoke(captureArgs);
  assert.notEqual(distinct.requestId, captured.requestId);
  const request = await invoke(['read', '--request', captured.path]);
  assert.equal(request.originalText, original);
  assert.equal(request.originalScope, 'full');
  assert.equal(request.requestId, captured.requestId);
  assert.equal(request.digest, captured.digest);
  assert.equal(request.revision, 1);
  assert.equal(request.owner.workspacePath, null);
  assert.equal(request.owner.notesDirectory, notes);
  assert.equal(request.owner.checkpointPath, checkpoint);
  assert.equal(request.owner.specialist, 'qa-product-v0');
  assert.equal(request.items.length, 1);
  assert.equal(request.items[0].kind, 'request');
  assert.deepEqual(request.exclusions, ['No purchases']);
  assert.deepEqual(request.unknowns.map(item => item.kind), ['scope', 'oracle']);
  const intake = await invoke(['report', '--request', captured.path, '--reason', 'Scope discovery only']);
  const reopened = await invoke(['read', '--report', intake.path]);
  assert.deepEqual(reopened.request, { requestId: captured.requestId, revision: 1, requestDigest: captured.digest });
  assert.equal(reopened.originalScope, 'full');
  assert.deepEqual(reopened.selectedClauseIds, []);
  assert.deepEqual(reopened.remainingClauseIds, ['clause-1']);
  assert.deepEqual(reopened.unknowns, request.unknowns);
  assert.deepEqual(reopened.owner, request.owner);
  assert.equal(reopened.result, 'NOT_EVALUATED');
  assert.equal(reopened.executionBinding, 'not_owner_attested');
  assert.equal(reopened.fullScopeReconciliation, 'not_performed');
  const clarification = join(notes, 'clarification.txt');
  await writeFile(clarification, 'Also preserve reporting and exports in the full request.\n');
  const amended = await invoke(['amend', '--request', captured.path, '--text-file', clarification]);
  const revision = await invoke(['read', '--request', amended.path]);
  assert.equal(revision.requestId, captured.requestId);
  assert.equal(revision.revision, 2);
  assert.equal(revision.previousDigest, captured.digest);
  assert.equal(revision.originalText, original);
  assert.equal(revision.originalScope, 'full');
  const pilot = await invoke(['report', '--request', amended.path, '--select', 'clause-1',
    '--reason', 'One source clause selected for a bounded pilot; full inventory remains unknown']);
  const pilotReadback = await invoke(['read', '--report', pilot.path]);
  assert.deepEqual(pilotReadback.request, { requestId: captured.requestId, revision: 2, requestDigest: amended.digest });
  assert.equal(pilotReadback.originalScope, 'full');
  assert.deepEqual(pilotReadback.selectedClauseIds, ['clause-1']);
  assert.deepEqual(pilotReadback.remainingClauseIds, ['clause-2']);
  assert.equal(pilotReadback.clauses.length, 2);
  assert.ok(pilotReadback.clauses.every(clause => clause.status === 'unassessed'));
  assert.deepEqual(pilotReadback.unknowns, request.unknowns);
  assert.equal(pilotReadback.result, 'NOT_EVALUATED');
  assert.equal(pilotReadback.executionBinding, 'not_owner_attested');
  const jsonBytes = await readFile(pilot.path);
  const markdownBytes = await readFile(pilot.markdownPath);
  await unlink(amended.path);
  await unlink(pilot.markdownPath);
  const rendered = await invoke(['render-report', '--report', pilot.path]);
  assert.deepEqual(rendered, { kind: 'report_rendered', path: pilot.path, digest: pilot.digest,
    requestId: captured.requestId, revision: 2, markdownPath: pilot.markdownPath, markdownStatus: 'created' });
  assert.deepEqual(await readFile(pilot.path), jsonBytes);
  assert.deepEqual(await readFile(pilot.markdownPath), markdownBytes);
  t.diagnostic(`Synthetic copied bundle: ${bundle}; original request: ${captured.path}; intake report: ${intake.path}; pilot report: ${pilot.path}; Markdown: ${pilot.markdownPath}`);
});
