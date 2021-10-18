import { Events } from './pluginHooks';

/**
 * Additional cell-specific meta data.
 */
interface CellMeta extends ColumnSettings {
  valid?: boolean;
  comment?: comments.CommentObject;
  isSearchResult?: boolean;
  hidden?: boolean;
  skipRowOnPaste?: boolean;
}

/**
 * A rendered cell object with computed properties.
 */
interface CellProperties extends CellMeta {
  row: number;
  col: number;
  instance: Handsontable;
  visualRow: number;
  visualCol: number;
  prop: string | number;
}

/**
 * Column settings inherit grid settings but overload the meaning of `data` to be specific to each column.
 */
interface ColumnSettings extends Omit<GridSettings, "data"> {
  data?: string | number | ColumnDataGetterSetterFunction;
  /**
   * Column and cell meta data is extensible, developers can add any properties they want.
   */
  [key: string]: any;
}

interface CellSettings extends CellMeta {
  row: number;
  col: number;
}

/**
 * Base table settings that will cascade to columns and cells.
 */
export interface GridSettings extends Events {
  activeHeaderClassName?: string;
  allowEmpty?: boolean;
  allowHtml?: boolean;
  allowInsertColumn?: boolean;
  allowInsertRow?: boolean;
  allowInvalid?: boolean;
  allowRemoveColumn?: boolean;
  allowRemoveRow?: boolean;
  autoColumnSize?: autoColumnSize.Settings | boolean;
  autoRowSize?: autoRowSize.Settings | boolean;
  autoWrapCol?: boolean;
  autoWrapRow?: boolean;
  bindRowsWithHeaders?: boolean | 'loose' | 'strict';
  cell?: CellSettings[];
  cells?: (this: CellProperties, row: number, column: number, prop: string | number) => CellMeta;
  checkedTemplate?: boolean | string | number;
  className?: string | string[];
  colHeaders?: boolean | string[] | ((index: number) => string);
  collapsibleColumns?: boolean | collapsibleColumns.Settings[];
  columnHeaderHeight?: number | (number | undefined)[];
  columns?: ColumnSettings[] | ((index: number) => ColumnSettings);
  columnSorting?: boolean | columnSorting.Settings;
  columnSummary?: columnSummary.Settings[] | (() => columnSummary.Settings[]);
  colWidths?: number | string | number[] | string[] | undefined[] | (number | string | undefined)[] | ((index: number) => string | number | undefined);
  commentedCellClassName?: string;
  comments?: boolean | comments.Settings | comments.CommentConfig[];
  contextMenu?: boolean | contextMenu.PredefinedMenuItemKey[] | contextMenu.Settings;
  copyable?: boolean;
  copyPaste?: boolean | copyPaste.Settings;
  correctFormat?: boolean;
  currentColClassName?: string;
  currentHeaderClassName?: string;
  currentRowClassName?: string;
  customBorders?: boolean | customBorders.Settings[];
  data?: CellValue[][] | RowObject[];
  dataSchema?: RowObject | CellValue[] | ((row: number) => RowObject | CellValue[]);
  dateFormat?: string;
  datePickerConfig?: PikadayOptions;
  defaultDate?: string;
  disableVisualSelection?: boolean | 'current' | 'area' | 'header' | ('current' | 'area' | 'header')[];
  dragToScroll?: boolean;
  dropdownMenu?: boolean | contextMenu.PredefinedMenuItemKey[] | contextMenu.Settings;
  editor?: EditorType | typeof _editors.Base | boolean | string;
  enterBeginsEditing?: boolean;
  enterMoves?: wot.CellCoords | ((event: KeyboardEvent) => wot.CellCoords);
  fillHandle?: boolean | 'vertical' | 'horizontal' | autoFill.Settings;
  filter?: boolean;
  filteringCaseSensitive?: boolean;
  filters?: boolean;
  fixedColumnsLeft?: number;
  fixedRowsBottom?: number;
  fixedRowsTop?: number;
  formulas?: boolean | formulas.Settings;
  fragmentSelection?: boolean | 'cell';
  height?: number | string | (() => number | string);
  hiddenColumns?: boolean | hiddenColumns.Settings;
  hiddenRows?: boolean | hiddenRows.Settings;
  invalidCellClassName?: string;
  isEmptyCol?: (this: _Handsontable.Core, col: number) => boolean;
  isEmptyRow?: (this: _Handsontable.Core, row: number) => boolean;
  label?: LabelOptions;
  language?: string;
  licenseKey?: string | 'non-commercial-and-evaluation';
  manualColumnFreeze?: boolean;
  manualColumnMove?: boolean | number[];
  manualColumnResize?: boolean | number[];
  manualRowMove?: boolean | number[];
  manualRowResize?: boolean | number[];
  maxCols?: number;
  maxRows?: number;
  mergeCells?: boolean | mergeCells.Settings[];
  minCols?: number;
  minRows?: number;
  minSpareCols?: number;
  minSpareRows?: number;
  multiColumnSorting?: boolean | multiColumnSorting.Settings;
  nestedHeaders?: (string | nestedHeaders.NestedHeader)[][];
  nestedRows?: boolean;
  noWordWrapClassName?: string;
  numericFormat?: NumericFormatOptions;
  observeDOMVisibility?: boolean;
  outsideClickDeselects?: boolean | ((target: HTMLElement) => boolean);
  persistentState?: boolean;
  placeholder?: string;
  placeholderCellClassName?: string;
  preventOverflow?: boolean | 'vertical' | 'horizontal';
  preventWheel?: boolean;
  readOnly?: boolean;
  readOnlyCellClassName?: string;
  renderAllRows?: boolean;
  renderer?: RendererType | string | renderers.Base;
  rowHeaders?: boolean | string[] | ((index: number) => string);
  rowHeaderWidth?: number | number[];
  rowHeights?: number | string | number[] | string[] | undefined[] | (number | string | undefined)[] | ((index: number) => string | number | undefined);
  search?: boolean | search.Settings;
  selectionMode?: 'single' | 'range' | 'multiple';
  selectOptions?: string[] | SelectOptionsObject | ((visualRow: number, visualColumn: number, prop: string | number) => string[] | SelectOptionsObject);
  skipColumnOnPaste?: boolean;
  skipRowOnPaste?: boolean;
  sortByRelevance?: boolean;
  source?: string[] | number[] | ((this: CellProperties, query: string, callback: (items: string[]) => void) => void);
  startCols?: number;
  startRows?: number;
  stretchH?: 'none' | 'all' | 'last';
  strict?: boolean;
  tableClassName?: string | string[];
  tabMoves?: wot.CellCoords | ((event: KeyboardEvent) => wot.CellCoords);
  title?: string;
  trimDropdown?: boolean;
  trimRows?: boolean | number[];
  trimWhitespace?: boolean;
  type?: CellType | string;
  uncheckedTemplate?: boolean | string | number;
  undo?: boolean;
  validator?: validators.Base | RegExp | ValidatorType | string;
  viewportColumnRenderingOffset?: number | 'auto';
  viewportRowRenderingOffset?: number | 'auto';
  visibleRows?: number;
  width?: number | string | (() => number | string);
  wordWrap?: boolean;
}
