# Passive capture (P01, experimental)

**Experimental source, not an active managed QA capability.** The agent calls it from its own Playwright session at
states it has already reached. It never crawls, clicks, types, scrolls or navigates. Its output is a list of
**candidates, never verdicts**. Like `tools/android-pilot`, it is not a Kernel adapter. It adds no store, runner,
schema or dependency.

## Why
- **The target class.** In the first end-to-end ToolShop run (2026-10-10), most misses in the a11y and visual
  consistency classes were already in the saved evidence, but nobody claimed them. A later generic LLM review of that
  evidence recovered text and flow defects. It still missed consistency defects between look-alike elements: alignment,
  button geometry, input padding and contrast. This tool targets that class, using computed styles and geometry.
- **What it avoids from the earlier prototype.** That prototype crawled on its own. It reached two pages of an SPA and
  drowned in modal-overlay noise.

## Use
```js
// inside the agent's own Playwright script, after reaching a state worth keeping
import { captureState } from '<toolbox>/tools/passive-capture/capture.mjs';
await captureState(page, { dir: EVIDENCE_DIR, label: 'register-empty', axeSource: OPTIONAL_AXE_MIN_JS });
```
```sh
node tools/passive-capture/detect.mjs EVIDENCE_DIR   # writes EVIDENCE_DIR/passive/candidates.{json,md}
```

**When to capture.** Capture once per distinct reached state: each page, checkout or wizard step, open dialog, and
each viewport you check. Use a stable label per state.

**What one capture writes** under `passive/`:
- `<label>.facts.json`: computed style, geometry, accessible names and labels, overlay state;
- `<label>.png`: a full-page screenshot;
- `<label>.aria.yml`: the Playwright aria snapshot;
- `<label>.dom.html`: the body HTML, bounded to 2 MB;
- `<label>.axe.json`: axe results, or an explicit unavailability record. A missing axe is never a pass.

It also appends one line to `index.jsonl` with the URL, time, viewport and capture time.

**Privacy.** These files hold what the page showed, so treat them like screenshots of that state. Keep them inside the
run's private evidence.

## Detectors

| Detector | Candidate |
| --- | --- |
| `style` | a look-alike repeated element whose text-align, font family or font size differs from most siblings in the same state; options of one select with different font sizes |
| `alignment` | repeated items aligned differently on one page than the same kind of item on most other pages (at least 3 pages) |
| `padding` | an input with smaller left padding than most captured inputs. Larger padding is usually a designed icon slot and is ignored. |
| `geometry` | a form's primary action much narrower or differently aligned than in most captured forms (at least 3 forms), or aligned to nothing |
| `contrast` | axe color-contrast when axe ran; otherwise WCAG contrast computed on solid backgrounds only (image and translucent backgrounds stay unassessed) |
| `a11y-name` | a control with no accessible name; a field with no label, or identified only by its placeholder |
| `axe` | other axe violations from a short, fixed rule list |

**Excluded from all detectors:**
- elements under an open dialog, or under a fixed layer covering at least 40% of the viewport;
- disabled controls, for contrast.

Typos and wording are out of scope; an evidence review covers them better.

## Triage (mandatory)
- **Every row needs a disposition:**
  - **finding**, after your own check on the product;
  - **dismissed: <reason>**, for example designed emphasis or a brand style.
- **Record each confirmed row** with the existing `record-observation` command, as an agent-authored observation that
  cites the capture files. See `components/console/skills/qa-product-v0/references/agent-observations.md`.
- **Do not count candidates as defects.**

## Controls
- **Unit controls:** `node --test tests/passive-capture.test.mjs`, run by root CI. Each detector is checked against a
  healthy input, an injected failure and a healthy sibling. The checks cover:
  - overlay exclusion;
  - the axe-unavailable path;
  - merging of the same candidate across states.

  Every control was mutation-checked: breaking the guarded line makes a test fail.
- **Local browser control:**
  ```sh
  node tools/passive-capture/browser-control.mjs --playwright-from components/console --out DIR [--axe .../axe-core/axe.min.js]
  ```
  It captures the static fixtures in `fixtures/` with a real Chromium page. It requires exactly the expected six
  candidates and none from the modal state.

## Status and limits
- **Not adopted.** Adoption depends on the pre-registered blind measurement: a non-ToolShop product with a hidden key and
  an independent evaluator.
- **No usefulness proven yet.** The ToolShop numbers are development-set only, and the unit and fixture controls prove
  the mechanism, not usefulness.
- **Single engine and viewport:** Chromium only, one viewport per capture. Translucent and image backgrounds are not
  assessed for contrast.
