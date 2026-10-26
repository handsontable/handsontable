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
  calls `preventDefault()` (the editor keeps the focus), and calls `stopImmediatePropagation()`, so
  `TableView` skips its selection handling and every `afterOnCell*` listener. That is what keeps
  NestedHeaders from selecting a group span under a header pick, and what DragToScroll reads to stay out
  of a drag the pick's own edge auto-scroller drives. Plugin priority (265) is NOT enough: it orders only the
  first `enablePlugin()`, and a later `updatePlugin()` (a theme switch used to trigger one) re-registers the
  hooks at the tail of each list, behind NestedHeaders. Two shortcuts that were tried and are wrong:
  teaching NestedHeaders to skip its span when `controller.column` was already set (ColumnSorting sets it
  on every Ctrl+click of a sortable header, so a Ctrl+click on a sortable group header stopped selecting
  the span), and disabling DragToScroll for the length of a pick (each re-enable re-registered its hooks at
  the tail of every list).
- **The `formula` alias is registered in the constructor, not in `enablePlugin()`.** A cell configured with
  `editor: 'formula'` must resolve whether or not the plugin enabled (no `builder`, no Formulas yet).
  Otherwise selecting the cell throws `No registered editor found under "formula" name`. With the plugin
  off, the shim mounts a plain textarea. Not at module load either: importing the plugin registry must register plugins
  only (the `registerAll*` registry tests). The static `EDITORS` list is what lets `validateSettings()` accept
  `formula` before any grid exists (`../../settingsSchema/AGENTS.md`). The registration stays silent when
  an application owns the alias: the warning about it comes from `enablePlugin()` (`warnOnce` per grid),
  because with the full bundle every grid runs the constructor, and a grid that never sets `formulaBuilder`
  has no conflict to report.
- **The builder is bound to one engine sheet, and the sheet id is not known at enable time.** The plugin
  enables before the first data load, while `Formulas#sheetId` is still `null`. The builder takes `sheetId`
  only at construction and uses it to parse references, list named expressions, and test the own sheet. So
  `afterLoadData`/`afterUpdateData` compare the Formulas sheet id with the one the builder was built with and
  rebuild the builder when they differ: a shared engine, a `sheetName` on a populated engine, and
  `Formulas#switchSheet()`, which reloads the data.
- **`updatePlugin()` keeps the built plugin when nothing it was built from changed.** `SETTING_KEYS` lists
  `formulas`, and the React and Angular wrappers re-send every object prop with a new identity on each
  render, so a full rebuild per render discarded the bar's focus and an open edit. `#isConfigUnchanged()`
  compares the module and engine by identity, `showFormulaBar` and `direction` by value, and `popups` by
  content (an element in `container` by identity).
- **A theme change rebuilds the builder, not the plugin.** The builder applies its theming class once, at
  construction, and the body-mounted popup portal needs it to resolve `light-dark()` against the grid's
  scheme rather than the OS one. String themes leave `themeManager` `null`, so the class comes from
  `getCurrentThemeName()`.
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
- **A rebuild never throws from a hook.** A `popups.*.container` selector that matches nothing is dropped
  with a warning before the package constructor sees it (hyperformula-ui 0.3.5 throws for one), and any other constructor
  throw is caught and warned. Hosts set through `attach*Host()` are kept on the plugin and re-applied to
  every rebuilt builder. `popups` is stored as a copy, so an object changed in place reads as a change.
- **Commit, cancel and open go through the grid's own code, not a copy of it.** A commit with a
  direction moves with `EditorManager#moveSelectionAfterEnter()` (`up`/`down`) or the grid's Tab
  commands (`right`/`left`), so `enterMoves`, `tabMoves`, ranges and layers behave as in every other
  editor, and only when the save succeeded (`dataSaved`). The package commits `right` on Tab in either
  direction, and the grid binds Tab to the command named `moveCellSelectionInlineStart` (the names are
  inverted), so `right` maps to `InlineStart`. A cancel leaves the selection alone and only returns the
  focus. The formula bar opens the editor through `EditorManager#openEditor()`, so `beforeBeginEditing`,
  the read-only, header and hidden checks, and the re-prepare after `loadData()` apply. Pinned by
  `__tests__/realGridEditing.unit.ts`.
- **The bar reads the ACTIVE selection layer.** `getSelectedRangeActive()`, not `getSelectedRangeLast()`:
  Tab and Enter wrap the focus between layers. Whether the bar edits a formula is decided by the
  highlighted cell, and a header-anchored range is clamped to cells. The selection hooks are ignored
  while an edit is open, so `handleInlineEditClose()` re-reads the selection (a validated edit closes a
  microtask after the deselect that ended it).
- **Highlights follow every index change, applied before the next draw.** The adapter listens to the
  index mappers' `cacheUpdated` local hook (a sort, a move, hiding, trimming, an insert or removal, a
  page change, a data load) and re-derives the custom selections in `beforeViewRender`, because the
  cache update can run mid-batch. A range splits into one selection per visual run, capped at
  `MAX_SELECTIONS_PER_HIGHLIGHT`, past which it draws its bounding box as a border only. A span over
  every index of an axis (`A:A`) is the whole visual axis in any order.
- **Custom selections do not carry `aria-selected`.** The Walkontable scanner resolves custom-selection
  cells so their class names land, and the selection manager stamps the grid's selection `cellAttributes`
  only on cells of an area, fill or focus layer (`selectedCells` in `selection/manager.ts`). Otherwise a
  screen reader reported every referenced cell as selected.
- **An error cell carries its message as `aria-description`** (under `ariaTags`), written in
  `afterRenderer` from the package's `data-hfe-error` mark and removed only from a cell the plugin wrote
  it on (a `WeakSet`), so an application's own description survives the grid's cell recycling.
- **`afterRenderer` runs for every rendered cell on every draw.** It reads the editor from the
  `cellProperties` the hook passes, never from `getCellMetaTransient()`, which would resolve the cascade
  (and a `cells` callback) a second time per cell. It also clears the error mark (`data-hfe-error`) from a
  cell that is no longer a formula cell, because the grid recycles cell elements, and it removes the
  `aria-invalid` that `markCell()` writes when `ariaTags` is `false`. Clearing a mark
  (`markCell(cell, null)`) removes `aria-invalid` whoever wrote it, the base renderer's `valid: false`
  included, so `#keepValidatorInvalid()` writes it back for a cell a validator rejected; without that a
  rejected cell kept `htInvalid` while a screen reader heard it as valid.
- **Two coordinate spaces, and the public API speaks only one.** Every public method takes and returns
  VISUAL indexes (`getRawCellText` included). The adapter speaks HyperFormula space to the package and
  translates at its boundary, guarding every `-1` (a trimmed or unresolvable index) before it reaches
  `formatRef`. `getGridSize()` is the physical index count, not `getSheetDimensions()`: the engine reports
  its occupied extent, and the formula bar refuses to navigate at or past that size. A span wider than
  `MAX_HF_INDEX_SCAN` maps only its two ends and walks inward past trimmed ends.
- **A drag past the viewport edge resolves through `getCellCoordsFromMousePosition()`.** The pick's edge
  auto-scroller calls `getCellAddressAt()` with the pointer outside the grid, where `elementFromPoint()`
  finds the scrollbar and the range would stop at the last rendered cell.
- **`getScrollHolder()` asks both axis owners.** The package's edge auto-scroller gets one element and a
  `null` turns it off. With no `height` and a pixel `width` the window scrolls the rows and the master
  holder the columns, so asking only the vertical owner (`topOverlay`) returned `null` there and a drag
  past the end edge stopped scrolling the columns. The vertical owner wins; `inlineStartOverlay` is the
  fallback (`split-scroll` fixture variant, `formula-builder-layout.spec.ts`).
- **The tracked column header level comes from `TableView#getColumnHeadersCount()`, not from the levels
  seen.** A deepest-level-seen rule only grows, so `updateSettings({ nestedHeaders: false })` (which does
  not rebuild the adapter) left level 0 untracked and the column headers untinted for good.
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
  session closes, the cell keeps its value), and Shift+Tab again out of the grid. Tab from the content before
  the grid goes address box, formula editor, then back into the grid. There is no keyboard trap, so the bar
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
  `shadow` fixture variant pins both (`formula-builder-layout.spec.ts`).
- **Ctrl/Cmd+Enter fills the selection through the grid's editor.** The adapter's `commitFill()` calls
  `commitInlineEditToSelection()`, which saves through `finishEditing(false, true)`: the `ctrlDown` path of
  `BaseEditor#saveValue()`, shared with the grid's own fill (`selection/fillSelection.ts`). Alt+Enter inserts
  a line break.

## Known gaps

The `hyperformula-ui` side of each is listed for the package maintainers (the review of PR #13172).

- In a grid that is not in a shadow root, the popups and the live region mount in the document body. The
  axe scan marks that portal on two pages (`formula-builder-suggestions`, `formula-builder-function-help`);
  the error popup and the live region are not scanned.
- The `formula` alias is registered by the first grid built with the plugin registered, so with the full
  bundle every page that builds a grid has it (the constructor trap above explains why).
- The horizon theme's accent focus ring measures below 3:1; it is the theme token every grid surface uses.
- `hyperformula-ui` is `GPL-3.0-only`, like HyperFormula. It is pinned to an exact version because the 0.x
  line may break in a minor.

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
