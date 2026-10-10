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

// Computed fallback, used only when axe did not run for the state. Only rgb()/rgba() foreground on a solid rgb
// background is assessed; image, translucent and unsupported colours stay unassessed and are counted, never guessed.
const contrastInput = (e) => {
  if (e.inactive || e.disabled) return { skip: true };
  if (e.bg?.kind === 'image') return { reason: 'image' };
  if (e.bg?.kind === 'translucent') return { reason: 'translucent' };
  if (e.bg?.kind !== 'solid') return { reason: 'unsupported_colour' };
  const fg = parseColor(e.style.color); const bg = parseColor(e.bg.color);
  return fg && bg ? { fg, bg } : { reason: 'unsupported_colour' };
};

export function computedContrast(state) {
  if (state.axe?.available) return [];
  const out = [];
  for (const e of state.facts.elements) {
    const { fg, bg } = contrastInput(e); if (!fg) continue;
    const ratio = contrastRatio(fg, bg); const needed = isLargeText(e.style) ? 3 : 4.5;
    if (ratio >= needed) continue;
    out.push({ detector: 'contrast', key: `contrast|${e.style.color}|${e.bg.color}|${needed}`, severity: 'medium', confidence: e.bg.assumed ? 'low' : 'medium',
      what: `Text "${e.text.slice(0, 50)}" has contrast ${ratio.toFixed(2)}:1 (${e.style.color} on ${e.bg.color}${e.bg.assumed ? ', page background assumed white' : ''}), needs ${needed}:1`,
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
