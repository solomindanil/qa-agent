# Freeland PAY01 source-only CI boundary report

## Status and identities

- Status: **component change committed and clean; no push, adoption, merge, workflow claim, or product action**.
- Component clone: `/Users/danilsolomin/projectsnew/qa-agent/.local/p0-freeland-reconcile-20260920.O5fVBF/freeland`.
- Branch: `codex/freeland-pay-readiness-integration`.
- Approved base: `064410869c2e63a4b7c23cc3753c717a337f8a3a`.
- Component successor: `d4754f7ddbcb8183f695f479ef21aa7728c1ace0`.
- Commit subject: `test(qa): isolate PAY01 source-only oracle checks`.
- Final component worktree: clean.

## Bounded result

The existing dependency-free TC-PAY-01 fixture helpers and all 36 PAY01 behavioral tests were moved from the mixed smoke module to `tests/product-graph/freeland-pay-01-oracle.test.mjs`.

The new file imports only:

1. `node:assert/strict`;
2. `node:test`;
3. the existing `tools/freeland-replacements/tc-pay-01-oracle.mjs`.

The old smoke module retains all 60 other tests, including the shared five-oracle registry-contract tests, the PAY01 generic registry-contract row, and the real PAY07 TypeScript projection. The runner glob was not changed.

No oracle behavior, schema, registry, receipt, package, lockfile, product source, environment, runner, or authority was changed.

## Exact committed paths

1. `provenance/source-manifest.v1.json`
2. `tests/freeland-main/provenance.test.mjs`
3. `tests/product-graph/freeland-pay-01-oracle.test.mjs`
4. `tests/product-graph/freeland-smoke-u0-oracles.test.mjs`

Provenance changes are limited to:

- refreshing the existing smoke test row's final-byte `blob` and `sha256`;
- adding the extracted test as an assembled Safety row with the same frozen TC09 test-lane donor;
- updating only the owning provenance expected list and mechanical counts: total rows 402→403, Safety-informed rows 138→139, S7 rows 6→7.

No provenance algorithm changed.

## TDD and verification evidence

### RED

At the approved base, the new exact path failed because it did not exist:

`node --test --test-concurrency=1 tests/product-graph/freeland-pay-01-oracle.test.mjs`

Result: exit 1, `Could not find 'tests/product-graph/freeland-pay-01-oracle.test.mjs'`.

The controller's pre-existing source-only RED was also confirmed in `freeland-source-ci-red.log`: running the old mixed smoke file in a clone without dependencies failed with `ERR_MODULE_NOT_FOUND` for `typescript`.

### GREEN and preservation

Fresh final combined command:

`node --test --test-reporter=spec --test-concurrency=1 tests/product-graph/freeland-pay-01-oracle.test.mjs tests/product-graph/freeland-smoke-u0-oracles.test.mjs tests/product-graph/freeland-manual-replacements.test.mjs tests/freeland-main/provenance.test.mjs`

Result: **160/160 PASS**, 0 failed, 0 cancelled, 0 skipped:

- split oracle files: 96/96;
- registry: 30/30;
- provenance: 34/34.

Mechanical baseline/candidate comparison executed the base smoke file in an independent base clone and the two candidate files in the component clone:

- baseline tests: 96;
- candidate tests: 96;
- baseline unique names: 95;
- candidate unique names: 95;
- changed name multiplicities: none;
- PAY01 behavioral tests in new file: 36;
- retained mixed tests in old file: 60.

The unique-name count is 95 because the pre-existing PAY07 suite intentionally contains one duplicated test title; its multiplicity is unchanged.

A byte-level preservation check additionally proved:

- the old smoke file equals the base file with exactly the PAY01 block removed;
- the new file equals the existing PAY01 content with only its three boundary imports/helpers;
- the old real PAY07 projection remains untouched.

Additional final checks:

- `node tools/freeland-main/provenance.mjs --verify .`: VALID, 274 ordinary git rows, 129 assembled rows, 80 private rows.
- `node --check` on both split files: PASS.
- `git diff --check`: clean.
- Exact forbidden-surface comparison found no changes under `package.json`, `package-lock.json`, `config`, `schemas`, or the PAY01 oracle.

### Cold dependency-free confirmation

Independent normal clone:

`/Users/danilsolomin/projectsnew/qa-agent/.local/p0-freeland-reconcile-20260920.O5fVBF/component-cold-d4754f7`

The clone was created from exact successor `d4754f7ddbcb8183f695f479ef21aa7728c1ace0`, had no `node_modules` before or after execution, and remained clean.

`node --test --test-reporter=spec --test-concurrency=1 tests/product-graph/freeland-pay-01-oracle.test.mjs`

Result: **36/36 PASS**, 0 failed, 0 cancelled, 0 skipped. No installation, dependency copy, symlink, network, browser, or product call was used in this candidate clone.

## Raw logs

- `freeland-source-ci-red.log` — controller-recorded old mixed-file dependency failure.
- `freeland-ci-boundary-red.log` — exact missing-path RED.
- `freeland-ci-boundary-green.log` — first split 96/96 GREEN.
- `freeland-ci-boundary-registry-provenance.log` — registry30, provenance34, verifier and syntax evidence.
- `freeland-ci-boundary-conservation.log` — first mechanical name/content preservation check.
- `freeland-ci-boundary-final-precommit.log` — authoritative final 160/160, VALID verifier, final name/content/import preservation and diff hygiene.
- `freeland-ci-boundary-cold.log` — independent no-`node_modules` clone and cold36 evidence.

The final-precommit log supersedes earlier equivalent GREEN logs for final byte seals; a trailing blank-line warning found during the first commit check was removed, provenance seals refreshed, the full relevant gate rerun, and the commit amended before handoff.

## Limits and concerns

- This proves only the extracted PAY01 oracle composition lane is dependency-free and suitable for the narrower source-only step.
- It does not prove the full mixed smoke suite, PAY07 projection, full QA coverage, deployed product correctness, cloud readiness, or release readiness.
- The old mixed file intentionally still imports `typescript` for PAY07 and remains part of the normal dependency-backed product-graph glob.
- No `readiness131` suite was rerun, per the brief.
- No live environment, browser, API, product, payment, Nuanu Flow, tracker, or other external system was accessed.
- No push or manifest/workflow adoption occurred; controller cold qualification and independent Lead AQA review remain separate.
