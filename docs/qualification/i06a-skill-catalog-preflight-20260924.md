# I06a no-model skill catalog preflight — 24 September 2026

Status: **observed catalog/config boundary only**. This is neither an I06a
source-index adoption, a fresh implicit-trigger actor result, nor installed-host
QA qualification. The parent tool transcript contains a truncated initial
protocol response and a later filtered parser readback, not a portable full
raw 88-skill response. Independent AQA review is tracked separately; this
preflight is not itself a qualification decision.

## Frozen identity and allowed effects

The canonical root was `/Users/danilsolomin/projectsnew/qa-agent`, branch
`codex/p2-semantic-source-delivery`, HEAD
`1498e0c0450fa24ca422a214cf1080a44472c4dd`, with a clean tracked tree
before the probe. The locally selected CLI was
`/Users/danilsolomin/.local/bin/codex` →
`/Users/danilsolomin/.codex/packages/standalone/releases/0.154.0-aarch64-apple-darwin/bin/codex`,
`codex-cli 0.154.0`, SHA-256
`4f85982624b3898c8991cb80c0981b2aa71070e3537046c9a95950318a95afcc`.
The successful `initialize` response identified
`Codex Desktop/0.154.0 (Mac OS 26.2.0; arm64)` and
`codexHome=/Users/danilsolomin/.codex`. This identifies the probe process,
not the executable or prompt context of a later desktop actor.

The owner allowed this local no-model `skills/list` preflight, including
possible local process/cache writes. The client sent only `initialize`,
`initialized`, and `skills/list`. It did not send `thread/start`, `turn/start`,
`skills/config/write`, product calls, installation, or tracker writes. The
App Server may perform its own background/configuration work; this record does
not assert zero network or zero filesystem effects.

## First transport attempt and successful reads

An initial plain-pipe `codex app-server --listen stdio://` exited when the
command's stdin closed, before a catalog response. Its stderr contained
remote-control websocket shutdown warnings. It was a transport setup
attempt, **not** a first model/QA answer or a catalog measurement. The next
PTY-backed process accepted the required JSONL handshake and was stopped
with Ctrl-C after the reads (signal exit 1; no running session retained).

Using [the documented protocol](https://learn.chatgpt.com/docs/app-server#skills),
the successful process received one `skills/list` with `forceReload: true`
for the canonical root. A second cached read of that cwd confirmed the
filtered values below. Two further `forceReload: true` requests used the
existing clean normal clones, without creating or editing either clone:

| `cwd` | Root HEAD at preflight | Skills returned | Errors | Selected QA entries | Repo-scoped entries |
| --- | --- | ---: | ---: | ---: | ---: |
| Canonical qa-agent root | `1498e0c` | 88 | 0 | 10 | Not separately counted in the filtered first response |
| `.local/i06a-heldout-cold-a` | `8f40e6e` | 88 | 0 | 10 | 0 |
| `.local/i06a-heldout-cold-b` | `ee04085` | 88 | 0 | 10 | 0 |

Each catalog's selected QA entries were two `enabled: true`, `scope: user`
copies of each of `qa-check`, `qa-init`, `qa-product-v0`, `qa-bugfix`, and
`freeland-release-qa`, one under `/Users/danilsolomin/.agents/skills/` and
one under `/Users/danilsolomin/.codex/skills/`. None of those ten entries
pointed into the canonical root or either clone. The selected source bundles
instead live under root `skills/`, Console `components/console/skills/`, and
Freeland `components/freeland/skills/`; they are not automatically equivalent
to the App Server's returned host entries. The previous
[installed-byte audit](i04-installed-skill-delta-20260924.md) separately
finds body/reference drift; catalog enablement does not erase it.

Exact `qa-check/SKILL.md` SHA-256 readback further separates treatment from
catalog: clone A and both returned installed-host copies are
`6055cb4422e134e2c40e8fe9a757f3a0282994855b4fd8b6e06a505096476a37`,
whereas clone B is
`c79b35c38838d92ee5dcfcfe1d257ad8f16a32682220056583212ed64e4649b5`.
The root `skills/README.md` hashes also differ, A
`34f7312db9f22f0618da3e9fc728ef223b7df05dd96cceb9fe93b15d6844bbfb`
versus B
`e1d7b2becb4f8f662b5a2585123ec2740d879b02e10cb382aa15bb79779d550d`.
Thus the clones contain a real source treatment, but the `qa-check` files at
the host paths returned by `skills/list` match A-side bytes for both. The
catalog returned paths and metadata; the byte hashes came from separate local
file readback.

The process also emitted two warnings about unrelated plugin icon paths
containing `..`; the `skills/list` data returned `errors: []`. No QA-specific
catalog error was observed. We did not inspect the icon plugin or treat these
warnings as a QA route defect.

## Decision and limits

The fresh no-model read establishes that **these three cwd values expose the
same selected host QA skill paths** under CLI App Server 0.154.0. A normal
clone alone therefore does not isolate a source-only I06a A/B: changing the
clone's root index does not remove or replace the host skill catalog. This
directly explains why the earlier W7 baseline's host-skill reads cannot be
relabelled as a pure source-index treatment. It does not identify the later
actor's actual cwd, full instructions, source files read, or first answer.

[Official Codex skill guidance](https://learn.chatgpt.com/docs/build-skills)
also allows initial skill descriptions to be shortened or omitted under its
metadata budget. A `skills/list` entry thus does **not** prove that the model
saw that entry or implicitly invoked it. The descriptions returned here still
do not explicitly name ordinary completed-run status or workspace integrity.
No source-index routing, product account readiness, I06a acceptance, graph
benefit, or live QA result follows.

This first attribution received independent documentary AQA GO before commit
`1da2047`, not I06a acceptance. Before any fresh actor, freeze whether the
experiment measures **explicit source-selected invocation** or **actual
installed-host implicit discovery**; these are different claims. For a
source-only implicit A/B, demonstrate a real supported isolation boundary that
excludes the host skills rather than assuming a clone or extra roots do so.
Predeclare exact prompt, model/effort, tool/context inputs, numeric budget,
stop conditions and first-route rubric, then preserve first answer and raw tool
reads. Do not rerun or regrade historical D/H/S actors.

## Transient-config follow-up: unsuccessful source-root preflight

After the first documentary commit (`1da2047`), three fresh CLI App Server
0.154.0 processes were used for no-model diagnosis. Each sent only
`initialize`, `initialized` and `skills/list`; no thread/turn was started and
no persistent `skills/config/write` request was made. The filtered JSONL
readbacks, rather than full catalogs, are retained in the parent tool
transcript. The two normal clones remained clean and detached at their frozen
commits.

| Single-process probe | Returned clone catalog | `qa-check` host entries | Source `qa-check` |
| --- | --- | --- | --- |
| One-off `-c skills.config` with both host **folder** paths; then `perCwdExtraUserRoots` at each clone's `skills/` parent | 67 per clone, `errors: []` | Both `enabled: true` | Not returned |
| One-off `-c skills.config` with both exact host **`SKILL.md` file** paths, no extra root | 67 for clone A, `errors: []` | Both `enabled: false` | Not requested |
| Normal config, `perCwdExtraUserRoots` at clone A's direct `skills/qa-check/` directory | 67 for clone A, `errors: []` | Both `enabled: true` | Not returned |

The first probe failed its predeclared assertion and stopped before model
work. The narrower file-path probe confirms effective temporary disablement
for those two entries on this pinned CLI, despite the current
[configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
describing a folder path; the separate
[App Server method example](https://learn.chatgpt.com/docs/app-server#skills)
uses a `SKILL.md` path. Neither form of the extra-root request demonstrated
source discovery. `errors: []` does not establish that this optional field was
recognized or applied. The 88→67 total-catalog delta between the first and
follow-up processes is unresolved; it is **not** attributed to disabling two
entries, since the folder-path probe also returned 67 with both still enabled.

Independent Astra architecture review therefore kept source-only implicit A/B
at preflight **NO-GO**, not a failed actor comparison. Do not claim any source
candidate quality result from these reads. The next optional isolation gate is
a separately scoped version-matched protocol-schema inspection before trying
`skills/extraRoots/set`; even source discovery would still leave other skills,
repo `AGENTS.md`, readable history and tool context to isolate. A separate
installed-host first-route baseline can measure the actual host if its normal
catalog/context and actor protocol are frozen, but cannot prove a source-index
causal benefit. No install, product, provider, tracker or production action
occurred in this follow-up.

## Pinned-schema and additive extra-roots follow-up

The optional schema gate was performed against the same local `codex-cli
0.154.0`, generating its standard and experimental App Server JSON schemas
in an isolated temporary directory (`/tmp/i06a-schema-MVN05v/`). This was a
no-model inspection, not an actor run or source adoption. In both variants,
`v2/SkillsListParams.json` declares optional `cwds` and `forceReload`;
it has **no** `perCwdExtraUserRoots` field. Both variants contain
`v2/SkillsExtraRootsSetParams.json` with required `extraRoots` (an array of
absolute paths), and the `skills/extraRoots/set` request is present in the
generated protocol. This is consistent with the previous extra-root attempts
not demonstrating source discovery: their requested field is not declared in
this pinned `skills/list` schema. Because it does not forbid additional
properties, the schema alone does not establish how the runtime handled that
field. The previous `errors: []` never proved it was applied. The generated
`SkillsConfigWriteParams` allows a nullable absolute `path`, but does not by
itself establish the configured
folder-versus-`SKILL.md` semantics observed in the earlier runtime probe.

After this schema read, **one** fresh CLI App Server process sent
`initialize`, `initialized`, `skills/list` for the untouched clone A,
`skills/extraRoots/set` with clone A's existing `skills/` directory, and a
second `skills/list` for clone A. It did not start a thread/turn, call a
model, write skill config, install skills or touch a product. The predeclared
narrow criterion was whether that process's second catalog exposed a
source-path `qa-check`. The filtered values and call sequence below are
parent-reported from the live tool transcript; no independent full raw JSONL
artifact was saved for this probe.

| Same process | Total entries | `qa-check` source path | Two installed-host `qa-check` paths | Catalog errors |
| --- | ---: | --- | --- | ---: |
| Before `skills/extraRoots/set` | 67 | Absent | Both enabled | 0 |
| After `skills/extraRoots/set` | 69 | `.local/i06a-heldout-cold-a/skills/qa-check/SKILL.md`, enabled | Both still enabled | 0 |

The method response was `{}`. The clone stayed clean at `8f40e6e`; clone B
stayed clean at `ee04085`. Thus the supported process-level method did
surface clone A source **additively** under this CLI. It did not suppress or
replace either host copy, isolate A from B for a causal implicit-trigger
comparison, show model-visible metadata, establish a first route, or qualify
the source-index candidate. No B-arm probe or actor followed. The 67-entry
baseline still must not be reconciled by guesswork with the earlier 88-entry
process. Further I06a provenance probing is deferred while the independent
I07a quantity-control slice is considered; this is a priority decision, not
I06a acceptance.
