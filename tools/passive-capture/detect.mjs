#!/usr/bin/env node
// Run the passive detectors over all states captured in one evidence dir:
//   node tools/passive-capture/detect.mjs <evidence-dir>
// Writes <evidence-dir>/passive/candidates.json and candidates.md. Every row needs a disposition from the agent.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { styleOutliers, crossStateAlignment, inputPaddingOutliers, primaryActionGeometry, optionFontOutliers } from './style-detectors.mjs';
import { computedContrast, contrastCoverage, axeCandidates, nameCandidates } from './a11y-detectors.mjs';
import { textHygieneCandidates } from './text-markers.mjs';

const ORDER = { high: 0, medium: 1, low: 2 };
const MAX_EVIDENCE = 6;

export function runDetectors(states) {
  const raw = [
    ...states.flatMap((s) => [...styleOutliers(s), ...optionFontOutliers(s), ...computedContrast(s), ...axeCandidates(s), ...nameCandidates(s), ...textHygieneCandidates(s)]),
    ...crossStateAlignment(states), ...inputPaddingOutliers(states), ...primaryActionGeometry(states),
  ];
  const merged = new Map();
  for (const c of raw) {
    if (!merged.has(c.key)) merged.set(c.key, { detector: c.detector, severity: c.severity, confidence: c.confidence, what: c.what, states: [], evidence: [] });
    const m = merged.get(c.key);
    if (!m.states.includes(c.evidence.state)) m.states.push(c.evidence.state);
    if (m.evidence.length < MAX_EVIDENCE) m.evidence.push(c.evidence);
  }
  return [...merged.values()].sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.detector.localeCompare(b.detector))
    .map((c, i) => ({ id: `P${String(i + 1).padStart(3, '0')}`, ...c }));
}

export async function loadStates(dir) {
  const index = (await readFile(join(dir, 'passive', 'index.jsonl'), 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const latest = [...new Map(index.map((e) => [e.label, e])).values()];
  return Promise.all(latest.map(async (e) => ({ label: e.label, url: e.url,
    facts: JSON.parse(await readFile(join(dir, 'passive', `${e.label}.facts.json`), 'utf8')),
    axe: JSON.parse(await readFile(join(dir, 'passive', `${e.label}.axe.json`), 'utf8')) })));
}

export function toMarkdown(list, states) {
  const axeRan = states.filter((s) => s.axe?.available).length;
  const REASON = { unsupported_colour: 'unsupported colour', image: 'image background', translucent: 'translucent background' };
  const gaps = {}; for (const st of states) for (const [k, n] of Object.entries(contrastCoverage(st).unassessed ?? {})) gaps[k] = (gaps[k] ?? 0) + n;
  const gapTotal = Object.values(gaps).reduce((a, b) => a + b, 0);
  const gapLine = gapTotal ? [`Contrast not assessed: ${gapTotal} element(s) (${Object.entries(gaps).map(([k, n]) => `${REASON[k] ?? k} ${n}`).join(', ')}). No candidate there is not a pass.`] : [];
  const truncated = states.filter((s) => s.facts?.truncated).map((s) => s.label);
  const truncLine = truncated.length ? [`Facts truncated in: ${truncated.join(', ')} (element limit reached; text beyond it was not inspected).`] : [];
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [`# Passive capture candidates`, '',
    `${list.length} candidates from ${states.length} captured states (axe ran on ${axeRan}; computed contrast was used for the rest).`,
    ...gapLine, ...truncLine,
    'No candidate is not a check of all text or states.',
    'A candidate is not a finding. Give every row a disposition in your existing notes: **finding** after your own sufficient check (then record it with record-observation), **hypothesis** with its basis and the missing evidence, **dismissed: <reason>**, or **unassessed** with the reason and the follow-up.', '',
    '| ID | Detector | Severity | Confidence | What | States | Evidence | Disposition |', '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...list.map((c) => `| ${c.id} | ${c.detector} | ${c.severity} | ${c.confidence} | ${esc(c.what).slice(0, 240)} | ${c.states.length} | ${esc(c.evidence[0].shot)} \`${esc(c.evidence[0].selector).slice(0, 80)}\` | |`)].join('\n') + '\n';
}

async function main() {
  const dir = process.argv[2];
  if (!dir || process.argv.length !== 3) { console.error('usage: detect.mjs <evidence-dir>'); process.exit(2); }
  const states = await loadStates(dir);
  const list = runDetectors(states);
  await writeFile(join(dir, 'passive', 'candidates.json'), JSON.stringify({ states: states.map((s) => s.label), count: list.length,
    contrastCoverage: Object.fromEntries(states.map((s) => [s.label, contrastCoverage(s)])), candidates: list }, null, 1));
  await writeFile(join(dir, 'passive', 'candidates.md'), toMarkdown(list, states));
  const by = {}; for (const c of list) by[c.detector] = (by[c.detector] ?? 0) + 1;
  console.log(JSON.stringify({ states: states.length, candidates: list.length, byDetector: by }));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
