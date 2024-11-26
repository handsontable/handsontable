import Handsontable from 'handsontable';
import HyperFormula from 'hyperformula';

// Helpers to verify multiple different settings and prevent TS control-flow from eliminating unreachable values
declare function oneOf<T extends Array<string | number | boolean | undefined | null | object>>(...args: T): T[number];
declare const true_or_false: true | false;

// Enums prevent type widening of literals -- for use with objects inside oneOf(), not required by users
// This can be replaced once `as const` context is shipped: https://github.com/Microsoft/TypeScript/pull/29510
enum DisableVisualSelection { current = 'current', area = 'area', header = 'header' }

const legacyNumericFormat: Handsontable.NumericFormatOptions = {
  pattern: '0.00',
  culture: 'en-US',
};
const numericFormatOptions: Handsontable.NumericFormatOptions = {
  pattern: {
    prefix: '2',
    postfix: '3',
    characteristic: 5,
    forceAverage: oneOf('trillion', 'billion', 'million', 'thousand'),
    average: true,
    currencyPosition: oneOf('prefix', 'infix', 'postfix'),
    currencySymbol: '€',
    totalLength: 4,
    mantissa: 5,
    optionalMantissa: true,
    trimMantissa: true,
    optionalCharacteristic: true,
    thousandSeparated: true,
    abbreviations: {
      thousand: '.',
      million: '.',
      billion: '.',
      trillion: '.',
    },
    negative: oneOf('sign', 'parenthesis'),
    forceSign: true,
    spaceSeparated: true,
    spaceSeparatedCurrency: true,
    spaceSeparatedAbbreviation: true,
    exponential: true,
    prefixSymbol: true,
    lowPrecision: true,
    roundingFunction: () => 2,
    output: oneOf('currency', 'percent', 'byte', 'time', 'ordinal', 'number'),
    base: oneOf('decimal', 'binary', 'general'),
  },
  culture: 'en-US'
};

// Use `Required<GridSettings>` to ensure every defined setting is covered here.
const allSettings: Required<Handsontable.GridSettings> = {
  activeHeaderClassName: 'foo',
  allowEmpty: true,
  allowHtml: true,
  allowInsertColumn: true,
  allowInsertRow: true,
  allowInvalid: true,
  allowRemoveColumn: true,
  allowRemoveRow: true,
  ariaTags: true,
  autoColumnSize:  true,
  autoRowSize: true,
  autoWrapCol: true,
  autoWrapRow: true,
  bindRowsWithHeaders: true,
  cell: [
    {
      row: 0,
      col: 0,
      readOnly: true
    }
  ],
  cells(row, column, prop) {
    const cellProperties: Handsontable.CellMeta = {};
    const visualRowIndex = this.instance.toVisualRow(row);
    const visualColIndex = this.instance.toVisualColumn(column);

    if (visualRowIndex === 0 && visualColIndex === 0) {
      cellProperties.readOnly = true;
    }

    return cellProperties;
  },
  checkedTemplate: oneOf(true, 123, 'foo'),
  className: oneOf('foo', ['foo']),
  colHeaders: oneOf(true, ['first-class-name', 'second-class-name']),
  collapsibleColumns: true,
  columnHeaderHeight: oneOf(35, [35, undefined, 55]),
  columns: [
    { type: 'numeric', numericFormat: { pattern: '0,0.00 $' } },
    { type: 'text', readOnly: true }
  ],
  columnSorting: true,
  columnSummary: [],
  colWidths: oneOf(100, '100px', [100, '100px'], ((index: number) => oneOf('100px', 100, undefined))),
  commentedCellClassName: 'foo',
  comments: true,
  contextMenu: true,
  copyable: true,
  copyPaste: true,
  correctFormat: true,
  currentColClassName: 'foo',
  currentHeaderClassName: 'foo',
  currentRowClassName: 'foo',
  customBorders: true,
  data: oneOf([{}, {}, {}], [[], [], []]),
  dataDotNotation: oneOf(true),
  dataSchema: oneOf({}, [[]], (index: number) => oneOf([index], { index })),
  dateFormat: 'foo',
  datePickerConfig: {
    firstDay: 0,
    showWeekNumber: true,
    numberOfMonths: 3,
    disableDayFn(date) {
      return date.getDay() === 0 || date.getDay() === 6;
    }
  },
  defaultDate: 'foo',
  tabNavigation: oneOf(false),
  disableVisualSelection: oneOf(
    true,
    'current',
    'area',
    'header',
    [DisableVisualSelection.current, DisableVisualSelection.area, DisableVisualSelection.header]
  ),
  dragToScroll: false,
  dropdownMenu: true,
  editor: oneOf(true, 'autocomplete', 'checkbox', 'date', 'dropdown', 'handsontable', 'mobile',
  'password', 'select', 'text', 'time', 'custom.editor'),
  enterBeginsEditing: true,
  enterMoves: oneOf({ col: 1, row: 1 }, (event: KeyboardEvent) => ({row: 1, col: 1})),
  fillHandle: true,
  filter: true,
  filteringCaseSensitive: true,
  filters: false,
  fixedColumnsLeft: 123,
  fixedColumnsStart: 123,
  fixedRowsBottom: 123,
  fixedRowsTop: 123,
  formulas: {
    engine: HyperFormula,
  },
  fragmentSelection: oneOf(true, 'cell'),
  headerClassName: 'htCenter test',
  height: oneOf(500, () => 500),
  hiddenColumns: true,
  hiddenRows: true,
  invalidCellClassName: 'foo',
  imeFastEdit: true,
  isEmptyCol: (col) => col === 0,
  isEmptyRow: (row) => row === 0,
  label: {property: 'name.last', position: 'after', value: oneOf('My label: ', () => 'My label')},
  language: 'foo',
  layoutDirection: oneOf('rtl', 'ltr', 'inherit'),
  licenseKey: '',
  locale: 'pl-PL',
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
  navigableHeaders: true,
  multiColumnSorting: true,
  nestedHeaders: [],
  nestedRows: true,
  noWordWrapClassName: 'foo',
  numericFormat: oneOf(legacyNumericFormat, numericFormatOptions),
  observeDOMVisibility: true,
  outsideClickDeselects: oneOf(true, (target: HTMLElement) => false),
  persistentState: true,
  placeholder: 'foo',
  placeholderCellClassName: 'foo',
  preventOverflow: oneOf(true, 'vertical', 'horizontal'),
  preventWheel: true,
  readOnly: true,
  readOnlyCellClassName: 'foo',
  renderAllColumns: true,
  renderAllRows: true,
  renderer: oneOf(
    'autocomplete', 'checkbox', 'html', 'numeric', 'password', 'text', 'time', 'custom.renderer',
    (instance: Handsontable, TD: HTMLTableCellElement, row: number, col: number,
      prop: number | string, value: any, cellProperties: Handsontable.CellProperties) => TD
  ),
  rowHeaders: oneOf(true, ['1', '2', '3'], (index: number) => `Row ${index}`),
  rowHeaderWidth: oneOf(25, [25, 30, 55]),
  rowHeights: oneOf(100, '100px', [100, 120, 90], (index: number) => index * 10),
  search: true,
  selectionMode: oneOf('single', 'range', 'multiple'),
  selectOptions: oneOf(
    ['A', 'B', 'C'],
    { a: 'A', b: 'B', c: 'C'},
    (visualRow: number, visualColumn: number, prop: string | number) => ['A', 'B', 'C'],
    (visualRow: number, visualColumn: number, prop: string | number) => ({ a: 'A', b: 'B', c: 'C'}),
  ),
  skipColumnOnPaste: true,
  skipRowOnPaste: true,
  sortByRelevance: true,
  source: oneOf(
    ['A', 'B', 'C', 'D'],
    (query: string, callback: (item: string[]) => void) => callback(['A', 'B', 'C', 'D'])
  ),
  startCols: 123,
  startRows: 123,
  stretchH: 'none',
  strict: true,
  tableClassName: oneOf('foo', ['first-class-name', 'second-class-name']),
  tabMoves: oneOf({ col: 1, row: 1 }, (event: KeyboardEvent) => ({row: 2, col: 2})),
  themeName: 'ht-theme-some-theme',
  title: 'foo',
  trimDropdown: true,
  trimRows: true,
  trimWhitespace: true,
  type: oneOf('autocomplete', 'checkbox', 'date', 'dropdown', 'handsontable', 'numeric', 'password',
    'text', 'time', 'custom.cell.type'),
  uncheckedTemplate: oneOf(true, 'foo', 123),
  undo: true,
  validator: oneOf(
    (value: any, callback: (valid: boolean) => void) => callback(true),
    /^[0-9]$/,
    'autocomplete', 'date', 'numeric', 'time', 'custom.validator'
  ),
  viewportColumnRenderingOffset: oneOf(100, 'auto'),
  viewportRowRenderingOffset: oneOf(100, 'auto'),
  viewportColumnRenderingThreshold: oneOf(100, 'auto'),
  viewportRowRenderingThreshold: oneOf(100, 'auto'),
  visibleRows: 123,
  width: oneOf(500, () => 500),
  wordWrap: true,

  // Hooks via settings object
  afterAddChild: (parent, element, index) => {},
  afterAutofill: (start, end, data) => {},
  afterBeginEditing: (row, column) => {},
  afterCellMetaReset: () => {},
  afterChange: (changes, source) => {
    if (changes !== null) {
      changes.forEach(change => change[0].toFixed());
    }

    switch (source) {
      case 'auto':
      case 'edit':
      case 'loadData':
      case 'updateData':
      case 'populateFromArray':
      case 'spliceCol':
      case 'spliceRow':
      case 'timeValidate':
      case 'dateValidate':
      case 'validateCells':
      case 'Autofill.fill':
      case 'ContextMenu.clearColumn':
      case 'ContextMenu.columnLeft':
      case 'ContextMenu.columnRight':
      case 'ContextMenu.removeColumn':
      case 'ContextMenu.removeRow':
      case 'ContextMenu.rowAbove':
      case 'ContextMenu.rowBelow':
      case 'CopyPaste.paste':
      case 'UndoRedo.redo':
      case 'UndoRedo.undo':
      case 'ColumnSummary.set':
      case 'ColumnSummary.reset':
        break;
    }
  },
  afterChangesObserved: () => {},
  afterColumnCollapse: (currentCollapsedColumn, destinationCollapsedColumns, collapsePossible,
    successfullyCollapsed) => {},
  afterColumnExpand: (currentCollapsedColumn, destinationCollapsedColumns, expandPossible,
    successfullyExpanded) => {},
  afterColumnFreeze: (columnIndex, isFreezingPerformed) => {},
  afterColumnMove: (columns, target) => {},
  afterColumnResize: (newSize, column, isDoubleClick) => {},
  afterColumnSequenceChange: (source) => {},
  afterColumnSort: (currentSortConfig, destinationSortConfigs) => {},
  afterColumnUnfreeze: (columnIndex, isFreezingPerformed) => {},
  afterContextMenuDefaultOptions: (predefinedItems) => {},
  afterContextMenuHide: (context) => {},
  afterContextMenuShow: (context) => {},
  afterCopy: (data, coords) => {},
  afterCopyLimit: (selectedRows, selectedColumns, copyRowsLimit, copyColumnsLimit) => {},
  afterCreateCol: (index, amount, source) => {},
  afterCreateRow: (index, amount, source) => {},
  afterCut: (data, coords) => {},
  afterDeselect: () => {},
  afterDestroy: () => {},
  afterDetachChild: (parent, element) => {},
  afterDocumentKeyDown: (event) => {},
  afterDrawSelection: (currentRow, currentColumn, cornersOfSelection, layerLevel) => {
    const _currentRow: number = currentRow;
    const _currentColumn: number = currentColumn;
    const _cornersOfSelection: number[] = cornersOfSelection;
    const _layerLevel: number | undefined = layerLevel;
  },
  afterDropdownMenuDefaultOptions: (predefinedItems) => {},
  afterDropdownMenuHide: (instance) => {},
  afterDropdownMenuShow: (instance) => {},
  afterFilter: (conditionsStack) => conditionsStack[0].column,
  afterFormulasValuesUpdate: (changes) => {},
  afterGetCellMeta: (row, col, cellProperties) => {},
  afterGetColHeader: (col, TH, headerLevel) => {},
  afterGetColumnHeaderRenderers: (array) => {},
  afterGetRowHeader: (row, TH) => {},
  afterGetRowHeaderRenderers: (array) => {},
  afterHideColumns: (currentHideConfig, destinationHideConfig, actionPossible, stateChanged) => {},
  afterHideRows: (currentHideConfig, destinationHideConfig, actionPossible, stateChanged) => {},
  afterInit: () => {},
  afterLanguageChange: (languageCode) => {},
  afterListen: () => {},
  afterLoadData: (sourceData, firstTime, source) => {},
  afterMergeCells: (cellRange, mergeParent, auto) => {},
  modifySourceData: (row, col, valueHolder, ioMode) => {},
  afterModifyTransformEnd: (coords, rowTransformDir, colTransformDir) => {
    const row: number = coords.row;
    const col: number = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterModifyTransformFocus: (coords, rowTransformDir, colTransformDir) => {
    const row: number = coords.row;
    const col: number = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterModifyTransformStart: (coords, rowTransformDir, colTransformDir) => {
    const row: number = coords.row;
    const col: number = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterMomentumScroll: () => {},
  afterNamedExpressionAdded: (namedExpressionName, changes) => {},
  afterNamedExpressionRemoved: (namedExpressionName, changes) => {},
  afterOnCellContextMenu: (event, coords, TD) => {},
  afterOnCellCornerDblClick: (event) => {},
  afterOnCellCornerMouseDown: (event) => {},
  afterOnCellMouseDown: (event, coords, TD) => {},
  afterOnCellMouseOver: (event, coords, TD) => {},
  afterOnCellMouseOut: (event, coords, TD) => {},
  afterOnCellMouseUp: (event, coords, TD) => {},
  afterPaste: (data, coords) => {},
  afterPluginsInitialized: () => {},
  afterRedo: (action) => {},
  afterRedoStackChange: (undoneActionsBefore, undoneActionsAfter) => {},
  afterRefreshDimensions: (previousDimensions, currentDimensions, stateChanged) => {},
  afterRemoveCellMeta: (row, column, key, value) => {},
  afterRemoveCol: (index, amount, physicalColumns = [1, 2, 3], source) => {},
  afterRemoveRow: (index, amount, physicalRows = [1, 2, 3], source) => {},
  afterRender: (isForced) => {},
  afterRenderer: (TD, row, col, prop, value, cellProperties) => {},
  afterRowMove: (movedRows, finalIndex, dropIndex, movePossible,
    orderChanged) => movedRows.forEach(row => row.toFixed(1) === finalIndex.toFixed(1)),
  afterRowResize: (newSize, row, isDoubleClick) => {},
  afterRowSequenceChange: (source) => {},
  afterScrollHorizontally: () => {},
  afterScrollVertically: () => {},
  afterScroll: () => {},
  afterSelectColumns: (from, to, highlight) => {},
  afterSelection: (r, c, r2, c2, preventScrolling, selectionLayerLevel) => preventScrolling.value = true,
  afterSelectionByProp: (r, p, r2, p2, preventScrolling, selectionLayerLevel) => preventScrolling.value = true,
  afterSelectionEnd: (r, c, r2, c2, selectionLayerLevel) => {},
  afterSelectionEndByProp: (r, p, r2, p2, selectionLayerLevel) => {},
  afterSelectionFocusSet: (row, column, preventScrolling) => {
    row.toFixed();
    column.toFixed();
    preventScrolling.value = true;
  },
  afterSelectRows: (from, to, highlight) => {},
  afterSetCellMeta: (row, col, key, value) => {},
  afterSetDataAtCell: (changes, source) => {},
  afterSetDataAtRowProp: (changes, source) => {},
  afterSetSourceDataAtCell: (changes, source) => {},
  afterSetTheme: (themeName, firstRun) => {},
  afterSheetAdded: (addedSheetDisplayName) => {},
  afterSheetRemoved: (removedSheetDisplayName, changes) => {},
  afterSheetRenamed: (oldDisplayName, newDisplayName) => {},
  afterTrimRow: (rows) => {},
  afterUndo: (action) => {},
  afterUndoStackChange: (doneActionsBefore, doneActionsAfter) => {},
  afterUnhideColumns: (currentHideConfig, destinationHideConfig, actionPossible, stateChanged) => {},
  afterUnhideRows: (currentHideConfig, destinationHideConfig, actionPossible, stateChanged) => {},
  afterUnlisten: () => {},
  afterUnmergeCells: (cellRange, auto) => {},
  afterUntrimRow: (rows) => {},
  afterUpdateData: (sourceData, firstTime, source) => {},
  afterUpdateSettings: () => {},
  afterValidate: () => {},
  afterViewportColumnCalculatorOverride: (calc) => {},
  afterViewportRowCalculatorOverride: (calc) => {},
  afterViewRender: (isForced) => {},
  beforeAddChild: (parent, element, index) => {},
  beforeAutofill: (start, end, data) => {},
  beforeBeginEditing: (row: number, column: number, initialValue, event, fullEditMode: boolean) => {
    event.preventDefault();

    return true;
  },
  beforeCellAlignment: (stateBefore, range, type, alignmentClass) => {},
  beforeChange: (changes, source) => { if (changes?.[0] !== null) { changes[0][3] = 10; } return false; },
  beforeChangeRender: (changes, source) => {},
  beforeColumnCollapse: (currentCollapsedColumn, destinationCollapsedColumns, collapsePossible) => {},
  beforeColumnExpand: (currentCollapsedColumn, destinationCollapsedColumns, expandPossible) => {},
  beforeColumnFreeze: (columnIndex, isFreezingPerformed) => false,
  beforeColumnMove: (columns, target) => {},
  beforeColumnResize: (newSize, column, isDoubleClick) => {},
  beforeColumnSort: (currentSortConfig, destinationSortConfigs) => {},
  beforeColumnWrap: (isActionInterrupted, newCoords, isColumnFlipped) => {
    const _isActionInterrupted: boolean = isActionInterrupted.value;
    const _isColumnFlipped: boolean = isColumnFlipped;

    isActionInterrupted.value = false;
    newCoords.clone();
  },
  beforeColumnUnfreeze: (columnIndex, isFreezingPerformed) => false,
  beforeContextMenuSetItems: (menuItems) => {},
  beforeContextMenuShow: (context) => {},
  beforeCopy: (data, coords) => { data.splice(0, 1); return false; },
  beforeCreateCol: (index, amount, source) => {},
  beforeCreateRow: (index, amount, source) => {},
  beforeCut: (data, coords) => { data.splice(0, 1); return false; },
  beforeDetachChild: (parent, element) => {},
  beforeDrawBorders: (corners, borderClassName) => {},
  beforeDropdownMenuSetItems: (menuItems) => {},
  beforeDropdownMenuShow: (instance) => {},
  beforeFilter: (conditionsStack, previousConditionStack) => { conditionsStack[0].conditions[0].name === 'begins_with'; },
  beforeGetCellMeta: (row, col, cellProperties) => {},
  beforeHideColumns: (currentHideConfig, destinationHideConfig, actionPossible) => {},
  beforeHideRows: (currentHideConfig, destinationHideConfig, actionPossible) => {},
  beforeHighlightingColumnHeader: (column, headerLevel, highlightMeta) => {
    const _column: number = column;
    const _headerLevel: number = headerLevel;
    const selectionType: string = highlightMeta.selectionType;
    const columnCursor: number = highlightMeta.columnCursor;
    const selectionWidth: number = highlightMeta.selectionWidth;

    return 10;
  },
  beforeHighlightingRowHeader: (row, headerLevel, highlightMeta) => {
    const _row: number = row;
    const _headerLevel: number = headerLevel;
    const selectionType: string = highlightMeta.selectionType;
    const columnCursor: number = highlightMeta.rowCursor;
    const selectionWidth: number = highlightMeta.selectionHeight;

    return 10;
  },
  beforeInit: () => {},
  beforeInitWalkontable: (walkontableConfig) => {},
  beforeKeyDown: (event) => {},
  beforeLanguageChange: (languageCode) => {},
  beforeLoadData: (sourceData, firstTime, source) => {},
  beforeMergeCells: (cellRange, auto) => {},
  beforeOnCellContextMenu: (event, coords, TD) => {},
  beforeOnCellMouseDown: (event, coords, TD, controller) => {},
  beforeOnCellMouseOut: (event, coords, TD) => {},
  beforeOnCellMouseOver: (event, coords, TD, controller) => {},
  beforeOnCellMouseUp: (event, coords, TD) => {},
  beforePaste: (data, coords) => { data.splice(0, 1); return false; },
  beforeRedo: (action) => {},
  beforeRedoStackChange: (undoneActions) => {},
  beforeRefreshDimensions: (previousDimensions, currentDimensions, actionPossible) => {},
  beforeRemoveCellClassNames: () => {},
  beforeRemoveCellMeta: (row, column, key, value) => {},
  beforeRemoveCol: (index, amount, physicalColumns = [1, 2, 3], source) => {},
  beforeRemoveRow: (index, amount, physicalRows = [1, 2, 3], source) => {},
  beforeRender: (isForced) => {},
  beforeRenderer: (TD, row, col, prop, value, cellProperties) => {},
  beforeRowMove: (movedRows, finalIndex, dropIndex, movePossible) => {},
  beforeRowResize: (newSize, row, isDoubleClick) => {},
  beforeRowWrap: (isActionInterrupted, newCoords, isRowFlipped) => {
    const _isActionInterrupted: boolean = isActionInterrupted.value;
    const _isRowFlipped: boolean = isRowFlipped;

    isActionInterrupted.value = false;
    newCoords.clone();
  },
  beforeSelectColumns: (from, to, highlight) => {},
  beforeSelectionFocusSet: (coords) => {
    const row: number = coords.row;
    const col: number = coords.col;
  },
  beforeSelectionHighlightSet: () => {},
  beforeSelectRows: (from, to, highlight) => {},
  beforeSetCellMeta: (row, col, key, value) => {},
  beforeSetRangeEnd: (coords) => {},
  beforeSetRangeStart: (coords) => {},
  beforeSetRangeStartOnly: (coords) => {},
  beforeStretchingColumnWidth: (stretchedWidth, column) => {
    const _stretchedWidth: number = stretchedWidth;
    const _column: number = column;
  },
  beforeTouchScroll: () => {},
  beforeTrimRow: (currentTrimConfig, destinationTrimConfig, actionPossible) => {},
  beforeUndo: (action) => {},
  beforeUndoStackChange: (doneActions, source) => {},
  beforeUnhideColumns: (currentHideConfig, destinationHideConfig, actionPossible) => {},
  beforeUnhideRows: (currentHideConfig, destinationHideConfig, actionPossible) => {},
  beforeUnmergeCells: (cellRange, auto) => {},
  beforeUntrimRow: (currentTrimConfig, destinationTrimConfig, actionPossible) => {},
  beforeUpdateData: (sourceData, firstTime, source) => {},
  beforeValidate: (value, row, prop, source) => {},
  beforeValueRender: (value) => {},
  beforeViewportScrollVertically: (visualRow, snapping) => {
    const _snapping: 'auto' | 'top' | 'bottom' = snapping;

    return visualRow === 0 ? visualRow + 1 : false;
  },
  beforeViewportScrollHorizontally: (visualColumn, snapping) => {
    const _snapping: 'auto' | 'start' | 'end' = snapping;

    return visualColumn === 0 ? visualColumn + 1 : false;
  },
  beforeViewportScroll: () => {},
  beforeViewRender: (isForced, skipRender) => {},
  construct: () => {},
  init: () => {},
  modifyAutoColumnSizeSeed: (seed, cellProperties, cellValue) => '1',
  modifyAutofillRange: (startArea, entireArea) => {},
  modifyColHeader: (column) => {},
  modifyColumnHeaderHeight: () => {},
  modifyColumnHeaderValue: (headerValue, visualColumnIndex, headerLevel) => {},
  modifyColWidth: (width, column, source) => {
    const _width: number = width;
    const _column: number = column;
    const _source: string | undefined = source;
  },
  modifyCopyableRange: (copyableRanges) => {},
  modifyFiltersMultiSelectValue: (value, meta) => '123',
  modifyFocusedElement: (row, column, focusedElement) => document.createElement('TD'),
  modifyData: () => {},
  modifyFocusOnTabNavigation: (tabActivationDir, visualCoords) => {},
  modifyGetCellCoords: (row, column, topmost, source) => {
    const _row: number = row;
    const _column: number = column;
    const _topmost: boolean = topmost;
    const _source: string = source ?? '';

    return [_row, _column, _row + 1, _column + 1];
  },
  modifyGetCoordsElement: (row, column) => {
    const _row: number = row;
    const _column: number = column;

    return [_row, _column];
  },
  modifyRowData: (row) => {},
  modifyRowHeader: (row) => {},
  modifyRowHeaderWidth: (rowHeaderWidth) => {},
  modifyRowHeight: (height, row, source) => {
    const _height: number = height;
    const _row: number = row;
    const _source: string | undefined = source;
  },
  modifyRowHeightByOverlayName: (height, row, overlayType) => {
    const _height: number = height;
    const _row: number = row;
    const _overlayType: string = overlayType;
  },
  modifyTransformEnd: (delta) => {
    const rowDelta: number = delta.row;
    const colDelta: number = delta.row;
  },
  modifyTransformFocus: (delta) => {
    const rowDelta: number = delta.row;
    const colDelta: number = delta.row;
  },
  modifyTransformStart: (delta) => {
    const rowDelta: number = delta.row;
    const colDelta: number = delta.row;
  },
  persistentStateLoad: () => {},
  persistentStateReset: () => {},
  persistentStateSave: () => {},
};
