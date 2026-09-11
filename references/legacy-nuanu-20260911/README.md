# Legacy Nuanu sources — private, inactive

These **269 indexed snapshots** were copied and read back on 2026-09-11: 243 committed source files, 25 separately attributed working-overlay files and one dated source audit. Their total indexed size is 5,950,777 bytes. The [manifest](manifest.json) records exact source commits, original locators, byte lengths and SHA-256 digests. This README and the manifest are archive metadata, not additional source snapshots.

All source snapshots end in `.txt`, including historical READMEs, skills, package files and CI configuration. They are **not current instructions, installed skills, active tests, a scheduled workflow or executable components**. Do not unpack them into a current runner or treat historical source identities as today's product/account authority.

| Source group | Exact donor HEAD | Committed snapshots | Working snapshots | Working deletions | Why retained |
| --- | --- | ---: | ---: | ---: | --- |
| Universal QAH / PayDemo | `58a8182ad6a5a9a90891dc50fe4386e5f999242f` | 110 | 0 | 0 | Closed four-branch contracts, controlled PayDemo/environment custody and native Flow worker/proof-gate lessons |
| Nuanu App foundation | `7be0e9b33a0f48c3fddb136e4f5cabb77a5704f2` | 64 | 11 | 0 | Product-specific graph, analytics/privacy contracts, outbox and unqualified journal/semantic-settle work |
| Nuanu Flow product E2E | `2d9ac2ae890d7f6090bbcdc2e4faa20d3d0a24f5` | 61 | 7 | 3 | Broader historical product journeys, response ownership, cleanup, accessibility and observational performance |
| Acceptance boundary experiment | `35b33028fbb029e1775f0d285564ebb37061ed2e` | 8 | 7 | 0 | Pre-merge versus deployed-acceptance rationale and unapproved automation drafts |
| [Source audit](reconciliation-audit/LEGACY-NUANU-AUDIT.md.txt) | Uncommitted dated review | — | — | — | One independent scope/disposition report, not a product result |

The audit's original 256-file denominator predates the approved 12 source/notice additions and its own one-file inclusion. Its historical bytes are unchanged. Committed snapshots represent each donor's exact HEAD, not a declaration that the source is accepted or currently running. `*-working-overlay` directories contain separately hashed modified/untracked bytes with `sourceCommit: null` and the recorded base commit. They have not been functionally qualified or promoted over committed snapshots.

## Commit ledger and explicit retirements

The manifest includes every commit hash, parent list and subject in the four tip ranges outside base `6274b6d51ebabde6092e8123fbf130c1779e651e`: 86 + 57 + 39 + 6 = **188 unique commits**. These four ranges are disjoint, but other reconciliation archives contain shared history. QAH includes seven Freeland source-access bootstrap commits already represented elsewhere and the six-commit PayDemo chain ending `554861145fd0584ce68722f80ef075d481e2d4ae`; PayDemo is not an extra independent range.

This ledger is an inventory, **not a full Git bundle or preservation of every historical blob**. The source selection is **not a standalone executable dependency closure**; common helpers/configuration and pinned external worker dependencies may remain outside it. Original donor repositories remain untouched.

Three Nuanu Flow working-tree deletions are retained as explicit manifest tombstones:

- `tests/nuanuflow/authenticated/mcp-parity.spec.ts`;
- `tests/nuanuflow/fixtures/mcp-client.ts`;
- `tests/nuanuflow/mcp-client-safety.spec.ts`.

Their committed HEAD bytes are historical snapshots only. The dirty plan retires the custom repository-local MCP transport in favor of the official host plugin. Do not resurrect those files as active code when consulting this archive.

One earlier QAH adapter was already absent at HEAD: `scripts/qah/nuanu-install-adapter.mjs`, added in `9b404d6` and removed in `5d6ffcc` in favor of direct install preflight. Its retirement is recorded in the manifest; its superseded blob is not copied here.

## Privacy, notices and exclusions

This is an authorized **private historical source archive**, including operational metadata. Some source fixtures/plans contain real historical run, workspace, project, agent, binding, template and state identifiers and machine-local paths. Such identifiers and embedded mutation instructions grant no current access or execution authority. The inspected PostHog fixtures are synthetic; source-specific samples are not generic test data or permissions.

The allowlist excludes all `.env`/`.env.example` files, authentication/session/storage-state files, private `docs/local` payloads, raw provider captures, generated test evidence, node_modules, application binaries and external/TECT source trees. Exact secret-format scanning and a targeted privacy review found no credential payload in the selected content; this is not complete DLP, public-release sanitization or a third-party provenance assessment.

Each of the four committed source groups includes its full root `LICENSE.txt`: MIT, Copyright (c) 2026 Danil Solomin. The notices are attribution, not a claim that every external dependency is licensed identically. The separate [reconciled archive](../reconciled-20260911/README.md) received its own source-access-bootstrap notice without changing its original 121 snapshot bytes. No license grant is invented for other donors lacking a tracked notice.

To reuse any capability, first identify a current gap and the existing execution/knowledge owner, review the complete relevant contracts and dependency closure, establish fresh permissions and identities, then integrate and independently qualify a bounded change. This preservation ran no product tests, live workers, tracker writes, process activations, payment flows or deployments.
