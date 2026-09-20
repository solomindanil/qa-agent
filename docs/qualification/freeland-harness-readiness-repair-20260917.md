# Freeland: ремонт readiness и payment expectations — 17 сентября 2026

## Итог среза

Исправлен QA-харнес, не продукт. Targeted staging recheck завершён без неожиданных ошибок на exact `c46911d99ef5da75f26e19866a5d429beba3fb90`: **35 product PASS + setup PASS + 2 подтверждённых expected-fail FREEL-293**. Ноль retries, flaky и skips. Playwright печатает `38 passed`, но это 38 ожидаемых исходов, не 38 исправных продуктовых сценариев.

Это самостоятельная диагностика исправленного корпуса, **не новая sealed release generation и не общий Go**. Исходный полный `BLOCK_RELEASE` от 16 сентября и его доказательства сохранены без изменений. Решение о выкладке пользователь оставил Никите. Продукт, production, деньги, Flow/Buzz и установленные skills не менялись.

## Что исправлено

- Cold navigation ждёт проверенное окружение и готовность приложения; eSIM ждёт именно строки загруженного каталога. Видимый shell или сумма кошелька больше не доказывают готовность каталога.
- Responsive-проверки ждут содержимое конкретного маршрута перед измерением геометрии. Desktop routes разделены на независимые bounded cases. Мобильный каталог сохраняет прежние пять идентичностей на устройство: внутри viewport-case остаются все шесть маршрутов с отдельными awaited steps и конечным суммарным бюджетом.
- Таймауты рассчитаны по фазам конкретных сценариев; глобальные navigation/action/test defaults не увеличены. Все шесть Card/SBP callbacks устанавливают180с до первого browser action:45с startup больше не помещается в прежний общий30с лимит. У сервера 404 не требуется несуществующая SPA readiness.
- Card/SBP ждут ответ payment-options и сверяют выбранные principal/fee/total с breakdown. Допускается настоящий zero-fee без обязательной подписи комиссии в плитке. Различены внешний выбор оплаты, внутренний PaySheet и summary выбранного метода. Сохраняются проверки RUB, FX/expiry, VIP included fee/нулевого opening balance и запрет создания checkout.
- Warm PWA ждёт настоящий активный same-origin `/sw.js` controller; тест сам не регистрирует worker и не выполняет «спасательную» перезагрузку.
- FREEL-247/293 expected-fail начинается у целевой проверки, а не перед startup-предусловиями.
- Session continuity после reload использует прямые DOM assertions готовности, затем прежние URL/wallet assertions. Дополнительная навигация и непрозрачный helper после reload запрещены защитной проверкой исходников. Разрешены только конечные статические timeout budgets.

## Как проверено

TDD-контроли исполняют настоящие зарегистрированные Playwright callbacks/helper/PageObject с локальным Chromium, а не отдельную имитацию оракула. Воспроизведены RED → GREEN для ложного принятия shell, неверных/нулевых котировок, позднего overflow, loading/missing route content, PWA без ожидаемого controller и ошибочного ожидания SPA на серверной 404. Новые контрольные наборы: app13, payment26, cold/mobile22, public78; PWA13. Шесть payment-контролей проверяют bounded budget до первого browser action. Это пересекающиеся проверки самого инструмента, не дополнительные live-проверки продукта.

Независимый Lead AQA review нашёл и помог закрыть три важных дефекта ремонта: ранний замер overflow, server-404 readiness и скрытая навигация внутри post-reload helper. Последний подтверждён исполняемым отрицательным тестом; финальный review APPROVED, включая проверку локального и импортированного навигирующего helper. Последующий six-budget delta отдельно APPROVED. Полный private preflight regression:190/190 PASS. **Финальный `qa:verify:all`: exit0,3219/3219 PASS,0fail/skip**; provenance, typechecks, private bindings, baseline, canary и Console build PASS. Неблокирующий Vite chunk-size warning сохранён; сборка завершена успешно.

Graph-first build, structural validate, full plan и dry-run — exit0. Финальный корпус `sha256:26f1e75dbca387a608060fb08de3dc1b0d35e683bd011a1660ae4501accd6686`; plan содержит279 desktop +10 mobile и89 manual/advisory cases. Все176 прежних graph coverage/locator замечаний сохранены; strict coverage не объявлен зелёным.

Первый live recheck до последней правки six-case budget: `2026-09-16T16:48:00.796Z` → `2026-09-16T16:50:07.222Z` (17 сентября по Bali), корпус `sha256:47a7a6cfa55eb2542522ccf981b71615fb0d6b386173e04da2495bb636d077db`. SHA/profile/public-build/manifest до и после совпали; global admission освобождён; child exit0. Два workers, retries0. Report SHA256: `de3b51ce7387db9ead3e400c7626ea27035d8a371c446a08b2ff9a196938d66f`. Финальный повтор сохраняется отдельно под `final-recheck/`, первый пакет не переписывается.

**Финальный live recheck** на корпусе `26f1e75d…`: `2026-09-16T16:57:51.095Z` → `2026-09-16T16:59:57.537Z`, child exit0, admission released; before/after exact c469/profile/public/manifest совпали. Те же35product PASS +setup +2expected-fail293, zero retries/skips/flaky/unexpected. Report SHA256: `3dfb0a74b128bb8f4ecfccd93e741844b8d7ae02a0a54597c3c422d6b1152b06`. По точному project/file/title совпадению с исходным TRIAGE:18 ранее unexpected и5 ранее flaky теперь имеют свежий PASS. Это не означает закрытие всех76 failures или доказанное отсутствие любой нестабильности.

Подтверждены: anonymous access gates, tokenless recovery, session reload, welcome/главный лендинг/VPN/card landings, eSIM countries+regions, основные app sections, 375px route geometry и desktop navigation, Card/SBP capabilities+eSIM+number+card issue+VPN account-state flow, warm PWA, оба мобильных viewport обхода. Денежного checkout не создавали. Активная VPN-подписка проверялась как account-state branch, а не как новая покупка.

## Что этим не закрыто

- Остальной полный продуктовый suite ещё не повторён этим корпусом. Прошлые76 failures не превращены автоматически в PASS.
- FREEL-293 воспроизводится на Pixel5 и iPhone13 после успешных startup/content preconditions.
- Freeman support control по-прежнему выступает за правый край при390px; документ без горизонтального overflow не доказывает, что отдельный элемент не обрезается. Его отдельная прежняя репродукция не отменена.
- Исторические424/285/247, прочие gaps и неисполненные replacement lanes остаются в исходном отчёте; этот ремонт не является их приёмкой.
- FREEL-435/439 остаются FIXED по ранее согласованному объёму; этот срез не требует повторять перевод или смену пароля. 440/441 сохраняют scoped dry acceptance.

## Возобновление

Следующий шаг — полный повтор исправленным корпусом и отдельная классификация оставшихся ошибок. Для нового sealed verdict нужна новая generation с актуальными привязками; не редактировать старый receipt.

Isolated QA base: `377354b2ad8d98c5efe104919b41ed5d7a93352e`, branch `codex/freeland-harness-readiness-20260917`. Private packet: `freeland-harness-readiness-20260917.tf5CUo` — runtime, graph-plan-frozen.log, preflight-tests.log, qa-verify-all-final.log, recheck-repaired.mjs, diagnostic-runtime-summary.json и diagnostic-report.json. Этот текст переносим и не требует приватных credentials для понимания результата. Canonical component adoption/push этим срезом не заявлены.
