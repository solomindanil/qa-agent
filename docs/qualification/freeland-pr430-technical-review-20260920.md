<!-- QA_LOCAL_HISTORY_20260920 -->
> Historical record retained during local consolidation on 20 September 2026. Status, approvals, pauses, source paths and next actions below belong to the original dated scope; they are not current instructions, new test results or execution authority. Use the [current checkpoint](current.md) and [consolidation index](local-consolidation-20260920.md). Private/absolute historical evidence links are optional locators, not clone prerequisites. Original body bytes are preserved below.
<!-- /QA_LOCAL_HISTORY_20260920 -->

# PR #430 — независимая техническая проверка, 20 сентября 2026

## Решение и scope

**Техническая приёмка: NEEDS_FIXES / неполная SQL-квалификация. Не production Go.**

Проверен открытый [PR #430](https://github.com/nuanu-ai/freeland_app/pull/430), exact head `e531408f41fcd2e68d4ca4fb7af54e6e31d014f9`, base `98262828a3f506a6e5ce9094968bed917433abc6`. Финальный GitHub readback подтвердил тот же head и OPEN.

Это приёмка исходников PayAssist resolver и ограниченных изолированных проверок, не новая staging/release campaign. Production/provider evidence из сообщения Никиты не перечитывалось нами непосредственно. Продукт, production, провайдеры и tracker не изменялись; платежи, production SQL/resolver и deploy не запускались. Продуктовый checkout после проверки чистый. Разработка QA-agent остаётся на паузе.

## Что выполнено

| Проверка | Наблюдаемый результат | Граница доказательства |
|---|---|---|
| Focused API unit: financial-resolution, migration-contract, state-machine, payment-checkouts | 61/61 PASS | Четыре migration-contract проверки — текстовые assertions, не исполнение SQL |
| Payment checkout route contract | 21/21 PASS | Изолированные route tests, не production auth |
| Дополнительный поздний DELIVERED + повтор того же event | 1/1 PASS | Реальный service с mock DB/event/provisioning; не SQL concurrency |
| API build, source guards, diff check | exit 0 | Не полный продуктовый regression suite |
| Exact resolver на PostgreSQL 14.18 | Валидный повтор: один audit, одна provider identity; другой idempotency key, неверная заданная сумма и paid evidence отвергнуты | Минимальная synthetic schema, не полный production schema |
| SQL execution grants | anon=false, authenticated=false, service_role=true | Проверены grants; вызов probe выполнялся DB superuser, не end-to-end service_role auth |
| GitHub main CI verify-runtime-shapes | SUCCESS | Отдельный PostgreSQL gate не зелёный |
| Target payment migration harness | FAILURE до checkout/tests | Setup: `Freeland staging runner pre-job identity rejected.` |

[Неуспешный SQL workflow](https://github.com/nuanu-ai/freeland_app/actions/runs/35501081810/job/106052848596). Отказ runner identity — инфраструктурный блокер, а не падение проверок миграции. Нельзя называть весь CI зелёным.

Дополнительный callback probe подтвердил: late paid после confirmed-unpaid переводит запись в manual_review exception; повтор уже claimed event возвращает duplicate без дополнительных RPC/completion writes и без выдачи продукта/денежной операции. Это не доказывает отсутствие всех межпроцессных гонок.

## F1 — P2: SQL принимает неполное доказательство

**Воспроизведено.** В `supabase/migrations/20260902110000_payment_checkout_confirmed_unpaid_resolution.sql` строки 47–68, 125, 157–170 используют `<>`, `NOT IN`, `!~` и сравнение timestamp без обязательной проверки NULL. Отсутствующее поле JSONB даёт NULL; условие PL/pgSQL IF не считает его TRUE и не отклоняет вызов.

Шаги в изолированной БД:

1. Создать synthetic PayAssist checkout: manual_review, без provider_ref, 39732 RUB minor, без денежных/продуктовых операций.
2. Взять валидное merchant_search_terminal_match доказательство и согласованный synthetic approval/digest.
3. Отдельно удалить одно поле: expectedAmountMinor, expectedCurrency, providerFeeMinor, evidenceBodyHash, providerFinalizedAt, finalStatus либо mode.
4. Вызвать точное тело reviewed RPC.

**Ожидание:** reject до status/identity/audit mutation. **Факт:** каждый из семи payload принят, checkout стал payment_failed, auditRows=1. При missing mode не следует заявлять adoption: exact-mode ветка регистрации identity не выполняется. identity=1 доказано только для валидного сценария.

HTTP Zod/service validation отвергает неполные payload, поэтому публичный обход через HTTP **не доказан**. Это дефект самостоятельного service-role SQL-контракта / защиты в глубину, не установленная потеря денег. Исправить явные required/type/null проверки по каждой ветке; неправильный/отсутствующий discriminator не должен попадать в terminal-match ELSE. Покрыть missing, JSON null, неверные типы/значения и rollback без audit/identity/status изменений на реальном SQL.

SQL probe использует exact migration, SHA256 `76c000bf989827f7842092beb3797bdb070922bf9bf39fe8d5f003a6763ee5a1`. Независимый Lead AQA/PostgreSQL reviewer подтвердил корректность NULL-воспроизведения: ограничения реальных колонок не проверяют пропущенные поля входного JSONB. Полная схема с triggers/RLS/FKs не исполнялась. В synthetic fixture нет всех production unique constraints; общую adoption/concurrency квалификацию из неё не выводим.

## F2 — P2, static risk: порядок sibling locks

Строки 72–75 сначала блокируют собственный checkout, затем 81–89 — family ORDER BY id. При одновременном resolve двух разных checkout одной family возможен порядок T1 holds A, T2 holds B, затем каждый ждёт другого. Это статически установленный потенциальный deadlock; runtime воспроизведение не выполнено. PostgreSQL должен прервать одну транзакцию, а не допустить двойное списание.

Попросить Никиту добавить двухсессионный SQL тест и согласованный порядок получения family/target locks либо квалифицированный retry. Не объявлять это наблюдавшимся production инцидентом.

## Граница digest/approval

Прямой SQL вызов принял изменённый evidenceRef при прежнем approval и прежнем digest: RPC сравнивает переданные digest, но не пересчитывает содержимое. HTTP service пересчитывает digest и отсекает mismatch. Это ограничение границы доверия SQL, не доказанный HTTP bypass. Нужно явно закрепить единственный валидирующий entrypoint либо обеспечить проверку binding для поддерживаемых прямых RPC-клиентов. Новый криптографический движок не требуется. Approval payload — записанное оператором утверждение; подлинность решения финансового владельца остаётся частью процесса.

## Что требуется Никите до нашей повторной технической приёмки

1. Исправить F1 и прислать новый exact SHA; добавить реальные SQL negatives по веткам, а не только regex проверки текста миграции.
2. Проверить F2 двухсессионным тестом; сохранить транзакционность update + identity + audit и same-key readback.
3. Восстановить легитимную runner identity и перезапустить полный migration harness, не отключая guard. Harness применяет новую миграцию в общей цепочке, но его прежние fixtures не заменяют прямые бизнес-тесты нового resolver.
4. Для bf6 подтвердить применимость sibling guards по intent_hash/product_scope_hash: факт «другая оплаченная покупка» сам по себе не доказывает отсутствие совпадающей family.
5. Дать минимальную процедуру prerequisite schema/application deployment до вызова resolver; resolver не должен запускаться против отсутствующей prerequisite schema. Наша текущая проверка не разрешает production mutation.

## Финансовые вопросы остаются отдельными

- **bf6:** сообщённый exact unique FAILED match позволяет рассмотреть confirmed-unpaid после подтверждения evidence и approval владельца. Мы не давали approval, production resolution не выполняли.
- **6bb:** CREATED/pending и истёкшее payment window не равны подтверждённой неоплате. Нужен конечный provider disposition либо отдельно согласованный путь abandonment с обработкой поздней оплаты.
- **Lava:** merchant GET404 не доказывает отсутствие charge/refund. По новым данным доступ уже выдан, ledger settlement отсутствует; повторно выдавать продукт нельзя. Нужна merchant history и решение владельца. **Legacy Lava recovery в PR430 отсутствует** — готовность этого пути не подтверждена.
- **Worker503:** старый COINSLOT_DEPENDENCY_FAILED требует оценки влияния на операции/очереди и readiness; schema compatibility не заменяет worker health.

После исправлений: exact-SHA regression → владелец подтверждает необходимые disposition → отдельно разрешённый audited resolve → readback и repeat/late-callback проверки → fresh guard 0/0 → оставшиеся migrations/deploy по reviewed процедуре → smoke. Этот отчёт не разрешает сокращать цепочку или обходить guard.

## Воспроизводимость и артефакты

Изолированный чистый product checkout: `/Users/danilsolomin/projectsnew/qa-agent/.local/freeland-pr430-review-20260920.LOurYb/product`. Dependencies установлены offline/frozen-lockfile/ignore-scripts; shared/environment workspace dependencies собраны перед тестами. Первоначальный запуск до сборки shared завершился setup error, не дефектом продукта.

Команды из product checkout (исполнялись с очищенным env):

```sh
pnpm --filter @freeland/api exec vitest run --config vitest.unit.config.ts tests/payment-financial-resolution.test.ts tests/payment-confirmed-unpaid-migration-contract.test.ts tests/payment-checkout-state-machine.test.ts tests/payment-checkouts.test.ts
pnpm --filter @freeland/api exec vitest run --config vitest.contract.config.ts tests/payment-checkout-routes.test.ts
pnpm --filter @freeland/api build
pnpm security:source-guards
git diff --check 98262828a3f506a6e5ce9094968bed917433abc6 HEAD
```

SQL diagnostic: `.local/freeland-pr430-review-20260920.LOurYb/sql-probe.mjs`; late-repeat spec/config: `.local/freeland-pr430-review-20260920.LOurYb/probe-tests/`. Это QA diagnostics вне product source, не новый принятый harness pipeline.

- [SQL raw results](evidence/freeland-pr430-20260920/sql-probe-results.jsonl)
- [Late callback repeat output](evidence/freeland-pr430-20260920/late-callback-repeat.txt)
- [Архив SQL diagnostic source](evidence/freeland-pr430-20260920/sql-probe-source.mjs.txt)
- [Архив callback diagnostic source](evidence/freeland-pr430-20260920/late-repeat-source.ts.txt)

Архивы сохраняют исходные bytes диагностик, включая пути изолированной копии; они не объявляются переносимыми установленными инструментами. Для повторения нужен exact product checkout и привязка путей к нему.

Временный PostgreSQL использовал Unix socket, TCP отключён; synthetic UUID/данные, внешние credentials не использовались. Server остановлен; каталог `/private/tmp/freeland-pr430-pg-bWhO7h` сохранён для диагностики. Никакая локальная проверка не подтверждает live merchant finality, состояние production ledger или readiness prod.
