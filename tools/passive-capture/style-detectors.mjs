// Offline detectors over captured facts: consistency of look-alike elements within and across reached states, and failed images.
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
const inspectable = (e) => !e.inactive && !e.disabled;
// Not rendered at capture: an ancestor has opacity 0 (a stacked state layer or content not yet revealed). Its look is not compared.
const comparable = (e) => inspectable(e) && e.opacity !== 0;
// A key with no class left after utility classes are stripped says only the tag pair (div>p), which joins different roles across a
// page. Such elements form a kind only with their true siblings: the key is then their parent's selector path. An element anchored
// at its own id has no parent path and is a kind of its own.
const classless = (sig) => !baseSig(sig).includes('.');
const parentPath = (sel) => sel.split(' > ').slice(0, -1).join(' > ');
const groupKey = (e) => {
  if (!classless(e.parentSig) || !classless(e.sig)) return `${baseSig(e.parentSig)}>${baseSig(e.sig)}`;
  const path = parentPath(e.sel); return path ? `${path} > ${baseSig(e.sig)}` : e.sel;
};
// text-align positions text inside a block box only; an inline-level box (inline, inline-block, inline-flex...) shrinks to its text,
// so its own text-align, usually inherited, changes nothing. Captures without display compare it as before.
const alignable = (e) => !/^inline/.test(e.style.display ?? '');
const STYLE_PROPS = ['textAlign', 'fontFamily', 'fontSize'];
const VARIANT_PROPS = [...STYLE_PROPS, 'fontWeight', 'color'];
const styleValue = (e, prop) => (prop === 'textAlign' ? alignOf(e.style.textAlign) : e.style[prop]);
const usable = (e, prop) => prop !== 'textAlign' || alignable(e);

// A look-alike that drifts in one property is the candidate. One that differs from its group's usual value in two or more of
// alignment, family, size, weight and colour is a designed variant (a totals row, an emphasised item); an odd value shared by
// minCluster or more members, long-text members included, is a second variant (a sub-group), not a stray outlier.
export function styleOutliers(state, { minGroup = 5, majority = 0.65, minCluster = 3, minVariantProps = 2 } = {}) {
  const groups = new Map();
  for (const e of state.facts.elements) {
    if (!comparable(e) || SKIP_TAGS.has(e.tag)) continue;
    const key = groupKey(e); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(e);
  }
  const out = [];
  for (const [key, all] of groups) {
    const items = all.filter((e) => e.text.length <= MAX_ITEM_TEXT);
    const usual = Object.fromEntries(VARIANT_PROPS.map((p) => [p, majorityOf(items.filter((e) => usable(e, p)).map((e) => styleValue(e, p))).value]));
    const differences = (e) => VARIANT_PROPS.filter((p) => usable(e, p) && styleValue(e, p) !== usual[p]).length;
    for (const prop of STYLE_PROPS) {
      const els = items.filter((e) => usable(e, prop)); if (els.length < minGroup) continue;
      const m = majorityOf(els.map((e) => styleValue(e, prop))); if (m.distinct < 2 || m.share < majority) continue;
      for (const odd of els.filter((e) => styleValue(e, prop) !== m.value)) {
        const shared = all.filter((e) => usable(e, prop) && styleValue(e, prop) === styleValue(odd, prop)).length;
        if (shared >= minCluster || differences(odd) >= minVariantProps) continue;
        out.push({ detector: 'style', key: `style|${key}|${prop}|${styleValue(odd, prop)}`, severity: prop === 'fontSize' ? 'low' : 'medium', confidence: 'medium',
          what: `Look-alike elements differ in ${prop}: "${odd.text}" has ${styleValue(odd, prop)}, most of ${els.length} siblings have ${m.value}`, evidence: evidence(state, odd.sel) });
      }
    }
  }
  return out;
}

export function crossStateAlignment(states, { minStates = 3, majority = 0.6 } = {}) {
  const perKey = new Map();
  for (const state of states) {
    const groups = new Map();
    for (const e of state.facts.elements) {
      if (!comparable(e) || !alignable(e) || SKIP_TAGS.has(e.tag) || e.text.length > MAX_ITEM_TEXT) continue;
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

// A field whose box lies outside the page (a honeypot parked at left:-9999px) is not part of what a user sees or fills.
const placed = (r) => r.w > 1 && r.h > 1 && r.x + r.w > 0 && r.y + r.h > 0;
export function inputPaddingOutliers(states, { minFields = 5, majority = 0.65, tolerancePx = 4 } = {}) {
  const fields = [...new Map(states.flatMap((s) => s.facts.fields.filter((f) => f.textLike && f.tag === 'input' && inspectable(f) && placed(f.rect))
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
  const inputs = state.facts.fields.filter((f) => f.form === formIndex && f.textLike && inspectable(f) && placed(f.rect));
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
  // Design-system fingerprint: a form is held only to forms whose primary action uses the same type family; a form of another
  // product on the same origin (another family) sets no convention for these.
  const families = new Map(); for (const x of shapes) { const k = x.primary.style?.fontFamily ?? ''; if (!families.has(k)) families.set(k, []); families.get(k).push(x); }
  for (const group of families.values()) if (group.length >= minForms) out.push(...geometryOutliers(group, majority, ratioFactor, name));
  return out;
}
function geometryOutliers(shapes, majority, ratioFactor, name) {
  const out = [];
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
    if (!f.options || f.options.length < 3 || f.inactive) continue;
    const m = majorityOf(f.options.map((o) => o.fontSize)); if (m.distinct < 2) continue;
    const odd = f.options.filter((o) => o.fontSize !== m.value);
    out.push({ detector: 'style', key: `optfont|${f.sel}`, severity: 'low', confidence: 'medium',
      what: `Options of ${f.name || f.sel} use different font sizes: ${odd.slice(0, 4).map((o) => `"${o.text}" ${o.fontSize}`).join(', ')} vs ${m.value}`, evidence: evidence(state, f.sel) });
  }
  return out;
}

// Cross-page consistency of same-kind repeated items, generalising crossStateAlignment to a property list. Text items are
// keyed like alignment; text-like fields by tag, type and the same key, and also compared by width relative to their form or
// container. Fields without a signature come from an older capture and are not compared. text-align stays with alignment.
const ITEM_PROPS = ['fontSize', 'fontFamily', 'fontWeight', 'paddingLeft', 'paddingRight'];
const FIELD_PROPS = [...ITEM_PROPS, 'width'];
const WIDTH_TOLERANCE = { pct: 5, px: 4 };
const propOf = (e, prop) => (prop !== 'width' ? e.style[prop] : e.containerW > 0 ? Math.round((100 * e.rect.w) / e.containerW) : undefined);
const repeatedItem = (e) => comparable(e) && !SKIP_TAGS.has(e.tag) && e.text.length <= MAX_ITEM_TEXT;

// kind -> url -> { state, els }: the last capture of a URL stands for that page, as in alignment.
function kindsByPage(states, minItems) {
  const perKind = new Map();
  for (const state of states) {
    const kinds = new Map(); const add = (key, e) => { if (!kinds.has(key)) kinds.set(key, []); kinds.get(key).push(e); };
    for (const e of state.facts.elements) if (repeatedItem(e)) add(`item|${groupKey(e)}`, e);
    for (const f of state.facts.fields) if (inspectable(f) && f.textLike && f.sig !== undefined) add(`field|${f.tag}|${f.type}|${groupKey(f)}`, f);
    for (const [key, els] of kinds) {
      if (els.length < minItems) continue;
      if (!perKind.has(key)) perKind.set(key, new Map()); perKind.get(key).set(state.url, { state, els });
    }
  }
  return perKind;
}

// A page votes only with a value that more than half of its items share.
function pageValue(page, prop) {
  const m = majorityOf(page.els.map((e) => propOf(e, prop)));
  if (m.value === undefined || m.share <= 0.5) return null;
  return { ...page, value: m.value, sample: page.els.find((e) => propOf(e, prop) === m.value) };
}
const pageVotes = (pages, prop) => [...pages.values()].map((p) => pageValue(p, prop)).filter(Boolean);
const propsOf = (key) => (key.startsWith('field|') ? FIELD_PROPS : ITEM_PROPS);
// Widths match within a few percentage points of the container or a few pixels: a field of the same share of a wider form,
// or of the same pixel width in another form, is not an outlier.
const sameValue = (prop, tol) => (prop !== 'width' ? (a, b) => a.value === b.value
  : (a, b) => Math.abs(a.value - b.value) <= tol.pct || Math.abs(a.sample.rect.w - b.sample.rect.w) <= tol.px);
// The page value most pages share; ties go to the earlier page.
function sharedValue(pages, same) {
  let top = null; let n = 0;
  for (const p of pages) { const k = pages.filter((q) => same(p, q)).length; if (k > n) [top, n] = [p, k]; }
  return { top, n };
}
function describeOutlier(field, prop, p, top, n, of) {
  const subject = field ? `Fields "${p.sample.name || p.sample.id || p.sample.placeholder || p.sample.sel}"` : `Repeated items "${p.sample.text}"`;
  const [here, there] = prop === 'width'
    ? [`are ${p.value}% of their container width (${p.sample.rect.w} of ${p.sample.containerW}px)`, `is ${top.value}% (${top.sample.rect.w} of ${top.sample.containerW}px)`]
    : [`have ${prop} ${p.value}`, `has ${top.value}`];
  return `${subject} ${here} here; the same kind of ${field ? 'field' : 'item'} ${there} on ${n} of ${of} pages; a majority, not a design rule, so the odd page may be the intended one`;
}

// Design-system fingerprint: a kind whose font family differs on every page that has one (three pages, three families) comes from
// different design systems or products, so none of its properties is compared across those pages.
const familyPerPage = (pages, minStates) => { const v = pageVotes(pages, 'fontFamily'); return v.length >= minStates && new Set(v.map((p) => p.value)).size === v.length; };

export function crossStateProperties(states, { minStates = 3, majority = 0.6, minItems = 2, widthTolerance = WIDTH_TOLERANCE } = {}) {
  const out = [];
  for (const [key, pages] of kindsByPage(states, minItems)) {
    if (familyPerPage(pages, minStates)) continue;
    const field = key.startsWith('field|');
    for (const prop of propsOf(key)) {
      const voted = pageVotes(pages, prop);
      if (voted.length < minStates) continue;
      const same = sameValue(prop, widthTolerance); const { top, n } = sharedValue(voted, same);
      if (n / voted.length < majority) continue;
      for (const p of voted.filter((x) => !same(x, top))) out.push({ detector: 'property-outlier', key: `property|${key}|${prop}|${p.state.url}`,
        severity: 'medium', confidence: 'medium', what: describeOutlier(field, prop, p, top, n, voted.length), evidence: evidence(p.state, p.sample.sel) });
    }
  }
  return out;
}

// What was compared, never a pass. A kind on fewer pages than minStates is not compared. A kind on enough pages is compared only
// when at least one property has a page value on minStates pages; without one it is not comparable. The properties of a compared
// kind that lack such values are counted as well.
export function crossStateCoverage(states, { minStates = 3, minItems = 2 } = {}) {
  const kinds = [...kindsByPage(states, minItems)];
  const onEnough = kinds.filter(([, pages]) => pages.size >= minStates); const families = onEnough.filter(([, pages]) => familyPerPage(pages, minStates));
  const seen = onEnough.filter(([, pages]) => !familyPerPage(pages, minStates))
    .map(([key, pages]) => ({ props: propsOf(key).length, lacking: propsOf(key).filter((prop) => pageVotes(pages, prop).length < minStates).length }));
  const compared = seen.filter((k) => k.lacking < k.props);
  return { minStates, compared: compared.length, notComparable: seen.length - compared.length, notCompared: kinds.length - onEnough.length,
    propertiesNotCompared: compared.reduce((n, k) => n + k.lacking, 0), differentFamilies: families.length };
}

// Failed images: only 'failed' is a candidate; svg, no-source and not-yet-loaded images are counted as unassessed.
const LOAD_GAPS = ['svg', 'no-src', 'pending'];
const activeImages = (state) => (state.facts.images ?? []).filter((i) => !i.inactive);
export function imageCoverage(state) {
  const images = activeImages(state); const count = (load) => images.filter((i) => i.load === load).length;
  return { loaded: count('loaded'), failed: count('failed'), unassessed: Object.fromEntries(LOAD_GAPS.map((k) => [k, count(k)]).filter(([, n]) => n > 0)) };
}

export function brokenImageCandidates(state) {
  const { loaded, failed } = imageCoverage(state);
  return activeImages(state).filter((i) => i.load === 'failed').map((i) => ({ detector: 'broken-image', key: `broken-image|${i.sel}`, severity: 'medium', confidence: 'medium',
    what: `Image finished loading without a decoded size (naturalWidth 0): the source failed or is not an image; in ${state.label}, ${loaded} of ${loaded + failed} assessed images loaded. The source URL is not stored; an environment cause is possible`,
    evidence: evidence(state, i.sel) }));
}
