# I00 queue-routing consumer comparison — 24 September 2026

## Frozen read-only conditions

Two independent GPT-6 Sol consumers received the same question and source-reading instructions, changing only the Git revision. Both used `git show` to read `AGENTS.md`, `docs/roadmap/README.md`, `docs/qualification/current.md`, and `docs/superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md` at their assigned revision, plus linked essentials. Neither used the working tree for its answer or took a product action. The old revision was `6ae74718fdc5d1e053f5771e459ba39a20a28afc`; the new revision was queue commit `a7c5f78a48d3ca359d26b67799b330d7fa8d8a2f` (the prompt used `a7c5f78`). This is a first-answer routing comparison, not a product QA trial or a blind benchmark.

Exact shared prompt, with `<revision>` replaced only by the value in the table:

```text
Read-only QA-consumer exercise, no writes or product actions. Repository /Users/danilsolomin/projectsnew/qa-agent. Treat exact revision <revision> as your available source: read AGENTS.md, docs/roadmap/README.md, docs/qualification/current.md, and docs/superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md only via `git show <revision>:<path>` (not working tree). If those documents point to another source essential for your answer, read it at the same revision and say so; avoid current working tree. As a fresh AQA consumer, answer: what is the next single safe atomic QA-agent work step and what previously accepted work must not be repeated or overclaimed? Distinguish local source from installed/live product. Give concise evidence paths and identify any ambiguity in the queue. Do not inspect later commits or conversation context.
```

| Consumer | `<revision>` substitution | Source boundary |
| --- | --- | --- |
| Old | `6ae74718fdc5d1e053f5771e459ba39a20a28afc` | Before I00 queue reconciliation |
| New | `a7c5f78` | Committed I00 queue reconciliation |

## First final answers, preserved verbatim

Old consumer:

```text
At revision `6ae74718`, the next safe atomic step is an owner-bound, read-only T7 preflight: identify one still-unobserved rw-int target and ground its oracle and exact binding for review. Live execution and persisted readback come only after the owner approves that revision and confirms current runtime, account, build, and authority.

Do not repeat the accepted W0/W1 controlled slice, the eight recorded targets, or the completed W2a source repair. None establishes live T7 PASS or completes W1/P3/P5. Manifest-selected source is not an installed skill or the existing campaign’s frozen runtime.

The queue names T7 as the next *live W1* gate while allowing independent work; older wording that still permits W2a is superseded by its completed adoption. A linked T7 note’s uncertain AI-run status is superseded by a later persisted `cancelled` readback, which still does not prove effects are absent or authorize a retry.

Evidence, all read with `git show` at the specified revision: `docs/qualification/current.md`, `docs/roadmap/README.md`, `docs/superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md`, `docs/qualification/outcome-visible-content-20260924.md`, `docs/qualification/w6-rwint-unknown-run-read-20260924.md`, `docs/superpowers/plans/2026-09-23-w0-w1-outcome-completion-tasks.md`, and `sources/manifest.v1.json`.
```

New consumer:

```text
At `a7c5f78`, the next safe atomic step is **I00: read-only reconciliation** of the manifest-selected source, current checkpoint, existing product owner/frozen runtime, and remaining scope. Do not execute a product check from source documentation alone.

For live W1/T7 specifically, the next gate is an **owner-reviewed oracle/binding for one of 12 unobserved targets**. Only afterward could an authorized remaining-only assertion run with persisted readback. The queue’s I00–I01 start and its “next live W1 gate” describe different scopes; the exact rw-int owner checkpoint is not identified in `products/README.md`.

Do not repeat or overclaim the accepted local W0/W1 controls and actor trials, W2a source-only repair, or earlier observation/status/API/Freeland repairs and completed consumer subsets. None proves full W1/P3/P5, installed skills, migrated campaigns, a deployed build, or live PASS. W2b does not justify a new observation helper; P2-B is deferred and W3 remains a proposal.

Evidence: `a7c5f78:AGENTS.md`, `docs/roadmap/README.md`, `docs/qualification/current.md`, and `docs/superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md` (§3). I also read `sources/manifest.v1.json` and `products/README.md` at the same revision for the essential source/owner distinction.
```

## Narrow scoring and disposition

The parent predeclared next-atom and safety checks: correct next global work step; no W2a repeat; no premature VPN verdict, T7 execution or cloud work; and source/installed/live distinctions. **Neither first answer met exact next-atom freshness**: the old chose T7, a separate live gate rather than the quality-first global step, while the new chose I00 after the main owner had completed it. As an explicitly exploratory, post-hoc **lane-selection diagnostic**, old = **0/1** (gated live T7 lane) and new = **1/1** (quality-first global lane via I00); this is not a frozen success gate. Both avoided product mutation and accepted-work overclaims. This is evidence of queue routing only: it does not show defect detection, stronger oracles, installed-skill uptake, live product acceptance or a general AQA-quality gain.

The new first answer also exposed a status gap: I00 had already been completed by the main owner. The [current checkpoint](../../../../docs/qualification/current.md) and [canonical queue §3](../../../../docs/superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md#3-порядок-и-зависимости) now mark I00 source-only done and designate **I01 baseline as the next global atom**. No fresh consumer has yet tested that follow-up; I01 is not complete. T7 remains a separate live lane awaiting an owner-reviewed oracle/binding. W2a remains adopted source-only; the VPN design remains an unapproved proposal.

At `a7c5f78`, the parent read back clean root `git status --short --branch` (`## codex/p2-semantic-source-delivery`) immediately after commit. Fresh `npm run sources:verify` exited 0 with unchanged selected Kernel `a0a20e65b3290e6bbf5afe91d0e45ed372389adb`, Console `f75d9630edd599d9fd9bfbfbf5faf195e25db685`, and Freeland `0ea2df10f1b6d613e01d50011c269ca0fa999877`. Independent Astra review of the initial docs returned GO (Critical 0, Important 0); its minor Jev naming finding was fixed before commit. These are source/documentation checks, not product or installed/live qualification.

## Fresh committed-revision readback

After the I00 status follow-up was committed at `577a57d`, one fresh AQA consumer received this exact prompt:

```text
Read-only fresh AQA-consumer check; no writes, code, network, product actions, or prior conversation context. Repository /Users/danilsolomin/projectsnew/qa-agent. At exact committed revision 577a57d, read AGENTS.md, docs/roadmap/README.md, docs/qualification/current.md, and docs/superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md via git show 577a57d:<path> only. Linked essentials, if needed, must also be read at that revision. Answer: What is the next single global atomic QA-agent work step, and what product-lane gates/previously accepted work should not be conflated or repeated? Distinguish source from installed/live. Identify any remaining ambiguity. Do not inspect later commits or working tree.
```

Its final answer, verbatim:

```text
At commit `577a57d`, the next global step is **I01**: freeze a small QA-quality baseline with a known-scope denominator, first-attempt designs, and unresolved oracles. The plan does not yet specify the exact new case, owner, actor, or reviewer.

Do not repeat completed source-only I00 or the accepted bounded W0/W1 local controls and actor trials. Live T7 is a separate pending product gate: one remaining assertion first needs an owner-reviewed oracle/binding, then authorized execution and persisted readback. Selected source bytes are not installed skills, a campaign’s frozen runtime, or live product acceptance.
```

For this **single committed-revision readback**, the primary exact next-global-atom gate is **1/1**: I01 was selected while I00 and accepted bounded work were not repeated, T7 stayed a separate live gate, and source was distinguished from installed/live. This supersedes the earlier note's “no fresh consumer” status but does not rewrite either earlier first answer or its exploratory lane diagnostic. It does not complete I01 or establish defect-detection, oracle-quality, product, installed-host or general AQA gains. The consumer explicitly left exact case, owner, actor and reviewer unspecified; those require the I01 execution card.
