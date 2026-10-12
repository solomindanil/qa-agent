import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleOutliers, crossStateAlignment, inputPaddingOutliers, primaryActionGeometry, optionFontOutliers,
  crossStateProperties, crossStateCoverage, brokenImageCandidates, imageCoverage } from '../tools/passive-capture/style-detectors.mjs';
import { computedContrast, contrastCoverage, axeCandidates, nameCandidates, contrastRatio, parseColor,
  positiveTabindexCandidates, ungroupedChoiceCandidates, imgAltCandidates, focusOrderCandidates } from '../tools/passive-capture/a11y-detectors.mjs';
import { runDetectors, toMarkdown, duplicateLabels, loadStates } from '../tools/passive-capture/detect.mjs';
import { captureState } from '../tools/passive-capture/capture.mjs';
import { routeOf, trackReached, loadReached, reachedRemainder } from '../tools/passive-capture/reached.mjs';
import { partitionWorklist } from '../tools/passive-capture/partitions.mjs';

const STYLE = { textAlign: 'start', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', color: 'rgb(33, 37, 41)', paddingLeft: '0px', paddingRight: '0px' };
const el = (text, over = {}) => ({ sel: `#${text.replace(/\W/g, '')}`, tag: 'h5', sig: 'h5.card-title', parentSig: 'div.card-body', text,
  rect: { x: 0, y: 0, w: 100, h: 20 }, bg: { kind: 'solid', color: 'rgb(255, 255, 255)' }, disabled: false, inactive: false, ...over, style: { ...STYLE, ...over.style } });
const field = (name, over = {}) => ({ sel: `#${name}`, tag: 'input', type: 'text', textLike: true, id: name, name, placeholder: null,
  label: { text: name, source: 'label-for' }, form: 0, rect: { x: 100, y: 0, w: 300, h: 38 }, disabled: false, inactive: false, ...over,
  style: { ...STYLE, paddingLeft: '12px', ...over.style } });
const button = (name, over = {}) => ({ sel: `#${name}`, tag: 'button', type: 'submit', sig: 'button.btn', name: { text: name, source: 'text' }, form: 0,
  rect: { x: 100, y: 200, w: 300, h: 38 }, disabled: false, inactive: false, style: STYLE, ...over });
const facts = (over = {}) => ({ url: 'http://app.test/', elements: [], fields: [], controls: [], activeContext: { nativeModal: null, inertRoots: [], ariaModalDeclared: [] }, formCount: 0, ...over });
const state = (label, f, axe = { available: false, reason: 'no axe source passed by the caller' }) => ({ label, url: f.url, facts: f, axe });
const titles = (align, n = 6) => Array.from({ length: n }, (_, i) => el(`Item ${i}`, { style: { textAlign: align } }));

test('style outliers: healthy group, one injected outlier, logical-vs-physical alignment and inactive-context exclusion', () => {
  assert.deepEqual(styleOutliers(state('a', facts({ elements: titles('start') }))), []);
  const mixed = [...titles('start', 5).map((e) => ({ ...e, style: { ...e.style, textAlign: 'left' } })), el('Item X', { style: { textAlign: 'start' } })];
  assert.deepEqual(styleOutliers(state('a', facts({ elements: mixed }))), [], 'start and left render the same in LTR');
  const injected = [...titles('start', 5), el('Odd one', { style: { textAlign: 'right' } })];
  const found = styleOutliers(state('a', facts({ elements: injected })));
  assert.equal(found.length, 1); assert.match(found[0].what, /"Odd one" has right/); assert.equal(found[0].evidence.selector, '#Oddone');
  const hidden = [...titles('start', 5), el('Odd one', { inactive: true, style: { textAlign: 'right' } })];
  assert.deepEqual(styleOutliers(state('a', facts({ elements: hidden }))), [], 'elements in an inactive (native modal or inert) context are not inspected');
});

test('cross-state alignment flags only the page whose repeated items differ', () => {
  const page = (n, align) => state(`p${n}`, facts({ url: `http://app.test/p${n}`, elements: titles(align, 3) }));
  assert.deepEqual(crossStateAlignment([page(1, 'left'), page(2, 'left'), page(3, 'start'), page(4, 'left')]), []);
  const found = crossStateAlignment([page(1, 'left'), page(2, 'left'), page(3, 'center'), page(4, 'left')]);
  assert.equal(found.length, 1); assert.equal(found[0].evidence.state, 'p3'); assert.match(found[0].what, /center-aligned here/);
  assert.deepEqual(crossStateAlignment([page(1, 'left'), page(2, 'center')]), [], 'fewer than three pages is not enough to call a majority');
});

test('input padding: smaller-than-usual padding is a candidate, larger (icon slot) is not', () => {
  const inputs = (pads) => [state('f', facts({ fields: pads.map((p, i) => field(`f${i}`, { style: { paddingLeft: p } })) }))];
  assert.deepEqual(inputPaddingOutliers(inputs(['12px', '12px', '12px', '12px', '12px', '12px'])), []);
  assert.deepEqual(inputPaddingOutliers(inputs(['12px', '12px', '12px', '12px', '12px', '40px'])), []);
  const found = inputPaddingOutliers(inputs(['12px', '12px', '12px', '12px', '12px', '0px']));
  assert.equal(found.length, 1); assert.match(found[0].what, /f5 has left padding 0px/);
});

test('primary action geometry: one narrow form among full-width siblings, plus offset buttons', () => {
  const form = (n, btn) => state(`form${n}`, facts({ url: `http://app.test/form${n}`, formCount: 1, fields: [field(`a${n}`), field(`b${n}`, { rect: { x: 100, y: 50, w: 300, h: 38 } })], controls: [btn] }));
  const full = (n) => form(n, button(`go${n}`));
  assert.deepEqual(primaryActionGeometry([full(1), full(2), full(3), full(4)]), []);
  const narrow = form(5, button('go5', { rect: { x: 100, y: 200, w: 90, h: 38 } }));
  const found = primaryActionGeometry([full(1), full(2), full(3), narrow]);
  assert.equal(found.length, 1); assert.equal(found[0].evidence.state, 'form5'); assert.match(found[0].what, /left at 30%/);
  const half = (n, w) => form(n, button(`go${n}`, { rect: { x: 100, y: 200, w, h: 38 } }));
  const ratioOnly = primaryActionGeometry([half(7, 150), half(8, 150), half(9, 150), half(10, 60)]);
  assert.equal(ratioOnly.length, 1, 'same alignment, much narrower width is still a candidate'); assert.equal(ratioOnly[0].evidence.state, 'form10');
  const offset = form(6, button('go6', { rect: { x: 150, y: 200, w: 90, h: 38 } }));
  const single = primaryActionGeometry([offset]);
  assert.equal(single.length, 1); assert.equal(single[0].severity, 'low'); assert.match(single[0].what, /neither full width nor aligned/);
});

test('option font outliers flag the differently sized option only', () => {
  const opts = (sizes) => state('s', facts({ fields: [field('sort', { tag: 'select', textLike: true, options: sizes.map((fontSize, i) => ({ text: `o${i}`, fontSize })) })] }));
  assert.deepEqual(optionFontOutliers(opts(['16px', '16px', '16px'])), []);
  const found = optionFontOutliers(opts(['16px', '16px', '13px', '16px']));
  assert.equal(found.length, 1); assert.match(found[0].what, /"o2" 13px vs 16px/);
});

test('contrast: WCAG ratio, computed fallback only without axe, unknown backgrounds unassessed', () => {
  assert.equal(contrastRatio(parseColor('rgb(0, 0, 0)'), parseColor('rgb(255, 255, 255)')).toFixed(1), '21.0');
  assert.equal(contrastRatio(parseColor('rgb(119, 119, 119)'), parseColor('rgb(255, 255, 255)')).toFixed(2), '4.48');
  assert.equal(parseColor('oklch(0.5 0.1 120)'), null);
  const low = el('Muted', { style: { color: 'rgb(153, 153, 153)' } });
  assert.equal(computedContrast(state('c', facts({ elements: [low] }))).length, 1);
  assert.deepEqual(computedContrast(state('c', facts({ elements: [el('Fine')] }))), []);
  assert.deepEqual(computedContrast(state('c', facts({ elements: [{ ...low, bg: { kind: 'image' } }, { ...low, bg: { kind: 'translucent', color: 'rgba(0, 0, 0, 0.5)' } }] }))), []);
  assert.deepEqual(computedContrast(state('c', facts({ elements: [{ ...low, disabled: true }] }))), [], 'inactive controls are exempt');
  const large = el('Big', { style: { color: 'rgb(130, 130, 130)', fontSize: '24px' } });
  assert.deepEqual(computedContrast(state('c', facts({ elements: [large] }))), [], 'large text needs 3:1 only');
  assert.deepEqual(computedContrast(state('c', facts({ elements: [low] }), { available: true, violations: [] })), [], 'axe result wins when axe ran');
  const unsupportedFg = el('Modern', { style: { color: 'oklch(0.97 0.01 250)' } });
  const unsupportedBg = { ...el('On modern panel', { style: { color: 'rgb(240, 240, 240)' } }), bg: { kind: 'unsupported', color: 'oklch(0.25 0.05 250)' } };
  const mixed = state('c', facts({ elements: [low, el('Fine'), unsupportedFg, unsupportedBg, { ...low, bg: { kind: 'image' } }] }));
  assert.equal(computedContrast(mixed).length, 1, 'only the supported low-contrast pair is a candidate; no ratio is fabricated');
  assert.deepEqual(contrastCoverage(mixed), { mode: 'computed', assessed: 2, unassessed: { unsupported_colour: 2, image: 1 } });
  assert.deepEqual(contrastCoverage(state('c', facts({ elements: [low] }), { available: true, violations: [] })), { mode: 'axe' });
});

test('axe results: contrast mapped with ratios, rules owned by the name detector skipped', () => {
  const axe = { available: true, violations: [
    { id: 'color-contrast', impact: 'serious', help: 'contrast', nodes: [{ target: '.badge', contrast: { contrastRatio: 2.1, fgColor: '#555', bgColor: '#333', expectedContrastRatio: '4.5:1' } }] },
    { id: 'label', impact: 'critical', help: 'labels', nodes: [{ target: '#email' }] },
    { id: 'image-alt', impact: 'critical', help: 'alt', nodes: [{ target: 'img.logo' }] }] };
  const found = axeCandidates(state('x', facts(), axe));
  assert.deepEqual(found.map((c) => c.detector).sort(), ['axe', 'contrast']);
  assert.match(found.find((c) => c.detector === 'contrast').what, /2.1:1 \(#555 on #333\)/);
  assert.deepEqual(axeCandidates(state('x', facts())), [], 'unavailable axe yields nothing, not a pass');
  const underModal = axeCandidates(state('x', facts({ elements: [el('x', { inactive: true })] }), axe));
  assert.equal(underModal.length, 2, 'axe rows are a separate stream: our inactive-context policy does not erase them');
});

test('accessible names: nameless control and placeholder-only field are candidates; named, natively named and inactive ones are not', () => {
  const s = state('n', facts({
    controls: [button('ok'), button('icon', { name: { text: '', source: 'none' } }), button('hidden', { name: { text: '', source: 'none' }, inactive: true }),
      button('submit', { tag: 'input', type: 'submit', name: { text: 'Submit', source: 'native-default' } })],
    fields: [field('named'), field('email', { label: { text: '', source: 'none' }, placeholder: 'Your e-mail' }), field('bare', { label: { text: '', source: 'none' } })] }));
  const found = nameCandidates(s).map((c) => c.what);
  assert.equal(found.length, 3);
  assert.match(found[0], /control has no accessible name/);
  assert.match(found[1], /only by its placeholder "Your e-mail"/);
  assert.match(found[2], /bare has no label/);
});

test('runDetectors merges the same candidate across states and the summary states axe coverage', () => {
  const nameless = (label) => state(label, facts({ url: `http://app.test/${label}`, controls: [button('icon', { name: { text: '', source: 'none' } })] }));
  const list = runDetectors([nameless('home'), nameless('detail')]);
  assert.equal(list.length, 1); assert.deepEqual(list[0].states, ['home', 'detail']); assert.equal(list[0].id, 'P001');
  const twoLow = state('c', facts({ elements: [el('One', { style: { color: 'rgb(153, 153, 153)' } }), el('Two', { style: { color: 'rgb(153, 153, 153)' } })] }));
  const same = runDetectors([twoLow]);
  assert.equal(same.length, 1); assert.deepEqual(same[0].states, ['c'], 'a state is listed once'); assert.equal(same[0].evidence.length, 2);
  const md = toMarkdown(list, [nameless('home'), nameless('detail')]);
  assert.match(md, /axe ran on 0; computed contrast was used for the rest/); assert.match(md, /\| Disposition \|/);
  const unsupported = state('u', facts({ elements: [el('Modern', { style: { color: 'oklch(0.9 0.01 250)' } })] }));
  assert.match(toMarkdown([], [unsupported]), /Contrast not assessed: 1 element\(s\) \(unsupported colour 1\)/);
});

// F1 structure facts in two neutral domains: D-A library loans and patrons, D-B greenhouse sensor settings.
const focusable = (sel, over = {}) => ({ sel, tag: 'button', tabindex: null, rect: { x: 0, y: 0, w: 80, h: 30 }, dir: 'ltr', disabled: false, inactive: false, ...over });
const at = (x, y, w = 80, h = 30) => ({ rect: { x, y, w, h } });
const choice = (name, over = {}) => ({ type: 'radio', name, form: 0, count: 3, sel: `#${name}-1`, container: 'fieldset', nameSource: 'legend', disabled: false, inactive: false, ...over });
const image = (sel, over = {}) => ({ sel, alt: 'text', role: null, ariaHidden: false, nameSource: 'none', inactive: false, ...over });

test('positive tabindex: 0 and -1 are healthy, a positive value is a candidate; inactive and disabled elements are skipped', () => {
  const loans = (tabindex, over = {}) => state('loan', facts({ focusables: [focusable('#lend'), focusable('#patron', { tag: 'input', tabindex, ...over })] }));
  assert.deepEqual(positiveTabindexCandidates(loans(0)), []);
  assert.deepEqual(positiveTabindexCandidates(loans(-1)), []);
  const found = positiveTabindexCandidates(loans(3));
  assert.equal(found.length, 1); assert.equal(found[0].detector, 'positive-tabindex'); assert.equal(found[0].evidence.selector, '#patron');
  assert.match(found[0].what, /^input has tabindex=3; a positive value overrides the document focus order \(convention; check whether intended\)\. Attribute only, no key was pressed$/);
  assert.deepEqual(positiveTabindexCandidates(loans(3, { inactive: true })), [], 'inert or outside the single native modal');
  assert.deepEqual(positiveTabindexCandidates(loans(3, { disabled: true })), []);
  const sensors = state('sensors', facts({ focusables: [focusable('#humidity', { tag: 'input', tabindex: 2 }), focusable('#save', { tabindex: 0 })] }));
  assert.deepEqual(positiveTabindexCandidates(sensors).map((c) => c.evidence.selector), ['#humidity']);
});

test('ungrouped choice: legend, named group or radiogroup are healthy; a removed legend, an unnamed group or no container are candidates', () => {
  const run = (groups) => ungroupedChoiceCandidates(state('g', facts({ choiceGroups: groups })));
  assert.deepEqual(run([choice('loan-length'), choice('notify', { type: 'checkbox', count: 2, container: 'group', nameSource: 'aria-labelledby' })]), []);
  const noLegend = run([choice('loan-length', { nameSource: 'none' })]);
  assert.equal(noLegend.length, 1); assert.equal(noLegend[0].detector, 'ungrouped-choice');
  assert.match(noLegend[0].what, /^3 radio inputs named "loan-length" share a name but have no group name, so the group question may not be announced: .* \(the enclosing fieldset has none\)$/);
  const bare = run([choice('notify', { type: 'checkbox', count: 2, container: null, nameSource: 'none' })]);
  assert.equal(bare.length, 1); assert.doesNotMatch(bare[0].what, /enclosing/);
  assert.deepEqual(run([choice('unit', { container: 'radiogroup', nameSource: 'aria-label' })]), []);
  assert.match(run([choice('unit', { container: 'radiogroup', nameSource: 'none' })])[0].what, /the enclosing radiogroup has none/);
  assert.deepEqual(run([choice('unit', { count: 1, container: null, nameSource: 'none' })]), [], 'a single choice is not a set');
  assert.deepEqual(run([choice('unit', { nameSource: 'none', inactive: true }), choice('alert', { type: 'checkbox', nameSource: 'none', disabled: true })]), []);
});

test('img-alt-missing: only without axe; alt="", aria-hidden, role=presentation/none and aria-named images are healthy', () => {
  const healthy = [image('#logo'), image('#divider', { alt: 'empty' }), image('#icon', { alt: 'absent', ariaHidden: true }), image('#leaf', { alt: 'absent', role: 'presentation' }),
    image('#dot', { alt: 'absent', role: 'none' }), image('#chart', { alt: 'absent', nameSource: 'aria-labelledby' })];
  assert.deepEqual(imgAltCandidates(state('sensors', facts({ images: healthy }))), []);
  const broken = state('loan', facts({ images: [...healthy, image('#cover', { alt: 'absent' })] }));
  const found = imgAltCandidates(broken);
  assert.equal(found.length, 1); assert.equal(found[0].detector, 'img-alt-missing'); assert.equal(found[0].evidence.selector, '#cover');
  assert.match(found[0].what, /^Image has no alt attribute .*; axe did not run for this state$/);
  assert.deepEqual(imgAltCandidates({ ...broken, axe: { available: true, violations: [] } }), [], 'when axe ran, its image-alt rule owns this class');
  assert.deepEqual(imgAltCandidates(state('loan', facts({ images: [image('#cover', { alt: 'absent', inactive: true })] }))), []);
});

test('focus-order: layout matching DOM order is healthy; a reversed row and a later control shown above are candidates', () => {
  const run = (list) => focusOrderCandidates(state('f', facts({ focusables: list })));
  const fields = [focusable('#patron', { tag: 'input', ...at(0, 0, 300) }), focusable('#due', { tag: 'input', ...at(0, 40, 300) })];
  const actions = (xs) => xs.map((x, i) => focusable(`#act${i}`, at(x, 90)));
  assert.deepEqual(run([...fields, ...actions([0, 90, 180])]), []);
  const reversed = run([...fields, ...actions([180, 90, 0])]);
  assert.equal(reversed.length, 1, 'one run of a reversed row is one candidate'); assert.equal(reversed[0].detector, 'focus-order');
  assert.match(reversed[0].what, /displayed before it on the same line \(ltr\) \(2 consecutive steps\); DOM and layout comparison only, no key was pressed$/);
  assert.equal(reversed[0].evidence.selector, '#act1');
  const zones = [focusable('#zone-a', at(0, 0, 150)), focusable('#zone-b', at(0, 40, 150)), focusable('#zone-c', at(0, 80, 150))];
  const sensorForm = [focusable('#target', { tag: 'input', ...at(200, 50, 300) }), focusable('#interval', { tag: 'input', ...at(200, 90, 300) })];
  assert.deepEqual(run([...zones, ...sensorForm]), [], 'a new column that starts higher up is not reversed');
  assert.deepEqual(run([focusable('#z1', at(400, 0)), focusable('#z2', at(0, 40))]), [], 'a wrapped line is not reversed');
  assert.deepEqual(run([focusable('#r1', { ...at(300, 0), dir: 'rtl' }), focusable('#r2', { ...at(200, 0), dir: 'rtl' })]), [], 'a right-to-left row reads right to left');
  assert.match(run([focusable('#r1', { ...at(200, 0), dir: 'rtl' }), focusable('#r2', { ...at(300, 0), dir: 'rtl' })])[0].what, /same line \(rtl\)/);
  assert.deepEqual(run([focusable('#ltr', at(200, 0)), focusable('#rtl', { ...at(0, 0), dir: 'rtl' })]), [], 'mixed directions on one line are not compared');
  assert.deepEqual(run([focusable('#loan-card', { tag: 'a', ...at(0, 0, 300, 100) }), focusable('#dismiss', at(4, 4, 24, 24))]), [], 'a control overlapping its card is not before it');
  const lifted = run([...sensorForm, focusable('#save', at(380, 0, 120))]);
  assert.equal(lifted.length, 1); assert.equal(lifted[0].evidence.selector, '#save');
  assert.match(lifted[0].what, /^Focus order may differ from visual order: button follows input #interval in the DOM but is displayed above it; /);
  const above = focusable('#late', at(0, 0));
  assert.equal(run([...fields, above]).length, 1, 'control: a later element above an earlier one is compared');
  assert.deepEqual(run([...fields, { ...above, tabindex: 3 }]), [], 'positive tabindex is left to its own row');
  assert.deepEqual(run([...fields, { ...above, tabindex: -1 }]), [], 'not in the sequential focus order');
  assert.deepEqual(run([...fields, { ...above, inactive: true }]), []);
  assert.deepEqual(run([...fields, { ...above, disabled: true }]), []);
  assert.deepEqual(run([...fields, { ...above, ...at(0, -200) }]), [], 'a box outside the page has no reading position');
});

test('focus-order boundaries: 1 px and off-page boxes are skipped; the 4 px tolerance, the overlap and the half-height line hold on both sides', () => {
  const rows = (earlier, later, dir = 'ltr') => focusOrderCandidates(state('f', facts({ focusables: [focusable('#renew', { ...earlier, dir }), focusable('#later', { ...later, dir })] }))).length;
  const renew = at(200, 0);
  assert.equal(rows(renew, at(0, 10, 2, 30)), 1, 'a 2 px wide box on the line is compared');
  assert.equal(rows(renew, at(0, 10, 1, 30)), 0, 'a 1 px wide box (screen-reader-only) is skipped');
  assert.equal(rows(renew, at(0, 10, 80, 2)), 1, 'a 2 px high box on the line is compared');
  assert.equal(rows(renew, at(0, 10, 80, 1)), 0, 'a 1 px high box is skipped');
  assert.equal(rows(renew, at(-9999, 0, 100)), 0, 'a box parked left of the page (left:-9999px) has no reading position');
  assert.equal(rows(renew, at(-100, 0, 100)), 0, 'a box ending at the left page edge is skipped');
  assert.equal(rows(renew, at(-99, 0, 100)), 1, 'a box with 1 px inside the page is compared');
  const due = at(0, 100, 300);
  assert.equal(rows(due, at(0, -30, 300)), 0, 'a box ending at the top page edge is skipped');
  assert.equal(rows(due, at(0, -29, 300)), 1, 'a box with 1 px inside the page is compared');
  assert.equal(rows(renew, at(124, 0)), 1, 'overlapping the earlier box by 4 px is still before it (ltr)');
  assert.equal(rows(renew, at(125, 0)), 0, 'overlapping it by 5 px is not');
  assert.equal(rows(renew, at(276, 0), 'rtl'), 1, 'overlapping the earlier box by 4 px is still before it (rtl)');
  assert.equal(rows(renew, at(275, 0), 'rtl'), 0, 'overlapping it by 5 px is not (rtl)');
  assert.equal(rows(due, at(0, 74, 300)), 1, 'reaching 4 px into the earlier box is still above it');
  assert.equal(rows(due, at(0, 75, 300)), 0, 'reaching 5 px into it is not');
  const narrow = at(100, 100, 100);
  assert.equal(rows(narrow, at(0, 0, 105)), 1, 'a box above that overlaps 5 px horizontally is above it');
  assert.equal(rows(narrow, at(0, 0, 104)), 0, 'a box above that overlaps only 4 px is another column');
  assert.equal(rows(renew, at(0, 15)), 1, 'a vertical overlap of exactly half the smaller height is the same line');
  assert.equal(rows(renew, at(0, 16)), 0, 'just under half is a wrapped line, not the same line');
});

test('runDetectors: F1 rows stay candidates, merge across states, are byte-identical across runs and report missing facts', () => {
  const loan = (label) => state(label, facts({ url: `http://app.test/${label}`,
    focusables: [focusable('#patron', { tag: 'input', tabindex: 3 }), focusable('#lend', at(200, 300)), focusable('#cancel', at(0, 300))],
    choiceGroups: [choice('loan-length', { nameSource: 'none' })], images: [image('#cover', { alt: 'absent' })] }));
  const states = [loan('new-loan'), loan('renew-loan')];
  const list = runDetectors(states);
  assert.deepEqual(list.map((c) => c.detector).sort(), ['focus-order', 'img-alt-missing', 'positive-tabindex', 'ungrouped-choice']);
  assert.ok(list.every((c) => c.states.length === 2 && !Object.hasOwn(c, 'verdict') && !Object.hasOwn(c, 'status')));
  assert.equal(JSON.stringify(runDetectors(states)), JSON.stringify(list));
  const md = toMarkdown(list, [...states, state('older', facts())]);
  assert.match(md, /no key was pressed, so the actual Tab sequence is unassessed/);
  assert.match(md, /Focus, choice-group and image facts absent in: older/);
  assert.doesNotMatch(toMarkdown(list, states), /facts absent in/);
});

// F2 cross-page consistency and failed images in two neutral domains: D-A library catalogue pages, D-B greenhouse sensor lists.
const catalogue = (n, over = {}, count = 3) => state(`catalogue-${n}`, facts({ url: `http://app.test/catalogue/${n}`,
  elements: Array.from({ length: count }, (_, i) => el(`Title ${n}${i}`, { sig: 'span.book-title', parentSig: 'li.book', ...over })) }));
const sensorList = (n, over = {}, count = 3) => state(`sensors-${n}`, facts({ url: `http://app.test/sensors/${n}`,
  fields: Array.from({ length: count }, (_, i) => field(`zone${n}-${i}`, { type: 'number', sig: 'input.threshold', parentSig: 'li.sensor', containerW: 360,
    rect: { x: 64, y: 40 * i, w: 240, h: 30 }, ...over })) }));
const MAJORITY_NOTE = '; a majority, not a design rule, so the odd page may be the intended one';
const size = (fontSize) => ({ style: { fontSize } });

test('cross-page properties: a catalogue page whose titles differ in size is a candidate; agreeing pages, fewer than three pages or no clear majority are not', () => {
  assert.deepEqual(crossStateProperties([catalogue(1), catalogue(2), catalogue(3)]), []);
  const found = crossStateProperties([catalogue(1), catalogue(2), catalogue(3, size('15px'))]);
  assert.equal(found.length, 1); assert.equal(found[0].detector, 'property-outlier'); assert.equal(found[0].evidence.state, 'catalogue-3');
  assert.equal(found[0].evidence.selector, '#Title30'); assert.equal(found[0].severity, 'medium'); assert.equal(found[0].confidence, 'medium');
  assert.equal(found[0].what, `Repeated items "Title 30" have fontSize 15px here; the same kind of item has 16px on 2 of 3 pages${MAJORITY_NOTE}`);
  assert.deepEqual(crossStateProperties([catalogue(1), catalogue(3, size('15px'))]), [], 'fewer than three pages');
  assert.deepEqual(crossStateProperties([catalogue(1), catalogue(3, size('15px'))], { majority: 0.5 }), [], 'fewer than three pages, even with a looser majority');
  assert.deepEqual(crossStateProperties([catalogue(1), catalogue(2), catalogue(3, size('15px')), catalogue(4, size('15px'))]), [], 'a two-two split is no clear majority');
  assert.deepEqual(crossStateProperties([catalogue(1), catalogue(2, size('15px')), catalogue(3, size('18px'))]), [], 'three values, no majority');
  for (const prop of ['fontFamily', 'fontWeight', 'paddingLeft', 'paddingRight']) {
    const odd = crossStateProperties([catalogue(1), catalogue(2), catalogue(3, { style: { [prop]: 'odd' } })]);
    assert.deepEqual(odd.map((c) => c.what.split(' here;')[0]), [`Repeated items "Title 30" have ${prop} odd`], prop);
  }
  const centred = [catalogue(1), catalogue(2), catalogue(3, { style: { textAlign: 'center' } })];
  assert.deepEqual(crossStateProperties(centred), [], 'text-align stays with the alignment detector (no duplicate row)');
  assert.equal(crossStateAlignment(centred).length, 1);
  const even = state('catalogue-3', facts({ url: 'http://app.test/catalogue/3',
    elements: [el('Even A', { sig: 'span.book-title', parentSig: 'li.book', ...size('15px') }), el('Even B', { sig: 'span.book-title', parentSig: 'li.book' })] }));
  assert.match(crossStateProperties([catalogue(1), catalogue(2), even, catalogue(4, size('15px'))])[0]?.what ?? '', /15px here; .* 16px on 2 of 3 pages/,
    'a page split evenly has no value of its own and does not vote');
  for (const skip of [{ inactive: true }, { disabled: true }, { tag: 'td' }]) {
    assert.deepEqual(crossStateProperties([catalogue(1), catalogue(2), catalogue(3, { ...size('15px'), ...skip })]), [], JSON.stringify(skip));
  }
  const long = state('catalogue-3', facts({ url: 'http://app.test/catalogue/3',
    elements: ['a', 'b'].map((x) => el(`${x}${'x'.repeat(60)}`, { sig: 'span.book-title', parentSig: 'li.book', ...size('15px') })) }));
  assert.deepEqual(crossStateProperties([catalogue(1), catalogue(2), long]), [], 'long text is not a repeated item');
  assert.deepEqual(crossStateProperties([catalogue(1), catalogue(2), catalogue(3, size('15px'), 1)]), [], 'a single item is not repeated');
  const revisit = { ...catalogue(1), label: 'catalogue-1-again' };
  assert.deepEqual(crossStateProperties([catalogue(1), revisit, catalogue(3, size('15px'))]), [], 'one page captured twice is one page');
});

test('cross-page field width: a sensor list with narrower threshold inputs is a candidate; the same share of the form or the same pixel width is not', () => {
  const wide = (w, containerW = 360) => ({ rect: { x: 64, y: 0, w, h: 30 }, containerW });
  assert.deepEqual(crossStateProperties([sensorList(1), sensorList(2), sensorList(3)]), []);
  const found = crossStateProperties([sensorList(1), sensorList(2), sensorList(3, wide(180))]);
  assert.equal(found.length, 1); assert.equal(found[0].detector, 'property-outlier'); assert.equal(found[0].evidence.state, 'sensors-3');
  assert.equal(found[0].evidence.selector, '#zone3-0');
  assert.equal(found[0].what, `Fields "zone3-0" are 50% of their container width (180 of 360px) here; the same kind of field is 67% (240 of 360px) on 2 of 3 pages${MAJORITY_NOTE}`);
  assert.deepEqual(crossStateProperties([sensorList(1, wide(360)), sensorList(2, wide(360)), sensorList(3, wide(600, 600))]), [], 'full width of a wider form');
  assert.deepEqual(crossStateProperties([sensorList(1), sensorList(2), sensorList(3, wide(240, 600))]), [], 'the same pixel width in a wider form');
  assert.deepEqual(crossStateProperties([sensorList(1), sensorList(2), sensorList(3, wide(250, 390))]), [], 'within 5 percentage points');
  assert.deepEqual(crossStateProperties([sensorList(1), sensorList(2), sensorList(3, wide(243, 300))]), [], 'within 4 px');
  const notCompared = [{ sig: undefined }, { textLike: false }, { inactive: true }, { disabled: true }, { type: 'email' }, { parentSig: 'div.filters' },
    { containerW: undefined }, { containerW: 0 }];
  for (const over of notCompared) {
    assert.deepEqual(crossStateProperties([sensorList(1), sensorList(2), sensorList(3, { ...wide(180), ...over })]), [], `not compared: ${Object.keys(over)[0]}=${over[Object.keys(over)[0]]}`);
  }
  const older = { sig: undefined, parentSig: undefined };
  assert.deepEqual(crossStateProperties([sensorList(1, older), sensorList(2, older), sensorList(3, { ...wide(180), ...older })]), [],
    'older captures carry no field kind, so their fields are not lumped together by tag and type');
  const olderPath = { ...older, sel: 'form.thresholds > ul > li > input' };
  assert.deepEqual(crossStateProperties([sensorList(1, olderPath), sensorList(2, olderPath), sensorList(3, { ...wide(180), ...olderPath })]), [],
    'also when their selectors share a parent path');
  const font = crossStateProperties([sensorList(1), sensorList(2), sensorList(3, size('13px'))]);
  assert.deepEqual(font.map((c) => c.what), [`Fields "zone3-0" have fontSize 13px here; the same kind of field has 16px on 2 of 3 pages${MAJORITY_NOTE}`]);
  assert.deepEqual(crossStateCoverage([sensorList(1), sensorList(2), sensorList(3)]), { minStates: 3, compared: 1, notComparable: 0, notCompared: 0, propertiesNotCompared: 0, differentFamilies: 0 });
  assert.deepEqual(crossStateCoverage([catalogue(1), catalogue(2), sensorList(1, {}, 1)]), { minStates: 3, compared: 0, notComparable: 0, notCompared: 1, propertiesNotCompared: 0, differentFamilies: 0 },
    'kinds on fewer than three pages are counted');
});

test('cross-page boundaries: 5 points or 4 px of width match, 6 points and 5 px do not; two items, three of five pages and two of three items are enough', () => {
  const wide = (w, containerW) => ({ rect: { x: 64, y: 0, w, h: 30 }, containerW });
  const odd = (third) => crossStateProperties([sensorList(1), sensorList(2), sensorList(3, third)]).map((c) => c.evidence.state);
  assert.deepEqual(odd(wide(288, 400)), [], '72% beside 67% is within 5 percentage points (48 px apart)');
  assert.deepEqual(odd(wide(292, 400)), ['sensors-3'], '73% beside 67% is 6 points (52 px apart)');
  assert.deepEqual(odd(wide(244, 300)), [], '244 beside 240 px is within 4 px (81% of a narrower form)');
  assert.deepEqual(odd(wide(245, 300)), ['sensors-3'], '245 beside 240 px is 5 px (82%)');
  const two = (n, over) => catalogue(n, over, 2);
  assert.deepEqual(crossStateProperties([two(1), two(2), two(3, size('15px'))]).map((c) => c.evidence.state), ['catalogue-3'], 'two items per page are a repeated kind');
  const pages = [1, 2, 3].map((n) => catalogue(n)).concat([4, 5].map((n) => catalogue(n, size('15px'))));
  assert.deepEqual(crossStateProperties(pages).map((c) => c.evidence.state), ['catalogue-4', 'catalogue-5'], 'three of five pages (60%) are a majority');
  const mostly = state('catalogue-3', facts({ url: 'http://app.test/catalogue/3',
    elements: ['a', 'b', 'c'].map((x, i) => el(`Mostly ${x}`, { sig: 'span.book-title', parentSig: 'li.book', ...size(i < 2 ? '15px' : '16px') })) }));
  assert.match(crossStateProperties([catalogue(1), catalogue(2), mostly])[0]?.what ?? '', /^Repeated items "Mostly a" have fontSize 15px here/, 'two of three items give the page its value');
});

test('cross-page coverage: a kind counts as compared only when a property had a page value on three pages; kinds and properties without one are counted, never a pass', () => {
  const item = (n, x, over = {}) => el(`Title ${n}${x}`, { sig: 'span.book-title', parentSig: 'li.book', ...over });
  const split = (n, other) => state(`catalogue-${n}`, facts({ url: `http://app.test/catalogue/${n}`, elements: [item(n, 'a', size('14px')), item(n, 'b', other)] }));
  const sizeOnly = [1, 2, 3].map((n) => split(n, size('16px')));
  assert.deepEqual(crossStateProperties(sizeOnly), []);
  assert.deepEqual(crossStateCoverage(sizeOnly), { minStates: 3, compared: 1, notComparable: 0, notCompared: 0, propertiesNotCompared: 1, differentFamilies: 0 },
    'font size split evenly on every page: compared on the other properties, its font size counted as not compared');
  const everything = { style: { fontSize: '16px', fontFamily: 'Georgia, serif', fontWeight: '700', paddingLeft: '4px', paddingRight: '4px' } };
  const allSplit = [1, 2, 3].map((n) => split(n, everything));
  assert.deepEqual(crossStateCoverage(allSplit), { minStates: 3, compared: 0, notComparable: 1, notCompared: 0, propertiesNotCompared: 0, differentFamilies: 0 }, 'no property has a page value: nothing was compared');
  assert.deepEqual(crossStateCoverage([catalogue(1, {}, 2), catalogue(2, {}, 2), split(3, size('16px'))]),
    { minStates: 3, compared: 1, notComparable: 0, notCompared: 0, propertiesNotCompared: 1, differentFamilies: 0 }, 'font size with a page value on two of three pages is not compared');
  const md = toMarkdown([], allSplit);
  assert.match(md, /^Cross-page properties: 0 repeated item or field kind\(s\) seen on at least 3 pages were compared; 0 seen on fewer pages were not compared\.$/m);
  assert.match(md, /^Not compared for lack of page values: 1 kind\(s\) seen on at least 3 pages, and 0 property comparison\(s\) of compared kinds \(fewer than 3 pages had a value that more than half of their items share\)\. No candidate there is not a pass\.$/m);
  assert.match(toMarkdown([], sizeOnly), /^Not compared for lack of page values: 0 kind\(s\) seen on at least 3 pages, and 1 property comparison\(s\) of compared kinds /m);
  assert.doesNotMatch(toMarkdown([], [catalogue(1), catalogue(2), catalogue(3)]), /lack of page values/, 'every property compared: no line');
});

test('broken image: a failed image among loaded siblings is a candidate; svg, no-source and not-yet-loaded images stay unassessed and are counted', () => {
  const covers = [image('#cover-1', { load: 'loaded' }), image('#cover-2', { load: 'loaded' }), image('#badge', { load: 'svg' }),
    image('#placeholder', { load: 'no-src' }), image('#later', { load: 'pending' })];
  assert.deepEqual(brokenImageCandidates(state('catalogue', facts({ images: covers }))), []);
  const broken = state('catalogue', facts({ images: [...covers, image('#cover-3', { load: 'failed' })] }));
  const found = brokenImageCandidates(broken);
  assert.equal(found.length, 1); assert.equal(found[0].detector, 'broken-image'); assert.equal(found[0].evidence.selector, '#cover-3');
  assert.equal(found[0].severity, 'medium'); assert.equal(found[0].confidence, 'medium');
  assert.equal(found[0].what, 'Image finished loading without a decoded size (naturalWidth 0): the source failed or is not an image; in catalogue, 2 of 3 assessed images loaded. The source URL is not stored; an environment cause is possible');
  assert.deepEqual(imageCoverage(broken), { loaded: 2, failed: 1, unassessed: { svg: 1, 'no-src': 1, pending: 1 } });
  const inert = state('catalogue', facts({ images: [...covers, image('#cover-3', { load: 'failed', inactive: true })] }));
  assert.deepEqual(brokenImageCandidates(inert), []);
  assert.deepEqual(imageCoverage(inert), { loaded: 2, failed: 0, unassessed: { svg: 1, 'no-src': 1, pending: 1 } }, 'inactive images are not counted');
  const sensors = state('sensors', facts({ images: [image('#photo-1', { load: 'loaded' }), image('#photo-2', { load: 'failed' })] }));
  assert.match(brokenImageCandidates(sensors)[0]?.what ?? '', /in sensors, 1 of 2 assessed images loaded/);
  const older = state('older', facts({ images: [image('#cover')] }));
  assert.deepEqual(brokenImageCandidates(older), []);
  assert.deepEqual(imageCoverage(older), { loaded: 0, failed: 0, unassessed: {} }, 'an image without a load fact is not assessed');
});

test('runDetectors: F2 rows stay candidates, are byte-identical across runs and report uncompared kinds, unassessed images and older captures', async () => {
  const withImages = (s, loads) => ({ ...s, facts: { ...s.facts, images: loads.map((load, i) => image(`#cover-${i}`, { load })) } });
  const states = [withImages(catalogue(1), ['loaded', 'svg']), withImages(catalogue(2), ['loaded', 'no-src']),
    withImages(catalogue(3, size('15px')), ['loaded', 'failed', 'pending'])];
  const list = runDetectors(states);
  assert.deepEqual(list.map((c) => c.detector).sort(), ['broken-image', 'property-outlier']);
  assert.ok(list.every((c) => c.states.length === 1 && !Object.hasOwn(c, 'verdict') && !Object.hasOwn(c, 'status')));
  assert.equal(JSON.stringify(runDetectors(states)), JSON.stringify(list));
  const md = toMarkdown(list, states);
  assert.match(md, /Cross-page properties: 1 repeated item or field kind\(s\) seen on at least 3 pages were compared; 0 seen on fewer pages were not compared\./);
  assert.match(md, /Image loading not assessed: 3 image\(s\) \(svg source 1, no source 1, not loaded at capture 1\)\. No candidate there is not a pass\./);
  assert.doesNotMatch(md, /image load facts not recorded/);
  assert.match(toMarkdown([], states.slice(0, 2)), /Cross-page properties: 0 .* were compared; 1 seen on fewer pages were not compared\./);
  assert.doesNotMatch(toMarkdown([], [withImages(catalogue(1), ['loaded', 'failed'])]), /Image loading not assessed/, 'no unassessed image, no line');
  const older = [state('no-images', facts()), state('no-load', facts({ images: [image('#logo')] })),
    state('no-kind', facts({ images: [], fields: [field('legacy', { containerW: 300 })] })), state('no-container', facts({ images: [], fields: [field('legacy', { sig: 'input' })] }))];
  assert.match(toMarkdown(list, [...states, ...older]),
    /Field kind, field container or image load facts not recorded in: no-images, no-load, no-kind, no-container \(older capture\); cross-page field properties and failed images are unassessed there\./);
  for (const file of ['../tools/passive-capture/style-detectors.mjs', '../tools/passive-capture/page-facts.mjs']) {
    assert.doesNotMatch(await readFile(new URL(file, import.meta.url), 'utf8'), /toolshop|practice software testing|localhost:\d+|127\.0\.0\.1:\d+/i, file);
  }
});

test('captureState refuses a missing page, dir or unsafe label before touching anything', async () => {
  const page = { evaluate: async () => { throw Error('must not be called'); } };
  await assert.rejects(captureState(null, { dir: '/tmp/x', label: 'a' }), /Playwright page/);
  await assert.rejects(captureState(page, { label: 'a' }), /output dir/);
  await assert.rejects(captureState(page, { dir: '/tmp/x', label: '../escape' }), /label must match/);
});

// A3 reached-route ledger and capture labels in two neutral domains: D-A library loans (file pages), D-B greenhouse sensor settings (https).
const LOANS = 'file:///library/loans.html';
const ZONES = 'https://greenhouse.test/zones';
const reach = (...urls) => urls.map((url) => ({ url, at: '2026-10-12T00:00:00.000Z' }));
const ROUTE_SCOPE = String.raw`Only routes a tracked page navigated to after tracking started are listed, and the ledger is complete only if stop\(\) was awaited; this is not a route inventory\.`;
const route = (label, url) => state(label, facts({ url }));
const withTempDir = async (prefix, fn) => {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  try { return await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
};
// Stands in for a Playwright page: go() is a main-frame navigation (full, pushState or hash), goChild() an iframe navigation.
const navigablePage = (start) => {
  const page = new EventEmitter(); const main = { url: () => page.current };
  return Object.assign(page, { current: start, mainFrame: () => main, url: () => page.current,
    go: (url) => { page.current = url; page.emit('framenavigated', main); }, goChild: (url) => page.emit('framenavigated', { url: () => url }) });
};
const ledgerLines = async (dir) => (await readFile(join(dir, 'passive', 'reached.jsonl'), 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line));

test('routeOf keeps scheme, host, path and fragment route; query values, credentials and fragment parameters are never kept; other schemes are not routes', () => {
  assert.equal(routeOf(`${LOANS}?patron=CANARY-Q#/patrons?card=CANARY-F`), `${LOANS}#/patrons`);
  assert.equal(routeOf('https://reader:CANARY-PW@greenhouse.test:8443/zones/north?sensor=CANARY-Q&unit=c#/thresholds'), 'https://greenhouse.test:8443/zones/north#/thresholds');
  assert.equal(routeOf(`${ZONES}#access_token=CANARY-T&token_type=bearer`), `${ZONES}#access_token`);
  assert.equal(routeOf(`${ZONES}#/zones&sensor=CANARY-F`), `${ZONES}#/zones`);
  assert.equal(routeOf(`${ZONES}?#`), ZONES, 'an empty query or fragment is no part of the route');
  assert.equal(routeOf(`${LOANS}#/returns`), `${LOANS}#/returns`);
  assert.equal(routeOf('HTTPS://GreenHouse.TEST/Zones'), 'https://greenhouse.test/Zones', 'the URL parser folds scheme and host case, not the path');
  for (const other of ['about:blank', 'data:text/html,CANARY-D', 'blob:https://greenhouse.test/0b7c', 'chrome-error://chromewebdata/', 'javascript:void(0)', 'not a url', '', undefined, null, 42, [ZONES]]) {
    assert.equal(routeOf(other), null, String(other));
  }
  for (const raw of [`${LOANS}?patron=1#/patrons?card=2`, `${ZONES}#a=b`]) assert.equal(routeOf(routeOf(raw)), routeOf(raw), 'normalising twice changes nothing');
});

test('trackReached records main-frame navigations as routes with their time; child frames, other schemes and anything after stop are not recorded', async () => {
  await withTempDir('passive-reached-', async (dir) => {
    const page = navigablePage('about:blank');
    const tracker = await trackReached(page, { dir });
    page.go(LOANS);
    page.go(`${LOANS}?patron=CANARY-Q#/patrons?card=CANARY-F`);
    page.goChild('file:///library/cover-preview.html');
    page.go(`${LOANS}?patron=CANARY-Q#/returns`);
    page.go('data:text/html,CANARY-D');
    page.go(`${LOANS}#/returns`);
    await tracker.stop();
    page.go(`${LOANS}#/after-stop`);
    const lines = await ledgerLines(dir);
    assert.deepEqual(lines.map((l) => l.url), [LOANS, `${LOANS}#/patrons`, `${LOANS}#/returns`, `${LOANS}#/returns`]);
    assert.ok(lines.every((l) => Object.keys(l).join() === 'url,at' && new Date(l.at).toISOString() === l.at), JSON.stringify(lines));
    assert.doesNotMatch(await readFile(join(dir, 'passive', 'reached.jsonl'), 'utf8'), /CANARY/);
    assert.equal(page.listenerCount('framenavigated'), 0, 'stop removes the listener');
    assert.deepEqual(await loadReached(dir), lines);
  });
  await withTempDir('passive-reached-', async (dir) => {
    await (await trackReached(navigablePage(`${ZONES}?sensor=CANARY-Q#/north`), { dir })).stop();
    assert.deepEqual((await ledgerLines(dir)).map((l) => l.url), [`${ZONES}#/north`], 'the route shown when tracking starts is reached');
    assert.equal(await loadReached(join(dir, 'never-tracked')), null, 'no ledger is unknown, not an empty ledger');
  });
  assert.doesNotMatch(await readFile(new URL('../tools/passive-capture/reached.mjs', import.meta.url), 'utf8'), /toolshop|practice software testing|localhost:\d+|127\.0\.0\.1:\d+/i);
});

test('trackReached refuses a missing page or dir, and stop surfaces a failed ledger write instead of dropping it', async () => {
  await assert.rejects(trackReached(null, { dir: '/nonexistent' }), /Playwright page/);
  await assert.rejects(trackReached({ evaluate: async () => {} }, { dir: '/nonexistent' }), /Playwright page/);
  await assert.rejects(trackReached({ on: () => {}, url: () => 'about:blank' }, { dir: '/nonexistent' }), /Playwright page/, 'no main frame');
  await assert.rejects(trackReached({ mainFrame: () => ({}), url: () => 'about:blank' }, { dir: '/nonexistent' }), /Playwright page/, 'no event listener');
  await assert.rejects(trackReached(navigablePage('about:blank'), {}), /output dir/);
  await assert.rejects(trackReached(navigablePage('about:blank'), { dir: '' }), /output dir/);
  await withTempDir('passive-reached-', async (dir) => {
    await mkdir(join(dir, 'passive', 'reached.jsonl'), { recursive: true });
    const tracker = await trackReached(navigablePage(ZONES), { dir });
    await assert.rejects(tracker.stop(), /EISDIR/);
    await assert.rejects(loadReached(dir), /EISDIR/, 'an unreadable ledger is an error, not an absent one');
  });
});

test('reached remainder: D-A with every reached route captured has no remainder line; D-B with one uncaptured route lists exactly it; no ledger is unknown', () => {
  const loans = [route('catalogue', LOANS), route('patrons', `${LOANS}?patron=7#/patrons?card=3`), route('returns', `${LOANS}#/returns`)];
  const healthy = reachedRemainder(reach(LOANS, `${LOANS}?patron=7#/patrons`, `${LOANS}#/returns`, `${LOANS}#/patrons`), loans);
  assert.deepEqual(healthy, { ledger: 'recorded', routes: 3, captured: 3, uncaptured: [] });
  const healthyMd = toMarkdown(runDetectors(loans), loans, { reached: healthy });
  assert.match(healthyMd, new RegExp(String.raw`^Reached routes: 3 distinct route\(s\) in reached\.jsonl, compared by scheme, host, path and fragment without query values; 3 have a captured state\. ${ROUTE_SCOPE}$`, 'm'));
  assert.doesNotMatch(healthyMd, /Reached, not captured|^- `/m);
  const sensors = [route('zones', ZONES), route('north', `${ZONES}#/zones/north`), route('list', 'https://greenhouse.test/sensors/list')];
  const broken = reachedRemainder(reach(ZONES, `${ZONES}#/zones/north`, `${ZONES}?sensor=CANARY-Q#/thresholds?unit=CANARY-F`, 'https://greenhouse.test/sensors/list'), sensors);
  assert.deepEqual(broken, { ledger: 'recorded', routes: 4, captured: 3, uncaptured: [`${ZONES}#/thresholds`] });
  const brokenMd = toMarkdown(runDetectors(sensors), sensors, { reached: broken });
  assert.match(brokenMd, new RegExp(String.raw`; 3 have a captured state\. ${ROUTE_SCOPE}\nReached, not captured, unassessed: 1 route\(s\)\. This is remainder, not a defect: no detector inspected them, and no candidate there is not a pass\.\n- ${'`'}https://greenhouse\.test/zones#/thresholds${'`'}\n\n`));
  assert.equal(brokenMd.match(/^- `/gm).length, 1);
  assert.doesNotMatch(brokenMd + JSON.stringify(broken), /CANARY/);
  assert.deepEqual(reachedRemainder(null, loans), { ledger: 'absent' });
  for (const md of [toMarkdown([], loans), toMarkdown([], loans, { reached: reachedRemainder(null, loans) })]) {
    assert.match(md, /^Reached routes: no reached\.jsonl ledger was recorded, so routes reached but not captured are unknown\.$/m);
    assert.doesNotMatch(md, /distinct route|Reached, not captured/);
  }
  assert.deepEqual(reachedRemainder([], loans), { ledger: 'recorded', routes: 0, captured: 0, uncaptured: [] });
  const mixed = reachedRemainder(reach(`${ZONES}#/zones/south`, `${LOANS}#/fines`, 'about:blank', `${ZONES}#/zones/south`), []);
  assert.deepEqual(mixed, { ledger: 'recorded', routes: 2, captured: 0, uncaptured: [`${LOANS}#/fines`, `${ZONES}#/zones/south`] }, 'deduplicated, code-point order, non-routes ignored');
});

test('duplicate labels in older evidence are reported with their capture count, compared ignoring case, never collapsed silently', () => {
  const index = [{ label: 'loans' }, { label: 'patrons' }, { label: 'loans' }, { label: 'Zones' }, { label: 'zones' }, { label: 'zones' }, { label: 'north' }];
  assert.deepEqual(duplicateLabels(index), [{ labels: ['loans'], captures: 2 }, { labels: ['Zones', 'zones'], captures: 3 }]);
  assert.deepEqual(duplicateLabels([{ label: 'loans' }, { label: 'patrons' }]), []);
  assert.deepEqual(duplicateLabels([{ label: 'zones' }, { label: 'Zones' }, { label: 'loans' }, { label: 'loans' }]),
    [{ labels: ['loans'], captures: 2 }, { labels: ['Zones', 'zones'], captures: 2 }], 'groups and spellings in code-point order, whatever the index order');
  const md = toMarkdown([], [route('loans', LOANS)], { duplicates: duplicateLabels(index) });
  assert.match(md, /^Labels captured more than once \(compared ignoring case\): loans ×2, Zones\/zones ×3\. Older evidence: a later capture may have overwritten an earlier one's files, so earlier states under these labels can be unassessed\.$/m);
  assert.doesNotMatch(toMarkdown([], [route('loans', LOANS)]), /captured more than once/);
});

const capturePage = (url, calls, during = async () => {}) => ({
  evaluate: async () => { calls.push('evaluate'); await during('evaluate'); return facts({ url }); },
  screenshot: async (options) => { calls.push(`screenshot ${JSON.stringify(options)}`); await during('screenshot'); return Buffer.from(`png of ${url}`); } });
const filesOf = async (dir) => Object.fromEntries(await Promise.all((await readdir(join(dir, 'passive'))).sort().map(async (f) => [f, await readFile(join(dir, 'passive', f), 'utf8')])));

test('captureState refuses a used label, also one differing only in case, before touching the page; nothing is overwritten', async () => {
  await withTempDir('passive-label-', async (dir) => {
    await captureState(capturePage(LOANS, []), { dir, label: 'loans' });
    const before = await filesOf(dir);
    assert.deepEqual(Object.keys(before), ['index.jsonl', 'loans.axe.json', 'loans.facts.json', 'loans.png']);
    const calls = [];
    for (const label of ['loans', 'LOANS', 'Loans']) {
      await assert.rejects(captureState(capturePage(`${LOANS}#/returns`, calls), { dir, label }),
        new RegExp(`^Error: label "${label}" is already used in .+ \\(compared ignoring case\\); captures are never overwritten, so give each state its own label$`));
    }
    assert.deepEqual(calls, [], 'refused before the page is touched');
    assert.deepEqual(await filesOf(dir), before);
    await writeFile(join(dir, 'passive', 'returns.png'), 'an earlier screenshot');
    await writeFile(join(dir, 'passive', 'Shelf.axe.json'), 'an earlier axe record');
    for (const label of ['Returns', 'shelf']) {
      await assert.rejects(captureState(capturePage(LOANS, calls), { dir, label }), new RegExp(`label "${label}" is already used`), 'one leftover file is enough, in any case');
    }
    await writeFile(join(dir, 'passive', 'index.jsonl'), `${JSON.stringify({ label: 'patrons' })}\n`, { flag: 'a' });
    await assert.rejects(captureState(capturePage(LOANS, calls), { dir, label: 'Patrons' }), /label "Patrons" is already used/, 'an index entry is enough');
    assert.deepEqual(calls, []);
    const entry = await captureState(capturePage(ZONES, calls), { dir, label: 'zones' });
    assert.equal(entry.label, 'zones'); assert.deepEqual(calls, ['evaluate', 'screenshot {"fullPage":true}'], 'facts first, then a full-page screenshot');
    assert.equal(await readFile(join(dir, 'passive', 'zones.png'), 'utf8'), `png of ${ZONES}`);
  });
});

test('captureState never overwrites a file that another capture wrote meanwhile under the same label', async () => {
  for (const [step, file] of [['evaluate', 'north.facts.json'], ['screenshot', 'north.png'], ['screenshot', 'north.axe.json']]) {
    await withTempDir('passive-label-', async (dir) => {
      const claim = async (now) => { if (now === step) await writeFile(join(dir, 'passive', file), 'other capture'); };
      await assert.rejects(captureState(capturePage(`${ZONES}#/zones/north`, [], claim), { dir, label: 'north' }), /EEXIST/, file);
      assert.equal(await readFile(join(dir, 'passive', file), 'utf8'), 'other capture', file);
      assert.doesNotMatch(await readFile(join(dir, 'passive', 'index.jsonl'), 'utf8').catch(() => ''), /north/, file);
    });
  }
});

const DETECT = fileURLToPath(new URL('../tools/passive-capture/detect.mjs', import.meta.url));
const runDetect = async (dir) => {
  const run = spawnSync(process.execPath, [DETECT, dir], { encoding: 'utf8' }); assert.equal(run.status, 0, run.stderr);
  const read = (f) => readFile(join(dir, 'passive', f), 'utf8');
  return { stdout: JSON.parse(run.stdout), json: await read('candidates.json'), md: await read('candidates.md') };
};
const writeEvidence = async (dir, captures, ledger) => {
  await mkdir(join(dir, 'passive'), { recursive: true });
  for (const [label, url] of captures) {
    await writeFile(join(dir, 'passive', `${label}.facts.json`), JSON.stringify(facts({ url, controls: [button('icon', { name: { text: '', source: 'none' } })] })));
    await writeFile(join(dir, 'passive', `${label}.axe.json`), JSON.stringify({ available: false, reason: 'no axe source passed by the caller' }));
  }
  await writeFile(join(dir, 'passive', 'index.jsonl'), captures.map(([label, url]) => `${JSON.stringify({ label, url })}\n`).join(''));
  if (ledger) await writeFile(join(dir, 'passive', 'reached.jsonl'), ledger.map((e) => `${JSON.stringify(e)}\n`).join(''));
};

test('detect.mjs writes the reached remainder and duplicate labels beside the candidates, never as candidates, byte-identical across runs', async () => {
  await withTempDir('passive-detect-', async (dir) => {
    await writeEvidence(dir, [['zones', ZONES], ['north', `${ZONES}#/zones/north`], ['north', `${ZONES}#/zones/north`]],
      reach(ZONES, `${ZONES}#/zones/north`, `${ZONES}?sensor=CANARY-Q#/thresholds`));
    const first = await runDetect(dir); const second = await runDetect(dir);
    assert.equal(second.json, first.json); assert.equal(second.md, first.md);
    const json = JSON.parse(first.json);
    assert.deepEqual(json.reached, { ledger: 'recorded', routes: 3, captured: 2, uncaptured: [`${ZONES}#/thresholds`] });
    assert.deepEqual(json.duplicateLabels, [{ labels: ['north'], captures: 2 }]);
    assert.ok(json.count === json.candidates.length && json.candidates.every((c) => !JSON.stringify(c).includes('thresholds')), 'the remainder is not a candidate');
    assert.deepEqual([first.stdout.states, first.stdout.candidates, first.stdout.reachedNotCaptured, first.stdout.duplicateLabels], [2, json.count, 1, 1]);
    assert.match(first.md, /^- `https:\/\/greenhouse\.test\/zones#\/thresholds`$/m);
    assert.match(first.md, /^Labels captured more than once \(compared ignoring case\): north ×2\./m);
    assert.doesNotMatch(first.json + first.md, /CANARY/);
  });
  await withTempDir('passive-detect-', async (dir) => {
    await writeEvidence(dir, [['catalogue', LOANS], ['returns', `${LOANS}#/returns`]], null);
    const { json, md, stdout } = await runDetect(dir);
    assert.deepEqual([JSON.parse(json).reached, JSON.parse(json).duplicateLabels], [{ ledger: 'absent' }, []]);
    assert.equal(stdout.reachedNotCaptured, 'unknown (no reached.jsonl)');
    assert.match(md, /no reached\.jsonl ledger was recorded/);
  });
});

test('a malformed ledger or index line is an error, never skipped', async () => {
  await withTempDir('passive-malformed-', async (dir) => {
    await writeEvidence(dir, [['zones', ZONES]], null);
    await writeFile(join(dir, 'passive', 'reached.jsonl'), `${JSON.stringify(reach(ZONES)[0])}\n{"url":"${ZONES}#/zones/north"\n`);
    await assert.rejects(loadReached(dir), SyntaxError);
    await writeFile(join(dir, 'passive', 'index.jsonl'), '{"label":"north"\n', { flag: 'a' });
    await assert.rejects(loadStates(dir), SyntaxError);
    const calls = [];
    await assert.rejects(captureState(capturePage(ZONES, calls), { dir, label: 'south' }), SyntaxError);
    assert.deepEqual(calls, [], 'refused before the page is touched');
    assert.notEqual(spawnSync(process.execPath, [DETECT, dir], { encoding: 'utf8' }).status, 0, 'detect.mjs stops instead of reporting fewer states');
  });
});

// Precision round: false-positive classes from real-page triage, each with a failing control in a neutral domain first.
// D-A library loans and branches, D-B greenhouse sensors.
const bare = (text, sel, over = {}) => el(text, { sel, tag: sel.split(' > ').at(-1).replace(/[:.].*$/, ''), sig: `${sel.split(' > ').at(-1).replace(/[:.].*$/, '')}.`, parentSig: 'div.', ...over });

test('style key: a key with no class left joins only true siblings; different parents with bare tags are not look-alikes', () => {
  const notes = Array.from({ length: 6 }, (_, i) => bare(`Branch note ${i}`, `main > section:nth-of-type(${i + 1}) > div > p`, i === 5 ? size('19px') : {}));
  assert.deepEqual(styleOutliers(state('branch', facts({ elements: notes }))), [], 'six paragraphs of six sections are six roles, not one group');
  const hours = Array.from({ length: 6 }, (_, i) => bare(`Hours ${i}`, `main > ol > li:nth-of-type(${i + 1})`, { parentSig: 'ol.', ...(i === 5 ? size('19px') : {}) }));
  assert.deepEqual(styleOutliers(state('branch', facts({ elements: hours }))).map((c) => c.what), ['Look-alike elements differ in fontSize: "Hours 5" has 19px, most of 6 siblings have 16px']);
  const shelves = Array.from({ length: 6 }, (_, i) => el(`Shelf ${i}`, { sel: `#shelf-${i} > h5`, sig: 'h5.', parentSig: 'div.shelf', ...(i === 5 ? size('19px') : {}) }));
  assert.equal(styleOutliers(state('branch', facts({ elements: shelves }))).length, 1, 'a classed parent still makes a kind');
  const anchored = Array.from({ length: 6 }, (_, i) => bare(`Desk ${i}`, `#desk-${i}`, { tag: 'p', sig: 'p.', ...(i === 5 ? size('19px') : {}) }));
  assert.deepEqual(styleOutliers(state('branch', facts({ elements: anchored }))), [], 'an element anchored at its own id has no parent path and no look-alikes');
  const headings = (n, path, over = {}) => state(`site-${n}`, facts({ url: `http://app.test/site-${n}`,
    elements: [0, 1].map((i) => bare(`Heading ${n}${i}`, `${path} > h3:nth-of-type(${i + 1})`, over)) }));
  assert.deepEqual(crossStateProperties([headings(1, 'main > div'), headings(2, 'body > section > div'), headings(3, 'footer > div', { style: { fontWeight: '600' } })]), [],
    'bare headings at different places of different pages are not one kind across pages');
  assert.equal(crossStateProperties([headings(1, 'main > div'), headings(2, 'main > div'), headings(3, 'main > div', size('15px'))]).length, 1, 'the same place on three pages is');
});

test('style alignment: text-align of inline-level boxes is not compared; block boxes and captures without display still are', () => {
  const badges = (display) => Array.from({ length: 6 }, (_, i) => el(`Desk ${i}`, { tag: 'span', sig: 'span.badge', parentSig: 'div.panel',
    style: { textAlign: i === 5 ? 'left' : 'center', ...(display ? { display } : {}) } }));
  for (const display of ['inline', 'inline-block', 'inline-flex']) assert.deepEqual(styleOutliers(state('branch', facts({ elements: badges(display) }))), [], display);
  assert.equal(styleOutliers(state('branch', facts({ elements: badges('block') }))).length, 1, 'a block box aligns its own text');
  assert.equal(styleOutliers(state('branch', facts({ elements: badges(undefined) }))).length, 1, 'an older capture without display is compared as before');
  const page = (n, align, display) => state(`p${n}`, facts({ url: `http://app.test/p${n}`, elements: titles(align, 3).map((e) => ({ ...e, style: { ...e.style, display } })) }));
  assert.deepEqual(crossStateAlignment([page(1, 'left', 'inline-flex'), page(2, 'left', 'inline-flex'), page(3, 'center', 'inline-flex')]), []);
  assert.equal(crossStateAlignment([page(1, 'left', 'block'), page(2, 'left', 'block'), page(3, 'center', 'block')]).length, 1);
});

test('style clusters: an odd value shared by three or more look-alikes, long ones included, is a second variant; one or two odd items are candidates', () => {
  const steps = (n) => Array.from({ length: 9 }, (_, i) => el(`Step ${i}`, { sig: 'h4.step-title', parentSig: 'div.step', ...size(i < n ? '20px' : '18px') }));
  assert.deepEqual(styleOutliers(state('sensors', facts({ elements: steps(3) }))), [], 'three of nine at 20px');
  assert.equal(styleOutliers(state('sensors', facts({ elements: steps(2) }))).length, 2, 'two of nine at 20px');
  const blurb = (text, fontSize) => el(text, { sig: 'p.blurb', parentSig: 'div.note-card', ...size(fontSize) });
  const short = Array.from({ length: 6 }, (_, i) => blurb(`Probe ${i} calibrated`, '14px'));
  const long = (n, fontSize) => Array.from({ length: n }, (_, i) => blurb(`Probe ${i} reads soil moisture every ten minutes and logs it for the weekly summary`, fontSize));
  assert.deepEqual(styleOutliers(state('sensors', facts({ elements: [...short, blurb('Probe 9 calibrated', '15px'), ...long(2, '15px')] }))), [],
    'two long siblings share the odd size: it is a cluster even though long text is not itself compared');
  assert.match(styleOutliers(state('sensors', facts({ elements: [...short, blurb('Probe 9 calibrated', '15px'), ...long(2, '14px')] })))[0]?.what ?? '', /"Probe 9 calibrated" has 15px/);
  assert.deepEqual(styleOutliers(state('sensors', facts({ elements: [...short, blurb('Probe 9 calibrated', '15px'), ...long(1, '15px')] }))).length, 1, 'one long sibling is not a cluster');
});

test('style variants: an item that differs in two or more of alignment, family, size, weight and colour is a designed variant; a single drift is a candidate', () => {
  const fees = (odd) => [...Array.from({ length: 5 }, (_, i) => el(`Fee ${i}`, { sig: 'div.cell', parentSig: 'div.row' })), el('Total', { sig: 'div.cell', parentSig: 'div.row', style: odd })];
  assert.deepEqual(styleOutliers(state('loans', facts({ elements: fees({ fontSize: '18px', fontFamily: 'Georgia, serif' }) }))), [], 'family and size');
  assert.deepEqual(styleOutliers(state('loans', facts({ elements: fees({ fontSize: '18px', color: 'rgb(255, 255, 255)' }) }))), [], 'colour and size');
  assert.deepEqual(styleOutliers(state('loans', facts({ elements: fees({ fontSize: '18px', fontWeight: '700' }) }))), [], 'weight and size');
  assert.deepEqual(styleOutliers(state('loans', facts({ elements: fees({ textAlign: 'right', fontFamily: 'Georgia, serif' }) }))), [], 'alignment and family');
  assert.deepEqual(styleOutliers(state('loans', facts({ elements: fees({ fontSize: '18px' }) }))).map((c) => c.what), ['Look-alike elements differ in fontSize: "Total" has 18px, most of 6 siblings have 16px']);
  assert.equal(styleOutliers(state('loans', facts({ elements: fees({ textAlign: 'right', display: 'inline-block', fontSize: '18px' }) }))).length, 1,
    'the alignment of an inline box is no difference');
});

test('style and cross-page: an element not rendered at capture (an ancestor has opacity 0) is not compared; a faded one still is', () => {
  const labels = (over) => [...Array.from({ length: 5 }, (_, i) => el(`Scanned ${i}`, { sig: 'span.s-label', parentSig: 'div.state' })),
    el('Refused', { sig: 'span.s-label', parentSig: 'div.state', ...size('13px'), ...over })];
  assert.deepEqual(styleOutliers(state('loans', facts({ elements: labels({ opacity: 0 }) }))), [], 'a stacked state layer that is hidden');
  assert.equal(styleOutliers(state('loans', facts({ elements: labels({ opacity: 0.5 }) }))).length, 1, 'half transparent is rendered');
  const hidden = (n) => catalogue(n, { ...size('15px'), opacity: 0 });
  assert.deepEqual(crossStateProperties([catalogue(1), catalogue(2), hidden(3)]), [], 'a page whose items are all hidden has no value');
  const centred = state('p3', facts({ url: 'http://app.test/p3', elements: titles('center', 3).map((e) => ({ ...e, opacity: 0 })) }));
  const left = (n) => state(`p${n}`, facts({ url: `http://app.test/p${n}`, elements: titles('left', 3) }));
  assert.deepEqual(crossStateAlignment([left(1), left(2), centred]), []);
});

test('cross-page detectors compare captures of one viewport width with each other; desktop and mobile captures of one URL are both compared', () => {
  const at = (n, w, fontSize) => state(`catalogue-${n}-${w}`, facts({ url: `http://app.test/catalogue/${n}`, viewport: { w, h: 800 },
    elements: Array.from({ length: 3 }, (_, i) => el(`Title ${n}${i}`, { sig: 'span.book-title', parentSig: 'li.book', ...size(fontSize) })) }));
  const states = [at(1, 1440, '16px'), at(2, 1440, '16px'), at(3, 1440, '15px'), at(1, 375, '14px'), at(2, 375, '14px'), at(3, 375, '14px')];
  const rows = runDetectors(states).filter((c) => c.detector === 'property-outlier');
  assert.deepEqual(rows.map((c) => `${c.states.join(',')}: ${c.what.split(' here;')[0]}`), ['catalogue-3-1440: Repeated items "Title 30" have fontSize 15px']);
  const mixed = runDetectors([...states.slice(0, 3), at(4, 375, '14px')]).filter((c) => c.detector === 'property-outlier');
  assert.equal(mixed.length, 1, 'a mobile capture does not vote with desktop pages');
  assert.match(toMarkdown([], states), /Cross-page properties: 2 repeated item or field kind\(s\) seen on at least 3 pages were compared/, 'coverage counts each width');
  const both = runDetectors([...states.slice(0, 3), at(1, 375, '14px'), at(2, 375, '14px'), at(3, 375, '13px')]).filter((c) => c.detector === 'property-outlier');
  assert.deepEqual(both.map((c) => `${c.states.join(',')}: ${c.what.split(' here;')[0]}`), ['catalogue-3-1440: Repeated items "Title 30" have fontSize 15px',
    'catalogue-3-375: Repeated items "Title 30" have fontSize 13px'], 'one URL odd at both widths is one row per width');
});

test('contrast: text over an image or gradient layer that is not its ancestor is not assessed and is counted', () => {
  const caption = el('North bench camera', { style: { color: 'rgb(255, 255, 255)' }, bg: { kind: 'layer' } });
  const s = state('sensors', facts({ elements: [caption, el('Seed tray readings')] }));
  assert.deepEqual(computedContrast(s), []);
  assert.deepEqual(contrastCoverage(s), { mode: 'computed', assessed: 1, unassessed: { layer: 1 } });
  assert.match(toMarkdown([], [s]), /Contrast not assessed: 1 element\(s\) \(image or gradient layer under the text 1\)/);
});

test('contrast: ancestor opacity fades the text; opacity 0 is a low-confidence row noted as not rendered; a faded background is not assessed', () => {
  const run = (over) => computedContrast(state('loans', facts({ elements: [el('Archived loan notes', over)] })));
  assert.deepEqual(run({ style: { color: 'rgb(85, 85, 85)' } }), [], '7.5:1 alone');
  const faded = run({ style: { color: 'rgb(85, 85, 85)' }, opacity: 0.4 });
  assert.equal(faded.length, 1);
  assert.equal(faded[0].what, 'Text "Archived loan notes" has contrast 1.92:1 (rgb(85, 85, 85) at opacity 0.4 on rgb(255, 255, 255)), needs 4.5:1');
  const pair = state('loans', facts({ elements: [el('Overdue', { style: { color: 'rgb(150, 150, 150)' } }), el('Overdue soon', { style: { color: 'rgb(150, 150, 150)' }, opacity: 0.5 })] }));
  const rowsOf = runDetectors([pair]).filter((c) => c.detector === 'contrast').map((c) => c.what);
  assert.equal(rowsOf.length, 2, 'a faded pair is its own row, not merged with the same colours unfaded');
  assert.match(rowsOf[0], /^Text "Overdue" has contrast 2\.96:1 \(rgb\(150, 150, 150\) on/); assert.match(rowsOf[1], /^Text "Overdue soon" .* at opacity 0\.5 on/);
  const hidden = run({ style: { color: 'rgb(138, 138, 138)' }, opacity: 0 });
  assert.equal(hidden.length, 1); assert.equal(hidden[0].confidence, 'low');
  assert.equal(hidden[0].what, 'Text "Archived loan notes" has contrast 3.45:1 (rgb(138, 138, 138) on rgb(255, 255, 255)), needs 4.5:1; not rendered at capture '
    + '(an ancestor has opacity 0), so the screenshot does not show it: the pair applies once it is shown');
  const fadedBg = state('loans', facts({ elements: [el('Renewals', { style: { color: 'rgb(153, 153, 153)' }, opacity: 0.5, bg: { kind: 'solid', color: 'rgb(255, 255, 255)', opacity: 0.5 } })] }));
  assert.deepEqual(computedContrast(fadedBg), []);
  assert.deepEqual(contrastCoverage(fadedBg).unassessed, { translucent: 1 });
  const revealBg = state('loans', facts({ elements: [el('Renewals', { style: { color: 'rgb(138, 138, 138)' }, opacity: 0, bg: { kind: 'solid', color: 'rgb(255, 255, 255)', opacity: 0 } })] }));
  assert.equal(computedContrast(revealBg)[0]?.confidence, 'low', 'a hidden reveal card with its own background is still compared as authored');
});

test('contrast: a separator glyph between text runs is decoration and not assessed; the whole name of a control or content of a cell, a unit or a lone glyph is', () => {
  const grey = { style: { color: 'rgb(200, 200, 200)' } };
  const run = (text, glyph, over = {}) => computedContrast(state('loans', facts({ elements: [el(text, { ...grey, ...(glyph ? { glyph } : {}), ...over })] }))).length;
  for (const t of ['·', '•', '/', '|', '–', '—', '×', '✕']) assert.equal(run(t, { peers: true, whole: false }), 0, t);
  assert.equal(run('✕', { peers: true, whole: true }), 1, 'the whole visible name of a close button');
  assert.equal(run('–', { peers: false, whole: true }, { tag: 'td' }), 1, 'the whole content of a table cell');
  assert.equal(run('→', { peers: false, whole: false }), 1, 'a glyph with no text beside it');
  assert.equal(run('·', { peers: false, whole: false }), 1);
  assert.equal(run('%', { peers: true, whole: false }), 1, 'a unit is not a separator');
  assert.equal(run('$', { peers: true, whole: false }), 1, 'nor a currency sign');
  assert.equal(run('·', undefined), 1, 'an older capture without glyph facts is assessed as before');
  const s = state('loans', facts({ elements: [el('·', { ...grey, glyph: { peers: true, whole: false } })] }));
  assert.deepEqual(contrastCoverage(s).unassessed, { decorative_glyph: 1 });
  assert.match(toMarkdown([], [s]), /Contrast not assessed: 1 element\(s\) \(separator glyph between text 1\)/);
});

test('contrast rows: a repeated copy of the same text adds no evidence; the headline is the rendered, on-screen, most word-like evidence', () => {
  const grey = (text, over = {}) => el(text, { style: { color: 'rgb(150, 150, 150)' }, ...over, sel: `#${text.replace(/\W/g, '')}${over.n ?? ''}` });
  const ticker = state('sensors', facts({ viewport: { w: 1440, h: 900 }, elements: [grey('Soil moisture', { n: 1 }), grey('Soil moisture', { n: 2, rect: { x: 1600, y: 0, w: 100, h: 20 } })] }));
  assert.equal(computedContrast(ticker).length, 1, 'a loop clone with the same text and pair is one evidence');
  const mock = state('loans', facts({ viewport: { w: 1440, h: 900 }, elements: [grey('LOCKER'), grey('Your card number is only used to find your loans', { rect: { x: 2000, y: 0, w: 300, h: 20 } }),
    grey('We never share loan history with anyone else'), grey('Due dates move when the branch is closed', { opacity: 0 })] }));
  const [row] = runDetectors([mock]).filter((c) => c.detector === 'contrast');
  assert.match(row.what, /^Text "We never share loan history with anyone else"/);
  assert.deepEqual(row.evidence.map((e) => e.selector), ['#Wenevershareloanhistorywithanyoneelse', '#LOCKER', '#Yourcardnumberisonlyusedtofindyourloans'],
    'rendered evidence stays separate; on-screen before off-screen, then more letters');
  const hiddenRow = runDetectors([mock]).find((r) => r.what.includes('not rendered at capture'));
  assert.deepEqual(hiddenRow.evidence.map((e) => e.selector), ['#Duedatesmovewhenthebranchisclosed']);
  assert.equal(hiddenRow.confidence, 'low');
  assert.equal(row.confidence, 'medium');
  const allHidden = runDetectors([state('loans', facts({ elements: [grey('Overdue', { opacity: 0 })] }))]).find((c) => c.detector === 'contrast');
  assert.equal(allHidden.confidence, 'low');
});

test('geometry and padding: a field whose box lies outside the page (a honeypot parked off-screen) is not part of the input column', () => {
  const form = (n, extra = []) => state(`renew-${n}`, facts({ url: `http://app.test/renew-${n}`, formCount: 1,
    fields: [field(`card${n}`), field(`branch${n}`, { rect: { x: 100, y: 50, w: 300, h: 38 } }), ...extra], controls: [button(`renew${n}`)] }));
  const trap = (n) => field(`website${n}`, { rect: { x: -9999, y: 60, w: 300, h: 38 }, style: { paddingLeft: '2px' } });
  assert.deepEqual(primaryActionGeometry([form(1), form(2), form(3), form(4, [trap(4)])]), []);
  assert.deepEqual(inputPaddingOutliers([form(1), form(2), form(3, [trap(3)])]), []);
  assert.equal(primaryActionGeometry([form(1), form(2), form(3), form(4, [field('wide4', { rect: { x: -60, y: 60, w: 300, h: 38 } })])]).length, 1, 'a field partly inside the page is kept');
});

test('focus-order: a fixed or sticky layer has no place in the document order, so a floating button after the footer is not displaced; inside one layer order is compared', () => {
  const footer = focusable('#top-link', { tag: 'a', ...at(1100, 3000, 120, 20) });
  const fab = (position) => focusable('#ask', { ...at(1100, 740, 160, 44), ...(position ? { pinned: { position, root: '#ask' } } : {}) });
  assert.equal(focusOrderCandidates(state('loans', facts({ focusables: [footer, fab(null)] }))).length, 1, 'control: a static element above is displaced');
  assert.deepEqual(focusOrderCandidates(state('loans', facts({ focusables: [footer, fab('fixed')] }))), []);
  assert.deepEqual(focusOrderCandidates(state('loans', facts({ focusables: [footer, fab('sticky')] }))), []);
  const dialog = (sel, x) => focusable(sel, { ...at(x, 300), pinned: { position: 'fixed', root: 'dialog.renew' } });
  assert.equal(focusOrderCandidates(state('loans', facts({ focusables: [dialog('#renew', 300), dialog('#cancel', 100)] }))).length, 1, 'a reversed row inside one fixed dialog');
  const late = focusable('#late', at(0, 2000));
  assert.match(focusOrderCandidates(state('loans', facts({ focusables: [focusable('#first', at(0, 2400)), fab('fixed'), late] })))[0]?.what ?? '', /#first in the DOM but is displayed above it/,
    'a pinned element between two document elements does not hide their order');
});

test('detect.mjs --dictionary FILE assesses rare words; without it the json, report and summary say rare-variant is unassessed', async () => {
  await withTempDir('passive-dictionary-cli-', async (dir) => {
    await mkdir(join(dir, 'passive'), { recursive: true });
    const words = ['Return', 'Return', 'Return', 'Retrun'].map((t, i) => el(t, { sel: `#loan-${i}` }));
    await writeFile(join(dir, 'passive', 'loans.facts.json'), JSON.stringify(facts({ url: LOANS, elements: words })));
    await writeFile(join(dir, 'passive', 'loans.axe.json'), JSON.stringify({ available: false, reason: 'no axe source passed by the caller' }));
    await writeFile(join(dir, 'passive', 'index.jsonl'), `${JSON.stringify({ label: 'loans', url: LOANS })}\n`);
    await writeFile(join(dir, 'words.txt'), 'return\nloan\n');
    const plain = await runDetect(dir);
    assert.deepEqual(JSON.parse(plain.json).rareVariant, { assessed: false, reason: 'no dictionary supplied' });
    assert.equal(plain.stdout.rareVariant, 'unassessed (no dictionary supplied)');
    assert.match(plain.md, /^rare-variant: unassessed \(no dictionary supplied\)/m);
    const withWords = () => spawnSync(process.execPath, [DETECT, dir, '--dictionary', join(dir, 'words.txt')], { encoding: 'utf8' });
    const first = withWords(); assert.equal(first.status, 0, first.stderr);
    const json = await readFile(join(dir, 'passive', 'candidates.json'), 'utf8');
    assert.deepEqual(JSON.parse(json).rareVariant, { assessed: true, dictionaryWords: 2, capturedWords: 2, knownWords: 1, knownShare: 0.5 });
    assert.deepEqual(JSON.parse(json).candidates.filter((c) => c.detector === 'rare-variant').map((c) => c.what.slice(0, 26)), ['Word "retrun" occurs once ']);
    assert.equal(JSON.parse(first.stdout).rareVariant, 'assessed (2 dictionary words; knows 1 of 2 captured words)');
    assert.equal(withWords().status, 0); assert.equal(await readFile(join(dir, 'passive', 'candidates.json'), 'utf8'), json, 'byte-identical across runs');
    assert.equal(spawnSync(process.execPath, [DETECT, dir, '--dictionary'], { encoding: 'utf8' }).status, 2, 'a flag without a file is a usage error');
    assert.equal(spawnSync(process.execPath, [DETECT, dir, '--words', 'x'], { encoding: 'utf8' }).status, 2, 'an unknown option is a usage error');
    const missing = spawnSync(process.execPath, [DETECT, dir, '--dictionary', join(dir, 'missing.txt')], { encoding: 'utf8' });
    assert.notEqual(missing.status, 0); assert.match(missing.stderr, /ENOENT/);
  });
});

test('design-system fingerprint: forms whose primary action uses another type family, and kinds with a different family on every page, are not compared with each other', () => {
  const form = (n, family, rect = { x: 100, y: 200, w: 300, h: 38 }) => state(`apply-${n}`, facts({ url: `http://app.test/apply-${n}`, formCount: 1,
    fields: [field(`a${n}`), field(`b${n}`, { rect: { x: 100, y: 50, w: 300, h: 38 } })], controls: [button(`go${n}`, { rect, style: { ...STYLE, fontFamily: family } })] }));
  const narrow = { x: 300, y: 200, w: 100, h: 38 };
  assert.equal(primaryActionGeometry([form(1, 'Inter'), form(2, 'Inter'), form(3, 'Inter'), form(4, 'Inter', narrow)]).length, 1, 'control: one family, one narrow form');
  assert.deepEqual(primaryActionGeometry([form(1, 'Inter'), form(2, 'Inter'), form(3, 'Inter'), form(4, 'Trebuchet MS', narrow)]), [],
    'a form of another design system is not held to these forms');
  assert.match(primaryActionGeometry([form(1, 'Inter'), form(2, 'Inter'), form(3, 'Trebuchet MS'), form(4, 'Inter', narrow)])[0]?.what ?? '', /across 3 forms most are full/,
    'the forms of one family are compared among themselves');
  const shelf = (n, family, over = {}) => catalogue(n, { style: { fontFamily: family, ...over } });
  assert.deepEqual(crossStateProperties([shelf(1, 'Inter'), shelf(2, 'Verdana'), shelf(3, 'Courier New', { fontWeight: '600' })]), [], 'three families on three pages: three design systems');
  assert.deepEqual(crossStateCoverage([shelf(1, 'Inter'), shelf(2, 'Verdana'), shelf(3, 'Courier New')]),
    { minStates: 3, compared: 0, notComparable: 0, notCompared: 0, propertiesNotCompared: 0, differentFamilies: 1 });
  assert.deepEqual(crossStateProperties([shelf(1, 'Inter'), shelf(2, 'Inter'), shelf(3, 'Verdana', { fontWeight: '600' })]).map((c) => c.what.split(' here;')[0]).sort(),
    ['Repeated items "Title 30" have fontFamily Verdana', 'Repeated items "Title 30" have fontWeight 600'], 'two pages sharing a family make a design system');
  assert.match(toMarkdown([], [shelf(1, 'Inter'), shelf(2, 'Verdana'), shelf(3, 'Courier New')]),
    /^Not compared across type families: 1 kind\(s\) seen on at least 3 pages use a different font family on every page \(likely different design systems or products\); capture one product per evidence dir\. No candidate there is not a pass\.$/m);
  assert.doesNotMatch(toMarkdown([], [catalogue(1), catalogue(2), catalogue(3)]), /across type families/);
});

// F3 input-partition worklist in two neutral domains: D-A library patron forms, D-B greenhouse sensor settings. Planned checks derived
// from declared field attributes only: never candidates, never executed (P01 never types).
const STATUS = { authority: 'requires write authority', status: 'not executed' };
const declared = (name, type, constraints, over = {}) => field(name, { type, textLike: !['file', 'checkbox', 'radio', 'range'].includes(type), constraints, ...over });
const formState = (label, fields, over = {}) => state(label, facts({ url: `http://app.test/${label}`, formCount: 1, fields, ...over }));
const planned = (w) => w.rows.map((r) => [r.name, r.partition, r.probe]);
const EMPTY = { kind: 'empty' };
const len = (length) => ({ kind: 'length', length });
const val = (value) => ({ kind: 'value', value });
const fileProbe = (name) => ({ kind: 'file', name });
const MALFORMED_EMAIL = val('missing-at-sign.example');
const REGISTER = [declared('fullName', 'text', { required: true, maxlength: 40, autocomplete: 'name' }), declared('email', 'email', { required: true, autocomplete: 'email' }),
  declared('notes', 'textarea', {}, { tag: 'textarea' })];
const ADD_SENSOR = [declared('sensorName', 'text', {}), declared('threshold', 'number', { min: '0', max: '50', step: '0.5' }), declared('calibration', 'file', { accept: '.csv' })];

test('partitions: D-A "register patron" (maxlength=40, type=email, required) gives exactly empty, length 40 and 41, and malformed rows; a field with no constraint gives none', () => {
  const w = partitionWorklist([formState('register', REGISTER)]);
  assert.deepEqual(planned(w), [['fullName', 'empty', EMPTY], ['fullName', 'length-at-max', len(40)], ['fullName', 'length-over-max', len(41)],
    ['email', 'empty', EMPTY], ['email', 'type-malformed', MALFORMED_EMAIL]]);
  assert.deepEqual(w.rows[1], { id: 'W002', states: ['register'], form: 0, sel: '#fullName', name: 'fullName', type: 'text', attribute: 'maxlength', declared: 40,
    partition: 'length-at-max', probe: len(40), expectation: 'satisfies this declared bound only; other constraints and business rules not evaluated', basis: 'declared maxlength=40', ...STATUS });
  assert.deepEqual(w.rows.map((r) => r.basis), ['declared required', 'declared maxlength=40', 'declared maxlength=40', 'declared required', 'declared type=email']);
  assert.ok(w.rows.every((r) => r.authority === 'requires write authority' && r.status === 'not executed' && !Object.hasOwn(r, 'verdict') && !Object.hasOwn(r, 'detector')));
  assert.deepEqual([w.count, w.coverage.fields, w.coverage.withoutRow], [5, 3, 1]);
  assert.deepEqual(partitionWorklist([formState('notes', [REGISTER[2], declared('nickname', 'text', {}), declared('phone', 'tel', {})])]).rows, [], 'no declared constraint, no row');
});

test('partitions: D-B "add sensor" (min=0 max=50 step=0.5, accept=.csv) gives 0, -0.5, 50, 50.5, the off-step 0.25 and one file inside and one outside', () => {
  const w = partitionWorklist([formState('add-sensor', ADD_SENSOR)]);
  assert.deepEqual(planned(w), [['threshold', 'at-min', val('0')], ['threshold', 'below-min', val('-0.5')], ['threshold', 'at-max', val('50')], ['threshold', 'above-max', val('50.5')],
    ['threshold', 'off-step', val('0.25')], ['calibration', 'accept-inside', fileProbe('probe.csv')], ['calibration', 'accept-outside', fileProbe('probe.bin')]]);
  assert.deepEqual(w.rows.map((r) => r.basis), ['declared min=0', 'declared min=0, one declared step (0.5) below', 'declared max=50', 'declared max=50, one declared step (0.5) above',
    'declared step=0.5 from min=0, between two allowed values', 'declared accept=.csv', 'declared accept=.csv']);
  assert.deepEqual(w.rows.map((r) => [r.attribute, r.declared]), [['min', '0'], ['min', '0'], ['max', '50'], ['max', '50'], ['step', '0.5'], ['accept', '.csv'], ['accept', '.csv']]);
  assert.deepEqual([w.coverage.fields, w.coverage.withoutRow, w.coverage.probeNotDerived], [3, 1, 0]);
  const steps = partitionWorklist([formState('steps', [declared('dose', 'number', { min: '0.1', max: '0.7', step: '0.2' })])]);
  assert.deepEqual(planned(steps).map(([, p, probe]) => [p, probe.value]), [['at-min', '0.1'], ['below-min', '-0.1'], ['at-max', '0.7'], ['above-max', '0.9'], ['off-step', '0.2']],
    'decimal steps are formatted without floating-point noise');
});

test('partitions never invent a limit: hints, attributes the type ignores and invalid values give no row and are counted; an undeclared step is the spec default and gives no off-step', () => {
  const fields = [declared('phone', 'tel', { inputmode: 'numeric', autocomplete: 'tel' }), declared('copies', 'number', { maxlength: 3 }), declared('shelf', 'text', { min: '1', max: '9', step: '1' }),
    declared('fine', 'number', { min: 'abc', max: ' 5' }), declared('code', 'number', { pattern: '[0-9]+' }), declared('level', 'range', { required: true }),
    declared('scan', 'text', { accept: '.csv' }), declared('due', 'date', { min: '2026-02-30' })];
  const w = partitionWorklist([formState('desk', fields)]);
  assert.deepEqual(w.rows, []);
  assert.deepEqual(w.coverage.ignoredByType, { 'maxlength on number': 1, 'min on text': 1, 'max on text': 1, 'step on text': 1, 'pattern on number': 1, 'required on range': 1, 'accept on text': 1 });
  assert.deepEqual(w.coverage.invalid, { 'min on number': 1, 'max on number': 1, 'min on date': 1 });
  assert.deepEqual([w.coverage.fields, w.coverage.withoutRow], [8, 8]);
  const byDefault = partitionWorklist([formState('desk', [declared('copies', 'number', { min: '1', max: '5', step: '0' })])]);
  assert.deepEqual(planned(byDefault), [['copies', 'at-min', val('1')], ['copies', 'below-min', val('0')], ['copies', 'at-max', val('5')], ['copies', 'above-max', val('6')]],
    'no valid declared step: one default step (1) beyond each bound, and no off-step row');
  assert.deepEqual(byDefault.rows.map((r) => r.basis).slice(0, 2), ['declared min=1', 'declared min=1, one default step for number (1) below']);
  assert.deepEqual(byDefault.coverage.invalid, { 'step on number': 1 });
});

test('partitions: length rows at and beyond declared minlength and maxlength; an under-min probe that would be empty is left to the empty row; required choices give one empty row', () => {
  const w = partitionWorklist([formState('pin', [declared('pin', 'password', { required: true, minlength: 1 }), declared('card', 'text', { minlength: 4 }),
    declared('comment', 'textarea', { maxlength: 500 }, { tag: 'textarea' }), declared('branch', 'select-one', { required: true }, { tag: 'select' }),
    declared('rules', 'checkbox', { required: true }), declared('loanLength', 'radio', { required: true }, { sel: '#loan-7' }), declared('loanLength', 'radio', { required: true }, { sel: '#loan-14' }),
    declared('photo', 'file', { required: true, multiple: true })])]);
  assert.deepEqual(planned(w), [['pin', 'empty', EMPTY], ['pin', 'length-at-min', len(1)], ['card', 'length-at-min', len(4)], ['card', 'length-under-min', len(3)],
    ['comment', 'length-at-max', len(500)], ['comment', 'length-over-max', len(501)], ['branch', 'empty', EMPTY], ['rules', 'empty', EMPTY], ['loanLength', 'empty', EMPTY], ['photo', 'empty', EMPTY]]);
  assert.equal(w.rows.find((r) => r.name === 'loanLength').sel, '#loan-7', 'a radio group is one field');
  const laterRequired = partitionWorklist([formState('renew', [declared('period', 'radio', {}, { sel: '#p-7' }), declared('period', 'radio', { required: true }, { sel: '#p-14' }),
    declared('period', 'radio', {}, { sel: '#p-other', form: 1 })])]);
  assert.deepEqual(planned(laterRequired), [['period', 'empty', EMPTY]], 'a group is required when any member of it is; a same-named radio in another form is another group');
  assert.equal(laterRequired.coverage.fields, 2);
  assert.deepEqual(planned(partitionWorklist([formState('site', [declared('website', 'url', {})])])), [['website', 'type-malformed', val('no-scheme.example')]], 'type=url declares a format');
  assert.deepEqual(planned(partitionWorklist([formState('blank', [declared('memo', 'text', { minlength: 0, maxlength: 0 })])])), [['memo', 'length-at-max', len(0)], ['memo', 'length-over-max', len(1)]],
    'minlength=0 constrains nothing; maxlength=0 still does');
  assert.equal(w.coverage.fields, 7);
});

test('partitions: dates step in days; time and the other date-like types get rows at the declared bounds with the probes beyond left to the agent; step=any or no min leaves a probe open', () => {
  const w = partitionWorklist([formState('schedule', [declared('start', 'date', { min: '2024-03-01', max: '2024-03-31', step: '7' }), declared('daily', 'date', { min: '2024-03-01', step: '1' }),
    declared('at', 'time', { min: '06:00', max: '20:00' }), declared('gain', 'number', { max: '10', step: 'any' }), declared('dose', 'number', { max: '5', step: '0.5' }),
    declared('zone', 'text', { pattern: '[A-Z]{2}[0-9]' })])]);
  assert.deepEqual(planned(w), [['start', 'at-min', val('2024-03-01')], ['start', 'below-min', val('2024-02-23')], ['start', 'at-max', null], ['start', 'above-max', val('2024-04-07')],
    ['start', 'off-step', val('2024-03-02')], ['daily', 'at-min', val('2024-03-01')], ['daily', 'below-min', val('2024-02-29')],
    ['at', 'at-min', val('06:00')], ['at', 'below-min', null], ['at', 'at-max', val('20:00')], ['at', 'above-max', null],
    ['gain', 'at-max', val('10')], ['gain', 'above-max', null], ['dose', 'at-max', val('5')], ['dose', 'above-max', val('5.5')], ['dose', 'off-step', null], ['zone', 'pattern-outside', null]]);
  const basis = Object.fromEntries(w.rows.filter((r) => r.probe === null).map((r) => [`${r.name} ${r.partition}`, r.basis]));
  assert.deepEqual(basis, { 'start at-max': 'declared max=2024-03-31 is not on the step grid from min=2024-03-01 (declared step (7)), so the browser rejects it; the accepted bound is not derived',
    'at below-min': 'declared min=06:00; the value just below is not derived for time', 'at above-max': 'declared max=20:00; the value just above is not derived for time',
    'gain above-max': 'declared max=10; step=any, so the value just above is not derived', 'dose off-step': 'declared step=0.5; no min, so the step base is not declared and the off-step value is not derived',
    'zone pattern-outside': 'declared pattern=[A-Z]{2}[0-9]; a value outside the pattern is not derived' });
  assert.equal(w.coverage.probeNotDerived, 6);
  const more = partitionWorklist([formState('more', [declared('slot', 'time', { min: '06:00', step: '900' }), declared('slotAny', 'time', { step: 'ANY' }), declared('week', 'date', { min: '2024-03-01', step: '1.5' })])]);
  assert.deepEqual(planned(more), [['slot', 'at-min', val('06:00')], ['slot', 'below-min', null], ['slot', 'off-step', null], ['week', 'at-min', val('2024-03-01')], ['week', 'below-min', val('2024-02-29')]],
    'a declared step of a type without arithmetic is an off-step row left to the agent; step=any in any case gives none; a fractional day step is invalid');
  assert.deepEqual(more.coverage.invalid, { 'step on date': 1 });
});

test('partitions: accept rows name one probe file per accepted type and one outside every accepted type; types without a known extension are left to the agent', () => {
  const accept = (value) => planned(partitionWorklist([formState('upload', [declared('upload', 'file', { accept: value })])])).map(([, p, probe]) => [p, probe?.name ?? null]);
  assert.deepEqual(accept('image/*,.pdf'), [['accept-inside', 'probe.png'], ['accept-inside', 'probe.pdf'], ['accept-outside', 'probe.bin']]);
  assert.deepEqual(accept('.bin, .txt'), [['accept-inside', 'probe.bin'], ['accept-inside', 'probe.txt'], ['accept-outside', 'probe.png']]);
  assert.deepEqual(accept('application/octet-stream,text/*,image/*'), [['accept-inside', 'probe.bin'], ['accept-inside', 'probe.txt'], ['accept-inside', 'probe.png'], ['accept-outside', null]]);
  assert.deepEqual(accept('model/x-unknown'), [['accept-inside', null], ['accept-outside', 'probe.bin']]);
  assert.deepEqual(accept('.CSV, text/csv'), [['accept-inside', 'probe.csv'], ['accept-outside', 'probe.bin']], 'case-folded, trimmed, one probe per file name');
});

test('partitions: inactive, disabled, read-only and off-page fields are not listed and are counted; file inputs not visible at capture are counted', () => {
  const w = partitionWorklist([formState('desk', [declared('a', 'text', { required: true }, { inactive: true }), declared('b', 'text', { required: true }, { disabled: true }),
    declared('c', 'text', { required: true, readonly: true }), declared('d', 'text', { required: true }, { rect: { x: -9999, y: 0, w: 300, h: 38 } }),
    declared('e', 'text', { required: true })], { fileInputsNotShown: 2 })]);
  assert.deepEqual(planned(w), [['e', 'empty', EMPTY]]);
  assert.deepEqual(w.coverage.notListed, { inactive: 1, disabled: 1, readonly: 1, 'outside-page': 1 });
  assert.deepEqual([w.coverage.fields, w.coverage.fileInputsNotShown], [1, 2]);
  const edge = (rect) => partitionWorklist([formState('edge', [declared('f', 'text', { required: true }, { rect })])]).rows.length;
  assert.deepEqual([edge({ x: -299, y: 0, w: 300, h: 38 }), edge({ x: -300, y: 0, w: 300, h: 38 }), edge({ x: 0, y: -37, w: 300, h: 38 }), edge({ x: 0, y: -38, w: 300, h: 38 })], [1, 0, 1, 0],
    'a box reaching 1 px into the page is listed; one ending at its edge is not');
  const twice = (label, over) => state(label, facts({ url: 'http://app.test/desk', formCount: 1, fields: [declared('copies', 'number', { maxlength: 3 }), declared('fine', 'number', { min: 'abc' }), declared('g', 'text', { required: true }, over)] }));
  const both = partitionWorklist([twice('desk-desktop', { disabled: true }), twice('desk-mobile', {})]);
  assert.deepEqual([both.coverage.fields, both.coverage.notListed, both.coverage.ignoredByType, both.coverage.invalid, planned(both)], [3, {}, { 'maxlength on number': 1 }, { 'min on number': 1 }, [['g', 'empty', EMPTY]]],
    'a field listed in one capture is not counted as not listed, and a field captured twice is counted once');
});

test('duplicate-identity: a suggestion only for a field marked autocomplete=email or username in a form that declares new-password and no current-password', () => {
  const pin = declared('pin', 'password', { autocomplete: 'new-password' });
  const w = partitionWorklist([formState('register', [...REGISTER, pin])]);
  assert.deepEqual(planned(w).slice(-1), [['email', 'duplicate-identity', null]]);
  assert.deepEqual(w.rows.at(-1), { id: 'W006', states: ['register'], form: 0, sel: '#email', name: 'email', type: 'email', attribute: 'autocomplete', declared: 'email',
    partition: 'duplicate-identity', probe: null, suggestion: true,
    expectation: 'suggestion: a second sign-up with an identity already in use is refused or handled; uniqueness is not a declared constraint',
    basis: 'declared autocomplete=email in a form that declares autocomplete=new-password and no current-password (a sign-up context)',
    authority: 'requires write authority', status: 'not executed' });
  const identity = (fields) => planned(partitionWorklist([formState('f', fields)])).filter(([, p]) => p === 'duplicate-identity').map(([name]) => name);
  assert.deepEqual(identity([declared('card', 'text', { autocomplete: 'section-desk username' }), pin]), ['card'], 'detail tokens are split');
  assert.deepEqual(identity(REGISTER), [], 'no new-password: no declared sign-up context');
  assert.deepEqual(identity([declared('card', 'text', { autocomplete: 'username' }), declared('old', 'password', { autocomplete: 'current-password' }), pin]), [], 'a change form');
  assert.deepEqual(identity([declared('email', 'email', { required: true }), pin]), [], 'type=email alone does not mark an identity');
  assert.deepEqual(identity([declared('email', 'email', { autocomplete: 'email' }), declared('pin', 'password', { autocomplete: 'new-password' }, { form: 1 })]), [], 'another form is no context');
  assert.deepEqual(identity([declared('email', 'email', { autocomplete: 'email' }, { disabled: true }), pin]), [], 'a field not listed gets no suggestion');
});

test('partitionWorklist: one route at two widths gives one row per check listing both states; another route keeps its own; older captures are unassessed; no candidate is created', () => {
  const at = (label, url, fields) => state(label, facts({ url, formCount: 1, fields }));
  const desktop = at('register-desktop', 'http://app.test/register', REGISTER); const mobile = at('register-mobile', 'http://app.test/register?ref=CANARY-Q', REGISTER);
  const w = partitionWorklist([desktop, mobile]);
  assert.equal(w.rows.length, 5); assert.ok(w.rows.every((r) => JSON.stringify(r.states) === '["register-desktop","register-mobile"]'));
  assert.equal(w.coverage.fields, 3);
  const other = partitionWorklist([desktop, mobile, at('renew', 'http://app.test/renew', REGISTER)]);
  assert.deepEqual([other.rows.length, other.rows.at(-1).id, other.rows.at(-1).states], [10, 'W010', ['renew']]);
  const legacy = state('legacy', facts({ fields: [field('patron')] }));
  const withLegacy = partitionWorklist([desktop, legacy]);
  assert.deepEqual([withLegacy.rows.length, withLegacy.coverage.olderCaptures], [5, ['legacy']]);
  assert.deepEqual(partitionWorklist([state('nofields', { url: 'http://app.test/x' })]).coverage.olderCaptures, ['nofields']);
  assert.equal(JSON.stringify(partitionWorklist([desktop, mobile])), JSON.stringify(w), 'byte-identical across runs');
  assert.ok(!JSON.stringify(w).includes('CANARY'));
  assert.deepEqual(runDetectors([desktop, mobile]).filter((c) => /partition|identity/.test(c.detector)), [], 'a worklist row is never a candidate');
});

test('report: "Input partitions to try (not executed)" lists every row as requiring write authority, states what gives no row and what was not listed, and claims no completeness', async () => {
  const states = [formState('register', [...REGISTER, declared('pin', 'password', { autocomplete: 'new-password' }), declared('old', 'text', { required: true }, { disabled: true }),
    declared('copies', 'number', { maxlength: 3 }), declared('zone', 'text', { pattern: 'a|b' })], { fileInputsNotShown: 1 }), state('legacy', facts({ fields: [field('patron')] }))];
  const md = toMarkdown([], states);
  const section = md.slice(md.indexOf('## Input partitions to try (not executed)'));
  assert.match(md, /\n\n## Input partitions to try \(not executed\)\n\n/);
  const lines = section.split('\n').filter((l) => /^\| W\d{3} /.test(l));
  assert.equal(lines.length, 7); assert.ok(lines.every((l) => l.endsWith('| requires write authority — not executed |')), lines.join('\n'));
  assert.ok(lines.includes('| W002 | fullName `#fullName` | length-at-max | 40 characters | satisfies this declared bound only; other constraints and business rules not evaluated | declared maxlength=40 | register | requires write authority — not executed |'), lines.join('\n'));
  assert.ok(lines.includes('| W006 | email `#email` | duplicate-identity (suggestion) | not derived | suggestion: a second sign-up with an identity already in use is refused or handled; uniqueness is not a declared constraint | declared autocomplete=email in a form that declares autocomplete=new-password and no current-password (a sign-up context) | register | requires write authority — not executed |'), lines.join('\n'));
  assert.ok(lines.includes('| W007 | zone `#zone` | pattern-outside | not derived | rejected: outside the declared pattern | declared pattern=a\\|b; a value outside the pattern is not derived | register | requires write authority — not executed |'), lines.join('\n'));
  assert.match(section, /^7 planned check\(s\) for 6 field\(s\), derived from declared attributes only \(type, required, minlength, maxlength, min, max, step, pattern, accept, autocomplete\)\. They are not candidates and nothing was typed: each row requires write authority and is not executed, and any result belongs to the agent's own records\.$/m);
  assert.match(section, /^A field gives no row when it declares no constraint the browser applies to its type \(3 field\(s\)\); that does not mean it is unconstrained\. Uniqueness is never declared, so a duplicate-identity row is a suggestion only\.$/m);
  assert.match(section, /^Not listed: 1 disabled field\(s\) \(constraints are not checked on them, or a user cannot reach them\)\.$/m);
  assert.match(section, /^Declared but not applied by the browser to the field's type \(no row\): maxlength on number 1\.$/m);
  assert.match(section, /^File inputs not visible at capture: 1 \(often opened through a styled button or label\); their accept rows are not listed\.$/m);
  assert.match(section, /^Field constraint facts not recorded in: legacy \(older capture\); input partitions are unassessed there\.$/m);
  assert.match(section, /^Probe not derived for 2 row\(s\); the agent picks the value\.$/m);
  assert.doesNotMatch(md, /\b(pass|passed|clean)\b/i);
  const legacyOnly = toMarkdown([], [state('legacy', facts({ fields: [field('patron')] }))]);
  assert.match(legacyOnly, /^Field constraint facts not recorded in: legacy \(older capture\)/m); assert.doesNotMatch(legacyOnly, /No form field was captured/);
  const disabledOnly = toMarkdown([], [formState('desk', [declared('b', 'text', { required: true }, { disabled: true })], { fileInputsNotShown: 0 })]);
  assert.match(disabledOnly, /^0 planned check\(s\) for 0 field\(s\)/m); assert.match(disabledOnly, /^Not listed: 1 disabled field\(s\)/m);
  assert.match(toMarkdown([], [formState('upload', [], { fileInputsNotShown: 1 })]), /^File inputs not visible at capture: 1 /m);
  assert.match(toMarkdown([], [state('blank', facts({ fields: [] }))]), /\n## Input partitions to try \(not executed\)\n\nNo form field was captured, so no partition row was derived\.\n$/);
  const plain = toMarkdown([], [formState('register', REGISTER)]);
  assert.doesNotMatch(plain.slice(plain.indexOf('## Input partitions')), /Not listed|not applied|not valid for|not visible at capture|not recorded in|Probe not derived/, 'no gap, no gap line');
  for (const file of ['../tools/passive-capture/partitions.mjs']) {
    assert.doesNotMatch(await readFile(new URL(file, import.meta.url), 'utf8'), /toolshop|practice software testing|onyx|nuanu|stack|localhost:\d+|127\.0\.0\.1:\d+/i, file);
  }
});

test('detect.mjs writes partitions.json and the report section beside the candidates, never as candidates, byte-identical across runs; labels and values are never copied', async () => {
  await withTempDir('passive-partitions-', async (dir) => {
    await mkdir(join(dir, 'passive'), { recursive: true });
    const canaryFields = REGISTER.map((f) => ({ ...f, placeholder: 'CANARY-PLACEHOLDER', label: { text: 'CANARY-LABEL', source: 'label-for' } }));
    await writeFile(join(dir, 'passive', 'register.facts.json'), JSON.stringify(facts({ url: 'http://app.test/register', formCount: 1, fields: canaryFields })));
    await writeFile(join(dir, 'passive', 'register.axe.json'), JSON.stringify({ available: false, reason: 'no axe source passed by the caller' }));
    await writeFile(join(dir, 'passive', 'index.jsonl'), `${JSON.stringify({ label: 'register', url: 'http://app.test/register' })}\n`);
    const first = await runDetect(dir); const firstPartitions = await readFile(join(dir, 'passive', 'partitions.json'), 'utf8');
    const second = await runDetect(dir);
    assert.equal(await readFile(join(dir, 'passive', 'partitions.json'), 'utf8'), firstPartitions); assert.equal(second.md, first.md); assert.equal(second.json, first.json);
    const worklist = JSON.parse(firstPartitions);
    assert.deepEqual(Object.keys(worklist), ['scope', 'states', 'count', 'coverage', 'rows']);
    assert.match(worklist.scope, /^Planned checks derived from declared field attributes only; not candidates\. P01 never types: every row requires write authority and is not executed\./);
    assert.deepEqual([worklist.count, worklist.rows.length, worklist.states], [5, 5, ['register']]);
    assert.deepEqual(Object.keys(JSON.parse(first.json)), ['states', 'count', 'contrastCoverage', 'reached', 'duplicateLabels', 'rareVariant', 'candidates'], 'candidates.json shape unchanged');
    assert.ok(JSON.parse(first.json).candidates.every((c) => !/partition/.test(c.detector)));
    assert.equal(first.stdout.partitions, '5 planned, not executed');
    assert.match(first.md, /^## Input partitions to try \(not executed\)$/m);
    assert.doesNotMatch(firstPartitions, /CANARY/);
  });
});
// Review fixes (round-2 review). Neutral domains as above: D-A library desk, D-B greenhouse.
test('contrast: a separator is at most two glyph characters; a run of three is text and is assessed', () => {
  const grey = { style: { color: 'rgb(200, 200, 200)' } };
  const run = (text) => computedContrast(state('loans', facts({ elements: [el(text, { ...grey, glyph: { peers: true, whole: false } })] }))).length;
  assert.deepEqual([run('--'), run('·•'), run('---'), run('···')], [0, 0, 1, 1]);
});

test('detect.mjs --dictionary with a list in another language than the page: rare-variant is unassessed, with the share known, and gives no row', async () => {
  await withTempDir('passive-dictionary-fit-', async (dir) => {
    await mkdir(join(dir, 'passive'), { recursive: true });
    const lines = ['Лейка стоит у входа в теплицу.', 'Полная лейка весит много.', 'Старая лейка протекает.', 'Возьмите лейку у двери.'];
    await writeFile(join(dir, 'passive', 'beds.facts.json'), JSON.stringify(facts({ url: `${LOANS}/beds`, elements: lines.map((t, i) => el(t, { sel: `#bed-${i}` })) })));
    await writeFile(join(dir, 'passive', 'beds.axe.json'), JSON.stringify({ available: false, reason: 'no axe source passed by the caller' }));
    await writeFile(join(dir, 'passive', 'index.jsonl'), `${JSON.stringify({ label: 'beds', url: `${LOANS}/beds` })}\n`);
    await writeFile(join(dir, 'words.txt'), 'water\nbed\nseed\n');
    const run = spawnSync(process.execPath, [DETECT, dir, '--dictionary', join(dir, 'words.txt')], { encoding: 'utf8' }); assert.equal(run.status, 0, run.stderr);
    const json = JSON.parse(await readFile(join(dir, 'passive', 'candidates.json'), 'utf8'));
    assert.deepEqual(json.rareVariant, { assessed: false, reason: 'dictionary does not fit the captured text', dictionaryWords: 3, capturedWords: 12, knownWords: 0, knownShare: 0 });
    assert.deepEqual(json.candidates.filter((c) => c.detector === 'rare-variant'), []);
    assert.equal(JSON.parse(run.stdout).rareVariant, 'unassessed (dictionary does not fit the captured text: it knows 0 of 12 captured words)');
    assert.match(await readFile(join(dir, 'passive', 'candidates.md'), 'utf8'), /^rare-variant: unassessed \(dictionary does not fit the captured text\)\. The supplied word list \(3 words\) knows 0 of 12 /m);
    await writeFile(join(dir, 'one-line.txt'), 'water bed seed tray\n');
    const oneLine = spawnSync(process.execPath, [DETECT, dir, '--dictionary', join(dir, 'one-line.txt')], { encoding: 'utf8' });
    assert.notEqual(oneLine.status, 0); assert.match(oneLine.stderr, /one-line\.txt line 1 holds more than one word; one word per line is expected/);
  });
});

const exactProbes = (c, type = 'number') => planned(partitionWorklist([formState('desk', [declared('n', type, c)])])).map(([, p, probe]) => [p, probe?.value ?? null]);
test('partitions bound proposal never claims the whole input valid or grants execution', () => {
  const w = partitionWorklist([formState('desk', [declared('pin', 'password', { minlength: 4, pattern: '[A-Z]+' })])]);
  const at = w.rows.find((r) => r.partition === 'length-at-min');
  assert.match(at.expectation, /this declared bound only/);
  assert.match(at.expectation, /other constraints and business rules not evaluated/);
  assert.equal(at.status, 'not executed');
  assert.equal(at.authority, 'requires write authority');
});
test('authored not-rendered contrast stays separate from rendered evidence', () => {
  const text = (opacity) => state(String(opacity), facts({ elements: [el('Contrast text', { opacity, style: { color: 'rgb(200, 200, 200)' } })] }));
  const rows = runDetectors([text(0), text(1)]).filter((r) => r.detector === 'contrast');
  assert.equal(rows.length, 2);
  assert.equal(rows.filter((r) => r.what.includes('not rendered at capture')).length, 1);
  assert.ok(rows.every((r) => r.states.length === 1));
});
test('partitions: a probe beyond a bound is exact and strictly beyond it once parsed as a number or a valid date, or it is not derived', () => {
  assert.deepEqual(exactProbes({ min: '-1000000000000', max: '1000000000000' }), [['at-min', '-1000000000000'], ['below-min', '-1000000000001'], ['at-max', '1000000000000'],
    ['above-max', '1000000000001']], 'integers are not rounded to 12 digits');
  assert.deepEqual(exactProbes({ max: '9007199254740993' }), [['at-max', '9007199254740993'], ['above-max', '9007199254740994']], 'beyond the safe integers, still exact and still above once parsed');
  assert.deepEqual(exactProbes({ min: '-100000000000000000000', max: '100000000000000000000' }), [['at-min', '-100000000000000000000'], ['below-min', null],
    ['at-max', '100000000000000000000'], ['above-max', null]], 'one beyond 1e20 is exact but parses to the same number, so it is not strictly beyond');
  assert.deepEqual(exactProbes({ max: '1000000000000', step: '0.5' }), [['at-max', '1000000000000'], ['above-max', '1000000000000.5'], ['off-step', null]]);
  assert.deepEqual(exactProbes({ min: '0.1', max: '0.3', step: '0.1' }), [['at-min', '0.1'], ['below-min', '0'], ['at-max', '0.3'], ['above-max', '0.4'], ['off-step', '0.15']]);
  assert.deepEqual(exactProbes({ max: '2.5e3' }), [['at-max', '2.5e3'], ['above-max', null]], 'exponent notation is not expanded');
  const infinite = partitionWorklist([formState('desk', [declared('n', 'number', { max: '1e999' })])]);
  assert.deepEqual([infinite.rows, infinite.coverage.invalid], [[], { 'max on number': 1 }], 'a bound that is not a finite number is invalid');
  assert.deepEqual(exactProbes({ min: '0001-01-01', max: '9999-12-31' }, 'date'), [['at-min', '0001-01-01'], ['below-min', null], ['at-max', '9999-12-31'], ['above-max', null]],
    'year 0 and year 10000 are not valid dates');
  const year0 = partitionWorklist([formState('desk', [declared('d', 'date', { min: '0000-12-31' })])]);
  assert.deepEqual([year0.rows, year0.coverage.invalid], [[], { 'min on date': 1 }], 'year 0 is not a valid date');
  const huge = partitionWorklist([formState('desk', [declared('d', 'date', { min: '2024-01-01', step: '9000000000' })])]);
  assert.deepEqual(planned(huge), [['d', 'at-min', val('2024-01-01')], ['d', 'below-min', null], ['d', 'off-step', val('2024-01-02')]], 'a step beyond the date range gives no probe');
  const inexact = partitionWorklist([formState('desk', [declared('n', 'number', { min: '0', step: '1e-1' }), declared('d', 'date', { min: '9999-12-31', step: '2' })])]);
  assert.deepEqual(inexact.rows.filter((r) => r.partition === 'off-step').map((r) => [r.name, r.probe, r.basis]), [
    ['n', null, 'declared step=1e-1 from min=0; the value between two allowed values is not derived (exponent notation or out of range), so it is left to the agent'],
    ['d', null, 'declared step=2 from min=9999-12-31; the value between two allowed values is not derived (exponent notation or out of range), so it is left to the agent']],
  'a declared step keeps its off-step row even when the value cannot be derived');
  const above = partitionWorklist([formState('desk', [declared('n', 'number', { max: '100000000000000000000' })])]).rows[1];
  assert.equal(above.basis, 'declared max=100000000000000000000; one default step for number (1) above does not give an exact valid value strictly above it, so it is not derived');
});

test('partitions: an at-max probe off the step grid from min is not derived; on the grid, or without a min, the declared bound stays the probe', () => {
  const copies = partitionWorklist([formState('desk', [declared('copies', 'number', { min: '0', max: '10', step: '3' })])]);
  assert.deepEqual(planned(copies), [['copies', 'at-min', val('0')], ['copies', 'below-min', val('-3')], ['copies', 'at-max', null], ['copies', 'above-max', val('13')], ['copies', 'off-step', val('1.5')]]);
  assert.equal(copies.rows[2].basis, 'declared max=10 is not on the step grid from min=0 (declared step (3)), so the browser rejects it; the accepted bound is not derived');
  assert.equal(copies.coverage.probeNotDerived, 1);
  assert.deepEqual(exactProbes({ min: '0.5', max: '10' }), [['at-min', '0.5'], ['below-min', '-0.5'], ['at-max', null], ['above-max', '11']], 'the default step counts from min too');
  assert.deepEqual(exactProbes({ min: '0', max: '9', step: '3' }), [['at-min', '0'], ['below-min', '-3'], ['at-max', '9'], ['above-max', '12'], ['off-step', '1.5']], 'on the grid');
  assert.deepEqual(exactProbes({ min: '0.1', max: '0.7', step: '0.2' }).find(([p]) => p === 'at-max'), ['at-max', '0.7'], 'decimal grids are exact');
  assert.deepEqual(exactProbes({ max: '10', step: '3' }), [['at-max', '10'], ['above-max', '13'], ['off-step', null]], 'without min the step base is not declared');
  assert.deepEqual(exactProbes({ min: '2024-03-01', max: '2024-03-29', step: '7' }, 'date').find(([p]) => p === 'at-max'), ['at-max', '2024-03-29']);
  const at = partitionWorklist([formState('desk', [declared('at', 'time', { min: '06:00', max: '20:30', step: '3600' })])]).rows.find((r) => r.partition === 'at-max');
  assert.deepEqual([at.probe, at.basis], [val('20:30'), 'declared max=20:30; whether it lies on the step grid from min is not checked for time']);
});

test('partitions: off-step probes survive parsed bounds and remain off-grid', () => {
  const off = (min, step) => partitionWorklist([formState('desk', [declared('n', 'number', { min, step })])]).rows.find((r) => r.partition === 'off-step').probe;
  assert.equal(off('100000000000000000000', '1'), null);
  assert.deepEqual(off('0.1', '0.1'), val('0.15'));
});

test('partitions: each row names its own expectation, accepted at a bound and rejected beyond it, and the report shows it', () => {
  const w = partitionWorklist([formState('desk', [declared('copies', 'number', { min: '1', max: '4', step: '1' }), declared('pin', 'password', { required: true, minlength: 4, maxlength: 6 }),
    declared('mail', 'email', {}), declared('zone', 'text', { pattern: '[A-Z]' }), declared('scan', 'file', { accept: '.csv' })])]);
  assert.deepEqual(w.rows.map((r) => [r.partition, r.expectation]), [['at-min', 'satisfies this declared bound only; other constraints and business rules not evaluated'], ['below-min', 'rejected: beyond the declared bound'],
    ['at-max', 'satisfies this declared bound only; other constraints and business rules not evaluated'], ['above-max', 'rejected: beyond the declared bound'], ['off-step', 'rejected: off the declared step'],
    ['empty', 'rejected: required'], ['length-at-min', 'satisfies this declared bound only; other constraints and business rules not evaluated'], ['length-under-min', 'rejected: beyond the declared bound'],
    ['length-at-max', 'satisfies this declared bound only; other constraints and business rules not evaluated'], ['length-over-max', 'rejected: beyond the declared bound'], ['type-malformed', 'rejected: malformed for the declared type'],
    ['pattern-outside', 'rejected: outside the declared pattern'], ['accept-inside', 'matches a declared file-picker type only; application acceptance not evaluated'],
    ['accept-outside', 'does not match a declared file-picker type; application handling and acceptance not evaluated']]);
  const md = toMarkdown([], [formState('desk', [declared('copies', 'number', { min: '1', max: '4', step: '1' })])]);
  assert.match(md, /^\| ID \| Field \| Partition \| Probe \| Expected \| Basis \| States \| Status \|$/m);
  assert.match(md, /^\| W002 \| copies `#copies` \| below-min \| `0` \| rejected: beyond the declared bound \| declared min=1, one declared step \(1\) below \| desk \| requires write authority — not executed \|$/m);
});

test('partitions: a length probe over 1000000 characters is not derived and is counted; at the cap it is', () => {
  const lengths = (c) => planned(partitionWorklist([formState('desk', [declared('memo', 'textarea', c, { tag: 'textarea' })])])).map(([, p, probe]) => [p, probe?.length ?? null]);
  assert.deepEqual(lengths({ maxlength: 2147483647 }), [['length-at-max', null], ['length-over-max', null]], 'a maxlength used as "unlimited"');
  assert.deepEqual(lengths({ maxlength: 1000000 }), [['length-at-max', 1000000], ['length-over-max', null]]);
  assert.deepEqual(lengths({ maxlength: 999999 }), [['length-at-max', 999999], ['length-over-max', 1000000]]);
  assert.deepEqual(lengths({ minlength: 1000001 }), [['length-at-min', null], ['length-under-min', 1000000]]);
  const w = partitionWorklist([formState('desk', [declared('memo', 'textarea', { maxlength: 2147483647 }, { tag: 'textarea' })])]);
  assert.deepEqual([w.rows[1].basis, w.coverage.probeNotDerived], ['declared maxlength=2147483647; a probe of 2147483648 characters is too long to derive (over 1000000)', 2]);
});

test('captureState keeps at most 20 axe nodes per rule and records how many there were; the report names each cut rule', async () => {
  await withTempDir('passive-axe-', async (dir) => {
    await writeFile(join(dir, 'axe.min.js'), '/* stand-in for axe-core */');
    const nodes = (n) => Array.from({ length: n }, (_, i) => ({ target: [`#n${i}`], any: [{ data: { fgColor: '#999999', bgColor: '#ffffff', contrastRatio: 2.85 } }] }));
    const result = { testEngine: { version: 'stand-in' }, violations: [{ id: 'color-contrast', impact: 'serious', help: 'contrast', nodes: nodes(25) }, { id: 'label', impact: 'critical', help: 'label', nodes: nodes(20) }] };
    let calls = 0;
    const page = { evaluate: async () => { calls += 1; return calls === 1 ? facts({ url: LOANS }) : result; }, screenshot: async () => Buffer.from('png'), addScriptTag: async () => {} };
    await captureState(page, { dir, label: 'loans', axeSource: join(dir, 'axe.min.js') });
    const axe = JSON.parse(await readFile(join(dir, 'passive', 'loans.axe.json'), 'utf8'));
    assert.deepEqual(axe.violations.map((v) => [v.id, v.nodes.length, v.nodesTotal]), [['color-contrast', 20, 25], ['label', 20, 20]]);
    const md = toMarkdown([], await loadStates(dir));
    assert.match(md, /^axe kept the first 20 nodes per rule: color-contrast in loans \(20 of 25\)\. The other violating nodes are not listed, so no row for them is not a pass\.$/m);
  });
  const older = state('x', facts(), { available: true, violations: [{ id: 'color-contrast', nodes: [{ target: 'a' }] }] });
  assert.doesNotMatch(toMarkdown([], [older]), /axe kept the first/, 'an older axe record without the total gives no line');
});
