# Second-product qualification — MagicCard / MagicPay

Checkpoint recorded 2026-09-07. This is evidence of a bounded agent-led workflow on a second product, not full product acceptance and not completion of G1's declarative-campaign exit.

## Existing owner, not a new registration

The live product pack belongs to task `01a0720c-a6b5-7dc0-b1e0-86527a8f5856` ("Agent-first QA MagicCard"). Its existing `restart-20260906` pack includes `workspace/`, planning material outside that workspace, immutable observations, and `CHECKPOINT.json`. Resolve the current absolute paths and runtime/store locations from that owner's checkpoint/handoff. They are private host state, not bundled runtime defaults.

Do not copy just `workspace/`, re-register it in this assembly, change its pins, or start a second live campaign. If the owner cannot be reached, request the checkpoint/path; independent source/fixture work can continue. Existing product payment permissions and credentials do not transfer to another task or product.

## What was verified

| Proof | Verified result | Boundary |
| --- | --- | --- |
| Existing workspace format, active Kernel393 / Consoleb38 | Current public validator accepted the existing publication; Console readers retained graph/catalog counts. The independent audit's 19 manifest members matched, 100983 bytes | Read-only compatibility, not migration, execution, or availability of the old observation-storage API |
| Memory oracle sensitivity | 27/27 expected offline control outcomes; 18 former false-PASS inputs detected | Controlled saved-data mutations, not 27 product scenarios |
| Portable saved-capture replay | Actual two-file wrapper/oracle replay completed 10/10 from a disposable copy without the credential-bearing client | Historical capture, not a new product test |
| Fresh owner-run Memory metadata sample | Six direct HTTP MCP reads, with two scope-validation negatives and four scoped positives; ten assertions passed | One product-scoped Memory metadata slice, not a native-host invocation or Console campaign |
| Independent fresh-sample review | Root and Lead AQA matched three post-run source hashes and nine raw/result hashes; pre/post candidate and selected identity consistent | Post-run byte consistency is not a prelaunch seal |

The fresh capture is `memory-scope-regression-FK3Sim`. Its capability records bracket `2026-09-06T20:27:47.466Z` through `2026-09-06T20:28:54.472Z`, with reported development MCP build `f1518d370d322cccef80a936df8ffc74bae10f55`. The backend build is not attested. HTTP 200 alone was not treated as success: the two intended validation failures are MCP tool-level errors; successful cases were checked against actual scoped payloads.

The checked semantics are missing/conflicting scope rejection, active-site filtering, non-widening template inclusion, a known empty site, exact-item metadata, and absence of enumerated forbidden fields/markers. This does not establish complete leakage detection, cross-account isolation, value release, payments, native-host behavior, or every Memory feature.

## Evidence identities

Private evidence stays with the owner or in the coordinator's ignored qualification directory. Hashes permit exact readback; they do not make artifacts public or attest how they were captured.

| Artifact | SHA-256 |
| --- | --- |
| Workspace compatibility report | `81c70c31c0bc927132340d69ad331bdf5fbee364346c71f888ad692af416a9b3` |
| Root 27-control output | `f29cfb952d6d4534698f5a837f679471640ba6d5899c3c9b71f00f50339a8f9c` |
| Portable historical replay result | `48ec8e6f1bbe734546f6cb0a983ea3072db0811ffcb79986cd172cdc506f3274` |
| Fresh capture result | `35f5d2eb5fde3a18023de8da690d5386bb9a2b6aed4131172165deb81d5e5806` |
| Independent fresh Lead AQA review | `7134d4f6caf8ffcf79cc762573c199ce774f9bd842df3d940c405d586f64d16d` |
| Owner's newer publication readback (`evidence/f151-observation-publication-readback.json`) | `fc6778f9411739eb58733d2a349c204684355846cae3e6917111f33100a0e9b7` |
| Reviewed oracle | `da55e61add62910504029ab94b387ab6a345e2a4fb37e4459831ab023bcc96af` |
| Reviewed replay/live wrapper | `5cc7a81810c7d3e3df6004d9cae88cd556c2ac14be575406a99d3e8a3326dd6f` |

## Preserve the separate coverage inventories

- Audited publication: `sha256:8904609b635c006338af625ec5c6e1d529560df59a83fc5c792474ec3c72741b`; 33 targets, 50 catalog checks, 26 retained graph blockers and 6 unresolved catalog entries. These are different denominators.
- Owner's later saved publication readback: `sha256:93d9f3e18d02049b1e00fa36dd7c1a986049bf94c23e6c70aaa501cbe1de111d`; 57 checks, 33 targets, 26 blockers; 102 stored observations, 7 readable under that publication and 95 historical. That report's count of 2 unresolved entries was restricted to the automated subset: a later direct catalog review found **6 unresolved entries in total**. Root has not independently revalidated all 190 preserved historical files. The seven additions concern other previously captured flows, not adoption of the fresh Memory sample.
- Separate planning inventory: 135 flow families / 711 branches plus 17 source-only candidates and 2 recorded gaps. These are not executed-check counts and must not be summed with catalog entries or observations.

"Current" in an observation store means a publication/strategy binding, not that the product was tested at today's deployment. Re-read the latest owner checkpoint before relying on these counts. Do not delete unrun or unresolved entries to improve the percentage.

## Subsequent public-auth run: separate executor and agent outcomes

The existing declarative executor was actually run on the approved six-assertion plan `sha256:5d165f87134f4c332a76f12d5ac5f2d9a75f704a770bd95a3a5e97f0be61eef7`. It returned `ENV_BLOCKED`: one selected check, two built-in attempts, zero assertion events. The adapter rejected the page's Telegram script and Supabase read as foreign origins. Its receipt `045588947f65373ac312387be168fab9e531d040dcf57a520e3b9970245d366b` was not edited, retried manually or replaced by a pass. This is a demonstrated adapter/environment-authority gap, not a demonstrated product defect.

The sole live owner continued independently with ordinary agent-led browser controls. At `2026-09-06T21:35:46.637Z`, `/top-up` returned200 and redirected to the staging login with one visible empty email input and no known protected panel. Empty/invalid email and sign-in/sign-up tab transitions were checked without an auth POST, OTP, registration or purchase. Result: `PASS_BOUNDED_PUBLIC_AUTH_UI`; root read its result, post-run identity and the saved sign-up validation image. This does not establish positive authentication, OAuth, recovery, keyboard submission, responsive design, or absence of all protected-data leaks.

The browser run observed web revision `c7d3db8d7c0ad094ba34d69cad41e20d125aa518`, MCP `f1518d370d322cccef80a936df8ffc74bae10f55`, API deployment960 with no backend commit attestation. Result byte hash: `2e00f56d651415d109192ef33b2f1aae25c9513ec7c0d3c341b3cf49f6960842`; identity-after: `d5e2a53301dbb2dab935e9f6d88396fb2c819e6e23df22951eb96453ef0c9042`. Raw files remain with the owner under `evidence/public-auth-ui-c7-03/`. The outcome belongs to the agent-led lane, not the declarative receipt.

A strategy-only revision added a scoped adapter blocker while preserving profile, graph, catalog, coverage, all57 catalog relationships,33 targets and51 agent/tool entries. After independent preview review, the sole owner archived the exact old approved plan/approval, applied the supported publication and separately updated the canonical plan with CAS/readback. Current publication is `sha256:fe64df843fa6112df9b21dba00a31d9471b985d4b90d8af9d6b646324abc30ff`; plan is `sha256:61272dd01900d6a56852d6d2c45d766f77c7f419c22ac6e237c603b804ee3b74`. It deliberately has0 executable checks/33 blocked targets in the declarative lane, with no new campaign or erasure of agent-led evidence. Root reread the persisted candidate bytes and the independent final review (`79aefbfafce5f97044fb53179d89fb9d0c160f2936a625d7356060dad9479014`); Kernel validation was valid and old G1/its six artifacts unchanged. This closes the bookkeeping transition, not G1's product execution exit. Cross-origin dependencies require a separately approved capability change, not an untracked profile edit or second registration.

## Next exit, without a second engine

G1 remains partial: the fresh agent-led Memory metadata slice is useful, while real-product `authored plan → existing declarative executor → receipt → reviewed graph revision → changed next plan` has not been accepted for this assembly. The active public-only adapter cannot be represented as an authenticated MCP runner. Historical observations keep their original provenance; Kernel393's missing observation API does not retroactively invalidate them or authorize switching to the reporting sibling.

Continue G2 ticket/dependency checks and G3 human-help continuation independently. Promote only the seam that an actual test demonstrates is missing. No current result establishes full MagicCard QA, a release GO, dual-host acceptance, or cloud autonomy.
