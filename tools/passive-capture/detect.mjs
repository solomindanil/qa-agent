#!/usr/bin/env node
// Run the passive detectors over all states captured in one evidence dir:
//   node tools/passive-capture/detect.mjs <evidence-dir> [--dictionary <word list, one word per line>] [--pooled]
// Writes <evidence-dir>/passive/candidates.json and candidates.md. Every row needs a disposition from the agent. Without a word
// list the rare-variant family is reported as unassessed. Also writes partitions.json: input partitions derived from declared field
// attributes, planned checks that are not candidates and are never executed here (P01 never types). --pooled (opt-in) adds the pooled-style
// detectors (pooled-outlier, form-font, sibling-color), a `pooled` section in candidates.json and one in candidates.md; without it the
// output is unchanged.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { styleOutliers, crossStateAlignment, inputPaddingOutliers, primaryActionGeometry, optionFontOutliers, crossStateProperties, crossStateCoverage,
  brokenImageCandidates, imageCoverage, pooledPropertySpread, formFontOutlier, formFontCoverage, siblingColorDrift, siblingColorCoverage } from './style-detectors.mjs';
import { computedContrast, contrastCoverage, axeCandidates, nameCandidates, positiveTabindexCandidates, ungroupedChoiceCandidates, imgAltCandidates,
  focusOrderCandidates } from './a11y-detectors.mjs';
import { textHygieneCandidates } from './text-markers.mjs';
import { rareVariantCandidates, labelMismatchCandidates, wordingCoverage, loadDictionary, UNFIT } from './text-wording.mjs';
import { loadReached, reachedRemainder } from './reached.mjs';
import { partitionWorklist, partitionLines } from './partitions.mjs';

const ORDER = { high: 0, medium: 1, low: 2 };
const MAX_EVIDENCE = 6;
const STRUCTURE_FACTS = ['focusables', 'choiceGroups', 'images'];
const IMAGE_REASON = { svg: 'svg source', 'no-src': 'no source', pending: 'not loaded at capture' };
const LABEL_REASON = { 'no-identifier': 'no name or id word', 'wrapped-content': "label wraps a select's options or a textarea's content", diacritic: 'label word with a diacritic the name or id lacks' };
const layoutFactsMissing = (s) => !Array.isArray(s.facts?.images) || s.facts.images.some((i) => i.load === undefined)
  || (s.facts?.fields ?? []).some((f) => f.sig === undefined || f.containerW === undefined);

// Cross-page detectors compare captures of one viewport width with each other: a page captured at two widths is two pages, never
// one replacing the other, and a mobile capture never votes with desktop ones. Captures without a viewport form one group.
export function byViewport(states) {
  const groups = new Map();
  for (const s of states) { const w = s.facts?.viewport?.w ?? null; if (!groups.has(w)) groups.set(w, []); groups.get(w).push(s); }
  return [...groups.entries()];
}
const crossPage = (states) => byViewport(states).flatMap(([w, group]) => [...crossStateAlignment(group), ...crossStateProperties(group), ...inputPaddingOutliers(group),
  ...primaryActionGeometry(group)].map((c) => ({ ...c, key: `${c.key}@${w}` })));

// Pooled style (opt-in): low-confidence candidates that carry their basis. `property` is one pooledPropertySpread result, computed once.
const pooledCandidates = (states, property) => [...property.outliers, ...states.flatMap((s) => [...formFontOutlier(s), ...siblingColorDrift(s)])];

// A candidate may carry a rank (an array compared element by element, higher first). Within one merged row the best-ranked
// candidate gives the headline, severity and confidence, and evidence is ordered by rank; equal ranks keep their order.
const byRank = (a, b) => { for (let i = 0; i < Math.max(a.rank.length, b.rank.length); i += 1) if ((a.rank[i] ?? 0) !== (b.rank[i] ?? 0)) return (b.rank[i] ?? 0) - (a.rank[i] ?? 0); return 0; };
function mergeRows(raw) {
  const groups = new Map();
  for (const c of raw) { if (!groups.has(c.key)) groups.set(c.key, []); groups.get(c.key).push(c); }
  return [...groups.values()].map((group) => {
    const ordered = group.every((c) => c.rank) ? [...group].sort(byRank) : group; const [head] = ordered;
    return { detector: head.detector, severity: head.severity, confidence: head.confidence, what: head.what,
      states: [...new Set(group.map((c) => c.evidence.state))], evidence: ordered.slice(0, MAX_EVIDENCE).map((c) => c.evidence), ...(head.basis ? { basis: head.basis } : {}) };
  }).sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.detector.localeCompare(b.detector));
}
// Pooled rows (opt-in) come after the default rows and are numbered after them, so a default row keeps its id in a pooled run.
export function runDetectors(states, { dictionary = null, pooled = false, pooledProperty = null } = {}) {
  const raw = [
    ...states.flatMap((s) => [...styleOutliers(s), ...optionFontOutliers(s), ...computedContrast(s), ...axeCandidates(s), ...nameCandidates(s), ...textHygieneCandidates(s),
      ...brokenImageCandidates(s), ...positiveTabindexCandidates(s), ...ungroupedChoiceCandidates(s), ...imgAltCandidates(s), ...focusOrderCandidates(s)]),
    ...crossPage(states),
    ...states.flatMap((s) => labelMismatchCandidates(s)), ...rareVariantCandidates(states, { dictionary }),
  ];
  const extra = pooled ? mergeRows(pooledCandidates(states, pooledProperty ?? pooledPropertySpread(states))) : [];
  return [...mergeRows(raw), ...extra].map((c, i) => ({ id: `P${String(i + 1).padStart(3, '0')}`, ...c }));
}

const readIndex = async (dir) => (await readFile(join(dir, 'passive', 'index.jsonl'), 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line));

// captureState refuses a used label, but older evidence can hold one label more than once (also differing only in case,
// which a case-insensitive file system stores in one file). Such labels are reported, never collapsed silently.
export function duplicateLabels(index) {
  const groups = new Map();
  for (const { label } of index) { const key = String(label).toLowerCase(); groups.set(key, [...(groups.get(key) ?? []), label]); }
  return [...groups.entries()].filter(([, labels]) => labels.length > 1).sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, labels]) => ({ labels: [...new Set(labels)].sort(), captures: labels.length }));
}

export async function loadStates(dir) {
  const index = await readIndex(dir);
  const latest = [...new Map(index.map((e) => [e.label, e])).values()];
  return Promise.all(latest.map(async (e) => ({ label: e.label, url: e.url,
    facts: JSON.parse(await readFile(join(dir, 'passive', `${e.label}.facts.json`), 'utf8')),
    axe: JSON.parse(await readFile(join(dir, 'passive', `${e.label}.axe.json`), 'utf8')) })));
}

const ROUTE_SCOPE = 'Only routes a tracked page navigated to after tracking started are listed, and the ledger is complete only if stop() was awaited; this is not a route inventory.';
const reachedLines = (r) => (r.ledger === 'absent' ? ['Reached routes: no reached.jsonl ledger was recorded, so routes reached but not captured are unknown.'] : [
  `Reached routes: ${r.routes} distinct route(s) in reached.jsonl, compared by scheme, host, path and fragment without query values; ${r.captured} have a captured state. ${ROUTE_SCOPE}`,
  ...(r.uncaptured.length ? [`Reached, not captured, unassessed: ${r.uncaptured.length} route(s). This is remainder, not a defect: no detector inspected them, and no candidate there is not a pass.`,
    ...r.uncaptured.map((u) => `- \`${u}\``), ''] : [])]);
const duplicateLines = (groups) => (groups.length ? [`Labels captured more than once (compared ignoring case): ${groups.map((g) => `${g.labels.join('/')} ×${g.captures}`).join(', ')}. Older evidence: a later capture may have overwritten an earlier one's files, so earlier states under these labels can be unassessed.`] : []);
const axeCapLines = (states) => {
  const cut = states.flatMap((s) => (s.axe?.available ? s.axe.violations ?? [] : []).filter((v) => v.nodesTotal > v.nodes.length).map((v) => `${v.id} in ${s.label} (${v.nodes.length} of ${v.nodesTotal})`));
  return cut.length ? [`axe kept the first 20 nodes per rule: ${cut.join(', ')}. The other violating nodes are not listed, so no row for them is not a pass.`] : [];
};

const sumCoverage = (states) => byViewport(states).map(([, group]) => crossStateCoverage(group))
  .reduce((a, b) => ({ minStates: b.minStates, compared: a.compared + b.compared, notComparable: a.notComparable + b.notComparable, notCompared: a.notCompared + b.notCompared,
    propertiesNotCompared: a.propertiesNotCompared + b.propertiesNotCompared, differentFamilies: a.differentFamilies + b.differentFamilies }), crossStateCoverage([]));
const INFLECTIONS = '-s, -es, -ed, -ing, -er, -ly';
const UNASSESSED_RARE = 'rare-variant: unassessed (no dictionary supplied). Rare words are compared only against a caller-supplied word list (detect.mjs --dictionary FILE); no rare-variant row here says nothing about spelling.';
const percent = (share) => `${Math.round(share * 100)} %`;
const knows = (r) => `knows ${r.knownWords} of ${r.capturedWords} distinct captured words of 4 or more letters`;
const unfitLine = (r, dictionary) => `rare-variant: unassessed (${UNFIT}). The supplied word list (${dictionary.size} words) ${knows(r)} (${percent(r.knownShare)}), under half, `
  + 'so it does not describe this text; it must match the page language. No rare-variant row here says nothing about spelling.';
function wordingLines(wording, dictionary) {
  const fieldsPart = `${wording.fields.compared} field(s) had a label or placeholder compared with their own name or id and the other fields of their form`;
  if (!wording.rare.assessed) return { main: [wording.rare.reason === UNFIT ? unfitLine(wording.rare, dictionary) : UNASSESSED_RARE, `Wording: ${fieldsPart}; this is not a spell check.`], rareGap: [] };
  const fit = wording.rare.capturedWords ? `; it ${knows(wording.rare)}, ${percent(wording.rare.knownShare)}` : '';
  const notCompared = [wording.rare.withDiacritic ? `${wording.rare.withDiacritic} word(s) close to a frequent word but with a diacritic it lacks (often another language)` : '',
    wording.rare.properNouns ? `${wording.rare.properNouns} word(s) close to a frequent word but capitalised only mid-sentence (a name)` : ''].filter(Boolean);
  return { main: [`Wording: a word of 4 or more letters seen once was compared with close variants seen at least 3 times when it is not in the supplied dictionary (${dictionary.size} words${fit}), `
    + `not an inflection (${INFLECTIONS}) of a dictionary word or of a frequent captured word, and not capitalised only mid-sentence (a name); and ${fieldsPart}. `
    + 'A misspelling seen more than once or spelt as another dictionary word, a word without such a variant and text that was not captured are not checked; this is not a spell check.'],
  rareGap: notCompared.length ? [`Rare words not compared: ${notCompared.join('; ')}.`] : [] };
}

// Pooled-style summary (opt-in): spread rows, which are not candidates, and what each pooled detector compared or left out. `property`
// is the pooledPropertySpread result the rows came from, so one run computes it once.
const sumCounts = (a, b) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, typeof v === 'number' ? v + b[k] : sumCounts(v, b[k])]));
const NO_FACTS = { facts: { elements: [], fields: [], controls: [] } };
export function pooledSummary(states, property = pooledPropertySpread(states)) {
  const { spread, coverage } = property;
  return { spread, coverage: { properties: coverage, formFont: states.map((s) => formFontCoverage(s)).reduce(sumCounts, formFontCoverage(NO_FACTS)),
    siblingColor: states.map((s) => siblingColorCoverage(s)).reduce(sumCounts, siblingColorCoverage(NO_FACTS)) } };
}
const SPREAD_REASON = { 'no-clear-majority': () => 'no clear majority', 'majority-on-one-route': () => 'the majority is on one route',
  'state-change-on-route': (r) => `a capture of the same route has the majority value: ${r.sameRoute.join(', ')}`,
  'multi-property-variant': (r) => `differs in 2 or more look properties: ${r.variants.join(', ')}` };
const spreadValue = (prop, value) => (prop === 'width' ? `${value}%` : value);
// The report lists at most this many spread rows; candidates.json keeps all of them.
const MAX_SPREAD_ROWS = 40;
function pooledLines(summary) {
  const { spread, coverage: { properties: p, formFont: f, siblingColor: g } } = summary;
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const row = (r) => `| ${esc(r.subject)} | ${r.prop} | ${esc([...r.distribution.map((d) => `${spreadValue(r.prop, d.value)} (${d.states.join(', ')})`),
    ...(r.mixed.length ? [`mixed within the state (${r.mixed.join(', ')})`] : [])].join('; '))} | ${esc(SPREAD_REASON[r.reason](r))} |`;
  const omitted = spread.length - MAX_SPREAD_ROWS;
  return ['', '## Pooled style (opt-in): spread rows and coverage, not candidates', '',
    `Pooled properties: ${p.pools} pool(s) by origin, viewport width and role; ${p.kindsCompared} kind(s) seen in 2 or more states were compared, ${p.kindsInOneState} seen in one state were not; `
      + `${p.comparisons} property comparison(s): ${p.agreed} agreed, ${p.outliers} gave a pooled-outlier candidate, ${p.spread} spread row(s) below; ${p.withoutVotes} lacked two state values; `
      + `${p.interactiveItems} interactive item(s) (links, buttons, controls and items inside one) were compared without colour, background and weight`
      + `${p.statesNotPooled ? `; ${p.statesNotPooled} state(s) without a parseable origin were not pooled` : ''}. A state votes with a value more than half of its items share; `
      + 'a candidate needs 75 % of the voting states, at least 3 of them on at least 2 routes, an odd state whose route has no capture with the majority value, '
      + 'and an odd state differing in one look property only (another property counts when its most shared value is such a majority or no other state holds the odd value); '
      + 'a spread row lists the distribution without picking a side. The absence of candidates or spread rows does not establish PASS.',
    'Missing role or viewport means unknown, not equal identity; same-role/viewport comparability is not established for such pools. The current capture/CLI supplies no role qualification.',
    `A representative merged basis is not independent proof for every occurrence; path-selector collisions are possible and evidence is capped at ${MAX_EVIDENCE} occurrences. Inspect original saved facts/images for applicability and state; candidate counts are not unique bugs or additional coverage.`,
    `Form fonts: ${f.forms} form(s) with text-bearing members; font family compared in ${f.familyCompared} form(s) and font size within ${f.sizeCompared} group(s) of one role and `
      + 'sub-kind (submit buttons, other buttons and links apart; labels of text fields and of choices apart) in one form; '
      + `not compared: ${f.excluded.glyph} icon glyph(s), ${f.excluded.monospace} monospace text(s), ${f.ambiguous} label or help text(s) not named by fields of one form alone `
      + '(fields of several forms, in no form or not shown, or more such elements than fields naming the text), '
      + `${f.notLocated.label} label(s), ${f.notLocated.help} help text(s) and ${f.notLocated.control} control text(s) not located in the element facts, `
      + `${f.roleConvention} member(s) sharing another face with every member of their role, and ${f.singleRoleFamily} form(s) whose most shared family is held by one role only. `
      + 'Form membership is inferred from saved text and counts, not exact DOM ownership. The absence of candidates does not establish PASS.',
    'Help-text font detection is UNSUPPORTED on the current capture base: field hint facts are absent. Synthetic hint controls exercise detector logic only; no hint collector is added.',
    `Sibling colours: ${g.groupsCompared} group(s) of 4 or more look-alike items compared; ${g.groupsSmall} smaller group(s), ${g.interactive} interactive item(s) and `
      + `${g.glyph} glyph item(s) not compared; ${g.backgroundUnknown} grouped item(s) with an unknown background. The absence of candidates does not establish PASS.`,
    ...(spread.length ? ['', '| Kind | Property | Distribution | Reason |', '| --- | --- | --- | --- |', ...spread.slice(0, MAX_SPREAD_ROWS).map(row),
      ...(omitted > 0 ? ['', `${omitted} more spread row(s) are not shown here; candidates.json lists all ${spread.length} under pooled.spread.`] : [])] : ['No spread row.'])];
}

export function toMarkdown(list, states, { reached = reachedRemainder(null, states), duplicates = [], dictionary = null, partitions = partitionWorklist(states), pooled = false,
  summary = null } = {}) {
  const axeRan = states.filter((s) => s.axe?.available).length;
  const REASON = { unsupported_colour: 'unsupported colour', image: 'image background', translucent: 'translucent background', layer: 'image or gradient layer under the text',
    decorative_glyph: 'separator glyph between text' };
  const gaps = {}; for (const st of states) for (const [k, n] of Object.entries(contrastCoverage(st).unassessed ?? {})) gaps[k] = (gaps[k] ?? 0) + n;
  const gapTotal = Object.values(gaps).reduce((a, b) => a + b, 0);
  const gapLine = gapTotal ? [`Contrast not assessed: ${gapTotal} element(s) (${Object.entries(gaps).map(([k, n]) => `${REASON[k] ?? k} ${n}`).join(', ')}). No candidate there is not a pass.`] : [];
  const truncated = states.filter((s) => s.facts?.truncated).map((s) => s.label);
  const truncLine = truncated.length ? [`Facts truncated in: ${truncated.join(', ')} (element limit reached; text beyond it was not inspected).`] : [];
  const older = states.filter((s) => !STRUCTURE_FACTS.every((k) => Array.isArray(s.facts?.[k]))).map((s) => s.label);
  const olderLine = older.length ? [`Focus, choice-group and image facts absent in: ${older.join(', ')} (older capture); tabindex, grouping, image alt and focus order are unassessed there.`] : [];
  const kinds = sumCoverage(states);
  const kindLine = `Cross-page properties: ${kinds.compared} repeated item or field kind(s) seen on at least ${kinds.minStates} pages were compared; ${kinds.notCompared} seen on fewer pages were not compared.`;
  const kindGapLine = kinds.notComparable || kinds.propertiesNotCompared ? [`Not compared for lack of page values: ${kinds.notComparable} kind(s) seen on at least ${kinds.minStates} pages, and ${kinds.propertiesNotCompared} property comparison(s) of compared kinds (fewer than ${kinds.minStates} pages had a value that more than half of their items share). No candidate there is not a pass.`] : [];
  const familyLine = kinds.differentFamilies ? [`Not compared across type families: ${kinds.differentFamilies} kind(s) seen on at least ${kinds.minStates} pages use a different font family on every page (likely different design systems or products); capture one product per evidence dir. No candidate there is not a pass.`] : [];
  const imageGaps = {}; for (const st of states) for (const [k, n] of Object.entries(imageCoverage(st).unassessed)) imageGaps[k] = (imageGaps[k] ?? 0) + n;
  const imageGapTotal = Object.values(imageGaps).reduce((a, b) => a + b, 0);
  const imageLine = imageGapTotal ? [`Image loading not assessed: ${imageGapTotal} image(s) (${Object.keys(IMAGE_REASON).filter((k) => imageGaps[k]).map((k) => `${IMAGE_REASON[k]} ${imageGaps[k]}`).join(', ')}). No candidate there is not a pass.`] : [];
  const layoutOlder = states.filter(layoutFactsMissing).map((s) => s.label);
  const layoutOlderLine = layoutOlder.length ? [`Field kind, field container or image load facts not recorded in: ${layoutOlder.join(', ')} (older capture); cross-page field properties and failed images are unassessed there.`] : [];
  const wording = wordingCoverage(states, { dictionary }); const labelGaps = wording.fields.unassessed; const wordingText = wordingLines(wording, dictionary);
  const labelGapLine = wording.fields.incomplete ? [`Field labels not fully compared: ${wording.fields.incomplete} field(s) (${Object.keys(LABEL_REASON).filter((k) => labelGaps[k]).map((k) => `${LABEL_REASON[k]} ${labelGaps[k]}`).join(', ')}). No candidate there is not a pass.`] : [];
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [`# Passive capture candidates`, '',
    `${list.length} candidates from ${states.length} captured states (axe ran on ${axeRan}; computed contrast was used for the rest).`,
    ...reachedLines(reached), ...duplicateLines(duplicates), ...axeCapLines(states), ...gapLine, ...truncLine, ...olderLine, kindLine, ...kindGapLine, ...familyLine, ...imageLine, ...layoutOlderLine, ...wordingText.main, ...labelGapLine, ...wordingText.rareGap,
    'No candidate is not a check of all text or states. Text is inspected only as captured: element text up to its first 160 characters and control names taken from visible text up to 80; markers beyond that are not inspected.',
    'Focus order is compared from DOM order and displayed boxes only; no key was pressed, so the actual Tab sequence is unassessed.',
    'A candidate is not a finding. Give every row a disposition in your existing notes: **finding** after your own sufficient check (then record it with record-observation), **hypothesis** with its basis and the missing evidence, **dismissed: <reason>**, or **unassessed** with the reason and the follow-up.', '',
    '| ID | Detector | Severity | Confidence | What | States | Evidence | Disposition |', '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...list.map((c) => `| ${c.id} | ${c.detector} | ${c.severity} | ${c.confidence} | ${esc(c.what).slice(0, 240)} | ${c.states.length} | ${esc(c.evidence[0].shot)} \`${esc(c.evidence[0].selector).slice(0, 80)}\` | |`),
    ...(pooled ? pooledLines(summary ?? pooledSummary(states)) : []), ...partitionLines(partitions)].join('\n') + '\n';
}

const USAGE = 'usage: detect.mjs <evidence-dir> [--dictionary <word list, one word per line>] [--pooled]';
function rareVariantSummary(states, dictionary) {
  if (!dictionary) return { assessed: false, reason: 'no dictionary supplied' };
  const { assessed, reason, capturedWords, knownWords, knownShare } = wordingCoverage(states, { dictionary }).rare;
  return { assessed, ...(reason ? { reason } : {}), dictionaryWords: dictionary.size, capturedWords, knownWords, knownShare };
}
function rareVariantLine(r) {
  if (r.assessed) return `assessed (${r.dictionaryWords} dictionary words; knows ${r.knownWords} of ${r.capturedWords} captured words)`;
  return r.reason === UNFIT ? `unassessed (${UNFIT}: it knows ${r.knownWords} of ${r.capturedWords} captured words)` : `unassessed (${r.reason})`;
}
// <dir>, then at most one `--dictionary <list>` (the list right after its flag) and at most one `--pooled`, in either order.
function parseArgs(argv) {
  const [dir, ...rest] = argv;
  if (!dir || dir.startsWith('--')) return null;
  let dictionary = null; let pooled = false;
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--pooled' && !pooled) pooled = true;
    else if (rest[i] === '--dictionary' && dictionary === null && rest[i + 1] && rest[i + 1] !== '--pooled') { dictionary = rest[i + 1]; i += 1; } else return null;
  }
  return { dir, dictionary, pooled };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) { console.error(USAGE); process.exit(2); }
  const { dir } = args;
  const dictionary = args.dictionary ? await loadDictionary(args.dictionary) : null;
  const states = await loadStates(dir);
  const pooledProperty = args.pooled ? pooledPropertySpread(states) : null;
  const list = runDetectors(states, { dictionary, pooled: args.pooled, pooledProperty });
  const reached = reachedRemainder(await loadReached(dir), states);
  const pooled = args.pooled ? pooledSummary(states, pooledProperty) : null;
  const duplicates = duplicateLabels(await readIndex(dir));
  const rareVariant = rareVariantSummary(states, dictionary);
  await writeFile(join(dir, 'passive', 'candidates.json'), JSON.stringify({ states: states.map((s) => s.label), count: list.length,
    contrastCoverage: Object.fromEntries(states.map((s) => [s.label, contrastCoverage(s)])), reached, duplicateLabels: duplicates, rareVariant, candidates: list, ...(pooled ? { pooled } : {}) }, null, 1));
  const partitions = partitionWorklist(states);
  await writeFile(join(dir, 'passive', 'partitions.json'), JSON.stringify(partitions, null, 1));
  await writeFile(join(dir, 'passive', 'candidates.md'), toMarkdown(list, states, { reached, duplicates, dictionary, partitions, pooled: args.pooled, summary: pooled }));
  const by = {}; for (const c of list) by[c.detector] = (by[c.detector] ?? 0) + 1;
  console.log(JSON.stringify({ states: states.length, candidates: list.length, byDetector: by,
    reachedNotCaptured: reached.ledger === 'recorded' ? reached.uncaptured.length : 'unknown (no reached.jsonl)', duplicateLabels: duplicates.length,
    rareVariant: rareVariantLine(rareVariant), partitions: `${partitions.count} planned, not executed`, ...(pooled ? { pooled: `${pooled.spread.length} spread row(s), not candidates` } : {}) }));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
