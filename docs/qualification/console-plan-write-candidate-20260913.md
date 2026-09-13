# M3 — conditional plan write candidate

13 September 2026. **4fddb67: SOURCE REVIEWED / NOT ACTIVE.**
The owner approved this bounded repair and continuing the global plan. Independent
Lead AQA resumed after an earlier host limit and reproduced a false UNKNOWN on
legitimate lock handover in b474d52. The narrow correction passed independent
review, expanded verification and portable successor delivery.
Active source pins are unchanged.

## Independent finding and bounded correction

After writer A really unlinks its admission lock, writer B may legitimately
reacquire that pathname. A's generic rollback helper then sees B's new file and
returns UNKNOWN despite A's exact completed publication. Two real processes
reproduced this; the supplied27 controls did not cover release/reacquire.

The correction allows a replacement after successful unlink **only for admission
release**, preserving pre-unlink ownership, directory fsync/revalidation, generic
stage rollback and genuine uncertain outcomes. A source-owned two-process test
failed before correction, then passed with all28 focused controls. Independent
Lead AQA executed4 boundary controls and approved the three exact working files;
no source adoption or Linux/product qualification follows from that review.
The historical b474d52 source and gates below retain their original attribution.

## Reviewed handover successor

- Parent: `b474d52fb6b8b2d13fe362a3f551f8ef6b6ee17a`.
- Source: `4fddb679f84619a7e8e7ac871efa84a1493cb5ed`.
- Tree: `e4e319dc45a71cc1856817efe890cae719353826`.
- [Complete-history archive](../../sources/candidates/console-plan-write-handover-4fddb67.bundle), sole HEAD, 4229098 bytes.
- Archive SHA256: `f542175a2d0206cd634fe1c3e9eefbc23768a14cd101b30d7f3c8406705d24d2`.

Exactly three source files changed (+44/-1):

| Relative path | SHA256 |
| --- | --- |
| `src/node/qa-campaign-files.ts` | `d9dfba5c09fd2d6dfc5e921171135e19a0f623b7f4a650a930360b3d98c30c6a` |
| `tests/unit/campaign-plan-concurrency.test.ts` | `237b615ca299d4590d9bd79e60e4e87822b519a9230aaffdaec9f0a645bb6dc3` |
| `tests/unit/fixtures/campaign-plan-writer.mjs` | `f0c147ba6f964eb9d4c3d1aea92637c5b3bb12b36dbe60e469ca4b5daa288561` |

The new real-process regression was RED on b474d52 and GREEN after the correction.
Focused gate28/28 and the **fresh expanded gate216/216** passed, all failure/skip/
cancellation counts zero. Expanded gate used the ten files in the replay section,
clean explicit Kernel15a067c, own dependencies and private real TMPDIR; it exited0
in405487.70575ms. Source typecheck and changed TypeScript lint passed. The fixture
has pre-existing undeclared Node `process` globals under direct ESLint; it passed
with that Node global explicitly configured. No blanket whole-repo lint claim.
Independent Lead AQA approved the exact three files and executed four relevant
release/foreign-owner/uncertain/pre-publication controls.

An independent normal clone recovered the exact commit/tree, three hashes and
complete history, passed strict Git fsck, and remained clean with no alternates
or node_modules. That cold check is source verification, not a runtime rerun.
The [source integration with E1 public input](public-input-candidate-20260913.md)
is separately reviewed candidatece80729; this M3 bundle does not itself contain
E1. No active pin, product, tracker or campaign changed.

Retained log SHA256: focused RED
`7b82f15223fd2b5f4115152abd565249137e9dab82bc1ef8db04a9b163a4bdc2`;
focused GREEN `301115ab59044d443c137cffae1dc162c734b8e42e643fac90a3b7340c11d780`;
28 controls `0c1039271003fb22592a0f889869d0bcec21980f8104d51aaf456ece30fb5d5c`;
216 compatibility `ec57b35c463c94308ed99fe877871dc644c43876044eadcd88545098ad22b939`.
Regression sources travel with the archive; raw logs remain historical evidence.

## Historical b474d52 source and changes

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

Review of the successor accepted the narrow release correction. Its three-file
diff, tests and history are delivered above. E1 integration is separately
qualified in ce80729; active adoption remains open. The original b474d52 alone
is not accepted.

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
