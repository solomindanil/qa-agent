# M3 — conditional plan write candidate

13 September 2026. **IMPLEMENTED / LOCALLY VERIFIED / REVIEW PENDING / NOT ACTIVE.**
The owner approved this bounded repair and continuing the global plan. Independent
Lead AQA review could not start because the reviewer host returned its usage
limit; that is not an approval. This report and archive allow another reviewer to
continue without the original checkout or chat. Active source pins are unchanged.

## Exact source and changes

- Base: Console `dc8eb59dfeb2b5231617379096e945f0ccfc09da` (inactive M2 repair).
- Candidate: `b474d52fb6b8b2d13fe362a3f551f8ef6b6ee17a`.
- Tree: `53aa0c134f1bbe599c5de98f56638bb5f6355cd7`.
- Complete-history archive: [console-plan-write-b474d52.bundle](../../sources/candidates/console-plan-write-b474d52.bundle).
- Archive SHA256: `1cebf0c95a785bc3787bda315c02abb930857836742c0cfabe6e3184cd0bd070`.

Only three source files changed from the base:

| Path in Console | SHA256 |
| --- | --- |
| `src/node/qa-campaign-files.ts` | `f5d91ec5cd584a14ed66bb6f5082045c0c239776a2c943541c306fb5f67beeb4` |
| `tests/unit/campaign-plan-concurrency.test.ts` | `2b04a0b785fc5c3348f6aa56fe791d04667b34f3612aea39db10f103cbf0b70a` |
| `tests/unit/fixtures/campaign-plan-writer.mjs` | `040109b383d452fc03f9b3d167afa7848d0450d735f2c3ef6bedc01b4a0cec9f` |

The existing `writeCampaignPlan` boundary now acquires a per-plan adjacent
`.write.lock` exclusively, no-follow, at mode0600 **before reading the expected
version**. It holds ownership through temporary write, atomic publication, exact
descriptor/path readback and finalization. Existing bound-directory, inode,
fsync, canonical-path and exact-byte helpers are reused. Published plans remain
0644, including under restrictive umask. No Kernel API, runner, service, library
dependency or product-specific permission was added.

Outcomes are explicit: `CAMPAIGN_PLAN_WRITE_BUSY` and `CAMPAIGN_PLAN_STALE` are
not-written conflicts; ordinary definite pre-publication failure is
`CAMPAIGN_PLAN_WRITE_FAILED`; uncertain publication/finalization is
`CAMPAIGN_PLAN_WRITE_UNCERTAIN`, outcome `unknown`. Existing stale-preview wording
is preserved. Admission files are not stolen based on PID or age. The record
holds operation identity and predecessor/successor digests, not plan content.

This coordinates cooperating callers of this API, not hostile filesystem writers
bypassing it. It is not a global campaign lock or an exactly-once protocol for
external actions. Generic Kernel write races remain separate M4 work.

## Actual verification

1. New regression against the base: **0/7**, with the independent-process test
   failing because both writers really committed from one expected digest (not
   due to an import error or deadline). See the [original counterexample](console-plan-write-reproduction-20260913.md).
2. Initial fix passed7/7. Four additional finalization controls exposed two owned
   descriptor-close omissions: **9/11**. Those were corrected without suppressing
   the failure or deleting a foreign lock; final new controls **11/11**.
3. New controls plus existing mode/symlink tests: **27/27**, zero failures/skips/cancellations.
4. Expanded compatibility gate: **215/215**, zero failures/skips/cancellations,
   including real loopback browser/CLI, catalog revision and M2 finalization
   controls. This is a selected tool gate, not all Console tests or product QA.
5. Source TypeScript, targeted ESLint and Vite build each exited0. Vite retained
   the existing large-chunk warning. `git diff --check` passed; no tracked build
   cache was rewritten.
6. A second normal clone from the delivered archive recovered the exact SHA/tree
   and all three hashes, passed `git fsck --full`, had no alternates or
   node_modules, and was clean. No runtime test was claimed for that cold clone.

Tests cover two real processes, a loser denied before plan read, fresh sequential
approval, stale digest, foreign file/symlink/directory locks, pre-publication
failure, acknowledgement lost after an actual rename, real SIGKILL before rename,
held admission during post-rename readback, corrupted published bytes, foreign
lock replacement, descriptor closure and restrictive file modes. Synthetic
fixtures are local and retained; no product, account, payment or tracker was used.

## Replay for an independent reviewer

Restore the candidate archive into a fresh ordinary clone, provision its own
dependencies from `package-lock.json` using `npm ci --ignore-scripts --no-audit
--no-fund`, and run from that clone on the qualified Node22.23.1 macOS host:

```sh
node --import tsx --test tests/unit/campaign-plan-concurrency.test.ts tests/unit/qa-campaign-files-umask.test.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node node_modules/eslint/bin/eslint.js src/node/qa-campaign-files.ts
```

For the expanded gate, independently restore the manifest-selected Kernel
`15a067c9a694de26460102ce5dadb9707c7977b1` and its dependencies. Set
`QA_STARTER_REPO` to that absolute clean checkout and `QA_STARTER_EXPECTED_SHA` to
that SHA, use an existing private `TMPDIR`, `TSX_DISABLE_CACHE=1`, and an environment
without inherited product/auth/Node loader variables. Existing Chromium is also
needed. Add these files to the first command, with `--test-concurrency=2`:

```text
tests/unit/qa-campaign-cli.test.ts
tests/unit/campaign-dependency-cli.test.ts
tests/unit/nuanu-authored-revision.test.ts
tests/unit/public-auth-authored-revision.test.ts
tests/unit/playwright-campaign-adapter.test.ts
tests/unit/campaign-dependency-adapter.test.ts
tests/unit/qa-campaign-runner.test.ts
tests/unit/campaign-browser-finalization.test.ts
```

Do not run Console's default `npm test`: it is not this bounded offline gate.
Linux has a descriptor-anchored implementation but was **not runtime-qualified**
in this run. Unsupported platforms are rejected, not silently downgraded.

## Continuation and review gate

Review exactly the base→candidate three-file diff, concentrating on cross-process
admission, path aliases, cleanup ownership, uncertain finalization and whether the
test barriers prove the claimed boundary. Acceptance and active adoption remain
pending until that review; green local tests alone do not close M3.

For an unresolved write, first preserve the lock, predecessor/successor digests,
actual plan bytes and any retained stage. Stop only writers for that target and
establish whether its owner is still active. Compare the actual canonical plan
digest with both recorded values; never retry a mutation to discover its state.
A matching successor helps reconcile the local content but is not a product
receipt. Foreign, incomplete or mismatching records remain unresolved. This slice
does not add an automatic lock-recovery/deletion command; owner-controlled repair
is separate and must not delete a possibly live writer's admission.

Retained log SHA256 values: original RED `b19a0c49af84a574abdcfcce105b8f19d5fcc34d21bf92fe87ebed7a8c2b881b`;
finalization RED `2b664c78318bbbe4c40c1809ce3d3b93745c9f64ef59d7d9c0e2967711d82aa5`;
27-test GREEN `e1cb380c590de1b0d5992a866ec07a37bde83d57fc3c4028c1b41301451b18ed`;
215-test compatibility `2c9e01bb73835457bb5f7d39644e1d917153054bbcb996c4d1f5decdc30d9a74`.
Raw logs are historical local evidence, not required to reconstruct the tests.
