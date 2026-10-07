import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const workflowUrl = new URL('../.github/workflows/qa-runtime.yml', import.meta.url);
const execFileAsync = promisify(execFile);

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
  // Execute that prefix, replacing only the product command with a builtin Node reader.
  const { stdout } = await execFileAsync('/bin/bash', [
    '--noprofile', '--norc', '-c',
    `${prefix}"$1" -e 'process.stdout.write(JSON.stringify({ offline: process.env.npm_config_offline, yes: process.env.npm_config_yes }))'`,
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

function validateRuntimeWorkflow(workflow) {
  const steps = consoleSteps(workflow);
  const isolated = steps.find((step) => /- name: Isolated Console runtime controls/u.test(step));
  assert.ok(isolated, 'isolated Console runtime step must exist');
  assert.match(isolated, /shell: bash\n {8}run: \|\n {10}set -euo pipefail\n/u);
  assert.match(isolated, /env -i \\\n {12}PATH="\$\{PATH\}" \\\n {12}CI=true \\/u);
  assert.match(isolated, /QA_STARTER_REPO="\$\{GITHUB_WORKSPACE\}\/components\/kernel" \\/u);
  assert.match(isolated, /QA_CONSOLE_STATE="\$\{qa_tmp\}\/receipts\.json" \\/u);
  assert.match(isolated, /QA_CONSOLE_PRIVATE_ROOT="\$\{qa_tmp\}\/private" \\/u);
  assert.match(isolated, /QA_REGISTRATION_STORE="\$\{qa_tmp\}\/store" \\/u);
  assert.match(isolated, /QA_REGISTRATION_TARGET_REGISTRY="\$\{qa_tmp\}\/targets\.json" \\/u);
  assert.match(isolated, /node --import tsx --test --test-concurrency=1 \\\n/u);
  assert.match(isolated, / {14}tests\/unit\/bridge-cli-authority\.test\.ts(?: \\)?(?:\n|$)/u,
    'A1 source-authority regression must be an executed test argument');

  assert.doesNotMatch(workflow, /\bcontinue-on-error\s*:\s*true\b/u,
    'no runtime job or step may suppress a failure');
  for (const step of steps) {
    assert.doesNotMatch(step, /\b(?:npm|npx|pnpm|yarn) (?:run )?test\b/u,
      'Console CI must not invoke a blanket child test command');
    assert.doesNotMatch(step, /\bcontinue-on-error\s*:\s*true\b|\bset \+e\b|\|\|\s*true\b/u,
      'Console failures must not be suppressed');
  }
}

test('runtime workflow executes A1 in the isolated fail-closed Console gate', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  validateRuntimeWorkflow(workflow);

  const mutants = [
    ['A1 omitted', workflow.replace('tests/unit/bridge-cli-authority.test.ts', 'tests/unit/other.test.ts')],
    ['isolation removed', workflow.replace('env -i \\', 'env \\')],
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
