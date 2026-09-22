# Public service reference — bounded API acceptance

Integration developers use this service's public API contract and status route.
You are asked to check the two anonymous API contracts on every assigned local
release. These are normative product promises, not observations:

- `GET /openapi.json` returns HTTP 200 with media type `application/json`.
  Its JSON has `openapi` equal to `3.0.3`, `info.title` equal to `Widget API`,
  and the GET operation under the `/v1/widgets` path has summary `List widgets`.
- `GET /api/status` returns HTTP 200 with media type `application/json` and
  JSON field `status` equal to `operational`.
- JSON property order and additional undocumented properties are not constrained.
  Valid Content-Type parameters and case variation are allowed.

The wider product also offers rendered API documentation at `/docs/` (shows
Widget API, GET /v1/widgets and List widgets) and member audit at `/member/audit`.
Rendered documentation is outside this API-only request; member audit requires
a member identity which has not been supplied. Retain both gaps; do not run them
or imply whole-product acceptance.

Use the current selected Console/Kernel, ordinary campaign APIs and CLI. Read
the selected qa-product-v0 skill plus applicable references and public assertion
documentation. Independently choose checks and assertions from these promises;
there is no supplied plan. First save your immutable initial design and rationale
before any requests to release origins. The controller will then provide new
registered workspaces and neutral release IDs. Bind separate new plans to them.
Stop before campaign execution for independent design review. Never silently
overwrite a first attempt or omit a requirement because of a tool limitation.

Scope: only assigned exact loopback origins, anonymous read-only GET. No external
URLs, accounts, payments, settings, installs, trackers, production or product
workspaces. Write only in this actor directory. Do not read parent/controller,
other experiment directories, earlier consumer reports/plans or server source.
This is same-host instruction separation, not a secure hidden benchmark.
