#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function exactKeys(value, keys) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}

function completed(item, key) {
  return item?.key === key && item?.outcome?.status === 'completed';
}

function validCleanup(item, key) {
  return completed(item, key)
    && exactKeys(item.data, ['environment_id', 'environment_status', 'pid_file'])
    && typeof item.data.environment_id === 'string'
    && item.data.environment_id.length > 0
    && ['STOPPED', 'ABSENT'].includes(item.data.environment_status)
    && typeof item.data.pid_file === 'string'
    && item.data.pid_file.length > 0;
}

function humanDecision(item, key) {
  if (!completed(item, key) || !exactKeys(item.data, ['accepted', 'decision', 'review_note'])) return null;
  const { accepted, decision, review_note: reviewNote } = item.data;
  if (
    typeof accepted !== 'boolean'
    || typeof decision !== 'string'
    || decision.length === 0
    || decision.length > 64
    || typeof reviewNote !== 'string'
    || reviewNote.trim().length === 0
    || reviewNote.length > 1_024
  ) return null;
  return { accepted, decision, reviewNote: reviewNote.trim() };
}

export function finalizeQaStatus(input) {
  if (exactKeys(input, ['cleanup_clean_environment'])) {
    if (!validCleanup(input.cleanup_clean_environment, 'cleanup_clean_environment')) {
      throw new TypeError('Clean path has no authoritative cleanup receipt');
    }
    return {
      target_state: 'ready_for_production',
      route_reason: 'Все проверки пройдены, точное тестовое окружение очищено; тикет переведён в Ready for Production.',
      overall_product_result: 'PASS',
      overall_environment_status: 'HEALTHY',
      overall_evidence_status: 'VERIFIED',
      recommendation: 'no_findings',
      summary: 'Чистый результат QA подтверждён, очистка завершена.',
    };
  }

  if (exactKeys(input, ['cleanup_risk_environment'])) {
    if (!validCleanup(input.cleanup_risk_environment, 'cleanup_risk_environment')) {
      throw new TypeError('Automatic risk path has no authoritative cleanup receipt');
    }
    return {
      target_state: 'in_progress',
      route_reason: 'QA обнаружил дефект или неопределённость; после подтверждённой очистки тикет автоматически возвращён в In Progress.',
      overall_product_result: 'FAIL',
      overall_environment_status: 'HEALTHY',
      overall_evidence_status: 'VERIFIED',
      recommendation: 'accept_findings',
      summary: 'Автоматический QA-контур требует исправления или повторной проверки разработчиком.',
    };
  }

  if (exactKeys(input, ['cleanup_risk_environment', 'qa_owner_gate'])) {
    const decision = humanDecision(input.qa_owner_gate, 'qa_owner_gate');
    if (!validCleanup(input.cleanup_risk_environment, 'cleanup_risk_environment') || decision === null) {
      throw new TypeError('Risk path is missing cleanup or human completion contract');
    }
    const acceptedFindings = decision.accepted && decision.decision === 'accept_findings';
    return {
      target_state: 'in_progress',
      route_reason: `${decision.reviewNote} Тикет возвращён в In Progress после безопасной очистки среды.`,
      overall_product_result: acceptedFindings ? 'FAIL' : 'INCONCLUSIVE',
      overall_environment_status: 'HEALTHY',
      overall_evidence_status: acceptedFindings ? 'VERIFIED' : 'PARTIAL',
      recommendation: acceptedFindings ? 'accept_findings' : 'human_review',
      summary: 'Владелец QA завершил рассмотрение рискованного результата; требуется работа разработчика или повторная проверка.',
    };
  }

  if (exactKeys(input, ['environment_failure_gate'])) {
    const decision = humanDecision(input.environment_failure_gate, 'environment_failure_gate');
    if (decision === null) throw new TypeError('Environment path has no human completion contract');
    return {
      target_state: 'in_progress',
      route_reason: `${decision.reviewNote} Тикет возвращён в In Progress: проверка продукта не начиналась.`,
      overall_product_result: 'INCONCLUSIVE',
      overall_environment_status: 'INFRA_FAILURE',
      overall_evidence_status: 'PARTIAL',
      recommendation: 'human_review',
      summary: 'Подготовка точной тестовой среды не подтверждена; требуется диагностика и повторный запуск.',
    };
  }

  throw new TypeError('Invalid finalization path contract');
}

export function toNuanuAgentTaskEnvelope(input) {
  const data = finalizeQaStatus(input);
  return {
    item: {
      key: 'finalize_qa_status',
      description: data.route_reason,
      data,
      artifacts: {},
    },
    artifact_outputs: {
      'item.artifacts.transition_report': null,
    },
  };
}

async function main(argv) {
  if (argv.length !== 1) throw new TypeError('Usage: paydemo-qah-finalize.mjs <final-input.json>');
  const input = JSON.parse(await readFile(argv[0], 'utf8'));
  process.stdout.write(`${JSON.stringify(toNuanuAgentTaskEnvelope(input))}\n`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
