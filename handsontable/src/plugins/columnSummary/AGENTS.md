# ColumnSummary plugin — sum / min / max / count / average rows

The `columnSummary` plugin computes a value over a range of a column and writes it into a destination cell.
Read this before touching `columnSummary.ts` (the calculations), `endpoints.ts` (endpoint configuration and
bounds) or `utils.ts`.

The plugin is unusual in two ways, and both are the source of most of its bugs:

1. **It writes into the grid's own data.** The result is a real cell value, put there with `setDataAtCell`
   under the source `'ColumnSummary.set'` (or `'ColumnSummary.reset'` for a batch).
2. **Endpoint coordinates are PHYSICAL.** `destinationRow`, `sourceColumn` and every range bound are
   physical indexes.

## Never compare an endpoint row against `countRows()`

`countRows()` counts only *visible* rows, and it shrinks whenever a plugin trims — NestedRows collapsing a
group, TrimRows, Filters. Endpoint rows are physical, so the count to compare against is
`countPhysicalRows()` (`rowIndexMapper.getNumberOfIndexes()`).

Two related helpers, with a deliberate split:

- `countAddressableRows()` = physical count capped by `maxRows`, normalized the way `DataMap#getLength` does
  it (`0` or less → zero rows; anything falsy → no cap). It exists for settings *defaults* that need a row
  count.
- `isEndpointOutOfBounds()` is the *bounds check*, and a **trimmed destination row is deliberately not
  reported as out of bounds** — the row exists, it is only hidden. A row that is *visible* but past
  `maxRows` **is** out of bounds, because the grid renders no cell for it.

## Trimmed destinations behave in a specific, documented way (DEV-2587, #11674)

- **Writing to a trimmed destination throws** in `DataMap.set`, so the write is skipped. The result stays on
  the endpoint object and the cell keeps its previous value.
- **Nothing re-runs the endpoints on untrim.** A destination hidden at the moment of a change therefore
  shows a stale value until the next recalculation that runs while the row is visible. That is a known,
  accepted limitation — do not "fix" it by re-running on every untrim without measuring the cost.
- **A trimmed row's cell meta cannot be read**, so the `columnSummaryResult` class is unavailable and a
  hidden summary row would be summed as plain data, inflating every summary covering it. The fallback is
  `endpoints.isSummaryDestination(row, col)`.

  **The two tests are exclusive, not OR-ed**, and that matters: a *visible* destination cell still holds the
  user's own value on the first calculation pass, before any result was written, and that value counts
  toward the summary. Three long-standing specs pin exactly that.

## Empty ranges report "Not enough data", not `NaN` (DEV-2691)

`min` and `max` have always returned the `NOT_ENOUGH_DATA` string for a range with nothing to calculate
from. `average` now does the same: an all-empty range divides by zero, and a malformed range bound makes the
count negative or `NaN`. The guard is `!Number.isFinite(entriesCount) || entriesCount <= 0` — check the
count, not the sum.

## `holdsNoNumber` is the calculation gate for "this cell has nothing to add" (DEV-2776, #5905)

Every **built-in** summary type decides emptiness through that one helper in `utils.ts` —
`getPartialSum`, `getPartialMinMax` and `countEmpty` all call it — so a change there moves `sum`,
`min`, `max`, `count` and `average` together. That is the point: they must agree on what "empty"
means. A `custom` function calls nothing and is on its own.

**The trap it exists to close:** the global `isNaN()` coerces with `Number()` first, and `Number('')`
is `0`, not `NaN`. So a bare `isNaN(value)` reports an empty string as a real value, and the two
summing sites then run `Number(rawValue)` and turn it into an actual zero. That is not theoretical —
the Delete key clears a cell to `null`, but clearing it **in the editor** stores `''`, and data loaded
from a backend routinely carries `""`. The symptom was `min` returning `0` for a column of 10/20/30
and `count` counting the blank. `' '` and `'  '` coerce the same way, hence the `trim()`.

Three things not to "fix" on top of it:

- **Booleans deliberately still count.** `true` coerces to `1`, and a `sum` summary over a `checkbox`
  column is how you count the ticked boxes. Excluding them would break that.
- **`getCellValue`'s data-type check is a second numeric gate, and it is meant to disagree.** It still
  asks `isNaN(Number(cellValue))`, and it answers a different question: *is this bad data worth
  telling the user about?* A letter is (it throws when `suppressDataTypeErrors` is `false`); a blank
  cell is not. Unifying the two would make an empty cell raise "not in a numeric format", which is
  wrong — an empty cell is not a data-type error. Keep them separate and keep the split deliberate.
- **`forceNumeric` is not the same rule, so do not "align" the two.** It runs `parseFloat`, which
  agrees on empty strings (`parseFloat('')` is `NaN`) but *disagrees* on booleans —
  `parseFloat(true)` is `NaN`, so a checkbox column summed with `forceNumeric: true` yields `0`.
  It also throws on an empty cell when `suppressDataTypeErrors` is `false`. It is the opt-in
  "parse a number out of text" path, not the reference implementation.

## Styling uses `_setCellMetaDeclarative`, not `setCellMeta`

`readOnly` and the `columnSummaryResult` class are written through `hot._setCellMetaDeclarative()`. That is
an **internal** Core method, deliberately kept off the public `HotInstance` type — this plugin reaches it
through a local `HotInstanceInternal` type.

Why it exists: such meta must survive the viewport meta eviction (DEV-1945) but must *not* be recorded as
user-defined, so an `updateSettings` cache reset clears it and it is re-applied for the current endpoints.
It fires neither `beforeSetCellMeta` nor `afterSetCellMeta` and **cannot be vetoed** — matching the direct
DOM write it replaced.

`refreshCellMetas()` exists because `updateSettings({ columns })` resets cell metas to their initial state.

## A `reversedRowCoords` endpoint is anchored to the bottom and must be re-derived on alteration (DEV-144)

`reversedRowCoords: true` means the destination is counted from the **bottom** of the table, so
`destinationRow: 0` is the last row and the summary must follow the bottom as rows are added or removed.
`assignSetting()` resolves that once, at parse time, into an absolute physical index
(`countAddressableRows() - destinationRow - 1`) and keeps **only** the boolean — so the original
offset-from-the-bottom is otherwise lost. It is preserved on `endpoint.reversedRowOffset` for exactly this
reason.

The array-form `resetSetupAfterStructureAlteration()` shift is a gated shift: it moves an endpoint only
when the alteration index sits **at or below** its destination. That is correct for a fixed (non-reversed)
endpoint, and it happens to be correct for a reversed one when a row is inserted *above* the anchor. It is
**wrong** for a row appended *below* the anchor — `2 >= 3` is false for an append past the last row — which
left the summary parked on the old last row instead of moving down (DEV-144). So after the generic
shift, every reversed **row** endpoint re-derives `destinationRow` from `countAddressableRows()` and its
stored offset. The generic `resetAllEndpoints()` pass already ran first and cleared the old destination
cell's **value** (its `alterRowOffset` is 0 for a below-anchor alteration, so it clears the pre-move
position); the refresh afterwards writes the value onto the new anchor.

`reversedRowOffset` is the caller's original offset-from-the-bottom, kept because `assignSetting()` resolves
the reversed destination into an absolute index and would otherwise lose it. It is an **internal** field:
it is deliberately *not* declared on the exported `EndpointConfig` interface (it rides the interface's
`[key: string]: unknown` index signature) and `parseSettings()` never copies it, so a caller cannot set it.

Three rules the re-derive follows, each with a reason:

- **The vacated cell is fully de-summarized.** When the anchor moves, the old cell's value is cleared by
  `resetAllEndpoints()` and its declarative `readOnly` + `columnSummaryResult` class are dropped with
  `_setCellMetaDeclarative(...)` — otherwise it stays uneditable and `getCellValue` keeps treating it as a
  summary result, so it never counts in any range. `readOnly` is reset to `false` (the schema default), not
  to a column-level override the cell may carry; the cell had shadowed that override since the initial
  parse, so this is not a new shadow, but it is an approximation rather than a true cascade restore.
- **A removal never re-anchors onto occupied data.** On a removal the re-derived slot can be a row that
  already holds user data; moving there would let the refresh overwrite it. So the move is gated on the
  target cell being empty and the endpoint is otherwise left parked (non-destructive, matching pre-fix
  behavior). An **insert** re-anchoring onto data *is* allowed — it mirrors the initial parse planting the
  anchor on whatever the reversed slot holds. Residual: a parked endpoint sits at a stale offset until the
  next alteration frees the slot.
- **A below-zero re-derive warns and parks.** Enough removals drive `count - reversedRowOffset - 1`
  negative; the re-derive raises the out-of-bounds warning and leaves the endpoint parked at its last
  valid row rather than storing the negative index. Storing it would poison the all-or-nothing bounds
  check in `resetAllEndpoints()` — one endpoint below zero would make later alterations skip clearing
  every sibling. For the same reason the lower bound is handled here, not added to
  `isEndpointOutOfBounds()` (which that shared gate calls).

One related bug is tracked separately: the default `ranges: [[0, countAddressableRows() - 1]]` is also
resolved once and does not grow on append. `reversedRowCoordsAlter.unit.js` pins the add, remove,
data-safety, multi-endpoint, and out-of-bounds cases.

## The refresh pass caches every endpoint, not just the matched ones

`cacheSummaryDestinations(endpoints)` is called with **all** endpoints even though only the matched ones are
refreshed. A summary result must stay excluded from the ranges of the endpoints being refreshed, whatever
its own source column is.

## The `afterCreateRow` deferral, and the stale comment above it

When `settingsType === 'function'`, `resetSetupAfterStructureAlteration()` does not recreate the ranges
inline — it defers them to `addHookOnce('beforeViewRender', …)`, because a trimming plugin's
`afterCreateRow` has to run first for the endpoint value to come out right. **Do not collapse that back
into the original handler.**

The comment above it (`endpoints.ts:393`) blames TrimRows, and that attribution is stale: `trimRows.ts`
registers **no hooks at all**. `nestedRows.ts` is the trimmer that does register `afterCreateRow`
(`nestedRows.ts:167`). So check what still depends on the ordering before you touch the deferral — the
comment names the wrong plugin, which is not the same as naming a problem that no longer exists.

## Where to look next

- The formula engine this plugin queries for its own cells: `../formulas/AGENTS.md`.
- Trimming plugins whose row counts it must not trust: `../trimRows/AGENTS.md`, `../filters/AGENTS.md`,
  `../nestedRows/AGENTS.md`.
- Cell meta layers, eviction and the declarative tier: `../../dataMap/metaManager/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='columnSummary'`

Note: the legacy Jasmine E2E runner swallows `console.log`, so debugging a calculation there needs an
assertion, not a print.
