# Reuse existing contracts

- [Freeland verdict templates](../components/freeland/templates/freeland-verdict/): runtime-attestation, startup and manual records. Templates are empty contracts, never manufactured proof.
- [Console campaign evidence fixture](../components/console/tests/fixtures/qa-campaign-evidence.ts): synthetic test construction example, not a live report.
- [Starter contracts](../components/kernel/src/contracts/) and [campaign/oracle workflow](../components/console/skills/qa-product-v0/references/declarative-campaign.md): use the existing schema and publication API for new packs.

For tracker bug cards use the selected product's requirements plus the official Nuanu Flow work-items skill. Keep exact environment, steps, expected/actual, evidence and dedupe/readback; no new generic tracker client is introduced here.
