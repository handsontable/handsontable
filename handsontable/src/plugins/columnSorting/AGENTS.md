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

## Two sort shapes, and the guard that picks between them

`sortByPresetSortStates()` has two gather-and-sort paths, and they must stay behaviorally identical.

- **Parallel value arrays (the default).** `#sortRowPositions()` gathers one physical-row array plus one
  value array per sorted column, with no per-row object, and sorts a plain `number[]` of positions
  0..n-1 with `positionComparator()` from `rootComparator.ts`, which reads `columnValues[k][position]`.
  A plain array, never an `Int32Array`: `getNumberOfRowsToSort()` is an overridable seam, a widening
  override makes `toPhysicalRow()` return `null`, and a typed array would store that as physical row 0.
- **`[rowIndex, ...values]` tuples (the fallback).** `#sortRowTuples()` keeps the original shape and goes
  through the registered root comparator, so the only sorted column's value sits at index **1**. This is
  the shape a **custom root comparator** receives, and the only path that calls one.

**The guard is an identity check on the registered comparator function, re-evaluated on every sort run** —
`getBuiltInPositionComparator(this.pluginKey)`. A key whitelist would be wrong: `staticRegister.register()`
replaces silently, so `registerRootComparator('columnSorting', mine)` overwrites the built-in under the very
key the plugin sorts with, and a whitelist would take the fast path and never call `mine`. `this.pluginKey`
proves nothing either — `sortableRowRangeOverride.unit.js` pins subclass-registered-under-the-parent's-key
as a sanctioned pattern. A new built-in comparator pairs itself with its parallel-arrays equivalent through
`markBuiltInRootComparator(rootComparator, positionComparator)`, beside its `registerRootComparator()` call.

Both paths return `{ indexesBefore, indexesAfter, highestPhysicalIndex }` and share the index-mapping tail,
so a change to the mapping is written once. Both gather **column-major** through the bulk accessor — one
resolved read per sorted column, not one per cell — so with two or more sorted columns a `modifyRowData` or
`modifyData` listener sees all of column A's rows and then all of column B's, where the per-cell gather this
replaced interleaved them. Values are unaffected and a single-column sort is order-identical; only a listener
that counts or logs can observe it. Ties stay deterministic because `Array.prototype.sort` is stable and
both comparators are pure functions of the gathered values.

`registerRootComparator`/`getRootComparator` are not public API: they come from `staticRegister` and are
re-exported only by `sortService/index.ts`, never by `plugins/columnSorting/index.ts` nor the package entry.
The genuinely public seam is `compareFunctionFactory(order, meta, settings) => (value, nextValue) => number`,
and it is untouched by either path.

**One semantic, two implementations, and only the second one runs by default.** Any change to a compare
function, a tie-break rule or the empty handling has to land in both.
`__tests__/comparatorCrossCheck.unit.ts` fuzzes them against each other — random values including empties,
numeric strings, booleans and mixed types, `sortEmptyCells` both ways, both orders, over a seeded
generator so a failure reproduces — and it sorts each trial three ways: the tuple comparator pairwise, the
same tuples through `sort()`, and the positions sort. All three must produce the same permutation.

The comparator is resolved **before** the gather loop, where `sort()` resolved it after. A `modifyRowData`
or `afterGetCellMeta` listener that re-registers the root comparator mid-gather was honored before and is
ignored now. No test covers it and none reasonably could.

## A built-in compare function extracts its keys once, not per comparison

A compare function may implement a `prepare(rows, valueIndex)` / `prepareValues(values)` /
`compare(keys, index, nextIndex)` seam next to being callable (`sortService/preparedComparator.ts`).
`sortService/engine.ts` uses it on the tuple path: it asks the root comparator to prepare, sorts with the
key-reading comparator, then undecorates. `positionComparator()` uses `prepareValues()` directly, because a
position already *is* the row's index into the key store. `sortFunction/default.ts` is the only compare
function that implements the seam today — it lowercases, tests emptiness and parses each row **once**, into
parallel columnar arrays, instead of re-deriving both operands of every comparison. The date and time
factories already memoize their parses per run (`utils.ts`), so they are not worth converting; a compare
function must never do both.

Three rules hold that together:

- **Membership is a module-private `Symbol`, never the presence of the three method names.**
  `markPreparedCompareFn()` sets it and only a built-in factory calls that; `isPreparedCompareFn()` and
  `isPreparingRootCompareFn()` read it. A probe on property names would be a probe on **user-supplied
  objects** — `createColumnCompareFunction()` returns whatever a `compareFunctionFactory` hands it, and a
  user compare function that happens to carry `prepare` and `compare` would be routed down the prepared
  path and silently sort by keys it never produced. The same probe on a root comparator's return crashed on
  the `cleanup()` a comparator outside the seam has no reason to provide. Two symbols, not one: a compare
  function and a root comparator answer different calls.
- **The seam is opt-in and invisible to anyone who does not use it.** The factory still returns a callable
  function, so `sortFunction/checkbox.ts` (which falls back to the default compare function pairwise) and
  every user-supplied factory are untouched. A root comparator outside the seam — every custom one — is
  handed the rows exactly as before, and a root comparator factory that returns nothing still reaches
  `Array.prototype.sort(undefined)` rather than throwing.
- **The decoration is one numeric slot appended at the end of every row array**, holding that row's index
  into the key stores. It is appended, never inserted, so `[rowIndex, ...values]` stays true for slots
  `0..k`, and `cleanup()` pops it once the sort finishes. Keys cannot live in a side array indexed by the
  original position: `Array.prototype.sort` permutes the elements and the comparator receives elements,
  not indices.

`__tests__/sortService/preparedComparator.unit.ts` pins the engagement (a sort through `sort()` calls
`prepare` once and the raw callable zero times) and the guard (a decoy compare function and a decoy root
comparator both stay pairwise).

## `sortService` is a module cycle: import the barrel first, from anywhere

`sortService/registry.ts` → `sortFunction/default.ts` → `sortService/index.ts` (the barrel) → `registry.ts`.
`engine.ts` and `preparedComparator.ts` sit inside it too — `engine` imports `registry`, `preparedComparator`
imports `engine` for `DO_NOT_SWAP`, and `engine` imports `preparedComparator` back for the seam check.
Nothing anywhere in the cycle dereferences at module-init, so `src/` is safe: the plugin entry pulls the
barrel first, and everything after it reads a finished module.

**A test can reverse it, and it will not be obvious why.** A Jest file whose **first** import is
`sortService/registry` — or any deep import that reaches `registry`, `engine` or `preparedComparator` before
the barrel — starts the cycle at the wrong end, and the barrel's re-exports resolve against a half-built
module: every one of them reads as `undefined`. What that looks like depends on what loads next. Import a
plugin module afterwards and it dies at module init with
`TypeError: (0 , _sortService.registerRootComparator) is not a function`, pointing at a line that has been
correct for years (verified, from both `engine` and `preparedComparator`). Import nothing else and it is
silent: `DO_NOT_SWAP` and friends are `undefined` inside the sort functions, so every comparison returns
`undefined`, nothing is reordered, and no error is raised anywhere.

The fix is an import order, not a code change: reach the service through
`handsontable/plugins/columnSorting/sortService`, or import a plugin module (`columnSorting.ts`) first when
the test needs the registration side effects. `sortService/__tests__/registry.unit.ts`,
`__tests__/sortService/preparedComparator.unit.ts` and both `comparatorCrossCheck.unit.ts` files all open
with that import and say why.

## The gather loop reads through a guarded bulk accessor, and the guard is the safety argument

`sortByPresetSortStates()` no longer calls `getDataAtCell()` per cell. It translates the band's physical
rows once and then calls `this.hot._getDataAtColumnForRows(column, physicalRows)` per sort config — an
internal `Core` method backed by `DataMap#getAtColumnForRows()`. That accessor resolves the column
property, the visual and physical column, the settings and the hook answers once, then reads the source
rows in a tight loop. `_getDataAtColumnForRows` is deliberately **not** on the public `HotInstance` type
(`core/types.ts`), which is emitted into the published `.d.ts`; the plugin reaches it through a local
`HotInstanceInternal`, the way `columnSummary/endpoints.ts` reaches `_setCellMetaDeclarative`.

**`physicalRows` is the only row source.** The fast loop reads `dataSource[physicalRows[i]]` and every
fallback translates that same entry back with `toVisualRow()` before calling `get()`, which takes a visual
row. An earlier draft walked the fallback as `firstVisualRow + i`: two row spaces in one function, agreeing
only for a contiguous band.

**That loop runs no user code, so a missing probe does not throw — it sorts by a different value.** No
existing spec would catch it: a fixed benchmark cannot see a fast path that is fast because it reads the
wrong value. The exits, all re-read per call because a host app can register a listener or retype a column
at any time:

- a `columns[].data` accessor function, or a `dataDotNotation` property path;
- a listener on `modifyRowData` (NestedRows), `modifyData` or `modifySourceData` (Formulas);
- a `valueGetter` resolved by the **column meta layer** — `autocomplete`, `dropdown` and `multiSelect` each
  ship one, and `ColumnMeta#_createMeta()` returns the constructor's prototype, so reading `valueGetter`
  off `getColumnMeta(physicalColumn)` resolves exactly what a transient cell meta would;
- **per row**, any cell that carries *stored* meta, which the column layer cannot see. `cells()` and
  `setCellMeta()` both land a `valueGetter` on one cell, and stored meta is created by rendering, so a
  painted grid reads its viewport rows one way and the rest another *today*. The accessor reproduces that
  split instead of picking one answer for the column.

Tests: `dataMap/__tests__/dataMap.unit.js` pins the guard against a hand-built context (in jsdom every row
renders, so the per-row probe alone would make any value come out right and the column probe would go
untested), and `tests/e2e/sort-value-getter-guard.spec.ts` pins the viewport split in a real browser.

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

## Body formulas can go `#REF!` after sort — do not remap them (DEV-917)

`#12627` keeps frozen footer and header rows out of the sort. That does **not**
protect formula cells in the sortable body. HyperFormula can return `#REF!`
there, and a later sort does not recover the formulas. Do not add spreadsheet-style
address remapping in this plugin. Documented as a known limitation; the
workaround is `fixedRowsBottom`.

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

**Spare rows overlap `fixedRowsBottom` (DEV-2881).** A spare row is appended at the end of the
data, so it sits *inside* the band `fixedRowsBottom` already reserves. The bound is
`numberOfRows - Math.max(spareRows, fixedRowsBottom)` - subtracting the terms independently
dropped one real data row per overlapping row. `sortFixedRows: true` zeroes the pinned term,
which used to *mask* the overlap rather than fix it; the `max` still has to run so spare rows
stay out. There is no separate `maxRows` formula: `countRows()` is already
`min(length, maxRows)`, so the walk always runs and the bound is always that `max`.

The spec that sets both options (`__tests__/columnSorting.spec.js`, "should respect
`fixedRowsTop`, `fixedRowsBottom`, and `minSpareRows` together") must keep a **non-extreme**
`Total` value. `111` was the largest value among the sortable rows (`Header` holds `999`, but
`fixedRowsTop` holds it out), so `Total` landed last whether or not it took part in the sort
and the overlap was invisible. Keep `fixedRowsBottom` wider than `minSpareRows` there too:
with both at 1 the bound is the same as either option alone. `sortableRowRange.unit.js` covers
both directions of the overlap (more spares than pinned rows, and more pinned rows than
spares) plus `maxRows` capping the displayed count.

## The remap table must cover the highest physical index the band holds

`sortByPresetSortStates()` rewrites the indexes sequence through an `Int32Array` keyed BY physical row
index, so **its length is `highestPhysicalIndex + 1`, where `highestPhysicalIndex` is the largest physical
index the sorted band actually gathered** — tracked in the gather loop of whichever path ran. That is the
whole rule, and it is sufficient by construction: every write index comes from the band, so no write can
land above it, and every read above it falls through by design (`undefined >= 0` is `false`).

Two lengths that look right and are not. `countRows()` is `getNotTrimmedIndexesLength()` clamped by
`maxRows`, so under `filters`, `trimRows` or a plain `maxRows` the band's physical indexes reach past it.
`getIndexesSequence().length` is no better — `setIndexesSequence()` is public and accepts an index above
the sequence length. Either one undersizes the table; a typed-array write past the end is discarded with no
error and the read gives `undefined`, so those rows silently keep their pre-sort place and the sequence ends
up with duplicated physical indexes.

**Guard `toPhysicalRow()`'s `null` at both ends.** A subclass may widen `getNumberOfRowsToSort()`, and the
visual rows past the mapper's reach answer `null`. `null > -1` is `true`, so an unguarded comparison makes
`highestPhysicalIndex` itself `null`; and a typed array coerces a `null` **value** to `0`, so writing one
would remap a real row onto physical row 0 — a duplicated row with no error, where the `Map` this replaced
fell through to the row's own index. Both ends use `isUnsignedNumber()`, which rejects `null` where `>= 0`
accepts it. `__tests__/widenedSortableRange.unit.js` pins the output against the `Map`'s.

`-1` is the "untouched" sentinel, because a physical index is never negative. The typed array is internal
scratch: `setIndexesSequence()` must still receive a plain `number[]`, and that array is grown by ascending
assignment from an empty literal so it stays packed. `__tests__/sortIndexRemap.unit.js` pins the sizing
against a trimmed band.

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

- Sort-after-`#REF!` is a known limitation (DEV-917), not a remapping feature: `../formulas/AGENTS.md`.
- User-facing copy: `docs/content/guides/rows/rows-sorting/rows-sorting.md`.
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
