// Offline wording candidates over captured facts: a rare spelling variant of a frequent word, and a field label or placeholder
// that names another field of the same form or nearly spells the field's own name or id. Deterministic. Rare words are compared
// only when the caller supplies a word list (one word per line) that fits the captured text: a rare word the list knows, or a
// regular inflection of a listed word or of a frequent captured word, is not a candidate, nor is a word capitalised only
// mid-sentence (a name). Without a list, or with one that knows under half of the distinct captured words (another language, a
// degenerate file), the rare-variant family is unassessed. This is not a spell check: a word misspelt the same way twice or more, a misspelling that
// is another real word, a word without a frequent close variant and text that was not captured stay unchecked. Labels are
// compared with name and id attributes, never with the list. Every row is a candidate for triage.
import { readFile } from 'node:fs/promises';

const evidence = (state, sel) => ({ state: state.label, url: state.url, selector: sel, shot: `passive/${state.label}.png`, facts: `passive/${state.label}.facts.json` });
const active = (item) => !item.inactive && !item.disabled;
const len = (w) => [...w].length;

const MIN_WORD = 4;
const MIN_NAME_WORD = 3;
const LONG_WORD = 6;
const TEXT_CAP = 160;

const EDGE = /^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu;
const PLAIN = /^[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*$/u;
const CAMEL = /\p{Ll}\p{Lu}/u;
const SENTENCE_END = /[.!?:…]$/u;
const TITLE = /^[\p{Lu}\p{Lt}][\p{Ll}\p{M}]*\p{Ll}[\p{Ll}\p{M}]*$/u;
const LOWER = /^\p{Ll}/u;
// Words of one string with their case evidence. A chunk holding a digit, underscore, dot, slash, @ or another inner symbol is a
// number, identifier, key, address or URL and is skipped whole, as is camelCase; inner apostrophes and hyphens split words. A word
// is a name use when it is capitalised (Title case, not all capitals) in a sentence-case string (one that also has a word starting
// in lowercase) and is neither the string's first word nor the first after . ! ? : or …; a lower use starts in lowercase.
function tokensOf(text) {
  const chunks = String(text ?? '').normalize('NFC').split(/\s+/u).filter(Boolean);
  const cores = chunks.map((chunk) => chunk.replace(EDGE, ''));
  const sentenceCase = cores.some((core) => LOWER.test(core));
  return cores.flatMap((core, i) => {
    if (!PLAIN.test(core) || CAMEL.test(core)) return [];
    const initial = i === 0 || SENTENCE_END.test(chunks[i - 1]);
    return core.split(/['’-]/u).map((piece, k) => ({ word: piece.toLowerCase(), lower: LOWER.test(piece),
      name: sentenceCase && TITLE.test(piece) && !(initial && k === 0) }));
  });
}
// Case-folded words of one string, composed (NFC).
export const wordsOf = (text) => tokensOf(text).map((t) => t.word);

// A caller-supplied word list: one word per line (lines end at LF, CRLF or CR), case-folded and composed; blank lines and edge spaces
// are ignored. A line holding more than one word is an error (a space-separated list would otherwise load as one word), and so is an
// empty list, because it would make every rare word unknown.
export async function loadDictionary(path) {
  const lines = (await readFile(path, 'utf8')).split(/\r\n|\r|\n/u).map((line) => line.trim().normalize('NFC').toLowerCase());
  const crowded = lines.findIndex((line) => /\s/u.test(line));
  if (crowded >= 0) throw new Error(`dictionary ${path} line ${crowded + 1} holds more than one word; one word per line is expected`);
  const words = new Set(lines.filter(Boolean));
  if (!words.size) throw new Error(`dictionary ${path} has no words`);
  return words;
}

// Bases a word may be a regular English inflection of: plural or third person (-s, -es, -ies), past (-ed, -d, -ied, a doubled
// consonant), -ing (also with -e dropped or a doubled consonant), -er and -ers, -ly and -ily. Conservative: no other derivation,
// and a base under 3 letters is dropped. A misspelt inflection of a known word (returnes) is therefore not found.
const MIN_BASE = 3;
const DOUBLED = /(\p{L})\1$/u;
export function inflectionBases(word) {
  const out = []; const add = (b) => { if (len(b) >= MIN_BASE && !out.includes(b)) out.push(b); };
  const stem = (suffix) => (word.endsWith(suffix) ? word.slice(0, -suffix.length) : null);
  const undouble = (b) => { if (b !== null && DOUBLED.test(b)) add(b.slice(0, -1)); };
  if (stem('s') !== null && !word.endsWith('ss')) add(stem('s'));
  if (stem('es') !== null) add(stem('es'));
  if (stem('ies') !== null) add(`${stem('ies')}y`);
  if (stem('ed') !== null) { add(stem('ed')); add(stem('d')); undouble(stem('ed')); }
  if (stem('ied') !== null) add(`${stem('ied')}y`);
  if (stem('ing') !== null) { add(stem('ing')); add(`${stem('ing')}e`); undouble(stem('ing')); }
  if (stem('ers') !== null) { add(stem('ers')); add(stem('rs')); }
  if (stem('er') !== null) { add(stem('er')); add(stem('r')); }
  if (stem('ily') !== null) add(`${stem('ily')}y`);
  if (stem('ly') !== null) add(stem('ly'));
  return out;
}

// Optimal string alignment distance on code points: insertions, deletions, substitutions and adjacent transpositions. With a
// bound it stops at the first row whose every cell exceeds the bound (row minima never decrease) and returns bound + 1.
export function editDistance(a, b, bound = Infinity) {
  const s = [...a]; const t = [...b];
  const d = [Array.from({ length: t.length + 1 }, (_, j) => j)];
  for (let i = 1; i <= s.length; i += 1) {
    d[i] = [i];
    for (let j = 1; j <= t.length; j += 1) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    if (Math.min(...d[i]) > bound) return bound + 1;
  }
  return d[s.length][t.length];
}

// Close variants start with the same letter, neither begins with the other (inflections such as loan/loans or renew/renewal),
// and are one edit apart, or two once both have 6 letters or more (the usual fuzzy-matching length rule, set a priori).
// The edit distance is at least the length difference, so longer gaps are rejected before the distance is computed.
const begins = (a, b) => a.startsWith(b) || b.startsWith(a);
const first = (w) => w.codePointAt(0);
function closeVariant(a, b) {
  if (a === b || first(a) !== first(b) || begins(a, b)) return false;
  const [m, n] = [len(a), len(b)]; const allowed = Math.min(m, n) >= LONG_WORD ? 2 : 1;
  return Math.abs(m - n) <= allowed && editDistance(a, b, allowed) <= allowed;
}
// A word is not compared with a reference that lacks one of its diacritics: that is often another language, not a typo.
const marks = (w) => w.normalize('NFD').match(/\p{M}/gu) ?? [];
const foreignMark = (w, refMarks) => marks(w).some((m) => !refMarks.includes(m));
const edits = (n) => `${n} edit${n === 1 ? '' : 's'}`;

// Each visible string once: element text, plus control names and field labels that are not taken from element text (aria-label,
// title, value, alt), plus placeholders. Native default button names are browser text. Element text at the capture limit may end
// in a cut word, so its last word is dropped.
const OWN_NAME = new Set(['aria-label', 'title', 'value', 'alt', 'img-alt']);
function uiStrings(facts) {
  const out = [];
  for (const e of facts.elements ?? []) if (active(e)) out.push({ channel: 'text', sel: e.sel, value: e.text.length >= TEXT_CAP ? e.text.replace(/\s*\S*$/u, '') : e.text });
  for (const c of facts.controls ?? []) if (active(c) && OWN_NAME.has(c.name?.source)) out.push({ channel: 'control-name', sel: c.sel, value: c.name.text });
  for (const f of facts.fields ?? []) {
    if (!active(f)) continue;
    if (OWN_NAME.has(f.label?.source)) out.push({ channel: 'field-label', sel: f.sel, value: f.label.text });
    if (f.placeholder) out.push({ channel: 'placeholder', sel: f.sel, value: f.placeholder });
  }
  return out;
}

// word -> occurrences. The same string on the same page, element and channel (a re-capture) counts once.
function wordOccurrences(states) {
  const seen = new Set(); const byWord = new Map();
  for (const state of states) {
    for (const s of uiStrings(state.facts ?? {})) {
      const id = JSON.stringify([state.url, s.sel, s.channel, s.value]); if (seen.has(id)) continue; seen.add(id);
      for (const t of tokensOf(s.value).filter((x) => len(x.word) >= MIN_WORD)) {
        if (!byWord.has(t.word)) byWord.set(t.word, []); byWord.get(t.word).push({ state, ...s, name: t.name, lower: t.lower });
      }
    }
  }
  return byWord;
}

// Whether the word list describes the captured text: the share of distinct captured words (4 or more letters) that it knows, directly
// or as a regular inflection of a listed word. Under half, set a priori, means another language or a degenerate list, not a few
// missing words, so the family is unassessed rather than flooded with rows.
const MIN_KNOWN_SHARE = 0.5;
function listFit(words, dictionary) {
  const knownWords = words.filter((w) => dictionary.has(w) || inflectionBases(w).some((b) => dictionary.has(b))).length;
  return { capturedWords: words.length, knownWords, knownShare: words.length ? Math.round((knownWords / words.length) * 100) / 100 : null,
    fits: knownWords >= words.length * MIN_KNOWN_SHARE };
}

// Rare words with their most frequent close variant (ties keep code-point order), only with a caller-supplied dictionary that fits the
// captured text. A rare word is skipped when the dictionary knows it, when it is a regular inflection of a dictionary word or of a
// frequent captured word, and when every use is a name use (it is then counted). A frequent word used only as a name is no variant. A
// rare word whose only close variants lack one of its diacritics has no variant and is counted as not compared. Frequent words are
// grouped by first letter, the only ones a close variant can be.
function rareAssessment(states, { maxRare = 1, minFrequent = 3, dictionary = null } = {}) {
  if (!dictionary) return { assessed: false, words: [] };
  const byWord = wordOccurrences(states); const count = (w) => byWord.get(w).length;
  const words = [...byWord.keys()].sort(); const { fits, ...fit } = listFit(words, dictionary);
  if (!fits) return { assessed: false, unfit: true, fit, words: [] };
  const nameOnly = (w) => byWord.get(w).some((o) => o.name) && !byWord.get(w).some((o) => o.lower);
  const frequent = new Set(words.filter((x) => count(x) >= minFrequent)); const byFirst = new Map();
  for (const w of [...frequent].filter((x) => !nameOnly(x))) { if (!byFirst.has(first(w))) byFirst.set(first(w), []); byFirst.get(first(w)).push(w); }
  const known = (w) => dictionary.has(w) || inflectionBases(w).some((b) => dictionary.has(b) || frequent.has(b));
  const rows = words.filter((w) => count(w) <= maxRare && !known(w)).map((rare) => {
    const close = (byFirst.get(first(rare)) ?? []).filter((f) => closeVariant(rare, f)); const near = close.filter((f) => !foreignMark(rare, marks(f)));
    const variant = near.reduce((best, f) => (best === null || count(f) > count(best) ? f : best), null);
    return { rare, variant, name: nameOnly(rare), foreign: variant === null && close.length > 0, at: byWord.get(rare), counts: [count(rare), variant === null ? 0 : count(variant)] };
  }).filter((r) => r.variant !== null || r.foreign);
  return { assessed: true, fit, words: rows.filter((r) => !r.name), names: rows.filter((r) => r.name).length };
}

export function rareVariantCandidates(states, options) {
  return rareAssessment(states, options).words.filter((r) => r.variant !== null).flatMap(({ rare, variant, at, counts: [n, m] }) => at.map((o) => ({
    detector: 'rare-variant', key: `rare-variant|${rare}|${variant}`, severity: 'low', confidence: 'low',
    what: `Word "${rare}" occurs ${n === 1 ? 'once' : `${n} times`} in the captured text; its close variant "${variant}" occurs ${m} times (${edits(editDistance(rare, variant))} apart). `
      + 'It is not in the supplied dictionary and not an inflection of a dictionary word or of a frequent captured word. Possible misspelling; '
      + `convention-based, not a spell check: a name, a domain term or a word missing from the dictionary is a dismissal. Channel: ${o.channel}.`,
    evidence: evidence(o.state, o.sel) })));
}

// Words of a field's name and id attributes, split at case changes, digits and punctuation.
const idWords = (f) => [...new Set([f.name, f.id].filter(Boolean).flatMap((v) => String(v).normalize('NFC').replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2')
  .split(/[^\p{L}\p{M}]+/u).map((w) => w.toLowerCase()).filter((w) => len(w) >= MIN_NAME_WORD)))];
const minus = (a, b) => a.filter((w) => !b.includes(w));
// A label names a sibling when it holds every word of the sibling's name or id that this field's lacks, and none of the words
// that only this field's name or id has.
const namedSibling = (words, own, siblings) => siblings.find((g) => {
  const theirs = minus(g.words, own);
  return theirs.length > 0 && theirs.every((w) => words.includes(w)) && !minus(own, g.words).some((w) => words.includes(w));
});

// A label that wraps a select or textarea is not read: its text also holds the options or content.
const WRAPS_CONTENT = new Set(['select', 'textarea']);
function channelsOf(f) {
  const wrapped = f.label?.source === 'label-wrap' && WRAPS_CONTENT.has(f.tag);
  const label = f.label?.source && f.label.source !== 'none' && !wrapped ? [['label', f.label.text]] : [];
  return { wrapped, channels: [...label, ...(f.placeholder?.trim() ? [['placeholder', f.placeholder]] : [])] };
}

// Words of one label or placeholder near a word of the field's own name or id. A word that is a sibling's name word is left to
// the naming rule; a word with a diacritic the name and id lack is not compared.
function nearOwn(words, own, siblingWords) {
  const ownMarks = own.flatMap(marks); const rows = []; let foreign = false;
  for (const w of words.filter((x) => len(x) >= MIN_WORD && !siblingWords.includes(x))) {
    if (foreignMark(w, ownMarks)) { foreign = true; continue; }
    const idWord = own.find((v) => len(v) >= MIN_WORD && closeVariant(w, v));
    if (idWord) rows.push({ kind: 'near', word: w, idWord });
  }
  return { rows, foreign };
}

// One field: whether a channel was compared, the rows it gives and why any part was not compared.
function assessField(f, group) {
  const { wrapped, channels } = channelsOf(f); const gaps = wrapped ? ['wrapped-content'] : [];
  const own = idWords(f);
  if (!channels.length || !own.length) return { compared: false, gaps: channels.length ? [...gaps, 'no-identifier'] : gaps, rows: [] };
  const siblings = group.filter((g) => g !== f).map((g) => ({ field: g, words: idWords(g) })).filter((g) => g.words.length);
  const siblingWords = siblings.flatMap((g) => g.words); const rows = [];
  for (const [channel, text] of channels) {
    const words = wordsOf(text); const named = namedSibling(words, own, siblings);
    if (named) rows.push({ kind: 'names', channel, text, sibling: named.field });
    const near = nearOwn(words, own, siblingWords);
    rows.push(...near.rows.map((r) => ({ ...r, channel, text })));
    if (near.foreign && !gaps.includes('diacritic')) gaps.push('diacritic');
  }
  return { compared: true, gaps, rows };
}

// Active text-like fields of one state, each assessed against the other fields of its form (or of the page outside any form).
function assessedFields(state) {
  const fields = (state.facts?.fields ?? []).filter((f) => f.textLike && !f.inactive);
  return fields.filter((f) => !f.disabled).map((f) => ({ f, ...assessField(f, fields.filter((g) => g.form === f.form)) }));
}

const ident = (f) => f.name || f.id || f.sel;
function mismatchRow(state, f, r) {
  const subject = `Field "${ident(f)}" has the ${r.channel} "${String(r.text).slice(0, 80)}"`;
  const what = r.kind === 'names'
    ? `${subject}, which names another field of the same form ("${ident(r.sibling)}") and no word that only its own name or id has; `
      + `convention-based candidate: the ${r.channel}, the name or the id may be wrong, or the ${r.channel} may be intended`
    : `${subject}; its word "${r.word}" is ${edits(editDistance(r.word, r.idWord))} from "${r.idWord}" in the field's name or id; `
      + `possible misspelling in the ${r.channel}, the name or the id; convention-based candidate`;
  const key = r.kind === 'names' ? `label-mismatch|names|${f.sel}|${r.channel}|${r.text}|${ident(r.sibling)}` : `label-mismatch|near|${f.sel}|${r.channel}|${r.word}|${r.idWord}`;
  return { detector: 'label-mismatch', key, severity: 'low', confidence: 'low', what, evidence: evidence(state, f.sel) };
}

export function labelMismatchCandidates(state) {
  return assessedFields(state).flatMap(({ f, rows }) => rows.map((r) => mismatchRow(state, f, r)));
}

// What was compared and what was not, counted once per page and field; reasons in a fixed order, zero reasons omitted.
const GAP_REASONS = ['no-identifier', 'wrapped-content', 'diacritic'];
export function wordingCoverage(states, { dictionary = null } = {}) {
  const fields = new Map();
  for (const s of states) for (const a of assessedFields(s)) fields.set(`${s.url}|${a.f.sel}`, a);
  const all = [...fields.values()]; const n = (reason) => all.filter((a) => a.gaps.includes(reason)).length;
  return { fields: { compared: all.filter((a) => a.compared).length, incomplete: all.filter((a) => a.gaps.length).length,
    unassessed: Object.fromEntries(GAP_REASONS.map((k) => [k, n(k)]).filter(([, v]) => v > 0)) },
  rare: rareCoverage(rareAssessment(states, { dictionary })) };
}
export const UNFIT = 'dictionary does not fit the captured text';
function rareCoverage(r) {
  if (r.assessed) return { assessed: true, ...r.fit, withDiacritic: r.words.filter((w) => w.foreign).length, properNouns: r.names };
  return r.unfit ? { assessed: false, reason: UNFIT, ...r.fit } : { assessed: false, reason: 'no dictionary supplied' };
}
