# Task 7 whole-delivery review

Independent read-only review of the prepared root commit
`af4e19392bc64d79eff6fe68a4df590731200a3e`, complete-history Console diff
`881a93e43fd9b90f3dcf9812812f6cf8ad854789..b54b849ac0438408a2c92f899e5221c7496611d7`,
Kernel diff
`657894dbd61561a634f36669a0874dccccbea59e..185d3e72309a4362db57cf2e805d1c00a5035909`,
and the final documentation delta in `task-7-final-doc.diff`. Cold records from
the independent normal clone at
`/private/tmp/qa-continuation-cold.369HjV/root` were then reviewed directly.
This reviewer did not rerun tests, launch a recovery process, modify component
sources or touch the canonical checkout, installed skills, products or campaigns.

## Final verdict

- **Whole source/spec integration:** APPROVED; no Critical, Important or Minor
  findings in the reviewed root, Console or Kernel source package.
- **Task 7 whole delivery:** APPROVED as a portable source candidate. The exact
  normal-clone cold gate, representative recovery consumer and final documentation
  evidence satisfy the delivery requirements reviewed below.
- **Task 6 attribution:** retained as previously accepted at root commit
  `31cb76a2d6237545a22be6da75eda65e8678541b`; this review neither reran nor
  relabeled its evidence classes.
- **Adoption scope:** the prepared isolated root selects source only. It grants no
  existing-campaign migration, installed-skill switch, canonical-checkout change
  or real-product execution.

## Cross-source integration reviewed

The root manifest selects Console b54b849 and Kernel185d3e7 with the same commits,
trees, bundle paths and SHA-256 values recorded in
`docs/qualification/campaign-continuation-20260914.md:9-18` and
`task-7-preflight.md`. Console's executable pin matches exactly in
`components/console/server/kernel-authority.mjs:7`, and the Console README uses
the same required Kernel revision at `components/console/README.md:92-112`.
Freeland21c1c61 and the inactive reporting reference remain unchanged.

The complete-history bundle records are:

- Console tree `0f8efc0eb5b0208bbf91ec255cbc196a17ff146e`, bundle
  `sources/candidates/console-continuation-b54b849.bundle`, SHA-256
  `0f04587fad111d22a4b8bbf1133583397585071fc8d20a33d2d3af50cb4fc203`;
- Kernel tree `c6cb0331c2cca666d3cc4fef4524e3d2b62b3a52`, bundle
  `sources/candidates/kernel-continuation-185d3e7.bundle`, SHA-256
  `2541917e6e85b22d35a556448a4a4480550eaf2f0b05101fb55abb5bbbbdc442`.

Console adds one opt-in continuation route around the existing runner rather than
a second executor. `qa-campaign-runner.ts:180-337` retains the existing adapter,
sanitization and receipt path for v0; its continuation overload obtains start and
accept capabilities from the inherited session and reuses the extracted existing
classifier in `campaign-outcomes.mjs:13-38`. Historical results reach the runner
only after exact-byte reader validation. Browser/dependency continuation is
refused by `scripts/qa-campaign.ts:635-644`; fixture publication independently
requires owned loopback, anonymous, API GET, read-only and explicitly repeat-safe
paths at `qa-campaign-continuation.ts:65-92`.

The public `status` path is explicit workspace/run readback only
(`scripts/qa-campaign.ts:598-602`). `run`/`resume` requires the inherited channel
and exact host configuration (`:603-627`); it does not turn a CLI argument or
editable record into ownership. `campaign-continuation-owner.ts:90-118` permits a
successor only from the same live host after observed child close and empty owned
process group, while `:144-181` sequences authenticated inherited requests under
the held write admission. PID absence alone is not accepted and the host never
signals a saved post-close PGID.

The reader and publisher retain separate authority. The reader captures bounded
regular files and descriptors, validates exact immutable grammar, then rechecks
the full inventory before returning (`campaign-continuation-reader.mjs:18-92`).
The publication layer requires the current registered static identity before any
fixture identity/product read and restricts replay to the owned target
(`qa-campaign-continuation.ts:79-92,114-183`). Atomic publication, sticky
uncertainty and exact-inventory permission sealing stay in
`campaign-continuation-files.ts`; private staging is not a competing progress or
verdict source.

Kernel remains a structural consumer, not classifier or execution authority.
`components/kernel/src/kernel/console-campaign-v1.ts:68-70` states that boundary;
the implementation binds run/start/complete/receipt paths, hashes, modes,
lineage and exact inventory without importing Console. The workspace validator
integrates those policies without weakening unclassified-path or private-mode
handling (`workspace-validator.ts:538-729`). Console independently recomputes
classification/verdict in its actual reader, so Kernel admission cannot invent a
PASS.

Legacy v0 remains distinct: the ordinary runner branch and receipt writer are
unchanged except for classifier extraction, v1 selection requires an explicit
run ID, and an unselected v1 candidate prevents fallback to an older v0 PASS
(`server/campaign-receipts.mjs:1563-1648`). The recorded compatibility gate is
270/270 and the new continuation gate is 273/273; Kernel records 29/29, with both
nonincremental typechecks exit 0. Candidate-root `sources:verify` exited 0 and
root packaging passed 59/59. The historical pre-adoption 58/59 old-manifest /
new-child mismatch remains correctly retained as a failure, not rewritten green.

## Documentation, skill parity and limits

`docs/qualification/current.md` and the manifest identify the exact prepared
pair while explicitly saying the user's canonical runtime is not switched.
`skills/README.md:16` adds the bounded original-owner continuation reference and
names the host-restart/browser/payment exclusions. Neither complete Console diff
contains a source-skill or Claude-mirror change, so the previously paired full
skills and `.claude/skills` bytes remain in parity; no installed copy is changed.

The earlier sentence saying the root manifest still selected the old pair would
have contradicted the prepared manifest. The current wording-only correction at
`evals/campaign-continuation/recovery-acceptance.md:14-17` makes that statement
historical and points to this Task 7 candidate; reviewed current text is clean.
The delivery document accurately limits the result to same-host owned anonymous
repeat-safe API GET and excludes host restart/cross-host, browser/auth/payment,
arbitrary mutable targets, full-product, tracker, installed-host and cloud claims.
It names browser journey transitions, unfamiliar-product QA, mixed ticket/help
continuation and graph-to-execution work as later capabilities instead of marking
global Stage3 complete.

## Cold evidence reviewed

All six pending delivery checks are satisfied:

1. The retained root is a normal clone at exact prepared commit
   `af4e19392bc64d79eff6fe68a4df590731200a3e`. I directly confirmed that the root
   and all four restored component Git stores have no
   `.git/objects/info/alternates`; their tracked states are clean.
2. `task7-cold-restore.log`, `task7-cold-verify.log` and the post-run
   `task7-cold-post-verify.log` all identify the same four manifest-selected
   commits and trees. Console is b54b849/tree0f8efc0; Kernel is
   185d3e7/treec6cb033. Freeland and inactive reporting reference retain their
   prior identities. Initial verify log SHA-256 independently reproduced as
   `5ebecbf6119e0e997263b2eb75680a938715dd06f92ceded35998aff778394a1`.
3. The retained install records show 296 Console and 54 Kernel packages installed
   from their own lockfiles with `--ignore-scripts --no-audit --no-fund`, separate
   private caches and `/dev/null` user configuration. No install script, browser
   download or upgrade is claimed. The eslint deprecation and npm upgrade notices
   remain visible and are not failures.
4. Cold root source verification exited 0; root packaging passed 59/59 with zero
   failure/cancellation/skip in 34108.003459 ms. I reproduced the raw packaging
   log SHA-256 as
   `7308b9267ed23f0e38778c8b8ab0225cb0adc31b801c7a2eb1e2719bd9d7bc9b`.
   Cold lower-layer controls separately passed 18/18 in 1841.932041 ms and the
   recorded strict TypeScript gate exited 0.
5. `task7-cold-consumer.log` records the sequential representative actual-CLI
   pair 2/2, zero failure/cancellation/skip, 310811.080833 ms. Its independently
   reproduced SHA-256 is
   `16be69cf4028f19a8f702eac79fe1abb1e2cc81f75ccc1ab3ca326fee4a066b8`.
   The healthy held-response report is `phase:qualified`, actual SIGKILL,
   A1/B1/C0 before and A1/B2/C1 after, identity4→10, rejected0, NEEDS_HUMAN,
   partial/final Kernel valid and both finalizers closed. Its reproduced hash is
   `e45bf93716cc37c8a2bbf576beb519d93f96360231ebd6be6c913a9bd9ad3e49`.
   The modeled terminal-sealing report is `phase:qualified`, A1/B1/C1/identity8
   unchanged across resumes, rejected0, NEEDS_HUMAN, pending/final Kernel valid
   and both finalizers closed; reproduced hash
   `096dd05e6dd9f5e4f34e57632b3b3ea4e92505c9e1c3a8cdc9ca6681003aa01d`.
   Both report the exact b54/185 sources. This is intentionally representative
   cold portability evidence: seeded and pre-dispatch variants keep their warm
   Task 6 attribution and are not falsely described as cold repeats.
6. `task-7-final-doc.diff` records the exact clone, gates, log/report hashes,
   dependency counts, skill tree parity and exclusions in both the delivery page
   and recovery acceptance page. Its remaining phrase that final evidence review
   is pending accurately describes the pre-verdict diff reviewed here; propagating
   this APPROVED verdict into that status sentence is a mechanical documentation
   follow-up, not another executable-source or cold gate.

Cold skill parity also reads back exactly: `skills/qa-init` and its Claude mirror
both have tree `ea04f9ed3a19451ead26dd6b0e9de257fc78bea6`; the two
`qa-product-v0` trees both equal
`9890a5190fee728446a29dcae67f8cf19962236e`. No installed-host claim follows.

## Approval boundary

The approved outcome is the reproducible portable source candidate only. It does
not authorize or assert adoption into the user's canonical checkout, migration of
an active or historical campaign, installed Codex/Claude skill changes, product
network use, browser/auth/payment replay, host restart/cross-host takeover,
tracker writes, full-product acceptance, global Stage3 completion or cloud
readiness. No additional whole-delivery finding remains within Task 7 scope.
