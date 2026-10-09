import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, mkdtemp, mkdir, writeFile, chmod, symlink } from 'node:fs/promises';
import { execFile, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const workflowUrl = new URL('../.github/workflows/qa-runtime.yml', import.meta.url);
const execFileAsync = promisify(execFile);

const dependencyIntakeTests = ['tests/unit/intake-build.test.ts', 'tests/unit/qa-init-cli.test.ts',
  'tests/unit/campaign-dependency-scope.test.ts', 'tests/unit/campaign-dependency-adapter.test.ts',
  'tests/unit/campaign-dependency-cli.test.ts'];

function dependencyIntakeJob(workflow) {
  const job = workflow.match(/^  console-dependency-intake:\n([\s\S]*?)(?=^  [a-z][a-z-]*:|$(?![\s\S]))/mu)?.[1];
  assert.ok(job, 'dedicated dependency/intake job must exist');
  assert.match(job, /^    needs: impact$/mu);
  assert.match(job, /^    if: needs\.impact\.outputs\.console-runtime == 'true'$/mu);
  assert.match(job, /^    runs-on: ubuntu-24\.04$/mu);
  assert.match(job, /^    timeout-minutes: 35$/mu);
  assert.match(job, /node-version: 22\.23\.1/u);
  assert.match(job, /node tools\/workspace\.mjs restore\n {10}node tools\/workspace\.mjs verify/u);
  for (const child of ['kernel', 'console']) assert.match(job, new RegExp(`npm ci --ignore-scripts --no-audit --no-fund --prefix components/${child}`));
  assert.match(job, /PLAYWRIGHT_BROWSERS_PATH: \$\{\{ runner\.temp \}\}\/qa-dependency-browsers/u);
  assert.match(job, /run: \.\/node_modules\/\.bin\/playwright install --with-deps chromium/u);
  assert.match(job, /- name: Verify dependency intake source integrity\n {8}if: always\(\)\n {8}run: node tools\/workspace\.mjs verify/u);
  assert.match(job, /mode: \$\{\{ steps\.dependency-result\.outputs\.mode \}\}/u);
  assert.match(job, /- name: Record dependency intake completion\n {8}id: dependency-result\n {8}run: echo 'mode=selected-complete' >> "\$GITHUB_OUTPUT"/u);
  assert.doesNotMatch(job, /continue-on-error|--test-name-pattern|--test-reporter-destination|--retries|npm run build|npm run typecheck/u);
  const command = job.match(/^ {12}node --import tsx --test --test-concurrency=1 \\\n((?: {14}tests\/unit\/[^\n]+\n?)+)/mu)?.[0];
  assert.ok(command, 'all five controls must be a sequential actual command');
  assert.deepEqual(command.replace(/\\\n/gu, ' ').trim().split(/\s+/u),
    ['node', '--import', 'tsx', '--test', '--test-concurrency=1', ...dependencyIntakeTests]);
  assert.match(workflow, /needs: \[impact, runtime-smoke, kernel-regression, console-dependency-intake\]/u);
  assert.match(workflow, /DEPENDENCY_RESULT: \$\{\{ needs\.console-dependency-intake\.result \}\}/u);
  assert.match(workflow, /DEPENDENCY_MODE: \$\{\{ needs\.console-dependency-intake\.outputs\.mode \}\}/u);
  return job;
}

test('dependency intake dedicated job executes exact controls in its own scrubbed environment', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const job = dependencyIntakeJob(workflow);
  const step = job.slice(job.indexOf('      - name: Isolated dependency intake controls')).split(/\n {6}- name: /u)[0];
  const prefix = step.match(/^ {10}env -i \\\n[\s\S]*?(?=^ {12}node --import tsx --test)/mu)?.[0];
  assert.ok(prefix);
  const command = step.match(/^ {12}node --import tsx --test --test-concurrency=1 \\\n((?: {14}tests\/unit\/[^\n]+\n?)+)/mu)?.[0];
  assert.ok(command);
  const args = command.slice('            node --import tsx --test --test-concurrency=1 \\\n'.length);
  const { stdout } = await execFileAsync('/bin/bash', ['--noprofile', '--norc', '-c',
    `${prefix}"$1" -e 'process.stdout.write(JSON.stringify({argv:process.argv.slice(1),env:process.env}))' -- \\\n${args}`,
    'qa-dependency-intake-env', process.execPath], { env: {
      PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, qa_tmp: '/tmp/owned-intake',
      GITHUB_WORKSPACE: '/tmp/own-source', RUNNER_TEMP: '/tmp/own-runner',
      GITHUB_TOKEN: 'must-not-leak', QA_STARTER_REPO: 'must-not-leak', npm_config_offline: 'false',
    } });
  const observed = JSON.parse(stdout);
  assert.deepEqual(observed.argv, dependencyIntakeTests);
  for (const [key, expected] of Object.entries({ CI: 'true', npm_config_offline: 'true', npm_config_yes: 'false',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', TSX_DISABLE_CACHE: '1', NODE_DISABLE_COMPILE_CACHE: '1',
    LANG: 'C.UTF-8', TMPDIR: '/tmp/owned-intake', QA_STARTER_REPO: '/tmp/own-source/components/kernel',
    QA_CONSOLE_STATE: '/tmp/owned-intake/receipts.json', QA_CONSOLE_PRIVATE_ROOT: '/tmp/owned-intake/private',
    QA_REGISTRATION_STORE: '/tmp/owned-intake/store', QA_REGISTRATION_TARGET_REGISTRY: '/tmp/owned-intake/targets.json',
    PLAYWRIGHT_BROWSERS_PATH: '/tmp/own-runner/qa-dependency-browsers' })) assert.equal(observed.env[key], expected, key);
  assert.equal(observed.env.GITHUB_TOKEN, undefined);
});

test('dependency intake wiring rejects missing job arguments guards and completion', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  dependencyIntakeJob(workflow);
  const job = dependencyIntakeJob(workflow);
  const mutants = [workflow.replace(`  console-dependency-intake:\n${job}`, ''),
    workflow.replace(job, job.replace("    if: needs.impact.outputs.console-runtime == 'true'", '    if: false')),
    workflow.replace(job, job.replace('    timeout-minutes: 35', '    timeout-minutes: 36')),
    workflow.replace(job, job.replace('node tools/workspace.mjs restore', 'echo skipped')),
    workflow.replace(job, job.replace('--prefix components/kernel', '--prefix components/other')),
    workflow.replace(job, job.replace('playwright install --with-deps chromium', 'echo no-browser')),
    workflow.replace(job, job.replace('        if: always()', '        if: success()')),
    workflow.replace("echo 'mode=selected-complete'", "echo 'mode=assumed'"),
    workflow.replace('kernel-regression, console-dependency-intake]', 'kernel-regression]')];
  for (const path of dependencyIntakeTests) mutants.push(workflow.replace(job, job.replace(path, 'tests/unit/unreviewed.test.ts')));
  mutants.push(workflow.replace(job, job.replace(dependencyIntakeTests[0], `${dependencyIntakeTests[0]} tests/fixtures/nuanu-readonly/fixture.ts`)));
  for (const [index, mutant] of mutants.entries()) {
    assert.notEqual(mutant, workflow);
    assert.throws(() => dependencyIntakeJob(mutant), assert.AssertionError, `dependency wiring mutant ${index}`);
  }
});

test('dependency intake terminal truth table refuses selected failure and accidental unselected execution', async () => {
  const body = nodeBody(await readFile(workflowUrl, 'utf8'), 'Validate selection and selected job results');
  const root = await mkdtemp(join(tmpdir(), 'qa-dependency-terminal-'));
  const run = (selected, result, mode) => {
    const s = { rootTests: true, freelandControls: false, kernelBuildContracts: selected, kernelFull: false,
      kernelFocusedTests: [], consoleBuild: false, consoleRuntime: selected, consoleBrowser: 'none', consoleS01Lifecycle: selected };
    const plan = { schemaVersion: 1, qualification: 'selection_only', workflow: 'runtime', selection: s,
      unsupportedChanges: [], head: {}, base: {}, reasons: Object.fromEntries(Object.keys(s).map(key => [key, 'literal reason'])) };
    const script = body.replace('${{ toJSON(needs.impact.outputs.plan) }}', JSON.stringify(JSON.stringify(plan)));
    return spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', env: {
      IMPACT_RESULT: 'success', RUNTIME_RESULT: 'success', KERNEL_RESULT: 'skipped', IMPACT_PLAN: JSON.stringify(plan),
      KERNEL_BUILD: String(selected), KERNEL_FULL: 'false', KERNEL_FOCUSED: '[]', CONSOLE_BUILD: 'false',
      CONSOLE_RUNTIME: String(selected), CONSOLE_BROWSER: 'none', CONSOLE_S01: String(selected),
      RUNTIME_MODE: selected ? 'selected-complete' : 'explicit-no-tests', GITHUB_STEP_SUMMARY: join(root, 'summary'),
      DEPENDENCY_RESULT: result, DEPENDENCY_MODE: mode,
    } });
  };
  assert.equal(run(true, 'success', 'selected-complete').status, 0);
  for (const result of ['failure', 'cancelled', 'skipped', '']) assert.notEqual(run(true, result, 'selected-complete').status, 0, result);
  for (const mode of ['', 'explicit-no-tests', 'assumed']) assert.notEqual(run(true, 'success', mode).status, 0, mode);
  assert.equal(run(false, 'skipped', '').status, 0);
  assert.match(run(false, 'skipped', '').stdout, /dependency intake: NOT RUN/u);
  for (const result of ['success', 'failure', 'cancelled', '']) assert.notEqual(run(false, result, '').status, 0, result);
});

function consoleSteps(workflow) {
  const lines = workflow.split('\n');
  const starts = lines
    .map((line, index) => (/^ {6}- name: /u.test(line) ? index : -1))
    .filter((index) => index >= 0);
  return starts.map((start, index) => lines.slice(start, starts[index + 1] ?? lines.length).join('\n'))
    .filter((step) => /working-directory: components\/console/u.test(step));
}

async function isolatedConsoleAcquisitionEnv(workflow) {
  const isolated = consoleSteps(workflow)
    .find((step) => /- name: Isolated Console runtime controls/u.test(step));
  assert.ok(isolated, 'isolated Console runtime step must exist');
  const prefix = isolated.match(/^ {10}env -i \\\n[\s\S]*?(?=^ {12}node --import tsx --test)/mu)?.[0];
  assert.ok(prefix, 'actual isolated environment prefix must precede the Console command');
  const nodeLine = '            node --import tsx --test --test-concurrency=1 \\\n';
  assert.ok(isolated.includes(nodeLine), 'fixed isolated Node gate must exist');
  const args = isolated.slice(isolated.indexOf(nodeLine) + nodeLine.length);
  // Execute that prefix, replacing only the product command with a builtin Node reader.
  const { stdout } = await execFileAsync('/bin/bash', [
    '--noprofile', '--norc', '-c',
    `${prefix}"$1" -e 'process.stdout.write(JSON.stringify({ offline: process.env.npm_config_offline, yes: process.env.npm_config_yes, argv: process.argv.slice(1) }))' -- \\\n${args}`,
    'qa-runtime-env-control', process.execPath,
  ], {
    env: {
      PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
      qa_tmp: tmpdir(),
      GITHUB_WORKSPACE: new URL('../', import.meta.url).pathname,
      npm_config_offline: 'must-not-leak',
      npm_config_yes: 'must-not-leak',
    },
  });
  return JSON.parse(stdout);
}

test('isolated Console child refuses npm network acquisition', async () => {
  const observed = await isolatedConsoleAcquisitionEnv(await readFile(workflowUrl, 'utf8'));
  assert.equal(observed.offline, 'true', 'isolated child must receive npm_config_offline=true');
});

test('isolated Console child refuses automatic npm acquisition consent', async () => {
  const observed = await isolatedConsoleAcquisitionEnv(await readFile(workflowUrl, 'utf8'));
  assert.equal(observed.yes, 'false', 'isolated child must receive npm_config_yes=false');
});

test('isolated Console child receives the fixture digest regression argument', async () => {
  const observed = await isolatedConsoleAcquisitionEnv(await readFile(workflowUrl, 'utf8'));
  assert.ok(observed.argv.includes('tests/unit/campaign-fixture-digests.test.ts'),
    'fixture digest control must be an actual isolated child argument');
});

test('isolated Console child receives both native outcomes export control arguments', async () => {
  const observed = await isolatedConsoleAcquisitionEnv(await readFile(workflowUrl, 'utf8'));
  assert.ok(observed.argv.includes('tests/unit/workspace-snapshot.test.ts'),
    'shared snapshot controls must be passed to the actual isolated child');
  assert.ok(observed.argv.includes('tests/unit/qa-outcomes-export.test.ts'),
    'native export controls must be passed to the actual isolated child');
});

test('isolated Console child receives request admission and association projection controls', async () => {
  const observed = await isolatedConsoleAcquisitionEnv(await readFile(workflowUrl, 'utf8'));
  assert.ok(observed.argv.includes('tests/unit/request-admission.test.ts'));
  assert.ok(observed.argv.includes('tests/unit/qa-outcomes.test.ts'));
});

test('fixture compiler invocation receives a portable project and no-output flags', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const build = consoleSteps(workflow).find(step => /- name: Console typecheck and production build/u.test(step));
  const command = build?.split('\n').find(line => /^ {10}\.\/node_modules\/\.bin\/tsc -p /u.test(line));
  assert.ok(command, 'targeted fixture compiler gate must exist');
  assert.doesNotMatch(command, /\|\||[;&|]/u, 'targeted compiler may not suppress or chain effects');
  const args = command.trim().slice('./node_modules/.bin/tsc'.length);
  const { stdout } = await execFileAsync('/bin/bash', [
    '--noprofile', '--norc', '-c',
    `"$1" -e 'process.stdout.write(JSON.stringify(process.argv.slice(1)))' --${args}`,
    'qa-fixture-type-argv-control', process.execPath,
  ], { env: { PATH: `${dirname(process.execPath)}:/usr/bin:/bin` } });
  assert.deepEqual(JSON.parse(stdout), ['-p', 'tsconfig.fixture-repair.json', '--noEmit', '--incremental', 'false']);
});

const fixtureRoots = [
  'scripts/qa-campaign.ts',
  'tests/fixtures/kernel-i1-authority.ts',
  'tests/fixtures/qa-campaign-evidence.ts',
  'tests/fixtures/nuanu-readonly/fixture.ts',
  'tests/unit/kernel-fixture-authority.test.ts',
  'tests/unit/human-help-continuation.test.ts',
  'tests/unit/registration-runtime.test.ts',
  'tests/unit/authored-fixture-authority.test.ts',
  'server/kernel-authority.d.mts',
  'server/runtime-paths.d.mts',
  'tests/unit/campaign-fixture-digests.test.ts',
  'tests/unit/workspace-snapshot.test.ts',
  'tests/unit/qa-outcomes-export.test.ts',
  'tests/unit/request-admission.test.ts',
  'tests/unit/qa-outcomes.test.ts',
];

function validateFixtureConfig(config) {
  assert.deepEqual(config, { extends: './tsconfig.json', include: [], files: fixtureRoots },
    'fixture compiler must use only the agreed relative roots and inherited options');
}

test('selected Console fixture compiler config preserves the exact portable roots', async () => {
  const root = new URL('../', import.meta.url);
  const { components } = JSON.parse(await readFile(new URL('sources/manifest.v1.json', root), 'utf8'));
  const selected = components.find(component => component.id === 'console');
  let source;
  try { source = await readFile(new URL(`${selected.path}/tsconfig.fixture-repair.json`, root), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  assert.ok(source, 'selected Console must deliver its fixture compiler config');
  const config = JSON.parse(source);
  validateFixtureConfig(config);
  for (const mutant of [
    { ...config, extends: '/private/other/tsconfig.json' },
    { ...config, include: ['src', 'tests/**'] },
    { ...config, files: config.files.slice(1) },
    { ...config, files: [...config.files, 'tests/e2e/primary-ui.spec.ts'] },
    { ...config, compilerOptions: { skipLibCheck: false } },
  ]) assert.throws(() => validateFixtureConfig(mutant), assert.AssertionError);
});

function validateRuntimeWorkflow(workflow) {
  const steps = consoleSteps(workflow);
  const isolated = steps.find((step) => /- name: Isolated Console runtime controls/u.test(step));
  assert.ok(isolated, 'isolated Console runtime step must exist');
  assert.match(isolated, /shell: bash\n {8}run: \|\n {10}set -euo pipefail\n/u);
  assert.match(isolated, /env -i \\\n {12}PATH="\$\{PATH\}" \\\n {12}CI=true \\/u);
  const selector = workflow.slice(workflow.indexOf('      - name: Select verified CI impact')).split(/\n {6}- name: /u)[0];
  assert.match(selector, /shell: bash\n {8}run: \|\n {10}set -euo pipefail\n/u);
  assert.match(selector, /env -i \\\n/u, 'selector environment is isolated independently from Console');
  assert.match(isolated, /QA_STARTER_REPO="\$\{GITHUB_WORKSPACE\}\/components\/kernel" \\/u);
  assert.match(isolated, /QA_CONSOLE_STATE="\$\{qa_tmp\}\/receipts\.json" \\/u);
  assert.match(isolated, /QA_CONSOLE_PRIVATE_ROOT="\$\{qa_tmp\}\/private" \\/u);
  assert.match(isolated, /QA_REGISTRATION_STORE="\$\{qa_tmp\}\/store" \\/u);
  assert.match(isolated, /QA_REGISTRATION_TARGET_REGISTRY="\$\{qa_tmp\}\/targets\.json" \\/u);
  assert.match(isolated, /node --import tsx --test --test-concurrency=1 \\\n/u);
  assert.match(isolated, / {14}tests\/unit\/bridge-cli-authority\.test\.ts(?: \\)?(?:\n|$)/u,
    'A1 source-authority regression must be an executed test argument');
  assert.match(isolated, / {14}tests\/unit\/campaign-fixture-digests\.test\.ts(?: \\)?(?:\n|$)/u,
    'fixture digest regression must remain an executed argument');
  assert.match(isolated, / {14}tests\/unit\/workspace-snapshot\.test\.ts(?: \\)?(?:\n|$)/u,
    'shared owner snapshot controls must be an executed argument');
  assert.match(isolated, / {14}tests\/unit\/qa-outcomes-export\.test\.ts(?: \\)?(?:\n|$)/u,
    'native outcomes export controls must be an executed argument');
  assert.match(isolated, / {14}tests\/unit\/request-admission\.test\.ts(?: \\)?(?:\n|$)/u,
    'request admission controls must be an executed argument');
  assert.match(isolated, / {14}tests\/unit\/qa-outcomes\.test\.ts(?: \\)?(?:\n|$)/u,
    'association projection controls must be an executed argument');
  const build = steps.find(step => /- name: Console typecheck and production build/u.test(step));
  assert.match(build, /^ {10}\.\/node_modules\/\.bin\/tsc -p tsconfig\.fixture-repair\.json --noEmit --incremental false$/mu,
    'targeted no-output fixture compiler gate must execute');

  assert.doesNotMatch(workflow, /\bcontinue-on-error\s*:\s*true\b/u,
    'no runtime job or step may suppress a failure');
  for (const step of steps) {
    assert.doesNotMatch(step, /\b(?:npm|npx|pnpm|yarn) (?:run )?test\b/u,
      'Console CI must not invoke a blanket child test command');
    assert.doesNotMatch(step, /\bcontinue-on-error\s*:\s*true\b|\bset \+e\b|\|\|\s*true\b/u,
      'Console failures must not be suppressed');
  }
  assert.doesNotMatch(workflow, /\bset \+e\b|\|\|\s*true\b/u, 'selector and non-Console jobs must also remain fail-closed');
}

test('runtime workflow executes A1 in the isolated fail-closed Console gate', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  validateRuntimeWorkflow(workflow);

  const mutants = [
    ['A1 omitted', workflow.replace('tests/unit/bridge-cli-authority.test.ts', 'tests/unit/other.test.ts')],
    ['fixture unit omitted', workflow.replace('tests/unit/campaign-fixture-digests.test.ts', 'tests/unit/other-fixture.test.ts')],
    ['shared snapshot omitted', workflow.replace('tests/unit/workspace-snapshot.test.ts', 'tests/unit/other-snapshot.test.ts')],
    ['native export omitted', workflow.replace('tests/unit/qa-outcomes-export.test.ts', 'tests/unit/other-export.test.ts')],
    ['request admission omitted', workflow.replace('tests/unit/request-admission.test.ts', 'tests/unit/other-admission.test.ts')],
    ['association projection omitted', workflow.replace('tests/unit/qa-outcomes.test.ts', 'tests/unit/other-projection.test.ts')],
    ['fixture compiler omitted', workflow.replace('          ./node_modules/.bin/tsc -p tsconfig.fixture-repair.json --noEmit --incremental false\n', '')],
    ['fixture compiler suppression', workflow.replace('tsconfig.fixture-repair.json --noEmit --incremental false', 'tsconfig.fixture-repair.json --noEmit --incremental false || true')],
    ['fixture test suppression', workflow.replace('tests/unit/campaign-fixture-digests.test.ts \\', 'tests/unit/campaign-fixture-digests.test.ts || true \\')],
    ['isolation removed', workflow.replaceAll('env -i \\', 'env \\')],
    ['receipt state escapes temp', workflow.replace('QA_CONSOLE_STATE="${qa_tmp}/receipts.json"', 'QA_CONSOLE_STATE="/tmp/receipts.json"')],
    ['private root escapes temp', workflow.replace('QA_CONSOLE_PRIVATE_ROOT="${qa_tmp}/private"', 'QA_CONSOLE_PRIVATE_ROOT="/tmp/private"')],
    ['registration store escapes temp', workflow.replace('QA_REGISTRATION_STORE="${qa_tmp}/store"', 'QA_REGISTRATION_STORE="/tmp/store"')],
    ['target registry escapes temp', workflow.replace('QA_REGISTRATION_TARGET_REGISTRY="${qa_tmp}/targets.json"', 'QA_REGISTRATION_TARGET_REGISTRY="/tmp/targets.json"')],
    ['fail-closed shell removed', workflow.replace('set -euo pipefail', 'set +e')],
    ['blanket Console suite', workflow.replace('node --import tsx --test --test-concurrency=1', 'npm test --')],
    ['step failure bypass', workflow.replace('      - name: Isolated Console runtime controls', '      - name: Isolated Console runtime controls\n        continue-on-error: true')],
    ['job failure bypass', workflow.replace('  runtime-smoke:\n', '  runtime-smoke:\n    continue-on-error: true\n')],
    ['shell failure bypass', workflow.replace('tests/unit/campaign-continuation-readback-faults.test.mjs', 'tests/unit/campaign-continuation-readback-faults.test.mjs || true')],
  ];
  for (const [name, mutant] of mutants) {
    assert.notEqual(mutant, workflow, `${name} mutation must change the workflow`);
    assert.throws(() => validateRuntimeWorkflow(mutant), assert.AssertionError, name);
  }
});

function declaredRuntimeEvents(workflow) {
  assert.equal(workflow.match(/^on:/gmu)?.length, 1, 'exactly one runtime event declaration is required');
  const block = workflow.match(/^on:\n((?:[ \t][^\n]*\n|\n)*)(?=\S)/mu)?.[1];
  const declaration = block?.match(
    /^  (pull_request):\n  (push):\n    branches: \[([^\]\n]*)\]\n    tags: \[([^\]\n]*)\]\n  (workflow_dispatch):\n\n$/u,
  );
  assert.ok(declaration, 'runtime events must retain unrestricted PR/manual and only push branch/tag lists');
  const entries = (list) => list.split(',').map(entry => entry.trim().replace(/^(['"])(.*)\1$/u, '$2'));
  return {
    events: new Set([declaration[1], declaration[2], declaration[5]]),
    branches: entries(declaration[3]),
    tags: entries(declaration[4]),
  };
}

// Finite model of this declared event contract, not GitHub-hosted execution.
function selectsRuntimeEvent(declared, { name, refType, ref }) {
  if (!declared.events.has(name)) return false;
  if (name !== 'push') return true;
  if (refType === 'branch') return declared.branches.includes(ref);
  if (refType === 'tag') return declared.tags.includes('**');
  return false;
}

function validateRuntimeEventContract(workflow) {
  const declared = declaredRuntimeEvents(workflow);
  assert.deepEqual(declared.branches, ['develop', 'codex/stable-20260926'],
    'runtime push qualification must cover only the established integration/default branches');
  assert.deepEqual(declared.tags, ['**'], 'all tag pushes must receive runtime qualification');
  return declared;
}

test('runtime declaration selects integrated branch/tag pushes and unrestricted PR/manual events', async () => {
  const declared = validateRuntimeEventContract(await readFile(workflowUrl, 'utf8'));
  const cases = [
    [{ name: 'push', refType: 'branch', ref: 'codex/feature-small-change' }, false],
    [{ name: 'push', refType: 'branch', ref: 'develop' }, true],
    [{ name: 'push', refType: 'branch', ref: 'codex/stable-20260926' }, true],
    [{ name: 'push', refType: 'branch', ref: 'release/future-branch' }, false],
    [{ name: 'push', refType: 'tag', ref: 'v1.2.3' }, true],
    [{ name: 'push', refType: 'tag', ref: 'release/2026-10' }, true],
    [{ name: 'pull_request', base: 'develop' }, true],
    [{ name: 'pull_request', base: 'codex/stable-20260926' }, true],
    [{ name: 'pull_request', base: 'another-base' }, true],
    [{ name: 'workflow_dispatch' }, true],
    [{ name: 'release' }, false],
  ];
  for (const [event, expected] of cases) {
    assert.equal(selectsRuntimeEvent(declared, event), expected, JSON.stringify(event));
  }
  // A feature push without a PR is unqualified, not a reused runtime PASS.
});

test('runtime event contract rejects missing qualification and restricted or widened filters', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  validateRuntimeEventContract(workflow);
  const mutants = [
    ['develop omitted', workflow.replace('branches: [develop, codex/stable-20260926]', 'branches: [codex/stable-20260926]')],
    ['default branch omitted', workflow.replace('branches: [develop, codex/stable-20260926]', 'branches: [develop]')],
    ['branch list omitted', workflow.replace('    branches: [develop, codex/stable-20260926]\n', '')],
    ['tag list omitted', workflow.replace("    tags: ['**']\n", '')],
    ['tags restricted', workflow.replace("tags: ['**']", "tags: ['v*']")],
    ['PR omitted', workflow.replace('  pull_request:\n', '')],
    ['manual omitted', workflow.replace('  workflow_dispatch:\n', '')],
    ['feature wildcard added', workflow.replace('branches: [develop, codex/stable-20260926]', "branches: [develop, codex/stable-20260926, 'codex/**']")],
    ['PR base restricted', workflow.replace('  pull_request:\n', '  pull_request:\n    branches: [develop]\n')],
    ['PR activity restricted', workflow.replace('  pull_request:\n', '  pull_request:\n    types: [opened]\n')],
    ['PR paths restricted', workflow.replace('  pull_request:\n', "  pull_request:\n    paths: ['src/**']\n")],
    ['push paths restricted', workflow.replace('  push:\n', "  push:\n    paths: ['src/**']\n")],
    ['unexpected push key', workflow.replace('  push:\n', '  push:\n    branches-ignore: [docs]\n')],
  ];
  for (const [name, mutant] of mutants) {
    assert.notEqual(mutant, workflow, `${name} mutation must change the workflow`);
    assert.throws(() => validateRuntimeEventContract(mutant), assert.AssertionError, name);
  }
});

test('the permanent browser command actually receives the accepted finite regression argument', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const step = consoleSteps(workflow).find(step => step.includes('- name: Browser healthy and broken fixture controls'));
  const command = step?.split('\n').find(line => /^ {12}node --import tsx --test /u.test(line));
  assert.ok(command, 'the all-browser command must be explicit');
  const args = command.trim().slice('node --import tsx --test'.length);
  const { stdout } = await execFileAsync('/bin/bash', ['--noprofile', '--norc', '-c',
    `"$1" -e 'process.stdout.write(JSON.stringify(process.argv.slice(1)))' --${args}`,
    'qa-permanent-browser-argv', process.execPath], { env: { PATH: `${dirname(process.execPath)}:/usr/bin:/bin` } });
  assert.deepEqual(JSON.parse(stdout), ['tests/unit/browser-journey.test.ts',
    'tests/unit/public-input-campaign.test.ts', 'tests/unit/browser-action-sequence.test.ts',
    'tests/e2e/selected-campaign-local.test.mjs']);
});

function nodeBody(workflow, stepName) {
  const at = workflow.indexOf(`      - name: ${stepName}`);
  assert.notEqual(at, -1, stepName);
  const body = workflow.slice(at).match(/<<'NODE'\n([\s\S]*?)\n {10}NODE/u)?.[1];
  assert.ok(body, stepName);
  return body.split('\n').map(line => line.slice(10)).join('\n');
}

test('materialized selection survives large plans and treats hostile quote data as inert input', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const root = await mkdtemp(join(tmpdir(), 'qa-large-selection-'));
  const marker = join(root, 'must-not-execute');
  const selection = { rootTests: true, freelandControls: false, kernelBuildContracts: false, kernelFull: false,
    kernelFocusedTests: [], consoleBuild: false, consoleRuntime: false, consoleBrowser: 'finite', consoleS01Lifecycle: false };
  const hostile = `";require('node:fs').writeFileSync(${JSON.stringify(marker)},'unsafe');//\nNODE\n$(touch ${marker})\n\`touch ${marker}\``;
  const plan = { schemaVersion: 1, qualification: 'selection_only', workflow: 'runtime', selection,
    unsupportedChanges: [], head: {commit:'1'.repeat(40)}, base: {commit:'2'.repeat(40)},
    reasons: Object.fromEntries(Object.keys(selection).map(key => [key, `${hostile}${'x'.repeat(150_000)}`])) };
  // One large reason is sufficient to exceed Linux's single environment-entry limit.
  for (const key of Object.keys(plan.reasons).slice(1)) plan.reasons[key] = hostile;
  const encoded = JSON.stringify(plan);
  assert.ok(Buffer.byteLength(encoded) > 128 * 1024 && Buffer.byteLength(encoded) < 1024 * 1024);
  for (const step of ['Record actual selected runtime completion', 'Validate selection and selected job results']) {
    const body = nodeBody(workflow, step);
    const run = async input => {
      const file = join(root, 'actual-workflow-script.sh');
      // GitHub toJSON renders a JSON string literal, never a template or shell expansion.
      await writeFile(file, `node <<'NODE'\n${body.replace('${{ toJSON(needs.impact.outputs.plan) }}', JSON.stringify(input))}\nNODE\n`);
      return spawnSync('/bin/bash', ['--noprofile', '--norc', file], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, env: {
        PATH: `${dirname(process.execPath)}:/usr/bin:/bin`,
        IMPACT_RESULT:'success', RUNTIME_RESULT:'success', KERNEL_RESULT:'skipped',
        KERNEL_BUILD:'false', KERNEL_FULL:'false', KERNEL_FOCUSED:'[]', CONSOLE_BUILD:'false', CONSOLE_RUNTIME:'false',
        CONSOLE_BROWSER:'finite', CONSOLE_S01:'false', RUNTIME_MODE:'selected-complete',
        DEPENDENCY_RESULT:'skipped', DEPENDENCY_MODE:'',
        GITHUB_OUTPUT:join(root,'outputs'), GITHUB_STEP_SUMMARY:join(root,'summary'),
      } });
    };
    const healthy = await run(encoded);
    assert.equal(healthy.status, 0, `${step}: ${healthy.stderr}`);
    if (step === 'Validate selection and selected job results') assert.ok(healthy.stdout.includes(hostile), 'full reason data survives');
    await assert.rejects(readFile(marker), {code:'ENOENT'});
    assert.notEqual((await run('{broken')).status, 0, step);
    const oversized = await run(JSON.stringify({...plan,reasons:{...plan.reasons,rootTests:'x'.repeat(1024*1024)}}));
    assert.notEqual(oversized.status, 0, step);
    assert.match(oversized.stderr, /Selection plan exceeds materialization bound/u);
    assert.notEqual((await run(null)).status, 0, step);
  }
});


test('terminal selected-results checker actually rejects failures and incomplete selection', async () => {
  const body = nodeBody(await readFile(workflowUrl, 'utf8'), 'Validate selection and selected job results');
  const root = await mkdtemp(join(tmpdir(), 'qa-runtime-terminal-test-'));
  const selection = { rootTests: true, freelandControls: false, kernelBuildContracts: false, kernelFull: false,
    kernelFocusedTests: [], consoleBuild: false, consoleRuntime: false, consoleBrowser: 'finite', consoleS01Lifecycle: false };
  const plan = { schemaVersion: 1, qualification: 'selection_only', workflow: 'runtime', selection, unsupportedChanges: [], head: {}, base: {},
    reasons: Object.fromEntries(Object.keys(selection).map(key => [key, 'literal test reason'])) };
  const run = (changes = {}, changedPlan = plan) => {
    const s = changedPlan.selection ?? selection;
    const selected = s.kernelBuildContracts || s.consoleBuild || s.consoleRuntime || s.consoleBrowser !== 'none' || s.consoleS01Lifecycle || s.kernelFocusedTests?.length;
    const script = body.replace('${{ toJSON(needs.impact.outputs.plan) }}', JSON.stringify(JSON.stringify(changedPlan)));
    return spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', env: {
      IMPACT_RESULT: 'success', RUNTIME_RESULT: 'success', KERNEL_RESULT: 'skipped', IMPACT_PLAN: JSON.stringify(changedPlan),
      KERNEL_BUILD: String(s.kernelBuildContracts), KERNEL_FULL: String(s.kernelFull), KERNEL_FOCUSED: JSON.stringify(s.kernelFocusedTests),
      CONSOLE_BUILD: String(s.consoleBuild), CONSOLE_RUNTIME: String(s.consoleRuntime), CONSOLE_BROWSER: String(s.consoleBrowser), CONSOLE_S01: String(s.consoleS01Lifecycle),
      RUNTIME_MODE: selected ? 'selected-complete' : 'explicit-no-tests', GITHUB_STEP_SUMMARY: join(root, 'summary'),
      DEPENDENCY_RESULT: s.consoleRuntime ? 'success' : 'skipped', DEPENDENCY_MODE: s.consoleRuntime ? 'selected-complete' : '', ...changes } });
  };
  assert.equal(run().status, 0); assert.match(run().stdout, /kernelFull: NOT RUN/u);
  assert.equal(run({ KERNEL_RESULT: 'success' }, { ...plan, selection: { ...selection, kernelFull: true } }).status, 0);
  for (const result of ['failure', 'cancelled', 'timed_out', 'skipped', '']) {
    assert.notEqual(run({ IMPACT_RESULT: result }).status, 0);
    assert.notEqual(run({ RUNTIME_RESULT: result }).status, 0);
    assert.notEqual(run({ KERNEL_RESULT: result }, { ...plan, selection: { ...selection, kernelFull: true } }).status, 0);
  }
  for (const invalid of [{}, { ...plan, qualification: 'PASS' }, { ...plan, unsupportedChanges: ['new test'] },
    { ...plan, selection: { ...selection, kernelFull: undefined } }, { ...plan, reasons: {} },
    { ...plan, reasons: { ...plan.reasons, consoleBrowser: undefined } }]) assert.notEqual(run({}, invalid).status, 0);
  assert.notEqual(run({ KERNEL_RESULT: 'success' }).status, 0, 'an unselected shard cannot be relabelled as selected PASS');
  for (const key of ['KERNEL_BUILD','KERNEL_FULL','KERNEL_FOCUSED','CONSOLE_BUILD','CONSOLE_RUNTIME','CONSOLE_BROWSER','CONSOLE_S01','RUNTIME_MODE']) assert.notEqual(run({ [key]: '' }).status, 0, `missing ${key}`);
  assert.equal(run({}, { ...plan, selection: { ...selection, consoleBrowser: 'none' } }).status, 0, 'explicit no-tests is a bounded result, not full runtime PASS');
  assert.notEqual(run({ RUNTIME_MODE: 'selected-complete' }, { ...plan, selection: { ...selection, consoleBrowser: 'none' } }).status, 0);
});

test('selected S01 actual argv/env keeps only its accepted lifecycle controls isolated', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const step = consoleSteps(workflow).find(item => item.includes('- name: Selected S01 owned lifecycle controls'));
  assert.ok(step);
  const prefix = step.match(/^ {10}env -i \\\n[\s\S]*?(?=^ {12}node --import tsx --test)/mu)?.[0];
  const commandStart = step.indexOf('            node --import tsx --test --test-concurrency=1 \\\n');
  assert.ok(prefix); assert.notEqual(commandStart, -1);
  const args = step.slice(commandStart + '            node --import tsx --test --test-concurrency=1 \\\n'.length);
  const { stdout } = await execFileAsync('/bin/bash', ['--noprofile', '--norc', '-c',
    `${prefix}"$1" -e 'process.stdout.write(JSON.stringify({argv:process.argv.slice(1), offline:process.env.npm_config_offline, yes:process.env.npm_config_yes, privateRoot:process.env.QA_CONSOLE_PRIVATE_ROOT, tokenPresent:Boolean(process.env.GITHUB_TOKEN)}))' -- \\\n${args}`,
    'qa-s01-argv-env', process.execPath], { env: { PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, qa_tmp: tmpdir(), GITHUB_WORKSPACE: new URL('../', import.meta.url).pathname, GITHUB_TOKEN: 'must-not-leak' } });
  const observed = JSON.parse(stdout);
  assert.deepEqual(observed.argv, ['--test-name-pattern=^S01 owned lifecycle abort', 'tests/unit/nuanu-authored-revision.test.ts']);
  assert.equal(observed.offline, 'true'); assert.equal(observed.yes, 'false'); assert.equal(observed.tokenPresent, false);
  assert.equal(observed.privateRoot, join(tmpdir(), 'private'));
});

test('workflow job budgets retain the reviewed finite aggregate allowance and independent deadlines', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const validate = value => {
    const jobsStart = value.indexOf('\njobs:\n');
    assert.notEqual(jobsStart, -1, 'job budgets must be validated within the actual jobs section');
    const lines = value.slice(jobsStart + '\njobs:\n'.length).split('\n');
    const starts = lines.map((line, index) => /^ {2}[a-z][a-z-]*:$/u.test(line) ? index : -1)
      .filter(index => index >= 0);
    const budgets = Object.fromEntries(starts.map((start, index) => {
      const job = lines[start].trim().slice(0, -1);
      const body = lines.slice(start + 1, starts[index + 1] ?? lines.length).join('\n');
      const caps = [...body.matchAll(/^ {4}timeout-minutes: (.+)$/gmu)];
      assert.equal(caps.length, 1, `${job} must have exactly one literal job-level budget`);
      return [job, caps[0][1]];
    }));
    assert.deepEqual(budgets, { impact: '5', 'runtime-smoke': '35', 'console-dependency-intake': '35', 'kernel-regression': '60', 'runtime-qualification': '5' });
    assert.deepEqual([...value.matchAll(/^ {8}timeout-minutes: (.+)$/gmu)].map(match => match[1]), ['3'],
      'independent selector step deadline must remain unchanged');
  };
  validate(workflow);
  for (const mutant of [
    workflow.replace('    timeout-minutes: 35\n', '    timeout-minutes: 25\n'),
    workflow.replace('    timeout-minutes: 35\n', ''),
    workflow.replace('    timeout-minutes: 35\n', '    timeout-minutes: ${{ 35 }}\n'),
    workflow.replace('    timeout-minutes: 35\n', '    timeout-minutes: 36\n'),
    workflow.replace('    timeout-minutes: 35\n', '        timeout-minutes: 35\n'),
    workflow.replace('    timeout-minutes: 60\n', '    timeout-minutes: 61\n'),
    workflow.replace('    timeout-minutes: 5\n', '    timeout-minutes: 6\n'),
    workflow.replace('  runtime-qualification:\n', '  runtime-qualification:\n    timeout-minutes: 6\n'),
    workflow.replace('        timeout-minutes: 3\n', '        timeout-minutes: 4\n'),
  ]) assert.throws(() => validate(mutant), assert.AssertionError);
});

test('impact-dependent workflow wiring preserves bootstrap, shard isolation and failure propagation', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const validate = value => {
    validateRuntimeWorkflow(value); validateRuntimeEventContract(value);
    assert.match(value, /kernel-regression:\n    needs: impact\n    if: needs\.impact\.outputs\.kernel-full == 'true'/u);
    assert.match(value, /runtime-smoke:\n    needs: impact/u);
    assert.match(value, /runtime-qualification:[\s\S]*?if: always\(\)\n    needs: \[impact, runtime-smoke, kernel-regression, console-dependency-intake\]/u);
    assert.match(value, /timeout-minutes: 3/u);
    assert.match(value, /- name: Select verified CI impact[\s\S]*?env -i \\\n/u);
    assert.match(value, /- name: Install isolated Chromium for local fixture checks\n        if: needs\.impact\.outputs\.console-browser != 'none'\n        working-directory: components\/console/u);
    assert.match(value, /node tools\/ci-impact\.mjs --root "\$\{GITHUB_WORKSPACE\}" --event-file "\$\{GITHUB_EVENT_PATH\}" --workflow runtime/u);
    assert.match(value, /--test-name-pattern='\^S01 owned lifecycle abort' tests\/unit\/nuanu-authored-revision\.test\.ts/u);
    assert.match(value, /node --import tsx --test tests\/unit\/browser-journey\.test\.ts tests\/unit\/public-input-campaign\.test\.ts tests\/unit\/browser-action-sequence\.test\.ts/u);
    assert.match(value, /fail-fast: false\n      matrix:\n        group: \[workspace, service, remaining\]/u);
    assert.doesNotMatch(value, /paths(?:-ignore)?:|cancel-in-progress:|continue-on-error:/u);
    assert.match(value, /^permissions:\n  contents: read\n\njobs:/mu);
    assert.doesNotMatch(value, /secrets\.|GITHUB_TOKEN|GH_TOKEN|BASE_URL|PASSWORD|\|\|\s*true|set \+e/u);
    const allowedConditions = new Set([
      "needs.impact.outputs.kernel-build == 'true'",
      "needs.impact.outputs.console-build == 'true' || needs.impact.outputs.console-runtime == 'true' || needs.impact.outputs.console-browser != 'none' || needs.impact.outputs.console-s01 == 'true'",
      "needs.impact.outputs.console-build == 'true'", "needs.impact.outputs.console-runtime == 'true'",
      "needs.impact.outputs.console-runtime == 'true' && needs.impact.outputs.console-build != 'true'",
      "needs.impact.outputs.console-browser != 'none'", "needs.impact.outputs.kernel-focused != '[]'",
      "needs.impact.outputs.console-s01 == 'true'", "needs.impact.outputs.console-browser == 'all'",
      "needs.impact.outputs.console-browser == 'finite'",
      "needs.impact.outputs.kernel-build != 'true' && needs.impact.outputs.console-build != 'true' && needs.impact.outputs.console-runtime != 'true' && needs.impact.outputs.console-browser == 'none' && needs.impact.outputs.console-s01 != 'true'",
      "needs.impact.outputs.kernel-full == 'true'", 'always()',
    ]);
    for (const match of value.matchAll(/^\s+if: (.+)$/gmu)) assert.ok(allowedConditions.has(match[1]), `unreviewed condition: ${match[1]}`);
    for (const match of value.matchAll(/^\s+uses: (.+)$/gmu)) assert.ok([
      'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
      'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
    ].includes(match[1]), 'only existing pinned actions');
    assert.equal([...value.matchAll(/^ {6}- /gmu)].length, [...value.matchAll(/^ {6}- name: /gmu)].length, 'no unnamed executable steps');
  };
  validate(workflow);
  for (const mutant of [workflow.replaceAll('tests/unit/browser-action-sequence.test.ts', 'tests/unit/unrelated.test.ts'),
    workflow.replace("--test-name-pattern='^S01 owned lifecycle abort'", "--test-name-pattern='unrelated'"),
    workflow.replace("if: needs.impact.outputs.kernel-full == 'true'", 'if: false'),
    workflow.replace('env -i \\', 'env \\'), workflow.replace('fail-fast: false', 'fail-fast: true'),
    workflow.replace('runtime-smoke:\n', 'runtime-smoke:\n    continue-on-error: true\n'),
    workflow.replace("if: needs.impact.outputs.console-browser != 'none'", "if: needs.impact.outputs.console-browser != 'none' unexpected"),
    workflow.replace('contents: read', 'contents: read\n  id-token: write')]) assert.throws(() => validate(mutant), assert.AssertionError);
});

test('finite compiler actual argv remains two-file and no-output', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const step = consoleSteps(workflow).find(item => item.includes('- name: Finite browser no-output compiler'));
  const command = step?.split('\n').find(line => line.startsWith('        run: ./node_modules/.bin/tsc '));
  assert.ok(command);
  const args = command.slice('        run: ./node_modules/.bin/tsc'.length);
  const { stdout } = await execFileAsync('/bin/bash', ['--noprofile','--norc','-c',
    `"$1" -e 'process.stdout.write(JSON.stringify(process.argv.slice(1)))' --${args}`, 'qa-finite-compiler-argv',process.execPath],
    { env: { PATH: `${dirname(process.execPath)}:/usr/bin:/bin` } });
  assert.deepEqual(JSON.parse(stdout), ['--noEmit','--incremental','false','--target','ES2022','--module','ESNext',
    '--moduleResolution','bundler','--strict','--skipLibCheck','--lib','ES2022,DOM,DOM.Iterable','--types','node',
    'tests/fixtures/browser-action-sequence/check.ts','tests/unit/browser-action-sequence.test.ts']);
});

test('exact Kernel workflow actually supplies array argv and rejects hostile paths before spawn', async () => {
  const script = nodeBody(await readFile(workflowUrl, 'utf8'), 'Exact affected Kernel tests');
  const root = await mkdtemp(join(tmpdir(), 'qa-kernel-argv-control-')); await mkdir(join(root, 'node_modules/.bin'), { recursive: true });
  await mkdir(join(root, 'tests/unit'), { recursive: true }); await writeFile(join(root, 'tests/unit/safe.test.ts'), '// synthetic');
  const marker = join(root, 'actual-argv.json'); const executable = join(root, 'node_modules/.bin/vitest');
  await writeFile(executable, `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, JSON.stringify(process.argv.slice(2)));\n`); await chmod(executable, 0o755);
  const run = paths => spawnSync(process.execPath, ['-e',script], { cwd: root, encoding:'utf8',env: { KERNEL_FOCUSED: JSON.stringify(paths) } });
  assert.equal(run(['tests/unit/safe.test.ts']).status, 0);
  assert.deepEqual(JSON.parse(await readFile(marker, 'utf8')), ['run','tests/unit/safe.test.ts']);
  await symlink(join(root, 'tests/unit/safe.test.ts'), join(root, 'tests/unit/link.test.ts'));
  for (const paths of [[],['--run'],['tests/../safe.test.ts'],['tests/unit/safe.test.ts','tests/unit/safe.test.ts'],['tests/unit/link.test.ts'],['tests/unit/-option.test.ts'],['tests/unit/bad\npath.test.ts']]) {
    await writeFile(marker, 'not spawned'); assert.notEqual(run(paths).status, 0); assert.equal(await readFile(marker, 'utf8'), 'not spawned');
  }
});
