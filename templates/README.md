# Reuse existing contracts

- [Freeland verdict templates](../components/freeland/templates/freeland-verdict/) define empty runtime-attestation, startup and manual records. Filling a template does not prove that the event occurred.
- [Console campaign evidence fixture](../components/console/tests/fixtures/qa-campaign-evidence.ts) is a synthetic construction example, not a live report.
- [Starter contracts](../components/kernel/src/contracts/) and the [campaign/oracle workflow](../components/console/skills/qa-product-v0/references/declarative-campaign.md) define the selected schema and publication route for a Starter pack.

For a bug card, use the *selected product's* tracker, template, state roles and integration—not a universal Flow or Linear default. Keep the exact environment, reproduction, expected/actual result and evidence. Report-only QA makes no issue write; authorized writes require dedupe and persisted readback. This directory does not introduce a generic tracker client or verdict engine.
