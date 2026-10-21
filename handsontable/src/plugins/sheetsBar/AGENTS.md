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
- The view-state capture and restore live in `src/utils/viewState/viewState.ts`, shared with the
  public `ViewState` plugin. The bar calls `captureViewState()`, `restoreViewState()`,
  `restoreViewport()`, `resetViewState()`, `resetViewport()` and `keepSelectionOnPage()` with no part
  filter, so every step runs. The load-bearing order and the per-part traps are in
  `src/utils/viewState/AGENTS.md`. Only the tracked cell meta (`cellMeta`, served lazily, see below), the
  merges and the custom borders are SheetsBar's alone: the public API never restores them.
- `ui/` — `bar.ts` (DOM via `buildTemplate`, labels re-applied by `refreshLabels()` on language
  change), `tabStrip.ts` (tabs, inline rename, focus capture/restore across repaints),
  `tabDrag.ts` (pointer drag + FLIP), `menus.ts` (two `Menu` instances built once and refilled
  per opening — the shared `Menu` never removes the `afterSetTheme` hook its constructor adds),
  `overflow.ts` (paging arrows, `aria-disabled` so a spent arrow keeps the focus, and the
  `ht-sheets-bar__tabs--scrolled` divider class once the strip leaves its start).

## Traps

- **The tab strip hides its scrollbar with `scrollbar-width: none !important`** (DEV-3191). Keep
  the `!important`. The selector compiles to `.handsontable.ht-sheets-bar .ht-sheets-bar__tabs`
  (specificity 0,3,0: the bar root carries both classes), so a page-wide rule such as
  `* { scrollbar-width: thin }` loses on specificity whatever the load order. Two kinds of host rule
  beat a plain declaration and paint a bar into the strip: one that carries `!important`
  (`* { scrollbar-width: thin !important }`), and one that ties the selector and loads later
  (`.handsontable.ht-sheets-bar .ht-sheets-bar__tabs { scrollbar-width: thin }`). The `!important`
  covers both. A host `.handsontable .wtHolder` rule never matches the strip, which is not a holder.
  The rule still loses to a host `!important` rule of higher specificity and to one inside a CSS
  `@layer` (important declarations reverse layer order), so do not claim the strip is immune to host
  CSS. Chrome 121+ ignores `::-webkit-scrollbar` once `scrollbar-width` is not `auto`, so that rule
  only backs up older engines.
- **The keyboard lives in a shortcut context** (`plugin:sheetsBar`) behind a focus scope, like
  Pagination. The scope's `runOnlyIf` stands aside while one of the bar's menus is open — the
  click that opens a menu reaches the scope manager after the menu has taken the keyboard, and
  re-activating the scope would hand it back to the grid. The activation shortcut sets
  `stopPropagation`, or the menu it opens would run its first item on the same keystroke; the
  rename input stops its own Enter/Escape for the same reason, and ignores them mid-IME
  composition (`isComposing`/keyCode 229).
- **Drag decisions use transform-neutral geometry.** `#reorder` subtracts each tab's in-flight
  FLIP translation before comparing centres; measuring the animated rects makes a 2px pointer
  wobble swap two tabs back and forth for as long as the slide runs. **A reorder moves the
  neighbors, never the dragged tab** (`#moveAround`). Re-inserting the captured tab drops its
  pointer capture, and taking it back from the `lostpointercapture` handler crashes the desktop
  WebKit content process, so do not reintroduce `insertBefore(tab, …)` mid-drag and do not
  re-capture from that handler. A capture loss on the tab therefore means the pointer is gone, and
  the gesture is canceled. The handler ignores a loss bubbled up from a child: a touch press
  captures the pointer on the label under the finger, and the drag's own `setPointerCapture`
  takes it from there. Pinned by `tests/e2e/sheets-bar-tab-drag.spec.ts` (tagged
  `@cross-browser`, so the WebKit leg runs it) and the reorder cases in `__tests__/tabDrag.unit.js`.
  Moving a neighbor blurs a focused element inside it, so a press that starts a drag first ends an
  open rename by focusing the pressed tab (the `pointerdown` handler in `tabStrip.ts`). A mouse
  press moves the focus on its own; a touch press does not, and the rename input's blur-driven
  commit used to repaint the strip in the middle of `#moveAround`, which then threw
  `NotFoundError`. Pinned by the rename case in `tests/e2e/sheets-bar-touch-drag.spec.ts`.
- **Every tab is its own stacking context (`isolation: isolate`).** The chevron glyph carries
  `z-index: 1` to stay above its `::before` hover surface. Without the isolation that z-index
  competes in the strip at the dragged tab's level (`--dragging` is `z-index: 1` too), so a tab
  later in the DOM painted its chevron over the dragged tab passing above it. Do not raise the
  dragged tab's z-index instead: any new positioned child of a tab would bring the bug back. A
  hit test cannot see it during a drag, because every tab is `pointer-events: none` then; the
  spec turns pointer events back on for one `elementFromPoint` read.
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
  - `#keepActiveSheetDataProvider()` keeps a `dataProvider` the user sets through `updateSettings()` on the visible server sheet as that sheet's own, so a switch away and back applies it again instead of the declared one. It replaces the record's `settings` object (it may be the host's declared one) instead of writing into it. The block itself (`#recordBlockedGridDataProvider()` plus `updateSettings({ dataProvider: null })`) runs on EVERY call that carries a truthy grid-level `dataProvider`, including a wrapper re-sending the same settings on each render: core applies the payload before any listener runs and has no hook to strip a key first, and the value has to be written back through `updateSettings()` because core stores it on the global meta layer a direct write would only shadow. That misconfiguration is warned about once; the fix is on the host's side. On a **server** sheet the same re-send would otherwise read as the user re-configuring that sheet: `#isResentGridDataProvider()` recognizes the recorded grid-level object by identity, and `#restoreActiveSheetDataProvider()` writes the sheet's own `dataProvider` back through a nested `updateSettings()` inside `_runWithoutFetching()` (no abort, no refetch). DataProvider's `updatePlugin()` then skips the outer call, whose payload no longer matches the grid's value, and `#onBeforeUpdateData` keeps the visible rows for both calls (core empties them on any payload that names `dataProvider`). Only a stable object is caught: an inline literal the host rebuilds on every render is a new value each time, and reads as a re-configure. That limit is part of the public docs (the `dataProvider` option's JSDoc in `metaSchema.ts` and the sheets bar guide tell a host to keep a grid-level object stable); keep them in step if the gate changes.
  A sheet's own declared `dataProvider` runs the switch's `updateSettings({ dataProvider })` call like any other overridden key; DataProvider applies it without a refetch because the whole `#switchTo` runs inside `dataProvider._runContextChange()` (`#withoutFetching`), which is passive.
- **The bar is the DataProvider context owner; everything sheet-shaped about server data lives here.** The contract is internal (`../dataProvider/AGENTS.md`, "Owner contract: contexts (internal)"): `#contextOwner` is registered with `_setContextOwner()` at the top of `enablePlugin()` and removed at the end of `disablePlugin()`, and all calls go through the `_`-prefixed DataProvider methods. Never replace it with hooks — a user listener could rewrite what the bar receives. The pieces:
  - **Context.** `getContext()` answers a **frozen empty token** per sheet (`#contextOf()`, `#contextTokens` + the reverse `#sheetsByContext`, both `WeakMap`s), never the `Sheet` record, so no outside code can reach a sheet's data or settings through DataProvider. Identity is per record, so a removed sheet or a sheet of a replaced workbook (whose ids restart at 1) can never be mistaken for a current one. It is registered before the workbook is built: a rebuild on a live grid applies the opening server sheet, and starts its first fetch, inside `enablePlugin()`. Without a model it answers `null`, so the settings a teardown restores fetch as a plain grid.
  - **Server view per sheet** (`#serverViews`, a `WeakMap<Sheet, …>`): the last response, a pending fetch failure, and deferred mutation failures. A visible landing arrives through the owner's `onShownResponse`, which DataProvider calls with the normalized response before `afterDataProviderFetch` fires — never read it from that hook: `Hooks.run` hands a listener's non-`undefined` return to the next listener, so a user listener could rewrite the stored `totalRows` or `queryParameters` and the replay would show a wrong pager, sort, or filters (pinned by the `?userFetchListener=1` spec). Everything that settles for a sheet the grid does not show arrives through `onDetachedRequest` (`#keepDetachedOutcome()`), and an outcome reported for the sheet the grid shows (DataProvider reports one only while it is disabled there) is dropped rather than written over the visible sheet's record: a response's rows **replace** `sheet.data` — and the sheet's kept cell meta (`viewState.cellMeta`) is dropped with the old rows, the way `#onAfterLoadData` drops the tracked meta when the grid shown reloads, or a `readOnly` from the old rows came back on the new ones — never written into it: a host-declared `sheets[i].data` may be frozen (an Immer store threw, and the throw was reported as a fetch failure) or reactive (a Vue array ran an extra `updateSettings`); a failure is stored by the `kind` DataProvider reports (`fetch` → the sheet's fetch failure, shown with Refetch and no automatic refetch; `create`/`update`/`remove` → appended mutation failures). An outcome for a sheet of no current workbook is dropped. The owner also answers `getContextResult(context)` with the sheet's last response, so an off-screen save's refetch asks for the page the user left the sheet on, not the one the save was queued on, and a remove's follow-up counts that page's rows. The frozen case and the fetch-vs-mutation filing are pinned in `tests/e2e/data-provider-sheets-bar.spec.ts`, including a user `afterDataProviderFetchError`/`afterRowsMutationError` listener that returns values.
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
  life. The plugin's `#batchRender` and core `viewState.ts`'s `safeBatch` are the guarded forms
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
  bar keystroke from the host page. (2) `setActiveSheet` closes an open editor before it runs
  `beforeSheetTabChange` (`#finishEditing`), so an API switch mid-edit saves into the sheet being
  left; see "A switch never carries work onto the arriving sheet" below. (3) Every switch
  deselects at the start of the switch batch, before `loadData`, whether or not the arriving
  sheet has a stored selection: `loadData` only clamps the selection, so the previous sheet's
  cells used to carry over, and deselecting after the load would let a still-open editor save
  into the arriving sheet. Do not skip it when a stored selection is about to be restored:
  `loadData()` ends in `selection.refresh()`, which replays the departing selection against the
  arriving sheet, and a cell that falls inside the arriving sheet's frozen columns was then looked
  up in the inline-start overlay before that overlay had drawn the new sheet. The switch threw
  `TD or TH was expected to be rendered but is not` and the stored selection was never restored
  (pinned by `tests/e2e/sheets-bar-frozen-columns.spec.ts`). The cost is one `afterDeselect`
  on every switch, followed by the selection hooks when a stored selection
  comes back. The sheets bar guide documents it for host listeners, and the spec pins the order.
  When a stored selection no longer
  fits (the host shrank the sheet's data while it was away, so `restoreViewport()` reports
  `false`), the viewport batch deselects again. Nothing from the previous sheet reaches it any
  more; the call clears only a selection a plugin or a listener made during the switch, and stays
  as a guard. The grid focus scope drops its remembered Tab re-entry cell on `afterLoadData` on
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
  `Expecting an unsigned number`. `#switchTo` therefore calls `clearMergedCells()` before
  `#applySheet`, while the departing merges still match the grid (the neutral reset does it
  otherwise, and does it FIRST, before it untrims and unhides rows: `clearCollections()` takes the
  span attributes off the cells `getCell()` finds at the merges' visual coordinates, which name
  other rows once the trimmed and hidden rows are back while the DOM still shows the old layout.
  Cleared last, the merged `td` kept its `rowspan` and shifted the rows below it on the arriving
  sheet, which no render repaired once MergeCells was disabled there; pinned by
  `tests/e2e/sheets-bar-data-bound-settings.spec.ts`). **The merges a sheet declares in its
  `settings` are built after the load, never during the settings update.** `mergeCells` rides on every
  switch's settings payload once any sheet declares it, and phase A of `_applySettingsAndData()` runs
  while the grid still holds the departing sheet's data. Built there, `generateFromSettings()`
  validated the arriving areas against the departing size and wrote its clearing `null`s into the
  departing sheet's array. MergeCells' `updatePlugin()` therefore reads `isDataWorkDeferred()` and only
  rebuilds the plugin, keeping its record of applied areas. After the call,
  `#runMergeCellsSettingsPass` calls `runDeferredSettingsPass(apply)`: a first visit builds the
  declared merges against the arriving data; a sheet with a stored state passes `false` and builds
  none, because it restores its own merges and the declared ones would win over the ones the user
  unmerged or moved. This one pass stays the bar's call (not MergeCells' `onDataReady()`) because only
  the bar knows whether the sheet returns with a stored state. Skipping the build also writes no cell,
  so a value the user typed into a formerly merged cell survives a round trip. Without a view (the
  init build) the bar runs nothing, and MergeCells' own `afterInit` builds the merges against the
  loaded sheet and clears the pending pass. The pass must run before the view-state restore: it sets MergeCells'
  `#initialized`, and the restored merges' anchors are captured only once that is set. Capture
  keeps only merges the lookup matrix holds (`get(row, col) === merge`): a merge whose rows
  are all trimmed stays in the collection's list at its last visual position, and restored
  there it came back as a visible merge over unrelated rows, or won over a live merge,
  depending on list order. Such a merge is therefore gone after a round trip, even once its
  rows are untrimmed. The restore then drops a stored merge that no longer fits (the data is
  the host's and can shrink while the sheet is away), and one that would overlap a merge
  already on screen, which only a host listener adding merges during the load can produce,
  since the automatic path skips the overlap check.
  The rest go through `mergeRange(range, true, true)` inside `restoreMergedAreas()`, the path
  MergeCells uses for merges declared in its settings: no out-of-bounds warning,
  `beforeMergeCells`/`afterMergeCells` report `auto: true` (UndoRedo records nothing for that),
  and no cell is written, where the public `merge()` rewrote every covered cell with `null`.
  **Every MergeCells member the switch uses is one MergeCells owns** — `getVisibleMergedAreas()`
  (capture), `clearCollections()` (clear), `restoreMergedAreas()` (restore) and
  `runDeferredSettingsPass()` — read through the typed
  `hot.getPlugin('mergeCells')`, never a structural cast, so a rename or re-signature there fails
  the type check. Under a cast, a rename in MergeCells still compiles here and the first switch
  throws `… is not a function`. Do not reach into `mergedCellsCollection` or call `mergeRange()`
  from here again.
- **A switch applies the arriving sheet's settings and data through core's `_applySettingsAndData()`
  (`#applySheet`), the order the grid's own initialization uses.** A plain `updateSettings()` followed by
  `loadData()` let every plugin reconfigure against the departing sheet's data, and that was the cause of
  a whole family of bugs: ColumnSummary wrote its totals into the departing array, a lowered `minSpareRows`
  removed the rows typed into the departing sheet, CustomBorders dropped borders outside the departing
  size, the sorting plugins sorted the departing rows, NestedRows rejected the departing flat array, and
  the `cell` option was wiped by the load. Core now runs three phases: (A) the settings are merged and
  every plugin enables, disables or updates while `isDataWorkDeferred()` answers `true`, and core skips
  the data phase, the `cell` option, `afterCellMetaReset`, the `min*` padding and surplus removal, and
  the render; (B) the arriving data loads with the new configuration in force, sized to its own `min*`
  values; (C) the `cell` option and `afterCellMetaReset` run, then every enabled plugin's `onDataReady()`
  in priority order, then one render. The rules of that contract are in `../base/AGENTS.md`; the plugins
  that defer work today are ColumnSummary, ColumnSorting (and MultiColumnSorting), CustomBorders,
  MergeCells, NestedRows, Formulas, Pagination, EmptyDataState and DataProvider. Pinned by
  `src/__tests__/core/applySettingsAndData.unit.js`, `__tests__/sheetSwitchSettingsOrder.unit.js`,
  `tests/e2e/sheets-bar-switch-settings-order.spec.ts` and `tests/e2e/sheets-bar-data-bound-settings.spec.ts`.
  Three things ride along.
  - **The `cell` option is restated on every switch** (`#effectiveCellOption`), because the load clears
    every cell meta object: the sheet's own entries, the grid-level ones when the sheet declares none
    (and the grid has entries), or `[]` when the baseline holds no grid-level value, which drops the
    departing sheet's entries from core's record of them.
  - **NestedRows has to be ON during the load**, so it enables in phase A: an enable with an empty data
    manager then takes its tree from the load (its own `beforeLoadData`) instead of validating the
    departing flat array, which logged "requires an Array of Objects" and turned the plugin off for good.
  - **A new plugin whose `enablePlugin()` or `updatePlugin()` reads or writes the loaded rows must defer
    that work** through `isDataWorkDeferred()` and `onDataReady()`. Do not add a per-plugin flag set by
    the bar again, and do not split the payload into a before-load and an after-load part: both were
    the workarounds this contract replaced.
  - **A return applies the ColumnSummary endpoints the sheet left with, not the declared ones.** A
    row or column alteration moves an endpoint, while the declared settings keep naming its old
    position, so re-applying them on a return wrote the summary over the data cell the alteration
    had moved into that place. `#captureColumnSummary` stores `ColumnSummary#exportEndpointSettings()`
    (`@private`, read through the typed `getPlugin`) per sheet when the user leaves it, and
    `#applySheet` applies it after the load when the sheet returns with a stored state
    (`restoresState`, the flag that also skips the declared merges): it replaces the declared value in
    the payload. A function-form setting stores nothing: it reads its settings again on every pass.
    A duplicate gets the original's current endpoints written into its own settings
    (`#copyColumnSummaryEndpoints`), because its copied data already has the summaries at their moved
    positions; and a server response that replaces a sheet's rows drops the stored endpoints
    (`#keepDetachedOutcome`), so the declared positions apply to the fresh rows.
  - **The init build applies the opening sheet from `beforeInit`, and core's own init settings pass
    then undoes two parts of it.** It registers the grid-level callback of every hook again (a
    settings hook is one replaceable `initialHook` entry per name, `core/hooks/bucket.ts`), so the
    opening sheet's own hook never ran; and its init `loadData()` cleared the cell meta the sheet's
    `cell` option wrote. `#takeInitPassSettings` keeps those keys, and `#onInit` (the `init` hook,
    after that pass and before the first render) applies them again. It first writes the grid-level
    callback into the settings baseline: the baseline was captured in `beforeInit`, before core puts
    the settings' callbacks on the table meta, so it held `undefined` and a switch to another sheet
    kept the opening sheet's callback. A sheet's hook REPLACES the grid-level one on that sheet, like
    every other key, for a function: core keeps one settings callback per hook name. A grid-level ARRAY
    of callbacks is added through `Hooks#add` instead and keeps running beside a sheet's callback on every
    sheet. The re-apply runs with `#isSwitching` set, so the opening sheet's declared `cell` entries are not
    tracked as cell meta the user set, the same as on a switch. Known gap: a hook only sheets declare, with no grid-level callback, is restored
    as `null`, which removes nothing, so it keeps running on the sheets that do not declare it. The
    opening sheet's hooks also miss the init load's own events (`afterLoadData` of the first load).
- **Custom borders are restored with the logical sides only.** `getBorders()` records carry both
  `start`/`end` and their legacy `left`/`right` copies (`denormalizeBorder()`), and `setBorders()`
  throws when it gets both pairs, and on `left`/`right` alone in RTL. `restoreCustomBorders()`
  therefore passes `top`, `bottom`, `start` and `end` only. Passing every side made the switch back
  to any bordered sheet throw, which dropped its borders and its stored selection. Pinned by the
  `custom borders` block in `__tests__/viewState.unit.js`.
- Switching calls `loadData()`, which clears the UndoRedo stacks; the state-restore hook and
  the announced switch fire after the batch, and switch announcements are made for the bar's
  own gestures only (`SOURCE_UI`).
- **A switch runs `loadData()` exactly once, and AutoColumnSize sweeps every column on it
  (DEV-2905, DEV-3040).** When the arriving settings change the Formulas plugin's `sheetName`,
  `Formulas#updatePlugin` would run `switchSheet()`, a `loadData()` of the engine's serialized content,
  right before the switch's own load overwrote it. In phase A it reads `isDataWorkDeferred()` and only
  binds the sheet, and the load's Formulas `afterLoadData` writes the array into that sheet, so the
  switch's load is the one load. A name the engine does not know still goes through `switchSheet()`,
  which reports it. Phase A also writes nothing into the departing sheet's array: core skips the `min*`
  padding and surplus removal there, and the load pads the arriving sheet's data inside its own
  `adjustRowsAndCols()`, before `afterLoadData`, exactly as a plain load does. Pinned in
  `sheetsBar.unit.js`: "loads the grid once per switch", the four "does not pad a … sheet's data …"
  tests, "pads the arriving sheet before its afterLoadData, with one settings update per switch", and
  "leaves the Formulas switch load and min padding working after a switch threw mid-update". The
  `loadData()` nulls the width map, so the AutoColumnSize `afterLoadData` sweep re-measures every column over the whole row range, and the
  resume render walks the visible columns once more (the sweep drops its samples cache on purpose —
  its own `AGENTS.md`). A further full pass used to come from listener order: the sweep ran before
  the Formulas `afterLoadData` fed the new data to the engine, and the engine's `valuesUpdated` batch
  queued every cell for a synchronous rescan; the Formulas plugin now registers its listener at
  `orderIndex` -1, and `tests/e2e/sheet-switch-autosize.spec.ts` pins the count. What remains is
  O(rows × cols) per `loadData()` by design — the `syncLimit` contract is "first paint exact" — so a
  switch cannot be made proportional to the viewport without an opt-in that drops that guarantee. The
  Formulas `afterCellMetaReset` bookkeeping now runs once, in phase C, against the arriving sheet.
- **The bar's icons (paging arrows, add/all-sheets buttons, tab chevrons) are kept through an
  injected `syncIcon()`** — `bar.ts` and `tabStrip.ts` receive `syncIcon` (bound to the
  grid in `sheetsBar.ts`), not `createIcon`, and each owns one slot class
  (`ht-sheets-bar__button-icon`, `ht-sheets-bar__tab-chevron-icon`). `#onAfterSetTheme` calls
  `this.#ui?.refreshIcons()` and `this.#tabStrip?.refreshIcons()`, which update the icons **in
  place** and only when the theme's icons revision moved. **Never answer `afterSetTheme` with
  `#refreshUI()`**: `TabStrip#render()` aborts a tab drag and cancels an open rename, and the hook
  also fires for a color-scheme or density switch (a ThemeBuilder `params()` or `setColorScheme()`
  included), so the user loses the sheet name they were typing (pinned by "a
  color-scheme switch keeps an open tab rename" in `tests/e2e/icon-elements.spec.ts`). The active-sheet check mark in `menus.ts` is different:
  it is built fresh every time a menu row is rendered (`#renderSheetName`, per `open()`), so it
  always reflects the current theme with no `refreshIcons()` involvement.
- **Only the sheet name follows its own script direction, never the menu row.** `#renderSheetName`
  writes the name into a `<span class="ht-sheets-bar__menu-item-name" dir="auto">` inside the
  `.htItemWrapper`; the wrapper itself keeps the menu's direction. With `dir="auto"` on the wrapper a
  Hebrew name in an LTR grid turned the whole wrapper RTL, so the check mark (positioned with
  `inset-inline-end`) and the wrapper's reserved end padding moved to the left, under the text. The
  span is an `inline-block` with its own ellipsis (`_dropdown-menu.scss`), so a long name still
  truncates at its own logical end. Pinned by `tests/e2e/icon-elements-misc.spec.ts`.
- **The bar's motion (`ui/tabStrip.ts`, `ui/motionGate.ts`, `ui/switchTiming.ts`) is the tab
  strip's only: a switch slides the tab marker and nothing else. The grid switches at once.** The
  rules below look optional and are not.
  - Nothing moves while the grid loads. `#switchTransition()` answers `0` until the motion gate
    (`ui/motionGate.ts`) opens, so a tab entrance, a tab slide, or a marker slide made before then
    is exactly the instant path, with no DOM read. The first `afterRender` after a genuine enable
    (init, `sheetsBar` turned on later, a workbook rebuild) arms it with a
    `rootWindow.requestAnimationFrame` that requests a second one, and the gate opens in that second
    frame, after the first has been painted. Opening in the first frame is too early: its callbacks
    run before its paint, and a host's own `requestAnimationFrame()` scheduled right after the
    constructor runs after the gate's, so a saved sheet restored there slid the marker on the first
    painted frame. A host that calls `setActiveSheet()` or `addSheet()` in the constructor's task, or
    in a frame it requested then, therefore animates nothing. `close()` cancels whichever of the two
    frames is pending.
    `#releaseState()` shuts the gate and cancels the frame on a genuine teardown only: a
    workbook-preserving round trip (every wrapper re-render) must keep it open, or the wrappers
    would never animate. Pinned by `tests/e2e/sheets-bar-switch-animation-load.spec.ts` and
    `__tests__/motionGate.unit.js`.
  - The `animation` option only turns motion off, and it does so through the instant path, never
    a path of its own. `ui/animationSettings.ts` validates it (`isValidAnimationSetting()`, the
    `SETTINGS_VALIDATORS` entry, so an invalid value warns and the previous one stays) and resolves
    it to `{ switch, add, remove, move }` (`resolveAnimationSetting()`, an omitted key is on).
    `#switchTransition(motion)` answers `0` for a motion whose key is off, exactly as it does
    before the gate opens, so the marker, the entrance (`add`, which covers duplicate), the leaving
    copy and the gap slide (`remove`), and `slideTabs()` (`move`) all take the existing
    zero-duration branch. The tabs a drag pushes aside belong to `move` too, and they are pure CSS
    (`TabDrag#slideIntoPlace()` only resets the inline transform), so the plugin calls
    `TabStrip.setDragSlide()` after building the strip: with `move` off the strip carries
    `--ht-private-tab-slide-duration: 0ms` at rest, and `#takeSlide()` puts that resting value back
    instead of removing the property. Without a resting value the tabs fall back to
    `var(--ht-table-transition)`, so the `0s` token of classic makes the drag displacement instant
    too. Reduced motion and a `0s` token still win, because the key is checked
    first and the gate and token after it. A preserved `updatePlugin()` filters the handed-over
    motion through `keepAnimatedMotion()` before `resumeMotion()`, so a slide whose key was just
    turned off is not resumed and the rebuilt strip shows its end. The tab slide is shared by
    `remove` and `move`, so `#playTabMotion()` records which one started it (`#tabSlideMotion`).
    The hover text-color fade is deliberately not a key: it is CSS only (the tab's `transition`
    over `--ht-table-transition`, dropped by reduced motion), and `animation: false` leaves it
    running. The guide tells a host to remove it with `transition-property: transform` on
    `.handsontable.ht-sheets-bar .ht-sheets-bar__tabs .ht-sheets-bar__tab` (0,4,0), never
    `transition: none`, which also drops the `transform` slides the option keeps on. The extra
    `__tabs` class is load-bearing: the core stylesheet is injected at the end of `<head>` when the
    first grid is built, after the host's own stylesheet, so a host rule at the bar's own (0,3,0)
    loses the tie and the fade keeps running. Only the property list changes, so the dragged tab
    and reduced motion keep their `0s` durations from `transition: none`. Pinned by `__tests__/animationSettings.unit.js` and
    `tests/e2e/sheets-bar-animation-option.spec.ts`.
  - The marker's start box is read inside the commit callback, before `#switchTo()`, and the slide
    starts only after `#commit()` returns, which is after `afterSheetTabChange`. A listener there
    may switch again: that later switch slides the marker itself, so the outer one starts nothing
    once `#switchCount` moved on or the plugin is off (`#ownsMarkerSlide()`).
  - Cleanup is timer-based (the marker, tab entrances, tab slides, and the leaving copy), never
    `animationend`/`transitionend`. The visual-test runner disables CSS animations and reduced
    motion turns them off, so those events never fire there. The timers run on
    `rootWindow.setTimeout()`, not `hot._registerTimeout()`, a deliberate exception to the core
    rule: `hot.timeouts` keeps every registered handle until the grid is destroyed, even one that
    was cleared, so it grew by one entry per animated switch. The strip owns every handle and
    clears it in the `finish*()` methods, `releaseMotion()` (a preserved round trip), and
    `TabStrip.destroy()`, which `#releaseState()` runs on a genuine teardown and on the grid's
    destroy, so no callback outlives the strip. Pinned by `__tests__/motionTimers.unit.js`.
  - Never move the tab marker by transforming a tab element: the drag FLIP owns each tab's inline
    `transform`. The marker is a separate `aria-hidden` element, and `TabStrip.render()` clears the
    host, so while a slide runs it puts the element back and restarts the slide from the marker's
    on-screen box to the active tab's new box, over the time left (inline `transition-duration`).
    Removing the active tab switches before the model drops it, so the slide's first target is
    stale until that repaint. A newly created tab does animate its own
    `transform` (the `ht-sheets-bar-tab-enter` keyframes). Every render rebuilds it, so
    `#applyEntrance()` re-applies the class with a negative `animation-delay` to resume at the
    elapsed point. A drag start finishes entrances and the marker, and `TabDrag` measures the grab
    offset from the tab's resting edge, without its in-flight translation.
  - A sheet moved from the tab menu or the API slides the tabs (`TabStrip.slideTabs()`): the plugin
    records each tab's `offsetLeft` before the model moves (`captureTabPositions()`, plus the
    in-flight translation only while a slide already runs), and after the repaint each tab starts
    at its old place through an inline `translateX` and transitions to its new one. The duration
    is `tabSlideDurationMs()` (the marker's `2.25 × T`), written on the strip as
    `--ht-private-tab-slide-duration`, which the tabs' one `transform` transition reads (a drag
    reads the resting value, or `var(--ht-table-transition)` when there is none). The moved active tab carries its own marker (background and
    underline are its own styles), so no indicator element runs. A drag commit skips the slide
    (the drag already placed the tab); a drag start, a rename, and `destroy()` finish it; a
    repaint and a preserved rebuild continue it from the on-screen positions over the time left.
  - A removed sheet's tab leaves through a copy (`captureLeavingTab()` before the model drops it,
    `slideTabOut()` after the repaint): a `div.ht-sheets-bar__tab-ghost` at the tab's old layout box,
    `inert`, `aria-hidden`, `pointer-events: none`, holding clones of the label and chevron. It must
    never carry the `ht-sheets-bar__tab` class or `--active`: every tab query (`#tabs()`, the drag,
    `#activeTabBox()`, the focusable list in `bar.ts`, the fixtures' test-id stamping) would count it.
    It fades out toward the inline start over `T` (`ht-sheets-bar-tab-leave`, the entrance offset
    reversed) and is removed by a timeout, while the tabs after it close the gap through
    the move slide. `render()` clears the strip, so it re-inserts each copy first in the strip, under
    the tabs and the marker, with a negative `animation-delay`; a drag start, a rename, and
    `destroy()` remove it, and a preserved rebuild hands it over in `releaseMotion()`.
  - A workbook-preserving `updatePlugin()` keeps the motion running. The tab strip is rebuilt on
    that round trip, so `#releaseState()` takes its motion first (`TabStrip.releaseMotion()`, while
    the old strip is still laid out) and `enablePlugin()` hands it to the new strip after the first
    render (`resumeMotion()`).
  - The tab's one `transition` list carries `transform` (drag and move slides) and `color` over
    `T`; reduced motion drops both. A hovered tab changes its text color only
    (`--ht-sheets-bar-tab-hover-foreground-color`) and keeps its resting background: no tab paints
    the hover background token. A dragged tab keeps its resting surface too, and it must stay
    opaque, because the passing tabs travel behind it. Never put `background-color` in the tab's
    transition list: the marker slide switches the tabs it uncovers from transparent back to their
    surface the moment it ends, and a fade there flashes the bar color through an opaque custom tab
    color.
  - The tab marker slides under the tabs. Only the tabs it passes over (between its start and end
    boxes, marked `ht-sheets-bar__tab--indicator-path`) and the active tab drop their background
    while it moves, so a theme whose inactive tab background differs from the strip keeps it on
    every other tab. The strip's `::before` repaints the inactive tab surface under the marker
    across the marked span (`--ht-private-tab-indicator-path-x`/`-width`), so an opaque custom tab color
    does not flash to the bar color.
  - `#revealActiveTab()` measures `offsetLeft`/`offsetWidth` against `scrollLeft`/`clientWidth`,
    never `getBoundingClientRect()`: a new tab is still translated by its entrance when the strip
    reveals it, and the rect under-scrolls it.
  - Every internal custom property the bar writes or reads is `--ht-private-…`, never plain
    `--ht-…`, which is the public theme token namespace. The timing factors live in
    `switchTiming.ts` only: the marker's duration is its inline `transition-duration`, and a
    factor of one stays `var(--ht-table-transition)` in CSS.
  - The token is parsed from `getComputedStyle()` (`resolveTransition()`), never
    `stylesHandler.getCSSVariableValue()`, which runs numeric values through `Math.ceil` and turns
    `0.15s` into `1`.

- **A switch never carries work onto the arriving sheet.** A switch ends in `loadData()`, and
  anything still running then used to finish on whatever data the grid held. The rules, pinned by
  `__tests__/inFlightSwitch.unit.js`, `tests/e2e/sheets-bar-in-flight-work.spec.ts` and
  `tests/e2e/sheets-bar-in-flight-drags.spec.ts`:
  - **`#finishEditing` runs before `beforeSheetTabChange`.** It saves the cell editor and a focused
    comment editor (Comments' `@private` `_saveAndCloseEditor()`: an editor the API focused is not
    blurred by an API switch; an unfocused one holds nothing new and is closed unsaved), then refuses the switch while core's `@private`
    `_hasPendingValidation()` answers `true` or the editor is still open (a value rejected under
    `allowInvalid: false`). Core applies a validated change to the data loaded when the last
    validator answers, so a switch in that window wrote the edit into the arriving sheet. A
    refused click shows nothing: the editor stays open over its own cell. Do not "defer" the switch
    until the validator answers instead – that was rejected for this bar. Core counts each
    validator call made for a change (`validateCell` from `validateChanges`, never `validateCells()`)
    until it answers or throws, so a validator that throws does not
    block switching for the grid's life; one that never answers does. Every validator answers in a
    microtask, so an API `setActiveSheet()` made while the editor of a cell with a validator is open
    is refused even for a valid value. A tab click is not: a `pointerdown` anywhere in the bar saves
    the cell editor (`#onBarPointerDown`), so the validator has answered by the `click`. The grid's
    own outside press saves it on a mouse press too, but it skips the mouse events a touch screen
    synthesizes, and without the bar's listener the first tap was refused. `#isEditingSettled` is
    asked again right before `#switchTo`, because a `beforeSheetTabChange` or
    `afterSheetTabStateCapture` listener can start a validated change of its own. `oldId` is read
    after `#finishEditing`, because a listener of the save (`afterChange`) can switch first. A call
    refused for coming from a before-hook listener returns before `#finishEditing`, so it closes no
    editor. A `loadData()` restarts core's count, so a validator that never answers blocks switching
    only until other data loads. The workbook rebuild (`updateSettings` with a new `sheets` value)
    replaces the data without asking: a known gap.
    Every UI entry point that switches checks the same rule first: the add button adds nothing,
    and the tab menu of a sheet the switch did not reach does not open (`#openMenuFor` in
    `ui/tabStrip.ts` checks the tab became active), or its Rename and Delete would act on a sheet
    the user cannot see.
  - **`#loadedSheetId` is the sheet whose rows the grid holds**, set from `afterLoadData` (orderIndex
    -1, so a later throwing listener cannot hide the load) while `#applySheet` loads. The model
    points at the arriving sheet before its data loads, so when a switch throws before the load,
    `#switchTo` points the model back at that sheet and shows it again from the view state captured
    a moment before, then rethrows. By then the neutral reset had cleared its filters, hidden rows,
    merges and sizes, and the arriving settings were applied over its rows; only pointing the model
    back left it in that state, and the next switch away stored it as its own. Without the rollback
    the next switch stored the departing rows as the arriving sheet's data, and two tabs shared one
    array. `#syncActiveSheetData` writes into the loaded sheet for the same reason. A throw after
    the load keeps the arriving sheet. When the rollback throws too, the switch's own error is the one
    rethrown.
  - **A listener told about a change before it takes effect cannot change the workbook**
    (`#runBeforeChangeHook`, read by `#commit`): a change's before-hook,
    `afterSheetTabStateCapture`, and `afterSheetTabStateRestore`, which fires inside `#switchTo` (and
    again in its rollback). A restore listener that removed the departing sheet left
    `afterSheetTabChange` reporting a sheet that no longer existed. A nested switch or remove from them used to overwrite the departing
    sheet's view state or throw. The flag does not cover `mutate()`: `#removeSheet` switches to the
    neighbor from inside its own commit, and an `afterSheetTabChange` listener may still switch
    again; `#removeSheet` then checks that the sheet it removes is no longer the active one.
  - **A listener that destroys the grid, turns the bar off, or rebuilds the workbook stops the
    change** (`#isLive`, checked after the before-hook and after `afterSheetTabStateCapture`).
  - **The `activeSheet` setting is recorded once its switch reaches the listeners**
    (`#applyActiveSheetSetting`). A switch a `beforeSheetTabChange` listener cancels stays recorded:
    otherwise every wrapper re-render sent the value again, saved the cell the user was typing in, and
    ran the listener (an unsaved-changes confirm) again. A switch `#finishEditing` refuses is not
    recorded and warns, so the same value sent again retries it. Vue sends a key only when it differs
    from the grid's settings, so a Vue app has to send another value first.
  - **A dialog that was open before the switch takes the arriving sheet's selection** (Dialog's
    `@private` `_adoptViewSelection()`). The dialog stashes the selection it hides when it opens,
    and on hide it put the departing sheet's coordinates on the arriving sheet. A dialog opened
    during the switch already stashed the arriving selection, so it is left alone. This mirrors
    EmptyDataState's `isViewChange`.
  - **Gestures and async work are each plugin's own.** MoveCells, ManualRowMove,
    ManualColumnResize and ManualRowResize (`ResizeGesture#abort()`), Autofill and FreezeBar cancel a held drag on
    `beforeLoadData` (never on `updateData()`, which the React wrapper sends on every re-render); AutoColumnSize cancels its idle-task sweep; ImportFile
    rejects an import whose read spans a `loadData()`; ExportFile rejects a `downloadFileAsync()`
    whose overlay wait spans one; DataProvider refetches a server sheet whose create finished while
    it was hidden, even with `refetchAfterCreate: false`. The bar does not know about any of them,
    and a new plugin with a gesture or async work that targets the loaded data needs the same.
    DragToScroll stops auto-scrolling a move-cells or autofill drag on `beforeLoadData`, and
    `ResizeGesture#abort()` also ends the double-click window, or the pending auto-size ran on the
    arriving sheet. ManualColumnMove still commits a held drag into replaced data (open).

Tests: `__tests__/*.unit.js` (Jest), `tests/e2e/sheets-bar*.spec.ts` (Playwright),
`visual-tests/tests/js-only/sheetsBar/`. The unit suite drives the strip through DOM events and
a captured `TabStrip` instance — the plugin exposes no test-only methods.

## The four frozen counts follow the same rules

The per-sheet view state captures and restores `fixedColumnsStart`, `fixedColumnsEnd`, `fixedRowsTop` and
`fixedRowsBottom`. `#getNeutralFrozenCounts()` is the value a sheet with no captured state opens with (read once, when
the workbook starts), `resetViewState(hot, neutral)` takes all four, and `#restoreBaselineToGrid()` puts a runtime
freeze back on teardown. A freeze set at runtime on one sheet therefore does not follow the user onto a sheet they
never visited. The rows were not tracked at first, so a frozen row carried over to every sheet.

**Every switch takes the departing sheet's freeze shadows off the grid before the arriving settings land**
(`#switchTo`, on both the first-visit and the return path). The departing count is already in its captured
state. Left in force, it blocked a Pagination enable on the arriving sheet (Pagination conflicts with
`fixedRowsTop`), and the neutral reset's own shadow outlived the arriving update whenever the arriving count
equalled the departing one, so a sheet declaring the same freeze as the previous sheet opened unfrozen and
stored that as its state. `#getSwitchNeutralFrozenCounts()` therefore leaves a count some sheet declares
(it is in the settings baseline, so the update applies it) at its current value, and the neutral reset
writes no shadow for it.

**A count can be a shadow on the table meta, and `updateSettings()` leaves a shadow alone.** The freeze bar,
`ManualColumnFreeze`, `alter()` and undo write a frozen count as an own property of `getSettings()`, and
`updateSettings()` drops it only when the new value differs from the previous GRID-level one. A sheet's count must win,
so every write of a count goes through `setFrozenCount()` / `clearFrozenCountShadow()` in `src/utils/viewState/viewState.ts`, which
removes the shadow (and `_fixedColumnsStart`, the backing field of the start freeze) first, and then writes the count
as a shadow of its own when it differs from the grid-level value. It does not call `updateSettings()`: that would make
the sheet's count the grid-level one, and a wrapper re-sends the app's own value on each render, which differs from it
and reverts the sheet to the app's count (pinned by "keeps a count restored on its sheet when the app sends its own value
again"). A new path that writes
one of the four options must do the same, or the count a sheet left behind stays in force. Pinned in
`__tests__/sheetsBar.unit.js`, "a freeze written on the table meta".

The new `fixedRowsTop` and `fixedRowsBottom` fields of `SheetsBarViewState` are optional: the type is public, and a
required field would break code that builds one.
