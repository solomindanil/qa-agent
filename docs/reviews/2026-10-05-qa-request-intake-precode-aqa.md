# B00/I01 request intake — independent pre-code AQA

Date: 2026-10-05. Reviewer: independent Astra, not the design/plan author. Review is exact-document acceptance before Sol implementation, not code, product or QA-box acceptance.

## Decision

**NO-GO for these exact implementation documents: Critical 0 / Important 1 / Minor 2.** Resolve Important I1 in the design and plan, then obtain affected-scope re-review. The bounded architecture is useful and appropriate; this is not a request for new global approval, a new owner API, managed B01 binding or a larger automation platform.

Reviewed root: `/Users/danilsolomin/projectsnew/qa-agent-release-20260926/.local/quality-mcp-clone`, HEAD `378f9f778420c431d256a2f1df61ac216a4377b9`.

| Exact input | SHA-256 |
| --- | --- |
| `docs/superpowers/specs/2026-10-05-qa-request-intake-design.md` | `9aa68a1ca583b627a5fdccaab8c4b2f8ffdf7499628b72edd4c3d8ff907b43d1` |
| `docs/superpowers/plans/2026-10-05-qa-request-intake-implementation.md` | `9df7a4284d3367922550396b7e0de73178528474315b425e3a5c15ee0082c281` |

Both documents were read completely. Context: root AGENTS, selected manifest/current qualification/assembly, global plan N00/B00/B01/I01 and its scope/authority constraints. Named source checks were limited to the existing root skill's routing boundary and copied-bundle test seam. Fresh `npm run sources:verify` exited 0 with `sources_verified` for all four selected components; this is source integrity, not execution acceptance. No component/default tests, product operation, installation, commit, branch/index change or delivery was performed. Other root edits remain the coordinating workflow's property.

## Findings

### I1 — Specify the executable persisted-report recovery path

**Important.** Design lines 133 and 159 make the JSON report authoritative and promise that a report JSON left without Markdown can be read/validated and the missing Markdown recreated from it. The accepted command grammar at lines 141–149 offers `read --report` but no report-render/recovery operation taking that saved report. The only publishing mode is `report --request ... --select ... --reason ... --evidence-note ...`; plan Task 2 Step 3 (lines 283–285) rebuilds a report from those original inputs. Neither document supplies an exact reconstruction recipe for a fresh consumer that has the persisted report path but not the prior invocation or temporary association-input files.

An idempotent rerun of the original invocation can repair the no-Markdown state, but it does not establish the stronger documented recovery from the authoritative saved JSON. The planned test, “absent Markdown recreated from identical report JSON,” leaves that distinction unspecified. Sol would have to invent command semantics or a host reconstruction workflow to meet the written promise. This is a normal interrupted two-file publication/reopen case, not speculative concurrency hardening.

**Required bounded fix:** choose and document one exact route before code. Either add a small explicitly named saved-report render/recovery mode using the existing `validateIntakeReport` and `renderIntakeReport`, or provide a complete supported host recipe reconstructing the existing invocation from the saved document. Define the output envelope, destination derivation, missing-only/exact-byte-idempotent behavior, changed existing Markdown conflict, and failure behavior. Do not make `read` silently write. Add a fresh-process control that receives only the saved report and the inputs the documented recipe explicitly requires, with the original temporary evidence-note files absent; verify identical JSON bytes/digest, correctly derived Markdown, and preservation of conflicting existing bytes. No owner/runtime/schema expansion is needed.

**Exact question for the design owner:** What supported invocation or complete recipe reconstructs the Markdown from the already validated report JSON after the host loses the original command context?

### M1 — Correct the read-result wording

**Minor.** Design line 151 says “`read` returns the validated full request JSON,” although lines 145 and 149 explicitly support `read --report` and the plan's test reads an IntakeReport. Change this sentence to “the validated full selected request or report JSON.” The alleged missing `validateIntakeReport` signature and missing `read --report` mode are **not** findings on these bytes: they already exist at design lines 48 and 145 respectively.

### M2 — Align canonical-key wording with the supplied implementation algorithm

**Minor.** Design line 56 specifies recursive JS code-unit key order. Plan lines 170–176 sort keys into an ordinary object and then call `JSON.stringify`; JavaScript enumerates integer-index keys numerically, regardless of insertion order. A read-only Node probe of the supplied algorithm with keys `2`, `10`, `a` returned requested sort order `["10","2","a"]` but serialization `{"2":"two","10":"ten","a":"A"}`. The current strict envelope schemas do not have numeric property names, so this does not currently break request association. It does contradict the exported general finite-JSON digest contract.

Choose one explicit protocol: document the actual sorted-object-plus-JSON.stringify semantics, restrict admissible keys if intended, or emit serialized properties in the declared order. Add an independent fixed expected serialization/digest vector with integer-like and ordinary keys, not a test that obtains both actual and expected hashes through `documentDigest`. Preserve exact strings, array order and the newline rule. This need not become a general canonicalization framework.

## Accepted scope and controls

- A dependency-free skill-local document helper is justified for immutable request identity, explicit revisions, strict readback and a portable intake artifact. Existing private owner notes/checkpoint navigation remain the owner; no new store, queue, runner or mandatory registration is introduced. Keep it at the listed two modules and recipe, without extending into receipt interpretation or orchestration.
- Original full wording/scope survives an initial family selection and amendment. Whole-content source clauses are explicitly preservation units, not invented acceptance criteria. Every clause stays unassessed, and even all-known-clause selection cannot certify full coverage.
- Two captures in one workspace get distinct request identities. Existing evidence references compare the full request tuple and exact owner; older revisions and other requests are historical, not current. Matching remains caller-authored/unattested and NOT_EVALUATED. The planned real saved-reference/subprocess controls are materially better than comparing two synthetic hashes alone.
- Brief-only and meaningfully incomplete input are admitted. Empty, partial and unreadable explicitly supplied attachments remain visible. Source omissions get consistency checks rather than automatic success. Ambiguous prose or generated documents do not supply a business oracle.
- A missing browser/Console capability does not prevent document capture or authorize installation/execution. Specific capability blockers belong in the specialist/checkpoint handoff under the required recipe; the helper does not discover capabilities. The fresh human-language consumer should verify this explanation. No new capability API is requested by this review.
- `read --request`, `read --report` and strict report validation are present. Selection complement and evidence classification must be recomputed, while source/report integrity is not misrepresented as owner-authenticated evidence. JSON/source tampering and markup safety controls are relevant to the actual document helper.
- The portable copied-bundle subprocess and later fresh actor are distinct controls. The actor remains pending until actually run under coordinating authority, discovers the documented recipe without component-path hints, and performs no managed registration or product execution. Plans and successful helper tests cannot certify that consumer in advance.
- Root-source delivery remains separate from installed skill bytes and frozen campaigns. B00's bounded capture/report contract and partial I01 do not close B01/D01/E00/V01/N01/Q1. Missing future B01 work is not a blocker for this capture slice; I1 is about the slice's own promised recovery.

## Next bounded action

Design author resolves I1 and aligns M1/M2 in these two documents; independent review checks only that affected delta and exact new hashes. No renewed user approval of the already approved global direction is needed. Then Sol may implement the accepted root-only slice, preserve actual RED/GREEN evidence and submit independent code AQA. This report itself changes only this review file.
