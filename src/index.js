import Handsontable from './base';
import EventManager, { getListenersCounter } from './eventManager';
import { getRegisteredMapsCounter } from './translations/mapCollection';
import Hooks from './pluginHooks';
import { metaSchemaFactory } from './dataMap/index';

import jQueryWrapper from './helpers/wrappers/jquery';

import GhostTable from './utils/ghostTable';
import * as parseTableHelpers from './utils/parseTable';
import * as arrayHelpers from './helpers/array';
import * as browserHelpers from './helpers/browser';
import * as dataHelpers from './helpers/data';
import * as dateHelpers from './helpers/date';
import * as featureHelpers from './helpers/feature';
import * as functionHelpers from './helpers/function';
import * as mixedHelpers from './helpers/mixed';
import * as numberHelpers from './helpers/number';
import * as objectHelpers from './helpers/object';
import * as stringHelpers from './helpers/string';
import * as unicodeHelpers from './helpers/unicode';
import * as domHelpers from './helpers/dom/element';
import * as domEventHelpers from './helpers/dom/event';

import {
  getRegisteredEditorNames,
  getEditor,
  registerEditor,
  AutocompleteEditor,
  AUTOCOMPLETE_EDITOR,
  BaseEditor,
  BASE_EDITOR,
  CheckboxEditor,
  CHECKBOX_EDITOR,
  DateEditor,
  DATE_EDITOR,
  DropdownEditor,
  DROPDOWN_EDITOR,
  HandsontableEditor,
  HANDSONTABLE_EDITOR,
  NumericEditor,
  NUMERIC_EDITOR,
  PasswordEditor,
  PASSWORD_EDITOR,
  SelectEditor,
  SELECT_EDITOR,
  TextEditor,
  TEXT_EDITOR,
} from './editors';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
  baseRenderer,
  BASE_RENDERER,
  autocompleteRenderer,
  AUTOCOMPLETE_RENDERER,
  checkboxRenderer,
  CHECKBOX_RENDERER,
  htmlRenderer,
  HTML_RENDERER,
  numericRenderer,
  NUMERIC_RENDERER,
  passwordRenderer,
  PASSWORD_RENDERER,
  textRenderer,
  TEXT_RENDERER,
} from './renderers';
import {
  getRegisteredValidatorNames,
  getValidator,
  registerValidator,
  autocompleteValidator,
  AUTOCOMPLETE_VALIDATOR,
  dateValidator,
  DATE_VALIDATOR,
  numericValidator,
  NUMERIC_VALIDATOR,
  timeValidator,
  TIME_VALIDATOR,
} from './validators';
import {
  getRegisteredCellTypeNames,
  getCellType,
  registerCellType,
  AutocompleteCellType,
  AUTOCOMPLETE_TYPE,
  CheckboxCellType,
  CHECKBOX_TYPE,
  DateCellType,
  DATE_TYPE,
  DropdownCellType,
  DROPDOWN_TYPE,
  HandsontableCellType,
  HANDSONTABLE_TYPE,
  NumericCellType,
  NUMERIC_TYPE,
  PasswordCellType,
  PASSWORD_TYPE,
  TextCellType,
  TEXT_TYPE,
  TimeCellType,
  TIME_TYPE,
} from './cellTypes';
import {
  AutoColumnSize,
  AutoRowSize,
  Autofill,
  BASE_KEY,
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
  HeaderTooltips,
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
  ObserveChanges,
  PersistentState,
  Search,
  TouchScroll,
  TrimRows,
  UNDOREDO_KEY,
  UndoRedo,
  getPlugin,
  getPluginsNames,
  registerPlugin,
} from './plugins';

registerEditor(BASE_EDITOR, BaseEditor);
registerEditor(AUTOCOMPLETE_EDITOR, AutocompleteEditor);
registerEditor(CHECKBOX_EDITOR, CheckboxEditor);
registerEditor(DATE_EDITOR, DateEditor);
registerEditor(DROPDOWN_EDITOR, DropdownEditor);
registerEditor(HANDSONTABLE_EDITOR, HandsontableEditor);
registerEditor(NUMERIC_EDITOR, NumericEditor);
registerEditor(PASSWORD_EDITOR, PasswordEditor);
registerEditor(SELECT_EDITOR, SelectEditor);
registerEditor(TEXT_EDITOR, TextEditor);

registerRenderer(BASE_RENDERER, baseRenderer);
registerRenderer(AUTOCOMPLETE_RENDERER, autocompleteRenderer);
registerRenderer(CHECKBOX_RENDERER, checkboxRenderer);
registerRenderer(HTML_RENDERER, htmlRenderer);
registerRenderer(NUMERIC_RENDERER, numericRenderer);
registerRenderer(PASSWORD_RENDERER, passwordRenderer);
registerRenderer(TEXT_RENDERER, textRenderer);

registerValidator(AUTOCOMPLETE_VALIDATOR, autocompleteValidator);
registerValidator(DATE_VALIDATOR, dateValidator);
registerValidator(NUMERIC_VALIDATOR, numericValidator);
registerValidator(TIME_VALIDATOR, timeValidator);

registerCellType(AUTOCOMPLETE_TYPE, AutocompleteCellType);
registerCellType(CHECKBOX_TYPE, CheckboxCellType);
registerCellType(DATE_TYPE, DateCellType);
registerCellType(DROPDOWN_TYPE, DropdownCellType);
registerCellType(HANDSONTABLE_TYPE, HandsontableCellType);
registerCellType(NUMERIC_TYPE, NumericCellType);
registerCellType(PASSWORD_TYPE, PasswordCellType);
registerCellType(TIME_TYPE, TimeCellType);
registerCellType(TEXT_TYPE, TextCellType);

jQueryWrapper(Handsontable);

registerPlugin(PersistentState);
registerPlugin(AutoColumnSize);
registerPlugin(Autofill);
registerPlugin(ManualRowResize);
registerPlugin(AutoRowSize);
registerPlugin(ColumnSorting);
registerPlugin(Comments);
registerPlugin(ContextMenu);
registerPlugin(CopyPaste);
registerPlugin(CustomBorders);
registerPlugin(DragToScroll);
registerPlugin(ManualColumnFreeze);
registerPlugin(ManualColumnMove);
registerPlugin(ManualColumnResize);
registerPlugin(ManualRowMove);
registerPlugin(MergeCells);
registerPlugin(MultipleSelectionHandles);
registerPlugin(MultiColumnSorting);
registerPlugin(ObserveChanges);
registerPlugin(Search);
registerPlugin(TouchScroll);
registerPlugin(BindRowsWithHeaders);
registerPlugin(ColumnSummary);
registerPlugin(DropdownMenu);
registerPlugin(ExportFile);
registerPlugin(Filters);
registerPlugin(Formulas);
registerPlugin(HeaderTooltips);
registerPlugin(NestedHeaders);
registerPlugin(CollapsibleColumns);
registerPlugin(NestedRows);
registerPlugin(HiddenColumns);
registerPlugin(HiddenRows);
registerPlugin(TrimRows);

// TODO: Remove this exports after rewrite tests about this module
Handsontable.__GhostTable = GhostTable;

Handsontable._getListenersCounter = getListenersCounter; // For MemoryLeak tests
Handsontable._getRegisteredMapsCounter = getRegisteredMapsCounter; // For MemoryLeak tests

Handsontable.DefaultSettings = metaSchemaFactory();
Handsontable.EventManager = EventManager;

// Export Hooks singleton
Handsontable.hooks = Hooks.getSingleton();

// Export all helpers to the Handsontable object
const HELPERS = [
  arrayHelpers,
  browserHelpers,
  dataHelpers,
  dateHelpers,
  featureHelpers,
  functionHelpers,
  mixedHelpers,
  numberHelpers,
  objectHelpers,
  stringHelpers,
  unicodeHelpers,
  parseTableHelpers,
];
const DOM = [
  domHelpers,
  domEventHelpers,
];

Handsontable.helper = {};
Handsontable.dom = {};

// Fill general helpers.
arrayHelpers.arrayEach(HELPERS, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.helper[key] = helper[key];
    }
  });
});

// Fill DOM helpers.
arrayHelpers.arrayEach(DOM, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.dom[key] = helper[key];
    }
  });
});

// Export cell types.
Handsontable.cellTypes = {};

arrayHelpers.arrayEach(getRegisteredCellTypeNames(), (cellTypeName) => {
  Handsontable.cellTypes[cellTypeName] = getCellType(cellTypeName);
});

Handsontable.cellTypes.registerCellType = registerCellType;
Handsontable.cellTypes.getCellType = getCellType;

// Export all registered editors from the Handsontable.
Handsontable.editors = {};

arrayHelpers.arrayEach(getRegisteredEditorNames(), (editorName) => {
  Handsontable.editors[`${stringHelpers.toUpperCaseFirst(editorName)}Editor`] = getEditor(editorName);
});

Handsontable.editors.registerEditor = registerEditor;
Handsontable.editors.getEditor = getEditor;

// Export all registered renderers from the Handsontable.
Handsontable.renderers = {};

arrayHelpers.arrayEach(getRegisteredRendererNames(), (rendererName) => {
  const renderer = getRenderer(rendererName);

  if (rendererName === 'base') {
    Handsontable.renderers.cellDecorator = renderer;
  }
  Handsontable.renderers[`${stringHelpers.toUpperCaseFirst(rendererName)}Renderer`] = renderer;
});

Handsontable.renderers.registerRenderer = registerRenderer;
Handsontable.renderers.getRenderer = getRenderer;

// Export all registered validators from the Handsontable.
Handsontable.validators = {};

arrayHelpers.arrayEach(getRegisteredValidatorNames(), (validatorName) => {
  Handsontable.validators[`${stringHelpers.toUpperCaseFirst(validatorName)}Validator`] = getValidator(validatorName);
});

Handsontable.validators.registerValidator = registerValidator;
Handsontable.validators.getValidator = getValidator;

// Export all registered plugins from the Handsontable.
Handsontable.plugins = {
  [`${stringHelpers.toUpperCaseFirst(BASE_KEY)}Plugin`]: BasePlugin,
  [`${stringHelpers.toUpperCaseFirst(UNDOREDO_KEY)}Redo`]: UndoRedo,
};

arrayHelpers.arrayEach(getPluginsNames(), (pluginName) => {
  Handsontable.plugins[pluginName] = getPlugin(pluginName);
});

Handsontable.plugins.registerPlugin = registerPlugin;
Handsontable.plugins.getPlugin = getPlugin;

export default Handsontable;
