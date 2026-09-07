# QA capability boundaries — 2026-09-07

This is a capability/evidence map, not a readiness percentage or a release verdict.
Keep three axes separate: **implementation exists**, **bounded local qualification**, and
**live evidence on the identified product candidate**. Unqualified does not mean nonexistent;
source, test names, catalog entries and old observations do not establish a fresh product PASS.

Variants: **S** = Starter Console/Kernel; **F** = Freeland's existing product QA tools;
**A** = agent-led use of the current host's actual tools, under the selected owner's authority.
Source instructions and external host prerequisites are in [skills](../../skills/README.md).

## Qualified source and adoption boundary

- The [delivery manifest](../../sources/manifest.v1.json) selects Console `f4b0d56`, Kernel `393af20`
  and Freeland `ca9d9b4`. [Assembly](assembly.md) and [authored fixture](authored-fixture.md)
  qualify selected local gates and source delivery, not whole products.
- G3+G4+G5 are integrated at Console `76d00b174f1e74a79a1c88d93a1e227d48489979`.
  The earlier G3+G5 focused TAP contains
  **10/10 passing records**, zero failures/skips/cancellations: 7 G3 + 3 G5, including parents.
- That TAP precedes the final TS-only fix: `d3e21ae` adds only an `attemptRoot: string` annotation.
  The integration owner verified identical emitted JS; this is not a newly rerun post-fix TAP.
  Three-file targeted TypeScript checking is green. The subsequent full six-file gate passed
  **36/36**, including the type fix and all three slices; [exact qualification](learning-portability.md).
- G4's bounded synthetic learning result is coordinator-reviewed **8/8**, with two reviews
  complete; its source is included in the new bundle. The separate cold restoration/packaging
  gate passed47/47. Neither result is a universal automatic learner or full-product proof.
- A local result may be accepted as evidence while its reusable source is still pending adoption.
  Do not silently change component pins, installed skills or product owners to use a candidate.
- [Exact GET dependencies](read-only-dependencies.md) extend only the public read-only browser lane;
  they do not add authenticated, payment or general external-network authority. Original MagicCard
  qualification remains pending. [Cancellation](cancellation.md) repairs owned cleanup and evidence
  writes; it does not renew historical controlled receipts or prove a whole product.

## Capability matrix

“Proven” below applies only to the named bounded evidence, not the entire capability row.
Freeland `qualified`/`shadow` are binding metadata states with historical evidence references;
the fresh eight-binding preflight is not a fresh execution of those eight product cases.

| Capability | Implementation: S / F / A | Local qualification | Live proof and remaining boundary |
| --- | --- | --- | --- |
| Public web | S public read-only browser adapter; F landing/CTA and route checks; A authorized browser exploration. | S [authored fixture](authored-fixture.md): 22/22 synthetic TAP records; F existing bindings/preflight. | MagicCard owner03 has valid bounded public-auth-UI PASS, separately from the declarative G1 ENV_BLOCKED. Neither proves authenticated flows or full product QA. |
| Authenticated web | S declarative adapter remains public-only; separate agent/browser workflow exists. F login/session persistence (`TC-ВХОД-03`, qualified), role pools and controlled account flows. A must recheck origin/account/session. | Fixture auth UI is not an authenticated-runner qualification. F binding metadata alone is not a fresh login. | Independently reviewed Freeland diagnostic passed auth setup and session reload on `2981985`. Full authenticated business/role coverage and MagicCard authenticated flows remain unverified. Do not transfer sessions or approvals. |
| API / roles | S public API adapter, not authenticated MCP execution; F dry idempotency (`TC-API-01a`, shadow) and cross-account security (`TC-SEC-01`, qualified); A scoped HTTP/MCP tooling. | S API continuation uses loopback. Active Kernel393 lacks `recordAgentToolObservation` / `readAgentToolObservation`; the reporting sibling is not an authorized substitute. | [Memory slice](second-product.md): six HTTP MCP reads / ten assertions. Independently reviewed Freeland checks cover anonymous401 and signed policy/capability responses. Neither establishes complete role/cross-account isolation, native behavior or value release. |
| Stateful payments | S public runner rejects side-effect authority. F dry/quote/no-money cases and `TC-PAY-19` unpaid checkout exist; A can use individually authorized payment workflows. | F capability binds two `create_unpaid_checkout` units to staging/plan/SHA, expires within 15 minutes and consumes once; metadata/preflight is not current settlement proof. | No current full settlement acceptance. Dry PaySheet, unpaid checkout creation and real payment are different effects; each needs exact permission and outcome reconciliation. |
| Async mail / recovery | F controlled email `TC-ВХОД-02` (qualified), recovery `TC-ВХОД-05` (shadow), mailbox lease/polling and recipient/account/post-submit matching exist. S public runner does not qualify a general async-mail adapter; A can review supported results. | Existing recovery wrapper consumes staging/source-bound, short-lived authority and returns `NEEDS_AGENT_REVIEW`; ambiguous mail and timeout remain guarded. | No fresh email/reset delivery or completed recovery was established here. Provider readiness, test account identity, cleanup and final readback remain required; implementation is not absent. |
| Visual / mobile web | S screenshot/trace artifacts; F `TC-ВХОД-09` responsive routes at 375/768/1440 (shadow); A visual inspection through available browser tools. | Artifact creation and hashes do not prove visual quality; responsive cases exist but lack fresh live qualification here. | No blanket visual, touch or mobile-device PASS. Responsive browser checks and actual iOS/Android device behavior are separate evidence. |
| Native | No native-device adapter is supplied by S's public campaign. F browser routes do not establish native execution. A depends on actual callable native host/plugin tools. | Shared source routing is not native attachment or dual-host execution. Missing MagicPay native attachment in the inspected owner task is a concrete capability gap, not global impossibility. | Fresh native invocation/identity and actual device or host behavior remain unqualified. An HTTP wrapper cannot be relabeled native evidence. |
| Full QA / tickets | S agent reasoning over graph/catalog and existing campaign tools; F full/smoke, sprint, impact and release-verdict tools; A official tracker workflow with dedupe/authority/readback. | [Ticket reasoning](ticket-reasoning.md): seven synthetic decisions; coordinator observed Freeland `qa:verify` exit0. These qualify reasoning/tool paths, not deployed fixes. | Two actual Freeland QA tickets were read. The independently reviewed diagnostic passed5 policy checks + auth setup (6/6); not full regression, a release generation, original-path FIXED or tracker transition. |
| Graph learning | S reviewed knowledge revision, closure/digest guards and plan CAS; F graph→impact→plan/generation; A proposes dependencies/regressions from confirmed evidence. | G4 8/8 and the integrated36-record gate prove the reviewed synthetic workflow; source is bundled. | A real finding→reviewed regression/graph change→changed next executed product plan is still a separate [roadmap](../roadmap/README.md) exit. No autonomous universal learner or live coverage growth follows from catalog size. |
| Human help | S caller checkpoint + current APIs/CAS and a new remaining-only run; F scoped human authorization/agent review; A secure handoff when the host capability exists. | [Accepted local proof](human-help.md): independent progress, real readiness readback and three separate receipts. G3 contributes7 records in both the focused10 and integrated36 gates; source is bundled. | Human/operator was simulated. Real host/human/device recovery is unqualified; no cumulative sealed PASS or exactly-once guarantee, and unknown mutations/payments must not be blindly retried. |
| Host portability | S/F complete source bundles and common entrypoints; A resolves tools/auth/ownership afresh. A byte-preserving pack-copy qualification now exists beyond source restore. | [Cold source restore](source-delivery.md) is accepted. G5 contributes3 records in both the focused10 and integrated36 gates: independent consumption plus copy/supervisor controls; source is bundled. | Same-machine isolated fixture receiver is not another real host, ownership transfer, installed Codex↔Claude parity or cloud autonomy. Never copy private credentials as a portability shortcut. |

Freeland implementation details are in the [replacement bindings](../../components/freeland/config/freeland/manual-replacements.v1.json),
[release skill](../../components/freeland/skills/freeland-release-qa/SKILL.md),
[mail polling](../../components/freeland/tools/freeland-replacements/mail-tm.mjs) and
[unpaid-checkout capability](../../components/freeland/tools/freeland-replacements/unpaid-checkout-capability.mjs).
Component-relative links become available through the normal [source restoration](source-delivery.md), not donor-path fallbacks.

## Product and evidence distinctions

MagicCard owner03 saved `public-auth-ui-c7-03/result.json` is explicitly
`AGENT_LED_FRESH_BROWSER_NOT_DECLARATIVE_CAMPAIGN` / `PASS_BOUNDED_PUBLIC_AUTH_UI`.
Its public login-entry assertions and negative form checks do not establish full authentication.
It is bound to web `c7d3db8d7c0ad094ba34d69cad41e20d125aa518`; the backend commit remains unattested.
The old G1 receipt remains **ENV_BLOCKED** after two origin-escape navigation attempts and
zero executed assertions. The owner-published next plan accounts for57 catalog relationships
on 33 blocked targets with zero executable checks; that restriction is declarative-only and
retains all51 agent/tool entries. Exact publication/CAS readback is recorded in
[second-product](second-product.md); this accounting transition is not execution or a G1 PASS.

Freeland's fresh graph/full-plan preflight retains **142 changed files, 106 unmapped files**.
Ordinary graph validation passed; strict validation reported **180 diagnostics**, including
**37 distinct requirement groups without a test owner**. Diagnostic categories overlap;
do not add them into a count of unique uncovered requirements. The full plan's 266 desktop,
10 mobile, 89 pending manual and 18 replacement entries are separate inventories, not passes.
Fresh offline `qa:verify` exit0 does not close these gaps. A subsequent existing-launcher diagnostic
passed five selected policy checks plus auth setup (6/6, exit0, no retry/skip/unexpected/flaky).
Before/after identity JSON is equal except its timestamp, with live/ready both `ok`, candidate
`2981985e6eaebddbdb1b6691a261bc7e9369bcaa`, final observation `2026-09-06T21:56:33.888Z`.
This bounded live result passed independent artifact audit; it is not full campaign/release generation,
ticket FIXED evidence, payment execution or mobile qualification.
Exact candidate, artifact hashes, preflight and mutation-review limits: [ticket evidence](ticket-reasoning.md).

Private raw artifacts remain with their execution/qualification owners; hashes below are identities,
not portable runnable paths or proof of capture method. No private host path is required by this page.

| Additional saved evidence | Byte SHA-256 / interpretation |
| --- | --- |
| Integrated G3+G5 `focused.tap` | `89fd1f4a1f6d6ad8b1241c6c8220513f221c8399cf8625b7d9652ae1cf4b741b`; read back 10/10, not rerun for this document |
| MagicCard owner03 result | `2e00f56d651415d109192ef33b2f1aae25c9513ec7c0d3c341b3cf49f6960842`; separate bounded agent-led evidence |
| MagicCard historical G1 receipt | `045588947f65373ac312387be168fab9e531d040dcf57a520e3b9970245d366b`; ENV_BLOCKED remains historical truth |
| Freeland bounded diagnostic summary | `26197798244f52545aab845f33ab8b76dfe38aaf872c6e2ec481be94c1b4e35e`; independently reviewed6/6 saved result |
| Freeland independent post-run review | `f3159254668fd0c079dab436e4be46b249403bbc328decf534040401d137e1f7`; bounded scope/source/identity/results verified |

## Safe next work

1. Preserve the qualified G3/G4/G5 source bundle and completed root restoration/packaging proof
   without reattributing earlier TAPs or changing a running product's pins.
2. Coordinate with each product's existing owner. Execute only the reviewed, explicitly authorized
   next live lane; full suites may contain account provisioning or mutation-method probes.
3. Preserve blocked/unassessed denominators and independent lanes. Request human help only for
   the concrete missing capability/authority; keep safe independent work moving.
4. Qualify real host/human and native/API attachment gaps when available; cloud remains later.
   Source delivery, synthetic controls and bounded live slices must stay separate in every verdict.
