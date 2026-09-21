# Freeland PR #431 — целевая повторная проверка, 21 сентября 2026

## Итог и границы

**NEEDS_REVIEW: техническая проверка частично выполнена, живой four-eyes flow не принят.**
Это не sealed campaign, не итог всего релиза и не production Go.

[PR #431](https://github.com/nuanu-ai/freeland_app/pull/431) действительно MERGED.
Exact merge и проверенный staging API SHA:
`36b9e2be2758d4d2e722dda9060d8adcb1f62b90`.
Продуктовый checkout чистый; продукт, права, approvals, resolver, tracker,
production и платежи не менялись. Отдельные независимые ревью: Lead AQA/SQL,
HTTP/service и graph/coverage. Их выводы проверены по исходникам; статические
риски ниже не выдаются за наблюдавшиеся финансовые инциденты.

## Контрольная точка универсального агента

По просьбе пользователя разработка приостановлена на canonical
`codex/p2-semantic-source-delivery@6d610a122c825112ec0e27126485568554c72bf2`.
Kernel `aa5d2d1`, Console `c421160`, Freeland `0ea2df1` не изменены;
`sources:verify` подтвердил все четыре manifest entries.
Завершённый reviewed execution/continuation cycle сохранён. Следующие задачи
после возврата: выбор незнакомого продукта и согласованный узкий ремонт чтения
обычных кампаний через `qa-campaign status`. Ремонт пока только диагностирован,
не реализован. P2-B и остальные обязательства глобального плана не сняты.

## Независимо проверено

| Проверка | Результат | Что она не доказывает |
| --- | --- | --- |
| Staging `/api/environment` до/после | HTTP200, exact SHA и profileDigest совпали | Web/worker/schema identity отдельно не перечитаны |
| `/api/live`, `/api/ready` | HTTP200, process/database ok | Не полный продуктовый smoke |
| Неавторизованный `GET /api/admin/session` | HTTP401 `Missing admin token` | Не проверка всех новых ролевых отказов |
| GitHub CI35521135844 | SUCCESS, head `e47b042a1bdb80314b3877d75df435c4a6528d51` | Не собственный повтор Docker/Supabase harness |
| GitHub deploy35521966210 | SUCCESS, exact merge36b9e2be | Не acceptance транзакций |
| Целевые API unit tests | **134/134 PASS**, семь файлов | Migration-contract/fingerprint cases проверяют текст, а не SQL execution |
| Payment checkout route tests | **24/24 PASS** | Mock services/actors не доказывают реальных двух пользователей |
| API build, source guards, PR diff whitespace | exit0 | Не весь регрессионный suite |
| Exact-source schema diagnostic | Настоящая staging-форма отвергнута, synthetic production-форма принята | Диагностика локальная; resolver не вызывался |

Зависимости механически скопированы из предыдущей изолированной QA-копии:
lockfile обоих checkout имеет SHA256
`80021ff411bd5039b4a9c0f2320017bbb0af36fbcfcfed2afac327e2f1e38815`.
Новых пакетов/install scripts нет. Shared/environment пересобраны из текущего
candidate. Команды запускались с очищенным env; unit setup использует CI и
`test.supabase.invalid`. Это не cold-install qualification.

Заявленная разработчиком полная SQL-квалификация в PR относится к `f6a01f3754251deec4368f58b92fd6adca8d4b1e`.
Независимый diff до merge показывает только добавленные 18 строк одного
create-conflicts теста; SQL/runtime bytes не изменены. Но исходные raw SQL logs
по их digest нами не получены: это developer-reported evidence, не наш replay.
Повтор полного локального Docker/Supabase harness здесь недоступен: Docker daemon
не отвечает, требуемого прямого `/var/run/docker.sock` нет. Guard не обходили,
Docker не запускали и окружение не перенастраивали.

## Что улучшено относительно PR #430

По исходникам: forward-only migration, явная NULL/type валидация, сохранённый
immutable approval, SQL-пересчёт digest, server-derived account binding,
разные действующие user IDs, consume/revoke, упорядоченные family locks,
RPC-only privileges и атомарный VELVET release. Старое замечание о target-first
lock inversion нельзя автоматически переносить на новый код.

## Оставшиеся вопросы

### A. Подтверждённое ограничение staging-приёмки ветки без provider_ref

`apps/api/src/schemas.ts:436–456` допускает в merchant-search ветках только
`environment: production` и `pa_prod_…`. SQL migration `20260920130000`, строки
793–848, требует то же. Реальный non-production PayAssist использует
`pa_staging_` (`services/payassist-runtime.ts:36–43`).

Локальная проверка exact exported schema воспроизвела два отказа staging input:
merchantRequestId и environment. Тот же synthetic input с production namespace
принят. Данные полностью фиктивные, запросов провайдеру не было.
Это может быть намеренным ограничением hotfix для исторических production
операций, а не ошибкой денежных расчётов. Но оно не позволяет объявить настоящий
staging merchant-search/unique-terminal-match путь проверенным. Нельзя заменить
реальный staging evidence выдуманным `pa_prod_`. Нужен явно согласованный способ
квалификации именно этой ветки; `provider_final_status` — другая ветка.

### B. Поздний идентичный retry: вопрос к восстановлению

`payment-checkouts.ts:3985–3994,4074–4083` проверяет свежесть evidence до RPC.
После 15 минут прежний запрос получает409, не достигая SQL replay ветки
(`migration:403–411,712–730`). Runtime docs говорят о свежести на issuance и
first execution. Локально подтверждён отказ самого freshness helper при
`+900001ms`; полный delayed service/HTTP replay пока не воспроизведён.

Нужен контроль: успешный вызов с потерей ответа → сдвиг часов >15 минут →
точный повтор key/approval/evidence. Он должен позволять достоверно прочитать
уже совершённое без второго эффекта либо иметь документированный альтернативный
readback. Нового GET approval endpoint сейчас нет; SQL readback требует владельца.

### C. Пограничная гонка freshness/permissions — статический риск

Resolver проверяет expiry/freshness после ожидания locks, но через
`statement_timestamp()` (`migration:749,762–764`) — время начала SQL statement.
Operator permission проверяется до locks (`604–611`), без аналогичной повторной
проверки после ожидания; approver проверяется позднее. Не заявляем воспроизведение.
Нужны точечные SQL controls: ожидание через границу срока evidence и отзыв
operator permission во время ожидания. На отказе все бизнес-записи неизменны.

### D. Сила SQL-тестов

`scripts/smoke/fixtures/payment-confirmed-unpaid-rpc-regression.sql:170–200`
засчитывает любой exception, кроме собственного acceptance sentinel, причём
сначала вызывает issuance. Значит часть resolver-negative cases может пройти
из-за постороннего отказа раньше resolver. Нужны expected error и положительный
контроль нужной ветки. Текущие успешные SQL fixtures не покрывают успешный
merchant-search terminal-match/no-match. Это пробел доказательства, не уже
обнаруженное ложное списание. Моковый late-DELIVERED тест не доказывает всю
развёрнутую webhook/DB гонку.

## Что нужно для живой приёмки

Пользователь подтвердил, что отдельные данные для исполнения не передавались.
Существование двух подходящих staging actors/прав и fixture **не установлено**;
это не утверждение, что таких аккаунтов нет.

Никита может либо подготовить доступ, либо сам выполнить сценарий и передать
обезличенный проверяемый пакет. Пароли, токены и ключи в канал не нужны:

Перед возобновлением перечитать staging identity: требуется reviewed exact SHA
и profileDigest либо новая квалификация изменившегося candidate. До issuance
нужно отдельное явное разрешение на конкретный fixture, участников и resolver;
наличие доступа или этого отчёта его не заменяет.

1. Два различных active user-backed admin UUID и readback точных разрешений
   approver/operator; источник admin session — реальный user, не generic/password.
2. Отдельный разрешённый staging checkout + исходные статус, account/intent,
   amount/currency, отсутствие paid/product/ledger/refund effects и успешного
   sibling. Если VELVET — исходная reservation. Не использовать production bf6.
3. Свежий merchant read и явно применимый для fixture evidence mode. Согласовать
   ограничение A до вызовов; approval issuance само меняет account metadata.
4. Issue → readback → resolve другим user → полный DB readback:
   `payment_failed`, один resolution audit, consumed один раз, release один раз,
   ноль новых money/product/refund effects. Audit выдачи approval считать отдельно:
   «один audit» не означает один audit на весь двухшаговый процесс.
5. Exact retry и отдельные отказные fixtures: same actor, wrong role/account/digest,
   stale/future/expired/revoked, поздний DELIVERED без повторной выдачи.

Production, реальные merchant dispositions и `6bb`/Lava остаются вне этой
проверки. Даже успешный staging flow не разрешает назначить production роли,
выполнить bf6 resolver, миграции или deploy.

## Граф и scope

Граф использован как карта зависимостей, не как утверждение покрытия. Selected
source содержит старую graph projection product09866d62; историческая frozen
campaign — d3ec8b59, её dirty graph не менялся. В mapping inputs есть связи
checkout → VELVET inventory/reservation → activation, API/permission gates и
late-payment/idempotency tests. Но 18 из21 изменённого PR431 пути не имеют
явного mapping; новые approval/resolver/concurrency cases не представлены полно.

Поэтому scoped source review расширен по реальному diff и SQL/service зависимостям.
Старые пять Playwright selectors не названы полным impact scope. Новый graph,
plan/dry-run, sealed generation и полный browser suite **не запускались**;
данный отчёт не подменяет их и не меняет исторические receipts. Долг покрытия
остаётся в универсальном плане после возврата к нему.

## Сохранённые доказательства

[134 unit tests](evidence/freeland-pr431-20260921/focused-unit.txt),
[24 route tests](evidence/freeland-pr431-20260921/focused-routes.txt),
[schema/freshness diagnostic](evidence/freeland-pr431-20260921/schema-probe.txt),
[API build](evidence/freeland-pr431-20260921/api-build.txt),
[source guards](evidence/freeland-pr431-20260921/source-guards.txt),
[identity before](evidence/freeland-pr431-20260921/api-environment-before.json),
[identity after](evidence/freeland-pr431-20260921/api-environment-after.json),
[live](evidence/freeland-pr431-20260921/api-live.json),
[ready](evidence/freeland-pr431-20260921/api-ready.json),
[unauthenticated session](evidence/freeland-pr431-20260921/admin-session-unauth.json),
[CI](evidence/freeland-pr431-20260921/ci.json),
[deploy](evidence/freeland-pr431-20260921/staging-deploy.json).

Fresh canonical QA-agent packaging gate: [61/61, без failed/skipped](evidence/freeland-pr431-20260921/root-packaging-tests.txt).
Он подтверждает сохранность поставки харнеса, не покрытие Freeland.
Главные raw logs скопированы byte-for-byte в `.txt`, поскольку `.log` исключён
из Git. Final independent reporting review потребовал именно это исправление
переносимости и явный resume/authority gate; выводы отчёта одобрены.
Исходные unit/route logs сохраняют завершающую пустую строку: полный
`diff --check` документационной поставки сообщает только эти две строки.
Авторские документы и продуктовый PR проходят whitespace check; raw evidence
не форматировалось ради зелёного гейта.

Повтор unit: `pnpm --filter @freeland/api exec vitest run --config vitest.unit.config.ts`
с файлами `payment-financial-resolution`, `payment-confirmed-unpaid-migration-contract`,
`payment-checkout-state-machine`, `payment-checkouts`, `payment-checkout-create-conflicts`,
`payassist-status-lookup-quota-migration`, `target-payment-migration-fingerprint`
из `apps/api/tests/*.test.ts`. Route: тот же vitest с
`--config vitest.contract.config.ts tests/payment-checkout-routes.test.ts`.
Все команды относятся к exact product SHA выше, не к cwd QA-agent.

Private optional locator текущего анализа:
`.local/freeland-pr431-acceptance-20260921.PXj6PP/` внутри qa-agent.
Он не нужен для чтения перечисленных сохранённых доказательств и не является
авторизацией будущих действий. Новые исходники QA или продукта не создавались.
