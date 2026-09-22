# Five bound plans ready for independent review

No product request or campaign execution has been performed. The original first design and rationale remain unchanged. Current supported APIs parsed, exclusively wrote and read back each new canonical plan; the ordinary CLI `validate` succeeded for all five on 22 September 2026 at approximately 05:32 UTC.

Each plan has **2 executable checks, 8 assertions, 5 total graph targets, 3 catalog entries and 3 retained blockers**. CLI result is `ok: true`, `readyToRun: false`: the latter preserves the unresolved broad API-surface candidate, out-of-scope rendered docs, and member-identity gap, and does not remove the two independently runnable public checks. No oracle approval was manufactured; the two executable catalog entries already had resolved exact expectations. The broad generated candidate remains unresolved and unexecuted.

| Release | Assigned base URL | Plan digest |
| --- | --- | --- |
| q2 | http://127.0.0.1:50604/ | sha256:3322ef57616a7263675410f286f50c918fd9fcdb623d6342cbb3cb8ff7b4ee84 |
| n8 | http://127.0.0.1:50738/ | sha256:fdc729169e80dc3213cf922886af99804aeaa69a05164e1d9a035ce7269b303f |
| c4 | http://127.0.0.1:50921/ | sha256:f1854611f8edca012ec94ff3c9b35986763f4ee7a2821a4990159bc0c7ba44da |
| r6 | http://127.0.0.1:51098/ | sha256:e5d92c31d2e9b90908b23669b421f87b5aa99072c796288e9f31de24aa4667a6 |
| t9 | http://127.0.0.1:51324/ | sha256:645f48ff287b8ceed0be09509f49a37062d2fda7a66e8e7997fc8c0dcd6bf199 |

Each canonical plan is at `<actor>/<release>/nuanu-readonly-qa/tests/qa-campaign.v0.json`; the unparsed first proposal is separately retained at `<actor>/<release>/first-proposed-plan.json`. Complete binding identities and authoring closure are in `bound-plan-manifest.json`. Validation commands, cwd, timestamps, exit status, raw stdout and raw stderr are in `invocations/008-validate-q2` through `invocations/012-validate-t9`. Original source-read errors remain in `attempts.md`; the first `tsx` CLI IPC `EPERM` attempt has complete raw capture at `invocations/002-inspect-workspaces`. Using the installed loader with ordinary Node resolved only that invocation limitation; no dependency was installed and no source was changed.

Verification-loop scope: schema parsing, ordinary CLI validation, exact plan readback, unchanged first-design/request/assertion checks, full graph-target closure and raw capture verification are applicable. Source build, typecheck, lint, test suite and code-coverage thresholds are not claimed: this task edits no source and authorizes plan validation only. No new broader product acceptance is inferred.

Next action requires the coordinator's independent design-review Go. Before execution, re-read these same plan digests and exact origins, retain all blockers, and use only the scoped authorized local run. A sandbox network refusal would be environment evidence, not a product failure; no execution is authorized by this readiness report itself.
