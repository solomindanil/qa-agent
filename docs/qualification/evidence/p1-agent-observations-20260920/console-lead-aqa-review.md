### Spec Compliance

- ❌ Issues found: the optional observation projection does not validate the report's exact full target→check association. `src/lib/agent-observations.ts:28-31` omits the Kernel report's per-target `definitions`, and `src/lib/agent-observations.ts:56-68` checks only the target-ID set plus the `checkId` of observations that happen to exist. A `not_observed` target therefore has no report-side check association validated at all. This misses the brief's explicit "exact full target set/check association" requirement.
- ⚠️ Cannot verify from this Console diff: the separately authorized live non-fixture consumer, cold dependency provenance, canonical source selection, deployment, and active-source adoption are deliberately later gates. The local fixture is correctly labelled as local-only at `tests/unit/qa-agent-observation-pair.test.ts:79-81` and in `docs/agent-observations.md:1-6`; no such later acceptance is claimed here.

### Strengths

- `scripts/qa-campaign.ts:146-197` adds the three requested commands through the existing CLI, preserves the existing bounded stdin reader, canonicalizes artifact bytes, checks the exact Kernel before load, after load, and after the operation, and returns allow-listed error codes without echoing private messages (`scripts/qa-campaign.ts:925-950`).
- Snapshot reads stay on the existing registration runtime and default lazy bridge (`server/registration-runtime.mjs:386-402`, `server/bridge.mjs:135`, `server/bridge.mjs:466-477`). Channel failure is contained without discarding the base snapshot, and the bridge test verifies both delegation and private-error containment (`tests/unit/agent-observation-bridge.test.ts:27-48`).
- The view keeps observations additive: coverage rows/counts and managed campaign/first-evidence projections are unchanged, contradictory current observations remain separate, historical/incomplete diagnostics remain visible, legacy snapshots become unsupported rather than fabricated empty history, and external-graph rows do not receive observation children (`src/components/coverage/Coverage.tsx:101-110`, `src/components/coverage/Coverage.tsx:137-147`, `src/components/coverage/Coverage.tsx:182-190`; `tests/unit/agent-observation-view.test.ts:43-55`, `tests/unit/agent-observation-view.test.ts:76-121`).
- The paired acceptance is substantive rather than mocked: it uses public registration/publication, real CLI subprocesses, the default bridge/runtime/Kernel reader, strict snapshot projection, and actual Coverage SSR; it proves fresh-process readback, byte-identical retry without another request, an unobserved capability target, independent C, unchanged model bytes, and no campaign directory (`tests/unit/qa-agent-observation-pair.test.ts:53-129`).
- The exact reviewed Kernel pin and all four named literal-pin consumers move together while the independent wrong-pin rejection remains (`server/kernel-authority.mjs:7`, `README.md:91-106`, `tests/unit/kernel-fixture-authority.test.ts:56-68`, `tests/unit/managed-pack-portability.test.ts:38`, `tests/unit/fixtures/campaign-continuation-stalled-git.mjs:10`).
- Supplied qualification evidence is complete for the scoped task: final observation/live mapping and paired flow are 66/66 with exit 0 (`p1-console-final-66.log:393-410`), pin controls are 22/22 with exit 0 (`p1-console-pin-controls.log:135-144`), and the build exits 0 (`p1-console-build-final.log:12-14`). I did not rerun suites.

### Issues

#### Critical (Must Fix)

None.

#### Important (Should Fix)

1. `src/lib/agent-observations.ts:28-31,56-68` — The client drops the Kernel report's `definitions` and never compares every target's complete check-ID set with the snapshot catalog. The focused named seam check confirmed that the exact reviewed Kernel returns `definitions: TestCatalogEntryV1[]` on every target (`components/kernel/src/kernel/target-observation-report.ts:50-58,238-251`). As written, a same-strategy malformed/stale envelope with the correct target IDs and no observations can still be accepted as `not_observed` even when its target→check association is wrong. Model the report definitions (or a canonical duplicate-free check-ID projection), compare an exact set for every target against the local catalog, and add wrong/missing/extra/duplicate definition cases to `tests/unit/agent-observation-view.test.ts:57-74`.

#### Minor (Nice to Have)

1. `src/lib/agent-observations.ts:32-36` — Diagnostic `kind` and `code` are independent enums, so contradictory pairs such as `artifact_only` plus `AGENT_TOOL_OBSERVATION_ALTERED` pass projection. The exact Kernel currently emits consistent pairs, but the strict client should encode them as a discriminated union and reject a mismatched pair so incomplete/malformed/altered states remain unambiguous.
2. `p1-console-build-final.log:6-11` — The final build is successful but not pristine: the 573.00 kB minified JS chunk exceeds Vite's 500 kB recommendation. This is non-blocking for the bounded observation slice, but it should remain an explicit performance follow-up rather than being suppressed by raising the warning threshold.

### Assessment

**Task quality:** Needs fixes

**Reasoning:** The Console integration, trust labelling, failure containment, pin move, and real writer→fresh-reader→default-bridge→Coverage acceptance are otherwise well executed and well evidenced. Approval is blocked only by the missing exact per-target check-association validation required by the brief; the two Minor items do not independently block this task.

## Scoped Re-review — Fix Round 1

### Finding Verdicts

- **Important: exact full target→check association was not validated for every report target** — **ADDRESSED**. `src/lib/agent-observations.ts:35` now requires a `definitions` check-ID projection on every target, and `src/lib/agent-observations.ts:70-72` rejects missing, extra, wrong, or duplicate check IDs by exact set comparison against the snapshot catalog, including rows with no observations. `tests/unit/agent-observation-view.test.ts:80-101` covers a healthy all-`not_observed` inventory plus missing-field, missing-check, wrong-check, extra-check, and duplicate-check variants.
- **Minor: diagnostic kind and code could contradict each other** — **ADDRESSED**. `src/lib/agent-observations.ts:21-24,38-42` defines the single kind→code mapping and refines every diagnostic against it; `tests/unit/agent-observation-view.test.ts:103-110` verifies a contradictory pair makes only the observation channel invalid.
- **Minor: final Vite bundle exceeds the 500 kB recommendation** — **NOT ADDRESSED (explicitly deferred, non-blocking)**. The fix report retains the warning at 573.46 kB / 161.57 kB gzip and states that the threshold was not raised. This remains a performance follow-up, not a correctness or trust-boundary blocker for this fix round.
- **RED/GREEN evidence check** — The supplied RED run fails exactly the two new behavioral controls, 6/8 pass and exit 1 (`p1-console-round1-red.log:20-21`, `p1-console-round1-red.log:92-93`, `p1-console-round1-red.log:350-359`). The supplied GREEN run passes both controls and the scoped view/mapping/bridge set, 63/63 and exit 0 (`p1-console-round1-green.log:33-40`, `p1-console-round1-green.log:382-391`). The actual fixed-source paired writer→fresh CLI→default bridge→Coverage repeat also passes 1/1 in 105921 ms with exit 0 (`p1-console-round1-pair.log:2-19`). Suites were not rerun for this review.

### New Breakage in the Fix Diff

None. The required `definitions` field matches the exact Kernel report contract already checked in the original review, preserves the projected minimal shape by retaining only `checkId`, and leaves legacy snapshots and unavailable channels outside this parser. The diagnostic refinement is local and fail-closed.

### Out-of-Scope Observations

None. The fixed-source paired-consumer repeat is now evidenced GREEN, but canonical source adoption remains a separate controller-owned gate and is not part of this scoped verdict.

### Verdict

**Fix round:** All blocking findings addressed, no new Critical/Important breakage. The only open item is the explicitly deferred, non-blocking Vite bundle-size Minor.
