'use strict';

exports.__esModule = true;

require('core-js/modules/es6.map');

require('core-js/modules/es6.set');

require('core-js/modules/es6.weak-map');

require('core-js/modules/es6.weak-set');

require('core-js/modules/es6.promise');

require('core-js/modules/es6.symbol');

require('core-js/modules/es6.object.freeze');

require('core-js/modules/es6.object.seal');

require('core-js/modules/es6.object.prevent-extensions');

require('core-js/modules/es6.object.is-frozen');

require('core-js/modules/es6.object.is-sealed');

require('core-js/modules/es6.object.is-extensible');

require('core-js/modules/es6.object.get-own-property-descriptor');

require('core-js/modules/es6.object.get-prototype-of');

require('core-js/modules/es6.object.keys');

require('core-js/modules/es6.object.get-own-property-names');

require('core-js/modules/es6.object.assign');

require('core-js/modules/es6.object.is');

require('core-js/modules/es6.object.set-prototype-of');

require('core-js/modules/es6.function.name');

require('core-js/modules/es6.string.raw');

require('core-js/modules/es6.string.from-code-point');

require('core-js/modules/es6.string.code-point-at');

require('core-js/modules/es6.string.repeat');

require('core-js/modules/es6.string.starts-with');

require('core-js/modules/es6.string.ends-with');

require('core-js/modules/es6.string.includes');

require('core-js/modules/es6.regexp.flags');

require('core-js/modules/es6.regexp.match');

require('core-js/modules/es6.regexp.replace');

require('core-js/modules/es6.regexp.split');

require('core-js/modules/es6.regexp.search');

require('core-js/modules/es6.array.from');

require('core-js/modules/es6.array.of');

require('core-js/modules/es6.array.copy-within');

require('core-js/modules/es6.array.find');

require('core-js/modules/es6.array.find-index');

require('core-js/modules/es6.array.fill');

require('core-js/modules/es6.array.iterator');

require('core-js/modules/es6.number.is-finite');

require('core-js/modules/es6.number.is-integer');

require('core-js/modules/es6.number.is-safe-integer');

require('core-js/modules/es6.number.is-nan');

require('core-js/modules/es6.number.epsilon');

require('core-js/modules/es6.number.min-safe-integer');

require('core-js/modules/es6.number.max-safe-integer');

require('core-js/modules/es7.array.includes');

require('core-js/modules/es7.object.values');

require('core-js/modules/es7.object.entries');

require('core-js/modules/es7.object.get-own-property-descriptors');

require('core-js/modules/es7.string.pad-start');

require('core-js/modules/es7.string.pad-end');

require('core-js/modules/web.immediate');

require('core-js/modules/web.dom.iterable');

var _editors = require('./editors');

var _renderers = require('./renderers');

var _validators = require('./validators');

var _cellTypes = require('./cellTypes');

var _core = require('./core');

var _core2 = _interopRequireDefault(_core);

var _jquery = require('./helpers/wrappers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _eventManager = require('./eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

var _pluginHooks = require('./pluginHooks');

var _pluginHooks2 = _interopRequireDefault(_pluginHooks);

var _ghostTable = require('./utils/ghostTable');

var _ghostTable2 = _interopRequireDefault(_ghostTable);

var _array = require('./helpers/array');

var arrayHelpers = _interopRequireWildcard(_array);

var _browser = require('./helpers/browser');

var browserHelpers = _interopRequireWildcard(_browser);

var _data = require('./helpers/data');

var dataHelpers = _interopRequireWildcard(_data);

var _date = require('./helpers/date');

var dateHelpers = _interopRequireWildcard(_date);

var _feature = require('./helpers/feature');

var featureHelpers = _interopRequireWildcard(_feature);

var _function = require('./helpers/function');

var functionHelpers = _interopRequireWildcard(_function);

var _mixed = require('./helpers/mixed');

var mixedHelpers = _interopRequireWildcard(_mixed);

var _number = require('./helpers/number');

var numberHelpers = _interopRequireWildcard(_number);

var _object = require('./helpers/object');

var objectHelpers = _interopRequireWildcard(_object);

var _setting = require('./helpers/setting');

var settingHelpers = _interopRequireWildcard(_setting);

var _string = require('./helpers/string');

var stringHelpers = _interopRequireWildcard(_string);

var _unicode = require('./helpers/unicode');

var unicodeHelpers = _interopRequireWildcard(_unicode);

var _element = require('./helpers/dom/element');

var domHelpers = _interopRequireWildcard(_element);

var _event = require('./helpers/dom/event');

var domEventHelpers = _interopRequireWildcard(_event);

var _index = require('./plugins/index');

var plugins = _interopRequireWildcard(_index);

var _plugins = require('./plugins');

var _defaultSettings = require('./defaultSettings');

var _defaultSettings2 = _interopRequireDefault(_defaultSettings);

var _rootInstance = require('./utils/rootInstance');

var _i18n = require('./i18n');

var _constants = require('./i18n/constants');

var constants = _interopRequireWildcard(_constants);

var _dictionariesManager = require('./i18n/dictionariesManager');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Handsontable(rootElement, userSettings) {
  var instance = new _core2.default(rootElement, userSettings || {}, _rootInstance.rootInstanceSymbol);

  instance.init();

  return instance;
}

(0, _jquery2.default)(Handsontable);

Handsontable.Core = _core2.default;
Handsontable.DefaultSettings = _defaultSettings2.default;
Handsontable.EventManager = _eventManager2.default;
Handsontable._getListenersCounter = _eventManager.getListenersCounter; // For MemoryLeak tests

Handsontable.buildDate = '08/10/2018 10:46:47';
Handsontable.packageName = 'handsontable';
Handsontable.version = '6.0.1';

var baseVersion = '';

if (baseVersion) {
  Handsontable.baseVersion = baseVersion;
}

// Export Hooks singleton
Handsontable.hooks = _pluginHooks2.default.getSingleton();

// TODO: Remove this exports after rewrite tests about this module
Handsontable.__GhostTable = _ghostTable2.default;
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

arrayHelpers.arrayEach((0, _cellTypes.getRegisteredCellTypeNames)(), function (cellTypeName) {
  Handsontable.cellTypes[cellTypeName] = (0, _cellTypes.getCellType)(cellTypeName);
});

Handsontable.cellTypes.registerCellType = _cellTypes.registerCellType;
Handsontable.cellTypes.getCellType = _cellTypes.getCellType;

// Export all registered editors from the Handsontable.
Handsontable.editors = {};

arrayHelpers.arrayEach((0, _editors.getRegisteredEditorNames)(), function (editorName) {
  Handsontable.editors[stringHelpers.toUpperCaseFirst(editorName) + 'Editor'] = (0, _editors.getEditor)(editorName);
});

Handsontable.editors.registerEditor = _editors.registerEditor;
Handsontable.editors.getEditor = _editors.getEditor;

// Export all registered renderers from the Handsontable.
Handsontable.renderers = {};

arrayHelpers.arrayEach((0, _renderers.getRegisteredRendererNames)(), function (rendererName) {
  var renderer = (0, _renderers.getRenderer)(rendererName);

  if (rendererName === 'base') {
    Handsontable.renderers.cellDecorator = renderer;
  }
  Handsontable.renderers[stringHelpers.toUpperCaseFirst(rendererName) + 'Renderer'] = renderer;
});

Handsontable.renderers.registerRenderer = _renderers.registerRenderer;
Handsontable.renderers.getRenderer = _renderers.getRenderer;

// Export all registered validators from the Handsontable.
Handsontable.validators = {};

arrayHelpers.arrayEach((0, _validators.getRegisteredValidatorNames)(), function (validatorName) {
  Handsontable.validators[stringHelpers.toUpperCaseFirst(validatorName) + 'Validator'] = (0, _validators.getValidator)(validatorName);
});

Handsontable.validators.registerValidator = _validators.registerValidator;
Handsontable.validators.getValidator = _validators.getValidator;

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

Handsontable.plugins.registerPlugin = _plugins.registerPlugin;

Handsontable.languages = {};
Handsontable.languages.dictionaryKeys = constants;
Handsontable.languages.getLanguageDictionary = _dictionariesManager.getLanguageDictionary;
Handsontable.languages.getLanguagesDictionaries = _dictionariesManager.getLanguagesDictionaries;
Handsontable.languages.registerLanguageDictionary = _dictionariesManager.registerLanguageDictionary;

// Alias to `getTranslatedPhrase` function, for more information check it API.
Handsontable.languages.getTranslatedPhrase = function () {
  return _i18n.getTranslatedPhrase.apply(undefined, arguments);
};

exports.default = Handsontable;