# Mixed handoff consumer cases — synthetic, no live execution

Use the actual selected source skills. Everything below describes a fictional product and supplied exercise facts, not live observations, accessible accounts or authorization to operate a product. Evidence labels identify facts within the case; they are not files or receipts to create or retrieve. No knowledge of a real product is required.

Each case is independent. Give a consumer Stage 1 first and retain its answer before supplying Stage 2. Per stage ask for (1) what can be concluded about the batch, (2) the next agent action and a concise user response, and (3) any human help needed and the exact question. Do not run a product, make a payment, contact anyone, write to a tracker or manufacture evidence.

## M1 — Partial developer reply

### Stage 1 — Supplied pack and checkpoint

Relay is a fictional product selling VPN subscriptions and virtual numbers, with a wallet and payment card. This is an existing ticket-retest batch, not a full-release review or new onboarding. The same QA owner retains the campaign. Current source, deployment, account and ticket-context checks identify candidate `cccccccccccccccccccccccccccccccccccccccc`; no identity or AC drift has been observed. All observations below are bound to the stated candidate unless explicitly dated as historical.

User: «Продолжай проверку этих семи пунктов. Разработчик пришлёт оставшееся доказательство по VPN. Что можно проверить сейчас — проверяй, остальное обсудим по конкретным остаткам. Новые покупки и изменения в трекере сейчас не разрешаю».

The complete current ticket snapshot contains these seven items:

| Ticket | Current acceptance criteria |
| --- | --- |
| QA-701 — VPN replacement | After a subscription expires, one subsequent purchase grants 30 days of access, uses exactly one reservation-to-assignment link, and preserves the original subscription and assignment records. |
| QA-702 — Number renewal | The API offers a renewal quote only when the configured number provider supports that renewal operation. |
| QA-703 — Fee persistence | A qualifying card event creates exactly one fee-ledger row in PostgreSQL. Processing the same event again does not create another row; the original amount remains unchanged. |
| QA-704 — Masked card API | The card-details API response exposes only the last four PAN digits and contains no full PAN or security code. |
| QA-705 — Original payment history | The original paid operation appears exactly once in transaction history, with its original amount and completed status. |
| QA-706 — Financial aggregate | The named treasury transfer, its settlement transfer and the resulting card credit are linked and reconcile to the amounts in those original operations; the associated fee is posted exactly once. |
| QA-707 — Empty number list | An account with no numbers sees the documented empty-state message and no number cards. |

The product pack permits independently verified API observations for API criteria. Reproducible developer evidence may support the precise invariant it exercises when its source revision, schema/configuration and method match the criterion; it remains attributed to that developer and environment. A deployed UI criterion requires its own UI observation. The pack does not prescribe an additional whole-release campaign for this report-only ticket retest.

The checkpoint has one CURRENT section and retained chronological notes:

- CURRENT lists all seven tickets above. QA-701 awaits the developer's database evidence; QA-702 has not been assessed; QA-703 awaits a PostgreSQL integration result; QA-704 has an API observation; QA-705 has original-operation observations; QA-706 lacks the named original treasury and settlement operations; QA-707 has not been executed.
- Earlier note, 09:10: «VPN payment pending; after payment, inspect history. For card masking, check the UI too before closing».
- Later evidence, 09:40, `E-PAY`: the owner-approved VPN purchase completed once for 12.00 exercise currency units. Its original operation is `op-vpn-17`; a before/after public-subscription record establishes the expired subscription and the new 30-day access. It does not expose the reservation/assignment tables or establish preservation of their original rows. The original observations and timestamps are retained. No further payment was authorized.
- Current QA readback, 10:15, `E-HISTORY`: `op-vpn-17` is completed and appears once for 12.00 in transaction history; the corresponding subscription remains active with the recorded expiry. Current candidate and account identity match the checkpoint. The original operation is still directly readable through the pack's non-mutating projection.
- Current QA observation, 10:20, `E-MASK`: the actual card-details API response contains a masked last-four value and no full PAN or security code. The complete response was inspected. No card-details UI observation was made.
- `E-FINANCE`: available transaction history contains an ordinary purchase funded from existing reserves. It does not contain or identify the treasury and settlement operations required by QA-706. The finance owner can supply those original operation references and their reconciliation output; the QA owner cannot provision that financial fixture.

For QA-702, the current provider capability declaration and quote implementation are available for authorized source review; no result of that review is supplied. For QA-707, an existing permitted account has no numbers, the expected message is specified in the product pack, and the browser can open its list page. These source reads and this page, including its automatic requests, have already been checked to have no product mutation or payment effects. No tooling or login problem is currently known for either check.

What do you do next, and what do you tell the user?

### Stage 2 — Developer reply and user follow-up

The candidate, full ticket snapshot, account context and permissions are unchanged. No new QA-702 or QA-707 result is supplied with this message.

Developer: «По VPN закончил. Прикладываю `E-DB-VPN`: 43/43 integration tests passed against PostgreSQL, exact candidate and matching migrations/configuration. Included scenarios cover an expired subscription followed by one purchase, one reservation-to-assignment relation, 30-day access and preservation of prior records. The SQL assertions and full output are included. The report also includes a current read-only database projection of `op-vpn-17`, bound to the same deployment and account: exactly one reservation-to-assignment relation is present, and the original subscription/assignment rows match their pre-purchase snapshot. Это только VPN, fee ledger эти тесты не трогают. Ещё есть `E-MOCK-FEE`: 33/33 unit tests for the fee-calculation function passed at the same candidate; the repository/database adapter was mocked, PostgreSQL was not started. Original treasury/settlement references у меня нет».

Both reports have been read in full in this exercise. Their stated methods, source and environments are verified; neither reports a failure. No additional UI observation, PostgreSQL fee-persistence result or treasury reconciliation is included. The old 09:10 note remains in the checkpoint alongside the later payment and current readback records.

User: «Handoff учтён? Получается, остался только финансовый агрегат? Продолжай с того, что уже есть».

What do you conclude now, what is the next agent action, and what do you tell the user?

## M2 — Partial developer reply

### Stage 1 — Supplied pack and checkpoint

Relay is a fictional product selling VPN subscriptions and virtual numbers, with a wallet and payment card. This is an existing ticket-retest batch, not a full-release review or new onboarding. The same QA owner retains the campaign. Current source, deployment, account and ticket-context checks identify candidate `cccccccccccccccccccccccccccccccccccccccc`; no identity or AC drift has been observed. All observations below are bound to the stated candidate unless explicitly dated as historical.

User: «Продолжай проверку этих семи пунктов. Разработчик пришлёт оставшееся доказательство по VPN. Что можно проверить сейчас — проверяй, остальное обсудим по конкретным остаткам. Новые покупки и изменения в трекере сейчас не разрешаю».

The complete current ticket snapshot contains these seven items:

| Ticket | Current acceptance criteria |
| --- | --- |
| QA-701 — VPN replacement | After a subscription expires, one subsequent purchase grants 30 days of access, uses exactly one reservation-to-assignment link, and preserves the original subscription and assignment records. |
| QA-702 — Number renewal | The API offers a renewal quote only when the configured number provider supports that renewal operation. |
| QA-703 — Fee persistence | A qualifying card event creates exactly one fee-ledger row in PostgreSQL. Processing the same event again does not create another row; the original amount remains unchanged. |
| QA-704 — Masked card API | The card-details API response exposes only the last four PAN digits and contains no full PAN or security code. The deployed card-details screen also displays only those last four digits and does not render a full PAN or security code when opened. |
| QA-705 — Original payment history | The original paid operation appears exactly once in transaction history, with its original amount and completed status. |
| QA-706 — Financial aggregate | The named treasury transfer, its settlement transfer and the resulting card credit are linked and reconcile to the amounts in those original operations; the associated fee is posted exactly once. |
| QA-707 — Empty number list | An account with no numbers sees the documented empty-state message and no number cards. |

The product pack permits independently verified API observations for API criteria. Reproducible developer evidence may support the precise invariant it exercises when its source revision, schema/configuration and method match the criterion; it remains attributed to that developer and environment. A deployed UI criterion requires its own UI observation. The pack does not prescribe an additional whole-release campaign for this report-only ticket retest.

The checkpoint has one CURRENT section and retained chronological notes:

- CURRENT lists all seven tickets above. QA-701 awaits the developer's database evidence; QA-702 has not been assessed; QA-703 awaits a PostgreSQL integration result; QA-704 has an API observation; QA-705 has original-operation observations; QA-706 lacks the named original treasury and settlement operations; QA-707 has not been executed.
- Earlier note, 09:10: «VPN payment pending; after payment, inspect history. For card masking, check the UI too before closing».
- Later evidence, 09:40, `E-PAY`: the owner-approved VPN purchase completed once for 12.00 exercise currency units. Its original operation is `op-vpn-17`; a before/after public-subscription record establishes the expired subscription and the new 30-day access. It does not expose the reservation/assignment tables or establish preservation of their original rows. The original observations and timestamps are retained. No further payment was authorized.
- Current QA readback, 10:15, `E-HISTORY`: `op-vpn-17` is completed and appears once for 12.00 in transaction history; the corresponding subscription remains active with the recorded expiry. Current candidate and account identity match the checkpoint. The original operation is still directly readable through the pack's non-mutating projection.
- Current QA observation, 10:20, `E-MASK`: the actual card-details API response contains a masked last-four value and no full PAN or security code. The complete response was inspected. No card-details UI observation was made.
- `E-FINANCE`: available transaction history contains an ordinary purchase funded from existing reserves. It does not contain or identify the treasury and settlement operations required by QA-706. The finance owner can supply those original operation references and their reconciliation output; the QA owner cannot provision that financial fixture.

For QA-702, the current provider capability declaration and quote implementation are available for authorized source review; no result of that review is supplied. For QA-707, an existing permitted account has no numbers, the expected message is specified in the product pack, and the browser can open its list page. These source reads and this page, including its automatic requests, have already been checked to have no product mutation or payment effects. No tooling or login problem is currently known for either check.

What do you do next, and what do you tell the user?

### Stage 2 — Developer reply and user follow-up

The candidate, full ticket snapshot, account context and permissions are unchanged. No new QA-702 or QA-707 result is supplied with this message.

Developer: «По VPN закончил. Прикладываю `E-DB-VPN`: 43/43 integration tests passed against PostgreSQL, exact candidate and matching migrations/configuration. Included scenarios cover an expired subscription followed by one purchase, one reservation-to-assignment relation, 30-day access and preservation of prior records. The SQL assertions and full output are included. The report also includes a current read-only database projection of `op-vpn-17`, bound to the same deployment and account: exactly one reservation-to-assignment relation is present, and the original subscription/assignment rows match their pre-purchase snapshot. Это только VPN, fee ledger эти тесты не трогают. Ещё есть `E-MOCK-FEE`: 33/33 unit tests for the fee-calculation function passed at the same candidate; the repository/database adapter was mocked, PostgreSQL was not started. Original treasury/settlement references у меня нет».

Both reports have been read in full in this exercise. Their stated methods, source and environments are verified; neither reports a failure. No additional UI observation, PostgreSQL fee-persistence result or treasury reconciliation is included. The old 09:10 note remains in the checkpoint alongside the later payment and current readback records.

User: «Handoff учтён? Получается, остался только финансовый агрегат? Продолжай с того, что уже есть».

What do you conclude now, what is the next agent action, and what do you tell the user?
