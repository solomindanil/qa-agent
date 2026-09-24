# W7 Worker guard audit — static source finding

Date: 24 September 2026. Read-only architecture audit of the manifest-selected
Kernel `a0a20e65b3290e6bbf5afe91d0e45ed372389adb` and Console
`f75d9630edd599d9fd9bfbfbf5faf195e25db685`. Root `npm run sources:verify`
returned `sources_verified` for the selected components during the audit.
This is **static source evidence only**: no browser reproduction, dynamic
bypass, new test result, product acceptance or completed W7 is claimed.

## Finding and existing protection

In Console `src/node/playwright-campaign-adapter.ts:186`, installation of the
immutable Worker/SharedWorker constructor denial is conditional on
`dependencies !== undefined`. Browser checks without dependency metadata do
not receive that constructor guard. This establishes a guard-coverage gap;
it does not establish successful network escape or a false PASS at runtime.

Existing final reconciliation at `src/node/playwright-campaign-adapter.ts:447`
already turns a recorded worker attempt into
`environment_failure / unsupported_worker_capability` regardless of dependency
metadata. Service workers are blocked in browser-context creation. Ordinary
origin/method interception remains present; the audit does not claim it is
absent or dynamically bypassed.

Existing Console controls are retained:

- `tests/unit/campaign-dependency-adapter.test.ts:227` includes Worker,
  SharedWorker, module/blob and frame variants with registered dependencies.
- `tests/unit/campaign-dependency-adapter.test.ts:259` checks service-worker
  denial with dependency metadata.
- `tests/unit/campaign-dependency-adapter.test.ts:140` protects healthy
  same-origin script execution and historical trace shape without dependencies,
  but is not a Worker/SharedWorker control.
- `tests/unit/campaign-dependency-init-contract.test.ts` statically protects
  reporting-binding immutability and initialization ordering.

These are inspected existing tests, not fresh passing results. A possible
bounded design would reuse the existing constructor guard for the absent-
dependencies lane and add local fixture controls for exact failure code,
zero worker-script/foreign-effect hits and persisted non-PASS, while retaining
healthy ordinary scripts and existing dependency behavior. Such a change
requires its own approved RED/GREEN design and review; this note does not
authorize it or claim an adversarial browser sandbox.

## Separate response-resource scope

Campaign browser routing uses `route.fetch` and campaign API execution uses
`response.text()` in `src/node/playwright-campaign-adapter.ts`; the inspected
paths do not establish a streaming response-byte ceiling. Oversized/chunked
campaign-response containment remains separate transport-design work, not
closed by a Worker change or a post-buffer size check.

The first-evidence lane is different: `server/readonly-http-broker.mjs` already
has response-size handling, with a streaming-limit destruction control in
`tests/unit/readonly-http-broker.test.ts:901`. Do not reattribute that protection
to the campaign adapter or redevelop it as a new finding.

## Decision and limits

Defer this security-only implementation under the owner's stated quality-first
priority, pending an approved bounded design. Preserve the W7 obligation in the
[global plan](../superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md);
do not expand the affected lane on the strength of this audit. Oversized/chunked
responses, dynamic Worker qualification, source delivery and broader W7 exits
remain open. This decision does not weaken existing guards or accept the gap.

No source code, manifest, installed skill, campaign, product
or runtime selection changed. No tests, product calls or installs were
performed for this audit. The note records the read-only audit and its deferred
disposition only.
