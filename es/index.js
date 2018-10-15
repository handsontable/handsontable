import 'core-js/modules/es6.map';
import 'core-js/modules/es6.set';
import 'core-js/modules/es6.weak-map';
import 'core-js/modules/es6.weak-set';
import 'core-js/modules/es6.promise';
import 'core-js/modules/es6.symbol';
import 'core-js/modules/es6.object.freeze';
import 'core-js/modules/es6.object.seal';
import 'core-js/modules/es6.object.prevent-extensions';
import 'core-js/modules/es6.object.is-frozen';
import 'core-js/modules/es6.object.is-sealed';
import 'core-js/modules/es6.object.is-extensible';
import 'core-js/modules/es6.object.get-own-property-descriptor';
import 'core-js/modules/es6.object.get-prototype-of';
import 'core-js/modules/es6.object.keys';
import 'core-js/modules/es6.object.get-own-property-names';
import 'core-js/modules/es6.object.assign';
import 'core-js/modules/es6.object.is';
import 'core-js/modules/es6.object.set-prototype-of';
import 'core-js/modules/es6.function.name';
import 'core-js/modules/es6.string.raw';
import 'core-js/modules/es6.string.from-code-point';
import 'core-js/modules/es6.string.code-point-at';
import 'core-js/modules/es6.string.repeat';
import 'core-js/modules/es6.string.starts-with';
import 'core-js/modules/es6.string.ends-with';
import 'core-js/modules/es6.string.includes';
import 'core-js/modules/es6.regexp.flags';
import 'core-js/modules/es6.regexp.match';
import 'core-js/modules/es6.regexp.replace';
import 'core-js/modules/es6.regexp.split';
import 'core-js/modules/es6.regexp.search';
import 'core-js/modules/es6.array.from';
import 'core-js/modules/es6.array.of';
import 'core-js/modules/es6.array.copy-within';
import 'core-js/modules/es6.array.find';
import 'core-js/modules/es6.array.find-index';
import 'core-js/modules/es6.array.fill';
import 'core-js/modules/es6.array.iterator';
import 'core-js/modules/es6.number.is-finite';
import 'core-js/modules/es6.number.is-integer';
import 'core-js/modules/es6.number.is-safe-integer';
import 'core-js/modules/es6.number.is-nan';
import 'core-js/modules/es6.number.epsilon';
import 'core-js/modules/es6.number.min-safe-integer';
import 'core-js/modules/es6.number.max-safe-integer';
import 'core-js/modules/es7.array.includes';
import 'core-js/modules/es7.object.values';
import 'core-js/modules/es7.object.entries';
import 'core-js/modules/es7.object.get-own-property-descriptors';
import 'core-js/modules/es7.string.pad-start';
import 'core-js/modules/es7.string.pad-end';
import 'core-js/modules/web.immediate';
import 'core-js/modules/web.dom.iterable';


import { getRegisteredEditorNames, registerEditor, getEditor } from './editors';
import { getRegisteredRendererNames, getRenderer, registerRenderer } from './renderers';
import { getRegisteredValidatorNames, getValidator, registerValidator } from './validators';
import { getRegisteredCellTypeNames, getCellType, registerCellType } from './cellTypes';

import Core from './core';
import jQueryWrapper from './helpers/wrappers/jquery';
import EventManager, { getListenersCounter } from './eventManager';
import Hooks from './pluginHooks';
import GhostTable from './utils/ghostTable';
import * as arrayHelpers from './helpers/array';
import * as browserHelpers from './helpers/browser';
import * as dataHelpers from './helpers/data';
import * as dateHelpers from './helpers/date';
import * as featureHelpers from './helpers/feature';
import * as functionHelpers from './helpers/function';
import * as mixedHelpers from './helpers/mixed';
import * as numberHelpers from './helpers/number';
import * as objectHelpers from './helpers/object';
import * as settingHelpers from './helpers/setting';
import * as stringHelpers from './helpers/string';
import * as unicodeHelpers from './helpers/unicode';
import * as domHelpers from './helpers/dom/element';
import * as domEventHelpers from './helpers/dom/event';
import * as plugins from './plugins/index';
import { registerPlugin } from './plugins';
import DefaultSettings from './defaultSettings';
import { rootInstanceSymbol } from './utils/rootInstance';
import { getTranslatedPhrase } from './i18n';
import * as constants from './i18n/constants';
import { registerLanguageDictionary, getLanguagesDictionaries, getLanguageDictionary } from './i18n/dictionariesManager';

function Handsontable(rootElement, userSettings) {
  var instance = new Core(rootElement, userSettings || {}, rootInstanceSymbol);

  instance.init();

  return instance;
}

jQueryWrapper(Handsontable);

Handsontable.Core = Core;
Handsontable.DefaultSettings = DefaultSettings;
Handsontable.EventManager = EventManager;
Handsontable._getListenersCounter = getListenersCounter; // For MemoryLeak tests

Handsontable.buildDate = '08/10/2018 10:48:02';
Handsontable.packageName = 'handsontable';
Handsontable.version = '6.0.1';

var baseVersion = '';

if (baseVersion) {
  Handsontable.baseVersion = baseVersion;
}

// Export Hooks singleton
Handsontable.hooks = Hooks.getSingleton();

// TODO: Remove this exports after rewrite tests about this module
Handsontable.__GhostTable = GhostTable;
//

// Export all helpers to the Handsontable object
var HELPERS = [arrayHelpers, browserHelpers, dataHelpers, dateHelpers, featureHelpers, functionHelpers, mixedHelpers, numberHelpers, objectHelpers, settingHelpers, stringHelpers, unicodeHelpers];
var DOM = [domHelpers, domEventHelpers];

Handsontable.helper = {};
Handsontable.dom = {};

// Fill general helpers.
arrayHelpers.arrayEach(HELPERS, function (helper) {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), function (key) {
    if (key.charAt(0) !== '_') {
      Handsontable.helper[key] = helper[key];
    }
  });
});

// Fill DOM helpers.
arrayHelpers.arrayEach(DOM, function (helper) {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), function (key) {
    if (key.charAt(0) !== '_') {
      Handsontable.dom[key] = helper[key];
    }
  });
});

// Export cell types.
Handsontable.cellTypes = {};

arrayHelpers.arrayEach(getRegisteredCellTypeNames(), function (cellTypeName) {
  Handsontable.cellTypes[cellTypeName] = getCellType(cellTypeName);
});

Handsontable.cellTypes.registerCellType = registerCellType;
Handsontable.cellTypes.getCellType = getCellType;

// Export all registered editors from the Handsontable.
Handsontable.editors = {};

arrayHelpers.arrayEach(getRegisteredEditorNames(), function (editorName) {
  Handsontable.editors[stringHelpers.toUpperCaseFirst(editorName) + 'Editor'] = getEditor(editorName);
});

Handsontable.editors.registerEditor = registerEditor;
Handsontable.editors.getEditor = getEditor;

// Export all registered renderers from the Handsontable.
Handsontable.renderers = {};

arrayHelpers.arrayEach(getRegisteredRendererNames(), function (rendererName) {
  var renderer = getRenderer(rendererName);

  if (rendererName === 'base') {
    Handsontable.renderers.cellDecorator = renderer;
  }
  Handsontable.renderers[stringHelpers.toUpperCaseFirst(rendererName) + 'Renderer'] = renderer;
});

Handsontable.renderers.registerRenderer = registerRenderer;
Handsontable.renderers.getRenderer = getRenderer;

// Export all registered validators from the Handsontable.
Handsontable.validators = {};

arrayHelpers.arrayEach(getRegisteredValidatorNames(), function (validatorName) {
  Handsontable.validators[stringHelpers.toUpperCaseFirst(validatorName) + 'Validator'] = getValidator(validatorName);
});

Handsontable.validators.registerValidator = registerValidator;
Handsontable.validators.getValidator = getValidator;

// Export all registered plugins from the Handsontable.
Handsontable.plugins = {};

arrayHelpers.arrayEach(Object.getOwnPropertyNames(plugins), function (pluginName) {
  var plugin = plugins[pluginName];

  if (pluginName === 'Base') {
    Handsontable.plugins[pluginName + 'Plugin'] = plugin;
  } else {
    Handsontable.plugins[pluginName] = plugin;
  }
});

Handsontable.plugins.registerPlugin = registerPlugin;

Handsontable.languages = {};
Handsontable.languages.dictionaryKeys = constants;
Handsontable.languages.getLanguageDictionary = getLanguageDictionary;
Handsontable.languages.getLanguagesDictionaries = getLanguagesDictionaries;
Handsontable.languages.registerLanguageDictionary = registerLanguageDictionary;

// Alias to `getTranslatedPhrase` function, for more information check it API.
Handsontable.languages.getTranslatedPhrase = function () {
  return getTranslatedPhrase.apply(undefined, arguments);
};

export default Handsontable;