# P1 bounded observation slice — independent whole-pair review

Review role: Lead AQA and architecture reviewer. This is an internal independent review of the complete Kernel/Console candidate pair, not an external human audit.

Reviewed ranges:

- Kernel `185d3e72309a4362db57cf2e805d1c00a5035909..aa5d2d188606cbcf7e3111c130347a36970ec786`
- Console `d28d7743e9aac370a726df6c6288ad2ef0e52c78..48e4628f91569c4cf96d0e616cbe6e29ec31baee`

Both component checkouts are clean at the stated heads, each base is the exact merge base, and both range diffs pass `git diff --check`. I read the complete supplied diff packages, requirements, task reports, and both component Lead AQA reviews. I did not rerun component suites merely to reproduce supplied logs.

## Strengths

- The pair reuses the intended authority boundaries rather than adding a second QA engine. Kernel owns the immutable private store, publication/strategy/check/target/oracle validation, and the full-target observation report. Console pins that exact reviewed Kernel revision and reaches the report through the existing registration runtime and default lazy bridge.
- Kernel's payload contract is narrow and fail-closed: strict version/provenance, bounded JSON text, nonblank reasoning/limitations, caller-declared identities, and `attachments: []`. Stored-byte hashes are consistently presented as integrity rather than tool, capture-time, deployment, PASS, or GO attestation.
- Current acceptance remains bound to the current publication, strategy, reviewed `verifies` edge, target, check, and resolved oracle. Publication-only rotation is now retained as safe history, while a stale strategy under the current publication remains invalid.
- The aggregate reader preserves the complete current target denominator and all contradictory current observations. Safe artifact-only, manifest-only, malformed, altered, and historical owners remain explicit diagnostics; unsafe workspace/owner/path state rejects the channel instead of becoming an empty history. The accepted fix also gives every complete owner an outer manifest-and-artifact byte recheck.
- Console's client projection now verifies the report strategy, the exact duplicate-free target set, and every target's exact duplicate-free catalog check set, including `not_observed` targets. Current/historical bindings, duplicate evidence, observation-state consistency, and diagnostic kind/code consistency fail closed within the observation channel.
- Channel failure is contained: the parseable base snapshot, coverage denominator, filters, managed campaign evidence, first-evidence state, draft readiness, and verdict remain independent. Legacy snapshots/readers are `unsupported`, unsafe/read failures are `unavailable`, and neither is rendered as `not_observed`.
- The actual consumer path is present rather than a side report: bounded CLI writer/reader/report commands use the exact pin, the default bridge delegates to the same runtime context, the strict snapshot projection consumes the report, and Coverage SSR renders current observations beside exact workspace target IDs while keeping diagnostics separate and the external graph pilot untouched.
- The paired fixture exercises a meaningful full path: public Kernel registration/publication, CLI subprocess write, fresh-process read, immutable same-byte retry, default bridge/runtime read, strict projection, and Coverage SSR. A remains persisted without replay, B remains visible and unobserved/capability-limited, and independent C proceeds. The protected graph/catalog/coverage/strategy bytes remain unchanged and no managed campaign is created.

## Critical (must fix)

None found.

## Important (should fix before bounded source delivery)

None found. The two Kernel Important findings and the Console exact target-to-check association finding from the component reviews are addressed at their source boundaries with focused regression coverage. No fix-introduced cross-component breakage is visible in the complete pair.

## Minor (non-blocking)

1. The final Console bundle remains above Vite's recommendation (reported `573.46 kB`, `161.57 kB` gzip). The warning is retained rather than suppressed. This is a performance follow-up, not a correctness, authority, provenance, denominator, or trust-boundary blocker for this bounded slice.

## Evidence and claim boundary

Supplied evidence is internally consistent with the reviewed code:

- Kernel final focused observation suites: 13/13, plus final typecheck/build; the earlier storage/publication regressions remain attributed to their original run.
- Console fixed projection/mapping/bridge set: 63/63; fresh fixed-byte actual pair: 1/1; prior 66/66 and pin 22/22 remain attributed to the earlier candidate bytes as reported.

These results were considered as supplied evidence, not independently rerun for this review. They establish the bounded local text/JSON observation slice and its real default Console consumption. They do **not** establish a full Kernel/Console suite pass, cold dependency provenance, a live non-fixture consumer, browser/cloud/dual-host acceptance, product QA, deployment identity truth, capture-time truth, managed PASS/GO, or universal QA completeness.

Root packaging, source-manifest adoption, canonical source selection, installed-skill rollout, migration of frozen campaigns, deployment, and push remain separate controller-owned gates. This review does not approve or assume them.

## Verdict

**Ready for bounded source delivery: YES.**

The exact pair implements the intended P1 observation slice with the required owner/store/graph/check-target-oracle authority, bounded zero-attachment payload, explicit unattested provenance, retained history/contradictions/incomplete states, nonempty unsafe-channel failure, real default Console consumption, exact target/check projection, and unchanged managed coverage/verdict denominator. Delivery must retain the exact pair and the exclusions above; it must not be described as canonical adoption, live product acceptance, or a managed PASS/GO capability.
