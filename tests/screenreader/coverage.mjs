/**
 * What the screen reader scenarios cover, page by page of the axe catalog (`a11y/pages.mjs`) and plugin
 * by plugin and editor by editor of the axe coverage map (`a11y/coverage.mjs`).
 *
 * Every catalog page and every plugin or editor key there has one entry here, and
 * `lib/__tests__/screenreader-coverage.test.mjs` (root `test:tooling`) fails on a page, a plugin or an
 * editor without one, so a new surface cannot ship without someone saying how a screen reader reads it.
 * An entry is one of three kinds:
 *
 * - `scenarios`: the scenarios of `screenreader/scenarios/` that read it. A page lists a scenario that
 *   opens that catalog page, or one that runs on a fixture of its own and names the page in its
 *   `catalogPages` (`grid-core` stands for `grid` and `text-editor`), and every page a scenario stands
 *   for lists it.
 * - `none`: it draws nothing a screen reader meets, and why (sizing, events, a pointer-only guide, a color
 *   scheme that changes no element of the tree).
 * - `gap`: a reader meets it and no scenario reads it yet, and what is missing. A gap is debt, not a
 *   verdict: `SR_GAP_LIMIT` is exactly the number of gaps, so a new gap fails the test and the change
 *   that closes one lowers the limit, like the axe coverage map's ratchet.
 */

/**
 * @typedef {{ scenarios: string[] } | { none: string } | { gap: string }} ScreenReaderCoverage
 */

/** @type {Record<string, ScreenReaderCoverage>} */
export const SR_PAGE_COVERAGE = {
  grid: { scenarios: ['reading-mode-traversal', 'reading-mode-traversal-plain', 'default-mode', 'virtualization', 'virtualization-reading', 'grid-core', 'grid-core-horizon', 'grid-core-single-tab-stop', 'row-selection-corner'] },
  'shared-demo': { gap: 'the demo-shaped grid as a whole (merged cells, hidden-column indicators, sorting, filters, comments) is read by no scenario' },
  'complex-demo': { gap: 'four nested header levels over nested rows, merged cells and frozen panes at once: no scenario reads them together' },
  'read-only': { gap: 'a read-only cell\'s state is a fact a reader announces, and no scenario reads this page (checkbox-cell reads one read-only checkbox, on the checkbox page)' },
  checkbox: { scenarios: ['checkbox-cell', 'checkbox-header'] },
  'nested-headers': { scenarios: ['nested-headers'] },
  'collapsible-headers': { scenarios: ['collapsible-headers'] },
  'nested-rows': { scenarios: ['nested-rows'] },
  'exact-row-heights': { none: 'an exact row height clips what is drawn, not what is in the accessibility tree: a reader reads the cells the grid page reads' },
  'merge-cells': { scenarios: ['merge-cells'] },
  'column-summary': { scenarios: ['column-summary'] },
  loading: { scenarios: ['loading'] },
  'empty-data': { scenarios: ['empty-data'] },
  'sheets-bar': { scenarios: ['sheets-bar'] },
  'data-provider-sheets-bar': { scenarios: ['data-provider-sheets-bar'] },
  pagination: { scenarios: ['pagination'] },
  dialog: { scenarios: ['dialog'] },
  notification: { scenarios: ['notification'] },
  'license-bar': { gap: 'the license notice under an unlicensed grid is page text a reader meets, read by no scenario' },
  'license-powered-by': { gap: 'the Powered by badge under a grid with a sponsored key is a link a reader meets, read by no scenario' },
  'license-missing-features': { gap: 'the notice naming the features a license key leaves out, and its link, are read by no scenario' },
  'context-menu': { gap: 'checkable menu items and separators are read by no scenario; grid-core reads a context menu without them, on its own fixture' },
  'context-menu-submenu': { gap: 'a submenu opened from the context menu, and the way back, are read by no scenario' },
  'dropdown-menu': { scenarios: ['dropdown-menu', 'filters-by-value'] },
  'filters-conditions': { scenarios: ['filters-by-condition'] },
  'text-editor': { scenarios: ['grid-core', 'grid-core-horizon'] },
  'formula-builder': { scenarios: ['formula-builder'] },
  'formula-builder-suggestions': { scenarios: ['formula-builder'] },
  'formula-builder-function-help': { scenarios: ['formula-builder'] },
  'formula-builder-tokens': { scenarios: ['formula-builder'] },
  'formula-builder-named-expression': { scenarios: ['formula-builder'] },
  'autocomplete-editor': { scenarios: ['autocomplete-editor'] },
  'dropdown-editor': { scenarios: ['dropdown-editor'] },
  'handsontable-editor': { scenarios: ['handsontable-editor'] },
  'multiselect-editor': { scenarios: ['multiselect-editor'] },
  'select-editor': { scenarios: ['select-editor'] },
  'date-editor': { scenarios: ['date-editor'] },
  'datetime-editor': { gap: 'the intl-datetime editor is read by no scenario' },
  comments: { scenarios: ['comment-editor'] },
  'freeze-bar': { scenarios: ['freeze-bar'] },
  'selection-handles': { none: 'the drag handles of a desktop selection are drawn under the pointer only, with no role, name or focus a reader meets' },
  'mobile-selection-handles': { gap: 'the touch handles a phone draws on a selection are for the mobile readers, whose lanes do not exist yet' },
  'auto-link': { scenarios: ['auto-link'] },
  'row-selection': { scenarios: ['row-selection'] },
  'async-values': { scenarios: ['async-values'] },
  'time-editor': { gap: 'the time editor is read by no scenario' },
  'intl-date-editor': { gap: 'the native date input of the intl-date editor is read by no scenario' },
  'intl-time-editor': { gap: 'the native time input of the intl-time editor is read by no scenario' },
  'password-editor': { scenarios: ['password-editor'] },
  'dark-grid': { none: 'the dark color scheme changes colors, never an element, a role or a name: a reader reads the grid page\'s tree' },
  'dark-context-menu': { none: 'the dark color scheme changes colors, never an element, a role or a name: a reader reads the context menu page\'s tree' },
  'dark-dropdown-menu': { none: 'the dark color scheme changes colors, never an element, a role or a name: a reader reads the dropdown menu page\'s tree' },
  'dark-dialog': { none: 'the dark color scheme changes colors, never an element, a role or a name: a reader reads the dialog page\'s tree' },
  'rtl-grid': { scenarios: ['reading-mode-traversal-rtl'] },
  'rtl-dropdown-menu': { gap: 'the dropdown menu of a right-to-left grid is read by no scenario' },
};

/**
 * The plugins and editors, by the keys of the axe coverage map (`PLUGIN_COVERAGE` and `EDITOR_COVERAGE`
 * in `a11y/coverage.mjs`, which follow the folders on disk).
 *
 * @type {Record<string, ScreenReaderCoverage>}
 */
export const SR_FEATURE_COVERAGE = {
  // Plugins.
  asyncValues: { scenarios: ['async-values'] },
  autoColumnSize: { none: 'measures column widths and draws nothing a reader meets' },
  autoLink: { scenarios: ['auto-link'] },
  autoRowHeaderSize: { none: 'measures the row header width and draws nothing a reader meets' },
  autoRowSize: { none: 'measures row heights and draws nothing a reader meets' },
  autofill: { none: 'draws a pointer-only drag handle with no role, name or focus' },
  bindRowsWithHeaders: { none: 'keeps row headers bound to their rows; a reader reads the headers the grid draws' },
  checkboxHeader: { scenarios: ['checkbox-header'] },
  collapsibleColumns: { scenarios: ['collapsible-headers'] },
  columnSorting: { scenarios: ['grid-core'] },
  columnSummary: { scenarios: ['column-summary'] },
  comments: { scenarios: ['comment-editor'] },
  contextMenu: { scenarios: ['grid-core'] },
  copyPaste: { none: 'handles clipboard events, which announce nothing by design; its menu items read like every context menu item' },
  customBorders: { none: 'draws borders, a decoration with no role, name or text' },
  dataProvider: { scenarios: ['data-provider-sheets-bar'] },
  dialog: { scenarios: ['dialog', 'loading'] },
  dragToScroll: { none: 'scrolls the grid while a pointer drags and draws nothing a reader meets' },
  dropdownMenu: { scenarios: ['dropdown-menu', 'filters-by-value', 'filters-by-condition'] },
  emptyDataState: { scenarios: ['empty-data', 'data-provider-sheets-bar'] },
  exportFile: { none: 'writes data to a file and draws nothing a reader meets' },
  filters: { scenarios: ['filters-by-value', 'filters-by-condition'] },
  formulaBuilder: { scenarios: ['formula-builder'] },
  formulas: { gap: 'a cell showing a formula result reads like a typed value (a known limitation), and no scenario reads one' },
  freezeBar: { scenarios: ['freeze-bar'] },
  hiddenColumns: { gap: 'the column positions a reader announces around a hidden column are read by no scenario' },
  hiddenRows: { gap: 'the row positions a reader announces around a hidden row are read by no scenario' },
  importFile: { none: 'reads data from a file and draws nothing a reader meets' },
  loading: { scenarios: ['loading'] },
  manualColumnFreeze: { none: 'adds freeze items to the context menu, which read like every menu item, and moves columns; draws nothing of its own' },
  manualColumnMove: { none: 'draws a guide and a ghost only while a pointer drags a column' },
  manualColumnResize: { none: 'draws a resize handle on header hover and a guide only while a pointer drags' },
  manualRowMove: { none: 'draws a guide and a ghost only while a pointer drags a row' },
  manualRowResize: { none: 'draws a resize handle on header hover and a guide only while a pointer drags' },
  mergeCells: { scenarios: ['merge-cells'] },
  moveCells: { none: 'drags the selection by its border and draws only during the drag' },
  multiColumnSorting: { gap: 'a sort on several columns, and each header\'s sort state, are read by no scenario' },
  multipleSelectionHandles: { gap: 'the phone\'s selection handles are for the mobile readers, whose lanes do not exist yet' },
  nestedHeaders: { scenarios: ['nested-headers'] },
  nestedRows: { scenarios: ['nested-rows'] },
  notification: { scenarios: ['notification', 'data-provider-sheets-bar'] },
  pagination: { scenarios: ['pagination'] },
  rowSelection: { scenarios: ['row-selection', 'row-selection-corner'] },
  search: { none: 'adds a class to matching cells and announces nothing' },
  selectionHandles: { none: 'draws pointer-only handles with no role, name or focus' },
  sheetsBar: { scenarios: ['sheets-bar', 'data-provider-sheets-bar'] },
  stretchColumns: { none: 'computes column widths and draws nothing a reader meets' },
  touchScroll: { none: 'fades the frozen overlays during a touch scroll and draws nothing a reader meets' },
  trimRows: { none: 'removes rows from the data a reader reads; draws nothing of its own' },
  undoRedo: { none: 'keeps the edit history; an undo re-renders the cells a reader reads, and its menu items read like every menu item' },
  viewState: { none: 'reads and restores the sort, filter and column state through an API, and draws nothing' },
  // Editors.
  autocompleteEditor: { scenarios: ['autocomplete-editor'] },
  checkboxEditor: { scenarios: ['checkbox-cell'] },
  dateEditor: { scenarios: ['date-editor'] },
  dropdownEditor: { scenarios: ['dropdown-editor'] },
  handsontableEditor: { scenarios: ['handsontable-editor'] },
  intlDateEditor: { gap: 'the intl-date editor is read by no scenario' },
  intlDatetimeEditor: { gap: 'the intl-datetime editor is read by no scenario' },
  intlTimeEditor: { gap: 'the intl-time editor is read by no scenario' },
  multiSelectEditor: { scenarios: ['multiselect-editor'] },
  numericEditor: { none: 'draws the text editor\'s textarea, which grid-core reads' },
  passwordEditor: { scenarios: ['password-editor'] },
  selectEditor: { scenarios: ['select-editor'] },
  textEditor: { scenarios: ['grid-core'] },
  timeEditor: { gap: 'the time editor is read by no scenario' },
};

/**
 * The number of `gap` entries in both maps. It only goes down: closing a gap lowers it in the same
 * change, and a new gap fails the coverage test until another gap is closed.
 */
export const SR_GAP_LIMIT = 23;
