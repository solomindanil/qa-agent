# Account-discovery A/B — independent AQA result

24 September 2026. This is a source-selected, open-context dialogue comparison, not a product run, installed-skill discovery result, or retained-account qualification. The AQA verdict below applies to the immutable first replies in [arm A](discovery-arm-a-first-answers.md) (SHA-256 `a60c9a1c318174b36427100a7aa124c7a6807c176cf5bc476c021d80eaa04318`) and [arm B](discovery-arm-b-first-answers.md) (SHA-256 `4c8f49776bed6465b3b1df1f7b84d9f7710e2a7548d584853688f3a7df13504e`). Those answer files were read, not edited. No reviewer correction or second attempt is substituted for a first answer.

## Frozen inputs and source attribution

| Input | Exact identity |
| --- | --- |
| Arm A baseline root | `8f40e6eb98abbea8d11cad01f13482c6ec91c02f`; `skills/README.md` SHA-256 `34f7312db9f22f0618da3e9fc728ef223b7df05dd96cceb9fe93b15d6844bbfb`; `skills/qa-check/SKILL.md` SHA-256 `6055cb4422e134e2c40e8fe9a757f3a0282994855b4fd8b6e06a505096476a37` |
| Arm B index/router treatment | `ee04085c2c400bf3809b657f64be7f33a6df311c`; `skills/README.md` SHA-256 `e1d7b2becb4f8f662b5a2585123ec2740d879b02e10cb382aa15bb79779d550d`; `skills/qa-check/SKILL.md` SHA-256 `c79b35c38838d92ee5dcfcfe1d257ad8f16a32682220056583212ed64e4649b5` |
| Controlled case/key pair | [Discovery cases](../account-discovery-cases.md) SHA-256 `6f89add9f11f082b47ca17b1bd5af3b738d0127a6bc5be438b239fc8d9305032`; [pre-actor rubric](../account-discovery-rubric.md) SHA-256 `6abc0650ac034da4d1c47b31196ed8053eed3017325755596508330723c91eb1` |

`git diff` between the two root revisions changes only `skills/README.md` and `skills/qa-check/SKILL.md` (13 inserted lines). Both arms used the same manifest-selected Freeland source `0ea2df10f1b6d613e01d50011c269ca0fa999877` and the same synthetic owner context. The actual campaign owner and frozen runtime were not replaced by either root source revision.

## First-answer semantic review

| Case | Arm A | Arm B | Decisive comparison |
| --- | --- | --- | --- |
| D1 — existing VPN role | **Inadequate** | **Adequate** | A identified A3B and deferred readiness but did not sufficiently expose the all-configured-role interface/effect/readiness contract. B identified `qa:pool status`, all configured roles, UI login, product GETs and private readback, required current candidate and role invariants, and kept public VPN analysis independent. This is a bounded D1 semantic improvement, not a ready account. |
| D2 — disposable signup and later handoff | **Inadequate** | **Inadequate** | B correctly rejected a retained-access promise, named the disposable controlled-email/shadow boundary, and did not equate inbox deletion with product-user retirement. It still omitted the separate private fresh-accounts helper, Mail.tm token/poll steps, explicit provider DELETE **204**, and the account-cardinality readback gap. A likewise did not supply a complete interface/effect/lifecycle route. |

**AQA semantic gate: NO-GO.** Treatment did not reach the predeclared 2/2 adequate threshold; D1 improvement cannot compensate for D2. Do not mark I06a.2–.4 or W7 dialogue discovery accepted from this sample. The first-answer texts proposed no live product/provider execution and kept dependent readiness unresolved, which supports only a textual safety observation. No account, mail, browser login, tracker or product action was executed, so operational safety, working access and retained resume remain untested.

## Measurement and test limits

The predeclared inspection-efficiency gate cannot be scored: both arms were not adequate on both cases, and raw actor tool transcripts are unavailable for independently counting distinct content-bearing source paths. The first-answer files preserve actor-reported command/path summaries only; they are not a measured `B_D1/B_D2/T_D1/T_D2` denominator, so no per-case non-increase, ≥2-file or ≥25% claim follows. Actors were requested as Codex `gpt-6-sol`/medium in separate fresh source-selected contexts; effective model, total elapsed time, tokens and monetary cost are `unknown`, not zero. Tool-call totals are actor-reported approximations, not independently verified telemetry. Prompt withholding in a shared workspace is open-context, not enforced blind isolation.

The local source gate establishes the selected child bytes (`npm run sources:verify` exited 0) and the root copied-bundle check passed 5/5 (`node --test tests/generic-skill-bundles.test.mjs`) during candidate authoring. These are packaging/source checks, not semantic or live-product acceptance; no installed host, child product suite, campaign, provider or tracker qualification is inferred. This review preserves the failed first attempts and leaves any revised design or new trial to a separate reviewed step.
