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
  return [...rows, off !== null && conv.parse(off) !== null ? row('step', c.step, 'off-step', value(off), `declared step=${c.step} from min=${c.min}, between two allowed values`)
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
