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

## The sort indicator reserves room on the header *container*

`has-sort-indicator` goes on the header container, not the label. Padding on the label would enlarge the
area that sorts on click — exactly what it must not do. It is a class rather than a `:has()` selector
because `:has()` is banned in this package (see the **monorepo-root** `../../../../AGENTS.md` — that ban is
declared there, not in the core-package file).

`sortAction` is required before reserving: the CSS that pulls the indicator out of the flex row is keyed on
it, and with `headerAction: false` the label shows an indicator but keeps its full width, so reserving would
just push it inwards.

## The indicator is a real element (DEV-3003), and it still needs the ghost-table `*` stand-in

`#onAfterGetColHeader` keys `syncIcon(this.hot, container, 'ht-sort-indicator', iconName)` on the sort
order and the `indicator` setting: ascending → `arrowNarrowUp`, descending → `arrowNarrowDown`, anything
else (no sort, `indicator: false`, or the whole plugin disabled via `disablePlugin()`'s `clearColHeader`) →
`null`, which removes the slot. `syncIcon` guarantees exactly one `<i class="ht-icon
ht-sort-indicator">` in the container regardless of how many times a render calls this hook.

Two traps if this ever moves again:

- **The icon is `position: absolute`, in the ghost table too — and that means it reserves NOTHING by
  itself, there or in the real table.** `GhostTable#addColumn` clones a header through
  `TableView#appendColHeader`, which fires `afterGetColHeader` unconditionally — so the ghost clone gets
  the same real `.ht-sort-indicator` element the real table does. It does not follow that `AutoColumnSize`
  can drop the old `.htGhostTable … ::before { content: "*"; padding-inline-end: … }` stand-in in
  `_column-sorting.scss` (~line 208) and trust the `<i>` to reserve space by flowing into the row: an
  absolutely positioned element never contributes to a flow-based measurement, in the ghost table or
  anywhere else. Measured empirically while migrating: dropping that rule undersized a `has-header-button`
  auto-sized column by 34px, and the arrow overlapped both the label and the dropdown-menu button. The `*`
  rule stays — it is what stands in, in the ghost table, for the width the real table gets from
  `column-gap` (`--ht-header-button-slot`, zeroed inside `.htGhostTable`).
- **The indicator's own inset needs the same literal `+ 2px` the old pseudo-element carried.** The old
  `::before` used `right: 2px` (physical) *plus* `margin-inline-end: var(--ht-sort-indicator-offset-end)`
  — both stacked. `--ht-sort-indicator-reserve` (the padding the container holds open) is calibrated
  against that same total (`padding + icon-size + 2px`), so the real element's `inset-inline-end` has to
  add the `+ 2px` too, or the icon sits 2px closer to a trailing dropdown-menu button than the reserved
  space accounts for — invisible on a roomy column, a real 1px overlap on a tight auto-sized one.

## `destroy()` has to clear the private field by hand

`BasePlugin.destroy` nulls enumerable *own* properties, which cannot reach a `#private` field. So
`#pendingHeaderSort = null` and `columnStatesManager?.destroy()` are explicit here. Any new `#field` holding
state needs the same treatment.

## Known workaround

`enablePlugin()` carries a `// TODO: Workaround? It should be refactored / described.` guard on
`this.hot.view` — the #6806 initialization-order problem described in `../base/AGENTS.md`.

## Enabling via `updateSettings` must not sort twice (DEV-187)

A `disabled → enabled` transition through `updateSettings()` (e.g. `hot.updateSettings({ columnSorting:
{...} })` on a grid built without the option) runs the settings sort from **two** places in the same
pass: `enablePlugin()`'s `#loadOrSortBySettings()` (the #6806 `this.hot.view` workaround above, which
already fires because `view` exists by then) and `onUpdateSettings()`'s own tail call to
`sortBySettings(pluginSettings)`. Left unguarded, that runs the comparator twice for the same sort -
the original DEV-187 report blamed construction-time `initialConfig`, which was already fixed and
measures single on develop; the survivor is this enable-via-`updateSettings` path.

`onUpdateSettings()` captures `wasEnabled = this.enabled` **before** calling `super.onUpdateSettings()`
(which is what may flip `enabled` from `false` to `true`), and only re-sorts when the plugin was
`enabled` on **both** sides of that call. A fresh enable is left to `enablePlugin()` alone; an
already-enabled plugin receiving a new sort config through `updateSettings` still re-sorts here as
before. `MultiColumnSorting` overrides neither `onUpdateSettings()` nor `sortBySettings()` - its
`enablePlugin()` override only adds an already-enabled early return before delegating to `super`,
so it still runs the same #6806 workaround path - and it inherits this guard unchanged. Do not
special-case it.

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

## The ghost-table `*` reserve must restate the icon-size width (DEV-3003)

AutoColumnSize measures headers in `.htGhostTable`, where the arrow is stood in for by
`span.colHeader.columnSorting::before { content: "*" }` plus `padding-inline-end: icon-size + 2px`
(`_column-sorting.scss`). Before DEV-3003 the real table's `.sortAction::before` glyph rule also matched
that pseudo-element and gave it `width: var(--ht-icon-size, 16px)`, so the measured reserve was
`icon-size + (icon-size + 2px)` — 34px on main. The glyph rule went away with the pseudo-element icon, and
without the width restated on the ghost rule every sortable header with a menu button measured ~10px
narrower than 18.1: the visual suite flagged all 30 nested-headers goldens (complex-demo, nested-headers
collapse, filters active-class). The ghost rule now carries `width: var(--ht-icon-size, 16px)` itself.
Pinned by "the ghost-table sort reserve keeps its 18.1 geometry" in `tests/e2e/icon-elements.spec.ts`.
Repro harness: `handsontable/dev-DEV-3003-complex.html?build=pr|latest` (gitignored) exposes `window.hot`
and `window.measure()` for the complex demo's column widths.

## The indicator must stay a click target (DEV-3003)

Before DEV-3003 the arrow was `::before` of the `.colHeader` label, so a press on it targeted
the label and `wasClickableHeaderClicked()` accepted it. The arrow is a sibling `<i class="ht-icon
ht-sort-indicator">` now, and the base `.ht-icon` rule is `pointer-events: none` — which would make
the arrow the one part of a sortable header that does not sort (hits fall through to `.relative`,
which the gate rejects). Two things keep it working, and both must survive any refactor: the slot
rule in `_column-sorting.scss` sets `pointer-events: auto` (plus `cursor: pointer` via a `.sortAction ~`
sibling selector), and `wasClickableHeaderClicked()` accepts `SORT_INDICATOR_SLOT_CLASS` as a target
alongside `HEADER_SPAN_CLASS`. Pinned by "a click precisely on the indicator icon toggles the sort
order" in `tests/e2e/icon-elements.spec.ts`.
