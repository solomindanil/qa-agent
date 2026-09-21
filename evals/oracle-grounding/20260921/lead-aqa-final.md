# Lead AQA final review — oracle boundary V2

2026-09-21. Independent read-only review of the existing Console skill clarification and offline evidence. The only write is this report. No product/network access, source or Git mutation, actor-output edits, or subagents. Review included all five V2 lane outputs, frozen v3 scoring, and the completed separate interpretation artifacts.

## Decision

**The wording is substantively sound and narrowly scoped, but I do not sign off the behavioral fix as accepted. Keep its fix-loop acceptance open.** The reason is a reproduced remaining failure in the exact semantic-boundary behavior being fixed, not a requirement to close unrelated P3/P5 work or qualify the entire product QA workflow.

A documentation owner could separately elect to adopt a reviewed clarification with the unresolved behavior explicitly recorded. This review does not grant that authority or support describing such adoption as a verified repair, a converged five-sample result, or broader first-attempt qualification. If the current adoption gate is successful completion of this skill fix loop, keep this candidate unaccepted at that gate.

## Source review

Both `skills/qa-product-v0/references/product-analysis.md` and its `.claude` mirror have complete-file SHA-256 `b20761eb1702ee596c52da830999619d88dc5231a5d57e26d89ad464a439dc11`. Relative to base `c421160a71c0679a357f29828029ec3550791d16`, the change is one identical paragraph in each reference.

The paragraph preserves source-defined exact constraints, locale flexibility, strict deterministic failures, incomplete-clause status, existing agent-led assessment, and receipt separation. It does not introduce a framework, schema, grammar registry, new runtime, or new authority. Existing skill lane and partial-evidence rules already support it. There is no substantive reason to broaden the source change.

## Evidence and remaining failures

### Frozen 21-capture evidence

Under `score-v3.mjs`, lane-1/2/3/5 have no wrong definitive verdicts or strict regressions on these captures. Lane-4 has one wrong definitive verdict: availability PASS for the date without authoritative exhaustive fixture truth. All five retain zero strict regressions and zero malformed outputs on the frozen probe.

This is not uniform implementation of the requested boundary. Lane-1/3/5 defer free-form guest meaning to the separate agent lane. Lane-2/4 still synthesize semantic regex classifiers. The number of unresolved top-level observations varies: 24, 4, 21, 3, 24 respectively out of 84 observations per module; these are repeated capture/check combinations, not independent reliability trials or product coverage totals.

Lane-4's failure is real: its `FIXTURES` includes October 3 with count 2 from the supplied current render, and `evaluateAvailability` promotes count/list agreement to PASS. Its report acknowledges unknown exact identity, but the executable status does not preserve that gap. Do not repair or explain away the sampled output.

### Additional same-target diagnostic — separate from the frozen score

Code inspection found unanchored positive semantic patterns in `lane-2.mjs:201-212` and `lane-4.mjs:150-156`. I executed unchanged modules locally with the ordinary probe capture, changing only `guest.message` to:

> No sign-in is required

Both return `guest: passed`, with reasons claiming the explanation conveys mandatory sign-in. The accepted brief instead requires an explanation that sign-in is needed. This is the same observed false-pass mechanism, changing only the necessity synonym; it is not a new product requirement. Keep this diagnostic separate from the fixed 21-case results rather than retroactively modifying their denominators.

Also checked `You cannot book without signing in`; both abstained rather than falsely failing it. This second diagnostic adds no defect finding and must not be counted as one.

The first diagnostic prevents asserting that V2 reliably routes unrestricted semantics away from guessed regex. The favorable fixed-probe results alone miss that remaining behavior. No claim of statistical reliability or causal elimination is warranted.

## Rubric review

V3 makes the necessary distinction between wrong definitive verdicts and unresolved evidence. It retains mandatory failure for exact inventory/time, legal, denial-code/no-booking, stored/displayed amount and stored/displayed currency mutations. A PASS on unknown-fixture availability is still a wrong verdict. The original control and V1 false passes also remain wrong verdicts. Original v2 results are preserved and the same v3 rubric is applied across cohorts.

The rubric is appropriately a classification aid, not an adoption decision. It permits unresolved statuses at every top-level field and checks explanation presence only; manual review must still confirm retained deterministic subresults, honest limits and a concrete next action. Thus zero `wrongVerdicts` never means complete coverage, compliance with the new lane instruction, or a successful product check. The additional diagnostic demonstrates why that manual review matters. No further relaxation is justified.

## Separate agent interpretation

`interpretation-report.md` correctly distinguishes its offline agent assessment from unchanged module returns. I recomputed `lane-1.evaluate` on each of the five supplied captures and deep-compared it with `interpretation-module-results.json`; all five saved returns match.

The independent assessment is supported: A all four pass; B guest fails; C availability, guest and fee fail; D availability remains unassessed for missing authoritative fixture truth; E legal fails while awkward summary grammar is not invented as a requirement. Totals are 14 passed, 5 failed and 1 unresolved fixture outcome. Visibility/live provenance remain explicitly outside this assessment, and the report does not promote module output or claim live acceptance. This is positive evidence that the existing agent-led lane can usefully finish bounded interpretation without a new runtime or unnecessary human escalation. It is one supplied-fixture continuation, not five independent successful end-to-end samples.

## Smallest next move

Preserve the V2 paragraph, all actor outputs, frozen scores and this diagnostic as a partially successful but not verified behavioral candidate. Do not adopt under a “fix verified” label. If the owner continues the narrow loop, target only the residual decision to synthesize a semantic classifier: test a clear artifact contract in which the deterministic module records free-form meaning as unresolved and the separate agent assessment judges the complete capture, while exact failures retain precedence. Do not append another regex exception, rewrite sampled modules, broaden the implementation, or demand closure of unrelated qualification work.

If the bounded exercise stops here, report exactly: **source clarification reviewed; agent-led continuation demonstrated on supplied fixtures; targeted first-attempt semantic boundary still inconsistent; broader qualification remains open.** The original catalog literal-count failure was not reproduced by these controls and is not retrospectively closed by this result.
