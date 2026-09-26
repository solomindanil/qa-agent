# A1 — selected Kernel authority on legacy Console CLI routes

27 September 2026 (Bali). Bounded source qualification for the universal Starter lane, not product QA or migration of an existing campaign.

## Exact source and behavior

| Component | Previous → selected commit | Selected tree | Delivery |
| --- | --- | --- | --- |
| Console | `a8f66792f8053f125bf8ffc758f543f25a2b95a1` → `5634b7f456999a967cc64704c58f7d6e040f0e57` | `44dc31187f593a096fa9892fb566931bc5e44eeb` | [`console-a1-cli-authority-5634b7f.bundle`](../../sources/candidates/console-a1-cli-authority-5634b7f.bundle), 4,401,245 bytes, SHA-256 `a705556469669b9695ecb4cffd7d7a2b6b034076de9b6b04463709ebeef30fed` |
| Kernel | unchanged `ece24e865f7ea37cff32c24c7e3739c9d0059f81` | `c1d2b793a92fca024a025ec48b9f72157ce2f995` | Existing manifest-selected bundle |

Only Console `server/bridge.mjs` and its new `tests/unit/bridge-cli-authority.test.ts` changed. The bridge calls its existing `assertPinnedKernelRevision` before request preparation and again immediately before the sole `npx tsx src/cli.ts` spawn, using the same resolved Kernel checkout as `cwd`. The six shared routes are `validate`, `regenerate-preview`, `regenerate-apply`, `recover`, `adopt` and `init`. The second check covers source drift during asynchronous preparation; it does not lock the checkout after validation. No build or package installation was added.

Source rejection retains `500 {error}` with no CLI receipt; missing configuration remains `503 {code,error}`. The normal success and ordinary CLI-failure receipt contracts, mutex, timeout, temporary cleanup, registration and campaign routes are unchanged.

## First attempt, controls and review

- Before the production edit, four new focused controls failed **0/4**: the old bridge returned HTTP 200 where a source-authority refusal was required. This RED is retained, not converted into a product finding.
- The first production patch passed the focused **4/4**, but independent Astra AQA identified two **Important** test deficiencies: checking only that an init temporary directory was gone could miss preparation followed by cleanup; and a regressed negative control could delegate to native `npx`. The test was strengthened before adoption. No production redesign was needed.
- The final test instruments init preparation and adoption-target reads, refuses native Kernel CLI spawn in negative controls, compares recursive synthetic workspace bytes and seeded receipt-state bytes, and permits native execution only for the healthy exact Kernel fixture. Wrong actual commit and dirty tracked Kernel source each exercise all six routes with zero CLI spawn, zero init preparation, unchanged workspace and receipts. A deterministic mid-preparation edit is refused by the second guard and its temporary file is cleaned.
- The same bridge rejects a configured SHA that conflicts with its embedded pin, then heals and runs a real local synthetic `init` followed by read-only `validate`. Both receipts persist; validation reports `valid: true` and leaves workspace bytes unchanged. No product URL, account or live campaign is involved.
- Final Console focused test: **4/4**; existing registration and Kernel-fixture authority controls: **21/21**; combined scoped run: **25/25**, no failures/skips. Standalone no-emit test typecheck, `node --check server/bridge.mjs` and `git diff --check` exited 0. The coordinator independently reran the strengthened focused test **4/4**. Exact test command: `node --import tsx --test --test-concurrency=1 tests/unit/bridge-cli-authority.test.ts`, from the Console checkout with existing local dependencies. The adjacent controls used explicit `QA_STARTER_REPO` at the selected Kernel.
- Final independent Astra AQA: **GO, 0 Critical / 0 Important / 0 Minor** for this bounded patch. Astra source-reviewed but did not rerun the tests. Temporary removal of only the early guard was not mutation-tested; the explicit preparation counter is expected to detect it.

An expanded local run is **not green**: `bridge-artifacts.test.ts` produced 7 pass / 5 fail with `REGISTRATION_KERNEL_REVISION_MISMATCH` unhandled rejections. Those GET tests hardcode a historical Kernel checkout; source review traces a rejected registration `kernelPromise` outside the changed CLI callsites. This is a source-backed explanation, not a reproduced unchanged-baseline comparison or a repair in A1. No full Console or product-facing suite is claimed green.

## Delivery gate and limits

`git bundle verify` reports complete history and a sole `HEAD` at the selected Console commit. The manifest names its exact tree, bundle and SHA-256. `npm run sources:verify` accepted all four selected child sources with the new Console pin. The root `npm test` packaging gate passed **61/61**; it does not test a live product. A cold-clone readback of the root delivery is still pending at this source-record checkpoint.

This is selected tracked-source identity, not attestation of `node_modules`, `npx`/`tsx` resolution, generated build, an immutable filesystem or every possible external race after the final check. Existing campaigns keep their frozen owner/runtime; the 26 September release counts remain attributed to their old Console commit. No product, tracker, payment, cloud, installed-skill or production action was performed.
