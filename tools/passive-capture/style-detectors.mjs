// Offline detectors over captured facts: consistency of look-alike elements within and across reached states, and failed images.
// Every function is pure and returns candidates; none of them is a verdict.
import { routeOf } from './reached.mjs';

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

// ---- Pooled style (opt-in: runDetectors(states, { pooled: true }) or detect.mjs --pooled). ----
// Three detectors that need no per-page majority. Every row is a low-confidence candidate with its basis, never a defect claim, and
// no expectation is read from UI text or convention: a value is held only to other captured values of the same kind.
// The look properties compared are those already in the facts. A background is known only as a solid colour found on the element or
// an ancestor; an assumed page white, a faded holder, an image, a layer or a translucent background stays unknown and is not compared.
const LOOK_PROPS = ['textAlign', 'fontFamily', 'fontSize', 'fontWeight', 'color', 'background'];
const POOLED_PROPS = { item: LOOK_PROPS, field: [...LOOK_PROPS.slice(0, 5), 'width'], primary: ['width'] };
const POOLED = { minStates: 2, majority: 0.75, minAgree: 3, minRoutes: 2, minVariantProps: 2 };
const knownBackground = (e) => (e.bg?.kind === 'solid' && !e.bg.assumed && e.bg.opacity === undefined ? e.bg.color : undefined);
const percentOf = (w, of) => (of > 0 ? Math.round((100 * w) / of) : undefined);
// A font family is compared by the first family of its computed list, unquoted: the browser's default face of an input ("Arial") and a
// page stack that starts with it ("Arial, sans-serif") are one family.
const firstFamily = (value) => (value === undefined ? undefined : String(value).split(',')[0].trim().replace(/^["']|["']$/g, ''));
// text-align matters for a text element only in a block box; a field or control aligns its own content whatever its display.
const lookOf = (e, prop, type) => {
  if (prop === 'background') return knownBackground(e);
  if (prop === 'textAlign') return type === 'item' && !alignable(e) ? undefined : alignOf(e.style?.textAlign);
  return prop === 'fontFamily' ? firstFamily(e.style?.fontFamily) : e.style?.[prop];
};
const roleOf = (state) => {
  if (state.role === undefined || state.role === null) return null;
  if (typeof state.role !== 'string' || !state.role.trim()) throw new TypeError('role must be a non-empty string');
  return state.role.trim();
};
const originOf = (url) => { try { return new URL(url).origin; } catch { return null; } };
// A form's primary action as in the geometry detector: its last submit button, or its only button; its width is read relative to
// the form, whose width the form's fields carry (containerW). A form without such a field has an unknown width.
function primaryOf(state, form) {
  const buttons = (state.facts.controls ?? []).filter((c) => c.form === form && inspectable(c) && (c.tag === 'button' || c.tag === 'input'));
  const submits = buttons.filter((b) => b.type === 'submit' || (b.tag === 'button' && b.type == null));
  return [...(submits.length ? submits : buttons.length === 1 ? buttons : [])].sort((a, b) => a.rect.y - b.rect.y).at(-1) ?? null;
}
const formWidthOf = (state, form) => (state.facts.fields ?? []).find((f) => f.form === form && inspectable(f) && placed(f.rect) && f.containerW > 0)?.containerW;
// Interactive items: links, buttons, summaries, controls and items inside a control. They often mark the current or selected item by
// colour, background or weight (a current-page link through aria-current or a class that baseSig strips), so those are not compared.
const INTERACTIVE_TAGS = new Set(['a', 'button', 'summary']);
const STATE_MARKS = new Set(['color', 'background', 'fontWeight']);
const interactiveIn = (state) => {
  const sels = (state.facts.controls ?? []).map((c) => c.sel);
  return (e) => INTERACTIVE_TAGS.has(e.tag) || sels.some((s) => e.sel === s || e.sel.startsWith(`${s} > `));
};

// kind -> entries of one state: text items keyed as in `style`, text-like fields as in `property-outlier`, and primary actions. An
// interactive item keeps its family, size and alignment; its colour, background and weight are unknown, so it does not vote with them.
function pooledKinds(state) {
  const kinds = new Map(); const add = (key, entry) => kinds.set(key, [...(kinds.get(key) ?? []), entry]);
  const interactive = interactiveIn(state); let interactiveItems = 0;
  const valueOf = (e, p, type, of, unmarked) => (unmarked && STATE_MARKS.has(p) ? undefined : p === 'width' ? percentOf(e.rect.w, of) : lookOf(e, p, type));
  const entry = (e, type, name, of, unmarked = false) => ({ sel: e.sel, name, w: e.rect?.w, of,
    values: Object.fromEntries(POOLED_PROPS[type].map((p) => [p, valueOf(e, p, type, of, unmarked)])) });
  for (const e of state.facts.elements ?? []) {
    if (!repeatedItem(e)) continue;
    const unmarked = interactive(e); if (unmarked) interactiveItems += 1;
    add(`item|${groupKey(e)}`, entry(e, 'item', e.text, undefined, unmarked));
  }
  for (const f of state.facts.fields ?? []) {
    if (inspectable(f) && f.textLike && f.sig !== undefined && placed(f.rect)) add(`field|${f.tag}|${f.type}|${groupKey(f)}`, entry(f, 'field', f.name || f.id || f.placeholder || f.sel, f.containerW));
  }
  for (let form = 0; form < (state.facts.formCount ?? 0); form += 1) {
    const c = primaryOf(state, form); if (c) add(`primary|${groupKey(c)}`, entry(c, 'primary', c.name?.text || c.sel, formWidthOf(state, form)));
  }
  return { kinds, interactiveItems };
}
// A state votes with a value more than half of its items with a known value share; with no such value it is mixed and does not vote.
function stateVote(entries, prop) {
  const known = entries.filter((x) => x.values[prop] !== undefined); if (!known.length) return null;
  const m = majorityOf(known.map((x) => x.values[prop]));
  return m.share > 0.5 ? { value: m.value, sample: known.find((x) => x.values[prop] === m.value) } : { mixed: true };
}
const pooledSame = (prop, tol) => (prop !== 'width' ? (a, b) => a.value === b.value : (a, b) => Math.abs(a.value - b.value) <= tol.pct || Math.abs(a.sample.w - b.sample.w) <= tol.px);
const typeOf = (kind) => kind.slice(0, kind.indexOf('|'));
const SUBJECT = { item: 'items', field: 'fields', primary: 'primary actions' };
const describeValue = (prop, v, type) => (prop !== 'width' ? `${prop} ${v.value}`
  : `width ${v.value}% of their ${type === 'primary' ? 'form' : 'container'} (${v.sample.w} of ${v.sample.of}px)`);
const describeOdd = (prop, odd, type) => {
  const byValue = new Map(); for (const v of odd) byValue.set(v.value, [...(byValue.get(v.value) ?? []), v]);
  return [...byValue.values()].map((vs) => `${describeValue(prop, vs[0], type)} in ${vs.map((v) => v.state.label).join(', ')}`).join(' and ');
};
const distributionOf = (voters) => {
  const byValue = new Map(); for (const v of voters) byValue.set(v.value, [...(byValue.get(v.value) ?? []), v.state.label]);
  return [...byValue].map(([value, states]) => ({ value, states })).sort((a, b) => b.states.length - a.states.length);
};

function compareProps(rows, type, tol) {
  const votes = {};
  for (const prop of POOLED_PROPS[type]) {
    const cast = rows.map((r) => ({ state: r.state, vote: stateVote(r.entries, prop) }));
    const voters = cast.filter((c) => c.vote && !c.vote.mixed).map((c) => ({ state: c.state, value: c.vote.value, sample: c.vote.sample }));
    const mixed = cast.filter((c) => c.vote?.mixed).map((c) => c.state.label);
    if (voters.length < 2) { votes[prop] = { voters, mixed }; continue; }
    const same = pooledSame(prop, tol); const { top, n } = sharedValue(voters, same);
    votes[prop] = { voters, mixed, top, n, same, cluster: voters.filter((v) => same(v, top)), odd: voters.filter((v) => !same(v, top)) };
  }
  return votes;
}
// Look properties in which a state's vote differs from the kind: two or more make it a variant. A property counts only when that does not
// depend on capture order: the kind's most shared value is a clear majority and the state's value is another, or no other voting state
// holds the state's value. A tie (two against two) is no difference of either side.
const lookDifferences = (votes, state, isClear) => LOOK_PROPS.filter((p) => {
  const v = votes[p]; const mine = v?.top ? v.voters.find((x) => x.state === state) : undefined; if (!mine) return false;
  return (isClear(v) && !v.same(mine, v.top)) || !v.voters.some((x) => x !== mine && v.same(x, mine));
}).length;
const routeKey = (state) => routeOf(state.url) ?? state.url;
const labelsOf = (voters) => voters.map((x) => x.state.label);
// One pool per origin, viewport width and role; a state whose URL has no parseable origin is not pooled.
function poolsOf(states) {
  const pools = new Map(); let notPooled = 0;
  for (const s of states) {
    const role = roleOf(s); const origin = originOf(s.url);
    if (origin === null) { notPooled += 1; continue; }
    const viewport = s.facts?.viewport?.w ?? null; const key = `${origin}|${viewport}|${role ?? ''}`;
    if (!pools.has(key)) pools.set(key, { pool: { origin, viewport, role }, states: [] }); pools.get(key).states.push(s);
  }
  return { pools, notPooled };
}
// The outcome of one compared property with odd states: which odd states are a state change on a majority route, which are variants,
// which are named, and the reasons of its spread rows.
function oddOutcome(v, votes, { isClear, minRoutes, minVariantProps }) {
  const majorityRoutes = new Set(v.cluster.map((x) => routeKey(x.state))); const routes = majorityRoutes.size;
  const clear = isClear(v); const held = clear && routes >= minRoutes;
  const sameRoute = held ? v.odd.filter((x) => majorityRoutes.has(routeKey(x.state))) : [];
  const variants = held ? v.odd.filter((x) => !sameRoute.includes(x) && lookDifferences(votes, x.state, isClear) >= minVariantProps) : [];
  const named = held ? v.odd.filter((x) => !sameRoute.includes(x) && !variants.includes(x)) : [];
  const reasons = !clear ? ['no-clear-majority'] : routes < minRoutes ? ['majority-on-one-route']
    : [...(sameRoute.length ? ['state-change-on-route'] : []), ...(variants.length ? ['multi-property-variant'] : [])];
  return { routes, sameRoute, variants, named, reasons };
}

// Pools all captured states of one origin, viewport width and role (when the state carries one) and compares, for each kind seen in
// two or more of them, every look property, and for fields and primary actions their width relative to the form or container.
// A clear majority (a share of the voting states, from at least minAgree states on at least minRoutes routes) names the odd states in
// one pooled-outlier candidate. No clear majority, a majority from one route, an odd state whose own route also has a capture with the
// majority value (a validation error or a selected state of that page), or an odd state that differs in two or more look properties
// gives a spread row that lists the distribution without picking a side. Spread rows are not candidates.
export function pooledPropertySpread(states, { minStates = POOLED.minStates, majority = POOLED.majority, minAgree = POOLED.minAgree, minRoutes = POOLED.minRoutes,
  minVariantProps = POOLED.minVariantProps, widthTolerance = WIDTH_TOLERANCE } = {}) {
  const { pools, notPooled } = poolsOf(states);
  const thresholds = { majority, minAgree, minRoutes, minVariantProps };
  const coverage = { pools: pools.size, statesNotPooled: notPooled, kindsCompared: 0, kindsInOneState: 0, comparisons: 0, agreed: 0, outliers: 0, spread: 0, withoutVotes: 0,
    interactiveItems: 0 };
  const isClear = (v) => v.n / v.voters.length >= majority && v.n >= minAgree;
  const outliers = []; const spread = [];
  for (const [poolKey, { pool, states: members }] of pools) {
    const perKind = new Map();
    for (const state of members) {
      const { kinds, interactiveItems } = pooledKinds(state); coverage.interactiveItems += interactiveItems;
      for (const [kind, entries] of kinds) perKind.set(kind, [...(perKind.get(kind) ?? []), { state, entries }]);
    }
    for (const [kind, rows] of perKind) {
      if (rows.length < minStates) { coverage.kindsInOneState += 1; continue; }
      coverage.kindsCompared += 1;
      const type = typeOf(kind); const votes = compareProps(rows, type, widthTolerance);
      for (const prop of POOLED_PROPS[type]) {
        const v = votes[prop];
        if (!v.top) { coverage.withoutVotes += 1; continue; }
        coverage.comparisons += 1;
        if (!v.odd.length) { coverage.agreed += 1; continue; }
        const { routes, sameRoute, variants, named, reasons } = oddOutcome(v, votes, { isClear, minRoutes, minVariantProps });
        const [example] = v.voters;
        for (const reason of reasons) {
          spread.push({ pool, kind, subject: `${SUBJECT[type]} "${example.sample.name}"`, prop, reason, distribution: distributionOf(v.voters),
            variants: reason === 'multi-property-variant' ? labelsOf(variants) : [], sameRoute: reason === 'state-change-on-route' ? labelsOf(sameRoute) : [], mixed: v.mixed,
            example: { state: example.state.label, selector: example.sample.sel } });
        }
        if (!named.length) continue;
        coverage.outliers += 1;
        const what = `Pooled ${SUBJECT[type]} "${named[0].sample.name}" have ${describeOdd(prop, named, type)}; ${v.n} of ${v.voters.length} pooled states (on ${routes} routes) have `
          + `${describeValue(prop, v.top, type)}; a majority across captured states, not a design rule, so the odd state may be the intended one`;
        const basis = { pool, kind, prop, majority: { value: v.top.value, states: labelsOf(v.cluster), routes },
          odd: named.map((x) => ({ state: x.state.label, value: x.value, ...(prop === 'width' ? { px: x.sample.w, of: x.sample.of } : {}) })),
          variants: labelsOf(variants), sameRoute: labelsOf(sameRoute), mixed: v.mixed, voters: v.voters.length, thresholds };
        for (const x of named) outliers.push({ detector: 'pooled-outlier', key: `pooled|${poolKey}|${kind}|${prop}`, severity: 'low', confidence: 'low', what, evidence: evidence(x.state, x.sample.sel), basis });
      }
    }
  }
  coverage.spread = spread.length;
  return { outliers, spread, coverage };
}

// Form fonts. Members of one form are located through facts only: its text-like fields (their own text), the option lists of its
// selects (size only), its controls whose text the control itself draws (an input's value or native name, or a button holding its
// own text), and the elements whose own text equals the label or help text of fields of that form alone. Every field names its texts,
// a field in no form or not shown (disabled, inactive, off the page) as "outside": a text named by fields of several forms or outside
// one, or carried by more rendered elements than fields name it, is ambiguous. Ambiguous texts and a label or help text with text in a
// child element are counted, not compared. Icon glyphs (the glyph facts, or a control text without a letter or digit) and text in a
// generic monospace family are left out.
const MONO_GENERICS = new Set(['monospace', 'ui-monospace']);
const monospace = (family) => String(family ?? '').split(',').some((f) => MONO_GENERICS.has(f.trim().replace(/^["']|["']$/g, '').toLowerCase()));
const ALNUM = /[\p{L}\p{N}]/u;
const LABEL_SOURCES = new Set(['label-for', 'label-wrap']);
const OWN_TEXT_SOURCES = new Set(['value', 'native-default']);
const FORM_ROLES = ['label', 'field', 'control', 'option', 'help'];
const ROLE_NAME = { label: 'label', field: 'field', control: 'control', option: 'options', help: 'help text' };
// Sizes are compared within one role and sub-kind: a label's sub-kind is its field's (text for inputs that take text, selects and
// textareas; else the field's type, such as checkbox); a control is a link, a submit button (a button without a type submits) or
// another button.
const SIZE_GROUP = { 'label:text': 'text-field labels', 'label:mixed': 'labels', 'field:field': 'fields', 'option:option': 'option lists', 'help:help': 'help texts',
  'control:submit': 'submit buttons', 'control:button': 'buttons', 'control:link': 'links' };
const groupName = (group) => SIZE_GROUP[group] ?? `${group.slice(group.indexOf(':') + 1)} labels`;
const fieldKind = (f) => (f.textLike ? 'text' : String(f.type ?? f.tag));
const controlKind = (c) => {
  if (c.tag === 'a') return 'link';
  const type = String(c.type ?? '').toLowerCase();
  if (c.tag === 'button') return type === 'button' || type === 'reset' ? 'button' : 'submit';
  return c.tag === 'input' && (type === 'submit' || type === 'image') ? 'submit' : 'button';
};
const OUTSIDE = 'outside';

const isLiveField = (f) => inspectable(f) && placed(f.rect) && f.form >= 0;
// element -> [role, owner, count] or null. owner: the owners naming its text (a live field's form, or OUTSIDE), the sub-kinds of the live
// fields naming it and how many fields do; count: how many rendered elements carry the text where it would be located (label elements for
// a label text, any element for a reference or a hint).
function textLocator(fields, shown) {
  const owners = (pick) => fields.reduce((m, f) => {
    const t = pick(f); if (!t) return m;
    const prev = m.get(t) ?? { owners: new Set(), kinds: new Set(), claims: 0 };
    const live = isLiveField(f);
    return m.set(t, { owners: new Set([...prev.owners, live ? f.form : OUTSIDE]), kinds: live ? new Set([...prev.kinds, fieldKind(f)]) : prev.kinds, claims: prev.claims + 1 });
  }, new Map());
  const byLabel = owners((f) => (LABEL_SOURCES.has(f.label?.source) ? f.label.text : null));
  const byReference = owners((f) => (f.label?.source === 'aria-labelledby' ? f.label.text : null));
  const byHint = owners((f) => f.hint ?? null);
  const counted = (pick) => shown.reduce((m, e) => (pick(e) ? m.set(e.text, (m.get(e.text) ?? 0) + 1) : m), new Map());
  const asLabel = (e) => e.tag === 'label' && byLabel.has(e.text);
  const counts = { label: counted(asLabel), reference: counted((e) => byReference.has(e.text)), hint: counted((e) => byHint.has(e.text)) };
  return (e) => (asLabel(e) ? ['label', byLabel.get(e.text), counts.label] : byReference.has(e.text) ? ['label', byReference.get(e.text), counts.reference]
    : byHint.has(e.text) ? ['help', byHint.get(e.text), counts.hint] : null);
}

function formMembers(state) {
  const { elements = [], fields = [], controls = [] } = state.facts;
  const cov = { members: Object.fromEntries(FORM_ROLES.map((r) => [r, 0])), excluded: { glyph: 0, monospace: 0 }, notLocated: { label: 0, help: 0, control: 0 }, ambiguous: 0 };
  const live = fields.filter(isLiveField); const shown = elements.filter(comparable); const locate = textLocator(fields, shown);
  const members = []; const seen = new Set(); const located = { label: new Set(), help: new Set() };
  const take = (role, kind, form, sel, text, style, glyph) => {
    if (seen.has(sel)) return; seen.add(sel);
    const why = glyph ? 'glyph' : monospace(style?.fontFamily) ? 'monospace' : null;
    if (why) { cov.excluded[why] += 1; return; }
    cov.members[role] += 1; members.push({ role, kind, form, sel, text, fontFamily: firstFamily(style?.fontFamily), fontSize: style?.fontSize });
  };
  for (const e of shown) {
    const found = locate(e); if (!found) continue;
    const [role, owner, count] = found;
    located[role].add(e.text);
    if (owner.owners.size > 1 || count.get(e.text) > owner.claims) { cov.ambiguous += 1; continue; }
    const [form] = owner.owners; if (form === OUTSIDE) continue;
    const kind = role === 'help' ? 'help' : owner.kinds.size === 1 ? [...owner.kinds][0] : 'mixed';
    take(role, kind, form, e.sel, e.text, e.style, Boolean(e.glyph));
  }
  for (const f of live) {
    if (LABEL_SOURCES.has(f.label?.source) || f.label?.source === 'aria-labelledby') cov.notLocated.label += f.label.text && !located.label.has(f.label.text) ? 1 : 0;
    if (f.hint && !located.help.has(f.hint)) cov.notLocated.help += 1;
    const name = f.name || f.id || f.label?.text || f.sel;
    if (f.textLike) take('field', 'field', f.form, f.sel, name, f.style, false);
    const sizes = majorityOf((f.options ?? []).map((o) => o.fontSize));
    if (f.tag === 'select' && sizes.share > 0.5) {
      cov.members.option += 1; members.push({ role: 'option', kind: 'option', form: f.form, sel: `${f.sel} option`, text: `${name} options`, fontSize: sizes.value });
    }
  }
  const firstBySel = new Map(); for (const e of elements) if (!firstBySel.has(e.sel)) firstBySel.set(e.sel, e);
  for (const c of controls) {
    if (!inspectable(c) || !(c.form >= 0)) continue;
    const text = c.name?.text ?? '';
    if (OWN_TEXT_SOURCES.has(c.name?.source)) take('control', controlKind(c), c.form, c.sel, text, c.style, !ALNUM.test(text));
    else if (c.name?.source === 'text') {
      const own = firstBySel.get(c.sel);
      if (own) take('control', controlKind(c), c.form, c.sel, text, own.style, Boolean(own.glyph) || !ALNUM.test(text)); else cov.notLocated.control += 1;
    }
  }
  return { members, cov };
}

// A dominant family must be shared by members of at least minDominantRoles roles: one held by a single role (all fields left in the
// browser's default face) is that role's convention, not the form's.
function formFontAnalysis(state, { minMembers = 4, dominant = 0.75, minDominantRoles = 2 } = {}) {
  const { members, cov } = formMembers(state);
  const forms = new Map(); for (const m of members) forms.set(m.form, [...(forms.get(m.form) ?? []), m]);
  const coverage = { forms: forms.size, familyCompared: 0, sizeCompared: 0, ...cov, roleConvention: 0, singleRoleFamily: 0 };
  const thresholds = { minMembers, dominant, minDominantRoles }; const out = [];
  const rolesOf = (group, prop, value) => FORM_ROLES.filter((r) => group.some((x) => x.role === r && x[prop] === value));
  const flag = (form, odd, prop, group, scope) => {
    const top = majorityOf(group.map((x) => x[prop])).value; const n = group.filter((x) => x[prop] === top).length;
    out.push({ detector: 'form-font', key: `form-font|${odd.sel}|${prop}|${odd[prop]}`, severity: 'low', confidence: 'low',
      what: `Form text "${odd.text}" (${ROLE_NAME[odd.role]}) has ${prop} ${odd[prop]}; ${n} of ${group.length} ${scope === 'form' ? 'text-bearing members' : groupName(scope)} of its form have ${top}; `
        + 'icon glyphs and monospace text are not compared; low confidence: a designed face for one element is a legitimate dismissal; membership is inferred from saved text and counts, not exact DOM ownership',
      evidence: evidence(state, odd.sel), basis: { form, role: odd.role, prop, value: odd[prop], scope, dominant: { value: top, members: n, of: group.length, roles: rolesOf(group, prop, top) }, thresholds } });
  };
  const odds = (group, prop) => { const m = majorityOf(group.map((x) => x[prop])); return m.share >= dominant ? group.filter((x) => x[prop] !== m.value) : []; };
  for (const [form, list] of forms) {
    // Family across the whole form; an odd family shared by every member of its role (two or more) is that role's convention.
    const family = list.filter((m) => m.fontFamily !== undefined);
    if (family.length >= minMembers) {
      coverage.familyCompared += 1;
      const spans = rolesOf(family, 'fontFamily', majorityOf(family.map((x) => x.fontFamily)).value).length >= minDominantRoles;
      if (!spans && odds(family, 'fontFamily').length) coverage.singleRoleFamily += 1;
      for (const odd of spans ? odds(family, 'fontFamily') : []) {
        const role = family.filter((x) => x.role === odd.role);
        if (role.length >= 2 && role.every((x) => x.fontFamily === odd.fontFamily)) coverage.roleConvention += 1; else flag(form, odd, 'fontFamily', family, 'form');
      }
    }
    // Size within one role and sub-kind only: labels, fields, help texts and controls legitimately differ from each other in size, and so
    // do submit buttons, other buttons and links, and the labels of text fields and of choices. Groups go in role order, then by name.
    const sized = new Map(); for (const m of list) if (m.fontSize !== undefined) sized.set(`${m.role}:${m.kind}`, [...(sized.get(`${m.role}:${m.kind}`) ?? []), m]);
    const roleRank = (g) => FORM_ROLES.indexOf(g.slice(0, g.indexOf(':')));
    for (const [scope, group] of [...sized].sort(([a], [b]) => roleRank(a) - roleRank(b) || (a < b ? -1 : a > b ? 1 : 0))) {
      if (group.length < minMembers) continue;
      coverage.sizeCompared += 1;
      for (const odd of odds(group, 'fontSize')) flag(form, odd, 'fontSize', group, scope);
    }
  }
  return { out, coverage };
}
export const formFontOutlier = (state, opts) => formFontAnalysis(state, opts).out;
export const formFontCoverage = (state, opts) => formFontAnalysis(state, opts).coverage;

// Sibling colours. Look-alike items of one state (keyed as in `style`, short text, rendered and active) that are not interactive
// (links, buttons, summaries, controls and items inside a control often mark the current or selected item by colour) and not glyphs
// (rating stars, separators). In a group with minGroup or more known values, an item whose colour or background is its own (shared
// with fewer than minCluster items: a value shared by two or more is a pattern or second variant) while at least `share` of the other
// items agree on another value is a candidate, unless it also differs from them in another look property (a designed state).
const siblingValue = (e, prop) => (prop === 'background' ? knownBackground(e) : e.style?.color);
const SIBLING_LOOK = ['color', 'background', 'fontWeight', 'fontFamily', 'fontSize', 'textAlign'];
const siblingLook = (e, prop) => (prop === 'color' || prop === 'background' ? siblingValue(e, prop) : lookOf(e, prop, 'item'));
const siblingDifferences = (m, others) => SIBLING_LOOK.filter((p) => {
  const mine = siblingLook(m, p); const theirs = others.map((e) => siblingLook(e, p)).filter((v) => v !== undefined);
  return mine !== undefined && theirs.length > 0 && mine !== majorityOf(theirs).value;
}).length;

function siblingAnalysis(state, { minGroup = 4, share = 0.75, minCluster = 2, minVariantProps = 2 } = {}) {
  const interactive = interactiveIn(state);
  const coverage = { groupsCompared: 0, groupsSmall: 0, interactive: 0, glyph: 0, backgroundUnknown: 0 };
  const groups = new Map();
  for (const e of state.facts.elements ?? []) {
    if (!comparable(e) || SKIP_TAGS.has(e.tag) || e.text.length > MAX_ITEM_TEXT) continue;
    if (interactive(e)) { coverage.interactive += 1; continue; }
    if (e.glyph) { coverage.glyph += 1; continue; }
    const key = groupKey(e); groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const thresholds = { minGroup, share, minCluster, minVariantProps }; const out = [];
  for (const [kind, all] of groups) {
    if (all.length < 2) continue;
    coverage.backgroundUnknown += all.filter((e) => knownBackground(e) === undefined).length;
    let compared = false;
    for (const prop of ['color', 'background']) {
      const known = all.filter((e) => siblingValue(e, prop) !== undefined); if (known.length < minGroup) continue;
      compared = true;
      for (const m of known) {
        const value = siblingValue(m, prop);
        if (known.filter((e) => siblingValue(e, prop) === value).length >= minCluster) continue;
        const others = known.filter((e) => e !== m); const dom = majorityOf(others.map((e) => siblingValue(e, prop)));
        if (dom.share < share || siblingDifferences(m, others) >= minVariantProps) continue;
        const n = others.filter((e) => siblingValue(e, prop) === dom.value).length;
        const sameText = others.filter((e) => e.text === m.text && siblingValue(e, prop) === dom.value).length;
        out.push({ detector: 'sibling-color', key: `sibling-color|${kind}|${prop}|${value}`, severity: 'low', confidence: 'low',
          what: `Look-alike item "${m.text}" has ${prop} ${value}; ${n} of ${others.length} other items of its kind in this state have ${dom.value}, `
            + `${sameText ? sameText : 'none'} of them with the same text; low confidence: a status colour or a designed state is a legitimate dismissal`,
          evidence: evidence(state, m.sel), basis: { kind, prop, value, dominant: { value: dom.value, members: n, of: others.length }, group: known.length,
            sameTextWithDominant: sameText, thresholds } });
      }
    }
    if (compared) coverage.groupsCompared += 1; else coverage.groupsSmall += 1;
  }
  return { out, coverage };
}
export const siblingColorDrift = (state, opts) => siblingAnalysis(state, opts).out;
export const siblingColorCoverage = (state, opts) => siblingAnalysis(state, opts).coverage;
