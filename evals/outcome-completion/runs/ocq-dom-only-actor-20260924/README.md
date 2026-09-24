# OC-Q DOM-only fresh actor trial — 24 September 2026

This is a separate, owned-loopback actor result following the
[controller qualification](../ocq-dom-only-controller-20260924/README.md).
The tested source was `66597e043891eb8705a41c2c5aeb881928afe2d8`
on `codex/ocq-dom-only-isolated`, under the
[selected-quantity contract](../../cases.md) and
[DOM-only extension](../../cases-quantity-dom-only.md). The actor received
two unlabeled local origins, A (`http://127.0.0.1:57112/`) and B
(`http://127.0.0.1:57113/`), with permission only for their quantity
pages and same-origin quote reads. Both servers were stopped after the trial.
No real product, payment, provider, tracker or external website was tested.

The first design was frozen before execution and independently accepted
unaided: **1/1 first design**. It specified all three quantities at each
origin, selected state, exact GET and response correlation, and the visible
total, with PASS/FAIL/INCONCLUSIVE criteria. This is a new one-design sample,
not a replacement for the frozen historical **1/4** first-design result.
The shared filesystem contained fixture source, controls and reviewer key:
the actor was instructed not to inspect them, but this was **open-context,
not an independently hidden or blind benchmark**.

## Execution sequence and denominator

| Stage | Origins completed | Per-quantity verdicts | What the evidence supports |
| --- | ---: | ---: | --- |
| Frozen first design | Not executed | Not executed | 1/1 accepted unaided by AQA before execution. |
| First execution | 0/2 | 0/6 | Each origin logged only the navigation-phase Q1 GET/HTTP 200 quote. No UI snapshot or selected/rendered result survived; no Q1 verdict is qualified. |
| One reviewed correction; one retry per origin | 2/2 | 6/6 | Assisted retry produced five PASS, one FAIL and zero INCONCLUSIVE per-quantity verdicts. |

The first runner passed a URL object to Playwright's screenshot path. Both
initial logs end with `TypeError: path66.lastIndexOf is not a function`
at about 808 ms (A) and 805 ms (B), before UI capture; their
`snapshots.json` files are empty. This is an actor-runner failure, not a
product failure or a first-execution detection. A single AQA-reviewed
correction converted screenshot paths to filesystem strings and used
phase-bound quote waits plus bounded UI-quiescence observations. That
corrected runner was executed once per origin; no third run is recorded.

## Assisted retry observations

All quote requests below were same-origin GETs, correlated to the intended
action phase and request ID 1/2/3 respectively. Every response was HTTP 200
with a readable JSON body; the native select showed the chosen value. The
page's visible total was a bare number, **without a visible USD label**:
USD is established by the correlated quote response, not by UI currency text.
Settled and late snapshots agreed for all six rows; no late overwrite was
observed in this bounded window.

| Origin | Selected | Matching quote (`quantity`, `currency`, `totalMinor`) | Visible total settled / late | Verdict |
| --- | ---: | --- | ---: | --- |
| A | 1 | `1, USD, 200` | `200 / 200` | PASS |
| A | 2 | `2, USD, 400` | `200 / 200` | **FAIL** — rendered total is 200, not 400 |
| A | 3 | `3, USD, 600` | `600 / 600` | PASS |
| B | 1 | `1, USD, 200` | `200 / 200` | PASS |
| B | 2 | `2, USD, 400` | `400 / 400` | PASS |
| B | 3 | `3, USD, 600` | `600 / 600` | PASS |

The actor's origin-level verdict was **A FAIL, B PASS**. Only after those
verdicts, the coordinator's control mapping identifies A as
`quantity-dom-only` and B as `none`. Thus the assisted fresh consumer
detected **1/1 seeded DOM-only contradiction**, accepted **5/5 agreeing
quantity observations**, and had **zero observed healthy false FAIL**.
This is the measurable next-consumer benefit beyond a controller-only
test: the new fault was actually distinguished from a healthy neighboring
origin. It does **not** make the failed first execution successful, prove
unaided end-to-end reliability, or establish a live-product PASS.

The AQA reviewer accepted the actor result (**GO**, no blocking gaps) and
the single correction/retry boundary. The reviewer noted a Minor limitation:
both pages used a native select, so the generic button/radio fallback was not
exercised. That fallback has a known whitespace-regex over-escaping defect in
its `selected`/`active` class-token check: whitespace-delimited class names
can be missed. The temporary actor script is not repaired by this record.
AQA reviewed the design and outcome
independently of the actor, but the review summary here is coordinator-
reported, not a signed or managed evidence attachment. The case/rubric,
fixture and controller key were available on the shared filesystem, so
independence of reviewer judgment does not imply benchmark secrecy.

## Private evidence and reproducibility boundary

Private, ignored artifacts remain at the exact local base path
`/Users/danilsolomin/projectsnew/qa-agent/.local/isolated/ocq-dom-only/.local/ocq-fresh-actor-20260924/`.
The frozen design is `first-design.md`; first execution scripts/logs are
`run-once.mjs`, `evidence-A/{events,snapshots}.json` and
`evidence-B/{events,snapshots}.json`. The corrected script, actor verdict
and retry evidence are `run-retry.mjs`, `retry-verdict.md`, and
`retry-evidence-A/` plus `retry-evidence-B/`, each with
`events.json`, `snapshots.json` and seven PNG captures. These private
paths are source pointers, not tracked attachments or portable links.
The JSON and screenshots are caller-authored/unattested; their hashes below
identify the inspected local bytes, not external truth.

SHA-256 inventory (paths below are relative to that private base):

| Private artifact | SHA-256 |
| --- | --- |
| `first-design.md` | `31e38a3e16de2f0a9abd10b9d66886028b50c51cee31effdf12212fad04015c1` |
| `run-once.mjs` | `7180c881d3d2e3fb31b1b1794fb636470db43a2fe5c369913de32cd45eda9814` |
| `run-retry.mjs` | `9e2248d253ac16fd8733f6f0883ee4b48c90f02266741a0e12f689512e3796f2` |
| `retry-verdict.md` | `d87304ebf43d73b55fe83c11dc5b0ce02ce351ddef0ae9e337b3ebf92d35ea87` |
| `evidence-A/events.json` | `f2291d14b4458be7294c17c9c2a041cb3cac0ed2dc29be0bf5a1a45f5877c514` |
| `evidence-A/snapshots.json` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` |
| `evidence-B/events.json` | `a858b7303b5565d8311ec5b2bbf12034915489695be2d2f43db964d89936673e` |
| `evidence-B/snapshots.json` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` |
| `retry-evidence-A/events.json` | `fb94ce149c594d654e54f9c7e3c2df14ae1eacf4237da0e44b06f730f28dc329` |
| `retry-evidence-A/snapshots.json` | `f35b0343473313970a9ac715788de2ce804b7abf40b47906b818d77967ef3eef` |
| `retry-evidence-B/events.json` | `14a1e6ae692f635c772f5ce77f67b70a16740c44cfa5c9c5adea0e2a895f33ca` |
| `retry-evidence-B/snapshots.json` | `21ef585df05a0d396259fe71f5a2a6cc55f47335f3f4119e8634ff13eb53fdee` |

The fourteen retry screenshots are byte-identical within the following
same-state groups, with seven files per origin:

| PNG files within `retry-evidence-A/` or `retry-evidence-B/` | A SHA-256 | B SHA-256 |
| --- | --- | --- |
| `initial.png`, `quantity-1-settled.png`, `quantity-1-late.png` | `971fa37099df907bf637a5f561dfcaf613ad1715ee2adace20da762fdbaacb60` | `971fa37099df907bf637a5f561dfcaf613ad1715ee2adace20da762fdbaacb60` |
| `quantity-2-settled.png`, `quantity-2-late.png` | `20fa320f4c9fa082da7af0d524c61c5271210743d318267f359ed98cb4ff902e` | `bc1a25582aea161e19ce00a229fa202f94351a3b82b1cf8d519038147fcd7409` |
| `quantity-3-settled.png`, `quantity-3-late.png` | `73e82aaadbbc97ad9a7fe5e1a6b797b77c63b11badef3ca41cb75ff61ed4f802` | `73e82aaadbbc97ad9a7fe5e1a6b797b77c63b11badef3ca41cb75ff61ed4f802` |

The retry logs use process-relative monotonic milliseconds. The last saved
snapshot is at 2473 ms for A and 2471 ms for B; the actor reported each
browser run at approximately 3.7 seconds wall time. That wall time was not
independently established. Total authoring and review wall time are unknown;
tool/model monetary cost is **unavailable, not zero**. No routing or Jev
comparison was run.

## Limits and next controls

This qualifies a narrow OC-Q DOM-only consumer result, not all of I07.
I07a still needs distinct controls for a wrong requested quantity, a wrong
response total, stale/background quote-response correlation, and delayed
healthy versus no-op. Persistence/reload and broader asynchronous lifecycle
behavior remain I07b work, not evidence supplied by this I07a result.
The present late snapshots showed no overwrite; they do not constitute a
seeded delayed-response control. The generic button/radio branches and UI
currency labeling are untested. Any real-product quantity or provider
contract still needs its own owner-approved oracle and authorized runtime.
