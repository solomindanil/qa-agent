# P6 fresh repository-entry report — 20 September 2026

## Scope and guardrails

Fresh-context, read-only entry exercise against only:

`/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/cold`

No product, network, browser, credential, install, campaign, commit, edit, test suite, or subagent action was performed. The only write is this report. `npm run sources:verify` was run exactly once as the first operation after reading the supplied root `AGENTS.md`; no root or child test suite was run.

## First answer to the user

Принят не «готовый универсальный QA для всех продуктов», а ограниченный и уже поставленный фундамент общего плана P0–P7.

Текущий source selector — `sources/manifest.v1.json`, и его bytes локально подтвердил `npm run sources:verify`:

- Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786` — активный owning source для bounded agent-authored observations и их чтения; `runtimeAuthority: true` здесь означает роль выбранного исходника, а не право запустить продукт и не runtime существующей кампании.
- Console `c421160a71c0679a357f29828029ec3550791d16` — активный Starter/Console source с точной authority на этот Kernel и исправленной полной reference-документацией observation CLI; это documentation-only successor к уже принятому runtime.
- Freeland `d4754f7ddbcb8183f695f479ef21aa7728c1ace0` — активный specialist source с принятыми readiness/PAY01 composition и source-only CI boundaries.
- `kernel-reporting-reference` `10d398d8a077068c2184f33958e9b654a2f2947c` — только исторический reference, `runtimeAuthority: false`; подменять им Kernel нельзя.

Текущий план — `docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md`, а его no-loss reconciliation — `docs/reviews/2026-09-16-global-plan-reconciliation.md`. Очередь остаётся P0–P7: безопасные границы/source delivery; сохранение agent-led evidence; семантически чувствительные проверки; full/ticket/help/resume; graph/learning consumer; cross-domain agent/capability evaluation; dialogue-ready delivery; затем только отдельно разрешённый cloud pilot. Матрица сохраняет 97 пунктов двух предыдущих планов, но это 97 требований плана, не 97 реализованных функций и не процент готовности.

Фактически принято сейчас:

- bounded P0 repairs/source delivery, локально проверенное тело узкого source/pure gate и Freeland PAY01 composition/readiness в выбранной lineage;
- P1 writer/reader/reference для text/JSON observations с точными bindings и provenance `agent_authored_unattested`;
- bounded real fresh-context consumer: ранее выполненное A не повторялось, оставшаяся C была продолжена; итог того среза — 21 target, 2 с observations, 19 not observed, без превращения observations в managed PASS или release GO;
- уже существующие bounded mechanisms для intermediate browser assertions, same-host continuation, controlled mixed handoff и graph consumer.

Не принято как общий результат: P0–P6 целиком, live/full product acceptance, installed-skill parity, actual Claude execution, browser/payment replay, host restart, broad agent-quality/coverage, hosted CI, deployment identity и cloud readiness. По P2 есть уже исполненный контрпример: fixture с правильными суммами/API rate 12.9%, но подписью выбранного tile `Комиссия 99%` всё ещё прошла 26/26. Это доказанный harness false acceptance, а не staging bug и не release false-PASS. Первый card-top-up wallet dialog остаётся отдельным consumer gap.

Реальный runtime существующих продуктов находится не в этом canonical source clone. Его выбирает владелец конкретной кампании и его последний `CURRENT`/owner checkpoint; он может намеренно быть старее manifest source. Для продолжения нужно:

1. выбрать продукт через `products/README.md`;
2. получить текущий product pack/handoff и последний owner checkpoint; если их нет, `~/.codex/qa-workspaces.md` можно использовать только как locator, не как authority;
3. из checkpoint восстановить exact frozen checkout/HEAD, workspace, registration/store, environment/candidate, scope, outcomes, unknown effects и разрешённые действия;
4. сверить найденное состояние и прочитать полный specialist skill/runbook до любой команды.

В этой clean delivery нет подтверждённого текущего private owner checkpoint для моих существующих Freeland/Agentify/MagicPay кампаний, поэтому exact live runtime честно остаётся неизвестным. Исторические task IDs, absolute paths и receipts в qualification-документах не должны молча становиться current. Если owner checkpoint не разрешается, блокируется продолжение именно этой кампании, но не независимый разрешённый source/fixture analysis.

Полный root router лежит в `skills/qa-check/SKILL.md`; он только выбирает specialist и после выбора прекращает действовать как workflow. Для Freeland полный source skill — `components/freeland/skills/freeland-release-qa/SKILL.md`. Перед product execution он требует owner-selected Freeland QA checkout, сверку HEAD/dirty state/`AGENTS.md`/`package.json`, полный `docs/local/freeland/AGENT-RUNBOOK.md`, нужные `PRODUCT-BRIEF.md` и `PRODUCT-MAP.md`, а для кампании также `ZERO-TOUCH-OPERATIONS.md`; single-ticket route дополнительно требует `references/exact-ticket-evidence.md`. Checkout и skill сами по себе не дают authority. Для нового или существующего Starter-managed продукта source workflow — `components/console/skills/qa-product-v0/SKILL.md` с references `product-analysis.md`, `declarative-campaign.md` и `agent-observations.md`; setup идёт через `qa-init` только при реальной регистрации/recovery, а зависимости, браузеры, credentials, plugins и permissions поставкой не предоставляются.

Следующее одно ограниченное действие: реализовать P2 semantic fee-caption regression в существующем Freeland Card/SBP helper — добавить healthy control для 12.9% и broken control для 99%, затем минимально связать явно показанный процент выбранного метода с rate его quote, сохранив нынешние zero-fee, selection, amount и checkout guards. После этого нужны независимый review и обычная source delivery. Этот срез не должен трогать live product, платежи, кампании или объявлять закрытым отдельный first-dialog top-up gap. В рамках данного упражнения реализацию я не начинал.

## Evidence map

Primary current-entry sources read:

- `AGENTS.md`
- `sources/manifest.v1.json`
- `docs/qualification/assembly.md`
- `docs/qualification/current.md`
- `docs/roadmap/README.md`
- `products/README.md`
- `skills/README.md`
- `skills/qa-check/SKILL.md` (complete; 31 lines)
- `docs/getting-started.md`
- `docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md`
- `docs/reviews/2026-09-16-global-plan-reconciliation.md`
- `docs/qualification/global-plan-entry-audit-20260920.md`
- `docs/qualification/agent-observations-20260920.md`
- `docs/qualification/observation-skill-reference-20260920.md`
- `docs/qualification/freeland-source-adoption-20260920.md`
- `docs/qualification/tracked-entry-delivery-20260920.md`
- `docs/qualification/second-product.md`
- `components/freeland/skills/freeland-release-qa/SKILL.md` (complete; 123 lines)

Commands executed from the cold root, in order:

1. `sed -n '1,240p' AGENTS.md`
2. `npm run sources:verify`
3. `git rev-parse --show-toplevel` plus reads of manifest, assembly, current checkpoint and roadmap
4. reads of product routing, skill index and complete root `qa-check`
5. reads/searches of the active plan, reconciliation, entry audit and portable setup
6. targeted rereads of P0–P7 and acceptance sections after a truncated combined output
7. heading/status searches in the four selected-source qualification records
8. read of tracked-entry record plus `git log -1` and `git status --short`
9. repository-scoped owner/runtime locator search and read of `second-product.md`
10. complete read of the Freeland specialist skill and its direct link inventory

`sources:verify` result was exit 0 and returned the four exact manifest entries above. Repository root resolved to the cold clone. Root HEAD was `c35e433ce3db63558c3d89cf01b527592b9cc1b0` (`docs: deliver reconciled global plan and single current entry`). No status lines were printed.

## Retrieval errors, ambiguities, and first-answer limits

- The first combined read of plan + reconciliation + audit + setup was truncated by the command-output limit (`original token count: 31325`). I did not treat the missing tail as read. I followed with targeted reads/searches of the active P0–P7 and acceptance sections.
- A later combined targeted read was also truncated around the later plan body. The user-facing first answer above relies for current selection/next action primarily on the concise `docs/qualification/current.md` and `docs/roadmap/README.md`, and for acceptance gates on the successfully retrieved targeted §9 lines. I did not claim exhaustive prose-level rereading of every plan line in one uninterrupted output.
- `docs/qualification/tracked-entry-delivery-20260920.md` still describes the docs change as a candidate whose independent review, committed cold-clone readback and fresh-context trial were pending at that checkpoint, while the checked-out HEAD is the later entry-delivery commit and the current entry presents it as active. This exercise supplies a fresh-context trial report but cannot self-approve its independent review or retroactively rewrite that dated checkpoint. Therefore I do not claim full P6 entry acceptance.
- The clone intentionally does not bundle authoritative current private owner checkpoints. A delivered evidence page contains dated private locator examples, and `second-product.md` contains a historical MagicCard owner task ID, but product routing explicitly says these do not select today's runtime. I did not open any path outside the cold clone to resolve them. Exact live runtimes therefore remain unknown, not guessed.
- The host-level `superpowers:using-superpowers` skill was not opened because the delegated exercise explicitly prohibited opening any path outside this cold clone except the report destination. Repository `AGENTS.md` was the mandated entry authority for this trial.
- I did not read the complete Console `qa-product-v0` bundle because no product execution or Starter operation was selected. I reported its canonical complete location and required references from `skills/README.md`/`docs/getting-started.md`; a future selected Starter lane must read that complete source skill and the relevant references before acting.
- The “first answer” section is preserved as the initial synthesized response after the repository reads above. This evidence appendix records later provenance/limitations; it does not silently replace the answer with a cleaner second version.

## Outcome

The fresh entry was sufficient to recover the accepted source tuple and roles, distinguish source selection from campaign runtime/authority, locate the active global plan and no-loss reconciliation, state bounded acceptance versus open exits, locate the full routing/specialist skill sources and prerequisites, and select the repository-declared next bounded source action. It was not sufficient—and is intentionally not supposed—to identify a private existing campaign's exact current runtime without its owner checkpoint.
