# qa-console

Console for `qa-starter` workspaces: workspace health, live product graph,
QA campaign runs — plus the agent-first path that creates workspaces
through the real kernel.

## Quick start

```bash
npm install
npm run dev        # vite dev server (5173) with the live workspace bridge
npm test           # playwright e2e (11 specs: smoke/journey/intake/i1-console/ownership/findings/recovery/visual/keyboard/hardening/graph-perf)
npm run test:unit  # node:test — intake derivations, graph analysis, live mapping, graph state
```

Standalone (no vite, serves the built `dist/`):

```bash
npm run build
npm run serve -- --workspace /abs/path/to/qa-workspace [--port 8791]
```

## Data sources

- **sample** — fixture "Aurora Store" shaped 1:1 after the qa-starter
  contracts (all screens populated).
- **live** — reads a real workspace from disk through the bridge:
  `qa-project.yaml`, `.qa-managed.json`, `model/*.json`,
  `.qa-private/state.json`. Secrets (`.qa-private/secrets.env`) are never
  read or served. Validated with zod at the boundary
  ([src/lib/live.ts](src/lib/live.ts)) — contract drift fails loudly.

Env: `QA_WORKSPACE` (workspace dir), `QA_STARTER_REPO` (kernel checkout the
CLI runs from; keep it a frozen clone while the kernel repo is actively
edited).

## Bridge endpoints (dev and standalone)

[server/bridge.mjs](server/bridge.mjs) is shared by the vite plugin and
`serve.mjs`:

| Endpoint | Runs |
|---|---|
| `GET /api/workspace` | read-only snapshot: profile, registry (+ownedPaths), state, graph, coverage, test catalog and `testStrategyDraft` (`null` only when the artifact file is absent), findings, transactions (+`activeTransactionDigest` derived from a journal name or an admission-only `.admission.json`), per-workspace receipts |
| `GET /api/workspaces` | discovery of workspaces under `QA_WORKSPACE_ROOTS` (+external-graph availability) |
| `GET /api/external-graph` | an existing product graph (`QA_EXTERNAL_GRAPH`) mapped onto the console vocabulary |
| `GET /api/file-preview` | read-only preview over a fixed allowlist (views/*.md, AGENTS.md, model/*.yaml, qa-project.yaml) |
| `POST /api/cli/validate` | real `qa-starter validate` |
| `POST /api/cli/regenerate-preview` / `-apply` / `recover` | real regeneration incl. transaction recovery (honest `blocked_drift` refusal, kernel `recovery[]` hints surfaced) |
| `POST /api/cli/adopt` | real `qa-starter ownership adopt` |
| `POST /api/cli/init` | intake draft → tmp answers file → real `qa-starter init` |
| `POST /api/findings/create` / `resolve` | findings ledger in the OWNED zone with a token-Jaccard dedup gate (0.45) |

All CLI calls are fixed argv vectors (no shell), serialized by an in-memory
mutex (the reply is held until the mutex is released, so a caller acting on
the response is never bounced with 409). Answers files are written under
`realpath(os.tmpdir())` — macOS's `/var` symlink otherwise trips the
kernel's `SYMLINK_ESCAPE` guard. Reads refuse symlinked targets, mutating
endpoints are same-origin-only, and the findings ledger is capped with the
dedup gate applied to whatever text is actually filed.

## Agent-first intake (`/qa-init`)

Primary way to create a workspace is the conversational skill in
[.claude/skills/qa-init](.claude/skills/qa-init/SKILL.md): interview →
answers JSON → `npm run qa-init -- --answers answers.json --workspace
/abs/path` ([scripts/qa-init.ts](scripts/qa-init.ts)) → real `init` +
`validate`, one machine-readable report. `--dry` prints the derived
intake without creating anything.

[src/lib/intake-build.ts](src/lib/intake-build.ts) reproduces the kernel
derivations (canonical JSON: NFC + sorted keys + trailing newline; sha256
digests; 24-hex `stableId` urns; `sourceId` preimage includes the product
slug), so a valid `recorded-intake.v1` builds for any product. Notable
kernel rules: repository locators must be URLs (filesystem paths are
rejected by design), secret refs are UPPER_SNAKE_CASE names only.

The «New workspace» screen in the UI is the secondary, manual path.

## Screens

- **Overview** — lifecycle stepper, coverage accounting, workspace
  integrity with real validate/regenerate/recover actions and kernel
  recovery hints, declared secret-ref names, adapters, findings,
  persisted receipts.
- **New workspace** — manual intake form with a live recorded-intake
  draft panel (the primary path is the conversational `/qa-init` skill).
- **Graph** — live force-directed canvas (drag, pan/zoom+buttons, hover
  neighborhoods). Post-discovery nodes and edges are rendered as they are
  on disk, with each node's coverage joined from the registry (never
  derived); node coordinates are a deterministic presentation seed, not
  kernel data. Before discovery the canvas shows the declared skeleton and
  the header states the lifecycle, the kernel's next action and who the
  graph is waiting on — there is no `qa-starter discover` command to
  suggest. `pilot:` external
  graph source with edge-derived coverage and a connectivity readout;
  **Impact** traces `affects* → implements → requires → verifies`.
  Scales to real graphs (the freeland pilot is 611 nodes / 1363 edges):
  the simulation writes coordinates straight to the DOM, React renders
  structure only — ~119 fps against 30 before, guarded by
  [graph-perf.spec](tests/e2e/graph-perf.spec.ts).
- **Coverage** — the accounted-coverage map built from the real
  `model/coverage.json` items, grouped by the target node's kind. The
  denominator is exact: a graph coverage target with no registry item, or
  an item naming a target the graph lacks, is reported as a
  reconciliation failure instead of quietly changing the count.
- **Draft plan** — the registration artifact `test-strategy-draft.v1`:
  proposed automated checks, manual/device handoffs, required secret
  **names**, side-effect classes, expected evidence, blockers and
  unresolved oracles. It is not a campaign, carries no results, and is
  accepted only when its profile/graph/coverage/catalog digest bundle
  reconciles with the selected workspace; drift fails the live read closed.
- **Runs** — `Runs: none` until campaign execution ships; the fixture
  campaign lives on the sample source only.
- **Verdict** — `NOT_EVALUATED` with no campaign; projected verdict with
  named release gates and a blocked Accept once one exists.
- **Findings** — owned-zone ledger with the dedup gate in front of
  every create.
- **Files** — managed/owned registry with real adoption and read-only
  previews of kernel projections.

Design reference: the "QA Starter Console" canvas (6 artboards, x.ai-style
dark minimalism + Codex density).
