# Адаптация Universal QAH к текущему Nuanu Flow через Proof Gate

## Статус и граница изменений

Дизайн одобрен 11 августа 2026 года как замена несовместимой маршрутизации
`gateway + when.var`.

Nuanu Flow остаётся неизменным:

- не меняются backend, engine, API, plugin, MCP-контракты и валидаторы Nuanu;
- не используется raw BPMN XML;
- QAH не пытается нормализовать, разрешать или исполнять `when.raw`;
- не добавляется новый профиль Proof Gate на стороне Nuanu.

Меняются только Universal QAH и устанавливаемый им Process v1 graph конкретного
проекта. Живой шаблон PayDemo остаётся paused до прохождения локальных тестов,
read-only validation и отдельного ограниченного canary.

## Причина адаптации

Текущий production Nuanu принимает структурное условие
`{var, op, value}`, но в наблюдаемом шаблоне после compile/read-back возвращает
optional-bracket выражение как `when.raw`; binding остаётся invalid/paused и не
является безопасным для активации. Повторная отправка того же условия, полная
замена `when` и remove/add ребра не меняют результат, потому что несовместимость
находится на round-trip границе платформы.

Встроенный `proof_gate` использует не JavaScript-условия, а закрытые outcome
маркеры `passed`, `not_passed` и `unable_to_verify`. Они сохраняются как
`flowConfig` и возвращаются обратно как структурный `when.outcome`.

Read-only dry-run на текущем production Nuanu уже подтвердил минимальную форму:
`valid=true`, `blocking_errors=[]`, `advisory_warnings=[]`, `ready_to_save=true`.
Dry-run ничего не сохранил и не активировал.

## Цель

Сохранить автоматический и fail-closed маршрут Universal QAH без изменений
Nuanu Flow:

```text
finalize_transition
  -> transition_proof_gate (type: proof_gate, profile: qa_result_v1)
       | passed            -> Ready for Production
       | not_passed        -> In Progress
       ` unable_to_verify  -> остаться в Ready for QA
```

Proof Gate является только штатным серверным адаптером детерминированного
результата к BPMN outcome. Источником продуктового QA-решения остаются
существующие Universal QAH aggregate, decision и finalization contracts.
Новый QAH claim adapter является узкой доверенной release-границей: он обязан
проверить связность финализации и доказательств до того, как серверный профиль
увидит claim. Штатный `qa_result_v1` остаётся вторичной fail-closed проверкой,
но не заменяет эту границу.

## Не-цели

- Proof Gate не заменяет проверки Freeland staging, API, Computer Use,
  Playwright, Telegram или оплаты.
- `qa_result_v1` не считается самостоятельным oracle среды Freeland.
- Эта работа не активирует Auto на реальных Freeland-тикетах.
- Эта работа не добавляет прямую смену статуса из Agent Task.
- Эта работа не превращает `INFRA_FAILURE`, `INCONCLUSIVE`, пропавшее
  доказательство или неизвестный код в продуктовый FAIL или PASS.

## Контракт финального результата

`finalize_transition` остаётся `agent_task`, единственным непосредственным
предшественником `transition_proof_gate` и единственным узлом, которому разрешено
выпускать QA claim. Он продолжает проверять подтверждённый комментарий, cleanup
receipt, общую candidate identity и точные ArtifactVersion. После этой проверки
его `item.data` дополнительно содержит плоские поля, которые ожидает штатный
`qa_result_v1`:

```json
{
  "transition_allowed": true,
  "target_state": "ready_for_production",
  "reason_codes": [],
  "kind": "qa",
  "verdict": "pass",
  "tested_head_sha": "0123456789abcdef0123456789abcdef01234567",
  "checks": [
    {
      "name": "universal_qah_evidence",
      "status": "passed",
      "evidence": "artifact:<artifact-id>@<version-id>"
    }
  ]
}
```

Поля Proof Gate не вкладываются в `qa_proof_claim`: текущий Nuanu извлекает
claim непосредственно из `item.data`.

### Точная граница Agent Task -> Proof Gate

Локальный двухфазный materialization transport QAH может временно использовать
внутренний `{item, artifact_outputs}` envelope, чтобы создать и затем связать
`finalization_report`. На вход Process engine адаптер передаёт уже точный
`FlowStepResultV1` без `artifact_outputs` и без дополнительных корневых полей:

```json
{
  "schema_version": "nuanu.flow-step-result.v1",
  "item": {
    "key": "finalize_transition",
    "description": "Universal QAH finalization admitted",
    "data": {
      "transition_allowed": true,
      "target_state": "ready_for_production",
      "reason_codes": [],
      "kind": "qa",
      "verdict": "pass",
      "tested_head_sha": "0123456789abcdef0123456789abcdef01234567",
      "checks": [
        {
          "name": "universal_qah_evidence",
          "status": "passed",
          "evidence": "artifact:<artifact-id>@<version-id>"
        }
      ]
    },
    "artifacts": {
      "finalization_report": {
        "artifact_id": "<artifact-id>",
        "version_id": "<version-id>",
        "kind": "document",
        "role": "output"
      }
    }
  }
}
```

`finalize_transition.config.output` объявляет все эти data-поля и
`finalization_report`. Никакой другой узел, Start payload, prompt или общий
context не содержит `kind=qa`, `verdict`, `tested_head_sha` либо `checks`,
поэтому fallback claim из context не является разрешённым путём. Отсутствующий,
неполный или неверно обёрнутый `FlowStepResultV1` не достигает Proof Gate.

### Источники полей

- `kind` всегда равен литералу `qa`.
- `tested_head_sha` берётся только из уже проверенного review bundle и должен
  совпасть с закреплённым repository workspace head. Свободный текст карточки,
  prompt и ambient environment не могут его переопределить.
- `checks` детерминированно строится из канонического aggregate и точных
  evidence ArtifactVersion. Каждый элемент содержит непустые `name`,
  `evidence` и статус только `passed` или `failed`.
- `verdict` вычисляется локальным policy-кодом из доверенных
  `decision.route`, `decision.reason_codes` и `aggregate.branches`, а не LLM и
  не BPMN. Product failure признаётся только по аутентифицированной применимой
  ветке с `product_result=FAIL` либо `confirmed_findings>0` при подтверждённом
  evidence. Остальные отрицательные маршруты являются `blocked`.
- Внутренний `nuanu.qa-release-route.v1` получает третье закрытое значение
  `HOLD_IN_READY_FOR_QA`. `READY_FOR_PRODUCTION`, `RETURN_TO_IN_PROGRESS` и
  `HOLD_IN_READY_FOR_QA` однозначно отображаются соответственно в `pass`,
  `fail` и `blocked`; старое правило «любой не-PASS возвращается в разработку»
  удаляется. `target_state` финализации выводится из этого же классификатора как
  `ready_for_production`, `in_progress` или `ready_for_qa`, а не копируется из
  свободного предложения агента.
- `reason_codes` в показанном результате относятся только к целостности
  финализации: comment read-back, cleanup и identity. Для любого выпущенного
  claim этот массив пуст. Причины самого QA-решения остаются в доверенном
  decision/review bundle и используются при вычислении `verdict`.

### Доверенная release-граница

Штатный `qa_result_v1` проверяет форму claim, SHA и непустые строки evidence,
но не знает семантику `transition_allowed`, `target_state`, `reason_codes` и не
разрешает произвольную evidence-строку до конкретного ArtifactVersion. Поэтому
QAH claim adapter до выпуска `FlowStepResultV1` обязан атомарно доказать:

- `transition_allowed === true` и finalization `reason_codes` пуст;
- `target_state=ready_for_production` согласован только с `verdict=pass`,
  `target_state=in_progress` — только с `verdict=fail`, а
  `target_state=ready_for_qa` — только с `verdict=blocked`;
- каждый check построен из уже провалидированного aggregate branch result;
- каждая evidence-строка получена из точной неизменяемой ArtifactVersion,
  которая присутствует в review bundle и прошла identity/digest read-back;
- произвольный непустой текст, mutable latest ref или Artifact из другого run
  не может стать evidence.

### Закрытое отображение verdict

| Условие Universal QAH | `verdict` | Outcome Proof Gate |
| --- | --- | --- |
| `READY_FOR_PRODUCTION`, все обязательные checks подтверждены | `pass` | `passed` |
| `RETURN_TO_IN_PROGRESS`: аутентифицированная применимая ветка имеет `product_result=FAIL` либо `confirmed_findings>0` при verified evidence и сервер подтвердил текущий repository head | `fail` | `not_passed` |
| `HOLD_IN_READY_FOR_QA`: `INFRA_FAILURE`, `INCONCLUSIVE`, provider error, stale candidate, недостаток доказательств, человеческая проверка | `blocked` | `unable_to_verify` |

Claim выпускается только при `transition_allowed=true` и пустом наборе
finalization `reason_codes`. `pass` дополнительно требует непустой список
checks, где каждый `status=passed`. `fail` требует непустой список и хотя бы
один подтверждённый `status=failed`, согласованный с закрытым product-failure
кодом. Для `blocked` список может быть пустым или содержать только уже
подтверждённые checks: непроверенную ветку нельзя переименовывать в `failed`.
Все остальные корректно сформированные состояния дают `blocked`.

Проверка repository workspace и ревизии имеет абсолютный приоритет над
продуктовым verdict. Если сервер не видит workspace или `tested_head_sha` не
равен его текущему head, итог всегда `unable_to_verify` — даже если QAH нашёл
подтверждённый дефект. Только `fail`, привязанный к текущей серверно наблюдаемой
ревизии, может попасть в `not_passed` и вернуть карточку в In Progress.

Нарушение identity, неверный comment read-back, неверный cleanup receipt,
подмена Artifact или неизвестный policy code остаются hard failure: Agent Task
не выпускает ProcessItem и Proof Gate не достигается.

## Изменение Process blueprint

Адаптация сохраняет UUID существующих End и рёбер, но следует stock-контракту
неизменяемого `node.type`: legacy gateway удаляется только после явного
переподключения, а Proof Gate получает новую identity.

1. Добавляется узел `transition_proof_gate` с UUID
   `10000000-0000-5000-8000-000000000026`, `type: proof_gate` и конфигурацией:

   ```json
   {
     "profile_key": "qa_result_v1",
     "profile_version": "1",
     "ai_assessment": "off"
   }
   ```

2. Безусловное ребро `...022` переподключается как
   `finalize_transition -> transition_proof_gate`; после переподключения legacy
   `transition_route` (`...019`, `type: gateway`) удаляется.
3. Ребро к `ready_for_production_end` использует только
   `{"outcome":"passed"}`.
4. Ребро к `in_progress_end` использует только
   `{"outcome":"not_passed"}`.
5. Добавляется End `qa_needs_human_end` с
   `project_status.target_state_id=null` и ребро
   `{"outcome":"unable_to_verify"}`.
6. В графе не остаётся ни одного `when.var` или `when.raw` на финальном
   маршруте.

Proof Gate имеет ровно один вход и ровно три выхода прямо в End-узлы. Это
закрытый контракт текущего Nuanu Process v1.

Локальный authored graph хранит у Proof Gate только `profile_key`,
`profile_version` и `ai_assessment`. После сохранения текущий Nuanu детерминированно
добавляет server-owned `config.output` с ровно четырьмя строковыми полями:
`completion_verification_id`, `outcome`, `reason_code`, `resolution` и пустым
`artifacts`. Read-back валидатор принимает либо точный authored config до
сохранения, либо точный server-normalized config после сохранения; любые лишние
поля, изменённые descriptions/types или Artifact slots отклоняются.
Порядок элементов массива `edges` не является семантикой read-back: три выхода
сравниваются как точный набор по immutable edge ID, сохраняя точные source,
target, name и `when.outcome`.

## Роль штатного `qa_result_v1`

Профиль дополнительно проверяет:

- корректную форму QA claim;
- наличие repository workspace;
- равенство `tested_head_sha` текущему workspace head;
- наличие структурированного runtime evidence;
- актуальность Git branch для положительного результата.

Если workspace отсутствует, revision устарела или Git provider недоступен,
профиль возвращает `unable_to_verify`; карточка не покидает `Ready for QA`.

Профиль не подтверждает сам по себе Freeland deployment identity и не проверяет
семантику ArtifactVersion. Эти свойства до Proof Gate обязаны подтвердить
существующие environment, aggregate, finalization и новый claim-adapter слои
Universal QAH. Proof Gate безопасно выбирает BPMN outcome только после этой
доверенной границы.

### Runtime preflight текущей платформы

Read-only `validate_process_graph` доказывает структурную совместимость графа,
но не доступность repository workspace в момент исполнения. Существующий
`runDirectInstallPreflight` отдельно подтверждает точные Git origin/commit,
профиль, AgentVersion, worker identity и binding read-back; он также не является
доказательством server-side workspace для `qa_result_v1`.

До canary фиксируются оба этих независимых preflight. Поскольку текущая
публичная версия Nuanu не предоставляет отдельного read-only вызова, который
полностью воспроизводит runtime Git verification профиля, первый Assist-run
является ограниченным compatibility probe:

- карточка не меняет статус независимо от outcome;
- заранее не заявляется ожидаемый `passed`;
- `unable_to_verify` из-за отсутствующего workspace, revision mismatch или Git
  provider классифицируется как platform prerequisite, а не product failure;
- после такого результата binding снова паузится до устранения конфигурации;
- только наблюдённый `passed` с совпавшими revision/evidence разрешает следующие
  негативные canary и последующее отдельное решение об Auto.

## Режимы выполнения

- Первый live canary выполняется в `Assist`: процесс запускается автоматически,
  но End не меняет статус карточки. Проверяются run, outcome, Artifact и Journey.
- `Auto` разрешается только после отдельного PASS-canary и негативных canary для
  `not_passed` и `unable_to_verify`.
- Платежи, production, OTP/CAPTCHA, native Telegram и неоднозначная визуальная
  проверка остаются отдельными risk gates; Proof Gate их не обходит.

## Ошибки и восстановление

- `blocked` никогда не маппится в `not_passed`; он остаётся в QA.
- Provider/Git failure никогда не ретраится как новый QA-run автоматически.
- Повтор одного Proof Gate visit использует штатную идемпотентность Nuanu.
- Если read-back после установки не возвращает три точных `when.outcome`,
  binding остаётся paused и дальнейших мутаций нет.
- Если canary обнаруживает неправильный маршрут, binding немедленно паузится.
  Временный fallback — один нейтральный End с ручным перемещением карточки;
  проблемный `when.var` не восстанавливается.

## Проверки реализации

### Unit

1. Чистое решение и полностью положительные доказательства дают `pass`.
2. Подтверждённый продуктовый дефект даёт `fail` и содержит отрицательный check.
3. Infra/provider/missing evidence/human-required дают `blocked`.
4. Неизвестный код, подмена commit или Artifact не создают claim.
5. `pass` невозможен при пустом evidence или хотя бы одном failed check.
6. `transition_allowed=false` или непустой finalization `reason_codes` не
   создают ProcessItem для Proof Gate.
7. Несогласованные `target_state`/`verdict` отклоняются до Process engine.
8. Произвольная непустая evidence-строка без точной проверенной ArtifactVersion
   отклоняется.
9. Missing/stale repository workspace даёт `unable_to_verify` для `pass`,
   `fail` и `blocked`; продуктовый FAIL не обходит revision gate.
10. Незнакомый release route отклоняется; infra/inconclusive выбирают
    `HOLD_IN_READY_FOR_QA`, а не `RETURN_TO_IN_PROGRESS`.

### Blueprint contract

- `transition_proof_gate.type === "proof_gate"` и legacy `transition_route`
  отсутствует;
- профиль равен точному `qa_result_v1@1`, AI assessment выключен;
- server-derived Proof Gate output либо отсутствует в authored graph, либо
  совпадает с точным четырёхполевым stock-контрактом;
- присутствуют ровно три outcome: `passed`, `not_passed`,
  `unable_to_verify`;
- каждый outcome ведёт прямо в свой End;
- hold End имеет `target_state_id=null`;
- финальный маршрут не содержит `var`, `raw`, `otherwise` или `branch`;
- compile/read-back blueprint сохраняет те же outcome.

### Runtime integration

- `task-runtime finalize-transition` материализует report, а adapter публикует
  точный `nuanu.flow-step-result.v1` с плоским QA claim только после проверки
  finalization report;
- `finalize_transition` остаётся непосредственным `agent_task`-предшественником
  Proof Gate; claim нельзя получить из Start payload или context fallback;
- локальный harness проходит PASS, PRODUCT_FAIL и BLOCKED сценарии;
- все существующие identity, comment, cleanup и Artifact negative tests
  продолжают проходить.

### Nuanu compatibility

1. Read-only `validate_process_graph` возвращает `ready_to_save=true`.
2. После отдельного разрешения применяется одна атомарная graph patch.
3. Немедленный read-back возвращает точные `when.outcome` и ни одного
   `when.raw` в затронутой selection.
4. Binding активируется только после согласованного read-back.
5. Первый Assist compatibility probe доказывает один journey, один run, frozen
   graph identity и отсутствие автоматического status transition; только
   фактически наблюдённый `passed` превращает его в PASS-canary.

## Последовательность поставки

1. TDD: добавить падающие unit и blueprint tests.
2. Расширить release decision/finalization закрытым hold-маршрутом, реализовать
   минимальный QA claim adapter и обновить blueprint.
3. Прогнать focused tests, полный QAH suite и local harness.
4. Закоммитить локальные изменения в `codex/universal-qah`.
5. Выполнить только read-only validation полного графа.
6. Отдельным контролируемым шагом обновить paused PayDemo template, прочитать
   его обратно и активировать.
7. Выполнить один Assist canary; Auto остаётся выключенным.

## Критерии готовности

- Не изменён ни один файл Nuanu Flow и не требуется новая версия plugin.
- Universal QAH не использует variable-condition routing в финальном BPMN.
- PASS, PRODUCT_FAIL и BLOCKED имеют разные fail-closed outcome.
- Missing/stale/provider/human-required никогда не ведут в Ready for Production.
- Положительный outcome связан с текущим commit и непустым runtime evidence.
- Blueprint и runtime покрыты тестами, которые наблюдались красными до
  реализации и зелёными после неё.
- Live Process не меняется до чистого локального verification handoff.
