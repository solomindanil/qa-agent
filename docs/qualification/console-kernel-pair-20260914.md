# Console–Kernel M4 pair — reviewed, not active

14 September 2026. The pair reuses the existing Console; it does not add a runner,
change product permissions or upgrade an existing campaign. Active source pins
and installed skills remain unchanged until the separate root adoption step.

## Exact sources

| Component | Source |
| --- | --- |
| Kernel | `657894dbd61561a634f36669a0874dccccbea59e`, tree `4e57a5e0a21a3f5fc838295a75e06a94e13c4081`; [M4 source and qualification](kernel-admission-20260914.md) |
| Console | `1c715a1980dac52fb8ba1d267c8c8e2d97b406e8`, tree `f6fc0cc720008dde02891592f988a331ab24e289`, parent `ce80729994ec812dcf10b54910cde0bddf306e1a` |

Console [complete-history bundle](../../sources/candidates/console-m4-pair-1c715a1.bundle):
sole HEAD, SHA256 `044a018d6ff7de2e7f66ed6a1d03bdeea4f32a0039ed4f3ab3a0febba4d02415`.
This is inactive candidate delivery, not a second current manifest.

Only four files changed: embedded Kernel pin, three current README references,
and two test files. Existing previous11d rejection is retained; previous15a is
explicitly rejected too. Environment configuration confirms the exact pin but
cannot override it. Required exports, source integrity, workflows, authority and
permissions are unchanged. M2, corrected M3 and E1 runtime/reader/skills retain
their reviewed source bytes from ce80729.

## Verification

Two direct behavioral assertions were RED before updating the runtime: the new
657 pin was rejected and old15a was accepted. After the pin change the new SHA
is accepted and both prior SHAs are refused. The source-owned regression then
passed within the full selected authority group below.

| Fresh pair gate | Outcome |
| --- | --- |
| Seven authority/registration files | 121/121,72.641s |
| Four actual parity/I2/authored/portability consumers | 21/21,63.066s |
| Six E1/M3 files plus M2 browser finalization | 160/160,19.106s |
| Nonincremental source TypeScript / separate Vite build | exit0 / exit0 |
| Independent Lead AQA source review | APPROVED; exact new source preflight and actual previous15a checkout rejection checked |
| Cold delivery | Normal archive clone, exact SHA/tree, strict fsck, no alternates, clean;2/2 skill-reference controls and new/old pin authority checks without Console dependencies |

All three runtime groups had zero failures, skips and cancellations. These are
302 tool-test executions, not302 product tests or a full Console suite. They
used explicit clean Kernel657, an isolated real private TMPDIR and an `env -i`
environment. Owned loopback browser fixtures contacted no live product.

The build retains the566.95kB chunk warning. The tracked compiler cache remained
byte-identical: `47512f3084eab3b71cd21523997c62768d6f0885c7ae0fc24dc86bdeaa8e9c7b`.
The normal `tsc -b` script was deliberately not invoked because it modifies that
tracked artifact. Source typecheck and Vite build were executed separately;
this is not a claim that the cache-tracking maintenance issue was fixed.

The binary diff SHA256 is `bd3adfd62c2c8a67305fb318092596b0b473ac75a99e5725745948c8e66d3fae`.
Final reviewed file SHA256:

| Path | Hash |
| --- | --- |
| `server/kernel-authority.mjs` | `cda33c73705dd9a9ded122412119ba90b0b345ae862f4dd5b38e03536d5e0847` |
| `README.md` | `db375b4c59a720705487c75976756fb39b9c0aaec76b5eb99eb5661dfa21b008` |
| `tests/unit/kernel-fixture-authority.test.ts` | `a314957096357377a7214d86df3f715fa6def8911af2f3fdcd7a0b31de2eb9f1` |
| `tests/unit/managed-pack-portability.test.ts` | `bbfdb918df516b9101a282b37e7362dbbed7b90eff919baecc94f193b57f772f` |

Raw local log digests, not required replay dependencies:
authority `7b48b00bb4bfa355936b3023b1f71e7d6fd41b93863167c3757171947bc9415c`;
consumers `1d12120dc04d218a008e1725b7e6b7ac09c2336a37298b3248b6c91ff9c704d4`;
integration `8a4dc9c40b69f85782decef8253345a6177e885b9b42c04cb2ea4806b996735b`;
Vite `129527d1f6b0f1eea48c9987c49c1c548528051a0a558b7a43bff951273c37cd`.
Successful TypeScript output was empty. Independent review observations remain
in the task transcript; no standalone raw review log is claimed delivered.

## Portable replay and next step

Restore both exact source bundles into independent normal Git checkouts; install
their own lockfile dependencies separately, build Kernel, then supply the clean
Kernel path and exact SHA through `QA_STARTER_REPO` / `QA_STARTER_EXPECTED_SHA`.
Use an isolated real0700 TMPDIR and no inherited product/account environment.
Do not invoke Console's default `npm test`: it starts Playwright product projects.

All selected groups use `node --import tsx --test --test-concurrency=1`:

- Authority: `runtime-paths`, `portable-entrypoints`, `bridge-registration`,
  `registration-runtime`, `registration-http`, `registration-targets`,
  `kernel-fixture-authority`.
- Consumers: `registration-contract-parity`, `i2-registration-http`,
  `authored-fixture-authority`, `managed-pack-portability`.
- Integration: `campaign-plan-concurrency`, `qa-campaign-files-umask`,
  `public-input-campaign`, `campaign-receipt-ingestion`,
  `campaign-dependency-readback`, `qa-product-skill`, `campaign-browser-finalization`.

Each name above is `tests/unit/<name>.test.ts`. Existing supported Chromium is
required only for owned browser fixtures. Replay does not confer live permissions.

Next: review root source adoption using this pair and the already-reviewed
Freeland21c1c61, then cold restore/verify the complete root delivery. Preserve
old exact components and frozen product owners; installed skills, registrations,
credentials, payments, tracker state and product verdicts are not migrated.
M6 remains unconnected; real interrupted-campaign recovery and substantive
fresh-agent product use are still open milestones.
