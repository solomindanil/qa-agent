# Fresh graph-consumer comparison

Owned synthetic API exercise for the approved global plan Stage4. This is not a
product suite, automatic selector or cloud agent. It reuses manifest-selected
Console66ac7db / Kernel185d3e7 without changing component source or installed skills.

The two independently registered workspaces share a byte-equal common publication
and the same server. Both contain a catalog-reading journey, a label invariant,
and resolved tests for each. Only one receives a reviewed journey→invariant
dependency. Fresh agents must choose and execute existing checks themselves;
preparation never writes a campaign plan.

## Local preparation checks

From a normal qa-agent clone restore/verify the bundled components. Provision each
child's own lockfile/dependencies separately as described in the current source
entry; these commands do not install dependencies or a browser:

```sh
node --test evals/graph-consumer-agent-cycle/fixture.test.mjs
QA_STARTER_REPO="$PWD/components/kernel" node --import ./components/console/node_modules/tsx/dist/loader.mjs --test evals/graph-consumer-agent-cycle/prepare.test.mts
```

The second command uses actual Kernel registration, publication and readback, then
closes its owned server. It leaves temporary evidence intact. Its assertions do
not exercise a fresh agent or prove that graph knowledge changes test selection.

`startGraphConsumerExercise` in `prepare.mts` starts a retained owned exercise.
For a qualification run supply `beforeRelationApply`: inspect the proposed
candidate, exact preview, source-backed relation and semantic delta before
returning an explicit controller decision. The default synthetic-preparation
decision is not independent review. Keep the server alive through both fresh
consumer runs and call `close()` afterward. Lifecycle is caller-owned, not a
self-enforced wall-clock limit or durable recovery guarantee.

## What to measure

Give two fresh contexts the same named-journey request and their own packet/brief,
complete source skill and managed graph/catalog. Do not give them the condition,
fixture source, expected selection, other actor output or a prepared plan.
Record the first decision and original plan before execution. Read original
receipts/artifacts through the existing reader; preserve failures and corrections.

The catalog is an identity/oracle contract, not a complete executable plan. Agents
author supported V0 operations/assertions for the selected existing check IDs.
An omitted existing test remains **campaign-unassessed**, not nonexistent
automation. The independent unresolved surface candidate remains visible too.

If both agents choose the invariant test, retain that useful behavior. It does
not establish incremental graph-caused selection. Do not coach or rerun until an
expected comparison appears. Source/history freshness is instruction-scoped,
not a security-enforced blind benchmark.

The original [preparation logs](evidence/) retain missing-export RED assertions
and subsequent actual GREEN checks. They are not evidence of a repaired runtime
defect or an autonomous product run. The dated qualification is recorded
[separately](../../docs/qualification/graph-consumer-20260914.md).
