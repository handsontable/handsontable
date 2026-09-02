# ColumnSorting plugin — single-column sort

The `columnSorting` plugin sorts **the view, never the data source**. Read this before touching
`columnSorting.ts`, `columnStatesManager.ts`, `rootComparator.ts`, `domHelpers.ts`, `utils.ts` or anything
under `sortService/` and `sortFunction/`.

`../multiColumnSorting/` extends this class. The two are mutually exclusive at runtime (`pluginConflictsState`
warns and refuses the second one), and most of what follows applies to both — read that file's AGENTS.md for
the differences.

## It sorts the view

The sort is a row-index permutation held in an `indexesSequence` index map. Nothing in the data source
moves. So `getSourceData()` returns the original order, and physical row indexes are unchanged by a sort.

Two index maps and one state map:

| Map | Type | Holds |
|---|---|---|
| `columnSorting` (row) | `indexesSequence` | the sort permutation |
| `columnSorting.columnMeta` (column) | `physicalIndexToValue` | merged plugin settings per column, lazily resolved |
| `columnSorting.sortingStates` | `linkedPhysicalIndexToValue` | which columns are sorted, and in which order |

The `columnMeta` map's initializer converts physical → visual and **falls back to the physical index when
`toVisualColumn()` returns `null`**. Keep that fallback: during an alter the column may have no visual index
yet.

## Sort configs carry VISUAL column indexes

`getColumnNextConfig()`, `sort()` and `getSortConfig()` all speak visual indexes, and
`areValidSortConfigs()` says so explicitly: *"We don't translate visual indexes to physical indexes."* The
`sortingStates` map, by contrast, is keyed physically. Mixing the two is the classic bug here.

## A header press is queued, not acted on (DEV-1782)

The column header is also the surface ManualColumnMove drags a column by, so **which action the user meant
is only known on release**: a press that stays put is a click to sort, a press that travels is a drag.
`#pendingHeaderSort` holds the queued press and `#resolvePendingSort()` decides.

Everything about that machinery is load-bearing:

- **Selection changes still happen on mouse *down***, so the header reacts the moment it is pressed. Only
  the sort waits.
- **`#onBeforeOnCellMouseDown` drops any stale press.** A release that never arrived — the window lost focus
  while the button was held — would otherwise resolve on the next unrelated release and sort a column out of
  nowhere.
- **Two release signals, deliberately.** `afterOnCellMouseUp` is primary: on touch devices Walkontable calls
  its `onMouseUp` straight from `touchend` instead of dispatching a DOM `mouseup`, so a document listener
  alone would never fire and tapping a header would stop sorting. A raw `mouseup` on `documentElement` is
  the fallback for a release landing outside any cell — the drag case, where the queued sort still has to be
  cleared. `#resolvePendingSort` takes the queued press first, so whichever signal arrives first wins and
  the rest are no-ops.
- **Two cancel checks, also deliberately.** Both this plugin and ManualColumnMove handle the same `mouseup`
  and **the listener order is not fixed** — re-enabling `columnSorting` after `manualColumnMove` appends
  this listener last. Running first, the drag is still in progress (`#isColumnBeingDragged()`); running
  second, the move has already fired (`consumedByMove`, set from `afterColumnMove`). Either one cancels.
- **A mid-edit cell must finish validating before the rows move under it.** The `postAfterValidate` promise
  is subscribed on **press**, not on release: selecting the column closes the editor and its validation runs
  in a microtask, so it is already over by mouse-up — and reading `awaitsValidation` on release is wrong
  too, because by then the new selection has opened an editor on the highlighted cell. The wait happens in
  `#resolvePendingSort`, not in `applyHeaderClickSort`, so subclasses overriding that seam still get it.

`applyHeaderClickSort(press)` is the extension seam: MultiColumnSorting overrides it to build a different
sort config for the same gesture without repeating any of the click-versus-drag handling.

## Compare functions are created once per sort run

`rootComparator` resolves the compare function **outside** the returned comparator. Re-invoking the factory
per comparison would allocate a fresh closure ~n·log(n) times and defeat the per-run value memoization the
built-in compare functions rely on (DEV-2087). Any new compare function that caches must be created at the
same place.

The sorted rows are arrays of the form `[rowIndex, ...values]`, so the only sorted column's value sits at
index **1**.

## The sort indicator reserves room on the header *container*

`has-sort-indicator` goes on the header container, not the label. Padding on the label would enlarge the
area that sorts on click — exactly what it must not do. It is a class rather than a `:has()` selector
because `:has()` is banned in this package (see the root `AGENTS.md`).

`sortAction` is required before reserving: the CSS that pulls the indicator out of the flex row is keyed on
it, and with `headerAction: false` the label shows an indicator but keeps its full width, so reserving would
just push it inwards.

## `destroy()` has to clear the private field by hand

`BasePlugin.destroy` nulls enumerable *own* properties, which cannot reach a `#private` field. So
`#pendingHeaderSort = null` and `columnStatesManager?.destroy()` are explicit here. Any new `#field` holding
state needs the same treatment.

## Known workaround

`enablePlugin()` carries a `// TODO: Workaround? It should be refactored / described.` guard on
`this.hot.view` — the #6806 initialization-order problem described in `../base/AGENTS.md`.

## Where to look next

- Multi-column variant and the conflict between the two: `../multiColumnSorting/AGENTS.md`.
- The drag that competes for the same gesture: `../manualColumnMove/AGENTS.md`.
- Compare-function registry per cell type: `sortService/`, `sortFunction/`.
- Index map tiers (a sort is a permutation, not a trim): `../../../.ai/INDEX-MAPPING.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='columnSorting'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='columnSorting'`

`__tests__/` has `a11y/`, `rtl/`, `sortFunction/` and a dedicated `keyboardShortcuts.spec.js` — a sorting
change usually touches more than the main spec.
