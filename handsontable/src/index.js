import Handsontable from './base';
import EventManager, { getListenersCounter } from './eventManager';
import { getRegisteredMapsCounter } from './translations';
import Hooks from './pluginHooks';
import { metaSchemaFactory } from './dataMap';

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

/* eslint-disable handsontable/restricted-module-imports */
// Since the Handsontable was modularized, importing some submodules is restricted.
// Importing the main entry of the submodule can make the "dead" code elimination
// process more difficult. The "handsontable/restricted-module-imports" rule is on
// guard. For the index.js file, the rule has to be disabled. This file exports the
// full version of the Handsontable with build-in all available components, so that's
// why the rule is disabled here (see more #7506).
import {
  getRegisteredEditorNames,
  getEditor,
  registerEditor,
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
} from './editors';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
  baseRenderer,
  autocompleteRenderer,
  checkboxRenderer,
  htmlRenderer,
  numericRenderer,
  passwordRenderer,
  textRenderer,
} from './renderers';
import {
  getRegisteredValidatorNames,
  getValidator,
  registerValidator,
  autocompleteValidator,
  dateValidator,
  numericValidator,
  timeValidator,
} from './validators';
import {
  getRegisteredCellTypeNames,
  getCellType,
  registerCellType,
  AutocompleteCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  HandsontableCellType,
  NumericCellType,
  PasswordCellType,
  TextCellType,
  TimeCellType,
} from './cellTypes';
import {
  AutoColumnSize,
  AutoRowSize,
  Autofill,
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
  UndoRedo,
  getPlugin,
  getPluginsNames,
  registerPlugin,
} from './plugins';
/* eslint-enable handsontable/restricted-module-imports */

registerEditor(BaseEditor);
registerEditor(AutocompleteEditor);
registerEditor(CheckboxEditor);
registerEditor(DateEditor);
registerEditor(DropdownEditor);
registerEditor(HandsontableEditor);
registerEditor(NumericEditor);
registerEditor(PasswordEditor);
registerEditor(SelectEditor);
registerEditor(TextEditor);

registerRenderer(baseRenderer);
registerRenderer(autocompleteRenderer);
registerRenderer(checkboxRenderer);
registerRenderer(htmlRenderer);
registerRenderer(numericRenderer);
registerRenderer(passwordRenderer);
registerRenderer(textRenderer);

registerValidator(autocompleteValidator);
registerValidator(dateValidator);
registerValidator(numericValidator);
registerValidator(timeValidator);

registerCellType(AutocompleteCellType);
registerCellType(CheckboxCellType);
registerCellType(DateCellType);
registerCellType(DropdownCellType);
registerCellType(HandsontableCellType);
registerCellType(NumericCellType);
registerCellType(PasswordCellType);
registerCellType(TimeCellType);
registerCellType(TextCellType);

jQueryWrapper(Handsontable);

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
registerPlugin(TouchScroll);
registerPlugin(TrimRows);
registerPlugin(UndoRedo);

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
// Make sure to initialize the plugin dictionary as an empty object. Otherwise, while
// transpiling the files into ES and CommonJS format, the injected CoreJS helper
// `import "core-js/modules/es.object.get-own-property-names";` won't be processed
// by the `./config/plugin/babel/add-import-extension` babel plugin. Thus, the distribution
// files will be broken. The reason is not known right now (probably it's caused by bug in
// the Babel or missing something in the plugin).
Handsontable.plugins = {};

arrayHelpers.arrayEach(getPluginsNames(), (pluginName) => {
  Handsontable.plugins[pluginName] = getPlugin(pluginName);
});

Handsontable.plugins[`${stringHelpers.toUpperCaseFirst(BasePlugin.PLUGIN_KEY)}Plugin`] = BasePlugin;

Handsontable.plugins.registerPlugin = registerPlugin;
Handsontable.plugins.getPlugin = getPlugin;

export default Handsontable;
