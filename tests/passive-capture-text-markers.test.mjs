import assert from 'node:assert/strict';
import test from 'node:test';
import { textHygieneCandidates, TEXT_MARKER_WHAT } from '../tools/passive-capture/text-markers.mjs';
import { runDetectors, toMarkdown } from '../tools/passive-capture/detect.mjs';
import { rareVariantCandidates, labelMismatchCandidates, wordingCoverage, wordsOf, editDistance, loadDictionary, inflectionBases } from '../tools/passive-capture/text-wording.mjs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  assert.match(md, /element text up to its first 160 characters and control names taken from visible text up to 80; markers beyond that are not inspected/);
  assert.match(md, /No candidate is not a check of all text or states/);
  assert.match(md, /\*\*hypothesis\*\*[\s\S]*\*\*unassessed\*\*/, 'triage allows hypothesis and unassessed, not only finding/dismissed');
  assert.doesNotMatch(md, /\b(pass|passed|clean)\b/i);
});

test('new detector source names no benchmark product, host port or bench vocabulary', async () => {
  const src = await readFile(new URL('../tools/passive-capture/text-markers.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /toolshop|practice software testing|localhost:\d+|127\.0\.0\.1:\d+/i);
});

test('disclosed text capture limits match the capture source', async () => {
  const src = await readFile(new URL('../tools/passive-capture/page-facts.mjs', import.meta.url), 'utf8');
  assert.match(src, /text: own\.slice\(0, 160\)/);
  assert.match(src, /return \{ text: own\.slice\(0, 80\), source: 'text' \}/);
});

// F6 wording in two neutral domains: D-A library loans and patrons, D-B greenhouse sensor settings.
const page = (label, strings) => state(label, facts({ url: `http://app.test/${label}`, elements: strings.map((t, i) => text(`#${label}-${i}`, t)) }));
const times = (t, n) => Array(n).fill(t);
// A small synthetic word list of base forms: the rare-variant detector needs a caller-supplied dictionary. The misspellings the
// controls seed (retrun, humidty, resrvaton...) are absent from it, as from any real word list.
// A list must fit the captured text (know at least half of its distinct words of 4 or more letters), so controls on other words pass a
// small list of their own.
const LEXICON = new Set(['a', 'add', 'all', 'and', 'book', 'card', 'care', 'cart', 'country', 'county', 'date', 'day', 'desk', 'dry', 'filter', 'humidity', 'label',
  'later', 'loan', 'me', 'patron', 'period', 'remind', 'renew', 'renewal', 'reservation', 'reset', 'return', 'select', 'shelf', 'shelve', 'soil',
  'temperature', 'two', 'water', 'week']);
const rare = (states, dictionary = LEXICON) => rareVariantCandidates(states, { dictionary });
const pairs = (states, dictionary = LEXICON) => rare(states, dictionary).map((c) => /^Word "([^"]+)".* variant "([^"]+)"/u.exec(c.what).slice(1).join('>'));
const LOANS = ['Loans and returns', ...times('Return', 8), ...times('Renew', 6), 'A renewal adds two weeks', 'Loan period', ...times('Loans', 3),
  'Reset filters', ...times('Shelve', 3), 'Shelf labels'];
const RETRUN_WHAT = 'Word "retrun" occurs once in the captured text; its close variant "return" occurs 8 times (1 edit apart). It is not in the supplied '
  + 'dictionary and not an inflection of a dictionary word or of a frequent captured word. Possible misspelling; convention-based, not a spell check: '
  + 'a name, a domain term or a word missing from the dictionary is a dismissal. Channel: text.';

test('rare-variant: D-A "Retrun" once beside "Return" eight times is a candidate; Renew/Renewal, Loan/Loans, Reset and Shelf are not', () => {
  assert.deepEqual(rare([page('loans', [...LOANS, 'Return selected'])]), []);
  const found = rare([page('loans', [...LOANS, 'Retrun selected'])]);
  assert.equal(found.length, 1); assert.equal(found[0].detector, 'rare-variant'); assert.equal(found[0].severity, 'low'); assert.equal(found[0].confidence, 'low');
  assert.equal(found[0].evidence.selector, `#loans-${LOANS.length}`); assert.equal(found[0].evidence.state, 'loans');
  assert.equal(found[0].what, RETRUN_WHAT);
  assert.deepEqual(rare([page('loans', [...LOANS, 'Retrun selected', 'Retrun all'])]), [], 'limit: a misspelling seen twice is not found');
  assert.deepEqual(rare([page('loans', ['Return', 'Return', 'Retrun selected'])]), [], 'a variant seen fewer than 3 times is not frequent');
  assert.deepEqual(pairs([page('loans', [...times('Reservation', 3), 'Resrvaton'])]), ['resrvaton>reservation'], 'two edits from 6 letters');
  assert.match(rare([page('loans', [...times('Reservation', 3), 'Resrvaton'])])[0].what, /\(2 edits apart\)/);
  assert.deepEqual(pairs([page('loans', [...times('Patron', 3), 'Petrin'])]), ['petrin>patron'], 'two edits at exactly 6 letters');
  assert.deepEqual(pairs([page('loans', [...times('Renew', 3), 'Reset'])]), [], 'two edits on 5 letters are too many');
  assert.deepEqual(pairs([page('loans', [...times('Shelve', 3), 'Shelf'])]), [], 'the shorter word decides the allowed edits');
  assert.deepEqual(pairs([page('loans', [...times('Renew', 3), 'Renewal'])]), [], 'a word that begins with the other is an inflection');
  assert.deepEqual(pairs([page('loans', [...times('Return', 3), ...times('Returns', 4), 'Retruns'])]), ['retruns>returns'], 'the most frequent close variant is named');
  assert.deepEqual(pairs([page('loans', [...times('Country', 3), 'County'])]), [], 'a dictionary word one edit from a frequent word (county/country) is not a candidate');
  assert.deepEqual(pairs([page('loans', [...times('Country', 3), 'County'])], new Set(['country'])), ['county>country'], 'without it in the dictionary it is compared');
});

test('rare-variant: D-B "Humidty" beside "Humidity" is a candidate; another first letter, short words, a German stem, diacritics and other scripts are handled', () => {
  const SENSORS = [...times('Humidity', 3), ...times('Water', 4), 'Remind me later', ...times('Day', 3), 'Dry soil', ...times('Temperature', 3), 'Temperatur'];
  assert.deepEqual(rare([page('sensors', SENSORS)]), []);
  assert.deepEqual(pairs([page('sensors', [...SENSORS, 'Humidty'])]), ['humidty>humidity']);
  const french = page('sensors', [...SENSORS, 'Humidité de nuit']);
  assert.deepEqual(rare([french]), [], 'a rare word with a diacritic its close variant lacks is not compared');
  assert.equal(wordingCoverage([french], { dictionary: LEXICON }).rare.withDiacritic, 1, 'and it is counted');
  assert.equal(wordingCoverage([page('sensors', SENSORS)], { dictionary: LEXICON }).rare.withDiacritic, 0);
  assert.deepEqual(pairs([page('sensors', [...times('Humidité', 3), 'Humidite'])], new Set(['humidité'])), ['humidite>humidité'], 'a missing diacritic is compared');
  assert.deepEqual(rare([page('sensors', [...times('Humidité', 3), 'Humidité', 'Water soil'])], new Set(['water', 'soil'])), [], 'a decomposed spelling is the same word after NFC');
  assert.deepEqual(pairs([page('sensors', [...times('Вентиляция', 3), 'ВЕНТИЛЯЦЫЯ'])], new Set(['вентиляция'])), ['вентиляцыя>вентиляция'], 'Cyrillic, case-folded');
  assert.deepEqual(pairs([page('sensors', [...times('Bewässerung', 3), 'Bewässrung'])], new Set(['bewässerung'])), ['bewässrung>bewässerung'], 'a shared diacritic is compared');
});

test('wordsOf and editDistance: Unicode words, case-folded and composed; numbers, identifiers, keys, addresses and camelCase are skipped whole', () => {
  assert.deepEqual(wordsOf('Due: 14 days — loan_id=7, dueDate ISBN-0451 patron.email mira@example.test Patron’s e-mail (RETRUN) Humidité «ВЕРНУТЬ»'),
    ['due', 'days', 'patron', 's', 'e', 'mail', 'retrun', 'humidité', 'вернуть']);
  assert.deepEqual(wordsOf(undefined), []);
  assert.equal(editDistance('retrun', 'return'), 1, 'an adjacent transposition is one edit');
  assert.equal(editDistance('humidty', 'humidity'), 1);
  assert.equal(editDistance('resrvaton', 'reservation'), 2);
  assert.equal(editDistance('вренуть', 'вернуть'), 1);
  assert.equal(editDistance('', 'loan'), 4);
});

test('rare-variant reads each captured string once: element text, names and labels not taken from it, placeholders; re-captures, inactive text and a cut-off last word do not count', () => {
  const returns = times('Return', 3).map((t, i) => text(`#r${i}`, t));
  const loans = (over = {}) => state('loans', facts({ ...over, elements: [...returns, ...(over.elements ?? [])] }));
  const count = (...states) => rare(states).length;
  assert.equal(count(loans({ elements: [text('#b', 'Retrun')], controls: [control('#b', 'Retrun')] })), 1, 'a name taken from the button text is not counted twice');
  for (const source of ['aria-label', 'title', 'value', 'alt', 'img-alt']) {
    assert.match(rare([loans({ controls: [control('#b', 'Retrun', { name: { text: 'Retrun', source } })] })])[0]?.what ?? '', /Channel: control-name\.$/, source);
  }
  for (const source of ['aria-label', 'title']) assert.equal(count(loans({ fields: [field('#f', { label: { text: 'Retrun date', source } })] })), 1, source);
  assert.equal(count(loans({ fields: [field('#f', { label: { text: 'Retrun date', source: 'label-for' } })] })), 0, 'a label element is read as element text, not twice');
  assert.match(rare([loans({ fields: [field('#f', { placeholder: 'Retrun date' })] })])[0]?.what ?? '', /Channel: placeholder\.$/);
  const typo = { elements: [text('#b', 'Retrun')] };
  assert.equal(count(loans(typo), { ...loans(typo), label: 'loans-again' }), 1, 'a re-capture of the same page, element and text counts once');
  assert.equal(count(loans(typo), state('other', facts({ url: 'http://app.test/other', ...typo }))), 0, 'the same word on another page counts again');
  for (const skip of [{ inactive: true }, { disabled: true }]) {
    assert.equal(count(loans({ elements: [text('#b', 'Retrun', skip)] })), 0, JSON.stringify(skip));
    assert.equal(count(loans({ controls: [control('#b', 'x', { name: { text: 'Retrun', source: 'aria-label' }, ...skip })] })), 0, JSON.stringify(skip));
    assert.equal(count(loans({ fields: [field('#f', { placeholder: 'Retrun date', ...skip })] })), 0, JSON.stringify(skip));
  }
  const shelf = times('Shelf', 3).map((t, i) => text(`#s${i}`, t));
  assert.equal(`${'loan '.repeat(30)}desk shelv`.length, 160);
  assert.equal(count(state('loans', facts({ elements: [...shelf, text('#long', `${'loan '.repeat(30)}desk shelv`)] }))), 0, 'a word cut at the 160-character capture limit is dropped');
  assert.equal(count(state('loans', facts({ elements: [...shelf, text('#long', `${'loan '.repeat(30)}dry shelv`)] }))), 1, 'below the limit the last word is whole');
});

const input = (name, label, over = {}) => field(`#${name}`, { name, id: name, label: { text: label, source: 'label-for' }, ...over });
const form = (...fields) => state('patron', facts({ url: 'http://app.test/patron', fields }));
const NAMES_SIBLING = (f, label, sibling, channel = 'label') => `Field "${f}" has the ${channel} "${label}", which names another field of the same form ("${sibling}") `
  + `and no word that only its own name or id has; convention-based candidate: the ${channel}, the name or the id may be wrong, or the ${channel} may be intended`;
const NEAR_OWN = (f, label, word, idWord) => `Field "${f}" has the label "${label}"; its word "${word}" is 1 edit from "${idWord}" in the field's name or id; `
  + 'possible misspelling in the label, the name or the id; convention-based candidate';

test('label-mismatch: D-A label "City" on field "country" names its sibling; own, compound, swapped and unrelated labels are handled', () => {
  const address = (country) => form(input('street', 'Street'), input('city', 'City'), input('county', 'County'), input('country', country), input('zip', 'Zip code'),
    input('notes', 'Notes on the loan term'), input('loan_term', 'Loan term'));
  assert.deepEqual(labelMismatchCandidates(address('Country')), []);
  const found = labelMismatchCandidates(address('City'));
  assert.equal(found.length, 1); assert.equal(found[0].detector, 'label-mismatch'); assert.equal(found[0].severity, 'low'); assert.equal(found[0].confidence, 'low');
  assert.equal(found[0].evidence.selector, '#country'); assert.equal(found[0].what, NAMES_SIBLING('country', 'City', 'city'));
  assert.equal(labelMismatchCandidates(address('Zip'))[0]?.what, NAMES_SIBLING('country', 'Zip', 'zip'), 'a three-letter name is a name');
  assert.equal(labelMismatchCandidates(address('County')).length, 1, 'a sibling named exactly gives one row, not also a near-misspelling row');
  const run = (...fields) => labelMismatchCandidates(form(...fields)).map((c) => `${c.evidence.selector}: ${c.what.split(',')[0]}`);
  assert.deepEqual(run(input('billing_city', 'Billing city'), input('billing_country', 'Billing country')), [], 'shared words are not a mismatch');
  assert.deepEqual(run(input('billing_city', 'Country'), input('billing_country', 'Billing country')), ['#billing_city: Field "billing_city" has the label "Country"']);
  assert.deepEqual(run(input('email', 'Confirm email'), input('email_confirm', 'Email')), ['#email: Field "email" has the label "Confirm email"'], 'swapped labels');
  assert.deepEqual(run(input('start_date', 'Start date'), input('end_date', 'Start date')), ['#end_date: Field "end_date" has the label "Start date"']);
  assert.deepEqual(run(input('dob', 'Date of birth'), input('start_date', 'Start date')), [], 'only a whole sibling name counts, not one shared word');
  assert.deepEqual(run(input('item', 'Item', { sel: '#item-1' }), input('item', 'Item', { sel: '#item-2' })), [], 'repeated fields with one name');
  assert.deepEqual(run(input('q', 'City'), input('city', 'City')), [], 'a field without a name or id word is not judged');
  assert.deepEqual(run(input('country', 'Country', { placeholder: 'City' }), input('city', 'City')), ['#country: Field "country" has the placeholder "City"']);
  for (const over of [{ form: 1 }, { type: 'radio', textLike: false }, { inactive: true }, { disabled: true }]) {
    assert.deepEqual(run(input('country', 'City', over), input('city', 'City')), [], JSON.stringify(over));
  }
  assert.deepEqual(run(input('country', 'City'), input('city', 'City', { inactive: true })), [], 'an inactive field is not a sibling');
  const wrap = (tag) => input('sort', 'Order by Title Author', { tag, label: { text: 'Order by Title Author', source: 'label-wrap' } });
  for (const tag of ['select', 'textarea']) assert.deepEqual(run(wrap(tag), input('title', 'Title'), input('author', 'Author')), [], `a ${tag} label holds its own options or content`);
  assert.equal(run(wrap('input'), input('title', 'Title')).length, 1, 'a wrapped text input label is read');
  assert.equal(run(input('country', 'City', { tag: 'select' }), input('city', 'City')).length, 1, 'a select with its own label element is read');
});

test('label-mismatch: D-B "Humidty" on field "humidity" is a candidate; German "Temperatur" is not; French "Humidité" and nameless or wrapping fields are counted as not compared', () => {
  const settings = (label) => form(input('humidity', label, { type: 'number' }), input('temperature', 'Temperatur (°C)', { type: 'number' }),
    input('night_humidity', 'Humidité de nuit (%)', { id: 'night', type: 'number' }), input('water_interval', 'Water every (days)', { id: 'interval', type: 'number' }),
    input('plot', 'Pot size'), input('vent', '', { label: { text: '', source: 'none' } }));
  assert.deepEqual(labelMismatchCandidates(settings('Humidity (%)')), []);
  const found = labelMismatchCandidates(settings('Humidty (%)'));
  assert.equal(found.length, 1); assert.equal(found[0].evidence.selector, '#humidity');
  assert.equal(found[0].what, NEAR_OWN('humidity', 'Humidty (%)', 'humidty', 'humidity'));
  assert.deepEqual(wordingCoverage([settings('Humidity (%)')]).fields, { compared: 5, incomplete: 1, unassessed: { diacritic: 1 } },
    'a field with neither label nor placeholder is neither compared nor counted');
  for (const name of ['targetHumidity', 'zone2humidity']) {
    assert.deepEqual(labelMismatchCandidates(form(input(name, 'Target humidty', { id: null }))).map((c) => c.what), [NEAR_OWN(name, 'Target humidty', 'humidty', 'humidity')],
      `${name}: a name splits at case changes and digits`);
  }
  assert.deepEqual(labelMismatchCandidates(form(input('pot', 'Plot size'))), [], 'a three-letter name word is not compared for spelling');
  assert.equal(labelMismatchCandidates(form(input('humidity', 'Humidite (%)'))).length, 1, 'a missing diacritic is compared');
  const wraps = (tag, label) => ({ tag, label: { text: label, source: 'label-wrap' } });
  const gaps = form(input('q', 'Search sensors'), input('notes', 'x', wraps('textarea', 'Notes Pump service due')), input('sort', 'x', wraps('select', 'Order by Zone Humidity')));
  assert.deepEqual(wordingCoverage([gaps, { ...gaps, label: 'patron-again' }]).fields, { compared: 0, incomplete: 3, unassessed: { 'no-identifier': 1, 'wrapped-content': 2 } },
    'a re-captured field is counted once');
});

test('runDetectors: F6 rows stay candidates, merge across states, are byte-identical across runs and state what was not compared', async () => {
  const loans = page('loans', [...LOANS, 'Retrun selected', 'Rénew']);
  const patron = (label) => state(label, facts({ url: `http://app.test/${label}`, fields: [input('city', 'City'), input('country', 'City'), input('q', 'Search loans')] }));
  const states = [loans, patron('patron-new'), patron('patron-edit')];
  const list = runDetectors(states, { dictionary: LEXICON });
  const f6 = list.filter((c) => ['rare-variant', 'label-mismatch'].includes(c.detector));
  assert.deepEqual(f6.map((c) => `${c.detector}@${c.states.join(',')}`), ['label-mismatch@patron-new,patron-edit', 'rare-variant@loans']);
  assert.ok(f6.every((c) => c.severity === 'low' && c.confidence === 'low' && !Object.hasOwn(c, 'verdict') && !Object.hasOwn(c, 'status')));
  assert.equal(JSON.stringify(runDetectors(states, { dictionary: LEXICON })), JSON.stringify(list));
  const md = toMarkdown(list, states, { dictionary: LEXICON });
  assert.equal(md.split('\n').find((l) => l.startsWith('Wording:')), 'Wording: a word of 4 or more letters seen once was compared with close variants seen at least 3 '
    + `times when it is not in the supplied dictionary (${LEXICON.size} words; it knows 15 of 17 distinct captured words of 4 or more letters, 88 %), not an inflection (-s, -es, -ed, -ing, -er, -ly) of a dictionary word or of a frequent `
    + 'captured word, and not capitalised only mid-sentence (a name); and 4 field(s) had a label or placeholder compared with their own name or id and the other '
    + 'fields of their form. A misspelling seen more than once or spelt as another dictionary word, a word without such a variant and text that was not captured '
    + 'are not checked; this is not a spell check.');
  assert.doesNotMatch(md, /rare-variant: unassessed/);
  assert.match(md, /Field labels not fully compared: 2 field\(s\) \(no name or id word 2\)\. No candidate there is not a pass\./);
  assert.match(md, /Rare words not compared: 1 word\(s\) close to a frequent word but with a diacritic it lacks \(often another language\)\./);
  const plain = toMarkdown([], [page('loans', LOANS)], { dictionary: LEXICON });
  assert.match(plain, /Wording: .* and 0 field\(s\) had a label/);
  assert.doesNotMatch(plain, /not fully compared|Rare words not compared/);
  const src = await readFile(new URL('../tools/passive-capture/text-wording.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /toolshop|practice software testing|localhost:\d+|127\.0\.0\.1:\d+/i);
  assert.match(src, /const TEXT_CAP = 160;/, 'the cut-word rule uses the element text limit of page-facts.mjs');
});

test('wording boundaries: 4-letter words are compared and 3-letter ones are not; ties name the first variant in code-point order; state order changes nothing', () => {
  assert.deepEqual(pairs([page('loans', [...times('Card', 3), 'Crad'])]), ['crad>card'], 'a four-letter word is compared');
  assert.deepEqual(pairs([page('loans', [...times('Due', 3), 'Deu'])]), [], 'a three-letter word is not');
  assert.deepEqual(labelMismatchCandidates(form(input('vent', 'Vnet speed'))).map((c) => c.what), [NEAR_OWN('vent', 'Vnet speed', 'vnet', 'vent')], 'a four-letter label word is compared');
  assert.deepEqual(labelMismatchCandidates(form(input('pump', 'Dump valve'))), [], 'a label word one edit away with another first letter is another word');
  assert.deepEqual(pairs([page('loans', [...times('Care', 3), ...times('Card', 3), 'Book carx'])]), ['carx>card'],
    'two equally frequent variants: the first in code-point order is named, whatever the text order');
  const loans = page('loans', [...times('Return', 3), 'Retrun']); const sensors = page('sensors', [...times('Humidity', 3), 'Humidty']);
  const rows = rare([loans, sensors]);
  assert.equal(rows.length, 2); assert.deepEqual(rare([sensors, loans]), rows, 'reversed state order: the same rows in the same order');
  const both = page('sensors', [...times('Bewässerung', 3), ...times('Bewasserung', 3), 'Bewässrung']); const beds = new Set(['bewässerung', 'bewasserung']);
  assert.deepEqual(pairs([both], beds), ['bewässrung>bewässerung'], 'a variant sharing the diacritic is compared, the one lacking it is not');
  assert.equal(wordingCoverage([both], { dictionary: beds }).rare.withDiacritic, 0, 'a rare word compared with a variant is not counted as not compared');
});

test('label-mismatch limits: two-letter names are not compared, a long label is quoted to 80 characters, a decomposed name is the same word', () => {
  const soil = form(input('ph', 'Soil PH'), input('ec', 'PH'));
  assert.deepEqual(labelMismatchCandidates(soil), [], 'the label "PH" on field ec names field ph, but two-letter names are not compared');
  assert.deepEqual(wordingCoverage([soil]).fields, { compared: 0, incomplete: 2, unassessed: { 'no-identifier': 2 } }, 'and both fields are counted as not compared');
  const long = 'Humidty (%) measured by the north bench sensor every ten minutes through the whole night cycle';
  const found = labelMismatchCandidates(form(input('humidity', long)));
  assert.ok(long.length > 80); assert.equal(found.length, 1);
  assert.equal(found[0].what, NEAR_OWN('humidity', long.slice(0, 80), 'humidty', 'humidity')); assert.ok(!found[0].what.includes(long), 'no more than 80 characters are quoted');
  assert.deepEqual(labelMismatchCandidates(form(input('humidité', 'Humidité (%)'))), [], 'a decomposed name or id equals its composed label word');
  assert.deepEqual(labelMismatchCandidates(form(input('night', 'Humidité'), input('humidité', 'Humidité (%)'))).map((c) => c.evidence.selector), ['#night'],
    'a composed label names a sibling whose name is decomposed');
});

// Precision round (real-page triage): every rare-variant row on generic prose was two real words or an inflection pair, so the
// detector now needs a caller-supplied dictionary, and without one it reports the family as unassessed instead of guessing.
test('rare-variant needs a dictionary: without one no row is emitted and the report states rare-variant is unassessed', () => {
  const loans = page('loans', [...LOANS, 'Retrun selected']);
  assert.deepEqual(rareVariantCandidates([loans]), []);
  assert.deepEqual(rareVariantCandidates([loans], { dictionary: null }), []);
  assert.deepEqual(wordingCoverage([loans]).rare, { assessed: false, reason: 'no dictionary supplied' });
  assert.deepEqual(runDetectors([loans]).filter((c) => c.detector === 'rare-variant'), []);
  const md = toMarkdown(runDetectors([loans]), [loans]);
  assert.match(md, /^rare-variant: unassessed \(no dictionary supplied\)\. Rare words are compared only against a caller-supplied word list \(detect\.mjs --dictionary FILE\); no rare-variant row here says nothing about spelling\.$/m);
  assert.match(md, /^Wording: 0 field\(s\) had a label or placeholder compared with their own name or id and the other fields of their form; this is not a spell check\.$/m);
  assert.doesNotMatch(md, /seen once was compared|Rare words not compared/);
  assert.equal(runDetectors([loans], { dictionary: LEXICON }).filter((c) => c.detector === 'rare-variant').length, 1, 'the same text with a dictionary');
  assert.deepEqual(wordingCoverage([loans], { dictionary: LEXICON }).rare, { assessed: true, capturedWords: 16, knownWords: 15, knownShare: 0.94, withDiacritic: 0, properNouns: 0 });
});

test('rare-variant with a dictionary: a rare word the dictionary knows, or an inflection of a dictionary word or of a frequent captured word, is not a candidate', () => {
  const base = new Set(['design', 'track', 'create', 'found', 'employee', 'arrive']);
  for (const [word, frequent] of [['designs', 'designed'], ['tracked', 'tracks'], ['creating', 'creative'], ['founded', 'founder'], ['employees', 'employer'], ['arrived', 'arrival']]) {
    const strings = [...times(frequent, 3), word];
    assert.deepEqual(pairs([page('loans', strings)], base), [], `${word}: an inflection of a dictionary word`);
    assert.deepEqual(pairs([page('loans', strings)], new Set([frequent])), [`${word}>${frequent}`], `${word}: without its base in the dictionary it is compared`);
  }
  const loaned = [...times('Loan', 3), ...times('Loaner', 3), 'Loaned', 'Desk open']; const desk = new Set(['loaner', 'desk', 'open']);
  assert.deepEqual(pairs([page('loans', loaned)], desk), [], 'loaned: an inflection of a frequent captured word (loan) is not a candidate');
  assert.deepEqual(pairs([page('loans', [...times('Loan', 2), ...times('Loaner', 3), 'Loaned', 'Desk open'])], desk), ['loaned>loaner'], 'a base seen only twice is not frequent');
  assert.deepEqual(pairs([page('loans', [...times('Return', 3), 'Retruns'])]), ['retruns>return'], 'a misspelt stem with a regular ending stays a candidate');
});

test('inflectionBases: regular -s, -es, -ies, -ed, -d, -ied, doubled consonant, -ing, -er(s), -ly and -ily endings; bases under 3 letters are dropped', () => {
  const has = (word, b) => assert.ok(inflectionBases(word).includes(b), `${word} -> ${b}: ${JSON.stringify(inflectionBases(word))}`);
  for (const [word, b] of [['loans', 'loan'], ['boxes', 'box'], ['cities', 'city'], ['tracked', 'track'], ['arrived', 'arrive'], ['carried', 'carry'], ['stopped', 'stop'],
    ['tracking', 'track'], ['creating', 'create'], ['running', 'run'], ['reader', 'read'], ['maker', 'make'], ['readers', 'read'], ['makers', 'make'],
    ['quickly', 'quick'], ['happily', 'happy']]) has(word, b);
  assert.ok(!inflectionBases('class').includes('clas'), 'a double s is not a plural ending');
  assert.deepEqual(inflectionBases('retrun'), []); assert.deepEqual(inflectionBases('humidty'), []);
  assert.deepEqual(inflectionBases('is'), [], 'no base under 3 letters');
  assert.deepEqual(inflectionBases('bed'), [], 'be and b are under 3 letters');
});

test('rare-variant: a word capitalised only mid-sentence is a name, neither rare nor variant; a sentence start, Title Case or a lowercase use is no such evidence; caseless scripts are compared', () => {
  const sensors = (...strings) => [page('sensors', [...times('the bench tester', 3), ...strings])];
  const list = new Set(['bench', 'tester', 'reading', 'upload', 'every', 'night', 'close', 'them', 'nightly', 'data', 'goes', 'first', 'log', 'reach', 'hourly', 'alert']);
  const listed = (states) => pairs(states, list);
  assert.deepEqual(listed(sensors('Readings are uploaded to Tessar every night.')), [], 'a name in a sentence');
  assert.equal(wordingCoverage(sensors('Readings are uploaded to Tessar every night.'), { dictionary: list }).rare.properNouns, 1, 'and it is counted');
  assert.deepEqual(listed(sensors('Tessar uploads readings every night.')), ['tessar>tester'], 'the first word of a string is no evidence');
  assert.deepEqual(listed(sensors('Readings close. Tessar uploads them.')), ['tessar>tester'], 'nor the first word after a full stop');
  assert.deepEqual(listed(sensors('Upload Readings To Tessar')), ['tessar>tester'], 'nor a word of a Title Case string');
  assert.deepEqual(listed(sensors('UPLOADED TO TESSAR')), ['tessar>tester'], 'nor capitals');
  assert.deepEqual(listed(sensors('Readings go to TESSAR nightly.')), ['tessar>tester'], 'nor capitals inside a sentence');
  const named = (...extra) => [page('sensors', ['Data goes to Tessar first.', 'Logs reach Tessar hourly.', 'Alerts use Tessar too.', ...extra, 'one tesser'])];
  assert.deepEqual(listed(named()), [], 'a frequent name is not a variant');
  assert.deepEqual(listed(named('the tessar log')), ['tesser>tessar'], 'one lowercase use makes it a word');
  assert.deepEqual(pairs([page('sensors', [...times('שלום', 3), 'שלוס'])], new Set(['שלום'])), ['שלוס>שלום'], 'a script without case is compared as before');
});

// Generic English prose with near-word pairs (one of each seen once, the other three times): a word list must dismiss all of them.
const PROSE = ['Our core beds open on Saturday. The core team explains the core plan and why we grow food near the food bank, sharing food with neighbours.',
  'Volunteers make labels, make compost and make tea. Most labels were made by children. Please take care near the pond. Many visitors walk in on foot.',
  'Access is free: wheelchair access runs along the north path and step-free access reaches the shed. Please accept that wet rows stay closed.',
  'Join the garden internet for weather news. The internet name is on the gate and the internet stays on all day. An internal list is for members.',
  'Ask about the steel beds. Steel frames endure for years and steel edging holds the soil. Nobody has tried to steal one.',
  'Children water the beans, then pick them, rinse them and take them home.',
  'An artist residency starts in July. The residency includes a studio and the residency ends with an exhibition. The artist residence is close by.',
  'Seeds arrived last week. Arrival times for groups are listed; note your arrival at the desk and report a late arrival by phone.',
  'Students designed the beds. One plot was designed for herbs and one was designed for beans. New designs are welcome.',
  'Creative play runs hourly, creative workshops follow and the creative corner has paint. We are creating a mural.',
  'Weather tracks hang by the gate. The tracks record rain and the tracks record sun. Last month we tracked a dry spell.',
  'Planting begins at nine. Volunteers begin weeding first and begin watering after lunch, and we begin again on Sunday. Last year the season began early.'];
const PROSE_BASES = new Set(['care', 'made', 'foot', 'accept', 'internal', 'then', 'steal', 'residence', 'arrive', 'design', 'create', 'track']);
// The rest of the prose's own words, so that a list built from them fits the text; the rare members of the pairs and their bases are left out.
const PROSE_RARE = ['care', 'made', 'foot', 'accept', 'internal', 'then', 'steal', 'residence', 'arrived', 'designs', 'creating', 'tracked', 'began'];
const PROSE_REST = [...new Set(PROSE.flatMap(wordsOf))].filter((w) => !PROSE_RARE.includes(w));

test('healthy generic-English prose: care/core, made/make, foot/food, accept/access, internal/internet, then/them, steal/steel, residence/residency and inflection pairs give no row; an irregular form missing from the list (began/begin) is a candidate', () => {
  const prose = [page('prose', PROSE)];
  const list = (...extra) => new Set([...PROSE_REST, ...PROSE_BASES, ...extra]);
  assert.deepEqual(pairs(prose, list('began')), []);
  assert.deepEqual(pairs(prose, new Set(PROSE_REST)).sort(), ['accept>access', 'arrived>arrival', 'began>begin', 'care>core', 'creating>creative', 'designs>designed', 'foot>food',
    'internal>internet', 'made>make', 'residence>residency', 'steal>steel', 'then>them', 'tracked>tracks'], 'control: every pair is a close variant when the list lacks its rare member');
  assert.deepEqual(pairs(prose, new Set([...list('began')].filter((w) => w !== 'internal'))), ['internal>internet'], 'limit: a word missing from the supplied word list stays a candidate');
  assert.deepEqual(pairs(prose, list()), ['began>begin'], 'limit: irregular inflections are not derived (began is no regular form of begin), so the list must hold them');
});

const SYSTEM_WORDS = '/usr/share/dict/words';
test('with the system word list (when present): the healthy prose gives no row but an irregular form the list lacks, while "Retrun" and "Humidty" stay candidates', { skip: !existsSync(SYSTEM_WORDS) && `no ${SYSTEM_WORDS}` }, async () => {
  const dictionary = await loadDictionary(SYSTEM_WORDS);
  assert.deepEqual(pairs([page('prose', PROSE)], dictionary), dictionary.has('began') ? [] : ['began>begin'], 'an old list without "began" keeps the irregular pair (documented limit)');
  assert.deepEqual(pairs([page('loans', [...LOANS, 'Retrun selected'])], dictionary), ['retrun>return']);
  assert.deepEqual(pairs([page('sensors', [...times('Humidity', 3), 'Humidty'])], dictionary), ['humidty>humidity']);
});

test('loadDictionary: one word per line, case-folded and composed; blank lines and spaces are ignored; an empty or missing list is an error', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'passive-dictionary-'));
  try {
    await writeFile(join(dir, 'words.txt'), 'Return\r\n  shelf \n\nHUMIDITÉ\n');
    assert.deepEqual([...await loadDictionary(join(dir, 'words.txt'))].sort(), ['humidité', 'return', 'shelf']);
    await writeFile(join(dir, 'empty.txt'), '\n \n');
    await assert.rejects(loadDictionary(join(dir, 'empty.txt')), /has no words/);
    await assert.rejects(loadDictionary(join(dir, 'missing.txt')), /ENOENT/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

// Review fixes. A list must fit the captured text: a list that does not know at least half of the distinct captured words of 4 or more
// letters (directly or as a regular inflection of a listed word) does not describe that text, so rare-variant is unassessed and gives no row.
const RU_WATERING = ['Лейка стоит у входа в теплицу.', 'Полная лейка весит много.', 'Старая лейка протекает.', 'Возьмите лейку у двери.', 'Томаты растут быстро, огурцы тоже растут.'];
const RU_LIST = new Set(['лейка', 'стоит', 'входа', 'теплицу', 'полная', 'весит', 'много', 'старая', 'протекает', 'возьмите', 'двери', 'томаты', 'растут', 'быстро', 'огурцы', 'тоже']);
const fit = (states, dictionary) => { const r = wordingCoverage(states, { dictionary }).rare; return [r.assessed, r.reason ?? null, r.knownWords, r.capturedWords, r.knownShare]; };

test('rare-variant needs a word list that fits the captured text: under half of the distinct captured words known gives no row and an unassessed family; the share is reported', () => {
  const ru = [page('watering', RU_WATERING)];
  assert.deepEqual(fit(ru, LEXICON), [false, 'dictionary does not fit the captured text', 0, 17, 0], 'an English list on a Russian page');
  assert.deepEqual(rare(ru, LEXICON), [], 'and no row, although "лейку" is one edit from "лейка" seen three times');
  assert.deepEqual(fit(ru, RU_LIST), [true, null, 16, 17, 0.94]);
  assert.deepEqual(pairs(ru, RU_LIST), ['лейку>лейка'], 'limit: with a fitting Russian list a case ending is a candidate, because the inflection rules are English');
  assert.deepEqual(fit([page('half', ['Water desk card soil'])], new Set(['water', 'desk'])), [true, null, 2, 4, 0.5], 'exactly half known fits');
  assert.deepEqual(fit([page('under', ['Water desk card soil tray'])], new Set(['water', 'desk'])), [false, 'dictionary does not fit the captured text', 2, 5, 0.4], 'under half does not');
  assert.deepEqual(fit([page('inflected', ['Loans desks cards'])], new Set(['loan', 'desk'])), [true, null, 2, 3, 0.67], 'a regular inflection of a listed word is known');
  assert.deepEqual(fit([page('frequent', [...times('Tray', 3), 'Trays'])], new Set(['other'])), [false, 'dictionary does not fit the captured text', 0, 2, 0],
    'an inflection of a frequent captured word says nothing about the list');
  assert.deepEqual(fit([page('blank', ['On it', '12 34'])], new Set(['other'])), [true, null, 0, 0, null], 'no captured word of 4 letters: nothing to compare, nothing unfit');
  const german = [page('beete', ['Die Bewässerung startet früh.', 'Die Bewässerung endet spät.', 'Heute läuft die Bewässerung.', 'Wir prüfen die Bewässrung täglich.'])];
  const de = new Set(['die', 'bewässerung', 'startet', 'früh', 'endet', 'spät', 'heute', 'läuft', 'wir', 'prüfen', 'täglich']);
  assert.deepEqual([...fit(german, de).slice(0, 2), pairs(german, de), wordingCoverage(german, { dictionary: de }).rare.properNouns], [true, null, [], 0],
    'limit: German nouns are capitalised mid-sentence, so they are read as names; the noun is a frequent name, so its typo is neither a row nor counted');
});

test('report: a word list that does not fit the captured text is named as such, with its share, and no rare-variant row', () => {
  const ru = [page('watering', RU_WATERING)];
  const md = toMarkdown(runDetectors(ru, { dictionary: LEXICON }), ru, { dictionary: LEXICON });
  assert.match(md, new RegExp(`^rare-variant: unassessed \\(dictionary does not fit the captured text\\)\\. The supplied word list \\(${LEXICON.size} words\\) knows 0 of 17 distinct captured words `
    + 'of 4 or more letters \\(0 %\\), under half, so it does not describe this text; it must match the page language\\. No rare-variant row here says nothing about spelling\\.$', 'm'));
  assert.doesNotMatch(md, /seen once was compared/);
  const loans = [page('loans', [...LOANS, 'Retrun selected'])];
  assert.match(toMarkdown([], loans, { dictionary: LEXICON }), /when it is not in the supplied dictionary \(\d+ words; it knows 15 of 16 distinct captured words of 4 or more letters, 94 %\)/);
});

test('loadDictionary: lines end at LF, CRLF or CR; a line holding more than one word is refused, so a space-separated list never loads as one word', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'passive-dictionary-'));
  try {
    await writeFile(join(dir, 'cr.txt'), 'return\rshelf\rhumidity\r');
    assert.deepEqual([...await loadDictionary(join(dir, 'cr.txt'))].sort(), ['humidity', 'return', 'shelf'], 'old Mac line ends');
    await writeFile(join(dir, 'mixed.txt'), '﻿Return\r\nshelf\rhumidity\n');
    assert.deepEqual([...await loadDictionary(join(dir, 'mixed.txt'))].sort(), ['humidity', 'return', 'shelf'], 'a byte-order mark and mixed line ends');
    for (const [name, content, line] of [['spaced.txt', 'return shelf humidity\n', 1], ['inner.txt', 'return\nshelf  life\n', 2], ['tab.txt', 'return\tshelf', 1], ['nbsp.txt', 'loan\nshelf mark', 2]]) {
      await writeFile(join(dir, name), content);
      await assert.rejects(loadDictionary(join(dir, name)), new RegExp(`dictionary .*${name} line ${line} holds more than one word; one word per line is expected`), name);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
