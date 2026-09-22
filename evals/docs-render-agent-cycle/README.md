# Public documentation: transport is not rendered usability

Bounded P4/P5 consumer experiment derived from the independently observed rw-int
documentation/CSP failure. It changes no real product, campaign or tracker.
[Dated results and evidence limits](../../docs/qualification/docs-render-consumer-20260922.md)
distinguish original agent choices, pre-execution review and actual execution.

## Reusable fixture control

From the canonical root, with the manifest-selected Console already restored and
its existing Playwright dependency/browser available:

```sh
node --test evals/docs-render-agent-cycle/fixture.test.mjs
```

This opt-in test launches a local headless browser and two ephemeral loopback
servers. It may need the host's scoped local-network/browser permission. It does
not install dependencies or browsers. It is deliberately outside root packaging
tests, which must not implicitly launch browsers.

Both variants return identical HTML and OpenAPI bytes. Only CSP differs: the
healthy response permits the initializer's exact hash; the faulty response blocks
it. The test observes all three visible reference texts versus an empty body and
an actual CSP browser error, with `bypassCSP: false`. This is fixture qualification,
not a new product runner, semantic acceptance engine or agent-quality score.

The public fixture preserves the experiment's response bytes and behavior; its
formatting and test cleanup were normalized for source delivery. The original
experiment bytes, plans and failures remain separately retained. Re-running this
test does not replay either fresh-agent conversation.

## Consumer protocol

Give fresh actors the same [normative brief](product-brief.md), source pins and
neutral release inventory in separately owned registered workspaces. Use the
existing reviewed knowledge publication and Console campaign/observation APIs.
Preserve all original targets, unresolved surfaces and access gaps. Only the
treatment receives a reviewed docs-journey `requires` rendered-invariant edge;
compare complete common authorities and the exact one-edge/digest-only delta
before apply. Registration is controller-prepared, not autonomous onboarding.

Freeze both-release first designs before either release executes. Independent
Lead AQA reviews grounding, safety and assertion completeness. Preserve original
design errors separately from corrected plans; never handicap the control or
conceal legitimate requirements to force graph benefit. Execute with the existing
runner, save nonzero exits, fresh readbacks, artifact hashes and separately
attributed supplemental observations. Blockers remain even when public checks pass.

Compare faulty-render detection, healthy-control false alarms, unsupported PASS/
bug claims and retained scope. A graph-cited reason is not causal evidence of
incremental gain. Same-host actors can read historical source summaries: this
protocol is instruction-isolated/open-context, not secure hidden-answer isolation,
host parity or complete P4/P5 qualification. The controller preparation, reviews
and execution evidence are in the dated local archive, not a portable autonomous
benchmark runner; preparing another paired experiment requires a new scope and
review through the same owning APIs.
