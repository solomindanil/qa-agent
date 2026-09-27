# D13-479: bounded existing-target check authoring

Date: 27 September 2026. This is the user-approved implementation scope incorporating independent AQA **REVISE** at design time. The later bounded implementation, review and local source-delivery status is tracked in the [D13-479 qualification](../../qualification/d13-479-check-authoring-20260927.md), not inferred from this design. Architecture/review: Astra; implementation and local verification: Sol. No SuperSkill.

## Decision and evidence

Add one pure Kernel helper for replacing **explicitly named catalog entries of existing targets**. Do not export a general rehash helper: it removes only the digest cascade while leaving the repeated, error-prone graph/catalog/coverage/strategy assembly with callers. Do not introduce a DSL, runner, verdict, publication wrapper or persistent contract version.

The [accepted authoring probe](../../qualification/d13-479-authoring-probe-20260924.md) permits this bounded design. Current retained consumers independently repeat assembly in `evals/graph-consumer-agent-cycle/prepare.mts` and `evals/public-input-agent-cycle/regression.mts`; Console's `tests/fixtures/nuanu-readonly/fixture.ts` supplies a test-only rehash helper. These are synthetic authoring consumers, not production demand or agent-quality acceptance.

Baseline root `1305fb7bf873d011849525b722bcf164dfeced45`, selected Kernel `ece24e865f7ea37cff32c24c7e3739c9d0059f81`, Console `5634b7f456999a967cc64704c58f7d6e040f0e57`. Reverify actual source before implementation. The canonical [program plan, section 3](../plans/2026-09-23-unified-qa-agent-implementation-plan.md#3-порядок-и-зависимости) remains the queue; this is a bounded D13-479 design, not a replacement queue.

## Constraints

- Architecture/review: Astra; implementation and local verification: Sol. No SuperSkill.
- Node >=22.12.0; retain existing component dependencies and lockfiles. No implicit installs.
- No product calls, browser execution, account access, tracker writes, financial actions, deployment, installation or campaign migration.
- Helper effects: in-memory computation only. Tests may use owned local temporary workspaces and existing offline publication APIs.
- No new persisted schema, schema registry entry, DSL, runner, CLI, automatic verdict or publication API.
- Source, installed skills and frozen campaign runtimes remain separate. Passing these controls is not product PASS or W4/W6/W7/I10 acceptance.
- Preserve original attempts and independent baseline implementations; do not rewrite historical consumers or qualification results to manufacture agreement.

## Public surface and ownership

Create `components/kernel/src/kernel/registration-check-authoring.ts`, exported with its input types from `components/kernel/src/index.ts`:

```ts
export function buildRegistrationCheckRevision(
  base: RegistrationPublicationAuthority,
  replacements: readonly TargetCheckReplacement[],
): RegistrationPublicationAuthorityV2;

export type ResolvedAuthoredCatalogEntry =
  Omit<TestCatalogEntryV1, "oracle"> & {
    readonly oracle: { readonly state: "resolved"; readonly description: string };
  };

export type AuthoredReplacementCheck = {
  readonly name: string;
  readonly verifiesEdgeId: StableId;
  readonly bindingReviewStatus: "reviewed";
  readonly reason: string;
} & (
  | {
      readonly catalog: ResolvedAuthoredCatalogEntry & { readonly executionKind: "automated" };
      readonly proposalId: StableId;
    }
  | {
      readonly catalog: ResolvedAuthoredCatalogEntry & { readonly executionKind: "manual" };
      readonly handoffId: StableId;
      readonly requiredCapability: string;
    }
);

export interface TargetCheckReplacement {
  readonly targetId: StableId;
  readonly replaceEntryIds: readonly StableId[];
  readonly checks: readonly AuthoredReplacementCheck[];
  readonly coverageReason: string;
}
```

Use existing types from contracts and `workspace-blueprint.ts`. These are local function-input types, not a new on-disk format. Validate inputs at runtime, including unknown fields; TypeScript alone is not a guard. Reject malformed input with existing `QaError` code `CONTRACT_VALIDATION_FAILED` and a field-specific explanation. Keep existing downstream validator/builder errors rather than replacing every failure with a generic success or empty result.

`replacements`, each `replaceEntryIds`, and each `checks` are nonempty and duplicate-free in their identity domains. Each target occurs once. Every replacement entry ID must exist in the base catalog and bind exactly `[targetId]`; a missing or foreign entry is an error, not an instruction to append. Every new catalog entry likewise has exactly `[targetId]`. New IDs may reuse the IDs of the explicitly removed objects, but must not overwrite retained objects or collide within the relevant existing contract's identity domain.

Caller owns check selection, exact IDs, expected behavior and its source, runner/candidate path, effects, required secrets, evidence classes, provenance and manual capability. The helper neither infers nor authenticates them. `bindingReviewStatus: "reviewed"` is a caller declaration of the binding, not independent-review attestation; provenance authority/review/confidence is never upgraded. A resolved oracle must have a nonblank description and pass the existing contracts. Structurally valid input does not prove semantic correctness of the expectation.

## Algorithm and preservation contract

1. Validate `base` with existing `assertWorkspaceRegistrationPublicationAuthority`; capture/validate plain canonical input without accepting hidden extra edits. Operate on copies only.
2. Resolve every selected existing target by ID. It must remain a coverage target, have a matching coverage item with `applicability: "applicable"`, and have a valid registration subkind. Never rename, add, remove or change a target or its provenance/dimensions. Blocked/not-applicable/unreviewed target handling stays outside this helper.
3. Resolve **only** `replaceEntryIds`. Remove their catalog entries, their bound check nodes/own verifies edges when present, and strategy records bound to those exact entry IDs. Never select removal by target-wide matching. A same-target sibling that is not explicitly listed is retained. Inconsistent ownership/bindings refuse the whole operation.
4. Build each new check node with caller catalog `checkId`, caller `name`, kind from execution kind, `coverageTarget: false`, `assuranceLevel: "declared"`, and the unchanged target's subkind/assurance dimensions. Copy caller catalog provenance exactly to the new node and edge. Build one verifies edge using the explicit edge ID, check ID and target ID, caller binding review declaration and `assuranceLevel: "declared"`. Registration's existing **one target per check** and matching-subkind rules remain authoritative.
5. Append the explicit catalog entry and its automated proposal or manual handoff. For automated proposals use caller `proposalId`, `reason`, and mechanically derived catalogEntryId/checkId/targetIds. For manual use caller `handoffId`, `reason`, `requiredCapability`, and mechanically derived catalogEntryId/checkId/targetId. Do not generate runnable tests or a campaign plan.
6. Reconcile selected coverage using **all retained plus new checks** of that target. All resulting checks must share one execution mode; mixed automated/manual refuses. A retained unresolved automated candidate that cannot coexist under the existing coverage/catalog rules also refuses: the caller must explicitly select the appropriate additional entry IDs in a later request, not have them silently removed. Change only selected coverage mode/status/checkIds/reason and derived freshness bindings. `automated`/`manual` is assignment metadata, never executed acceptance.
7. Preserve `graph.unresolved` and `coverage.unresolved` exactly, even for selected targets: no automatic gap clearing. Preserve all discovery blockers and capability decisions. `strategy.unresolvedOracles` is different: remove only records for explicitly replaced catalog entries because their replacement oracle is resolved; retain every other oracle record. Existing strategy validation requires exact accounting of remaining unresolved catalog entries.
8. Recompute complete strategy unions of `requiredSecretRefs`, `sideEffectClasses`, and `expectedEvidenceTypes` from **all** resulting catalog entries, not only the replacements. Existing profile policy/secret validators still apply. Declared effects are not action-time authorization.
9. Refresh derived digests with current projectors in graph -> coverage/catalog -> strategy -> compilation order. Canonical-sort graph nodes/edges as required; preserve the relative order of retained non-graph records and append replacements in input order. Updating coverage freshness graph/profile digest is mechanical; do not change its stale flag or unrelated semantic fields to force acceptance.
10. Return existing `buildRegistrationKnowledgeRevision(base, compilation)`. Its context, denominator, blocker and transition checks are the final authority. The existing builder freezes the returned authority. Do not return a partially assembled result on failure.

Requirement nodes, `requires` relations, profile/projection/discovery/session identities and coverage target denominator remain exactly unchanged. Retained check nodes/edges and catalog/strategy records remain semantically unchanged. Nonselected coverage items may change **only derived freshness digest bindings**; claiming byte equality of those entire items would be incorrect. All other unrelated data is preserved, not normalized into new business meaning.

The helper cannot know whether `base` is the current persisted workspace authority. It binds V2 to the supplied validated base. Actual stale-base, lifecycle, preview and write guards stay in `previewRegistrationPublication`, `applyRegistrationPublication`, and `validateWorkspace`. No new wrapper or bypass is introduced.

## Three supported input classes

| Class | Caller supplies | Helper produces, without executing |
| --- | --- | --- |
| API | Existing applicable target; exact old entry IDs; resolved API expectation; API candidate path, runner, read-only/evidence metadata | Consistent authored automated candidate and proposal |
| Browser | Existing target; exact entry IDs; several explicit normal/boundary checks; web candidate path and evidence metadata | Several same-target checks; operations/assertions remain in the existing Console plan |
| Manual | Existing applicable target; exact entry IDs; manual entry, sourced expectation and required capability | Explicit manual handoff; no manual receipt or PASS |

Adding an invariant/requirement or changing a target name, reason of an unrelated target, graph relationship, source profile or policy is explicitly unsupported. The API graph-consumer's new-invariant/relationship work and the old Console fixture's target rename therefore remain outside the comparison fragment and outside this API.

## Verification and consumer benefit

New pure controls belong in `components/kernel/tests/registration/check-authoring.test.ts`; independent retained-fragment comparisons in `components/kernel/tests/registration/check-authoring-consumers.test.ts`; one offline integration addition belongs in `components/kernel/tests/workspace/knowledge-revision.test.ts`. Reuse catalog/strategy/knowledge validators and existing offline fixture preparation. Do not migrate existing baseline helpers onto the new function.

Cover API/browser/manual healthy outputs; explicit subset replacement preserving same-target siblings; singleton/subkind/wrong binding; nonexistent replacement ID; retained/new mixed mode; blank/unresolved oracle; prohibited effect/undeclared secret/invalid candidate path; identity collisions; exact blockers/unresolved preservation; complete unions; no input mutation; deterministic same-input output; existing stale-base/preview rejection and exact persisted readback. Invalid casts/unknown extra fields cannot mutate hidden targets or clear gaps. A correctly rehashed dropped-blocker proposal must still be rejected by the old builder.

For benefit, freeze two **pure assembly fragments** from the current retained API and browser recipes; do not import/run their live/local-server entrypoints. Record source root, file hash, extracted boundaries and every scope adaptation. The old fragments removed target-wide entries and cleared gaps; these behaviors conflict with this spec. Apply identical, explicitly recorded narrow-scope adaptations to the independent baseline: exact named-entry replacement, no gap clearing, no unrelated edits. This is a bounded comparison against adapted retained mechanics, not exact replay of historical outputs or trials. Keep original sources unchanged.

Both arms receive identical validated base and caller-owned definitions/IDs/provenance/effects. Compare canonical full authority for exact equality; do not normalize away IDs, blockers, oracle records, provenance or unknown differences. Prepare out-of-scope targets/relations identically before both arms, and exclude that common preparation from claimed savings. Preserve all unrelated outputs separately with sentinel assertions.

Measure caller-owned mechanical assembly statements, metadata-binding initializers and cross-model mutation sites in each arm; count input mapping, wrappers and adapters in the helper arm. Count substantive check definitions/expectations separately and keep them equal. Use the same TypeScript AST counting rule in the plan, not line wrapping or semicolon formatting. Record helper implementation/test size separately so relocation cost remains visible. Keep the helper only if **both** fragments have fewer total mechanical units (statements plus metadata-binding initializers) and zero remaining caller-owned graph/catalog/coverage/strategy mutation or rehash sites in the selected fragment, with exact equivalent results and no authority widening. Wall-clock rehash milliseconds and shorter formatting are not benefit metrics. Preserve first attempts/errors; neither arm is a live QA result or improved unaided test design.

## Stop/no-adopt gate

Stop and return to Astra if exact entry selection, singleton semantics, provenance, unresolved preservation or a required consumer forces a broader API. Do not add target creation, generic mutation callbacks, a model-edit DSL, implicit publication or a new persisted schema. Reject adoption if comparison savings disappear after counting adapters, equality requires unapproved normalization, a consumer still coordinates the four models, or tests only prove the same helper against itself. No change to installed skills/campaigns follows from this source work. Exact source delivery and an independent review follow successful controls separately; failures and deferred cases remain recorded.
