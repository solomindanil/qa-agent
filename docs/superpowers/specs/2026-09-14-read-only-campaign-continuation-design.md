# Продолжение QA-кампании после разрыва процесса

Дата: 2026-09-14. Статус: архитектурный проект, не реализовано.
Пользователь согласовал направление: расширить существующий Console/Kernel,
сохранять завершённое и продолжать оставшееся. Этот документ фиксирует контракт
до реализации и требует отдельного прочтения пользователем.

## 1. Результат и границы

После остановки worker новая сессия видит исходный scope, завершённые проверки,
прерванные попытки, оставшуюся работу и конкретные блокеры. Она не выполняет
завершённое повторно и не представляет старый PASS как результат нового запуска.
Агент решает, что делать дальше; инструменты запрещают небезопасный повтор и
необоснованное использование старых результатов.

Первое доказательство — зарегистрированная локальная кампания с тремя
проверками публичного API на принадлежащем нам fixture. Только разрешённые
same-origin GET, без cookies, секретов, cross-origin dependencies и побочных
эффектов. Стабильные instance/build/data identity предоставляет сам fixture.
Это проверка механизма на известной среде, не автоматическое разрешение GET
любого продукта и не приёмка всего продукта.

Поддерживаем разрыв дочернего worker на том же хосте при живом исходном
launcher. Потеря launcher/хоста, power loss, облако, восстановление браузерной
сессии, платежи, авторизация и mutable external products — отдельные срезы.
Read-only browser checks не получают автоматический replay по этой приёмке.

## 2. Что переиспользуем

Исходный root: `57075ec70ba33bfb0a7384acaa3719a7ec9416fa`.
Console: `881a93e43fd9b90f3dcf9812812f6cf8ad854789`.
Kernel: `657894dbd61561a634f36669a0874dccccbea59e`.
Пути ниже — относительно manifest-selected components этого репозитория.

| Область | Существующая реализация и требуемое изменение |
| --- | --- |
| Исполнение | Console `src/node/qa-campaign-runner.ts`: тот же loop, adapters, retry и classifier; добавить восстановление входного состояния |
| Файлы | Console `src/node/qa-campaign-files.ts`: использовать существующие secure-path/exclusive-write patterns; добавить публикацию immutable records |
| Чтение | Console `server/campaign-receipts.mjs` и `src/lib/qa-campaign-v0.ts`: явный version dispatch, partial readback и v1 validation |
| Реальная точка входа | Console `scripts/qa-campaign.ts`: сохранить pre/post Kernel validation; добавить явные status/resume операции выбранного run |
| Workspace | Kernel `src/kernel/workspace-validator.ts`: узкая v1 grammar, без ослабления v0 |
| Безопасность браузера | Console `src/node/playwright-campaign-adapter.ts`: сохранить ожидание teardown/late-guard reconciliation; assertion/trace не означает завершение |

Не создаём новый runner, verdict engine, универсальную БД событий, cloud daemon
или вторую изменяемую checkpoint-модель. Не подключаем reporting-reference
Kernel, generic manual receipts или Freeland business rules. Freeland и все
действующие кампании остаются без изменений.

## 3. Совместимость и единственный источник продолжения

Выбран append-only вариант, а не изменяемый checkpoint со вторым CAS-протоколом.
Для новых opt-in runs вводим `run-v1-<binding16>-<uuid>` и
`qa-campaign-receipt.v1`. Старые `run-*`/receipt.v0 остаются неизменными и читаются
строгим v0 reader. Новый version dispatcher не передаёт v1 старому валидатору;
неизвестную версию отклоняет. Исторический бинарник может вообще не увидеть v1,
поэтому его нельзя выбирать для продолжения новой кампании.
Прерванные v0 без durable identity нельзя автоматически мигрировать в v1.

Упрощённая схема нового run:

```text
tests/campaign-runs/run-v1-<binding16>-<uuid>/
  run.json
  checks/<check-token>/attempt-[12]/execution-<uuid>/
    start.json
    accepted/
      result.json
      trace.json
      final.png          # только когда тип проверки требует screenshot
      complete.json
  receipt.json           # только полный terminal result
```

`run.json` неизменяемо фиксирует исходный canonical plan со всеми checks и
blockers, graph/catalog/binding digests, exact Console/Kernel source identity,
registration/publication/oracle/dependency bindings, нормализованный origin,
поддержанный target identity и public-anonymous context. Неприменимые bindings
указываются явно, а не заменяются выдуманным digest. Секретов и machine paths нет.

`start.json` фиксирует check, logical attempt, execution ID, owner generation,
время и run identity; при replay — также предыдущую uncertain execution и
основание допуска. Он durable до вызова adapter. Это не доказательство,
что запрос дошёл до сервера. Нумерация assertion attempts остаётся `[1]`/`[1,2]`;
execution UUID обозначает dispatch, а не новый assertion retry.

`complete.json` содержит inventory/hash/size законченной execution и ссылку на
start/run. Его нельзя создать по одному result.json. Он публикуется вместе с
accepted artifacts после awaited adapter finalization, проверки результата,
санитарной обработки и exact-byte readback. Сам себя complete не хеширует:
его хеш входит в terminal receipt. Два complete для одного logical attempt —
конфликт, не повод выбрать последний. Отдельный check-status не записываем:
он вычисляется существующими retry/classification правилами.

## 4. Частичные данные и атомарная граница

Сырые adapter outputs и staging публикации находятся в отдельном explicit
private execution store вне managed workspace и вне tracked repo. Используем
те же принципы containment/no-follow/exclusive creation; не переиспользуем
registration store как произвольную корзину. Root задаётся явно, 0700/0600,
связь с run/generation — по opaque IDs. Отсутствие store — конкретный блокер,
не fallback в исторический cwd. Это приватные данные, не зависимость исходников.
Host связывает выбранный store и admission root с исходным workspace/run;
передача другого root не позволяет создать второго владельца той же кампании.

После разрыва сырые файлы сохраняются; они могут быть неполными и ещё не
проверенными на секреты. Reader не выдаёт их как evidence и не читает их ради
получения PASS. Sanitizer работает только с текущей новой execution, не со всем
run. Сохранённые completed bytes сначала проверяются по hashes; повреждение
означает отказ, а не повторное редактирование, удаление или «починку» истории.

Accepted directory готовится целиком в private staging на том же filesystem,
проверяется и публикуется атомарно под exclusive ownership без замены существующей
цели. До публикации её нет; после — полный набор, включая complete. Immutable
JSON records публикуются тем же all-or-absent способом. Прерванная подготовка
остаётся private/uncertain и не создаёт malformed JSON в public workspace.
Неизвестный итог публикации сверяем чтением, не повторяем вслепую.
Начальный run directory тоже публикуется вместе с валидным run.json: пустая
папка без identity не должна остаться распознаваемой resumable campaign.
Execution directory аналогично публикуется целиком со start.json. Пустые
структурные checks/check-token/attempt ancestors допустимы только для checks
исходного plan; они не означают dispatch, результат или право на replay.

Новый validator знает только перечисленные v1 файлы, canonical IDs и permissions:
активные run/ancestor directories 0700, опубликованные records 0400,
accepted subtree 0500/0400; terminal subtree целиком 0500/0400. Unknown files,
symlink/hardlink substitutions, неверные bindings или inventory — отказ.
Отсутствующая accepted directory при валидном start — допустимый partial state.
Произвольный writable v0 или raw bytes в public workspace не разрешаются.
Если valid receipt уже опубликован, а sealing прерван, перечисленные ancestor
directories могут иметь смесь 0700/0500. Это отдельный допустимый nonterminal
`sealing_pending`, только после проверки receipt/inventory/bindings. Он позволяет
завершить permissions, но не принять результат как terminal и не обойти другие
проверки. Допустимость partial state не означает допустимость product dispatch.

## 5. Исполнитель и восстановление

Execution state не равен QA-вердикту:

| Состояние | Основание | Следующее действие |
| --- | --- | --- |
| Unstarted | Нет start для следующей logical attempt | Выполнить после допуска |
| Uncertain | Start есть, accepted/complete нет | Сначала ownership + identity + repeat-safety; иначе помощь/блокер |
| Finalized attempt | Полный проверенный accepted commit | Восстановить результат; не обращаться к продукту повторно |

Первый pass или harness_failure завершает check. После первого другого failure
по-прежнему требуется второй logical attempt. После второго применяется
существующий classifier, включая flaky/non-PASS. Replay uncertain dispatch не
расходует и не обнуляет assertion retry, не скрывает уже finalized failure.
Все предыдущие executions сохраняются; прерванное не превращается ни в PASS,
ни в придуманную ошибку продукта.

До любого dispatch нового worker: явный выбор run, admission, Kernel workspace
validation, проверка immutable records/hashes и повторное подтверждение identity.
Оригинальный порядок checks и blockers сохраняется. При изменении source pair,
plan/catalog/graph, authority, origin, fixture instance/build/data/context —
ноль test dispatches; нужна отдельная новая кампания. Разрешённые identity probes
учитываются отдельно: отсутствие test dispatch не означает отсутствие этих reads.
Статический mismatch выявляется до target probe. После исполнения identity
сверяется снова; drift не позволяет выдать PASS по смешанным версиям.

Replay поддерживается только у конкретной квалифицированной capability:
публичные repeat-safe GET известного fixture. Одного `sideEffectClass=read_only`
или HTTP-метода недостаточно. Неизвестный денежный/внешний эффект сначала
reconcile и остаётся вне этого среза. Cross-origin request budgets нельзя
обнулить при resume; здесь такие dependencies отклоняются до исполнения.

## 6. Один владелец, без магического stale unlock

Admission охватывает dispatch, accepted publication и terminal sealing. Lock
находится вне sealed run. Повторный владелец не получает доступ параллельно;
небезопасный root, конфликт или неизвестный статус дают отказ до test dispatch.
За основу берём существующие exclusive/identity-checked write patterns, но их
применимость к длительной кампании доказываем отдельно.

В первом срезе живой исходный launcher/host владеет реальным ChildProcess и
группой worker. Он связывает nonce/generation с процессом, наблюдает exit/close,
подтверждает завершение owned descendants, затем передаёт следующую generation
через свой живой локальный канал. Новый worker получает admission и перепроверяет
состояние. Читаемый JSON с `owner-dead`, PID, возраст lock или timeout не являются
такой capability. Старый процесс не может продолжить после передачи: его
завершение — обязательная предпосылка, а не только проверка fence перед write.

Qualification driver играет роль существующего host launcher и запускает
настоящий CLI; он не подменяет runner/reader. Если launcher погиб или нельзя
подтвердить завершение descendants — `ownership_unresolved`, без auto-unlock.
Перезапуск host и перенос на другой компьютер здесь не квалифицируются.

## 7. Чтение, terminal result и диалог

Новый reader возвращает выбранные run/source/target identity, исходный denominator,
finalized checks и attempts, uncertain executions, remaining checks, blockers
и причину/действие для продолжения. Это partial status, без terminal verdict.
Discovery показывает новый незавершённый v1 отдельно от старых terminal receipts;
не выбирает кампанию для resume по mtime. Historical receipt не становится
текущим только потому, что в новой кампании ещё нет receipt.json.

Final receipt.v1 использует те же QA-статусы, original scope, blockers и classifier.
Он связывает каждую logical attempt с единственным accepted execution и включает
exact inventory безопасных lifecycle records/artifacts; interrupted executions
явно перечислены без импорта private raw. После записи выполняется sealing и
настоящий reader readback. Crash между receipt write и sealing допускает только
проверку exact bytes и завершение sealing, без product requests. До полного
sealing такой receipt не считается terminal. Повторное resume terminal run
возвращает прежнее evidence без запросов к продукту и без обновления timestamps.

В диалоге агент объясняет: «сохранено N, прервано M, осталось K; сейчас делаю X;
для Y нужна Z». Partial readback доступен даже при невозможности выполнить resume.
Сохранённое evidence имеет исходное время, а не время новой сессии. Несовпадение
текущего target с историческим receipt не исправляется переименованием результата.

## 8. Приёмка до source adoption

- Настоящий registered CLI: A finalized, B удерживается сервером до ответа,
  C не начат; SIGKILL owned worker → новый worker → actual final reader.
  Счётчики: A=1, B=2 (включая прерванный), C=1. A bytes/hash/time не меняются.
- Разрывы при публикации run/start directories, до dispatch, в ответе, при
  подготовке accepted, после publication, после receipt и посреди chmod sealing.
  Только fully committed evidence переиспользуется; sealing_pending не запускает
  продукт повторно.
- Первое failure → разрыв перед attempt2; разрыв attempt2; healthy и seeded-broken
  remaining check. Retry/flaky правила, non-PASS и blockers не теряются.
- Changed plan/graph/catalog/source/authority → ноль target reads; changed target
  identity → только разрешённый identity read, ноль test dispatches.
- Concurrent owner, неподтверждённая смерть, живой descendant, поддельный handoff,
  пропавший launcher → отказ без duplicate dispatch/accepted publication.
- Missing/truncated/modified complete artifact, чужой файл, link substitution,
  duplicate completion, unsafe root → отказ, исходные bytes сохранены.
- Actual Kernel pre/post validation и actual reader принимают новый partial и
  terminal grammar. Строгие старые v0 cases продолжают проходить без миграции.
- Fresh reader отличает новый interrupted run от older PASS; повтор terminal
  resume не делает запросов. Raw private bytes не попадают в отчёт/manifest.

Нужны focused RED→GREEN, consumer/integration gates, независимое Lead AQA review
точных candidate bytes, совместимая Console/Kernel pair и cold source restore.
Только после этого обновляются bundles/manifest и entry docs. Никакого изменения
active pins, installed skills, продуктовых кампаний, Nuanu Flow или push продукта
в ходе разработки. Root packaging PASS отдельно от proof восстановления.

Связь с планом: [этап 3 глобального плана](../plans/2026-09-13-universal-qa-global-plan.md).
Исходный воспроизведённый разрыв: [campaign-continuation](../../../evals/campaign-continuation/README.md).
Следующий шаг после review этого документа — короткий implementation plan,
затем один end-to-end proof. Это не завершение всего этапа 3 или cloud readiness.
