# P3/P5 existing baseline reuse map — 21 September 2026

## Scope and source snapshot

Read-only scout at root `45a74c3` (`/Users/danilsolomin/projectsnew/qa-agent`). The active projection selects Console `c421160a71c0679a357f29828029ec3550791d16` and Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`. No test, product, network, registration, installation, source edit, or Git mutation was performed. This report is the only created file.

The governing entries were:

- `docs/qualification/current.md`
- `docs/superpowers/plans/2026-09-16-cross-product-qa-global-plan.md`, especially P3, P5, and the acceptance table
- `evals/README.md`
- selected Console source skill `components/console/skills/qa-product-v0/SKILL.md` and its `references/product-analysis.md`, `references/declarative-campaign.md`, and `references/agent-observations.md`

The relevant existing eval records/fixtures inspected were:

- `evals/dialogue-quality/{README.md,cases.md,reviewer-rubric.md,mixed-handoff-cases.md,20260914/README.md}`
- `evals/public-input-agent-cycle/{README.md,product-brief.md,prepare.mts,regression.mts}`
- `evals/mixed-handoff-agent-cycle/{README.md,product-brief.md,prepare.mts,fixture.mjs,20260914/README.md}`
- `evals/campaign-continuation/{README.md,recovery-acceptance.md,recovery.mts}`
- `docs/qualification/mixed-handoff-execution-20260914.md`

## Decision: smallest compliant reuse

Reuse the **existing dialogue-quality semantic-control procedure**, without creating a runner:

1. `evals/dialogue-quality/cases.md` C6 — unfamiliar web product, healthy/ambiguous empty-cart expectation, independent read-only search work.
2. The same file C4 — observable broken API response plus an unproven causal link and a healthy independent API.
3. The same file C1 — blocked fixture, independently available UI check, and an original-effect outcome that remains unknown and must not be retried.
4. `evals/dialogue-quality/mixed-handoff-cases.md` M1 Stage 1 then Stage 2 — complete ticket denominator, partial help, stale-versus-current evidence, mock-versus-real persistence, and continuation without another payment or tracker write. Retain Stage 1 before revealing Stage 2.

Give a fresh consumer the current selected Console `qa-product-v0` skill and the selected case text, but **not** `evals/dialogue-quality/reviewer-rubric.md`. A separate Lead AQA reviews the retained answers semantically with that rubric and records adequate/inadequate/indeterminate plus an actual quote and reason, exactly as `evals/dialogue-quality/README.md` and the rubric prescribe.

This four-scenario packet is the smallest existing combination found that contains all requested reasoning controls for an unfamiliar web/API context:

| Required control | Existing case |
| --- | --- |
| healthy independent work | C1 ticket B; C4 available-stock API; C6 read-only search |
| broken observable behavior | C4 inventory API 500 |
| ambiguous expectation / no invented bug | C6 empty cart and old screenshot |
| blocked capability / fixture | C1 ticket A |
| unknown original effect / no blind retry | C1 ticket C |
| ticket denominator and partial help | M1 Stage 1/2 |
| preserve supported work and resume remainder | M1 Stage 1/2 |

It satisfies the present operational restrictions: the case files explicitly forbid product execution, contact, receipts, payments, and tracker writes. It needs no live or loopback network, no registration, no dependency install, and no product write. It reuses the existing semantic reviewer rather than creating a second eval engine.

### Important limit on the word “qualification”

This packet qualifies **decision behavior only**. It is not P3 full execution, persisted fresh-process resume, a hidden-key P5 benchmark, or a live unfamiliar-product result. There is no existing zero-write/offline package that proves all of full/ticket/help/resume execution together. Under the requested restrictions, stronger claims must remain open.

## Exact runnable entry and command inventory

### Compliant dialogue control

There is intentionally **no package script or shell command** for `evals/dialogue-quality`. Its documented entry is the procedure in `evals/dialogue-quality/README.md`:

- pass the selected skill and case to a fresh consumer;
- retain its first answer;
- for M1 retain Stage 1 before supplying Stage 2;
- have a separate Lead AQA use `evals/dialogue-quality/reviewer-rubric.md`;
- preserve source revision, answers, review, and limitations in the existing qualification/checkpoint.

Do not invent `npm run eval:*`. Root `package.json` only defines:

```sh
npm test
npm run sources:restore
npm run sources:verify
```

`npm test` is `node --test tests/*.test.mjs`; it is the root packaging gate and does not run dialogue controls. It must not be reported as agent qualification.

### Stronger existing entries that are not compliant with this bounded test

The following exact documented commands exist, but should **not** be used for the proposed zero-registration/no-install test:

1. Public unfamiliar-catalog execution, from the selected Console directory:

```sh
node --import tsx ../../evals/public-input-agent-cycle/prepare.mts
node --import tsx --test ../../evals/public-input-agent-cycle/prepare.test.mts
node --import tsx --test ../../evals/public-input-agent-cycle/regression.test.mts
```

`prepare.mts` creates a private temp root, performs a real controlled Kernel registration, starts a loopback catalog, and writes an actor packet. The known-answer regression also creates a private loopback fixture and QA artifacts. The README additionally requires restored exact sources, installed Console/Kernel lockfiles, built Kernel, and an installed supported Chromium. This is the closest existing actual unfamiliar-web execution exercise, but it violates this scout's no-new-registration/no-install boundary.

2. Mixed ticket/help/continuation execution, from the repository root after the README's isolated-clone dependency/build preparation:

```sh
node --test evals/mixed-handoff-agent-cycle/fixture.test.mjs
QA_STARTER_REPO="$PWD/components/kernel" node --import ./components/console/node_modules/tsx/dist/loader.mjs evals/mixed-handoff-agent-cycle/prepare.mts
```

`prepare.mts` creates a temp root, registers an authored fixture, starts a loopback product, and writes registration/checkpoint/journal artifacts. It therefore cannot be the next zero-registration test.

3. Registered crash/remaining-only continuation candidate:

```sh
TSX_DISABLE_CACHE=1 QA_STARTER_REPO="$PWD/components/kernel" \
QA_STARTER_EXPECTED_SHA=185d3e72309a4362db57cf2e805d1c00a5035909 \
node --import ./components/console/node_modules/tsx/dist/loader.mjs \
  --test --test-reporter=spec evals/campaign-continuation/recovery.mts
```

That command is explicitly tied to historical Console `b54b849...` / Kernel `185d3e7...`, creates fresh synthetic registered workspaces and retained artifacts, and contacts its loopback API. It is a real continuation-mechanism qualification, not a suitable current zero-registration reasoning sample.

Console's documented campaign commands (`npm run qa-campaign -- validate`, `run`, `status`, `record-review`, and observation read/write commands) operate on an existing explicit workspace. They are not a registration-free substitute for a missing web/API exercise, and the selected skill forbids inventing a universal `full`, `ticket`, or `resume` command.

## What existing evidence already proves

### Dialogue-quality reasoning sample

`evals/dialogue-quality/20260914/README.md` preserves four actual M1/M2 Stage 1/2 replies and an independent Lead AQA acceptance. In that bounded sample the consumers:

- preserved all seven tickets;
- kept mock-only fee evidence separate from PostgreSQL persistence;
- reused the original paid operation instead of requesting another payment;
- did not let a partial VPN handoff collapse the remaining scope;
- distinguished an API-only masking criterion from an explicit UI criterion;
- continued independent work rather than blocking the whole batch.

It also retains one minor question-ownership/communication finding. It proves a historical open-context reasoning sample only: no product/tool execution, durable checkpoint readback, tracker action, or current-source transfer.

### Public-input unfamiliar catalog

The historical public-input agent-cycle demonstrates that a fresh consumer can use an existing controlled registration, design and execute substantive public catalog checks, preserve the staff/auth blocker, inspect persisted evidence, and diagnose a seeded search behavior while preserving healthy checks. The reviewed regression distinguishes healthy eight-pass behavior from broken four-pass/four-needs-review behavior and retains the blocker.

This is not autonomous onboarding, hidden-answer qualification, current-pair transfer, live-product acceptance, or a zero-registration replay. Its README explicitly says evaluator and actor share a filesystem and confidentiality is not enforced.

### Mixed ticket/help/continuation execution

The accepted 14 September controlled mixed-handoff execution used fresh actors and actual Console/Kernel publication, plan, runner, reader, receipts, and a caller checkpoint. It preserved seven tickets, diagnosed one seeded quote defect, continued healthy API/UI checks while capability lanes waited, rejected a false-ready reply, rechecked identity/readiness, and later ran only newly available QA-701. Prior passes were referenced rather than rerun or folded into a false cumulative receipt.

That is strong bounded synthetic evidence for ticket/help/continuation mechanics, but it used a prepared registration, loopback target, dependencies, older source pair, parent-observed actor boundaries, and writable artifacts. It is not a current unfamiliar-product/full-release or hidden-answer P5 gate.

### Campaign interruption and remaining-only resume

The registered recovery candidate demonstrated actual interruption, fresh status reading, A complete / B uncertain / C unstarted separation, remaining-only execution, preserved accepted bytes, a healthy control, a seeded broken-C control, a retained independent blocker, and terminal repeat with zero new target requests. This proves its historical controlled mechanism boundary, not arbitrary browser/auth/payment recovery, host restart, current-source behavior, or product acceptance.

## Missing controls against P3/P5

| Gate | Present evidence | Still missing |
| --- | --- | --- |
| P3 full | Public-input actor designed meaningful catalog checks and retained staff scope; C5/C6 exercise product/design reasoning | One current-source fresh actor deriving and executing an explainable full known denominator for an unfamiliar real web/API product; original versus discovered scope; compound-clause accounting; quality attributes; no claim from an empty executor queue |
| P3 ticket | Static M1/M2 and executable Relay preserve a seven-ticket batch | Current-source real tracker read, original-path reproduction, related-risk check, and separately authorized persisted tracker readback; one real single-ticket result still would not close live mixed-batch |
| P3 help | C1/M1 and controlled Relay preserve independent work and reject false readiness | Actual authorized human-input/tool handoff on current source, with readiness/account/environment re-read and concrete resume point; static supplied text is not tool qualification |
| P3 resume | Controlled Relay and campaign continuation preserve completed/unknown/pending distinctions | Current-source unfamiliar web/API fresh-process continuation under this exact skill; static M1 Stage 2 is not durable state recovery; no arbitrary host-restart/payment replay proof |
| P5 healthy | C1/C4/C6 and public-input healthy controls | Current-source fresh first attempt across the same declared acceptance set |
| P5 broken | C4 observable 500; public-input and Relay seeded defects; continuation broken C | Current-source held-out defect in an unfamiliar product; survival after any skill fix; no critical seeded miss |
| P5 ambiguous | C4 causal uncertainty and C6 expectation conflict | Executed ambiguity where the actor must distinguish oracle, fixture, harness, environment, and product behavior using current tools |
| P5 blocked | C1 fixture gap, staff blocker, Relay capability gaps | Current-source actual missing-capability/help path with independent execution and durable continuation |
| P5 unknown effect | C1 unknown payment; continuation uncertain B | Current unfamiliar-product reconciliation without a retry; no real payment/mutation qualification is required for a read-only pilot |
| P5 transfer | Historical fresh consumers on older attributed sources | Current Console `c421160` + Kernel `aa5d2d` fresh actor; at least one permitted real unfamiliar product remains required by the plan |
| P5 metrics | Historical narrative counts and retained first responses | Predeclared interpretation/execution/transfer measures, retries/skips/cost, and one consolidated current trial record |

## Answer-key isolation

This is the most important P5 limitation:

- `evals/dialogue-quality/README.md` explicitly says prompt separation is not enforced blind isolation. If the host can read `reviewer-rubric.md`, the result must be labelled **open-context controlled sample**.
- `evals/public-input-agent-cycle/README.md` explicitly says evaluator and actor share a filesystem and no inaccessible answer-key claim is available.
- The mixed-handoff executable asks the actor not to read fixture/controller/reviewer paths, but enforcement and actor identity are parent-observed rather than cryptographically attested.

Therefore none of these records closes the P5 requirement that the answer key be actually inaccessible. A fresh context or instruction not to read a path is not sufficient isolation.

The zero-write dialogue packet can still be useful now, but its report must say `open-context`. Genuine hidden-key qualification needs a separately prepared host/filesystem boundary; that is outside this read-only scout and should not be simulated with prompt wording.

## Suggested next bounded test

Run one **current-source open-context decision baseline** using the four-scenario packet above, before any skill change:

1. Record root `45a74c3`, Console `c421160...`, Kernel `aa5d2d...`, model/host, and supplied skill paths.
2. Give actor A only the selected skill/references plus C6, C4, C1, and M1 Stage 1. Retain the unedited first answers and any self-corrections.
3. Freeze actor A's M1 Stage 1 result. Give a fresh actor B that retained checkpoint/answer plus M1 Stage 2, while continuing to withhold the reviewer rubric. This small actor split directly probes scope transfer better than replaying the already accepted same-context two-stage sample; label it open-context because filesystem isolation is still absent.
4. A separate Lead AQA applies the existing rubric and M1 semantic obligations. Report interpretation and transfer separately. Fail the bounded gate for any unsupported PASS, false healthy bug, repeated unknown-effect action, lost ticket, batch-wide stop on one blocker, invented UI requirement, or claim that only the aggregate remains.
5. Preserve answers, review, limitations, and source IDs in the existing private qualification/checkpoint. Do not add a runner, registration, product server, tracker write, or reliability percentage.

This is the smallest safe fresh baseline available now. It will not close P3/P5, but it will provide current-source first-attempt evidence for web/API reasoning and fresh-actor transfer without violating the no-network/no-registration/no-install/no-product-write boundary. The next stronger step, when registration/artifact writes and local loopback execution are separately allowed, should reuse `evals/public-input-agent-cycle` plus the existing mixed-handoff/continuation machinery rather than build another eval engine.
