# M4 Kernel conditional write — not accepted

Historical candidate. The approved namespace correction is now implemented in
the [14 September successor](kernel-admission-20260914.md); see that record for
current qualification and delivery. Failures below retain their original source
attribution and are not rewritten as passing results.

13 September2026. The isolated repair is based on Kernel
`15a067c9a694de26460102ce5dadb9707c7977b1`. Its implementation is still uncommitted,
not archived as an accepted source, and not selected by the manifest. No product
or existing campaign was changed. This page records measured failures as well as
passes; it is not an adoption recommendation.

## Full gate and timeout investigation

The frozen candidate completed the unfiltered Vitest suite on Node22.23.1:
**1719 passed, 1 failed, 0 skipped**, across41 files; duration2211.26seconds.
The failure was the existing registration/service test
`resumes PUBLISHING over a safe prior-authority workspace so the replacement can republish`,
which exceeded its120-second limit. Typecheck preceding this run passed. The
chained build did not run because the test command exited1.
An explicitly separate build on the unchanged candidate later exited0; this
does not change the full test gate's failure.

The identical test was then run sequentially, without another heavy test gate:

| Source | Exact selected case | Other cases |
| --- | --- | --- |
| Clean15a067c | PASS in100660ms | 13 excluded by name filter |
| Frozen M4 candidate | PASS in101339ms | 13 excluded by name filter |

The test file is unchanged, SHA256
`1cc8391829ffcb401c2f19e0a00ed2833cf617c288cdb5946e371492ccf26b3b`.
One pair does not establish a performance distribution or explain the earlier
timeout. It shows the exact functional scenario succeeds in both isolated
replays. Do not raise the timeout blindly, erase the failed full run, or relabel
these filtered repeats as a green full gate.

## New correctness counterexample: filesystem aliases

The M4 admission key hashes the textual full relative path. On the tested
case-insensitive filesystem, `state.json` and `STATE.json` refer to one physical
file but produce different admission keys. Two concurrent calls reached native
rename from one expected digest, both returned successful receipts, and the
second overwrote the first. This is a public writer boundary failure, not a
demonstrated corruption of a live registration or product.

The [portable diagnostic](../../evals/private-writer-alias/README.md) reproduces
the case with the real writer and filesystem. It failed for the intended
one-winner assertion on the candidate, and separately on the delivered clean
15a067c baseline. Thus the existing flaw is **not completely repaired** by M4.
Both probes retain only newly allocated temporary fixtures; no source or user
state is rewritten. An ASCII case-sensitive host must report this fixture as
not applicable, not passing.

Candidate byte identities during all these observations:

| File | SHA256 |
| --- | --- |
| `src/kernel/private-store.ts` | `48e4a4fa7bfc4df1a71f105d403bac8077b4ead7ebd8883facaf03cd9b5fef5d` |
| `tests/kernel/private-store.test.ts` | `459e77130f2e4525aa198eeb676f64363a84eff510694a307450922b8f120925` |
| `tests/kernel/private-store-concurrency.test.ts` | `bd34eef4f62cf7a70b33ecbd247792fa1416ad98b5fea4f5b74e7d88634b3074` |
| `tests/fixtures/private-store-writer.mjs` | `24da828a4e29eac82b11570d2e74545983040546e4ed2cd6684964b0f282be9d` |

Raw private log identities (not needed to reproduce the supplied diagnostic):

- Full gate: `da53d16f9b7fdc1cd83b8b1d5bf89a2cea75997b3f4acb8e4a6257264adf45dd`.
- Baseline timeout-case replay: `366cb3258d72364aeb49ec982d78e49316b1375464e0924d4eb1a72a6a46a7ff`.
- Candidate timeout-case replay: `eae210772498c77c0c5a06a6cebcdbbf67d2ea779f6d035038dfc3e56d3d4c27`.
- Portable candidate alias reproduction: `a76f74d215dd0d8813411747416a25bf084d122e58e96778e285ce0cd28c5803`.
- Portable baseline alias reproduction: `c24ddbe7abf3ebaac9d1b98d044422c4709f736b3570082a6f27fffa1b1e459e`.
- Separate candidate build: `0f2d9eeb6484ef8b78bf32dcc7e3a6ed7836504f0ead975edbe4cbad1f4d0955`.

## Namespace pre-review — compatibility finding, not an implementation

Independent Lead AQA inspected the proposed per-parent admission directory
against the actual consumer grammar. An adjacent directory is not a drop-in
replacement for the current flat admission lock files:

- `workspace-validator.ts:2676–2684,2918–2950` admits only known private data
  directory roots; a new central directory under `.qa-private` is not currently
  recognized either.
- `registration-store.ts:748–750,2853–2861,4562–4566` rejects unknown member/job
  entries, including an empty admission directory left after release.
- `discovery-run-service.ts:1132–1161` and the workspace validator enforce exact
  run/evidence file layouts. Transactions likewise have their own exact grammar;
  they are not a free place for new writer metadata.
- `registration-service.ts:481–510` uses those workspace checks during recovery
  and after publication, so the issue can affect real consumers, not only an
  optional diagnostic.
- `private-store.ts:535–551` currently reserves no admission subtree/name for
  internal use. Any added namespace needs an explicit boundary against ordinary
  public writer targets and foreign entries.

These are code-level compatibility findings, independently checked against the
unchanged candidate. No new directory/probe was created and no runtime failure
is claimed for an unimplemented design. The earlier raw alias counterexample
remains the measured writer defect.

## Next action — revise the namespace design before implementation

The owner has been asked to agree the bounded namespace correction: a private
admission directory per canonical physical parent, with the original target
filename as its leaf, so the filesystem's own alias semantics arbitrate one
target. Different target files must remain independent. The pre-review above
shows that this original proposal is insufficient without a deliberate reserved
metadata layout and narrowly matched consumer validation. Do not implement it
as an adjacent directory merely on the basis of the earlier short proposal.

Prefer reusing the existing private store with one explicitly reserved admission
area and validation of its exact metadata, rather than scattering extra entries
into member/job/evidence directories. Exact placement, reservation and retained
residue behavior still require agreement. This is design guidance, not accepted
source or a new storage service. Automatic directory deletion is not a remedy:
it cannot make live or interrupted metadata valid and adds shared cleanup races.

Required controls include real case aliases, distinct targets, same basenames
under separate parents, foreign/symlink/unsafe metadata, and all existing
interruption/rename/readback cases. Add consumer validation with admission held,
released and retained after interruption, including private-root/member/job/
run/evidence/journal consumers and reserved-name collisions. Preserve higher registration/discovery fences
and unknown outcomes. Requalify affected consumers on the final source, then
independent Lead AQA review and cold delivery. Review capability has resumed, but
this namespace correction is not yet implemented or independently accepted.
Self-review is not independent acceptance. Do not adopt this candidate merely
because its1719 other tests passed.
