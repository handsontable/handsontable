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
import { StretchColumns } from './stretchColumns';
import { TouchScroll } from './touchScroll';
import { TrimRows } from './trimRows';
import { UndoRedo } from './undoRedo';
import {
  registerPlugin,
} from './registry';

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
  registerPlugin(PersistentState);
  registerPlugin(Search);
  registerPlugin(StretchColumns);
  registerPlugin(TouchScroll);
  registerPlugin(TrimRows);
  registerPlugin(UndoRedo);
}

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
  StretchColumns,
  TouchScroll,
  TrimRows,
  UndoRedo,
};

export {
  getPlugin,
  getPluginsNames,
  registerPlugin,
} from './registry';
