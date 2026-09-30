# Универсальный qa-agent: итерации и поставка через PR

Дата: 30 сентября 2026. Этот индекс разбивает глобальную очередь на небольшие независимо проверяемые результаты. Он задаёт порядок будущей работы, а не объявляет ещё не реализованные функции готовыми. Новая реализация получает отдельный PR; runtime/host/product acceptance остаются отдельными результатами.

## Цель и архитектура

Свежий агент на незнакомом продукте должен выбрать существенные проверки, проверить пользовательский результат, сохранить доказательства и весь известный остаток. Агент принимает QA-решения; product pack задаёт нормативные ожидания и допустимые эффекты; существующие Console/Kernel либо specialist owner управляют состоянием и evidence своего контура.

Один обязательный локальный MCP открывает существующий контур агенту. Skills объясняют повторяемые пользовательские задачи, граф помогает находить связи и пробелы, CI проверяет механические контракты. Не создаём второй runner, verdict store, graph database, scheduler или orchestration framework. Browser/API остаются capabilities host-агента. Универсальность означает переносимый процесс с явной support matrix, а не поддержку любого действия и устройства.

Новая архитектура, API/schema/verdict/lifecycle, adapter/dependency и неразрешённая семантика сначала проходят настоящий Astra design и независимое AQA review. Код и локальные проверки выполняются на Sol. Не имитируем смену модели. SuperSkill не используется; исторический NuanuFlowQA не выбирается источником из-за cwd.

## Публичная база и локальная работа

Публичная база этого документа — `codex/stable-20260926`, commit `04f84555ba17bcc3d5c73b1a1410c9e08cb80562`. Её [manifest](../../../sources/manifest.v1.json), [qualification](../../qualification/current.md) и [release record](../../releases/2026-09-26.md) описывают **доставленные** возможности. Документ не меняет эти source pins и не квалифицирует новый runtime.

Локальная дорожная карта `2026-09-30-universal-qa-agent-global-plan.md` на reviewed development commit `378f9f778420c431d256a2f1df61ac216a4377b9` — источник этого разбиения. Она и подробные 29 сентября MCP/Card1/CTO specs пока не входят в указанную публичную базу. Их имена здесь — provenance, не доступные hyperlinks, исполнимые инструкции или публичная поставка. Перед реализацией необходимый exact design должен стать доступен reviewer в допустимом delivery scope; недоступный design — конкретный blocker этого среза.

Локально приняты bounded CTO #4/#7/#8/#9/#11 и MCP Tasks1A/1B/2. Это не означает, что они уже опубликованы, что MCP Tasks3–8 выполнены или что product acceptance состоялась. Локальная compatible pair Kernel `847777a7a87c55a7648ac155da2e18d6593aa16a` / Console `014940a4a59cd9c6f51add59acde710cfdbaa1ba` отличается от публичной и от frozen MCP Task2. Принятые результаты не переигрываем; для новых bytes повторяем только затронутые проверки.

Предыдущий [W/P requirements ledger](2026-09-23-unified-qa-agent-implementation-plan.md) и его [no-loss comparison](../../reviews/2026-09-23-global-plan-reconciliation.md) сохраняются. Card/ID ниже — одно разбиение текущего порядка, а не параллельная очередь или новая метрика готовности. Все унаследованные W0–W9/P0–P7 exits и 97 D10/D13 обязательств сохраняются, включая full/mixed/help/lesson/host, когда они заявляются.

Разработка глобального/MCP-плана остаётся paused. Пользователь разрешил документальное разбиение и отдельные PR/push для разрешённых реализаций; это не снимает паузу и не принимает автоматически Card1 written spec, новые designs, product actions, установки, host setup, cloud или внешние расходы. Отложенные CTO privacy/financial/history-publication решения не отменены. Complex CTO #5/#6 требуют отдельной команды.

## Как выбрать следующий шаг

Основной порядок: **Card0 → Card1 → Card2 → Card3 → Card4 → Card5**. Admission следующего case и независимый read/design могут готовиться параллельно. Cards6–14 выбираются только по показанному gap или обязательству заявленного support scope; затем Card15 portability и Card16 independent transfer. W8 model comparison и W9 cloud — отдельные поздние программы.

Сейчас ближайший шаг после принятия этого разбиения — **G01: review пользователем уже написанной Card1 spec**, затем её exact implementation/evaluation plan. Публичная source delivery сверяется в B01; MCP successor binding проектируется в G02. Нельзя перескочить с наличия pure tests сразу к host или live PASS.

### Предварительные gates

| ID | Результат | Различающая проверка и граница |
| --- | --- | --- |
| B00 — Card0; W0/W7, P0/P6 | Этот самостоятельный docs-only PR: очередь, критерии и Git delivery | Links разрешаются на public base; diff не содержит runtime/pins/bundles/истории/private data. AQA проверяет no-loss и разделение source/runtime/agent/product. Не возобновляет execution. |
| B01 — source delivery; W0/W7, P0/P6 | Отдельный точный scope публикации необходимых accepted sources/designs | Сверить real remote/base, unpublished ancestors и dependency closure. Только если отдельно допустимо: narrow adoption PR с необходимыми совместимыми child sources, manifest/bundles и evidence. Не общий push development history; не миграция frozen campaigns. Пока scope не принят, affected new-source delivery остаётся blocked. |
| G01 — Card1 | User review written grounded-obligations spec, затем Astra implementation/evaluation plan + independent AQA | Exact bytes, пять controls, frozen first attempt, reader protocol, допустимые effects и stop. Принятие общей идеи не заменяет written-spec review. |
| G02 — Card2.0 | Astra review текущих source/workflow/package bindings против frozen Task2 | Определить successor и compatibility controls **до** execution/dependency setup. Нельзя взять freshly observed hashes как trust anchor или обновить старый capture задним числом. |
| G06/G05 — CTO #6/#5 | После отдельной команды: exact supervisor repair / authority-cost measurement design | #6 блокирует только затронутые timeout/cancel/write/effect routes; #5 сохраняет authority comparisons и awaited boundaries. Independent pure/read/design не блокируются целиком. Исторический full-CI race/STOP не закрыт этим планом. |

B01 — delivery gate, а не повторная разработка accepted repairs. Если child source change необходим, child PR и root adoption — разные repositories; root выбирает reviewed available commit. Совместимая пара и необходимая package closure поставляются вместе, без промежуточно несовместимого selection. Product repository не получает push автоматически.

## Ближайшие реализационные PR

Один PR содержит один самостоятельно принимаемый или отклоняемый результат: код, его tests, нужную документацию и совместимую source/package closure. Внутренние red/green/review шаги — небольшие рабочие действия, не отдельные PR на каждый файл. Ни одна строка ниже сама не разрешает installation, campaign, agent experiment, product или host action.

Exact файлы/API/commands берутся из принятого дочернего implementation plan. Обозначенные ниже MCP paths — планируемая работа, не утверждение, что эти файлы есть в публичном checkout. Для невыбранных будущих функций не выдумываем заранее schema и filenames.

Все M20–M70 наследуют принятый **Q1-R/Card1 acceptance** как prerequisite исполнения Card2, в дополнение к зависимостям таблицы. Read/design подготовки G02, source-delivery reconciliation и admission могут идти независимо параллельно; это не разрешение начать следующую MCP-реализацию до предыдущего global gate.

| ID / lineage | Результат одного PR и owning scope | Зависимость | Focused controls и польза следующему consumer |
| --- | --- | --- | --- |
| Q1 — Card1; W1/W3/W4, P1/P2/P5 | Принятая prose-рецептура, frozen synthetic packets/rubric в существующем eval-контуре. Без clause schema или нового PASS engine | G01; delivery необходимых designs | Actor dispatch не содержит key/ответа; evidence closure полна; **5 targets / 5 checks / 7 decision items** различаются; first artifacts immutable. Actor получает пригодный exercise, ещё не quality qualification. |
| M20 — Card2.0; W2/W7, P1/P6, I04 | Только одобренный successor source/package binding и затронутые compatibility fixtures/expectations | G02, B01 для выбранных зависимостей | Правильная пара проходит; старый/подменённый manifest/workflow/package/pin и substitute hash отвергаются. Frozen Task2 record сохранён. Получаем честный current-source prerequisite, не runnable MCP. |
| M31 — Card2/Task3 primitive; W2/W7, P1/P6 | Bounded fixed-command `packages/qa-agent-local/src/owner-cli.mjs` + focused tests; затронутая package closure | M20, разрешённые working prerequisites, affected G06 gate | Actual healthy local owner read; streaming overflow, incomplete/multiple JSON, timeout/cancel/drift и wrong binding не становятся empty success. Fixed argv/cwd/env/local runtime; zero product/state writes. Parity consumer получает bridge, не generic shell. |
| M32 — Card2/Task3 parity; W2/W7, P1/P6 | `src/owner-read.mjs` + tests: validated public DTO и actual pinned registration/report/ordinary/continuation parity | M31 принят | Deep comparison с owning readers; wrong product/run, missing bytes, historical vs unsupported runtime, null/sealing-pending, metadata/order/duplicates и distinct serializer vectors. Private inventory не выходит. Следующий слой получает полные owner facts. |
| M40 — Card2/Task4; W2/W7, P1/P6 | Real-owner composite capture → существующий pure read view; `owner-read` integration/tests | M32 | Reconstruction всех применимых **47 selectors**; availability/null/order/full scope. Root/publication/report/run/captureTime drift invalidates snapshot/cursor; transient facade timestamp — нет. Не обещаем глобальную filesystem transaction. |
| M50 — Card2/Task5; W2/W7, P1/P6 | Реальный read-only stdio `src/mcp.mjs`, tests/raw-JSONRPC fixtures и package identity closure | M40; reviewed SDK/current prerequisites | Actual pinned SDK discovery/calls и обе поддержанные protocol eras; complete final-wire frame ≤1MiB, включая обе формы/envelope/metadata/delimiter; paging, Unicode, atomic too-large, EOF/cancel/errors; no writer/no writes. Закрывает local **2.2**, не host. |
| M60 — Card2/Task6; W2/W7, P1/P6 | Internal inert observation admission/preparation и tests в existing MCP/owner CLI; **zero dispatch** в этом срезе | M50; exact design split согласован | Disabled workspace/extra keys/wrong ID/whole-stdin >65,536 bytes отвергаются; actual owner canonical NFC/LF/digest parity. Не публикуем обнаруживаемый «working writer», который ещё не умеет readback. |
| M70 — Card2/Task7; W2/W7, P1/P6 | Один actual existing-owner write → independent same-ID readback → compare; read-only unknown-effect reconciliation | M60; approved affected G06 gate; отдельный synthetic-write admission | Healthy/partial, duplicate/conflict, stale binding, lost response after persistence, artifact-/manifest-only, timeout/cancel/drift/concurrency. Одна dispatch; no blind replay/new ID. Text/JSON remains caller-authored/unattested. Закрывает local **2.3**, не product/host. |
| H30 — Card3; W5/W7, P5/P6 | Минимальный task-facing index/recipe для принятой MCP-поверхности в существующем skills-контуре | M50/M70 | Task→owner/tool→inputs/effects/result/status и reference closure проверены. Source/supported/experimental/installed различаются. Не skill на каждый script; это discovery readiness, не installed-host proof. |
| R50 — Card5; W1/W3, P1/P2/P5, I07 | Один assertion/reader/recipe repair **только при** показанном owning gap в V40 | V40 trace + exact Astra design | Исходный counterexample различается; healthy/incomplete соседи сохранены; affected regressions и отдельный новый consumer. Нет gap — **NO-NEW-CODE**, PR ради числа не создаётся. I07a Task4/5 не возобновляется. |
| D15 — Card15; W7, P0/P6, I04/I10 | Переносимая поставка принятой source/package/skill-reference closure с doctor/prerequisites; только нужный delivery scope | Принятые MCP + первый actual-host путь | Cold restore, missing/wrong/dirty source/reference, no historical donors, upgrade/rollback без миграции frozen campaigns. Это source portability; второй host имеет свой acceptance gate. |

M50 не дробим на «server сейчас, wire limits/lifecycle потом»: наружный transport должен закрывать весь bounded contract одним принимаемым PR. Для M60 нужен узкий design amendment, если принятый detailed plan регистрирует dispatch-capable writer уже в Task6; данный индекс не придумывает временный API/error. Новые runtime files входят в package expectation в том же PR, не после запуска.

### Отдельные проверочные итерации

Проверка не требует нового кода ради PR. Если нужен public qualification record, он получает отдельный разрешённый documentation PR; raw/private evidence и host config не публикуются автоматически. Artifact locator, exact identity и ограничения сохраняются для reviewer.

| ID | Проверяемый результат | Gate и что им не закрывается |
| --- | --- | --- |
| Q1-R — Card1 | Один prospective combined actor run, frozen first design/report; fresh reader сначала только по locator, frozen reconstruction до packet/key; independent AQA | Q1 + execution admission. Все пять controls и aggregate completeness отдельно; reader recovery не исправляет actor omission. Supplied-evidence reasoning, не live QA и не universal reliability. |
| H31 — Card3/Task8 | Actual Codex setup/new-chat consumer без tool/skill/path подсказок: discovery→full context/scope→synthetic record→persisted readback→remainder; второй fresh reader через MCP | M70/H30 + отдельное host/setup разрешение. CLI/config/list-tools не заменяют actual host calls. Claude отдельно. |
| V40 — Card4 | Один полезный новый agent-led QA case: normative oracle/admission, самостоятельный first design, raw evidence, весь known scope/remainder и independent reader/AQA | Q1-R + MCP + H31 + product admission. Product FAIL может быть хорошим QA; unpaired case не доказывает causal gain. Отсутствующий oracle/effect authority блокирует этот case, не все local tasks. |
| P40 — Card4/16; W6/W7 | Conditional один-vs-два host-native executor comparison после полезного single-agent vertical | V40 + отдельный preregistered design: disjoint read-only contexts, один publishing owner, равные facts/settings/общий budget, quality/time/cost thresholds. Failed prerequisites не completion; **NO-ADOPT** допустим. Без нового controller/status DB. |
| D15-H — Card15 | Fresh cold consumer на каждом заявленном host/OS | D15 + selective installation/setup authority. Нужен полезный полный цикл; Codex≠Claude, один OS не закрывает другой. |
| T16 — Card16; W0–W7/P0–P6, I10 | Independent declared-scope transfer с заранее frozen support matrix, first raw artifacts, false-acceptance/quality/time/cost controls | Все применимые obligations. Full scope, **mixed-ticket**, реальный human help→reply→resume, learned regression/lesson consumer и actual-host transfer имеют собственное evidence, если входят в milestone. Один GET, mock или synthetic exercise не закрывает их; matrix после результата не сужается. Незаявленные обязательные global exits остаются открытыми. |

## Условные ветви Cards6–14

Для каждой ветви действуют три небольшие итерации: **Cxx-D — gap/admission + exact Astra/AQA design; Cxx-I — один implementation PR, если нужен; Cxx-R — отдельный consumer result**. Cxx-D не разрешает код сам по себе. Cxx-I отсутствует при достаточном existing path; Cxx-R остаётся необходим для нового quality claim. Пока demand/design не выбраны, это backlog, не готовые execution cards.

| Card / lineage | Один возможный owning gap | Различающий контроль и consumer exit |
| --- | --- | --- |
| 6 — W4/W7, P4/P6, I05/I09 | Один accepted-graph query path, не новая graph DB | Wrong direction/product/unreviewed edge/cycle/truncation; full denominator отдельно. Новый dependency-consuming result или честный zero gain; mapping≠execution. |
| 7 — W4/W3, P2/P4 | Одно обоснованное owning impact/dialect extension | Renamed/deleted/unmapped/shared source/wrong baseline; conservative risk floor, UNCOMPUTED≠0; actual deployed SHA отдельно. Compatibility и incremental benefit. |
| 8 — W1/W3/W5, P1/P2/P5 | Один outcome/evidence gap: reload, delayed/no-op, visual или intermediate state | Healthy/broken/stale/incomplete/wrong-region controls. Mutation sensitivity≠real defect yield; не все modalities одновременно. |
| 9 — W5/W6/W7, P3/P5/P6, I06/I06a | Одна требуемая существующая account/mail/data/integration/native/NFR capability route | Identity/role/environment/expiry/working read/disposition; unknown create/delete не retry. Provider/account/device/payment actions отдельно admitted; не универсальный account manager. |
| 10 — W2/W4/W6, P1/P3/P4/P5, I08/I09 | Один missing owner query/recipe/recovery seam | A-done/B-unknown/C-pending, version/drift/history/duplicate/conflict. Deferred reason/owner/trigger/expiry и remaining-only resume; actual human reply и process/host restart отдельно. |
| 11 — W3/W4/W6, P2/P3/P4 | Один confirmed bug→reviewed assertion/fixture/clause/dependency lesson | Original FAIL сохранён; conflict/supersede/rollback/quarantine; новый applicable consumer показывает decision benefit, не просто наличие записи. Obsidian может быть derived view, не owner. |
| 12 — W3/W5, P2/P5 | Один same-intent locator/binding repair после показанного gap | Target/oracle/role/data/postcondition не ослаблены; ambiguous target refusal; broken всё ещё найден. **NO-NEW-CODE** допустим. |
| 13 — W4/W7, P4/P6 | Один derived retrieval/index pilot лишь после discovery gap | Exact lexical/graph baseline; RU/EN, stale/revoked/conflicting/absent/isolation/rebuild, cost/quality. DocIR — candidate, не новый normative source; no automatic RAG fallback, **NO-ADOPT** допустим. |
| 14 — W3/W4/W7, P2/P4/P6 | Одна demanded integration/recipe существующего preview | Actual candidate SHA, allowed fixtures/effects, unmapped floor и stale/shared-production refusal; не deployment platform. |

W8/Jev/Laya/router — отдельные кандидаты после quality/cost baseline и проверки текущего доступа. Browser executor и model decision/router сравниваются отдельно, не обязательный routing rewrite. W9/P7 cloud — отдельная операционная программа с authority/worker identity/mounts/cancel/restart/late-help/unknown-delivery gates; Dots может быть host entry, но не замена MCP/API/cloud qualification.

## Рабочая карточка каждой итерации

Перед кодом reviewer должен видеть заполненную карточку, а не обещание «протестировать всё»:

1. ID и Card/W/P lineage; один результат, следующий consumer и конкретная измеримая польза.
2. Repository/remote, base/head SHA, owner, runtime pair, dependency PRs и accepted exact design.
3. Exact files/interfaces, non-goals, normative oracle, inputs/fixtures, allowed effects, evidence destination, budget/stop rule.
4. Healthy/broken/incomplete controls, focused commands, affected regressions и ожидаемые различающиеся исходы.
5. Freeze first RED/attempt/raw artifacts; как independent reader проверит их без key/help leakage.
6. Self-review и independent exact-byte AQA; что остаётся source/runtime/host/agent/product unqualified.

Новое test count, graph coverage, persisted observation или успешный CI не заменяет следующий consumer. Для pure helper достаточно различающих local controls; materially changed agent behavior требует first-use consumer. Scored cases, accepted T7 и rejected micro-candidates не повторяем ради нового зачёта.

## Delivery одного implementation PR

Выполняем этот короткий цикл для каждого разрешённого среза. Команды работают в его точном repository; `origin` сначала проверяется и не предполагается GitHub.

- [ ] **Preflight:** `git status --short --branch`, `git remote -v`, `git rev-parse HEAD`; проверить actual base remote SHA и source-dependent `npm run sources:verify`. Не менять чужие dirty files, state или frozen campaigns. Если source не требуется, не запускать child runtime ради документа.
- [ ] **Branch:** отдельная `codex/<iteration-id>-<short-name>` от проверенной delivery base. Использовать существующую пригодную isolated copy либо scoped новую; не ambient historical cwd. Не cherry-pick whole development ancestry.
- [ ] **RED:** сначала focused counterexample/control, сохранить первый исход; затем минимальный код Sol и соответствующие tests/docs. Не повторять experiment до PASS и не менять oracle ради GREEN.
- [ ] **GREEN:** exact focused tests + affected regressions; для source adoption cold closure/compatible pair. Child blanket `npm test` не запускать без выбранного scope: он может делать product/browser work. Установки не следуют из отсутствующей зависимости.
- [ ] **Self-review:** `git diff --check`, полный diff, tests sensitivity, failure/unknown/retry paths, source/reference/package closure, no unrelated/private payload, соответствие карточке. Self-review — отдельная запись, не independent AQA.
- [ ] **Independent AQA:** exact final bytes и first attempts; Critical/Important/Minor разобраны. Для нового дизайна независимый reviewer не его автор. При изменениях после GO review identity и затронутые tests обновляются; старое GO не переносится автоматически.
- [ ] **Integration/conflicts:** fetch точной base; сохранить base/head SHA. В isolated workspace проверить merge result, например `git merge-tree --write-tree <base-sha> <head-sha>`, и релевантные checks на этом дереве. Unsupported Git command — выбрать эквивалентную isolated integration check, не назвать её выполненной. Same-file/dependency changes интегрировать в этой ветке и recheck, не force-push/переписывать чужую историю.
- [ ] **Commit/push:** stage только объявленные files, commit; `git push -u <verified-remote> <branch>`. Не push default, все branches/tags или отложенные histories. Remote readback должен совпасть с exact commit SHA; unknown push outcome сначала сверить.
- [ ] **PR:** `gh pr create --base <actual-base> --head <branch> --title ... --body-file ...`; body содержит ID, outcome, dependencies, scope/non-goals, controls/first attempts, self-review/AQA, точные limits и residuals. При unknown create outcome найти уже созданный PR до retry. Attach созданный PR к текущей Codex task штатным инструментом.
- [ ] **Readback:** проверить actual PR head/base/diff/changed-files, mergeability и CI. `UNKNOWN`/pending ≠ no conflicts/GREEN. После изменения base повторить conflict/integration checks. Новый required RED устраняется в срезе; existing residual RED явно сохраняется, не замалчивается и не становится new readiness.
- [ ] **Checkpoint:** PR URL/commit/base/checks/AQA/result, unqualified scope и следующий gate. Не авто-merge. Зависимый срез ждёт интеграции предыдущего, если отдельно не принят explicit stacked PR с правильной base; независимый согласованный срез может продолжаться.

Для документационного B00 проверки — link/reference closure, no-loss review, `git diff --check`, root packaging tests и isolated integration/PR readback. Новых runtime claims нет. Push/PR — delivery, не merge, installation или product acceptance. Не обещаем отсутствие будущих конфликтов: фиксируем состояние для конкретной пары base/head и перепроверяем его при изменении.

## Что считаем завершением

Итерация закрыта только в своей границе после проверок, review и доставки. Card закрывается после всех её обязательных implementation **и** acceptance exits; PR count не является готовностью. Global quality требует объявленного scope и независимого переноса, а не универсального PASS из одного удачного case.

Узкий declared-scope milestone не закрывает весь W/P-план. Чтобы объявить **весь pre-cloud глобальный план** завершённым, все остающиеся обязательные full/mixed-ticket/help/lesson/host exits должны получить собственные evidence. Исключённый из узкого milestone exit остаётся открытым: его нельзя отменить выбором меньшей support matrix или public-web qualification. Product acceptance и owner risk/deployment решения отдельно.

Если blocked только один route, продолжаем независимую разрешённую работу. Если для следующего действия нужна новая authority/design/host/product decision, фиксируем точный blocker и не подменяем его обходом. Цель и ранее отложенные срезы возобновляются отдельно, не в результате публикации этого плана.
