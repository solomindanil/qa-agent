# Git preservation checkpoint — 21 September 2026

This is source/evidence preservation, not acceptance of P2-B, product QA or cloud qualification. Canonical base is `45a74c33b3df091411a253ef894f1dfa1f946995`, branch `codex/p2-semantic-source-delivery`. Integration must preserve that ancestry. No manifest pin, installed skill, campaign, product or remote repository is changed by this checkpoint.

## What was checked and retained

- An independent read-only audit checked the canonical Git store, its current local and remote-tracking refs, and all three registered historical worktrees. Their tips are ancestors of the canonical base; none has unique commits. This is not a scan of every historical clone or scratch directory on the machine. Remote-tracking refs were inspected locally, not fetched.
- `codex/self-contained-delivery-20260913` retains five historical non-ancestor commits. Prior consolidation accounts for the ten touched delivery paths; superseded documentation is not byte-identical to canonical. The branch remains intact, not discarded or silently merged.
- Backup `00b3d9e4e4f4b2cdb44b3da1acaafca0c0c05018` remains an ancestor and the first parent of the reviewed adoption merge. No reset, cleanup or history rewrite was performed.
- The old `postreview-source-integrity` worktree contains two untracked documents. One report had unique filesystem-only bytes. Both are now copied byte-for-byte as inert historical text under [the archive](evidence/git-preservation-20260921/README.md); their old paths are untouched. This closes the identified unique-byte preservation gap without promoting their obsolete status text.
- The isolated P2-B Freeland source is clean at `2ab052c6e641b20eb15b371dfdc6a0b536c86ea4`, tree `82117e52b2a96af3451ab93c577dce6e73268b80`. This successor to `8aefe795a3f260d27657b3d44f64235683b55fda` adds only the pending privacy-regression test changes. Its two focused controls freshly FAIL as intended: assertion and strict-locator diagnostics retain synthetic sensitive values. It is an explicitly unaccepted RED checkpoint, not a production repair or green source gate.
- Two inactive complete-history bundles preserve both P2-B points. `freeland-p2-topup-8aefe79.bundle` SHA-256: `6a906eb9cbf907b125162050b25d4b7d486bc64dadfed067a87a85519ee68f85`; `freeland-p2-topup-red-2ab052c.bundle` SHA-256: `9063065941e4a3845b7bebc3209dcd26d205da5589f43af9ce087d7bdd66de97`. Neither is selected by the manifest. Bundle verification confirms the new complete history; [qualification](p2-topup-ui-20260921.md) retains exact source attribution and the rejected review.

## Acceptance and next work

Selected Kernel `aa5d2d1`, Console `c421160` and Freeland `0ea2df1` are unchanged. The root source verifier passes all four selected entries; this is packaging/source identity, not evidence that the P2-B repair works. A raw-log filename containing “green” is not a result; the retained evidence index calls out failed intermediate runs explicitly.

The global plan is still P0–P7 with its existing reconciliation obligations. Next, run the [existing P3/P5 decision baseline](evidence/git-preservation-20260921/p3-existing-baseline-map-20260921.md) against current source before skill changes, then progress to actual unfamiliar-product execution and durable continuation. This does not wait for every Freeland-specific gap. The bounded P2-B privacy repair remains separate: early value minimization helps some assertions but does not yet cover action/setup/teardown diagnostics. A throwaway reporter projection is not a no-persistence fix. Preserve unexpected failures, guard failures, strictness and actionable safe diagnoses.

Full source qualification belongs to the actual future fix bytes. Cloud, push, host-skill installation, live product operations and new financial authorization remain outside this preservation step. The old dirty worktree is deliberately not cleaned; archived bytes do not justify deleting original work.

## Verification record

Independent [Lead AQA review](evidence/git-preservation-20260921/git-preservation-lead-aqa-20260921.md) approved the preservation-only 49-path tree `b6b720f030117e0d19f6b9c92e8b655a76975e2a`, with no corrective findings. It was committed as `f1444759c80143bced40ad84a9f19e1b2163f82a` and fast-forwarded into canonical `codex/p2-semantic-source-delivery`; canonical tree equality and clean status were read back. No merge conflict, reset or history rewrite occurred.

Fresh root packaging: isolated delivery `npm test` passed 61/61 with zero failures/skips, followed after canonical adoption by `sources:verify` passing all four selected sources and canonical `npm test` passing 61/61 with zero failures/skips. Raw outputs are retained in `evidence/git-preservation-20260921/git-preservation-root-tests-20260921.log` and `git-preservation-canonical-tests-20260921.log`. Canonical `git fsck --full --no-dangling` also exited zero. These are source/packaging checks; historical full component results retain their own commits and the new RED checkpoint does not inherit the `8aefe79` aggregate.

The independent review applies to the exact frozen preservation tree, not this later factual adoption note. Original raw logs and generated evidence retain whitespace, so the broad all-file whitespace check emits warnings; active hand-authored document checks passed. No evidence was reformatted to hide those differences.

A separate read-only `git ls-remote --heads origin` succeeded on 21 September: the remote exposes `codex/precloud-source-integration` at `787d3df963fe1ff71c80457a49753653e44505e7` and `codex/workspace-assembly` at `fab87d6a318db57dd27dceb90264a04e4ad53549`. The current canonical branch is not published there. No push or authentication/email action was attempted; local preservation is not remote backup. The original historical worktree remains dirty only with its two now-archived documents.
