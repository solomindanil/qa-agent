# D13-479 — graph/catalog/coverage authoring decision, 24 September 2026

## Decision

**Proceed only to a bounded typed-helper design; do not implement or select new
runtime code yet.** Existing Kernel APIs correctly validate and publish a
completed compilation, but independent callers repeatedly import a test fixture
and manually coordinate graph, catalog, coverage, strategy, and dependent
digests. A new runner, CLI, verdict, generic manual receipt, or automatic
publication is not justified. This is the separate D13-479 authoring decision,
not the W2b observation-write decision.

The next design should have one owner in the selected Kernel authoring seam and
stay over the present `buildRegistrationKnowledgeRevision` and
preview/apply/readback contracts. It should accept explicit reviewed target and
oracle inputs, preserve unrelated requirements and discovery blockers, reject
incompatible bindings, and leave agent test design and publication authority
with the caller. Retain **no-new-code** if a bounded design cannot materially
reduce repeated assembly without widening authority.

## Evidence

- Source entry: root `49ef195` on `codex/p2-semantic-source-delivery`; selected
  Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`, Console
  `a94571175ca893a5a66eafb5c3d06801238ad04d`. Fresh
  `npm run sources:verify` returned `sources_verified` for all four manifest
  components before the probe. No selected child source, pin, installed skill,
  working campaign, or live product was changed.
- Existing controlled callers have the same assembly seam: the
  [mixed-ticket actor](mixed-handoff-execution-20260914.md#observed-ergonomics-narrow-follow-ups-not-new-engines)
  used a 498-line first script and repeated assembly at lines 173–321, importing
  `tests/fixtures`. The independent [API graph-consumer recipe](../../evals/graph-consumer-agent-cycle/prepare.mts)
  and [browser regression recipe](../../evals/public-input-agent-cycle/regression.mts)
  also import the test fixture and manually synchronize the four models. These
  are synthetic callers, not measured rw-int/MagicPay production authoring.
- An owner-approved throwaway local probe created a fresh **offline synthetic**
  registration from one stored user brief using the selected Kernel. The brief
  declared API/web surfaces and one manual risk; its discovery context forbade
  network and repository reads. The authoring caller imported **no test fixture**
  and used the current Kernel semantic projectors plus
  `buildRegistrationKnowledgeRevision`, `previewRegistrationPublication`,
  `applyRegistrationPublication`, and `validateWorkspace`. No campaign runner,
  product request, manual receipt API, or financial operation was invoked.
- In two fresh disposable workspaces the same V1 authority
  `sha256:07deaba1589642d0dd2f6bccd17dde1ac477f7f0a0ac0146c69c9746c7cb9b72`
  produced the same persisted V2 publication
  `sha256:527eff9d7996899412f167e25a37c6701cbc4dbcf2b8a59c3a7847b13be20072`.
  Exact readback and `validateWorkspace.valid=true` retained three distinct
  target/check/`verifies`/catalog/coverage bindings: API and browser as
  **authored automated candidates**, manual as one handoff. Both original
  `COVERAGE_GAP` strategy blockers remained; unresolved oracles became zero.
  Generated candidate metadata is not an implemented or executed test.
- A correctly rehashed wrong-target proposal was rejected. The direct catalog
  validator reported `CONTRACT_VALIDATION_FAILED` with missing `verifies` edge,
  coverage mismatch, and target-set mismatch; the revision builder rejected the
  same proposal as unreconciled compilation. Removing one original blocker from
  a correctly rehashed proposal was rejected as
  `REGISTRATION_PUBLICATION_AUTHORITY_MISMATCH` (“must retain existing discovery
  blockers”). Six protected authority/model files were byte-identical before
  and after both rejected proposals. The successful V2 publication happened
  separately afterward.
- Compute-only authoring/rehash took about 2–3 ms in this tiny fixture, but
  excludes reasoning and script preparation. The throwaway caller itself still
  needed a manual graph→coverage→catalog→strategy→compilation digest cascade;
  raw elapsed time is therefore **not** the authoring-cost metric. Initial
  registration took about 27 s and isolated preview/apply about 11–13 s; these
  are not a benchmark against another authoring API.

An independent read-only Lead AQA review inspected the throwaway scripts,
persisted authority, model bindings, and negative controls. Three minor
evidence issues in the first probe (generic throw acceptance, authority-only
nonmutation check, and a hardcoded manual-receipt claim) were corrected before
the second fresh run. Re-review found no remaining issue affecting this scoped
decision. The scripts and temporary workspaces are labeled throwaway/private,
not shipped runtime or a portable product fixture.

## Boundary and next gate

This proves fixtureless **Kernel model authoring feasibility and guard behavior
in one synthetic registration**. It does not prove Console UI/CLI integration,
runnable API/browser checks, manual evidence acceptance, actual product behavior,
approval/campaign transitions, deployment, or a universal reduction in effort.
Current rw-int/MagicPay records mostly exercise execution/readback, not this
authoring seam. No manual coverage status here means a manual test passed.

Before keeping any helper, present a bounded in-chat design for approval, name
the selected owner and exact call surface, write RED/GREEN controls for API,
browser, manual, wrong binding, dropped blocker, preserved unrelated targets,
and exact readback, then measure whether the helper actually removes duplicate
assembly. Until then, the existing public APIs remain authority and D13-479
does not authorize product execution or source adoption.
