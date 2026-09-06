# Command and state boundary

Read against Kernel393 / Console432 / Freeland3d, 2026-09-07. Commands below are candidates, not an execution record; actual results live in [assembly.md](assembly.md).

Consoleb38a8b4 and76d00b1 change only fixtures/tests. Their executed gates are recorded in [authored-fixture.md](authored-fixture.md) and [learning-portability.md](learning-portability.md). The latter six-file gate was reviewed and executed in isolation; no broader command or live workflow is implicitly authorized by those results.

## Separate dependencies

Each active child has a separate package-lock. Root has no runtime dependencies. All resolved dependency tarballs in the three root lockfiles use registry.npmjs.org with integrity fields. No root install hook is defined. Transitive esbuild/fsevents packages do define install hooks: initial qualification deliberately uses `npm ci --ignore-scripts --no-audit --no-fund` with a separate cache and no copied owner npm config. This contacts the registry and writes dependencies; it is an explicit assembly step, never bootstrap behavior. Browser downloads are separate and not needed for the selected checks below.

Do not use Freeland `qa:install` for this slice: it provisions a machine-wide coordination directory and installs four packages. Do not share writable node_modules, rewrite lockfiles, or infer lifecycle safety from a lockfile alone.

## Selected source/tool checks

| Child cwd | Command | Scope / local effects |
| --- | --- | --- |
| kernel | `npm run typecheck` | Source/tests TypeScript, no emitted code |
| kernel | `npm run build` | Writes child-local dist |
| kernel | `npm test -- tests/contracts/canonical-json.test.ts tests/contracts/json-preflight.test.ts` | Selected offline contract controls, not full Kernel verification |
| console | `npm run typecheck` | TypeScript roots from src (plus imported dependencies), not a dedicated whole server/scripts check; rewrites tracked tsconfig.tsbuildinfo |
| console | `npm run build` | Child-local Vite output plus tracked tsconfig.tsbuildinfo; not server start |
| console | `node --import tsx --test --test-reporter=tap tests/unit/qa-product-skill.test.ts` | Source skill packaging |
| console | `node --import tsx --test --test-reporter=tap --test-name-pattern='^(validate rejects unknown --dry-run before requiring a workspace|campaign parser )' tests/unit/qa-campaign-cli.test.ts` | CLI parser negatives; filtered tests reported separately |
| console | `node --import tsx --test --test-reporter=tap tests/unit/kernel-fixture-authority.test.ts` | Real local source-pin fixture checks |
| console | `node --import tsx --test --test-reporter=tap --test-name-pattern='^zero executable checks and unauthorized side effects fail before filesystem or adapter effects$' tests/unit/qa-campaign-runner.test.ts` | Admission before effects; not campaign execution |
| freeland | `npm run provenance:verify` | Source-manifest byte verification, no donor access/network |
| freeland | `npm run typecheck` | Existing TS corpus/config, noEmit |
| freeland | `npm run test:freeland-main` | Local temp Git/process doubles, campaign admission and launcher units |
| freeland | `npm run test:freeland-private-preflight` | Local corpus/graph/binding inspection; not live release freshness |

Never substitute default child `npm test`, Console full unit suite, Freeland `qa:verify[:all]` or all replacement/transport suites for this reviewed selection. The broader gates need separate browser/egress/state review; Freeland aggregate includes these broader suites. The default Console Playwright config references owner paths, and its registration config builds Kernel on import. Even `--list` there is not automatically harmless.

Console432 tracks a historical `tsconfig.tsbuildinfo`: normal typecheck/build regenerates it, so source verification correctly reports SOURCE_DIRTY afterwards. Qualify in an isolated clone, or preserve the generated artifact and restore **only this known compiler-produced file** from the exact approved pin with before/after byte checks after work ends. This is not permission to reset other changes or disable the dirty guard. Removing this generated cache from source tracking belongs to the next reviewed Console pin update, not an unannounced assembly change.

## Isolation for qualification

Use explicit canonical restored paths and dedicated `.local/qualification/<run>` outputs/temp/caches. Clear inherited `NODE_OPTIONS`, `QA_WORKSPACE`, `QA_WORKSPACE_ROOTS`, `QA_TEST_ALT_WORKSPACE`, `QA_PRIVATE_TARGET_ORIGIN`, `QA_PRIVATE_TARGET_IPV4` and product credential/URL environment. Never repurpose HOME or CODEX_HOME.

Set `QA_STARTER_REPO` to restored components/kernel and `QA_STARTER_EXPECTED_SHA` to393af209a7629d075258fd1050224db071817a47. Keep `QA_EXTERNAL_GRAPH` and `QA_EXTERNAL_GRAPH_LABEL` empty. Explicitly route all stores:

- `QA_CONSOLE_STATE`: private run-specific receipts.json.
- `QA_CONSOLE_PRIVATE_ROOT`: private run-specific Console root.
- `QA_REGISTRATION_STORE`: private run-specific registration-store.
- `QA_REGISTRATION_TARGET_REGISTRY`: private run-specific registration-targets.v1.json.
- Registration submit idempotency can use a **sibling** of the store; account for that path too. Setting only QA_CONSOLE_PRIVATE_ROOT does not redirect the other stores.
- Private oracle approval store must be outside the managed product workspace; a sibling is appropriate for new workspaces, not permission to move existing state.

Use trusted Node/Git and explicit argv. After dependency provisioning, npm offline flags prevent registry fallback, but are **not** a browser/network firewall. Preserve stdout/stderr, exit, duration and filtered/skipped counts; do not label tool tests product checks.

## Existing product routes (not assembly actions)

Starter `qa-init --answers ... --dry` is offline request preparation. Its I2 `--approve-baseline/--approve-run ... --dry` reads loopback state instead; these are different operations. Registration can build Kernel lazily. Campaign grammar is `prepare`, `generate-baseline`, `approve-oracles`, `validate`, `run`; validate has **no** `--dry-run`. Authored plan and knowledge revision use the existing APIs described by the complete skill, not a new CLI.

Starter campaign run is the public read-only lane. Supplied side-effect authority is refused by its current runner; it is not an auth/payment/native adapter. Full and ticket handling are agent workflows over the graph/catalog and actual capabilities, not separate Starter verbs.

Freeland's full/QA-column/ticket routes live in its release skill. `qa:sprint` itself is local; the agent reads/writes Flow using its official plugin and exact generation/readback rules. Existing `qa:plan` and `qa:run --shadow` must not be launched during assembly. No source qualification establishes product candidate identity or grants payment/Flow/cloud authority.

Source audit reports are retained privately with hashes in assembly.md. Classification is based on the inspected implementation, not a promise of OS-level egress isolation.
