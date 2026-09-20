# Универсальный qa-agent: план после Freeland, Nuanu App и MagicPay

> **For agentic workers:** это текущая очередь глобальной работы, а не разрешение на product execution, установку, миграцию кампаний или облако. Использовать доступный на хосте workflow исполнения с независимым ревью; при отсутствии специальных skills следовать §6 вручную. Конкретный code-level план составлять по owning компоненту. Старые результаты не переписывать.

**Status — актуализация entry 21 сентября 2026:** это действующий план P0–P7, не новый набор полномочий. Source выбирает [manifest](../../../sources/manifest.v1.json), следующую задачу и ограничения — [current checkpoint](../../qualification/current.md). Приняты Kernel `aa5d2d1`, Console `c421160`, Freeland `0ea2df1`; reporting `10d398d` неактивен. P0-ремонты и P1 writer/reader/reference входят в выбранные successors; ограниченное реальное продолжение свежим агентом принято, но это не закрывает весь P1 или общий end-to-end scope. P0–P7 в целом не завершены. Source selection не мигрирует campaigns/skills и не даёт product/cloud authority. Остальные датированные implementation/adoption-описания ниже сохраняют состояние своих ревью, а не переопределяют текущую очередь: не повторять завершённые P0/P1 действия по старым словам «начать» или «pending». Все obligations и acceptance gates сохраняются. [Исходные bytes до entry-правки](2026-09-16-cross-product-qa-global-plan.3accb18.snapshot.md) сохранены отдельно.

**Текущий порядок 21 сентября:** P2-A принят; P2-B сохранён как непринятый кандидат с двумя RED-регрессиями приватности. Он не заменяет selected source и не задерживает независимый P3/P5. Базовая оценка решений и [реальный контролируемый проход с продолжением](../../../evals/public-input-agent-cycle/20260921/README.md) выполнены: полезная диагностика/сохранение/чтение/остаточная проверка приняты, но два неподтверждённых ожидания точного текста падают на исправном поведении. Следующий узкий шаг — согласовать и точечно поправить существующий reasoning skill, проверить новые здоровые/сломанные контрпримеры, затем перейти к полному известному scope / тикетам / частичной помощи на незнакомом разрешённом web/API-продукте. Пять самоустранённых ошибок вызова CLI сохраняются как измеренное трение для P6-entry. Используем существующие механизмы, не новый engine. Раздельно оцениваем рассуждение, исполнение и перенос; open-context exercise не закрывает hidden-answer gate. P4, P6, agent-native результаты, NFR, граф и все 97 записей преемственности остаются обязательствами. Сохранённые исходники и Git-границы: [контрольная точка](../../qualification/git-preservation-20260921.md).

**Ближайший результат (историческая последовательность до entry 20 сентября):** свежий клон выбирает проверенный source; новый диалог читает ранее выполненные agent-led проверки, продолжает остаток и использует принятую содержательную регрессию без локальных доноров и повторной покупки. Эта запись сохраняет прежний порядок P0 source/CI → принятие готовых ремонтов → отдельные ограниченные P1/P2-срезы; она не задаёт текущую следующую работу. Текущий следующий шаг и ограничения указаны в [current checkpoint](../../qualification/current.md): после поставки P2-A semantic fee-caption repair — исходный dry card-top-up UI consumer. Согласованные уточнения Claude перечислены в §10; R1 целиком и её новые бюджеты/права не приняты.

**Историческая пауза 16 сентября:** разработка была отложена ради Freeland. Новая команда пользователя «теперь возвращаемся к глобальному плану по qa агент последнему» снимает эту паузу; не нужно ждать или придумывать состоявшийся релиз. Начать с актуализации source/runtime и P0, сохранив матрицу преемственности. Отдельный [ремонт readiness/expectations Freeland](../../qualification/freeland-harness-readiness-repair-20260917.md) учитывать при P2/P6 как private reviewed candidate, не как автоматически принятую поставку. Продуктовые кампании, выплаты, tracker writes, установка навыков, push и облако этим возобновлением не разрешаются.

**Исторические ролевые ревью базы 16 сентября:** Lead Senior AQA — APPROVED; CTO/AI architecture — APPROVED; SRE/security — APPROVED после точечных уточнений. Это внутренние проверки в отдельных контекстах, не аттестация внешними экспертами. Учтены graph deletion/unmapped controls, обязательный реальный незнакомый consumer наряду с fixtures, разделение статических рисков и гипотез, а также scoped confidentiality/resource/worker и actual cloud-filesystem gates. Эти решения относятся к прежнему плану, не к изменениям 20 сентября и не к приёмке реализации.

**Goal:** по обычному запросу в диалоге агент понимает продукт, выполняет существенные проверки полного известного scope или тикетов, сохраняет пригодные для продолжения результаты независимо от инструмента, доводит пользователя до понятного решения и улучшает следующий проход. Затем тот же процесс переносится на ограниченный cloud worker.

**Architecture:** сохраняем агентское рассуждение, product packs, графы, Console/Kernel, отдельный Freeland harness/verdict, существующие browser/API/host plugins. Дорабатываем стыки исполнения и учёта, чувствительность проверок и квалификацию агента. Не создаём второй QA engine, новую платёжную систему или обязательный сервис памяти.

**Tech Stack:** текущие Node.js/TypeScript, Playwright, схемы и файловые API компонентов, bundle/manifest delivery, source skills для Codex/Claude, доступные host tools и продуктовый tracker plugin.

**Spec:** пользовательский запрос на cross-product разбор; [план 13 сентября](2026-09-13-universal-qa-global-plan.md), [ранние семь результатов](2026-09-10-universal-qa-next-plan.md), [current source](../../qualification/current.md), ранее переданный аудит и исторические внутренние ролевые ревью Lead AQA / CTO–AI architecture / SRE–security. Изложенные ниже факты и ограничения достаточны для понимания плана без исходного чата и приватных каталогов. Приватные доказательства остаются историческими, не prerequisite первого запуска.

**Сверка без потерь (историческая status note до entry 20 сентября):** [поэлементная матрица преемственности](../../reviews/2026-09-16-global-plan-reconciliation.md) учитывает все 97 checkbox-пунктов двух предыдущих планов и отдельные сквозные обязательства. Это 97 записей планов, не 97 разных функций или выполненных проверок. Сжатые ранее fixture/payment/locale/helper/isolation обязанности явно возвращены ниже. Критерии доказуемого завершения каждого среза собраны в §9; source-кандидаты P0 реализованы, но на момент исходного плана не закрывали весь этап до приёмки поставки; текущие статус и приоритетность определены [current checkpoint](../../qualification/current.md). Историческая семантическая сверка Lead AQA и CTO — APPROVED после восстановления отдельного live mixed-batch exit и исключения искусственно обязательных находок в live QA; это не ревью изменений 20 сентября.

## Неизменные ограничения исполнения

- Freeland product repository остаётся read-only: никаких push/deploy/migration. Этот план изменяет только QA; тестовые действия в продукте разрешаются его отдельной policy/authority.
- Использовать существующие registration/owner; `qa-init` только при действительно отсутствующей регистрации или разрешённом recovery. Исторический остановленный workspace не оживает от чтения плана.
- Freeze source/test/oracle/graph inputs в пределах кампании; изменившиеся inputs получают новую identity и релевантную квалификацию. Старые evidence не переатрибутируются.
- Каждый принятый source-срез имеет exact reviewed bytes, nonsecret controls, delivery/cold readback и применимый fresh consumer. Предыдущие большие gates не прогоняются ради нового числа; source adoption не мигрирует кампании/installed skills.
- Не удалять исторические источники/артефакты, не копировать credentials/registrations без отдельного owning решения. Приватность продукта не сводится к отсутствию паролей: отчёты и product source не публикуются автоматически.
- Один владелец общей записи и финансовой операции; root выполняет работу и интеграцию, критики проверяют независимо. Claude/другой host — помощник при доступности, не блокер независимой работы.
- Тест-дизайн/исследование остаются у агента. Неизвестное не PASS, но недоступность одной lane не повод остановить остальные. Полное покрытие неизвестного продукта заранее не обещается.

## 1. Где мы находимся

На момент ревью root `e0347a68391b8c33df2cacc6c76244d4d24fbf1c`; manifest выбирает Kernel `185d3e7`, Console `66ac7db`, Freeland `3ee1cb3`. Независимый AQA повторил `sources:verify` успешно. Существующие незавершённые root-изменения сохранены. Полные component/product suites в этой ревизии не запускались.

Это уже работающий набор средств для полезного QA, а не проект с нуля. Но цель «новый пользователь получает предсказуемо законченный QA-процесс на новом продукте» ещё не квалифицирована. Главный разрыв — не отсутствие ещё одного планировщика, а несовпадение **фактически выполненной агентом работы** и **того, что общий контур умеет принять, показать и продолжить**.

Уже реализовано и не строится повторно:

- переносимая поставка component sources и полных source skills;
- product analysis, разграничение требований/наблюдений/гипотез, запрос конкретной помощи;
- authored campaigns, граф/каталог, сохранение известного знаменателя, evidence reader и отдельно атрибутированный review;
- промежуточные assertions внутри browser journey (`afterOperationIndex` в Console66);
- ограниченное same-host продолжение owned repeat-safe API после прерывания;
- ограниченные fresh-agent, mixed-ticket/help и graph-consumer executions;
- отдельные исправления CAS/admission, late finalization, Freeland SharedWorker и форматного парсера;
- Freeland full/ticket инструменты, product-specific oracles и guarded verification.

Наличие этих механизмов не доказывает browser/payment replay, host restart, actual Claude parity, весь продукт или облачную автономность. Новейший source не подменяет frozen runtime текущей кампании.

## 2. Что показали реальные проходы

### Freeland

**Сильное:** original-path retest, API↔UI сверка, safe readback ранее оплаченных операций, различение product/harness/environment failures, точные ограничения developer SQL/replay evidence, независимые критики. Не пришлось повторять покупки для проверки изменённой котировки и интерфейса.

**Проблемы:** устаревшие ожидания и ожидание hydration по таймеру давали шум; collector мог взять background yearly/reactivate409 вместо выбранного monthly/activate200; временные probes и reviewed dirty candidate ещё не стали принятой переиспользуемой поставкой. На bd650 правильные числа 2% сопровождались подписью 12.9%: collector сохранил текст, но проверял только суммы. Ошибку нашёл агент с ревьюером, не числовая assertion. Это успешное исследование и одновременно незавершённое обучение теста.

Отдельный свежий pure control подтвердил: TC-PAY-01 допускает `SHADOW_PASS` при API с методами оплаты и UI только с balance; даже пустой `sheet.tiles` не вызывает нарушение. **Ложный общий release PASS не доказан**, отсутствие методов на живом staging тоже не утверждается. Поле `promotionEligible:false` внутри oracle само по себе не защищает приёмку: owning campaign вычисляет eligibility по qualified binding и outcome, а действующие проверки receipt/binding остаются обязательными. Проверять фактическую композицию этих механизмов, не ссылаться на декларативный флаг как на достаточный барьер.

### Nuanu App

**Сильное:** реальный новый домен, UI/карта/билеты/локализация/PWA, одна покупка с Wallet/email/PDF readback, повторные проверки фиксов, корректировки собственных ложных выводов, опубликованные knowledge revisions. Mock/source/native результаты позднее разделены.

**Проблемы:** первоначально граф присоединили после проверок. Формулировка «проверено всё доступное, остальное ждёт разработчика» оказалась шире доказательств; после вопроса пользователя нашлись самостоятельные ветки. Смешивались счётчики групп, атомарных сценариев и отдельных наблюдений. Последний прочитанный отчёт честнее: 12 ограниченных наблюдений, исходный остаток27 → 3PASS/2FAIL/22pending, отдельные новые/native gaps сверх128 случаев. Managed validation показывает 1 diagnostic/186 blocked при полезных CUA-проверках вне receipt. Это **не186багов**, а несоответствие возможностей адаптера работе агента.

### MagicPay

**Сильное:** тестируемый агент выполняет работу в отдельном consumer-диалоге; контроллер проверяет результат. Оплата, settlement, выдача и качество результата разделены. Есть восстановление той же операции без повторного платежа, ограничение расходов, чтение бинарного содержимого и исходных MIME/форматов.

**Проблемы:** ранняя серия пропустила pre-execution graph/catalog reconciliation. Исторический workspace остановлен и его runtime/store bindings недоступны; текущий Kernel не экспортирует observation API, на который условно ссылается skill. Поэтому последующие полезные native проверки остались local/unsealed в NuanuFlowQA. Нельзя это исправить приписыванием старого receipt. Actor сначала не заметил MP3 в полном MCP `content`, просмотрев лишь `structuredContent`; независимое чтение исправило ложный вывод об отсутствии выдачи.

Последний прочитанный batch:5/5 финансово завершены и выдали данные, но только3/5 полностью подтвердили содержимое;1 JPEG-vs-PNG несоответствие и1 непроверенная семантика аудио. Это правильный пример: успешный tool/payment не равен выполненному обещанию продукта.

**Общий вывод:** инструкции в основном верные, но их недостаточно. Нужен удобный общий учёт managed и agent-led работы; границы доверия при этом сохраняются. Не нужно заставлять все полезные действия проходить через узкий declarative executor.

## 3. Независимое ревью: что принимаем и что уточняем

Внешний аудит исследовал root `fab87d6`, Console `b54b849`, Freeland `21c1c61`. Ниже — сверка с текущими источниками, а не автоматическое принятие старого списка.

| Замечание | Текущий вывод / действие |
| --- | --- |
| Console Git replacement обход pinned Kernel | Актуальный локальный integrity defect; исправить affected runtime authority. Root delivery имеет более строгую защиту. Это не доказательство remote exploit. |
| Findings writes слабее contained reads | Актуальный статический риск parent-symlink escape; воспроизвести actual create/resolve и исправить узко. Не заявлять уже доказанный HTTP exploit. |
| TC-PAY-01 пропускает отсутствующие UI methods | Подтверждено свежим pure control в canonical и private repair. Исправить oracle и добавить независимые отрицательные примеры. |
| Описание expectedBehavior не доказывает смысл assertions | Актуальная граница. Нужны test-design review и чувствительные controls, не автоматический доказатель естественного языка. |
| Только финальные assertions | Устарело: Console66 уже исполняет промежуточные checkpoints. Не реализовывать заново. |
| Недостаточная temporal semantics | Актуальное ограничение: text/value/url в основном snapshots; расширять только под реальный delayed/stale-state case. |
| Mapped-but-untested changed file | Внутренний `COVERED_PASS` всё ещё слишком широкий; внешний CLI сохраняет `REPRODUCTION_REQUIRED`. Явно показывать непроверенные обязательства, не заявлять найденный false FIXED. |
| CAS, late-finalization, старый SharedWorker, форматный parser | Соответствующие bounded ремонты уже приняты. Не возвращать весь старый backlog как открытый. Проверять новые границы отдельно. |
| Generic manual receipt expiry/type | Открытый public-API дефект, но не используется текущими Console/E1/I2; не подключать к новому observation path до ремонта. |
| Runtime загрузка, дубли схем, стоимость сопровождения | Актуальный architectural risk; выделять один seam по работающему сценарию, без большой переписи. |
| Старые pins в roadmap | Текущий roadmap исправлен; correction в evals/README пока находится в существующем dirty working tree, не приписывается root commit. Current/history и source/installed/runtime drift всё ещё затрудняют вход. |
| API body byte limits и отражённые секреты на screenshots | Подтверждённые кодом ограничения и статические риски; OOM/утечка не наблюдались. Нужны controls и scoped ограничения до расширения соответствующих lanes. |
| Console worker guard без dependencies | Возможный обход — гипотеза по условной установке guard, не воспроизведённый дефект. Нужен отдельный control с/без dependency metadata. |

Более строгая запись evidence сама по себе не исправляет слабый тест. Но и простое удаление ограничений не устраняет потерю scope, ошибочное ожидание или повтор финансового действия.

## 4. Слои и границы ответственности

| Слой | Решение/данные | Что жёстко выполняет код |
| --- | --- | --- |
| Агент | Понимание продуктового дизайна, роли, state/journey model, риск, тест-дизайн, исследование, диагноз и достаточность | Не пытаемся превратить эти решения целиком в enums или scripts |
| Skills/пайплайны | Когда и как discovery/full/ticket/retest/help/resume/learning применяются | Проверенные entrypoints, ссылки на реальные capabilities; не skill на каждый testcase |
| Product pack + граф | Источники требований, UI/design, состояния, зависимости, инварианты, проверки, gaps и изменения | ID/bindings/version validation; graph publication и coverage accounting |
| Исполнители | Playwright/API/CUA/MCP/native/local suites по доступной lane | Ограничения эффектов, execution, trace; вызов инструмента не объявляет business PASS |
| Учёт evidence и продолжение | Managed results + отдельно атрибутированные agent observations, help, scope и решения | Безопасные immutable records/readback, точные bindings, конфликт/unknown handling, отсутствие слепого replay |
| Product acceptance | Агент делает обоснованный QA-вывод; release owner принимает бизнес-риск | Существующий owning verdict не допускает потерю обязательств/ложную атрибуцию; tracker writes по выбранному plugin contract |
| Eval/learning | Независимая оценка решений, предложения регрессий/знаний/skills | Версии, counterexamples, review, воспроизводимый следующий consumer |
| Host | Диалог Codex/Claude; позже worker | Credentials/process/network isolation, cancellation, budgets, delivery/restart |

Это логические модули, а не восемь микросервисов. Freeland-specific правила денег не переносятся в универсальный Kernel. Nuanu Flow/Plan/MagicPay остаются подключаемыми host/product-инструментами; собственный SDK поверх plugin без необходимости не строим.

## 5. Итоговая очередь вертикальных срезов

### P0. Закрыть подтверждённые опасные границы и сохранить baseline

**Reuse:** existing authority, contained reader/writer, TC-PAY-01 и root/component tests.

- [x] Fresh RED для Console Git replacement и findings create/resolve containment; минимальные fixes в owning source, clean controls, reader/final projection, independent review. Source d28d774 принят 20 сентября; независимое ревью, fresh canonical21/21/tsc и cold source readback. Ограничения concurrent/crash cases сохранены в qualification; это не весь P0.
- [ ] Исправить missing-UI TC-PAY-01 с healthy/nonempty, missing method, duplicate/misbinding и API↔DOM controls. Unknown precondition отдельно от подтверждённого текущего consumer gap.
- [ ] Добавить явные безопасные команды source/pure/isolated-fixture/product execution поверх существующих suites. Начать repository CI с ограниченного source+regression gate; продуктовая сеть/секреты не включаются из случайного окружения.
  - 20 сентября: ограниченный source+pure gate доставлен локальным коммитом368a96e и проверен; hosted execution и отдельная квалификация остальных классов команд ещё не закрыты. Весь пункт не отмечается выполненным.
- [ ] До изменения reasoning skills сохранить baseline небольшого набора QA-задач и первые ответы, включая ошибки. Не требовать большого benchmark прежде полезной разработки.

**Exit:** конкретные контрпримеры отклоняются, корректные пути проходят, source delivery проверена. Затронутая небезопасная lane не используется до исправления; это не причина остановить весь независимый read-only QA.

### P1. Сделать agent-led проверки полноценной сохраняемой частью процесса

**Reuse:** Console campaign/review/reader, Kernel owning storage/publication, существующий agent-observations contract. Не активировать historical reporting Kernel ради отсутствующего export.

- [ ] Выбрать один минимальный owning seam для записи новых наблюдений, а не только review уже существующего receipt. Сверить сохранённый reporting reference и переиспользовать пригодное после проверки совместимости.
- [ ] Сохранять scope/check/target, expected basis, observed environment/identity, lane, capture provenance, фактический исход, ограничения и sanitized artifact references. Для discovery без current binding — proposal/gap, а не заимствованный ID.
- [ ] Реальный writer → reader → общий scope view должен видеть CUA/MCP проверку. Метка `agent-authored/unattested` сохраняется; запись файла не аттестует capture, модель, время или бизнес-истину.
- [ ] Не превращать native observation в автоматический PASS/старый managed receipt. Acceptance использует допустимую product policy и review существенного результата, а не просто факт storage.
- [ ] Старая остановленная кампания остаётся исторической. Новая авторизованная серия получает собственное явное основание ownership; resume/migration не угадываются.

**Exit:** свежий диалог читает ранее выполненный browser/API/MCP результат через штатный путь, видит неподтверждённое и продолжает остаток без повторной покупки. Полезная работа не теряется лишь потому, что её не исполняет declarative adapter. Начать с harmless fixture и сохранённых sanitized artifacts, затем отдельный разрешённый consumer. Исторические свидетельства не переаттестуются задним числом.

### P2. Научить переиспользуемые проверки ловить смысл, а не только числа/status

**Reuse:** существующие product oracles/helpers, Console intermediate assertions; reviewed private Freeland repairs сначала сверить, а не написать заново.

- [ ] Довести обнаруженный 440 pattern: правильные суммы с неправильной комиссионной подписью должны проваливать regression. Отдельно required methods, selected source/rail, display, арифметика, guards и original path.
- [ ] Выделить повторяющийся request-selection/readiness helper: выбранный продукт/план/действие/rail, окно наблюдения, соответствующая котировка и устойчивый бизнес-экран. Фоновая409, старая200 и shell не удовлетворяют проверку.
- [ ] В owning Freeland helper сохранить точную классификацию effects: служебный auth/session/quote не равен checkout/деньгам; background GET не обходит product policy. Partial/failed observation не становится PASS, admission collision не становится продуктовым дефектом; поздний guard/cancel результат читается из сохранённого outcome. Не переносить Freeland allowlist в другой продукт.
- [ ] В generic adapter добавить только нужные delayed-text/value/absence controls; сохранить snapshot legacy и `afterOperationIndex`. Не лечить задержку безусловным большим sleep.
- [ ] Для agent-native результата читать полный MCP content, attachments, job lifecycle и бизнес-содержимое. MIME/байты/размер/содержание — разные условия. Нельзя объявлять «нет выдачи» по одному JSON-полю или считать job created готовым результатом.
- [ ] Для критических reusable oracles: краткая claim→observable→assertion/evidence таблица, обоснование ожидания, healthy и broken контрпример, независимый AQA review. Для одноразового low-risk exploration хватит существующих notes, без нового обязательного DSL.
- [ ] Закрыть конкретный прежний minor перед reuse summary-oracle: не требовать английскую строку `0 results` без продуктового основания. Проверить согласованный язык/семантику счётчика и отрицательный случай «верная строка, но неправильные карточки». Старый receipt не переписывать.

**Exit:** отсутствующий UI, неверная подпись при правильной сумме, stale quote, no-op поиск, artifact в другом content block и незавершённый async job корректно различаются. Реальный найденный pattern доставлен в accepted source и использован свежим consumer, а не остался `.local` скриптом.

### P3. Доводить полный scope и тикеты без микроменеджмента пользователя

**Reuse:** product inventory/catalog, mixed-handoff, tracker plugin, existing checkpoints; один scope ledger/read model, не второй verdict.

- [ ] В начале full QA — продуктовые поверхности, роли, состояния, критические journeys и применимые quality attributes. В ticket QA — исходный путь, каждое существенное AC, current deployed fix и соседние риски по графу.
- [ ] До consequential execution сопоставлять выбранные обязательства с существующими graph/catalog, ожиданиями, требуемым состоянием и lane, включая agent-led проверки. Discovery допускается до регистрации; отсутствующая связь сохраняется как gap/proposal, не вынуждает создавать второй workspace или останавливать независимое разрешённое исследование.
- [ ] В одном отчёте различать исходный scope и добавления после исследования. Group, atomic case, observation и test execution не складывать в один знаменатель.
- [ ] Статусы разделяют verified/failed/partial/blocked/unassessed; evidence lane и build видны. Причина blocker: authority, capability, fixture, expectation, harness или development — с конкретным следующим действием.
- [ ] Пока ждём человека, выполнять независимые разрешённые проверки. Помощь содержит точное место/действие, что уже испробовано, затронутые cases и resume point; не просить известные сведения повторно.
- [ ] При существенной неоднозначности предложить ответить либо «разберись сам»; сначала использовать уже доступные материалы. Самостоятельное исследование не создаёт полномочий, а временное отсутствие ответа блокирует только зависимую ветку.
- [ ] После ответа человека проверить текущие account/environment/candidate и факт готовности. Ответ «готово» при прежней недоступной fixture не запускает действие; прежний неизвестный эффект не превращается в `no-effect` после ремонта инструмента.
- [ ] Перед «мы сделали всё доступное» сверить весь известный остаток и вновь обнаруженные ветки. При timebox/остановке явно говорить об этом, а не выдавать за исчерпание возможных тестов.
- [ ] Bug handoff: воспроизведение, источник ожидания, фактический результат, версия, доказательства, дедупликация, условия повторной приёмки. QA gap не становится In Progress разработчика автоматически. Authorized writes — exact target + readback.
- [ ] Build/account сменился — оценить затронутую пригодность evidence, сохранив историческое. Не повторять всю оплату/QA механически и не переносить старый PASS молча.

**Exit:** mixed batch содержит fixed/broken/ambiguous/fixture/capability cases; одна помощь не останавливает остальные. После прерывания новый агент не теряет пункты, не повторяет unknown effect, а пользователь всегда понимает: что проверено, что осталось, кто и что делает дальше.

Отдельный обязательный practical exit: реальный разрешённый tracker read → исходное воспроизведение реальных тикетов → проверки связанного риска → readback результатов. Один реальный retest квалифицирует только ограниченный single-ticket workflow. Полноценный live mixed-batch остаётся отдельным незакрытым выходом до разрешённого прохода по реальному смешанному набору; если такой набор сейчас недоступен, это явно pending, а не повод выдумывать дефекты. Controlled mixed batch не заменяет этот live exit. Запись статуса выполняется только при отдельной подходящей authority; её отсутствие сохраняется как `delivery unqualified`, а не мешает report-only QA. Нет доступного старого broken build — не заявлять фактический RED→GREEN; рабочий обход не закрывает сломанный исходный путь.

### P4. Замкнуть граф и обучение на следующую фактическую проверку

**Reuse:** Kernel revisions/preview/apply, Freeland graph/impact/plan, existing Obsidian view; не новая memory DB.

- [ ] Учесть mapped-but-untested obligations в owning coverage и проекциях, сохраняя внешний conservative ticket verdict. Requirement coverage и change coverage отдельно; наличие одного теста не закрывает все clauses.
- [ ] После прохода собрать confirmed knowledge/регрессию отдельно от гипотез. Версия/источник/актуальность и superseded knowledge сохраняются. Обновление/инвалидация касается изменившейся области, не массового сброса истории.
- [ ] Выбрать одну реально найденную общую зависимость (например selected PaySheet disclosure), опубликовать и проверить, что fresh consumer действительно запускает связанную проверку.
- [ ] Negative controls: удалённая существенная dependency и unmapped change не дают необоснованного сужения scope; сохраняются видимый gap и product-owned fallback. Отсутствующая связь не запрещает агенту самостоятельно найти риск.
- [ ] Измерять detection, необнаруженные обязательства, full fallback, стоимость выбора и исполнения. Старый graph comparison D+C/D+C — честный null result по приросту покрытия; не запрещать полезную самостоятельную exploration ради красивой разницы.
- [ ] Lesson→reviewed graph/test/skill→held-out consumer. Отдельно отчитываться «продукт проверен» и «qa-agent улучшен». Bug escape запускает разбор причины пропуска; карантин имеет owner, пересмотр и явный риск.
- [ ] Там, где доступны broken/fixed версии, один неизменный существенный oracle обязан различить их. При отсутствии одной версии записать предел доказательства. Точечное исправление ожидания требует самостоятельного основания, а не подгонки под GREEN. Reviewed knowledge можно supersede/откатить без уничтожения истории и старых verdict.
- [ ] Obsidian пересобирается из принятой ревизии; не отдельный источник истины. Память остаётся трёх типов: продуктовые знания, состояние кампании, переносимые методы.

**Exit:** следующая проверка использует принятое изменение, ловит известный тип дефекта и сохраняет соседний healthy case. Нет ложного уменьшения denominator. Не надо закрывать весь долг графа Freeland, чтобы тестировать другой продукт.

### P5. Квалифицировать переносимость QA-решений и нужные capabilities

**Reuse:** нынешние fixtures/evals, source skills, продуктовые packs, доступные adapters. Начинается параллельно P1–P4, а не после них.

- [ ] Небольшой заранее описанный набор: web/user journey, роли/данные/API и agent-native/tool delivery; healthy/broken/ambiguous/blocked, оригинальный сломанный путь с рабочим обходом, interruption и поздняя помощь.
- [ ] Answer key недоступен actor реально, не только запрещён текстом; иначе обозначить open-context exercise. First attempt, подсказки и исправления отдельно. Известный Freeland retest — не blind benchmark.
- [ ] Отдельные метрики: обнаружение seeded bugs, false bug claims, unsupported PASS, потеря scope, diagnosis, ненужные human blocks, безопасное continuation, время/стоимость. Необходимый OTP/approval не считать ошибкой автономии; отсутствие наблюдений о prod escapes не равно нулю.
- [ ] В существующем trial record различать interpretation, самостоятельное execution и transfer; сохранять model/host/source/tools, все попытки, retries/flakes/skips и подсказки. Answer key фиксируется до trials; invalid/surviving mutations не скрываются в общем зелёном total.
- [ ] Продуктовый дизайн обязан появляться уже в discovery: намерение пользователя, deliverable, состояния, побочные последствия, роли, empty/loading/error/disabled/responsive UI. Для AI-продукта — качество ответа и устойчивость, tool calls/permissions/prompt injection; для Nuanu — билеты/GPS/native; для Freeland — деньги/entitlements.
- [ ] Применять по риску классы эквивалентности, границы, таблицы решений, переходы состояний, инварианты, конкуренцию/идемпотентность и API↔UI проверки. На конкретном кейсе объяснить, почему выбрана техника и что она не покрывает; не требовать все техники у каждого продукта.
- [ ] Для agent-native продукта consumer выполняет пользовательское намерение сам; управляющий QA наблюдает и оценивает, не производит товар вместо него. Проверять ошибки, таймауты, порядок tools и восстановление, а не только happy path. Поддержку merchant/route подтверждать конкретной интеграцией, не выводить из названия платёжного провайдера.
- [ ] **Fixtures/account pool:** использовать product-owned DevTools/штатные аккаунты; проверять stable ID, роль, исходное состояние, срок действия, ownership и readback. Нет нужного состояния — конкретный fixture request и независимая работа; агент не строит продуктовую админку и не удаляет аккаунт без полномочий.
- [ ] Сохранить historical QA-H020 control: `loginEmail` и подтверждённый `mailboxAddress` могут различаться; выбирать по проверенному user/resource ID, не первому похожему alias. `stored-active` при прошедшем expiry не подтверждает активность. Изменившийся PR/бизнес-контракт сначала разрешает acceptance conflict; старый QA-H020 не объявляется автоматически текущим product bug.
- [ ] **Отдельная payment/mutation qualification:** явные продукт/среда/действие/лимит, один владелец операции, итог списания/резерва/выдачи, pending/decline/unknown и reconciliation до retry. Учитывать общий остаток бюджета и одновременных исполнителей. В приватном списке возвратов — аккаунт, операция, сумма/валюта/дата и статус, без PAN/CVV/секретов. Тестовая карта или старый лимит не переносятся между продуктами; сохранённое достаточное evidence не требует новой траты.
- [ ] Checkout continuation: close/reopen/reload сохраняет ту же исходную операцию, где таков продуктовый контракт; неизвестный исход сначала сверяется по тому же ID. Готовое private решение переиспользовать после ревью, не создавать очередной task-local script. Actual payment qualification отдельна от synthetic recovery controls и не обязательна для read-only пилота.
- [ ] Security/accessibility/performance/reliability проверять по риску и доступным полномочиям, не ограничиваться перечислением в отчёте. Real-device/GPS/audio/provider gaps получают минимальный tool/fixture или помощь; mock не заменяет real acceptance.
- [ ] Если capability реально мешает повторяющемуся сценарию — сравнить текущий tool с одним кандидатом на одинаковых контролях. Не интегрировать сразу Browser Use/Stagehand/agent-browser/Midscene и не строить свою продуктовую DevTools.

**Exit:** свежий агент без авторского контекста самостоятельно получает полезный и обоснованный результат в разных классах продуктов, включая хотя бы один разрешённый реальный незнакомый продукт наряду с controlled fixtures. В малом declared acceptance set нет пропущенных critical seeded cases, ложных healthy bugs или unsupported acceptance; это локальный gate, не обещание абсолютной универсальности.

### P6. Упростить entry/runtime и принять dialogue-ready поставку

**Reuse:** root manifest/restore/current, full source skills, Console/Kernel application seams. Начать короткий entry сейчас; более глубокую runtime консолидацию делать по измеренному повторяющемуся трению.

- [ ] Краткая current projection из существующей authority: accepted source, actual campaign runtime/owner, skill bundle, capability availability, scope, blockers и следующий шаг. История — отдельно. Не заводить второй вручную поддерживаемый реестр версий.
- [ ] Проверять весь выбранный source skill bundle, включая references, а не только SKILL.md. Installed drift не скрывать; selective install/adoption отдельно. Skills для lifecycle покрываются поведенческими evals, не только наличием файла.
- [ ] Принять уже reviewed private полезные repairs отдельно от product evidence. Устранить runtime-зависимости от NuanuFlowQA через owning reconciliation; секреты/остановленные registrations не копировать массово.
- [ ] Проверить startup/continuation с отсутствующей capability, истёкшим доступом и повреждённой соседней product session. Здоровый target с проверяемой собственной authority остаётся доступен; чужие state/secrets не переносятся и ошибки не ремонтируются массово при чтении одного проекта.
- [ ] Сохранять exact reviewed plan bytes перед следующей ревизией, не только digest. Inactive registration-view fix интегрировать только после проверки актуальности; не выдавать registration snapshot за runtime plan.
- [ ] Существующая пара Kernel`a9378b2`/Console`d272f31` остаётся **reviewed, not adopted** ([checkpoint](../../qualification/registration-planning-snapshot-20260915.md)); это registration view, не новый архив runtime-плана. Проверить её применимость к свежему source и absent→authored→CAS-revised readback, затем отдельно решить adoption. Для plan history: до ревизии сохранить старые bytes, после — прочитать те же bytes/digest; старому initial run отсутствующий архив не приписывать.
- [ ] Сохранить отдельное условное решение по thin graph/catalog/coverage authoring helper: если callers снова требуют test-fixture imports и ручную синхронизацию, обернуть existing APIs. Приёмка — API/browser/manual examples плюс dropped-blocker/wrong-binding controls; manual example не подключает дефектный generic receipt API. Если трение устраняется существующим API, сохранить no-new-code решение. Новый selector/CLI не нужен.
- [ ] Выделить один дублируемый contract и единый проверенный loader/build artifact для CLI/server при доказанной пользе. Сохранить source/bundle delivery и compatibility; не переписывать всё storage на SQLite заранее.
- [ ] До приёмки затронутых lanes: reflected-secret screenshot не попадает в публикуемые evidence без допустимой redaction/private policy; oversized/chunked API response завершается bounded typed outcome; Worker/SharedWorker controls с/без dependencies проверяют одинаковую границу разрешённых эффектов. Эти проверки не блокируют независимые безопасные anonymous P1/P3 scenarios.
- [ ] Cold clone + новый диалог без локальных доноров и истории: discover → full/ticket → помощь → resume → результат → learning. Actual Codex и Claude executions отдельно; mirror не proof второго host.

**Exit dialogue-ready:** repository + явно указанные prerequisites достаточно для заявленного QA scope. Нет известных fail-open дефектов его активных путей; evidence, scope и продолжение работают end-to-end. Lead AQA принимает качество проверок, operations reviewer — границы исполнения и recovery. Ещё не обещается всякий native/payment/host-restart путь.

### P7. Ограниченный cloud pilot, затем эксплуатация

- [ ] Отдельно согласовать один продукт/host/action scope; по умолчанию read-only web/API. Не ждать поддержки всех доменов и финансов, но не переносить их права молча.
- [ ] До setup зафиксировать experiment GO: продукт, host, actions, бюджет, доступы и stop criteria. Регулярная работа/уведомления/расширение прав — отдельный operational GO после результатов пилота. Нельзя требовать уже доказанную cloud recovery до самого разрешённого controlled эксперимента.
- [ ] Тот же accepted runtime/skills на одном worker: isolation, credential lifecycle, network bounds, resource/response-size limits, cancellation и durable checkpoints.
- [ ] Cold execution на выбранном Linux worker и его реальных mounts: permission/containment/lock/crash свойства проверяются там, а не выводятся из macOS-прогона. Если выбран иной cloud host, квалифицировать его фактическую ОС/файловую систему отдельно.
- [ ] Controlled host restart, поздний ответ человека и неизвестный исход доставки; reconciliation до retry. Browser/payment replay допускается только в отдельно проверенном scope.
- [ ] Собственная identity агента для автономной коммуникации, выбранный tracker plugin, доставка с readback. Сервер/MCP endpoint нужен только если deployment требует его, не как новый QA engine.
- [ ] Сравнить существенные результаты диалога и worker. GO на эксперимент и GO на эксплуатацию — разные решения.

**Exit:** worker заканчивает полезную проверку, сохраняет/восстанавливает работу и выдаёт понятный результат без скрытого операторского вмешательства. Недоступный Claude не препятствует честно single-host пилоту, но dual-host claim остаётся открытым.

## 6. Как исполняем быстро и что меняется в старом плане

Три параллельных потока: **A** точечная безопасность/delivery P0; **B** полезный agent-led workflow P1/P3 и минимальный entry; **C** независимый AQA baseline, semantic controls P2/P5. Один владелец shared source/state; root сам ведёт B и интеграцию. Критики не правят свою же реализацию. Продуктовые кампании остаются у своих owners; доступность Claude не блокирует работу.

Первый пакет к реализации: P0 три конкретных дефекта + дизайн минимального P1 writer/reader, с baseline качества параллельно. Следующий видимый результат — fresh dialogue использует сохранённое agent-led evidence, не просит повторить выполненное и ловит известную semantic regression через переиспользуемую проверку. Не очередной большой unit total.

План13сентября сохраняет смысл: этап1→P0/P6; этап2→P1/P2/P5; этап3→P3; этап4→P4; этап5→P5; этап6→P6; этап7→P7. Принятые continuation/journey/mixed/graph slices не повторяем. Snapshot/helper остаются полезными локальными задачами, но перестают быть главным milestone впереди реального QA-пути.

Для каждого среза: symptom + scope → bounded design → RED/known counterexample → minimal implementation → relevant GREEN + healthy control → независимый review → accepted delivery → actual fresh consumer. Счётчики self-tests, продуктовых проверок и agent evals не смешиваются. Не менять ожидание лишь потому, что тест красный; не типизировать рассуждение ради формы.

## 7. Не включаем в ближайший объём

- второй универсальный runner/verdict/трекерный SDK;
- полную перепись Console/Kernel/Freeland или общий enum бизнес-приёмки;
- vector DB, обучаемый ранжировщик графа, четыре browser frameworks и массовую генерацию skills;
- mandatory sealing каждой исследовательской мысли или инфраструктурную блокировку всей полезной работы;
- возврат к уже принятым bounded repairs как к незавершённым задачам;
- обещание «любая система, 100% покрытие, ни одного неизвестного дефекта» или проценты готовности из количества коммитов.

## 8. Исторические основания и границы ревизии 16 сентября

Прочитаны релевантные сообщения и фактические отчёты задач «QA FREELAND», «Провести QA Nuanu App» (`01a0a382-5b54-70b3-904a-e9cda1379fb9`), «Управляющая MagicPay» (`01a0a375-59fe-7011-b6a4-c9e625dab935`) и внешний архитектурный аудит (`01a0a3a2-2ec8-7cd3-90cb-5de98f1e1bec`). Последние сообщения двух QA-задач проверены по их локальным conversation records, поскольку app read_thread возвращал пустые items для недавних turns. Никаких сообщений в эти задачи не отправлено и их исполнение не менялось.

Фактические срезы: Freeland bd650 retest и urgent-release16сентября; Nuanu App reacceptance-9 на ab2fe28 с отдельно сохранёнными более ранними observations; MagicPay provider batch2 от16сентября. Это исторические данные анализа, не fresh live revalidation продуктов. Установленные навыки/приватные runtime могли различаться с canonical source; различие не скрывается.

Коллегия проверяла code seams и контрпримеры выборочно, а не исполнила каждый тест каждого компонента. Подробные приватные review artifacts не являются зависимостью этого плана. Не запускались live QA, платежи, tracker/Buzz writes, installations, source adoption, commits или push. Изменение этого документа не выдаёт релизный GO Freeland и не закрывает ни один продуктовый gap.

## 9. Проверяемые шаги: что предъявлять при завершении

Это acceptance-level план самостоятельных срезов, не выдуманные команды для ещё не реализованных интерфейсов. Перед кодом конкретного среза — небольшой owning implementation plan с точными файлами, RED/GREEN commands и contract. Нижеследующие controls обязательны для его результата; один reviewer вправе принять соседний срез и отклонить этот.

Для каждого среза сохранять в существующих qualification/eval/campaign records: входной scope и exact source/target identity; ожидание и его основание; исходный контрпример или baseline; выполненные команды/действия и исходы; безопасные evidence references; отрицательный и исправный control; actual reader результат; независимый вывод и оставшиеся ограничения. Для изменения навыка вместо искусственного code-RED — сохранённый первый ответ и новый независимый пример. Не нужны новый receipt engine или подпись каждого low-risk наблюдения.

| Gate / шаг | Конкретная проверка | Достаточное доказательство / запрет ложного закрытия |
| --- | --- | --- |
| **P0-entry — сначала** | Fresh actor из repo выбирает accepted source, отдельный frozen runtime, owner и полный skill bundle; на stale installed reference не мигрирует кампанию | Исходный ответ и разрешённое первое действие/readback; до skill edits сохранён baseline. Уже выполненный `sources:verify` доказывает только bytes, не этот actor gate. |
| **P0-integrity** | На изолированном checkout изменённые bytes под Git replace; findings parent symlink, destination collision и failed resolve; здоровые эквиваленты | На baseline ошибочное принятие/escape воспроизведено, после fix отклонено без изменения внешнего sentinel/потери original finding. Exact focused logs + независимый review; статическое предположение не объявляется выполненным exploit test. |
| **P0-oracle/CI** | API здоров, UI balance-only/empty/missing/duplicate; healthy required methods. Safe CI не выбирает live target из env | Ошибочные варианты дают нарушение, healthy проходит; binding/receipt qualification не обходится, старый owner receipt не переносится на изменённый oracle, один oracle flag не считается защитой. Fresh ограниченный CI/source gate, без продуктовых секретов. Не ждать всей P2-библиотеки. |
| **P1-observation** | A — реальное разрешённое read-only наблюдение, B — отсутствующая capability, C — независимая проверка. A сохранить, закрыть контекст, прочитать другим actor; altered bytes/wrong binding/conflicting ID | A доступно с exact scope и unattested provenance, B остаётся gap, C выполнено. Negative writes не меняют историю. Старая local запись не становится runner receipt; никакой повторной оплаты. |
| **P2-semantics** | Верные суммы + неверная подпись; wrong selected/background/stale quote; delayed healthy/no-op search; локализованный empty state; MCP attachment вне structuredContent; async job не завершён | Один существенный oracle различает healthy/broken/fixed там, где они доступны. Сохранены request/UI correlation и actual reader. Отсутствующая baseline отмечена; неисполненный clear suffix остаётся pending. Изменение доставлено в owning source и использовано неавторским consumer. |
| **P3-full** | Из brief/дизайна/графа составить scope и выполнить существенные проверки. Новую ветку и конфликт ожиданий предусмотреть в controlled fixture; в live QA учитывать только действительно обнаруженные, не требовать их появления | Initial plan предшествует проверкам, original/additional scope раздельны, compound clauses не потеряны. Итоговый denominator объясним; каждый остаток имеет действие/владельца либо явно unassessed. «Всё доступное» не выводится из пустой очереди исполнителя. |
| **P3-tickets/help/resume** | Controlled fixed/broken/ambiguous/fixture/capability batch; ложное «готово», затем действительная помощь; прерывание A done/B unknown/C pending. Отдельно реальный tracker single-ticket workflow и live mixed-batch | Первый ложный ответ не вызывает action; после проверки готовности выполнен только разрешённый остаток. A не повторено, B сверено, C не потеряно. Live read/original-path/related check + persisted result отдельно от synthetic; один live тикет не закрывает live mixed-batch. Перед authorized delivery dedupe/state/template/readback; simulated delivery не закрывает реальную. |
| **P4-graph/learning** | A/B changed, только A tested; одна новая reviewed dependency; deleted edge/unmapped change; повторное исполнение свежим actor и rollback knowledge | B виден как untested. Actual выбранные/выполненные checks и причины сохранены; unmapped сохраняет fallback. Измеряется detection/стоимость, не node count; одинаковый выбор control/treatment остаётся null result. Knowledge можно supersede/rollback без переписи старого outcome. Obsidian отражает принятую версию. |
| **P5-fixtures/effects — отдельно** | Похожий alias, неверная роль/owner, expired stored-active; бюджет/двойной owner; same-ID checkout после close/reload; pending/decline/unknown | Неверная fixture не используется, лимит/authority ограничивают действие, reconciliation предшествует retry. Приватный refund список сверен. Synthetic controls не равны actual purchase proof; без authority эта lane остаётся unqualified, другие работают. |
| **P5-agent-quality** | Заранее заданные healthy/broken/ambiguous/blocked задачи нескольких классов; скрытый answer key, новый вариант после skill fix, хотя бы один реальный незнакомый продукт | First attempts и corrections отдельно; нет unsupported PASS/ложного healthy bug и пропущенного critical seeded case в этом малом наборе. Отдельные interpretation/execution/transfer показатели, retries/skips/cost. Это не статистическая гарантия для любых продуктов. |
| **P6-state/skills** | Старый plan после CAS revision; corrupted соседний проект, expired credentials, build change; полный source/installed bundle; три authoring examples если helper выбран | Старые plan bytes читаются неизменно; здоровый target продолжает работать без чужих state/secrets. False-current/stale-help отклонены. Helper dropped-blocker/wrong-binding controls и no-new-code решение равноправно допустимы по наблюдаемому трению. |
| **P6-dialogue-ready** | Cold clone без NuanuFlowQA/авторских registries; новый actor выполняет discovery/full/ticket/help/resume/learning в заявленном scope. Codex/Claude отдельно | Replay instructions, exact delivery, реальные tool outcomes, понятный итог и независимые AQA/operations reviews. Mirror не Claude execution. Нет известных fail-open defects выбранной lane. Пробелы других классов продуктов остаются видимыми. |
| **P7-cloud** | Отдельный experiment GO; реальная ОС/mounts, bounds/cancel/timeout, restart, delayed help, failed/unknown delivery | Local/cloud существенные outcomes сопоставлены; crash не теряет результат, ambiguous dispatch не повторяется слепо. Задокументированы scope/лимит/stop criteria и отдельный operational GO до расписаний. Просто поднятый сервер gate не закрывает. |

### Зависимости, чтобы не строить всё последовательно

1. P0-entry и baseline — сначала. Safety fixes относятся только к затронутой lane; independent безопасная работа продолжается.
2. P0-integrity, P1 observation и P2 semantic controls идут параллельно с непересекающимся source ownership; P1 использует только безопасный owning writer.
3. P3 end-to-end использует P1 и релевантные P2; простые scope/help поправки можно проверить до завершения кода P1 через текущий честный fallback.
4. P4 использует реальную находку P2/P3, не требует нового живого бага специально для learning. P5 baseline и capability assessment идут с начала; итоговый transfer — на принятом срезе.
5. P6-entry/skills и historical snapshots выполняются по мере необходимости, не ждут конца. Итоговый dialogue-ready gate объединяет P0–P5 только для объявленного host/product/action scope.
6. P7 начинается после P6 для одного доступного host и отдельного GO. Полный долг Freeland, платежи/native и недоступный Claude не становятся скрытой обязательной зависимостью read-only пилота.

### Сохранённые старые адресные задачи

| Пункт | Текущий disposition и следующий проверяемый шаг |
| --- | --- |
| M1–M5, bounded continuation, browser checkpoints | В принятой поставке в прежних границах; не переоткрывать разработку. Совместимость защищают существующие controls. |
| R0 single-ticket binding, R4 UNCOMPUTED | Исходные333cdb2 иd90cec7 — предки текущего Freeland3ee (сверено Git); UNCOMPUTED renderer/controls есть в source. Старое «delivery pending» не переносится автоматически. При touched regression убедиться: BOUND≠FIXED; build-only scope unknown, настоящий computed-zero сохраняется. Это не новая live qualification. |
| QA-H003 production topology | Source принят в3ee; только explicit full для поддержанной divergent topology. Не ослаблять impacted gate ради релиза и не считать adoption product GO. |
| QA-H001 / full skill delivery | Исторический root routing fix сохранён; нынешний полный installed/runtime bundle сверяется P0-entry/P6, не создаём duplicate дефект по старому mismatch. |
| QA-H020 / acceptance conflict | Исторический alias/expiry пример включён в P5 controls; актуальность product expectation сверяется перед использованием, не объявляется новым живым багом. |
| Summary locale / search-clear suffix | Явно pending до P2 reuse; прежний conditional результат сохраняется. |
| Kernel a9378b2 / Console d272f31 | Reviewed inactive candidate; applicability/adoption решение P6 отдельно от будущего сохранения historical plan bytes. |
| Thin authoring helper | Условная оценка P6; принять минимальную обёртку или обоснованно оставить existing API. Не потерян, но не новый обязательный framework. |
| Strict176 / money/access/replay gaps | Сохранённый dated Freeland debt, не176разных багов и не current автоматически. Перед affected selection получить актуальный owning readback; P4/P5 ведут остаток по риску. Другой продукт не обязан ждать его обнуления. |
| M6 generic manual receipt | Открытый API gap, не использовать как короткий путь P1. До нового consumer — отдельный contract/expiry/kind/shared-check control и review; отсутствие consumer не блокирует нынешний Console QA. |

## 10. Принятые уточнения после Claude QA — 20 сентября 2026

Пользователь согласовал критический разбор [ретроспективы 18 сентября](../../retrospectives/2026-09-18-freeland-403d3e4-qa-agent-retrospective.md). Ниже — изменения существующих срезов, не второй план и не уже выполненные результаты. [R1](2026-09-18-global-plan-r1-draft.md) остаётся историческим предложением; её бюджеты, обязательные ручные покупки и blanket-правила одобрений не становятся authority.

| Уточнение | Срез | Проверяемый выход |
| --- | --- | --- |
| Однозначные ID каталога, графа и replacement tests | P4 | Намеренная коллизия одного ID для разных сценариев отклоняется; допустимые отдельные checks связаны с одним case явно. Счётчики не складывают case и executions. Разобрать конфликт TC-VPN-05, не переименовывать исторические receipts. |
| Жизненный цикл ожиданий | P2/P4 | Новое ожидание имеет источник требования/согласованного изменения и версию; старое superseded, не стёрто. Исправленный legacy→VELVET не проверяется ожиданием прежней блокировки. Неожиданный PASS запускает диагностику, не автоматическую приёмку. |
| Общие helpers для agent-led probes | P1/P6 | Извлечь повторяющиеся guard, login/session handling, readiness, redaction и запись результата из существующих helpers; один новый сценарий использует их и читается свежим диалогом. Сессии не разделяются между конфликтующими account-state тестами. Нет нового runner или обязательного лимита строк. |
| Содержательные регрессии из прохода | P2 | При подтверждённых ожиданиях: сумма пополнения против минимального депозита, подпись комиссии выбранного метода, видимая ошибка/восстановление после неуспешного quote, появление выданного продукта без F5. Healthy/broken controls; broken→fixed одного oracle только при фактически доступных версиях. Новая покупка не обязательна для компонентного/fixture доказательства. |
| Три разных решения о релизе | P3/P5 | Отчёт отдельно содержит QA scope/outcome, owner risk decision и readiness целевой среды (schema/config/in-flight operations/rollback). QA approval не обходит production migration guard; staging PASS не доказывает здоровье частично мигрированного production. Сначала отчёт/skill, без нового движка. |
| Реальные основания доверия | P0/P5/P6 | Критерии называют реально исполняемый binding/receipt gate. Ревью фиксирует reviewer/context, проверенные bytes/действия, ограничения и решение; название роли или same-model second context не выдаётся за независимую внешнюю экспертизу. |

### Поправки к предложениям Claude

- Известный дефект не получает автоматическое исключение. Отдельно показывать regression delta и общий риск. Для допустимого waiver — точный scope/версия, основание, владелец и срок пересмотра; непокрытое не превращается в PASS, истёкшее исключение требует решения.
- Наблюдение не равно подтверждённому багу. Например, общий запрет латиницы в RU или требование отвергать любой malformed query без бизнес-основания создаёт ложные дефекты. Источник ожидания и корректные необычные примеры обязательны для reusable oracle.
- Ноль новых багов в одном regression run не доказывает бесполезность автоматизации. Оценивать detection, ложные утверждения, gaps, устойчивость и стоимость раздельно; вывод о prod escape требует фактического production escape.
- Покупка человека может быть достаточным свидетельством при допустимой policy и точной привязке к account/operation/result. Предпочтителен доступный агенту тестовый аккаунт, но недоступность аккаунта не повод повторять трату или отвергать все human evidence.
- Ретенция различает восстанавливаемый код/зависимости и исторические доказательства. Trace, receipt, первый ответ и исходные plan bytes не объявлять воспроизводимыми автоматически. Удаление/архивация — отдельное явное решение.
- Закрытие reviewed→adopted, safe CI и короткий entry важнее новых больших рефакторингов. P1/P2/P5 остаются параллельными при непересекающемся ownership; качество агента не откладывается до всего live mixed-batch.

Предварительно сохранять результаты в существующих qualification/eval records. Эти уточнения не закрывают чекбоксы P0–P7 и не изменяют принятую ранее 97-пунктную матрицу преемственности.

[Ревью уточнений 20 сентября](../../reviews/2026-09-20-plan-clarifications-review.md): внутренний Lead AQA review в отдельном контексте — APPROVED после двух правок атрибуции. Граница решения — документация и сохранение требований, не код/CI/adoption или продуктовый GO.

## Переносимость исторических ссылок

Для исполнения текущего плана нужны tracked current checkpoint, manifest, skills/owners и сохранённая матрица с её exact D10/D13 inputs. Предыдущие operational pauses, source tuple и candidate-status в теле плана — история; current checkpoint и qualification выбранных successors определяют нынешний факт реализации. Эта пометка не отменяет ни один acceptance gate.

Следующие ссылки выше — необязательные исторические материалы, не входные зависимости чистого клона. Они могут отсутствовать в поставке; приведённые здесь выводы не заменяют недоступное исходное evidence:

- `docs/qualification/global-plan-resume-20260917.md`;
- `docs/qualification/freeland-harness-readiness-repair-20260917.md`;
- `docs/qualification/p0-safe-ci-20260920.md` (актуальная переносимая квалификация выбранной CI/Freeland поставки доступна из current checkpoint);
- `docs/retrospectives/2026-09-18-freeland-403d3e4-qa-agent-retrospective.md`;
- `docs/superpowers/plans/2026-09-18-global-plan-r1-draft.md`;
- `docs/reviews/2026-09-20-plan-clarifications-review.md`.

Не импортировать ради этих ссылок приватные state, credentials или историю продуктов. R1 не принят целиком; его отсутствие не блокирует выполнение P0–P7. Старые локальные ссылки из exact historical snapshots также не являются first-use prerequisites.
