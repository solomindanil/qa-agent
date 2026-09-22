# Existing reader output retention — 22 September 2026

## Decision

The [field baseline](../../evals/dialogue-quality/20260922-field/README.md) lost
durable raw stdout and invocation timing at the calling-agent layer. The selected
reader already returns the complete JSON and local publication/strategy/workspace
bindings. A new synthetic diagnostic retained these using ordinary process/file
capture; **no reader fix, exporter, helper service or source-pin change is needed
for this demonstrated gap**. This is not proof that future agents will always
capture correctly without guidance. The missing historical rw-int output remains
missing; the new result does not repair or replace it.

Root base `f85ace93114821cfe8d706cfd52671b7e36195fb`; unchanged Console
`94083bf55d3237b6e60870211b034bfbc4b9dcc2` and Kernel
`aa5d2d188606cbcf7e3111c130347a36970ec786`.

## Source inspection and actual experiment

Console `scripts/qa-campaign.ts` accepts only `--workspace` for `observations`,
calls the existing Kernel report reader and prints its full canonical JSON to
stdout. It has no output-file or read-time flag. Kernel
`src/kernel/target-observation-report.ts` preserves the local bindings, complete
target denominator, observations and diagnostics. Its `captureTime` comes from
the stored observation, **not this invocation**. The current `qa-product-v0`
observation reference already requires evidence, identity and unknowns; it does
not itself persist shell output. No source skill was changed for this exercise.

The experiment reused Console's existing `registerAuthoredFixture` and
`publishNuanuAuthoredRevision` inside one new private synthetic root. Discovery
used the fixture's supplied in-memory response; no product, browser or external
network call occurred. Two synthetic observations were written through the
existing Kernel writer: `unknown` and `partial`, explicitly not live outcomes.
Long nonsecret payloads made the full result larger than a compact tool display.

The existing direct CLI was invoked once for the valid synthetic workspace and
once for a distinct invalid-relative-path control. No retries or campaign run
occurred. A run-local diagnostic opened exclusive private stdout/stderr files
before launch and recorded start/end UTC, monotonic duration, argv/cwd, the
allowlisted Kernel path, exit/signal, source revisions and byte counts/hashes.
Its source is retained with the experiment, not installed or shipped as a runner.

| Check | Actual result |
| --- | --- |
| Complete valid read | Exit 0; 52,209 stdout bytes; empty stderr |
| Read interval | `2026-09-22T03:04:08.059Z`–`2026-09-22T03:04:20.685Z`; local elapsed about 12.6 s, not a benchmark |
| Scope and non-PASS | 3 targets: 1 recorded, 2 not observed; 2 observations (`unknown`, `partial`); 3 blockers; no managed verdict |
| Original identity | Publication, strategy and workspace digests equal the seeded fixture; candidate identity remains unknown; original observation times retained |
| Invalid argument | Exit 1; 95-byte structured `AGENT_OBSERVATION_ARGUMENT_INVALID`; not zero observations |
| Fresh-process readback | Parses saved raw files, checks payloads/digests/bindings and timestamps; no CLI invocation |
| Read-only effect | Complete synthetic file inventory, bytes and modes unchanged before/after both reads |

## Reuse the existing capture path

For the next authorized read, use the selected Console's documented direct CLI
or the host's ordinary process capture. There is no new QA command to learn.

1. Resolve the owner, exact workspace and accepted source first. Capture in a new
   private run directory, outside the managed workspace; use exclusive files and
   restrictive permissions. Do not dump the environment, credentials or session.
2. Preserve the exact command/cwd and a start record before launch. Send complete
   stdout and stderr directly to files; retain actual exit/signal and finish time
   even for nonzero results. Do not depend on the displayed/truncated tool result.
3. After streams close, hash the original bytes and parse the saved output. Keep
   the structured error if reading failed; never replace it with an empty report.
   A compact interpretation is separate from the original output.
4. Read publication/strategy/workspace bindings from that original report. Label
   the local invocation interval separately from stored observation `captureTime`
   and deployment identity. A source SHA or current local binding is not proof of
   a current product build. A later read is new evidence, not a recreated past read.
5. Give the next agent/reviewer the existing checkpoint and saved capture paths;
   recover from those bytes without another invocation merely to regain stdout.
   Preserve failures, unknowns, partial results, blockers and unassessed scope.

Raw product output can contain private data even when it contains no credentials.
Keep it private and authorize/sanitize any separately published projection. This
synthetic test does not certify general redaction, host-crash durability, trusted
timestamps, atomic live snapshots or all future agent behavior.

## Evidence and review

Private evidence is retained under `.local/reader-capture-20260922.VxtERK/`.
This is a historical locator, not a first-use prerequisite or an accepted product
workspace. Ordinary future capture needs its own authorized inputs.

| Artifact | SHA-256 |
| --- | --- |
| Pre-execution protocol | `f1b7b5fba8a65116ab37357ab38a5b515ccaac32ac9dea0b58df979da7f0817c` |
| Run-local diagnostic | `f491153f004e92f7e8253cf26a143ed8477e2f2a9c87553a4001a50852b4334b` |
| Fresh-process verifier | `28fb76cb08611d54387b92d24828f2c334d57919ea19aa2d924504e08821ac8e` |
| Full positive stdout | `f23ed98234ff731c2ca7c607678c14a33b596ec575ab26d932d7056e089f8867` |
| Positive start record | `750632161713240020eb406c3f909bb71fe6bd7b65a3e669993f6acce5c04276` |
| Positive finish record | `ca2016cc60df360ddf2f5dd1d6b00c0e1befc4cca68bf9e93a65cc8493b3d338` |
| Invalid-argument stdout | `8852b55247f48c2363f08337a8672996e6fb89029a2fca1470235c4683d2cf3b` |
| Invalid-argument finish record | `d1a52fd028161533220204f4f5e46e0ac144396d03af233273b429c7f799aea4` |
| Before and after fixture inventory, identical | `c3ea18ecc74b9c0077917da893dcc591a4cbe1461ea6226edb72707a369efea0` |
| Fresh readback verification | `72005829af9d8a2a141c36ac0c9a5d0b275d10eca92af55bc75143bcabd3219a` |
| Independent Lead AQA review | `9d281ea221dcfe2b205745d702b9519b9d53c55e4edde3049820a124eb753f98` |

Independent Lead AQA approved the design before execution and then **APPROVED
the bounded synthetic process-capture capability and all three documentation
changes** after independent hash/payload/binding checks. All 144 fixture files
matched both inventories. No blocking finding or new helper was recommended.
This is internal independent-context review on a shared host, not external
certification. The review retains its corrected overbroad permission assertion
as a reviewer-method mistake, not a reader defect; no diagnostic evidence changed.

Fresh source-delivery checks passed: root packaging **61/61**, zero failed or
skipped; all four manifest entries verified; `git diff --check` passed and all
57 local documentation links resolved. Full private logs: `root.tap`, SHA-256
`15a5a885af2131bf1ab60e90170b9fc696b6d191dcf3d72dde09ff31e4ef2734`, and
`sources-final.log`, SHA-256
`a8b2058f4793a2e6f84a7b9ce0111dbb9d52e1529d52befa86e8ca507839e927`.
These are packaging/source checks, not product QA. Runtime code, pins,
installed skills and real product campaigns remain unchanged. This closes no
whole P1/P3/P5/P6 stage. The next substantive work remains a previously
unqualified ticket/help/remaining-work path under its resolved owner's authority,
with this capture discipline applied during that work—not another capture-only
or guidance-only baseline loop.
