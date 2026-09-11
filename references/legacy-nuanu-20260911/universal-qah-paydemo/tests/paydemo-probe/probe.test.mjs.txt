import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildProbeResult,
  classifyAmount,
  classifyBuildIdentity,
  classifyIdempotency,
  classifyUi,
  parseCliArguments,
  probePayloadSha256,
  runProbe,
  toNuanuAgentTaskEnvelope,
  withIsolatedBrowserPage,
} from '../../scripts/paydemo-qah-probe.mjs';

const expectedBuggyBuild = {
  app: 'PayDemo',
  variant: 'buggy-v1',
  commit: 'a'.repeat(40),
  contentHash: `sha256:${'b'.repeat(64)}`,
  environmentId: 'demo-env',
  instanceNonce: '11111111-1111-4111-8111-111111111111',
};

test('amount acceptance is classified with the exact controlled-defect code', () => {
  assert.deepEqual(classifyAmount({ status: 201, body: { paymentId: 'payment-a' } }), {
    product_result: 'FAIL',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 0.99,
    code: 'AMOUNT_MISMATCH_ACCEPTED',
  });
});

test('amount rejection is classified as a verified pass only for the exact contract response', () => {
  assert.deepEqual(classifyAmount({ status: 422, body: { error: 'AMOUNT_MISMATCH' } }), {
    product_result: 'PASS',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 1,
    code: 'AMOUNT_REJECTED',
  });
});

test('malformed 422 amount responses are inconclusive instead of false passes or defects', () => {
  for (const body of [
    { error: 'AMOUNT_MISMATCH', debug: true },
    { error: 'AMOUNT_MISMATCH', paymentId: 'unexpected-payment' },
    { error: 'AMOUNT_MISMATCH', amountCents: 100 },
    { error: 'AMOUNT_MISMATCH', paymentMethod: 'card' },
    { error: 'OTHER_ERROR' },
    null,
  ]) {
    assert.deepEqual(classifyAmount({ status: 422, body }), {
      product_result: 'INCONCLUSIVE',
      environment_status: 'INFRA_FAILURE',
      evidence_status: 'VERIFIED',
      confidence: 1,
      code: 'AMOUNT_PROBE_UNAVAILABLE',
    });
  }
});

test('idempotency creates a finding when successful responses contain different payment ids', () => {
  assert.deepEqual(classifyIdempotency({
    firstStatus: 201,
    secondStatus: 201,
    firstBody: { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'card' },
    secondBody: { paymentId: 'payment-2', amountCents: 1000, paymentMethod: 'card' },
  }), {
    product_result: 'FAIL',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 0.99,
    code: 'DUPLICATE_PAYMENT_IDS',
  });
});

test('idempotency passes only when the replay returns the original payment', () => {
  assert.deepEqual(classifyIdempotency({
    firstStatus: 201,
    secondStatus: 200,
    firstBody: { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'card' },
    secondBody: { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'card' },
  }), {
    product_result: 'PASS',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 1,
    code: 'IDEMPOTENT_REPLAY',
  });
});

test('idempotency pass is independent of concurrent response order', () => {
  assert.deepEqual(classifyIdempotency({
    firstStatus: 200,
    secondStatus: 201,
    firstBody: { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'card' },
    secondBody: { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'card' },
  }), {
    product_result: 'PASS',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 1,
    code: 'IDEMPOTENT_REPLAY',
  });
});

test('idempotency replay must preserve the exact requested amount and payment method', () => {
  for (const replay of [
    { paymentId: 'payment-1', amountCents: 1, paymentMethod: 'card' },
    { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'bank' },
  ]) {
    assert.deepEqual(classifyIdempotency({
      firstStatus: 201,
      secondStatus: 200,
      firstBody: replay,
      secondBody: { ...replay },
    }), {
      product_result: 'FAIL',
      environment_status: 'HEALTHY',
      evidence_status: 'VERIFIED',
      confidence: 0.99,
      code: 'IDEMPOTENCY_CONTRACT_VIOLATION',
    });
  }
});

test('UI exposes the exact stale-receipt code when bank is selected and sent but card is shown', () => {
  assert.deepEqual(classifyUi({
    selectedPaymentMethod: 'bank',
    requestPaymentMethod: 'bank',
    receiptText: 'Payment recorded by card.',
    responseStatus: 201,
  }), {
    product_result: 'FAIL',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 0.99,
    code: 'BANK_SHOWN_AS_CARD',
  });
});

test('UI bank pass requires the exact backend payment response contract', () => {
  const valid = {
    selectedPaymentMethod: 'bank',
    requestPaymentMethod: 'bank',
    receiptText: 'Payment recorded by bank transfer.',
    responseStatus: 201,
    responseBody: { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'bank' },
  };
  assert.deepEqual(classifyUi(valid), {
    product_result: 'PASS',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 1,
    code: 'BANK_TRANSFER_CONFIRMED',
  });
  for (const responseBody of [
    { paymentId: 'payment-1', amountCents: 999, paymentMethod: 'bank' },
    { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'card' },
    { amountCents: 1000, paymentMethod: 'bank' },
    { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'bank', debug: true },
  ]) {
    assert.deepEqual(classifyUi({ ...valid, responseBody }), {
      product_result: 'FAIL',
      environment_status: 'HEALTHY',
      evidence_status: 'VERIFIED',
      confidence: 0.99,
      code: 'BANK_UI_CONTRACT_VIOLATION',
    });
  }
});

test('build mismatch is infrastructure evidence and never a product failure', () => {
  assert.deepEqual(classifyBuildIdentity({
    expected: expectedBuggyBuild,
    actual: { ...expectedBuggyBuild, commit: 'c'.repeat(40) },
  }), {
    product_result: 'INCONCLUSIVE',
    environment_status: 'INFRA_FAILURE',
    evidence_status: 'VERIFIED',
    confidence: 1,
    code: 'BUILD_IDENTITY_MISMATCH',
  });
});

test('rate limits and server errors are infrastructure outcomes, not confirmed product defects', () => {
  for (const status of [429, 500, 503]) {
    assert.deepEqual(classifyAmount({ status, body: { error: 'TEMPORARY' } }), {
      product_result: 'INCONCLUSIVE',
      environment_status: 'INFRA_FAILURE',
      evidence_status: 'VERIFIED',
      confidence: 1,
      code: 'AMOUNT_PROBE_UNAVAILABLE',
    });
    assert.deepEqual(classifyIdempotency({
      firstStatus: 201,
      secondStatus: status,
      firstBody: { paymentId: 'payment-1' },
      secondBody: { error: 'TEMPORARY' },
    }), {
      product_result: 'INCONCLUSIVE',
      environment_status: 'INFRA_FAILURE',
      evidence_status: 'VERIFIED',
      confidence: 1,
      code: 'IDEMPOTENCY_PROBE_UNAVAILABLE',
    });
    assert.deepEqual(classifyUi({
      selectedPaymentMethod: 'bank',
      requestPaymentMethod: 'bank',
      receiptText: 'Payment could not be recorded.',
      responseStatus: status,
    }), {
      product_result: 'INCONCLUSIVE',
      environment_status: 'INFRA_FAILURE',
      evidence_status: 'VERIFIED',
      confidence: 1,
      code: 'UI_PROBE_UNAVAILABLE',
    });
  }
});

test('idempotency classification compares bounded raw semantics before evidence redaction', () => {
  const common = { paymentId: 'payment-1', amountCents: 1000, paymentMethod: 'card' };
  assert.deepEqual(classifyIdempotency({
    firstStatus: 201,
    secondStatus: 200,
    firstBody: { ...common, token: 'first-secret' },
    secondBody: { ...common, token: 'different-secret' },
  }), {
    product_result: 'FAIL',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 0.99,
    code: 'IDEMPOTENCY_CONTRACT_VIOLATION',
  });
});

test('defect key is canonical and unchanged across run and build occurrences', () => {
  const classification = classifyAmount({ status: 201, body: { paymentId: 'one' } });
  const first = buildProbeResult({
    mode: 'amount',
    classification,
    occurrence: {
      run_id: 'run-a',
      base_url: 'http://127.0.0.1:4173',
      expected_build: expectedBuggyBuild,
      actual_build: expectedBuggyBuild,
      observed: { status: 201, body: { paymentId: 'one' } },
    },
  });
  const second = buildProbeResult({
    mode: 'amount',
    classification,
    occurrence: {
      run_id: 'run-b',
      base_url: 'http://127.0.0.1:5173',
      expected_build: { ...expectedBuggyBuild, commit: 'c'.repeat(40), contentHash: `sha256:${'d'.repeat(64)}` },
      actual_build: { ...expectedBuggyBuild, commit: 'c'.repeat(40), contentHash: `sha256:${'d'.repeat(64)}` },
      observed: { status: 201, body: { paymentId: 'two' } },
    },
  });

  assert.equal(first.defect_key, 'sha256:d7339fdb8e153be679bab8be3ea2fa5a96bc8fe186f1d919249fd76e0048ff99');
  assert.equal(second.defect_key, first.defect_key);
  assert.notEqual(second.occurrence_key, first.occurrence_key);
  assert.deepEqual(first.defect_identity, {
    schema: 'qah-defect-key/v1',
    product: 'PayDemo',
    probe: 'amount',
    contract: 'available-balance-v1',
    code: 'AMOUNT_MISMATCH_ACCEPTED',
  });
  assert.notDeepEqual(first.occurrence, second.occurrence);
});

test('a pass has no defect key', () => {
  const result = buildProbeResult({
    mode: 'amount',
    classification: classifyAmount({ status: 422, body: { error: 'AMOUNT_MISMATCH' } }),
    occurrence: {
      run_id: 'run-fixed',
      base_url: 'http://127.0.0.1:4174',
      expected_build: { ...expectedBuggyBuild, variant: 'fixed-v2' },
      actual_build: { ...expectedBuggyBuild, variant: 'fixed-v2' },
      observed: { status: 422, body: { error: 'AMOUNT_MISMATCH' } },
    },
  });

  assert.equal(result.defect_key, null);
  assert.equal(result.defect_identity, null);
});

test('Nuanu stdout envelope is an exact agent-task item with a materializable evidence artifact', () => {
  const probeResult = buildProbeResult({
    mode: 'amount',
    classification: classifyAmount({ status: 201, body: { paymentId: 'one' } }),
    occurrence: {
      run_id: 'run-a',
      base_url: 'http://127.0.0.1:4173',
      expected_build: expectedBuggyBuild,
      actual_build: expectedBuggyBuild,
      observed: { status: 201, body: { paymentId: 'one' } },
    },
  });
  probeResult.evidence.sha256 = probePayloadSha256(probeResult);

  const envelope = toNuanuAgentTaskEnvelope({
    itemKey: 'check_amount_integrity',
    result: probeResult,
  });

  assert.deepEqual(Object.keys(envelope).sort(), ['artifact_outputs', 'item']);
  assert.deepEqual(Object.keys(envelope.item).sort(), ['artifacts', 'data', 'description', 'key']);
  assert.equal(envelope.item.key, 'check_amount_integrity');
  assert.deepEqual(envelope.item.artifacts, {});
  assert.deepEqual(envelope.artifact_outputs, { 'item.artifacts.evidence_report': null });
  assert.deepEqual(Object.keys(envelope.item.data).sort(), [
    'build_commit',
    'build_content_hash',
    'build_variant',
    'confidence',
    'contract_id',
    'defect_key',
    'environment_status',
    'evidence_sha256',
    'evidence_status',
    'failure_code',
    'finding_fingerprint',
    'observed',
    'occurrence_key',
    'probe_payload',
    'product_result',
  ]);
  assert.equal(envelope.item.data.defect_key, probeResult.defect_key);
  assert.equal(envelope.item.data.finding_fingerprint, probeResult.defect_key);
  assert.equal(envelope.item.data.failure_code, 'AMOUNT_MISMATCH_ACCEPTED');
  assert.equal(
    envelope.item.data.evidence_sha256,
    `sha256:${createHash('sha256').update(envelope.item.data.probe_payload).digest('hex')}`,
  );
  assert.deepEqual(JSON.parse(envelope.item.data.probe_payload), {
    schema_version: probeResult.schema_version,
    probe: probeResult.probe,
    contract_id: probeResult.contract_id,
    axes: probeResult.axes,
    code: probeResult.code,
    defect_key: probeResult.defect_key,
    defect_identity: probeResult.defect_identity,
    occurrence_key: probeResult.occurrence_key,
    occurrence: probeResult.occurrence,
  });
  assert.equal(JSON.stringify(envelope).includes('markdown_path'), false);
});

test('evidence SHA identifies the canonical probe payload, not the rendered Artifact bytes', () => {
  const result = {
    schema_version: 'qah.probe-result.v1',
    probe: 'amount',
    contract_id: 'available-balance-v1',
    axes: {
      product_result: 'FAIL',
      environment_status: 'HEALTHY',
      evidence_status: 'VERIFIED',
      confidence: 0.99,
    },
    code: 'AMOUNT_MISMATCH_ACCEPTED',
    defect_key: 'sha256:defect',
    defect_identity: {
      schema: 'qah-defect-key/v1',
      product: 'PayDemo',
      probe: 'amount',
      contract: 'available-balance-v1',
      code: 'AMOUNT_MISMATCH_ACCEPTED',
    },
    occurrence_key: 'sha256:occurrence',
    occurrence: { run_id: 'run-a' },
    evidence: { sha256: null, markdown_path: null },
  };

  assert.equal(
    probePayloadSha256(result),
    'sha256:a52c74c5e8f58d656589169666160c7f8e13fd40a465a36edbe9ea4d4fae6258',
  );
});

test('amount probe verifies the exact build, emits four axes, and writes Markdown evidence', async () => {
  const evidenceDirectory = await mkdtemp(join(tmpdir(), 'paydemo-probe-'));
  const calls = [];
  const fakeFetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith('/build-info')) {
      return new Response(JSON.stringify(expectedBuggyBuild), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (String(url).endsWith('/api/reset')) {
      return new Response(JSON.stringify({ runId: 'probe-run-amount', reset: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ paymentId: 'probe-payment', amountCents: 100 }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  };

  const result = await runProbe({
    mode: 'amount',
    baseUrl: 'http://127.0.0.1:4173/',
    expectedBuild: expectedBuggyBuild,
    runId: 'probe-run',
    evidenceDirectory,
    fetchImpl: fakeFetch,
  });

  assert.deepEqual(result.axes, {
    product_result: 'FAIL',
    environment_status: 'HEALTHY',
    evidence_status: 'VERIFIED',
    confidence: 0.99,
  });
  assert.equal(result.code, 'AMOUNT_MISMATCH_ACCEPTED');
  assert.equal(calls[0].url, 'http://127.0.0.1:4173/build-info');
  assert.match(await readFile(result.evidence.markdown_path, 'utf8'), /AMOUNT_MISMATCH_ACCEPTED/);
  assert.match(result.evidence.sha256, /^sha256:[a-f0-9]{64}$/);
});

test('reset gate accepts only exact HTTP 200 ownership response for the branch run id', async () => {
  const cases = [
    {
      name: 'wrong status',
      status: 201,
      body: { reset: true, runId: 'probe-reset-contract-amount' },
    },
    {
      name: 'wrong run id',
      status: 200,
      body: { reset: true, runId: 'another-run' },
    },
    {
      name: 'unexpected field',
      status: 200,
      body: { reset: true, runId: 'probe-reset-contract-amount', secret_key: 'must-not-leak' },
    },
  ];
  for (const resetCase of cases) {
    const calls = [];
    const result = await runProbe({
      mode: 'amount',
      baseUrl: 'http://127.0.0.1:4173',
      expectedBuild: expectedBuggyBuild,
      runId: 'probe-reset-contract',
      evidenceDirectory: await mkdtemp(join(tmpdir(), 'paydemo-probe-reset-contract-')),
      fetchImpl: async (url, options = {}) => {
        calls.push({ url: String(url), method: options.method ?? 'GET' });
        if (calls.length === 1) return Response.json(expectedBuggyBuild);
        if (calls.length === 2) return Response.json(resetCase.body, { status: resetCase.status });
        throw new Error(`checkout ran for invalid reset: ${resetCase.name}`);
      },
    });
    assert.equal(result.code, 'RESET_FAILED', resetCase.name);
    assert.equal(result.axes.product_result, 'INCONCLUSIVE', resetCase.name);
    assert.equal(result.axes.environment_status, 'INFRA_FAILURE', resetCase.name);
    assert.equal(calls.length, 2, resetCase.name);
    assert.doesNotMatch(JSON.stringify(result.occurrence.observed), /must-not-leak|secret_key/);
    if (resetCase.name === 'unexpected field') {
      assert.equal(result.occurrence.observed.reset.body.unexpected_field_count, 1);
      assert.equal(
        result.occurrence.observed.reset.body.unexpected_field_names_sha256,
        `sha256:${createHash('sha256').update('["secret_key"]').digest('hex')}`,
      );
    }
  }
});

test('base URL must be an origin only and rejects paths, query, and hash before any request', async () => {
  for (const baseUrl of [
    'http://127.0.0.1:4173/top-secret-path',
    'http://127.0.0.1:4173/?token=top-secret-query',
    'http://127.0.0.1:4173/#top-secret-hash',
  ]) {
    let called = false;
    let caught;
    try {
      await runProbe({
        mode: 'amount',
        baseUrl,
        expectedBuild: expectedBuggyBuild,
        runId: 'probe-origin-only',
        evidenceDirectory: await mkdtemp(join(tmpdir(), 'paydemo-probe-origin-only-')),
        fetchImpl: async () => {
          called = true;
          throw new Error('request must not execute');
        },
      });
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof Error, baseUrl);
    assert.match(caught.message, /origin only/i);
    assert.doesNotMatch(caught.message, /top-secret/);
    assert.equal(called, false);
  }
});

test('an unresponsive target is bounded and classified as infrastructure, never a product defect', async () => {
  const evidenceDirectory = await mkdtemp(join(tmpdir(), 'paydemo-probe-timeout-'));
  const hangingFetch = (_url, options = {}) => new Promise((_resolve, reject) => {
    const unboundedTimer = setTimeout(() => reject(new Error('UNBOUNDED_FETCH')), 100);
    options.signal?.addEventListener('abort', () => {
      clearTimeout(unboundedTimer);
      reject(options.signal.reason);
    }, { once: true });
  });
  const startedAt = Date.now();

  const result = await runProbe({
    mode: 'amount',
    baseUrl: 'http://127.0.0.1:4173',
    expectedBuild: expectedBuggyBuild,
    runId: 'probe-timeout',
    evidenceDirectory,
    fetchImpl: hangingFetch,
    requestTimeoutMs: 20,
  });

  assert.ok(Date.now() - startedAt < 1000);
  assert.deepEqual(result.axes, {
    product_result: 'INCONCLUSIVE',
    environment_status: 'INFRA_FAILURE',
    evidence_status: 'UNVERIFIED',
    confidence: 0.99,
  });
  assert.equal(result.code, 'PROBE_EXECUTION_ERROR');
  assert.equal(result.defect_key, null);
  assert.equal(result.occurrence.observed.error_code, 'REQUEST_TIMEOUT');
});

test('the safe default refuses a non-loopback target before any request or mutation', async () => {
  let called = false;
  await assert.rejects(
    runProbe({
      mode: 'amount',
      baseUrl: 'https://payments.example.com',
      expectedBuild: expectedBuggyBuild,
      runId: 'probe-host-guard',
      evidenceDirectory: await mkdtemp(join(tmpdir(), 'paydemo-probe-host-')),
      fetchImpl: async () => {
        called = true;
        throw new Error('must not be called');
      },
      environment: {},
    }),
    /host is not allowed/i,
  );
  assert.equal(called, false);
});

test('an invalid or caller-chosen build identity is rejected before the first request', async () => {
  const invalidBuilds = [
    { ...expectedBuggyBuild, app: 'CallerChosenProduct' },
    { ...expectedBuggyBuild, variant: 'prod' },
    { ...expectedBuggyBuild, commit: 'not-a-commit' },
    { ...expectedBuggyBuild, contentHash: 'not-a-hash' },
    { ...expectedBuggyBuild, environmentId: '../other-env' },
    { ...expectedBuggyBuild, instanceNonce: 'not-a-uuid-v4' },
  ];
  for (const expectedBuild of invalidBuilds) {
    let called = false;
    await assert.rejects(runProbe({
      mode: 'amount',
      baseUrl: 'http://127.0.0.1:4173',
      expectedBuild,
      runId: 'probe-build-guard',
      evidenceDirectory: await mkdtemp(join(tmpdir(), 'paydemo-probe-build-')),
      fetchImpl: async () => {
        called = true;
        return Response.json(expectedBuild);
      },
    }), /expected build identity is invalid/i);
    assert.equal(called, false);
  }
});

test('environment id and instance nonce must exactly match build-info before any POST', async () => {
  const requestedUrls = [];
  const result = await runProbe({
    mode: 'amount',
    baseUrl: 'http://127.0.0.1:4173',
    expectedBuild: expectedBuggyBuild,
    runId: 'probe-instance-identity',
    evidenceDirectory: await mkdtemp(join(tmpdir(), 'paydemo-probe-instance-')),
    fetchImpl: async (url, options = {}) => {
      requestedUrls.push({ url: String(url), method: options.method ?? 'GET' });
      if (options.method) throw new Error('POST must not run for the wrong instance nonce');
      return Response.json({
        ...expectedBuggyBuild,
        instanceNonce: '22222222-2222-4222-8222-222222222222',
      });
    },
  });

  assert.equal(result.code, 'BUILD_IDENTITY_MISMATCH');
  assert.equal(result.axes.product_result, 'INCONCLUSIVE');
  assert.equal(result.axes.environment_status, 'INFRA_FAILURE');
  assert.deepEqual(requestedUrls, [{
    url: 'http://127.0.0.1:4173/build-info',
    method: 'GET',
  }]);
});

test('CLI binds each probe mode to its exact BPMN item key and rejects duplicate flags', () => {
  const baseArgs = [
    '--mode', 'amount',
    '--base-url', 'http://127.0.0.1:4173',
    '--run-id', 'probe-cli-guard',
    '--item-key', 'check_ui_api_consistency',
    '--expected-variant', 'buggy-v1',
    '--expected-commit', 'a'.repeat(40),
    '--expected-content-hash', `sha256:${'b'.repeat(64)}`,
    '--expected-environment-id', 'demo-env',
    '--expected-instance-nonce', '11111111-1111-4111-8111-111111111111',
  ];
  assert.throws(() => parseCliArguments(baseArgs), /item-key.*mode/i);
  assert.throws(() => parseCliArguments([
    ...baseArgs,
    '--mode', 'ui',
  ]), /duplicate argument: --mode/i);
});

test('evidence redacts secret fields and rejects oversized response bodies', async () => {
  const evidenceDirectory = await mkdtemp(join(tmpdir(), 'paydemo-probe-redaction-'));
  let call = 0;
  const sensitiveFetch = async (_url, options = {}) => {
    call += 1;
    if (call === 1) return Response.json(expectedBuggyBuild);
    if (call === 2) return Response.json({ reset: true, runId: JSON.parse(options.body).runId });
    return Response.json({
      paymentId: 'payment-1',
      amountCents: 100,
      paymentMethod: 'card',
      authorization: 'Bearer should-not-leak',
      debug: 'Authorization: Bearer value-secret',
      message: 'contact alice@example.com',
      neutral: 'sk_live_FAKE_123456',
      details: 'api-key=FAKE-ABC-999',
      sk_live_FAKE_IN_KEY: true,
    }, { status: 201 });
  };
  const result = await runProbe({
    mode: 'amount',
    baseUrl: 'http://127.0.0.1:4173',
    expectedBuild: expectedBuggyBuild,
    runId: 'probe-redaction',
    evidenceDirectory,
    fetchImpl: sensitiveFetch,
  });
  const serialized = JSON.stringify(result.occurrence.observed);
  assert.doesNotMatch(
    serialized,
    /reset-secret|qa@example\.com|should-not-leak|value-secret|alice@example\.com|sk_live|FAKE-ABC|authorization|debug|details|message|neutral|email|token|unexpected_fields/,
  );
  assert.equal(result.occurrence.observed.reset.body.unexpected_field_count, 0);
  assert.equal(result.occurrence.observed.reset.body.unexpected_field_names_sha256, null);
  assert.equal(result.occurrence.observed.probe.body.unexpected_field_count, 6);
  assert.equal(
    result.occurrence.observed.probe.body.unexpected_field_names_sha256,
    'sha256:71e4b6990f7b814e27f4707fd631141907f50426a12add20ec30bf6f0b5974a6',
  );

  const oversized = await runProbe({
    mode: 'amount',
    baseUrl: 'http://127.0.0.1:4173',
    expectedBuild: expectedBuggyBuild,
    runId: 'probe-oversized',
    evidenceDirectory,
    fetchImpl: async () => new Response('x'.repeat(40_000), { status: 200 }),
  });
  assert.equal(oversized.axes.product_result, 'INCONCLUSIVE');
  assert.equal(oversized.axes.environment_status, 'INFRA_FAILURE');
  assert.equal(oversized.axes.evidence_status, 'UNVERIFIED');
  assert.equal(oversized.code, 'PROBE_EXECUTION_ERROR');
  assert.ok(JSON.stringify(oversized.occurrence.observed).length < 2_000);

  const thrown = await runProbe({
    mode: 'amount',
    baseUrl: 'http://127.0.0.1:4173',
    expectedBuild: expectedBuggyBuild,
    runId: 'probe-error-redaction',
    evidenceDirectory,
    fetchImpl: async () => {
      throw new Error(`Authorization: Bearer thrown-secret; alice@example.com; ${'x'.repeat(100_000)}`);
    },
  });
  const thrownSerialized = JSON.stringify(thrown.occurrence.observed);
  assert.doesNotMatch(thrownSerialized, /thrown-secret|alice@example\.com/);
  assert.ok(thrownSerialized.length < 1_000);
});

test('unexpected field count and digest cover the complete bounded key set', async () => {
  const names = Array.from({ length: 60 }, (_, index) => `field_${String(index).padStart(2, '0')}`);
  const unexpected = Object.fromEntries(names.map((name) => [name, true]));
  let call = 0;
  const result = await runProbe({
    mode: 'amount',
    baseUrl: 'http://127.0.0.1:4173',
    expectedBuild: expectedBuggyBuild,
    runId: 'probe-unexpected-key-set',
    evidenceDirectory: await mkdtemp(join(tmpdir(), 'paydemo-probe-key-set-')),
    fetchImpl: async (_url, options = {}) => {
      call += 1;
      if (call === 1) return Response.json(expectedBuggyBuild);
      if (call === 2) return Response.json({ reset: true, runId: JSON.parse(options.body).runId });
      return Response.json({
        paymentId: 'payment-1',
        amountCents: 100,
        paymentMethod: 'card',
        ...unexpected,
      }, { status: 201 });
    },
  });
  const body = result.occurrence.observed.probe.body;
  assert.equal(body.unexpected_field_count, 60);
  assert.equal(
    body.unexpected_field_names_sha256,
    `sha256:${createHash('sha256').update(JSON.stringify(names)).digest('hex')}`,
  );
});

test('bounded fetch rejects redirects before an external origin is invoked', async () => {
  const evidenceDirectory = await mkdtemp(join(tmpdir(), 'paydemo-probe-redirect-'));
  let redirectTargetCalls = 0;
  const redirectingFetch = async (url, options = {}) => {
    const origin = new URL(String(url)).origin;
    if (origin === 'https://redirect-target.example') {
      redirectTargetCalls += 1;
      return Response.json(expectedBuggyBuild);
    }
    if (options.redirect === 'error') throw new TypeError('fetch failed: redirect blocked');
    return redirectingFetch('https://redirect-target.example/build-info', options);
  };

  const result = await runProbe({
    mode: 'amount',
    baseUrl: 'http://127.0.0.1:4173',
    expectedBuild: expectedBuggyBuild,
    runId: 'probe-redirect-guard',
    evidenceDirectory,
    fetchImpl: redirectingFetch,
  });

  assert.equal(redirectTargetCalls, 0);
  assert.equal(result.axes.product_result, 'INCONCLUSIVE');
  assert.equal(result.axes.environment_status, 'INFRA_FAILURE');
  assert.equal(result.defect_key, null);
});

test('UI stops after goto when the final page leaves the exact allowed origin', async () => {
  const evidenceDirectory = await mkdtemp(join(tmpdir(), 'paydemo-probe-ui-origin-'));
  const calls = [];
  const fixtureKey = `__paydemo_ui_origin_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const page = {
    async goto() {
      calls.push('goto');
    },
    url() {
      calls.push('url');
      return 'https://redirect-target.example/checkout';
    },
    getByLabel() {
      calls.push('getByLabel');
      throw new Error('no UI action is allowed after an origin escape');
    },
  };
  const context = {
    async newPage() {
      calls.push('newPage');
      return page;
    },
    async close() {
      calls.push('closeContext');
    },
  };
  const browser = {
    async newContext() {
      calls.push('newContext');
      return context;
    },
    async close() {
      calls.push('closeBrowser');
    },
  };
  globalThis[fixtureKey] = {
    chromium: {
      async connectOverCDP() {
        calls.push('connectOverCDP');
        return browser;
      },
    },
  };
  const playwrightModule = `data:text/javascript,export const chromium=globalThis[${JSON.stringify(fixtureKey)}].chromium`;
  const fakeFetch = async (url, options = {}) => {
    if (String(url).endsWith('/build-info')) return Response.json(expectedBuggyBuild);
    if (String(url).endsWith('/api/reset')) {
      return Response.json({ runId: JSON.parse(options.body).runId, reset: true });
    }
    throw new Error('checkout must not run after an origin escape');
  };

  try {
    const result = await runProbe({
      mode: 'ui',
      baseUrl: 'http://127.0.0.1:4173',
      expectedBuild: expectedBuggyBuild,
      runId: 'probe-ui-origin-guard',
      evidenceDirectory,
      fetchImpl: fakeFetch,
      environment: {
        NUANU_QA_BROWSER_CDP_URL: 'http://127.0.0.1:9222',
        NUANU_QA_PLAYWRIGHT_MODULE: playwrightModule,
      },
    });
    assert.equal(result.axes.product_result, 'INCONCLUSIVE');
    assert.equal(result.axes.environment_status, 'INFRA_FAILURE');
    assert.equal(result.defect_key, null);
    assert.deepEqual(calls, [
      'connectOverCDP',
      'newContext',
      'newPage',
      'goto',
      'url',
      'closeContext',
      'closeBrowser',
    ]);
  } finally {
    delete globalThis[fixtureKey];
  }
});

test('UI captures a bounded backend JSON response and sanitizes it before classification evidence', async () => {
  const fixtureKey = `__paydemo_ui_backend_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const calls = [];
  const matcherResults = [];
  let currentUrl = '';
  const backendPayload = JSON.stringify({
    paymentId: 'payment-1',
    amountCents: 999,
    paymentMethod: 'bank',
    secret_key: 'must-not-leak',
  });
  let advertisedContentLength = Buffer.byteLength(backendPayload);
  const backendResponse = {
    url: () => 'http://127.0.0.1:4173/api/checkout',
    request: () => ({
      method: () => 'POST',
      postDataJSON: () => ({ paymentMethod: 'bank' }),
    }),
    status: () => 201,
    async headerValue(name) {
      if (name.toLowerCase() === 'content-type') return 'application/json; charset=utf-8';
      if (name.toLowerCase() === 'content-length') return String(advertisedContentLength);
      return null;
    },
    async body() {
      calls.push('responseBody');
      return Buffer.from(backendPayload);
    },
  };
  const receipt = {
    filter() {
      return this;
    },
    async waitFor() {},
    async textContent() {
      return 'Payment recorded by bank transfer.';
    },
  };
  const page = {
    async goto(url) {
      currentUrl = url;
    },
    url() {
      return currentUrl;
    },
    getByLabel() {
      return {
        async check() {},
        async isChecked() { return true; },
      };
    },
    waitForResponse(predicate) {
      const fakeResponse = (url, method = 'POST') => ({
        url: () => url,
        request: () => ({ method: () => method }),
      });
      matcherResults.push({
        cross_origin: predicate(fakeResponse('https://attacker.example/api/checkout')),
        prefixed_path: predicate(fakeResponse('http://127.0.0.1:4173/prefix/api/checkout')),
        query: predicate(fakeResponse('http://127.0.0.1:4173/api/checkout?redirect=1')),
        fragment: predicate(fakeResponse('http://127.0.0.1:4173/api/checkout#fragment')),
        wrong_method: predicate(fakeResponse('http://127.0.0.1:4173/api/checkout', 'GET')),
        exact: predicate(backendResponse),
      });
      return Promise.resolve(backendResponse);
    },
    getByRole(role) {
      if (role === 'button') return { async click() {} };
      return receipt;
    },
  };
  const context = {
    async newPage() { return page; },
    async close() {},
  };
  const browser = {
    async newContext() { return context; },
    async close() {},
  };
  globalThis[fixtureKey] = {
    chromium: { async connectOverCDP() { return browser; } },
  };
  const playwrightModule = `data:text/javascript,export const chromium=globalThis[${JSON.stringify(fixtureKey)}].chromium`;
  try {
    const result = await runProbe({
      mode: 'ui',
      baseUrl: 'http://127.0.0.1:4173',
      expectedBuild: expectedBuggyBuild,
      runId: 'probe-ui-backend',
      evidenceDirectory: await mkdtemp(join(tmpdir(), 'paydemo-probe-ui-backend-')),
      fetchImpl: async (url, options = {}) => {
        if (String(url).endsWith('/build-info')) return Response.json(expectedBuggyBuild);
        return Response.json({ reset: true, runId: JSON.parse(options.body).runId });
      },
      environment: {
        NUANU_QA_BROWSER_CDP_URL: 'http://127.0.0.1:9222',
        NUANU_QA_PLAYWRIGHT_MODULE: playwrightModule,
      },
    });
    assert.equal(result.axes.product_result, 'FAIL');
    assert.equal(result.axes.environment_status, 'HEALTHY');
    assert.equal(result.code, 'BANK_UI_CONTRACT_VIOLATION');
    assert.deepEqual(calls, ['responseBody']);
    assert.deepEqual(matcherResults[0], {
      cross_origin: false,
      prefixed_path: false,
      query: false,
      fragment: false,
      wrong_method: false,
      exact: true,
    });
    assert.equal(result.occurrence.observed.probe.backend_response.status, 201);
    assert.equal(result.occurrence.observed.probe.backend_response.body.amount_cents, 999);
    assert.equal(result.occurrence.observed.probe.backend_response.body.unexpected_field_count, 1);
    assert.doesNotMatch(JSON.stringify(result.occurrence.observed), /must-not-leak|secret_key/);

    advertisedContentLength = 32_769;
    const oversized = await runProbe({
      mode: 'ui',
      baseUrl: 'http://127.0.0.1:4173',
      expectedBuild: expectedBuggyBuild,
      runId: 'probe-ui-backend-oversized',
      evidenceDirectory: await mkdtemp(join(tmpdir(), 'paydemo-probe-ui-backend-oversized-')),
      fetchImpl: async (url, options = {}) => {
        if (String(url).endsWith('/build-info')) return Response.json(expectedBuggyBuild);
        return Response.json({ reset: true, runId: JSON.parse(options.body).runId });
      },
      environment: {
        NUANU_QA_BROWSER_CDP_URL: 'http://127.0.0.1:9222',
        NUANU_QA_PLAYWRIGHT_MODULE: playwrightModule,
      },
    });
    assert.equal(oversized.axes.product_result, 'INCONCLUSIVE');
    assert.equal(oversized.axes.environment_status, 'INFRA_FAILURE');
    assert.equal(oversized.code, 'UI_PROBE_UNAVAILABLE');
    assert.deepEqual(calls, ['responseBody'], 'oversized Content-Length must be rejected before body()');
  } finally {
    delete globalThis[fixtureKey];
  }
});

test('browser checks use and close their own isolated context without touching the worker context', async () => {
  const calls = [];
  const page = { marker: 'isolated-page' };
  const context = {
    async newPage() {
      calls.push('newPage');
      return page;
    },
    async close() {
      calls.push('closeContext');
    },
  };
  const browser = {
    contexts() {
      throw new Error('shared worker context must not be read');
    },
    async newContext() {
      calls.push('newContext');
      return context;
    },
    async close() {
      calls.push('disconnectBrowser');
    },
  };

  const result = await withIsolatedBrowserPage(browser, async (receivedPage) => {
    calls.push('callback');
    assert.equal(receivedPage, page);
    return 'done';
  });

  assert.equal(result, 'done');
  assert.deepEqual(calls, ['newContext', 'newPage', 'callback', 'closeContext', 'disconnectBrowser']);
});

test('parallel probes derive separate product run namespaces from one process run id', async () => {
  const evidenceDirectory = await mkdtemp(join(tmpdir(), 'paydemo-probe-parallel-'));
  const resetRunIds = [];
  let replayCount = 0;
  const fakeFetch = async (url, options = {}) => {
    if (String(url).endsWith('/build-info')) return Response.json(expectedBuggyBuild);
    const body = JSON.parse(options.body);
    if (String(url).endsWith('/api/reset')) {
      resetRunIds.push(body.runId);
      return Response.json({ runId: body.runId, reset: true });
    }
    if (body.amountCents === 100) {
      return Response.json({ error: 'AMOUNT_MISMATCH' }, { status: 422 });
    }
    replayCount += 1;
    return Response.json({
      paymentId: 'payment-stable',
      amountCents: 1000,
      paymentMethod: 'card',
    }, { status: replayCount === 1 ? 201 : 200 });
  };

  const [amount, idempotency] = await Promise.all([
    runProbe({
      mode: 'amount',
      baseUrl: 'http://127.0.0.1:4173',
      expectedBuild: expectedBuggyBuild,
      runId: 'shared-process-run',
      evidenceDirectory,
      fetchImpl: fakeFetch,
    }),
    runProbe({
      mode: 'idempotency',
      baseUrl: 'http://127.0.0.1:4173',
      expectedBuild: expectedBuggyBuild,
      runId: 'shared-process-run',
      evidenceDirectory,
      fetchImpl: fakeFetch,
    }),
  ]);

  assert.deepEqual(new Set(resetRunIds), new Set([
    'shared-process-run-amount',
    'shared-process-run-idempotency',
  ]));
  assert.equal(amount.axes.product_result, 'PASS');
  assert.equal(idempotency.axes.product_result, 'PASS');
});
