# W3 Freeland VPN content regression — proposal, 24 September 2026

## Status and intent

**PROPOSAL ONLY — pending explicit user confirmation.** This note records a
bounded design discussed after a read-only source audit. It is not an approved
implementation plan, delivered assertion, qualification result or product
verdict. No code, component pin, product, campaign, installed skill or tracker
change is authorized by this document. This design record may be committed as
a proposal checkpoint; that commit does not approve implementation or promotion.

The intended outcome is to reject an old or wrong-cohort VPN instruction while
preserving correct generic, legacy managed and pre-purchase behavior. Reuse the
existing Freeland helper/fixtures and consumer; do not add a runner, universal
VPN policy or new verdict mechanism. The accepted synthetic visible-content
repair is useful control evidence, not a Freeland business oracle.

This uses the bounded brainstorming path: an existing flow is being tightened,
not a new subsystem. The short design requires user approval before implementation.
No separate implementation-plan document is proposed at this stage.

## Current source evidence

Selected Freeland source remains
`0ea2df10f1b6d613e01d50011c269ca0fa999877`; the read-only audit ran
`npm run sources:verify` successfully. That is packaging verification, not VPN
product execution.

- `components/freeland/tests/freeland/desktop-content-contracts.ts:3–11` has only
  a timeout option and explicitly defines rendered usability, not successful
  import or subscription validity.
- Lines 24–48 accept any single coherent observed branch. Generic requires the
  current heading, active status and enabled copy control; managed requires its
  heading and enabled Karing launch control. There is no independently supplied
  expected cohort and no instruction-body assertion.
- `components/freeland/tests/freeland-main/desktop-content-contracts.test.mjs:19–20`
  defines healthy generic/managed fixtures without instruction-step bodies;
  lines 54–61 expect them to pass. Lines 84–103 reject missing/disabled controls
  and contradictory branches, not wrong-cohort or stale-body content.
- `components/freeland/tests/freeland/app.spec.ts:209` and
  `components/freeland/tests/freeland/sections.spec.ts:92` consume the readiness
  helper without an expected cohort. These calls are not FREEL-443 acceptance.

A complete rollback to the old generic heading “Настройте VPN-доступ” would be
rejected by the current helper. That does not imply sensitivity to an old body
under the current heading or to a coherent managed screen shown for a generic
expectation. See [historical recheck](freeland-velvet-recheck-403d3e4-20260918.md),
especially its harness correction and cohort-specific observations.

The [root visible-content repair](outcome-visible-content-20260924.md) checks a
synthetic heading/body promise and selected visibility faults. Its Nebula
wording is not a real VPN rule, and no Freeland source pin changed through it.

## Product-source attribution, not live identity

The workspace locator's older owner mirror remains frozen at
`d3ec8b59b2772bb0c5fec9971e944a61016f21f0`; it was not updated or repurposed.
A later product-owned checkpoint selects a separate read-only product mirror.
Its inspected detached HEAD was clean at
`1d936feab559ebb2946561d7ca76b9c460746b2f`. The same local Git store contains
`37e74b7aec81ad8e97de3c90e11573b7f271b0aa` as a commit object; it was not checked
out during this audit.

For each of those later commits, a local Git comparison against
`403d3e4459c3b00a98fccfb9e99bca9f4c675972` returned no diff for the complete
`apps/web/src/pages/VpnPage.tsx` and
`packages/i18n/src/resources/ru/vpn.ts` files. Thus the proposed historical RU
steps and branch-selection code have identical bytes in these later local
sources. This is not a claim of whole-tree equality, current deployment, current
rollout configuration or execution against any of these builds.

At the inspected later source:

- `VpnPage.tsx:904` defines `GenericVpnSetupGuide`; lines 944–945, 995–997 and
  1043–1044 render its three static step headings/explanations. Line 997 selects
  the active versus pre-purchase import explanation from the presence of access.
- Lines 1328–1333 select the active cohort from subscription capabilities with
  status fallback, but the pre-purchase cohort from status-provider capabilities.
- Lines 2173–2174, 2196–2197 and 2261–2262 render the managed instruction steps.
- Lines 2297–2300 preserve both generic and managed pre-purchase guides.
- RU `vpn.ts:103–108` contains managed steps; lines 141–161 contain generic
  steps, public client labels, pre-purchase explanation and support label.

No private subscription URL, QR payload, clipboard value, token, account ID or
private project/run binding is included here. Source SHA and repo-relative
locations establish attribution without copying private runtime locators.

## Recommended bounded change

Keep `expectVpnContent` as the existing readiness assertion. Add one separate
content assertion beside it, requiring an explicit expected guide variant:
generic-active, managed-active or generic-prepurchase. Exact symbol/API naming
is an implementation detail, not a new cross-component contract.

The separation matters: the readiness helper requires one observed branch,
while a pre-purchase guide can legitimately coexist with offers. Do not impose
the readiness branch-exclusivity rule on that guide, and do not ban the healthy
managed pre-purchase route. A full managed-prepurchase content contract is not
part of this smallest slice; retain it as an explicit unassessed content variant
and preserve existing readiness behavior.

For local controls, the expected variant is immutable fixture input, independent
of the rendered HTML. For an eventual product consumer, it must come from an
owner-reviewed fixture/requirement binding: candidate, account-role, locale,
expected cohort and lifecycle state. The rendered heading cannot choose its own
oracle. A current API capability projection may confirm fixture consistency but
does not independently prove intended rollout eligibility. Unknown, conflicting
or unsupported bindings remain unresolved/blocked rather than accepting any
coherent screen.

Use only allowlisted capability/state enums for that consistency check. Do not
retain entire subscription/access responses. Active and pre-purchase mappings
must remain distinct: an expired legacy subscription can coexist with a generic
selling provider. Support has its own mapping and is outside this slice.

## Proposed static RU instruction checks

These literal expectations are grounded in the inspected source and historical
product acceptance context, not generated from the currently rendered page.
Do not import runtime product translations into the test oracle: identical
UI/oracle mistakes would become false PASS. An intentional wording change needs
review of the expectation, not automatic replacement from product output.

Within the selected guide, assert three visible steps in order, including their
separate static explanation elements:

| Variant | Required static content |
| --- | --- |
| Generic, step 1 | “Установите VPN-клиент”; “Основной клиент - Happ. Если он недоступен на вашем устройстве, установите Incy.” |
| Generic active, step 2 | “Добавьте подписку”; “Скопируйте подписку, затем добавьте подписку из буфера обмена в Happ или Incy.” |
| Generic pre-purchase, step 2 | “Добавьте подписку”; “Ссылка подписки и QR-код появятся здесь после оплаты. Скопируйте ссылку и добавьте подписку из буфера обмена в Happ или Incy.” |
| Generic, step 3 | “Выберите сервер и подключитесь”; “Откройте добавленную подписку, выберите сервер, нажмите подключение и подтвердите системное VPN-разрешение.” |
| Managed active, step 1 | “Скачайте Karing”; “Выберите устройство и откройте ссылку” |
| Managed active, step 2 | “Импортируйте доступ в приложение”; “Запустите Karing от имени администратора, если система это поддерживает, и передайте туда Freeland-подписку.” |
| Managed active, step 3 | “Подключитесь к нужному серверу”; “Внутри Karing нажмите на значок молнии, выберите сервер и подключитесь.” |

Also require the matching guide heading. Generic pre-purchase requires the
visible “Можно подготовиться до оплаты” notice and absence of an available
subscription-copy action; generic active retains its enabled copy-control check
without clicking it. Managed active retains its launch-control check without
reading its private target or launching it.

Use specific static leaf-element locators and bounded polling for rendered
visibility/text, not whole-guide `textContent` or parent DOM capture. Reject
hidden required paragraphs and the relevant zero-opacity shapes; this is not
a complete human-perception oracle. Never read subscription text/input, access
link targets, QR payload or clipboard. Diagnostics should contain a static
check ID and bounded safe reason, not surrounding DOM or response content.

## Controls and consumer binding

Retain the existing local browser fixture mechanism, with external requests
blocked. Proposed controls are:

1. Healthy generic-active, managed-active and generic-prepurchase contracts.
2. Exercise the actual proposed capability-to-variant binding logic with
   conflicting synthetic subscription/status enums: a legacy managed
   subscription and a generic selling provider must select generic pre-purchase,
   while the relevant active-subscription case retains its subscription cohort.
   Merely labeling static generic HTML as a legacy/generic fixture is not this
   control and cannot prove that subscription/status confusion is rejected.
3. Old body under the current generic heading, and missing step-body content.
4. Coherent managed content for a generic expectation, and the inverse.
5. Required content hidden or opacity-zero, despite matching DOM text.
6. Delayed complete healthy content passes within the existing bounded budget;
   a permanent no-op shell does not.
7. Pre-purchase content falsely claiming the active subscription is available.
8. Synthetic secret sentinel in adjacent private material: neither passing nor
   failing assertion diagnostics may expose it. Exercise the actual product
   consumer's effective Playwright configuration, including failure screenshots
   and retry traces, rather than checking helper diagnostic strings alone.
   Keep this qualification on safe synthetic pages; do not capture a real
   secret-bearing page to test redaction. Preserve the existing privacy gate and
   verify emitted screenshot/trace contents as well as textual diagnostics.
   Before live use, prevent secret-bearing page capture through the accepted
   product-owned artifact controls; an assertion's safe error message alone is
   insufficient. Unqualified capture behavior blocks that consumer's delivery
   or live use rather than relaxing the privacy boundary.

After approval, choose one explicitly bound existing product consumer instead
of adding an unbound global default. The `sections.spec.ts` VPN path is a
candidate, not a claim that its current fixture already supplies the required
binding. Existing readiness-only consumers must not be relabeled as content
acceptance. The new local consumer must import the delivered helper bytes and
distinguish the reviewed healthy/broken variants; record exact source and
contract provenance. Local source qualification does not activate a live lane.

## Approval gates and excluded claims

Before Sol implementation:

- The user explicitly confirms this bounded design and source-only scope.
- Independent AQA reviews the concrete test design and privacy failure surfaces.
- Any unresolved intended-behavior question is grounded in accepted product AC
  or the product owner; later identical source bytes remove a date-only concern
  but do not determine intended production cohort rollout.

Before a live content assertion, the product owner separately supplies/reviews
the exact safe fixture/cohort binding, current candidate/account/environment and
permitted actions. Do not create a fixture through purchases, mutate subscription
state, change rollout configuration or replace a frozen owner runtime. Changing
tracked corpus requires the owning source/graph/campaign identity refresh and
requalification; no old receipt is renewed by this design.

This proposal does not close W3, W1/T7, FREEL-443, full P2/P5 or release readiness.
It excludes actual VPN import/connectivity, subscription validity, provider
health, public download-link destination validation, full support content,
managed-prepurchase semantic coverage, EN/TMA/native/device matrices, general
occlusion/contrast correctness and complete instructional sufficiency. A missing
broken deployment remains an evidence limit, not invented live RED-to-GREEN.
Committing this design record is documentation-only. No product action, payment,
configuration change, tracker write, installation, implementation commit or
source promotion is authorized by this note.
