import Handsontable from 'handsontable';

// Helpers to verify multiple different settings and prevent TS control-flow from eliminating unreachable values
declare function oneOf<T extends (string | number | boolean | undefined | null | object)[]>(...args: T): T[number];
declare const true_or_false: true | false;

// Enums prevent type widening of literals -- for use with objects inside oneOf(), not required by users
// This can be replaced once `as const` context is shipped: https://github.com/Microsoft/TypeScript/pull/29510
enum DisableVisualSelection { current = 'current', area = 'area', header ='header' }
enum SortDirection { asc = 'asc', desc = 'desc' }

const contextMenuDemo: Handsontable.contextMenu.Settings = {
  callback(key, selection, clickEvent) { },
  items: {
    "item": {
      name() {
        return '';
      },
      disabled() {
        return !!this.getSelectedLast();
      },
      hidden() {
        return !!this.getSelectedLast();
      },
      callback(key, selection, clickEvent) {
        key.toUpperCase();
        selection[0].start.row;
        clickEvent.preventDefault();
      },
      submenu: {
        items: [
          { key: 'item:0', name: '' },
          { key: 'item:1', name: '' },
          { key: 'item:2', name: '' }
        ]
      },
      disableSelection: true,
      isCommand: false,
      renderer(hot, wrapper, row, col, prop, itemValue) {
        this.key;
        hot.getSelected();
        return document.createElement('div');
      }
    }
  }
}

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
  autoColumnSize:  oneOf(true,  { syncLimit: '40%', userHeaders: true }),
  autoRowSize: oneOf(true, { syncLimit: 300 }),
  autoWrapCol: true,
  autoWrapRow: true,
  bindRowsWithHeaders: oneOf(true, 'loose', 'strict'),
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
  collapsibleColumns: oneOf(true, [
    {row: -4, col: 1, collapsible: true},
    {row: -3, col: 5, collapsible: true}
  ]),
  columnHeaderHeight: oneOf(35, [35, undefined, 55]),
  columns: [
    { type: 'numeric', numericFormat: { pattern: '0,0.00 $' } },
    { type: 'text', readOnly: true }
  ],
  columnSorting: true_or_false || {
    initialConfig: {
      column: 1,
      sortOrder: 'asc'
    },
    sortEmptyCells: true,
    indicator: true,
    headerAction: false,
    compareFunctionFactory(sortOrder, columnMeta) {
      return (a: any, b: any) => columnMeta.type == 'text' && sortOrder == 'asc' ? -1 : 1;
    }
  },
  columnSummary: [
    {
      destinationRow: 4,
      destinationColumn: 1,
      forceNumeric: true,
      reversedRowCoords: true,
      suppressDataTypeErrors: false,
      readOnly: true,
      roundFloat: false,
      type: 'custom',
      customFunction: function(endpoint) {
         return 100;
      }
    }
  ],
  colWidths: oneOf(100, '100px', ((index: number) => oneOf('100px', 100))),
  commentedCellClassName: 'foo',
  comments: oneOf(true, { displayDelay: 123 }, [
    {
      row: 1,
      col: 1,
      comment: { value: "Test" }
    }
    ]),
  contextMenu: oneOf(true_or_false, contextMenuDemo) || ['row_above', 'row_below', 'col_left', 'col_right', '---------', 'remove_row', 'remove_col', 'clear_column', 'undo', 'redo', 'make_read_only', 'alignment', 'cut', 'copy', 'freeze_column', 'unfreeze_column', 'borders', 'commentsAddEdit', 'commentsRemove', 'commentsReadOnly', 'mergeCells', 'add_child', 'detach_from_parent', 'hidden_columns_hide', 'hidden_columns_show', 'hidden_rows_hide', 'hidden_rows_show', 'filter_by_condition', 'filter_operators', 'filter_by_condition2', 'filter_by_value', 'filter_action_bar'],
  copyable: true,
  copyPaste: oneOf(true, {
    pasteMode: oneOf('overwrite', 'shift_down', 'shift_right'),
    rowsLimit: 10,
    columnsLimit: 20,
    uiContainer: document.body,
  }),
  correctFormat: true,
  currentColClassName: 'foo',
  currentHeaderClassName: 'foo',
  currentRowClassName: 'foo',
  customBorders: oneOf(true, [
    {
      range: {
        from: { row: 1, col: 1 },
        to: { row: 3, col: 4 }
      },
      left: { width: 2, color: 'red' },
      right: { width: 2, color: 'red' },
      top: { width: 2, color: 'red' },
      bottom: { width: 2, color: 'red' }
    },
    {
      row: 2,
      col: 2,
      left: { width: 2, color: 'red' },
      right: { width: 1, color: 'red' },
      top: { width: 2, color: 'red' },
      bottom: { width: 2, color: 'red' }
    }
  ],
  [
    {
      row: 2,
      col: 2,
      left: '',
      right: ''
    }
  ]),
  data: oneOf([{}, {}, {}], [[], [], []]),
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
  debug: true,
  defaultDate: 'foo',
  disableVisualSelection: oneOf(true, 'current', 'area', 'header', [DisableVisualSelection.current, DisableVisualSelection.area, DisableVisualSelection.header]),
  dragToScroll: false,
  dropdownMenu: oneOf(true_or_false, contextMenuDemo) || ['row_above', 'row_below', 'col_left', 'col_right', '---------', 'remove_row', 'remove_col', 'clear_column', 'undo', 'redo', 'make_read_only', 'alignment', 'cut', 'copy', 'freeze_column', 'unfreeze_column', 'borders', 'commentsAddEdit', 'commentsRemove', 'commentsReadOnly', 'mergeCells', 'add_child', 'detach_from_parent', 'hidden_columns_hide', 'hidden_columns_show', 'hidden_rows_hide', 'hidden_rows_show', 'filter_by_condition', 'filter_operators', 'filter_by_condition2', 'filter_by_value', 'filter_action_bar'],
  editor: oneOf(true, 'autocomplete', 'checkbox', 'date', 'dropdown', 'handsontable', 'mobile', 'password', 'select', 'text', 'custom.editor'),
  enterBeginsEditing: true,
  enterMoves: oneOf({ col: 1, row: 1 }, (event: KeyboardEvent) => ({row: 1, col: 1})),
  fillHandle: oneOf(true_or_false, 'vertical', 'horizontal') || {
    autoInsertRow: false,
    direction: 'vertical'
  },
  filter: true,
  filteringCaseSensitive: true,
  filters: false,
  fixedColumnsLeft: 123,
  fixedRowsBottom: 123,
  fixedRowsTop: 123,
  formulas: oneOf(true, {
    variables: {
      FOO: 64,
      BAR: 'baz',
    }
  }),
  fragmentSelection: oneOf(true, 'cell'),
  ganttChart: {
    firstWeekDay: 'monday',
    startYear: 2015,
    weekHeaderGenerator(start, end) { return (start * end).toFixed(); },
    allowSplitWeeks: true,
    hideDaysBeforeFullWeeks: false,
    hideDaysAfterFullWeeks: false,
    dataSource: oneOf({
      instance: new Handsontable(document.createElement('div'), {}),
      startDateColumn: 4,
      endDateColumn: 5,
      additionalData: {
        label: 0,
        quantity: 1
      },
      asyncUpdates: true
    },
    [
      {
        additionalData: {label: 'Example label.', quantity: 'Four packs.'},
        startDate: '1/5/2015',
        endDate: '1/20/2015'
      },
      {
        additionalData: {label: 'Another label.', quantity: 'One pack.'},
        startDate: '1/11/2015',
        endDate: '1/29/2015'
      }
    ])
  },
  headerTooltips: oneOf(true, {
    rows: false,
    columns: true,
    onlyTrimmed: true
  }),
  height: oneOf(500, () => 500),
  hiddenColumns: oneOf(true, {
    columns: [5, 10, 15],
    indicators: true
  }),
  hiddenRows: oneOf(true, {
    rows: [5, 10, 15],
    indicators: true
  }),
  invalidCellClassName: 'foo',
  isEmptyCol: (col) => col == 0,
  isEmptyRow: (row) => row == 0,
  label: {property: 'name.last', position: 'after', value: oneOf('My label: ', () => 'My label')},
  language: 'foo',
  licenseKey: '',
  manualColumnFreeze: true,
  manualColumnMove: oneOf(true, [1, 4]),
  manualColumnResize: oneOf(true, [40, 50]),
  manualRowMove: oneOf(true, [1, 4]),
  manualRowResize: oneOf(true, [40, 50]),
  maxCols: 123,
  maxRows: 123,
  mergeCells: oneOf(true, [
    {row: 1, col: 1, rowspan: 3, colspan: 3},
    {row: 3, col: 4, rowspan: 2, colspan: 2},
    {row: 5, col: 6, rowspan: 3, colspan: 3}
  ]),
  minCols: 123,
  minRows: 123,
  minSpareCols: 123,
  minSpareRows: 123,
  multiColumnSorting: true_or_false || {
    initialConfig: oneOf(
      { column: 1, sortOrder: SortDirection.desc },
      [{ column: 1, sortOrder: SortDirection.asc }, { column: 0, sortOrder: SortDirection.desc }]
    ),
    sortEmptyCells: true,
    indicator: true,
    headerAction: false,
    compareFunctionFactory(sortOrder, columnMeta) {
      return (a: any, b: any) => columnMeta.type == 'text' && sortOrder == 'asc' ? -1 : 1;
    }
  },
  nestedHeaders:  [
    ['A', {label: 'B', colspan: 8}, 'C'],
    ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
    ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'R', 'S', 'T']
  ],
  nestedRows: true,
  noWordWrapClassName: 'foo',
  numericFormat: {
    pattern: '0,00',
    culture: 'en-US'
  },
  observeChanges: true,
  observeDOMVisibility: true,
  outsideClickDeselects: oneOf(true, function(target: HTMLElement) {
    return false;
  }),
  persistentState: true,
  placeholder: 'foo',
  placeholderCellClassName: 'foo',
  preventOverflow: oneOf(true, 'vertical', 'horizontal'),
  preventWheel: true,
  readOnly: true,
  readOnlyCellClassName: 'foo',
  renderAllRows: true,
  renderer: oneOf(
    'autocomplete', 'checkbox', 'html', 'numeric', 'password', 'text', 'custom.renderer',
    (instance: Handsontable, TD: HTMLTableCellElement, row: number, col: number, prop: number | string, value: any, cellProperties: Handsontable.CellProperties) => TD
  ),
  rowHeaders: oneOf(true, ['1', '2', '3'], (index: number) => `Row ${index}`),
  rowHeaderWidth: oneOf(25, [25, 30, 55]),
  rowHeights: oneOf(100, '100px', [100, 120, 90], (index: number) => index * 10),
  search: oneOf(true, {
    searchResultClass: 'customClass',
    queryMethod(queryStr: string, value: any) {
      return true;
    },
    callback(instance: Handsontable, row: number, column: number, value: any, result: boolean) {
      // ...
    }
  }),
  selectionMode: oneOf('single', 'range', 'multiple'),
  selectOptions: ['A', 'B', 'C'],
  skipColumnOnPaste: true,
  sortByRelevance: true,
  source: oneOf(['A', 'B', 'C', 'D'], (query: string, callback: (item: string[]) => void) => callback(['A', 'B', 'C', 'D'])),
  startCols: 123,
  startRows: 123,
  stretchH: oneOf('none', 'last', 'all'),
  strict: true,
  tableClassName: oneOf('foo', ['first-class-name', 'second-class-name']),
  tabMoves: oneOf({ col: 1, row: 1 }, (event: KeyboardEvent) => ({row: 2, col: 2})),
  title: 'foo',
  trimDropdown: true,
  trimRows: oneOf(true, [5, 10, 15]),
  trimWhitespace: true,
  type: oneOf('autocomplete', 'checkbox', 'date', 'dropdown', 'handsontable', 'numeric', 'password', 'text', 'time', 'custom.cell.type'),
  uncheckedTemplate: oneOf(true, 'foo', 123),
  undo: true,
  validator: oneOf(
    (value: any, callback: (valid: boolean) => void) => callback(true),
    /^[0-9]$/,
    'autocomplete', 'date', 'numeric', 'time', 'custom.validator'
  ),
  viewportColumnRenderingOffset: oneOf(100, 'auto'),
  viewportRowRenderingOffset: oneOf(100, 'auto'),
  visibleRows: 123,
  width: oneOf(500, () => 500),
  wordWrap: true,

  // Hooks via settings object
  afterAddChild: (parent, element, index) => {},
  afterBeginEditing: (row, column) => {},
  afterCellMetaReset: () => {},
  afterChange: (changes, source) => changes && changes.forEach(change => change[0].toFixed()),
  afterChangesObserved: () => {},
  afterColumnMove: (columns, target) => {},
  afterColumnResize: (currentColumn, newSize, isDoubleClick) => {},
  afterColumnSort: (currentSortConfig, destinationSortConfigs) => {},
  afterContextMenuDefaultOptions: (predefinedItems) => {},
  afterContextMenuHide: (context) => {},
  afterContextMenuShow: (context) => {},
  afterCopy: (data, coords) => {},
  afterCopyLimit: (selectedRows, selectedColumnds, copyRowsLimit, copyColumnsLimit) => {},
  afterCreateCol: (index, amount, source) => {},
  afterCreateRow: (index, amount, source) => {},
  afterCut: (data, coords) => {},
  afterDeselect: () => {},
  afterDestroy: () => {},
  afterDetachChild: (parent, element) => {},
  afterDocumentKeyDown: (event) => {},
  afterDrawSelection: (currentRow, currentColumn, cornersOfSelection, layerLevel) => {},
  afterDropdownMenuDefaultOptions: (predefinedItems) => {},
  afterDropdownMenuHide: (instance) => {},
  afterDropdownMenuShow: (instance) => {},
  afterFilter: (conditionsStack) => conditionsStack[0].column,
  afterGetCellMeta: (row, col, cellProperties) => {},
  afterGetColHeader: (col, TH) => {},
  afterGetColumnHeaderRenderers: (array) => {},
  afterGetRowHeader: (row, TH) => {},
  afterGetRowHeaderRenderers: (array) => {},
  afterHideColumns: (currentHideConfig, destinationHideConfig, actionPossible, stateChanged) => {},
  afterHideRows: (currentHideConfig, destinationHideConfig, actionPossible, stateChanged) => {},
  afterInit: () => {},
  afterLanguageChange: (languageCode) => {},
  afterListen: () => {},
  afterLoadData: (firstTime) => {},
  afterMergeCells: (cellRange, mergeParent, auto) => {},
  afterModifyTransformEnd: (coords, rowTransformDir, colTransformDir) => {},
  afterModifyTransformStart: (coords, rowTransformDir, colTransformDir) => {},
  afterMomentumScroll: () => {},
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
  afterRefreshDimensions: (previousDimensions, currentDimensions, stateChanged) => {},
  afterRemoveCellMeta: (row, column, key, value) => {},
  afterRemoveCol: (index, amount, physicalColumns = [1, 2, 3], source) => {},
  afterRemoveRow: (index, amount, physicalRows = [1, 2, 3], source) => {},
  afterRender: (isForced) => {},
  afterRenderer: (TD, row, col, prop, value, cellProperties) => {},
  afterRowMove: (startRow, endRow) => {},
  afterRowResize: (currentRow, newSize, isDoubleClick) => {},
  afterScrollHorizontally: () => {},
  afterScrollVertically: () => {},
  afterSelection: (r, c, r2, c2, preventScrolling, selectionLayerLevel) => preventScrolling.value = true,
  afterSelectionByProp: (r, p, r2, p2, preventScrolling, selectionLayerLevel) => preventScrolling.value = true,
  afterSelectionEnd: (r, c, r2, c2, selectionLayerLevel) => {},
  afterSelectionEndByProp: (r, p, r2, p2, selectionLayerLevel) => {},
  afterSetCellMeta: (row, col, key, value) => {},
  afterSetDataAtCell: (changes, source) => {},
  afterSetDataAtRowProp: (changes, source) => {},
  afterTrimRow: (rows) => {},
  afterUndo: (action) => {},
  afterUnlisten: () => {},
  afterUnhideColumns: (currentHideConfig, destinationHideConfig, actionPossible, stateChanged) => {},
  afterUnhideRows: (currentHideConfig, destinationHideConfig, actionPossible, stateChanged) => {},
  afterUnmergeCells: (cellRange, auto) => {},
  afterUntrimRow: (rows) => {},
  afterUpdateSettings: () => {},
  afterValidate: () => {},
  afterViewportColumnCalculatorOverride: (calc) => {},
  afterViewportRowCalculatorOverride: (calc) => {},
  beforeAddChild: (parent, element, index) => {},
  beforeAutofill: (start, end, data) => {},
  beforeAutofillInsidePopulate: (index, direction, input, deltas) => {},
  beforeCellAlignment: (stateBefore, range, type, alignmentClass) => {},
  beforeChange: (changes, source) => { changes[0][3] = 10; return false; },
  beforeChangeRender: (changes, source) => {},
  beforeColumnMove: (columns, target) => {},
  beforeColumnResize: (currentColumn, newSize, isDoubleClick) => {},
  beforeColumnSort: (currentSortConfig, destinationSortConfigs) => {},
  beforeContextMenuSetItems: (menuItems) => {},
  beforeContextMenuShow: (context) => {},
  beforeCopy: (data, coords) => { data.splice(0, 1); return false },
  beforeCreateCol: (index, amount, source) => {},
  beforeCreateRow: (index, amount, source) => {},
  beforeCut: (data, coords) => { data.splice(0, 1); return false; },
  beforeDetachChild: (parent, element) => {},
  beforeDrawBorders: (corners, borderClassName) => {},
  beforeDropdownMenuSetItems: (menuItems) => {},
  beforeDropdownMenuShow: (instance) => {},
  beforeFilter: (conditionsStack) => { conditionsStack[0].conditions[0].name == 'begins_with' },
  beforeGetCellMeta: (row, col, cellProperties) => {},
  beforeHideColumns: (currentHideConfig, destinationHideConfig, actionPossible) => {},
  beforeHideRows: (currentHideConfig, destinationHideConfig, actionPossible) => {},
  beforeInit: () => {},
  beforeInitWalkontable: (walkontableConfig) => {},
  beforeKeyDown: (event) => {},
  beforeLanguageChange: (languageCode) => {},
  beforeMergeCells: (cellRange, auto) => {},
  beforeOnCellContextMenu: (event, coords, TD) => {},
  beforeOnCellMouseDown: (event, coords, TD, controller) => {},
  beforeOnCellMouseOut: (event, coords, TD) => {},
  beforeOnCellMouseOver: (event, coords, TD, controller) => {},
  beforeOnCellMouseUp: (event, coords, TD, controller) => {},
  beforePaste: (data, coords) => { data.splice(0, 1); return false; },
  beforeRemoveCellClassNames: () => {},
  beforeRemoveCellMeta: (row, column, key, value) => {},
  beforeRedo: (action) => {},
  beforeRefreshDimensions: (previousDimensions, currentDimensions, actionPossible) => {},
  beforeRemoveCol: (index, amount, physicalColumns = [1, 2, 3], source) => {},
  beforeRemoveRow: (index, amount, physicalRows = [1, 2, 3], source) => {},
  beforeRender: (isForced, skipRender) => {},
  beforeRenderer: (TD, row, col, prop, value, cellProperties) => {},
  beforeRowMove: (startRow, endRow) => {},
  beforeRowResize: (currentRow, newSize, isDoubleClick) => {},
  beforeSetRangeEnd: (coords) => {},
  beforeSetRangeStart: (coords) => {},
  beforeSetRangeStartOnly: (coords) => {},
  beforeStretchingColumnWidth: (stretchedWidth, column) => {},
  beforeTouchScroll: () => {},
  beforeTrimRow: (currentTrimConfig, destinationTrimConfig, actionPossible) => {},
  beforeUndo: (action) => {},
  beforeUnhideColumns: (currentHideConfig, destinationHideConfig, actionPossible) => {},
  beforeUnhideRows: (currentHideConfig, destinationHideConfig, actionPossible) => {},
  beforeUnmergeCells: (cellRange, auto) => {},
  beforeUntrimRow: (currentTrimConfig, destinationTrimConfig, actionPossible) => {},
  beforeValidate: (value, row, prop, source) => {},
  beforeValueRender: (value) => {},
  construct: () => {},
  hiddenColumn: (column) => {},
  hiddenRow: (row) => {},
  init: () => {},
  modifyAutofillRange: (startArea, entireArea) => {},
  modifyCol: (col) => {},
  modifyColHeader: (column) => {},
  modifyColumnHeaderHeight: () => {},
  modifyColWidth: (width) => {},
  modifyCopyableRange: (copyableRanges) => {},
  modifyData: () => {},
  modifyGetCellCoords: (row, column, topmost) => {},
  modifyRow: (row) => {},
  modifyRowData: (row) => {},
  modifyRowHeader: (row) => {},
  modifyRowHeaderWidth: (rowHeaderWidth) => {},
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
}
