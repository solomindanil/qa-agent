# P0.1: pinned-source authority repair —17September2026

Status: independently reviewed source candidate, cold-restored and focused-tested. Not manifest-selected, not a new product verdict, not cloud qualification. The root delivery files described below are still working-tree changes, not a pushed release.

## Portable candidate

- Console base: `66ac7db55a25f56b199b2cb00ad83df3b8dad868`.
- Console candidate: `bb9b739822d3302b525007949c2ee9854843bd5a`.
- [Complete-history source bundle](../../sources/candidates/console-p0-authority-bb9b739.bundle), SHA-256 `b17d3b2dfaaa4b2af1a765e26e2b4e9cd81bbbf218c95e07f54590248b6379bb`.
- Kernel authority remains `185d3e72309a4362db57cf2e805d1c00a5035909`; use its already delivered selected bundle. No Kernel source changed.

The candidate can be reconstructed from repository files without the author's private checkout or dependencies. Restore it into a new independent destination, not over a selected component or running campaign.

## Defect and scope

Console's `gitBytes` inherited Git replacement interpretation. A replacement commit or blob could preserve the nominal pinned HEAD while making source comparisons accept substituted content. The owning wrapper now sets `GIT_NO_REPLACE_OBJECTS=1`. Existing pins, checked paths, ordinary dirty-source classification and read limits are unchanged. Harmless replacement metadata with correct bytes remains acceptable.

Files changed: `server/kernel-authority.mjs` and `tests/unit/kernel-replace-authority.test.ts`. The new test imports the actual authority API, uses disposable real Git clones and never builds/imports a substituted Kernel package.

## Evidence actually observed

| Gate | Result |
| --- | --- |
| Untouched baseline, real commit/blob replacements plus controls | Exit1;5/7 passed; the two replacement cases failed with Missing expected exception |
| Fixed candidate | Exit0;7/7 passed, zero failures/skips |
| Independent Lead AQA exact-commit review | Spec compliant; quality approved; no findings |
| Bundle verify | Complete history; expected commit present |
| Main cold Console + cold Kernel restored independently from repository bundles | Focused authority test exit0;7/7, zero failures/cancelled/skips |

Focused command from the reconstructed Console is `QA_STARTER_REPO=<absolute-cold-kernel> node --test tests/unit/kernel-replace-authority.test.ts`, using Node22.23.1. Controls cover exact healthy source, malicious commit replacement, malicious blob replacement, harmless same-tree replacement, dirty/staged bytes, symlink authority and wrong configured SHA. Both cold sources remained clean. The canonical selected sources remained unchanged.

This is scoped source behavior and portability, not full Console unit/build/Playwright or product acceptance. Full integration and source adoption remain pending. Findings-write containment (P0.2), payment-oracle correspondence (P0.3), safe command/CI gate and P1 observation storage are separate tasks. Installed skills and campaign ownership were not migrated.
