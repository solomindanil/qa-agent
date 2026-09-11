# Offline Product Graph QA demo

Run:

```bash
npm run demo:qah:graph-offline
```

The command executes three local Ready-for-QA scenarios through the real QAH contracts and the pinned stock Nuanu worker completion validator:

- non-critical graph impact -> `READY_FOR_PRODUCTION`;
- payment/business human-only impact -> `HUMAN_REVIEW`;
- authenticated product failure -> `RETURN_TO_WORK`.

The corresponding stock Proof Gate claims are `pass` to `ready_for_production`, `blocked` to `ready_for_qa`, and `fail` to `in_progress`. Criticality reason codes remain in the signed flow receipt; the closed stock `qa_result_v1` claim keeps its required empty `reason_codes` field.

The report binds each route to the exact synthetic candidate, graph-plan digest, knowledge digest, execution assignment, evidence digest, and Proof Gate outcome. Authority telemetry must remain zero for product-repository reads, Git commands, product-network requests, and credential reads.

This is an offline rehearsal. It does not activate the live Nuanu Column binding and does not inspect, clone, build, or execute the Freeland repository. The future Product Graph provider and RepositoryBuildExecutor replace the synthetic provider and offline executor through the same contracts.
