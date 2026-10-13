> Historical accepted 12 October reference. Current bounded integration restores only the missing Console entry on selected Kernel6d (existing recommendation API unchanged); old pins, commands/results and delivery instructions below are historical, not fresh authority. Current controls and source status are recorded in the existing current entry after scoped review.

# Сценарий → инвариант → дополнительная проверка: дизайн первого среза

Дата: 12 октября 2026, Asia/Makassar. Дизайн подготовлен actual Astra и сверён ведущим агентом. Пользователь принял дизайн и план и поручил реализацию actual Sol 6.1 с независимым ревью actual Astra. Реализация начата в отдельном normal clone от проверенного public develop; этот документ фиксирует принятый контракт, а не результат проверок.

Это детализация существующих K01/K02/L02 и §17 [единого глобального плана](../plans/2026-10-05-universal-qa-product-plan.md), а не новая очередь. [План реализации](../plans/2026-10-12-journey-invariant-check.md) описывает один законченный срез. Документы не закрывают K01/K02/L02/F07 или V01.

## Цель и выбранная граница

Свежий агент получает известное изменение journey, читает сохранённый reviewed `journey -> requires -> invariant`, находит связанный содержательный check и добавляет его в рассмотрение, затем выполняет через прежний owning path. Инструмент механически восстанавливает обоснование выбора; агент проверяет нормативный источник, применимость и достаточность assertions. Рекомендация не даёт права исключать остальной scope и не означает execution/PASS.

Выбранное решение: один новый read-only Kernel API, чистый DTO рекомендаций, один отдельный Console CLI, discoverable ссылка в существующем исходном qa-product-v0 recipe. Без изменений campaign/draft/request schema, owner UI, runner, graph admission, lifecycle и managed файлов. DTO печатается в stdout; не вводится новый persistent store или вид owning evidence. Такой путь даёт рабочий consumer, а не только ручную инструкцию, и сохраняет независимость от Q05/UI.

Отвергнуты для первого slice: подключение UI computeImpact (потерян provenance, используется другая admitted семантика), общий code-delta impact с affects/implements (не admitted registration), изменение CampaignPlanV1 (не фактический Console execution план), автоматический narrow plan (ложное исключение неизвестного scope), RAG/graph DB/второй runner.

## Проверенная source basis и ограничения

Canonical development checkout: root `b1f727b47b572e770e8851f78d2d20c68e3cbeec`, Kernel `794e9fbae372ebf1fe8261556ec1ea0a4bceab26`, Console `0c92a44879a4a0e95ede64594205b95bb5f10125`; clean при чтении. Manifest выбирает другой pair, поэтому canonical children не объявляются актуальной delivered сборкой.

Дополнительное чтение изолированной работы Q05 другого Codex: root `369f5383916b2b9d06e353a97f835b0e81c77074`, Kernel `09300746bd7857e7a5973bd9d81065b746eb72d8`, Console `1dd3d80721a57c8aa2b3166a667c4a6088200dda`; clean на момент снимка. Это движущаяся недоставленная source basis для дизайна, не ветка реализации данного slice. Перед реализацией выбрать новый изолированный checkout от фактически проверенного public develop, сверить актуальные contracts и sources:verify. Не чинить shared children и не переносить frozen owner.

Ключевые байты на дополнительной basis (SHA256):
- Kernel product-graph.ts: a990e5de886b4e80be544638aef4951d2b4b85a0d518c4a21177291d78216b15
- Kernel knowledge-revision.ts: 6bb67ddad837fbd4d234a76132f76f040f450c396781e2095f5aaba2699c5b5e
- Kernel workspace-validator.ts: 1c62896f6340ea7dd49437bb8e84aaaf7369ca9ce8b9fd67dccea2483f6a130b
- Kernel agent-tool-observation.ts: 30a1b30aca3b28dbc01d32ba73db925757ce2ff200e02c49dbf3ef3e61c5c861
- Console qa-campaign-v0.ts: 320f6cd63ac2061115074412f54a7b1bda25bf34842a4efed9ca6d7ebf34ee9d
- Console qa-campaign-files.ts: cfb3cbb64a4a74d867bb44ffdb9c22cf861f314b198f643467a0acadfd733310

AGENTS, architecture, current checkpoint и global plan K01/K02/L02/§17 прочитаны. Current checkpoint является датированной проекцией и отстаёт от параллельных изменений; не использовать его вместо фактического git/source readback. Hidden evaluator/ground truth не читались. A5 developer-safe report не доказывает graph usefulness: native 12/12 ENV_BLOCKED.

## Existing seams, проверенные в коде

Kernel `src/kernel/workspace-validator.ts:inspectRegistrationWorkspace` возвращает `ValidatedWorkspaceSnapshot`: receipt, root binding, versionedFiles, privateStateFiles. Он внутренний экспорт функции, но не публичный export `src/index.ts`. `src/kernel/workspace-blueprint.ts:assertWorkspaceRegistrationPublicationAuthority` разбирает `.qa-private/registration-publication.json`; compilation содержит graph/catalog/coverage/strategy. Модель чтения authority есть в `agent-tool-observation.ts:currentAuthority` и before/final сравнении `sameAuthoritySnapshot`. Нельзя выдавать приватный snapshot вызывающему Console.

Console `readCampaignWorkspace` читает три публичных файла и не выдаёт publication authority; он недостаточен для trusted recommendation capture сам по себе. `prepareCampaignDraft` перечисляет coverage targets/catalog IDs без зависимостей. Фактический runner принимает `QaCampaignPlanV0Schema`; `validateCampaignStructure` удерживает каждый graph target как executable или blocked. Новый DTO не заменяет ни одну из этих проверок.

## Точный предлагаемый API

Новые файлы Kernel:
- `src/contracts/journey-check-recommendations.ts`: строгие input/output schemas и типы DTO; собственный semanticDigest через existing digestCanonical.
- `src/kernel/journey-check-recommendations.ts`: pure calculation внутри модуля + public guarded read.
- `tests/kernel/journey-check-recommendations.test.ts`.
- `src/index.ts`: явный export read API и типов/schema; никаких изменений общего graph contract.

Точные имена публичных runtime schemas: `ReadJourneyCheckRecommendationsInputSchema` и `JourneyCheckRecommendationsV1Schema`. Типы `ReadJourneyCheckRecommendationsInput` и `JourneyCheckRecommendationsV1` соответствуют им. Digest DTO считается existing `digestCanonical` по полному DTO без собственного поля `semanticDigest`; вложенные опубликованные digests сохраняются. Schema требует совпадения этого digest и внутреннего exact set accounting из алгоритма ниже. Соответствие полного denominator настоящей публикации обеспечивает guarded API; одна schema не подтверждает полноту внешнего источника.

```ts
export interface ReadJourneyCheckRecommendationsInput {
  readonly workspacePath: string; // absolute canonical directory
  readonly expectedPublicationDigest: Digest;
  readonly journeyId: StableId; // exactly one seed in v1
  readonly change: {
    readonly summary: string;
    readonly basis: readonly {
      readonly sourceId: string;
      readonly contentDigest: Digest;
      readonly locator: string;
      readonly statement: string;
    }[]; // nonempty, caller declared, never fetched by this API
    readonly role: string | null;
    readonly state: string | null;
    readonly environment: string | null;
    readonly candidate: string | null;
  };
}
export async function readJourneyCheckRecommendations(
  input: ReadJourneyCheckRecommendationsInput,
  dependencies?: WorkspaceKernelDependencies,
): Promise<JourneyCheckRecommendationsV1>;
```

Никакой optional latest/publication fallback. Existing `qa-starter validate` выдаёт publicationAuthorityDigest для явного выбора (это локальная authority, не доказательство live candidate). Все input objects strict; непустые строки; одна seed; no getters/prototypes beyond обычный parsed JSON в CLI. API валидирует input до filesystem work и не fetch-ит caller source refs. `change` копируется с `provenance: caller_declared`; это исходное основание агента, не свидетельство, проверенное Kernel.

DTO точно содержит:

```ts
interface JourneyCheckRecommendationsV1 {
  schemaVersion: 'journey-check-recommendations.v1';
  authority: 'advisory_only';
  basis: {
    publicationDigest: Digest;
    profileDigest: Digest;
    graphDigest: Digest;
    catalogDigest: Digest;
    coverageDigest: Digest;
    graphStatus: 'draft' | 'approved';
  };
  seed: { journeyId: StableId; change: ReadJourneyCheckRecommendationsInput['change'];
    provenance: 'caller_declared'; };
  scope: {
    allCoverageTargetIds: readonly StableId[];
    allCatalogCheckIds: readonly StableId[];
    consideredTargetIds: readonly StableId[];
    otherTargetIds: readonly StableId[];
    otherCheckIds: readonly StableId[];
    narrowingAllowed: false;
  };
  recommendations: readonly {
    journeyId: StableId;
    invariantId: StableId;
    requiresEdgeId: StableId;
    verifiesEdgeId: StableId;
    checkId: StableId;
    catalogEntryId: StableId;
    // Exact raw published objects, parsed through existing schemas:
    journey: GraphNode;
    requirement: GraphEdge;
    invariant: GraphNode;
    verification: GraphEdge;
    catalogEntry: TestCatalogV1['entries'][number];
    coverageItem: CoverageRegistryV1['items'][number];
    path: readonly [StableId, StableId, StableId]; // J, I, C
    traversal: 'requires_forward_then_verifies_reverse';
    applicability: 'unassessed';
    execution: 'not_started_by_this_operation';
  }[];
  gaps: readonly {
    code: 'seed_not_found' | 'seed_not_journey' | 'no_requires_mapping'
      | 'no_verifying_check' | 'verification_not_reviewed'
      | 'oracle_unresolved' | 'manual_check'
      | 'applicability_unassessed' | 'change_context_unknown';
    targetId: StableId | null;
    checkId: StableId | null;
    sourceIds: readonly string[];
    reason: string;
  }[];
  semanticDigest: Digest;
}
```

Использовать указанные indexed types существующих TestCatalogV1/CoverageRegistryV1, без копии contracts. Для runtime schema переиспользовать соответствующие element schemas через existing object/array schemas; CoverageItemSchema сейчас module-private, отдельный public export для него не нужен. Строгий output schema фиксирует перечисленные поля; никакого endpoint/public verdict поля `readyToRun`, `safe`, `unaffected`, `passed`.

Заведомо нет необходимости включать whole graph/private publication/source file bytes в stdout: возвращаются только exact участвующие опубликованные nodes/edges/catalog/coverage + полный ID denominator. Provenance сохранён из исходных объектов, не пересказан как установленная истина. Пользовательские refs и опубликованные refs раздельны.

## Алгоритм и проверка результата

1. Захватить initial registration snapshot через существующий inspectRegistrationWorkspace. Требовать valid registration receipt; разобрать captured authority bytes существующим parser; проверить receipt.publicationAuthorityDigest == authority.semanticDigest == expectedPublicationDigest. Никакого чтения managed model вне snapshot.
2. Весь расчёт идёт по authority.compilation; existing publication validation гарантирует graph/catalog/coverage consistency и registration dialect. Не меняются типы target/check, publication status или oracle.
3. Если seed отсутствует или не journey/subkind journey/coverageTarget true: DTO с соответствующим gap, без рекомендаций, весь scope остаётся. Это семантически неподдерживаемый запрос, не global authority refusal.
4. Только outgoing reviewed `requires` от seed к invariant. Один hop, никаких reverse requires, affects, implements, общих closure или siblings. Если отношений нет, no_requires_mapping. Поле path J,I,C поясняется исходными directed edges J->I и C->I; reverse здесь только поиск checks для target, не causal edge.
5. Для каждого invariant сначала учесть все catalog entries с этим target и добавить oracle_unresolved gaps для unresolved entries, даже когда unresolved automated entry закономерно не имеет graph check node/verifies. Затем найти `verifies` от check к invariant и exact catalog entry этого check с targetIds, содержащим invariant. Отсутствие/несогласованность catalog/coverage при valid authority — ошибка invalid authority, а не беззвучный skip. Никаких похожих имён/поиска по словам.
6. Для reviewed verifies + resolved oracle вернуть recommendation. Она ВСЕГДА applicability unassessed и не runnable approval. Manual check тоже возвращается как рекомендация с manual_check gap; не переводится автоматически человеку, агент использует лишь поддерживаемую capability lane. Для unreviewed verifies или unresolved oracle возвращается gap и check остаётся в otherCheckIds; не выдавать его как содержательно пригодную проверку. Independent пригодные рекомендации продолжаются.
7. consideredTargetIds = seed (если валиден) и все найденные invariants, даже если check отсутствует. otherTargetIds — exact set difference всего coverage scope. otherCheckIds — exact set difference всего catalog и recommended IDs. Категории scope — очередность рассмотрения, не statuses и не списание denominator. Сохранить один applicability_unassessed gap на recommendation и change_context_unknown для каждого отсутствующего role/state/environment/candidate, с явным именем поля в reason.
8. Дедупликация recommendation по (requiresEdgeId, verifiesEdgeId, checkId); retain разные основания, не схлопывать разные paths только по checkId. Все collections сортируются existing binary/canonical order. Output deterministic для same published inputs и caller seed; timestamp не нужен.
9. Сначала получить initial authority; при initial refusal выйти без DTO и без сравнения с несуществующим initial. Только после успешного initial запустить guarded body с mandatory finally final authority capture; сравнить canonical receipt, root binding и publication digest с initial. Не выпускать output при changed/unavailable authority, включая body failure. PATH_RACE/changed имеет приоритет над semantic output. Не вводить cache/lock/очередь и не экспортировать private state.

Это намеренно опирается на существующий безопасный read pattern без рефакторинга agent-tool-observation. Небольшой локальный wrapper capture текущей publication допустим; shared helper extraction за пределами slice. Если исходный inspector отказывает из-за active writer, refusal остаётся, без retry/background read.

Лимиты: canonical serialized input API не более 1MiB UTF-8 bytes (CLI также existing readCallerJson 1MiB с fatal UTF-8 decoding). Полный canonical output DTO вместе с CLI envelope не более 8MiB UTF-8 bytes; Kernel резервирует 1KiB для фиксированного envelope, то есть DTO max 8MiB−1KiB; Console проверяет полный envelope до любого stdout. Это лимит нового конечного ответа, не увеличение existing caps. Без truncation и partial recommendations: превышение — JOURNEY_CHECK_RECOMMENDATIONS_LIMIT_EXCEEDED. Source graphs/registrations не урезаются; при превышении нужен отдельно спроектированный bounded read, не автоматический narrow denominator.

Ошибки нового API: JOURNEY_CHECK_RECOMMENDATIONS_INPUT_INVALID; JOURNEY_CHECK_RECOMMENDATIONS_AUTHORITY_INVALID; JOURNEY_CHECK_RECOMMENDATIONS_AUTHORITY_CHANGED; JOURNEY_CHECK_RECOMMENDATIONS_READ_UNAVAILABLE; JOURNEY_CHECK_RECOMMENDATIONS_LIMIT_EXCEEDED. Existing QaError используется с очищенным сообщением; private paths/content не в диагностике. Boundary tests фиксируют соответствие error class, без превращения всех semantic gaps в fatal failure.

## Console CLI и размещение output

Новый `components/console/scripts/qa-graph-recommendations.ts` принимает строго `--workspace ABS --input ABS`. Input JSON содержит expectedPublicationDigest/journeyId/change; workspacePath добавляется из argv, второй workspace ключ запрещён. Никаких --execute, --apply, --output-dir, --latest, --approve.

Запуск: `node --import tsx scripts/qa-graph-recommendations.ts --workspace /absolute/owner --input /absolute/caller-input.json` из Console с явно установленными QA_STARTER_REPO и QA_STARTER_EXPECTED_SHA. ReadCallerJson переиспользуется из qa-campaign-files с существующим 1MiB пределом. assertPinnedKernelRevision вызывается до/после импорта Kernel src/index.ts, до/после awaited API. Не вызывать loadPinnedKernelDistribution: он запускает build. Проверить наличие нового export; неподдерживаемый pinned runtime — явная ошибка, не fallback.

CLI stdout: один JSON envelope `{schemaVersion:'qa-graph-recommendations-cli.v1', ok:true, recommendations: DTO}`; exit 0 означает завершённое чтение, даже если recommendations пуст и gaps непусты. stderr/error envelope без DTO при глобальном отказе, exit 1; только sanitized code/message, без stack/private paths. Caller может направить stdout в свой частный файл вне managed workspace; сам CLI никаких файлов не пишет. API не очищает чужие paths и не устанавливает зависимости.

Сохранённый JSON — advisory derived artifact, не owner evidence/receipt. Для отчёта агент переносит exact publication/path/check IDs и проверенное собственное обоснование в существующие `Assessment.reasoning` и `limitations`; сохраняет missing context/remainder в прежних obligations. Existing checkpoint actor validation не меняется. При наличии supported observation lane можно сохранить пояснение в существующем agent-tool-observation payload как caller-authored/unattested; необязательно и не замена executed evidence. DTO целиком НЕ вкладывается в observation: current observation имеет 64KiB cap и attachments пусты. Новые artifact attachments/evidence types не добавляются.

Fresh consumer должен видеть опубликованный source/path, вывод об applicability, actual owner execution evidence и remainder. Если существующих reasoning/limitations недостаточно для конкретного consumer, scope остаётся pending и поднимается отдельный доказанный gap; нельзя скрыто расширять Q05 fields. Нынешний slice механически предлагает checks, агент всё ещё отвечает за grounded QA decision.

## Применимость, freshness и execution

Точная форма CLI-отказа: stdout пуст; stderr содержит один JSON `{schemaVersion:'qa-graph-recommendations-cli.v1', ok:false, error:{code,message}}`, exit 1. Code нового API сохраняется; неправильные argv/input получают `JOURNEY_CHECK_RECOMMENDATIONS_INPUT_INVALID`, остальные ошибки загрузки/чтения — `JOURNEY_CHECK_RECOMMENDATIONS_READ_UNAVAILABLE`. Message — фиксированное безопасное описание класса, без stack, source paths или private content.

Для существующего `readCallerJson` сохраняется его единая граница admission: любой отказ helper, включая oversized file, классифицируется CLI как INPUT_INVALID. Явное превышение canonical API input, DTO или полного envelope получает LIMIT_EXCEEDED. Предел полного API input включает добавленный workspacePath. Shared helper и filesystem guards не меняются ради более подробной ошибки. Этот точный вариант согласован с Astra.

Authority currentness — bytes настоящей локальной publication во время чтения. Это НЕ свежесть live deployment, документа, business rule, роли/состояния или разрешения. Nullable change context и каждое applicability unassessed сохраняют этот предел. Даже resolved oracle description не доказательство нормативности: агент читает независимый source, его revision, scope и достаточность assertion.

При source removed/changed scalar/type/business rule/conflict/unknown build агент не переносит старый вывод; re-derive/review через прежний owning knowledge publication. После публикации expectedPublicationDigest меняется и прежний DTO становится historical. Старый unchanged sibling не инвалидируется автоматически; его применимость проверяется отдельно. Никакой автоматической новой authority при тех же именах.

Уже опубликованный выбранный check агент добавляет в обычный CampaignV0 plan через существующий writer/validator без изменения catalog. Если самого пригодного check ещё нет, нужен отдельный author-checks/apply-authored-checks owning publication: это меняет identity и требует явного повторного чтения graph/catalog и перепривязки plan; старый DTO не остаётся current. Уже присутствующий check не дублируется. Рекомендация не является готовыми browser operations/API assertions, не меняет runnerId или secrets/effects. Existing runner/readback/remaining остаются последней границей. Все graph targets остаются executable или blocked в CampaignV0; otherCheckIds сохраняет также check-level remainder, который нельзя потерять в отчёте даже при удовлетворённом target-level closure.

## Controls, которые должны реально различать ошибку

Pure/contract:
- J->I с exact reviewed sources приводит к дополнительному invariant check; меняются edge/check IDs — меняется path, похожие имена не влияют.
- Повторное чтение одной valid authority и того же caller input даёт одинаковый DTO; неканоническая перестановка registration collections отклоняется. Новая publication не обязана иметь прежний digest/DTO. Разные причины одного check сохраняются.
- Unrelated journey не получает этот check; invariant seed и source_file seed дают seed_not_journey; sibling не достигается через invariant.
- Missing mapping/check, unreviewed verifies, unresolved oracle, manual lane, unknown role/build видны отдельными gaps. Одна проблемная ветка не скрывает независимую рекомендацию.
- Обе части denominator проверяются exact set accounting; ноль рекомендаций не даёт empty/closed scope.
- Caller statement/runtime observation/own written doc не меняют applicability unassessed и не выдают readiness/PASS.
- Existing publication graph admission по-прежнему отклоняет affects/implements; не расширять subtype ради теста.

Owning read:
- Fixture опубликована прежними knowledgeFixture/proposal + previewRegistrationPublication/applyRegistrationPublication, без hand-edit managed graph.
- Publication mismatch, stale initial source, publication/root swap во время расчёта, unavailable final read, corrupt registry/publication, active-writer refusal: нет partial DTO.
- Read-only гарантируется snapshot файлов до/после и отсутствием writes через injected dependencies; secrets/privateState не присутствуют в output.
- CLI wrong/dirty Kernel SHA, missing export, invalid args/input, symlink/caller path, stdout cleanliness и same-source API parity.

Полезный локальный consumer в составе ТОГО ЖЕ implementation/self-review/AQA slice, до единого code AQA и delivery: grounded change J, независимая нормативная I, fresh agent discovers additional C через команду; healthy C passes; meaningful broken neighbor reaches failing assertion; unrelated change не приписывается этому path; stale/unmapped остаются unknown. Агент реально выполняет existing owner lane, читает receipt/assertions, сохраняет report/remainder; fresh reader восстанавливает их без старого диалога. ENV_BLOCKED/timeout/infrastructure failure не засчитывается как обнаружение broken продукта. Контроль без dependency сохраняет отсутствие дополнительной механической рекомендации; если агент и так выбрал C, описать фактический предел uplift, не изображать причинность.

Source tests — qualification API/guards, не product usefulness. Этот consumer даёт bounded K01/K02 progression. L02 требует именно confirmed defect/miss -> owning regression publication -> последующее изменение -> фактическое исполнение дополнительной regression; F07 требует связанного E04 -> L02. Ни одна карточка не закрывается данным документом.

## Файлы, проверки, параллельная работа

Console новые: `scripts/qa-graph-recommendations.ts`, `tests/unit/qa-graph-recommendations-cli.test.ts`. Документация: новый source reference `skills/qa-product-v0/references/journey-check-recommendations.md`, короткая discoverable ссылка из canonical source `skills/qa-product-v0/SKILL.md`; перед изменением source mirrors прочесть skills/README и поставить ссылку в фактически доставляемый mirror по его правилам. Installed skills не менять. Никаких изменений selected-agent-request.ts, owner/projection.ts, OwnerAgentRequestReport.tsx, Claude primary-ui, Q05 tests, E1/E8, Freeland.

Плану нужно включить минимальную literal CI mapping для новых Kernel/Console test paths в существующие tools/ci-impact.mjs и owning CI argv, если это требует актуальная base. Не менять policy/limits/jobs и не брать старые generic npm test: Console default запускает Playwright. Согласовать эти общие файлы отдельным integration slot после actual-base refresh; source work можно делать независимо в isolation.

Проверенные package scripts позволяют будущие команды (сейчас НЕ запускались):
- Kernel cwd: `node node_modules/vitest/vitest.mjs run tests/kernel/journey-check-recommendations.test.ts`
- Kernel cwd: `npm run typecheck`; `npm run build` после affected tests.
- Console cwd: `node --import tsx --test tests/unit/qa-graph-recommendations-cli.test.ts`
- Console cwd: `node node_modules/typescript/bin/tsc --noEmit --incremental false` для проверки без tracked tsbuildinfo mutation.
- Root isolated cwd: `npm run sources:verify` перед работой с собранными компонентами и после принятого source packaging; наличие новых paths проверяется owning CI classifier controls.

Реализация actual Sol6.1 после принятого design + plan; self-review, затем один author-distinct actual Astra AQA, тот же reviewer для исправлений. Common writes/merge сериализованы; не посылать сообщения другим chats без прямого пользовательского разрешения. Не запускать новые products/Freeland/benchmarks ради source evidence. Future product consumer имеет собственный owner/environment/authority и не использует QA Freeland campaign state.


## Дополнение: реальная native invariant fixture и guard по writes

Проверенная возможность без adapter/schema extension: registration-check-authoring.ts заменяет checks только у существующего applicable target; тип target не сужает эту возможность до web entry. Он создаёт automated_check с subkind существующего invariant. Поэтому создать J/I и reviewed requires через owning knowledge revision/publication (helper knowledgeFixture + proposal/rehashCompilation в тесте), затем добавить resolved automated check для уже существующего I через accepted authoring publication. author-checks НЕ создаёт target. Не hand-edit managed graph и не выдавать generated manual/unresolved invariant за готовый native test.

Контролируемый product-like fixture: свой локальный anonymous GET JSON `/summary`, без redirects/auth/external requests. Independent fixture requirement до чтения endpoint: `/summary/ready` должен быть boolean true. Healthy тело `{"summary":{"ready":true}}`, broken `{"summary":{"ready":false}}`; HTTP200 и JSON media type одинаковы. Journey check status200 проходит в обеих версиях. Дополнительный invariant check использует существующую форму `{kind:'json_pointer', path:'/summary/ready', value:true}` через настоящий PlaywrightCampaignAdapter API mode и native runner. Этот control различает бизнес-значение при живом endpoint, не просто доступность. Отсутствие ответа/refusal/timeout классифицируются existing environment/harness owning path и НЕ засчитываются как обнаруженный broken продукт. Это собственный синтетический fixture, не A5 finding и не real-product uplift. Browser binary/UI для этого slice не нужны. Unrelated journey имеет собственный invariant/check и не включается через обратный requires.
Origin/port/path фиксируются accepted existing local scope. Healthy и broken записываются как разные явно именованные версии fixture scenario с отдельными captured input snapshots и native run/receipt; менять продукт между ними незаметно и приписывать им одну проверенную candidate identity нельзя. Где existing route не аттестует build/data identity, этот предел остаётся declared/unknown, новый механизм binding не вводится. Никаких новых allowlist/cap/side effects. Все остальные targets явно accounted. Fresh reader получает saved checkpoint + exact native run/assertions/remainder без prefilled answer. Весь fixture является собственным integration consumer, не независимым продуктовым benchmark и не graph universal usefulness.

Inspect read effects checked: workspace-validator calls validateRegistrationMemberSnapshot; тот вызывает loadMember(..., true, false, true, false), оставляя default repairJobs=false. loadMember передаёт false в reconcileEventFences/validateRegistrationJobStore. В наблюдаемом пути repair не включён. Тем не менее отсутствие filesystem mutation — обязательный отрицательный integration control с fail-on-write dependencies; не объявлять автоматически любую будущую validator version чистой. Не использовать repairing store readers, cache materialization или loadPinnedKernelDistribution.

Новый Kernel export требует successor SHA; Console server/kernel-authority.mjs содержит встроенный PINNED_I1_KERNEL_REVISION, resolvePinnedKernelRevision отвергает env SHA, отличающийся от него. Поэтому plan включает штатное обновление Console embedded pin и owning pin controls при serial integration, после Kernel commit; QA_STARTER_EXPECTED_SHA не bypass. Root source manifests/bundles обновляются в обычной поставке. Heavy build и native API consumer выполняются в выделенном host slot, не параллельно Freeland QA и чужому browser CI.

## Уточнение Astra при начале реализации: допустимые fixture states

На restored public Kernel `1ba3555` initial document discovery с Journey и Invariant создаёт invariant с manual unresolved catalog entry и draft `verifies`. Owning knowledge revision может добавить reviewed `requires`, сохранив exact invariant node и catalog entry неизменными. Это допустимый fixture для `oracle_unresolved` и `verification_not_reviewed`, без ручного изменения managed graph. Для native consumer существующий entry заменяется через `buildRegistrationCheckRevision` с непустым `replaceEntryIds` и resolved automated check.

Automated unresolved invariant без graph check текущий compiler не создаёт; его добавление через knowledge revision отвергает existing changed-entry guard. Этот случай проверяется как admission refusal, а не искусственная успешная публикация. Защитный catalog scan в алгоритме сохраняется; graph admission и contracts не расширяются. SAME actual Astra подтвердил уточнение по `registration-compiler.ts`, `test-catalog.ts` и `knowledge-revision.ts` до реализации fixture.

## Уточнение Astra: канонический caller text

После strict проверки plain data и input schema API нормализует только caller `change` существующей канонической сериализацией в NFC, до вычисления recommendations и gaps. Канонически эквивалентный текст должен давать одинаковые DTO/digest и parsed CLI output; исходный объект caller не изменяется. Нормализация не делает caller declaration подтверждённым источником.

`workspacePath` остаётся под прежней проверкой и не преобразуется в другой filesystem path. Raw published objects остаются точными parsed clones captured publication; whole DTO не подвергается повторной нормализации. Existing publication writer уже сохраняет canonical bytes. Этот локальный boundary не меняет global canonicalJson или graph schema. Контроли проверяют NFD→NFC caller fields/sourceIds, unique/sort gaps, API/CLI parity, неизменность caller input и точность published provenance.
