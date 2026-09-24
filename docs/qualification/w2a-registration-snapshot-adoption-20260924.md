# W2a registration snapshot — bounded source adoption

24 September 2026 (Bali). This record qualifies the bounded W2a source pair in
the committed manifest after independent delivery review. Existing campaigns
retain their frozen runtimes and owners;
source selection does not migrate a registration or authorize product execution.
The [15 September candidate](registration-planning-snapshot-20260915.md) remains
inactive and is not substituted for the newer pair.

## Exact source and archives

| Component | Prior selected → W2a commit | W2a tree | New complete-history bundle | Size / SHA-256 |
| --- | --- | --- | --- | --- |
| Kernel | `aa5d2d188606cbcf7e3111c130347a36970ec786` → `a0a20e65b3290e6bbf5afe91d0e45ed372389adb` | `1673f3edc3199d814f2c634e41278e9db3d60d39` | [`kernel-w2a-snapshot-a0a20e6.bundle`](../../sources/candidates/kernel-w2a-snapshot-a0a20e6.bundle) | 969922 bytes / `8a26e2c4bfba9736017306615fd80b3cb3b4e587e646568cd64faa95523c7979` |
| Console | `a94571175ca893a5a66eafb5c3d06801238ad04d` → `f75d9630edd599d9fd9bfbfbf5faf195e25db685` | `6a8b61ccd0914bdc6b963a2843049fa50158eda7` | [`console-w2a-snapshot-f75d963.bundle`](../../sources/candidates/console-w2a-snapshot-f75d963.bundle) | 4395974 bytes / `e0cc267a15baff8034223ec74532f89d0e17052de5032ec68359d609947687fa` |

Each `git bundle verify` reported complete history and exactly one `HEAD` at
the listed commit. Independent `git clone --no-local` of each new bundle
recovered the exact HEAD/tree, clean working tree and `git fsck --full` exit 0.
No old bundle was overwritten. Both selected child checkouts are clean. The
archive proof is source portability, not dependency or product qualification.

## Bounded behavior and review

Kernel changes only `src/kernel/workspace-blueprint.ts` and
`tests/workspace/blueprint.test.ts`. Both generated `views/current-plan.md`
branches now identify a **registration planning snapshot** rather than claiming
that no CampaignPlan exists. They point to Console's existing
`readCampaignPlan`, whose return is `unknown`, and separately to
`QaCampaignPlanV0Schema.parse` for validation. Kernel neither reads nor
synchronizes the live plan. No plan schema, storage, API, migration, selector,
verdict or observation writer changed.

Console changes its exact Kernel pin, pin-sensitive tests/fixture and README,
and adds a source-owned vertical regression in
`tests/unit/nuanu-authored-revision.test.ts`. A controlled registration goes
absent → authored → CAS-revised. At authored and revised states, the existing
reader plus separate schema validation yields the expected canonical digest.
The pre-CAS V0 bytes are retained outside the workspace before revision and
read back unchanged afterwards; blocked target IDs and workspace validation
remain intact. The registration view remains a snapshot, not a live plan view.

Independent Astra pair review returned **CONDITIONAL** with no blocking
code/spec defect. Its test-coverage request was handled before final pinning:
the owning published-view assertion now checks the non-authoritative paragraph
and the reader/validator distinction. A controlled temporary false claim in
Kernel source made that test fail 0/1; restoring the production wording returned
the blueprint suite to 40/40. Independent Astra delivery review subsequently
returned **CONDITIONAL GO** (Critical 0, Important 0, Minor 2). The reviewer
repeated bundle/source/pair/root packaging checks and the retained-workspace
validation, but did **not** rerun the child suites. Neither review qualifies
the full Kernel suite.

## Local gates and failures retained

- Kernel initial behavior tests failed **2/2** for the two false generated
  views, then the focused blueprint suite passed **40/40**. The expanded
  blueprint/knowledge-revision/validation gate passed **149/149** in 280.76 s;
  `npm run typecheck` and `npm run build` exited 0.
- The first Kernel `npm run verify` attempt was **not green**. The full Vitest run reported a
  120-second timeout in `tests/registration/service.test.ts` for “resumes
  PUBLISHING over a safe prior-authority workspace so the replacement can
  republish.” It continued without a complete result and was interrupted at
  the 20-minute diagnostic limit (exit 130). An overlapping isolated attempt
  also timed out and is not a clean discriminator. A later non-overlapping
  single-case rerun passed on W2a in 118.58 s and on the prior Kernel in
  111.61 s; both are near the test's 120-second bound. No cause for the
  timeout is proven, and those single-case results did not turn that full gate
  green or justify increasing the timeout. A later exact full pass is recorded
  below; it does not erase this failed diagnostic attempt.
- Console vertical regression failed **0/1** against a clean isolated prior
  Kernel because the generated view still said `No CampaignPlan exists`; it
  passed **1/1** on the W2a pair. The final-pin authority/lifecycle/stalled-Git
  gate passed **22/22** when run without portability.
- An initial combined four-file Console gate reported **22 pass / 1 fail**:
  `managed-pack-portability.test.ts` failed immediately because the invocation
  omitted its required `TSX_DISABLE_CACHE=1` and isolated `TMPDIR`. With those
  prerequisites, the unchanged portability test passed **3/3** in 59.71 s.
  The strengthened vertical regression then passed **1/1** again. The
  API-semantic, observation pair/CLI and campaign-CLI/status capability gate
  passed **76/76** in 213.17 s; nonincremental TypeScript exited 0.
- Console's actual source-authority preflight accepted the new Kernel checkout
  and rejected the previous `aa5d2d1` checkout with
  `KERNEL_REVISION_MISMATCH`. This is an exact-pair check, not permission to
  override the embedded pin through an environment variable.

The root packaging gate for this bounded adoption is recorded below; it
cannot be inferred from the child gates.

Historical child-gate outputs are in the originating execution task transcript;
there is no portable raw-log archive for those runs. The counts and limits
above are attributed to that transcript, not independently reproduced by the
delivery reviewer.

### Targeted timeout diagnostic, 24 September

A later, isolated diagnostic reran only the exact `resumes PUBLISHING over a
safe prior-authority workspace so the replacement can republish` test with its
original 120-second limit. The selected W2a Kernel passed in **98.26 s**;
an otherwise identical temporary clone at the prior `aa5d2d1` commit passed
in **93.74 s**. Both used the same installed dependencies and Node runtime.
Neither invocation was the full `npm run verify` gate. The first CPU profile
captured only the Vitest coordinator and was not used for bottleneck attribution;
the paired comparison profiled the Vitest worker via `--execArgv`.

The worker profiles covered 99.06 s for W2a (48.32 s active / 50.73 s idle)
and 94.52 s for the prior commit (46.58 s active / 47.94 s idle). Inclusive
samples were similar: `registration-store` 26.28 / 25.89 s,
`registration-replay` 12.43 / 12.25 s, `workspace-blueprint` 8.10 / 7.79 s,
and `canonical-json` 13.36 / 13.46 s (W2a / prior). These stack categories
overlap and must not be summed. They support an existing expensive
replay/validation path; the changed planning-view text was not a measured
hotspot. One pair does **not** establish the cause of the historical timeout,
exclude a small W2a cost or contention, or qualify the full suite. No timeout,
source, configuration, store validation, or acceptance rule was changed.
Raw profiles were generated in temporary diagnostic directories and are not
part of this portable source archive.

### Exact full Kernel gate, 24 September

A later uninterrupted `npm run verify` on the clean selected Kernel HEAD
`a0a20e65b3290e6bbf5afe91d0e45ed372389adb` with Node `v22.23.1`
exited **0**. Typecheck completed, Vitest reported **45/45 files** and
**1788/1788 tests** passing (test duration 2285.31 s; Vitest total 2297.95 s),
and the subsequent `tsc -p tsconfig.build.json` build completed. Kernel and
root working trees were clean after the run. The coordinator transcript for
execution session `88954` is the evidence for this pass; the independent
documentation reviewer did not rerun the suite. Vitest started at 08:12:40
Bali. The installed Vitest `4.1.11` selected its agent-host
`MinimalReporter`, which intentionally suppresses successful-file progress;
the lack of intermediate stdout was not used as pass or hang evidence. This
run supplies one complete local Kernel gate on the selected W2a source. It
does not prove the earlier timeout cause was fixed or exclude intermittent
failure, independently rerun Console, prove hosted CI, alter frozen campaigns
or close product/W1 acceptance. The earlier 120-second timeout and 20-minute
interruption remain retained above as historical attempts.

## Retained workspace and authority boundary

An isolated workspace published with prior Kernel `aa5d2d1` was validated
read-only under W2a Kernel. It correctly returned `valid: false` with
`MANAGED_SOURCE_STALE` for `.qa-managed.json` and `views/current-plan.md`,
`PRIVATE_STATE_DRIFT`, and `REGENERATION_JOURNAL_INVALID`. The before/after
whole-file inventory digest was identical:
`ce4fb52e07acb3e8e3da3d08da5bf8d4d8478c7c6c2737c9064367a9b4bd1365`.
No retained workspace was repaired, overwritten, registered anew or migrated.
Existing campaigns remain bound to their original selected owner/runtime;
incompatibility is not a reason to republish them automatically.

W2a removes one misleading generated claim. It is not a live-plan
synchronizer, product acceptance, managed PASS/GO,
hosted CI, installed-skill promotion, browser/payment/tracker work, cloud
qualification or live W1/T7 closure. T7 still requires an owner-reviewed
remaining oracle/binding, authorized execution and persisted readback through
its existing owner; the 12 remaining `not_observed` targets and 15 blockers
remain as recorded in [current qualification](current.md).

## Root packaging gate

From the root with the W2a manifest and new bundles, the implementer ran
`npm run sources:verify` (exit 0, `sources_verified`) and `npm test` (**61/61**,
0 failed/skipped, 39.77 s). A later implementer repeat after documentation
updates passed `sources:verify` and **61/61** again (32.01 s). The
independent delivery reviewer repeated the bundle/source/pair checks and root
**61/61** (32.45 s); coordinator source verification also passed for the exact
Kernel `a0a20e6`, Console `f75d963`, unchanged Freeland `0ea2df1`, and
inactive reporting reference `10d398d`. The root suite includes the exact
Console–Kernel manifest pair control and cold source restore/verify controls.
After the full Kernel gate, a fresh root
`npm run sources:verify` exited 0 for the same selected pair and `npm test`
passed **61/61** (33.64 s).
Neither command runs product checks. These root results alone prove bounded
local source packaging, not the separate full Kernel-suite pass above or
product acceptance.
