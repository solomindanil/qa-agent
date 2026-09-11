import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(import.meta.dirname, '../..');
const script = join(repositoryRoot, 'scripts/paydemo-qah-finalize.mjs');

function completed(key, data) {
  return { key, description: key, outcome: { status: 'completed' }, data, artifacts: {} };
}

async function runFinalize(input) {
  const directory = await mkdtemp(join(tmpdir(), 'paydemo-finalize-test-'));
  const inputPath = join(directory, 'input.json');
  try {
    await writeFile(inputPath, JSON.stringify(input), 'utf8');
    const result = await execFileAsync(process.execPath, [script, inputPath], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });
    return JSON.parse(result.stdout);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('finalizes the clean path to Ready for Production only after verified cleanup', async () => {
  const envelope = await runFinalize({
    cleanup_clean_environment: completed('cleanup_clean_environment', {
      environment_id: 'qah-payd-22-buggy-v1',
      environment_status: 'STOPPED',
      pid_file: '/private/tmp/paydemo/server.pid',
    }),
  });
  assert.equal(envelope.item.key, 'finalize_qa_status');
  assert.equal(envelope.item.data.target_state, 'ready_for_production');
  assert.equal(envelope.item.data.overall_product_result, 'PASS');
  assert.match(envelope.item.data.route_reason, /очищен.*Ready for Production/i);
  assert.equal(envelope.artifact_outputs['item.artifacts.transition_report'], null);
});

test('finalizes confirmed findings to In Progress with the human reason', async () => {
  const envelope = await runFinalize({
    cleanup_risk_environment: completed('cleanup_risk_environment', {
      environment_id: 'qah-payd-22-buggy-v1',
      environment_status: 'ABSENT',
      pid_file: '/private/tmp/paydemo/server.pid',
    }),
    qa_owner_gate: completed('qa_owner_gate', {
      accepted: true,
      decision: 'accept_findings',
      review_note: 'Дефекты подтверждены, возвращаем разработчику.',
    }),
  });
  assert.equal(envelope.item.data.target_state, 'in_progress');
  assert.equal(envelope.item.data.overall_product_result, 'FAIL');
  assert.match(envelope.item.data.route_reason, /Дефекты подтверждены/);
});

test('automatically returns a risk result to In Progress after verified cleanup', async () => {
  const envelope = await runFinalize({
    cleanup_risk_environment: completed('cleanup_risk_environment', {
      environment_id: 'qah-payd-22-buggy-v1',
      environment_status: 'STOPPED',
      pid_file: '/private/tmp/paydemo/server.pid',
    }),
  });
  assert.equal(envelope.item.data.target_state, 'in_progress');
  assert.equal(envelope.item.data.overall_product_result, 'FAIL');
  assert.equal(envelope.item.data.overall_environment_status, 'HEALTHY');
  assert.match(envelope.item.data.route_reason, /автоматически.*In Progress/i);
});

test('finalizes an acknowledged environment failure to In Progress', async () => {
  const envelope = await runFinalize({
    environment_failure_gate: completed('environment_failure_gate', {
      accepted: true,
      decision: 'investigate_environment',
      review_note: 'Стенд не поднялся, нужна диагностика.',
    }),
  });
  assert.equal(envelope.item.data.target_state, 'in_progress');
  assert.equal(envelope.item.data.overall_environment_status, 'INFRA_FAILURE');
  assert.match(envelope.item.data.route_reason, /Стенд не поднялся/);
});

test('fails closed when a selected path has no authoritative completion receipt', async () => {
  await assert.rejects(
    runFinalize({ qa_owner_gate: completed('qa_owner_gate', {
      accepted: true,
      decision: 'accept_findings',
      review_note: 'Нет квитанции очистки.',
    }) }),
    /final|contract|path|cleanup/i,
  );
});
