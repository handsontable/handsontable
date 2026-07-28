# Case: feature — an `isPercentValue` helper for the numeric helpers

- **Kind:** feature (small new public helper API)
- **Tier:** Jest unit test (`*.unit.ts` in `handsontable/src/helpers/__tests__/`)
- **Source under test:** `handsontable/src/helpers/number.ts` (new export)

## The change brief (what the agent receives)

Column-width settings accept percent strings (`width: '50%'`), and the parsing
code inlines the shape check. Extract it into a helper.

Add `isPercentValue(value)` to `handsontable/src/helpers/number.ts` with this
contract:

- Returns `true` only for a string shaped `<numeric>%` after trimming
  surrounding whitespace: `'50%'`, `'33.5%'`, `'-10%'`, `'  50%  '`.
- Returns `false` for everything else: a bare number string (`'50'`), a bare
  unit (`'%'`), inner whitespace (`'50 %'`), a doubled unit (`'50%%'`), the
  empty string, and non-strings (`50`, `null`, `undefined` — a number carries
  no unit).

Write the unit test that encodes this contract. Per `test-writing-discipline`,
the test is the oracle: write it from the contract above, not from the
implementation.

## What a meaningful test looks like (rubric notes)

- Each `false` case pins a distinct part of the shape rule — dropping any one
  branch of the implementation regex flips at least one assertion
  (mutation-killable).
- Covers the type boundary (`50` vs `'50%'`) and the trimming behavior.
- Two focused `it()` blocks (valid shapes, invalid shapes) beat a dozen
  one-assertion tests — the north star is few, extremely meaningful tests.
