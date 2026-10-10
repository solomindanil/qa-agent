import assert from 'node:assert/strict';
import test from 'node:test';
import { styleOutliers, crossStateAlignment, inputPaddingOutliers, primaryActionGeometry, optionFontOutliers } from '../tools/passive-capture/style-detectors.mjs';
import { computedContrast, contrastCoverage, axeCandidates, nameCandidates, contrastRatio, parseColor } from '../tools/passive-capture/a11y-detectors.mjs';
import { runDetectors, toMarkdown } from '../tools/passive-capture/detect.mjs';
import { captureState } from '../tools/passive-capture/capture.mjs';

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

test('captureState refuses a missing page, dir or unsafe label before touching anything', async () => {
  const page = { evaluate: async () => { throw Error('must not be called'); } };
  await assert.rejects(captureState(null, { dir: '/tmp/x', label: 'a' }), /Playwright page/);
  await assert.rejects(captureState(page, { label: 'a' }), /output dir/);
  await assert.rejects(captureState(page, { dir: '/tmp/x', label: '../escape' }), /label must match/);
});
