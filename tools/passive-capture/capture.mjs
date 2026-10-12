// Passive capture of one state the agent already reached, from the agent's own Playwright page.
// It does not click, type or navigate. A full-page screenshot temporarily resizes the viewport and, when the caller
// passes axe-core, axe injects its script; both can trigger page handlers. No raw DOM or aria dump is written.
import { appendFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractPageFacts } from './page-facts.mjs';

const LABEL = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const ARTIFACTS = ['.facts.json', '.png', '.axe.json'];
const NEW_FILE = { flag: 'wx' }; // never overwrite, even when another capture claims the same label meanwhile
const AXE_RULES = ['color-contrast', 'label', 'button-name', 'select-name', 'input-button-name', 'link-name', 'image-alt',
  'aria-required-attr', 'aria-valid-attr-value', 'list', 'listitem'];
const CONTRAST_FIELDS = ['fgColor', 'bgColor', 'contrastRatio', 'expectedContrastRatio', 'fontSize', 'fontWeight'];
const AXE_NODES = 20; // nodes kept per rule; nodesTotal records how many axe reported

// Keep only what the detectors consume: the node target, and for contrast the colour/ratio fields.
const pickContrast = (data) => Object.fromEntries(CONTRAST_FIELDS.filter((k) => data && data[k] !== undefined).map((k) => [k, data[k]]));
const minimalNode = (ruleId, node) => ({ target: node.target.map(String).join(' '),
  ...(ruleId === 'color-contrast' ? { contrast: pickContrast(node.any?.[0]?.data) } : {}) });

async function runAxe(page, axeSource) {
  if (!axeSource) return { available: false, reason: 'no axe source passed by the caller' };
  try {
    const source = await readFile(axeSource, 'utf8');
    await page.addScriptTag({ content: source });
    const result = await page.evaluate((rules) => globalThis.axe.run(document, { runOnly: { type: 'rule', values: rules }, resultTypes: ['violations'] }), AXE_RULES);
    return { available: true, version: result.testEngine?.version ?? null, scope: 'violations of the listed rules only; no candidates is not a pass',
      violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, AXE_NODES).map((n) => minimalNode(v.id, n)), nodesTotal: v.nodes.length })) };
  } catch (error) {
    return { available: false, reason: `axe could not run: ${String(error.message).slice(0, 200)}` };
  }
}

// A label is used when one of its files exists or the index lists it. Labels are compared ignoring case, because a
// case-insensitive file system stores "Home" and "home" in one file.
async function labelUsed(out, label) {
  const key = label.toLowerCase();
  const files = new Set((await readdir(out)).map((f) => f.toLowerCase()));
  if (ARTIFACTS.some((ext) => files.has(key + ext))) return true;
  const index = await readFile(join(out, 'index.jsonl'), 'utf8').catch((error) => (error.code === 'ENOENT' ? '' : Promise.reject(error)));
  return index.split('\n').filter(Boolean).some((line) => String(JSON.parse(line).label).toLowerCase() === key);
}

export async function captureState(page, { dir, label, axeSource = null, maxElements = 3000 } = {}) {
  if (!page || typeof page.evaluate !== 'function') throw new TypeError('captureState needs a Playwright page');
  if (typeof dir !== 'string' || !dir) throw new TypeError('captureState needs an output dir');
  if (!LABEL.test(label ?? '')) throw new TypeError(`label must match ${LABEL}`);
  const out = join(dir, 'passive'); await mkdir(out, { recursive: true });
  if (await labelUsed(out, label)) throw new Error(`label "${label}" is already used in ${out} (compared ignoring case); captures are never overwritten, so give each state its own label`);
  const started = Date.now();
  // Order matters: facts and screenshot are taken before axe injects its script into the page.
  const facts = await page.evaluate(extractPageFacts, { maxElements });
  const shot = await page.screenshot({ fullPage: true });
  const axe = await runAxe(page, axeSource);
  await writeFile(join(out, `${label}.facts.json`), JSON.stringify(facts), NEW_FILE);
  await writeFile(join(out, `${label}.png`), shot, NEW_FILE);
  await writeFile(join(out, `${label}.axe.json`), JSON.stringify(axe), NEW_FILE);
  const entry = { label, url: facts.url, capturedAt: new Date(started).toISOString(), viewport: facts.viewport, ms: Date.now() - started,
    elements: facts.elements.length, fields: facts.fields.length, controls: facts.controls.length,
    nativeModal: facts.activeContext.nativeModal !== null, ambiguousModal: facts.activeContext.ambiguousModal, ariaModalDeclared: facts.activeContext.ariaModalDeclared.length,
    truncated: facts.truncated, axe: axe.available ? 'ran' : axe.reason };
  await appendFile(join(out, 'index.jsonl'), JSON.stringify(entry) + '\n');
  return entry;
}
