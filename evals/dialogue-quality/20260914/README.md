# Partial handoff — retained reasoning sample

14 September2026. Two fresh consumers used selected Console
`b54b849ac0438408a2c92f899e5221c7496611d7` and its source qa-product-v0 skill.
Kernel185, product sources and installed skills were unchanged. The new
browser-journey candidate was not their runtime and is not credited for these answers.

Each received only its [case](../mixed-handoff-cases.md) Stage1, answered, and was
then given Stage2. The parent retained both first replies without corrective
coaching. This is an **open-context controlled synthetic sample**: prompts asked
consumers not to read the other stage/case, but the host did not enforce blind
file-access separation. The M1 source-path typo and correction are disclosed in
its record. There were no product, payment, test-suite or tracker actions.

Original answers:

- [M1: API-only masking criterion](m1-first-responses.md).
- [M2: explicit additional UI masking criterion](m2-first-responses.md).

## Independent Lead AQA semantic review

Accepted the four retained replies as a bounded reasoning sample. No material
false PASS, invented acceptance criterion or batch-wide blocker was found.

| Case | Stage1 fully supported tickets | Stage2 fully supported tickets | Preserved Stage2 remainder |
| --- | --- | --- | --- |
| M1 |704,705 |701,704,705 |702,703,706,707 |
| M2 |705 |701,705 |702,703,704,706,707 |

Both consumers accepted the VPN handoff only for its exact covered invariants
and original operation, kept mock-only fee tests separate from PostgreSQL
persistence, resolved stale payment-pending text using later evidence, and did
not propose another payment. They explicitly rejected “only the financial
aggregate remains,” accounted for all seven tickets, and kept available source
review/empty-state work independent of financial help. M1 did not invent a UI
acceptance criterion; M2 retained the actual UI gap and checked opening safety.

**Minor communication finding retained:** M2 Stage1 named the missing PostgreSQL
fee evidence but asked explicitly only for finance materials. The developer had
promised VPN evidence, not fee evidence; an immediate separate fee request would
make ownership clearer. Its Stage2 answer does ask for that evidence. Do not
rewrite the first answer or call this fully polished user guidance.

Review also confirmed the clean selected Console commit. The Markdown records
allow semantic inspection, but do not independently authenticate consumer identity,
first-answer status, ordering or actual skill loading. These are parent-recorded
execution details, not cryptographically authenticated evaluator receipts.

## What follows, and what does not

No new skill behavior or engine was added because the main decisions already
worked in these examples. The concrete ownership/first-question finding belongs
in the next actual mixed-handoff consumer check, alongside preserved scope and
independent execution; it is not grounds for a large instruction rewrite.

This does **not** prove actual SQL/payment/UI behavior, discovery of truthful
requirements, source-report verification, checkpoint persistence, fresh-process
tool continuation, tracker readback, Claude/cloud operation, full Stage3 or an
agent reliability percentage. Those remain the [global plan's](../../../docs/superpowers/plans/2026-09-13-universal-qa-global-plan.md)
execution gates. The next useful evidence is a real allowed consumer doing the
available checks, retaining its blocked lane, then processing a partial reply.
