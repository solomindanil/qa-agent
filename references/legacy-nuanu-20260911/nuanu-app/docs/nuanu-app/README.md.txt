# Nuanu App QA foundation

This is the standalone QA entry point for `https://app.nuanu.com/`. V1 covers
the browser-delivered web application and PWA. Browser emulation is available
for desktop, iPhone-class, and Android-class profiles; physical-device
acceptance remains manual. Native iOS and Android applications are
`OUT_OF_SCOPE` for V1.

The foundation currently contains exactly nine read-only Playwright cases:
the seven legacy shell/safety/evidence cases, one offline runtime-contract
case, and one contract-gated public discovery-control case. They establish
availability plus the mutation, evidence, and selector-contract boundaries;
they do not represent complete product coverage. See [TEST-CASES.md](TEST-CASES.md)
for the exact catalog and [COVERAGE-MAP.md](COVERAGE-MAP.md) for explicit gaps.

## Runtime configuration

The only required runtime variable is:

```bash
NUANU_APP_BASE_URL=https://app.nuanu.com
```

The value must target the approved production origin. The optional
`NUANU_APP_AUTH_STORAGE_STATE` points to an operator-supplied, gitignored
Playwright storage-state file. The current nine foundation cases do
not consume that state and do not enable authenticated coverage.

Additional browser projects are opt-in:

```bash
NUANU_APP_FIREFOX=1
NUANU_APP_WEBKIT=1
NUANU_APP_MOBILE=1
```

`NUANU_APP_MOBILE=1` adds Pixel 5 Chromium and iPhone 13 WebKit emulation. It
does not turn emulation into physical-device evidence.

No product credential or analytics credential belongs in a command, example,
tracked file, graph artifact, test attachment, or chat transcript.

## Graph-first runtime campaign

Run these commands in this exact order. Planning is dry-run only; the CLI has
no execution flag.

```bash
npm run nuanu-app:graph -- init
npm run nuanu-app:graph -- runtime --url https://app.nuanu.com
# separately review the private capture plan, run the authorized
# selector-observe command, review bindings/candidate, and accept the contract
npm run nuanu-app:graph -- validate
npm run nuanu-app:graph -- plan --runtime-only --dry-run
```

`validate` does not infer or create selector evidence. It requires the fixed
reviewed capture plan, selector observation, bindings, and separately accepted
runtime contract. `selector-observe --url https://app.nuanu.com` is the only
selector-evidence producer command and requires its separate live preflight review and
authorization; `contract-candidate` is offline and never promotes the accepted
contract. A legacy canonical four-digest graph is migrated only by an explicit
`validate --refresh` after all current contract inputs attest successfully.

`plan-commit.json` is written last and attests the graph, impact, and test-plan
digests. Do not consume `impact.json` or `test-plan.json` unless the final
marker exists and matches them.

Private state is fixed beneath `docs/local/nuanu-app/`:

```text
product-graph/mappings.v1.json
product-graph/selector-capture-plan.v1.json
product-graph/selector-bindings.v1.json
product-graph/current/runtime-catalog.json
product-graph/current/runtime-selector-observation.v1.json
product-graph/current/runtime-contract.candidate.v1.json
product-graph/current/runtime-contract.v1.json
product-graph/current/source-lock.json
product-graph/current/graph.json
product-graph/current/impact.json
product-graph/current/test-plan.json
product-graph/current/plan-commit.json
product-graph/snapshots/
```

The private tree is gitignored. `init` creates only the product-graph
directories and starter mappings. Runtime observation and later commands
write only their documented private artifacts.

## Optional source-aware campaign

Source inspection is read-only. Supply a clean absolute checkout using a
shell-local `SOURCE_REPO`; the remote must be the approved upstream and the
checkout must not resolve through a symlink. The validation command depends on
whether a graph already exists.

### Intentional switch from an existing valid graph

Use this sequence when a prior valid runtime graph already exists and adding
`source-lock.json` intentionally changes its inputs. This executable example
plans the immediate-parent-to-HEAD diff:

```bash
SOURCE_REPO=/absolute/path/to/clean/nuanu-web
npm run nuanu-app:graph -- source-lock --repo "$SOURCE_REPO"
npm run nuanu-app:graph -- validate --refresh
npm run nuanu-app:graph -- plan --repo "$SOURCE_REPO" --from "$(git -C "$SOURCE_REPO" rev-parse HEAD^)" --to "$(git -C "$SOURCE_REPO" rev-parse HEAD)" --dry-run
```

The lock and its mapping digest are graph inputs, so ordinary `validate` after
this intentional mode switch fails closed as `STALE_GRAPH`. `--refresh` is the
explicit authority to replace that legitimately stale graph. It requires an
existing canonical, self-valid, product-correct Nuanu App graph with a
self-consistent digest. It still validates current mappings, runtime catalog,
source lock, test discovery, graph paths, and product namespace. It returns
`MISSING_GRAPH` when the graph is absent and `STALE_GRAPH` for corrupt,
noncanonical, foreign-product, or digest-inconsistent stored graphs. It cannot
launder malformed artifacts.

### Fresh source-aware state with no graph

Use ordinary `validate` when the canonical graph does not exist yet:

```bash
SOURCE_REPO=/absolute/path/to/clean/nuanu-web
npm run nuanu-app:graph -- init
npm run nuanu-app:graph -- runtime --url https://app.nuanu.com
npm run nuanu-app:graph -- source-lock --repo "$SOURCE_REPO"
npm run nuanu-app:graph -- validate
npm run nuanu-app:graph -- plan --repo "$SOURCE_REPO" --from "$(git -C "$SOURCE_REPO" rev-parse HEAD^)" --to "$(git -C "$SOURCE_REPO" rev-parse HEAD)" --dry-run
```

Do not use `validate --refresh` in fresh state: refresh requires the existing
valid graph it is explicitly replacing and otherwise returns `MISSING_GRAPH`.
For a different baseline, replace `HEAD^` with an approved Git revision that
expands to a full lowercase 40-character commit SHA. The `--to` SHA must equal
both checkout HEAD and the persisted source lock.

The source lock proves only which clean checkout was inspected. It does not
prove which commit is deployed at `app.nuanu.com`. Source-derived and
runtime-observed provenance remain separate throughout validation and
planning.

## Browser execution

List the cases before running them:

```bash
NUANU_APP_BASE_URL=https://app.nuanu.com npx playwright test --list --project=nuanu-app
NUANU_APP_BASE_URL=https://app.nuanu.com npm run test:nuanu-app
```

The default project is Chromium. Opt-in projects can be selected explicitly
after their browser engines are installed. Every result belongs to one
recorded run; documentation never assigns an evergreen `PASS`.

## Safety and evidence boundary

The live product smoke test installs the request guard before its product
navigation. The guard permits only `GET`, `HEAD`, and `OPTIONS` requests
visible to Playwright routing and aborts other methods before network
dispatch. This is a per-test control, not a global guarantee for code that
omits the fixture.

Default screenshots, traces, and videos are disabled for every Nuanu App
project. Current structured observations retain only bounded console markers,
sanitized URLs without query or fragment data, and bounded first-party 5xx
URLs. They do not collect request or response bodies, headers, cookies, or
browser storage.

Portable Node does not expose `openat`/`renameat`. Private JSON I/O fully
checks containment and symlinks at every observable phase and defends all
hook-visible races covered by the test suite. It does not claim protection
against a hostile same-UID peer that wins an unobservable pathname-syscall
micro-window. The local repository and private-root parent chain are therefore
trusted administrative boundaries.

No command in this foundation pushes upstream, changes product data, creates
cloud work, or files a defect. Missing runtime observation, missing reviewed
mappings, missing graph, stale attestations, invalid source identity, or
unavailable browser engines remain explicit blockers; they are never converted
to a passing result.
