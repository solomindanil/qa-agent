import assert from 'node:assert/strict';
import test from 'node:test';
import { textHygieneCandidates, TEXT_MARKER_WHAT } from '../tools/passive-capture/text-markers.mjs';
import { runDetectors, toMarkdown } from '../tools/passive-capture/detect.mjs';
import { readFile } from 'node:fs/promises';

// Neutral synthetic facts (a small booking-style app). Controls for the offline text-marker detector only.
const STYLE = { textAlign: 'start', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', color: 'rgb(33, 37, 41)', paddingLeft: '0px', paddingRight: '0px' };
const text = (sel, t, over = {}) => ({ sel, tag: 'p', sig: 'p.note', parentSig: 'section.panel', text: t, rect: { x: 0, y: 0, w: 100, h: 20 },
  bg: { kind: 'solid', color: 'rgb(255, 255, 255)' }, disabled: false, inactive: false, style: STYLE, ...over });
const control = (sel, name, over = {}) => ({ sel, tag: 'button', type: 'button', sig: 'button.btn', name: { text: name, source: 'text' }, form: -1,
  rect: { x: 0, y: 0, w: 80, h: 30 }, disabled: false, inactive: false, style: STYLE, ...over });
const field = (sel, over = {}) => ({ sel, tag: 'input', type: 'text', textLike: true, id: null, name: 'guest', placeholder: null,
  label: { text: 'Guest name', source: 'label-for' }, form: 0, rect: { x: 0, y: 0, w: 300, h: 38 }, disabled: false, inactive: false, style: STYLE, ...over });
const facts = (over = {}) => ({ url: 'http://app.test/booking', title: 'Booking', elements: [], fields: [], controls: [],
  activeContext: { nativeModal: null, inertRoots: [], ariaModalDeclared: [] }, formCount: 0, truncated: false, ...over });
const state = (label, f) => ({ label, url: f.url, facts: f, axe: { available: false, reason: 'no axe source passed by the caller' } });
const markers = (s) => textHygieneCandidates(s).map((c) => c.what.match(/Marker: (\S+);/)[1]);

test('healthy text yields nothing; an injected marker is one candidate; its unaffected sibling stays clean', () => {
  assert.deepEqual(textHygieneCandidates(state('s', facts({ elements: [text('#a', 'Total for 3 nights: 120.00'), text('#b', 'Check-in after 14:00')] }))), []);
  const found = textHygieneCandidates(state('s', facts({ elements: [text('#a', 'Total for 3 nights: undefined'), text('#b', 'Check-in after 14:00')] })));
  assert.equal(found.length, 1);
  assert.equal(found[0].detector, 'text-hygiene'); assert.equal(found[0].severity, 'low'); assert.equal(found[0].confidence, 'low');
  assert.ok(found[0].what.startsWith(TEXT_MARKER_WHAT)); assert.equal(found[0].evidence.selector, '#a'); assert.equal(found[0].evidence.state, 's');
});

test('exact marker set: [object Object], Invalid Date and case-sensitive undefined/null/NaN tokens only', () => {
  const s = state('s', facts({ elements: [text('#1', 'Owner: [object Object]'), text('#2', 'Due: Invalid Date'), text('#3', 'Rating: NaN'),
    text('#4', 'Note: null'), text('#5', 'Price undefined')] }));
  assert.deepEqual(markers(s).sort(), ['NaN', 'invalid-date', 'null', 'object-object', 'undefined']);
  const others = state('s', facts({ elements: [text('#1', 'Owner: [object Array]'), text('#2', 'UNDEFINED'), text('#3', 'Null'), text('#4', 'nan'),
    text('#5', 'Fish &amp; chips'), text('#6', '{{ guest.name }}'), text('#7', 'booking.summary.title')] }));
  assert.deepEqual(textHygieneCandidates(others), [], 'no other casing, entity, template or key pattern belongs to this minimum');
});

test('token boundaries are Unicode letter/number/underscore aware', () => {
  const hits = ['null', 'null.', '(NaN)', 'x=undefined', 'Значение: null', 'null—далее', 'NaN%'];
  for (const t of hits) assert.equal(textHygieneCandidates(state('s', facts({ elements: [text('#a', t)] }))).length, 1, `should match: ${t}`);
  const misses = ['nullable', 'annulled', 'undefinedValue', 'NaNo', 'null2', '_null', 'значениеnull', 'nullé', 'ÜNaN', '2NaN'];
  for (const t of misses) assert.deepEqual(textHygieneCandidates(state('s', facts({ elements: [text('#a', t)] }))), [], `should not match: ${t}`);
});

test('channels: element text, control names, field labels and placeholders only; nothing else is read', () => {
  const s = state('s', facts({ title: 'NaN', url: 'http://app.test/undefined',
    controls: [control('#save', 'undefined'), control('#icon', '', { name: { text: '', source: 'none' } })],
    fields: [field('#g', { label: { text: 'Guest null', source: 'label-for' }, placeholder: 'NaN', name: 'null', id: 'undefined' })] }));
  const found = textHygieneCandidates(s).map((c) => c.what.match(/channel: ([\w-]+)/)[1]).sort();
  assert.deepEqual(found, ['control-name', 'field-label', 'placeholder']);
});

test('inactive and disabled content is excluded; an intentional literal is still only a candidate', () => {
  const s = state('s', facts({ elements: [text('#m', 'Rating: NaN', { inactive: true }), text('#d', 'Rating: NaN', { disabled: true })],
    controls: [control('#c', 'undefined', { disabled: true })], fields: [field('#f', { placeholder: 'null', inactive: true })] }));
  assert.deepEqual(textHygieneCandidates(s), []);
  const code = textHygieneCandidates(state('s', facts({ elements: [text('#code', 'returns null when empty', { tag: 'code' })] })));
  assert.equal(code.length, 1, 'no auto-dismiss from a tag; triage may dismiss it without a finding');
});

test('key is marker + state + selector + channel: instances are kept apart, an exact repeat dedupes', () => {
  const two = (label) => state(label, facts({ url: `http://app.test/${label}`, elements: [text('#a', 'Rating: NaN'), text('#b', 'Score: NaN')] }));
  const list = runDetectors([two('list'), two('detail')]).filter((c) => c.detector === 'text-hygiene');
  assert.equal(list.length, 4, 'two instances in two states remain four rows');
  assert.deepEqual(list.map((c) => `${c.states[0]}${c.evidence[0].selector}`).sort(), ['detail#a', 'detail#b', 'list#a', 'list#b']);
  assert.equal(textHygieneCandidates(state('s', facts({ elements: [text('#a', 'NaN and NaN')] }))).length, 1, 'same marker twice in one text is one row');
});

test('real integrated report preserves valid-label selector and channel identity and dedupes repeated facts', () => {
  const s = state('s-1', facts({
    elements: [text('#a', 'NaN'), text('#a', 'NaN'), text('#a\\|text', 'NaN')],
    controls: [control('#a', 'NaN')],
    fields: [field('#a', { label: { text: 'NaN', source: 'label-for' }, placeholder: 'NaN' })],
  }));
  const found = runDetectors([s]).filter((c) => c.detector === 'text-hygiene');
  assert.equal(found.length, 5, 'four channels on #a and a distinct delimiter-rich selector remain five rows');
  assert.equal(found.filter((c) => c.evidence[0].selector === '#a\\|text').length, 1);
  assert.equal(found.filter((c) => c.evidence[0].selector === '#a').length, 4);
  assert.ok(found.every((c) => c.evidence.length === 1), 'exact repeat facts dedupe before report merging');
});

test('unselected attributes and inactive text are not accessed, rather than merely ignored after access', () => {
  const denied = () => { throw new Error('unselected channel was read'); };
  const e = text('#visible', 'All healthy');
  Object.defineProperty(e, 'value', { get: denied });
  Object.defineProperty(e, 'attributes', { get: denied });
  const inactive = text('#inactive', '', { inactive: true });
  Object.defineProperty(inactive, 'text', { get: denied });
  const f = field('#guest');
  for (const key of ['value', 'id', 'name', 'options']) Object.defineProperty(f, key, { get: denied });
  const c = control('#save', 'Save');
  Object.defineProperty(c, 'value', { get: denied });
  const input = facts({ elements: [e, inactive], fields: [f], controls: [c] });
  for (const key of ['title', 'url', 'network']) Object.defineProperty(input, key, { get: denied });
  assert.deepEqual(textHygieneCandidates({ label: 'safe', url: 'http://app.test/', facts: input }), []);
});

test('marker integration never flags a healthy sibling or promotes a candidate to a verdict', () => {
  const s = state('price', facts({ elements: [text('#a', 'Total: undefined'), text('#b', 'Total: 120.00')] }));
  const found = runDetectors([s]).filter((c) => c.detector === 'text-hygiene');
  assert.equal(found.length, 1);
  assert.equal(found[0].evidence[0].selector, '#a');
  assert.equal(found[0].severity, 'low');
  assert.equal(found[0].confidence, 'low');
  assert.ok(!Object.hasOwn(found[0], 'verdict') && !Object.hasOwn(found[0], 'status'));
  assert.match(toMarkdown(found, [s]), /A candidate is not a finding/);
});

test('no surrounding text, canary or value reaches the message or key', () => {
  const canary = 'CANARY-7f3e mira@example.test';
  const found = textHygieneCandidates(state('s', facts({ elements: [text('#a', `${canary} undefined ${canary}`)] })));
  assert.equal(found.length, 1);
  assert.ok(!found[0].what.includes('CANARY') && !found[0].key.includes('CANARY') && !found[0].what.includes('mira@'), found[0].what);
});

test('missing lists and truncated facts never produce a completeness claim', () => {
  assert.deepEqual(textHygieneCandidates(state('s', { url: 'http://app.test/', activeContext: {} })), []);
  const truncated = state('t', facts({ truncated: true, elements: [text('#a', 'Fine text')] }));
  const md = toMarkdown(runDetectors([truncated]), [truncated]);
  assert.match(md, /Facts truncated in: t/);
  assert.match(md, /No candidate is not a check of all text or states/);
  assert.match(md, /\*\*hypothesis\*\*[\s\S]*\*\*unassessed\*\*/, 'triage allows hypothesis and unassessed, not only finding/dismissed');
  assert.doesNotMatch(md, /\b(pass|passed|clean)\b/i);
});

test('new detector source names no benchmark product, host port or bench vocabulary', async () => {
  const src = await readFile(new URL('../tools/passive-capture/text-markers.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /toolshop|practice software testing|localhost:\d+|127\.0\.0\.1:\d+/i);
});
