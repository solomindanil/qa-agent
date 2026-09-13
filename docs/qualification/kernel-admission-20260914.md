# M4 reserved writer admission — source reviewed, not active

14 September 2026. This is the successor to the [rejected M4 candidate](kernel-write-candidate-20260913.md),
based on Kernel `15a067c9a694de26460102ce5dadb9707c7977b1`.
Active manifest, installed skills, existing registrations and campaign runtimes
remain unchanged. No product, tracker, payment, deployment or cloud action is
part of this repair. Reviewed source: **657894dbd61561a634f36669a0874dccccbea59e**,
tree `4e57a5e0a21a3f5fc838295a75e06a94e13c4081`.
The [complete-history archive](../../sources/candidates/kernel-admission-657894d.bundle)
has sole HEAD and SHA256
`84c443bf1bb0ed715b96989cc71906ea04652ab7d0a840529d7a351110e10de7`.
It is an inactive reviewed source, not a replacement for the active manifest.

## Implemented boundary

The existing `writePrivateFileAtomic` now arbitrates cooperative publishers in
one reserved private namespace:

```text
.qa-private/.write-admission/<sha256(canonical relative parent)>/<native target leaf>
```

Original leaf names let the native filesystem arbitrate basename aliases such
as `state.json` / `STATE.json`. Different targets, and equal basenames under
different parents, remain independent. Directories are private0700; the exclusive
no-follow admission file is regular, single-linked0600. Cross-device target and
admission directories are refused. Root/parent/admission identities are checked
through publication and exact readback. Admission ownership is retained on
unknown publication or process death, not silently stolen by a retry.

The exact metadata records target, expected absence/digest and successor digest,
not payload or secrets. Narrow I0/I1 validation recognizes only its actual
layout and canonical record. Empty reserved parent buckets and well-formed
retained admissions are valid metadata, **not completion evidence**. Public
writer/directory APIs cannot enter the reserved area; actual long-s Unicode
aliasing is covered. Member/job/run/evidence grammars and their authority remain
unchanged. No broad private-root allowlist was added.

Optimistic checks and staging remain outside admission for compatibility with
existing derived-cache repair. The authoritative expected-state comparison is
repeated after acquiring admission, immediately before publication. A rejected
BUSY contender removes only its own unpublished temp after checking original
device/inode, single-link0600 regular type, exact bytes and root/parent binding;
it fsyncs the parent before returning a clean BUSY without recovery residue.
Changed or uncertain entries are retained/reported, never treated as cleanup
success. Existing admission metadata is not removed by this path.

## Counterexamples retained, not hidden by later green tests

- Initial full-path hash admitted two writers for native basename aliases.
- A proposed adjacent directory broke strict consumer grammar; the implemented
  reserved namespace is validated separately instead.
- A lowercase-only reservation missed native `.write-admiſſion`.
- Legal `{digest,state}` input order produced metadata its reader rejected;
  expected-state capture is now normalized without changing the caller contract.
- Late admission initially left a losing temp in a strict discovery directory.
  Early admission removed that residue but broke two unchanged registration
  cache-repair cases (clean baseline2/2 passed, early variant0/2). Final late
  admission plus verified owned-temp cleanup satisfies both tested boundaries.
- The old unfiltered gate remains **1719 passed / 1 timeout** on earlier bytes.
  Its isolated baseline/candidate replays do not make that gate green. An
  intermediate compatibility run with the early variant was deliberately stopped
  after its two confirmed regressions; it is not counted as a completed gate.

## Fresh bounded results

| Gate | Result and attribution |
| --- | --- |
| Writer/control files | 55/55, no failed/skipped; final inode-only negative uses identical bytes |
| Actual admission consumers | 10/10, no failed/skipped: I0/I1, index/member/job/discovery, held/released/retained metadata, contention without orphan evidence |
| Original session-cache repair regressions | 2/2;54 other cases excluded by name filter, not assessed in this invocation |
| Typecheck | exit0 on unchanged runtime/consumer bytes |
| Build / diff check | exit0 |
| Independent Lead AQA source review | APPROVED on exact seven-file identities below; separate55 controls, final strengthened3 controls,4 cache-repair cases,1 discovery case and4 cleanup-failure probes |
| Five-file compatibility | 244/244, no failed/skipped,337.27s: workspace96, registration-store56, registration-job50, discovery-service27, discovery-persistence15 |
| Cold delivery | Normal archive clone, exact SHA/tree, complete history, strict Git fsck, no alternates, own54 lockfile dependencies; build0 and55/55 writer controls, clean source |

The consumer gate also proves that ordinary publication/private digests are not
changed by metadata, and terminal discovery retry does not repeat its fake
broker call. These are local tool fixtures, not product or provider tests.

Frozen reviewed source identities:

| File | SHA256 |
| --- | --- |
| `src/kernel/private-store.ts` | `099b6543d1add3351321345d5e2087513c3a34570bce917f9016b5db9aab2e81` |
| `src/kernel/private-write-admission-policy.ts` | `5eb1d2c37b80591ea8ca4bbbafe38f5da8f92ed231b5084d8efbe1850f7d7c2a` |
| `src/kernel/workspace-validator.ts` | `d75875f710991b34d4a82c69b2d8769309068de189d63704338d5b5d69b62050` |
| `tests/kernel/private-store.test.ts` | `a7dcacbc0c01ce285b9fcfe15ce341218dffb9decd5b49771992565c6f9c0088` |
| `tests/kernel/private-store-concurrency.test.ts` | `ce5911bc8500af5c9a906bf56f2999a522c3284023c6a4dbb92a4da501f47bfd` |
| `tests/fixtures/private-store-writer.mjs` | `f7ab3b6f3c1f6b134e0218cdc3b92d0d112f58658bdce66abb8b1f82f015d5da` |
| `tests/workspace/private-write-admission.test.ts` | `af4e44b07617aebb0195675708cc9809465f416ba33d4bc5854b5be5cbf26d4d` |

Raw local log digests preserve attribution; replay does not require those logs:
focused55 `dcfa5b50211dbfd807cb3a5d56f935829afe20832a61003c3c24faff61fbfc59`,
consumer10 `08c7b3700ab5ea5acb330b5c59a73be86f3137620b3ac9b5e172a1da1045c14a`,
two original repair cases `58c7e7b46b94904d18f90b60e450e6ac92251abc29dc3a38dd18111a2a9c73eb`.
Final244 compatibility log: `f98445b5e17a270dbc34adffbc2134d6afff8e2be1a7072150f23e858ab58668`.
Cold55 log: `bc0214f6f3ae5fb1acad8116932e9c650fe5da287ed3f4f4604385695719d676`;
cold build log: `0f2d9eeb6484ef8b78bf32dcc7e3a6ed7836504f0ead975edbe4cbad1f4d0955`.
Reviewer name-filtered cases are additional scoped checks, not a second complete
registration/discovery gate. The four independent cleanup probes are reported
observations, not four new delivered testcases.

Replay from the eventual restored candidate after separately installing its
own lockfile dependencies (Node22 used here):

```sh
npm run typecheck
npm test -- tests/kernel/private-store.test.ts tests/kernel/private-store-concurrency.test.ts
npm test -- tests/workspace/private-write-admission.test.ts
npm test -- tests/workspace/validation.test.ts tests/registration/store.test.ts tests/registration/job.test.ts tests/discovery-run/persistence.test.ts tests/discovery-run/service.test.ts
npm run build
```

Commands are local fixtures with isolated private state, not live QA. A
case-sensitive host reports the actual case-alias fixture as not applicable;
it must not claim execution of that assertion. Do not run a default Console or
Freeland product suite by substituting these commands into another component.

## Limits and next acceptance

This is cooperative local-file coordination, not protection against hostile raw
filesystem writers. Uniform filesystem basename semantics are assumed; Linux
per-directory casefold, heterogeneous mounts and bind-mount parent aliases are
not qualified. There is no universal external exactly-once or power-loss claim.
Higher registration/discovery fences remain responsible for their own authority.

Next qualify the exact new Kernel with a
Console successor pinned to it. The existing Console embeds an exact Kernel SHA;
changing an environment variable cannot adopt this repair. New source selection
does not migrate existing product campaigns. M6 generic manual-receipt and real
campaign interruption remain separate gaps; this file does not close them.
