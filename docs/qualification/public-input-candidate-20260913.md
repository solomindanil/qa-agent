# E1 — public search and filter input

13 September 2026. **LOCALLY VERIFIED / INDEPENDENT REVIEW PENDING / NOT ACTIVE.**
This is a bounded extension of the existing Console campaign pipeline, not a new
runner or product acceptance. Active source pins, installed skills and campaigns
are unchanged. The independent reviewer host remains unavailable; this report is
not an approval and does not close the fresh-agent stage of the global plan.

## Exact source

- Base Console: `b474d52fb6b8b2d13fe362a3f551f8ef6b6ee17a` (inactive M3).
- Candidate: `00e410253d59d4f913eaf290c4abaa6bd0605446`.
- Tree: `3fc9bbb45062ab132c0a09e0de581270003c28aa`.
- [Complete-history archive](../../sources/candidates/console-public-input-00e4102.bundle), sole HEAD.
- Archive SHA256: `1d08b598cd6f40ba5f79792dd3cfd7b0109f90df3420672025ec2989eb16591e`.

Seven files changed. No dependency, Kernel pin, registration, permission or
classifier was added or changed.

| Console path | SHA256 |
| --- | --- |
| `src/lib/qa-campaign-v0.ts` | `64468e5e9f23f4be64e59b798fd0b5989d2f56f6514a063fb7310eaf1ebcd725` |
| `src/node/playwright-campaign-adapter.ts` | `305fd7a3ed0d9410021a93c99d23f0e0438c954b9d870a402380e74e537b32e1` |
| `src/node/qa-campaign-runner.ts` | `b04dec27eeec6acf4c22639682bebaafabaa041830524894abcc13de7e881707` |
| `tests/unit/public-input-campaign.test.ts` | `71f76c0b9d5452cb2cb2c2e8e3da7cb0dbfe8235395df1c949d70bad438001e9` |
| `tests/unit/qa-campaign-v0.test.ts` | `e3111201c86959ea26e7148222deb1868fdbd6ba80191d85cdcd1dcc82e2eb48` |
| `tests/unit/qa-campaign-runner.test.ts` | `14fe2156d058d01f3d240329fa1b5526fb65ef8ca5fc9640696a2893cd547b61` |
| `README.md` | `ce277961d6c4313cb46305d312db1068cc015679956d4e71d61f773927e43f7a` |

## Practical change and decision boundary

Previously `fill`/`select` required environment references, while public catalog
closure correctly refused secret-bearing checks. Ordinary public input therefore
could not pass through this pipeline. Existing operations now also accept
`value: { kind: "literal", value: "apple" }`: exact public text up to4096 UTF-16
code units, including empty values for clearing. Whitespace is preserved; no
interpolation, environment expansion or evaluation occurs. Existing environment
objects retain their exact parsed bytes and secret capability restrictions.

Public literals are a declaration of nonsensitive test data, not a secret detector.
Do not place credentials in a public plan. The extension grants no authentication,
checkout, POST or mutation authority. Catalog/oracle/graph/side-effect and origin
checks remain. Screenshot masking and existing redaction paths are reused.

The owned browser fixture models a three-item public catalog. One identical plan
exercises substring search, no-match results, clearing and category filtering
against fixed and deliberately broken implementations. Correct behavior produces
PASS. Broken search produces exact repeated count differences and `needs_review`
with `INCONCLUSIVE`; its independent healthy filter still passes. This is the
existing QA-01 agent-first boundary: repeated failures alone do not diagnose their
cause or create a bug ticket. Original attempt evidence and immutable receipt are
read back; no synthetic product verdict replaces them.

This is a catalog-bound local mechanism qualification, not a blind unfamiliar
product exercise, live product QA, an end-to-end regression publication proof or
the demonstration that a fresh agent can select the correct checks unaided.

## Verification and unsuccessful attempts

1. Schema/closure RED failed2/2; actual pipeline fixture RED failed2/2 because the
   old source rejected public input. These were real missing-capability failures.
2. The first fixture wrongly expected automatic PRODUCT_FAIL/dossiers. Source
   inspection and preserved receipts showed the intentional QA-01 policy;
   corrected only the fixture to demand the actual count failures, retained
   attempts, `needs_review` and zero automatic dossiers. Classifier unchanged.
3. Another new fixture expected environment failure for a forbidden POST. The
   established exact result is `harness_failure/read_only_side_effect_blocked`;
   its server received no POST. Corrected that test expectation, not the guard.
4. Focused schema/browser qualification passed33/33. Expanded adapter, runner,
   dependency, finalization and plan-write controls passed181/181. A separate
   CLI/knowledge/observation gate passed81/81 with a clean restored Kernel
   `15a067c9a694de26460102ce5dadb9707c7977b1`, its own lockfile dependencies and
   explicit paths. Both sets have zero failures/skips/cancellations:262 tool
   checks, not262 product tests or the entire Console unit suite.
5. TypeScript, targeted ESLint for the three changed source files and Vite build
   exited0. Full ESLint still exits1 on the three existing unused bindings in
   unchanged `src/lib/qa-agent-review-v0.ts`; these are not hidden or fixed by E1.
   The existing Vite large-chunk warning remains. No tracked build cache changed.
6. A second normal clone restored the exact commit/tree and passed full Git
   integrity verification. With its own freshly installed296 lockfile packages,
   it passed33/33 schema/real-browser controls, zero failures/skips/cancellations,
   and remained clean. No donor node_modules or old product workspace was needed.
   The host's existing Chromium was reused; this does not prove another OS/host.

## Portable replay

Clone the delivered archive into a new ordinary directory. Provision that clone's
own dependencies with `npm ci --ignore-scripts --no-audit --no-fund`. Use Node22
and an already provisioned supported Chromium; no credentials or live product
environment are needed for these owned loopback controls:

```sh
node --import tsx --test --test-concurrency=2 tests/unit/qa-campaign-v0.test.ts tests/unit/public-input-campaign.test.ts tests/unit/qa-campaign-runner.test.ts tests/unit/playwright-campaign-adapter.test.ts tests/unit/campaign-browser-finalization.test.ts tests/unit/campaign-dependency-adapter.test.ts tests/unit/campaign-plan-concurrency.test.ts tests/unit/qa-campaign-files-umask.test.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node node_modules/eslint/bin/eslint.js src/lib/qa-campaign-v0.ts src/node/playwright-campaign-adapter.ts src/node/qa-campaign-runner.ts
node node_modules/vite/bin/vite.js build
```

For the additional81 checks, restore the manifest's Kernel15a067c in its own
directory, provision/build it, and supply its absolute `QA_STARTER_REPO` plus exact
`QA_STARTER_EXPECTED_SHA`. Use a fresh private `TMPDIR`, `TSX_DISABLE_CACHE=1`, and
no inherited product/auth/loader variables. Run these files with the same Node
test command and concurrency2:

```text
tests/unit/qa-campaign-cli.test.ts
tests/unit/campaign-dependency-cli.test.ts
tests/unit/nuanu-authored-revision.test.ts
tests/unit/public-auth-authored-revision.test.ts
tests/unit/qa-campaign-vertical.test.ts
tests/unit/campaign-observation.test.ts
```

## Remaining acceptance

Independent Lead AQA/code review and a fresh-agent reference exercise remain open.
The unchanged source skill `qa-product-v0/references/declarative-campaign.md`
still describes the old input restriction; update and test that reference before
adoption, including public search vs credential distinction and agent diagnosis
of `needs_review`. `writing-skills` requires a fresh behavioral/retrieval baseline;
review-host unavailability is not permission to skip it or install untested skills.
The candidate README explicitly warns about this pending source-reference work.

Then qualify a fresh authorized consumer on a substantive unfamiliar product,
including source-grounded expectations, mixed outcomes, durable continuation and
the agent's explanation. Source tests cannot substitute for that acceptance.

Retained log SHA256: schema RED `75912d3cff4ccd30611849bbb4ad42c9e94fd7938c0c1786a77f0991f8a9fa57`;
runtime RED `0022afc8b6a11e52a8c4b0347dedfbf57bbe8de7c3bda1fc9e2bf70fc12d7707`;
181-test gate `99555532a2a6f47ae5eb28eb43fed635efc7a349e0962ac3b6eb8f4252f9ded1`;
81-test gate `09765822a035880241f0a3a66207455a4fe56e31701b4663d99c8ba3995ea9c5`;
cold33-test replay `42c38e0a38936214dca039a947c6358d8c237d21532424cd905027c918ab528f`.
