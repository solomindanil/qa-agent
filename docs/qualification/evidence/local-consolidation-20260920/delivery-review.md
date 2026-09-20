# Independent Lead AQA delivery review — 20 September 2026

## Scope and verdict

Reviewed root `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/root`, base `48e9fc91177c4866e1e10e958fbfb6e93ac2d327`, head `bdcf8a2c711eb27329b13f722afbc1b51e621b0a`: 72 changed paths. Requirements were the local-consolidation plan and the owner's bounded source-preservation request, not activation or qualification of every preserved prototype.

**Ready to merge locally: YES, for this private archival/source consolidation, subject to the adoption invariants below. Critical 0 / Important 0 / Minor 0.** This does not approve public distribution, hosted publication before its blocker is resolved, remote merging, Android execution, candidate activation, campaign migration, live product acceptance, or completion of global P2–P6.

I read the current entry, manifest, assembly record, plan, consolidation index and both imported audit reports; inspected the actual diff, original canonical files, Android source/tests, candidate patch and auth donor's committed delta/metadata. I did not treat the imported audit conclusions as independent proof of preservation.

## Strengths

- The preservation inventory is checkable against the untouched canonical input rather than a report-only claim. `docs/qualification/evidence/local-consolidation-20260920/inventory.json:1` accounts for every one of the actual 49 status paths at canonical `c65a8f540b31857033a6cb12e2bf4687755ebac4`, plus exactly 13 separately selected ignored logs. All 62 original byte counts/hashes and retained hashes matched in my read-only check.
- Normalizations preserve provenance: all 24 historical-prefix bodies match their original bytes; Android README normalization is exactly the added experimental paragraph; Android JSON is exactly one terminal newline; the old plan matches the existing `f49e739` snapshot. Original AGENTS remains exact inert evidence while the current entry receives only scoped additions. The newer plan wrapper is not overwritten.
- `docs/qualification/current.md:19`, `AGENTS.md:35` and `docs/qualification/local-consolidation-20260920.md:29` clearly separate current source authority from old pauses, old campaign locators and old financial permissions. All added historical-header links and the checked current/index/Buzz/dialogue entry links resolve locally. Old body links are explicitly historical/private optional locators, not cold-start dependencies.
- `docs/qualification/local-consolidation-20260920.md:43` retains the two genuine incomplete candidates without selecting them. The failed→skip archive is byte-identical to the donor's full seven-file dirty patch and retains the classifier together with the verdict safeguards. The auth archive's sole HEAD is the exact four-commit candidate, with nine changed source paths; its external-email budget increase is explicitly not authorized by retention.
- The manifest is byte-unchanged across this review range. Fresh reviewer `npm run sources:verify` succeeded for Kernel `aa5d2d1`, Console `c421160`, Freeland `0ea2df1`, and inactive reporting reference `10d398d`. Neither candidates nor Android are introduced into normal root startup/test selection or managed execution.
- `tools/android-pilot/README.md:3` candidly limits the pilot to experimental source retention. Source inspection confirms preview-by-default, explicit execution, caller-authored/unsealed results, first-failure stop and retained UNRUN denominator. The 13 driver/runner controls are not misrepresented as session lifecycle, real provider, device or privacy qualification.

## Issues

### Critical — none

### Important — none

### Minor — none

No concrete issue requires changing the reviewed source before this bounded archival adoption. In particular, preserved whitespace in raw logs, original reviews and the exact patch makes `git diff --check` exit 2; changing those immutable historical bytes merely to make that command green would contradict this task. These are evidence-format findings, not a runtime failure.

## Verification performed and limits

- Independently compared canonical `git status --porcelain=v1 -uall` with inventory original paths: 49 actual paths, zero omissions. The other 13 entries are exactly the selected log paths. Verified original and retained SHA-256 values and reversible transformations against real files, not just inventory metadata.
- Checked historical-prefix presence and header-link resolution for all 24 prefixed records; checked local links from current checkpoint, consolidation index, Buzz contract and dialogue-control entry. Did not fetch remote links or certify historical private evidence availability.
- Verified all four newly retained complete Git bundles with `git bundle verify`, including auth `43b025c`; each has its expected sole HEAD and complete history. Auth bundle SHA-256 is `087fd4447e0cafa9a8c82acdbdb171f34fd50e6179d32857baadf5bed489e095`.
- Compared failed→skip patch directly to `git diff --binary HEAD` from its untouched donor: identical, SHA-256 `b2edd75079b7a8b47f6be2c35454e581566f323ae77e20d3d431935f9dfae4ef`. Read the classifier and paired verdict changes; did not run or qualify this candidate.
- Read auth donor status: its only dirty tracked path remains the private runtime graph. Checked the candidate's nine-path committed delta and four commits. The committed graph blob equals its existing `3ee1cb3` base blob: the archive carries existing committed source history, not the donor's dirty runtime graph. Did not inspect or import the private dirty graph.
- Focused textual checks across changed non-bundle files found no literal high-signal credential/private-key/JWT/provider-auth URL. The only broader credential-assignment-shaped match was the explicit synthetic `late-claim` callback fixture. A high-signal scan of the additional auth committed diff found no secret matches. This is bounded review, not a complete historical secret-scanner certification. Historical team/account-state/merchant/business details remain private-repository material, not sanitized public output.
- Fresh reviewer source verification passed for all four exact component pins. Inspected persisted root gate tail: 61/61, zero failures/skips. The coordinator separately reported cold clone at exact `bdcf8a2`, four-source restore/verify, root 61/61 and Android 13/13, clean root/children and no dependency installation; I inspected the additional cold log and its final Android 13/13 tail. I deliberately did not duplicate broad tests or claim to have independently rerun cold qualification.
- Confirmed reviewed HEAD remains `bdcf8a2`; tracked root status stayed clean, and canonical input still has its original 49 status paths. No index, source, ref, runtime, campaign, install, network, browser or product changes were made by this reviewer. This report is the only written artifact.

## Adoption recommendations / safety invariants

1. Immediately before adoption, compare the canonical 49-path set and byte hashes with this inventory again. Any additional or changed user work invalidates a blanket “make canonical equal reviewed tree” assumption; preserve and reconcile it explicitly.
2. Preserve the exact original dirty state in the local backup commit/ref before merging. Explicitly select the inventoried files; do not use a broad force-add of ignored data. Keep private ignored runtime/account/session/campaign state and existing worktrees in place. A Git backup of selected tracked/untracked files is not a backup of those ignored stores.
3. Resolve only demonstrated archival/current-entry differences. Require the proposed resolved tracked tree to equal the reviewed delivery tree before committing; do not use whole-tree checkout/reset as an unexamined shortcut. Later evidence/status supplements are additional documented deltas, not magically part of reviewed `bdcf8a2`.
4. For the source component update, require a clean, exact current Freeland `d4754f7` checkout and proven fast-forward to `0ea2df1`; refuse unexpected dirty or divergent children. Do not change frozen campaign runtimes, registration paths, installed skills or original historical worktrees merely because source selection advances.
5. Rerun exact four-pin verification and the root packaging gate after canonical adoption; read back canonical commit/tree/status. Update the currently pending delivery checklist/status with actual results and this review attribution. Keep GitHub email/publication, hosted execution and original dry top-up UI work as separate outcomes.
6. Before any future Android promotion, separately qualify `run.mjs` create/timeout/delete/persistence recovery and private output handling. Current complete XML/PNG/config/session writes have no sanitizer or explicit private file mode; the README warning supports archival retention, not safe general-purpose execution. Likewise, auth and failed→skip require their own current requirements/effect review and full relevant regression matrix before activation.

## Assessment

The delivery meets its preservation and non-activation requirements: actual original bytes are accounted for, current instructions remain authoritative, selected pins are untouched, and incomplete work stays explicitly incomplete. The proposed guarded local backup/merge/tree-equality adoption is sound only while the original input still matches its inventory; no cleanup, private-state import, live acceptance or broader source-forensics conclusion is implied.
