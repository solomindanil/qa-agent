# Observation skill reference — 20 September 2026

## Source scope

Console `c421160a71c0679a357f29828029ec3550791d16` is a documentation-only successor to `48e4628f91569c4cf96d0e616cbe6e29ec31baee`. Exactly two paths changed: `skills/qa-product-v0/references/agent-observations.md` and the identical `.claude/skills/qa-product-v0/references/agent-observations.md`. Each final file has SHA-256 `d3d0c5ed4a1b8292b09148c3f0147990f3741ecb3f4b33c19fbbfcd4d2ddd6c0`. Runtime code, tests, Kernel authority, schemas and permissions did not change.

The bounded correction documents existing `record-observation`, `read-observation` and `observations`, the exact two-key envelope, canonical artifact byte hashing, the 65,536-byte total stdin cap, zero attachments and recovery without automatic coverage/verdict promotion. It removes misleading separate-attachment verification advice. No new runner, helper, guard or storage contract was implemented. User approved this correction and a fresh-agent continuation check.

## Validation and independent review

- Before edit, a fresh-context reference retrieval agent read only the old complete skill and observation reference. It could not find the three CLI commands, complete CLI envelope, observation size limit or screenshot support. It explicitly returned unknown instead of inventing them. This demonstrates a documentation usability gap, **not a safety failure by that agent**.
- A different fresh agent given the revised files and the same prompt recovered all three commands, correct envelope, total byte cap and zero-attachment boundary. It also correctly left unspecified manifest-construction details to the existing runtime schema/helpers. One sample per version is not a statistical quality/autonomy benchmark.
- Independent Lead AQA reviewed both final reference hashes against the real Console CLI and Kernel aa5d2d1 implementations: **APPROVED, no actionable findings**. Review includes the quoted evidence-ID shell placeholder.
- Existing complete Codex/Claude bundle parity and linked-reference tests: **2/2**, before edit, after edit and from an independent dependency-free bundle restore. Byte parity is not actual Claude runtime qualification.
- Unchanged real observation CLI boundary tests on selected Console48e: **4/4**, malformed/UTF-8 input, byte cap, argument ambiguity, exact Kernel requirement. These tests do not record product observations.
- `quick_validate.py` could not run: PyYAML is missing in both the host and bundled Python. No dependency was installed. Unchanged frontmatter parsed successfully using existing Node YAML; existing bundle tests and independent review passed. The Python validator itself is **not** claimed green.
- Component `git diff --check` passed. Independent bundle restored exact commit/tree, packaging passed and checkout remained clean without node_modules.

The reference skill was developed using `skill-creator` and `writing-skills`: a small API reference correction, not a new discipline rule or process redesign. Runtime schemas remain the detailed contract.

## Delivery identity

- Source tree: `8b66b620fd2428c60715c8bdc6c602a3bb0422c1`.
- Complete-history bundle: `sources/candidates/console-observation-skill-c421160.bundle`.
- Bundle SHA-256: `eb477e4a2d575a7ff983c47b39f1a40f1ff8267aa737e830dc30f952fe040ea5`.
- Kernel remains `aa5d2d188606cbcf7e3111c130347a36970ec786`; Freeland remains d4754f7; reporting10d remains inactive.
- Candidate assembly: all four bundled sources restored and verified; root packaging **61/61**, zero failures/skips, exit 0. [Captured gate output](evidence/observation-skill-reference-20260920/root-gate.txt). Independent delivery review approved the package before canonical adoption.
- Canonical adoption completed on20September: selected Console advanced cleanly from48e4628 to c421160, other component pins unchanged. Fresh canonical `sources:verify` passed all four pins; root packaging **61/61** (44.126s, no failures/skips/cancellations), Console skill packaging **2/2**. Unrelated working changes were preserved, with only reviewed bytes staged. Installed host skills, historical campaign runtimes and product acceptance were not changed. No push or dependency install.

## Real consumer and plan boundary

The [earlier real-product process check](agentify-observation-consumer-20260920.md) retains its actual source attribution: two Agentify observations, one partial, nineteen targets without observations, no managed promotion. It is not retroactively called a fresh-agent trial.

A separate fresh-context agent completed the bounded real consumer: [self-contained commands, results and limitations](evidence/observation-skill-reference-20260920/fresh-consumer.md). It read the existing owner, graph/catalog and actual observation storage; reused A without repeating privacy/data-request; chose C's missing viewport inspection and followed the real contents link on `/methodology` in its own temporary browser tab. At 1280×720, the heading and five definitions were readable and unobscured. The tab was closed afterwards.

It appended and separately read back observation `urn:qa:evidence:6031081e2336dc6a90558ebd`, artifact SHA-256 `2e6f059b3e85527ee6c8a48fe984d5ab38b93a2ff4693d1e8f9b850b6a292d2f`. This remains `partial`, text-only, `agent_authored_unattested`: neither historical C nor the new capture retroactively becomes one attested complete result. Final scope: **21 targets, 2 with observations, 19 not observed; three coexisting observations; zero diagnostics**. A new observation of C does not inflate the target count. The coordinator independently checked all 25 protected model/registration/state/test files against the pre-observation baseline: unchanged.

The consumer used new reference bytes with the existing48e4628 executable Console and aa5d2d1 Kernel; the c421160 successor changes documentation only. Local publication binding is current, but deployed SHA remains unknown. Its screenshot was viewed in the dialogue, not stored through the zero-attachment channel. This single sample demonstrates useful fresh-context continuation without rerunning a completed check. It closes that bounded P1 consumer demonstration, **not all-product coverage, statistical agent reliability, installed-Claude parity or cloud readiness**. P2–P7 retain their own exits; no product, money, tracker or campaign authority is expanded.

## Retained review evidence

- [Old/new reference retrieval samples and limits](evidence/observation-skill-reference-20260920/reference-samples.md).
- [Independent Lead AQA source review](evidence/observation-skill-reference-20260920/lead-aqa-review.md) and [delivery review summary — APPROVED](evidence/observation-skill-reference-20260920/lead-aqa-delivery-review.md).
- [Coordinator's supported scope readback](evidence/observation-skill-reference-20260920/scope-readback.json), [exact new artifact](evidence/observation-skill-reference-20260920/viewport-artifact.json) and [paired manifest](evidence/observation-skill-reference-20260920/viewport-manifest.json). They contain public-page observations only; private owner paths in the report are historical locators, not delivery dependencies. The bundle and report can be read without those local paths.
- The fresh consumer honestly retains failed local source-path lookups and recovered truncated outputs; these are not product defects. Direct observation was not retried to get a preferred result.
