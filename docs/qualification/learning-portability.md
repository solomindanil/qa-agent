# Learning, continuation and portability — integrated local qualification

2026-09-07. Candidate Console `76d00b174f1e74a79a1c88d93a1e227d48489979`, based on `b38a8b48cf7dd1646998b3d98427efd99a59d14f`, with unchanged Kernel393. This records **test-only preservation and qualification of existing APIs**, not a new general-purpose learner, runtime adapter or cloud service. Adoption and the aggregate gate are recorded separately below.

## What the three slices prove

| Slice | Actual exercised behavior | What it does not establish |
| --- | --- | --- |
| G3 — human help | Independent work executes while another check is blocked. A fresh process rereads readiness and executes only the remaining plan. A false “ready” signal does not run it; a wrong final response fails the unchanged oracle | Real person/device handoff, exactly-once execution, automatic wakeup, or a cumulative sealed PASS |
| G4 — learning | An actual failed loopback run creates a dossier. A fixture-authored proposal uses its bytes as provenance; supported review/publication changes the graph/catalog and next plan. That identical plan fails on the known marker leak and passes when fixed, retaining three blockers | Automatic general-purpose test design, a Kernel-enforced provenance origin, real product regression coverage or a fresh-host trial |
| G5 — pack portability | A byte-preserving copy of a managed pack in a different directory is validated and consumed by the actual CLI. Receipt and artifacts appear only in the receiver; original files remain unchanged. Symlink/hardlink copies are refused | Transfer of registration ownership, private approvals, account sessions, source dependencies, publishing authority or cloud credentials |

These exercises reuse the existing Kernel publication/validation and Console plan/runner/receipt APIs. Test-local callers are explicit orchestration, not an additional production engine. Known fixture markers are narrow oracles, not proof of absence of every data leak.

## Reviewed source

Six changed files, `1603 insertions / 1 deletion`; runtime `src`, `server`, `scripts`, package/lockfiles and source authority remain byte-identical to b38. Full diff SHA-256: `efb9383810f0ecd5137796bf301ca19804200f35a670ba20bffb9e9bbc57c559`.

| Independently reviewed donor | Integrated commit | Scope |
| --- | --- | --- |
| `3b701887412cd7a0974a31e1dd2db43abdd54fa4` | `33c5047` | Three human-help fixture/test files |
| `d6c8ba65ca76d883b10888f852c823ebcde2f7d4` | `7311c91` | One managed-pack portability test |
| Type-only follow-up | `d3e21ae` | Explicit string type fixes TS7022; emitted JavaScript is exactly identical, SHA-256 `d09e5a6cd06ff9d417ae36e8e5e5e69a159f7e8f24fea4837debaf5949575847` |
| `02ce36666f0f5ba876fc81b3cd68d8dc6001447c` | `76d00b1` | Public-auth fixture/test dossier→regression extension |

Lead AQA independently checked merged source and shared fixture isolation. The composite public-auth parent now has an explicit300s budget for its additional steps; child120s is unchanged. Existing assertions were not removed. Observed durations do not establish a measured performance improvement or host-load multiplier.

## Executed evidence before the aggregate gate

- G3/G5 combined: **10/10 TAP records, exit0, no failures/skips/cancellations**,158.545s, in the root's isolated integration. Parents and negative harness controls count as TAP records, not product scenarios.
- Targeted strict TypeScript over all three affected tests: exit0. This is not a broad application build.
- G4 donor: **8/8 TAP records**,164.129s total. Independent audit verified67 manifest members, four canonical receipts and33 artifacts; reconstructed graph/catalog/plan bindings matched. Actual publication preview contained14 updates and17 unchanged entries.
- In G4, the unchanged regression plan `sha256:3b8134f6117481e3b59324d6e9329186ea9221274469924ff8b5c7b3162f6a16` yielded two confirmed fixture failures on the leak and two passes on the fix. Both retained three blocked targets; the fixed verdict remained `NEEDS_HUMAN`.
- Wrong oracle structure, stale publication, stale plan CAS and old-plan execution were refused. Old-plan controls made zero adapter calls and left the request count9→9. Historical receipts remained separate and unchanged under the passing test assertions.

G4 initial RED and original baseline were retained, not overwritten. The first failure was an incorrect negative-control expectation in the test, not a product bug. Root and Lead AQA reviewed the corrected control before the one subsequent green run.

Private evidence remains under `/private/tmp/qa-console-g3-g5-integration.j41hn1/qualification.bpZeGK/` and `/private/tmp/claude-g4-vertical-FpymJ8/`. G4 TAP SHA-256 is `f58eaef631561ef0a1d275f732bf2012b3b39485d116e5398704aec105dc1d3c`; corrected report is `e2cd24825f08ef2bac7db570e1020d6d1b7e5eec1165c4bbb3fdd2b7046b15fa`. Receipts and private paths are not portable ownership grants.

## Aggregate and adoption checkpoint

The six-file aggregate completed **36/36 TAP records, exit0, no failures/skips/cancellations**,462.557s. It used an isolated Console/Kernel pair with dedicated temp/output state, clean inherited environment and sequential test-file execution. The selected files were authored-fixture-authority, kernel-fixture-authority, nuanu-authored-revision, public-auth-authored-revision, human-help-continuation and managed-pack-portability. Source remained clean at exact76d00b1; Kernel stayed393.

Raw aggregate: `/private/tmp/qa-g345-integrated-gate.lsXc3L/integrated.tap`, SHA-256 `9f1adf3f62b5c153f1571215c1962f99114d121031f5271ad67b953ca50073f3`. This supersedes no historical result: the earlier22-record gate belongs to b38, the10-record gate preceded G4/type annotation, and this36-record gate exercised the complete candidate.

The complete replacement Console bundle has SHA-256 `657c1659d93a946ce03a10dd43c231a72cf007b6e4e93219659e2c12d93a66b8`, tree `d9d2d53d89559abeb6e99087f1b50e285bac3faf`. Independent verification found complete matching history:1537 objects,113 commits,156 tracked files matching their Git blobs, baseline b38 retained as ancestor. Bundle verification and `git fsck --full` passed. Source review SHA-256: `c5b71c19c567c80701407f4ae606dfce8bda78a36ce694add30724c17242bfae`.

The exact staged delivery tree `f41054e3e9e8f6208975a9aa28049213273a27da` was exported to `/private/tmp/qa-g345-bundle.HpwQEX/cold-root`, initialized with an empty normal Git database and no dependencies. Its own `restore` and `verify` returned all four expected pins. Root packaging tests then passed **47/47, exit0**, no failures/skips/cancellations,28.167s. These are source-packaging controls, separate from the36 Console records and the six Freeland live observations. Attempting restore from the implementation Git worktree was correctly refused with `GIT_STORAGE`; the supported deployment root is a normal checkout.

The manifest selects the new Console; other source pins and authority flags are unchanged. This final evidence paragraph follows the exported tree; source bundles/tools are unchanged from that cold proof. The live MagicCard owner completed its separate publication/CAS and explicitly yielded a source-update boundary. No product registration, account, profile or campaign history is migrated by this source-only adoption. Remote publication is not claimed by these local gates.

All three global milestones remain partial where they require actual human/host handoff or broader product applicability. See [capabilities](capabilities.md) and the [roadmap](../roadmap/README.md). Cloud execution is outside this qualification.
