# OC-Q response-only reviewer extension

This supplements, without changing, the [frozen first-trial rubric](reviewer-rubric.md).

| Variant | G | Q1 | Q2 | Q3 | P |
| --- | --- | --- | --- | --- | --- |
| `quantity-response-only` | adequate | adequate | contradiction | adequate | adequate |

For Q2, require HTTP 200 and JSON `{quantity:2,unitMinor:200,currency:'USD',
totalMinor:200}` for matching `GET /quote?quantity=2`, native select value 2,
`data-request=2`, and the visible captured row
`{requested:2,quantity:2,totalMinor:200,currency:'USD',rendered:400}`.
Q1/Q3 must retain 200/600 throughout. Collect all Q1/Q2/Q3 observations
before comparison against frozen 200/400/600 totals; only Q2 must be
rejected. This differs from the older joint `quantity` and `quantity-dom-only`
faults. A correct DOM, transport/setup failure, missing response field,
aggregate rejection, or healthy false FAIL is not valid detection. Controller
qualification is not actor work and does not revise the historical 1/4 first
design denominator.
