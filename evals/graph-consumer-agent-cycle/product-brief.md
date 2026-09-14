# Stage Four public catalog

This is an owned synthetic loopback API exercise, not a live product or release.
The complete authorized scope is anonymous, deterministic GET access to the exact
origin in `actor-context.json`. No credentials, external network, purchases,
mutations, database actions, tracker writes, or additional origins are authorized.

Evaluate the registered journey named **Read the public catalog**. Reuse the
existing managed graph and test catalog in the supplied workspace. Author the V0
operations and assertions needed for whichever existing catalog checks you select;
do not create new check identities, change catalog oracles, hand-edit managed model
files, or use a second runner. Retain every unresolved or omitted coverage target
as an explicit blocker in the campaign plan. The supplied registration contains
no campaign plan.

## Product contract

- `GET /api/catalog` returns the public catalog. For a ready catalog it returns
  status 200, `catalogName` equal to `Stage Four`, and `ready` equal to `true`.
- Every published catalog entry must have a nonblank `displayLabel`.
- `GET /api/catalog-integrity` returns status 200 and projects that invariant as
  `invariantSatisfied` equal to `true` and `unlabeledItemCount` equal to `0`.
- Query strings do not change either response. A response is an observation of
  current fixture state, not permission to change it.

Use the selected Console/Kernel and the current `qa-product-v0` instructions.
Validate the exact plan before a run, inspect the real receipt and evidence, and
keep product, oracle, harness, and environment conclusions separate. A failing
check is not automatically a confirmed product bug. Your only exercise-specific
inputs are your own copied `product-brief.md`, `actor-context.json`, and managed
workspace; do not inspect sibling actor roots or controller preparation evidence.
