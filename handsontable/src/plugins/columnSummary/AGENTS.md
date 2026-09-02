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

## Styling uses `_setCellMetaDeclarative`, not `setCellMeta`

`readOnly` and the `columnSummaryResult` class are written through `hot._setCellMetaDeclarative()`. That is
an **internal** Core method, deliberately kept off the public `HotInstance` type — this plugin reaches it
through a local `HotInstanceInternal` type.

Why it exists: such meta must survive the viewport meta eviction (DEV-1945) but must *not* be recorded as
user-defined, so an `updateSettings` cache reset clears it and it is re-applied for the current endpoints.
It fires neither `beforeSetCellMeta` nor `afterSetCellMeta` and **cannot be vetoed** — matching the direct
DOM write it replaced.

`refreshCellMetas()` exists because `updateSettings({ columns })` resets cell metas to their initial state.

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
