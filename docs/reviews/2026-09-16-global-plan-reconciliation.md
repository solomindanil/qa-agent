# Сверка планов без потери обязательств — 16 сентября 2026

## Граница утверждения

Сверены [план 13 сентября](../superpowers/plans/2026-09-13-universal-qa-global-plan.md), [точный snapshot плана 10 сентября с дополнениями](../superpowers/plans/2026-09-10-universal-qa-next-plan.f49e739.snapshot.md) и [итоговый план P0–P7](../superpowers/plans/2026-09-16-cross-product-qa-global-plan.md). Это проверка переноса требований и критериев, **не доказательство их реализации** и не исчерпывающий аудит каждого исторического чата/коммита.

Два старых документа содержат97checkbox-записей: D13 —55 (14 помечены выполненными), D10 —42 (1 помечена выполненной). Пункты дублируются и некоторые checkbox отстают от последующих adoption-записей. Числа не означают97уникальных задач, общий процент готовности или15полностью принятых функций.

Перед сверкой зафиксированы bytes:

- D13 SHA256 `072bea250ed35fe304710cdfd76ec5de2814865a2bc9b466bfa6262e066e31db`.
- D10 SHA256 `f49e7397774763d6c6062a64705fa83be4b9cb6a7ea43aad59e18672738a3ed9` — содержит прежние пользовательские working-tree изменения; они не переписаны.

Столбец «Строки» — точные номера checkbox в этих snapshots, перечислены явно; grouped row сохраняет каждую перечисленную обязанность. Сквозной текст без checkbox сверяется отдельно ниже. P0–P7 и gate names относятся к итоговому плану, особенно §9. При изменении старого документа нельзя молча применять прежние номера/хеши. При переносимой поставке 20 сентября D10 сохранён byte-for-byte отдельно: mutable исходник не заменяет snapshot. Датированные статусы реализации в таблицах отражают ревью 16 сентября; текущие source/adoption результаты читаются через current checkpoint.

## D13: все 55 пунктов

| Документ | Строки | Обязательство | Куда перенесено / disposition | Доказуемый выход |
| --- | --- | --- | --- | --- |
| D13 | 224,225,226,227,228 | Browser guard, late finalize, CAS, parser, source adoption | Bounded adopted; §1/§9 legacy, совместимость P0/P6 | Не повторять внедрение; owning regression/readback при затронутом изменении, не автоматическая приёмка других lanes |
| D13 | 229 | Один current entry | P0-entry/P6 | Fresh actor находит source/runtime/owner/next action без старого чата |
| D13 | 247,248 | Тип продукта, поверхности, роли, дизайн, требования и гипотезы | P3-full/P5 | Product model и выбранные clauses с основаниями, agent-native обнаружен при discovery |
| D13 | 249 | Уточнить либо исследовать самостоятельно | P3 help | Короткий существенный вопрос/самостоятельный поиск; независимая ветка выполнена |
| D13 | 250 | Методы test design и quality attributes | P5 | Применимые границы/таблицы/переходы/инварианты с выполненными проверками и явными omissions |
| D13 | 251 | Существенный незнакомый путь, адаптация после наблюдений | P1/P2/P5 | Useful original-path outcome; bounded public-input механизм уже принят, целиком stage не закрыт |
| D13 | 252 | Evidence readback, диагностика, обход не FIXED | P1/P2/P3 | Actual reader и original-path result; fixture/harness/product разделены |
| D13 | 260 | Полный inventory, риск, неизвестное, timebox | P3-full | Original/additional denominators и каждый остаток объяснимы |
| D13 | 261 | Live QA tickets через выбранный tracker, AC и зависимости | P3-tickets | Реальный read/retest/related check; no mapping не разрешает необоснованный narrow scope |
| D13 | 262 | Mixed batch, QA gap не In Progress | P3-tickets/help | Fixed/broken/ambiguous/fixture/capability раздельны, нет ложного FIXED |
| D13 | 263,264 | Конкретная помощь, независимый прогресс, readiness после ответа | P3-help/resume | Ложное «готово» не запускает action; после проверки identity выполняется допустимый остаток |
| D13 | 265 | Реальное прерывание, remaining-only, unknown reconciliation | P3/P6/P7 | A done не повторён, B unknown сохранён/сверен, C pending выполнен; broader lanes квалифицируются отдельно |
| D13 | 266 | Понятный итог и authorized delivery | P3 | Result/gaps/owner/next action; dedupe/target/template/readback, неизвестная отправка не дублируется |
| D13 | 324,325 | Requirement→check→result/gap, reviewed update | P4 | Все существенные clauses учитываются; подтверждённое и proposal не смешаны |
| D13 | 326 | Actual consumer, missing edge/unmapped/format controls | P4 | Сохранены actual selection/execution и fallback; косметика не меняет смысл |
| D13 | 327 | Superseding knowledge, история и версии | P4/P6 | Новое знание не переписывает старый PASS; rollback сохраняет историю |
| D13 | 328 | Obsidian — производное представление | P4 | View соответствует принятой revision, не второй источник истины |
| D13 | 329 | Prod escape→regression→deployed retest→разбор | P4/P5 | Реальный цикл по известному escape; при отсутствии наблюдений не выдумывать дефект |
| D13 | 330 | Переносимые lessons/helpers, библиотека из повторений | P2/P4/P6 | Новый consumer/другой домен использует pattern; заранее все семейства не проектируются |
| D13 | 338 | Матрица functional/design/a11y/security/performance/reliability | P5 | Применимость, выполненное и неизвестное по отдельности |
| D13 | 339 | Agent-native intent/tools/errors/permissions/injection | P2/P5 | Product-agent исполняет задачу; QA не подменяет его; конечный outcome проверен |
| D13 | 340 | Product-owned fixtures: ID/role/state/expiry/ownership | P5-fixtures | Wrong alias/role/expired resource отклонены; правильный witness подтверждён |
| D13 | 341 | Отдельные money authority/budget/recovery/refunds | P5-effects | Same operation reconciliation, budget/owner, приватный refund inventory; no PAN/CVV; actual finance отдельно |
| D13 | 342 | Native/mobile/load/vendor по спросу, реальные границы | P5/P7 | Webview/mock не native/provider proof; разрешённый необходимый capability квалифицирован отдельно |
| D13 | 343 | Сравнить один tool при recurring gap | P5 | Одинаковые healthy/broken controls, detection/cost/rights; отсутствие улучшения допустимо |
| D13 | 351 | Actual Codex и Claude | P6 | Два исполнения отдельно; source mirror не второй host |
| D13 | 352 | Expired access/capability/build/соседнее повреждение | P3/P6-state | Stale помощь отклонена, здоровый target продолжает без чужих state/secrets |
| D13 | 353 | Product isolation, targeted reads, убрать legacy dependency | P6 | Cold работа без доноров; archives сохранены, credentials не скопированы молча |
| D13 | 354 | Другой домен, QA+graph+recovery | P4/P5/P6 | Реальный незнакомый consumer плюс controlled transfer, пределы сохранены |
| D13 | 364 | Experiment GO до cloud setup | P7 | Явные scope/host/actions/бюджет/доступы/stop criteria; отдельная authority |
| D13 | 365 | Isolation/cancel/timeouts/restart/failed delivery/late help | P7 | Реальный worker/mounts, bounded failures и recovery/readback |
| D13 | 366 | Сравнить dialogue/cloud, default read-only | P7 | Сопоставимые существенные outcomes; finance не добавляется автоматически |
| D13 | 367 | Identity агента, plugin delivery/readback | P7 | Actor identity и persisted delivery проверены; unknown outcome reconciled |
| D13 | 368 | Operational GO до регулярности/расширения | P7 | Не спутать запуск эксперимента с эксплуатацией; MCP только по deployment need |
| D13 | 468,469 | Retrospective, current pointers, fresh-reader control | Bounded completed, P6 повторяется только на новом source | Исходная qualification сохранена; новая запись не обнуляет ограничения |
| D13 | 470,471,472 | Browser journey source/adoption/fresh actor | Bounded adopted Console66; P2 защищает совместимость | Не внедрять afterOperationIndex снова; conditional consumer и неисполненные suffixes сохранены |
| D13 | 473 | English summary-oracle minor | P2 pending до reuse | Grounded locale/semantic control, false-count/cards negative; старый receipt неизменен |
| D13 | 474,475 | Mixed reasoning и actual execution controls | Bounded completed, P3 real exit остаётся | Старые первые ответы и3runs сохранены; не приписывать им live tracker coverage |
| D13 | 476 | Graph consumer pair D+C / D+C | Bounded completed, P4 benefit остаётся | Null result сохранён; новый реалистичный случай не подгоняется под желаемое расхождение |
| D13 | 477 | Registration-view candidate | Reviewed inactive a937/d272; P6 applicability/adoption | Absent/authored/CAS-revised reader; source selection отдельно |
| D13 | 478 | Historical reviewed V0 plan bytes | P6-state | До revision сохранены bytes/digest; после доступны в historical readback |
| D13 | 479 | Оценить thin typed authoring helper | P6 conditional decision | API/browser/manual + dropped-blocker/wrong-binding; no-new-code допустим; не новый CLI |
| D13 | 480 | Минимальные skill/readback/effect + actual graph update | P1/P2/P4/P6 | Accepted source + relevant controls + actual fresh consumer, а не отчёт |
| D13 | 481 | Незнакомый домен/host, затем cloud | P5/P6/P7 | Dialogue-ready declared scope → отдельный experiment GO |

## D10: все 42 пункта

| Документ | Строки | Обязательство | Куда перенесено / disposition | Доказуемый выход |
| --- | --- | --- | --- | --- |
| D10 | 70,71,72,73,74 | Новый полезный проход, design, test techniques/NFR, diagnosis | P1/P2/P3/P5 | Незнакомый реальный продукт, grounded expectations, реальные действия и остаток; Agentify/Freeland история не новый full PASS |
| D10 | 86,87 | Независимый key, все healthy/broken/ambiguous/blocked attempts | P0 baseline/P5 | Answer key до trials и вне доступа actor; первые ответы не заменены лучшими |
| D10 | 88 | Weak assertion, неверный outcome и рабочий обход | P2/P3/P5 | Original failure сохраняется; здоровая странность не становится багом |
| D10 | 89,90 | Skill-vs-tool repair и перенос без раскрытия эталона | P2/P4/P5 | Focused fix, неизменные counterexamples, новый held-out вариант |
| D10 | 100,101 | Full inventory и live QA-колонка | P3-full/tickets | Два actual workflow, не лишь schema/fixture tests |
| D10 | 102 | Live mixed scope отдельно от synthetic | P3 practical exit/P5 | Один реальный retest закрывает только bounded single-ticket workflow; отдельный live mixed-batch остаётся pending до соответствующего разрешённого прохода. Synthetic его не закрывает |
| D10 | 103 | Original path, related outcomes; нет baseline — нет RED→GREEN claim | P2/P3/P4 | Неизменный oracle на broken/fixed где доступны, иначе explicit limit |
| D10 | 104 | Authorized tracker write/dedupe/readback | P3/P7 | Реальная запись квалифицируется отдельно; нет собственного SDK ради чтения |
| D10 | 112,113 | Requirement clauses и useful graph selection | P3 pre-execution/P4 | Реальные причины выбора и выполненный consequential check |
| D10 | 114,115,116 | Mapping gaps, roles/states, minimal schema, Obsidian | P4/P6 | Удаление связи/unmapped сохраняет gap/fallback; owned revision и current view |
| D10 | 122,123,124,125 | Capability gap, один tool pilot, сравнение и adoption | P5 | Healthy/broken, first attempts, cost/evidence/cancel/wrong-scope; без tool shopping |
| D10 | 126 | Agent-native инструменты/намерение/ошибки/права | P2/P5 | Actual product-agent path с final deliverable, не работа QA вместо него |
| D10 | 127 | Merchant route, pending/decline/unknown и reconciliation | P5-effects | Связанный operation/readback; провайдерный бренд не integration proof |
| D10 | 133,134,135 | Реальная находка→regression→новый consumer | P2/P4 | Broken/fixed distinction, justified expectation, фактическое повторное применение |
| D10 | 136,137 | Три типа памяти, переносимость, supersede/rollback/quarantine | P4/P5 | Product/operation/method раздельны; owner/review date, history и capability limits сохранены |
| D10 | 143,144 | Свежие hosts и interruption/identity/help | P3/P6 | Два host proof отдельно, same-host bounded recovery не host restart |
| D10 | 145 | Метрики agent detection/false claims/skips/flakes/time/human/escapes | P5 | Раздельные raw denominators, все attempts, unknown escapes не0 |
| D10 | 146,147,148 | Dialogue-ready review → scoped cloud → сравнение | P6/P7 | AQA/operations review, отдельные experiment/operating GO; доступный host достаточно для пилота |
| D10 | 174 | R0 single-ticket binding и QA-H003 | §9 legacy/P3/P6 | Source R0 ancestor текущего3ee, H003 adopted; BOUND≠FIXED и full-only limits защищены. Не переносить старое pending как новое |
| D10 | 175 | R1 local continuation | Bounded completed, P3 расширяет | Исторический fresh reader не повторяет invoice; не general reliability/Claude proof |
| D10 | 176 | R2 evidence sufficiency/6 reasoning controls | Bounded interpretation completed, P5 execution/transfer остаются | Сначала минимальное достаточное evidence;6/6не blind/general score |
| D10 | 177 | R3 effects/readiness/cancel до affected action | P0/P2/P6 | Background/late/collision/partial controls; historical unknown неизменен |
| D10 | 178 | R4 graph trace, UNCOMPUTED vs computed-zero, adopted delivery | §9 legacy/P4 | d90 ancestor текущего3ee; renderer/control присутствуют. Реальная польза графа и graph debt не закрываются source adoption |

## Сквозные обязательства из текста, не checkbox

| Источник | Обязанность | Итоговый gate / disposition |
| --- | --- | --- |
| D13§1; D10 Global Constraints | Agent-first, qa-agent self-contained, existing engines, Freeland read-only | Общие ограничения + P6 cold delivery; без второго runner/verdict/SDK |
| D13§1/§6; D10§3 | Freeze inputs, one writer, исходные артефакты/история, scoped authorizations, main исполняет | Общие ограничения и каждый accepted slice; не тайная миграция/массовый install |
| D13§2/§5; D10§1/§6 | Graph с первого прохода; quality of agent ≠ tool tests ≠ product QA | P3 pre-execution/P4/P5, раздельные receipts/trials и denominator |
| D13§5; D10§2/§6 | Interpretation/execution/transfer, exact model/host/source/tools, retries/skips/mutations | P5 trial record и cold consumer; surviving/invalid negative controls видимы |
| D13§7.1; D10§6 | Product-owned auth/quote effects и safe readback | P2 effect semantics; admission collision не product bug |
| D10§6 | QA-H020 loginEmail/mailboxAddress, expiry, acceptance conflict | P5 fixture controls; историческое наблюдение, не новый bug claim |
| D10§6 | Same-ID checkout continuation, fixtures и refund list | P5-effects; отдельный actual finance gate, не prerequisite read-only universal QA |
| D13§4/§5; D10§2/§3 | Growth via proven regression/knowledge; quarantine; rollback; negative oracle controls | P2/P4/P5, не auto-weakening и не train weights |
| D13§6; D10§3 | Parallel ownership/review, Claude optional, no endless fix-loop | §6/§9 dependency order; отдельная приёмка срезов |
| D13§8; D10§4 | No giant rewrite/ML/vectorDB/multiframework; gaps not universal block | §7 non-goals; read-only pilot может быть принят без money/native debt closure |

## Где предыдущая новая версия была недостаточно точна

Приоритеты и крупные стадии не потерялись, но явных задач/выходов недоставало для fixtures/aliases/expiry, payment authority+refund inventory+same-ID recovery, live ticket gate, методов test design, clarify-or-investigate, проверки после human reply, соседнего повреждённого проекта, locale-minor, authoring-helper decision, plan-history readback и legacy statuses. Эти детали возвращены в существующий P0–P7 план, не стали ещё одним движком.

**Не исключено ни одного содержательного обязательства из двух сверенных планов.** Это заключение о соответствии плана: выполненные bounded slices сохранены; inactive candidates названы отдельно; остальное имеет очередь и gate. Оно не означает, что все obligations выполнены, что нет иных неизвестных требований или что все виды продуктов поддерживаются сейчас.

## Проверка самой сверки

- Main перечитал старые checklist, legacy additions и сквозные ограничения; отдельно проверил manifest/source identity.
- Lead AQA и CTO независимо нашли ослабленные обязанности; их конкретные поправки включены в текст.
- Механический контроль сравнивает перечисленные номера с реальными checkbox обоих точных файлов: missing=0, duplicate=0, extraneous=0. Это проверяет полноту ссылок, а не истинность реализации.
- Финальная семантическая сверка Lead AQA и CTO — APPROVED после двух поправок: live mixed-batch остаётся отдельным обязательным выходом; новая ветка/конфликт предусмотрены в controlled fixture, но не выдумываются при live QA. Наличие номера в таблице само по себе не доказывает сохранение смысла или реализацию.
- Никакие product/tracker actions, implementation/adoption, commit или push этой сверкой не выполняются.
