# Agentify public guidance follow-up — 26 September 2026

This is a portable, bounded QA record, not a new eval, product verdict or QA-agent quality-gain claim. It follows the [earlier public-docs first-use sample](../../evals/dialogue-quality/20260926-agentify-public-first-use/README.md) without repeating its first-test-sale clauses. The existing Agentify managed owner, catalog, plan and receipts were not changed.

## Source and prospective contract

- Execution source: stable QA-agent root `70240fa49695070f58555a8fce2ae066fbb5bb2f`; manifest-selected Kernel `ece24e865f7ea37cff32c24c7e3739c9d0059f81`, Console `a8f66792f8053f125bf8ffc758f543f25a2b95a1`, Freeland `0ea2df10f1b6d613e01d50011c269ca0fa999877`. `sources:verify` passed before design and after execution. This checks source packaging, not Agentify's deployment.
- Normative content source: immutable [`nuanu-ai/agentify@38c6769`](https://github.com/nuanu-ai/agentify/tree/38c6769e3260ea79cadb420fd7fca2c46a3cf1ae): docs [sidebar](https://github.com/nuanu-ai/agentify/blob/38c6769e3260ea79cadb420fd7fca2c46a3cf1ae/apps/docs/.vitepress/config.mjs), [FAQ](https://github.com/nuanu-ai/agentify/blob/38c6769e3260ea79cadb420fd7fca2c46a3cf1ae/apps/docs/faq.md), and [failure guide](https://github.com/nuanu-ai/agentify/blob/38c6769e3260ea79cadb420fd7fca2c46a3cf1ae/apps/docs/failures.md). Source HEAD was not treated as live deployment SHA; the latter remains unknown.
- First design was frozen before execution (private SHA-256 `205ae2d692289e6ccad3b837882225966f639a379239dc0d3012d7c1c8372457`). Independent prospective design AQA: **GO, 0 Critical / 0 Important / 1 Minor**. Its one clarification required observing the full FAQ answer *before* following the answer's contextual link; no clause was rewritten. User authority covered one public read-only journey, not scan/account/payment/consent/tracker action.

| Clause | Pinned displayed-content expectation | One-run result |
| --- | --- | --- |
| C1 | Public docs `Common questions` navigation reaches FAQ; the FAQ pause answer's contextual link reaches `What can go wrong`. A separate sidebar failure link does not satisfy the second transition. | **Observed as expected.** Clicks led `/docs/` → `/docs/faq` → `/docs/failures`, with corresponding H1s. |
| C2 | `Can I pause the selling?` says manual per-card/all-selling pause is available, while automatic stopping on merchant silence is designed, not built. | **Observed as expected.** Complete answer captured while on FAQ, before the second click. |
| C3 | `Your side went quiet for a long time` says no self-stop today, manual pause/unpause remains with the merchant, and automatic protection is not built during the pilot. | **Observed as expected.** Named heading and both relevant paragraphs captured on the failure page. |

## Execution, review and ceiling

One Chrome-extension tab was used for the initial public landing and exactly two single link activations, with read-only scrolling. First link action: `2026-09-26T14:49:23Z`; FAQ answer viewport observation bracket ended `14:49:57.495Z`; contextual second click began `14:50:24.414Z`; failure-section viewport bracket ended `14:50:31.526Z` (UTC). The product-browser window was under the four-minute cap. The actor locally retained sanitized returned AX text, URLs and tool-time brackets. Exact internal capture instants, active-browser duration and token/API cost are unavailable; bracket endpoints are not native capture attestation.

Result: **3/3 added guidance/navigation clauses observed as expected**, 0 failed or blocked within this narrow scope. Independent *record* review after execution: **GO, 0 Critical / 0 Important / 0 Minor**. The reviewer did not replay the browser or independently inspect native tool outputs. Viewport images were emitted by the browser tool but had no durable file, bytes or hash. Thus evidence is agent-authored and unsealed, not a managed observation receipt or screenshot-integrity proof. Browser authentication state is unknown; no anonymous-access assertion was needed for public displayed guidance. No cabinet pause, automatic-stop backend, order, payment or outage behavior was tested. No bug/tracker write followed.

The existing owner report remains **21 targets / 2 recorded / 19 not observed**; this one journey is an *additional* scope denominator. It does not close an existing target, W1/T7 remaining-only persisted readback, W6 full/mixed/help-resume, W7 or whole-product readiness.

## Separate search for an existing teaser witness

After the user asked to find a published example, a bounded read-only repository/docs search found **no suitable published completed-teaser witness in the inspected sources**. This is not proof of global absence. GitHub code searches returned zero with `incomplete_results: true`; web search/robots limits also prevent an exhaustive negative conclusion. No report/scan/share URL was opened, no capability or private token was recovered, and no scan/share was created.

The original managed target is `urn:qa:discovery-target:385079ea9385491bf6239431`, “Review a completed public teaser”; its generated candidate still has **no approved oracle**. The [landing illustration](https://github.com/nuanu-ai/agentify/blob/38c6769e3260ea79cadb420fd7fca2c46a3cf1ae/apps/web/components/landing-page.tsx) is static markup. A `/scan/[id]` teaser is capability-protected; a `/report/[scanId]` full report is identity-gated; a published [`/s/[slug]` snapshot](https://github.com/nuanu-ai/agentify/blob/38c6769e3260ea79cadb420fd7fca2c46a3cf1ae/apps/web/app/s/%5Bslug%5D/page.tsx) contains summary fields, not the complete teaser findings/coverage. These surfaces are not interchangeable, and no concrete safe witness was selected.

**One next action:** obtain an owner-approved, already completed teaser witness with valid access/provenance **and** a reviewed current expectation/binding for that existing target, then separately confirm the proposed observation is read-only. Until then keep it pending; do not create a scan, guess/reuse a capability, enter private state or substitute a share snapshot or another docs check.
