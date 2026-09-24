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
  batch, once the arriving sheet is painted at its own sizes. A stored order whose length no
  longer matches the data is skipped. Manual sizes are stored as sparse
  `[physicalIndex, size]` pairs read and written through the resize plugins'
  `getManualSizes()`/`setManualSizes()` (physical, so a trimmed row keeps its height) and
  cleared through their bulk `clearManualSizes()`.
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
  validation recomputes it, and it is what made the map balloon. Entries are stored with
  physical indexes (`afterSetCellMeta` hands over visual ones) and translated at serve time,
  so a reorder between the write and the read cannot land the meta on the wrong cell.
  `afterRemoveCellMeta` drops the tracked key, or the overlay would keep serving a value the
  host removed.
- **A live-grid build resets the view state.** `#buildInitialWorkbook` calls `resetViewState`
  after applying the opening sheet whenever the grid's view exists — `loadData` does not clear
  filters, hidden or trimmed indexes, merges, borders, or manual sizes, and an `updatePlugin`
  rebuild would otherwise capture the previous workbook's collections as the opening sheet's
  own state on the first switch away.
- **The bar owns the grid-level `dataProvider` gate, not the plugin conflict registry.** A `registerConflict('dataProvider', [...])` entry (the mechanism `pagination`, `trimRows` and the rest use) would block *every* sheet's `dataProvider`, including a sheet that declares its own — this needs a per-sheet answer, so the bar decides it directly. The pieces, each pinned by a spec in `tests/e2e/data-provider-sheets-bar.spec.ts`:
  - `#captureGridDataProvider()` records the grid-level value in the settings baseline when a workbook starts (a non-preserved enable) and warns once (`GRID_LEVEL_DATA_PROVIDER_WARNING`) whenever it is truthy — also when every sheet declares its own, and also for `sheetsBar: true` without `sheets`, whose single wrapped sheet gets `null` through `#withBaselineFor(undefined)` like any other sheet.
  - `#withBaselineFor()` forces `dataProvider: null` on a sheet without a **truthy** own `dataProvider` (a sheet declaring `dataProvider: null` is local, not "has its own"), and a genuine teardown gives the grid-level value back through `#restoreBaselineToGrid()`.
  - `#onAfterUpdateSettings` blocks a value set later through `updateSettings({ dataProvider })` unless the active sheet declares a truthy own `dataProvider` (the user re-configuring the visible server sheet, rule 13). It is registered with **`orderIndex` -1**, ahead of every plugin's `onUpdateSettings`: at the default order DataProvider enabled first, started a `fetchRows` call for the blocked value, and raised the loading overlay that the abort never cleared.
  - `#onBeforeUpdateData` keeps the visible sheet's rows. Core writes the new setting and, while `hasExternalDataSource` answers `true`, replaces the grid's data with a fresh `[]` placeholder (`updateData([], 'updateSettings')`) before any `afterUpdateSettings` listener runs; the sheet record still pointed at the local rows, but the grid held `[]`, and the next switch away stored `[]` as the sheet's data. The redirect answers the placeholder with the array the grid already shows (`updateData` on the same array keeps the index maps, so the sort and filters survive). It only matters while DataProvider's `hasExternalDataSource` listener is registered — the constructor one survives until DataProvider's first disable (`clearHooks()`), so the trap is a workbook that opened on a local sheet.
  - `#isRestoringBaseline` makes the gate stand aside while the teardown restores the grid-level value, and `disablePlugin()` drops the model before that restore, so the restored `dataProvider` fetches as a plain grid. On a `sheets` **rebuild** the grid-level value is not written back at all: `updatePlugin()` carries it in `#rebuildGridDataProvider`, `#restoreBaselineToGrid()` skips it, and the new workbook's capture reads it from there (written back, it enabled DataProvider and fetched for the moment between the two workbooks).
  A sheet's own declared `dataProvider` runs the switch's `updateSettings({ dataProvider })` call like any other overridden key; DataProvider applies it without a refetch (`updatePlugin()` stands aside while `#isSheetSwitching` is true — see `../dataProvider/AGENTS.md`, "SheetsBar: per-sheet server state").
- **`afterSheetWorkbookReset` tells listeners that every sheet id is void.** The bar fires it at the start of a non-preserved enable (initial build, rebuild, late enable) and at a genuine teardown (`disablePlugin()` with no preserved state, once — the model is dropped first, so the teardown's own re-entry does not fire it again). A preserved `updatePlugin` round trip fires nothing. DataProvider is the in-tree listener: `SheetModel` numbers each workbook's sheets from 1, so without it a rebuilt workbook's sheet inherited the server state of the old sheet with the same id.
- **`afterSheetTabDuplicate` exists for DataProvider.** It fires after `afterSheetTabAdd` so a duplicate's id is already registered, and DataProvider is the only in-tree listener: `#onAfterSheetTabDuplicate` gives the new sheet a snapshot of the source sheet's server state, so the duplicate's first visit replays the response it inherited instead of fetching.
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
  `dataProvider` would warn on every load (DEV-3041).
- **`removeSheet` prunes the declared entry out of the configured `sheets` arrays**
  (`#pruneDeclaredSheet`, entries mapped per sheet id in `#declaredEntries`), mirroring how
  `Core` keeps `settings.data` in sync on `loadData` — the settings object would otherwise
  keep a removed sheet's rows resident for the grid's life.
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
- **`render()` cancels an in-flight rename silently.** The cancel-hook handler repaints the
  strip, and dispatching it from inside `render()` re-enters the render pass — the outer pass
  then restores focus and scroll against tabs the inner pass replaced.
- **The switch runs under `#withoutUndoEntry`, and so does the live-grid reset in
  `#buildInitialWorkbook` (DEV-3037).** `loadData()` clears the UndoRedo stacks, but the view-state
  restore runs after it and goes through the public `sort()`, `filter()` and `merge()`, whose
  UndoRedo actions register on `beforeColumnSort`/`beforeFilter`/`beforeMergeCells`. Without the
  guard they land on the fresh stack, and the first Ctrl+Z after a switch took back the arriving
  sheet's own sort. `restoreFilterConditions` also skips `filter()` when neither the stored state
  nor the grid has a condition — the neutral state's `filterConditions: []` is truthy, so every
  switch used to run a filter pass.
- Switching calls `loadData()`, which clears the UndoRedo stacks; the state-restore hook and
  the announced switch fire after the batch, and switch announcements are made for the bar's
  own gestures only (`SOURCE_UI`).
- **A switch runs `loadData()` once or twice, and AutoColumnSize sweeps every column on each
  (DEV-2905).** `#applySheet` first applies the sheet's settings (declared, or inherited formula
  settings for a runtime-added sheet) through `updateSettings()`; when that changes the Formulas
  plugin's `sheetName` and the engine sheet holds content, `Formulas#switchSheet` runs a `loadData()`
  of the engine's serialized content (`source: 'Formulas.switchSheet'`) before the bar's own
  `loadData()` — a blank engine sheet skips it. Each `loadData()` nulls the width map, so the
  AutoColumnSize `afterLoadData` sweep re-measures every column over the whole row range, and the
  resume render walks the visible columns once more (the sweep drops its samples cache on purpose —
  its own `AGENTS.md`). A further full pass used to come from listener order: the sweep ran before
  the Formulas `afterLoadData` fed the new data to the engine, and the engine's `valuesUpdated` batch
  queued every cell for a synchronous rescan; the Formulas plugin now registers its listener at
  `orderIndex` -1, and `tests/e2e/sheet-switch-autosize.spec.ts` pins the count. What remains is
  O(rows × cols) per `loadData()` by design — the `syncLimit` contract is "first paint exact" — so a
  switch cannot be made proportional to the viewport without an opt-in that drops that guarantee. The
  double load and the Formulas `afterCellMetaReset` scan of the *outgoing* sheet that the
  `updateSettings()` triggers are the remaining per-switch costs, both outside this plugin.

Tests: `__tests__/*.unit.js` (Jest), `tests/e2e/sheets-bar*.spec.ts` (Playwright),
`visual-tests/tests/js-only/sheetsBar/`. The unit suite drives the strip through DOM events and
a captured `TabStrip` instance — the plugin exposes no test-only methods.
