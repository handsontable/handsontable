import { AutoColumnSize } from './autoColumnSize';
import { Autofill } from './autofill';
import { AutoRowSize } from './autoRowSize';
export { BasePlugin } from './base';
import { BindRowsWithHeaders } from './bindRowsWithHeaders';
import { CollapsibleColumns } from './collapsibleColumns';
import { ColumnSorting } from './columnSorting';
import { ColumnSummary } from './columnSummary';
import { Comments } from './comments';
import { ContextMenu } from './contextMenu';
import { CopyPaste } from './copyPaste';
import { CustomBorders } from './customBorders';
import { DataProvider } from './dataProvider';
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
import { Pagination } from './pagination';
import { Search } from './search';
import { StretchColumns } from './stretchColumns';
import { TouchScroll } from './touchScroll';
import { TrimRows } from './trimRows';
import { UndoRedo } from './undoRedo';
import { Dialog } from './dialog';
import { Loading } from './loading';
import { Notification } from './notification';
import { EmptyDataState } from './emptyDataState';
import {
  registerPlugin,
} from './registry';

/**
 * Maps plugin name string literals to their constructor types for type-safe `getPlugin()` calls.
 * When adding a new plugin: import its class above, register it in `registerAllPlugins()`, add it
 * to the `export {}` block, and add one entry here — all in this file.
 */
declare module './registry' {
  interface PluginClassMap {
    autoColumnSize: typeof AutoColumnSize;
    autofill: typeof Autofill;
    autoRowSize: typeof AutoRowSize;
    bindRowsWithHeaders: typeof BindRowsWithHeaders;
    collapsibleColumns: typeof CollapsibleColumns;
    columnSorting: typeof ColumnSorting;
    columnSummary: typeof ColumnSummary;
    comments: typeof Comments;
    contextMenu: typeof ContextMenu;
    copyPaste: typeof CopyPaste;
    customBorders: typeof CustomBorders;
    dataProvider: typeof DataProvider;
    dragToScroll: typeof DragToScroll;
    dropdownMenu: typeof DropdownMenu;
    exportFile: typeof ExportFile;
    filters: typeof Filters;
    formulas: typeof Formulas;
    hiddenColumns: typeof HiddenColumns;
    hiddenRows: typeof HiddenRows;
    manualColumnFreeze: typeof ManualColumnFreeze;
    manualColumnMove: typeof ManualColumnMove;
    manualColumnResize: typeof ManualColumnResize;
    manualRowMove: typeof ManualRowMove;
    manualRowResize: typeof ManualRowResize;
    mergeCells: typeof MergeCells;
    multiColumnSorting: typeof MultiColumnSorting;
    multipleSelectionHandles: typeof MultipleSelectionHandles;
    nestedHeaders: typeof NestedHeaders;
    nestedRows: typeof NestedRows;
    pagination: typeof Pagination;
    search: typeof Search;
    stretchColumns: typeof StretchColumns;
    touchScroll: typeof TouchScroll;
    trimRows: typeof TrimRows;
    undoRedo: typeof UndoRedo;
    dialog: typeof Dialog;
    loading: typeof Loading;
    notification: typeof Notification;
    emptyDataState: typeof EmptyDataState;
  }
}

/**
 * Registers all available plugins.
 */
export function registerAllPlugins() {
  registerPlugin(AutoColumnSize);
  registerPlugin(Autofill);
  registerPlugin(AutoRowSize);
  registerPlugin(BindRowsWithHeaders);
  registerPlugin(CollapsibleColumns);
  registerPlugin(ColumnSorting);
  registerPlugin(ColumnSummary);
  registerPlugin(Comments);
  registerPlugin(ContextMenu);
  registerPlugin(CopyPaste);
  registerPlugin(CustomBorders);
  registerPlugin(DataProvider);
  registerPlugin(DragToScroll);
  registerPlugin(DropdownMenu);
  registerPlugin(ExportFile);
  registerPlugin(Filters);
  registerPlugin(Formulas);
  registerPlugin(HiddenColumns);
  registerPlugin(HiddenRows);
  registerPlugin(ManualColumnFreeze);
  registerPlugin(ManualColumnMove);
  registerPlugin(ManualColumnResize);
  registerPlugin(ManualRowMove);
  registerPlugin(ManualRowResize);
  registerPlugin(MergeCells);
  registerPlugin(MultiColumnSorting);
  registerPlugin(MultipleSelectionHandles);
  registerPlugin(NestedHeaders);
  registerPlugin(NestedRows);
  registerPlugin(Pagination);
  registerPlugin(Search);
  registerPlugin(StretchColumns);
  registerPlugin(TouchScroll);
  registerPlugin(TrimRows);
  registerPlugin(UndoRedo);
  registerPlugin(Dialog);
  registerPlugin(Loading);
  registerPlugin(Notification);
  registerPlugin(EmptyDataState);
}

export {
  AutoColumnSize,
  Autofill,
  AutoRowSize,
  BindRowsWithHeaders,
  CollapsibleColumns,
  ColumnSorting,
  ColumnSummary,
  Comments,
  ContextMenu,
  CopyPaste,
  CustomBorders,
  DataProvider,
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
  Pagination,
  Search,
  StretchColumns,
  TouchScroll,
  TrimRows,
  UndoRedo,
  Dialog,
  Loading,
  Notification,
  EmptyDataState,
};

export {
  getPlugin,
  getPluginsNames,
  registerPlugin,
} from './registry';
