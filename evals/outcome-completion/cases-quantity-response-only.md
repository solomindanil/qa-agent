# OC-Q extension — independently wrong quote response total

This owned-loopback control extends the selected-quantity promise in the
[frozen first-trial cases](cases.md). It does not change those cases or any
historical actor result.

With opt-in fixture fault `quantity-response-only`, the native `/quantity`
select still chooses 1, 2 or 3 and issues the matching `GET /quote?quantity=`
request. Every quote returns HTTP 200 JSON with the selected `quantity`,
`unitMinor: 200` and `currency: "USD"`. Q1 and Q3 remain healthy with
`totalMinor` 200 and 600. Q2 alone returns the wrong `totalMinor: 200` instead
of the normative 400. The Q2 `data-request` marker is 2 and its visible
rendered total is the correct 400, calculated from native selected quantity 2
times frozen unit price 200, independently of the wrong response total.

Capture all three matching requests, response fields, native selections,
request markers and visible totals before comparing Q1/Q2/Q3 separately with
the independent [contract](cases.md). A correct visible total must not hide
the Q2 response contradiction; a transport failure or a missing capture is
not that contradiction. This is a synthetic controller case, not a deployed
product bug, an unaided actor detection or full I07 acceptance.
