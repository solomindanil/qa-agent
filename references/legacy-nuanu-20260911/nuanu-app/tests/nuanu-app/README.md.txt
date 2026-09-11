# Nuanu App web/PWA Playwright suite

This standalone suite targets `https://app.nuanu.com/`. V1 covers the web
application and PWA. Physical iPhone and Android acceptance is `MANUAL`; native
iOS and Android applications are `OUT_OF_SCOPE`.

## Current foundation

Playwright discovery currently exposes exactly nine tests:

- `NAPP-CONTRACT-001 synthetic runtime contract drives unique exact role-name discovery locators without network`
- `NAPP-PUB-001 homepage returns HTML and renders an application shell`
- `NAPP-PUB-002 reviewed discovery controls map marker and place card are reachable`
- `NAPP-SAFE-001 blocks non-idempotent requests before network dispatch`
- `NAPP-EVID-001 removes query and fragment data from evidence URLs`
- `NAPP-SAFE-002 disables artifacts for the Nuanu App runtime project`
- `NAPP-EVID-002 records bounded non-sensitive console markers and attaches no raw text`
- `NAPP-EVID-003 records at most 25 sanitized failed request URLs`
- `NAPP-EVID-004 records only first-party HTTP 500-599 responses and caps them`

These cases establish a foundation, not full product coverage. Their
registration does not assign a run result. The tracked case registry and
coverage gaps are documented in `docs/nuanu-app/TEST-CASES.md` and
`docs/nuanu-app/COVERAGE-MAP.md`.

## Run

```bash
NUANU_APP_BASE_URL=https://app.nuanu.com npx playwright test --list --project=nuanu-app
NUANU_APP_BASE_URL=https://app.nuanu.com npm run test:nuanu-app
```

The default project uses Chromium. `NUANU_APP_FIREFOX=1`,
`NUANU_APP_WEBKIT=1`, and `NUANU_APP_MOBILE=1` opt into additional browser
projects. Mobile adds Pixel 5 Chromium and iPhone 13 WebKit emulation; neither
substitutes for physical-device evidence.

`NUANU_APP_AUTH_STORAGE_STATE` may point to an operator-supplied, gitignored
Playwright storage-state file. The current nine tests do not consume
it and do not provide authenticated coverage.

## Safety contract

The navigating smoke case installs the mutation guard before its first
navigation. The guard permits only `GET`, `HEAD`, and `OPTIONS` requests
visible to Playwright routing and aborts other methods before dispatch. Every
future navigating case must install the guard itself before navigation.

Trace, screenshot, and video are disabled for every Nuanu App project. Current
observations retain only bounded console markers and sanitized URLs without
query or fragment data. They do not collect request or response bodies,
headers, cookies, or storage.

The autonomous boundary excludes registration, external identity-provider
consent, reset delivery, privacy mutation, Call invocation, payment, and
account deletion. Source inspection is read-only. This suite never creates an
authentication fixture, pushes upstream, changes cloud state, or files a bug.
