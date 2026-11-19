# EditableHeaders plugin – renaming column and row headers in the grid

The `editableHeaders` plugin lets users rename a column header (and, with `rowHeaders: true` in the
option, a row header) through an input laid over the header. Read this before touching
`editableHeaders.ts`, `headerEditor.ts` or `contextMenuItem/renameHeader.ts`.

## What it owns, and what it does not

- It owns the **names users gave headers** and the input. The configured headers stay the user's:
  `colHeaders`, `rowHeaders` and `columns[].title` are never written. A rename is stored in two
  `physicalIndexToValue` index maps (`EditableHeaders.column`, `EditableHeaders.row`), `null` for a header
  not renamed.
- It does **not** own how a header is drawn. The names reach the screen through two core value hooks:
  `modifyColumnHeaderValue` (in `Core#getColHeader`) and `modifyRowHeaderValue` (in `Core#getRowHeader`,
  added for this plugin). So the render, `getColHeader()`/`getRowHeader()`, copy with headers and the
  exported file all read the rename with no code here.
- It does **not** rename NestedHeaders labels. NestedHeaders answers `modifyColumnHeaderValue` from its own
  tree, so the plugin steps aside for column headers while NestedHeaders is on (`isEditable()` and the
  listener both check `nestedHeaders.enabled`) and warns once.

## The traps

- **Never write a rename into `getSettings().colHeaders`** (core `AGENTS.md`, DEV-3968/DEV-508): the copy
  shadows every later `updateSettings({ colHeaders })`, and the React and Vue wrappers send the original
  array back. The index maps follow column and row moves, inserts and removals with no code here, and
  UndoRedo snapshots them (no `captureState()` needed); every write runs in `runOperation()`.
- **A rename is written as text, never as HTML, and the switch lives in core.** Core writes a header label
  with `fastInnerHTML()`, which parses a label that looks like markup, and an end user types these names: a
  typed `<img onerror>` ran in the grid and in AutoColumnSize's GhostTable, which calls
  `view.appendColHeader()` directly, and in the copied HTML table (`instanceToTableElement()` in
  `../../utils/parseTable.ts`), which also asks `TableView#isPlainTextHeader()`. With `textExtractor` on, the
  CSV and XLSX export (`../exportFile/dataProvider.ts`) and copy with headers (`../copyPaste/copyPaste.ts`,
  `#readPlainTextHeaders()`) skip the extraction for a rename too: it is text already, and the extraction parsed
  `a<b>c` into `ac`. Overwriting the label later (an `afterGetColHeader` listener, a wrapped
  header renderer) is too late: the markup is already parsed, and a detached `<img>` still fires `onerror`. So
  `TableView#updateCellHeader()` asks the resolver (only for the default `getColHeader`/`getRowHeader` label: a
  header row a plugin draws with a label function of its own keeps its markup) this plugin registers in `onGridReady()`
  (`setPlainTextHeaderResolver(#isRenamedHeader)`) and writes a rename with `fastInnerText()`. A configured
  label keeps the HTML path and the `sanitizer` option. `disablePlugin()` removes the resolver.
- **`updatePlugin()` keeps the renames, and an open input.** It does not run `disablePlugin()` +
  `enablePlugin()`, because a disable unregisters the maps, and the framework wrappers send `editableHeaders`
  again on a render: a rename would last until the next render. It closes the input (without saving) only when
  its header can no longer be renamed. `SETTING_KEYS` lists `nestedHeaders` too, so `#nestedHeadersOn` (read
  instead of the plugin registry on every header read) follows that plugin. Only turning this plugin off drops
  the renames.
- **A typed key must not reach the cell editor.** With `navigableHeaders` off (the default) a header press
  leaves the highlight on a cell, and the shortcut recorder fires `afterDocumentKeyDown` whatever context is
  active, so `EditorManager` opened that cell's editor on the first letter and the name was typed into the
  data. `#onAfterDocumentKeyDown` stops the event (and `beforeCompositionStart`) while the input is open, as
  Comments does. Pinned by the Playwright "keeps the typed name out of the cells" case (`?mode=default`).
- **An emptied input cancels, and so does a scroll that moves the header out of view.** A header with no text has
  no accessible name, and a scroll is no confirmation of a half-typed name.
- **A `blur` while the input is still the active element is ignored.** Switching windows (or opening the
  browser's developer tools) fires `blur` on the input and keeps it active; saving there committed a half-typed
  name.
- **Names follow the physical index, not the record.** `updateData()` fits the maps to the new length, so a name
  stays on its position in the new data; `loadData()` re-registers the maps empty. `setHeader('')` through the API
  still stores an empty name verbatim.
- **A renamed row header follows its row** (it is stored by physical row), while a default row header
  (1, 2, 3) is positional. After a sort, "Total" stays with the row the user named.
- **The input is mounted in `rootElement`, not in the header cell.** A header cell is rebuilt on each
  render, which would drop the input and its focus. `#syncEditor` moves the input over the header on
  `afterRender` and on `afterScroll`: a scroll inside the drawn band moves the overlays with no render, so
  `afterRender` alone left the input behind its column. When the header is no longer drawn it closes without
  saving (see the cancel bullet below), in a `_registerTimeout()`: the close moves the focus and the shortcut
  context, and `afterRender` runs inside a render.
- **Undo, redo and `clearHeaders()` fire `afterHeaderChange` themselves.** UndoRedo restores the index maps with
  no per-header event, so `#onBeforeRestore`/`#onAfterRestore` (and `clearHeaders()`) compare the maps before and
  after by physical index and fire the hook once per changed header, `beforeHeaderChange` never (an undo cannot be
  vetoed there). The copy is taken only while the hook has a listener (`hasHook()`), because it is O(rows) per
  undo. The configured value is read with `#readingConfigured` up, which makes the value hooks step aside.
  **A step that changes the row or column count reports nothing for that axis**: it renumbers the physical
  indexes, so the comparison paired one record's name with another's (rename rows 1 and 3, remove row 1, undo:
  three reports, one with another row's name).
- **The input carries `data-hot-input`.** Without it `TableView` treats it as a page input
  (`isOutsideInput()`) and unlistens the grid on the `mouseup` that follows: the "Rename header" menu click
  opened the input and the grid then stopped listening, so Enter never reached the plugin context (the
  Playwright "renames from the column menu" case goes red without the attribute).
- **The keys live in the plugin context `plugin:editableHeaders`**, switched on while the input is open
  (the Comments pattern). With the grid context left active, the grid's own keys answered instead of the
  input's: Enter did not save and Escape did not close (measured by removing the switch, four of the
  Playwright cases went red). The grid context also holds Delete and Backspace, which empty the selected
  cells, and a column-header selection selects the whole column. `ShortcutManager` cannot drop a context,
  so `#unregisterShortcuts()` removes the group from both contexts, and `#closeEditor()` gives the keyboard
  back to `grid` only when the plugin context is still the active one.
- **Enter and double-click step aside on a header with an action of its own.** ColumnSorting puts
  `sortAction` on a label whose click and Enter sort, so a double-click there would sort twice before the
  input opens, and Enter must keep sorting; F2 and the menu item still open the input. Row headers step aside
  while NestedRows is on (its Enter collapses). The shortcuts are registered `before` the editor group, and
  return `false` so the grid's own Enter does not run after them.
- **The blur saves, so a close must hide the input before it moves the focus.** `#closeEditor()` clears
  `#edited` and calls `HeaderEditor#close()` (which clears its `#opened`) before `focusOnHighlightedCell()`:
  the blur that focus move fires then finds no open editor and saves nothing, so Escape stays a cancel.
- **An IME composition owns Enter and Escape** (`isComposing`, `keyCode === 229`, and the editor's own
  `compositionstart`/`compositionend` flag): the Enter that confirms a candidate must not save the
  half-typed name. Not covered by a test: Playwright cannot drive a real IME.

## Where to look next

- The plugin with the same "own context while typing" design: `../comments/AGENTS.md`.
- The menu helper: `../../utils/menu/AGENTS.md` (`registerMenuEntries()`).
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`; the workflow: the `handsontable-plugin-dev`
  skill.

## Testing

- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern=editableHeaders` (the store, the
  hooks, undo, the settings).
- E2E: `cd tests && npx playwright test e2e/editable-headers.spec.ts` (rebuild the package first): the
  gestures, the keyboard path, focus return, the frozen-column clone, the scroll, the text rendering, and the
  announcement. The fixture's `?mode=default` leaves `navigableHeaders` off; keep a case there, because every
  other mode hides the cell-editor trap above.
