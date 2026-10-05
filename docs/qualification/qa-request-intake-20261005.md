# Request intake — bounded source qualification, 5 October 2026

## Accepted result

The root `qa-check` source bundle now contains a dependency-free request/report helper and a discoverable recipe. It preserves a plain-language full or partial request without requiring initial product documentation or managed registration. A new capture has a new ID; explicit amendments preserve ID, revision and prior wording. Saved reports retain selected, remaining and unavailable items, caller-authored provenance and unknown execution/oracle facts.

This is **bounded B00 capture/report qualification; I01 remains partial**. It is not a managed execution binding, a full-product test, a business oracle, product PASS or the completed universal QA box. Whole-text preservation clauses are not acceptance criteria or executed coverage. Reports remain `NOT_EVALUATED`, `caller_authored_unattested`, `not_owner_attested`, with reconciliation `not_performed` until separate owning evidence exists. No new runner, registry, dependency or product-specific execution rule was added.

Normative authority: [exact intake design](../superpowers/specs/2026-10-05-qa-request-intake-design.md) and [implementation plan](../superpowers/plans/2026-10-05-qa-request-intake-implementation.md). Discover the [recipe](../../skills/qa-check/references/request-intake.md) through the [source skill](../../skills/qa-check/SKILL.md). Reading or copying the source bundle is not installed-host qualification.

## Attempts and independent review

| Slice | Actual evidence | Independent boundary |
| --- | --- | --- |
| Pure contract | Historical Sol6 first RED→9/9 retained with its original attribution. Sol6.1 self-review and a real 33-total-item regression produced final 16/16, no failures/skips. The extra total-item cap was removed; the accepted file/byte bounds remain. | [Initial NO-GO](../reviews/2026-10-05-qa-request-contract-task1-aqa.md), then [affected Astra GO](../reviews/2026-10-05-qa-request-contract-task1-aqa-fix1.md), 0 Critical / 0 Important / 0 Minor. |
| Real CLI/files | Sol6.1 actual initial RED0/9 and first9/9; subsequent limit controls and a separately reviewed large-Markdown regression retained. Corrected combined 30/30, no failures/skips, TAP23786.715625ms. JSON limits are not an invented independent Markdown cap. Saved-JSON-only recovery, uncertainty, conflict and immutable readback controls are included. | [Initial NO-GO](../reviews/2026-10-05-qa-request-cli-task2-aqa.md), then [affected Astra GO](../reviews/2026-10-05-qa-request-cli-task2-aqa-fix1.md), 0/0/0. |
| Discovery/portable bundle | Sol6.1 RED5pass/3fail of8; final combined38/38 and local root99/99, no failures/skips. A copied complete bundle executes using Node alone without child checkout/dependencies. Focused and root counts overlap and must not be summed. | [Task3 Astra GO](../reviews/2026-10-05-qa-request-discovery-task3-aqa.md), 0/0/0. |
| Fresh ordinary-language consumer | One fresh Sol6.1/medium actor, no command or assertion answer keys, synthetic no-doc full-scope request, no product execution. It discovered the source route, captured/read the unchanged wording, produced/read an honest report and left an actionable continuation. | [Independent fresh-consumer Astra GO](../reviews/2026-10-05-qa-request-fresh-consumer-aqa.md), 0/0/0, only this source-native capture/report boundary. |

The fresh consumer's actual interval was **08:39:02–08:42:04 UTC, 182 seconds**. It had two failed relative source reads during one wrong-cwd episode and corrected them without restarting. A truncated historical qualification tail was recorded as unused. Markdown opening returned queued, not confirmed displayed. Private original checkpoint/text remained byte-identical; raw outputs and generated private documents were not imported into tracked delivery. This is one constrained first use, not a speedup/reliability estimate, installed-host test or improvement in defect detection.

**Observable next-consumer benefit:** the ordinary request became a durable, exact ID/revision/digest and complete original-scope handoff, with remaining/unassessed work and concrete environment/capability/oracle gaps visible. A later authorized consumer can resume from those saved artifacts without guessing a latest request. A second consumer has not been run. No claim that the product was understood or checked follows from capture success.

## Exact identities — do not combine the two baselines

The local consumer observed root `6c54a1d798b15f9563ad1dabd5e93e324701ead0` plus the accepted Task3 source bytes, now committed locally at `6953e293d2d241a9f1d248abbe31ac94d5683c2e`. Its manifest SHA-256 was `ebcf1830cd50e10f57f3dfa13c823964e5d071e5bb0b4554f5bd132047177a27`; selected Console `014940a4a59cd9c6f51add59acde710cfdbaa1ba` / Kernel `847777a7a87c55a7648ac155da2e18d6593aa16a`. Local `qa-check/SKILL.md` SHA-256 was `5e41506d8c42cd10278292243cf84d7bf2b31e882ece10b61dde77be2f6965a1`. The consumer is not attributed to the separate public-base export below.

| Frozen shared helper/resource | SHA-256 |
| --- | --- |
| `request-contract.mjs` | `ec01b4054f5c5e0865ae7df0d7a3b71ad8f8d609f2c91976c0f703d395296aad` |
| `request.mjs` | `d8aa38a4ce4a80265be0e3cfa2c4bc3a9415fd61660cc5bdc590f02e83e18f96` |
| `references/request-intake.md` | `4710f1b17287eb8cd882637b06f1bb99ca03b7f5822c8255c89a1b10efb96b80` |

Separately prepared public-base candidate: branch `codex/b00-request-intake-20261005`, base `04f84555ba17bcc3d5c73b1a1410c9e08cb80562`, public manifest SHA-256 `a9b3e7bc578acde214f56e4a3284a9315e3a717456eaf47025d7325352d4f725`. Its restored Console is `b1afb011b90492d2048df6449cdd47ef8be33dcf`, Kernel `7dd9265f846676d925cc084f3dcd8d8883364613`; all four public pins verified. Shared files import only B00 changes, not unrelated local delegation paragraphs. Exported `qa-check/SKILL.md` SHA-256 is therefore `d5ea1823c5095e0c8f3007d9f8dc5160a934ebfffd301e3fcf3f2d9b3ac736d7`, not the consumer's local hash.

Actual Sol6.1 cold-target checks: source restore/verify exit0, focused38/38 (TAP24387.408709ms), public root95/95 (TAP35234.597584ms), no failures/skips; scoped whitespace clean. These are packaging/compatibility checks, not a second fresh actor, child runtime or live product acceptance. Tests ran on Node22.23.1/macOS POSIX; Windows/Linux hosted execution and exact Node22.12 were not established here.

The strict all-document-relative link diagnostic failed on plan line343: a blockquoted future SKILL instruction links `references/request-intake.md` relative to its intended skill context, not the plan directory. Separately, 37 active local links resolved. The failure is retained as a document-navigation limitation; **no all-links PASS**, duplicate alias, accepted-plan rewrite or rerun to hide it. Independent export AQA must decide its effect on publication. Preparation also retained an initial tool-only shell quoting error; no reconstructed first log replaces it.

At this dated checkpoint the public candidate is uncommitted and unpublished. Independent exact export review, commit/conflict checks, PR explicitly targeting `develop`, remote readback and fresh hosted CI are separate delivery gates; do not borrow earlier CI or infer them from this page. No new manifest, bundle or deferred ancestry is included.

## Remaining work

The next design slice connects the preserved request to grounded expectations, observation/hypothesis/knowledge, actual segment evidence, separate readiness/authority/result-strength and truthful outcome/coverage projections through existing owners. No initial documentation is required, and Q1/N01 semantic admission is not invented by this intake result. Managed request binding, full-scope reconciliation, no-doc QA quality, helper reuse, live execution, primary UI integration and complete universal acceptance remain open. The current canonical queue is projected separately by the integration owner; this dated qualification is not another queue.
