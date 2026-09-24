# W7 installed-skill byte comparison — 24 September 2026

This is a read-only source-to-installation inventory, not a skill promotion,
host-behavior test, product run or W7 acceptance. The root was clean at
`f747b70faf58b75d580db7e184c2ae303f1adc30`; `npm run sources:verify`
passed for the four manifest pins. The comparison used the five complete
source bundles indexed by [`skills/README.md`](../../skills/README.md) and
the corresponding installed directories in `~/.codex/skills`,
`~/.agents/skills` and `~/.claude/skills`.

| Bundle | Source files | Per-host byte result |
| --- | ---: | --- |
| `qa-check` | 3 | 3 exact |
| `qa-bugfix` | 4 | 4 exact |
| `qa-init` | 1 | 1 exact |
| `qa-product-v0` | 4 | 2 exact, 2 differing |
| `freeland-release-qa` | 2 | 1 differing, 1 missing |

Across the three hosts: **42 expected file slots; 30 exact, 9 differing,
3 missing, 0 extra files**. The corresponding installed bytes are identical
between the three hosts. The three distinct differences are:

| Relative file | Selected source SHA-256 | Installed SHA-256 |
| --- | --- | --- |
| `qa-product-v0/references/agent-observations.md` | `3c0b17486afa1bde5d5cf1ac2f2bd1945496666dbb71153691325e67797a63c8` | `543703f6a57a6faf6b1e6067ab18f092f9518b1bdc948c09444478fb7fbd21bd` |
| `qa-product-v0/references/declarative-campaign.md` | `51ef922f73048870ef0f7c89360edeb4a7012f54f28b5a3823559b90ae9f5bab` | `8597b743687eb52f439d3ab20c6e9e9a53b397f9c9c7653f0cc84c14f7ddd03c` |
| `freeland-release-qa/SKILL.md` | `9014a5e85e1c0f1f5957803c34878b0e4d84b916349072f4601f414824356626` | `5cd82212037fe765219bbfc7bdd39bced23a1527458abb57e74e143f67b4dfbc` |

`freeland-release-qa/references/exact-ticket-evidence.md` is absent on all
three hosts; its selected source SHA-256 is
`9732daf59305c7d4fbb5cb12ec2657b7cf739d08fa7c3be4ba87336cd65bda01`.
The source Starter references document the newer observation write/readback
contract and intermediate browser assertions; the installed copies still
describe older boundaries. The source Freeland skill includes an exact-ticket
evidence route that its installed bundle cannot currently supply.

This explains an entry-point qualification gap, not a known runtime or product
failure. Existing campaigns retain their frozen owners and runtimes. The next
W7 decision is a separately scoped selective installation with backup,
installed-byte verification and fresh host routing samples; no installation,
registration, campaign or product state was changed by this comparison.
