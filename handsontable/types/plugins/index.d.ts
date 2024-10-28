import { AutoColumnSize } from './autoColumnSize';
import { Autofill } from './autofill';
import { AutoRowSize } from './autoRowSize';
import { BasePlugin } from './base';
import { BindRowsWithHeaders } from './bindRowsWithHeaders';
import { CollapsibleColumns } from './collapsibleColumns';
import { ColumnSorting } from './columnSorting';
import { ColumnSummary } from './columnSummary';
import { Comments } from './comments';
import { ContextMenu } from './contextMenu';
import { CopyPaste } from './copyPaste';
import { CustomBorders } from './customBorders';
import { DragToScroll } from './dragToScroll';
import { DropdownMenu } from './dropdownMenu';
import { ExportFile } from './exportFile';
import { Filters } from './filters';
import { Formulas } from './formulas';
import { HiddenColumns } from './hiddenColumns';
import { HiddenRows } from './hiddenRows';
import { ManualColumnFreeze } from './manualColumnFreeze';
import { ManualColumnMove } from './manualColumnMove';
import { ManualColumnResize } from './manualColumnResize';
import { ManualRowMove } from './manualRowMove';
import { ManualRowResize } from './manualRowResize';
import { MergeCells } from './mergeCells';
import { MultiColumnSorting } from './multiColumnSorting';
import { MultipleSelectionHandles } from './multipleSelectionHandles';
import { NestedHeaders } from './nestedHeaders';
import { NestedRows } from './nestedRows';
import { PersistentState } from './persistentState';
import { Search } from './search';
import { TouchScroll } from './touchScroll';
import { TrimRows } from './trimRows';
import { UndoRedo } from './undoRedo';

export interface Plugins {
  autoColumnSize: AutoColumnSize;
  autofill: Autofill;
  autoRowSize: AutoRowSize;
  basePlugin: BasePlugin;
  bindRowsWithHeaders: BindRowsWithHeaders;
  collapsibleColumns: CollapsibleColumns;
  columnSorting: ColumnSorting;
  columnSummary: ColumnSummary;
  comments: Comments;
  contextMenu: ContextMenu;
  copyPaste: CopyPaste;
  customBorders: CustomBorders;
  dragToScroll: DragToScroll;
  dropdownMenu: DropdownMenu;
  exportFile: ExportFile;
  filters: Filters;
  formulas: Formulas;
  hiddenColumns: HiddenColumns;
  hiddenRows: HiddenRows;
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
  persistentState: PersistentState;
  search: Search;
  touchScroll: TouchScroll;
  trimRows: TrimRows;
  undoRedo: UndoRedo;
}

export { getPlugin, getPluginsNames, registerPlugin } from './registry';
export function registerAllPlugins(): void;

export {
  AutoColumnSize,
  Autofill,
  AutoRowSize,
  BasePlugin,
  BindRowsWithHeaders,
  CollapsibleColumns,
  ColumnSorting,
  ColumnSummary,
  Comments,
  ContextMenu,
  CopyPaste,
  CustomBorders,
  DragToScroll,
  DropdownMenu,
  ExportFile,
  Filters,
  Formulas,
  HiddenColumns,
  HiddenRows,
  ManualColumnFreeze,
  ManualColumnMove,
  ManualColumnResize,
  ManualRowMove,
  ManualRowResize,
  MergeCells,
  MultiColumnSorting,
  MultipleSelectionHandles,
  NestedHeaders,
  NestedRows,
  PersistentState,
  Search,
  TouchScroll,
  TrimRows,
  UndoRedo
};
