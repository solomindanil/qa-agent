# Reviewed source adoption — 14 September 2026

This delivery selects existing reviewed components through the existing manifest
and local restore tool. It does not add another runner, registry or verdict.
The root candidate starts at `5ba9895bba13a83bae58c7df3db25a2f081fdfaf`.
Final root adoption is gated by independent review and the cold checks below.

**Canonical integration completed:** root `90ac8caf1de26446a4c48e7e48140ed884f401fa`,
tree `1ea30d72763a111b770c750bf89d16a0abb884ec`, matches the reviewed candidate's
source tree exactly. All three selected component directories are restored in
the main workspace and `sources:verify` succeeds; old clean children were
preserved recoverably, not deleted. Existing owner checkpoints are unchanged.

## Exact selection

| Source | Selected commit | Source tree | Delivered bundle SHA256 |
| --- | --- | --- | --- |
| Kernel | `657894dbd61561a634f36669a0874dccccbea59e` | `4e57a5e0a21a3f5fc838295a75e06a94e13c4081` | `84c443bf1bb0ed715b96989cc71906ea04652ab7d0a840529d7a351110e10de7` |
| Console | `1c715a1980dac52fb8ba1d267c8c8e2d97b406e8` | `f6fc0cc720008dde02891592f988a331ab24e289` | `044a018d6ff7de2e7f66ed6a1d03bdeea4f32a0039ed4f3ab3a0febba4d02415` |
| Freeland | `21c1c617a2dbe5d1131215dc738dba2556851ae3` | `f691a01e33aabb8a72673326ec524d955c4794e8` | `2646e64b1a623530d0cab99f07a2d5d0a920245e75bb858001e9fc3c645ca066` |

Reporting reference10d, its tree/bundle/digest and `runtimeAuthority:false` are
unchanged. The three selected archives retain their `sources/candidates/` paths
to preserve provenance without duplicating bytes. That folder name is not a
runtime selector; [manifest](../../sources/manifest.v1.json) is authoritative.
Former source bundles and historical qualification records remain available.

## Reused qualification, not repeated product QA

- [Kernel M4](kernel-admission-20260914.md):55 writer,10 actual consumer,
  244 compatibility and cold55 controls; typecheck/build and independent review.
  Its historical1719 passed/1 timeout remains failed on its original source.
- [Console pair](console-kernel-pair-20260914.md):121 authority,21 actual consumer,
  160 E1/M2/M3 integration controls; nonincremental typecheck/Vite and independent
  review. Existing lint findings and566.95kB bundle warning remain.
- [Freeland M1/M5 successor](graph-locator-candidate-20260913.md): full owning
  offline2759 executions, cold51 graph/provenance controls and independent review.
  These are harness executions, not distinct product acceptance cases.

Source adoption does not rerun or reattribute those component gates. It checks
delivery and selection. No default child `npm test`, product request, tracker
write, payment, migration, dependency/skill installation or cloud setup is part
of this root slice.

## Fresh root checks

An isolated normal Git clone with its own object store restored all four exact
components from bundled history. No child dependencies or author registries were
copied. Existing `sources:verify` checks bundle digests, exact HEAD/tree and actual
tracked working bytes; it also rejects dirty/conflicting destinations.

Two additional root controls in `tests/selected-pair.test.mjs` call Console's
existing authority resolver: the selected Kernel must match its embedded pin;
old15a and reporting10d are rejected. The second control preserves all four
component roles and the exact inactive reporting reference. It is a packaging
compatibility test, not a new authority implementation. Root tests now require
the documented `sources:restore` first. `sources:verify` alone still checks
individual source integrity, not cross-component runtime compatibility.

Negative control: temporarily selecting old15a in the isolated manifest produced
`KERNEL_REVISION_MISMATCH`,1 passed/1 failed. Restoring657 gave2/2. No component
source changed and the deliberately inconsistent manifest was not retained.
The raw negative/positive output is in the task transcript, not a bundled log.

- Root `sources:restore` and `sources:verify`: exit0, all four exact sources.
- Root `npm test`: **59/59**,0 failed/skipped/cancelled,27.032s. This includes the
  previous57 packaging controls and the two source-selection controls, not new
  product tests. Raw log SHA256:
  `d921b867d1bce4ae02edb6cfbb0ef64dc7092248c20307b04dc8ba80e6161910`;
  source-verify log:
  `2fc64ba63bb2a70d5c482d6bbe5d961585622d36b486730390f80874a7d53599`.
- Source skill closure:19 ordinary files matched their Git source bytes and17
  relative Markdown links resolved across root qa-check/qa-bugfix, Console
  qa-init/qa-product-v0 plus Claude mirrors, and Freeland release skill. Console
  source/mirror trees match: qa-init`ea04f9ed3a19451ead26dd6b0e9de257fc78bea6`,
  qa-product-v0`9890a5190fee728446a29dcae67f8cf19962236e`; Freeland release tree
  `2660306800da93d820ada032defd0485c5bc213b`. No component had dependencies or
  Git alternates. This is a resource-delivery check, not a skill-behavior eval.

Private raw root logs remain under `.local/root-adoption-20260914.l36hqr/` on
the author machine. Their absence on another host does not prevent replay.
Independent Lead AQA adoption review: **APPROVED**, no actionable spec or
task-quality findings in the exact eight-file diff. Reviewer checked the retained
logs, source selection, scope and evidence attribution without rerunning gates.
Canonical replacement still requires the owner/process recheck and recoverable
source preservation below; review is not campaign migration authority.

Final transfer evidence: normal independent clone at candidate
`a5635b84b4f01bbb3b4c1740ab5ef2fd3ce50854` restored/verified all four components and
passed59/59 root controls in27.252s, no failures/skips/cancellations; cold log
SHA256`f09ccf7b719099ecef73079171cd09264d5c972945269088bb38d93115a486c1`.
The canonical root then restored/verified the same sources and passed59/59 in
26.486s; log`66b7ecfa76b7c5d8879173084abe8327ee9b11ec5c4de160b96e24985bda6c2d`.
The staged canonical tree matched the independently cloned candidate tree before
commit. These are separate packaging executions, not177 distinct QA cases.

Replay from a new normal Git clone, using Node>=22.12 and Git:

```sh
npm run sources:restore
npm run sources:verify
npm test
```

Read the complete selected skills via [skills index](../../skills/README.md).
These commands need neither NuanuFlowQA nor original-machine files. Product
credentials, tools and permissions are separate prerequisites for actual QA.

## Owners and limits

A read-only current-owner audit found that existing Freeland and Agentify work
uses separate frozen runtime directories, not the main root's component paths;
no main-component runtime process was observed. Before any canonical replacement,
recheck those boundaries and preserve old clean children as a recoverable local
source backup. Do not move managed workspaces, change owner checkpoints or
silently upgrade a historical campaign. New users need no such historical state.

The integration recheck observed zero main-component processes. Original
Kernel15a/Consoleb392/Freeland9c directories were preserved with their clean Git
state and local dependencies under `.local/source-backup-20260914.2kN3Mj/`;
the backup is not an active selector. Hashes of all three inspected historical
owner checkpoints were unchanged after integration. This is local preservation,
not automatic campaign recovery or a universal concurrent-owner guarantee.

Original root user changes are outside this slice. Installed Codex/Claude skills
are not overwritten. Source references and compatibility mirrors are delivered,
but this does not prove actual current execution on both hosts.

Next acceptance: a fresh agent derives and executes meaningful checks using the
selected skill/graph/runtime, reads back evidence and states residual gaps.
Actual process-crash continuation, full/ticket end-to-end qualification, M6
generic manual receipts, graph coverage and cloud remain separately open. M6
must remain unconnected until qualified; existing Console/E1 does not use it.
