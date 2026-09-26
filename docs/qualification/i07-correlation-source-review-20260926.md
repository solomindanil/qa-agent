# I07 correlation source review — 26 September 2026

**Decision: NO-NEW-CODE for this investigation.** The user selected a narrow
check of current, stale/background and delayed responses. Astra reviewed the
semantics and Sol independently inspected the selected and experimental source.
Neither found a new violation of the experimental collector's declared
fixture-local contract. This is source analysis, not a new browser experiment
or proof that arbitrary stale/background traffic is handled correctly.

## Selected source is not the experimental candidate

At stable root `21bc49f9b330bb2fc9403a229e8e14c406db794d`,
[`captureQuantities`](../../evals/outcome-completion/browser.test.mjs) is a
private test helper. It waits for the expected quote URL and GET method, then
reads the body and rendered state. It does not bind a response to a Request
first observed in that capture window. Source inspection therefore permits a
pre-existing matching request's later response to satisfy that waiter; this
was **not reproduced as a runtime failure in this slice**.

The stronger private test helper is only in the clean, unselected local clone
`8fca6bb48daf98d992cd9d4b3d546c2a75649d91`. Its browser-file SHA-256 is
`cf0a3aafe35e18bedf894a11544155852b602d37503917278e8d8d9ac011ea82`;
fixture SHA-256 is
`2ef9637069693c43517bffba136888b23a279c0e97d97be7c95b6df61b0cea61`.
The stable browser file is instead
`b6a8c446961fae3885a18e39ea894b0bf8f70b308ef55572364294791b4596c1`.
Neither helper is an exported universal runtime API. No adoption, merge,
manifest repin or installed-skill change occurred here.

| Condition | Experimental helper's source behavior and limit |
| --- | --- |
| One newly observed eligible request | Captures same-origin/main-frame GET `/quote`; response must refer to the same Request object. Selection, request, response and DOM fields remain separate. |
| Request event before listener installation; response afterward | That Request is absent from the per-window array, so its response cannot settle the response signal. This is a source-derived property, not a fresh browser control result. |
| Two eligible requests after listener installation | Conservative incomplete capture; does not guess which request was caused by the action. |
| Delayed body/DOM | Waits within the cumulative per-row deadline. Pending is not a verdict; timeout is incomplete evidence. Finite delayed-healthy browser completion was not newly exercised. |

**Before the listener is not the same as before the user action.** Listeners
are installed before `goto`/`selectOption`. A single background request whose
request event occurs afterward may be eligible even if an earlier activity
caused it. Request identity establishes association, not user-action causality;
the DOM quantity marker is not a causal token. A new general causal guarantee
would require an independently justified contract, not a new timer or token
introduced to make an experiment win.

## Preserve the prior stop decision

The retained 25 September `I07A_VALUE_PROBE_PREFLIGHT_20260925.md` had already
stopped the proposed overlap/delay instrumentation **before consumer dispatch**.
Across its six proposed cases, the fair current-candidate baseline's existing
rows/error/pending state could support the same justified decision or next
action as the extra observations. That is a design discriminability result,
not a measured zero model effect. Its separate controller prototype's
historical 103/103 fake tests did not override an independent AQA with four
Important findings. Do not repair that prototype, reopen Task4/5 or rerun its
scored predecessors by following an older “pending” queue phrase.

The earlier wrong-request paired capture and consumer benefit remains valid
only in its recorded bounded local scope. It does not adopt the candidate.
Its 18/18 browser and 3/3 focused results are historical, not fresh results
from this review. New work needs a concrete reproduced contract failure or a
separately justified requirement with a decision-relevant evidence gap.

## Verification and current routing

Sol freshly ran `npm run sources:verify` at stable `21bc49f`: all selected
sources verified, and stable/candidate source trees were clean at readback.
No browser, controller, model consumer, product or new test was run in this
source investigation. There is no new PASS, measured quality gain or W1/I07/W7
completion claim. The source pins and all old attempts remain unchanged.

Independent final Astra AQA accepted this documentation-only disposition with
**0 Critical / 0 Important / 0 Minor** findings. Sol's final diff/link/pin
checks passed. Neither review newly qualifies browser behavior or the old
experimental test results.

The user-authorized Nuanu owner query also returned: PWA03-A02 had prior
installed-profile observations on 15 and 25 September; installed-window bundle
identity and the current product-owned invitation criterion remain limited.
It is ordinary QA continuation, not an untouched I10 benchmark. This is an
attributed owner-thread response, not a new product readback here.

The concrete correction in this slice is routing: the canonical queue now
surfaces the prior stop and separates published test code from the local
candidate. It selects **no further overlap/delay implementation**. Do not
replace the absent field sample with another tuned synthetic or broad product
scan. A separately justified next quality slice must identify its consumer,
missing capability and smallest measurable benefit before implementation.

Private source/review locators remain on the owner machine under the older
checkout's `.local/plans/2026-09-24-aqa-quality-sol/` and
`.local/i07a-wrong-request-normal/`. They are not shipped in this public root;
this note preserves their decision boundaries, not reproducible experimental
evidence in a cold clone.
