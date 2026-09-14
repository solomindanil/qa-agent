# Same-tab catalog observations — 14 September 2026

Agent-authored, unsealed transcription of selected CUA accessibility output.
Not a campaign receipt, screenshot inventory, independent attestation or a fresh
blind agent sample. Parent agent used the known-answer owned fixture after
reviewing the earlier failed test design. These observations were not injected
into managed knowledge or a sealed receipt.

Source: unchanged Console `881a93e43fd9b90f3dcf9812812f6cf8ad854789`
`tests/fixtures/public-input/fixture.ts`. Separate owned server:
`http://127.0.0.1:65317`; Codex in-app browser, browser2/tab2. Healthy `/fixed`,
seeded-broken `/catalog`. The same tab was retained throughout, with one deliberate
navigation between implementations and no reload within either sequence.
No deployed SHA endpoint: identity is the owned process and verified fixture
source, not a live-product deployment attestation. Server and tab were closed
after observation; these URLs are not continuing service links.

Expectations come from the exercise brief: literal case-insensitive name
substring, composed category filter, clear preserving category, summary agreeing
with shown items. Inventory was observed as Apple/Pear (Fruit), Hammer (Tools).
The brief does not require the exact phrase `0 results`.

| UTC capture | Route | Selected category / query | Rendered summary | Rendered items |
| --- | --- | --- | --- | --- |
| 03:27:11.415 | fixed | Fruit / empty | 2 results | Apple, Pear |
| 03:27:19.938 | fixed | Fruit / pP | 1 results | Apple |
| 03:27:26.203 | fixed | Fruit / empty | 2 results | Apple, Pear |
| 03:27:58.858 | fixed | All / . | No results | none |
| 03:28:07.159 | fixed | All / empty | 3 results | Apple, Pear, Hammer |
| 03:32:27.937 | catalog | All / empty | 3 results | Apple, Pear, Hammer |
| 03:32:34.086 | catalog | Fruit / empty | 2 results | Apple, Pear |
| 03:32:38.629 | catalog | Fruit / pP | 2 results | Apple, Pear |
| 03:32:46.419 | catalog | Fruit / empty | 2 results | Apple, Pear |
| 03:33:22.604 | catalog | All / . | 3 results | Apple, Pear, Hammer |
| 03:33:29.567 | catalog | All / empty | 3 results | Apple, Pear, Hammer |

Healthy transitions were actually observed, not inferred from the last frame:
Fruit2 → pP1 → clear2 and All → dot0 → clear3. Category persisted. `No results`
correctly describes an empty set. The grammatical `1 results` is not promoted to
a functional defect: the required meaning is unambiguous.

Broken search failed the narrowed/empty preconditions. Its eventual correct
empty-query set therefore proves final-state behavior only, **not successful
recovery from a narrowed or empty result**. Its summaries agreed with the items
that were actually shown; that does not make the filtering correct.

The selected Kernel657 lacks the source skill's optional agent-observation writer.
The skill's explicit local report/checkpoint fallback is used. This does not
promote the automated summary blocker or rewrite `NEEDS_HUMAN`/`INCONCLUSIVE`.
Supported agent work did not require a human. Staff access/authorization remains
unavailable and no staff flow was attempted.

Capture note: the healthy final-state screenshot call exceeded tool-output
context. The saved AX observation above was read back, and a fresh full AX tree
confirmed the same empty query, All selection and three items before navigation.
No screenshot file or complete raw CUA journal is claimed by this transcription.
