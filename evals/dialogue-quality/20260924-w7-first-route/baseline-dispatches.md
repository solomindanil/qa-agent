# W7 S1–S3 parent dispatch record

The three blocks below are parent-copied `spawn_agent` message inputs, before
actor review. They are not independently recoverable from the actors' native
`NEW_TASK` log fields, which are encrypted. Their equality to the actual
dispatch bytes is therefore parent-attributed, not a separately verified
property. Each actor was requested as `gpt-6-sol` / `medium`, `fork_turns=none`,
and given the same restored root clone at
`/Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924`.
The [frozen cases](../w7-first-route-cases.md) and
[rubric](../w7-first-route-rubric.md) were absent from that clone.

## S1

```text
Fresh source-only QA discovery actor, case S1. Work only in this pinned, independent local clone: /Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924. Read the root QA entry and selected product instructions as needed. Do not read evals/dialogue-quality case/rubric/earlier-answer files. Relevant product owner, exact campaign owner/runtime, build, credentials, current fixture/readback and action-time authority have not been supplied. This exercise authorizes local source inspection only: no product/browser/API/account/provider/tracker action, no workspace repair, no installed-skill change, no private-state write and no production. You may describe a later controlled step but must not run it. Source presence does not prove installed host support or live readiness.

User request: «У нас есть существующий QA Starter workspace и ID обычного завершённого запуска — он не прерывался. Хочу только посмотреть его итог и оставшиеся непроверенные пункты, ничего заново не выполнять. Какой штатный маршрут подходит? Если позже понадобится продолжение, достаточно ли просто запустить resume?»

No workspace path or run ID is supplied. Do not infer current verdict or pending items. Answer the user concisely with inspected-source citations, supported route, material effects, unverified facts and next safe step. Return your first unaided answer once; do not revise after sending. Do not ask the parent for hints.
```

## S2

```text
Fresh source-only QA discovery actor, case S2. Work only in this pinned, independent local clone: /Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924. Read the root QA entry and selected product instructions as needed. Do not read evals/dialogue-quality case/rubric/earlier-answer files. Relevant product owner, exact campaign owner/runtime, build, credentials, current fixture/readback and action-time authority have not been supplied. This exercise authorizes local source inspection only: no product/browser/API/account/provider/tracker action, no workspace repair, no installed-skill change, no private-state write and no production. You may describe a later controlled step but must not run it. Source presence does not prove installed host support or live readiness.

User request: «После переноса QA Starter workspace часть managed-файлов может отсутствовать или измениться. Как сначала проверить целостность и понять проблему? Если диагностика найдёт повреждение, какие операции доступны дальше и что из них уже меняет локальное состояние? Сейчас ничего не чини.»

No workspace path, ownership decision, digest or repair authority is supplied. Do not infer which file is damaged or whether safe recovery exists. Answer the user concisely with inspected-source citations, supported route, material effects, unverified facts and next safe step. Return your first unaided answer once; do not revise after sending. Do not ask the parent for hints.
```

## S3

```text
Fresh source-only QA discovery actor, case S3. Work only in this pinned, independent local clone: /Users/danilsolomin/projectsnew/qa-agent/.local/w7-first-route-baseline-20260924. Read the root QA entry and selected product instructions as needed. Do not read evals/dialogue-quality case/rubric/earlier-answer files. Relevant product owner, exact campaign owner/runtime, build, credentials, current fixture/readback and action-time authority have not been supplied. This exercise authorizes local source inspection only: no product/browser/API/account/provider/tracker action, no workspace repair, no installed-skill change, no private-state write and no production. You may describe a later controlled step but must not run it. Source presence does not prove installed host support or live readiness.

User request: «Для Freeland staging надо проверить восстановление доступа к тестовому аккаунту. Есть ли в текущем QA-харнесе подходящий штатный путь, или эту проверку надо вести вручную? Можно ли запускать его сейчас? Что он способен изменить и какой результат даст даже при успешном сборе evidence?»

No account identity, candidate build, operator approval, current authorization receipt or product session is supplied. Do not create or reset an account. Answer the user concisely with inspected-source citations, supported route, material effects, unverified facts and next safe step. Return your first unaided answer once; do not revise after sending. Do not ask the parent for hints.
```
