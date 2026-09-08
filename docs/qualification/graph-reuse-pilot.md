# Graph repair pilot — 2026-09-09

Scope: first reuse-first slice of [Step3A](../superpowers/plans/2026-09-07-post-review-dialogue-qa-plan.md#step-3a--reuse-first-graph-repair-g2g4-approved-2026-09-09). This is a source-locator correction, not new business test coverage, a product defect report or a release verdict. The global roadmap continues to include other products and G0–G5; this Freeland slice does not block independent work.

## Inputs and before/after check

- Source baseline: Freeland harness `04b771a7f048d244b501e4c0cab6618bd4305d79`.
- Reviewed source result: `9c2509e32462319d5b96ccb49d5ae2070df7b18d`, tree `8912f07768e38918b3e732118fd966fd1480d712`. Five files only: PRODUCT-MAP, mappings, graph regression, provenance manifest and its existing test fixture.
- Read-only product: `2981985e6eaebddbdb1b6691a261bc7e9369bcaa`, exact clean local mirror. No assertion that it is still the live deployment today.
- Frozen baseline graph: `sha256:cdb70c3252f1f24a5cacea16bc732fea0a4569dfe70b4cdac7683c180d7739ba`.
- Resulting source-only graph: `sha256:f861a4107ca6886f34a95eda485bb6ff85525d09e87185d2e4881c6591f2194e`.

Main reconstructed the baseline through the existing parser, graph builder, mapping validator, source review and planner; the semantic digest matched the frozen graph exactly. The after projection ran twice deterministically using the same frozen catalog, product inventory and changed-file set. This is not a newly collected Playwright catalog, a campaign receipt or runtime evidence. The existing frozen current/evidence was not overwritten.

| Measure | Before | After | Meaning |
| --- | ---: | ---: | --- |
| Strict findings | 180 | 176 | Only four stale/ambiguous code-locator findings removed |
| Resolved source locators | 74 | 85 | Exact current source connections established |
| Pending source review | 369 | 359 | Includes unresolved and review-required locators; not coverage percentage |
| Unmapped changed files | 106/142 | 106/142 | Unchanged; full-scope selection retained |
| Manual cases | 89 pending | 89 pending | No manual acceptance inferred |
| Product-CI catalog | 63 | 63 | Unchanged; external channel unavailable, zero executions |

The source-locator inventory changes from443 to444 because B11 replaces three stale ranges with two current ranges and D7 replaces two ranges with four. Therefore resolved/pending deltas are not counts of newly covered requirements. All136 requirement records, their acceptance fields and business wording, all `verifies` edges and automated/manual full-plan selection are unchanged. Only the two exact source-coordinate substrings in B11/D7 titles change.

## Four reviewed nodes

| Node | Correction or decision | Still open |
| --- | --- | --- |
| B11 | Current `apps/api/src/services/payment-checkouts.ts:1634–1640,3040–3059`; three obsolete references removed | No test owner; no automated acceptance inferred from reading the mismatch branch |
| D7 | Current `wallet-rail.ts:283–293,332–352,404–413` and `wallet-write-routes.ts:49–56`, with exact repository paths | No test owner and real concurrency coverage gap |
| SEO attribution | Five existing locator tokens resolve through reviewed `sourceOverrides`; the Vite basename is disambiguated | Semantic orphan; source-content checks do not prove runtime attribution |
| VIP entitlement | Existing source/test inventory reviewed, without adding a `verifies` edge | Normative baseline permits grant/admin/POSTED VPN/eSIM/VN purchase; current code/test also permit active referral attribution. Resolve this contract discrepancy before declaring full coverage; it is not automatically a product bug |

Only these strict findings disappear: B11 `payment-checkouts.ts:1620-1626`, `:2539-2546`, `:2791-2809`, and SEO `vite.config.ts:76-82`. No strict finding is added. All prior17 overrides and92 shared-source mappings are retained; five SEO overrides are appended. No new model, runner, oracle engine, schema or authorization mechanism was introduced.

## Verification and integration boundary

Independent Lead AQA approved the global plan and final five-file source/code diff without blocking findings. Final `npm run qa:verify` completed at these exact component bytes with exit0:376 main +1338 release/graph +658 replacements +70 transport =2442 tests, zero failures/skips/cancellations. Typecheck, provenance and private binding preflight also passed; the8existing qualified bindings were read back, not newly executed. Main read the final log and independently repeated the8focused provenance/graph cases, provenance verification and diff-check: all passed. These are harness tests, not2442 product scenarios. Root packaging tests passed52/52 before changing component pins. The source-projection checks passed with the exact delta above.

The final full-gate log SHA256 is `514efe9e956adbb39f4b03b7d4c435814b9486c6db9e499280e9c9a696410046`; Main projection-summary SHA256 is `22b01ccc7da7fe907b971d5eb99d178c9d1dc3f317ee582f13bbd86f8b1a01ac`. Raw output is retained outside tracked sources under `/private/tmp/qa-graph-reuse-20260909.ZQiuTIi4/`. The complete-history Freeland bundle SHA256 is `8789ca70ea15d1829ac59090e65e9408a1c26152fc101ababb25dbed39015d27`; verification in an empty bare Git store succeeded without prerequisites. Root cold-source delivery is a separate packaging check, not a campaign.

The graph regression uses the real QA corpus and a deliberately bounded source inventory with basename rivals. It tests current resolution, retained gaps, missing-path/removed-override negatives, and full/manual-pending selection. It is a topology regression, not an execution of the product branches.

The PRODUCT-MAP byte change also requires updating its existing expected digest in the provenance test. This is an intentional reviewed-source update: no digest assertion is removed, and the reference baseline remains unchanged. Initial sandbox loopback restrictions and the subsequent old-fixture-digest RED remain separate from any final successful rerun.

No deployment, product edit, payment, tracker write, accepted-root promotion, cloud work or historical evidence rewrite is authorized by this result. Re-export the Obsidian view only from a reviewed integrated graph generation; the previous view remains a historical observation until then.

## Cold source delivery

Final cold-source delivery passed at root `ab9da25294fb221dc6d73c0668ab8ceca7007558`, tree `656196fcaba1c9bd02284a40eaf5d5bd68e9916b`: an independent `git clone --no-local` ran its own `sources:restore`, `sources:verify` and root `npm test`, all exit0,52/52 tests without failures/skips/cancellations. Root and all four children remained clean at their expected pins; no dependency directories were copied or installed. This satisfies the independent packaging review's delivery condition, not accepted-root promotion, private state adoption or product execution. Completion/audit record `.local/qualification/graph-reuse-cold-20260909.json` has SHA256 `5ef4732d14a016bdfbf0cda153856b963666824c8e6af4b59bd31b91734f5c4c`; raw task paths are retained, not included in the source bundle. This documentation-only follow-up does not reattribute the cold result to a later commit.

## Next useful slice

Continue Task3A.2 with actual money/concurrency assertions: B11 amount/currency mismatch must prevent provisioning; D7 lock-refused contenders must not call the provider, and unique-conflict recovery must reuse a valid winner without another provider attempt. Actual database concurrency/TTL semantics and global external-resource uniqueness remain separate pending checks. First reuse existing product or QA checks, including the existing VELVET amount-mismatch negative. If the available runner cannot observe those boundaries, retain the gap and make a specific testability request rather than link a partial test as full coverage. Product code remains read-only and this plan does not require real purchases.
