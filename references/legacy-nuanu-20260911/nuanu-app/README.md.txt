# NuanuFlowQA

**Agent-driven QA platform.** Point it at your web product and let a coding agent (Claude Code) hunt bugs, file them to Linear with screenshots, and generate ready-to-paste fix prompts for whatever agent maintains your product's codebase.

Two modes, shipped as Claude Code skills:

| Mode | Skill | What it does |
|------|-------|--------------|
| **Check** | `/qa-check` | Recon → test matrix (landing, auth, core flows, payments, i18n, 404, responsive on 320–1440px) → Playwright specs → every confirmed bug filed to Linear with screenshots → `test.fail()` regression test per bug |
| **Bugfix** | `/qa-bugfix` | Pulls open bugs from Linear, clusters them by root cause (merge where one PR fixes several, split where risk differs), and generates a self-contained fix prompt per cluster — paste it into your product's coding agent |

## Quickstart

```bash
git clone <this repo> && cd NuanuFlowQA
npm install
npx playwright install chromium
cp .env.example .env          # fill in your product's URL (+ test account)
```

MCP servers ship preconfigured in `.mcp.json` — when you first open the repo in Claude Code it will offer to enable them:

- **linear-server** (bug tracker for both modes) — authorize once via OAuth when prompted (or run `/mcp`)
- **chrome-devtools** (browser for recon and bug screenshots) — requires Chrome installed; runs via `npx chrome-devtools-mcp@latest`

(Manual alternative: `claude mcp add --transport http linear-server https://mcp.linear.app/mcp`.)

Add your product:

1. Copy `tests/_template/` → `tests/<product>/` (specs are ready-made patterns: SPA hydration waits, locale-agnostic selectors, viewport matrix).
2. Set `<PRODUCT>_BASE_URL` (+ `_TEST_EMAIL`/`_TEST_PASSWORD`) in `.env` and register the project in `playwright.config.ts` (one-liner, follow the pattern).
3. Copy `docs/templates/TEST-CASES.md` → `docs/local/<product>/TEST-CASES.md`.
4. Create a Linear project for the product; add a `Bug` label + product-area labels to the team.

Then open Claude Code in this repo and run `/qa-check`. When the backlog has bugs, run `/qa-bugfix`.

```bash
npm test                                  # all configured products
npx playwright test --project=<product>   # one product
```

## How bugs are filed

Every ticket follows `templates/bug-report.md`: `[BUG]` title, `Bug` + area labels, priority = severity (rubric included), steps / expected / actual / evidence / environment, mandatory screenshot uploaded via Linear MCP. Every bug gets a `test.fail()` regression test annotated with the ticket ID — when the fix ships, the suite flags it automatically.

## How fix prompts work

`templates/fix-prompt.md` produces prompts that are self-contained (zero context assumed), evidence-first (exact strings and endpoints so the agent can grep its way to the code), with acceptance criteria as a checklist and capability-adaptive recommendations (subagents, browser tools, Linear MCP — used if the executing agent has them).

## Layout

```
.claude/skills/     qa-check + qa-bugfix skills (slash commands)
templates/          bug-report.md, fix-prompt.md
tests/_template/    copy-me starter specs for a new product
tests/<product>/    your per-product suites (gitignored by default for privacy)
docs/templates/     TEST-CASES.md template
docs/local/         your real test cases & product notes (gitignored)
CLAUDE.local.md     private product context for the agent (gitignored)
```

Local-only by design: product credentials (`.env`), real test cases, per-product specs and agent context never leave your machine.

## Scaling to large products

Templates and config are ready for big suites: Page Objects + fixtures (`tests/_template/pages/`, `tests/_template/fixtures.ts`), an API-layer spec template, a cross-browser matrix per product (`browsers` option in `playwright.config.ts`), one-login-per-run auth via storageState (`authSetup` option), and a ready CI pipeline (`.github/workflows/e2e.yml`: manual + nightly, JUnit + HTML artifacts, sharding hint). Details in the `/qa-check` skill, section "Scaling to large products".

## Safety rules

Tests are read-only against real accounts: no purchases, no settings mutations, no real payments, no password-reset emails to third parties. Payment flows are verified up to the external payment step; real-money checks happen only with the product owner in the loop.

## Roadmap

This repo is designed to become part of a larger product — the skills/templates layer is portable and will be packaged (Claude Code plugin) in a future iteration.

## License

MIT
