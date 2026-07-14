# Case: bug fix — `getParsedNumber` collapses dot-grouped thousands

- **Kind:** bug fix
- **Tier:** Jest unit test (`*.unit.ts` in `handsontable/src/helpers/__tests__/`)
- **Source under test:** `handsontable/src/helpers/number.ts`
- **Diff:** `change.diff` (the fix the test must pin down)

## The change brief (what the agent receives)

Bug report: in a locale where the decimal separator is a comma, typing `7.000`
into a numeric cell stores `7` instead of `7000`. `getParsedNumber()` treats the
dot as a decimal separator regardless of the cell's `decimalSeparator` meta, so a
dot-grouped thousands value collapses to its leading group. `1.234.567` and the
mixed form `7.000,25` fail the same way.

The fix routes dot-grouped input through `isDotThousandsGroupedInteger()` and
`isDotThousandsGroupedFloat()` before the generic float parse (see `change.diff`).

Write the regression test. Per `test-writing-discipline`: turn the repro into a
test, watch it fail without the fix, then watch it pass with the fix.

## What a meaningful test looks like (rubric notes)

- Asserts the **parsed value** (`7000`, `1234567`, `7000.25`) — not merely that
  the function returned without throwing.
- Pins the boundary: the same input with a **dot** decimal separator (or no
  option) must keep its old meaning (`7.000` stays `7`), so the fix cannot
  overreach.
- Few tests, each killable: break the dot-grouping branch (swap a separator,
  drop the float form) and at least one assertion fails.
