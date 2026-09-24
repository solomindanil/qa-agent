# W7 current-source build-drift compatibility — 24 September 2026

This is a bounded local compatibility result, not a W7 exit, a live rw-int
continuation, actual host restart, or source/installed-skill parity claim.
Root `428caca94fbf96f846d0c0080d9493007fd6608f` was clean before the run.
The manifest-selected Console was
`f75d9630edd599d9fd9bfbfbf5faf195e25db685`, paired with Kernel
`a0a20e65b3290e6bbf5afe91d0e45ed372389adb`.
`npm run sources:verify` passed before and after the selected tests.

From `components/console`, a fresh temporary directory under `/private/tmp`
and an empty environment except for `PATH`, temp-directory variables and
disabled Node/tsx compile caches were used. The command selected four existing
`campaign-continuation-runner.test.ts` cases by exact name prefix:

```sh
node --import tsx --test --test-concurrency=1 \
  --test-name-pattern='^(A accepted, B uncertain:|two real fixture oracle failures|static drift refuses|late fixture identity drift)' \
  tests/unit/campaign-continuation-runner.test.ts
```

Exit `0`: four tests, four passed, zero failed/cancelled/skipped/todo;
TAP duration `2820.899458ms`. Those controls retain completed A while
continuing B/C, keep known fixture failures and blockers inconclusive, refuse
static source-identity drift before target reads, restrict a changed target
build to identity observation, and keep late identity drift from producing
a missing-data PASS. The selected tests use owned local fixtures and loopback
API requests. They did not target a product endpoint, existing campaign,
browser Worker, or live account.

This is a fresh run of existing controls, not a new recovery milestone. It does
not establish expired-access behavior, corrupted neighboring-session isolation,
actual host restart, current installed-skill behavior, Claude parity, W4a,
live T7, Worker/resource containment, or full P6/W7. Those obligations remain
open in the [unified plan](../superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md).
