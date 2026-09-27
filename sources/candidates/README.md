# Development source archives

> Historical provenance only. Every status label below (including “MANIFEST-SELECTED,” “canonical,” and “current”) describes its dated review, **not today's selection**. The sole current source selector is [manifest.v1.json](../manifest.v1.json); consult the [current checkpoint](../../docs/qualification/current.md) for present qualification and the product owner for an existing campaign's frozen runtime. These bundles and reports are retained evidence, not optional runtime replacements or authorization for product action. Do not delete or rewrite them without a separate provenance and dependency review.

## D13-479 existing-target check authoring, 27 September 2026

Kernel `7dd9265f846676d925cc084f3dcd8d8883364613`, tree
`04ccf2050fa651ef96f9772b215f3451c6fc0219`, is preserved in
`kernel-d13-479-check-authoring-7dd9265.bundle` (961,707 bytes, SHA-256
`c70da5bbe43a68cd724c61ca07c71041734be32e8458364ce7bf7d57320f3914`).
Paired Console `58b02cd4878eb3a4e9213ade2a9d24af2e97d9a8`, tree
`c68e9a627620a71116bb86eadfb2d4c5ad6539a3`, is preserved in
`console-d13-479-kernel-pair-58b02cd.bundle` (4,402,259 bytes, SHA-256
`5ea906f00a7ac2959bb6d1cb939124051f400a458d411c5016c77028c1a3319f`).
Both bundles have complete history and a sole `HEAD` ref. Kernel adds the
bounded pure check-authoring helper and offline controls; Console advances only
its exact Kernel pin and positive test/documentation references. The existing
publication and authority logic is unchanged. [Exact qualification](../../docs/qualification/d13-479-check-authoring-20260927.md)
records first attempts, the 51/51 Kernel gate, Console pair gates, adapted
consumer comparison, independent review and source-only limits. The manifest
alone selects current source; existing campaigns and installed skills do not
change with these archives.

## Local consolidation, 20 September 2026

The [consolidation index](../../docs/qualification/local-consolidation-20260920.md)
retains historical bb9b739/510e08a/0644108 archives and two explicitly
**inactive/unqualified** candidates: failed→skip seven-file patch and committed
auth diagnostic43b025c bundle. Exact bases, hashes, effects and acceptance gaps
are recorded there. Neither archival retention nor passing root tests selects
a candidate. The committed manifest now selects later Console/Kernel successors
and Freeland source; old dated selection labels below do not override it.

## W2a registration snapshot pair, 24 September 2026

Kernel `a0a20e65b3290e6bbf5afe91d0e45ed372389adb`, tree
`1673f3edc3199d814f2c634e41278e9db3d60d39`, is preserved in
`kernel-w2a-snapshot-a0a20e6.bundle` (969922 bytes, SHA256
`8a26e2c4bfba9736017306615fd80b3cb3b4e587e646568cd64faa95523c7979`).
Console `f75d9630edd599d9fd9bfbfbf5faf195e25db685`, tree
`6a8b61ccd0914bdc6b963a2843049fa50158eda7`, is preserved in
`console-w2a-snapshot-f75d963.bundle` (4395974 bytes, SHA256
`e0cc267a15baff8034223ec74532f89d0e17052de5032ec68359d609947687fa`).
Both are complete-history bundles with one `HEAD`; independent normal clones
recover exact clean trees and pass `git fsck --full`. This exact pair is the
bounded committed source selection, not a migration of existing campaign
runtimes. [W2a qualification](../../docs/qualification/w2a-registration-snapshot-adoption-20260924.md)
retains the full Kernel timeout/exit130, the Console portability preflight
failure and corrected pass, old-workspace incompatibility, and live T7 gap.

## Freeland readiness and PAY01 composition, 20 September 2026

Source `d4754f7ddbcb8183f695f479ef21aa7728c1ace0`, tree
`2fffdb008347b3337a5b58eea8f3cda8889d584c`; complete-history archive
`freeland-pay-readiness-d4754f7.bundle`, SHA256
`9195aeea5c0995ca937876e8b7e569a1e3cbe6700147e32f67779781620651f0`.
Combines committed readinessaa1 with reviewed PAY01v2, and extracts the pure
PAY01 source-only test boundary without removing other tests. PAY01 remains
shadow; seven other historical receipt authorities remain stale. See
[delivery qualification](../../docs/qualification/freeland-source-adoption-20260920.md)
for exact gates, selection status and limits. No campaign or installed-skill
migration, payment or product acceptance follows this source update.

## Agent observations, 20 September 2026

Paired sources Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786` and Console `48e4628f91569c4cf96d0e616cbe6e29ec31baee`; archives `kernel-agent-observations-aa5d2d1.bundle` and `console-agent-observations-48e4628.bundle` preserve complete history. Their exact trees/checksums, component reviews, scoped fixture results and remaining delivery/live-consumer gates are recorded in [qualification](../../docs/qualification/agent-observations-20260920.md). The current manifest is the selector; old archives are retained, not overwritten. No campaign/skill migration or product acceptance follows this source update.

These bundles preserve reviewed and unfinished development without depending on the author's local checkout. The [manifest](../manifest.v1.json) is the only source selector; see [current qualification](../../docs/qualification/current.md) for current pins. Dated selection labels below are historical and do not override that selector. The `candidates/` directory is a provenance location, not a runtime status. No archive grants product execution, campaign migration or skill-installation authority. Do not copy an archived skill over an accepted one.

## Console authority and findings repairs, 20 September 2026

Source `d28d7743e9aac370a726df6c6288ad2ef0e52c78`, tree
`09adfece9000a4d5d79fa63877b46c00febf180b`, successor to66ac7db via bb9b739.
Archive `console-p0-findings-d28d774.bundle`, complete history,
SHA256 `446fd21decd97fba6f2c7fa8f35f36b89cf9f83e2a84091bb91585069f93ab44`.
**MANIFEST-SELECTED / CANONICAL SOURCE VERIFIED.** Kernel185 and lockfile unchanged.
Fresh canonical21/21, nonincremental TypeScript and root61/61 passed; independent
cold delivery verified restoration, pair2/2 and authority7/7. Existing source
repairs reused, no product/campaign/installed-skill migration or hosted CI.
[Exact adoption, previous identities and limits](../../docs/qualification/console-p0-adoption-20260920.md).

## Freeland divergent production baseline, 15 September 2026

Source `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`, parent21c1c61,
tree `52e0e23be1ad6413fd8bb549ce7f043b2b0fa07b`.
Archive `freeland-divergent-baseline-3ee1cb3.bundle`, complete history and sole
HEAD, SHA256 `3577569dc5be28497dfd4ac86d7f46d5b276533015d6bb664575f0c5735b0671`.
**SOURCE REVIEWED / COLD-CHECKED / MANIFEST-SELECTED.** Schema V3 binds exact
production, candidate and unique merge-base trees for a real divergence and
requires explicit full planning; impacted mode fails closed before replacement.
V1/V2 behavior and the prior M1/M5 repairs remain. Full owning `qa:verify:all`
passed2786/2786 with no failures/skips. [Qualification, delivery and retained
limits](../../docs/qualification/freeland-divergent-baseline-adoption-20260915.md).
This archive does not establish a product PASS or authorize live/product/payment
effects, campaign migration or installed-skill promotion.

## Console browser journey assertions, 14 September 2026

Source `66ac7db55a25f56b199b2cb00ad83df3b8dad868`, parentb54b849,
tree `8c0a426b3133e326eb120f09a2e0c9408eb68eb5`.
Archive `console-browser-journeys-66ac7db.bundle`, complete history and sole HEAD,
SHA256 `9f9046afdf7f222a37f87ffca6a35badf1763fbf09c170b29ba0bbfdba366f8c`.
**REVIEWED / COLD-CHECKED / MANIFEST-SELECTED.** [Canonical adoption](../../docs/qualification/browser-journey-adoption-20260914.md).
Optional intermediate
assertions in the existing executor and persisted reader; old plans unchanged.
Expanded321/321, exact cold29/29, typecheck/build0, independent Lead AQA review.
Source references and Claude mirror updated; installed skills unchanged.
[Qualification, retained failures, replay and limits](../../docs/qualification/browser-journeys-20260914.md).

## Console owned catalog fixture, 14 September 2026

Source `881a93e43fd9b90f3dcf9812812f6cf8ad854789`, parent1c715a1,
tree `b03f187bc55483f63e93f2cbcf357a16ceb0efa5`.
Archive `console-public-fixture-881a93e.bundle`, complete history and sole HEAD,
SHA256 `7ab032c7facee983186d12c44b46ee4431ea31b288c3d9fbe91397e3c00532ba`.
Three test files only; production runtime/skills and exact Kernel pin unchanged.
Independent Lead AQA review approved,5 focused lifecycle/public-input controls
and typecheck passed. The [fresh-agent exercise](../../evals/public-input-agent-cycle/README.md)
is separate from these deterministic fixture controls.

## Kernel reserved write admission, 14 September 2026

Source `657894dbd61561a634f36669a0874dccccbea59e`,
tree `4e57a5e0a21a3f5fc838295a75e06a94e13c4081`, based on15a067c.
Archive `kernel-admission-657894d.bundle`, complete history and sole HEAD,
SHA256 `84c443bf1bb0ed715b96989cc71906ea04652ab7d0a840529d7a351110e10de7`.
**SOURCE REVIEWED / MANIFEST SELECTED.** Reserved native-leaf arbitration plus exact
consumer metadata and verified own-temp cleanup. Fresh55 writer,10 actual
consumer and244 broader compatibility controls passed; typecheck/build and
independent Lead AQA review passed. No full-suite, hostile-filesystem, automatic
recovery or product claim. [Replay, original failures and limits](../../docs/qualification/kernel-admission-20260914.md).
Its exact-pin Console successor is qualified and selected below; existing campaign runtimes remain separate.

## Console–Kernel paired successor, 14 September 2026

Console `1c715a1980dac52fb8ba1d267c8c8e2d97b406e8`,
tree `f6fc0cc720008dde02891592f988a331ab24e289`, parent ce80729.
Archive `console-m4-pair-1c715a1.bundle`, complete history and sole HEAD,
SHA256 `044a018d6ff7de2e7f66ed6a1d03bdeea4f32a0039ed4f3ab3a0febba4d02415`.
**PAIRED SOURCE REVIEWED / PREVIOUS MANIFEST SELECTION.** Four-file exact Kernel657894d pin and
matching tests/README only. Fresh121 authority,21 actual consumers and160 E1/M3/M2
executions passed, independent review passed; nonincremental typecheck/Vite0.
Cold source,2 skill controls and new/old Kernel authority checks passed.
[Exact gates and limitations](../../docs/qualification/console-kernel-pair-20260914.md).
This preserves the existing E1/M2/M3 source; selection does not migrate campaigns.

## Console public input, 13 September 2026

Latest integrated successor: Console`ce80729994ec812dcf10b54910cde0bddf306e1a`,
tree`3f76d017f98afcf38850a3acaaa3ff1370b841b4`,
archive`console-public-input-integrated-ce80729.bundle`, SHA256
`9208220904604b5b378b58a19f0c0895ef5e5c3b0bf03185b1e9ed25d2a36dcd`.
**INTEGRATED SOURCE REVIEWED / NOT ACTIVE.** Exact reviewed M3 handover correction
on ad9e58e, with E1 runtime/reader/skills unchanged. Combined154/154 controls,
TypeScript and independent review passed; cold exact restore and mirror2/2 passed.
No active adoption or real unfamiliar-product acceptance follows from these gates.

Prior source-reference successor: Console`ad9e58e08937f50fdc8f6bf8102086cda4c63ed3`,
tree`7340bbe07bc4b1ed99f1dec4d7bb5ae87ecee756`,
archive`console-public-input-reference-ad9e58e.bundle`, SHA256
`8329a352ecb12c7b3aa611cab788f15bb69db58512ec4c5fb9fff5a321e70cfa`.
**SOURCE/REFERENCE REVIEWED / NOT ACTIVE.** Five documentation files only;
fresh reference application and cold2/2 mirror controls passed. Runtime remains
6e84afb; it lacks the M3 correction now present in ce80729 above.

Prior [E1 runtime candidate](../../docs/qualification/public-input-candidate-20260913.md):
Console6e84afbeef9dc660fd7b5b4c7096c17e7cfd72f0, treee35b38ae136258104fa287b5c3c632bcbe328885,
archive `console-public-input-readback-6e84afb.bundle`, SHA256
`f59331434c8476cf26f10e502a3c787c54e7d627e1552de76d962473e03821ad`.
124/124 input/receipt-ingestion/dependency controls and cold4/4 actual reader checks.
**RUNTIME SOURCE REVIEWED / NOT ACTIVE.** Reference successor above; actual
unfamiliar-product qualification and adoption remain separate.

The preceding incomplete source remains retained:
Console00e410253d59d4f913eaf290c4abaa6bd0605446, tree3fc9bbb45062ab132c0a09e0de581270003c28aa,
archive `console-public-input-00e4102.bundle`, SHA256
`1d08b598cd6f40ba5f79792dd3cfd7b0109f90df3420672025ec2989eb16591e`.
Its262/262 controls did not exercise the actual evidence reader; that integration
failed and is repaired in6e84afb above. Both are based on inactive M3 and preserve
the existing needs_review policy.

## Freeland source-locator formatting, 13 September 2026

Latest reviewed successor: `21c1c617a2dbe5d1131215dc738dba2556851ae3`,
tree `f691a01e33aabb8a72673326ec524d955c4794e8`,
archive `freeland-graph-url-boundary-21c1c61.bundle`, SHA256
`2646e64b1a623530d0cab99f07a2d5d0a920245e75bb858001e9fc3c645ca066`.
**SOURCE REVIEWED / MANIFEST SELECTED.** URL query/fragment regression repaired;
fresh full owning offline2759 executions and cold51 graph/provenance controls
passed. Independent source review passed. The first full invocation's TMPDIR
configuration failure remains recorded in the repair report, not counted green.

Historical initial candidate:

- Commit: `b30ef1316d3db08c71ccaa398a2b4fac76fd4ae9`, based on9f848bb below.
- Tree: `250ff11d6d578de8e38f1b678c4afbe4cdc40639`.
- Archive: `freeland-graph-locators-b30ef13.bundle`, complete history, sole HEAD.
- SHA256: `1691fa2f702767837bf0854e91862ea5f6b37f1a6e9e1b9913cf678a3540e917`.
- **CHANGES REQUESTED / NOT ACTIVE.** Review found URL query/fragment false
  dependencies; reviewed successor is above. Historical full owning offline gate2758/2758;
  cold source restore and19 pure controls passed without dependencies.
  [Exact scope, failed attempts and replay](../../docs/qualification/graph-locator-candidate-20260913.md).
  No source-pin switch, receipt promotion, live product proof or graph-debt closure.

## Console conditional plan write, 13 September 2026

Latest reviewed successor: `4fddb679f84619a7e8e7ac871efa84a1493cb5ed`,
tree `e4e319dc45a71cc1856817efe890cae719353826`,
archive `console-plan-write-handover-4fddb67.bundle`, SHA256
`f542175a2d0206cd634fe1c3e9eefbc23768a14cd101b30d7f3c8406705d24d2`.
**SOURCE REVIEWED / NOT ACTIVE.** Legitimate admission-lock handover stays
definite; focused28 and expanded216 controls passed, independent Lead AQA approved.
Cold source-only restoration passed; it does not contain the separate E1 lane.

Historical initial candidate:

- Commit: `b474d52fb6b8b2d13fe362a3f551f8ef6b6ee17a`, based on dc8eb59 below.
- Tree: `53aa0c134f1bbe599c5de98f56638bb5f6355cd7`.
- Archive: `console-plan-write-b474d52.bundle`, complete history, sole HEAD.
- SHA256: `1cebf0c95a785bc3787bda315c02abb930857836742c0cfabe6e3184cd0bd070`.
- **CHANGES REQUESTED / NOT ACTIVE.** Review found a false UNKNOWN after
  legitimate lock handover; reviewed successor is above.
  Historical215/215 with cold restore. [Diff scope, replay and unresolved-operation
  instructions](../../docs/qualification/console-plan-write-candidate-20260913.md).
  Do not substitute this candidate for a manifest-selected runtime.

## Console finalization repair, 13 September 2026

- Source commit: `dc8eb59dfeb2b5231617379096e945f0ccfc09da`.
- Tree: `b2b9d32c0a4e27b930d7e1053772440cfa335015`.
- Bundle SHA256: `cd6c4b97baa5c5f19f0942c857eb6338f6ba283e969ceeb4b8b4c682a75961c4`.
- Bundle: `console-finalization-dc8eb59.bundle`, complete reachable history, sole `HEAD` reference.
- Status: **reviewed M2 development candidate, NOT ACTIVE**. Only the browser adapter and six source-owned loopback regression controls changed from canonical b392. [Exact results and replay](../../docs/qualification/console-finalization-review-20260913.md): actual RED4/6, GREEN6/6, fresh combined121/121, TypeScript/lint/build0. No full-product or all-unit qualification is implied.

For deliberate review, from the repository root, use a fresh directory:

```sh
git bundle verify sources/candidates/console-finalization-dc8eb59.bundle
git clone --no-checkout -- sources/candidates/console-finalization-dc8eb59.bundle /absolute/new-console-review
git -C /absolute/new-console-review switch -c codex/console-review dc8eb59dfeb2b5231617379096e945f0ccfc09da
```

This does not restore or replace an active component. Follow the repair report for
bounded local replay; do not run Console's default `npm test` as an offline gate.

## Freeland browser-guard repair, 13 September 2026

- Source commit: `9f848bb01f0fdde3f6b0841019243e64494e24b5`.
- Tree: `d28fb587203937aab748e8d935e710ea881ab18a`.
- Bundle SHA256: `56e45dcc9bacd0e8461f927d39c2ad4f6c5c83efcb90e36f1a3cf0079932c7b9`.
- Bundle: `freeland-browser-guard-9f848bb.bundle`, complete history with sole `HEAD` reference; includes the older722bf1b maintenance source, scoped M1 repair, test correction and four-shadow source-binding refresh. Intermediate25d6ac2/c47e90a commits remain in this history, not competing active bundles.
- Status: **reviewed M1 development candidate, NOT ACTIVE**. Current gates and limits are in [the portable repair report](../../docs/qualification/browser-guard-admission-review-20260913.md). Other maintenance findings are not closed by this archive.
- A new independent clone recovered the exact HEAD/tree, passed `git fsck --full`, provenance verification and clean QA source-authority collection, without an alternates store or installed dependencies. This establishes source portability, not browser/product acceptance on another machine.

For deliberate review, use a fresh path (not a component or campaign directory):

```sh
git bundle verify sources/candidates/freeland-browser-guard-9f848bb.bundle
git clone --no-checkout -- sources/candidates/freeland-browser-guard-9f848bb.bundle /absolute/new-guard-review
git -C /absolute/new-guard-review switch -c codex/browser-guard-review 9f848bb01f0fdde3f6b0841019243e64494e24b5
```

Existing campaigns retain their frozen runtime. Do not transfer an older receipt to
this changed source or install its skills implicitly. The old rejected archive
below is retained for history and reproduction, not recommended as a fallback.

## Freeland maintenance, 13 September 2026

- Source commit: `722bf1be5f08cc1904808af749e9c1c7f5b96881`.
- Tree: `aab9c1c340c2cafca6e5f5d914c2a1f045c3d2c4`.
- Delivered bundle SHA256: `46671a34826db1bbea989a21b709f741b7026f872aa7357a473fd5585a2618bd`. This regenerated pack has the same source commit/tree as the earlier private candidate but a different pack checksum; do not substitute the older checksum.
- Status: **NOT READY TO ADOPT**. See [current counterexamples and repair criteria](../../docs/qualification/maintenance-backlog-20260913.md).
- Bundle: `freeland-maintenance-722bf1b.bundle`, complete history reachable from its sole `HEAD` reference. It contains source and source-controlled tests, not the original private review workspace, logs, sessions or credentials provisioned at runtime. Historical product-specific permissions in source do not authorize this consumer.

For deliberate source review/development only, use a new independent directory; never overwrite components/freeland or a campaign runtime. Replace the example absolute path and run these from this repository root:

```sh
git bundle verify sources/candidates/freeland-maintenance-722bf1b.bundle
git clone --no-checkout -- sources/candidates/freeland-maintenance-722bf1b.bundle /absolute/new-development-copy
git -C /absolute/new-development-copy switch -c codex/freeland-maintenance 722bf1be5f08cc1904808af749e9c1c7f5b96881
```

Check its exact commit/tree and bundle checksum before review. The first command validates Git closure, not product or policy correctness. No installation, testing against a product, source promotion or cloud execution follows automatically. After a repair, use owning tests/review and the existing accepted-source delivery procedure; retain the rejected candidate's attribution.
