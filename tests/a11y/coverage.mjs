/**
 * What the axe scan covers, plugin by plugin and editor by editor.
 *
 * Every folder under `handsontable/src/plugins/` and `handsontable/src/editors/` has one entry, and
 * `lib/__tests__/a11y-coverage.test.mjs` (root `test:tooling`) fails on a folder without one, so a
 * new plugin or editor cannot ship without someone deciding how its UI is scanned. An entry is one
 * of three kinds:
 *
 * - `pages`: the `id`s in `pages.mjs` whose fixtures turn it on and whose scans reach its UI.
 * - `none`: it draws nothing a scan of a resting page could check, and why (sizing, data, events).
 * - `gap`: it draws UI that no page scans yet, and what is missing. A gap is debt, not a verdict:
 *   `A11Y_GAP_LIMIT` is exactly the number of gaps, so a new gap fails the test and a closed gap
 *   lowers the limit in the same change, like the baseline ratchet.
 *
 * A new plugin or editor with UI adds a page (`tests/AGENTS.md`, "Adding a page") and lists it
 * here. `none` is for code that really draws nothing at rest: a pointer-only drag guide counts, a
 * control that waits for a fixture to enable it does not.
 */

/**
 * @typedef {{ pages: string[] } | { none: string } | { gap: string }} CoverageEntry
 */

/** @type {Record<string, CoverageEntry>} */
export const PLUGIN_COVERAGE = {
  asyncValues: { pages: ['async-values'] },
  autoColumnSize: { none: 'measures column widths and draws no element of its own' },
  autoLink: { pages: ['auto-link'] },
  autoRowHeaderSize: { none: 'measures the row header width and draws no element of its own' },
  autoRowSize: { none: 'measures row heights and draws no element of its own' },
  autofill: { none: 'draws a pointer-only drag handle on the selection border, with no role, name or focus' },
  bindRowsWithHeaders: { none: 'keeps row headers bound to their rows and draws nothing of its own' },
  checkboxHeader: { pages: ['checkbox'] },
  collapsibleColumns: { pages: ['collapsible-headers'] },
  columnSorting: { pages: ['nested-headers', 'sheets-bar'] },
  columnSummary: { pages: ['column-summary'] },
  comments: { pages: ['comments'] },
  contextMenu: { pages: ['context-menu', 'context-menu-submenu'] },
  copyPaste: { none: 'handles clipboard events; its menu items draw like every context menu item' },
  customBorders: { pages: ['shared-demo'] },
  dataProvider: { pages: ['data-provider-sheets-bar'] },
  dialog: { pages: ['dialog', 'loading'] },
  dragToScroll: { none: 'scrolls the grid while a pointer drags and draws nothing of its own' },
  dropdownMenu: { pages: ['dropdown-menu', 'filters-conditions'] },
  emptyDataState: { pages: ['empty-data'] },
  exportFile: { none: 'writes data to a file and draws no element of its own' },
  filters: { pages: ['dropdown-menu', 'filters-conditions'] },
  formulaBuilder: { pages: ['formula-builder', 'formula-builder-suggestions', 'formula-builder-function-help'] },
  formulas: { none: 'computes cell values; a formula is edited in the text editor or the formula builder editor' },
  freezeBar: { pages: ['freeze-bar'] },
  hiddenColumns: { pages: ['shared-demo'] },
  hiddenRows: { pages: ['complex-demo'] },
  importFile: { none: 'reads data from a file and draws no element of its own' },
  loading: { pages: ['loading'] },
  manualColumnFreeze: { none: 'adds freeze items to the context menu and moves columns; draws nothing of its own' },
  manualColumnMove: { none: 'draws a guide and a ghost only while a pointer drags a column' },
  manualColumnResize: { none: 'draws a resize handle on header hover and a guide only while dragging' },
  manualRowMove: { none: 'draws a guide and a ghost only while a pointer drags a row' },
  manualRowResize: { none: 'draws a resize handle on header hover and a guide only while dragging' },
  mergeCells: { pages: ['merge-cells'] },
  moveCells: { none: 'drags the selection by its border and draws only during the drag' },
  multiColumnSorting: { pages: ['shared-demo', 'complex-demo'] },
  multipleSelectionHandles: { pages: ['mobile-selection-handles'] },
  nestedHeaders: { pages: ['nested-headers'] },
  nestedRows: { pages: ['nested-rows'] },
  notification: { pages: ['notification'] },
  pagination: { pages: ['pagination'] },
  rowSelection: { pages: ['row-selection'] },
  search: { none: 'adds a class to matching cells and draws no element of its own' },
  selectionHandles: { pages: ['selection-handles'] },
  sheetsBar: { pages: ['sheets-bar', 'data-provider-sheets-bar'] },
  stretchColumns: { none: 'computes column widths and draws no element of its own' },
  touchScroll: { none: 'fades the frozen overlays during a touch scroll and draws nothing of its own' },
  trimRows: { none: 'removes rows from the view and draws no element of its own' },
  undoRedo: { none: 'keeps the edit history; its menu items draw like every context menu item' },
  viewState: { none: 'reads and restores the sort, filter and column state through an API, and draws nothing' },
};

/** @type {Record<string, CoverageEntry>} */
export const EDITOR_COVERAGE = {
  autocompleteEditor: { pages: ['autocomplete-editor'] },
  checkboxEditor: { none: 'toggles the value; the checkbox renderer draws the control the checkbox page scans' },
  dateEditor: { pages: ['date-editor'] },
  dropdownEditor: { pages: ['dropdown-editor'] },
  handsontableEditor: { pages: ['handsontable-editor'] },
  intlDateEditor: { pages: ['intl-date-editor'] },
  intlDatetimeEditor: { pages: ['datetime-editor'] },
  intlTimeEditor: { pages: ['intl-time-editor'] },
  multiSelectEditor: { pages: ['multiselect-editor'] },
  numericEditor: { none: 'draws the text editor\'s textarea, which the text-editor page scans' },
  passwordEditor: { pages: ['password-editor'] },
  selectEditor: { pages: ['select-editor'] },
  textEditor: { pages: ['text-editor'] },
  timeEditor: { pages: ['time-editor'] },
};

/**
 * The number of `gap` entries. It only goes down: closing a gap lowers it in the same change, and a
 * new gap fails the coverage test until another gap is closed.
 */
export const A11Y_GAP_LIMIT = 0;
