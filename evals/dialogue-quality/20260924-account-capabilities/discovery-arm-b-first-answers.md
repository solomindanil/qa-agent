# Discovery comparison, arm B — immutable first answers

Treatment source revision `ee04085c2c400bf3809b657f64be7f33a6df311c`; exact tracked delta from arm A `8f40e6eb98abbea8d11cad01f13482c6ec91c02f` is only `skills/README.md` and `skills/qa-check/SKILL.md`. Treatment README SHA-256 `e1d7b2becb4f8f662b5a2585123ec2740d879b02e10cb382aa15bb79779d550d`; qa-check SHA-256 `c79b35c38838d92ee5dcfcfe1d257ad8f16a32682220056583212ed64e4649b5`. Cases/rubric bytes match the frozen arm-A pair. Two fresh, separate source-selected open-context Codex actors were requested with `gpt-6-sol`/medium. Effective model, total elapsed, tokens and cost remain `unknown`; actor-reported command lists are not independently retrievable raw transcripts. No product, browser login, provider, mail, account, tracker or production action was performed. Replies below precede reviewer feedback, help or correction.

## D1 — first reply

Подходящий путь предусмотрен, но готовый доступ **не подтверждён**. В конфигурации Freeland staging есть роль **A3B** с требованием активного VPN; она предназначена, в частности, для `TC-SERV-01`. Имя роли и конфигурация не доказывают, что аккаунт сейчас существует, доступен и соответствует текущей сборке.

Перед тикетом владелец существующей кампании должен сверить её checkpoint и frozen runtime, текущий staging `releaseSha`, полномочия на проверку пула и действие команды `npm run qa:pool -- status`: она входит через UI во **все** настроенные роли, делает продуктовые GET-запросы и записывает приватный readback. В нём нужны настроенная A3B, успешный рабочий read, `vpnActive=true`, соблюдение остальных инвариантов (продукты, баланс, отсутствие открытых чекаутов) и совпадение candidate. Если этого нет — фиксировать конкретный пробел подготовки, не объявлять баг VPN и не создавать новый аккаунт автоматически. До тикета также нужны актуальные ожидание/вариант VPN-инструкции и воспроизведение на том же candidate; проверка дублей и запись в FREEL — только в разрешённом владельцем маршруте.

Публичное описание можно разбирать отдельно: `/vpn` указан как открытый без авторизации лендинг, а источник описывает активную подписку как послепокупочный экран с настройкой клиента. Но актуальный контент, cohort/rollout и работающий доступ этим source-only просмотром не проверены. Следующий безопасный шаг — запросить у владельца **текущий checkpoint и результат разрешённого им A3B-readback**; пока продолжать только анализ публичных формулировок, без логина и действий на staging.

## D2 — first reply

Сейчас можно подготовить для владельца Freeland staging план проверки регистрации и передачи тикета, а также проверить исходный контракт публичного текста. Сам аккаунт и готовность к продолжению не подтверждены: не было ни текущего product-read, ни сохранённого идентификатора/доступа для следующего проверяющего.

Текущий исходный маршрут — `freeland-release-qa`. Контролируемый TC-ВХОД-02 умеет одноразово создать Mail.tm-ящик, зарегистрироваться и подтвердить почту, но затем удаляет ящик; итог лишь `SHADOW_PASS`, `promotionEligible=false`, без доказательства удаления пользователя и без retained-fixture. Поэтому успешный запуск не создаёт передаваемый аккаунт. `qa:pool status` тоже не подходит как provisioning: это чтение всех настроенных ролей, не создание нового обычного пользователя.

Публичный текст в исходном контракте намеренно не раскрывает, существует ли адрес: «Если этот email может получить доступ Freeland…», с указанием адреса, следующего шага, повторной отправки и входа. Старая карточка TC-ВХОД-02 ожидает для повторной регистрации явное «аккаунт уже существует» — это противоречит текущему нераскрывающему тексту. Можно зафиксировать как расхождение источников, но не утверждать, что именно сейчас показано на staging, без live-проверки.

Следующий безопасный шаг: владелец кампании должен выбрать/предоставить штатный retained-account контракт для одного обычного пользователя — стабильный ID, окружение и роль, владелец, срок, доступ следующего проверяющего, правила хранения/удаления, текущий authenticated product-read и привязка к тикету. После этого отдельно согласовать действия создания/проверки у владельца; до этого оставить передачу аккаунта `UNASSESSED` и продолжать только публичный source-only анализ.

Предлагаемый ответ пользователю: «Могу сейчас подготовить чек-лист регистрации, зафиксировать расхождение публичного текста с устаревшим ожиданием тест-кейса и описать безопасную передачу тикета. Создать и передать подтверждённый аккаунт пока нельзя: одноразовый тест удаляет почтовый ящик и не сохраняет рабочий доступ. Нужен утверждённый владельцем способ удержать аккаунт и свежая проверка входа на текущем staging; секреты в чат не присылайте».

## Tool-accounting limit

D1 actor reported about a dozen read-only command groups and paths in root routing, Freeland specialist, pool CLI/readback/config and VPN docs. D2 actor reported 15 read-only command groups and paths in root routing, Freeland specialist, controlled-email spec/oracle/policy, private helper search and signup documents. Each reported `npm run sources:verify` succeeded. Exact ordered command descriptions and full actor-reported path lists remain in the subagent first-output messages, but raw tool transcripts are not available to this review. No reliable distinct-file inspection savings can be claimed from these summaries. Total elapsed, tokens and monetary cost are `unknown`.

Do not overwrite these first replies with AQA feedback or a corrected attempt.
