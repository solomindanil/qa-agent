# Read-only source-lineage audit — 20 September 2026

## Decision

Do not activate additional component pins as part of consolidation. Preserve two genuinely unselected Freeland source candidates as **inactive, unqualified archives**: the dirty failed→skip normalization/verdict repair and the committed auth-signup/reset diagnostic branch. Preserve the already delivered inactive planning-snapshot pair. The old dirty Console implementation is not lost work: every reviewed dirty source file matches an accepted historical Git blob exactly.

This audit does not authorize source integration, campaign migration, product execution, payment/email actions, installed-skill changes, deployment or publication. Only this report was written. No source, index, refs or worktree pointers were changed; no dependencies were installed. No live/browser/product tests were run.

## Identity, method and limits

- Canonical normal root: `/Users/danilsolomin/projectsnew/qa-agent`, inspected at `c65a8f540b31857033a6cb12e2bf4687755ebac4`, branch `codex/workspace-assembly`.
- Reviewed delivery: `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/root`, inspected at `48e9fc91177c4866e1e10e958fbfb6e93ac2d327`, branch `codex/p2-semantic-source-delivery`.
- Reviewed pins: Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`; Console `c421160a71c0679a357f29828029ec3550791d16`; Freeland `0ea2df10f1b6d613e01d50011c269ca0fa999877`; inactive reporting reference `10d398d8a077068c2184f33958e9b654a2f2947c`.
- At audit start the canonical manifest/restored Freeland was still `d4754f7ddbcb8183f695f479ef21aa7728c1ace0`. Canonical `npm run sources:verify` exited 0 and verified all four selected source trees. This result is not attributed to the later P2 Freeland pin.
- Read root AGENTS, manifest, current qualification, assembly and roadmap. Used bounded `.local` metadata discovery (up to depth four), component/package identity, Git HEAD/local-branch ancestry, changed path lists, exact file-byte comparisons, selected source diffs and existing source-qualification records. Pruned dependencies, campaign/account/session/evidence/runtime-state directories and product-source checkouts. Metadata discovery found 89 distinct identified source HEADs and a separate depth-three local-branch scan found 80 unique branch tips.
- Used process-local `GIT_ALTERNATE_OBJECT_DIRECTORIES` only to make two existing object stores readable to `merge-base`, `log` and `cherry`; no alternates file was written and no fetch/import/clone was performed.
- All 28 canonical `sources/candidates/*.bundle` files passed `git bundle verify` (exit 0). The P2 bundle is delivered separately in the reviewed root, not one of those 28 canonical candidate files at audit time.
- One six-case pure-module probe compared the current and dirty failed→skip classifiers. It did not invoke a test runner, browser, provider or campaign.
- This is bounded source preservation analysis, not exhaustive qualification of every scratch directory, dangling object, remote ref, private campaign artifact or broken historical worktree. Non-bundle dirty canonical-root files belong to the other reviewer.

## 1. Root branches and worktrees

All canonical local branches below are ancestors of both canonical `c65a8f5` and reviewed `48e9fc9`, except the explicitly historical self-contained-delivery branch:

| Local branch | Tip | Classification |
| --- | --- | --- |
| `codex/g2-evidence-routing` | `48bccef6996496d795874ef47ea11d0ae089237a` | Included ancestor; attached worktree clean |
| `codex/pre-reconciliation-20260911` | `48bccef6996496d795874ef47ea11d0ae089237a` | Same included ancestor |
| `codex/journey-adoption-20260914` | `e82e60096072a4630e7c8afff9d9e753d4dbbf33` | Included ancestor |
| `codex/postreview-source-integrity` | `7a0b8b546c007ff16508cf945af0559809b4ddaf` | Included ancestor; attached worktree has two untracked historical documents, not implementation |
| `codex/precloud-source-integration` | `787d3df963fe1ff71c80457a49753653e44505e7` | Included ancestor; attached worktree clean |
| `codex/reviewed-components-adoption` | `5ba9895bba13a83bae58c7df3db25a2f081fdfaf` | Included ancestor |
| `codex/self-contained-delivery-20260913` | `6842c82e1fb3255ddb6e0afc44d2a494e8cec5d0` | Five non-ancestor historical commits; no missing file among ten touched delivery paths |
| `codex/workspace-assembly` | `c65a8f540b31857033a6cb12e2bf4687755ebac4` | Reviewed-delivery ancestor |

The two untracked documents in `.local/worktrees/postreview-source-integrity` are `docs/qualification/post-review-correctness.md` and `docs/superpowers/plans/2026-09-07-post-review-dialogue-qa-plan.md`. Their presence is preservation metadata, not a claim of a missing implementation.

Historical self-contained-delivery commits are `a0b533e`, `650c79d`, `fc8c1e7`, `25aa2d1`, `6842c82`. Its README, portable getting-started document, product owner index and `freeland-maintenance-722bf1b.bundle` are byte-identical to reviewed delivery. Other touched paths exist and have evolved. Do not merge this old root wholesale.

Several isolated root candidates have different commit IDs because work was replayed/adopted. `git cherry` proves patch-equivalent inclusion for graph-consumer `1925d37/e88a25a`, mixed-handoff `62c06b3`, public-agent-cycle `5fb22a1/aae3ca4`, and reviewed-component adoption `a5635b8`. No source files are missing from the compared changed-path sets for P0 Console, P0 safe-CI, Freeland combined delivery, P1 pair, P1 skill-reference, P6 entry, QA-H003 adoption or self-contained delivery. Their source bundles/implementation and most evidence blobs match; manifest/current-entry/history documents differ through subsequent adoption. A `git cherry +` on those documentation-heavy candidates is not by itself missing runtime work.

## 2. Candidate bundles and actual integration

Twenty-four of the 28 canonical candidate bundle tips are direct ancestors/equal to the reviewed component pins. Four are not: Console `4fddb67`, Console `d272f31`, Kernel `a9378b2`, Freeland `510e08a`. Their local stores plus read-only alternate-object comparisons confirm genuine divergence (initial exit 128 in a pin-only store meant missing object, not a semantic result).

| Candidate | Actual disposition |
| --- | --- |
| Console `4fddb679f84619a7e8e7ac871efa84a1493cb5ed` | Adopted equivalently. All three changed files are byte-identical to current Console: `src/node/qa-campaign-files.ts`, `tests/unit/campaign-plan-concurrency.test.ts`, `tests/unit/fixtures/campaign-plan-writer.mjs`. The lock-reacquisition fix and regression are present. |
| Freeland `510e08a38565e8f8074d36d5f8eaa62d9d93bd7b` | Integrated as `0644108` onto readiness `aa1d0ae`, followed by `d4754f7` and P2. Current PAY01 oracle and manual-registry test are byte-identical to donor. Pure PAY01 test extraction is documented in current source adoption. Not missing. |
| Kernel `a9378b2d2da3874c101429880344bb2ccc296764` + Console `d272f31fa35f471a590681f0e20224382e3d02b5` | Intentionally inactive, tracked bundles retained. Actual generated registration-plan wording/vertical regression remain absent from current pins. See §3. |

The specifically requested three untracked bundles are valid source archives, not newly missing implementation:

| Bundle under canonical `sources/candidates/` | SHA-256 | Tip |
| --- | --- | --- |
| `console-p0-authority-bb9b739.bundle` | `b17d3b2dfaaa4b2af1a765e26e2b4e9cd81bbbf218c95e07f54590248b6379bb` | `bb9b739822d3302b525007949c2ee9854843bd5a`, ancestor of `d28d774` then `c421160` |
| `freeland-p0-pay-composition-510e08a.bundle` | `0fcde7d97b90d2a559c91fa48d49b290cc19723239fe4da8ac3c55b6f84e12da` | Divergent donor, equivalent integration described above |
| `freeland-pay-readiness-0644108.bundle` | `47e3ad82eb9266623f386eb7b8ed4f952b02b82d2ddcf20804d31bfddd57054a` | `064410869c2e63a4b7c23cc3753c717a337f8a3a`, ancestor of `d4754f7` then `0ea2df1` |

Retain these as historical/inactive archives if their old qualification documents link them. Do not select an older bundle as current or claim its old tests freshly executed.

Reporting reference `10d398d8a077068c2184f33958e9b654a2f2947c` remains divergent/inactive, with three reference-only commits not ancestral to active Kernel. It is deliberately preserved, not a substitute runtime.

## 3. Inactive planning snapshot — already safely delivered

`docs/qualification/registration-planning-snapshot-20260915.md` explicitly records independent approval and inactive status. Kernel changes two files; Console changes six files including the exact Kernel authority and registration/current-plan vertical test. Current `aa5d2d1` still renders `No CampaignPlan exists: planning begins after baseline approval` in the generated registration plan.

This is genuinely absent behavior, but adoption changes managed-view identity. The recorded old-registration probe failed with `MANAGED_SOURCE_STALE`, `PRIVATE_STATE_DRIFT` and `REGENERATION_JOURNAL_INVALID`. Preserve the tracked candidate bundles and the migration warning; do not revert the active observation pair to the old candidate pair.

- Kernel bundle SHA-256: `2169782e86bba4148975c0d899c042ad104cba7a16953522fd22d3f5df60edcb`.
- Console bundle SHA-256: `38f64e6ce311b2da9bfbac9da8b557debc6bacce7ed48b1330c996caf11584b1`.

Future integration must port the narrow change onto current Kernel, rebind Console to the new exact successor, requalify the pair and preserve frozen registrations. No additional archive copy is required today.

## 4. Missing candidate A — dirty failed→skip source

Priority: **P2 harness correctness/diagnostic retention**, not an observed false-green vulnerability. Current source fails closed on this shape. Candidate review/completion status was not established; preserve as unqualified work.

Exact source root: `/Users/danilsolomin/projectsnew/qa-agent/.local/failed-skip-repair-20260915.IMaQ8V/freeland`.

HEAD/base: `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`, an ancestor of current Freeland. No untracked files were reported. The seven dirty files are the complete patch scope:

| Relative file | Working-byte SHA-256 |
| --- | --- |
| `provenance/source-manifest.v1.json` | `e36ad11ad0fc82d196d26c28f831f68d863573a49536debbda9ac7afd76c6254` |
| `tests/freeland-main/provenance.test.mjs` | `dea634aff9d654d620f1da302dbe8aa51f5f4655ef3c15b809aa3e45cdf620c4` |
| `tests/freeland-verdict/freeland-verdict.test.mjs` | `1fdb5fdbb30bbc9e1cce3acc5ec760790c6b777bd669b0144abd90a7841c1313` |
| `tests/product-graph/freeland-desktop-retries.test.mjs` | `2868dd1e3127b651276fb07c38f96a301c7cdb6b8fc9a4f7682e486f21305106` |
| `tests/product-graph/freeland-graph.test.mjs` | `5d598a9de77cf0342e36bfb3b8741fc736e0e08e9d6e0bcec574eef088de8e13` |
| `tools/freeland-graph/automated-results.mjs` | `419d6f305821c50910fa8e4dbce6f8b44f477d1b401765df2b0545e445df9063` |
| `tools/freeland-verdict/model.mjs` | `1029cbd2443968ec78422bf4b015204e678a819e240720c55e61a0b61ab27659` |

Exact `git diff --binary HEAD` patch SHA-256 at audit time: `b2edd75079b7a8b47f6be2c35454e581566f323ae77e20d3d431935f9dfae4ef`.

The patch recognizes a retry that changes `expectedStatus` to `skipped`, retains both attempts and the `flaky` source outcome, and prevents skip/config exemptions from accounting for the earlier failure. Those classifier/model additions are absent at `0ea2df1`. The current automated-results file is byte-identical to the candidate base, so this is not a superseded equivalent implementation.

Fresh, dependency-free observable control:

```js
const row = {
  expectedStatus: "skipped", sourceOutcome: "flaky",
  attempts: [{ retry: 0, status: "failed" }, { retry: 1, status: "skipped" }],
};
derivePlaywrightOutcome(row); // both versions: "flaky"
classifyAutomatedObservation(row);
// reviewed 0ea2df1: throws AUTOMATED_OBSERVATION_INCONSISTENT,
//                  reasonCodes ["FLAKY_RESULT"]
// dirty candidate: "skipped"
```

Ordinary one-attempt skip and healthy one-attempt pass classify identically in both versions. These six observations are the only fresh runtime probe in this audit. The verdict safeguards were source-reviewed, not newly executed. Do not adopt the classifier alone: its paired verdict guards and regressions are part of the candidate's safety intent.

Safe preservation: archive the exact seven-file binary patch with base SHA, patch hash, per-file hashes and an explicit inactive/unqualified README. A patch against this existing accepted base preserves the missing work without copying the whole runtime. Do not copy old provenance rows wholesale onto current source during any future integration; regenerate through the owning process.

## 5. Missing candidate B — committed controlled-auth diagnostic branch

Priority: **P2 candidate preservation/requalification**. No live current-product failure was established, and changing this lane alters authorized effects.

Exact source root: `/Users/danilsolomin/projectsnew/qa-agent/.local/auth-signup-reset-20260915.Jb7sMm/freeland`.

Branch: `codex/auth-signup-reset-diagnostic`; HEAD `43b025c8a79b743c7afde5fe18695d6b7b54a5d8`. Merge base with reviewed Freeland: `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`. The reviewed side has ten commits beyond this base; the candidate has four:

1. `aa3ff44c1b2d41ef7f893863593a732a94d3547c` — diagnose recovery from existing signup.
2. `3636fc018e7b740d52b00ebf43683e4e3095e3f8` — guard recovery entry mutations.
3. `820d30835d918dae30d6bd56fc5ebc41b1fcc685` — order held recovery waiter safely.
4. `43b025c8a79b743c7afde5fe18695d6b7b54a5d8` — retain safe recovery setup failure diagnostics.

Exactly nine committed paths differ from the base:

- `provenance/source-manifest.v1.json`
- `tests/freeland-controlled-password-recovery/tc-vhod-05.spec.ts`
- `tests/freeland-main/provenance.test.mjs`
- `tests/freeland-replacements/tc-vhod-05-evidence.test.mjs`
- `tests/freeland-replacements/tc-vhod-05-ui.test.mjs`
- `tests/freeland-verdict/freeland-campaign-cli.test.mjs`
- `tools/freeland-replacements/tc-vhod-05-evidence.mjs`
- `tools/freeland-replacements/tc-vhod-05-ui.mjs`
- `tools/freeland-verdict/campaign-cli.mjs`

Actual implementation adds guarded existing-signup→reset UI entry, held-mutation/response ordering, recovery-message meaning, allowlisted setup diagnostics and an external-email budget increase from **2 to 3**. Both current helper modules (`tc-vhod-05-ui.mjs`, `tc-vhod-05-evidence.mjs`) are byte-identical to this branch's pre-four-commit base; the new helpers/diagnostic export are absent, not replaced by an equivalent successor in those files. Current controlled test still calls its older local `requestPasswordReset` and accepts any first returned mailbox message before later parsing. Source absence is proven; current live desirability/acceptance is not.

The source root has one dirty **private runtime graph**: `docs/local/freeland/product-graph/current/graph.json`. Its content was not inspected and must not be captured from the working directory. Preserve committed source only, ideally a HEAD bundle (or exact four-commit source patch with the known base), plus an inactive/unqualified index. Do not include that dirty graph, accounts, sessions or campaign receipts. Later source review must reassess current UI intent, mutation guards, effect reservation and fixtures before any controlled recovery run.

## 6. Dirty historical implementation already included

### Freeland QA-H003 preservation

Root `.local/qa-h003-fix-20260915.FppuIJ/freeland`, HEAD `f11af2cbd3e39b697aca01648fe9f9b2531970ae`, retains many dirty tracked source files and ten untracked tests/helpers. All inspected non-private implementation files are either byte-identical to current `0ea2df1` or byte-identical to accepted historical `377354b2ad8d98c5efe104919b41ed5d7a93352e`. The latter twelve are the registry, provenance test, app/auth/helpers/products/PWA/sections tests, smoke oracle tests, desktop-contract test/helper and PWA-upgrade fixture. No missing implementation found in that scope. Private `docs/local` graph/manual files were not compared; do not import them.

### Console preservation map

Both roots below are based on accepted ancestor `6dfef30406b884801d2060e2233c01b0d0b32a1c`:

- `/Users/danilsolomin/projectsnew/qa-agent/.local/worktrees/console-finding-learning`
- `/Users/danilsolomin/projectsnew/qa-agent/.local/worktrees/console-qa01-continuation`

Accepted exact-blob locations:

- `dd277140b2440fd9c8231a1932a3e87670fb3518`: all seven common dirty paths below.
- `784eda092c566fad0db0f1e4b25ff56b07bddd22`: finding-learning's public fixture and public-authored regression.
- `049e5165335bd720c7028700162911eb9e1b8b9b`: qa01-continuation's human-help, Nuanu-authored and vertical regressions.
- Current `c421160`: both untracked `tests/unit/campaign-observation.test.ts` are byte-identical to the tracked accepted file.

| Relative path | Working-byte SHA-256 | Applies to |
| --- | --- | --- |
| `server/campaign-receipts.mjs` | `fcbf4a11df9852268fd3f6927382dc1d99f4a60a9ae5f9448be0653daa3bce7c` | Both; `dd27714` |
| `skills/qa-product-v0/references/declarative-campaign.md` | `bf717624b99effc8b7b66af673c0e9208bea649e4d9a6fd0ec5c446e115b6c6a` | Both; `dd27714` |
| `src/lib/qa-campaign-v0.ts` | `29d7d0d8972cb59132b7f82f7993ae1f40b3d789965d6afb05fb0b1cc94520e4` | Both; `dd27714` |
| `src/node/playwright-campaign-adapter.ts` | `a4104c9622c0e64afd4b360574a1ce9cd4af35e1c0abf0d4fe8a64ea245080d1` | Both; `dd27714` |
| `src/node/qa-campaign-runner.ts` | `cbb2ec9e381ca7b5fad063a037b4e6e532d84137cfd5640014d8a69d8765e245` | Both; `dd27714` |
| `tests/unit/campaign-receipt-ingestion.test.ts` | `a9ecd0a922d91ac70ea7b95a70c27e235cf9aafd2574c9478718cbbc23386aa2` | Both; `dd27714` |
| `tests/unit/qa-campaign-runner.test.ts` | `8dc95f3a83643eb4417833415ee20bab3c9e48a254167f42492b0c9793176d45` | Both; `dd27714` |
| `tests/unit/campaign-observation.test.ts` | `643a6289a842c9a08ddc674dbc26b809accefad3e9be6402767d87f1a7316640` | Both; exact current |
| `tests/fixtures/public-auth-readonly/fixture.ts` | `211e24337ea8cacd33c98df6e8ee63e6ca34a16b2e49af41fbf5cffb1526e7be` | Finding-learning; `784eda0` |
| `tests/unit/public-auth-authored-revision.test.ts` | `e8b3080bf4121d13c00c7d33cf2e6020fbb3b075457cfce8cc4750a40f58616b` | Finding-learning; `784eda0` |
| `tests/unit/human-help-continuation.test.ts` | `6055a60e6f5c1fd38cdb4b39c0f9c76f4a3d280ae35bbb1c9bb79b0df7cd7dd9` | Qa01-continuation; `049e516` |
| `tests/unit/nuanu-authored-revision.test.ts` | `de57b9e3f7ae11c01b526055903b7d2f7d9da3e97674398f75732a0d2e6464a6` | Qa01-continuation; `049e516` |
| `tests/unit/qa-campaign-vertical.test.ts` | `a7af22b00c297c712e7a374d3ac8f8b888e7837a9c867a420ae85b156dd59b9a` | Qa01-continuation; `049e516` |

Whole tracked dirty patch hashes (exclude the separately listed untracked observation test): finding-learning `111b54cd3503f414a299195844fbe146c6a57148d7692f7bf885ec83bc48debb`; qa01-continuation `e39427e3b690ab304753f3ff0355ea725aa3d508ea0e189d1828836c867d632e`.

Keep this map; copying entire obsolete runtime directories is unnecessary. Do not reset/delete the original user worktrees as an inferred cleanup step.

## 7. Explicit unknowns / non-adoption items

- Broken historical `.git` pointers: `.local/browser-journeys-20260914/console`, `.local/ticket-acceptance-20260912.iZ6GY8/freeland`, and `.local/worktrees/freeland-{cancel,oracle-readability,price-currency,runtime-pool-binding,wrapper-settlement-repair}`. They point to no-longer-existing worktree metadata under replaced component Git stores. An empty `git status` stdout on these paths is **not clean-source evidence**; the command fails. No pointer was repaired. Their complete working bytes/unknown local changes remain unqualified and preserved in place.
- Several cold/source-stat fixture roots have no commit HEAD. They are packaging test artifacts, not established successor branches.
- `.local/campaign-interruption-20260913.CncLuS/console/tests/probes/campaign-interruption.mjs` is untracked diagnostic source. This audit records its existence only; it is not established as missing accepted functionality and was not executed.
- Active-runtime graph dirt in preserved Freeland runtime roots was inventoried by path only and deliberately excluded from source reuse.
- Fresh qualification of auth recovery, the full failed→skip verdict matrix and inactive planning-pair migration was not performed. Their historical/current acceptance must not be inferred from this lineage audit.

## Bounded consolidation recommendation

1. Retain/adopt only the already reviewed root `48e9fc9` and its selected four pins through the coordinator's existing consolidation workflow.
2. Preserve the three valid historical untracked bundles with their existing qualification links and inactive status where needed.
3. Archive the exact failed→skip seven-file patch and the auth branch's committed source, with the explicit bases/hashes/scopes above. Retain them as backlog candidates, not runnable/current skills or new pins.
4. Preserve the planning-snapshot pair through its existing tracked bundles and migration caveat.
5. Retain exact historical Console blob mapping and the original worktrees; do not recopy runtime state. Keep broken-pointer paths as an explicit later forensic scope, not a claim that all local source bytes have been qualified.

This yields a self-contained checked source plus honestly preserved candidate backlog. It does not claim every historical mechanism should be activated, nor that broad QA/product coverage is complete.
