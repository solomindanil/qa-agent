# Local consolidation — 20 September 2026

## Status and entry

Adopted locally on `codex/p2-semantic-source-delivery` after [independent Lead AQA review](evidence/local-consolidation-20260920/delivery-review.md): Critical0 / Important0 / Minor0. The owner authorized consolidating local QA-agent work and publishing a branch/PR, not remote merging or product changes. GitHub email verification is deferred by the owner, so publication remains blocked independently of the completed local verification. No push or PR has occurred.

The original62 inputs were preserved byte-for-byte in backup commit `00b3d9e4e4f4b2cdb44b3da1acaafca0c0c05018` on `codex/local-consolidation-backup-20260920`. Adoption merge `27a94c5827be013ee4303718828658f2c1c926ef` has that backup and reviewed `bdcf8a2c711eb27329b13f722afbc1b51e621b0a` as parents. Its tree `a76bc4f25418c494f0f481f8b80304201594a9f6` exactly equals the reviewed tree; all27 reconciled paths were inventoried historical-prefix, experimental-boundary, terminal-newline or old-plan-wrapper differences. Later review/log/status additions are a documentation-only supplement, not an undisclosed implementation change.

The [current checkpoint](current.md), [manifest](../../sources/manifest.v1.json) and [global P0–P7 plan](../superpowers/plans/2026-09-16-cross-product-qa-global-plan.md) remain the entrypoints. No new engine, source selector or installed skill is introduced.

Selected source is unchanged from the reviewed P2 package: Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`, Console `c421160a71c0679a357f29828029ec3550791d16`, Freeland `0ea2df10f1b6d613e01d50011c269ca0fa999877`; reporting reference `10d398d8a077068c2184f33958e9b654a2f2947c` remains inactive. Existing campaigns retain their frozen runtimes and owners.

## What was retained

The [62-entry inventory](evidence/local-consolidation-20260920/inventory.json) records original and retained SHA-256 hashes, exact paths, classifications and reversible transformations:

- All49 original dirty/untracked root paths are accounted for:46 non-bundle files and3 historical bundles.
- Thirteen specifically linked ignored logs are included deliberately; `.gitignore` was not broadened.
- The dirty10-September plan is byte-identical to the already delivered `f49e739` snapshot. Its newer active-path historical wrapper is preserved, not overwritten by old priorities.
- The original dirty `AGENTS.md` is retained as inert `.md.txt` evidence; its useful Buzz-contract change is merged into the current entry rather than replacing newer source guidance.
- Historical document bodies, raw logs and the fresh actor's first answer keep their original attribution. Human entry documents receive a conspicuous historical prefix; the inventory verifies the original body after removing only that prefix. The Android JSON has one added terminal newline, no JSON-value change.

The [non-bundle audit](evidence/local-consolidation-20260920/local-delivery-audit-20260920.md) contains the per-file disposition and exact supersession map. Its old private/absolute links are historical locators, not missing installation dependencies. Product reports remain private business context; this delivery is suitable only for the authorized private repository. It does not include the referenced credentials, QR images, raw provider payloads or campaign stores.

## Current reusable additions

- [Buzz communication contract](../communication/buzz.md): exact scope/version, per-item evidence, limits and responsible next action; no independent send/financial authority.
- [Dialogue decision exercises](../../evals/dialogue-quality/README.md), six cases and semantic rubric: usable evaluation material, not blind evaluation or measured general reliability.
- [Evaluation index](../../evals/README.md): replaces a stale blanket “positive runtime pending” assertion with the exact historical22/36/8-control qualifications and their limits.

## Historical claims and their accepted successors

| Preserved old wording | Current interpretation |
| --- | --- |
| Console bb9/d28 not selected; P1 only designed | Repairs are in the selected observation lineage; see [Console adoption](console-p0-adoption-20260920.md), [observations](agent-observations-20260920.md), [reference delivery](observation-skill-reference-20260920.md). |
| Freeland510/064 and readiness unadopted; CI seam unresolved | [d475 source adoption](freeland-source-adoption-20260920.md) and [P2 successor](p2-semantic-repair-20260920.md) supersede those source-status statements. Original product runs retain their original candidates. |
| CI still targets3ee; source adoption is next | The actual [workflow](../../.github/workflows/qa-source.yml) and current manifest govern; hosted execution is not yet claimed. |
| Global plan paused, old product “CURRENT” locator, old budgets/permissions | Historical only. Use current source entry and [product owner resolution](../../products/README.md). Neither archived proposal R1 nor a prior product message overrides current authority. |
| PR430 technical findings on an earlier head | Dated product evidence, not new QA-agent implementation acceptance or a conclusion about a later product head. |

## Inactive source preserved for later work

The [source-lineage audit](evidence/local-consolidation-20260920/source-lineage-audit-20260920.md) records exact ancestry and historical blob equivalences. Preserve these candidates without selecting their pins:

| Candidate | Retained source and limit |
| --- | --- |
| Failed→skip diagnostic normalization/verdict | [Seven-file patch](../../sources/candidates/freeland-failed-skip-3ee1cb3.unqualified.patch), base `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`, SHA256 `b2edd75079b7a8b47f6be2c35454e581566f323ae77e20d3d431935f9dfae4ef`. Inactive/unqualified; current selected source fails closed on the reproduced shape. The candidate classifier must not be adopted without its paired verdict safeguards and full relevant matrix. |
| Controlled signup→reset diagnostic | [Complete committed-source bundle](../../sources/candidates/freeland-auth-diagnostic-43b025c.unqualified.bundle), HEAD `43b025c8a79b743c7afde5fe18695d6b7b54a5d8`, SHA256 `087fd4447e0cafa9a8c82acdbdb171f34fd50e6179d32857baadf5bed489e095`. Four commits/nine paths; excludes the donor's dirty private graph. Inactive/unqualified; includes external-email budget2→3, which is not activated or authorized by archiving. |
| Registration planning snapshot | Existing Kernel a9378b2 / Console d272f31 bundles remain [inactive](registration-planning-snapshot-20260915.md); later porting must preserve the active observation pair and old registrations. |
| Android pilot | [Seven source files](../../tools/android-pilot/README.md), experimental and opt-in. Thirteen local controls cover driver/runner, not actual Appium/cloud/session lifecycle or privacy. Private SDK/dependency examples are not portable installed runtimes. |

The three newly retained historical bundles bb9b739/510e08a/0644108 contain already adopted or equivalently integrated repairs; their original hashes are in the inventory. No old bundle supersedes a selected source. Old dirty Console and QA-H003 files were matched to accepted historical blobs; duplicating obsolete runtime directories would not add implementation.

The lineage audit is explicitly bounded: broken historical `.git` pointers and their unknown scratch changes remain a separate forensic scope, preserved in place. Neither this inventory nor a clean selected source certifies every private scratch directory, dangling Git object or live campaign. No original worktree was removed/reset.

## Verification and next step

| Gate | Exact result and evidence |
| --- | --- |
| Assembled source | All four manifest pins verified; [root61/61](evidence/local-consolidation-20260920/root-tests.log), zero failed/skipped; Android local controls13/13. |
| Cold clone at bdcf8a2 | `git clone --no-local`, reduced-environment source restore/verify, root61/61 and Android13/13; zero failed/skipped, no dependency installation, clean root/four children. [Cold log](evidence/local-consolidation-20260920/cold-gate.log), SHA256 `f4831042ae5ab130318098df0e25f71a350d98e32c1e0c45cc3193a4aecd90ac`. |
| Canonical adoption | Rechecked original49-path set and62 byte hashes before adoption; verified all62 original Git blobs in the backup and all62 retained hashes after resolution. Only clean Freeland source fast-forwarded d4754f7→0ea2df1; the other pins and campaign runtimes were unchanged. |
| Fresh canonical gate at27a94c5 | All four exact sources verified; root61/61 and Android13/13, zero failed/skipped. [Canonical log](evidence/local-consolidation-20260920/canonical-gate.log), SHA256 `6059b2d4cd557a47589e0b4ae48901872bb0be40a8b54ec540ab80b6fe7a3e0b`. |
| Independent review | Reviewed48e9fc9→bdcf8a2, all72 paths, preservation and non-activation boundaries: APPROVED. [Full review](evidence/local-consolidation-20260920/delivery-review.md), SHA256 `17f9c9e585fda24dffb2ba9ff2761cf636ae2146846cd7f20530a4465cb88d36`. |

The additional bounded text scan of the auth candidate flagged synthetic JWT/PEM negative-control fixtures in `tests/freeland-main/provenance.test.mjs`; those fixture bytes already exist in its3ee1cb3 base and are not new credentials. This is a scoped privacy check, not a comprehensive historical-secret certification. The private repository retains historical team/merchant context. Preserved whitespace in immutable old evidence/patches is an explicitly reviewed `diff --check` exception; operational/documentation changes are checked separately, not rewritten to alter raw evidence.

The backup readback first exceeded the command wrapper's default output buffer while reading a complete Git bundle; repeating that read-only verification with an adequate bounded buffer verified all62 blobs. No backup bytes, test assertions or runtime protections were changed. No device/provider execution occurred. The prior full P2 `qa:verify:all` remains attributed to the unchanged exact component bytes and is not a new product QA run.

After local adoption, continue the **original dry card-top-up UI consumer**, grounding current product expectations before selected quote/caption/total/rail-switching assertions. The accepted P2-A helper repair is not repeated. Source publication, live-product acceptance and global P2–P6 completion are separate outcomes.
