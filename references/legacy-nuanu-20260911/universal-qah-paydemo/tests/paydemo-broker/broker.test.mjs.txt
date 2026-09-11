import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { createPayDemoBroker } from '../../scripts/paydemo-qah-broker.mjs';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDirectory, '../..');
const brokerPath = join(repositoryRoot, 'scripts/paydemo-qah-broker.mjs');
const trustedRepository = 'https://github.com/solomindanil/NuanuFlowQA.git';
const exactCommit = 'a'.repeat(40);
const campaignId = 'paydemo-demo';
const environmentId = 'paydemo-buggy';
const firstNonce = '11111111-1111-4111-8111-111111111111';
const secondNonce = '22222222-2222-4222-8222-222222222222';

function deferred() {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolveValue, rejectValue) => {
    resolvePromise = resolveValue;
    rejectPromise = rejectValue;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

function prepareEnvelope(configuration, instanceNonce, pidFile) {
  return {
    item: {
      key: 'prepare_environment',
      description: 'Изолированное окружение PayDemo готово.',
      data: {
        environment_status: 'READY',
        environment_id: configuration.environmentId,
        instance_nonce: instanceNonce,
        base_url: `http://127.0.0.1:${configuration.productPort}`,
        variant: configuration.variant,
        commit: configuration.commit,
        content_hash: `sha256:${'b'.repeat(64)}`,
        pid_file: pidFile,
      },
      artifacts: {},
    },
    artifact_outputs: {
      'item.artifacts.environment_manifest': null,
    },
  };
}

function cleanupEnvelope(configuration, pidFile, status = 'STOPPED', itemKey = configuration.cleanupItemKey) {
  return {
    item: {
      key: itemKey,
      description: status === 'STOPPED'
        ? 'Изолированное окружение PayDemo остановлено.'
        : 'Изолированное окружение PayDemo уже отсутствует.',
      data: {
        environment_status: status,
        environment_id: configuration.environmentId,
        pid_file: pidFile,
      },
      artifacts: {},
    },
    artifact_outputs: {
      'item.artifacts.environment_manifest': null,
    },
  };
}

test('cleanup accepts only an explicitly selected closed Process step key', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-broker-cleanup-key-test-'));
  const configuration = {
    host: '127.0.0.1',
    port: 0,
    campaignId,
    environmentId,
    repository: trustedRepository,
    commit: exactCommit,
    variant: 'buggy-v1',
    productPort: 41739,
    cleanupItemKey: 'cleanup_risk_environment',
    stateRoot: join(root, 'state'),
    tokenFile: join(root, 'credentials', 'broker.token'),
    curlConfig: join(root, 'credentials', 'broker.curlrc'),
  };
  await mkdir(join(root, 'credentials'), { recursive: true, mode: 0o700 });
  const pidFile = join(configuration.stateRoot, environmentId, 'server.pid');
  const invocations = [];
  const broker = await createPayDemoBroker({
    configuration,
    executeEnvironment: async (invocation) => {
      invocations.push(invocation);
      if (invocation.mode === 'prepare') return prepareEnvelope(configuration, firstNonce, pidFile);
      const itemKey = invocation.args.at(-1);
      return cleanupEnvelope(configuration, pidFile, 'STOPPED', itemKey);
    },
  });
  t.after(async () => {
    await broker.close();
    await rm(root, { recursive: true, force: true });
  });
  await broker.listen();
  const address = broker.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const token = (await readFile(configuration.tokenFile, 'utf8')).trim();
  const prepared = await postJson(origin, '/v1/prepare', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'prepare-cleanup-key-test-01',
    },
  });
  assert.equal(prepared.status, 200, prepared.text);

  const rejected = await postJson(origin, '/v1/cleanup', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'cleanup-key-rejected-0001',
      lease: firstNonce,
      item_key: 'caller_selected_cleanup',
    },
  });
  assert.equal(rejected.status, 400, rejected.text);
  assert.deepEqual(rejected.json, errorEnvelope('INVALID_REQUEST'));

  const cleaned = await postJson(origin, '/v1/cleanup', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'cleanup-clean-step-000001',
      lease: firstNonce,
      item_key: 'cleanup_clean_environment',
    },
  });
  assert.equal(cleaned.status, 200, cleaned.text);
  assert.equal(cleaned.json.item.key, 'cleanup_clean_environment');
  assert.deepEqual(invocations.at(-1).args.slice(-2), ['--item-key', 'cleanup_clean_environment']);
});

function errorEnvelope(code) {
  return { error: { code } };
}

async function postJson(origin, path, { token, body, contentType = 'application/json' } = {}) {
  const headers = {};
  if (token !== undefined) headers.authorization = `Bearer ${token}`;
  if (contentType !== null) headers['content-type'] = contentType;
  const response = await fetch(`${origin}${path}`, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    redirect: 'error',
  });
  const text = await response.text();
  return {
    status: response.status,
    text,
    json: JSON.parse(text),
  };
}

function rawRequestText({ port, path = '/v1/prepare', body = '{}', headers = [], method = 'POST' }) {
  return [
    `${method} ${path} HTTP/1.1`,
    `Host: 127.0.0.1:${port}`,
    ...headers,
    '',
    body,
  ].join('\r\n');
}

async function rawRequest(port, payload) {
  const socket = createConnection({ host: '127.0.0.1', port });
  socket.setEncoding('utf8');
  let response = '';
  socket.on('data', (chunk) => { response += chunk; });
  await once(socket, 'connect');
  socket.end(payload);
  await once(socket, 'close');
  return response;
}

async function openAndDisconnect(port, payload, operationStarted) {
  const socket = createConnection({ host: '127.0.0.1', port });
  await once(socket, 'connect');
  socket.write(payload);
  await operationStarted;
  socket.destroy();
  await once(socket, 'close');
}

function parseRawJson(response) {
  const [head, body] = response.split('\r\n\r\n');
  const status = Number.parseInt(head.match(/^HTTP\/1\.1 ([0-9]{3})/m)?.[1] ?? '', 10);
  return { status, json: JSON.parse(body) };
}

test('CLI rejects a non-literal-loopback bind before listen and never prints a configured secret', async () => {
  const secret = 'c'.repeat(64);
  const child = spawn(process.execPath, [brokerPath], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      PAYDEMO_QAH_BROKER_HOST: '0.0.0.0',
      PAYDEMO_QAH_BROKER_TOKEN: secret,
      PAYDEMO_QAH_BROKER_COMMIT: exactCommit,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const [exitCode] = await once(child, 'close');
  assert.equal(exitCode, 1);
  assert.equal(stdout, '');
  assert.match(stderr, /127\.0\.0\.1|loopback/i);
  assert.equal(stderr.includes(secret), false);
});

test('broker owns one exact campaign tuple and hardens HTTP parsing and credentials', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-broker-test-'));
  const credentialsDirectory = join(root, 'credentials');
  await mkdir(credentialsDirectory, { mode: 0o700 });
  const tokenFile = join(credentialsDirectory, 'broker.token');
  const curlConfig = join(credentialsDirectory, 'broker.curlrc');
  const configuration = {
    host: '127.0.0.1',
    port: 0,
    campaignId,
    environmentId,
    repository: trustedRepository,
    commit: exactCommit,
    variant: 'buggy-v1',
    productPort: 41731,
    cleanupItemKey: 'cleanup_risk_environment',
    stateRoot: join(root, 'state'),
    tokenFile,
    curlConfig,
  };
  const prepareGate = deferred();
  const prepareStarted = deferred();
  const cleanupGate = deferred();
  const cleanupStarted = deferred();
  const invocations = [];
  let prepareCount = 0;
  let cleanupCount = 0;
  const executeEnvironment = async (invocation) => {
    invocations.push(invocation);
    if (invocation.mode === 'prepare') {
      prepareCount += 1;
      if (prepareCount === 1) {
        prepareStarted.resolve();
        await prepareGate.promise;
      }
      const nonce = prepareCount === 1 ? firstNonce : secondNonce;
      return prepareEnvelope(
        configuration,
        nonce,
        join(configuration.stateRoot, environmentId, 'server.pid'),
      );
    }
    cleanupCount += 1;
    if (cleanupCount === 1) {
      cleanupStarted.resolve();
      await cleanupGate.promise;
    }
    return cleanupEnvelope(
      configuration,
      join(configuration.stateRoot, environmentId, 'server.pid'),
    );
  };
  const audit = [];
  const broker = await createPayDemoBroker({
    configuration,
    executeEnvironment,
    audit: (entry) => audit.push(entry),
  });
  t.after(async () => {
    await broker.close();
    await rm(root, { recursive: true, force: true });
  });
  await broker.listen();
  const address = broker.address();
  assert.equal(address.address, '127.0.0.1');
  const origin = `http://127.0.0.1:${address.port}`;
  const token = (await readFile(tokenFile, 'utf8')).trim();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal((await stat(tokenFile)).mode & 0o777, 0o600);
  assert.equal((await stat(curlConfig)).mode & 0o777, 0o600);
  const curlConfigText = await readFile(curlConfig, 'utf8');
  assert.match(curlConfigText, /header = "Authorization: Bearer [a-f0-9]{64}"/);
  assert.match(curlConfigText, /header = "Content-Type: application\/json"/);
  assert.match(curlConfigText, /noproxy = "127\.0\.0\.1"/);
  assert.match(curlConfigText, /proto = "=http"/);
  assert.match(curlConfigText, /proto-redir = "-all"/);

  const prepareBody = {
    campaign_id: campaignId,
    environment_id: environmentId,
    idempotency_key: 'prepare-request-00000001',
  };

  const noAuth = await postJson(origin, '/v1/prepare', { body: prepareBody });
  assert.equal(noAuth.status, 401);
  assert.deepEqual(noAuth.json, errorEnvelope('UNAUTHORIZED'));
  const wrongAuth = await postJson(origin, '/v1/prepare', {
    token: 'd'.repeat(64),
    body: prepareBody,
  });
  assert.equal(wrongAuth.status, 401);
  assert.deepEqual(wrongAuth.json, errorEnvelope('UNAUTHORIZED'));

  const duplicateAuthorization = parseRawJson(await rawRequest(address.port, rawRequestText({
    port: address.port,
    body: JSON.stringify(prepareBody),
    headers: [
      `Authorization: Bearer ${token}`,
      `Authorization: Bearer ${token}`,
      'Content-Type: application/json',
      `Content-Length: ${Buffer.byteLength(JSON.stringify(prepareBody))}`,
      'Connection: close',
    ],
  })));
  assert.equal(duplicateAuthorization.status, 401);
  assert.deepEqual(duplicateAuthorization.json, errorEnvelope('UNAUTHORIZED'));

  const badHost = parseRawJson(await rawRequest(address.port, rawRequestText({
    port: address.port,
    body: JSON.stringify(prepareBody),
    headers: [
      'Host: localhost',
      `Authorization: Bearer ${token}`,
      'Content-Type: application/json',
      `Content-Length: ${Buffer.byteLength(JSON.stringify(prepareBody))}`,
      'Connection: close',
    ],
  })));
  assert.equal(badHost.status, 400);
  assert.deepEqual(badHost.json, errorEnvelope('INVALID_HOST'));

  const query = await postJson(origin, '/v1/prepare?debug=1', { token, body: prepareBody });
  assert.equal(query.status, 404);
  assert.deepEqual(query.json, errorEnvelope('NOT_FOUND'));
  const badType = await postJson(origin, '/v1/prepare', {
    token,
    body: JSON.stringify(prepareBody),
    contentType: 'text/plain',
  });
  assert.equal(badType.status, 415);
  assert.deepEqual(badType.json, errorEnvelope('UNSUPPORTED_MEDIA_TYPE'));
  const malformed = await postJson(origin, '/v1/prepare', { token, body: '{' });
  assert.equal(malformed.status, 400);
  assert.deepEqual(malformed.json, errorEnvelope('INVALID_REQUEST'));
  const oversized = await postJson(origin, '/v1/prepare', {
    token,
    body: { padding: 'x'.repeat(33 * 1024) },
  });
  assert.equal(oversized.status, 413);
  assert.deepEqual(oversized.json, errorEnvelope('BODY_TOO_LARGE'));

  const ambiguousBody = parseRawJson(await rawRequest(address.port, rawRequestText({
    port: address.port,
    body: '0\r\n\r\n',
    headers: [
      `Authorization: Bearer ${token}`,
      'Content-Type: application/json',
      'Content-Length: 0',
      'Transfer-Encoding: chunked',
      'Connection: close',
    ],
  })));
  assert.equal(ambiguousBody.status, 400);
  assert.deepEqual(ambiguousBody.json, errorEnvelope('AMBIGUOUS_BODY'));

  for (const extraField of ['repo_url', 'commit', 'variant', 'port', 'state_root', 'pid_file']) {
    const response = await postJson(origin, '/v1/prepare', {
      token,
      body: { ...prepareBody, [extraField]: 'caller-controlled' },
    });
    assert.equal(response.status, 400, extraField);
    assert.deepEqual(response.json, errorEnvelope('INVALID_REQUEST'));
  }
  const wrongTuple = await postJson(origin, '/v1/prepare', {
    token,
    body: { ...prepareBody, environment_id: 'another-environment', idempotency_key: 'wrong-tuple-000000000001' },
  });
  assert.equal(wrongTuple.status, 403);
  assert.deepEqual(wrongTuple.json, errorEnvelope('NOT_ALLOWED'));

  const invocationBody = JSON.stringify(prepareBody);
  const disconnectedRequest = rawRequestText({
    port: address.port,
    body: invocationBody,
    headers: [
      `Authorization: Bearer ${token}`,
      'Content-Type: application/json',
      `Content-Length: ${Buffer.byteLength(invocationBody)}`,
      'Connection: close',
    ],
  });
  const disconnectPromise = openAndDisconnect(address.port, disconnectedRequest, prepareStarted.promise);
  await prepareStarted.promise;
  const replayWhilePending = postJson(origin, '/v1/prepare', { token, body: prepareBody });
  const competingPrepare = await postJson(origin, '/v1/prepare', {
    token,
    body: { ...prepareBody, idempotency_key: 'prepare-request-00000002' },
  });
  assert.equal(competingPrepare.status, 409);
  assert.deepEqual(competingPrepare.json, errorEnvelope('ENVIRONMENT_BUSY'));
  await disconnectPromise;
  prepareGate.resolve();
  const prepared = await replayWhilePending;
  assert.equal(prepared.status, 200, prepared.text);
  assert.deepEqual(prepared.json, prepareEnvelope(
    configuration,
    firstNonce,
    join(configuration.stateRoot, environmentId, 'server.pid'),
  ));
  assert.deepEqual(Object.keys(prepared.json).sort(), ['artifact_outputs', 'item']);
  assert.equal(prepared.text.includes(token), false);
  assert.equal(prepareCount, 1);

  const exactReplay = await postJson(origin, '/v1/prepare', { token, body: prepareBody });
  assert.deepEqual(exactReplay.json, prepared.json);
  assert.equal(prepareCount, 1);
  const changedHash = await postJson(origin, '/v1/prepare', {
    token,
    body: { ...prepareBody, environment_id: 'another-environment' },
  });
  assert.equal(changedHash.status, 409);
  assert.deepEqual(changedHash.json, errorEnvelope('IDEMPOTENCY_CONFLICT'));

  const wrongLease = await postJson(origin, '/v1/cleanup', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'cleanup-request-00000001',
      lease: secondNonce,
    },
  });
  assert.equal(wrongLease.status, 403);
  assert.deepEqual(wrongLease.json, errorEnvelope('INVALID_LEASE'));

  const cleanupBody = {
    campaign_id: campaignId,
    environment_id: environmentId,
    idempotency_key: 'cleanup-request-00000002',
    lease: firstNonce,
  };
  const firstCleanup = postJson(origin, '/v1/cleanup', { token, body: cleanupBody });
  await cleanupStarted.promise;
  const replayCleanup = postJson(origin, '/v1/cleanup', { token, body: cleanupBody });
  const prepareDuringCleanup = await postJson(origin, '/v1/prepare', {
    token,
    body: { ...prepareBody, idempotency_key: 'prepare-request-00000003' },
  });
  assert.equal(prepareDuringCleanup.status, 409);
  assert.deepEqual(prepareDuringCleanup.json, errorEnvelope('ENVIRONMENT_BUSY'));
  cleanupGate.resolve();
  const [cleaned, cleanedReplay] = await Promise.all([firstCleanup, replayCleanup]);
  assert.equal(cleaned.status, 200, cleaned.text);
  assert.deepEqual(cleanedReplay.json, cleaned.json);
  assert.deepEqual(cleaned.json, cleanupEnvelope(
    configuration,
    join(configuration.stateRoot, environmentId, 'server.pid'),
  ));
  assert.equal(cleanupCount, 1);
  const replayAfterAbsent = await postJson(origin, '/v1/cleanup', { token, body: cleanupBody });
  assert.deepEqual(replayAfterAbsent.json, cleaned.json);
  assert.equal(cleanupCount, 1);

  const secondPrepareBody = { ...prepareBody, idempotency_key: 'prepare-request-00000004' };
  const secondPrepared = await postJson(origin, '/v1/prepare', { token, body: secondPrepareBody });
  assert.equal(secondPrepared.status, 200, secondPrepared.text);
  assert.equal(secondPrepared.json.item.data.instance_nonce, secondNonce);
  const invalidStateFlood = await Promise.all(Array.from({ length: 270 }, (_, index) => postJson(
    origin,
    '/v1/prepare',
    {
      token,
      body: {
        ...prepareBody,
        idempotency_key: `busy-does-not-fill-cache-${String(index).padStart(4, '0')}`,
      },
    },
  )));
  assert.equal(invalidStateFlood.every((response) => response.status === 409), true);
  assert.equal(invalidStateFlood.every((response) => response.json.error.code === 'INVALID_STATE'), true);
  const staleCleanup = await postJson(origin, '/v1/cleanup', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'cleanup-request-00000003',
      lease: firstNonce,
    },
  });
  assert.equal(staleCleanup.status, 403);
  assert.deepEqual(staleCleanup.json, errorEnvelope('INVALID_LEASE'));
  const finalCleanup = await postJson(origin, '/v1/cleanup', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'cleanup-request-00000004',
      lease: secondNonce,
    },
  });
  assert.equal(finalCleanup.status, 200, finalCleanup.text);
  assert.equal(cleanupCount, 2);

  assert.equal(invocations.length, 4);
  const [firstPrepareInvocation, firstCleanupInvocation] = invocations;
  assert.equal(firstPrepareInvocation.mode, 'prepare');
  assert.deepEqual(firstPrepareInvocation.args, [
    'prepare',
    '--repo-url', trustedRepository,
    '--commit', exactCommit,
    '--variant', 'buggy-v1',
    '--port', String(configuration.productPort),
    '--environment-id', environmentId,
    '--state-root', configuration.stateRoot,
    '--item-key', 'prepare_environment',
  ]);
  assert.equal(firstCleanupInvocation.mode, 'cleanup');
  assert.deepEqual(firstCleanupInvocation.args, [
    'cleanup',
    '--environment-id', environmentId,
    '--state-root', configuration.stateRoot,
    '--pid-file', join(configuration.stateRoot, environmentId, 'server.pid'),
    '--item-key', 'cleanup_risk_environment',
  ]);
  await assert.rejects(
    createPayDemoBroker({
      configuration: { ...configuration, cleanupItemKey: 'caller_selected_cleanup' },
      executeEnvironment,
    }),
    /cleanup item key/i,
  );
  const invocationText = JSON.stringify(invocations);
  assert.equal(invocationText.includes(token), false);
  assert.equal(invocationText.includes('NUANU_QA_ALLOW_FILE_REPO'), false);
  assert.equal(invocations.every((entry) => entry.options?.shell === false), true);
  assert.equal(invocations.every((entry) => entry.options?.env?.NUANU_QA_ALLOWED_REPOSITORIES === trustedRepository), true);
  assert.equal(invocations.every((entry) => !Object.keys(entry.options?.env ?? {}).some((key) => /TOKEN|SECRET/i.test(key))), true);

  assert.equal(audit.some((entry) => /^sha256:[a-f0-9]{64}$/.test(entry.request_hash)), true);
  assert.equal(audit.every((entry) => /^sha256:[a-f0-9]{64}$/.test(entry.tuple_hash)), true);
  assert.equal(JSON.stringify(audit).includes(token), false);
  assert.deepEqual(
    audit.filter((entry) => entry.event === 'state_transition').map((entry) => `${entry.from}->${entry.to}`),
    [
      'ABSENT->PREPARING',
      'PREPARING->READY',
      'READY->CLEANING',
      'CLEANING->ABSENT',
      'ABSENT->PREPARING',
      'PREPARING->READY',
      'READY->CLEANING',
      'CLEANING->ABSENT',
    ],
  );
});

test('broker rejects noisy, malformed, oversized, and tuple-mismatched CLI output before READY', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-broker-output-test-'));
  const configuration = {
    host: '127.0.0.1',
    port: 0,
    campaignId,
    environmentId,
    repository: trustedRepository,
    commit: exactCommit,
    variant: 'buggy-v1',
    productPort: 41732,
    cleanupItemKey: 'cleanup_risk_environment',
    stateRoot: join(root, 'state'),
    tokenFile: join(root, 'credentials', 'token'),
    curlConfig: join(root, 'credentials', 'curl.conf'),
  };
  const pidFile = join(configuration.stateRoot, environmentId, 'server.pid');
  const validPrepare = prepareEnvelope(configuration, firstNonce, pidFile);
  const withExtraItemField = structuredClone(validPrepare);
  withExtraItemField.item.unexpected = true;
  const wrongCommit = structuredClone(validPrepare);
  wrongCommit.item.data.commit = 'f'.repeat(40);
  const invalidPrepareOutputs = [
    `${JSON.stringify(validPrepare)}\n${JSON.stringify(validPrepare)}`,
    '{',
    'x'.repeat((128 * 1024) + 1),
    JSON.stringify({}),
    JSON.stringify(withExtraItemField),
    JSON.stringify(wrongCommit),
  ];
  let prepareIndex = 0;
  let cleanupAfterReady = 0;
  const executeEnvironment = async (invocation) => {
    if (invocation.mode === 'prepare') {
      const output = invalidPrepareOutputs[prepareIndex] ?? JSON.stringify(validPrepare);
      prepareIndex += 1;
      return output;
    }
    if (prepareIndex <= invalidPrepareOutputs.length) {
      return JSON.stringify(cleanupEnvelope(configuration, pidFile, 'ABSENT'));
    }
    cleanupAfterReady += 1;
    if (cleanupAfterReady === 1) {
      const invalidCleanup = cleanupEnvelope(configuration, pidFile);
      invalidCleanup.item.data.unexpected = true;
      return JSON.stringify(invalidCleanup);
    }
    return JSON.stringify(cleanupEnvelope(configuration, pidFile));
  };
  const broker = await createPayDemoBroker({ configuration, executeEnvironment });
  t.after(async () => {
    await broker.close();
    await rm(root, { recursive: true, force: true });
  });
  await broker.listen();
  const origin = `http://127.0.0.1:${broker.address().port}`;
  const token = (await readFile(configuration.tokenFile, 'utf8')).trim();

  for (let index = 0; index < invalidPrepareOutputs.length; index += 1) {
    const response = await postJson(origin, '/v1/prepare', {
      token,
      body: {
        campaign_id: campaignId,
        environment_id: environmentId,
        idempotency_key: `invalid-prepare-${String(index).padStart(8, '0')}`,
      },
    });
    assert.equal(response.status, 502, `invalid output case ${index}: ${response.text}`);
    assert.deepEqual(response.json, errorEnvelope('HARNESS_OUTPUT_INVALID'));
  }

  const cleanupWithoutReady = await postJson(origin, '/v1/cleanup', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'cleanup-without-ready-0001',
      lease: firstNonce,
    },
  });
  assert.equal(cleanupWithoutReady.status, 409);
  assert.deepEqual(cleanupWithoutReady.json, errorEnvelope('INVALID_STATE'));

  const validPrepareResponse = await postJson(origin, '/v1/prepare', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'valid-prepare-after-invalid',
    },
  });
  assert.equal(validPrepareResponse.status, 200, validPrepareResponse.text);
  assert.equal(validPrepareResponse.json.item.data.instance_nonce, firstNonce);

  const invalidCleanupResponse = await postJson(origin, '/v1/cleanup', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'invalid-cleanup-output-01',
      lease: firstNonce,
    },
  });
  assert.equal(invalidCleanupResponse.status, 502, invalidCleanupResponse.text);
  assert.deepEqual(invalidCleanupResponse.json, errorEnvelope('HARNESS_OUTPUT_INVALID'));

  const cleanupAfterUncertainOutput = await postJson(origin, '/v1/cleanup', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'valid-cleanup-after-invalid',
      lease: firstNonce,
    },
  });
  assert.equal(cleanupAfterUncertainOutput.status, 409, cleanupAfterUncertainOutput.text);
  assert.deepEqual(cleanupAfterUncertainOutput.json, errorEnvelope('RECOVERY_REQUIRED'));
  assert.equal(cleanupAfterReady, 1);
});

test('failed prepare compensation quarantines ownership uncertainty and blocks a second prepare', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-broker-quarantine-test-'));
  const configuration = {
    host: '127.0.0.1',
    port: 0,
    campaignId,
    environmentId,
    repository: trustedRepository,
    commit: exactCommit,
    variant: 'buggy-v1',
    productPort: 41734,
    cleanupItemKey: 'cleanup_risk_environment',
    stateRoot: join(root, 'state'),
    tokenFile: join(root, 'credentials', 'token'),
    curlConfig: join(root, 'credentials', 'curl.conf'),
  };
  const invocations = [];
  const audit = [];
  const broker = await createPayDemoBroker({
    configuration,
    audit: (entry) => audit.push(entry),
    executeEnvironment: async (invocation) => {
      invocations.push(invocation);
      return '{}';
    },
  });
  t.after(async () => {
    await broker.close();
    await rm(root, { recursive: true, force: true });
  });
  await broker.listen();
  const origin = `http://127.0.0.1:${broker.address().port}`;
  const token = (await readFile(configuration.tokenFile, 'utf8')).trim();
  const firstPrepare = await postJson(origin, '/v1/prepare', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'quarantine-first-prepare-01',
    },
  });
  assert.equal(firstPrepare.status, 502);
  assert.deepEqual(firstPrepare.json, errorEnvelope('HARNESS_OUTPUT_INVALID'));
  assert.deepEqual(invocations.map((entry) => entry.mode), ['prepare', 'cleanup']);

  const secondPrepare = await postJson(origin, '/v1/prepare', {
    token,
    body: {
      campaign_id: campaignId,
      environment_id: environmentId,
      idempotency_key: 'quarantine-second-prepare-1',
    },
  });
  assert.equal(secondPrepare.status, 409);
  assert.deepEqual(secondPrepare.json, errorEnvelope('RECOVERY_REQUIRED'));
  assert.deepEqual(invocations.map((entry) => entry.mode), ['prepare', 'cleanup']);
  assert.deepEqual(
    audit.filter((entry) => entry.event === 'state_transition').map((entry) => `${entry.from}->${entry.to}`),
    ['ABSENT->PREPARING', 'PREPARING->QUARANTINED'],
  );
});

test('shutdown stops admission but waits for a disconnected in-flight operation without cleanup or kill', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'paydemo-broker-shutdown-test-'));
  const configuration = {
    host: '127.0.0.1',
    port: 0,
    campaignId,
    environmentId,
    repository: trustedRepository,
    commit: exactCommit,
    variant: 'buggy-v1',
    productPort: 41733,
    cleanupItemKey: 'cleanup_risk_environment',
    stateRoot: join(root, 'state'),
    tokenFile: join(root, 'credentials', 'token'),
    curlConfig: join(root, 'credentials', 'curl.conf'),
  };
  const pidFile = join(configuration.stateRoot, environmentId, 'server.pid');
  const operationStarted = deferred();
  const operationGate = deferred();
  const invocations = [];
  const audit = [];
  const broker = await createPayDemoBroker({
    configuration,
    audit: (entry) => audit.push(entry),
    executeEnvironment: async (invocation) => {
      invocations.push(invocation);
      operationStarted.resolve();
      await operationGate.promise;
      return JSON.stringify(prepareEnvelope(configuration, firstNonce, pidFile));
    },
  });
  t.after(async () => {
    operationGate.resolve();
    await broker.close();
    await rm(root, { recursive: true, force: true });
  });
  await broker.listen();
  const port = broker.address().port;
  const token = (await readFile(configuration.tokenFile, 'utf8')).trim();
  const body = JSON.stringify({
    campaign_id: campaignId,
    environment_id: environmentId,
    idempotency_key: 'disconnected-shutdown-0001',
  });
  await openAndDisconnect(port, rawRequestText({
    port,
    body,
    headers: [
      `Authorization: Bearer ${token}`,
      'Content-Type: application/json',
      `Content-Length: ${Buffer.byteLength(body)}`,
      'Connection: close',
    ],
  }), operationStarted.promise);

  let shutdownSettled = false;
  const shutdown = broker.close().then(() => { shutdownSettled = true; });
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
  assert.equal(shutdownSettled, false, 'shutdown must retain the detached CLI operation');
  assert.equal(invocations.length, 1);
  assert.equal(invocations[0].mode, 'prepare');

  operationGate.resolve();
  await shutdown;
  assert.equal(shutdownSettled, true);
  assert.equal(invocations.length, 1, 'shutdown must not issue unconditional cleanup or kill');
  assert.deepEqual(
    audit.filter((entry) => entry.event === 'state_transition').map((entry) => `${entry.from}->${entry.to}`),
    ['ABSENT->PREPARING', 'PREPARING->READY'],
  );
});
