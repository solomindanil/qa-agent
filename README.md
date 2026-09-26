# QA agent workspace

One portable workspace for the existing agent-first QA tools. The agent chooses test design, explores and triages; the existing tools validate inputs, execute bounded checks and retain evidence. This repository does not introduce another runner or verdict engine.

## Start here

Use the `codex/stable-20260926` branch for this release. The immutable source
snapshot is tagged `qa-agent-2026.09.26`. The selected
Kernel/Console/Freeland revisions are pinned in `sources/manifest.v1.json`.
Reviewed development continues on the stable branch while that release tag
stays fixed; see the [continuation checkpoint](docs/qualification/development-continuation-20260926.md).
[Release scope and verification](docs/releases/2026-09-26.md) describe what is
supported and what remains experimental. Existing product campaigns retain
their own checkout and state; a release never migrates them automatically.

```sh
git clone --branch codex/stable-20260926 https://github.com/solomindanil/qa-agent.git
cd qa-agent
```

Prerequisites: Node.js >=22.12 and Git. From a normal Git clone of this public repository:

```sh
npm run sources:restore
npm run sources:verify
npm test
```

Restore uses only the local reviewed bundles. It does not install dependencies, contact a product, install skills or acquire credentials. Conflicting/dirty destinations are refused, not repaired or deleted. Each child keeps its own Git history and lockfile; do not share writable node_modules. See [source inventory](sources/manifest.v1.json), [source proof](docs/qualification/source-delivery.md) and [assembly qualification](docs/qualification/assembly.md).

The root commands restore and verify complete component Git repositories and test only this delivery/packaging boundary; they do not prove that Console, Kernel, a browser lane or any product is ready. `components/` is deliberately ignored by the outer repository, so outer `git status` is not evidence that a component is absent. Use `sources:verify` and the component's own Git status instead. For a fresh operator walkthrough, including explicit private runtime paths, read [Getting started](docs/getting-started.md).

| Need | Entry point |
| --- | --- |
| Codex or Claude session | Read [AGENTS.md](AGENTS.md); Claude starts at [CLAUDE.md](CLAUDE.md) |
| New product / existing Starter workspace | [Product routing](products/README.md), then the full [qa-product-v0](components/console/skills/qa-product-v0/SKILL.md) skill; use [qa-init](components/console/skills/qa-init/SKILL.md) only when registration, registration recovery or a separately authorized I2 review is needed |
| Freeland release, QA column, sprint or ticket | [Freeland skill](components/freeland/skills/freeland-release-qa/SKILL.md), resolving an existing campaign's frozen owner runtime before commands |
| Bug backlog / developer fix prompts | [qa-bugfix](skills/qa-bugfix/SKILL.md), using the product-selected tracker and exact state roles |
| Agent skills / host prerequisites | [Skills index](skills/README.md) |
| Reusable tests and report contracts | [Evals](evals/README.md), [templates](templates/README.md) |
| Current checkpoint and remaining work | [Roadmap](docs/roadmap/README.md) |

Component links resolve after restore. `runtimeAuthority: true` means selected source ownership, not permission to execute or proof that a runtime works. Reporting reference10d is deliberately **not active**. No product accounts, managed registrations or current campaigns are transferred by restore.

Start with [current source and qualification](docs/qualification/current.md). The [cross-repository reconciliation](docs/qualification/reconciliation-20260911.md) explains what was adopted, already integrated, preserved inactive or left with its product owner. The existing product-analysis workflow, receipt-bound agent reviews, interruption fixtures and trace metadata are reused. Source delivery, product coverage, live deployment identity, plugin authentication and release readiness remain distinct qualifications. Earlier results remain attached to their original revisions.
