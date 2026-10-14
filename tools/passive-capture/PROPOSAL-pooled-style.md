# Pooled style detectors: proposal (slice `pooled-style`)

Status: **opt-in, experimental, not adopted.** This slice adds three pure detectors to `style-detectors.mjs`, an opt-in
`pooled` option to `runDetectors` and a `--pooled` flag to `detect.mjs`. Without the option or the flag, every output
(`candidates.json`, `candidates.md`, `partitions.json`, stdout) stays byte-identical to the output before this slice. The
README now documents standalone opt-in. Historical proposals below are superseded by the bounded SAME Astra decisions applied in this candidate; no gateway/capture/role-loader expansion is included. Contract and semantic decisions were supplied by **Astra** (architect reviewer) and integration work by
**Sol** (implementer).

Revision 2 answers the independent review (one HIGH, four MEDIUM, five LOW findings): see
`.superpowers/sdd/2026-10-14-generic-tools/pooled-style-REVIEW-RESPONSE.md`. The rules it added are marked *(r2)* below.

## Gap

The existing style detectors compare look-alike elements inside one state (`style`, `alignment`) or the same element across
pages, each page against its own majority (`property-outlier`, `geometry`). Both go silent when the evidence is thin:

- a component that appears once per page (one panel title, one primary action, one reading unit) gives no in-state group,
  and a per-page comparison has a single item;
- one odd font inside a form (a help text in another family) is not a cross-page fact at all;
- one status tag of six drifting to another colour shows only as a colour difference within one state, which `style` does
  not compare.

## What it does

| Function | Output |
| --- | --- |
| `pooledPropertySpread(states, opts)` | `{ outliers, spread, coverage }`: `pooled-outlier` candidates, spread rows (not candidates) and counts |
| `formFontOutlier(state, opts)` / `formFontCoverage(state, opts)` | `form-font` candidates of one state / what was compared and left out |
| `siblingColorDrift(state, opts)` / `siblingColorCoverage(state, opts)` | `sibling-color` candidates of one state / what was compared and left out |
| `runDetectors(states, { pooled: true, pooledProperty? })` (`detect.mjs`) | the default rows, then the three detectors' rows; `pooled: false` (the default) gives the earlier rows exactly |
| `pooledSummary(states, property?)` (`detect.mjs`) | `{ spread, coverage: { properties, formFont, siblingColor } }`, the summary that `--pooled` writes |
| `toMarkdown(list, states, { pooled: true, summary? })` | the report with the pooled section |
| `detect.mjs <dir> [--dictionary <list>] --pooled` | adds the rows, a `pooled` key in `candidates.json`, a pooled section in `candidates.md` and a `pooled` field on stdout |

Every candidate from these detectors has severity `low`, confidence `low` and a `basis` object that records what it was
compared with and the thresholds in force. `runDetectors` copies the `basis` of the best-ranked candidate in a merged row onto
that row. No default row has a `basis`, so the default shape is unchanged.

*(r2)* **Row ids.** The default rows are merged, sorted and numbered first; the pooled rows are merged and sorted among
themselves and numbered after them. A default row therefore keeps its id in a pooled run of the same directory (before r2,
pooled rows sorted in among the default ones and renumbered them). *(r2)* **One computation per run.** `detect.mjs` computes
`pooledPropertySpread` once and passes it to `runDetectors` (`pooledProperty`), `pooledSummary` (`property`) and
`toMarkdown` (`summary`); each still computes it when not given one.

### Pooled property spread

- **Pool.** One pool per origin, viewport width and role. The role comes from `state.role` when a state carries one; it must
  be a non-empty string, otherwise the function throws `TypeError`. Today's capture does not record a role, so all states fall
  in the `role: null` pool. A state whose URL has no parseable origin is not pooled and is counted in `statesNotPooled`; it is
  never pooled with `file://` pages, whose origin is the string `"null"`. A capture without a viewport pools under
  `viewport: null`.
- **Kinds.** Kinds are keyed like the existing detectors key them. Text items use the `style` key (`item|<groupKey>`).
  Text-like fields use the `property-outlier` key (`field|<tag>|<type>|<groupKey>`), and a field captured without a signature
  has no kind. A form's primary action is keyed `primary|<groupKey>`: its last submit button by position, or its only button,
  as in the geometry detector; a form with several plain buttons and no submit has none. Some entries are left out:
  - items that are disabled, inactive or not rendered (opacity 0), items with long text, and `td`, `th` and `option` tags;
  - fields that are disabled, inactive or parked off the page;
  - primary actions that are disabled or inactive.

  A form whose fields give no placed width has an unknown width, so its primary action's width is not compared. Only kinds seen
  in 2 or more states of the pool are compared; the others are counted in `kindsInOneState`.
- *(r2)* **Interactive items.** Links, buttons, summaries, controls (the `controls` facts, matched by selector) and items
  inside a control often mark the current or selected item by colour, background or weight: a current-page link styled through
  `aria-current` or a utility class that `baseSig` strips sits under a path-keyed kind holding one link per page, so every page
  would differ once. For these items `color`, `background` and `fontWeight` are unknown (they do not vote); their family, size
  and alignment are still compared. They are counted in `coverage.interactiveItems`. This is the sibling-colour exclusion,
  now shared (`interactiveIn`).
- **Properties.** The look properties already in the facts are `textAlign`, `fontFamily`, `fontSize`, `fontWeight`,
  `color` and `background`. Fields and primary actions also compare their width relative to the form or container.
  - `textAlign` counts only for a block box, because an inline-level item shrinks to its text. A field aligns its own text
    whatever its display. `start` reads as `left`.
  - A font family is its first listed family, unquoted.
  - A background is known only as a solid colour that is neither assumed nor faded. Images, gradients or layers and
    translucent colours stay unknown.
  - Widths are equal within 5 points or 4 px. This is the existing `WIDTH_TOLERANCE` of `property-outlier`.
- **Votes.** A state votes with a value that more than half of its items with a known value share. A state with no such
  value is *mixed*: it does not vote and is listed. A state with no known value neither votes nor is listed. A property needs
  2 or more voting states, otherwise it is counted in `withoutVotes`.
- **Outcome per property.**
  - **Clear majority.** The most shared value needs ≥ 75 % of the voting states and at least 3 agreeing states on at least 2
    routes (`routeOf`: queries dropped). When it has them, one `pooled-outlier` candidate is raised per odd state that is
    neither a state change on its route nor a variant, all under one key `pooled|<pool>|<kind>|<prop>`, so `runDetectors`
    merges them into one row.
  - *(r2)* **State change on a route.** An odd state whose own route also has a capture with the majority value (the same
    page after a failed submit, or in a selected or expanded state) is a state change of that page, not a cross-page outlier.
    It gives a spread row with reason `state-change-on-route` and is listed in `sameRoute`.
  - **Variant.** An odd state that differs from the kind in 2 or more look properties is a variant, not an outlier. Each
    such property gives a spread row with reason `multi-property-variant`. *(r2)* A look property counts as a difference only
    when that does not depend on capture order: its most shared value is itself a clear majority (the share and count above)
    and the state's value is another, or no other voting state holds the state's value. A tie (two against two) is no
    difference of either side, so the same states give the same candidates and spread rows in any order.
  - **No clear majority.** It gives a spread row with reason `no-clear-majority`. A majority whose states all sit on one
    route gives one with reason `majority-on-one-route`. A spread row lists the distribution (value → states, the most held
    value first) and the mixed states without picking a side. It has no detector, severity or id, and it is **not a
    candidate**. One property can give two spread rows (a state change and a variant).
- *(r2)* **Texts.** A candidate names the text of the first odd state's own item; a spread row names the text of its example
  (the first voting state).

Example text: `Pooled items "Fines due" have color rgb(138, 31, 31) in loans-pooled-fines-odd; 3 of 4 pooled states (on 3
routes) have color rgb(31, 58, 95); a majority across captured states, not a design rule, so the odd state may be the
intended one`.

### Form font outlier (one form, one state)

- **Members.** Members are located through the facts only:
  - the form's text-like fields;
  - the option lists of its selects (size only, when more than half of the options share one);
  - its controls that draw their own text: an input's value or native default name, or a button holding its own text;
  - the elements whose own text equals the label text (`label-for` or `label-wrap`, `label` elements only; or
    `aria-labelledby`) or the help text (`hint`) of fields of that form alone.

  An element is a member once, under the role it is found as first.
- *(r2)* **Owners.** Every field names its label and help texts, live or not: a field in a form that is shown (active, enabled,
  placed) names them for its form, any other field (in no form, disabled, inactive or off the page) as `outside`. A text is
  located only when one form alone names it **and** no more rendered elements carry it (label elements for a label text, any
  element for a reference or a help text) than fields name it. Otherwise it is ambiguous: a footer newsletter label "Email"
  beside the form's "Email" label, or a footer note "Optional" beside two "Optional" field hints, is not pulled into the form.
  A text named only from `outside` is not a member and forms no group.
- **Not compared, but counted.**
  - Ambiguous texts (`ambiguous`), as above.
  - Labels, help texts and control texts with their text in a child element (`notLocated`).
  - Disabled, inactive and off-page fields and their texts.
  - Fields outside any form.
  - Icon glyphs: the `glyph` facts, or a control text without a letter or digit.
  - Text whose family list names a generic monospace family (`monospace`, `ui-monospace`).
- **Family.** The family is compared across the whole form when it has 4 or more members. The dominant family needs
  ≥ 75 % of them and must be held by members of at least 2 roles. A family held by one role only is that role's convention,
  for example inputs left in the browser's default face, and is counted in `singleRoleFamily`. An odd family shared by every
  member of its role (2 or more) is also a convention, counted in `roleConvention`.
- **Size.** *(r2)* Size is compared within one role **and sub-kind**, with 4 or more members and ≥ 75 % sharing. Labels,
  fields, help texts and controls legitimately differ from each other in size, and so do, within their role:
  - labels of text-like fields (inputs that take text, selects, textareas) and labels of other fields (by type: checkbox,
    radio, ...);
  - submit buttons (a `button` without a type, or `type=submit`; an input `submit` or `image`), other buttons and links
    (`a[href]` controls). Types are read in any case.

  Groups are reported in role order (label, field, control, option, help), then by name. `basis.scope` names the group
  (`label:text`, `control:link`, ...); the text names it in words ("text-field labels", "links").
- **Candidate.** One `form-font` row per odd member (key `form-font|<sel>|<prop>|<value>`, so the same member merges across
  states). It says that a designed face for one element is a legitimate dismissal.

### Sibling colour drift (one state)

- **Groups.** A group is the look-alike items of one state: the `style` key, short text, rendered and active. Interactive
  items are not compared and are counted: links, buttons, summaries, controls and items inside a control often mark the
  current or selected item by colour. Glyph items (rating stars, separators), table cells and options are left out too.
- **Candidate.**
  - The group needs 4 or more items with a known value for the property (`color`, or `background` when known).
  - The candidate item's value is its own: shared with fewer than 2 items. A value shared by 2 or more is a pattern or a
    second variant, so alternating rows and two status colours give nothing.
  - At least 75 % of the *other* items agree on another value.
  - The item does not also differ from them in another look property; if it does, it is a designed state. A property that
    is unknown on every other item is no difference.
- **Row.** One `sibling-color` row per odd item. Its basis records the group size, the dominant value and how many other
  items with the same text have the dominant value (`sameTextWithDominant`). *(r2)* The text says it too ("5 of them with the
  same text", or "none of them with the same text"), so a single-instance category colour (a red "Sun" in a weekday header) is
  quick to dismiss. It is a fact for triage, not a rule.

### Report and JSON (only with `--pooled`)

- `candidates.json` gets a final key, `pooled: { spread, coverage: { properties, formFont, siblingColor } }`, with every spread
  row. Each candidate row of the three detectors carries `basis`.
- `candidates.md` gets the section `## Pooled style (opt-in): spread rows and coverage, not candidates` before the partitions
  section. It has three coverage paragraphs and either the spread table (Kind, Property, Distribution, Reason) or
  `No spread row.` New paragraphs state "The absence of candidates or spread rows does not establish PASS" or "The absence of candidates does not establish PASS". Legacy default double-negative wording stays unchanged to preserve its bytes. *(r2)* The
  table lists at most 40 spread rows; a line after it counts the rest and points to `pooled.spread` in `candidates.json`. The
  properties paragraph counts the interactive items compared without colour, background and weight. Missing role/viewport is unknown, not equal identity; form membership is inferred from saved text/counts, not exact ownership. Representative merged basis, cap6 evidence and path-selector collisions require original-fact/image inspection.
- stdout gets `pooled: "<n> spread row(s), not candidates"`.
- *(r2)* Arguments: `<dir>`, then at most one `--dictionary <list>` with the list right after its flag, and at most one
  `--pooled`, in either order. `--pooled` twice, `--pooled` as the word list (also between `--dictionary` and a list),
  `--dictionary` without a list or twice is a usage error (exit 2). Without `--pooled` the accepted arguments are exactly the
  earlier ones.

## Coordinator constraints, as applied

- **Facts and internal consistency only.** Every comparison holds a captured value to other captured values of the same
  kind, in the same pool, form or group. No expected value is read from UI text, a design convention or a fixed width or
  alignment. No rule names a particular width (such as "full width") or a particular alignment. The only width rule is the
  existing relative tolerance. The r2 exclusions (interactive items, sub-kinds, owners, same-route states) only remove
  comparisons; none adds an expectation.
- **No second ledger, lifecycle or persisted status.** The detectors return rows and counts. The rows are ordinary
  candidates that need a disposition in the agent's existing notes, exactly like every other row. Spread rows and coverage
  are report facts with no status field.
- **No QA PASS rule from counts.** The report states, for each detector, that an empty result is not a pass.
- **Product-agnostic.** The code names no product, host or route. The fixtures use two neutral domains (D-A library loans,
  D-B greenhouse sensors). The unit cases use `.test` hosts and `file:///fixtures`, and the browser control loads `file://`
  URLs only. A unit control scans the changed modules for product names and local hosts, and the new fixtures for external
  URLs and scripts.

## Fixtures (`tools/passive-capture/fixtures/`)

| Fixture(s) | Purpose |
| --- | --- |
| `loans-pooled-desk`, `-renew`, `-return` | D-A: one panel title per page, so per-page and in-state comparisons starve; the three agree |
| `loans-pooled-fines-odd` | the same title in another colour: the one `pooled-outlier` |
| `sensors-pooled-north`, `-south`, `-east`, `-west` | D-B: the reading unit grey on two pages, green on two: a spread row, no side picked |
| `loans-form-fonts` | D-A renewal form: one help text in Georgia (the one `form-font` row) and a glyph button in a symbol face, left out |
| `sensors-form-fonts` | D-B probe form, healthy: smaller help texts, a monospace serial field, glyph buttons (one named by a visually hidden word, so only its glyph facts leave it out), both actions in one display face |
| `sensors-status-tags` | D-B: one status tag of six drifts (the one `sibling-color` row). These give none: three zone tags, alternating rows of five and six, a navigation whose current link has its own colour, and script tabs built from anchors without `href` |
| `loans-tags-healthy` | D-A, healthy: genre tags in a palette, rating stars, two of six loan badges in a status colour, a staff pick in another colour and background; each is held back by its own guard |
| *(r2)* `loans-nav-desk`, `-renew`, `-return`, `-fines` | D-A, healthy: a utility-class navigation whose current link has its own colour through `aria-current` on every page (the review's HIGH case: 4 rows before r2) |
| *(r2)* `loans-join-healthy` | D-A registration, healthy: five 16px text-field labels, a 14px checkbox label, two "Optional" hints; a footer with a 12px newsletter label "Email" (its input in no form), a serif note "Optional" and a branch finder with its own Postcode label |
| *(r2)* `sensors-signin-healthy` | D-B operator sign-in, healthy: a 16px submit beside a 14px "Show" toggle and two 14px links in the form |
| *(r2)* `loans-patron-contact`, `-reading`, `-notices` | D-A patron pages with navy labels; the harness captures the contact page again, with a query, after marking it submitted (its labels turn red): a `state-change-on-route` spread row, no candidate |

The browser control captures these fixtures into `<out>/pooled`, apart from the default pool. The default pool and every
existing expectation are unchanged. In that directory the default detectors also give two `contrast` rows (the rating stars)
and two `geometry` rows (the narrow renewal button). The control does not pin them.

## Controls and evidence

Logs are in `.superpowers/sdd/2026-10-14-generic-tools/`: `pooled-style-RED.log`, `pooled-style-GREEN.log`,
`pooled-style-MUTATION.log` (revision 1) and `pooled-style-FIX-RED.log`, `pooled-style-FIX-RED-browser.log`,
`pooled-style-FIX-GREEN.log`, `pooled-style-FIX-MUTATION.log` (revision 2).

**Unit controls** (`tests/passive-capture-pooled-style.test.mjs`, 29 tests, synthetic facts):

- healthy and broken pages for each detector;
- spread only (two against two, two states that differ);
- every threshold on both sides;
- votes and mixed states;
- variants, pool dimensions and unknown origins (also beside `file://` pages);
- excluded items: inactive, disabled, not rendered, long text, inline `textAlign`, unknown backgrounds;
- relative widths and the primary action (several plain buttons, the last of two submits);
- the guards that only isolated cases reach: one voting state, a state without a known value, sig-less fields, a disabled
  primary action, a text located twice, table cells, lone items, a value unknown on every other item;
- icon glyph and monospace exclusions, role conventions, the dominant family across 2 roles, first-listed families and member
  location;
- alternating colour patterns, palettes, status colours, interactive items and glyphs;
- *(r2)* interactive items in pooled kinds (colour, colour and weight, background; spans as the control; controls by selector
  and items inside one; a link's size still compared); owners (a footer label, an inactive field, a stray label, three
  elements for two fields, one element shared by two fields, one element named by a form field and a field in no form, a
  heading with a label's text); sub-kinds (sign-in, links, checkbox labels, buttons, type case, input submits, group order);
  a same-route error capture (also with a query, beside another odd state) and its report row; all 24 orders of a tie and
  of a unique value; the odd state's own text; the same-text clause; the plumbing of one pooled computation and the spread cap;
- the opt-in in `runDetectors` (default ids kept), the report and the CLI;
- determinism across separate processes;
- a product-agnostic scan.

**Browser control:** `node tools/passive-capture/browser-control.mjs --playwright-from <dir> --out <new dir>` runs in Chromium
against `file://` fixtures only, and passes with and without `--dictionary`. It evaluates each set on its own with
`{ pooled: true }` and requires:

- exactly the rows and spread rows listed above (kind, property, reason, distribution, variants, same-route states), each row
  with low confidence and a basis;
- no pooled row without the opt-in;
- the per-page and in-state detectors to starve on the desks;
- the exact coverage of the six form and tag pages, and the exact pooled-property coverage of the pooled directory;
- each healthy-tags guard to be the reason its row is held back: loosened, each gives its rows;
- the facts that the guards rely on: the monospace family, glyph facts, a hidden-word button name, anchors without `href`
  not being controls, the renewal help text as its field's hint; *(r2)* four path-keyed utility-class links per nav page,
  one in the current colour; the footer label and its input in no form, the 14px checkbox label wrapping its box; the
  sign-in controls' tags, types and sizes; the error capture on the contact route under another URL, with red labels.

Over the default pool in pooled mode, the control requires that every default row is unchanged, *(r2)* its id included, and
that exactly three `pooled-outlier` rows appear, one for each seeded cross-page defect: form4's narrow primary action, the
15px catalogue title ("Tides and Moons" on the odd page) and the narrower threshold field ("o-air"). It also requires one
note kind's two spread rows (font size and colour, five pages against four).

Against the pre-r2 modules, the r2 browser expectations fail 15 checks (`pooled-style-FIX-RED-browser.log`): the nav pages
give 4 rows, the sign-in submit is flagged, the error capture is named as an outlier, the join form pulls its footer label in,
the texts and the default ids differ.

**Default output byte-identical:** HEAD's `detect.mjs` and `style-detectors.mjs` (the pre-slice modules, sha256
`f1f54801…` and `03e16ae2…`) and the working tree each ran `detect.mjs` without `--pooled` on copies of all 11 evidence
directories of the r2 browser-control run, with and without a dictionary: 88 of 88 of `candidates.json`, `candidates.md`,
`partitions.json` and stdout are byte-identical. Contrast check: with `--pooled` on the working-tree side, only the 22
`partitions.json` files stay identical.

**Mutation:**

- Revision 1: all 73 named guard mutants and 12 further guards killed by the unit control; 11 killed in the browser.
- Revision 2 (`pooled-style-FIX-MUTATION.log`): 55 mutants of the r2 guards and of the five guards the review found
  unpinned; all 55 are killed by the unit control. 18 of them run in Chromium: 13 are killed there; the other 5 are held by
  the unit control only (showing them needs a page whose expected output is a false negative, or a contrived layout).

## Decisions for Astra

1. **Stay opt-in, or become a default.** Turning the detectors on by default adds rows to every run and ends byte-identity
   with earlier output. The proposal is to keep them opt-in until real-product dispositions show their precision.
2. **Thresholds.**
   - Pooled: 75 % share, 3 agreeing states, 2 routes, and a variant at 2 or more differing properties.
   - Form font: 4 members, 75 % dominance, a dominant family held by 2 roles, a role convention at 2 or more members.
   - Sibling colour: 4 items, 75 % of the others agreeing, a value shared by 2 or more being a pattern.

   These are fixed heuristics, not calibrated confidence or proof of fixture independence; round shares/counts do not establish that. Controls exercise both sides. A lower share
   finds more and dismisses more.
3. **Spread rows are not candidates.** They have no id and need no disposition, and `triage-coverage` does not count them.
   Should a reviewer packet show them, as context only? *(r2)* A spread row needs only 2 voting states, so a large product can
   give many; the report now caps its table at 40 and counts the rest. Raising the floor to 3 voters is an option not taken
   (it hides a two-state difference, a fact).
4. **`basis` on candidate rows.** This is a new optional field, present only on rows of these detectors. Accept it as part
   of the row contract, or move it under `evidence`?
5. **Overlap with default detectors.** In pooled mode over the default pool, the three `pooled-outlier` rows restate defects
   that `property-outlier` and `geometry` already flag, under other keys. Both are kept today: pooled mode adds rows and
   changes none. Options: keep both, suppress a pooled row when a default row names the same element and property, or merge
   them by key.
6. **The role dimension.** It is honoured when `state.role` is present, but nothing records it yet. Where should the role come
   from? The capture planner of `state-fingerprint` already takes a role. Should a malformed role keep throwing?
7. **What a member is.** *(r2)* Members are still located by text, now only when one form alone names the text and no more
   rendered elements carry it than fields name it. This is conservative: a hint element shared by a form field and a field in
   no form, or two real "Optional" hints beside an unrelated "Optional", are not compared. A facts addition (the label and
   help-text element selector of each field, in `page-facts.mjs`, which this slice does not own) would locate members exactly
   and remove both the text match and its false negatives. Recommended before adoption.
8. **Excluded classes.** Should these stay out of comparison?
   - Interactive items in sibling colours, and *(r2)* their colour, background and weight in pooled properties: a drifting
     link colour is never flagged by these detectors.
   - Table cells, which carry data colours.
   - Named monospace faces without a generic family: these are compared.
9. *(r2)* **Same-route state changes.** An odd capture of a route that also has a majority capture is shown as a spread row.
   The alternative the review offered (one vote per route, within-route differences reported apart) changes every vote count;
   it is not taken. Should a state-change row instead be dropped as noise?
10. *(r2)* **Row ids in pooled mode.** Pooled rows are numbered after the default rows. Accept this as the contract (a default
    row's id is stable across `--pooled`), or give pooled rows their own id prefix?

## Integration (Sol)

- **README.** Document `--pooled`, the three detector names, the spread table (and its cap), the coverage paragraphs and the
  argument rules. This slice does not edit the README.
- **Gateway / Console.** Decide whether the agent-facing capture flow can pass `--pooled`, and how the opt-in is shown so
  that an agent does not read "no pooled row" as a pass. The report already says so.
- **Triage coverage.** Pooled rows are ordinary candidates, so `triage-coverage` counts them when present. A control there
  with a `--pooled` evidence directory is advised.
- **Import graph.** `style-detectors.mjs` imports `routeOf` from `reached.mjs`, and *(r2)* `browser-control.mjs` does too.
  When `routeOf` moves to a `route.mjs` (proposed in PROPOSAL-state-fingerprint), import it from there.
- **Role.** If a role is recorded per state, `loadStates` must carry it as `state.role` (a non-empty string).
- *(r2)* **Facts.** If decision 7 is taken, add the label and help-text element selectors to the field facts and switch
  `formMembers` to them.

## Limits

- Pools hold only the states of one evidence directory, because `detect.mjs` runs per directory. Fewer than 4 states of a
  pool can never give a `pooled-outlier`.
- A majority across captured states is not a design rule. The odd state may be the intended one, and every row says so.
- Backgrounds are compared only when known as a solid colour. Text over images, gradients or translucent layers is not
  compared.
- Glyph detection relies on the existing `glyph` facts and on a letter-or-digit test of control text.
- Path-based selectors are capped at six levels, so two deep elements can share a selector. The form-font detector then
  counts the first one only.
- *(r2)* Form members located by text can be ambiguous on a healthy page (decision 7); ambiguous texts are counted, never
  compared.
- *(r2)* A state change is recognised only when its route also has a capture with the majority value. A route captured only
  in an error state still votes like any page.
- The detectors do not look at text wording, accessibility or behaviour. They compare look properties already in the facts.
- **Base `ae9f74f` note (port).** This base's `page-facts.mjs` captures no field help text (`hint`).
  - The form-font detector therefore never counts help texts as form members on real captures here. A help-text font outlier cannot fire on this base.
  - Unit tests that feed synthetic `hint` facts still exercise the logic.
  - In `browser-control.mjs` the help-text expectations were adapted to what this base captures, with comments. If hint capture is ever adopted (an Astra decision), those exact checks fail and must be revisited.
