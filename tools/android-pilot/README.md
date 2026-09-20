# Android Appium pilot

Runs one explicit guest Nuanu flow: optional first-launch location dismissal → Wallet → entrance date chooser → Back → chooser absent → guest Wallet. This qualifies a small reusable execution seam; it is not a full mobile suite, a managed Kernel adapter, or release acceptance. Date availability, pricing, purchases, login, layout geometry and screen-reader speech are outside this flow.

## Files

- `wallet-visit.json`: reviewed selectors and exact assertions, derived from observed native UI.
- `driver.mjs`: W3C/Appium client. Exact unique visible matches; disabled/ambiguous targets are refused. Waits for known readiness conditions.
- `runner.mjs`: stops on first failed assertion/execution error; retains all remaining steps as UNRUN. Captures XML and PNG after each completed step and on errors.
- `run.mjs`: previews by default, creates/ends a session on explicit execution, persists request/plan hash/results/file hashes. A creation timeout is an unknown provider outcome: reconcile before retry. Session deletion here ends WebDriver execution; it does not delete BrowserStack history.

The runner is invoked by the agent using its existing tools. It does not mutate campaign graphs, source pins, original-case counters, or Plan. It cannot establish that the APK backend matches staging. Results are caller-authored, unsealed observations.

## Requirements

Node >=22.12; local Appium 3.7.0 + UiAutomator2 8.7.0, Android SDK/JDK and an authorized running emulator, or BrowserStack App Automate credentials and an uploaded APK. Dependencies are installed separately, not downloaded implicitly by a run. On this host the isolated package is `.local/tools/nuanu-appium` (exact lockfile there).

Local server (start from its dependency directory so Appium detects the installed driver):

```sh
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ANDROID_HOME='/Users/danilsolomin/Library/Android/sdk' ./node_modules/.bin/appium --address 127.0.0.1 --port 4727
```

Config shape:

```json
{
  "endpoint": "http://127.0.0.1:4727",
  "device": "authorized QA emulator",
  "capabilities": {
    "platformName": "Android",
    "appium:automationName": "UiAutomator2",
    "appium:udid": "emulator-5554",
    "appium:appPackage": "com.nuanu.community",
    "appium:appActivity": ".MainActivity",
    "appium:noReset": true,
    "appium:forceAppLaunch": true,
    "appium:newCommandTimeout": 120
  }
}
```

Verify the serial belongs to the authorized AVD before execution. Local noReset retains existing app data. Appium helper applications are installed by the driver.

```sh
node tools/android-pilot/run.mjs /absolute/config.json /absolute/new-output-dir
node tools/android-pilot/run.mjs /absolute/config.json /absolute/new-output-dir --execute
node --test tools/android-pilot/*.test.mjs
```

For BrowserStack use `https://hub-cloud.browserstack.com/wd/hub`, deviceName/platformVersion/app (bs:// uploaded ID) capabilities, and bstack:options project/build/session names. Set BROWSERSTACK_CREDENTIALS_FILE to a private JSON file containing username/accessKey. Never put credentials in config, URL, source or reports. API keys must be obtained and saved with user authorization. No automatic paid upgrade or session retry.

## Limits

The driver disables UiAutomator idle waits for the continuously animated map and uses explicit selector conditions. A screenshot immediately after tap may precede animation completion; postcondition assertions supply the settled check. Source and screenshot are sequential samples, not an atomic frame. Optional onboarding is recorded as performed true/false. Absence tests require the selector to disappear from the hierarchy; hidden-but-retained nodes conservatively fail.

An assertion failure is a reproduction candidate requiring triage, not an automatically confirmed product bug. Screenshot saving does not prove complete visual correctness. Early assertion capture of the visit title may occur during availability loading; availability is not asserted. Abrupt host/process termination can leave a remote session until idle timeout; inspect saved session ID/provider before another run. Config capabilities and endpoint are reviewed inputs, not a general authorization system.

Cloud provider session state `done` is lifecycle completion, not our assertion verdict. Preserve failed setup attempts. Next expansion should bind each additional flow to the Nuanu catalog/oracle and qualify healthy/broken controls before any managed integration. Jev is not used by this pilot.
