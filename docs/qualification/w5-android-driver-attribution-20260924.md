# W5 Android owner-run source attribution — 24 September 2026

This is a read-only reconciliation of the retained Nuanu App numeric-keyboard
owner run, not a new device run or root Android-pilot acceptance. It narrows the
source question without rewriting the run's historical evidence.

## What the retained record establishes

- The owner script at
  `.local/products/nuanu-app/qa-20260924/android4-redmi-numeric-retest-01/run.mjs`
  imports `tools/android-pilot/driver.mjs` from this repository. It does **not**
  invoke the root `run.mjs` or `runner.mjs`.
- The present Driver has SHA-256
  `575dc2847ad15292ef28c4cdfd6fbae3225d2533fb6108b210e20f873a9a3202`
  and Git blob `ac8d92554154d6ce1c04c7e05a5ffdb04bcfaae2`. Its bytes equal
  commit `00b3d9e4e4f4b2cdb44b3da1acaafca0c0c05018` and current HEAD
  `1089d62100a637bd951af24a188d8b16a285ea05`. The 20 September local
  consolidation inventory independently records the same Driver SHA-256.
- The owner report, owner script, result and release checkpoint still match
  their four SHA-256 values published in `current.md` at this reconciliation.
  The run records a scoped numeric Close result, provider `done`, session
  DELETE HTTP 200 and zero remaining queued/running slots. The Wallet base
  surface stayed visually unresolved; the owner release verdict is **NOT
  ACCEPTED**.

## What it does not establish

The run records its APK hash but no Driver-byte hash, Driver snapshot, source
HEAD or contemporaneous clean-tree proof. Present-day equality and Git
history cannot exclude temporary working-tree differences at execution time.
Therefore the import path and source continuity are established, but the
**exact historical executed Driver bytes are not proven**. Do not attach the
current Driver hash retroactively to the device result.

This owner-orchestrated happy path does not exercise the root runner's session
create timeout/unknown outcome, deletion failure, interruption, durable
result preservation, output privacy or fixed chooser/Back plan. No W5 root
runner lifecycle or privacy gate closes from this readback. Repeating the
already completed numeric product branch would not fill those gaps.

## Next bounded gate

Before implementation, review a local-only root-runner lifecycle slice with
independent controls for create timeout/unknown outcome, delete failure,
interruption and durable result preservation. Any future authorized live owner
run should record the imported Driver's actual bytes/hash at execution time;
that rule is prospective, not a repair to this historical receipt. Product
actions, device quota and root runner changes were outside this read-only
reconciliation.
