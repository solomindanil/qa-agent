# Dialogue decision controls

These are small, synthetic agent-behavior exercises derived from real QA-pilot mistakes. They complement the existing component tests; they are not a second eval engine or product evidence. Run them without product/tracker writes, payments or invented receipts.

Give a fresh consumer the actual selected source skill and [cases](cases.md), not the reviewer rubric. Ask for its next QA action and concise user response per case. A separate Lead AQA reviewer compares the actual answers to [the rubric](reviewer-rubric.md). Preserve source revision, answer, reviewer findings and limitations in the existing private qualification/checkpoint. Passing unit tests or matching phrases does not pass these controls.

This prompt separation is **not enforced blind isolation**: unless the host actually prevents access to the reviewer file, call it an open-context controlled sample. A Codex sample does not qualify Claude or a cloud host. Do not infer a reliability percentage from one sample. Repeat materially changed decisions after fixes; retain failures, not just the final score.

The controls cover evidence sufficiency, absence vs read failure, independent continuation, original-operation recovery, aggregate scope, product-design uncertainty and cause attribution. They do not measure exhaustive test-design quality, security, performance, flakiness or live coverage. Existing Console fixtures remain the route for actual authored-check execution and knowledge publication.

[Mixed partial-handoff cases](mixed-handoff-cases.md) add two-stage exercises.
Retain Stage1 before supplying Stage2. The two independent variants differ in
whether the masking criterion explicitly includes UI, so extra caution must not
invent a requirement and API evidence must not silently satisfy a real UI one.
They also distinguish real PostgreSQL evidence from mock-only tests and preserve
the whole batch after a partial developer reply. Sanitized synthetic answers and
their semantic review can be committed here; live private evidence stays outside
tracked delivery. Case files alone are not an executed or passed eval. The
[14September sample](20260914/README.md) retains four actual replies, independent
Lead AQA assessment, one communication finding and explicit execution limits.
