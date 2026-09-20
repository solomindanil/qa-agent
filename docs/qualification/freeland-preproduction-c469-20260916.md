<!-- QA_LOCAL_HISTORY_20260920 -->
> Historical record retained during local consolidation on 20 September 2026. Status, approvals, pauses, source paths and next actions below belong to the original dated scope; they are not current instructions, new test results or execution authority. Use the [current checkpoint](current.md) and [consolidation index](local-consolidation-20260920.md). Private/absolute historical evidence links are optional locators, not clone prerequisites. Original body bytes are preserved below.
<!-- /QA_LOCAL_HISTORY_20260920 -->

# Freeland: полный staging QA на c469 — 16 сентября 2026

## Результат

**Полная штатная кампания завершена: `BLOCK_RELEASE` (shadow), не общий QA PASS.**
Это результат QA-инструмента с сохранёнными failures и пробелами, а не утверждение о 76 новых продуктовых дефектах. Агентская диагностика ниже отделяет их от ошибок тестов. Готовность выкладки/операторское решение пользователь оставил Никите; продукт и prod не менялись, новых покупок/переводов не было, Flow/Buzz не изменены.

Кандидат `c46911d99ef5da75f26e19866a5d429beba3fb90`, staging `https://mf0.forum`.
Read-only prod baseline `98262828a3f506a6e5ce9094968bed917433abc6`, divergent exact trees от `da968f363c4b9791cbc5b391a0f6ac6efab9a9a2`. Отсутствие ancestry не выдано за отсутствие production-only изменений.

Изолированный QA source checkpoint `377354b2ad8d98c5efe104919b41ed5d7a93352e`: 46 ранее reviewed repairs, 569 source paths сверены с runtime владельца; без push и смены manifest/installed skills. Корпус `sha256:2b5b9e8acbe88a89ef4efe9c81f2fe134eb51356cbd2b0919fee6704ca2e34de`.

Native campaign `sha256:8e4001f3632145f358e2e040efff3d3dfd5c12c6b1bd5d80be6ab85dc615bebc`.
Generation `cd24a7e223ed384608a4d851825342658a4c97e5075f401d0ebc15b910ef531d`, evaluated `2026-09-16T14:37:36.585Z`.
Последний supplemental runtime readback `2026-09-16T14:48:13.951Z`: exact SHA, API/public/profile/manifest стабильны; admission освобождён.

## Выполненные проверки

| Уровень | Факт |
| --- | --- |
| Graph-first | Build, structural validation, full plan и dry-run выполнены; 328 changed files / 259 unmapped → полный набор, а не необоснованное сужение; 176 coverage/locator замечаний сохранены |
| Startup | 10/10, HTTP 200, exact SHA, без observed JS/5xx/nonstart |
| Desktop | 268 product tests + setup: 157 expected outcomes, 73 unexpected, 22 flaky, 17 skipped; в expected входят setup и 2 expected-fail |
| Mobile | Pixel 5 + iPhone 13: 5 pass, 2 expected-fail, 3 readiness/timeout failures |
| Sealed aggregation | 278 tests: 181 passed, включая 22 retry-pass; 76 failed; 4 expected_failure; 17 skipped |
| Sequential diagnostic | 8 product checks + setup PASS; один eSIM-catalogue deadline failure; original assertions/timeouts и исходный receipt не менялись |
| Readiness observation | Cold guest form и eSIM countries/regions функциональны после загрузки; guard закрыт, без покупок, дополнительный пакет не заменяет campaign |
| Exact product offline | 135 API + 134 web behavior tests PASS; treasury/replay/continuation/checkout и CardPage/PaySheet/recovery; сеть запрещена |
| Official CI | PR426 CI tree равен c469: API 2580, API contract 224, web behavior 643, web source-contract 164 PASS; это не live E2E и не новые уникальные проверки поверх локального subset |
| QA tool | До запуска `qa:verify` 2862 PASS. Финальный `qa:verify:all` exit0, 3065/3065 PASS, zero failure/skip; typechecks/provenance/private preflight/baseline/Console build PASS |

Final gate370.1с: source/status, current graph и артефакты свежей кампании остались неизменны; snapshot отличается только21новым локальным dry-browser fixture output. Это не corpus drift и не перезапись evidence. Зелёный self-test инструмента не меняет продуктовый `BLOCK_RELEASE`.

Sequential PASS: гостевые `/wallet` и `/app/card` → welcome; private endpoints 401; target-payment matrix / Card+SBP capabilities; session reload; безопасный tokenless reset; RU support receipt.

## Реальные продуктовые наблюдения

- **FREEL-424-класс:** RU Wallet выводит английское `Insufficient available balance to place a hold.` в обоих attempts.
- **Freeman:** support control выходит за viewport390 до397.109px.
- **FREEL-293:** loaded Pixel5 `/join` не имеет semantic H1. iPhone упал раньше, до готовности route, и не считается повторным доказательством этого бага.
- **Медленная загрузка, причина не установлена:** guest startup-ready17.9с, Email-form25.7с; eSIM shell16.9с, countries26.3с. API200 вернул1560plans, в UI152priced values, regions92мс. Это ограниченное QA/mesh наблюдение с заблокированными посторонними чтениями, не доказанный regression к prod и не формальный performance benchmark.
- Исторические FREEL-285/FREEL-247 не объявлены исправленными. В этом suite FREEL-247 expected failure остановился на readiness, до своей целевой assertion.

## Что мешает достоверному общему зелёному QA

1. В47 последних desktop failure snapshots есть startup splash; в других — `Loading`, пустая route или незаконченная загрузка payment-options. Это не47 доказанных продуктовых поломок, но остальные проверки без повторного свидетельства не превращены вPASS.
2. Два Card/SBP теста безусловно ждут fee внутри кнопки метода, хотя нулевая комиссия намеренно не показывается в этой плитке; выбранные суммы нужно сверять с breakdown и итогом. В card issue обнаружены ожидание незагруженного внутреннего PaySheet и неоднозначный селектор комиссии. Первоначальная гипотеза о неверном названии диалога опровергнута: внешнее «Выберите способ оплаты» и внутреннее «Выбрать способ оплаты» намеренно различаются. Их ремонт — работа QA, не продуктовый баг для Никиты.
3. Два known-issue теста упали до целевого условия (FREEL-247, iPhone join). Expected-fail не доказывает воспроизведение и требует исправления предусловий.
4. Warm PWA recovery не достиг предусловия настоящего SW controller за10с. Cold mismatch guard прошёл; warm recovery остаётся недоказанным.
5. Replacement lanes:8 stale receipt,7 pool/role blocker; recovery остановился на Mail.tm mailbox lease (`MAILTM_HTTP_STATUS_INVALID`, cleanup partial/unknown) до navigation/reset; public shadow VALID без promotion. Новое письмо и смена пароля этим проходом не подтверждены. Ledger reservation не равен выполненному действию.
6. В generation22release+67advisory cases pending. Это не89 заданий человеку: часть имеет отдельное/историческое evidence, которое нельзя просто перенести датой в sealed receipt. Нужны корректная привязка и конкретные missing fixtures, а не повтор всех покупок.
7. Flow connector authentication/app403: актуальные states не перечитаны, переходы/комментарии не выполнялись.

## Исправления и оставшиеся контракты

[FREEL-440 на c469](freeland-freel440-c469-20260916.md): выбранный wallet$10 →2%/$0.20, отдельные Card/SBP quotes; dry-switches не наследуют stale fiat fee/limit в проверенных ветках; второй PaySheet сверен по6API breakdowns. First-sheet funded Freeland Balance — component coverage, не live spend.

FREEL-441 сохраняет dry-приёмку bd650 (direct crypto и Card→crypto exact$35; wallet/crypto35+0, Card/SBP/Freeland31+4). Текущий CardPage/PaySheet subset прошёл; новой оплаченной выдачи не было.

**FREEL-435 и FREEL-439 приняты: FIXED по согласованному объёму. Новых требований к пользователю по этим двум тикетам нет.** FREEL-435 сохраняет ранее согласованную logs/replay-приёмку тарифа2%, без нового перевода. FREEL-439 сохраняет составную приёмку: собственное первое холодное открытие свежей ссылки до формы + developer password rotation/login/reuse evidence. Core code обоих исправлений после fd50 не менялся, текущий focused subset PASS. Это указание происхождения доказательств, не новый блокер и не требование повторить денежную операцию или смену пароля. Mail.tm preflight failure не является возвратом439. При этом фактический новый статус в Flow без readback не заявляется.

## Повтор загрузки и Freeman — 16 сентября, 15:15–15:18 UTC

Без изменения тестов повторён прежний guarded diagnostic в отдельной копии; старые результаты сохранены. Cold guest Email: **10.266с** (startup-ready9.468с); eSIM countries: **9.690с** (startup-ready4.043с), regions90мс. PlansAPI200/1560plans,152pricedUIvalues, guard завершён, admission освобождён, exact c469/profile/public/manifest до/после совпали. Зависания в этом повторе нет; прежние25–26с не повторились. Один повтор с mesh/guard не является performance benchmark или доказательством отсутствия нестабильности.

Freeman дополнительно воспроизведён в пользовательском in-app browser: `/app/freeman`, RU,390×844, environment verified/startup ready. Край ссылки «Открыть поддержку» (наушники в правом верхнем углу) **397.109375px** при viewport390: примерно7.1px за краем. Это обрезание кнопки в шапке, не текста чата. Скриншот показан в диалоге; после проверки viewport сброшен, браузер возвращён на `/app/card`. Private repeat packet: `freeland-load-recheck-20260916.IK0QVV`.

После подтверждения пользователя выполнен [ремонт харнеса и targeted recheck 17 сентября](freeland-harness-readiness-repair-20260917.md):35 product PASS +setup +2 подтверждённых expected-fail293, без retries/skips/unexpected. Warm PWA controller/recovery теперь подтверждён в этом новом отдельном срезе. Исходная full campaign выше не переписана; её автоматические и manual gaps не считаются закрытыми только из-за ремонта.

Оплаченные VELVET/VIP/eSIM/номер и owner/other/guest readbacks остаются со своими SHA и границами. Не заявлять свежий payment E2E по старой операции. Остаточные функциональные gaps: native Telegram/Stars/relink; positive email/SMS content/copy; sensitive card details/copy; funded/held/mixed-source и денежные idempotency/conflict scenarios, где исторического evidence недостаточно; warm PWA/mobile traversal. Физический VPN/eSIM traffic не добавляется в обязательный scope только из manual label.

## Следующий конечный шаг

- QA: синхронизировать route/data readiness, обновить3 stale payment assertions, исправить known-failure предусловия, перепроверить затронутый набор, warm PWA и mobile traversal; при изменении корпуса получить новую generation. Не маскировать исходные failures и не убирать реальные бизнес-assertions.
- QA + Никита: локализовать медленную загрузку обычным browser/network наблюдением. Пока нет доказательства, что это новый product defect или только тестовый эффект.
- Никита/владелец риска: определить допустимость известных424/285/247/293/Freeman; deployment readiness остаётся его решением.
- QA: привязать достаточные существующие доказательства; запросить человека только для конкретного отсутствующего fixture/действия. Новая покупка — только для точно недоказанного контракта с отдельным согласованием.
- Восстановить Flow access для формальной фиксации. Отчёт можно передать без доступа, но статус тикета не придумывать.

Private raw packet: `freeland-release-c469-20260916.yu2AJ5`: native receipts/raw reports, `TRIAGE-INDEX.json` (279 outcomes с setup), diagnostic/readiness snapshots, source/CI logs. Это доступный в репозитории переносимый summary без секретов, не публичная ссылка на приватные артефакты и не новый компонентный adoption. [Глобальный план](../superpowers/plans/2026-09-16-cross-product-qa-global-plan.md) по-прежнему на паузе.
