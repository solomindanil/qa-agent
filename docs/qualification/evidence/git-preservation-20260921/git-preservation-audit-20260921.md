# Git preservation audit — 21 September 2026

## Scope and method

This was a read-only Git preservation audit of the canonical repository at
`/Users/danilsolomin/projectsnew/qa-agent`, its current refs, and exactly these
three registered historical worktrees:

- `.local/worktrees/g2-evidence-routing`
- `.local/worktrees/postreview-source-integrity`
- `.local/worktrees/precloud-source-integration`

The audit used Git status names, object identifiers, ref reachability, ancestry,
and blob hashes. It did not inspect the separate P6 isolated delivery roots,
open the untracked document bodies, read ignored credentials or campaign
evidence, run product/runtime tests, contact a network, or mutate Git state.
It does not claim to cover every historical clone, scratch directory, dangling
object, or private campaign on the machine.

## Accepted canonical entry

The canonical checkout was clean at:

- Branch: `codex/p2-semantic-source-delivery`
- HEAD: `45a74c33b3df091411a253ef894f1dfa1f946995`

The accepted entry is this canonical tip. Historical branches and source
candidate bundles remain preserved inputs or inactive candidates; they do not
supersede the accepted entry.

## Registered worktrees

| Worktree | Branch | HEAD | Status | Relation to canonical |
| --- | --- | --- | --- | --- |
| `g2-evidence-routing` | `codex/g2-evidence-routing` | `48bccef6996496d795874ef47ea11d0ae089237a` | Clean | Tip is an ancestor; canonical is 83 commits ahead; 0 tip-only commits |
| `postreview-source-integrity` | `codex/postreview-source-integrity` | `7a0b8b546c007ff16508cf945af0559809b4ddaf` | Two untracked documentation files | Tip is an ancestor; canonical is 80 commits ahead; 0 tip-only commits |
| `precloud-source-integration` | `codex/precloud-source-integration` | `787d3df963fe1ff71c80457a49753653e44505e7` | Clean | Tip is an ancestor; canonical is 81 commits ahead; 0 tip-only commits |

No named registered worktree contains a commit absent from canonical history.

## Untracked documentation bytes

The `postreview-source-integrity` worktree has exactly these untracked names:

| Path | Git blob hash | SHA-256 | Preservation finding |
| --- | --- | --- | --- |
| `docs/qualification/post-review-correctness.md` | `79ccda3e18983dce45f07eb5551f2dc452bc3c22` | `caa1d0b3b2313e6305fe14d0ab9a070ec9897ba7df54b163355e4f7fd66fccbc` | Differs from canonical and backup blob `7dddca6ab8c2b96117cec193bebf2c21a0445ab2`; not reachable from any audited current ref; its path and SHA-256 were not found in the local-consolidation inventory or delivery audit. These are filesystem-only bytes in the audited scope. |
| `docs/superpowers/plans/2026-09-07-post-review-dialogue-qa-plan.md` | `7ea3cc15402879594db3e51fb1800b7070e2bdf9` | `af998e62c6a876b89845c221e05da91cfb9bc4d07284616d0124d7cb174a9f6f` | Differs from canonical and backup blob `abdaa562bf3a5aca6a3206abbbfc13b5c7371b31`, but the exact blob is reachable through commits `ea6858332dd380ed3f714c4e0d64fd6c471d0488` and `2f42683716e883445eee389f87e72143308736a7`, both ancestors of canonical. It is not a unique-byte loss risk in the audited Git store, although the worktree remains dirty. |

Actionable preservation gap: do not delete, reset, clean, or otherwise alter the
`postreview-source-integrity` worktree until the unique
`post-review-correctness.md` bytes have been separately reviewed and archived.
This audit did not archive them.

## Canonical refs

The audited local branch refs were:

| Ref | Object ID | Relation to canonical |
| --- | --- | --- |
| `refs/heads/codex/g2-evidence-routing` | `48bccef6996496d795874ef47ea11d0ae089237a` | Ancestor |
| `refs/heads/codex/journey-adoption-20260914` | `e82e60096072a4630e7c8afff9d9e753d4dbbf33` | Ancestor |
| `refs/heads/codex/local-consolidation-backup-20260920` | `00b3d9e4e4f4b2cdb44b3da1acaafca0c0c05018` | Ancestor |
| `refs/heads/codex/p2-semantic-source-delivery` | `45a74c33b3df091411a253ef894f1dfa1f946995` | Accepted canonical tip |
| `refs/heads/codex/postreview-source-integrity` | `7a0b8b546c007ff16508cf945af0559809b4ddaf` | Ancestor |
| `refs/heads/codex/pre-reconciliation-20260911` | `48bccef6996496d795874ef47ea11d0ae089237a` | Ancestor |
| `refs/heads/codex/precloud-source-integration` | `787d3df963fe1ff71c80457a49753653e44505e7` | Ancestor |
| `refs/heads/codex/reviewed-components-adoption` | `5ba9895bba13a83bae58c7df3db25a2f081fdfaf` | Ancestor |
| `refs/heads/codex/self-contained-delivery-20260913` | `6842c82e1fb3255ddb6e0afc44d2a494e8cec5d0` | Preserved historical divergence: 5 tip-only commits |
| `refs/heads/codex/workspace-assembly` | `c65a8f540b31857033a6cb12e2bf4687755ebac4` | Ancestor |

The existing remote-tracking refs, without fetching, were also ancestors:

- `refs/remotes/origin/codex/precloud-source-integration` at
  `787d3df963fe1ff71c80457a49753653e44505e7`
- `refs/remotes/origin/codex/workspace-assembly` at
  `fab87d6a318db57dd27dceb90264a04e4ad53549`

The five non-ancestor commits retained by
`codex/self-contained-delivery-20260913` are:

- `6842c82e1fb3255ddb6e0afc44d2a494e8cec5d0`
- `25aa2d1712e07a66699e7d344a66ffa3bd85162b`
- `fc8c1e7df9549eaa19cd431cb664216cadd33fd6`
- `650c79def53c2c5401fc350a3e10715abb5cd3d7`
- `a0b533e9946e89255585d51d180a4f4a26831ed1`

The consolidation source-lineage audit explicitly records this branch as five
non-ancestor historical commits with no missing file among its ten touched
delivery paths. A separate blob-identity check found all ten paths in canonical:
four are byte-identical (`README.md`, `docs/getting-started.md`,
`products/README.md`, and the inactive
`sources/candidates/freeland-maintenance-722bf1b.bundle`); six current
documentation/index paths differ. Therefore the branch ref is required to make
the historical versions reachable; the differing paths must not be described as
byte-identical canonical copies.

## Consolidation backup reachability

Backup commit `00b3d9e4e4f4b2cdb44b3da1acaafca0c0c05018` was verified as:

- a commit object;
- the exact tip of `refs/heads/codex/local-consolidation-backup-20260920`;
- an ancestor of canonical, with canonical eight commits ahead;
- the first parent of adoption merge
  `27a94c5827be013ee4303718828658f2c1c926ef`.

The adoption merge's second parent is reviewed commit
`bdcf8a2c711eb27329b13f722afbc1b51e621b0a`. Both the adoption merge and the
reviewed commit have tree `a76bc4f25418c494f0f481f8b80304201594a9f6`.

## Conclusion

All committed history represented by the three named worktree tips is reachable
from the accepted canonical tip. The backup branch and the separate historical
divergent branch remain reachable by exact local refs. A complete preservation
claim is not yet justified because one untracked documentation file contains
unique, ref-unreachable bytes. The old worktree is the preservation boundary
for those bytes until a separate authorized archive records them.
