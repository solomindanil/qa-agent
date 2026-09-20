# P2-B reporter-boundary feasibility — rejected as sufficient repair

Owner approved an isolated feasibility experiment, not global reporter/config changes. Scratch: `/private/tmp/qa-report-boundary-spike.SX5G60`. All authored files are throwaway. No product network requests; page traffic is aborted and the only DOM is synthetic setContent.

Installed Playwright1.61.1, public custom reporter only, automatic media off, PLAYWRIGHT_NO_COPY_PROMPT=1. Command: `node <isolated-freeland>/node_modules/@playwright/test/cli.js test --config playwright.config.ts` from scratch. Exit1 was expected for two deliberately failing scenarios.

Observed in `safe-report.json`: assertion failure stays failed/errorCount1; healthy control passes; guard failure stays failed/errorCount1. The custom report emits allowlisted CHECK_FAILED instead of raw error strings, but onStepEnd receives a raw sentinel-bearing error. More importantly, the automatic error-context attachment already exists and contains the sentinel when onTestEnd begins. Therefore safe reporter output alone does not establish absence of sensitive persisted artifacts.

The guard scenario also contains the sentinel in its automatic attachment because Playwright includes surrounding test source from the same synthetic file. This is fixture text, not evidence of cross-account leakage. It demonstrates why inspecting only the final error message is insufficient.

Recommendation: do not ship a reporter-only or catch/rethrow-only repair. A next design must either prevent unsafe diagnostic production earlier through supported interfaces, or explicitly isolate raw worker artifacts and publish only allowlisted evidence. The latter changes the privacy/storage contract and needs separate scoped design review; deleting/redacting a file after it has been written does not meet the current no-persistence claim. Keep unexpected failures and guard categories, preserve unrelated reporting, and test actual persisted files/steps/stdout as well as summary JSON. Do not modify private Playwright internals or substitute DOM clicks for real actionability.

No source adoption, runtime implementation, dependencies, installed skills or live product changes. Candidate8a remains unaccepted. Existing two actual-spec RED controls remain unchanged in the isolated source. Canonical root45a/Freeland0ea unchanged.

## Earlier assertion projection follow-up

Owner requested continuing the earlier-boundary investigation. Two throwaway public `expect.poll` checks were added: exact text equality projected to a boolean and cardinality projected to a number before assertion recording. This preserves bounded polling, but is not yet a production replacement.

The initial follow-up still found the sentinel in source snippets because an earlier synthetic test hardcoded it in the same file; its summary is retained as `projection-source-contamination.json`. The fixture text was then supplied through SPIKE_HTML instead, as runtime data. The full five-case rerun exited1 as expected: original raw-text assertion FAILED and leaked; healthy control PASSED; guard failure FAILED without the sentinel; boolean summary mismatch FAILED without the sentinel; cardinality mismatch FAILED without the sentinel. One raw step error remained from the original raw-text assertion. `safe-report.json` records all five cases.

Conclusion: early projection is a promising narrow correction for assertion-value leaks, with no reporter change or private API. It does not prove safe locator actions, timeout/browser setup/teardown exceptions, backend errors, arbitrary logs or all artifacts. In particular the cardinality probe is not a replacement qualification for a real actionability/strict-mode failure. Production implementation must retain exact comparison semantics and retry budgets, keep genuine browser actions, and qualify the real named scenario plus its error paths before any privacy claim.

Read-only reference check: official https://playwright.dev/docs/api/class-reporter documents reporter event delivery; https://playwright.dev/docs/api/class-testconfig documents preserveOutput as retention, not prevention. Installed1.61.1 `lib/index.js` creates error-context before reporter consumption. No documented general pre-serialization sanitization hook was identified in this investigation; this is not a claim that every extension mechanism has been exhaustively ruled out.
