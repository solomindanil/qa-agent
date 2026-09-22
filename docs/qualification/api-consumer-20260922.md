# Fresh API-contract consumer — 22 September 2026

## Bounded result

A fresh consumer authored two complete API checks (eight assertions) before
seeing any release response. Independent AQA accepted that first design without
semantic correction, then reviewed all five actual bound plans and CLI
validations before execution. The unchanged checks detected all three seeded
contradictions and accepted both healthy representations in this small sample.
This closes the planned documentation-assisted API consumer experiment, not
whole P2/P5, hidden transfer testing or full-product acceptance.

| Local control | OpenAPI check | Independent status check | Retained campaign verdict |
| --- | --- | --- | --- |
| q2: healthy | pass | pass | NEEDS_HUMAN |
| n8: HTTP200 + correct JSON media type, wrong operation summary | needs_review: json_pointer_mismatch | pass | INCONCLUSIVE |
| c4: correct JSON body, text/plain media type | needs_review: media_type_mismatch | pass | INCONCLUSIVE |
| r6: correct media/body, HTTP503 | needs_review: status_mismatch | pass | INCONCLUSIVE |
| t9: healthy, reordered/extra fields and case/quoted-charset variation | pass | pass | NEEDS_HUMAN |

Ten check instances: seven pass and three needs_review. The three mismatches
each have the runner's two attempts; each passing check has one: 13 attempts
across five campaigns, not ten independent consumers. No extra campaigns or
automatic confirmed-bug dossiers were created. In n8, status, media type,
OpenAPI version and title pass before the summary assertion fails. A correct
header therefore did not conceal wrong JSON meaning. Zero observed false
alarms on the two healthy variants is a sample result, not an estimated rate.

At the first-attempt assertion level there are 40 planned clause instances:
30 passed, three failed and seven **unassessed** because the runner stops at
the first failure (three subsequent clauses in c4, four in r6). Retry attempts
do not enlarge this denominator. The [post-run verification](evidence/api-consumer-20260922/actor/post-run-verification.json)
and retained [raw results/traces](evidence/api-consumer-20260922/final-inventory.json)
make this distinct from the ten check-level outcomes.

Each workspace retains five graph targets: two checked endpoints plus the
general API-surface gap, documentation outside scope and member audit without
identity. Plans retain three blockers; documentation's reason explicitly says
UNASSESSED despite the native generic blocked disposition. The five inherited
strategy blockers are preserved discovery records, not five freshly verified
current missing oracles. No whole-product PASS is inferred from the two checks.

## Source, procedure and evidence

Root baseline `fcc211c53b11d19da6d192c7d9401865fae44326`, branch
`codex/p2-semantic-source-delivery`. Console remains
`8065713fba11446e32ec2f76832d65110550989b`; Kernel remains
`aa5d2d188606cbcf7e3111c130347a36970ec786`. No component, source pin, installed
skill, real product or previous campaign was changed.

- The [normative brief](evidence/api-consumer-20260922/actor/product-brief.md)
  precedes the immutable [first design](evidence/api-consumer-20260922/actor/first-design.json)
  and [rationale](evidence/api-consumer-20260922/actor/first-design.md).
  SHA256 of the first JSON is
  `e3ba08fe284e02b405991dd4ec14be599719536f8236b0caeb867c4241a7103c`.
- Controller used the existing registration fixture helper, then Kernel
  knowledge-revision/preview/apply/validate APIs for new isolated workspaces.
  No managed graph/catalog was hand-edited. The helper supplies deterministic
  actors/clock/discovery: **this is not qa-init onboarding qualification**.
- Consumer independently used current schema, `readCampaignWorkspace` and
  `writeNewCampaignPlan`, preserving every target. All five actual `validate`
  calls exited 0 with ok:true, executable2/blocked3. readyToRun:false retains
  those gaps; the source permits execution of the safe subset.
- [Initial AQA](evidence/api-consumer-20260922/controller/aqa-initial.md) and
  [exact-plan execution GO](evidence/api-consumer-20260922/controller/aqa-execution-go.md)
  have no findings. Reviews use a separate fresh internal agent context, not
  external expert attestation. Execution and the consumer's
  [final report](evidence/api-consumer-20260922/actor/final-report.md) also have
  bounded AQA GO. [Final tracked-delivery review](evidence/api-consumer-20260922/controller/aqa-final.md)
  likewise reports no critical, important or minor findings.
- One ordinary CLI run per unchanged plan, then exact-run status. All five run
  commands exit 1 for their honest non-PASS campaign verdict, not a tool crash;
  status commands successfully read those exact results. Complete metadata,
  UTC times and stdout/stderr are retained under
  [invocations](evidence/api-consumer-20260922/inventory.json).
- Coordinator independently used the existing persisted reader in a fresh plain
  Node process without a TS loader. All five plans/receipts compare exactly;
  original assertions and all blockers survive. Exact IDs/digests and per-file
  hashes are in [readback verification](evidence/api-consumer-20260922/controller/readback-verification.json).
  This probe verifies existing evidence; it is not another verdict engine.
- [Packaging gate](evidence/api-consumer-20260922/controller/root-gate.tap):
  61/61, no failed/cancelled/skipped tests. [Source verification](evidence/api-consumer-20260922/controller/source-verify.txt):
  4/4 unchanged components. There is no new runtime implementation, so no claim
  of a freshly rerun full component build/type/lint/suite or measured coverage.
  A [final packaging rerun](evidence/api-consumer-20260922/controller/final-root-gate.tap)
  also passed61/61, exit0. [Delivery verification](evidence/api-consumer-20260922/controller/delivery-verification.json)
  checks exact archived bytes/modes and118 indexed payloads; it explicitly
  distinguishes the earlier append-only attempt-log snapshot from its final
  version. These final gate/proof additions follow the review snapshot and do
  not change component bytes, plans or recorded results.

Original friction is retained: consumer initially used a wrong source-skill
path, one malformed rg flag and a tsx CLI invocation whose IPC listener was
denied by the sandbox. Supported Node loader resolved the invocation issue;
no assertions, dependencies or permissions were relaxed. Controller's first
listener attempt was likewise denied before registration, then ran with scoped
local-fixture escalation. [Consumer attempts](evidence/api-consumer-20260922/actor/attempts.md)
and [controller attempts](evidence/api-consumer-20260922/controller/attempts.md)
separate these from product failures. First design and bound plans succeeded;
the complete workflow is not claimed error-free.

One later capture reused the immutable pre-run integrity helper:
[invocation028](evidence/api-consumer-20260922/invocations/028-final-plan-verification/stdout.txt)
correctly checks plan integrity but ends with stale hardcoded
executionPerformed:false/awaiting-review metadata. It is preserved verbatim,
not treated as proof that execution did not happen. The separate
[invocation030](evidence/api-consumer-20260922/invocations/030-post-run-verification/stdout.txt)
derives the completed state from actual run/status records. This is probe
capture friction, not a runtime or product failure; the [post-run attempt log](evidence/api-consumer-20260922/actor/attempts-post-run.md)
records the correction without rewriting the original.

## Limits and next result

One fresh consumer used public docs that already include the exact pointer
example. The controller's mutation map was withheld by instruction on the same
host, not by a security boundary. This is documentation-assisted first-design
success, not independent unfamiliar-domain transfer, hidden-benchmark reliability,
statistical quality, Claude/Codex host parity or cost qualification. Costs and
model telemetry are not independently measured. No additional generic prompt,
runner, classifier or automatic bug-confirmation path was needed.

The original workspace and complete registration/runtime records are retained
under `/private/tmp/qa-api-consumer-20260922.iVqZ2s`; the tracked selection is audit
data, not a relocatable managed campaign or prerequisite for future product QA.
All five fixture listeners were stopped after the consumer completed HTTP work;
the owned controller process exited 0. Preserved journals contain exactly 23
GET requests: ten controller sanity reads and 13 campaign attempts, only to
the two assigned routes. No docs/member requests or mutations occurred.
Complete original records are additionally copied with modes preserved to the
ignored `.local/api-consumer-20260922.iVqZ2s/` archive. They retain original
workspace paths and are audit records, not a relocated execution registration.

Next, use the now-qualified API assertions when an existing product owner needs
them, without migrating old plans. Resume the outstanding real ticket/help/
remaining-only path only after actual readiness and owner reconciliation; do not
repeat this fixture as another P3 milestone or start a fourth product pilot.
P2-B privacy repair, live mixed-batch, P4 incremental usefulness and broader
P5/P6 gates remain open. No payments, tracker delivery, production, cloud,
watchers, installation or push occurred in this experiment.
