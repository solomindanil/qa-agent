# Retained graph-consumer comparison — 14 September 2026

Actual execution evidence is packaged and cold-extraction verified. The independent
Lead AQA outcome review is **ACCEPT** for this bounded local result. Independent
review of the whole portable delivery is now **APPROVE** in the
[separate delivery record](../../../docs/qualification/reviews/graph-consumer-delivery-20260914.md).
It does not change the scope of the earlier outcome review.

## Result

Both fresh actors selected and executed the same existing D+C checks:

| Condition | Selection basis for C | Pass | Needs review | Blocked | Sealed verdict |
| --- | --- | ---: | ---: | ---: | --- |
| Control (actor 1) | Independently inferred from the supplied brief | 1 | 1 | 1 | INCONCLUSIVE |
| Treatment (actor 2) | Traversed the added reviewed journey→invariant graph edge | 1 | 1 | 1 | INCONCLUSIVE |

D was directly bound to the requested journey in both conditions. The treatment
changed the documented rationale for C, but not the selected set: incremental
graph-caused selection gain established by this comparison is **zero checks**.
There was no coaching, resampling, corrected plan or second campaign.

The passing check was the public-catalog readiness contract. The integrity check
remained `needs_review` after two runner attempts, and the existing unresolved
surface candidate remained blocked/unassessed. Both campaign receipts remain
INCONCLUSIVE with no dossiers or promoted product verdict.

## Portable evidence

[Evidence archive](evidence.tgz), 112,166 bytes, SHA-256
`3ebbe3ff46ffc625b5977c321bc7651645be19245f2360c2c552b706efdfc6fb`.

The archive contains 97 regular files:

- both actors' original first decisions, original and canonical plans, final
  reports, checkpoints, drivers, validation/run/readback outputs, diagnostic
  reason/observation and advisory review records;
- exactly two original campaign receipts and all 12 result/trace artifacts;
- each condition's graph, test catalog, coverage and publication record;
- controller common-publication, relation-publication, parent-reader and preserved
  first-decision records, plus the original eight-entry HTTP journal;
- exact controller preparation inputs `consumer-protocol.md`, `design-review.md`,
  `controller-run.mts`, `root-baseline.log`, and the source review/implementer
  `task-1-review.md` and `task-1-report.md` records;
- the independent bounded outcome review and the parent's packaging gate log.

Cold extraction into a newly created temporary directory passed all of the
following checks:

- 97/97 extracted file bytes matched the inspected packaging set; 70/70 JSON
  documents parsed;
- archive member names were relative and traversal-free; every member was a
  regular file or directory, with no symlinks;
- exactly two campaign directories and two receipts were present;
- both receipt inventories contained six entries, and all 12 artifacts matched
  their recorded byte lengths and SHA-256 hashes;
- both original plans were byte-identical to their canonical campaign plans;
- both actor first decisions were byte-identical to the controller-preserved
  originals;
- both receipts contained 1 pass, 1 needs_review, 1 blocker, zero dossiers and an
  INCONCLUSIVE verdict;
- the control graph had zero `requires` edges and the treatment graph had exactly
  the one intended `requires` edge;
- the journal contained eight GET-only records: two `/api/catalog` and six
  `/api/catalog-integrity`;
- copied actor/controller/publication/preparation bytes matched their original
  sources; strong secret-pattern and forbidden-path scans were empty.

No registration store, auth path, `secrets.env`, write-admission/transaction
state, dependency tree, Git metadata, installed skill or active runtime directory
is included.

## Claim and provenance limits

The later raw JSON observations are explicitly `agent_authored_unattested`. Their
51-byte hashes match the original failed response summaries, but they are not
original campaign artifacts, do not prove the second assertion ran, and do not
promote either sealed verdict. They support only a synthetic endpoint-contract
diagnosis, not a per-item inspection, live-product bug or release conclusion.

The HTTP journal stores only method and path. It has neither actor identity nor
timestamps, so it cannot support per-actor or timing attribution and cannot alone
prove the absence of other traffic. Actor boundaries are parent-observed and
instruction-scoped, not a cryptographic isolation boundary. Actor 1 also saw
inline qualification-history metadata after freezing its first decision; perfect
history blindness is unsupported, although its original selection did not change.

The graph's declared source provenance remains unreviewed user input, and the
fixture/deployed target identity was not independently attested. The preserved
source review accepts the preparation seam; the later independent outcome review
accepts only this bounded local result. Neither is Stage Four, cloud, product or
release acceptance. The original archived outcome-review packaging boundary is
historical; the later independent delivery review is linked above.

This archive is inspection evidence, not a moved or reusable active workspace.
Absolute paths in preserved files describe the historical source host only; they
are not prerequisites or instructions to run the historical scripts. Reproduction
requires a new isolated exercise, identities, registration and explicit authority.
