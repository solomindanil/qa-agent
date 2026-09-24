# Outcome visible-content controls and live W1 gate — 24 September 2026

## Scope

This is a narrow, opt-in repair to the controlled loopback outcome-completion
evaluation, based on root `b6b5b98` on `codex/p2-semantic-source-delivery`.
It is not a deployed-product check, a new runner, a managed verdict, or a rerun
of the four historical actor trials. Their [first-trial contract and results](../../evals/outcome-completion/runs/w0-w1-first/README.md)
remain frozen. The [visible-content extension](../../evals/outcome-completion/cases-visible-content.md)
is a separate later regression contract.

The evaluator previously read DOM `textContent`: hidden text could satisfy the
guide, quantity, or persisted-note checks. It also checked only the guide
heading, so a correct heading with stale body instructions could pass. The
local repair now checks guide heading and exact synthetic instruction body,
selected-quantity total, and note after reload with Playwright visibility,
zero-opacity rejection on the test-id element or ancestor, and rendered
`innerText` **in addition to** the independent persisted-state read. The
fixture's Nebula wording is a controlled test promise, not an asserted real
VPN rule.

## Verification and limits

The unchanged baseline passed 6/6 focused tests. The first four negative
controls (stale guide body, hidden guide heading, hidden quantity total, hidden
persisted note) produced the expected RED: 4/8 passing, with each new control
reporting a missing expected rejection. Independent review then found two
comparable false-PASS shapes: opacity-zero ancestor and visible container with
text only in a hidden child. Both additional controls also failed before
their repair (8/10 passing), then the focused suite passed **12/12**, with no
failures or skips. The root `npm test` gate passed 61/61 before the final two
controls and passed 61/61 again afterward, with no failures or skips.
`npm run sources:verify` and `git diff --check` also passed after the final
repair. Independent AQA reviewed the final control design and returned GO for
this bounded loopback repair, with no Critical or Important findings. No
selected source pin, installed skill, product campaign, tracker record,
payment, or cloud permission changed.

These controls establish sensitivity to the six injected *synthetic*
contradictions. They do not form a complete human-perception oracle:
transparent text-bearing descendants, transparent text color, offscreen
placement and occlusion remain outside this extension. They also do not prove
semantic correctness of a real product's instructions, a fresh unaided agent
design, deployed build identity, or live W1 acceptance. The original 1/4
first-design acceptance remains 1/4.
The hidden-total negative control fails at quantity 1; it does not separately
mutate visibility only at 2 or 3. The implementation checks each selection,
and the original quantity fault still covers its semantic 2/3 mismatch.

## Live remaining-only W1 (T7)

A bounded read-only check found the existing rw-int owner Chrome session
authenticated. The owning Kernel's fresh `readTargetObservationReport` still
returned 20 targets: 8 recorded and 12 `not_observed`, with 15 global
blockers. Every unobserved target currently has only an unresolved oracle;
none is eligible for a new accepted bound assertion under the selected
product pack without a reviewed knowledge revision. The blocker is now the
oracle/target binding, **not** browser login. No product assertion, new
observation, registry/graph mutation, or tracker write was made in this check.
The read-only recheck at `2026-09-23T18:59:38.853Z` returned publication
`sha256:2ab1ce25511d94a74cf7ad8c808f9abd1779f79619f11d6d61ad4e8554702cd4`;
all 12 `not_observed` targets had nonempty `definitions[]`, and every
`definitions[].oracle.state` was `unresolved`. The private owner checkpoint's
latest section is dated 23 September 18:34 UTC; it was not rewritten.

The browser now displays “Анализ остановлен” for the previously uncertain
Quick run, but its persisted terminal state has not been independently read
back; it was not retried. T7 remains **pending**. Next, ground and review one
read-only expectation for a genuinely unobserved target through the existing
owner's knowledge-publication path, verify its exact binding and current
account/build, then execute and read back only that remaining assertion. Do
not repeat the eight recorded targets or infer a whole-product PASS.

A separate 24 September source/owner preflight read the complete
`qa-product-v0` skill and three required references from the frozen owning
Console `94083bf55d3237b6e60870211b034bfbc4b9dcc2`, without replacing its
runtime. The retained rw-int workspace still names publication
`sha256:2ab1ce25511d94a74cf7ad8c808f9abd1779f79619f11d6d61ad4e8554702cd4`;
its graph/catalog pair has 20 targets with 8 resolved and 12 unresolved
oracles. The apparently available resolved Guest and unauthenticated-API
targets already have current-publication observation records, so selecting
them would repeat the completed subset. The Direct/Metрика target's catalog
oracle remains unresolved. This is a read-only file and retained-evidence
integrity check, not another owning-Kernel reader invocation or a fresh
product/account/build check. It closes T6.3's source/binding preflight only;
T7 remains pending.
