# Passive capture (P01, experimental)

**Experimental optional local tool, not a qualified managed QA capability.** The agent explicitly calls it from its own Playwright session at
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
// inside the agent's own Playwright script
import { captureState } from '<toolbox>/tools/passive-capture/capture.mjs';
import { trackReached } from '<toolbox>/tools/passive-capture/reached.mjs';
const reached = await trackReached(page, { dir: EVIDENCE_DIR });   // once per page, before navigating it
// ... after reaching a state worth keeping:
await captureState(page, { dir: EVIDENCE_DIR, label: 'register-empty', axeSource: OPTIONAL_PATH_TO_AXE_MIN_JS });   // a file path, not the script text
// ... at the end, before detect:
await reached.stop();   // flushes reached.jsonl and rethrows a failed write
```
```sh
node tools/passive-capture/detect.mjs EVIDENCE_DIR [--dictionary WORD_LIST]   # writes EVIDENCE_DIR/passive/candidates.{json,md} and partitions.json
```

**When to capture.** Capture once per distinct reached state: each page, checkout or wizard step, open dialog, and
each viewport you check. Capture one product per evidence dir: cross-page detectors compare every captured page of one viewport
width, so unrelated sites on one origin would be held to each other's conventions. Use a stable label per state. A label already used in the evidence dir (compared ignoring case,
because a case-insensitive file system stores `Home` and `home` in one file) is refused with an error before the page is
touched, and capture files are created only if absent, so an earlier capture is never overwritten.

**Word list (optional).** `rare-variant` needs a caller-supplied word list, one word per line (for example
`/usr/share/dict/words`), passed as `detect.mjs EVIDENCE_DIR --dictionary FILE`. Without one the family emits no row and
`candidates.md` says `rare-variant: unassessed (no dictionary supplied)`; `candidates.json` carries `rareVariant`
with the assessment/reason, dictionary size and distinct captured/known-word denominator and share. The list must match the page language and know at least half of the captured words of four or more letters, directly or as regular English inflections. Otherwise this family is unassessed with no row. No system dictionary is selected automatically. LF, CRLF and CR are supported; a line with multiple words, an empty or unreadable list is refused. A missing modern, domain, compound or irregular word can remain a candidate; German mid-sentence capitalized nouns can be read as names. The fit guard is not a quality score.

### Optional pooled-style analysis of already saved facts

Standalone invocation from any cwd, with absolute tool/evidence paths:

```sh
node /ABS/TOOLBOX/tools/passive-capture/detect.mjs /ABS/OWN/EVIDENCE --pooled
node /ABS/TOOLBOX/tools/passive-capture/detect.mjs /ABS/OWN/EVIDENCE --dictionary /ABS/WORDS --pooled
```

Opt-in analysis only: no second crawl, collector, gateway wiring, role acquisition
or default enablement. Use only the existing authorized derived-output invocation
in your own evidence directory; tool adoption does not permit overwriting frozen or
gateway-owned evidence. Outputs remain `passive/candidates.json`, `candidates.md`
and unchanged `partitions.json`. Without `--pooled`, default bytes/IDs are unchanged.
The flag and optional `--dictionary FILE` may appear in either order, once each;
malformed/repeated flags refuse with exit2.

- `pooled-outlier`: per evidence-dir origin, viewport width and supplied role;
  75% of voters, at least3 agreeing states on2 query-stripped routes. Fewer than4
  states cannot give an outlier. Repeated captures weight votes; query-stripped
  routes are not independent or identical semantic states. Same-route differences
  and multi-property variants stay contextual spread.
- `form-font`: inferred members from saved text/counts, **not exact DOM ownership**;
  4 members/75% dominance, family spanning2 roles; sizes within role/sub-kind.
  Ambiguous/not-located members are counted, not compared.
- `sibling-color`:4 or more non-interactive siblings,75% of the others agreeing;
  shared two-colour patterns and multi-property variants excluded.

Thresholds are heuristics, not design norms, calibrated confidence or proof of
fixture independence. Candidates are low severity/confidence; an odd state may be
intended. Interactive colour/background/weight, table cells, glyphs, generic
monospace, unknown/image/gradient backgrounds and ambiguous members stay excluded.
Named monospace without a generic family can compare: convention false positives
remain possible. Suppression proves no design intent or absence of a bug.
**Help-text font detection is UNSUPPORTED on this capture base:** `hint` facts are
absent; synthetic hint controls test logic only. No hint collector is included.

Missing role/viewport means unknown, not equal identity; same-role/viewport
comparability is not established for such pools. Current capture/CLI supplies no
role qualification. Pure functions honour supplied nonblank roles and refuse
malformed ones. Six-level path selectors can collide; inferred members/locators
can miss or falsely associate elements. Inspect original saved facts and authorized
images before an applicable conclusion.

Pooled candidates append after default IDs, which identify this capture/output
snapshot, not durable objects across changed inputs. Optional `basis` is a
representative merged basis, not independent proof for every occurrence; existing
evidence cap6 remains. Additive default/pooled duplicates may describe the same
property, not extra coverage or unique bugs. During agent triage, associate possible
duplicates by object/state/property; no automatic suppression or identity engine. `pooled.spread` is
contextual distribution, **not candidates/dispositions or triage denominator**.
JSON keeps every spread row; Markdown shows at most40 with the exact omitted count.
Counts do not establish completeness or utility. **The absence of candidates or
spread rows does not establish PASS.**

**What one capture writes** under `passive/`:
- `<label>.facts.json`: computed style, geometry, accessible names and labels, active context; focusable elements
  (tabindex attribute, box, text direction), radio/checkbox sets sharing a name with their grouping container, and images
  (alt absent, empty or present, role, aria-hidden, name source, load state; no alt text and no source URL is stored);
  fields also record their class signature, their parent's signature and the width of their form (or of their parent
  outside a form). Text elements also record their computed display, their effective opacity when below 1 (the product over
  their ancestors; 0 means not rendered at capture), a background kind `layer` when an image, video, canvas, svg, iframe,
  background image or gradient (also one painted by `::before`/`::after`) that is not their ancestor covers at least half of
  their box inside the element holding their background colour, or when an ancestor's positioned `::before`/`::after` paints a
  background image; the opacity of that background holder when below 1; and, for a text of at most two characters without a
  letter or digit, whether letter or digit text sits beside it and whether it is the whole text of the nearest control or table
  cell. Focusables in a fixed or sticky layer record that layer. Fields also record their declared constraints, read from
  attributes only: `required`, `readonly`, `multiple`, `minlength`, `maxlength`, `min`, `max`, `step`, `pattern` (up to 200
  characters), `accept`, `autocomplete` and `inputmode`, as written; never a value, default value or checked state. File inputs not
  visible at capture (often opened through a styled button or label) are only counted;
- `<label>.png`: a full-page screenshot;
- `<label>.axe.json`: axe violations of a short fixed rule list, reduced to the node target and, for contrast, the
  colour and ratio fields; or an explicit unavailability record. A missing axe is never a pass, and no axe row is not a
  pass either.

No raw DOM or aria snapshot is collected or written.
axe keeps at most 20 nodes per rule and records nodesTotal; reports name clipped rules. Missing rows beyond that bound are not a pass.

It also appends one line to `index.jsonl` with the URL, time, viewport and capture time.

**What tracking writes.** `trackReached` only listens. For the route shown when it starts and for every later main-frame
navigation (a full load, `history.pushState` or a fragment change; iframes are ignored) it appends `{url, at}` to
`reached.jsonl`. The `url` is a route: scheme, host, path and fragment. Query values, credentials and fragment parameters
(from the first `?`, `&` or `=` in the fragment on) are never written. Only http, https and file URLs are recorded.

**Privacy (residual scope).** Two channels are no longer collected or written: the raw DOM snapshot and the aria snapshot. Element text can retain textarea default content and option texts; this residual is pinned by a synthetic canary. Capture only within applicable authority. No response observer, response-body capture or response-ledger capability is included in this slice.
The removed channels had carried typed field values, masked passwords and hidden-input values. axe output is reduced to node
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
| `style` | a look-alike repeated element whose text-align, font family or font size differs from most siblings in the same state; options of one select with different font sizes. Look-alikes share their parent and own class signatures after utility classes are stripped; when no class is left on either (bare tags such as div>p), only true siblings of one parent are look-alikes. text-align is compared for block boxes only (an inline-level box shrinks to its text). Not a candidate: an odd value shared by 3 or more members of the group, long-text members included (a second variant); a member that differs in two or more of alignment, family, size, weight and colour (a designed variant such as a totals row); an element not rendered at capture (opacity 0 on an ancestor) |
| `alignment` | repeated items aligned differently on one page than the same kind of item on most other pages (at least 3 pages); block boxes only, rendered items only, kinds as in `style` |
| `property-outlier` | one page whose repeated items of one kind (same parent and own class signature, at least 2 per page) differ from the same kind on most other pages in font size, font family, font weight, left or right padding, or, for text-like fields of one tag and type, width relative to their form or container. Needs at least 3 pages and a clear majority (60 %); a page votes only with a value more than half of its own items share, and one URL counts once. Widths match within 5 percentage points of the container or 4 px, so a field with the same share of a wider form, or the same pixel width in another form, is not a candidate. Text alignment stays with `alignment`. Pages are compared per viewport width (a desktop and a mobile capture of one URL are two pages of two groups), kinds are keyed as in `style`, and a kind whose font family differs on every page that has one is not compared at all (different design systems or products; counted in `candidates.md`). **The majority is not a design rule:** the odd page may be the intended one. |
| `broken-image` | a rendered, active `img` that completed loading without a decoded size (`naturalWidth` 0) although it has a source: the source failed or is not an image. The source URL is not stored, and an environment cause (a blocked or offline resource) is a legitimate dismissal. Not assessed and counted instead: an svg source (it may have no intrinsic size), an image without a source (no or empty `src`), and an image not loaded at capture (lazy beyond the viewport, or still in flight). |
| `padding` | an input with smaller left padding than most captured inputs. Larger padding is usually a designed icon slot and is ignored, and an input whose box lies outside the page is not counted. |
| `geometry` | a form's primary action much narrower or differently aligned than in most captured forms (at least 3 forms of one viewport width whose primary action uses the same font family), or aligned to nothing. A field whose box lies outside the page (a honeypot parked off-screen) is not part of the input column |
| `contrast` | axe color-contrast when axe ran; otherwise WCAG contrast computed for rgb text on a solid rgb background only. Ancestor opacity below 1 fades the text into that background. Counted as unassessed instead: image backgrounds, an image or gradient layer under the text that is not its ancestor (bg kind `layer`), translucent or faded backgrounds, unsupported colours, and a separator glyph (dot, bullet, slash, bar, dash, multiplication sign or cross; at most two characters) between text runs, which is incidental decoration unless it is the whole visible text of a control or table cell. Text under an opacity-0 ancestor (not rendered at capture, e.g. before a scroll reveal or in a stacked animation state) is still compared as authored, at low confidence and with a note. One row per colour pair and threshold; a repeated copy of the same text in a state (a loop or marquee clone) adds no evidence; the headline and first evidence are the rendered, on-screen element with the most letters |
| `a11y-name` | a control with no accessible name (native submit/reset names when no `value` attribute is given, and image-input `alt`, count as names; an explicitly blank value does not); a text-like field, select or textarea with no label, or identified only by its placeholder. Button-type inputs are controls, not fields. |
| `axe` | other axe violations from a short, fixed rule list |
| `positive-tabindex` | an active element whose `tabindex` attribute is above 0, which overrides the document focus order. **Convention-based:** an intended order is a legitimate dismissal. Attribute only; no key is pressed. |
| `ungrouped-choice` | two or more rendered radio or checkbox inputs sharing a name in one form with no group name, so the group question may not be announced: no enclosing fieldset with a non-empty legend and no `role=group`/`radiogroup` named by aria-label, resolved aria-labelledby or title. Members inside `aria-hidden` are not counted. A row-selection checkbox set in a data table can match and is dismissed in triage when its headers give the context. |
| `img-alt-missing` | only when axe did not run for the state: a rendered `img` with no `alt` attribute, no aria-label, resolved aria-labelledby or title, not `role=presentation`/`none` and not inside `aria-hidden`. `alt=""` (or whitespace only) is decorative and healthy. When axe ran, its `image-alt` rule reports this class instead. |
| `focus-order` | **Low-confidence candidate, never a failure.** In the default sequence (tabindex absent or 0, active, not disabled, box inside the page), a later element displayed before the previous one on the same line (by its text direction), or fully above it in an overlapping horizontal range. Steps are taken within one layer: the document flow, or one fixed or sticky layer (a floating button, a sticky header, a native modal), whose boxes at scroll 0 have no place among the document's. One row per run of consecutive steps. A new column that starts higher up is not a candidate. Only DOM order and boxes are compared; no key is pressed, so the actual Tab sequence stays unassessed. |
| `text-hygiene` | captured active, non-disabled element text, control name, field label or placeholder containing `[object Object]`, `Invalid Date`, or the case-sensitive tokens `undefined`, `null` or `NaN` bounded by a string edge or a character that is not a Unicode letter, number or underscore. **Convention-based candidate, not a norm:** a code sample, a mathematical text or an intentionally shown empty value can match and is dismissed in triage. The message and key carry no surrounding text. No candidate is not a check of all text: element text is captured up to its first 160 characters and control names taken from visible text up to 80, markers beyond that are not inspected, and truncated facts are reported. A natural-language word (for example German "null" meaning zero) is another legitimate dismissal. |
| `rare-variant` | **Low-confidence candidate, not a spell check; only with a caller-supplied word list.** A captured word of 4 or more letters that occurs once (counted once per page, element and channel) while a close variant occurs at least 3 times: same first letter, neither word begins with the other (so loan/loans and renew/renewal are not compared), and one edit apart, or two once both words have 6 letters or more (an adjacent transposition is one edit). The rare word must be unknown: not in the word list, not a regular inflection (-s, -es, -ies, -ed, -d, -ied, doubled consonant, -ing, -er(s), -ly, -ily) of a listed word or of a word captured at least 3 times, and not a name (capitalised mid-sentence in a sentence-case string and never lowercase); a frequent name is no variant either. Words are case-folded, composed Unicode letter runs from active element text, from control names and field labels not taken from element text (aria-label, title, value, alt), and from placeholders; chunks with digits, underscores, dots, slashes, `@` or camelCase are skipped as numbers or identifiers, and a word cut at the 160-character text limit is dropped. A rare word with a diacritic its close variant lacks (often another language), and a rare name, are counted as not compared. Without a word list no row is emitted and the family is reported as unassessed. A misspelling seen twice or more, one that is another real word (then/than), a misspelt inflection of a known word, and a word at a sentence start that is a name are not found; a modern, domain or compound word missing from the list can be a candidate and is a dismissal. |
| `label-mismatch` | **Low-confidence candidate.** For an active, non-disabled text-like field with a name or id word of 3 or more letters: its label or placeholder holds every word of another text-like field's name or id in the same form that its own lacks, and no word that only its own name or id has (label "City" on field `country` beside field `city`); or a label or placeholder word of 4 or more letters is a close variant (as above) of a word of its own name or id (label "Humidty" on field `humidity`). Names and ids split at case changes, digits and punctuation; no value is read. Not compared and counted: fields without a name or id word, a label that wraps a select or textarea (its text holds the options or content), and label words with a diacritic the name or id lacks (a translated label). A label naming another field in passing (for example "Email or phone") is a legitimate dismissal. |

**Active context (own detectors only).** Only demonstrably inactive content is excluded: anything inside an `[inert]`
subtree, and anything outside the single open native modal `<dialog>` (`showModal`). An open modal escapes the
inertness of its ancestors; explicit `[inert]` on or inside it still applies. With more than one open modal, the
blocking one cannot be derived from DOM order. In that case no modal-based exclusion is made, and the facts record
`ambiguousModal`. This is a selection policy, not a claim
about visual occlusion. Non-modal dialogs, fixed sidebars or other fixed layers, and `aria-modal` declarations exclude
nothing; `aria-modal` is recorded in the facts for triage. Disabled controls are also skipped. axe rows are a
separate stream, and this policy does not filter them.

**Contrast coverage.** Without axe, contrast is computed only for an `rgb()` foreground on a solid `rgb()`
background. Unsupported colour formats (for example `oklch`, `lab`, `color()`), image backgrounds, image or
gradient layers under the text, translucent or faded backgrounds and separator glyphs between text stay unassessed. They are
counted with a reason in `candidates.md` and `candidates.json`, never given a ratio. No candidate there is not a pass.

Captures made before the focus, choice-group and image facts existed are listed in `candidates.md` as unassessed for those
four rows, never as clean. Likewise, captures without field kind, field container or image load facts are listed as unassessed
for cross-page field properties and failed images.

**Cross-page and image coverage.** `candidates.md` states how many repeated item or field kinds were seen on at least 3
pages and compared, and how many were seen on fewer pages and not compared. A kind counts as compared only when at least one
property had a page value (a value more than half of a page's items share) on at least 3 pages. Kinds on enough pages without
any such property, and single properties of compared kinds without one, are counted on a separate line as not compared.
Kinds whose font family differs on every page are counted on their own line as not compared across type families. Counts are
summed over viewport widths, each width compared on its own. The count of images whose loading was not assessed is also given, with the reason. No candidate there is not a pass.

Wording is compared only as `rare-variant` and `label-mismatch` describe: rare captured words against frequent ones, gated by
the caller's word list, and labels against field names and ids. It is not a spell check, and an evidence review still covers
wording better. `candidates.md` states the comparison rule (or that rare-variant is unassessed without a word list), the number
of fields compared, and the fields and rare words not compared, with the reason. No candidate there is not a pass.

**Reached routes (remainder, not a candidate).** With a `reached.jsonl` ledger, `candidates.md` states how many distinct
routes were reached and how many have a captured state (a capture's URL is compared as a route too), and lists every
reached route without one under `Reached, not captured, unassessed`. This is remainder, not a defect: no detector inspected
those routes. The same line says that only routes a tracked page navigated to after tracking started are listed, that the
ledger is complete only if `stop()` was awaited, and that this is not a route inventory. Without a ledger it says that routes
reached but not captured are unknown. `candidates.json` carries the same
as `reached` (`{ledger: 'absent'}` or `{ledger: 'recorded', routes, captured, uncaptured}`), beside the candidates and not
counted in them. Labels that older evidence holds more than once are listed in `duplicateLabels` and in `candidates.md`;
earlier states under such a label can be unassessed.

**Input partitions (worklist, not candidates).** `detect.mjs` also writes `partitions.json` and ends `candidates.md` with
`Input partitions to try (not executed)`. From the declared constraints of the captured fields only, it lists the partitions an
agent could try later, each row marked `requires write authority` and `not executed`: P01 never types, so it executes none of
them, and any result belongs to the agent's own records. HTML declarations supply test ideas, not a business oracle or permission to execute. A bound proposal applies only to that one constraint: other constraints and business rules are not evaluated, and file accept filters the picker rather than proving application acceptance. Rows are planned checks, not candidates; they are not counted with the
candidates and need no disposition.
- **Rows, only where the browser applies the attribute (HTML constraint validation):** `empty` for `required` (a radio group once,
  required when any member is); `length-at-min`/`length-under-min` and `length-at-max`/`length-over-max` for `minlength` (above 0;
  no under-min row that would be empty) and `maxlength` on text-like fields and textareas; `type-malformed` for `type=email` and
  `type=url`; `pattern-outside` (probe not derived); `at-min`/`below-min`, `at-max`/`above-max` and `off-step` for `min`, `max` and
  `step` on number, range and date fields (one declared step beyond a bound, or the type's default step when none is declared or the
  declared one is invalid; `off-step` only for a declared step, halfway between two allowed numbers or one day off a step of 2 days
  or more, from a valid `min`); for month, week, time and datetime-local only the declared bounds, with the probes beyond them left
  to the agent; `accept-inside` per accepted token and one `accept-outside` file for `accept` on file inputs.
- **Duplicate identity, a suggestion only:** uniqueness is never declared. A field whose `autocomplete` names `email` or `username`
  in a form that declares `autocomplete=new-password` and no `current-password` (a sign-up context read from the autofill tokens
  alone) gets one `duplicate-identity` row marked as a suggestion.
- **Never invented:** a field without a declared constraint gives no row (that does not mean it is unconstrained); `inputmode`, an
  attribute the browser ignores for the type (for example `maxlength` on a number field) and a value that is not valid for the type
  give no row and are counted. Probes are synthetic (`missing-at-sign.example`, a length, a computed number or date, `probe.<ext>`);
  a probe that cannot be derived from the declaration is `null` ("not derived") and counted.
  Decimal/date probes round-trip to an exact valid value strictly beyond the bound, or remain null. An at-max off the declared step grid from min is not derived. Length probes over 1,000,000 characters remain null. Each row carries its partition-specific expectation, not an entire-input PASS.
- **Not listed and counted:** inactive (inert or outside the native modal), disabled, read-only and off-page fields. Captures whose
  fields carry no constraint facts (older captures) are listed as unassessed. One route (query values dropped), form and selector
  is one field: a form captured at two widths gives one row per check listing both states.

## Triage (mandatory)
Not-rendered contrast is a separate authored-style candidate, not a currently visible defect and never part of a rendered confirmed-defect count. Candidate mechanisms and synthetic controls do not establish managed adoption, held-out usefulness, product recall or quality uplift. Invocation remains explicit and optional.
- **Every row needs a disposition in your existing notes:**
  - **finding**, after your own sufficient check on the product;
  - **hypothesis**, with its basis and the evidence still missing;
  - **dismissed: <reason>**, for example designed emphasis, a brand style or an intentional literal;
  - **unassessed**, with the reason and the follow-up.
- **This is triage wording, not a new persisted status or gate.**
- **Record each confirmed row** with the existing `record-observation` command, as an agent-authored observation that
  cites the capture files. See `components/console/skills/qa-product-v0/references/agent-observations.md`.
- **Do not count candidates as defects.**

## Optional saved-data lexical index and partitions v2

Resolve this delivered README and the adjacent `triage-coverage.mjs` to an absolute path; use Node from the existing operator-selected trusted PATH. From any notes cwd:

```sh
node ABS_ROOT/tools/passive-capture/triage-coverage.mjs --out DERIVED --notes SELECTED_NOTES reader=EVIDENCE_DIR
node ABS_ROOT/tools/passive-capture/triage-coverage.mjs --partitions-v2 --out DERIVED --notes SELECTED_NOTES reader=EVIDENCE_DIR staff=OTHER_EVIDENCE_DIR
```

All placeholders are explicit authorized paths, not machine defaults. Each evidence directory must already hold `passive/index.jsonl` and detector `candidates.json`; optional `--observations FILE_OR_DIR` reads selected JSON strings as lexical citations, not qualified stored observations. No capture, navigation, upload, row execution, owner/checkpoint write or gateway action occurs. A missing trusted runtime or delivered source is unavailable, not permission to install or use another checkout.

Default output is only `triage-coverage.json` and `.md`, a deterministic lexical mention index and reviewer artifact navigation. `mentionFound` does not establish disposition correctness: negated, shared, ordinal-only, stale or copied text may match. Counts are not quality, PASS, sufficiency, U−V or a completion gate. Compare original text, pointer/digest, cited and uncited artifacts and missing/skipped sources; ordinary owner readback remains separate. Explicitly exclude pasted generated reports from selected notes; never use generated output as independent evidence.

`--partitions-v2` additionally writes `partitions-v2.json` and `.md` in DERIVED, with one separately labelled worklist per supplied evidence directory, never a cross-role merge. It composes existing saved facts with optional pure v2 inference; `detect.mjs`, v1 `passive/partitions.json`, exact reached remainder and collection defaults are unchanged. Latest capture per label is not full history: duplicate labels/earlier captures, missing artifact names and absent hint facts stay qualified. Old facts without `fileInputs` leave help-text/aria-required/hidden-file applicability unassessed (`hintFactsMissing`); this command collects no new facts. Stated/inferred ideas retain `expectation:null`, `applicability:unknown` and source, not a norm or verdict. Declared v1 rows retain their expectations, with the explicit v2 duplicate-identity suggestion exception downgraded to inferred/null. Confidence is a source class, not a probability. W/P IDs are navigation references; recording an actual observation still needs its registered check/target/oracle binding and existing authority.

DERIVED must be outside every supplied and canonical evidence/notes/JSON-input container, including a selected file's parent, but within already-authorized output roots. A layout such as selected `notes/triage-inputs` and output `notes/derived` works only when both are disjoint from selected evidence. `--notes notes --out notes/derived` refuses. Do not silently copy/reclassify inputs or invent an output grant. Never write these extra files into gateway-owned passive inventory. All selected input validation and all output-leaf checks complete before writes; symlink leaves, non-regular leaves and multiply-linked leaves refuse, with no companion publication. Ordinary singly-linked reports may be replaced. These are cooperative static-path protections, not a same-UID concurrent filesystem-race sandbox or transactional publication guarantee.

Retained outputs copy source text/provenance and existing page-controlled hints, which may contain personal data despite value exclusion; select and handle them under existing retention authority. No hint/hidden-input extractor extension or auto-capture is delivered. Successful analysis proves only these supplied saved inputs were processed, not full state coverage, usefulness, recall or an independent review.

## Controls
- **Unit controls:** `node --test tests/passive-capture.test.mjs`, run by root CI. Each detector is checked against a
  healthy input, an injected failure and a healthy sibling. The checks cover:
  - inactive-context exclusion;
  - the axe-unavailable path;
  - merging of the same candidate across states;
  - the reached-route ledger (main frame only, no query values, a failed write surfaced on `stop()`), its remainder with and
    without a ledger, and duplicate labels in older evidence;
  - refusal of a used label before the page is touched, and no overwrite when another capture claims the label meanwhile;
    the screenshot is requested full page;
  - a malformed ledger or index line is an error that stops `detect.mjs`, never skipped;
  - each documented threshold on both sides of its boundary: box size and page edge, the 4 px tolerances, the half-height
    line, the width tolerance, items per page, pages for a majority, word and name lengths, and ties between variants;
  - the precision guards from real-page triage, each with a failing control first in the two neutral domains: rare words need a
    word list (none: no row and the unassessed line) and are skipped when listed, a regular inflection of a listed or frequent
    word, or a name; a healthy generic-English prose control (care/core, made/make, foot/food, accept/access,
    internal/internet, then/them, steal/steel, residence/residency and inflection pairs) gives no row with a base-form list
    and, when `/usr/share/dict/words` exists, with it, while "Retrun" and "Humidty" stay candidates; style keys without
    a class, inline alignment, clusters (long members included), multi-property variants and not-rendered items; per-viewport
    cross-page groups and the type-family fingerprint; contrast layers, ancestor opacity, separator glyphs, loop clones and
    the row headline; off-page fields in geometry and padding; focus order per fixed or sticky layer; the `--dictionary` flag
    of `detect.mjs`;
  - the input-partition worklist (F3), each with a failing control first in the two neutral domains: a D-A "register patron"
    form (`maxlength=40` and `required` name; `type=email` and `required` e-mail; notes without constraints) gives exactly empty,
    length 40 and 41, empty and malformed rows, and a field with no constraint gives none; a D-B "add sensor" form (`min=0 max=50
    step=0.5`; `accept=.csv`) gives 0, -0.5, 50, 50.5, the off-step 0.25 and one file inside and one outside; hints, ignored
    attributes and invalid values give no row and are counted; length, date, time, step=any, no-min and accept boundaries; radio
    groups; skipped and off-page fields on both sides of the edge; the duplicate-identity rule and its negative cases (no new
    password, a change form, `type=email` alone, another form, a field not listed); merging across states, older captures and
    byte-identical output; the report section and `partitions.json`, which carry no label, placeholder or value.

  The guards were mutation-checked: breaking a guarded line, or moving a documented threshold either way, makes a control
  fail. Not controlled: which of two failed ledger writes `stop()` rethrows (the first is kept), and the wording of rows and
  report lines beyond what the controls assert literally.
- **Local browser control:**
  ```sh
  node tools/passive-capture/browser-control.mjs --playwright-from components/console --out DIR [--axe .../axe-core/axe.min.js] [--dictionary WORD_LIST]
  ```
  Use a new `DIR` for each run: captures are never overwritten, so a second run into the same `DIR` is refused. It captures
  the static fixtures in `fixtures/` with a real Chromium page and checks paired expectations per fixture:
  - a defect outside a small non-modal dialog, a large fixed sidebar or an aria-only modal is still found;
  - nothing outside a native modal or inside `[inert]` is flagged, while a broken control inside the native modal is,
    including a modal opened under an inert ancestor;
  - two open modals are reported as ambiguous and nothing is suppressed;
  - button-type inputs give no field rows, and genuinely nameless controls and unlabeled fields are flagged;
  - an unsupported colour is counted as unassessed and gets no ratio;
  - with `--axe`, axe actually ran on every state and its nodes keep only the allowed fields;
  - healthy/broken pairs in two neutral domains (library loans, greenhouse sensor settings) give exact row counts for
    `positive-tabindex`, `ungrouped-choice`, `img-alt-missing` and `focus-order` (row-reverse and absolute positioning;
    a second column and a right-to-left row stay clean); broken content inside `[inert]` or outside a native modal gives
    none of them; an edge fixture keeps hidden, aria-hidden, disabled, per-form and nested-named cases clean, and a checkbox
    parked at `left:-9999px` and a 1 px clipped screen-reader-only link in the middle of a button row give no focus-order
    row, and it catches a set split across a group; over the whole fixture pool those four kinds give exactly the seeded
    rows plus one accepted, geometrically true `focus-order` row on the modal-under-inert fixture;
  - cross-page pairs evaluated alone and in the whole pool give exact `property-outlier` and `broken-image` rows: three
    library catalogue pages with titles at one size stay clean, one page at another size is a candidate; three sensor lists
    with threshold inputs at one width stay clean, one with narrower inputs in the same form is; two pages are never
    enough; one missing cover or photo among loaded siblings is a candidate, while svg, source-less and lazy images far
    below the fold are counted as unassessed; threshold fields carry their kind and the width of their form, not of their
    list item;
  - wording pairs in both domains, evaluated alone and in the whole pool, give exact `label-mismatch` rows, and with
    `--dictionary` exact `rare-variant` rows (without it none, and the report says rare-variant is unassessed): "Retrun" once beside "Return" eight times and the label "City" on field `country` are candidates,
    while Renew/Renewal, Reset/Renew and Shelf/Shelve stay clean; the label "Humidty" on field `humidity` gives both rows,
    while the German label "Temperatur" on `temperature` stays clean; a label wrapping a select (its facts carry the
    option texts), a French label word and a field without a name word are counted as not compared; a generic-English prose
    page with near-word pairs gives no wording row;
  - precision fixtures: on a greenhouse camera page a white caption over a sibling photo (also inside an opacity-0 reveal
    wrapper) and white text over a positioned gradient overlay are not assessed (`layer`), text in an opacity-0 wrapper is a
    low-confidence row noted as not rendered, text in an opacity-0.4 wrapper is faded into a row, a separator dot between
    prices is not assessed while a close button named by a cross and a table cell holding only a dash stay rows, and text on
    a white card over a photo, beside a photo, in a list item with a gradient bullet, in a box with its own inline icon or
    over a transparent photo is assessed; on a library desk page six classless paragraphs of six sections, inline badges
    inheriting their panel's alignment, a size shared by three note blurbs (two long), a totals cell differing in family and
    size, a hidden state layer, a honeypot field parked off-screen, a sticky jump link and a fixed help button after the
    footer give no row, while one item of a classless list at another size stays a `style` row; the facts carry the layer,
    opacity, separator, display and pinned-layer values these rows rely on;
  - reached-route pairs in both domains, each with its own page, tracker and evidence dir: a library page reached by a full
    load, `history.pushState` and a fragment change, and a sensor page with an iframe reached by a full load, a fragment
    change, `history.pushState` and a second full load. The ledger holds exactly those main-frame routes in order (never the
    iframe), each line only `{url, at}`; with every route captured no remainder is listed, and with the fragment route (D-A)
    or the pushState route (D-B) left uncaptured exactly that route is listed; query and fragment canaries appear in no
    ledger, report or remainder; the whole fixture pool, tracked from the start, has every route captured; a second capture
    under a used label differing only in case is refused and leaves the index unchanged;
  - input partitions, each set in its own evidence dir: a library page with a "register patron" form (with a PIN declaring
    `autocomplete=new-password`), a contact form and a change-PIN form, and a sensor page with an "add sensor" form, a watering
    schedule (date with a 7-day step, time, number with `step=any`, patterns, an ignored `maxlength`), a hidden file input and an
    inert form, give exactly the expected rows and coverage counts, and the facts carry exactly the declared constraints; capture
    goes through a spy page that sees no input, focus or navigation method touched, while an in-page counter sees no input, change,
    focus, key, click or submit event; the canaries the harness typed first appear in no facts, worklist or report; over the whole
    fixture pool only the e-mail fields declare anything, so only their malformed rows;
  - only facts, axe, screenshot, index and ledger files are written;
  - the typed-password and hidden-input canaries appear in none of the text artifacts (facts, axe, index, candidates).
    Screenshots are not inspected.

## Status and limits
- **Not adopted.** Adoption depends on the pre-registered blind measurement: a non-ToolShop product with a hidden key and
  an independent evaluator.
- **No usefulness proven yet.** The ToolShop numbers are development-set only, and the unit and fixture controls prove
  the mechanism, not usefulness.
- **Single engine and viewport:** Chromium only, one viewport per capture.
- **Not handled:** custom (non-native) modal layers are not detected as inactive; shadow DOM and iframe content are not
  inspected; names from descendant `svg` titles are not read; `start`/`end` alignment is read as left-to-right.
- **Contrast limits:** an image or gradient layer is detected by box overlap (at least half of the text box) inside the element
  holding the background colour, and a pseudo-element by its host's box, so a layer under part of a text and one painted below
  that element through a negative z-index are missed, and a layer under half of a wide text box can make a mostly readable text
  unassessed; a solid-colour overlay painted by `::before`/`::after` is not detected; text not rendered at capture is compared
  as authored, ignoring other ancestor fades; a separator glyph whose visually hidden sibling text names a control is treated as
  decoration; ordinal numerals and text inside product mockups are compared like any text (whether they are "part of a picture"
  is a contract decision, not a detector rule).
- **Focus and grouping limits:** focus order compares boxes at the captured scroll position, reads clipped content in
  overflow containers (for example carousels) by its unclipped box and skips neighbours with different text directions;
  custom ARIA radios and checkboxes (`role=radio`) are not grouped.
- **Wording limits:** only captured text is compared, and only as captured (element text up to 160 characters); a
  misspelling seen twice or more, or the same everywhere, is invisible; scripts written without spaces are compared as whole
  runs; rare-variant is only as good as the caller's word list (an old list lacks modern words such as "online", and compounds
  such as "testbed" are missing from most lists), its inflection rules are English, a misspelt inflection of a known word or
  one that is another real word is not found, and a typo capitalised mid-sentence is read as a name; repeated copies of one
  string (marquee loops, the same page captured at several paths) all count towards the frequent word; names and other data
  shown in lists can be label candidates; a misspelt label can give both rows; the naming rule finds nothing when labels and field names are in different languages, and that is not counted;
  fields outside any form are compared with the other such fields of the same state.
- **Cross-page and image limits:** only captured pages of one viewport width are compared, the last capture of a URL and width
  stands for it, and pages with different layouts that share class signatures can be compared; unrelated products captured
  into one evidence dir are compared with each other unless their font families differ (the type-family fingerprint); a
  component sized from its container (em units) is compared by its computed pixels; a kind needs at least 2 items per page and 3 pages;
  colour, margins, line height and heights are not compared; whether a lazy image is loaded at capture depends on the
  engine's distance threshold and network estimate; failed CSS backgrounds, canvas and video are not inspected.
- **Input-partition limits:** declared attributes only, so constraints enforced by script or on the server are invisible and
  a field without attributes gives no row; only fields visible at capture are read (hidden file inputs are only counted); a
  `select` without an empty option cannot be left empty through the page; the browser blocks typing beyond `maxlength`, and a
  range input clamps its value, so those rows may need a request-level check under the agent's authority; `min`, `max` and
  `step` of month, week, time and datetime-local fields are not validated, and their probes beyond a bound are left to the agent;
  a pattern longer than 200 characters is quoted cut; the step base without `min` is not read (the `value` attribute is never
  read), so that off-step probe is left to the agent; the sign-up context needs autofill tokens, so a sign-up form without
  `new-password` gets no duplicate-identity suggestion; disabled includes `aria-disabled`, as elsewhere. Whether a worklist
  belongs in P01 or in obligation planning, and what record authorises executing a row, are open contract questions.
- **Reached-route limits:** a route is reached only if a tracked page navigated to it after tracking started; other tabs,
  popups and navigations before `trackReached` are not recorded, and the ledger is complete only after `stop()`; a ledger
  cut short because `stop()` was never awaited cannot be told apart from a complete one. Routes that
  differ only in their query are one route, so capturing one covers the others; routes that differ in path segments (for
  example one per record id) are separate. Path segments are kept as they are, so a path that carries a secret is written.
  `framenavigated` on pushState and fragment changes was checked in Chromium only; replaceState, redirects and failed
  navigations were not checked. A listed route is not a defect, and no listed route is not a claim that every route was
  reached.
