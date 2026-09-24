# I04/W7 installed-skill delta — 24 September 2026

This is a read-only current-source/installed-byte delta at canonical root
`3d6b9451e220e568413f3488f1936dad49eab6ed`, not a new host-behavior or
product test. The [earlier W7 inventory](w7-installed-skill-drift-20260924.md)
remains attributed to its `f747b70faf58b75d580db7e184c2ae303f1adc30`
checkpoint: **30/42 exact, 9 differing, 3 missing, 0 extra**. Do not replace
that historical result with this one. The [current plan](../superpowers/plans/2026-09-23-unified-qa-agent-implementation-plan.md)
keeps I04's exact-byte delivery/fresh-consumer and W7 host exits open.

Against today's five complete source bundles selected by
[`skills/README.md`](../../skills/README.md), `diff -qr` of each bundle with
`~/.codex/skills`, `~/.agents/skills` and `~/.claude/skills` found **27/42 exact
file slots, 12 differing, 3 missing, 0 extra**: each host has 9 exact, 4
differing and 1 missing file. The only new source-bundle change since the
earlier checkpoint is `skills/qa-check/SKILL.md` (commit `ee04085`); its new
account/session/fixture paragraph changed source SHA-256 from the old and
still-installed
`6055cb4422e134e2c40e8fe9a757f3a0282994855b4fd8b6e06a505096476a37`
to
`c79b35c38838d92ee5dcfcfe1d257ad8f16a32682220056583212ed64e4649b5`.
All three host copies retain the old hash. Thus the change adds exactly one
different slot per host to the previous inventory; the two differing
`qa-product-v0` references, differing `freeland-release-qa/SKILL.md` and
missing Freeland `references/exact-ticket-evidence.md` per host remain as
recorded there. No installed bundle was updated.

The `qa-check` frontmatter description is unchanged and covers general
product/release/ticket QA, while the new account route is in its source body
only. An account-only request therefore presents a **description-level
discoverability risk**, not an observed implicit-trigger failure. The current
Codex session lists `qa-check`, `qa-product-v0` and `freeland-release-qa` from
both Codex and Agents host roots. Listing establishes that those names and
descriptions were exposed to this session; it proves neither current-source
byte parity nor implicit trigger/dispatch behavior, execution authority,
account readiness or a product verdict. The root I06a two-file index/router
candidate `ee04085` remains experimental and unaccepted under the
[current checkpoint](current.md); bounded answer-text benefit is not installed
skill adoption.

`npm run sources:verify` exited 0 at this readback for all four manifest
entries. The selected Kernel, Console, Freeland and inactive reporting-source
commit pins are unchanged from the earlier inventory; a manifest
qualification-text update is not a source-pin or installation change. No
installation, campaign migration, live host entry, account read, product
action or tracker write was performed. A separately scoped selective install
with backup and installed-byte readback, followed by fresh actual-host
routing/implicit-trigger samples, remains necessary for a new installed-skill
claim.
