<!-- QA_LOCAL_HISTORY_20260920 -->
> Historical record retained during local consolidation on 20 September 2026. Status, approvals, pauses, source paths and next actions below belong to the original dated scope; they are not current instructions, new test results or execution authority. Use the [current checkpoint](current.md) and [consolidation index](local-consolidation-20260920.md). Private/absolute historical evidence links are optional locators, not clone prerequisites. Original body bytes are preserved below.
<!-- /QA_LOCAL_HISTORY_20260920 -->

# VELVET readiness and connection onboarding — 17 September 2026

## Decision

**Later same-day finding:** targeted native Telegram checking reproduced the user's expired old-provider purchase dead end. The [separate migration handoff](freeland-velvet-legacy-handoff-20260917.md) adds this acceptance gap; the historical purchase checks below cover different subscription states and must not be read as complete legacy migration coverage.

**Not fully qualified for real-key customer onboarding yet.** Existing application purchase/inventory acceptance remains useful and is not reopened. Current inspection found an incomplete user journey to connection instructions. Native import/connection using a designated real QA key and production stock readiness remain unverified. This is targeted agent-led, unsealed evidence, not a new full release generation, a product regression assertion or deployment permission.

The QA-agent global P0–P7 implementation is paused at its reviewed-candidate checkpoint. No canonical source pins, installed skills, frozen campaign outputs, product source, tracker or production were changed.

## Environment and evidence provenance

- Current staging API `/api/environment` read before and after inspection: `c46911d99ef5da75f26e19866a5d429beba3fb90`, active staging; profile `0d5587cfac70cc679652d3256823d48d8d445083036dbd474554c26cc36f8231`; build manifest `7e417348706c9b2896fd83647e8a47427db1193c504d66112058b9ce991d0800`. Last recorded read17September05:08UTC. This turn did not independently attest web asset bytes.
- Read-only product mirror clean at that exact commit. Existing graph/test-plan from the17September repaired harness selects the same candidate. Consulted VELVET provider selection, inventory lifecycle, reservation, fixed-term repurchase and activation nodes; no graph/current writes.
- Main agent inspected existing authenticated in-app browser, real provider page already open in the user's Chrome, DOM and visible instructions. No browser network guard or sealed campaign was run for this interactive inspection; do not present UI reads as a full negative side-effect attestation.
- Independent read-only Lead AQA historical audit and source audit corroborated the boundaries below. Source auditor ran3 source-only tests; these are not client playback/import tests.
- No new purchase, checkout, key import/assignment, stock edit, support submission, native subscription import or VPN activation was performed. Raw access links, QR and tokens are intentionally excluded from this report.

## What was actually checked now

| Check | Result and boundary |
| --- | --- |
| Existing active VELVET account | Active, monthly, ends14October2026; state survives page reload. This is the current UI, not a new payment/provisioning test. |
| Narrow375px and desktop1440px | Correct active generic screen; copy control enabled; document width equals viewport, no horizontal overflow. Not a full cross-browser or accessibility claim. |
| Connection guidance on VELVET page | Only “copy the subscription link or scan the QR in a compatible VPN client.” No named client, download link, step sequence, tutorial video or provider-page link. The access URL is plain text, not an anchor. Settings is the already-selected tab, not a hidden tutorial. |
| Copy action | Displays success feedback. IAB clipboard readback does not match; the same observation limitation was independently isolated in the earlier run, with human native copy equality subsequently confirmed. No new clipboard product defect is inferred; this turn's clipboard equality is not PASS. |
| Currently assigned staging link | HTTPS on provider domain, different from the user's separately open real/test key. Opening the assigned URL reaches provider “Subscription problem / This link is invalid.” The provider's browser page rejects it; native import/connection remains untested. In the known synthetic-stock context this is not a newly proven product regression. |
| Provider's separately open real/test key | Provider labels it inactive/test; activation occurs upon first device connection. It is not proven to be one of the newly purchased production-stock links. Asked user which key is designated for QA; no activation while unclear. |
| Provider iPhone tutorial | Happ recommended, Incy alternative; foreign App Store installation step, add-subscription handoff plus manual copy fallback, server-latency selection and VPN-enable explanation. Inspected text and screenshot; did not install/import or certify the final tunnel. |
| Provider Android tutorial | Happ/Incy selection and Google Play/GitHub installation step render. Later Android steps/native execution not evaluated. Other desktop/TV platform entry buttons exist but their complete instructions were not tested. |
| Freeland Support → VPN | Quick fixes explicitly refer to Karing, TUN and Windows Add Profile Link, including advice to delete the old profile. No tutorial video appeared in this live support form. No support message was submitted. This guidance is not provider-aware; Karing incompatibility with the actual subscription is **not** established. |

## Historical acceptance retained, not replayed

-12September: synthetic inventory import/edit/quarantine/retire, masking/audit; one paid issue and repeat/reload recovery; delivered URL and independently decoded QR/copy equality.
-14September: expired VELVET fixture → one user-paid monthly invoice → new30-day subscription, old period retained, exact reserved-key/owner/subscription binding, one corresponding posted operation. Native copy confirmed by user, QR independently decoded. No new payment is needed merely to repeat those application assertions.
-FREEL-438's old inventory500 was accepted as fixed on `1cd8655` after complete All/Reserved/Assigned/Available API reads. Do not revive the old500 as a current blocker.
-Active TurboPatriot synthetic fixture remained active/unmodified. Developer PostgreSQL race/repurchase evidence remains separately attributed; not independently executed again here.

Historical evidence lives with the existing campaign owner, notably `VELVET-PAID-RESULT.md` from14September. The user-facing results above are summarized here without requiring credentials or private access URLs. Historical outcomes do not prove current provider availability or production inventory.

## Source explanation and missing acceptance

At c469, `VelvetProvider` selects `generic_subscription` and returns the inventory URL unchanged. `VpnPage.tsx:1961–2007` deliberately renders only QR/link/copy/status/plan/end. Karing steps/video are in the other branch, not merely hidden by loading. The generic behavior test explicitly expects this separation. Therefore missing full guidance is an existing product-experience gap against the user's requested ready-to-connect outcome, not an identified regression against that unit test.

Existing Karing handoff only accepts `go.mf0.online`; do not blindly route VELVET `subkey.link` through it. The provider's iPhone tutorial uses its own Happ handoff. The fact that a URL renders HTML in a browser does not prove native import fails: provider responses may depend on the client.

Local VELVET term begins at payment confirmation and declares30/90/180/365days,5devices. The inspected upstream key says activation on first device. This difference is a contract question, not proven loss of paid days. Verify the purchased SKU's actual duration/device allowance and promised local period before selling it; the adapter's availability probe alone cannot prove that.

## Minimum completion path

1. Product owner adds or approves a clear VELVET connection path: **Open setup instructions** to the assigned provider page, or equivalent provider-specific steps with supported client/download/import/enable/failure help. Preserve URL secrecy and legacy Turbo flow; do not simply loosen the old Karing host guard.
2. Align Support → VPN hints with provider/client. Do not instruct a VELVET customer to delete an unrelated working profile as the universal first step.
3. Designate one real QA key and test account; verify its import in the intended client and one actual connection. Clarify first-connection activation before consuming its period. No repeat financial purchase is inherently necessary for this test.
4. Operator verifies production prerequisites: genuine unassigned stock in the right SKU, synthetic rows excluded from sale, correct allowlist/encryption/config, adequate remaining term/device allowance. This report neither read nor changed production inventory.
5. Retest the short whole journey after any onboarding fix: product access screen → instructions → client import → connection, copy/QR fallback and actionable failure. Record app delivery, provider result and deployment decision separately.

Until these bounded gaps are resolved, do not tell customers that VELVET connection onboarding is fully verified. Nikita retains rollout ownership; this report makes no overall Freeland Go claim.
