# Универсальный qa-agent — единый глобальный план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Это программа самостоятельных пакетов, не разрешение начать все пакеты, product execution или cloud. Для code-среза сначала прочитать его owning source и составить точный bounded RED/GREEN-план; не угадывать будущие API.

**Goal:** новый диалог на незнакомом продукте выбирает существенные проверки, подтверждает пользовательский результат, сохраняет весь известный scope и evidence, продолжает остаток без повторов и выдаёт обоснованное решение; затем тот же процесс переносится на отдельно разрешённый worker.

**Architecture:** сохраняем рассуждение агента, product packs/графы, Console/Kernel и самостоятельный Freeland harness/verdict. Исправляем конкретные ожидания, выбор следующей работы и стыки evidence; используем существующие browser/API/MCP/native возможности. Новые helper/adapter/model route вводятся только после измеренного ограничения.

**Tech Stack:** выбранные Node.js/TypeScript, Playwright, существующие схемы/файловые API, Git bundle/manifest delivery, source skills Codex/Claude и официальные host plugins. Минимум root Node `>=22.12.0`; lockfile каждого компонента сохраняется.

**Spec:** [P0–P7 с принятыми уточнениями](2026-09-16-cross-product-qa-global-plan.md), [матрица преемственности 10/13 сентября](../../reviews/2026-09-16-global-plan-reconciliation.md), [сверка и перенос выводов 23 сентября](../../reviews/2026-09-23-global-plan-reconciliation.md). Последний документ переносит согласованное предложение из cross-product анализа в tracked, переносимую форму; приватные чаты не обязательны для понимания задачи.

**Статус при создании, 23 сентября:** пользователь заказал объединение и оформление плана. Этот документ — единая текущая очередь; P0–P7 остаются стабильными именами требований, W0–W9 ниже — пакеты исполнения. Сама запись плана не меняла код, pins, installed skills или кампании и не запускала разработку после прежнего freeze. Это историческая граница задачи оформления, не текущий запрет уже разрешённого исполнения. Документ не объявляет P0–P6 завершёнными.

**Текущий checkpoint, 24 сентября:** [локальный W0/W1 срез](../../../evals/outcome-completion/runs/w0-w1-first/README.md) прошёл 6/6 controls и независимый AQA review, но live remaining-only T7 остаётся pending. [Свежий owner readback](../../qualification/outcome-visible-content-20260924.md#live-remaining-only-w1-t7) нашёл authenticated browser; 20 targets содержат 8 recorded / 12 `not_observed` и 15 blockers, причём у всех 12 нет разрешённого oracle/binding для принятого assertion. Следующий live W1 gate — owner-reviewed knowledge revision для одного остатка, затем только разрешённое исполнение и persisted readback. Позднее [точное чтение run](../../qualification/w6-rwint-unknown-run-read-20260924.md) установило `cancelled` и отсутствие `media_plan` среди четырёх текущих артефактов проекта; оно не доказало отсутствия внешних эффектов и не разрешило новый AI turn. Это не live PASS и не закрытие W1/P3/P5. Отдельный [локальный ремонт visible-content oracle](../../qualification/outcome-visible-content-20260924.md) прошёл независимый AQA для bounded synthetic controls; он не переписывает четыре исторических actor trials и не доказывает полную human-perception корректность. [W2b evidence series](../../qualification/w2b-evidence-friction-series-20260923.md) не обосновала новый observation helper. Отдельное [решение D13-479](../../qualification/d13-479-authoring-probe-20260924.md) допускает bounded typed-helper design, но откладывает runtime implementation до отдельного одобренного дизайна, controls и замера. [W2a source pair](../../qualification/w2a-registration-snapshot-adoption-20260924.md) уже принят в ограниченном source-only объёме; не переоткрывать его как следующий ремонт. I06a.1 ниже завершена только как документальная сверка после исправлений и независимого AQA GO; I06a.2–.4 задуманы следующим bounded срезом после отдельного согласования точного дизайна, I02 остаётся owner-gated. Новых полномочий на продукт, кампанию, установку или cloud нет.

## Global Constraints

- Manifest выбирает source bytes; существующий product owner — frozen runtime кампании. Новая версия source не мигрирует старую кампанию.
- Один владелец shared source/state. Не менять registrations, старые receipts, исходные ответы, исторические планы или финансовые операции ради зелёного результата.
- Freeland product repository read-only: без push/deploy/migration. Live backend-проверки, оплаты, AI/provider mutations, tracker/Buzz writes и установки не разрешаются этим планом.
- Product-specific правила и права не переносятся между продуктами. Неизвестный эффект сверяется до retry; один неизменный operation ID не означает сам по себе допустимость повтора.
- Verified/failed/partial/blocked/unassessed, evidence lane и версия различаются. Source tests, agent evals и product acceptance имеют разные знаменатели.
- Принятые writer/reader, ordinary status, intermediate assertions, API media-type/JSON assertions и fee-caption repair не разрабатываются заново.
- P2-B confidentiality repair и дальнейшие privacy-only эксперименты отложены владельцем. Существующие ограничения не отключаются; непринятая затронутая lane не становится пригодной.
- M6 generic manual receipt остаётся непригодным shortcut для observations; reporting Kernel10d не активируется.
- Нет второго runner/verdict/storage/fixture manager, общей DSL бизнес-приёмки, обязательного router proxy или параллельной ручной базы статусов.
- Тестовый аккаунт — product/environment-owned capability с отдельными эффектами и disposition; документация маршрутизирует доступное, но не выдаёт создание пользователя, disposable inbox или файл `storageState` за универсальный контракт.
- Условное улучшение без доказанного выигрыша заканчивается решением no-new-code. Недоступная lane не блокирует независимый разрешённый QA.
- P7 cloud и actual payment/device qualification имеют отдельные scope/authority. Отсутствующий Claude не блокирует single-host результат, но dual-host claim остаётся открытым.

## Review Focus

1. Правильный статус/текст при неправильном содержимом либо сохранении — W1/W3 проверяют результат и healthy/broken пары.
2. Смена build/account/fixture, неверный product/environment или истёкший fixture перед продолжением — W1/W2/W6/I06a проверяют применимость, working readback и сохраняют историю.
3. Частичная запись или неизвестный эффект после прерывания — W1/W2 сохраняют A done/B unknown/C pending без слепого replay.
4. Новая находка вне исходного mapping или удалённая связь — W4 сохраняет gap, clauses и conservative fallback.
5. Исправление тестируемого агента контроллером либо неподходящий измеритель — W3/W5/W6 отделяют первую попытку от помощи, измерение от acceptance.

---

## 1. База: что уже есть и что не закрыто

Source на входе: root `7aa1b2498875b498c4370c513065b4fe265d1fd6`, ветка `codex/p2-semantic-source-delivery`; Kernel `aa5d2d1`, Console `8065713`, Freeland `0ea2df1`. Полные SHA и доказательства — в [current entry](../../qualification/current.md) и manifest. `sources:verify` свежо выполнен при оформлении. Эти значения — датированный baseline, не второй registry.

| Уже принято в ограниченном объёме | Остающаяся граница |
| --- | --- |
| P0 integrity/findings, PAY01 composition/readiness, local source-only workflow | Не full-stage, не live payment methods, не hosted CI; PAY01 остаётся shadow |
| P1 immutable text/JSON observation writer/reader и bounded fresh consumer | Caller-authored/unattested, zero attachments; не вся browser/API/MCP completion |
| P2-A комиссия/decimal parsing; intermediate browser и media_type/json_pointer | Не все варианты UI, quote correlation, lifecycle, агентская выдача или provider drift |
| Ordinary campaign status и несколько actual API/guest/ticket consumers | Не повторять ремонты/завершённые подмножества; whole-ticket/help-reply/full scope остаются |
| Controlled graph consumers, docs-render regression | Дополнительный выигрыш выбора в прежних парах — ноль; не весь P4 |
| Bundled source, cold restore/root gate, общий entry | Не cold dialogue product cycle, actual Claude или cloud parity |
| Experimental Android pilot | Локальные mock/loopback controls не квалифицируют реальный lifecycle/NFR |

Результаты и limits сохраняются в существующих qualification/eval records. Чекбокс старого плана не переоткрывает уже adopted repair; новый отчёт не превращает старый bounded result в полный exit.

## 2. Сопоставление со старым планом

| Требование | Текущий остаток | Пакеты |
| --- | --- | --- |
| P0 execution/source integrity | Вход/совместимость, command classes, claimed hosted CI; готовые repairs защищаем | W0, W2, W7 |
| P1 пригодное evidence | Удобная серия, реальное capture time, новый reader и остаток без replay | W1, W2 |
| P2 содержательные проверки | Конечный результат, выбранные параметры, temporal/agent/provider варианты | W1, W3 |
| P3 full/ticket/help/resume | Полный знаменатель, meaningful remaining execution, настоящий ответ человека | W1, W6 |
| P4 graph/learning | Mapped-unexecuted/clauses, dependency consumption, supersede/rollback | W4 |
| P5 качество агента/capabilities | Заранее заданные controls, first attempt/transfer, device/effects отдельно | W0, W1, W3, W5, W6 |
| P6 dialogue-ready delivery | Короткий entry, source/installed/runtime drift, cold dialogue и host proof | W2, W7 |
| P7 cloud | Scoped experiment → actual worker/recovery → operational GO | W9 |
| Новое условное сравнение исполнителя | `browser-use/jev-ultrafast` — кандидат browser executor для равного A/B после quality baseline; TypeSafe Jev — structured-decision model, потенциальный input для отдельного исследования model routing, не этот executor | W8, не prerequisite W1–W7 |

Все97исторических записей сохраняются через прежнюю поэлементную матрицу и [адресную сверку](../../reviews/2026-09-23-global-plan-reconciliation.md). Это не97новых функций и не метрика готовности.

## 3. Порядок и зависимости

Принятый 24 сентября quality-first порядок ниже — **одна очередь в этом плане**, а не новый registry. I-ID обозначает последовательность итераций, **не** новую стадию приёмки: требования P0–P7, пакеты W0–W9, их exits и [97-пунктная матрица](../../reviews/2026-09-16-global-plan-reconciliation.md) сохраняют смысл. I06a — адресный срез существующих W5/W6/W7→P3/P5/P6, не новая стадия и не универсальный prerequisite для QA. После I00–I05 оценить измеримую пользу прежде, чем подтверждать расширение. W0 сопровождает каждый срез; независимые безопасные ветки могут идти при блокере конкретного oracle, но не два владельца одной кампании.

| Порядок | Существующие W/P | Ближайший результат и граница |
| --- | --- | --- |
| I00 — done, source-only 24 сентября | W0/W7; P0/P6 | Checkpoint и одна очередь сверены в `a7c5f78`; root/вложенные sources чисты при readback, `sources:verify` exit 0. W2a принят source-only; не повторять. Не product/installed/live acceptance. |
| I01 — done documentary, 24 сентября | W0/W1/W6; P2/P3/P5 | [Quality baseline](../../../evals/outcome-completion/README.md) и Freeland flow map получили независимый AQA GO; исторические 1/4 сохранены, нового actor/live результата нет. |
| I06a.1 — done documentary, final independent AQA GO; I06a.2–.4 — intended next after design acceptance | W5/W6/W7; P3/P5/P6 | Account-capability факты и очередь сверены, без source/runtime skill change. Далее root skill index/routing, proposed task skill и frozen dialogue controls остаются неисполненными. Реальный persisted resume I06a.5 требует отдельного product-owned contract и authority. Не prerequisite для независимого OC-Q или другой разрешённой проверки. |
| I02 — owner-gated semantic design | W1/W3; P2/P5 | Сначала owner-reviewed cohort/role/lifecycle/rollout → guide/support matrix и Astra review semantic contract; только затем отдельный Sol code slice. [W3 proposal](../../qualification/w3-freeland-vpn-content-design-20260924.md) и точные RU literals пока не приняты как нормативные; live execution не разрешено. |
| I03 | W1/W3; P2/P5 | Bounded healthy/broken VPN regression по принятому contract; local GREEN не live PASS. |
| I04 | W7; P0/P6 | Проверить exact-byte delivery и свежего consumer; source, installed skill и campaign runtime различать. |
| I05 | W4; P4 | Проверить, изменяет ли reviewed graph relation следующий выбор/исполнение, сохранив gaps и честный нулевой прирост. |
| I06 | W5/W6; P3/P5/P6 | Закрывать capability/access gaps по спросу; native/NFR и effect lanes остаются самостоятельными residuals, не prerequisite web/API. |
| I07 | W1/W3; P2/P5 | Перенести grounded assertions на quantity/quote, persistence/async и отдельно подтверждённый provider contract. |
| I07a — local partial | W1/W3; P2/P5 | OC-Q DOM-only/response-only controls сохраняют first-design и assisted границы; next wrong-request quantity/correlation control следует после I06a.2–.4 при отдельном разрешении дизайна. Это не закрывает I07 или live-product outcome. |
| I08 | W1/W6; P3/P5 | Выполнить один разрешённый remaining-only flow и help/resume; live T7 ждёт owner-reviewed oracle/binding, unknown effects — readback до retry. |
| I09 | W3/W4; P2/P4 | Доставить подтверждённый bug как regression и проверить change-impact/retest без переписи истории. |
| I10 | W0/W5–W7; P0/P3/P5/P6 | Независимо измерить first-design качество, переносимость и dialogue-ready scope; W5/W7 exits не закрываются автоматически. |
| I11 | W8; P5/P6 | Лишь после quality baseline — опциональный Jev browser-executor A/B с independent assertions и полной стоимостью; adopt/no-adopt. |
| Позже | W9; P7 | Cloud только по отдельному scope и operational GO, не следующий автоматический commit. |

W2b evidence-write замер не требует нового observation helper сейчас; D13-479 graph/catalog/coverage authoring остаётся отдельным design/runtime решением. P2-B confidentiality owner-deferred и unaccepted; M6 generic manual receipt, Worker-guard и отдельные effect lanes не исчезли и не ослаблены, но не блокируют независимый первый quality-срез. Исторические W/P результаты и exits ниже не переписываются этим порядком.

I06a выбран из наблюдаемого cross-product access gap, не из доказанной общей причины сессий: внешний audit не установил внутреннюю причину Realweb workspace failure; повторение той же ошибки на реальном owner-provided Gmail после signup/login делает один только reserved-domain alias недостаточным объяснением. Freeland Mail.tm lease имеет собственные provider POST/DELETE и строгий DELETE 204; успешный control предусматривает удаление inbox, **не** Freeland user, и остаётся `SHADOW_PASS`/non-promotion из-за account-retirement/cardinality readback gaps. Старый `fresh-accounts` — частный helper без retained fixture contract. `qa:pool status` логинится в staging и пишет private readback, поэтому не классифицируется как pure read-only. Эти разные эффекты нельзя скрывать за единым «создать тестовый аккаунт»; root [capabilities map](../../qualification/capabilities.md) остаётся evidence matrix, не registry исполнимых провайдеров.

Параллелить только непересекающиеся изменения. Kernel/Console pin delivery интегрируется одним владельцем после проверки пары. Нельзя двум исполнителям одновременно вести одну продуктовую кампанию или менять общий pack.

## 4. Пакеты реализации

### W0. Зафиксировать рабочий baseline и конечный scope (P0/P5/P6)

W0+W1 разложен на [восемь задач T1–T8](2026-09-23-w0-w1-outcome-completion-tasks.md) с контрактами, файлами, проверками и отдельными fixture/live exits. [Исполненный локальный срез 23 сентября](../../../evals/outcome-completion/runs/w0-w1-first/README.md): controls6/6, четыре actor trials с сохранённой помощью и независимым AQA GO. Live remaining-only T7 не выполнен; весь W1 не закрыт. Это не реализация W2–W9.

**Owners/files:** `sources/manifest.v1.json`, `docs/qualification/current.md`, `products/README.md`, `evals/dialogue-quality/README.md`, `cases.md`, `reviewer-rubric.md`. Использовать существующие trial/qualification records; не создавать runtime registry.

- [ ] Прочитать manifest и выбранные source skills целиком; выполнить `npm run sources:verify` из root; отдельно установить owner/runtime разрешённого product consumer.
- [ ] В одном новом eval record сохранить исходные source/model/host/tools, объявленный scope, первые ответы и ограничения; прошлые field samples не переименовывать в новый запуск.
- [ ] До исполнения перечислить контрольные случаи W1, допустимые вмешательства, ожидаемые исходы, длительность/стоимость и условие остановки. Недоступный answer key реально изолировать либо назвать sample open-context.
- [ ] Зафиксировать capability/fixture readiness и действительные запросы помощи; отсутствие source SHA не заменять frontend asset hash.

**Exit:** воспроизводимая первая попытка и известные границы до изменений. Один новый baseline достаточен; существующие capture-only и guidance-only циклы повторно не считаются прогрессом.

### W1. Первый результат: смысл + закрытие реального остатка (P2/P3/P5)

**Files to create:** `evals/outcome-completion/README.md`, `cases.md`, `reviewer-rubric.md` — небольшой контролируемый набор, без нового eval engine. Live evidence остаётся у owner; sanitized trial summary — в существующем формате dated eval/qualification.

**Reuse:** `evals/public-input-agent-cycle/20260921-reviewed/`, `evals/mixed-handoff-agent-cycle/`, `evals/dialogue-quality/`; Console `scripts/qa-campaign.ts` и `src/node/qa-campaign-files.ts` для текущего status/readback. Managed `resume` применять только к поддержанной repeat-safe lane; ручной браузерный путь не выдавать за managed replay.

**Input → output:** текущее требование/fixture/версия + сохранённый owner scope → неизменное ожидание, actual outcome и оставшиеся обязательства через существующие records. Никакой новой функции вычисления PASS.

- [ ] Зафиксировать три пары: (а) VPN guide соответствует явному fixture cohort / показан guide другого cohort; (б) quantity1 и quantity3 правильно передаются/считаются / UI или quote сохраняет quantity1; (в) AI сообщает сохранение и объект существует после reload / текст есть, объекта нет. Цены и cohort в fixture — синтетические, не новые бизнес-требования Freeland.
- [ ] Независимый AQA проверяет источник каждого ожидания и способность assertions отвергнуть broken control; первая отклонённая версия остаётся в record.
- [ ] Исполнить controls существующими средствами. Если oracle отсутствует, выделить только owning repair W3; не принимать ручное обнаружение как уже доставленную regression.
- [ ] Подготовить новому actor доступ к current reader и разрешённому остатку одной существующей кампании. Он выбирает ещё не подтверждённый доступный пункт, проверяет readiness, выполняет его и сохраняет readback; выполненные пункты не повторяет без причины.
- [ ] В итоговом scope сохранить исходные/добавленные требования и missing assertions внутри PARTIAL. Если реальные lanes недоступны, зафиксировать конкретный blocker; fixture proof не закрывает live exit.

**Exit:** три пары различаются без подгонки ожидаемого ответа; новая первая попытка сохранена; разрешённый remaining consumer фактически выполнен и принят отдельно. Product FAIL допустим, unsupported PASS — нет. Достижение этого результата не требует очередного полного прохода Freeland.

### W2a. Устранить ложное представление плана (P6)

**Owning files:** Kernel `src/kernel/workspace-blueprint.ts`, `tests/workspace/blueprint.test.ts`; Console `src/node/qa-campaign-files.ts` (`readCampaignPlan`) и `src/lib/qa-campaign-v0.ts` (`QaCampaignPlanV0Schema`) остаются authority, не переносятся в Kernel. Точные pin/docs/fixture updates — по текущему source pair и [reviewed inactive candidate](../../qualification/registration-planning-snapshot-20260915.md).

- [x] На текущей паре воспроизвести absent → authored → CAS-revised: Console видит/валидирует план; registration view не должна утверждать его отсутствие.
- [x] Перенести только маркировку registration snapshot и указатель на существующие reader/schema, согласованно в оба места генерации. Не выводить live plan contents через новый synchronizer.
- [x] Проверить focused blueprint и vertical fixture; отсутствие плана остаётся корректным отдельным состоянием.
- [x] Проверить старые workspace на совместимость без их перезаписи; несовместимость означает frozen historical runtime, не автоматическую миграцию.
- [x] После review доставить новую точную пару и qualification; прежние V0 plan bytes сохранять отдельно до CAS revision и читать назад неизменно.

**24 September source checkpoint:** [W2a bounded adoption](../../qualification/w2a-registration-snapshot-adoption-20260924.md)
retains the exact new pair, source-only gates and old-workspace read-only
incompatibility. Independent root delivery review returned conditional GO;
the exact pair and qualification are committed. A later uninterrupted full
Kernel `npm run verify` passed 45/45 files and 1788/1788 tests with build;
the earlier timeout and exit 130 remain historical, not reclassified by
focused passes. Live W1/T7 remains
pending through its separate owner.

**Exit:** view больше не вводит в заблуждение, authoritative readback и история сохранены. Старые `a9378b2/d272f31` не выбираются вместо текущих successors целиком.

### W2b. Уменьшить стоимость evidence и ошибок вызова (P1/P6)

**Owning seams:** Console `scripts/qa-campaign.ts`, `skills/qa-product-v0/references/agent-observations.md`, `tests/unit/qa-agent-observation-pair.test.ts`, `tests/unit/qa-agent-observation-cli.test.ts`; Kernel `src/contracts/agent-tool-observation.ts`, `src/kernel/agent-tool-observation.ts`, `src/kernel/target-observation-report.ts`.

- [ ] Измерить отдельно подготовку, authority validation, append и readback на одинаковой небольшой browser/API/MCP серии без продуктовых эффектов.
- [ ] Использовать существующий writer return/readback; убрать только доказанную дублирующую caller-работу. Если достаточно исправить пример вызова, не менять Kernel и не добавлять exporter.
- [ ] Если ручные schema/binding ошибки повторяются, подготовить bounded constructor/validator поверх нынешних APIs с точной диагностикой поля. Новый helper допускается только после выбора source owner и отдельного RED/GREEN-плана.
- [ ] Сохранять `author.authoredAt` отдельно от фактического `captureTime`; interval описывать без выдуманной точности. Неизвестное историческое время не заполнять текущим.
- [ ] Проверить partial append → новый reader → только недостающий append, duplicate/conflicting ID, wrong binding и dropped blocker. Discovery без binding сохраняется proposal/gap.
- [ ] Повторить замер и описать выигрыш/ограничение. Текст/JSON остаются unattested; attachment support не появляется от ссылки на screenshot.
- [x] Отдельно сохранить условное решение D13-479 о graph/catalog/coverage authoring: если callers повторно импортируют test fixtures и вручную синхронизируют граф/каталог, оценить минимальную обёртку existing APIs. Для этой задачи нужны собственные API/browser/manual authoring examples и dropped-blocker/wrong-binding controls; manual example не использует generic manual receipt API. No-new-code допустим. Это не observation append-helper: его приёмка не закрывает authoring-обязательство, и наоборот. [Решение и границы локального probe](../../qualification/d13-479-authoring-probe-20260924.md): только bounded helper design, без нового runtime-кода и без product acceptance.

**Exit:** три класса наблюдений читаются свежим consumer, история/знаменатель не теряются, выполненное не дублируется. Новая обёртка необязательна; no-new-code с измерениями — принятый исход. Отдельное graph/catalog/coverage authoring decision имеет собственный record и controls; evidence-write результат не подменяет его.

**Контрольная точка 23 сентября:** [синтетическая browser/API/MCP серия](../../qualification/w2b-evidence-friction-series-20260923.md) записана существующим Kernel writer и прочитана новым процессом 3/3; один `not_observed` target и blockers сохранены, idempotent/conflict/wrong-binding/artifact-only recovery проверены. Новый observation helper пока не нужен. Это закрывает ограниченный evidence-write срез, но не отдельный D13-479 authoring decision, точную декомпозицию внутреннего authority cost, live product acceptance или весь W2b автоматически.

### W3. Расширить содержательные регрессии там, где есть доказанный пропуск (P2/P5)

**Ownership:** Freeland `tests/freeland/desktop-content-contracts.ts`, `purchase.spec.ts` и существующий `card-sbp.spec.ts` как reference request/quote pattern; Console — нынешние adapter/reader assertions только при реальном недостатке; agent-native controls — существующие root evals/product pack, не Freeland money rules.

- [ ] Для каждой принятой пары W1 найти owning assertion, сохранить counterexample, внести минимальный fix и добавить healthy соседний вариант; релевантный consumer проверяет доставленные bytes.
- [ ] Коррелировать выбранные plan/quantity/rail/action с request, актуальной quote и UI; фоновые409, stale200 и общий shell не удовлетворяют проверку. Quote/session calls классифицировать продуктовым pack, не общим правилом «любой POST — деньги».
- [ ] Добавить только требуемые lifecycle controls: delayed healthy против no-op; reload/return; ошибка quote→восстановление; выдача без F5; локализованный empty state и search-clear suffix. Intermediate assertions не реализовывать повторно.
- [ ] Проверить нужный modal variant, hit target/focus/overlap и disabled/loading/error states, а не только screenshot или отсутствие overflow.
- [ ] Для agent-native: естественный intent, полный MCP content/attachments, terminal job, MIME/bytes/содержимое, сохранение и доставка отдельно. Контроллер не делает товар за actor; workaround не закрывает исходный FAIL.
- [ ] Для «год + три дня» запросить подтверждённый контракт и обезличенный stuck-case. Локально/разработчиком проверить обычный срок, разрешённый бонус, неверный/короткий срок, repeat/delay и recovery существующей операции. Нет контракта — unresolved expectation, не универсальный допуск +3 и не фиктивная проверка production.

**Exit:** независимый reviewer принимает test design и фактическое различение контрпримеров; новый consumer использует принятое улучшение. Отсутствующая broken deployment остаётся пределом доказательства, не invented live RED→GREEN.

### W4. Граф, регрессии и знания влияют на следующий проход (P4)

**Reuse:** `evals/graph-consumer-agent-cycle/`, `evals/docs-render-agent-cycle/`, Kernel revisions/preview/apply и Freeland graph/impact/coverage. Product-owned updates не выполняются ручной правкой managed graph.

- [ ] На A/B changed, A tested сделать B явно untested; отдельно проверить requirement clauses и change coverage. BOUND, UNCOMPUTED и computed-zero не смешивать с FIXED.
- [ ] Для одного подтверждённого пропуска определить причину: selection, fixture, oracle, version, lost evidence или verdict; предложить минимальную regression/dependency.
- [ ] Проверить коллизию ID разных сценариев (включая исторический TC-VPN-05), dropped clause/edge и unmapped change; сохранить gaps и product-owned fallback.
- [ ] Опубликовать reviewed revision через existing API и дать новому actor другой вариант. Зафиксировать фактический выбор, исполнение и результат.
- [ ] Проверить supersede/rollback без переписи старого outcome, quarantine owner/срок пересмотра и производный Obsidian view.
- [ ] Сравнить detection/стоимость с control. Одинаковый выбор — честный нулевой прирост; полезное самостоятельное исследование не запрещается ради красивого A/B.

**Exit:** хотя бы один принятый lesson используется в новом фактическом исполнении; known broken найден, healthy не объявлен багом, denominator не уменьшился. Весь historical Freeland graph debt не prerequisite другого продукта.

### W5. Квалифицировать недостающие capabilities по спросу (P5/P6)

**Native files:** `tools/android-pilot/README.md`, `driver.mjs`, `runner.mjs`, `run.mjs`, существующие tests и `wallet-visit.json`. Это экспериментальный opt-in путь, не новая разработка Appium runner с нуля.

- [ ] До расходования device quota проверить один короткий разрешённый сценарий: пригодные screenshot/XML, устройство/build/SSO, useful-screen readiness; запуск Activity не заменяет готовность карты.
- [ ] Раздельно квалифицировать session create/timeout/unknown outcome/delete/host interruption и фактический functional result. Mock13controls не заменяют device execution.
- [ ] Для NFR до запуска указать источник порога и метод измерения. Idle/provider FPS не выдавать за compositor FPS; без порога сохранить измерение, не PASS.
- [ ] Для fixtures проверить ID/owner/role/state/expiry и readback: draft≠approved, похожий alias≠нужный mailbox, stored-active≠неистёкший ресурс.
- [ ] Для отдельно разрешённой mutation/payment lane сохранить action/budget/one owner, pending/decline/unknown, same-ID recovery и private refund disposition. Существующее достаточное evidence не требует новой покупки.
- [ ] Применимые accessibility/reliability/security проверки выполнять в доступном scope; неподдержанные GPS/TalkBack/audio/provider/device ветки явно pending. При повторяемой capability gap сравнивать один кандидат с текущим tool.

**Exit:** конкретный заявленный класс получил пригодное средство и healthy/broken result либо точный внешний blocker. Новых полномочий, всех устройств или обязательной financial qualification для read-only QA нет.

#### I06a. Test-account discovery и bounded resume (W5/W6/W7→P3/P5/P6)

Это один срез существующей очереди, не отдельный account manager. Source discovery (`.1–.4`) и live persisted resume (`.5`) имеют **разные exits**. Product test account не равен `qa-init` регистрации QA workspace. Skills задаются для повторяемой пользовательской операции, не для каждого Mail.tm/pool helper. Один root [skills index](../../../skills/README.md) остаётся integration entry; `docs/qualification/capabilities.md` — evidence matrix, а не исполнимый catalog. Integration index не является D13-479 graph/catalog authoring helper или runtime fixture registry и не переоткрывает их решения. Child source может изменяться только после owner review и exact bundle/pin delivery; installed skills, manifest, product state и исторические receipts не меняются документальной правкой.

| Card / owner, prerequisite | Измеримый consumer result и focused healthy/broken control |
| --- | --- |
| **I06a.1 — root plan owner; done documentary after corrected independent AQA GO.** Предпосылка: verified selected source и read-only account/mail audit. Первый draft получил NO-GO (0 Critical/1 Important/2 Minor); финальная проверка исправленного текста — GO (0/0/0), не first-pass GO. | Одна очередь и effect inventory без нового runtime/skill: Freeland lease, private fresh-accounts helper, six-role pool и Realweb evidence атрибутированы своим продуктам. Healthy: account path назван с точным product/environment и эффектом; broken: `qa:pool status` назван pure read-only или inbox DELETE ошибочно назван удалением product user — reviewer отклоняет. |
| **I06a.2 — root entry owner; modify only `skills/README.md` и `skills/qa-check/SKILL.md` после согласования дизайна.** Предпосылка: .1 reviewed; current root routing/selected specialist прочитаны полностью. | Для account-dependent user task index/router показывает `task → source → product/environment → exact callable interface → effects → result/readiness → persistence → disposition`, либо `unsupported`/конкретный help gap. Healthy: Freeland staging role routes to existing specialist and working product read; broken: wrong product/environment, expired/unconfigured role или ошибочно read-only `qa:pool status` не объявляются готовым аккаунтом. Первый unaided fresh-dialogue ответ сохраняется до подсказки; AQA проверяет routing/claims до принятия. Не добавлять child→root brittle links и не считать identity-only readiness. |
| **I06a.3 — root skill owner; propose `skills/qa-test-account/SKILL.md`, не создавать её этим документальным срезом.** Предпосылка: .2 accepted; обнаружен поддержанный existing/disposable route **или** явно зафиксирован unsupported route. Retained lifecycle contract нужен лишь .5. | Навык повторяемой операции сначала ищет разрешённый существующий account/fixture, затем различает retained и disposable, проверяет уже данную authority для creation/destruction и спрашивает лишь недостающую. Намеченный путь при поддержке и разрешении: mailbox → product signup → mail verification, если требуется → работающий product access → private resume reference/disposition; неподдержанный шаг остаётся gap, не выдуманным API, командой, credential bridge или store. Healthy: существующий пригодный fixture используется без mint либо допустимый disposable route назван с эффектами; broken: disposable inbox подменяет retained session либо unknown create outcome запускает повтор — отказ/reconciliation. Первый actor response и помощь разделены; independent AQA оценивает точность и доступную альтернативу. |
| **I06a.4 — eval owner; extend existing `evals/dialogue-quality/`, not a new engine.** Предпосылка: .2/.3 proposed bytes frozen и независимая rubric утверждена **до** actor; retained contract для этого source-control не требуется. | Frozen fresh-dialogue controls начинаются с обычного user request **без** названия skill/tool/path: healthy existing fixture, missing provider, wrong product/environment, expired fixture, unknown outcome, disposable↔retained mismatch. Для каждого сохранить first unaided attempt, permitted help/correction отдельно, supported/blocked remainder и full time/tool/model cost (`unknown` ≠ zero). Healthy/broken pair отвергает ложное создание, login-only readiness и повтор неизвестной операции. AQA проверяет rubric и затем результаты; маленький набор не даёт общей reliability claim. Source-selected actor не доказывает installed-host discovery. |
| **I06a.5 — конкретный product owner, не root docs; live persisted resume separately authorized.** Предпосылка: поддержанный product-owned contract с stable ID, owner, role/state, expiry, resource ownership, effect/readback и retention/disposition; product/environment и отдельно разрешённое действие подтверждены. | Fresh consumer читает тот же retained fixture, проверяет **работающий product read**, продолжает только pending case и сохраняет/read back result без replay completed/unknown. Healthy: действительный retained account и pending flow; broken: истёкший/wrong-env fixture или неизвестный create/delete outcome остаётся blocked до reconciliation. First attempt, помощь и AQA/owner acceptance раздельны; нет контракта — блокируется только .5, независимый OC-Q/W1 QA продолжается. |

**Shared gate:** заранее записать точный effect class (source-only, login/product read, provider create/delete, product signup, session/file write, unknown), cost/time и disposition; source index/skill/eval result не авторизует product action. Для `.2–.4` нужны отдельный design acceptance, focused healthy/broken validation и независимый reviewer; `.1` закрывается только после независимого review, `.5` — только после своего live persisted readback. Никакой Freeland provider adapter или Console storage semantics не переносятся в generic harness по умолчанию.

### W6. Реальные full/ticket/help и независимый transfer (P3/P5)

**Reuse:** существующие owners MagicPay, rw-int, Nuanu App; `evals/dialogue-quality/`, `evals/mixed-handoff-agent-cycle/` и текущие observation/status tools. Четвёртый продукт не нужен ради формального «новый».

- [ ] Выбрать реальный полный объявленный scope и отдельно реальный mixed-ticket остаток, не только уже завершённый single-ticket subset. Проверить исходный путь, существенные AC и связанные риски.
- [ ] Сохранять original/additional scope, группы/атомы/observations отдельно; у каждого FAIL/PARTIAL/BLOCKED/UNASSESSED указать основание и следующий ответственный шаг.
- [ ] На реальной зависимости запросить только недостающий input; выполнить независимую ветку. После настоящего ответа проверить readiness/account/build и продолжить зависимую. Самостоятельно найденный обход не считается human-reply exit.
- [ ] Controlled «готово, но fixture прежняя» не запускает action; реальный ответ и synthetic control получают отдельные records.
- [ ] Новый actor выполняет оставшийся объём; A done не повторяет, B unknown сверяет до retry, C pending не теряет. Fresh context, остановка процесса и host restart записываются разными событиями.
- [ ] Выполнить заранее зафиксированный held-out вариант, эталон реально недоступен actor или sample честно open-context. Сохранить first attempts, подсказки, коррекции, flakes/skips и стоимость.
- [ ] Отдельно квалифицировать разрешённую tracker delivery: dedupe, template/state, exact target, persisted readback. Без права писать — report-only и delivery unqualified.

**Exit:** полный scope объясним, выбранный live mixed batch и реальный help→resume подтверждены своими evidence, а не реконструкцией отчёта. В малом declared control set нет unsupported PASS, ложного healthy bug и пропущенного critical seeded case. Product FAIL/BLOCKED не мешает честно завершить QA disposition с release NOT_ACCEPTED.

I06a.5 — один возможный product-owned help/retained-fixture resume для этого exit, но не его замена: неуспех или отсутствие account contract оставляет только зависимый case pending, не отменяя остальные W6 проверки.

### W7. Принять dialogue-ready поставку в объявленном объёме (P0/P6)

**Files:** `sources/manifest.v1.json`, `sources/candidates/`, `tools/workspace.mjs`, `tests/`, `.github/workflows/qa-source.yml`, `skills/README.md`, `docs/getting-started.md`, `docs/qualification/current.md`. Менять только затронутые delivery/entry bytes, не все компоненты автоматически.

- [ ] Для каждого code-среза сохранить exact reviewed source, complete bundle, соответствующий manifest и scoped gates; пройти cold restoration/readback. Старые результаты не переатрибутировать.
- [x] Сверить полный source/installed skill bundle, включая references; [read-only W7 inventory](../../qualification/w7-installed-skill-drift-20260924.md) нашёл 30/42 exact, 9 drift и 3 missing. Adoption/installation остаётся отдельно, без массового копирования legacy skills.
- [ ] В одном `skills/README.md` index учесть знаменатель **публичных, повторяемых user-facing** capability families harness, включая полезные read/status: каждую поддержанную entry связать с существующим task skill/recipe и точными owner/source/interface/effects/result + source/installed scope либо явно отметить missing; internal helpers, experimental и unqualified lanes отделить без автоматического повышения. Начать с account/mail наблюдаемого gap, остальное расширять по измеренному спросу. Покрытие документацией само по себе не доказывает fresh-dialogue discoverability или functional qualification; не плодить skill на каждый script.
- [ ] Проверить отсутствующую capability, expired access, смену build и повреждённую соседнюю session; здоровый target не требует переноса чужих state/secrets.
- [ ] Различить pure/source, local browser/fixture и product command classes. Локальный workflow body не hosted CI; actual hosted execution квалифицировать после отдельной публикации/доступа.
- [ ] До расширения затронутой lane закрыть её resource/Worker guards (oversized/chunked response, Worker/SharedWorker с/без dependencies). P2-B остаётся deferred; если выбранному scope нужна непринятая privacy lane, исключить её явно или запросить решение, не ослаблять guard.
- [ ] Cold clone + новый диалог выполняют discovery→проверки→help/resume→результат→learning без авторских доноров. Проверка root61 или наличие файлов не заменяют actual execution.
- [ ] Actual Codex/Claude результаты записать раздельно; недоступный host — unqualified. AQA принимает тесты/доказательства, operations reviewer — выполнение и заявленные recovery boundaries.

**Exit:** repository + явные prerequisites достаточны для объявленного host/product/action scope; нет известных fail-open в принятых активных путях. QA-вывод, owner risk decision и readiness целевой среды — три разных решения.

I06a.2–.4 проверяют часть dialogue-ready discovery без installed-skill adoption; их успешный source/eval gate не закрывает cold host/consumer W7 exit. Для claim, что **новый task skill обнаруживается через installed skills** текущего Codex/Claude, нужны I04/W7 exact reviewed source, отдельно разрешённая selective installation с installed-byte verification и свежий реальный host entry. Отдельный честно атрибутированный source-selected host result возможен без такого installed-skill claim; новые root skill files сами по себе не становятся используемыми installed skills.

### W8. Условный Jev browser-executor A/B после quality baseline (P5/P6)

**Status:** optional, не prerequisite полезного QA или W7. Jev-ultrafast — кандидат browser executor, не model router, AQA planner или verdict engine. Использовать существующие eval/trial records; возможная внешняя интеграция требует отдельного bounded design и разрешения после quality baseline. Handoff Никиты — input для сравнения, не инструкция конфигурации.

- [ ] После I10 проверить текущую документацию Jev, доступ, цену, обработку данных и разрешение на изолированную установку/API; не переносить реальные профили или токены внешнему кандидату.
- [ ] На одинаковых локальных/разрешённых browser-задачах удержать planner, requirements, independent assertions, scope и budget; менять только executor. Существующий deterministic Playwright — baseline там, где он уже работает.
- [ ] Сравнить полный setup→navigation/actions→postcondition, retries, false claims, model/browser расходы и стоимость полезного QA-результата. `done` Jev и screenshot не являются PASS.
- [ ] При доказанной пользе согласовать с Astra только узкий adapter к existing executor boundary с fallback и stop criteria; иначе no-adopt. Никакого второго runtime или default installation.
- [ ] Общий model routing/rules/Laya остаётся отдельной гипотезой, не Jev shadow route и не частью приёмки I11. Не навязывать xhigh или запрет Astra без собственных данных; API billing и лимиты Codex считать отдельно.

**Exit:** обоснованное adopt/no-adopt решение по качеству и полному времени/стоимости в объявленном browser scope. Executor не заменяет test design, независимый postcondition и release verdict.

### W9. Отдельно разрешённый cloud experiment → operational GO (P7)

- [ ] До setup получить experiment scope: один product/host/actions, budget, доступы, stop criteria; default read-only web/API.
- [ ] Использовать принятый runtime/skills; проверить фактическую ОС/mounts, containment/locks, resource/network bounds, cancellation, credential lifecycle и durable checkpoints.
- [ ] Исполнить controlled restart, позднюю помощь и failed/unknown delivery; reconciliation до retry. macOS fixture не доказывает поведение Linux mounts.
- [ ] Проверить собственную identity и persisted tracker/communication delivery при отдельной authority; сравнить существенные outcomes с dialogue mode.
- [ ] Получить отдельный operational GO до schedules/always-on/уведомлений или расширения scope.

**Exit:** worker действительно выполняет ограниченную полезную проверку и восстанавливает её без потери/повторения неизвестного эффекта. Поднятый сервер не равен завершению P7.

## 5. Команды и границы проверок

Команды ниже существуют сейчас; это каталог для scoped implementation plan, не приказ запустить всё при чтении. Пути child-relative, если явно указан child. Для новых pins сначала проверить actual embedded authority. Нельзя скрыто установить зависимости/браузеры или fallback в product.

| Место | Команда | Что доказывает / ограничения |
| --- | --- | --- |
| root | `npm run sources:verify` | Точные выбранные bytes, не QA продукта |
| root | `npm test` | Только root packaging; после source restore |
| root | `node --test tools/android-pilot/*.test.mjs` | Локальные pilot controls, не external session |
| Kernel child | `npm test -- tests/workspace/blueprint.test.ts` | Focused workspace fixture, не live product |
| Kernel child | `npm run typecheck` | Типы выбранного source |
| Console child | `QA_STARTER_REPO=/Users/danilsolomin/projectsnew/qa-agent/components/kernel node --import tsx --test --test-concurrency=1 tests/unit/qa-agent-observation-pair.test.ts tests/unit/qa-agent-observation-cli.test.ts` | На этой машине текущая explicit pair; local fixture/readback, требует dependencies. В isolated реализации передать путь её exact Kernel, не смешивать пары |
| Freeland child | `node --test tests/freeland-main/desktop-content-contracts.test.mjs` | Локальный browser fixture; нужен уже доступный Chromium. Не pure test и не live VPN acceptance |

Console/Freeland default `npm test`, Android `--execute`, product runners, provider calls и installs не являются offline gate. Qualification wrappers/readback выбираются из актуального owning pack, не придумывается общий `qa full` API.

## 6. Цикл каждого пакета и критерии общего результата

- [ ] Прочитать актуальные source/owner/expectation и составить bounded дизайн с точными файлами, командами и effects.
- [ ] Сохранить failing control или первую actor attempt до правок; для code — TDD, для диагностики не создавать фиктивный code RED.
- [ ] Внести минимальное owning изменение, выполнить релевантные controls и здоровый соседний случай.
- [ ] Получить независимое review; reviewer может отклонить один пакет без остановки принятого соседнего. Ограничить fix-loop конкретными findings, не переписывать всё ради нового ревью.
- [ ] Для source change: exact-byte delivery и cold check; для behavior change: новый consumer/вариант, не только повтор обучающей пары.
- [ ] Отдельным логическим коммитом сохранить разрешённые source/документы после verification; live/private records и секреты не включать. Push/PR/skills install/product adoption требуют своего scope.
- [ ] Обновить существующий current checkpoint и точный remaining gate. Не закрывать P целиком по количеству W или тестов.

**Следующий bounded source-slice:** принять точный дизайн I06a.2–.4, затем выполнить только root index/routing, proposed task skill и frozen dialogue controls с отдельным independent AQA; I06a.1 завершена лишь документально, .2–.5 не реализованы. Следующий OC-Q wrong-request control идёт после этого среза, I02 ждёт owner semantic contract. Отсутствие product-owned retained interface блокирует лишь I06a.5; независимый OC-Q и разрешённые checks продолжаются. **Отдельный live W1 gate:** разрешить oracle/binding одного оставшегося assertion через reviewed owner knowledge revision, затем завершить T7 с persisted readback либо сохранить точный blocker; принятый локальный W0/W1 срез не повторять и весь W1 не закрывать без T7. W2a уже принят в bounded source-only объёме и не является следующим ремонтом. W2b observation helper пока не требуется по замеру; D13-479 оставляет только bounded design, не выбранный runtime-код. Переход на W3 определяется реально отсутствующим oracle, не намерением построить библиотеку заранее.

**Итог pre-cloud:** новая сессия в заявленном scope понимает продукт, делает существенные проверки, сохраняет evidence и остаток, продолжает после реальной помощи/смены контекста, применяет reviewed lesson и выдаёт ограниченный, но законченный QA-вывод. Не обещается отсутствие любых будущих багов, всех провайдеров или поддержка любого устройства.

**Не является завершением:** число коммитов/graph nodes, одна зелёная fixture, source parity, manual workaround, self-recovery вместо human reply, source gate вместо deployed product, другой host только на бумаге.

## 7. История и review

Исходный план16сентября и97-пунктная матрица сохранены byte-for-byte; новая очередь отменяет только их устаревший порядок «что делать следующим», не требования и evidence limits. Реальные принятия source сохраняют свою датировку. Подробная сверка, hashes, deferred obligations и результаты независимого review — в [reconciliation](../../reviews/2026-09-23-global-plan-reconciliation.md).
