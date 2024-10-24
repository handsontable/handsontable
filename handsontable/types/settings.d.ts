import { PikadayOptions } from '@handsontable/pikaday';
import Core from './core';
import { Events } from './core/hooks';
import {
  CellValue,
  ColumnDataGetterSetterFunction,
  LabelOptions,
  NumericFormatOptions,
  RowObject,
  SelectOptionsObject,
  SimpleCellCoords,
} from './common';
import CellCoords from './3rdparty/walkontable/src/cell/coords';
import { Settings as AutoColumnSizeSettings } from './plugins/autoColumnSize';
import { Settings as AutofillSettings } from './plugins/autofill';
import { Settings as AutoRowSizeSettings } from './plugins/autoRowSize';
import { Settings as BindRowsWithHeadersSettings } from './plugins/bindRowsWithHeaders';
import { Settings as CollapsibleColumnsSettings } from './plugins/collapsibleColumns';
import { Settings as ColumnSortingSettings } from './plugins/columnSorting';
import { Settings as ColumnSummarySettings } from './plugins/columnSummary';
import { Settings as CommentsSettings, CommentObject } from './plugins/comments';
import { Settings as ContextMenuSettings } from './plugins/contextMenu';
import { Settings as CopyPasteSettings } from './plugins/copyPaste';
import { Settings as CustomBordersSettings } from './plugins/customBorders';
import { Settings as DragToScrollSettings } from './plugins/dragToScroll';
import { Settings as DropdownMenuSettings } from './plugins/dropdownMenu';
import { Settings as FiltersSettings } from './plugins/filters';
import { Settings as FormulasSettings } from './plugins/formulas';
import { Settings as HiddenColumnsSettings } from './plugins/hiddenColumns';
import { Settings as HiddenRowsSettings } from './plugins/hiddenRows';
import { Settings as manualColumnFreezeSettings } from './plugins/manualColumnFreeze';
import { Settings as manualColumnMoveSettings } from './plugins/manualColumnMove';
import { Settings as manualColumnResizeSettings } from './plugins/manualColumnResize';
import { Settings as manualRowMoveSettings } from './plugins/manualRowMove';
import { Settings as manualRowResizeSettings } from './plugins/manualRowResize';
import { Settings as MergeCellsSettings } from './plugins/mergeCells';
import { Settings as MultiColumnSortingSettings } from './plugins/multiColumnSorting';
import { Settings as NestedHeadersSettings } from './plugins/nestedHeaders';
import { Settings as NestedRowsSettings } from './plugins/nestedRows';
import { Settings as PersistentStateSettings } from './plugins/persistentState';
import { Settings as SearchSettings } from './plugins/search';
import { Settings as TrimRowsSettings } from './plugins/trimRows';
import { Settings as UndoRedoSettings } from './plugins/undoRedo';
import { EditorType, BaseEditor } from './editors';
import { RendererType } from './renderers';
import { BaseRenderer } from './renderers/base';
import { ValidatorType } from './validators';
import { BaseValidator } from './validators/base';
import { CellType } from './cellTypes';

/**
 * Additional cell-specific meta data.
 */
export interface CellMeta extends ColumnSettings {
  valid?: boolean;
  comment?: CommentObject;
  isSearchResult?: boolean;
  hidden?: boolean;
  skipRowOnPaste?: boolean;
}

/**
 * A rendered cell object with computed properties.
 */
export interface CellProperties extends CellMeta {
  row: number;
  col: number;
  instance: Core;
  visualRow: number;
  visualCol: number;
  prop: string | number;
}

/**
 * @package
 * Omit properties K from T
 */
export type Omit<T, K extends keyof T> = Pick<T, ({ [P in keyof T]: P } & { [P in K]: never } & { [x: string]: never, [x: number]: never })[keyof T]>;

/**
 * Column settings inherit grid settings but overload the meaning of `data` to be specific to each column.
 */
export interface ColumnSettings extends Omit<GridSettings, "data"> {
  data?: string | number | ColumnDataGetterSetterFunction;
  /**
   * Column and cell meta data is extensible, developers can add any properties they want.
   */
  [key: string]: any;
}

export interface CellSettings extends CellMeta {
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
  ariaTags?: boolean;
  autoColumnSize?: AutoColumnSizeSettings;
  autoRowSize?: AutoRowSizeSettings;
  autoWrapCol?: boolean;
  autoWrapRow?: boolean;
  bindRowsWithHeaders?: BindRowsWithHeadersSettings;
  cell?: CellSettings[];
  cells?: (this: CellProperties, row: number, column: number, prop: string | number) => CellMeta;
  checkedTemplate?: boolean | string | number;
  className?: string | string[];
  colHeaders?: boolean | string[] | ((index: number) => string);
  collapsibleColumns?: CollapsibleColumnsSettings;
  columnHeaderHeight?: number | Array<number | undefined>;
  columns?: ColumnSettings[] | ((index: number) => ColumnSettings);
  columnSorting?: ColumnSortingSettings;
  columnSummary?: ColumnSummarySettings;
  colWidths?: number | string | number[] | string[] | undefined[] | Array<number | string | undefined> | ((index: number) => string | number | undefined);
  commentedCellClassName?: string;
  comments?: CommentsSettings;
  contextMenu?: ContextMenuSettings;
  copyable?: boolean;
  copyPaste?: CopyPasteSettings;
  correctFormat?: boolean;
  currentColClassName?: string;
  currentHeaderClassName?: string;
  currentRowClassName?: string;
  customBorders?: CustomBordersSettings;
  data?: CellValue[][] | RowObject[];
  dataDotNotation?: boolean;
  dataSchema?: RowObject | CellValue[] | ((row: number) => RowObject | CellValue[]);
  dateFormat?: string;
  datePickerConfig?: PikadayOptions;
  defaultDate?: string;
  tabNavigation?: boolean;
  disableVisualSelection?: boolean | 'current' | 'area' | 'header' | Array<'current' | 'area' | 'header'>;
  dragToScroll?: DragToScrollSettings;
  dropdownMenu?: DropdownMenuSettings;
  editor?: EditorType | typeof BaseEditor | boolean | string;
  enterBeginsEditing?: boolean;
  enterMoves?: CellCoords | SimpleCellCoords | ((event: KeyboardEvent) => CellCoords | SimpleCellCoords);
  fillHandle?: AutofillSettings;
  filter?: boolean;
  filteringCaseSensitive?: boolean;
  filters?: FiltersSettings;
  fixedColumnsLeft?: number;
  fixedColumnsStart?: number;
  fixedRowsBottom?: number;
  fixedRowsTop?: number;
  formulas?: FormulasSettings;
  fragmentSelection?: boolean | 'cell';
  headerClassName?: string;
  height?: number | string | (() => number | string);
  hiddenColumns?: HiddenColumnsSettings;
  hiddenRows?: HiddenRowsSettings;
  invalidCellClassName?: string;
  imeFastEdit?: boolean;
  isEmptyCol?: (this: Core, column: number) => boolean;
  isEmptyRow?: (this: Core, row: number) => boolean;
  label?: LabelOptions;
  language?: string;
  locale?: string;
  layoutDirection?: 'ltr' | 'rtl' | 'inherit';
  licenseKey?: string | 'non-commercial-and-evaluation';
  manualColumnFreeze?: manualColumnFreezeSettings;
  manualColumnMove?: manualColumnMoveSettings;
  manualColumnResize?: manualColumnResizeSettings;
  manualRowMove?: manualRowMoveSettings;
  manualRowResize?: manualRowResizeSettings;
  maxCols?: number;
  maxRows?: number;
  mergeCells?: MergeCellsSettings;
  minCols?: number;
  minRows?: number;
  minSpareCols?: number;
  minSpareRows?: number;
  multiColumnSorting?: MultiColumnSortingSettings;
  navigableHeaders?: boolean;
  nestedHeaders?: NestedHeadersSettings;
  nestedRows?: NestedRowsSettings;
  noWordWrapClassName?: string;
  numericFormat?: NumericFormatOptions;
  observeDOMVisibility?: boolean;
  outsideClickDeselects?: boolean | ((target: HTMLElement) => boolean);
  persistentState?: PersistentStateSettings;
  placeholder?: string;
  placeholderCellClassName?: string;
  preventOverflow?: boolean | 'vertical' | 'horizontal';
  preventWheel?: boolean;
  readOnly?: boolean;
  readOnlyCellClassName?: string;
  renderAllColumns?: boolean;
  renderAllRows?: boolean;
  renderer?: RendererType | string | BaseRenderer;
  rowHeaders?: boolean | string[] | ((index: number) => string);
  rowHeaderWidth?: number | number[];
  rowHeights?: number | string | number[] | string[] | undefined[] | Array<number | string | undefined> | ((index: number) => string | number | undefined);
  search?: SearchSettings;
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
  tabMoves?: CellCoords | SimpleCellCoords | ((event: KeyboardEvent) => CellCoords | SimpleCellCoords);
  themeName?: string;
  title?: string;
  trimDropdown?: boolean;
  trimRows?: TrimRowsSettings;
  trimWhitespace?: boolean;
  type?: CellType | string;
  uncheckedTemplate?: boolean | string | number;
  undo?: UndoRedoSettings;
  validator?: BaseValidator | RegExp | ValidatorType | string;
  viewportColumnRenderingOffset?: number | 'auto';
  viewportRowRenderingOffset?: number | 'auto';
  viewportColumnRenderingThreshold?: number | 'auto';
  viewportRowRenderingThreshold?: number | 'auto';
  visibleRows?: number;
  width?: number | string | (() => number | string);
  wordWrap?: boolean;
}
