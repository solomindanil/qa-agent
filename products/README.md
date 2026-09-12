# Product ownership

| Product | Execution / knowledge owner | Initial action |
| --- | --- | --- |
| Freeland | Canonical source `components/freeland`; any existing live campaign retains its own frozen harness/graph/campaign owner | Resolve the active execution owner from the latest `CURRENT` checkpoint, then read its scope, outcomes and next actions plus the release skill/runbook. Preserve paid-operation evidence and unknown outcomes; do not switch its runtime or repeat unresolved invoice/payment actions during source adoption |
| Agentify | Any existing registered workspace and runtime remain selected by their owner checkpoint | Resolve the owner's current checkpoint and retain managed evidence, historical review and unsealed observations separately. No re-registration |
| MagicCard / MagicPay existing pilot | External registered pack owned by its current campaign | Read the [second-product checkpoint](../docs/qualification/second-product.md), then resolve current paths/pins/authority from the owner's actual checkpoint. Do not move, re-register, or launch a competing campaign |
| New product / Starter-managed product | `components/console` using pinned `components/kernel` | Analyze an unfamiliar product with qa-product-v0 before check selection/registration; ask material questions with an investigate-yourself option. Use qa-init only for required registration; reuse existing workspaces. Keep separate product map, graph, rules and data |
| Nuanu / public-auth fixture | Synthetic Console fixture only | Local harness regression material, **not** an accepted live product pack; integrated36-record qualification passed at Console76d00b1; see [exact scope](../docs/qualification/learning-portability.md) |

Historical task IDs and machine-local checkpoint paths may help an existing owner locate old evidence, but they are optional historical data rather than first-use inputs. If that state cannot be resolved, continuation of that exact campaign is blocked; it does not block separately authorized analysis or registration of genuinely new QA work. Do not treat a new workspace as a replacement or migration of the frozen campaign.

Use distinct private paths, for example `.local/products/<slug>/workspace`, with an oracle store as a sibling outside that workspace. These are suggestions for **new** state, not permission to move existing managed registrations. For explicit Console state/store/registry variables, start at [current runtime selection](../docs/qualification/current.md#explicit-runtime-selection) and the manifest-selected Console README. The dated command record is historical, not today's runtime setup.

On this host, `~/.codex/qa-workspaces.md` is a locator index, not a source or deployment authority. Current source guidance is [here](../docs/qualification/current.md); dated absolute paths are historical unless the owner confirms them. Other existing scaffolds (example-web, earlier magicpay, Sati) and product-owned test material are [dispositioned](../references/reconciled-20260911/README.md), not automatically registered or activated by consolidation.

Do not invent a universal `full` or `ticket` CLI: the Starter agent assembles and validates a plan using the existing campaign API/CLI and actual graph/catalog. Freeland has its own full and ticket routes. Read-only Flow inventory can proceed without runtime evidence; “fixed” requires original-path reproduction and expected dependent outcomes on the candidate.

A complete product review covers known requirements and dependency paths and explicitly reports unknown/unrun paths. Existing Freeland acceptance does not prove a new product, and a source-only graph cannot establish deployment identity.
