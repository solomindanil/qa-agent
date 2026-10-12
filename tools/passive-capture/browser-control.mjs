#!/usr/bin/env node
// Local browser control: capture the static fixtures with a real Playwright page and check paired expectations
// (what must and must not be flagged per fixture), axe presence, written artifacts and privacy canaries.
// Not a product check; it never leaves file:// URLs.
//   node tools/passive-capture/browser-control.mjs --playwright-from <dir with node_modules/playwright> --out <dir> [--axe <axe.min.js>] [--dictionary <word list>]
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { captureState } from './capture.mjs';
import { loadStates, runDetectors, toMarkdown } from './detect.mjs';
import { loadReached, reachedRemainder, trackReached } from './reached.mjs';
import { contrastCoverage } from './a11y-detectors.mjs';
import { imageCoverage } from './style-detectors.mjs';
import { wordingCoverage, loadDictionary } from './text-wording.mjs';
import { partitionWorklist } from './partitions.mjs';

const STATES = ['cards', 'modal', 'form1', 'form2', 'form3', 'form4', 'scope-nonmodal', 'scope-sidebar', 'scope-native-modal', 'scope-inert', 'scope-modal-under-inert', 'scope-two-modals', 'names', 'contrast', 'privacy',
  'loans-healthy', 'loans-broken', 'loans-edges', 'sensors-healthy', 'sensors-broken', 'sensors-modal',
  'loans-catalogue-1', 'loans-catalogue-2', 'loans-catalogue-3', 'loans-catalogue-3-odd', 'sensors-list-1', 'sensors-list-2', 'sensors-list-3', 'sensors-list-3-odd',
  'loans-wording-healthy', 'loans-wording-broken', 'sensors-wording-healthy', 'sensors-wording-broken', 'sensors-contrast', 'loans-layout', 'prose-healthy'];
const CANARY = { password: 'CANARY-PW-7c2e', email: 'canary-mail@example.test', hidden: 'CANARY-HIDDEN-9b1f' };
const RESIDUAL_TEXTAREA = 'CANARY-TEXTAREA-DEFAULT-3d8a';
const MUST = [
  ['cards', 'style', /"Chisel" has right/], ['cards', 'a11y-name', /^button\[type=button\] control has no accessible name/],
  ['modal', 'style', /"Chisel" has right/], ['scope-nonmodal', 'style', /"Chisel" has right/], ['scope-sidebar', 'style', /"Chisel" has right/],
  ['scope-native-modal', 'a11y-name', /control has no accessible name/],
  ['scope-modal-under-inert', 'a11y-name', /control has no accessible name/], ['scope-two-modals', 'style', /"Chisel" has right/],
  ['form4', 'geometry'], ['form4', 'padding'], ['form4', 'a11y-name', /only by its placeholder/],
  ['cards', 'text-hygiene', /Marker: NaN; channel: text\./],
  ['loans-broken', 'positive-tabindex', /^input has tabindex=3;/], ['loans-broken', 'ungrouped-choice', /named "loan-length" .*\(the enclosing fieldset has none\)$/],
  ['loans-broken', 'ungrouped-choice', /named "notify" .*radiogroup with an accessible name$/], ['loans-broken', 'focus-order', /on the same line \(ltr\) \(2 consecutive steps\)/],
  ['sensors-broken', 'positive-tabindex', /^input has tabindex=2;/], ['sensors-broken', 'ungrouped-choice', /named "unit" .*enclosing radiogroup has none/],
  ['sensors-broken', 'ungrouped-choice', /named "alert" .*enclosing group has none/], ['sensors-broken', 'focus-order', /button follows div #map in the DOM but is displayed above it/],
  ['sensors-modal', 'ungrouped-choice', /named "reference"/], ['loans-edges', 'ungrouped-choice', /^2 checkbox inputs named "pickup" .*accessible name$/],
];
// F1 structure rows per fixture, healthy/broken pairs in D-A (loans) and D-B (sensors): exact counts per kind. loans-edges
// holds healthy edge cases (hidden, aria-hidden, disabled, per-item forms sharing a name, title or nested names, and in the middle of
// a button row a checkbox parked at left:-9999px and a 1 px clipped screen-reader-only link) and one set split across a group.
// img-alt-missing is the no-axe fallback only; with axe the image-alt rule reports those images instead.
const F1_KINDS = ['positive-tabindex', 'ungrouped-choice', 'img-alt-missing', 'focus-order'];
const F1_EXACT = { 'loans-healthy': [0, 0, 0, 0], 'loans-broken': [1, 2, 1, 1], 'loans-edges': [0, 1, 0, 0], 'sensors-healthy': [0, 0, 0, 0], 'sensors-broken': [1, 2, 1, 1], 'sensors-modal': [0, 1, 0, 0] };
// The whole pool, the older fixtures included: every F1 row by the states it lists. The one row outside the six F1 fixtures is
// accepted as geometrically true: on scope-modal-under-inert the nested open dialog is absolutely placed over the later Close button.
const F1_POOL = { 'positive-tabindex': ['loans-broken', 'sensors-broken'],
  'ungrouped-choice': ['loans-broken', 'loans-broken', 'loans-edges', 'sensors-broken', 'sensors-broken', 'sensors-modal'],
  'img-alt-missing': ['loans-broken', 'sensors-broken'], 'focus-order': ['loans-broken', 'scope-modal-under-inert', 'sensors-broken'] };
// F2 sets, each evaluated alone as if only those pages had been captured, then the whole pool: exact property-outlier and
// broken-image rows. D-A catalogue titles at 15px on one page instead of 14px; D-B threshold inputs 180px instead of 240px in the
// same 360px form; one missing cover or photo among loaded siblings. Two pages are never enough for a majority.
const F2_KINDS = ['property-outlier', 'broken-image'];
const CAT = ['loans-catalogue-1', 'loans-catalogue-2']; const LIST = ['sensors-list-1', 'sensors-list-2'];
const TITLE_ROW = (n, of) => ['loans-catalogue-3-odd', 'property-outlier', new RegExp(`^Repeated items "Tides and Moons" have fontSize 15px here; the same kind of item has 14px on ${n} of ${of} pages`)];
const WIDTH_ROW = (n, of) => ['sensors-list-3-odd', 'property-outlier', new RegExp(`^Fields "o-air" are 50% of their container width \\(180 of 360px\\) here; the same kind of field is 67% \\(240 of 360px\\) on ${n} of ${of} pages`)];
const COVER_ROW = ['loans-catalogue-3-odd', 'broken-image', /in loans-catalogue-3-odd, 2 of 3 assessed images loaded/];
const PHOTO_ROW = ['sensors-list-3-odd', 'broken-image', /in sensors-list-3-odd, 1 of 2 assessed images loaded/];
const F2_SETS = {
  'D-A healthy': [[...CAT, 'loans-catalogue-3'], []], 'D-A broken': [[...CAT, 'loans-catalogue-3-odd'], [TITLE_ROW(2, 3), COVER_ROW]],
  'D-A two pages': [['loans-catalogue-1', 'loans-catalogue-3-odd'], [COVER_ROW]],
  'D-B healthy': [[...LIST, 'sensors-list-3'], []], 'D-B broken': [[...LIST, 'sensors-list-3-odd'], [WIDTH_ROW(2, 3), PHOTO_ROW]],
  'D-B two pages': [['sensors-list-1', 'sensors-list-3-odd'], [PHOTO_ROW]],
  pool: [STATES, [TITLE_ROW(3, 4), WIDTH_ROW(3, 4), COVER_ROW, PHOTO_ROW]],
};
const IMAGE_GAPS = { 'loans-catalogue-2': { svg: 2, 'no-src': 2 }, 'sensors-list-1': { pending: 1 } };
// F6 wording sets, each evaluated alone, then the whole pool: exact rare-variant and label-mismatch rows. D-A: "Retrun" once beside
// "Return" eight times, and the label "City" on the field named country; Renew/Renewal, Reset/Renew and Shelf/Shelve stay clean.
// D-B: the label "Humidty" on the field named humidity, which is also a rare word there; the German label "Temperatur" stays clean.
const F6_KINDS = ['rare-variant', 'label-mismatch'];
const RETRUN_ROW = (n) => ['loans-wording-broken', 'rare-variant', new RegExp(`^Word "retrun" occurs once in the captured text; its close variant "return" occurs ${n} times \\(1 edit apart\\)`)];
const CITY_ROW = ['loans-wording-broken', 'label-mismatch', /^Field "country" has the label "City", which names another field of the same form \("city"\)/];
const HUMIDTY_LABEL_ROW = ['sensors-wording-broken', 'label-mismatch', /^Field "humidity" has the label "Humidty \(%\)"; its word "humidty" is 1 edit from "humidity"/];
const HUMIDTY_WORD_ROW = (n) => ['sensors-wording-broken', 'rare-variant', new RegExp(`^Word "humidty" occurs once in the captured text; its close variant "humidity" occurs ${n} times \\(1 edit apart\\)`)];
const F6_SETS = {
  'D-A healthy': [['loans-wording-healthy'], []], 'D-A broken': [['loans-wording-broken'], [RETRUN_ROW(8), CITY_ROW]],
  'D-B healthy': [['sensors-wording-healthy'], []], 'D-B broken': [['sensors-wording-broken'], [HUMIDTY_LABEL_ROW, HUMIDTY_WORD_ROW(3)]],
  'prose alone': [['prose-healthy'], []],
  pool: [STATES, [RETRUN_ROW('\\d+'), CITY_ROW, HUMIDTY_LABEL_ROW, HUMIDTY_WORD_ROW('\\d+')]],
};
// What each wording page leaves uncompared: the label wrapping a select (its text holds the options), the French label word with a
// diacritic the field name lacks, the search field without a name word, and the French rare word beside "humidity".
// Rare words are assessed only with a caller-supplied word list (--dictionary); without one the family is reported as unassessed.
const RARE = (withDiacritic) => (args.dictionary ? { assessed: true, withDiacritic, properNouns: 0 } : { assessed: false, reason: 'no dictionary supplied' });
const FIT_KEYS = ['capturedWords', 'knownWords', 'knownShare'];
const WORDING_GAPS = () => ({ 'loans-wording-healthy': { fields: { compared: 9, incomplete: 1, unassessed: { 'wrapped-content': 1 } }, rare: RARE(0) },
  'sensors-wording-healthy': { fields: { compared: 4, incomplete: 2, unassessed: { 'no-identifier': 1, diacritic: 1 } }, rare: RARE(1) } });
// A3 reached routes: healthy/broken pairs in D-A (loans) and D-B (sensors), each set in its own evidence dir with its own tracker.
// Steps are a full load (goto), history.pushState (push) or a fragment change (hash); a step with a label is captured. D-A broken
// leaves the fragment route uncaptured, D-B broken the pushState route. The D-B page loads an iframe, which is never a route.
const QUERY_CANARY = 'CANARY-QUERY-5d1a'; const FRAGMENT_CANARY = 'CANARY-FRAGMENT-8e3b';
const FIXTURES = `${pathToFileURL(join(import.meta.dirname, 'fixtures')).href}/`;
const LOAN_STEPS = (returns) => [['goto', 'loans-routes', 'catalogue'], ['push', `?patron=${QUERY_CANARY}#/patrons?card=${FRAGMENT_CANARY}`, 'patrons'], ['hash', '#/returns', returns]];
const SENSOR_STEPS = (thresholds) => [['goto', 'sensors-routes', 'zones'], ['hash', '#/zones/north', 'north'], ['push', `?sensor=${QUERY_CANARY}#/thresholds`, thresholds],
  ['goto', 'sensors-list-2', 'list']];
const LOAN_ROUTES = ['loans-routes.html', 'loans-routes.html#/patrons', 'loans-routes.html#/returns'];
const SENSOR_ROUTES = ['sensors-routes.html', 'sensors-routes.html#/zones/north', 'sensors-routes.html#/thresholds', 'sensors-list-2.html'];
const REACHED_SETS = { 'D-A healthy': [LOAN_STEPS('returns'), LOAN_ROUTES, []], 'D-A broken': [LOAN_STEPS(null), LOAN_ROUTES, ['loans-routes.html#/returns']],
  'D-B healthy': [SENSOR_STEPS('thresholds'), SENSOR_ROUTES, []], 'D-B broken': [SENSOR_STEPS(null), SENSOR_ROUTES, ['sensors-routes.html#/thresholds']] };
// F3 input-partition worklist: D-A patron forms and D-B sensor settings, each in its own evidence dir, captured through a spy page that
// records any input, focus or navigation method P01 touches (it must touch none) while an in-page counter sees input, change, focus, key,
// click and submit events (there must be none). The harness types canaries first; P01 never types, and no canary may reach an artifact.
// Rows are exact, in order: [field, partition, probe]; probe null means not derived (left to the agent).
const E = { kind: 'empty' }; const L = (length) => ({ kind: 'length', length }); const V = (value) => ({ kind: 'value', value }); const F = (name) => ({ kind: 'file', name });
const MAILFORM = V('missing-at-sign.example');
const COVERAGE = (over) => ({ fields: 0, withoutRow: 0, notListed: {}, ignoredByType: {}, invalid: {}, probeNotDerived: 0, fileInputsNotShown: 0, olderCaptures: [], ...over });
const PARTITION_SETS = {
  'D-A register patron': ['loans-register', [['#email', 'canary-patron@example.test'], ['#pin', 'CANARY-PIN-2c9e'], ['#notes', 'CANARY-NOTES-4a7d']], [
    ['fullName', 'empty', E], ['fullName', 'length-at-max', L(40)], ['fullName', 'length-over-max', L(41)], ['email', 'empty', E], ['email', 'type-malformed', MAILFORM],
    ['email', 'duplicate-identity', null], ['contactEmail', 'type-malformed', MAILFORM], ['card', 'length-at-max', L(14)], ['card', 'length-over-max', L(15)],
    ['oldPin', 'empty', E], ['newPin', 'empty', E], ['newPin', 'length-at-min', L(4)], ['newPin', 'length-under-min', L(3)]],
  COVERAGE({ fields: 9, withoutRow: 3, notListed: { disabled: 1, readonly: 1 }, probeNotDerived: 1 })],
  'D-B add sensor': ['sensors-add', [['#sensor-name', 'CANARY-SENSOR-6f1b']], [
    ['threshold', 'at-min', V('0')], ['threshold', 'below-min', V('-0.5')], ['threshold', 'at-max', V('50')], ['threshold', 'above-max', V('50.5')], ['threshold', 'off-step', V('0.25')],
    ['calibration', 'accept-inside', F('probe.csv')], ['calibration', 'accept-outside', F('probe.bin')],
    ['start', 'at-min', V('2026-03-01')], ['start', 'below-min', V('2026-02-22')], ['start', 'at-max', null], ['start', 'above-max', V('2026-04-07')], ['start', 'off-step', V('2026-03-02')],
    ['at', 'at-min', V('06:00')], ['at', 'below-min', null], ['at', 'at-max', V('20:00')], ['at', 'above-max', null], ['zone', 'pattern-outside', null], ['batch', 'pattern-outside', null], ['gain', 'at-max', V('10')], ['gain', 'above-max', null]],
  COVERAGE({ fields: 9, withoutRow: 2, notListed: { inactive: 1 }, ignoredByType: { 'maxlength on number': 1 }, probeNotDerived: 6, fileInputsNotShown: 1 })],
};
// Declared constraints recorded per field (attributes only; never a value, default value or checked state); a pattern is kept to 200 characters.
const LONG_PATTERN = `${'(?:[A-Z]{2}[0-9]{3})|'.repeat(10)}(?:[a-z]{4})`;
const CONSTRAINT_FACTS = { 'loans-register': { fullName: { required: true, maxlength: 40, autocomplete: 'name' }, email: { required: true, autocomplete: 'email' }, notes: {},
  phone: { inputmode: 'numeric' }, patronId: { required: true, readonly: true }, newPin: { required: true, minlength: 4, autocomplete: 'new-password' }, branch: { required: true } },
'sensors-add': { threshold: { min: '0', max: '50', step: '0.5' }, calibration: { multiple: true, accept: '.csv' }, batch: { pattern: LONG_PATTERN.slice(0, 200) }, zone: { pattern: '[A-Z]{2}[0-9]' }, gain: { max: '10', step: 'any' }, litres: { maxlength: 3 } } };
const CONSTRAINT_KEYS = new Set(['required', 'readonly', 'multiple', 'minlength', 'maxlength', 'min', 'max', 'step', 'pattern', 'accept', 'autocomplete', 'inputmode']);
// The whole fixture pool: only its e-mail fields declare anything, so only their malformed rows.
const POOL_PARTITIONS = [['b1', 'type-malformed', MAILFORM], ['b2', 'type-malformed', MAILFORM], ['b3', 'type-malformed', MAILFORM], ['b4', 'type-malformed', MAILFORM], ['e', 'type-malformed', MAILFORM]];
const INPUT_METHODS = new Set(['fill', 'type', 'press', 'pressSequentially', 'click', 'dblclick', 'tap', 'check', 'uncheck', 'setChecked', 'selectOption', 'setInputFiles', 'focus', 'hover',
  'dispatchEvent', 'dragAndDrop', 'keyboard', 'mouse', 'touchscreen', 'locator', 'getByRole', 'getByLabel', 'getByText', '$', '$$', 'goto', 'reload', 'goBack', 'goForward', 'route']);
const MUST_NOT = [['scope-native-modal', 'style'], ['scope-inert', 'style'], ['scope-modal-under-inert', 'style'], ['privacy', 'a11y-name'], ['privacy', 'text-hygiene']];
// Precision round (real-page false-positive classes), exact rows per fixture without axe. D-B sensors-contrast: a white caption over a
// sibling photo and white text over a positioned gradient overlay are not assessed (layer); text in an opacity-0 wrapper is a low-confidence
// row noted as not rendered, while a caption over a photo inside that wrapper is still a layer case; text in an opacity-0.4 wrapper is faded into a row; a separator dot between prices is not assessed (decorative
// glyph), while a close button whose whole name is a glyph and a table cell holding only a dash stay rows; text beside a photo is assessed,
// as are text on a white card placed over a photo, a list item whose own ::before paints a gradient bullet, a box whose inline icon
// is inside it and a caption over a photo that is itself transparent; text in a half-transparent card with its own background is
// not assessed (translucent).
// D-A loans-layout: six classless paragraphs of six sections, inline badges inheriting their panel's alignment, a size shared by three
// note blurbs (two of them long), a totals cell differing in family and size, a hidden state layer, a honeypot field parked off-screen and
// a fixed help button after the footer give no row; six items of one classless list with one at 19px stay a style row.
const P_EXACT = {
  'sensors-contrast': { contrast: [[/^Text "Weekly moisture summary" has contrast 3\.41:1 \(rgb\(139, 139, 139\) on rgb\(255, 255, 255\)\), needs 4\.5:1; not rendered at capture /, 'low'],
    [/^Text "Archived sensor notes" has contrast 1\.92:1 \(rgb\(85, 85, 85\) at opacity 0\.4 on rgb\(255, 255, 255\)\), needs 4\.5:1$/, 'medium'],
    [/^Text "✕" has contrast 1\.\d+:1 \(rgb\(201, 201, 201\) on rgb\(255, 255, 255\)\)/, 'medium'], [/^Text "–" has contrast 1\.\d+:1 \(rgb\(203, 203, 203\)/, 'medium']] },
  'loans-layout': { style: [[/^Look-alike elements differ in fontSize: "Shift 6" has 19px, most of 6 siblings have 16px$/, 'medium']], 'focus-order': [], geometry: [], padding: [], alignment: [] },
};
const P_CONTRAST_GAPS = { 'sensors-contrast': { layer: 3, translucent: 1, decorative_glyph: 1 } };
const NAMES_EXACT = [/^button\[type=button\] control has no accessible name/, /^input\[type=button\] control has no accessible name/,
  /^input\[type=submit\] control has no accessible name/, /^input\[type=reset\] control has no accessible name/, /^Field u has no label/];

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => (i % 2 ? acc : [...acc, [v.replace(/^--/, ''), all[i + 1]]]), []));
if (!args['playwright-from'] || !args.out) { console.error('usage: browser-control.mjs --playwright-from DIR --out DIR [--axe FILE] [--dictionary FILE]'); process.exit(2); }
const dictionary = args.dictionary ? await loadDictionary(args.dictionary) : null;
const withAxe = Boolean(args.axe);
const { chromium } = createRequire(join(args['playwright-from'], 'package.json'))('playwright');
await mkdir(args.out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const entries = []; const reachedRuns = {}; const partitionRuns = {};
const failures = [];
const fail = (msg) => failures.push(msg);
const openPage = async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/*', (route) => (/^(file|data):/.test(route.request().url()) ? route.continue() : route.abort()));
  return page;
};
// A same-document step waits for the main-frame framenavigated event it should cause; the bound turns a missing event into a failure.
async function visit(page, how, target) {
  if (how === 'goto') return page.goto(`${FIXTURES}${target}.html`);
  return Promise.all([page.waitForEvent('framenavigated', { predicate: (f) => f === page.mainFrame() && f.url().endsWith(target), timeout: 5000 }),
    page.evaluate(([kind, t]) => { if (kind === 'push') history.pushState(null, '', t); else location.hash = t; }, [how, target])]);
}
async function reachedSet(steps, dir) {
  const page = await openPage(); const tracker = await trackReached(page, { dir });
  for (const [how, target, label] of steps) {
    await visit(page, how, target);
    if (label) await captureState(page, { dir, label, axeSource: args.axe ?? null });
  }
  await tracker.stop();
  return { dir, page };
}
// A second capture under a used label (here differing only in case) is refused and leaves the index as it was.
// The harness reaches the fixture and types its canaries; then P01 captures through a spy page while the page counts input events.
async function partitionSet(fixture, typed, dir) {
  const page = await openPage(); await page.goto(`${FIXTURES}${fixture}.html`);
  for (const [sel, text] of typed) await page.fill(sel, text);
  await page.evaluate(() => { globalThis.inputEvents = []; for (const t of ['input', 'change', 'focusin', 'keydown', 'click', 'submit']) document.addEventListener(t, () => globalThis.inputEvents.push(t), true); });
  const touched = [];
  const spy = new Proxy(page, { get(target, prop) { if (INPUT_METHODS.has(prop)) touched.push(String(prop)); const v = Reflect.get(target, prop, target); return typeof v === 'function' ? v.bind(target) : v; } });
  await captureState(spy, { dir, label: fixture, axeSource: args.axe ?? null });
  return { dir, touched, events: await page.evaluate(() => globalThis.inputEvents) };
}
async function checkRefusal({ dir, page }) {
  const index = () => readFile(join(dir, 'passive', 'index.jsonl'), 'utf8'); const before = await index();
  const outcome = await captureState(page, { dir, label: 'Returns', axeSource: args.axe ?? null }).then(() => 'captured', (error) => error.message);
  if (!/^label "Returns" is already used in .* \(compared ignoring case\); captures are never overwritten/.test(outcome)) fail(`a capture under a used label was not refused: ${outcome}`);
  if (await index() !== before) fail('a refused capture changed the index');
}
try {
  const page = await openPage();
  const tracker = await trackReached(page, { dir: args.out });
  for (const label of STATES) {
    await page.goto(pathToFileURL(join(import.meta.dirname, 'fixtures', `${label}.html`)).href);
    if (label === 'privacy') { await page.fill('#e', CANARY.email); await page.fill('#p', CANARY.password); }
    entries.push(await captureState(page, { dir: args.out, label, axeSource: args.axe ?? null }));
  }
  await tracker.stop();
  for (const [name, [steps]] of Object.entries(REACHED_SETS)) {
    reachedRuns[name] = await reachedSet(steps, join(args.out, `reached-${name.replace(' ', '-')}`)).catch((error) => ({ error }));
  }
  if (reachedRuns['D-A healthy'].page) await checkRefusal(reachedRuns['D-A healthy']);
  for (const [name, [fixture, typed]] of Object.entries(PARTITION_SETS)) {
    partitionRuns[name] = await partitionSet(fixture, typed, join(args.out, `partitions-${fixture}`)).catch((error) => ({ error }));
  }
} finally { await browser.close(); }

const states = await loadStates(args.out);
const list = runDetectors(states, { dictionary });
const rows = (state, detector) => list.filter((c) => c.detector === detector && c.states.includes(state));
for (const [state, detector, re] of MUST) if (!rows(state, detector).some((c) => !re || re.test(c.what))) fail(`missing ${detector}@${state}${re ? ` ${re}` : ''}`);
for (const [state, detector] of MUST_NOT) if (rows(state, detector).length) fail(`unexpected ${detector}@${state}: ${rows(state, detector).map((c) => c.what).join(' | ')}`);
for (const [state, counts] of Object.entries(F1_EXACT)) F1_KINDS.forEach((kind, i) => {
  const want = kind === 'img-alt-missing' && withAxe ? 0 : counts[i]; const got = rows(state, kind);
  if (got.length !== want) fail(`${kind}@${state}: ${got.length} rows, expected ${want}: ${got.map((c) => c.what).join(' | ')}`);
});
for (const kind of F1_KINDS) {
  const got = list.filter((c) => c.detector === kind).map((c) => c.states.join(',')).sort(); const want = kind === 'img-alt-missing' && withAxe ? [] : F1_POOL[kind];
  if (JSON.stringify(got) !== JSON.stringify(want)) fail(`F1 pool ${kind}: rows at ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
}
if (withAxe) for (const state of ['loans-broken', 'sensors-broken']) if (!rows(state, 'axe').some((c) => /^image-alt:/.test(c.what))) fail(`axe image-alt row missing at ${state}`);
for (const [family, kinds, sets] of [['F2', F2_KINDS, F2_SETS], ['F6', F6_KINDS, F6_SETS]]) for (const [name, [labels, wanted]] of Object.entries(sets)) {
  const want = wanted.filter(([, kind]) => dictionary || kind !== 'rare-variant');
  const got = runDetectors(states.filter((s) => labels.includes(s.label)), { dictionary }).filter((c) => kinds.includes(c.detector));
  const seen = want.filter(([state, kind, re]) => got.some((c) => c.detector === kind && c.states.includes(state) && re.test(c.what)));
  if (got.length !== want.length || seen.length !== want.length) fail(`${family} ${name}: ${got.length} rows, expected ${want.length}: ${got.map((c) => `${c.detector}@${c.states.join(',')}: ${c.what}`).join(' | ')}`);
}
for (const [label, want] of Object.entries(WORDING_GAPS())) {
  const got = wordingCoverage([states.find((s) => s.label === label)], { dictionary });
  if (dictionary) {
    if (!got.rare.assessed || !(got.rare.knownShare >= 0.5)) fail(`word list does not fit ${label}`);
    for (const key of FIT_KEYS) delete got.rare[key];
  }
  if (JSON.stringify(got) !== JSON.stringify(want)) fail(`wording coverage at ${label}: ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
}
for (const [label, gaps] of Object.entries(IMAGE_GAPS)) {
  const cov = imageCoverage(states.find((s) => s.label === label));
  if (JSON.stringify(cov.unassessed) !== JSON.stringify(gaps) || cov.failed !== 0) fail(`image coverage at ${label}: ${JSON.stringify(cov)}, expected unassessed ${JSON.stringify(gaps)}`);
}
const poolMd = toMarkdown(list, states, { dictionary });
if (/^rare-variant: unassessed \(no dictionary supplied\)/m.test(poolMd) === Boolean(dictionary)) fail(`report rare-variant line does not match the dictionary option (${dictionary ? 'supplied' : 'none'})`);
for (const [label, kinds] of Object.entries(P_EXACT)) for (const [kind, want] of Object.entries(kinds)) {
  if (kind === 'contrast' && withAxe) continue;
  const got = rows(label, kind); const seen = want.filter(([re, confidence]) => got.some((c) => re.test(c.what) && c.confidence === confidence));
  if (got.length !== want.length || seen.length !== want.length) fail(`precision ${kind}@${label}: ${got.length} rows, expected ${want.length}: ${got.map((c) => `[${c.confidence}] ${c.what}`).join(' | ')}`);
}
if (!withAxe) for (const [label, gaps] of Object.entries(P_CONTRAST_GAPS)) {
  const cov = contrastCoverage(states.find((s) => s.label === label));
  if (JSON.stringify(cov.unassessed) !== JSON.stringify(gaps)) fail(`contrast coverage at ${label}: ${JSON.stringify(cov)}, expected unassessed ${JSON.stringify(gaps)}`);
}
const names = rows('names', 'a11y-name').map((c) => c.what);
const factsOf = async (label) => JSON.parse(await readFile(join(args.out, 'passive', `${label}.facts.json`), 'utf8'));
const underInert = await factsOf('scope-modal-under-inert');
const icons = (f, cls) => f.controls.filter((c) => c.sel.includes(cls));
if (!icons(underInert, 'active-icon').every((c) => !c.inactive) || !icons(underInert, 'active-icon').length) fail('active control in a modal under an inert ancestor is marked inactive');
if (!icons(underInert, 'inert-icon').every((c) => c.inactive) || !icons(underInert, 'inert-icon').length) fail('explicitly inert child inside the active modal is not inactive');
if (!icons(underInert, 'nested-icon').every((c) => !c.inactive) || !icons(underInert, 'nested-icon').length) fail('active control in a non-modal dialog nested in the escaping modal is marked inactive');
if (!icons(underInert, 'nested-inert-icon').every((c) => c.inactive) || !icons(underInert, 'nested-inert-icon').length) fail('explicitly inert child of the nested non-modal dialog is not inactive');
if (rows('scope-modal-under-inert', 'a11y-name').length !== 2) fail(`modal-under-inert a11y-name rows: ${rows('scope-modal-under-inert', 'a11y-name').length} (expected the active and the nested active icon only)`);
const twoModals = await factsOf('scope-two-modals');
if (!twoModals.activeContext.ambiguousModal || twoModals.activeContext.nativeModal !== null) fail(`two open modals not reported as ambiguous: ${JSON.stringify(twoModals.activeContext)}`);
if (rows('scope-two-modals', 'a11y-name').length !== 2) fail(`two-modals a11y-name rows: ${rows('scope-two-modals', 'a11y-name').length} (expected both dialog icons, no suppression)`);
// Facts contract for the precision round: layers, effective opacity, separator context, display, pinned focusables and an off-page field.
const camera = await factsOf('sensors-contrast'); const textFact = (f, t) => f.elements.find((e) => e.text === t) ?? {};
const factWant = [['North bench camera', (e) => e.bg?.kind === 'layer'], ['Night bench camera', (e) => e.bg?.kind === 'layer' && e.opacity === 0], ['South zone climate', (e) => e.bg?.kind === 'layer'], ['Seed tray readings', (e) => e.bg?.kind === 'solid' && e.opacity === undefined],
  ['Weekly moisture summary', (e) => e.opacity === 0 && e.bg?.kind === 'solid'], ['Archived sensor notes', (e) => e.opacity === 0.4], ['·', (e) => e.glyph?.peers === true && e.glyph.whole === false],
  ['✕', (e) => e.glyph?.whole === true], ['–', (e) => e.glyph?.whole === true], ['Greenhouse cameras', (e) => e.style?.display === 'block' && e.glyph === undefined],
  ...['Bench four label', 'Spare camera slot', 'Drip line checked', 'Valve open'].map((t) => [t, (e) => e.bg?.kind === 'solid']), ['Old firmware notes', (e) => e.bg?.opacity === 0.5 && e.opacity === 0.5]];
for (const [t, ok] of factWant) if (!ok(textFact(camera, t))) fail(`sensors-contrast facts for "${t}": ${JSON.stringify(textFact(camera, t))}`);
const desk = await factsOf('loans-layout');
const pinnedSel = (x) => (x.sel.includes('fab') ? 'fixed' : x.sel.includes('nav.jump') ? 'sticky' : undefined);
if (desk.focusables.some((x) => x.pinned?.position !== pinnedSel(x))) fail(`only the help button (fixed) and the jump link (sticky) are pinned: ${JSON.stringify(desk.focusables.map((x) => [x.sel, x.pinned]))}`);
const trapField = desk.fields.find((x) => x.name === 'website');
if (!trapField || trapField.rect.x + trapField.rect.w > 0) fail(`the honeypot field must lie left of the page: ${JSON.stringify(trapField?.rect)}`);
if (textFact(desk, 'Card refused').opacity !== 0 || textFact(desk, 'Card scanned').opacity !== undefined || textFact(desk, 'Loan desk 1').style?.display !== 'inline-block') fail('loans-layout opacity or display facts');
const loanGroups = (await factsOf('loans-healthy')).choiceGroups;
const sortLabel = (await factsOf('loans-wording-healthy')).fields.find((f) => f.name === 'sort')?.label;
if (sortLabel?.source !== 'label-wrap' || !/Order by.*Title.*Author/.test(sortLabel.text)) fail(`a label wrapping a select must carry its option texts (why it is not compared): ${JSON.stringify(sortLabel)}`);
const thresholds = (await factsOf('sensors-list-1')).fields;
if (thresholds.length !== 3 || thresholds.some((f) => f.sig !== 'input.threshold' || f.parentSig !== 'li.sensor' || f.containerW !== 360)) {
  fail(`threshold fields must carry their kind and the width of their form (360px), not of the list item: ${JSON.stringify(thresholds.map((f) => [f.sig, f.parentSig, f.containerW]))}`);
}
if (!loanGroups.length || loanGroups.some((g) => g.count < 2)) fail(`choice groups must list named sets of two or more only (the lone terms checkbox is not one): ${JSON.stringify(loanGroups.map((g) => [g.name, g.count]))}`);
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
const local = (urls) => urls.map((u) => (String(u).startsWith(FIXTURES) ? u.slice(FIXTURES.length) : u));
// Per reached set: the exact ledger routes in order, only {url, at} per line, the exact uncaptured remainder in the report, no query or fragment value.
async function checkReachedSet(name, routes, uncaptured) {
  const run = reachedRuns[name];
  if (run.error) { fail(`reached ${name}: ${run.error.message.split('\n')[0]}`); return null; }
  const ledger = await loadReached(run.dir);
  if (!ledger) { fail(`reached ${name}: no reached.jsonl was written`); return null; }
  const ledgerText = await readFile(join(run.dir, 'passive', 'reached.jsonl'), 'utf8'); const got = local(ledger.map((e) => e.url));
  if (JSON.stringify(got) !== JSON.stringify(routes)) fail(`reached ${name} ledger: ${JSON.stringify(got)}, expected ${JSON.stringify(routes)} (main-frame loads, pushState and fragment changes; no iframe)`);
  if (ledger.some((e) => Object.keys(e).join() !== 'url,at' || new Date(e.at).toISOString() !== e.at)) fail(`reached ${name} ledger lines are not {url, at}: ${ledgerText}`);
  const setStates = await loadStates(run.dir); const remainder = reachedRemainder(ledger, setStates);
  if (JSON.stringify(local(remainder.uncaptured)) !== JSON.stringify(uncaptured) || remainder.routes !== routes.length) fail(`reached ${name} remainder: ${JSON.stringify(remainder)}, expected uncaptured ${JSON.stringify(uncaptured)}`);
  const md = toMarkdown(runDetectors(setStates, { dictionary }), setStates, { reached: remainder, dictionary });
  const listed = local(md.split('\n').filter((l) => l.startsWith('- `')).map((l) => l.slice(3, -1)));
  if (JSON.stringify(listed) !== JSON.stringify(uncaptured) || /Reached, not captured/.test(md) !== uncaptured.length > 0) fail(`reached ${name} report lists ${JSON.stringify(listed)}, expected ${JSON.stringify(uncaptured)}`);
  if ([ledgerText, md, JSON.stringify(remainder)].some((t) => t.includes(QUERY_CANARY) || t.includes(FRAGMENT_CANARY))) fail(`reached ${name}: a query or fragment value was stored`);
  return { ...remainder, uncaptured: local(remainder.uncaptured) };
}
const reached = { pool: reachedRemainder(await loadReached(args.out), states) };
if (JSON.stringify(reached.pool) !== JSON.stringify({ ledger: 'recorded', routes: STATES.length, captured: STATES.length, uncaptured: [] })) fail(`pool: every fixture is loaded and captured, but the remainder is ${JSON.stringify(reached.pool)}`);
for (const [name, [, routes, uncaptured]] of Object.entries(REACHED_SETS)) reached[name] = await checkReachedSet(name, routes, uncaptured);
// F3: exact worklist rows and coverage per set, the facts contract, no P01 input method or page event, and no typed canary anywhere.
const plannedRows = (w) => w.rows.map((r) => [r.name, r.partition, r.probe]);
const partitions = { pool: partitionWorklist(states) };
if (JSON.stringify(plannedRows(partitions.pool)) !== JSON.stringify(POOL_PARTITIONS)) fail(`partitions pool: ${JSON.stringify(plannedRows(partitions.pool))}, expected ${JSON.stringify(POOL_PARTITIONS)}`);
if (JSON.stringify(partitions.pool).includes(CANARY.email) || JSON.stringify(partitions.pool).includes(CANARY.password)) fail('partitions pool: a typed canary reached the worklist');
for (const s of states) for (const f of s.facts.fields) {
  const bad = ['value', 'defaultValue', 'checked'].filter((k) => Object.hasOwn(f, k)).concat(Object.keys(f.constraints ?? { missing: 1 }).filter((k) => !CONSTRAINT_KEYS.has(k)));
  if (bad.length) fail(`field facts at ${s.label} ${f.sel} carry ${bad.join(', ')}`);
}
for (const [name, [fixture, typed, wantRows, wantCoverage]] of Object.entries(PARTITION_SETS)) {
  const run = partitionRuns[name];
  if (!run || run.error) { fail(`partitions ${name}: ${run?.error?.message.split('\n')[0] ?? 'not run'}`); continue; }
  if (run.touched.length) fail(`partitions ${name}: P01 touched ${run.touched.join(', ')}`);
  if (run.events.length) fail(`partitions ${name}: page events during capture: ${run.events.join(', ')}`);
  const setStates = await loadStates(run.dir); const w = partitionWorklist(setStates); partitions[name] = w;
  if (JSON.stringify(plannedRows(w)) !== JSON.stringify(wantRows)) fail(`partitions ${name}: ${JSON.stringify(plannedRows(w))}, expected ${JSON.stringify(wantRows)}`);
  if (JSON.stringify(w.coverage) !== JSON.stringify(wantCoverage)) fail(`partitions ${name} coverage: ${JSON.stringify(w.coverage)}, expected ${JSON.stringify(wantCoverage)}`);
  if (!w.rows.every((r) => r.authority === 'requires write authority' && r.status === 'not executed')) fail(`partitions ${name}: a row lacks its authority or status`);
  const md = toMarkdown(runDetectors(setStates, { dictionary }), setStates, { dictionary, partitions: w });
  const mdRows = md.split('\n').filter((l) => /^\| W\d{3} /.test(l));
  if (mdRows.length !== wantRows.length || !mdRows.every((l) => l.endsWith('| requires write authority — not executed |'))) fail(`partitions ${name}: report rows ${mdRows.length}, expected ${wantRows.length}, each marked not executed`);
  const factsText = await readFile(join(run.dir, 'passive', `${fixture}.facts.json`), 'utf8');
  for (const [, text] of typed) if ([factsText, JSON.stringify(w), md].some((t) => t.includes(text))) fail(`partitions ${name}: typed canary ${text} reached an artifact`);
  const fieldFacts = JSON.parse(factsText);
  for (const [field, want] of Object.entries(CONSTRAINT_FACTS[fixture])) {
    const got = fieldFacts.fields.find((f) => f.name === field)?.constraints;
    if (JSON.stringify(got) !== JSON.stringify(want)) fail(`constraint facts ${fixture} ${field}: ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  }
}
const files = await readdir(join(args.out, 'passive'));
const unexpectedFiles = files.filter((f) => !/\.(facts\.json|axe\.json|png)$|^(index|reached)\.jsonl$|^candidates\.(json|md)$/.test(f));
if (unexpectedFiles.length) fail(`unexpected artifacts written: ${unexpectedFiles.join(', ')}`);
for (const f of files.filter((x) => !x.endsWith('.png'))) {
  const text = await readFile(join(args.out, 'passive', f), 'utf8');
  if (text.includes(CANARY.password) || text.includes(CANARY.hidden)) fail(`secret canary present in ${f}`);
  if (/\.(facts|axe)\.json$/.test(f) && text.includes(CANARY.email)) fail(`typed e-mail canary present in ${f}`);
  if (f === 'privacy.facts.json' && !text.includes(RESIDUAL_TEXTAREA)) fail('documented textarea default-content residual is absent');
  if (f !== 'privacy.facts.json' && text.includes(RESIDUAL_TEXTAREA)) fail(`textarea residual reached ${f}`);
  if (f.endsWith('.axe.json')) for (const v of JSON.parse(text).violations ?? []) for (const n of v.nodes) {
    const extra = Object.keys(n).filter((k) => !['target', 'contrast'].includes(k));
    if (extra.length) fail(`axe node in ${f} keeps unused fields: ${extra.join(', ')}`);
  }
}
console.log(JSON.stringify({ axe: withAxe ? 'requested' : 'not requested', dictionary: dictionary ? `${dictionary.size} words` : 'none', captures: entries.map((e) => ({ label: e.label, ms: e.ms, axe: e.axe })), candidates: list.map((c) => `${c.id} ${c.detector} ${c.states.join(',')}: ${c.what}`), reached,
  partitions: Object.fromEntries(Object.entries(partitions).map(([k, w]) => [k, { count: w.count, coverage: w.coverage }])), failures }, null, 1));
if (failures.length) { console.error(`BROWSER CONTROL FAIL (${failures.length})`); process.exit(1); }
console.log('BROWSER CONTROL PASS');
