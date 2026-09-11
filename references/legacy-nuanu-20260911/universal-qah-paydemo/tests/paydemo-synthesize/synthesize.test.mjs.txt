import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  buildProbeResult,
  probePayloadSha256,
  toNuanuAgentTaskEnvelope as toProbeEnvelope,
} from '../../scripts/paydemo-qah-probe.mjs';

const scriptPath = fileURLToPath(
  new URL('../../scripts/paydemo-qah-synthesize.mjs', import.meta.url),
);

const branchIdentity = {
  check_amount_integrity: {
    contract: 'available-balance-v1',
    code: 'AMOUNT_REJECTED',
    artifactId: '8244cacb-396a-4274-87c0-613afcf12074',
    versionId: 'bec9f055-a81f-4be8-a4b4-164c45bdb384',
    occurrence: '1',
  },
  check_idempotency: {
    contract: 'transfer-idempotency-v1',
    code: 'IDEMPOTENT_REPLAY',
    artifactId: 'b34ab29c-a045-4f6c-a01a-8660b4a13186',
    versionId: '86dc08b9-9da6-4033-a9a0-d0e3d8256dd5',
    occurrence: '2',
  },
  check_ui_api_consistency: {
    contract: 'status-consistency-v1',
    code: 'BANK_TRANSFER_CONFIRMED',
    artifactId: '11111111-1111-4111-8111-111111111111',
    versionId: '22222222-2222-4222-8222-222222222222',
    occurrence: '3',
  },
};
const branchMode = {
  check_amount_integrity: 'amount',
  check_idempotency: 'idempotency',
  check_ui_api_consistency: 'ui',
};
const sha256 = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

function verifiedReset(key) {
  return {
    status: 200,
    body: {
      reset: true,
      run_id_sha256: sha256(`demo-process-run-${branchMode[key]}`),
      unexpected_field_count: 0,
      unexpected_field_names_sha256: null,
    },
  };
}

function verifiedObservation(key) {
  const reset = verifiedReset(key);
  if (key === 'check_amount_integrity') {
    return JSON.stringify({
      reset,
      probe: {
        status: 422,
        body: {
          payment_id_sha256: null,
          amount_cents: null,
          payment_method: null,
          error_code: 'AMOUNT_MISMATCH',
          semantic_sha256: `sha256:${'1'.repeat(64)}`,
          unexpected_fields: [],
        },
      },
    });
  }
  if (key === 'check_idempotency') {
    const body = {
      payment_id_sha256: `sha256:${'2'.repeat(64)}`,
      amount_cents: 1000,
      payment_method: 'card',
      error_code: null,
      semantic_sha256: `sha256:${'3'.repeat(64)}`,
      unexpected_fields: [],
    };
    return JSON.stringify({
      reset,
      probe: {
        first: { status: 201, body },
        second: { status: 200, body },
      },
    });
  }
  return JSON.stringify({
    reset,
    probe: {
      selected_payment_method: 'bank',
      request_payment_method: 'bank',
      receipt_code: 'BANK_RECORDED',
      receipt_sha256: `sha256:${'4'.repeat(64)}`,
      response_status: 201,
      backend_response: {
        status: 201,
        body: {
          payment_id_sha256: `sha256:${'5'.repeat(64)}`,
          amount_cents: 1000,
          payment_method: 'bank',
          error_code: null,
          semantic_sha256: `sha256:${'6'.repeat(64)}`,
          unexpected_fields: [],
        },
      },
    },
  });
}

function boundItem(key, classification, observed, occurrenceOverrides = {}) {
  const identity = branchIdentity[key];
  const expectedBuild = {
    app: 'PayDemo',
    variant: 'fixed-v2',
    commit: 'a'.repeat(40),
    contentHash: `sha256:${'b'.repeat(64)}`,
    environmentId: 'demo-env',
    instanceNonce: '11111111-1111-4111-8111-111111111111',
  };
  const result = buildProbeResult({
    mode: branchMode[key],
    classification,
    occurrence: {
      run_id: 'demo-process-run',
      target_run_id: `demo-process-run-${branchMode[key]}`,
      base_url: 'http://127.0.0.1:4173',
      expected_build: expectedBuild,
      actual_build: {
        ...expectedBuild,
        unexpected_field_count: 0,
        unexpected_field_names_sha256: null,
      },
      observed,
      ...occurrenceOverrides,
    },
  });
  result.evidence.sha256 = probePayloadSha256(result);
  const envelope = toProbeEnvelope({ itemKey: key, result });
  return {
    ...envelope.item,
    description: `${key} result`,
    outcome: { status: 'completed' },
    artifacts: {
      evidence_report: {
        kind: 'document',
        role: 'output',
        media_type: 'text/markdown',
        artifact_id: identity.artifactId,
        version_id: identity.versionId,
      },
    },
  };
}

function completedItem(key, overrides = {}) {
  const identity = branchIdentity[key];
  const item = boundItem(key, {
    product_result: 'PASS',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 1,
    code: identity.code,
  }, JSON.parse(verifiedObservation(key)));
  Object.assign(item.data, overrides);
  return item;
}

function failedItem(key, code, observed) {
  return boundItem(key, {
    product_result: 'FAIL',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 0.99,
    code,
  }, observed);
}

function cleanInput() {
  return {
    check_amount_integrity: completedItem('check_amount_integrity'),
    check_idempotency: completedItem('check_idempotency'),
    check_ui_api_consistency: completedItem('check_ui_api_consistency'),
  };
}

async function runCli(input) {
  const directory = await mkdtemp(join(tmpdir(), 'paydemo-synthesize-'));
  const inputPath = join(directory, 'input.json');
  await writeFile(inputPath, JSON.stringify(input));
  return spawnSync(process.execPath, [scriptPath, inputPath], { encoding: 'utf8' });
}

test('three verified passes on one exact build produce the exact clean Nuanu envelope', async () => {
  const execution = await runCli(cleanInput());

  assert.equal(execution.status, 0, execution.stderr);
  assert.equal(execution.stderr, '');
  const envelope = JSON.parse(execution.stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['artifact_outputs', 'item']);
  assert.deepEqual(Object.keys(envelope.item).sort(), ['artifacts', 'data', 'description', 'key']);
  assert.equal(envelope.item.key, 'synthesize_qa');
  assert.deepEqual(envelope.item.artifacts, {});
  assert.deepEqual(envelope.artifact_outputs, { 'item.artifacts.review_bundle': null });
  assert.deepEqual(envelope.item.data, {
    overall_product_result: 'PASS',
    overall_environment_status: 'HEALTHY',
    overall_evidence_status: 'VERIFIED',
    min_confidence: 1,
    finding_count: 0,
    build_variant: 'fixed-v2',
    build_commit: 'a'.repeat(40),
    build_content_hash: `sha256:${'b'.repeat(64)}`,
    environment_id: 'demo-env',
    instance_nonce: '11111111-1111-4111-8111-111111111111',
    source_run_id: 'demo-process-run',
    amount_evidence_artifact_id: branchIdentity.check_amount_integrity.artifactId,
    amount_evidence_version_id: branchIdentity.check_amount_integrity.versionId,
    idempotency_evidence_artifact_id: branchIdentity.check_idempotency.artifactId,
    idempotency_evidence_version_id: branchIdentity.check_idempotency.versionId,
    ui_evidence_artifact_id: branchIdentity.check_ui_api_consistency.artifactId,
    ui_evidence_version_id: branchIdentity.check_ui_api_consistency.versionId,
    recommendation: 'no_findings',
    summary: '3/3 веток завершены; PASS=3; FAIL=0; сбои=0; уникальные дефекты=0.',
  });
});

test('verified failures are counted by unique defect key and recommend acceptance without infrastructure failure', async () => {
  const input = cleanInput();
  input.check_amount_integrity = failedItem(
    'check_amount_integrity',
    'AMOUNT_MISMATCH_ACCEPTED',
    {
      reset: verifiedReset('check_amount_integrity'),
      probe: {
        status: 201,
        body: {
          payment_id_sha256: `sha256:${'1'.repeat(64)}`,
          amount_cents: 100,
          payment_method: 'card',
          error_code: null,
          semantic_sha256: `sha256:${'2'.repeat(64)}`,
          unexpected_fields: [],
        },
      },
    },
  );
  input.check_idempotency = failedItem(
    'check_idempotency',
    'DUPLICATE_PAYMENT_IDS',
    {
      reset: verifiedReset('check_idempotency'),
      probe: {
        first: {
          status: 201,
          body: {
            payment_id_sha256: `sha256:${'3'.repeat(64)}`,
            amount_cents: 1000,
            payment_method: 'card',
            error_code: null,
            semantic_sha256: `sha256:${'4'.repeat(64)}`,
            unexpected_fields: [],
          },
        },
        second: {
          status: 201,
          body: {
            payment_id_sha256: `sha256:${'5'.repeat(64)}`,
            amount_cents: 1000,
            payment_method: 'card',
            error_code: null,
            semantic_sha256: `sha256:${'6'.repeat(64)}`,
            unexpected_fields: [],
          },
        },
      },
    },
  );

  const execution = await runCli(input);

  assert.equal(execution.status, 0, execution.stderr);
  const data = JSON.parse(execution.stdout).item.data;
  assert.deepEqual(data, {
    overall_product_result: 'FAIL',
    overall_environment_status: 'HEALTHY',
    overall_evidence_status: 'VERIFIED',
    min_confidence: 0.99,
    finding_count: 2,
    build_variant: 'fixed-v2',
    build_commit: 'a'.repeat(40),
    build_content_hash: `sha256:${'b'.repeat(64)}`,
    environment_id: 'demo-env',
    instance_nonce: '11111111-1111-4111-8111-111111111111',
    source_run_id: 'demo-process-run',
    amount_evidence_artifact_id: branchIdentity.check_amount_integrity.artifactId,
    amount_evidence_version_id: branchIdentity.check_amount_integrity.versionId,
    idempotency_evidence_artifact_id: branchIdentity.check_idempotency.artifactId,
    idempotency_evidence_version_id: branchIdentity.check_idempotency.versionId,
    ui_evidence_artifact_id: branchIdentity.check_ui_api_consistency.artifactId,
    ui_evidence_version_id: branchIdentity.check_ui_api_consistency.versionId,
    recommendation: 'accept_findings',
    summary: '3/3 веток завершены; PASS=1; FAIL=2; сбои=0; уникальные дефекты=2.',
  });
});

test('a continued branch failure preserves a verified product failure but makes environment and evidence partial', async () => {
  const input = cleanInput();
  input.check_amount_integrity = failedItem(
    'check_amount_integrity',
    'AMOUNT_MISMATCH_ACCEPTED',
    {
      reset: verifiedReset('check_amount_integrity'),
      probe: {
        status: 201,
        body: {
          payment_id_sha256: `sha256:${'1'.repeat(64)}`,
          amount_cents: 100,
          payment_method: 'card',
          error_code: null,
          semantic_sha256: `sha256:${'2'.repeat(64)}`,
          unexpected_fields: [],
        },
      },
    },
  );
  input.check_ui_api_consistency = {
    key: 'check_ui_api_consistency',
    description: 'UI check failed and the Process continued.',
    outcome: {
      status: 'failed',
      error: { code: 'invalid_output', message: 'bad payload', retryable: false },
    },
    data: {},
    artifacts: {},
  };

  const execution = await runCli(input);

  assert.equal(execution.status, 0, execution.stderr);
  assert.deepEqual(JSON.parse(execution.stdout).item.data, {
    overall_product_result: 'FAIL',
    overall_environment_status: 'INFRA_FAILURE',
    overall_evidence_status: 'PARTIAL',
    min_confidence: 0,
    finding_count: 1,
    build_variant: '',
    build_commit: '',
    build_content_hash: '',
    environment_id: '',
    instance_nonce: '',
    source_run_id: '',
    amount_evidence_artifact_id: branchIdentity.check_amount_integrity.artifactId,
    amount_evidence_version_id: branchIdentity.check_amount_integrity.versionId,
    idempotency_evidence_artifact_id: branchIdentity.check_idempotency.artifactId,
    idempotency_evidence_version_id: branchIdentity.check_idempotency.versionId,
    ui_evidence_artifact_id: '',
    ui_evidence_version_id: '',
    recommendation: 'human_review',
    summary: '2/3 веток завершены; PASS=1; FAIL=1; сбои=1; уникальные дефекты=1.',
  });
});

test('a missing branch and mismatched available builds are inconclusive infrastructure evidence', async () => {
  const input = cleanInput();
  delete input.check_ui_api_consistency;
  input.check_idempotency.data.build_commit = 'c'.repeat(40);

  const execution = await runCli(input);

  assert.equal(execution.status, 0, execution.stderr);
  const data = JSON.parse(execution.stdout).item.data;
  assert.equal(data.overall_product_result, 'INCONCLUSIVE');
  assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
  assert.equal(data.overall_evidence_status, 'PARTIAL');
  assert.equal(data.min_confidence, 0);
  assert.equal(data.finding_count, 0);
  assert.equal(data.build_variant, '');
  assert.equal(data.build_commit, '');
  assert.equal(data.build_content_hash, '');
  assert.equal(data.recommendation, 'human_review');
});

test('the CLI output is byte-for-byte deterministic and contains no diagnostic stdout', async () => {
  const input = cleanInput();
  const first = await runCli(input);
  const second = await runCli(input);

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
  assert.equal(first.stdout, `${JSON.stringify(JSON.parse(first.stdout))}\n`);
});

test('a branch cannot claim a clean pass without exact build and versioned evidence identity', async () => {
  const invalidCases = [
    { build_commit: '' },
    { build_commit: 'not-a-git-commit' },
    { build_content_hash: 'sha256:short' },
    { evidence_sha256: 'sha256:short' },
  ];

  for (const invalidData of invalidCases) {
    const input = cleanInput();
    Object.assign(input.check_amount_integrity.data, invalidData);
    const data = JSON.parse((await runCli(input)).stdout).item.data;
    assert.equal(data.overall_product_result, 'INCONCLUSIVE');
    assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
    assert.equal(data.overall_evidence_status, 'PARTIAL');
    assert.equal(data.recommendation, 'human_review');
  }

  const withoutArtifact = cleanInput();
  withoutArtifact.check_amount_integrity.artifacts = {};
  const missingArtifactData = JSON.parse((await runCli(withoutArtifact)).stdout).item.data;
  assert.equal(missingArtifactData.overall_product_result, 'INCONCLUSIVE');
  assert.equal(missingArtifactData.overall_environment_status, 'INFRA_FAILURE');
});

test('a verified finding requires one canonical defect key and matching fingerprint', async () => {
  const invalidCases = [
    { defect_key: '', finding_fingerprint: '' },
    { defect_key: 'sha256:short', finding_fingerprint: 'sha256:short' },
    { defect_key: `sha256:${'d'.repeat(64)}`, finding_fingerprint: `sha256:${'f'.repeat(64)}` },
  ];

  for (const invalidData of invalidCases) {
    const input = cleanInput();
    Object.assign(input.check_amount_integrity.data, {
      product_result: 'FAIL',
      failure_code: 'AMOUNT_MISMATCH_ACCEPTED',
      confidence: 0.99,
      ...invalidData,
    });
    const data = JSON.parse((await runCli(input)).stdout).item.data;
    assert.equal(data.overall_product_result, 'INCONCLUSIVE');
    assert.equal(data.finding_count, 0);
    assert.equal(data.recommendation, 'human_review');
  }
});

test('a branch source cannot impersonate another parallel check', async () => {
  const input = cleanInput();
  input.check_amount_integrity.key = 'check_idempotency';

  const data = JSON.parse((await runCli(input)).stdout).item.data;
  assert.equal(data.overall_product_result, 'INCONCLUSIVE');
  assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
});

test('verified evidence is bound to the exact branch contract and occurrence', async () => {
  const invalidCases = [
    { contract_id: 'wrong-contract' },
    { occurrence_key: 'not-a-sha' },
    { failure_code: '' },
    { observed: '' },
    { observed: 'not-json' },
  ];

  for (const invalidData of invalidCases) {
    const input = cleanInput();
    Object.assign(input.check_amount_integrity.data, invalidData);
    const data = JSON.parse((await runCli(input)).stdout).item.data;
    assert.equal(data.overall_product_result, 'INCONCLUSIVE');
    assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
    assert.equal(data.overall_evidence_status, 'PARTIAL');
  }
});

test('two parallel branches cannot reuse one materialized evidence version', async () => {
  const input = cleanInput();
  input.check_idempotency.artifacts.evidence_report = {
    ...input.check_amount_integrity.artifacts.evidence_report,
  };

  const data = JSON.parse((await runCli(input)).stdout).item.data;
  assert.equal(data.overall_product_result, 'INCONCLUSIVE');
  assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
  assert.equal(data.overall_evidence_status, 'PARTIAL');
});

test('a branch cannot forge PASS with a code outside its closed contract outcome map', async () => {
  const input = cleanInput();
  for (const key of Object.keys(input)) {
    input[key].data.failure_code = 'FORGED_PASS';
    input[key].data.observed = '{"status":201,"known_defect":true}';
  }

  const data = JSON.parse((await runCli(input)).stdout).item.data;
  assert.equal(data.overall_product_result, 'INCONCLUSIVE');
  assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
  assert.equal(data.overall_evidence_status, 'PARTIAL');
  assert.equal(data.recommendation, 'human_review');
});

test('a low-confidence PASS cannot bypass human review', async () => {
  const input = cleanInput();
  input.check_amount_integrity.data.confidence = 0;

  const data = JSON.parse((await runCli(input)).stdout).item.data;
  assert.equal(data.overall_product_result, 'INCONCLUSIVE');
  assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
  assert.equal(data.recommendation, 'human_review');
});

test('allowed PASS labels cannot hide product defects present in the bounded observation', async () => {
  const input = cleanInput();
  input.check_amount_integrity.data.observed = JSON.stringify({
    reset: { status: 200, body: { reset: true } },
    probe: {
      status: 201,
      body: {
        payment_id_sha256: `sha256:${'1'.repeat(64)}`,
        amount_cents: 100,
        payment_method: 'card',
        error_code: null,
        semantic_sha256: `sha256:${'2'.repeat(64)}`,
        unexpected_fields: [],
      },
    },
  });
  input.check_idempotency.data.observed = JSON.stringify({
    reset: { status: 200, body: { reset: true } },
    probe: {
      first: {
        status: 201,
        body: {
          payment_id_sha256: `sha256:${'3'.repeat(64)}`,
          amount_cents: 1000,
          payment_method: 'card',
          semantic_sha256: `sha256:${'4'.repeat(64)}`,
          unexpected_fields: [],
        },
      },
      second: {
        status: 201,
        body: {
          payment_id_sha256: `sha256:${'5'.repeat(64)}`,
          amount_cents: 1000,
          payment_method: 'card',
          semantic_sha256: `sha256:${'6'.repeat(64)}`,
          unexpected_fields: [],
        },
      },
    },
  });
  input.check_ui_api_consistency.data.observed = JSON.stringify({
    reset: { status: 200, body: { reset: true } },
    probe: {
      selected_payment_method: 'bank',
      request_payment_method: 'card',
      receipt_code: 'CARD_RECORDED',
      receipt_sha256: `sha256:${'7'.repeat(64)}`,
      response_status: 201,
    },
  });

  const data = JSON.parse((await runCli(input)).stdout).item.data;
  assert.equal(data.overall_product_result, 'INCONCLUSIVE');
  assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
  assert.equal(data.recommendation, 'human_review');
});

test('a shape-valid but noncanonical defect key cannot enter the finding ledger', async () => {
  const input = cleanInput();
  Object.assign(input.check_amount_integrity.data, {
    product_result: 'FAIL',
    failure_code: 'AMOUNT_MISMATCH_ACCEPTED',
    confidence: 0.99,
    defect_key: `sha256:${'d'.repeat(64)}`,
    finding_fingerprint: `sha256:${'d'.repeat(64)}`,
    observed: JSON.stringify({
      reset: { status: 200, body: { reset: true } },
      probe: {
        status: 201,
        body: {
          payment_id_sha256: `sha256:${'1'.repeat(64)}`,
          amount_cents: 100,
          payment_method: 'card',
          error_code: null,
          semantic_sha256: `sha256:${'2'.repeat(64)}`,
          unexpected_fields: [],
        },
      },
    }),
  });

  const data = JSON.parse((await runCli(input)).stdout).item.data;
  assert.equal(data.overall_product_result, 'INCONCLUSIVE');
  assert.equal(data.finding_count, 0);
  assert.equal(data.recommendation, 'human_review');
});

test('canonical probe payload binds projected fields, occurrence, and evidence digest', async () => {
  const mutations = [
    (item) => { item.data.evidence_sha256 = `sha256:${'f'.repeat(64)}`; },
    (item) => { item.data.occurrence_key = `sha256:${'f'.repeat(64)}`; },
    (item) => {
      const payload = JSON.parse(item.data.probe_payload);
      payload.occurrence.run_id = 'forged-run';
      item.data.probe_payload = JSON.stringify(payload);
    },
  ];

  for (const mutate of mutations) {
    const input = cleanInput();
    mutate(input.check_amount_integrity);
    const data = JSON.parse((await runCli(input)).stdout).item.data;
    assert.equal(data.overall_product_result, 'INCONCLUSIVE');
    assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
    assert.equal(data.recommendation, 'human_review');
  }
});

test('a fully self-consistent payload still cannot pass with an unrelated reset or secret-bearing base URL', async () => {
  const pass = {
    product_result: 'PASS',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 1,
    code: 'AMOUNT_REJECTED',
  };
  const wrongReset = JSON.parse(verifiedObservation('check_amount_integrity'));
  wrongReset.reset.body.run_id_sha256 = sha256('another-run');

  for (const forged of [
    boundItem('check_amount_integrity', pass, wrongReset),
    boundItem(
      'check_amount_integrity',
      pass,
      JSON.parse(verifiedObservation('check_amount_integrity')),
      { base_url: 'http://127.0.0.1:4173/?access_token=TOPSECRET' },
    ),
  ]) {
    const input = cleanInput();
    input.check_amount_integrity = forged;
    const data = JSON.parse((await runCli(input)).stdout).item.data;
    assert.equal(data.overall_product_result, 'INCONCLUSIVE');
    assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
    assert.equal(data.recommendation, 'human_review');
  }
});

test('three individually canonical branches cannot mix evidence from different process runs', async () => {
  const input = cleanInput();
  const oldObservation = JSON.parse(verifiedObservation('check_amount_integrity'));
  oldObservation.reset.body.run_id_sha256 = sha256('old-process-run-amount');
  input.check_amount_integrity = boundItem(
    'check_amount_integrity',
    {
      product_result: 'PASS',
      environment_status: 'HEALTHY',
      evidence_status: 'VERIFIED',
      confidence: 1,
      code: 'AMOUNT_REJECTED',
    },
    oldObservation,
    { run_id: 'old-process-run', target_run_id: 'old-process-run-amount' },
  );

  const data = JSON.parse((await runCli(input)).stdout).item.data;
  assert.equal(data.overall_product_result, 'INCONCLUSIVE');
  assert.equal(data.overall_environment_status, 'INFRA_FAILURE');
  assert.equal(data.recommendation, 'human_review');
});
