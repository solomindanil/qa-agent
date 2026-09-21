# Lead AQA V3 — completed five-sample appendix

2026-09-21. This supplements, and does not rewrite, `lead-aqa-v3.md` or earlier reviews. All five contract modules/reports are now available after actor completion. Read-only offline review; this appendix is the only write. No source/actor edits, product execution, network, new actor or wording iteration.

## Final disposition

**Behavioral NO-GO confirmed. Preserve V3 as inactive candidate/evaluation evidence; retain accepted Console `c421160a71c0679a357f29828029ec3550791d16` and its existing manifest/runtime selection.** The sentence-level content review remains favorable, but does not confer behavioral acceptance, installation authority, or permission to promote the candidate. This report does not itself attest the subsequently packaged root delivery; that remains a separate exact-commit/path review.

## Recomputed evidence

For each unchanged `contract-1..5.mjs`, I reran the pure local frozen `probe.mjs`, scored its preserved results with `score-v3.mjs`, and reran both `diagnostic.mjs` and `summary-diagnostic.mjs`. I deep-compared each fresh output against the corresponding saved probe result and matching row in all three final score/diagnostic files. **All 20 comparisons matched**: five probes, five scores, five guest-diagnostic records and five summary-diagnostic records. No saved result was replaced.

| Module | Frozen21 wrong / strict regressions / malformed | Unresolved / 84 observations | Two guest diagnostics | Full-summary contradiction |
| --- | --- | --- | --- | --- |
| contract-1 | 0 / 0 / 0 | 37 | both unassessed | unassessed |
| contract-2 | 0 / 0 / 0 | 37 | both unassessed | unassessed |
| contract-3 | 0 / 0 / 0 | 24 | both unassessed | **false PASS** |
| contract-4 | 0 / 0 / 0 | 24 | both unassessed | **false PASS** |
| contract-5 | 0 / 0 / 0 | 25 | both unassessed | **false PASS** |

The two guest messages are `No sign-in is required` and `You cannot book without signing in`. Abstention on these is not a wrong verdict and is not semantic completion.

The independent summary diagnostic uses the known one-item October 2 fixture and complete summary `No appointments available. Booking 1 appointment is not possible.` Contract-3/4/5 pass availability by substituting a numeric substring for the summary's meaning. Contract-5's `readSummaryCount` at lines 43–54 extracts one numeric token and lines 112–131 compare it with list length; it repeats the already-reviewed mechanism, not a new unrelated failure.

All five preserve the supplied strict mutations under the frozen probe. That favorable result remains intact, but its finite examples do not supersede the separately reproduced same-target false passes. The diagnostics are not added to the frozen21 denominator. No reliability percentage or all-wording correctness claim follows from these samples.

## Exact reviewed module and report bytes

SHA-256:

| File | Digest |
| --- | --- |
| contract-1.mjs | `e395255ba37f68aacf6f9c73f7a8f7f56a8b4f71ed58bae7e0a58eb884799f6a` |
| contract-2.mjs | `4c51717c58beb399ffd1e6a4f0568aacc29cf797b29c91406012c9e9fefc0956` |
| contract-3.mjs | `6fb4936e22de4fec84be6a9b171e0406550ebb5bf6a12f85e28b6793c879785e` |
| contract-4.mjs | `54bc00963ab921a104a3a1907e23ae9912ac93165cd0ca63b99c4cc03e43398d` |
| contract-5.mjs | `ae390b40378479e988ccf2a51ec661af61d22a94dab3d71a59ed9215ed8536cb` |
| contract-1.md | `b6fab8c9363efa6b9fb72bef51c529ab1acba1b0c2768a910b386ea328d6329e` |
| contract-2.md | `0e208374310a96f23e01e2ceca409f246ae339ca267e15a7477074205fd19b31` |
| contract-3.md | `422d38811ff823a4e01fb67300a4ce563800d666b5ca3fae00756f875b23a825` |
| contract-4.md | `191c2eeb385d9f6431bb13d6e06aaca9a1f1a23b89ebf5c9fa9ae3913e5a4229` |
| contract-5.md | `873bc19faaafcffbcf1d9882acf58acf3ef6adcb1642ee5dbf691f665c02c8ac` |

Final record SHA-256:

- `contracts-score-v3.jsonl`: `39db78535a02b2d90762fd3f97a078a1dcc38cef413afaf4161b8e1cec4b6205`
- `diagnostics-contracts.jsonl`: `b7a33abf4405c6811d90d673cfcbbd08a436fd91c048f396e275b8e97480ddc4`
- `summary-diagnostics.jsonl`: `0da78481712b3a3c773d634d15a8e98f6d8879a36e463b086f30aff4ab4c5a29`

## Useful result and next step

The cohort demonstrates consistent guest-message deferral on the supplied probes, retained strict checks on frozen mutations, and complete summary deferral in two samples. It does **not** demonstrate reliable routing of all unrestricted wording; three completed samples reproduce the targeted false-PASS mechanism in summaries.

Stop the bounded wording loop here. Preserve all first outputs, old results, separate diagnostics and review history. Use the existing independent test-design review next; do not manufacture a grammar/parser engine or repair sampled modules to make the cohort green. Broader first-attempt qualification and the original catalog failure remain open. Next review is limited to the portable root delivery at the exact commit and paths supplied by the coordinator.
