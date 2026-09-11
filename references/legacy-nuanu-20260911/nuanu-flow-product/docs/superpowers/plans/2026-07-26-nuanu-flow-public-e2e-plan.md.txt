# Nuanu Flow Public E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add and run a safe public Playwright E2E suite for Nuanu Flow, record the living test matrix, and file only confirmed defects in Nuanu Flow project `NUANU` through MCP with screenshot-backed regressions.

**Architecture:** Register an independently runnable `nuanuflow` Playwright project, keep public selectors in a focused `AuthPage`, and split observable behaviors across smoke, auth, legal/routing, and responsive specs. Treat the guest session `401` as an exact allowlisted probe, keep UI tests read-only, and use the separately verified Nuanu Flow MCP workflow only after failure triage confirms a real defect.

**Tech Stack:** TypeScript 6, Playwright 1.61, Node.js 22, dotenv, Nuanu Flow MCP (`search_tools` then `execute_tool`).

## Global Constraints

- Target URL is exactly `https://flow.nuanu.com` through local `NUANUFLOW_BASE_URL`.
- QA tracker is workspace `nuanu-flow-qa`, project `nuanu flow qa`, identifier `NUANU`; never use Linear.
- Public E2E is read-only: no account creation, password reset, workspace mutation, invitations, comments, uploads, or valid email submission.
- The only expected first-party failing response is guest `401 https://flow.nuanu.com/be/api/users/me/`; match origin, pathname, and status together.
- Never commit tokens, credentials, storage state, evidence with personal data, Playwright reports, or test results.
- Preserve all pre-existing dirty-worktree changes. Before any commit, stage only files or exact hunks created by this plan and verify `git diff --cached --name-only` plus `git diff --cached`.
- Use role/name locators where possible, wait for observable state, and never add `waitForTimeout`.
- A failing test is not a product bug until reproduced in a fresh context and checked for hydration, locale, selector, network, bot protection, and rollout causes.
- Every confirmed bug receives a screenshot, MCP read-back verification, and a `test.fail()` regression asserting the correct behavior.

---

## File map

- Modify `.env.example:16-22` — document the Nuanu Flow base URL and future dedicated UI credentials.
- Modify `playwright.config.ts:104-110` — register the public `nuanuflow` project without an auth dependency.
- Modify `.env` locally — add `NUANUFLOW_BASE_URL=https://flow.nuanu.com`; this file remains gitignored.
- Create `tests/nuanuflow/pages/auth.page.ts` — own public auth selectors and navigation actions.
- Create `tests/nuanuflow/smoke.spec.ts` — availability, title/language, favicon, and exact console/network triage.
- Create `tests/nuanuflow/auth.spec.ts` — accessible form contract, invalid-email protection, and sign-in/sign-up navigation.
- Create `tests/nuanuflow/legal.spec.ts` — Terms and Privacy route/content/back-navigation checks.
- Create `tests/nuanuflow/routing.spec.ts` — deterministic unknown-route guest behavior.
- Create `tests/nuanuflow/responsive.spec.ts` — 320/375/768/1024/1440 overflow and control visibility.
- Create `docs/local/nuanuflow/TEST-CASES.md` — private living matrix, observations, blockers, run notes, and confirmed ticket references.
- Conditionally modify the spec that exposes a confirmed defect — add the correct-behavior `test.fail()` regression with its concrete `NUANU` ticket.

---

### Task 1: Register Nuanu Flow and establish the smoke baseline

**Files:**
- Modify: `.env.example:16-22`
- Modify: `playwright.config.ts:104-110`
- Modify locally: `.env`
- Create: `tests/nuanuflow/smoke.spec.ts`

**Interfaces:**
- Consumes: existing `product(name, baseURL, options)` helper from `playwright.config.ts`.
- Produces: Playwright project named `nuanuflow`; environment variable contract `NUANUFLOW_BASE_URL`; exact guest-probe classifier local to `smoke.spec.ts`.

- [ ] **Step 1: Prove the project is not registered**

Run:

```bash
NUANUFLOW_BASE_URL=https://flow.nuanu.com npx playwright test --project=nuanuflow --list
```

Expected: FAIL with `Project(s) "nuanuflow" not found`.

- [ ] **Step 2: Add the first smoke spec**

Create `tests/nuanuflow/smoke.spec.ts` with this behavior:

```ts
import { expect, test, type Response } from '@playwright/test';

const isExpectedGuestProbe = (response: Response, origin: string) => {
  const url = new URL(response.url());
  return (
    url.origin === origin &&
    url.pathname === '/be/api/users/me/' &&
    response.status() === 401
  );
};

test.describe('Nuanu Flow public smoke', () => {
  test('sign-in page loads without unexpected first-party errors', async ({ page, baseURL }) => {
    expect(baseURL, 'nuanuflow project must define baseURL').toBeTruthy();
    const origin = new URL(baseURL!).origin;
    const consoleErrors: string[] = [];
    const unexpectedResponses: string[] = [];
    let sawExpectedGuestProbe = false;

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (isExpectedGuestProbe(response, origin)) {
        sawExpectedGuestProbe = true;
        return;
      }
      const url = new URL(response.url());
      if (url.origin === origin && response.status() >= 400) {
        unexpectedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(response, 'no response from Nuanu Flow').not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Sign in - Nuanu Flow/i);
    await expect(page.locator('html')).toHaveAttribute('lang', /\S+/);
    expect(unexpectedResponses).toEqual([]);

    const unexpectedConsole = consoleErrors.filter(
      (message) =>
        !(
          sawExpectedGuestProbe &&
          /Failed to load resource.+status of 401/i.test(message)
        ),
    );
    expect(unexpectedConsole).toEqual([]);
  });

  test('declared favicon is reachable', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    const href = await page.locator('link[rel~="icon"]').first().getAttribute('href');
    expect(href, 'Nuanu Flow should declare a favicon').toBeTruthy();
    const response = await request.get(new URL(href!, page.url()).toString());
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 3: Register configuration without disturbing existing products**

Append this block to `.env.example` after MagicPay and before the Freeland staging comment:

```dotenv
# --- Nuanu Flow ---
NUANUFLOW_BASE_URL=https://flow.nuanu.com
# NUANUFLOW_TEST_EMAIL=qa@example.com
# NUANUFLOW_TEST_PASSWORD=change-me
```

Add this project entry immediately after MagicPay in `playwright.config.ts`:

```ts
...product('nuanuflow', process.env.NUANUFLOW_BASE_URL),
```

Add this local-only line to `.env` without changing or printing existing secrets:

```dotenv
NUANUFLOW_BASE_URL=https://flow.nuanu.com
```

- [ ] **Step 4: Verify discovery and the smoke baseline**

Run:

```bash
npx playwright test --project=nuanuflow --list
npx playwright test --project=nuanuflow tests/nuanuflow/smoke.spec.ts
```

Expected: two Nuanu Flow smoke tests are listed and pass. If live behavior differs, stop and triage it as Task 5 evidence rather than weakening the assertion.

- [ ] **Step 5: Review the task diff and checkpoint it safely**

Run:

```bash
npm run typecheck
git diff --check -- .env.example playwright.config.ts tests/nuanuflow/smoke.spec.ts
git status --short
```

Expected: typecheck and diff check pass; `.env` is absent from status. Because `.env.example` and `playwright.config.ts` were already modified before this plan, do not stage those whole files. If their Nuanu Flow additions form isolated hunks, checkpoint with:

```bash
git add -p -- .env.example playwright.config.ts
git add -- tests/nuanuflow/smoke.spec.ts
git diff --cached --check
git diff --cached --name-only
git diff --cached
git commit -m "test: add Nuanu Flow public smoke baseline"
```

Accept only the two Nuanu Flow configuration additions during `git add -p`. If the hunks overlap prior user changes, leave this task uncommitted and report that safety decision.

---

### Task 2: Add the public auth page object and form contract

**Files:**
- Create: `tests/nuanuflow/pages/auth.page.ts`
- Create: `tests/nuanuflow/auth.spec.ts`

**Interfaces:**
- Consumes: Playwright `Page` and `Locator`.
- Produces: `AuthPage` with `emailInput`, `continueButton`, `signUpLink`, `signInLink`, `gotoSignIn()`, and `gotoSignUp()`.

- [ ] **Step 1: Write the auth behavior before the page object exists**

Create `tests/nuanuflow/auth.spec.ts` using the future interface:

```ts
import { expect, test } from '@playwright/test';
import { AuthPage } from './pages/auth.page';

test.describe('Nuanu Flow public auth', () => {
  test('sign-in form exposes accessible controls and blocks malformed email', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignIn();

    await expect(auth.emailInput).toBeVisible();
    await expect(auth.continueButton).toBeVisible();
    await expect(auth.continueButton).toBeDisabled();

    await auth.emailInput.fill('not-an-email');
    expect(
      await auth.emailInput.evaluate((node) =>
        (node as HTMLInputElement).checkValidity(),
      ),
    ).toBe(false);
    await expect(auth.continueButton).toBeDisabled();
  });

  test('sign-in and sign-up links navigate without submitting data', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignIn();
    await auth.signUpLink.click();
    await expect(page).toHaveURL(/\/sign-up\/$/);
    await expect(auth.emailInput).toBeVisible();

    await auth.signInLink.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(auth.emailInput).toBeVisible();
  });

  test('sign-up is keyboard reachable', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignIn();
    await auth.signUpLink.focus();
    await expect(auth.signUpLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/sign-up\/$/);
  });
});
```

- [ ] **Step 2: Run the auth spec and verify the missing interface failure**

Run:

```bash
npx playwright test --project=nuanuflow tests/nuanuflow/auth.spec.ts
```

Expected: FAIL at TypeScript/module resolution because `./pages/auth.page` does not exist.

- [ ] **Step 3: Implement the minimal page object**

Create `tests/nuanuflow/pages/auth.page.ts`:

```ts
import { type Locator, type Page } from '@playwright/test';

export class AuthPage {
  readonly emailInput: Locator;
  readonly continueButton: Locator;
  readonly signUpLink: Locator;
  readonly signInLink: Locator;

  constructor(readonly page: Page) {
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.signUpLink = page.getByRole('link', { name: 'Sign up' });
    this.signInLink = page.getByRole('link', { name: 'Sign in' });
  }

  async gotoSignIn() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async gotoSignUp() {
    await this.page.goto('/sign-up/', { waitUntil: 'domcontentloaded' });
    await this.emailInput.waitFor({ state: 'visible' });
  }
}
```

- [ ] **Step 4: Verify auth behavior and stability**

Run:

```bash
npx playwright test --project=nuanuflow tests/nuanuflow/auth.spec.ts
npx playwright test --project=nuanuflow tests/nuanuflow/auth.spec.ts --repeat-each=3
npm run typecheck
```

Expected: all three auth tests pass in all three repetitions; typecheck passes.

- [ ] **Step 5: Checkpoint new files**

Run:

```bash
git diff --check -- tests/nuanuflow/auth.spec.ts tests/nuanuflow/pages/auth.page.ts
git status --short
```

Stage and checkpoint only these two new files:

```bash
git add -- tests/nuanuflow/auth.spec.ts tests/nuanuflow/pages/auth.page.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "test: cover Nuanu Flow public auth"
```

---

### Task 3: Cover legal pages, metadata contract, and guest routing

**Files:**
- Create: `tests/nuanuflow/legal.spec.ts`
- Create: `tests/nuanuflow/routing.spec.ts`

**Interfaces:**
- Consumes: public routes `/legals/terms-and-conditions/`, `/legals/privacy-policy/`, `/sign-up/`, and `AuthPage`.
- Produces: direct-route legal coverage and deterministic guest fallback coverage without claiming an authenticated 404 contract.

- [ ] **Step 1: Write parameterized legal checks**

Create `tests/nuanuflow/legal.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const legalPages = [
  {
    path: '/legals/terms-and-conditions/',
    title: /Terms of Service - Nuanu Flow/i,
    heading: 'Terms of Service',
  },
  {
    path: '/legals/privacy-policy/',
    title: /Privacy Policy - Nuanu Flow/i,
    heading: 'Privacy Policy',
  },
];

test.describe('Nuanu Flow legal pages', () => {
  for (const legalPage of legalPages) {
    test(`${legalPage.heading} loads and returns to sign in`, async ({ page }) => {
      const response = await page.goto(legalPage.path, { waitUntil: 'domcontentloaded' });
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(legalPage.title);
      await expect(page.getByRole('heading', { name: legalPage.heading })).toBeVisible();
      const back = page.getByRole('link', { name: 'Back to sign in' });
      await expect(back).toBeVisible();
      await back.click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    });
  }
});
```

- [ ] **Step 2: Write the guest-routing check**

Create `tests/nuanuflow/routing.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('unknown guest route resolves to the sign-in surface', async ({ page, baseURL }) => {
  expect(baseURL).toBeTruthy();
  const response = await page.goto('/qa-unknown-route-019f9d72', {
    waitUntil: 'domcontentloaded',
  });

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);
  await expect(page).toHaveURL(new URL('/', baseURL).toString());
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page).toHaveTitle(/Sign in - Nuanu Flow/i);
});
```

- [ ] **Step 3: Run both new specs**

Run:

```bash
npx playwright test --project=nuanuflow tests/nuanuflow/legal.spec.ts tests/nuanuflow/routing.spec.ts
```

Expected: three tests pass. A different unknown-route result is triage evidence; do not automatically rewrite it to expect `404` or file a soft-404 bug while the user is a guest.

- [ ] **Step 4: Verify metadata without inventing requirements**

Add a test to `tests/nuanuflow/smoke.spec.ts` that asserts only the confirmed public contract:

```ts
test('public document identifies Nuanu Flow and declares a language', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page).toHaveTitle(/Nuanu Flow/i);
  await expect(page.locator('html')).toHaveAttribute('lang', /^[a-z]{2}(?:-[A-Z]{2})?$/);
});
```

Record missing description, canonical, Open Graph, and `h1` as observations in Task 4. Do not create a failing assertion without an approved requirement.

- [ ] **Step 5: Verify the combined public routing slice**

Run:

```bash
npx playwright test --project=nuanuflow tests/nuanuflow/smoke.spec.ts tests/nuanuflow/legal.spec.ts tests/nuanuflow/routing.spec.ts
npm run typecheck
git diff --check -- tests/nuanuflow
```

Expected: tests and typecheck pass; diff check is clean.

- [ ] **Step 6: Checkpoint legal and routing coverage**

Run:

```bash
git add -- tests/nuanuflow/legal.spec.ts tests/nuanuflow/routing.spec.ts tests/nuanuflow/smoke.spec.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "test: cover Nuanu Flow public routes"
```

Expected: only these Nuanu Flow spec files are committed.

---

### Task 4: Add responsive coverage and the living test matrix

**Files:**
- Create: `tests/nuanuflow/responsive.spec.ts`
- Create: `docs/local/nuanuflow/TEST-CASES.md`

**Interfaces:**
- Consumes: `AuthPage.gotoSignIn()` and the public viewport contract.
- Produces: five named responsive tests and a private matrix that marks authenticated work blocked by missing UI credentials.

- [ ] **Step 1: Write the responsive checks**

Create `tests/nuanuflow/responsive.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { AuthPage } from './pages/auth.page';

const viewports = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

const expectNoHorizontalOverflow = async (page: Page, width: number) => {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    dimensions.scrollWidth,
    `sign-in@${width}: scrollWidth=${dimensions.scrollWidth}, clientWidth=${dimensions.clientWidth}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
};

test.describe('Nuanu Flow responsive sign-in', () => {
  for (const viewport of viewports) {
    test(`sign-in controls fit at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const auth = new AuthPage(page);
      await auth.gotoSignIn();

      await expect(auth.emailInput).toBeVisible();
      await expect(auth.continueButton).toBeVisible();
      await expectNoHorizontalOverflow(page, viewport.width);
    });
  }
});
```

- [ ] **Step 2: Run the responsive matrix**

Run:

```bash
npx playwright test --project=nuanuflow tests/nuanuflow/responsive.spec.ts
```

Expected: five tests pass with no overflow.

- [ ] **Step 3: Create the exact living matrix**

Create `docs/local/nuanuflow/TEST-CASES.md` with:

```markdown
# Nuanu Flow — test cases and scenarios (v1, 2026-07-26)

Product: https://flow.nuanu.com
Tracker: Nuanu Flow workspace `nuanu-flow-qa`, project `NUANU`
Statuses: ✅ automated · 🖐 manual/observation · ⛔ blocked
Confirmed bugs: none at baseline start

## Public smoke and auth

| ID | Case | Status |
|---|---|---|
| SMK-01 | Sign-in route responds below 400 with Nuanu Flow title and document language | ✅ `smoke.spec.ts` |
| SMK-02 | Favicon loads | ✅ `smoke.spec.ts` |
| SMK-03 | No unexpected console errors or first-party failures; exact guest users/me 401 is expected | ✅ `smoke.spec.ts` |
| SEO-01 | Description, canonical, Open Graph, and h1 are absent on sign-in during recon | 🖐 observation; requirement needed before bug filing |
| AUTH-01 | Email and Continue expose accessible roles; Continue starts disabled | ✅ `auth.spec.ts` |
| AUTH-02 | Malformed email remains invalid and cannot enable submit | ✅ `auth.spec.ts` |
| AUTH-03 | Sign in/sign up navigation works without submitting user data | ✅ `auth.spec.ts` |
| A11Y-01 | Sign-up action is keyboard focusable and activatable | ✅ `auth.spec.ts` |

## Legal and routing

| ID | Case | Status |
|---|---|---|
| LEG-01 | Terms page loads and returns to sign in | ✅ `legal.spec.ts` |
| LEG-02 | Privacy page loads and returns to sign in | ✅ `legal.spec.ts` |
| RTE-01 | Unknown guest route resolves deterministically to sign in | ✅ `routing.spec.ts`; authenticated 404 contract remains unverified |

## Responsive

| ID | Case | Status |
|---|---|---|
| RSP-01 | Sign-in controls visible with no horizontal overflow at 320/375/768/1024/1440 | ✅ `responsive.spec.ts` |

## Authenticated workspace

| ID | Case | Status |
|---|---|---|
| AUT-01 | Dedicated UI login and storageState setup | ⛔ `NUANUFLOW_TEST_EMAIL` and `NUANUFLOW_TEST_PASSWORD` unavailable |
| CORE-01 | Workspace/project/issue navigation and rendering | ⛔ depends on AUT-01 |
| CORE-02 | Cycles/modules/views/pages and empty states | ⛔ depends on AUT-01 |
| SET-01 | Profile/settings render without saving | ⛔ depends on AUT-01 |
| RSP-02 | Authenticated mobile and desktop navigation | ⛔ depends on AUT-01 |

## Safety

- No account creation, password reset, valid email submission, data mutation, or destructive flows.
- Confirmed defects go only to project `NUANU` through MCP with screenshot plus `test.fail()` coverage.
```

- [ ] **Step 4: Run the complete public suite twice**

Run:

```bash
npx playwright test --project=nuanuflow
npx playwright test --project=nuanuflow --repeat-each=2
npm run typecheck
```

Expected: every public test passes in both repetitions and typecheck passes. Any inconsistent result moves to Task 5 triage.

- [ ] **Step 5: Review all implementation changes**

Run:

```bash
git diff --check -- .env.example playwright.config.ts tests/nuanuflow docs/local/nuanuflow/TEST-CASES.md
git status --short
```

Expected: no whitespace errors or tracked secrets. `docs/local/nuanuflow/TEST-CASES.md` remains private because `docs/local/` is gitignored.

- [ ] **Step 6: Checkpoint responsive coverage**

Run:

```bash
git add -- tests/nuanuflow/responsive.spec.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "test: add Nuanu Flow responsive matrix"
```

Expected: only the responsive spec is committed; the private matrix stays untracked by git.

---

### Task 5: Triage live results, file confirmed bugs through MCP, and verify the campaign

**Files:**
- Modify conditionally: the spec that demonstrates each confirmed defect.
- Create evidence conditionally: `docs/local/nuanuflow/evidence/NUANU-sequence-symptom.png`.
- Modify: `docs/local/nuanuflow/TEST-CASES.md` with run outcome and ticket references.

**Interfaces:**
- Consumes: live Playwright failures, Nuanu Flow MCP endpoint, workspace `nuanu-flow-qa`, project `NUANU`, default state `Backlog`.
- Produces: either a verified green baseline with no filed bugs, or verified `NUANU-sequence` issues plus screenshot attachments and expected-failure regressions.

- [ ] **Step 1: Capture authoritative run evidence**

Run:

```bash
npx playwright test --project=nuanuflow --reporter=list
```

Record total, passed, failed, skipped, duration, and failing test titles in the living matrix. Do not infer totals from `--list`.

- [ ] **Step 2: Triage every failure before filing**

For each failed test, rerun Playwright's recorded last-failed selection in fresh contexts:

```bash
npx playwright test --project=nuanuflow --last-failed --repeat-each=10
```

Check the trace/screenshot and verify hydration, final URL, locale, selector uniqueness, expected guest probe handling, third-party responses, and rollout skew. If the behavior is a test defect, fix the test under TDD and rerun the full public suite. If it is inconsistent, quarantine with `test.fixme()` only after a concrete `NUANU` flake ticket exists.

- [ ] **Step 3: Capture evidence for a confirmed product defect**

Use the failing spec to navigate to the exact state and save a redacted screenshot beneath `docs/local/nuanuflow/evidence/`. The screenshot name uses the ticket sequence after creation; a pre-filing temporary file may use `candidate-area-symptom.png`. Confirm it contains no credentials, token, email address, or personal data.

- [ ] **Step 4: Discover and execute Nuanu Flow MCP mutations**

For each capability, call `search_tools` first with one concise English query:

```json
{"query":"create project label","limit":10}
{"query":"create issue","limit":10}
{"query":"upload issue attachment","limit":10}
{"query":"get issue","limit":10}
```

Use `execute_tool` with the returned schema. Create `Bug` and the one required area label only if absent. Create the issue with these concrete invariants:

```json
{
  "workspace_slug": "nuanu-flow-qa",
  "project_identifier": "NUANU",
  "name": "[BUG] Concise observable symptom",
  "description_html": "<p><strong>Product:</strong> Nuanu Flow (area proven during triage)</p><p><strong>How found:</strong> Playwright spec file and test title from the confirmed run</p><p><strong>Steps to reproduce:</strong> Ordered actions from the confirmed spec</p><p><strong>Expected:</strong> Correct observable behavior asserted by the regression</p><p><strong>Actual:</strong> Exact observed copy, status, URL, or layout measurement</p><p><strong>Evidence:</strong> Console/network output and attached screenshot</p><p><strong>Environment:</strong> Chromium, macOS, production URL, locale, and 2026-07-26 run time</p><p><strong>Severity:</strong> Rubric level with one-sentence rationale</p>",
  "priority": "low",
  "state_name": "Backlog",
  "label_names": ["Bug", "General"]
}
```

Replace title, report, severity priority, and area label with observed evidence. Upload the screenshot through `upload_small_issue_attachment` if it is at most 64 KiB; otherwise use `create_issue_attachment_upload`, PUT the exact signed fields/headers, then `complete_issue_attachment_upload`.

- [ ] **Step 5: Verify every tracker mutation**

Call the discovered `get_issue` tool with the concrete `NUANU-sequence` reference and `list_issue_attachments` for that issue. Verify title, description, priority, `Backlog`, `Bug` plus area label, and at least one screenshot attachment. If any read-back fails, report the partial state and repair only that operation; do not claim the ticket is complete.

- [ ] **Step 6: Add the expected-failure regression**

In the relevant spec, assert the correct behavior and annotate the concrete ticket:

```ts
test('correct observable behavior (known bug NUANU-123)', async ({ page }) => {
  test.fail(true, 'NUANU-123: Concise observable symptom');
  // Reproduce the user-visible state with condition-based waits.
  // Assert the correct result, not the currently broken result.
});
```

Replace `NUANU-123` and the symptom with the actual MCP-created issue. Run the regression once to prove it is an expected failure, then run the full public suite and confirm the suite remains green.

- [ ] **Step 7: Run the ECC verification loop**

Run:

```bash
npm run typecheck
npx playwright test --project=nuanuflow --list
npx playwright test --project=nuanuflow
git diff --check
git status --short
git diff -- tests/nuanuflow playwright.config.ts .env.example
```

Report:

```text
Build: N/A — no build script in package.json
Types: PASS or FAIL with exact error count
Lint: N/A — no lint script in package.json
Tests: PASS or FAIL with exact passed/failed/skipped totals
Security: PASS only if no token, credential, storage state, or PII entered the diff/artifacts
Diff: exact files changed by this campaign; pre-existing user changes listed separately
MCP: confirmed issues and verified attachments, or “none — no confirmed defect”
Overall: READY only if types and intended public suite pass
```

- [ ] **Step 8: Final completion audit**

Compare the live filesystem and command outputs against every success criterion in `docs/superpowers/specs/2026-07-26-nuanu-flow-e2e-design.md`. The campaign is incomplete if project discovery, the public matrix, a clean full run, private test-case documentation, or required MCP regression evidence is missing.
