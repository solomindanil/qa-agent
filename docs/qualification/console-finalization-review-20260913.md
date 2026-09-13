# M2 — final browser failures cannot retain an earlier PASS

13 September 2026. **Scoped repair reviewed and qualified; inactive source candidate.**
The active Console pin and existing campaigns have not changed. This is a harness
repair, not a product QA verdict or proof that every browser boundary is safe.

## Reproduction and cause

On canonical Console `b392e888bc8bfc98a756ba7e971a86000d6f2098`, a real Chromium
check navigated to an owned loopback page and passed its Dashboard-heading
assertion. A test-only wrapper then awaited a real same-origin POST during page
closure. The existing guard aborted it; the server received **zero POSTs**. Yet
the returned adapter result, saved `trace.json`, runner `result.json` and final
`receipt.json` retained **PASS**. A separately injected rejection after real page
closure also retained PASS. Neither case used a fake browser, fake guard or fake
receipt writer.

Both failures occurred without dependency metadata. The same two checks with a
valid, unused registered-origin scope correctly failed. Initial matrix: **4 pass,
2 fail**, with the two failures specifically `pass` versus `harness_failure`.
The 115 existing adapter/dependency/runner controls had all passed before repair.
Thus an old green suite did not cover this finalization defect.

Cause: `execute()` returned a tentative result before resource closure. Final
guard/closure reconciliation lived inside optional dependency-summary creation.
The repair keeps summary creation conditional but reconciles final flags for all
browser checks. Existing failure precedence and the unscoped `origin_escape`
code remain intact. No access rules, schemas, runner or product behavior changed.

## Delivered source and review

- Base: `b392e888bc8bfc98a756ba7e971a86000d6f2098`.
- Candidate: `dc8eb59dfeb2b5231617379096e945f0ccfc09da`.
- Tree: `b2b9d32c0a4e27b930d7e1053772440cfa335015`.
- Bundle: [console-finalization-dc8eb59.bundle](../../sources/candidates/console-finalization-dc8eb59.bundle).
- Bundle SHA256: `cd6c4b97baa5c5f19f0942c857eb6338f6ba283e969ceeb4b8b4c682a75961c4`.

Only two component files changed:

| File | SHA256 |
| --- | --- |
| `src/node/playwright-campaign-adapter.ts` | `29bce8ff41586c0b02c1604375df4baec7a8bbea007db6c8da514a2bca809b99` |
| `tests/unit/campaign-browser-finalization.test.ts` | `c9127b8483c917398ee2311bc7b789e116ab6d31f86b0bc2024c3caf2889774a` |

Independent Lead AQA reviewed these exact bytes and the RED/GREEN logs: APPROVED,
no material findings. The review checked real browser/guard use, completed
assertions and closure witnesses, zero mutation hits, all persisted outcomes,
artifact hashes, read-only run directory, no false product dossier and preserved
dependency-summary behavior. Reviewer did not claim an additional runtime run.

An independent clone from the delivered bundle recovered this exact commit/tree,
passed `git fsck --full` and remained clean. Its two changed-file hashes match the
reviewed bytes; it has neither an alternates object store nor installed dependencies.
This proves source restoration without an author's checkout, not browser execution
on another host. The regression runs above used the separate provisioned repair clone.

Root packaging was rerun: **57/57**, no failures/skips/cancellations. Fresh
`sources:verify` passed with all four manifest identities unchanged. Packaging
tests cover the distribution, not additional product checks or candidate activation.
The additional whole-delivery review was initially interrupted by a host usage
limit. Its late completion returned **APPROVED** for this exact dc8eb59 delivery:
source/archive/cold-clone identities, retained log hashes and bounded claims were
checked. This completes the earlier review task; it is not a fresh runtime rerun,
an E1 approval or active adoption. The completed Lead AQA code/regression review
above retains its exact source attribution.

## Verification and replay

Node22.23.1, npm10.9.8, dependencies installed from this candidate's unchanged
lockfile with `npm ci --ignore-scripts --no-audit --no-fund` in its independent
clone. Existing host Chromium was used; no browser installation. Owned loopback
HTTP and temporary fixture state only; no Kernel, product, credentials or old
repository are required by the four-file gate below.

After repair: new matrix **6/6**; fresh combined gate **121/121**, no failures,
skips or cancellations. This includes the 115 existing controls plus six new ones;
these counts must not be added together as independent coverage. TypeScript,
targeted lint, Vite build and diff-check exited0. Vite retained its existing
large-chunk warning (566.85kB). No dependency or warning threshold was changed.

In an independent clone of the delivered bundle with its own dependencies and
Chromium provisioned, run:

```sh
node --import tsx --test tests/unit/playwright-campaign-adapter.test.ts tests/unit/campaign-dependency-adapter.test.ts tests/unit/qa-campaign-runner.test.ts tests/unit/campaign-browser-finalization.test.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
node node_modules/eslint/bin/eslint.js src/node/playwright-campaign-adapter.ts
node node_modules/vite/bin/vite.js build
git diff --check
```

The existing package's TypeScript build mode can rewrite tracked compiler cache.
The commands above check the same source configuration without build mode and do
not change that cache. An initial attempt to combine `tsc -b` with an external
`--tsBuildInfoFile` was rejected with TS5094; it is not counted as a passing check.
Full Console unit, live E2E, dual-host and cloud qualification were not performed.
The new regression prints retained local fixture-evidence paths for diagnosis;
they are generated outputs, not source dependencies.

Raw logs remain private; these hashes preserve attribution, not proof on a new
host. The reproducible tests themselves are delivered in the source bundle:

- Baseline115: `250ce06cdf8605de1432952e7e60d4fc6c5ca730a085eeb5c12af4dfc9bfa1e2`.
- RED4/6: `d303f84e1ca5d9a9c72981f943caaf781edd17c0823c0c0fd750c7b829f14b08`.
- GREEN6/6: `5331817a8bccbb27f82000380b042825579f411e8d9f5b7c9ac1b7a7856dd159`.
- Final121: `0ea6ef8c626f76b20d8cea7cc7f7519d584d82d18bd325c469583f813e0f3d06`.
- Root packaging57: `542b6ae943a55c3ad1c82dca71cd02ee7e25003be4fe04a7ba24a898a1817f0c`.

## Continuation

Next is M3: reproduce Console conditional-write lost updates with independent
processes, then qualify one winner and a typed conflict at the owning writer.
M4 Kernel conditional writes, M5 graph parser and reviewed source adoption remain
separate. M2 does not close worker admission, arbitrary transport, crash recovery
or manual receipt gaps. Do not use an inactive repair as evidence that today's
active Console has already been updated.

No staging request, product change, purchase, tracker/Buzz write, installed-skill
update, active pin adoption or remote push occurred in this repair.
