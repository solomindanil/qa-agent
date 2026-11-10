# S1-min: run the loopback stateful lane on the ToolShop stand

Pivot slice S1 ([plan](superpowers/plans/2026-11-09-pivot-find-bugs.md), design §7 S1-min). This recipe is the
owner-executed acceptance path: registration → author v3 → approve the replay question → validate → run →
export → offline read. Nothing here was executed against the stand by the author of the slice; the measurement
table in [current.md](qualification/current.md) is filled only after the owner's run and the independent
evaluator's comparison.

Environment variable **names** only appear below. Credential values come from the stand's README seed table
and are exported in the operator's shell; they never enter the repository, the plan, the receipt, the logs or a
chat message.

## 0. What the lane is and is not

- Enabled only for a registered `targetClass: loopback_http` environment, a plan with a
  `sideEffectAuthorization` record (class `reversible_mutation`, exact loopback origins, exact mutation routes,
  budget, declared `secretRefs`) and `run --allow-side-effect reversible_mutation`. Any one of the three
  missing refuses before a run directory, a browser or a request exists.
- Every `fill`/`select` value of the lane check is an `environment` reference declared in `secretRefs`;
  `press.key` is limited to navigation keys. Resolved values are checked for absence in the plan before the
  browser starts and in every sealed artifact and the receipt before the receipt is written.
- One browser context, one attempt, no automatic retry. Budget or deadline exhaustion is `harness_failure`
  `SIDE_EFFECT_BUDGET`; a request outside the authorized origins/routes, a redirect on a mutation route, a
  WebSocket, a worker or a popup is `SIDE_EFFECT_SCOPE`; a dispatched mutation without a response is
  `SIDE_EFFECT_UNKNOWN`. None of these can seal as PASS.
- The ledger lives inside the receipt (`receipt.sideEffects{authorization, entries[], count, unknownCount}`;
  entries record the approved route template, method, origin, status and outcome, never bodies, headers or
  identifiers). `read-outcomes` and the Console reader refuse a receipt whose ledger disagrees with its plan.
- A foreign safe subresource (a CDN stylesheet, font, image or read-only fetch outside the scope origins) is
  aborted and recorded in the trace (`foreign_asset=aborted`) and in `failedRequests`; it is never fetched and does
  not end the check. Mutations, navigations, WebSockets, workers and popups outside the scope still fail closed.
- GET/HEAD/OPTIONS requests to the authorized origins are reads: they are forwarded with the browser's own
  session and are not budgeted. A product that mutates on a GET is outside the ledger; declare such a route
  as a risk, not as a mutation route.
- Production stays read-only. Kernel is unchanged: the catalog entry keeps its anonymous read-only
  declaration; the plan record, covered by the oracle approval digest, binds the effect and the secrets.

## 1. Stand (owner operation, outside the runner)

```sh
cd /Users/danilsolomin/projectsnew/toolshop-bench && docker compose up -d
```

```sh
cd /Users/danilsolomin/projectsnew/toolshop-bench && docker compose exec laravel-api php artisan migrate:fresh --seed --force
```

UI `http://localhost:24200`, API `http://localhost:28091`. Reset with the same `migrate:fresh --seed --force`
before every measured run; the runner never resets anything.

## 2. Operator shell: Starter settings plus the lane secrets

Follow [quickstart](quickstart.md) §1–§2 for the clone, dependencies and `env.sh`, then add the loopback grant
and the seed-account values (from the stand README, user role, not the admin):

```sh
export QA_LOOPBACK_ORIGINS='["http://localhost:24200","http://localhost:28091"]'
```

```sh
read -rs QA_SECRET_TOOLSHOP_PASSWORD && export QA_SECRET_TOOLSHOP_PASSWORD
```

Also export `QA_SECRET_TOOLSHOP_EMAIL`, `QA_SECRET_TOOLSHOP_PAYMENT_METHOD` (one of the stand's payment method
labels), `QA_SECRET_TOOLSHOP_ACCOUNT_NAME` and `QA_SECRET_TOOLSHOP_ACCOUNT_NUMBER` (the payment form requires
both for the bank-transfer style methods), `QA_SECRET_TOOLSHOP_STATE` (the seeded customer's billing `state`
is empty and the address step needs it) and, for the positive control only, `QA_SECRET_TOOLSHOP_POSTCODE` (a short
postcode replacing the product's prefilled placeholder, see §4). Non-secret fixtures still travel as environment references: that is
what makes a literal in a lane plan a structural rejection, and the plan text itself (`reproductionSteps`,
`preconditions`, `expectedBehavior`, locator names) must not contain any of these values either: admission
refuses a plan that embeds a resolved value, so describe the payment method, not its label.

Start the Console dev server from `components/console` with the same environment (the grant is read at
startup), as in quickstart §3.

## 3. Register the stand (loopback, Web surface, one purchase journey)

```sh
cat > "$QA_DEMO/toolshop-answers.json" <<'EOF'
{"productName":"ToolShop bench","slug":"toolshop-bench","description":"Local Practice Software Testing sprint5 stand used for the S1 stateful lane","assuranceMode":"black_box","surfaces":["web"],
 "environments":[{"kind":"local","name":"ToolShop stand","targetClass":"loopback_http","baseUrl":"http://localhost:24200/","additionalOrigins":["http://localhost:28091"]}],"sources":[],"secretRefs":[],
 "briefText":"{\"product\":{\"name\":\"ToolShop bench\",\"description\":\"Local Practice Software Testing sprint5 stand used for the S1 stateful lane\"},\"surfaces\":[{\"kind\":\"web\",\"name\":\"Shop UI\"}],\"journeys\":[{\"name\":\"Buy a product as the seeded customer\",\"expectedOutcome\":\"After login, adding a product and finishing checkout, the confirmation names an invoice number\"}],\"risks\":[]}"}
EOF
```

```sh
W="$QA_DEMO/workspaces/toolshop-bench"; npm run qa-init -- --answers "$QA_DEMO/toolshop-answers.json" --workspace "$W" --console-url http://127.0.0.1:5173 --timeout-ms 480000
```

`secretRefs` stays `[]`: the registration vertical does not accept secret references and the lane does not
need them in the profile (design §7). Registration is network-free. Then `generate-baseline` as in quickstart
§5; the journey target is a blocker with an unresolved Web candidate until the next step replaces it.

## 4. Author the lane check (`qa-authored-checks.v3`)

Find the Web journey candidate in `$W/model/test-catalog.json` (`candidatePath` ending in
`web/generated/registration.candidates.spec.ts`, oracle `unresolved`, one target) and the retained source
(profile `sources[0]` id/locator/contentDigest and the journey node's `provenance[0].source`). Then:

```sh
cat > "$QA_DEMO/toolshop-v3.json" <<'EOF'
{
 "schemaVersion": "qa-authored-checks.v3",
 "baseUrl": "http://localhost:24200/",
 "sideEffectAuthorization": {
  "schemaVersion": "qa-campaign-side-effect-authorization.v0",
  "classes": [
   "reversible_mutation"
  ],
  "scope": {
   "environmentId": "<environment id from qa-project.yaml>",
   "targetClass": "loopback_http",
   "baseUrl": "http://localhost:24200/",
   "origins": [
    "http://localhost:24200",
    "http://localhost:28091"
   ],
   "mutationRoutes": [
    {
     "origin": "http://localhost:28091",
     "method": "POST",
     "path": "/invoices"
    },
    {
     "origin": "http://localhost:28091",
     "method": "POST",
     "path": "/payment/check"
    },
    {
     "origin": "http://localhost:28091",
     "method": "POST",
     "path": "/users/login"
    }
   ]
  },
  "budget": {
   "maxMutations": 20,
   "maxRunMinutes": 10
  },
  "secretRefs": [
   "QA_SECRET_TOOLSHOP_ACCOUNT_NAME",
   "QA_SECRET_TOOLSHOP_ACCOUNT_NUMBER",
   "QA_SECRET_TOOLSHOP_EMAIL",
   "QA_SECRET_TOOLSHOP_PASSWORD",
   "QA_SECRET_TOOLSHOP_PAYMENT_METHOD",
   "QA_SECRET_TOOLSHOP_POSTCODE",
   "QA_SECRET_TOOLSHOP_STATE"
  ]
 },
 "replacements": [
  {
   "targetId": "<journey target id>",
   "replaceEntryId": "<web candidate entryId>",
   "coverageReason": "Owner-approved purchase replay on the seeded local stand",
   "checks": [
    {
     "key": "buy-product",
     "name": "Login, add to cart, place order",
     "reason": "Seeded customer completes one purchase",
     "sourceCitation": {
      "sourceId": "<brief source id>",
      "authority": "unreviewed_user_input",
      "contentDigest": "<brief contentDigest>",
      "locator": "<brief locator>",
      "statement": "The brief declares the purchase journey",
      "applicability": "Local seeded stand only"
     },
     "execution": {
      "kind": "browser",
      "surface": "web",
      "title": "Login, add to cart, place order",
      "sideEffectClass": "reversible_mutation",
      "preconditions": [
       "Stand reset with migrate:fresh --seed before the run",
       "Seeded customer account exported as QA_SECRET_TOOLSHOP_* names"
      ],
      "reproductionSteps": [
       "Open product 1 via the hash route /#/product/1",
       "Add it to the cart",
       "Open the cart and proceed",
       "Sign in with the seeded customer",
       "Wait for the billing address to be prefilled, complete the empty state field and replace the prefilled postcode with a short value",
       "Choose the payment method, fill account name and number, press Confirm once for the payment check, wait for the success message, press Confirm again to create the invoice"
      ],
      "expectedBehavior": "After login, adding a product and finishing checkout, the confirmation names an invoice number",
      "severity": "high",
      "severityJustification": "Core purchase flow of the reference product",
      "viewport": {
       "width": 1280,
       "height": 900
      },
      "operations": [
       {
        "kind": "navigate",
        "path": "/#/product/1"
       },
       {
        "kind": "click",
        "locator": {
         "kind": "css",
         "selector": "[data-test=add-to-cart]"
        }
       },
       {
        "kind": "click",
        "locator": {
         "kind": "css",
         "selector": "[data-test=nav-cart]"
        }
       },
       {
        "kind": "click",
        "locator": {
         "kind": "css",
         "selector": "[data-test=proceed-1]"
        }
       },
       {
        "kind": "fill",
        "locator": {
         "kind": "css",
         "selector": "[data-test=email]"
        },
        "value": {
         "kind": "environment",
         "name": "QA_SECRET_TOOLSHOP_EMAIL"
        }
       },
       {
        "kind": "fill",
        "locator": {
         "kind": "css",
         "selector": "[data-test=password]"
        },
        "value": {
         "kind": "environment",
         "name": "QA_SECRET_TOOLSHOP_PASSWORD"
        }
       },
       {
        "kind": "click",
        "locator": {
         "kind": "css",
         "selector": "[data-test=login-submit]"
        }
       },
       {
        "kind": "click",
        "locator": {
         "kind": "css",
         "selector": "[data-test=proceed-2]"
        }
       },
       {
        "kind": "fill",
        "locator": {
         "kind": "css",
         "selector": "[data-test=state]"
        },
        "value": {
         "kind": "environment",
         "name": "QA_SECRET_TOOLSHOP_STATE"
        }
       },
       {
        "kind": "fill",
        "locator": {
         "kind": "css",
         "selector": "[data-test=postcode]"
        },
        "value": {
         "kind": "environment",
         "name": "QA_SECRET_TOOLSHOP_POSTCODE"
        }
       },
       {
        "kind": "click",
        "locator": {
         "kind": "css",
         "selector": "[data-test=proceed-3]"
        }
       },
       {
        "kind": "select",
        "locator": {
         "kind": "css",
         "selector": "[data-test=payment-method]"
        },
        "value": {
         "kind": "environment",
         "name": "QA_SECRET_TOOLSHOP_PAYMENT_METHOD"
        }
       },
       {
        "kind": "fill",
        "locator": {
         "kind": "css",
         "selector": "[data-test=account-name]"
        },
        "value": {
         "kind": "environment",
         "name": "QA_SECRET_TOOLSHOP_ACCOUNT_NAME"
        }
       },
       {
        "kind": "fill",
        "locator": {
         "kind": "css",
         "selector": "[data-test=account-number]"
        },
        "value": {
         "kind": "environment",
         "name": "QA_SECRET_TOOLSHOP_ACCOUNT_NUMBER"
        }
       },
       {
        "kind": "click",
        "locator": {
         "kind": "css",
         "selector": "[data-test=finish]"
        }
       },
       {
        "kind": "click",
        "locator": {
         "kind": "css",
         "selector": "[data-test=finish]"
        }
       }
      ],
      "assertions": [
       {
        "kind": "visible",
        "afterOperationIndex": 1,
        "locator": {
         "kind": "css",
         "selector": "[data-test=nav-cart]"
        }
       },
       {
        "kind": "visible",
        "afterOperationIndex": 6,
        "locator": {
         "kind": "css",
         "selector": "[data-test=proceed-2]"
        },
        "observation": {
         "mode": "eventual",
         "timeoutMs": 8000
        }
       },
       {
        "kind": "visible",
        "afterOperationIndex": 7,
        "locator": {
         "kind": "css",
         "selector": "[data-test=address].ng-valid"
        },
        "observation": {
         "mode": "eventual",
         "timeoutMs": 8000
        }
       },
       {
        "kind": "visible",
        "afterOperationIndex": 14,
        "locator": {
         "kind": "css",
         "selector": ".alert-success"
        },
        "observation": {
         "mode": "eventual",
         "timeoutMs": 8000
        }
       },
       {
        "kind": "visible",
        "locator": {
         "kind": "css",
         "selector": "#invoice-number"
        },
        "observation": {
         "mode": "eventual",
         "timeoutMs": 8000
        }
       }
      ]
     }
    }
   ]
  }
 ]
}
EOF
```

Angle-bracket placeholders are read from the registered workspace. This is the input that completed on the stand on
10 November 2026 (operator runs #7 and #8), ids redacted; facts each of which cost one failed run and a fresh
registration:

- The sprint5 UI routes by hash: navigate paths are `/#/product/<id>` (the plan grammar admits `/#/...`);
  `/product/1` lands on the home page.
- One lane declaration per workspace: `author-checks` refuses a second lane with `AUTHORED_LANE_ALREADY_DECLARED`,
  so every change to the lane check means a fresh registration under a new slug (2–3 minutes).
- `origins`, `mutationRoutes` (by origin, method, path) and `secretRefs` must be sorted and duplicate-free;
  `author-checks` refuses unsorted input rather than reordering it.
- Plan text (`reproductionSteps`, `preconditions`, `expectedBehavior`, locator names) must not contain any resolved
  value: admission refuses such a plan before the browser starts. Describe the payment method; do not name its label.
  Use a label such as the bank-transfer option that appears nowhere in the plan text.
- Address prefill race: after login the account prefill (GET `/users/me`) can arrive after the `state` fill and
  overwrite it; the `[data-test=address].ng-valid` eventual assertion after `proceed-2` waits for the prefill first.
- The Confirm button validates the payment on the first click (`.alert-success`, "Payment was successful") and
  creates the invoice on the second; hence the eventual assertion after the first `finish` click and the second click.
- The stand's UI loads one foreign CDN stylesheet; the lane aborts it (§0) and continues.
- Expected product result on the seeded stand: without the `postcode` fill (operation 9 and `QA_SECRET_TOOLSHOP_POSTCODE`
  removed) the purchase ends in `POST /invoices` 500 after a successful payment check, because the product prefills
  the postcode with a literal placeholder text and the invoice insert then fails (`billing_postcode` too long). The
  lane records this as `oracle_failure` → `needs_review` with the 500 in the ledger: an honest non-PASS and a product
  finding for the owner, not a lane defect. With the postcode replaced through the env ref the same flow yields
  `POST /invoices` 201 and PASS; that variant is the positive control of the lane, not the default oracle.
- The two `generate-baseline` browser checks on a loopback SPA carry no `dependencies` and end `environment_blocked`
  for the registered API origin (pre-existing, outside S1), so the campaign verdict is `ENV_BLOCKED` even when the
  lane check passes: read the lane result from its check entry and the ledger, not from the campaign verdict.

A wrong selector fails as `action_failure` → `needs_review`; a wrong or missing mutation route fails closed as
`SIDE_EFFECT_SCOPE` with the denied `METHOD origin/path` in the attempt trace (`side_effect` rows). Route paths may use
one-segment `{placeholder}`s (for example `/carts/{cartId}`), never wildcards or queries.

```sh
npm run qa-campaign -- author-checks --workspace "$W" --input "$QA_DEMO/toolshop-v3.json" > "$QA_DEMO/toolshop-preview.json"
```

```sh
npm run qa-campaign -- apply-authored-checks --workspace "$W" --preview "$QA_DEMO/toolshop-preview.json" --preview-digest "$(node -p 'require(process.argv[1]).previewDigest' "$QA_DEMO/toolshop-preview.json")"
```

The written plan carries `sideEffectAuthorization.checkIds` with the generated check id and no approval.
`validate` refuses it with “must remain blocked pending explicit human replay approval”.

## 5. Approve the replay (two-phase, same `approve-oracles`)

```sh
PLAN="$W/tests/qa-campaign.v0.json"; npm run qa-campaign -- approve-oracles --workspace "$W" --plan "$PLAN"
```

The preview's single subject asks exactly `Approve loopback stateful replay: <expectedBehavior>` and its
`planDigest` covers the authorization record (origins, routes, budget, secret names). Read the check, then:

```sh
npm run qa-campaign -- approve-oracles --workspace "$W" --plan "$PLAN" --approval-digest "<approvalDigest from the preview>"
```

Changing any operation, assertion, route, budget or secret name afterwards invalidates the approval.

## 6. Validate and run

```sh
npm run qa-campaign -- validate --workspace "$W" --plan "$PLAN"
```

Expect `sideEffectAuthorizationRequired: true`, `sideEffectRunFlag` and the frozen `dependencyScope.scopeDigest`.
Both flags are required; each refusal sends nothing to the stand and creates no run directory:

```sh
npm run qa-campaign -- run --workspace "$W" --plan "$PLAN" --allow-side-effect reversible_mutation --dependency-scope-digest "<scopeDigest from validate>"
```

The output reports `verdict`, `checkCounts` and `sideEffects: {count, unknownCount}`. On this stand the verdict is
`ENV_BLOCKED` because the two baseline checks are environment-blocked (§4); the lane result is the lane check's
status in `receipt.json` plus the ledger entries. Operator timing on 10 November 2026: 16–19 s from the `run`
command to the sealed lane result; 2–3 minutes per registration. Record the wall-clock time from
this command to the first PASS/FAIL with evidence for the measurement table.

## 7. Export, offline read, secret absence

```sh
npm run qa-campaign -- export-outcomes --workspace "$W" --run-id "<runId>" --output-dir "$QA_DEMO/out/toolshop-s1" --registration-store "$QA_REGISTRATION_STORE" --target-registry "$QA_REGISTRATION_TARGET_REGISTRY" --approval-store "$QA_CONSOLE_PRIVATE_ROOT/oracle-approvals"
```

```sh
npm run qa-campaign -- read-outcomes --packet "$QA_DEMO/out/toolshop-s1"
```

The runner already refused to seal any artifact or receipt containing a resolved secret value; the owner
repeats the check on the exported bytes without echoing the value:

```sh
grep -rF -- "$QA_SECRET_TOOLSHOP_PASSWORD" "$W/tests/campaign-runs" "$QA_DEMO/out/toolshop-s1" && echo LEAK || echo "no secret bytes"
```

## 8. Measurement (D2)

Hand the sealed run and the export, not the plan author's notes, to the independent evaluator. Fill the table in
[current.md](qualification/current.md): found/missed against the 94-bug reference before (3/94) and after this
slice under the same time budget (the first lane finding, `POST /invoices` 500 from the prefilled postcode, is a
candidate until the evaluator matches it against the reference), time to first useful check (from the `run` command to the first PASS/FAIL
with evidence), share of time spent on the tool versus the product, false PASS (must be 0), and what was not
measured. A second run after an owner reset is a new explicit action; the slice is not accepted without an
uplift on the reference.
