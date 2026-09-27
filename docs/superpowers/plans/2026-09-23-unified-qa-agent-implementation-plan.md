# Универсальный qa-agent — единый глобальный план реализации

Обновлён 27 сентября 2026 после поэлементной сверки двух внешних отчётов, Astra architecture review и ограниченной доставки A1. Это **одна текущая очередь**, а не разрешение выполнить все пакеты. P0–P7 — требования, W0–W9 — пакеты с собственными exits, I-ID — преемственность итераций; новые номера стадий приёмки не вводятся.

**Goal:** новый диалог на незнакомом продукте выбирает существенные проверки, подтверждает пользовательский результат, сохраняет весь известный scope и evidence, продолжает остаток без повторов и выдаёт обоснованное решение. «Универсальный» означает переносимый процесс и явные границы возможностей, а не доказанную поддержку любого stack/device/action.

**Architecture:** агент владеет исследованием, test design, нормативными ожиданиями, диагностикой и QA-выводом. Console/Kernel обслуживают общий Starter-путь; Freeland остаётся специализированным product pack с собственными execution/verdict правилами. Общие границы унифицируем раньше движков: execution identity, effect capability, verified evidence generation, outcome/qualification. Это направления проектирования, **не уже реализованный universal adapter API**. Freeland необязателен для выбора продукта, но сейчас входит в manifest-selected source delivery; selective packaging отдельно не реализован. [Архитектура](../../architecture.md).

**Работа:** архитектура, API/schema/verdict/lifecycle, dependency/adapter и неразрешённая семантика — реальный Astra design/review; код и локальные проверки — Sol. Недоступный reviewer останавливает только зависимый срез. Для конкретного code-среза нужен owning-source read и bounded RED/GREEN-план; план программы не подменяет этот дизайн. Не использовать SuperSkill.

**Tech Stack:** выбранные Node.js/TypeScript, Playwright, текущие схемы/файловые API, Git bundle/manifest delivery и source skills. Root Node `>=22.12.0`; lockfile каждого компонента сохраняется. Доступные host tools используются без неявной установки.

**Источники:** [P0–P7](2026-09-16-cross-product-qa-global-plan.md), [97 обязательств D10/D13](../../reviews/2026-09-16-global-plan-reconciliation.md), [преемственность 23 сентября](../../reviews/2026-09-23-global-plan-reconciliation.md), [полная сверка внешних отчётов](../../reviews/2026-09-27-external-review-reconciliation.md). Датированные оценки реализации не являются сегодняшним статусом. Точные source pins — в manifest и [current projection](../../qualification/current.md).

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

Рабочая ветка — `codex/stable-20260926`; опубликованный release tag остаётся неизменным. Эта редакция не меняет child pins и не мигрирует кампании. Root на входе сверки: `cd418b9199dad4cbd9d9d8547d3a3032091cdf1e`; архитектурный отчёт исследовал `a3d638f`, но выбранные Kernel/Console/Freeland pins совпадают. [Release scope](../../releases/2026-09-26.md) отделён от development HEAD.

| Принято в ограниченном объёме | Остающаяся граница |
| --- | --- |
| [W0](../../qualification/w0-baseline-reconciliation-20260927.md) и [W1](../../qualification/w1-outcome-and-remaining-consumer-20260927.md) | Синтетические первые designs **1/4 unaided**, помощь сохранена. Agentify T7: **21 original targets; один current PARTIAL caller-authored/unattested; 20 unobserved; 15 blockers**. Не full P2/P3/P5, W6/W7/I10 или product acceptance. |
| P0 integrity/findings, PAY01 composition/readiness и source delivery | Не все routes, не live payments. Freeland shadow не release GO; новые route defects учитываются отдельно. |
| P1 immutable text/JSON writer/reader, bounded fresh consumer | Zero attachments, caller-authored/unattested; не managed PASS и не generic manual-receipt shortcut. |
| P2-A helper fee/decimal repair, intermediate browser и media-type/JSON assertions | Не повторять accepted repairs; отдельная composite-fee assertion остаётся ошибочной/недостаточной. |
| Ordinary status, bounded API/guest/ticket/remaining consumers | Не full mixed-ticket, реальный human help→reply→resume или arbitrary recovery. |
| [W2a source pair](../../qualification/w2a-registration-snapshot-adoption-20260924.md) | Не runtime migration и не legacy CLI source guard. |
| W2b measured evidence-write, controlled graph consumers | Observation helper не оправдан; graph incremental benefit и отдельный D13-479 authoring exit открыты. |
| Cold source restore/root gate и hosted source/runtime subsets | Не fresh-dialogue whole-product cycle, actual Claude, cloud, весь W7 или agent reliability. |

Принятые результаты не переоткрываются из-за устаревшего чекбокса. Отчёты не доказали готовность универсального QA и не обнулили полезные bounded результаты. Runtime-reproductions из отчёта не повторялись при этой source/doc сверке; Fable score и неподтверждённые агрегаты не становятся baseline.

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

### Принятый A1 и следующий дизайн

**A1 выполнен в ограниченном source-only объёме.** Legacy Console CLI теперь проверяет выбранный Kernel до подготовки и непосредственно перед spawn; wrong/dirty source отказывает на всех шести маршрутах, healthy synthetic `init`/`validate` исполняется на точной паре. [A1 qualification](../../qualification/a1-cli-source-authority-20260927.md) сохраняет RED, локальные controls, независимый review, cold source readback и пределы. Это не live QA PASS и не миграция существующих кампаний.

**Маршрут status→continuation/recovery проверен в ограниченном объёме; активен измеримый source/CI gate (W0/W7, P0/P5/P6).** [W2 route-contract probe](../../qualification/w2-route-contract-probe-20260927.md) сохранил один synthetic host-lost negative control и решение no-new-code/no-skill-adopt; W6/W7 остаются открыты. [A1 CI-selection slice](../../qualification/measured-ci-a1-selection-20260927.md) добавил принятый source-regression в изолированный Console run: на root `0cdc6ef` первые hosted source safety и runtime-smoke прошли, полный Kernel ещё не был завершён при readback. Два предыдущих same-Kernel run имели разные timeout failures при прежних 30s/10s; причина timing не доказана, весь CI не объявлен green. Новый agent-quality field task допускается независимо при собственном oracle, owner, permitted effects и evidence destination. A3/A4 остаются отдельными Freeland-pack residuals. Ничто здесь не разрешает product actions, installs, tracker writes или production.

### Quality-first очередь после внешней сверки

| Приоритет / прежние W/P | Конкретный небольшой результат | Приёмка и польза следующему consumer |
| --- | --- | --- |
| **Done 27 Sep. A1 — W2/W7, P0/P6** | Legacy CLI использует существующий exact-source authority gate до подготовки и непосредственно до spawn на всех шести маршрутах. | [Bounded source qualification](../../qualification/a1-cli-source-authority-20260927.md): RED сохранён, wrong/dirty/drift controls и healthy selected-pair fixture прошли, независимый AQA GO, fresh consumer и cold restore прочитали выбранные bytes. Dependency/build attestation и live QA не заявлены. |
| **Done 27 Sep. Route contract — W2/W6/W7, P0/P3/P6** | [Один существующий status→continuation/recovery путь](../../qualification/w2-route-contract-probe-20260927.md): V0 receipt-only, V1 historical partial; `receipt:null` не verdict/authority, bare `resume` без исходного surviving host запрещён. | Synthetic first-attempt host-lost consumer нашёл безопасный status и отказал в blind resume; независимый Astra AQA GO только для этого negative control, targeted CLI 5/5. No code/skill-doc repair adopted; не W6/W7 acceptance и не generalized replay. |
| **3. Измеримый source/CI gate — W0/W7, P0/P5/P6; partial** | [A1 selection](../../qualification/measured-ci-a1-selection-20260927.md) уже включён в scoped CI с точными first-run знаменателями и artifact policy. Осталось прочитать завершённые full Kernel jobs и решить только измеренную проблему timing/repeatability; другие critical regressions добавлять по доказанному пропуску, не автоматически. | Consumer видит 17 Console files и 167/167 исполненных cases, root 62/62, отдельные overlaps/exclusions и ещё не квалифицированный полный Kernel. No blanket child `npm test`, payments/nightly all или произвольный 80% target. Не публиковать чувствительные артефакты. |
| **4. Качество агента — W4/W6/W7/I10, P3–P6** | Один действительно новый owner-qualified field task: grounded expectations → meaningful execution → полный остаток → fresh reader, затем один применимый regression/lesson consumer. Малый воспроизводимый agent eval использовать для конкретного наблюдаемого провала. Может идти независимо от 2–3, если готов. | First attempt, healthy/broken controls, помощи/ошибки, false claims, пропуски, время/стоимость и independent AQA раздельны. Измеренная полезная проверка, а не больше test count. Реальный help/reply только если действительно произошёл; не инсценировать. |
| **5. Reuse по спросу — W2/W5/W7, P1/P5/P6** | Task-oriented discovery готовых tools, D13-479 authoring и extraction общих утилит лишь при подтверждённой friction. | Не менее двух active consumers с одинаковой семантикой и compatibility controls для shared extraction; измеримый выигрыш. Не skill на каждый script, не все 20 oracle в новый engine. |
| **Отдельно A3 semantic — W3/I07, P2/P5; Freeland oracle pending** | Исправить только пропускающую составную комиссию assertion в `card-sbp.spec.ts`. Сначала установить нормативное значение каждого fee component; не приравнивать без контракта fixed additive к total `sourceFeeAmountMinor`. | Broken «percent + mismatched fixed component» и healthy соседние варианты различаются. Если компонент нельзя проверить по данным, его не объявлять проверенным. P2-A helper не переписывать; новая регрессия используется следующим независимым consumer. |
| **Отдельно A4 — W2/W7, P0/P1/P6; Freeland publisher** | Внутри Freeland pack сблизить publisher с owning strict verdict-generation reader; проверить привязку и содержимое повторно используемого outbox до queue. Не создавать generic publisher/shared API без отдельного multi-consumer доказательства. | Changed generation, modified outbox, mismatched body/binding не ставятся в очередь; healthy/idempotent flow сохраняется. Локальная test queue без реальной отправки. Consumer получает именно проверенное evidence, а не подменённый файл. |
| **Отдельно — W8/W9, P5–P7** | Jev executor/model-routing гипотезы, native/payment/retained-account, cloud | Только собственные scope/design/authority и измеримый demand. Не prerequisite обычного agent-led QA. |

A3/A4 могут идти отдельно после своих designs и source ownership; A3 дополнительно ждёт нормативный product-owned oracle. A4 становится prerequisite только для работы, которая фактически потребляет этот mutable-outbox путь; до ремонта его нельзя считать проверенным. Field admission/read-only анализ не ждёт исправления несвязанного Freeland publisher. Один external blocker останавливает только зависимую ветку, но известная неквалифицированная lane не объявляется принятой.

**Отдельно confidentiality / P2-B:** известные `Set-Cookie` и OpenAPI Basic gaps зарегистрированы, affected sensitive-artifact collection/export не расширяется. P2-B/privacy-only repair остаётся отложенным владельцем. Если выбранному следующему сценарию нужна эта lane, запросить конкретное решение или выбрать допустимую альтернативу. Не скрывать дефект и не подменять quality-first очередь общим security-проектом.

### Карточка исполнения и правило остановки

Для каждого пункта выше перед кодом указать owning component и точные файлы/существующие APIs, минимальный failing control, healthy control, allowed effects, focused команды, expected consumer benefit, reviewer и stop condition. Сохранить first attempt и failed review, а не только лучший результат. API/schema/verdict/lifecycle/adapter/semantic change сначала получает Astra design; Sol реализует утверждённый срез. Внешняя репродукция — input, не собственный RED.

После focused GREEN и независимого AQA — exact bundle/pin delivery **только затронутого компонента и его необходимой пары**, затем один consumer/readback в объявленном scope. Source GREEN не live PASS; сборка/граф не проведённые проверки. Если срез не улучшает корректность/пригодность evidence или измеримую работу consumer, зафиксировать no-new-code/no-adopt и перейти к независимой задаче. Не расширять controller ради завершения самого controller.

### Преемственность I-итераций и остановленных веток

| Итерации | Текущий disposition, не новая очередь |
| --- | --- |
| I00/I01 | Documentary/source-only done; W0/W1 позднее приняты в пределах §1. |
| I02/I03 | VPN proposal **не принят целиком**; owner normative matrix отсутствует, углубление отложено пользователем. Наблюдаемая текущая production-инструкция может быть change baseline, но не универсальный oracle корректности. Автоматически не возобновлять. |
| I04 | Delivery выполняется для каждого нового принятого source-среза; source/installed/runtime раздельно. |
| I05/I09 | W4 graph/regression benefit остаётся открытым; прежние controlled/null results сохраняются, не повторять scored cases для улучшения счёта. |
| I06 / I06a | Capabilities по спросу. I06a.1 documentary accepted; .2 experimental, .3 не реализована, .2–.4 не adopted после held-out NO-GO; .5 отдельно product-owner gated. Подробные cards ниже сохраняют условия, но не разрешают третью arm. |
| I07/I07a | General semantic gaps остаются W3. Paired capture attempt-001 indeterminate; отдельный attempt-002 и один consumer дали локальную collector→consumer пользу по weaker requested-input protocol, не exact delivered-input/no-hidden-history acceptance. [26 September review](../../qualification/i07-correlation-source-review-20260926.md) сохраняет STOP overlap/delay / NO-NEW-CODE; Task4/5 и replay не выбран следующий шаг. |
| I08 | Agentify заменил rw-int для принятого bounded T7. T7 не повторять; real help→reply→resume W6 остаётся открыт, чужой rw-int owner blocker не переносится в Agentify. |
| I10 | Full transfer открыт; [final compound decision](../../qualification/i10-final-compound-20260926.md) остановил synthetic microdiagnostics. C12 и историческая calibration не untouched transfer. Никакой новой prompt/controller arm без нового decision-discriminating gap. |
| I11 / later | W8 optional, W9 separate authority; quality baseline не доказывается скоростью executor. |

### Активная преемственность всех 97 обязательств

[Поэлементная D13(55)/D10(42) матрица](../../reviews/2026-09-16-global-plan-reconciliation.md) остаётся **каталогом требований**, не архивируется как отменённая. Все её строки наследуют W/P-mapping §2 и exits §4; необозначенный как bounded accepted остаток остаётся open/gated, а не исчезает в snapshot. [Сверка 23 сентября](../../reviews/2026-09-23-global-plan-reconciliation.md) сохраняет дополнительные clauses и исходные hashes. Датированные статусы источников не определяют нынешнюю очередь.

| Группа требований D10/D13 | Активный disposition |
| --- | --- |
| Baseline, test design, outcome, first attempts, quality attributes | W0 bounded accepted; W1 bounded accepted; general P2/P5, first-attempt reliability и cross-domain transfer открыты через W3/W5/W6. |
| Full inventory, ticket/mixed batch, help/reply, remaining-only, delivery | Частичные consumers приняты; реальные full/mixed/help и tracker delivery остаются W6. T7 закрывает только свой remaining-only gate. |
| Requirement clauses, dependency, gaps, learning, regression, supersede/rollback/quarantine, Obsidian | W4 открыт; graph links и равный A/B selection не incremental benefit. |
| Fixtures/alias/expiry, capabilities/native/NFR/agent-native, money recovery/refunds | W5 и I06a, отдельно owner-gated effects; не обязательный money/native gate для public web QA. |
| Source/runtime/installed drift, historical readers, actual hosts/cold dialogue | W2/W7 открыты сверх принятых bounded repairs; D13-477 source registration-view superseded by accepted W2a, не его повтор. D13-478 historical plan readback — отдельный остаток. |
| D13-473 locale/semantic minor; D13-479 authoring helper | Первый остаётся grounded regression до reuse в W3; второй допускает bounded design, runtime не adopted. W2b no-new-observation-helper не закрывает authoring. |
| Legacy adopted integrity/journey/status/R0/R1/R2/R4 repairs и прежние graph/mixed controls | Сохраняются в accepted lineage и проверяются при затронутом изменении; не объявляют широкие P/W exits. A1 теперь принят только в своей source-only границе; A3/A4 findings остаются узкими residual defects, не отменяющими всю lineage. |
| P7 experiment, mounts/identity/recovery/delivery, operational GO | W9, отдельная authority; текущая очередь universal quality не cloud. |
| Сквозные ограничения, one owner, original evidence, optional hosts, no giant rewrite | Global Constraints и §6 обязательны для каждого среза. |

## 4. Пакеты реализации

### W0. Зафиксировать рабочий baseline и конечный scope (P0/P5/P6)

W0+W1 разложен на [восемь задач T1–T8](2026-09-23-w0-w1-outcome-completion-tasks.md) с контрактами, файлами, проверками и отдельными fixture/live exits. [Исполненный локальный срез 23 сентября](../../../evals/outcome-completion/runs/w0-w1-first/README.md): controls6/6, четыре actor trials с сохранённой помощью и независимым AQA GO. На момент этого среза live remaining-only T7 не был выполнен; [27 September synthesis](../../qualification/w1-outcome-and-remaining-consumer-20260927.md) отдельно соединяет его позднее принятый Agentify результат с controls и принимает ограниченный выход W1. [Поздняя документальная сверка W0](../../qualification/w0-baseline-reconciliation-20260927.md) закрывает его checklist в ограниченном объёме, не переписывая исторический trial. Это не закрывает P2/P3/P5 или W2–W9.

**Owners/files:** `sources/manifest.v1.json`, `docs/qualification/current.md`, `products/README.md`, `evals/dialogue-quality/README.md`, `cases.md`, `reviewer-rubric.md`. Использовать существующие trial/qualification records; не создавать runtime registry.

- [x] Прочитать manifest и выбранные source skills целиком; выполнить `npm run sources:verify` из root; отдельно установить owner/runtime разрешённого product consumer. [Текущая, не задним числом историческая сверка](../../qualification/w0-baseline-reconciliation-20260927.md).
- [x] В одном новом eval record сохранить исходные source/model/host/tools, объявленный scope, первые ответы и ограничения; прошлые field samples не переименовывать в новый запуск. [Agentify, 26 сентября](../../../evals/dialogue-quality/20260926-agentify-public-first-use/README.md): исходные BLOCKED попытка/восстановление и отдельно разрешённое 3/3 наблюдение сохранены; один локальный reader и независимый AQA GO 0 Critical / 0 Important / 1 Minor (4 критерия соблюдены, 1 частично явный). На checkpoint 26 сентября только этот документальный пункт W0 был закрыт; весь W0, I10, W1/W6 и W7 тогда оставались открытыми. Поздние ограниченные сверки W1 и W0 приведены выше; I10/W6/W7 этим не закрываются.
- [x] До исполнения перечислить контрольные случаи W1, допустимые вмешательства, ожидаемые исходы, длительность/стоимость и условие остановки. Недоступный answer key реально изолировать либо назвать sample open-context. [Исходная prospective card и границы](../../qualification/w0-baseline-reconciliation-20260927.md).
- [x] Зафиксировать capability/fixture readiness и действительные запросы помощи; отсутствие source SHA не заменять frontend asset hash. [Исторический и поздний owner-разделены](../../qualification/w0-baseline-reconciliation-20260927.md).

**Exit:** воспроизводимая первая попытка и известные границы до изменений. Один новый baseline достаточен; существующие capture-only и guidance-only циклы повторно не считаются прогрессом.

### W1. Первый результат: смысл + закрытие реального остатка (P2/P3/P5)

**Existing owned files (do not recreate):** `evals/outcome-completion/README.md`, `cases.md`, `reviewer-rubric.md` — небольшой контролируемый набор, без нового eval engine. Live evidence остаётся у owner; sanitized trial summary — в существующем формате dated eval/qualification.

**Reuse:** `evals/public-input-agent-cycle/20260921-reviewed/`, `evals/mixed-handoff-agent-cycle/`, `evals/dialogue-quality/`; Console `scripts/qa-campaign.ts` и `src/node/qa-campaign-files.ts` для текущего status/readback. Managed `resume` применять только к поддержанной repeat-safe lane; ручной браузерный путь не выдавать за managed replay.

**Input → output:** текущее требование/fixture/версия + сохранённый owner scope → неизменное ожидание, actual outcome и оставшиеся обязательства через существующие records. Никакой новой функции вычисления PASS.

- [x] Зафиксировать три пары: (а) VPN guide соответствует явному fixture cohort / показан guide другого cohort; (б) quantity1 и quantity3 правильно передаются/считаются / UI или quote сохраняет quantity1; (в) AI сообщает сохранение и объект существует после reload / текст есть, объекта нет. Цены и cohort в fixture — синтетические, не новые бизнес-требования Freeland. Принятый bounded control моделирует для (в) лишь Save-note сообщение → persisted object, **не** реальное AI tool execution. [Контрольный record](../../../evals/outcome-completion/runs/w0-w1-first/README.md).
- [x] Независимый AQA проверил источник каждого ожидания и способность assertions отвергнуть broken control; первая отклонённая версия осталась в record. [Контрольный record](../../../evals/outcome-completion/runs/w0-w1-first/README.md).
- [x] Controls исполнены существующими средствами: fixture 2/2, browser 4/4 и четыре actor trials, три seeded contradictions обнаружены после review. Это не live regression и не полная human-perception квалификация. [W1 synthesis](../../qualification/w1-outcome-and-remaining-consumer-20260927.md).
- [x] Новый actor получил current owner reader и разрешённый остаток существующего Agentify workspace, сам выбрал прежний audience target, проверил readiness, исполнил ограниченный публичный маршрут и сохранил independent owning readback; completed privacy/methodology не повторялись. [T7 acceptance](../../qualification/w1-outcome-and-remaining-consumer-20260927.md).
- [x] Итоговый scope сохранил исходные 21 target, 15 blockers, три historical observations и missing local/literal assertions внутри нового `PARTIAL`; 20 targets остались `not_observed`. [W1 synthesis](../../qualification/w1-outcome-and-remaining-consumer-20260927.md).

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

Очередь конкретных ремонтов — §3. VPN/provider-specific clauses ниже сохранены как gated residuals, не ближайшее универсальное задание; не углубляться без нового подтверждённого consumer gap и normative contract.

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

**Текущий I06a checkpoint, 24 сентября:** root index/router candidate `ee04085` остаётся experimental, не принятым skill/API или live route. [Первый matched D1/D2 A/B и независимый AQA](../../../evals/dialogue-quality/20260924-account-capabilities/discovery-aqa-review.md) дали D1 inadequate→adequate, D2 inadequate в обеих руках и semantic gate **NO-GO**. Единственное замороженное [H1/H2 сравнение и независимый AQA](../../../evals/dialogue-quality/20260924-account-capabilities/heldout-h1h2-aqa-review.md) дало H1 adequate/adequate и H2 inadequate/adequate: B явнее назвал all-role scope. Журналы подтвердили первые ответы и модель; видимых content-bearing путей стало 95→46, но заранее заданный efficiency gate не может пройти при inadequate H2-A, а exact task-dispatch equivalence не проверена. Поэтому candidate **не принят**, третьей arm нет. Astra рекомендует сохранить его experimental, без повышения в default routing; отдельное принятие документации требует отдельного scope и review, а не переименования экспериментального gate в PASS. I06a.2–.4 не приняты, I06a.3 не реализована, I06a.5 остаётся gated отдельными product-owner contract и authority. Нет нового child source, installed skill, provider/product action или campaign qualification.

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
| Console child | `QA_STARTER_REPO=/absolute/path/to/selected/kernel node --import tsx --test --test-concurrency=1 tests/unit/qa-agent-observation-pair.test.ts tests/unit/qa-agent-observation-cli.test.ts` | Подставить фактический абсолютный путь проверенного manifest-selected Kernel; это placeholder, не готовая команда. Local fixture/readback требует существующих dependencies; не смешивать пары |
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

**Текущий порядок определяется только §3.** Эти package checklists сохраняют требования и собственные exits, но не содержат отдельного указания запустить product/VPN/old T7.

**Итог pre-cloud:** новая сессия в заявленном scope понимает продукт, делает существенные проверки, сохраняет evidence и остаток, продолжает после реальной помощи/смены контекста, применяет reviewed lesson и выдаёт ограниченный, но законченный QA-вывод. Не обещается отсутствие любых будущих багов, всех провайдеров или поддержка любого устройства.

**Не является завершением:** число коммитов/graph nodes, одна зелёная fixture, source parity, manual workaround, self-recovery вместо human reply, source gate вместо deployed product, другой host только на бумаге.

## 7. История и review

[Дословный pre-review snapshot плана](2026-09-23-unified-qa-agent-implementation-plan.20260927-pre-review.historical.md) сохраняет прежние dated checkpoints и первую очередь; он не источник текущих действий. [Archive index](../../archive/README.md) отделяет history от active docs без удаления provenance. Старые попытки, source pins и qualification records неизменны.

[Внешняя сверка](../../reviews/2026-09-27-external-review-reconciliation.md) связывает каждый report claim с доказательством, ограничением и решением. Изменения 27 сентября — план/структура документации; runtime defects не объявлены исправленными, accepted gates не расширены. Итоговая документальная проверка фиксирует links, snapshot hashes, scope diff и независимый review отдельно от source/live QA.
