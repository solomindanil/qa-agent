# Public household catalog

This is an owned local QA exercise, not a live Freeland or Nuanu product.
The public catalog helps visitors find household items.

## Declared product behavior

- Search matches a literal, case-insensitive substring of an item's name.
- Category selection restricts results to that category and composes with search.
- Clearing search removes the text restriction, not the category restriction.
- An empty result is a supported outcome. Result summary and displayed items must agree.
- No particular sorting order is promised.
- Inventory management belongs to a separate staff role. No staff account or
  authenticated surface is available in this exercise; retain that scope gap.

Derive examples and locators from the rendered catalog. This brief supplies
requirements, not test cases or expected counts for specific inputs. Do not infer
an inventory write capability from public catalog controls.
