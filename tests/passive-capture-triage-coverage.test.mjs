// P01 triage coverage: a read-only report of the existing triage mentions per candidate and per reached route without a capture.
// No dispositions file, no schema, no status and no gate. Neutral domains only: D-A library loans (https://library.test),
// D-B greenhouse sensors (https://greenhouse.test).
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { appendFile, chmod, link, mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCoverage, coverageMarkdown, loadEvidence, noteBlocks, triageWords, cites, CoverageInputError, TITLE } from '../tools/passive-capture/triage-coverage.mjs';

const DETECT = fileURLToPath(new URL('../tools/passive-capture/detect.mjs', import.meta.url));
const TOOL = fileURLToPath(new URL('../tools/passive-capture/triage-coverage.mjs', import.meta.url));
const ROOT = await mkdtemp(join(tmpdir(), 'passive-triage-coverage-'));
after(() => rm(ROOT, { recursive: true, force: true }));
let serial = 0;
const fresh = async (name) => { const dir = join(ROOT, `${String(serial += 1).padStart(2, '0')}-${name}`); await mkdir(dir, { recursive: true }); return dir; };

// --- synthetic evidence dirs, as captureState, trackReached and detect.mjs write them ---
const LIB = 'https://library.test';
const GREEN = 'https://greenhouse.test';
const AT = '2026-10-14T00:00:00.000Z';
const RETURNS = `${LIB}/returns#/overdue`;
const NO_AXE = { available: false, reason: 'no axe source passed by the caller' };
const STYLE = { textAlign: 'start', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', color: 'rgb(33, 37, 41)', paddingLeft: '12px', paddingRight: '0px' };
const field = (name, type, constraints, label) => ({ sel: `#${name}`, tag: type === 'textarea' ? 'textarea' : 'input', type, textLike: !['file', 'checkbox', 'radio', 'range'].includes(type),
  id: name, name, placeholder: null, label: { text: label, source: 'label-for' }, form: 0, rect: { x: 100, y: 0, w: 300, h: 38 }, disabled: false, inactive: false, constraints, style: STYLE });
const icon = (sel) => ({ sel, tag: 'button', type: 'button', sig: 'button.icon', name: { text: '', source: 'none' }, form: null, rect: { x: 10, y: 10, w: 24, h: 24 }, disabled: false, inactive: false, style: STYLE });
const facts = (url, over = {}) => ({ url, elements: [], fields: [], controls: [], activeContext: { nativeModal: null, inertRoots: [], ariaModalDeclared: [] }, formCount: 0, ...over });
const REGISTER = [field('patronName', 'text', { required: true, maxlength: 40 }, 'Patron name'), field('email', 'email', { required: true }, 'Email'), field('notes', 'textarea', {}, 'Notes')];
const ADD_SENSOR = [field('threshold', 'number', { min: '0', max: '50', step: '0.5' }, 'Threshold'), field('calibration', 'file', { accept: '.csv' }, 'Calibration file')];

async function writeCaptures(dir, captures) {
  const passive = join(dir, 'passive'); await mkdir(passive, { recursive: true });
  for (const [label, f] of captures) {
    await writeFile(join(passive, `${label}.facts.json`), JSON.stringify(f));
    await writeFile(join(passive, `${label}.axe.json`), JSON.stringify(NO_AXE));
    await writeFile(join(passive, `${label}.png`), `synthetic screenshot of ${label}`);
    await appendFile(join(passive, 'index.jsonl'), `${JSON.stringify({ label, url: f.url })}\n`);
  }
}
const detect = (dir) => { const run = spawnSync(process.execPath, [DETECT, dir], { encoding: 'utf8' }); assert.equal(run.status, 0, run.stderr); };
async function evidenceDir(dir, captures, reached) {
  await writeCaptures(dir, captures);
  if (reached) await writeFile(join(dir, 'passive', 'reached.jsonl'), reached.map((url) => `${JSON.stringify({ url, at: AT })}\n`).join(''));
  detect(dir); return dir;
}
// D-A: two nameless icon buttons on the catalogue (P001 renew, P002 shelf), a "register patron" form, and a reached returns route never captured.
// D-B: one nameless icon button on the zones page (P001), an "add sensor" form, and no reached ledger.
async function twoDomains(name, root = null) {
  const base = root ?? await fresh(name);
  const loans = await evidenceDir(join(base, 'loans'), [['catalogue', facts(`${LIB}/catalogue`, { controls: [icon('#renew-icon'), icon('#shelf-icon')] })],
    ['register', facts(`${LIB}/register?patron=CANARY-Q`, { formCount: 1, fields: REGISTER })]], [`${LIB}/catalogue`, `${LIB}/register`, RETURNS]);
  const sensors = await evidenceDir(join(base, 'sensors'), [['zones', facts(`${GREEN}/zones`, { controls: [icon('#zone-icon')] })],
    ['add-sensor', facts(`${GREEN}/sensors/new`, { formCount: 1, fields: ADD_SENSOR })]], null);
  return { root: base, loans, sensors };
}
async function writeTree(dir, files) {
  for (const [name, content] of Object.entries(files)) { const path = join(dir, name); await mkdir(dirname(path), { recursive: true }); await writeFile(path, content); }
  return dir;
}
// The CLI runs in the scratch root by default, so a mis-parsed option can never create a dir inside the repository.
const runTool = (args, { cwd = ROOT } = {}) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', cwd });
const usage = (args, re, opts) => { const run = runTool(args, opts); assert.equal(run.status, 2, `${args.join(' ')}: ${run.stdout}${run.stderr}`); if (re) assert.match(run.stderr, re); };
const readOut = async (out) => ({ json: await readFile(join(out, 'triage-coverage.json'), 'utf8'), md: await readFile(join(out, 'triage-coverage.md'), 'utf8') });
const hex = (value, n) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, n);
const ICON_WHAT = 'button[type=button] control has no accessible name (no text, aria-label, labelledby, title or alt)';
const keyOf = (label, state, sel) => `cand:${label}:a11y-name.${hex(['a11y-name', ICON_WHAT, state, sel], 12)}`;
const RENEW = keyOf('loans', 'catalogue', '#renew-icon');
const SHELF = keyOf('loans', 'catalogue', '#shelf-icon');
const ZONE = keyOf('sensors', 'zones', '#zone-icon');
const DERIVED_FILES = ['partitions-v2.json', 'partitions-v2.md', 'triage-coverage.json', 'triage-coverage.md'];

test('combined CLI is opt-in, preserves default bytes and inputs, and keeps labelled old-fact worklists separate', async () => {
  const { root, loans, sensors } = await twoDomains('combined');
  await appendFile(join(loans, 'passive', 'index.jsonl'), JSON.stringify({ label: 'register', url: `${LIB}/register` }) + '\n');
  const notes = await writeTree(join(root, 'selected-notes'), { 'n.md': '- P001: hypothesis\n' });
  const before = await readFile(join(loans, 'passive', 'partitions.json'));
  const defaultOut = join(root, 'default'), out = join(root, 'derived');
  const operands = ['--notes', notes, `reader=${loans}`, `staff=${sensors}`];
  assert.equal(runTool(['--out', defaultOut, ...operands]).status, 0);
  assert.deepEqual((await readdir(defaultOut)).sort(), ['triage-coverage.json', 'triage-coverage.md']);
  const run = runTool(['--partitions-v2', '--out', out, ...operands]);
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual((await readdir(out)).sort(), DERIVED_FILES);
  assert.deepEqual(await readOut(out), await readOut(defaultOut), 'ordinary report bytes unchanged');
  const bytes = await Promise.all(DERIVED_FILES.map(name => readFile(join(out, name))));
  const v2 = JSON.parse(bytes[0]);
  assert.deepEqual(v2.evidence.map(e => e.label), ['reader', 'staff']);
  assert.deepEqual(v2.evidence[0].duplicateLabels, [{ labels: ['register'], captures: 2 }]);
  assert.match(v2.evidence[0].projection, /latest capture per label/);
  assert.deepEqual(v2.evidence[0].worklist.inference.hintFactsMissing, ['catalogue', 'register']);
  assert.deepEqual(v2.evidence[1].worklist.inference.hintFactsMissing, ['zones', 'add-sensor']);
  const ideas = v2.evidence.flatMap(e => e.worklist.rows.filter(r => r.confidence !== 'declared'));
  assert.ok(ideas.length > 0);
  for (const idea of ideas) { assert.equal(idea.expectation, null); assert.equal(idea.applicability, 'unknown'); assert.equal(idea.status, 'not executed'); }
  assert.ok(v2.evidence[0].worklist.rows.every(r => !r.states.includes('add-sensor')));
  assert.match(bytes[1].toString(), /reader[\s\S]*staff/);
  assert.equal(runTool(['--partitions-v2', '--out', out, ...operands]).status, 0);
  assert.deepEqual(await Promise.all(DERIVED_FILES.map(name => readFile(join(out, name)))), bytes);
  assert.deepEqual(await readFile(join(loans, 'passive', 'partitions.json')), before);
  assert.equal(await readFile(join(notes, 'n.md'), 'utf8'), '- P001: hypothesis\n');
});

for (const leaf of DERIVED_FILES) for (const alias of ['symlink', 'hardlink']) test(`combined CLI validates ${leaf} ${alias} before any companion write`, async () => {
  const { root, loans } = await twoDomains(`all-leaf-${alias}`);
  const notes = await writeTree(join(root, 'notes'), { 'n.md': '- P001: hypothesis\n' });
  const input = join(notes, 'n.md'), out = join(root, 'derived'); await mkdir(out);
  const leafPath = join(out, leaf); if (alias === 'symlink') await symlink(input, leafPath); else await link(input, leafPath);
  const before = await readFile(input), identity = await stat(input);
  const result = runTool(['--partitions-v2', '--out', out, '--notes', notes, loans]);
  assert.equal(result.status, 2, result.stderr); assert.match(result.stderr, /symbolic link|multiple links/);
  assert.deepEqual(await readFile(input), before); assert.equal((await stat(input)).ino, identity.ino);
  assert.deepEqual(await readdir(out), [leaf]);
});

for (const leaf of DERIVED_FILES) test(`combined CLI protects canonical single-note container even when aliased to ${leaf}`, async () => {
  const { root, loans } = await twoDomains('combined-canonical');
  const out = join(root, 'derived'); await mkdir(out); const input = join(out, leaf); await writeFile(input, '- P001: hypothesis\n');
  const aliases = join(root, 'aliases'); await mkdir(aliases); const note = join(aliases, 'selected.md'); await symlink(input, note);
  const before = await readFile(input), identity = await stat(input);
  const result = runTool(['--partitions-v2', '--out', out, '--notes', note, loans]);
  assert.equal(result.status, 2, result.stderr); assert.match(result.stderr, /inside the notes dir/);
  assert.deepEqual(await readFile(input), before); assert.equal((await stat(input)).ino, identity.ino);
  assert.deepEqual(await readdir(out), [leaf]);
});

test('combined CLI completes state validation before outputs and keeps missing capture artifacts visible', async () => {
  const { root, loans } = await twoDomains('state-validation');
  await rm(join(loans, 'passive', 'catalogue.png'));
  const out = join(root, 'derived');
  assert.equal(runTool(['--partitions-v2', '--out', out, loans]).status, 0);
  const v2 = JSON.parse(await readFile(join(out, 'partitions-v2.json'), 'utf8'));
  assert.ok(v2.evidence[0].missingArtifacts.includes('passive/catalogue.png'));
  await writeFile(join(loans, 'passive', 'register.facts.json'), '{broken');
  const freshOut = join(root, 'invalid');
  const result = runTool(['--partitions-v2', '--out', freshOut, loans]);
  assert.equal(result.status, 2, result.stderr);
  await assert.rejects(readdir(freshOut), { code: 'ENOENT' });
});

test('generated v2 leaves selected as text sources are skipped rather than self-citing candidates', async () => {
  const { root, loans } = await twoDomains('generated-v2');
  const notes = await writeTree(join(root, 'notes'), { 'partitions-v2.md': '- P001: finding\n' });
  const observations = await writeTree(join(root, 'json-input'), { 'partitions-v2.json': JSON.stringify({ text: 'passive/catalogue.facts.json' }) });
  const out = join(root, 'derived'); const result = runTool(['--out', out, '--notes', notes, '--observations', observations, loans]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse((await readOut(out)).json);
  assert.deepEqual(report.sources.notes.read, []); assert.deepEqual(report.sources.observations.read, []);
  assert.equal(report.sources.notes.skipped.length, 1); assert.equal(report.sources.observations.skipped.length, 1);
  assert.equal(report.evidence[0].candidates.mentionFound, 0);
});

test('reversed labels retain each directory own missing-artifact provenance in JSON and Markdown', async () => {
  const { root, loans, sensors } = await twoDomains('reversed-labels');
  await rm(join(loans, 'passive', 'catalogue.png')); await rm(join(sensors, 'passive', 'zones.png'));
  const out = join(root, 'derived'); const result = runTool(['--partitions-v2', '--out', out, `z-reader=${loans}`, `a-staff=${sensors}`]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(await readFile(join(out, 'partitions-v2.json'), 'utf8'));
  assert.deepEqual(report.evidence.map(e => [e.label, e.missingArtifacts]), [['z-reader', ['passive/catalogue.png']], ['a-staff', ['passive/zones.png']]]);
  const md = await readFile(join(out, 'partitions-v2.md'), 'utf8');
  const reader = md.split('# z-reader')[1].split('# a-staff')[0], staff = md.split('# a-staff')[1];
  assert.match(reader, /Missing artifacts: passive\/catalogue\.png/); assert.doesNotMatch(reader, /passive\/zones\.png/);
  assert.match(staff, /Missing artifacts: passive\/zones\.png/); assert.doesNotMatch(staff, /passive\/catalogue\.png/);
});
const cite = (kind, token, alsoMatches = 0) => ({ kind, token, alsoMatches });
const tally = (total, mentionFound, onlySharedCitations, onlyOrdinalCitations, noMentionFound, citedWithoutTriageWord) => ({ total, mentionFound, onlySharedCitations, onlyOrdinalCitations,
  noMentionFound, citedWithoutTriageWord });
const COUNTS = 'Counts are not quality, and no PASS rule follows from them. No mention found is not a defect, not a status and not a gate: it means only that '
  + 'no mention was found in the sources read. A partition row is a planned check, not a candidate, and needs no triage mention.';
const ORDINAL_ONLY = '\n  - mention found only through an ordinal id, which follows the current detect.mjs order: a note written against another run can carry it; compare the copied text with the headline\n';
const LOANS_ARTIFACTS = ['passive/catalogue.facts.json', 'passive/catalogue.png', 'passive/candidates.md'];
const ABSENT = 'absent: no passive/reached.jsonl, so routes reached but not captured are unknown, not zero';
const mentionsOf = (report, label) => report.evidence.find((e) => e.label === label).candidates.items.map((i) => [i.id, i.mentionFound, i.mentions]);

test('healthy control: notes citing every candidate and the route without a capture with a triage word give a mention for each, word and location copied verbatim', async () => {
  const { root, loans } = await twoDomains('healthy');
  const notes = await writeTree(join(root, 'notes'), { 'loans.md': ['# Loans triage', '',
    '- P001 renew icon has no name',
    '  **Finding** after a screen-reader check; recorded as obs-0007.',
    '- P002 shelf icon: dismissed: decorative duplicate of the labelled shelf link',
    '',
    `The overdue list ${RETURNS} stays unassessed: it needs a seeded overdue loan.`, ''].join('\n') });
  const run = runTool(['--out', join(root, 'out'), '--notes', notes, loans]);
  assert.equal(run.status, 0, run.stderr);
  const { json, md } = await readOut(join(root, 'out'));
  const report = JSON.parse(json); const file = join(notes, 'loans.md');
  assert.deepEqual(report.totals.candidates, tally(2, 2, 0, 2, 0, 0), 'both are found only through their ordinal ids');
  assert.deepEqual(mentionsOf(report, 'loans'), [
    ['P001', true, [{ via: 'notes', file, lines: [3, 4], cites: [cite('id', 'P001')], words: ['Finding'], text: '- P001 renew icon has no name\n  **Finding** after a screen-reader check; recorded as obs-0007.' }]],
    ['P002', true, [{ via: 'notes', file, lines: [5, 5], cites: [cite('id', 'P002')], words: ['dismissed'], text: '- P002 shelf icon: dismissed: decorative duplicate of the labelled shelf link' }]]]);
  assert.deepEqual(report.evidence[0].routes, { ledger: 'recorded', reached: 3, captured: 2, uncaptured: 1, mentionFound: 1, onlySharedCitations: 0, onlyOrdinalCitations: 0, noMentionFound: 0,
    citedWithoutTriageWord: 0, items: [{ route: RETURNS, ref: `route:loans:${RETURNS}`, artifacts: ['passive/reached.jsonl', 'passive/candidates.md'], missingArtifacts: [], mentionFound: true,
      onlySharedCitations: false, onlyOrdinalCitations: false,
      mentions: [{ via: 'notes', file, lines: [7, 7], cites: [cite('route', RETURNS)], words: ['unassessed'], text: `The overdue list ${RETURNS} stays unassessed: it needs a seeded overdue loan.` }],
      citedWithoutTriageWord: [], citedUnderAnotherPath: [] }] });
  assert.deepEqual(JSON.parse(run.stdout), { evidenceDirs: 1, candidates: tally(2, 2, 0, 2, 0, 0),
    routes: { ledgerRecorded: ['loans'], ledgerAbsent: [], uncaptured: 1, mentionFound: 1, onlySharedCitations: 0, onlyOrdinalCitations: 0, noMentionFound: 0, citedWithoutTriageWord: 0 },
    notes: { read: 1, skipped: 0 }, observations: 'none given', meaning: COUNTS }, 'the one-line summary carries its meaning, so a copied line never reads as a pass');
  assert.match(md, /^### Candidates with no mention found \(0\)$/m);
  assert.match(md, /^### Candidates with a mention found \(2\)$/m);
  assert.ok(md.includes(`\n- P001 \`${RENEW}\` (a11y-name, medium/high): ${ICON_WHAT}\n`));
  assert.ok(md.includes(`\n  - notes \`${file}\` lines 3-4, cites \`P001\`; words as written: \`Finding\`\n    \`\`\`\n    - P001 renew icon has no name\n      **Finding** after a screen-reader check; recorded as obs-0007.\n    \`\`\`\n`), md);
  assert.ok(md.includes(`\n  - notes \`${file}\` line 5, cites \`P002\`; words as written: \`dismissed\`\n`));
  assert.match(md, /^\| loans \| 2 \| 2 \| 0 \| 2 \| 0 \| 0 \| 1 of 3 reached route\(s\): mention found 1, no mention found 0 \| 5: confidence not recorded 5 \|$/m);
  assert.equal(md.split(ORDINAL_ONLY).length - 1, 2, 'both candidates say that they are found only through an ordinal id');
  assert.ok(md.includes('\n| Evidence dir | Candidates | Mention found | Only through a shared citation or block | Only through an ordinal id | No mention found | Cited without a disposition word |'));
  assert.ok(md.includes(`\n${COUNTS}\n`));
  assert.ok(md.includes(`\n- Notes: \`${notes}\` (dir): 1 Markdown file(s) read, 4 block(s). Skipped: none.\n`));
  assert.match(md, /^- Observations: none given, so no observation mention can be found\.$/m);
  assert.doesNotMatch(json + md, /CANARY/, 'state URLs are reduced to routes; query values are never copied');
});

test('two evidence dirs: a key copied from the report finds one candidate, while an id present in both dirs is listed for both and counted as only through a shared citation', async () => {
  const { root, loans, sensors } = await twoDomains('keys');
  const notes = await writeTree(join(root, 'notes'), { 'triage.md': [`- ${RENEW}: finding, recorded as obs-0007`, `- ${SHELF}: dismissed: decorative duplicate`,
    `- ${ZONE}: hypothesis: the zone icon may get its name from a tooltip script`, '- P001: unassessed until the second run', ''].join('\n') });
  const file = join(notes, 'triage.md');
  assert.equal(runTool(['--out', join(root, 'out'), '--notes', notes, loans, sensors]).status, 0);
  const report = JSON.parse((await readOut(join(root, 'out'))).json);
  const shared = { via: 'notes', file, lines: [4, 4], cites: [cite('id', 'P001', 1)], words: ['unassessed'], text: '- P001: unassessed until the second run' };
  assert.deepEqual(mentionsOf(report, 'loans'), [
    ['P001', true, [{ via: 'notes', file, lines: [1, 1], cites: [cite('key', RENEW)], words: ['finding'], text: `- ${RENEW}: finding, recorded as obs-0007` }, shared]],
    ['P002', true, [{ via: 'notes', file, lines: [2, 2], cites: [cite('key', SHELF)], words: ['dismissed'], text: `- ${SHELF}: dismissed: decorative duplicate` }]]]);
  assert.deepEqual(mentionsOf(report, 'sensors'), [['P001', true, [{ via: 'notes', file, lines: [3, 3], cites: [cite('key', ZONE)], words: ['hypothesis'],
    text: `- ${ZONE}: hypothesis: the zone icon may get its name from a tooltip script` }, shared]]]);
  assert.deepEqual(report.totals.candidates, tally(3, 3, 0, 0, 0, 0), 'a key citation is neither shared nor ordinal');
  // The id alone cannot tell the two dirs apart: both P001 are found only through that shared citation, and P002 has no mention.
  const idOnly = await writeTree(join(root, 'id-only'), { 'triage.md': '- P001: unassessed until the second run\n' });
  assert.equal(runTool(['--out', join(root, 'out-id'), '--notes', idOnly, loans, sensors]).status, 0);
  const { json, md } = await readOut(join(root, 'out-id'));
  const second = JSON.parse(json);
  assert.deepEqual(second.totals.candidates, tally(3, 2, 2, 2, 1, 0));
  assert.deepEqual(second.evidence.map((e) => e.candidates.items.map((i) => [i.id, i.mentionFound, i.onlySharedCitations])),
    [[['P001', true, true], ['P002', false, false]], [['P001', true, true]]]);
  assert.ok(md.includes(`, cites \`P001\` (also matches 1 other item(s)); words as written: \`unassessed\`\n`));
  const onlyShared = '\n  - mention found only through a citation that also matches other items, or in a block that also cites other items; which one it is about is not shown\n';
  assert.equal(md.split(onlyShared).length - 1, 2, 'both P001 say that their only mention is shared');
  assert.ok(!(await readOut(join(root, 'out'))).md.includes(onlyShared), 'a key citation is not shared');
  assert.match(md, /^\| sensors \| 1 \| 1 \| 1 \| 1 \| 0 \| 0 \| absent: no passive\/reached\.jsonl, so routes reached but not captured are unknown, not zero \| 7: confidence not recorded 7 \|$/m);
});

test('broken control: a candidate never cited is listed as not found with its facts file, screenshot and candidates.md; not found is no status and no exit code', async () => {
  const { root, loans } = await twoDomains('broken');
  const notes = await writeTree(join(root, 'notes'), { 'loans.md': `- P001: finding after a screen-reader check\n- ${RETURNS}: unassessed, needs a seeded loan\n` });
  const run = runTool(['--out', join(root, 'out'), '--notes', notes, loans]);
  assert.equal(run.status, 0, 'no mention found never changes the exit code');
  const { json, md } = await readOut(join(root, 'out'));
  const report = JSON.parse(json);
  assert.deepEqual(report.evidence[0].candidates.items[1], { id: 'P002', ref: SHELF, detector: 'a11y-name', severity: 'medium', confidence: 'high', what: ICON_WHAT, states: ['catalogue'],
    artifacts: LOANS_ARTIFACTS, missingArtifacts: [], mentionFound: false, onlySharedCitations: false, onlyOrdinalCitations: false, mentions: [], citedWithoutTriageWord: [], citedUnderAnotherPath: [] });
  assert.deepEqual(report.totals.candidates, tally(2, 1, 0, 1, 1, 0));
  assert.match(md, /^### Candidates with no mention found \(1\)$/m);
  assert.ok(md.includes(`### Candidates with no mention found (1)\n\n- P002 \`${SHELF}\` (a11y-name, medium/high): ${ICON_WHAT}\n`
    + `  - states: catalogue; artifacts: \`${loans}/passive/catalogue.facts.json\`, \`${loans}/passive/catalogue.png\`, \`${loans}/passive/candidates.md\`\n`), md);
  assert.doesNotMatch(json, /"status":|"disposition":|"schema":|--strict/, 'no status, disposition, schema or gate is introduced');
  assert.match(report.scope, /No mention found means only that no such mention was found in the sources read: it is not a defect, not a status and not a gate\./);
  assert.match(md, /^Counts are not quality, and no PASS rule follows from them\./m);
});

test('a citation without a triage word is not a mention found: a heading above the word, a nested item under a parent with the word, a route with prose only', async () => {
  const { root, loans } = await twoDomains('wordless');
  const notes = await writeTree(join(root, 'notes'), { 'day1.md': ['### P001 renew icon', 'Checked with a screen reader; the tooltip is announced, so dismissed.', '',
    '- Shelf row: finding, see obs-0007', '  - P002 shelf icon checked by hand', '', `- ${RETURNS} opened once, no overdue loan seeded`, ''].join('\n') });
  const file = join(notes, 'day1.md');
  assert.equal(runTool(['--out', join(root, 'out'), '--notes', notes, loans]).status, 0);
  const { json, md } = await readOut(join(root, 'out'));
  const report = JSON.parse(json); const [e] = report.evidence;
  assert.deepEqual(e.candidates.items.map((i) => [i.id, i.mentionFound, i.mentions, i.citedWithoutTriageWord]), [
    ['P001', false, [], [{ via: 'notes', file, lines: [1, 1], cites: [cite('id', 'P001')], text: '### P001 renew icon' }]],
    ['P002', false, [], [{ via: 'notes', file, lines: [5, 5], cites: [cite('id', 'P002')], text: '  - P002 shelf icon checked by hand' }]]]);
  assert.deepEqual(e.routes.items[0].citedWithoutTriageWord, [{ via: 'notes', file, lines: [7, 7], cites: [cite('route', RETURNS)], text: `- ${RETURNS} opened once, no overdue loan seeded` }]);
  assert.deepEqual(report.totals.candidates, tally(2, 0, 0, 0, 2, 2));
  assert.equal(report.totals.routes.citedWithoutTriageWord, 1);
  assert.ok(md.includes(`\n  - cited without a disposition word: notes \`${file}\` line 1, cites \`P001\`\n    \`\`\`\n    ### P001 renew icon\n    \`\`\`\n`), md);
  assert.match(md, /^\| loans \| 2 \| 0 \| 0 \| 0 \| 2 \| 2 \| 1 of 3 reached route\(s\): mention found 0, no mention found 1 \| /m);
  // An observation then finds P001; its word-less note stays listed, but it no longer counts as cited without a disposition word.
  const obs = await writeTree(join(root, 'obs'), { 'renew.json': JSON.stringify({ actual: `Recorded for ${RENEW}` }) });
  assert.equal(runTool(['--out', join(root, 'out-obs'), '--notes', notes, '--observations', obs, loans]).status, 0);
  const both = JSON.parse((await readOut(join(root, 'out-obs'))).json);
  assert.deepEqual(both.totals.candidates, tally(2, 1, 0, 0, 1, 1));
  assert.deepEqual(both.evidence[0].candidates.items.map((i) => [i.id, i.mentionFound, i.citedWithoutTriageWord.length]), [['P001', true, 1], ['P002', false, 1]]);
});

test('observations: a recorded observation citing a capture file or the key is a mention found via observation, with file, JSON pointer and line; no word is inferred', async () => {
  const { root, loans, sensors } = await twoDomains('observations');
  const obs = await writeTree(join(root, 'observations'), {
    'zones-icon.json': JSON.stringify({ schemaVersion: 'observation-sample', scope: 'zones page', actual: 'The zone icon button has no accessible name; see passive/zones.facts.json and passive/zones.png.',
      result: 'fail', attachments: [], 'see/also': 'passive/zones.axe.json' }),
    'catalogue.json': JSON.stringify({ actual: 'Two icon buttons in passive/catalogue.png have no name.\nhypothesis: one shared icon component', limitations: ['not checked with a screen reader', `cites ${SHELF} as dismissed`] }),
    'register.json': JSON.stringify({ actual: 'The register form at passive/register.png was not submitted (P001 in the old run).' }),
    'returns.json': JSON.stringify({ actual: `Reached ${RETURNS}; the overdue list was empty` }) });
  const run = runTool(['--out', join(root, 'out'), '--observations', obs, loans, sensors]);
  assert.equal(run.status, 0, run.stderr);
  const { json, md } = await readOut(join(root, 'out'));
  const report = JSON.parse(json);
  const catalogue = join(obs, 'catalogue.json'); const zones = join(obs, 'zones-icon.json');
  const sharedShot = { via: 'observation', file: catalogue, pointer: '/actual', line: 1, cites: [cite('capture-file', 'passive/catalogue.png', 1)], words: [], text: 'Two icon buttons in passive/catalogue.png have no name.' };
  assert.deepEqual(mentionsOf(report, 'loans'), [['P001', true, [sharedShot]],
    ['P002', true, [sharedShot, { via: 'observation', file: catalogue, pointer: '/limitations/1', line: 1, cites: [cite('key', SHELF)], words: ['dismissed'], text: `cites ${SHELF} as dismissed` }]]]);
  assert.deepEqual(mentionsOf(report, 'sensors'), [['P001', true, [
    { via: 'observation', file: zones, pointer: '/actual', line: 1, cites: [cite('capture-file', 'passive/zones.facts.json'), cite('capture-file', 'passive/zones.png')], words: [],
      text: 'The zone icon button has no accessible name; see passive/zones.facts.json and passive/zones.png.' },
    { via: 'observation', file: zones, pointer: '/see~1also', line: 1, cites: [cite('capture-file', 'passive/zones.axe.json')], words: [], text: 'passive/zones.axe.json' }]]]);
  assert.deepEqual(report.totals.candidates, tally(3, 3, 1, 0, 0, 0), 'an ordinal id in an observation (register.json) is not a citation');
  assert.deepEqual(report.evidence[0].routes.items[0].mentions, [{ via: 'observation', file: join(obs, 'returns.json'), pointer: '/actual', line: 1, cites: [cite('route', RETURNS)],
    words: [], text: `Reached ${RETURNS}; the overdue list was empty` }]);
  const sha = async (p) => `sha256:${createHash('sha256').update(await readFile(p)).digest('hex')}`;
  assert.deepEqual(report.sources.observations, { path: obs, kind: 'dir', read: [{ path: catalogue, strings: 3, sha256: await sha(catalogue) },
    { path: join(obs, 'register.json'), strings: 1, sha256: await sha(join(obs, 'register.json')) }, { path: join(obs, 'returns.json'), strings: 1, sha256: await sha(join(obs, 'returns.json')) },
    { path: zones, strings: 5, sha256: await sha(zones) }], skipped: [] });
  assert.equal(report.sources.notes, null);
  assert.ok(md.includes(`\n  - observation \`${zones}\` at \`/actual\` line 1, cites \`passive/zones.facts.json\`, \`passive/zones.png\`; no triage word in the citing line, none inferred\n`), md);
  assert.ok(md.includes(`\n  - observation \`${catalogue}\` at \`/actual\` line 1, cites \`passive/catalogue.png\` (also matches 1 other item(s)); no triage word in the citing line, none inferred\n`));
  assert.match(md, /^- Notes: none given, so no notes mention can be found\.$/m);
  assert.deepEqual(JSON.parse(run.stdout).observations, { read: 4, skipped: 0 });
});

test('an absent reached ledger is stated as absent, never as zero; a recorded ledger with every route captured lists none', async () => {
  const { root, sensors } = await twoDomains('absent');
  assert.equal(runTool(['--out', join(root, 'out'), sensors]).status, 0);
  const { json, md } = await readOut(join(root, 'out'));
  const report = JSON.parse(json);
  assert.deepEqual(report.evidence[0].routes, { ledger: 'absent', meaning: ABSENT });
  assert.deepEqual(report.totals.routes, { ledgerRecorded: [], ledgerAbsent: ['sensors'], uncaptured: 0, mentionFound: 0, onlySharedCitations: 0, onlyOrdinalCitations: 0, noMentionFound: 0,
    citedWithoutTriageWord: 0 });
  assert.match(md, /^Reached routes: absent: no passive\/reached\.jsonl, so routes reached but not captured are unknown, not zero\.$/m);
  assert.match(md, /\| absent: no passive\/reached\.jsonl, so routes reached but not captured are unknown, not zero \|/);
  const recorded = buildCoverage({ evidence: [source('desk', { reached: [{ url: `${LIB}/desk`, at: AT }, { url: `${LIB}/desk?patron=CANARY-Q`, at: AT }] })] });
  assert.deepEqual(recorded.evidence[0].routes, { ledger: 'recorded', reached: 1, captured: 1, uncaptured: 0, mentionFound: 0, onlySharedCitations: 0, onlyOrdinalCitations: 0, noMentionFound: 0,
    citedWithoutTriageWord: 0, items: [] });
  const recordedMd = coverageMarkdown(recorded);
  assert.match(recordedMd, /\| none of 1 reached route\(s\) \|/);
  assert.match(recordedMd, /^Reached routes: 1 distinct, 1 with a captured state, 0 without\. A route without a capture has no facts or screenshot\.$/m);
  assert.doesNotMatch(JSON.stringify(recorded) + recordedMd, /CANARY/);
});

const snapshot = async (dir) => {
  const out = {};
  const walk = async (d) => { for (const e of (await readdir(d, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const p = join(d, e.name); if (e.isDirectory()) await walk(p); else out[p] = hex((await readFile(p)).toString('base64'), 64);
  } };
  await walk(dir); return out;
};

test('byte-identical for the same inputs across runs, output dirs and argument order; only the two report files are written, never into evidence, notes or observation dirs', async () => {
  const { root, loans, sensors } = await twoDomains('identical');
  const notes = await writeTree(join(root, 'notes'), { 'a.md': '- P001: finding\n', 'b.md': `- ${RETURNS}: unassessed\n` });
  const obs = await writeTree(join(root, 'obs'), { 'x.json': JSON.stringify({ actual: 'see passive/zones.png' }) });
  const before = { ...(await snapshot(loans)), ...(await snapshot(sensors)), ...(await snapshot(notes)), ...(await snapshot(obs)) };
  assert.equal(runTool(['--out', join(root, 'a'), '--notes', notes, '--observations', obs, loans, sensors]).status, 0);
  assert.equal(runTool(['--out', join(root, 'b', 'nested'), '--notes', notes, '--observations', obs, loans, sensors]).status, 0);
  assert.equal(runTool([sensors, '--observations', obs, loans, '--notes', notes, '--out', join(root, 'c')]).status, 0);
  const [a, b, c] = [await readOut(join(root, 'a')), await readOut(join(root, 'b', 'nested')), await readOut(join(root, 'c'))];
  assert.equal(b.json, a.json); assert.equal(b.md, a.md);
  assert.equal(c.json, a.json, 'sources are sorted by label, so argument order changes nothing'); assert.equal(c.md, a.md);
  assert.deepEqual(await readdir(join(root, 'a')), ['triage-coverage.json', 'triage-coverage.md']);
  assert.deepEqual({ ...(await snapshot(loans)), ...(await snapshot(sensors)), ...(await snapshot(notes)), ...(await snapshot(obs)) }, before);
});

test('exit codes: 2 on usage (also the removed --dispositions and --strict), unreadable or undetected dirs, stale or malformed inputs, unreadable sources and an output inside an evidence, notes or observations dir; nothing is created', async () => {
  const { root, loans, sensors } = await twoDomains('exits');
  const notes = await writeTree(join(root, 'notes'), { 'a.md': '- P001: finding\n' });
  const obs = await writeTree(join(root, 'obs'), { 'ok.json': '{"actual":"x"}' });
  const out = join(root, 'out');
  usage([], /usage/); usage([loans], /usage/); usage(['--out', out], /usage/);
  usage(['--out', out, '--dispositions', join(root, 'd.json'), loans], /usage/); usage(['--out', out, '--strict', loans], /usage/);
  usage(['--out', out, '--notes', '--observations', obs, loans], /usage/); usage(['--out', out, '--notes', notes, '--notes', notes, loans], /usage/);
  usage(['--out', '--notes', notes, loans], /usage/);
  usage(['--out', out, join(root, 'nowhere')], /nowhere/);
  const undetected = join(root, 'undetected'); await writeCaptures(undetected, [['shelf', facts(`${LIB}/shelf`)]]);
  usage(['--out', out, undetected], /candidates\.json not found.*run detect\.mjs/);
  const stale = await evidenceDir(join(root, 'stale'), [['desk', facts(`${LIB}/desk`)]], null);
  await writeCaptures(stale, [['returns', facts(`${LIB}/returns`)]]);
  usage(['--out', out, stale], /stale.*re-run detect\.mjs/);
  const badIndex = await evidenceDir(join(root, 'bad-index'), [['desk', facts(`${LIB}/desk`)]], null);
  await appendFile(join(badIndex, 'passive', 'index.jsonl'), '{"label":\n');
  usage(['--out', out, badIndex], /index\.jsonl line 2 is not valid JSON/);
  const badReached = await evidenceDir(join(root, 'bad-reached'), [['desk', facts(`${LIB}/desk`)]], [`${LIB}/desk`]);
  await appendFile(join(badReached, 'passive', 'reached.jsonl'), 'not json\n');
  usage(['--out', out, badReached], /reached\.jsonl has a malformed line/);
  usage(['--out', out, '--notes', join(root, 'no-notes'), loans], /notes .*no-notes.* cannot be read \(ENOENT\)/);
  const badObs = await writeTree(join(root, 'bad-obs'), { 'broken.json': '{"actual":' });
  usage(['--out', out, '--observations', badObs, loans], /broken\.json is not valid JSON/);
  usage(['--out', join(loans, 'passive', 'coverage'), loans], /inside the evidence dir/); usage(['--out', loans, loans], /inside the evidence dir/);
  usage(['--out', join(notes, 'coverage'), '--notes', notes, loans], /inside the notes dir/);
  usage(['--out', join(notes, 'coverage'), '--notes', join(notes, 'a.md'), loans], /inside the notes dir/);
  usage(['--out', join(obs, 'coverage'), '--observations', obs, loans], /inside the observations dir/);
  const twin = await evidenceDir(join(root, 'other', 'loans'), [['shelf', facts(`${LIB}/shelf`)]], null);
  usage(['--out', out, loans, twin], /label "loans" is used by more than one evidence dir/);
  usage(['--out', out, `a=${loans}`, `b=${loans}`], /same evidence dir/);
  await symlink(loans, join(root, 'alias'));
  usage(['--out', out, loans, `alias=${join(root, 'alias')}`], /same evidence dir/);
  for (const path of [out, join(loans, 'passive', 'coverage'), join(notes, 'coverage'), join(obs, 'coverage'), join(ROOT, '--notes'), join(ROOT, '--observations')]) {
    assert.equal(await stat(path).then(() => 'exists', () => 'absent'), 'absent', `${path} is never created on bad input`);
  }
  const named = runTool(['--out', out, `desk-a=${loans}`, `desk-b=${twin}`, sensors]);
  assert.equal(named.status, 0, named.stderr);
  assert.deepEqual(JSON.parse((await readOut(out)).json).sources.evidence, [{ label: 'desk-a', dir: loans }, { label: 'desk-b', dir: twin }, { label: 'sensors', dir: sensors }]);
});

test('note blocks: a paragraph, a list item with its continuation lines but not its nested items, and every heading, table-row and fenced line on its own', () => {
  // Consecutive lines inside a fence (a pasted log) never join: "code P001" and "finding" stay two blocks.
  const text = ['Para one P001', 'para two', '', '- item a', '  continued', '  - nested b', '- item c', '# Head', '| t | r |', '```', 'code P001', 'finding', '', '```', 'tail one', 'tail two'].join('\n');
  const expected = [{ start: 1, end: 2, text: 'Para one P001\npara two' }, { start: 4, end: 5, text: '- item a\n  continued' }, { start: 6, end: 6, text: '  - nested b' },
    { start: 7, end: 7, text: '- item c' }, { start: 8, end: 8, text: '# Head' }, { start: 9, end: 9, text: '| t | r |' }, { start: 10, end: 10, text: '```' },
    { start: 11, end: 11, text: 'code P001' }, { start: 12, end: 12, text: 'finding' }, { start: 14, end: 14, text: '```' }, { start: 15, end: 16, text: 'tail one\ntail two' }];
  assert.deepEqual(noteBlocks(text), expected);
  assert.deepEqual(noteBlocks(`﻿${text.replace(/\n/g, '\r\n')}`), expected, 'CRLF and a byte-order mark give the same blocks');
  assert.deepEqual(noteBlocks(['~~~', '```', 'x P001', 'finding', '~~~', 'after', 'more'].join('\n')), [{ start: 1, end: 1, text: '~~~' }, { start: 2, end: 2, text: '```' },
    { start: 3, end: 3, text: 'x P001' }, { start: 4, end: 4, text: 'finding' }, { start: 5, end: 5, text: '~~~' }, { start: 6, end: 7, text: 'after\nmore' }], 'a fence closes only on its own marker');
  assert.deepEqual(noteBlocks(['````', '```', 'in', 'P001 dismissed', '````', 'out'].join('\n')).map((b) => b.text), ['````', '```', 'in', 'P001 dismissed', '````', 'out'],
    'a shorter run does not close a longer fence');
  assert.deepEqual(noteBlocks('text\n## H\nmore\nb | c\nd\n1. one\n2) two\n* three\n+ four\nfive').map((b) => [b.start, b.end]),
    [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 10]]);
  assert.deepEqual(noteBlocks('*P001* emphasised\nfinding\n-not an item\n#hashtag'), [{ start: 1, end: 4, text: '*P001* emphasised\nfinding\n-not an item\n#hashtag' }], 'no marker without a space');
  assert.deepEqual(noteBlocks(''), []);
  assert.deepEqual(noteBlocks('> - P001 looked\n> - P002 dismissed\n>\n> para one\n> para two\n> # quoted head\n>> - deeper'),
    [{ start: 1, end: 1, text: '> - P001 looked' }, { start: 2, end: 2, text: '> - P002 dismissed' }, { start: 4, end: 5, text: '> para one\n> para two' },
      { start: 6, end: 6, text: '> # quoted head' }, { start: 7, end: 7, text: '>> - deeper' }], 'a blockquote marker is read through: quoted items, a quoted blank line and a quoted heading split as unquoted ones');
  assert.deepEqual(noteBlocks('> ```\n> P001\n> finding\n> ```\nafter').map((b) => b.text), ['> ```', '> P001', '> finding', '> ```', 'after'], 'a quoted fence keeps its lines apart');
});

test('triage words are whole words copied as written; a token is cited only with its own boundaries', () => {
  assert.deepEqual(triageWords('**Finding** and dismissed: x; findings, unassessedness, _hypothesis_, re-dismissed, FINDING, Unassessed'), ['Finding', 'dismissed', 'hypothesis', 'FINDING', 'Unassessed']);
  assert.deepEqual(triageWords('refinding, prefinding, hypotheses, dismissedly, unassessed2'), []);
  const yes = (text, token, kind) => assert.equal(cites(text, token, kind), true, `${kind} ${token} in ${text}`);
  const no = (text, token, kind) => assert.equal(cites(text, token, kind), false, `${kind} ${token} in ${text}`);
  for (const t of ['see P001.', '(P001)', 'P001, P002', 'P001', "P001's"]) yes(t, 'P001', 'id');
  for (const t of ['P0011', 'xP001', 'P001_a', 'P001.5', '1P001']) no(t, 'P001', 'id');
  yes('P001 then P0011', 'P001', 'id'); yes('P0011 then P001', 'P001', 'id');
  const key = 'cand:desk:style.0123456789ab';
  for (const t of [`${key}.`, `route ${key}: x`, `(${key})`, `\`${key}\``, `${key}/note`]) yes(t, key, 'key');
  for (const t of [`${key}~1234abcd`, `x${key}`, `${key}-old`, `${key}.v2`, `${key}0`, `.${key}`, `~${key}`, `_${key}`]) no(t, key, 'key');
  const route = `${LIB}/returns`;
  for (const t of [`${route}?q=1`, `${route}.`, `<${route}>`, `${route}: x`, `${route}&a`, `(${route})`]) yes(t, route, 'route');
  for (const t of [`${route}/2`, `${route}#/x`, `${route}.html`, `x${route}`, `${route}%20`, `${route}-old`, `${route}~`, `${route}_x`, `+${route}`, `.${route}`]) no(t, route, 'route');
  const file = 'passive/desk.png';
  for (const t of [`/run/loans/${file}`, `${file}.`, `${file}:12`, `see ${file}`, `\\run\\${file}`]) yes(t, file, 'capture-file');
  for (const t of [`${file}.bak`, `my${file}`, `${file}~`, `.${file}`, `-${file}`, `${file}-2`, `${file}x`, `_${file}`]) no(t, file, 'capture-file');
  no('P001 dismissed', '', 'id');
  no('', '', 'route');
});

// --- pure controls on sources shaped like loadEvidence output ---
const evidenceOf = (state, selector) => ({ state, url: `${LIB}/${state}?patron=CANARY-Q`, selector, shot: `passive/${state}.png`, facts: `passive/${state}.facts.json` });
const cand = (id, detector, what, state, selector, over = {}) => ({ id, detector, severity: 'medium', confidence: 'high', what, states: [state], evidence: [evidenceOf(state, selector)], ...over });
const passiveFiles = (states, extra) => [...states.flatMap((l) => [`${l}.axe.json`, `${l}.facts.json`, `${l}.png`]), 'candidates.json', 'candidates.md', 'index.jsonl', ...extra].sort();
function source(label, { states = ['desk'], urls = {}, candidates = [], rows = null, reached = null, files, duplicates = [] } = {}) {
  return { label, dir: `/evidence/${label}`, files: files ?? passiveFiles(states, [...(rows ? ['partitions.json'] : []), ...(reached ? ['reached.jsonl'] : [])]),
    states: states.map((l) => ({ label: l, url: urls[l] ?? `${LIB}/${l}` })), duplicates, candidates: { states, count: candidates.length, candidates },
    partitions: rows ? { states, count: rows.length, rows } : null, reached, digests: {} };
}
const notesOf = (files) => ({ path: '/notes', kind: 'dir', files: Object.entries(files).map(([name, text]) => ({ path: `/notes/${name}`, text, sha256: 'sha256:0' })), skipped: [] });

test('identity: a cited key survives an ordinal shift, while an id written against an earlier run names whatever candidate holds it now; qualified keys never match their base', () => {
  const kept = cand('P001', 'style', 'Look-alike elements differ in fontSize: "Due" has 14px', 'desk', '.due');
  const added = cand('P001', 'a11y-name', 'Renew button has no accessible name', 'desk', '#renew');
  const keptKey = `cand:desk:style.${hex(['style', kept.what, 'desk', '.due'], 12)}`;
  const notes = notesOf({ 'run1.md': `- ${keptKey}: dismissed: designed emphasis\n- P001: dismissed: designed emphasis (written against run 1)\n` });
  const shifted = buildCoverage({ evidence: [source('desk', { candidates: [added, { ...kept, id: 'P002' }] })], notes });
  assert.deepEqual(shifted.evidence[0].candidates.items.map((i) => [i.id, i.ref, i.mentions.map((m) => [m.lines, m.cites])]), [
    ['P001', `cand:desk:a11y-name.${hex(['a11y-name', added.what, 'desk', '#renew'], 12)}`, [[[2, 2], [cite('id', 'P001')]]]],
    ['P002', keptKey, [[[1, 1], [cite('key', keptKey)]]]]]);
  const md = coverageMarkdown(shifted);
  assert.ok(md.includes(`- P001 \`${shifted.evidence[0].candidates.items[0].ref}\` (a11y-name, medium/high): Renew button has no accessible name\n`), 'the headline sits beside the copied note');
  assert.ok(md.includes('    - P001: dismissed: designed emphasis (written against run 1)\n'));
  const head = cand('P001', 'style', 'Look-alike elements differ in fontSize', 'desk', '.due');
  const wider = { ...head, id: 'P002', states: ['desk', 'returns'], evidence: [head.evidence[0], evidenceOf('returns', '.due')] };
  const twin = { ...head, id: 'P003' };
  const base = `cand:desk:style.${hex(['style', head.what, 'desk', '.due'], 12)}`;
  const { id: _a, ...headBody } = head; const { id: _b, ...widerBody } = wider;
  const [headKey, widerKey] = [`${base}~${hex(headBody, 8)}`, `${base}~${hex(widerBody, 8)}`];
  const qualified = buildCoverage({ evidence: [source('desk', { states: ['desk', 'returns'], candidates: [head, wider, twin] })],
    notes: notesOf({ 'n.md': `- ${base}: dismissed\n- ${headKey}: dismissed: designed emphasis\n` }) });
  assert.deepEqual(qualified.evidence[0].candidates.items.map((i) => [i.id, i.ref, i.mentions.map((m) => [m.lines, m.cites])]), [
    ['P001', headKey, [[[2, 2], [cite('key', headKey, 1)]]]], ['P002', widerKey, []], ['P003', headKey, [[[2, 2], [cite('key', headKey, 1)]]]]]);
  assert.deepEqual(qualified.evidence[0].candidates.items[1].artifacts, ['passive/desk.facts.json', 'passive/desk.png', 'passive/returns.facts.json', 'passive/returns.png', 'passive/candidates.md']);
  assert.doesNotMatch(JSON.stringify(qualified), /CANARY/, 'evidence URLs are never copied');
  // A key is not permanent: a new capture whose state now gives the head evidence (or a new headline, selector or dir label) changes it,
  // and a note citing the old key then drops to no mention found. The limits say so instead of claiming that a key does not shift.
  const reHeaded = { ...kept, states: ['returns', 'desk'], evidence: [evidenceOf('returns', '.due'), evidenceOf('desk', '.due')] };
  const moved = buildCoverage({ evidence: [source('desk', { states: ['desk', 'returns'], candidates: [reHeaded] })], notes: notesOf({ 'run1.md': `- ${keptKey}: dismissed: designed emphasis\n` }) });
  assert.deepEqual(moved.evidence[0].candidates.items.map((i) => [i.ref, i.mentionFound, i.mentions]), [[`cand:desk:style.${hex(['style', kept.what, 'returns', '.due'], 12)}`, false, []]]);
  assert.ok(moved.limits.some((l) => l.includes('A key survives an ordinal shift but changes when the headline, the state or selector of the first evidence, or the dir label '
    + 'changes (for a qualified key, anything in its row): a note citing the earlier key then finds no mention.')), moved.limits.join('\n'));
  assert.ok(!moved.limits.some((l) => /a key does not shift/i.test(l)));
});

test('routes are cited in full: a query may follow, a further path segment, fragment or extension may not, and a route without scheme and host is not matched', () => {
  const reached = [`${LIB}/desk`, `${LIB}/returns`, RETURNS, `${LIB}/loans/2`].map((url) => ({ url, at: AT }));
  const notes = notesOf({ 'routes.md': [`- ${LIB}/returns?patron=7: unassessed, needs a patron`, `- ${RETURNS}/late: dismissed`, `- see ${LIB}/loans/23 finding`,
    `- see ${LIB}/loans/2. finding`, '- library.test/returns#/overdue finding', ''].join('\n') });
  const report = buildCoverage({ evidence: [source('desk', { reached })], notes });
  assert.deepEqual(report.evidence[0].routes.items.map((i) => [i.route, i.mentionFound, i.mentions.map((m) => m.lines[0])]),
    [[`${LIB}/loans/2`, true, [4]], [`${LIB}/returns`, true, [1]], [RETURNS, false, []]]);
  assert.deepEqual([report.totals.routes.uncaptured, report.totals.routes.mentionFound, report.totals.routes.noMentionFound], [3, 2, 1]);
});

const renewCand = cand('P001', 'a11y-name', 'Renew button has no accessible name', 'desk', '#renew');
const shelfCand = cand('P002', 'a11y-name', 'Shelf button has no accessible name', 'desk', '#shelf');
const renewKeyOf = (label) => `cand:${label}:a11y-name.${hex(['a11y-name', renewCand.what, 'desk', '#renew'], 12)}`;
const observationsOf = (doc) => ({ path: '/obs', kind: 'dir', files: [{ path: '/obs/o.json', doc, sha256: 'sha256:0' }], skipped: [] });

test('a triage word inside a cited route, its query or fragment, a key (also its dir label) or any URL is part of the citation, not a disposition word', () => {
  const key = renewKeyOf('finding-run');
  const reached = [`${LIB}/desk`, `${LIB}/alerts/dismissed`, `${LIB}/returns`, `${LIB}/returns#/finding`].map((url) => ({ url, at: AT }));
  const evidence = [source('finding-run', { candidates: [renewCand], reached })];
  const notes = notesOf({ 'n.md': [`- opened ${LIB}/alerts/dismissed once`, `- ${LIB}/returns?filter=unassessed opened, the list was empty`, `- ${LIB}/returns#/finding opened`,
    `- ${key} checked by hand`, '- P001 compared with https://help.library.test/finding-aids', ''].join('\n') });
  const report = buildCoverage({ evidence, notes });
  const [e] = report.evidence;
  assert.deepEqual(e.candidates.items.map((i) => [i.id, i.ref, i.mentionFound, i.citedWithoutTriageWord.map((w) => [w.lines, w.cites])]),
    [['P001', key, false, [[[4, 4], [cite('key', key)]], [[5, 5], [cite('id', 'P001')]]]]]);
  assert.deepEqual(e.routes.items.map((i) => [i.route, i.mentionFound, i.citedWithoutTriageWord.map((w) => w.lines[0])]),
    [[`${LIB}/alerts/dismissed`, false, [1]], [`${LIB}/returns`, false, [2]], [`${LIB}/returns#/finding`, false, [3]]]);
  assert.deepEqual([report.totals.candidates.citedWithoutTriageWord, report.totals.routes.citedWithoutTriageWord, report.totals.routes.mentionFound], [1, 3, 0]);
  // The agent's own word beside the same citation still counts, copied once as written; an observation copies no word from its URL.
  const own = buildCoverage({ evidence, notes: notesOf({ 'n.md': `- ${LIB}/alerts/dismissed: dismissed, the banner is decorative\n- ${key}: Finding after a screen-reader check\n` }),
    observations: observationsOf({ actual: `Reached ${LIB}/returns?filter=unassessed; the list was empty` }) });
  assert.deepEqual(own.evidence[0].candidates.items[0].mentions.map((m) => [m.lines, m.words]), [[[2, 2], ['Finding']]]);
  assert.deepEqual(own.evidence[0].routes.items.map((i) => [i.route, i.mentions.map((m) => [m.via, m.words])]),
    [[`${LIB}/alerts/dismissed`, [['notes', ['dismissed']]]], [`${LIB}/returns`, [['observation', []]]], [`${LIB}/returns#/finding`, []]]);
});

test('a capture file written under a dir counts only under the evidence dir itself (as given or by real path); under another or a relative dir it is listed apart', () => {
  const annexCand = cand('P001', 'style', 'Look-alike elements differ in fontSize', 'desk', '.due');
  const desk = { ...source('desk', { candidates: [renewCand, shelfCand] }), paths: ['/real/evidence/desk'] };
  const run = (lines) => buildCoverage({ evidence: [desk, source('annex', { candidates: [annexCand] })], observations: observationsOf({ lines }) });
  const items = (report) => report.evidence.flatMap((e) => e.candidates.items.map((i) => [e.label, i.id, i.mentionFound, i.mentions.map((m) => m.cites), i.citedUnderAnotherPath.map((w) => w.cites)]));
  const foreign = run(['/old-runs/2026-09-01/passive/desk.png, all healthy', 'runs/desk/passive/desk.png checked']);
  const elsewhere = [{ kind: 'capture-file', token: 'passive/desk.png', prefix: '/old-runs/2026-09-01/', comparison: 'differs from the evidence dir' }];
  const relative = [{ kind: 'capture-file', token: 'passive/desk.png', prefix: 'runs/desk/', comparison: 'relative, not compared' }];
  assert.deepEqual(items(foreign), [['annex', 'P001', false, [], [elsewhere, relative]], ['desk', 'P001', false, [], [elsewhere, relative]], ['desk', 'P002', false, [], [elsewhere, relative]]]);
  assert.deepEqual(foreign.totals.candidates, tally(3, 0, 0, 0, 3, 0));
  assert.deepEqual(foreign.evidence[1].candidates.items[0].citedUnderAnotherPath[0], { via: 'observation', file: '/obs/o.json', pointer: '/lines/0', line: 1,
    cites: elsewhere, text: '/old-runs/2026-09-01/passive/desk.png, all healthy' });
  assert.ok(coverageMarkdown(foreign).includes('\n  - capture file cited under another path, not counted: observation `/obs/o.json` at `/lines/0` line 1, cites `passive/desk.png` '
    + 'under `/old-runs/2026-09-01/` (differs from the evidence dir)\n    ```\n    /old-runs/2026-09-01/passive/desk.png, all healthy\n    ```\n'));
  // Under the evidence dir, as given, by the real path loadEvidence adds or as a file URL, it counts only for that dir's items; bare, for every dir holding it.
  const own = (prefix) => [cite('capture-file', 'passive/desk.png', 1)].map((c) => ({ ...c, prefix }));
  const mine = run(['see /evidence/desk/passive/desk.png', 'see /real/evidence/desk/passive/desk.png', 'see file:///evidence/desk/passive/desk.png', 'bare passive/desk.png',
    'screenshot:passive/desk.png', 'quoted "/evidence/desk/passive/desk.png"', '(/evidence/desk/passive/desk.png)']);
  const bare = [cite('capture-file', 'passive/desk.png', 2)];
  assert.deepEqual(mine.evidence[1].candidates.items[0].mentions.map((m) => m.cites), [own('/evidence/desk/'), own('/real/evidence/desk/'), own('file:///evidence/desk/'), bare, bare,
    own('/evidence/desk/'), own('/evidence/desk/')], 'a label joined to the path ("screenshot:") is no dir, and a quote or bracket ends the dir written before the file');
  assert.deepEqual(mine.evidence[0].candidates.items[0].mentions.map((m) => m.cites), [bare, bare]);
  assert.ok(coverageMarkdown(mine).includes(', cites `passive/desk.png` under `/evidence/desk/` (also matches 1 other item(s)); no triage word'));
});

test('a block citing several items (sibling lines, a lazy continuation) records the others and never yields a mention standing alone; a blockquoted list is read item by item', () => {
  const run = (text) => buildCoverage({ evidence: [source('desk', { candidates: [renewCand, shelfCand], reached: [`${LIB}/desk`, `${LIB}/returns`].map((url) => ({ url, at: AT })) })],
    notes: notesOf({ 'n.md': text }) });
  const view = (report) => report.evidence[0].candidates.items.map((i) => [i.id, i.mentionFound, i.onlySharedCitations, i.mentions.map((m) => [m.lines, m.blockCitesOtherItems, m.words])]);
  const shapes = { siblings: 'P001 renew icon: looked, not decided yet\nP002 shelf icon: dismissed: decorative\n',
    lazy: '- P001 renew icon: looked, not decided yet\nP002 shelf icon: dismissed: decorative\n' };
  for (const [name, text] of Object.entries(shapes)) {
    const report = run(text);
    assert.deepEqual(view(report), [['P001', true, true, [[[1, 2], 1, ['dismissed']]]], ['P002', true, true, [[[1, 2], 1, ['dismissed']]]]], name);
    assert.deepEqual(report.totals.candidates, tally(2, 2, 2, 2, 0, 0), name);
    assert.ok(coverageMarkdown(report).includes('/n.md` lines 1-2, cites `P001`; the block also cites 1 other item(s); words as written: `dismissed`\n'), name);
  }
  const quoted = run('> - P001 renew icon: looked, not decided yet\n> - P002 shelf icon: dismissed: decorative\n');
  assert.deepEqual(view(quoted), [['P001', false, false, []], ['P002', true, false, [[[2, 2], undefined, ['dismissed']]]]]);
  assert.deepEqual(quoted.evidence[0].candidates.items[0].citedWithoutTriageWord.map((w) => w.lines), [[1, 1]]);
  // One item cited twice in a block (id and key) is no other item; a route cited beside a candidate is one.
  const twice = run(`- P001 (${renewKeyOf('desk')}): dismissed: decorative\n- P002 on ${LIB}/returns: unassessed, needs a seeded loan\n`);
  assert.deepEqual(view(twice), [['P001', true, false, [[[1, 1], undefined, ['dismissed']]]], ['P002', true, true, [[[2, 2], 1, ['unassessed']]]]]);
  assert.deepEqual(twice.evidence[0].routes.items.map((i) => [i.route, i.onlySharedCitations, i.mentions.map((m) => m.blockCitesOtherItems)]), [[`${LIB}/returns`, true, [1]]]);
  // Mixed: one mention through a shared citation, another in a block citing other items: still no mention standing alone.
  const mixed = buildCoverage({ evidence: [source('desk', { candidates: [renewCand] }), source('annex', { candidates: [{ ...renewCand }] })],
    notes: notesOf({ 'n.md': `- P001: dismissed: decorative\n\n${renewKeyOf('desk')} and ${renewKeyOf('annex')}: finding\n` }) });
  assert.deepEqual(mixed.evidence.map((e) => [e.label, e.candidates.items[0].onlySharedCitations]), [['annex', true], ['desk', true]]);
});

test('partition rows are planned checks: only their counts by confidence as written, no per-row item, and citing a row id changes nothing', async () => {
  const row = (id, confidence) => ({ id, states: ['desk'], form: 0, sel: '#card', partition: 'empty', ...(confidence === undefined ? {} : { confidence }) });
  const rows = [row('W001', 'declared'), row('W002', 'declared'), row('W003', 'stated'), row('W004', 'inferred'), row('W005'), row('W006'), row('W007', 'guessed')];
  const report = buildCoverage({ evidence: [source('desk', { rows })], notes: notesOf({ 'rows.md': '- W001: finding, the card field accepts an empty value\n' }) });
  const counts = report.evidence[0].partitionRows;
  assert.deepEqual(counts, { file: 'present', rows: 7, byConfidence: { declared: 2, stated: 1, inferred: 1, guessed: 1 }, confidenceNotRecorded: 2 });
  assert.deepEqual(Object.keys(counts.byConfidence), ['declared', 'stated', 'inferred', 'guessed']);
  assert.doesNotMatch(JSON.stringify(report), /W00\d|#card/, 'rows are counted, never listed');
  const md = coverageMarkdown(report);
  assert.match(md, /^7 row\(s\): declared 2, stated 1, inferred 1, guessed 1, confidence not recorded 2\. Counts only: rows are planned checks, not candidates, and need no triage mention\.$/m);
  assert.match(md, /\| 7: declared 2, stated 1, inferred 1, guessed 1, confidence not recorded 2 \|$/m);
  const none = buildCoverage({ evidence: [source('desk')] });
  assert.deepEqual(none.evidence[0].partitionRows, { file: 'absent' });
  assert.match(coverageMarkdown(none), /^No passive\/partitions\.json: partition rows are not counted\.$/m);
  assert.match(coverageMarkdown(buildCoverage({ evidence: [source('desk', { rows: [] })] })), /^0 row\(s\)\. Counts only/m);
  const { root, loans } = await twoDomains('partitions');
  assert.equal(runTool(['--out', join(root, 'out'), loans]).status, 0);
  assert.deepEqual(JSON.parse((await readOut(join(root, 'out'))).json).evidence[0].partitionRows, { file: 'present', rows: 5, byConfidence: {}, confidenceNotRecorded: 5 });
});

test('sources read and skipped: Markdown notes and JSON observations recursively, never symbolic links, other files, passive output of an evidence dir or an earlier report', async () => {
  const root = await fresh('skips');
  const notes = join(root, 'notes');
  await writeTree(notes, { 'day1.md': '- P001: finding\n', 'img.png': 'x', 'sub/day2.markdown': '- P002: dismissed: decorative\n',
    'old-coverage.md': `# ${TITLE}\n\n- P002 \`cand:run:x\` cited: finding\n` });
  await symlink(join(notes, 'day1.md'), join(notes, 'link.md'));
  // The evidence dir sits inside the notes dir: its passive/ output (candidates.md among it) is never read as notes.
  const run = await evidenceDir(join(notes, 'run'), [['catalogue', facts(`${LIB}/catalogue`, { controls: [icon('#renew-icon'), icon('#shelf-icon')] })]], null);
  const obs = await writeTree(join(root, 'obs'), { 'a.json': JSON.stringify({ actual: 'see passive/zones.png' }), 'notes.txt': 'passive/catalogue.png finding',
    'coverage.json': JSON.stringify({ title: TITLE, actual: 'passive/catalogue.png' }) });
  const result = runTool(['--out', join(root, 'out'), '--notes', notes, '--observations', obs, `run=${run}`]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse((await readOut(join(root, 'out'))).json);
  const sha = async (p) => `sha256:${createHash('sha256').update(await readFile(p)).digest('hex')}`;
  assert.deepEqual(report.sources.notes, { path: notes, kind: 'dir',
    read: [{ path: join(notes, 'day1.md'), lines: 1, blocks: 1, sha256: await sha(join(notes, 'day1.md')) },
      { path: join(notes, 'sub', 'day2.markdown'), lines: 1, blocks: 1, sha256: await sha(join(notes, 'sub', 'day2.markdown')) }],
    skipped: [{ path: join(notes, 'img.png'), reason: 'not Markdown (.md or .markdown)' }, { path: join(notes, 'link.md'), reason: 'symbolic link, not followed' },
      { path: join(notes, 'old-coverage.md'), reason: 'an earlier triage-coverage report, not notes' }, { path: join(notes, 'run', 'passive'), reason: 'passive output of evidence dir run' }] });
  assert.deepEqual(report.sources.observations, { path: obs, kind: 'dir', read: [{ path: join(obs, 'a.json'), strings: 1, sha256: await sha(join(obs, 'a.json')) }],
    skipped: [{ path: join(obs, 'coverage.json'), reason: 'an earlier triage-coverage report, not an observation' }, { path: join(obs, 'notes.txt'), reason: 'not JSON (.json)' }] });
  assert.deepEqual(report.evidence[0].candidates.items.map((i) => [i.id, i.mentions.map((m) => m.file)]), [['P001', [join(notes, 'day1.md')]], ['P002', [join(notes, 'sub', 'day2.markdown')]]]);
  const single = runTool(['--out', join(root, 'out-file'), '--notes', join(notes, 'day1.md'), `run=${run}`]);
  assert.equal(single.status, 0, single.stderr);
  const one = JSON.parse((await readOut(join(root, 'out-file'))).json).sources.notes;
  assert.deepEqual([one.kind, one.read.map((f) => f.path), one.skipped], ['file', [join(notes, 'day1.md')], []]);
  const generated = join(run, 'passive', 'candidates.md');
  assert.equal(runTool(['--out', join(root, 'out-generated'), '--notes', generated, `run=${run}`]).status, 0);
  assert.deepEqual(JSON.parse((await readOut(join(root, 'out-generated'))).json).sources.notes,
    { path: generated, kind: 'file', read: [], skipped: [{ path: generated, reason: 'passive output of evidence dir run' }] }, 'detect.mjs output is never read as notes');
  const md = (await readOut(join(root, 'out'))).md;
  assert.ok(md.includes(`Skipped: \`${join(notes, 'img.png')}\` (not Markdown (.md or .markdown)), \`${join(notes, 'link.md')}\` (symbolic link, not followed), `));
  assert.ok(report.limits.some((l) => l.includes('so a Disposition column filled in passive/candidates.md is not read')), report.limits.join('\n'));
});

const NOT_PASSED = 'P01 capture output (a passive/ dir holding an index, candidates or capture files) of an evidence dir not passed here';
const P01_FILE = 'named like P01 output (index, reached, candidates, partitions, facts or axe file), not read';

test('P01 output of another run inside a notes or observations tree is skipped whether or not it was passed, and so are files named like P01 output', async () => {
  const { root, loans } = await twoDomains('foreign-output');
  const archive = join(root, 'archive');
  const old = await evidenceDir(join(archive, 'run1'), [['catalogue', facts(`${LIB}/catalogue`, { controls: [icon('#renew-icon'), icon('#shelf-icon')] })]], [`${LIB}/catalogue`, RETURNS]);
  await writeTree(archive, { 'copied/candidates.json': await readFile(join(old, 'passive', 'candidates.json'), 'utf8'), 'copied/catalogue.facts.json': JSON.stringify(facts(`${LIB}/catalogue`)),
    'copied/candidates.md': await readFile(join(old, 'passive', 'candidates.md'), 'utf8'), 'kept.json': JSON.stringify({ actual: 'nothing cited' }), 'kept.md': '- nothing cited\n' });
  const run = runTool(['--out', join(root, 'out'), '--notes', archive, '--observations', archive, loans]);
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse((await readOut(join(root, 'out'))).json);
  const at = (name) => join(archive, ...name.split('/'));
  assert.deepEqual(report.sources.observations.skipped, [{ path: at('copied/candidates.json'), reason: P01_FILE }, { path: at('copied/candidates.md'), reason: 'not JSON (.json)' },
    { path: at('copied/catalogue.facts.json'), reason: P01_FILE }, { path: at('kept.md'), reason: 'not JSON (.json)' }, { path: at('run1/passive'), reason: NOT_PASSED }]);
  assert.deepEqual(report.sources.notes.skipped, [{ path: at('copied/candidates.json'), reason: 'not Markdown (.md or .markdown)' }, { path: at('copied/candidates.md'), reason: P01_FILE },
    { path: at('copied/catalogue.facts.json'), reason: 'not Markdown (.md or .markdown)' }, { path: at('kept.json'), reason: 'not Markdown (.md or .markdown)' }, { path: at('run1/passive'), reason: NOT_PASSED }]);
  assert.deepEqual([report.sources.notes.read.map((f) => f.path), report.sources.observations.read.map((f) => f.path)], [[at('kept.md')], [at('kept.json')]]);
  assert.deepEqual(report.totals.candidates, tally(2, 0, 0, 0, 2, 0), 'the other run\'s candidates.json never finds the current run\'s candidates');
  assert.deepEqual([report.totals.routes.mentionFound, report.totals.routes.noMentionFound], [0, 1]);
  // Passed as a single file, the other run's output and a file named like it are skipped too.
  assert.equal(runTool(['--out', join(root, 'out-file'), '--observations', join(old, 'passive', 'candidates.json'), '--notes', at('copied/candidates.md'), loans]).status, 0);
  const single = JSON.parse((await readOut(join(root, 'out-file'))).json).sources;
  assert.deepEqual([single.observations.skipped, single.notes.skipped], [[{ path: join(old, 'passive', 'candidates.json'), reason: NOT_PASSED }], [{ path: at('copied/candidates.md'), reason: P01_FILE }]]);
  // A single file given through a link is checked by its real path: a link into another run's passive/ is skipped like that dir.
  await mkdir(join(root, 'links')); const link = join(root, 'links', 'shot.json'); await symlink(join(old, 'passive', 'candidates.json'), link);
  assert.equal(runTool(['--out', join(root, 'out-link'), '--observations', link, loans]).status, 0);
  const linked = JSON.parse((await readOut(join(root, 'out-link'))).json);
  assert.deepEqual([linked.sources.observations.skipped, linked.totals.candidates.mentionFound], [[{ path: link, reason: NOT_PASSED }], 0]);
});

test('CLI: a capture file under the evidence dir counts under the dir as given, resolved or by real path; another run\'s path or another link\'s spelling does not', async () => {
  const { root, loans } = await twoDomains('prefix-cli');
  const real = await realpath(loans); await symlink(loans, join(root, 'alias'));
  await writeTree(join(root, 'obs'), { 'shot.json': JSON.stringify({ real: `${real}/passive/catalogue.png checked`, given: `${loans}/passive/catalogue.png checked`,
    link: `${root}/alias/passive/catalogue.png checked`, old: '/old-runs/2026-09-01/passive/catalogue.png, all healthy' }) });
  const view = (report) => report.evidence[0].candidates.items.map((i) => [i.id, i.mentions.map((m) => [m.pointer, m.cites[0].prefix, m.cites[0].alsoMatches]),
    i.citedUnderAnotherPath.map((w) => [w.pointer, w.cites[0].comparison])]);
  // Passed relative: the resolved and the real path count; the absolute spelling through a link (also $TMPDIR's on some systems) is not resolved.
  const relative = runTool(['--out', 'out', '--observations', 'obs', 'loans'], { cwd: root });
  assert.equal(relative.status, 0, relative.stderr);
  const first = JSON.parse((await readOut(join(root, 'out'))).json);
  const differs = 'differs from the evidence dir'; const linked = real !== loans;
  const counted = [['/real', `${real}/`, 1], ...(linked ? [] : [['/given', `${loans}/`, 1]])];
  const listed = [...(linked ? [['/given', differs]] : []), ['/link', differs], ['/old', differs]];
  assert.deepEqual(view(first), [['P001', counted, listed], ['P002', counted, listed]]);
  assert.deepEqual(first.sources.evidence, [{ label: 'loans', dir: 'loans' }], 'only the dir as given is echoed as a source');
  // Passed as an absolute path, that spelling counts as given.
  assert.equal(runTool(['--out', join(root, 'out-abs'), '--observations', join(root, 'obs'), loans]).status, 0);
  const second = JSON.parse((await readOut(join(root, 'out-abs'))).json);
  assert.deepEqual(view(second)[0], ['P001', [['/real', `${real}/`, 1], ['/given', `${loans}/`, 1]], [['/link', differs], ['/old', differs]]]);
});

test('explicit notes alias cannot overwrite its canonical scanned input container', async () => {
  const { root, loans } = await twoDomains('alias-input');
  const out = join(root, 'derived'); await mkdir(out);
  const original = join(out, 'triage-coverage.md'); await writeFile(original, '- P001: hypothesis, synthetic note\n');
  const aliases = join(root, 'aliases'); await mkdir(aliases);
  const alias = join(aliases, 'selected-note.md'); await symlink(original, alias);
  const bytes = await readFile(original), identity = await stat(original);
  const result = runTool(['--out', out, '--notes', alias, loans]);
  assert.deepEqual(await readFile(original), bytes, 'scanned notes bytes preserved');
  assert.equal((await stat(original)).ino, identity.ino, 'scanned notes inode preserved');
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(await readdir(out), ['triage-coverage.md']);
});

for (const kind of ['notes', 'evidence']) test(`multiply-linked output cannot truncate selected ${kind} input`, async () => {
  const { root, loans } = await twoDomains(`hardlink-${kind}`);
  const notes = join(root, 'notes'); await mkdir(notes); await writeFile(join(notes, 'n.md'), '- P001: hypothesis\n');
  const input = kind === 'notes' ? join(notes, 'n.md') : join(loans, 'passive', 'candidates.md');
  const out = join(root, 'derived'); await mkdir(out); await link(input, join(out, 'triage-coverage.md'));
  const bytes = await readFile(input), identity = await stat(input);
  const result = runTool(['--out', out, '--notes', notes, loans]);
  assert.deepEqual(await readFile(input), bytes, 'selected input bytes preserved');
  assert.equal((await stat(input)).ino, identity.ino, 'selected input inode preserved');
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(await readdir(out), ['triage-coverage.md']);
});

test('--out must be a writable dir whose report paths are absent or regular files; a file, a symbolic link or a dir in their place exits 2 and nothing is written', async () => {
  const { root, loans } = await twoDomains('out-guard');
  const asFile = join(root, 'out-file'); await writeFile(asFile, 'x');
  usage(['--out', asFile, loans], /--out .*out-file: .*out-file is not a directory/);
  usage(['--out', join(asFile, 'sub'), loans], /out-file is not a directory/);
  assert.equal(await readFile(asFile, 'utf8'), 'x');
  const target = join(loans, 'passive', 'candidates.md'); const before = await readFile(target, 'utf8');
  const linked = join(root, 'linked'); await mkdir(linked); await symlink(target, join(linked, 'triage-coverage.md'));
  usage(['--out', linked, loans], /triage-coverage\.md exists and is a symbolic link/);
  assert.equal(await readFile(target, 'utf8'), before, 'a planted link never redirects the write into an evidence dir');
  assert.deepEqual(await readdir(linked), ['triage-coverage.md'], 'the JSON report is not written either');
  const linkedJson = join(root, 'linked-json'); await mkdir(linkedJson); await symlink(join(loans, 'passive', 'candidates.json'), join(linkedJson, 'triage-coverage.json'));
  usage(['--out', linkedJson, loans], /triage-coverage\.json exists and is a symbolic link/);
  const dirInPlace = join(root, 'dir-in-place'); await mkdir(join(dirInPlace, 'triage-coverage.json'), { recursive: true });
  usage(['--out', dirInPlace, loans], /triage-coverage\.json exists and is not a regular file/);
  if (process.getuid?.() !== 0) {
    const locked = join(root, 'locked'); await mkdir(locked); await chmod(locked, 0o555);
    try { usage(['--out', join(locked, 'out'), loans], /locked is not writable/); } finally { await chmod(locked, 0o755); }
    assert.deepEqual(await readdir(locked), []);
  }
  const again = join(root, 'again');
  assert.equal(runTool(['--out', again, loans]).status, 0); assert.equal(runTool(['--out', again, loans]).status, 0, 'regular report files of an earlier run are replaced');
});

test('labels captured more than once are unknown, not zero: candidates of earlier captures under them are not listed', async () => {
  const root = await fresh('duplicates');
  const shelf = await evidenceDir(join(root, 'shelf'), [['desk', facts(`${LIB}/desk`, { controls: [icon('#renew-icon')] })], ['desk', facts(`${LIB}/desk`)]], null);
  assert.equal(runTool(['--out', join(root, 'out'), shelf]).status, 0);
  const { json, md } = await readOut(join(root, 'out'));
  assert.deepEqual(JSON.parse(json).evidence[0].unknown, [{ input: 'passive/index.jsonl', duplicateLabels: [{ labels: ['desk'], captures: 2 }],
    meaning: 'labels captured more than once: only the latest capture per label is listed in candidates.json, so candidates of earlier captures under them are not listed: unknown, not zero' }]);
  assert.match(md, /^Unknown, not zero: labels captured more than once \(desk ×2\); only the latest capture per label is listed in candidates\.json, so candidates of earlier captures under them are not listed\.$/m);
  assert.deepEqual(buildCoverage({ evidence: [source('desk')] }).evidence[0].unknown, []);
});

test('reviewer index lists every capture artifact per dir with its query-free route, flags a missing screenshot and lists unindexed files; an item names what is missing', async () => {
  const files = [...passiveFiles(['desk', 'returns'], ['reached.jsonl']).filter((f) => f !== 'returns.png'), 'old-capture.png'].sort();
  const report = buildCoverage({ evidence: [source('desk', { states: ['desk', 'returns'], urls: { returns: `${LIB}/returns?patron=CANARY-Q` }, reached: [{ url: `${LIB}/desk`, at: AT }], files,
    candidates: [cand('P001', 'a11y-name', 'Renew button has no accessible name', 'returns', '#renew')] })] });
  assert.deepEqual(report.reviewerIndex, [{ source: 'desk', dir: '/evidence/desk',
    inputs: [{ path: 'passive/index.jsonl', present: true }, { path: 'passive/reached.jsonl', present: true }, { path: 'passive/candidates.json', present: true },
      { path: 'passive/candidates.md', present: true }, { path: 'passive/partitions.json', present: false }],
    states: [{ label: 'desk', route: `${LIB}/desk`, facts: 'passive/desk.facts.json', screenshot: 'passive/desk.png', axe: 'passive/desk.axe.json', missing: [] },
      { label: 'returns', route: `${LIB}/returns`, facts: 'passive/returns.facts.json', screenshot: 'passive/returns.png', axe: 'passive/returns.axe.json', missing: ['passive/returns.png'] }],
    unindexed: ['passive/old-capture.png'] }]);
  assert.deepEqual(report.evidence[0].candidates.items[0].missingArtifacts, ['passive/returns.png']);
  const md = coverageMarkdown(report);
  assert.match(md, /^Unindexed files \(no index line names them\): `passive\/old-capture\.png`\.$/m);
  assert.match(md, /^\| returns \| `https:\/\/library\.test\/returns` \| `passive\/returns\.facts\.json` \| missing: `passive\/returns\.png` \| `passive\/returns\.axe\.json` \|$/m);
  assert.ok(md.includes('; missing: `passive/returns.png`\n'));
  assert.doesNotMatch(JSON.stringify(report) + md, /CANARY/);
  const { loans } = await twoDomains('reviewer');
  const src = await loadEvidence(loans, 'loans');
  assert.deepEqual([src.label, src.dir, src.states, src.duplicates, src.reached.length, src.partitions.count], ['loans', loans,
    [{ label: 'catalogue', url: `${LIB}/catalogue` }, { label: 'register', url: `${LIB}/register?patron=CANARY-Q` }], [], 3, 5]);
  assert.deepEqual(Object.keys(src.digests), ['index.jsonl', 'reached.jsonl', 'candidates.json', 'candidates.md', 'partitions.json']);
  assert.equal(src.digests['candidates.json'], `sha256:${createHash('sha256').update(await readFile(join(loans, 'passive', 'candidates.json'))).digest('hex')}`);
  const loaded = buildCoverage({ evidence: [src] });
  assert.deepEqual(loaded.reviewerIndex[0].inputs[2], { path: 'passive/candidates.json', present: true, sha256: src.digests['candidates.json'] });
});

test('report Markdown copies verbatim: a fenced note block widens its fence past any backtick run, and a pipe is escaped only inside table cells', () => {
  const notes = notesOf({ 'n.md': '- P001: finding, see ```js snippet``` and a|b\n' });
  const report = buildCoverage({ evidence: [source('desk', { urls: { desk: `${LIB}/desk#/shelf|a` }, candidates: [cand('P001', 'a11y-name', 'Renew button | has no name', 'desk', '#renew')] })], notes });
  const md = coverageMarkdown(report);
  assert.ok(md.includes('\n    ````\n    - P001: finding, see ```js snippet``` and a|b\n    ````\n'), md);
  assert.ok(md.includes('(a11y-name, medium/high): Renew button | has no name\n'));
  assert.ok(md.includes(`\n| desk | \`${LIB}/desk#/shelf\\|a\` | \`passive/desk.facts.json\` |`), md);
  assert.equal(report.evidence[0].candidates.items[0].mentions[0].text, '- P001: finding, see ```js snippet``` and a|b');
});

test('bad sources are refused: no evidence, duplicate or unsafe labels, stale or malformed candidates and partitions, malformed notes or observation sources', () => {
  const refuse = (input, re) => assert.throws(() => buildCoverage(input), (e) => e instanceof CoverageInputError && re.test(e.message), re.source);
  refuse({ evidence: [] }, /at least one evidence dir/);
  refuse({ evidence: [source('desk'), source('desk')] }, /label "desk" is used by more than one evidence dir/);
  refuse({ evidence: [source('my desk')] }, /label "my desk"/);
  refuse({ evidence: [{ ...source('desk'), candidates: { states: [], candidates: [] } }] }, /candidates\.json is stale.*re-run detect\.mjs/);
  refuse({ evidence: [{ ...source('desk'), candidates: { states: ['desk'] } }] }, /candidates\.json has no candidates list/);
  refuse({ evidence: [{ ...source('desk'), candidates: { states: ['desk'], candidates: [{ id: 'P001' }] } }] }, /candidates\.json row 0 is not a candidate row/);
  refuse({ evidence: [{ ...source('desk'), candidates: { states: ['desk'], candidates: [{ ...cand('P001', 'style', 'x', 'desk', '.a'), evidence: [] }] } }] }, /row 0 is not a candidate row/);
  refuse({ evidence: [source('desk', { rows: [{ id: 'W001' }] })].map((s) => ({ ...s, partitions: { states: [], rows: [] } })) }, /partitions\.json is stale/);
  refuse({ evidence: [{ ...source('desk'), partitions: { states: ['desk'], rows: [7] } }] }, /partitions\.json has no rows list/);
  refuse({ evidence: [{ ...source('desk'), partitions: { states: ['desk'] } }] }, /partitions\.json has no rows list/);
  refuse({ evidence: [source('desk')], notes: { path: '/notes', kind: 'dir', files: [{ path: '/notes/a.md', text: 7 }], skipped: [] } }, /notes source/);
  refuse({ evidence: [source('desk')], observations: { path: '/obs', kind: 'dir', files: 'x', skipped: [] } }, /observations source/);
});

test('triage-coverage.mjs stays product-agnostic and carries no dispositions file, schema or gate', async () => {
  const text = await readFile(TOOL, 'utf8');
  assert.doesNotMatch(text, /toolshop|practice software testing|onyx|nuanu|stack|localhost:\d+|127\.0\.0\.1:\d+/i);
  assert.doesNotMatch(text, /--strict|--dispositions|process\.exit\(3\)|schema/i);
});
