#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const PRODUCT_RESULTS = new Set(['PASS', 'FAIL', 'INCONCLUSIVE']);
const ENVIRONMENT_STATUSES = new Set(['HEALTHY', 'INFRA_FAILURE']);
const EVIDENCE_STATUSES = new Set(['VERIFIED', 'PARTIAL']);
const RECOMMENDATIONS = new Set(['no_findings', 'accept_findings', 'human_review']);
const SHA_256 = /^sha256:[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const IDENTIFIER = /^[a-z0-9][a-z0-9-]{0,63}$/;

function nonEmptyString(value, maximum = 4_096) {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum;
}

function isFiniteUnit(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateSynthesis(input) {
  const item = input?.synthesize_qa;
  const data = item?.data;
  if (
    item?.key !== 'synthesize_qa'
    || item?.outcome?.status !== 'completed'
    || data === null
    || typeof data !== 'object'
    || Array.isArray(data)
    || !PRODUCT_RESULTS.has(data.overall_product_result)
    || !ENVIRONMENT_STATUSES.has(data.overall_environment_status)
    || !EVIDENCE_STATUSES.has(data.overall_evidence_status)
    || !RECOMMENDATIONS.has(data.recommendation)
    || !isFiniteUnit(data.min_confidence)
    || !Number.isSafeInteger(data.finding_count)
    || data.finding_count < 0
    || !nonEmptyString(data.summary, 1_024)
    || typeof data.instance_nonce !== 'string'
  ) {
    throw new TypeError('Invalid synthesis contract for deterministic QA routing');
  }
  return data;
}

function hasExactBuild(data) {
  return ['buggy-v1', 'fixed-v2'].includes(data.build_variant)
    && COMMIT.test(data.build_commit)
    && SHA_256.test(data.build_content_hash)
    && IDENTIFIER.test(data.environment_id)
    && UUID_V4.test(data.instance_nonce)
    && nonEmptyString(data.source_run_id, 128);
}

function cleanVerifiedPass(data) {
  return data.overall_product_result === 'PASS'
    && data.overall_environment_status === 'HEALTHY'
    && data.overall_evidence_status === 'VERIFIED'
    && data.recommendation === 'no_findings'
    && data.finding_count === 0
    && data.min_confidence === 1
    && hasExactBuild(data);
}

function routeReason(data, targetState) {
  if (targetState === 'ready_for_production') {
    return 'Все 3 проверки пройдены на точной сборке, доказательства подтверждены.';
  }
  if (data.overall_product_result === 'FAIL' && data.finding_count > 0) {
    return `Подтверждено дефектов: ${data.finding_count}; тикет возвращён в разработку.`;
  }
  if (data.overall_product_result === 'INCONCLUSIVE'
    || data.overall_environment_status === 'INFRA_FAILURE'
    || data.overall_evidence_status !== 'VERIFIED') {
    return 'Результат неопределён: среда или доказательства неполны; требуется устранить причину и повторить проверку.';
  }
  return 'Условия автоматического завершения не выполнены; тикет возвращён в разработку.';
}

export function routeQa(input) {
  const data = validateSynthesis(input);
  const targetState = cleanVerifiedPass(data) ? 'ready_for_production' : 'in_progress';
  return {
    ...data,
    target_state: targetState,
    route_reason: routeReason(data, targetState),
  };
}

export function toNuanuAgentTaskEnvelope(input) {
  const data = routeQa(input);
  return {
    item: {
      key: 'route_qa_result',
      description: `Маршрут QA: ${data.target_state}; ${data.route_reason}`,
      data,
      artifacts: {},
    },
    artifact_outputs: {
      'item.artifacts.review_bundle': null,
    },
  };
}

async function main(argv) {
  if (argv.length !== 1) throw new TypeError('Usage: paydemo-qah-route.mjs <synthesis-input.json>');
  const input = JSON.parse(await readFile(argv[0], 'utf8'));
  process.stdout.write(`${JSON.stringify(toNuanuAgentTaskEnvelope(input))}\n`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
