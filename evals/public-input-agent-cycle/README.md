# Fresh agent public-input execution exercise

This extends the existing E1 controlled fixture to a fresh consumer. It is not a
new runner, live product qualification, full onboarding proof, or a blind benchmark.
The evaluator and actor share a filesystem; no inaccessible answer-key claim.

## Prepare the owned target

Restore the exact source manifest in an isolated root and install the Console and
Kernel lockfiles there. Build the paired Kernel. Use an already installed supported
Playwright Chromium; browser installation needs its own authority if absent.
Do not use default Console npm test or a historical product checkout.

From the selected Console directory, with QA_STARTER_REPO set to the absolute
paired Kernel and QA_STARTER_EXPECTED_SHA to its verified manifest commit:

```sh
node --import tsx ../../evals/public-input-agent-cycle/prepare.mts
```

It creates a new private temp root and a real controlled Kernel registration,
starts an owned loopback catalog and prints its ready packet path. Keep that
process alive for the actor. It does not generate a campaign, publish new
agent-authored knowledge, run QA, create an issue or delete evidence. SIGINT or
SIGTERM closes its server; the workspace remains for later review.

Registration uses the existing synthetic helper's fixed clock, deterministic IDs
and controlled discovery. This is preparation, not proof that a fresh agent
registered an unfamiliar real product. The agent must reuse that workspace.

## Fresh actor request

Start one fresh context, retain its first response and every attempt. Supply only
the ready actor-context.json, this request, and the source-root entry. Do not
supply unit-test plans, source fixture implementation, evaluator findings or
expected input-specific counts as the answer. Runtime/API/skill source inspection
is allowed; fixture/answer inspection is outside this exercise's requested scope,
but this host does not enforce its confidentiality.

> Test the public catalog described in the packet's product-brief.md. Read the
> source entry and selected complete skills/references. The packet's registration
> is the existing owner; do not re-register it. Inspect the rendered target and
> design meaningful public search/category/clear checks with sourced expectations.
> Retain unsupported and unrun scope. You may inspect the owned URL with the
> existing browser tools, publish reviewed knowledge to this owned registration
> through the existing Kernel APIs, author and execute read-only campaign checks,
> and save your scripts/report/checkpoint in the exercise root. Use the existing
> campaign validation/execution and actual persisted evidence reader; do not
> hand-edit managed graph/catalog or immutable receipts. No external origins,
> installations, credential actions, mutation requests, tracker writes, product
> changes or another runner. Diagnose any failure rather than automatically
> calling it a product bug or asking the human. Report evidence, limits and the
> next action. No helpers. Inspect only this source root and the exercise root.

Before execution, the actor must state the current plan digest, executable and
blocked scope and exact local target. The above authority covers only this
controlled public slice, not a production release or financial action.

## Review the real result

Keep the original plan, complete attempts, screenshots/traces, immutable receipt
and separate agent diagnosis. A fresh consumer must load the existing canonical
plan/graph/catalog and call readLatestCampaignEvidence; merely opening receipt
JSON is insufficient. Verify matching run and bindings and inspect the asserted
rendered states. An INCONCLUSIVE/needs_review receipt is agent work, not an
automatic human blocker; a grounded diagnosis does not rewrite that receipt.

Review whether the agent actually chose and executed meaningful tests, detected
the seeded behavior, preserved healthy independent checks and remaining scope.
Distinguish fixture, tool, oracle and product failures. A healthy countercontrol
must retain the substantive expectations, not weaken them to turn green. Report
controller assistance, retries and source changes; coached corrections are not
fresh first-attempt successes. No reliability percentage follows from one sample.

## Setup regression

With the same paired environment, from Console:

```sh
node --import tsx --test ../../evals/public-input-agent-cycle/prepare.test.mts
```

This checks the setup boundary and retained registration/target relationship, not
agent competence. Existing public-input unit controls stay in the Console source.
