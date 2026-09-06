# Existing evaluation material

Use these delivered sources to develop/review the harness, not as product runtime evidence:

- [Kernel contract tests](../components/kernel/tests/contracts/): schema/digest/preflight negative controls.
- [Console unit tests](../components/console/tests/unit/): source-pin, admission, parser, registration and campaign controls. The full suite is not an approved offline assembly command.
- [Nuanu fixture](../components/console/tests/fixtures/nuanu-readonly/fixture.ts) and [public-auth fixture](../components/console/tests/fixtures/public-auth-readonly/fixture.ts): authored synthetic flows. Positive runtime qualification is pending; do not raise their deadline to mask failure.
- [Freeland replacement tests](../components/freeland/tests/freeland-replacements/), [graph tests](../components/freeland/tests/product-graph/) and [verdict tests](../components/freeland/tests/freeland-verdict/): existing harness/oracle regression material, not a transferable Freeland environment.

Run only a reviewed selection with declared side effects, isolated output and explicit pass/fail/skip counts. Preserve changed-input RED controls; a fixture passing because an assertion disappeared is not improvement.
