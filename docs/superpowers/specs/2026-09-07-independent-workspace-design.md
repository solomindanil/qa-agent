# Independent QA agent workspace — delivery design

## Approved direction and scope

The user approved one independent `qa-agent` workspace containing the existing
agent-first QA work, followed by verification of the assembled system and then
continuation of the existing global plan. Keep existing component Git identities;
do not flatten them or build another runner, graph engine, verdict or tracker SDK.

This written design fixes the delivery boundaries of that direction. The first
slice is reproducible local assembly and source/tool qualification. It is not a
claim of fresh product QA, cloud deployment or completed universal capabilities.

## Workspace responsibilities

| Location | Purpose |
| --- | --- |
| Root README / AGENTS / CLAUDE | One entrypoint, product and owner selection, capability discovery, explicit current checkpoint |
| `components/` | Generated independent Git checkouts restored at exact selected revisions; no dependency on old worktrees or their object databases |
| `sources/` | Reviewed self-contained component bundles and their version/hash inventory; no unrelated refs or unscreened history |
| `skills/` | Reusable QA instructions, full references and deliberate host routing; no silent overwrite of installed skills |
| `products/` | Per-product index, graph/knowledge authority, test and environment contracts; no shared credentials or transferred payment permissions |
| `evals/`, `templates/` | Selected synthetic buggy/fixed controls and reusable test/report patterns |
| `references/` | Useful historical/prototype work with provenance and explicit non-active status |
| `docs/` | Global plan, decisions, source inventory, qualification results and continuation instructions |
| `.local/` | Ignored, product-isolated private state and local qualification artifacts, never distributable credentials |

Browser binaries, dependencies and host plugins are environment dependencies,
not copied logged-in installations. Keep component lockfiles separate. Record
requirements and preflight availability; never imply cloning installs a plugin,
authenticates an account or supplies new authority.

## Initial source choices

- Starter Kernel: `393af209a7629d075258fd1050224db071817a47`.
- Starter Console and integrated skills:
  `43262b2202532d9ea5648e27dafe0fc5177689fe`.
- Freeland source/skill descendant:
  `3d0088ec86b16a2802aa09cca975ca65cc2ede32`; runtime qualification belongs
  to ancestor `b8f5906d1aba2e0a6f1de622cb06cb0d990f8e1c`, not a new run.

Original skill05aa bytes are already included in Console432. Do not duplicate
that runtime or the older Nuanu/baseline/canary donors embedded in Freeland.
Keep the Freeland embedded old Console distinct from the portable Starter one.
Each product has one declared execution/knowledge owner for a campaign.

Retain graph gap-wave86e833, I1 coveragea4df0c5, Universal-QAH/PayDemo58a8182 and
Nuanu-app7be0e9b as selective reference/eval donors, not alternative active engines.
Preserve the distinct Kernel observation-report branch10d398d as a non-active
reference after auditing its additional history; it does not replace Kernel393.
Reviewed but uncommitted G0 changes require their exact-file hash inventory and
review companions; they must not be represented as their old repository HEAD.
Unqualified dirty work is preserved separately and is not enabled by assembly.
Tect is reference-only; do not redistribute its UNLICENSED plugin or inherit its
push policy. Source licensing and attribution are checked before any inclusion.

## Source delivery and security

The saved incremental bundles require old base commits and are not a complete
delivery. Create selected-tip, self-contained bundles only after reviewing all
reachable objects for sensitive content, licenses and irrelevant owner material.
Never use `--all` on a donor. Record scanner coverage and unresolved findings;
heuristic scanning is not a guarantee that secrets cannot exist.

If publishing exact history would disclose secret/private material, do not push
it. Keep local work intact and report the concrete delivery blocker. Sanitizing
or rewriting history changes source identity and requires a separate reviewed
authority adjustment; never claim altered commits are the old accepted pin.

Keep credentials, cookies/storageState, account/payment/provider data, active
campaign/outbox state, screenshots/traces and broad private directories outside
the distributable. Preserve useful private project knowledge in its own scope
only after review. Do not manually relocate registered managed state or rewrite
historical receipts to make a new workspace appear accepted.
Committed synthetic visual-test baselines are source fixtures, not private
runtime screenshots; include them only after content review, without relabeling
them as evidence of a real product run.

## Minimal bootstrap boundary

A small local bootstrap consumes a versioned JSON inventory of component IDs,
relative destinations, exact commit/tree, bundle digest and qualification state.
It verifies bundle integrity and closure, materializes independent Git checkouts
without hardlinks/alternates to old sources, then reads back HEAD/tree/root.
Require a normal child-local `.git` directory: canonical Git dir, common dir
and object storage must belong to that child. An external worktree gitdir
pointer is not independent even when HEAD/top-level match and no alternates exist.

Existing matching checkouts are verified and left unchanged. Wrong, dirty,
symlinked or conflicting destinations are rejected without deletion or overwrite.
All paths resolve within the new workspace. Interrupted assembly stays visible;
it must not be treated as a complete source set. No bootstrap step installs
dependencies, runs product commands, sends Flow messages or changes a product.

Root instructions select existing commands from the correct child cwd with
explicit Kernel, workspace, state and registry paths. Tool availability and
source verification precede execution. Product checks require their ordinary
pack authority and graph-first preflight; the packaging command grants neither.
No scheduler or new generic execution API is part of this slice.

## Verification and acceptance

1. Restore audited components into an empty canonical directory using only the
   delivered bundles, with no inherited Git object overrides or old donor access.
   Read back exact source/lockfile hashes, Git root, child-local Git/common/object
   directories and absence of alternates. Reject matching external-gitdir worktrees.
2. Test valid restore/repeat and wrong SHA/digest, missing bundle, dirty source,
   conflicting existing destination, external Git storage and symlink/path escape refusals. A failed
   check must leave pre-existing user bytes unchanged.
3. Resolve dependencies with existing separate lockfiles and record runtime
   versions. Installation/build is a deliberate qualification step, not an
   implicit bootstrap/network fallback. Use private writable caches.
4. Run the agreed safe local source/tool checks with full argv, exits and output.
   Keep tested, failed, skipped and unassessed lanes separate. Do not invoke the
   current default Console E2E against owner workspaces or broad temporary roots.
5. Verify a fresh Codex/Claude session can identify components, skills, product
   and checkpoint from this workspace. Actual tool execution is separate from
   source-byte equality; missing plugin/access remains explicit.
6. Preserve original failed attempts and source qualification boundaries. The
   Console fixture repair is still pending: positive Nuanu/public-auth tests hit
   their unchanged180s deadlines. Do not silently include that patch in432 or
   declare these scenarios working after copying files.

Successful assembly means reproducible sources and the specifically verified
tool paths, not complete product coverage. After qualification, resume the
fixture repair, real second-product G1 and full/ticket/graph G2 work in the
approved global plan; preserve Freeland gaps and G3–G6 obligations.

## Change and rollback

Original repositories, product deployments and installed skills remain intact.
Update component pins only after review and affected qualification; current
campaigns retain their input versions. Do not overwrite a changed child checkout
to update it. Selective delivery/readback precedes declaring this workspace the
working runtime. No push until the included source/history audit and relevant
assembly checks are complete.
