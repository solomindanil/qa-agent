### Spec Compliance

- ❌ Issues found: the Kernel slice implements the requested public APIs, strict unattested payload, owner-bound immutable storage, full target denominator, diagnostics, and no managed verdict/PASS writes, but two required safety semantics are not satisfied. Stale publications are not always retained as historical (`src/kernel/agent-tool-observation.ts:330-335`), and the aggregate report does not complete the required final byte recheck for artifacts (`src/kernel/target-observation-report.ts:139,164,215-218,346-362`).
- ✅ Scope is otherwise correct: this commit is Kernel-only. The actual Console consumer and paired Kernel/Console acceptance are explicitly main-owned follow-on work, so their absence is not a Kernel finding.

### Strengths

- `src/contracts/agent-tool-observation.ts:8-24` defines a strict versioned schema with nonblank authored fields, the required result enum and host enum, nonempty limitations, and an exactly empty attachment tuple.
- `src/kernel/agent-tool-observation.ts:275-294,340-375` validates the owner-derived path, redaction state, identity-object digests, current publication/strategy, resolved oracle, current catalog check/target, and reviewed `verifies` relationship before accepting current evidence.
- `src/kernel/agent-tool-observation.ts:133-173` uses guarded absent writes, refuses conflicts and manifest-only state, supports artifact-only reconciliation, and returns success only after public readback confirms a current binding.
- `src/kernel/target-observation-report.ts:143-205,225-255` keeps safe incomplete/malformed/altered/historical owners explicit, retains contradictory records, and constructs rows from every current coverage target with definitions, coverage state, blockers, and explicit not-observed state.
- `tests/kernel/agent-tool-observation.test.ts:159-215,250-305,311-350` exercises immutable retry/reconciliation, conflict and manifest-only refusal, digest/size/secret/attachment rejection, cross-process readback, and protected publication/managed-byte preservation. `tests/kernel/target-observation-report.test.ts:120-158,177-207,278-286` covers the complete denominator, contradictory observations, safe diagnostics, and unsafe-channel rejection with real Kernel fixtures.

### Issues

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- `src/kernel/agent-tool-observation.ts:330-335` — `classifyBinding` returns `historical` only when both `planCurrent` and `publicationCurrent` are false; a stale publication with an unchanged strategy is rejected as `AGENT_TOOL_OBSERVATION_INVALID`. Publication authorities are independently versioned and may legitimately advance while retaining the same compilation/strategy, so this loses a safe historical record and makes the report diagnose it as malformed instead of historical. A focused probe created exactly that valid revision (`differentPublication: true`, `sameStrategy: true`) and the public reader returned `AGENT_TOOL_OBSERVATION_INVALID`. Treat any noncurrent publication authority as historical after the byte/schema/provenance/identity checks; reserve invalid/current-binding failure for a current publication whose plan/check/target/oracle binding is wrong. Add a same-strategy publication-rotation case alongside the changed-strategy history test at `tests/kernel/target-observation-report.test.ts:209-249`.
- `src/kernel/target-observation-report.ts:139,164,215-218,346-362` — the report's outer optimistic consistency pass tracks and rereads only manifest receipts. Its inventory signature contains names, dev/inode, kind, and mode, but no artifact content digest. Therefore an artifact can be modified in place after `readAgentToolObservation` performs its inner final read and before the report completes other owners/final checks; unchanged inode/mode/name plus an unchanged manifest passes the outer checks, and the report returns bytes that are no longer current rather than rejecting the race. This also leaves altered diagnostics unbound to stable artifact bytes. Capture a verified artifact receipt for every complete owner (including owners later classified altered/malformed) and re-read/compare both manifest and artifact receipts in the final pass; add a deterministic mutation-hook test that expects `PATH_RACE_DETECTED`/channel failure.

#### Minor (Nice to Have)

- None.

### Focused Checks

- Guarded-write check: `src/kernel/private-store.ts:89-285` confirms absent writes use per-target admission, repeat the absent/digest expectation under the admission, preserve uncertain commits, and do not overwrite an immutable winner. No overwrite defect was found in the observation writer's use of this API.
- Unsafe-absence check: a focused temporary-workspace probe replaced `.qa-private/evidence` with a dangling symlink; `readTargetObservationReport` rejected it with `AGENT_TOOL_OBSERVATION_WORKSPACE_INVALID`, confirming it did not report an empty/valid channel.
- Stale-history probe: a focused temporary-workspace probe published an authority revision with an unchanged strategy digest, then read the prior observation. The result was `{read:false, code:"AGENT_TOOL_OBSERVATION_INVALID", sameStrategy:true, differentPublication:true}`, confirming the first Important finding.
- No package-wide or full Kernel suite was rerun; the implementer's reported focused/regression/typecheck/build evidence was used as supplied.

### Assessment

**Task quality:** Needs fixes

**Reasoning:** The implementation is well-scoped and most of the storage, provenance, denominator, and diagnostic contract is strong, but stale-history retention and the aggregate reader's final artifact-byte race check are explicit acceptance requirements. Both defects can cause the public report to misrepresent safe stored history or return an observation across an undetected mutation window.

---

## Scoped Lead AQA Re-review — Round 1

**Fix range:** `ce9f3760208febaf2279a28ae85549322a26f8af..aa5d2d188606cbcf7e3111c130347a36970ec786`

### Finding Verdicts

- **Finding 1 — ADDRESSED.** `src/kernel/agent-tool-observation.ts:332-333` now classifies every noncurrent publication authority as historical after the existing manifest/owner/payload/provenance/identity validation, while a current publication with a stale strategy remains invalid. `tests/kernel/target-observation-report.test.ts:277-324` covers a publication-only rotation with an identical strategy digest and asserts direct historical binding, no current observation acceptance, and an explicit historical report diagnostic.
- **Finding 2 — ADDRESSED.** `src/kernel/target-observation-report.ts:163-169,183-188,223-225` now reads and retains both receipts for every complete two-file owner, compares both paths and receipts with every successful inner readback, and rereads both receipts at the aggregate report's final boundary. Because receipt capture occurs before manifest parsing, malformed and altered complete owners also participate in the final artifact-byte check. `tests/kernel/target-observation-report.test.ts:177-227,346-373` supplies the malformed/altered final-read control and a deterministic in-place mutation case that requires `PATH_RACE_DETECTED`.

### New Fix-Introduced Breakage

- None found in the scoped fix diff. Artifact-only, manifest-only, and other incomplete-shape owners still branch before content reads, while all complete owners receive the stronger byte boundary.

### Outside Observations (Nonblocking)

- None.

### Evidence Considered

- Implementer-supplied focused RED/GREEN evidence covers publication-only history and the outer artifact race; the explicit malformed/altered control reports the required final artifact reads.
- Implementer-supplied combined observation result is 13/13 passing, with final typecheck and build both exit 0. Per the scoped re-review instruction, these suites were not rerun merely to reproduce the report.

### Round-One Assessment

**Task quality:** Approved

**Reasoning:** Both original Important findings are fixed at their source boundaries and have direct regression coverage. The Kernel fix is approved for the main-owned exact-pin and later paired Kernel/Console acceptance work.
