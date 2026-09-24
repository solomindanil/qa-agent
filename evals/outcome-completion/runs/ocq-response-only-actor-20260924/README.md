# OC-Q response-only fresh actor trial — 24 September 2026

This is one separate, owned-loopback actor result following the reviewed
[response-only controller](../ocq-response-only-controller-20260924/README.md).
The tested source/controller was `42602ee469d25931be3271cb6424660a0e0dabbe`
on isolated branch `codex/ocq-response-only-isolated`. The actor received two
unlabeled local origins: A `http://127.0.0.1:49379/` and B
`http://127.0.0.1:49378/`. Only `/quantity` and same-origin GET quotes were
in scope. The coordinator reports both fixture processes stopped with exit 0
after the trial. No real product, external website, provider, payment or
tracker was tested or changed.

The frozen [original cases](../../cases.md) cover **three journeys** (G, Q,
P) and **five evaluator claims** (G, Q1, Q2, Q3, P); those denominators are
not replaced by this quantity-only trial. Here the declared execution scope
was **two origins × three quantity choices = six Q rows**, not six product
journeys or a full G/Q/P run. The historical first-trial first-design result
remains **1/4**. This fresh actor's first, unaided design was **NO-GO, 0/1**:
it omitted explicit capture and independent checking of response unit price.
One separately frozen correction added `unitMinor` capture and comparison
against 200 where exposed. Independent AQA approved that corrected design
before execution. There was **one first execution, no execution retry**.

## Execution and result

The Playwright runner captured all six rows before verdict, with status
`CAPTURED_ALL_SIX` and no fatal, denied-request, page-error or console-error
entry. Target GETs occurred after their recorded action timestamps and were
paired to HTTP 200 JSON responses by Playwright request identity. Initial
page-load quote traffic was retained but not credited to a target action. For
Q1, a setup selection of 2 produced extra quote traffic; after it settled,
the actor selected 1 and paired that new action to its own Q1 request. Native
select values were recorded immediately after choice and after settling.
Every target response exposed `unitMinor:200` and `currency:"USD"`.

| Origin | Native select | Matched GET → response ID | JSON `quantity / unitMinor / currency / totalMinor` | Visible numeric total | Verdict |
| --- | ---: | --- | --- | ---: | --- |
| A | 1 | `/quote?quantity=1` → #4 | `1 / 200 / USD / 200` | 200 | PASS |
| A | 2 | `/quote?quantity=2` → #3 | `2 / 200 / USD / 400` | 400 | PASS |
| A | 3 | `/quote?quantity=3` → #3 | `3 / 200 / USD / 600` | 600 | PASS |
| B | 1 | `/quote?quantity=1` → #4 | `1 / 200 / USD / 200` | 200 | PASS |
| B | 2 | `/quote?quantity=2` → #3 | `2 / 200 / USD / 200` (wrong total) | 400 | **FAIL** |
| B | 3 | `/quote?quantity=3` → #3 | `3 / 200 / USD / 600` | 600 | PASS |

The B-Q2 target action began at `07:14:27.894Z`; its GET request ID 3 was
recorded at `07:14:27.899Z`, and the matching HTTP 200 `application/json`
response at `07:14:27.903Z` had raw body
`{"quantity":2,"unitMinor":200,"currency":"USD","totalMinor":200}`.
The native value remained 2 and the HTML/screenshot showed visible `400`
with `data-request=2`. The independent contract requires 400 for two units
at 200 each, so the response is wrong despite the correct visible total.
The UI shows a **bare number**, not a visible USD currency label; currency
comes from the paired response. A's three rows passed; B's Q1/Q3 passed and
Q2 failed. There were five PASS, one FAIL and zero indeterminate Q rows,
with no observed healthy false FAIL.

Independent AQA gave **post-execution GO before the coordinator revealed
variant mapping**, accepting the complete six-row evidence and A PASS / B
FAIL verdict. Only afterward did the coordinator map A=`none` and
B=`quantity-response-only`: this is **1/1 seeded response-only contradiction
detected** and **5/5 agreeing Q rows accepted** after one reviewed design
correction. The AQA decisions are coordinator-reported here, not signed
managed review artifacts. The actor was instructed not to inspect fixture,
evaluator or reviewer source, but those files were available on the shared
filesystem: this was **open-context, not a hidden/blind benchmark**.

## Private evidence and timing

The inspected private base is
`/Users/danilsolomin/projectsnew/qa-agent/.local/i07a-ocq-actor-20260924-b/`.
It is ignored local storage, not a tracked attachment. The frozen first and
corrected designs, runner and verdict are at that base; `events.json`, six
HTML snapshots and six PNG screenshots are under `first-execution-evidence/`.
The files are caller-authored/unattested. SHA-256 identifies these inspected
bytes, not independent product truth:

| Path relative to private base | SHA-256 |
| --- | --- |
| `first-design.md` | `5ac96ce2a2be1a3e2253980a489b9ed039835ffb09435cd19647b75f0ce05add` |
| `corrected-design.md` | `a3c97a41132282ea53731a4033b338d4617b88b1fe6a1e53eded8eb1648e0ddb` |
| `first-execution.mjs` | `832e25263f70162430bfe70ce3a5d13362f925790e87f325f1d2b5ffeb8c4c20` |
| `first-execution-verdict.md` | `b3db8c510ff26dd19dc2492fd2f6ccfd883bc6d8b7c574055ac3c5f0f3fc336c` |
| `first-execution-evidence/events.json` | `e4f887c8e48ccdbf29f66549d73689ddb95f1d18ed9bef9e35874e29958d32d5` |
| `first-execution-evidence/A-quantity-1.html` | `b70948aa180c2be963d2c49fdb555f06cc8eaa86e4ee7755f53ee2a2de2b4fa4` |
| `first-execution-evidence/A-quantity-2.html` | `e7a37b771bbf7bd187c9f8f1e88d2f9d668bdbf860d7bc27d7cd9aa1a8a50470` |
| `first-execution-evidence/A-quantity-3.html` | `d0a5a933f4cb9b8c65a3b6eefb4fbd1d3771b70b898bcd27198dd5d050bdf42d` |
| `first-execution-evidence/B-quantity-1.html` | `8c98a2dd03e43de2c801eef97e14f754574bbba2d610a93c747c018199faac1e` |
| `first-execution-evidence/B-quantity-2.html` | `dc837429d920645e5f0882be0bb5c744ffaef23104bfc9dc13a24de1366d3b37` |
| `first-execution-evidence/B-quantity-3.html` | `1a6cd75f333396d03140b64887d7d3db30f1a0f7c01f97784386ee6c37cfbb82` |
| `first-execution-evidence/A-quantity-1.png` and `B-quantity-1.png` | `61feb5f8eb14b85a4f8ceb8c7499c87bd5cceb0503c8a8e3ff903a46532f6d01` each |
| `first-execution-evidence/A-quantity-2.png` and `B-quantity-2.png` | `a02ec159ce3c82101c3472d64014b257400a3ae1387c3c4ea470b5006d00a167` each |
| `first-execution-evidence/A-quantity-3.png` and `B-quantity-3.png` | `6919590927784aa7e11e6518b6ef07d7b016db1dcfa7e3e92832f883c3f774e1` each |

The event file dates execution `2026-09-24T07:14:08.091Z` to
`07:14:34.091Z`: **26 seconds of observed runner interval**, including the
bounded settling waits, not total actor-task wall time. Design, AQA and
record-authoring duration, model/tool-call counts and monetary cost were not
established; **unavailable is not zero**. The actor script used the existing
local Playwright module; this record did not install dependencies or rerun
the fixture. No routing/Jev comparison was made.

## Boundary

This qualifies one corrected-design response-only synthetic consumer result,
not unaided first-design acceptance, full I07, a live product verdict or a
statistical reliability estimate. Wrong-request quantity, stale/background
response correlation, delayed healthy, reload-only persistence and real
product oracle/role/build binding remain separate gaps. The prior DOM-only
actor's first-execution failure and assisted retry remain unchanged.
