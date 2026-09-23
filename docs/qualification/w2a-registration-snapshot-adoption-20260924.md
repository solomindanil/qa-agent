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
- Kernel `npm run verify` is **not green**. The full Vitest run reported a
  120-second timeout in `tests/registration/service.test.ts` for “resumes
  PUBLISHING over a safe prior-authority workspace so the replacement can
  republish.” It continued without a complete result and was interrupted at
  the 20-minute diagnostic limit (exit 130). An overlapping isolated attempt
  also timed out and is not a clean discriminator. A later non-overlapping
  single-case rerun passed on W2a in 118.58 s and on the prior Kernel in
  111.61 s; both are near the test's 120-second bound. No cause for the
  timeout is proven, and these single-case results do not turn the full gate
  green or justify increasing the timeout.
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
synchronizer, product acceptance, managed PASS/GO, full Kernel-suite pass,
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
Neither command runs product checks. These results prove bounded local source
packaging, not a complete Kernel full-suite pass or product acceptance.
