# Freeland pre-production diagnostic — 15 September 2026

## Decision and scope

The full selected campaign completed, but pre-production QA is **not closed**.
Its immutable shadow receipt is `BLOCK_RELEASE`, not release approval. The
15 failed automated rows do **not** mean 15 product defects: independent triage
attributes 13 to test/fixture drift, one to an inconclusive startup/access check,
and one to the existing low-priority product defect FREEL-424. None of those
explanations rewrites the receipt or turns unexecuted assertions into PASS.

- Candidate: `4c9289f703434edffc60768f3bc0ccb9d1cb3f8f` on staging.
- Production baseline: `98262828a3f506a6e5ce9094968bed917433abc6`.
- Frozen QA source: `3ee1cb3f6ac3676f4f0e066ef5cc9970b0baf5e0`.
- Campaign: `sha256:a8851ffca5e487777654e0f982a4ff7fbc41c9cf886fa414bd96c277334c3e88`.
- Generation: `c41f8d810bdab389a8ca9bb7f7386a91deaf35164c23efa880b335ea4054d0fb`.
- Evaluated at: `2026-09-15T04:15:48.852Z`.
- Receipt digest: `sha256:ccaf29ef9ef40d6c5edae49296623a06d1823d95a615b923a5d7e66ffd62a4c6`.
- Fresh post-run environment reads at 04:17 UTC retained the same two SHAs.
  The existing sprint preflight independently read back the generation and verdict.

No purchases, checkout creation, transfers, product deployment/migration, or
tracker/Buzz writes were performed. This is not a zero-side-effect claim:
normal owned-account login/logout and automatic Inbox read-state writes occur in
the existing suite. Prior paid evidence was not replayed. Chromium device
emulation is not native iOS/Safari or a signed Telegram session.

## Executed results

| Layer | Result | Interpretation |
| --- | --- | --- |
| Startup | 10/10 successful; navigation 200; no observed page errors or HTTP 5xx | Clean startup sample on the exact candidate |
| Selected automation | 276 rows: 237 passed, 15 failed, 6 expected failures, 18 skipped, 0 not-run | The passed count includes 3 tests that passed only on retry; the receipt separately flags flakiness |
| Desktop raw report | 237 expected, 9 unexpected, 3 flaky, 18 skipped; 267 including setup | Playwright `expected` includes expected failures; it is not a pure product-pass count |
| Mobile raw report | 4 expected, 6 unexpected | Two logout passes and two known `/join` failures; six failures across two emulated devices |
| Manual catalog | 89 not-run in this generation: 22 release-tier, 67 advisory | Not 89 new bugs; previous individual acceptance is not automatically imported into a new generation |
| Replacement lanes | 17 declarations evaluated: 16 blocked, one structural-only projection valid | No manual case was freshly qualified by these lane results |

Source qualification remains separate: the [QA-H003 repair](freeland-divergent-baseline-adoption-20260915.md)
passed 2786/2786 owning offline tests. Final committed cold-root restore/verify
and the canonical root packaging gate passed 59/59. Those are harness tests,
not extra Freeland acceptance cases.

## Triage: what the failures actually show

| Area | Evidence-backed conclusion | Required next action |
| --- | --- | --- |
| RU Wallet | Existing [FREEL-424](https://flow.nuanu.com/freeland/projects/f77caf18-5812-4c6b-9317-519473dac804/issues/d0147ce2-e977-4209-b1b9-748dca57fa31) reproduced on both attempts: raw English `Insufficient available balance to place a hold.` in RU transaction history. Fresh plugin read confirms exact duplicate, S4/low, created 3 September; no new ticket or state change. | Product fix or explicit risk acceptance by the owner; do not silently waive a failing check. This is not a newly discovered financial-loss bug. |
| Three VPN rows | Fully rendered `generic_subscription` active surface is valid for VELVET; tests only accept old Karing title or tariff picker. | Update the route-local active-state oracle, retain entitlement/plan/status assertions; regenerate and rerun. |
| Three Store visual rows | Current main heading is `Во имя свободы`; tests still require `магазин` or `цифровая броня` inside main. Screenshots show the intended Store content. | Align the marker with current product source; keep real visual/interaction checks. |
| Inbox read-state | Two desktop sessions each auto-mark the first message read; their initial GET responses can legitimately have different `readAt`. | Isolate fixture/sequence and compare settled semantic state; retain cross-session persistence assertions. |
| Six mobile rows | Root CTA exact-text witness includes an unaccounted nested arrow; Freeman witness accepts English only while UI is Russian. Viewport loop cascades at Freeman. | Source-aligned witnesses and rerun both devices. Landing H1/overflow and later Freeman/settings assertions are unassessed, not PASS. |
| ACL-04 | Both attempts remained on `Открываем Freeland…` at the 5-second assertion deadline. No protected-content exposure observed, but final Telegram-only wall not reached by the test. | Condition-based startup/route readiness and exact anonymous negative-control rerun. Do not call it an ACL regression or waive it. |
| Three flaky rows | Welcome/CJM/TMA startup loading on first attempt; retry passed. | Repair bounded readiness, retain first-attempt evidence and flake classification. |

Screenshots also retain existing expected-failure UI/SEO/PWA cases; they are not
new release regressions. The 390px header screenshots show adjacent Back/Top-up
controls overlapping visually; this is a separate **unqualified visual
observation** pending hit-target/reproduction and duplicate review, not an
additional confirmed bug. An eSIM fixture displays unavailable expiry data;
provider/fixture semantics were not newly qualified here.

Supplemental agent UI inspection found the previously purchased VELVET access
still displayed as active, one month, ending 14 October, and a rendered Russian
Freeman page with composer. These are unsealed observations; no VPN link or
credential is published, no new payment was attempted, and these observations
do not replace campaign assertions or prove provider tunnel behavior.

## Graph and evidence limits

The actual graph selected the full suite and shared dependencies, including
card issuance/top-up, Wallet, shared PaySheet, virtual numbers, eSIM, VELVET
inventory/reservations/repurchase, and authentication/API gates. Direct endpoint
diff contains 294 Git entries; copy-source dependency expansion yields 296 graph
file records, not 296 distinct changes. There are 230 unmapped records and 176
strict coverage-debt findings. The map's historical reference SHA remains a
freshness debt. Full fallback prevents an unjustified narrow selection but does
not fill missing tests.

All eight historically qualified replacement receipts are stale against their
current lane/test/oracle bytes. The campaign correctly blocks them. A private
binding/schema check does not establish fresh executable qualification.
`TC-ВХОД-09` reports `passed/VALID` only for `playwright --list` and source/catalog
validation; its public browser scenarios did **not** run in that lane. It remains
shadow, structural-only, and non-promotable. Broader standard public tests did
run, but they do not substitute for this missing oracle runtime.

The receipt also records 65 product-CI checks unavailable to this external
campaign and 32 unobservable schema identities. Previously supplied exact-tree
CI/SQL evidence remains separately attributed; this run did not execute it.

## Remaining release actions, with ownership

1. **QA agent:** repair the demonstrated test/readiness/fixture issues in an
   independently reviewed corpus slice, preserve negative controls, then rebuild
   identities and run a fresh campaign. Do not overwrite this first failure.
2. **QA agent:** re-qualify only the exact stale replacement receipts and connect
   available approved account roles; execute the public oracle lane if authorized.
   Missing capability blocks dependent cases, not unrelated checks. Reuse prior
   paid evidence where its actual contract allows, never repeat a payment merely
   to make a new receipt green.
3. **Nikita/product owner:** address or explicitly accept FREEL-424 under the
   existing severity/risk policy. No duplicate ticket is needed.
4. **Nikita/operations:** provide the live production migration ledger and exact
   planned delta, the production non-rolling VELVET cutover/rehearsal, effective
   API/worker flags and bounded lock/statement timeouts. The 26 migration files
   in Git do not prove 26 unapplied live migrations. Do not apply non-rolling
   schema to the old serving runtime; require drained API/webhook/worker paths,
   post-migration schema proof before new-binary ingress, and forward-fix recovery.
   Current old production schema preflight does not cover all new required
   VELVET/card/decline-fee fields; default-disabled fees still read new schema.
5. **Nikita/Alexander:** finish the requested FREEL-435 commission/reference
   reconciliation and financial decision. The current diagnostic does not supply
   that missing evidence or close FREEL-435/436.

Previously accepted individual 426/427/429/430/431/433 and paid VELVET evidence
are not reopened merely because this broader campaign is incomplete. Tracker
state and permission to publish remain separate from that statement.

## Retained private evidence

Raw campaign and sealed generation are beneath the frozen owner runtime at
`.local/qa-h003-fix-20260915.FppuIJ/freeland/docs/local/freeland/product-graph/`.
They are private continuation evidence, not required first-use dependencies.

- Desktop independent triage: `.local/freeland-campaign-triage-20260915.view/DESKTOP-TRIAGE.md`, SHA256 `e39224fa43bc92760d3c5c1680a7e92ca80e7939b03acda23ed01c2bcf3e9fa8`.
- Mobile/replacement independent triage: `.local/freeland-mobile-replacements-triage-20260915.mixed-aqa/MOBILE-REPLACEMENTS-TRIAGE.md`, SHA256 `28bcdabb874ee1cbd691f72728481f1f90fa454ad20f1f9954c995344cba9839`.
- Migration/static audit: `.local/freeland-product-diff-audit-20260915.view/LEAD-AQA-PROD-DIFF-AUDIT.md`; its historical QA-H003 blocker is superseded by the reviewed repair, not by overriding the verdict.
- Final cold root: `.local/qa-h003-final-cold-20260915.5w8EOs`, exact delivery tree `71b7c5b624fe417a97b81a11359e6cd47c9064c6`; root test log SHA256 `a2702ed0a2cbd45f252bbe03248cca72a8a2cfb8e4f364a472232174d288f950`.

No blanket product PASS, exhaustive coverage claim, new tracker delivery,
production release approval or cloud qualification follows from this record.
