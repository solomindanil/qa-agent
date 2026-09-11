# Nuanu Flow E2E QA design

Date: 2026-07-26
Target: `https://flow.nuanu.com`
QA tracker: Nuanu Flow workspace `nuanu-flow-qa`, project `nuanu flow qa` (`NUANU`)

## Context

NuanuFlowQA is a TypeScript and Playwright harness with one dynamically enabled Playwright project per product. It already contains private suites for Freeland and MagicPay, but Nuanu Flow has no Playwright project, product specs, or local test matrix.

Read-only recon confirmed that the Nuanu Flow sign-in, sign-up, Terms of Service, and Privacy Policy pages load successfully. The sign-in form prevents submission of malformed email input, and the page has no horizontal overflow at 320, 375, 768, 1024, or 1440 pixels. A guest request to `/be/api/users/me/` returns `401`; this is an expected session probe and must not be filed as a defect by itself.

The Nuanu Flow MCP connection is available at `https://flow.nuanu.com/mcp-server/mcp`. Read-only verification confirmed workspace `nuanu-flow-qa`, project `NUANU`, default state `Backlog`, and support for issue creation, issue reads, labels, and screenshot attachments. Linear is out of scope.

## Goals

1. Add a safe, deterministic public E2E suite for Nuanu Flow.
2. Record a living test matrix for public and authenticated coverage.
3. Distinguish product defects from expected guest-session behavior and test artifacts.
4. File every confirmed defect in project `NUANU` through Nuanu Flow MCP with evidence and a screenshot.
5. Add a `test.fail()` regression test that asserts the correct behavior for every filed defect.
6. Prepare an authenticated read-only phase that can be enabled when dedicated UI credentials are available.

## Non-goals and safety constraints

- Do not use Linear.
- Do not commit API tokens, UI credentials, storage state, screenshots containing credentials, or personal data.
- Do not create accounts, invite users, submit password-reset requests, modify workspace settings, or create/update/delete product data during E2E runs.
- This product-data restriction does not prohibit the explicitly requested QA tracker mutations in project `NUANU`: labels, confirmed bug issues, evidence attachments, verification comments, and post-fix status changes.
- Do not treat the expected guest `401 /be/api/users/me/` response as a failed network request.
- Do not test destructive or irreversible flows without separate explicit authorization and a safe test environment.
- Do not file an issue until the behavior is reproduced in a fresh browser context and test-environment, timing, locale, and rollout causes are excluded.

## Architecture

### Playwright configuration

Add `NUANUFLOW_BASE_URL` to `.env.example` and register `nuanuflow` through the existing `product()` helper in `playwright.config.ts`. The real URL remains in the gitignored `.env`.

The first project has no auth dependency, so public checks can run without UI credentials:

```text
nuanuflow
  tests/nuanuflow/*.spec.ts
```

When dedicated credentials are available, add a separate authenticated setup/project pair instead of making public tests depend on login:

```text
nuanuflow-auth-setup
  tests/nuanuflow/auth.setup.ts

nuanuflow-auth
  tests/nuanuflow/authenticated/*.spec.ts
  depends on nuanuflow-auth-setup
```

This separation keeps the public baseline runnable when authentication is unavailable or broken.

### Test files and components

```text
tests/nuanuflow/
  pages/auth.page.ts       shared sign-in/sign-up selectors and navigation
  smoke.spec.ts            availability, title, favicon, console/network triage
  auth.spec.ts             public sign-in/sign-up behavior and validation
  legal.spec.ts            Terms, Privacy, and return navigation
  routing.spec.ts          guest routing and unknown-route behavior
  responsive.spec.ts       320/375/768/1024/1440 layout checks
  auth.setup.ts            phase 2 only; saves gitignored storageState
  authenticated/           phase 2 read-only workspace coverage

docs/local/nuanuflow/
  TEST-CASES.md             living private matrix and run notes
  evidence/                 screenshots for confirmed defects
```

Page objects contain selectors and actions; assertions remain in specs. Selectors prefer accessible roles and labels. Tests wait for observable state or specific responses and never use arbitrary sleeps.

## Public test matrix

| ID | Area | Expected behavior | Automation |
|---|---|---|---|
| SMK-01 | Availability | `/` returns 2xx, reaches the sign-in screen, and has a Nuanu Flow title | Playwright response and visible UI |
| SMK-02 | Assets | Declared favicon assets load successfully | Playwright request fixture |
| SMK-03 | Console/network | No unexpected console errors or first-party responses `>=400`; guest `/be/api/users/me/` `401` is explicitly allowlisted | Event capture after hydration |
| SEO-01 | Metadata | Public pages expose non-empty title and valid language; description, canonical, and social metadata are recorded and asserted only where product requirements demand them | DOM assertions and matrix observation |
| AUTH-01 | Sign in | Email textbox and Continue button have accessible names; Continue starts disabled | Role-based locators |
| AUTH-02 | Validation | Malformed email remains invalid and cannot enable or submit the form | Native validity and disabled-state assertions; no network submission |
| AUTH-03 | Navigation | Sign up opens `/sign-up/`; Sign in returns to `/` | URL and visible copy assertions |
| LEG-01 | Terms | Terms page returns 2xx, has title/heading/content, and returns to sign in | Response, heading, link assertions |
| LEG-02 | Privacy | Privacy page returns 2xx, has title/heading/content, and returns to sign in | Response, heading, link assertions |
| RTE-01 | Guest route | An unknown route resolves deterministically to the guest sign-in surface | Response/final URL assertion; classify as guest guard, not soft-404, until authenticated routing is tested |
| RSP-01 | Responsive | Sign-in controls remain visible and the document has no horizontal overflow at 320/375/768/1024/1440 | Parameterized viewports |
| A11Y-01 | Semantics | Primary form controls and legal/navigation links have usable accessible names | Role/name assertions |
| A11Y-02 | Keyboard | Primary public actions can be reached and activated in a logical keyboard sequence | Focus assertions without visual-only assumptions |

Missing `h1`, description, Open Graph, or canonical metadata found during recon are observations, not automatically defects. They become bugs only when confirmed against product requirements or a clear accessibility/SEO standard relevant to the page.

## Authenticated phase

When `NUANUFLOW_TEST_EMAIL` and `NUANUFLOW_TEST_PASSWORD` are available for a dedicated test account, `auth.setup.ts` logs in once and writes storage state beneath `playwright/.auth/`.

Authenticated checks remain read-only:

- workspace landing and sidebar navigation;
- project list and project overview;
- issue list, filters, search, and issue-detail rendering;
- cycles, modules, views, pages, and empty states where visible;
- profile/settings rendering without saving changes;
- guest access to protected routes and logout in an isolated context;
- console/network health and responsive navigation across core sections.

Creation, editing, drag-and-drop state changes, comments, invitations, uploads, automation execution, and deletions are excluded until the owner explicitly authorizes a disposable workspace or seeded test data.

## Triage and Nuanu Flow bug filing

For each suspicious failure:

1. Reproduce it in a fresh Playwright browser context.
2. Confirm hydration and wait conditions, locale, selector uniqueness, expected auth responses, bot protection, and rollout skew.
3. Repeat a flaky-looking case ten times before classifying it as a product defect.
4. Capture a screenshot of the exact faulty state and redact credentials or personal data.
5. Use Nuanu Flow MCP `search_tools` before every capability lookup, then `execute_tool` with the returned schema.
6. Create missing project labels only as needed. Every defect receives `Bug` plus one area label such as `Auth`, `Routing`, `Responsive`, `Accessibility`, `SEO`, or `General`.
7. Create the issue in workspace `nuanu-flow-qa`, project `NUANU`, state `Backlog`, with a title in the form `[BUG] Concise observable symptom` and priority mapped from severity.
8. Use the existing bug-report fields in `templates/bug-report.md`, encoded as `description_html`: product/area, how found, exact steps, expected, actual, evidence, environment, and severity rationale.
9. Attach the screenshot with `upload_small_issue_attachment` when it is at most 64 KiB. For larger evidence, use the signed `create_issue_attachment_upload` flow, upload the bytes, then call `complete_issue_attachment_upload`.
10. Verify the mutation with `get_issue` and `list_issue_attachments` before reporting the ticket.
11. Add a regression that asserts the correct behavior and mark it with the concrete ticket reference, for example `test.fail(true, 'NUANU-123: Concise observable symptom')`.

Priority mapping:

| Severity | Nuanu Flow priority | Meaning |
|---|---|---|
| Urgent | `urgent` | Money/data loss or total blocker |
| High | `high` | Main flow broken for a user segment |
| Medium | `medium` | Misleading behavior or material accessibility mismatch |
| Low | `low` | Cosmetic, formatting, or minor SEO issue |

Fixers do not close tickets. QA moves a ticket to `Done` only after its expected-failure regression flips to an unexpected pass on the deployed fix and the test is converted to a normal assertion.

## Error handling

- Public tests collect console errors and first-party failed responses after the sign-in surface is hydrated.
- The expected guest session probe is matched by origin, path, and status rather than suppressing every `401`.
- External `403`, `429`, and bot-protection responses are reported separately and are not classified as product failures.
- A navigation or click is accepted only after its visible or URL effect is asserted.
- Test artifacts remain in Playwright's gitignored report/result directories; confirmed-bug screenshots are copied to the private `docs/local/nuanuflow/evidence/` area.
- MCP mutations are executed one at a time and immediately verified. Partial attachment flows are reported explicitly and are not described as complete.

## Verification

The implementation is complete only when all applicable checks pass:

1. `npm run typecheck`.
2. `npx playwright test --project=nuanuflow --list` shows the intended cases only.
3. `npx playwright test --project=nuanuflow` completes green, with confirmed defects represented by expected failures.
4. Suspicious cases pass a targeted `--repeat-each=10` flakiness check before filing.
5. The living matrix records every automated, manual, and blocked case.
6. `git diff` contains no secrets, storage state, generated reports, or unrelated user-file changes from this work.
7. The ECC verification loop reports build/lint as not applicable when scripts are absent, and reports typecheck, test, security, and diff evidence explicitly.
8. Every created Nuanu Flow issue is readable through MCP, has the required metadata, and has a verified screenshot attachment.

## Success criteria

- The Nuanu Flow public project is independently runnable through Playwright.
- The public matrix covers availability, auth entry, legal pages, guest routing, responsive behavior, basic semantics, and first-party console/network health.
- Tests are read-only and deterministic.
- Confirmed bugs are filed only in Nuanu Flow project `NUANU`, never Linear.
- Every filed bug has evidence, a screenshot, MCP read-back verification, and a `test.fail()` regression.
- Authenticated coverage has a clear, isolated activation path when dedicated credentials become available.
