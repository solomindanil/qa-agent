# Continuation publication portability — approved amendment

Status: approved by the user on 2026-09-14 ("Ок делай"); implementation and
qualification are still in progress. This addendum supersedes only the accepted
directory publication/sealing order. Original design remains frozen at
`9e3485425d10e5300f58e14ebcbef31ea52256f8541949a7d4334de7241b0837`.

## Reproduced contradiction

The original design requires a prepared `accepted` directory to have mode0500
before it is renamed from the private execution store into the public run.
The real Node22/macOS test fails with `EACCES` at `fs.rename(old, new)` for that
0500 directory, while the same complete-directory publication at0700 succeeds.
This is not an assertion/selector timing problem and was not waived.

Reproducer in the candidate Console:

```sh
node --import tsx --test --test-name-pattern='accepted byte bundle' tests/unit/campaign-continuation-files.test.ts
```

Local platform reference `man 2 rename`, CONFORMANCE, explains the requirement
to update a moved directory's parent entry and the restriction on renaming a
write-disabled directory. No new native helper, sudo, permission bypass,
public raw staging or symlink-based evidence indirection is proposed.

## Approved change

1. Prepare the complete sanitized bundle privately: directory0700, every
   artifact and complete record0400, exact bounded inventory/hash readback.
2. Publish that complete directory by one rename under the existing exclusive
   owner. A partial inventory is never a valid publication.
3. Fsync the destination/private-store parents and revalidate the complete
   directory at0700. Immediately chmod it0500 through its retained exact
   descriptor, fsync and verify exact identity, inventory, bytes and modes.
4. If interrupted after step2, accept only an explicit nonterminal
   `bundle_sealing_pending` representation after full record/binding/hash checks.
   It is not a product result, terminal receipt or dispatch authorization.
5. The original live host may complete only permission finalization after
   strict revalidation. It must not repeat the product request, erase the
   original timestamp or re-sanitize existing bytes. Afterwards use the
   ordinary sealed completion validation and existing classification.

This extends the already approved terminal `sealing_pending` principle to the
accepted-bundle boundary. No mode relaxation for v0; no arbitrary writable
directory, missing artifact, forged completion, unknown ID or changed hash is
accepted. New-host/cloud recovery remains unsupported.

## Required negative and process controls

- SIGKILL after whole-bundle publication but before chmod; retained exact bytes,
  mode0700 recognized only as pending, no PASS and no repeat dispatch.
- Successful permission completion yields0500/0400 and the same hashes/time.
- Incomplete/extra/modified artifact, forged binding, hardlink/symlink, wrong
  owner, wrong directory mode or changed original source remains rejected.
- Repeat terminal read performs no permission/data mutation and no target call.

## Orthogonal implementation boundaries

The deterministic internal lock namespace is
`.qa-private/.campaign-continuation/<runId>.lock`,0600 under0700 directories.
Task3 must give it an exact Kernel grammar, not broaden `.qa-private`.
Task2 binds a store only for a write tenure; Task4's original live host retains
the exact workspace/store identity across worker generations. A filesystem lock
or editable death claim alone never grants dispatch or recovery.

Publication is exclusive under cooperative owners and owned roots. Native Node
directory rename is not an adversarial `RENAME_NOREPLACE` against a hostile
same-UID process. The implementation must never overstate this boundary.
