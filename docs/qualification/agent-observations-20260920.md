# P1 agent-authored observations — source adoption

Date:20September2026. The reviewed bounded source pair is now adopted in the canonical root by local commit `d4d8b29`. This is source adoption, not a product release or full P1 completion. No active campaign, managed registration, installed skill, product, tracker, payment or cloud state was changed. The candidate-phase evidence below retains its original attribution.

## What works in this slice

The existing Kernel can store a bounded text/JSON observation against an exact published check, target and oracle, and read it in a fresh process. The existing Console CLI and Coverage view consume that channel. All current targets remain visible, including those with no observation; contradictory observations remain separate. Safe historical, malformed, altered and incomplete records are explicit diagnostics. Unsafe paths or failed reads mean unavailable history, not an empty successful history.

The stored claim is always `agent_authored_unattested`. Digests establish byte integrity and declared bindings, not actual tool invocation, capture-time truth, deployment identity, business expectation correctness, managed PASS or release GO. Existing managed receipts, coverage accounting and verdicts are unchanged. This reuses the current publication, private store and Console; there is no new memory service or executor.

Payloads are bounded at64KiB; CLI's64KiB envelope is stricter. Only `attachments: []` is supported. Secret scanning is not a general privacy guarantee. The two stored files are individually atomic, not a filesystem transaction. Identical retries reconcile without repeating the product action; conflicts refuse. Reader consistency checks are optimistic, not an atomic hostile-filesystem snapshot claim.

## Candidate sources

- Kernel base185d3e72309a4362db57cf2e805d1c00a5035909 → ce9f3760208febaf2279a28ae85549322a26f8af → **aa5d2d188606cbcf7e3111c130347a36970ec786**; tree26c649acb36dae2739e00af0c8baee142ecfd569. Kernel bundle `sources/candidates/kernel-agent-observations-aa5d2d1.bundle`, complete history, soleHEAD, SHA256195841c00d83fed459635c418d15b8c584ae8c15a14e0a53a158aa20250ecf17.
- Console base d28d7743e9aac370a726df6c6288ad2ef0e52c78 →5bbac51f66e0bc992db357711e94db57c4f76819 → **48e4628f91569c4cf96d0e616cbe6e29ec31baee**; treec206065e990329e52293801e3da10c2d5226cbd8. Console bundle `sources/candidates/console-agent-observations-48e4628.bundle`, complete history, soleHEAD, SHA2560098a517eaa20960772deec601cd9ff84eab0cc9267dc4b5767f76d74bd247c8. Lead AQA task review approved after the exact check-set and diagnostic kind/code fixes; bundle-size Minor deferred. Whole-pair review remains a separate delivery gate.
- Freeland3ee1cb3 and inactive reporting reference10d398d are unchanged. The reference was not activated.

Console pins the exact candidate Kernel; README and three literal-pin test consumers move together. Package manifests and lockfiles are unchanged. Builds/tests used ordinary copied existing local dependencies under identical lockfiles, Node22.23.1. This is not cold dependency reconstruction or a fresh registry qualification.

## Fresh checks and limitations

| Check | Result and scope |
| --- | --- |
| Kernel observation tests |13/13 after review fixes; complete-owner final-read control separately1/1 |
| Console5bb focused tests + real paired fixture |66/66; nofail/cancelled/skipped;161931ms, before final projection fix |
| Console48e final projection/mapping/bridge |63/63; nofail/cancelled/skipped;9553ms |
| Console48e actual paired fixture repeat |1/1; nofail/cancelled/skipped;105921ms |
| Console5bb pin/fixture/replace-ref/Git-timeout controls |22/22; nofail/cancelled/skipped; source pin unchanged in48e |
| Kernel typecheck/build; Console nonincremental tsc, changed UI lint, build |Exit0 |
| Build warning |Final Console minified JS573.46kB,gzip161.57kB exceeds500kB recommendation; not suppressed |

Earlier Kernel implementation also passed selected private-store56/56 and knowledge-publication13/13 before the narrow review fix; those unchanged heavyweight suites were not rerun or presented as fresh full gates. Console's unchanged bounded review-stdin controls15/15 passed before the pin move. Full Kernel/Console suites, complete managed-pack portability, visual browser testing, dual-host/cloud behavior and live product acceptance were not run in this slice.

The real paired fixture uses public registration/publication, an owned loopback HTTP server, actual CLI subprocesses, actual default bridge/runtime and Coverage SSR. A is fetched once, saved, read in a fresh process, and retried without a new request. B remains not_observed. Independent C executes; total HTTP requests are exactly two. The current graph, coverage, catalog and strategy files remain byte-identical; no campaign directory is created. This is an executable integration test, not evidence from a customer product.

Two review findings were fixed with RED/GREEN controls: stale publication with an unchanged strategy is historical, and final report reads recheck artifact bytes for every complete owner, including malformed/altered ones. Separate Lead AQA re-review approved both. The first combined Kernel run timed out one default10s fixture (12/13); explicit60s fixture budgets produced13/13 without assertion weakening. Console's first new-pair run correctly rejected a test manifest built with the wrong semantic hashing helper; the fixture now calls the public helper. No validation was relaxed to obtain GREEN.

Portable evidence lives in [evidence/p1-agent-observations-20260920](evidence/p1-agent-observations-20260920/): final raw logs and Kernel review. Test source is in the exact component history. Machine-specific paths printed in logs are historical provenance, not required runtime dependencies.

The source archive explicitly tracks the named sanitized fixture/test stdout logs despite the repository-wide log ignore rule. Their captured trailing whitespace/blank lines are intentionally retained: an all-file `git diff --check` flags those log bytes. Code/document checks excluding only this exact evidence-log subtree pass. This is a formatting exception for stored output, not a suppressed code/test failure or a global ignore-policy change.

The final Console projection fix was separately RED6/8 → GREEN63/63 and accepted in scoped re-review. Every target, including not_observed, now requires the exact duplicate-free catalog check-ID set; a diagnostic kind cannot contradict its code. The fresh paired repeat on these fixed bytes passed. No inherited66/66 count is relabelled as a fresh68-test run.

## Source-delivery checks in isolation

Both complete-history bundles passed Git verification and restored independently at the exact commits in normal Git directories, with no alternates and no node_modules. Git fsck and clean status passed for both. The cold Console's standalone source-authority controls passed7/7 against its sibling Kernel. This is source portability, not cold dependency or browser/runtime qualification.

The isolated root manifest selects this exact pair and leaves Freeland/reference roles unchanged. Its source verifier passed for all four components, and root packaging tests passed61/61,0fail/cancelled/skipped. Old bundles remain. Whole-pair code review is approved; canonical source selection and its readback remain pending.

A separate normal `git clone --no-local` of delivery commit `c6722935e4076461d329c35921e8ca59e662f613` restored all four components through its own `sources:restore` entrypoint and passed `sources:verify`. Its root packaging suite passed61/61,0fail/cancelled/skipped,39562ms; root status stayed clean. Raw output: `evidence/p1-agent-observations-20260920/cold-root-61.log`. Later documentation commits do not change these source pins or delivery code. This is a fresh source-only cold-root gate, not dependency installation or product execution.

## Remaining acceptance

1. Whole-pair code review is now approved, Critical0/Important0 and the documented nonblocking bundle warning. It is a separate internal Lead AQA context, not an external human audit; it does not itself approve root packaging/adoption.
2. Canonical paired selection/readback is complete: see the execution record below. Root delivery metadata received separate independent approval before the source switch.
3. A separately authorized non-fixture consumer before claiming ordinary product-work acceptance. No migration of existing campaign owners follows source selection automatically.

## Canonical adoption execution record

The separate delivery metadata review approved the exact20-path source package with no Critical/Important findings. Both previous component identities remain in named local preservation refs; old bundles remain available. Kernel and Console switched without force to the exact reviewed pair; Freeland and the reporting reference did not move.

Fresh canonical gates after the switch:

- `npm run sources:verify`: all four exact source identities verified, repeated immediately before commit.
- Root `npm test`:61/61,0failed/cancelled/skipped,35530.91625ms.
- Console with explicit `QA_STARTER_REPO` pointing to the selected sibling, `node --import tsx --test --test-concurrency=1` on agent-observation-view, agent-observation-bridge, kernel-replace-authority and kernel-fixture-authority:30/30,0failed/cancelled/skipped,48306.350584ms.
- Before commit: exact staged20-path/blob match to reviewed candidate root `a593dfefe21baeb2c9e8dc9f37107cb6fc2e4456`; all37 pre-existing dirty files preserved by SHA256, with only the intended new current-checkpoint prefix excluded from that comparison. Existing changes in current.md remain unstaged.
- Code/document diff-check passed with only the previously disclosed exact stdout-log subtree excluded.

Two controller mistakes were caught before commit: the first transfer omitted13 evidence files and one later tool-output copy truncated a review; exact byte comparisons refused both, and final staged/working evidence matches the reviewed originals. An initial Console invocation omitted the TypeScript loader and explicit Kernel path, so10 entries failed at startup/preflight; the corrected documented invocation passed30/30. Neither incident required test/code weakening; the failed commands are not product failures or passing evidence.

The source switch preserves existing lockfile-matching dependencies; it does not qualify a cold dependency installation. Root packaging and fixture controls do not replace the pending real-product consumer. No push, live requests, new purchases, tracker messages, installation or deployment occurred.
