// Pooled-style detectors (opt-in): pooled property spread across all captured states of one origin, viewport and role, one odd
// font inside a form, and colour drift among look-alike siblings. Synthetic facts in two neutral domains: D-A library loans,
// D-B greenhouse sensors. Candidates only, each with its basis; spread rows are not candidates.
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pooledPropertySpread, formFontOutlier, formFontCoverage, siblingColorDrift, siblingColorCoverage, crossStateProperties, styleOutliers }
  from '../tools/passive-capture/style-detectors.mjs';
import { runDetectors, toMarkdown } from '../tools/passive-capture/detect.mjs';

const DETECT = fileURLToPath(new URL('../tools/passive-capture/detect.mjs', import.meta.url));
test('pooled report explicitly qualifies no-PASS, unknown comparability and inferred evidence scope without changing default bytes', () => {
  const plain = toMarkdown([], []), pooled = toMarkdown([], [], { pooled: true });
  const extra = pooled.slice(pooled.indexOf('## Pooled style'), pooled.indexOf('## Input partitions'));
  assert.match(extra, /The absence of candidates or spread rows does not establish PASS\./);
  assert.match(extra, /The absence of candidates does not establish PASS\./);
  assert.doesNotMatch(extra, /No (row|candidate) there is not a pass/);
  assert.match(extra, /Missing role or viewport means unknown, not equal identity/);
  assert.match(extra, /same-role\/viewport comparability is not established/);
  assert.match(extra, /inferred from saved text and counts, not exact DOM ownership/);
  assert.match(extra, /representative merged basis.*not independent proof for every occurrence/);
  assert.match(extra, /path-selector collisions.*evidence is capped/);
  assert.match(extra, /evidence is capped at 6 occurrences/);
  assert.match(extra, /Help-text font detection is UNSUPPORTED.*hint facts are absent/);
  assert.equal(toMarkdown([], [], { pooled: false }), plain);
  assert.doesNotMatch(plain, /Missing role or viewport|inferred from saved text and counts|representative merged basis/);
});
const LOANS = 'http://loans.test'; const SENSORS = 'http://sensors.test';
const NAVY = 'rgb(31, 58, 95)'; const RED = 'rgb(138, 31, 31)'; const GREY = 'rgb(90, 90, 90)'; const GREEN = 'rgb(30, 110, 60)'; const BLUE = 'rgb(30, 90, 140)';
const MINT = 'rgb(230, 245, 235)'; const SAND = 'rgb(250, 240, 220)';
const INTER = 'Inter, sans-serif';
const STYLE = { textAlign: 'start', fontFamily: INTER, fontSize: '16px', fontWeight: '400', color: NAVY, paddingLeft: '0px', paddingRight: '0px', display: 'block' };
const WHITE = { kind: 'solid', color: 'rgb(255, 255, 255)' };
const NO_AXE = { available: false, reason: 'no axe source passed by the caller' };
const slug = (t) => t.replace(/\W/g, '').slice(0, 40) || 'glyph';
const el = (text, over = {}) => ({ sel: `#${slug(text)}`, tag: 'h2', sig: 'h2.panel-title', parentSig: 'section.panel', text, rect: { x: 0, y: 0, w: 200, h: 24 },
  bg: WHITE, disabled: false, inactive: false, ...over, style: { ...STYLE, ...over.style } });
const facts = (over = {}) => ({ url: `${LOANS}/`, viewport: { w: 1280, h: 800 }, elements: [], fields: [], controls: [],
  activeContext: { nativeModal: null, inertRoots: [], ariaModalDeclared: [] }, formCount: 0, ...over });
const state = (label, url, f = {}, extra = {}) => ({ label, url, facts: facts({ url, ...f }), axe: NO_AXE, ...extra });
const THRESHOLDS = { majority: 0.75, minAgree: 3, minRoutes: 2, minVariantProps: 2 };
const POOL = { origin: LOANS, viewport: 1280, role: null };

// D-A: one panel title per loans page, so a per-page comparison has a single item and starves.
const title = (color, over = {}) => el('Your loans', { ...over, style: { color, ...over.style } });
const loansPage = (label, path, elements, extra) => state(label, `${LOANS}${path}`, { elements }, extra);
const fourPages = (odd = title(RED)) => [loansPage('desk', '/desk', [title(NAVY)]), loansPage('renew', '/renew', [title(NAVY)]), loansPage('return', '/return', [title(NAVY)]),
  loansPage('fines', '/fines', [odd])];

test('pooled: three loans pages agree and one differs, a single item per page: one pooled-outlier naming the odd state, with its basis', () => {
  const pages = fourPages();
  assert.deepEqual(crossStateProperties(pages), [], 'control: one item per page starves the per-page comparison');
  assert.deepEqual(pages.flatMap((s) => styleOutliers(s)), [], 'control: one item per state starves the in-state comparison');
  const { outliers, spread, coverage } = pooledPropertySpread(pages);
  assert.deepEqual(spread, []);
  assert.equal(outliers.length, 1);
  const [row] = outliers;
  assert.equal(row.detector, 'pooled-outlier'); assert.equal(row.severity, 'low'); assert.equal(row.confidence, 'low');
  assert.equal(row.what, 'Pooled items "Your loans" have color rgb(138, 31, 31) in fines; 3 of 4 pooled states (on 3 routes) have color rgb(31, 58, 95); '
    + 'a majority across captured states, not a design rule, so the odd state may be the intended one');
  assert.deepEqual(row.evidence, { state: 'fines', url: `${LOANS}/fines`, selector: '#Yourloans', shot: 'passive/fines.png', facts: 'passive/fines.facts.json' });
  assert.deepEqual(row.basis, { pool: POOL, kind: 'item|section.panel>h2.panel-title', prop: 'color',
    majority: { value: NAVY, states: ['desk', 'renew', 'return'], routes: 3 }, odd: [{ state: 'fines', value: RED }], variants: [], sameRoute: [], mixed: [], voters: 4, thresholds: THRESHOLDS });
  assert.deepEqual(coverage, { pools: 1, statesNotPooled: 0, kindsCompared: 1, kindsInOneState: 0, comparisons: 6, agreed: 5, outliers: 1, spread: 0, withoutVotes: 0, interactiveItems: 0 });
});

test('pooled: two vs two gives a spread row listing the distribution without picking a side, and no candidate; healthy all-agree gives nothing', () => {
  const unit = (color) => el('°C', { tag: 'span', sig: 'span.unit', parentSig: 'div.reading', style: { color } });
  const sensors = (colors) => colors.map((c, i) => state(['north', 'south', 'east', 'west'][i], `${SENSORS}/${['north', 'south', 'east', 'west'][i]}`, { elements: [unit(c)] }));
  const split = pooledPropertySpread(sensors([GREY, GREY, GREEN, GREEN]));
  assert.deepEqual(split.outliers, []);
  assert.deepEqual(split.spread, [{ pool: { origin: SENSORS, viewport: 1280, role: null }, kind: 'item|div.reading>span.unit', subject: 'items "°C"', prop: 'color',
    reason: 'no-clear-majority', distribution: [{ value: GREY, states: ['north', 'south'] }, { value: GREEN, states: ['east', 'west'] }], variants: [], sameRoute: [], mixed: [],
    example: { state: 'north', selector: '#C' } }]);
  assert.ok(split.spread.every((r) => !('detector' in r) && !('severity' in r)), 'a spread row is not a candidate');
  assert.deepEqual(pooledPropertySpread(sensors([GREY, GREY, GREY, GREY])), { outliers: [], spread: [],
    coverage: { pools: 1, statesNotPooled: 0, kindsCompared: 1, kindsInOneState: 0, comparisons: 6, agreed: 6, outliers: 0, spread: 0, withoutVotes: 0, interactiveItems: 0 } });
  assert.deepEqual(pooledPropertySpread([]), { outliers: [], spread: [],
    coverage: { pools: 0, statesNotPooled: 0, kindsCompared: 0, kindsInOneState: 0, comparisons: 0, agreed: 0, outliers: 0, spread: 0, withoutVotes: 0, interactiveItems: 0 } });
  const one = (color) => [state('a', `${SENSORS}/a`, { elements: [unit(GREY)] }), state('b', `${SENSORS}/b`, { elements: [unit(color)] })];
  assert.deepEqual(pooledPropertySpread(one(GREEN)).spread.map((r) => [r.prop, r.reason]), [['color', 'no-clear-majority']], 'two states that differ: a spread row');
  assert.deepEqual(pooledPropertySpread(one(GREY)).spread, []);
});

test('pooled thresholds: a 75 % share, at least 3 agreeing states on at least 2 routes, each on both sides', () => {
  const pages = (agree, odd, path = (i) => `/p${i}`) => [...Array.from({ length: agree }, (_, i) => loansPage(`ok${i}`, path(i), [title(NAVY)])),
    ...Array.from({ length: odd }, (_, i) => loansPage(`odd${i}`, `/odd${i}`, [title(RED)]))];
  const outcome = (states, opts) => { const r = pooledPropertySpread(states, opts); return [new Set(r.outliers.map((c) => c.key)).size, r.spread.map((s) => s.reason)]; };
  assert.deepEqual(outcome(pages(3, 1)), [1, []], '3 of 4 = 0.75');
  assert.deepEqual(outcome(pages(5, 2)), [0, ['no-clear-majority']], '5 of 7 < 0.75');
  assert.deepEqual(outcome(pages(6, 2)), [1, []], '6 of 8 = 0.75, both odd states named');
  const twoOdd = pooledPropertySpread(pages(6, 2)).outliers;
  assert.deepEqual(twoOdd.map((c) => [c.key, c.evidence.state]), [[twoOdd[0].key, 'odd0'], [twoOdd[0].key, 'odd1']], 'one raw row per odd state under one key, merged by runDetectors');
  assert.deepEqual(twoOdd[0].basis.odd, [{ state: 'odd0', value: RED }, { state: 'odd1', value: RED }]);
  assert.match(pooledPropertySpread(pages(6, 2)).outliers[0].what, /have color rgb\(138, 31, 31\) in odd0, odd1; 6 of 8 pooled states \(on 6 routes\)/);
  assert.deepEqual(outcome(pages(2, 1), { majority: 0.6 }), [0, ['no-clear-majority']], 'with a lower share, 2 agreeing states are still too few');
  assert.deepEqual(outcome(pages(3, 1), { majority: 0.6 }), [1, []]);
  const sameRoute = pages(3, 1, (i) => `/desk?sort=${i}`);
  assert.deepEqual(outcome(sameRoute), [0, ['majority-on-one-route']], 'three captures of one route (queries dropped) are one route');
  assert.deepEqual(outcome(pages(3, 1, (i) => (i < 2 ? '/desk' : '/renew'))), [1, []], 'two routes suffice');
  const kindAlone = [loansPage('a', '/a', [title(NAVY)]), loansPage('b', '/b', [el('Fines due', { sig: 'p.fine-note', parentSig: 'section.panel' })])];
  assert.deepEqual(pooledPropertySpread(kindAlone).coverage, { pools: 1, statesNotPooled: 0, kindsCompared: 0, kindsInOneState: 2, comparisons: 0, agreed: 0, outliers: 0, spread: 0, withoutVotes: 0, interactiveItems: 0 });
});

test('pooled votes: a state votes with a value more than half of its items share; mixed states do not vote and are listed', () => {
  const mixed = loansPage('mixed', '/mixed', [title(NAVY, { sel: '#t1' }), title(RED, { sel: '#t2' })]);
  const twoToOne = loansPage('lean', '/lean', [title(NAVY, { sel: '#t1' }), title(NAVY, { sel: '#t2' }), title(RED, { sel: '#t3' })]);
  assert.deepEqual(pooledPropertySpread([...fourPages(title(NAVY)), mixed]).outliers, [], 'all voting states agree');
  const r = pooledPropertySpread([...fourPages(), mixed, twoToOne]);
  assert.equal(r.outliers.length, 1);
  assert.deepEqual([r.outliers[0].basis.mixed, r.outliers[0].basis.voters, r.outliers[0].basis.majority.states], [['mixed'], 5, ['desk', 'renew', 'return', 'lean']]);
});

test('pooled: an odd state differing in two or more look properties is a variant: spread rows, never a candidate', () => {
  const r = pooledPropertySpread(fourPages(title(RED, { style: { fontWeight: '700' } })));
  assert.deepEqual(r.outliers, []);
  assert.deepEqual(r.spread.map((s) => [s.prop, s.reason, s.variants]), [['fontWeight', 'multi-property-variant', ['fines']], ['color', 'multi-property-variant', ['fines']]]);
  assert.deepEqual(r.spread[1].distribution, [{ value: NAVY, states: ['desk', 'renew', 'return'] }, { value: RED, states: ['fines'] }]);
  assert.equal(pooledPropertySpread(fourPages(title(RED, { style: { fontWeight: '700' } })), { minVariantProps: 3 }).outliers.length, 2, 'control: the guard is what holds them back');
  const both = [...fourPages(), loansPage('bold', '/bold', [title(RED, { style: { fontWeight: '700' } })]), ...['x1', 'x2', 'x3'].map((x) => loansPage(x, `/${x}`, [title(NAVY)]))];
  const mixedOdd = pooledPropertySpread(both);
  assert.deepEqual(mixedOdd.outliers.map((c) => [c.basis.prop, c.evidence.state, c.basis.variants]), [['color', 'fines', ['bold']]], 'a single-property odd state is still named');
  assert.deepEqual(mixedOdd.spread.map((s) => [s.prop, s.reason, s.variants]), [['fontWeight', 'multi-property-variant', ['bold']], ['color', 'multi-property-variant', ['bold']]]);
});

test('pooled dimensions: origin, viewport width and, when present, role keep pools apart; unknown origins are not pooled', () => {
  const odd = (extra) => [...fourPages().slice(0, 3), loansPage('fines', '/fines', [title(RED)], extra)];
  assert.equal(pooledPropertySpread(odd()).outliers.length, 1, 'control');
  assert.deepEqual(pooledPropertySpread([...fourPages().slice(0, 3), state('fines', 'http://other.test/fines', { elements: [title(RED)] })]).outliers, []);
  assert.deepEqual(pooledPropertySpread([...fourPages().slice(0, 3), state('fines', `${LOANS}/fines`, { elements: [title(RED)], viewport: { w: 390, h: 844 } })]).outliers, []);
  const roles = (r) => fourPages().map((s, i) => ({ ...s, role: i < 3 ? 'patron' : r }));
  assert.deepEqual(pooledPropertySpread(roles('librarian')).outliers, [], 'another role is another pool');
  assert.deepEqual(pooledPropertySpread(roles('patron')).outliers[0].basis.pool, { origin: LOANS, viewport: 1280, role: 'patron' });
  assert.deepEqual(pooledPropertySpread(odd({ role: 'patron' })).outliers, [], 'a state with a role is not pooled with states without one');
  assert.throws(() => pooledPropertySpread(odd({ role: 7 })), TypeError);
  assert.throws(() => pooledPropertySpread(odd({ role: ' ' })), TypeError);
  const noOrigin = [...fourPages().slice(0, 3), state('fines', 'not a url', { elements: [title(RED)] })];
  assert.deepEqual([pooledPropertySpread(noOrigin).outliers, pooledPropertySpread(noOrigin).coverage.statesNotPooled], [[], 1]);
  const noViewport = fourPages().map((s) => ({ ...s, facts: { ...s.facts, viewport: undefined } }));
  assert.deepEqual(pooledPropertySpread(noViewport).outliers[0].basis.pool, { origin: LOANS, viewport: null, role: null }, 'captures without a viewport form one group');
});

test('pooled items: inactive, disabled, not-rendered and long-text items are not compared; text-align only for block boxes; unknown backgrounds stay unknown', () => {
  const pages = (odd) => fourPages(odd);
  for (const over of [{ inactive: true }, { disabled: true }, { opacity: 0 }]) assert.deepEqual(pooledPropertySpread(pages(title(RED, over))).outliers, [], JSON.stringify(over));
  const long = 'Your loans and reservations across every branch of the county library service';
  assert.deepEqual(pooledPropertySpread(fourPages().map((s) => ({ ...s, facts: { ...s.facts, elements: s.facts.elements.map((e) => ({ ...e, text: long })) } }))).outliers, []);
  const align = (a, display) => title(NAVY, { style: { textAlign: a, display } });
  const aligned = (display) => [loansPage('a', '/a', [align('left', display)]), loansPage('b', '/b', [align('start', display)]), loansPage('c', '/c', [align('left', display)]),
    loansPage('d', '/d', [align('center', display)])];
  assert.match(pooledPropertySpread(aligned('block')).outliers[0]?.what ?? '', /have textAlign center in d; 3 of 4/, 'start reads as left');
  assert.deepEqual(pooledPropertySpread(aligned('inline-block')).outliers, [], 'an inline-level box shrinks to its text');
  const bg = (b) => title(NAVY, { bg: b });
  const backgrounds = (odd) => [loansPage('a', '/a', [bg(WHITE)]), loansPage('b', '/b', [bg(WHITE)]), loansPage('c', '/c', [bg(WHITE)]), loansPage('d', '/d', [bg(odd)])];
  assert.match(pooledPropertySpread(backgrounds({ kind: 'solid', color: SAND })).outliers[0]?.what ?? '', /have background rgb\(250, 240, 220\) in d/);
  for (const unknown of [{ kind: 'solid', color: SAND, assumed: true }, { kind: 'solid', color: SAND, opacity: 0.5 }, { kind: 'layer' }, { kind: 'image' }, { kind: 'translucent', color: 'rgba(0, 0, 0, 0.5)' }]) {
    assert.deepEqual(pooledPropertySpread(backgrounds(unknown)).outliers, [], JSON.stringify(unknown));
  }
});

// D-A renewal forms: fields and the primary action, width relative to the form.
const fieldOf = (name, over = {}) => ({ sel: `#${name}`, tag: 'input', type: 'text', textLike: true, sig: 'input.renew-input', parentSig: 'div.field', id: name, name, placeholder: null,
  label: { text: name, source: 'label-for' }, form: 0, rect: { x: 100, y: 0, w: 360, h: 38 }, containerW: 360, disabled: false, inactive: false, ...over, style: { ...STYLE, ...over.style } });
const submitOf = (text, over = {}) => ({ sel: `#${slug(text)}`, tag: 'button', type: 'submit', sig: 'button.renew-submit', name: { text, source: 'text' }, form: 0,
  rect: { x: 100, y: 200, w: 360, h: 38 }, disabled: false, inactive: false, ...over, style: { ...STYLE, ...over.style } });

test('pooled fields and primary actions: width relative to the form, within 5 points or 4 px', () => {
  const withField = (label, w, containerW = 360) => state(label, `${LOANS}/${label}`, { formCount: 1, fields: [fieldOf('card', { rect: { x: 100, y: 0, w, h: 38 }, containerW })] });
  const odd = pooledPropertySpread([withField('a', 360), withField('b', 360), withField('c', 360), withField('d', 180)]);
  assert.equal(odd.outliers.length, 1);
  assert.equal(odd.outliers[0].what, 'Pooled fields "card" have width 50% of their container (180 of 360px) in d; 3 of 4 pooled states (on 3 routes) have width 100% of their container (360 of 360px); '
    + 'a majority across captured states, not a design rule, so the odd state may be the intended one');
  assert.deepEqual(odd.outliers[0].basis.odd, [{ state: 'd', value: 50, px: 180, of: 360 }]);
  assert.deepEqual(pooledPropertySpread([withField('a', 360), withField('b', 360), withField('c', 360), withField('d', 342)]).outliers, [], '95 % is within 5 points');
  assert.equal(pooledPropertySpread([withField('a', 360), withField('b', 360), withField('c', 360), withField('d', 338)]).outliers.length, 1, '94 % is not');
  assert.deepEqual(pooledPropertySpread([withField('a', 300), withField('b', 300), withField('c', 300), withField('d', 300, 400)]).outliers, [], 'the same pixel width in a wider form');
  assert.equal(pooledPropertySpread([withField('a', 300), withField('b', 300), withField('c', 300), withField('d', 295, 400)]).outliers.length, 1, '5 px and 9 points apart');
  const align = (a) => state(a.label, `${LOANS}/${a.label}`, { formCount: 1, fields: [fieldOf('card', { style: { textAlign: a.v, display: 'inline-block' } })] });
  assert.match(pooledPropertySpread(['left', 'left', 'left', 'right'].map((v, i) => align({ label: `f${i}`, v }))).outliers[0]?.what ?? '', /have textAlign right in f3/,
    'a field aligns its own text whatever its display');
  const form = (label, w, extra = {}) => state(label, `${LOANS}/${label}`, { formCount: 1, fields: [fieldOf('card'), fieldOf('title', { rect: { x: 100, y: 50, w: 360, h: 38 } })],
    controls: [submitOf('Renew loan', { rect: { x: 100, y: 200, w, h: 38 } }), ...(extra.controls ?? [])] });
  const primary = pooledPropertySpread([form('a', 360), form('b', 360), form('c', 360), form('d', 144)]);
  assert.equal(primary.outliers.length, 1);
  assert.equal(primary.outliers[0].what, 'Pooled primary actions "Renew loan" have width 40% of their form (144 of 360px) in d; 3 of 4 pooled states (on 3 routes) have width 100% of their form (360 of 360px); '
    + 'a majority across captured states, not a design rule, so the odd state may be the intended one');
  assert.equal(primary.outliers[0].basis.kind, 'primary|>button.renew-submit');
  const noForm = (label, w) => state(label, `${LOANS}/${label}`, { formCount: 1, controls: [submitOf('Renew loan', { rect: { x: 100, y: 200, w, h: 38 } })] });
  assert.deepEqual(pooledPropertySpread([noForm('a', 360), noForm('b', 360), noForm('c', 360), noForm('d', 144)]).outliers, [], 'no field gives the form width: unknown, not compared');
  const offPage = state('d', `${LOANS}/d`, { formCount: 1, fields: [fieldOf('card', { rect: { x: -9999, y: 0, w: 180, h: 38 } })] });
  assert.deepEqual(pooledPropertySpread([withField('a', 360), withField('b', 360), withField('c', 360), offPage]).outliers, [], 'a field parked off the page is not compared');
  const box = (label, w) => state(label, `${LOANS}/${label}`, { formCount: 1, fields: [fieldOf('agree', { type: 'checkbox', textLike: false, rect: { x: 100, y: 0, w, h: 13 } })] });
  assert.deepEqual(pooledPropertySpread([box('a', 13), box('b', 13), box('c', 13), box('d', 40)]).outliers, [], 'only text-like fields are compared');
  const cancel = submitOf('Cancel', { type: 'button', sel: '#cancel', rect: { x: 100, y: 260, w: 100, h: 38 } });
  assert.deepEqual(pooledPropertySpread([form('a', 360, { controls: [cancel] }), form('b', 360), form('c', 360), form('d', 360)]).outliers, [], 'only the submit is the primary action, even below a look-alike button');
});

test('pooled guards: one voting state is no comparison, a state without a known value is not mixed, sig-less fields and disabled primary actions are not pooled', () => {
  const bg = (b) => title(NAVY, { bg: b });
  const two = pooledPropertySpread([loansPage('a', '/a', [bg(WHITE)]), loansPage('b', '/b', [bg({ kind: 'layer' })])]);
  assert.deepEqual(two.coverage, { pools: 1, statesNotPooled: 0, kindsCompared: 1, kindsInOneState: 0, comparisons: 5, agreed: 5, outliers: 0, spread: 0, withoutVotes: 1, interactiveItems: 0 },
    'the background is known in one state only: no comparison');
  const backgrounds = [loansPage('a', '/a', [bg(WHITE)]), loansPage('b', '/b', [bg(WHITE)]), loansPage('c', '/c', [bg(WHITE)]), loansPage('d', '/d', [bg({ kind: 'solid', color: SAND })]),
    loansPage('e', '/e', [bg({ kind: 'image' })])];
  const [row] = pooledPropertySpread(backgrounds).outliers;
  assert.deepEqual([row?.basis.prop, row?.basis.voters, row?.basis.mixed], ['background', 4, []], 'a state with no known value neither votes nor is listed as mixed');
  const sigless = (label, w) => state(label, `${LOANS}/${label}`, { formCount: 1, fields: [fieldOf('card', { sig: undefined, rect: { x: 100, y: 0, w, h: 38 } })] });
  const older = pooledPropertySpread([sigless('a', 360), sigless('b', 360), sigless('c', 360), sigless('d', 180)]);
  assert.deepEqual([older.outliers, older.coverage.kindsCompared], [[], 0], 'fields captured without a signature have no kind');
  const form = (label, w, over = {}) => state(label, `${LOANS}/${label}`, { formCount: 1, fields: [fieldOf('card')], controls: [submitOf('Renew loan', { rect: { x: 100, y: 200, w, h: 38 }, ...over })] });
  assert.equal(pooledPropertySpread([form('a', 360), form('b', 360), form('c', 360), form('d', 144)]).outliers.length, 1, 'control');
  for (const over of [{ disabled: true }, { inactive: true }]) {
    assert.deepEqual(pooledPropertySpread([form('a', 360), form('b', 360), form('c', 360), form('d', 144, over)]).outliers, [], `a primary action that is ${JSON.stringify(over)} is not compared`);
  }
});

test('pooled output is deterministic and byte-identical across separate processes', () => {
  const pages = [...fourPages(), ...fourPages(title(RED, { style: { fontWeight: '700' } })).map((s) => ({ ...s, label: `${s.label}-2`, url: `${s.url}#/2` }))];
  const once = JSON.stringify(pooledPropertySpread(pages));
  assert.equal(JSON.stringify(pooledPropertySpread(pages)), once);
  const mod = new URL('../tools/passive-capture/style-detectors.mjs', import.meta.url).href;
  const script = `const { pooledPropertySpread } = await import(${JSON.stringify(mod)}); process.stdout.write(JSON.stringify(pooledPropertySpread(JSON.parse(process.argv[1]))));`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script, JSON.stringify(pages)], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr); assert.equal(run.stdout, once);
});

// D-A renewal form for form fonts: four labelled fields (one a select with options), two help texts and a submit.
const LABELS = { card: 'Library card', title: 'Book title', weeks: 'Extra weeks', note: 'Note to the desk' };
const HINTS = { card: 'Printed on the back of your card.', weeks: 'Up to three renewals per loan.' };
const renewForm = ({ help = {}, labels = {}, fields = [], controls = [], elements = [], form = 0 } = {}) => {
  const base = Object.keys(LABELS).map((name, i) => fieldOf(name, { form, tag: name === 'weeks' ? 'select' : name === 'note' ? 'textarea' : 'input', label: { text: LABELS[name], source: 'label-for' },
    ...(HINTS[name] ? { hint: HINTS[name], hintSource: 'next-sibling' } : {}), sel: `#${name}${form || ''}`, rect: { x: 100, y: 60 * i, w: 360, h: 38 },
    ...(name === 'weeks' ? { options: ['1', '2', '3'].map((text) => ({ text, fontSize: '16px' })) } : {}) }));
  const labelEls = Object.entries(LABELS).map(([name, text]) => el(text, { tag: 'label', sig: 'label', parentSig: 'div.field', sel: `#f${form} label.${name}`, ...labels[name] }));
  const helpEls = Object.entries(HINTS).map(([name, text]) => el(text, { tag: 'small', sig: 'small', parentSig: 'div.field', sel: `#f${form} small.${name}`, ...help[name] }));
  const submit = submitOf('Renew loan', { form, sel: `#renew${form}` });
  return { fields: [...base, ...fields], controls: [submit, ...controls], formCount: form + 1,
    elements: [...labelEls, ...helpEls, el('Renew loan', { tag: 'button', sig: 'button.renew-submit', parentSig: 'form.renew', sel: submit.sel }), ...elements] };
};
const renewState = (parts, label = 'renew') => state(label, `${LOANS}/${label}`, parts);
const glyphButton = (text, family, glyph = { peers: false, whole: true }) => [submitOf(text, { type: 'button', sig: 'button.more', sel: '#more', style: { fontFamily: family } }),
  el(text, { tag: 'button', sig: 'button.more', parentSig: 'form.renew', sel: '#more', style: { fontFamily: family }, ...(glyph ? { glyph } : {}) })];
const MONO = 'ui-monospace, Menlo, monospace';

test('form fonts: one help text in another family is a low-confidence candidate with its basis; an icon glyph and a monospace code field are not compared', () => {
  const broken = renewState(renewForm({ help: { weeks: { style: { fontFamily: 'Georgia, serif' } } } }));
  const rows = formFontOutlier(broken);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].detector, 'form-font'); assert.equal(rows[0].confidence, 'low'); assert.equal(rows[0].severity, 'low');
  assert.equal(rows[0].what, 'Form text "Up to three renewals per loan." (help text) has fontFamily Georgia; 10 of 11 text-bearing members of its form have Inter; '
    + 'icon glyphs and monospace text are not compared; low confidence: a designed face for one element is a legitimate dismissal; membership is inferred from saved text and counts, not exact DOM ownership');
  assert.equal(rows[0].evidence.selector, '#f0 small.weeks');
  assert.deepEqual(rows[0].basis, { form: 0, role: 'help', prop: 'fontFamily', value: 'Georgia', scope: 'form', dominant: { value: 'Inter', members: 10, of: 11, roles: ['label', 'field', 'control', 'help'] },
    thresholds: { minMembers: 4, dominant: 0.75, minDominantRoles: 2 } });
  const [more, moreEl] = glyphButton('⋯', 'Apple Symbols, serif');
  const healthy = renewState(renewForm({ controls: [more], elements: [moreEl], fields: [fieldOf('barcode', { sel: '#barcode', style: { fontFamily: MONO, fontSize: '14px' } })] }));
  assert.deepEqual(formFontOutlier(healthy), []);
  assert.deepEqual(formFontCoverage(healthy), { forms: 1, familyCompared: 1, sizeCompared: 2, members: { label: 4, field: 4, control: 1, option: 1, help: 2 },
    excluded: { glyph: 1, monospace: 1 }, notLocated: { label: 1, help: 0, control: 0 }, ambiguous: 0, roleConvention: 0, singleRoleFamily: 0 });
  const [word, wordEl] = glyphButton('More', 'Apple Symbols, serif', null);
  assert.match(formFontOutlier(renewState(renewForm({ controls: [word], elements: [wordEl] })))[0]?.what ?? '', /^Form text "More" \(control\) has fontFamily Apple Symbols; 11 of 12 /,
    'control: a word in that face is compared');
  const [bare, bareEl] = glyphButton('⋯', 'Apple Symbols, serif', null);
  assert.deepEqual(formFontOutlier(renewState(renewForm({ controls: [bare], elements: [bareEl] }))), [], 'a control text without a letter or digit is a glyph too');
  const mono = (family) => formFontOutlier(renewState(renewForm({ fields: [fieldOf('barcode', { sel: '#barcode', style: { fontFamily: family } })] }))).length;
  assert.deepEqual([mono(MONO), mono('"SF Mono", Menlo, monospace'), mono('Courier New')], [0, 0, 1], 'only a generic monospace family marks code text');
});

test('form fonts: sizes are compared within one role; dominance, member count and role convention each on both sides', () => {
  const smallHelp = renewState(renewForm({ help: { card: { style: { fontSize: '13px' } }, weeks: { style: { fontSize: '13px' } } } }));
  assert.deepEqual(formFontOutlier(smallHelp), [], 'help text smaller than labels is not compared with them');
  const labelSize = (n, odd) => renewState(renewForm({ labels: { [odd]: { style: { fontSize: '14px' } } },
    fields: n > 4 ? [fieldOf('extra', { sel: '#extra', label: { text: 'Branch', source: 'label-for' } })] : [],
    elements: n > 4 ? [el('Branch', { tag: 'label', sig: 'label', parentSig: 'div.field', sel: '#f0 label.extra' })] : [] }));
  const sizeRow = formFontOutlier(labelSize(4, 'card'));
  assert.equal(sizeRow.length, 1);
  assert.equal(sizeRow[0].what, 'Form text "Library card" (label) has fontSize 14px; 3 of 4 text-field labels of its form have 16px; icon glyphs and monospace text are not compared; '
    + 'low confidence: a designed face for one element is a legitimate dismissal; membership is inferred from saved text and counts, not exact DOM ownership');
  assert.deepEqual(sizeRow[0].basis.scope, 'label:text');
  const threeLabels = renewState({ ...renewForm({ labels: { card: { style: { fontSize: '14px' } } } }), elements: renewForm({ labels: { card: { style: { fontSize: '14px' } } } }).elements.filter((e) => e.sel !== '#f0 label.note') });
  assert.deepEqual(formFontOutlier(threeLabels).filter((r) => r.basis.prop === 'fontSize'), [], 'three labels are too few');
  const family = (odd) => renewState(renewForm({ labels: Object.fromEntries(odd.map((k) => [k, { style: { fontFamily: 'Georgia, serif' } }])) }));
  assert.equal(formFontOutlier(family(['card', 'title'])).length, 2, '9 of 11 >= 0.75');
  assert.deepEqual(formFontOutlier(family(['card', 'title', 'weeks'])), [], '8 of 11 < 0.75 (and all-but-one labels share it)');
  const tiny = state('tiny', `${LOANS}/tiny`, { formCount: 1, fields: [fieldOf('card', { label: { text: 'Card', source: 'label-for' } }), fieldOf('pin', { label: { text: 'PIN', source: 'label-for' } })],
    elements: [el('Card', { tag: 'label', sig: 'label', sel: '#l1', style: { fontFamily: 'Georgia, serif' } })] });
  assert.deepEqual(formFontOutlier(tiny), [], 'three members are too few');
  const TREBUCHET = 'Trebuchet MS, sans-serif';
  const buttons = (secondFamily) => {
    const parts = renewForm({ controls: [submitOf('Cancel', { type: 'button', sel: '#cancel', sig: 'button.renew-cancel', style: { fontFamily: secondFamily } })],
      elements: [el('Cancel', { tag: 'button', sig: 'button.renew-cancel', sel: '#cancel', style: { fontFamily: secondFamily } })] });
    const trebuchet = (x) => (x.sel === '#renew0' ? { ...x, style: { ...x.style, fontFamily: TREBUCHET } } : x);
    return renewState({ ...parts, elements: parts.elements.map(trebuchet), controls: parts.controls.map(trebuchet) });
  };
  const conventional = buttons(TREBUCHET);
  assert.deepEqual(formFontOutlier(conventional), [], 'every control of the form shares one other face: a role convention');
  assert.equal(formFontCoverage(conventional).roleConvention, 2);
  assert.equal(formFontOutlier(buttons(INTER)).length, 1, 'control: one of two controls in another face');
});

test('form fonts: families are compared by their first listed family, and a dominant family must span two roles of the form', () => {
  const uaInputs = (labelFamily) => state('ua', `${LOANS}/ua`, { formCount: 1,
    fields: ['card', 'title', 'pin'].map((n) => fieldOf(n, { label: { text: n === 'card' ? 'Name' : n, source: 'label-for' }, style: { fontFamily: 'Helvetica' } })),
    elements: [el('Name', { tag: 'label', sig: 'label', sel: '#name-label', style: { fontFamily: labelFamily } })] });
  assert.deepEqual(formFontOutlier(uaInputs('Helvetica, Arial, sans-serif')), [], 'the default face of inputs and a page stack starting with it are one family');
  assert.deepEqual(formFontOutlier(uaInputs('Inter, sans-serif')), [], 'the dominant family is held by fields only: their convention, not the form\'s');
  assert.deepEqual([formFontCoverage(uaInputs('Inter, sans-serif')).singleRoleFamily, formFontCoverage(uaInputs('Helvetica, Arial, sans-serif')).singleRoleFamily], [1, 0], 'and is counted');
  assert.match(formFontOutlier(uaInputs('Inter, sans-serif'), { minDominantRoles: 1 })[0]?.what ?? '', /^Form text "Name" \(label\) has fontFamily Inter; 3 of 4 /, 'control: the guard is what holds it back');
  const quoted = renewState(renewForm({ help: { weeks: { style: { fontFamily: '"Inter", system-ui' } } } }));
  assert.deepEqual(formFontOutlier(quoted), [], 'quotes and the rest of the list do not matter');
  const pooledFamily = (odd) => pooledPropertySpread(fourPages(title(NAVY, { style: { fontFamily: odd } })));
  assert.deepEqual([pooledFamily('Inter').outliers.length, pooledFamily('Georgia, serif').outliers.length], [0, 1], 'pooled families compare the same way');
  assert.match(pooledFamily('Georgia, serif').outliers[0].what, /have fontFamily Georgia in fines; 3 of 4 pooled states \(on 3 routes\) have fontFamily Inter;/);
});

test('form fonts: each member rule on both sides', () => {
  const georgia = { style: { fontFamily: 'Georgia, serif' } };
  const lone = renewState({ ...renewForm(), elements: renewForm().elements.map((e) => (e.sel === '#renew0' ? { ...e, ...georgia } : e)) });
  assert.match(formFontOutlier(lone)[0]?.what ?? '', /^Form text "Renew loan" \(control\) has fontFamily Georgia;/, 'a role with one member sets no convention');
  const closeButton = (glyph) => renewForm({ controls: [submitOf('✕ Close', { type: 'button', sig: 'button.close', sel: '#close' })],
    elements: [el('✕', { tag: 'button', sig: 'button.close', sel: '#close', style: { fontFamily: 'Apple Symbols' }, ...(glyph ? { glyph: { peers: true, whole: false } } : {}) })] });
  assert.deepEqual([formFontOutlier(renewState(closeButton(true))).length, formFontOutlier(renewState(closeButton(false))).length], [0, 1],
    'a control whose own text is a glyph is left out even when its name has words');
  const helpIcon = (glyph) => renewState({ ...renewForm({ elements: [el('?', { tag: 'span', sig: 'span.tip', sel: '#tip', style: { fontFamily: 'Apple Symbols' }, ...(glyph ? { glyph: { peers: false, whole: false } } : {}) })] }),
    fields: renewForm().fields.map((f) => (f.name === 'title' ? { ...f, hint: '?', hintSource: 'aria-describedby' } : f)) });
  assert.deepEqual([formFontOutlier(helpIcon(true)).length, formFontOutlier(helpIcon(false)).length], [0, 1], 'a help glyph is left out');
  const mono = (family) => formFontOutlier(renewState(renewForm({ fields: [fieldOf('barcode', { sel: '#barcode', style: { fontFamily: family } })] }))).length;
  assert.deepEqual([mono('ui-monospace, Menlo'), mono('Menlo, monospace'), mono('Menlo')], [0, 0, 1]);
  const named = (tag) => { const parts = renewForm(); return renewState({ ...parts, elements: parts.elements.map((e) => (e.sel === '#f0 label.card' ? { ...e, tag, sig: tag, ...georgia } : e)) }); };
  assert.deepEqual([formFontOutlier(named('p')).length, formFontOutlier(named('label')).length], [0, 1], 'only a label element is located by a for or wrapping label text');
  const valueButton = renewState(renewForm({ controls: [submitOf('Hold', { tag: 'input', type: 'submit', sel: '#hold', name: { text: 'Hold', source: 'value' }, ...georgia })] }));
  assert.match(formFontOutlier(valueButton)[0]?.what ?? '', /^Form text "Hold" \(control\) has fontFamily Georgia;/, 'an input draws its own value text');
  const valueGlyph = renewState(renewForm({ controls: [submitOf('+', { tag: 'input', type: 'button', sel: '#add', name: { text: '+', source: 'value' }, ...georgia })] }));
  assert.deepEqual([formFontOutlier(valueGlyph), formFontCoverage(valueGlyph).excluded.glyph], [[], 1], 'an input whose value has no letter or digit is a glyph');
  const split = renewState({ ...renewForm(), fields: renewForm().fields.map((f) => (f.name === 'weeks' ? { ...f, options: [{ text: '1', fontSize: '16px' }, { text: '2', fontSize: '13px' }] } : f)) });
  assert.equal(formFontCoverage(split).members.option, 0, 'options without a size most of them share give no member');
  const ariaButton = renewState(renewForm({ controls: [submitOf('Hold', { tag: 'input', type: 'submit', sel: '#hold', name: { text: 'Hold', source: 'aria-label' }, ...georgia })] }));
  assert.deepEqual(formFontOutlier(ariaButton), [], 'a name from aria-label is not drawn text');
  const trap = (x) => renewState(renewForm({ fields: [fieldOf('website', { sel: '#website', rect: { x, y: 0, w: 200, h: 38 }, ...georgia })] }));
  assert.deepEqual([formFontOutlier(trap(-9999)).length, formFontOutlier(trap(100)).length], [0, 1], 'a field parked off the page is not a member');
});

test('form fonts: members are located only through facts; ambiguous, unlocated, inactive and out-of-form texts are not compared', () => {
  const georgia = { style: { fontFamily: 'Georgia, serif' } };
  const twoForms = state('two', `${LOANS}/two`, { ...renewForm({ help: { weeks: georgia } }),
    fields: [...renewForm().fields, ...renewForm({ form: 1 }).fields], controls: renewForm().controls, formCount: 2 });
  assert.deepEqual(formFontOutlier(twoForms), [], 'the help text names fields of two forms: ambiguous');
  assert.equal(formFontCoverage(twoForms).ambiguous, 6);
  const nested = renewState({ ...renewForm(), fields: renewForm().fields.map((f) => (f.name === 'card' ? { ...f, label: { text: 'Library card *', source: 'label-for' } } : f)) });
  assert.deepEqual(formFontCoverage(nested).notLocated, { label: 1, help: 0, control: 0 }, 'a label whose text holds a child element is not located');
  const childText = renewState({ ...renewForm(), elements: renewForm().elements.filter((e) => e.sel !== '#renew0') });
  assert.deepEqual(formFontCoverage(childText).notLocated, { label: 0, help: 0, control: 1 }, 'a control whose text sits in a child element');
  assert.deepEqual(formFontOutlier(renewState(renewForm({ help: { weeks: { ...georgia, inactive: true } } }))), []);
  const offForm = renewState({ ...renewForm({ help: { weeks: georgia } }), fields: renewForm().fields.map((f) => ({ ...f, form: -1 })), controls: [] });
  assert.deepEqual(formFontOutlier(offForm), [], 'fields outside any form');
  const disabled = renewState({ ...renewForm({ help: { weeks: georgia } }), fields: renewForm().fields.map((f) => (f.name === 'weeks' ? { ...f, disabled: true } : f)) });
  assert.deepEqual(formFontOutlier(disabled), [], 'the help text of a disabled field');
  const keyed = formFontOutlier(renewState(renewForm({ help: { weeks: georgia } })));
  assert.deepEqual(runDetectors([renewState(renewForm({ help: { weeks: georgia } }), 'a'), renewState(renewForm({ help: { weeks: georgia } }), 'b')], { pooled: true })
    .filter((c) => c.detector === 'form-font').map((c) => c.states), [['a', 'b']], 'the same member merges across states');
  assert.equal(keyed.length, 1);
});

// D-B status tags: look-alike siblings of one signature.
const tagOf = (i, over = {}) => el(over.text ?? 'Online', { sel: `#s${i} > span.status-tag`, tag: 'span', sig: 'span.status-tag', parentSig: 'li.sensor', bg: { kind: 'solid', color: MINT }, ...over,
  style: { color: GREEN, display: 'inline-block', ...over.style } });
const tagState = (tags, extra = {}) => state('tags', `${SENSORS}/tags`, { elements: tags, ...extra });
const colours = (list) => list.map((c, i) => tagOf(i, { style: { color: c } }));

test('sibling colours: one status tag of six differs: a low-confidence candidate with its basis; three tags and a two-colour alternating pattern give none', () => {
  const rows = siblingColorDrift(tagState(colours([GREEN, GREEN, GREEN, BLUE, GREEN, GREEN])));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].detector, 'sibling-color'); assert.equal(rows[0].confidence, 'low'); assert.equal(rows[0].severity, 'low');
  assert.equal(rows[0].what, 'Look-alike item "Online" has color rgb(30, 90, 140); 5 of 5 other items of its kind in this state have rgb(30, 110, 60), 5 of them with the same text; '
    + 'low confidence: a status colour or a designed state is a legitimate dismissal');
  assert.equal(rows[0].evidence.selector, '#s3 > span.status-tag');
  assert.deepEqual(rows[0].basis, { kind: 'li.sensor>span.status-tag', prop: 'color', value: BLUE, dominant: { value: GREEN, members: 5, of: 5 }, group: 6, sameTextWithDominant: 5,
    thresholds: { minGroup: 4, share: 0.75, minCluster: 2, minVariantProps: 2 } });
  assert.deepEqual(siblingColorDrift(tagState(colours([GREEN, BLUE, GREEN]))), [], 'three tags');
  assert.equal(siblingColorDrift(tagState(colours([GREEN, BLUE, GREEN, GREEN]))).length, 1, 'four tags');
  assert.deepEqual(siblingColorDrift(tagState(colours([GREEN, BLUE, GREEN, BLUE, GREEN, BLUE]))), [], 'alternating three and three');
  assert.deepEqual(siblingColorDrift(tagState(colours([GREEN, BLUE, GREEN, BLUE, GREEN]))), [], 'alternating three and two: the odd colour is shared');
  assert.equal(siblingColorDrift(tagState(colours([GREEN, BLUE, GREEN, BLUE, GREEN])), { minCluster: 3 }).length, 2, 'control: the shared-value guard is what holds them back');
  assert.deepEqual(siblingColorDrift(tagState(colours([GREEN, BLUE, GREY, RED, NAVY, SAND]))), [], 'a palette of distinct colours: the others do not agree');
  assert.equal(siblingColorDrift(tagState(colours([GREEN, GREEN, GREEN, GREEN, BLUE, GREY]))).length, 2, 'others of BLUE: 4 of 5 agree');
  assert.deepEqual(siblingColorDrift(tagState(colours([GREEN, GREEN, GREEN, BLUE, GREY, RED]))), [], 'others: 3 of 5 agree');
  assert.equal(siblingColorDrift(tagState(colours([GREEN, GREEN, GREEN, BLUE, GREY]))).length, 2, 'others: 3 of 4 = 0.75 agree');
  assert.deepEqual(siblingColorDrift(tagState(colours([GREEN, GREEN, GREEN, GREEN, GREEN, BLUE, GREY, RED]))), [], 'others: 5 of 7 < 0.75 agree');
  const text = siblingColorDrift(tagState([...colours([GREEN, GREEN, GREEN, GREEN, GREEN]), tagOf(9, { text: 'Offline', style: { color: BLUE } })]));
  assert.equal(text[0]?.basis.sameTextWithDominant, 0, 'the basis says no other item with its text has the usual colour');
});

test('sibling colours: backgrounds, variants, interactive, glyph and inactive items', () => {
  const bgRows = siblingColorDrift(tagState(Array.from({ length: 5 }, (_, i) => tagOf(i, i === 2 ? { bg: { kind: 'solid', color: SAND } } : {}))));
  assert.match(bgRows[0]?.what ?? '', /^Look-alike item "Online" has background rgb\(250, 240, 220\); 4 of 4 other items/);
  assert.deepEqual(siblingColorDrift(tagState(Array.from({ length: 5 }, (_, i) => tagOf(i, i === 2 ? { bg: { kind: 'solid', color: SAND, assumed: true } } : {})))), [], 'an assumed page white is unknown');
  assert.equal(siblingColorCoverage(tagState(Array.from({ length: 5 }, (_, i) => tagOf(i, i === 2 ? { bg: { kind: 'layer' } } : {})))).backgroundUnknown, 1);
  const variant = (over) => siblingColorDrift(tagState(Array.from({ length: 6 }, (_, i) => tagOf(i, i === 2 ? over : {}))));
  assert.deepEqual(variant({ style: { color: BLUE }, bg: { kind: 'solid', color: SAND } }), [], 'colour and background: a designed state');
  assert.deepEqual(variant({ style: { color: BLUE, fontWeight: '700' } }), [], 'colour and weight: emphasis');
  assert.equal(siblingColorDrift(tagState(Array.from({ length: 6 }, (_, i) => tagOf(i, i === 2 ? { style: { color: BLUE, fontWeight: '700' } } : {}))), { minVariantProps: 3 }).length, 1, 'control');
  const links = (tag) => tagState(Array.from({ length: 6 }, (_, i) => tagOf(i, { tag, style: { color: i === 2 ? BLUE : GREEN } })));
  assert.deepEqual([siblingColorDrift(links('a')), siblingColorDrift(links('button')), siblingColorDrift(links('summary'))], [[], [], []], 'interactive items mark the current item by colour');
  assert.equal(siblingColorDrift(links('span')).length, 1, 'control');
  const controlled = tagState(colours([GREEN, GREEN, BLUE, GREEN, GREEN, GREEN]), { controls: [{ sel: '#s2 > span.status-tag', tag: 'span', name: { text: 'Online', source: 'text' }, form: -1, inactive: false, disabled: false }] });
  assert.deepEqual(siblingColorDrift(controlled), [], 'an item that is itself a control (role=button)');
  const inLink = tagState(colours([GREEN, GREEN, BLUE, GREEN, GREEN, GREEN]), { controls: [{ sel: '#s2', tag: 'a', name: { text: 'Online', source: 'text' }, form: -1, inactive: false, disabled: false }] });
  assert.deepEqual(siblingColorDrift(inLink), [], 'an item inside a link');
  assert.deepEqual(siblingColorCoverage(inLink), { groupsCompared: 1, groupsSmall: 0, interactive: 1, glyph: 0, backgroundUnknown: 0 });
  const stars = tagState(Array.from({ length: 5 }, (_, i) => tagOf(i, { text: '★', glyph: { peers: false, whole: false }, style: { color: i < 4 ? GREEN : GREY } })));
  assert.deepEqual(siblingColorDrift(stars), [], 'rating stars are glyphs');
  for (const over of [{ inactive: true }, { disabled: true }, { opacity: 0 }]) {
    assert.deepEqual(siblingColorDrift(tagState(Array.from({ length: 5 }, (_, i) => tagOf(i, i === 2 ? { ...over, style: { color: BLUE } } : {})))), [], JSON.stringify(over));
  }
  const long = 'Online since the spring calibration of every probe in the north propagation house';
  assert.deepEqual(siblingColorDrift(tagState(Array.from({ length: 5 }, (_, i) => tagOf(i, { text: long, style: { color: i === 2 ? BLUE : GREEN } })))), []);
  assert.deepEqual(siblingColorCoverage(tagState(colours([GREEN, BLUE, GREEN]))), { groupsCompared: 0, groupsSmall: 1, interactive: 0, glyph: 0, backgroundUnknown: 0 });
});

test('form fonts and sibling colours: a text located twice is one member; table cells, lone items and values unknown on every other item are not compared', () => {
  // D-B probe search: the query field is labelled by its own search button (aria-labelledby), so one element is both a label and a control's text.
  const search = (style = {}) => {
    const parts = renewForm({ fields: [fieldOf('query', { sel: '#query', label: { text: 'Search probes', source: 'aria-labelledby' } })],
      controls: [submitOf('Search probes', { type: 'button', sel: '#search-btn', sig: 'button.search', style })],
      elements: [el('Search probes', { tag: 'button', sig: 'button.search', parentSig: 'form.renew', sel: '#search-btn', style })] });
    return state('probes', `${SENSORS}/probes`, parts);
  };
  assert.deepEqual(formFontCoverage(search()).members, { label: 5, field: 5, control: 1, option: 1, help: 2 }, 'the button is counted once, as the label it is found as first');
  const odd = formFontOutlier(search({ fontFamily: 'Georgia, serif' }));
  assert.deepEqual(odd.map((r) => [r.basis.role, r.evidence.selector]), [['label', '#search-btn']], 'and gives one row');
  const cells = (tag) => tagState(Array.from({ length: 6 }, (_, i) => tagOf(i, { tag, sig: `${tag}.reading`, parentSig: 'tr.probe', text: '21.4', style: { color: i === 2 ? RED : GREEN } })));
  assert.deepEqual([siblingColorDrift(cells('td')), siblingColorDrift(cells('span')).length], [[], 1], 'table cells carry data colours, as in the in-state style detector');
  const lone = tagState([...colours([GREEN, GREEN, GREEN, GREEN, GREEN, GREEN]), el('Greenhouse north')]);
  assert.deepEqual(siblingColorCoverage(lone), { groupsCompared: 1, groupsSmall: 0, interactive: 0, glyph: 0, backgroundUnknown: 0 }, 'a lone item is no group');
  const translucent = { kind: 'translucent', color: 'rgba(30, 110, 60, 0.15)' };
  const onlyKnown = tagState(Array.from({ length: 6 }, (_, i) => tagOf(i, i === 2 ? { style: { color: BLUE } } : { bg: translucent })));
  assert.deepEqual(siblingColorDrift(onlyKnown).map((r) => [r.basis.prop, r.basis.value]), [['color', BLUE]],
    'a background unknown on every other item is no difference, so the colour alone is compared');
});

test('runDetectors and the report: pooled detectors run only when opted in; default output is unchanged and pooled rows carry their basis', () => {
  // A shelf whose one item is 15px gives a default low-severity `style` row, which sorts after the pooled detector names.
  const shelf = state('shelf', `${LOANS}/shelf`, { elements: Array.from({ length: 6 }, (_, i) => el(`Shelf ${i}`, { tag: 'li', sig: 'li.shelf-item', parentSig: 'ul.shelf', sel: `#shelf${i}`,
    style: i === 2 ? { fontSize: '15px' } : {} })) });
  const states = [...fourPages(), tagState(colours([GREEN, GREEN, GREEN, BLUE, GREEN, GREEN])), renewState(renewForm({ help: { weeks: { style: { fontFamily: 'Georgia, serif' } } } })), shelf];
  const plain = runDetectors(states);
  assert.ok(plain.some((c) => c.detector === 'style' && c.severity === 'low'), 'precondition: a low default row named after the pooled detectors');
  assert.deepEqual(runDetectors(states, { pooled: false }), plain);
  const NEW = ['pooled-outlier', 'form-font', 'sibling-color'];
  assert.ok(plain.every((c) => !NEW.includes(c.detector) && !('basis' in c)));
  const pooled = runDetectors(states, { pooled: true });
  assert.deepEqual(NEW.map((d) => pooled.filter((c) => c.detector === d).length), [1, 1, 1]);
  assert.ok(pooled.filter((c) => NEW.includes(c.detector)).every((c) => c.basis && c.confidence === 'low'));
  assert.deepEqual(pooled.filter((c) => !NEW.includes(c.detector)), plain, 'pooled adds rows and changes none, ids included');
  assert.deepEqual(pooled.slice(0, plain.length), plain, 'the default rows come first');
  assert.deepEqual(pooled.slice(plain.length).map((c) => c.id), ['P' + String(plain.length + 1).padStart(3, '0'), 'P' + String(plain.length + 2).padStart(3, '0'), 'P' + String(plain.length + 3).padStart(3, '0')],
    'pooled rows are numbered after them');
  assert.deepEqual(pooled.find((c) => c.detector === 'pooled-outlier').states, ['fines']);
  const md = toMarkdown(plain, states);
  assert.equal(toMarkdown(plain, states, { pooled: false }), md);
  assert.doesNotMatch(md, /Pooled/);
  const unit = (c, i) => state(['north', 'south', 'east', 'west'][i], `${SENSORS}/${i}`, { elements: [el('°C', { tag: 'span', sig: 'span.unit', parentSig: 'div.reading', style: { color: c } })] });
  const pooledMd = toMarkdown(pooled, [...states, ...[GREY, GREY, GREEN, GREEN].map(unit)], { pooled: true });
  assert.match(pooledMd, /^## Pooled style \(opt-in\): spread rows and coverage, not candidates$/m);
  assert.match(pooledMd, /^Pooled properties: 2 pool\(s\) by origin, viewport width and role; 2 kind\(s\) seen in 2 or more states were compared, \d+ seen in one state were not; /m);
  assert.match(pooledMd, /^\| items "°C" \| color \| rgb\(90, 90, 90\) \(north, south\); rgb\(30, 110, 60\) \(east, west\) \| no clear majority \|$/m);
  assert.match(pooledMd, /^Form fonts: 1 form\(s\) with text-bearing members; /m);
  assert.match(pooledMd, /^Sibling colours: 3 group\(s\) of 4 or more look-alike items compared; /m);
  assert.ok(pooledMd.indexOf('## Pooled style') < pooledMd.indexOf('## Input partitions'), 'before the partition worklist');
});

// Review fixes. Interactive items: a current-page link coloured through aria-current or a utility class that baseSig strips sits under
// a path-keyed kind that holds one link per page, so colour, background and weight of links, buttons, controls and items inside a
// control are not compared; their family, size and alignment still are.
const ORANGE = 'rgb(200, 90, 0)';
const NAV = ['desk', 'renew', 'return', 'fines'];
const navItem = (k, text, over = {}) => el(text, { tag: 'a', sig: 'a.px-2.text-sm', parentSig: 'li', sel: `nav > ul > li:nth-of-type(${k}) > a`, ...over,
  style: { display: 'inline', ...over.style } });
const navPages = (current, { tag = 'a', extra = () => ({}) } = {}) => NAV.map((page, i) => state(page, `${LOANS}/${page}`, {
  elements: NAV.map((text, k) => navItem(k + 1, text[0].toUpperCase() + text.slice(1), { tag, ...(k === i ? { style: current } : {}) })), ...extra(page) }));

test('pooled items: a current-page link marked by colour (or colour and weight) on every page gives no row; family, size and alignment of links are still compared', () => {
  const sandCurrent = NAV.map((page, i) => state(page, `${LOANS}/${page}`, { elements: NAV.map((text, k) => navItem(k + 1, text, k === i ? { bg: { kind: 'solid', color: SAND } } : {})) }));
  for (const [name, pages] of [['colour', navPages({ color: ORANGE })], ['colour and weight', navPages({ color: ORANGE, fontWeight: '700' })], ['background', sandCurrent]]) {
    const r = pooledPropertySpread(pages);
    assert.deepEqual([r.outliers, r.spread], [[], []], name);
    assert.equal(r.coverage.interactiveItems, 16, 'four links on each of four pages');
  }
  const spans = pooledPropertySpread(navPages({ color: ORANGE }, { tag: 'span' }));
  assert.deepEqual(spans.outliers.map((c) => [c.basis.prop, c.evidence.state]), NAV.map((p) => ['color', p]), 'control: the same items as spans are compared');
  assert.equal(spans.coverage.interactiveItems, 0);
  const asControls = pooledPropertySpread(navPages({ color: ORANGE }, { tag: 'span',
    extra: () => ({ controls: NAV.map((t, k) => ({ sel: `nav > ul > li:nth-of-type(${k + 1}) > a`, tag: 'span', type: null, name: { text: t, source: 'text' }, form: -1, inactive: false, disabled: false })) }) }));
  assert.deepEqual([asControls.outliers, asControls.coverage.interactiveItems], [[], 16], 'an item that is itself a control (role=button)');
  const inside = NAV.map((page, i) => state(page, `${LOANS}/${page}`, {
    elements: NAV.map((text, k) => navItem(k + 1, text, { tag: 'span', sel: `nav > ul > li:nth-of-type(${k + 1}) > a > span`, ...(k === i ? { style: { color: ORANGE } } : {}) })),
    controls: NAV.map((t, k) => ({ sel: `nav > ul > li:nth-of-type(${k + 1}) > a`, tag: 'a', type: null, name: { text: t, source: 'text' }, form: -1, inactive: false, disabled: false })) }));
  assert.deepEqual(pooledPropertySpread(inside).outliers, [], 'an item inside a control');
  const sized = navPages({}).map((s, i) => (i === 3 ? { ...s, facts: { ...s.facts, elements: s.facts.elements.map((e, k) => (k === 1 ? { ...e, style: { ...e.style, fontSize: '15px' } } : e)) } } : s));
  assert.deepEqual(pooledPropertySpread(sized).outliers.map((c) => [c.basis.prop, c.evidence.state, c.basis.kind]), [['fontSize', 'fines', 'item|nav > ul > li:nth-of-type(2) > a']],
    'a link in another size on one page is still a candidate');
});

// Form members are located by text only when the text has one owner: fields of one form, all live. A field outside any form, or not
// live, owns its texts as "outside"; a text with more located elements than fields naming it cannot be told apart either.
const joinField = (name, labelText, over = {}) => fieldOf(name, { label: { text: labelText, source: 'label-for' }, sel: `#${name}`, ...over });
const joinLabel = (name, text, over = {}) => el(text, { tag: 'label', sig: 'label', parentSig: 'div.field', sel: `#join label.${name}`, ...over });
const JOIN = [['fullname', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['branch', 'Branch'], ['card', 'Card number']];
const joinForm = ({ fields = [], elements = [], labelSize = {} } = {}) => state('join', `${LOANS}/join`, { formCount: 1,
  fields: [...JOIN.map(([n, t]) => joinField(n, t)), ...fields],
  controls: [submitOf('Join', { sel: '#join-go' })],
  elements: [...JOIN.map(([n, t]) => joinLabel(n, t, labelSize[n] ? { style: { fontSize: labelSize[n] } } : {})), el('Join', { tag: 'button', sig: 'button.renew-submit', sel: '#join-go' }), ...elements] });
const small = (size) => ({ style: { fontSize: size } });

test('form fonts: a label outside the form, of a field in no form, that shares a form label\'s text is not pulled into the form', () => {
  const footer = joinForm({ fields: [joinField('nl', 'Email', { form: -1, sel: '#nl' })], elements: [joinLabel('nl', 'Email', { sel: 'footer label', ...small('12px') })] });
  assert.deepEqual(formFontOutlier(footer), []);
  const cov = formFontCoverage(footer);
  assert.deepEqual([cov.ambiguous, cov.members.label, cov.sizeCompared], [2, 4, 2], 'both Email labels are ambiguous; four labels are still compared');
  const ownFooter = joinForm({ elements: [joinLabel('nl', 'Newsletter', { sel: 'footer label', ...small('12px') })], fields: [joinField('nl', 'Newsletter', { form: -1, sel: '#nl' })] });
  assert.deepEqual([formFontOutlier(ownFooter), formFontCoverage(ownFooter).ambiguous], [[], 0], 'a footer label with its own text is simply not a member');
  assert.deepEqual([formFontCoverage(ownFooter).forms, formFontCoverage(ownFooter).members.label], [1, 5], 'and forms no group of its own');
  assert.match(formFontOutlier(joinForm({ labelSize: { email: '12px' } }))[0]?.what ?? '', /^Form text "Email" \(label\) has fontSize 12px; 4 of 5 text-field labels of its form/, 'control: the same label inside the form');
  const hidden = joinForm({ fields: [joinField('email2', 'Email', { sel: '#email2', inactive: true })], elements: [joinLabel('email2', 'Email', { sel: '#dialog label', ...small('12px') })] });
  assert.deepEqual([formFontOutlier(hidden), formFontCoverage(hidden).ambiguous], [[], 2], 'an inactive field naming the same text: ambiguous');
  const stray = joinForm({ elements: [joinLabel('stray', 'Email', { sel: 'aside label', ...small('12px') })] });
  assert.deepEqual([formFontOutlier(stray), formFontCoverage(stray).ambiguous], [[], 2], 'a second label element with the text of one field: ambiguous');
  const hint = (extra) => joinForm({ fields: JOIN.map(([n, t]) => joinField(`${n}h`, `${t} again`, { sel: `#${n}h`, hint: 'Optional', hintSource: 'next-sibling' })).slice(0, 2),
    elements: [el('Optional', { tag: 'small', sig: 'small', sel: '#h1' }), el('Optional', { tag: 'small', sig: 'small', sel: '#h2' }), el('Optional', { tag: 'small', sig: 'small', sel: '#h3', style: { fontFamily: 'Georgia, serif' } }), ...extra] });
  assert.deepEqual(formFontOutlier(hint([])), [], 'three elements read "Optional", two fields name it: none is located');
  assert.equal(formFontCoverage(hint([])).ambiguous, 3);
  const twoHints = joinForm({ fields: JOIN.slice(0, 2).map(([n, t]) => joinField(`${n}h`, `${t} again`, { sel: `#${n}h`, hint: 'Optional', hintSource: 'next-sibling' })),
    elements: [el('Optional', { tag: 'small', sig: 'small', sel: '#h1' }), el('Optional', { tag: 'small', sig: 'small', sel: '#h2', style: { fontFamily: 'Georgia, serif' } })] });
  assert.match(formFontOutlier(twoHints)[0]?.what ?? '', /^Form text "Optional" \(help text\) has fontFamily Georgia;/, 'control: two elements for two fields');
  const shared = joinForm({ fields: JOIN.slice(0, 2).map(([n, t]) => joinField(`${n}h`, `${t} again`, { sel: `#${n}h`, hint: 'Optional', hintSource: 'aria-describedby' })),
    elements: [el('Optional', { tag: 'small', sig: 'small', sel: '#h1', style: { fontFamily: 'Georgia, serif' } })] });
  assert.equal(formFontOutlier(shared).length, 1, 'one element shared by two fields is located');
  const sharedOutside = joinForm({ fields: [joinField('memo', 'Memo', { sel: '#memo', hint: 'Optional', hintSource: 'aria-describedby' }),
    joinField('nl', 'Newsletter', { sel: '#nl', form: -1, hint: 'Optional', hintSource: 'aria-describedby' })],
  elements: [el('Optional', { tag: 'small', sig: 'small', sel: '#opt', style: { fontFamily: 'Georgia, serif' } })] });
  assert.deepEqual([formFontOutlier(sharedOutside), formFontCoverage(sharedOutside).ambiguous], [[], 1], 'one element named by a form field and by a field in no form: ambiguous');
  const heading = joinForm({ labelSize: { email: '12px' }, elements: [el('Email', { tag: 'h2', sig: 'h2', sel: '#email-heading' })] });
  assert.equal(formFontOutlier(heading).length, 1, 'a heading with a label\'s text does not compete with the label element');
});

test('form fonts: sizes are compared within a role and sub-kind: submit buttons, other buttons and links apart; text-field labels apart from choice labels', () => {
  const signIn = (linkSize = '14px') => {
    const link = (text, sel) => [{ sel, tag: 'a', type: null, sig: 'a', name: { text, source: 'text' }, form: 0, rect: { x: 100, y: 300, w: 120, h: 18 }, disabled: false, inactive: false, style: { ...STYLE, fontSize: linkSize } },
      el(text, { tag: 'a', sig: 'a', parentSig: 'p.signin-help', sel, style: { fontSize: linkSize } })];
    const [forgot, forgotEl] = link('Forgot passcode?', '#forgot'); const [request, requestEl] = link('Request access', '#request');
    const show = submitOf('Show', { type: 'button', sel: '#show', sig: 'button.toggle', style: { fontSize: '14px' } });
    return state('signin', `${SENSORS}/signin`, { formCount: 1,
      fields: [fieldOf('operator', { label: { text: 'Operator ID', source: 'label-for' } }), fieldOf('passcode', { type: 'password', sel: '#passcode', label: { text: 'Passcode', source: 'label-for' } })],
      controls: [submitOf('Sign in', { sel: '#signin' }), show, forgot, request],
      elements: [el('Sign in', { tag: 'button', sig: 'button.renew-submit', sel: '#signin' }), el('Show', { tag: 'button', sig: 'button.toggle', sel: '#show', style: { fontSize: '14px' } }), forgotEl, requestEl] });
  };
  assert.deepEqual(formFontOutlier(signIn()), [], 'a 16px submit beside a 14px toggle and two 14px links');
  const subKinds = (st) => formFontCoverage(st).sizeCompared;
  assert.equal(subKinds(signIn()), 0, 'no sub-kind of control has four members');
  const fourLinks = (odd) => {
    const st = signIn(); const extra = ['Help', 'Status'].map((t, i) => ({ c: { ...st.facts.controls[2], sel: `#x${i}`, name: { text: t, source: 'text' } }, e: el(t, { tag: 'a', sig: 'a', sel: `#x${i}`, style: { fontSize: '14px' } }) }));
    const elements = [...st.facts.elements, ...extra.map((x) => x.e)].map((e) => (e.sel === '#forgot' ? { ...e, style: { ...e.style, fontSize: odd } } : e));
    return { ...st, facts: { ...st.facts, controls: [...st.facts.controls, ...extra.map((x) => x.c)], elements } };
  };
  assert.match(formFontOutlier(fourLinks('16px'))[0]?.what ?? '', /^Form text "Forgot passcode\?" \(control\) has fontSize 16px; 3 of 4 links of its form have 14px;/, 'control: links are compared with links');
  assert.equal(formFontOutlier(fourLinks('16px'))[0]?.basis.scope, 'control:link');
  const join = (boxSize) => joinForm({ fields: [fieldOf('agree', { type: 'checkbox', textLike: false, sel: '#agree', rect: { x: 100, y: 400, w: 13, h: 13 }, label: { text: 'I agree to the loan terms', source: 'label-wrap' } })],
    elements: [joinLabel('agree', 'I agree to the loan terms', { sel: '#join label.agree', ...small(boxSize) })] });
  assert.deepEqual(formFontOutlier(join('14px')), [], 'five 16px field labels and a 14px checkbox label');
  assert.equal(formFontCoverage(join('14px')).sizeCompared, 2, 'text-field labels and fields are compared; one checkbox label is no group');
  const boxes = (odd) => joinForm({ fields: ['a', 'b', 'c', 'd'].map((x, i) => fieldOf(`opt${x}`, { type: 'checkbox', textLike: false, sel: `#opt${x}`, rect: { x: 100, y: 400 + 20 * i, w: 13, h: 13 }, label: { text: `Notify by ${x}`, source: 'label-wrap' } })),
    elements: ['a', 'b', 'c', 'd'].map((x) => joinLabel(`opt${x}`, `Notify by ${x}`, { sel: `#join label.opt${x}`, ...small(x === 'd' ? odd : '14px') })) });
  assert.match(formFontOutlier(boxes('16px'))[0]?.what ?? '', /^Form text "Notify by d" \(label\) has fontSize 16px; 3 of 4 checkbox labels of its form have 14px;/, 'control: choice labels are compared with choice labels');
  const buttons = (odd) => {
    const extra = ['Paste', 'Clear', 'Scan'].map((t) => [submitOf(t, { type: 'button', sel: `#${t}`, sig: 'button.toggle', style: { fontSize: '14px' } }), el(t, { tag: 'button', sig: 'button.toggle', sel: `#${t}`, style: { fontSize: t === 'Scan' ? odd : '14px' } })]);
    const st = signIn();
    return { ...st, facts: { ...st.facts, controls: [...st.facts.controls, ...extra.map(([c]) => c)], elements: [...st.facts.elements, ...extra.map(([, e]) => e)] } };
  };
  assert.deepEqual(formFontOutlier(buttons('14px')), [], 'a 16px submit beside four 14px buttons: other sub-kinds');
  assert.match(formFontOutlier(buttons('16px'))[0]?.what ?? '', /^Form text "Scan" \(control\) has fontSize 16px; 3 of 4 buttons of its form have 14px;/, 'control: buttons with buttons');
  const typed = (type) => { const st = buttons('16px'); return formFontOutlier({ ...st, facts: { ...st.facts, controls: st.facts.controls.map((c) => (c.sel === '#Scan' ? { ...c, type } : c)) } }).length; };
  assert.deepEqual([typed('submit'), typed('BUTTON'), typed('reset'), typed(null)], [0, 1, 1, 0], 'a submit (or a button without a type) is not one of the other buttons; types in any case');
  const withInput = (() => { const st = buttons('16px'); const save = submitOf('Save', { tag: 'input', type: 'submit', sel: '#save', name: { text: 'Save', source: 'value' } });
    return { ...st, facts: { ...st.facts, controls: [...st.facts.controls, save] } }; })();
  assert.deepEqual(formFontOutlier(withInput).map((r) => [r.what.slice(0, 22), r.basis.scope]), [['Form text "Scan" (cont', 'control:button']], 'an input submit is a submit button');
  const order = (() => {
    const helps = ['a', 'b', 'c', 'd'].map((x) => [`Hint ${x}`, `#hint${x}`]);
    const st = joinForm({ labelSize: { phone: '12px' }, fields: helps.map(([t], i) => joinField(`h${i}`, `Hidden ${i}`, { sel: `#h${i}`, hint: t, hintSource: 'next-sibling' })) });
    const helpEls = helps.map(([t, sel], i) => el(t, { tag: 'small', sig: 'small', sel, style: { fontSize: i === 3 ? '11px' : '13px' } }));
    return { ...st, facts: { ...st.facts, elements: [...helpEls, ...st.facts.elements] } };
  })();
  assert.deepEqual(formFontOutlier(order).map((r) => r.basis.scope), ['label:text', 'help:help'], 'size rows in role order, whatever the element order');
});

test('pooled: an odd state whose route has a capture with the majority value is a state change on that route: a spread row, not a candidate', () => {
  const label = (color) => el('Email', { tag: 'label', sig: 'label.patron-label', parentSig: 'div.patron-field', sel: '#email-label', style: { color } });
  const page = (name, path, color = NAVY) => loansPage(name, path, [label(color)]);
  const base = [page('profile-a', '/profile/a'), page('profile-b', '/profile/b'), page('profile-c', '/profile/c')];
  const after = pooledPropertySpread([...base, page('profile-a-error', '/profile/a', RED)]);
  assert.deepEqual(after.outliers, []);
  assert.deepEqual(after.spread.map((r) => [r.prop, r.reason, r.sameRoute, r.variants, r.distribution]), [['color', 'state-change-on-route', ['profile-a-error'], [],
    [{ value: NAVY, states: ['profile-a', 'profile-b', 'profile-c'] }, { value: RED, states: ['profile-a-error'] }]]]);
  assert.deepEqual(pooledPropertySpread([...base, page('profile-a-retry', '/profile/a?attempt=2', RED)]).spread.map((r) => r.reason), ['state-change-on-route'], 'query values are dropped');
  assert.deepEqual(pooledPropertySpread([...base, page('profile-d', '/profile/d', RED)]).outliers.map((c) => c.evidence.state), ['profile-d'], 'control: another route');
  const more = ['d', 'e', 'f'].map((x) => page(`profile-${x}`, `/profile/${x}`));
  const both = pooledPropertySpread([...base, ...more, page('profile-a-error', '/profile/a', RED), page('profile-g', '/profile/g', RED)]);
  assert.deepEqual(both.outliers.map((c) => [c.evidence.state, c.basis.sameRoute]), [['profile-g', ['profile-a-error']]], 'another odd state is still named');
  assert.deepEqual(both.spread.map((r) => [r.reason, r.sameRoute]), [['state-change-on-route', ['profile-a-error']]]);
  assert.match(toMarkdown([], [...base, page('profile-a-error', '/profile/a', RED)], { pooled: true }),
    /^\| items "Email" \| color \| rgb\(31, 58, 95\) \(profile-a, profile-b, profile-c\); rgb\(138, 31, 31\) \(profile-a-error\) \| a capture of the same route has the majority value: profile-a-error \|$/m);
});

test('pooled: whether an odd state is a candidate or a variant does not depend on capture order', () => {
  const look = (name, weight, color, size = '16px') => loansPage(name, `/${name}`, [title(color, { style: { fontWeight: weight, fontSize: size } })]);
  const permutations = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
  const norm = (r) => JSON.stringify([r.outliers.map((c) => [c.key, c.evidence.state]).sort(),
    r.spread.map((s) => [s.kind, s.prop, s.reason, [...s.variants].sort(), [...(s.sameRoute ?? [])].sort(), s.distribution.map((d) => [d.value, [...d.states].sort()]).sort()]).sort()]);
  const tie = [look('desk', '400', NAVY), look('renew', '700', NAVY), look('return', '400', NAVY), look('fines', '700', RED)];
  const outcomes = new Set(permutations(tie).map((p) => norm(pooledPropertySpread(p))));
  assert.equal(outcomes.size, 1, [...outcomes].join('\n'));
  const r = pooledPropertySpread(tie);
  assert.deepEqual(r.outliers.map((c) => [c.basis.prop, c.evidence.state]), [['color', 'fines']], 'a tied weight is no second difference');
  assert.deepEqual(r.spread.map((s) => [s.prop, s.reason]), [['fontWeight', 'no-clear-majority']]);
  const unique = [look('desk', '400', NAVY, '16px'), look('renew', '400', NAVY, '16px'), look('return', '400', NAVY, '18px'), look('fines', '400', RED, '20px')];
  assert.equal(new Set(permutations(unique).map((p) => norm(pooledPropertySpread(p)))).size, 1);
  assert.deepEqual(pooledPropertySpread(unique).outliers, [], 'a value no other state holds is a second difference even without a clear majority');
  assert.deepEqual(pooledPropertySpread(unique).spread.map((s) => [s.prop, s.reason, s.variants]), [['fontSize', 'no-clear-majority', []], ['color', 'multi-property-variant', ['fines']]]);
});

test('pooled guards the mutants reached: primary action choice, unparseable URLs beside file pages, the distribution order, the odd state\'s own text', () => {
  const twoButtons = (name, w) => state(name, `${LOANS}/${name}`, { formCount: 1, fields: [fieldOf('card')],
    controls: [submitOf('Clear', { type: 'button', sel: '#clear', rect: { x: 100, y: 260, w, h: 38 } }), submitOf('Check', { type: 'button', sel: '#check', rect: { x: 100, y: 200, w: 360, h: 38 } })] });
  const noPrimary = pooledPropertySpread([twoButtons('a', 360), twoButtons('b', 360), twoButtons('c', 360), twoButtons('d', 144)]);
  assert.deepEqual([noPrimary.outliers, noPrimary.coverage.kindsCompared], [[], 1], 'two plain buttons and no submit: no primary action');
  const twoSubmits = (name, upper, lower) => state(name, `${LOANS}/${name}`, { formCount: 1, fields: [fieldOf('card')],
    controls: [submitOf('Renew loan', { sel: '#renew', rect: { x: 100, y: 260, w: lower, h: 38 } }), submitOf('Save draft', { sel: '#draft', rect: { x: 100, y: 200, w: upper, h: 38 } })] });
  const agree = ['a', 'b', 'c'].map((x) => twoSubmits(x, 360, 360));
  assert.deepEqual(pooledPropertySpread([...agree, twoSubmits('d', 144, 360)]).outliers, [], 'the upper of two submits is not the primary action');
  assert.match(pooledPropertySpread([...agree, twoSubmits('d', 360, 144)]).outliers[0]?.what ?? '', /^Pooled primary actions "Renew loan" have width 40% /, 'the last one is');
  const native = renewState(renewForm({ controls: [submitOf('Submit', { tag: 'input', type: 'submit', sel: '#native', name: { text: 'Submit', source: 'native-default' }, style: { fontFamily: 'Georgia, serif' } })] }));
  assert.match(formFontOutlier(native)[0]?.what ?? '', /^Form text "Submit" \(control\) has fontFamily Georgia;/, 'an input submit without a value draws its native default text');
  const FILES = 'file:///fixtures';
  const files = [...['a', 'b', 'c'].map((x) => state(x, `${FILES}/${x}.html`, { elements: [title(NAVY)] })), state('d', 'not a url', { elements: [title(RED)] })];
  const r = pooledPropertySpread(files);
  assert.deepEqual([r.outliers, r.coverage.pools, r.coverage.statesNotPooled, r.coverage.kindsCompared], [[], 1, 1, 1], 'an unparseable URL is not pooled with file pages (origin "null")');
  const order = pooledPropertySpread([loansPage('a', '/a', [title(GREEN)]), loansPage('b', '/b', [title(GREY)]), loansPage('c', '/c', [title(GREY)])]);
  assert.deepEqual(order.spread.map((s) => s.distribution), [[{ value: GREY, states: ['b', 'c'] }, { value: GREEN, states: ['a'] }]], 'the most held value first');
  const own = pooledPropertySpread(fourPages(el('Fines due', { style: { color: RED } })));
  assert.match(own.outliers[0]?.what ?? '', /^Pooled items "Fines due" have color rgb\(138, 31, 31\) in fines;/, 'the odd state names its own text');
  const bg = (text, b) => title(NAVY, { text, sel: `#${slug(text)}`, bg: b });
  const spread = pooledPropertySpread([loansPage('a', '/a', [bg('Desk notice', { kind: 'layer' })]), loansPage('b', '/b', [bg('Renew notice', WHITE)]), loansPage('c', '/c', [bg('Return notice', { kind: 'solid', color: SAND })])]);
  assert.deepEqual(spread.spread.map((s) => [s.prop, s.subject, s.example.state]), [['background', 'items "Renew notice"', 'b']], 'a spread row names the text of its example');
});

test('sibling colours say how many of the agreeing items share the odd item\'s text', () => {
  const offline = siblingColorDrift(tagState([...colours([GREEN, GREEN, GREEN, GREEN, GREEN]), tagOf(9, { text: 'Offline', style: { color: BLUE } })]));
  assert.match(offline[0]?.what ?? '', /have rgb\(30, 110, 60\), none of them with the same text; low confidence/);
  const two = siblingColorDrift(tagState([...colours([GREEN, GREEN, GREEN]), tagOf(7, { text: 'Offline' }), tagOf(8, { text: 'Offline' }), tagOf(9, { text: 'Offline', style: { color: BLUE } })]));
  assert.match(two[0]?.what ?? '', /5 of 5 other items of its kind in this state have rgb\(30, 110, 60\), 2 of them with the same text;/);
});

test('detect plumbing: one pooled-property result feeds the rows and the summary; the report caps its spread table and counts what it leaves out', async () => {
  const { pooledSummary } = await import('../tools/passive-capture/detect.mjs');
  const pages = fourPages();
  const empty = { outliers: [], spread: [], coverage: pooledPropertySpread([]).coverage };
  assert.equal(runDetectors(pages, { pooled: true }).filter((c) => c.detector === 'pooled-outlier').length, 1, 'control');
  assert.deepEqual(runDetectors(pages, { pooled: true, pooledProperty: empty }).filter((c) => c.detector === 'pooled-outlier'), [], 'a given result is used, not recomputed');
  assert.equal(pooledSummary(pages, empty).coverage.properties, empty.coverage);
  const many = (color) => Array.from({ length: 45 }, (_, i) => el(`Reading ${i}`, { tag: 'span', sig: `span.kind${i}`, parentSig: 'div.bench', sel: `#r${i}`, style: { color } }));
  const benches = [state('north', `${SENSORS}/north`, { elements: many(GREY) }), state('south', `${SENSORS}/south`, { elements: many(GREEN) })];
  const summary = pooledSummary(benches);
  assert.equal(summary.spread.length, 45, 'the json keeps every spread row');
  const md = toMarkdown([], benches, { pooled: true, summary });
  assert.equal(md.split('\n').filter((l) => /^\| items "Reading \d+" \|/.test(l)).length, 40);
  assert.match(md, /^5 more spread row\(s\) are not shown here; candidates\.json lists all 45 under pooled\.spread\.$/m);
  assert.equal(toMarkdown([], benches, { pooled: true }), md, 'the summary is computed when not given');
  assert.match(toMarkdown([], benches, { pooled: true, summary: { ...summary, spread: [] } }), /^No spread row\.$/m, 'a given summary is used');
  assert.match(toMarkdown([], navPages({ color: ORANGE }), { pooled: true }), /; 16 interactive item\(s\) \(links, buttons, controls and items inside one\) were compared without colour, background and weight/);
});

const withTempDir = async (prefix, fn) => { const dir = await mkdtemp(join(tmpdir(), prefix)); try { return await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); } };
const writeStates = async (dir, states) => {
  await mkdir(join(dir, 'passive'), { recursive: true });
  for (const s of states) {
    await writeFile(join(dir, 'passive', `${s.label}.facts.json`), JSON.stringify(s.facts));
    await writeFile(join(dir, 'passive', `${s.label}.axe.json`), JSON.stringify(NO_AXE));
  }
  await writeFile(join(dir, 'passive', 'index.jsonl'), states.map((s) => `${JSON.stringify({ label: s.label, url: s.url })}\n`).join(''));
};

test('detect.mjs --pooled: opt-in rows, a pooled section in the json and report; without the flag the output keeps its shape', async () => {
  await withTempDir('passive-pooled-cli-', async (dir) => {
    await writeStates(dir, fourPages());
    await writeFile(join(dir, 'words.txt'), 'your\nloans\n');
    const run = (...args) => spawnSync(process.execPath, [DETECT, dir, ...args], { encoding: 'utf8' });
    const read = async () => [await readFile(join(dir, 'passive', 'candidates.json'), 'utf8'), await readFile(join(dir, 'passive', 'candidates.md'), 'utf8'),
      await readFile(join(dir, 'passive', 'partitions.json'), 'utf8')];
    const plainRun = run(); assert.equal(plainRun.status, 0, plainRun.stderr);
    const [plainJson, plainMd, plainPartitions] = await read();
    assert.deepEqual(Object.keys(JSON.parse(plainJson)), ['states', 'count', 'contrastCoverage', 'reached', 'duplicateLabels', 'rareVariant', 'candidates']);
    assert.ok(JSON.parse(plainJson).candidates.every((c) => c.detector !== 'pooled-outlier'));
    assert.doesNotMatch(plainMd, /Pooled/); assert.equal(JSON.parse(plainRun.stdout).pooled, undefined);
    const pooledRun = run('--pooled'); assert.equal(pooledRun.status, 0, pooledRun.stderr);
    const [json, md, partitions] = await read();
    assert.deepEqual(Object.keys(JSON.parse(json)), ['states', 'count', 'contrastCoverage', 'reached', 'duplicateLabels', 'rareVariant', 'candidates', 'pooled']);
    const parsed = JSON.parse(json);
    assert.deepEqual(parsed.candidates.filter((c) => c.detector === 'pooled-outlier').map((c) => [c.states, c.basis.prop]), [[['fines'], 'color']]);
    assert.deepEqual(Object.keys(parsed.pooled), ['spread', 'coverage']); assert.deepEqual(Object.keys(parsed.pooled.coverage), ['properties', 'formFont', 'siblingColor']);
    assert.match(md, /^## Pooled style \(opt-in\)/m); assert.equal(partitions, plainPartitions, 'the worklist is not touched');
    assert.equal(JSON.parse(pooledRun.stdout).pooled, '0 spread row(s), not candidates');
    assert.equal(run('--pooled').status, 0); assert.equal((await read())[0], json, 'byte-identical across runs');
    assert.equal(run().status, 0); assert.deepEqual(await read(), [plainJson, plainMd, plainPartitions], 'without the flag the earlier output comes back byte for byte');
    for (const args of [['--pooled', '--dictionary', join(dir, 'words.txt')], ['--dictionary', join(dir, 'words.txt'), '--pooled']]) {
      const r = run(...args); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse((await read())[0]).pooled.spread.length, 0);
    }
    assert.equal(run('--pooled', '--pooled').status, 2, 'a repeated flag is a usage error');
    assert.equal(run('--dictionary', '--pooled').status, 2, 'the flag is not a word list');
    assert.equal(run('--dictionary', '--pooled', join(dir, 'words.txt')).status, 2, 'nor between --dictionary and its word list');
    assert.equal(run(join(dir, 'words.txt'), '--dictionary').status, 2, 'a word list before its flag');
    assert.equal(run('--dictionary').status, 2, 'a flag without its word list');
    assert.equal(run('--dictionary', join(dir, 'words.txt'), '--dictionary', join(dir, 'words.txt')).status, 2, 'two word lists');
    assert.equal(run('--pool').status, 2);
  });
});

test('the pooled-style code and fixtures are product-agnostic', async () => {
  const sources = ['../tools/passive-capture/style-detectors.mjs', '../tools/passive-capture/detect.mjs'];
  for (const s of sources) assert.doesNotMatch(await readFile(new URL(s, import.meta.url), 'utf8'), /toolshop|practice software testing|localhost:\d+|127\.0\.0\.1:\d+/i);
  const fixtures = ['loans-pooled-desk', 'loans-pooled-renew', 'loans-pooled-return', 'loans-pooled-fines-odd', 'sensors-pooled-north', 'sensors-pooled-south', 'sensors-pooled-east',
    'sensors-pooled-west', 'loans-form-fonts', 'sensors-form-fonts', 'sensors-status-tags', 'loans-tags-healthy', 'loans-nav-desk', 'loans-nav-renew', 'loans-nav-return',
    'loans-nav-fines', 'loans-join-healthy', 'sensors-signin-healthy', 'loans-patron-contact', 'loans-patron-reading', 'loans-patron-notices'];
  for (const f of fixtures) {
    const html = await readFile(new URL(`../tools/passive-capture/fixtures/${f}.html`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /toolshop|https?:\/\/|<script/i, f);
  }
  assert.ok((await readFile(new URL('../tools/passive-capture/style-detectors.mjs', import.meta.url), 'utf8')).split('\n').length < 800);
});

test('existing triage counts actual pooled candidates, never contextual spread, and preserves default partitions', async () => {
  const { buildCoverage, loadEvidence } = await import('../tools/passive-capture/triage-coverage.mjs');
  await withTempDir('passive-pooled-triage-', async (dir) => {
    const sensor = (label, color) => state(label, `${SENSORS}/${label}`, { elements: [el('Unit', { style: { color } })] });
    await writeStates(dir, [...fourPages(), sensor('north', GREY), sensor('south', GREEN)]);
    const plainRun = spawnSync(process.execPath, [DETECT, dir], { encoding: 'utf8' }); assert.equal(plainRun.status, 0, plainRun.stderr);
    const partitions = await readFile(join(dir, 'passive/partitions.json'), 'utf8');
    const run = spawnSync(process.execPath, [DETECT, dir, '--pooled'], { encoding: 'utf8' }); assert.equal(run.status, 0, run.stderr);
    const result = JSON.parse(await readFile(join(dir, 'passive/candidates.json'), 'utf8'));
    assert.ok(result.candidates.some(c => c.detector === 'pooled-outlier'));
    assert.ok(result.pooled.spread.length > 0);
    const source = await loadEvidence(dir, 'neutral'), report = buildCoverage({ evidence: [source] });
    assert.equal(report.totals.candidates.total, result.candidates.length);
    assert.deepEqual(report.evidence[0].candidates.items.map(c => c.id), result.candidates.map(c => c.id));
    assert.equal(await readFile(join(dir, 'passive/partitions.json'), 'utf8'), partitions);
    const moreSpread = structuredClone(source); moreSpread.candidates.pooled.spread.push(...result.pooled.spread);
    assert.deepEqual(buildCoverage({ evidence: [moreSpread] }).totals, report.totals);
  });
});
