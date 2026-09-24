# W6 rw-int unknown-run readback — 24 September 2026

This is the source-contract lookup and subsequent bounded readback for the
existing rw-int synthetic campaign, not permission to repeat an AI action.
The retained owner checkpoint reports that the UI showed “Анализ остановлен”
for one Media Plan turn. The exact private project/run/tenant bindings remain in
`.local/products/realweb/qa-20260924/synthetic-campaign-02ee/REPORT.md`
(SHA-256 `fa391a1ddb97547f894250455ee02b3ef63147ae2a3e6f8a0c93de1684442b10`
at this check), not in tracked delivery.

The retained OpenAPI at
`.local/products/realweb/qa-20260923/full-userflow/openapi.json`
has SHA-256 `c15066415b83bfccec87f92d899a0a9f2826fe9af1c8691ee1a9878fa7a7c8c4`
at this check. Its documented operation
`get_v1_projects_by_projectId_agent_runs_by_runId` is:

```text
GET /v1/projects/{projectId}/agent-runs/{runId}
```

It requires the existing owner's Supabase bearer session and an
`x-tenant-id` UUID. Resolve exact project, run and tenant IDs only from the
private owner report above. The response schema allows
`data: null`; otherwise it includes exact `id`, `projectId`, `actorId`,
`status`, `checkpointVersion`, `cancellationRequested`, `pendingToolCall`,
`approvalDecision` and `updatedAt`. Terminal enum values are `completed`,
`cancelled` and `failed`; `cancellationRequested: true` alone is not terminal.

At approximately 02:15 UTC on 24 September, the exact GET was made once
from the authenticated owner's already-open staging browser origin using its
unexpired local session. No token was printed, copied to a file or sent to a
different origin. HTTP 200 returned non-null data with both `id` and
`projectId` matching the private owner report. The persisted result was
`status=cancelled`, `checkpointVersion=2`,
`cancellationRequested=true`, `pendingToolCall=null`,
`approvalDecision=null`, `updatedAt=2026-09-23T18:37:48.750Z`. This closes
only the unknown **run status**; the earlier UI-only observation remains
historical evidence, not the basis for this result. The same private local
note at `.local/products/realweb/qa-20260924/source-readonly-integration-20260924.md`
retains the exact scope and readback without duplicating private locators in
tracked source.

A separate same-session documented project-artifacts GET returned HTTP 200,
four rows with a limit of 100, and **zero** `type=media_plan` rows. Thus no
saved Media Plan is currently listed for the project; this is a current
list readback, not a historical before/after effect audit. Neither
`cancelled` nor this artifact list proves no transient or external effect
occurred or that a new request is safe. Those need separate owner-bound
effect reconciliation.
No retry, cancel, new AI turn or integration mutation was performed by this
source task. T7's expected connection/resource oracle is still unresolved.
