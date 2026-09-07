# Source bundle qualification — 2026-09-07

## G1/G2 source follow-up

The Console and Freeland bundles now select the separately reviewed commits below; Kernel393 and the inactive reporting reference are unchanged. An independent ordinary-clone check verified both complete histories, exact HEAD/tree/parent, every tracked blob and mode, strict fsck and clean child-local Git stores. Full stored object populations equal the selected reachable closures: no extra objects or donor alternates. No dependencies or private product state were copied and no runtime/product test was executed by this delivery check.

| Component | Selected commit | Tree | Commits / objects / tracked files |
| --- | --- | --- | --- |
| Console | f4b0d56c0885ca96f310c675872a9adabee9a0e9 | 592376cd04784537e69939e83caa582e37912db2 | 114 / 1560 / 164 |
| Freeland | ca9d9b4844f940d5f544652f22bbca7ebf9c4754 | c334612fd6e55fcd09880c02fe5e35bc6465c4fb | 119 / 2232 / 547 |

The bundle hashes are read back in [the current manifest](../../sources/manifest.v1.json): Console `e5360ee684eec94d8776f6610ea0745e0e914a9aa887d27be46905247f788dbb`; Freeland `0dca9ee5015735d71080b4df7581b099c79e6ce921f38bf087e2b92906d13b9c`. Independent delivery-proof JSON SHA-256: `abf92040a50ed36b655c3698f96f66c96f4ccec01ddb92842ecde58643a77159`, retained privately with the G0–G5 handoff. These are source-delivery measurements, not renewed product receipts. See [G1 qualification](read-only-dependencies.md) and [G2 qualification](cancellation.md) for their separate test chronology and remaining original-product exits.

Root packaging tests passed47/47 after the bundle/pin changes. Whole-root own-entrypoint cold restoration for this follow-up is a separate integration checkpoint; historical results below are not reassigned to it. Existing product owner coordination remains required before adopting new active source pins.

## Initial assembly (historical)

This records the initial assembly. Console advanced through [b38 authored-fixture qualification](authored-fixture.md) to [76d00b1 continuation/learning/portability qualification](learning-portability.md). Initial object counts, scan reports and open boundaries below are preserved as history, not measurements of replacement bundles.

**Verified:** four complete selected-tip bundles restore independently into fresh local repositories. This is source delivery, not a new product QA run or full tool qualification.

| Component | Selected tip | Reachable Git objects | Working files verified |
| --- | --- | ---: | ---: |
| Kernel | 393af209a7629d075258fd1050224db071817a47 | 1323 | 129 |
| Console | 43262b2202532d9ea5648e27dafe0fc5177689fe | 1501 | 151 |
| Freeland | 3d0088ec86b16a2802aa09cca975ca65cc2ede32 | 2186 | 540 |
| Reporting reference | 10d398d8a077068c2184f33958e9b654a2f2947c | 1338 | 134 |

For every bundle, `git bundle verify` succeeded in a freshly initialized empty bare repository and explicitly reported complete history. A separate `git clone --no-local --no-checkout` followed by detached checkout and `git fsck --full` exited0. Every restored object-ID set equals both its audited donor closure and the complete fresh object database; there are no extra/unreachable objects. Every tracked working file hashes to its selected Git blob. Each clone has its own child-local .git, clean status and no alternates. Separate lockfile hashes, tree IDs, bundle bytes and SHA-256 are in [source-bundles.v1.json](source-bundles.v1.json).

Original donors were read at their exact clean HEADs. Bundle creation wrote only the new delivery paths, without donor ref/source changes. Verification used fresh paths under ignored `.local/bundle-review/`; these are not the final components and not registered product workspaces.

## Source-review basis

All selected reachable histories were reviewed, not only current files. Kernel:127commits/668trees/528blobs. Console:108commits/697trees/696blobs, including33 directly inspected historical synthetic PNGs. Freeland:118commits/963trees/1105blobs, including10 directly inspected synthetic PNGs. Reporting adds25 objects beyond the audited393 closure; its complete standalone closure is1338, not an incremental25-object backup. All audited Git object hashes matched.

| Redacted report | SHA-256 |
| --- | --- |
| Kernel REPORT.md | 0319129049e4a0c13b870a0e027c3bdc7474115a18c3a06c94a827cb6fc01f2f |
| Console REPORT.md | 9099a7f48168ace8ef842b4ab42e398b25edfd2f10384e197112b34970d8da6f |
| Freeland REPORT-v2.md | e14f4d713c079aab8de9e177164ca090882974244517ff11f6094b75ca1699ad |
| Reporting delta REPORT.md | 562037d15a8ba02c187c534ab141426a3b8eb0ae95a7fb3c4134c63d59e059c4 |

Local redacted reports/inventories are retained under ignored `.local/source-audits/`. Source rules, semantic false-positive classifications and audit limits were inspected before generating bundles. Freeland's initial regex-only hold is preserved but superseded by its semantic REPORT-v2: environment-variable names, generated lease-password templates and source-comment/provider-sender examples are not stored account credentials. Ordinary source authorship and historical paths are retained for this authorized private target, not offered as anonymized public material.

## Bootstrap and cold-copy proof

After the47-test bootstrap fix/re-review, actual `npm run sources:restore` and `npm run sources:verify` exited0 in qa-agent and read back the exact four selected pins. Index-mask negative controls reject assume-unchanged/skip-worktree without clearing owner flags.

Tracked source-delivery tree `7291565aa42771d26be182d38b943fe8e516ee33` was exported with `git archive` into a fresh directory, with a newly initialized empty root Git database and no node_modules. From that directory its **own** `node tools/workspace.mjs restore`, then `verify` twice all exited0. Root independently ran fsck on all four cold children, compared their full object populations to the expected reachable closures, and hashed every tracked working file to its Git blob: all counts match the table above, no extra objects. Every Git/common/object directory is child-local. This proves cold source restoration without donor/object/dependency access, not a product run.

Evidence is preserved locally under `.local/qualification/assembly.Zf9Fo0/`; the source proof's directory name is not an execution input or transferred owner state. The cold tree precedes this report update; later documentation changes do not alter bundle/CLI identities. A preliminary explicit-root restore was also retained; the own-entrypoint result above uses a separate empty `cold-self-root`.

## Boundaries still open

- Component dependencies/builds/source checks and fresh-session routing are separate [assembly qualification](assembly.md).
- The uncommitted Console fixture fix and its previous180s timeouts are not incorporated or marked passing.
- Existing Freeland runtime evidence belongs to its original candidate/input generation; copying sources creates no new runtime or release verdict.
- No live campaign, payment, tracker update, plugin install, cloud deployment or remote push was performed by these checks.

The scan is bounded heuristic/semantic/visible-pixel inspection, not forensic, legal or secret-free certification. Keep the destination private and preserve Freeland knowledge boundaries.
