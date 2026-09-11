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

## Fixed rows are out of the sort by default, and the flag is grid-level (DEV-1713, DEV-59)

Rows pinned by `fixedRowsTop` and `fixedRowsBottom` take no part in the sort. That landed in #12627
(DEV-1713) and shipped in **18.0.0**, as a deliberate breaking change: a footer row holding a SUM
over absolute addresses was being permuted into the middle of the data.

**The upper bound is an extension seam, so `sortByPresetSortStates()` must read it through `this`.**
The sort walks from `#getSortableRowStart()` (inclusive) to `this.getNumberOfRowsToSort(countRows)`
(exclusive), and `getNumberOfRowsToSort()` is the band's **upper bound**, not a count, whatever its
name suggests. It is a plain method, so a subclass can override it to narrow the sort - and that
only works while the sort calls it. A DEV-59 refactor once folded both bounds into one private
helper and called that instead: the method survived as a wrapper, overriding it silently did
nothing, and a review caught it. `sortableRowRange.unit.js` now pins an overriding subclass, so do
not inline the upper bound again. The lower bound stays private because nothing ever overrode it.

**DEV-59 asked for exactly that change, so the ticket's own text is already delivered.** What DEV-59
added on top is the escape hatch: `sortFixedRows`, default `false`, which when set to `true` puts the
pinned rows back inside the sort range and restores the pre-18.0.0 behavior. `SORT_FIXED_ROWS_DEFAULT`
in `columnSorting.ts` is the single place the default lives - flipping it to `true` would un-pin those
rows for every grid that does not set the option, and is a breaking change in its own right.

Three things about the flag are load-bearing:

- **It is read at sort time, from the grid settings, never cached.** `#sortsFixedRows()` reads
  `getSettings()[this.pluginKey].sortFixedRows` on every call, exactly as `fixedRowsTop` is read one
  line below. So `updateSettings` needs no wiring, and the wrappers re-sending an unchanged settings
  object costs nothing.
- **It is deliberately NOT in `inheritedColumnProperties`** (`columnStatesManager.ts`). The other
  sub-options - `sortEmptyCells`, `indicator`, `headerAction`, `compareFunctionFactory` - resolve per
  column and can be overridden through `columns`. This one cannot: `fixedRowsTop`/`fixedRowsBottom`
  pin rows for the whole table, so two columns could not disagree about which rows are in range. Do
  not "fix" that by adding it to the list. A value written inside `columns` is ignored, and
  `getPluginColumnConfig()` warns about it once per grid (`warnOnce`, scoped to `rootElement`) - that
  method is the one place every per-column config passes through, for both forms of `columns`. It
  must stay a warn-once: the column meta cache rebuilds on every `updateSettings`, and each rebuild
  resolves every column config again.
- **`isPlainObject` guards the boolean form.** `columnSorting: true` enables the plugin with no
  sub-options at all, so the settings value is a boolean and has no properties to read.

`MultiColumnSorting` overrides neither `getNumberOfRowsToSort()` nor `sortByPresetSortStates()`, so it
inherits both the default and the flag. `#sortsFixedRows()` is a `#private` method, which is fine on a
subclass instance: the brand is installed by this class's constructor, which runs through `super()`.

**Only the sorted band is mapped, and nothing is appended after it.** `indexMapping` is built by
walking `indexesBefore`, whose length is the band's, so the rows outside the band keep their place
because they never enter the map. DEV-59 removed an `// Append fixedRowsBottom + spareRows` loop
that ran after the `sort()` call: it pushed **visual** indexes onto `indexesWithData` where every
other entry is **physical**, and `indexMapping` never read past `indexesBefore.length`, so not one
of those entries was ever used. It also paid a `getDataAtCell()` per excluded row per sort config on
every sort. Do not re-add it - if the rows outside the band ever need to move, they need a place in
`indexesBefore` too.

## Spare rows are counted, not assumed (#5983)

`getNumberOfRowsToSort()` keeps the trailing spare rows out of the sortable range, and it decides
how many there are by counting them with `isEmptyRow()`, capped at `minSpareRows`, never from the
option alone. The walk stops at the cap on purpose, so do not swap it for `countEmptyRows(true)`:
that one is uncapped, reads every column of every row it visits, and this runs on every sort.
`minSpareRows` says how many trailing empty rows the Core tops the grid up to, not how many
are on screen: a filter trims an empty spare row exactly like any other non-matching row, and
nothing re-creates it while the filter is on (`adjustRowsAndCols()` runs after alters, data changes
and `updateSettings`, never on `trimmedIndexesChanged`). Subtracting the option from a filtered
row count therefore excluded the last N **real data rows** from the sort and re-appended them
unsorted at the bottom. The cap matters in the other direction too: trailing empty rows beyond
`minSpareRows` are ordinary data and stay in the sort.

`MultiColumnSorting` does not override the method, so both plugins share this and any change to it.

**Known overlap - open as DEV-2881, do not "tidy" it here.** The count and `fixedRowsBottom` are
subtracted independently, but a spare row is appended at the end of the data, so it sits *inside*
the band `fixedRowsBottom` already reserves. With `minSpareRows: 1, fixedRowsBottom: 1` and no
filter both terms describe the same row, two rows leave the sortable range, and the last real data
row is left unsorted, which is the #5983 symptom reached through a different option. The bound
should be `numberOfRows - Math.max(spareRows, fixedRowsBottom)`. Neither the #5983 fix nor DEV-59
changed that: the counted value is never larger than `minSpareRows`, so the subtraction is exactly
what it always was. One asymmetry DEV-59 did introduce - with `sortFixedRows: true` the
`fixedRowsBottom` term is zeroed, so the overlap disappears and that path's range is correct.

Nothing in either sorting suite covers the overlap. `__tests__/columnSorting.spec.js`'s "should
respect `fixedRowsTop`, `fixedRowsBottom`, and `minSpareRows` together" is the only test in
`columnSorting/__tests__` or `multiColumnSorting/__tests__` that sets both options, and it is
blind to it - its `Total` row holds the largest value in the sorted column, so it lands on the
same row whether or not it took part in the sort, and all four assertions hold either way
(verified by removing the spare-row term from a built bundle: identical output). Whoever fixes
the overlap has to give that spec a `Total` value that is not the extreme one before it can say
anything.

## The sort indicator reserves room on the header *container*

`has-sort-indicator` goes on the header container, not the label. Padding on the label would enlarge the
area that sorts on click — exactly what it must not do. It is a class rather than a `:has()` selector
because `:has()` is banned in this package (see the **monorepo-root** `../../../../AGENTS.md` — that ban is
declared there, not in the core-package file).

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
