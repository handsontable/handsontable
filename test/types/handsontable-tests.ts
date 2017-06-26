import Handsontable from '../../handsontable';

var test = Handsontable.plugins.CopyPaste.columnsLimit;
var elem = document.createElement('div');
var hot = new Handsontable(elem, {
  allowEmpty: true,
  allowHtml: true,
  allowInsertColumn: true,
  allowInsertRow: true,
  allowInvalid: true,
  allowRemoveColumn: true,
  allowRemoveRow: true,
  autoColumnSize: true,
  autoComplete: [],
  autoRowSize: true,
  autoWrapCol: true,
  autoWrapRow: true,
  bindRowsWithHeaders: 'foo',
  cell: [],
  cells: function() {
    return {};
  },
  checkedTemplate: true,
  className: [],
  colHeaders: true,
  collapsibleColumns: true,
  columnHeaderHeight: 123,
  columns: [],
  columnSorting: {},
  columnSummary: {},
  colWidths: 123,
  commentedCellClassName: 'foo',
  comments: [],
  contextMenu: true,
  contextMenuCopyPaste: {},
  copyable: true,
  copyColsLimit: 123,
  copyPaste: true,
  copyRowsLimit: 123,
  correctFormat: true,
  currentColClassName: 'foo',
  currentHeaderClassName: 'foo',
  currentRowClassName: 'foo',
  customBorders: true,
  data: [],
  dataSchema: {},
  dateFormat: 'foo',
  debug: true,
  defaultDate: 'foo',
  disableVisualSelection: true,
  dropdownMenu: [],
  editor: true,
  enterBeginsEditing: true,
  enterMoves: {},
  fillHandle: true,
  filter: true,
  filteringCaseSensitive: true,
  filters: false,
  fixedColumnsLeft: 123,
  fixedRowsBottom: 123,
  fixedRowsTop: 123,
  format: 'foo',
  fragmentSelection: true,
  ganttChart: {},
  headerTooltips: true,
  height: 123,
  hiddenColumns: true,
  hiddenRows: {},
  invalidCellClassName: 'foo',
  isEmptyCol: (col) => { return true; },
  isEmptyRow: (row) => { return true; },
  label: {},
  language: 'foo',
  manualColumnFreeze: true,
  manualColumnMove: true,
  manualColumnResize: true,
  manualRowMove: true,
  manualRowResize: true,
  maxCols: 123,
  maxRows: 123,
  mergeCells: true,
  minCols: 123,
  minRows: 123,
  minSpareCols: 123,
  minSpareRows: 123,
  multiSelect: true,
  nestedHeaders: [],
  noWordWrapClassName: 'foo',
  observeChanges: true,
  observeDOMVisibility: true,
  outsideClickDeselects: true,
  pasteMode: 'foo',
  persistentState: true,
  placeholder: 123,
  placeholderCellClassName: 'foo',
  preventOverflow: true,
  readOnly: true,
  readOnlyCellClassName: 'foo',
  renderAllRows: true,
  renderer: 'foo',
  rowHeaders: true,
  rowHeaderWidth: 123,
  rowHeights: 123,
  search: true,
  selectOptions: [],
  skipColumnOnPaste: true,
  sortByRelevance: true,
  sortFunction: function() {},
  sortIndicator: true,
  source: [],
  startCols: 123,
  startRows: 123,
  stretchH: 'foo',
  strict: true,
  tableClassName: 'foo',
  tabMoves: {},
  title: 'foo',
  trimDropdown: true,
  trimRows: true,
  trimWhitespace: true,
  type: 'foo',
  uncheckedTemplate: true,
  undo: true,
  validator: function() {},
  viewportColumnRenderingOffset: 123,
  viewportRowRenderingOffset: 123,
  visibleRows: 123,
  width: 1232,
  wordWrap: true,

  // Hooks
  afterAddChild: (parent, element, index) => {},
  afterBeginEdting: (row, column) => {},
  afterCellMetaReset: () => {},
  afterChange: (changes, source) => {},
  afterChangesObserved: () => {},
  afterColumnMove: (startColumn, endColumn) => {},
  afterColumnResize: (currentColumn, newSize, isDoubleClick) => {},
  afterColumnSort: (column, order) => {},
  afterContextMenuDefaultOptions: (predefinedItems) => {},
  afterContextMenuHide: (context) => {},
  afterContextMenuShow: (context) => {},
  afterCopy: (data, coords) => {},
  afterCopyLimit: (selectedRows, selectedColumnds, copyRowsLimit, copyColumnsLimit) => {},
  afterCreateCol: (index, amount) => {},
  afterCreateRow: (index, amount) => {},
  afterCut: (data, coords) => {},
  afterDeselect: () => {},
  afterDestroy: () => {},
  afterDetachChild: (parent, element) => {},
  afterDocumentKeyDown: (event) => {},
  afterDropdownMenuDefaultOptions: (predefinedItems) => {},
  afterDropdownMenuHide: (instance) => {},
  afterDropdownMenuShow: (instance) => {},
  afterFilter: (formulasStack) => {},
  afterGetCellMeta: (row, col, cellProperties) => {},
  afterGetColHeader: (col, TH) => {},
  afterGetColumnHeaderRenderers: (array) => {},
  afterGetRowHeader: (row, TH) => {},
  afterGetRowHeaderRenderers: (array) => {},
  afterInit: () => {},
  afterLoadData: (firstTime) => {},
  afterModifyTransformEnd: (coords, rowTransformDir, colTransformDir) => {},
  afterModifyTransformStart: (coords, rowTransformDir, colTransformDir) => {},
  afterMomentumScroll: () => {},
  afterOnCellCornerDblClick: (event) => {},
  afterOnCellCornerMouseDown: (event) => {},
  afterOnCellMouseDown: (event, coords, TD) => {},
  afterOnCellMouseOver: (event, coords, TD) => {},
  afterOnCellMouseOut: (event, coords, TD) => {},
  afterPaste: (data, coords) => {},
  afterPluginsInitialized: () => {},
  afterRedo: (action) => {},
  afterRemoveCol: (index, amount) => {},
  afterRemoveRow: (index, amount) => {},
  afterRender: (isForced) => {},
  afterRenderer: (TD, row, col, prop, value, cellProperties) => {},
  afterRowMove: (startRow, endRow) => {},
  afterRowResize: (currentRow, newSize, isDoubleClick) => {},
  afterScrollHorizontally: () => {},
  afterScrollVertically: () => {},
  afterSelection: (r, c, r2, c2) => {},
  afterSelectionByProp: (r, p, r2, p2) => {},
  afterSelectionEnd: (r, c, r2, c2) => {},
  afterSelectionEndByProp: (r, p, r2, p2) => {},
  afterSetCellMeta: (row, col, key, value) => {},
  afterSetDataAtCell: (changes, source) => {},
  afterSetDataAtRowProp: (changes, source) => {},
  afterTrimRow: (rows) => {},
  afterUndo: (action) => {},
  afterUntrimRow: (rows) => {},
  afterUpdateSettings: () => {},
  afterValidate: () => {},
  afterViewportColumnCalculatorOverride: (calc) => {},
  afterViewportRowCalculatorOverride: (calc) => {},
  beforeAddChild: (parent, element, index) => {},
  beforeAutofill: (start, end, data) => {},
  beforeAutofillInsidePopulate: (index, direction, input, deltas) => {},
  beforeCellAlignment: (stateBefore, range, type, alignmentClass) => {},
  beforeChange: (changes, source) => {},
  beforeChangeRender: (changes, source) => {},
  beforeColumnMove: (startColumn, endColumn) => {},
  beforeColumnResize: (currentColumn, newSize, isDoubleClick) => {},
  beforeColumnSort: (column, order) => {},
  beforeContextMenuSetItems: (menuItems) => {},
  beforeCopy: (data, coords) => {},
  beforeCreateCol: (index, amount, source) => {},
  beforeCreateRow: (index, amount, source) => {},
  beforeCut: (data, coords) => {},
  beforeDetachChild: (parent, element) => {},
  beforeDrawBorders: (corners, borderClassName) => {},
  beforeFilter: (formulasStack) => {},
  beforeGetCellMeta: (row, col, cellProperties) => {},
  beforeInit: () => {},
  beforeInitWalkontable: (walkontableConfig) => {},
  beforeKeyDown: (event) => {},
  beforeOnCellMouseDown: () => {},
  beforeOnCellMouseOut: (event, coords, TD) => {},
  beforeOnCellMouseOver: (event, coords, TD, blockCalculations) => {},
  beforePaste: (data, coords) => {},
  beforeRedo: (action) => {},
  beforeRemoveCol: (index, amount, logicalCols = [1, 2, 3]) => {},
  beforeRemoveRow: (index, amount, logicalCols = [1, 2, 3]) => {},
  beforeRender: (isForced, skipRender) => {},
  beforeRenderer: (TD, row, col, prop, value, cellProperties) => {},
  beforeRowMove: (startRow, endRow) => {},
  beforeRowResize: (currentRow, newSize, isDoubleClick) => {},
  beforeSetRangeEnd: (coords) => {},
  beforeSetRangeStart: (coords) => {},
  beforeStretchingColumnWidth: (stretchedWidth, column) => {},
  beforeTouchScroll: () => {},
  beforeUndo: (action) => {},
  beforeValidate: (value, row, prop, source = 'source') => {},
  beforeValueRender: (value) => {},
  construct: () => {},
  hiddenColumn: (column) => {},
  hiddenRow: (row) => {},
  init: () => {},
  manualRowHeights: (state) => {},
  modifyAutofillRange: (startArea, entireArea) => {},
  modifyCol: (col) => {},
  modifyColHeader: (column) => {},
  modifyColWidth: (width) => {},
  modifyCopyableRange: (copyableRanges) => {},
  modifyRow: (row) => {},
  modifyRowHeader: (row) => {},
  modifyRowHeight: (height, row) => {},
  modifyRowSourceData: (row) => {},
  modifyTransformEnd: (delta) => {},
  modifyTransformStart: (delta) => {},
  persistentStateLoad: () => {},
  persistentStateReset: () => {},
  persistentStateSave: () => {},
  skipLengthCache: (delay) => {},
  unmodifyCol: () => {},
  unmodifyRow: (row) => {},
});

function test_HandsontableMethods() {
  var elem = document.createElement('div');
  var hot = new Handsontable(elem, {});
  hot.addHook('foo', []);
  hot.addHookOnce('foo', []);
  hot.alter('foo', 123, 123, 'foo', true);
  hot.clear();
  hot.colOffset();
  hot.colToProp(123);
  hot.countCols();
  hot.countEmptyCols(true);
  hot.countEmptyRows(true);
  hot.countRenderedCols();
  hot.countRenderedRows();
  hot.countRows();
  hot.countSourceRows();
  hot.countVisibleCols();
  hot.countVisibleRows();
  hot.deselectCell();
  hot.destroy();
  hot.destroyEditor(true);
  hot.getActiveEditor();
  hot.getCell(123, 123, true);
  hot.getCellEditor(123, 123);
  hot.getCellMeta(123, 123);
  hot.getCellRenderer(123, 123);
  hot.getCellValidator(123, 123);
  hot.getColHeader(123);
  hot.getColWidth(123);
  hot.getCoords(elem.querySelector('td'));
  hot.getCopyableData(123, 123);
  hot.getCopyableText(123, 123, 123, 123);
  hot.getData(123, 123, 123, 123);
  hot.getDataAtCell(123, 123);
  hot.getDataAtCol(123);
  hot.getDataAtProp(123);
  hot.getDataAtRow(123);
  hot.getDataAtRowProp(123, 'foo');
  hot.getDataType(123, 123, 123, 123);
  hot.getInstance();
  hot.getPlugin('foo');
  hot.getRowHeader(123);
  hot.getRowHeight(123);
  hot.getSchema();
  hot.getSelected();
  hot.getSelectedRange();
  hot.getSettings();
  hot.getSourceData(123, 123, 123, 123);
  hot.getSourceDataAtCell(123, 123);
  hot.getSourceDataAtCol(123);
  hot.getSourceDataAtRow(123);
  hot.getValue();
  hot.hasColHeaders();
  hot.hasHook('foo');
  hot.hasRowHeaders();
  hot.isEmptyCol(123);
  hot.isEmptyRow(123);
  hot.isListening();
  hot.listen();
  hot.loadData([]);
  hot.populateFromArray(123, 123, [], 123, 123, 'foo', 'foo', 'foo', []);
  hot.propToCol('foo');
  hot.propToCol(123);
  hot.removeCellMeta(123, 123, 'foo');
  hot.removeHook('foo', function() {});
  hot.render();
  hot.rowOffset();
  hot.runHooks('foo', 123, 'foo', true, {}, [], function() {});
  hot.selectCell(123, 123, 123, 123, true, true);
  hot.selectCellByProp(123, 'foo', 123, 'foo', true);
  hot.setCellMeta(123, 123, 'foo', 'foo');
  hot.setCellMetaObject(123, 123, {});
  hot.setDataAtCell(123, 123, 'foo', 'foo');
  hot.setDataAtRowProp(123, 'foo', 'foo', 'foo');
  hot.spliceCol(123, 123, 123, 'foo');
  hot.spliceRow(123, 123, 123, 'foo');
  hot.unlisten();
  hot.updateSettings({}, true);
  hot.validateCells(function() {});

  let baseVersion = Handsontable.baseVersion;
  let buildDate = Handsontable.buildDate;
  let version = Handsontable.version;

  let gridSettingsObj = {
    valid: true,
    className: 'foo'
  };

  Handsontable.renderers.AutocompleteRenderer(hot, new HTMLTableDataCellElement(), 0, 0, "prop", 1.235, gridSettingsObj);
  Handsontable.renderers.BaseRenderer(hot, new HTMLTableDataCellElement(), 0, 0, "prop", 1.235, gridSettingsObj);
  Handsontable.renderers.CheckboxRenderer(hot, new HTMLTableDataCellElement(), 0, 0, "prop", 1.235, gridSettingsObj);
  Handsontable.renderers.HtmlRenderer(hot, new HTMLTableDataCellElement(), 0, 0, "prop", 1.235, gridSettingsObj);
  Handsontable.renderers.NumericRenderer(hot, new HTMLTableDataCellElement(), 0, 0, "prop", 1.235, gridSettingsObj);
  Handsontable.renderers.PasswordRenderer(hot, new HTMLTableDataCellElement(), 0, 0, "prop", 1.235, gridSettingsObj);
  Handsontable.renderers.TextRenderer(hot, new HTMLTableDataCellElement(), 0, 0, "prop", 1.235, gridSettingsObj);

  let domElement = new HTMLElement();
  let domEvent = new Event('foo');

  Handsontable.dom.addEvent(domElement, "eventName", () => {});
  let htmlCharacters = Handsontable.dom.HTML_CHARACTERS;
  Handsontable.dom.addClass(domElement, ['foo', 'bar']);
  Handsontable.dom.addEvent(domElement, 'foo', () => {});
  Handsontable.dom.closest(domElement, ['foo'], domElement);
  Handsontable.dom.closestDown(domElement, ['foo', 'bar'], domElement);
  Handsontable.dom.empty(domElement);
  Handsontable.dom.fastInnerHTML(domElement, 'foo');
  Handsontable.dom.fastInnerText(domElement, 'foo');
  Handsontable.dom.getCaretPosition(domElement);
  Handsontable.dom.getComputedStyle(domElement);
  Handsontable.dom.getCssTransform(domElement);
  Handsontable.dom.getParent(domElement, 1);
  Handsontable.dom.getScrollLeft(domElement);
  Handsontable.dom.getScrollTop(domElement);
  Handsontable.dom.getScrollableElement(domElement);
  Handsontable.dom.getScrollbarWidth();
  Handsontable.dom.getSelectionEndPosition(domElement);
  Handsontable.dom.getSelectionText();
  Handsontable.dom.getStyle(domElement, 'foo');
  Handsontable.dom.getTrimmingContainer(domElement);
  Handsontable.dom.getWindowScrollLeft();
  Handsontable.dom.getWindowScrollTop();
  Handsontable.dom.hasClass(domElement, 'foo');
  Handsontable.dom.hasHorizontalScrollbar(domElement);
  Handsontable.dom.hasVerticalScrollbar(domElement);
  Handsontable.dom.index(domElement);
  Handsontable.dom.innerHeight(domElement);
  Handsontable.dom.innerWidth(domElement);
  Handsontable.dom.isChildOf(domElement, 'foo');
  Handsontable.dom.isChildOfWebComponentTable(domElement);
  Handsontable.dom.isImmediatePropagationStopped(domEvent);
  Handsontable.dom.isInput(domElement);
  Handsontable.dom.isLeftClick(domEvent);
  Handsontable.dom.isOutsideInput(domElement);
  Handsontable.dom.isRightClick(domEvent);
  Handsontable.dom.isVisible(domElement);
  Handsontable.dom.offset(domElement);
  Handsontable.dom.outerHeight(domElement);
  Handsontable.dom.outerWidth(domElement);
  Handsontable.dom.overlayContainsElement('foo', domElement);
  Handsontable.dom.pageX(domEvent);
  Handsontable.dom.pageY(domEvent);
  Handsontable.dom.polymerUnwrap(domElement);
  Handsontable.dom.polymerWrap(domElement);
  Handsontable.dom.removeClass(domElement, ['foo', 'bar']);
  Handsontable.dom.removeEvent(domElement, 'foo', () => {});
  Handsontable.dom.removeTextNodes(domElement, domElement);
  Handsontable.dom.resetCssTransform(domElement);
  Handsontable.dom.setCaretPosition(domElement, 0, 0);
  Handsontable.dom.setOverlayPosition(domElement, 0, 0);
  Handsontable.dom.stopImmediatePropagation(domEvent);
  Handsontable.dom.stopPropagation(domEvent);

  Handsontable.helper.arrayAvg([1, 3, 4]);
  Handsontable.helper.arrayEach([1, 2, 3], (value, index, array) => {});
  Handsontable.helper.arrayFilter([1, 'foo', true], (value, index, array) => {});
  Handsontable.helper.arrayFlatten([1, 'foo', true]);
  Handsontable.helper.arrayIncludes([1, 'foo', true], 'foo', 1);
  Handsontable.helper.arrayMap([1, 'foo', true], (value, index, array) => {});
  Handsontable.helper.arrayMax([1, 'foo', true]);
  Handsontable.helper.arrayMin([1, 'foo', true]);
  Handsontable.helper.arrayReduce([1, 'foo', true], (value, index, array) => {}, 'foo', false);
  Handsontable.helper.arraySum([1, 'foo', true]);
  Handsontable.helper.arrayUnique([1, 'foo', true]);
  Handsontable.helper.cancelAnimationFrame(1);
  Handsontable.helper.cellMethodLookupFactory('foo', true);
  Handsontable.helper.clone({key: 'foo'});
  Handsontable.helper.columnFactory(gridSettingsObj, [1, 'foo', true]);
  Handsontable.helper.createEmptySpreadsheetData(0, 0);
  Handsontable.helper.createObjectPropListener('foo', 'bar');
  Handsontable.helper.createSpreadsheetData(0, 0);
  Handsontable.helper.createSpreadsheetObjectData(0, 0);
  Handsontable.helper.curry(() => {});
  Handsontable.helper.curryRight(() => {});
  Handsontable.helper.debounce(() => {}, 1);
  Handsontable.helper.deepClone({key: 'foo'});
  Handsontable.helper.deepExtend({key: 'foo'}, {key2: 'foo'});
  Handsontable.helper.deepObjectSize({key: 'foo'});
  Handsontable.helper.defineGetter({key: 'foo'}, 'key', 'bar', {});
  Handsontable.helper.duckSchema({});
  Handsontable.helper.endsWith('foo', 'bar');
  Handsontable.helper.equalsIgnoreCase('foo', 'bar');
  Handsontable.helper.extend({key: 'foo'}, {key2: 'foo'});
  Handsontable.helper.extendArray([1, 'foo'], [true]);
  Handsontable.helper.getComparisonFunction('en', {});
  Handsontable.helper.getNormalizedDate('YYYY-mm-dd');
  Handsontable.helper.getProperty({key: 'foo'}, 'key');
  Handsontable.helper.getPrototypeOf({key: 'foo'});
  Handsontable.helper.hasCaptionProblem();
  Handsontable.helper.inherit({key: 'foo'}, {key2: 'bar'});
  Handsontable.helper.isChrome();
  Handsontable.helper.isCtrlKey(1);
  Handsontable.helper.isDefined(1);
  Handsontable.helper.isEmpty(1);
  Handsontable.helper.isFunction(1);
  Handsontable.helper.isIE8();
  Handsontable.helper.isIE9();
  Handsontable.helper.isKey(1, 'foo');
  Handsontable.helper.isMetaKey(1);
  Handsontable.helper.isMobileBrowser('foo');
  Handsontable.helper.isNumeric(true);
  Handsontable.helper.isObject('foo');
  Handsontable.helper.isObjectEquals([1, 2, 3], {});
  Handsontable.helper.isPercentValue('1');
  Handsontable.helper.isPrintableChar(1);
  Handsontable.helper.isSafari();
  Handsontable.helper.isTouchSupported();
  Handsontable.helper.isUndefined(null);
  Handsontable.helper.isWebComponentSupportedNatively();
  Handsontable.helper.mixin({}, {key: 'foo'}, {key2: 'bar'});
  Handsontable.helper.objectEach({key: 'foo'}, (value, key, object) => {});
  Handsontable.helper.padStart('foo', 1, 'bar');
  Handsontable.helper.partial(() => {}, 1, 'foo', true);
  Handsontable.helper.pipe(() => {}, () => {});
  Handsontable.helper.pivot([1, 'foo', true]);
  Handsontable.helper.randomString();
  Handsontable.helper.rangeEach(0, 0, (index) => {});
  Handsontable.helper.rangeEachReverse(0, 0, (index) => {});
  Handsontable.helper.requestAnimationFrame(() => {});
  Handsontable.helper.spreadsheetColumnIndex('foo');
  Handsontable.helper.spreadsheetColumnLabel(1);
  Handsontable.helper.startsWith('foo', 'bar');
  Handsontable.helper.stringify(1);
  Handsontable.helper.stripTags('<a>foo</a>');
  Handsontable.helper.substitute('foo', {});
  Handsontable.helper.throttle(() => {}, 1);
  Handsontable.helper.throttleAfterHits(() => {}, 0, 1);
  Handsontable.helper.to2dArray([1, 'foo', true]);
  Handsontable.helper.toUpperCaseFirst('foo');
  Handsontable.helper.translateRowsToColumns([1, 'foo', true]);
  Handsontable.helper.valueAccordingPercent(1, 90);
}
