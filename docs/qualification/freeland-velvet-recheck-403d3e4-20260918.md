# Freeland: повторная проверка VELVET после фикса и полная кампания на 403d3e4 — 18 сентября 2026

## Итог

- Staging `https://mf0.forum` перешёл с `c46911d99ef5da75f26e19866a5d429beba3fb90` на **`403d3e4459c3b00a98fccfb9e99bca9f4c675972`** (profile `0d5587cfac70…` прежний, build manifest `a21e14f4373d…`). Между ними 7 коммитов Никиты от 17 сентября: PR #427 «Fix expired VELVET recovery and onboarding guidance» (merged 09:15 UTC) и PR #428 «Show VELVET setup guide before purchase» (merged 15:52 UTC, merge commit = 403d3e4).
- **Пункт 1 (истёкший старый VPN → покупка VELVET недоступна): FIXED на исходном аккаунте.** Тот же аккаунт, что 17 сентября показывал `EXPIRED · автопродление включено` и баннер недоступности, сегодня без новых VPN-операций показывает активную VELVET-подписку с гайдом. Отдельная живая негативная фикстура `expired TurboPatriot + auto_renew=true` на staging отсутствует, поэтому эта комбинация как самостоятельный live-контроль остаётся **UNASSESSED** и покрыта тестами разработчика и кодом миграции.
- **Пункт 2 (минимальное обучение подключению): FIXED** в Web (375 и 1440) и в нативном Telegram Mini App. Импорт реального ключа в клиент не выполнялся.
- **Полная кампания 1 на 403d3e4: `BLOCK_RELEASE`** (generation `43d4c581…`). Автоматика: 262 PASS / 5 FAIL / 4 expected-fail / 18 skipped из 289, старт 10/10, mobile 10/10. Ни один из пяти блокеров не новый относительно c469: три это устаревший VPN-контракт самого харнеса после смены UI, один известный класс FREEL-424 (английская строка в Wallet), один SEO-06 (`/ru`, `/en` отвечают 301 на trailing slash). 89 manual pending, 22 release-tier.
- **Полная кампания 2 на 403d3e4 (QA-источник `aa1d0ae` с исправленным VPN-контрактом, роль A1 привязана к purchase-аккаунту): `BLOCK_RELEASE`** (generation `4abe79ab…`). 263 PASS / 4 FAIL / 4 expected-fail / 18 skipped из 289. Из четырёх падений два известных продуктовых (Wallet-строка, SEO-06) и два харнесных под параллельной нагрузкой (inbox read-state, welcome), оба проходят при отдельном запуске. Replacement lanes: 15 blocked (8 stale owner-receipts, 5 без pool-ролей, 2 A1-лейна упёрлись в недоступность VPN/Card issue для stand-in аккаунта), 1 pass, 1 fail на Mail.tm. Новых продуктовых дефектов после PR #427/428 не найдено.

- **Проход ручного чек-листа (89 кейсов), 07:10–08:35 UTC, unsealed, read-only:** 22 PASS, 22 PASS в агентской части, 6 FAIL, 2 расхождения каталога с новым окном оплаты, 3 N/A по конфигу стенда, 4 BLOCKED по фикстурам, 30 только с человеком. Подтверждены своими повторами новые отклонения: шаг крипто-пополнения просит сумму ниже минимума (eSIM 0,46 $ → «Оплата 0.46 USDT TRC20» при минимуме 5 USDT), неверный текст минимума для карты/СБП, «назад» при открытом окне оплаты уводит из раздела, ссылка Karing с испорченным `attempt` принимается, английская история кошелька в RU шире одной строки. Ворота У0 не закрыты только из-за TC-SERV-01 (нет аккаунта с четырьмя продуктами); из 17 У1 закрыто 8, остальные 9 требуют человека, телефона или денег.

Продукт, production, деньги, tracker/Buzz и installed skills не менялись. Новых платежей не было. В проходе чек-листа до сервера не дошло ни одного изменяющего запроса: guard отменил 8 авто-запросов `POST /api/inbox/read-state`, которые приложение шлёт само при открытии письма; TC-ВХОД-06 выполнил 6 неверных и 1 верную попытку входа на purchase-аккаунте; для диагностики Mail.tm один раз создан и сразу удалён одноразовый ящик на публичном сервисе. Единственные побочные эффекты: одна попытка `create_test_account` + `external_email` внутри лейна TC-ВХОД-05 по действующей standing authorization; лейн упал на аренде ящика Mail.tm до навигации.

## Идентичность и источники

| Что | Значение |
| --- | --- |
| Staging `/api/environment` до и после | `releaseSha=403d3e44…`, `deployTarget=staging`, `deployPhase=active`, `profileDigest=0d5587cf…`, `buildManifestId=a21e14f4…`; `environment-manifest.json` `gitSha=403d3e44…`; чтения 04:21, 04:35, 04:49 UTC совпали |
| Production `/api/environment` (только чтение, для baseline) | `releaseSha=98262828a3f506a6e5ce9094968bed917433abc6`, как 16 сентября |
| Read-only product mirror | `.local/freeland-velvet-recheck-20260918.W8HApt/product`: клон `nuanu-ai/freeland_app`, push URL `DISABLED_BY_USER_REQUEST`, detached `403d3e4` (`origin/staging`) |
| QA runtime | `.local/freeland-harness-readiness-20260917.tf5CUo/runtime`, ветка `codex/freeland-harness-readiness-20260917`. Новый локальный коммит **`a5c879c`** содержит ранее reviewed final-budget repairs (23 M + 4 A); байты рабочего дерева не менялись, `graph.json` не коммичен. Без коммита `qa-source-authority.mjs` отклоняет кампанию как `QA_SOURCE_REPOSITORY_DIRTY`. Ничего не push. Canonical `components/freeland` 3ee1cb3 не менялся |
| `npm run qa:verify` | exit 0: 1551 + 670 + 70 PASS; private preflight `bindingsVerified:true`, `qualifiedBindingCount:8`, `qaCorpusDigest sha256:26f1e75d…` (корпус ремонта 17 сентября) |
| Граф | build `sha256:96036218ad81e05d3b513ca442f12021607a4df20c348c076daa9d35b8e5d68f` по 403d3e4; structural validate ok; strict coverage debt сохранён (36 excluded-without-automation, 37 without-test-owner, 85 unresolved locators, 17 orphans). Отдельный `qa:plan` требует production-baseline attestation и runtime-identity preflight кандидата, их пишет trusted preflight кампании; план построен внутри `qa:run` |
| Пул аккаунтов | `qa:pool status`: все шесть ролей `unconfigured` (ключей `FREELAND_POOL_*` в `.env` нет); `FREELAND_TEST_CARD_*`, `FREELAND_TG_STRING_SESSION` отсутствуют → денежные и pool-lane'ы BLOCKED типизированно |
| Окружение | `.env` из `/Users/danilsolomin/projectsnew/NuanuFlowQA/.env` (историческая зависимость), права `0644` при требовании runbook `0600`; mesh `100.64.0.7`, Tailscale активен |

## Что изменил Никита (diff c469..403d3e4: 15 файлов, +1391/−102)

- `apps/api/src/services/vpn-subscriptions.ts`: `expireSubscription` удалён; failed pre-provider renewal идёт через RPC `fail_and_terminalize_vpn_wallet_renewal_before_mutation`; `canReplaceWithFixedTermInventory` по-прежнему требует raw `auto_renew=false`, но терминализация теперь выставляет его атомарно.
- `supabase/migrations/20260917100000_terminalize_failed_legacy_vpn_renewal.sql`: advisory lock по пользователю; attempt без мутации; ровно одна failed/voided/expired/reversed `vpn_renew` money-операция без holds; отсутствие конкурирующих renewal/lease/purchase/checkout/velvet-операций; затем `status='expired', auto_renew=false` и CRM-событие; `service_role` only; `DO $repair$` backfill уже застрявших строк.
- Web: `GenericVpnSetupGuide` (`#vpn-setup-guide`, три шага, Happ/Incy ссылки из `vpn-client-install-links.ts`, копирование, QR, ручная ссылка, support); PR #428 выбирает pre-purchase guide по `preferredClient` из `/api/vpn/status`; `SupportPage` делит quick fixes: `generic_subscription` → «Проверки подключения VELVET» + «Вернуться к инструкции VPN», `karing` → прежние подсказки и видео, `unknown` → нейтральный блок. Аналитика/логи с приватной ссылкой в diff не добавлены.
- Валидация по PR: API contracts 79/79, PostgreSQL integration 45/45, web behavior 654/654, tsc чисто; «not verified on a real device yet».

## Пункт 1. Истёкший старый VPN → покупка VELVET

### Исходный аккаунт (Telegram Mini App пользователя = `FREELAND_STAGING_TEST_*`)

Совпадение установлено по балансу `0.11 USD`, активному eSIM и дате окончания подписки 12 октября 2026 в TMA и в `/api/vpn/subscription` test-аккаунта.

История VPN-операций (`/api/me/money-operations`, read-only, всего 5 операций):

| Дата (UTC) | Операция | Провайдер | Статус | Сумма |
| --- | --- | --- | --- | --- |
| 2026-07-27 14:25 | `vpn_activate` | turbopatriot | posted | 5.00 USD, external_lava_direct |
| 2026-09-02 07:35 | `vpn_reactivate` | turbopatriot | **failed `INSUFFICIENT_AVAILABLE_BALANCE`** | 5.00 USD, wallet |
| 2026-09-12 12:24 | `vpn_activate` | velvet | posted | 5.00 USD, external_lava_direct |

После 17 сентября операций нет. Неудачное продление 2 сентября это ровно pre-provider failure, который оставлял legacy-строку с `auto_renew=true`; repair-блок миграции терминализирует такие строки. Наблюдавшийся 17 сентября тупик и сегодняшнее состояние различаются только деплоем.

Сегодня на 403d3e4:

- TMA «Мои сервисы»: VPN «Активен · ручное продление». Экран VPN: вкладка «Настройки», гайд «Как подключить VPN», статус «Активно», план «1 месяц», окончание «12 окт. 2026 г.». Баннера «Новые VPN-подключения сейчас недоступны» нет.
- Web `/api/vpn/subscription`: `provider=freeland-vpn`, `status=active`, `autoRenew=false`, `planKey=monthly`, `periodDays=30`, `currentPeriodStart=2026-09-12T12:24Z`, `currentPeriodEnd=2026-10-12T12:24Z`, `preferredClient=generic_subscription`, `billingSource=wallet_balance`. `/api/vpn/status`: `providerAvailable=true`, `preferredClient=generic_subscription`, доступен только `monthly` (склад staging содержит только 30-дневный SKU, что Никита отдельно объяснил в PR #428).

### Смежный аккаунт `FREELAND_STAGING_PURCHASE_*` (expired legacy, autoRenew=false)

`/api/vpn/subscription`: `provider=freeland-vpn`, `status=expired`, `autoRenew=false`, `periodDays=14`, `currentPeriodEnd=2026-09-11`, `preferredClient=karing`, `fixedTermInventoryPurchaseEligible=true`. Страница VPN (375): вкладки «Тарифы / Настройки», тарифы 12/6/3 мес и месячный, способы оплаты, кнопка «Оплатить $5», без баннера недоступности, без Karing. Под «Настройки» pre-purchase VELVET guide («Можно подготовиться до оплаты», 7 ссылок, без копирования и QR, шаг 2 объясняет, что ссылка и QR появятся после оплаты). Checkout не создавался.

### Что не доказано

- Живая негативная фикстура `expired TurboPatriot + auto_renew=true` на staging отсутствует, поэтому UI-путь именно этой комбинации до и после фикса вживую не воспроизводился. Покрытие: `vpn-expired-legacy-renewal-terminalization-contract.test.ts`, `vpn-velvet-fixed-term-repurchase.integration.test.ts` и код миграции.
- Raw-состояние строк (`superseded_at`, attempt/lease) не читалось: у QA нет доступа к БД.
- Конкуренция renewal ↔ новая покупка и повторы без двойного списания живыми деньгами не проверялись и не должны.

## Пункт 2. Минимальное обучение VELVET

Read-only probe `velvet-onboarding.spec.ts` (run 2, exit 0, 1.9 мин; guard пропускает same-origin GET/HEAD/OPTIONS, `POST /api/payment/options` как quote и `session-surface`, остальное abort). Наблюдения `velvet-onboarding-observations-run2.json`; скриншоты с маской ссылки и QR. Всё в пакете `.local/freeland-velvet-recheck-20260918.W8HApt/`.

| Проверка | Активный generic (test) | Expired legacy (purchase) |
| --- | --- | --- |
| `#vpn-setup-guide`, шаги «Установите VPN-клиент / Добавьте подписку / Выберите сервер и подключитесь» | да, 375 и 1440 | да, под «Настройки», pre-purchase вариант |
| 7 ссылок Happ/Incy с точными href, `target=_blank rel=noopener noreferrer`; все отвечают HTTP 200 | да | да |
| «Скопировать ссылку» | 1, enabled | нет (до оплаты) |
| QR «Настраиваете другое устройство?» | 1 | 0 |
| Ручная ссылка | есть, хост `subkey.link` | нет, текст «появятся после оплаты» |
| «Не получилось? Поддержка» → `/app/support?module=vpn` | да | нет (до оплаты) |
| Karing в гайде | нет | нет |
| Горизонтальный overflow 375/1440 | нет | нет |
| Support `?module=vpn` | «Проверки подключения VELVET» (3 пункта), «Вернуться к инструкции VPN» → `/app/vpn#vpn-setup-guide`, гайд во viewport; Karing/TUN и видео отсутствуют | прежние Karing/TUN подсказки (subscription capability = karing) |
| Утечка приватной ссылки | ни в одном из 265 исходящих запросов (4 хоста) и ни в console | н/д |

TMA (нативный Telegram, окно Mini App, аккаунт пользователя): тот же гайд, копирование, QR, ссылка, шаг 3, «Не получилось? Поддержка», блок статуса; кнопка поддержки открывает раздел поддержки. Выбор темы «VPN» в composer TMA под фоновым управлением не сработал (клики в WebView не доставляются), блок quick fixes в TMA визуально не подтверждён; код общий с Web.

Наблюдение (не дефект): у expired-legacy аккаунта до покупки страница VPN уже показывает VELVET-гайд, а Support для него показывает Karing-подсказки, потому что `vpnSupportClient` считается по capability подписки, а не по status provider. Это соответствует требованию «старым подпискам сохранить прежние подсказки», но до покупки VELVET пользователь видит два разных клиента на двух экранах.

Не выполнялось: импорт реального QA-ключа в Happ/Incy и подключение (нужен согласованный ключ; синтетический склад staging этого не докажет).

## Полная кампания на 403d3e4

`npm run qa:run -- --execute --product-repo <mirror> --mode full --shadow`, старт 04:40:16 UTC, receipt `evaluatedAt 2026-09-18T04:46:51.586Z`. Campaign `sha256:76372b36…`, generation `43d4c581e0027730b37962188820a3d83cd58c172469888f8b418da9dd47e0be`, receipt `sha256:5791eb0f…`, capsule `sha256:3999b292…`, engine `freeland-release-verdict-v0.7.2-shadow`. Trusted preflight записал production-baseline attestation (baseline 98262828, candidate 403d3e4, `divergent_exact_trees`) и runtime identity; drift не зафиксирован. Артефакты: `runtime/docs/local/freeland/product-graph/campaigns/76372b36…/` и `views/verdict-generations/43d4c581…/`.

**Verdict: `BLOCK_RELEASE`.** Reason codes: `AUTOMATED_TEST_FAILED`, `EXPECTED_FAILURE`, `FLAKY_RESULT`, `NOT_RUN`, `SAFETY_SPINE_INCOMPLETE`, `SKIPPED`; `environmentBlockerCodes: []`.

| Слой | Результат |
| --- | --- |
| Startup | 10/10 |
| Desktop `freeland-staging` (280 записей, 4.8 мин, 2 retries) | 256 expected (включая expected-fail), 5 unexpected, 1 flaky, 18 skipped |
| Mobile Pixel 5 + iPhone 13 | 10/10 expected (включая 2 expected-fail FREEL-293) |
| Sealed automated | 289 selected: 262 passed, 5 failed, 4 expected_failure, 18 skipped, 0 not_run |
| Manual | 89 not_run (67 monitoring + 22 release-tier `releasePendingIds`) |
| Replacement lanes | 15 blocked (пул не сконфигурирован), TC-ВХОД-09 passed VALID, TC-ВХОД-05 failed NEEDS_AGENT_REVIEW |

### Блокеры и их классификация

| Тест | Ошибка | Было на c469 | Классификация |
| --- | --- | --- | --- |
| `app.spec` product card opens product-specific details | `VPN_CONTENT_NOT_READY` | да | **Харнес:** `desktop-content-contracts.ts` ждёт заголовок generic-ветки «Настройте VPN-доступ»; на 403d3e4 заголовок «Как подключить VPN» (`#vpn-setup-guide-title`). Сама ветка полная: «Активно», «Скопировать ссылку» enabled |
| `products.spec` vpn announces provider outage instead of failing silently | `VPN_CONTENT_NOT_READY` | да (fd50/4c92) | Харнес, та же причина |
| `sections.spec` vpn product page renders plans | `VPN_CONTENT_NOT_READY` | да | Харнес, та же причина; кроме того test-аккаунт с активной подпиской тарифов не показывает по контракту продукта |
| `i18n.spec` wallet has no untranslated English copy | `/app/wallet` показывает «Insufficient available balance to place a hold.» | да (FREEL-424-класс, 16 сентября) | **Продукт, известный:** строка из `apps/api/src/services/money-holds.ts:304`, diff её не трогал |
| `seo.spec` SEO-06 locale hubs stay static | `/ru` redirected, контракт требует 200 без редиректа | да | **Продукт/инфраструктура, известный:** staging `/ru` → 301 `/ru/`, `/en` → 301 `/en/`; production `/ru` отвечает 200 |

Needs review: `account-data` «two user sessions read the same server-side Inbox read-state» flaky (failed → passed; было и на 4c92/c469); Freeman header 390px expected-fail (known); `SET-D2 language` skipped с аннотацией `PROFILE_MUTATION_LANE_REQUIRED`. Expected-fail: FREEL-247, FREEL-293 ×2, Freeman header. Skipped 18: 6 mutation_gated, 5 fixture_required, 2 production_only, 2 known_bug FREEL-134, 1 known_bug FREEL-248, 1 browser_specific, 1 qa-gap.

TC-ВХОД-05: `TC_VHOD_05_PREFLIGHT_FAILED`, stage `mailbox-lease`, `MAILTM_HTTP_STATUS_INVALID`, `mailboxCleanupState=partial_or_unknown`; навигация не начиналась. Это окружение (Mail.tm), не продукт; в леджере записаны `create_test_account` и `external_email` по 1 unit (standing authorization действует до 2026-10-02, лимиты 3/3 на кампанию).

### Сравнение с c469 (16 сентября)

| | c469 (cd24a7e2) | 403d3e4 (43d4c581) |
| --- | --- | --- |
| passed / failed / expected-fail / skipped | 181 / 76 / 4 / 17 | 262 / 5 / 4 / 18 |
| Verdict | BLOCK_RELEASE | BLOCK_RELEASE |

Снижение падений с 76 до 5 объясняется ремонтом readiness/expectations харнеса 17 сентября, а не изменениями продукта. Новых автоматических падений после коммитов Никиты нет.

## Полная кампания 2 на 403d3e4 — QA-источник `aa1d0ae`, роль A1 привязана

По запросу пользователя («проводи полный тест сьют стейджа, все аккаунты есть») выполнены два подготовительных шага и повторная кампания.

**Правка харнеса `aa1d0ae`** (локальный коммит, без push): `expectVpnContent` в `tests/freeland/desktop-content-contracts.ts` теперь ждёт заголовок generic-ветки «Как подключить VPN» вместо «Настройте VPN-доступ» (старый ключ `setupFlow.genericTitle` на 403d3e4 в web не рендерится; на c469 рендерился в `VpnPage.tsx:1964`). Остальные условия ветки (текст «Активно», активная «Скопировать ссылку») не менялись. Фикстура `desktop-content-contracts.test.mjs` и два `sha256` в `provenance/source-manifest.v1.json` обновлены. Unit 44/44, `provenance:verify` VALID, слим `qa:verify` exit 0 (`bindingsVerified:true`, новый `qaCorpusDigest sha256:5b4f5f13…`). Live-контроль трёх ранее падавших тестов через `test:staging --grep`: 3/3 PASS.

**Pool-аккаунты.** Ключей `FREELAND_POOL_*` на машине нет: `.env` от 26 августа их не содержит, файлов `.pool-*-account.json` нет, путь 6 сентября `/private/tmp/FreelandQAmain-build.lu0Tgp/.env` не существует; pool-CLI умеет только `status` («restore lands in S10»). Purchase-аккаунт проходит инварианты роли A1 (баланс 0, без eSIM/номера/карты, VPN неактивен, открытых checkout нет), поэтому A1 привязан к нему **только переменными окружения на время прогона**; в `.env` и репозиторий ничего не записано. A1B/A2/A3A/A3B/M остались `unconfigured`.

Кампания: старт 05:22:06 UTC, receipt `evaluatedAt 2026-09-18T05:31:55.760Z`, campaign `sha256:4a0371aa…`, generation **`4abe79ab66cdbdff008f9cbc1418dab50148395e40d34e138af843d37e1e96a1`**, identity 403d3e4 до и после совпала (05:21, 05:22, 05:32 UTC).

**Verdict: `BLOCK_RELEASE`.** Reason codes те же: `AUTOMATED_TEST_FAILED`, `EXPECTED_FAILURE`, `FLAKY_RESULT`, `NOT_RUN`, `SAFETY_SPINE_INCOMPLETE`, `SKIPPED`; `environmentBlockerCodes: []`.

| Слой | Кампания 1 (43d4c581) | Кампания 2 (4abe79ab) |
| --- | --- | --- |
| Startup | 10/10 | 10/10 |
| Automated passed / failed / expected-fail / skipped | 262 / 5 / 4 / 18 | **263 / 4 / 4 / 18** |
| Desktop wall time, workers 2, retries | 4.8 мин | 5.7 мин |
| Mobile | 10/10 | 10/10 |
| Manual | 89 not_run, 22 release-tier | 89 not_run, 22 release-tier |
| Replacement lanes | 15 blocked / 1 pass / 1 fail | 15 blocked / 1 pass / 1 fail |

### Блокеры кампании 2

| Тест | Ошибка | Отдельный перезапуск | Классификация |
| --- | --- | --- | --- |
| `i18n.spec` wallet has no untranslated English copy | «Insufficient available balance to place a hold.» | не повторялся | **Продукт, известный** (FREEL-424-класс) |
| `seo.spec` SEO-06 locale hubs stay static | `/ru` → 301 `/ru/` | не повторялся | **Продукт/инфраструктура, известный** (на prod 200) |
| `account-data.spec` two user sessions read the same Inbox read-state | `readAt` второй сессии новее на секунды (2 попытки) | PASS | **Харнес: изоляция.** Общий test-аккаунт читают параллельные worker'ы, `readAt` сдвигается; утром flaky, сейчас 2/2, поодиночке зелёный. Pre-existing (4c92/c469) |
| `web-frontend-audit.spec` welcome exposes the web email path | заголовок «Freeland» не виден за 5 с (2 попытки) | PASS | **Харнес: timing под нагрузкой**, новый в этом прогоне, поодиночке зелёный |

Flaky: `tma.spec` /tma/store renders its section (failed → passed; поодиночке PASS). Expected-fail и skipped без изменений (FREEL-247, FREEL-293 ×2, Freeman header; 18 skip с теми же dispositions). Три VPN-падения кампании 1 ушли.

### Replacement lanes кампании 2

| Case | Состояние | Причина |
| --- | --- | --- |
| TC-PAY-01, PAY-02, PAY-04, PAY-19, SEC-01, ВХОД-01, ВХОД-02, ВХОД-03 | blocked | `MANUAL_REPLACEMENTS_RECEIPT_STALE`: qualified-binding'и привязаны к байтам spec/oracle/support до ремонта 17 сентября; нужен новый owner-receipt через `manual-replacements-cli.mjs promote` после проходящего shadow-прогона |
| TC-API-01a | blocked | A1 сработал; dry-opener PaySheet вернул `VPN_PROVIDER_UNAVAILABLE` для stand-in аккаунта (expired legacy, karing capability) |
| TC-PAY-05 | blocked | A1 сработал; `CARD_ISSUE_UNAVAILABLE`, `PAYMENT_OPTIONS_UNAVAILABLE` для того же аккаунта |
| TC-PAY-07, PAY-09, SERV-01, WAL-13 | blocked | `POOL_ROLE_UNAVAILABLE` (A3A, A1B, A3B) |
| TC-WAL-01 | blocked | `POOL_ROLE_UNCONFIGURED:A1B` |
| TC-ВХОД-09 | passed VALID | публичный лейн |
| TC-ВХОД-05 | failed NEEDS_AGENT_REVIEW | `TC_VHOD_05_PREFLIGHT_FAILED`, stage `mailbox-lease`, `MAILTM_HTTP_STATUS_INVALID` (Mail.tm `/domains` при этом отвечает 200); навигация не начиналась |

Побочные эффекты кампании 2 (леджер `side-effect-ledger.v1.json`): authorization `492e3b0c…` на 5 минут для TC-ВХОД-05 с `create_test_account` 1, `external_email` 2, `request_password_reset` 1, `change_test_password` 1 (лимиты standing authorization 3/3/1/1 на кампанию, срок до 2026-10-02). Строки пишутся до действия; лейн упал на аренде ящика, `mailboxCleanupState=partial_or_unknown`. Платежей, checkout, изменений подписок или трекера не было. Runtime-дерево после прогона: только `graph.json` (разрешено).

## Добор автоматизацией после кампании 2 (06:00–06:25 UTC, unsealed)

По запросу «проверяй всё, что можешь, автоматизацией» выполнены: прямой прогон A1-совместимых shadow-спеков replacement-лейна (`npx playwright test --project=freeland-staging-replacements-setup --project=freeland-staging-replacements --grep …`, A1 = purchase через env, JSON-репортер: 6 expected / 3 skipped / 0 unexpected, 3.0 мин) и agent-led probe `release-tier-agent.spec.ts` на test (владелец) и purchase («чужой») аккаунтах (exit 0, 4.2 мин, 0 незапланированных мутаций, `networkDenied: []`). Плюс диагностический `vpn-quote-probe.spec.ts`. Все артефакты в `.local/freeland-velvet-recheck-20260918.W8HApt/`.

| Кейс | Harness-спек с A1 | Agent-led | Итог |
| --- | --- | --- | --- |
| TC-ВХОД-01 гость на главной | PASS | PASS: 200, hero «ВО ИМЯ СВОБОДЫ!», 6 CTA в `/app`, `/app/store` → `/app/welcome`, 0 console errors | **VERIFIED** |
| TC-ВХОД-03 вход по почте | PASS (2 advisory: theme color не наблюдаем/не меняется между welcome и store) | PASS: `/` для вошедшего → `/app/store` | **VERIFIED** |
| TC-PAY-01 состав методов VPN | PASS | первый quote 409 (дефект ниже), после повторного выбора monthly 200: Freeland Balance, СБП, Карта РФ, USDT trc20, USDC erc20; «недостаточно средств» при 0.00 | **VERIFIED с дефектом первого открытия** |
| TC-PAY-02 методы eSIM | PASS | PASS: план 2,06 $, card/SBP/crypto available, balance и stars unavailable, fee 0, арифметика сходится | **VERIFIED** |
| TC-PAY-04 методы номера | PASS | PASS: Канада 9,80 $, monthly, тумблер автопродления, те же методы, fee 0 | **VERIFIED** |
| TC-PAY-05 окно выпуска карты | skipped: `CARD_ISSUE_UNAVAILABLE, PAYMENT_OPTIONS_UNAVAILABLE` (спек ждёт программу «wallet», аккаунту предлагается только «Для подписок») | PASS для «Для подписок» 25 $: wallet_balance 0 % → 25,00; freeland_balance / card / SBP комиссия 3,23 $ → 28,23; crypto 0 %; подписи «Комиссия оплаты: 3,23 $» совпадают с API | **PARTIAL**: программа «wallet» для этого аккаунта не предлагается, нужно подтверждение правила |
| TC-PAY-07 сумма/источник/действие | не в лейне A1 (нужен A3A) | PASS на 4 окнах (eSIM, номер, карта, VPN после выбора): principal + fee = total, «К оплате» = выбранный источник | **VERIFIED (agent)** |
| TC-PAY-09 закрытие Esc/фон | не в лейне A1 (нужен A1B) | PASS: Esc и клик по фону закрывают окно, баланс/операции до и после идентичны, 0 денежных запросов | **VERIFIED (agent)** |
| TC-API-01a idempotency dry | skipped: `VPN_PROVIDER_UNAVAILABLE` (тот же 409) + `SERVER_IDEMPOTENCY_REPLAY_UNVERIFIED` | ветка Б: за все открытия окон ни одного денежного POST кроме `/api/payment/options` | **PARTIAL**: серверный replay остаётся за CI |
| TC-SEC-01 чужие данные | нужны A2 + A3A | владелец test (5 операций, 1 eSIM, 0 писем, 0 номеров, 0 карт); «чужой» purchase → 404 на все операции и eSIM-профиль, тело без маркеров владельца; гость → 401 | **PARTIAL**: письмо, SMS номера и карта не проверены (у владельца их нет) |
| TC-SERV-01 «Мои сервисы» | нужен A3B | eSIM и VPN отображаются, переходы в `/app/esim`, `/app/vpn`, `/app/virtual-numbers`, `/app/payments` | **PARTIAL**: у аккаунта нет номера и карты |
| TC-WAL-01 агрегат баланса | skipped: `POOL_ROLE_UNCONFIGURED:A1B` | API `0.11` = страница кошелька `0,11 USD` = чип магазина `0.11 USD`; разделитель разный (FREEL-248-класс) | **VERIFIED (agent, при балансе 0.11)** |
| TC-WAL-13 подписи комиссий | нужен A3A | подписи на eSIM/номере/карте согласованы с API-комиссией | **VERIFIED (agent)** |
| TC-TMA-01 запуск мини-приложения | автоматика `tma.spec` 11 PASS в кампании | открытие из бота на десктопе выполнено утром | **PARTIAL**: телефон не проверялся |

### Новый продуктовый дефект: первый quote в окне оплаты VPN уходит с `reactivate/yearly` и получает 409

- **Аккаунт:** purchase (`provider=freeland-vpn`, `status=expired`, `autoRenew=false`, `preferredClient=karing`, `fixedTermInventoryPurchaseEligible=true`, `sourceType=trial`). `/api/vpn/status`: `providerAvailable=true`, `preferredClient=generic_subscription`, `plans`: monthly available 5.00, quarterly/half_yearly/yearly unavailable.
- **Шаги:** войти → `/app/vpn` → в radiogroup «Выберите тариф» отмечен «1 месяц $5» (остальные disabled), кнопка «Оплатить $5» → нажать один раз.
- **Ожидание:** окно оплаты со списком методов для `activate/monthly` на 5,00 $.
- **Факт:** `POST /api/payment/options` с `{productType:"vpn", productAction:"reactivate", productPayload:{planKey:"yearly"}, surface:"web"}` → **409 `VPN_PLAN_UNAVAILABLE` «Selected VPN plan is not available right now»**; окно показывает «Загружаем способы оплаты… Сумма 0,00 $ К оплате 0,00 $», кнопка disabled, ошибки пользователю нет. После клика по уже выбранному «1 месяц» и повторного «Оплатить» уходит `{productAction:"activate", planKey:"monthly"}` → 200, 6 методов, «Сумма 5,00 $».
- **Воспроизводимость:** 4 из 4 (лейны обеих кампаний как `VPN_PROVIDER_UNAVAILABLE`, `velvet-onboarding` run 2 TC-PAY-01, `vpn-quote-probe`). Сборка 403d3e4, web и API.
- **Где искать:** `apps/web/src/pages/VpnPage.tsx:1360` (`useState<VpnPlanKey>('yearly')`), `:1409-1410` (fallback на доступный план только для отображения), `:1471-1472` (payload берёт `needsReactivation ? 'reactivate' : 'activate'` и `selectedPlan.key`), `:1563-1566` (синхронизация `selectedPlanKey` эффектом уже после первого запроса). Отдельный риск: первый запрос выбирает **`reactivate`** для истёкшего legacy-аккаунта; при доступном плане это может пойти по пути реактивации старого провайдера вместо покупки VELVET. Это гипотеза по коду, не наблюдение.
- Это не покрывает пункт 1 хэндофа заново: покупка стала доступной, но первый клик по-прежнему тупиковый до повторного выбора тарифа.
- **Уточнение 18.09, 07:35 UTC:** это не регрессия 403d3e4. Комментарий харнеса `tests/freeland-staging-replacements/tc-api-01a.spec.ts:88` фиксирует тот же `409 VPN_PLAN_UNAVAILABLE` на сборке `fc9785ae`; в ручном TC-API-01a сегодня первый quote VPN дал 409 и после выбора «1 месяц» (2 из 2), второй запрос в том же открытии вернул 200.

### Наблюдения без вердикта

- Комиссия выпуска карты для card/SBP/freeland_balance сейчас 3,23 $ на 25,00 $ (12,9 %); живая матрица от 9 августа говорила 8 %. Подпись согласована с API, расхождение матрица↔документ, решает ведущий.
- Программа карты «wallet» (VIP, для покупок за границей) не предлагается purchase-аккаунту, только «Для подписок». **Разобрано 18.09 по вопросу владельца, это правило, а не дефект:** `apps/api/src/services/card-vip-access.ts` открывает VIP при любом из условий: активный промо-грант VIP, админ, хотя бы одна проведённая (`posted`) покупка VPN/eSIM/номера (`vpn_activate|vpn_reactivate|vpn_renew|esim_purchase|esim_topup|virtual_number_purchase|virtual_number_renew`), активная реферальная привязка. Операции по картам намеренно не считаются: тест разработчика `card-vip-access.test.ts` «does not unlock from card operations, failed product operations, or voided referrals» (правило от 1 июля, рефералы добавлены 22 августа). Live 403d3e4: purchase-аккаунт (0 операций, не админ) → `GET /api/cards/quote?program=wallet` = `available:false`, «This card program is not available for this account.»; test-аккаунт (админ, проведённые VPN и eSIM) → `available:true`. Наблюдение владельца «карта для подписок куплена, VIP нет; после покупки eSIM появилась» с правилом совпадает. Не проверено: его покупки сделаны на третьем аккаунте, порядок VPN → eSIM по данным не виден; если VIP не появилась сразу после проведённой покупки VPN, возможные причины: операция ещё не `posted` или кэш quote на странице карты (`staleTime` 60 с, покупки продуктов его не сбрасывают, refetch по фокусу выключен). UX-замечание: условие открытия пользователю нигде не показано, программа просто отсутствует.
- ВХОД-03: `theme-color` не меняется между welcome и store (advisory спека).

## Проход ручного чек-листа: 89 кейсов (07:10–08:35 UTC, unsealed)

Основание: запрос владельца «пройди весь чек лист, там где я нужен - зови» и уточнение «там где автотест не проходит/не подходит под текущую реализацию — проверяй сам, проверяем релиз, а не харнес». Каталог: `docs/local/freeland/MANUAL-TEST-CASES.md` (89 кейсов: У0 5, У1 17, У2 67). Метод: четыре параллельные read-only группы (вход/навигация, оплаты, кошелёк/рост, коммуникации/устойчивость) на двух доступных аккаунтах + мои ручные проверки TC-API-01a, TC-ВХОД-06 и независимый повтор каждого отклонения. Guard сети тот же, что в доборе: same-origin GET, расчёт `POST /api/payment/options`, пустой `session-surface`, Supabase login. Это не sealed-вердикт и не замена owner-receipts.

| Статус | Кол-во | Смысл |
| --- | ---: | --- |
| PASS | 22 | ожидаемый результат наблюдался полностью |
| PASS·часть | 22 | агентская часть пройдена, остаток требует человека, денег или фикстуры |
| FAIL | 6 | отклонение продукта воспроизведено минимум дважды |
| DRIFT | 2 | каталог расходится с новым окном оплаты; решение владельца |
| N/A | 3 | функция выключена конфигом стенда |
| BLOCKED | 4 | нужна фикстура или окно выкладки |
| ВАМ | 30 | только человек: телефон, почта, деньги, изменяющее действие |

| № | Ур. | Кейс | Статус | Основание / что осталось |
| ---: | --- | --- | --- | --- |
| 1 | У0 | TC-ВХОД-01 Первый заход гостя на главную страницу | **PASS** | прямой A1-спек + probe |
| 2 | У2 | TC-ВХОД-02 Регистрация нового аккаунта по электронной почте | **ВАМ** | нужен свежий ящик и создание аккаунта |
| 3 | У0 | TC-ВХОД-03 Вход по почте и паролю, поведение главной для вошедшего | **PASS·часть** | агентская часть PASS; вопрос про цвет панели на телефоне |
| 4 | У1 | TC-ВХОД-04 Вход через Telegram на сайте | **ВАМ** | вход через Telegram на сайте |
| 5 | У2 | TC-ВХОД-05 Восстановление доступа по почте | **ВАМ** | письмо о сбросе: язык, тема, время |
| 6 | У2 | TC-ВХОД-06 Много неверных попыток входа подряд | **PASS** | 6×400 invalid_credentials, русское сообщение, лимит не сработал, вход через 125 с = 200 |
| 7 | У2 | TC-ВХОД-07 Защищённые разделы недоступны без входа | **PASS** | 17/17 защищённых адресов → /app/welcome без мелькания |
| 8 | У2 | TC-ВХОД-08 Короткие адреса и старые ссылки | **PASS·часть** | строки 1–9 ок; шаг 4 со входом не выполнялся: ?promo= сам шлёт POST redeem |
| 9 | У2 | TC-ВХОД-09 Публичные страницы и рекламные лендинги без входа | **PASS·часть** | 8/8 страниц 200, без пустых рамок; человеку: /card vs /card2 и Telegram-кнопка |
| 10 | У2 | TC-ВХОД-10 Переключение языка русский ↔ английский | **FAIL** | известный класс FREEL-424, но шире: история кошелька в RU на английском (чипы, даты, текст) |
| 11 | У2 | TC-ВХОД-11 Поведение после выкладки новой версии | **BLOCKED** | нужно окно выкладки и координация с командой |
| 12 | У2 | TC-ВХОД-12 Нижняя панель навигации на телефоне | **ВАМ** | нижняя панель на телефоне |
| 13 | У2 | TC-ВХОД-13 Боковое меню на компьютере и смена ширины окна | **PASS** | сайдбар 1440/1024/768, нижняя панель ≤767; Freeman 375px обрезан (известный expected-fail) |
| 14 | У2 | TC-ВХОД-14 Кнопка «назад» и сброс прокрутки | **FAIL** | шаг 8: «назад» при открытом окне оплаты уводит из раздела (5/5); шаги 5–7 ок |
| 15 | У0 | TC-PAY-01 Состав способов оплаты в окне оплаты VPN | **PASS** | прямой A1-спек; см. старый дефект первого quote 409 |
| 16 | У1 | TC-PAY-02 Состав способов оплаты при покупке eSIM (обычный тариф) | **PASS** | прямой A1-спек + probe |
| 17 | У2 | TC-PAY-03 Дешёвый тариф eSIM: карта и СБП блокируются по минимальной сумме | **FAIL** | eSIM 0,46 $: для карты/СБП минимумом названа сама цена 0,46 $ (реальный минимум 100 ₽) |
| 18 | У1 | TC-PAY-04 Состав способов оплаты при покупке виртуального номера | **PASS** | прямой A1-спек + probe |
| 19 | У1 | TC-PAY-05 Окно оплаты выпуска карты: программа, версия и источник средств | **PASS** | окно выпуска «Для подписок» 25 $: card/СБП/баланс +3,23 $ = 28,23 $; программа wallet аккаунту не предлагается |
| 20 | У2 | TC-PAY-06 Продление номера и пополнение карты доступны только при существующей сущности | **PASS·часть** | часть A1 ок; продление номера/пополнение карты требуют аккаунт с номером и картой |
| 21 | У0 | TC-PAY-07 Согласованность суммы, источника и действия до оплаты | **PASS** | 4 окна: principal + fee = total, «К оплате» = выбранный источник (без роли A3a) |
| 22 | У2 | TC-PAY-08 Пересчёт в рубли на плитках «Карта РФ» и «СБП» | **DRIFT** | в окне оплаты нет суммы в ₽; по API конвертация верна и стабильна (2,06 $ → 174,09 ₽, курс 84,5093) |
| 23 | У1 | TC-PAY-09 Закрытие окна оплаты фоном и клавишей Esc не создаёт оплату | **PASS** | Esc и фон закрывают окно, состояние не меняется |
| 24 | У2 | TC-PAY-10 Повторное открытие окна оплаты не меняет состав и не плодит оплаты | **PASS** | 5 открытий: те же плитки и сумма, окна не копятся, операций 0→0 |
| 25 | У2 | TC-PAY-11 Недостаток средств на балансе: плитка заблокирована и ведёт в пополнение | **PASS** | баланс 0,11 < 9,80: понятное сообщение, покупка не стартует |
| 26 | У2 | TC-PAY-12 Telegram Stars: только в мини-приложении и только при полном покрытии | **PASS·часть** | в браузере плитки Stars нет; часть в Mini App за человеком |
| 27 | У2 | TC-PAY-13 Крипта в окне оплаты — это пополнение кошелька, а не оплата покупки | **DRIFT** | у крипто-плиток нет подписи «пополнение кошелька / минимум 5 $»; шаг назван «Оплата 5.00 USDT TRC20» |
| 28 | У2 | TC-PAY-14 Минимальные суммы крипто-пополнения: 5,00 $ заявлено, зачисление от 4,00 $ | **PASS·часть** | минимум 5 USDT/USDC объявлен; поля суммы в UI нет (шаги 5–6 невыполнимы); создание адреса за человеком |
| 29 | У2 | TC-PAY-15 При активном VPN повторная активация не доходит до окна оплаты | **PASS** | активный VPN: тарифов и кнопки покупки нет, quote 409 VPN_ALREADY_ACTIVE |
| 30 | У2 | TC-PAY-16 Незавершённая оплата блокирует новую по тому же продукту | **ВАМ** | нужна незавершённая оплата (создаёт чекаут) |
| 31 | У1 | TC-VPN-01 Покупка VPN Картой РФ от витрины до выданного доступа | **ВАМ** | покупка VPN 5,00 $ |
| 32 | У2 | TC-VPN-02 Передача купленного VPN в приложение Karing | **ВАМ** | импорт ключа в клиент на телефоне |
| 33 | У2 | TC-VPN-03 Повторная покупка VPN при уже активной подписке | **PASS** | активная подписка: без тарифов, дата окончания не меняется |
| 34 | У2 | TC-VPN-04 Отключение и восстановление автопродления VPN | **N/A** | у VELVET fixed-term нет автопродления; нужен legacy-аккаунт с автопродлением |
| 35 | У2 | TC-ESIM-01 Каталог eSIM: страна → тариф → карточка тарифа | **PASS** | Турция: 13 тарифов с объёмом/сроком/ценой; копирайт «1 дней», «3 дней» |
| 36 | У2 | TC-ESIM-02 Дешёвый тариф eSIM: ни один способ оплаты не проходит | **FAIL** | eSIM 0,46 $: окно пишет «минимум 5,00 $», а «Пополнить баланс» открывает «Оплата 0.46 USDT TRC20» с адресом (2/2) |
| 37 | У1 | TC-ESIM-03 Покупка eSIM и выдача профиля с QR-кодом | **ВАМ** | покупка eSIM 2,06 $ |
| 38 | У2 | TC-ESIM-04 Установка профиля на телефон и отображение расхода трафика | **ВАМ** | установка профиля на телефон |
| 39 | У2 | TC-VN-01 Покупка виртуального номера Канады и выдача номера | **ВАМ** | покупка номера 9,80 $ |
| 40 | У1 | TC-VN-02 Приём SMS на два виртуальных номера | **ВАМ** | SMS на два номера |
| 41 | У2 | TC-VN-03 Продление виртуального номера и управление автопродлением | **ВАМ** | продление номера (деньги) |
| 42 | У2 | TC-CARD-01 Выпуск карты оплатой Картой РФ или СБП | **ВАМ** | выпуск карты 28,23 $ |
| 43 | У2 | TC-CARD-02 Выпуск карты списанием с внутреннего баланса: комиссия и подписи | **ВАМ** | выпуск с баланса (нужен баланс ≥ 28,23 $) |
| 44 | У1 | TC-CARD-03 Реквизиты выпущенной карты и её пополнение | **ВАМ** | реквизиты и пополнение карты |
| 45 | У2 | TC-CARD-04 История операций по карте и блокировка карты | **ВАМ** | история и блокировка карты |
| 46 | У0 | TC-SERV-01 Раздел «Мои сервисы» и история после всех покупок | **PASS·часть** | eSIM и VPN ок; номера и карты на аккаунте нет (нужен A3b) — ворота У0 не закрыты |
| 47 | У2 | TC-CANC-01 Отмена незавершённой покупки и повторная оплата после ошибки | **ВАМ** | отказ у поставщика и повторная оплата |
| 48 | У2 | TC-EXP-01 Поведение продуктов по истечении срока | **PASS·часть** | истёкший VPN → витрина и окно оплаты ок; «VPN expired» по-английски в RU; eSIM/номер требуют фикстур |
| 49 | У1 | TC-WAL-01 Агрегат баланса и доступный источник оплаты | **PASS** | API 0.11 = кошелёк 0,11 = чип 0.11 |
| 50 | У2 | TC-WAL-02 Пополнение кошелька в сети USDT TRC20: адрес, сеть и минимальная сумма | **PASS·часть** | test: T…-адрес, QR, минимум 5/приход 4, копия = показанному; на пустом аккаунте «Создать адрес» за человеком |
| 51 | У2 | TC-WAL-03 Пополнение в сети USDC ERC20: приходит ли адрес именно сети ERC20 | **PASS** | 0x…-адрес ≠ TRC20, подпись USDC ERC20, предупреждение |
| 52 | У2 | TC-WAL-04 Криптоплитка в окне оплаты — это пополнение кошелька, а не оплата покупки | **FAIL** | тот же корень, что TC-PAY-03 |
| 53 | У2 | TC-WAL-05 Пополнение через Telegram Stars | **ВАМ** | Stars в Mini App |
| 54 | У2 | TC-WAL-06 Пополнение кошелька банковской картой | **N/A** | Lava выключена конфигом, плитки «Карта» нет |
| 55 | У2 | TC-WAL-07 История операций и карточка отдельной операции | **PASS·часть** | баланс и порядок ок; строки не кликабельны (карточки операции нет); английские чипы/даты |
| 56 | У2 | TC-WAL-08 Создание счёта на оплату и публичная страница оплаты | **ВАМ** | создать счёт 10,00; в форме нет подписи комиссии |
| 57 | У2 | TC-WAL-09 Вывод средств недоступен и не трогает баланс | **PASS** | вывода нет нигде, баланс не меняется |
| 58 | У1 | TC-WAL-10 Сумма списания совпадает с суммой в подтверждении (целостность денег) | **ВАМ** | сверка суммы списания (деньги) |
| 59 | У1 | TC-WAL-11 Повторное нажатие «Оплатить» не создаёт второе списание | **ВАМ** | двойное нажатие «Оплатить» (деньги) |
| 60 | У2 | TC-WAL-12 Отмена оплаты не списывает деньги | **PASS·часть** | отмена по Esc ×2 ок; способы 2–3 требуют создания чекаута |
| 61 | У1 | TC-WAL-13 Подписи комиссий, котировка и отдельное подтверждение списания | **PASS** | подписи комиссий согласованы с API |
| 62 | У2 | TC-REF-01 Реферальная ссылка, её копирование и появление приглашённого | **PASS·часть** | ссылка с кодом = API, гость попадает на регистрацию; копирование шлёт POST, регистрация A2 за человеком |
| 63 | У2 | TC-REF-02 Начисление вознаграждения и его получение на баланс | **ВАМ** | начисление вознаграждения (деньги) |
| 64 | У2 | TC-PROMO-01 Промокоды: применение по ссылке, применение вручную и повторное применение | **ВАМ** | применение кода = мутация; кириллический «несуществующий» код из каталога клиент режет до «2026» |
| 65 | У2 | TC-INBOX-01 Письмо во «Входящих»: приход, отметка «прочитано», сохранение после перезагрузки | **PASS·часть** | список, счётчик, read-state после перезагрузки ок; приход письма за человеком |
| 66 | У2 | TC-INBOX-02 SMS во «Входящих» при двух активных номерах | **BLOCKED** | нужны два активных номера |
| 67 | У2 | TC-MAIL-01 Ответ на письмо из ящика и служебные отправители | **PASS·часть** | ящик и адрес ок; ответ и служебные отправители за человеком (по коду фильтра служебных нет) |
| 68 | У2 | TC-SUP-01 Обращение в поддержку: выбор модуля, форма, отправка, переписка | **PASS·часть** | 6 тем, кнопка неактивна до заполнения; отправка тикета «ТЕСТ» требует разрешения |
| 69 | У2 | TC-FRE-01 Freeman: чат и запасной ответ | **PASS·часть** | экран, быстрые вопросы, status available; отправка сообщения требует разрешения |
| 70 | У2 | TC-COM-01 Сообщество: переход на форум | **N/A** | сообщество выключено конфигом, прямой URL даёт понятное состояние |
| 71 | У2 | TC-SET-01 Профиль, язык интерфейса и язык писем | **PASS·часть** | язык EN/RU ок; поля имени в UI нет (каталог устарел); письмо о сбросе за человеком |
| 72 | У2 | TC-PWA-01 Установка приложения на телефон и обновление версии | **ВАМ** | установка на телефон |
| 73 | У1 | TC-TMA-01 Запуск мини-приложения из бота и открытие вне Telegram | **PASS·часть** | запуск на десктоп-Telegram утром; телефон и второй Telegram-аккаунт за человеком |
| 74 | У2 | TC-TMA-02 Переход с рекламной страницы в мини-приложение сразу на нужный продукт | **PASS·часть** | CTA /vpn → dst=vpn, /card → dst=card; сам переход за человеком |
| 75 | У2 | TC-TMA-03 Кнопка «Назад» в мини-приложении | **ВАМ** | кнопка «Назад» в Mini App |
| 76 | У2 | TC-TMA-04 Разрешение боту писать пользователю | **ВАМ** | разрешение боту писать |
| 77 | У2 | TC-TMA-05 Безопасные зоны и перекрытие элементов в мини-приложении | **ВАМ** | безопасные зоны |
| 78 | У2 | TC-RES-01 Работа на медленной сети | **PASS** | Slow 3G: сплэш 4,6 с, магазин 23,4 с, без выброса и тех. текстов |
| 79 | У2 | TC-RES-02 Обрыв связи посреди действия | **PASS·часть** | офлайн-тост, черновик цел, авто-обновление после связи; отправка в авиарежиме за человеком |
| 80 | У2 | TC-RES-03 Возврат после сворачивания | **ВАМ** | возврат из фона |
| 81 | У2 | TC-PASS-01 Паспорт: передача во внешний сервис и блокировки кнопки | **PASS·часть** | сервис настроен, опроса нет; внешний переход и аккаунт без почты за человеком |
| 82 | У2 | TC-PAY-17 Платёж на ручной проверке: список способов оплаты приходит пустым | **BLOCKED** | нужен аккаунт с платежом на проверке |
| 83 | У2 | TC-PAY-18 Долго открытое окно оплаты и оплата после истечения срока | **PASS·часть** | quote живёт 300 с, окно на истечение не реагирует; 35 минут у поставщика и оплата за человеком |
| 84 | У2 | TC-CARD-05 Суточный лимит пополнения карты гасит внешние способы и баланс | **BLOCKED** | нужна активная карта и значение суточного лимита |
| 85 | У2 | TC-WAL-14 Возобновление незавершённой покупки после пополнения баланса | **ВАМ** | возобновление покупки после пополнения (деньги) |
| 86 | У2 | TC-VPN-05 Испорченная ссылка передачи VPN в Karing отклоняется | **FAIL** | ссылка №4 (attempt=не-uuid) принимается: «Открыть Karing» + копирование (2/2); №1–3 отклоняются |
| 87 | У1 | TC-API-01a Ключ повторной отправки (Idempotency-Key) на денежных запросах | **PASS** | ветка Б: денежных записей 0; расчёт POST /api/payment/options без ключа; ключи есть в клиенте на выпуске/пополнениях |
| 88 | У1 | TC-SEC-01 Доступ к чужим данным под вторым аккаунтом | **PASS** | чужие операции/eSIM → 404, гость → 401 |
| 89 | У1 | TC-PAY-19 Две вкладки с окном оплаты: второй чекаут не создаётся | **ВАМ** | нужны два неоплаченных чекаута: разрешение на создание без оплаты |

### Отклонения, подтверждённые повтором (403d3e4)

1. **Шаг крипто-пополнения просит сумму ниже минимума (TC-ESIM-02).** `/app/esim?view=shop` → Украина → 0.49 GB / 1 день за 0,46 $ → «Перейти к оплате» → плитка USDT trc20: блок «Минимальная сумма оплаты 5,00 $ — пополните баланс на сумму от 5,00 $», кнопка оплаты неактивна. «Пополнить баланс» открывает шаг «Оплата **0.46** USDT TRC20» с адресом, QR, таймером 50 минут и «Проверить оплату». Минимум кошелька: 5 USDT, зачисление от 4 USDT чистыми. Пользователь, следующий экрану, отправит 0,46 USDT ниже порога зачисления. 2 из 2 у меня + 2 прогона группы; то же для USDC erc20. Скриншот `verify-esim02-deposit-step-390.png` (QR и адрес закрыты).
2. **Текст минимума для карты/СБП называет саму цену (TC-PAY-03, TC-WAL-04).** Тот же тариф 0,46 $, плитка «Карта РФ» или «СБП»: «Минимальная сумма оплаты 0,46 $ — пополните баланс на сумму от 0,46 $». Реальный минимум внешней оплаты 100 ₽, сумма 38,88 ₽. Кнопка корректно неактивна, неверен только текст. Скриншот `g3-paysheet-card-cheapest-esim-390.png`.
3. **«Назад» при открытом окне оплаты уводит из раздела (TC-ВХОД-14, шаг 8).** `/app/esim?view=shop` с открытым окном → «назад» браузера: окно исчезает и адрес меняется на предыдущую запись истории (`/app/store`; в другой попытке `/app/wallet`). Окно оплаты не добавляет запись в историю. 5 из 5. На Android системная «назад» даст то же. Сессия и деньги не затронуты.
4. **Ссылка передачи в Karing с испорченным `attempt` принимается (TC-VPN-05, строка 4).** `/app/vpn/connect#access=karing://install-config?url=https://go.mf0.online/sub&attempt=не-uuid` показывает «Откройте VPN в Karing» с кнопками «Открыть Karing» и «Скопировать ссылку подписки»; строки 1–3 отклоняются экраном «Ссылка больше не активна». Хост подписки остаётся закреплённым за `go.mf0.online`, сам адрес на экран не выводится, hash стирается. Риск низкий, но ожидание каталога не выполнено. 2 из 2.
5. **Русская история кошелька на английском шире одной строки (TC-ВХОД-10, TC-WAL-07, TC-EXP-01).** `/app/wallet`: чипы «OUT», «VPN PURCHASE», название «vpn activate», дата «Sep 12, 2026, 8:24 PM», текст «Insufficient available balance…»; `/app/products`: «VPN expired · ручное продление». Класс FREEL-424 известен, но автотест ловит одну строку из блока.
6. **Копирайт:** «1 дней», «3 дней» в списке тарифов eSIM (склонение).
7. **Наблюдение владельца, агентом не воспроизведено (нужна оплата):** после оплаты выпуска VIP-карты она не появляется в разделе «Карта» без обновления страницы, после F5 карта на месте. 1 из 1, личный staging-аккаунт Данила, 18.09 около 18:00 WITA. По коду список карт берётся из `me`, который сбрасывается только когда опрос статуса выпуска на этой же странице увидел `card_issue_posted` (`CardPage.tsx:1761-1767`), а `refetchOnWindowFocus` выключен глобально. Черновик тикета: `.local/freeland-velvet-recheck-20260918.W8HApt/bug-draft-vip-card-not-shown-without-refresh.md`; в Nuanu Flow не заведён (коннектор не авторизован, в Chrome нет сессии Flow).

### Расхождения каталога с текущей реализацией (решает владелец)

- TC-PAY-08: в окне оплаты нет суммы в рублях ни на плитках, ни в итогах («Сумма / К оплате 2,06 $»). По API конвертация верна и стабильна 3 минуты: 2,06 $ × 84,5093 (ЦБ, spread 0) = 174,09 ₽ для карты и СБП. Рубли появляются только после создания чекаута.
- TC-PAY-13: у крипто-плиток нет подписи «пополнение кошелька, минимум 5,00 $»; для VPN 5,00 $ кнопка активна и ведёт на шаг «Оплата 5.00 USDT TRC20». По API действие `wallet_deposit`.
- TC-SET-01: поля имени профиля в UI нет (форма редактирует только email), хотя главная настроек обещает «Email + имя профиля».
- TC-WAL-07: строки истории не кликабельны, карточки операции в сборке нет.
- TC-PAY-18: расчёт живёт 300 с; открытое окно на истечение не реагирует (по коду цена переоформляется при нажатии).
- TC-PAY-14: поля суммы пополнения в кошельке нет, шаги 5–6 каталога невыполнимы.
- TC-ВХОД-08 / TC-PROMO-01: `?promo=` у вошедшего сам шлёт `POST /api/promo/redeem`; «несуществующий» кириллический код из каталога клиент обрезает до «2026», нужен латинский.
- TC-MAIL-01: по коду 403d3e4 фильтра служебных отправителей нет (`canReply = id && from`); проверить при первом письме от no-reply.

### Ручные проверки вместо заблокированных lane

| Кейс | Результат |
| --- | --- |
| TC-API-01a (У1) | **PASS, ветка Б.** Пять открытий окон (VPN ×2, eSIM, номер, карта): запросы с телом только `POST /api/auth/session-surface` и расчёт `POST /api/payment/options` (200; для VPN 409 → 200). Денежных записей 0, дайджест баланса и операций до = после. В клиенте `Idempotency-Key` стоит на выпуске карты, пополнениях, referral claim, Stars top-up (`apps/web/src/lib/api-client.ts`). Серверная идемпотентность создания чекаута ручным объёмом не закрыта. |
| TC-ВХОД-06 (У2) | **PASS.** 6 попыток с `WrongPass123` за 10 с: каждая 400 `invalid_credentials`, на экране «Email или пароль неверные. Проверьте данные или сбросьте пароль.», поле пароля активно, ограничение частоты (FREEL-264) не сработало; через 125 с вход с верным паролем = 200, `/app/store`, sha 403d3e4. |

## Что остаётся вам

| Пачка | Кейсы | Что нужно от вас |
| --- | --- | --- |
| 1. Телефон и Telegram, без денег | №73 TMA-01 (шаги 1–5, 8, 9), №74 TMA-02, №75–77 TMA-03/04/05, №80 RES-03, №72 PWA-01, №12 ВХОД-12, №14 ВХОД-14 (жест), №3 ВХОД-03 (цвет панели), №26 PAY-12 и №53 WAL-05 (только посмотреть Stars), №32 VPN-02 (импорт ключа активного VELVET) | ответы на «вопрос человеку» из каталога |
| 2. Почта | №2 ВХОД-02 (регистрация на свежий ящик), №5 ВХОД-05 и №71 SET-01 (письмо о сбросе: язык, тема, время), №65 INBOX-01 и №67 MAIL-01 (письмо «Проверка 1» и ответ), №4 ВХОД-04 (вход через Telegram на сайте) | ящик, к которому есть доступ; после каждого шага я сверяю состояние read-only |
| 3. Покупки (карту вводите вы; я сверяю историю, выдачу и суммы после каждой) | У1: №31 VPN-01 5,00 $ (≈ 423 ₽) на purchase-аккаунте, заодно живое доказательство пункта 1; №37 ESIM-03 2,06 $ (174,09 ₽); №44 CARD-03 после №42 CARD-01 28,23 $ (≈ 2 386 ₽); №58 WAL-10, №59 WAL-11 на любой из этих покупок; №40 VN-02 после №39 VN-01 9,80 $ (≈ 828 ₽) ×2 номера. У2: №41, №43, №45, №47, №63, №85, №83 | «да» на каждую сумму отдельно; потолок каталога 3000 ₽ на транзакцию |
| 4. Разрешения на изменяющие действия без денег | №89 PAY-19 и №30 PAY-16, №60 WAL-12 (неоплаченный чекаут «Номера, Канада, месяц» 9,80 $); №68 SUP-01 (тикет «ТЕСТ»); №69 FRE-01 (2 вопроса Фримену); №56 WAL-08 (счёт 10,00); №64 PROMO-01 и №8 ВХОД-08 шаг 4 (нужен тестовый промокод); №50 WAL-02 («Создать адрес» на пустом аккаунте); №62 REF-01 (копирование ссылки = POST invite) | явное «да» по каждому классу; дальше выполняю сам |
| 5. Нужна команда | №46 SERV-01 (аккаунт A3b с четырьмя продуктами, закрывает У0); №20 PAY-06, №84 CARD-05, №66 INBOX-02, №48 EXP-01 (аккаунт с номером, картой, истёкшими продуктами); №82 PAY-17 (платёж на проверке); №34 VPN-04 (legacy с автопродлением); №11 ВХОД-11 (окно выкладки); №73 TMA-01 шаги 6–7, 10–13 (второй Telegram-аккаунт); №81 PASS-01 (аккаунт без подтверждённой почты) | фикстуры от администратора стенда |
| Решения | дефекты 1–6 и старый первый quote VPN → Никите; расхождения каталога → ведущему; комиссия 12,9 % и программы карты; перевыпуск 8 owner-receipts | ваше решение и авторство тикетов |

## Что дальше

1. **Харнес, изоляция:** развести read-state и welcome по отдельным аккаунтам/серийному запуску или дать welcome-заголовку budgeted wait; иначе они будут флапать в каждом двухворкерном прогоне. Правка контракта VPN уже сделана (`aa1d0ae`), но остаётся локальной: нужна ревью и делivery в canonical source.
2. **Продукт (Никите):** английская строка «Insufficient available balance to place a hold.» в RU Wallet (FREEL-424-класс) и 301 на `/ru`, `/en` против SEO-контракта (на production `/ru` = 200). Оба существовали до PR #427/428.
3. **Replacement lanes:** перевыпустить owner-receipts для 8 qualified-кейсов (`MANUAL_REPLACEMENTS_RECEIPT_STALE`) после проходящего shadow-прогона; проверить, почему dry-openers VPN и Card issue считают продукт недоступным для A1 stand-in (state аккаунта или регрессия каталога).
4. **Аккаунты:** для A1B/A2/A3A/A3B/M нужны реальные ключи `FREELAND_POOL_<ROLE>_EMAIL/PASSWORD` (A1B с балансом ≥ 60 $, A3A/A3B с продуктами); без них 22 release-tier manual и денежные лейны остаются pending. Mail.tm lane нужна отдельная диагностика (`MAILTM_HTTP_STATUS_INVALID` при живом API).
5. **VELVET приёмка подключения:** один согласованный реальный QA-ключ → установка → импорт → подключение на одном телефоне.
6. `.env` права `0600`; tracker/Buzz запись не выполнялась, нужна отдельная authority. Deployment readiness остаётся решением Никиты.
