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
  `formula` before any grid exists (`../../settingsSchema/AGENTS.md`).
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
  original. `#cancelOpenEdit()` runs before every `destroy()`.
- **`afterRenderer` runs for every rendered cell on every draw.** It reads the editor from the
  `cellProperties` the hook passes, never from `getCellMetaTransient()`, which would resolve the cascade
  (and a `cells` callback) a second time per cell. It also clears the error mark (`data-hfe-error`) from a
  cell that is no longer a formula cell, because the grid recycles cell elements, and it removes the
  `aria-invalid` that `markCell()` writes when `ariaTags` is `false`.
- **Two coordinate spaces, and the public API speaks only one.** Every public method takes and returns
  VISUAL indexes (`getRawCellText` included). The adapter speaks HyperFormula space to the package and
  translates at its boundary, guarding every `-1` (a trimmed or unresolvable index) before it reaches
  `formatRef`. `getGridSize()` is the physical index count, not `getSheetDimensions()`: the engine reports
  its occupied extent, and the formula bar refuses to navigate at or past that size. A span wider than
  `MAX_HF_INDEX_SCAN` maps only its two ends and walks inward past trimmed ends.
- **A drag past the viewport edge resolves through `getCellCoordsFromMousePosition()`.** The pick's edge
  auto-scroller calls `getCellAddressAt()` with the pointer outside the grid, where `elementFromPoint()`
  finds the scrollbar and the range would stop at the last rendered cell.
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
  foreground color into every text-level error token. The package's reference palette is restated the
  same way (`$reference-palette`, 60% hue and 40% editor foreground): as shipped, five of its eight light
  colors measured below 3:1 on white, which failed both the reference text and the highlight borders that
  share those tokens. The axe scan caught it on the `formula-builder` page.

## Known gaps

- The popups and the live region mount in the document body, outside the scanned root, so the axe scan
  (`formula-builder` page) sees the bar and the inline editor but not the listbox, the function help, the
  error popup, or the announcements. The package has no option for their parent yet.
- The accessible names ("Cell address", "Formula editor", ...) and the announcements are English strings
  inside the package, with no option to pass translated phrases.
- The error message of a cell is only in `data-hfe-error`; nothing exposes it to assistive technology yet.
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
