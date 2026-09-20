# Initial public-catalog QA plan

Authored: 2026-09-20T18:51:00Z

## Bound context

- Product: `public-household-catalog`
- Registered workspace: `/private/var/folders/wb/zqtxc1qs7sqgspnt3vwlmr640000gn/T/qa-public-agent-Opa18J/nuanu-readonly-qa`
- Registered base URL: `http://127.0.0.1:60419/`
- Exact target: `http://127.0.0.1:60419/catalog`
- Source root: `/Users/danilsolomin/projectsnew/qa-agent/.local/p6-entry-20260920.pnU6mK/root` at `24013d1356e3fe2644060f4acdca58c361b52119`
- Paired runtime: Console `c421160a71c0679a357f29828029ec3550791d16`, Kernel `aa5d2d188606cbcf7e3111c130347a36970ec786`
- Product execution authority: the task explicitly authorizes this owned, local, public, read-only slice.
- Deployment identity: no product build/version endpoint is declared; the observed loopback origin and capture times are the available runtime identity.

## Sourced model

The supplied product brief requires literal case-insensitive name-substring search, category restriction that composes with search, clearing search without clearing category, and agreement between the result summary and displayed items including an empty result. Staff inventory management is a separate authenticated role and no staff access is supplied.

Rendered discovery at the exact target returned HTTP 200 with a `Search` textbox, `Category` select (`All`, `Fruit`, `Tools`), summary `3 results`, and items `Apple`, `Pear`, `Hammer`. The discovery is an observation used to ground public literals and locators, not a normative source.

## One initial campaign

1. Public surface smoke: navigate to `/catalog`; verify the search and category controls, initial three rendered items, no horizontal overflow, and no console errors.
2. Search/category/clear journey: enter uppercase `M`; verify literal case-insensitive narrowing to `Hammer`; select `Fruit`; verify zero displayed items and `0 results`; clear the search; verify the selected category remains effective through two displayed fruit items (`Apple`, `Pear`) and `2 results`.
3. Empty-result summary: enter absent probe `ZZZ-NOT-PRESENT`; verify zero displayed items over a bounded absence window and summary `0 results`.

The staff inventory target remains blocked in this campaign because the brief explicitly withholds the authenticated surface/account; it is not a failure of the public catalog.

## Deliberately deferred continuation

Leave one independent public equivalence-class check unexecuted for a fresh session: select `Tools` from an otherwise clear catalog and verify exactly one displayed item, `Hammer`, with summary `1 result`. This is deferred by exercise design, not by a missing capability or a crash.

## Other unassessed scope

No sorting order is asserted. Accessibility beyond visible labels, deeper responsive behavior, performance, security probing, authenticated staff behavior, inventory mutations, non-Chromium engines, external origins, and tracker publication are not in the initial campaign.
