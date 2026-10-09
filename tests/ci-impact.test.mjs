import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, realpath, chmod, symlink, rename, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const rootUrl = new URL('../', import.meta.url);
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_') && !/TOKEN/u.test(key)));
const env = { ...cleanEnv, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_AUTHOR_NAME: 'Synthetic CI Test', GIT_AUTHOR_EMAIL: 'ci@example.invalid',
  GIT_COMMITTER_NAME: 'Synthetic CI Test', GIT_COMMITTER_EMAIL: 'ci@example.invalid' };
const git = (cwd, ...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', ...args],
  { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const api = () => import('../tools/ci-impact.mjs');
const change = (path, status = 'modified', baseMode = '100644', headMode = '100644') => ({ path, status, baseMode, headMode });
const component = (id, paths) => ({ id, verified: true, baseCommit: '1'.repeat(40), headCommit: '2'.repeat(40),
  baseTree: '3'.repeat(40), headTree: paths.length ? '4'.repeat(40) : '3'.repeat(40), changedPaths: paths });

test('loopback target existing units have literal owning mappings with deletion fallback', async context => {
  const { classifyImpact } = await api();
  for (const name of ['bridge-registration', 'first-evidence', 'i2-registration-http', 'readonly-http-broker', 'registration-runtime']) {
    const path = `tests/unit/${name}.test.ts`;
    for (const [status, before, after] of [['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null]]) {
      await context.test(`${name} ${status}`, () => {
        const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
        for (const key of ['kernelBuildContracts', 'consoleRuntime', 'consoleS01Lifecycle']) assert.equal(result.selection[key], true);
        assert.equal(result.selection.kernelFull, status === 'deleted');
        assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
      });
    }
  }
});

test('dependency intake literal mappings select runtime without accepting deleted or unknown tests', async context => {
  const { classifyImpact } = await api();
  const paths = ['tests/unit/intake-build.test.ts', 'tests/unit/qa-init-cli.test.ts',
    'tests/unit/campaign-dependency-scope.test.ts', 'tests/unit/campaign-dependency-adapter.test.ts',
    'tests/unit/campaign-dependency-cli.test.ts', 'tests/fixtures/nuanu-readonly/fixture.ts',
    'tests/fixtures/public-auth-readonly/fixture.ts'];
  for (const path of paths) for (const [status, before, after] of [
    ['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null],
  ]) await context.test(`${path} ${status}`, () => {
    const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
    for (const key of ['kernelBuildContracts', 'consoleRuntime', 'consoleS01Lifecycle']) assert.equal(result.selection[key], true);
    assert.equal(result.selection.kernelFull, status === 'deleted');
    assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
  });
  const unknown = 'tests/unit/campaign-dependency-unreviewed.test.ts';
  const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(unknown)])] });
  assert.equal(result.selection.kernelFull, true);
  assert.deepEqual(result.unsupportedChanges, [`unmapped or removed Console test: ${unknown}`]);
});

// Each literal expectation names a policy bug: broad fallback missing, unwanted Kernel,
// an unselected accepted regression, or unsupported tests silently accepted.
test('known source deltas select their real prerequisites without unchanged full Kernel', async context => {
  const { classifyImpact } = await api();
  const cases = [
    ['Console finite fixture', 'console', [change('tests/fixtures/browser-action-sequence/check.ts')], { kernelFull: false, kernelBuildContracts: false, consoleBrowser: 'finite', consoleBuild: false }],
    ['Console finite test', 'console', [change('tests/unit/browser-action-sequence.test.ts')], { kernelFull: false, consoleBrowser: 'finite' }],
    ['Console UI', 'console', [change('src/components/Card.tsx')], { kernelFull: false, kernelBuildContracts: true, consoleBuild: true, consoleRuntime: true, consoleBrowser: 'all' }],
    ['Console runtime test', 'console', [change('tests/unit/request-admission.test.ts')], { kernelFull: false, kernelBuildContracts: true, consoleRuntime: true, consoleBuild: false, consoleS01Lifecycle: true }],
    ['Console skill', 'console', [change('skills/qa-product-v0/references/checks.md')], { kernelFull: false, consoleRuntime: true, consoleBuild: false }],
    ['Console docs', 'console', [change('docs/readme.md')], { kernelFull: false, consoleRuntime: false, consoleBrowser: 'none' }],
    ['Console lib', 'console', [change('src/lib/bridge.ts')], { kernelFull: true, consoleBuild: true, consoleBrowser: 'all', freelandControls: false }],
    ['Console dependency', 'console', [change('package-lock.json')], { kernelFull: true, consoleRuntime: true }],
    ['Console new test', 'console', [change('tests/unit/unreviewed.test.ts', 'added', null)], { kernelFull: true, consoleRuntime: true, unsupported: true }],
    ['Console selected removal', 'console', [change('tests/unit/request-admission.test.ts', 'deleted', '100644', null)], { kernelFull: true, unsupported: true }],
    ['Kernel docs', 'kernel', [change('docs/guide.md')], { kernelFull: false, kernelBuildContracts: false }],
    ['Kernel ordinary doc deletion', 'kernel', [change('docs/guide.md', 'deleted', '100644', null)], { kernelFull: false, kernelBuildContracts: false }],
    ['Kernel exact test', 'kernel', [change('tests/contracts/example.test.ts')], { kernelFull: false, kernelBuildContracts: true, kernelFocusedTests: ['tests/contracts/example.test.ts'], consoleRuntime: false }],
    ['Kernel source', 'kernel', [change('src/service.ts')], { kernelFull: true, consoleRuntime: true, consoleBrowser: 'all', freelandControls: false }],
    ['Kernel dependency', 'kernel', [change('package.json')], { kernelFull: true, consoleRuntime: true }],
    ['Kernel helper', 'kernel', [change('tests/fixtures/helper.ts')], { kernelFull: true }],
    ['Kernel deleted test', 'kernel', [change('tests/contracts/example.test.ts', 'deleted', '100644', null)], { kernelFull: true, kernelFocusedTests: [] }],
    ['Kernel option-like path', 'kernel', [change('tests/--malicious.test.ts')], { kernelFull: true, kernelFocusedTests: [] }],
    ['Kernel mode-only', 'kernel', [change('docs/guide.md', 'modified', '100644', '100755')], { kernelFull: true }],
    ['Kernel source renamed into docs', 'kernel', [change('src/service.ts', 'deleted', '100644', null), change('docs/service.md', 'added', null)], { kernelFull: true }],
    ['Freeland actual code', 'freeland', [change('tools/freeland-main/check.mjs')], { freelandControls: true, kernelFull: false, consoleRuntime: false }],
    ['inactive reporting', 'kernel-reporting-reference', [change('src/report.ts')], { freelandControls: false, kernelFull: false, consoleRuntime: false }],
  ];
  for (const [name, id, paths, wanted] of cases) await context.test(name, () => {
    const result = classifyImpact({ cohort: 'pull_request', rootChanges: [], components: [component(id, paths)], unknownReasons: [] });
    for (const [key, value] of Object.entries(wanted)) {
      if (key === 'unsupported') assert.equal(result.unsupportedChanges.length > 0, value);
      else assert.deepEqual(result.selection[key], value, `${name}: ${key}`);
    }
    assert.equal(result.selection.rootTests, true);
    for (const key of Object.keys(result.selection)) assert.equal(typeof result.reasons[key], 'string');
  });
});

test('observation CLI reader mapping admits added and modified controls but refuses removal', async context => {
  const { classifyImpact } = await api();
  const path = 'tests/unit/agent-observation-cli-reader.test.ts';
  for (const [status, baseMode, headMode] of [
    ['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null],
  ]) await context.test(status, () => {
    const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, baseMode, headMode)])] });
    assert.equal(result.selection.kernelBuildContracts, true);
    assert.equal(result.selection.consoleRuntime, true);
    assert.equal(result.selection.consoleS01Lifecycle, true);
    assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
    if (status === 'deleted') assert.equal(result.selection.kernelFull, true);
  });
});

test('observation CLI reader executes in the existing isolated runtime argv', async () => {
  const workflow = await readFile(new URL('../.github/workflows/qa-runtime.yml', import.meta.url), 'utf8');
  const step = workflow.match(/^      - name: Isolated Console runtime controls\n([\s\S]*?)(?=^      - name:)/mu);
  assert.ok(step, 'actual isolated runtime step must exist');
  const command = step[1].match(/^\s*node --import tsx --test --test-concurrency=1 \\\n((?:\s+tests\/unit\/[^\n]+\n?)+)/mu);
  assert.ok(command, 'actual test command and continuation argv must exist');
  const argv = command[0].replace(/\\\n/gu, ' ').trim().split(/\s+/u);
  assert.equal(argv.filter(arg => arg === 'tests/unit/agent-observation-cli-reader.test.ts').length, 1);
});

test('authority batching existing unit mapping admits changes but refuses deletion', async context => {
  const { classifyImpact } = await api();
  const path = 'tests/unit/kernel-replace-authority.test.ts';
  for (const [status, before, after] of [['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null]]) {
    await context.test(status, () => {
      const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
      for (const key of ['kernelBuildContracts', 'consoleRuntime', 'consoleS01Lifecycle']) assert.equal(result.selection[key], true);
      assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
      assert.equal(result.selection.kernelFull, status === 'deleted');
    });
  }
});

test('authority batching actual isolated runtime argv executes the existing unit exactly once', async () => {
  const workflow = await readFile(new URL('../.github/workflows/qa-runtime.yml', import.meta.url), 'utf8');
  const step = workflow.match(/^      - name: Isolated Console runtime controls\n([\s\S]*?)(?=^      - name:)/mu);
  const command = step?.[1].match(/^\s*node --import tsx --test --test-concurrency=1 \\\n((?:\s+tests\/unit\/[^\n]+\n?)+)/mu);
  assert.ok(command, 'actual isolated runtime command');
  const args = command[0].replace(/\\\n/gu, ' ').trim().slice('node --import tsx --test --test-concurrency=1'.length);
  const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-c',
    `"$1" -e 'process.stdout.write(JSON.stringify(process.argv.slice(1)))' --${args}`,
    'qa-authority-runtime-argv', process.execPath], { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).filter(arg => arg === 'tests/unit/kernel-replace-authority.test.ts').length, 1);
});

test('request foundation unit mapping admits changes but refuses deletion', async context => {
  const { classifyImpact } = await api();
  const path = 'tests/unit/agent-request-checkpoint.test.ts';
  for (const [status, before, after] of [['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null]]) {
    await context.test(status, () => {
      const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
      for (const key of ['kernelBuildContracts', 'consoleRuntime', 'consoleS01Lifecycle']) assert.equal(result.selection[key], true);
      assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
      assert.equal(result.selection.kernelFull, status === 'deleted');
    });
  }
});

test('request foundation actual isolated runtime argv executes its unit exactly once', async () => {
  const workflow = await readFile(new URL('../.github/workflows/qa-runtime.yml', import.meta.url), 'utf8');
  const step = workflow.match(/^      - name: Isolated Console runtime controls\n([\s\S]*?)(?=^      - name:)/mu);
  const command = step?.[1].match(/^\s*node --import tsx --test --test-concurrency=1 \\\n((?:\s+tests\/unit\/[^\n]+\n?)+)/mu);
  assert.ok(command, 'actual isolated runtime command');
  const args = command[0].replace(/\\\n/gu, ' ').trim().slice('node --import tsx --test --test-concurrency=1'.length);
  const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-c',
    `"$1" -e 'process.stdout.write(JSON.stringify(process.argv.slice(1)))' --${args}`,
    'qa-request-foundation-runtime-argv', process.execPath], { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).filter(arg => arg === 'tests/unit/agent-request-checkpoint.test.ts').length, 1);
});

test('request report literal unit mappings admit changes without waiving deletion', async context => {
  const { classifyImpact } = await api();
  for (const path of ['tests/unit/agent-request-report.test.ts', 'tests/unit/agent-request-cli.test.ts']) {
    for (const [status, before, after] of [['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null]]) {
      await context.test(`${path} ${status}`, () => {
        const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
        for (const key of ['kernelBuildContracts', 'consoleRuntime', 'consoleS01Lifecycle']) assert.equal(result.selection[key], true);
        assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
        assert.equal(result.selection.kernelFull, status === 'deleted');
      });
    }
  }
});

test('request report actual isolated runtime argv executes both new units exactly once', async () => {
  const workflow = await readFile(new URL('../.github/workflows/qa-runtime.yml', import.meta.url), 'utf8');
  const step = workflow.match(/^      - name: Isolated Console runtime controls\n([\s\S]*?)(?=^      - name:)/mu);
  const command = step?.[1].match(/^\s*node --import tsx --test --test-concurrency=1 \\\n((?:\s+tests\/unit\/[^\n]+\n?)+)/mu);
  assert.ok(command, 'actual isolated runtime command');
  const args = command[0].replace(/\\\n/gu, ' ').trim().slice('node --import tsx --test --test-concurrency=1'.length);
  const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-c',
    `"$1" -e 'process.stdout.write(JSON.stringify(process.argv.slice(1)))' --${args}`,
    'qa-request-report-runtime-argv', process.execPath], { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
  assert.equal(result.status, 0, result.stderr);
  const argv = JSON.parse(result.stdout);
  for (const path of ['tests/unit/agent-request-report.test.ts', 'tests/unit/agent-request-cli.test.ts']) {
    assert.equal(argv.filter(arg => arg === path).length, 1, path);
  }
});

test('selected request literal mappings admit controls without waiving deletion', async context => {
  const { classifyImpact } = await api();
  for (const path of ['tests/unit/selected-agent-request.test.ts', 'tests/e2e/selected-agent-request-local.test.mjs']) {
    for (const [status, before, after] of [['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null]]) {
      await context.test(`${path} ${status}`, () => {
        const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
        for (const key of ['kernelBuildContracts', 'consoleRuntime', 'consoleS01Lifecycle']) assert.equal(result.selection[key], true);
        if (path.includes('/e2e/')) {
          assert.equal(result.selection.consoleBuild, true); assert.equal(result.selection.consoleBrowser, 'all');
        }
        assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
        assert.equal(result.selection.kernelFull, status === 'deleted');
      });
    }
  }
});

test('selected request actual isolated runtime argv executes its unit exactly once', async () => {
  const workflow = await readFile(new URL('../.github/workflows/qa-runtime.yml', import.meta.url), 'utf8');
  const step = workflow.match(/^      - name: Isolated Console runtime controls\n([\s\S]*?)(?=^      - name:)/mu);
  const command = step?.[1].match(/^\s*node --import tsx --test --test-concurrency=1 \\\n((?:\s+tests\/unit\/[^\n]+\n?)+)/mu);
  assert.ok(command);
  const args = command[0].replace(/\\\n/gu, ' ').trim().slice('node --import tsx --test --test-concurrency=1'.length);
  const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-c',
    `"$1" -e 'process.stdout.write(JSON.stringify(process.argv.slice(1)))' --${args}`,
    'qa-selected-request-runtime-argv', process.execPath], { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).filter(arg => arg === 'tests/unit/selected-agent-request.test.ts').length, 1);
});

test('U03a literal unit mappings admit added/modified controls without waiving deletion', async context => {
  const { classifyImpact } = await api();
  for (const path of [
    'tests/unit/selected-campaign-readback.test.mjs', 'tests/unit/selected-campaign-http.test.ts',
    'tests/unit/selected-campaign-projection.test.ts', 'tests/unit/primary-ui-read-client.test.ts',
    'tests/unit/primary-ui-selection.test.ts', 'tests/unit/primary-ui-projection.test.ts',
    'tests/unit/primary-ui-report.test.ts', 'tests/unit/selected-campaign-consumer-lifecycle.test.mjs',
  ]) for (const [status, before, after] of [['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null]]) {
    await context.test(`${path} ${status}`, () => {
      const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
      for (const key of ['kernelBuildContracts', 'consoleRuntime', 'consoleS01Lifecycle']) assert.equal(result.selection[key], true);
      assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
      assert.equal(result.selection.kernelFull, status === 'deleted');
    });
  }
});

test('U03a consumer and helper-only deltas select built browser-all compatibility without waiving deletion', async context => {
  const { classifyImpact } = await api();
  for (const path of ['tests/e2e/selected-campaign-local.test.mjs', 'tests/fixtures/selected-campaign-consumer-lifecycle.mjs']) {
    for (const [status, before, after] of [['added', null, '100644'], ['modified', '100644', '100644'], ['deleted', '100644', null]]) {
      await context.test(`${path} ${status}`, () => {
        const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
        for (const key of ['kernelBuildContracts', 'consoleBuild', 'consoleRuntime', 'consoleS01Lifecycle']) assert.equal(result.selection[key], true);
        assert.equal(result.selection.consoleBrowser, 'all');
        assert.deepEqual(result.unsupportedChanges, status === 'deleted' ? [`unmapped or removed Console test: ${path}`] : []);
        assert.equal(result.selection.kernelFull, status === 'deleted');
      });
    }
  }
});

test('U03a actual runtime argv executes every ruled unit and retains existing readback controls', async () => {
  const workflow = await readFile(new URL('../.github/workflows/qa-runtime.yml', import.meta.url), 'utf8');
  const step = workflow.match(/^      - name: Isolated Console runtime controls\n([\s\S]*?)(?=^      - name:)/mu);
  const command = step?.[1].match(/^\s*node --import tsx --test --test-concurrency=1 \\\n((?:\s+tests\/unit\/[^\n]+\n?)+)/mu);
  assert.ok(command, 'actual isolated runtime command');
  const argv = command[0].replace(/\\\n/gu, ' ').trim().split(/\s+/u);
  for (const path of [
    'tests/unit/selected-campaign-readback.test.mjs', 'tests/unit/selected-campaign-http.test.ts',
    'tests/unit/selected-campaign-projection.test.ts', 'tests/unit/primary-ui-read-client.test.ts',
    'tests/unit/primary-ui-selection.test.ts', 'tests/unit/primary-ui-projection.test.ts',
    'tests/unit/primary-ui-report.test.ts', 'tests/unit/selected-campaign-consumer-lifecycle.test.mjs',
    'tests/unit/workspace-snapshot.test.ts', 'tests/unit/campaign-continuation-readback.test.mjs',
    'tests/unit/campaign-continuation-readback-faults.test.mjs',
  ]) assert.equal(argv.filter(arg => arg === path).length, 1, path);
  assert.equal(argv.includes('tests/fixtures/selected-campaign-consumer-lifecycle.mjs'), false, 'helper is not executable argv');
});

test('U03a actual browser-all shell supplies portable installed Chromium and fresh isolated consumer argv/env', async () => {
  const workflow = await readFile(new URL('../.github/workflows/qa-runtime.yml', import.meta.url), 'utf8');
  const step = workflow.match(/^      - name: Browser healthy and broken fixture controls\n([\s\S]*?)(?=^      - name:)/mu);
  assert.ok(step);
  const block = step[1].split('        run: |\n')[1]?.split('\n').filter(Boolean).map(line => line.replace(/^          /u, '')).join('\n');
  assert.ok(block);
  // Execute the real shell boundary with an inert Node recorder: no browser/build/product.
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'qa-u03a-ci-argv-')));
  const bin = join(dir, 'bin'); await mkdir(bin);
  const workspace = join(dir, 'workspace'), consoleRoot = join(workspace, 'components/console');
  const kernelRoot = join(workspace, 'components/kernel');
  for (const root of [consoleRoot, kernelRoot]) {
    await mkdir(root, { recursive: true }); git(root, 'init', '--template=');
    git(root, 'commit', '--allow-empty', '-m', root === consoleRoot ? 'Synthetic Console identity' : 'Synthetic Kernel identity');
  }
  const consoleCommit = git(consoleRoot, 'rev-parse', 'HEAD');
  assert.notEqual(consoleCommit, git(kernelRoot, 'rev-parse', 'HEAD'), 'fixture identities must differ');
  const output = join(dir, 'step-output');
  const record = join(dir, 'argv.json'); const installed = join(dir, 'installed-chromium');
  await writeFile(join(bin, 'node'), `#!${process.execPath}\nconst fs=require('node:fs');\nif(process.argv.includes('--input-type=module')) { if(!process.argv.at(-1).includes('chromium.executablePath()')) process.exit(2); console.log(${JSON.stringify(installed)}); } else fs.writeFileSync(${JSON.stringify(record)},JSON.stringify({argv:process.argv.slice(2),env:process.env}));\n`, { mode: 0o755 });
  const result = spawnSync('/bin/bash', ['-c', block], { cwd: consoleRoot, env: { PATH: `${bin}:/usr/bin:/bin`, RUNNER_TEMP: dir,
    GITHUB_WORKSPACE: workspace, GITHUB_OUTPUT: output, GITHUB_SHA: 'a'.repeat(40), GITHUB_TOKEN: 'must-not-reach-child',
    ACTIONS_RUNTIME_TOKEN: 'must-not-reach-child', SYNTHETIC_PRIVATE_SENTINEL: 'must-not-reach-child' }, encoding: 'utf8', timeout: 10_000 });
  assert.equal(result.status, 0, result.stderr);
  const actual = JSON.parse(await readFile(record, 'utf8'));
  assert.deepEqual(actual.argv, ['--import', 'tsx', '--test', 'tests/unit/browser-journey.test.ts', 'tests/unit/public-input-campaign.test.ts', 'tests/unit/browser-action-sequence.test.ts', 'tests/e2e/selected-campaign-local.test.mjs', 'tests/e2e/selected-agent-request-local.test.mjs']);
  assert.equal(actual.env.QA_PRIMARY_UI_CHROMIUM, installed);
  assert.equal(actual.env.QA_STARTER_REPO, join(dir, 'workspace/components/kernel'));
  assert.equal(actual.env.PLAYWRIGHT_BROWSERS_PATH, join(dir, 'qa-release-browsers'));
  assert.ok(actual.env.TMPDIR.startsWith(`${dir}/qa-browser.`));
  assert.equal(actual.env.QA_SELECTED_RUN_UI_DIR, join(actual.env.TMPDIR, 'selected-run'));
  assert.equal(actual.env.QA_SELECTED_REQUEST_UI_DIR, join(actual.env.TMPDIR, 'selected-request'));
  assert.equal(actual.env.QA_CONSUMER_SOURCE_COMMIT, consoleCommit);
  assert.notEqual(actual.env.QA_CONSUMER_SOURCE_COMMIT, 'a'.repeat(40), 'component not root tested SHA');
  const emitted = await readFile(output, 'utf8');
  assert.ok(emitted.includes(`request-dir=${actual.env.QA_SELECTED_REQUEST_UI_DIR}\n`));
  assert.ok(emitted.includes(`console-commit=${consoleCommit}\n`));
  assert.ok(emitted.includes(`kernel-commit=${git(kernelRoot, 'rev-parse', 'HEAD')}\n`));
  assert.equal(actual.env.GITHUB_TOKEN, undefined); assert.equal(actual.env.ACTIONS_RUNTIME_TOKEN, undefined);
  assert.equal(actual.env.SYNTHETIC_PRIVATE_SENTINEL, undefined);
  assert.equal((await readFile(record, 'utf8')).includes('tests/fixtures/selected-campaign-consumer-lifecycle.mjs'), false);
});

test('full cohorts and unknown inputs dominate every known narrower selection', async () => {
  const { classifyImpact } = await api();
  for (const cohort of ['integration', 'tag', 'manual']) {
    const result = classifyImpact({ cohort, rootChanges: [], components: [], unknownReasons: [] });
    assert.equal(result.selection.kernelFull, true); assert.equal(result.selection.freelandControls, true);
    assert.equal(result.selection.consoleBrowser, 'all');
  }
  for (const changes of [[change('tools/ci-impact.mjs')], [change('tests/check.test.mjs')], [change('unknown.json')],
    [change('docs/guide.md', 'modified', '100644', '120000')]]) {
    assert.equal(classifyImpact({ cohort: 'pull_request', rootChanges: changes, components: [], unknownReasons: [] }).selection.kernelFull, true);
  }
  assert.equal(classifyImpact({ cohort: 'pull_request', rootChanges: [change('docs/guide.md')], components: [], unknownReasons: [] }).selection.kernelFull, false);
  const mixed = classifyImpact({ cohort: 'pull_request', rootChanges: [], components: [
    component('console', [change('tests/unit/browser-action-sequence.test.ts')]), component('freeland', [change('src/fee.ts')]),
  ], unknownReasons: [] });
  assert.equal(mixed.selection.consoleBrowser, 'finite'); assert.equal(mixed.selection.freelandControls, true);
  const sameComponentUnion = classifyImpact({ cohort: 'pull_request', rootChanges: [], components: [component('console', [
    change('tests/unit/browser-action-sequence.test.ts'), change('src/components/Card.tsx'), change('docs/guide.md'),
  ])], unknownReasons: [] });
  assert.equal(sameComponentUnion.selection.kernelFull, false); assert.equal(sameComponentUnion.selection.consoleBrowser, 'all');
  const kernelUnion = classifyImpact({ cohort: 'pull_request', rootChanges: [], components: [component('kernel', [
    change('tests/contracts/example.test.ts'), change('docs/guide.md'),
  ])], unknownReasons: [] });
  assert.equal(kernelUnion.selection.kernelFull, false); assert.deepEqual(kernelUnion.selection.kernelFocusedTests, ['tests/contracts/example.test.ts']);
  const unknown = classifyImpact({ cohort: 'pull_request', rootChanges: [], components: [component('console', [])], unknownReasons: ['base unavailable'] });
  assert.equal(unknown.selection.kernelFull, true); assert.match(unknown.reasons.kernelFull, /base unavailable/u);
});

async function fixture() {
  const base = await realpath(await mkdtemp(join(tmpdir(), 'qa-ci-impact-test-')));
  const root = join(base, 'root'); await mkdir(root); git(root, 'init', '--template=');
  await mkdir(join(root, 'tools/lib'), { recursive: true }); await mkdir(join(root, 'sources'));
  await writeFile(join(root, '.gitignore'), '/components/\n/.local/\n');
  for (const path of ['tools/workspace.mjs', 'tools/lib/source-workspace.mjs']) await copyFile(new URL(path, rootUrl), join(root, path));
  const donors = {};
  const components = [];
  for (const id of ['kernel', 'console', 'freeland', 'kernel-reporting-reference']) {
    const donor = join(base, id); await mkdir(donor); git(donor, 'init', '--template=');
    await mkdir(join(donor, 'docs')); await writeFile(join(donor, 'docs/guide.md'), 'initial docs\n');
    await mkdir(join(donor, 'src')); await writeFile(join(donor, 'src/service.ts'), 'export const value = 1;\n');
    await mkdir(join(donor, 'tests/unit'), { recursive: true });
    await writeFile(join(donor, 'tests/unit/browser-action-sequence.test.ts'), 'finite initial\n');
    git(donor, 'add', '.'); git(donor, 'commit', '-m', 'Synthetic initial source'); donors[id] = donor;
    const entry = { id, path: `components/${id}`, commit: git(donor, 'rev-parse', 'HEAD'), tree: git(donor, 'rev-parse', 'HEAD^{tree}'),
      bundle: `sources/${id}.bundle`, runtimeAuthority: id !== 'kernel-reporting-reference', qualification: 'synthetic source only' };
    git(donor, 'bundle', 'create', join(root, entry.bundle), 'HEAD'); entry.sha256 = hash(await readFile(join(root, entry.bundle))); components.push(entry);
  }
  const manifest = { schemaVersion: 1, components };
  const save = async () => writeFile(join(root, 'sources/manifest.v1.json'), JSON.stringify(manifest)); await save();
  git(root, 'add', '.'); git(root, 'commit', '-m', 'Synthetic base'); const baseCommit = git(root, 'rev-parse', 'HEAD');
  const publish = async (id, path, content = 'modified\n') => {
    const donor = donors[id]; await mkdir(join(donor, path, '..'), { recursive: true }); await writeFile(join(donor, path), content);
    git(donor, 'add', '.'); git(donor, 'commit', '-m', 'Synthetic actual change');
    const entry = components.find(item => item.id === id); entry.commit = git(donor, 'rev-parse', 'HEAD'); entry.tree = git(donor, 'rev-parse', 'HEAD^{tree}');
    const bundle = join(root, entry.bundle); await rename(bundle, join(base, `${id}-old-${Date.now()}.bundle`));
    git(donor, 'bundle', 'create', bundle, 'HEAD'); entry.sha256 = hash(await readFile(bundle)); await save();
  };
  const commitHead = () => { git(root, 'add', '.'); git(root, 'commit', '--allow-empty', '-m', 'Synthetic head'); return git(root, 'rev-parse', 'HEAD'); };
  const restore = () => execFileSync(process.execPath, [new URL('../tools/workspace.mjs', import.meta.url).pathname, 'restore', '--root', root], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  return { base, root, donors, manifest, components, save, publish, commitHead, restore, baseCommit };
}

async function compute(f, options = {}) {
  f.restore();
  const { computeCiImpact } = await api();
  const head = git(f.root, 'rev-parse', 'HEAD');
  return computeCiImpact({ root: f.root, eventName: 'pull_request', event: { pull_request: { base: { sha: f.baseCommit }, head: { sha: 'a'.repeat(40) } } },
    ref: 'refs/pull/1/merge', testedSha: head, repository: 'example/qa', workflow: 'runtime', temporaryRoot: f.base, ...options });
}

test('real comparator mutation rejects old unconditional Kernel and naive same-name bundle detector', async () => {
  const f = await fixture(); await f.publish('console', 'tests/unit/browser-action-sequence.test.ts'); f.commitHead(); f.restore();
  const source = await readFile(new URL('../tools/ci-impact.mjs', import.meta.url), 'utf8');
  const expression = 'changedPaths: delta(tree(join(baseRoot, prior.path), prior.tree), tree(join(root, entry.path), entry.tree))';
  assert.ok(source.includes(expression), 'mutation changes the actual tree comparator, not a test expectation');
  const mutants = [
    source.replace(expression, 'changedPaths: prior.bundle === entry.bundle ? [] : delta(tree(join(baseRoot, prior.path), prior.tree), tree(join(root, entry.path), entry.tree))'),
    source.replace("if (ordinary(record) && finitePaths.has(record.path)) {", "if (ordinary(record) && finitePaths.has(record.path)) { enable('kernelFull', 'old unconditional Kernel');"),
  ];
  const wanted = plan => { assert.equal(plan.selection.consoleBrowser, 'finite'); assert.equal(plan.selection.kernelFull, false); };
  wanted(await compute(f));
  for (let index = 0; index < mutants.length; index++) {
    assert.notEqual(mutants[index], source); const file = join(f.base, `mutation-${index}.mjs`); await writeFile(file, mutants[index]);
    const { computeCiImpact } = await import(file);
    const plan = await computeCiImpact({ root: f.root, eventName: 'pull_request', event: { pull_request: { base: { sha: f.baseCommit } } },
      testedSha: git(f.root, 'rev-parse', 'HEAD'), repository: 'example/qa', workflow: 'runtime', temporaryRoot: f.base });
    assert.throws(() => wanted(plan), assert.AssertionError, 'actual policy mutant must fail the literal acceptance assertion');
  }
});

test('actual manifests, history and mode boundaries never turn unknown impact into unchanged', async context => {
  const f = await fixture(); f.commitHead();
  await context.test('non-ancestor base', async () => {
    const orphan = git(f.root, 'commit-tree', git(f.root, 'rev-parse', 'HEAD^{tree}'), '-m', 'Synthetic disconnected commit');
    const plan = await compute(f, { event: { pull_request: { base: { sha: orphan } } } });
    assert.equal(plan.selection.kernelFull, true); assert.equal(plan.base.status, 'unavailable');
  });
  await context.test('authority changes force full', async () => {
    f.components.find(item => item.id === 'kernel-reporting-reference').runtimeAuthority = true; await f.save(); f.commitHead();
    const plan = await compute(f); assert.equal(plan.selection.kernelFull, true); assert.match(plan.reasons.kernelFull, /authority/u);
  });
  await context.test('unknown component and semantic fields force full', async () => {
    f.components.find(item => item.id === 'kernel-reporting-reference').id = 'unknown-reporting'; f.manifest.unreviewedSemantics = true; await f.save(); f.commitHead();
    const plan = await compute(f); assert.equal(plan.selection.kernelFull, true); assert.match(plan.reasons.kernelFull, /unknown/u);
  });
  await context.test('head digest mismatch is fatal without a selection', async () => {
    f.components[0].sha256 = '0'.repeat(64); await f.save(); f.commitHead();
    const { computeCiImpact } = await api(); await assert.rejects(computeCiImpact({ root: f.root, eventName: 'workflow_dispatch', event: {},
      testedSha: git(f.root, 'rev-parse', 'HEAD'), repository: 'example/qa', workflow: 'runtime', temporaryRoot: f.base }), /BUNDLE_DIGEST/u);
  });
});

test('base tree mismatch is broad; duplicate/overlapping/escape head manifests are fatal', async context => {
  const f = await fixture(); const original = structuredClone(f.manifest);
  f.components[0].tree = '0'.repeat(40); await f.save(); f.commitHead(); f.baseCommit = git(f.root, 'rev-parse', 'HEAD');
  f.components[0].tree = original.components[0].tree; await f.save(); f.commitHead();
  const plan = await compute(f); assert.equal(plan.selection.kernelFull, true); assert.match(plan.reasons.kernelFull, /SOURCE_TREE/u);
  const { computeCiImpact } = await api();
  for (const [name, alter] of [
    ['duplicate id', value => value.components.push({ ...value.components[0], path: 'components/extra' })],
    ['overlapping child', value => value.components[1].path = 'components/kernel/nested'],
    ['escaped child', value => value.components[1].path = 'components/../escape'],
    ['head tree mismatch', value => value.components[1].tree = '0'.repeat(40)],
  ]) await context.test(name, async () => {
    const value = structuredClone(original); alter(value); await writeFile(join(f.root, 'sources/manifest.v1.json'), JSON.stringify(value)); f.commitHead();
    await assert.rejects(computeCiImpact({ root: f.root, eventName: 'workflow_dispatch', event: {}, testedSha: git(f.root, 'rev-parse', 'HEAD'),
      repository: 'example/qa', workflow: 'runtime', temporaryRoot: f.base }), /source verification failed/u);
  });
});

test('real source modes and symlink blobs are compared instead of treating Markdown names as docs', async () => {
  const f = await fixture(); const donor = f.donors.kernel;
  await chmod(join(donor, 'docs/guide.md'), 0o755); await symlink('guide.md', join(donor, 'docs/linked.md'));
  git(donor, 'add', '.'); git(donor, 'commit', '-m', 'Synthetic mode and symlink delta');
  const entry = f.components.find(item => item.id === 'kernel'); entry.commit = git(donor, 'rev-parse', 'HEAD'); entry.tree = git(donor, 'rev-parse', 'HEAD^{tree}');
  await rename(join(f.root, entry.bundle), join(f.base, 'mode-baseline.bundle')); git(donor, 'bundle', 'create', join(f.root, entry.bundle), 'HEAD');
  entry.sha256 = hash(await readFile(join(f.root, entry.bundle))); await f.save(); f.commitHead();
  const plan = await compute(f); assert.equal(plan.selection.kernelFull, true);
  const paths = plan.components.find(item => item.id === 'kernel').changedPaths;
  assert.ok(paths.some(item => item.path === 'docs/guide.md' && item.baseMode === '100644' && item.headMode === '100755'));
  assert.ok(paths.some(item => item.path === 'docs/linked.md' && item.headMode === '120000'));
});

test('sanitized selector children cannot inherit tokens/Git redirects; unsafe local storage fails', async context => {
  const f = await fixture();
  const workspaceCli = join(f.root, 'tools/workspace.mjs');
  await writeFile(workspaceCli, "if (Object.keys(process.env).some(key => /TOKEN/.test(key))) throw Error('token reached child');\n" + await readFile(workspaceCli, 'utf8'));
  f.commitHead(); f.restore();
  const previous = Object.fromEntries(['GITHUB_TOKEN','GH_TOKEN','GIT_DIR','GIT_WORK_TREE','GIT_CONFIG_COUNT','GIT_CONFIG_KEY_0','GIT_CONFIG_VALUE_0'].map(key => [key,process.env[key]]));
  try {
    Object.assign(process.env, { GITHUB_TOKEN: 'synthetic-never-logged', GH_TOKEN: 'synthetic-never-logged', GIT_DIR: '/definitely/missing',
      GIT_WORK_TREE: '/definitely/missing', GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'alias.rev-parse', GIT_CONFIG_VALUE_0: '!exit 99' });
    const plan = await compute(f); assert.equal(plan.base.status, 'verified'); assert.equal(plan.head.commit, git(f.root, 'rev-parse', 'HEAD'));
  } finally { for (const [key,value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  const { computeCiImpact } = await api();
  const invoke = () => computeCiImpact({ root: f.root, eventName: 'workflow_dispatch', event: {}, testedSha: git(f.root, 'rev-parse', 'HEAD'), repository: 'example/qa', workflow: 'runtime', temporaryRoot: f.base });
  await context.test('alternates rejected', async () => {
    const alternate = join(f.root, 'components/kernel/.git/objects/info/alternates'); await writeFile(alternate, join(f.donors.kernel, '.git/objects') + '\n');
    await assert.rejects(invoke(), /GIT_STORAGE/u); await unlink(alternate);
  });
  await context.test('local Git includes rejected before source reads', async () => {
    git(f.root, 'config', 'include.path', '/definitely/missing'); await assert.rejects(invoke(), /UNSAFE_GIT_CONFIG/u);
    git(f.root, 'config', '--unset', 'include.path');
  });
  await context.test('replacement refs do not replace the tested SHA tree', async () => {
    const actualTree = git(f.root, 'rev-parse', 'HEAD^{tree}');
    const different = git(f.root, 'commit-tree', git(f.root, 'rev-parse', `${f.baseCommit}^{tree}`), '-m', 'Synthetic replacement');
    git(f.root, 'replace', git(f.root, 'rev-parse', 'HEAD'), different);
    const plan = await invoke(); assert.equal(plan.head.tree, actualTree);
  });
  await context.test('root symlink rejected, not canonicalized into permission', async () => {
    const link = join(f.base, 'linked-root'); await symlink(f.root, link);
    await assert.rejects(computeCiImpact({ root: link, eventName: 'workflow_dispatch', event: {}, testedSha: git(f.root, 'rev-parse', 'HEAD'), repository: 'example/qa', workflow: 'runtime', temporaryRoot: f.base }), /canonical/u);
  });
});

test('real verified bundle rename/repack/qualification changes cannot invent source behavior', async context => {
  const f = await fixture(); const entry = f.components.find(item => item.id === 'console');
  await rename(join(f.root, entry.bundle), join(f.root, 'sources/renamed.bundle')); entry.bundle = 'sources/renamed.bundle'; entry.qualification = 'only wording';
  // An empty child commit changes commit and bundle bytes, not the tree.
  git(f.donors.console, 'commit', '--allow-empty', '-m', 'Repacked identical tree'); entry.commit = git(f.donors.console, 'rev-parse', 'HEAD');
  await rename(join(f.root, entry.bundle), join(f.base, 'previous.bundle'));
  git(f.donors.console, 'bundle', 'create', join(f.root, entry.bundle), 'HEAD'); entry.sha256 = hash(await readFile(join(f.root, entry.bundle)));
  await f.save(); f.commitHead(); const plan = await compute(f);
  assert.equal(plan.selection.kernelFull, false); assert.equal(plan.selection.consoleBrowser, 'none');
  assert.equal(plan.components.find(item => item.id === 'console').changedPaths.length, 0);
  assert.equal(plan.base.status, 'verified'); assert.equal(plan.qualification, 'selection_only');
  assert.notEqual(plan.components.find(item => item.id === 'console').baseCommit, entry.commit);
  const file = join(f.base, 'same-tree-selection.example.json'); await writeFile(file, JSON.stringify(plan, null, 2)); context.diagnostic(`synthetic source identity/selection example: ${file}`);
});

test('same bundle filename with changed blob actually selects finite behavior without Kernel', async context => {
  const f = await fixture(); await f.publish('console', 'tests/unit/browser-action-sequence.test.ts'); f.commitHead();
  const plan = await compute(f); assert.equal(plan.selection.consoleBrowser, 'finite'); assert.equal(plan.selection.kernelFull, false);
  assert.deepEqual(plan.components.find(item => item.id === 'console').changedPaths.map(item => item.path), ['tests/unit/browser-action-sequence.test.ts']);
  assert.equal(plan.head.commit, git(f.root, 'rev-parse', 'HEAD')); assert.ok(plan.reasons.event.includes('a'.repeat(40)), 'PR branch head must remain distinct from tested merge identity');
  const file = join(f.base, 'finite-selection.example.json'); await writeFile(file, JSON.stringify(plan, null, 2)); context.diagnostic(`synthetic source identity/selection example: ${file}`);
});

test('actual comparator rejects invalid HEAD, but cannot narrow against invalid base', async context => {
  for (const base of ['0'.repeat(40), 'f'.repeat(40), undefined]) await context.test(`unavailable base ${base ?? 'missing'}`, async () => {
    const f = await fixture(); f.commitHead(); const plan = await compute(f, { event: { pull_request: { base: { sha: base } } } });
    assert.equal(plan.selection.kernelFull, true); assert.equal(plan.base.tree, null); assert.equal(plan.base.status, 'unavailable');
  });
  await context.test('missing base bundle is not unchanged', async () => {
    const f = await fixture(); await rename(join(f.root, f.components[0].bundle), join(f.base, 'missing.bundle'));
    git(f.root, 'add', '.'); git(f.root, 'commit', '-m', 'invalid base'); f.baseCommit = git(f.root, 'rev-parse', 'HEAD');
    await copyFile(join(f.base, 'missing.bundle'), join(f.root, f.components[0].bundle)); f.commitHead();
    const plan = await compute(f); assert.equal(plan.selection.kernelFull, true); assert.match(plan.reasons.kernelFull, /base/u);
  });
  await context.test('dirty selected child is fatal', async () => {
    const f = await fixture(); f.commitHead(); f.restore(); await writeFile(join(f.root, 'components/console/docs/guide.md'), 'owner dirt');
    const { computeCiImpact } = await api(); await assert.rejects(computeCiImpact({ root: f.root, eventName: 'workflow_dispatch', event: {}, testedSha: git(f.root, 'rev-parse', 'HEAD'), temporaryRoot: f.base, repository: 'example/qa', workflow: 'runtime' }), /HEAD|head|SOURCE_DIRTY/u);
  });
  await context.test('tested SHA mismatch is fatal', async () => {
    const f = await fixture(); f.restore(); const { computeCiImpact } = await api();
    await assert.rejects(computeCiImpact({ root: f.root, eventName: 'workflow_dispatch', event: {}, testedSha: 'f'.repeat(40), temporaryRoot: f.base, repository: 'example/qa', workflow: 'runtime' }), /SHA|HEAD/u);
  });
});

test('source dedupe requires exact open same-repository head and both bootstrap diffs', async context => {
  const f = await fixture(); await f.publish('console', 'tests/unit/browser-action-sequence.test.ts'); f.commitHead();
  const head = git(f.root, 'rev-parse', 'HEAD'); const originalFetch = globalThis.fetch; const originalToken = process.env.GITHUB_TOKEN;
  const pr = { number: 12, state: 'open', head: { sha: head, ref: 'feature', repo: { full_name: 'example/qa' } }, base: { sha: f.baseCommit, repo: { full_name: 'example/qa' } } };
  const push = { eventName: 'push', ref: 'refs/heads/feature', event: { before: f.baseCommit }, workflow: 'source' };
  try {
    for (const [name, payload, suppressed, broad] of [
      ['matching PR', [pr], true, false], ['stale head', [{ ...pr, head: { ...pr.head, sha: 'c'.repeat(40) } }], false, false],
      ['closed PR', [{ ...pr, state: 'closed' }], false, false], ['fork head', [{ ...pr, head: { ...pr.head, repo: { full_name: 'fork/qa' } } }], false, false],
      ['ambiguous PR', [pr, { ...pr, number: 13 }], false, true], ['no PR', [], false, false],
      ['truncated metadata', Array.from({length: 100}, () => pr), false, true], ['malformed metadata', {}, false, true],
    ]) await context.test(name, async () => {
      process.env.GITHUB_TOKEN = 'synthetic-never-logged';
      globalThis.fetch = async (url, options) => {
        assert.equal(new URL(url).origin, 'https://api.github.com'); assert.equal(new URL(url).searchParams.get('head'), 'example:feature');
        assert.equal(options.method, 'GET'); return { ok: true, json: async () => payload };
      };
      const plan = await compute(f, push); assert.equal(plan.duplicate.suppressed, suppressed);
      assert.equal(plan.selection.kernelFull, broad); assert.equal(process.env.GITHUB_TOKEN, undefined);
      if (suppressed) { assert.equal(plan.selection.rootTests, false); assert.match(plan.duplicate.reason, /NOT_RUN_DUPLICATE_PR_PENDING/u); }
    });
    await context.test('API failure is conservative, not suppression', async () => {
      process.env.GITHUB_TOKEN = 'synthetic-never-logged'; globalThis.fetch = async () => { throw new Error('denied'); };
      const plan = await compute(f, push); assert.equal(plan.selection.kernelFull, true); assert.equal(plan.duplicate.suppressed, false);
    });
    await context.test('CI-changing PR remains full even on docs-only follow-up push', async () => {
      await writeFile(join(f.root, 'tools/policy.mjs'), '// changed policy'); const prior = f.commitHead();
      await mkdir(join(f.root, 'docs')); await writeFile(join(f.root, 'docs/followup.md'), 'wording'); f.commitHead();
      process.env.GITHUB_TOKEN = 'synthetic-never-logged';
      globalThis.fetch = async () => ({ ok: true, json: async () => [{ ...pr, head: { ...pr.head, sha: git(f.root, 'rev-parse', 'HEAD') } }] });
      const plan = await compute(f, { ...push, event: { before: prior } });
      assert.equal(plan.selection.kernelFull, true); assert.equal(plan.duplicate.suppressed, false);
    });
  } finally { globalThis.fetch = originalFetch; if (originalToken === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = originalToken; }
});

test('source push temporary unmapped/bootstrap history cannot hide behind safe PR diff', async context => {
  const originalFetch = globalThis.fetch; const originalToken = process.env.GITHUB_TOKEN;
  try {
    for (const path of ['private-data.bin', 'tools/temporary-policy.mjs']) await context.test(path, async () => {
      const f = await fixture(); await writeFile(join(f.root, path), 'temporary unknown'); const before = f.commitHead();
      await rename(join(f.root, path), join(f.base, 'removed-source')); f.commitHead();
      const head = git(f.root, 'rev-parse', 'HEAD'); process.env.GITHUB_TOKEN = 'synthetic-never-logged';
      globalThis.fetch = async () => ({ ok: true, json: async () => [{ number: 42, state: 'open', head: { sha: head, ref: 'feature', repo: { full_name: 'example/qa' } }, base: { sha: f.baseCommit, repo: { full_name: 'example/qa' } } }] });
      const plan = await compute(f, { eventName: 'push', ref: 'refs/heads/feature', event: { before }, workflow: 'source' });
      assert.equal(plan.duplicate.suppressed, false, 'both PR and push scope must be eligible');
      assert.equal(plan.selection.kernelFull, true, 'unmapped/bootstrap current push must broaden, not just decline suppression');
      assert.equal(plan.selection.rootTests, true);
    });
  } finally { globalThis.fetch = originalFetch; if (originalToken === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = originalToken; }
});

// Literal expectations from the accepted policy, independent of selector sets.
test('bounded Console literals keep complete compatibility and conservative unions', async context => {
  const { classifyImpact } = await api();
  const paths = [
    'server/agent-observation-cli.mjs', 'server/bridge.mjs', 'server/selected-campaign-readback.mjs',
    'server/selected-campaign-readback.d.mts', 'server/workspace-snapshot.mjs', 'src/lib/live.ts',
    'src/lib/selected-agent-request.ts', 'scripts/qa-campaign.ts', 'src/lib/qa-outcomes.ts',
    'src/node/agent-request-report.ts', 'src/node/qa-outcomes-export.ts',
  ];
  for (const path of paths) for (const [status, before, after, full] of [
    ['added', null, '100644', false], ['modified', '100644', '100644', false],
    ['deleted', '100644', null, true], ['modified', '100644', '100755', true],
    ['modified', '100644', '120000', true], ['modified', '100755', '100644', true],
  ]) await context.test(`${path} ${status} ${before}/${after}`, () => {
    const result = classifyImpact({ cohort: 'pull_request', components: [component('console', [change(path, status, before, after)])] });
    assert.deepEqual(result.selection, { rootTests: true, freelandControls: false, kernelBuildContracts: true,
      kernelFull: full, kernelFocusedTests: [], consoleBuild: true, consoleRuntime: true,
      consoleBrowser: 'all', consoleS01Lifecycle: true });
    assert.deepEqual(result.unsupportedChanges, []);
  });
  for (const extra of [component('kernel', [change('src/service.ts')]),
    component('console', [change('package-lock.json')]), component('console', [change('server/kernel-authority.mjs')]),
    component('console', [change('server/request-admission.mjs')]), component('console', [change('src/node/agent-request-checkpoint.ts')]),
    component('console', [change('src/node/agent-request-runtime.ts')]), component('console', [change('src/lib/unmapped.ts')])]) {
    for (const components of [[component('console', [change(paths[0])]), extra], [extra, component('console', [change(paths[0])])]]) {
      assert.equal(classifyImpact({ cohort: 'pull_request', components }).selection.kernelFull, true);
    }
  }
  for (const cohort of ['integration', 'tag', 'manual']) {
    assert.equal(classifyImpact({ cohort, components: [component('console', [change(paths[0])])] }).selection.kernelFull, true);
  }
  assert.equal(classifyImpact({ cohort: 'pull_request', components: [component('console', [change(paths[0])])],
    unknownReasons: ['unverified baseline'] }).selection.kernelFull, true);
});

test('bounded root policy tests narrow only ordinary literal changes', async context => {
  const { classifyImpact } = await api();
  for (const path of ['tests/ci-impact.test.mjs', 'tests/qa-runtime-workflow.test.mjs']) {
    for (const [status, before, after, full] of [
      ['added', null, '100644', false], ['modified', '100644', '100644', false],
      ['deleted', '100644', null, true], ['modified', '100644', '100755', true], ['modified', '100644', '120000', true],
      ['modified', '100755', '100644', true],
    ]) await context.test(`${path} ${status} ${after}`, () => {
      const result = classifyImpact({ cohort: 'pull_request', rootChanges: [change(path, status, before, after)] });
      assert.equal(result.selection.rootTests, true);
      assert.equal(result.selection.kernelFull, full);
      assert.equal(result.selection.consoleRuntime, full);
      assert.equal(result.selection.freelandControls, full);
    });
  }
  for (const path of ['.github/workflows/qa-runtime.yml', '.github/workflows/qa-source.yml', 'tools/ci-impact.mjs',
    'tools/workspace.mjs', 'tools/lib/source-workspace.mjs', 'package-lock.json', 'unknown.json', 'tests/unknown.test.mjs']) {
    assert.equal(classifyImpact({ cohort: 'pull_request', rootChanges: [change('tests/ci-impact.test.mjs'), change(path)] }).selection.kernelFull, true);
  }
});

test('bounded real bundled literal and mixed Kernel delta reject policy mutants', async () => {
  const f = await fixture(); await f.publish('console', 'src/node/agent-request-report.ts'); f.commitHead();
  const wanted = plan => {
    assert.equal(plan.base.status, 'verified'); assert.equal(plan.selection.kernelFull, false);
    assert.equal(plan.selection.kernelBuildContracts, true); assert.equal(plan.selection.consoleRuntime, true);
    assert.equal(plan.selection.consoleBuild, true); assert.equal(plan.selection.consoleBrowser, 'all');
    assert.deepEqual(plan.components.find(item => item.id === 'kernel').changedPaths, []);
    assert.deepEqual(plan.components.find(item => item.id === 'console').changedPaths.map(item => item.path), ['src/node/agent-request-report.ts']);
  };
  wanted(await compute(f));
  const source = await readFile(new URL('../tools/ci-impact.mjs', import.meta.url), 'utf8');
  const broad = source.replace('ordinary(record) && consoleCompatibilityPaths.has(record.path)', 'false && consoleCompatibilityPaths.has(record.path)');
  assert.notEqual(broad, source);
  const file = join(f.base, 'literal-broad-mutant.mjs'); await writeFile(file, broad);
  const mutant = await import(file);
  const args = { root: f.root, eventName: 'pull_request', event: { pull_request: { base: { sha: f.baseCommit } } },
    testedSha: git(f.root, 'rev-parse', 'HEAD'), repository: 'example/qa', workflow: 'runtime', temporaryRoot: f.base };
  const awaitResult = await mutant.computeCiImpact(args);
  assert.throws(() => wanted(awaitResult), assert.AssertionError);
  // Preserve the prior owned checkout; restore must never overwrite a different pin.
  await rename(join(f.root, 'components/kernel'), join(f.base, 'kernel-before-mixed-delta'));
  await f.publish('kernel', 'src/service.ts', 'actual shared implementation change\n'); f.commitHead();
  const mixed = await compute(f); assert.equal(mixed.selection.kernelFull, true);
  assert.deepEqual(mixed.selection.kernelFocusedTests, []);
  const unsafe = source.replace("enable('kernelFull', why); compatibility(why);", "compatibility(why);")
    .replace('consoleCompatibilityPaths.has(record.path)', "record.path.startsWith('server/') || record.path.startsWith('src/')");
  assert.notEqual(unsafe, source);
  const unsafeFile = join(f.base, 'shared-exempt-mutant.mjs'); await writeFile(unsafeFile, unsafe);
  const unsafeApi = await import(unsafeFile);
  assert.throws(() => assert.equal(unsafeApi.classifyImpact({ cohort: 'pull_request', components: [
    component('console', [change('server/kernel-authority.mjs')]) ] }).selection.kernelFull, true), assert.AssertionError);
  const unsafePlan = await unsafeApi.computeCiImpact({ ...args, testedSha: git(f.root, 'rev-parse', 'HEAD') });
  assert.throws(() => assert.equal(unsafePlan.selection.kernelFull, true), assert.AssertionError);
});

// Only external PR discovery is doubled; restoration/comparison/history remain real.
async function boundedSourcePush(f, { before = f.baseCommit, base = f.baseCommit } = {}) {
  const originalFetch = globalThis.fetch; const originalToken = process.env.GITHUB_TOKEN;
  const head = git(f.root, 'rev-parse', 'HEAD');
  try {
    process.env.GITHUB_TOKEN = 'synthetic-never-logged';
    globalThis.fetch = async () => ({ ok: true, json: async () => [{ number: 42, state: 'open',
      head: { sha: head, ref: 'feature', repo: { full_name: 'example/qa' } }, base: { sha: base, repo: { full_name: 'example/qa' } } }] });
    const plan = await compute(f, { eventName: 'push', ref: 'refs/heads/feature', event: { before }, workflow: 'source' });
    assert.equal(process.env.GITHUB_TOKEN, undefined);
    return plan;
  } finally { globalThis.fetch = originalFetch; if (originalToken === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = originalToken; }
}

test('bounded source dedup admits exact paths on both scopes while retaining PR qualification', async context => {
  for (const path of ['tests/ci-impact.test.mjs', 'tests/qa-runtime-workflow.test.mjs', '.github/workflows/qa-runtime.yml']) {
    await context.test(path, async () => {
      const f = await fixture(); await mkdir(join(f.root, path, '..'), { recursive: true }); await writeFile(join(f.root, path), 'synthetic policy\n');
      const prior = f.commitHead();
      const push = await boundedSourcePush(f);
      assert.equal(push.duplicate.suppressed, true); assert.equal(push.selection.rootTests, false);
      assert.equal(push.selection.freelandControls, false); assert.match(push.duplicate.reason, /NOT_RUN_DUPLICATE_PR_PENDING/u);
      assert.equal(push.selection.kernelFull, path === '.github/workflows/qa-runtime.yml');
      const pr = await compute(f); assert.equal(pr.duplicate.suppressed, false); assert.equal(pr.selection.rootTests, true);
      assert.equal(pr.selection.kernelFull, path === '.github/workflows/qa-runtime.yml');
      await mkdir(join(f.root, 'docs'), { recursive: true }); await writeFile(join(f.root, 'docs/followup.md'), 'ordinary docs\n'); f.commitHead();
      assert.equal((await boundedSourcePush(f, { before: prior })).duplicate.suppressed, true);
    });
  }
  for (const path of ['tools/ci-impact.mjs', '.github/workflows/qa-source.yml']) await context.test(`ineligible ${path}`, async () => {
    const f = await fixture(); await mkdir(join(f.root, path, '..'), { recursive: true }); await writeFile(join(f.root, path), 'shared policy\n');
    const prior = f.commitHead();
    assert.equal((await boundedSourcePush(f)).duplicate.suppressed, false);
    await mkdir(join(f.root, 'docs'), { recursive: true }); await writeFile(join(f.root, 'docs/followup.md'), 'docs\n'); f.commitHead();
    const plan = await boundedSourcePush(f, { before: prior });
    assert.equal(plan.duplicate.suppressed, false); assert.equal(plan.selection.kernelFull, true);
  });
});

test('bounded dedup refuses removed unsafe and hidden push policy and changed bases', async context => {
  for (const kind of ['deleted', 'executable', 'symlink', 'hidden-selector', 'hidden-workflow']) await context.test(kind, async () => {
    const f = await fixture(); const path = kind === 'hidden-selector' ? 'tools/ci-impact.mjs' :
      kind === 'hidden-workflow' ? '.github/workflows/qa-runtime.yml' : 'tests/ci-impact.test.mjs';
    await mkdir(join(f.root, path, '..'), { recursive: true }); await writeFile(join(f.root, path), 'policy\n');
    const before = f.commitHead(); f.baseCommit = before;
    if (kind === 'executable') await chmod(join(f.root, path), 0o755);
    else if (kind === 'symlink') { await unlink(join(f.root, path)); await symlink('../sources/manifest.v1.json', join(f.root, path)); }
    else await unlink(join(f.root, path));
    f.commitHead();
    // PR diff is empty, but event.before includes the removed policy file.
    if (kind.startsWith('hidden-')) f.baseCommit = git(f.root, 'rev-parse', 'HEAD');
    const plan = await boundedSourcePush(f, { before });
    assert.equal(plan.duplicate.suppressed, false); assert.equal(plan.selection.kernelFull, true);
  });
  const f = await fixture(); f.commitHead();
  const disconnected = git(f.root, 'commit-tree', git(f.root, 'rev-parse', 'HEAD^{tree}'), '-m', 'Advanced disconnected base');
  for (const options of [{ base: disconnected }, { before: disconnected }]) {
    const plan = await boundedSourcePush(f, options);
    assert.equal(plan.duplicate.suppressed, false); assert.equal(plan.selection.kernelFull, true);
  }
  const originalToken = process.env.GITHUB_TOKEN;
  try {
    delete process.env.GITHUB_TOKEN;
    const plan = await compute(f, { eventName: 'push', ref: 'refs/heads/feature', event: { before: f.baseCommit }, workflow: 'source' });
    assert.equal(plan.duplicate.suppressed, false); assert.equal(plan.selection.kernelFull, true);
    assert.match(plan.reasons.kernelFull, /no read-only token/u);
  } finally { if (originalToken !== undefined) process.env.GITHUB_TOKEN = originalToken; }
});

test('bounded PR qualifies actual different-tree merge HEAD not its branch candidate', async () => {
  const f = await fixture(); git(f.root, 'checkout', '-b', 'feature');
  await mkdir(join(f.root, 'docs'), { recursive: true }); await writeFile(join(f.root, 'docs/feature.md'), 'feature\n');
  const branch = f.commitHead(); const branchTree = git(f.root, 'rev-parse', 'HEAD^{tree}');
  git(f.root, 'checkout', '-b', 'integration', f.baseCommit);
  await mkdir(join(f.root, 'docs'), { recursive: true }); await writeFile(join(f.root, 'docs/integration.md'), 'new base\n');
  const base = f.commitHead(); git(f.root, 'merge', '--no-ff', 'feature', '-m', 'Actual merged result');
  const merge = git(f.root, 'rev-parse', 'HEAD'); const mergeTree = git(f.root, 'rev-parse', 'HEAD^{tree}');
  assert.notEqual(branchTree, mergeTree);
  const pr = await compute(f, { event: { pull_request: { base: { sha: base }, head: { sha: branch } } } });
  assert.equal(pr.head.commit, merge); assert.equal(pr.head.tree, mergeTree); assert.equal(pr.base.commit, base);
  assert.equal(pr.selection.rootTests, true); assert.equal(pr.duplicate.suppressed, false); assert.match(pr.reasons.event, new RegExp(branch, 'u'));
  const integrated = await compute(f, { eventName: 'push', ref: 'refs/heads/develop', event: { before: base } });
  assert.equal(integrated.head.commit, merge); assert.equal(integrated.selection.kernelFull, true);
});

test('actual CLI emits selection-only JSON exclusively and refuses malformed flags/overwrite', async () => {
  const f = await fixture(); f.commitHead(); f.restore();
  const eventPath = join(f.base, 'event.json'); const output = join(f.base, 'selection.json'); await writeFile(eventPath, '{}');
  const cli = new URL('../tools/ci-impact.mjs', import.meta.url).pathname;
  const args = [cli, '--root', f.root, '--event-file', eventPath, '--workflow', 'runtime', '--output', output];
  const options = { encoding: 'utf8', env: { ...env, GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_SHA: git(f.root, 'rev-parse', 'HEAD'), GITHUB_REF: 'refs/heads/develop', GITHUB_REPOSITORY: 'example/qa' } };
  const result = spawnSync(process.execPath, args, options); assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(await readFile(output, 'utf8')); assert.equal(plan.selection.kernelFull, true); assert.equal(plan.qualification, 'selection_only');
  assert.equal(spawnSync(process.execPath, args, options).status, 1, 'existing caller output is preserved');
  assert.notEqual(spawnSync(process.execPath, [...args, '--unknown'], options).status, 0);
});
