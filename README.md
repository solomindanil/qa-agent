# QA agent workspace

This repository delivers source and guidance for agent-led product QA. An agent designs and investigates checks; the selected product pack and existing tools execute bounded work, retain evidence and apply their own verdict rules. It is a source workspace, not a universal runner or a ready-made product session.

## Start from a clone

Prerequisites: Git and Node.js >=22.12. Current reviewed development is on `develop`; read the [current checkpoint](docs/qualification/current.md) and manifest at the revision you actually select. The immutable dated source snapshot is tagged `qa-agent-2026.09.26`, with its own [release record](docs/releases/2026-09-26.md). That tag does not acquire later UI, plan or integration work; the former `codex/stable-20260926` branch is not the current development queue.

```sh
git clone --branch develop https://github.com/solomindanil/qa-agent.git
cd qa-agent
npm run sources:restore
npm run sources:verify
npm test
```

Restore uses local reviewed Git bundles. It creates independent component repositories under ignored `components/` and refuses conflicting or dirty destinations; it does not install dependencies, skills or plugins, contact a product, or acquire credentials. The root test checks source delivery and packaging only. It does not establish browser, component-runtime, product or deployment readiness. Do not infer a component's status from the outer `git status`; use `sources:verify` and its own Git status. Child dependencies and commands are separate, and a child's default `npm test` may start product/browser work.

## Choose the work

For an ordinary QA request, including a product without documentation, start at [Agent entry](docs/getting-started.md#agent-entry-without-changing-installed-skills). The agent preserves the full request, resolves the product and available capabilities, and reports missing prerequisites before dependent execution. No universal full-product launch command or implicit setup is promised. An existing clone or campaign is not automatically switched, reset or migrated by these instructions.

| Need | Read first |
| --- | --- |
| Agent session | [AGENTS.md](AGENTS.md) (or [CLAUDE.md](CLAUDE.md)), then the [current checkpoint](docs/qualification/current.md) |
| New or existing product QA | [Product routing](products/README.md), [source skills](skills/README.md), then the selected complete specialist skill |
| Fresh operator setup | [Getting started](docs/getting-started.md) |
| Architecture and supported boundaries | [Architecture](docs/architecture.md) and [documentation index](docs/README.md) |
| Bug backlog and fix prompts | [qa-bugfix](skills/qa-bugfix/SKILL.md), using the product-selected tracker |
| Current improvement queue | [Roadmap pointer](docs/roadmap/README.md) |

For an unfamiliar product, the general route is `qa-check` → product owner/specialist → product analysis and an authorized plan. Console/Kernel provide the Starter lane; Freeland retains a specialized harness. Other products may have their own frozen pack and campaign owner. No product account, registration, campaign, browser session or execution permission transfers with this repository. Source selection is in the [manifest](sources/manifest.v1.json); an existing campaign's owner selects its runtime. `runtimeAuthority: true` is source ownership, not action authority.

The present source and release evidence qualify bounded capabilities, not every stack, device, journey or product. Report verified, failed, blocked and unassessed scope separately. Historical plans, evaluations and qualifications remain available through the [documentation index](docs/README.md); their dated “next” instructions do not override the current checkpoint.

| Capability | Present boundary |
| --- | --- |
| Source restore/verification and root packaging tests | Supported from a normal Git clone with Node.js >=22.12; no product verdict. |
| Starter Console/Kernel campaign | Local macOS/Linux setup is documented; actual product execution additionally requires the selected pack, private state, dependencies, candidate and authority. No general Windows or cloud claim. |
| Freeland QA | Specialized source and instructions are delivered; existing campaigns retain their frozen owner/runtime and staging/payment restrictions. No live product acceptance follows from restore. |
| Other products, devices and integrations | Analyze and qualify the selected capabilities per product. No blanket support or coverage claim. |
