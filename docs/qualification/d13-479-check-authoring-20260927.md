# D13-479 — bounded existing-target check authoring qualification

Date: 27 September 2026. Candidate-review status: **qualified for bounded adoption and separate source delivery**. The fresh 51/51 five-file gate verifies the hashes below. The later local delivery follow-up is recorded at the end of this page; neither stage is product QA or permission to install or migrate anything.

## Authority and exact source boundary

The [24 September authoring probe](d13-479-authoring-probe-20260924.md) established synthetic fixtureless authoring feasibility and exposed repeated four-model/digest assembly. It did **not** select new runtime code or measure production authoring. The [approved corrected design](../superpowers/specs/2026-09-27-d13-479-check-authoring.md) narrows this implementation to explicitly named catalog entries on existing applicable targets. The [task plan](../superpowers/plans/2026-09-27-d13-479-check-authoring.md) requires independent API/browser benefit and preservation controls. No claim in this record promotes the old probe's product observations or hosted CI results to these bytes.

Base root `1305fb7bf873d011849525b722bcf164dfeced45`, then-selected Kernel `ece24e865f7ea37cff32c24c7e3739c9d0059f81`, then-selected Console `5634b7f456999a967cc64704c58f7d6e040f0e57`; root branch `codex/stable-20260926`. Task 1 recorded pre-edit `npm run sources:verify` as `sources_verified` for four selected components. At candidate review, Kernel was **dirty and not manifest-selected**. These five Kernel files are the complete observed implementation/test diff boundary; SHA-256 values identify the inspected post-repair bytes:

| Kernel-relative path | Role | SHA-256 |
| --- | --- | --- |
| `src/kernel/registration-check-authoring.ts` | New pure helper | `005ad6a4216fc791e8ead64e29a87ea13d459ad89d86fb301f1cce3a190d974e` |
| `src/index.ts` | Function and three input-type exports | `83cd70175e52d45456b6bc857fce76f976ad59290d1d21ba0a9e2ffaa8c5c85e` |
| `tests/registration/check-authoring.test.ts` | Pure API/browser/manual, capture and refusal controls | `566217314818c45b5145ee48d13f1c413874a7388fdb0d533635c9ce30c0a9a8` |
| `tests/registration/check-authoring-consumers.test.ts` | Independent adapted-retained comparisons | `4696779f8f9b2134f807683b256f38ebf78b25088ae557793f904cd692e4d1e7` |
| `tests/workspace/knowledge-revision.test.ts` | Existing offline preview/apply/readback addition | `0b415dd73270edde58d8c7176bf7a39741285f083e77f3d37d873f9931c2a115` |

Apart from this qualification, root status contains only the untracked approved spec and plan; their presence does not make this candidate a delivered source. Inspection found no dependency, lockfile, persisted schema, publication implementation, lifecycle, installed-skill, campaign, or historical recipe edit. The public addition is exactly `buildRegistrationCheckRevision(base, replacements): RegistrationPublicationAuthorityV2` and types `ResolvedAuthoredCatalogEntry`, `AuthoredReplacementCheck`, and `TargetCheckReplacement`; no general rehash or publication API is exported.

The helper validates/captures plain canonical inputs with private descriptor-only, proxy-refusing bounded traversal before cloning the supplied valid authority's compilation. It rejects accessors and proxy traps without invoking them, plus symbols, custom prototypes, sparse arrays, noncanonical scalars and cyclic/oversized input with field-specific contract errors. It selects existing applicable target IDs and **only** explicit replacement entry IDs, and refuses inconsistent ownership, identity collisions, invalid candidate metadata, mixed modes and unsupported unresolved candidates. It copies caller provenance, retains same-target siblings and target-level graph/coverage gaps and blockers, reconciles all resulting catalog unions, refreshes derived digests, and returns through the existing `buildRegistrationKnowledgeRevision` validator/builder. It performs in-memory computation only; it neither creates checks to execute nor reads or writes a workspace. The separate existing publication APIs retain stale-base, preview and write authority. `bindingReviewStatus: "reviewed"` is supplied by the caller, not independent attestation. Neither assignment metadata nor a manual handoff is PASS.

## Independent adapted-retained benefit comparison

Original low-level recipes were not edited or imported as executable entrypoints:

| Original root recipe | SHA-256 | Adapted included AST spans | Excluded scope |
| --- | --- | --- | --- |
| `evals/graph-consumer-agent-cycle/prepare.mts` | `a46062f3a9edc9091387260c31c014da34c60393cd06da7949b456383e98d6d2` | `buildCommonCompilation` lines 42–69, 83–88, 98–105, 111–160 | 70–82 invariant construction, 89 gap clearing, 90–97 invariant coverage, 106–110 substantive invariant definition, 168–188 requires relation, fixture publication |
| `evals/public-input-agent-cycle/regression.mts` | `40f397ff17965c43344d53546136a3cc751c413e1f7411960cc5a85effaa9dee` | `buildCatalogRegression` lines 47–69, 78–79 | 8–46 route validation/target discovery and substantive definitions, 70 gap clearing, 71–75 unrelated-target reason edits, 80–88 plan/blocker generation |

Both independent baseline comparators were deliberately adapted to the approved narrower semantics: replace exact named entry IDs rather than target-wide entries; preserve graph/coverage gaps, blockers, same-target siblings, and unrelated target reasons; use identical caller-owned check/edge/catalog/strategy IDs, oracle text, provenance, effects and coverage reason. API invariant/`requires` relation preparation, including a retained invariant gap, is identical common setup outside both measured fragments. Browser operations/assertions remain caller-owned substantive input; the test uses three explicit normal/boundary/empty definitions, **not** a replay of the historical eight browser cases. The retained comparators still assemble graph, catalog, coverage and strategy independently, call their existing independent digest projector, then the existing revision builder; neither calls the new helper.

The frozen measurement uses the TypeScript parser recursively on each selected function body: `ts.isStatement` except block/empty statements, plus mechanical object property/shorthand/spread initializers. It includes helper input mapping, wrappers and adapters. It excludes only common preparation, equal substantive definitions/expectations, outer function declarations, assertions and publication calls. Selected copied spans in `check-authoring-consumers.test.ts` are `helperApi` lines 101–112, `retainedApi` 116–151, `helperBrowser` 155–166 and `retainedBrowser` 170–206. No helper adapter is hidden outside those functions. This is a mechanical-assembly measure, not elapsed-time or agent-quality evidence.

| Adapted fragment | Statements | Mechanical initializers | Total units | Caller-owned four-model mutation/rehash sites |
| --- | ---: | ---: | ---: | ---: |
| API retained | 24 | 22 | 46 | 18 (graph 4, catalog 2, coverage 4, strategy 7, rehash 1) |
| API helper caller | 2 | 10 | 12 | 0 |
| Browser retained | 25 | 22 | 47 | 18 (graph 4, catalog 2, coverage 4, strategy 7, rehash 1) |
| Browser helper caller | 2 | 10 | 12 | 0 |

Substantive definitions remain API 1 vs 1 and browser 3 vs 3. The source relocation cost is visible: 384 physical helper lines, 671 pure-test lines and 254 comparison-test lines; physical lines are not the savings metric. The helper/test increase reflects side-effect-safe capture and is not credited as caller savings. Each adapted baseline and helper arm receives the same validated base/definitions, and the tests compare **full canonical V2 authority** without normalizing IDs, provenance, blockers or digests. Separate sentinels assert requirement/coverage-target nodes, a real reviewed `requires` relation, same-target sibling node/catalog/provenance, graph/coverage unresolved and blockers. A deliberately changed baseline oracle proves the equality test detects substantive divergence. This establishes benefit only for these adapted synthetic fragments, not unaided test design or an external product.

## First attempts, repairs and controls

All commands below used `components/kernel` as working directory. Task reports and the SDD [ledger](../../.superpowers/sdd/2026-09-27-d13-479-check-authoring/progress.md) retain the fuller first-output chronology.

- Task 1 first `./node_modules/.bin/vitest run tests/registration/check-authoring.test.ts` exited 1 with one failed test because the export did not yet exist; after implementation it exited 0 at 1/1. A genuine later order assertion RED was 1 failed/11 passed and repaired by preserving retained coverage check order. An ID-reuse case yielded 1 failed/28 passed and was repaired by removing the old check ID before append. Initial typechecks failed on new-source/test typing, then passed.
- Astra's first Task 1 review was **REVISE** for generated unresolved manual entries. The first review-repair run failed in fixture setup because observations were unsorted; after fixture correction the intended RED was 2 failed/13 passed (`inconsistent unresolved ownership`). A narrow ownership fix produced 15/15; added assurance/union controls produced 16/16 pure tests. The last Task 1 three-file suite passed 32/32 and typecheck passed. Astra rereviewed those source/test hashes and returned **GO** for bounded Task 1, not product acceptance.
- Task 2's first name-filtered offline publication test passed 1/1 with 13 skipped **by filter**; its first consumer run passed 2/2. Its first typecheck failed on a comparator-only indexed-array assignment; explicit typed filters repaired it. A pre-review combined consumer/knowledge run passed 16/16. The broken-comparator control and shared invariant/`requires` preparation then passed a fresh consumer 3/3. No baseline recipe or production helper was changed to force equality.
- Astra's first Task 2 review was **REVISE** on test evidence: retrying V1 after publication showed downgrade rejection, not a stale competing V2. The repaired offline test creates two distinct V2s from the same V1 base and pins both base digests; after publishing one, competing-V2 preview and apply with its earlier preview digest each reject with `REGISTRATION_PUBLICATION_AUTHORITY_MISMATCH`, with workspace bytes/inodes unchanged. A separate V1 preview remains a downgrade control. Repaired name-filtered runs passed 1/1 with 13 filter skips (latest duration 9.76 s); typecheck and diff-check passed. Those filtered skips are not represented as a zero-skip final gate.
- The coordinator's earlier five-file gates passed 49/49 before and after the competing-V2 test repair (durations 240.96 s and 243.06 s). The latter exact command was `./node_modules/.bin/vitest run tests/registration/check-authoring.test.ts tests/registration/check-authoring-consumers.test.ts tests/registration/catalog.test.ts tests/registration/strategy.test.ts tests/workspace/knowledge-revision.test.ts`, with 5 files passed, zero failed/skipped, no warnings shown. Both gates **predate the capture repair** and do not verify the two current Task 1 hashes above.
- Whole-slice Astra review then returned **REVISE P2**: the former `canonicalJson(input)` / `isDeepStrictEqual(input, copied)` capture invoked enumerable getters; an accepted getter mutated the caller's base. Sol's exact first focused `./node_modules/.bin/vitest run tests/registration/check-authoring.test.ts` exited 1 with **1 failed/16 passed (17)** on the accessor case. The private descriptor/proxy capture repair made that focused suite 17/17; an added cyclic/depth/member-bound control made it 18/18. The three-file pure suite (`check-authoring`, `catalog`, `strategy`) exited 0 at **34/34**, zero failed/skipped; typecheck and diff-check exited 0. Astra's scoped rereview of the repair is **GO, no remaining finding**. These are the current Task 1 source/test hashes; the other three candidate hashes stayed unchanged.
- On the current repaired candidate, the coordinator's exact `./node_modules/.bin/vitest run tests/registration/check-authoring.test.ts tests/registration/check-authoring-consumers.test.ts tests/registration/catalog.test.ts tests/registration/strategy.test.ts tests/workspace/knowledge-revision.test.ts` exited 0: **5 files passed, 51 tests passed, zero failed/skipped/warnings shown**; start 17:21:55 Bali, duration 312.32 s (transform 1.11 s, setup 0 ms, import 2.25 s, tests 309.17 s). Current `npm run typecheck`, `npm run build` and `git diff --check` each exited 0 without diagnostics/warnings or tracked generated-file drift. I did not duplicate the long run. All five hashes above were rechecked unchanged after it.

The pure tests cover API, multiple browser checks, manual handoff, exact subset preservation, malformed/foreign/duplicate IDs and fields, wrong binding/subkind, mixed modes, blank/unresolved oracle, candidate path/secret/effect policy, deterministic V1→V2→V2, unchanged input and failed-operation nonmutation, accessor/proxy refusal without caller-side effects, bounded capture, full strategy unions, gaps/blockers/`requires`, observed-target assurance non-upgrade, and a correctly rehashed dropped-blocker refusal through the old builder. The offline publication case checks no helper-time workspace mutation, exact persisted authority/four-model readback and `validateWorkspace.valid`, then the existing stale competing-V2 guards. It does not claim the pure helper detects persisted currentness.

## Disposition and limits

Independent Astra Task 1 and Task 2 rereviews were **GO** after their respective bounded repairs; Task 2's exact wording was “GO — Task 2 P2 repair resolves the finding. No remaining actionable issues.” Whole-slice Astra later returned **REVISE P2** for getter side effects in Task 1 capture; its scoped capture rereview is **GO with no remaining actionable finding**. The fresh five-file gate passed on the unchanged current hashes. **Recommendation at candidate review: adopt this exact bounded candidate for separately authorized source delivery**, not as a live-product or campaign result. Bundle/manifest/cold-source delivery has its own gates; the then-dirty checkout was not that delivery.

Remaining limits are explicit: the secret-union fixture is empty because the accepted registration profile projects no secret refs; retained nonempty effects/evidence are exercised. Comparison inputs are synthetic/adapted and omit historical invariant construction and route/operation execution from claimed savings. No blanket Kernel suite, browser, live product, account, tracker, installation, campaign migration, hosted CI, or W4/W6/W7/I10 acceptance is claimed. Agent-led design reliability and real-product blockers remain open in the canonical program plan.

## Local source-delivery follow-up — 27 September

The separately authorized local delivery commits the five reviewed Kernel files as
`7dd9265f846676d925cc084f3dcd8d8883364613` (tree
`04ccf2050fa651ef96f9772b215f3451c6fc0219`). Its complete-history,
sole-`HEAD` [bundle](../../sources/candidates/kernel-d13-479-check-authoring-7dd9265.bundle)
is 961,707 bytes, SHA-256
`c70da5bbe43a68cd724c61ca07c71041734be32e8458364ce7bf7d57320f3914`.
An independent bundle-only clone read back that exact commit/tree with clean
status, no `node_modules` or Git alternates, and `git fsck --full --strict`
passed. This is source portability, not a cold runtime test.

The first root packaging run after changing only the Kernel manifest entry was
**RED 61/62**: `tests/selected-pair.test.mjs` correctly rejected Console's old
`ece24e8` pin with `KERNEL_REVISION_MISMATCH`. The original failure is not
relabelled as a helper defect or erased by the later repair. The necessary
paired Console commit `58b02cd4878eb3a4e9213ade2a9d24af2e97d9a8` (tree
`c68e9a627620a71116bb86eadfb2d4c5ad6539a3`) changes only its embedded
Kernel pin and positive SHA references in six source/test/documentation files.
The A1 source-authority implementation and deliberate negative mismatch cases
remain unchanged. Its complete-history, sole-`HEAD`
[bundle](../../sources/candidates/console-d13-479-kernel-pair-58b02cd.bundle)
is 4,402,259 bytes, SHA-256
`5ea906f00a7ac2959bb6d1cb939124051f400a458d411c5016c77028c1a3319f`.

Console's first unfocused combined test invocation exited 1 with 9 passed / 11
failed because its required explicit `QA_STARTER_REPO` and canonical `TMPDIR`
were not supplied; that is an invocation/setup failure, not a silently green
first attempt. With the declared selected Kernel and owned fixture environment,
the scoped authority tests passed **25/25**, managed-pack/stalled-Git **5/5**,
and portable entrypoints **6/6**, all exit 0. Console `npm run typecheck`,
`npm run build` and `git diff --check` exited 0; build retained its existing
large-chunk warning. The tracked TypeScript build cache was restored byte-for-byte
after these checks, leaving only the six intended Console edits before commit.
The independently rerun root selected-pair test then passed **2/2**.

After both bundle/manifest entries were updated, `npm run sources:verify`
returned `sources_verified` for all four exact child pins and the root
packaging `npm test` passed **62/62**, zero failed/skipped/cancelled. Kernel's
separate fresh five-file gate on unchanged reviewed bytes passed **51/51** in
405.51 seconds, zero failed, with typecheck/build/diff-check exit 0. These
counts are offline source/packaging controls, not additive product coverage.
Independent Sol AQA reviewed the exact Console six-file pair repair, both
bundle/tree/digest entries, manifest and first root RED: **GO for bounded
source-pair semantics, no Critical/Important runtime finding**. Its first
documentation review requested correction of stale current/plan projections;
after the corrections, a separate docs rereview returned **GO, zero findings**.
The earlier independent Astra whole-slice GO covered Kernel candidate bytes;
no new architecture, schema, verdict or lifecycle design was introduced by
the Console pin change.

The first committed delivery root `07a034f08e7cda6ab334b38572ee296282f35984`
was cloned with `git clone --no-local --no-hardlinks` into a fresh directory
without components or dependencies. Its own `npm run sources:restore` and
`npm run sources:verify` both exited 0 and read back all four manifest pins;
its root `npm test` passed **62/62**, zero failed/skipped/cancelled (42.87 s).
Kernel and Console cold children each had the exact selected commit/tree,
clean detached worktree, child-local `.git`, no `node_modules` or alternates;
both `git fsck --full --strict` checks exited 0. This is a committed
source/packaging proof, not a cold dependency/build or product execution.
The final documentation-only root successor receives its own cold-source
readback before handoff. No push, installed-skill promotion, campaign
migration or product call has occurred.
