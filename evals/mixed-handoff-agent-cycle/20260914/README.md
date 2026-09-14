# Retained mixed-ticket execution — 14 September 2026

Actual execution and portable archive verified; independent Lead AQA: **ACCEPT**
for this bounded result, with the limitations below retained.
See the [qualification record](../../../docs/qualification/mixed-handoff-execution-20260914.md).

## Result and preserved evidence

Two fresh QA actors used the selected Console66ac7db/Kernel185, actual publication,
plan, runner and reader. The first actor received a seven-ticket brief, not solved
checks. Its first report retains an incorrectly authored UI locator and its later
focused correction. The second actor read the saved checkpoint and partial reply.
False readiness caused no new run; actual subsequent readiness led to QA-701 only.

| Phase | Supported tickets | Diagnosed issue | Capability gaps | New runs |
| --- | --- | --- | --- | --- |
| Initial and focused UI correction |704,705,707 |702 |701,703,706 |2 |
| Fresh continuation, readiness claim contradicted |704,705,707 |702 |701,703,706 |0 |
| After observed readiness |701,704,705,707 |702 |703,706 |1 |

[Evidence archive](evidence.tgz), SHA256
`2205f10bcf7e7cff826ab2a06ffa3ebb46ba90d3a7fe5d651e3cfcc137922664`.
Cold extraction verified67files,26runner inventory artifacts(hash/length), six
unchanged report/checkpoint files, three receipts and28GET-only journal entries.
No registration store, secrets.env, auth paths, dependency tree or installed skills
are included. The archive contains:

- FIRST-REPORT/base checkpoint, both continuation reports/deltas, operator replies;
- original caller scripts, availability observations, final plan/reader outputs;
- three original receipts and their traces/results/screenshots;
- graph/catalog/coverage, publication record and two advisory reviews;
- controller timeline/journal and separately preserved focused plan/reader bytes.

| Original document | SHA256 |
| --- | --- |
| FIRST-REPORT.md |22930fbe88eca11984afc37608ca70c7fbb310fa3872df8ddd148551e8a327e3 |
| CONTINUATION-CHECKPOINT.json |5758f11c2c0d9bd5898771b2cbea05c083834631fecf0440be38d3ff7f539a2f |
| CONTINUATION-1-REPORT.md |bd52d8df1cfa6c8826ad8a1d7e71589887aeec2f74804f2d54df32444ad872ab |
| CONTINUATION-1-CHECKPOINT-DELTA.json |c3ebaa0b8a20ecf2a8a58c70c4838f20edfd5c8bee75b66373d8a2e77b8f357c |
| CONTINUATION-2-REPORT.md |68c9ff4660959833c829c230ad78e5ab113349c7f24efd9236c2fa16eda0a11f |
| CONTINUATION-2-CHECKPOINT-DELTA.json |520879b42415b4002627fa5b38166fc2571055ad37b37e2852b16c3783f3f875 |

The first two receipts remain INCONCLUSIVE and NEEDS_HUMAN; the final single-check
receipt also remains NEEDS_HUMAN. The table above is an agent's cumulative scoped
assessment, not a changed/sealed full-release verdict. Historical V0 plans are not
automatically snapshotted: the first author script is retained and the coordinator
preserved exact focused-plan bytes before the final CAS. Do not claim a qualified
immutable multi-run history or general historical-reader behavior.

This is a controlled, prepared, synthetic loopback exercise. It is not a blind
benchmark, actual customer/product acceptance, SQL/payment test or cloud pilot.
First responses and mistaken assertions remain historical evidence, not polished
replacement answers. Actor identity/read boundaries are parent-observed.

The final evidence snapshot is an inspection archive, not an active workspace.
Absolute paths inside it describe the original host; they are not prerequisites
or instructions to execute those historical caller scripts. Use the source
[preparation](../README.md) to create a new isolated exercise with new identity,
registration and authored checks. No private registration or credentials from
the original machine are needed for that reproduction.
