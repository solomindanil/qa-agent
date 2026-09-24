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

Next gate: independently review this attribution. Before any fresh actor,
freeze whether the experiment measures **explicit source-selected invocation**
or **actual installed-host implicit discovery**; these are different claims.
For a source-only implicit A/B, demonstrate a real supported isolation boundary
that excludes the host skills rather than assuming a clone or extra roots do
so. Predeclare exact prompt, model/effort, tool/context inputs, numeric budget,
stop conditions and first-route rubric, then preserve first answer and raw
tool reads. Do not rerun or regrade historical D/H/S actors.
