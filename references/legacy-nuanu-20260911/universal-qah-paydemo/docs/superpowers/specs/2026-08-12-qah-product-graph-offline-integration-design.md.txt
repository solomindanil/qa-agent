# QAH Product Graph offline integration — дизайн

**Дата:** 2026-08-12  
**Статус:** одобрено пользователем в чате 2026-08-12  
**Область:** NuanuFlowQA и существующий stock Nuanu Flow Process. Product Graph и продуктовый репозиторий Freeland остаются внешними системами.

## 1. Цель

Показать полный QA-флоу тикета без подключения к репозиторию продукта:

1. тикет входит в колонку `Ready for QA`;
2. Column Process автоматически начинает работу;
3. планировщик получает версионированный graph plan и определяет конкретные проверки для изменённой и транзитивно затронутых частей продукта;
4. policy-классификатор на основании версионированной базы знаний определяет, достаточно ли машинной проверки или обязателен человек;
5. Build/Test Agent получает закрытое задание, поднимает изолированную среду через заменяемый execution port и запускает QAH;
6. Evidence/Decision Agent проверяет полноту доказательств и выбирает маршрут: вернуть в работу, передать человеку или признать готовым к production;
7. stock Nuanu Proof Gate применяет результат к тикету. В Assist режиме конечное перемещение остаётся за человеком; в Auto может применяться только уже доказанный детерминированный маршрут.

Первая реализация использует synthetic Product Graph и offline Build/Test adapter. Она обязана доказать отсутствие любого доступа к Freeland repository, URL и credentials. Позже те же порты принимают реальные данные Product Graph и реальный репозиторный builder без изменения QAH policy или Proof Gate.

## 2. Архитектурная граница

Product Graph не встраивается в QAH и не дублируется в нём. QAH принимает только результат вычислений графа:

```text
Column ticket event
  -> Candidate envelope
  -> GraphPlanProvider
  -> Graph Test Plan
  -> CriticalityPolicy
  -> Execution Assignment
  -> BuildTestExecutor
  -> QAH branch evidence
  -> Deterministic Decision
  -> stock qa_result_v1 Proof Gate
  -> ready / rework / human hold
```

Два поставщика реализуют один контракт:

- `SyntheticGraphPlanProvider` — детерминированная offline fixture для текущей проверки;
- будущий `ProductGraphPlanProvider` — адаптер результата параллельно разрабатываемого Product Graph.

Два исполнителя реализуют один контракт:

- `OfflineHarnessExecutor` — локальные fixture/API/UI/domain проверки без product checkout;
- будущий `RepositoryBuildExecutor` — чистый checkout точного candidate commit, изолированный build и запуск того же QAH scope.

## 3. Закрытые контракты

### 3.1. Candidate envelope

`nuanu.qa-candidate.v1` содержит только:

- `ticket_id` и `project_key`;
- `candidate_id` и точный `candidate_revision`;
- `change_hints` — bounded identifiers, а не пути или содержимое репозитория;
- `environment_id`;
- `requested_at`.

В offline режиме `candidate_revision` является синтетическим SHA-256 identity, не Git commit Freeland.

### 3.2. Graph Test Plan

`nuanu.qa-graph-test-plan.v1` содержит:

- identity candidate/ticket/environment;
- `graph_revision` и `graph_digest`;
- `knowledge_revision` и `knowledge_digest`;
- `freshness: current | stale | unknown | conflicted`;
- explainable `impact_paths`;
- `mandatory_checks` с типом `automated | human`;
- `always_on_checks`;
- `criticality_facts` с provenance;
- canonical `plan_digest`.

Контракт закрыт: дополнительные поля запрещены, массивы bounded и без дублей, digests и identities проверяются до запуска. `stale`, `unknown`, `conflicted`, несовпавший candidate или подменённый digest никогда не допускают `PASS`.

### 3.3. Criticality decision

Классификатор детерминированно выводит:

- `AUTOMATED_ONLY` — все обязательные проверки машинно исполнимы;
- `HUMAN_REQUIRED` — затронуты payment, money movement, entitlement, business-rule approval, визуальная/телефонная/карточная проверка либо другой human-only check;
- `HOLD` — knowledge/graph facts недостаточны, устарели или конфликтуют.

LLM может объяснить решение, но не имеет права повысить `HOLD` или `HUMAN_REQUIRED` до полностью автоматического `PASS`.

### 3.4. Execution assignment

Задание исполнителю содержит только:

- candidate/plan identities и digests;
- список автоматических checks;
- список человеческих checks как неисполняемые obligations;
- environment profile reference;
- expected evidence slots;
- budget/timeout.

В нём нет repository URL, filesystem path, token или credential. Будущий repository adapter получает checkout authority только из deployment-owned конфигурации, а не из тикета или graph plan.

### 3.5. Decision receipt

Результат маршрутизации:

- `READY_FOR_PRODUCTION` — все mandatory automated checks прошли, evidence полна и human obligations отсутствуют либо отдельно подтверждены;
- `RETURN_TO_WORK` — подтверждён product failure;
- `HUMAN_REVIEW` — есть human obligations, спорная критичность или недостаточность доказательств;
- `HOLD` — integrity, environment, graph или harness failure.

Каждый receipt связывает candidate, graph plan, knowledge revision, execution result и evidence digests. Он не строится из текста агента.

## 4. Первая offline-демонстрация

Демонстрация использует synthetic tickets и отдельный graph plan fixture для каждого сценария:

1. **Некритичное изменение:** затронуты UI/API профиля, graph plan назначает Playwright и API checks, offline executor возвращает проверяемую evidence, итог — `READY_FOR_PRODUCTION`.
2. **Критичное изменение:** impact path достигает payment/business invariant и human-only obligation, автоматические проверки выполняются, но итог — `HUMAN_REVIEW`, а не автоматический production.
3. **Product failure:** обязательная затронутая проверка падает, итог — `RETURN_TO_WORK`.
4. **Hostile plans:** stale/foreign/tampered/unknown graph plan, пропущенный transitive check или отсутствующая knowledge provenance дают `HOLD` до исполнения либо до Proof Gate.

Интеграционный тест обязан перехватить filesystem/process/network authority и доказать:

- Freeland checkout не открывался;
- Git clone/fetch/checkout не запускались;
- product base URL и product credentials не запрашивались;
- все выполненные checks получены из graph plan плюс invariant suite;
- evidence и decision содержат точный graph plan digest;
- один ticket event создаёт ровно одну execution attempt.

## 5. Интеграция с текущим QAH

Новая граница располагается перед существующим `planQaScope`:

- текущая path/label эвристика остаётся compatibility fallback только для старых профилей;
- при наличии graph plan именно он является единственным источником applicability и mandatory scope;
- существующие branch executors, aggregate, finalization adapter и stock Proof Gate переиспользуются;
- `test_plan`, branch evidence, aggregate и finalization получают обязательные `graph_plan_digest` и `knowledge_digest` для graph-driven runs;
- graph-driven run не может тихо откатиться к path/label планированию.

В первой итерации graph plan преобразуется в существующие bounded QAH branches (`code`, `api`, `ui`, `domain`) и в точный список check IDs. Product Graph сохраняет владение транзитивным impact; QAH сохраняет владение исполнением, evidence и verdict.

## 6. Nuanu Flow

Для offline-проверки live Column Process не меняется и остаётся paused. Локальный integration test воспроизводит его входной event и проверяет весь контракт до Proof Gate result.

После локального GREEN выполняется отдельный controlled canary:

- binding активируется только на время одного dedicated Assist ticket;
- автоматически созданный run получает synthetic graph plan Artifact;
- любой exit path возвращает binding в paused и подтверждает read-back;
- Assist подавляет автоматическое перемещение, поэтому человек видит предложенный маршрут и evidence;
- Auto разрешается отдельным решением только после успешных negative canaries.

## 7. Ошибки и безопасность

- Нет graph plan — `HOLD`, без fallback для graph-required профиля.
- Digest/identity mismatch — integrity failure и `HOLD`.
- Human obligation — `HUMAN_REVIEW`, даже если автоматические checks зелёные.
- Build/Test timeout или environment failure — `HOLD`, не product failure.
- Подтверждённый deterministic check failure — `RETURN_TO_WORK`.
- Ноль обязательных checks не даёт `READY_FOR_PRODUCTION`, кроме доказанного `no_product_impact` с always-on suite.
- Ни synthetic, ни live input не может задавать command, cwd, repository URL, env key или executable.
- Evidence хранит sanitized facts/digests, а не credentials или необработанные product responses.

## 8. Критерии готовности первой итерации

Итерация завершена, когда:

1. закрытые contracts и hostile validators покрыты unit tests;
2. graph-driven planner не использует path/label fallback;
3. три бизнес-сценария дают `READY_FOR_PRODUCTION`, `HUMAN_REVIEW`, `RETURN_TO_WORK`;
4. stale/tampered/foreign/unknown cases дают `HOLD`;
5. полный local event-to-Proof-Gate test GREEN без Freeland repository/network/credentials;
6. существующий QAH Proof Gate suite остаётся GREEN;
7. в отчёте явно показаны выбранные impact paths, checks, criticality, evidence и конечный маршрут;
8. live Nuanu binding не активируется в рамках этой итерации.

## 9. Не входит в первую итерацию

- чтение или сборка Freeland repository;
- реализация самого Product Graph;
- production deployment или real-money проверки;
- перевод Column Process в постоянный Auto;
- замена stock Nuanu Flow backend/plugin/worker.
