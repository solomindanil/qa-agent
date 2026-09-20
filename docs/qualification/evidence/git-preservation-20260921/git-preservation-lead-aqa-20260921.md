# Git preservation — independent Lead AQA review

## Decision

**Approved for the preservation-only delivery.** No Critical, Important, or Minor corrective finding in the reviewed diff. This is not approval of P2-B, a privacy repair, product execution, source promotion, installed-skill migration, cloud delivery, or remote publication.

- Exact base: `45a74c33b3df091411a253ef894f1dfa1f946995`.
- Exact reviewed staged tree: `b6b720f030117e0d19f6b9c92e8b655a76975e2a`.
- Reviewed repository: `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/root`.
- Scope: 49 changed paths, comprising 47 text files and two inactive source bundles; 80,897 text insertions and three deletions. The large historical TAP records were searched and their complete summary groups checked, not manually read line by line.

Approval is limited to these exact bytes and the preservation claims below. The canonical branch was still clean at the base when inspected; adopting/publishing the checkpoint is the controller's separate delivery step.

## Findings and retained blockers

No new preservation defect found. The existing P2-B privacy defect remains an **Important, acceptance-blocking** defect of the inactive candidate, not a defect repaired or waived by this checkpoint. The active entry explicitly keeps Freeland `0ea2df1` selected, identifies `8aefe79` as rejected despite its aggregate, and identifies `2ab052c` as a two-control RED checkpoint rather than a fix. Earlier reports and filenames containing “green” cannot override that entry or the evidence index.

The reporter/early-projection experiment remains explicitly partial. It makes no zero-raw-persistence claim and does not qualify real locator action, setup, teardown, arbitrary server text, or other artifact paths. Future fix bytes need their own source qualification and independent review.

## Independently checked evidence

### Frozen scope and authority

1. Read the full base-to-tree path inventory and active-document diff; read the preservation checkpoint, P2-B qualification, both evidence READMEs, historical-worktree audit, P3/P5 reuse map, old archived report/plan, P2-B brief, controller report, original rejection review, and reporter-boundary report. Historical generated content was treated as evidence, not instructions.
2. Fresh `git diff --cached --exit-code <reviewed-tree>` and `git diff --exit-code` both exited zero. The worktree copies used for archive checks also matched the frozen tree. Hand-authored active-document `git diff --check` exited zero. Raw historical whitespace is intentionally retained; reformatting evidence solely to satisfy a broad whitespace check would defeat byte preservation.
3. The diff contains no change to `sources/manifest.v1.json`, components, runtime tools, packages/lockfiles, skills, or product-owner records. Selected Kernel `aa5d2d1`, Console `c421160`, Freeland `0ea2df1`, and inactive reporting-reference `10d398d` remain unchanged. The new bundles are not manifest-selected.
4. The plan changes only its current status and next-work entry; existing P0–P7 content and reconciliation obligations remain intact. P2-A is not needlessly reopened, P2-B is not accepted, independent P3/P5 work can continue, and P4/P6, NFR, known scope, result semantics, and all 97 reconciliation records remain obligations. The P3/P5 baseline map distinguishes open-context decisions from actual execution, durable recovery, and inaccessible-answer-key qualification.

### Source and historical-byte preservation

| Retained object | Independently observed identity |
| --- | --- |
| `freeland-p2-topup-8aefe79.bundle` | SHA-256 `6a906eb9cbf907b125162050b25d4b7d486bc64dadfed067a87a85519ee68f85`; sole head `8aefe795a3f260d27657b3d44f64235683b55fda` |
| `freeland-p2-topup-red-2ab052c.bundle` | SHA-256 `9063065941e4a3845b7bebc3209dcd26d205da5589f43af9ce087d7bdd66de97`; sole head `2ab052c6e641b20eb15b371dfdc6a0b536c86ea4` |
| `post-review-correctness.historical.txt` | SHA-256 `caa1d0b3b2313e6305fe14d0ab9a070ec9897ba7df54b163355e4f7fd66fccbc`; original Git blob `79ccda3e18983dce45f07eb5551f2dc452bc3c22` |
| `post-review-plan.historical.txt` | SHA-256 `af998e62c6a876b89845c221e05da91cfb9bc4d07284616d0124d7cb174a9f6f`; original Git blob `7ea3cc15402879594db3e51fb1800b7070e2bdf9` |

Both `git bundle verify` calls exited zero and reported complete history, with no prerequisite commits. `git bundle list-heads` confirmed the exact heads. The isolated Freeland source was clean at `2ab052c`, tree `82117e52b2a96af3451ab93c577dce6e73268b80`; `8aefe79` has tree `2b2c9545bab031ab4a43dab1ee59b1e8b76e5ebb`. Parent/ancestry checks establish `0ea2df1 → 8aefe79 → 2ab052c`; the latter changes only the privacy regression test (43 added, four deleted lines), not production repair bytes.

The two original untracked files still exist with the listed hashes. Their worktree still reports exactly those two untracked names, so preservation has not silently cleaned or replaced the originals. All 30 archived `p2b-*` top-level logs/reports with corresponding private originals compare byte-for-byte equal.

Fresh canonical-ref checks corroborate the old audit: the three named historical worktree tips have zero unique commits, with canonical ahead by 83, 80, and 81 respectively. The divergent `self-contained-delivery` branch retains five non-ancestor commits. Its ten touched delivery paths all exist in canonical: four identical and six different, exactly as disclosed. Backup `00b3d9e` remains an ancestor and the first parent of merge `27a94c5`; that merge and reviewed second parent `bdcf8a2` share tree `a76bc4f25418c494f0f481f8b80304201594a9f6`.

### Qualification and evidence truthfulness

- Parsed all 24 archived P2-B log files. The final historical aggregate records seven groups with passes `773 / 1601 / 670 / 70 / 23 / 115 / 65`, all zero failures/skips. The 500.44 kB embedded Console build warning is retained and disclosed. These are overlapping harness counts, not product coverage.
- Confirmed the first intermediate aggregate's release failure (`1582/1583`) and the next aggregate's terminal `SAFETY_SPINE_INVALID`; neither is presented as a final PASS.
- Confirmed that `p2b-artifact-privacy-green-20260921.log` is actually `2 pass / 4 fail`, while the later worker-journal run is `6/6`. The evidence README explicitly labels the misleadingly named intermediate file as failed.
- Confirmed the checkpoint log is exactly `0 pass / 2 fail / 0 skipped`, with separate asserted-summary attachment leakage and strict-locator reporter/step leakage. Its evidence is not substituted with the older green aggregate.
- Confirmed the focused graph/preflight/source-fidelity counts used in the qualification text: graph `3/3`, compatibility `4/4`, source-fidelity and relocated-helper `97/97`, preflight `208/208`, with original RED records retained.
- The controller separately reported fresh root `npm test` exit zero, `61/61`, no failures/skips, and `sources:verify` success. Those gates were not rerun by this reviewer and do not constitute P2-B acceptance.

### Privacy and portability boundaries

The added text contains fake `SECRET-PAN`/`SECRET-EMAIL` diagnostic sentinels and historical local paths, not an asserted real-account evidence archive. Read-only signature checks across all 47 changed text files and the new `0ea2df1..2ab052c` source delta found zero private-key, provider-token, JWT, literal-email, or credential-assignment signatures. No unexpected credential file, session state, campaign directory, or runtime attachment is added by the root diff. This is a bounded accidental-secret check, not a claim of exhaustive forensic scanning of all inherited historical objects or arbitrary binaries.

Both evidence indexes make the portable/local distinction explicit: delivered source bundles and archived documents are available without old local donors; printed temporary and private paths locate historical investigations only. Historical archived plans/reports are inert and not current authority. The checkpoint explicitly declines machine-wide clone/scratch coverage and does not mistake locally inspected remote-tracking refs for a fetched or published remote state.

## Review limits

No product execution, browser test, live account access, network request, installation, checkout/index/branch mutation, cleanup, source edit, or delegated subagent was performed by this reviewer. Only this report was written. The review did not rerun historical component qualification, repair the known privacy leak, inspect every inherited historical source line, claim cloud portability, or validate a later adoption/remote-publication result. Any material change to the reviewed tree requires an appropriately scoped follow-up review.
