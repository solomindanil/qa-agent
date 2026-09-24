# Discovery comparison, arm A — immutable first answers

Source revision `8f40e6eb98abbea8d11cad01f13482c6ec91c02f`; root routing bytes unchanged from the pre-index source. Frozen cases SHA-256 `6f89add9f11f082b47ca17b1bd5af3b738d0127a6bc5be438b239fc8d9305032`; rubric SHA-256 `6abc0650ac034da4d1c47b31196ed8053eed3017325755596508330723c91eb1`. Two fresh, separate source-selected, open-context Codex actors were requested with `gpt-6-sol`/medium. Effective model, total elapsed, tokens, and cost were not independently observable and remain `unknown`. No product, browser login, provider, mail, account, tracker, or production action was performed. These are first replies before reviewer feedback, help, or candidate edit; preserve them unchanged.

## D1 — first reply

Источник предусматривает подходящую роль — **A3B с активным VPN**, но готовый доступ сейчас **не подтверждён**. Имя роли и её инвариант в конфигурации не доказывают, что аккаунт доступен, подписка не истекла и состояние соответствует текущему staging. `qa:pool status` делает вход в продукт и сохраняет readback, поэтому в рамках разрешённого source-only разбора я его не запускал. Публичное VPN-описание можно анализировать отдельно; текущий W3-документ — лишь предложение, не принятый oracle и не результат проверки.

Перед тикетом владельцу кампании нужно подтвердить текущий candidate/environment и свежий readback A3B, привязать ожидаемый VPN-вариант к роли и cohort, затем воспроизвести расхождение на этом кандидате, исключить устаревшую сессию/выкладку и проверить дубли. Пока безопасный следующий шаг — запросить у владельца **свежий обезличенный результат готовности роли и точную staging-сборку**; секреты не нужны.

Краткий ответ пользователю: «По QA-конфигурации есть роль A3B, рассчитанная на активный VPN, но её доступность и состояние на текущем staging не проверены. Публичное описание VPN можно сверить по исходникам уже сейчас. Перед тикетом нужны свежая проверка A3B и сборки, подтверждённое ожидаемое поведение и воспроизведение без дубля; пока баг не завожу».

## D2 — first reply

Сейчас можно подготовить сценарий и проверить его ожидания по исходникам, но нельзя заявить, что новый подтверждённый аккаунт уже готов для передачи другому проверяющему.

В пакете есть staging-сценарий регистрации с подтверждением письма (`TC-ВХОД-02`) и отдельный пул именованных аккаунтов с проверкой состояния. Однако controlled-email сценарий использует одноразовый ящик, удаляет его после проверки и помечает аккаунт как не подлежащий повторному использованию. Текущего readback пула, сохранённой ссылки на нужный аккаунт и подтверждённого способа доступа следующего проверяющего нет. Для продолжения того же тикета владелец кампании должен выбрать долговременный управляемый аккаунт и безопасный handoff без пароля, токена или ссылки подтверждения в тикете; на следующей неделе нужны свежая проверка готовности аккаунта и staging identity.

По текущему исходному оракулу публичное сообщение после регистрации нейтрально: «Проверьте почту», показывает адрес назначения и предлагает открыть последнее письмо, войти или запросить сброс пароля. Это расходится со старым ручным критерием, требующим прямо сообщить, что аккаунт уже существует. Это расхождение требований для согласования с владельцем, не подтверждённый баг: живую страницу я не открывал.

Короткий ответ пользователю: «Могу сейчас подготовить шаги регистрации, критерии подтверждения почты и безопасной передачи аккаунта, а также проверить текст по исходникам. Но создание пользователя и обещание, что другой проверяющий сможет войти через неделю, требуют выбранного владельцем долговременного аккаунта, доступного ящика и свежего readback. Одноразовый сценарий регистрации для этого не подходит. В тексте регистрации есть расхождение между текущим нейтральным сообщением и старым ручным ожиданием; согласуем актуальный критерий перед проверкой на staging».

## Actor-reported source-inspection record

The actors returned ordered tool-call descriptions and viewed-path lists in their first outputs. Those descriptions are not independently retrievable raw tool transcripts in this run, so file-inspection savings **cannot** be qualified from this record alone. D1 reported 15 read-only `exec_command` calls, including `npm run sources:verify` exit 0; D2 reported 18 read-only command groups, including the same verifier. Both also read host `using-superpowers` and `freeland-release-qa` skills. D1 reported viewing the root mandatory files, Freeland `AGENTS.md`/specialist/runbook/brief/map, VPN design and account-pool config/CLI/readback/code plus incidental `rg` matches in other source files. D2 reported a much wider scan of Freeland manuals, source docs, controlled-email tests/oracles, Mail.tm and account-pool files. Filename-only listings were distinguished from content reads; neither actor reported opening the discovery rubric or prior answers. No observed total wall time, tokens, or monetary cost is available.

This section is a limitation notice, not a scored inspection count. Do not overwrite the first replies after AQA review.
