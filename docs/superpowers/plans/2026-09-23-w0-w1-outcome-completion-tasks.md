# W0 + W1: outcome и remaining-only — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution or superpowers:subagent-driven-development if that execution mode is selected. Выполнять задачи по порядку; checkbox означает выполненный шаг с доказательством, не намерение. До implementation использовать using-git-worktrees; не терять незакоммиченные документы общего плана.

**Goal:** квалифицировать три содержательные проверки на контролируемых healthy/broken примерах и отдельно доказать, что новый контекст выполняет один разрешённый реальный остаток, не повторяя сделанное.

**Architecture:** небольшой loopback target по образцу существующего `evals/docs-render-agent-cycle/fixture.mjs`; Playwright служит проверкой качества самой фикстуры, не новым QA engine. Агент отдельно проектирует и исполняет свои проверки существующими средствами. Реальный consumer использует прежние owner/runtime/readers и не переносится на synthetic регистрацию.

**Tech Stack:** Node.js >=22.12.0, node:test, уже доступный Playwright/Chromium из выбранного Console, текущий observation writer/reader. Новых зависимостей, API-сервисов, installs или pins нет.

**Spec:** [единый план, W0/W1](2026-09-23-unified-qa-agent-implementation-plan.md#4-пакеты-реализации), [сверка обязательств](../../reviews/2026-09-23-global-plan-reconciliation.md). Это детализация восьми задач; оформление документа не является началом их исполнения.

## Global Constraints

- Source baseline: root7aa1b24, Kernel aa5d2d1, Console8065713, Freeland0ea2df1; перед исполнением проверить manifest, не выбирать pins из этого текста при drift.
- Все новые записи фикстуры — только process-local memory на127.0.0.1. Они не означают разрешения POST/AI/оплаты в продукте.
- Case expectations ниже синтетические. «Nebula» не реальная VPN-рекомендация; цена200центов не требование Freeland.
- Save note моделирует только разрыв «сообщение об успехе → persisted object». Он не проверяет AI tool-calling и не закрывает agent-native obligation W3.
- Существующие reader/status/intermediate assertions не меняются. Kernel/Console/Freeland code, installed skills и рабочие кампании не ремонтируются этим пакетом.
- Новый supported oracle, если его действительно недостаёт, выделяется в W3 с отдельным дизайном. Обход руками не объявляется уже доставленной regression.
- First attempt и все подсказки сохраняются; первый дизайн до исполнения проходит отдельное AQA review. При общем filesystem sample называется open-context, не blind.
- Не повторять исторический public-input exercise ради нового total. Здесь другие controls; реальный consumer должен выполнить ещё не закрытый пункт.
- Нельзя свести W1 к фикстуре: отсутствие доступного live остатка оставляет T7 pending, даже если T1–T6 прошли.
- Capture time и authoredAt различаются; текущая observation lane text/JSON, attachments=[] и unattested.
- Нет product/tracker/Buzz writes, live backend QA, новых платежей, provider mutations и автоматических installations.

## Review Focus

Execution correction, 23 September: original design review NO-GO for aggregate Q assertion. Implementation captures all quantities, then separately enforces healthy Q1 and contradictory Q2/Q3; see `evals/outcome-completion/browser.test.mjs`. Original proposed code below remains design history, not instruction to restore the aggregate assertion. Persistence pair does not independently qualify reload-only failure. Use explicit QA_PLAYWRIGHT_MODULE for existing warm dependencies; a Console node_modules symlink was rejected by source integrity and removed. Root assembly requires an isolated normal clone rather than a linked worktree.

1. Неправильный guide выглядит полноценной инструкцией — T2/T4 проверяют соответствие явному cohort, не непустой текст.
2. Quantity1 скрывает ошибку quantity2/3 — T2/T4 проверяют запрос, ответ и DOM, сохраняя правильный quantity1.
3. «Сохранено» одинаково в healthy/broken — T3/T4 проверяют независимый GET и reload.
4. Ошибка browser/fixture ошибочно засчитана обнаруженным seeded defect — T4 принимает только ожидаемый AssertionError, setup/timeout не заменяет его.
5. Fresh consumer повторяет A либо превращает B unknown в no-effect — T6/T7 сохраняют denominator и сверяют unknown до любого retry.

## Файлы и результаты

| Файл | Назначение |
| --- | --- |
| Create `evals/outcome-completion/README.md` | Contract, запуск, authority, ограничения, actor prompt |
| Create `evals/outcome-completion/cases.md` | Требования/сценарии без ключа fault→outcome |
| Create `evals/outcome-completion/reviewer-rubric.md` | Заранее заданный ключ и критерии review |
| Create `evals/outcome-completion/fixture.mjs` | Только локальный target трёх journeys |
| Create `evals/outcome-completion/fixture.test.mjs` | HTTP contract/lifecycle, не competence агента |
| Create `evals/outcome-completion/browser.test.mjs` | Чувствительность трёх конкретных assertions |
| Create `evals/outcome-completion/run.mjs` | Opt-in запуск одного loopback target, stop cleanup |
| Create `evals/outcome-completion/runs/w0-w1-first/README.md` | Sanitized факты первого actual sample, только после исполнения |
| Modify `docs/qualification/current.md` | Фактический результат/остаток, без закрытия всего P3/P5 |
| Private new run root | Исходные ответы, capture/reader outputs и live owner checkpoint; не tracked secrets |

Интерфейс фикстуры: `startOutcomeFixture({fault = 'none'} = {}) -> Promise<{baseUrl, hits, close}>`. Разрешённые fault: none, guide, quantity, persistence. Каждый instance имеет собственную память; close завершает только его server. Не экспортируется метод вычисления product PASS.

## Task 1: Воспроизводимый вход и карточка запуска

**Результат:** один baseline record с реальными source/owner/capability facts. Эта задача не создаёт очередной письменный QA baseline вместо выполнения.

- [x] **1.1** Прочитать root AGENTS/current/manifest/assembly и сохранить existing dirty diff; не делать reset/clean. Создать изолированный checkout по using-git-worktrees только при начале code-работы.
- [x] **1.2** Из выбранного root выполнить `npm run sources:verify`; exit0 обязателен. Сверить наличие `components/console/node_modules/playwright/index.mjs` и установленного Chromium без установки.
- [x] **1.3** Создать приватную карточку запуска с полями: root/component commits, actual host/model, tools, caseRevision, permittedOrigins, permittedActions, startedAt, captureLimitations, liveOwner, liveWorkspace, liveRuntime, eligibleRemainingCase, blockers. До запуска записать ожидаемую длительность/стоимость и локальный stop budget; если стоимость недоступна, отметить unavailable, не ноль. Неизвестные значения отметить unknown с причиной, не придумывать.
- [x] **1.4** По products/README и текущему owner checkpoint выбрать кандидат для T7. Проверить только готовность/authority; продуктовые действия пока не выполнять. Если все кандидаты blocked, продолжить независимые T2–T6, T7 оставить pending.

**Проверка:** карточка различает source и liveRuntime, имеет конкретный следующий остаток либо конкретную причину pending; нет claims о новом продукте только из чтения отчёта.

## Task 2: Заморозить три контракта и review-ключ

**Результат:** README/cases/rubric с неизменными expectations до реализации/первого actor.

- [x] **2.1** Записать в cases.md ровно следующие пользовательские требования:

| Case | Требование fixture | Нужные наблюдения |
| --- | --- | --- |
| OC-G | Пользователь cohort nebula должен получить guide «Nebula setup» | GET requirements → DOM guide; наличие «Atlas setup» не подходит |
| OC-Q | Варианты количества1/2/3; unitMinor=200, currency=USD; totalMinor=quantity×200, request/response/UI согласованы | Запрошенное quantity, response.quantity, response.totalMinor, DOM total |
| OC-P | После Save note «Daily plan» объект доступен независимо и после reload | Toast, GET notes-state, повторный DOM read; toast отдельно недостаточен |

- [x] **2.2** В reviewer-rubric.md зафиксировать expected matrix: none → G/Q/P adequate; guide → G contradiction, Q/P adequate; quantity → Q2/Q3 contradiction, Q1/G/P adequate; persistence → P contradiction, G/Q adequate. Setup errors не засчитываются как contradiction.
- [x] **2.3** В README записать authority: только данный loopback origin; Save меняет только память owned fixture. Нельзя открывать реальные продукты или публиковать tracker findings по синтетике.
- [x] **2.4** Записать правила first attempt: actor не получает fault labels/исходник fixture/reviewer key; shared filesystem означает open-context. Сохранить frozen copies/digests до следующей ревизии.

**Проверка:** reviewer может указать источник каждого ожидания; все три broken состояния имеют plausible-success поверхность. Если expectation меняется после запуска, это новая revision, а исходный результат остаётся.

## Task 3: Локальная фикстура с отдельной проверкой её корректности

**Результат:** fixture.mjs + fixture.test.mjs + run.mjs. Source-only; никаких production claims.

- [x] **3.1 RED** Создать следующий тест до fixture.mjs и выполнить `node --test evals/outcome-completion/fixture.test.mjs`. Первое падение — отсутствующий fixture module; после stub полезный RED должен быть на поведении.

    import { test } from 'node:test';
    import assert from 'node:assert/strict';
    import { startOutcomeFixture } from './fixture.mjs';

    test('loopback contract, isolation and rejection', async () => {
      await assert.rejects(startOutcomeFixture({ fault: 'invalid' }), /Unknown fault/);
      const good = await startOutcomeFixture();
      const bad = await startOutcomeFixture({ fault: 'persistence' });
      try {
        for (const f of [good, bad]) {
          const r = await fetch(f.baseUrl + 'requirements');
          assert.equal(r.status, 200);
          assert.deepEqual(await r.json(), {
            cohort: 'nebula', guide: 'Nebula setup',
            unitMinor: 200, currency: 'USD', noteTitle: 'Daily plan'
          });
          assert.equal((await fetch(f.baseUrl + 'quote?quantity=0')).status, 400);
          assert.equal((await fetch(f.baseUrl + 'missing')).status, 404);
          assert.equal((await fetch(f.baseUrl + 'guide', { method: 'DELETE' })).status, 405);
          assert.equal((await fetch(f.baseUrl + 'notes', { method: 'POST' })).status, 202);
        }
        assert.deepEqual(await (await fetch(good.baseUrl + 'notes-state')).json(),
          { title: 'Daily plan' });
        assert.deepEqual(await (await fetch(bad.baseUrl + 'notes-state')).json(), { title: null });
      } finally {
        const results = await Promise.allSettled([good.close(), bad.close()]);
        const failures = results.filter(r => r.status === 'rejected').map(r => r.reason);
        if (failures.length) throw new AggregateError(failures, 'Fixture cleanup failed');
      }
    });

- [x] **3.2 GREEN** Реализовать target следующим содержимым; пути и ответы — только контракт T2.

    import { createServer } from 'node:http';

    export async function startOutcomeFixture({ fault = 'none' } = {}) {
      if (!['none', 'guide', 'quantity', 'persistence'].includes(fault))
        throw new Error('Unknown fault');
      const requirements = {
        cohort: 'nebula', guide: 'Nebula setup',
        unitMinor: 200, currency: 'USD', noteTitle: 'Daily plan'
      };
      let title = null;
      const hits = [];
      const page = body => '<!doctype html><meta charset="utf-8"><main>' + body + '</main>';
      const server = createServer((req, res) => {
        const url = new URL(req.url, 'http://fixture.invalid');
        hits.push({ method: req.method, path: url.pathname, search: url.search,
          at: new Date().toISOString() });
        res.setHeader('cache-control', 'no-store');
        const json = (code, data) => {
          res.writeHead(code, { 'content-type': 'application/json' });
          res.end(JSON.stringify(data));
        };
        const html = body => {
          res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          res.end(page(body));
        };
        if (req.method === 'POST' && url.pathname === '/notes') {
          if (fault !== 'persistence') title = requirements.noteTitle;
          json(202, { message: 'Saved' }); return;
        }
        if (req.method !== 'GET') { json(405, { error: 'method_not_allowed' }); return; }
        if (url.pathname === '/requirements') { json(200, requirements); return; }
        if (url.pathname === '/guide') {
          html('<h1 data-testid="guide">' +
            (fault === 'guide' ? 'Atlas setup' : requirements.guide) + '</h1>'); return;
        }
        if (url.pathname === '/quote') {
          const input = url.searchParams.get('quantity');
          if (!['1', '2', '3'].includes(input)) { json(400, { error: 'quantity' }); return; }
          const quantity = fault === 'quantity' ? 1 : Number(input);
          json(200, { quantity, unitMinor: 200, currency: 'USD', totalMinor: quantity * 200 });
          return;
        }
        if (url.pathname === '/quantity') {
          html('<label>Quantity<select id="q"><option>1</option><option>2</option>' +
            '<option>3</option></select></label><output id="total" data-testid="total"></output>' +
            '<script>const q=document.querySelector("#q"),t=document.querySelector("#total");' +
            'async function update(){const n=q.value;const r=await fetch("/quote?quantity="+n);' +
            'const j=await r.json();t.textContent=String(j.totalMinor);t.dataset.request=n;}' +
            'q.addEventListener("change",update);update();</script>'); return;
        }
        if (url.pathname === '/notes-state') { json(200, { title }); return; }
        if (url.pathname === '/notes') {
          html('<button id="save">Save note</button><p data-testid="saved"></p>' +
            '<p data-testid="persisted">' + (title ?? '') + '</p>' +
            '<script>document.querySelector("#save").onclick=async()=>{' +
            'const r=await fetch("/notes",{method:"POST"});const j=await r.json();' +
            'document.querySelector("[data-testid=saved]").textContent=j.message;};</script>');
          return;
        }
        json(404, { error: 'not_found' });
      });
      await new Promise((resolve, reject) => {
        server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
      });
      return {
        baseUrl: 'http://127.0.0.1:' + server.address().port + '/',
        hits,
        close: () => new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()))
      };
    }

- [x] **3.3** Добавить следующий quantity-control в fixture.test.mjs и выполнить тот же `node --test`; expected2passed/0failed. Он проверяет сам seeded target, не способность агента.

    test('quantity fault preserves plausible one-item success', async () => {
      for (const fault of ['none', 'quantity']) {
        const f = await startOutcomeFixture({ fault });
        try {
          for (const requested of [1, 2, 3]) {
            const response = await fetch(f.baseUrl + 'quote?quantity=' + requested);
            assert.equal(response.status, 200);
            const quantity = fault === 'quantity' ? 1 : requested;
            assert.deepEqual(await response.json(), {
              quantity, unitMinor: 200, currency: 'USD', totalMinor: quantity * 200
            });
          }
        } finally { await f.close(); }
      }
    });
- [x] **3.4** Создать минимальный opt-in launcher run.mjs:

    import { startOutcomeFixture } from './fixture.mjs';
    const fixture = await startOutcomeFixture({ fault: process.argv[2] ?? 'none' });
    console.log(JSON.stringify({ baseUrl: fixture.baseUrl, scope: 'owned-loopback-only' }));
    let stopping = false;
    const stop = async () => {
      if (stopping) return;
      stopping = true;
      try { await fixture.close(); }
      catch (error) { console.error(error); process.exitCode = 1; }
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);

**Проверка:** `node evals/outcome-completion/run.mjs none` печатает случайный127.0.0.1URL; SIGINT закрывает только fixture. Не называть background процесс живым после завершения его host. Коммит T3 после review только этих новых eval files, не pins.

## Task 4: Проверить, что assertions различают healthy и broken

**Результат:** browser.test.mjs. Это evaluator control, не первая попытка тестируемого QA-агента.

- [x] **4.1** Создать три конкретных oracle-функции в browser.test.mjs:

    async function guide(page, f, expected) {
      await page.goto(f.baseUrl + 'guide');
      assert.equal(await page.getByTestId('guide').textContent(), expected.guide, 'guide cohort');
    }
    async function quantity(page, f, expected) {
      const observed = [];
      for (const n of [1, 2, 3]) {
        const received = page.waitForResponse(r =>
          r.url() === f.baseUrl + 'quote?quantity=' + n && r.request().method() === 'GET');
        if (n === 1) await page.goto(f.baseUrl + 'quantity');
        else await page.getByLabel('Quantity').selectOption(String(n));
        const response = await received;
        assert.equal(response.status(), 200, 'quote transport');
        const quote = await response.json();
        await page.waitForFunction(value =>
          document.querySelector('#total').dataset.request === String(value), n);
        const rendered = Number(await page.getByTestId('total').textContent());
        observed.push({ requested: n, quantity: quote.quantity, totalMinor: quote.totalMinor,
          currency: quote.currency, rendered });
      }
      assert.deepEqual(observed, [1, 2, 3].map(n => ({ requested: n, quantity: n,
        totalMinor: n * expected.unitMinor, currency: expected.currency,
        rendered: n * expected.unitMinor })), 'quantity result');
    }
    async function persisted(page, f, expected) {
      await page.goto(f.baseUrl + 'notes');
      await page.getByRole('button', { name: 'Save note', exact: true }).click();
      await page.getByTestId('saved').filter({ hasText: /^Saved$/ }).waitFor();
      const response = await fetch(f.baseUrl + 'notes-state');
      assert.equal(response.status, 200, 'note read transport');
      const record = await response.json();
      await page.reload();
      const rendered = await page.getByTestId('persisted').textContent();
      assert.equal(record.title, expected.noteTitle, 'persisted independent read');
      assert.equal(rendered, expected.noteTitle, 'persisted reload');
    }

- [x] **4.2** Добавить harness теста ниже в тот же файл. Импорты расположить в начале; helpers4.1 — ниже импортов. Browser control не должен принимать timeout/network error за найденный дефект.

    import { test } from 'node:test';
    import assert from 'node:assert/strict';
    import { chromium } from '../../components/console/node_modules/playwright/index.mjs';
    import { startOutcomeFixture } from './fixture.mjs';

    for (const fault of ['none', 'guide', 'quantity', 'persistence']) {
      test('outcome controls: ' + fault, async () => {
        const f = await startOutcomeFixture({ fault });
        let browser;
        try {
          browser = await chromium.launch({ headless: true });
          const context = await browser.newContext();
          await context.route('**/*', route => {
            if (new URL(route.request().url()).origin === new URL(f.baseUrl).origin)
              return route.continue();
            return route.abort();
          });
          const page = await context.newPage();
          page.setDefaultTimeout(5000);
          page.setDefaultNavigationTimeout(5000);
          const expected = await (await fetch(f.baseUrl + 'requirements')).json();
          for (const [name, check, pattern] of [
            ['guide', guide, /guide cohort/],
            ['quantity', quantity, /quantity result/],
            ['persistence', persisted, /persisted independent read/]
          ]) {
            if (name === fault)
              await assert.rejects(() => check(page, f, expected),
                { name: 'AssertionError', message: pattern });
            else await check(page, f, expected);
          }
        } finally {
          const results = await Promise.allSettled([browser?.close(), f.close()]);
          const failures = results.filter(r => r.status === 'rejected').map(r => r.reason);
          if (failures.length) throw new AggregateError(failures, 'Cleanup failed');
        }
      });
    }

- [x] **4.3** Выполнить `node --test evals/outcome-completion/browser.test.mjs`; expected4passed/0failed. Сохранить исходные setup failures, если они были. Нет браузера — capability blocker, не установка или product failure.
- [x] **4.4** В rubric явно записать предел: quantity control содержит совместную ошибку quote/UI, а не независимую DOM-only mutation. Данные DOM собираются до assertion; отдельная DOM-only mutation относится к W3, не добавляется скрыто в этот пакет.

**Проверка:** для каждого fault проваливается именно его assertion, здоровые соседние journeys проходят. Исходный weak check «непустой guide / есть число / есть Saved» прошёл бы broken surface; это объяснить в rubric, не внедрять слабую проверку в продукт.

## Task 5: Первая самостоятельная попытка и test-design review

**Результат:** исходный actor design, отдельное AQA review, actual действия/вывод; не копия evaluator test.

- [x] **5.1** Зафиксировать четыре испытания: none, guide, quantity, persistence, по одному новому instance и свежему actor-контексту на вариант. Три healthy/broken пары используют общий healthy control. Контроллер хранит mapping отдельно; actor получает cases.md и URL, но не этот implementation plan, fault labels или controller results. Если свежие контексты недоступны, отметить повторный контекст и не заявлять четыре независимые первые попытки. README entry не содержит answer key.
- [x] **5.2** Передать actor точное поручение:

> Проверь три обещания локального продукта: инструкция для текущего cohort, согласованная цена выбранного количества и сохранение заметки после повторного открытия. Источник требований — cases.md и /requirements. Действия разрешены только на supplied loopback origin; Save меняет лишь память этой фикстуры. Сначала предложи проверки с источниками ожиданий и остановись до review. Затем используй доступные существующие инструменты, сохраняй фактические наблюдения и ограничения; не делай продуктовый PASS из HTTP200 или текста Saved. Не читай fixture source, reviewer key и evaluator tests. При общем filesystem это open-context sample.

- [x] **5.3** Сохранить первый ответ без правок; отдельный reviewer проверяет три claims и counterexamples по rubric. Reject сохраняется; тот же actor исправляет только конкретные findings. Его исправление не считается идеальной первой попыткой.
- [x] **5.4** После review actor реально исполняет выбранные проверки. Сохраняются source/tool/capture interval, ошибки и помощь. Недостающую capability или oracle не закрывать готовым ответом контроллера.

**Проверка:** actor не получает правильный итог вместо задачи; полученный результат отдельно оценён adequate/inadequate/indeterminate по каждому claim. Общий verdict fixture не переносится на Freeland/rw-int.

## Task 6: Сохранить trial и подготовить readback реального владельца

**Результат:** неизменный локальный trial record и выбранный поддержанный reader/writer для T7. Новая synthetic registration не нужна.

- [x] **6.1** Сохранить исходные actor/reviewer outputs в новом private run root. Для каждого из четырёх trial записать fixture revision, фактические действия, время capture, observed outcome по G/Q/P, помощь и ограничения. Не присваивать synthetic наблюдениям IDs реального продукта.
- [x] **6.2** Подготовить sanitized runs/w0-w1-first/README.md по этим исходным данным: первая попытка и исправления отдельно; fixture controls и actor performance отдельно. Это local unattested trial, не managed receipt и не product PASS.
- [x] **6.3** Для выбранного в T1 live owner прочитать его полный selected skill и required references. Если это Starter observation lane, прочитать agent-observations.md выбранной версии и подтвердить существующие publication/target bindings; для Freeland использовать его собственный evidence path. Ничего не регистрировать заново. Read-only [owner source/binding preflight](../../qualification/outcome-visible-content-20260924.md#live-remaining-only-w1-t7) завершён; live T7 и свежий account/build не квалифицированы.
- [x] **6.4** Новый reader-контекст читает trial record и актуальный checkpoint live owner. До действий перечисляет completed/partial/unobserved и конкретный остаток. Ошибка чтения означает blocker, а не отсутствие observations. Если предыдущий write имеет unknown outcome, сначала readback существующего ID/bytes, не повтор с новым временем.

**Проверка:** trial переносим без устной подсказки, реальный scope не заменён synthetic scope. Фактический managed append/readback проверяется только на результате T7; T6 сама его не доказывает.

## Task 7: Один реальный remaining-only consumer

**Результат:** новая полезная проверка у прежнего product owner либо явный pending live exit.

- [x] **7.1** Вернуться к кандидатуT1; прочитать его актуальный checkpoint, selected specialist, frozen runtime, environment/build/account и original scope. Не выдавать изначальный кандидат за нынешнюю готовность.
- [x] **7.2** Снять current reader readback до действия. При поддержанном owning Console ordinary-run:

    : "${QA_WORKSPACE:?owner workspace required}"
    : "${QA_RUN_ID:?exact existing run required}"
    npm run qa-campaign -- status --workspace "$QA_WORKSPACE" --run-id "$QA_RUN_ID"

Команда работает из runtime владельца, не обязательно текущего canonical Console. Unsupported runtime — его documented reader/fallback; не обновлять campaign pin ради команды.

- [x] **7.3** Новый actor называет один готовый незавершённый case, оставшуюся assertion, основание expectation, разрешённое действие и stop condition. A done не повторяется без drift; B unknown сверяется до retry; независимый C выполняется.
- [x] **7.4** Выполнить только разрешённый остаток, сохранить actual outcome/limitations через owning lane и повторить scope readback. Нет authority/fixture — точный blocker и независимая работа, не новая покупка/черновик/AI-запуск.

Для уже выбранной Starter observation lane подготовить exact `{manifest, artifact}` envelope ≤65536байт по agent-observations.md: реальные target/publication bindings, captureTime, author.authoredAt, limitations и attachments=[]. Сохранить исходные bytes в private run root, не создавать новую JSON-схему. Из фактического owning Console с явно установленными переменными выполнить:

    : "${QA_STARTER_REPO:?exact owning Kernel required}"
    : "${QA_WORKSPACE:?existing absolute workspace required}"
    : "${QA_OBSERVATION_INPUT:?private exact envelope required}"
    npm run qa-campaign -- record-observation --workspace "$QA_WORKSPACE" < "$QA_OBSERVATION_INPUT"
    # QA_EVIDENCE_ID берётся только из результата предыдущей команды.
    : "${QA_EVIDENCE_ID:?returned evidence ID required}"
    npm run qa-campaign -- read-observation --workspace "$QA_WORKSPACE" --evidence-id "$QA_EVIDENCE_ID"
    npm run qa-campaign -- observations --workspace "$QA_WORKSPACE"

Этот рецепт не применяется к Freeland или другому неподдержанному runtime. В принятой lane новый reader сверяет hash, binding и полный scope; caller-authored/unattested не превращается в sealed PASS. При unknown append сначала reconciliation сохранённых bytes, не повторная запись.

- [x] **7.5** Reviewer сравнивает до/после: какой исходный пункт получил новое evidence, что осталось, не потеряны ли clauses и original/additional denominator. Реального ответа человека не было — help→reply→resume остаётся отдельным W6 exit.

**27 September acceptance:** пользователь разрешил заменить ранее выбранный rw-int кандидат на существующего Agentify owner. Новый consumer сохранил первый reader/plan, выбрал прежний незакрытый audience target из полного знаменателя 21, прошёл отдельно рассмотренный публичный owner → store → owner маршрут и записал через owning lane один `PARTIAL`, `agent_authored_unattested` result. Независимый readback: 21 targets / 1 current recorded / 20 `not_observed`, три прежних historical observations и 15 blockers сохранены. [Отдельный T7 AQA и W1 synthesis](../../qualification/w1-outcome-and-remaining-consumer-20260927.md) принимают §§7.1–7.5, не весь продукт и не W6 help→resume; исходные BLOCKED/STOPPED попытки не переписаны.

**Проверка:** сохранённый отчёт или fixture continuation не засчитываются вместо реального действия. FAIL/PARTIAL полезны при достаточном evidence; необоснованный PASS недопустим.

## Task 8: Приёмка среза и переносимый checkpoint

**Результат:** отдельные итоги fixture integrity, actor quality, storage и live continuation; не общий зелёный total.

- [x] **8.1** Выполнить scoped gates: `node --test evals/outcome-completion/fixture.test.mjs`, `node --test evals/outcome-completion/browser.test.mjs`, root `npm test`, `npm run sources:verify`. Не запускать default child npm test или продуктовые suites.
- [x] **8.2** В runs/w0-w1-first/README.md сохранить actual source/host/model, первые ошибки и помощь, reviewer verdict по каждой задаче, counts/время и границы. Приватные URLs/account/session/managed state не публиковать.
- [x] **8.3** Независимое итоговое review проверяет T2→T4 неизменность expectations и T5/T6/T7 достаточность. Без T7 отметить «controlled W1 принят, live W1 pending», не закрывать весь W1/P3/P5.
- [x] **8.4** Обновить current checkpoint фактом, а не будущим обещанием; сохранить только проверенный разрешённый diff отдельным логическим коммитом. Pins и чужие изменения не добавлять. Push/PR отдельно.

## Самопроверка плана и handoff

- Восемь задач имеют отдельные результаты; шаги внутри — отдельные действия. Нельзя принять fixture unit tests за самостоятельный QA.
- T1/T2 покрываютW0; T3/T4/T5/T6/T7 покрывают три пары и actual remaining consumerW1; T8 фиксирует предел принятия.
- Будущие fixture API определены здесь; существующие status/observation команды сверены с selected Console. Это не обещание одинаковых CLI у всех historical owners.
- T3/T4 реализованы и проверены (fixture2/2, browser4/4); исходный предложенный код выше сохранён как история дизайна. Исполняемые файлы и execution correction в Review Focus — актуальный результат; повторная реализация не требуется. На 23 сентября live T7 был pending; 27 сентября он принят отдельно на разрешённом Agentify owner с `PARTIAL` и полным readback, без повторения локального среза.
- Дополнительные quote/UI mutation, live fixture и owner gaps не маскируются новой инфраструктурой. На момент первоначального плана точного будущего live caseID не было; позднее конкретный existing Agentify target был выбран через актуальный owner reader и принят отдельно, без вымышленной записи или замены исторического rw-int scope.
- Для исполнения этого связанного небольшого пакета достаточно inline implementer + отдельные test-design/final reviews; свежий actor T5/T7 нужен именно для оценки поведения. Режим исполнения подтверждается при передаче к реализации.
