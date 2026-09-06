# Product ownership

| Product | Execution / knowledge owner | Initial action |
| --- | --- | --- |
| Freeland | `components/freeland`, its own product graph, campaign and Release Verdict | Read its full release skill and `docs/local/freeland/AGENT-RUNBOOK.md`; bind a fresh exact candidate. Copied historical current/receipts are not live evidence |
| New product / Starter-managed product | `components/console` using pinned `components/kernel` | Read qa-init or qa-product-v0; reuse the existing registered workspace when present. Build a separate product map, graph, rules and data |
| Nuanu / public-auth fixture | Synthetic Console fixture only | Local harness regression material, **not** an accepted live product pack; positive fixture timeout remains open |

Use distinct private paths, for example `.local/products/<slug>/workspace`, with an oracle store as a sibling outside that workspace. These are suggestions for **new** state, not permission to move existing managed registrations. Explicit Console state/store/registry variables are required; see [command qualification](../docs/qualification/commands.md).

Do not invent a universal `full` or `ticket` CLI: the Starter agent assembles and validates a plan using the existing campaign API/CLI and actual graph/catalog. Freeland has its own full and ticket routes. Read-only Flow inventory can proceed without runtime evidence; “fixed” requires original-path reproduction and expected dependent outcomes on the candidate.

A complete product review covers known requirements and dependency paths and explicitly reports unknown/unrun paths. Existing Freeland acceptance does not prove a new product, and a source-only graph cannot establish deployment identity.
