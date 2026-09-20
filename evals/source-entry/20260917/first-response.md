## Первый самостоятельный ответ

Я не начинаю product execution. По свежему входу первый незавершённый шаг — **P0-entry**, а не Freeland/Starter campaign: определить accepted source, отдельно runtime/owner и полный skill bundle, сохранив исходный ответ. В пределах read-only задания я выполнил source-entry baseline и первый разрешённый readback.

### Что сейчас действительно действует

- Текущая пользовательская инструкция возобновляет план [2026-09-16-cross-product-qa-global-plan.md](/Users/danilsolomin/projectsnew/qa-agent/docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md). Именно он объявляет `P0-entry — сначала`, затем P0 integrity/oracle/CI и параллельный baseline.
- Однако этот план и его [reconciliation](/Users/danilsolomin/projectsnew/qa-agent/docs/reviews/2026-09-16-global-plan-reconciliation.md) **не находятся в Git index**. Они untracked. Их SHA-256:
  - plan: `f2a91e6e54a6582a58146520932868e2e31cf706928197b229a0a2e689ee5599`
  - reconciliation: `68ed865bba813f597ee1458c51f0cbe0d77b0601bb9742b85914fef6abbf7ff0`
- [current.md](/Users/danilsolomin/projectsnew/qa-agent/docs/qualification/current.md) локально изменён и ссылается на этот план. Поэтому это актуальное намерение текущего working tree, усиленное прямой командой пользователя, но пока не committed canonical delivery.
- Git HEAD: `e0347a6`, ветка `codex/workspace-assembly`, на 10 коммитов впереди `origin/codex/workspace-assembly`; working tree уже был dirty до этой проверки.
- [roadmap](/Users/danilsolomin/projectsnew/qa-agent/docs/roadmap/README.md) всё ещё называет план от 13 сентября approved global plan. Это реальное противоречие entrypoints: `current.md` указывает на 16 сентября, roadmap — на 13 сентября.
- Фраза «после релиза Freeland» сама по себе не подтверждена: `current.md` сохраняет sealed `BLOCK_RELEASE` и отдельно говорит, что release decision принадлежит Никите. Нынешняя команда пользователя достаточна, чтобы возобновить разработку глобального плана, но не доказывает, что Freeland выпущен или принят.

Accepted reusable source определяется не планом, а [manifest.v1.json](/Users/danilsolomin/projectsnew/qa-agent/sources/manifest.v1.json):

- Kernel `185d3e72309a4362db57cf2e805d1c00a5035909`
- Console `66ac7db55a25f56b199b2cb00ad83df3b8dad868`
- Freeland `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`
- reporting reference `10d398d8a077068c2184f33958e9b654a2f2947c`, неактивен

Все четыре component checkout находятся в detached HEAD и чисты. `runtimeAuthority: true` в manifest означает выбранный source, а не готовый executable runtime и не полномочие на продукт.

### Где искать runtime, owner и skills

Общий маршрут задан [products/README.md](/Users/danilsolomin/projectsnew/qa-agent/products/README.md), а не рабочим каталогом:

- существующий campaign продолжает только его frozen owner/runtime checkpoint;
- новый или Starter-managed продукт идёт через manifest Console/Kernel;
- Freeland использует собственный frozen campaign owner и source skill;
- `kernel-reporting-reference` нельзя активировать ради отсутствующего observation API.

`~/.codex/qa-workspaces.md` можно использовать только как locator. Он уже противоречит фактам:

- верхняя запись всё ещё называет root `b604df4` и старые pins Console `b392e88`, Kernel `15a067c`, Freeland `9c2509e`;
- фактический root — `e0347a6`, manifest pins — `66ac7db` / `185d3e7` / `3ee1cb3`;
- Freeland owner entry указывает на checkpoint от 12 сентября, хотя в репозитории есть более поздние checkpoints 15–17 сентября.

Следовательно, без выбранного продукта нельзя честно выбрать runtime/owner. Для текущего P0 source-development шага product runtime вообще не нужен.

По skills:

- root [qa-check](/Users/danilsolomin/projectsnew/qa-agent/skills/qa-check/SKILL.md) полностью прочитан и byte-for-byte совпадает с установленными `.codex` и `.agents` копиями;
- source `qa-product-v0` находится в `components/console/skills/qa-product-v0/`; его `SKILL.md` совпадает с installed, но две обязательные references — `agent-observations.md` и `declarative-campaign.md` — отличаются;
- source `freeland-release-qa` находится в `components/freeland/skills/freeland-release-qa/`; installed `SKILL.md` имеет другой hash и не содержит source reference `exact-ticket-evidence.md`.

Поэтому при выборе специалиста надо читать **полный source bundle из manifest-selected component**, а не полагаться на installed entry. Специалист сейчас не выбран, поэтому я не продолжал в product skill и не открывал product execution.

### Что выполнено первым

Разрешённый первый readback:

```text
node --version
v22.23.1

npm --version
10.9.8

npm run sources:verify
{"status":"sources_verified", ... exact four manifest components ...}
```

Это подтверждает только доставленные source bytes и чистоту component authority. Это не закрывает P0-entry целиком и ничего не говорит о продукте, браузере, tracker, live environment или release acceptance.

Следующий bounded шаг глобального плана после сохранения этого baseline — небольшой owning implementation plan для P0 с точными файлами и RED/GREEN controls:

1. Console Git replacement authority.
2. Findings create/resolve containment.
3. Freeland TC-PAY-01 missing-UI oracle.
4. Явное разделение source/pure/isolated-fixture/product commands и небольшой reasoning baseline.
5. Параллельно — только дизайн минимального P1 writer/reader seam.

В текущем read-only scope эти изменения и RED/GREEN прогоны не разрешены, поэтому я их не начинал.

### Что пока нельзя делать

- Нельзя считать untracked план committed/current delivery без отдельного сохранения и readback.
- Нельзя продолжать конкретную campaign без выбранного продукта и свежего owner checkpoint.
- Нельзя запускать Console/Freeland `npm test`: эти имена могут включать browser/product work.
- Нельзя использовать старый locator pin, installed Freeland skill или неполный installed `qa-product-v0` bundle как authority.
- Нельзя активировать reporting reference вместо Kernel.
- Нельзя делать продуктовые, браузерные, сетевые, tracker/Buzz, payment, install, migration или cloud действия.
- Нельзя выводить product PASS из `sources:verify`, исторических qualification records или текущего Freeland `BLOCK_RELEASE`.

### Фактически выполненные локальные проверки

Я выполнил только read-only команды:

- `pwd`, `git rev-parse`, `git status`, `git log -1`;
- чтение `AGENTS.md`, `README.md`, `package.json`, manifest, assembly/current/roadmap, products, getting-started, полного root `qa-check`, плана и reconciliation;
- `npm run sources:verify`;
- `git diff --stat`, targeted diff `current.md`/`AGENTS.md`, проверку tracked/untracked статуса;
- component `git status`;
- SHA-256 source и installed skill bundles;
- чтение locator `~/.codex/qa-workspaces.md` и указанного им Freeland checkpoint только для проверки актуальности locator;
- финальный `git status`.

Финальный status совпадает с исходным; component checkouts чисты. Файлы я не менял, сеть/браузер/продукты не использовал, suites и установки не запускал.
