#!/usr/bin/env node
// Local browser control: capture the static fixtures with a real Playwright page and check paired expectations
// (what must and must not be flagged per fixture), axe presence, written artifacts and privacy canaries.
// Not a product check; it never leaves file:// URLs.
//   node tools/passive-capture/browser-control.mjs --playwright-from <dir with node_modules/playwright> --out <dir> [--axe <axe.min.js>]
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { captureState } from './capture.mjs';
import { loadStates, runDetectors } from './detect.mjs';
import { contrastCoverage } from './a11y-detectors.mjs';

const STATES = ['cards', 'modal', 'form1', 'form2', 'form3', 'form4', 'scope-nonmodal', 'scope-sidebar', 'scope-native-modal', 'scope-inert', 'scope-modal-under-inert', 'scope-two-modals', 'names', 'contrast', 'privacy'];
const CANARY = { password: 'CANARY-PW-7c2e', email: 'canary-mail@example.test', hidden: 'CANARY-HIDDEN-9b1f' };
const MUST = [
  ['cards', 'style', /"Chisel" has right/], ['cards', 'a11y-name', /^button\[type=button\] control has no accessible name/],
  ['modal', 'style', /"Chisel" has right/], ['scope-nonmodal', 'style', /"Chisel" has right/], ['scope-sidebar', 'style', /"Chisel" has right/],
  ['scope-native-modal', 'a11y-name', /control has no accessible name/],
  ['scope-modal-under-inert', 'a11y-name', /control has no accessible name/], ['scope-two-modals', 'style', /"Chisel" has right/],
  ['form4', 'geometry'], ['form4', 'padding'], ['form4', 'a11y-name', /only by its placeholder/],
];
const MUST_NOT = [['scope-native-modal', 'style'], ['scope-inert', 'style'], ['scope-modal-under-inert', 'style'], ['privacy', 'a11y-name']];
const NAMES_EXACT = [/^button\[type=button\] control has no accessible name/, /^input\[type=button\] control has no accessible name/,
  /^input\[type=submit\] control has no accessible name/, /^input\[type=reset\] control has no accessible name/, /^Field u has no label/];

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => (i % 2 ? acc : [...acc, [v.replace(/^--/, ''), all[i + 1]]]), []));
if (!args['playwright-from'] || !args.out) { console.error('usage: browser-control.mjs --playwright-from DIR --out DIR [--axe FILE]'); process.exit(2); }
const withAxe = Boolean(args.axe);
const { chromium } = createRequire(join(args['playwright-from'], 'package.json'))('playwright');
await mkdir(args.out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const entries = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/*', (route) => (/^(file|data):/.test(route.request().url()) ? route.continue() : route.abort()));
  for (const label of STATES) {
    await page.goto(pathToFileURL(join(import.meta.dirname, 'fixtures', `${label}.html`)).href);
    if (label === 'privacy') { await page.fill('#e', CANARY.email); await page.fill('#p', CANARY.password); }
    entries.push(await captureState(page, { dir: args.out, label, axeSource: args.axe ?? null }));
  }
} finally { await browser.close(); }

const states = await loadStates(args.out);
const list = runDetectors(states);
const failures = [];
const rows = (state, detector) => list.filter((c) => c.detector === detector && c.states.includes(state));
const fail = (msg) => failures.push(msg);
for (const [state, detector, re] of MUST) if (!rows(state, detector).some((c) => !re || re.test(c.what))) fail(`missing ${detector}@${state}${re ? ` ${re}` : ''}`);
for (const [state, detector] of MUST_NOT) if (rows(state, detector).length) fail(`unexpected ${detector}@${state}: ${rows(state, detector).map((c) => c.what).join(' | ')}`);
const names = rows('names', 'a11y-name').map((c) => c.what);
const factsOf = async (label) => JSON.parse(await readFile(join(args.out, 'passive', `${label}.facts.json`), 'utf8'));
const underInert = await factsOf('scope-modal-under-inert');
const icons = (f, cls) => f.controls.filter((c) => c.sel.includes(cls));
if (!icons(underInert, 'active-icon').every((c) => !c.inactive) || !icons(underInert, 'active-icon').length) fail('active control in a modal under an inert ancestor is marked inactive');
if (!icons(underInert, 'inert-icon').every((c) => c.inactive) || !icons(underInert, 'inert-icon').length) fail('explicitly inert child inside the active modal is not inactive');
if (rows('scope-modal-under-inert', 'a11y-name').length !== 1) fail(`modal-under-inert a11y-name rows: ${rows('scope-modal-under-inert', 'a11y-name').length} (expected only the active icon)`);
const twoModals = await factsOf('scope-two-modals');
if (!twoModals.activeContext.ambiguousModal || twoModals.activeContext.nativeModal !== null) fail(`two open modals not reported as ambiguous: ${JSON.stringify(twoModals.activeContext)}`);
if (rows('scope-two-modals', 'a11y-name').length !== 2) fail(`two-modals a11y-name rows: ${rows('scope-two-modals', 'a11y-name').length} (expected both dialog icons, no suppression)`);
if (names.length !== NAMES_EXACT.length || !NAMES_EXACT.every((re) => names.some((w) => re.test(w)))) fail(`names fixture a11y-name rows differ: ${JSON.stringify(names)}`);
const contrast = rows('contrast', 'contrast').map((c) => c.what);
if (withAxe) {
  if (!contrast.some((w) => /#999999/.test(w))) fail(`axe contrast row for #999999 missing: ${JSON.stringify(contrast)}`);
} else {
  if (contrast.length !== 1 || !/Low contrast grey text/.test(contrast[0])) fail(`computed contrast rows differ: ${JSON.stringify(contrast)}`);
  const cov = contrastCoverage(states.find((s) => s.label === 'contrast'));
  if ((cov.unassessed.unsupported_colour ?? 0) < 2) fail(`unsupported colours not counted as unassessed: ${JSON.stringify(cov)}`);
}
for (const e of entries) if (withAxe ? e.axe !== 'ran' : e.axe === 'ran') fail(`axe state for ${e.label} is "${e.axe}" (requested: ${withAxe})`);
const files = await readdir(join(args.out, 'passive'));
const unexpectedFiles = files.filter((f) => !/\.(facts\.json|axe\.json|png)$|^index\.jsonl$|^candidates\.(json|md)$/.test(f));
if (unexpectedFiles.length) fail(`unexpected artifacts written: ${unexpectedFiles.join(', ')}`);
for (const f of files.filter((x) => !x.endsWith('.png'))) {
  const text = await readFile(join(args.out, 'passive', f), 'utf8');
  if (text.includes(CANARY.password) || text.includes(CANARY.hidden)) fail(`secret canary present in ${f}`);
  if (/\.(facts|axe)\.json$/.test(f) && text.includes(CANARY.email)) fail(`typed e-mail canary present in ${f}`);
  if (f.endsWith('.axe.json')) for (const v of JSON.parse(text).violations ?? []) for (const n of v.nodes) {
    const extra = Object.keys(n).filter((k) => !['target', 'contrast'].includes(k));
    if (extra.length) fail(`axe node in ${f} keeps unused fields: ${extra.join(', ')}`);
  }
}
console.log(JSON.stringify({ axe: withAxe ? 'requested' : 'not requested', captures: entries.map((e) => ({ label: e.label, ms: e.ms, axe: e.axe })), candidates: list.map((c) => `${c.id} ${c.detector} ${c.states.join(',')}: ${c.what}`), failures }, null, 1));
if (failures.length) { console.error(`BROWSER CONTROL FAIL (${failures.length})`); process.exit(1); }
console.log('BROWSER CONTROL PASS');
