import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const workflowUrl = new URL('../.github/workflows/qa-source.yml', import.meta.url);

function stepBlocks(workflow) {
  const lines = workflow.split('\n');
  const starts = lines
    .map((line, index) => (/^ {6}- /u.test(line) ? index : -1))
    .filter((index) => index >= 0);
  return starts.map((start, index) => lines.slice(start, starts[index + 1] ?? lines.length).join('\n'));
}

function normalizedStep(step) {
  return step.split('\n').map((line) => line.startsWith('      ') ? line.slice(6) : line).join('\n').trim();
}

function expectedRunBody(tempPrefix, command) {
  const runnerTemp = '${RUNNER_TEMP}';
  const path = '${PATH}';
  const qaTmp = '${qa_tmp}';
  const qaUmask = '${qa_umask}';
  return String.raw`set -euo pipefail
qa_umask="$(umask)"
umask 077
case "${runnerTemp}" in
  /*) ;;
  *) echo "RUNNER_TEMP must be absolute" >&2; exit 1 ;;
esac
qa_tmp="$(mktemp -d "${runnerTemp}/${tempPrefix}.XXXXXX")"
umask "${qaUmask}"
env -i \
  PATH="${path}" \
  CI=true \
  LANG=C.UTF-8 \
  TMPDIR="${qaTmp}" \
  ${command}`;
}

function expectedRunStep(name, tempPrefix, command, workingDirectory = null, condition = null) {
  const fields = [`- name: ${name}`];
  if (condition) fields.push(`  if: ${condition}`);
  if (workingDirectory) fields.push(`  working-directory: ${workingDirectory}`);
  fields.push('  shell: bash', '  run: |');
  fields.push(...expectedRunBody(tempPrefix, command).split('\n').map((line) => `    ${line}`));
  return fields.join('\n');
}

function assertNoFailureBypass(workflow) {
  assert.doesNotMatch(workflow, /^\s+continue-on-error:/mu);
}

const workflowHeader = `name: QA source safety

on:
  pull_request:
  push:
  workflow_dispatch:

permissions:
  contents: read
  pull-requests: read

jobs:
  source-safety:
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
`;

const expectedSteps = [
  `- name: Check out source
  uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  with:
    persist-credentials: false
    fetch-depth: 0`,
  `- name: Set up Node.js
  uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
  with:
    node-version: 22.23.1
    package-manager-cache: false`,
  expectedRunStep('Restore selected bundled sources', 'qa-source-restore', 'node tools/workspace.mjs restore'),
  expectedRunStep('Verify selected sources without repair', 'qa-source-verify', 'node tools/workspace.mjs verify'),
  expectedRunStep('Run root packaging tests', 'qa-root-tests', 'node --test tests/*.test.mjs', null, "steps.impact.outputs.root-tests == 'true'"),
  expectedRunStep('Verify selected Freeland provenance', 'qa-freeland-provenance', 'node tools/freeland-main/provenance.mjs --verify .', 'components/freeland', "steps.impact.outputs.freeland-controls == 'true'"),
  expectedRunStep('Run selected Freeland PAY01 pure oracle tests', 'qa-freeland-oracles', 'node --test tests/product-graph/freeland-pay-01-oracle.test.mjs', 'components/freeland', "steps.impact.outputs.freeland-controls == 'true'"),
  expectedRunStep('Run selected Freeland verdict generation snapshot tests', 'qa-freeland-verdict-snapshots', 'node --test tests/freeland-main/verdict-generation-snapshots.test.mjs', 'components/freeland', "steps.impact.outputs.freeland-controls == 'true'"),
];

function validateWorkflow(workflow) {
  const headerEnd = workflow.indexOf('    steps:\n') + '    steps:\n'.length;
  assert.ok(headerEnd >= '    steps:\n'.length, 'workflow must contain the source-safety steps mapping');
  assert.equal(workflow.slice(0, headerEnd), workflowHeader);
  assertNoFailureBypass(workflow);
  assert.match(workflow.slice(headerEnd), /^ {6}- /u, 'the first step must immediately follow the bound header');
  const steps = stepBlocks(workflow);
  const selection = steps.splice(4, 1)[0];
  assert.ok(selection, 'one bound selector step must precede selected commands');
  assert.match(normalizedStep(selection), /^- name: Select verified CI impact\n  id: impact\n  timeout-minutes: 3\n  shell: bash\n  env:\n    GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}\n  run: \|\n    set -euo pipefail\n/u);
  assert.doesNotMatch(selection, /^\s+(?:if|permissions|uses|continue-on-error):/mu);
  assert.match(selection, /node tools\/ci-impact\.mjs --root "\$\{GITHUB_WORKSPACE\}" --event-file "\$\{GITHUB_EVENT_PATH\}" --workflow source --output "\$\{qa_tmp\}\/selection\.json"/u);
  assert.match(selection, /env -i \\\n/u);
  assert.match(selection, /if \(plan\.unsupportedChanges\.length\) throw Error/u);
  assert.doesNotMatch(selection, /\|\|\s*true|set \+e|https?:\/\/|fetch\(|exec\(|spawn\(/u);
  assert.deepEqual(steps.map(normalizedStep), expectedSteps);
  const componentWorkflow = steps.join('\n');
  assert.doesNotMatch(workflow, /\b(?:npm|npx|pnpm|yarn|playwright|curl|wget|docker|sudo)\b/u);
  assert.doesNotMatch(componentWorkflow, /\$\{\{\s*secrets\.|https?:\/\/|BASE_URL|PASSWORD|TOKEN|NODE_OPTIONS|NODE_PATH|CODEX_HOME|\bHOME=/u);
  assert.doesNotMatch(componentWorkflow, /publish|deploy|artifact|release|issue|campaign|staging/iu);
}

test('qa-source workflow remains a bounded source-only fail-closed gate', async () => {
  const workflow = await readFile(workflowUrl, 'utf8').catch(() => null);
  assert.notEqual(workflow, null, '.github/workflows/qa-source.yml must exist');
  validateWorkflow(workflow);

  const commandMutants = [
    workflow.replace('node --test tests/*.test.mjs', 'npm test'),
    workflow.replace('set -euo pipefail', 'set -euo pipefail\n          echo broadened'),
    workflow.replace('      - name: Run selected Freeland PAY01 pure oracle tests', '      - name: Duplicate step\n        run: echo duplicate\n\n      - name: Run selected Freeland PAY01 pure oracle tests'),
  ];
  for (const mutant of commandMutants) {
    assert.throws(() => validateWorkflow(mutant), assert.AssertionError);
  }
  assert.throws(() => validateWorkflow(workflow.replace('shell: bash', 'continue-on-error: true\n        shell: bash')), assert.AssertionError);
  assert.throws(() => validateWorkflow(workflow.replace('shell: bash', 'if: always()\n        shell: bash')), assert.AssertionError);
});

test('actual source output reader reports duplicate NOT RUN and fails malformed selection', async () => {
  const workflow = await readFile(workflowUrl, 'utf8'); validateWorkflow(workflow);
  const selection = stepBlocks(workflow)[4];
  const script = selection.match(/<<'NODE'\n([\s\S]*?)\n {10}NODE/u)?.[1].split('\n').map(line => line.slice(10)).join('\n');
  assert.ok(script);
  const root = await mkdtemp(join(tmpdir(), 'qa-source-output-test-')); const file = join(root, 'plan.json');
  const plan = { schemaVersion: 1, qualification: 'selection_only', workflow: 'source',
    selection: { rootTests: false, freelandControls: false }, unsupportedChanges: [],
    reasons: { rootTests: 'NOT_RUN_DUPLICATE_PR_PENDING', freelandControls: 'NOT_RUN_DUPLICATE_PR_PENDING' }, head: {}, base: {}, components: [], duplicate: { suppressed: true } };
  await writeFile(file, JSON.stringify(plan));
  const options = { env: { GITHUB_OUTPUT: join(root, 'outputs'), GITHUB_STEP_SUMMARY: join(root, 'summary') }, encoding: 'utf8' };
  const good = spawnSync(process.execPath, ['-e', script.replace('process.argv[2]', 'process.argv[1]'), file], options);
  assert.equal(good.status, 0, good.stderr); assert.match(good.stdout, /NOT_RUN_DUPLICATE_PR_PENDING/u);
  assert.equal(await readFile(options.env.GITHUB_OUTPUT, 'utf8'), 'root-tests=false\nfreeland-controls=false\n');
  for (const invalid of [{ ...plan, selection: {} }, { ...plan, unsupportedChanges: ['unmapped Console test'] }, { ...plan, qualification: 'PASS' }]) {
    await writeFile(file, JSON.stringify(invalid)); assert.notEqual(spawnSync(process.execPath, ['-e', script.replace('process.argv[2]', 'process.argv[1]'), file], options).status, 0);
  }
});

test('qa-source validator rejects permission and unnamed-step broadenings', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const mutants = [
    ['job write-all', workflow.replace('    runs-on: ubuntu-24.04', '    permissions: write-all\n    runs-on: ubuntu-24.04')],
    ['job inline write', workflow.replace('    runs-on: ubuntu-24.04', '    permissions: { contents: read, id-token: write }\n    runs-on: ubuntu-24.04')],
    ['comment-suffixed write', workflow.replace('  contents: read', '  contents: read\n  id-token: write # broadened')],
    ['unnamed uses step', workflow.replace('    steps:', '    steps:\n      - uses: owner/action@1111111111111111111111111111111111111111')],
    ['unnamed run step', workflow.replace('    steps:', '    steps:\n      - run: echo broadened')],
  ];
  for (const [name, mutant] of mutants) {
    assert.throws(() => validateWorkflow(mutant), assert.AssertionError, name);
  }
});
