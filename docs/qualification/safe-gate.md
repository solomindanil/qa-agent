# Bounded source CI gate

`.github/workflows/qa-source.yml` is a source-integrity and packaging gate. It is
not a product test, a release verdict, a deployment check, or evidence that a
candidate revision is live.

## Hosted workflow contract

The workflow runs on `pull_request`, `push`, and manual dispatch with one
GitHub-hosted `ubuntu-24.04` job, a 15-minute timeout, and only
`contents: read` repository permission. Checkout does not persist credentials.
The two official actions are pinned to full revisions:

- `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1`
  (`v7.0.1`).
- `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020`
  (`v7.0.0`).

These revisions were resolved from the official GitHub repositories' tag
metadata on 20 September 2026. The workflow selects Node `22.23.1`, matching the
root `>=22.12.0` engine requirement and the local qualification version.
Setup-node's automatic package-manager cache is explicitly disabled.

Each command starts a child process with `env -i`. Only the setup-controlled
`PATH`, `CI=true`, `LANG=C.UTF-8`, and a private `TMPDIR` are passed. The shell
requires an absolute GitHub-owned `RUNNER_TEMP`, applies `umask 077` while it
creates each private directory with `mktemp`, then restores the runner's original
umask before invoking Node. Product URLs, credentials, proxy/npm
settings, `NODE_OPTIONS`, `NODE_PATH`, ambient `GIT_*`, `HOME`, and `CODEX_HOME`
are not forwarded to the selected Node commands. This is environment reduction,
not an operating-system network sandbox or an egress guarantee. Checkout,
setup-node, and GitHub Actions infrastructure can use the network.

## Ordered commands and effects

Run from a normal repository checkout with Git and the committed source bundles.
No dependency install or browser download is required.

| Order | Working directory | Direct command | Boundary |
| --- | --- | --- | --- |
| 1 | repository root | `node tools/workspace.mjs restore` | Intentionally materializes only manifest-selected sources from committed local bundles. It refuses dirty or conflicting children. |
| 2 | repository root | `node tools/workspace.mjs verify` | No-repair verification of bundle digests, exact source identities, trees, modes, and working bytes. |
| 3 | repository root | `node --test tests/*.test.mjs` | Root packaging and hostile-Git/local-fixture controls, including the workflow contract. It does not run a component product suite. |
| 4 | `components/freeland` | `node tools/freeland-main/provenance.mjs --verify .` | Reads and verifies the selected Freeland source provenance manifest. |
| 5 | `components/freeland` | `node --test tests/product-graph/freeland-pay-01-oracle.test.mjs` | Runs the extracted PAY01 method-composition fixtures only; it does not open a browser or contact a product. |

GitHub Actions stops after the first failing step. There is no
`continue-on-error` or `if: always()` path around source verification, so a
verification failure prevents every downstream test step. The focused static
contract test fixes this command order and rejects added npm, Playwright,
publishing, deployment, campaign, or product-network work.

## Qualification boundary

This gate tests the exact Freeland source selected by `sources/manifest.v1.json`.
The source-only oracle step covers PAY01 composition, not the complete mixed
smoke suite. All other smoke controls, including PAY07's actual TypeScript
projection, remain in the normal dependency-backed product-graph test glob;
they are not executed by this no-install gate. A source pin change and its
qualification are separate from migrating any campaign. Oracle results are
source and local-fixture evidence, not live QA acceptance.

The workflow file's contract test is only a static control over declared YAML
steps. It does not prove that GitHub-hosted execution has occurred, that the
runner is isolated from all network access, or that GitHub's service behavior
matches a local host. Full component suites, Console candidate checks/adoption,
live products, product endpoints, registrations, secrets, browsers, publishing,
and deployment remain outside this gate and unqualified by it.
