# W6 rw-int unknown-run read method — 24 September 2026

This is a source-contract lookup for the existing rw-int synthetic campaign,
not a live run-status result or permission to repeat an AI action. The
retained owner checkpoint reports that the UI showed “Анализ остановлен” for
one Media Plan turn, while its persisted terminal state had not been read
back. The exact private project/run/tenant bindings remain in
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

The existing product owner should recheck origin/account/tenant and use only
their own supported authenticated transport for this exact GET. Do not copy
the bearer token into this source task or a report. Confirm that non-null
`id` and `projectId` match before interpreting status. Even `completed` would
not prove a Media Plan was saved or that no external effect occurred; those
need separate readback. No live GET result was obtained in this source
reconciliation. Retry, cancel and a new AI turn remain prohibited until the
unknown outcome is reconciled under owner scope.
