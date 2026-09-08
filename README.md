# QA agent workspace

One portable workspace for the existing agent-first QA tools. The agent chooses test design, explores and triages; the existing tools validate inputs, execute bounded checks and retain evidence. This repository does not introduce another runner or verdict engine.

## Start here

Prerequisites: Node.js >=22.12 and Git. From a normal Git clone of this repository:

```sh
npm run sources:restore
npm run sources:verify
npm test
```

Restore uses only the local reviewed bundles. It does not install dependencies, contact a product, install skills or acquire credentials. Conflicting/dirty destinations are refused, not repaired or deleted. Each child keeps its own Git history and lockfile; do not share writable node_modules. See [source inventory](sources/manifest.v1.json), [source proof](docs/qualification/source-delivery.md) and [assembly qualification](docs/qualification/assembly.md).

| Need | Entry point |
| --- | --- |
| Codex or Claude session | Read [AGENTS.md](AGENTS.md); Claude starts at [CLAUDE.md](CLAUDE.md) |
| New product / existing Starter workspace | [Product routing](products/README.md), then the full [qa-init](components/console/skills/qa-init/SKILL.md) or [qa-product-v0](components/console/skills/qa-product-v0/SKILL.md) skill |
| Freeland release, QA column, sprint or ticket | [Freeland skill](components/freeland/skills/freeland-release-qa/SKILL.md), using components/freeland as QA checkout |
| Agent skills / host prerequisites | [Skills index](skills/README.md) |
| Reusable tests and report contracts | [Evals](evals/README.md), [templates](templates/README.md) |
| Current checkpoint and remaining work | [Roadmap](docs/roadmap/README.md) |

Component links resolve after restore. `runtimeAuthority: true` means selected source ownership, not permission to execute or proof that a runtime works. Reporting reference10d is deliberately **not active**. No product accounts, managed registrations or current campaigns are transferred by restore.

This branch is the [post-review integration candidate](docs/qualification/post-review-correctness.md), not a promotion of the accepted workspace. It proves only the source-packaging checks actually recorded there; the Kernel full gate still has nine unresolved timeouts. Product coverage, live deployment identity, plugin authentication and release readiness must be assessed for each campaign.
