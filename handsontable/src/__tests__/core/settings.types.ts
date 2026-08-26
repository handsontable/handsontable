import type Handsontable from 'handsontable';
import HyperFormula from 'hyperformula';
import type {
  CellProperties, CellCoords, RangeType, RemoveIndexSignature, Events, HotInstance, CellChange, ChangeSource,
} from 'handsontable';

// Helpers to verify multiple different settings and prevent TS control-flow from eliminating unreachable values
declare function oneOf<T extends Array<string | number | boolean | undefined | null | object>>(...args: T): T[number];
declare const true_or_false: true | false;

// Enums prevent type widening of literals -- for use with objects inside oneOf(), not required by users
// This can be replaced once `as const` context is shipped: https://github.com/Microsoft/TypeScript/pull/29510
enum DisableVisualSelection { current = 'current', area = 'area', header = 'header' }

const numericIntlFormatOptions: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  useGrouping: false,
  maximumFractionDigits: 20,
  minimumFractionDigits: 2,
  maximumSignificantDigits: 20,
  minimumSignificantDigits: 2,
  localeMatcher: 'best fit',
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
  autoColumnSize: true,
  autoRowSize: true,
  autoRowHeaderSize: oneOf(true, { samplingRatio: 3, allowSampleDuplicates: true, syncLimit: 500 },
    { syncLimit: '40%' }),
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
  colorScheme: oneOf('light', 'dark', 'auto'),
  density: oneOf('default', 'compact', 'comfortable'),
  columnHeaderHeight: oneOf(35, [35, 55]),
  columns: [
    {
      type: 'numeric',
      numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }
    },
    { type: 'text', readOnly: true }
  ],
  columnSorting: true,
  columnSummary: [],
  colWidths: oneOf(100, '100px', [100, '100px'], ((index: number) => oneOf('100px', 100))),
  commentedCellClassName: 'foo',
  comments: true,
  contextMenu: true,
  copyable: true,
  copyPaste: true,
  currentColClassName: 'foo',
  currentHeaderClassName: 'foo',
  currentRowClassName: 'foo',
  customBorders: true,
  customBordersProgressive: oneOf(true, { chunkSize: 5000 }),
  data: oneOf([{}, {}, {}], [[], [], []]),
  dataDotNotation: oneOf(true),
  dataProvider: {
    rowId: 'id',
    fetchRows: async() => ({ rows: [], totalRows: 0 }),
    onRowsCreate: async() => [],
    onRowsUpdate: async() => {},
    onRowsRemove: async() => {},
  },
  dataSchema: oneOf({}, [[]], (index: number) => oneOf([index], { index })),
  dateFormat: oneOf({ year: 'numeric', month: '2-digit', day: '2-digit' } as Intl.DateTimeFormatOptions),
  dateTimeFormat: oneOf(
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } as
      Intl.DateTimeFormatOptions
  ),
  defaultDate: 'foo',
  timeFormat: oneOf({ hour: 'numeric', minute: '2-digit' } as Intl.DateTimeFormatOptions),
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
  enterMoves: oneOf({ col: 1, row: 1 }, (event: KeyboardEvent) => ({ row: 1, col: 1 })),
  exportFile: { engines: { xlsx: {} } },
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
  getValue: oneOf('name', function(this: Handsontable) {
    return this.getDataAtCell(0, 0);
  }),
  handsontable: {
    data: [[]],
    colHeaders: true,
    getValue: 'name',
  },
  hashLength: 8,
  hashRevealDelay: 1000,
  hashSymbol: '#',
  height: oneOf(500, 'auto', '75vh', () => 500, () => 'auto'),
  hiddenColumns: true,
  hiddenRows: true,
  initialState: {
    manualColumnMove: [1, 0],
    fragmentSelection: true,
    columns: [
      {
        type: 'numeric',
      },
    ],
    cells: () => ({ readOnly: true }),
  },
  invalidCellClassName: 'foo',
  imeFastEdit: true,
  isEmptyCol: col => col === 0,
  isEmptyRow: row => row === 0,
  label: { property: 'name.last', position: 'after', value: oneOf('My label: ', () => 'My label') },
  language: 'foo',
  layout: {
    top: ['toolbar'],
    bottom: ['pagination', 'summary'],
  },
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
  minRowHeights: oneOf(100, '100px', [100, 120, 90], (index: number) => index * 10),
  minRows: 123,
  minSpareCols: 123,
  minSpareRows: 123,
  navigableHeaders: true,
  multiColumnSorting: true,
  nestedHeaders: [
    ['Region', { label: 'Q1 2025', colspan: 4 }],
    [
      'Region',
      { label: 'Jan', visibleWhen: 'expanded' },
      { label: 'Feb', visibleWhen: 'expanded' },
      { label: 'Total', visibleWhen: 'collapsed' },
      { label: 'Note', visibleWhen: 'always', headerClassName: 'htRight', rowspan: 1 },
    ],
  ],
  nestedRows: true,
  noWordWrapClassName: 'foo',
  numericFormat: numericIntlFormatOptions,
  preserveNumericLiteral: true,
  observeDOMVisibility: true,
  outsideClickDeselects: oneOf(true, (target: HTMLElement) => false),
  pagination: oneOf(true, {
    pageSize: 10,
    pageSizeList: [5, 10, 20, 50, 100],
    initialPage: 1,
    showPageSize: true,
    showCounter: true,
    showNavigation: true,
    uiContainer: document.body,
  }),
  parsePastedValue: true,
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
  sanitizer: (content: string, source: 'innerHTML' | 'CopyPaste.paste') => content,
  search: true,
  selectionMode: oneOf('single', 'range', 'multiple'),
  selectionHandles: true,
  moveCells: true,
  selectOptions: oneOf(
    ['A', 'B', 'C'],
    { a: 'A', b: 'B', c: 'C' },
    (visualRow: number, visualColumn: number, prop: string | number) => ['A', 'B', 'C'],
    (visualRow: number, visualColumn: number, prop: string | number) => ({ a: 'A', b: 'B', c: 'C' }),
  ),
  skipColumnOnPaste: true,
  skipRowOnPaste: true,
  sortByRelevance: true,
  source: (oneOf(
    ['A', 'B', 'C', 'D'],
    (query: string, callback: (item: string[]) => void) => callback(['A', 'B', 'C', 'D'])
  ) as any),
  sourceDataValidator: oneOf((value: any, cellMeta: CellProperties) => true),
  sourceDataWarningMessage: oneOf('The source data is invalid.'),
  startCols: 123,
  startRows: 123,
  stretchH: 'none',
  strict: true,
  tableClassName: oneOf('foo', ['first-class-name', 'second-class-name']),
  tabMoves: oneOf({ col: 1, row: 1 }, (event: KeyboardEvent) => ({ row: 2, col: 2 })),
  textEllipsis: false,
  themeName: 'ht-theme-some-theme',
  theme: '',
  title: 'foo',
  trimDropdown: true,
  trimRows: true,
  trimWhitespace: true,
  type: oneOf('autocomplete', 'checkbox', 'date', 'dropdown', 'handsontable', 'numeric', 'password',
    'text', 'time', 'custom.cell.type'),
  uncheckedTemplate: oneOf(true, 'foo', 123),
  undo: true,
  dialog: oneOf(true, {
    template: {
      type: 'confirm' as const,
      title: 'Confirm',
      description: 'This is a confirm',
      buttons: [
        {
          text: 'OK',
          type: 'primary' as const,
          callback: (event: MouseEvent) => {},
        },
      ],
    },
    content: 'foo',
    closable: true,
    customClassName: 'foo',
    animation: true,
    background: 'solid' as const,
    contentBackground: true,
    a11y: {
      role: 'dialog' as const,
      ariaLabel: 'Dialog',
      ariaLabelledby: '',
      ariaDescribedby: '',
    }
  }),
  loading: oneOf(true, {
    icon: '<svg />',
    title: 'Loading...',
    description: 'Loading...',
  }),
  notification: oneOf(true, {
    stackLimit: 5,
    animation: false,
  }),
  emptyDataState: oneOf(true, {
    message: 'No data available',
  }, {
    message: {
      title: 'No data available',
      description: 'There\'s nothing to display yet.',
      buttons: [
        {
          text: 'Reset filters',
          type: 'secondary' as const,
          callback: () => {},
        },
      ],
    },
  }, {
    message: (source: string) => {
      switch (source) {
        case 'filters':
          return {
            title: 'No data available',
            description: 'There\'s nothing to display yet.',
            buttons: [
              {
                text: 'Reset filters',
                type: 'secondary' as const,
                callback: () => {},
              },
            ],
          };
        default:
          return {
            title: 'No data available',
            description: 'There\'s nothing to display yet.',
          };
      }
    },
  }),
  validator: oneOf(
    (value: any, callback: (valid: boolean) => void) => callback(true),
    /^[0-9]$/,
    'autocomplete', 'date', 'numeric', 'time', 'custom.validator'
  ),
  valueFormatter: (value: any, cellMeta: CellProperties) => value,
  valueParser: (value: any, cellMeta: CellProperties) => value,
  valueGetter: (value: any, row: number, column: number, cellMeta: CellProperties) => value,
  valueSetter: (value: any, row: number, column: number, cellMeta: CellProperties) =>
    `${value} at row ${row}, column ${column}`,
  viewportColumnRenderingOffset: oneOf(100, 'auto'),
  viewportRowRenderingOffset: oneOf(100, 'auto'),
  viewportColumnRenderingThreshold: oneOf(100, 'auto'),
  viewportRowRenderingThreshold: oneOf(100, 'auto'),
  visibleRows: 123,
  width: oneOf(500, 'auto', '75vw', () => 500, () => 'auto'),
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
  afterCustomBordersUpdate: () => {},
  afterColumnSequenceCacheUpdate: (indexesChangesState) => {},
  afterColumnSort: (currentSortConfig, destinationSortConfigs) => {},
  afterColumnUnfreeze: (columnIndex, isFreezingPerformed) => {},
  beforeCompositionStart: (event) => {
    const _event: CompositionEvent = event;
  },
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
  afterDialogFocus: (focusSource) => {},
  afterDialogHide: () => {},
  afterDialogShow: () => {},
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
  afterEmptyDataStateShow: () => {},
  afterEmptyDataStateHide: () => {},
  afterFilter: conditionsStack => conditionsStack[0].column,
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
  beforeLoadingShow: () => {},
  afterLoadingShow: () => {},
  beforeLoadingHide: () => {},
  afterLoadingHide: () => {},
  afterNotificationHide: (_id) => {},
  afterNotificationShow: (_id, _options) => {},
  modifySourceData: (row, col, valueHolder, ioMode) => {},
  afterModifyTransformEnd: (coords, rowTransformDir, colTransformDir) => {
    const row: number | null = coords.row;
    const col: number | null = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterModifyTransformFocus: (coords, rowTransformDir, colTransformDir) => {
    const row: number | null = coords.row;
    const col: number | null = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterModifyTransformStart: (coords, rowTransformDir, colTransformDir) => {
    const row: number | null = coords.row;
    const col: number | null = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterMomentumScroll: () => {},
  afterMoveCells: (sourceRange, targetRange, isCopy) => {},
  afterNamedExpressionAdded: (namedExpressionName, changes) => {},
  afterNamedExpressionRemoved: (namedExpressionName, changes) => {},
  afterOnCellContextMenu: (event, coords, TD) => {},
  afterOnCellCornerDblClick: (event) => {},
  afterOnCellCornerMouseDown: (event) => {},
  afterOnSelectionHandleMouseDown: (event, edge) => {},
  afterOnSelectionEdgeMouseDown: (event, edge) => {},
  afterOnCellMouseDown: (event, coords, TD) => {},
  afterOnCellMouseOver: (event, coords, TD) => {},
  afterOnCellMouseOverOutside: (event, coords, TD) => {},
  afterOnCellMouseOut: (event, coords, TD) => {},
  afterOnCellMouseUp: (event, coords, TD) => {},
  afterPageChange(oldPage, newPage) {
    const _oldPage: number = oldPage;
    const _newPage: number = newPage;
  },
  afterPageSizeChange(oldPageSize, newPageSize) {
    const _oldPageSize: number | 'auto' = oldPageSize;
    const _newPageSize: number | 'auto' = newPageSize;
  },
  afterPageSizeVisibilityChange(isVisible) {
    const _isVisible: boolean = isVisible;
  },
  afterPageCounterVisibilityChange(isVisible) {
    const _isVisible: boolean = isVisible;
  },
  afterPageNavigationVisibilityChange(isVisible) {
    const _isVisible: boolean = isVisible;
  },
  afterPaste: (data, coords) => {},
  afterPluginsInitialized: () => {},
  afterRedo: (action) => {},
  afterRedoStackChange: (undoneActionsBefore, undoneActionsAfter) => {},
  afterRefreshDimensions: (previousDimensions, currentDimensions, stateChanged) => {},
  afterRemoveCellMeta: (row, column, key, value) => {},
  afterRemoveCol: (index, amount, physicalColumns = [1, 2, 3], source) => {},
  afterRemoveRow: (index, amount, physicalRows = [1, 2, 3], source) => {},
  afterRowsMutation: (operation, payload) => {},
  afterRowsMutationError: (operation, error, payload) => {},
  afterRender: (isForced) => {},
  afterRenderer: (TD, row, col, prop, value, cellProperties) => {},
  afterRowCollapse: (currentCollapsedRows, destinationCollapsedRows, collapsePossible,
                     successfullyCollapsed) => {},
  afterRowExpand: (currentCollapsedRows, destinationCollapsedRows, expandPossible,
                   successfullyExpanded) => {},
  afterRowMove: (movedRows, finalIndex, dropIndex, movePossible,
                 orderChanged) => movedRows.forEach(row => row.toFixed(1) === finalIndex.toFixed(1)),
  afterRowResize: (newSize, row, isDoubleClick) => {},
  afterRowSequenceChange: (source) => {},
  afterRowSequenceCacheUpdate: (indexesChangesState) => {},
  afterScrollHorizontally: () => {},
  afterScrollVertically: () => {},
  afterScroll: () => {},
  afterSelectAll: (from, to, highlight) => {
    const _from: CellCoords = from;
    const _to: CellCoords = to;
    const _highlight: CellCoords | undefined = highlight;
  },
  afterSelectColumns: (from, to, highlight) => {
    const _from: CellCoords = from;
    const _to: CellCoords = to;
    const _highlight: CellCoords = highlight;
  },
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
  afterDataProviderFetch: (result) => {},
  afterDataProviderFetchError: (error, queryParameters) => {},
  afterDataProviderFetchAbort: (queryParameters, reason) => {},
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
  beforeChange: (changes, source) => {
    if (changes?.[0] !== null) { changes[0][3] = 10; }

    return false;
  },
  beforeChangeRender: (changes, source) => {},
  beforeAlter: (action, index, amount, source, keepEmptyRows) => true,
  beforeColumnCollapse: (currentCollapsedColumn, destinationCollapsedColumns, collapsePossible) => {},
  beforeColumnExpand: (currentCollapsedColumn, destinationCollapsedColumns, expandPossible) => {},
  beforeColumnFreeze: (columnIndex, isFreezingPerformed) => false,
  beforeColumnMove: (columns, target) => {},
  beforeColumnResize: (newSize, column, isDoubleClick) => false,
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
  beforeCopy: (data, coords) => {
    data.splice(0, 1);

    return false;
  },
  beforeCreateCol: (index, amount, source) => {},
  beforeCreateRow: (index, amount, source) => {},
  beforeRowsMutation: (operation, payload) => true,
  beforeCut: (data, coords) => {
    data.splice(0, 1);

    return false;
  },
  beforeDetachChild: (parent, element) => {},
  beforeDialogHide: () => {},
  beforeDialogShow: () => {},
  beforeDrawBorders: (corners, borderClassName) => {},
  beforeDropdownMenuSetItems: (menuItems) => {},
  beforeDropdownMenuShow: (instance) => {},
  beforeEmptyDataStateShow: () => {},
  beforeEmptyDataStateHide: () => {},
  beforeNotificationHide: (_id) => {},
  beforeNotificationShow: (_options) => {},
  beforeFilter: (conditionsStack, previousConditionStack) => {
    conditionsStack[0].conditions[0].name === 'begins_with';
  },
  beforeGetCellMeta: (row, col, cellProperties) => {},
  beforeHeightChange: (height) => {
    const _height: number | string = height;

    return height;
  },
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
  beforeMoveCells: (sourceRange, targetTopLeft, isCopy) => {},
  beforeOnCellContextMenu: (event, coords, TD) => {},
  beforeOnCellMouseDown: (event, coords, TD, controller) => {},
  beforeOnCellMouseOut: (event, coords, TD) => {},
  beforeOnCellMouseOver: (event, coords, TD, controller) => {},
  beforeOnCellMouseOverOutside: (event, coords, TD, controller) => {},
  beforeOnCellMouseUp: (event, coords, TD) => {},
  beforeDataProviderFetch: queryParameters => true,
  beforePageChange(oldPage, newPage) {
    const _oldPage: number = oldPage;
    const _newPage: number = newPage;

    return true;
  },
  beforePageSizeChange(oldPageSize, newPageSize) {
    const _oldPageSize: number | 'auto' = oldPageSize;
    const _newPageSize: number | 'auto' = newPageSize;

    return true;
  },
  beforePaste: (data, coords) => {
    data.splice(0, 1);

    return false;
  },
  beforeRedo: (action) => {},
  beforeRedoStackChange: (undoneActions) => {},
  beforeRefreshDimensions: (previousDimensions, currentDimensions, actionPossible) => {},
  beforeRemoveCellClassNames: () => {},
  beforeRemoveCellMeta: (row, column, key, value) => false,
  beforeRemoveCol: (index, amount, physicalColumns = [1, 2, 3], source) => {},
  beforeRemoveRow: (index, amount, physicalRows = [1, 2, 3], source) => {},
  beforeRender: (isForced) => {},
  beforeRenderer: (TD, row, col, prop, value, cellProperties) => {},
  beforeRowCollapse: (currentCollapsedRows, destinationCollapsedRows, collapsePossible) => {},
  beforeRowExpand: (currentCollapsedRows, destinationCollapsedRows, expandPossible) => {},
  beforeRowMove: (movedRows, finalIndex, dropIndex, movePossible) => {},
  beforeRowResize: (newSize, row, isDoubleClick) => false,
  beforeRowWrap: (isActionInterrupted, newCoords, isRowFlipped) => {
    const _isActionInterrupted: boolean = isActionInterrupted.value;
    const _isRowFlipped: boolean = isRowFlipped;

    isActionInterrupted.value = false;
    newCoords.clone();
  },
  beforeSelectAll: (from, to, highlight) => {
    const _from: CellCoords = from;
    const _to: CellCoords = to;
    const _highlight: CellCoords | undefined = highlight;
  },
  beforeSelectColumns: (from, to, highlight) => {
    const _from: CellCoords = from;
    const _to: CellCoords = to;
    const _highlight: CellCoords = highlight;
  },
  beforeSelectionFocusSet: (coords) => {
    const row: number | null = coords.row;
    const col: number | null = coords.col;
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
  beforeWidthChange: (width) => {
    const _width: number | string = width;

    return width;
  },
  construct: () => {},
  dialogFocusNextElement: () => {},
  dialogFocusPreviousElement: () => {},
  hasExternalDataSource: () => false,
  init: () => {},
  modifyAutoColumnSizeSeed: (seed, cellProperties, cellValue) => '1',
  modifyAutofillRange: (entireArea, startArea) => {
    const _entireArea: [number, number, number, number] = entireArea;
    const _startArea: [number, number, number, number] = startArea;

    return _startArea[0] === _entireArea[0] ? _startArea : _entireArea;
  },
  modifyColHeader: (column) => {},
  modifyColumnHeaderHeight: () => {},
  modifyColumnHeaderValue: (headerValue, visualColumnIndex, headerLevel) => {},
  modifyColWidth: (width, column, source) => {
    const _width: number = width;
    const _column: number = column;
    const _source: string | undefined = source;
  },
  modifyCopyableRange: (copyableRanges) => {
    const _copyableRanges: RangeType[] = copyableRanges;

    return _copyableRanges;
  },
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
  modifyRowHeaderWidth: rowHeaderWidth => oneOf(80, [80, 40]),
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
  modifySinglePassLayout: (singlePassLayout) => {
    const _singlePassLayout: boolean = singlePassLayout;

    return false;
  },
  modifyTransformEnd: (delta) => {
    const rowDelta: number | null = delta.row;
    const colDelta: number | null = delta.row;
  },
  modifyTransformFocus: (delta) => {
    const rowDelta: number | null = delta.row;
    const colDelta: number | null = delta.row;
  },
  modifyTransformStart: (delta) => {
    const rowDelta: number | null = delta.row;
    const colDelta: number | null = delta.row;
  },
};

// === cell-meta typing regression ===
// Assert that CellProperties has well-known members typed precisely (not widened to `any` via the index signature)
declare const cellProperties: CellProperties;
const _readOnly: boolean | undefined = cellProperties.readOnly;

// Assert that a CellProperties value is assignable as the last argument of a renderer function
const _rendererCellProps: Handsontable.CellProperties = cellProperties;

// Assert that a CellProperties value is assignable as the validator `this` context type
const _validatorCellProps: CellProperties = cellProperties;

// === `handsontable` cell-type setting typing ===
// `getValue` is a regular top-level grid setting (read by `Core#getValue`), usable both at the
// instance level and inside the nested `handsontable` config of the `handsontable` cell type. Its
// function form binds `this` to the instance.

// `getValue` also works as a top-level grid setting (read by `Core#getValue`), not only nested.
const _hotTopLevelGetValueString: Handsontable.GridSettings = { getValue: 'name' };
const _hotTopLevelGetValueFn: Handsontable.GridSettings = {
  getValue() {
    return this.getDataAtCell(0, 0);
  },
};

// Nested `handsontable` config (global and per-column), with both `getValue` forms.
const _hotGlobal: Handsontable.GridSettings = {
  handsontable: { data: [[]], getValue: 'name' },
};
const _hotColumn: Handsontable.ColumnSettings = {
  handsontable: { data: [[]], getValue: 'name' },
};
const _hotColumnGetValueFn: Handsontable.ColumnSettings = {
  handsontable: {
    // Relies on the *contextual* `this` (no explicit annotation) on purpose: this fails to compile
    // if a `[key: string]: unknown` index signature is re-added to `ColumnSettings`, because the
    // value-type mismatch with the `[key: string]: any` inherited from `GridSettings` widens `this`
    // to `{}`. Keeps the no-index-signature decision in `settings.ts` honest.
    getValue() {
      return this.getDataAtCell(0, 0);
    },
  },
};

// Custom plugin/meta keys still allowed via the `[key: string]: any` signature inherited from `GridSettings`.
const _columnArbitraryKeys: Handsontable.ColumnSettings = { someCustomPluginKey: 123 };
const _cellMetaArbitraryKeys: Handsontable.CellMeta = { someCustomMetaKey: true };

// DEV-2020 regression: `GridSettings` carries a `[key: string]: any` index signature. `Omit`/`Pick`
// over a type with a string index signature widens `keyof` to `string`, which collapses the result to
// a bare index signature and drops every named option. The framework wrappers derive their prop types
// with `Omit`, so without stripping the index signature first their props lose all option names (and
// IDE autocomplete). `RemoveIndexSignature<T>` removes the index signature while keeping the named
// members — the following asserts it does exactly that, so wrappers can `Omit` over the result safely.
type _StrippedGridSettings = RemoveIndexSignature<Handsontable.GridSettings>;
// The named options keep their real types after stripping.
// @ts-expect-error `width` is `number | string | (() => number | string)`, not `boolean`.
const _strippedWidthTyped: _StrippedGridSettings = { width: true };
// @ts-expect-error `readOnly` is `boolean`, not `string`.
const _strippedReadOnlyTyped: _StrippedGridSettings = { readOnly: 'nope' };
// The index signature is gone, so arbitrary keys are no longer accepted on the stripped type.
// @ts-expect-error `someCustomPluginKey` is not a known `GridSettings` option.
const _strippedNoArbitraryKeys: _StrippedGridSettings = { someCustomPluginKey: 123 };
// A valid, fully-typed config still compiles (options resolve to their real types).
const _strippedTypedConfig: _StrippedGridSettings = {
  width: 80,
  readOnly: true,
  className: 'foo',
};

// DEV-2056 regression: `ColumnSettings` derives from `Omit<RemoveIndexSignature<GridSettings>, 'data'>`
// (NOT from `GridSettings` directly), so named options keep their real declared types through
// `ColumnSettings`, `CellMeta`, and `CellProperties` instead of collapsing into the index-signature
// `any`. Renderers and plugins read these options straight off `CellProperties` — no local
// re-declaration (like the removed `CheckboxCellProperties`) is needed.
declare const _cellPropsForNamedOptions: Handsontable.CellProperties;
// `checkedTemplate` is declared `unknown` on `GridSettings` — an `any` read would let this compile.
// @ts-expect-error `checkedTemplate` resolves to `unknown`, not `any` — no arithmetic on it.
const _checkedTemplateIsUnknown: number = _cellPropsForNamedOptions.checkedTemplate + 1;
// @ts-expect-error `readOnly` is `boolean`, not `string`, when read through `CellProperties`.
const _cellPropsReadOnlyTyped: string = _cellPropsForNamedOptions.readOnly;
// The `source` option keeps its declared union type through the chain.
const _cellPropsSourceTyped: unknown[] | ((query: string, callback: (items: unknown[]) => void) => void) | undefined =
  _cellPropsForNamedOptions.source;

// `sourceDataValidator` is a public option and is declared on `GridSettings` (with its
// `rowIndependent` batching flag), so validators typed against the documented signature compile.
const _sourceDataValidatorTyped: Handsontable.GridSettings = {
  sourceDataWarningMessage: 'The source data is invalid.',
  sourceDataValidator: (value, cellMeta) => cellMeta.allowEmpty === true || typeof value === 'string',
};
const _sourceDataValidatorBadReturn: Handsontable.GridSettings = {
  // @ts-expect-error the validator must return `boolean`, not `string`.
  sourceDataValidator: () => 'yes',
};

// DEV-2072 regression: `Events` is derived from `GridSettings` via `HookKey`. Without stripping
// `GridSettings`'s index signature first, `HookKey` (and thus `Events`) collapsed to a bare index
// signature, so every hook callback typed through `Events[hookName]` inferred its parameters as `any`.
const _onAfterChange: Events['afterChange'] = (changes, source) => {
  // These assignments only compile if the parameters keep their real, non-`any` types.
  const _changes: CellChange[] | null = changes;
  const _source: ChangeSource = source;
};
// Newly-documented hooks (previously missing from `GridSettings`) resolve to real callback types too.
const _onBeforeOnCellMouseOverOutside: Events['beforeOnCellMouseOverOutside'] = (event, coords, TD, controller) => {
  const _event: MouseEvent = event;
  const _coords: CellCoords = coords;
  const _TD: HTMLTableCellElement = TD;
  const _controller: { row: boolean, column: boolean, cell: boolean } = controller;
};

// @ts-expect-error `notARealHook` is not a hook-shaped `GridSettings` property.
type _NotAHook = Events['notARealHook'];
// @ts-expect-error An arbitrary string is not a member of the now-finite `keyof Events` union.
const _arbitraryHookKey: keyof Events = 'someArbitraryString';

declare const hot: HotInstance;
// Rung 1 of the `addHook` overload ladder: an unannotated arrow under a known hook name
// gets full parameter inference from `Events[K]`.
hot.addHook('afterChange', (changes, source) => {
  const _changes: CellChange[] | null = changes;
  const _source: ChangeSource = source;
});
// Rung 2: an explicitly-annotated callback that doesn't exactly match the declared hook
// signature is still accepted under a known hook name (back-compat with pre-tightening code).
hot.addHook('afterCreateRow', (index: number, amount: number, source: string) => {});
// Rung 3: a dynamic/plugin-only hook name still compiles, including with a typed callback
// (the `HookCallback` fallback is the sound function top type, not `(...args: unknown[])`).
hot.addHook('someCustomPluginHook', (payload: { id: number }, flag: boolean) => {});

// Regression: selectionHandles must be accepted by updateSettings.
hot.updateSettings({ selectionHandles: true });

// Regression: moveCells must be accepted by updateSettings.
hot.updateSettings({ moveCells: true });

// Regression: afterOnSelectionHandleMouseDown must be accepted by updateSettings.
hot.updateSettings({ afterOnSelectionHandleMouseDown(event, edge) {} });
hot.updateSettings({ afterOnSelectionEdgeMouseDown(event, edge) {} });

// Regression: beforeMoveCells and afterMoveCells must be accepted by updateSettings.
hot.updateSettings({ beforeMoveCells(sourceRange, targetTopLeft, isCopy) { return true; } });
hot.updateSettings({ afterMoveCells(sourceRange, targetRange, isCopy) {} });

// Regression: MoveCells exposes moveCellRange with correct arg/return types.
const moveResult: boolean = hot.getPlugin('moveCells')
  .moveCellRange(hot.getSelectedRangeLast()!, hot._createCellCoords(5, 5), false);
