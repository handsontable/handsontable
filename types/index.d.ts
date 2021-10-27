import {
  CellType as HyperFormulaCellType,
  ConfigParams,
  HyperFormula,
} from 'hyperformula';
import { default as _CellCoords } from './3rdparty/walkontable/src/cell/coords';
import { default as _CellRange } from './3rdparty/walkontable/src/cell/range';
import { OverlayType } from './3rdparty/walkontable/src';
import Core from './core';
import {
  GridSettings as _GridSettings,
  ColumnSettings as _ColumnSettings,
  CellSettings as _CellSettings,
  CellMeta as _CellMeta,
  CellProperties as _CellProperties,
} from './settings';
import {
  CellChange as _CellChange,
  CellValue as _CellValue,
  ChangeSource as _ChangeSource,
  NumericFormatOptions as _NumericFormatOptions,
  RowObject as _RowObject,
  SelectOptionsObject as _SelectOptionsObject,
  SourceRowData as _SourceRowData,
} from './common';
import { htmlToGridSettings, instanceToHTML } from './utils/parseTable';
import {
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  TextCellType,
  TimeCellType,
  CellType as _CellType,
  CellTypes,
  getCellType,
  registerCellType,
} from './cellTypes';
import { Editors, EditorType as _EditorType, getEditor, registerEditor } from './editors';
import { Renderers, RendererType as _RendererType, getRenderer, registerRenderer } from './renderers';
import { Validators, ValidatorType as _ValidatorType, getValidator, registerValidator } from './validators';
import { Plugins, getPlugin, registerPlugin } from './plugins';
import { Helper as _Helper } from './helpers';
import { Dom } from './helpers/dom';
import EventManager from './eventManager';
import { Hooks } from './pluginHooks';
// plugins
import {
  Settings as AutoColumnSizeSettings,
} from './plugins/autoColumnSize';
import {
  Settings as AutofillSettings,
} from './plugins/autofill';
import {
  Settings as AutoRowSizeSettings,
} from './plugins/autoRowSize';
import {
  Settings as BindRowsWithHeadersSettings,
} from './plugins/bindRowsWithHeaders';
import {
  Settings as CollapsibleColumnsSettings,
} from './plugins/collapsibleColumns';
import {
  Settings as ColumnSortingSettings,
  SortOrderType as ColumnSortingSortOrderType,
  Config as ColumnSortingConfig,
} from './plugins/columnSorting';
import {
  Settings as ColumnSummarySettings,
} from './plugins/columnSummary';
import {
  CommentObject as CommentsCommentObject,
  Settings as CommentsSettings,
  CommentConfig as CommentsCommentConfig,
} from './plugins/comments';
import {
  Settings as ContextMenuSettings,
  Selection as ContextMenuSelection,
  PredefinedMenuItemKey as ContextMenuPredefinedMenuItemKey,
  MenuConfig as ContextMenuMenuConfig,
  MenuItemConfig as ContextMenuMenuItemConfig,
  SubmenuConfig as ContextMenuSubmenuConfig,
  SubmenuItemConfig as ContextMenuSubmenuItemConfig,
} from './plugins/contextMenu';
import {
  Settings as CopyPasteSettings,
} from './plugins/copyPaste';
import {
  Settings as CustomBordersSettings,
  BorderRange as _BorderRange,
  BorderOptions as _BorderOptions,
} from './plugins/customBorders';
import {
  Settings as DragToScrollSettings,
} from './plugins/dragToScroll';
import {
  Settings as DropdownMenuSettings,
} from './plugins/dropdownMenu';
import {
  Settings as ExportFileSettings,
} from './plugins/exportFile';
import {
  Settings as FiltersSettings,
} from './plugins/filters';
import {
  Settings as FormulasSettings,
  HyperFormulaSettings as _HyperFormulaSettings,
} from './plugins/formulas';
import {
  Settings as HiddenColumnsSettings,
} from './plugins/hiddenColumns';
import {
  Settings as HiddenRowsSettings,
} from './plugins/hiddenRows';
import {
  Settings as ManualColumnFreezeSettings,
} from './plugins/manualColumnFreeze';
import {
  Settings as ManualColumnMoveSettings,
} from './plugins/manualColumnMove';
import {
  Settings as ManualColumnResizeSettings,
} from './plugins/manualColumnResize';
import {
  Settings as ManualRowMoveSettings,
} from './plugins/manualRowMove';
import {
  Settings as ManualRowResizeSettings,
} from './plugins/manualRowResize';
import {
  Settings as MergeCellsSettings,
} from './plugins/mergeCells';
import {
  Settings as MultiColumnSortingSettings,
  SortOrderType as MultiColumnSortingSortOrderType,
  Config as MultiColumnSortingConfig,
} from './plugins/multiColumnSorting';
import {
  Settings as MultipleSelectionHandlesSettings,
} from './plugins/multipleSelectionHandles';
import {
  Settings as NestedHeadersSettings,
} from './plugins/nestedHeaders';
import {
  Settings as NestedRowsSettings,
} from './plugins/nestedRows';
import {
  Settings as PersistentStateSettings,
} from './plugins/persistentState';
import {
  Settings as SearchSettings,
  SearchCallback as _SearchCallback,
  SearchQueryMethod as _SearchQueryMethod,
} from './plugins/search';
import {
  Settings as TouchScrollSettings,
} from './plugins/touchScroll';
import {
  Settings as TrimRowsSettings,
} from './plugins/trimRows';
import {
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

interface I18nModule {
  dictionaryKeys: LanguageDictionary;
  registerLanguageDictionary: typeof registerLanguageDictionary;
  getTranslatedPhrase: typeof getTranslatedPhrase;
  getLanguagesDictionaries: typeof getLanguagesDictionaries;
  getLanguageDictionary: typeof getLanguageDictionary;
}

interface CellTypesModule extends CellTypes {
  getCellType: typeof getCellType;
  registerCellType: typeof registerCellType;
}

interface EditorsModule {
  AutocompleteEditor: Editors['autocomplete'];
  BaseEditor: Editors['base'];
  CheckboxEditor: Editors['checkbox'];
  DateEditor: Editors['date'];
  DropdownEditor: Editors['dropdown'];
  HandsontableEditor: Editors['handsontable'];
  NumericEditor: Editors['numeric'];
  PasswordEditor: Editors['password'];
  SelectEditor: Editors['select'];
  TextEditor: Editors['text'];
  getEditor: typeof getEditor;
  registerEditor: typeof registerEditor;
}

interface RenderersModule {
  AutocompleteRenderer: Renderers['autocomplete'];
  BaseRenderer: Renderers['base'];
  CheckboxRenderer: Renderers['checkbox'];
  DateRenderer: Renderers['autocomplete'];
  DropdownRenderer: Renderers['autocomplete'];
  HandsontableRenderer: Renderers['autocomplete'];
  HtmlRenderer: Renderers['html'];
  NumericRenderer: Renderers['numeric'];
  PasswordRenderer: Renderers['password'];
  TextRenderer: Renderers['text'];
  TimeRenderer: Renderers['text'];
  getRenderer: typeof getRenderer;
  registerRenderer: typeof registerRenderer;
}

interface ValidatorsModule {
  AutocompleteValidator: Validators['autocomplete'];
  DateValidator: Validators['date'];
  DropdownValidator: Validators['autocomplete'];
  NumericValidator: Validators['numeric'];
  TimeValidator: Validators['time'];
  getValidator: typeof getValidator;
  registerValidator: typeof registerValidator;
}

interface PluginsModule {
  AutoColumnSize: Plugins['autoColumnSize'];
  Autofill: Plugins['autofill'];
  AutoRowSize: Plugins['autoRowSize'];
  BasePlugin: Plugins['basePlugin'];
  BindRowsWithHeaders: Plugins['bindRowsWithHeaders'];
  CollapsibleColumns: Plugins['collapsibleColumns'];
  ColumnSorting: Plugins['columnSorting'];
  ColumnSummary: Plugins['columnSummary'];
  Comments: Plugins['comments'];
  ContextMenu: Plugins['contextMenu'];
  CopyPaste: Plugins['copyPaste'];
  CustomBorders: Plugins['customBorders'];
  DragToScroll: Plugins['dragToScroll'];
  DropdownMenu: Plugins['dropdownMenu'];
  ExportFile: Plugins['exportFile'];
  Filters: Plugins['filters'];
  Formulas: Plugins['formulas'];
  HiddenColumns: Plugins['hiddenColumns'];
  HiddenRows: Plugins['hiddenRows'];
  ManualColumnFreeze: Plugins['manualColumnFreeze'];
  ManualColumnMove: Plugins['manualColumnMove'];
  ManualColumnResize: Plugins['manualColumnResize'];
  ManualRowMove: Plugins['manualRowMove'];
  ManualRowResize: Plugins['manualRowResize'];
  MergeCells: Plugins['mergeCells'];
  MultiColumnSorting: Plugins['multiColumnSorting'];
  MultipleSelectionHandles: Plugins['multipleSelectionHandles'];
  NestedHeaders: Plugins['nestedHeaders'];
  NestedRows: Plugins['nestedRows'];
  PersistentState: Plugins['persistentState'];
  Search: Plugins['search'];
  TouchScroll: Plugins['touchScroll'];
  TrimRows: Plugins['trimRows'];
  getPlugin: typeof getPlugin;
  registerPlugin: typeof registerPlugin;
}

declare namespace Handsontable {
  type CellValue = _CellValue;
  type CellChange = _CellChange;
  type RowObject = _RowObject;
  type SelectOptionsObject = _SelectOptionsObject;
  type SourceRowData = _SourceRowData;
  type ChangeSource = _ChangeSource;
  type CellType = _CellType;
  type EditorType = _EditorType;
  type RendererType = _RendererType;
  type ValidatorType = _ValidatorType;

  interface GridSettings extends _GridSettings {}
  interface CellProperties extends _CellProperties {}
  interface CellMeta extends _CellMeta {}
  interface ColumnSettings extends _ColumnSettings {}

  interface NumericFormatOptions extends _NumericFormatOptions {}

  namespace cellTypes {
    interface Autocomplete extends AutocompleteCellType {}
    interface Checkbox extends CheckboxCellType {}
    interface Date extends DateCellType {}
    interface Dropdown extends DropdownCellType {}
    interface Handsontable extends HandsontableCellType {}
    interface Numeric extends NumericCellType {}
    interface Password extends PasswordCellType {}
    interface Text extends TextCellType {}
    interface Time extends TimeCellType {}
  }

  // Plugin options
  namespace plugins {
    namespace AutoColumnSize {
      type Settings = AutoColumnSizeSettings;
    }

    namespace Autofill {
      type Settings = AutofillSettings;
    }

    namespace AutoRowSize {
      type Settings = AutoRowSizeSettings;
    }

    namespace BindRowsWithHeaders {
      type Settings = BindRowsWithHeadersSettings;
    }

    namespace CollapsibleColumns {
      type Settings = CollapsibleColumnsSettings;
    }

    namespace ColumnSorting {
      type SortOrderType = ColumnSortingSortOrderType;
      type Config = ColumnSortingConfig;
      type Settings = ColumnSortingSettings;
    }

    namespace ColumnSummary {
      type Settings = ColumnSummarySettings;
    }

    namespace Comments {
      type Settings = CommentsSettings;

      interface CommentObject extends CommentsCommentObject {}
      interface CommentConfig extends CommentsCommentConfig {}
    }

    namespace ContextMenu {
      type PredefinedMenuItemKey = ContextMenuPredefinedMenuItemKey;
      type Settings = ContextMenuSettings;

      interface Selection extends ContextMenuSelection {}
      interface MenuConfig extends ContextMenuMenuConfig {}
      interface MenuItemConfig extends ContextMenuMenuItemConfig {}
      interface SubmenuConfig extends ContextMenuSubmenuConfig {}
      interface SubmenuItemConfig extends ContextMenuSubmenuItemConfig {}
    }

    namespace CopyPaste {
      type Settings = CopyPasteSettings;
    }

    namespace CustomBorders {
      type BorderOptions = _BorderOptions;
      type BorderRange = _BorderRange;
      type Settings = CustomBordersSettings;
    }

    namespace DragToScroll {
      type Settings = DragToScrollSettings;
    }

    namespace ExportFile {
      type Settings = ExportFileSettings;
    }

    namespace Filters {
      type Settings = FiltersSettings;
    }

    namespace Formulas {
      type Settings = FormulasSettings;
      type HyperFormulaSettings = _HyperFormulaSettings;
    }

    namespace HiddenColumns {
      type Settings = HiddenColumnsSettings;
    }

    namespace HiddenRows {
      type Settings = HiddenRowsSettings;
    }

    namespace ManualColumnFreeze {
      type Settings = ManualColumnFreezeSettings;
    }

    namespace ManualColumnMove {
      type Settings = ManualColumnMoveSettings;
    }

    namespace ManualColumnResize {
      type Settings = ManualColumnResizeSettings;
    }

    namespace ManualRowMove {
      type Settings = ManualRowMoveSettings;
    }

    namespace ManualRowResize {
      type Settings = ManualRowResizeSettings;
    }

    namespace MergeCells {
      type Settings = MergeCellsSettings;
    }

    namespace MultiColumnSorting {
      type SortOrderType = MultiColumnSortingSortOrderType;
      type Config = MultiColumnSortingConfig;
      type Settings = MultiColumnSortingSettings;
    }

    namespace MultipleSelectionHandles {
      type Settings = MultipleSelectionHandlesSettings;
    }

    namespace NestedHeaders {
      type Settings = NestedHeadersSettings;
    }

    namespace NestedRows {
      type Settings = NestedRowsSettings;
    }

    namespace PersistentState {
      type Settings = PersistentStateSettings;
    }

    namespace Search {
      type Settings = SearchSettings;
      type SearchCallback = _SearchCallback;
      type SearchQueryMethod = _SearchQueryMethod;
    }

    namespace TrimRows {
      type Settings = TrimRowsSettings;
    }

    namespace UndoRedo {
      type Settings = UndoRedoSettings;
    }
  }
}

interface Helper extends _Helper {
  htmlToGridSettings: typeof htmlToGridSettings;
  instanceToHTML: typeof instanceToHTML;
}

declare class Handsontable extends Core {
  static baseVersion: string;
  static buildDate: string;
  static packageName: 'handsontable';
  static version: string;
  static cellTypes: CellTypesModule;
  static languages: I18nModule;
  static dom: Dom;
  static editors: EditorsModule;
  static helper: Helper;
  static hooks: Hooks;
  static plugins: PluginsModule;
  static renderers: RenderersModule;
  static validators: ValidatorsModule;
  static Core: typeof Core;
  static EventManager: typeof EventManager;
  static DefaultSettings: _GridSettings;
}

export default Handsontable;
