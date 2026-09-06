# Authored fixture qualification — 2026-09-07

The reviewed Console commit is `b38a8b48cf7dd1646998b3d98427efd99a59d14f`, tree `d17154893d31261996176afd758d7df84de1e8af`, directly after43262b2. It changes only three fixture/test files, not Kernel, the product, dependencies, runtime permissions or graph contracts.

- Reuse the central accepted-Kernel guard before fixture import and registration effects.
- Add a real dirty-source regression: removing the guard produces RED; restoring it produces GREEN. The replay includes exact per-run source hashes and mutation diff.
- Give the composite Nuanu parent300s and retain its registered fixture without chmod/delete; child120s and public-auth180s limits and every existing assertion remain unchanged.

## Executed gate

From an isolated Console432 clone containing exactly the reviewed three-file patch, using unchanged Kernel393/Node22.23.1 and existing dependencies:

```sh
node --import tsx --test --test-concurrency=1 --test-reporter=tap tests/unit/authored-fixture-authority.test.ts tests/unit/kernel-fixture-authority.test.ts tests/unit/nuanu-authored-revision.test.ts tests/unit/public-auth-authored-revision.test.ts
```

**22/22 TAP records, exit0, no failures/cancellations/skips/todos.** This includes1 guard +11 authority +6 Nuanu +4 public-auth records; parents are counted. The command ran once; existing negative checks retain their intentional multiple attempts. Wall296.864s; Nuanu164.364s; public-auth98.047s. No owned processes remained, and stderr/observer-error/cleanup-action records were empty.

The Nuanu run was also under the former180s limit on this attempt. Do not attribute success solely to the budget adjustment, claim a performance fix or infer repeatability from one pass. Prior failed runs remain unchanged.

Six saved campaign receipts and all35 referenced artifacts matched their sizes/hashes. Correct checks keep NEEDS_HUMAN where2 Nuanu or3 public-auth targets remain blocked. Controlled wrong responses yield PRODUCT_FAIL; unavailable environment yields ENV_BLOCKED; stale plans do not execute; new graph/plan bindings require a fresh run while prior results remain intact. These are synthetic outcomes, not live-product defects or acceptance.

## Source and evidence

| Reviewed file | SHA-256 |
| --- | --- |
| tests/fixtures/nuanu-readonly/fixture.ts | 0b3b3d896cbdb5fa282b6c0609809a35d4c3e5df1d3043c2ec5b8ee908758b6e |
| tests/unit/authored-fixture-authority.test.ts | 6131d60356802331f8ecdc2a7bc41d378ea324138b491bc601221980b65cc7b2 |
| tests/unit/nuanu-authored-revision.test.ts | e494cab5d138d2a29d37525eb230f153a2819d2c080cf12b949bf945c81bc057 |

The committed three-file diff hashes to `632116b9ebd4d161bf685f0d6cf640127de4a80e7f84f0b3aba9019b0173ecc8`, identical to the tested patch. Eight relevant source files matched before/after execution and the source candidate; independent Lead AQA approved static semantics and final raw results.

Private exact-byte archive: `.local/qualification/authored-qualified-300s-20260907.n9195o`,530 verified members/6512869bytes, mismatch0. REPORT SHA-256 `95d3218b5194991acdeaa7d381f89fadf2f062c0d98aaee9c99144e2bc99c3e6`; manifest `1871be26916c22e5b1f455512cbbd4cca1cb41c99dfb294a5fe5ef223e5c976a`. This archive preserves evidence, not portable runnable registrations. Setup errors inside registration still have their original cleanup behavior.

## Replacement bundle

The new complete Console bundle is4094850bytes, SHA-256 `0825694054424ad7300b105e7e3959b12eb26834659644980acb6675c47357c7`. Empty-repository bundle verification and independent restore/fsck passed. All1510 reachable objects match the complete restored object store; all152 tracked working files match their Git blobs. The432 history is retained. Lockfile remains `cae849c1b392666de92efe7f2b2f1536b07a0a35d6d21bd803c822a3e359a88b`.

The active manifest selects this commit; other three components and runtimeAuthority flags are unchanged. Initial assembly source-bundles.v1.json and scan reports remain historical records, not measurements of this replacement.

Workspace packaging checks are recorded separately below; this gate does not establish full Console coverage, live-product QA, tracker delivery, payments, host portability or cloud operation. Git batching is deferred. The next roadmap action is the owner-coordinated real second-product G1 flow.

## Workspace readback

After updating only Console in the active manifest, `npm run sources:verify` passed and root `npm test` passed47/47 with0fail/skip/cancel. The exact staged delivery tree `3228d6b8cce9c0347b318116f422d7ef6aeccb3d` was exported into a fresh directory with an empty root Git database and no dependencies. Its own `node tools/workspace.mjs restore` and `verify` both exited0 and returned all four correct pins, including Consoleb38a8b4. This proves source restoration, not a product run from the cold copy.

Raw packaging record: `.local/qualification/console-authored-bundle.WZOfER/packaging-proof.json`, SHA-256 `00c066a6717925f15aa90da5b2e37eb1cd3fb061a759c876587fe7bdd90892b5`. This final evidence paragraph follows the exported tree; source, bundles and tools are identical. The previous Console bundle is preserved both in Git history and the private qualification directory. No remote publication is claimed here.
