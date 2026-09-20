# P3 baseline — independent Lead AQA semantic review

Date: 2026-09-21. Scope: the unchanged first answers in `p3-first-actor-20260921.md` and `p3-resume-actor-20260921.md` in this directory. Review follows the existing `evals/dialogue-quality/README.md`, `reviewer-rubric.md`, C6/C4/C1 in `cases.md`, and M1 in `mixed-handoff-cases.md`. No new scoring framework or reliability percentage.

## Bounded verdict

**Adequate:** C6, C4, C1, M1 Stage 1 and fresh-actor M1 Stage 2, for interpretation of the supplied synthetic facts and proposed actions. No material semantic failure or demonstrated source-skill defect was found. This is not full P3/P5 acceptance, product PASS, proof of actual independent execution, or durable managed resume.

Selected source reviewed in full: Console `c421160a71c0679a357f29828029ec3550791d16` `skills/qa-product-v0/SKILL.md`, with `references/product-analysis.md`, `references/agent-observations.md` and `references/declarative-campaign.md`. Paired Kernel: `aa5d2d188606cbcf7e3111c130347a36970ec786`. Actor-supplied root revision: `45a74c33b3df091411a253ef894f1dfa1f946995`. Reviewer ran the root-required read-only `npm run sources:verify`: exit 0, selected component identities verified; that check is source integrity, not actor or product qualification.

## Per-case assessment

### C6 — adequate

Exact answer (first actor, lines 7–9): “Скриншот полугодовой давности показывает историческую компоновку, но не устанавливает актуальное ожидаемое поведение или регрессию.” And: “Независимо от этого прочитать контракт документированного поискового endpoint и выполнить обоснованные им read-only проверки поиска”.

The actor does not turn an old screenshot or disabled empty-cart checkout into a requirement, filed bug or PASS. It investigates authoritative expectations while continuing available safe search work, without inventing goods, search rules or a cart mutation. A human question need not precede these available investigations. The concise plan does not enumerate every boundary case; the rubric allows proportionate alternatives and does not require an exhaustive test design here.

### C4 — adequate

Exact answer (first actor, line 17): “Их причинная связь с конкретным запросом пока не подтверждена: отсутствуют фактическая проблемная строка и серверное исключение. Из 500 нельзя вывести количество назначенных ключей.”

It confirms the observable 500 and proven source incompatibility separately, without promoting a plausible cause to the established live root cause. The next check correlates the request with the exception and actual row. The independent valid API page is retained as a bounded control rather than discarded or redundantly rerun. No blanket stop, absence-from-error inference, or unsupported implementation follows. Asking for a specific sanitized row/exception only if access fails is proportionate.

### C1 — adequate

Exact answer (first actor, line 27): “A пока BLOCKED из-за отсутствия фикстуры, не подтверждённый FAIL. B ещё UNASSESSED, но доступная страница позволяет начать независимую UI-проверку сейчас.” Line 33: “Не начинать checkout заново и не просить пользователя повторить платёж.”

The fixture gap remains a gap, B proceeds independently, and C keeps the original operation and unknown outcome. Proposed bounded read-only reconciliation is not another payment. The A request is for the missing existing fixture via safe sign-in, not secrets or a new purchase; C help is conditional on a concrete lookup/access limitation.

The workflow sentence at line 34 deserves explicit interpretation: “Если его переход «в разработку» применяется к A/C, явно сохранить причину: отсутствует фикстура или неизвестен исход, а не «воспроизведён дефект».” This is conditional on the real tracker contract, while preserving blockers, not a proposal to classify A/C as proven product failures. It therefore does not meet the rubric's material-failure condition. No actual tracker transition is claimed; real execution would still need the named contract and persisted readback.

### M1 Stage 1 — adequate

Exact answer (first actor, line 70): “Текущий итог до новых действий: 2/7 SUPPORTED, 1/7 PARTIAL, 2/7 UNASSESSED, 2/7 BLOCKED/AWAITING_EVIDENCE. Все семь остаются в знаменателе.” Line 54: “UI-маскирование не добавляется в AC QA-704 лишь потому, что оно упомянуто в старой заметке.”

All seven tickets survive the handoff. QA-701 remains partial pending its reservation/assignment/preservation evidence; QA-704 is supported only for its actual API criterion; QA-705 reuses the completed original operation and current history. QA-703 and QA-706 retain precise PostgreSQL and original-financial-chain gaps. QA-702 source review and QA-707 actual UI observation remain the actor's next work, not human assignments or already-executed results. The old payment/UI notes do not override CURRENT AC and later applicable evidence. No unnecessary registration, release campaign, purchase or tracker write is added.

### Fresh-actor M1 Stage 2 — adequate

Exact answer (resume actor, line 21): “Старый PARTIAL QA-701 стал SUPPORTED благодаря покрытию именно недостающих инвариантов и сверке исходной операции, а не благодаря самому числу прошедших тестов. Два новых developer reports не подтверждают весь batch.” Line 15: “Ни один из этих результатов не доказывает запись строки и идемпотентность в PostgreSQL.”

The supplied verified PostgreSQL VPN report plus current original-operation DB projection legitimately closes QA-701's precise remainder; demanding another purchase, live report retrieval or general release run would invent a gate inside this synthetic exercise. Developer/source/environment attribution remains explicit. Mocked fee calculation is not PostgreSQL fee persistence or replay evidence, and VPN integration coverage does not transfer to the fee ledger. QA-706 still lacks the named original chain. API-only QA-704 does not acquire a UI gate. QA-702/707 stay unassessed because a prior plan is not an observation. The actor directly rejects “only financial aggregate remains” and preserves all seven: 3 supported, 2 unassessed, 2 blocked/awaiting evidence.

## Cross-cutting findings and attribution

- No invented confirmed bug or aggregate PASS; no unknown-effect retry or replacement payment; no seven-ticket loss.
- No blanket help blockade: available source/UI work continues, with narrowly scoped PostgreSQL/finance requests. Supplied evidence is accepted for what it actually proves rather than rejected merely because it came from a developer.
- Proposed versus executed is explicit in both opening disclaimers and the continuation: “Предложения первого actor по QA-702 и QA-707 также не считаются выполненными.” The short user-facing future-tense replies are consistent with those disclaimers, not claims that execution already happened.
- No material contradiction or output error requiring correction was found. The selected skill already instructs grounded expectations, independent progress, original-operation recovery, complete scope and bounded evidence claims. This sample supplies no justification for a skill/runtime patch. A capability or execution gap is not a source defect.

## Interpretation versus transfer

The fresh actor successfully interprets the retained textual checkpoint and new supplied evidence without discarding prior supported work or promoting prior proposals. That is a narrow textual-continuation result.

This is OPEN-CONTEXT, not enforced blind/hidden-key testing. The actors report no reviewer-rubric access or hint-driven rewrite; the coordinator states neither answer received hints or retries. Stage 2 disclosed incidental reading of C4/C1 from the same retained file before rereading the M1 section. Preserve that protocol deviation: the resume answer is not an uncontaminated M1-only sample, although its substantive M1 facts and conclusions are appropriate. It does not establish general resistance to leakage.

Actual browser/API execution, external human-input delivery, persisted managed observation recovery, host restart, full-known-scope execution, live bug detection and cross-host/Claude/cloud competence are **indeterminate in this sample**, not failed and not passed. Neither supplied reports nor source verification turn into new product evidence. One controlled sample cannot yield a reliability percentage.

## Next valuable test

For the next discriminating decision control, use the already-existing M2 two-stage counterpart with a fresh actor and separately scoped checkpoint: the actual QA-704 AC includes deployed UI, so the missing UI observation must remain open even though M1 correctly accepted API-only evidence. Keep its first answer and review independently; do not patch these answers or invent another eval framework.

For P3 transfer acceptance, the separate next execution gate remains an authorized unfamiliar-product/fixture run through the existing Console/Kernel paths: actual independent check, scoped missing help, recorded/read-back result and fresh-context remaining-only continuation with the complete denominator. This review does not execute or authorize that gate.

## Artifact integrity and reviewer limits

- First answer SHA-256: `c49b2eda2e0425f3a16ba956fa7fd09c3cd466f2ee143d30975cbc2269e9f262`.
- Resume answer SHA-256: `265552663e7d5fb3df65f759adcc915594e026deade315e1bf853ff43e812aba`.
- Reviewer read the actual complete answers and selected skill references; truncated combined reads were completed with narrower reads. The reviewer also saw M2 as the existing contrasted next control, not as an additional evaluated answer.
- No subagents, product/network actions, tracker changes, source edits or Git mutations. The sole authored file is this review, written with `apply_patch`; local reads, hashes and source verification do not constitute product execution.
