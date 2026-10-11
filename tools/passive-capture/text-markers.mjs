// Offline text-marker candidates over already captured facts. Convention-based and never a norm: a programming example,
// a mathematical discussion or an intentionally shown empty value can legitimately match, so every row is a candidate
// for triage. It reads only active, non-disabled element text, control names, field labels and placeholders — no other
// attribute, value, network body or file — and copies no surrounding text into its message or key. No candidate is not a
// check of all text: truncated facts and uncaptured states remain limits.
const evidence = (state, sel) => ({ state: state.label, url: state.url, selector: sel, shot: `passive/${state.label}.png`, facts: `passive/${state.label}.facts.json` });

export const TEXT_MARKER_WHAT = 'Potential rendered serialization/placeholder marker; convention-based candidate, inspect context.';

// A token needs a string edge or a character that is not a Unicode letter, number or underscore on each side.
const token = (word) => new RegExp(`(?<![\\p{L}\\p{N}_])${word}(?![\\p{L}\\p{N}_])`, 'u');
const MARKERS = [
  { kind: 'object-object', re: /\[object Object\]/u },
  { kind: 'invalid-date', re: /Invalid Date/u },
  { kind: 'undefined', re: token('undefined') },
  { kind: 'null', re: token('null') },
  { kind: 'NaN', re: token('NaN') },
];

const active = (item) => !item.inactive && !item.disabled;

function channels(facts) {
  const out = [];
  for (const e of facts.elements ?? []) if (active(e)) out.push({ channel: 'text', sel: e.sel, value: e.text });
  for (const c of facts.controls ?? []) if (active(c) && c.name?.source !== 'none') out.push({ channel: 'control-name', sel: c.sel, value: c.name?.text });
  for (const f of facts.fields ?? []) {
    if (!active(f)) continue;
    if (f.label?.source !== 'none') out.push({ channel: 'field-label', sel: f.sel, value: f.label?.text });
    if (f.placeholder) out.push({ channel: 'placeholder', sel: f.sel, value: f.placeholder });
  }
  return out;
}

export function textHygieneCandidates(state) {
  const seen = new Set(); const out = [];
  for (const { channel, sel, value } of channels(state.facts ?? {})) {
    const t = String(value ?? '');
    for (const m of MARKERS) {
      if (!m.re.test(t)) continue;
      const key = `text-marker|${m.kind}|${state.label}|${sel}|${channel}`;
      if (seen.has(key)) continue; seen.add(key);
      out.push({ detector: 'text-hygiene', key, severity: 'low', confidence: 'low',
        what: `${TEXT_MARKER_WHAT} Marker: ${m.kind}; channel: ${channel}.`, evidence: evidence(state, sel) });
    }
  }
  return out;
}
