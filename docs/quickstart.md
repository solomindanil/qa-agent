# Quickstart: first QA run and report

This page takes you from a clean clone to a Markdown report in about 15 minutes. It uses the QA Starter lane (Console and Kernel) on macOS or Linux against `https://example.com/`, a page reserved for documentation examples. Every check is an anonymous, read-only page load; nothing is submitted.

No single command does this, and the run does not test a whole product. For a real product, continue with [Getting started](getting-started.md) and the [qa-product-v0 skill](../components/console/skills/qa-product-v0/SKILL.md) after this page.

You need Git, Node.js 22.12 or newer, and network access.

## 1. Get the source and install

```sh
git clone --branch develop https://github.com/solomindanil/qa-agent.git
cd qa-agent
npm run sources:restore && npm run sources:verify
(cd components/kernel && npm ci --ignore-scripts && npm run build)
(cd components/console && npm ci --ignore-scripts)
```

## 2. Create private directories and settings

Choose a new directory outside the clone. The private directories must have mode `700`; registration refuses wider permissions.

```sh
export QA_DEMO="$HOME/qa-demo"
mkdir -p "$QA_DEMO" && mkdir -m 700 "$QA_DEMO/workspaces" "$QA_DEMO/private" "$QA_DEMO/out"
cat > "$QA_DEMO/env.sh" <<EOF
export QA_AGENT_ROOT="$(pwd -P)"
export QA_STARTER_REPO="\$QA_AGENT_ROOT/components/kernel"
export QA_STARTER_EXPECTED_SHA="\$(cd "\$QA_AGENT_ROOT" && node -p 'require("./sources/manifest.v1.json").components.find(c=>c.id==="kernel").commit')"
export QA_WORKSPACE_ROOTS="$QA_DEMO/workspaces"
export QA_CONSOLE_STATE="$QA_DEMO/private/receipts.json"
export QA_CONSOLE_PRIVATE_ROOT="$QA_DEMO/private/console-private"
export QA_REGISTRATION_STORE="$QA_DEMO/private/registrations"
export QA_REGISTRATION_TARGET_REGISTRY="$QA_DEMO/private/registration-targets.v1.json"
EOF
```

Run this from the clone root, because `$(pwd -P)` records it.

## 3. Start the Console in a second terminal

```sh
export QA_DEMO="$HOME/qa-demo"; source "$QA_DEMO/env.sh"
cd "$QA_AGENT_ROOT/components/console" && npm run dev -- --host 127.0.0.1 --port 5173
```

Leave it running. In the first terminal, load the same settings:

```sh
source "$QA_DEMO/env.sh" && cd "$QA_AGENT_ROOT/components/console"
```

## 4. Describe the target and register it

The `description` inside `briefText` must be exactly the same as the top-level `description`, otherwise `qa-init` rejects the file without saying which field is wrong.

```sh
cat > "$QA_DEMO/answers.json" <<'EOF'
{"productName":"Example Domain","slug":"example-domain","description":"Reserved example page used to try QA Starter","assuranceMode":"black_box","surfaces":["landing"],
 "environments":[{"kind":"production","name":"Public page","baseUrl":"https://example.com/"}],"sources":[],"secretRefs":[],
 "briefText":"{\"product\":{\"name\":\"Example Domain\",\"description\":\"Reserved example page used to try QA Starter\"},\"surfaces\":[{\"kind\":\"landing\",\"name\":\"Home page\"}],\"journeys\":[{\"name\":\"Open the home page\",\"expectedOutcome\":\"The page loads and shows the heading Example Domain\"}],\"risks\":[]}"}
EOF
W="$QA_DEMO/workspaces/example-domain"
npm run qa-init -- --answers "$QA_DEMO/answers.json" --workspace "$W" --console-url http://127.0.0.1:5173 --dry
npm run qa-init -- --answers "$QA_DEMO/answers.json" --workspace "$W" --console-url http://127.0.0.1:5173 --timeout-ms 480000
```

Do not create `$W` yourself. Progress lines are normal; the final JSON result after them must contain `"status": "registered"`. The first registration can take more than the default two minutes; if it prints `"status": "timeout"`, run the `recoveryCommand` it printed, adding `--timeout-ms 480000`.

## 5. Plan, approve, run

```sh
export QA_WORKSPACE="$W"; PLAN="$W/tests/qa-campaign.v0.json"
npm run qa-campaign -- generate-baseline --workspace "$W" --plan "$PLAN"
npm run qa-campaign -- approve-oracles --workspace "$W" --plan "$PLAN"
```

Read the checks that `approve-oracles` prints: what they open, what they assert and their `expectedBehavior`. Approving them is your decision, not the tool's. If you agree, approve the exact digest it printed, then validate and run:

```sh
npm run qa-campaign -- approve-oracles --workspace "$W" --plan "$PLAN" --approval-digest sha256:PRINTED_DIGEST
npm run qa-campaign -- validate --workspace "$W" --plan "$PLAN"
npm run qa-campaign -- run --workspace "$W" --plan "$PLAN"
```

`validate` returns `"ok": true` with `"readyToRun": false` here. That is expected: the journey target is blocked, and `run` still executes the approved checks.

## 6. Read the result

Expected: `"verdict": "NEEDS_HUMAN"` with `"checkCounts": {"pass": 2}`, and the command exits with code 1. That is the correct outcome, not an error. The two baseline checks passed: the page returns 200, shows its body, has no horizontal overflow at 390×844, and logs no console errors. The user journey stays blocked because no steps or expected outcome were approved for it. Any verdict other than `PASS` exits non-zero, so a script with `set -e` stops at `run`.

Export the report using the `runId` that `run` printed:

```sh
npm run --silent qa-campaign -- export-outcomes --workspace "$W" --run-id RUN_ID \
  --output-dir "$QA_DEMO/out/first-run" --registration-store "$QA_REGISTRATION_STORE" \
  --target-registry "$QA_REGISTRATION_TARGET_REGISTRY" --approval-store "$QA_CONSOLE_PRIVATE_ROOT/oracle-approvals"
```

For a short view, read `verdict`, `checks` and `blockedTargets` in the run's `receipt.json` under `$W/tests/campaign-runs/`. The exported `$QA_DEMO/out/first-run/report.md` is long and mostly JSON. Read `Per-attempt assertion accounting` for each check's result, then `Limitations and remainder`. `Registered coverage targets` shows the targets as recorded at registration, before approval, so even the passed ones appear there as `coverage_gap`.

## What this run does and does not show

- It shows that your setup can register a public read-only target, run approved browser checks and save evidence.
- A `PASS` would cover only the approved checks in this campaign, not the product or a release.
- Login, forms that change data, payments and native apps are outside this path and stay blocked.
- To test your own product: describe it in `answers.json` with facts you can source, then follow [Getting started](getting-started.md) and let an agent work from [AGENTS.md](../AGENTS.md).
