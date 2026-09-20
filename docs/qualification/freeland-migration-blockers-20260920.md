# Freeland migration blockers — read-only triage, 20 September 2026

## Latest follow-up — merchant evidence and changed PR head

Global QA-agent development explicitly paused by owner after root aa31ba5. Nikita reports merchant observations at11:37–11:40UTC:6bb has two unique exact lookups, both CREATED,1095.67RUB,fee82.18RUB,expired payment window; bf6 remains unique terminal FAILED,397.32RUB; Lava current detail404/search total0, historical keys401, no linked refund events found in searched PM2 logs. These are developer-reported results; original merchant artifacts were not independently obtained or hash-verified. Provided artifact digests: PayAssist49ee2b24a3bb9b1e8374bdbefbea7e1aa2b93321155e446075690f6345eaf24b; Lava69f371d71783fc8043c483ebc6bc018fb6af76965a633cc783246eb0154f661a.

Fresh authenticated GitHub read independently confirms PR430 OPEN at **f3b7b676a435c887bb07448657ef7e04f15998e2**, four commits after previously reviewed e531408. Delta includes RPC hardening and real SQL fixtures, but this follow-up did not rerun them. Earlier F1/F2 findings are dated to e531408: neither automatically unresolved nor verified fixed on this new head. Main CI verify-runtime-shapes SUCCESS; [new target migration harness](https://github.com/nuanu-ai/freeland_app/actions/runs/35507090636/job/106068637763) FAILURE during runner setup: `Freeland staging runner pre-job identity rejected.` SQL tests did not run in this job.

Disposition: bf6 has a reported basis for owner-approved unpaid resolution, not blanket technical/execution approval; qualify updated resolver and schema deployment order first.6bb remains nonterminal: expiry and fee fields are not proof of charge or no-charge. Lava404/empty searches/absent scanned events do not establish no refund because historical merchant access is unavailable. Request authoritative historical capture/settlement/refund/reversal/chargeback evidence for the exact contract; preserve existing entitlement and operation, no duplicate fulfillment. Financial-owner disposition and technical qualification remain separate. No production SQL, provider call, payment, resolver, tracker write or deploy performed here; no migration/product GO.

Follow-up: user-authorized technical review of PR430 is complete within its bounded scope. See [technical findings and isolated test evidence](freeland-pr430-technical-review-20260920.md): 61 unit + 21 route tests and one additional mocked callback probe passed; actual local PostgreSQL probe reproduced missing-field acceptance in the SQL resolver. Full migration harness remains blocked at runner setup. The no-SQL statement below describes the initial triage only; subsequent SQL ran exclusively in a disposable local synthetic database, never production.

Scope: user supplied Nikita's two follow-ups and explicitly paused QA-agent development. No new product campaign, provider call, payment, SQL, resolver execution, tracker/Buzz delivery, migration or deploy was performed. No new product release verdict is issued.

## Attribution

Production compatibility, six applied migrations/no residue, checkout merchant status and worker503 are developer-reported facts, not independently re-observed here. Corrections replace the earlier reported scale and missing-link assumptions: PayAssist amounts USD13.00/RUB1095.67 and USD5.00/RUB397.32; Lava USD5.00 plus USD0.40 fee. Lava has a reported money-operation/subscription linkage and fulfilled access, with ledger settlement missing. Do not repeat provisioning based on the older missing-product account.

Independently read through authenticated GitHub CLI:

- PR430 OPEN, head `e531408f41fcd2e68d4ca4fb7af54e6e31d014f9`, base `98262828a3f506a6e5ce9094968bed917433abc6`.
- Main `verify-runtime-shapes` SUCCESS; separate `target-payment-migration-harness` FAILURE, run35501081810/job106052848596. Failed setup log: `Freeland staging runner pre-job identity rejected.` The SQL harness did not start; neither a migration test failure nor a passing SQL gate may be inferred.
- PR description explicitly excludes Lava legacy recovery. It introduces an audited PayAssist resolver and a prerequisite migration before the currently blocked cutover guard. Claimed local61 focused tests are not the same as61 successful GitHub steps.
- Read payment-financial-resolution.ts at exact head: evidence/owner approval binds checkout, provider reference and digest; final-status type excludes CREATED. Unique terminal match requires deterministic request ID, one result, zero provider fee, finalization time and raw evidence hash. This is limited source inspection, not complete PR acceptance or proof of provider finality.

## Separate remaining decisions

1. PayAssist bf6: developer reports one exact merchant match with FAILED. Eligible for financial-owner review, not already approved or resolved. Preserve original response and confirm the resolver's no-capture/no-refund/finality statements against actual evidence before signing its exact digest. Then qualified resolver/readback and duplicate/late-callback controls, under separate production authority.
2. PayAssist6bb: CREATED/pending despite expired payment window is not proof of final unpaid. Obtain provider/merchant final disposition or a separately designed approved risk-based abandonment path; never relabel pending as confirmed-unpaid to clear guard. Paid sibling remains a distinct transaction.
3. Lava: current GET404 cannot disprove an old capture/refund. Need merchant dashboard/export/support history for exact contract, capture/settlement and refunds/reversals/chargebacks. If retained capture and no refund are established, design/review idempotent repair of the linked existing ledger operation without duplicate charge, entitlement or refund. If refund exists, owner determines the corresponding recovery. This path is not implemented by PR430 as inspected.
4. Runner: Nikita restores legitimate runner identity/authorization and reruns PostgreSQL harness at the exact reviewed head; do not disable identity guard. Resolve this independently from obtaining merchant evidence.
5. Worker COINSLOT_DEPENDENCY_FAILED503: reported pre-existing, but still requires explicit impact/affected tasks/backlog/recovery assessment. Schema compatibility alone is not worker readiness or overall release GO.

## Order

Read-only PR/SQL review and evidence collection may proceed independently. Financial-owner approval does not replace SQL qualification or production-mutation approval. Prerequisite repair schema/application, if approved, must follow the reviewed deployment procedure; do not jump directly from an owner message to resolver execution. Only after exact dispositions, audited repairs/readback, repeat/late-callback qualification and a fresh zero-blocker guard can the remaining rollout sequence be considered. Post-deploy smoke is a separate authorized action. No blanket Go from this triage.

Sources: https://github.com/nuanu-ai/freeland_app/pull/430 ; https://github.com/nuanu-ai/freeland_app/actions/runs/35501081810/job/106052848596 .
