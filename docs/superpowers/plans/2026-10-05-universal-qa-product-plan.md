# Глобальный продуктовый план qa-agent: исследование, E2E, память, инструменты и UI

> Публичная навигация: исходная принятая редакция имеет SHA256 `4f19bb7119f7b48df53d6287d56bf804a7a1589a465f018930f8b6365a72f782` (provenance, не hash нынешнего файла). Сохраняется та же очередь из 51 активной и 9 deferred MCP-карточек; уточнение пользователя 9 октября меняет процесс §6 и ближайший приоритет §12, не exits или чекбоксы. Разделы 1 и 14 — датированные наблюдения, не актуальные source pins или разрешение на действия. CURRENT означает единственную [текущую проекцию квалификации](../../qualification/current.md). Недоставленные исторические источники ниже не восстанавливаются по памяти и не заменяют недостающие evidence; при реальной зависимости нужно разрешить именно тот источник.

> **For agentic workers:** использовать подходящий действующий workflow для принятой карточки. Архитектурные/API/schema/lifecycle/dependency решения — настоящий Astra; код и локальные проверки — actual Sol 6.1, не Sol 6; независимый AQA не является автором реализации. Чекбоксы отмечаются только по сохранённому результату. SuperSkill не используется.

**Goal:** пользователь передаёт запрос проверить весь продукт, область, tickets или документацию — в том числе продукт без исходных документов — и границы проверки в один понятный QA-контур («бокс»), а получает сохранённый отчёт: что проверено, как, почему, с каким результатом и что осталось непроверенным. Внутри агент проектирует и выполняет содержательные проверки; UI показывает те же факты. Пользователю не нужно вручную собирать внутренние задания и пути. Контур сохраняет проектные знания и пригодные исполняемые проверки, ускоряет повтор и умеет в согласованном объёме создать/квалифицировать недостающий инструмент.

**Architecture:** один lead принимает QA-решения; ограниченные специалисты используют существующие browser/API/автоматизированные проверки. Console/Kernel либо выбранный product specialist остаётся владельцем состояния и evidence. Один документированный вход связывает запрос с этим workflow. **UI qa-harness становится основным интерфейсом мониторинга и итогового отчёта**; в него добавляются Graph/Coverage и полезные недостающие возможности нашего UI. Он поставляется через существующий Console-контур и читает факты его owner; второго store, runner или Python backend нет. MCP — возможный поздний транспорт, не обязательная часть бокса.

**Tech Stack:** текущие Node.js/TypeScript/React Console, Kernel, Playwright/API capabilities; React-приложение qa-harness как UI-основа, Graph/Coverage из Console. Конкретные версии существующих владельцев задаёт manifest. Совместимость UI dependencies/build фиксируется в U00, а не общей заменой lockfiles. `packages/qa-agent-local` сохраняется как необязательный интеграционный актив.

**Spec — private historical references, not delivered in this public carrier:** целевой product design (`../specs/2026-10-05-universal-qa-product-design.md`) и глубокая сверка двух реализаций (`../../reviews/2026-10-05-qa-product-source-comparison.md`); сохранённые grounded obligations (`../specs/2026-09-29-grounded-obligations-quality-design.md`), отложенный точный MCP plan (`2026-09-29-mandatory-local-mcp-implementation.md`), преемственность 1 октября (`2026-10-01-universal-qa-quality-throughput-global-plan.md`) и 2 октября (`2026-10-02-universal-qa-atomic-plan-with-local-ui.md`). Этот документ заменяет как очередь ранний integrated-план 5 октября (`2026-10-05-universal-qa-agent-integrated-plan.md`), сохраняет все его 37 ID и добавляет 14: I01–I03, K01–K02, S01–S02, T00–T03, Q07, E05–E06. При конфликте очереди действует этот документ; принятые результаты и ограничения прежних execution cards не переписываются. Последнее уточнение пользователя отменяет обязательность MCP для текущего продукта, не отменяя квалификацию отдельного транспорта, если его позднее выберут.

Исходная редакция: 5 октября 2026, Asia/Makassar; уточнение пользователя и очереди — 8 октября 2026 (§14). Это тот же единый **глобальный план реализации** и та же ACTIVE цель, не новый проект и не утверждение о выполнении карточек. Исходный planning-only/paused статус исторический; текущая реализация продолжается по принятому конкретному дизайну и действующим полномочиям. Product/MCP, установки и публичные действия не разрешаются автоматически изменением приоритетов.

Карточки — небольшие принимаемые результаты, а не разрешение написать произвольный API. Для изменяемого контракта/семантики применимый exact design фиксирует файлы, signatures, различающие controls и команды; обычная механическая правка в принятом контракте не требует нового design. Приёмка дизайна и выполнение/поставка различаются; принятая работа остаётся accepted в исходных bounded qualification. Актуальные bounded результаты и local/public/installed/frozen различия — в CURRENT; ниже не выставляются чекбоксы по одному уточнению очереди.

## Global Constraints

- Один owner каждого результата; UI/профиль роли/граф не создают альтернативного verdict. Существующие кампании сохраняют свои frozen runtime и источник полномочий.
- Агент выбирает ожидания, классы эквивалентности, риск и диагноз; код проверяет идентичность, наличие/актуальность evidence, согласованность наборов и сохранение. Разные модели не доказывают независимость ожиданий.
- No-doc — штатный режим с первой вехи, не отсутствие требований вообще: raw brief, явные обещания UI, контракты, подтверждённые инварианты и обоснованные metamorphic relations могут дать oracle. Agent-generated описание наблюдения само по себе его не даёт. Неизвестное business rule остаётся unknown; граф направляет поиск, но не ограничивает исследование известными узлами.
- Chat и заранее ограниченный headless запрос используют тот же agent-first процесс и owner; отдельный LLM-service не нужен. Критически недостающие входы дают явный PARTIAL/WAIT с checkpoint и условием продолжения, не выдуманное требование или бесконечное ожидание; независимая разрешённая работа продолжается.
- Знания/скрипты переиспользуются по applicability, не старый PASS для нового build/request. Ускорение не отменяет discovery неизвестных областей и independent omission review.
- Новый run-local helper допустим внутри принятого authoring/effect scope; reusable adapter получает однажды принятый extension seam. Core verdict/owner policy QA-worker сам не меняет. Активная identity не hot-swapped: checkpoint → qualified revision → новый segment.
- Полный известный scope сохраняется независимо от числа созданных tests. Failed assertion может быть выполненной проверкой; blocked/unreached/unknown не являются выполнением.
- MCP не входит в критический путь и не нужен для приёмки бокса. Используется один поддержанный существующий owning route. Возможности и ограничения реально выбранного host/способа запуска проверяются; отсутствие MCP не маскирует отсутствие browser/API capability.
- Изолированная рабочая копия для реализации, сохранение чужих незакоммиченных изменений. Активный `qa-harness-react` Claude checkout не переключать, не собирать и не перезапускать. Последнее UI-уточнение пользователя выбирает основной donor UI целиком, а не только отдельные карточки внутри старой Console-навигации.
- На один принимаемый implementation result — один небольшой PR, self-review и ONE итоговый author-distinct AQA actual diff/results вместе с применимым carrier, проверка base/conflicts, разрешённый push и собственный CI/readback. Merge не автоматический. Неизменные доказательства переиспользуются; оптимизация обязательного CI — отдельное изменение, не обход текущих gates. Docs/design/eval-only не требуют искусственного PR на каждую запись.
- First attempts и отрицательные результаты сохраняются. Повторяют затронутые проверки, а не всю историю. Новый контроль не переименовывается в первый удачный запуск.
- Новый точный контракт карточки фиксируется до её кода: поля/функции/владельцы, fixtures, команды и ожидаемые результаты. Это результат design-карточки, а не приглашение исполнителю придумать API по заголовку.
- Сложные CTO #5/#6 остаются отдельным execution scope; зависимые ограничения не обходятся. Отложенные financial/privacy/history решения не становятся новой основной программой.
- P0–P7, W/Card lineage, STOP/NO-ADOPT и незакрытые exits сохраняются через матрицу ниже. Универсальное 100% качество или полнота всех неизвестных требований не заявляются.

## Review Focus

1. Case существует, но решающий assertion не достигнут: Q04/Q05 оставляют outcome непроверенным.
2. Compound requirement проверено частично: Q01/Q04/Q06 не закрывают вторую clause успехом первой.
3. Cycle завершён по лимиту, UI показывает DONE: G10/U02/E03 отделяют остановку, полноту QA и решение о продукте.
4. Два агента используют общую сессию/данные или возвращают дубли: A01/A02/O01 проверяют ownership и фактическое перекрытие интервалов.
5. Stale run, другая среда, missing cost либо отсутствующие события: Q05/U01/U02/O00 сохраняют binding, availability и неизвестность.
6. No-doc, stale docs, hidden flow и self-authored oracle: Q01/K01/K02/E06 исключают круговое подтверждение и пустые 100%.
7. Cached knowledge/script прикрывает новый request/build/роль: I01/S02/E05 требуют актуального исполнения и scope reconciliation.
8. Helper возвращает success, но ничего не измеряет: S01/T01/T02 проверяют broken control, независимый oracle и owning result classification.

## 1. Зафиксированная исходная точка

| Источник | Состояние при чтении | Значение для плана |
| --- | --- | --- |
| qa-agent integration | `quality-mcp-clone`, `codex/quality-mcp`, HEAD `378f9f778420c431d256a2f1df61ac216a4377b9`; remote `6559cf0b6141441463eaac1f2164ff95408cae93`, 24 локальных коммита впереди | Код и плановые документы ещё не равны публичной поставке; исходный `projectsnew/qa-agent` не integration target |
| Selected pair | Kernel `847777a7a87c55a7648ac155da2e18d6593aa16a`, Console `014940a4a59cd9c6f51add59acde710cfdbaa1ba`; полный manifest отдельно | Последняя проверка source pins успешна; принятые результаты остаются bounded |
| qa-harness remote | `develop` и `main` `7bd00f9e004849ae37c77161ec388f9fe24b7353` | Fresh remote read; локальный main checkout открыт на старой feature-ветке и не служит baseline |
| qa-harness runtime donor | `7bee1561c90fb0b8145c3860e74b41d4c12905ce` | Единственный следующий commit `7bd00f9` меняет CONTRIBUTING/PR template/CI base policy; исследованные runtime-файлы совпадают |
| React UI donor | `qa-harness-react`, `feat/dashboard-react`, `58bd0d20bff1ae84196f98963cecabdf4e1b1d66` | Отдельная, более новая UI-ветка; source pin не заменять автоматически на develop |
| G01/Q1 | [PR #2](https://github.com/solomindanil/qa-agent/pull/2) OPEN, head `7baf1e402fc32614026cb4da22ae65fdee019f03`, base `codex/stable-20260926` | Документ готов; consumer NOT ADMITTED. N01 решает только актуальный written packet и affected delta |

Принятые foundations не повторяются: W0/W1 bounded work, W2a, source guards, API/intermediate assertions, D13 helper, CTO quick wave и MCP Tasks1A/1B/2. Не завершены общий качественный full QA, весь MCP/host путь, универсальная переносимость, mixed help/resume и доказанное ускорение routing.

### Что действительно переносим из qa-harness

- Structured project knowledge, list-before-add/reuse IDs, authored automation и сохранение результатов — с более строгой актуальностью scope/oracle/script/evidence. Narrative dossier добавляем явно: отдельный его генератор в исследованном donor core не найден.
- Ролевые задания, зависимости, ограниченную конкурентность, отдельную проверку findings, объяснимые phase gates и основной UI мониторинга/отчёта; дополняем его Graph/Coverage и недостающими полезными возможностями нашего UI.
- Негативные fixtures и алгоритмы сверки, если совпадает контракт. Существующие owner checks qa-agent также используются, вместо копирования всего Kernel в harness.
- Статический выбор модели по роли, с реальным trace модели/CLI и ограничениями capabilities.

В runtime donor восемь профилей; mission concurrency по умолчанию 2, диапазон 1–8. Один Codex login сериализует сессии через lock. Модель выбирается per-profile; автоматического fallback/escalation router нет. Codex adapter возвращает cost/turns=0 без измерения — это UNKNOWN для нашего анализа. Scheduler работает группами ready tasks; изменение его эффективности не является задачей qa-agent. Любой будущий donor PR следует актуальному `CONTRIBUTING.md`: base develop, ADR для дизайна, исходная метрика проблемы, required checks и scripted cycle для изменения поведения.

## 2. Архитектурное решение и ранняя полезная веха

Выбран путь: **запрос → один lead/owner → задания host-агентам и существующие capabilities → evidence/проверка пропусков → основной qa-harness UI (мониторинг + отчёт), дополненный нашим UI**. Это рабочий контур в одном поддержанном окружении, не требование сейчас создавать автономный cloud-сервис. Модель и инструменты могут предоставляться текущим host; точные prerequisites должны быть понятны. Принят перенос UI, но не миграция backend на CAMP и не отдельная копия его Python orchestrator/store. Такой backend может изучаться только отдельным будущим экспериментом с единственным управляющим owner. Ни у одного проекта universal/full E2E не квалифицирован; у qa-harness есть реальные E2E, но high-level oracle gate требует DocAnchor, а у qa-agent sealed general campaign пока ограничен public read-only kinds.

Первый результат — одна bounded journey family **без исходной продуктовой документации**, с сохранённым dossier и применимым квалифицированным инструментом; новый run-local helper нужен только при реально обнаруженном gap. Пользователь один раз задаёт запрос через документированный вход; контур проходит требования → готовые данные → конечный outcome → пропуски → persisted owner readback → читаемый отчёт и экран результата. Не нужны внутренние IDs и ручная сборка отчёта. Последовательные demonstrations дают полезный промежуточный результат, не ослабляя полный V01. Synthetic controls доказывают механизм; полезность на продукте требует отдельного разрешённого bounded consumer с обоснованным oracle.

### Минимальный контракт бокса

| Граница | Обязательный смысл, не новый формат API |
| --- | --- |
| Вход | Режим full/subscope/tickets/docs; продукт/URL либо репозиторий/стенд; краткая цель, доступные требования и источники (документы optional); что проверить и исключить; среда/версия если известны; ограничения действий/времени; ссылки на доступные роли/данные без секретов; прежний результат при продолжении |
| Разбор | Lead выделяет проверяемые обязательства и причины выбора; неизвестные ожидания/доступ не выдумывает. Независимая доступная работа продолжается при локальном blocker |
| Работа | Один поддержанный entrypoint направляет в существующий owner, сохраняет идентичность запуска, выполняет разрешённые packets, проверяет findings и omissions; остановка сохраняет результат и остаток |
| Выход | Краткий итог и для каждого обязательства: что/как/почему, ожидаемое/фактическое, evidence, версия, статус и причина. Отдельно подтверждённые баги, сомнения, непроверенное, ограничения и следующий шаг; фактическое время/измеренная стоимость либо UNKNOWN |
| Доступность | Один и тот же run доступен как текущий мониторинг и итоговый/повторно открываемый отчёт в основном UI; сохраняемый/exportable результат представляет ту же report model. Нет доступа к продукту — честный blocked/partial report, а не имитация выполненного QA |

«Почему» — это ссылка на требование, риск и основание вывода, не раскрытие внутреннего хода рассуждений модели. Documentation-only имеет documentary outcome, не product PASS. Ticket import сохраняет исходные IDs/revisions/AC, truncation и неполученные items; ничего в tracker не меняет. Plain-language ввод допустим; обязательный новый DSL, публичный API и автоматические интеграции не нужны. Точный вход и формат выхода выбираются в B00 из уже существующих возможностей.

Lead и специалисты остаются агентами: они решают, что исследовать и какой вывод делать. Детерминированные гейты не заменяют эти решения; они проверяют, достаточно ли фактов для заявленного перехода/вывода.

## 3. Последовательность гейтов проверки продукта

Это семантический контракт для D01/G10, не добавленный сейчас runtime enum/API. Проекция строится из existing owner state. Она различает **готовность попытки**, **допустимость следующего действия** и **доказанность QA-результата**. Один `passed` не заменяет эти три вопроса.

| Gate | Что должно быть известно | Что разрешает | Что оставляет открытым |
| --- | --- | --- | --- |
| G0 Scope | Продукт/среда/версия, согласованный scope, источники требований, известные gaps | Исследование выбранной области | Полноту неизвестных требований |
| G1 Discovery/design | Роли, состояния, переходы, обязательные outcome clauses, oracle и cases либо причины отсутствия | Подготовку/исполнение готовых packets | Design coverage не execution coverage |
| G2 Readiness, на packet | Нужная роль, ресурс, состояние, capability и наблюдаемый результат | Только готовый packet; независимые packets продолжаются | Login/HTTP200 не готовность всех flow |
| G3 Execution | Актуальные результаты достигнутых assertions, все обязательные clauses и непроверенный остаток | Investigation и дальнейшие независимые проверки | Failed precondition не закрывает downstream assertion |
| G4 Investigation | Классификация product/test/environment/data/oracle; evidence и воспроизведение конкретного claim | Независимую проверку кандидата | RED test не автоматически product bug |
| G5 Independent review | Проверка claims и отдельная сверка исходного scope с выполненным; найденные omissions возвращены в очередь | Следующий missing packet либо подготовку отчёта | Согласие двух моделей не oracle |
| G6 Report closure | Все обязательства имеют disposition, claims привязаны к текущему evidence; duplicates/conflicts/blocked/unknown видимы | Достоверный полный или явно неполный отчёт | Budget exhausted/DONE не QA success и не production Go |
| G7 Evaluation, только оценка harness | Frozen результаты и отдельный eligible reference set или held-out protocol | Решение об adoption изменения | Golden set не участвует в runtime gap calculation |

В CAMP дизайн уже содержит эту полезную последовательность, но его пороги flow/rule coverage относятся к traceability. Его `converged OR exhausted` позволяет завершить verification и сообщить остаток. Эти значения не копируются как доказательство полного QA. Для нашего declared full scope пропуск обязательного outcome остаётся незакрытым даже при завершённом цикле; обоснованное исключение версионируется и показывается отдельно.

## 4. Метрики и условия принятия

- `U`: зафиксированные применимые outcome obligations текущего scope, существующие независимо от cases.
- `V`: obligations, у которых все обязательные проверки достигнуты и имеют достаточную актуальную привязку/evidence. PASS и FAIL assertion могут подтверждать выполнение; продуктовая корректность считается отдельно.
- Качество discovery отдельно от execution: исходные источники/роли/известные transitions, reviewer omissions и неизвестные области. Нельзя уменьшить U из-за отсутствия инструмента/документа. E06 сравнивает current/no/stale-conflicting docs.
- Доля без подтверждённой проверки: `|U − V| / |U|`; при пустом U — N/A. Выдаются конкретные IDs и причины. Нет новых данных — UNKNOWN, не ноль.
- Reasons фиксируются в D01: отсутствие case, не запускалось, blocked precondition, assertion не достигнут, stale/unbound evidence, неполные данные инструмента. Это проектируемые диагностические категории, не существующий публичный API.
- Отдельно: источники без разбора, unknown oracle, false/unsupported confirmations, duplicates, rework, intervention, first-observation→verification→report latency, setup/agent/tool/review/полное walltime.
- Фактическую стоимость показывать только с источником учёта; иначе UNKNOWN. Сумма параллельных agent minutes не walltime. Сравнение не смешивает model/build/data/oracle revisions и реальные/scripted прогоны.
- Цель оптимизационного пилота: ≥20% уменьшения полного walltime либо измеренной стоимости **без нового miss любой тяжести и снижения recall; абсолютный quality gate — zero false/unsupported confirmations** на сопоставимом наборе. Одинаковое ненулевое число ложных подтверждений в baseline/candidate не допускает adoption. Оба показателя публикуются; при недостатке данных — INCONCLUSIVE. Проверяются и неподтверждённый PASS, и необоснованно подтверждённый баг.
- Tool Shop: цель 100% принятого применимого достижимого known set; 72/72 только если именно 72 подтверждены exact manifest. Около 90 findings и около 3 часов — исторический ориентир, не denominator. Warm 3h — цель сопоставимого эксперимента; cold setup отдельно.

## 5. Карта исходников и проверок

Пути qa-agent ниже относительны integration root, child edits выполняются в изолированном successor child с source closure через manifest/bundle. Donor UI пути относительны `qa-harness-react`. Это ownership map; D01/U00 уточняют только минимальные новые файлы и signatures своей реализации до RED.

| Поверхность | Существующие файлы | Проверяемая граница |
| --- | --- | --- |
| Scope/graph/catalog | `components/kernel/src/contracts/{product-graph,coverage-registry,test-catalog,campaign-plan}.ts`; `components/kernel/src/kernel/test-catalog.ts` | `tests/contracts/five-contracts.test.ts`, `tests/registration/catalog.test.ts` |
| Plan/assertions/outcomes | `components/console/src/lib/{qa-campaign-v0.ts,campaign-outcomes.mjs}`; `src/node/playwright-campaign-adapter.ts` | `tests/unit/{qa-campaign-v0,browser-journey,campaign-outcomes}.test.ts` |
| Evidence/current/history | `components/kernel/src/kernel/target-observation-report.ts`; `components/console/src/lib/agent-observations.ts`; `server/campaign-receipts.mjs` | Kernel `tests/kernel/target-observation-report.test.ts`; Console `tests/unit/{agent-observation-view,qa-agent-observation-pair}.test.ts` |
| Current Console data owner + contributed pages | `components/console/server/bridge.mjs`; `src/lib/{live,types,workspace}.ts`; `src/App.tsx`; `src/components/{rail,overview,graph,runs,coverage,plan,verdict,findings}/` | `tests/unit/{agent-observation-bridge,agent-observation-view,bridge-cli-authority}.test.ts`; Graph/Coverage adapter/UI controls; старые экраны не второй primary UI |
| MCP | `packages/qa-agent-local/src/{release,read-view}.mjs`; planned exact `owner-cli.mjs`, `owner-read.mjs`, `mcp.mjs` | Existing `test/{release,workflows,read-view,mcp-read}.test.mjs`; named future owner/read/write tests from MCP plan |
| Task-oriented discovery | `skills/qa-check/SKILL.md`, `skills/README.md`, `docs/qualification/capabilities.md`, selected specialist references | Fresh-context request + route/availability controls; installed skill отдельно |
| Donor primary application | `packages/dashboard/web/src/App.tsx`; `lib/api.ts`, `hooks/useControlTower.ts`, `engine/`; `views/{Overview,Kpis,TimelineTab,SessionDrawer,Header}.tsx`; `views/approvals/Evidence.tsx`; `components/ui/`; `evolution/` | Donor `src/engine/engine.test.ts`, `views/{banner,sweep}.test.ts`, `views/approvals/logic.test.ts`, `evolution/logic.test.ts`; live→final→reopen and Graph/Coverage binding |
| Donor boundaries, reference only | `packages/gating/src/th_gating/service.py`, `packages/orchestrator/src/th_orchestrator/service.py`, `packages/agent-runtime/src/th_agent_runtime/{config,sandbox,codex}.py`; dashboard `server.py`, `model.py` | Exact commit content, fixture semantics; не новый qa-agent backend |

Исполняемые focused команды выбираются по этой карте и изменению. В child Console: `node --import tsx --test tests/unit/qa-campaign-v0.test.ts tests/unit/browser-journey.test.ts tests/unit/campaign-outcomes.test.ts`; UI/type changes: `npm run typecheck`, `npm run lint`, isolated build. Console default `npm test` запускает Playwright и не является generic offline smoke. Kernel: `npm test -- tests/contracts/five-contracts.test.ts tests/registration/catalog.test.ts`. Root: `npm run sources:verify`, affected packaging tests. Для donor candidate web: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` только в изоляции; его Vite build очищает/пишет Python static. Команды здесь — план, не результат нового запуска.

## 6. Общий цикл каждой реализации

Уточнение пользователя 9 октября: один законченный функциональный срез, не PR на каждый внутренний подшаг. Одноимённые inputs — сохранённые выходы прежних карточек; их принятие не повторяется. Нормальный цикл: применимый принятый дизайн → реализация → релевантные проверки → саморевью → ONE независимый AQA → PR → доставка.

- [ ] Зафиксировать owner/base/head, scope, затронутые файлы/контракты и пользу следующему consumer. Новые архитектурные/API/schema/lifecycle/dependency или неразрешённые semantic решения принимает actual Astra до кода; обычное исправление внутри принятого контракта не требует нового design/review каждой команды.
- [ ] Actual Sol 6.1 реализует минимальный diff и affected checks; сохраняет FIRST ошибку/логи и точную tested identity. Обычную ошибку собственного скрипта исправляет ограниченно без нового согласования каждой команды. Assertions, negative controls, полный remainder и unknown не ослабляются.
- [ ] Self-review всего actual diff/results → одно author-distinct actual Astra AQA вместе с необходимой source/package closure. Исправления смотрит тот же reviewer только в affected области. Не создавать отдельные полные source, packaging и документационные приёмки; неизменённые предпосылки/доказательства переиспользуются.
- [ ] Один PR содержит законченный результат и необходимую совместимую поставку. Проверить actual remote base, source/package closure и конфликты; разрешённые push/PR, собственные применимые hosted gates и readback не заимствуют прежний PASS. Изменение CI policy принимается отдельно; до доставки действующие gates не обходятся.
- [ ] Независимую подготовку следующего среза можно вести в изолированной копии во время CI. Общие изменения и merge последовательны; один observer на CI, сообщения только о доставке, существенном результате, ошибке или необходимом участии пользователя.
- [ ] Обновить один CURRENT кратко: что пользователь может сделать, implemented/verified/delivered/blocker/next, first attempts, остаток, реальные времена реализации/проверок/review/CI и причины повторов. Не требовать новую per-slice qualification, hash-ledger, метрики или acceptance-only commit; exact source и FIRST остаются доступны. Неизвестные время/usage/cost — UNKNOWN, ускорение требует сопоставимого измерения.

Строгий frozen benchmark нужен для отдельной оценки самостоятельности агента, не каждой обычной разработки. Полезность проверяет сквозной consumer: понимание задачи, содержательные проверки, отчёт/UI и fresh continuation. CI GREEN не является product QA PASS. Не создавать full-run ради helper или новой этикетки; NO-NEW-CODE допустим при достаточном existing behavior и релевантных evidence.

## 7. Волна 0 — одна точка входа и точный следующий срез

### N00. Очередь, owners и доставка
**Выход:** один active plan, таблица local/public/installed/frozen; принятые изменения и непоставленные коммиты имеют явный статус. **Files:** `AGENTS.md`, `docs/roadmap/README.md`, `docs/qualification/current.md`, manifest и соответствующие PR metadata.
- [ ] Сверить source/remote/UI pins, полный diff и existing checkpoint; сохранить чужие изменения.
- [ ] Отметить accepted/prepared/pending/deferred/STOP по матрице раздела 12; источники и внутренние credentials не смешивать с delivery.
- [ ] Проверить один entrypoint и source closure; подготовить scoped delivery, не публиковать весь backlog автоматически.
**Control/exit:** следующий агент однозначно выбирает актуальный owner; старый cwd/branch не становится runtime. Публикация — отдельный deliverable со своим readback, анализ её не закрывает.

### B00. Точный контракт входа и выхода бокса
**После:** N00. **Files:** existing `qa-check`, selected owner workflow, Console intake/report paths; один scoped design рядом с existing specs.
- [ ] Astra выбирает один уже поддержанный host-native entrypoint, plain-language brief/существующий input format, место сохранения результата и способ его открытия; фиксирует exact signatures/files/tests только для реально недостающего glue.
- [ ] Зафиксировать full/subscope/tickets/docs и no-doc semantics, первоначальный список items/clauses, версию запроса и способ продолжения; никаких обязательных документов для discovery.
- [ ] Сопоставить поля входа и каждой строки отчёта с существующими owner данными; требования/риски/oracle должны объяснять выбор проверки и вывод. Отдельно разобрать отсутствие доступа, неизвестную версию и повторное открытие результата.
- [ ] Независимый AQA проверяет вход без контекста, неполный brief, ambiguous oracle, недоступный инструмент и отсутствие внутренних path hints.
**Exit:** один конкретный executable контракт, не только схема архитектуры. Если нынешний путь достаточен — NO-NEW-API; UI-форма запуска не нужна для первого результата. B00 не требует MCP.

### B01. Подключить один вход к существующему QA-workflow
**После:** B00/I01; run использует готовые Q/G controls, их реализация не дублируется.
- [ ] Sol добавляет только принятый entry glue/recipe и пример входного задания; регистрирует запрос и его scope через существующий owner.
- [ ] Проверить нормальный brief, незнакомый продукт, missing source/role и недоступную capability: недостающие данные превращаются в конкретное ограничение, не ложный старт.
- [ ] Fresh-context actor запускает один документированный путь без знания component paths и истории разговора.
**Exit:** один входной пакет доведён до owning workflow с сохраняемым run identity; это ещё не приёмка полного QA-бокса.

### N01. Разрешить существующий Q1/G01 вопрос один раз
**После:** N00. **Files/input:** existing grounded-obligations spec, PR2, exact previous reviews.
- [ ] Сверить prepared packet с текущей парой; сохранять 5 targets/5 checks/7 decisions и original first attempts.
- [ ] Получить решение по конкретному письменному срезу; при принятии выполнить только предусмотренный actor/reader gate, без исторического score replay.
- [ ] Зафиксировать supported clauses/limits либо точный незакрытый semantic вопрос.
**Control/exit:** lost clause, toast-only, conflicting evidence, delayed healthy и unknown oracle различаются. Неизвестность блокирует зависимую семантику, независимые UI/discovery работы продолжаются.

### D01. Минимальный сквозной design outcome/gates/read-model
**После:** B00, применимые принятые результаты N01. **Files:** будущий scoped spec рядом с существующим grounded-obligations spec; поверхности раздела 5.
- [ ] Astra сопоставляет existing fields и ровно недостающие outcome→assertion→receipt связи; утверждает точные типы/signatures/files/tests без нового store или общего DSL.
- [ ] Сопоставляет expectations/observations/hypotheses/operational knowledge, источник/область oracle, documentary/executed result и request→segment→evidence. Не переобъявляет pending N01 принятым.
- [ ] Фиксирует единицы coverage, полный компактный receipt при обрезанном trace, availability, три вопроса gate из раздела 3 и UI read projection.
- [ ] Независимый AQA проверяет fixtures: compound clause loss, прерванное предусловие, другой run, обрезанный trace, exhaustion, пустой denominator.
**Exit:** сохранённый в source точный design и code execution cards Q04/Q05/G10/U01/B02/K01; отсутствие поля не заменяется догадкой. Это один контрактный review, не пять повторных обсуждений. Историческое имя G01/Q1 сохраняется за N01; новая gate-реализация имеет отдельный ID G10.

## 8. Волна 1 — один действительно полезный QA-проход

### Q01. Полный известный scope одной journey family
**После:** I01/D01; uses применимые принятые N01 semantics. **Files:** existing graph/catalog/strategy/campaign-plan и task-oriented recipe.
- [ ] Выбрать family без исходных docs; исследовать UI/API/доступный source, составить роли/состояния/переходы/boundaries/compound outcomes с устойчивыми IDs. Имеющиеся docs — один из источников, не потолок охвата.
- [ ] Для ожиданий указать независимое основание и применимость; собственная запись наблюдения не закрывает unknown oracle. Negative/metamorphic checks опираются на применимый инвариант, а не выдуманное business rule.
- [ ] Сохранить unknown oracle и источники без разбора; обосновать применимость и исключения.
- [ ] Проверить healthy inventory и удалённые роль/переход/clause; новый путь вне старого графа, stale docs и пустой denominator. Reference полноты держит независимый evaluator.
**Exit:** следующий actor получает проверяемые обязательства независимо от наличия tests. Бесконечный декартов набор комбинаций не требуется.

### Q02. Один полезный маршрут обнаружения capability
**После:** N00; параллельно Q01. **Files:** source `skills/qa-check`, skills index/capabilities и selected specialist references.
- [ ] Найти реальный пробел поиска готового account/mail/session/browser/API/readback tool.
- [ ] Исправить один task-oriented route на existing interface; новое provisioning API не создавать без доказанного gap.
- [ ] Fresh consumer по обычной просьбе находит инструмент или точную unavailable причину; wrong-product route отвергается.
**Exit:** инструмент использован следующим consumer без path hint. Source/installed discovery квалифицируются отдельно.

### Q03. Readiness нужной роли и данных
**После:** Q01 и доступной capability; Q02 нужен только если обнаружен соответствующий gap. **Files:** выбранный existing fixture/capability contract и recipe; code только при доказанном недостатке.
- [ ] Выбрать prerequisite, блокирующий наибольший downstream scope; проверить роль/ресурс/состояние через positive control.
- [ ] Передать fixture следующему actor с текущей привязкой; неправильная роль, expired session, недоступный ресурс дают разные причины.
- [ ] Сохранить самостоятельное продолжение независимой family.
**Exit:** конкретные ранее blocked outcomes стали исполнимыми; login и наличие файла сами этого не доказывают.

### Q04. Конечные outcomes и полнота assertion receipts
**После:** D01/Q01/Q03. **Files:** Console plan/adapter/outcomes, affected owner receipt schema только по D01.
- [ ] Добавить недостающий readback/reload/later-state assertion для всех обязательных clauses.
- [ ] Сохранить полный компактный reached/outcome набор отдельно от ограниченного большого trace либо явную неполноту instrumentation.
- [ ] Проверить healthy, no-op+toast, partial compound, delayed healthy, stale response, precondition failure, assertion после 100 trace events.
**Exit:** persisted owner evidence отличает выполненную проверку от недостигнутой; вторая clause не теряется. Agent-authored observations остаются помеченными как таковые.

### Q05. Детерминированный remaining report
**После:** D01/Q04. **Files:** owning observation/report projection и Console live reader; existing exact-set/receipt validations переиспользуются.
- [ ] Построить U/V и причины каждого gap от полного scope, а не от имеющихся results.
- [ ] Проверить missing case/result, duplicates, foreign run, changed oracle, partial clause, unknown instrumentation, N/A и historical evidence.
- [ ] Fresh reader восстанавливает outcome, проверку, доказательство и весь остаток.
**Exit:** точный список gaps, полный denominator; формула детерминированна без LLM и golden set. Полнота извлечения требований отдельно.

### Q06. Ранний независимый поиск omissions
**После:** Q01; итог по Q05. **Files:** existing workflow/skill references и bounded review packet.
- [ ] Reviewer получает исходные требования, inventory и выполненные outcomes, не только findings.
- [ ] В контрольном пакете обнаруживает удалённый sibling/outcome; healthy пакет не раздувает искусственно.
- [ ] Возвращает конкретную missing задачу до final report, с oracle/fixture либо причиной блокировки.
**Exit:** пропуск исправлен или остался видимым. Проверка найденных багов не засчитывается как omission review.

### G10. Исполнимые gate explanations в существующем workflow
**После:** D01/Q05/Q06. **Files:** Console existing campaign/outcome/continuation readers и source workflow references; future pure evaluator только если current predicates недостаточны.
- [ ] Собрать owner-derived G0–G6 checks с criterion IDs, input revision, evidence/gaps и разрешённым следующим действием.
- [ ] Подключить checks к точкам перехода выбранного workflow; сохранять actual owner semantics, не второй status store.
- [ ] Проверить rejected unready packet, independent progress, failed-but-executed, exhausted-incomplete, conflicting evidence, stale verdict и complete healthy.
**Exit:** нельзя вывести QA success через DONE/skip/threshold/artifact count; правдивый incomplete report доступен. Гейт диагностики не объявляется release approval.

### B02. Готовый отчёт как сохраняемый выход
**После:** B00/B01/Q05/Q06/G10. **Files:** existing owner report/receipt path и renderer, выбранные B00/D01; не новый store.
- [ ] Связать требования с проверками, основанием выбора, фактическим результатом и evidence; краткий summary и полный remainder получают один run/revision.
- [ ] Обеспечить открываемый/передаваемый результат из той же report read-model, которую показывает основной donor UI, в выбранном существующем формате и со source-backed ссылками. Не создавать второй custom reporting engine или вручную собирать итог из чатов.
- [ ] Проверить complete healthy, confirmed defect, unknown oracle, unavailable evidence и wholly blocked run; fresh reader восстанавливает что/как/почему/остаток.
**Exit:** каждый входной obligation имеет явный disposition, неподтверждённый результат не PASS; отчёт читается без UI и прежнего диалога. Формат и полнота объяснений проверены; это не отдельный verdict engine.

### L00. Безопасная точка остановки и базовое продолжение
**После:** B01/Q05/G10; existing continuation используется без повторной реализации.
- [ ] Остановить контролируемый проход между безопасными действиями; сохранить уже выполненное, remaining, run/input revisions и неизвестные эффекты.
- [ ] Новый сеанс восстанавливает состояние, сверяет среду/роль/oracle и продолжает только допустимый остаток; изменение условий делает связанные evidence устаревшими.
- [ ] Проверить потерю доступа и неизвестный исход; не повторять действие вслепую. Активная cancellation не обещается, если выбранный route её не поддерживает; зависимый CTO#6 не обходится.
**Exit:** пауза не теряет результаты и не создаёт дубли. Поддерживаемая граница остановки документирована; более широкий deferred-bug lifecycle остаётся L01.

## 8a. Входы, память, скрипты и инструменты — небольшие продуктовые срезы

Все строки «После» — необходимые применимые результаты, не повтор исторических проверок. Для первой вехи нужны I01/K01 и достаточный существующий tool/owner path; S01/T00 применяются по выбранной операции, T01 — только при реальном in-mission gap. Нет необходимости создавать helper ради приёмки. Порядок расширений K/S/Q07/E05 и остальных карточек уточнён в §12; полный V01 не универсальный барьер перед полезным промежуточным доказательством. NO-NEW-CODE допустим с consumer evidence.

### I01. Один сохраняемый запрос: весь продукт или выбранная область
**После:** B00. **Files:** existing intake/recorded-intake, registration context/plan binding, source skills; точные additions задаёт B00.
- [ ] Нормализовать цель, full/subscope, исходные items/clauses, exclusions, доступные источники и явные unknown; документы могут отсутствовать.
- [ ] Сохранить исходный full request независимо от family, выбранной для V01. Первая family — bounded subscope/PARTIAL относительно продукта, не автоматическое сужение полного запроса. Full completion требует отдельного E00 reconciliation.
- [ ] Связать request revision с owning execution/report; новый запрос не переиспользует старый mission незаметно. Сохранить исходную формулировку рядом с нормализованным scope.
- [ ] Проверить brief-only, empty/incomplete/ambiguous source, новый request при существующем workspace и частичный импорт.
**Exit/польза:** следующий actor начинает нужную проверку без внутренней сборки paths; потерянный item виден, wrong-request evidence не current. Это glue существующих owners, не новая очередь/store.

### I02. Один read-only источник tickets, затем проверка переносимости
**После:** V01/I01; выбранный tracker доступен в рамках отдельной QA mission. **Files:** existing host integration + input recipe; adapter code только при gap.
- [ ] Сохранить исходный ticket list, IDs/revisions, AC/reproduction/attachments/links; недоступное и truncated не выкидывать из batch.
- [ ] Развести ticket-specific ожидание и product-wide правило; проверить conflicting AC, attachment unavailable, pagination/partial import и отсутствие tracker writes.
- [ ] Свежий consumer проходит ту же семантическую границу со вторым доступным источником (например local exported tickets); второй live tracker не prerequisite.
**Exit/польза:** batch прослеживается source→clause→check→report; E04 получает весь исходный scope, а не удачно импортированный subset. Один connector PR; второй только при необходимости нового кода.

### I03. Документы как самостоятельный предмет проверки
**После:** V01/I01/K01.
- [ ] Выделить consistency/completeness/ambiguity review с источниками/версиями; не требовать живой продукт для documentary результата.
- [ ] Проверить противоречивое AC, устаревшую инструкцию, пропущенный role/step и healthy документ; с product evidence отделить doc bug от implementation discrepancy.
- [ ] Смешанный запрос сохраняет отдельно documentary и executed obligations.
**Exit/польза:** тот же вход выдаёт полезный документарный отчёт без фиктивного product PASS; неопределённое противоречие не автоматически подтверждённый баг.

### K01. Проектная память и читаемое dossier
**После:** D01/Q01. **Files:** existing product profile/graph/catalog/provenance/knowledge-revision и source recipe; новый store не нужен.
- [ ] Сохранить ожидания/наблюдения/гипотезы/операционные сведения с источником, областью и версией; использовать existing IDs.
- [ ] Построить dossier: продукт, роли/flow/state, oracle/gaps, способы проверок, знания о среде и scripts; generated summary ссылается на исходные записи.
- [ ] Fresh reader после сброса контекста восстанавливает одну family; broken control observation→own doc→oracle не проходит, неясное business rule остаётся unknown.
**Exit/польза:** второй агент продолжает QA без пересказа первого, видит обоснования и неизвестность; сохранение текста само по себе не квалификация.

### K02. Актуальность и конфликт знаний
**После:** K01 и bounded owning consumer с сохранёнными revision/evidence; полный V01 не prerequisite подготовки следующего прохода.
- [ ] Сопоставить source/build/role/oracle revisions; affected knowledge отметить suspect/stale, прежнее заключение сохранить историческим.
- [ ] Проверить удалённый источник, changed scalar/type при прежнем JSON shape, изменённое business rule, conflicting docs и unknown build.
- [ ] Healthy unchanged sibling остаётся пригодным; changed source re-derive/review, а не просто новый hash для прежнего вывода.
**Exit/польза:** следующий consumer получает точную affected queue; нет ни silent stale reuse, ни обязательного полного пересоздания знаний.

### S01. Первый реально исполняемый authored script
**После:** D01/Q03/T00. **Files:** existing authoring/catalog + выбранный owner execution seam; recipe/helper source в versioned artifact, не metadata-only candidate.
- [ ] Выбрать одну повторяемую операцию/проверку, найти existing helper, при gap написать минимальный script с реальными assertions, входами/выходами, source/dependency identity и applicability.
- [ ] Healthy/broken/partial/timeout/collection-failure controls доказывают чувствительность; normative expectation отдельно от кода script.
- [ ] Исполнить через разрешённый путь; сохранить raw evidence и owning classification. Script JSON success не sealed PASS.
**Exit/польза:** следующий actor воспроизводит содержательную проверку, а не только видит candidate file. Authoring допускается только в принятой области.

### S02. Повтор использует скрипт, но не старый verdict
**После:** S01/K02 и bounded owning consumer; не требуется сначала закрыть полный V01.
- [ ] Новый request связывается с текущим scope/build/role/data/oracle/tool/script/dependency; проверить source/scripts applicability до reuse.
- [ ] Повторить исполнение при новых условиях; cached result может показываться лишь историческим. Проверить старый PASS + новый bug, changed selector, changed oracle и новый flow вне графа.
- [ ] Обновить affected scripts и оставить discovery/omission budget; новый consumer находит способ запуска без path hint.
**Exit/польза:** повтор не теряет качество и не начинает всё с нуля; количественное ускорение принимает E05, не эта structural карточка.

### T00. Минимальный контракт расширения инструментов
**После:** B00/D01/Q02 при реальном discovery gap; без gap после B00/D01. **Files:** Console CampaignAdapter/plan kinds/effect/result boundaries и source tool discovery; отдельный exact Astra design.
- [ ] Разделить run-local composite, reusable adapter и core semantics. Зафиксировать supported kinds, inputs/outputs, authority, dependencies, evidence classification, checkpoint/new-segment lifecycle и tests.
- [ ] Выбрать минимальную имеющуюся execution lane; при её достаточности run-local работает без общего loader. Reusable descriptor/loader — только под T02, не prerequisite V01.
- [ ] Independent AQA проверяет fake success, wrong digest/effect, malformed/partial output, unknown effect и невозможность self-edit verdict; конкретное missing capability не скрывается.
**Exit/польза:** S01/T01 имеют точный путь исполнения. QA worker не придумывает свой доверенный evidence protocol; нет marketplace/MCP install.

### T01. Недостающий helper появляется в ходе QA
**После:** T00/S01/K01/L00. **Files:** один exact local helper и existing task/owner continuation route.
**Применимость:** только реально обнаруженный in-mission gap. Достаточный готовый инструмент позволяет принять полезный результат без нового helper; это не закрывает T01 автоматически и не отменяет его controls, когда gap возник.
- [ ] В контрольной family отсутствует один действительно нужный helper; actor сначала ищет готовый, фиксирует gap и останавливает только зависимый packet на checkpoint.
- [ ] В пределах принятого authoring/effects создаёт helper, сохраняет first attempt, выполняет independent healthy/broken/wrong-input controls. Новая установка/authority не подразумевается.
- [ ] В допустимой lifecycle точке публикует нужную revision, продолжает новым bound segment; прежние результаты и независимые packets не теряются. Error/unknown не blind retry.
**Exit/польза:** конкретный blocked outcome стал проверяемым в этой же QA mission; не самостоятельная ручная подготовка до запуска и не изменение running identity. Если нужен неподдержанный adapter, зависимый packet остаётся blocked до T02, V01 выбирает подходящую existing lane, не подменяет claim.

### T02. Повторно используемый инструмент через один extension seam
**После:** V01/T00; конкретный подтверждённый capability gap.
- [ ] Astra уточняет exact reusable descriptor/loader/owner mapping из T00 на одном необходимом adapter; Sol подключает его, не отдельный runner.
- [ ] Проверить qualification, declared effects, version/dependencies, raw evidence/unknown, self-certified PASS, failure/collection/lost response и сохранение старых readers.
- [ ] Второй маленький adapter того же класса подключается без нового core switch: отдельный implementation PR/consumer, если требуется код. Не требовать сразу browser+native+mobile+payments.
**Exit/польза:** доказана расширяемость выбранного класса инструментов, а не наличие интерфейса TypeScript; текущие fixed check kinds/effects расширены только в принятой области.

### T03. Promotion и обнаружение проверенного инструмента
**После:** T02/S02; два реальных consumers для generic extraction.
- [ ] Связать task-oriented skill/capability catalogue с versioned admitted tool, inputs/result/limits и resume recipe; skill не содержит вторую копию кода.
- [ ] Run-local→project-qualified→generic только при доказанной применимости; product rules/credentials/fixtures не переносить. Failed helpers/negative learning сохранить.
- [ ] Fresh consumer по обычному заданию находит/использует подходящий tool, отвергает stale/incompatible; на втором продукте получает пользу без core patch.
**Exit/польза:** новые возможности доступны агентам без знания прежней переписки; generic badge не выдаётся одному демонстрационному script.

### Q07. Расширенный E2E: состояния, роли и downstream
**После:** Q03/Q04 и readiness выбранного owning route; нужная state/role/downstream часть включается до полного V01. T02 нужен только для реально недостающего execution kind; sufficient existing specialist/agent-tool lane не требует новой платформы.
- [ ] Выбрать одну разрешённую nontrivial family: начальное состояние→действия→граница роли/сессии/поверхности→persisted downstream→readback; exact supported lane и authority записать.
- [ ] Healthy, toast-only/no-persist, wrong role, delayed healthy, failed precondition, retry/recovery и partial compound проверяются на isolated controls; не ломать продукт.
- [ ] Независимый reader сверяет все outcome clauses и фактический environment/account/build; endpoint success не заменяет journey.
**Exit/польза:** один конкретный расширенный E2E принят, список поддержанных эффектов/ролей/платформ честно ограничен. Его код не означает общую авторизацию продуктовых mutations.

### E05. Доказательство ускорения повторного прохода
**После:** S02/O00 и сопоставимого bounded owning consumer; full V01 не prerequisite этого измерения, повтор не закрывает V01 сам по себе.
- [ ] Заморозить protocol: одинаковые scope/quality/model условия, первый cold-run с созданием/проверкой знаний/скриптов, warm-run и controls drift/new flow; повтор сам по себе не causal cache win.
- [ ] Отделить warm reuse от простого знакомства агента: fresh actors, сопоставимый no-reuse контроль либо явно ограниченная оценка; включить setup/authoring/qualification/review/rework, показать amortization и число повторов.
- [ ] Проверить отсутствие новых misses/ложных claims, не переносить prior PASS; оценить gain по разделу 4 либо INCONCLUSIVE/NO-ADOPT.
**Exit/польза:** доказано, что накопление уменьшает полную цену/время следующего QA при сохранении качества; стоимость подготовки не скрыта.

### E06. Проверка no-doc и устойчивости к неправильным документам
**После:** V01/K02/Q06; не зависит от O01/O02 или MCP.
- [ ] Independent evaluator готовит matched current-doc/no-doc/stale-conflicting-doc варианты с одинаковым поведением и достаточным независимым reference; скрытые role/transition/outcome и отдельные mutations.
- [ ] Fresh actors не видят answer key и не переносят память между arms; фиксируются ограничения изоляции, первый результат и незакрытый scope.
- [ ] Проверить найденные обязательства/defects, unsupported claims, oracle gaps, hidden-flow misses, время/cost/intervention. Legitimately unknowable requirement остаётся unassessable, не «должен угадать».
**Exit/польза:** no-doc pipeline не блокируется из-за отсутствия Markdown, обнаруживает обязательные observable controls, не подтверждает buggy baseline через собственный dossier. Цель — все заранее applicable/observable held-out controls и zero unsupported confirmations; неизвестные бизнес-правила отдельно. При провале улучшать конкретный потерянный этап, не снижать denominator.

## 9. UI qa-harness — основной мониторинг и отчёт, дополненные нашим UI

### U00. Полный UI integration inventory и точный adapter design
**После:** N00; параллельно Q01. **Files:** donor App/views/engine/api/hooks/styles/locks; Console `src/App.tsx`, `src/lib/live.ts`, `server/bridge.mjs` и existing components.
- [ ] Зафиксировать donor App/navigation, Overview, live/final report, Timeline/SessionDrawer, evidence, theme и dependencies как основную UI-базу. Сохранить её визуальный и интерактивный дизайн, source attribution и отдельный build destination.
- [ ] Сверить все существующие Console-экраны и значимые действия: donor уже покрывает / встроить в его экран / добавить страницу / отложить с причиной. Graph и Coverage добавить отдельными страницами; ни одна полезная существующая функция не теряется молча.
- [ ] Astra фиксирует точный data adapter и file/signature/test карту. Сначала использовать существующий owner snapshot; недостающие факты расширять только по D01. Определить границу props/темы для Graph/Coverage, без второго backend/store.
- [ ] Проверить совместимость Console React19.1/TS5.9/Vite7 с donor React19.3/TS6/Vite8; решение по каждой действительно нужной dependency отдельно, без общей замены package.json/locks и без сборки активного Claude checkout.
**Exit:** конкретный план переноса основного приложения, не fallback к нескольким карточкам. Не требуется новая UX-концепция. Новый writer/lifecycle/schema вне read-only отображения получает свой узкий design.

Обязательный полезный subset **добавлений из нашего UI** для V01: Graph, Coverage; требования/scope/plan/outcomes/oracle/исключения; remaining/blockers с причинами; продукт/среда/build/run/revision/current-history-stale; доступность evidence; раздельные execution/product correctness/completeness; сохранённая точка продолжения; knowledge/oracle provenance, найденные/созданные helpers с applicability/revision и ссылкой на квалификацию как детали существующих экранов. Это не ограничение объёма переноса основного donor UI. Findings/evidence/history/live/report уже есть у donor — не дублировать их старыми Console Overview/Runs/Verdict. Интерактивное редактирование плана/oracle/graph, новые approvals/start/resume и технические recovery операции — позже по owner capability, не prerequisite отображения.

### U01. Read-only источник для перенесённых компонентов
**После:** U00 и доступного qualified owning read path; Q05/G10 для новых полей.
- [ ] Реализовать выбранный mapping поверх Console validated `GET /api/workspace`, не CAMP store.
- [ ] Отразить source/workspace/run/revision, availability и stale/disconnected состояния; тот же selection питает donor monitoring/report, Graph и Coverage, старый ответ не переключает workspace.
- [ ] Проверить parity owner→view, wrong run, partial data, missing evidence, late response, readonly server refusal. Donor `/api/approve` и start-cycle не вызываются без соответствующего qualified owner action; отсутствие данных не заменяется фиктивными phase/session/approval/cost.
**Exit:** UI показывает ровно сохранённые факты. Существующий HTTP reader достаточен для бокса; опциональный stdio MCP потребует своей отдельной квалификации, когда будет выбран.

### U02. Основное приложение и полезные страницы qa-agent
**После:** U01. **Files:** donor App/shell/navigation в Console delivery; existing Graph/Coverage + точные адаптеры U00.
- [ ] Подключить donor UI как основной мониторинг/отчёт; встроить Graph и Coverage в его навигацию. Старую Console-навигацию и дублирующий набор Overview/Runs/Verdict не сохранять вторым главным интерфейсом.
- [ ] В donor run/report UX добавить недостающие Outcomes, Remaining и Gate explanation; переход требование→проверка→evidence→версия и видимый continuation remainder.
- [ ] Отдельно показать design/execution/outcome, complete/incomplete, confirmed/uncertain/duplicate; Graph не означает выполненную проверку.
- [ ] Проверить healthy/broken/unknown, 0 vs unavailable, current vs historical, connection loss, keyboard navigation, длинный remainder и Graph/Coverage на том же выбранном run.
**Exit:** один главный интерфейс, в котором свежий QA/оператор находит исходное требование, непроверенную clause и её причину. Основной UX берётся готовым, не перерисовывается.

### V01. Первая пользовательская приёмка QA-бокса
**После:** B01/B02, Q01/Q03–Q06/G10 и нужной state/role части Q07, K01, L00/U02/U03a/O00 и readiness выбранного owning route. S01/T00 — по применимому tool path; T01 только при реальном helper gap, Q02 только при discovery gap. Промежуточные demonstrations имеют свои ограниченные claims; полный exit ниже сохраняется.
- [ ] Fresh-context actor получает продукт/цель/границы **без готовых продуктовых docs** и проходит документированный вход→QA→готовый отчёт; не получает подсказки внутренних paths/IDs. Independent reviewer проверяет claims и omission.
- [ ] Сохранить grounded/observed/hypothesis/operational dossier и применимый tool/script с источником/ограничениями; отсутствовавший helper создать и проверить по T01 только при реальной необходимости. Свежий reader находит knowledge/tool/evidence без path hints; это discovery/reuse check, не причинное доказательство warm gain.
- [ ] В контролируемой family различить healthy конечный результат, broken/partial compound, заблокированное требование и omission; отдельно показать stop/resume L00 без потери выполненного.
- [ ] Новый consumer наблюдает run в основном UI, затем повторно открывает его как итоговый отчёт, переходит в Graph/Coverage и сверяет каждое обязательство, версию, evidence и остаток с persisted owner readback без истории диалога. Сохраняемый/exportable report показывает ту же модель результата.
- [ ] Сохранить first attempt, полный walltime, действия и вмешательство. Synthetic controls квалифицируют механизм; отдельный разрешённый bounded product consumer — практическую полезность, без внедрения дефектов в продукт.
**Exit:** no-doc вход дал содержательный QA, сохранённую модель и проверенный применимый инструмент с понятным сохраняемым выходом; новый helper — только при реальном gap. 100% входных obligations имеют корректный disposition, нет неподтверждённого PASS, отчёт/UI/owner согласованы, stop/fresh continuation и остальные применимые controls показаны. Public/read-only промежуточный результат не универсальный authorized E2E. Это принятие ограниченного box-сценария, не всех продуктов/host; MCP, multi-agent routing и cloud не обязательны.

### U03a. Базовый live→history→final report до первой приёмки
**После:** U02/O00; обязательная часть основного UI перед V01, не поздний polish.
- [ ] Адаптировать donor Timeline/SessionDrawer/current-history selection к фактически recorded phase/session/time данным; отсутствие истории показывать not-recorded.
- [ ] Убрать предположения о семи фазах CAMP, искусственном initial scope visit и обязательной числовой стоимости; не синтезировать события ради заполнения графика.
- [ ] Проверить переход live→finished→reopen, historical cursor, overlapping intervals, missing starts/ends, unknown cost и exhausted-incomplete.
**Exit:** один run корректно отслеживается и читается как итог; неподдержанные детали видимы как unavailable. Новый telemetry scheduler не требуется.

### U03b. Расширенные Evolution/cohort метрики
**После:** V01/O00 и достаточных реальных данных.
- [ ] Подключать имеющиеся donor Evolution/KPI представления только к сопоставимым доступным значениям и явному источнику расчёта.
- [ ] Проверить changed formula/build/model cohort, unknown cost, retries и parallel walltime; скрывать неподдержанный вывод, не подменять цифры нулями.
**Exit:** пользователь видит измеренное изменение качества/времени/стоимости или явную невозможность сравнения. Отсутствие этих данных не блокирует первый QA-box.

### U04. Одно нужное операторское действие
**После:** V01, exact action design и поддержанного owner mutation/readback; для MCP writer — M70/H31.
- [ ] Выбрать одно доказанно нужное действие: например возобновить сохранённую отложенную проверку. Сначала проверить существующий owner API.
- [ ] Добавить ровно эту кнопку/форму с binding/revision/reason и persisted readback; capability проверяется сервером.
- [ ] Проверить stale selection, повторный click, lost response и отсутствие поддержки; неподдержанные действия остаются unavailable.
**Exit:** пользователь управляет одной реальной операцией без второго lifecycle. CAMP `/api/approve`, start-cycle и все approvals оптом не переносятся.

## 10. Специалисты и измерение; MCP отложен

### A01. Переносимое задание и минимальные роли
**После:** Q01 и qualified available capability; Q02 только при discovery gap. Может готовиться параллельно UI. **Files:** existing workflow notes/strategy/skills, без scheduler service.
- [ ] Packet содержит scope/outcomes, inputs/версии, oracle, fixtures, dependencies, эффекты, evidence, budget и stop/unknown.
- [ ] Разделить lead, executor и independent reviewer; роли активируются по необходимости. Два concurrent workers — начальный предел, не обещание параллельности.
- [ ] Fresh worker получает задачу без устных подсказок; missing prerequisite/output возвращается с точной причиной, downstream не запускается от одного task-done.
**Exit:** lead собирает целый результат без потери/дублирования obligations; semantics итогового QA не передаются счетчику артефактов.

### A02. Два независимых исполнения через текущий host
**После:** A01/G10/Q03 и bounded owning flow; actual capability boundaries проверены. Полный V01 не барьер для отдельного измеримого two-worker опыта по §12.
- [ ] Разделить independent families/fixtures; каждому worker назначить owner account/browser/resource, исключить overlapping writes.
- [ ] Запустить через существующее host delegation; задержка/ошибка одного не стирает второй результат.
- [ ] Сопоставить actual start/end, dependency failure и сохранённые outputs. Общий login lock означает serial и так отражается.
**Exit:** доказанное ограниченное параллельное исполнение и consistent readback; это ещё не causal speed gain.

### P01. Один passive collector с доказанной полезностью
**После:** Q04 и qualified available collector capability; Q02 только при discovery gap; конкретный miss family.
- [ ] Выбрать существующий collector для нужного DOM/screenshot/network/console класса; собрать данные один раз в основном проходе и передать нескольким применимым passive detectors без повторного обхода. Неприменимость явно записать.
- [ ] Сохранить state/URL/time/evidence и новые кандидаты для investigation; измерить добавочную пользу, время и ложные кандидаты, не смешивать signals с unique confirmed defects.
- [ ] Проверить injected failure и healthy sibling; guard/network/environment symptom не подтверждать как product bug без проверки.
**Exit:** дополнительный дефектный класс обнаруживается без отдельного полного обхода или LLM для механического сбора.

### O00. Правдивые время и стоимость
**После:** доступных owner records; начать до первого разрешённого consumer.
- [ ] Переиспользовать timestamps/usage; обозначить unknown и источник измерения, разделить wall/agent/tool/review/setup.
- [ ] Для finding показать discovery→verification→report по фактам; duplicates/retries/context overhead учитываются.
- [ ] Проверить Codex unmetered zero, пересекающиеся интервалы, missing timestamp, cancelled task и несовместимые cohorts.
**Exit:** стоимость без измерения не $0; данные достаточны для честного сравнения либо прямо недостаточны.

### Отложенная опциональная MCP-ветка: каждый ряд — отдельная карточка

Точные interfaces/files/RED–GREEN vectors уже описаны в MCP implementation plan — **private historical reference, not delivered**: `2026-09-29-mandatory-local-mcp-implementation.md#task-3-bounded-owner-cli-first-then-validated-owner-reader-parity-22`. Это сохранённая подчинённая спецификация, **не активная очередь**. В старом имени файла осталось mandatory; последнее решение пользователя отменяет эту обязательность. M20–H31 запускаются только при выбранной потребности в MCP и отдельном возобновлении ветки. Accepted Tasks1A/1B/2 сохраняются; SDK/locks не обновляются по привычке.

| ID | Зависит от | Маленький результат | Обязательные controls и exit |
| --- | --- | --- | --- |
| M20 | N00, applicable N01 | Совместимый current-owner binding successor | Correct/wrong pair, frozen Task2 preserved, source closure; один exact accepted pair |
| M30 | M20, отдельный scope CTO#6 при затрагивании | Process/effect supervision необходимого owner command | Process-tree timeout/cancel/lock/late write readback; unknown effect не success. #5 responsiveness отдельно измерить, чинить лишь доказанный bottleneck |
| M31 | M20, применимый M30 | Fixed-command owner CLI | `owner-cli.mjs`/test: actual read, 30s timeout, output limits, cancel/error/drift; no implicit writer |
| M32 | M31 | Owning-reader parity | `owner-read.mjs`/test: ordinary/continuation/history/null/order/full denominator; неправильный owner отвергнут |
| M40 | M32 | Consistent capture→pure view | Все применимые 47 selectors, snapshot drift, paging/availability; настоящий owner вместо mock |
| M50 | M40 | Complete bounded read-only stdio MCP | `mcp.mjs`/raw protocol tests: восемь read tools, final wire limits, SDK parity/EOF/cancel/errors; partial server не supported |
| M60 | M50 | Inert writer admission/preparation | Canonical request/digest, wrong ID/schema/size/binding reject, zero dispatch |
| M70 | M60, writer authority | Один owner write и independent readback | Healthy, duplicate/conflict/lost response/partial persist/cancel; reconcile same ID без blind retry |
| H31 | M70 | Новый реальный host consumer | Обычная просьба→discovery→record/readback→remaining; CLI/mock не принимаются как host proof; Codex/Claude отдельно |

Если ветка выбрана, для каждого ряда: [ ] первый контроль; [ ] минимальный Sol diff; [ ] focused GREEN/negative classification; [ ] exact independent AQA; [ ] PR/source closure; [ ] следующий owning consumer. Эти exits квалифицируют MCP, не являются prerequisites box/full QA через другой поддержанный route.

## 11. Оптимизация, продолжение работы и полная квалификация

### O01. Польза параллельного разделения работы
**После:** A02/O00 и достаточного последовательного bounded baseline; matched inputs фиксируются заранее, full V01 не prerequisite опыта.
- [ ] Сохранить один serial baseline и один two-lane вариант с теми же моделями, scope/build/data/oracle; существующие пригодные evidence использовать без лишнего rerun.
- [ ] Сравнить полный walltime/cost, coverage, misses, false claims, duplicates/rework и intervention; preserve all attempts.
- [ ] Принять bounded improvement, NO-ADOPT или INCONCLUSIVE по разделу 4.
**Exit:** доказано ускорение разделением задач, а не одновременной сменой моделей/данных/сценариев.

### O02. Отдельный опыт статического выбора моделей
**После:** O01 и фиксированной декомпозиции.
- [ ] Назначить поддержанные actual модели routine execution и сложному design/review; зафиксировать config и причины передачи сложного случая.
- [ ] Учесть весь повтор/контекст/стоимость; unsupported model/profile и общий login limit не скрывать.
- [ ] Проверить отсутствие новых misses/unsupported claims при gain либо отказаться от новой policy.
**Exit:** подтверждённая политика роли→модель. Astra-разработка/Sol-код не автоматически runtime policy всех QA-ролей. Jev/Laya/adaptive router не prerequisite.

### L01. Пропущенный баг, версия и оставшаяся очередь
**После:** L00/Q05/G10; uses accepted existing continuation mechanisms.
- [ ] Отложить одну проверку с причиной, exact revision и return trigger; сохранить её в denominator.
- [ ] Новый агент/сеанс восстанавливает очередь, rechecks candidate/account/oracle и выполняет только remaining.
- [ ] Проверить no-change, новый build, изменённый oracle, unknown previous effect и потерю доступа.
**Exit:** deferred не забывается; старый PASS не переносится на новые условия автоматически. Existing accepted continuation не реализуется заново.

### L02. Баг→регрессия→польза графа
**После:** подтверждённого нового defect/miss, L01.
- [ ] Сохранить нормативное ожидание, воспроизведение и scope; добавить точную regression/dependency через owning graph path.
- [ ] На другом изменении показать, что граф выбирает нужную дополнительную проверку и сохраняет unmapped remainder.
- [ ] Healthy/broken neighbour и unrelated change показывают чувствительность и отсутствие искусственного расширения.
**Exit:** следующий consumer обнаруживает нужный риск; graph link не выполненный test. Для закрытия наследуемого F07 нужен связанный learned-regression consumer именно из mixed-ticket batch E04; отдельный посторонний regression пример его не заменяет. L02 может дать ранний bounded результат, но F07 остаётся открытым до этой связи. DocIR/RAG/новая graph DB только при отдельном доказанном retrieval gap.

### E00. Готовность полного стендового испытания
**После:** V01, Q07 для заявленного cross-role/state scope и применимых Q/P; выбранный host/route проверен. Ни MCP, ни routing experiments не обязательны для начала полной проверки качества.
- [ ] Зафиксировать target/build/data/roles, полномочия, expected outcomes, evidence destination, exact eligible known-set и budget.
- [ ] Для full-mode развернуть исходный I01 request в inventory всех обнаруженных families/surfaces/ролей/состояний/переходов и применимых cross-cutting risk classes (например permissions, recovery, compatibility/responsive, accessibility, integration/performance — по продукту и доступным возможностям). Независимо сверить request→inventory→U; unexplored, unsupported, blocked и обоснованно excluded области сохранить с причинами. One-family Q01/V01 не заменяет этот полный inventory. Новую capability не обязательно реализовать: её отсутствие оставляет PARTIAL, а не сокращает denominator.
- [ ] Independent omission reviewer проверяет full-scope admission; negative control удаляет вторую family или применимую cross-cutting область при GREEN первой. Full-completion claim отвергается, отчёт остаётся PARTIAL, потерянная область возвращается в remainder.
- [ ] Проверить positive readiness и accepted local-target path; loopback/HTTPS обход не подменяет owning admission.
- [ ] Разделить discovery и evaluator inputs, отметить пределы изоляции. Известный Tool Shop — regression/diagnostic, не blind unfamiliar discovery.
**Exit:** независимый reviewer допускает один конкретный run по сверенной полной карте; недоступная обязательная ветка остаётся blocker для полноты, не для независимых проверок. Бюджет может закончить run, но не объявить full QA. Full completion нельзя получить на U одной family; область исследования и её неизвестные границы видимы.

### E01. Один полный QA-цикл
**После:** E00.
- [ ] Выполнить G0–G6 через принятый owner: scope→design→readiness→execution→investigation→omission/verification→report/readback.
- [ ] Сохранить every obligation disposition, timing/cost и first attempts; freeze discovery до evaluator.
- [ ] UI показывает тот же результат и полный remainder.
**Exit:** полный доступный scope исполнен либо явно неполный результат; остановка не переименовывается в принятие.

### E02. Независимая оценка и один целевой repair
**После:** frozen E01.
- [ ] Сопоставить unique confirmed findings с eligible known-set; проверить evidence, missed/unassessable/false/duplicate по exact revision.
- [ ] Для каждого miss определить первый потерянный этап. Исправлять по одной доказанной family, с focused controls и новым consumer; не вставлять answer key в prompts.
- [ ] Сохранить первоначальный score, отдельно новый результат; принять quality/throughput только при критериях раздела 4.
**Exit:** цель полного применимого known set не заменена числом findings. Один repair=один отдельный implementation PR, не обязательный новый full run после каждого изменения.

### E03. Незнакомый продукт
**После:** достаточного E01/E02, E06 и adopted recipes.
- [ ] Fresh actor самостоятельно проектирует проверку другого продукта без подсказок известных багов; независимый AQA оценивает результат и остаток.
- [ ] Сохранить полезность, затраты и все неподтверждённые области; product-specific правила остаются в выбранном pack.
**Exit:** один и тот же box-процесс дал полезный результат на другом продукте без новой core-реализации. Это bounded transfer, не доказательство надёжности на любых продуктах.

### E04. Mixed-ticket batch: реальный help→reply→resume
**После:** I02/L01 и одного подходящего разрешённого mixed-ticket batch с исходными acceptance criteria/risks; не блокирует независимый E03 или первый V01.
- [ ] Выбрать разные типы задач с независимыми и зависимыми ветками; на реальном недостающем предусловии сохранить запрос конкретного входа, выполнить независимую работу и принять actual ответ.
- [ ] Сверить текущую роль/версию/эффекты и возобновить зависимый packet без потери выполненного; покрыть исходные AC/risks всего batch, сохранить раздельные done/unknown/pending dispositions и проверить actual owner readback после ответа. Old reconstructed reply не годится.
- [ ] Передать подтверждённый defect/miss этого же batch в отдельную карточку L02 с явной ссылкой; learned-regression проверяется своим последующим consumer, не считается выполненной при создании связи.
**Exit:** E04 закрывает живой mixed-ticket help/resume, а наследуемый F07 закрывается только E04 + связанным L02 learned-regression consumer. Самостоятельная переносимость E03 и L00 synthetic stop/resume не заменяют этот exit; внешне blocked batch сохраняет OPEN без блокировки независимых задач.

### D15a. Воспроизводимая поставка бокса
**После:** принятых implementation slices; packaging проверяется по мере PR, итоговый consumer после V01.
- [ ] Cold clone восстанавливает exact components/packages/source skills без исторического донора; no implicit installs/accounts.
- [ ] Новый пользователь на первом поддержанном host находит один вход и открывает один отчёт; prerequisites модели/инструментов указаны.
**Exit:** воспроизводимая поставка первого поддержанного бокса; локальный-only результат не выдан за опубликованный.

### D15b. Расширение поддержанных host/OS, по одному
**После:** D15a; только когда конкретный host/OS включён в заявленную поддержку.
- [ ] На каждом дополнительном заявленном host/OS выполнить полезный full declared QA cycle, включая omission/review/report/remainder; одна отдельная карточка/приёмка на каждую среду.
- [ ] Сохранить ограничения отсутствующих browser/native/mobile capabilities; MCP smoke не закрывает этот full exit, отсутствие MCP не блокирует иной принятый route.
**Exit:** поддержка основана на настоящем end-to-end доказательстве, а не общности кода. Будущие платформы не блокируют первый box.

### D15c. Финальный независимый review и документация
**После:** D15a/E03, I02/I03, K02/S02/T02/T03/E05/E06 и применимых E04/L02/D15b; незакрытые внешние exits обозначены, не спрятаны. Полный inherited F07 не закрывается без связанного E04→L02 consumer.
- [ ] Показать команде README/architecture/start, один plan/current, UI и evidence; архив сохраняет происхождение, не конкурирует как active entry.
**Exit:** воспроизводимая поставка и независимый итоговый AQA; непринятые hosts/native/mobile capabilities явно ограничены. Cloud/Dots/always-on P7 остаётся отдельной поздней программой.

## 12. Зависимости, приоритет и преемственность

**Ближайший приоритет, уточнён 9 октября:** закончить доказанный read-blocker и готовые UI/инструкции одним полезным срезом → обычный QA-запрос → исследование и содержательные проверки → сохранённый отчёт с evidence/остатком → просмотр в UI → продолжение свежим агентом без повторения завершённого. Принятая recipe и evidence-grounded UI/runtime repair должны соединиться в одной поставке после affected acceptance, не двух полных CI-циклах. Read-repair ограничен одним рабочим днём; это плановая граница, не продление runtime deadline. Если feature не работает, она остаётся unavailable, не flaky PASS и не quarantine для обхода гейта. В следующие три дня (9–12 октября 2026) приоритет — V01/пользовательский путь; новые инфраструктурные расширения отложены, кроме доказанного blocker этого пути. V01 exits и продуктовые полномочия не ослабляются; новый live/no-doc consumer получает свой actual owner/readiness/authority, установка или кампания автоматически не запускается.

**Сохранённый общий порядок 8 октября (ближайший приоритет выше):** A N00/U* — закончить уже подготовленную поставку и актуальный вход → Б минимальный I01/B01/B02/L00/V01 owning процесс → В Q01/Q03–Q06/G10 и необходимая часть Q07: состояния/роли/конечный результат/omissions → Г ранний P01: collect once, reuse detectors → Д K01/K02/S01/S02/E05: актуальный полезный повтор → Е A01/A02/O00/O01/O02: два независимых исполнителя и измерение → Ж E00–E06/V01: bounded known-set и unfamiliar/no/stale-doc consumers. Это приоритет в одной очереди, не семь новых карточек и не требование ждать полного закрытия группы: реальные dependencies сохраняются, принятые foundations повторять не надо. Подготовка QA/exploratory/tools идёт параллельно UI; UI polish не блокирует её. I02/I03, T02/T03, L01/L02, U03b/U04, D15a–c сохраняют собственные применимые exits; MCP M20–H31 отложен.

**Датированный следующий seam 8 октября (не новая команда; текущие deliveries — CURRENT):** I01/L00/B02 — совместить request/intake admission с уже существующей native continuation, не убрать отказ и не обойти binding. До кода actual Astra фиксирует affected start/partial/resume/receipt/read/export контракт и controls: тот же request и выполненное сохранены; changed/wrong admission и unknown effects fail closed; исполняется только оставшееся, legacy V0/unbound не регрессируют. Затем actual Sol6.1 реализует минимальную closure, focused controls/self-review и ONE final AQA. Источник выбирается по наблюдаемому accepted base; ожидаемое завершение PR11 не считается merge/adoption. Принятый no-doc→fresh native handoff остаётся промежуточным consumer, не заменой этого шва и не причиной откладывать его. Конкретные следующие claims/границы — §14.

51 активная карточка — очередь результатов, не 51 обязательное новое подсистемное изменение. Существующие достаточные возможности закрываются NO-NEW-CODE с consumer evidence. Общая design-карточка не открывает весь roadmap исполнителю: за раз берётся один exact slice.

До V01 не строим новый универсальный оркестратор и не добавляем платформенные возможности под все будущие продукты. Часть Q-карточек может завершиться recipe/NO-NEW-CODE; V01 всё равно обязателен. Одно изменение не требует собственного дорогого live consumer, если общий V01 проверяет его пользу и отдельные focused controls проверяют его чувствительность.

| Прежнее обязательство | Текущая карточка / сохранённый статус |
| --- | --- |
| R00a/b, Card0, B00/B01 | N00, O00, immutable historical baseline |
| R01, G01/Q1, Card1 | N01/D01; prepared consumer не принят автоматически; новый G10 не переиспользует исторический ID |
| No-doc, документация/память, authored scripts и tools-in-run, позднее уточнение 5 октября | I01–I03/Q01/K01–K02/S01–S02/T00–T03/Q07/E05–E06; ранний V01 усилен, accepted results не переоткрыты |
| Новый box-вход и выход, уточнение 5 октября | B00/B01/B02/L00/V01: один запрос, owning workflow, готовый отчёт, basic resume, пользовательская приёмка |
| R02–R08 | Q01–Q06, G10, P01, O00; один интегрированный V01 вместо повторных isolated ceremonies |
| R09–R11, P40/static W8 | A01/A02/O01/O02; отдельно decomposition и model effect |
| U01–U03 + уточнения пользователя 5 октября | U00/U01/U02/U03a — основной donor monitoring/report UI + Graph/Coverage и полезные дополнения нашего UI; U03b advanced metrics позже. Не selective-cards fallback и не два главных UI |
| M20–M70/H31 | Отложенная необязательная exact subqueue + affected M30 при её выборе; accepted1A/1B/2 retained; обязательность отменена пользователем |
| F01–F06 | E00–E03; first attempts/known-set/held-out/evaluator separation сохранены |
| F07, W6 help/resume | L00/L01, живой mixed-ticket batch E04 с исходными AC/risks и связанный L02 learned-regression consumer; только вместе закрывают F07 |
| Cards6–14/I05–I09, graph/retrieval/version/regression | Q04/Q05/L01/L02/P01; дополнительные helpers только по доказанным gaps |
| D15/D15-H/T16 | D15a/D15b/D15c; первый box отдельно, full cycles для каждой заявленной среды, не только smoke |
| P0–P6/W0–W7 и 97 reconciled obligations | Наследуются через прежние поэлементные matrices; этот план их не объявляет завершёнными |
| CTO accepted#4/#7/#8/#9/#11, W2a, A1, D13, accepted MCP foundations | Не повторять без affected delta; локальное/опубликованное/host qualification различать |
| I06a rejected candidates; I07a Task4/5; I10 repeated microdiagnostics | STOP/NO-ADOPT сохраняются; не возвращаются под именем UI/гейтов |
| VPN/product-specific debt; CTO#1–3/#10 | Deferred/owner-specific; не следующая универсальная задача |
| CTO#5/#6 | Только отдельный принятый affected scope, M30/measurement; независимые ветки продолжаются |
| Adaptive Jev/Laya, W9/P7 cloud/Dots | Поздняя самостоятельная программа после измерений; не prerequisite текущего результата |

## 13. Граница этой редакции

Этот документ сохраняет 51 активную и 9 deferred MCP-карточек; все прежние IDs, accepted/STOP/NO-ADOPT и first attempts остаются в исходных bounded records. Редакция 5 октября была planning-only; реализация и поставки после неё отражены в CURRENT, не объявлены отсутствующими и не приняты повторно. No-doc, память/useful repeat и helper при реальном gap — проверяемые результаты. Уточнение 8 октября ниже меняет приоритет/применимость, не source pins, кампании или product authority.

## 14. Решение пользователя 8 октября 2026 — та же очередь, следующий полезный шов

Actual Astra. Основание: полностью прочитанное уточнение пользователя о qa-agent/qa-harness/OpenSRE/DocIR от 8 октября. Предыдущие canonical bytes SHA256 `f981a25a898a53bd056e1d66640516b4b5bbd70483551f4308cc59c2853f933f` сохранены один раз в ignored `.superpowers/sdd/2026-10-05-universal-qa-product-plan/CANONICAL-BEFORE-PRIORITY-20261008-f981a25.md`; это private historical archive, not delivered in this public carrier, не вторая очередь. Ни один checkbox/accepted result этим patch не закрыт. Единственная цель продолжается; mutation/runtime/public releases остаются отдельными scoped действиями.

На момент сверки: R `develop`/`f6b874f` — владелец этого документа, не новый runtime baseline; его старый manifest не отменяет поздние deliveries. PR10 normal merge `f3e4459f`, Consoleeaff — принятый public original-input read. UI Console66da/carrier3db получили ONE combined AQA b8e3104b GO C0/I0/M1, PR11 own CI идёт и merge held; не повторять build/mounted/source review и не считать UI уже adopted. Приоритет A завершает этот delivery и понятный current/start/canonical entry без публикации private history; свежий actor должен выбирать действующий путь, не historical cwd. Полный U02/U03a/V01 и held tail M1/M2 остаются открыты.

**Почему следующий именно continuation:** актуальный `src/node/qa-campaign-runner.ts:186–188` отвергает continuation+requestInput/requestAdmission; CLI также отказывает этому сочетанию. Это реальный разрыв Б: нельзя выдать отдельно принятые input/export и continuation за один уже работающий request→partial execution→fresh resume→same report. Следующий exact design читает только affected `scripts/qa-campaign.ts`, runner, существующие continuation identity/files/owner/reader и `src/node/qa-outcomes-export.ts`; выбирает минимальные изменения после проверки их действительного контракта, не новый lifecycle. Исходные запросы/receipts и legacy evidence не переписываются. Первый полезный consumer должен сохранить уже выполненный check и продолжить допустимый остаток без ручной переклейки/повтора; pre-run handoff этого не доказывает.

**Fit принятой card9f8ce1b0:** ordinary raw brief может требовать reversible Search→clear relation; DOM даёт новые case-data, но не oracle полного inventory. Это no-product-docs, не отсутствие требований и не supplied SOURCE-FACTS. Fresh native executor после подготовки полезен для B01/K01 и bounded V01 progression, но не partial-executed L00, авторизованного E2E, helper или полного V01. Подготовка удержана на safe checkpoint до принятия этой поправки; новых actors/миссии patch не запускает. Не требовать искусственный T01 и не дублировать прошлые healthy scores ради новой этикетки.

**Следующие отдельные недостающие соединения, внутри существующих IDs:** (1) U03a — реальные recorded current→finished→history данные в существующие Timeline/SessionDrawer/selection; сейчас projection/Timeline явно unavailable, числовые фазы/стоимость не синтезировать. (2) D01/Q04/Q07/B02 — минимальный учёт уже имеющихся agent tools: сначала existing `record-observation`/`recordAgentToolObservation` → readback/target report/UI с provenance `agent_authored_unattested`, exact request/run/revision/effects и явными отсутствующими связями; новый adapter лишь при конкретном gap. Это не native-sealed PASS. V0 public/read-only/API GET/HEAD/OPTIONS и отказ `requiredSecretRefs` сохраняются как ограничения lane; authenticated/stateful E2E выбирает отдельно разрешённую existing specialist/tool capability, не общий unsafe флаг/произвольный DSL. (3) Q07/P01 — конечный persisted/reload/другое view результат и reusable capture рассматриваются раньше расширенного UI polish, с независимым omission review.

Каждый slice отвечает: что агент теперь действительно проверяет лучше, что перестал пропускать, что ускорил или какое ручное действие убрал. Для существенного consumer сохраняются candidates/unique confirmed/false findings, известные misses только при независимом reference, meaningful checks/remainder, preparation/research/verification/report/full walltime, repeats/interventions и доступная usage/cost (иначе UNKNOWN). Known-set recall не обещает найти все неизвестные баги; unfamiliar acceptance оценивает согласованный scope и обоснованность, эталон скрыт до freeze. Warm gain и two-worker gain требуют сопоставимого качества/условий; неизвестное время/стоимость не ноль.

OpenSRE используется здесь только как уже предоставленные пользователем принципы единого chat/headless цикла, resumable sessions, provenance и разделения product/test/infrastructure. DocIR/Neo4j/большой RAG, обязательный MCP, новый backend/LLM-runtime не добавляются. Конкретное заимствование механизма потребует узкой проверки; полный повтор аудита не нужен. Текущие required CI идут до исхода, их cost optimization — самостоятельный будущий scoped diff. UI/QA и независимая разрешённая ветка не ждут чужого внешнего blocker; full V01 не закрывается промежуточными демонстрациями.
