import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp, realpath, lstat } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hex = /^[a-f0-9]{40}$/u;
const zero = '0'.repeat(40);
const bounds = { timeout: 30_000, maxBuffer: 16 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
const groups = ['rootTests', 'freelandControls', 'kernelBuildContracts', 'kernelFull', 'kernelFocusedTests',
  'consoleBuild', 'consoleRuntime', 'consoleBrowser', 'consoleS01Lifecycle'];
const runtimeTests = new Set([
  'portable-entrypoints', 'runtime-paths', 'qa-product-skill', 'kernel-fixture-authority', 'bridge-cli-authority',
  'campaign-fixture-digests', 'workspace-snapshot', 'qa-outcomes-export', 'request-admission', 'qa-outcomes',
  'api-semantic-assertions', 'qa-campaign-files-umask', 'campaign-plan-concurrency', 'agent-observation-bridge', 'agent-observation-cli-reader',
  'agent-observation-view', 'qa-agent-observation-cli', 'qa-agent-observation-pair', 'campaign-outcomes',
  'campaign-verdict-copy', 'campaign-continuation-source-authority', 'campaign-continuation-readback',
  'campaign-continuation-readback-faults',
].map(name => `tests/unit/${name}.test.${name.startsWith('campaign-continuation-readback') ? 'mjs' : 'ts'}`));
const finitePaths = new Set(['tests/fixtures/browser-action-sequence/check.ts', 'tests/unit/browser-action-sequence.test.ts']);
const roles = new Set(['kernel', 'console', 'freeland', 'kernel-reporting-reference']);
const manifestFields = new Set(['id', 'path', 'commit', 'tree', 'bundle', 'sha256', 'runtimeAuthority', 'qualification']);

function fail(message) { throw new Error(message); }
function childEnv() {
  // Explicit environment, not a modified copy of caller credentials/configuration.
  return { PATH: process.env.PATH ?? '/usr/bin:/bin', LANG: 'C.UTF-8',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null',
    GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0', GIT_NO_REPLACE_OBJECTS: '1', GIT_NO_LAZY_FETCH: '1' };
}
function git(root, ...args) {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false',
    '-c', 'core.attributesFile=/dev/null', '-c', 'protocol.allow=never', '-c', 'protocol.file.allow=always',
    '-c', 'gc.auto=0', ...args], { ...bounds, cwd: root, env: childEnv() });
}
function safePath(path) { return typeof path === 'string' && !/[\\\x00-\x1f\x7f]/u.test(path) &&
  !isAbsolute(path) && path.split('/').every(part => part && part !== '.' && part !== '..' && !part.startsWith('-')); }
function ordinary(change) { return (!change.baseMode || change.baseMode === '100644') &&
  (!change.headMode || change.headMode === '100644') && change.status !== 'deleted'; }
function doc(change) { return (!change.baseMode || change.baseMode === '100644') && (!change.headMode || change.headMode === '100644') &&
  /^(?:README\.md|LICENSE(?:\.md|\.txt)?|docs\/.+\.md)$/u.test(change.path); }
function bootstrap(change) { return /^(?:\.github\/workflows\/|tools\/|tests\/|packages\/|package(?:-lock)?\.json$|[^/]+\.(?:json|[cm]?js|[cm]?ts|ya?ml)$)/u.test(change.path); }
function emptySelection() { return { rootTests: true, freelandControls: false, kernelBuildContracts: false, kernelFull: false,
  kernelFocusedTests: [], consoleBuild: false, consoleRuntime: false, consoleBrowser: 'none', consoleS01Lifecycle: false }; }

/** Pure fixed policy. Changed records carry literal tree modes; no import graph or filename-of-bundle inference. */
export function classifyImpact({ cohort, rootChanges = [], components = [], unknownReasons = [] }) {
  const selection = emptySelection(); const reasons = {}; const unsupportedChanges = [];
  for (const key of groups) reasons[key] = key === 'rootTests' ? 'root source packaging' : 'NOT RUN: no applicable verified delta';
  const enable = (key, why, value = true) => {
    if (key === 'consoleBrowser') selection[key] = selection[key] === 'all' || value === 'all' ? 'all' : value;
    else selection[key] = value;
    reasons[key] = reasons[key].startsWith('NOT RUN:') ? why : `${reasons[key]}; ${why}`;
  };
  const compatibility = why => {
    for (const key of ['kernelBuildContracts', 'consoleBuild', 'consoleRuntime', 'consoleS01Lifecycle']) enable(key, why);
    enable('consoleBrowser', why, 'all');
  };
  const full = why => {
    for (const key of ['rootTests', 'freelandControls', 'kernelBuildContracts', 'kernelFull', 'consoleBuild', 'consoleRuntime', 'consoleS01Lifecycle']) enable(key, why);
    enable('consoleBrowser', why, 'all'); selection.kernelFocusedTests = []; reasons.kernelFocusedTests = `NOT RUN separately: full Kernel selected (${why})`;
  };
  let broad = false;
  if (['integration', 'tag', 'manual'].includes(cohort)) { full(`full ${cohort} qualification boundary`); broad = true; }
  if (unknownReasons.length) { full(`unknown impact: ${unknownReasons.join('; ')}`); broad = true; }
  for (const record of rootChanges) if (!doc(record) && !record.sourceMetadata) {
    full(`${bootstrap(record) ? 'bootstrap policy change' : 'unmapped root path'}: ${record.path}`); broad = true;
  }
  for (const item of components) {
    if (!roles.has(item.id) || !item.verified) { full(`unverified/unknown component: ${item.id}`); broad = true; continue; }
    const paths = item.changedPaths ?? [];
    if (!paths.length || paths.every(doc)) continue;
    const content = paths.filter(record => !doc(record));
    const why = `${item.id} actual content delta: ${paths.map(record => record.path).join(', ')}`;
    if (item.id === 'kernel-reporting-reference') continue;
    if (item.id === 'freeland') { enable('freelandControls', why); continue; }
    if (item.id === 'kernel') {
      if (content.every(record => ordinary(record) && safePath(record.path) && /^tests\/.+\.test\.ts$/u.test(record.path))) {
        enable('kernelBuildContracts', why);
        if (!selection.kernelFull) {
          selection.kernelFocusedTests = [...new Set([...selection.kernelFocusedTests, ...content.map(record => record.path)])].sort();
          reasons.kernelFocusedTests = why;
        }
      } else { enable('kernelFull', why); compatibility(why); }
      continue;
    }
    for (const record of content) {
      if (ordinary(record) && finitePaths.has(record.path)) { enable('consoleBrowser', why, 'finite'); continue; }
      if (ordinary(record) && (runtimeTests.has(record.path) || /^(?:skills|\.claude\/skills)\/.+\.md$/u.test(record.path))) {
        for (const key of ['kernelBuildContracts', 'consoleRuntime', 'consoleS01Lifecycle']) enable(key, why); continue;
      }
      if (ordinary(record) && /^(?:src\/(?:components|primary-ui|styles)\/|src\/(?:App\.tsx|main\.tsx|index\.css)$|public\/|index\.html$)/u.test(record.path)) {
        compatibility(why); continue;
      }
      enable('kernelFull', why); compatibility(why);
      if (record.path.startsWith('tests/')) unsupportedChanges.push(`unmapped or removed Console test: ${record.path}`);
    }
  }
  if (selection.kernelFull) { selection.kernelFocusedTests = []; reasons.kernelFocusedTests = 'NOT RUN separately: full Kernel selected'; }
  if (broad) selection.kernelFocusedTests = [];
  return { selection, reasons, notSelected: groups.filter(key => selection[key] === false || selection[key] === 'none' || (Array.isArray(selection[key]) && !selection[key].length)), unsupportedChanges };
}

function tree(root, sha) {
  const result = new Map();
  for (const line of git(root, 'ls-tree', '-rz', '--full-tree', sha).split('\0').filter(Boolean)) {
    const at = line.indexOf('\t'); const match = /^(100644|100755|120000) blob ([a-f0-9]{40})$/u.exec(line.slice(0, at)); const path = line.slice(at + 1);
    if (at < 0 || !match || !safePath(path)) fail('unsupported tree entry or path');
    result.set(path, { mode: match[1], blob: match[2] });
  }
  return result;
}
function delta(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])].sort().flatMap(path => {
    const a = before.get(path); const b = after.get(path);
    return a?.mode === b?.mode && a?.blob === b?.blob ? [] : [{ path, status: !a ? 'added' : !b ? 'deleted' : 'modified', baseMode: a?.mode ?? null, headMode: b?.mode ?? null }];
  });
}
async function manifest(root) { return JSON.parse(await readFile(join(root, 'sources/manifest.v1.json'), 'utf8')); }
function verify(cli, root, mode, temporaryRoot) {
  try {
    const output = execFileSync(process.execPath, [cli, mode, '--root', root], { ...bounds, env: { ...childEnv(), TMPDIR: temporaryRoot }, cwd: root });
    const result = JSON.parse(output); if (result.status !== 'sources_verified') fail('invalid verifier result'); return result;
  } catch (error) { fail(`${mode} source verification failed: ${error.stderr?.toString().trim() || error.message}`); }
}
function semantics(before, after) {
  const problems = [];
  for (const [label, value] of [['base', before], ['head', after]]) {
    if (Object.keys(value).some(key => !['schemaVersion', 'components'].includes(key))) problems.push(`${label} unknown manifest field`);
    for (const entry of value.components) if (!roles.has(entry.id) || Object.keys(entry).some(key => !manifestFields.has(key))) problems.push(`${label} unknown component/manifest semantics`);
  }
  if (before.components.length !== after.components.length) problems.push('component added/deleted');
  for (const entry of after.components) {
    const prior = before.components.find(item => item.id === entry.id);
    if (!prior || prior.path !== entry.path || prior.runtimeAuthority !== entry.runtimeAuthority) problems.push(`component identity/authority changed: ${entry.id}`);
  }
  return problems;
}
async function metadata(repository, branch, sha) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { error: 'PR metadata unavailable: no read-only token' };
  try {
    const [owner, repo] = repository.split('/');
    const url = new URL(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`);
    url.searchParams.set('state', 'open'); url.searchParams.set('head', `${owner}:${branch}`); url.searchParams.set('per_page', '100');
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } });
    if (!response.ok) return { error: 'PR metadata lookup denied or failed' };
    const value = await response.json(); if (!Array.isArray(value) || value.length >= 100) return { error: 'PR metadata malformed or truncated' };
    const matches = value.filter(pr => pr.state === 'open' && pr.head?.repo?.full_name === repository && pr.base?.repo?.full_name === repository && pr.head?.ref === branch && pr.head?.sha === sha);
    if (matches.length > 1) return { error: 'PR metadata ambiguous same-head result' };
    if (matches.length && (!Number.isSafeInteger(matches[0].number) || matches[0].number < 1 || !hex.test(matches[0].base?.sha ?? ''))) return { error: 'PR metadata malformed identity' };
    return { pr: matches[0] ?? null };
  } catch { return { error: 'PR metadata lookup failure or timeout' }; }
}

/** A source-only selection plan. Head verification fails closed; unavailable base only broadens. */
export async function computeCiImpact({ root, eventName, event, ref = '', testedSha, repository, workflow, temporaryRoot }) {
  if (!isAbsolute(root ?? '') || !isAbsolute(temporaryRoot ?? '') || !hex.test(testedSha ?? '') || !['source', 'runtime'].includes(workflow) ||
      !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository ?? '') || !event || typeof event !== 'object' || Array.isArray(event)) fail('invalid selector arguments/SHA');
  const cohort = eventName === 'pull_request' ? 'pull_request' : eventName === 'workflow_dispatch' ? 'manual' :
    eventName === 'push' && ref.startsWith('refs/tags/') ? 'tag' : eventName === 'push' && ['refs/heads/develop', 'refs/heads/codex/stable-20260926'].includes(ref) ? 'integration' :
      eventName === 'push' && ref.startsWith('refs/heads/') ? 'feature' : 'unknown';
  let observed = {};
  try { if (workflow === 'source' && cohort === 'feature') observed = await metadata(repository, ref.slice('refs/heads/'.length), testedSha); }
  finally { delete process.env.GITHUB_TOKEN; delete process.env.GH_TOKEN; }
  if (await realpath(root) !== root || await realpath(temporaryRoot) !== temporaryRoot) fail('selector roots must be canonical, not symlinks');
  const cli = join(root, 'tools/workspace.mjs');
  if (git(root, 'rev-parse', 'HEAD').trim() !== testedSha) fail('tested SHA differs from actual HEAD');
  // The unchanged verifier checks normal local Git storage/config before this status reader.
  verify(cli, root, 'verify', temporaryRoot);
  if (git(root, 'status', '--porcelain=v1', '--untracked-files=all').length) fail('HEAD root is dirty');
  const head = { commit: testedSha, tree: git(root, 'rev-parse', 'HEAD^{tree}').trim() };
  const headManifest = await manifest(root); let base = { commit: null, tree: null, status: 'unavailable' }; let rootChanges = []; let components = [];
  const unknownReasons = observed.error ? [observed.error] : [];
  if (cohort === 'unknown') unknownReasons.push('unsupported event cohort');
  const baseSha = cohort === 'pull_request' ? event.pull_request?.base?.sha : observed.pr?.base?.sha ?? event.before;
  if (!['manual', 'tag'].includes(cohort)) {
    try {
      if (!hex.test(baseSha ?? '') || baseSha === zero) fail('base SHA missing, zero or malformed');
      base.commit = baseSha;
      git(root, 'merge-base', '--is-ancestor', baseSha, testedSha);
      const baseTree = git(root, 'rev-parse', `${baseSha}^{tree}`).trim();
      const temp = await mkdtemp(join(temporaryRoot, 'qa-ci-base-')); const baseRoot = join(temp, 'root');
      git(root, 'clone', '--no-checkout', '--no-hardlinks', '--template=', '--', root, baseRoot);
      git(baseRoot, 'checkout', '--detach', baseSha);
      verify(cli, baseRoot, 'restore', temporaryRoot); verify(cli, baseRoot, 'verify', temporaryRoot);
      const before = await manifest(baseRoot); unknownReasons.push(...semantics(before, headManifest));
      const metadataPaths = new Set(['sources/manifest.v1.json', ...before.components.map(entry => entry.bundle), ...headManifest.components.map(entry => entry.bundle)]);
      rootChanges = delta(tree(baseRoot, baseTree), tree(root, head.tree)).map(record => ({ ...record,
        sourceMetadata: metadataPaths.has(record.path) && (!record.baseMode || record.baseMode === '100644') && (!record.headMode || record.headMode === '100644') }));
      for (const entry of headManifest.components) {
        const prior = before.components.find(item => item.id === entry.id);
        if (!prior) continue;
        components.push({ id: entry.id, baseCommit: prior.commit, headCommit: entry.commit, baseTree: prior.tree, headTree: entry.tree,
          verified: true, changedPaths: delta(tree(join(baseRoot, prior.path), prior.tree), tree(join(root, entry.path), entry.tree)) });
      }
      base = { commit: baseSha, tree: baseTree, status: 'verified' };
    } catch (error) { unknownReasons.push(`base impact unavailable: ${error.message}`); base.tree = null; base.status = 'unavailable'; }
  } else unknownReasons.push(`no differential baseline for ${cohort}`);
  const result = classifyImpact({ cohort, rootChanges, components, unknownReasons });
  const duplicate = { suppressed: false, prNumber: observed.pr?.number ?? null, headSha: observed.pr?.head?.sha ?? null, reason: 'not a confirmed eligible duplicate' };
  if (observed.pr && !unknownReasons.length && rootChanges.every(record => doc(record) || record.sourceMetadata) && !result.unsupportedChanges.length) {
    try {
      if (!hex.test(event.before ?? '') || event.before === zero) fail('push baseline unavailable for dedupe');
      git(root, 'merge-base', '--is-ancestor', event.before, testedSha);
      const pushChanges = delta(tree(root, git(root, 'rev-parse', `${event.before}^{tree}`).trim()), tree(root, head.tree));
      const pushMetadata = new Set(['sources/manifest.v1.json', ...headManifest.components.map(entry => entry.bundle)]);
      const unsafePush = pushChanges.filter(record => !doc(record) && !(pushMetadata.has(record.path) &&
        (!record.baseMode || record.baseMode === '100644') && (!record.headMode || record.headMode === '100644')));
      if (unsafePush.length) {
        const broad = classifyImpact({ cohort, rootChanges, components, unknownReasons: [
          `bootstrap/unmapped current push scope: ${unsafePush.map(record => record.path).join(', ')}`] }); Object.assign(result, broad);
      } else {
        duplicate.suppressed = true; duplicate.reason = 'NOT_RUN_DUPLICATE_PR_PENDING: exact same-head open PR, not reused PASS';
        for (const key of ['rootTests', 'freelandControls']) { result.selection[key] = false; result.reasons[key] = duplicate.reason; }
        result.notSelected = groups.filter(key => result.selection[key] === false || result.selection[key] === 'none' || (Array.isArray(result.selection[key]) && !result.selection[key].length));
      }
    } catch (error) {
      const broad = classifyImpact({ cohort, rootChanges, components, unknownReasons: [`push impact unavailable: ${error.message}`] }); Object.assign(result, broad);
    }
  }
  result.reasons.event = `cohort=${cohort}; actual tested HEAD=${testedSha}; PR branch head=${event.pull_request?.head?.sha ?? 'not applicable'}; ${workflow === 'source' && cohort === 'feature' ? 'runtime NOT QUALIFIED by feature source push; ' : ''}${unknownReasons.join('; ')}`;
  return { schemaVersion: 1, qualification: 'selection_only', workflow, cohort, head, base, components, rootChanges,
    ...result, duplicate };
}

async function main() {
  const args = process.argv.slice(2); const values = {};
  if (args.length !== 8) fail('expected --root ABS --event-file ABS --workflow source|runtime --output ABS');
  for (let at = 0; at < args.length; at += 2) {
    if (!['--root', '--event-file', '--workflow', '--output'].includes(args[at]) || values[args[at]]) fail('unknown/duplicate selector argument');
    values[args[at]] = args[at + 1];
  }
  const output = values['--output']; const eventFile = values['--event-file'];
  if (!isAbsolute(output ?? '') || !isAbsolute(eventFile ?? '')) fail('absolute event/output paths required');
  const parent = await realpath(dirname(output)); if (parent !== dirname(output)) fail('output parent must be canonical');
  try { await lstat(output); fail('output already exists'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const bytes = await readFile(eventFile); if (bytes.length > 1024 * 1024) fail('event exceeds bounded size');
  const plan = await computeCiImpact({ root: values['--root'], eventName: process.env.GITHUB_EVENT_NAME, event: JSON.parse(bytes),
    ref: process.env.GITHUB_REF, testedSha: process.env.GITHUB_SHA, repository: process.env.GITHUB_REPOSITORY,
    workflow: values['--workflow'], temporaryRoot: parent });
  await writeFile(output, `${JSON.stringify(plan)}\n`, { flag: 'wx', mode: 0o600 });
  process.stdout.write(`${JSON.stringify(plan)}\n`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(`CI selection failed: ${error.message}\n`); process.exitCode = 1; });
}
