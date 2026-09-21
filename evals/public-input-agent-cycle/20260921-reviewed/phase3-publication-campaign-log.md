# Phase 3 publication and campaign command log

Date: 2026-09-21 (Asia/Makassar)

Authority: independent Lead AQA approval in `reviewed-cycle/revised-proposal-review.md`. This log records the one approved publication and the one approved campaign invocation. It does not alter the Phase 1 or Phase 2 proposal artifacts.

## Pre-publish verification

All four originals matched the frozen reviewed copies byte-for-byte:

- `phase2-checkpoint.md`: `sha256:ea91440501576fde77fb8cfdfb7d422021992e8509fc88d3447a067cab91926c`
- `phase2-proposed-qa-campaign.v0.json`: `sha256:d3e3ee3fceb8d9ddf3a8b1de478d2dbeca19d469f81b76c3279c146e2c535736`
- `phase2-publication-and-execution.mts`: `sha256:31e295c2a592f167ff1fc1e667fb62431adb8b2a5006228ae8a836d14948a0df`
- `phase2-test-design-report.md`: `sha256:92a658ea6c4dcf1167d67502b848a78ee2d5f66a2ee2fe4b954526d2c55a9c49`

Selected source HEADs were `c421160a71c0679a357f29828029ec3550791d16` for Console and `aa5d2d188606cbcf7e3111c130347a36970ec786` for Kernel. The canonical plan was absent. The final read-only preview exited `0`, reported `mutationPerformed: false`, and reproduced:

- plan semantic digest `sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85`
- preview digest `sha256:1ee62526b285437062c3fe0b4ef133292ad5d44b4c2084eb827cce05ce1c9d68`
- proposed publication `sha256:54bbc74129669965d6f2eb980f70ba85f60af074da8174d82117cd43eb451a2c`
- proposed graph `sha256:6090fad12b80304bdf164e9e3ed9a2f674c2573f26e57cba0154271116de5c59`
- proposed catalog `sha256:11576c1fde53a9bf232d2f79041c0e65794840a66d41344409c744554e89a0a2`
- 2 executable checks, 2 blockers, and 3 absence windows.

The full preview change list is preserved by the prior preview tool output and the frozen `phase2-freeze-supplement.md`; the exact preview digest above was the publication gate.

## Single publication

Command:

```text
./node_modules/.bin/tsx <exerciseRoot>/phase2-publication-and-execution.mts publish sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85 sha256:1ee62526b285437062c3fe0b4ef133292ad5d44b4c2084eb827cce05ce1c9d68
```

Exit: `0`.

Complete stdout:

```json
{
  "status": "approved_phase2_publication_and_plan_written",
  "receipt": {
    "schemaVersion": "regeneration-receipt.v1",
    "transactionDigest": "sha256:98f966a7d3f7cd500f86808b64b1ac075b484ece0cb8e4b640042ea1fc5b1a85",
    "previewDigest": "sha256:1ee62526b285437062c3fe0b4ef133292ad5d44b4c2084eb827cce05ce1c9d68",
    "workspaceDigestBefore": "sha256:c1f0eed43c2c7d9cd95b216e2c9e933e77c75ab1798f0baae82ab986a1ecfb56",
    "workspaceDigestAfter": "sha256:d93cf24e6907f00974392a47255bd72837e0e5307c4a158b42560fdc2627c615"
  },
  "validation": {
    "schemaVersion": "registration-workspace-validation-receipt.v1",
    "valid": true,
    "workspaceDigest": "sha256:6df7405b514333f7617c30b691b7abe98e58713d513d36b2d8c2f6f5e2c02da9",
    "publicationAuthorityDigest": "sha256:54bbc74129669965d6f2eb980f70ba85f60af074da8174d82117cd43eb451a2c",
    "privateStateDigest": "sha256:d353ca70b304caad794f11dcd38ef4572f5127a3cbdad4234a457bb32c1d961c",
    "lifecycleState": "DISCOVERING",
    "diagnostics": []
  },
  "campaignExecuted": false
}
```

Persisted transaction manifest:

`nuanu-readonly-qa/.qa-private/transactions/98f966a7d3f7cd500f86808b64b1ac075b484ece0cb8e4b640042ea1fc5b1a85/manifest.json`, file `sha256:ae68506bb99f035f20424ec0a263408a4838999cebecb90e3a3ceb641cd3c04a`.

Readback showed publication `sha256:54bbc74129669965d6f2eb980f70ba85f60af074da8174d82117cd43eb451a2c`, graph `sha256:6090fad12b80304bdf164e9e3ed9a2f674c2573f26e57cba0154271116de5c59`, catalog `sha256:11576c1fde53a9bf232d2f79041c0e65794840a66d41344409c744554e89a0a2`, and strategy `sha256:ea2154ddc60a9141688482f21770ced57d6f7e1464e86dd41bc601af90dd2555`. The canonical plan was written in canonical JSON form with file and semantic digest `sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85` and size 7,072 bytes.

## Existing-CLI validation

Exit: `0`.

Complete result line:

```json
{"blockedTargetIds":["urn:qa:discovery-target:b1774c66e87b898f6cd8f01d","urn:qa:discovery-target:d6735977b5d37ae97d565205"],"command":"validate","executableTargetIds":["urn:qa:discovery-target:5d912227740e0877768e8ff0","urn:qa:surface:0d486d3d59e029e50d756590"],"ok":true,"readyToRun":false,"schemaVersion":"qa-campaign-cli.v0"}
```

`readyToRun: false` reflects the two explicit blocked targets; the two executable targets remained eligible and were executed by the authorized run command.

## Single campaign invocation

Command:

```text
./node_modules/.bin/tsx <exerciseRoot>/phase2-publication-and-execution.mts execute sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85
```

The wrapper exited `1` after the child campaign returned its intentional non-success verdict. No retry or second campaign was run.

Complete meaningful stdout from the wrapper and child commands:

```text
{"status":"about_to_execute_existing_cli","planDigest":"sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85","baseUrl":"http://127.0.0.1:53783/","executableChecks":2,"blockedTargets":2}

> qa-console@0.1.0 qa-campaign
> tsx scripts/qa-campaign.ts validate --workspace <exerciseRoot>/nuanu-readonly-qa --plan <exerciseRoot>/nuanu-readonly-qa/tests/qa-campaign.v0.json

{"blockedTargetIds":["urn:qa:discovery-target:b1774c66e87b898f6cd8f01d","urn:qa:discovery-target:d6735977b5d37ae97d565205"],"command":"validate","executableTargetIds":["urn:qa:discovery-target:5d912227740e0877768e8ff0","urn:qa:surface:0d486d3d59e029e50d756590"],"ok":true,"readyToRun":false,"schemaVersion":"qa-campaign-cli.v0"}

> qa-console@0.1.0 qa-campaign
> tsx scripts/qa-campaign.ts run --workspace <exerciseRoot>/nuanu-readonly-qa --plan <exerciseRoot>/nuanu-readonly-qa/tests/qa-campaign.v0.json

{"checkCounts":{"needs_review":2},"command":"run","dossierCount":0,"ok":false,"runDirectory":"tests/campaign-runs/run-8faed1fa237a0a75-fd0ed7dc-d955-4ec8-9377-937292a081d7","runId":"run-8faed1fa237a0a75-fd0ed7dc-d955-4ec8-9377-937292a081d7","schemaVersion":"qa-campaign-cli.v0","verdict":"INCONCLUSIVE"}
```

The wrapper error was Node `Error: Command failed: npm run qa-campaign -- run ...`, with `code: 1`, `killed: false`, `signal: null`, the child stdout shown above, and empty child stderr. This is the existing CLI's propagation of the `INCONCLUSIVE` result, not evidence of a second infrastructure failure.

## Immutable campaign receipt and evidence

- Run ID: `run-8faed1fa237a0a75-fd0ed7dc-d955-4ec8-9377-937292a081d7`
- Run directory: `nuanu-readonly-qa/tests/campaign-runs/run-8faed1fa237a0a75-fd0ed7dc-d955-4ec8-9377-937292a081d7`
- Receipt: `receipt.json`, 6,683 bytes, `sha256:f6c1a34ff8dfa18bc929a742f90274fd4985beaf8c89c20a7f45616c5658884d`
- Binding digest: `sha256:8faed1fa237a0a75301f1b962f70d22ae30cb943ceda24be93b67c233b6825d4`
- Graph digest: `sha256:6090fad12b80304bdf164e9e3ed9a2f674c2573f26e57cba0154271116de5c59`
- Plan digest: `sha256:41e1db08f7e5e9f6e33ab20b46edaad85db48765f8cee2ffc0931c3402ef4f85`
- Verdict: `INCONCLUSIVE`; check counts: 2 `needs_review`; dossiers: 0.
- The receipt enumerates all 12 immutable artifacts: two attempts for each of two checks, each with `final.png`, `result.json`, and `trace.json`, including byte counts and SHA-256 digests.

## Evidence reviews and readback

- Search check review: `sha256:10a2500fbcbf5d3d5f2036d57e25f4839682f2370063a1545eadad953efb675b`; file `nuanu-readonly-qa/.qa-private/findings/campaign-review-10a2500fbcbf5d3d5f2036d57e25f4839682f2370063a1545eadad953efb675b.json`, 3,411 bytes.
- Literal-period check review: `sha256:bc4abdb0725451a5dd1888b13f1789e517c7f7948d10a2d1dc3f81f917df4b2c`; file `nuanu-readonly-qa/.qa-private/findings/campaign-review-bc4abdb0725451a5dd1888b13f1789e517c7f7948d10a2d1dc3f81f917df4b2c.json`, 3,671 bytes.

Both `read-review` calls exited `0`, re-bound to receipt `sha256:f6c1a34ff8dfa18bc929a742f90274fd4985beaf8c89c20a7f45616c5658884d`, returned `currentBinding.state: current`, `assessment.kind: product_issue`, and `attribution: agent_authored_unattested`. These reviews do not mutate the receipt, verdict, graph, or catalog.

## Diagnostics retained

- The first campaign wrapper invocation is the only campaign invocation; its exit `1` and child `INCONCLUSIVE` output are retained above.
- A read-only multi-input `jq` attempt printed `jq: error (at tests/qa-campaign.v0.json:1): break` after successfully printing the first expected behavior. It was a query construction error; a corrected single-plan query exited `0` and returned both exact expected behaviors. No managed state changed.
- Status probe 1 supplied unsupported `--plan` and returned `Unknown argument --plan` (exit `1`).
- Status probe 2 omitted the required run ID and returned `Missing required argument --run-id` (exit `1`).
- Status probe 3 supplied workspace and run ID but returned `Invalid campaign continuation: explicit canonical workspace/run required` (exit `1`). No resume or campaign was started. The verified campaign reader used by `record-review`/`read-review` returned the current original evidence, so no further status probing was needed.
- The earlier Phase 2 bootstrap-preview and post-freeze path diagnostics remain recorded in `phase2-checkpoint.md` and `phase2-freeze-supplement.md` respectively.

