// Passive capture of one state the agent already reached, from the agent's own Playwright page.
// Read-only: it never clicks, types, scrolls or navigates. axe-core is injected only when the caller passes its source.
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractPageFacts } from './page-facts.mjs';

const LABEL = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const MAX_DOM_BYTES = 2_000_000;
const AXE_RULES = ['color-contrast', 'label', 'button-name', 'select-name', 'input-button-name', 'link-name', 'image-alt',
  'aria-required-attr', 'aria-valid-attr-value', 'list', 'listitem'];

async function runAxe(page, axeSource) {
  if (!axeSource) return { available: false, reason: 'no axe source passed by the caller' };
  try {
    const source = await readFile(axeSource, 'utf8');
    await page.addScriptTag({ content: source });
    const result = await page.evaluate((rules) => globalThis.axe.run(document, { runOnly: { type: 'rule', values: rules }, resultTypes: ['violations'] }), AXE_RULES);
    return { available: true, version: result.testEngine?.version ?? null, violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.slice(0, 20).map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 300), data: n.any?.[0]?.data ?? null })) })) };
  } catch (error) {
    return { available: false, reason: `axe could not run: ${String(error.message).slice(0, 200)}` };
  }
}

export async function captureState(page, { dir, label, axeSource = null, maxElements = 3000 } = {}) {
  if (!page || typeof page.evaluate !== 'function') throw new TypeError('captureState needs a Playwright page');
  if (typeof dir !== 'string' || !dir) throw new TypeError('captureState needs an output dir');
  if (!LABEL.test(label ?? '')) throw new TypeError(`label must match ${LABEL}`);
  const out = join(dir, 'passive'); await mkdir(out, { recursive: true });
  const started = Date.now();
  // Order matters: DOM, aria and screenshot are taken before axe injects its script into the page.
  const facts = await page.evaluate(extractPageFacts, { maxElements });
  const dom = await page.evaluate((max) => document.body.outerHTML.slice(0, max), MAX_DOM_BYTES);
  let aria = null;
  try { aria = await page.locator('body').ariaSnapshot({ timeout: 5000 }); } catch (error) { aria = `# aria snapshot unavailable: ${String(error.message).slice(0, 200)}\n`; }
  await page.screenshot({ path: join(out, `${label}.png`), fullPage: true });
  const axe = await runAxe(page, axeSource);
  await writeFile(join(out, `${label}.facts.json`), JSON.stringify(facts));
  await writeFile(join(out, `${label}.axe.json`), JSON.stringify(axe));
  await writeFile(join(out, `${label}.aria.yml`), aria);
  await writeFile(join(out, `${label}.dom.html`), dom);
  const entry = { label, url: facts.url, capturedAt: new Date(started).toISOString(), viewport: facts.viewport, ms: Date.now() - started,
    elements: facts.elements.length, fields: facts.fields.length, controls: facts.controls.length, overlays: facts.overlays.length,
    truncated: facts.truncated, axe: axe.available ? 'ran' : axe.reason };
  await appendFile(join(out, 'index.jsonl'), JSON.stringify(entry) + '\n');
  return entry;
}
