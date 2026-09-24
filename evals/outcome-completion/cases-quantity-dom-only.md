# OC-Q extension — independently wrong rendered total

This is a new owned-loopback control under the selected-quantity promise in
[the frozen first-trial cases](cases.md). It does not revise those cases or
retroactively add an actor result.

With fixture fault `quantity-dom-only`, selecting each of 1, 2 and 3 must
still issue its matching `GET /quote?quantity=` request. All three JSON quotes
remain correct: `quantity` 1/2/3, `unitMinor` 200, `currency` USD and
`totalMinor` 200/400/600. Only the selected Q2 page result is wrong: its
rendered total is 200 even though the quote total is 400 and the page's
`data-request` marker is 2. Q1 and Q3 render 200 and 600 respectively.

Capture request, response and visible rendered total for all three selections
before deciding each result. The independent oracle remains the contract's
exact request/quote/render agreement; a correct HTTP response alone cannot
qualify Q2. The control is synthetic and does not establish a deployed-product
defect, an unaided actor detection or full human-perception coverage.
