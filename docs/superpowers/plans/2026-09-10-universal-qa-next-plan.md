> Current continuation (2026-09-11): use this repository's [current source/qualification](../../qualification/current.md) and [reconciliation](../../qualification/reconciliation-20260911.md). The dated source paths and completion statements below are preserved history, not the current root selection. The seven substantive product/decision/ticket/graph/learning/host/cloud exits remain open to their stated scope; source adoption does not close them.

# Universal Agent-first QA — Consolidated Continuation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Получать качественный самостоятельный QA по запросу в диалоге — полный известный scope или тикеты — с переносом между продуктами и последующим ограниченным облачным пилотом.

**Architecture:** Агент отвечает за понимание продукта, тест-дизайн, исследование, диагноз и предложения по улучшению. Существующие product packs, графы, Console/Kernel и Freeland campaign/verdict tools отвечают за свои текущие операции и ограничения; браузерные средства подключаются как специализированные исполнители, а не как новый QA-движок. Проверки инструментария, качество решений агента и результаты тестирования продукта оцениваются раздельно.

**Tech Stack:** Existing Node.js/TypeScript, Console/Kernel, Freeland Playwright/API harness, source skills for Codex/Claude, official host Nuanu Flow plugin; optional browser adapter only after a measured capability gap.

**Spec:** Существующая дорожная карта плюс [архитектурный анализ](../../../.local/fora-qa-review-20260910.wtod0y/REPORT.md) и [проверка browser/payment сравнения](../../../.local/fora-qa-review-20260910.wtod0y/BROWSER-COMPARISON-ADDENDUM.md). Это новый предложенный порядок работ, не автоматическое изменение accepted root или ранее принятых квалификаций.

## Global Constraints

- Freeland product repository остаётся read-only: никаких push/deploy/migration.
- Приоритет владельца: сначала полезная универсальная работа в диалоге, потом облако. Не ждать закрытия всех Freeland-specific gaps для независимой проверки другого продукта.
- Переиспользовать существующих владельцев графа, исполнения, evidence и verdict. Не создавать второй runner/verdict/реестр памяти для обхода ограничений.
- Новые браузерные зависимости, реальные побочные эффекты, tracker writes и cloud setup не разрешаются автоматически этим документом.
- Сессии, требования, финансовая авторизация и данные одного продукта не переносятся на другой.
- Неподдержанное, неизвестное, неисполненное и заблокированное не считаются PASS. При этом отказ от всей работы не считается качественным обнаружением доступных дефектов.
- Человек блокирует только зависимые проверки; агент продолжает независимую разрешённую работу. Существенный вопрос допускает вариант «разберись сам», но не выдумывание полномочий или требований.
- Source skills общие для Codex и Claude; actual execution на двух hosts проверяется отдельно от равенства файлов.
- Не менять источники/graph inputs во время кампании. После изменения — новая атрибуция и релевантная переквалификация.
- Новый источник/правило/поле добавляется только при наблюдаемой потере смысла, качества или capability, а не ради строгости самой по себе.

---

## 0. Где мы действительно находимся

Latest reviewed source: root `64ed4b472f292c64736ff1f73476a46cdaa7f54e`, Console `f3660d0eed9c442aec974f1b57dcaa6b7a8bcc3b`, Kernel `15a067c9a694de26460102ce5dadb9707c7977b1`, Freeland `9c2509e32462319d5b96ccb49d5ae2070df7b18d`.

Source continuation root:

`/Users/danilsolomin/projectsnew/qa-agent/.local/source-assembly-20260910.hT28L8/committed-cold`

Этот exact commit уже прошёл cold restore/verify, 52/52 root packaging tests и независимое source-delivery review. Основание: [внешний completion checkpoint](../../../.local/source-assembly-20260910.hT28L8/ASSEMBLY-CHECKPOINT.md) и финальная секция [Lead AQA review](../../../.local/source-assembly-20260910.hT28L8/LEAD-AQA-REVIEW.md). Трековая qualification page содержит более ранний checkpoint и сама по себе не отменяет этот результат. Main в текущем анализе повторно выполнил только `npm run sources:verify`: exit 0.

**Не повторять packaging как следующую большую задачу.** Accepted-root promotion, установленные skill bytes, actual host execution и product acceptance — отдельные ещё не закрытые утверждения. Для продолжения исходников использовать latest candidate, не откатываться на старый pack. Доступ к продукту всё равно определяется его текущим владельцем и полномочиями.

Уже есть и сохраняется: разделение reasoning/tools; product analysis и уточнения; authored checks/campaigns; граф и каталог; receipt-bound attributed review; scoped interruption/continuation; контролируемое graph/regression learning; Freeland release/ticket инструменты. Эти механизмы не означают ни полный QA любого продукта, ни подтверждённую облачную автономность.

## 1. Слои и ownership

| Слой | Что переиспользуем | За что отвечает |
| --- | --- | --- |
| Диалог и reasoning | Текущий агент, source skills | Понимание целей, выбор подхода, исследование, диагноз, запрос помощи |
| Product knowledge | Отдельный pack/граф/каталог каждого продукта | Требования, дизайн, роли, journeys, зависимости, известные риски и gaps |
| Пайплайны и skills | qa-product-v0, qa-init когда нужен, freeland-release-qa и host skills | Последовательности full/ticket/exploration/triage/learning, правила применения tools |
| Детерминированное исполнение | Existing Console/Kernel и Freeland harness | Валидация scope/identity, разрешённые действия, результаты и их readback |
| Специализированные инструменты | Playwright/API, текущий browser control; дополнительные capabilities по необходимости | Наблюдения и действия, но не самостоятельная подмена бизнес-ожиданий |
| Evidence, память и оценки качества | Existing receipts/reviews/graph revisions/regressions | Сохранение фактов, проверяемое улучшение; различение качества агента и продукта |
| Host | Сейчас диалог; позже ограниченный облачный worker | Среда запуска, доступы, изоляция, бюджет, остановка и восстановление |

Не типизировать каждое рассуждение. Жёстко сохранять то, потеря чего может дать неправильный результат или действие: target/version, authority, существенное ожидание, status, связь с evidence и известный неизвестный исход.

## 2. Последовательность проверяемых срезов

### Срез 1 — Новый полезный QA-проход на latest source

**Reuse/read:** current `AGENTS.md`, `products/README.md`, `skills/README.md`, выбранный полный source skill и его required references; текущий product-owner checkpoint. Product-analysis reference уже существует в `components/console/skills/qa-product-v0/references/product-analysis.md`.

**Input:** разрешённый продукт, его текущая версия/наблюдаемая identity, реальные продуктовые материалы, доступные роли/инструменты и ограничения.

**Output:** исполненные значимые бизнес-проверки плюс полный учёт известного scope; не только план или копия старого fixture.

- [ ] Выбрать новый содержательный путь из реальных gaps. Для Agentify сначала сверить существующий owner/checkpoint; прежние U2/U3/U4 и отдельные визуальные наблюдения не выдавать за новый полный проход. Если доступен только публичный scope, прямо ограничить вывод им.
- [ ] До исполнения восстановить обещание продукта: кому и зачем он нужен, роли, главные и вспомогательные journeys, состояния/ошибки, UI/design expectations и внешние зависимости. Отделить требования, гипотезы, рекомендации и неизвестное.
- [ ] Применить подходящий тест-дизайн: классы/границы входов, таблицы решений, переходы состояний, инварианты, API↔UI и негативные ветки. Не навязывать каждый метод каждому продукту.
- [ ] Сразу оценить применимость security/access, accessibility, performance, compatibility и reliability. Исполнить доступную полезную проверку в разрешённых границах; invasive/load/vendor-internal scope не подразумевается.
- [ ] Через существующие tools выполнить выбранные проверки, объяснить фактические результаты, отдельно диагностировать тест/среду/продукт и сохранить gaps.

**Приёмка:** новый агент действительно выбирает и исполняет полезные проверки, не получает готовое решение из fixture и не превращает успешный инструментальный вызов в бизнес-PASS. Существенные части известного scope не исчезают из отчёта.

### Срез 2 — Проверить качество решений QA-агента

**Reuse:** `evals/README.md`, существующие fixtures, oracle/graph/verdict regressions; сохранять trials/reviews в текущих форматах, без нового eval server.

**Input:** существенные требования выбранного сценария, independent healthy/buggy variants, заранее описанные ambiguous/blocked controls.

**Output:** отдельный отчёт о дефектах обнаружения, ложных баг-репортах, необоснованных PASS и полезной завершённой работе.

- [ ] До наблюдения ответов агента независимый reviewer фиксирует ожидаемые существенные исходы и размещение дефектов. Агент видит требования, но не answer key: ответы хранятся вне доступного исполняющему агенту контекста/набора инструментов, а не только прикрываются инструкцией «не читать».
- [ ] Прогнать исправный вариант, существенный дефект, неполное ожидание/неоднозначность и реальный capability blocker. Учесть все попытки, а не только лучшую.
- [ ] Проверить слабые assertions, успешный ответ при неверном конечном состоянии и обход поломанного пути. Обход может быть находкой или recovery, но не свидетельством исправления исходного пути.
- [ ] Если ошибся агент — уточнить существующий skill/пример; если tool — написать focused RED, минимальный fix, GREEN и независимый review. Не ослаблять существенные ожидания для прохождения теста.
- [ ] Повторить неизменные negative controls и сделать перенос на другой домен/свежий контекст без раскрытия эталона.

**Приёмка:** все доступные critical seeded нарушения заданного небольшого набора обнаружены; healthy controls не названы подтверждёнными багами; blocked controls корректно ограничены. Пропущенный доступный дефект нельзя компенсировать общим NEEDS_REVIEW. Результат относится к этому набору, не к универсальной точности.

Срезы 1–2 идут рядом: реальные продукты показывают пользу, контролируемые примеры — способны ли мы отличать правильное от неправильного. Ни один не заменяет другой.

### Срез 3 — Два рабочих режима: полный scope и тикеты

**Reuse:** существующие product inventories/plans/campaign APIs; official Nuanu Flow plugin; Freeland's own full/ticket routes. Не вводить несуществующий universal full/ticket CLI.

- [ ] В полном режиме пройти инвентаризацию всех известных областей, выбрать глубину по риску и отразить status каждой области. «Полный» не означает перебор каждой комбинации или отсутствие неизвестных требований.
- [ ] В ticket-режиме live прочитать QA-колонку/заданный scope через плагин, восстановить исходное воспроизведение и ожидаемый результат, выбрать зависимые проверки по продуктовой карте.
- [ ] Проверить смешанный набор: реальный fixed, still broken, ambiguous/no coverage и blocked. Если нет доступа к такому live-набору, synthetic workflow отдельно квалифицирует механизм, но не закрывает live exit.
- [ ] Исправленность подтверждать исходным путём плюс существенными зависимыми исходами. При отсутствии baseline воспроизведения не заявлять доказанный RED→GREEN; фиксировать фактическую силу проверки.
- [ ] Тикетные изменения делать только при имеющейся authority и текущем state/template contract, с dedupe и readback. Не создавать сетевой слой поверх плагина лишь ради чтения колонки.

**Приёмка:** агент по обычному запросу выполняет оба workflow без придуманных команд; нет ложного FIXED из-за зелёного общего suite, пропущенного теста или отсутствующего mapping. Вопрос человека останавливает только зависимую ветку.

### Срез 4 — Граф действительно управляет тестированием и не теряет смысл

**Reuse:** current product-owned graph/catalog, existing revision preview/apply/validate and Freeland build/impact/plan. `docs/qualification/graph-reuse-pilot.md` сохраняет фактические пределы прежней правки.

- [ ] Для критичных journeys проследить существенные условия через requirement → scenario/check → ожидание → результат/gap; notes могут быть достаточны, новая schema не обязательна.
- [ ] Сравнить selection на исходной карте и после подтверждённой новой зависимости: дополнительный связанный риск действительно должен попасть в проверки.
- [ ] Проверить отсутствие mapping: scope не должен тихо сузиться, неизвестное не становится зелёным. Сохранять предусмотренный pack fallback.
- [ ] В реальном full/ticket проходе выявить потерянные роли, состояния, подусловия и источники; исправлять через существующего владельца, не hand-edit managed state.
- [ ] Только при повторяющейся невыразимой потере добавить совместимое расширение. После source change пересобрать/проверить и обновить Obsidian как представление, сохраняя историю.

**Приёмка:** граф улучшает выбор и обнаружение, а не просто количество узлов/рёбер. Известный долг Freeland сохраняется отдельной очередью; не является барьером для другого продукта. Приоритет его закрытия — деньги/access/replay и реально изменённые области, не косметическая связность.

### Срез 5 — Закрывать capability gaps и agent-native scope

- [ ] Для каждого blocker сначала проверить текущие средства и минимальный адаптер. Отсутствие capability не оправдывает выдуманный PASS, но отсутствие необходимости в новом tool не блокирует дальнейший план.
- [ ] При recurring browser-control/export gap выбрать один пилот: agent-browser direct mode или Browser Use CLI; vision — Midscene; отдельные semantic primitives — Stagehand при оправданной стоимости интеграции. Это исследовательские кандидаты, не уже принятые зависимости.
- [ ] Сравнить с текущим методом на полезном случае и healthy/buggy controls: обнаружение ошибок, ложный PASS, first attempts/retries, время/стоимость, raw evidence, cancel и wrong-scope behavior.
- [ ] Принять средство только при измеримом выигрыше без потери значимых проверок/прав. Модельное «успех» не заменяет конечный outcome.
- [ ] Для продукта, работающего как agent/MCP/tool, проверить интенты, входные/выходные контракты, последовательность tool calls, ошибки/таймауты, права, prompt injection и конечный бизнес-результат. Исторический MagicPay owner-stopped checkpoint не разрешает продолжение сам по себе. На2026-09-11 пользователь ведёт новые MagicPay проверки в отдельных задачах: их scope/authority определяются текущим владельцем, а не наследуются этой задачей или из старого checkpoint. Controlled target не закрывает live acceptance; наличие активного нового диалога не означает общий PASS.
- [ ] Не исполнять работу проверяемого продуктового агента вместо него. Для разрешённого checkout различать заказ, платёж, pending/decline/unknown; recovery начинает с reconciliation, а не повторной траты. Merchant/Link-поддержка проверяется как реальная интеграция, не предполагается по наличию Stripe.

**Приёмка:** закрыт конкретный полезный класс проверок; независимое подтверждение результата и границы воздействия сохранены. Cloud с web/API-only scope не обязан ждать полной оплаты или поддержки всех типов агентов; неподдержанные классы остаются явными.

### Срез 6 — Обучение на реальных находках

- [ ] Взять подтверждённый продуктовый дефект, действительно новую зависимость либо наблюдаемый пробел покрытия/оракула, сохранить диагноз и причину пропуска существующим QA. Не требовать обязательного нового бага в живом продукте: это создаёт стимул выдумывать находки; controlled defect сохраняет соответствующую атрибуцию.
- [ ] Добавить reviewed regression/knowledge revision через существующий owner; один неизменный тест должен различать broken/fixed, где такие версии доступны. Иначе отметить предел подтверждения.
- [ ] В свежем контексте прочитать новое знание и показать изменение следующего полезного плана/проверки.
- [ ] Разделять память продукта, обслуживание тестов и общие методы. Изменение общего skill проверять на контрпримерах и втором домене; не переносить продуктовую норму как универсальную.
- [ ] Сохранять scope/version, основания актуальности, superseded knowledge и возможность отката. Не лечить flaky или failed удалением проверки/обязательства; карантин имеет owner, причину, срок пересмотра и видимый риск.

**Приёмка:** новая находка улучшает последующий результат, а не только увеличивает число Markdown-файлов. Самообучение здесь означает управляемое улучшение знаний/тестов/инструкций, не обучение весов модели и не бесконтрольное редактирование собственной приёмки.

### Срез 7 — Работа из свежего диалога и ограниченный cloud pilot

- [ ] Проверить latest workflow в новых Codex и Claude контекстах, когда host доступен. Не выдавать source mirror или один хост за исполнение на двух.
- [ ] Пройти interruption, истечение доступа, смену candidate, unknown outcome и помощь человека: независимые ветки идут дальше, после ответа scope перечитывается, неизвестный эффект не повторяется вслепую.
- [ ] Для разумного разрешённого набора прогонов сохранить долю обнаруженных seeded defects, false findings/PASS, unexplained skips, flake/retries, время до полезного результата и реальные human blocking actions. Production escapes собирать по фактам и экспозиции; пока наблюдений нет, это unknown, не ноль.
- [ ] Lead AQA и architecture/operations reviewer принимают ограниченный host/product/action scope облачного эксперимента. К этому моменту должны быть полезный реальный dialogue run, перенос на другой домен/контекст и работающий bounded recovery; не обязательны нулевые gaps каждого продукта или интеграция всех browser tools.
- [ ] Затем на одном ограниченном cloud worker квалифицировать фактические network/credential/process isolation, budget/cancel, текущий plugin access и восстановление. По умолчанию начать с разрешённого read-only scope; платёжные/мутационные lanes включать отдельно.
- [ ] Сравнить полезные результаты локального и cloud workflow с теми же существенными ожиданиями. Только после этого расширять cloud scope.

**Приёмка:** сначала GO на ограниченный эксперимент; затем отдельный GO на проверенный режим его эксплуатации. Не требовать доказанную cloud recovery до разрешения самого контролируемого испытания и не выдавать запуск worker за такую recovery. «Любой предложенный продукт» означает корректное исследование/адаптацию с явными границами, а не гарантированную готовую автоматизацию всех поверхностей.

## 3. Организация работы

Main ведёт полезный product/discovery/ticket путь и интеграцию. Независимый Lead AQA ведёт oracle/negative controls и review; архитектурный reviewer подключается при изменении интерфейсов/capabilities. Read-only анализ и независимые fixtures параллелятся; shared source/graph/runtime имеют одного владельца. Claude не является обязательным свободным исполнителем: при его недоступности работа продолжается, actual Claude-host qualification остаётся открытой.

Параллельная ограниченная AQA-линия — curated mutation/property controls наиболее дорогих fail-open ошибок в существующих authority/verdict/identity boundaries. Потеря критического assertion, wrong target, stale evidence и unknown effect должны обнаруживаться; surviving/invalid mutations остаются видимыми. Это проверка наших tools, не продуктовая регрессия и не повод удерживать весь полезный QA до построения общего mutation framework.

Каждая реализационная правка получает небольшой отдельный план по фактическому месту дефекта: воспроизводимый RED → минимальный fix → релевантный GREEN → независимый review → refresh source identity. Этот документ задаёт порядок независимо принимаемых срезов; он не разрешает заранее переписать перечисленные подсистемы и не заменяет code-level план ещё не обнаруженного дефекта.

## 4. Чего сейчас не строим

- Новый runner/verdict engine, собственный трекерный SDK или MCP-server только ради упаковки существующих вызовов.
- Одновременную интеграцию browser-use, agent-browser, Stagehand и Midscene.
- Vector DB и автономное самоизменение skills без наблюдаемой проблемы поиска/качества и независимых controls.
- Бесконечное повторение source integrity checks вместо проверки нового продуктового риска.
- Универсальную финансовую подсистему как обязательную предпосылку read-only QA.

Крупная правка допустима, когда повторяющийся важный gap показывает, что небольшой адаптер/существующая модель не сохраняют нужный смысл или результат. Размер изменения сам по себе не причина ни принять, ни отвергнуть его.

## 5. Следующий конкретный результат

На latest source выполнить **новый содержательный разрешённый QA-срез** с восстановлением продуктовых ожиданий и NFR applicability, параллельно подготовить независимые healthy/buggy controls. Вернуть не очередной инфраструктурный сертификат, а: что проверено, что найдено, где агент ошибся, какие gaps действительно мешают, какую одну правку сделать следующей. Далее — full/ticket и реальные graph-selection/learning проверки в рамках того же цикла.

Этот план сохраняет незавершённые обязательства G0–G6 и Freeland debt; меняет приоритет в пользу полезного универсального QA, а не объявляет их закрытыми.

## 6. Обратная связь из живого Freeland-пилота — 11 сентября 2026

Приоритет владельца в текущем диалоге: продолжать полезный продуктовый QA и одновременно улучшать qa-agent по реальным затруднениям; прекратить накопление новых и старых средств в NuanuFlowQA. Это расширяет прежний report-only scope обслуживания харнеса в сторону подготовки и проверяемой реализации улучшений. Перенос действующих регистраций/секретов, удаление архива, массовая установка skills и promotion сборки этим автоматически не выполняются.

Факт пилота: [FREEL426-RESUMED-20260911.md](../../../.local/freeland-release-20260910.YLMtOu/FREEL426-RESUMED-20260911.md). На Freeland9c2509e/candidated3ec8b59 выполнены новый unpaidCard handoff, same-ID close/reopen/reload и scoped2-case RED→GREEN. Pipeline qualification остаётся BLOCKED; успешное ручное составление probe не считается улучшением общего инструмента.

Аудит версии до адресной синхронизации: установленный Freeland SKILL.md в Codex/.agents, source9c2509e и используемая runtime-copy совпадают SHA256. У qa-product-v0 основной SKILL.md и product-analysis.md совпадают с Consolef3660d0, но две references (agent-observations.md и declarative-campaign.md) отстают во всех трёх установках. Installed qa-init1652548 отстаёт от sourcebb7dcef, но в Freeland-пилоте не использовался. Основной qa-agent checkout48bccef и последняя проверенная source assembly64ed4b4 — разные состояния; не обозначать их одной «текущей версией» и не делать promotion без квалификации. Совпадения главного SKILL.md недостаточно для утверждения об актуальности полного bundle.

Следующий небольшой срез: **единый выбор текущего product owner, source/runtime и полного skill bundle при продолжении задачи** через существующие manifest/routing/registration средства. Наблюдаемый дефект — многоступенчатое ручное восстановление путей, несовпадение installed/source некоторых skills и чтение Freeland credentials из NuanuFlowQA. Сначала адресно принять уже reviewed qa-init + qa-product-v0 bytes с backup/readback и уточнить существующий locator; новый resolver ради этого не писать. Исходный failing check — точное расхождение установленных файлов, не выдуманный продуктовый баг. Затем проверить fresh-context continuation на существующем продукте. Только если существующий entrypoint по-прежнему воспроизводимо теряет owner/pins, добавить минимальную диагностику в owning component через RED→GREEN. Критерий: свежий контекст находит owner/source/runtime, сохраняет неизвестную live identity и legacy credential dependency, не повторяет незавершённый invoice и не переписывает active campaign. Никакого нового registry/runner или копирования secrets для прохождения теста.

Затем отдельными срезами: (1) reusable original-checkout continuation вместо новых task-local scripts, используя existing policy/ledger; (2) QA-H003 baseline relationship и generation-bound acceptance на доказанной topology без ослабления гейта; (3) поэтапное устранение текущих runtime-зависимостей от NuanuFlowQA, с отдельным разрешением на перенос credentials/registrations. Generic qa-check drift уже зарегистрирован QA-H001 — не создавать дубликат. Не копировать весь архив, не удалять исторические материалы и не поднимать новый runner.

Работа разделена: основная QA FREELAND ведёт installed entry/locator, общий план и независимую проверку качества решений; задача `01a08f9f-0aa7-7792-8f7b-50604c704970` владеет текущим Freeland QA и сохраняет product evidence в прежнем owner path. Она передала существующие checkout seams и отрицательные regression cases; это ещё не реализация общего continuation. Общие срезы 1–7, второй продукт и agent-quality controls остаются в плане: исправления Freeland не превращаются в обязательное ожидание перед любой универсальной QA-работой.

Текущий ограниченный delivery checkpoint: [entry-adoption-20260911.jz56mJ](../../../.local/entry-adoption-20260911.jz56mJ/CHECKPOINT.md). Принятие инструкций, результат fresh-context sample, qualification runtime и проверка продукта учитываются раздельно.

Ограниченный entry-delivery срез завершён: отдельные [delivery review](../../../.local/entry-adoption-20260911.jz56mJ/DELIVERY-REVIEW.md) и [consumer review](../../../.local/entry-adoption-20260911.jz56mJ/CONSUMER-REVIEW.md) получили Lead AQA APPROVED в своих границах. Global1–7 не закрыты. Далее универсальная линия берёт QA-H001 и controls, Freeland-линия — reusable checkout/fixtures и QA-H003; границы ownership сохраняются.

Установленные инструкции синхронизированы 2026-09-11 после отдельного Lead AQA review: тот же byte-check дал9расхождений/exit1 до принятия и0/exit0 после;15из15файлов совпадают, изменены только9. Source packaging2/2; source/runtime/registrations не менялись. Два fresh Codex-context samples завершены: Freeland выбрал current owner, не предложил повтор invoice и сохранил formal blocker; Agentify через existing read-review различил historical U3 и current U4 (1pass/20unassessed/NEEDS_HUMAN). Raw answers и границы находятся в delivery checkpoint; итоговый independent consumer review — отдельно. Это не blind eval, actual Claude execution или завершение глобального среза7. Сохранилась minor locator friction: два локальных ENOENT из-за неоднозначного слова «taskroot», после bounded поиска документы найдены. Предпочесть уточнение существующих ссылок, не новый resolver.

Ещё один reusable gap из FREEL-398, уже записанный owner как QA-H020: поиск QA fixture только по loginEmail пропустил исходного пользователя, у которого ticket mailbox совпадает со stable mailboxAddress. Включить в последующий fixture/account selection review: точный user ID, роль и допустимые alias подтверждать отдельно; не выбирать первый похожий адрес, не считать stored-active ресурс действующим при прошедшем expiry. Current PR415 может менять expectation старого398 — сначала разрешить acceptance conflict (owner H002 follow-up). Источник: существующий Freeland owner и `freel398-original-fixture-mailbox-20260911-observation.json`; никакой новой регистрации/ресурса этим пунктом не разрешено. Текущий product итог9-ticket union хранится отдельно в `QA-PLUS-BUZZ-20260911.md`; эта задача не переисполняла тот QA.

### Ближайшая проверка качества решений — переиспользуемые controls

Lead AQA проверил actual Console source и выделил6контролей для среза2: healthy/wrong-priority фильтр Nuanu, healthy/protected-marker-leak public-auth, unresolved empty-cart expectation и human-help с независимой продолжающейся проверкой. Используем существующие `tests/unit/nuanu-authored-revision.test.ts`, `tests/fixtures/public-auth-readonly/fixture.ts`, `tests/fixtures/kernel-i1-authority.ts`, `tests/unit/human-help-continuation.test.ts`, а не новый eval engine.

Сначала это проверка разбора evidence с открытыми ограничениями, не blind test и не независимый test-design score: серверы вариантов частично встроены в unit tests, готового нейтрального agent-eval CLI нет. Для настоящего blind execution нужен исключающий answer key доступ инструментов; запрет читать файл в prompt не создаёт такую границу. `record-review` хранит только интерпретацию существующего attempted-check evidence; no-run ambiguity/help остаётся в checkpoint, без фиктивного receipt.

Приёмка: оба доступных seeded нарушения названы конкретно и обоснованы; healthy варианты не получают confirmed bug; неопределённое ожидание не выдумано; доступная независимая работа продолжается; все попытки, пропуски и реальные capability gaps сохранены. Это контролируемая проверка решений агента, отдельно от зелёных unit tests харнеса и live acceptance продукта.

Для каждого среза показывать две вещи раздельно: результат проверки продукта и принятое улучшение qa-agent (изменённый source, regression evidence, review, актуальный pin). Запись нового Markdown или probe сама по себе не закрывает второй результат. Исторические artifacts остаются по provenance; новые reusable fixes идут в owning source component, новые product artifacts — в существующий owner path qa-agent.

### Уточнение после повторной сверки — 11 сентября

Сводка Freeland про отставший qa-init относится к состоянию до entry-delivery: новая проверка подтверждает15/15совпадений qa-init + полного qa-product-v0 между reviewed Console source и тремя host-каталогами. Оставшиеся проблемы консолидации не закрыты: accepted root48bccef отличается от reviewed source, установленный qa-check пока устаревший, credentials/history ещё зависят от NuanuFlowQA.

QA-H001 исправлен **на уровне исходников** отдельным commit `c3f9ca2dc5c156b5eaada337dee22f75e9db4c0c` поверх64ed4b4: короткий root-owned qa-check + две существующие точки входа, без нового runner и без изменения component pins. Lead AQA одобрил source diff и затем bounded source delivery; cold restore/verify и52/52root tests прошли. Пять повторов пяти supplied decision cases дали корректные ответы, но baseline тоже был корректен — не заявлять измеренный прирост решений. [Checkpoint и границы](../../../.local/qa-h001-review-20260911.gx5j0h/CHECKPOINT.md). Host adoption/promotion учитываются отдельно, QA-H001 целиком ещё не закрыт.

Ближайший порядок: закончить ограниченную delivery-проверку → согласованно принять актуальную точку входа и консолидировать выбранную сборку без нарушения active owners → controls качества решений на существующих fixtures → reusable checkout/fixture lookup и QA-H003 по их owner. Продолжать независимую универсальную линию; не превращать Freeland-specific blockers в блокировку исследования других продуктов. В NuanuFlowQA не добавлять новые reusable fixes; одноразовый диагностический probe превращается в улучшение только после изменения owning source, регрессии, review и принятой доставки.

Первая открытая проверка шести evidence-controls выполнена параллельно: main + независимый Lead AQA приняли6/6интерпретаций. [Результат, источники и review](../../../.local/decision-controls-20260911.gleYU8/CHECKPOINT.md). Использованы существующие исторические HTTP/HTML/PNG; Nuanu wrong-priority и empty-cart честно обозначены source-derived, не новыми runtime-результатами. Healthy случаи не получили ложных багов; marker/filter нарушения распознаны; нехватка redirect/session evidence, неизвестное wording и неподтверждённая помощь человека не стали PASS. Это завершает только начальную interpretation-проверку, не весь срез2 и не слепую/широкую квалификацию агента. Старые verdict/dossier labels не использовались; продуктовые графы и тикеты не менялись. Raw API body в части архивов не сохранён — для независимого последующего разбора нужно отдельно выбрать достаточные безопасные наблюдения, а не включать безусловное логирование тел/секретов.

