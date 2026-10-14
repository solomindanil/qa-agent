import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { partitionWorklist, partitionWorklistV2, partitionLinesV2 } from '../tools/passive-capture/partitions.mjs';

// partitions-v2: rows stated in a field's own help text and rows inferred from field kinds and required markers, beside the declared
// rows. Neutral domains only: D-A library patron forms, D-B greenhouse sensor settings. Every row stays a planned check.
const STYLE = { textAlign: 'start', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', color: 'rgb(33, 37, 41)', paddingLeft: '12px', paddingRight: '0px' };
const field = (name, over = {}) => ({ sel: `#${name}`, tag: 'input', type: 'text', textLike: true, id: name, name, placeholder: null,
  label: { text: name, source: 'label-for' }, form: 0, rect: { x: 100, y: 0, w: 300, h: 38 }, disabled: false, inactive: false, style: STYLE, constraints: {}, ...over });
const labelled = (name, text, over = {}) => field(name, { label: { text, source: 'label-for' }, ...over });
const declared = (name, type, constraints, over = {}) => field(name, { type, textLike: !['file', 'checkbox', 'radio', 'range'].includes(type), constraints, ...over });
const hinted = (hint, hintSource = 'aria-describedby') => ({ hint, hintSource });
const facts = (over = {}) => ({ url: 'http://app.test/', elements: [], fields: [], fileInputs: [], fileInputsNotShown: 0, controls: [], formCount: 1,
  activeContext: { nativeModal: null, inertRoots: [], ariaModalDeclared: [] }, ...over });
const state = (label, fields, over = {}) => ({ label, url: `http://app.test/${label}`, facts: facts({ url: `http://app.test/${label}`, fields, ...over }), axe: { available: false } });
const hiddenFile = (name, over = {}) => ({ sel: `#${name}`, id: name, name, form: 0, label: { text: name, source: 'label-for' }, disabled: false, inactive: false, ...over });
const planned = (w) => w.rows.map((r) => [r.name, r.partition, r.probe, r.confidence]);
const E = { kind: 'empty' }; const V = (value) => ({ kind: 'value', value }); const L = (length) => ({ kind: 'length', length });
const F = (name, bytes) => ({ kind: 'file', name, ...(bytes === undefined ? {} : { bytes }) });
const WS = V('   ');
const LONG = 'Maria de los Angeles Villanueva Montenegro de la Concepcion Rodriguez';
const NAME_ROWS = (name) => [[name, 'name-hyphenated', V('Anne-Marie'), 'inferred'], [name, 'name-apostrophe', V("O'Neill"), 'inferred'],
  [name, 'name-diacritics', V('Zoë Núñez'), 'inferred'], [name, 'name-non-latin', V('张伟'), 'inferred'], [name, 'name-long', V(LONG), 'inferred']];
const REQUIRED_ROWS = (name) => [[name, 'empty', E, 'inferred'], [name, 'whitespace-only', WS, 'inferred']];
const INFERENCE = (over) => ({ confidence: { declared: 0, stated: 0, inferred: 0 }, kinds: {}, kindAmbiguous: 0, requiredInferred: 0, hinted: 0, statedAlsoDeclared: 0,
  statedAmbiguous: 0, fileInputs: { shown: 0, notShown: 0 }, fileInputsNotListed: {}, probeNotDerived: 0, hintFactsMissing: [], ...over });

// D-A: a patron-registration form validated by script only: no type=email, no required; label text, '*' markers and aria-required.
const PATRON = [labelled('fullName', 'Full name *'), labelled('contact', 'E-mail *'), labelled('phoneNumber', 'Phone'), declared('secret', 'password', {}, { label: { text: 'Password *', source: 'label-for' } }),
  labelled('card', 'Library card', { ariaRequired: true }), labelled('site', 'Your site', { placeholder: 'https://example.org' }), labelled('pc', 'Postcode'),
  labelled('reach', 'E-mail or phone'), labelled('displayName', 'Display name'), labelled('userName', 'Username'), labelled('copies', 'Copies')];
const PATRON_ROWS = [...REQUIRED_ROWS('fullName'), ...NAME_ROWS('fullName'), ...REQUIRED_ROWS('contact'),
  ['contact', 'email-without-at', V('missing-at-sign.example'), 'inferred'], ['contact', 'email-without-domain', V('missing-domain@'), 'inferred'],
  ['phoneNumber', 'phone-with-letters', V('01234 ABCDE'), 'inferred'], ...REQUIRED_ROWS('secret'), ...REQUIRED_ROWS('card'),
  ['site', 'url-without-scheme', V('no-scheme.example'), 'inferred']];

test('v2 D-A: a script-validated patron form with only label text and "*" markers gives inferred required, kind and name rows; v1 gives none', () => {
  assert.deepEqual(partitionWorklist([state('join', PATRON)]).rows, [], 'v1: no declared attribute, no row');
  const w = partitionWorklistV2([state('join', PATRON)]);
  assert.deepEqual(planned(w), PATRON_ROWS);
  assert.deepEqual(w.inference, INFERENCE({ confidence: { declared: 0, stated: 0, inferred: 17 }, kinds: { email: 1, password: 1, phone: 1, url: 1, name: 1, postcode: 1 },
    kindAmbiguous: 1, requiredInferred: 4 }));
  const basis = Object.fromEntries(w.rows.map((r) => [`${r.name} ${r.partition}`, r.basis]));
  assert.equal(basis['fullName empty'], 'inferred: "*" marker in label');
  assert.equal(basis['fullName name-long'], 'inferred: name=fullName (kind name)');
  assert.equal(basis['contact email-without-at'], 'inferred: label word "e-mail" (kind email)');
  assert.equal(basis['phoneNumber phone-with-letters'], 'inferred: name=phoneNumber (kind phone)');
  assert.equal(basis['card whitespace-only'], 'inferred: aria-required=true (not enforced by the browser)');
  assert.equal(basis['site url-without-scheme'], 'inferred: placeholder starting with a URL scheme (kind url)');
  assert.deepEqual(w.rows.map((r) => r.id), PATRON_ROWS.map((_, i) => `W${String(i + 1).padStart(3, '0')}`));
  assert.deepEqual(w.rows[0], { id: 'W001', states: ['join'], form: 0, sel: '#fullName', name: 'fullName', type: 'text', attribute: 'required', declared: null, partition: 'empty', probe: E,
    expectation: null, applicability: 'unknown', source: '"*" marker in label', basis: 'inferred: "*" marker in label',
    authority: 'requires write authority', status: 'not executed', confidence: 'inferred', kind: 'name' });
  assert.deepEqual(Object.keys(w.rows[0]), ['id', 'states', 'form', 'sel', 'name', 'type', 'attribute', 'declared', 'partition', 'probe', 'expectation', 'applicability', 'source', 'basis',
    'authority', 'status', 'confidence', 'kind']);
  const source = Object.fromEntries(w.rows.map((r) => [`${r.name} ${r.partition}`, r.source]));
  assert.deepEqual([source['fullName name-long'], source['contact email-without-at'], source['phoneNumber phone-with-letters'], source['card whitespace-only'], source['site url-without-scheme']],
    ['name=fullName (kind name)', 'label word "e-mail" (kind email)', 'name=phoneNumber (kind phone)', 'aria-required=true', 'placeholder starting with a URL scheme (kind url)']);
});

// D-B: a sensor-calibration upload whose help text states types and a size, a number field with a stated range, and a hidden file input.
const CAL_HIDDEN = hiddenFile('calibration', { accept: '.csv', multiple: true, label: { text: 'Choose calibration sheet', source: 'label-for' } });
const CALIBRATE = (hints) => [declared('readings', 'file', {}, hints ? hinted('CSV or TSV files, max 500 KB', 'next-sibling') : {}),
  declared('interval', 'number', {}, hints ? hinted('Between 5 and 120') : {}), labelled('label', 'Sensor label')];
const calibrate = (hints, label = 'calibrate') => state(label, CALIBRATE(hints), { fileInputsNotShown: 1,
  fileInputs: [{ ...CAL_HIDDEN, ...(hints ? hinted('Calibration sheet as .csv or .json, up to 2 MB') : {}) }] });

test('v2 D-B: help text that lists types and a size gives stated-type-listed, stated-type-not-listed and byte-size rows; every file input gets an empty-file row', () => {
  const w = partitionWorklistV2([calibrate(true)]);
  assert.deepEqual(planned(w), [
    ['readings', 'stated-type-listed', F('probe.csv'), 'stated'], ['readings', 'stated-type-listed', F('probe.tsv'), 'stated'], ['readings', 'stated-type-not-listed', F('probe.bin'), 'stated'],
    ['readings', 'stated-size-at-upper-limit', F('probe.csv', 500000), 'stated'], ['readings', 'stated-size-over-upper-limit', F('probe.csv', 512001), 'stated'], ['readings', 'empty-file', F('probe.csv', 0), 'inferred'],
    ['interval', 'stated-at-lower-limit', V('5'), 'stated'], ['interval', 'stated-under-lower-limit', V('4'), 'stated'], ['interval', 'stated-at-upper-limit', V('120'), 'stated'], ['interval', 'stated-over-upper-limit', V('121'), 'stated'],
    ['calibration', 'accept-inside', F('probe.csv'), 'declared'], ['calibration', 'accept-outside', F('probe.bin'), 'declared'], ['calibration', 'stated-type-listed', F('probe.json'), 'stated'],
    ['calibration', 'stated-type-not-listed', F('probe.bin'), 'stated'], ['calibration', 'stated-size-at-upper-limit', F('probe.csv', 2000000), 'stated'],
    ['calibration', 'stated-size-over-upper-limit', F('probe.csv', 2097153), 'stated'], ['calibration', 'empty-file', F('probe.csv', 0), 'inferred']]);
  assert.deepEqual(w.inference, INFERENCE({ confidence: { declared: 2, stated: 13, inferred: 2 }, hinted: 3, statedAlsoDeclared: 1, fileInputs: { shown: 1, notShown: 1 } }));
  const basis = Object.fromEntries(w.rows.map((r) => [`${r.name} ${r.partition}`, r.basis]));
  assert.equal(basis['readings stated-type-listed'], 'stated: "CSV, TSV" (next-sibling)', 'a type list is quoted as its matched types, as written');
  assert.equal(basis['readings stated-size-over-upper-limit'], 'stated: "max 500 KB" (next-sibling); read as 500000 (decimal) to 512000 (binary) bytes');
  assert.equal(basis['interval stated-over-upper-limit'], 'stated: "Between 5 and 120" (aria-describedby)');
  assert.equal(basis['calibration accept-inside'], 'declared accept=.csv (file input not visible at capture)');
  assert.equal(basis['calibration empty-file'], 'inferred: type=file; a zero-byte file (file input not visible at capture)');
  const source = Object.fromEntries(w.rows.map((r) => [`${r.name} ${r.partition}`, r.source]));
  assert.deepEqual([source['readings stated-type-listed'], source['readings stated-size-over-upper-limit'], source['interval stated-over-upper-limit'], source['calibration stated-type-listed'],
    source['calibration empty-file']], ['help text "CSV, TSV" (next-sibling)', 'help text "max 500 KB" (next-sibling)', 'help text "Between 5 and 120" (aria-describedby)',
    'help text ".csv, .json" (aria-describedby)', 'type=file']);
  assert.ok(w.rows.filter((r) => r.name === 'calibration').every((r) => r.notShown === true && r.type === 'file'));
  assert.ok(w.rows.filter((r) => r.name !== 'calibration').every((r) => !Object.hasOwn(r, 'notShown')));
  assert.deepEqual(partitionWorklist([calibrate(true)]).rows, [], 'v1 lists neither the stated limits nor the hidden file input');
});

test('v2: a form without help text gives no stated row; file inputs still get their empty-file row; nothing is invented', () => {
  const w = partitionWorklistV2([calibrate(false)]);
  assert.deepEqual(planned(w), [['readings', 'empty-file', F('probe.bin', 0), 'inferred'], ['calibration', 'accept-inside', F('probe.csv'), 'declared'],
    ['calibration', 'accept-outside', F('probe.bin'), 'declared'], ['calibration', 'empty-file', F('probe.csv', 0), 'inferred']]);
  assert.ok(w.rows.every((r) => r.confidence !== 'stated'));
  const quiet = partitionWorklistV2([state('desk', [labelled('qty', 'Quantity'), labelled('fullName', 'Full name'), declared('photo', 'file', { accept: 'model/x-unknown' })])]);
  assert.deepEqual(planned(quiet).filter(([, p]) => !/^name-|^accept-/.test(p)), [['photo', 'empty-file', null, 'inferred']],
    'a quantity without a stated limit gets no value row, a name no length row, and a file whose declared types give no file name no probe');
  assert.equal(quiet.inference.kinds.quantity, 1);
});

const V1_FORMS = [
  [declared('fullName', 'text', { required: true, maxlength: 40, autocomplete: 'name' }), declared('email', 'email', { required: true, autocomplete: 'email' }), declared('pin', 'password', { autocomplete: 'new-password' })],
  [declared('threshold', 'number', { min: '0', max: '50', step: '0.5' }), declared('calibration', 'file', { accept: '.csv' }), declared('start', 'date', { min: '2026-03-01', max: '2026-03-31', step: '7' })],
  [declared('loanLength', 'radio', { required: true }, { sel: '#loan-7' }), declared('loanLength', 'radio', {}, { sel: '#loan-14' }), declared('memo', 'textarea', { maxlength: 2147483647 }, { tag: 'textarea' })],
];
// The one named exception to the declared prefix (align review, MEDIUM): the v1 duplicate-identity suggestion comes from autofill tokens, not
// from an attribute the browser applies, so v2 lists it under its v1 id and place as an inferred test idea (expectation null, applicability
// unknown, its source; the v1 basis behind "inferred: "). Every other v1 row is declared and byte-identical, with confidence appended.
const AS_V2 = ({ expectation, basis, authority, status, ...r }) => (r.partition === 'duplicate-identity'
  ? { ...r, expectation: null, applicability: 'unknown', source: `autocomplete=${r.declared} in a sign-up context`, basis: `inferred: ${basis}; uniqueness is not a declared constraint`,
    authority, status, confidence: 'inferred' }
  : { ...r, expectation, basis, authority, status, confidence: 'declared' });
test('v2 keeps every declared row byte-identical: the v1 rows are its prefix with confidence "declared" appended, under the same ids; the duplicate-identity suggestion is the named exception', () => {
  for (const fields of V1_FORMS) {
    const states = [state('desk', fields), state('desk-mobile', fields)];
    const v1 = partitionWorklist(states); const v2 = partitionWorklistV2(states);
    assert.ok(v1.count > 0);
    assert.equal(JSON.stringify(v2.rows.slice(0, v1.count)), JSON.stringify(v1.rows.map(AS_V2)));
    assert.deepEqual(v2.coverage, v1.coverage, 'the declared coverage is unchanged');
    assert.ok(v2.rows.slice(v1.count).every((r) => r.confidence !== 'declared' || r.notShown), 'only rows of hidden file inputs add declared rows');
  }
  assert.deepEqual(V1_FORMS.map((fields) => partitionWorklist([state('desk', fields)]).rows.filter((r) => r.suggestion).length), [1, 0, 0], 'the exception is exercised by the sign-up form');
  assert.deepEqual(Object.keys(partitionWorklistV2([state('desk', V1_FORMS[0])])), ['scope', 'states', 'count', 'coverage', 'inference', 'rows']);
});

test('v2 kinds: autofill tokens outrank input modes, names and labels; a declared type covers its kind; documented multilingual label words; no guess on ambiguity', () => {
  const kindOf = (f) => partitionWorklistV2([state('desk', [f])]).rows.filter((r) => r.attribute === 'kind').map((r) => [r.kind, r.partition, r.basis]);
  assert.deepEqual(kindOf(labelled('x1', 'Phone', { constraints: { autocomplete: 'section-a shipping email' } })),
    [['email', 'email-without-at', 'inferred: autocomplete=email (kind email)'], ['email', 'email-without-domain', 'inferred: autocomplete=email (kind email)']]);
  assert.deepEqual(kindOf(labelled('x2', 'Contact', { constraints: { inputmode: 'tel' } })).map(([k, p]) => [k, p]), [['phone', 'phone-with-letters']]);
  assert.deepEqual(kindOf(labelled('phone', 'Phone', { constraints: { autocomplete: 'email', inputmode: 'tel' } })).map(([k]) => k), ['email', 'email'], 'autofill outranks input mode, name and label');
  assert.deepEqual(kindOf(labelled('email', 'E-mail', { constraints: { inputmode: 'tel' } })).map(([k]) => k), ['phone'], 'input mode outranks the name token and the label');
  assert.deepEqual(kindOf(declared('tel', 'tel', {})), [['phone', 'phone-with-letters', 'inferred: declared type=tel, whose format the browser does not check (kind phone)']]);
  assert.deepEqual(partitionWorklistV2([state('desk', [declared('tel', 'tel', {})])]).rows.map((r) => [r.expectation, r.applicability, r.source]), [[null, 'unknown', 'type=tel (kind phone)']]);
  assert.deepEqual(kindOf(declared('mail', 'email', {}, { label: { text: 'E-mail', source: 'label-for' } })), [], 'type=email: the browser checks it, v1 lists the malformed row');
  assert.deepEqual(kindOf(declared('site', 'url', {})), []);
  const long = partitionWorklistV2([state('desk', [declared('fullName', 'text', { maxlength: 40 }), declared('surname', 'text', { maxlength: 69 })])]).rows.filter((r) => r.partition === 'name-long');
  assert.deepEqual(long.map((r) => r.basis), ['inferred: name=fullName (kind name); longer than the declared maxlength=40, so the browser stops typing at 40', 'inferred: name=surname (kind name)']);
  const kinds = (fields) => partitionWorklistV2([state('desk', fields)]).inference.kinds;
  assert.deepEqual(kinds([labelled('a', 'Correo electrónico'), labelled('b', 'Mot de passe'), labelled('c', 'Téléphone'), labelled('d', 'Пароль'), labelled('e', 'Telefon'),
    labelled('f', 'Courriel'), labelled('g', 'Contraseña')]), { email: 2, password: 3, phone: 2 });
  assert.deepEqual(kinds([labelled('a', 'Contact', { placeholder: 'reader@example.org' }), labelled('zip', 'Area'), labelled('n', 'Name'), labelled('p', "Patron's full name"),
    field('emailAddress'), field('post_code'), field('given-name')]), { email: 2, name: 3, postcode: 2 });
  assert.deepEqual(kinds([field('userName'), field('sensorName'), labelled('s', 'Sensor name'), labelled('d', 'Display name'), field('mailingList'), field('hotel'),
    declared('bio', 'textarea', {}, { tag: 'textarea', label: { text: 'E-mail', source: 'label-for' } }), declared('count', 'number', {}, { label: { text: 'Phone', source: 'label-for' } })]), {},
  'name needs a person qualifier or the bare word; only text and search inputs are inferred');
  const both = partitionWorklistV2([state('desk', [labelled('reach', 'E-mail or phone'), field('contact', { id: 'phone', name: 'email' })])]);
  assert.deepEqual([both.rows.length, both.inference.kindAmbiguous], [0, 2]);
  assert.deepEqual(kinds([labelled('phone', 'E-mail or phone')]), {}, 'a label that offers alternatives vetoes every level, the name token included');
});

test('v2 required: a "*" marker in label or placeholder or aria-required gives empty and whitespace-only rows; never beside a declared required', () => {
  const req = (f) => planned(partitionWorklistV2([state('desk', [f])])).filter(([, p]) => p === 'empty' || p === 'whitespace-only').map(([, p, , c]) => `${p}/${c}`);
  for (const text of ['Shelf *', 'Shelf*', 'Shelf (*)', '* Shelf', 'Shelf*:']) assert.deepEqual(req(labelled('shelf', text)), ['empty/inferred', 'whitespace-only/inferred'], text);
  for (const text of ['Grid 5*3', 'Shelf', 'Rows * columns']) assert.deepEqual(req(labelled('shelf', text)), [], text);
  assert.deepEqual(req(labelled('shelf', 'Shelf', { placeholder: 'Shelf code *' })), ['empty/inferred', 'whitespace-only/inferred']);
  assert.deepEqual(req(declared('shelf', 'text', { required: true }, { label: { text: 'Shelf *', source: 'label-for' } })), ['empty/declared'], 'the declared row only');
  assert.deepEqual(req(declared('terms', 'checkbox', {}, { label: { text: 'I accept the loan rules *', source: 'label-for' } })), ['empty/inferred'], 'whitespace only for text-like fields');
  assert.deepEqual(req(declared('level', 'range', {}, { ariaRequired: true })), [], 'a range cannot be empty');
  assert.deepEqual(req(declared('period', 'radio', {}, { label: { text: '7 days *', source: 'label-for' } })), [], 'a radio label names one option, not the group');
});

test('v2 stated limits: lengths, values, sizes and units; unresolved, ambiguous and already-declared limits; probes are exact and never invented', () => {
  const rows = (f) => planned(partitionWorklistV2([state('desk', [f])])).filter(([, , , c]) => c === 'stated').map(([, p, probe]) => [p, probe]);
  assert.deepEqual(rows(labelled('memo', 'Memo', hinted('Up to 40 characters'))), [['stated-length-at-upper-limit', L(40)], ['stated-length-over-upper-limit', L(41)]]);
  assert.deepEqual(rows(declared('pin', 'password', {}, hinted('At least 8 characters, at most 64 characters'))),
    [['stated-length-at-lower-limit', L(8)], ['stated-length-under-lower-limit', L(7)], ['stated-length-at-upper-limit', L(64)], ['stated-length-over-upper-limit', L(65)]]);
  assert.deepEqual(rows(labelled('memo', 'Memo', hinted('Between 8 and 64 characters'))), [['stated-length-at-lower-limit', L(8)], ['stated-length-under-lower-limit', L(7)],
    ['stated-length-at-upper-limit', L(64)], ['stated-length-over-upper-limit', L(65)]], 'a unit after the second number of a range applies to both');
  assert.deepEqual(rows(labelled('qty', 'Quantity', hinted('Max. 99'))), [['stated-at-upper-limit', V('99')], ['stated-over-upper-limit', V('100')]], 'a text field of kind quantity holds the number');
  assert.deepEqual(rows(declared('temp', 'number', {}, hinted('from -2.5 to 2.5'))), [['stated-at-lower-limit', V('-2.5')], ['stated-under-lower-limit', V('-2.6')], ['stated-at-upper-limit', V('2.5')], ['stated-over-upper-limit', V('2.6')]]);
  assert.deepEqual(rows(labelled('tags', 'Tags', hinted('up to 10 tags'))), [['stated-upper-limit', null]], 'what the number counts in a text field is not derived');
  assert.deepEqual(rows(declared('days', 'number', {}, hinted('up to 30 days'))), [['stated-at-upper-limit', V('30')], ['stated-over-upper-limit', V('31')]], 'a number field holds the number');
  assert.deepEqual(rows(declared('scan', 'file', {}, hinted('Up to 5 files, 2MB each'))).map(([p, probe]) => [p, probe?.bytes ?? null]),
    [['stated-size-at-upper-limit', 2000000], ['stated-size-over-upper-limit', 2097153], ['stated-upper-limit', null]]);
  assert.deepEqual(rows(declared('scan', 'file', {}, hinted('Files under 1 MB'))).map(([p, probe]) => [p, probe.bytes]), [['stated-size-at-upper-limit', 999999], ['stated-size-over-upper-limit', 1048576]],
    'an exclusive bound: the largest size under both readings and the smallest at or over both');
  assert.deepEqual(rows(declared('scan', 'file', {}, hinted('At least 1 KiB, max 2.5 MB'))).map(([p, probe]) => [p, probe.bytes]),
    [['stated-size-at-lower-limit', 1024], ['stated-size-under-lower-limit', 1023], ['stated-size-at-upper-limit', 2500000], ['stated-size-over-upper-limit', 2621441]]);
  assert.deepEqual(rows(declared('scan', 'file', {}, hinted('Max 2 GB'))), [['stated-size-at-upper-limit', null], ['stated-size-over-upper-limit', null]], 'probes over 1 GiB are not derived');
  assert.deepEqual(rows(labelled('memo', 'Memo', hinted('Max 2 MB'))), [['stated-upper-limit', null]], 'a size on a field that takes no file');
  assert.deepEqual(rows(declared('scan', 'file', {}, hinted('Max 1 GiB'))).map(([p, probe]) => [p, probe?.bytes ?? null]), [['stated-size-at-upper-limit', 1073741824], ['stated-size-over-upper-limit', null]],
    'a size probe is derived up to 1 GiB and not beyond');
  assert.deepEqual(rows(labelled('memo', 'Memo', hinted('Up to 1000000 characters'))), [['stated-length-at-upper-limit', L(1000000)], ['stated-length-over-upper-limit', null]], 'length probes stop at 1000000 characters');
  assert.deepEqual(rows(labelled('memo', 'Memo', hinted('At least 1 character'))), [['stated-length-at-lower-limit', L(1)]], 'an under-min probe that would be empty is left to the empty row');
  assert.deepEqual(rows(declared('scan', 'file', {}, hinted('Up to 1,5 MB'))), [], 'a decimal comma is not read');
  const ambiguous = partitionWorklistV2([state('desk', [declared('scan', 'file', {}, hinted('2 MB for photos, 10 MB for video')), declared('clip', 'file', {}, hinted('Files over 5 MB are refused'))])]);
  assert.deepEqual([ambiguous.rows.filter((r) => r.confidence === 'stated').length, ambiguous.inference.statedAmbiguous], [0, 2]);
  const twice = partitionWorklistV2([state('desk', [declared('copies', 'number', {}, hinted('max 5 (at most 5)'))])]);
  assert.equal(twice.rows.length, 2, 'one limit stated twice with the same value gives one pair');
  const both = partitionWorklistV2([state('desk', [declared('copies', 'number', { max: '10' }, hinted('Up to 10')), declared('memo', 'text', { maxlength: 40 }, hinted('Up to 40 characters')),
    declared('scan', 'file', { accept: '.csv,.json' }, hinted('CSV or JSON only'))])]);
  assert.deepEqual([both.rows.filter((r) => r.confidence === 'stated').map((r) => r.partition), both.inference.statedAlsoDeclared], [['stated-type-not-listed'], 4]);
  for (const hint of ['1,000 max', 'up to 1,000', 'Version 2.0 or later', 'Allowed: 5*3 grid', 'Use the e.g. form', 'Call us under 0800 123']) {
    assert.deepEqual(rows(labelled('memo', 'Memo', hinted(hint))), [], hint);
  }
});

test('v2 stated types: dotted extensions, MIME types and upper-case format words in a file input help text only; unknown MIME types are left to the agent', () => {
  const types = (hint, type = 'file') => planned(partitionWorklistV2([state('desk', [declared('scan', type, {}, hinted(hint))])])).filter(([, p]) => p.startsWith('stated-'))
    .map(([, p, probe]) => [p, probe?.name ?? null]);
  assert.deepEqual(types('PDF, image/* or .heic'), [['stated-type-listed', 'probe.pdf'], ['stated-type-listed', 'probe.png'], ['stated-type-listed', 'probe.heic'], ['stated-type-not-listed', 'probe.bin']]);
  assert.deepEqual(types('Plain .txt, .bin or image/png'), [['stated-type-listed', 'probe.txt'], ['stated-type-listed', 'probe.bin'], ['stated-type-listed', 'probe.png'], ['stated-type-not-listed', null]]);
  assert.deepEqual(types('model/x-unknown sheets'), [['stated-type-listed', null], ['stated-type-not-listed', 'probe.bin']]);
  assert.deepEqual(types('.CSV or text/csv'), [['stated-type-listed', 'probe.csv'], ['stated-type-not-listed', 'probe.bin']], 'one probe per file name');
  assert.deepEqual(types('csv files, see readings.csv or example.org'), [], 'lower-case words and file names are not type lists');
  assert.deepEqual(types('CSV or JSON', 'text'), [], 'types matter only for file inputs');
});

test('v2: hidden file inputs are listed with their declared accept and stated rows unless disabled or inactive; older captures leave hint facts unassessed', () => {
  const w = partitionWorklistV2([state('desk', [], { fileInputsNotShown: 3, fileInputs: [hiddenFile('photo', { accept: 'image/*', required: true, label: { text: 'Add photo *', source: 'label-for' } }),
    hiddenFile('firmware', { disabled: true }), hiddenFile('spare', { inactive: true })] })]);
  assert.deepEqual(planned(w), [['photo', 'empty', E, 'declared'], ['photo', 'accept-inside', F('probe.png'), 'declared'], ['photo', 'accept-outside', F('probe.bin'), 'declared'],
    ['photo', 'empty-file', F('probe.png', 0), 'inferred']]);
  assert.deepEqual([w.inference.fileInputs, w.inference.fileInputsNotListed, w.coverage.fileInputsNotShown], [{ shown: 0, notShown: 1 }, { disabled: 1, inactive: 1 }, 3]);
  const older = { label: 'old', url: 'http://app.test/old', facts: { url: 'http://app.test/old', fields: [labelled('contact', 'E-mail *', { hint: 'Up to 40 characters' })], fileInputsNotShown: 1 } };
  const o = partitionWorklistV2([older]);
  assert.deepEqual(o.inference.hintFactsMissing, ['old']);
  assert.deepEqual(planned(o).map(([, p]) => p), ['empty', 'whitespace-only', 'email-without-at', 'email-without-domain'], 'labels are read; help text is not, in an older capture');
});

test('v2 is deterministic, merges one route at two widths, keeps label, placeholder and help text out of the rows except the matched words, and never makes a candidate', () => {
  const canary = [labelled('contact', 'CANARY-LABEL E-mail *', { placeholder: 'CANARY-PLACEHOLDER', hint: 'CANARY-HINT up to 40 characters', hintSource: 'next-sibling' })];
  const at = (label, url) => ({ label, url, facts: facts({ url, fields: canary }) });
  const w = partitionWorklistV2([at('join-desktop', 'http://app.test/join'), at('join-mobile', 'http://app.test/join?ref=CANARY-Q')]);
  assert.ok(w.rows.length > 0 && w.rows.every((r) => JSON.stringify(r.states) === '["join-desktop","join-mobile"]'));
  assert.ok(!JSON.stringify(w).includes('CANARY'), JSON.stringify(w.rows.map((r) => r.basis)));
  assert.equal(JSON.stringify(partitionWorklistV2([at('join-desktop', 'http://app.test/join'), at('join-mobile', 'http://app.test/join?ref=CANARY-Q')])), JSON.stringify(w));
  assert.ok(w.rows.every((r) => r.authority === 'requires write authority' && r.status === 'not executed' && !Object.hasOwn(r, 'verdict') && !Object.hasOwn(r, 'detector')));
  const all = partitionWorklistV2([state('join', PATRON), calibrate(true, 'cal'), state('desk', V1_FORMS[0])]);
  const prefix = { declared: /^declared /, stated: /^stated: "/, inferred: /^inferred: / };
  assert.ok(all.rows.every((r) => prefix[r.confidence].test(r.basis)), 'every basis names its confidence');
});

test('v2 report: one section lists every row with its confidence, says what is stated and inferred, and claims no completeness', async () => {
  const w = partitionWorklistV2([state('join', PATRON), calibrate(true, 'cal'), { label: 'old', url: 'http://app.test/old', facts: { url: 'http://app.test/old', fields: [field('x')] } }]);
  const lines = partitionLinesV2(w); const md = lines.join('\n');
  assert.deepEqual(lines.slice(0, 3), ['', '## Input partitions to try (not executed): declared, stated and inferred', '']);
  assert.match(md, /^34 planned check\(s\) for 15 field\(s\) and 1 file input\(s\) not visible at capture: 2 declared, 13 stated in a field's own help text, 19 inferred\. They are not candidates and nothing was typed: each row requires write authority and is not executed, and any result belongs to the agent's own records\.$/m);
  assert.match(md, /^Stated and inferred rows are test ideas from a source of unknown applicability, not expected results\. Each shows "expected: unknown" and names its source; whether the application has that rule is not known\. A limit that is neither declared nor stated is never invented\.$/m);
  assert.match(md, /^Field kinds: email 1, password 1, phone 1, url 1, name 1, postcode 1\. Kind not inferred for 1 field\(s\) whose strongest signal names more than one kind, or whose label, placeholder, name or id offers alternatives or names a user name\.$/m);
  assert.match(md, /^Stated types or limits already declared \(no stated row\): 1\.$/m);
  assert.match(md, /^Help text, aria-required and hidden file input facts not recorded in: old \(older capture\); stated rows and aria-required inference are unassessed there\.$/m);
  const table = lines.filter((l) => /^\| W\d{3} /.test(l));
  assert.equal(table.length, 34); assert.ok(table.every((l) => l.endsWith('| requires write authority — not executed |')));
  assert.ok(table.includes('| W022 | readings `#readings` | stated-size-over-upper-limit | file `probe.csv` of 512001 bytes | expected: unknown (source: help text "max 500 KB" (next-sibling)) | stated | stated: "max 500 KB" (next-sibling); read as 500000 (decimal) to 512000 (binary) bytes | cal | requires write authority — not executed |'), table.join('\n'));
  assert.doesNotMatch(md, /\b(pass|passed|clean|verified)\b/i);
  assert.doesNotMatch(await readFile(new URL('../tools/passive-capture/partitions.mjs', import.meta.url), 'utf8'), /toolshop|practice software testing|onyx|nuanu|stack|localhost:\d+|127\.0\.0\.1:\d+/i);
});

// Review fixes (partitions-v2-FIX): healthy negative controls for false-positive classes on ordinary products, each beside a positive control.
const kindsAt = (fields) => { const w = partitionWorklistV2([state('desk', fields)]); return { rows: planned(w).filter(([, p]) => /^(email|url|phone|name)-/.test(p)), kinds: w.inference.kinds, ambiguous: w.inference.kindAmbiguous }; };

test('v2 fix (HIGH): a login field taking a user name or an e-mail gets no kind; an autofill token naming another purpose stops inference; alternatives and user-name words veto', () => {
  assert.deepEqual(kindsAt([labelled('who', 'Username or email', { name: 'email', constraints: { autocomplete: 'username' } })]), { rows: [], kinds: {}, ambiguous: 0 },
    'autocomplete=username: a declared purpose that is not a kind, so nothing is inferred and nothing is ambiguous');
  for (const token of ['username', 'username webauthn', 'one-time-code', 'organization', 'street-address', 'cc-name', 'cc-number', 'tel-extension', 'nickname']) {
    assert.deepEqual(kindsAt([labelled('contactEmail', 'E-mail', { constraints: { autocomplete: token } })]), { rows: [], kinds: {}, ambiguous: 0 }, token);
  }
  for (const text of ['Username or email', 'Email or username', 'Full name or email', 'E-mail / user name', 'Login or e-mail', 'Correo o usuario']) {
    assert.deepEqual(kindsAt([labelled('who', text)]), { rows: [], kinds: {}, ambiguous: 1 }, text);
  }
  assert.deepEqual(kindsAt([labelled('email', 'Username')]), { rows: [], kinds: {}, ambiguous: 1 }, 'a user-name label vetoes the e-mail name token');
  assert.deepEqual(kindsAt([labelled('username', 'E-mail')]), { rows: [], kinds: {}, ambiguous: 1 }, 'a user-name name token vetoes the e-mail label');
  assert.deepEqual(kindsAt([labelled('emailOrUsername', 'Sign in')]), { rows: [], kinds: {}, ambiguous: 1 }, 'alternatives in a name token');
  assert.deepEqual(kindsAt([labelled('email', 'Contact', { placeholder: 'Email or username' })]), { rows: [], kinds: {}, ambiguous: 1 }, 'alternatives in a placeholder');
  assert.deepEqual(kindsAt([labelled('email', 'Contact (email or phone)')]), { rows: [], kinds: {}, ambiguous: 1 }, 'alternatives inside parentheses');
  assert.deepEqual(kindsAt([labelled('contact', 'Contact', { constraints: { autocomplete: 'email' }, placeholder: 'Email or username' })]).kinds, {}, 'the veto holds over an autofill kind token');
  assert.deepEqual(kindsAt([labelled('reach', 'Phone or mobile')]).kinds, { phone: 1 }, 'alternatives of one kind settle it');
  assert.deepEqual(kindsAt([labelled('contact', 'Login email')]).kinds, { email: 1 }, 'a user-name word before the kind word is not its head');
  assert.deepEqual(kindsAt([labelled('who', 'Username')]), { rows: [], kinds: {}, ambiguous: 0 }, 'a user-name word alone vetoes nothing and is not ambiguous');
});

test('v2 fix (MEDIUM): a bare name or id token "name" is a person name only when the label (without one, the placeholder) agrees or both are absent', () => {
  const nameRows = (f) => planned(partitionWorklistV2([state('desk', [f])])).filter(([, p]) => p.startsWith('name-')).length;
  const lab = (text) => ({ text, source: text ? 'label-for' : 'none' });
  for (const [text, n] of [['Product name', 0], ['Sensor name', 0], ['Display name', 0], ['Title', 0], ['Name', 5], ['Your name', 5], ['Patron full name', 5], ['', 5]]) {
    assert.equal(nameRows(field('name', { label: lab(text) })), n, `name="name" labelled "${text}"`);
    assert.equal(nameRows(field('x', { id: 'name', name: null, label: lab(text) })), n, `id="name" labelled "${text}"`);
  }
  assert.equal(nameRows(field('name', { label: lab(''), placeholder: 'Resource name' })), 0, 'without a label, the placeholder decides');
  assert.equal(nameRows(field('name', { label: lab(''), placeholder: 'Your name' })), 5);
  assert.equal(nameRows(field('fullName', { label: lab('Product name') })), 5, 'a qualified token is not vetoed');
});

// A help text cut at 200 characters: an old capture cut inside a word (exactly 200 characters, no flag) or a new one cut at a space and flagged.
const at200 = (tail) => `${'Rinse the probe before each reading. '.repeat(6)}`.slice(0, 200 - tail.length) + tail;
test('v2 fix (MEDIUM): a limit or type reaching the end of a cut help text is not used and is counted; the same text uncut is read', () => {
  const stated = (f) => { const w = partitionWorklistV2([state('desk', [f])]); return [planned(w).filter(([, , , c]) => c === 'stated').map(([, p, probe]) => [p, probe]), w.inference.statedAmbiguous]; };
  assert.equal(at200(' Up to 2').length, 200);
  assert.deepEqual(stated(declared('limit', 'number', {}, hinted(at200(' Up to 2')))), [[], 1], 'an old capture cut inside "2048"');
  assert.deepEqual(stated(declared('limit', 'number', {}, hinted(at200(' Maximum 1')))), [[], 1], 'an old capture cut inside "1500"');
  assert.deepEqual(stated(labelled('memo', 'Memo', hinted(at200(' Max 1500 charac')))), [[], 1], 'an old capture cut inside the unit');
  assert.deepEqual(stated(declared('limit', 'number', {}, { hint: 'Readings settle after a minute. Up to 2048', hintSource: 'next-sibling', hintTruncated: true })), [[], 1], 'a flagged cut at a space');
  assert.deepEqual(stated(declared('limit', 'number', {}, hinted('Readings settle after a minute. Up to 2048'))), [[['stated-at-upper-limit', V('2048')], ['stated-over-upper-limit', V('2049')]], 0], 'uncut: read');
  assert.deepEqual(stated(declared('scan', 'file', {}, { hint: 'Sheets up to 2 MB. Accepted: .csv or .js', hintSource: 'next-sibling', hintTruncated: true })).map((x, i) => (i ? x : x.map(([p, probe]) => [p, probe?.name ?? null]))),
    [[['stated-type-listed', 'probe.csv'], ['stated-type-not-listed', 'probe.bin'], ['stated-size-at-upper-limit', 'probe.csv'], ['stated-size-over-upper-limit', 'probe.csv']], 1], 'a type cut at the end (".js" of ".json") is dropped');
  assert.deepEqual(stated(declared('limit', 'number', {}, { hint: 'Readings settle after a minute; max 50.', hintSource: 'next-sibling', hintTruncated: true })), [[['stated-at-upper-limit', V('50')], ['stated-over-upper-limit', V('51')]], 0],
    'a limit closed by a full stop before the cut is read');
  assert.deepEqual(stated(declared('scan', 'file', {}, { hint: 'Calibration sheets, 2 MB', hintSource: 'next-sibling', hintTruncated: true })), [[], 1], 'a bare size at the cut ("2 MB" of "2 MB each")');
  assert.match(partitionLinesV2(partitionWorklistV2([state('desk', [declared('limit', 'number', {}, hinted(at200(' Up to 2')))])])).join('\n'),
    /^Stated limits or types not used \(no row\): 1, stated twice with different values, in an unclear direction, in a negated clause, or at the end of a cut help text\.$/m);
});

test('v2 fix (MEDIUM): a kind word counts only as the head of a name, id, label or placeholder; search boxes are not inferred', () => {
  assert.deepEqual(kindsAt([field('email_subject'), field('emailNotifications'), field('phone_ext'), field('url_slug'), field('mobileAppName'), field('zipFile'),
    labelled('a', 'Email subject'), labelled('b', 'Website name'), labelled('c', 'Mobile app name'), labelled('d', 'URL slug'), labelled('e', 'Phone extension'),
    labelled('f', 'Find', { placeholder: 'Search by email' }), labelled('g', 'Zip file'), declared('q', 'search', {}, { placeholder: 'Search by email' }), declared('q2', 'search', {}, { name: 'email' })]),
  { rows: [], kinds: {}, ambiguous: 0 });
  assert.deepEqual(kindsAt([field('contactEmail'), field('email_address'), field('emailInput'), field('mobile_number'), labelled('h', 'E-mail address'), labelled('i', 'Phone number'),
    labelled('j', 'Your website URL'), labelled('k', 'E-Mail-Adresse'), labelled('l', 'Zip')]).kinds, { email: 5, phone: 2, url: 1, postcode: 1 });
});

test('v2 fix (MEDIUM): grouped thousands, percentages and currencies are not misread; on a text field only a quantity holds the number', () => {
  const rows = (f) => planned(partitionWorklistV2([state('desk', [f])])).filter(([, , , c]) => c === 'stated').map(([, p, probe]) => [p, probe]);
  for (const hint of ['Up to 10 000 EUR', 'Up to 10 000', "Up to 10'000", 'Up to 10 000 units', 'At least 1 000']) assert.deepEqual(rows(declared('budget', 'number', {}, hinted(hint))), [], hint);
  assert.deepEqual(rows(declared('scan', 'file', {}, hinted('Max 2 500 KB'))), [], 'a grouped size is not read in part');
  assert.deepEqual(rows(declared('rate', 'number', {}, hinted('Up to 20%'))), [['stated-at-upper-limit', V('20')], ['stated-over-upper-limit', V('21')]], 'a number field holds the number, whatever its unit');
  const promo = partitionWorklistV2([state('desk', [labelled('promo', 'Promo code', hinted('Save up to 20% on your first order'))])]).rows;
  assert.deepEqual(promo.map((r) => [r.partition, r.probe, r.basis]), [['stated-upper-limit', null, 'stated: "up to 20%" (aria-describedby); a number on a text field that is not a quantity is not derived']]);
  assert.deepEqual(rows(labelled('tags', 'Tags', hinted('Up to 10, separated by commas'))), [['stated-upper-limit', null]]);
  assert.deepEqual(rows(labelled('copies', 'Copies', hinted('Between 1 and 5'))), [['stated-lower-limit', null], ['stated-upper-limit', null]], 'a text field that is not a quantity');
  assert.deepEqual(rows(labelled('qty', 'Quantity', hinted('Between 1 and 5'))), [['stated-at-lower-limit', V('1')], ['stated-under-lower-limit', V('0')], ['stated-at-upper-limit', V('5')], ['stated-over-upper-limit', V('6')]]);
  assert.deepEqual(rows(declared('price', 'number', {}, hinted('Between 5 and 50 EUR'))), [['stated-at-lower-limit', V('5')], ['stated-under-lower-limit', V('4')], ['stated-at-upper-limit', V('50')], ['stated-over-upper-limit', V('51')]]);
});

test('v2 fix (LOW): a dotted extension needs a letter; a negated clause lists no type; a stated length beyond the declared maxlength says the browser stops there', () => {
  const file = (hint) => { const w = partitionWorklistV2([state('desk', [declared('scan', 'file', {}, hinted(hint))])]);
    return [planned(w).filter(([, p]) => p !== 'empty-file').map(([, p, probe]) => [p, probe?.name ?? null, probe?.bytes ?? null]), w.inference.statedAmbiguous, planned(w).find(([, p]) => p === 'empty-file')[2]?.name ?? null]; };
  assert.deepEqual(file('PDF files are not accepted; use DOCX'), [[['stated-type-listed', 'probe.docx', null], ['stated-type-not-listed', 'probe.bin', null]], 1, 'probe.docx']);
  assert.deepEqual(file('GIF not supported. JPG only'), [[['stated-type-listed', 'probe.jpg', null], ['stated-type-not-listed', 'probe.bin', null]], 1, 'probe.jpg']);
  assert.deepEqual(file('Max size .5 MB'), [[], 0, 'probe.bin'], '".5" is not an extension (and a size without a leading digit is not read)');
  assert.deepEqual(file('JPG or PNG, no more than 5 MB'), [[['stated-type-listed', 'probe.jpg', null], ['stated-type-listed', 'probe.png', null], ['stated-type-not-listed', 'probe.bin', null],
    ['stated-size-at-upper-limit', 'probe.jpg', 5000000], ['stated-size-over-upper-limit', 'probe.jpg', 5242881]], 0, 'probe.jpg'], '"no more than" is a limit, not a negation');
  const basis = (constraints) => partitionWorklistV2([state('desk', [declared('memo', 'text', constraints, hinted('Max 100 characters'))])]).rows.filter((r) => r.confidence === 'stated').map((r) => r.basis);
  assert.deepEqual(basis({ maxlength: 50 }), ['stated: "Max 100 characters" (aria-describedby); longer than the declared maxlength=50, so the browser stops typing at 50',
    'stated: "Max 100 characters" (aria-describedby); longer than the declared maxlength=50, so the browser stops typing at 50']);
  assert.deepEqual(basis({ maxlength: 100 }), [], 'already declared');
  assert.deepEqual(basis({ maxlength: 101 }), ['stated: "Max 100 characters" (aria-describedby)', 'stated: "Max 100 characters" (aria-describedby)']);
});

test('v2 fix (LOW): the report keeps hidden file inputs of older captures and file inputs not listed; a file input seen shown and hidden gets its declared rows once; hidden inferred rows say so', () => {
  const older = { label: 'old', url: 'http://app.test/old', facts: { url: 'http://app.test/old', fields: [labelled('shelf', 'Shelf')], fileInputsNotShown: 2 } };
  assert.match(partitionLinesV2(partitionWorklistV2([older])).join('\n'),
    /^File inputs not visible at capture: 2 over all captures \(often opened through a styled button or label\); in old \(older capture\) they were counted only, so their rows are not listed\.$/m);
  const onlyDisabled = partitionLinesV2(partitionWorklistV2([state('desk', [], { fileInputsNotShown: 1, fileInputs: [hiddenFile('firmware', { disabled: true })] })])).join('\n');
  assert.doesNotMatch(onlyDisabled, /No form field or file input was listed/);
  assert.match(onlyDisabled, /^File inputs not visible at capture and not listed: disabled 1\.$/m);
  const at = (label, over) => ({ label, url: 'http://app.test/sensor', facts: facts({ url: 'http://app.test/sensor', ...over }) });
  for (const order of [['wide', 'narrow'], ['narrow', 'wide']]) {
    const states = order.map((l) => (l === 'wide' ? at(l, { fields: [declared('photo', 'file', { accept: 'image/*' })] }) : at(l, { fileInputsNotShown: 1, fileInputs: [hiddenFile('photo', { accept: 'image/*' })] })));
    assert.deepEqual(planned(partitionWorklistV2(states)), [['photo', 'accept-inside', F('probe.png'), 'declared'], ['photo', 'accept-outside', F('probe.bin'), 'declared'], ['photo', 'empty-file', F('probe.png', 0), 'inferred']], order.join(' then '));
  }
  const req = partitionWorklistV2([state('desk', [], { fileInputsNotShown: 1, fileInputs: [hiddenFile('photo', { ariaRequired: true })] })]).rows.filter((r) => r.attribute === 'required');
  assert.deepEqual(req.map((r) => r.basis), ['inferred: aria-required=true (not enforced by the browser) (file input not visible at capture)']);
});

// Coordinator alignment (partitions-v2-ALIGN): a stated or inferred row is a test idea from a source of unknown applicability, never an
// expected result. It carries expectation null, applicability "unknown" and the source of the idea; declared rows keep their v1 expectation.
const BROAD = () => [state('join', PATRON), calibrate(true, 'cal'), ...V1_FORMS.map((fields, i) => state(`v1-${i}`, fields)),
  state('vocab', [declared('interval', 'number', {}, hinted('Between 5 and 120')), declared('pin', 'password', {}, hinted('At least 8 characters, at most 64 characters')),
    declared('scan', 'file', {}, hinted('CSV only, at least 1 KiB, max 2.5 MB')), labelled('copies', 'Copies', hinted('Between 1 and 5'))]),
  state('hidden', [], { fileInputsNotShown: 1, fileInputs: [hiddenFile('photo', { accept: 'image/*', required: true })] })];
const SCOPE_V2 = "Planned checks derived from declared field attributes, from types and limits stated in a field's own help text, and from inferred field kinds and required markers; not candidates. "
  + 'P01 never types: every row requires write authority and is not executed. Each row names its confidence: declared (an attribute the browser applies), stated (the field\'s help text names it) '
  + 'or inferred (an autofill token, input mode, name, label, placeholder, marker or the field type suggests it). Stated and inferred rows are test ideas from a source of unknown applicability, '
  + 'not expected results: their expectation is null, their applicability is unknown and their source names where the idea comes from. Declared rows keep their v1 expectation. '
  + "A limit that is neither declared nor stated is never invented, and any result belongs to the agent's own records.";
// Every expectation a declared row may carry: the v1 texts of browser-applied constraints, never a suggestion.
const DECLARED_TEXTS = new Set(['rejected: required', 'satisfies this declared bound only; other constraints and business rules not evaluated', 'rejected: beyond the declared bound',
  'rejected: malformed for the declared type', 'rejected: outside the declared pattern', 'rejected: off the declared step',
  'matches a declared file-picker type only; application acceptance not evaluated', 'does not match a declared file-picker type; application handling and acceptance not evaluated']);

test('v2 align: a stated over-limit row has expectation null, applicability unknown and its help-text source; a name row has expectation null', () => {
  const w = partitionWorklistV2([calibrate(true)]);
  const over = w.rows.find((r) => r.name === 'interval' && r.partition === 'stated-over-upper-limit');
  assert.deepEqual([over.probe, over.expectation, over.applicability, over.source], [V('121'), null, 'unknown', 'help text "Between 5 and 120" (aria-describedby)']);
  const size = w.rows.find((r) => r.name === 'readings' && r.partition === 'stated-size-over-upper-limit');
  assert.deepEqual([size.expectation, size.applicability, size.source], [null, 'unknown', 'help text "max 500 KB" (next-sibling)']);
  const names = partitionWorklistV2([state('join', PATRON)]).rows.filter((r) => r.partition.startsWith('name-'));
  assert.equal(names.length, 5);
  assert.ok(names.every((r) => r.expectation === null && r.applicability === 'unknown' && r.source === 'name=fullName (kind name)'), JSON.stringify(names));
});

test('v2 align: declared rows keep their v1 expectation and gain no applicability or source; every stated or inferred row has expectation null, applicability unknown and a source', () => {
  const states = BROAD(); const v1 = partitionWorklist(states); const w = partitionWorklistV2(states);
  assert.equal(JSON.stringify(w.rows.slice(0, v1.count)), JSON.stringify(v1.rows.map(AS_V2)), 'the declared prefix is byte-identical, but for the named duplicate-identity row');
  assert.deepEqual(w.rows.filter((r) => r.partition === 'duplicate-identity').map((r) => [r.id, r.confidence, r.expectation]), [[v1.rows.find((r) => r.suggestion).id, 'inferred', null]],
    'the mix holds the duplicate-identity suggestion, as an inferred test idea under its v1 id');
  const declaredRows = w.rows.filter((r) => r.confidence === 'declared'); const ideas = w.rows.filter((r) => r.confidence !== 'declared');
  assert.ok(declaredRows.length > v1.count && ideas.some((r) => r.confidence === 'stated') && ideas.some((r) => r.confidence === 'inferred'));
  for (const r of declaredRows) assert.ok(DECLARED_TEXTS.has(r.expectation) && !Object.hasOwn(r, 'suggestion') && !Object.hasOwn(r, 'applicability') && !Object.hasOwn(r, 'source'), r.id);
  assert.deepEqual(w.rows.filter((r) => r.name === 'photo' && r.confidence === 'declared').map((r) => [r.partition, r.expectation]), [['empty', 'rejected: required'],
    ['accept-inside', 'matches a declared file-picker type only; application acceptance not evaluated'], ['accept-outside', 'does not match a declared file-picker type; application handling and acceptance not evaluated']],
  'declared rows of a hidden file input keep the declared expectations');
  assert.equal(w.rows.find((r) => r.name === 'threshold' && r.partition === 'above-max').expectation, 'rejected: beyond the declared bound', 'a declared bound keeps its declared expectation');
  for (const r of ideas) {
    assert.deepEqual([r.expectation, r.applicability, typeof r.source], [null, 'unknown', 'string'], r.id);
    assert.ok(r.source.length > 0 && !/^(stated|inferred|declared)\b/.test(r.source), `${r.id}: ${r.source}`);
    if (r.confidence === 'stated') assert.ok(r.basis.startsWith(`stated: ${r.source.replace(/^help text /, '')}`), `${r.id}: ${r.source} / ${r.basis}`);
  }
  assert.doesNotMatch(JSON.stringify(ideas), /rejected|commonly expected|expected to be|refused|is accepted|be accepted/i, 'no stated or inferred row carries normative text');
});

test('v2 align: stated partition names give the position against the number or list the help text names, never a declared-row bound or a verdict word', () => {
  const names = [...new Set(partitionWorklistV2(BROAD()).rows.filter((r) => r.confidence === 'stated').map((r) => r.partition))].sort();
  assert.deepEqual(names, ['stated-at-lower-limit', 'stated-at-upper-limit', 'stated-length-at-lower-limit', 'stated-length-at-upper-limit', 'stated-length-over-upper-limit',
    'stated-length-under-lower-limit', 'stated-lower-limit', 'stated-over-upper-limit', 'stated-size-at-lower-limit', 'stated-size-at-upper-limit', 'stated-size-over-upper-limit',
    'stated-size-under-lower-limit', 'stated-type-listed', 'stated-type-not-listed', 'stated-under-lower-limit', 'stated-upper-limit']);
  for (const p of names) assert.doesNotMatch(p, /(?:^|-)(?:min|max|above|below|inside|outside|valid|invalid|rejected|accepted)(?:-|$)/, p);
});

test('v2 align: the report shows "expected: unknown (source: …)" for every stated or inferred row and the declared expectation for declared rows; the scope says so plainly', () => {
  const w = partitionWorklistV2([state('join', PATRON), calibrate(true, 'cal')]);
  const table = partitionLinesV2(w).filter((l) => /^\| W\d{3} /.test(l));
  assert.ok(table.includes("| W004 | fullName `#fullName` | name-apostrophe | `O'Neill` | expected: unknown (source: name=fullName (kind name)) | inferred | inferred: name=fullName (kind name) | join | requires write authority — not executed |"), table.join('\n'));
  assert.ok(table.includes('| W028 | calibration `#calibration` (not visible at capture) | accept-inside | file `probe.csv` | matches a declared file-picker type only; application acceptance not evaluated | declared | declared accept=.csv (file input not visible at capture) | cal | requires write authority — not executed |'), table.join('\n'));
  const unknown = table.map((l) => l.split(' | ')[4].startsWith('expected: unknown (source: '));
  assert.deepEqual(unknown, w.rows.map((r) => r.confidence !== 'declared'), 'declared rows show their expectation; every other row shows expected: unknown and its source');
  assert.equal(w.scope, SCOPE_V2);
  assert.equal(partitionWorklistV2([]).scope, SCOPE_V2);
});

// Align review fixes (partitions-v2-ALIGN-FIX): the v1 duplicate-identity suggestion named as an inferred test idea; sources kept apart when rows
// merge; two same-side unresolved limits kept; a stated type list quoted as its matched types only.
const IDENTITY_V2 = { id: 'W006', states: ['register'], form: 0, sel: '#email', name: 'email', type: 'email', attribute: 'autocomplete', declared: 'email', partition: 'duplicate-identity',
  probe: null, suggestion: true, expectation: null, applicability: 'unknown', source: 'autocomplete=email in a sign-up context',
  basis: 'inferred: declared autocomplete=email in a form that declares autocomplete=new-password and no current-password (a sign-up context); uniqueness is not a declared constraint',
  authority: 'requires write authority', status: 'not executed', confidence: 'inferred' };
test('v2 align fix (MEDIUM): the v1 duplicate-identity suggestion is an inferred test idea under its v1 id and place, with no expectation; v1 keeps its row; the report says uniqueness is never declared', () => {
  const states = [state('register', V1_FORMS[0])]; const v1 = partitionWorklist(states); const w = partitionWorklistV2(states);
  const { applicability, source, confidence, ...v1Keys } = IDENTITY_V2;
  assert.equal(JSON.stringify(v1.rows[5]), JSON.stringify({ ...v1Keys, expectation: 'suggestion: a second sign-up with an identity already in use is refused or handled; uniqueness is not a declared constraint',
    basis: 'declared autocomplete=email in a form that declares autocomplete=new-password and no current-password (a sign-up context)' }), 'v1 is unchanged, its own text included');
  assert.equal(JSON.stringify(w.rows[5]), JSON.stringify(IDENTITY_V2), 'v2: the same id and place, inferred, expectation null, applicability unknown, its source; keys in the v2 order');
  assert.deepEqual(w.rows.map((r) => r.confidence).slice(0, v1.count), ['declared', 'declared', 'declared', 'declared', 'declared', 'inferred']);
  assert.deepEqual(w.inference.confidence, { declared: 5, stated: 0, inferred: 6 });
  const lines = partitionLinesV2(w); const md = lines.join('\n');
  assert.ok(lines.includes(`| W006 | email \`#email\` | duplicate-identity (suggestion) | not derived | expected: unknown (source: autocomplete=email in a sign-up context) | inferred | ${IDENTITY_V2.basis} | register | requires write authority — not executed |`),
    lines.join('\n'));
  assert.match(md, /^Uniqueness is never declared: a duplicate-identity row is inferred from autofill tokens \(a sign-up context\) and is a suggestion only\.$/m);
  assert.doesNotMatch(`${JSON.stringify(w)}\n${md}`, /refused or handled/, 'the v1 text reaches no v2 row and no v2 report');
  assert.doesNotMatch(partitionLinesV2(partitionWorklistV2([state('desk', V1_FORMS[1])])).join('\n'), /Uniqueness/, 'without a duplicate-identity row there is no uniqueness line');
});

test('v2 align fix (LOW): rows merge over states only when their source agrees; one field with different evidence in two captures keeps each source', () => {
  const at = (label, f) => ({ label, url: 'http://app.test/shelves', facts: facts({ url: 'http://app.test/shelves', fields: [f] }) });
  const rows = (w) => w.rows.map((r) => [r.partition, r.source, r.states]);
  const split = partitionWorklistV2([at('wide', labelled('shelf', 'Shelf', { ariaRequired: true })), at('narrow', labelled('shelf', 'Shelf *'))]);
  assert.deepEqual(rows(split), [['empty', 'aria-required=true', ['wide']], ['whitespace-only', 'aria-required=true', ['wide']],
    ['empty', '"*" marker in label', ['narrow']], ['whitespace-only', '"*" marker in label', ['narrow']]]);
  assert.equal(split.inference.requiredInferred, 1, 'counts stay per distinct field');
  assert.deepEqual(rows(partitionWorklistV2([at('wide', labelled('shelf', 'Shelf *')), at('narrow', labelled('shelf', 'Shelf *'))])),
    [['empty', '"*" marker in label', ['wide', 'narrow']], ['whitespace-only', '"*" marker in label', ['wide', 'narrow']]], 'the same evidence at two widths is one row per check');
});

test('v2 align fix (LOW): two unresolved limits on one side, from different phrases, keep a row each; neither is dropped silently', () => {
  const w = partitionWorklistV2([state('desk', [labelled('memo', 'Memo', hinted('Up to 2.5 characters; up to 10 tags'))])]);
  assert.deepEqual(w.rows.map((r) => [r.partition, r.probe, r.source, r.basis]), [
    ['stated-upper-limit', null, 'help text "Up to 2.5 characters" (aria-describedby)', 'stated: "Up to 2.5 characters" (aria-describedby); a length that is not a whole number is not derived'],
    ['stated-upper-limit', null, 'help text "up to 10 tags" (aria-describedby)', 'stated: "up to 10 tags" (aria-describedby); a number on a text field that is not a quantity is not derived']]);
  assert.deepEqual([w.inference.statedAmbiguous, w.inference.probeNotDerived], [0, 2]);
});

test('v2 align fix (LOW): a stated type list is quoted as its matched types only, as written; words between two listed types reach no row and no report', () => {
  const w = partitionWorklistV2([state('desk', [declared('scan', 'file', {}, hinted('CSV exports from the CANARY-BETWEEN-7e1d greenhouse logger or PDF; CSV preferred'))])]);
  assert.deepEqual(planned(w).map(([, p, probe]) => [p, probe?.name ?? null]), [['stated-type-listed', 'probe.csv'], ['stated-type-listed', 'probe.pdf'], ['stated-type-not-listed', 'probe.bin'],
    ['empty-file', 'probe.csv']]);
  assert.deepEqual([...new Set(w.rows.filter((r) => r.confidence === 'stated').map((r) => `${r.source} / ${r.basis}`))],
    ['help text "CSV, PDF" (aria-describedby) / stated: "CSV, PDF" (aria-describedby)'], 'each type once, as written, joined by ", "');
  assert.ok(!`${JSON.stringify(w)}\n${partitionLinesV2(w).join('\n')}`.includes('CANARY'), 'the text between the types is never copied');
});
