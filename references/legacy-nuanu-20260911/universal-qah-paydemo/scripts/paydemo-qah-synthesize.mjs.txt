#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const BRANCH_KEYS = [
  'check_amount_integrity',
  'check_idempotency',
  'check_ui_api_consistency',
];
const BRANCH_CONTRACTS = Object.freeze({
  check_amount_integrity: 'available-balance-v1',
  check_idempotency: 'transfer-idempotency-v1',
  check_ui_api_consistency: 'status-consistency-v1',
});
const BRANCH_MODES = Object.freeze({
  check_amount_integrity: 'amount',
  check_idempotency: 'idempotency',
  check_ui_api_consistency: 'ui',
});
const COMMON_INFRA_CODES = [
  'BUILD_INFO_UNAVAILABLE',
  'BUILD_IDENTITY_MISMATCH',
  'PROBE_EXECUTION_ERROR',
  'RESET_FAILED',
];
const BRANCH_OUTCOMES = Object.freeze({
  check_amount_integrity: {
    PASS: new Set(['AMOUNT_REJECTED']),
    FAIL: new Set(['AMOUNT_MISMATCH_ACCEPTED']),
    INCONCLUSIVE: new Set([...COMMON_INFRA_CODES, 'AMOUNT_PROBE_UNAVAILABLE']),
  },
  check_idempotency: {
    PASS: new Set(['IDEMPOTENT_REPLAY']),
    FAIL: new Set(['DUPLICATE_PAYMENT_IDS', 'IDEMPOTENCY_CONTRACT_VIOLATION']),
    INCONCLUSIVE: new Set([...COMMON_INFRA_CODES, 'IDEMPOTENCY_PROBE_UNAVAILABLE']),
  },
  check_ui_api_consistency: {
    PASS: new Set(['BANK_TRANSFER_CONFIRMED']),
    FAIL: new Set(['BANK_SHOWN_AS_CARD', 'BANK_UI_CONTRACT_VIOLATION']),
    INCONCLUSIVE: new Set([...COMMON_INFRA_CODES, 'UI_PROBE_UNAVAILABLE']),
  },
});

const PRODUCT_RESULTS = new Set(['PASS', 'FAIL', 'INCONCLUSIVE']);
const ENVIRONMENT_STATUSES = new Set(['HEALTHY', 'INFRA_FAILURE']);
const EVIDENCE_STATUSES = new Set(['VERIFIED', 'PARTIAL', 'UNVERIFIED']);
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const GIT_COMMIT_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const BUILD_VARIANT_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const INSTANCE_NONCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ENVIRONMENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

function nonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Canonical JSON does not support non-finite numbers');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalJson(entry)).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`
    )).join(',')}}`;
  }
  throw new TypeError(`Canonical JSON does not support ${typeof value}`);
}

const sha256 = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

function branchTargetRunId(runId, mode) {
  const candidate = `${runId}-${mode}`;
  if (candidate.length <= 64) return candidate;
  const digest = createHash('sha256').update(`${runId}:${mode}`).digest('hex').slice(0, 32);
  return `qah-${mode}-${digest}`;
}

function expectedDefectKey(branchKey, code) {
  return sha256(canonicalJson({
    schema: 'qah-defect-key/v1',
    product: 'PayDemo',
    probe: BRANCH_MODES[branchKey],
    contract: BRANCH_CONTRACTS[branchKey],
    code,
  }));
}

function expectedDefectIdentity(branchKey, code) {
  return {
    schema: 'qah-defect-key/v1',
    product: 'PayDemo',
    probe: BRANCH_MODES[branchKey],
    contract: BRANCH_CONTRACTS[branchKey],
    code,
  };
}

function exactKeys(value, expected) {
  return value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === [...expected].sort().join(',');
}

function validBuildIdentity(build) {
  return build?.app === 'PayDemo'
    && BUILD_VARIANT_PATTERN.test(build.variant)
    && GIT_COMMIT_PATTERN.test(build.commit)
    && SHA256_PATTERN.test(build.contentHash)
    && ENVIRONMENT_ID_PATTERN.test(build.environmentId)
    && INSTANCE_NONCE_PATTERN.test(build.instanceNonce);
}

function validateProbePayload(data, expectedKey) {
  if (typeof data.probe_payload !== 'string' || data.probe_payload.length < 2 || data.probe_payload.length > 50_000) {
    return null;
  }
  try {
    const payload = JSON.parse(data.probe_payload);
    if (
      canonicalJson(payload) !== data.probe_payload
      || sha256(data.probe_payload) !== data.evidence_sha256
      || !exactKeys(payload, [
        'schema_version',
        'probe',
        'contract_id',
        'axes',
        'code',
        'defect_key',
        'defect_identity',
        'occurrence_key',
        'occurrence',
      ])
      || payload.schema_version !== 'qah.probe-result.v1'
      || payload.probe !== BRANCH_MODES[expectedKey]
      || payload.contract_id !== BRANCH_CONTRACTS[expectedKey]
      || payload.code !== data.failure_code
      || payload.occurrence_key !== data.occurrence_key
      || payload.axes?.product_result !== data.product_result
      || payload.axes?.environment_status !== data.environment_status
      || payload.axes?.evidence_status !== data.evidence_status
      || payload.axes?.confidence !== data.confidence
    ) return null;

    const projectedDefect = nonEmptyString(data.defect_key) ? data.defect_key : null;
    if (payload.defect_key !== projectedDefect) return null;
    if (projectedDefect) {
      const identity = expectedDefectIdentity(expectedKey, data.failure_code);
      if (
        projectedDefect !== sha256(canonicalJson(identity))
        || canonicalJson(payload.defect_identity) !== canonicalJson(identity)
      ) return null;
    } else if (payload.defect_identity !== null) {
      return null;
    }

    const occurrence = payload.occurrence;
    if (!exactKeys(occurrence, [
      'run_id',
      'target_run_id',
      'base_url',
      'expected_build',
      'actual_build',
      'observed',
    ])) return null;
    const expectedBuild = occurrence.expected_build;
    const actualBuild = occurrence.actual_build;
    let baseUrl;
    try {
      baseUrl = new URL(occurrence.base_url);
    } catch {
      return null;
    }
    const originOnly = ['http:', 'https:'].includes(baseUrl.protocol)
      && !baseUrl.username
      && !baseUrl.password
      && baseUrl.pathname === '/'
      && !baseUrl.search
      && !baseUrl.hash
      && occurrence.base_url === baseUrl.origin;
    if (
      !nonEmptyString(occurrence.run_id)
      || !nonEmptyString(occurrence.target_run_id)
      || occurrence.target_run_id !== branchTargetRunId(occurrence.run_id, BRANCH_MODES[expectedKey])
      || !originOnly
      || !validBuildIdentity(expectedBuild)
      || !validBuildIdentity(actualBuild)
      || !['app', 'variant', 'commit', 'contentHash', 'environmentId', 'instanceNonce']
        .every((key) => actualBuild[key] === expectedBuild[key])
      || actualBuild.unexpected_field_count !== 0
      || actualBuild.unexpected_field_names_sha256 !== null
      || data.build_variant !== actualBuild.variant
      || data.build_commit !== actualBuild.commit
      || data.build_content_hash !== actualBuild.contentHash
      || canonicalJson(occurrence.observed) !== data.observed
    ) return null;

    const expectedOccurrenceKey = sha256(canonicalJson({
      schema: 'qah-occurrence/v1',
      product: 'PayDemo',
      probe: BRANCH_MODES[expectedKey],
      contract: BRANCH_CONTRACTS[expectedKey],
      defect_key: projectedDefect,
      occurrence,
    }));
    if (expectedOccurrenceKey !== data.occurrence_key) return null;
    return {
      observed: occurrence.observed,
      occurrence,
      runId: occurrence.run_id,
      environmentId: actualBuild.environmentId,
      instanceNonce: actualBuild.instanceNonce,
    };
  } catch {
    return null;
  }
}

function parseObservation(value) {
  if (typeof value !== 'string' || value.length < 2 || value.length > 20_000) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function unexpectedFieldCount(body) {
  if (Number.isSafeInteger(body?.unexpected_field_count) && body.unexpected_field_count >= 0) {
    return body.unexpected_field_count;
  }
  return Array.isArray(body?.unexpected_fields) ? body.unexpected_fields.length : Number.POSITIVE_INFINITY;
}

function validPaymentEvidence(body) {
  return body
    && typeof body === 'object'
    && !Array.isArray(body)
    && (body.payment_id_sha256 === null || SHA256_PATTERN.test(body.payment_id_sha256))
    && (body.amount_cents === null || Number.isSafeInteger(body.amount_cents))
    && (body.payment_method === null || ['card', 'bank'].includes(body.payment_method))
    && (body.error_code === null || /^[A-Z][A-Z0-9_]{0,63}$/.test(body.error_code))
    && SHA256_PATTERN.test(body.semantic_sha256)
    && unexpectedFieldCount(body) === 0;
}

function semanticOutcome(branchKey, observed, occurrence) {
  const resetBody = observed?.reset?.body;
  if (
    observed?.reset?.status !== 200
    || resetBody?.reset !== true
    || resetBody.run_id_sha256 !== sha256(occurrence.target_run_id)
    || unexpectedFieldCount(resetBody) !== 0
  ) {
    return { productResult: 'INCONCLUSIVE', code: 'RESET_FAILED' };
  }

  const probe = observed.probe;
  if (branchKey === 'check_amount_integrity') {
    if (
      probe?.status === 422
      && validPaymentEvidence(probe.body)
      && probe.body.error_code === 'AMOUNT_MISMATCH'
      && probe.body.payment_id_sha256 === null
      && probe.body.amount_cents === null
      && probe.body.payment_method === null
    ) {
      return { productResult: 'PASS', code: 'AMOUNT_REJECTED' };
    }
    if (Number.isSafeInteger(probe?.status) && probe.status >= 200 && probe.status < 300) {
      return { productResult: 'FAIL', code: 'AMOUNT_MISMATCH_ACCEPTED' };
    }
    return { productResult: 'INCONCLUSIVE', code: 'AMOUNT_PROBE_UNAVAILABLE' };
  }

  if (branchKey === 'check_idempotency') {
    const first = probe?.first;
    const second = probe?.second;
    const successful = [first?.status, second?.status].every(
      (status) => Number.isSafeInteger(status) && status >= 200 && status < 300,
    );
    if (!successful || !validPaymentEvidence(first?.body) || !validPaymentEvidence(second?.body)) {
      return { productResult: 'INCONCLUSIVE', code: 'IDEMPOTENCY_PROBE_UNAVAILABLE' };
    }

    const firstId = first?.body?.payment_id_sha256;
    const secondId = second?.body?.payment_id_sha256;
    if (SHA256_PATTERN.test(firstId) && SHA256_PATTERN.test(secondId) && firstId !== secondId) {
      return { productResult: 'FAIL', code: 'DUPLICATE_PAYMENT_IDS' };
    }

    const statuses = [first.status, second.status].sort((left, right) => left - right);
    const exactReplay = statuses[0] === 200
      && statuses[1] === 201
      && SHA256_PATTERN.test(firstId)
      && firstId === secondId
      && first.body?.amount_cents === 1000
      && second.body?.amount_cents === 1000
      && first.body?.payment_method === 'card'
      && second.body?.payment_method === 'card'
      && SHA256_PATTERN.test(first.body?.semantic_sha256)
      && first.body.semantic_sha256 === second.body?.semantic_sha256
      && unexpectedFieldCount(first.body) === 0
      && unexpectedFieldCount(second.body) === 0;
    return exactReplay
      ? { productResult: 'PASS', code: 'IDEMPOTENT_REPLAY' }
      : { productResult: 'FAIL', code: 'IDEMPOTENCY_CONTRACT_VIOLATION' };
  }

  if (branchKey === 'check_ui_api_consistency') {
    const status = probe?.response_status;
    if (!Number.isSafeInteger(status) || status < 200 || status >= 300) {
      return { productResult: 'INCONCLUSIVE', code: 'UI_PROBE_UNAVAILABLE' };
    }
    const backend = probe.backend_response;
    const validBackend = backend?.status === status && validPaymentEvidence(backend.body);
    if (
      validBackend
      &&
      probe.selected_payment_method === 'bank'
      && probe.request_payment_method === 'bank'
      && status === 201
      && probe.receipt_code === 'BANK_RECORDED'
      && SHA256_PATTERN.test(backend.body.payment_id_sha256)
      && backend.body.amount_cents === 1000
      && backend.body.payment_method === 'bank'
      && backend.body.error_code === null
    ) {
      return { productResult: 'PASS', code: 'BANK_TRANSFER_CONFIRMED' };
    }
    if (
      probe.selected_payment_method === 'bank'
      && (probe.request_payment_method !== 'bank' || probe.receipt_code === 'CARD_RECORDED')
    ) {
      return { productResult: 'FAIL', code: 'BANK_SHOWN_AS_CARD' };
    }
    return { productResult: 'FAIL', code: 'BANK_UI_CONTRACT_VIOLATION' };
  }
  return null;
}

function hasVersionedEvidence(item) {
  const evidence = item?.artifacts?.evidence_report;
  return evidence?.kind === 'document'
    && evidence.role === 'output'
    && evidence.media_type === 'text/markdown'
    && UUID_PATTERN.test(evidence.artifact_id)
    && UUID_PATTERN.test(evidence.version_id);
}

function validObservation(value) {
  return parseObservation(value) !== null;
}

function normalizeBranch(item, expectedKey) {
  if (
    !item
    || typeof item !== 'object'
    || item.key !== expectedKey
    || item.outcome?.status !== 'completed'
  ) {
    return { valid: false, confidence: 0 };
  }

  const data = item.data;
  if (!data || typeof data !== 'object') return { valid: false, confidence: 0 };

  const confidence = data.confidence;
  const payloadBinding = validateProbePayload(data, expectedKey);
  const observed = payloadBinding?.observed ?? null;
  const independentlyDerived = observed
    ? semanticOutcome(expectedKey, observed, payloadBinding.occurrence)
    : null;
  const outcomeCodeIsAllowed = BRANCH_OUTCOMES[expectedKey]?.[data.product_result]?.has(data.failure_code) === true;
  const confidenceIsExact = data.product_result === 'PASS'
    ? confidence === 1
    : data.product_result === 'FAIL'
      ? confidence === 0.99
      : confidence === 0.99 || confidence === 1;
  const hasDefect = SHA256_PATTERN.test(data.defect_key)
    && data.finding_fingerprint === data.defect_key
    && data.defect_key === expectedDefectKey(expectedKey, data.failure_code);
  const hasNoDefect = !nonEmptyString(data.defect_key)
    && !nonEmptyString(data.finding_fingerprint);
  const resultIsConsistent = data.product_result === 'FAIL'
    ? data.environment_status === 'HEALTHY' && data.evidence_status === 'VERIFIED' && hasDefect
    : data.product_result === 'PASS'
      ? data.environment_status === 'HEALTHY' && data.evidence_status === 'VERIFIED' && hasNoDefect
      : data.product_result === 'INCONCLUSIVE'
        && data.environment_status === 'INFRA_FAILURE'
        && hasNoDefect;
  const evidenceIsConsistent = data.evidence_status === 'VERIFIED'
    ? SHA256_PATTERN.test(data.evidence_sha256) && hasVersionedEvidence(item)
    : !nonEmptyString(data.evidence_sha256) || SHA256_PATTERN.test(data.evidence_sha256);
  const valid = PRODUCT_RESULTS.has(data.product_result)
    && ENVIRONMENT_STATUSES.has(data.environment_status)
    && EVIDENCE_STATUSES.has(data.evidence_status)
    && resultIsConsistent
    && evidenceIsConsistent
    && payloadBinding !== null
    && outcomeCodeIsAllowed
    && independentlyDerived?.productResult === data.product_result
    && independentlyDerived?.code === data.failure_code
    && confidenceIsExact
    && data.contract_id === BRANCH_CONTRACTS[expectedKey]
    && /^[A-Z][A-Z0-9_]{1,63}$/.test(data.failure_code)
    && SHA256_PATTERN.test(data.occurrence_key)
    && validObservation(data.observed)
    && typeof confidence === 'number'
    && Number.isFinite(confidence)
    && confidence >= 0
    && confidence <= 1
    && BUILD_VARIANT_PATTERN.test(data.build_variant)
    && GIT_COMMIT_PATTERN.test(data.build_commit)
    && SHA256_PATTERN.test(data.build_content_hash);

  if (!valid) return { valid: false, confidence: 0 };

  return {
    valid: true,
    confidence,
    productResult: data.product_result,
    environmentStatus: data.environment_status,
    evidenceStatus: data.evidence_status,
    defectKey: nonEmptyString(data.defect_key) ? data.defect_key : null,
    evidenceVersionId: item.artifacts?.evidence_report?.version_id ?? null,
    runId: payloadBinding.runId,
    build: {
      variant: data.build_variant,
      commit: data.build_commit,
      contentHash: data.build_content_hash,
      environmentId: payloadBinding.environmentId,
      instanceNonce: payloadBinding.instanceNonce,
    },
  };
}

function sameBuild(left, right) {
  return left.variant === right.variant
    && left.commit === right.commit
    && left.contentHash === right.contentHash
    && left.environmentId === right.environmentId
    && left.instanceNonce === right.instanceNonce;
}

function sourceEvidenceLineage(source) {
  const fields = {};
  const prefixes = {
    check_amount_integrity: 'amount',
    check_idempotency: 'idempotency',
    check_ui_api_consistency: 'ui',
  };
  for (const [key, prefix] of Object.entries(prefixes)) {
    const evidence = source[key]?.artifacts?.evidence_report;
    const valid = evidence?.kind === 'document'
      && evidence.role === 'output'
      && evidence.media_type === 'text/markdown'
      && UUID_PATTERN.test(evidence.artifact_id)
      && UUID_PATTERN.test(evidence.version_id);
    fields[`${prefix}_evidence_artifact_id`] = valid ? evidence.artifact_id : '';
    fields[`${prefix}_evidence_version_id`] = valid ? evidence.version_id : '';
  }
  return fields;
}

export function synthesizeQa(input) {
  const source = input && typeof input === 'object' ? input : {};
  const lineage = sourceEvidenceLineage(source);
  const normalizedBranches = BRANCH_KEYS.map((key) => normalizeBranch(source[key], key));
  const evidenceVersionCounts = new Map();
  for (const branch of normalizedBranches) {
    if (!branch.valid || !branch.evidenceVersionId) continue;
    evidenceVersionCounts.set(
      branch.evidenceVersionId,
      (evidenceVersionCounts.get(branch.evidenceVersionId) ?? 0) + 1,
    );
  }
  const branches = normalizedBranches.map((branch) => (
    branch.valid
      && branch.evidenceVersionId
      && evidenceVersionCounts.get(branch.evidenceVersionId) > 1
      ? { valid: false, confidence: 0 }
      : branch
  ));
  const validBranches = branches.filter((branch) => branch.valid);
  const referenceBuild = validBranches[0]?.build ?? null;
  const referenceRunId = validBranches[0]?.runId ?? null;
  const buildMismatch = validBranches.some(
    (branch) => referenceBuild && !sameBuild(referenceBuild, branch.build),
  );
  const runMismatch = validBranches.some(
    (branch) => referenceRunId && branch.runId !== referenceRunId,
  );
  const exactRunId = referenceRunId && !runMismatch && validBranches.length === BRANCH_KEYS.length
    ? referenceRunId
    : null;
  const exactAvailableBuild = referenceBuild
    && !buildMismatch
    && !runMismatch
    && validBranches.length === BRANCH_KEYS.length
    ? referenceBuild
    : null;

  const verifiedFailures = validBranches.filter(
    (branch) => branch.productResult === 'FAIL'
      && branch.environmentStatus === 'HEALTHY'
      && branch.evidenceStatus === 'VERIFIED',
  );
  const cleanPass = branches.every(
    (branch) => branch.valid
      && branch.productResult === 'PASS'
      && branch.environmentStatus === 'HEALTHY'
      && branch.evidenceStatus === 'VERIFIED',
  ) && !buildMismatch && !runMismatch;

  const overallProductResult = verifiedFailures.length > 0
    ? 'FAIL'
    : cleanPass
      ? 'PASS'
      : 'INCONCLUSIVE';
  const hasInfrastructureFailure = branches.some(
    (branch) => !branch.valid || branch.environmentStatus === 'INFRA_FAILURE',
  ) || buildMismatch || runMismatch;
  const overallEnvironmentStatus = hasInfrastructureFailure ? 'INFRA_FAILURE' : 'HEALTHY';
  const overallEvidenceStatus = branches.every(
    (branch) => branch.valid && branch.evidenceStatus === 'VERIFIED',
  ) ? 'VERIFIED' : 'PARTIAL';
  const minConfidence = Math.min(...branches.map((branch) => branch.confidence));
  const findingCount = new Set(
    verifiedFailures
      .map((branch) => branch.defectKey)
      .filter((defectKey) => defectKey !== null),
  ).size;
  const recommendation = cleanPass
    ? 'no_findings'
    : verifiedFailures.length > 0 && !hasInfrastructureFailure
      ? 'accept_findings'
      : 'human_review';
  const passCount = validBranches.filter((branch) => branch.productResult === 'PASS').length;
  const summary = `${validBranches.length}/3 веток завершены; PASS=${passCount}; FAIL=${verifiedFailures.length}; сбои=${3 - validBranches.length}; уникальные дефекты=${findingCount}.`;

  return {
    overall_product_result: overallProductResult,
    overall_environment_status: overallEnvironmentStatus,
    overall_evidence_status: overallEvidenceStatus,
    min_confidence: minConfidence,
    finding_count: findingCount,
    build_variant: exactAvailableBuild?.variant ?? '',
    build_commit: exactAvailableBuild?.commit ?? '',
    build_content_hash: exactAvailableBuild?.contentHash ?? '',
    environment_id: exactAvailableBuild?.environmentId ?? '',
    instance_nonce: exactAvailableBuild?.instanceNonce ?? '',
    source_run_id: exactRunId ?? '',
    ...lineage,
    recommendation,
    summary,
  };
}

export function toNuanuAgentTaskEnvelope(input) {
  const data = synthesizeQa(input);
  return {
    item: {
      key: 'synthesize_qa',
      description: `Сводка QA: ${data.overall_product_result}; ${data.recommendation}.`,
      data,
      artifacts: {},
    },
    artifact_outputs: {
      'item.artifacts.review_bundle': null,
    },
  };
}

async function main(argv) {
  if (argv.length !== 1) throw new TypeError('Usage: paydemo-qah-synthesize.mjs <input.json>');
  const input = JSON.parse(await readFile(argv[0], 'utf8'));
  process.stdout.write(`${JSON.stringify(toNuanuAgentTaskEnvelope(input))}\n`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
