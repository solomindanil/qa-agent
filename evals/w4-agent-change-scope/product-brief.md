# Cedar public catalog — owner source contract

The owned staging API is public, uncredentialed, read-only and limited here to safe GET requests. `GET /api/environment` reports the current candidate revision. A successful response is HTTP 200.

- Public catalog read: `GET /api/catalog` must return HTTP 200 with `catalogName: "Cedar"` and `ready: true`.
- Published-label invariant: independently, `GET /api/catalog-integrity` must return HTTP 200 with `unlabeledItemCount: 0`. The public catalog read depends on this invariant; a readable catalog is not enough if labels are missing.
- Publication-freshness invariant: independently of the catalog read and label invariant, `GET /api/catalog-publication` must return HTTP 200 with `staleItemCount: 0`.

The API-wide surface is a separate coverage obligation. The owner has no finite public check or oracle that qualifies the entire surface. Retain it as unsupported, visible in the denominator, and never infer whole-product PASS from the three public GET checks.

Owner-approved fallback for an unmapped behavioral change: run the complete known safe public GET check set, retain unsupported areas as blockers, and retain the mapping gap. This is Cedar's rule, not a general QA policy. Historical observations do not attest a newer deployed candidate merely because their local graph publication binding remains current.
