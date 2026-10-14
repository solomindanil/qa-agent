// F3 input-partition worklist (offline). From the declared constraints of captured fields only (type, required, minlength,
// maxlength, min, max, step, pattern, accept, autocomplete), the partitions an agent could try later. These are planned checks,
// never candidates: P01 never types, so every row requires write authority and is not executed. A limit that is not declared is
// never invented, and a probe that cannot be derived from the declaration is null and left to the agent.
import { routeOf } from './reached.mjs';

const ROW_STATUS = { authority: 'requires write authority', status: 'not executed' };
// What the declaration implies for each partition: a value at a bound is accepted, one beyond it is rejected.
const AT = 'satisfies this declared bound only; other constraints and business rules not evaluated'; const BEYOND = 'rejected: beyond the declared bound';
const EXPECTATION = { empty: 'rejected: required', 'length-at-min': AT, 'length-under-min': BEYOND, 'length-at-max': AT, 'length-over-max': BEYOND,
  'type-malformed': 'rejected: malformed for the declared type', 'pattern-outside': 'rejected: outside the declared pattern', 'at-min': AT, 'below-min': BEYOND,
  'at-max': AT, 'above-max': BEYOND, 'off-step': 'rejected: off the declared step', 'accept-inside': 'matches a declared file-picker type only; application acceptance not evaluated',
  'accept-outside': 'does not match a declared file-picker type; application handling and acceptance not evaluated' };
const MAX_PROBE_LENGTH = 1_000_000; // characters; a longer length probe (a maxlength used as "unlimited") is not derived
const SCOPE = 'Planned checks derived from declared field attributes only; not candidates. P01 never types: every row requires write authority and is not executed. '
  + "A field without a declared constraint gives no row, which does not mean it is unconstrained; HTML declarations supply test ideas, not a business oracle or permission to execute; any result belongs to the agent's own records.";

// Where the browser applies each attribute (HTML constraint validation). A declaration elsewhere is counted, never turned into a row.
const LENGTH_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'textarea']);
const PATTERN_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password']);
const RANGE_TYPES = new Set(['number', 'range', 'date', 'month', 'week', 'time', 'datetime-local']);
const NOT_REQUIRED = new Set(['range', 'color']);
const APPLIES = { required: (t) => !NOT_REQUIRED.has(t), minlength: (t) => LENGTH_TYPES.has(t), maxlength: (t) => LENGTH_TYPES.has(t), pattern: (t) => PATTERN_TYPES.has(t),
  min: (t) => RANGE_TYPES.has(t), max: (t) => RANGE_TYPES.has(t), step: (t) => RANGE_TYPES.has(t), accept: (t) => t === 'file' };
// A synthetic value that breaks the declared format. Types whose value the browser sanitises (number, date-like) have none.
const MALFORMED = { email: 'missing-at-sign.example', url: 'no-scheme.example' };

// Value types whose probes beyond a bound are computed: the step unit (number: 1; date: days), the spec default step, and the smallest
// move off a declared step. Other date-like types (month, week, time, datetime-local) keep their declared bounds; the rest is not derived.
// Arithmetic is exact: a number is an integer of units at a decimal scale (exponent notation is not expanded), a date a whole day. Each
// derived probe is checked by a round trip: parsed again as the browser parses it (a finite number; a date from year 0001 to 9999), it
// must lie strictly beyond the parsed bound, or it is not derived.
const FLOAT = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][-+]?\d+)?$/;
const PLAIN = /^(-?)(\d*)(?:\.(\d+))?$/;
const DAY_MS = 86400000;
const parseDay = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if (!m || Number(m[1]) < 1) return null;
  const d = new Date(0); d.setUTCFullYear(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toISOString().slice(0, 10) === s ? d.getTime() / DAY_MS : null;
};
const dayString = (n) => { const d = new Date(n * DAY_MS); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); };
const decimal = (s) => { const m = PLAIN.exec(s); return m ? { units: BigInt(`${m[1]}${m[2] || '0'}${m[3] ?? ''}`), scale: (m[3] ?? '').length } : null; };
const at = (x, scale) => x.units * 10n ** BigInt(scale - x.scale);
const add = (a, b) => { const scale = Math.max(a.scale, b.scale); return { units: at(a, scale) + at(b, scale), scale }; };
const negate = (x) => ({ units: -x.units, scale: x.scale });
function decimalString({ units, scale }) {
  const digits = (units < 0n ? -units : units).toString().padStart(scale + 1, '0');
  const whole = digits.slice(0, digits.length - scale); const fraction = digits.slice(digits.length - scale).replace(/0+$/, '');
  return `${units < 0n ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}
const NUMBER = { parse: (s) => (FLOAT.test(s) && Number.isFinite(Number(s)) ? Number(s) : null), defaultStep: 1, validStep: (n) => n > 0,
  exact: decimal, step: decimal, move: (x, step, sign) => (x && step ? add(x, sign < 0 ? negate(step) : step) : null), format: (x) => (x ? decimalString(x) : null),
  hasOffStep: () => true, offset: (step) => (step ? { units: step.units * 5n, scale: step.scale + 1 } : null),
  onGrid: (x, base, step) => { const scale = Math.max(x.scale, base.scale, step.scale); return (at(x, scale) - at(base, scale)) % at(step, scale) === 0n; } };
const DATE = { parse: parseDay, defaultStep: 1, validStep: (n) => Number.isInteger(n) && n > 0,
  exact: parseDay, step: Number, move: (x, step, sign) => x + sign * step, format: dayString, hasOffStep: (step) => step >= 2, offset: () => 1,
  onGrid: (x, base, step) => (x - base) % step === 0 };
const ARITHMETIC = { number: NUMBER, range: NUMBER, date: DATE };
const BOUNDS = [['min', 'at-min', 'below-min', 'below', -1], ['max', 'at-max', 'above-max', 'above', 1]];

const empty = { kind: 'empty' };
const length = (n) => ({ kind: 'length', length: n });
const value = (v) => ({ kind: 'value', value: v });
const file = (name) => ({ kind: 'file', name });
const row = (attribute, declared, partition, probe, basis) => ({ attribute, declared, partition, probe, basis });

function stepOf(conv, c) {
  if (c.step === undefined) return { value: conv.defaultStep, source: 'default' };
  if (c.step.toLowerCase() === 'any') return { value: null, source: 'any' };
  const n = NUMBER.parse(c.step);
  return n !== null && conv.validStep(n) ? { value: n, source: 'declared' } : { value: conv.defaultStep, source: 'invalid' };
}

// Bounds of a date-like type without arithmetic: the declared values themselves, and the probes beyond them left to the agent.
function boundsOnly(type, c) {
  const step = c.step !== undefined && c.step.toLowerCase() !== 'any';
  const unchecked = (attr) => (attr === 'max' && c.min !== undefined ? `; whether it lies on the step grid from min is not checked for ${type}` : '');
  const rows = BOUNDS.filter(([attr]) => c[attr] !== undefined).flatMap(([attr, atBound, beyond, side]) => [row(attr, c[attr], atBound, value(c[attr]), `declared ${attr}=${c[attr]}${unchecked(attr)}`),
    row(attr, c[attr], beyond, null, `declared ${attr}=${c[attr]}; the value just ${side} is not derived for ${type}`)]);
  return step ? [...rows, row('step', c.step, 'off-step', null, `declared step=${c.step}; the off-step value is not derived for ${type}`)] : rows;
}

// The probe one step beyond a bound, kept only when it parses again to a value strictly beyond the parsed bound.
function beyondProbe(conv, c, attr, sign, step) {
  const probe = conv.format(conv.move(conv.exact(c[attr]), step, sign)); const parsed = probe === null ? null : conv.parse(probe); const bound = conv.parse(c[attr]);
  return parsed !== null && (sign > 0 ? parsed > bound : parsed < bound) ? value(probe) : null;
}
function rangeRows(type, c, invalid) {
  const conv = ARITHMETIC[type]; if (!conv) return boundsOnly(type, c);
  const step = stepOf(conv, c); if (step.source === 'invalid') invalid('step');
  const by = step.source === 'declared' ? `declared step (${c.step})` : `default step for ${type} (${conv.defaultStep})`;
  const exactStep = step.value === null ? null : conv.step(step.source === 'declared' ? c.step : String(conv.defaultStep));
  const rows = []; let min = null;
  for (const [attr, atBound, beyond, side, sign] of BOUNDS) {
    if (c[attr] === undefined) continue;
    if (conv.parse(c[attr]) === null) { invalid(attr); continue; }
    if (attr === 'min') min = conv.exact(c.min);
    const bound = conv.exact(c[attr]); const offGrid = attr === 'max' && min !== null && bound !== null && exactStep !== null && !conv.onGrid(bound, min, exactStep);
    rows.push(offGrid ? row(attr, c[attr], atBound, null, `declared max=${c.max} is not on the step grid from min=${c.min} (${by}), so the browser rejects it; the accepted bound is not derived`)
      : row(attr, c[attr], atBound, value(c[attr]), `declared ${attr}=${c[attr]}`));
    if (step.value === null) { rows.push(row(attr, c[attr], beyond, null, `declared ${attr}=${c[attr]}; step=any, so the value just ${side} is not derived`)); continue; }
    const probe = beyondProbe(conv, c, attr, sign, exactStep);
    rows.push(row(attr, c[attr], beyond, probe, probe ? `declared ${attr}=${c[attr]}, one ${by} ${side}`
      : `declared ${attr}=${c[attr]}; one ${by} ${side} does not give an exact valid value strictly ${side} it, so it is not derived`));
  }
  if (step.source !== 'declared' || !conv.hasOffStep(step.value)) return rows;
  if (c.min === undefined || conv.parse(c.min) === null) return [...rows, row('step', c.step, 'off-step', null, `declared step=${c.step}; no min, so the step base is not declared and the off-step value is not derived`)];
  const offset = conv.offset(exactStep); const off = min === null || offset === null ? null : conv.format(conv.move(min, offset, 1));
  const parsed = off === null ? null : conv.parse(off);
  const next = conv.format(conv.move(min, exactStep, 1));
  const parsedNext = conv === DATE ? conv.move(min, exactStep, 1) : next === null ? null : conv.parse(next);
  const exactOff = off === null ? null : conv.exact(off);
  const demonstrablyOffGrid = parsed !== null && parsedNext !== null && parsed > conv.parse(c.min) && parsed < parsedNext
    && exactOff !== null && !conv.onGrid(exactOff, min, exactStep);
  return [...rows, demonstrablyOffGrid ? row('step', c.step, 'off-step', value(off), `declared step=${c.step} from min=${c.min}, between two allowed values`)
    : row('step', c.step, 'off-step', null, `declared step=${c.step} from min=${c.min}; the value between two allowed values is not derived (exponent notation or out of range), so it is left to the agent`)];
}

// File types by MIME token, for probe names. Outside probes are tried in order: the first that no accepted token covers.
const MIME_EXTENSION = { 'application/octet-stream': 'bin', 'text/plain': 'txt', 'text/csv': 'csv', 'application/pdf': 'pdf', 'application/json': 'json',
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/*': 'png', 'text/*': 'txt', 'audio/*': 'wav', 'video/*': 'mp4' };
const OUTSIDE = [['bin', 'application/octet-stream'], ['txt', 'text/plain'], ['png', 'image/png']];
function acceptRows(accept) {
  const tokens = [...new Set(accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];
  // Two tokens naming one file (.csv and text/csv) give equal rows, which the worklist merges into one.
  const inside = tokens.map((t) => {
    const ext = t.startsWith('.') ? t.slice(1) : MIME_EXTENSION[t];
    return ext ? row('accept', accept, 'accept-inside', file(`probe.${ext}`), `declared accept=${accept}`)
      : row('accept', accept, 'accept-inside', null, `declared accept=${accept}; no file name is derived for ${t}`);
  });
  const covered = ([ext, mime]) => tokens.some((t) => t === `.${ext}` || t === mime || t === `${mime.split('/')[0]}/*`);
  const outside = OUTSIDE.find((o) => !covered(o));
  return [...inside, outside ? row('accept', accept, 'accept-outside', file(`probe.${outside[0]}`), `declared accept=${accept}`)
    : row('accept', accept, 'accept-outside', null, `declared accept=${accept}; every probe type is accepted, so a file outside is not derived`)];
}

// A length probe of at most MAX_PROBE_LENGTH characters; a longer one is not derived (it would stall a page if typed).
const lengthRow = (attr, declared, partition, n) => (n <= MAX_PROBE_LENGTH ? row(attr, declared, partition, length(n), `declared ${attr}=${declared}`)
  : row(attr, declared, partition, null, `declared ${attr}=${declared}; a probe of ${n} characters is too long to derive (over ${MAX_PROBE_LENGTH})`));
// Rows of one listed field, in a fixed order; declarations the browser does not apply to the type, or cannot read, are only counted.
function fieldRows(f, note) {
  const c = f.constraints; const type = f.type; const rows = [];
  for (const attr of Object.keys(APPLIES)) if (c[attr] !== undefined && !APPLIES[attr](type)) note.ignored(attr);
  if (c.required && APPLIES.required(type)) rows.push(row('required', true, 'empty', empty, 'declared required'));
  if (LENGTH_TYPES.has(type) && c.minlength > 0) {
    rows.push(lengthRow('minlength', c.minlength, 'length-at-min', c.minlength));
    if (c.minlength > 1) rows.push(lengthRow('minlength', c.minlength, 'length-under-min', c.minlength - 1));
  }
  if (LENGTH_TYPES.has(type) && c.maxlength !== undefined) {
    rows.push(lengthRow('maxlength', c.maxlength, 'length-at-max', c.maxlength), lengthRow('maxlength', c.maxlength, 'length-over-max', c.maxlength + 1));
  }
  if (MALFORMED[type]) rows.push(row('type', type, 'type-malformed', value(MALFORMED[type]), `declared type=${type}`));
  if (PATTERN_TYPES.has(type) && c.pattern !== undefined) rows.push(row('pattern', c.pattern, 'pattern-outside', null, `declared pattern=${c.pattern}; a value outside the pattern is not derived`));
  if (RANGE_TYPES.has(type)) rows.push(...rangeRows(type, c, note.invalid));
  if (type === 'file' && c.accept !== undefined) rows.push(...acceptRows(c.accept));
  return rows;
}

// Uniqueness is never declared. A field marked as an identity (autocomplete email or username) in a form that declares a new password
// and no current one (a sign-up context, from the autofill tokens alone) gets one suggestion row.
const IDENTITY = ['email', 'username'];
const tokensOf = (f) => (f.constraints.autocomplete ?? '').toLowerCase().split(/\s+/).filter(Boolean);
const signUp = (formFields) => formFields.some((f) => tokensOf(f).includes('new-password')) && !formFields.some((f) => tokensOf(f).includes('current-password'));
const identityRow = (token) => ({ ...row('autocomplete', token, 'duplicate-identity', null,
  `declared autocomplete=${token} in a form that declares autocomplete=new-password and no current-password (a sign-up context)`), suggestion: true,
expectation: 'suggestion: a second sign-up with an identity already in use is refused or handled; uniqueness is not a declared constraint' });

const NOT_LISTED = ['inactive', 'disabled', 'readonly', 'outside-page'];
const outsidePage = (r) => r !== undefined && (r.x + r.w <= 0 || r.y + r.h <= 0);
const skipReason = (f) => (f.inactive ? 'inactive' : f.disabled ? 'disabled' : f.constraints.readonly ? 'readonly' : outsidePage(f.rect) ? 'outside-page' : null);
// A radio group (one name in one form) is one field, required when any member is (HTML); it is listed under its first member.
const asGroup = (f, fields) => {
  if (f.type !== 'radio' || !f.name) return f;
  const required = fields.some((o) => o.type === 'radio' && o.form === f.form && o.name === f.name && o.constraints.required);
  return { ...f, constraints: { ...f.constraints, ...(required ? { required: true } : {}) } };
};

// The worklist over all captured states. A field is identified by route (no query values), form and selector, so one form captured at
// two widths gives one row per check listing both states. Counts are per distinct field.
export function partitionWorklist(states) {
  const merged = new Map(); const listed = new Set(); const skipped = new Map(); const withRows = new Set();
  const ignored = new Map(); const invalid = new Map(); const older = []; let hiddenFiles = 0;
  const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const s of states) {
    const fields = s.facts?.fields;
    if (!Array.isArray(fields) || fields.some((f) => !f.constraints)) { older.push(s.label); continue; }
    hiddenFiles += s.facts.fileInputsNotShown ?? 0;
    const route = routeOf(s.url) ?? s.url; const radios = new Set();
    for (const member of fields) {
      const f = asGroup(member, fields);
      if (f.type === 'radio' && f.name) { const group = `${f.form}|${f.name}`; if (radios.has(group)) continue; radios.add(group); }
      const key = JSON.stringify([route, f.form, f.sel]); const reason = skipReason(f);
      if (reason) { if (!skipped.has(key)) skipped.set(key, reason); continue; }
      const first = !listed.has(key); listed.add(key);
      const note = { ignored: (a) => first && bump(ignored, `${a} on ${f.type}`), invalid: (a) => first && bump(invalid, `${a} on ${f.type}`) };
      const token = signUp(fields.filter((o) => o.form === f.form)) ? IDENTITY.find((t) => tokensOf(f).includes(t)) : undefined;
      const rows = [...fieldRows(f, note), ...(token ? [identityRow(token)] : [])];
      if (rows.length) withRows.add(key);
      for (const r of rows) {
        const id = JSON.stringify([route, f.form, f.sel, r.attribute, r.declared, r.partition, r.probe]);
        const hit = merged.get(id);
        if (hit) { if (!hit.states.includes(s.label)) hit.states.push(s.label); continue; }
        merged.set(id, { states: [s.label], form: f.form, sel: f.sel, name: f.name ?? f.id ?? null, type: f.type, attribute: r.attribute, declared: r.declared, partition: r.partition,
          probe: r.probe, ...(r.suggestion ? { suggestion: true } : {}), expectation: r.expectation ?? EXPECTATION[r.partition], basis: r.basis, authority: ROW_STATUS.authority, status: ROW_STATUS.status });
      }
    }
  }
  const rows = [...merged.values()].map((r, i) => ({ id: `W${String(i + 1).padStart(3, '0')}`, ...r }));
  const notListed = new Map(); for (const [key, reason] of skipped) if (!listed.has(key)) bump(notListed, reason);
  return { scope: SCOPE, states: states.map((s) => s.label), count: rows.length,
    coverage: { fields: listed.size, withoutRow: listed.size - withRows.size, notListed: Object.fromEntries(NOT_LISTED.filter((k) => notListed.has(k)).map((k) => [k, notListed.get(k)])),
      ignoredByType: Object.fromEntries(ignored), invalid: Object.fromEntries(invalid), probeNotDerived: rows.filter((r) => r.probe === null).length,
      fileInputsNotShown: hiddenFiles, olderCaptures: older }, rows };
}

const NOT_LISTED_LABEL = { inactive: 'inactive', disabled: 'disabled', readonly: 'read-only', 'outside-page': 'outside-the-page' };
const listing = (parts) => (parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]);
const counts = (o) => Object.entries(o).map(([k, n]) => `${k} ${n}`).join(', ');
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
function probeText(probe) {
  if (probe === null) return 'not derived';
  if (probe.kind === 'empty') return 'empty';
  if (probe.kind === 'length') return `${probe.length} characters`;
  return probe.kind === 'file' ? `file \`${probe.name}\`` : `\`${probe.value}\``;
}
const rowLine = (r) => `| ${r.id} | ${esc(r.name ?? '')} \`${esc(r.sel).slice(0, 80)}\` | ${r.partition}${r.suggestion ? ' (suggestion)' : ''} | ${esc(probeText(r.probe))} | `
  + `${esc(r.expectation)} | ${esc(r.basis).slice(0, 240)} | ${esc(r.states[0])}${r.states.length > 1 ? ` +${r.states.length - 1}` : ''} | ${r.authority} — ${r.status} |`;

// The report section: planned, not executed; what gives no row, what was not listed and what stays unassessed.
export function partitionLines(w) {
  const c = w.coverage; const head = ['', '## Input partitions to try (not executed)', ''];
  const notListed = Object.entries(c.notListed).map(([k, n]) => `${n} ${NOT_LISTED_LABEL[k]}`);
  if (!c.fields && !notListed.length && !c.olderCaptures.length && !c.fileInputsNotShown) return [...head, 'No form field was captured, so no partition row was derived.'];
  return [...head,
    `${w.count} planned check(s) for ${c.fields} field(s), derived from declared attributes only (type, required, minlength, maxlength, min, max, step, pattern, accept, autocomplete). `
    + "They are not candidates and nothing was typed: each row requires write authority and is not executed, and any result belongs to the agent's own records.",
    `A field gives no row when it declares no constraint the browser applies to its type (${c.withoutRow} field(s)); that does not mean it is unconstrained. `
    + 'Uniqueness is never declared, so a duplicate-identity row is a suggestion only.',
    ...(notListed.length ? [`Not listed: ${listing(notListed)} field(s) (constraints are not checked on them, or a user cannot reach them).`] : []),
    ...(Object.keys(c.ignoredByType).length ? [`Declared but not applied by the browser to the field's type (no row): ${counts(c.ignoredByType)}.`] : []),
    ...(Object.keys(c.invalid).length ? [`Declared values not valid for their type (no row; an invalid step falls back to the default step): ${counts(c.invalid)}.`] : []),
    ...(c.fileInputsNotShown ? [`File inputs not visible at capture: ${c.fileInputsNotShown} (often opened through a styled button or label); their accept rows are not listed.`] : []),
    ...(c.olderCaptures.length ? [`Field constraint facts not recorded in: ${c.olderCaptures.join(', ')} (older capture); input partitions are unassessed there.`] : []),
    ...(c.probeNotDerived ? [`Probe not derived for ${c.probeNotDerived} row(s); the agent picks the value.`] : []),
    ...(w.rows.length ? ['', '| ID | Field | Partition | Probe | Expected | Basis | States | Status |', '| --- | --- | --- | --- | --- | --- | --- | --- |', ...w.rows.map(rowLine)] : [])];
}

// Optional v2 analysis of saved facts; existing v1 output and collection stay unchanged.

const extOf = (t) => (t.startsWith('.') ? t.slice(1) : MIME_EXTENSION[t]);
const covers = (tokens) => ([ext, mime]) => tokens.some((t) => t === `.${ext}` || t === mime || t === `${mime.split('/')[0]}/*`);
function probeTextV2(probe) {
  if (probe?.kind === 'file' && probe.bytes !== undefined) return `file \`${probe.name}\` of ${probe.bytes} bytes`;
  return probeText(probe);
}
function declaredGapLines(c) {
  const notListed = Object.entries(c.notListed).map(([k, n]) => `${n} ${NOT_LISTED_LABEL[k]}`);
  return [...(notListed.length ? [`Not listed: ${listing(notListed)} field(s) (constraints are not checked on them, or a user cannot reach them).`] : []),
    ...(Object.keys(c.ignoredByType).length ? [`Declared but not applied by the browser to the field's type (no row): ${counts(c.ignoredByType)}.`] : []),
    ...(Object.keys(c.invalid).length ? [`Declared values not valid for their type (no row; an invalid step falls back to the default step): ${counts(c.invalid)}.`] : [])];
}
const SCOPE_V2 = "Planned checks derived from declared field attributes, from types and limits stated in a field's own help text, and from inferred field kinds and required markers; not candidates. "
  + 'P01 never types: every row requires write authority and is not executed. Each row names its confidence: declared (an attribute the browser applies), stated (the field\'s help text names it) '
  + 'or inferred (an autofill token, input mode, name, label, placeholder, marker or the field type suggests it). Stated and inferred rows are test ideas from a source of unknown applicability, '
  + 'not expected results: their expectation is null, their applicability is unknown and their source names where the idea comes from. Declared rows keep their v1 expectation. '
  + "A limit that is neither declared nor stated is never invented, and any result belongs to the agent's own records.";
// Stated partition names give the probe's position against the number or the type list the help text names (at it, one past it; listed or
// not), never a verdict and never a declared-row name (at-max, above-max, …), which carries a declared expectation.
const STATED_BOUNDS = { value: ['stated-at-lower-limit', 'stated-under-lower-limit', 'stated-at-upper-limit', 'stated-over-upper-limit'],
  length: ['stated-length-at-lower-limit', 'stated-length-under-lower-limit', 'stated-length-at-upper-limit', 'stated-length-over-upper-limit'],
  size: ['stated-size-at-lower-limit', 'stated-size-under-lower-limit', 'stated-size-at-upper-limit', 'stated-size-over-upper-limit'] };
const STATED_LIMIT = { min: 'stated-lower-limit', max: 'stated-upper-limit' }; // a stated limit whose probe is not derived
const STATED_TYPE = { listed: 'stated-type-listed', notListed: 'stated-type-not-listed' };
// Generic internationalisation set for a person-name field: real-world names only, never quotes, backticks, ampersands or injection payloads.
const NAME_SET = [['name-hyphenated', 'Anne-Marie'], ['name-apostrophe', "O'Neill"], ['name-diacritics', 'Zoë Núñez'], ['name-non-latin', '张伟'],
  ['name-long', 'Maria de los Angeles Villanueva Montenegro de la Concepcion Rodriguez']];
const KIND_PROBES = { email: [['email-without-at', 'missing-at-sign.example'], ['email-without-domain', 'missing-domain@']], url: [['url-without-scheme', 'no-scheme.example']],
  phone: [['phone-with-letters', '01234 ABCDE']], name: NAME_SET };

// Field kinds. A declared type covers its kind; otherwise only text inputs are inferred (a search box takes fragments of anything), from the
// strongest level that names a kind: autofill token, input mode, name or id token, label words, placeholder words or shape. A kind word counts
// only as the head of its token or phrase: last, or followed only by a word such as "address", "number" or "input" ("contactEmail", "E-mail
// address"; never "email_subject", "Email notifications", "Website name" or "Search by email"). A level naming two kinds settles nothing and no
// kind is guessed. An autofill token naming another purpose (username, one-time-code, organization, cc-*, …) stops inference. A label,
// placeholder, name or id that offers alternatives of different kinds ("Username or email", "E-mail / phone", "(email or phone)") or whose
// head is a user name or login vetoes every level, an autofill kind included. Label lexicon: English, plus documented e-mail, password, phone
// and user-name words in Spanish, French, German, Portuguese and Russian.
const KINDS = ['email', 'password', 'phone', 'url', 'name', 'postcode', 'quantity'];
const KIND_BY_TYPE = { email: 'email', password: 'password', tel: 'phone', url: 'url' };
const INFERRED_TYPES = new Set(['text']);
const AUTOFILL_KIND = { email: 'email', 'current-password': 'password', 'new-password': 'password', tel: 'phone', 'tel-national': 'phone', 'tel-local': 'phone', url: 'url',
  name: 'name', 'given-name': 'name', 'family-name': 'name', 'additional-name': 'name', 'postal-code': 'postcode' };
// HTML autofill field names that are none of the kinds: a field declaring one has a known purpose, so no kind is inferred for it.
const AUTOFILL_OTHER = new Set(['honorific-prefix', 'honorific-suffix', 'nickname', 'username', 'one-time-code', 'organization-title', 'organization', 'street-address',
  'address-line1', 'address-line2', 'address-line3', 'address-level1', 'address-level2', 'address-level3', 'address-level4', 'country', 'country-name',
  'cc-name', 'cc-given-name', 'cc-additional-name', 'cc-family-name', 'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type',
  'transaction-currency', 'transaction-amount', 'language', 'bday', 'bday-day', 'bday-month', 'bday-year', 'sex', 'photo', 'impp',
  'tel-country-code', 'tel-area-code', 'tel-local-prefix', 'tel-local-suffix', 'tel-extension']);
const INPUTMODE_KIND = { email: 'email', tel: 'phone', url: 'url' };
const TOKEN_KIND = { email: 'email', mail: 'email', password: 'password', passwd: 'password', pwd: 'password', passcode: 'password', phone: 'phone', telephone: 'phone', tel: 'phone',
  mobile: 'phone', url: 'url', website: 'url', homepage: 'url', postcode: 'postcode', postalcode: 'postcode', zip: 'postcode', zipcode: 'postcode', qty: 'quantity', quantity: 'quantity',
  fullname: 'name', firstname: 'name', lastname: 'name', givenname: 'name', familyname: 'name', middlename: 'name', surname: 'name', forename: 'name', fname: 'name', lname: 'name' };
const LABEL_WORDS = { email: ['e-mail', 'email', 'correo', 'courriel', 'почта'], password: ['password', 'passphrase', 'contraseña', 'mot de passe', 'passwort', 'senha', 'пароль'],
  phone: ['phone', 'telephone', 'mobile', 'teléfono', 'téléphone', 'telefon', 'telefone', 'телефон'], url: ['website', 'web site', 'web address', 'url', 'homepage'],
  postcode: ['postcode', 'post code', 'postal code', 'zip', 'zip code'], quantity: ['quantity', 'qty'] };
// A person name: the label is exactly "name" or "your name", or it is or ends with a qualified phrase ("Patron's full name"); never "Sensor name".
const NAME_WORDS = ['full name', 'first name', 'last name', 'given name', 'family name', 'middle name', 'surname'];
// Words naming a user name or login, in labels and placeholders (lexicon languages) and in name or id tokens.
const IDENTITY_WORDS = ['username', 'user name', 'user', 'login', 'log-in', 'log in', 'user id', 'userid', 'account', 'account name', 'nickname',
  'usuario', 'utilisateur', 'identifiant', 'benutzername', 'benutzer', 'usuário', 'логин', 'пользователь', 'пользователя'];
const TOKEN_IDENTITY = new Set(['username', 'user', 'login', 'logon', 'signin', 'userid', 'account', 'accountname', 'loginname', 'nickname']);
// Words that may follow the head kind word ("E-mail address", "Correo electrónico", "E-Mail-Adresse"; "phoneNumber", "emailInput"), and the
// prepositions that make a kind word an object instead of a head ("Search by email"). Alternatives are joined by "or" (o, ou, oder, или) or "/".
const TRAILING = ['address', 'adresse', 'number', 'no', 'nr', 'id', 'electrónico', 'electronico', 'électronique', 'eletrônico', 'eletronico'];
const TRAILING_AT_END = new RegExp(`[\\s-](?:${TRAILING.join('|')})$`, 'u');
const TOKEN_TRAILING = new Set(['address', 'addr', 'number', 'no', 'nr', 'num', 'id', 'input', 'field', 'fld', 'box', 'textbox', 'txt', 'ctrl', 'control', 'value', 'val']);
const PREPOSITIONS = new Set(['by', 'for', 'via', 'with', 'from', 'of', 'per', 'to', 'in', 'on', 'about']);
const ALTERNATIVES = /\s+(?:or|o|ou|oder|или)\s+|\s*\/\s*/u;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; const URL_SHAPE = /^https?:\/\/\S/i;
const words = (s) => (s ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z]+/).filter(Boolean);
const phrase = (s) => (s ?? '').normalize('NFC').toLowerCase().replace(/\([^)]*\)|[*:]/g, ' ').replace(/\s+/g, ' ').trim();
// A lexicon word is the head of a phrase when the phrase is or ends with it, and the word before it is not a preposition.
const endsAt = (s, w) => (s === w || s.endsWith(` ${w}`)) && !PREPOSITIONS.has(s.slice(0, s.length - w.length).trim().split(' ').at(-1));
function headOf(alternative) {
  for (const s of new Set([alternative, alternative.replace(TRAILING_AT_END, '')])) {
    if (s === 'name' || s === 'your name') return { kind: 'name', word: s };
    const named = NAME_WORDS.find((w) => endsAt(s, w)); if (named) return { kind: 'name', word: named };
    for (const [kind, ws] of Object.entries(LABEL_WORDS)) { const word = ws.find((w) => endsAt(s, w)); if (word) return { kind, word }; }
    const who = IDENTITY_WORDS.find((w) => endsAt(s, w)); if (who) return { identity: who };
  }
  return null;
}
// A veto: a user-name head, or alternatives whose heads differ (a kind against another kind or against something else).
const vetoes = (heads) => heads.some((h) => h?.identity) || (heads.length > 1 && new Set(heads.map((h) => h?.kind ?? null)).size > 1);
const alternativesOf = (s) => phrase(s).split(ALTERNATIVES).map((a) => a.replace(/[.,;!?]+$/u, '').trim()).filter(Boolean).map(headOf);
function textLevel(text, where) {
  const heads = alternativesOf(text); const inner = [...(text ?? '').matchAll(/\(([^)]*)\)/g)].map((m) => alternativesOf(m[1]));
  return { found: heads.filter((h) => h?.kind).map((h) => [h.kind, `${where} word "${h.word}"`]), veto: [heads, ...inner].some(vetoes) };
}
// The head of a name or id token: its last word or last two words joined ("post_code"), after one or two trailing words ("emailAddressInput").
// The bare token "name" is a person name only when the label (without one, the placeholder) agrees or neither is present.
function tokenHead(t, bareName) {
  if (t.length === 1 && t[0] === 'name') return bareName ? { kind: 'name' } : null;
  let s = t; for (let i = 0; i < 2 && s.length > 1 && TOKEN_TRAILING.has(s.at(-1)); i += 1) s = s.slice(0, -1);
  const last = s.at(-1); const pair = s.length > 1 ? `${s.at(-2)}${last}` : null;
  if (TOKEN_KIND[pair] || TOKEN_IDENTITY.has(pair)) return TOKEN_KIND[pair] ? { kind: TOKEN_KIND[pair] } : { identity: pair };
  return TOKEN_KIND[last] ? { kind: TOKEN_KIND[last] } : TOKEN_IDENTITY.has(last) ? { identity: last } : null;
}
function tokenLevel(v, attr, bareName) {
  const parts = words(v).join(' ').split(/\bor\b/).map((p) => p.split(' ').filter(Boolean)).filter((p) => p.length);
  const heads = parts.map((p) => tokenHead(p, bareName));
  return { found: heads.filter((h) => h?.kind).map((h) => [h.kind, `${attr}=${v}`]), veto: vetoes(heads) };
}
const autofillTokens = (c) => (c.autocomplete ?? '').toLowerCase().split(/\s+/).filter(Boolean);
const inputmodeKinds = (c) => { const m = (c.inputmode ?? '').trim().toLowerCase(); return INPUTMODE_KIND[m] ? [[INPUTMODE_KIND[m], `inputmode=${m}`]] : []; };
const shapeKinds = (p) => [...(EMAIL_SHAPE.test((p ?? '').trim()) ? [['email', 'placeholder shaped like an e-mail address']] : []),
  ...(URL_SHAPE.test((p ?? '').trim()) ? [['url', 'placeholder starting with a URL scheme']] : [])];
function kindOf(f) {
  if (KIND_BY_TYPE[f.type]) return { kind: KIND_BY_TYPE[f.type], declared: true };
  if (!INFERRED_TYPES.has(f.type)) return { kind: null };
  const tokens = autofillTokens(f.constraints); if (tokens.some((t) => AUTOFILL_OTHER.has(t))) return { kind: null };
  const label = textLevel(f.label?.text, 'label'); const placeholder = textLevel(f.placeholder, 'placeholder');
  const shown = phrase(f.label?.text) ? label : placeholder; const bareName = !phrase(f.label?.text) && !phrase(f.placeholder) ? true : shown.found.some(([k]) => k === 'name');
  const name = tokenLevel(f.name, 'name', bareName); const id = tokenLevel(f.id, 'id', bareName);
  const veto = [label, placeholder, name, id].some((l) => l.veto);
  const levels = [tokens.filter((t) => AUTOFILL_KIND[t]).map((t) => [AUTOFILL_KIND[t], `autocomplete=${t}`]), inputmodeKinds(f.constraints), [...name.found, ...id.found],
    label.found, [...placeholder.found, ...shapeKinds(f.placeholder)]];
  for (const found of levels) {
    const kinds = new Set(found.map(([k]) => k));
    if (kinds.size > 1 || (kinds.size === 1 && veto)) return { kind: null, ambiguous: true };
    if (kinds.size === 1) return { kind: found[0][0], evidence: found[0][1] };
  }
  return { kind: null };
}

// A new row; its source names where the test idea comes from: help text "<matched phrase>" (<where it was read>), or the inference evidence.
const newRow = (confidence, attribute, partition, probe, basis, source) => ({ attribute, declared: null, partition, probe, basis, confidence, source });
const helpText = (excerpt, via) => `help text "${excerpt}" (${via})`;
// Malformed and name rows of a kind. A declared email or url type is checked by the browser (v1 lists its malformed row) and a password has
// no format; a declared tel type is not checked, so it gets its row too.
function kindRows(f, k) {
  if (!k.kind || (k.declared && f.type !== 'tel')) return [];
  const basis = k.declared ? `inferred: declared type=${f.type}, whose format the browser does not check (kind ${k.kind})` : `inferred: ${k.evidence} (kind ${k.kind})`;
  const source = `${k.declared ? `type=${f.type}` : k.evidence} (kind ${k.kind})`;
  const max = LENGTH_TYPES.has(f.type) ? f.constraints.maxlength : undefined;
  return (KIND_PROBES[k.kind] ?? []).map(([partition, v]) => newRow('inferred', 'kind', partition, value(v),
    max !== undefined && v.length > max ? `${basis}; longer than the declared maxlength=${max}, so the browser stops typing at ${max}` : basis, source));
}
// A "*" marker at the start or end of the label or placeholder (a trailing colon ignored) or "(*)"; aria-required=true. Never beside a declared
// required, never on a radio (its label names one option) or a type the browser cannot require; whitespace only for text-like fields.
const marked = (t) => { const s = (t ?? '').trim().replace(/[\s:]+$/, ''); return s.startsWith('*') || s.endsWith('*') || s.includes('(*)'); };
function requiredRows(f) {
  if (f.constraints.required || f.type === 'radio' || !APPLIES.required(f.type)) return [];
  const [source, note] = f.ariaRequired ? ['aria-required=true', ' (not enforced by the browser)'] : marked(f.label?.text) ? ['"*" marker in label', '']
    : marked(f.placeholder) ? ['"*" marker in placeholder', ''] : [null, ''];
  if (!source) return [];
  const basis = `inferred: ${source}${note}${f.notShown ? NOT_SHOWN : ''}`;
  return [newRow('inferred', 'required', 'empty', empty, basis, source), ...(LENGTH_TYPES.has(f.type) ? [newRow('inferred', 'required', 'whitespace-only', value('   '), basis, source)] : [])];
}

// Types listed in a file input's help text: dotted extensions holding a letter (".csv"; not ".5"), MIME types and upper-case words of known
// formats (lower-case words and file names are not type lists). The excerpt is the matched types as written, each once, joined by ", "; no
// other help-text word is copied, not even one between two listed types. Types in a negated
// clause ("PDF files are not accepted", "GIF not supported"; "no more than" is a limit, not a negation) and a type reaching the end of a cut
// help text (".js" of ".json") are not used and are counted.
const KNOWN_FORMATS = new Set(['csv', 'tsv', 'json', 'xml', 'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic', 'doc', 'docx', 'xls', 'xlsx', 'ods', 'odt', 'zip', 'mp3', 'wav', 'mp4', 'mov']);
const TYPE_PATTERNS = [[/(?<![\p{L}\p{N}._\/-])\.((?=[a-z0-9]{0,7}[a-z])[a-z0-9]{1,8})(?![\p{L}\p{N}])/giu, (m) => `.${m[1].toLowerCase()}`],
  [/(?<![\p{L}\p{N}\/])(?:application|audio|font|image|message|model|multipart|text|video)\/(?:\*|[a-z0-9][a-z0-9.+-]*)/giu, (m) => m[0].toLowerCase()],
  [/(?<![\p{L}\p{N}.\/-])[A-Z][A-Z0-9]{1,4}(?![\p{L}\p{N}])/gu, (m) => (KNOWN_FORMATS.has(m[0].toLowerCase()) ? `.${m[0].toLowerCase()}` : null)]];
const NEGATION = /(?<![\p{L}\p{N}])(?:not|no|never|cannot|can['’]t|won['’]t|don['’]t|doesn['’]t|isn['’]t|aren['’]t|mustn['’]t)(?![\p{L}\p{N}])(?!\s+(?:be\s+)?(?:more|less|fewer|larger|bigger|greater|smaller|longer|shorter|higher|lower|over|above|under|below|exceed\w*)\b)|\b(?:except|excluding|unsupported)\b/iu;
// Clauses end at ; ! ? ( ) or a full stop followed by a space or the end (a dot inside ".csv" or "e.g" does not end one).
const clauseEnds = (hint) => [...hint.matchAll(/[;!?()]|\.(?=\s|$)/g)].map((m) => m.index).concat(hint.length);
function statedTypes(hint, cut) {
  const ends = clauseEnds(hint); const clauseOf = (i) => ends.findIndex((e) => i < e);
  const negated = new Set(ends.map((_, k) => k).filter((k) => NEGATION.test(hint.slice(k ? ends[k - 1] + 1 : 0, ends[k]))));
  const all = TYPE_PATTERNS.flatMap(([re, token]) => [...hint.matchAll(re)].map((m) => ({ index: m.index, end: m.index + m[0].length, text: m[0], token: token(m), clause: clauseOf(m.index) })))
    .filter((t) => t.token).sort((x, y) => x.index - y.index);
  const kept = all.filter((t) => !negated.has(t.clause)); const atCut = kept.filter((t) => cut && t.end >= hint.length);
  const found = kept.filter((t) => !atCut.includes(t)); const skipped = new Set(all.filter((t) => negated.has(t.clause)).map((t) => t.clause)).size + atCut.length;
  return found.length ? { tokens: [...new Set(found.map((t) => t.token))], excerpt: [...new Set(found.map((t) => t.text))].join(', ').slice(0, 80), skipped } : { tokens: [], skipped };
}
const acceptTokens = (accept) => (accept === undefined ? [] : [...new Set(accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))]);
// The probe file name: the first known type declared, else the first stated, else bin when nothing restricts the type.
function probeExt(accepted, stated) {
  for (const tokens of [accepted, stated]) if (tokens.length) return tokens.map(extOf).find(Boolean) ?? null;
  return 'bin';
}
function statedTypeRows(types, via, accepted, note) {
  if (!types.tokens.length) return [];
  const basis = `stated: "${types.excerpt}" (${via})`; const source = helpText(types.excerpt, via); const declaredExts = new Set(accepted.map(extOf).filter(Boolean));
  const fresh = types.tokens.filter((t) => { const also = accepted.includes(t) || declaredExts.has(extOf(t)); if (also) note.count('statedAlsoDeclared'); return !also; });
  const outside = OUTSIDE.find((o) => !covers(types.tokens)(o)); const stated = (partition, probe, why = '') => newRow('stated', 'hint', partition, probe, `${basis}${why}`, source);
  return [...fresh.map((t) => (extOf(t) ? stated(STATED_TYPE.listed, file(`probe.${extOf(t)}`)) : stated(STATED_TYPE.listed, null, `; no file name is derived for ${t}`))),
    outside ? stated(STATED_TYPE.notListed, file(`probe.${outside[0]}`)) : stated(STATED_TYPE.notListed, null, '; every probe type is listed, so a file of a type not listed is not derived')];
}

// Limits stated in help text (English phrases only): "between N and M", "from N to M", "up to N", "max N", "maximum of N", "at most N", "no more than
// N", "at least N", "min N", "minimum of N", "no less/fewer than N"; and a bare size ("2 MB", "500KB") read as a maximum, exclusive after "under",
// "less than", "below" or "smaller than", and not used after "over", "more than", "larger than", "greater than", "above" or "exceed(s/ing)".
// The word after the number gives the unit: a size (B, KB, KiB, MB, MiB, GB, GiB), a length (characters, chars, letters, symbols), files, or
// another word; a percent, per-mille or degree sign or a currency symbol right after the number is another unit too. Numbers with a thousands
// or decimal comma, or grouped by a space, no-break space or apostrophe ("10 000", "10'000"), are not read, not even in part. In a cut help
// text, a limit whose phrase (with its unit) reaches the end may have lost its digits or unit, so it is not used and is counted.
const GROUPED = String.raw`\s\u00a0\u202f'’`;
const NUM = String.raw`(?<![\d.,])([-−]?\d+(?:\.\d+)?)(?!\d|[.,]\d|[${GROUPED}]\d)`; // a phrase number follows its keyword, so only what follows it can be a group
const LIMIT_PHRASES = [['range', new RegExp(String.raw`\b(?:between|from)\s+${NUM}(?:\s*(\p{L}+))?\s+(?:and|to)\s+${NUM}`, 'giu')],
  ['max', new RegExp(String.raw`\b(?:up\s+to|max(?:imum)?\.?(?:\s*:)?(?:\s+of)?|at\s+most|no\s+more\s+than|not\s+more\s+than)\s*${NUM}`, 'giu')],
  ['min', new RegExp(String.raw`\b(?:at\s+least|min(?:imum)?\.?(?:\s*:)?(?:\s+of)?|no\s+less\s+than|not\s+less\s+than|no\s+fewer\s+than)\s*${NUM}`, 'giu')]];
const BARE_SIZE = new RegExp(String.raw`(?<![\d.,]|\d[${GROUPED}])(\d+(?:\.\d+)?)\s*(kib|mib|gib|kb|mb|gb|bytes?|b)(?![\p{L}\p{N}])`, 'giu');
const EXCLUSIVE_BEFORE = /\b(?:under|less\s+than|below|smaller\s+than)\s*$/i;
const UNCLEAR_BEFORE = /\b(?:over|more\s+than|larger\s+than|greater\s+than|above|exceed(?:s|ing)?)\s*$/i;
// Bytes per unit under the decimal and the binary reading; a stated KB or MB may mean either, so probes hold under both.
const SIZE_FACTORS = { b: [1, 1], byte: [1, 1], bytes: [1, 1], kb: [1000, 1024], kib: [1024, 1024], mb: [1000000, 1048576], mib: [1048576, 1048576],
  gb: [1000000000, 1073741824], gib: [1073741824, 1073741824] };
const LENGTH_UNITS = new Set(['character', 'characters', 'char', 'chars', 'letter', 'letters', 'symbol', 'symbols']);
const MAX_PROBE_BYTES = 1073741824n; // a larger size probe (over 1 GiB) is not derived
function unitOf(word) {
  const w = (word ?? '').toLowerCase();
  if (!w || w === 'and' || w === 'or') return { unit: 'none' };
  if (SIZE_FACTORS[w]) return { unit: 'size', factors: SIZE_FACTORS[w] };
  if (LENGTH_UNITS.has(w)) return { unit: 'length' };
  return { unit: w === 'file' || w === 'files' ? 'files' : 'other' };
}
function statedLimits(hint, cut) {
  const limits = []; const spans = [];
  const after = (end) => {
    const m = /^\s*(?:(\p{L}+)|([%‰°]|\p{Sc}))/u.exec(hint.slice(end)); const u = m?.[2] ? { unit: 'other' } : unitOf(m?.[1]);
    return { u, length: u.unit === 'none' ? 0 : m[0].length };
  };
  for (const [kind, re] of LIMIT_PHRASES) for (const m of hint.matchAll(re)) {
    const end = m.index + m[0].length; const { u, length } = after(end); const excerpt = hint.slice(m.index, end + length); spans.push([m.index, end + length]);
    if (cut && end + length >= hint.length) { limits.push({ cut: true }); continue; }
    if (kind !== 'range') { limits.push({ side: kind, num: m[1], unit: u, excerpt }); continue; }
    const first = unitOf(m[2]);
    limits.push({ side: 'min', num: m[1], unit: first.unit === 'none' ? u : first, excerpt }, { side: 'max', num: m[3], unit: u, excerpt });
  }
  for (const m of hint.matchAll(BARE_SIZE)) {
    if (spans.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const before = hint.slice(0, m.index); if (UNCLEAR_BEFORE.test(before) || (cut && m.index + m[0].length >= hint.length)) { limits.push({ unclear: true }); continue; }
    const exclusive = EXCLUSIVE_BEFORE.exec(before);
    limits.push({ side: 'max', num: m[1], unit: unitOf(m[2]), exclusive: Boolean(exclusive), excerpt: hint.slice(exclusive ? exclusive.index : m.index, m.index + m[0].length) });
  }
  return limits.map((l) => (l.unclear || l.cut ? l : { ...l, num: l.num.replace('−', '-') }));
}
// Which rows a limit gives on this field: sizes on file inputs, lengths on text-like fields, numbers on number and range fields and on text
// fields of kind quantity (on any other text field a number may bound something else: "Save up to 20%", "Up to 10, separated by commas");
// anything else is one row whose probe is left to the agent.
function limitClass(l, f, kind) {
  if (l.unit.unit === 'size') return f.type === 'file' ? ['size'] : ['unresolved', 'a size on a field that takes no file is not derived'];
  if (l.unit.unit === 'length') return LENGTH_TYPES.has(f.type) ? ['length'] : ['unresolved', `a length on a ${f.type} field is not derived`];
  if (l.unit.unit === 'files') return ['unresolved', 'a count of files is not derived'];
  if (f.type === 'number' || f.type === 'range' || (f.type === 'text' && kind === 'quantity')) return ['value'];
  return ['unresolved', f.type === 'text' || f.type === 'search' ? `a number on a ${f.type} field that is not a quantity is not derived` : `a number on a ${f.type} field is not derived`];
}
const CLASS_ORDER = ['size', 'length', 'value', 'unresolved']; const SIDES = ['min', 'max'];
const DECLARED_LIMIT = { value: { min: 'min', max: 'max' }, length: { min: 'minlength', max: 'maxlength' } };
const alsoDeclared = (l, f) => { const attr = DECLARED_LIMIT[l.cls]?.[l.side]; return Boolean(attr) && f.constraints[attr] !== undefined && APPLIES[attr](f.type) && Number(f.constraints[attr]) === Number(l.num); };
const sameness = (l) => `${decimal(l.num) ? decimalString(decimal(l.num)) : l.num}|${l.unit.factors?.[0] ?? ''}|${Boolean(l.exclusive)}`;
function valueRows(l, basis, source) {
  const x = decimal(l.num); const unit = { units: l.side === 'min' ? -1n : 1n, scale: x.scale }; const [atLower, underLower, atUpper, overUpper] = STATED_BOUNDS.value;
  return [newRow('stated', 'hint', l.side === 'min' ? atLower : atUpper, value(decimalString(x)), basis, source),
    newRow('stated', 'hint', l.side === 'min' ? underLower : overUpper, value(decimalString(add(x, unit))), basis, source)];
}
function lengthRows(l, basis, f, source) {
  if (!/^\d+$/.test(l.num)) return [newRow('stated', 'hint', STATED_LIMIT[l.side], null, `${basis}; a length that is not a whole number is not derived`, source)];
  const n = Number(l.num); const [atLower, underLower, atUpper, overUpper] = STATED_BOUNDS.length; const max = f.constraints.maxlength;
  const stops = (k) => (max !== undefined && k > max ? `; longer than the declared maxlength=${max}, so the browser stops typing at ${max}` : '');
  const make = (partition, k) => (k <= MAX_PROBE_LENGTH ? newRow('stated', 'hint', partition, length(k), `${basis}${stops(k)}`, source)
    : newRow('stated', 'hint', partition, null, `${basis}; a probe of ${k} characters is too long to derive (over ${MAX_PROBE_LENGTH})`, source));
  return l.side === 'max' ? [make(atUpper, n), make(overUpper, n + 1)] : [...(n > 0 ? [make(atLower, n)] : []), ...(n > 1 ? [make(underLower, n - 1)] : [])];
}
// At a maximum: the largest size within it under both readings, and the smallest over it under both; at a minimum the reverse. A probe of
// zero bytes is the empty-file row.
function sizeRows(l, stated, ext, source) {
  const x = decimal(l.num); const d = 10n ** BigInt(x.scale); const [lo, hi] = l.unit.factors.map((k) => x.units * BigInt(k));
  const floor = (a) => a / d; const ceil = (a) => (a + d - 1n) / d; const bytes = (a) => decimalString({ units: a, scale: x.scale });
  const basis = `${stated}; read as ${lo === hi ? bytes(lo) : `${bytes(lo)} (decimal) to ${bytes(hi)} (binary)`} bytes`;
  const [atLower, underLower, atUpper, overUpper] = STATED_BOUNDS.size;
  const probes = l.side === 'min' ? [[atLower, ceil(hi)], [underLower, ceil(lo) - 1n]] : l.exclusive ? [[atUpper, ceil(lo) - 1n], [overUpper, ceil(hi)]] : [[atUpper, floor(lo)], [overUpper, floor(hi) + 1n]];
  return probes.filter(([, n]) => n > 0n).map(([partition, n]) => {
    if (n > MAX_PROBE_BYTES) return newRow('stated', 'hint', partition, null, `${basis}; a probe of ${n} bytes is too large to derive (over ${MAX_PROBE_BYTES})`, source);
    return ext ? newRow('stated', 'hint', partition, { kind: 'file', name: `probe.${ext}`, bytes: Number(n) }, basis, source)
      : newRow('stated', 'hint', partition, null, `${basis}; no file name is derived for the accepted types`, source);
  });
}
// Limits grouped by row class and side; a group stated with two different values gives no row (ambiguous), and one the field already declares
// with the same value gives none either (the declared rows cover it). Groups are listed sizes, lengths, numbers, then unresolved; min before max.
function statedLimitRows(f, kind, hint, cut, via, ext, note) {
  const groups = new Map();
  for (const l of statedLimits(hint, cut)) {
    if (l.unclear || l.cut) { note.count('statedAmbiguous'); continue; }
    const [cls, reason] = limitClass(l, f, kind); const key = `${CLASS_ORDER.indexOf(cls)}${SIDES.indexOf(l.side)}`;
    groups.set(key, [...(groups.get(key) ?? []), { ...l, cls, reason }]);
  }
  return [...groups.keys()].sort().flatMap((key) => {
    const group = groups.get(key); const [l] = group;
    if (new Set(group.map(sameness)).size > 1) { note.count('statedAmbiguous'); return []; }
    if (alsoDeclared(l, f)) { note.count('statedAlsoDeclared'); return []; }
    const basis = `stated: "${l.excerpt}" (${via})`; const source = helpText(l.excerpt, via);
    if (l.cls === 'unresolved' || !decimal(l.num)) return [newRow('stated', 'hint', STATED_LIMIT[l.side], null, `${basis}; ${l.reason ?? 'the number is not derived'}`, source)];
    return l.cls === 'size' ? sizeRows(l, basis, ext, source) : l.cls === 'length' ? lengthRows(l, basis, f, source) : valueRows(l, basis, source);
  });
}

const NOT_SHOWN = ' (file input not visible at capture)';
const emptyFileRow = (f, ext) => newRow('inferred', 'file', 'empty-file', ext ? { kind: 'file', name: `probe.${ext}`, bytes: 0 } : null,
  `inferred: type=file; a zero-byte file${f.notShown ? NOT_SHOWN : ''}${ext ? '' : '; no file name is derived for the accepted types'}`, 'type=file');
// A file input not visible at capture (opened through a styled label or button) is listed with its declared rows, which v1 only counts, unless
// v1 lists it from another capture where it was visible (its declared rows are then v1's).
const hiddenDeclaredRows = (f) => [...(f.constraints.required ? [{ ...row('required', true, 'empty', empty, `declared required${NOT_SHOWN}`), confidence: 'declared' }] : []),
  ...(f.constraints.accept === undefined ? [] : acceptRows(f.constraints.accept).map((r) => ({ ...r, basis: `${r.basis}${NOT_SHOWN}`, confidence: 'declared' })))];
// A help text is cut when page-facts says so, or (an earlier capture, cut inside a word) when it fills the 200-character cap.
const HINT_CAP = 200;
function subjectRows(f, v2, note, listedByV1) {
  const k = kindOf(f); const hint = v2 && typeof f.hint === 'string' ? f.hint : ''; const cut = f.hintTruncated === true || hint.length >= HINT_CAP;
  if (k.ambiguous) note.count('kindAmbiguous'); if (k.kind) note.kind(k.kind); if (hint) note.count('hinted');
  const accepted = f.type === 'file' ? acceptTokens(f.constraints.accept) : []; const types = hint && f.type === 'file' ? statedTypes(hint, cut) : { tokens: [], skipped: 0 };
  for (let i = 0; i < types.skipped; i += 1) note.count('statedAmbiguous');
  const ext = probeExt(accepted, types.tokens); const via = f.hintSource ?? 'help text';
  const required = requiredRows(f); if (required.length) note.count('requiredInferred');
  return { kind: k.kind, rows: [...(f.notShown && !listedByV1 ? hiddenDeclaredRows(f) : []), ...required, ...kindRows(f, k), ...statedTypeRows(types, via, accepted, note),
    ...(hint ? statedLimitRows(f, k.kind, hint, cut, via, ext, note) : []), ...(f.type === 'file' ? [emptyFileRow(f, ext)] : [])] };
}
// The fields v1 lists (one per radio group, none inactive, disabled, read-only or off-page) and the hidden file inputs not inactive or disabled.
function* subjectsOf(fields, fileInputs, skippedFile) {
  const radios = new Set();
  for (const member of fields) {
    const f = asGroup(member, fields);
    if (f.type === 'radio' && f.name) { const group = `${f.form}|${f.name}`; if (radios.has(group)) continue; radios.add(group); }
    if (!skipReason(f)) yield f;
  }
  for (const fi of fileInputs) {
    const f = { ...fi, type: 'file', placeholder: null, constraints: { accept: fi.accept, required: fi.required, multiple: fi.multiple }, notShown: true };
    const reason = skipReason(f); if (reason) skippedFile(f, reason); else yield f;
  }
}

// A v1 row in v2: declared, byte-identical with confidence appended. The duplicate-identity suggestion is not declared (uniqueness never is; the
// idea comes from autofill tokens in a sign-up context), so it keeps its id and place as an inferred test idea with no expectation.
function v1AsV2(r) {
  if (!r.suggestion) return { ...r, confidence: 'declared' };
  const { expectation, basis, authority, status, ...head } = r;
  return { ...head, expectation: null, applicability: 'unknown', source: `autocomplete=${r.declared} in a sign-up context`,
    basis: `inferred: ${basis}; uniqueness is not a declared constraint`, authority, status, confidence: 'inferred' };
}
// The v2 worklist: the v1 rows first (v1AsV2), then the new rows merged over states like v1 rows; inference coverage per distinct field. A new
// row merges with one of another state only when its source agrees too: one field with different evidence in two captures keeps each source.
// A capture without help-text facts (no fileInputs list) is an older capture: its stated rows and aria-required inference are unassessed.
export function partitionWorklistV2(states) {
  const base = partitionWorklist(states);
  const merged = new Map(); const seen = new Set(); const skippedFiles = new Map(); const listedFiles = new Set(); const hintFactsMissing = [];
  const tally = { kinds: new Map(), kindAmbiguous: 0, requiredInferred: 0, hinted: 0, statedAlsoDeclared: 0, statedAmbiguous: 0, shown: 0, notShown: 0 };
  const usable = states.filter((s) => Array.isArray(s.facts?.fields) && !s.facts.fields.some((f) => !f.constraints));
  const keyAt = (s) => { const route = routeOf(s.url) ?? s.url; return (f) => JSON.stringify([route, f.form, f.sel]); };
  const listedByV1 = new Set(usable.flatMap((s) => [...subjectsOf(s.facts.fields, [], () => {})].map(keyAt(s))));
  for (const s of usable) {
    const fields = s.facts.fields;
    const v2 = Array.isArray(s.facts.fileInputs); if (!v2) hintFactsMissing.push(s.label);
    const route = routeOf(s.url) ?? s.url; const keyOf = keyAt(s);
    for (const f of subjectsOf(fields, v2 ? s.facts.fileInputs : [], (x, reason) => { if (!skippedFiles.has(keyOf(x))) skippedFiles.set(keyOf(x), reason); })) {
      const key = keyOf(f); const first = !seen.has(key); seen.add(key); if (f.notShown) listedFiles.add(key);
      const note = { count: (k) => { if (first) tally[k] += 1; }, kind: (k) => { if (first) tally.kinds.set(k, (tally.kinds.get(k) ?? 0) + 1); } };
      if (first && f.type === 'file') tally[f.notShown ? 'notShown' : 'shown'] += 1;
      const { kind, rows } = subjectRows(f, v2, note, listedByV1.has(key));
      for (const r of rows) {
        const id = JSON.stringify([route, f.form, f.sel, r.attribute, r.partition, r.probe, r.confidence, r.source ?? null]); const hit = merged.get(id);
        if (hit) { if (!hit.states.includes(s.label)) hit.states.push(s.label); continue; }
        // A declared row keeps its v1 expectation; a stated or inferred row has none: applicability unknown, and the source of the idea.
        merged.set(id, { states: [s.label], form: f.form, sel: f.sel, name: f.name ?? f.id ?? null, type: f.type, attribute: r.attribute, declared: r.declared, partition: r.partition,
          probe: r.probe, ...(r.confidence === 'declared' ? { expectation: EXPECTATION[r.partition] } : { expectation: null, applicability: 'unknown', source: r.source }),
          basis: r.basis, authority: ROW_STATUS.authority, status: ROW_STATUS.status,
          confidence: r.confidence, kind, ...(f.notShown ? { notShown: true } : {}) });
      }
    }
  }
  const extra = [...merged.values()].map((r, i) => ({ id: `W${String(base.rows.length + i + 1).padStart(3, '0')}`, ...r }));
  const rows = [...base.rows.map(v1AsV2), ...extra];
  const by = (c) => rows.filter((r) => r.confidence === c).length;
  const notListed = [...skippedFiles].filter(([key]) => !listedFiles.has(key)).map(([, reason]) => reason);
  return { scope: SCOPE_V2, states: base.states, count: rows.length, coverage: base.coverage,
    inference: { confidence: { declared: by('declared'), stated: by('stated'), inferred: by('inferred') }, kinds: Object.fromEntries(KINDS.filter((k) => tally.kinds.has(k)).map((k) => [k, tally.kinds.get(k)])),
      kindAmbiguous: tally.kindAmbiguous, requiredInferred: tally.requiredInferred, hinted: tally.hinted, statedAlsoDeclared: tally.statedAlsoDeclared, statedAmbiguous: tally.statedAmbiguous,
      fileInputs: { shown: tally.shown, notShown: tally.notShown },
      fileInputsNotListed: Object.fromEntries(['inactive', 'disabled'].filter((k) => notListed.includes(k)).map((k) => [k, notListed.filter((x) => x === k).length])),
      probeNotDerived: extra.filter((r) => r.probe === null).length, hintFactsMissing }, rows };
}

// The Expected cell: a declared row's expectation; for a stated or inferred row, "expected: unknown" and the source of the idea.
const expectedText = (r) => (r.expectation === null ? `expected: unknown (source: ${r.source})` : r.expectation);
const rowLineV2 = (r) => `| ${r.id} | ${esc(r.name ?? '')} \`${esc(r.sel).slice(0, 80)}\`${r.notShown ? ' (not visible at capture)' : ''} | ${r.partition}${r.suggestion ? ' (suggestion)' : ''} | `
  + `${esc(probeTextV2(r.probe))} | ${esc(expectedText(r))} | ${r.confidence} | ${esc(r.basis).slice(0, 240)} | ${esc(r.states[0])}${r.states.length > 1 ? ` +${r.states.length - 1}` : ''} | ${r.authority} — ${r.status} |`;
// The v2 report section: every row with its confidence; what is stated, inferred, ambiguous, already declared, not listed or unassessed.
export function partitionLinesV2(w) {
  const c = w.coverage; const inf = w.inference; const head = ['', '## Input partitions to try (not executed): declared, stated and inferred', ''];
  if (!c.fields && !inf.fileInputs.notShown && !w.rows.length && !Object.keys(c.notListed).length && !c.olderCaptures.length && !inf.hintFactsMissing.length
    && !Object.keys(inf.fileInputsNotListed).length) {
    return [...head, 'No form field or file input was listed, so no partition row was derived.'];
  }
  const hidden = inf.fileInputs.notShown ? ` and ${inf.fileInputs.notShown} file input(s) not visible at capture` : ''; const n = inf.confidence;
  const kinds = Object.keys(inf.kinds).length ? counts(inf.kinds) : 'none'; const notListed = counts(inf.fileInputsNotListed);
  const probes = c.probeNotDerived + inf.probeNotDerived;
  return [...head,
    `${w.count} planned check(s) for ${c.fields} field(s)${hidden}: ${n.declared} declared, ${n.stated} stated in a field's own help text, ${n.inferred} inferred. `
    + "They are not candidates and nothing was typed: each row requires write authority and is not executed, and any result belongs to the agent's own records.",
    "A declared row comes from an attribute the browser applies; a stated row from a type or limit in the field's own help text (aria-describedby, or a following small or role=note element); "
    + 'an inferred row from autofill tokens, input modes, names, labels, placeholders, required markers or the field type.',
    'Stated and inferred rows are test ideas from a source of unknown applicability, not expected results. Each shows "expected: unknown" and names its source; '
    + 'whether the application has that rule is not known. A limit that is neither declared nor stated is never invented.',
    ...(w.rows.some((r) => r.partition === 'duplicate-identity')
      ? ['Uniqueness is never declared: a duplicate-identity row is inferred from autofill tokens (a sign-up context) and is a suggestion only.'] : []),
    ...(Object.keys(inf.kinds).length || inf.kindAmbiguous ? [`Field kinds: ${kinds}.${inf.kindAmbiguous ? ` Kind not inferred for ${inf.kindAmbiguous} field(s) whose strongest signal names more than one kind, or whose label, placeholder, name or id offers alternatives or names a user name.` : ''}`] : []),
    ...(inf.statedAlsoDeclared ? [`Stated types or limits already declared (no stated row): ${inf.statedAlsoDeclared}.`] : []),
    ...(inf.statedAmbiguous ? [`Stated limits or types not used (no row): ${inf.statedAmbiguous}, stated twice with different values, in an unclear direction, in a negated clause, or at the end of a cut help text.`] : []),
    ...declaredGapLines(c),
    ...(notListed ? [`File inputs not visible at capture and not listed: ${notListed}.`] : []),
    ...(inf.hintFactsMissing.length && c.fileInputsNotShown ? [`File inputs not visible at capture: ${c.fileInputsNotShown} over all captures (often opened through a styled button or label); `
      + `in ${inf.hintFactsMissing.join(', ')} (older capture) they were counted only, so their rows are not listed.`] : []),
    ...(c.olderCaptures.length ? [`Field constraint facts not recorded in: ${c.olderCaptures.join(', ')} (older capture); input partitions are unassessed there.`] : []),
    ...(inf.hintFactsMissing.length ? [`Help text, aria-required and hidden file input facts not recorded in: ${inf.hintFactsMissing.join(', ')} (older capture); stated rows and aria-required inference are unassessed there.`] : []),
    ...(probes ? [`Probe not derived for ${probes} row(s); the agent picks the value.`] : []),
    ...(w.rows.length ? ['', '| ID | Field | Partition | Probe | Expected | Confidence | Basis | States | Status |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |', ...w.rows.map(rowLineV2)] : [])];
}
