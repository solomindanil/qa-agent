# Credential-free catalog discovery — bounded Freeland follow-up

Date: 2026-09-08. This integrates the reviewed Freeland source, not accepted-root promotion or a product release verdict. Consoledeb262c, Kernel11d013c and the inactive reference10d398d are unchanged.

## Exact component change and evidence

Freeland `04b771a7f048d244b501e4c0cab6618bd4305d79`, tree `f296e2dd35965b77d6d1ada431d08fd4ce5979fc`, follows `6f4ae0642a1f32144f6a2853acf40f236439b57d`. Only the graph CLI, four regression tests and their two assembled provenance rows change. Catalog discovery/dry-run uses scrubbed runtime variables without requiring email/password. Actual execution retains strict credential gating before any subprocess. No dummy credentials/auth session, second runner, oracle change or permission expansion is introduced.

Two original failing controls showed `STAGING_CREDENTIALS_REQUIRED`; four final focused regressions passed and independent Lead AQA approved the exact bytes. Full `npm run qa:verify` at04b771a exited0:2436/2436, no failures/skips/cancellations; typecheck, provenance and8qualified private bindings passed. These are harness results, not2436 product checks.

Real local catalog discovery retained266 tests and catalog digest `sha256:b53f227d31ebc3a7a116122ee177892fad6e3d0baef93deda80cef48c22f8dff`. QA corpus digest remained `sha256:2cae124d925212bc19905d80138254e13748bfc15df7cf0562849e3393067817`.

## Observed staging boundary

Fresh graph build, structural validation, full plan and dry-run passed without login credentials on staging product `2981985e6eaebddbdb1b6691a261bc7e9369bcaa`. A separate single TC-ВХОД-01 guest run passed in11.2s: heading7928ms, no document overflow at375/1440, root path retained, CTA to/app/welcome, no runtime errors. Main visually observed email+password fields, desktop hero and mobile footer. Empty storage and `--no-deps` prevented auth setup; no credential file was created. Network trace contained only GET/HEAD/OPTIONS. Runtime identity before/after was stable; global admission released normally.

This is `SHADOW_PASS`, `promotionEligible:false`, not a sealed campaign or complete manual acceptance. Ten fresh-window repetitions and full visual/content coverage remain unassessed. Guest success does not qualify authenticated, payment, ticket or provider flows. No tracker state was changed.

The fresh full graph plan retained266 desktop tests,10 mobile and89 manual pending, with zero candidate-bound Product CI executions. Of142 changed files,106 remain unmapped. Explicit full mode has `fallback:null`; that is not proof of complete mappings. Strict validation retained180 findings:37 requirements without test owner,36 excluded requirements without automation,1 requirement coverage gap,89 unresolved source locators,17 orphan semantic nodes. These are graph/coverage findings, not180 product bugs.

## Packaging and next gate

The complete-history bundle has SHA256 `f0976f7ad4f63902acea5651b03c65c45cba5b593474a11fae97a17e818e12ad`; it verified from an empty bare store without prerequisites. Only this root's Freeland bundle/pin and current status documents change. No live graphs, credentials, traces, dependencies or registrations are moved into tracked delivery. The earlier root6532142 and accepted root48bccef remain unchanged.

This fresh isolated assembly's own restore, pre-test verify and post-test verify exited0; its root self-tests passed52/52 with0fail/skip/cancel/todo (26867.593166ms). Raw invocation records and outputs are retained under `/private/tmp/qa-agent-catalog-integration.c9xVWz0b/precommit/`. No child dependency install, child suite or live product execution was part of this assembly gate. These results precede the root documentation commit; the exact committed cold receiver remains a separate gate recorded in the private final handoff. The component2436 result is not relabelled as an assembled runtime test. No installed/Claude/cloud qualification follows. Next, qualify the committed source delivery and then resume permitted product slices with fresh identity; preserve actual coverage gaps and owner stops.

Raw host-local component evidence: `/Users/danilsolomin/projectsnew/qa-agent/.local/qualification/freeland-catalog-env-20260908-ujtU8U/REPORT.md`, SHA256 `f719a9b721af0bd2833eb30b88e2343663fd93155264766f9b1083d791a6e06e`;120copied/read-back files plus SHA256 manifest. That private delivery remains separate from portable source.
