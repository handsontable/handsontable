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
  CellValue as _CellValue,
  CellChange as _CellChange,
  RowObject as _RowObject,
  SelectOptionsObject as _SelectOptionsObject,
  SourceRowData as _SourceRowData,
  ChangeSource as _ChangeSource,
} from './common';
import { CellTypes, CellType as _CellType, getCellType, registerCellType } from './cellTypes';
import { Editors, EditorType as _EditorType, getEditor, registerEditor } from './editors';
import { Renderers, RendererType as _RendererType, getRenderer, registerRenderer } from './renderers';
import { Validators, ValidatorType as _ValidatorType, getValidator, registerValidator } from './validators';
import { Plugins, getPlugin, registerPlugin } from './plugins';
import { Helper } from './helpers';
import { Dom } from './helpers/dom';
import EventManager from './eventManager';
import { Hooks } from './pluginHooks';
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

interface EditorsModule extends Editors {
  getEditor: typeof getEditor;
  registerEditor: typeof registerEditor;
}

interface RenderersModule extends Renderers {
  getRenderer: typeof getRenderer;
  registerRenderer: typeof registerRenderer;
}

interface ValidatorsModule extends Validators {
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
