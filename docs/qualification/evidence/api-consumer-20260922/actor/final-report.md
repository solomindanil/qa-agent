# Fresh API contract consumer — bounded final report

Five independently reviewed, separately bound campaigns ran exactly once each. The original eight-assertion design was not revised. Exact-run status readback succeeded for all five. No further HTTP is needed or planned.

## Observed results

| Release / assigned origin | OpenAPI contract | Status contract | Original sealed verdict | Unique clauses: passed / failed / not evaluated |
| --- | --- | --- | --- | --- |
| q2 — http://127.0.0.1:50604/ | pass | pass | NEEDS_HUMAN | 8 / 0 / 0 |
| n8 — http://127.0.0.1:50738/ | needs_review: operation-summary JSON pointer mismatch | pass | INCONCLUSIVE | 7 / 1 / 0 |
| c4 — http://127.0.0.1:50921/ | needs_review: media type text/plain, expected application/json | pass | INCONCLUSIVE | 4 / 1 / 3 |
| r6 — http://127.0.0.1:51098/ | needs_review: HTTP 503, expected 200 | pass | INCONCLUSIVE | 3 / 1 / 4 |
| t9 — http://127.0.0.1:51324/ | pass | pass | NEEDS_HUMAN | 8 / 0 / 0 |

There are **10 selected checks: 7 pass and 3 needs_review**. The runner automatically repeated each eligible failing OpenAPI check once, giving **13 recorded attempts**, not additional campaigns. All five `run` commands exited 1 because their native verdict was non-PASS; these exits were retained. All five fresh-process, exact-run `status` commands exited 0 and returned `ok:true`. Zero dossiers were generated or published.

Across the 40 planned material-clause instances, 30 passed, 3 failed and 7 were not evaluated because the adapter stops on the first failing assertion. These counts do not double-count automatic attempts and are not a whole-product coverage percentage.

## Evidence-first diagnosis

**n8:** Both OpenAPI attempts reached HTTP 200 and passed `media_type`, `/openapi == "3.0.3"`, and `/info/title == "Widget API"`. Both failed assertion-4, `json_pointer /paths/~1v1~1widgets/get/summary == "List widgets"`. The brief explicitly promises that exact string, and the pointer correctly escapes the literal `/v1/widgets` key. The retained actual is only `body bytes=169 sha256:2835d573471c270b20d7739732446dbda4de888afdae5e33879c663cd861c511`, identical across both attempts. The raw JSON and actual summary value are not retained by this adapter; I do not infer or name a hidden alternative value. This is observed wrong/missing-content evidence despite successful status and media-type assertions, with the native `needs_review` classification preserved.

**c4:** Both attempts returned HTTP 200, then failed assertion-1 with actual `text/plain` against the required `application/json`. This is not a case/parameter formatting mismatch: `media_type` implements the documented permitted variations. Assertions 2–4 were not evaluated, so this run does not establish whether the three OpenAPI JSON values were right or wrong.

**r6:** Both attempts received an actual HTTP 503 response and failed assertion-0 against the promised 200. This is an observed response, not sandbox connection refusal. Media type and all three OpenAPI value assertions were not evaluated. The independent `/api/status` check passed; that does not make `/openapi.json` available or establish the backend cause of its 503.

**q2 and t9:** The saved traces record all eight assertions passing. These establish the two selected API contracts at their assigned origins during these runs. Saved passing traces do not retain raw header/body values, so I do not claim which particular allowed serialization or Content-Type variation either release exercised. No controller mapping or server implementation was read.

No UI selector, locale, rendering or hydration assumption is involved in these API checks. Exact source expectation, request path, origin, graph and plan bindings were checked. Backend root cause, broader deployment identity and the hidden fixture construction are not established. The above interpretation does not rewrite the sealed verdicts or automatically promote the findings to confirmed product bugs.

## Coverage and remaining gaps

Every registration's original graph denominator is **5 targets** and its catalog has **3 entries**. Two endpoint targets were selected. Three blockers remain unchanged in every receipt:

1. The general Public service API target retains its unresolved generated catalog oracle. Two specific endpoint checks do not automatically cover that broader candidate.
2. Rendered `/docs/` is **UNASSESSED / outside this API-only scope**. No browser/render check or request was made.
3. `/member/audit` is **BLOCKED / identity and authority absent**. No account, credential, authentication or member request was used.

Native `NEEDS_HUMAN` groups retained blockers, including scope exclusions; it does **not** mean a human must manually perform the excluded docs check now. Expanding that scope requires a separate request. Across the five separate graph instances, 25 target instances remain accounted for: 7 passing selected targets, 3 selected targets with `needs_review`, and 15 retained blocker instances. No whole-product, docs-rendering, member-access or release GO is claimed.

## Reproducibility and integrity

Selected source: root `fcc211c53b11d19da6d192c7d9401865fae44326`, Console `8065713fba11446e32ec2f76832d65110550989b`, Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`. Final source verification succeeded; no source, graph, catalog, plan or receipt was changed during execution/analysis.

The immutable initial design remains SHA256 `e3ba08fe284e02b405991dd4ec14be599719536f8236b0caeb867c4241a7103c`; its rationale remains `ffd7bfdffb68a9c3ad2691ec799eeebeb9485d3ea7b032f134100da9bfdca8c9`. Each plan's first proposal, canonical persisted bytes and original request/assertion arrays still match.

| Release | Exact run ID |
| --- | --- |
| q2 | run-c3e32cd84101ccf8-c399ab55-9377-435f-b2bd-f049e8eb6dd4 |
| n8 | run-b27f95ea934bf6aa-b3a4c9f9-03f1-44ee-a4d2-351c2da0ed47 |
| c4 | run-c785ff5055bbbb13-b083ac5e-bfa7-4c8c-899b-c5f40b39ee48 |
| r6 | run-ccc7342faf25703f-4d143a12-3ad1-4358-a28a-90a55b90e309 |
| t9 | run-a57560b856ca5a58-40a56165-74e4-42fb-ba13-570eb176e8eb |

Each original receipt is under `<actor>/<release>/nuanu-readonly-qa/tests/campaign-runs/<run-id>/receipt.json`; exactly one run directory exists in each workspace. All **26** declared result/trace artifact sizes and hashes were verified, and all **13** traces have `events.length == totalEventCount`. Their recorded request events are only anonymous GET `/openapi.json` or `/api/status` on that release's assigned origin. This is trace evidence, not a claim of independent network-level auditing.

Key retained artifacts:

- [Original design](/private/tmp/qa-api-consumer-20260922.iVqZ2s/actor/first-design.json) and [rationale](/private/tmp/qa-api-consumer-20260922.iVqZ2s/actor/first-design.md).
- [Exact bound plan digests, source identities and closure](/private/tmp/qa-api-consumer-20260922.iVqZ2s/actor/bound-plan-manifest.json).
- [Original results and verified trace payloads](/private/tmp/qa-api-consumer-20260922.iVqZ2s/actor/execution-evidence-summary.json).
- [Accurate post-run verification](/private/tmp/qa-api-consumer-20260922.iVqZ2s/actor/post-run-verification.json), verified at 2026-09-22T05:37:31.616Z.
- [Attempt/error chronology](/private/tmp/qa-api-consumer-20260922.iVqZ2s/actor/attempts.md); complete command/cwd/UTC timestamp/exit/stdout/stderr captures for every new invocation since packet receipt are under `actor/invocations/`. Validation captures are 008–012, runs 015–019, exact-run status 020–024.

Preserved friction: early wrong source-skill path and malformed `rg` option were recorded in the tool transcript and attempt notes, not independent complete raw capture files. The first workspace API invocation's `tsx` CLI IPC `EPERM` has complete raw capture002; installed Node loader entry resolved that non-product invocation issue without installation. There was no campaign-level sandbox network failure. Invocation028 reused the pre-run integrity helper and printed stale constant temporal metadata (`executionPerformed:false`, awaiting-review) after its successful integrity checks. That output is retained verbatim and is **not** current state; separate capture030 and `post-run-verification.json` derive completed execution from actual run/status records.

The selected QA skill kept resolved-oracle bindings and all coverage gaps. Verification-loop drove exact readback and artifact checks; systematic-debugging kept the diagnosis limited to original evidence and avoided unsupported backend claims or fixes. No external URL, installation, account action, payment, tracker write or source edit occurred. This is an instruction-separated same-host local experiment, not a secure hidden benchmark or general oracle-reliability proof.
