# Passive capture (P01, experimental)

**Experimental source, not an active managed QA capability.** The agent calls it from its own Playwright session at
states it has already reached. It never crawls, clicks, types or navigates. A full-page screenshot temporarily resizes
the viewport and, when axe-core is supplied, axe injects its script; both can trigger page handlers. Its output is a list of
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
- `<label>.facts.json`: computed style, geometry, accessible names and labels, active context;
- `<label>.png`: a full-page screenshot;
- `<label>.axe.json`: axe violations of a short fixed rule list, reduced to the node target and, for contrast, the
  colour and ratio fields; or an explicit unavailability record. A missing axe is never a pass, and no axe row is not a
  pass either.

No raw DOM or aria snapshot is collected or written.

It also appends one line to `index.jsonl` with the URL, time, viewport and capture time.

**Privacy (residual scope).** Two channels are no longer collected or written: the raw DOM snapshot and the aria
snapshot. They had carried typed field values, masked passwords and hidden-input values. axe output is reduced to node
targets and contrast fields. What remains can still hold private data:
- the facts keep visible texts, labels, placeholders, selectors and URLs, and the `value` of any control named by its
  value (for example a button, or any input given `role=button`);
- the screenshot shows whatever the page displayed, including typed values that were visible.

There is no general guarantee for masked passwords on arbitrary markup. Keep the files in the run's private evidence,
and capture only synthetic or non-sensitive states until capture authority covers this residual data. This is
minimisation, not redaction: nothing is masked in the live page and old evidence is not cleaned.

## Detectors

| Detector | Candidate |
| --- | --- |
| `style` | a look-alike repeated element whose text-align, font family or font size differs from most siblings in the same state; options of one select with different font sizes |
| `alignment` | repeated items aligned differently on one page than the same kind of item on most other pages (at least 3 pages) |
| `padding` | an input with smaller left padding than most captured inputs. Larger padding is usually a designed icon slot and is ignored. |
| `geometry` | a form's primary action much narrower or differently aligned than in most captured forms (at least 3 forms), or aligned to nothing |
| `contrast` | axe color-contrast when axe ran; otherwise WCAG contrast computed for rgb text on a solid rgb background only (other cases are counted as unassessed) |
| `a11y-name` | a control with no accessible name (native submit/reset names when no `value` attribute is given, and image-input `alt`, count as names; an explicitly blank value does not); a text-like field, select or textarea with no label, or identified only by its placeholder. Button-type inputs are controls, not fields. |
| `axe` | other axe violations from a short, fixed rule list |
| `text-hygiene` | captured active, non-disabled element text, control name, field label or placeholder containing `[object Object]`, `Invalid Date`, or the case-sensitive tokens `undefined`, `null` or `NaN` bounded by a string edge or a character that is not a Unicode letter, number or underscore. **Convention-based candidate, not a norm:** a code sample, a mathematical text or an intentionally shown empty value can match and is dismissed in triage. The message and key carry no surrounding text. No candidate is not a check of all text: element text is captured up to its first 160 characters and control names taken from visible text up to 80, markers beyond that are not inspected, and truncated facts are reported. A natural-language word (for example German "null" meaning zero) is another legitimate dismissal. |

**Active context (own detectors only).** Only demonstrably inactive content is excluded: anything inside an `[inert]`
subtree, and anything outside the single open native modal `<dialog>` (`showModal`). An open modal escapes the
inertness of its ancestors; explicit `[inert]` on or inside it still applies. With more than one open modal, the
blocking one cannot be derived from DOM order. In that case no modal-based exclusion is made, and the facts record
`ambiguousModal`. This is a selection policy, not a claim
about visual occlusion. Non-modal dialogs, fixed sidebars or other fixed layers, and `aria-modal` declarations exclude
nothing; `aria-modal` is recorded in the facts for triage. Disabled controls are also skipped. axe rows are a
separate stream, and this policy does not filter them.

**Contrast coverage.** Without axe, contrast is computed only for an `rgb()` foreground on a solid `rgb()`
background. Unsupported colour formats (for example `oklch`, `lab`, `color()`), image backgrounds and translucent
backgrounds stay unassessed. They are counted with a reason in `candidates.md` and `candidates.json`, never given a
ratio. No candidate there is not a pass.

Typos and wording are out of scope; an evidence review covers them better. The fixed serialization markers above are the only text rule.

## Triage (mandatory)
- **Every row needs a disposition in your existing notes:**
  - **finding**, after your own sufficient check on the product;
  - **hypothesis**, with its basis and the evidence still missing;
  - **dismissed: <reason>**, for example designed emphasis, a brand style or an intentional literal;
  - **unassessed**, with the reason and the follow-up.
- **This is triage wording, not a new persisted status or gate.**
- **Record each confirmed row** with the existing `record-observation` command, as an agent-authored observation that
  cites the capture files. See `components/console/skills/qa-product-v0/references/agent-observations.md`.
- **Do not count candidates as defects.**

## Controls
- **Unit controls:** `node --test tests/passive-capture.test.mjs`, run by root CI. Each detector is checked against a
  healthy input, an injected failure and a healthy sibling. The checks cover:
  - inactive-context exclusion;
  - the axe-unavailable path;
  - merging of the same candidate across states.

  Every control was mutation-checked: breaking the guarded line makes a test fail.
- **Local browser control:**
  ```sh
  node tools/passive-capture/browser-control.mjs --playwright-from components/console --out DIR [--axe .../axe-core/axe.min.js]
  ```
  It captures the static fixtures in `fixtures/` with a real Chromium page and checks paired expectations per fixture:
  - a defect outside a small non-modal dialog, a large fixed sidebar or an aria-only modal is still found;
  - nothing outside a native modal or inside `[inert]` is flagged, while a broken control inside the native modal is,
    including a modal opened under an inert ancestor;
  - two open modals are reported as ambiguous and nothing is suppressed;
  - button-type inputs give no field rows, and genuinely nameless controls and unlabeled fields are flagged;
  - an unsupported colour is counted as unassessed and gets no ratio;
  - with `--axe`, axe actually ran on every state and its nodes keep only the allowed fields;
  - only facts, axe and screenshot files are written;
  - the typed-password and hidden-input canaries appear in none of the text artifacts (facts, axe, index, candidates).
    Screenshots are not inspected.

## Status and limits
- **Not adopted.** Adoption depends on the pre-registered blind measurement: a non-ToolShop product with a hidden key and
  an independent evaluator.
- **No usefulness proven yet.** The ToolShop numbers are development-set only, and the unit and fixture controls prove
  the mechanism, not usefulness.
- **Single engine and viewport:** Chromium only, one viewport per capture.
- **Not handled:** custom (non-native) modal layers are not detected as inactive; shadow DOM and iframe content are not
  inspected; text over positioned image layers is judged against its ancestor background colour; names from descendant
  `svg` titles are not read; `start`/`end` alignment is read as left-to-right.
