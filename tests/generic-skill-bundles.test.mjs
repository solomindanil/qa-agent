import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, lstat, mkdtemp, readFile, readdir, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../skills/', import.meta.url));
const bundles = [
  ['qa-check', ['SKILL.md', 'agents/openai.yaml']],
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

test('qa-bugfix can read its linked Markdown resources without the donor repository', async () => {
  const bundle = await standaloneBundle('qa-bugfix');
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
  assert.ok(resources.length > 0, 'qa-bugfix must expose its bundled fix-prompt resource');
});
