# Registration planning snapshot — reviewed inactive candidate checkpoint

15 September 2026. This checkpoint delivers a bounded Console–Kernel source pair;
it does **not** change `sources/manifest.v1.json`, the active source selection, an
existing registration or campaign runtime. Kernel now labels
`views/current-plan.md` as a registration planning snapshot and points readers to
Console's existing `readCampaignPlan` plus `QaCampaignPlanV0Schema` authority.
Kernel still does not read, validate or synchronize the Console campaign plan.

## Exact sources and portable archives

| Component | Base → candidate | Candidate tree | Complete-history bundle |
| --- | --- | --- | --- |
| Kernel | `185d3e72309a4362db57cf2e805d1c00a5035909` → `a9378b2d2da3874c101429880344bb2ccc296764` | `4bd267c4a88c43577e7f739156485491effc6366` | [`kernel-planning-snapshot-a9378b2.bundle`](../../sources/candidates/kernel-planning-snapshot-a9378b2.bundle), sole `HEAD`, 950772 bytes, SHA256 `2169782e86bba4148975c0d899c042ad104cba7a16953522fd22d3f5df60edcb` |
| Console | `66ac7db55a25f56b199b2cb00ad83df3b8dad868` → `d272f31fa35f471a590681f0e20224382e3d02b5` | `aae6a92fc52fce12f5a704bd1b642af6d046bc3e` | [`console-planning-snapshot-d272f31.bundle`](../../sources/candidates/console-planning-snapshot-d272f31.bundle), sole `HEAD`, 4353551 bytes, SHA256 `38f64e6ce311b2da9bfbac9da8b557debc6bacce7ed48b1330c996caf11584b1` |

Kernel changes only `src/kernel/workspace-blueprint.ts` and its blueprint test;
the binary diff SHA256 is
`01883aedb0ab375fbef9f162537a157f26102787518961de243004e88e926cc6`.
Console changes six existing pin, documentation and regression-fixture files;
the binary diff SHA256 is
`c71efd5f2542d932b95a5b16fbf0e7b7df02ea72718d6e0908852f0edc7b02c1`.
No new runtime owner, plan schema, runner, selector or generated path is added.

## Reviewed behavior and gates

Kernel's source-owned regression was meaningfully RED twice: first on the old
false `No CampaignPlan exists` claim, then on imprecise reader/validator wording.
The final assertion names `QaCampaignPlanV0Schema` separately from
`readCampaignPlan`. Focused blueprint controls passed **38/38**; nonincremental
typecheck and build both exited 0. The final expanded blueprint,
knowledge-revision and validation gate passed **147/147** in 241.05s. An
independent Lead AQA review approved the final two-file diff with no findings.

Console retains the existing plan reader/writers and adds an actual vertical
fixture covering absent → authored → CAS-revised plan states. At each authored
state Console reads and schema-validates the current plan digest while Kernel's
registration view stays a snapshot and the workspace stays valid. The exact pin
refresh also rejects the prior Kernel `185d3e7` revision. The final
authority/lifecycle/stalled-git gate passed **21/21** in 192013.607958ms;
managed-pack portability passed **3/3** in 73843.93625ms; source TypeScript
`--noEmit --incremental false` exited 0. Independent spec and quality review
approved the six-file Console diff with no findings.

The final source identities were already clean at their component commits. Raw
test output remains in the originating task transcript; this checkpoint does not
invent a portable logfile or digest for that output.

## Cold delivery

Both bundle verifications report complete history and one `HEAD`. Independent
normal clones, with no local dependency installation, recovered the exact commits
and trees above; each clone had clean porcelain status, no alternates, and
`git fsck --full` exited 0. Importing the cold Console authority accepted the cold
Kernel candidate, read back embedded pin `a9378b2`, and rejected `185d3e7` with
`KERNEL_REVISION_MISMATCH`.

A fresh independent Lead AQA whole-delivery review reproduced those identities,
digests, bundle/cloning checks and authority outcomes; it also confirmed the
five-path root scope and byte-identical active manifest. Verdict: **APPROVE**, with
no Critical, Important or Minor findings. The reviewer did not rerun the long
runtime fixtures and did not write to the delivery.

The first cold probe used the non-canonical macOS `/tmp` spelling and was correctly
rejected because it resolves to `/private/tmp`. A second wrapper incorrectly
expected the void authority assertion to return a SHA. The corrected probe used
canonical paths and treated no exception as acceptance; these were probe errors,
not source or product failures.

## Portable replay

From this root, source-only delivery can be replayed without dependencies:

```sh
review_root="$(mktemp -d /private/tmp/registration-planning-review.XXXXXX)"
kernel_review="$review_root/kernel"
console_review="$review_root/console"
git bundle verify sources/candidates/kernel-planning-snapshot-a9378b2.bundle
git bundle verify sources/candidates/console-planning-snapshot-d272f31.bundle
git clone --no-local sources/candidates/kernel-planning-snapshot-a9378b2.bundle "$kernel_review"
git clone --no-local sources/candidates/console-planning-snapshot-d272f31.bundle "$console_review"
git -C "$kernel_review" rev-parse HEAD 'HEAD^{tree}'
git -C "$console_review" rev-parse HEAD 'HEAD^{tree}'
git -C "$kernel_review" fsck --full
git -C "$console_review" fsck --full
```

After separately provisioning each clone from its own lockfile, the owning gates
are:

```sh
cd "$kernel_review"
npm test -- tests/workspace/blueprint.test.ts
npm test -- tests/workspace/blueprint.test.ts tests/workspace/knowledge-revision.test.ts tests/workspace/validation.test.ts
npm run typecheck
npm run build

cd "$console_review"
QA_STARTER_REPO="$kernel_review" QA_STARTER_EXPECTED_SHA=a9378b2d2da3874c101429880344bb2ccc296764 \
  node --import tsx --test --test-concurrency=1 \
  tests/unit/kernel-fixture-authority.test.ts \
  tests/unit/nuanu-authored-revision.test.ts \
  tests/unit/campaign-continuation-git-timeout.test.ts
QA_STARTER_REPO="$kernel_review" QA_STARTER_EXPECTED_SHA=a9378b2d2da3874c101429880344bb2ccc296764 \
  node --import tsx --test --test-concurrency=1 tests/unit/managed-pack-portability.test.ts
./node_modules/.bin/tsc --noEmit --incremental false
```

Use an isolated real private temp/state root and a clean environment for runtime
replay. Console's default `npm test` starts Playwright product projects and is not
this offline gate.

## Acceptance boundary and next work

The pair is **INACTIVE**. It changes generated managed-view bytes, so a retained
workspace created with Kernel `185d3e7` is not migration-compatible: the actual
old-registration probe reported `MANAGED_SOURCE_STALE` for registry/view,
`PRIVATE_STATE_DRIFT`, and `REGENERATION_JOURNAL_INVALID`. No old workspace was
repaired, rewritten or promoted. Existing campaigns remain on their frozen pair;
environment configuration cannot override Console's embedded pin.

This checkpoint is not a product run, browser/payment replay, tracker write,
installed-skill change, active source/campaign switch, deployment, push, full QA
acceptance or cloud qualification. Root packaging still selects the old manifest
pair and is therefore not reattributed to these candidate children.

Only after the user resumes this global-plan line: preserve an exact reviewed V0
plan snapshot before its next revision, then assess the separate narrow typed
graph/catalog helper. Neither is required for this checkpoint, and neither should
create a second plan reader or selector.
