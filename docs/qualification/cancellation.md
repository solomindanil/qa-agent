# G2 campaign cancellation — source qualification

This slice fixes a demonstrated tool-lifecycle gap before a broader Freeland campaign. It is not product QA, a refreshed manual acceptance, or cloud qualification.

## Behavior

The existing campaign admission gate now receives cleanup outcomes from its owned process groups and browser/transport resources. A cancellation immediately prevents new actions. Admission is released only after cleanup is proved and the operation has unwound; an unknown outcome retains the lock even if a late callback reports success. No stale lock is automatically removed.

The existing controlled runners share their process-group implementation with the staging launcher and campaign consumers. Browser collectors disable their own automatic signal exit only when operating under this owner, so the admission gate can finish cleanup. Graph and verdict writers check cancellation before committing new evidence; rollback remains available. Callers without the ownership capability retain their existing API.

Both controlled harness identities include the extracted runner. Changing only that helper invalidates an old acceptance receipt. Unit fixtures use disposable synthetic receipts; the real TC02 receipt is not rewritten and remains stale for the new harness.

## Verification status

Freeland source commit `ca9d9b4844f940d5f544652f22bbca7ebf9c4754`, tree `c334612fd6e55fcd09880c02fe5e35bc6465c4fb`, is based on `3d0088ec86b16a2802aa09cca975ca65cc2ede32`. All 31 delivery files were independently reviewed; no dependency files or product state changed.

- Real local SIGTERM/process-group integration: 118/118 after repairing partial JSON readiness in a new fixture. The initial 117/118 result is retained separately.
- Independent lifecycle review: 55/55; final receipt/fixture review: 42/42. These overlap other tests and are not additive product coverage.
- First aggregate: main 374/374 and TypeScript passed; release 1244/1250. Six failures came from two disposable fixtures inheriting stale controlled acceptance. Fixture-only correction passed 36/36.
- Full repeat `qa:verify` exited0: main374/374, release1282/1282, replacements635/635 and transport70/70, with zero failed/cancelled/skipped records; TypeScript and provenance passed. These groups are command results, not a sum of unique product tests. Raw TAP SHA-256: `304450444af21a9554fe9b52a25506aed53ff390bc02fe0bcfd7caad7de316e6`.
- Claude's E1–E8 compatibility review found no blocking runtime defect but noticed obsolete test spies. The last change replaced them with the actual process seam and a positive counter control. Final main375/375 and independent launcher8/8 passed; provenance was refreshed. The full repeat above precedes only this test/manifest correction, not a runtime change. It is not relabelled as a new full run on the final commit.
- Direct private binding preflight returned5 selectors with `bindingsVerified:true` and8 stored qualified bindings. This is structural metadata, not renewed acceptance or executed product tests.
- Source manifest validation retains original ancestry. Actual acceptance receipts, registry, installed skills, product code and product environments are unchanged.

The execFile adapter has a30-minute child watchdog; the standalone staging launcher retains60minutes and the controlled wrappers retain their own budgets. This is a bounded execution policy, not a measured guarantee that every future product suite finishes within it. Cancellation is classified by the existing admission capability before consumer publication; no second cancellation/evidence schema was added.

## Next proof

Independently restore the source bundle and coordinate adoption with the product owner. Re-observe the live candidate before the approved broader read-only campaign. A passing cancellation unit test does not qualify the original payment, Telegram, VPN or ticket scenarios. Stale controlled acceptance needs its supported qualification path, not an edited digest.

No product purchase, tracker write, cloud worker, source installation or environment mutation is part of this slice.
