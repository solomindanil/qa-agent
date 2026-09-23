# Сверка единого плана с прежними обязательствами — 23 сентября 2026

## Решение и граница

Пользователь попросил сравнить выводы cross-product аудита с прежним глобальным планом и оформить общий план реализации. [Единый план](../superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md) теперь задаёт порядок пакетов W0–W9; P0–P7 остаются именами прежних требований. Это объединение документации, не приёмка реализации и не запуск разработки/продуктовых кампаний.

Выбрано дополнение текущей архитектуры малыми независимыми пакетами. Альтернативы — только расширять prompt или переписать runner/storage — не обоснованы: часть правильных инструкций уже есть, а работающие механизмы и реальные field results сохранены. Новое необязательное направление — измеряемый model routing после baseline.

## Зафиксированные входы

Baseline root: `7aa1b2498875b498c4370c513065b4fe265d1fd6`, `codex/p2-semantic-source-delivery`. До изменения документов tracked дерево было чистым.

| Вход | SHA-256 до консолидации / disposition |
| --- | --- |
| [План16сентября с уточнениями20–22сентября](../superpowers/plans/2026-09-16-cross-product-qa-global-plan.md) | `df4377415fa90ac9b3d6232d1fe2c6e3e298ed880463ac2fe5d358f75e963a70`; не изменён |
| [97-пунктная сверка D10/D13](2026-09-16-global-plan-reconciliation.md) | `e98bddb77e26a3e154b8e4d7f96c19748cf9b4c27f990a84c3505452cc81ed98`; не изменена |
| Current entry до правки | `90f922d0bfed08e76a68d05cebc431c5383e68705e3988224f4367d09097beb7`; исходные bytes доступны в baseline Git commit |
| Roadmap entry до правки | `856ca6df2206ce2849023fb565fb4aa24f5f49b1462b48f31cfec5069f80acdd`; исходные bytes доступны в baseline Git commit |

Свежий `sources:verify` подтвердил Kernel `aa5d2d1`, Console `8065713`, Freeland `0ea2df1`; reporting10d неактивен. Source validation не доказала продуктовый PASS и не обновила кампании.

## Новые наблюдения и перенос в план

Разобрана доступная пагинация четырёх задач до конца: «Управляющая MagicPay» —83хода/23пустых, «Провести QA Nuanu App» —73/27пустых, закреплённая «Узнать текущий баланс» —222/51пустой, «Продолжить тестирование rw-int» —8ходов. Пустые items и усечённые outputs не считаются восстановленным raw transcript. Прочитаны выбранные локальные отчёты; более поздние результаты другого host не приписываются этим задачам. Выводы ниже — об организации QA, не о текущем состоянии багов продуктов.

| Наблюдение | Ограничение вывода | Перенос |
| --- | --- | --- |
| MagicPay: controller исправлял потерянный intent, оплата не доказывала email/invoice delivery | Короткое пустое inbox-окно не доказывает постоянный сбой email; контроллер не product backend | W1/W3 first attempt и отдельные delivered outcomes |
| MagicPay: запись20observations заняла около13,2минут; часть лишних чтений была у helper | Первую серию намеренно остановили после3записей, exit130 — не доказанный crash Kernel | W2b замер фаз и resumable caller, не новый storage |
| Nuanu: повторный простой smoke не закрывал сложный остаток; разные denominator смешивались | Есть полезные реальные проверки;100групп/128атомов/23native-NFR не складываются | W1/W6 remaining queue и missing assertions |
| Nuanu: device time использован до квалификации измерителя | Activity latency/provider FPS не доказывают useful-map performance | W5 capability/порог до длинного запуска |
| rw-int: AI-текст «сохранено», status202 и готовый пользовательский результат расходились | Часть багов могла быть исправлена позднее; актуальность требует отдельного retest | W1/W3 whole-result controls, reload/terminal/artifact |
| rw-int: ручной observation glue, source/build drift, не все новые риски связаны с исходным scope | Hash записи не аттестует реальное время capture; новая находка не получает чужой ID | W2b capture/readback, W4 reviewed binding/gap |
| Баланс: весь первый ход52,362с, MCP-вызов28,032с; позднее160явных heartbeat мониторинга | Scheduler/model/account errors не QA-core bug и не доказанная причина исчерпания лимитов | W0/W2b timings/точный tool route; W8 не обещает убрать provider latency |
| Freeland: cohort-specific VPN, quantity/quote, modal/hit/focus и provider-bonus варианты | Karing может быть допустимым legacy; «год+3» пока developer report, не независимая reproduction | W1/W3 grounded controls и contract-first recovery |

Сырые частные материалы остаются вне tracked delivery. Для понимания нового плана достаточно этой сводки и сохранённых qualification/eval records; доступ к чужой почте/чату не prerequisite клона.

## Переход A–G из нового предложения в старые требования

| Новое предложение | Старый смысл | Единая реализация |
| --- | --- | --- |
| A — meaningful outcomes | P2 semantic assertions, P5 test design | W1 первая пара/consumer, W3 reuse и варианты |
| B — states/prerequisites/остаток | P3 full/tickets/help, P5 fixtures | W1 operational slice, W6 отдельные live exits |
| C — evidence/entry friction | P1 observations, P6 snapshot/helper | W2a и W2b раздельно принимаются |
| D — agent-native/native | P2 content/lifecycle, P5 capability qualification | W3 агент как продукт; W5 Android/NFR отдельно |
| E — lesson в следующей проверке | P4 graph/regression/knowledge lifecycle | W4 без нового selector или memory DB |
| F — cross-product delivery | P5 actual execution/transfer, P6 cold dialogue | W6 и W7, baseline сW0 |
| G — Jev/model routing | Условный P5/P6 experiment | W8 после baseline, не вместо quality gates |
| Cloud не в ближайшем пакете | Сохраняется весь P7 | W9 после scopedW7 и отдельного experiment GO |

## Адресная сверка обязательств, которые нельзя потерять при сокращении

Нижняя таблица переносит смысл §5/§9/§10 прежнего P0–P7, включая97строк D10/D13 по прежней матрице. Она не пересчитывает чекбоксы в готовность и не удаляет требования, которые пока не имеют новых доказательств.

| Прежний gate/адресное обязательство | Что сохранено / статус сейчас | Пакет |
| --- | --- | --- |
| P0-integrity; M1–M5 | Bounded adopted repairs не повторять; защищать touched regression | W0/W7 |
| PAY01 UI/API composition/readiness | Source принято, shadow/live/receipt limits не сняты; binding≠acceptance | W0/W3/W7 |
| Safe command classes, local vs hosted CI | Local body уже есть; hosted result/прочие lanes отдельно | W7 |
| P1 observation и fresh reader | Writer/reader принято; text/JSON/zero attachments/unattested сохраняются | W1/W2b |
| P2 selected quote/rail/display/locale/delay | Caption и API oracles приняты; search-clear, real original path и варианты отдельно | W1/W3 |
| P2 effect semantics | Session/quote≠checkout; cancel/late/collision/partial по owning outcome | W3/W5 |
| P2-B confidentiality | Owner-deferred и unaccepted, не очередная ближайшая задача; guards не ослаблены | W7 scope boundary |
| P3-full inventory/clauses/new scope | Исходное/добавленное отдельно; полный известный denominator и timebox | W1/W6 |
| Live single-ticket vs live mixed-batch | Есть bounded subsets, не whole-ticketFIXED/complete mixed acceptance | W6 |
| Human reply→readiness→resume | Самостоятельный обход не ответ человека; ложное «готово» не запускает action | W6 |
| Interruption и unknown effects | Fresh context≠process interruption≠host restart; A/B/C и reconcile до retry | W1/W2b/W6/W9 |
| Tracker dedupe/template/readback | Отдельно разрешённая delivery, report-only без новых прав | W6/W9 |
| P4 mapped-unexecuted/clauses | Requirement/change coverage раздельны; B явно untested | W4 |
| Graph deletion/unmapped и null gain | Conservative fallback, actual selection/execution, нулевой прирост допустим | W4 |
| Lessons, quarantine, supersede/rollback | Product knowledge/campaign state/transferable method раздельны, история не стёрта | W4 |
| Obsidian derived view, duplicate case IDs | View из reviewed revision; TC-VPN-05 collision проверяется без rename старых receipts | W4 |
| P5 first attempt/hidden key/transfer | Контроли и метрики до запуска; prompt separation не фактическая blind isolation | W0/W6 |
| Agent-native content/job/MIME/intent | Actor выполняет сам; controller correction/ручная доставка отдельно | W3 |
| Fixture ID/role/owner/expiry; QA-H020 | Mailbox alias и stored-active не подтверждают нужную identity/активность | W5 |
| Payment scope/budget/refunds/same-ID | Отдельная qualification, не обязательная новая покупка/read-only prerequisite | W5 |
| Native/a11y/NFR/tool comparison | Existing pilot, actual method/threshold; сравнить один tool при recurring gap | W5 |
| P6 snapshot candidate a937/d272 | Reviewed inactive; current-pair applicability, absent/authored/CAS, no migration | W2a |
| Exact historical plan bytes | Сохранить до revision, readback после; не registration snapshot вместо истории | W2a/W7 |
| Thin graph/catalog/coverage authoring helper (D13-479) | Отдельное условное решение, не evidence-write helper: API/browser/manual authoring examples, dropped-blocker/wrong-binding, no generic manual receipt; no-new-code допустим | Отдельный checkbox/record W2b |
| Source/installed bundle и соседний повреждённый state | Полные references, targeted entry, без массового install/state copy | W0/W7 |
| Oversized API, Worker с/без deps, confidentiality | До acceptance затронутой расширяемой lane; не блокируют независимую safe lane | W7 |
| R0/R4 BOUND/UNCOMPUTED/computed-zero | Source lineage принято; не новый FIXED или live proof | W4/W7 |
| QA-H003 production topology | Full-only limits не ослаблять; source adoption не production GO | W0/W7 |
| Strict176/money/access/replay debt | Dated debt, не176новых багов; current owning readback при affected selection | W4/W5 |
| M6 generic manual receipt | Не используется observation shortcut; до нового consumer отдельный contract/expiry/kind repair | Deferred isolated API work, W0/W2 guard |
| Actual Codex/Claude, cold dialogue | Отдельные executions, mirror/root tests недостаточны | W7 |
| Три release decisions | QA scope/outcome, owner risk decision, deployment readiness отдельно | W6/W7 |
| P7 actual mounts/restart/delivery | Experiment GO до setup, operational GO до регулярности | W9 |

## Что действительно изменилось в приоритетах

- Следующий milestone — meaningful remaining execution W1, не повторный перенос writer или большой reconstruction baseline.
- Snapshot исправляется отдельным малым пакетом, не становится многодневной предпосылкой quality work.
- Evidence helper оценивается по фактической цене/ошибкам, не строится заранее; reader-capture diagnostic уже показал, что новый exporter не нужен.
- Native/NFR и agent-native разделены. Первый не блокирует web/API; второй не сводится к HTTP200 или tool success.
- Jev/Laya не заменяют P2/P3/P5. W8 может закончиться reject/no-adoption.
- Cloud, privacy-onlyP2-B, неиспользуемый M6 и отдельные effect lanes не удалены, но не тормозят независимый первый пакет.

## Review и проверка документации

Два независимых read-only аналитика отдельно сверили (1) no-loss P0–P7/legacy gates, (2) существующие source seams и команды. Главный агент прочитал исходный план/матрицу/current и внёс адресные obligations выше. Это внутренние отдельные контексты, не внешняя аттестация или приёмка кода.

Независимый Lead AQA/architecture reviewer отдельного контекста сначала нашёл один P2 documentation finding: старое graph/catalog/coverage authoring-обязательство D13-479 было смешано с новым observation append-helper. В W2b добавлены отдельные checkbox, API/browser/manual controls и record; matrix row исправлена. После targeted reread: **APPROVE, documentation only**, оставшихся actionable findings нет. Имя внутренней роли не означает внешнюю экспертизу; это не code/source/product/cloud GO.

Свежие проверки в этой задаче:

- `npm run sources:verify`: exit0, выбранные component bytes и роли подтверждены.
- Root `npm test`: exit0,61/61,0failed/0skipped, около34,48с; это packaging tests, не исполнение будущего плана или product QA.
- `git diff --check`: exit0.
- Локальная проверка двух новых документов:10относительных Markdown links существуют, W0/W1/W2a/W2b/W3–W9 присутствуют, незаполненных маркеров нет.
- SHA-256 двух исторических входов совпали с таблицей выше; они не переписаны.
- Main self-review: старые gates сопоставлены с пакетами, пятёрка Review Focus имеет controls в owning W, взаимно не подменяются live/synthetic, source/runtime и authoring/evidence.

Полные выводы команд и ответ reviewer сохранены в текущей задаче; отдельный переносимый raw-log архив здесь не создавался. Изменены только два новых документа и два active pointers; manifest, код и кампании не менялись. Документы ещё не являются результатом реализации W0–W9.
