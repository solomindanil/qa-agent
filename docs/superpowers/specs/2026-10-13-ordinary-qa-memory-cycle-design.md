# Обычный QA-цикл с продуктовой памятью

Статус: узкое дополнение принятого foundation; дизайн Astra, реализация Sol6.1. Основа — root f8d6bb6, Kernel 6d38980ab77621f4c1fe85872985600a3cf13c9f, Console a2e2bbb85d3c12bb0e112eac841a02766671a401. Пользователь разрешил добавить память в обычный QA-цикл. Действует «без эксперимента»: здесь только source implementation и конечные локальные controls, без provider/fresh actors/SRL/benchmark/CI/product calls, изменений native graph и соседнего gateway.

## 1. Результат и существующая опора

Обычный агент получает понятный путь: вход в задачу → bounded recall и чтение основания → собственный выбор проверок с объяснением → обычный owning результат → 1–3 самостоятельно сформулированных знания и сохранённое reasoning. Один learn сохраняет 1–3 claims, но это не квота на задачу: если новых полезных grounded знаний нет, агент не вызывает learn и объясняет skip в обычном reasoning. Не выдумывать claim ради записи и не блокировать честный QA-результат из-за skip/gap памяти. Человек не составляет JSON, не ищет owner paths и не обслуживает индекс. Агент может передавать структурированные payloads: это рабочий интерфейс инструмента, а не анкета для пользователя.

Уже существуют:

- `startHostActivity` и защищённый `memoryAccess` grant до запуска; актуальные current/home/evidence owner bindings, режим, срок и закрытие. `src/node/agent-host-activity.mjs`, `agent-memory-host-grant.mjs`.
- `loadAgentMemoryRuntime`: v2 recall/read/save/associate/rebuild/recover, guarded pinned source и evidence readers; `scripts/qa-memory.ts` требует ручного соединения paths/context files.
- `captureAgentRequestReport`, v4/v5 exact checkpoint readers, typed primary refs и owning qualifications; `agent-memory-evidence-reader.ts` уже различает bytes, metadata, unread qualifications и inspection.
- `encodeMemoryAssessmentReasoning`, applicability/retrieval snapshots и совместимые CLI/SSR/V9 readback. P14 подтвердил этот механизм; новой report/schema/store authority не требуется.

Разрыв — ordinary workflow composition, не отсутствие хранилища. Простой текстовый рецепт оставляет ручной сбор context/ref/recovery каждому агенту. Автоматический mining отчёта недопустим: он подменяет авторство знания и основания. Выбрана тонкая Console composition поверх принятых owning APIs, без нового Kernel wire/store и без inference из prose.

## 2. Trusted entry: откуда берутся owners

Существующий trusted `startHostActivity.memoryAccess` object остаётся поддержанным. Добавить shorthand `memoryAccess: 'current_owner'`: он означает только self-home текущего зарегистрированного workspace из проверенного captured request. Это не поиск home по slug, имени продукта, текущей директории или соседним файлам. Cross-campaign home и до 14 evidence roots остаются существующим explicit trusted object, который ordinary operator/setup уже знает; actor не получает нового способа добавлять roots.

Внутренний `prepareHostMemoryAccess` в существующем host-grant module вызывается после проверки registered workspace/request/source и до `buildMemoryHostGrant`. Shape-only нормализация shorthand по captured owner выполняется раньше любых `.memoryHomeWorkspacePath`/`.evidenceWorkspacePaths` accesses и расчёта writable roots; она ещё не создаёт association. Authority/write preparation идёт только после существующих root/registered-workspace/source проверок. Нельзя обходить раннюю validation через null/строку. Он нормализует shorthand в существующий object и проверяет association обычным pinned public recall. При существующей self-association никаких association writes не делать. При другом home shorthand отказывается: не переопределять product identity и не создавать второй home. Никакого нового persisted global locator/config registry.

Для первого отсутствующего self-home только owner-output setup может вызвать существующий `associateAgentMemoryOwner` с проверенными current authority digests, без expectedAssociationDigest и со стабильным requestId `ordinary-self-` + SHA256(canonical `{ownerId,publicationAuthorityDigest,workspaceDigest}`), затем повторить обычную проверку. Existing API самостоятельно откажет при несовместимой/изменённой/corrupt binding; это не разрешение на reconciliation. Не ловить произвольную ошибку как «памяти нет»: только `MEMORY_ASSOCIATION_REQUIRED`, только shorthand, только self и write. Existing explicit cross-home setup не получает автоматического re-association. Read-only никогда не создаёт association/index/context output.

Непроверенная/отсутствующая association — явный capability gap, а не пустой recall и не silent fallback на чужую память. Legacy launch без memoryAccess не меняется. Ошибка memory-enabled preparation не запускает самовольно no-memory actor: caller может продолжать уже разрешённую независимую QA через обычный existing path, явно сохранив gap. Current/home/evidence roots после нормализации проверяются теми же grant/root-overlap/profile правилами. Shorthand self-home не добавляет writable root.

Для нового task facade запись служебных файлов разрешена только в уже допущенном `captured.owner.notesDirectory`, private 0700, вне current/home/evidence managed roots и source/activity roots. Если этот узкий layout отсутствует, task learning/recovery возвращает capability gap; старые low-level operations остаются доступны в их собственном контракте. Никакого caller `outputPath` или добавления sandbox roots ради успеха. Read-only task recall/read/reasoning возвращают stdout и не требуют записываемого context file.

## 3. Одна agent-facing поверхность

Добавить `node --import tsx scripts/qa-memory.ts task --input -`. Единственный вход ≤64 KiB, строгая discriminated schema; результат ≤1 MiB. Старые команды/flags/v1-default не меняются. CLI не принимает здесь workspace/home/source roots/request paths/grants/context JSON/executable. Всё разрешается через новый Console-only `loadAgentMemoryTaskRuntime()` из **повторно проверенного live grant**, captured request и selected source. Нет hosted context/grant — `MEMORY_TASK_UNAVAILABLE`; local low-level CLI сохраняется отдельно.

```ts
type OperationKey = string; // /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
type CheckpointSelector = { recordFormat: 'v4' | 'v5'; checkpointRevision: number };
type TaskInput = { schemaVersion: 'qa-memory-task-input.v1' } & (
 | { operation: 'recall'; query: RecallInputV2['query']; cursor?: string }
 | { operation: 'read'; noteIds: string[]; references: MemoryReferenceV2[] }
 | { operation: 'evidence'; checkpoint: CheckpointSelector;
     selections: TaskEvidenceSelection[] }
 | { operation: 'learn'; operationKey: OperationKey; checkpoint: CheckpointSelector;
     drafts: TaskLearningDraft[] } // 1..3, полный вход по-прежнему ≤64 KiB
 | { operation: 'recover'; operationKey: OperationKey; item: 0 | 1 | 2 }
 | { operation: 'reasoning'; value: MemoryAssessmentReasoningV1 }
);
type TaskLearningDraft = Omit<NoteDraftV2, 'schemaVersion'|'requestId'|'memoryProductId'>;
type TaskEvidenceSelection = {
 refId: string; // existing RefId limits, unique across expanded request
 selector: {kind:'v4_observation';evidenceId:string}
   | {kind:'v5_execution';executionId:string;artifactIds:string[]}
   | {kind:'native_artifact';runId:string;checkId:string;attempt:1|2;assertionIndex:number};
};
```

Каждый input/result facade имеет строгий parser; ошибки CLI используют `{schemaVersion:"qa-memory-task-cli.v1",ok:false,error:code}` и известные operation/item/attemptId, без сырого exception/path/секрета. Успех — тот же version с `ok:true,result:TaskResult`. TaskResult дополнительно содержит `access:{sessionRef,grantDigest,mode,memoryProductId,memoryHomeOwnerId,requestOwnerId}` из проверенного grant/public context; это provenance readpoint, не переносимый grant. Known unavailable не подменяется пустым success. `MEMORY_TASK_UNAVAILABLE`, `MEMORY_TASK_OUTPUT_UNAVAILABLE`, `MEMORY_TASK_OPERATION_CONFLICT`, `MEMORY_TASK_READBACK_UNCONFIRMED` — новые finite Console codes; existing refusal/recovery codes сохраняются.

Identifiers/types выше импортируются из accepted schemas; не создавать ослабленные копии. `read` использует существующие ≤20 note IDs/≤8 root references/≤16 expanded leaf references и bytes budgets. `evidence` selections 1..8 и совокупно ≤16 leaf selectors; v5 artifactIds 1..8. Значения с неизвестными ключами, чужой формат, повтор refId, пустой selector или превышение — отказ до чтений/эффектов. Native image export остаётся существующей отдельной командой/grant; task evidence возвращает selector, не pixels и не inspection PASS.

`TaskResult` имеет `{schemaVersion:'qa-memory-task-result.v1', operation, request:{requestId,revision,digest}, result}`. Exact payload names: recall `{recall,snapshot}`, read — существующий DetailResultV2, evidence `{references,resolution}` (resolution = DetailResultV2), learn `{items:[...]}`, recover — один per-item outcome, reasoning `{reasoning}`. В result:

- recall: **точный public RecallResultV2** плюс snapshot из `runtime.snapshotRecall` для этого input/result/readAt; никаких предвыбранных слов, очереди или суммы страниц.
- read: точный public details результат; current context получается bounded пустым recall, maxVisitedRecords=1/pageSize=1, без вывода его records как ответа на пользовательский поиск. Это identity read, не доказательство отсутствия знаний. Context не кешируется как authority.
- evidence: `{references, resolution}` — refs, построенные из выбранного public checkpoint, и существующий details/readRequestEvidence результат. Только request текущего grant; исторический другой request читается существующим explicit details path, не угадывается по latest.
- learn: отдельные результаты каждого элемента с `item`, `operationKey`, `status:'saved'|'failed'|'unknown'|'not_attempted'`, exact save receipt/result либо finite code/attemptId/recovery. Нет batch atomicity и aggregate saved при частичном результате.
- recover: тот же per-item результат existing recover/save-readback; не новый retry engine.
- reasoning: `{reasoning: string}` из существующего encoder, без записей в owning report и без изменения input prose/applicability.

## 4. Точные ссылки без ручного хеширования

`resolveTaskEvidenceSelections` в Console evidence reader использует `captureAgentRequestReport` с exact current request key и явным checkpointRevision/format. Из owning record выводятся ownerId, checkpointDigest, execution/artifact/native/observation digests и optional recordFileDigestAtRead. Проверяются membership в selected checkpoint и existing primary selector constraints. Отсутствие — отказ, никакого latest/all-artifacts fallback. Граница selected immutable digest vs изменяемый containing file остаётся прежней.

Qualification refs не выдумываются. Первый результат запускает существующий reader с include_owning_qualifications и возвращает его bounded candidate locators/unread/prose-only context. Агент выбирает и читает необходимые основания через task read; непокрытая qualification остаётся unknown. Не добавлять автоматически все later executions, не превращать candidate locator в прочитанное доказательство. References возвращаются с qualificationRefs первоначально [], если агент ещё не предоставил точные qualification selections; уже существующий task read принимает полные typed refs, включая такие selections. Backend не утверждает семантическую полноту.

Сохранение learn требует успешного public read выбранного checkpoint текущего request до попытки save. Source-only анализ разрешён: реальный owning checkpoint может содержать unassessed результат без execution/observation; это не повод выдумать primary или выполнить продукт. Source references остаются explicit typed refs, readable только через уже admitted source store/session; текущий grant такого binding не содержит, поэтому без действительно существующего trusted composition source_snapshot возвращает unavailable, даже если low-level CLI умеет explicit source-store route; facade не выводит новый registration store из текста. Это provenance anchor операции, не основание автоматически для каждого claim: draft.references/basis/epistemicKind/conditions/relations остаются authored агентом и проверяются существующим Kernel. Сам checkpoint не становится oracle. В частности, expectation из source остаётся expectation с собственным основанием; observation без прочитанных pixels не становится visual claim.

## 5. Стабильный intent и неполная запись

`learn` один раз получает свежий verified context и проверяет drafts стандартными Kernel schemas. Заполняются только schemaVersion, memoryProductId и стабильные requestId: `ordinary-` + SHA256(canonical `{requestDigest,operationKey,item}`). Нельзя включать draft hash в ключ: изменённый payload под тем же ключом должен конфликтовать, а не создавать новый note. Agent author/смысл не подставляются из prose; author остаётся draft field.

До первой managed записи сохранить exclusive 0600 intent files в 0700 `notesDirectory/memory-task/<requestId>-r<revision>/<SHA256(operationKey)>/`: binding + exact original SaveInputV2 каждого элемента + canonical digest и exact selected checkpoint anchor. Это resume artifacts, не knowledge/verdict/authority store. Guarded reads/no symlinks, ограниченные размеры, secret policy; никакого сканирования чужих папок. Intent каждый ≤128 KiB, всего на operation ≤512 KiB; result/readback artifact каждый ≤1 MiB, не более трёх intent и 16 attempt/result files на item. Превышение — explicit refusal, не eviction/overwrite и не скрытый retry. Existing files принимаются только при exact request/operation/payload match; конфликт — `MEMORY_TASK_OPERATION_CONFLICT`. Исходные bytes не переписываются. Если durable intent сохранить не удалось — managed save не начинается.

Элементы выполняются последовательно existing supervised `runtime.saveV2`. После каждого результата сохраняется exclusive attempt/result artifact, readback exact note осуществляется public detail/read; status saved допустим только если exact requested ID единственный найденный record, его contentDigest и полный canonical note совпадают с validated SaveResultV2.content, product/home/request identity совпадает с original intent, а receipt совпадает с existing Kernel schema. contextChanged/unresolvedRefIds/qualification unknown не скрываются: saved означает durability, не пригодность знания. Любой readback gap после save — unknown (`MEMORY_TASK_READBACK_UNCONFIRMED`), не rollback; storage receipt не доказывает смысл claim. На первом failed/unknown остановить оставшиеся элементы и вернуть partial outcome. Нельзя автоматически пересобрать контекст, перегенерировать key или повторить product action.

Повтор learn с тем же operationKey читает original intent и сверяет caller payload; использует **original context**, не новый auto-context. Уже сохранённые элементы читаются/точно replay через existing API, не дублируются. `MEMORY_BUSY` требует подтверждения завершения writer перед same-input retry. Для неизвестного результата и полученного attemptId task recover читает original intent/attempt из этой же request-bound папки и вызывает existing public recover; caller witness/attempt substitution отсутствуют. При потере attemptId использовать public exact note readback/idempotent save только по supported recovery semantics; не угадывать writer, не сканировать locks. Потеря journal, unsupported recovery/whole-host death — явный gap. Artifact receipts проверяются, но не заменяют current grant/source/owner checks.

Если note сохранился, а result artifact/report write не подтвердились, возвращать unknown/retained canonical ID где известен; не откатывать immutable note и не писать второй. Cross-request recovery не расширять в этой версии: ordinary continuation того же captured request может восстановиться через новый grant, другой request использует existing explicit owner recovery.

## 6. Обычный prompt и отчёт

При memory-enabled launch добавить короткую доверенную generic инструкцию к prompt после successful preparation, до финального buildCodexLaunch; если текущий код валидирует original prompt раньше, final launch payload обязательно повторно валидируется после добавления. Не изменять original captured request bytes/digest. Итоговый prompt по-прежнему ≤16 KiB. Содержимое: вызвать task recall перед выбором проверок, самостоятельно оценить основания/conditions/conflicts/unknown remainder, сохранить 1–3 полезных claims через learn после owning readback, использовать reasoning encoder при обычном следующем checkpoint и повторно прочитать результат. Не добавлять готовые queries/note IDs/queue/expected answers, весь recall или историю чужого planning. Никаких auto tool calls агента и семантических обещаний по одному наличию prompt.

Агент переносит actual recall snapshots и собственные applicability declarations в существующий whole reasoning envelope. Сохранённые learning IDs/ошибки записи описывает в human reasoning, не выдаёт их за inventory/applicability/PASS. Backend не добавляет пустую applicability за агента, не меняет dispositions/definitions/sufficiency/native denominator. Record/checkpoint/export выполняются existing normal owner commands; память не создаёт второй результат и не блокирует сохранение честного QA-результата при memory failure. Fresh request повторяет recall по текущему owner/grant; старый PASS не переносится автоматически.

Нет outer v4/v5/v8/v9 изменений, report envelope version/fields остаются существующими. Новая facade только вызывает encoder вместо ручного импортирования TS helper агентом. Старые plain/v1-в4 paths и no-memory host argv/prompt/env byte expectations сохраняются.

## 7. Реализация одним coherent slice

1. **Trusted entry + task facade (Sol основной):** `agent-host-activity.mjs/.d.mts`, `agent-memory-host-grant.mjs`, `scripts/qa-memory.ts`; новый небольшой `src/node/agent-memory-task.ts` для строгого task DTO/routing/context/intent orchestration. Existing supervisor/Kernel сохраняются. Предпочесть reuse CLI bounded/private output helpers, извлекая только реально общие functions без unrelated refactor. Нового subprocess/runner, MCP/DB/dependency нет.
2. **Selected evidence + report ergonomics (Sol в той же поставке):** небольшой `resolveTaskEvidenceSelections` в `agent-memory-evidence-reader.ts`; existing reader как единственная primary authority; existing encoder напрямую. Source guide `skills/qa-product-v0/references/agent-memory.md`, короткий ordinary lifecycle в SKILL и принятых mirrors. Не менять gateway/peer source.
3. **Finite local controls и одно Astra affected review:** ниже. Source frozen before integrated control; FIRST retained. Не добавлять новых промежуточных user approval/qualification циклов.

## 8. Приёмка engineering slice

Один согласованный набор, без real provider/agent experiment:

- Existing associated self-home и distinct trusted home дают одинаковое product identity across two ordinary captured requests; task actor не задаёт roots. First owner-output self-association создаётся один раз; read-only missing ассоциация ничего не пишет; shorthand на чужом home/slug collision отказывается без effects.
- No-memory launch byte-compatible. Inert supported host child делает первым действием task recall без coordinator context/note IDs; grant готов до spawn. Подмена/expired/closed grant, root/identity change, missing allowed notes, readonly learn — отказ. Нет автоматического gateway/image capability.
- Bounded recall сохраняет actual query/cursors/unknown/links и exact snapshot. Task read auto-context не объявляет весь corpus прочитанным. Изменённый query со старым cursor отказывается existing reader.
- Evidence builder берёт exact cp/execution/artifact по IDs: missing/foreign/wrong-format IDs не имеют latest fallback; cp append сохраняет immutable primary и выявляет later qualifier; metadata/pixels/inspection различны; existing caps не обходятся.
- Agent-authored single semantic fixture: recall→primary read→normal owning checkpoint→learn(1–3)→reasoning→normal successor checkpoint→CLI/SSR/export reopen. Никакого inferred oracle/currentPASS/relations из prose; оставшийся denominator и dispositions неизменны. Это scripted mechanism, не качество автономного агента.
- Same operationKey/input converges exactly; changed payload/key reuse конфликтует. Partial success сохраняет первый note, remaining not_attempted; original intents durable до writes. Unknown result/failed local artifact не даёт saved assertion; targeted existing supervised recovery exact intent, без повторных product actions. Concurrent same key реальный supported busy/replay semantics, не обещание обеих первых calls succeeded.
- One finite fault control lost result / recovery artifact and one no-memory regression + affected typecheck/schema/guide checks. Reuse existing supervisor/grant/P14 controls where unchanged; не replay всей foundation, provider, 10k, SRL или CI.

Выход slice: supported ordinary memory composition + проверяемые storage/report механизмы. Он не закрывает прежние provider/native S18/semantic/scale gaps и не доказывает причинную пользу памяти. Неудача памяти отображается как точный memory gap при сохранении обычного QA-результата.
