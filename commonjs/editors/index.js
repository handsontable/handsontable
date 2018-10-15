'use strict';

exports.__esModule = true;
exports.getRegisteredEditors = exports.getRegisteredEditorNames = exports.hasEditor = exports.getEditorInstance = exports.getEditor = exports.registerEditor = undefined;
exports.RegisteredEditor = RegisteredEditor;
exports._getEditorInstance = _getEditorInstance;

var _staticRegister2 = require('./../utils/staticRegister');

var _staticRegister3 = _interopRequireDefault(_staticRegister2);

var _pluginHooks = require('./../pluginHooks');

var _pluginHooks2 = _interopRequireDefault(_pluginHooks);

var _baseEditor = require('./_baseEditor');

var _baseEditor2 = _interopRequireDefault(_baseEditor);

var _autocompleteEditor = require('./autocompleteEditor');

var _autocompleteEditor2 = _interopRequireDefault(_autocompleteEditor);

var _checkboxEditor = require('./checkboxEditor');

var _checkboxEditor2 = _interopRequireDefault(_checkboxEditor);

var _dateEditor = require('./dateEditor');

var _dateEditor2 = _interopRequireDefault(_dateEditor);

var _dropdownEditor = require('./dropdownEditor');

var _dropdownEditor2 = _interopRequireDefault(_dropdownEditor);

var _handsontableEditor = require('./handsontableEditor');

var _handsontableEditor2 = _interopRequireDefault(_handsontableEditor);

var _numericEditor = require('./numericEditor');

var _numericEditor2 = _interopRequireDefault(_numericEditor);

var _passwordEditor = require('./passwordEditor');

var _passwordEditor2 = _interopRequireDefault(_passwordEditor);

var _selectEditor = require('./selectEditor');

var _selectEditor2 = _interopRequireDefault(_selectEditor);

var _textEditor = require('./textEditor');

var _textEditor2 = _interopRequireDefault(_textEditor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Utility to register editors and common namespace for keeping reference to all editor classes
 */
var registeredEditorClasses = new WeakMap();

var _staticRegister = (0, _staticRegister3.default)('editors'),
    register = _staticRegister.register,
    getItem = _staticRegister.getItem,
    hasItem = _staticRegister.hasItem,
    getNames = _staticRegister.getNames,
    getValues = _staticRegister.getValues;

_register('base', _baseEditor2.default);
_register('autocomplete', _autocompleteEditor2.default);
_register('checkbox', _checkboxEditor2.default);
_register('date', _dateEditor2.default);
_register('dropdown', _dropdownEditor2.default);
_register('handsontable', _handsontableEditor2.default);
_register('numeric', _numericEditor2.default);
_register('password', _passwordEditor2.default);
_register('select', _selectEditor2.default);
_register('text', _textEditor2.default);

function RegisteredEditor(editorClass) {
  var instances = {};
  var Clazz = editorClass;

  this.getConstructor = function () {
    return editorClass;
  };

  this.getInstance = function (hotInstance) {
    if (!(hotInstance.guid in instances)) {
      instances[hotInstance.guid] = new Clazz(hotInstance);
    }

    return instances[hotInstance.guid];
  };

  _pluginHooks2.default.getSingleton().add('afterDestroy', function () {
    instances[this.guid] = null;
  });
}

/**
 * Returns instance (singleton) of editor class.
 *
 * @param {String} name Name of an editor under which it has been stored.
 * @param {Object} hotInstance Instance of Handsontable.
 * @returns {Function} Returns instance of editor.
 */
function _getEditorInstance(name, hotInstance) {
  var editor = void 0;

  if (typeof name === 'function') {
    if (!registeredEditorClasses.get(name)) {
      _register(null, name);
    }
    editor = registeredEditorClasses.get(name);
  } else if (typeof name === 'string') {
    editor = getItem(name);
  } else {
    throw Error('Only strings and functions can be passed as "editor" parameter');
  }

  if (!editor) {
    throw Error('No editor registered under name "' + name + '"');
  }

  return editor.getInstance(hotInstance);
}

/**
 * Retrieve editor class.
 *
 * @param {String} name Editor identification.
 * @returns {Function} Returns editor class.
 */
function _getItem(name) {
  if (!hasItem(name)) {
    throw Error('No registered editor found under "' + name + '" name');
  }

  return getItem(name).getConstructor();
}

/**
 * Register editor class under specified name.
 *
 * @param {String} name Editor identification.
 * @param {Function} editorClass Editor class.
 */
function _register(name, editorClass) {
  var editorWrapper = new RegisteredEditor(editorClass);

  if (typeof name === 'string') {
    register(name, editorWrapper);
  }
  registeredEditorClasses.set(editorClass, editorWrapper);
}

exports.registerEditor = _register;
exports.getEditor = _getItem;
exports.getEditorInstance = _getEditorInstance;
exports.hasEditor = hasItem;
exports.getRegisteredEditorNames = getNames;
exports.getRegisteredEditors = getValues;