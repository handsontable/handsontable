# SheetsBar

A tab bar above or below the grid (`position` picks the layout slot, `'bottom'` by default,
weight 50) for switching between the sheets of a
multi-sheet workbook. `PLUGIN_PRIORITY` 910 — the `900`+ band, because a switch applies another
sheet's settings and data, so every other plugin must already be enabled. Root instance only
(`isEnabled()` gates on `isRootInstance`).

## What it owns

- `sheetModel.ts` — the sheet collection (ids, unique clamped names, order). Pure, no
  Handsontable access. Names are compared NFC-normalized; length is counted in grapheme
  clusters (`Intl.Segmenter`), not UTF-16 units — the rename input enforces the same limit in
  its `input` handler, never through `maxlength`.
- `viewState.ts` — capture/restore of one sheet's runtime view state. **Order is load-bearing**:
  the column order goes before the sort re-apply (the sort config addresses its column
  visually), sort is cleared and re-applied around the row order (the sorting plugin resets
  rows to its own pre-sort cache on every `sort()`), filters and trimming re-apply before the
  hidden sets (hidden indexes are stored as physical, and so are the tracked cell-meta
  entries), and the selection and scroll run through `restoreViewport()` **after** the render
  batch, once the arriving sheet is painted at its own sizes. `restoreViewport()` puts the
  Pagination page and page size back first (`setPageSize()` then `setPage()`, each skipped when
  unchanged, the page clamped to the arriving count first): Pagination holds one page for the
  whole grid and clamps it on every load, so a switch through a shorter sheet moves it, and a
  selection or scroll aimed at a row on another page lands on a hidden row and does nothing. A
  never-visited sheet gets `resetViewport()` instead — the configured `initialPage` and
  `pageSize`. Both go through the public API, so the page hooks fire on a switch that changes
  the page. With an external data source (`hasExternalDataSource`) the page is neither captured
  nor restored: DataProvider answers a page change with a fetch, and the result would load into
  whichever sheet is active when it resolves. After that batch `keepSelectionOnPage()` checks the
  focus against the shown page — a `'auto'` page size decides its boundaries from the row heights
  of that paint, a `beforePageSizeChange` veto leaves the page counted in the old size, and a
  `beforePageChange` veto keeps the clamped page. A restored selection is followed to its page —
  one `setPage()` to the estimated page (the number page size as the page length, the shown
  span for `'auto'`), so a gap of many pages fires the page hooks once, then a one-page walk.
  Never re-estimate from each page reached: a short last page or `'auto'` pages of other
  lengths make repeated estimates bounce past the row; a selection carried over from
  the previous sheet, or one the follow could not reach, is deselected rather than left on a
  hidden row.
  The selection itself is kept twice: `selection` (`getSelected()`) and `selectionState`, a copy
  of `Selection#exportSelection()` (the active range is cloned — the export hands it out live —
  and so are the ranges handed to the import, or the stored state would become the live
  selection). A selection made from a header or spanning a whole axis (any header or
  extent-spans flag in `selectionState`) cannot be judged from its coordinates: `selectCells()`
  rejects a range that contains headers (beyond a single header, even with `navigableHeaders`),
  while a whole column on page 2 or later has none — Pagination moves its start to the page's
  first row — so `selectCells()` would accept it and drop the header and span flags. Such a
  selection is replayed instead: one layer through `selectRows()`/`selectColumns()`/`selectAll()`,
  which run the selection hooks and set the `ht__selection--rows`/`--columns` classes; several
  layers through `importSelection()`, followed by one `setRangeEnd()` + `finish()` on the last
  layer, the step core answers with those classes and hooks — and since that step makes the last
  layer active, a `setRangeFocus()` after it puts the captured focus and active layer back. A
  plain cell selection goes through
  `selectCells()` and gets its focus and active layer back with `setRangeFocus()`. A stored
  order whose length no longer matches the data is skipped. Stored trimmed rows at or past `countSourceRows()` —
  read after the arriving sheet's `loadData()`, so rows padded by `minRows`/`minSpareRows`
  count — are dropped one by one before `trimRows()`, which rejects the whole list when any
  index is out of range. Like the hidden sets and manual sizes, the kept ones follow physical
  position, not the record, after the host changed the sheet's data while it was away.
  Manual sizes are stored as sparse `[physicalIndex, size]` pairs read and written through the
  resize plugins' `getManualSizes()`/`setManualSizes()` (physical, so a trimmed row keeps its
  height) and cleared through their bulk `clearManualSizes()`. NestedRows drops its collapsed parents on
  every `loadData()`, so the view state carries them as tree paths (`collapsedParents`, via the
  data manager's `getRowTreePath()`/`getRowIndexByTreePath()` — a physical index shifts when the
  sheet's data gains a row while it is away) and replays them after the hidden sets, with hooks
  off (DEV-3042). Before the hidden sets, the collapse would trim a hidden child out of the
  visual space its stored index is mapped through. For the same reason the hidden rows are
  captured physically off the plugin's hiding map (`hidingMapsCollection.get(pluginName)` –
  the map is registered under the upper-cased `HiddenRows`, not `hiddenRows`), not through
  `getHiddenRows()`: a hidden child of a collapsed parent has no visual index at capture time.
- `ui/` — `bar.ts` (DOM via `buildTemplate`, labels re-applied by `refreshLabels()` on language
  change), `tabStrip.ts` (tabs, inline rename, focus capture/restore across repaints),
  `tabDrag.ts` (pointer drag + FLIP), `menus.ts` (two `Menu` instances built once and refilled
  per opening — the shared `Menu` never removes the `afterSetTheme` hook its constructor adds),
  `overflow.ts` (paging arrows, `aria-disabled` so a spent arrow keeps the focus, and the
  `ht-sheets-bar__tabs--scrolled` divider class once the strip leaves its start).

## Traps

- **The keyboard lives in a shortcut context** (`plugin:sheetsBar`) behind a focus scope, like
  Pagination. The scope's `runOnlyIf` stands aside while one of the bar's menus is open — the
  click that opens a menu reaches the scope manager after the menu has taken the keyboard, and
  re-activating the scope would hand it back to the grid. The activation shortcut sets
  `stopPropagation`, or the menu it opens would run its first item on the same keystroke; the
  rename input stops its own Enter/Escape for the same reason, and ignores them mid-IME
  composition (`isComposing`/keyCode 229).
- **Drag decisions use transform-neutral geometry.** `#reorder` subtracts each tab's in-flight
  FLIP translation before comparing centres; measuring the animated rects makes a 2px pointer
  wobble swap two tabs back and forth for as long as the slide runs. A DOM reorder also drops
  the pointer capture — `lostpointercapture` re-captures while the tab is still in the strip
  and only cancels when the pointer is truly gone.
- **Per-sheet `settings` go through `updateSettings()` with a baseline.** The grid-level value
  of every key any sheet overrides is captured the first time that key is applied
  (`#withBaselineFor`); `undefined` baselines are restored as `null`, because `updateSettings`
  reads `undefined` as "not provided". The baseline and the model travel across an
  `updatePlugin` whose `sheets` value is structurally unchanged, and are dropped on a genuine
  reconfiguration. Only `sheets` decides the workbook's identity — `updateSettings` replaces
  the grid-level `sheetsBar` object wholesale, so a partial payload (`{ paging: false }`,
  `{ activeSheet: 2 }`) must be judged through the plugin's merged `getSetting('sheets')`, not
  the raw grid value, or every UI tweak would rebuild the workbook. "Structurally unchanged"
  compares each sheet's `settings` by content and its `data` by reference — an equal fresh
  literal with stable data references keeps the workbook; recreated data arrays rebuild it (a
  rebuild re-activates the previous sheet by name when `activeSheet` itself did not change). A
  changed `activeSheet` on a preserved cycle is an explicit switch request. A sheet's own
  `settings` cannot carry a `sheetsBar` key. The neutral `fixedColumnsStart` is captured only
  on a non-preserved enable, and a genuine teardown first restores the settings baseline to
  the grid (`#restoreBaselineToGrid`, which empties the baseline before its `updateSettings`
  call — the write re-enters `disablePlugin` on a `sheetsBar: false` teardown, and the empty
  map is the recursion stop), so the next enable never reads the departing sheet's settings as
  the grid's own.
- **Formulas cooperation is by engine instance + `sheetName`.** Every bound sheet is registered
  in the engine up front and re-fed on every registration (a rebuilt workbook reusing names
  must not leave stale engine content); a tab rename renames the engine sheet and writes the
  engine's rewritten formula strings back into every bound sheet's data (HyperFormula rewrites
  references only inside itself — the raw arrays would resurrect the old name on the next
  switch, with the active sheet's rewrites going through `setDataAtCell()` so `afterChange`
  fires and the grid repaints — wrapped in `#withoutUndoEntry`, because the engine rename is
  not undoable and an undone rewrite would resolve to `#REF!`; only cells the grid addresses
  faithfully take that path — the Formulas plugin keys the engine physically while
  `setDataAtCell` writes through `colToProp`, so a trimmed cell or a non-identity
  `columns[].data` binding gets a direct source write plus one render. Formulas plus a `data`
  remap is mangled by the Formulas plugin itself at load, before any of this runs); a removed sheet is removed
  from the engine; a duplicate binds to an engine sheet of its own; a runtime-added sheet with
  no `settings` inherits the shared engine under its own name — and carries no data, so the
  engine reports that sheet as `0x0` while the grid counts its default rows and columns. Its
  axis order is therefore not mirrored into the engine until the sheet holds data; the
  mechanism, and why the stored baseline records identity rather than the grid's order, is in
  `../formulas/AGENTS.md` ("The engine's sheet size is not the grid's axis length"). A brand-new binding (add,
  duplicate) goes through `freeEngineName()` — a `sheetName` may differ from its tab name, so
  a free tab label can still identify another sheet's engine data, and reusing it would
  overwrite that data. A rename whose new name already identifies another engine sheet is
  rejected up front (`#renameCollidesInEngine`), the way a tab-name collision is — committing
  the tab first would leave it showing a name its formulas do not resolve against. The binding
  follows the name `engine.addSheet()` reports back — the engine can normalize a name the
  model told apart. `sheetModel.duplicateSheet` keeps
  `settings.formulas` out of the deep clone — a cloned engine instance is a broken object and
  the clone recurses forever.
- **Cell meta is tracked per cell and property and served lazily, never replayed eagerly.**
  `#trackedCellMeta` holds one bucket per physical cell (last write per key wins);
  `#onAfterGetCellMeta` serves the bucket the moment a cell's meta is actually read, so a
  switch pays nothing per entry and no meta object is materialized for cells nobody asks
  about — the eager replay cost one `setCellMeta` and one stored meta object per entry
  (130k on a validated 5,000-row sheet: +42% switch time, +126 MB over ten switches). The
  serve hook runs on the hottest read path: keep the `size === 0` bail-out first and only
  write differing values. `valid` is not tracked at all (`UNTRACKED_META_KEYS`) — the next
  validation recomputes it, and it is what made the map balloon. Neither are MergeCells' `hidden`
  and `spanned`: the switch restores merges itself, and MergeCells removes those keys from a
  trimmed row without `afterRemoveCellMeta`, so a tracked copy came back after an unmerge (DEV-3135). Entries are stored with
  physical indexes (`afterSetCellMeta` hands over visual ones) and translated at serve time,
  so a reorder between the write and the read cannot land the meta on the wrong cell.
  `afterRemoveCellMeta` drops the tracked key, or the overlay would keep serving a value the
  host removed. Physical keys are not stable across `alter()`: an insert or remove renumbers
  every physical index after it, and core's `MetaManager` shifts its own cell meta to match.
  The `afterCreateRow`/`afterRemoveRow`/`afterCreateCol`/`afterRemoveCol` handlers re-key the
  map the same way (drop the removed indexes, shift the rest; an `auto` insert shifts nothing,
  because `DataMap` does not shift core meta for it either), and a host `loadData` clears
  it, because `loadData` clears core's cell meta. Any new code path that renumbers physical
  indexes must re-key it too, or the serve hook paints a cell's meta onto its neighbor. The
  `auto` skip also covers the rows a switch creates for `minRows` or `minSpareRows` while the
  arriving sheet's map sits over the outgoing sheet's data, so the re-key needs no
  `#isSwitching` guard, and must not take one: a host `alter()` from
  `afterSheetTabStateRestore` runs inside the switch and has to re-key. The four listeners
  register at `orderIndex` -1, so the map is shifted before a host listener on the same hook
  reads meta, the way core shifts `MetaManager` before it fires. The map follows whatever indexes the hooks
  report, so the NestedRows tree operations, which fire `afterCreateRow`/`afterRemoveRow` with
  computed indexes (and fire nothing on a tree row move), can still drift from core meta.
- **A live-grid build resets the view state.** `#buildInitialWorkbook` calls `resetViewState`
  after applying the opening sheet whenever the grid's view exists — `loadData` does not clear
  filters, hidden or trimmed indexes, merges, borders, or manual sizes, and an `updatePlugin`
  rebuild would otherwise capture the previous workbook's collections as the opening sheet's
  own state on the first switch away.
- **The bar owns the grid-level `dataProvider` gate, not the plugin conflict registry.** A `registerConflict('dataProvider', [...])` entry (the mechanism `pagination`, `trimRows` and the rest use) would block *every* sheet's `dataProvider`, including a sheet that declares its own — this needs a per-sheet answer, so the bar decides it directly. The pieces, each pinned by a spec in `tests/e2e/data-provider-sheets-bar.spec.ts`:
  - `#captureGridDataProvider()` records a **truthy** grid-level value in the settings baseline when a workbook starts (a non-preserved enable) and warns once (`GRID_LEVEL_DATA_PROVIDER_WARNING`) — also when every sheet declares its own, and also for `sheetsBar: true` without `sheets`, whose single wrapped sheet gets `null` through `#withBaselineFor(undefined)` like any other sheet. A falsy value is not recorded: a workbook where nobody declares a `dataProvider` must never write the key to the grid (no `dataProvider: null` in a switch payload, no extra `updateSettings({ dataProvider: null })` on a `sheetsBar: false` teardown, `getSettings().dataProvider` stays `undefined`; pinned by unit tests).
  - `#withBaselineFor()` forces `dataProvider: null` on a sheet without a **truthy** own `dataProvider` (a sheet declaring `dataProvider: null` is local, not "has its own"), but only while there is one to take off the grid: a baseline entry, or a truthy value on the grid (the previous sheet's own, which a rebuild does not record in the new baseline). A genuine teardown gives the grid-level value back through `#restoreBaselineToGrid()`. **The baseline never reads `dataProvider` from the grid**: the generic loop in `#withBaselineFor()` stores `undefined` for that key. A truthy grid-level value is already in the baseline by then (`#captureGridDataProvider()` runs before the workbook is built), so whatever the grid holds at loop time is a sheet's own — after a rebuild, the departing server sheet's. Read from the grid, that value became the "grid-level" one: `sheetsBar: false` gave it back, so the plain grid kept fetching from the sheet's server, and a second rebuild warned about a grid-level `dataProvider` nobody had set. Skipping the key instead of storing `undefined` brings the same bug back, since the teardown then writes no `dataProvider: null`.
  - `#onAfterUpdateSettings` blocks a value set later through `updateSettings({ dataProvider })` unless the active sheet declares a truthy own `dataProvider` (the user re-configuring the visible server sheet). It is registered with **`orderIndex` -1**, ahead of every plugin's `onUpdateSettings`: at the default order DataProvider enabled first, started a `fetchRows` call for the blocked value, and raised the loading overlay that the abort never cleared.
  - `#onBeforeUpdateData` keeps the visible sheet's rows. Core writes the new setting and, while `hasExternalDataSource` answers `true`, replaces the grid's data with a fresh `[]` placeholder (`updateData([], 'updateSettings')`) before any `afterUpdateSettings` listener runs; the sheet record still pointed at the local rows, but the grid held `[]`, and the next switch away stored `[]` as the sheet's data. The redirect answers the placeholder with the array the grid already shows (`updateData` on the same array keeps the index maps, so the sort and filters survive). It only matters while DataProvider's `hasExternalDataSource` listener is registered — the constructor one survives until DataProvider's first disable (`clearHooks()`), so the trap is a workbook that opened on a local sheet.
  - `#isRestoringBaseline` makes the gate stand aside while the teardown restores the grid-level value, and `disablePlugin()` drops the model before that restore, so the restored `dataProvider` fetches as a plain grid. On a `sheets` **rebuild** the grid-level value is not written back at all: `updatePlugin()` carries it in `#rebuildGridDataProvider`, `#restoreBaselineToGrid()` skips it, and the new workbook's capture reads it from there (written back, it enabled DataProvider and fetched for the moment between the two workbooks).
  - `#keepActiveSheetDataProvider()` keeps a `dataProvider` the user sets through `updateSettings()` on the visible server sheet as that sheet's own, so a switch away and back applies it again instead of the declared one. It replaces the record's `settings` object (it may be the host's declared one) instead of writing into it. The block itself (`#recordBlockedGridDataProvider()` plus `updateSettings({ dataProvider: null })`) runs on EVERY call that carries a truthy grid-level `dataProvider`, including a wrapper re-sending the same settings on each render: core applies the payload before any listener runs and has no hook to strip a key first, and the value has to be written back through `updateSettings()` because core stores it on the global meta layer a direct write would only shadow. That misconfiguration is warned about once; the fix is on the host's side. On a **server** sheet the same re-send would otherwise read as the user re-configuring that sheet: `#isResentGridDataProvider()` recognizes the recorded grid-level object by identity, and `#restoreActiveSheetDataProvider()` writes the sheet's own `dataProvider` back through a nested `updateSettings()` inside `_runWithoutFetching()` (no abort, no refetch). DataProvider's `updatePlugin()` then skips the outer call, whose payload no longer matches the grid's value, and `#onBeforeUpdateData` keeps the visible rows for both calls (core empties them on any payload that names `dataProvider`). Only a stable object is caught: an inline literal the host rebuilds on every render is a new value each time, and reads as a re-configure.
  A sheet's own declared `dataProvider` runs the switch's `updateSettings({ dataProvider })` call like any other overridden key; DataProvider applies it without a refetch because the whole `#switchTo` runs inside `dataProvider._runContextChange()` (`#withoutFetching`), which is passive.
- **The bar is the DataProvider context owner; everything sheet-shaped about server data lives here.** The contract is internal (`../dataProvider/AGENTS.md`, "Owner contract: contexts (internal)"): `#contextOwner` is registered with `_setContextOwner()` at the top of `enablePlugin()` and removed at the end of `disablePlugin()`, and all calls go through the `_`-prefixed DataProvider methods. Never replace it with hooks — a user listener could rewrite what the bar receives. The pieces:
  - **Context.** `getContext()` answers a **frozen empty token** per sheet (`#contextOf()`, `#contextTokens` + the reverse `#sheetsByContext`, both `WeakMap`s), never the `Sheet` record, so no outside code can reach a sheet's data or settings through DataProvider. Identity is per record, so a removed sheet or a sheet of a replaced workbook (whose ids restart at 1) can never be mistaken for a current one. It is registered before the workbook is built: a rebuild on a live grid applies the opening server sheet, and starts its first fetch, inside `enablePlugin()`. Without a model it answers `null`, so the settings a teardown restores fetch as a plain grid.
  - **Server view per sheet** (`#serverViews`, a `WeakMap<Sheet, …>`): the last response, a pending fetch failure, and deferred mutation failures. A visible landing arrives through the owner's `onShownResponse`, which DataProvider calls with the normalized response before `afterDataProviderFetch` fires — never read it from that hook: `Hooks.run` hands a listener's non-`undefined` return to the next listener, so a user listener could rewrite the stored `totalRows` or `queryParameters` and the replay would show a wrong pager, sort, or filters (pinned by the `?userFetchListener=1` spec). Everything that settles for a sheet the grid does not show arrives through `onDetachedRequest` (`#keepDetachedOutcome()`), and an outcome reported for the sheet the grid shows (DataProvider reports one only while it is disabled there) is dropped rather than written over the visible sheet's record: a response's rows **replace** `sheet.data` — and the sheet's kept cell meta (`viewState.cellMeta`) is dropped with the old rows, the way `#onAfterLoadData` drops the tracked meta when the grid shown reloads, or a `readOnly` from the old rows came back on the new ones — never written into it: a host-declared `sheets[i].data` may be frozen (an Immer store threw, and the throw was reported as a fetch failure) or reactive (a Vue array ran an extra `updateSettings`); a failure is stored by the `kind` DataProvider reports (`fetch` → the sheet's fetch failure, shown with Refetch and no automatic refetch; `create`/`update`/`remove` → appended mutation failures). An outcome for a sheet of no current workbook is dropped. The owner also answers `getContextQuery(context)` with the sheet's last response's `queryParameters`, so an off-screen save's refetch asks for the page the user left the sheet on, not the one the save was queued on. The frozen case and the fetch-vs-mutation filing are pinned in `tests/e2e/data-provider-sheets-bar.spec.ts`, including a user `afterDataProviderFetchError`/`afterRowsMutationError` listener that returns values.
  - **Switch.** `#switchTo` runs inside `#withoutFetching`, i.e. `dataProvider._runContextChange()`: DataProvider stays passive (its state in a `try/finally`), resets the pager's server total before the switch, and syncs the loading overlay and the server-filter rollback after it — Pagination, EmptyDataState, and Filters are released plugins and must not listen to this plugin's hooks, so this plugin never relies on them doing so, and `#isSwitching` is `try/finally` too, so a listener that throws mid-switch leaves nothing stuck (pinned by a unit test). **The passive window covers `#switchTo` only**, and `afterSheetTabStateRestore` fires inside it: a sort or filter applied from that listener on a server sheet is canceled (`#answerPassiveSort` / `#answerPassiveFilter`), not sent to the server. A sort or filter made from an `afterSheetTabStateCapture` or `afterSheetTabChange` listener is an ordinary user action on the sheet shown at that moment and goes to the server. `#showServerSheet()` runs after the switch, before `afterSheetTabChange` fires, so the EmptyDataState and Filters listeners of that hook see the final state: deferred mutation toasts (`_showRequestError`), then `isFetching()` → wait, a stored fetch failure → `_restoreFetchResult(lastResult)` when there is one plus the fetch toast (no refetch), a stored response → `_restoreFetchResult()`, else the first fetch (`fetchData({ page: 1 })`, failure logged like DataProvider's own internal refetches). `isFetching()` ignores a silent (`skipLoading`) refetch, so arriving while a save's refetch of the sheet still runs replays the stored response first and the refetch lands after it (`afterDataProviderFetch` fires twice, the first with `isRestored: true`); pinned by a spec. The replay keeps the sort indicator, filters, and pager total correct while the refetch runs.
  - **Remove / duplicate / workbook replaced.** A removed sheet's context is released (`_releaseContext`). A genuine teardown releases every sheet of the discarded workbook (captured before the model is dropped) plus `null`; a non-preserved enable releases `null`, which aborts a plain grid's fetch still running when the bar is enabled on a live grid. A plain grid's save still pending then is dropped by DataProvider (no refetch, no revert into the new sheet, no toast; pinned by a spec). A preserved `updatePlugin` round trip releases nothing. A duplicate gets the original's last response (`#copyServerView`), not its pending failures or its running fetch.
- **A declared workbook wins the initial data load.** `#onBeforeLoadData` redirects the init
  load at the active sheet's array (warning once about a clashing top-level `data`): the grid's
  init pass loads `data` after the plugin already applied its sheet, and without the redirect
  the first switch-away would capture the host array over the sheet's declared rows —
  destroying them. The redirect is a `beforeLoadData` filter at the default `orderIndex`, and
  another plugin that validates the incoming array in the same hook must register behind it —
  `nestedRows` does so with `orderIndex: 1`, because at its `PLUGIN_PRIORITY` (300) it otherwise
  judged the host's placeholder array and self-disabled before this redirect ran (DEV-2939).
  Keep this listener at the default order, or that ordering silently inverts. The warning is
  skipped (redirect still applies) when `hasExternalDataSource` is `true` for the active sheet —
  that load is core's own placeholder `[]` from a `dataProvider`-backed sheet, not a real
  top-level `data` clash, and without the check every workbook whose first sheet declares a
  `dataProvider` would warn on every load.
- **Known and accepted:** a truthy grid-level `dataProvider` triggers the gate warning even when it is not a complete configuration (the gate does not validate it); and a genuine teardown drops the model before it restores the grid-level settings, so listeners of the restore's `updateSettings()` already see a grid without sheets (`getSheets()` is empty).
- **`removeSheet` prunes the declared entry out of the configured `sheets` arrays**
  (`#pruneDeclaredSheet`, entries mapped per sheet id in `#declaredEntries`), mirroring how
  `Core` keeps `settings.data` in sync on `loadData` — the settings object would otherwise
  keep a removed sheet's rows resident for the grid's life. This splices the host's own `sheets` array in place
  (pre-existing behavior, kept): a host that reuses that array after `removeSheet()` sees it one
  entry shorter.
- **Never wrap host-reachable code in `Core#batch`/`batchRender`** — neither resumes in a
  `finally`, and a listener throwing mid-switch would leave the grid render-suspended for
  life. The plugin's `#batchRender` and `viewState.ts`'s `safeBatch` are the guarded forms
  (same reasoning as MergeCells).
- **`ariaTags: false` keeps every ARIA state attribute off the bar.** The paging arrows' real
  disabled state is the `ht-sheets-bar__button--disabled` class (`DISABLED_CLASS` in
  `overflow.ts`); `aria-disabled` and the anchors' `aria-expanded` are mirrors written only
  while ARIA is on, and `isArrowEnabled()`/`getFocusableElements()` read the class.
- **A `button: 0` `contextmenu` is not necessarily the keyboard.** A touch long-press and a
  macOS Ctrl+click report it too; the strip tells them apart by `buttons === 0` plus no
  pointer being down on the tab (`#pointerHeldOnTab`). Focus restores in `menus.ts` go through
  `getDeepActiveElement()` — the raw `activeElement` collapses to the host in a shadow root.
- **The menus' upward flip needs a negative `above` offset.** The positioner aligns a flipped
  menu's bottom to the cursor point — the anchor's *bottom* edge — so `#openMenu` sets
  `setOffset('above', -(anchorHeight + 4))` per opening; a flat offset covered the chevron.
  Below, the positioner adds one pixel of its own, so `setOffset('below', 3)` is the 4px gap.
- **The bar draws its own top border in the bottom slot.** `.ht-slot-bottom` zeroes the first
  element's top border assuming the grid's edge sits flush above, which fails when the table
  overflows or ends in a scrollbar; `_sheets-bar.scss` reinstates it (same specificity, later
  in the sheet — keep that ordering).
- **The bar does not size the grid; core does — in every layout.** No `beforeHeightChange` hook here.
  With an explicit pixel `height` core subtracts the bar from the height it writes on the root
  (`reserveEdgeSlotsHeight` in `core/rootSize.ts`), so `{ height: 400, sheetsBar }` is a 400px box, bar included, exactly
  like pagination. Inside a scrollable ancestor the engine leaves the bar's height out of the table
  (`layoutReservedHeight`); with window scroll or `height: 'auto'` the grid box follows its content
  so the bar sits after the last row. A layout where the bar covers a row, is clipped, or overshoots
  the declared height is a core/layout bug, not a plugin one (`tests/e2e/bottom-slot-sizing.spec.ts`,
  DEV-2848).
- **A `dblclick` on the chevron is two menu clicks, never a rename (DEV-3086).** The tab's
  `dblclick` handler skips the chevron on every tab, not only the active one: on another tab
  the first click switches sheets and repaints, so the pair's `dblclick` lands on a chevron that
  is active by then. Without the guard the rename input opened on top of the menu the second
  click had just opened. The reverse order needs no guard — opening the menu moves the focus,
  the input blurs, and the blur commits the rename first.
- **The bar is registered as grid UI, so a press on it never deselects.** The bar sits outside
  `rootElement` (a layout slot or `uiContainer`), and with the default `outsideClickDeselects`
  the document `mousedown` in `tableView.ts` used to deselect before a tab's `click` switched
  sheets — every switch from the bar then stored an empty selection. `enablePlugin` registers the
  bar container through `FocusGridManager#registerOutsideClickExemptElement()` and
  `#releaseState` removes it; a press inside it only closes an open editor (saving it, as
  `outsideClickDeselects: false` does), so the outgoing sheet keeps its selection. Do not replace
  this with a selection snapshot taken on `pointerdown`: that covers the tab click only, leaks
  when the release lands off the tab, and still drops the selection on the active tab, the add
  button, and the all-sheets button. Pagination is deliberately not registered —
  `layout-slot-focus.spec.ts` pins its deselect. Three things ride along. (1) With the selection
  alive and the focus in the bar, the editor manager would open the cell editor on any printable
  key — a letter typed into the rename input started editing the selected cell and the rename
  was lost — so `#onKeyDownWithinBar` marks keys and composition starts inside the bar at
  `orderIndex` -1. It sets only the `isImmediatePropagationEnabled` mark, never `cancelBubble`:
  the grid's key listener sits on the `documentElement`, and stopping the bubble there hides every
  bar keystroke from the host page. (2) `setActiveSheet` closes an open editor before it captures
  the outgoing sheet, so an API switch mid-edit saves into the sheet being left. (3) A switch onto
  a sheet with no stored selection deselects at the start of the switch batch, before
  `loadData`: `loadData` only clamps the selection, so the previous sheet's cells used to carry
  over, and deselecting after the load would let a still-open editor save into the arriving
  sheet. A stored selection that no longer fits (the host shrank the sheet's data while it was
  away, so `restoreViewport()` reports `false`) is deselected inside the viewport batch for the
  same reason. The grid focus scope drops its remembered Tab re-entry cell on `afterLoadData` on
  every grid, not only on a switch: a cell remembered from the previous data does not name a
  record of the new data.
- **`render()` cancels an in-flight rename silently.** The cancel-hook handler repaints the
  strip, and dispatching it from inside `render()` re-enters the render pass — the outer pass
  then restores focus and scroll against tabs the inner pass replaced.
- **A listener can cancel the restore's `filter()` and `sort()`, and the restore must survive it.**
  `beforeFilter` and `beforeColumnSort` are cancelable, and DataProvider cancels both on purpose
  (server-side mode), so the restore never forces them through. A canceled `filter()` puts back the
  conditions of the previous pass, which ran on the departing sheet. `restoreFilterConditions`
  imports the plain way, so `beforeFilter` still gets the departing sheet's conditions as the
  previous stack. A canceled pass is recognized by `afterFilter` not firing (`runFilterPass()`), not
  by comparing conditions, which also fired when an `afterFilter` listener edited them and then
  undid the edit. After a canceled pass it re-imports the sheet's own through the Filters plugin's
  `@private` `importBaselineConditions()`, which also makes them the fallback for later canceled
  passes. The skipped branch (nothing to apply, nothing to clear) sets
  an empty baseline too. `loadData` empties the condition collection but not the fallback, so
  without that, a canceled pass or the first undo on an unfiltered sheet brought back the departing
  sheet's filter. A canceled filter leaves the rows unfiltered while the menu shows the sheet's own
  conditions: that is the listener's decision, not the restore's. A canceled `sort()` returns
  before the sort states are written, while `restoreSequence()` still writes the sorted rows, so
  `restoreCanceledSortStates()` writes them back through `setSortConfig()`, and only once
  `restoreSequence()` reports the captured row order written: a sheet whose data changed size keeps
  the `loadData` order, and an indicator over it would claim a sort it does not have. It writes nothing when
  the states are no longer empty (the listener set its own config) or while the plugin has no
  `indexesSequenceCache`. The sort only builds that cache from empty states, so states written
  without it made the next `sort()` throw. The cache is missing after the plugin was disabled and
  enabled again, which a sheet declaring `columnSorting: false` does on every switch.
- **The switch runs under `#withoutUndoEntry`, and so does the live-grid reset in
  `#buildInitialWorkbook` (DEV-3037).** `loadData()` clears the UndoRedo stacks, but the view-state
  restore runs after it and goes through the public `sort()` and `filter()`, whose UndoRedo
  actions register on `beforeColumnSort`/`beforeFilter`. Without the
  guard they land on the fresh stack, and the first Ctrl+Z after a switch took back the arriving
  sheet's own sort. `restoreFilterConditions` also skips `filter()` when neither the stored state
  nor the grid has a condition — the neutral state's `filterConditions: []` is truthy, so every
  switch used to run a filter pass.
- **Merges are cleared before `loadData()` and restored on the automatic path.**
  MergeCells does not react to `loadData()`, so the departing sheet's merges outlive its data,
  and `clearCollections()` resets the cell meta of every cell they cover. Cleared after a
  shorter sheet was loaded, it addressed rows that no longer existed and the switch threw
  `Expecting an unsigned number`. For a sheet with a stored state the collection is therefore
  emptied twice around the load. `#switchTo` calls `clearMergedCells()` before `#applySheet`,
  while the departing merges still match the grid (the neutral reset does it otherwise). And
  `#applySheet` calls `forgetMergedCells()` right after its `loadData()`: `mergeCells` rides on
  every switch's `updateSettings()` payload once any sheet declares it (the baseline carries it
  too), and `MergeCells#updatePlugin` regenerates the declared merges, which would outlive the
  load and win over the ones the user unmerged or moved. That second pass empties the
  collection only, never the meta: the load has already reset the cell meta, and the same
  update can apply the arriving sheet's `trimRows` to the departing grid first, so those merges
  may sit at visual rows the loaded data lacks, and a meta reset there throws. The forget
  leaves MergeCells' own record of applied declared areas alone, so its next settings update
  treats them as applied and nulls only the covered cells that still hold a value. Capture
  keeps only merges the lookup matrix holds (`get(row, col) === merge`): a merge whose rows
  are all trimmed stays in the collection's list at its last visual position, and restored
  there it came back as a visible merge over unrelated rows, or won over a live merge,
  depending on list order. Such a merge is therefore gone after a round trip, even once its
  rows are untrimmed. The restore then drops a stored merge that no longer fits (the data is
  the host's and can shrink while the sheet is away), and one that would overlap a merge
  already on screen, which only a host listener adding merges during the load can produce,
  since the automatic path skips the overlap check.
  The rest go through `mergeRange(range, true, true)`, the path MergeCells uses for merges
  declared in its settings: no out-of-bounds warning, `beforeMergeCells`/`afterMergeCells` report
  `auto: true` (UndoRedo records nothing for that), and no cell is written, where the public
  `merge()` rewrote every covered cell with `null`.
- Switching calls `loadData()`, which clears the UndoRedo stacks; the state-restore hook and
  the announced switch fire after the batch, and switch announcements are made for the bar's
  own gestures only (`SOURCE_UI`).
- **A switch runs `loadData()` exactly once, and AutoColumnSize sweeps every column on it
  (DEV-2905, DEV-3040).** `#applySheet` first applies the sheet's settings (declared, or inherited
  formula settings for a runtime-added sheet) through `updateSettings()`; when that changes the
  Formulas plugin's `sheetName`, `Formulas#updatePlugin` would run `switchSheet()`, a `loadData()` of
  the engine's serialized content (`source: 'Formulas.switchSheet'`), right before the bar's own
  `loadData()` overwrote it. `#withoutFormulasSwitchLoad` sets the Formulas plugin's `@private`
  `skipSheetSwitchLoad` flag around that `updateSettings()` (duck-typed through `getPlugin`, like
  `#withoutUndoEntry` does for UndoRedo), so Formulas only binds the sheet and the bar's load — whose
  Formulas `afterLoadData` writes the array into that sheet — is the one load. Between the two calls
  the grid still holds the departing sheet's data while bound to the arriving sheet. The switch is
  render-suspended and the binding clears the owed resync, so Formulas writes nothing into the engine;
  a read in that window (another plugin's `updatePlugin`, a host `afterUpdateSettings` listener)
  answers from the arriving engine sheet at the departing grid's coordinates, until the load replaces
  the data. **Core does write in that window**: `updateSettings()` ends in `adjustRowsAndCols()`,
  which pads the array the grid holds — the departing sheet's own `data`, by reference — up to the
  arriving sheet's `minRows`/`minSpareRows`/`minCols`/`minSpareCols` — and a grid-level one does the
  same whenever the update changes what the padding reads (a baseline restoring `columns: null`
  opens the `minCols` branch; an arriving `trimRows` lowers `countRows()`). So `#applySheet` runs
  that update under `#withoutAutoPadding`, and `#onBeforeAutoCreate` (registered on
  `beforeCreateRow`/`beforeCreateCol` at the top of `enablePlugin`, so the init build is covered
  too) vetoes every create with source `auto` while it is set. The `loadData()` that follows pads
  the arriving sheet's data inside its own `adjustRowsAndCols()`, before `afterLoadData`, exactly as
  a plain load does, so host listeners, the AutoColumnSize sweep and the Formulas engine write all
  see the padded size. Do not replace the veto with a zero-then-reapply of the `min*` keys: that
  missed grid-level keys, ran a second `updateSettings()` (a second Formulas `setSheetContent` and
  engine undo entry per switch, and a second host `afterUpdateSettings`), and moved the padding
  after `afterLoadData`. The listener returns `undefined` rather than `true` when it does not veto,
  so it never overrides another listener's `false`. Before this, only a formula switch onto a
  non-empty engine sheet was safe (`switchSheet()` loaded a throwaway copy first); a workbook without
  Formulas and a switch onto an empty engine sheet padded the departing sheet. Pinned in
  `sheetsBar.unit.js`: "loads the grid once per switch", the four "does not pad a … sheet's data …"
  tests, "pads the arriving sheet before its afterLoadData, with one settings update per switch",
  and "leaves the Formulas switch load and min padding working after a switch threw mid-update". The
  `loadData()` nulls the width map, so the AutoColumnSize `afterLoadData` sweep re-measures every column over the whole row range, and the
  resume render walks the visible columns once more (the sweep drops its samples cache on purpose —
  its own `AGENTS.md`). A further full pass used to come from listener order: the sweep ran before
  the Formulas `afterLoadData` fed the new data to the engine, and the engine's `valuesUpdated` batch
  queued every cell for a synchronous rescan; the Formulas plugin now registers its listener at
  `orderIndex` -1, and `tests/e2e/sheet-switch-autosize.spec.ts` pins the count. What remains is
  O(rows × cols) per `loadData()` by design — the `syncLimit` contract is "first paint exact" — so a
  switch cannot be made proportional to the viewport without an opt-in that drops that guarantee. The
  Formulas `afterCellMetaReset` bookkeeping for the *outgoing* sheet that the `updateSettings()`
  triggers is the remaining per-switch cost outside this plugin.

Tests: `__tests__/*.unit.js` (Jest), `tests/e2e/sheets-bar*.spec.ts` (Playwright),
`visual-tests/tests/js-only/sheetsBar/`. The unit suite drives the strip through DOM events and
a captured `TabStrip` instance — the plugin exposes no test-only methods.
