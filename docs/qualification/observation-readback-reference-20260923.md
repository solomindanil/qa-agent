# Observation readback reference — 23 September 2026

## Scope and identity

Console `a94571175ca893a5a66eafb5c3d06801238ad04d` is a documentation-only successor to `8065713fba11446e32ec2f76832d65110550989b`. Exactly two mirrored paths changed: `skills/qa-product-v0/references/agent-observations.md` and `.claude/skills/qa-product-v0/references/agent-observations.md`. Each has SHA-256 `3c0b17486afa1bde5d5cf1ac2f2bd1945496666dbb71153691325e67797a63c8`. Runtime code, schemas, tests, Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`, permissions and installed host skills were not changed.

The reference now distinguishes the verified readback already returned by `record-observation` from a separate `read-observation` call by a fresh actor or recovery path. `observations` remains the full target-scope reader. An interrupted artifact-only pair still requires an identical-envelope retry, not a new ID or a forged result. The record remains caller-authored/unattested; it cannot establish browser invocation, capture time, deployed identity, managed coverage or a release verdict.

## Reference RED/GREEN and checks

- A fresh reader of the prior reference called an immediate `read-observation` mandatory after a successful `record-observation`, then `observations` for scope. This was the measured redundant-caller behavior, not a runtime failure.
- A separate fresh reader of the revised reference used the writer's returned readback, selected `observations` for remaining scope, and reserved `read-observation` for a new actor/process or recovery. Both readers retained the unattested/product-verdict limits. One reader per version is a bounded usability check, not a statistical agent-reliability claim.
- Existing mirrored-skill bundle and linked-reference tests: 2/2 passed. `git diff --check` passed before the component commit. The source text was checked against the actual Console output projection and Kernel writer, which calls the reader and returns its readback.
- `quick_validate.py` could not start because host Python lacks PyYAML (`ModuleNotFoundError: yaml`). No dependency was installed; that validator is not claimed green.
- Updated manifest-selected source verification passed for all four exact component IDs. Root packaging tests: 61/61 passed, zero failures/skips, in 40.84 seconds. These are source checks, not product QA.
- Independent read-only AQA source review returned GO with no actionable findings. It checked the two mirrored reference bytes, actual CLI/Kernel readback behavior and manifest/bundle identity. The reviewer did not rerun the reported tests; the test counts above are coordinator-executed evidence.

## Delivery and remaining boundary

The complete-history Console bundle is `sources/candidates/console-observation-readback-a945711.bundle`, SHA-256 `dd8a4f345410b57c0b6369fec30785e9e9949d4b249240f276e4847a75865e16`; its advertised tip is the exact selected commit and its tree is `e955cac8352ec311e3aabe6e4a2eaba48a4b6441`. The prior API-oracle qualification retains its own source attribution. Existing campaigns retain frozen owner runtimes.

After root commit `4dcc43b`, an independent `git clone --no-local` restored all four bundled components and passed a second `sources:verify`. Its root packaging gate passed 61/61 with zero failures/skips in 41.26 seconds; the cold root and restored Console remained clean. This verifies portable source bytes, not an installed host skill or product behavior.

The W2b diagnostic that motivated this change measured a 12.09–15.04-second separate CLI read of the same local API fixture, while direct Kernel read took about 1.61 seconds. Three repeated checkout-authority checks accounted for most of that CLI gap and were not weakened. The broader paired trial timed out in Console bridge; browser/MCP measurement and live remaining-only W1 are still open. This reference correction does not complete W2b, install skills, execute a product, update a tracker, or authorize cloud use.
