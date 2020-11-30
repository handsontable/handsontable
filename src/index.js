import Handsontable from './base';
import EventManager, { getListenersCounter } from './eventManager';
import { getRegisteredMapsCounter } from './translations/mapCollection';
import Hooks from './pluginHooks';
import { metaSchemaFactory } from './dataMap/index';

import jQueryWrapper from './helpers/wrappers/jquery';

import { getRegisteredEditorNames, getEditor, registerEditor } from './editors';
import { getRegisteredRendererNames, getRenderer, registerRenderer } from './renderers';
import { getRegisteredValidatorNames, getValidator, registerValidator } from './validators';
import { getRegisteredCellTypeNames, getCellType, registerCellType } from './cellTypes';

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
import * as plugins from './plugins/index';
import { registerPlugin } from './plugins';

import { BaseEditor, EDITOR_TYPE as BASE_EDITOR } from './editors/baseEditor';
import { AutocompleteEditor, EDITOR_TYPE as AUTOCOMPLETE_EDITOR } from './editors/autocompleteEditor';
import { CheckboxEditor, EDITOR_TYPE as CHECKBOX_EDITOR } from './editors/checkboxEditor';
import { DateEditor, EDITOR_TYPE as DATE_EDITOR } from './editors/dateEditor';
import { DropdownEditor, EDITOR_TYPE as DROPDOWN_EDITOR } from './editors/dropdownEditor';
import { HandsontableEditor, EDITOR_TYPE as HANDSONTABLE_EDITOR } from './editors/handsontableEditor';
import { NumericEditor, EDITOR_TYPE as NUMERIC_EDITOR } from './editors/numericEditor';
import { PasswordEditor, EDITOR_TYPE as PASSWORD_EDITOR } from './editors/passwordEditor';
import { SelectEditor, EDITOR_TYPE as SELECT_EDITOR } from './editors/selectEditor';
import { TextEditor, EDITOR_TYPE as TEXT_EDITOR } from './editors/textEditor';

import { baseRenderer, RENDERER_TYPE as BASE_RENDERER } from './renderers/baseRenderer';
import { autocompleteRenderer, RENDERER_TYPE as AUTOCOMPLETE_RENDERER } from './renderers/autocompleteRenderer';
import { checkboxRenderer, RENDERER_TYPE as CHECKBOX_RENDERER } from './renderers/checkboxRenderer';
import { htmlRenderer, RENDERER_TYPE as HTML_RENDERER } from './renderers/htmlRenderer';
import { numericRenderer, RENDERER_TYPE as NUMERIC_RENDERER } from './renderers/numericRenderer';
import { passwordRenderer, RENDERER_TYPE as PASSWORD_RENDERER } from './renderers/passwordRenderer';
import { textRenderer, RENDERER_TYPE as TEXT_RENDERER } from './renderers/textRenderer';

import { autocompleteValidator, VALIDATOR_TYPE as AUTOCOMPLETE_VALIDATOR } from './validators/autocompleteValidator';
import { dateValidator, VALIDATOR_TYPE as DATE_VALIDATOR } from './validators/dateValidator';
import { numericValidator, VALIDATOR_TYPE as NUMERIC_VALIDATOR } from './validators/numericValidator';
import { timeValidator, VALIDATOR_TYPE as TIME_VALIDATOR } from './validators/timeValidator';

import { AutocompleteType, CELL_TYPE as AUTOCOMPLETE_TYPE } from './cellTypes/autocompleteType';
import { CheckboxType, CELL_TYPE as CHECKBOX_TYPE } from './cellTypes/checkboxType';
import { DateType, CELL_TYPE as DATE_TYPE } from './cellTypes/dateType';
import { DropdownType, CELL_TYPE as DROPDOWN_TYPE } from './cellTypes/dropdownType';
import { HandsontableType, CELL_TYPE as HANDSONTABLE_TYPE } from './cellTypes/handsontableType';
import { NumericType, CELL_TYPE as NUMERIC_TYPE } from './cellTypes/numericType';
import { PasswordType, CELL_TYPE as PASSWORD_TYPE } from './cellTypes/passwordType';
import { TextType, CELL_TYPE as TEXT_TYPE } from './cellTypes/textType';
import { TimeType, CELL_TYPE as TIME_TYPE } from './cellTypes/timeType';

jQueryWrapper(Handsontable);

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

registerCellType(AUTOCOMPLETE_TYPE, AutocompleteType);
registerCellType(CHECKBOX_TYPE, CheckboxType);
registerCellType(DATE_TYPE, DateType);
registerCellType(DROPDOWN_TYPE, DropdownType);
registerCellType(HANDSONTABLE_TYPE, HandsontableType);
registerCellType(NUMERIC_TYPE, NumericType);
registerCellType(PASSWORD_TYPE, PasswordType);
registerCellType(TEXT_TYPE, TextType);
registerCellType(TIME_TYPE, TimeType);

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
Handsontable.plugins = {};

arrayHelpers.arrayEach(Object.getOwnPropertyNames(plugins), (pluginName) => {
  const plugin = plugins[pluginName];

  if (pluginName === 'Base') {
    Handsontable.plugins[`${pluginName}Plugin`] = plugin;
  } else {
    Handsontable.plugins[pluginName] = plugin;
  }
});

Handsontable.plugins.registerPlugin = registerPlugin;

export default Handsontable;
