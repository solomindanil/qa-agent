# Product ownership

| Product | Execution / knowledge owner | Initial action |
| --- | --- | --- |
| Freeland | `components/freeland`, its own product graph, campaign and Release Verdict | Read its full release skill and `docs/local/freeland/AGENT-RUNBOOK.md`; bind a fresh exact candidate. Copied historical current/receipts are not live evidence |
| MagicCard / MagicPay existing pilot | External registered pack; sole live owner task `01a0720c-a6b5-7dc0-b1e0-86527a8f5856` | Read the [second-product checkpoint](../docs/qualification/second-product.md), then resolve current paths/pins/authority from the owner's actual checkpoint. Do not move, re-register, or launch a competing campaign |
| New product / Starter-managed product | `components/console` using pinned `components/kernel` | Read qa-init or qa-product-v0; reuse the existing registered workspace when present. Build a separate product map, graph, rules and data |
| Nuanu / public-auth fixture | Synthetic Console fixture only | Local harness regression material, **not** an accepted live product pack; integrated36-record qualification passed at Console76d00b1; see [exact scope](../docs/qualification/learning-portability.md) |

Use distinct private paths, for example `.local/products/<slug>/workspace`, with an oracle store as a sibling outside that workspace. These are suggestions for **new** state, not permission to move existing managed registrations. Explicit Console state/store/registry variables are required; see [command qualification](../docs/qualification/commands.md).

Do not invent a universal `full` or `ticket` CLI: the Starter agent assembles and validates a plan using the existing campaign API/CLI and actual graph/catalog. Freeland has its own full and ticket routes. Read-only Flow inventory can proceed without runtime evidence; “fixed” requires original-path reproduction and expected dependent outcomes on the candidate.

A complete product review covers known requirements and dependency paths and explicitly reports unknown/unrun paths. Existing Freeland acceptance does not prove a new product, and a source-only graph cannot establish deployment identity.
