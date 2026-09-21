# Lead AQA review — final bounded V3 iteration

2026-09-21. Read-only source and offline-artifact review; this report is the only write. Prior reports, source, actor modules and frozen probe results remain unchanged. At this review snapshot, `contract-1..3` modules/reports/results and `contract-4` module/report are present; final scoring and `contract-5` remain pending. Do not represent the partial counts below as five completed samples.

## Review decision

**Approve the paragraph's content as a narrow policy clarification; behavioral acceptance remains OPEN.** It is eligible in principle for source adoption explicitly scoped to that reviewed clarification, provided the existing authorization and delivery gates allow a documentation clarification with unresolved behavioral evidence. There is no content-level reason to require it to remain wholly inactive. This is not approval to change an accepted-runtime pin, install it, or label the original fix complete.

If the actual source-adoption gate means “verified behavioral fix,” this candidate does not meet that gate and must remain a candidate there. Do not silently relabel such a gate to ship it. Conversely, do not invent a new requirement that every unrelated QA defect or broader qualification item must close before a sound clarification can be retained. The review approves content, not a waiver of the owner's existing gates.

V3 is the last bounded iteration for this slice. I do not request another engine, grammar registry, expanding prohibition list, repeated sampling until green, or another wording iteration. Finish and preserve the already-running samples, then report the residual behavior honestly.

**Selected disposition, confirmed by the coordinating agent:** preserve V3 as an inactive exact-source/evaluation bundle; do not select it as a verified skill repair; retain the accepted Console `c421160a71c0679a357f29828029ec3550791d16` manifest/runtime. I concur with this behavioral NO-GO. The source-content approval above does not override this disposition. The next existing step is independent test-design review of the authored oracle and evidence, not another classifier engine or fourth prompt iteration.

## Verified source scope

Both reference files have SHA-256 `ae61132d05033ee35cba9e54b3eee546fb9d2dc28c7d769cf5933c97abbba42b`. The source delta relative to `c421160a71c0679a357f29828029ec3550791d16` is the matching existing-reference paragraph. Its substance is appropriate:

- Exact source constraints and observable state remain strict; amount equality does not fix display locale.
- A deterministic artifact retains complete unrestricted text and leaves meaning unresolved; the existing agent-led lane assesses the actual captured text against its source.
- An agent cannot manufacture an authoritative grammar to justify its own regex.
- Established violations remain failures; unresolved required clauses prevent PASS.
- An inherited literal continuation note is not a wording requirement, and separate agent interpretation does not rewrite the runner receipt.

This is useful expectation and evidence discipline within existing mechanisms, not a new semantic runtime. It does not establish dependable first-attempt compliance by every author.

## Reproduced remaining same-target defect

`contract-3.mjs:55-69` still extracts an unanchored numeric `appointment(s)` substring and treats one extracted number as the entire summary's meaning. Its report calls that count “unambiguous,” but no source-defined summary grammar supports that assumption.

I evaluated unchanged `contract-1..3` locally with the ordinary known-date capture (`2026-10-02`, exactly `slot-a` at `09:00`, otherwise correct fields) and only changed the summary to:

> Not 1 appointment is available

Observed results:

| Module | Availability | Meaning claimed |
| --- | --- | --- |
| contract-1 | unassessed | Complete text retained for agent review |
| contract-2 | unassessed | Fixture passes; complete summary meaning remains unresolved |
| contract-3 | passed | “The summary states 1 appointment(s), matching the 1 rendered entry.” |

The third result is a wrong definitive verdict: the sentence denies the supposedly matching count rather than affirming it. At minimum this text cannot support PASS; a separate semantic assessment can identify the contradiction. This is the same targeted substitution of guessed regex for unrestricted meaning, now in the summary instead of the guest message. It is not an unrelated new requirement. Keep this diagnostic separate from the frozen 21-case results and denominators.

After `contract-4` became available, I independently ran the coordinator's separate `summary-diagnostic.mjs` on unchanged `contract-1..4`, using the clearer full summary `No appointments available. Booking 1 appointment is not possible.` with the same known one-item fixture. Contract-1/2 returned `unassessed`; contract-3/4 returned availability `passed`. Contract-4 extracts one numeric token from unrestricted prose and similarly claims that token agrees with the actual list. This confirms that the residual mechanism is not isolated to the phrasing of the first diagnostic. These results remain separate from frozen21.

## What the partial cohort proves and does not prove

The unchanged `score-v3.mjs` reports zero wrong definitive verdicts, zero strict regressions and zero malformed outputs on the frozen 21 captures for each of `contract-1..3`. Unresolved top-level observations are 37, 37 and 24 out of 84 per module. The first two preserve the intended summary/message deferral; all three defer nonempty guest-message meaning and retain the strict probe failures.

That is favorable observed guest-boundary behavior and a useful artifact pattern in some samples. It does not establish successful handling of all unrestricted wording, which the additional summary diagnostic directly disproves for contract-3. The unresolved observations are not assessed PASS, wrong bug reports, or independent reliability trials. The fixed probe's zero wrong-verdict count cannot override a reproduced failure outside its finite examples.

The rubric remains useful for separating abstention from false verdicts and requiring failure on the supplied strict mutations. Its reason-presence check and finite cases are not substitutes for reviewing grounding and clause composition. No rubric relaxation or actor repair is warranted.

The previously reviewed five-capture agent interpretation remains evidence that the existing lane can complete useful bounded offline meaning assessment while preserving original module returns. It is not a fresh V3 end-to-end qualification or a replacement for this cohort's remaining failures.

## Delivery wording and final boundary

Use: **“Source policy clarification reviewed; selected samples preserve exact checks and defer unrestricted meaning; targeted first-attempt behavior remains inconsistent, including a reproduced false PASS on a negated summary. Behavioral acceptance and broader qualification remain OPEN.”**

Do not use: “fixed,” “all five passed,” “semantic oracle verified,” “original catalog failure resolved,” or a reliability percentage. Add the final two samples' actual outcomes when available without changing earlier outputs or this diagnostic. If source adoption is authorized as clarification only, retain this unresolved behavior in the same owner checkpoint and do not imply an installed-host update. Otherwise deliver the inactive candidate and evidence package without further iteration.
