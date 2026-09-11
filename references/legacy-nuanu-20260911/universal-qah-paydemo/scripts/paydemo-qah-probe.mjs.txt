#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PRODUCT = 'PayDemo';
const RESULT_SCHEMA = 'qah.probe-result.v1';
const ALLOWED_BUILD_VARIANTS = new Set(['buggy-v1', 'fixed-v2']);

const MODE_CONTRACTS = Object.freeze({
  amount: 'available-balance-v1',
  idempotency: 'transfer-idempotency-v1',
  ui: 'status-consistency-v1',
});
const MODE_ITEM_KEYS = Object.freeze({
  amount: 'check_amount_integrity',
  idempotency: 'check_idempotency',
  ui: 'check_ui_api_consistency',
});

const verifiedPass = (code) => ({
  product_result: 'PASS',
  environment_status: 'HEALTHY',
  evidence_status: 'VERIFIED',
  confidence: 1,
  code,
});

const verifiedFailure = (code) => ({
  product_result: 'FAIL',
  environment_status: 'HEALTHY',
  evidence_status: 'VERIFIED',
  confidence: 0.99,
  code,
});

const infrastructureFailure = (code, evidenceStatus = 'VERIFIED') => ({
  product_result: 'INCONCLUSIVE',
  environment_status: 'INFRA_FAILURE',
  evidence_status: evidenceStatus,
  confidence: evidenceStatus === 'VERIFIED' ? 1 : 0.99,
  code,
});

export function classifyAmount({ status, body }) {
  const exactMismatch = status === 422
    && body
    && typeof body === 'object'
    && !Array.isArray(body)
    && Object.keys(body).join(',') === 'error'
    && body.error === 'AMOUNT_MISMATCH';
  if (exactMismatch) return verifiedPass('AMOUNT_REJECTED');
  if (Number.isInteger(status) && status >= 200 && status < 300) {
    return verifiedFailure('AMOUNT_MISMATCH_ACCEPTED');
  }
  return infrastructureFailure('AMOUNT_PROBE_UNAVAILABLE');
}

function jsonEquals(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function exactPaymentBody(body) {
  return body
    && typeof body === 'object'
    && !Array.isArray(body)
    && Object.keys(body).sort().join(',') === 'amountCents,paymentId,paymentMethod';
}

export function classifyIdempotency({ firstStatus, secondStatus, firstBody, secondBody }) {
  const firstPaymentId = firstBody?.paymentId;
  const secondPaymentId = secondBody?.paymentId;
  const statuses = [firstStatus, secondStatus].sort((left, right) => left - right);
  if (
    statuses[0] === 200
    && statuses[1] === 201
    && typeof firstPaymentId === 'string'
    && firstPaymentId.length > 0
    && firstPaymentId === secondPaymentId
    && exactPaymentBody(firstBody)
    && exactPaymentBody(secondBody)
    && firstBody.amountCents === 1000
    && secondBody.amountCents === 1000
    && firstBody.paymentMethod === 'card'
    && secondBody.paymentMethod === 'card'
    && jsonEquals(firstBody, secondBody)
  ) {
    return verifiedPass('IDEMPOTENT_REPLAY');
  }
  if (
    Number.isInteger(firstStatus)
    && firstStatus >= 200
    && firstStatus < 300
    && Number.isInteger(secondStatus)
    && secondStatus >= 200
    && secondStatus < 300
    && typeof firstPaymentId === 'string'
    && typeof secondPaymentId === 'string'
    && firstPaymentId !== secondPaymentId
  ) {
    return verifiedFailure('DUPLICATE_PAYMENT_IDS');
  }
  if (![firstStatus, secondStatus].every((status) => (
    Number.isInteger(status) && status >= 200 && status < 300
  ))) {
    return infrastructureFailure('IDEMPOTENCY_PROBE_UNAVAILABLE');
  }
  return verifiedFailure('IDEMPOTENCY_CONTRACT_VIOLATION');
}

export function classifyUi({
  selectedPaymentMethod,
  requestPaymentMethod,
  receiptText,
  responseStatus,
  responseBody,
}) {
  if (!Number.isInteger(responseStatus) || responseStatus < 200 || responseStatus >= 300) {
    return infrastructureFailure('UI_PROBE_UNAVAILABLE');
  }
  if (
    selectedPaymentMethod === 'bank'
    && requestPaymentMethod === 'bank'
    && responseStatus === 201
    && receiptText === 'Payment recorded by bank transfer.'
    && exactPaymentBody(responseBody)
    && typeof responseBody.paymentId === 'string'
    && responseBody.paymentId.length > 0
    && responseBody.amountCents === 1000
    && responseBody.paymentMethod === 'bank'
  ) {
    return verifiedPass('BANK_TRANSFER_CONFIRMED');
  }
  if (
    selectedPaymentMethod === 'bank'
    && (requestPaymentMethod !== 'bank' || /\bcard\b/i.test(String(receiptText)))
  ) {
    return verifiedFailure('BANK_SHOWN_AS_CARD');
  }
  return verifiedFailure('BANK_UI_CONTRACT_VIOLATION');
}

const BUILD_KEYS = Object.freeze([
  'app',
  'variant',
  'commit',
  'contentHash',
  'environmentId',
  'instanceNonce',
]);

export function classifyBuildIdentity({ expected, actual }) {
  const exact = BUILD_KEYS.every((key) => (
    typeof expected?.[key] === 'string'
    && expected[key].length > 0
    && actual?.[key] === expected[key]
  ));
  return exact ? null : infrastructureFailure('BUILD_IDENTITY_MISMATCH');
}

function validateExpectedBuild(expected) {
  const valid = expected?.app === PRODUCT
    && ALLOWED_BUILD_VARIANTS.has(expected.variant)
    && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(expected.commit)
    && /^sha256:[0-9a-f]{64}$/.test(expected.contentHash)
    && /^[a-z0-9][a-z0-9-]{0,63}$/.test(expected.environmentId)
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(expected.instanceNonce);
  if (!valid) throw new TypeError('Expected build identity is invalid or outside the PayDemo allowlist');
}

export function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Canonical JSON does not support non-finite numbers');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalJson(entry)).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((key) => {
        if (value[key] === undefined) throw new TypeError(`Canonical JSON does not support undefined at ${key}`);
        return `${JSON.stringify(key)}:${canonicalJson(value[key])}`;
      });
    return `{${entries.join(',')}}`;
  }
  throw new TypeError(`Canonical JSON does not support ${typeof value}`);
}

const sha256 = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

export function branchTargetRunId(processRunId, mode) {
  const candidate = `${processRunId}-${mode}`;
  if (candidate.length <= 64) return candidate;
  const digest = createHash('sha256').update(`${processRunId}:${mode}`).digest('hex').slice(0, 32);
  return `qah-${mode}-${digest}`;
}

/*
 * qah-defect-key/v1 is deliberately build/run/time independent.
 * The exact UTF-8 bytes are canonical JSON with lexicographically ordered keys:
 * {"code":...,"contract":...,"probe":...,"product":"PayDemo","schema":"qah-defect-key/v1"}
 * defect_key = "sha256:" + SHA-256(bytes). Occurrence-specific inputs live in
 * result.occurrence and are hashed separately as occurrence_key.
 */
function defectIdentityFor(mode, code) {
  return {
    schema: 'qah-defect-key/v1',
    product: PRODUCT,
    probe: mode,
    contract: MODE_CONTRACTS[mode],
    code,
  };
}

function occurrenceKeyFor({ mode, contractId, defectKey, occurrence }) {
  return sha256(canonicalJson({
    schema: 'qah-occurrence/v1',
    product: PRODUCT,
    probe: mode,
    contract: contractId,
    defect_key: defectKey,
    occurrence,
  }));
}

export function buildProbeResult({ mode, classification, occurrence, evidenceSha256 = null }) {
  const contractId = MODE_CONTRACTS[mode];
  if (!contractId) throw new TypeError(`Unsupported probe mode: ${mode}`);
  const isProductDefect = classification.product_result === 'FAIL';
  const defectIdentity = isProductDefect ? defectIdentityFor(mode, classification.code) : null;
  const defectKey = defectIdentity ? sha256(canonicalJson(defectIdentity)) : null;
  const occurrenceKey = occurrenceKeyFor({ mode, contractId, defectKey, occurrence });

  return {
    schema_version: RESULT_SCHEMA,
    probe: mode,
    contract_id: contractId,
    axes: {
      product_result: classification.product_result,
      environment_status: classification.environment_status,
      evidence_status: classification.evidence_status,
      confidence: classification.confidence,
    },
    code: classification.code,
    defect_key: defectKey,
    defect_identity: defectIdentity,
    occurrence_key: occurrenceKey,
    occurrence,
    evidence: {
      sha256: evidenceSha256,
      markdown_path: null,
    },
  };
}

function evidenceMarkdown(result) {
  return [
    `# PayDemo QA evidence — ${result.probe}`,
    '',
    `- Contract: \`${result.contract_id}\``,
    `- Product result: \`${result.axes.product_result}\``,
    `- Environment status: \`${result.axes.environment_status}\``,
    `- Evidence status: \`${result.axes.evidence_status}\``,
    `- Confidence: \`${result.axes.confidence}\``,
    `- Code: \`${result.code}\``,
    `- Defect key: \`${result.defect_key ?? 'none'}\``,
    `- Occurrence key: \`${result.occurrence_key}\``,
    '',
    '## Defect identity',
    '',
    '```json',
    JSON.stringify(result.defect_identity, null, 2),
    '```',
    '',
    '## Occurrence',
    '',
    '```json',
    JSON.stringify(result.occurrence, null, 2),
    '```',
    '',
  ].join('\n');
}

/*
 * evidence_sha256 is the digest of this canonical semantic payload. It is not
 * the byte checksum of either the local Markdown or the Artifact that Nuanu
 * Flow materializes from item.data. The authoritative Artifact checksum must
 * be read from the resulting Artifact version after materialization.
 */
export function canonicalProbePayload(result) {
  return canonicalJson({
    schema_version: result.schema_version,
    probe: result.probe,
    contract_id: result.contract_id,
    axes: result.axes,
    code: result.code,
    defect_key: result.defect_key,
    defect_identity: result.defect_identity,
    occurrence_key: result.occurrence_key,
    occurrence: result.occurrence,
  });
}

export function probePayloadSha256(result) {
  return sha256(canonicalProbePayload(result));
}

function safeFilename(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'probe';
}

async function writeEvidence({ result, evidenceDirectory }) {
  const markdown = evidenceMarkdown(result);
  const evidenceSha256 = probePayloadSha256(result);
  await mkdir(evidenceDirectory, { recursive: true });
  const filename = `${safeFilename(result.probe)}-${safeFilename(result.occurrence.run_id)}.md`;
  const markdownPath = join(evidenceDirectory, filename);
  await writeFile(markdownPath, markdown, { encoding: 'utf8', mode: 0o600 });
  result.evidence = { sha256: evidenceSha256, markdown_path: markdownPath };
  return result;
}

function allowedHosts(environment) {
  return new Set((environment.NUANU_QA_ALLOWED_HOSTS ?? '127.0.0.1,localhost,::1')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean));
}

function normalizeBaseUrl(value, environment) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new TypeError('Base URL must use http or https');
  if (url.username || url.password) throw new TypeError('Base URL must not contain credentials');
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new TypeError('Base URL must be an origin only');
  }
  if (!allowedHosts(environment).has(url.hostname.toLowerCase())) {
    throw new TypeError(`Base URL host is not allowed: ${url.hostname}`);
  }
  if (url.protocol === 'http:' && !['127.0.0.1', 'localhost', '::1'].includes(url.hostname.toLowerCase())) {
    throw new TypeError('Non-loopback targets must use https');
  }
  return url.origin;
}

const endpoint = (baseUrl, pathname) => `${baseUrl}${pathname}`;

function unexpectedFieldSummary(body, allowedFields) {
  const names = body && typeof body === 'object' && !Array.isArray(body)
    ? Object.keys(body).filter((key) => !allowedFields.has(key)).sort()
    : [];
  return {
    unexpected_field_count: names.length,
    unexpected_field_names_sha256: names.length > 0 ? sha256(canonicalJson(names)) : null,
  };
}

function safeCode(value) {
  return typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(value) ? value : null;
}

function paymentResponseEvidence(response) {
  const body = response.body && typeof response.body === 'object' && !Array.isArray(response.body)
    ? response.body
    : {};
  const paymentId = typeof body.paymentId === 'string' && body.paymentId.length > 0
    ? sha256(body.paymentId)
    : null;
  const semanticBody = {
    payment_id_sha256: paymentId,
    amount_cents: Number.isSafeInteger(body.amountCents) ? body.amountCents : null,
      payment_method: ['card', 'bank'].includes(body.paymentMethod) ? body.paymentMethod : null,
      error_code: safeCode(body.error),
  };
  return {
    status: response.status,
    body: {
      ...semanticBody,
      semantic_sha256: sha256(canonicalJson(semanticBody)),
      ...unexpectedFieldSummary(body, new Set([
        'paymentId',
        'amountCents',
        'paymentMethod',
        'error',
      ])),
    },
  };
}

function resetResponseEvidence(response) {
  const body = response.body && typeof response.body === 'object' && !Array.isArray(response.body)
    ? response.body
    : {};
  return {
    status: response.status,
    body: {
      reset: body.reset === true,
      run_id_sha256: typeof body.runId === 'string' ? sha256(body.runId) : null,
      ...unexpectedFieldSummary(body, new Set(['reset', 'runId'])),
    },
  };
}

function buildInfoEvidence(response) {
  const body = response.body && typeof response.body === 'object' && !Array.isArray(response.body)
    ? response.body
    : {};
  return {
    status: response.status,
    body: {
      app: body.app === PRODUCT ? PRODUCT : null,
      variant: ALLOWED_BUILD_VARIANTS.has(body.variant) ? body.variant : null,
      commit: /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(body.commit) ? body.commit : null,
      contentHash: /^sha256:[0-9a-f]{64}$/.test(body.contentHash) ? body.contentHash : null,
      environmentId: /^[a-z0-9][a-z0-9-]{0,63}$/.test(body.environmentId) ? body.environmentId : null,
      instanceNonce: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(body.instanceNonce)
        ? body.instanceNonce
        : null,
      ...unexpectedFieldSummary(body, new Set([
        'app',
        'variant',
        'commit',
        'contentHash',
        'environmentId',
        'instanceNonce',
      ])),
    },
  };
}

function uiObservationEvidence(observation) {
  const knownReceipts = new Map([
    ['Payment recorded by card.', 'CARD_RECORDED'],
    ['Payment recorded by bank transfer.', 'BANK_RECORDED'],
    ['Payment could not be recorded.', 'PAYMENT_FAILED'],
  ]);
  return {
    selected_payment_method: ['card', 'bank'].includes(observation.selectedPaymentMethod)
      ? observation.selectedPaymentMethod
      : null,
    request_payment_method: ['card', 'bank'].includes(observation.requestPaymentMethod)
      ? observation.requestPaymentMethod
      : null,
    receipt_code: knownReceipts.get(observation.receiptText) ?? 'UNEXPECTED_RECEIPT',
    receipt_sha256: sha256(String(observation.receiptText)),
    response_status: observation.responseStatus,
    backend_response: paymentResponseEvidence({
      status: observation.responseStatus,
      body: observation.responseBody,
    }),
  };
}

async function boundedResponseText(response, maxBytes = 32_768) {
  if (!response.body?.getReader) {
    const fallback = await response.text();
    if (Buffer.byteLength(fallback) > maxBytes) throw new Error('RESPONSE_BODY_TOO_LARGE');
    return fallback;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel('RESPONSE_BODY_TOO_LARGE');
      throw new Error('RESPONSE_BODY_TOO_LARGE');
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total).toString('utf8');
}

async function responseJson(response) {
  const text = await boundedResponseText(response);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw_length: Buffer.byteLength(text), raw_sha256: sha256(text) };
  }
}

async function requestJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  return { status: response.status, body: await responseJson(response) };
}

const jsonRequest = (body, headers = {}) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body),
});

async function resetRun({ fetchImpl, baseUrl, runId }) {
  return requestJson(fetchImpl, endpoint(baseUrl, '/api/reset'), jsonRequest({ runId }));
}

async function executeAmount({ fetchImpl, baseUrl, runId }) {
  const response = await requestJson(
    fetchImpl,
    endpoint(baseUrl, '/api/checkout'),
    jsonRequest(
      { runId, planId: 'starter', amountCents: 100, paymentMethod: 'card' },
      { 'idempotency-key': `qah-${runId}-amount` },
    ),
  );
  return {
    classification: classifyAmount(response),
    observed: paymentResponseEvidence(response),
  };
}

async function executeIdempotency({ fetchImpl, baseUrl, runId }) {
  const payload = { runId, planId: 'starter', amountCents: 1000, paymentMethod: 'card' };
  const request = jsonRequest(payload, { 'idempotency-key': `qah-${runId}-idempotency` });
  const [first, second] = await Promise.all([
    requestJson(fetchImpl, endpoint(baseUrl, '/api/checkout'), request),
    requestJson(fetchImpl, endpoint(baseUrl, '/api/checkout'), request),
  ]);
  return {
    classification: classifyIdempotency({
      firstStatus: first.status,
      secondStatus: second.status,
      firstBody: first.body,
      secondBody: second.body,
    }),
    observed: {
      first: paymentResponseEvidence(first),
      second: paymentResponseEvidence(second),
    },
  };
}

async function playwrightResponseJson(response, maxBytes = 32_768) {
  if (typeof response.headerValue !== 'function') throw new Error('UI_PROBE_UNAVAILABLE');
  const [contentType, rawContentLength] = await Promise.all([
    response.headerValue('content-type'),
    response.headerValue('content-length'),
  ]);
  const mediaType = typeof contentType === 'string'
    ? contentType.split(';', 1)[0].trim().toLowerCase()
    : '';
  const normalizedContentLength = typeof rawContentLength === 'string'
    ? rawContentLength.trim()
    : '';
  const contentLength = /^[0-9]+$/.test(normalizedContentLength)
    ? Number(normalizedContentLength)
    : Number.NaN;
  if (
    mediaType !== 'application/json'
    || !Number.isSafeInteger(contentLength)
    || contentLength > maxBytes
  ) {
    throw new Error('UI_PROBE_UNAVAILABLE');
  }
  const body = await response.body();
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
  if (bytes.byteLength > maxBytes) throw new Error('UI_PROBE_UNAVAILABLE');
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    return null;
  }
}

function isExactCheckoutResponse(response, baseUrl) {
  try {
    const responseUrl = new URL(response.url());
    return responseUrl.origin === baseUrl
      && responseUrl.pathname === '/api/checkout'
      && responseUrl.search === ''
      && responseUrl.hash === ''
      && response.request().method() === 'POST';
  } catch {
    return false;
  }
}

async function loadPlaywright(playwrightModule) {
  if (!playwrightModule) throw new Error('NUANU_QA_PLAYWRIGHT_MODULE is required for UI mode');
  const specifier = isAbsolute(playwrightModule) ? pathToFileURL(playwrightModule).href : playwrightModule;
  const loaded = await import(specifier);
  const chromium = loaded.chromium ?? loaded.default?.chromium;
  if (!chromium?.connectOverCDP) throw new Error('The configured Playwright module has no chromium.connectOverCDP');
  return chromium;
}

export async function withIsolatedBrowserPage(browser, callback) {
  try {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      return await callback(page);
    } finally {
      await context.close();
    }
  } finally {
    // For a connectOverCDP client this closes the transport handle, not the
    // worker-owned browser process. Without it the one-shot CLI stays alive.
    await browser.close();
  }
}

async function executeUi({ fetchImpl, baseUrl, runId, environment }) {
  const cdpUrl = environment.NUANU_QA_BROWSER_CDP_URL;
  if (!cdpUrl) throw new Error('NUANU_QA_BROWSER_CDP_URL is required for UI mode');
  const chromium = await loadPlaywright(environment.NUANU_QA_PLAYWRIGHT_MODULE);
  const browser = await chromium.connectOverCDP(cdpUrl);
  return withIsolatedBrowserPage(browser, async (page) => {
    const targetUrl = new URL(`${baseUrl}/?runId=${encodeURIComponent(runId)}`);
    await page.goto(targetUrl.href);
    const finalUrl = new URL(page.url());
    if (
      finalUrl.origin !== targetUrl.origin
      || finalUrl.pathname !== targetUrl.pathname
      || finalUrl.search !== targetUrl.search
    ) {
      throw new Error('UI_NAVIGATION_OUT_OF_SCOPE');
    }
    const bank = page.getByLabel('Bank transfer');
    await bank.check();
    const selectedPaymentMethod = await bank.isChecked() ? 'bank' : 'unknown';
    const responsePromise = page.waitForResponse((response) => isExactCheckoutResponse(response, baseUrl));
    await page.getByRole('button', { name: 'Pay $10.00' }).click();
    const response = await responsePromise;
    const requestBody = response.request().postDataJSON();
    const responseBody = await playwrightResponseJson(response);
    const receipt = page.getByRole('status').filter({ hasText: /Payment (recorded|could not)/ });
    await receipt.waitFor({ state: 'visible' });
    const receiptText = (await receipt.textContent())?.trim() ?? '';
    const observation = {
      selectedPaymentMethod,
      requestPaymentMethod: requestBody?.paymentMethod ?? null,
      receiptText,
      responseStatus: response.status(),
      responseBody,
    };
    return {
      classification: classifyUi(observation),
      observed: uiObservationEvidence(observation),
    };
  });
}

function errorObservation(error) {
  const errorName = error instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name)
    ? error.name
    : 'Error';
  const message = error instanceof Error ? error.message : String(error);
  const causeCode = error instanceof Error ? error.cause?.code : undefined;
  const safeNetworkCodes = new Set(['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT']);
  const errorCode = errorName === 'TimeoutError'
    ? 'REQUEST_TIMEOUT'
    : message === 'UI_PROBE_UNAVAILABLE'
      ? 'UI_PROBE_UNAVAILABLE'
    : message === 'RESPONSE_BODY_TOO_LARGE'
      ? 'RESPONSE_BODY_TOO_LARGE'
      : safeNetworkCodes.has(causeCode)
        ? causeCode
        : 'PROBE_EXECUTION_ERROR';
  return {
    error_name: errorName,
    error_code: errorCode,
    error_fingerprint: sha256(message),
  };
}

async function finalizedResult({ mode, classification, occurrence, evidenceDirectory }) {
  const result = buildProbeResult({ mode, classification, occurrence });
  return writeEvidence({ result, evidenceDirectory });
}

export async function runProbe({
  mode,
  baseUrl,
  expectedBuild,
  runId,
  evidenceDirectory,
  fetchImpl = globalThis.fetch,
  environment = process.env,
  requestTimeoutMs = 10_000,
}) {
  validateExpectedBuild(expectedBuild);
  if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs < 1 || requestTimeoutMs > 120_000) {
    throw new TypeError('requestTimeoutMs must be an integer between 1 and 120000');
  }
  const boundedFetch = (url, options = {}) => fetchImpl(url, {
    ...options,
    redirect: 'error',
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl, environment);
  const targetRunId = branchTargetRunId(runId, mode);
  const occurrenceBase = {
    run_id: runId,
    target_run_id: targetRunId,
    base_url: normalizedBaseUrl,
    expected_build: expectedBuild,
    actual_build: null,
  };

  try {
    const buildResponse = await requestJson(boundedFetch, endpoint(normalizedBaseUrl, '/build-info'));
    if (buildResponse.status !== 200 || !buildResponse.body || Array.isArray(buildResponse.body)) {
      return finalizedResult({
        mode,
        classification: infrastructureFailure('BUILD_INFO_UNAVAILABLE'),
        occurrence: { ...occurrenceBase, observed: { build_info: buildInfoEvidence(buildResponse) } },
        evidenceDirectory,
      });
    }
    occurrenceBase.actual_build = buildInfoEvidence(buildResponse).body;
    const buildClassification = classifyBuildIdentity({ expected: expectedBuild, actual: buildResponse.body });
    if (buildClassification) {
      return finalizedResult({
        mode,
        classification: buildClassification,
        occurrence: { ...occurrenceBase, observed: { build_info: buildInfoEvidence(buildResponse) } },
        evidenceDirectory,
      });
    }

    const reset = await resetRun({ fetchImpl: boundedFetch, baseUrl: normalizedBaseUrl, runId: targetRunId });
    const exactReset = reset.status === 200
      && reset.body
      && typeof reset.body === 'object'
      && !Array.isArray(reset.body)
      && Object.keys(reset.body).sort().join(',') === 'reset,runId'
      && reset.body.reset === true
      && reset.body.runId === targetRunId;
    if (!exactReset) {
      return finalizedResult({
        mode,
        classification: infrastructureFailure('RESET_FAILED'),
        occurrence: { ...occurrenceBase, observed: { reset: resetResponseEvidence(reset) } },
        evidenceDirectory,
      });
    }

    const execution = mode === 'amount'
      ? await executeAmount({ fetchImpl: boundedFetch, baseUrl: normalizedBaseUrl, runId: targetRunId })
      : mode === 'idempotency'
        ? await executeIdempotency({ fetchImpl: boundedFetch, baseUrl: normalizedBaseUrl, runId: targetRunId })
        : mode === 'ui'
          ? await executeUi({ fetchImpl: boundedFetch, baseUrl: normalizedBaseUrl, runId: targetRunId, environment })
          : (() => { throw new TypeError(`Unsupported probe mode: ${mode}`); })();
    return finalizedResult({
      mode,
      classification: execution.classification,
      occurrence: {
        ...occurrenceBase,
        observed: { reset: resetResponseEvidence(reset), probe: execution.observed },
      },
      evidenceDirectory,
    });
  } catch (error) {
    const observedError = errorObservation(error);
    const uiProbeUnavailable = mode === 'ui' && observedError.error_code === 'UI_PROBE_UNAVAILABLE';
    return finalizedResult({
      mode,
      classification: uiProbeUnavailable
        ? infrastructureFailure('UI_PROBE_UNAVAILABLE')
        : infrastructureFailure('PROBE_EXECUTION_ERROR', 'UNVERIFIED'),
      occurrence: { ...occurrenceBase, observed: observedError },
      evidenceDirectory,
    });
  }
}

export function toNuanuAgentTaskEnvelope({ itemKey, result }) {
  const build = result.occurrence.actual_build ?? {};
  const probePayload = canonicalProbePayload(result);
  const data = {
    observed: canonicalJson(result.occurrence.observed),
    confidence: result.axes.confidence,
    build_commit: typeof build.commit === 'string' ? build.commit : '',
    build_variant: typeof build.variant === 'string' ? build.variant : '',
    product_result: result.axes.product_result,
    evidence_sha256: sha256(probePayload),
    evidence_status: result.axes.evidence_status,
    build_content_hash: typeof build.contentHash === 'string' ? build.contentHash : '',
    environment_status: result.axes.environment_status,
    finding_fingerprint: result.defect_key ?? '',
    contract_id: result.contract_id,
    failure_code: result.code,
    defect_key: result.defect_key ?? '',
    occurrence_key: result.occurrence_key,
    probe_payload: probePayload,
  };
  return {
    item: {
      key: itemKey,
      description: `PayDemo ${result.probe}: ${result.axes.product_result} (${result.code})`,
      data,
      artifacts: {},
    },
    artifact_outputs: {
      'item.artifacts.evidence_report': null,
    },
  };
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (!name.startsWith('--')) throw new TypeError(`Unexpected argument: ${name}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new TypeError(`Missing value for ${name}`);
    const key = name.slice(2);
    if (Object.hasOwn(values, key)) throw new TypeError(`Duplicate argument: --${key}`);
    values[key] = value;
    index += 1;
  }
  return values;
}

function required(values, key) {
  const value = values[key];
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(`--${key} is required`);
  return value;
}

export function parseCliArguments(argv, environment = process.env) {
  const values = parseArguments(argv);
  const allowedArguments = new Set([
    'mode',
    'base-url',
    'run-id',
    'item-key',
    'expected-variant',
    'expected-commit',
    'expected-content-hash',
    'expected-environment-id',
    'expected-instance-nonce',
    'evidence-dir',
  ]);
  for (const key of Object.keys(values)) {
    if (!allowedArguments.has(key)) throw new TypeError(`Unsupported argument: --${key}`);
  }
  const mode = required(values, 'mode');
  if (!MODE_CONTRACTS[mode]) throw new TypeError(`Unsupported --mode: ${mode}`);
  const runId = required(values, 'run-id');
  if (!/^[a-z0-9-]{1,64}$/.test(runId)) throw new TypeError('--run-id must match ^[a-z0-9-]{1,64}$');
  const itemKey = required(values, 'item-key');
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(itemKey)) {
    throw new TypeError('--item-key must match ^[a-z][a-z0-9_]{0,63}$');
  }
  if (itemKey !== MODE_ITEM_KEYS[mode]) {
    throw new TypeError(`--item-key must be ${MODE_ITEM_KEYS[mode]} for --mode ${mode}`);
  }
  return {
    itemKey,
    probeOptions: {
      mode,
      baseUrl: required(values, 'base-url'),
      runId,
      expectedBuild: {
        app: PRODUCT,
        variant: required(values, 'expected-variant'),
        commit: required(values, 'expected-commit'),
        contentHash: required(values, 'expected-content-hash'),
        environmentId: required(values, 'expected-environment-id'),
        instanceNonce: required(values, 'expected-instance-nonce'),
      },
      evidenceDirectory: values['evidence-dir'] ?? environment.NUANU_TASK_DIR ?? 'artifacts/paydemo-probe',
      environment,
    },
  };
}

export async function main(argv = process.argv.slice(2), environment = process.env) {
  const { itemKey, probeOptions } = parseCliArguments(argv, environment);
  const result = await runProbe(probeOptions);
  const envelope = toNuanuAgentTaskEnvelope({ itemKey, result });
  process.stdout.write(`${JSON.stringify(envelope)}\n`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
