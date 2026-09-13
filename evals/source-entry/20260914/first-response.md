# First response — fresh_entry_consumer

Source-only workflow-selection exercise, not a product run. The response below is
retained before reviewer feedback; no corrected answer replaces it.

---

A) Новый публичный каталог

Начну с `qa-check → qa-product-v0`: сначала соберу модель продукта и проверяемые ожидания, затем предложу план. Отсутствие регистрации не мешает анализу. Публичные проверки и вход разделю: без доступа блокируется только authenticated lane.

Конкретно попрошу:

- точный публичный HTTPS URL и целевую среду/версию;
- ожидаемую семантику доступности: дата/время, часовой пояс, что считается свободной переговорной;
- 1–2 известных примера переговорных и вместимости как свидетели, либо разрешение самостоятельно исследовать публичный каталог;
- для входа — безопасный owner-completed sign-in/session handoff или предоставленный тестовый аккаунт через принятый секретный канал; пароль/OTP в чат не нужны;
- если нужна регистрация QA: product name/slug, точный абсолютный workspace path под разрешённым root и явное разрешение зарегистрировать именно этот intake/target. Product map/OpenAPI полезны, но необязательны.

Первый безопасный шаг сейчас: зафиксировать sourced-модель и матрицу поиска/вместимости/доступности, пометив вход `BLOCKED` до handoff; регистрацию и продуктовый прогон не начинать без отдельного разрешения.

B) Существующий Freeland QA

Нет, продолжение кампании начинать пока нельзя. Новый общий Freeland-компонент не мигрирует существующую кампанию: нужен её последний owner checkpoint и замороженный runtime. Неизвестный исход вчерашнего счёта — отдельный стоп для любых повторных invoice/payment действий.

Нужно запросить у владельца:

- последний `CURRENT` checkpoint;
- фактический frozen QA checkout/runtime SHA, graph/campaign owner;
- candidate/release identity, campaign/generation IDs и оставшийся scope;
- идентификатор вчерашней операции/счёта и сохранённый receipt/readback/status, без платёжных секретов;
- действующие permissions/spend ledger и точный разрешённый следующий шаг.

После этого первый безопасный шаг — read-only reconciliation исходной операции в её прежнем owner/runtime. Новый счёт, повтор оплаты, новый прогон или переключение на `21c1c61` запрещены до установленного исхода и согласованной миграции. Отдельный явно разрешённый read-only анализ источников возможен, но это не возобновление кампании.

```yaml
source_observation:
  root:
    path: /Users/danilsolomin/projectsnew/qa-agent
    head: 0d7ed9a1fc424192b1bf60e58e8229c26de63e1f
  components:
    console: 1c715a1980dac52fb8ba1d267c8c8e2d97b406e8
    kernel: 657894dbd61561a634f36669a0874dccccbea59e
    freeland: 21c1c617a2dbe5d1131215dc738dba2556851ae3
    kernel_reporting_reference:
      sha: 10d398d8a077068c2184f33958e9b654a2f2947c
      runtime_authority: false
  request_A:
    skills:
      - skills/qa-check/SKILL.md
      - components/console/skills/qa-product-v0/SKILL.md
      - components/console/skills/qa-product-v0/references/product-analysis.md
      - components/console/skills/qa-product-v0/references/agent-observations.md
      - components/console/skills/qa-init/SKILL.md
    owner_runtime: "new Starter work: Console 1c715a1 + Kernel 657894d"
    next_safe_action: "analysis/check design; request scoped intake and auth handoff"
    gaps: [public URL/environment, availability oracle, witnesses/test data, auth handoff, registration target/authority]
    cannot_claim: [registered, tested, authenticated coverage, product PASS, deployment identity]
  request_B:
    skills:
      - skills/qa-check/SKILL.md
      - components/freeland/skills/freeland-release-qa/SKILL.md
      - components/freeland/docs/local/freeland/AGENT-RUNBOOK.md
      - components/freeland/docs/local/freeland/ZERO-TOUCH-OPERATIONS.md
      - components/freeland/docs/local/freeland/PRODUCT-BRIEF.md
    owner_runtime: "existing campaign's frozen owner/runtime; not automatically Freeland 21c1c61"
    next_safe_action: "obtain CURRENT checkpoint, then read-only reconcile original invoice/payment"
    gaps: [owner checkpoint, frozen runtime, campaign identity, current candidate, original operation readback, permissions]
    cannot_claim: [campaign resumed, payment succeeded/failed, safe retry, migrated runtime, current release verdict]
```

Фактически обнаруженное противоречие: текущий Freeland skill требует читать нужные разделы `PRODUCT-MAP.md` и считает старые ручные метки лишь инвентарём ([skill, line 28](/Users/danilsolomin/projectsnew/qa-agent/components/freeland/skills/freeland-release-qa/SKILL.md:28), [line 113](/Users/danilsolomin/projectsnew/qa-agent/components/freeland/skills/freeland-release-qa/SKILL.md:113)), тогда как старый runbook запрещает исполнителю использовать `PRODUCT-MAP.md` ([runbook, line 67](/Users/danilsolomin/projectsnew/qa-agent/components/freeland/docs/local/freeland/AGENT-RUNBOOK.md:67)) и назначает работу по ролевым тегам. По явному правилу skill текущую оркестрацию определяет skill; из runbook сохраняются продуктовые и более строгие safety-ограничения.

Ни один продукт в этой exercise не тестировался.
