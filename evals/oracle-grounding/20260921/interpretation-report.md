# Appointment-preview offline interpretation

## Result boundary

This report is a separate agent assessment of the complete English text and structured observations in `interpretation-captures.json`. The source is a supplied offline fixture with provenance `supplied_offline_fixture_not_live_capture`; it is not a fresh render, attested browser run, deployment-identity check, or live API observation. `interpretation-module-results.json` preserves the existing `lane-1.mjs` returns without changing their classifications. The assessment below interprets clauses that the deterministic module intentionally leaves unassessed, but it does not rewrite or promote the module output.

The sole normative source is the accepted product brief in `task.md`:

- availability: the selected date must show exactly that date's available appointments and a visible summary whose count agrees with the list, including zero;
- legal: the banner must equal `This service does not provide medical advice.` including punctuation;
- guest: a guest must receive exact code `AUTH_REQUIRED`, no booking may be created, and the message must convey that sign-in is required;
- fee: stored values must be `2500` minor units and `GBP`, while the displayed amount and currency must agree with GBP 25.00; locale formatting is unrestricted.

The prior continuation note is not an additional requirement and is not used to require literal `0 appointments`, `1 appointment`, or any particular grammar. Plain captured strings also do not establish CSS visibility.

## Assessment summary

| Capture | Availability | Legal | Guest | Fee |
| --- | --- | --- | --- | --- |
| appointment-preview-A | passed | passed | passed | passed |
| appointment-preview-B | passed | passed | failed | passed |
| appointment-preview-C | failed | passed | failed | failed |
| appointment-preview-D | unassessed | passed | passed | passed |
| appointment-preview-E | passed | failed | passed | passed |

These outcomes apply only to the supplied fixture fields and their stated provenance. In particular, `passed` does not mean the text was visibly rendered or that the live product behaves the same way.

## Per-capture interpretation

### appointment-preview-A

- **Availability — passed.** The authoritative fixture for `2026-10-01` is empty and the captured list is empty. The complete summary, `Nothing available for this date`, unambiguously conveys zero availability and therefore agrees with the list. This resolves the module's numeric-token limitation semantically; it does not impose literal zero wording.
- **Legal — passed.** Captured text exactly equals the approved sentence, including the period.
- **Guest — passed.** The exact code is `AUTH_REQUIRED`, `bookingCreated` is `false`, and `Before reserving an appointment, please authenticate.` conveys that authentication is required before reservation.
- **Fee — passed.** Stored values are `2500` and `GBP`; `25,00 GBP` identifies the same GBP 25.00 amount under an allowed comma-decimal format.
- **Unresolved / next action.** Visual visibility and source-to-screen/API provenance remain unverified. If live acceptance is later authorized, retain a fresh rendered capture showing the summary, legal banner, guest explanation, and fee together with the corresponding API/no-booking evidence.

### appointment-preview-B

- **Availability — passed.** The captured list exactly matches the authoritative `2026-10-02` fixture (`slot-a` at `09:00`). `One appointment is available` semantically expresses a count of one and agrees with the list.
- **Legal — passed.** Captured text exactly equals the approved sentence, including punctuation.
- **Guest — failed.** The exact API code and no-booking clauses pass, but `You can reserve an appointment without an account.` conveys the opposite of the required sign-in explanation. A single established required-clause violation fails the guest outcome.
- **Fee — passed.** Stored values are `2500` and `GBP`; `£25.00` agrees with GBP 25.00.
- **Unresolved / next action.** Visibility and live provenance remain unverified. For a live follow-up, capture the rendered denial and confirm it tells a guest to sign in while preserving the exact denial code and evidence that no booking was created; do not attempt a real booking solely to recreate this fixture.

### appointment-preview-C

- **Availability — failed.** The authoritative `2026-10-02` fixture and captured list both contain `slot-a` at `09:00`, but `No appointments available` semantically reports zero and contradicts the one-item list.
- **Legal — passed.** Captured text exactly equals the approved sentence, including punctuation.
- **Guest — failed.** The code is `AUTH_REQUIRED` and the message conveys authentication is required, but `bookingCreated` is `true`. This directly violates the no-booking clause and is sufficient to fail the outcome.
- **Fee — failed.** Stored values are correct, but `GBP 24.99` does not agree with the required GBP 25.00 display.
- **Unresolved / next action.** The fixture establishes these contradictions only within the supplied offline material. Before any bug publication, reproduce each symptom in the authorized target environment, verify deployment identity and capture original expected-versus-actual evidence. Do not retry an uncertain or real booking operation without separate authority.

### appointment-preview-D

- **Availability — unassessed.** `Two appointments available` semantically reports two and agrees with the two captured entries. However, no authoritative exhaustive fixture/API listing was supplied for `2026-10-03`; the brief's earlier two-item render is an observation, not a source that proves those are exactly all appointments. Summary/list agreement passes, while exact date availability remains unresolved, so the combined outcome cannot pass.
- **Legal — passed.** Captured text exactly equals the approved sentence, including punctuation.
- **Guest — passed.** The code is `AUTH_REQUIRED`, `bookingCreated` is `false`, and `To reserve a slot you must first log in.` clearly conveys the required sign-in prerequisite.
- **Fee — passed.** Stored values are `2500` and `GBP`; `£25.00` agrees with GBP 25.00.
- **Unresolved / next action.** Supply an authoritative exhaustive appointment fixture or read-only API result for `2026-10-03`, then compare it with a fresh render. Visual visibility and live provenance also remain outside this fixture assessment.

### appointment-preview-E

- **Availability — passed.** The list exactly matches the authoritative `2026-10-02` fixture, and the numeric count in `1 appointments` agrees with the one-item list. The accepted brief does not prescribe singular/plural grammar, so the awkward wording is not a requirement violation.
- **Legal — failed.** `Medical advice is not provided by this service.` is semantically similar but is not the exact approved copy `This service does not provide medical advice.`; exact wording and punctuation are required.
- **Guest — passed.** The code is `AUTH_REQUIRED`, `bookingCreated` is `false`, and `Not signed in? Please log in before booking.` conveys that sign-in is required.
- **Fee — passed.** Stored values are `2500` and `GBP`; `£25.00` agrees with GBP 25.00.
- **Unresolved / next action.** Visual visibility and live provenance remain unverified. A later authorized live check should capture the full banner and compare it byte-for-byte with the approved sentence; the availability wording needs no change unless a separate copy/grammar requirement is established.

## Bounded conclusion

Across five supplied captures, all 20 oracle outcomes were independently classified: 14 passed, 5 failed, and 1 remained unassessed. The failed fixture outcomes are B/guest; C/availability, C/guest, C/fee; and E/legal. D/availability remains unassessed because exact `2026-10-03` availability lacks an authoritative exhaustive source. No human assistance is needed to complete the remaining independent interpretation; the missing D source is a concrete evidence gap for any later exact-availability decision.

This is an offline, agent-authored interpretation of supplied fixtures only. It is not an attested receipt, confirmed live-product defect set, release verdict, whole-product coverage claim, or authorization to publish tickets.
