import Handsontable, { CellCoords } from 'handsontable';
import HyperFormula from 'hyperformula';
import { HotInstance, GridSettings } from 'handsontable/common';

// Local interface definitions to replace namespace references
interface CellProperties {
  row: number;
  col: number;
  instance: HotInstance;
  visualRow: number;
  visualCol: number;
  prop: string | number;
  type?: string;
  [key: string]: unknown;
}

interface NumericFormatOptions {
  pattern?: string | Record<string, unknown>;
  culture?: string;
  style?: string;
  currency?: string;
  useGrouping?: boolean;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  maximumSignificantDigits?: number;
  minimumSignificantDigits?: number;
  localeMatcher?: string;
  [key: string]: unknown;
}

interface CellMeta {
  readOnly?: boolean;
  type?: string;
  [key: string]: unknown;
}

// Helpers to verify multiple different settings and prevent TS control-flow from eliminating unreachable values
declare function oneOf<T extends Array<string | number | boolean | undefined | null | object>>(...args: T): T[number];
declare const true_or_false: true | false;

// Enums prevent type widening of literals -- for use with objects inside oneOf(), not required by users
// This can be replaced once `as const` context is shipped: https://github.com/Microsoft/TypeScript/pull/29510
enum DisableVisualSelection { current = 'current', area = 'area', header = 'header' }

const legacyNumbroNumericFormat: NumericFormatOptions = {
  pattern: '0.00',
  culture: 'en-US',
};
const numericNumbroFormatOptions: NumericFormatOptions = {
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
const numericIntlFormatOptions: NumericFormatOptions = {
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
const allSettings: Required<GridSettings> = {
  _automaticallyAssignedMetaProps: new Set<string>(),
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
  cells(row: any, column: any, prop: any) {
    const cellProperties: CellMeta = {};
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
    disableDayFn(date: any) {
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
  isEmptyCol: (col: any) => col === 0,
  isEmptyRow: (row: any) => row === 0,
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
  minRowHeights: oneOf(100, '100px', [100, 120, 90], (index: number) => index * 10),
  minRows: 123,
  minSpareCols: 123,
  minSpareRows: 123,
  navigableHeaders: true,
  multiColumnSorting: true,
  nestedHeaders: [],
  nestedRows: true,
  noWordWrapClassName: 'foo',
  numericFormat: oneOf(legacyNumbroNumericFormat, numericNumbroFormatOptions, numericIntlFormatOptions),
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
    (instance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
      prop: number | string, value: any, cellProperties: CellProperties) => TD
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
  textEllipsis: false,
  themeName: 'ht-theme-some-theme',
  timeFormat: 'h:mm:ss a',
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
  valueGetter: (value: any, row: number, column: number, cellMeta: CellProperties) => value,
  valueSetter: (value: any, row: number, column: number, cellMeta: CellProperties) => `${value} at row ${row}, column ${column}`,
  viewportColumnRenderingOffset: oneOf(100, 'auto'),
  viewportRowRenderingOffset: oneOf(100, 'auto'),
  viewportColumnRenderingThreshold: oneOf(100, 'auto'),
  viewportRowRenderingThreshold: oneOf(100, 'auto'),
  visibleRows: 123,
  width: oneOf(500, () => 500),
  wordWrap: true,

  // Hooks via settings object
  afterAddChild: (parent: any, element: any, index: any) => {},
  afterAutofill: (start: any, end: any, data: any) => {},
  afterBeginEditing: (row: any, column: any) => {},
  afterCellMetaReset: () => {},
  afterChange: (changes: any, source: any) => {
    if (changes !== null) {
      changes.forEach((change: any) => change[0].toFixed());
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
  afterColumnCollapse: (currentCollapsedColumn: any, destinationCollapsedColumns: any, collapsePossible: any,
    successfullyCollapsed: any) => {},
  afterColumnExpand: (currentCollapsedColumn: any, destinationCollapsedColumns: any, expandPossible: any,
    successfullyExpanded: any) => {},
  afterColumnFreeze: (columnIndex: any, isFreezingPerformed: any) => {},
  afterColumnMove: (columns: any, target: any) => {},
  afterColumnResize: (newSize: any, column: any, isDoubleClick: any) => {},
  afterColumnSequenceChange: (source: any) => {},
  afterColumnSequenceCacheUpdate: (indexesChangesState: any) => {},
  afterColumnSort: (currentSortConfig: any, destinationSortConfigs: any) => {},
  afterColumnUnfreeze: (columnIndex: any, isFreezingPerformed: any) => {},
  beforeCompositionStart: (event: any) => {
    const _event: CompositionEvent = event;
  },
  afterContextMenuDefaultOptions: (predefinedItems: any) => {},
  afterContextMenuHide: (context: any) => {},
  afterContextMenuShow: (context: any) => {},
  afterCopy: (data: any, coords: any) => {},
  afterCopyLimit: (selectedRows: any, selectedColumns: any, copyRowsLimit: any, copyColumnsLimit: any) => {},
  afterCreateCol: (index: any, amount: any, source: any) => {},
  afterCreateRow: (index: any, amount: any, source: any) => {},
  afterCut: (data: any, coords: any) => {},
  afterDeselect: () => {},
  afterDestroy: () => {},
  afterDetachChild: (parent: any, element: any) => {},
  afterDialogFocus: (focusSource: any) => {},
  afterDialogHide: () => {},
  afterDialogShow: () => {},
  afterDocumentKeyDown: (event: any) => {},
  afterDrawSelection: (currentRow: any, currentColumn: any, cornersOfSelection: any, layerLevel: any) => {
    const _currentRow: number = currentRow;
    const _currentColumn: number = currentColumn;
    const _cornersOfSelection: number[] = cornersOfSelection;
    const _layerLevel: number | undefined = layerLevel;
  },
  afterDropdownMenuDefaultOptions: (predefinedItems: any) => {},
  afterDropdownMenuHide: (instance: any) => {},
  afterDropdownMenuShow: (instance: any) => {},
  afterEmptyDataStateShow: () => {},
  afterEmptyDataStateHide: () => {},
  afterFilter: (conditionsStack: any) => conditionsStack[0].column,
  afterFormulasValuesUpdate: (changes: any) => {},
  afterGetCellMeta: (row: any, col: any, cellProperties: any) => {},
  afterGetColHeader: (col: any, TH: any, headerLevel: any) => {},
  afterGetColumnHeaderRenderers: (array: any) => {},
  afterGetRowHeader: (row: any, TH: any) => {},
  afterGetRowHeaderRenderers: (array: any) => {},
  afterHideColumns: (currentHideConfig: any, destinationHideConfig: any, actionPossible: any, stateChanged: any) => {},
  afterHideRows: (currentHideConfig: any, destinationHideConfig: any, actionPossible: any, stateChanged: any) => {},
  afterInit: () => {},
  afterLanguageChange: (languageCode: any) => {},
  afterListen: () => {},
  afterLoadData: (sourceData: any, firstTime: any, source: any) => {},
  afterMergeCells: (cellRange: any, mergeParent: any, auto: any) => {},
  beforeLoadingShow: () => {},
  afterLoadingShow: () => {},
  beforeLoadingHide: () => {},
  afterLoadingHide: () => {},
  modifySourceData: (row: any, col: any, valueHolder: any, ioMode: any) => {},
  afterModifyTransformEnd: (coords: any, rowTransformDir: any, colTransformDir: any) => {
    const row: number = coords.row;
    const col: number = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterModifyTransformFocus: (coords: any, rowTransformDir: any, colTransformDir: any) => {
    const row: number = coords.row;
    const col: number = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterModifyTransformStart: (coords: any, rowTransformDir: any, colTransformDir: any) => {
    const row: number = coords.row;
    const col: number = coords.col;
    const rowTransform: number = rowTransformDir;
    const colTransform: number = colTransformDir;
  },
  afterMomentumScroll: () => {},
  afterNamedExpressionAdded: (namedExpressionName: any, changes: any) => {},
  afterNamedExpressionRemoved: (namedExpressionName: any, changes: any) => {},
  afterOnCellContextMenu: (event: any, coords: any, TD: any) => {},
  afterOnCellCornerDblClick: (event: any) => {},
  afterOnCellCornerMouseDown: (event: any) => {},
  afterOnCellMouseDown: (event: any, coords: any, TD: any) => {},
  afterOnCellMouseOver: (event: any, coords: any, TD: any) => {},
  afterOnCellMouseOut: (event: any, coords: any, TD: any) => {},
  afterOnCellMouseUp: (event: any, coords: any, TD: any) => {},
  afterPageChange(oldPage: any, newPage: any) {
    const _oldPage: number = oldPage;
    const _newPage: number = newPage;
  },
  afterPageSizeChange(oldPageSize: any, newPageSize: any) {
    const _oldPageSize: number | 'auto' = oldPageSize;
    const _newPageSize: number | 'auto' = newPageSize;
  },
  afterPageSizeVisibilityChange(isVisible: any) {
    const _isVisible: boolean = isVisible;
  },
  afterPageCounterVisibilityChange(isVisible: any) {
    const _isVisible: boolean = isVisible;
  },
  afterPageNavigationVisibilityChange(isVisible: any) {
    const _isVisible: boolean = isVisible;
  },
  afterPaste: (data: any, coords: any) => {},
  afterPluginsInitialized: () => {},
  afterRedo: (action: any) => {},
  afterRedoStackChange: (undoneActionsBefore: any, undoneActionsAfter: any) => {},
  afterRefreshDimensions: (previousDimensions: any, currentDimensions: any, stateChanged: any) => {},
  afterRemoveCellMeta: (row: any, column: any, key: any, value: any) => {},
  afterRemoveCol: (index: any, amount: any, physicalColumns: any = [1, 2, 3], source: any) => {},
  afterRemoveRow: (index: any, amount: any, physicalRows: any = [1, 2, 3], source: any) => {},
  afterRender: (isForced: any) => {},
  afterRenderer: (TD: any, row: any, col: any, prop: any, value: any, cellProperties: any) => {},
  afterRowMove: (movedRows: any, finalIndex: any, dropIndex: any, movePossible: any,
    orderChanged: any) => movedRows.forEach((row: any) => row.toFixed(1) === finalIndex.toFixed(1)),
  afterRowResize: (newSize: any, row: any, isDoubleClick: any) => {},
  afterRowSequenceChange: (source: any) => {},
  afterRowSequenceCacheUpdate: (indexesChangesState: any) => {},
  afterScrollHorizontally: () => {},
  afterScrollVertically: () => {},
  afterScroll: () => {},
  afterSelectAll: (from: any, to: any, highlight: any) => {
    const _from: CellCoords = from;
    const _to: CellCoords = to;
    const _highlight: CellCoords | undefined = highlight;
  },
  afterSelectColumns: (from: any, to: any, highlight: any) => {
    const _from: CellCoords = from;
    const _to: CellCoords = to;
    const _highlight: CellCoords = highlight;
  },
  afterSelection: (r: any, c: any, r2: any, c2: any, preventScrolling: any, selectionLayerLevel: any) => preventScrolling.value = true,
  afterSelectionByProp: (r: any, p: any, r2: any, p2: any, preventScrolling: any, selectionLayerLevel: any) => preventScrolling.value = true,
  afterSelectionEnd: (r: any, c: any, r2: any, c2: any, selectionLayerLevel: any) => {},
  afterSelectionEndByProp: (r: any, p: any, r2: any, p2: any, selectionLayerLevel: any) => {},
  afterSelectionFocusSet: (row: any, column: any, preventScrolling: any) => {
    row.toFixed();
    column.toFixed();
    preventScrolling.value = true;
  },
  afterSelectRows: (from: any, to: any, highlight: any) => {},
  afterSetCellMeta: (row: any, col: any, key: any, value: any) => {},
  afterSetDataAtCell: (changes: any, source: any) => {},
  afterSetDataAtRowProp: (changes: any, source: any) => {},
  afterSetSourceDataAtCell: (changes: any, source: any) => {},
  afterSetTheme: (themeName: any, firstRun: any) => {},
  afterSheetAdded: (addedSheetDisplayName: any) => {},
  afterSheetRemoved: (removedSheetDisplayName: any, changes: any) => {},
  afterSheetRenamed: (oldDisplayName: any, newDisplayName: any) => {},
  afterTrimRow: (rows: any) => {},
  afterUndo: (action: any) => {},
  afterUndoStackChange: (doneActionsBefore: any, doneActionsAfter: any) => {},
  afterUnhideColumns: (currentHideConfig: any, destinationHideConfig: any, actionPossible: any, stateChanged: any) => {},
  afterUnhideRows: (currentHideConfig: any, destinationHideConfig: any, actionPossible: any, stateChanged: any) => {},
  afterUnlisten: () => {},
  afterUnmergeCells: (cellRange: any, auto: any) => {},
  afterUntrimRow: (rows: any) => {},
  afterUpdateData: (sourceData: any, firstTime: any, source: any) => {},
  afterUpdateSettings: () => {},
  afterValidate: () => {},
  afterViewportColumnCalculatorOverride: (calc: any) => {},
  afterViewportRowCalculatorOverride: (calc: any) => {},
  afterViewRender: (isForced: any) => {},
  beforeAddChild: (parent: any, element: any, index: any) => {},
  beforeAutofill: (start: any, end: any, data: any) => {},
  beforeBeginEditing: (row: number, column: number, initialValue: any, event: any, fullEditMode: boolean) => {
    event.preventDefault();

    return true;
  },
  beforeCellAlignment: (stateBefore: any, range: any, type: any, alignmentClass: any) => {},
  beforeChange: (changes: any, source: any) => { if (changes?.[0] !== null) { changes[0][3] = 10; } return false; },
  beforeChangeRender: (changes: any, source: any) => {},
  beforeColumnCollapse: (currentCollapsedColumn: any, destinationCollapsedColumns: any, collapsePossible: any) => {},
  beforeColumnExpand: (currentCollapsedColumn: any, destinationCollapsedColumns: any, expandPossible: any) => {},
  beforeColumnFreeze: (columnIndex: any, isFreezingPerformed: any) => false,
  beforeColumnMove: (columns: any, target: any) => {},
  beforeColumnResize: (newSize: any, column: any, isDoubleClick: any) => {},
  beforeColumnSort: (currentSortConfig: any, destinationSortConfigs: any) => {},
  beforeColumnWrap: (isActionInterrupted: any, newCoords: any, isColumnFlipped: any) => {
    const _isActionInterrupted: boolean = isActionInterrupted.value;
    const _isColumnFlipped: boolean = isColumnFlipped;

    isActionInterrupted.value = false;
    newCoords.clone();
  },
  beforeColumnUnfreeze: (columnIndex: any, isFreezingPerformed: any) => false,
  beforeContextMenuSetItems: (menuItems: any) => {},
  beforeContextMenuShow: (context: any) => {},
  beforeCopy: (data: any, coords: any) => { data.splice(0, 1); return false; },
  beforeCreateCol: (index: any, amount: any, source: any) => {},
  beforeCreateRow: (index: any, amount: any, source: any) => {},
  beforeCut: (data: any, coords: any) => { data.splice(0, 1); return false; },
  beforeDetachChild: (parent: any, element: any) => {},
  beforeDialogHide: () => {},
  beforeDialogShow: () => {},
  beforeDrawBorders: (corners: any, borderClassName: any) => {},
  beforeDropdownMenuSetItems: (menuItems: any) => {},
  beforeDropdownMenuShow: (instance: any) => {},
  beforeEmptyDataStateShow: () => {},
  beforeEmptyDataStateHide: () => {},
  beforeFilter: (conditionsStack: any, previousConditionStack: any) => { conditionsStack[0].conditions[0].name === 'begins_with'; },
  beforeGetCellMeta: (row: any, col: any, cellProperties: any) => {},
  beforeHeightChange: (height: any) => {
    const _height: number | string = height;

    return height;
  },
  beforeHideColumns: (currentHideConfig: any, destinationHideConfig: any, actionPossible: any) => {},
  beforeHideRows: (currentHideConfig: any, destinationHideConfig: any, actionPossible: any) => {},
  beforeHighlightingColumnHeader: (column: any, headerLevel: any, highlightMeta: any) => {
    const _column: number = column;
    const _headerLevel: number = headerLevel;
    const selectionType: string = highlightMeta.selectionType;
    const columnCursor: number = highlightMeta.columnCursor;
    const selectionWidth: number = highlightMeta.selectionWidth;

    return 10;
  },
  beforeHighlightingRowHeader: (row: any, headerLevel: any, highlightMeta: any) => {
    const _row: number = row;
    const _headerLevel: number = headerLevel;
    const selectionType: string = highlightMeta.selectionType;
    const columnCursor: number = highlightMeta.rowCursor;
    const selectionWidth: number = highlightMeta.selectionHeight;

    return 10;
  },
  beforeInit: () => {},
  beforeInitWalkontable: (walkontableConfig: any) => {},
  beforeKeyDown: (event: any) => {},
  beforeLanguageChange: (languageCode: any) => {},
  beforeLoadData: (sourceData: any, firstTime: any, source: any) => {},
  beforeMergeCells: (cellRange: any, auto: any) => {},
  beforeOnCellContextMenu: (event: any, coords: any, TD: any) => {},
  beforeOnCellMouseDown: (event: any, coords: any, TD: any, controller: any) => {},
  beforeOnCellMouseOut: (event: any, coords: any, TD: any) => {},
  beforeOnCellMouseOver: (event: any, coords: any, TD: any, controller: any) => {},
  beforeOnCellMouseUp: (event: any, coords: any, TD: any) => {},
  beforePageChange(oldPage: any, newPage: any) {
    const _oldPage: number = oldPage;
    const _newPage: number = newPage;

    return true;
  },
  beforePageSizeChange(oldPageSize: any, newPageSize: any) {
    const _oldPageSize: number | 'auto' = oldPageSize;
    const _newPageSize: number | 'auto' = newPageSize;

    return true;
  },
  beforePaste: (data: any, coords: any) => { data.splice(0, 1); return false; },
  beforeRedo: (action: any) => {},
  beforeRedoStackChange: (undoneActions: any) => {},
  beforeRefreshDimensions: (previousDimensions: any, currentDimensions: any, actionPossible: any) => {},
  beforeRemoveCellClassNames: () => {},
  beforeRemoveCellMeta: (row: any, column: any, key: any, value: any) => {},
  beforeRemoveCol: (index: any, amount: any, physicalColumns: any = [1, 2, 3], source: any) => {},
  beforeRemoveRow: (index: any, amount: any, physicalRows: any = [1, 2, 3], source: any) => {},
  beforeRender: (isForced: any) => {},
  beforeRenderer: (TD: any, row: any, col: any, prop: any, value: any, cellProperties: any) => {},
  beforeRowMove: (movedRows: any, finalIndex: any, dropIndex: any, movePossible: any) => {},
  beforeRowResize: (newSize: any, row: any, isDoubleClick: any) => {},
  beforeRowWrap: (isActionInterrupted: any, newCoords: any, isRowFlipped: any) => {
    const _isActionInterrupted: boolean = isActionInterrupted.value;
    const _isRowFlipped: boolean = isRowFlipped;

    isActionInterrupted.value = false;
    newCoords.clone();
  },
  beforeSelectAll: (from: any, to: any, highlight: any) => {
    const _from: CellCoords = from;
    const _to: CellCoords = to;
    const _highlight: CellCoords | undefined = highlight;
  },
  beforeSelectColumns: (from: any, to: any, highlight: any) => {
    const _from: CellCoords = from;
    const _to: CellCoords = to;
    const _highlight: CellCoords = highlight;
  },
  beforeSelectionFocusSet: (coords: any) => {
    const row: number = coords.row;
    const col: number = coords.col;
  },
  beforeSelectionHighlightSet: () => {},
  beforeSelectRows: (from: any, to: any, highlight: any) => {},
  beforeSetCellMeta: (row: any, col: any, key: any, value: any) => {},
  beforeSetRangeEnd: (coords: any) => {},
  beforeSetRangeStart: (coords: any) => {},
  beforeSetRangeStartOnly: (coords: any) => {},
  beforeStretchingColumnWidth: (stretchedWidth: any, column: any) => {
    const _stretchedWidth: number = stretchedWidth;
    const _column: number = column;
  },
  beforeTouchScroll: () => {},
  beforeTrimRow: (currentTrimConfig: any, destinationTrimConfig: any, actionPossible: any) => {},
  beforeUndo: (action: any) => {},
  beforeUndoStackChange: (doneActions: any, source: any) => {},
  beforeUnhideColumns: (currentHideConfig: any, destinationHideConfig: any, actionPossible: any) => {},
  beforeUnhideRows: (currentHideConfig: any, destinationHideConfig: any, actionPossible: any) => {},
  beforeUnmergeCells: (cellRange: any, auto: any) => {},
  beforeUntrimRow: (currentTrimConfig: any, destinationTrimConfig: any, actionPossible: any) => {},
  beforeUpdateData: (sourceData: any, firstTime: any, source: any) => {},
  beforeValidate: (value: any, row: any, prop: any, source: any) => {},
  beforeValueRender: (value: any) => {},
  beforeViewportScrollVertically: (visualRow: any, snapping: any) => {
    const _snapping: 'auto' | 'top' | 'bottom' = snapping;

    return visualRow === 0 ? visualRow + 1 : false;
  },
  beforeViewportScrollHorizontally: (visualColumn: any, snapping: any) => {
    const _snapping: 'auto' | 'start' | 'end' = snapping;

    return visualColumn === 0 ? visualColumn + 1 : false;
  },
  beforeViewportScroll: () => {},
  beforeViewRender: (isForced: any, skipRender: any) => {},
  beforeWidthChange: (width: any) => {
    const _width: number | string = width;

    return width;
  },
  construct: () => {},
  dialogFocusNextElement: () => {},
  dialogFocusPreviousElement: () => {},
  init: () => {},
  modifyAutoColumnSizeSeed: (seed: any, cellProperties: any, cellValue: any) => '1',
  modifyAutofillRange: (startArea: any, entireArea: any) => {},
  modifyColHeader: (column: any) => {},
  modifyColumnHeaderHeight: () => {},
  modifyColumnHeaderValue: (headerValue: any, visualColumnIndex: any, headerLevel: any) => {},
  modifyColWidth: (width: any, column: any, source: any) => {
    const _width: number = width;
    const _column: number = column;
    const _source: string | undefined = source;
  },
  modifyCopyableRange: (copyableRanges: any) => {},
  modifyFiltersMultiSelectValue: (value: any, meta: any) => '123',
  modifyFocusedElement: (row: any, column: any, focusedElement: any) => document.createElement('TD'),
  modifyData: () => {},
  modifyFocusOnTabNavigation: (tabActivationDir: any, visualCoords: any) => {},
  modifyGetCellCoords: (row: any, column: any, topmost: any, source: any) => {
    const _row: number = row;
    const _column: number = column;
    const _topmost: boolean = topmost;
    const _source: string = source ?? '';

    return [_row, _column, _row + 1, _column + 1];
  },
  modifyGetCoordsElement: (row: any, column: any) => {
    const _row: number = row;
    const _column: number = column;

    return [_row, _column];
  },
  modifyRowData: (row: any) => {},
  modifyRowHeader: (row: any) => {},
  modifyRowHeaderWidth: (rowHeaderWidth: any) => {},
  modifyRowHeight: (height: any, row: any, source: any) => {
    const _height: number = height;
    const _row: number = row;
    const _source: string | undefined = source;
  },
  modifyRowHeightByOverlayName: (height: any, row: any, overlayType: any) => {
    const _height: number = height;
    const _row: number = row;
    const _overlayType: string = overlayType;
  },
  modifyTransformEnd: (delta: any) => {
    const rowDelta: number = delta.row;
    const colDelta: number = delta.row;
  },
  modifyTransformFocus: (delta: any) => {
    const rowDelta: number = delta.row;
    const colDelta: number = delta.row;
  },
  modifyTransformStart: (delta: any) => {
    const rowDelta: number = delta.row;
    const colDelta: number = delta.row;
  },
  persistentStateLoad: () => {},
  persistentStateReset: () => {},
  persistentStateSave: () => {},
};
