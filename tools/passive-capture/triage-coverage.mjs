#!/usr/bin/env node
// P01 triage coverage (experimental, read-only lexical index). For every P01 candidate and every reached route without a capture in one or
// more evidence dirs, it reports whether an existing triage mention was found in explicitly selected notes or JSON strings, not admitted evidence:
//   node tools/passive-capture/triage-coverage.mjs [--partitions-v2] --out <dir> [--notes <file|dir>] [--observations <file|dir>] <evidence-dir | label=evidence-dir>...
// It keeps no record and no format of its own: no dispositions file, no status, no gate. Words and locations are copied as written,
// and no disposition is inferred. "No mention found" means only that none was found in the sources read. It reads what captureState,
// trackReached and detect.mjs wrote and writes <out>/triage-coverage.json and .md, optionally partitions-v2.json and .md (regular singly-linked files), never
// into an evidence, notes or observations dir. Exit 0, or 2 on bad input.
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, lstat, mkdir, readdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { duplicateLabels, loadStates } from './detect.mjs';
import { partitionWorklistV2, partitionLinesV2 } from './partitions.mjs';
import { loadReached, reachedRemainder, routeOf } from './reached.mjs';

export const TITLE = 'P01 triage coverage';
const TRIAGE_WORDS = ['finding', 'hypothesis', 'dismissed', 'unassessed'];
const SCOPE = 'Read-only report (experimental). For each P01 candidate and each reached route without a capture it lists the existing triage mentions '
  + 'found in the sources read: a notes list item, paragraph, heading or table row that cites the candidate id, the candidate key or the route together '
  + 'with a README triage word outside the citation (finding, hypothesis, dismissed, unassessed), or a recorded observation that cites a capture file of '
  + 'the candidate, the candidate key or the route. The word and the location are copied as written; no disposition is inferred. No mention found means only that no such '
  + 'mention was found in the sources read: it is not a defect, not a status and not a gate. Counts are not quality, and no PASS rule follows from them.';
const LIMITS = [
  'Mentions are matched literally: an id (P001) only as that whole token (not P1 or P0011), a key only in full, a route only in full with scheme and host '
    + '(a query may follow it; a further path segment, fragment or extension may not). Paraphrases, selectors and headlines are not matched.',
  'A triage word counts only outside the citation: a whitespace-delimited run that holds a URL (://), a key (cand:) or a capture path (passive/) is '
    + 'blanked first, so a word in a route, its query or fragment, a key and its dir label, or any other URL is never taken as the disposition word.',
  'Notes are matched per Markdown block: a list item with its continuation lines (lazy ones too) but not its nested items, a paragraph of consecutive '
    + 'lines, a heading, a table row (any line with a pipe) or one line inside a code fence; a blockquote marker is read through. A citation in a heading '
    + 'or parent item whose triage word is in the text below is reported as cited without a disposition word.',
  'A block can cite several items (sibling lines of one paragraph, a lazy continuation): each mention then records how many other items its block cites, '
    + 'and an item whose every mention is in such a block or cites only shared tokens is counted under onlySharedCitations, never as standing alone.',
  'The triage word is copied, not interpreted: a negation ("not a finding"), a word about another item of the same block, or reasoning that does not '
    + 'hold are not detected.',
  'An id is ordinal: it follows the severity and detector order of the current detect.mjs run, so a note written against an earlier run, or another '
    + 'product, kept in the notes source can cite an id that now names another candidate; an item found only through ids is counted under '
    + 'onlyOrdinalCitations. Compare the copied text with the candidate headline. A key survives an ordinal shift but changes when the headline, the '
    + 'state or selector of the first evidence, or the dir label changes (for a qualified key, anything in its row): a note citing the earlier key then '
    + 'finds no mention.',
  'A citation that also matches other items (one id in several evidence dirs, a capture file shared by every candidate of a state, one route in several '
    + 'dirs) is listed for each of them with the number of other items it matches; it does not show which one it is about.',
  'Observations: every string value of every JSON file read is searched line by line; a citation anywhere counts, whatever the field, and no triage word '
    + 'is required or inferred. A capture file counts with no dir written before it (then for every evidence dir holding that state, from any run) or '
    + 'under the evidence dir itself, as given, resolved against the working dir or by real path (a file:// URL too). Under another dir, a spelling '
    + 'through another symbolic link, or a relative dir whose base is unknown, it is listed as cited under another path, not as a mention.',
  'Only the sources given are read: Markdown files (.md, .markdown) as notes and JSON files (.json) as observations, recursively. Skipped and listed: '
    + 'symbolic links, other files, any passive/ dir holding P01 capture output (of a passed evidence dir or not), files named like P01 output '
    + '(index, reached, candidates, partitions, facts or axe file) and earlier triage-coverage reports, so a Disposition column filled in '
    + 'passive/candidates.md is not read. Line endings are normalised.',
];
const LABEL = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const NAMED_DIR = /^([A-Za-z0-9][A-Za-z0-9._-]{0,79})=(.+)$/;
const INPUTS = ['index.jsonl', 'reached.jsonl', 'candidates.json', 'candidates.md', 'partitions.json'];
const ABSENT_ROUTES = 'absent: no passive/reached.jsonl, so routes reached but not captured are unknown, not zero';
const DUPLICATE_LABELS = 'labels captured more than once: only the latest capture per label is listed in candidates.json, so candidates of earlier captures '
  + 'under them are not listed: unknown, not zero';
const CONFIDENCE_ORDER = ['declared', 'stated', 'inferred'];
const KINDS = {
  notes: { extensions: ['.md', '.markdown'], other: 'not Markdown (.md or .markdown)', report: 'an earlier triage-coverage report, not notes' },
  observations: { extensions: ['.json'], other: 'not JSON (.json)', report: 'an earlier triage-coverage report, not an observation' },
};

export class CoverageInputError extends Error {}
const refuse = (message) => { throw new CoverageInputError(message); };
const passive = (name) => `passive/${name}`;
const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const digest = (value, n) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, n);
const sha256 = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const nonBlank = (v) => typeof v === 'string' && v.trim() !== '';
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const strings = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');
const sameList = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
const splitLines = (text) => String(text).replace(/^﻿/, '').split(/\r\n|\r|\n/);

// --- notes: Markdown blocks, triage words and citations ---
const LIST_ITEM = /^\s*(?:[-*+]|\d{1,9}[.)])(?:\s|$)/;
const HEADING = /^\s{0,3}#{1,6}(?:\s|$)/;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
const QUOTE = /^(?:\s{0,3}>\s?)+/;
const closesFence = (line, fence) => { const t = line.trim(); return t.length >= fence.length && [...t].every((c) => c === fence[0]); };

// A block is a paragraph, or a list item with its continuation lines (lazy ones too) but not its nested items; a heading, a line holding a
// pipe (a table row) and each line inside a code fence stand alone. Blockquote markers are read through, and the text is kept as written.
// A paragraph of sibling lines or a lazy continuation can still cite several items in one block: noteHits records that on each mention.
export function noteBlocks(text) {
  const blocks = []; let open = null; let fence = null;
  const flush = () => { if (open) blocks.push(open); open = null; };
  const own = (n, line) => { flush(); blocks.push({ start: n, end: n, text: line }); };
  splitLines(text).forEach((line, i) => {
    const n = i + 1; const body = line.replace(QUOTE, ''); const blank = body.trim() === '';
    if (fence) { if (closesFence(body, fence)) fence = null; if (!blank) own(n, line); return; }
    const opening = FENCE.exec(body);
    if (opening) { fence = opening[1]; own(n, line); return; }
    if (blank) { flush(); return; }
    if (HEADING.test(body) || line.includes('|')) { own(n, line); return; }
    if (LIST_ITEM.test(body) || !open) { flush(); open = { start: n, end: n, text: line }; return; }
    open = { ...open, end: n, text: `${open.text}\n${line}` };
  });
  flush();
  return blocks;
}

// The README triage words as whole words (not joined to a letter or digit), each distinct spelling once, in order, as written.
const WORD = new RegExp(`(?<![\\p{L}\\p{N}])(?:${TRIAGE_WORDS.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
export const triageWords = (text) => [...new Set([...String(text).matchAll(WORD)].map((m) => m[0]))];
// A word inside a citation-shaped run (a whitespace-delimited run holding a URL "://", a key "cand:" or a capture path "passive/") is part of
// what is cited, a route's query or a key's dir label among it, not a word the agent wrote: such runs are blanked before words are looked for.
const CITATION_RUN = /\S*(?::\/\/|cand:|passive\/)\S*/g;
const dispositionWords = (text) => triageWords(String(text).replace(CITATION_RUN, ' '));

// A token is cited only as itself: the character before it and the one after it must not continue it. A '.' after it ends it only when no
// letter, digit or underscore follows ("see P001." or "passive/desk.png."), so "passive/desk.png.bak" is not the file.
const BOUNDS = {
  id: [/[A-Za-z0-9_]/, /[A-Za-z0-9_]/],
  key: [/[A-Za-z0-9_.~-]/, /[A-Za-z0-9_~-]/],
  route: [/[A-Za-z0-9_.+-]/, /[A-Za-z0-9_~%/#-]/],
  'capture-file': [/[A-Za-z0-9_.-]/, /[A-Za-z0-9_~-]/],
};
// Every occurrence of a token at its citation bounds, with the dir written before a capture file ('' when none): the run of path characters
// before it, kept only when it ends in a separator.
const PATH_STOP = /[\s"'`()<>[\]{},;=|*]/;
function dirBefore(text, at) {
  let start = at; while (start > 0 && !PATH_STOP.test(text[start - 1])) start -= 1;
  const written = text.slice(start, at);
  return /[\\/]$/.test(written) ? written : '';
}
function citations(text, token, kind) {
  if (!token) return [];
  const [before, after] = BOUNDS[kind]; const out = [];
  for (let at = text.indexOf(token); at !== -1; at = text.indexOf(token, at + 1)) {
    const prev = text[at - 1] ?? ''; const next = text[at + token.length] ?? ''; const then = text[at + token.length + 1] ?? '';
    if (!before.test(prev) && !after.test(next) && !(next === '.' && /[A-Za-z0-9_]/.test(then))) out.push({ prefix: kind === 'capture-file' ? dirBefore(text, at) : '' });
  }
  return out;
}
export const cites = (text, token, kind) => citations(text, token, kind).length > 0;

// A written dir names the evidence dir when, without a file:// scheme and trailing separators, it is absolute and equal to the dir as given
// or to one of its absolute forms (loadEvidence adds the resolved and the real path). A relative dir is not compared: its base is unknown.
const trimDir = (path) => { const n = normalize(path); return n.length > 1 ? n.replace(/[\\/]+$/, '') : n; };
const dirForms = (s) => [...new Set([s.dir, ...(Array.isArray(s.paths) ? s.paths : [])].filter((p) => typeof p === 'string' && isAbsolute(p)).map(trimDir))];
function compareDir(prefix, forms) {
  const dir = prefix.replace(/^file:\/\//, '');
  if (!isAbsolute(dir)) return 'relative, not compared';
  return forms.includes(trimDir(dir)) ? 'evidence dir' : 'differs from the evidence dir';
}

// --- evidence: one dir as detect.mjs left it ---
const validCandidate = (c) => isObject(c) && nonBlank(c.id) && nonBlank(c.detector) && typeof c.what === 'string' && strings(c.states)
  && Array.isArray(c.evidence) && isObject(c.evidence[0]);

// candidates.json (and partitions.json when present) must describe exactly the captures the index holds now: a capture added after
// detect.mjs ran has no candidates yet, and listing the old ones as complete would let its candidates drop out silently.
function checkEvidence(s) {
  if (!LABEL.test(s?.label ?? '')) refuse(`label "${s?.label}" must match ${LABEL}; name the dir as label=dir`);
  const labels = s.states.map((x) => x.label); const stale = (file, covered) => `${s.dir}: passive/${file} is stale: it covers [${covered}] but the index holds [${labels}]; re-run detect.mjs`;
  if (!isObject(s.candidates) || !Array.isArray(s.candidates.candidates)) refuse(`${s.dir}: passive/candidates.json has no candidates list; run detect.mjs on this dir`);
  if (!sameList(s.candidates.states, labels)) refuse(stale('candidates.json', s.candidates.states));
  s.candidates.candidates.forEach((c, i) => { if (!validCandidate(c)) refuse(`${s.dir}: passive/candidates.json row ${i} is not a candidate row (id, detector, what, states, evidence)`); });
  if (s.partitions === null) return;
  if (!isObject(s.partitions) || !Array.isArray(s.partitions.rows) || !s.partitions.rows.every(isObject)) refuse(`${s.dir}: passive/partitions.json has no rows list; re-run detect.mjs`);
  if (!sameList(s.partitions.states, labels)) refuse(stale('partitions.json', s.partitions.states));
}
const validFile = (f, field) => isObject(f) && nonBlank(f.path) && (field === 'text' ? typeof f.text === 'string' : f.doc !== undefined);
function checkTextSource(src, name, field) {
  if (src === null) return;
  const ok = isObject(src) && nonBlank(src.path) && nonBlank(src.kind) && Array.isArray(src.files) && src.files.every((f) => validFile(f, field)) && Array.isArray(src.skipped);
  if (!ok) refuse(`${name} source must have a path, a kind, a skipped list and files with a path and ${field}`);
}

// --- items: candidates (keyed as in the ledger pilot) and reached routes without a capture ---
// The id (P001) is ordinal and shifts when another candidate appears. The key is the dir label, the detector and a digest of the head
// (detector, headline, first evidence state and selector); when one key fits candidates of different content in a dir, each is qualified
// by a digest of its row without the id. Candidates of identical content share their key.
function candidateItems(s) {
  const raw = s.candidates.candidates.map((c) => {
    const { id: _id, ...body } = c; const head = c.evidence[0];
    return { c, body, base: `cand:${s.label}:${c.detector}.${digest([c.detector, c.what, head.state ?? null, head.selector ?? null], 12)}` };
  });
  const variants = new Map(); for (const r of raw) variants.set(r.base, (variants.get(r.base) ?? new Set()).add(JSON.stringify(r.body)));
  return raw.map(({ c, body, base }) => ({ kind: 'candidate', source: s.label, id: c.id, ref: variants.get(base).size > 1 ? `${base}~${digest(body, 8)}` : base,
    detector: c.detector, severity: c.severity, confidence: c.confidence, what: c.what, states: c.states }));
}
const routeItems = (s, remainder) => (remainder.ledger === 'absent' ? []
  : remainder.uncaptured.map((route) => ({ kind: 'route', source: s.label, ref: `route:${s.label}:${route}`, route, states: [] })));

// Notes cite an id, a key or a route; observations cite a key, a capture file (facts, screenshot, axe) or a route.
const captureFiles = (states) => states.flatMap((l) => [passive(`${l}.facts.json`), passive(`${l}.png`), passive(`${l}.axe.json`)]);
const tokensOf = (item) => (item.kind === 'route' ? { notes: [['route', item.route]], observation: [['route', item.route]] }
  : { notes: [['id', item.id], ['key', item.ref]], observation: [['key', item.ref], ...captureFiles(item.states).map((f) => ['capture-file', f])] });
const tokenKey = (via, [kind, token]) => `${via}|${kind}|${token}`;
// How many items hold each token, and for a capture file also how many in its own dir (a citation under that dir matches only those).
function sharedCounts(items) {
  const counts = new Map(); const add = (key) => counts.set(key, (counts.get(key) ?? 0) + 1);
  for (const item of items) for (const via of ['notes', 'observation']) for (const t of item.tokens[via]) { add(tokenKey(via, t)); add(`${tokenKey(via, t)}|${item.source}`); }
  return counts;
}

// One cited token of an item: counted with how many other items it also matches, or, for a capture file written only under another or a
// relative dir, returned apart with that dir as written.
function readCitation(item, via, t, found, shared) {
  const [kind, token] = t;
  if (kind !== 'capture-file' || found.some((o) => o.prefix === '')) return { counted: true, cite: { kind, token, alsoMatches: shared.get(tokenKey(via, t)) - 1 } };
  const read = found.map((o) => ({ prefix: o.prefix, comparison: compareDir(o.prefix, item.paths) }));
  const own = read.find((r) => r.comparison === 'evidence dir');
  return own ? { counted: true, cite: { kind, token, prefix: own.prefix, alsoMatches: shared.get(`${tokenKey(via, t)}|${item.source}`) - 1 } }
    : { counted: false, cite: { kind, token, ...read[0] } };
}
// Every item one text cites, with its cited tokens in the item's own token order, and its capture files cited only under another path.
function scan(text, via, items, shared) {
  const memo = new Map();
  const found = ([kind, token]) => { const k = `${kind}|${token}`; if (!memo.has(k)) memo.set(k, citations(text, token, kind)); return memo.get(k); };
  return items.flatMap((item) => {
    const read = item.tokens[via].filter((t) => found(t).length).map((t) => readCitation(item, via, t, found(t), shared));
    return read.length ? [{ index: item.index, cites: read.filter((r) => r.counted).map((r) => r.cite), elsewhere: read.filter((r) => !r.counted).map((r) => r.cite) }] : [];
  });
}
// Other items a block cites through a token this item's citation does not hold (a sibling line, a lazy continuation): the word may be theirs.
const sameCite = (a, b) => a.kind === b.kind && a.token === b.token;
const otherItems = (hits, mine) => hits.filter((h) => h.cites !== mine && h.cites.some((c) => !mine.some((m) => sameCite(c, m)))).length;
function noteHits(notes, items, shared) {
  return (notes?.files ?? []).flatMap((file) => noteBlocks(file.text).flatMap((block) => {
    const words = dispositionWords(block.text); const hits = scan(block.text, 'notes', items, shared);
    return hits.map(({ index, cites: list }) => {
      const others = otherItems(hits, list);
      return { index, kind: words.length ? 'mention' : 'wordless', record: { via: 'notes', file: file.path, lines: [block.start, block.end], cites: list,
        ...(others ? { blockCitesOtherItems: others } : {}), ...(words.length ? { words } : {}), text: block.text } };
    });
  }));
}
// String values with their JSON pointer (RFC 6901), in document order.
function* stringsOf(value, pointer = '') {
  if (typeof value === 'string') yield [pointer, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* stringsOf(v, `${pointer}/${i}`);
  else if (isObject(value)) for (const [k, v] of Object.entries(value)) yield* stringsOf(v, `${pointer}/${k.replace(/~/g, '~0').replace(/\//g, '~1')}`);
}
function observationHits(observations, items, shared) {
  return (observations?.files ?? []).flatMap((file) => [...stringsOf(file.doc)].flatMap(([pointer, value]) => splitLines(value).flatMap((line, i) =>
    scan(line, 'observation', items, shared).map(({ index, cites: list, elsewhere }) => (list.length
      ? { index, kind: 'mention', record: { via: 'observation', file: file.path, pointer, line: i + 1, cites: list, words: dispositionWords(line), text: line } }
      : { index, kind: 'elsewhere', record: { via: 'observation', file: file.path, pointer, line: i + 1, cites: elsewhere, text: line } })))));
}

// --- assembling the report ---
const ITEM_FILES = { candidate: [passive('candidates.md')], route: [passive('reached.jsonl'), passive('candidates.md')] };
// A mention is shared when its block cites other items too or every token it cites also matches other items: the word may be about another.
const sharedMention = (m) => m.blockCitesOtherItems > 0 || m.cites.every((c) => c.alsoMatches > 0);
const ordinalMention = (m) => m.cites.every((c) => c.kind === 'id');
function resolveItem(item, hits, files) {
  const of = (kind) => hits.filter((h) => h.kind === kind).map((h) => h.record); const mentions = of('mention');
  const artifacts = [...item.states.flatMap((l) => [passive(`${l}.facts.json`), passive(`${l}.png`)]), ...ITEM_FILES[item.kind]];
  const head = item.kind === 'route' ? { route: item.route, ref: item.ref }
    : { id: item.id, ref: item.ref, detector: item.detector, severity: item.severity, confidence: item.confidence, what: item.what, states: item.states };
  return { ...head, artifacts, missingArtifacts: artifacts.filter((a) => !files.has(a.slice('passive/'.length))), mentionFound: mentions.length > 0,
    onlySharedCitations: mentions.length > 0 && mentions.every(sharedMention), onlyOrdinalCitations: mentions.length > 0 && mentions.every(ordinalMention),
    mentions, citedWithoutTriageWord: of('wordless'), citedUnderAnotherPath: of('elsewhere') };
}
const tally = (list) => ({ mentionFound: list.filter((i) => i.mentionFound).length, onlySharedCitations: list.filter((i) => i.onlySharedCitations).length,
  onlyOrdinalCitations: list.filter((i) => i.onlyOrdinalCitations).length, noMentionFound: list.filter((i) => !i.mentionFound).length,
  citedWithoutTriageWord: list.filter((i) => !i.mentionFound && i.citedWithoutTriageWord.length).length });
const rank = (v) => (CONFIDENCE_ORDER.includes(v) ? CONFIDENCE_ORDER.indexOf(v) : CONFIDENCE_ORDER.length);
// Partition rows are planned checks, not candidates: only counted, by the confidence each row carries as written.
function partitionCounts(p) {
  if (p === null) return { file: 'absent' };
  const values = p.rows.map((r) => (typeof r.confidence === 'string' ? r.confidence : null));
  const named = [...new Set(values.filter((v) => v !== null))].sort((a, b) => rank(a) - rank(b) || byCodePoint(a, b));
  return { file: 'present', rows: values.length, byConfidence: Object.fromEntries(named.map((v) => [v, values.filter((x) => x === v).length])),
    confidenceNotRecorded: values.filter((v) => v === null).length };
}
function evidenceEntry(s, remainder, resolved) {
  const candidates = resolved.filter((i) => i.kind === 'candidate').map((i) => i.out); const routes = resolved.filter((i) => i.kind === 'route').map((i) => i.out);
  return { label: s.label, dir: s.dir,
    unknown: (s.duplicates ?? []).length ? [{ input: passive('index.jsonl'), duplicateLabels: s.duplicates, meaning: DUPLICATE_LABELS }] : [],
    candidates: { total: candidates.length, ...tally(candidates), items: candidates },
    routes: remainder.ledger === 'absent' ? { ledger: 'absent', meaning: ABSENT_ROUTES }
      : { ledger: 'recorded', reached: remainder.routes, captured: remainder.captured, uncaptured: routes.length, ...tally(routes), items: routes },
    partitionRows: partitionCounts(s.partitions) };
}
function reviewerEntry(s) {
  const files = new Set(s.files); const known = new Set([...INPUTS, ...s.states.flatMap((x) => [`${x.label}.facts.json`, `${x.label}.png`, `${x.label}.axe.json`])]);
  return { source: s.label, dir: s.dir,
    inputs: INPUTS.map((name) => ({ path: passive(name), present: files.has(name), ...(s.digests?.[name] ? { sha256: s.digests[name] } : {}) })),
    states: s.states.map((x) => {
      const paths = { facts: passive(`${x.label}.facts.json`), screenshot: passive(`${x.label}.png`), axe: passive(`${x.label}.axe.json`) };
      return { label: x.label, route: routeOf(x.url) ?? null, ...paths, missing: Object.values(paths).filter((p) => !files.has(p.slice('passive/'.length))) };
    }),
    unindexed: [...files].filter((f) => !known.has(f)).sort(byCodePoint).map(passive) };
}
const sourceSummary = (src, count) => (src === null ? null
  : { path: src.path, kind: src.kind, read: src.files.map((f) => ({ path: f.path, ...count(f), sha256: f.sha256 })), skipped: src.skipped });
const textLines = (text) => { const parts = splitLines(text); return parts[parts.length - 1] === '' ? parts.length - 1 : parts.length; };
function totalsOf(evidence) {
  const candidates = evidence.flatMap((e) => e.candidates.items); const recorded = evidence.filter((e) => e.routes.ledger === 'recorded');
  const routes = recorded.flatMap((e) => e.routes.items);
  return { candidates: { total: candidates.length, ...tally(candidates) },
    routes: { ledgerRecorded: recorded.map((e) => e.label), ledgerAbsent: evidence.filter((e) => e.routes.ledger === 'absent').map((e) => e.label), uncaptured: routes.length, ...tally(routes) } };
}

export function buildCoverage({ evidence, notes = null, observations = null } = {}) {
  if (!Array.isArray(evidence) || !evidence.length) refuse('at least one evidence dir is needed');
  const labels = evidence.map((s) => s?.label); const twice = labels.find((l, i) => labels.indexOf(l) !== i);
  if (twice !== undefined) refuse(`label "${twice}" is used by more than one evidence dir; name them as label=dir`);
  evidence.forEach(checkEvidence); checkTextSource(notes, 'notes', 'text'); checkTextSource(observations, 'observations', 'doc');
  const sorted = [...evidence].sort((a, b) => byCodePoint(a.label, b.label));
  const remainders = sorted.map((s) => reachedRemainder(s.reached, s.states));
  const forms = new Map(sorted.map((s) => [s.label, dirForms(s)]));
  const items = sorted.flatMap((s, n) => [...candidateItems(s), ...routeItems(s, remainders[n])])
    .map((item, index) => ({ ...item, index, tokens: tokensOf(item), paths: forms.get(item.source) }));
  const shared = sharedCounts(items);
  const hits = [...noteHits(notes, items, shared), ...observationHits(observations, items, shared)];
  const byItem = new Map(items.map((i) => [i.index, []])); for (const h of hits) byItem.get(h.index).push(h);
  const files = new Map(sorted.map((s) => [s.label, new Set(s.files)]));
  const resolved = items.map((i) => ({ kind: i.kind, source: i.source, out: resolveItem(i, byItem.get(i.index), files.get(i.source)) }));
  const entries = sorted.map((s, n) => evidenceEntry(s, remainders[n], resolved.filter((r) => r.source === s.label)));
  return { title: TITLE, scope: SCOPE, limits: LIMITS,
    sources: { evidence: sorted.map((s) => ({ label: s.label, dir: s.dir })),
      notes: sourceSummary(notes, (f) => ({ lines: textLines(f.text), blocks: noteBlocks(f.text).length })),
      observations: sourceSummary(observations, (f) => ({ strings: [...stringsOf(f.doc)].length })) },
    totals: totalsOf(entries), evidence: entries, reviewerIndex: sorted.map(reviewerEntry) };
}

const COUNTS_NOTE = 'Counts are not quality, and no PASS rule follows from them. No mention found is not a defect, not a status and not a gate: it means only that '
  + 'no mention was found in the sources read. A partition row is a planned check, not a candidate, and needs no triage mention.';
// The one-line stdout summary carries the same meaning, so a copied line (a checkpoint pointer, say) never reads as a pass or a gate.
export const coverageSummary = (r) => ({ evidenceDirs: r.sources.evidence.length, candidates: r.totals.candidates, routes: r.totals.routes,
  notes: r.sources.notes ? { read: r.sources.notes.read.length, skipped: r.sources.notes.skipped.length } : 'none given',
  observations: r.sources.observations ? { read: r.sources.observations.read.length, skipped: r.sources.observations.skipped.length } : 'none given',
  meaning: COUNTS_NOTE });

// --- triage-coverage.md ---
// A code span takes a fence longer than any backtick run inside it, so a key or path copies verbatim; a pipe is escaped only in table cells.
// Copied note and observation text sits in a code fence longer than any backtick run inside it.
const flat = (s) => String(s).replace(/\n/g, ' ');
const code = (s) => {
  const text = flat(s); const run = Math.max(0, ...(text.match(/`+/g) ?? []).map((m) => m.length)); const fence = '`'.repeat(run + 1);
  return run ? `${fence} ${text} ${fence}` : `${fence}${text}${fence}`;
};
const pipes = (s) => flat(s).replace(/\|/g, '\\|');
const cellCode = (s) => code(pipes(s));
const fenced = (text) => {
  const run = Math.max(0, ...(text.match(/`+/g) ?? []).map((m) => m.length)); const fence = '`'.repeat(Math.max(3, run + 1));
  return [fence, ...text.split('\n'), fence].map((l) => `    ${l}`);
};
const lineRange = ([a, b]) => (a === b ? `line ${a}` : `lines ${a}-${b}`);
const citesText = (list) => list.map((c) => `${code(c.token)}${c.prefix ? ` under ${code(c.prefix)}` : ''}${c.alsoMatches ? ` (also matches ${c.alsoMatches} other item(s))` : ''}`).join(', ');
const blockText = (m) => (m.blockCitesOtherItems ? `; the block also cites ${m.blockCitesOtherItems} other item(s)` : '');
const wordsText = (words) => (words.length ? `words as written: ${words.map(code).join(', ')}` : 'no triage word in the citing line, none inferred');
function mentionLines(m) {
  const where = m.via === 'notes' ? `notes ${code(m.file)} ${lineRange(m.lines)}` : `observation ${code(m.file)} at ${m.pointer ? code(m.pointer) : 'the document root'} line ${m.line}`;
  return [`  - ${where}, cites ${citesText(m.cites)}${blockText(m)}; ${wordsText(m.words)}`, ...fenced(m.text)];
}
const wordlessLines = (w) => [`  - cited without a disposition word: notes ${code(w.file)} ${lineRange(w.lines)}, cites ${citesText(w.cites)}${blockText(w)}`, ...fenced(w.text)];
const elsewhereLines = (w) => [`  - capture file cited under another path, not counted: observation ${code(w.file)} at ${w.pointer ? code(w.pointer) : 'the document root'} line ${w.line}, cites `
  + `${w.cites.map((c) => `${code(c.token)} under ${code(c.prefix)} (${c.comparison})`).join(', ')}`, ...fenced(w.text)];
const artifactLine = (i, dir, lead) => `  - ${lead}artifacts: ${i.artifacts.map((a) => code(join(dir, a))).join(', ')}`
  + (i.missingArtifacts.length ? `; missing: ${i.missingArtifacts.map(code).join(', ')}` : '');
const SHARED_ONLY = '  - mention found only through a citation that also matches other items, or in a block that also cites other items; which one it is about is not shown';
const ORDINAL_ONLY = '  - mention found only through an ordinal id, which follows the current detect.mjs order: a note written against another run can carry it; '
  + 'compare the copied text with the headline';
const itemTail = (i) => [...(i.onlySharedCitations ? [SHARED_ONLY] : []), ...(i.onlyOrdinalCitations ? [ORDINAL_ONLY] : []), ...i.mentions.flatMap(mentionLines),
  ...i.citedWithoutTriageWord.flatMap(wordlessLines), ...i.citedUnderAnotherPath.flatMap(elsewhereLines)];
const candidateLines = (dir) => (i) => [`- ${i.id} ${code(i.ref)} (${i.detector}, ${i.severity}/${i.confidence}): ${flat(i.what).slice(0, 240)}`,
  artifactLine(i, dir, `states: ${i.states.join(', ') || 'none'}; `), ...itemTail(i)];
const routeLines = (dir) => (i) => [`- ${code(i.route)}`, artifactLine(i, dir, ''), ...itemTail(i)];
const section = (title, list, line) => ['', `### ${title} (${list.length})`, '', ...(list.length ? list.flatMap(line) : ['None.'])];
const split = (items) => [items.filter((i) => !i.mentionFound), items.filter((i) => i.mentionFound)];

const confidenceParts = (p) => [...Object.entries(p.byConfidence).map(([k, n]) => `${k} ${n}`), ...(p.confidenceNotRecorded ? [`confidence not recorded ${p.confidenceNotRecorded}`] : [])];
const partitionCell = (p) => (p.file === 'absent' ? 'absent: no passive/partitions.json' : p.rows ? `${p.rows}: ${confidenceParts(p).join(', ')}` : 'none');
const partitionLine = (p) => (p.file === 'absent' ? 'No passive/partitions.json: partition rows are not counted.'
  : `${p.rows} row(s)${p.rows ? `: ${confidenceParts(p).join(', ')}` : ''}. Counts only: rows are planned checks, not candidates, and need no triage mention.`);
const routeCell = (r) => (r.ledger === 'absent' ? ABSENT_ROUTES : r.uncaptured
  ? `${r.uncaptured} of ${r.reached} reached route(s): mention found ${r.mentionFound}, no mention found ${r.noMentionFound}` : `none of ${r.reached} reached route(s)`);
const groupsText = (groups) => groups.map((g) => `${g.labels.join('/')} ×${g.captures}`).join(', ');
const SUMMARY = ['| Evidence dir | Candidates | Mention found | Only through a shared citation or block | Only through an ordinal id | No mention found '
  + '| Cited without a disposition word | Reached, not captured | Partition rows (planned checks) |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
const summaryRow = (e) => { const c = e.candidates; return `| ${e.label} | ${c.total} | ${c.mentionFound} | ${c.onlySharedCitations} | ${c.onlyOrdinalCitations} | ${c.noMentionFound} `
  + `| ${c.citedWithoutTriageWord} | ${pipes(routeCell(e.routes))} | ${pipes(partitionCell(e.partitionRows))} |`; };

function sourceLines(s) {
  const skipped = (list) => (list.length ? list.map((x) => `${code(x.path)} (${x.reason})`).join(', ') : 'none');
  const sum = (list, key) => list.reduce((n, f) => n + f[key], 0);
  return [`- Evidence dirs: ${s.evidence.map((e) => `${e.label} (${code(e.dir)})`).join(', ')}.`,
    s.notes ? `- Notes: ${code(s.notes.path)} (${s.notes.kind}): ${s.notes.read.length} Markdown file(s) read, ${sum(s.notes.read, 'blocks')} block(s). Skipped: ${skipped(s.notes.skipped)}.`
      : '- Notes: none given, so no notes mention can be found.',
    s.observations ? `- Observations: ${code(s.observations.path)} (${s.observations.kind}): ${s.observations.read.length} JSON file(s) read, `
      + `${sum(s.observations.read, 'strings')} string value(s). Skipped: ${skipped(s.observations.skipped)}.` : '- Observations: none given, so no observation mention can be found.'];
}
function routeSection(e) {
  const r = e.routes;
  if (r.ledger === 'absent') return ['', '### Reached routes', '', `Reached routes: ${ABSENT_ROUTES}.`];
  const [none, found] = split(r.items);
  return ['', '### Reached routes', '', `Reached routes: ${r.reached} distinct, ${r.captured} with a captured state, ${r.uncaptured} without. A route without a capture has no facts or screenshot.`,
    ...section('Reached, not captured, no mention found', none, routeLines(e.dir)), ...section('Reached, not captured, mention found', found, routeLines(e.dir))];
}
function evidenceLines(e) {
  const [none, found] = split(e.candidates.items);
  return ['', `## ${e.label} (${code(e.dir)})`, ...e.unknown.flatMap((u) => ['', `Unknown, not zero: labels captured more than once (${groupsText(u.duplicateLabels)}); only the latest capture `
    + 'per label is listed in candidates.json, so candidates of earlier captures under them are not listed.']),
  ...section('Candidates with no mention found', none, candidateLines(e.dir)), ...section('Candidates with a mention found', found, candidateLines(e.dir)),
  ...routeSection(e), '', '### Partition rows (planned checks, not candidates)', '', partitionLine(e.partitionRows)];
}
function reviewerLines(r) {
  const input = (i) => `${code(i.path)} (${i.present ? (i.sha256 ? i.sha256.slice(0, 23) : 'present') : 'absent'})`;
  const pathCell = (path, missing) => (missing.includes(path) ? `missing: ${cellCode(path)}` : cellCode(path));
  return ['', `### ${r.source} (${code(r.dir)})`, '', `Inputs: ${r.inputs.map(input).join(', ')}.`, '', '| State | Route | Facts | Screenshot | Axe |', '| --- | --- | --- | --- | --- |',
    ...r.states.map((s) => `| ${pipes(s.label)} | ${s.route ? cellCode(s.route) : 'not a route'} | ${pathCell(s.facts, s.missing)} | ${pathCell(s.screenshot, s.missing)} | ${pathCell(s.axe, s.missing)} |`),
    '', r.unindexed.length ? `Unindexed files (no index line names them): ${r.unindexed.map(code).join(', ')}.` : 'Unindexed files: none.'];
}
export function coverageMarkdown(r) {
  return [`# ${TITLE}`, '', r.scope, '', '## Sources read', '', ...sourceLines(r.sources), '', 'Limits of mention matching:', ...r.limits.map((l) => `- ${l}`),
    '', '## Summary', '', ...SUMMARY, ...r.evidence.map(summaryRow), '', COUNTS_NOTE, ...r.evidence.flatMap(evidenceLines),
    '', '## Reviewer index', '', 'Every capture artifact per evidence dir; paths are relative to the dir.', ...r.reviewerIndex.flatMap(reviewerLines)].join('\n') + '\n';
}

// --- loading ---
const readOptional = (path) => readFile(path).catch((error) => (error.code === 'ENOENT' ? null : Promise.reject(error)));
const jsonOf = (text, where) => { try { return JSON.parse(text); } catch (error) { return refuse(`${where} is not valid JSON (${error.message})`); } };
function parseIndex(text, dir) {
  return text.split('\n').flatMap((line, i) => {
    if (!line.trim()) return [];
    const entry = jsonOf(line, `${dir}: passive/index.jsonl line ${i + 1}`);
    return isObject(entry) && nonBlank(entry.label) ? [entry] : refuse(`${dir}: passive/index.jsonl line ${i + 1} has no label`);
  });
}
export async function loadEvidence(dir, label) {
  const names = await readdir(join(dir, 'passive')).catch((error) => refuse(`${dir}: no readable passive/ dir (${error.code}); pass an evidence dir written by captureState`));
  const raw = Object.fromEntries(await Promise.all(INPUTS.map(async (name) => [name, await readOptional(join(dir, 'passive', name))])));
  if (!raw['index.jsonl']) refuse(`${dir}: passive/index.jsonl not found; no capture is indexed there`);
  if (!raw['candidates.json']) refuse(`${dir}: passive/candidates.json not found; run detect.mjs on this dir first`);
  const index = parseIndex(raw['index.jsonl'].toString('utf8'), dir);
  const parse = (name) => (raw[name] === null ? null : jsonOf(raw[name].toString('utf8'), `${dir}: passive/${name}`));
  const reached = await loadReached(dir).catch((error) => (error instanceof SyntaxError ? refuse(`${dir}: passive/reached.jsonl has a malformed line (${error.message})`) : Promise.reject(error)));
  // The latest capture per label, in first-seen order, as detect.mjs loadStates reads them.
  const states = [...new Map(index.map((e) => [e.label, e])).values()].map((e) => ({ label: e.label, url: e.url ?? null }));
  return { label, dir, paths: [...new Set([resolve(dir), await realpath(dir)])], files: [...names].sort(byCodePoint), states, duplicates: duplicateLabels(index),
    candidates: parse('candidates.json'), partitions: parse('partitions.json'), reached, digests: Object.fromEntries(INPUTS.filter((name) => raw[name]).map((name) => [name, sha256(raw[name])])) };
}

const within = (child, parent) => { const rel = relative(parent, child); return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)); };
// What captureState, trackReached and detect.mjs write. A passive/ dir holding any of it is P01 output, whether or not it was passed as an
// evidence dir (another run kept in a notes or observations tree), and a file so named is never read as notes or as an observation.
const P01_NAMES = new Set(['index.jsonl', 'reached.jsonl', 'candidates.json', 'candidates.md', 'partitions.json', 'partitions-v2.json', 'partitions-v2.md']);
const isP01Name = (name) => P01_NAMES.has(name) || /\.(?:facts|axe)\.json$/.test(name);
const NOT_PASSED = 'P01 capture output (a passive/ dir holding an index, candidates or capture files) of an evidence dir not passed here';
const P01_FILE = 'named like P01 output (index, reached, candidates, partitions, facts or axe file), not read';
async function outputSkip(dir, excluded) {
  const real = await realpath(dir); const owner = excluded.find((x) => within(real, x.real));
  if (owner) return `passive output of evidence dir ${owner.label}`;
  return basename(real) === 'passive' && (await readdir(dir)).some(isP01Name) ? NOT_PASSED : null;
}
// Files of a notes or observations source, recursively and in code-point order of names; P01 output is skipped whole.
async function walk(dir, shown, kind, excluded) {
  const skip = await outputSkip(dir, excluded);
  if (skip) return [{ path: shown, skip }];
  const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => byCodePoint(a.name, b.name));
  const out = [];
  for (const e of entries) {
    const full = join(dir, e.name); const view = join(shown, e.name);
    if (e.isSymbolicLink()) out.push({ path: view, skip: 'symbolic link, not followed' });
    else if (e.isDirectory()) out.push(...await walk(full, view, kind, excluded));
    else if (!e.isFile()) out.push({ path: view, skip: 'not a regular file' });
    else if (!KINDS[kind].extensions.includes(extname(e.name).toLowerCase())) out.push({ path: view, skip: KINDS[kind].other });
    else if (isP01Name(e.name)) out.push({ path: view, skip: P01_FILE });
    else out.push({ path: view, full });
  }
  return out;
}
async function listSource(path, kind, excluded) {
  const info = await stat(path).catch((error) => refuse(`${kind} ${path} cannot be read (${error.code})`));
  if (info.isDirectory()) return { kind: 'dir', container: path, canonicalContainer: await realpath(path), entries: await walk(path, path, kind, excluded) };
  // A single file is checked by its real path too, so a link into a passive/ dir is skipped like the dir.
  const real = await realpath(path); const owner = excluded.find((x) => within(real, x.real));
  const skip = owner ? `passive output of evidence dir ${owner.label}` : (await outputSkip(dirname(real), excluded))
    ?? ([path, real].some((p) => isP01Name(basename(p))) ? P01_FILE : null);
  return { kind: 'file', container: dirname(path), canonicalContainer: dirname(real), entries: [skip ? { path, skip } : { path, full: path }] };
}
// A notes file whose first line is this report's title, or an observation document carrying it, is an earlier report and is skipped.
async function loadSource(path, kind, excluded) {
  const { kind: shape, container, canonicalContainer, entries } = await listSource(path, kind, excluded);
  const files = []; const skipped = [];
  for (const entry of entries) {
    if (entry.skip) { skipped.push({ path: entry.path, reason: entry.skip }); continue; }
    const bytes = await readFile(entry.full); const text = bytes.toString('utf8');
    const doc = kind === 'observations' ? jsonOf(text, `observation ${entry.path}`) : null;
    const isReport = kind === 'notes' ? splitLines(text)[0] === `# ${TITLE}` : isObject(doc) && doc.title === TITLE;
    if (isReport) skipped.push({ path: entry.path, reason: KINDS[kind].report });
    else files.push({ path: entry.path, ...(kind === 'notes' ? { text } : { doc }), sha256: sha256(bytes) });
  }
  return { source: { path, kind: shape, files, skipped }, container, canonicalContainer };
}

// One evidence dir passed twice (under two labels, or through a symlink) would list every candidate twice; it is refused by real path.
async function assertDistinct(dirs) {
  const seen = new Map();
  for (const { label, dir } of dirs) {
    const real = await realpath(dir);
    if (seen.has(real)) refuse(`${label}=${dir} is the same evidence dir as ${seen.get(real)}; pass each evidence dir once`);
    seen.set(real, `${label}=${dir}`);
  }
}
// The output dir is compared by real path (symlinks resolved, also for the part that does not exist yet) with every dir it must stay out of.
const exists = (path) => stat(path).then(() => true, () => false);
async function realTarget(path) {
  let head = resolve(path); const tail = [];
  while (!(await exists(head)) && dirname(head) !== head) { tail.unshift(basename(head)); head = dirname(head); }
  return join(await realpath(head), ...tail);
}
async function assertOutside(out, guarded) {
  const target = await realTarget(out);
  for (const { path, what } of guarded) if (within(target, await realpath(path))) refuse(`--out ${out} is inside the ${what} ${path}; the report never writes into ${what}s`);
}
// --out is a writable dir, or created under one; a report path that already exists must be a regular file, never a symbolic link (which
// could redirect the write into an evidence, notes or observations dir) or a dir.
const REPORT_FILES = ['triage-coverage.json', 'triage-coverage.md'];
const WORKLIST_FILES = ['partitions-v2.json', 'partitions-v2.md'];
const lstatOrNull = (path) => lstat(path).catch((error) => (error.code === 'ENOENT' ? null : Promise.reject(error)));
async function assertWritable(out, leaves = REPORT_FILES) {
  let head = resolve(out);
  while (!(await exists(head)) && dirname(head) !== head) head = dirname(head);
  if (!(await stat(head)).isDirectory()) refuse(`--out ${out}: ${head} is not a directory`);
  await access(head, constants.W_OK).catch(() => refuse(`--out ${out}: ${head} is not writable`));
  if (head !== resolve(out)) return;
  for (const name of leaves) {
    const info = await lstatOrNull(join(out, name));
    if (info?.isSymbolicLink()) refuse(`--out ${out}: ${name} exists and is a symbolic link; the report replaces only regular files`);
    if (info && !info.isFile()) refuse(`--out ${out}: ${name} exists and is not a regular file; the report replaces only regular files`);
    if (info && info.nlink !== 1) refuse(`--out ${out}: ${name} has multiple links; the report replaces only singly-linked regular files`);
  }
}

// --- CLI ---
const USAGE = 'usage: triage-coverage.mjs [--partitions-v2] --out <dir> [--notes <file|dir>] [--observations <file|dir>] <evidence-dir | label=evidence-dir>...';
const OPTIONS = ['--out', '--notes', '--observations'];
const labelled = (arg) => { const m = NAMED_DIR.exec(arg); return m ? { label: m[1], dir: m[2] } : { label: basename(resolve(arg)), dir: arg }; };
export function parseArgs(argv) {
  const opts = { out: null, notes: null, observations: null }; const dirs = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]; const key = arg.slice(2);
    if (arg === '--partitions-v2' && !opts.partitionsV2) opts.partitionsV2 = true;
    else if (OPTIONS.includes(arg) && opts[key] === null && argv[i + 1] && !argv[i + 1].startsWith('--')) { opts[key] = argv[i + 1]; i += 1; }
    else if (arg.startsWith('--')) return null;
    else dirs.push(labelled(arg));
  }
  return opts.out && dirs.length ? { ...opts, dirs } : null;
}

const INPUT_CODES = new Set(['ENOENT', 'ENOTDIR', 'EISDIR', 'EACCES']);
const isInputError = (error) => error instanceof CoverageInputError || error instanceof SyntaxError || INPUT_CODES.has(error?.code);
async function loadAll(args) {
  const evidence = await Promise.all(args.dirs.map(({ label, dir }) => loadEvidence(dir, label)));
  await assertDistinct(args.dirs);
  const excluded = await Promise.all(args.dirs.map(async ({ label, dir }) => ({ label, real: await realpath(join(dir, 'passive')) })));
  const notes = args.notes ? await loadSource(args.notes, 'notes', excluded) : null;
  const observations = args.observations ? await loadSource(args.observations, 'observations', excluded) : null;
  await assertOutside(args.out, [...args.dirs.map(({ dir }) => ({ path: dir, what: 'evidence dir' })), ...(notes ? [notes.container, notes.canonicalContainer].map(path => ({ path, what: 'notes dir' })) : []),
    ...(observations ? [observations.container, observations.canonicalContainer].map(path => ({ path, what: 'observations dir' })) : [])]);
  const report = buildCoverage({ evidence, notes: notes?.source ?? null, observations: observations?.source ?? null });
  // Explicit derived analysis only: keep each selected directory's roles/states separate.
  // loadStates is the existing latest-label projection, never complete capture history.
  const worklists = args.partitionsV2 ? { scope: 'Saved-data planned checks, not executed; no owner verdict or sufficiency follows.', evidence: await Promise.all(evidence.map(async (e) => ({
    label: e.label, dir: e.dir, projection: 'latest capture per label; earlier duplicate-label captures remain unassessed', duplicateLabels: e.duplicates,
    missingArtifacts: report.reviewerIndex.find(r => r.source === e.label).states.flatMap(s => s.missing),
    worklist: partitionWorklistV2(await loadStates(e.dir)),
  }))) } : null;
  // Validate every input and every selected output leaf before the first write.
  await assertWritable(args.out, worklists ? [...REPORT_FILES, ...WORKLIST_FILES] : REPORT_FILES);
  return { report, worklists };
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) { console.error(USAGE); process.exit(2); }
  let loaded;
  try { loaded = await loadAll(args); } catch (error) {
    if (!isInputError(error)) throw error;
    console.error(`triage-coverage.mjs: ${error.message}`); process.exit(2);
  }
  const { report, worklists } = loaded;
  await mkdir(args.out, { recursive: true });
  await writeFile(join(args.out, 'triage-coverage.json'), JSON.stringify(report, null, 1));
  await writeFile(join(args.out, 'triage-coverage.md'), coverageMarkdown(report));
  if (worklists) {
    await writeFile(join(args.out, 'partitions-v2.json'), JSON.stringify(worklists, null, 1));
    await writeFile(join(args.out, 'partitions-v2.md'), ['# Saved-data partitions v2 (not executed)', '', worklists.scope,
      ...worklists.evidence.flatMap(e => ['', `# ${e.label} (${e.dir})`, '', e.projection,
        ...(e.duplicateLabels.length ? [`Duplicate labels: ${JSON.stringify(e.duplicateLabels)}; earlier captures unassessed.`] : []),
        ...(e.missingArtifacts.length ? [`Missing artifacts: ${e.missingArtifacts.join(', ')}.`] : []), ...partitionLinesV2(e.worklist)]), ''].join('\n'));
  }
  console.log(JSON.stringify(coverageSummary(report)));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
