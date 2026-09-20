# Independent Lead AQA review — Freeland PAY01/readiness integration

Date: 2026-09-20  
Reviewed range: `aa1d0ae5a126e508ed796eb29d4c7488cd6bcf35..064410869c2e63a4b7c23cc3753c717a337f8a3a`  
Mode: read-only source review; no suites rerun; no product, browser, network, provider, tracker, campaign, or source mutation.

## Verdict

- **Spec compliance: PASS for the exact five-file source integration.**
- **Code quality: PASS; no Critical, Important, or Minor findings in the reviewed slice.**
- **Adoption/qualification: NOT CLOSED.** PAY01 v2 remains shadow-only and acceptance-free; canonical adoption, deployed evidence, and the separately owned source-only CI boundary correction remain pending.

## Requirements and merge checks

- The supplied review package represents one commit at the stated head; `git status` is clean and `git diff --name-only` contains exactly the five approved paths.
- `tools/freeland-replacements/tc-pay-01-oracle.mjs` and `tests/product-graph/freeland-manual-replacements.test.mjs` are byte-identical to reviewed donor `510e08a38565e8f8074d36d5f8eaa62d9d93bd7b`.
- The complete PAY01 block in `tests/product-graph/freeland-smoke-u0-oracles.test.mjs` is donor-identical. Its post-PAY01/PAY07-readiness portion is byte-identical to `aa1d0ae`; the shared version table retains PAY07 v2 and now expects PAY01 v2 without weakening adjacent assertions.
- The oracle implements the approved v2 contract: exact API/DOM card and SBP cardinality, RUB/availability/action checks, identity-preserving balance binding, supported crypto mapping and ambiguity rejection, Stars correspondence, summary consistency, unknown/duplicate rejection, and null/negative balance blocking. Runtime and checkout violations remain visible across blockers; `promotionEligible` remains false.
- PAY01 alone is rebuilt as oracle v2 / `shadow` and has no receipt reference. All 16 non-PAY01 declarations are canonically identical to the base; all nine historical receipt files are byte-identical. No acceptance was renewed or inferred.
- Provenance differs only in `blob`/`sha256` for the four owned changed paths; each seal matches the committed bytes and all owner/source/source-blob metadata is unchanged.
- Recorded evidence is internally consistent: 160/160 focused controls, 131/131 retained readiness controls, clean typecheck, valid provenance, clean diff, strict registry still fail-closed with `MANUAL_REPLACEMENTS_RECEIPT_STALE` and exactly the seven declared tolerated stale rows. These are prior recorded runs, not rerun by this review.

## Findings and remaining boundary

No source finding in the five-file slice.

- **Declared adoption blocker, outside this slice:** `tests/product-graph/freeland-smoke-u0-oracles.test.mjs:3` imports `typescript`, so direct source-only execution without installed dependencies exits before assertions. The retained import predates this integration and is required by the aa1 PAY07 projection coverage. The report accurately leaves this seam to the separately approved CI/test-boundary task; this review does not convert the dependency-backed green run into cold-source CI qualification.
- PAY01 v2 proves recorded identity/action/currency correspondence only. It does not prove per-tile visibility/availability/action IDs, click execution, semantic labels, or live product behavior; the report accurately preserves those P2 residuals and makes no release or acceptance claim.

## Final assessment

`064410869c2e63a4b7c23cc3753c717a337f8a3a` is a correct, bounded integration candidate for the reviewed PAY01 v2 repair on top of aa1 readiness. It may proceed to the root's inactive delivery/review chain, but must not be described as adopted, CI-qualified, owner-accepted, deployed, or release-ready.
