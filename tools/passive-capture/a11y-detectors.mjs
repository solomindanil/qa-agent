// Offline accessibility detectors over captured facts and optional axe results. Candidates only, never verdicts.
// axe rows are a separate stream: our inactive-context policy does not filter them.
const evidence = (state, sel) => ({ state: state.label, url: state.url, selector: sel, shot: `passive/${state.label}.png`, facts: `passive/${state.label}.facts.json` });
const OWN_RULES = new Set(['label', 'button-name', 'select-name', 'input-button-name', 'link-name']);

export function parseColor(value) {
  const m = /^rgba?\(([^)]+)\)$/.exec((value || '').trim()); if (!m) return null;
  const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (v.length < 3 || v.some(Number.isNaN)) return null;
  return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 };
}
const channel = (x) => { const c = x / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminance = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
export function contrastRatio(fg, bg) {
  const over = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
  const [hi, lo] = [luminance(over), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}
const isLargeText = (style) => { const size = Number.parseFloat(style.fontSize); return size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700); };

// A separator glyph (dot, bullet, slash, bar, dash, multiplication sign or cross) placed between text runs is incidental decoration
// (WCAG 1.4.3). It stays assessed when it is the whole visible text of a control or table cell (a close button, a dash meaning
// "not included") or has no text beside it. Units and currency signs are text, never separators. Older captures lack the facts.
const SEPARATOR = /^[\p{Pd}\u00B7\u2022\u2219\u22C5\u25E6|/\\\u00D7\u2715\u2716]{1,2}$/u;
const decorativeGlyph = (e) => e.glyph?.peers === true && e.glyph.whole === false && SEPARATOR.test(e.text.trim());

// Computed fallback, used only when axe did not run for the state. Only rgb()/rgba() foreground on a solid rgb background is
// assessed; image backgrounds, image or gradient layers under the text that are not its ancestors (a sibling photo, video or
// overlay), translucent or faded backgrounds, separator glyphs and unsupported colours stay unassessed and are counted, never
// guessed. Ancestor opacity below 1 fades the text into its background. Text under an opacity-0 ancestor is not rendered at
// capture: its pair is compared as authored and the row says so.
const contrastInput = (e) => {
  if (e.inactive || e.disabled) return { skip: true };
  if (decorativeGlyph(e)) return { reason: 'decorative_glyph' };
  if (e.bg?.kind === 'image') return { reason: 'image' };
  if (e.bg?.kind === 'layer') return { reason: 'layer' };
  if (e.bg?.kind === 'translucent') return { reason: 'translucent' };
  if (e.bg?.kind !== 'solid') return { reason: 'unsupported_colour' };
  const fg = parseColor(e.style.color); const bg = parseColor(e.bg.color);
  if (!fg || !bg) return { reason: 'unsupported_colour' };
  const opacity = e.opacity ?? 1;
  if (opacity === 0) return { fg, bg, hidden: true };
  if ((e.bg.opacity ?? 1) < 1) return { reason: 'translucent' };
  return { fg: { ...fg, a: fg.a * opacity }, bg, opacity };
};
const letters = (t) => (t.match(/\p{L}/gu) ?? []).length;
const onScreen = (r, vw) => vw === undefined || (r.x < vw && r.x + r.w > 0);
const HIDDEN_NOTE = '; not rendered at capture (an ancestor has opacity 0), so the screenshot does not show it: the pair applies once it is shown';

// One row per colour pair and threshold. A repeated copy of the same text with the same pair in a state (a loop or marquee clone)
// adds no evidence. Each candidate is ranked so the row's headline and first evidence are rendered, on screen and word-like.
export function computedContrast(state) {
  if (state.axe?.available) return [];
  const out = []; const seen = new Set(); const vw = state.facts.viewport?.w;
  for (const e of state.facts.elements) {
    const { fg, bg, hidden, opacity = 1 } = contrastInput(e); if (!fg) continue;
    const ratio = contrastRatio(fg, bg); const needed = isLargeText(e.style) ? 3 : 4.5;
    if (ratio >= needed) continue;
    const key = `contrast|${e.style.color}|${e.bg.color}|${needed}${hidden ? '|not-rendered' : opacity < 1 ? `|o${opacity}` : ''}`;
    if (seen.has(`${key}|${e.text}`)) continue; seen.add(`${key}|${e.text}`);
    out.push({ detector: 'contrast', key, rank: [hidden ? 0 : 1, onScreen(e.rect, vw) ? 1 : 0, letters(e.text)], severity: 'medium',
      confidence: hidden || e.bg.assumed ? 'low' : 'medium',
      what: `Text "${e.text.slice(0, 50)}" has contrast ${ratio.toFixed(2)}:1 (${e.style.color}${opacity < 1 ? ` at opacity ${opacity}` : ''} on ${e.bg.color}`
        + `${e.bg.assumed ? ', page background assumed white' : ''}), needs ${needed}:1${hidden ? HIDDEN_NOTE : ''}`,
      evidence: evidence(state, e.sel) });
  }
  return out;
}

// What the computed fallback could and could not assess for one state (axe mode reports nothing here).
export function contrastCoverage(state) {
  if (state.axe?.available) return { mode: 'axe' };
  let assessed = 0; const unassessed = {};
  for (const e of state.facts.elements) {
    const r = contrastInput(e); if (r.skip) continue;
    if (r.fg) assessed += 1; else unassessed[r.reason] = (unassessed[r.reason] ?? 0) + 1;
  }
  return { mode: 'computed', assessed, unassessed };
}

export function axeCandidates(state) {
  if (!state.axe?.available) return [];
  const out = [];
  for (const v of state.axe.violations) {
    if (OWN_RULES.has(v.id)) continue;
    for (const n of v.nodes) {
      const d = n.contrast ?? {};
      const what = v.id === 'color-contrast' && d.contrastRatio
        ? `Contrast ${d.contrastRatio}:1 (${d.fgColor} on ${d.bgColor}), needs ${d.expectedContrastRatio}`
        : `${v.id}: ${v.help}`;
      out.push({ detector: v.id === 'color-contrast' ? 'contrast' : 'axe',
        key: v.id === 'color-contrast' ? `contrast|${d.fgColor}|${d.bgColor}|${d.expectedContrastRatio}` : `axe|${v.id}|${n.target}`,
        severity: v.id === 'color-contrast' || ['serious', 'critical'].includes(v.impact) ? 'medium' : 'low', confidence: 'high', what, evidence: evidence(state, n.target) });
    }
  }
  return out;
}

export function nameCandidates(state) {
  const out = [];
  for (const c of state.facts.controls) {
    if (c.inactive || c.name?.source !== 'none') continue;
    out.push({ detector: 'a11y-name', key: `noname|${c.sig}|${c.sel}`, severity: 'medium', confidence: 'high',
      what: `${c.tag}${c.type ? `[type=${c.type}]` : ''} control has no accessible name (no text, aria-label, labelledby, title or alt)`, evidence: evidence(state, c.sel) });
  }
  for (const f of state.facts.fields) {
    if (f.inactive || f.disabled || f.label?.source !== 'none') continue;
    const placeholderOnly = Boolean(f.placeholder?.trim());
    out.push({ detector: 'a11y-name', key: `nolabel|${f.sel}`, severity: 'medium', confidence: 'high',
      what: placeholderOnly ? `Field ${f.name || f.id || f.sel} is identified only by its placeholder "${f.placeholder}"; it has no label once filled`
        : `Field ${f.name || f.id || f.sel} has no label or accessible name`, evidence: evidence(state, f.sel) });
  }
  return out;
}

// Structure detectors (focus, choice grouping, images) over attribute and box facts only: no key is pressed, so the actual
// Tab sequence stays unassessed. Captures made before these facts existed have no lists; detect.mjs reports them as absent.
const inSequence = (f) => !f.inactive && !f.disabled;

export function positiveTabindexCandidates(state) {
  return (state.facts.focusables ?? []).filter((f) => inSequence(f) && f.tabindex > 0).map((f) => ({ detector: 'positive-tabindex',
    key: `tabindex|${f.sel}|${f.tabindex}`, severity: 'low', confidence: 'medium',
    what: `${f.tag} has tabindex=${f.tabindex}; a positive value overrides the document focus order (convention; check whether intended). Attribute only, no key was pressed`, evidence: evidence(state, f.sel) }));
}

export function ungroupedChoiceCandidates(state) {
  return (state.facts.choiceGroups ?? []).filter((g) => !g.inactive && !g.disabled && g.count > 1 && g.nameSource === 'none').map((g) => ({
    detector: 'ungrouped-choice', key: `choice|${g.type}|${g.name}|${g.sel}`, severity: 'low', confidence: 'medium',
    what: `${g.count} ${g.type} inputs named "${g.name}" share a name but have no group name, so the group question may not be announced: no fieldset with a legend and no role=group or radiogroup with an accessible name${g.container ? ` (the enclosing ${g.container} has none)` : ''}`,
    evidence: evidence(state, g.sel) }));
}

const DECORATIVE_ROLES = new Set(['presentation', 'none']);
export function imgAltCandidates(state) {
  if (state.axe?.available) return [];
  return (state.facts.images ?? []).filter((i) => !i.inactive && i.alt === 'absent' && !i.ariaHidden && !DECORATIVE_ROLES.has(i.role) && i.nameSource === 'none')
    .map((i) => ({ detector: 'img-alt-missing', key: `img-alt|${i.sel}`, severity: 'medium', confidence: 'high',
      what: 'Image has no alt attribute and no aria-label, aria-labelledby or title, and is not marked decorative (alt="", role=presentation/none, aria-hidden); axe did not run for this state',
      evidence: evidence(state, i.sel) }));
}

const EDGE_PX = 4;
const placed = (r) => r.w > 1 && r.h > 1 && r.x + r.w > 0 && r.y + r.h > 0;
const sameLine = (a, b) => Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) >= Math.min(a.h, b.h) / 2;
const overlapX = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > EDGE_PX;
// Where the later element b is displayed relative to the earlier a when that contradicts reading order, else null.
// A new column starting higher up does not overlap a horizontally, so it is not read as "above".
function displacement(a, b) {
  const [ra, rb] = [a.rect, b.rect];
  if (sameLine(ra, rb)) {
    if (a.dir !== b.dir) return null;
    const before = a.dir === 'rtl' ? rb.x >= ra.x + ra.w - EDGE_PX : rb.x + rb.w <= ra.x + EDGE_PX;
    return before ? `before it on the same line (${a.dir})` : null;
  }
  return rb.y + rb.h <= ra.y + EDGE_PX && overlapX(ra, rb) ? 'above it' : null;
}

// One candidate per run of consecutive out-of-order steps in the default sequence (tabindex absent or 0, placed box). Steps are taken
// within one layer: the document flow, or one fixed or sticky layer (a floating button, a sticky header, a native modal), whose boxes
// at scroll 0 have no place among the document's. Layers keep DOM order among themselves.
const layerOf = (f) => f.pinned?.root ?? '';
export function focusOrderCandidates(state) {
  const seq = (state.facts.focusables ?? []).filter((f) => inSequence(f) && (f.tabindex ?? 0) === 0 && placed(f.rect));
  const layers = new Map(); for (const f of seq) { if (!layers.has(layerOf(f))) layers.set(layerOf(f), []); layers.get(layerOf(f)).push(f); }
  return [...layers.values()].flatMap((layer) => runsOf(state, layer));
}
function runsOf(state, seq) {
  const steps = seq.slice(1).map((b, i) => displacement(seq[i], b));
  const out = [];
  steps.forEach((where, i) => {
    if (!where || steps[i - 1]) return;
    let end = i; while (steps[end + 1]) end += 1;
    const [a, b] = [seq[i], seq[i + 1]]; const n = end - i + 1;
    out.push({ detector: 'focus-order', key: `focus-order|${a.sel}|${b.sel}`, severity: 'low', confidence: 'low',
      what: `Focus order may differ from visual order: ${b.tag} follows ${a.tag} ${a.sel} in the DOM but is displayed ${where}${n > 1 ? ` (${n} consecutive steps)` : ''}; DOM and layout comparison only, no key was pressed`,
      evidence: evidence(state, b.sel) });
  });
  return out;
}
