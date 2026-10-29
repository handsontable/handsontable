# FormulaBuilder plugin – formula bar, formula editor, and reference picking on top of Formulas

Covers `formulaBuilder.ts` (lifecycle, settings, the public API), `handsontableAdapter.ts` (the
`hyperformula-ui` `IGridAdapter` contract: index translation, highlights, navigation),
`cellPickController.ts` (mouse reference picking), `formulaCellEditor.ts` (the `formula` editor shim),
`types.ts` (public types), `gridContract.ts` (the package's adapter contract, restated for the
declarations) and `internalTypes.ts`. Read this before
touching any of them, or the Formulas, NestedHeaders, or DragToScroll mouse paths.

## What it owns and what it does not

- **It owns** the glue: the editor shim registered as `editor: 'formula'`, the formula bar host in the top
  layout slot, the adapter, the reference-pick gesture, the error marks it writes in `afterRenderer`, and
  the reference highlights (custom selections on `hot.selection.highlight`).
- **`hyperformula-ui` owns** the editor itself: tokenizing, colored references, autocomplete, function
  help, the error popup, the live region, the keymap, and every accessible name of the bar and the editor.
  The plugin never reaches into its DOM except through the classes it documents.
- **The Formulas plugin owns** the engine, the sheet, and the visual-to-HyperFormula index translation (its
  axis syncers). This plugin borrows all three per call and never caches an engine across an enable cycle.
- **The application owns** the module: `builder` is the `hyperformula-ui` namespace the application
  imports. The Handsontable bundles never import the package at runtime.

## The traps

- **Bar elements sit outside `.handsontable`, so a selector that styles them must be rooted at `.ht-formula-builder__formula-bar`.** The bar mounts in a root-wrapper slot, not inside the grid root. A `.handsontable .hfe-*` rule in `_formula-builder.scss` styles only the in-cell editor and never matches the bar (this is why the bar's editor had no focus ring).
- **The package's point-mode toggle (F2, mod+E) emits no event; the shim watches the handled keydown and enters full edit mode so arrows stop committing.** The keyboard guard in `formulaCellEditor.ts` (`startKeyboardGuard`) calls `editor.enableFullEditMode?.()` for a handled `F2` or ctrl/meta+`e`. Without it the toggled arrows reach the grid and commit the quick edit.
- **Every path that hands the keyboard back from the bar must `listen()` again.** Focusing the bar makes the focus scope manager `unlisten()` the grid, so commit, cancel, and teardown under an open bar edit all go through `#relistenAfterBarExit()`, or the keyboard is dead until a click. A pick drag released outside the grid needs it too, but deferred: the focus scope manager's `click` handler runs after the `mouseup` and unlistens the grid, so `CellPickController` calls its `relisten` dep, which the plugin wires to a `_registerTimeout(..., 0)` around the helper.
- **No emitted declaration may name `hyperformula-ui`, internal ones included.** It is a devDependency,
  and the `Emitted Types` check compiles EVERY `tmp/**/*.d.ts` with TypeScript 5.1 and no dependencies
  installed, so one `import type ... from 'hyperformula-ui'` in any emitted file fails with TS2307 (it did,
  on `cellPickController.d.ts`, `handsontableAdapter.d.ts` and `internalTypes.d.ts`). Checking only the
  declarations reachable from `tmp/base.d.ts` is not enough: a deep import reaches the rest. So `types.ts`
  mirrors the public shapes, `gridContract.ts` mirrors the adapter contract every internal signature uses,
  and `__tests__/formulaBuilder.types.ts` pins both against the package in both directions plus the key
  sets, and pins `HandsontableAdapter` against the package's `IGridAdapter`. The package's own types may
  appear only on `#` fields (they emit as `#private`) and in non-exported aliases such as each module's
  local `CoreModule`; an exported alias would be emitted. Settings and constructor options that carry the
  module are typed `unknown` and cast once. Tests reach the adapter through `getFormulaBuilderAdapter(plugin)`.
  To reproduce the check locally, hide `handsontable/node_modules/hyperformula-ui`, run the workflow's
  `tsc -p tsconfig.verify-types.json` step with TypeScript 5.1.6 after `build:types` and `downlevel:types`,
  then restore the link.
- **A reference pick claims the whole mouse gesture, and it has to run first.** The three cell mouse
  listeners are registered at order index `-1` (`CELL_MOUSE_HOOK_ORDER`). A pick sets every controller flag,
  calls `preventDefault()` (the editor keeps the focus), and sets the event's `isImmediatePropagationEnabled`
  flag to `false`, so `TableView` skips its selection handling and every `afterOnCell*` listener. Only the
  flag, never the shared `stopImmediatePropagation()` helper: it also sets `cancelBubble`, so the press never
  reached `document` and a context menu or dropdown menu open at that moment stayed open over the pick.
  The press therefore still bubbles to every `rootElement` listener, and one that acts on it must check
  `isImmediatePropagationStopped(event)`: the dropdown/autocomplete arrow (`autocompleteRenderer`) and the
  multiSelect indicator (`multiSelectRenderer/utils/utils.ts`) do, or a pick on the arrow opened the
  cell's own editor (`onCellDblClick`) and, with Cmd/Ctrl held, dropped the open formula edit.
  That is what keeps NestedHeaders from selecting a group span under a header pick, and what DragToScroll
  reads to stay out of a drag the pick's own edge auto-scroller drives. Plugin priority (265) is NOT enough: it orders only the
  first `enablePlugin()`, and a later `updatePlugin()` (a theme switch used to trigger one) re-registers the
  hooks at the tail of each list, behind NestedHeaders. Two shortcuts that were tried and are wrong:
  teaching NestedHeaders to skip its span when `controller.column` was already set (ColumnSorting sets it
  on every Ctrl+click of a sortable header, so a Ctrl+click on a sortable group header stopped selecting
  the span), and disabling DragToScroll for the length of a pick (each re-enable re-registered its hooks at
  the tail of every list).
  The later `beforeOnCellMouseDown` listeners still run too: the hook runner does not stop on the flag.
  A plugin that acts on a press from that hook (CheckboxHeader's "check all", RowSelection's header and
  checkbox cells, NestedRows' collapse button, CollapsibleColumns' indicator) would act AND the pick would
  insert a reference, so a press on such a control is left to its plugin (`HEADER_CONTROL_SELECTOR` and
  `CELL_CONTROL_SELECTOR` in `cellPickController.ts`): no pick starts. Add a new control there; teaching
  the hook runner to skip later callbacks once the flag is set would change every event hook. A checkbox
  cell is different: its renderer toggles the box on the native `click`, after the claimed `mousedown`,
  so a pick that starts on the box or its label arms a one-shot click swallow and the pick wins.
  The handoff press (a click on the bar-selected cell, which moves the edit into the cell) is claimed
  as well, not only suppressed: RowSelection's click selection runs from `afterOnCellMouseDown`.
- **The `formula` alias is registered in the constructor, not in `enablePlugin()`.** A cell configured with
  `editor: 'formula'` must resolve whether or not the plugin enabled (no `builder`, no Formulas yet).
  Otherwise selecting the cell throws `No registered editor found under "formula" name`. With the plugin
  off, the shim mounts a plain textarea. Not at module load either: importing the plugin registry must register plugins
  only (the `registerAll*` registry tests). The static `EDITORS` list is what lets `validateSettings()` accept
  `formula` before any grid exists (`../../settingsSchema/AGENTS.md`). The registration stays silent when
  an application owns the alias: the warning about it comes from `enablePlugin()` (`warnOnce` per grid),
  because with the full bundle every grid runs the constructor, and a grid that never sets `formulaBuilder`
  has no conflict to report. `isFormulaEditor()` answers `false` for such an alias and its class (the shim
  class carries `FORMULA_SHIM_MARK`), so the plugin neither marks those cells nor drives them from the bar,
  as the warning says.
- **The builder is bound to one engine sheet, and the sheet id is not known at enable time.** The plugin
  enables before the first data load, while `Formulas#sheetId` is still `null`. The builder takes `sheetId`
  only at construction and uses it to parse references, list named expressions, and test the own sheet. So
  `afterLoadData`/`afterUpdateData` compare the Formulas sheet id with the one the builder was built with and
  rebuild the builder when they differ: a shared engine, a `sheetName` on a populated engine, and
  `Formulas#switchSheet()`, which reloads the data. **Except to an empty sheet**: `#loadSheet()` loads
  nothing then, so no data hook fires. `#followSheetBinding()` therefore runs from the same check in
  `afterSelection` and `handleInlineEditStart()` too (outside an edit), and `#isConfigUnchanged()` compares
  the sheet id, so a later `updatePlugin()` rebuilds as well. Without it the builder suggested the previous
  sheet's scoped named expressions. The two cases differ under an open edit: a data load rebuilds at once
  (the load replaced the data the edit was made against, and the rebuild cancels the edit), while a
  switch with no load leaves the edit on its sheet and `handleInlineEditClose()` defers the rebuild
  through `#rebuildAfterEdit`. Skipping both under an edit left the builder on the old sheet for good.
  `#rebuildBuilder()` clears `#rebuildAfterEdit` AFTER it built the new builder: its destroy cancels
  the open edit, and that close runs before the new builder exists, so it still sees the old sheet id
  and asks for a rebuild. Cleared before, that request queued a second rebuild a task later.
  `#teardownPluginState()` has the same order for the same reason.
- **`enablePlugin()` emits the bar selection once the setup succeeds.** The teardown of an `updatePlugin()`
  rebuild clears `#barSelected` and the dedupe key, and no selection hook runs until the selection moves,
  so a bar turned on with `updateSettings()` stayed empty over a selected formula cell. It resets the
  dedupe key first: `resolvePlugin()` in the editor shim does not check `enabled`, so an edit closed in
  the fallback textarea while the plugin was off still ran `handleInlineEditClose()` and wrote the key.
- **The bar re-reads the selected cell on `afterChange`.** It hears about a cell through the selection
  hooks only, deduped on the coordinates, so a write to the selected cell that moves no selection (Delete,
  paste, undo, `setDataAtCell()`) left the old formula in the bar. A change on the active cell (or a change
  list of `null`) resets the key and re-emits; an open edit is left alone, its close re-reads.
  The same one helper (`#resyncBarCell`, no coordinate filter) is the listener of `afterSetSourceDataAtCell`,
  `afterCreateRow`/`Col`, `afterRemoveRow`/`Col`, `afterColumnSort`, `afterRowMove`/`ColumnMove`, `afterUpdateSettings` (order 2), and runs at
  the end of `#onAfterDataLoad` (`afterLoadData`/`afterUpdateData`): a sort, a data replace or a source write
  keeps the coordinates, so the selection dedupe hid the new cell. The Formulas plugin enables first (priority
  260 < 265) and its load listeners carry order -1, so the engine has resynced when the bar re-reads. The
  exception is `updateSettings({ data })`: Formulas fills the engine from `afterUpdateSettings` (order 1),
  after `afterUpdateData`, so the bar listens there with order 2.
- **`updatePlugin()` keeps the built plugin when nothing it was built from changed.** `SETTING_KEYS` lists
  `formulas`, and the React and Angular wrappers re-send every object prop with a new identity on each
  render, so a full rebuild per render discarded the bar's focus and an open edit. `#isConfigUnchanged()`
  compares the module and engine by identity, `showFormulaBar` and `direction` by value, and `popups` by
  content (an element in `container` by identity). It also checks the popup hosts the builder was docked into (`#dockedPopupHosts`): a host that
  left the document, or a selector that now finds another element, forces a rebuild under equal settings.
- **A theme change rebuilds the builder, not the plugin.** The builder applies its theming class once, at
  construction, and the body-mounted popup portal needs it to resolve `light-dark()` against the grid's
  scheme rather than the OS one. String themes leave `themeManager` `null`, so the class comes from
  `getCurrentThemeName()`. A theme or language change that arrives during an edit is held back
  (`#rebuildAfterEdit`) and rebuilt a task after the edit closes: a rebuild cancels the edit, and an
  application that follows `prefers-color-scheme` swaps the theme while the user types. Not inside
  `handleInlineEditClose()` itself, which runs inside the old builder's commit handler. A language change rebuilds
  only when the normalized code differs from `#builtLanguageCode`: `updateSettings({ language })` fires
  `afterLanguageChange` even for the code in use, and never for an unregistered one.
- **The theme class must never be written on `rootElement`.** The builder hands its theme class to the
  adapter's `setOverlayClassName()`, so the overlay host is `rootWrapperElement` (`rootElement` only on a
  nested grid, which has no wrapper), where core already keeps that class: the adapter adds a class only
  when the host lacks it and removes only what it added. `rootElement` sits inside the wrapper, so a theme
  class there matches the theme's own token block and beats the `colorScheme` and `density` overrides the
  theme engine scopes to the wrapper (`.<theme>.<scope>`), and during an edit (the rebuild is held back) it
  keeps the cells in the old theme. Pinned by the `colorScheme and density` and theme-switch specs in
  `tests/e2e/formula-builder-layout.spec.ts`; the colorScheme ones need the `theme-engine` fixture
  variant, since a container class skips the engine.
- **Rebuilding or tearing down under an open edit cancels the edit first.** Destroying the builder while
  Handsontable's editor is EDITING leaves it over a torn-down mount, and its later close commits the stale
  original. `#cancelOpenEdit()` runs before every `destroy()` (`#destroyBuilder()`).
- **The builder is destroyed before the Formulas plugin detaches its engine, never after.** Formulas
  (priority 260) is destroyed and updated before this plugin, and when it built the engine itself it
  destroys it, after which the builder's engine unsubscribe throws (`hot.destroy()` and
  `updateSettings({ formulas: false })` threw, and the popup portal and live region leaked). The plugin
  subscribes through `Formulas#addEngineDetachListener()` (`@private`), which runs right before the
  engine is unregistered, and destroys the builder there. The plugin can then be enabled with no
  builder until its next `updatePlugin()`, which rebuilds it (`#builder === null` forces the full
  cycle); meanwhile the shim mounts the plain textarea (`handleInlineEditStart()` returns `false`).
  Pinned on a real grid by `__tests__/realGridTeardown.unit.ts`.
- **The "requires the Formulas plugin" warning waits for `afterInit` during the init.** A SheetsBar
  workbook declares `formulas` per sheet, and those settings enable the Formulas plugin after this plugin's
  first enable attempt, which then fails for a moment and succeeds later in the same init. The plugin
  records that failure and warns from `afterInit` only if it is still off (`#formulasWarningPending`);
  after the init it warns at once. Pinned by `__tests__/sheetsBar.unit.ts`, which also pins the builder
  rebuild on each sheet switch. A stub grid never runs `afterInit`, so a stub test of a post-init enable
  calls `finishInit()` first.
- **A popup container element counts only while it is connected.** A framework can unmount the element
  passed in `popups.*.container` while the settings still hold it, and a popup mounted there never shows,
  so a detached element is dropped with the same warning as a selector that finds nothing. So is `null`
  (a React `ref.current` read before mount): read `isConnected` only after ruling it out, or the plugin
  setup throws where hyperformula-ui 0.3.6 used to warn and float the popup.
- **A rebuild never throws from a hook.** A `popups.*.container` selector that matches nothing is dropped
  with a warning before the package constructor sees it (hyperformula-ui 0.3.5 threw for one; 0.3.6 warns), and any other constructor
  throw is caught and warned. Hosts set through `attach*Host()` are kept on the plugin and re-applied to
  every rebuilt builder. `popups` is stored as a copy, so an object changed in place reads as a change.
- **Commit, cancel and open go through the grid's own code, not a copy of it.** A commit with a
  direction moves with `EditorManager#moveSelectionAfterEnter()` (`up`/`down`) or the grid's Tab
  commands (`right`/`left`), so `enterMoves`, `tabMoves`, ranges and layers behave as in every other
  editor, and only when the save succeeded (`dataSaved`). The package commits `right` on Tab in either
  direction, and the grid binds Tab to the command named `moveCellSelectionInlineStart` (the names are
  inverted). A Tab commit runs the grid context's own Tab shortcuts (`getContext('grid').getShortcuts()`),
  the path the text editor forwards to, not the move command alone: the `GRID_TAB_NAVIGATION_GROUP` pair
  around the move drops the selection when Tab has nowhere to go, so the next Tab leaves the grid. A cancel leaves the selection alone and only returns the
  focus. The formula bar opens the editor through `EditorManager#openEditor()`, so `beforeBeginEditing`,
  the read-only, header and hidden checks, and the re-prepare after `loadData()` apply. Pinned by
  `__tests__/realGridEditing.unit.ts`.
- **The bar reads the ACTIVE selection layer.** `getSelectedRangeActive()`, not `getSelectedRangeLast()`:
  Tab and Enter wrap the focus between layers. Whether the bar edits a formula is decided by the
  highlighted cell, and a header-anchored range is clamped to cells. The selection hooks are ignored
  while an edit is open, so `handleInlineEditClose()` re-reads the selection (a validated edit closes a
  microtask after the deselect that ended it). One exception: a selection the grid moves under the `shift`
  source (an application `alter()` during the edit) moves `#barSelected` with it, without emitting
  (`#followStructuralShift()`). The pick controller compares every press with it, so a stale one turned a
  pick on the cell that took the old coordinates into a switch to inline editing. Only the active cell
  follows; the range is built from the grid's own `from`/`to` when it is emitted and is not stored. Under
  a header selection the grid keeps `from` and moves only `to`, so a range moved by the highlight's
  offset described one the grid did not hold.
- **Highlights follow every index change, applied before the next draw.** The adapter listens to the
  index mappers' `cacheUpdated` local hook (a sort, a move, hiding, trimming, an insert or removal, a
  page change, a data load) and re-derives the custom selections in `beforeViewRender`, because the
  cache update can run mid-batch. A range splits into one selection per visual run, capped at
  `MAX_SELECTIONS_PER_HIGHLIGHT`, past which it draws its bounding box as a border only. A span over
  every index of an axis (`A:A`) is the whole visual axis in any order. Any other span past
  `MAX_HF_INDEX_SCAN` maps its two ends only. That band is exact because the Formulas plugin hands every
  sort and move to the engine, so HyperFormula order follows the visual one. Ends that come back reversed
  prove it does not (an engine order the grid could not express), so that run is drawn without a fill
  (`VisualRun#approximate`).
- **A highlight color reaches a generated stylesheet, so `#isSafeColor()` rejects `/*` as well as the
  characters outside `SAFE_COLOR_PATTERN`.** `CSS.supports('color', 'red /* x')` is `true` (the comment is
  dropped before parsing), and in the stylesheet text the open comment swallowed every later rule.
- **Custom selections do not carry `aria-selected`.** The Walkontable scanner resolves custom-selection
  cells so their class names land, and the selection manager stamps the grid's selection `cellAttributes`
  only on cells of an area, fill or focus layer (`selectedCells` in `selection/manager.ts`). Otherwise a
  screen reader reported every referenced cell as selected.
- **An error cell carries its message as `aria-description`** (under `ariaTags`), written in
  `afterRenderer` from the package's `data-hfe-error` mark. The plugin keeps the text it wrote per element
  (a `WeakMap`) and removes the attribute only while it still holds that text: a recycled element can carry
  the plugin's description from its last cell, but a renderer runs before `afterRenderer` and may already
  have written the application's own, which a "did the plugin touch this element" check deleted.
- **`afterRenderer` runs for every rendered cell on every draw.** It reads the editor from the
  `cellProperties` the hook passes, never from `getCellMetaTransient()`, which would resolve the cascade
  (and a `cells` callback) a second time per cell. It also clears the error mark (`data-hfe-error`) from a
  cell that is no longer a formula cell, because the grid recycles cell elements, and it removes the
  `aria-invalid` that `markCell()` writes when `ariaTags` is `false`. Clearing a mark
  (`markCell(cell, null)`) removes `aria-invalid` whoever wrote it, the base renderer's `valid: false`
  included, so `#keepValidatorInvalid()` writes it back for a cell a validator rejected; without that a
  rejected cell kept `htInvalid` while a screen reader heard it as valid. The teardown takes every mark
  and the plugin's descriptions off the rendered cells (`#clearCellErrorMarks()`): the grid's render resets
  classes and ARIA attributes but not `data-*`, so after `formulaBuilder: false` a mark moved with the
  recycled elements. With no builder (the engine detached, or a rebuild failed) `#markCell()` removes the
  attribute itself, because `#builder?.markCell()` would do nothing and the stale mark would be described
  on the cell the element shows next; `#onEngineDetach` clears every mark at once.
- **The adapter answers `false` for an address it cannot select.** `setActiveCell()` and `setSelection()`
  return `false` when the grid shows no row or column to move to; the package reads that as
  "unavailable" and announces it, while `undefined` left the address in the box with nothing selected.
  That covers four more cases besides a missing index: a row or column a hiding map hides (HiddenRows,
  HiddenColumns, and Pagination, which hides the rows of the other pages), an index at or past
  `maxRows`/`maxCols`, a grid that selected something else (`selectionMode: 'single'` collapses a range),
  and a select the grid refused. `selectFormulaCell(s)` returns `boolean` for that last two: the grid's
  last selection must hold the requested range (a merged cell may widen it). A trimmed index is the
  exception and is not refused: it still moves to the nearest shown index.
- **The reference border width is cached on the adapter, which outlives a theme rebuild.** `afterSetTheme`
  calls `resetBorderWidth()` before the theme class check (a stylesheet swapped in place keeps the class).
- **Every engine read goes through `#readableSheetId()`.** An application on a shared engine can remove
  the grid's sheet; the Formulas plugin keeps the old id, and the engine throws `NoSheetWithIdError` for
  the package's `readCellText()` (the formula bar's selection sync threw on every select) and for
  `getSheetDimensions()`. `getCellValue()` returns a `#REF!` there instead of throwing, but the
  `afterRenderer` read takes the same guard. `#sheetId` (with its `?? 0`) is only what the builder is built
  with.
- **Two coordinate spaces, and the public API speaks only one.** Every public method takes and returns
  VISUAL indexes (`getRawCellText` included). The adapter speaks HyperFormula space to the package and
  translates at its boundary, guarding every `-1` (a trimmed or unresolvable index) before it reaches
  `formatRef`. `getGridSize()` is the physical index count, not `getSheetDimensions()`: the engine reports
  its occupied extent, and the formula bar refuses to navigate at or past that size. A span wider than
  `MAX_HF_INDEX_SCAN` maps only its two ends and walks inward past trimmed ends.
- **A bar edit whose text equals the cell's raw text opens the editor with a `null` seed.** `BaseEditor#beginEditing()` treats a string seed as typed text, so its unchanged-value guard never arms and an untouched commit would write `"5"` for `5`, `""` for `null`, and record an undo step. `HandsontableAdapter#editorSeed()` (private) makes that call; a changed or typed seed stays a string.
- **A drag past the viewport edge resolves through `getCellCoordsFromMousePosition()`.** The pick's edge
  auto-scroller calls `getCellAddressAt()` with the pointer outside the grid, where `elementFromPoint()`
  finds the scrollbar and the range would stop at the last rendered cell.
- **`getScrollHolder()` asks both axis owners.** The package's edge auto-scroller gets one element and a
  `null` turns it off. With no `height` and a pixel `width` the window scrolls the rows and the master
  holder the columns, so asking only the vertical owner (`topOverlay`) returned `null` there and a drag
  past the end edge stopped scrolling the columns. The vertical owner wins; `inlineStartOverlay` is the
  fallback (`split-scroll` fixture variant, `formula-builder-layout.spec.ts`). It still returns `null` when
  the window owns both axes (no element to follow on scroll), so the pick's auto-scroller does not use it:
  `RangeDragTracker`'s `getScrollElement` reads `HandsontableAdapter#getAutoScrollTarget()`, which falls
  back to a stand-in for the window's viewport. Not `document.scrollingElement` itself: the package
  computes its edge zones from `getBoundingClientRect()`, and the root element's rectangle is the whole
  page, so a pointer below the window sits inside it and nothing scrolls. The stand-in reports the
  viewport's box and forwards `scrollTop`/`scrollLeft` to the scrolling element (`window-scroll` fixture
  variant, `formula-builder-picking.spec.ts`). In `split-scroll` the holder wins and its rectangle spans
  every row, so a drag below the window still does not scroll the page there.
- **The tracked column header level comes from `TableView#getColumnHeadersCount()`, not from the levels
  seen.** A deepest-level-seen rule only grows, so `updateSettings({ nestedHeaders: false })` (which does
  not rebuild the adapter) left level 0 untracked and the column headers untinted for good.
- **Walkontable reuses its header elements in place on scroll.** A `<th>` tracked for column C shows
  column K after a horizontal scroll, and the old set kept it, so `=SUM(C:C)` tinted K. `#trackHeader()`
  remembers each element's last index (`#trackedHeaderIndex`) and moves it out of the old set; the
  `isConnected` prune catches only detached elements.
- **The editor's text field must carry `data-hot-input`.** After every selection change the focus
  manager focuses the selected cell and blurs the focused element unless `isOutsideInput()` says it is a
  grid input, which it reads from that attribute. The text editor sets it on its `TEXTAREA`; the
  `hyperformula-ui` field (`.hfe-editor__input`) and the plain fallback textarea do not have it on their
  own, so an `alter()` while a formula was edited took the focus out of the open editor and the package
  hid the highlights. `handleInlineEditStart()` marks the field in the cell and in the formula bar, and
  the fallback marks its textarea. jsdom never reaches that blur, so the guard is the Playwright test
  "the edit keeps the focus and its highlight when the application inserts a row".
- **The shim's keyboard guard stops only the keys the formula editor handled.** A `keydown` the package
  handled has its default prevented; the guard stops it (and its `keypress`/`keyup`) at the wrapper so
  the grid's shortcuts do not handle it again. Every other key reaches the grid, so `beforeKeyDown` fires
  and an arrow key commits a quick edit, as in the grid's other editors.
- **The shim's keyboard guard outlives the session by one task.** The keystroke that commits the edit is
  still bubbling when `afterClose` runs, and a guard removed then lets the grid's document-level recorder
  handle it again (Enter re-opened the editor one row below). A microtask is not enough, because trusted
  event dispatch runs microtasks between listeners, so the guard is destroyed through `_registerTimeout`.
  Each guard is an `EventManager` on a context object of its OWN: `EventManager` stores listeners on its
  context and `destroy()` clears all of them, so a guard built on the editor instance would, one task after
  its session closed, also strip the guard of a session that reopened in that task.
- **The editor container stacks through the shared z-index map.** It carries the layer class
  `getEditedCellsLayerClass()` returns, the way the text editor does. Do not probe the overlays' computed
  z-indexes or measure `.wtBorder` elements: both are Walkontable internals.
- **Keyboard path, measured (the foreign-focus fix of #13243 is what makes it work).** From a selected cell,
  Shift+Tab moves to the bar's formula editor (an edit session opens), Shift+Tab again to the address box (the
  session closes, the cell keeps its value), and Shift+Tab again out of the grid. Shift+Tab from the first column (`autoWrapRow: false`) drops the grid's
  selection and the focus lands on the editor, where the package asks `selectFirstFormulaCell()` for a cell:
  it tries `#lastFocusedCoords` (the cell the grid focused last, recorded in `#onAfterSelectionEnd`, never
  cleared on deselect) first, guarded by range, visibility and `#isFormulaCell`, and scans only otherwise -
  so the bar edits the cell you left, not A1. Tab from the content before
  the grid goes address box, formula editor (the same remembered cell), then back into the grid. There is no keyboard trap, so the bar
  registers no focus scope; the package owns the keys inside it. Pinned by the keyboard spec under
  `tests/e2e/`.
- **The error colors are mixed for text.** The theme's notification error accent measures 3.4:1 on white,
  enough for the error triangle but not for 4.5:1 text, so `_formula-builder.scss` mixes 30% of the
  foreground color into every text-level error token. The reference palette is the package's own: its
  defaults clear 4.5:1 on the editor backgrounds and stay apart from each other, so the plugin does not
  restate `--hfe-ref-1` to `--hfe-ref-8` (an application can, on the theme class). Neither does it
  override the error cell's font or `color-scheme`: the package reads `--hfe-font-family`, which the plugin
  sets, for the error value and the error popup title alike, and sets `color-scheme` only on its roots,
  where the theme class wins.
- **The phrases come from the grid's language and are taken at construction.** Every accessible name,
  hint and announcement of the editor is a `FormulaBuilder:` key in `src/i18n/constants.ts`, passed to the
  package as its `phrases` option (`#phrases()`). The package reads them once, so `afterLanguageChange`
  rebuilds the builder. The dependent-error count has one key per form (`dependentCellError` for one,
  `dependentCellErrors` for more): the dictionary's formatters cannot pick a plural form and fill in
  `[count]` in one call, because the substitution blanks every variable it is not given. Languages with
  more plural forms use a count-neutral wording for the second key. The hint phrases carry no surrounding spaces: the package adds
  them.
- **The builder is built in the grid's document.** `rootDocument` is `hot.rootDocument`, so a grid in an
  iframe gets its selectors resolved and its styles injected there, and a grid in a shadow root passes the
  shadow root as `portalParent`, so the popups and the live region stay in the same tree as the editor and
  its ARIA references resolve. The adapter's generated highlight rules (the dashed border mask, the cell
  tint) go in `hot.rootWrapperElement`, never the document head, which a shadow tree does not read; the
  `shadow` fixture variant pins both (`formula-builder-layout.spec.ts`). They are written as text nodes,
  not through `insertRule()`: CSSOM-only rules are lost when the element leaves the document and comes
  back (a framework moving the grid between tabs or portals), while the class cache keeps the names.
- **Unbalanced parens are closed on the commit path, never in `getValue()`.** `getValue()` is public through
  `hot.getActiveEditor()`, and closing them there changed the buffer under a plain read. The shim's
  `finishEditing()` closes them for an edit that is saved (state `EDITING`, no `restoreOriginalValue`), which
  is what a native commit (an outside click) needs; the formula editor's own commit keys close them too.
- **Ctrl/Cmd+Enter fills the selection through the grid's editor.** The adapter's `commitFill()` calls
  `commitInlineEditToSelection()`, which saves through `finishEditing(false, true)`: the `ctrlDown` path of
  `BaseEditor#saveValue()`, shared with the grid's own fill (`selection/fillSelection.ts`). After a
  successful save it moves the focus within the range with `EditorManager#moveSelectionAfterEnter()` and a
  synthetic Ctrl/Cmd+Enter event, as `editorCloseAndSaveByEnter` does for the text editor. Alt+Enter inserts
  a line break.

## Known gaps

The `hyperformula-ui` side of each is listed for the package maintainers (the review of PR #13172).

- In a grid that is not in a shadow root, the popups and the live region mount in the document body. The
  axe scan marks that portal on two pages (`formula-builder-suggestions`, `formula-builder-function-help`);
  the error popup and the live region are not scanned.
- The `formula` alias is registered by the first grid built with the plugin registered, so with the full
  bundle every page that builds a grid has it (the constructor trap above explains why).
- The horizon theme's accent focus ring measures below 3:1; it is the theme token every grid surface uses.
- `hyperformula-ui` is MIT-licensed since 0.3.6 (0.3.5 and earlier were `GPL-3.0-only`). It is pinned to an
  exact version because the 0.x line may break in a minor.

## Where to look next

- `../formulas/AGENTS.md` – the engine, the sheet binding, and the axis syncers this plugin borrows.
- `../nestedHeaders/AGENTS.md` and `../dragToScroll/AGENTS.md` – the mouse paths a pick claims.
- `../base/AGENTS.md` – the plugin contract and the `PLUGIN_PRIORITY` table.
- `handsontable/AGENTS.md` – "Wrapper UI placement" for the layout slot, the outside-click paths.
- The `handsontable-plugin-dev` and `handsontable-a11y` skills for the workflow.

## Testing

- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern=formulaBuilder`. Jest transforms the
  ESM-only `hyperformula-ui` through `transformIgnorePatterns` in `jest.config.js`; `helpers/pluginHotStub.ts`
  is the shared Handsontable stub.
- Types: `npm run test:types --prefix handsontable` runs `__tests__/formulaBuilder.types.ts`.
- E2E: `cd tests && npx playwright test e2e/formula-builder` (the fixture imports the package from
  `tests/node_modules/`, which the static server serves). A second checkout's server on port 8123 makes the
  suite test that checkout's build: set `HOT_TEST_PORT`.
- a11y: the `formula-builder` page in `tests/a11y/pages.mjs` scans the bar and the open editor.
