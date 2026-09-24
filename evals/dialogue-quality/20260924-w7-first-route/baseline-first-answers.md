# W7 S1–S3 first unaided answers — retained before AQA grading

These are the actors' first final answers as delivered to the parent, with no
correction or retry. Their native local session logs remain outside Git; the
table hashes those log files and the native final `output_text`. The exact
parent-copied [dispatch messages](baseline-dispatches.md) and frozen
[cases](../w7-first-route-cases.md)/[rubric](../w7-first-route-rubric.md) are
separate. Raw `NEW_TASK` fields are encrypted, so independent dispatch-byte
equivalence is not established. The actors were requested as Sol/medium with
`fork_turns=none`; native `turn_context` confirms `gpt-6-sol` for each.

| Case | Native local session basename | SHA-256 of full JSONL | Native final-text SHA-256 | UTC duration | Tool wrappers | Total tokens (cached input subset) |
| --- | --- | --- | --- | ---: | ---: | ---: |
| S1 | `rollout-2026-09-24T19-23-56-01a0d328-696c-7082-9e7f-dadd381827c8.jsonl` | `a7507ecfb93afd9d50deb83140d65cb0a18b1c8ddc85e81c6fdff902594a53b0` | `e7a2eb89ac489917c4535f2a362ee4244ddc4ab9e688a6397c71df889f7dd141` | 56.010 s | 12 | 636,908 (592,640 cached) |
| S2 | `rollout-2026-09-24T19-25-22-01a0d329-b8ac-7203-bff3-3b7b609a011b.jsonl` | `daa7883981401b993bd9f8d6c1f547df54d6896af58b1e9e87b4fea3378bdd29` | `48f0bbb260a02b88b1e06d5d8791bd161c2ac83031aa2608c6a28b51a87fca16` | 69.805 s | 13 | 838,841 (770,560 cached) |
| S3 | `rollout-2026-09-24T19-26-45-01a0d32a-fd2f-7640-8c40-0add9a4a9538.jsonl` | `7eddab6681b364746c7a922c5243f58ac05509d2ab28891586a66519436393cc` | `70ffd54839dde09318dcdb653a5bed9c762076077a68a7ea4ea0c6fdc3fa13b6` | 87.127 s | 16 | 1,183,580 (1,088,896 cached) |

Monetary cost is unavailable, not zero. Tool wrappers count outer `exec` calls,
not nested shell reads. No inspection-efficiency claim follows from these
figures. Early source-inspection calls read host-installed skill files
outside the pinned clone: S1 used `.codex/skills/qa-check/SKILL.md`, S2 used
`.codex/skills/qa-check` and `.codex/skills/qa-product-v0`, and S3 used
`.agents/skills/freeland-release-qa/SKILL.md`. Subsequent tool calls inspected
the selected clone. This **violates the predeclared clone-only source protocol**;
preserve the answers but do not count this run as a clean source-selected W7
first-route qualification or installed-host qualification. All three native
`turn_context` records retained ambient cwd
`/Users/danilsolomin/projectsnew/NuanuFlowQA` and its task instructions;
individual source-inspection shell calls explicitly set the clone as workdir.
The clone is the inspected source, not the actor's sole host context. Native tool calls
seen in these three logs were local file/source inspection; no product,
provider, tracker, account or workspace-repair command was observed. AQA must
independently check both the content and the protocol boundary.

## S1 — first final answer, verbatim

~~~markdown
Для существующего QA Starter workspace маршрут — `$qa-check` → `$qa-product-v0`, без повторной регистрации. После уточнения владельца кампании, её закреплённого Console-runtime, абсолютного пути workspace и точного run ID штатный read-only запрос — `npm run qa-campaign -- status --workspace <путь> --run-id <ID>` из выбранного Console checkout. Он возвращает сохранённый receipt и не запускает проверки; `ok: true` у чтения не означает `PASS`. Итог, статусы проверок и `blockedTargets` нужно сопоставить с графом/каталогом и checkpoint, сохранив непроверенное как непроверенное. [Маршрутизация](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/skills/qa-check/SKILL.md:14), [контекст workspace](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/console/skills/qa-product-v0/SKILL.md:10), [контракт status](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/docs/qualification/ordinary-campaign-status-20260921.md:15), [вывод CLI](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/console/scripts/qa-campaign.ts:663).

Нет, просто `resume` позже недостаточно: это не команда просмотра и не универсальное продолжение завершённого обычного запуска. Поддержанный `resume` относится к отдельному v1-протоколу с уцелевшим владельцем/унаследованным host-каналом и ограничениями на replay; для новой проверки оставшегося объёма понадобятся конкретный план, текущие привязки и отдельная актуальная авторизация. [Ограничение resume](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/console/scripts/qa-campaign.ts:692), [семейства возможностей](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/docs/qualification/w7-capability-family-inventory-20260924.md:40). Сейчас путь, ID, закреплённый runtime и текущий build не предоставлены, поэтому сам результат и остаток неизвестны; следующий безопасный шаг — запросить эти идентификаторы у владельца и лишь затем выполнить точное чтение. Я проверил только локальный источник, не workspace или продукт; наличие команды в исходниках не подтверждает её поддержку установленным host.
~~~

## S2 — first final answer, verbatim

~~~markdown
Сначала нужно установить точный путь существующего workspace, его владельца и закреплённую версию Console/Kernel. Перенос сам по себе не даёт права менять регистрацию или подменять её новой. [Маршрут владельца](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/products/README.md:8)

Первый диагностический шаг в подходящем runtime — `qa-starter validate --workspace <абсолютный-путь> --json`. Он читает workspace и возвращает `valid` и диагностику по путям: например, `MANAGED_FILE_MISSING` при отсутствии записанного файла и `MANAGED_FILE_DRIFT` при несовпадении его содержимого с digest. Невалидный результат имеет код выхода 4; это ещё не решение о восстановлении. [CLI](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/kernel/src/cli.ts:172) · [Проверка файлов](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/kernel/src/kernel/workspace-validator.ts:1007)

Дальше, если формат workspace поддерживает эту операцию, `regenerate --preview` только показывает по каждому пути `create/update/delete/unchanged/blocked_drift` и digest плана. Уже меняют локальное состояние `regenerate --apply --preview-digest …` (транзакционная регенерация), `regenerate --recover --transaction-digest …` (восстановление конкретной прерванной транзакции) и `ownership adopt --path … --content-digest …` (принятие изменённого существующего файла с обновлением записи о владении). `apply` отвергает устаревший preview и `blocked_drift`; `adopt` не подходит для отсутствующего файла и блокируется посторонними нарушениями целостности. [Команды](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/kernel/src/cli.ts:178) · [Ограничения apply](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/kernel/src/kernel/workspace-regenerator.ts:1361) · [Ограничения adopt](/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/kernel/src/kernel/workspace-regenerator.ts:2516)

Сейчас неизвестны workspace, его формат, повреждённые пути, digest, владелец и полномочия на исправление; поддержка этих команд в установленном runtime также не проверена. Я изучил только исходники — диагностику workspace и восстановление не запускал. Следующий безопасный шаг: получить от владельца точный путь и закреплённый runtime, затем согласовать запуск одной `validate` и разобрать её фактический отчёт; способ исправления выбирать только после этого.
~~~

## S3 — first final answer, verbatim

~~~markdown
Да, в исходниках есть штатный controlled lane для `TC-ВХОД-05`, поэтому метка «ВМЕСТЕ» в старом кейсе сама по себе не означает, что проверку нужно вести вручную. Но этот lane проверяет восстановление на **новом одноразовом staging-аккаунте**, а не на уже существующем тестовом аккаунте: он создаёт Mail.tm-ящик и Freeland-аккаунт, запрашивает письмо сброса, меняет пароль и проверяет отказ старого и вход нового пароля. Ящик удаляется; удаление пользователя Freeland не подтверждается. См. [кейс](</Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/freeland/docs/local/freeland/MANUAL-TEST-CASES.md:558>), [сценарий](</Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/freeland/tests/freeland-controlled-password-recovery/tc-vhod-05.spec.ts:178>) и [cleanup](</Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/freeland/tests/freeland-controlled-password-recovery/tc-vhod-05.spec.ts:469>).

**Сейчас запускать нельзя.** Наличие кода не подтверждает установленный у текущего владельца runtime, живую сборку, пригодность Mail.tm или разрешение на побочные эффекты. Runner требует точный staging origin, привязку к source/build/project и краткоживущий одноразовый authorization receipt после отдельного action-time approval; этих данных и подтверждения здесь нет. См. [runner](</Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/freeland/tools/freeland-replacements/run-tc-vhod-05-controlled-recovery.mjs:196>) и [authorization](</Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/freeland/tools/freeland-replacements/issue-tc-vhod-05-authorization.mjs:27>).

Даже успешный сбор evidence сначала даёт `NEEDS_AGENT_REVIEW`; binding остаётся `shadow`. Возможный `PASS` требует отдельного агентского решения и проверенного readback, не означает автоматический release verdict или приёмку восстановления **конкретного существующего аккаунта**. Следующий безопасный шаг — у текущего владельца кампании уточнить, нужен ли fresh-account сценарий или именно retained-account recovery, затем сверить его frozen runtime, staging build, fixture и полномочия; до этого никаких account-действий не выполнять. См. [результат runner](</Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/freeland/tools/freeland-replacements/run-tc-vhod-05-controlled-recovery.mjs:191>), [агентскую квалификацию](</Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/components/freeland/tools/freeland-replacements/tc-vhod-05-agent-decision.mjs:105>) и [правило владельца](</Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924/products/README.md:3>).
~~~
