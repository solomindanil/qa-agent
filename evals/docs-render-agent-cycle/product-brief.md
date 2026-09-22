# Public service reference

This product publishes a public API reference for integration developers. The
requested journey is **Read the public API reference**, on both supplied release
origins. A person should be able to open the reference and read the endpoints.
Use the registered graph/catalog and their normative expectations to design
targeted read-only checks and account for the rest of the known scope.

The following contracts apply equally to both releases:

- `/docs/` serves the public reference as HTML, HTTP200.
- `/openapi.json` serves HTTP200 JSON with `openapi: "3.0.3"`, title
  `Widget API`, and a GET `/v1/widgets` operation with summary `List widgets`.
- In the rendered `/docs/` page, `Widget API`, `GET /v1/widgets` and
  `List widgets` are visible to a person, not merely present in source or JSON.
- `/api/status` serves HTTP200 JSON with `status: "operational"`.
- `/member/audit` is member-only audit history. No member identity or approved
  access mechanism is supplied for this exercise.

Only anonymous strictly read-only actions to the exact provided loopback origins
are authorized. Fresh browser contexts only; no host cookies, login, signup,
settings, network origins outside the fixture, installations or external delivery.
Do not change application source, catalog/oracles or graph. Write only in your
provided actor root. Do not read controller files, sibling actors or old exercise
reports. Existing source APIs/skills/tests may be read to learn invocation.

Retain all known targets and distinguish checked, blocked, failed and unassessed.
Do not force whole-product PASS; automatic oracle failure requires diagnosis.
State scope-selection reasons before execution. A pending access request does
not stop independent permitted public checks. This is targeted QA, not a full
product acceptance campaign.
