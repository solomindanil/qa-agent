# OC-Q DOM-only reviewer extension

This supplements, without changing, the [frozen first-trial rubric](reviewer-rubric.md).

| Variant | G | Q1 | Q2 | Q3 | P |
| --- | --- | --- | --- | --- | --- |
| `quantity-dom-only` | adequate | adequate | contradiction | adequate | adequate |

For Q2, require the captured row `{requested:2,quantity:2,totalMinor:400,
currency:'USD',rendered:200}` after all Q1/Q2/Q3 observations are collected;
the page's `data-request` must be 2. The unchanged healthy evaluator comparison
must reject Q2 while accepting Q1 and Q3. This is distinct from the older
`quantity` fault, which corrupts quote and DOM together for Q2/Q3. A transport
failure, missing capture, healthy false FAIL or quote-only assertion is not a
valid DOM-only detection. Controller tests are not actor work; the historical
first-design denominator remains 1/4.
