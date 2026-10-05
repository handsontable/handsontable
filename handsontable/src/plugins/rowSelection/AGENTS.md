# RowSelection plugin — checkbox row selection and "select all"

The `rowSelection` plugin lets the user select rows with checkboxes, and select or clear a whole scope
from a "select all" checkbox (PRO-87, modeled on AG Grid's `rowSelection`). Read this before touching
`rowSelection.ts` or `scope.ts`.

## What it owns, and what it does not

- It owns a **row selection state of its own**: one boolean per physical row in a `physicalIndexToValue`
  map registered on `rowIndexMapper` under the plugin name (`'RowSelection'`). It is not the cell
  selection (`hot.getSelected()` never sees it), and it is never written into the data. A checkbox
  column bound to data is the `checkbox` cell type's job, not this plugin's.
- It does **not** own the order, the filtering, the hiding, or the paging of rows. It reads them: the
  index map follows its rows through sorts, moves, inserts, and removals by itself, and the scope rules
  in `scope.ts` read Filters, TrimRows, HiddenRows, and Pagination state at the moment they are asked.

## The traps

- **The "select all" checkbox must describe exactly the rows a click on it acts on.** Both go through
  `#getRowsInScope()` → `collectRowsInScope()`. A header computed over one row set and a click acting on
  another is the most-reported defect in other grids (AG Grid and MUI issues on filtered and paged
  scopes). Do not add a second way to compute either.
- **Mixed → select all.** `resolveHeaderToggleTarget()` follows the checkbox cell type's Space rule
  (`changeSelectedCheckboxesState`). MUI deselects from mixed and its users asked for the opposite.
- **HiddenRows and TrimRows rows are out of every scope, Filters rows are not out of `'all'`.** The map
  names are read from the index mapper's collections: HiddenRows registers `'HiddenRows'` (its plugin
  name), TrimRows registers the literal `'trimRows'`. Pagination is a hiding map too, so "hidden" cannot
  be read from `rowIndexMapper.isHidden()` — that would make `'all'` and `'filtered'` mean "this page".
  `__tests__/rowSelection.unit.ts` catches a wrong map name.
- **The map changes outside the plugin.** IndexMapper splices it on row insert and remove, and UndoRedo
  restores a removed row's flag. That is why the header state is a cache dropped from the map's own
  `change` local hook and from the mapper's `cacheUpdated`, not a counter the plugin keeps by hand.
- **Writes run under `operationScope.suppress()`.** The selection is UI state, like the cell
  selection: undo and redo do not replay it. Measured: a plain write records no step today either, so
  the suppression is a guard, not a fix — keep it.
- **`updatePlugin()` carries the selection over.** `disablePlugin()` unregisters the map, so the
  values are copied before and written back after. A wrapper re-sending unchanged settings would
  otherwise clear the selection on every render.
- **`afterRenderer` runs for every painted cell**, so the resolved settings are cached
  (`#settings`, re-resolved on enable). Do not call `#resolveSettings()` on the render path.
- **Under `renderMode: 'onChange'` a cell is repainted only when marked.** The selected-row class is
  state of this plugin's own, so every change calls `markAllCellsChanged()` before `render()`.
- **A press on a checkbox is handled on `mousedown`, and the `click` is cancelled.** The state is
  applied and rendered on `mousedown`; the browser's own toggle on `click` would then flip it back, so
  `#onRootClick` prevents it. The `mousedown` itself sets `isImmediatePropagationEnabled = false` (the
  CollapsibleColumns pattern, not `stopImmediatePropagation()` — DEV-214) and `preventDefault()`, which
  keeps the browser focus off the input so the keyboard stays with the grid.
- **A header with no label gets `htRowSelectionCheckboxOnly`** (the corner always; a column header whose
  label is empty, such as a column made only for the checkboxes in the `firstColumn` location). The CSS hides
  its label and centers the checkbox on both axes; an empty label would still take the room next to it.
- **The corner gets its own class (`htRowSelectionCorner`).** Core adds `cornerHeader` to a header label
  that renders a negative column and never removes it, so a header cell reused from the corner (switching
  `checkboxLocation`) keeps it. A CSS rule keyed on `cornerHeader` hid the first column's label. Pinned by
  the "keeps the first column label after switching" case in `tests/e2e/row-selection.spec.ts`.
- **Space on a data cell toggles its row (as in AG Grid), and must mark the event handled.** The editor
  manager opens an editor on any printable key in `afterDocumentKeyDown` unless
  `isImmediatePropagationStopped(event)`, and a shortcut returning `false` does not set that. Without the
  flag the first Space toggled the row AND opened the editor with a space typed, and the next Space went
  into the editor. A checkbox cell keeps its own Space (`#isHighlightOnDataCell()` skips checkbox cells
  and the plugin's own checkbox column). Shift+Space and Ctrl+Space keep selecting cells.
- **User-driven changes are announced** through `utils/a11yAnnouncer.ts` (`#notifyChange()`, which also
  runs `afterRowSelectionChange`): one row by number, more by the count in the "select all" scope. `'api'`
  and `'dataChange'` sources are silent, so a program or a paste does not chatter.
- **The corner's container must fill the header cell.** With its label hidden, the corner's `.relative`
  flex container shrank to the checkbox and sat at the top of the cell (4px above center on `main`), and
  the checkbox rule's `margin-top: -2px` lifted it further. `_row-selection.scss` sets `height: 100%` on
  the corner container and `margin-block: 0` on header checkboxes. Pinned by the "centers the select all
  checkbox vertically" case in `tests/e2e/row-selection.spec.ts`, on all three themes.
- **The row header column is pushed last** in `afterGetRowHeaderRenderers`, next to the data, and its
  column coordinate is `#rowHeaderRendererIndex - view.getRowHeadersCount()` (`-1` unless a plugin
  enabled after this one adds a column). The corner above it gets the same coordinate in
  `afterGetColHeader`. Do not hard-code `-1`.
- **NestedRows: `groupSelects` decides the tree's rules** (`#resolveGroupSelects()`), and a wrong guess about
  it breaks the parent's state. With `'descendants'` (the default) **only the leaves store a selection**: a
  parent's checked / mixed / unchecked state and whether it can be selected are computed from the leaves
  under it (`#computeGroupTree()`, one recursive pass over `dataManager.getData()`, cached in `#groupTree` and
  dropped wherever `#headerSummaryCache` is). A parent written into the map would be a second source of
  truth, so `#applyChange()` and `#getRowsInScope()` replace every parent with its leaves first
  (`#expandGroupsToLeaves()`: a parent's descendants are the physical rows right after it, `countChildren()`
  long). That also counts the leaves of a collapsed parent, which NestedRows trims. Consequences: the hooks
  and the "select all" count list leaves; `getSelectedRows()` lists checked parents too, `getSelectedCount()`
  does not; `isRowSelectable` rejecting a parent makes its whole subtree unselectable. `'singleRow'` and a
  bound column cannot express a mixed parent, so both fall back to `'self'`. `'topLevel'` keeps the
  level-0-only rule. Filters under NestedRows splices `__children` (see `../nestedRows/AGENTS.md`), so a
  filtered-out row is gone from the tree, not trimmed. Pinned by `__tests__/nestedRows.unit.ts`.

## A checkbox column as the selection (`checkboxLocation: { column }`)

`getBoundColumn()` resolves the column (a `data` prop through `propToCol()`, or a physical index through
`toVisualColumn()`); a column that is not `type: 'checkbox'` warns once and falls back to the row header
location. While bound, the selection IS the column's values:

- **Reads go to the data** (`#isPhysicalRowSelected()` → `isCheckedValue()` from
  `../../utils/checkboxColumn.ts`, the checkbox renderer's own test). The index map stays registered but
  is not read.
- **Writes go through `writeCheckboxColumn()` inside `runOperation()`**, with the source
  `'RowSelection.change'`: one undo step, and a server-backed grid saves it like any edit. The row-id
  model is off (`#isServerMode()` answers `false`): the data already persists the selection.
- **Edits from elsewhere reach the selection hooks** through `beforeChange`/`afterChange`
  (`#collectBoundFlips()`), mapped to the `'checkbox'` source for `'edit'` and `'dataChange'` for the rest.
  `beforeRowSelectionChange` returning `false` nulls every flipping change of that batch. The plugin's own
  source is skipped there, or its writes would be reported twice.
- **The header cache must drop on `beforeChangeRender`**, not only `afterChange`: an edit renders before
  `afterChange` runs, and the header would stay one change behind (measured in the Playwright spec).
- **One checkbox per cell.** `afterRenderer` injects nothing in the bound column, the Space shortcut stands
  aside for its cells (the checkbox cell type's own Space writes them), `enableClickSelection` ignores it,
  and the `CheckboxHeader` plugin (`../checkboxHeader/`) skips its header, which this plugin renders.
- A read-only or non-checkbox cell in the column cannot be selected.

## A server-backed grid (DataProvider)

Every page change is a `loadData()`, which re-creates the physical map with every row unselected. So
with DataProvider (`#isServerMode()`: the plugin is enabled and `hasExternalDataSource` answers `true`)
the selection lives in `rowIdSelection.ts`, keyed by `dataProvider.rowId`, and the physical map is only
a projection of it for the loaded page:

- **`#hydrateFromRowIds()` runs after every load** (`afterLoadData`/`afterUpdateData`) and after
  `updatePlugin()`. It writes the map silently and fires no selection hook: the selection did not change,
  only the rows in view.
- **"Select all" is an exclusion model** (`{ selectAll, toggledRowIds }`, AG Grid's server-side
  selection state). In the `'all'` and `'filtered'` scopes (`#isServerWideScope()`) a header click, a
  `selectAll()`, and a `deselectAll()` replace the whole model through `#replaceServerSelection()`; the
  server already filtered the rows, so the two scopes mean the same there. `'currentPage'` keeps the
  per-row path and records each row id explicitly.
- **Every per-row change goes through `#applyChange()`, which mirrors it into the model**
  (`#recordRowIds()`). A path that writes the map without it loses the change at the next page load.
- **`singleRow` mode and a plain click with `enableClickSelection` go through `#selectOnly()`**, which
  replaces the model: deselecting "the other rows" from the map alone would leave rows on other pages
  selected.
- **The header counts against `totalRows` from `afterDataProviderFetch`**, not the loaded rows. Under
  "select all" the count assumes every toggled id still matches the query, and `isRowSelectable` is
  only ever asked about loaded rows, so a rejected row on another page is counted. The guide documents
  both; the server has to apply the same rule.
- **The hooks list only loaded rows** (physical indexes). Rows on other pages have no index.
- `getServerSelection()`/`setServerSelection()` return `null`/`false` without a server-backed grid.

## Known gaps

- **The selected-row color is the `rowSelectionBackgroundColor` token** (`--ht-row-selection-background-color`),
  a semi-transparent accent per theme. In Figma it is `component/rows/row-selection-background-color` in
  the `themes` collection, aliasing `<theme>/custom/row-selection` in the `mode` collection (light/dark
  RGBA). The key is in `scripts/themes/figma/tokensKeys.mjs`, so `generate:themes-static` keeps it.
- **The `:indeterminate` dash icon** (`collapseOff`) matches the Figma checkbox component (node 13:1313,
  "Selection=Indeterminate"). It lives in the generator (`scripts/themes/figma/utils/helpers/iconsMap.mjs`
  and `templates/iconsMap.ts`, which `__tests__/iconsMap.test.mjs` keeps identical) and in the generated
  `src/themes/static/` files.
- **A server-side "select all" follows the query.** Changing the filters afterward changes which rows
  "all" means; the guide tells integrators to send the query with the selection.
- **`checkboxLocation: 'firstColumn'` widens the first column only when AutoColumnSize sized it**
  (`#onModifyColWidth` compares against `autoColumnSize.getColumnWidth()`); a user width is left alone,
  so the checkbox can then crowd the value.

## Where to look next

- Scope rules and the header state: `scope.ts` (pure, no Handsontable instance).
- The DOM-injection patterns it copies: `../dropdownMenu/` (`afterGetColHeader`),
  `../collapsibleColumns/AGENTS.md` (blocking the header press).
- Hiding vs trimming maps: `../hiddenRows/AGENTS.md`, `../pagination/AGENTS.md`.
- Undo/redo and index maps: `../undoRedo/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern=rowSelection` —
  `__tests__/scope.unit.ts` (the scope rules), `__tests__/rowIdSelection.unit.ts` (the exclusion model),
  `__tests__/rowSelection.unit.ts` (the API in a jsdom grid with Filters, HiddenRows, TrimRows,
  Pagination, ColumnSorting, UndoRedo, and NestedRows), `__tests__/nestedRows.unit.ts` (`groupSelects` on a
  three-level tree), and `__tests__/dataProvider.unit.ts` (a grid
  backed by an in-memory server, 10 rows per page). The DataProvider suite logs jsdom
  `Could not parse CSS stylesheet` errors from the theme engine; they are not this plugin's (same count
  without its token).
- E2E: `cd tests && npx playwright test e2e/row-selection.spec.ts` (fixture
  `tests/fixtures/demo/row-selection.html` and `row-selection-data-provider.html`, page object
  `RowSelectionPage`). It reads stylesheet rules,
  so rebuild the full package first (see `tests/AGENTS.md`).
