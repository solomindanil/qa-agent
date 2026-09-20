# Reference retrieval samples

One fresh-context agent per version, no parent transcript. This is a reference usability comparison, not a statistical model evaluation. Agents could read only the complete selected `SKILL.md` and its observation reference, not implementation or prior evaluations. No file or product writes.

## Common task

“A QA operator has a current, already registered product and a new sanitized browser observation with a screenshot; a prior observation is identified by evidenceId. Their approved operation is text evidence recording/readback only, not a new campaign. Based only on the delivered instructions, give the exact supported CLI sequence to (1) record the new observation, (2) recover the previous observation by evidenceId, (3) list observed and unobserved target scope; specify the record input envelope, maximum size, whether/how screenshots can be included, and what conclusions a successful read supports. If a detail is not specified, say unknown rather than inventing it.”

## Baseline — observation_skill_baseline, source48e4628

Verbatim response excerpts:

> Based only on the two delivered instruction files, the requested exact CLI sequence is **unknown/not documented**.

> Maximum observation input size: **unknown**. The stated 64 KiB limit applies only to `record-review`.

> Screenshot inclusion mechanism, supported formats, and size limit: **unknown**. The instructions say to verify attachments separately because the writer does not attest them; they do not document an attachment envelope or screenshot-recording command. Under text-only authority, no screenshot upload is established as authorized or supported.

The agent correctly found direct APIs, immutable IDs, caller-declared identity and no product-PASS implication; it did not invent commands or permission. Failure was reference completeness for the requested operation, not agent safety.

## Revised — observation_skill_retrieval, candidate two-file reference

Verbatim response excerpts:

> The entire envelope—not just the artifact—must be at most **65,536 bytes (64 KiB)**.

> The screenshot **cannot be included in this record**. `attachments` must be `[]`; screenshots/files/binary attachments are unsupported. Do not encode the screenshot as base64 or text. Leave a separately authorized screenshot in its existing evidence lane and do not claim this observation record verifies it.

> `currentBinding: "current"` means the existing **local publication** still matches. `historical` retains original attribution, not current acceptance. An unavailable or invalid read does not prove there are zero observations.

The answer supplied `record-observation --workspace`, `read-observation --workspace --evidence-id` and `observations --workspace`, explicit `QA_STARTER_REPO`, stdin envelope `manifest`/`artifact`, payload fields and enums. It independently quoted evidence-ID shell placeholders. Coordinator subsequently applied that shell quoting in both references; no semantic guidance changed. Final hashes were reviewed independently.

The agent correctly noted that complete manifest construction still requires the existing runtime schema/helpers. This is progressive reference disclosure, not a claim that the two instruction files contain a complete runnable manifest. No new helper was requested or added.

## Assessment

Requested CLI/envelope/limit/attachment information: unavailable in baseline, accurately recovered with revised reference. Provenance and authority boundaries retained in both. Full multi-product/autonomy/host equivalence remains unmeasured. Real execution is recorded separately in the fresh-consumer report; this retrieval sample is not substituted for it.
