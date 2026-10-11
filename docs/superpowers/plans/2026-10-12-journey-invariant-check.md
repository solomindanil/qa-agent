# Первый graph consumer: journey → invariant → дополнительная проверка — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Исполнитель — actual Sol 6.1; semantic design и один независимый AQA всего среза — actual Astra. Три задачи ниже являются частями одного среза, без отдельных review/PR на каждую.

**Goal:** Свежий агент читает опубликованную dependency journey→invariant, получает обоснованную дополнительную проверку и сохраняет полный остаток; локальный consumer демонстрирует реальное выполнение этой проверки.

**Architecture:** Новый read-only Kernel API читает guarded registration publication и вычисляет advisory DTO. Отдельный Console CLI и существующий source skill открывают этот API; исполнение, assertions, evidence, verdict и remaining остаются в прежнем owner path.

**Tech Stack:** Node >=22.12.0, TypeScript, Zod, Vitest; Console node:test/tsx и существующий PlaywrightCampaignAdapter. Новых зависимостей нет.

**Spec:** [Точный дизайн actual Astra](../specs/2026-10-12-journey-invariant-check-design.md). Конечное имя этого плана: `docs/superpowers/plans/2026-10-12-journey-invariant-check.md`.

## Global Constraints

- Пользователь принял дизайн и план и поручил реализацию. Команды и checkboxes ниже описывают необходимые действия; результаты фиксируются отдельно по фактическим запускам и не выводятся из наличия команды в плане.
- `authority: advisory_only`, `narrowingAllowed:false`, `applicability:unassessed`, `execution:not_started_by_this_operation` обязательны; DTO не execution/PASS/approval.
- Один seed journey; только reviewed outgoing requires и reverse lookup verifies. Без graph/draft/campaign/request schema growth, новых runner/store/lifecycle, UI изменений.
- Canonical input API ≤1MiB UTF-8; CLI input 1MiB через existing readCallerJson. Kernel DTO ≤8MiB−1KiB, финальный canonical JSON envelope ≤8MiB UTF-8. Превышение — JOURNEY_CHECK_RECOMMENDATIONS_LIMIT_EXCEEDED без truncation/partial DTO.
- Совпадение локальной publication не доказывает актуальность live deployment/business rule/role. Missing context и весь target/check denominator сохраняются.
- Начальная design basis: canonical root b1f727b с mismatched children; дополнительное чтение root369f538/Kernel09300746/Console1dd3d807. Это не будущий implementation base. Перед кодом выбрать новый isolated checkout от проверенного actual public develop, сверить manifest/children/source bytes и выполнить sources:verify; чужие checkouts не reset/restore.
- Q05 holds: Console src/lib/selected-agent-request.ts, src/lib/owner/projection.ts, src/primary-ui/components/OwnerAgentRequestReport.tsx и Q05 tests; Claude UI/donor work, frozen A5 f2311a2/9493648/0930074, Freeland owners/state и installed skills не изменяются.
- Shared CI files, carrier manifest/bundles, CURRENT и merge — только в serial integration slot текущего владельца. До actual implementation host slot нет builds/install/container/browser/product runs.
- Одна последовательность: accepted design+plan → Sol implementation+affected controls+bounded local consumer → self-review → ONE author-distinct Astra AQA → SAME affected repair review → один согласованный carrier PR/own CI/readback. Не создавать source-acceptance лестницу перед consumer.

## Review Focus

- Changed/unavailable final authority после успешного body или ошибки body: нет частичного success/DTO (Task1).
- Содержательно неподходящий источник/ручная lane/неизвестный контекст: gaps сохраняются, recommendation не становится разрешением (Task1).
- Нулевые recommendations и частично пригодные ветви: exact target/check remainder не исчезает (Task1).
- API есть в новом Kernel, Console закреплена на старом SHA: отказ, затем совместимая pin delivery, без env override (Task2/3).
- Broken fixture падает до assertion или fresh reader видит только selection: полезность не доказана; execution и остаток должны читаться из owning evidence (Task3).

## Task 1: Kernel — чистый расчёт и guarded read

**Files (от integration root):**
- Create `components/kernel/src/contracts/journey-check-recommendations.ts`.
- Create `components/kernel/src/kernel/journey-check-recommendations.ts`.
- Create `components/kernel/tests/kernel/journey-check-recommendations.test.ts`.
- Modify `components/kernel/src/index.ts` — explicit API/types/schema exports.
- Extend только fixture helper `components/kernel/tests/helpers/knowledge-revision.ts`, если общий coherent fixture нельзя удержать внутри нового теста.

**Interfaces:**
- Consumes `inspectRegistrationWorkspace(workspacePath, dependencies?)`, `assertWorkspaceRegistrationPublicationAuthority(input)`, `GraphNode`, `GraphEdge`, `TestCatalogV1['entries'][number]`, `CoverageRegistryV1['items'][number]`, `digestCanonical`.
- Produces `readJourneyCheckRecommendations(input: ReadJourneyCheckRecommendationsInput, dependencies?: WorkspaceKernelDependencies): Promise<JourneyCheckRecommendationsV1>` с точными полями из spec. Input = workspacePath + expectedPublicationDigest + journeyId + change(summary, nonempty basis[sourceId/contentDigest/locator/statement], nullable role/state/environment/candidate).
- Чистый selector остаётся внутри нового модуля; публичный второй arbitrary-graph API не добавлять. Strict schemas: `ReadJourneyCheckRecommendationsInputSchema`, `JourneyCheckRecommendationsV1Schema`. Coverage element проверяется через existing registry validation без копирования схемы.

- [ ] **RED:** построить coherent опубликованную V2 fixture через knowledgeFixture(), rehashCompilation(), buildRegistrationKnowledgeRevision(), previewRegistrationPublication(), applyRegistrationPublication(). Добавить J, I, check C и unrelated target/check; не писать managed graph напрямую. Устойчивые URN IDs и normative fixture source отличаются от caller change.
- [ ] В новом test файле закрепить: J→I→C; unrelated J не получает C; invalid/nonjourney seed; no_requires_mapping; no_verifying_check; draft verifies; unresolved oracle; manual check; null context fields; mixed healthy/gap ветви; exact raw provenance; repeat same valid publication/input deterministic; distinct path tuples не схлопываются; exact denominator union/difference; own-doc/runtime observation не даёт readiness. Invalid unsorted graph не используется как determinism fixture.

```ts
// Шаблон теста, не готовая программа: идентификаторы — поля новой test-only fixture.
// Fixture создаётся owning publication API выше.
const dto = await readJourneyCheckRecommendations(input, fixture.dependencies);
expect(dto.recommendations[0]).toMatchObject({
  path: [journeyId, invariantId, checkId],
  traversal: 'requires_forward_then_verifies_reverse',
  applicability: 'unassessed', execution: 'not_started_by_this_operation',
});
expect(dto.scope.narrowingAllowed).toBe(false);
expect(dto.scope.otherTargetIds).toContain(unrelatedTargetId);
expect(dto.scope.otherCheckIds).toContain(unrelatedCheckId);
expect(await readJourneyCheckRecommendations(input, fixture.dependencies)).toEqual(dto);
```

- [ ] Запустить RED из Kernel: `node node_modules/vitest/vitest.mjs run tests/kernel/journey-check-recommendations.test.ts`; сохранить FIRST. Отсутствующий export должен быть видимой причиной, не pass через mocked reader.
- [ ] Минимальный reader: strict/canonical-size input до FS; initial valid snapshot и parsed authority из captured private bytes; expected digest equality; при initial refusal нет DTO и сравнения с несуществующим initial. После successful initial вычисление строго authority.compilation; finally final capture; compare receipt/rootBinding/publication; canonical output и digest/DTO cap. Source refs не fetch-ить, private snapshots не экспортировать, no cache/lock/retry.

```text
validate exact input
initial := inspect + parsed current publication
require valid && receipt.digest == publication.digest == expectedPublicationDigest
try: result := pure selector(initial.compilation, caller seed/change)
finally: final := inspect + parsed publication; compare receipt/root/digest
validate exact advisory DTO; return without writes
```

- [ ] Boundary controls: stale expected digest; corrupt/invalid publication/registry; active-writer refusal; root/publication swap during read; unavailable final read; body error плюс changed final; initial refusal без uninitialized сравнения; unsafe workspace; input getters/unknown keys; input/DTO cap exact boundary и over-limit; injected writes counter=0; file bytes/identities before=after; secret/private-state marker absent from JSON. Refusal classes: INPUT_INVALID, AUTHORITY_INVALID, AUTHORITY_CHANGED, READ_UNAVAILABLE, LIMIT_EXCEEDED с префиксом JOURNEY_CHECK_RECOMMENDATIONS_; partial DTO отсутствует.
- [ ] GREEN и affected checks из Kernel:

```sh
node node_modules/vitest/vitest.mjs run tests/kernel/journey-check-recommendations.test.ts tests/contracts/five-contracts.test.ts tests/workspace/knowledge-revision.test.ts tests/registration/catalog.test.ts
npm run typecheck
npm run build
```

Это API/schema/guard evidence, не product usefulness. Переиспользовать неизменённые graph admission tests, не расширять registration dialect ради удобства fixture.

## Task 2: Отдельный Console CLI и discoverable source recipe

**Files:**
- Create `components/console/scripts/qa-graph-recommendations.ts`.
- Create `components/console/tests/unit/qa-graph-recommendations-cli.test.ts`.
- Create `components/console/skills/qa-product-v0/references/journey-check-recommendations.md` и identical `.claude/skills/qa-product-v0/references/journey-check-recommendations.md`.
- Modify `components/console/skills/qa-product-v0/SKILL.md` и identical `.claude/skills/qa-product-v0/SKILL.md` — одна discoverable reference ссылка.
- Modify `components/console/tests/unit/qa-product-skill.test.ts` — новая ссылка/complete mirror/source recipe controls.
- Совместимый Kernel pin successor `components/console/server/kernel-authority.mjs` и затронутые literal pin fixtures — локальная пара требуется уже для CLI controls, окончательная carrier-поставка завершается Task3.

**Interfaces:**
- Consumes Kernel readJourneyCheckRecommendations, existing `readCallerJson(file, 1024*1024)` и `assertPinnedKernelRevision(repo, expectedSha)`.
- Produces ровно command `node --import tsx scripts/qa-graph-recommendations.ts --workspace ABS --input ABS`; input JSON исключает workspacePath. Success envelope `{schemaVersion:'qa-graph-recommendations-cli.v1',ok:true,recommendations:DTO}`. Exit0 = completed advisory read, включая gaps/empty results; exit1 = cleaned refusal without DTO.

- [ ] RED tests: success/API parity; clean single JSON stdout; empty recommendations with gap remains ok; duplicate/missing/unknown flags; forbidden execute/apply/latest/output-dir flags; duplicate workspace in JSON; malformed UTF-8/oversize JSON; unsafe/symlink/hardlink input; wrong/dirty/missing Kernel; missing API export; mutation during import/call; final guard failure masks success; >8MiB encoded envelope prints no partial success. For real boundary cap test use large valid published inputs without weakening graph validation.
- [ ] RED command из Console: `node --import tsx --test tests/unit/qa-graph-recommendations-cli.test.ts`.
- [ ] До реального CLI GREEN зафиксировать собственный Kernel successor локальным commit и обновить embedded Console pin в этой же изолированной паре. Kernel должен быть clean, expected SHA равен embedded pin. Этот технический commit нужен source guard и не означает AQA/публикацию. Не ждать Task3 и не обходить guard через environment override; последующие Kernel repairs требуют повторной фиксации pair и affected rerun.
- [ ] Отдельно проверить классы ошибок: любой отказ readCallerJson, включая oversized file, даёт CLI INPUT_INVALID; явно превышенный canonical API input, DTO или envelope даёт LIMIT_EXCEEDED. Во всех случаях stdout пуст. Проверить точный stderr envelope из spec, без stack/private paths; shared reader не менять.
- [ ] Реализовать CLI: strict argv → readCallerJson → pin guard → import pinned Kernel src/index.ts → guard → await exact API → finally guard → UTF-8 8MiB envelope cap → print once. Не использовать distribution loader/build fallback или writer loader; не добавлять runner/servers.

```ts
// Шаблон теста: runCli/captureWorkspaceFiles — test-only helpers нового теста,
// не новые production APIs; subprocess + owned pin реальные.
const result = await runCli(['--workspace', workspacePath, '--input', inputPath]);
assert.equal(result.code, 0, result.stderr);
const envelope = JSON.parse(result.stdout);
assert.equal(envelope.ok, true);
assert.equal(envelope.recommendations.scope.narrowingAllowed, false);
assert.deepEqual(envelope.recommendations, directApiDto);
assert.deepEqual(await captureWorkspaceFiles(workspacePath), beforeRead);
```

- [ ] Recipe показывает: resolve current owner/publication/journey/context → advisory read → independent source/applicability/assertion review → включение already published C в existing plan без catalog revision → обычный validate/run/readback/report. Лишь новый/изменённый check/oracle требует existing author-checks/apply-authored-checks publication. Explicit source gaps/otherCheckIds остаются в reasoning/limitations; no execute authority, whole DTO не observation attachment.
- [ ] GREEN + pin/route compatibility из Console:

```sh
node --import tsx --test tests/unit/qa-graph-recommendations-cli.test.ts tests/unit/qa-product-skill.test.ts tests/unit/kernel-fixture-authority.test.ts tests/unit/kernel-replace-authority.test.ts tests/unit/bridge-cli-authority.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Default Console `npm test` не использовать как generic offline smoke: он запускает Playwright. Source `.claude` mirrors нужны existing qa-product-skill parity test; installed skills не затрагиваются.

## Task 3: Значимый локальный consumer, fresh reader и единая serial delivery

**Files:**
- Create `components/console/tests/unit/journey-check-recommendations-consumer.test.ts`.
- Create `components/console/tests/unit/fixtures/journey-check-recommendations-consumer.ts` — только synthetic owner fixture/setup, не production helper.
- Modify через serial integrator `tools/ci-impact.mjs`, `.github/workflows/qa-runtime.yml`, `tests/ci-impact.test.mjs`, `tests/qa-runtime-workflow.test.mjs` — literal test registration/owning argv, без CI policy/job/limit изменений.
- Coordinate `components/console/server/kernel-authority.mjs`; literal pin fixtures currently `README.md`, `tests/unit/{kernel-fixture-authority,bridge-cli-authority}.test.ts`, `tests/e2e/qa-monitor-{local.test,fixture}.mjs`; затронуть только реальную смену pin и affected controls.
- Carrier: `sources/manifest.v1.json`, selected `sources/candidates/*.bundle`, existing `docs/qualification/current.md`, единственный private CURRENT владельца. Имена bundle определяются exact final component commit, не переиспользуют чужие candidate files.

**Interfaces:**
- Consumes ordinary CLI DTO Task2; existing `runQaCampaign(input, adapter)` / `PlaywrightCampaignAdapter` / `readLatestCampaignEvidence`; existing native validate/run/status/export/read-outcomes при consumer receipt/report.
- Produces retained synthetic healthy/broken native receipts с reached assertion, advisory reasons/provenance/remainder и fresh-reader conclusion. Один whole-slice handoff/AQA/PR, не отдельная приёмка каждой задачи.

- [ ] Перед host work обновить actual source/owner roster и получить implementation resource slot; чужие container/server/data untouched. Сначала сохранить независимый fixture contract: journey изменения summary, invariant `summary.ready === true`, отдельный C с exact assertion `{kind:'json_pointer',path:'/summary/ready',value:true}`. Healthy ответ HTTP200 `{summary:{ready:true}}`, broken сосед HTTP200 `{summary:{ready:false}}`; одинаковые plan/assertions. Existing journey transport check HTTP200 проходит в обоих. Нормативный fixture source существует до наблюдения, не derives из runtime output.
- [ ] Создать fresh isolated registration owner существующими APIs. Сначала publish J/I и reviewed requires через buildRegistrationKnowledgeRevision/preview/apply; затем authored automated C на УЖЕ существующем invariant I через buildRegistrationCheckRevision и owning publication. Добавить unrelated sibling/check + unassessed target. CLI обнаруживает уже опубликованный C; добавить его в plan, сохранить остальные targets executable/blocked, без повторного catalog revision. Актуальное Kernel/Console authority binding обязательно; source raw file edits в managed owner запрещены.
- [ ] Реально выполнить healthy и broken через existing native API lane/adapter; не scripted adapter/fake receipt. PlaywrightCampaignAdapter API mode использует request.newContext, browser binary не нужен. Контроль требует passed transport и достигнутый content assertion: healthy C passed; broken C oracle_failure/json_pointer_mismatch при HTTP200, non-PASS owning result; ENV_BLOCKED/timeout/harness failure не detected mutation. Reuse actual persisted-read pattern api-semantic-assertions.test.ts:237. Unrelated J/no requires не получает C; mixed/unmapped/stale remain unknown.

```ts
// Шаблон consumer assertions: переменные извлекаются из реальной persisted native evidence.
assert.equal(healthyCheck.status, 'pass');
assert.equal(brokenCheck.status, 'needs_review');
assert.ok(brokenCheck.attempts.some(attempt =>
  attempt.outcome === 'oracle_failure'
    && attempt.oracle?.failureCode === 'json_pointer_mismatch'));
assert.deepEqual(savedPlan.checks.find(check => check.checkId === invariantCheckId).assertions,
  [{kind:'json_pointer',path:'/summary/ready',value:true}]);
assert.notEqual(brokenReceipt.verdict, 'PASS');
assert.deepEqual(unrelatedDto.recommendations, []);
assert.ok(healthyReceipt.blockedTargets.some(item => item.targetId === unassessedTargetId));
assert.ok(brokenReceipt.blockedTargets.some(item => item.targetId === unassessedTargetId));
```

- [ ] Retain native raw receipts/artifact assertions/trace: owning response HTTP200 в обоих controls и exact plan assertion `{kind:'json_pointer',path:'/summary/ready',value:true}`. В обычном saved report/checkpoint использовать existing persisted `Assessment.reasoning`, `limitations` и фактический remaining readback Q05 contract; не добавлять вымышленный `report.remaining`. Сохранить exact publication/J/I/C/edge/source IDs, independent expectation, actual result, receipt.blockedTargets и unmatched check remainder. Один fresh reader получает только source recipe + saved output/report/evidence; восстанавливает почему выбрано C, что реально проверено, почему broken non-PASS, что остаётся неизвестным. Не давать старый диалог и не создавать новый evaluator/store. Если reader не восстанавливает факты или runtime refused, acceptance остаётся partial, проблему исправляет тот же Sol.
- [ ] Локально из Console в coordinated slot:

```sh
node --import tsx --test --test-concurrency=1 tests/unit/journey-check-recommendations-consumer.test.ts
```

Source control tests Task1/2 и consumer — разные факты. Этот synthetic consumer доказывает ограниченную добавочную проверку и fresh continuation; не real product QA, causal quality uplift, full K02/L02/V01 или inherited F07. Для full L02 нужен confirmed defect/miss→learned regression→later change→actual regression execution; для F07 именно E04→L02.

- [ ] Serial mapping: добавить `qa-graph-recommendations-cli` и `journey-check-recommendations-consumer` в existing runtimeTests inventory и matching owning runtime argv: выбранный API consumer не требует browser binary. New Kernel test обнаруживается full regression автоматически. Оба новых Console tests должны быть mapped, иначе selector выдаёт unsupportedChanges. Новый Kernel source и bootstrap workflow change сохраняют действующий full gates выбор.
- [ ] Финализировать локальную Kernel/Console пару, подготовленную в Task2, после affected repairs; component commits/bundles/manifest frozen coherently. Проверить selected-pair equality. Не менять env SHA ради обхода embedded pin.
- [ ] Root affected closure из isolated integration root:

```sh
npm run sources:verify
node --test tests/selected-pair.test.mjs tests/ci-impact.test.mjs tests/qa-runtime-workflow.test.mjs
```

- [ ] До push affected Linux preflight в собственном `node:22` контейнере с exact pins/compatible Linux dependencies, CI-like environment; сохранить image/platform/Node/argv/FIRST/results и own cleanup. Host macOS node_modules не выдавать за Linux proof. Никакой current-UI exception автоматически не переносится на этот slice. Если resource/setup gap — retain UNKNOWN и checkpoint, не bypass.
- [ ] Self-review whole actual diff/source controls/local consumer/closure/FIRST → ONE actual Astra AQA всех трёх задач; repairs SAME reviewer affected only. Затем один serial carrier PR при действующей publication authority, свои hosted gates/one observer/remote readback перед обычным merge. CURRENT кратко implemented/verified/delivered/blocker/next, source identities, local-consumer limits, timings/unknown; без новой per-slice qualification/hash-ledger ceremony.
