// Offline detectors over captured facts: consistency of look-alike elements within and across reached states.
// Every function is pure and returns candidates; none of them is a verdict.
const UTILITY = /^(text|align|justify|float|fw|fs|lh|font|m[trblxyse]?|p[trblxyse]?|d|order|w|h|bg|border|rounded|shadow|gap|flex|items|self|place|col|row)-/;
const SKIP_TAGS = new Set(['td', 'th', 'option']);
const MAX_ITEM_TEXT = 60;
export const baseSig = (sig) => { const [tag, ...cls] = (sig || '').split('.'); return [tag, ...cls.filter((c) => c && !UTILITY.test(c))].join('.'); };
export const alignOf = (value) => ({ start: 'left', end: 'right', '-webkit-left': 'left', '-webkit-right': 'right', '-webkit-center': 'center' }[value] ?? value);
const px = (value) => Number.parseFloat(value);
const evidence = (state, sel) => ({ state: state.label, url: state.url, selector: sel, shot: `passive/${state.label}.png`, facts: `passive/${state.label}.facts.json` });
const majorityOf = (values) => {
  const counts = new Map(); for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const [value, n] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [undefined, 0];
  return { value, share: values.length ? n / values.length : 0, distinct: counts.size };
};
const inspectable = (e) => !e.underOverlay && !e.disabled;
const groupKey = (e) => `${baseSig(e.parentSig)}>${baseSig(e.sig)}`;

export function styleOutliers(state, { minGroup = 5, majority = 0.65 } = {}) {
  const groups = new Map();
  for (const e of state.facts.elements) {
    if (!inspectable(e) || SKIP_TAGS.has(e.tag) || e.text.length > MAX_ITEM_TEXT) continue;
    const key = groupKey(e); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(e);
  }
  const out = [];
  for (const [key, els] of groups) {
    if (els.length < minGroup) continue;
    for (const prop of ['textAlign', 'fontFamily', 'fontSize']) {
      const value = (e) => (prop === 'textAlign' ? alignOf(e.style.textAlign) : e.style[prop]);
      const m = majorityOf(els.map(value)); if (m.distinct < 2 || m.share < majority) continue;
      for (const odd of els.filter((e) => value(e) !== m.value)) out.push({ detector: 'style', key: `style|${key}|${prop}|${value(odd)}`,
        severity: prop === 'fontSize' ? 'low' : 'medium', confidence: 'medium',
        what: `Look-alike elements differ in ${prop}: "${odd.text}" has ${value(odd)}, most of ${els.length} siblings have ${m.value}`, evidence: evidence(state, odd.sel) });
    }
  }
  return out;
}

export function crossStateAlignment(states, { minStates = 3, majority = 0.6 } = {}) {
  const perKey = new Map();
  for (const state of states) {
    const groups = new Map();
    for (const e of state.facts.elements) {
      if (!inspectable(e) || SKIP_TAGS.has(e.tag) || e.text.length > MAX_ITEM_TEXT) continue;
      const key = groupKey(e); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(e);
    }
    for (const [key, els] of groups) {
      if (els.length < 2) continue;
      const m = majorityOf(els.map((e) => alignOf(e.style.textAlign)));
      if (!perKey.has(key)) perKey.set(key, []);
      perKey.get(key).push({ state, align: m.value, sample: els.find((e) => alignOf(e.style.textAlign) === m.value) });
    }
  }
  const out = [];
  for (const [key, rows] of perKey) {
    const byUrl = [...new Map(rows.map((r) => [r.state.url, r])).values()];
    if (byUrl.length < minStates) continue;
    const m = majorityOf(byUrl.map((r) => r.align)); if (m.distinct < 2 || m.share < majority) continue;
    for (const r of byUrl.filter((x) => x.align !== m.value)) out.push({ detector: 'alignment', key: `align|${key}|${r.state.url}`, severity: 'medium', confidence: 'medium',
      what: `Repeated items "${r.sample.text}" are ${r.align}-aligned here; the same kind of item is ${m.value}-aligned on ${Math.round(m.share * byUrl.length)} of ${byUrl.length} pages`,
      evidence: evidence(r.state, r.sample.sel) });
  }
  return out;
}

export function inputPaddingOutliers(states, { minFields = 5, majority = 0.65, tolerancePx = 4 } = {}) {
  const fields = [...new Map(states.flatMap((s) => s.facts.fields.filter((f) => f.textLike && f.tag === 'input' && inspectable(f))
    .map((f) => [`${s.url}|${f.sel}`, { state: s, f }]))).values()];
  if (fields.length < minFields) return [];
  const m = majorityOf(fields.map(({ f }) => f.style.paddingLeft)); if (m.distinct < 2 || m.share < majority) return [];
  // Only smaller padding is a candidate: larger left padding is usually a designed icon slot.
  return fields.filter(({ f }) => px(f.style.paddingLeft) < px(m.value) - tolerancePx).map(({ state, f }) => ({ detector: 'padding', key: `padding|${f.sel}|${f.style.paddingLeft}`,
    severity: 'medium', confidence: 'medium', what: `Input ${f.name || f.id || f.placeholder || f.sel} has left padding ${f.style.paddingLeft}; ${Math.round(m.share * fields.length)} of ${fields.length} inputs have ${m.value}`,
    evidence: evidence(state, f.sel) }));
}

const ALIGN_TOLERANCE = 8;
function formShape(state, formIndex) {
  const inputs = state.facts.fields.filter((f) => f.form === formIndex && f.textLike && inspectable(f));
  const buttons = state.facts.controls.filter((c) => c.form === formIndex && inspectable(c) && (c.tag === 'button' || c.tag === 'input'));
  if (inputs.length < 2 || !buttons.length) return null;
  const submits = buttons.filter((b) => b.type === 'submit' || (b.tag === 'button' && b.type == null));
  const primary = (submits.length ? submits : buttons.length === 1 ? buttons : []).sort((a, b) => a.rect.y - b.rect.y).at(-1);
  if (!primary) return null;
  const left = Math.min(...inputs.map((f) => f.rect.x)); const right = Math.max(...inputs.map((f) => f.rect.x + f.rect.w));
  const b = primary.rect; const ratio = b.w / Math.max(1, right - left);
  const align = ratio >= 0.9 ? 'full' : Math.abs(b.x - left) <= ALIGN_TOLERANCE ? 'left' : Math.abs(b.x + b.w - right) <= ALIGN_TOLERANCE ? 'right'
    : Math.abs(b.x + b.w / 2 - (left + right) / 2) <= ALIGN_TOLERANCE ? 'center' : 'offset';
  return { state, primary, ratio, align };
}

export function primaryActionGeometry(states, { minForms = 3, majority = 0.6, ratioFactor = 1.8 } = {}) {
  const shapes = [...new Map(states.flatMap((s) => Array.from({ length: s.facts.formCount ?? 0 }, (_, i) => formShape(s, i)))
    .filter(Boolean).map((x) => [`${new URL(x.state.url).pathname}${new URL(x.state.url).hash}|${x.primary.sel}`, x])).values()];
  const out = [];
  const name = (x) => x.primary.name?.text || x.primary.sel;
  for (const x of shapes.filter((s) => s.align === 'offset')) out.push({ detector: 'geometry', key: `offset|${x.primary.sel}`, severity: 'low', confidence: 'medium',
    what: `Primary action "${name(x)}" is neither full width nor aligned to its form's inputs (width ${Math.round(x.ratio * 100)}% of the input column)`, evidence: evidence(x.state, x.primary.sel) });
  if (shapes.length < minForms) return out;
  const m = majorityOf(shapes.map((s) => s.align));
  const ratios = shapes.map((s) => s.ratio).sort((a, b) => a - b); const median = ratios[Math.floor(ratios.length / 2)];
  for (const x of shapes) {
    const alignOdd = m.share >= majority && m.distinct > 1 && x.align !== m.value && x.align !== 'offset';
    const ratioOdd = x.ratio < median / ratioFactor || x.ratio > median * ratioFactor;
    if (!alignOdd && !ratioOdd) continue;
    out.push({ detector: 'geometry', key: `primary|${x.primary.sel}|${x.align}`, severity: 'medium', confidence: 'medium',
      what: `Primary action "${name(x)}" is ${x.align} at ${Math.round(x.ratio * 100)}% of its input column; across ${shapes.length} forms most are ${m.value} (median width ${Math.round(median * 100)}%)`,
      evidence: evidence(x.state, x.primary.sel) });
  }
  return out;
}

export function optionFontOutliers(state) {
  const out = [];
  for (const f of state.facts.fields) {
    if (!f.options || f.options.length < 3 || f.underOverlay) continue;
    const m = majorityOf(f.options.map((o) => o.fontSize)); if (m.distinct < 2) continue;
    const odd = f.options.filter((o) => o.fontSize !== m.value);
    out.push({ detector: 'style', key: `optfont|${f.sel}`, severity: 'low', confidence: 'medium',
      what: `Options of ${f.name || f.sel} use different font sizes: ${odd.slice(0, 4).map((o) => `"${o.text}" ${o.fontSize}`).join(', ')} vs ${m.value}`, evidence: evidence(state, f.sel) });
  }
  return out;
}
