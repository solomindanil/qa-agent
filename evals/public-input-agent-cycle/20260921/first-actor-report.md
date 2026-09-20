# Bounded QA report — public household catalog

Reported: 2026-09-20T19:00:00Z

## Outcome

The exact public surface was reachable and its base UI smoke check passed, but name search did not filter results. The one allowed initial campaign is therefore `INCONCLUSIVE`, not a whole-product PASS: 1 check passed, 2 checks remain `needs_review` in the immutable receipt, 1 staff target is blocked by the exercise boundary, and one useful public category-only check is deliberately deferred.

## Bound identity

- Target: `http://127.0.0.1:60419/catalog`
- Registered base URL: `http://127.0.0.1:60419/`
- Product slug: `public-household-catalog`
- Product deployment/build identity: unavailable; evidence is bound to the loopback origin, run, and capture times.
- Source root: `24013d1356e3fe2644060f4acdca58c361b52119`
- Console: `c421160a71c0679a357f29828029ec3550791d16`
- Kernel: `aa5d2d188606cbcf7e3111c130347a36970ec786`
- Knowledge authority: `sha256:a2ade82593d254a0405c8cd003452d9a40f67866b0fdcc5f3e49a66927b1b245`
- Graph: `sha256:a965a147223fb795e803f217a1bf67c79e12cd876f641329d88be19a4cdb1633`
- Catalog: `sha256:1ba56f5b7182c6096408e1f8e6a739843050bf30a6b79bfcde56d58dada59924`
- Plan: `sha256:58381cd5579a404de2f4f07dd3ac5fde5326010841eacf0698ee2f5f9a65a31f`

## Campaign result

- Run: `run-4f7eec9291372097-468b7a0a-77b3-40a4-bea1-2cb1fd04ea3b`
- Receipt digest: `sha256:8f15f9455228dd2bbe42321d2473ca254fb7513621f356a7ca2203b5ddcc6989`
- Binding digest: `sha256:4f7eec92913720972bc047940fc2f7f2aa78baaf729719d882044bb482774b7f`
- Sealed verdict: `INCONCLUSIVE`
- Dossiers: 0

### Passed (1/3 executable)

The public catalog surface rendered the Search and Category controls plus result summary, returned HTTP 200, had no horizontal overflow at 1440×1000, and produced no console or request failures.

### Needs review in sealed receipt (2/3 executable)

1. Empty-result summary check: after `ZZZ-NOT-PRESENT`, both runner attempts observed 3 displayed items instead of 0. The summary assertion was not reached because the count assertion stopped the check.
2. Search/category/clear journey: after uppercase `M`, both attempts observed 3 displayed items instead of the grounded Hammer-only count 1. Category composition and clear-state assertions were not reached.

### Agent diagnosis

The two failures share one supported product-level cause: changing the Search value does not update the result set. A separate bounded diagnostic confirmed:

- `fill("M")` set the textbox value to `M`, yet the list and `3 results` summary stayed unchanged immediately and after 500 ms.
- Sequential keyboard entry produced the same outcome.
- Directly selecting `Fruit` did work, producing Apple and Pear with `2 results`.
- No console or request failures were observed.

This rules out a bad Search locator, a failed input action, dead JavaScript generally, broken category behavior, and a short readiness delay. The persisted interpretations classify both failed checks as `product_issue`, while the immutable runner verdict remains `INCONCLUSIVE`.

Persisted review digests:

- Empty-result review: `sha256:f624e00108f9c7092f8fc41abce3ece7d58bf24644071f28aebb9b42091ab5ad`
- Search-journey review: `sha256:001c7009b7dd6e3a354b4b18c9e27656666aaf9fcbf35e01a8f2cb03f48686a3`

Both records were read back through the paired Console/Kernel evidence reader with `currentBinding.state: current`; the bounded readback is in `persisted-review-readback.json`. All 15 receipt-listed artifacts passed final SHA-256 and byte-length verification.

## Preserved scope

- Blocked: authenticated staff inventory behavior. No staff surface/account or mutation authority is provided.
- Unassessed because the search assertion stopped the journey: search/category composition and clearing search while retaining category.
- Deliberately deferred for fresh-session continuation: from a clear catalog, select `Tools` and verify exactly `Hammer` plus summary `1 result`. This is not capability-blocked.
- Other unassessed areas: sorting (not promised), broader responsive/accessibility/performance/security coverage, other browsers, staff permissions, inventory mutations, and external integrations.

No product changes, tracker tickets, source edits, installations, credentials, external-origin requests, or mutation requests were made.
