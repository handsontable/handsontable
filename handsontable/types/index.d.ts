import Core from './core';
import {
  CellChange,
  CellValue,
  ChangeSource,
  NumericFormatOptions,
  RowObject,
  SelectOptionsObject,
  SourceRowData,
} from './common';
import {
  GridSettings,
  ColumnSettings,
  CellMeta,
  CellProperties,
} from './settings';
import * as RecordTranslation from './translations';
import {
  AutocompleteCellType,
  CellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  SelectCellType,
  TextCellType,
  TimeCellType,
  getCellType,
  registerCellType,
} from './cellTypes';
import {
  AutocompleteEditor,
  BaseEditor,
  CheckboxEditor,
  DateEditor,
  DropdownEditor,
  HandsontableEditor,
  NumericEditor,
  PasswordEditor,
  SelectEditor,
  TextEditor,
  TimeEditor,
  EditorType,
  getEditor,
  registerEditor,
} from './editors';
import {
  RendererType,
  autocompleteRenderer,
  dropdownRenderer,
  dateRenderer,
  baseRenderer,
  checkboxRenderer,
  htmlRenderer,
  handsontableRenderer,
  numericRenderer,
  passwordRenderer,
  selectRenderer,
  textRenderer,
  timeRenderer,
  getRenderer,
  registerRenderer,
} from './renderers';
import {
  ValidatorType,
  autocompleteValidator,
  dropdownValidator,
  dateValidator,
  numericValidator,
  timeValidator ,
  getValidator,
  registerValidator,
} from './validators';
import * as helper from './helpers';
import * as dom from './helpers/dom';
import CellCoords from './3rdparty/walkontable/src/cell/coords';
import CellRange from './3rdparty/walkontable/src/cell/range';
import EventManager from './eventManager';
import { Hooks, Events } from './core/hooks';
// plugins
import {
  AutoColumnSize as _AutoColumnSize,
  Settings as AutoColumnSizeSettings,
} from './plugins/autoColumnSize';
import {
  Autofill as _Autofill,
  Settings as AutofillSettings,
} from './plugins/autofill';
import {
  AutoRowSize as _AutoRowSize,
  Settings as AutoRowSizeSettings,
} from './plugins/autoRowSize';
import {
  BindRowsWithHeaders as _BindRowsWithHeaders,
  Settings as BindRowsWithHeadersSettings,
} from './plugins/bindRowsWithHeaders';
import {
  CollapsibleColumns as _CollapsibleColumns,
  Settings as CollapsibleColumnsSettings,
} from './plugins/collapsibleColumns';
import {
  ColumnSorting as _ColumnSorting,
  Settings as ColumnSortingSettings,
  SortOrderType as ColumnSortingSortOrderType,
  Config as ColumnSortingConfig,
} from './plugins/columnSorting';
import {
  ColumnSummary as _ColumnSummary,
  Settings as ColumnSummarySettings,
} from './plugins/columnSummary';
import {
  Comments as _Comments,
  CommentObject,
  Settings as CommentsSettings,
  CommentConfig,
} from './plugins/comments';
import {
  ContextMenu as _ContextMenu,
  Settings as ContextMenuSettings,
  Selection as ContextMenuSelection,
  PredefinedMenuItemKey as ContextMenuPredefinedMenuItemKey,
  MenuConfig as ContextMenuMenuConfig,
  MenuItemConfig as ContextMenuMenuItemConfig,
  SubmenuConfig as ContextMenuSubmenuConfig,
  SubmenuItemConfig as ContextMenuSubmenuItemConfig,
} from './plugins/contextMenu';
import {
  CopyPaste as _CopyPaste,
  Settings as CopyPasteSettings,
} from './plugins/copyPaste';
import {
  CustomBorders as _CustomBorders,
  Settings as CustomBordersSettings,
  BorderRange,
  BorderOptions,
} from './plugins/customBorders';
import {
  DragToScroll as _DragToScroll,
  Settings as DragToScrollSettings,
} from './plugins/dragToScroll';
import {
  DropdownMenu as _DropdownMenu,
  Settings as DropdownMenuSettings,
} from './plugins/dropdownMenu';
import {
  ExportFile as _ExportFile,
  Settings as ExportFileSettings,
} from './plugins/exportFile';
import {
  Filters as _Filters,
  Settings as FiltersSettings,
  ConditionId as FiltersConditionId,
  ConditionName as FiltersConditionName,
  OperationType as FiltersOperationType,
} from './plugins/filters';
import {
  Formulas as _Formulas,
  Settings as FormulasSettings,
  HyperFormulaSettings,
} from './plugins/formulas';
import {
  HiddenColumns as _HiddenColumns,
  Settings as HiddenColumnsSettings,
} from './plugins/hiddenColumns';
import {
  HiddenRows as _HiddenRows,
  Settings as HiddenRowsSettings,
} from './plugins/hiddenRows';
import {
  ManualColumnFreeze as _ManualColumnFreeze,
  Settings as ManualColumnFreezeSettings,
} from './plugins/manualColumnFreeze';
import {
  ManualColumnMove as _ManualColumnMove,
  Settings as ManualColumnMoveSettings,
} from './plugins/manualColumnMove';
import {
  ManualColumnResize as _ManualColumnResize,
  Settings as ManualColumnResizeSettings,
} from './plugins/manualColumnResize';
import {
  ManualRowMove as _ManualRowMove,
  Settings as ManualRowMoveSettings,
} from './plugins/manualRowMove';
import {
  ManualRowResize as _ManualRowResize,
  Settings as ManualRowResizeSettings,
} from './plugins/manualRowResize';
import {
  MergeCells as _MergeCells,
  Settings as MergeCellsSettings,
} from './plugins/mergeCells';
import {
  MultiColumnSorting as _MultiColumnSorting,
  Settings as MultiColumnSortingSettings,
  SortOrderType as MultiColumnSortingSortOrderType,
  Config as MultiColumnSortingConfig,
} from './plugins/multiColumnSorting';
import {
  MultipleSelectionHandles as _MultipleSelectionHandles,
  Settings as MultipleSelectionHandlesSettings,
} from './plugins/multipleSelectionHandles';
import {
  NestedHeaders as _NestedHeaders,
  Settings as NestedHeadersSettings,
} from './plugins/nestedHeaders';
import {
  NestedRows as _NestedRows,
  Settings as NestedRowsSettings,
} from './plugins/nestedRows';
import {
  PersistentState as _PersistentState,
  Settings as PersistentStateSettings,
} from './plugins/persistentState';
import {
  Search as _Search,
  Settings as SearchSettings,
  SearchCallback,
  SearchQueryMethod,
} from './plugins/search';
import {
  Settings as StretchColumnsSettings,
} from './plugins/stretchColumns';
import {
  TouchScroll as _TouchScroll,
  Settings as TouchScrollSettings,
} from './plugins/touchScroll';
import {
  TrimRows as _TrimRows,
  Settings as TrimRowsSettings,
} from './plugins/trimRows';
import {
  UndoRedo as _UndoRedo,
  Settings as UndoRedoSettings,
} from './plugins/undoRedo';
// i18n
import {
  LanguageDictionary,
  registerLanguageDictionary,
  getTranslatedPhrase,
  getLanguagesDictionaries,
  getLanguageDictionary,
} from './i18n';

declare const DefaultSettings: GridSettings;
declare const hooks: Hooks;

declare namespace Handsontable {
  export {
    // common
    CellValue,
    CellChange,
    RowObject,
    SelectOptionsObject,
    SourceRowData,
    ChangeSource,
    // cell types
    CellType,
    // editors
    EditorType,
    // renderers
    RendererType,
    // validators
    ValidatorType,
    // settings
    CellProperties,
    CellMeta,
    ColumnSettings,
    GridSettings,
    NumericFormatOptions,
    // coords
    CellCoords,
    CellRange,

    RecordTranslation,
  };

  export { helper };
  export { dom };
  export { hooks };
  export { Core };
  export { EventManager };
  export { DefaultSettings };

  export namespace languages {
    export { LanguageDictionary as dictionaryKeys };
    export { getLanguageDictionary };
    export { getLanguagesDictionaries };
    export { getTranslatedPhrase };
    export { registerLanguageDictionary };
  }

  export namespace cellTypes {
    export { AutocompleteCellType as autocomplete };
    export { CheckboxCellType as checkbox };
    export { DateCellType as date };
    export { DropdownCellType as dropdown };
    export { HandsontableCellType as handsontable };
    export { NumericCellType as numeric };
    export { PasswordCellType as password };
    export { TextCellType as text };
    export { SelectCellType as select };
    export { TimeCellType as time };
    export { registerCellType };
    export { getCellType };
  }

  export namespace editors {
    export { AutocompleteEditor };
    export { BaseEditor };
    export { CheckboxEditor };
    export { DateEditor };
    export { DropdownEditor };
    export { HandsontableEditor };
    export { NumericEditor };
    export { PasswordEditor };
    export { SelectEditor };
    export { TextEditor };
    export { TimeEditor };
    export { registerEditor };
    export { getEditor };
  }

  export namespace renderers {
    export { autocompleteRenderer as AutocompleteRenderer };
    export { dropdownRenderer as DropdownRenderer };
    export { baseRenderer as cellDecorator };
    export { baseRenderer as BaseRenderer };
    export { checkboxRenderer as CheckboxRenderer };
    export { htmlRenderer as HtmlRenderer };
    export { handsontableRenderer as HandsontableRenderer };
    export { numericRenderer as NumericRenderer };
    export { passwordRenderer as PasswordRenderer };
    export { textRenderer as TextRenderer };
    export { dateRenderer as DateRenderer };
    export { selectRenderer as SelectRenderer };
    export { timeRenderer as TimeRenderer };
    export { registerRenderer };
    export { getRenderer };
  }

  export namespace validators {
    export { autocompleteValidator as AutocompleteValidator };
    export { dropdownValidator as DropdownValidator };
    export { dateValidator as DateValidator };
    export { numericValidator as NumericValidator };
    export { timeValidator as TimeValidator };
    export { registerValidator };
    export { getValidator };
  }

  export namespace plugins {
    export class AutoColumnSize extends _AutoColumnSize {}
    export class Autofill extends _Autofill {}
    export class AutoRowSize extends _AutoRowSize {}
    export class BindRowsWithHeaders extends _BindRowsWithHeaders {}
    export class CollapsibleColumns extends _CollapsibleColumns {}
    export class ColumnSorting extends _ColumnSorting {}
    export class ColumnSummary extends _ColumnSummary {}
    export class Comments extends _Comments {}
    export class ContextMenu extends _ContextMenu {}
    export class CopyPaste extends _CopyPaste {}
    export class CustomBorders extends _CustomBorders {}
    export class DragToScroll extends _DragToScroll {}
    export class DropdownMenu extends _DropdownMenu {}
    export class ExportFile extends _ExportFile {}
    export class Filters extends _Filters {}
    export class Formulas extends _Formulas {}
    export class HiddenColumns extends _HiddenColumns {}
    export class HiddenRows extends _HiddenRows {}
    export class ManualColumnFreeze extends _ManualColumnFreeze {}
    export class ManualColumnMove extends _ManualColumnMove {}
    export class ManualColumnResize extends _ManualColumnResize {}
    export class ManualRowMove extends _ManualRowMove {}
    export class ManualRowResize extends _ManualRowResize {}
    export class MergeCells extends _MergeCells {}
    export class MultiColumnSorting extends _MultiColumnSorting {}
    export class MultipleSelectionHandles extends _MultipleSelectionHandles {}
    export class NestedHeaders extends _NestedHeaders {}
    export class NestedRows extends _NestedRows {}
    export class PersistentState extends _PersistentState {}
    export class Search extends _Search {}
    export class TouchScroll extends _TouchScroll {}
    export class TrimRows extends _TrimRows {}
    export class UndoRedo extends _UndoRedo {}

    export namespace AutoColumnSize {
      export { AutoColumnSizeSettings as Settings };
    }

    export namespace Autofill {
      export { AutofillSettings as Settings };
    }

    export namespace AutoRowSize {
      export { AutoRowSizeSettings as Settings };
    }

    export namespace BindRowsWithHeaders {
      export { BindRowsWithHeadersSettings as Settings };
    }

    export namespace CollapsibleColumns {
      export { CollapsibleColumnsSettings as Settings };
    }

    export namespace ColumnSorting {
      export { ColumnSortingSortOrderType as SortOrderType };
      export { ColumnSortingConfig as Config };
      export { ColumnSortingSettings as Settings };
    }

    export namespace ColumnSummary {
      export { ColumnSummarySettings as Settings };
    }

    export namespace Comments {
      export { CommentsSettings as Settings };
      export { CommentObject };
      export { CommentConfig };
    }

    export namespace ContextMenu {
      export { ContextMenuSettings as Settings };
      export { ContextMenuPredefinedMenuItemKey as PredefinedMenuItemKey };
      export { ContextMenuSelection as Selection };
      export { ContextMenuMenuConfig as MenuConfig };
      export { ContextMenuMenuItemConfig as MenuItemConfig };
      export { ContextMenuSubmenuConfig as SubmenuConfig };
      export { ContextMenuSubmenuItemConfig as SubmenuItemConfig };
    }

    export namespace CopyPaste {
      export { CopyPasteSettings as Settings };
    }

    export namespace CustomBorders {
      export { CustomBordersSettings as Settings };
      export { BorderOptions };
      export { BorderRange };
    }

    export namespace DragToScroll {
      export { DragToScrollSettings as Settings };
    }

    export namespace DropdownMenu {
      export { DropdownMenuSettings as Settings };
    }

    export namespace ExportFile {
      export { ExportFileSettings as Settings };
    }

    export namespace Filters {
      export { FiltersSettings as Settings };
      export { FiltersConditionId as ConditionId };
      export { FiltersConditionName as ConditionName };
      export { FiltersOperationType as OperationType };
    }

    export namespace Formulas {
      export { FormulasSettings as Settings };
      export { HyperFormulaSettings };
    }

    export namespace HiddenColumns {
      export { HiddenColumnsSettings as Settings };
    }

    export namespace HiddenRows {
      export { HiddenRowsSettings as Settings };
    }

    export namespace ManualColumnFreeze {
      export { ManualColumnFreezeSettings as Settings };
    }

    export namespace ManualColumnMove {
      export { ManualColumnMoveSettings as Settings };
    }

    export namespace ManualColumnResize {
      export { ManualColumnResizeSettings as Settings };
    }

    export namespace ManualRowMove {
      export { ManualRowMoveSettings as Settings };
    }

    export namespace ManualRowResize {
      export { ManualRowResizeSettings as Settings };
    }

    export namespace MergeCells {
      export { MergeCellsSettings as Settings };
    }

    export namespace MultiColumnSorting {
      export { MultiColumnSortingSettings as Settings };
      export { MultiColumnSortingSortOrderType as SortOrderType };
      export { MultiColumnSortingConfig as Config };
    }

    export namespace MultipleSelectionHandles {
      export { MultipleSelectionHandlesSettings as Settings };
    }

    export namespace NestedHeaders {
      export { NestedHeadersSettings as Settings };
    }

    export namespace NestedRows {
      export { NestedRowsSettings as Settings };
    }

    export namespace PersistentState {
      export { PersistentStateSettings as Settings };
    }

    export namespace Search {
      export { SearchSettings as Settings };
      export { SearchCallback };
      export { SearchQueryMethod };
    }

    export namespace StretchColumns {
      export { StretchColumnsSettings as Settings };
    }

    export namespace TouchScroll {
      export { TouchScrollSettings as Settings };
    }

    export namespace TrimRows {
      export { TrimRowsSettings as Settings };
    }

    export namespace UndoRedo {
      export { UndoRedoSettings as Settings };
    }
  }
}

declare class Handsontable extends Core {
  static baseVersion: string;
  static buildDate: string;
  static packageName: 'handsontable';
  static version: string;
}

export {
  CellCoords,
  CellRange,
  Events,
};
export default Handsontable;
