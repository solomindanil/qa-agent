# D13-479 Check Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Preserve the user-selected Astra architecture/review and Sol implementation split. No SuperSkill.

**Goal:** remove repeated, error-prone four-model assembly from two bounded existing-target authoring consumers without changing authority or QA verdicts.

**Architecture:** one pure Kernel `buildRegistrationCheckRevision` replaces explicitly named existing catalog entries with caller-authored resolved checks. Existing contracts and `buildRegistrationKnowledgeRevision` validate the result; existing preview/apply/readback remains a separate publication boundary.

**Tech Stack:** current Node.js/TypeScript, Vitest, existing Kernel contracts/projectors and Git bundle source delivery; no new dependencies.

**Spec:** [approved corrected design](../specs/2026-09-27-d13-479-check-authoring.md). Read it completely before execution. Its types, scope and preservation rules are normative; this plan does not reopen the earlier target-wide/gap-clearing proposal.

**Execution record:** The checkboxes below preserve the prospective task order, not current status. The [dated qualification](../../qualification/d13-479-check-authoring-20260927.md) records actual first attempts, repairs, focused results, independent reviews and the separately authorized local source-delivery follow-up. Do not rerun a task merely because its historical plan checkbox is unmarked.

## Global Constraints

- Architecture/review: Astra; implementation and local verification: Sol. No SuperSkill.
- Node >=22.12.0; retain existing component dependencies and lockfiles. No implicit installs.
- No product calls, browser execution, account access, tracker writes, financial actions, deployment, installation or campaign migration.
- Helper effects: in-memory computation only. Tests may use owned local temporary workspaces and existing offline publication APIs.
- No new persisted schema, schema registry entry, DSL, runner, CLI, automatic verdict or publication API.
- Source, installed skills and frozen campaign runtimes remain separate. Passing these controls is not product PASS or W4/W6/W7/I10 acceptance.
- Preserve original attempts and independent baseline implementations; do not rewrite historical consumers or qualification results to manufacture agreement.

## Review Focus

- A same-target sibling not named for replacement survives with its evidence/source metadata; Task 1 pins subset replacement and collision refusal.
- A resolved replacement must not clear target-level discovery gaps; Task 1 pins all graph/coverage unresolved and unrelated strategy oracles.
- One target cannot mix retained manual checks and new automated checks; Task 1 pins refusal without widening replaceEntryIds.
- Strategy unions include retained entries requiring different secrets/evidence/effects; Task 1 pins full union, not replacement-only union.
- A valid in-memory base may be stale on disk; Task 2 pins existing preview/apply rejection without claiming that the pure helper reads current state.

---

## Preflight and file map

Baseline root: `1305fb7bf873d011849525b722bcf164dfeced45`; Kernel `ece24e865f7ea37cff32c24c7e3739c9d0059f81`; Console `5634b7f456999a967cc64704c58f7d6e040f0e57`. Resolve current root/child status and any concurrent owner before writes. Do not overwrite unrelated changes.

Root command: `npm run sources:verify`. Expect all four manifest sources verified before implementation; modified implementation bytes will later require their own reviewed delivery, not a false clean-source claim.

Read owning sources: Kernel `src/kernel/knowledge-revision.ts`, `workspace-blueprint.ts` authority/builder, `workspace-regenerator.ts` preview/apply, `registration-compiler.ts`, contracts `product-graph.ts`, `coverage-registry.ts`, `test-catalog.ts`, `test-strategy-draft.ts`; tests `tests/helpers/knowledge-revision.ts` and `tests/workspace/knowledge-revision.test.ts`. Read the two retained root recipes and Console rehash fixture referenced in the spec.

Implementation-owned files:

| File | Responsibility |
| --- | --- |
| `components/kernel/src/kernel/registration-check-authoring.ts` (new) | Pure input validation, exact replacement, coordinated assembly, private rehash and existing builder call |
| `components/kernel/src/index.ts` | Export the function and three input types from the spec |
| `components/kernel/tests/registration/check-authoring.test.ts` (new) | Pure positive/negative/preservation controls with deterministic offline inputs |
| `components/kernel/tests/registration/check-authoring-consumers.test.ts` (new) | Two independent adapted retained-fragment comparisons and measurement inputs |
| `components/kernel/tests/workspace/knowledge-revision.test.ts` | One bounded helper-to-existing-publication integration case |
| `docs/qualification/d13-479-check-authoring-20260927.md` (new, only after results) | Exact source/results/first attempts/consumer measurements/limits and review disposition |

Do not edit existing schemas, historical recipes, Console fixture helpers or the publication implementation. If a required repair crosses that boundary, stop for Astra design rather than silently widening this plan. Do not commit or push as an automatic task step; the coordinator owns separately authorized source delivery.

### Task 1: Pure exact-entry authoring with preservation controls

**Files:** new Kernel implementation and pure tests; Kernel index export.

**Interfaces:** consume `RegistrationPublicationAuthority`, `TestCatalogEntryV1`, `StableId`, current semantic projectors and authority/build validators. Produce exactly `buildRegistrationCheckRevision(base, replacements): RegistrationPublicationAuthorityV2`, `ResolvedAuthoredCatalogEntry`, `AuthoredReplacementCheck`, `TargetCheckReplacement` as written in the spec. No alternate overload accepting arbitrary compilation edits.

- [ ] Write the first failing test, `replaces named API entries and preserves same-target siblings`. Build a deterministic offline valid authority with one selected target containing two resolved automated checks and another target. Replace only one entry ID. Assert old unselected check/catalog/proposal are unchanged, new binding is singleton/matching-subkind, denominator and all requirements are equal, and the source authority's canonical bytes are unchanged. An absent export is a source implementation RED, not a reproduced product bug.
- [ ] Run `./node_modules/.bin/vitest run tests/registration/check-authoring.test.ts` from `components/kernel`; retain the first RED output and exact argv/source. Missing dependencies stop only execution; do not install implicitly.
- [ ] Implement the exact API/types in `src/kernel/registration-check-authoring.ts` and export from `src/index.ts`. Follow the spec's algorithm: named-entry removal, all-retained-plus-new reconciliation, no gap clearing, complete unions, private digest refresh and existing builder. Keep runtime shape validation strict and errors field-specific using existing error codes. No general-purpose mutation callback or exported rehash API.
- [ ] Re-run the same test; require GREEN before extending behavior.
- [ ] Add healthy tests `authors multiple browser checks`, `authors a manual handoff without execution evidence`, and `accepts V1 and consecutive V2 bases`. Assert exact supplied oracle/provenance/IDs/effects, unchanged target semantics, no PASS/receipt fields, deterministic same-input digest and frozen output. Run them RED first where behavior is absent, then minimally complete implementation and rerun.
- [ ] Add parameterized refusal tests named `rejects malformed or out-of-scope replacements`: unknown/foreign replacement entry; unknown target; empty/duplicate IDs; multi-target catalog; reused retained check/edge/catalog/strategy IDs; blank/unresolved oracle; unknown input fields; non-applicable target; incompatible retained unresolved candidate; retained/new mixed mode; invalid candidate path; undeclared secret; prohibited effect. Assert failure with specific relevant existing error code/explanation and exact unchanged input. Assert generated check subkind equals target subkind; an otherwise invalid base with wrong check subkind is rejected before mutation.
- [ ] Add preservation test `retains gaps blockers requires and complete strategy unions`. Include graph unresolved, selected and unselected coverage unresolved, two blockers, a reviewed journey-to-invariant requires edge, another target and same-target retained entries. Assert graph/coverage unresolved exact equality; strategy oracle removal **only** for explicitly replaced entry IDs; every unrelated strategy oracle unchanged; all blockers/capability decisions unchanged; all resulting catalog unions match strategy. Compare nonselected coverage excluding only derived freshness bindings. Do not upgrade provenance or change stale flags to pass.
- [ ] Add tests `does not mutate on partial failure` (valid first replacement, invalid second) and `rejects a correctly rehashed dropped-blocker proposal through the existing builder`. Keep the independent old rehash helper for the tampered proposal; do not use the new function as its own oracle.
- [ ] Run the focused pure suite plus `tests/registration/catalog.test.ts` and `tests/registration/strategy.test.ts`; require zero failed/skipped controls. Record each first failure and repair; do not relax assertions or budgets. Run `npm run typecheck`.

### Task 2: Existing publication boundary and independent consumers

**Files:** existing Kernel knowledge-revision test; new consumer-comparison test. Historical sources remain unchanged.

**Interfaces:** consume Task 1's exact function and existing `previewRegistrationPublication(workspacePath, authority, dependencies)`, `applyRegistrationPublication(workspacePath, authority, previewDigest, dependencies)`, `validateWorkspace(workspacePath, dependencies)`. Produce offline readback evidence and two bounded mechanical-assembly comparisons, not another runtime API.

- [ ] Add `publishes a check-authoring revision through existing preview apply readback` using the existing offline knowledge fixture. Derive input from its exact existing target/entry IDs; no network callbacks. Before helper invocation record input/workspace bytes. After invocation assert workspace bytes unchanged. Separately preview/apply and assert exact persisted authority and graph/coverage/catalog/strategy against returned compilation, unchanged blockers/unresolved/denominator and `validateWorkspace.valid === true` with exact publication digest.
- [ ] In the same bounded fixture retain an old base/preview, publish the accepted revision, and prove the existing publication path rejects the stale old revision/preview without workspace drift. Do not assert that the pure helper itself detects persisted currentness. Retain RED if an integration defect is found; change only the helper unless a separately reviewed owning repair is required.
- [ ] Freeze two independent low-level assembly comparators in `tests/registration/check-authoring-consumers.test.ts`: API existing-target fragment from root `evals/graph-consumer-agent-cycle/prepare.mts`; browser existing-target fragment from root `evals/public-input-agent-cycle/regression.mts`. Record exact baseline source hashes/ranges and all adaptations in comments/qualification. Do not import the executable recipe entrypoints or start servers. Copy only the bounded mechanics required for the comparison; preserve original files.
- [ ] Make the comparison fair: feed both arms identical validated base/IDs/oracles/provenance/effects. In **both** baseline comparators explicitly adapt historical target-wide removal to exact replacement IDs, retain graph/coverage gaps and exclude unrelated-target reason edits. Prepare any new invariant/relations once outside both measured fragments. Label this adapted-retained comparison, not historical replay. Preserve the old independent projector/digest cascade on the baseline side.
- [ ] Add one API and one browser comparison test asserting canonical **full authority equality** and separate sentinel invariants for requirements, same-target sibling checks, gaps, blockers and provenance. Do not drop identity/digest fields or normalize away differences. Existing source examples mostly use declared target assurance; use identical declared inputs for equality and retain separate non-upgrade tests from Task 1.
- [ ] Measure both fragments with the existing TypeScript parser: recursively count statement nodes inside the selected function body (`ts.isStatement`, excluding blocks and empty statements), plus object property/shorthand/spread initializers that perform mechanical metadata/binding assembly. Count those two columns and their sum; list every included/excluded source span. Exclude the outer comparison function and identical substantive check definitions/expectations from both arms, but include helper-arm input mapping/wrappers/adapters. Separately count mutation/rehash sites for graph/catalog/coverage/strategy; record common preparation and implementation/test size separately. Fix boundaries and common-input exclusions before viewing the result; retain before/after snippets. Require fewer total mechanical units in **each** fragment and zero caller-owned cross-model mutation/rehash sites in the helper fragment. No scoring tool is shipped. Do not claim a speed or agent-quality improvement from compute milliseconds.
- [ ] Run the consumer test and offline integration file; preserve raw first outputs and exact pass/fail/skip denominator. If equality requires widening scope or the benefit gate fails, stop/no-adopt instead of adding another abstraction or replacing the original trials.

### Task 3: Focused acceptance and bounded handoff

**Files:** the new qualification record; implementation/test files only for concrete review findings. Coordinator-owned delivery files are not implicitly changed by this plan.

**Interfaces:** consume Tasks 1–2 outputs and recorded controls; produce exact-source review package and explicit adopt/no-adopt recommendation.

- [ ] Run from `components/kernel`:

```sh
./node_modules/.bin/vitest run tests/registration/check-authoring.test.ts tests/registration/check-authoring-consumers.test.ts tests/registration/catalog.test.ts tests/registration/strategy.test.ts tests/workspace/knowledge-revision.test.ts
npm run typecheck
npm run build
```

Expected: all selected tests pass, zero failed/skipped, typecheck/build exit 0. Record warnings and generated-file changes without overwriting unrelated work. No blanket suite, browser/product call, install, retry substitution or timeout relaxation.

- [ ] Independently inspect exact diff and public exports. Confirm no dependency/schema/publication/lifecycle/installed-skill/campaign edits; no hidden gap clearing; no broadened selection; helper is pure; retained fragment baselines do not call it. Give Astra/AQA exact sources, failed-first records, controls, comparison counts and limits. Address only concrete review findings with focused RED/GREEN.
- [ ] Write `docs/qualification/d13-479-check-authoring-20260927.md` with source IDs/diff boundary, original probe attribution, exact command results, all comparison adaptations/counts, current limitations and independent review verdict. Do not attribute old product observations or hosted CI results to this source.
- [ ] Stop with **no-adopt** if either consumer lacks measurable benefit, preservation/equality fails, or a consumer needs a broader API. Otherwise hand back reviewed candidate bytes and qualification to the coordinator for separately authorized exact bundle/manifest/cold-source delivery. A dirty candidate is not manifest-selected source; do not claim final delivery until its own gates have run. No commits/pushes or runtime/skill migration are implicit here.

## Exit

The accepted result is a bounded pure authoring helper with independent API/browser consumer benefit, all three input classes controlled, preserved evidence/authority boundaries and exact offline readback. It does not close agent-led design reliability or live QA. Open requirements and real-product blockers remain in the canonical plan; this slice does not manufacture a new field task.
