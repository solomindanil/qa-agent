# NuanuFlowQA

**Agent-driven QA platform.** Resolve the product and active QA owner, verify it with available browser/API/Playwright capabilities, report evidence, and record confirmed bugs in the product-selected tracker when authorized.

Two modes, shipped as Claude Code skills and Codex-compatible project skills:

| Mode | Skill | What it does |
|------|-------|--------------|
| **Check** | `/qa-check` / `$qa-check` | Resolve registration/workspace, environment, active owner checkpoint and current specialist first; hand off to its pack, or use safe generic browser/API/Playwright QA and report verified, failed, blocked and unassessed scope |
| **Bugfix** | `/qa-bugfix` / `$qa-bugfix` | Pulls open bugs from Linear, clusters them by root cause (merge where one PR fixes several, split where risk differs), and generates a self-contained fix prompt per cluster — paste it into your product's coding agent |

## Quickstart

```bash
git clone <this repo> && cd NuanuFlowQA
npm install
npx playwright install chromium
cp .env.example .env          # fill in your product's URL (+ test account)
```

MCP servers ship preconfigured in `.mcp.json` for Claude Code — when you first open the repo in Claude Code it will offer to enable them:

- **linear-server** (for `/qa-bugfix` and explicitly Linear-backed products) — authorize once via OAuth when prompted (or run `/mcp`)
- **chrome-devtools** (browser for recon and bug screenshots) — requires Chrome installed; runs via `npx chrome-devtools-mcp@latest`

(Manual alternative: `claude mcp add --transport http linear-server https://mcp.linear.app/mcp`.)

The legacy `npm run codex:install-skills` command is retired: it exits without installing anything, so older repository skills cannot overwrite the current local versions. Do not bulk-copy this repository's `skills/` directory into either host's skill folders. Resolve the selected project's current reviewed skill source and installation procedure first. On this configured machine, `~/.codex/qa-workspaces.md` is a locator for accepted sources; it is not part of a portable checkout. If no current registration/source is available, establish it before installation rather than falling back to this legacy copy script. A separate, authorized selective installation should preserve a backup and verify the installed bytes. Browser QA can use the host's available browser tools or Playwright; tracker setup follows the selected product's instructions.

Add a generic Linear/Playwright product to this legacy repo:

1. Copy `tests/_template/` → `tests/<product>/` (specs are ready-made patterns: SPA hydration waits, locale-agnostic selectors, viewport matrix).
2. Set `<PRODUCT>_BASE_URL` (+ `_TEST_EMAIL`/`_TEST_PASSWORD`) in `.env` and register the project in `playwright.config.ts` (one-liner, follow the pattern).
3. Copy `docs/templates/TEST-CASES.md` → `docs/local/<product>/TEST-CASES.md`.
4. Create a Linear project for the product; add a `Bug` label + product-area labels to the team.

Then open Claude Code or Codex in this repo and run `/qa-check`/`$qa-check`. The skill first resolves any existing QA Starter workspace or specialist pack; it uses this legacy setup only for an unclaimed generic product. When a Linear backlog has bugs, run `/qa-bugfix`/`$qa-bugfix`.

```bash
npm test                                  # all configured products
npx playwright test --project=<product>   # one product
```

## How bugs are filed

For an explicitly Linear/Playwright product, tickets use `templates/bug-report.md` and a `test.fail()` regression when the writable harness is in scope. `/qa-check` otherwise follows the selected product pack and tracker contract. Report-only QA creates no tracker side effects; authorized writes dedupe and read back persisted state. An unexpected regression PASS starts verification of the assertion, fixture, original reproduction, candidate and environment—it does not prove FIXED by itself.

## How fix prompts work

`templates/fix-prompt.md` produces prompts that are self-contained (zero context assumed), evidence-first (exact strings and endpoints so the agent can grep its way to the code), with acceptance criteria as a checklist and capability-adaptive recommendations (subagents, browser tools, Linear MCP — used if the executing agent has them).

## Layout

```
skills/             qa-check + qa-bugfix canonical project skills
.claude/skills/     Claude Code compatibility skills (slash commands)
templates/          bug-report.md, fix-prompt.md
tests/_template/    copy-me starter specs for a new product
tests/<product>/    your per-product suites (gitignored by default for privacy)
docs/templates/     TEST-CASES.md template
docs/local/         your real test cases & product notes (gitignored)
AGENTS.md           Codex project instructions
CLAUDE.local.md     private product context for the agent (gitignored)
```

Local-only by design: product credentials (`.env`), real test cases, per-product specs and agent context never leave your machine.

## Scaling to large products

Templates and config are ready for big suites: Page Objects + fixtures (`tests/_template/pages/`, `tests/_template/fixtures.ts`), an API-layer spec template, a cross-browser matrix per product (`browsers` option in `playwright.config.ts`), one-login-per-run auth via storageState (`authSetup` option), and a ready CI pipeline (`.github/workflows/e2e.yml`: manual + nightly, JUnit + HTML artifacts, sharding hint). Details in the `qa-check` skill, section "Scaling to large products".

## Optional ECC boost

ECC is useful as a local accelerator for Codex (`e2e-testing`, `browser-qa`, `verification-loop`), but NuanuFlowQA does not vendor ECC into this repo. Install ECC skills into your local Codex setup if you want the extra workflows; keep product-specific test suites and credentials local.

## Safety rules

Tests are read-only against real accounts: no purchases, no settings mutations, no real payments, no password-reset emails to third parties. Payment flows are verified up to the external payment step; real-money checks happen only with the product owner in the loop.

## Roadmap

This repo is designed to become part of a larger product — the skills/templates layer is portable and can be packaged for Claude Code, Codex, or an ECC-style cross-harness workflow in a future iteration.

## License

MIT
