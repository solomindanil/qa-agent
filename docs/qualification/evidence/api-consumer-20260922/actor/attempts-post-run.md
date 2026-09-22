# Append-only attempt record

## Source/design preparation, first attempt

- Read root `AGENTS.md` and supplied actor `product-brief.md`: successful, exit 0.
- Read installed `using-superpowers`: successful; its subagent-stop rule applies, so no workflow delegated from that skill.
- Source command `cat sources/manifest.v1.json docs/qualification/assembly.md skills/README.md products/README.md skills/qa-product-v0/SKILL.md`: exit 1, tool chunk `ebdf92`. The last requested path was wrong; earlier files were printed. Combined returned output was truncated. This was a source-read error only, not a plan or product attempt.
- Corrected read `cat components/console/skills/qa-product-v0/SKILL.md`: exit 0, chunk `584d22`; full skill read. Read current entry again separately to avoid relying on truncation.
- `npm run sources:verify` from canonical root: exit 0, chunk `56ed74`; selected Console and Kernel exact commits verified.
- Read full selected product-analysis and declarative-campaign references: exit 0, chunk `f0c331`.
- Source identity read: exit 0, chunk `0214ff`; root fcc211c53b11d19da6d192c7d9401865fae44326, Console 8065713fba11446e32ec2f76832d65110550989b, Kernel aa5d2d188606cbcf7e3111c130347a36970ec786.
- Read API assertions documentation and current campaign schema, plan-writing API and CLI source: successful; no release-origin requests.
- Authored first-design.json and first-design.md before receiving assigned registrations. No generated baseline, product request, campaign execution, installation, authentication or external write.

## Source inspection after first design

- Schema/CLI search returned exit 2, tool chunk `b9048f`. Exact failing subcommand: `rg -n "--help|Usage|function usage|printUsage|process.argv" scripts/qa-campaign.ts`. Exact diagnostic: `rg: unrecognized flag --help|Usage|function usage|printUsage|process.argv`. The preceding schema read succeeded; the following README read did not execute due to `&&`. Corrective search adds the normal `--` end-of-options marker. No source writes or product requests occurred.

## Bound-plan preparation

- All new command invocations are captured under `invocations/<unique-attempt>/` with exact command/arguments, cwd, UTC timestamps, exit/signal and independent raw stdout/stderr files. Captures use exclusive creation.
- `001-read-packet`: success; received five neutral release IDs and only actor-owned workspace paths.
- `002-inspect-workspaces`: first supported-API inspection attempt failed before importing workspace APIs. The installed `tsx` CLI could not create its IPC socket in the sandbox (`listen EPERM`), exit 1; complete raw stderr retained. No product request or plan write occurred. Investigating the installed package's supported loader entry to run the same script without the CLI IPC listener.
- `003-resolve-tsx-entry`: success; installed package exports the loader used by Node `--import`.
- `004-inspect-workspaces-loader`: success; complete public graph/catalog/project stdout persisted despite tool-display truncation. `006-inspect-binding-summary` successfully displayed all binding-relevant fields for all five releases without truncation.
- `007-author-bound-plans`: first actual authoring attempt succeeded for all five. First proposals saved separately before schema parsing; exclusive current writer and exact readback succeeded. No graph or catalog changed.
- `008-validate-q2`, `009-validate-n8`, `010-validate-c4`, `011-validate-r6`, `012-validate-t9`: all exit 0, empty stderr, `ok:true`, two executable target IDs, three blocked target IDs, `readyToRun:false`.
- `013-read-verification-skill`: current local verification-loop read before handoff; only plan-validation/readback scope applies, not source builds or product tests.
- `014-verify-bound-plans`: success; all first design hashes, requests/assertions, first proposals, canonical plan digests, validation captures and full target denominators unchanged.

## Reviewed one-run-per-release execution

- Coordinator relayed independent AQA execution Go after reviewing all five persisted plans and actual validation captures, with no findings and empty run directories. No source or plan edits followed.
- `015-run-q2` through `019-run-t9`: exactly one ordinary CLI campaign per assigned exact origin, scoped escalation solely for approved local network and actor-owned evidence writes. All exit 1 because runner verdicts were non-PASS; this was retained, not treated as command malfunction. q2 and t9: two pass / NEEDS_HUMAN. n8, c4, r6: one pass plus one needs_review / INCONCLUSIVE. Every non-pass OpenAPI check has the runner's two automatic attempts; no extra campaign launched.
- `020-status-q2` through `024-status-t9`: separate processes, exact original run IDs, all exit 0 with `ok:true`; raw full receipts preserved.
- `025-read-diagnostic-skill`: systematic-debugging read for evidence-first analysis; no fix, broader source inspection or extra product request.
- `026-inspect-run-evidence`: original receipts and all 26 declared result/trace artifact sizes and SHA256 digests verified; exactly one run directory per workspace. Complete raw output retained even where tool display truncated. No receipt or plan changed.
- `027-summarize-traces`: success; all 13 traces retain every event (`events.length === totalEventCount`) and contain only GET /openapi.json or GET /api/status on their own assigned origin. Short-circuited later assertions explicitly identified.
- `028-final-plan-verification`: all actual plan/first-design/assertion/validation integrity checks passed. This reused the original pre-run helper, whose final static metadata still says `executionPerformed:false` and `awaiting-independent-review`; those two temporal fields are stale after execution and must NOT be read as current campaign state. The raw output is preserved unchanged and the issue was disclosed to the coordinator. The separate post-run verifier derives current execution state from actual run/status records.
- `029-final-source-verification`: exit 0; canonical selected Console/Kernel component bytes remain verified. No source, plan or receipt was changed by execution or analysis.
- `030-post-run-verification`: exit 0; derives current completed execution from exact run/status records, with 5 campaigns, 10 checks, 7 pass, 3 needs_review, 13 attempts, 26 artifact files, 40 planned clause instances (30 passed / 3 failed / 7 not evaluated), and all 15 blocker instances retained. Original design and plan digests remain unchanged. No HTTP remains needed; coordinator informed that fixture servers can close.
