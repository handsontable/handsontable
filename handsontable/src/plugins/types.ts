/**
 * Registry mapping plugin keys to their class types.
 * Used by HotInstance.getPlugin() to provide a typed return value.
 *
 * Keeping all plugin imports in one place avoids polluting src/common.ts
 * with 40+ plugin-specific import statements.
 */
import type { AutoColumnSize } from './autoColumnSize';
import type { Autofill } from './autofill';
import type { AutoRowSize } from './autoRowSize';
import type { BindRowsWithHeaders } from './bindRowsWithHeaders';
import type { CollapsibleColumns } from './collapsibleColumns';
import type { ColumnSorting } from './columnSorting';
import type { ColumnSummary } from './columnSummary';
import type { Comments } from './comments';
import type { ContextMenu } from './contextMenu';
import type { CopyPaste } from './copyPaste';
import type { CustomBorders } from './customBorders';
import type { DataProvider } from './dataProvider';
import type { Dialog } from './dialog';
import type { DragToScroll } from './dragToScroll';
import type { DropdownMenu } from './dropdownMenu';
import type { EmptyDataState } from './emptyDataState';
import type { ExportFile } from './exportFile';
import type { Filters } from './filters';
import type { Formulas } from './formulas';
import type { HiddenColumns } from './hiddenColumns';
import type { HiddenRows } from './hiddenRows';
import type { Loading } from './loading';
import type { ManualColumnFreeze } from './manualColumnFreeze';
import type { ManualColumnMove } from './manualColumnMove';
import type { ManualColumnResize } from './manualColumnResize';
import type { ManualRowMove } from './manualRowMove';
import type { ManualRowResize } from './manualRowResize';
import type { MergeCells } from './mergeCells';
import type { MultiColumnSorting } from './multiColumnSorting';
import type { MultipleSelectionHandles } from './multipleSelectionHandles';
import type { NestedHeaders } from './nestedHeaders';
import type { NestedRows } from './nestedRows';
import type { Notification } from './notification';
import type { Pagination } from './pagination';
import type { Search } from './search';
import type { StretchColumns } from './stretchColumns';
import type { TouchScroll } from './touchScroll';
import type { TrimRows } from './trimRows';
import type { UndoRedo } from './undoRedo';

/**
 * Maps plugin keys (as passed to getPlugin()) to their plugin class types.
 * Extend this interface via module augmentation when adding new plugins.
 */
export interface PluginTypeMap {
  autoColumnSize: AutoColumnSize;
  autofill: Autofill;
  autoRowSize: AutoRowSize;
  bindRowsWithHeaders: BindRowsWithHeaders;
  collapsibleColumns: CollapsibleColumns;
  columnSorting: ColumnSorting;
  columnSummary: ColumnSummary;
  comments: Comments;
  contextMenu: ContextMenu;
  copyPaste: CopyPaste;
  customBorders: CustomBorders;
  dataProvider: DataProvider;
  dialog: Dialog;
  dragToScroll: DragToScroll;
  dropdownMenu: DropdownMenu;
  emptyDataState: EmptyDataState;
  exportFile: ExportFile;
  filters: Filters;
  formulas: Formulas;
  hiddenColumns: HiddenColumns;
  hiddenRows: HiddenRows;
  loading: Loading;
  manualColumnFreeze: ManualColumnFreeze;
  manualColumnMove: ManualColumnMove;
  manualColumnResize: ManualColumnResize;
  manualRowMove: ManualRowMove;
  manualRowResize: ManualRowResize;
  mergeCells: MergeCells;
  multiColumnSorting: MultiColumnSorting;
  multipleSelectionHandles: MultipleSelectionHandles;
  nestedHeaders: NestedHeaders;
  nestedRows: NestedRows;
  notification: Notification;
  pagination: Pagination;
  search: Search;
  stretchColumns: StretchColumns;
  touchScroll: TouchScroll;
  trimRows: TrimRows;
  undoRedo: UndoRedo;
}
