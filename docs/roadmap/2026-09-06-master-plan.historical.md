# Universal Agent-first QA — Global Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans for the approved, bounded implementation slice. This is the global programme: do not execute all phases as one task. Read the current owner checkpoint, resolve exact source, and detail only the next slice before changing code.

**Goal:** Агент самостоятельно исследует продукт, проектирует и выполняет качественный QA, проверяет тикеты, обслуживает граф и улучшает свою работу; сначала в диалоге Claude/Codex, затем теми же модулями в облаке.

**Architecture:** Существующие FreelandQAmain и QA Starter объединяются процедурой работы и небольшими совместимыми адаптерами, не новым движком. Агент и skills отвечают за QA-решения; product pack хранит бизнес-знания; инструменты исполняют и ограничивают операции; existing campaign/receipt/verdict сохраняют результаты. Улучшение идёт отдельными проверенными версиями, не изменением работающей кампании задним числом.

**Tech Stack:** Существующие TypeScript/JavaScript, Playwright, graph/knowledge APIs, CLI, Git, Markdown skills/references, официальный Nuanu Flow plugin; управляемый браузер и другие доступные инструменты по необходимости. Новая обязательная инфраструктура не вводится этим планом.

**Spec:** Утверждённые принципы и слои в [предыдущем плане](2026-09-05-agent-first-qa-reuse-implementation.md), требования пользователя в текущем диалоге; проверенная исходная база — [аудит skills от 2026-09-06](../audits/2026-09-06-qa-skills-contour-audit.md). Архитектурные решения и критерии ниже составляют глобальный design этого programme, а не новую продуктовую спецификацию Freeland.

**Status:** Утверждён пользователем 2026-09-06; G0 выполняется. Ограниченные source-срезы installer, qa-check и [qa-bugfix](../audits/2026-09-06-qa-g0-qa-bugfix-handoff.md) прошли независимое ревью и применены локально. Установка, остальные F2–F5 и приёмка всего G0 не завершены. План не выдаёт новых полномочий, не меняет ownership и не запускает QA/покупки/публикации. Это текущая глобальная последовательность; предыдущий план сохраняется как история и очередь Freeland. Действующие задачи продолжаются в прежних границах.

## 0. North star, границы и варианты

Цель — заменить операционную работу QA-тестировщика: пользователь сообщает продукт и задачу, агент сам восстанавливает контекст, исследует, выбирает и выполняет проверки, расследует отклонения, возвращает результат и улучшает следующий проход. Доказательства нужны для качества работы, но не являются самостоятельной целью продукта.

«Универсальный» означает переносимость процесса и возможность добавлять отсутствующие capabilities по реальной необходимости. Это не обещание знать любой бизнес без источников или проверить недоступное устройство. Первое подтверждаемое семейство — web/API-продукты, включая авторизованные и stateful flows в разрешённых пределах. Native/desktop/IoT/специальные протоколы расширяют capability matrix отдельными проверенными адаптерами.

Рассмотрены варианты:

1. **Рекомендуется: композиция существующих модулей + agent-first skills.** Быстрая полезная проверка второго продукта, минимальный код, проверяемые границы переносимости.
2. **Новый универсальный framework/DSL/control plane.** Отложенная польза и дублирование уже имеющихся runner, graph, verdict и authority; сейчас отвергается.
3. **Только большой system prompt/пакет skills.** Быстро на демонстрации, но инструкции не обеспечат исполнение, продолжение и ограничения операций; как единственное решение отвергается.

### Global Constraints

- Продуктовый Freeland read-only: без product patches, push, merge, deploy и миграций. QA-репозитории изменяются только в согласованном ownership; внешняя публикация не подразумевается из запроса на проверку.
- NuanuFlowQA — история, generic skills и документы координации; FreelandQAmain — линия реализации Freeland. Не переносить всю разработку обратно в старый checkout.
- Не создавать второй runner/kernel/verdict, собственный Flow SDK, второй Spend Authority, обязательный dashboard или universal DSL.
- У каждой кампании один authoritative путь исполнения/решения, известный owner и зафиксированные версии. Агентские observations не выдаются за результат другого executor.
- Не использовать dirty/untracked изменения как доказанный commit. Не менять shared graph/current, fixtures или аккаунт параллельно с владельцем кампании.
- Нет автоматического переноса credentials, финансовых разрешений, бизнес-правил и частных фактов между продуктами. Secrets — вне graph, skills и открытых artifacts.
- Отсутствие готового спека не означает обязательный ручной тест. Сначала доступные инструменты агента; затем узкая автоматизация; человек только для действительно недоступного или требующего его полномочий шага.
- Ожидание человека блокирует зависимый scope, не независимую работу. Сам агент ограничен временем/бюджетом: после исчерпания безопасных независимых действий — checkpoint, не бесконечные попытки.
- Не приравнивать source coverage, authored/registered tests, screenshots, PASS self-tests или старый receipt к свежей проверке продукта.
- Бизнес-ожидание не выводится только из совпадения UI и API. Оба могут быть неверны. Неизвестный существенный контракт остаётся вопросом/риском.
- «Самообучение» здесь — управляемое обновление знаний, проверок, skills и инструментов; fine-tuning модели не является prerequisite.

## 1. Что переиспользуем — без повторной разработки

Снимок ниже основан на аудите 2026-09-06, не утверждает текущую версию live продукта. Перед реализацией заново проверяются HEAD/чистота/owner. Временные пути — locator принятых bytes, не будущий способ развёртывания.

| Наработка | Используемая роль | Состояние/граница |
| --- | --- | --- |
| FreelandQAmain runtime `b8f5906d1aba2e0a6f1de622cb06cb0d990f8e1c` | Graph-first, full/QA-ticket flows, existing verdict, regression/replacement corpus, fixtures и ограничители эффектов | Принятый QA checkpoint; не свежий release GO |
| Freeland skill source `3d0088ec86b16a2802aa09cca975ca65cc2ede32` | Специализированная инструкция и bootstrap | Source skill принят; generic routing остаётся противоречивым |
| Starter Console `771267c1a218489f93e6b20cad6ed637383f152d` | Workspace/product pack, authored checks/plan, validation/closure, actual public campaign runner/adapter и receipt | Эти интерфейсы уже существуют; не создавать заново |
| Starter campaign Kernel `9533fcd1e207b0f8edb8551ac446978149c2ccca` | Registration/knowledge revision, publication authority, contracts/validation | Public campaign executor этого пути находится в Console; не скрывать его границы словом universal |
| Reporting Kernel `10d398d8a077068c2184f33958e9b654a2f2947c` | Agent observations и отчётные read APIs | Не action attestation; stale-history aggregate имеет известную границу |
| Starter skill source `05aa822535481eceffa6d73bc9f77febc365306b` | qa-init, qa-product-v0, declarative/agent-observation references | Установлены одинаковые core bytes; dual-harness samples ограничены |
| Freeland graph + graph repo/Obsidian + исторические mappings | Проверенные зависимости, corpus, визуальная карта | Старые closures и prose-знания импортировать только после сверки источника/смысла |
| NuanuFlowQA, предыдущие I1/coverage/review наработки | Доноры существующих тестов, patterns, skills, regression/eval fixtures | Не импортировать репозиторий целиком и не доверять старым статусам |
| Nuanu Flow plugin | Чтение QA-колонки/тикета, dedupe, разрешённая запись/readback | Плагин — транспорт; проектные состояния и правила остаются в pack |
| Tect и другие изученные harness patterns | Справочник для нужной границы модулей, replay или выполнения | Не новый runtime dependency и не план копирования всего framework |

Перед заимствованием конкретного модуля: найти exact commit → прочитать реальный интерфейс/тесты → проверить совместимость с consumer → один отрицательный контроль → интеграционный review. Если потребность уже закрыта существующим интерфейсом, новой задачи на его разработку нет.

Расположение принятых контуров: `/Users/danilsolomin/.codex/qa-workspaces.md`. Source-only skills и accepted runtime имеют разные роли; обновление skill не меняет автоматически runtime.

### Ограничения Starter, заново сверенные с кодом при review этого плана

- Console `src/node/qa-campaign-runner.ts:312` запрещает любой side-effect authorization и всё, кроме read_only. `src/lib/qa-campaign-v0.ts:773` запрещает secret refs. Наличие fill/select в общей schema не означает доступность обычного ввода/auth: их environment refs должны совпасть с запрещёнными secret refs. Текущий adapter работает в новом браузерном context с same-origin/read-only ограничениями. Первый portable runtime выбирает совместимую public UI/API-функцию; не получает новые возможности от owner approval flag.
- General Kernel `ProductGraphV1Schema` знает разные бизнес-связи, но `src/contracts/product-graph.ts:215` в registration dialect принимает только check→target `verifies`. Нельзя обещать, что uses/requires/affects уже проходят регистрацию/knowledge publication. G1 сначала использует совместимую coverage-проекцию, G2 отдельно замыкает реальный dependency→plan переход.
- `src/kernel/knowledge-revision.ts:64` сохраняет registration context/discovery/profile; прежние requirements и discovery blockers нельзя молча убрать. Новая среда, снятие blocker или retirement требования требуют соответствующего recovery/context-transition, которого обычный knowledge delta не заменяет. Это явный maintenance debt, не повод ослаблять guards.
- Runner исполняет переданные checks, а не сам выводит их из business graph; every omitted catalog relationship требует явного blocker, all-blocked план не запускается. Authored schema/валидация, public runtime, agent observations и полное бизнес-покрытие — четыре разных факта.
- Console создаёт новый runId для каждого вызова и записывает final receipt после цикла исполнения (`src/node/qa-campaign-runner.ts:226`, `:303`). Registration replay не означает восстановление campaign/human request. Durable continuation, связывание ответов и применение eval результатов остаются предметом G3/G4/G6, а не уже готовым универсальным state engine.
- Reporting Kernel `src/kernel/target-observation-report.ts:77` читает всех owners и отказывает при stale publication. Для отчёта после knowledge revision нужен квалифицированный выбор текущих observations с историческими отдельно; до него — ограниченный current-ID readback и явный scope. Нельзя переписывать старые evidence IDs или ослаблять stale guard ради aggregate PASS.
- Dossier содержит `regressionCheck`, а runner создаёт локальный ticket HTML: это заготовки для последующей регистрации/публикации, не автоматический regression или готовый tracker engine. Learning G4 должен довести изменение до реального selection/execution, а Flow delivery G2 — до разрешённого readback.

## 2. Целевые слои и границы решений

| Слой | Что делает | Где жёсткость необходима | Где остаётся reasoning |
| --- | --- | --- | --- |
| 1. Вход/host adapter | Запрос диалога, позже job; выбирает pack и режим, восстанавливает работу | Project/environment/account, capabilities, authority и checkpoint identity | Понимание намерения и полезного следующего действия |
| 2. Skills/pipelines | Метод работы QA и маршруты к существующим инструментам | Обязательные проверки перед эффектами, формат минимального результата | Recon, test-design, исследование UI, приоритет, диагностика |
| 3. Product pack/graph | Ожидания, источники, роли, journeys, зависимости, риски и gaps | Ссылки/версии, область факта, различие нормы/наблюдения/гипотезы | Обнаружение новых связей и конфликтов |
| 4. Tools/adapters | Browser/API/mail/logs/fixture/provider/tracker, повторяемые assertions | I/O, target, лимиты, timeout, idempotency/reconciliation, redaction | Выбор подходящего инструмента и обоснованных параметров |
| 5. Campaign/results | План, выполненное, evidence, ожидание помощи, отчёт/verdict | Нельзя сделать PASS из skip/stale/unknown; trace к реально исполненному | Классификация проблемы и рекомендация по риску |
| 6. Learning/evals | Улучшение QA на основе обнаруженного ограничения | Версии, независимый контроль, protected eval criteria, обратимое применение | Что улучшить: факт, тест, инструмент, инструкцию или тестируемость продукта |

Детерминированный инструмент — предсказуемая операция и честный результат при наблюдаемом внешнем состоянии, а не гарантия одинакового ответа сети. Внешняя вариативность выражается исходом/timeout/unknown, не скрытым LLM-решением внутри механического assertion.

Это логические слои, не шесть новых сервисов. Поначалу достаточно существующих модулей, команд, файлов и API. Общими делаем только реально повторившиеся части.

### Минимальные handoff-данные, не новая универсальная schema

В существующих plan/checkpoint/receipt должны находиться: продукт/среда/доступная identity; pack/graph/test версии; выбранный scope и причина; assertion с источником ожидания; fixture/capability/authority; реальное действие и outcome; evidence refs; blockers/следующий шаг. Сначала используем текущие поля; совместимое расширение — только если отрицательный тест доказал, что данных не хватает.

Для black-box продукта без доступного release SHA сохраняем доступную наблюдаемую identity и явно ограничиваем claim. Не выдумываем SHA и не запрещаем все полезные функциональные проверки из-за отсутствия Git-доступа.

## 3. Рабочий цикл агента

```text
Запрос / продолжение
    ↓
Pack, версия, capabilities, полномочия, незавершённые действия
    ↓
Discovery + граф + требования + изменения/тикеты
    ↓
Risk-based тест-дизайн и обоснованный план
    ↓
Исполнение ↔ диагностика / ограниченное исследование
    ├─ нужен человек → checkpoint → независимые проверки продолжаются
    └─ реальный outcome → evidence → per-case и общий scoped результат
    ↓
Разрешённый tracker feedback + регрессии + reviewed knowledge delta
    ↓
Evals / независимая проверка → новая версия QA → следующий проход
```

Режимы одного процесса: новый продукт; полный QA; impact/regression; QA-колонка; отдельный тикет; исследование области; продолжение; обслуживание QA. Наличие режима не подразумевает одинаковый scope или права записи.

## 4. Глобальная последовательность и критерии приёмки

Каждый G-этап — самостоятельная проверяемая способность, не обязательный новый пакет кода. Внутри — небольшие independently reviewed изменения. Слова «готово» ниже означают критерий будущей приёмки, не уже полученный статус.

### G0. Согласованный вход и безопасное переиспользование

**Checkpoint 2026-09-06:** F1 force-overwrite устранён локально, регрессия2/2 и independent Lead AQA APPROVED. [Task2 qa-check/entrypoints](../audits/2026-09-06-qa-g0-qa-check-handoff.md) reviewed и применён к local source: pack/owner routing, agent-first manual handling, conditional tracker, no false FIXED. Installed skills не менялись. Offline5→5 decision samples не равны tool-effect qualification; Claude OAuth expired, actual dual-host gate открыт. Main общий typecheck падает с теми же143 диагностик при virtual-before сравнении; focused slice gates green. Остаток F2–F5, delivery и полная приёмка G0 не завершены; Task3 описан ниже.

**Дополнение checkpoint:** [Task3 qa-bugfix/fix-prompt](../audits/2026-09-06-qa-g0-qa-bugfix-handoff.md) V3 принят Lead AQA и применён к семи local source файлам. Пять raw artifact samples сохраняют product/tracker/checkout identity и разделяют developer handoff/QA acceptance; это не live tracker или dual-host qualification. Установленные копии не менялись. Legacy E2E worker и supporting guidance остаются следующими срезами.

**Task4 checkpoint:** [два пункта legacy E2E worker](../audits/2026-09-06-qa-g0-e2e-worker-capability.md) исправлены root и применены локально после независимого Lead AQA APPROVE: Playwright не требует лишнего MCP-повтора; неизвестный исход операции сначала восстанавливается, а не проверяется новой попыткой. V1 не принят из-за recovery ambiguity; V2 прошёл5 fresh offline samples. Это source-level срез, не весь G0, не actual Claude и не financial executor qualification. Остальные legacy/supporting противоречия и selective delivery остаются открыты.

**Польза:** новый Claude/Codex попадает в правильный процесс без ручного объяснения истории.

**Source:** NuanuFlowQA `skills/qa-check`, `skills/qa-bugfix`, `scripts/install-codex-skills.mjs`, `AGENTS.md`, `CLAUDE.md`, `.claude/agents/e2e-runner.md`; reviewed Freeland/Starter skill sources. Для installed e2e/verification сначала установить их source owner, не править случайную копию. Accepted runtime не меняется ради документации.

- [ ] Зафиксировать source/delivery map: какой bundle откуда устанавливается и какие wrappers его маршрутизируют. Сделать точечную защиту от legacy force-overwrite, сохранить backup/readback.
- [ ] Исправить F1–F5 аудита: routing, ложный FIXED, financial/readiness примеры, stack-aware engineering verification и безопасные diagnostics. Не превращать его в продуктовый verdict.
- [ ] Уточнить host capabilities: worker не получает MCP только потому, что его имя упомянуто в skill. Реальный инструмент или явный parent fallback.
- [ ] Согласовать общую QA-процедуру в Claude/Codex; host-specific вызовы оставить тонкой оболочкой. Не вводить разные бизнес-правила для моделей.
- [ ] Сначала воспроизвести неверное поведение в disposable scope, затем исправить и проверить соседний валидный сценарий. Shared source changes review отдельно от selective installation.

**Приёмка:** implicit full/ticket/resume/new-product запросы из правильного и старого cwd находят правильный pack; existing workspace не создаётся повторно; read-only запрос не пишет в Flow; legacy installer не затирает specialist skill; неверный target не допускает эффекта. Подтверждение — реальные tool/filesystem outcomes в обоих hosts, не только ответы на вопросы.

**Не ждём G0 целиком:** независимая текущая product QA может продолжаться через принятые specialist входы и owner. Не останавливать чужую кампанию ради консолидации инструкций.

### G1. Полезный переносимый бизнес-сценарий на втором продукте

**Checkpoint 2026-09-06:** [offline source slice](../audits/2026-09-06-qa-g1-offline-public-auth.md) реализован на existing Console771/Kernel953 без нового runtime. Независимый Lead AQA проверил actual source и evidence: APPROVED; fixed/leak/stale-plan контроль пройден, GREEN4/4, legacy6/6. Coordinator сверил source и 11 artifact hashes. Synthetic graph3→4 сохраняет три blockers; selected PASS не становится общим PASS. [Bounded handoff](../../local/qa-starter/proposals/2026-09-06-g1-public-pilot/HANDOFF.md) остаётся только про redirect и известный panel marker, не всё protected content. Owner MagicCard подтвердил контекст, но не новую live кампанию/публикацию; его workspace/session не трогаются. Source пока не закоммичен; live G1 не закрыт.

**Польза:** подтверждаем, что инструмент работает за пределами Freeland уже сейчас.

**Отдельный supporting slice:** [CLI argument gate](../audits/2026-09-06-qa-g1-cli-argument-gate.md) принят independent Lead AQA и зафиксирован в local SOURCE_SHA `4d1b47f301d54002d90334a4765ba406047a15c4`; root проверил parent, два committed blob и равенство reviewed diff. Unknown/wrong-verb flags больше не игнорируются в этом source checkpoint; actual RED→GREEN, compatibility20/20 и unchanged controlled legacy6/6. Accepted runtime pins и G1 live статус не изменены.

**Новый source checkpoint (заменяет прежнее «не закоммичен»):** G1_SOURCE_SHA `8967e9e9216347fc318eae92f6d0f1e08a1a011e` и [совместный isolated candidate](../audits/2026-09-06-qa-g1-combined-candidate.md) `1188389feffcc8615fe98a07caed1758c577cb3f` прошли root readback и independent Lead AQA APPROVE. Combined CLI1/1+20/20, public-auth4/4 и legacy6/6 проходят; all-five-files TypeScript сохраняет прежние14 ошибок. Kernel/accepted runtime не изменены, live G1 открыт. Starter исследует ближайший existing business-dependency→authored-plan seam G2 read-only; новый движок не разрешён.

**Source:** существующий product pack MagicCard и его owner; Starter `src/lib/qa-campaign-v0.ts`, `src/node/qa-campaign-runner.ts`; Kernel knowledge/observation APIs; `skills/qa-product-v0` и его references. Эти APIs переиспользуются, не переписываются.

- [ ] На безопасной границе текущей задачи взять актуальный checkpoint и одну доступную бизнес-функцию. Root не запускает конкурирующий runtime. Нет обещания конкретного live статуса по старому индексу.
- [ ] Агент исследует цель, роли, состояния, входные данные и зависимые поверхности. Разделяет normative expectation, наблюдаемое поведение, гипотезы и unknown.
- [ ] Спроектировать позитивный и содержательный негативный сценарий, а также релевантную границу/ошибку восстановления. Не заменять бизнес-проверку root200/bodyvisible.
- [ ] Применить existing pack → authored checks/plan → validate → executor → receipt. Где нужен managed browser, сохранить agent-led evidence как таковое, не приписывая его public executor.
- [ ] Совместимое новое target/check/oracle знание внести через текущую knowledge revision на границе кампании. Сформировать следующий план и показать изменение покрытия. Бизнес-зависимости, не принимаемые registration dialect, сохранить как reviewed source предложения G2, не выдавая их за опубликованный typed graph.

**Приёмка:** один реальный безопасный бизнес-сценарий выполнен existing declarative runner; positive/negative outcomes прослеживаются до доказательств; совместимая graph/catalog revision меняет учёт и следующий план; невыбранные и недоступные пути остаются видны. Controlled buggy/fixed fixture проверяет чувствительность assertion, если на реальном продукте нельзя безопасно получить дефект. Fixture не называется live product результатом. Managed-only проверка полезна, но сама не закрывает приёмку цепочки authored plan→executor→receipt; если подходящей public функции пока нет, G1 остаётся частично выполненным, без выдуманного live evidence.

**Ограничение:** завершение G1 не равно полному QA MagicCard или полной универсальности. Невозможность покупки не блокирует первый read-only pilot. Новый adapter добавляется только после доказанного пробела существующих средств.

### G2. Полный QA и QA-тикеты на основе обслуживаемого графа

**Польза:** агент проверяет продукт, а не только известный список specs или diff.

**Локальный checkpoint 2026-09-06:** узкий graph→agent-authored assertions vertical подтверждён на синтетическом API через existing Kernel/Console: actual A→B publication, два независимых автора, настоящие CLI receipts, положительные и отрицательные семантические контроли, независимые Lead AQA reviews. [Результат и ограничения](/private/tmp/qa-g2-semantic.HNqkQN/RESULT.md). Это не полный G2, не real-product G1, не installed runtime и не облако. Следующий срез переиспользует этот путь для реального безопасного business-flow и текущих full/ticket QA references; не строит второй движок. Остальные checkbox ниже остаются глобальными obligations, а не закрываются локальным fixture.

**Source:** Freeland graph/model/planner/mappings, `qa:plan`, `qa:run --shadow`, `qa:sprint`, существующий Release Verdict; Starter closure/knowledge/campaign APIs; официальные Flow skills. Общую процедуру ticket verification сначала вынести в reference, не в новый tracker SDK.

**Checkpoint 2026-09-07 — preservation и ordinary-skill baseline:** квалифицированные local G2 source commits сохранены тремя incremental Git bundles (Kernel393, Console5ab, отдельный текущий skill donor05aa) в [private checkpoint](../../local/qa-starter/qualifications/g2-preserved-20260907.NLuQak/README.md). Восстановление из постоянных prerequisite repositories проверено в отдельных bare repositories; evidence сохранено с exact relocation map, без переписывания старых receipts. Это backup/source checkpoint, не installed runtime. Найден реальный integration gap: skill в Console5ab устарел, текущая reference есть только в отдельном donor; нельзя переносить дерево целиком. Ordinary installed instruction на трёх предложенных планах и одной исторической диагностике дала ожидаемые выводы без evaluator rubric; [baseline evidence](/private/tmp/qa-g2-skill-baseline.4E7gD6/RESULT.md). Не демонстрирует статистическую надёжность/эффект новой инструкции; новую инструкцию не добавляли, поскольку baseline не обнаружил сбоя. Следующее изменение — изолированное соединение exact reviewed runtime и skill donors с affected tests/review, затем owner-coordinated real-product G1. Все глобальные checkbox остаются открыты в непроверенной части.

**Следующий выполненный source checkpoint 2026-09-07:** reviewed Console5ab и оба текущих skill donor объединены в local commit `43262b2202532d9ea5648e27dafe0fc5177689fe`, tree `131a20f8b2fc206ca370ed91aa686739ca707485`. Девять donor paths изменены, остальные142 сохранены; independent Lead AQA APPROVED. Четыре agreed команды дали32 selected passing harness nodes, не product scenarios;60 filtered parents и auxiliary Python validator не выполнены. [Bundle, evidence и readback](../../local/qa-starter/qualifications/g2-preserved-20260907.NLuQak/source-integration.lsU0mq/FINAL.md) сохранены вне tmp. Установка/promotion не выполнены. Следующий отдельный fix — existing authored fixture953 против CLI393: переиспользовать один accepted loader после scoped approval, воспроизвести и перепроверить старую регрессию без ослабления pin. Owner-coordinated real-product G1 и остальные глобальные обязательства открыты.

- [ ] Развить discovery/test-design reference: роли × состояния × поверхности × provider × positive/negative/boundary/recovery по риску. Полный декартов перебор не требуется; исключённые важные комбинации объясняются.
- [ ] Замкнуть бизнес-зависимость→scope на существующем общем ProductGraph contract: reviewed источник связи, точное соответствие registration target/check IDs и чтение этой связи агентом при authoring следующего плана. Сохранить source revision и причинную связь с выбранными assertions в planning evidence. Если publication dialect не принимает нужную связь, добавить узкую совместимую projection/consumer границу с отдельными negative tests, не новый graph engine и не снятие всех registration ограничений. Неиспользуемый sidecar не считается результатом; при ошибочной или удалённой связи контроль должен выявить потерю обоснованного выбора.
- [ ] Для каждого critical journey сформулировать assertions: предусловие, действие, бизнес-эффект, oracle source, наблюдаемый readback. Тестирование сумм/валют/комиссий, access control и идемпотентности опирается на формальные инварианты, когда они определены продуктом.
- [ ] Сделать обычным шагом проверку цепочки authored → registered → eligible → selected → executed → assertion outcome. Найденные незарегистрированные VPN specs сначала проверить на смысл и пригодность, не подключать все автоматически.
- [ ] Full включает critical baseline, релевантные изменения, известные bugs и ограниченные exploratory charters. Impact объясняет зависимости; unmapped изменение требует расширения/исследования. Информационный source узел графа не объявляется самостоятельным тестом.
- [ ] В человекочитаемом отчёте отличать «не выбран по обоснованному scope» от «недоступен для проверки». Текущий V0 представляет omitted catalog relationship через blocker; нельзя удалять entry ради impact PASS или искажать итоговый receipt. All-blocked исход — учёт/план/checkpoint без выдуманного execution receipt.
- [ ] QA-column: прочитать все страницы/состояния нужного scope через plugin, получить исходные условия/ожидания, проверить candidate и связанные regressions. Single-ticket не считается всей колонкой; общий зелёный suite не даёт FIXED.
- [ ] Результаты тикета различают исправлено, воспроизводится, недостаточно данных, среда/доступ блокируют, не проверено. Это смысловое отображение в existing statuses, не обязательные новые enum/колонки.
- [ ] Blocking policy определяется риском и договорённостью продукта, не наличием автоматизации или меткой manual. Критический неизвестный money/security/access путь исключает безусловный release GO; принятие остаточного риска и изменение порога не являются обычным улучшением теста. Необязательная низкорисковая проверка не блокирует релиз только из-за своего формата.
- [ ] Для FIXED нужны достаточные исходные сведения о дефекте и фактическая проверка исходного сценария/эффекта на новом candidate. Не требуется искусственно ломать prod ради исторического RED. Когда исходные условия не установлены, вывод слабее FIXED.
- [ ] Разрешённые tracker writes: dedupe до создания; проектный шаблон/priority contract; readback тикета, вложений и перехода; unknown write сначала reconciled. По умолчанию проверка не выдаёт новых write permissions.
- [ ] Включить UI semantics/responsive/keyboard/contrast и применимые security/privacy/performance/reliability checks в тот же risk plan. Screenshot/axe/latency sample — отдельные источники, не автоматическое общее NFR PASS. Нагрузка/пентест требуют подходящей среды и отдельного scope.

**Приёмка:** на одном продукте полный режим возвращает состояние всех обнаруженных областей, QA-режим отдельно классифицирует каждый взятый тикет. Контрольный mixed set ловит fixed/still broken/unknown oracle/harness error/stale/duplicate; ни один skip или coverage-only не становится FIXED. Та же процедура применена к read-only ticket другого pack. Запись отдельно квалифицируется только при её разрешении.

**Отдельный обязательный graph exit:** одна подтверждённая business dependency действительно меняет связанные выбранные проверки; новое unmapped изменение не позволяет необоснованно сузить scope. Простое добавление ещё одного verifies edge G1 этого не доказывает.

### G3. Сокращение человеческого участия через реальные capabilities

**Польза:** агент не просит человека нажать кнопку, если способен сделать это сам, но и не имитирует недоступный шаг.

**Source:** existing session/mail/fixtures/request guards, replacement/recovery helpers Freeland; Starter public/agent observation lanes; `qa-product-v0` human-help policy. Точки расширения — узкие адаптеры проекта и references, не глобальный scheduler.

- [ ] В pack описать тестовые роли/fixtures, login/session lifecycle, среды, доступные инструменты, разрешённые эффекты и ограничения; значения секретов не хранить в pack.
- [ ] Сначала preflight capability: UI/API/logs/email/identity/test data. Инструмент проверяет возможность операции, skill выбирает полезный способ получить доказательство.
- [ ] По реально блокирующим cases подключать auth/mail, role isolation, provider callbacks/observability, Telegram/native/device, reset/seed среды. Все эти adapter families — условный backlog, а не обязательная предразработка.
- [ ] Для финансовых проверок переиспользовать действующую authorisation и ledger в её scope: проект, среда, инструмент, операция, сумма/общий бюджет, срок и неизвестные исходы. Не переносить историческую карту/лимит в новый продукт; не требовать повторной покупки без причины.
- [ ] Документировать ограниченную standing authority на обслуживание QA как предлагаемую политику, согласовать её один раз до autonomous promotion. Не считать этот план уже выданным разрешением на оплату/публикацию/смену guards.
- [ ] Когда нужен человек: минимальный request связан с case, identity, уже сделанными попытками, evidence, ожидаемым ответом и resume шагом. Независимый scope продолжается; дубликаты requests объединяются.
- [ ] В новой сессии или другом host прочитать checkpoint, проверить ответ/доступ/состояние заново, продолжить только зависимый шаг. Lost-response операция сначала reconciled; автоматический повтор оплаты запрещён.
- [ ] Testability requests команде: стабильные selectors/контракты, seeded роли, безопасный изолированный reset, trace IDs, idempotency/read-only audit endpoints. Это внешние задачи с владельцем, не автоматическое право агента менять продукт и не «нулевая стоимость» для команды.

**Приёмка:** один ранее ручной сценарий действительно исполняется агентом; во втором случае независимые проверки завершаются во время human wait; новая Claude/Codex сессия корректно продолжает case без повторной регистрации/мутации. Метрика human touches уменьшается на сопоставимом scope без потери defect detection. Дополнительные платежные/device возможности квалифицируются отдельно.

### G4. Управляемое самообучение и самоулучшение

**Польза:** каждое полезное наблюдение может улучшить следующий QA, а не остаться в истории чата.

**Source:** current Git/review/eval fixtures, product pack, graph/knowledge publication, regression/dossier APIs, selective skill delivery, Freeland `stale-staging-renewal.mjs`. Не новый memory service или learning engine.

- [ ] После каждого прохода выполнить короткий разбор: новый факт/зависимость; escaped defect; harness/selector/readiness error; лишний запрос человеку; недостаточная capability; устаревшая квалификация. Если полезного delta нет — зафиксировать отсутствие изменений, не создавать косметическую работу.
- [ ] Для находки выбрать минимальный слой исправления: project fact, assertion/test, mapping, fixture/helper, skill/reference, shared module либо запрос тестируемости продуктовой команде.
- [ ] Сохранить исходный дефект и прежние результаты; подготовить точечный diff в изоляции. Источник ожидания и основание изменения обязательны; неверное поведение продукта не принимается за новую норму автоматически.
- [ ] Проверить старую/новую версию на одинаковом контроле, соседний неизменяемый случай, отрицательный пример и affected existing checks. Если источник старого дефекта не воспроизводим, явно ограничить strength evidence; не выдумывать measured improvement.
- [ ] Независимый reviewer оценивает действия, assertions, исходы, scope и безопасность; semantic/business change обязательно проходит QA review. Автор изменения не меняет protected evaluation labels/ожидания, которыми оправдывает свой результат.
- [ ] При доказанной пользе применить reviewed version по действующему authority на безопасной границе: graph knowledge API/CAS, exact QA commit или selective skill install с backup/readback. Текущая campaign сохраняет свои inputs; следующий plan использует новую версию.
- [ ] При regression остановить affected lane, вернуть предыдущий совместимый tool/skill pin или сделать compensating knowledge revision. Сохранить обе версии и результаты. Не удалять пользовательские данные, старые receipts или тесты ради rollback.
- [ ] Для knowledge corrections учитывать реальные transition invariants: допустимое исправление существующего знания не равно удалению прежнего target/blocker или смене discovery context. Если current API не выражает legitimate retirement/revalidation, сначала добавить узкий versioned transition с контролем сохранения истории и scope; до него хранить конфликт/stale статус отдельно и не объявлять gap закрытым. Не обходить API ручной правкой managed JSON и не регистрировать продукт повторно ради обхода ограничения.
- [ ] Обобщать pattern только после полезного повторения: balance conservation с fees/pending, idempotency, state machine, UI/API differential, metamorphic check. Переносить обезличенную технику, не источники/доступы первого продукта. Не создавать отдельный oracle-файл на каждое рассуждение.

**Приёмка — три отдельные демонстрации:** (1) ранее пропускаемый дефект теперь обнаруживается, buggy контроль FAIL, corrected PASS; (2) новый verified graph edge меняет следующий план; (3) process/helper improvement устраняет конкретный сбой или human touch без новых false PASS. Хотя бы одна demonstration воспроизводится в другом host; общий semantic helper дополнительно проверяется в другом product context.

**Что запрещено считать улучшением:** рост PASS-rate через skip/удаление difficult cases, снижение severity без оснований, ослабление oracle/timeout guards, hidden retries, сокращение denominator, переименование старого evidence в новое. Ослабление authority или release gates не может быть следствием обычного autonomous learning.

**Когда нужен человек:** новый значимый business contract без авторитетного источника; расширение полномочий/бюджета/среды; изменение accepted risk policy; необратимые эффекты вне standing scope. Обычные read-only checks и совместимые локальные улучшения не требуют ручного управления каждым шагом. Публикация общих изменений автоматизируется только в заранее делегированном maintenance scope; это отдельная граница от release approval продукта.

### G5. Квалификация переносимости и устойчивое обслуживание

**Польза:** способность не зависит от памяти одного длинного диалога или одной модели.

- [ ] Составить capability matrix по реально поддержанным поверхностям: public web, authenticated web/API, roles/stateful flows, provider/mail/async, mobile web, native/desktop. Каждая строка: проверено / экспериментально / отсутствует с конкретным доказательством.
- [ ] Два полноценных локальных прохода на явно зафиксированных версиях/сопоставимом scope показывают работоспособность: discovery → plan → execution → diagnosis → report/ticket → graph/regression update. Это инженерная квалификация, не статистическая гарантия отсутствия багов.
- [ ] Проверить тот же core workflow в fresh Claude и Codex: реальные доступные tools, действия/артефакты, checkpoints, ограничения. Изменение модели или host adapter требует affected requalification, не только равенства SKILL.md hashes.
- [ ] После Freeland и MagicCard взять третий отличающийся контекст, например SaaS с ролями/приглашениями, когда он доступен и разрешён. Сначала ограниченная функция; не форк engine, меняется pack и доказанно нужный adapter. Native support этим не доказывается.
- [ ] Хранить installable/versioned общий skill/tool bundle; исключить случайные tmp paths как deployment contract. Использовать существующие manifests/bundles, не создавать новый registry service. Проверить восстановление из источника и private inputs без зависимости от старого компьютера.
- [ ] Карантин/старая квалификация: причина, владелец, риск, дата пересмотра и альтернативное покрытие. Review deadline зависит от риска проекта; нельзя молча исключать тест из scope.
- [ ] Сокращать дублирующие инструкции после успешной замены и проверки маршрутов, сохраняя историю. Провести выборочную ревизию тестов на «проходит по неверной причине».

**Приёмка:** независимая свежая сессия выполняет заявленный QA-процесс без восстановления истории человеком; новый pack не требует копирования Freeland ядра; заявленные capabilities доказаны, unsupported явно видны. В согласованном qualification наборе отсутствуют false PASS/FIXED и неразрешённые эффекты; обнаруженный такой исход блокирует promotion соответствующей версии QA до исправления.

### G6. Облако как новый host работающего QA

**Польза:** автоматические задания и продолжение без локального компьютера, без изменения QA-семантики.

- [ ] После локальной квалификации выбрать поддерживаемый host и проверить актуальные условия исполнения, сетевой доступ, browser/device поддержку и способ аутентификации. Подписку пользователя не считать автоматически правом на произвольный headless SaaS/worker; решение проверяется в момент внедрения.
- [ ] Упаковать существующий workflow в job input + durable checkpoint/output: isolated project workspace, зависимости/browser versions, secret delivery, bounded resources, один campaign owner/lock, отмена и handoff.
- [ ] Начать с одного public read-only job. Stateful/financial/native capabilities переносить отдельно, сохраняя authority и лимиты. Наличие VPN/private-network локально не доказывает cloud connectivity.
- [ ] Для автономных tracker writes выдать отдельную identity агента и соответствующие permissions; не изображать human account самостоятельным агентом. В диалоге использовать текущую разрешённую identity прозрачно.
- [ ] Проверить restart, duplicate trigger, lost response, отмену/timeout, истёкшую сессию, недоступную среду, request/reply от человека. Никакой дублирующей покупки или ложного resume PASS.
- [ ] Сравнить local/cloud на одинаковом scope и доступных capabilities: различия объяснены, облако не выдаёт более сильный verdict без дополнительных проверок.

**Приёмка:** job проходит тот же цикл, переживает прерывание, выдаёт результат/явные gaps и продолжает после ответа; QA-логика, graph и tools не переписаны. Расписания, массовая многопроектность, тарификация, отдельный UI и крупный control plane не нужны до реального спроса.

## 5. Граф: как он используется и действительно улучшается

### До прохода

Определить релевантный graph snapshot и источники; проверить drift продукта/провайдера, stale ожидания, требования без assertions, незарегистрированные checks, unmapped changes. Получить из графа affected scope и связанные critical journeys; дополнить bounded discovery, чтобы граф не ограничивал поиск уже известным.

### Во время прохода

Читать цепочки зависимостей и источники ожиданий, фиксировать scope decisions. Новый факт/edge сначала proposal. Product behavior, нормативное ожидание, hypothesis и confirmed defect различаются. Сведения из тикета не становятся истинными только по его статусу; verified ticket links требуют достаточных evidence и актуального readback. Pending tickets/proposals хранятся отдельно от accepted knowledge.

### После прохода

Применить только проверенные deltas, проверить ссылки/смысл/affected assertions; выпустить новую knowledge revision, перепланировать и обновить Obsidian из того же принятого источника. Repo графа остаётся местом согласованной публикации, не конкурирующей ручной истиной. Синхронизация/push подчиняются действующей авторизации.

Изменение графа не переписывает старый run. Смена бизнес-ожидания/оракула требует affected requalification; косметический Obsidian update сам по себе не означает повторную покупку. Использовать существующие conservative invalidation правила; новый fine-grained digest engine не prerequisite.

В отчёт каждого прохода включать: новые найденные пути; принятые связи; открытые/закрытые/stale gaps; critical assertions без текущего результата; что изменится в следующем плане. Структурные и runtime числа не складываются в единый «процент покрытия».

## 6. Skills: компактный комплект, а не отдельный skill на каждый тест

| Workflow | База | Что добавить/согласовать |
| --- | --- | --- |
| Product routing/onboarding/resume | qa-init + qa-product-v0 + specialist Freeland | Общие границы выбора, source resolver, capability discovery; no duplicate registration |
| Discovery/test-design | qa-check recon, pack/corpus, qa-product reference | Роли, состояния, риски, sources/oracles, assertions и unknowns |
| Full/impact/ticket QA | Freeland workflows, Starter execution + plugin | Переносимая ticket reference и source-specific параметры из pack |
| UI/NFR | browser-qa, e2e-testing, existing checks | Evidence-aware assessment и применимые product thresholds, не generic SHIP |
| Human continuation/data/authority | Existing help/guards/fixtures | Минимальный durable request/case handoff и реальный resume |
| Diagnose/maintain/learn | Triage, renewal, Git/review/evals, knowledge APIs | Единый short post-run workflow и доступ к существующим maintenance tools |
| Engineering verification | verification-loop, repo scripts | Stack-aware команды, сохранение exit status, redaction; не product verdict |

Предпочитаем короткий вход + точечные references с понятными inputs/outputs и границами. Отдельный skill выделяем, когда у него самостоятельный trigger и повторяемый процесс. Shared business decisions не дублируем между Claude/Codex. Модель рассуждает, tool не выдаёт полномочий из текста страницы/тикета.

## 7. Evals и измерение качества — с G0, не после облака

Небольшой защищённый контрольный набор собирается из реальных ошибок и controlled fixtures. Не новая benchmark platform. Проверяем не только ответ, но фактические tools/state/artifacts и независимую оценку assertions.

Обязательные группы: wrong cwd/legacy install; unknown oracle; skipped/stale/deceptive green; hydration/selector/harness failure; graph omission; real buggy/fixed assertion; effect authority/unknown outcome; duplicate Flow write; human wait/resume; unavailable capability; visual capture без анализа; prompt injection из DOM/тикета/source comments; cross-project data leakage; отмена и выход за бюджет.

До promotion shared semantic изменения фиксируются прежние labels/критерии и соседние cases. Автор не меняет оценку вместе с кандидатом. Сохраняются несколько reviewer-held cases; добавление нового случая не скрывает провал старого. Exact replay или synthetic control явно отделяется от live observation.

| Метрика | Как считаем и что она означает |
| --- | --- |
| False PASS/FIXED и пропущенные known defects | По размеченным контрольным cases и последующим подтверждённым находкам; не по самооценке агента |
| Escaped defects | Сопоставляем prod дефект с предыдущим scope/expectation; фиксируем причину и regression, не объявляем любой новый баг прежним пропуском |
| Assertion coverage | Для critical journeys: ожидаемое/спроектированное/исполненное/подтверждённое; по ролям/веткам, а не «один тест на requirement» |
| Graph health | Неизвестные пути, stale источники, unmapped changes, неподключённые checks и влияние графа на план |
| Human touches | Реально блокировавшие обращения и выполненные человеком шаги; общая и на сопоставимый scope |
| Автономное завершение | Доля requested applicable cases, закрытых агентом; blocked/not-assessed не исключаются из знаменателя незаметно |
| Reliability | Flaky исходы, hidden/visible retries, environment/harness failures и влияние на решение |
| Время/стоимость | До полезного результата и итогового отчёта; tool/model/test расходы; не улучшать скорость ценой пропуска scope |
| Learning effectiveness | Конкретный дефект/лишний шаг до и после изменения при неизменных критериях и сохранённом соседнем покрытии |

Нулевой false PASS на конечном qualification наборе — release gate конкретной версии QA, не доказательство абсолютной надёжности. Общий процент готовности универсального агента не вычислять из числа модулей/self-tests. Показывать принятые G-этапы и capability matrix.

## 8. Параллельность, ownership и отсутствие архитектурного разрастания

Критический путь: **G0 essential routing → G1 → G2 → G5 → G6**. G3 начинается при первом реальном manual blocker; G4 с первого полезного finding; evals с G0. Freeland repairs и второй product pilot идут параллельно — полное закрытие Freeland не prerequisite переносимости. NFR/test-design не откладываются на конец: в G1/G2 выбирается применимый минимум, G3 расширяет недоступные capabilities.

| Поток | Ответственность | Не пересекается без согласования |
| --- | --- | --- |
| Root | Master plan, scope, integration, independent review, выбор минимального slice | Не присваивает чужой live run или shared current |
| QA Starter — задача 01a071f1-05cf-7eb2-8a18-ccf204874345 | Portable interfaces, skill references, clean consumer qualification | Не меняет продуктовые Freeland rules/receipts |
| Claude — «Шлифовка QA Freeland» | Согласованные Freeland helpers/contract fixes и evidence | Не меняет общий planner/manifest/skills одновременно с другим owner |
| MagicCard — задача 01a0720c-a6b5-7dc0-b1e0-86527a8f5856 | Product pack и один реальный проход второго продукта | Не заимствует Freeland authority; root не дублирует runtime |
| Независимый Lead AQA Engineer | Test-design, oracle, coverage, regression, release scope | Не является автором принимаемого semantic изменения |
| AI-first/CTO reviewer | Минимальность архитектуры, learning, authority, переносимость | Не заменяет AQA-приёмку продукта |

Это распределение направлений, не отправленные задания или актуальный статус соседних задач. Перед dispatch — прочитать их checkpoint/diff и согласовать bounded file ownership. Один исполнитель stateful lane/account; read-only анализ и isolated QA-code tests параллельны. Shared files интегрируются одним owner после review. Не заполнять все слоты авторами, оставлять возможность независимого review.

Новый модуль оправдан воспроизведённой нехваткой capability или двумя реальными потребителями общего паттерна. На каждый slice указывается, что переиспользовано, какой минимальный код нужен и какой пользовательский результат это меняет. Большие будущие ветки детализируются только после проявившейся потребности.

### Общая Definition of Done bounded slice

1. Зафиксированы source/owner/границы и исходный контрольный пример.
2. Есть failing behavior/negative control, минимальная правка и соседние проверки; source harness tests отделены от product QA.
3. Независимые semantic и code проверки соразмерны риску; Lead AQA обязателен для business coverage/oracle решения.
4. Consumer действительно использует изменение: registry/selection/invocation/readback прослеживаются. Для skill — fresh invocation; для runtime — исполнение допустимого scope.
5. История и gaps сохранены; документация/source bundle/delivery согласованы; live result не заимствован у другого SHA.
6. Есть checkpoint, способ продолжения/rollback и один следующий полезный шаг. Commit/push/install/Flow writes только в действующих полномочиях.

## 9. Ближайшая очередь после утверждения

- [ ] **Первый bounded slice:** source routing/installer F1–F2, disposable old→new control, fresh Codex/Claude invocation. Не менять product/campaign runtime. Параллельно отдельный reviewer уточняет F3–F5; исправления не смешиваются в непрозрачный commit.
- [ ] **Параллельно:** получить у текущего владельца MagicCard актуальный handoff одной бизнес-функции; подготовить existing authored consumer без нового runner. Не запускать конкурирующую кампанию.
- [ ] **Следующий slice:** discovery/test-design reference и один real positive/negative workflow G1 с existing APIs; один verified graph edge влияет на следующую проверку.
- [ ] **Затем:** переносимый ticket/human-resume цикл G2/G3, подключение existing maintenance/learning G4 по фактической находке.
- [ ] **Сохранить Freeland backlog:** recovery, B11/D7, stale qualification/fixtures, provider и graph gaps сверяются с текущим owner. Этот план не закрывает их и не требует ждать всех для G1.

Старые S0/S1 → G0/G2; S2 → G1/G2/graph maintenance; S3 → G2/G3; S4 → G4/evals; S5 → G1/G5; S6 → G6. Это уточнение очереди, не обнуление выполненных наработок. Старые пункты «создать authored path» заменяются на его реальное использование и квалификацию, поскольку интерфейс уже реализован.

## 10. Независимое review и внешние ориентиры

Обязательные независимые направления: Lead AQA Engineer; AI-first/CTO learning/safety; portable/reuse review. Их замечания проверены root по исходной базе. Результаты независимого review от 2026-09-06:

| Ревью | Что действительно проверено | Итог |
| --- | --- | --- |
| Lead AQA Engineer (`audit_freeland_skills`) | Полный план, actual Console/Kernel, assertions/closure/runner/knowledge, затем исправленные границы G1/G2/G4 | APPROVED; стратегия GO, не подтверждение выполненных этапов |
| Portable/reuse (`next_slice_priority`) | Полный план в своём scope, source/accepted HEAD, registration/writers/adapter/skills и реальные ограничения G0/G1/G2/G5 | APPROVED; новый core не нужен |
| AI-first/CTO (`mc12_semantic_mapping_review`) | Полный план, actual graph dialect/knowledge transitions/observations/reporting/dossiers/runner | APPROVED после устранения graph/context overclaims |

Ревьюеры читали реализации и test sources, а не только пересказ прошлого аудита. Root отдельно перечитал критические schema/runner/knowledge/reporting места. Новые тестовые прогоны, live QA, установки и product mutations в этом планировании не выполнялись. Утверждение плана ревьюерами не подменяет утверждение пользователем и не является release verdict.

Применённые первичные ориентиры: небольшие skills с точным trigger, явными inputs/outputs и scripts только для нужной механики — [OpenAI Build skills](https://learn.chatgpt.com/docs/build-skills). Свобода reasoning зависит от вариативности и риска; инструкции проверяются на реально используемых моделях — [Anthropic Skill authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). Качество агента оценивается по действиям и исходам, не одному тексту ответа — [Anthropic Agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

Эти источники поддерживают принципы, но не доказывают готовность нашего кода. Критерий успеха: меньше необходимого ручного труда, лучше обнаружение дефектов, более полная и актуальная модель продукта и доказанно полезный следующий проход — без создания второго QA-движка.
