import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(import.meta.dirname, '../..');
const routeScript = join(repositoryRoot, 'scripts/paydemo-qah-route.mjs');

const reviewArtifact = Object.freeze({
  artifact_id: '11111111-1111-4111-8111-111111111111',
  version_id: '22222222-2222-4222-8222-222222222222',
  kind: 'document',
  role: 'output',
  media_type: 'text/markdown',
});

function synthesisData(overrides = {}) {
  return {
    overall_product_result: 'PASS',
    overall_environment_status: 'HEALTHY',
    overall_evidence_status: 'VERIFIED',
    min_confidence: 1,
    finding_count: 0,
    build_variant: 'fixed-v2',
    build_commit: 'a'.repeat(40),
    build_content_hash: `sha256:${'b'.repeat(64)}`,
    environment_id: 'qah-payd-22-fixed-v2',
    instance_nonce: '33333333-3333-4333-8333-333333333333',
    source_run_id: 'payd-22-route-test',
    amount_evidence_artifact_id: '44444444-4444-4444-8444-444444444444',
    amount_evidence_version_id: '55555555-5555-4555-8555-555555555555',
    idempotency_evidence_artifact_id: '66666666-6666-4666-8666-666666666666',
    idempotency_evidence_version_id: '77777777-7777-4777-8777-777777777777',
    ui_evidence_artifact_id: '88888888-8888-4888-8888-888888888888',
    ui_evidence_version_id: '99999999-9999-4999-8999-999999999999',
    recommendation: 'no_findings',
    summary: '3/3 веток завершены; PASS=3; FAIL=0; сбои=0; уникальные дефекты=0.',
    ...overrides,
  };
}

function synthesisInput(overrides = {}) {
  return {
    synthesize_qa: {
      key: 'synthesize_qa',
      description: 'Сводка QA.',
      outcome: { status: 'completed' },
      data: synthesisData(overrides),
      artifacts: { review_bundle: reviewArtifact },
    },
  };
}

async function runRoute(input) {
  const directory = await mkdtemp(join(tmpdir(), 'paydemo-route-test-'));
  const inputPath = join(directory, 'input.json');
  try {
    await writeFile(inputPath, JSON.stringify(input), 'utf8');
    const result = await execFileAsync(process.execPath, [routeScript, inputPath], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });
    return JSON.parse(result.stdout);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('routes only a fully verified clean synthesis to Ready for Production', async () => {
  const envelope = await runRoute(synthesisInput());
  assert.deepEqual(Object.keys(envelope).sort(), ['artifact_outputs', 'item']);
  assert.equal(envelope.item.key, 'route_qa_result');
  assert.equal(envelope.item.data.target_state, 'ready_for_production');
  assert.equal(envelope.item.data.route_reason, 'Все 3 проверки пройдены на точной сборке, доказательства подтверждены.');
  assert.equal(envelope.item.data.instance_nonce, '33333333-3333-4333-8333-333333333333');
  assert.deepEqual(envelope.item.artifacts, {});
  assert.equal(envelope.artifact_outputs['item.artifacts.review_bundle'], null);
});

test('routes findings and uncertainty to In Progress without model judgment', async () => {
  const cases = [
    synthesisInput({
      overall_product_result: 'FAIL',
      min_confidence: 0.99,
      finding_count: 2,
      recommendation: 'accept_findings',
      summary: '3/3 веток завершены; PASS=1; FAIL=2; сбои=0; уникальные дефекты=2.',
    }),
    synthesisInput({
      overall_product_result: 'INCONCLUSIVE',
      overall_environment_status: 'INFRA_FAILURE',
      overall_evidence_status: 'PARTIAL',
      min_confidence: 0,
      recommendation: 'human_review',
      summary: '2/3 веток завершены; PASS=2; FAIL=0; сбои=1; уникальные дефекты=0.',
    }),
    synthesisInput({ recommendation: 'human_review' }),
  ];
  for (const input of cases) {
    const envelope = await runRoute(input);
    assert.equal(envelope.item.data.target_state, 'in_progress');
    assert.match(envelope.item.data.route_reason, /дефект|неопредел|не выполнены/i);
  }
});

test('rejects malformed synthesis instead of inventing a status', async () => {
  await assert.rejects(
    runRoute({ synthesize_qa: { key: 'synthesize_qa', data: {}, artifacts: {} } }),
    /route|synthesis|contract|invalid/i,
  );
});
