'use strict';

exports.__esModule = true;
exports.getRegisteredCellTypes = exports.getRegisteredCellTypeNames = exports.hasCellType = exports.getCellType = exports.registerCellType = undefined;

var _staticRegister2 = require('./../utils/staticRegister');

var _staticRegister3 = _interopRequireDefault(_staticRegister2);

var _editors = require('./../editors');

var _renderers = require('./../renderers');

var _validators = require('./../validators');

var _autocompleteType = require('./autocompleteType');

var _autocompleteType2 = _interopRequireDefault(_autocompleteType);

var _checkboxType = require('./checkboxType');

var _checkboxType2 = _interopRequireDefault(_checkboxType);

var _dateType = require('./dateType');

var _dateType2 = _interopRequireDefault(_dateType);

var _dropdownType = require('./dropdownType');

var _dropdownType2 = _interopRequireDefault(_dropdownType);

var _handsontableType = require('./handsontableType');

var _handsontableType2 = _interopRequireDefault(_handsontableType);

var _numericType = require('./numericType');

var _numericType2 = _interopRequireDefault(_numericType);

var _passwordType = require('./passwordType');

var _passwordType2 = _interopRequireDefault(_passwordType);

var _textType = require('./textType');

var _textType2 = _interopRequireDefault(_textType);

var _timeType = require('./timeType');

var _timeType2 = _interopRequireDefault(_timeType);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _staticRegister = (0, _staticRegister3.default)('cellTypes'),
    register = _staticRegister.register,
    getItem = _staticRegister.getItem,
    hasItem = _staticRegister.hasItem,
    getNames = _staticRegister.getNames,
    getValues = _staticRegister.getValues;

_register('autocomplete', _autocompleteType2.default);
_register('checkbox', _checkboxType2.default);
_register('date', _dateType2.default);
_register('dropdown', _dropdownType2.default);
_register('handsontable', _handsontableType2.default);
_register('numeric', _numericType2.default);
_register('password', _passwordType2.default);
_register('text', _textType2.default);
_register('time', _timeType2.default);

/**
 * Retrieve cell type object.
 *
 * @param {String} name Cell type identification.
 * @returns {Object} Returns cell type object.
 */
function _getItem(name) {
  if (!hasItem(name)) {
    throw Error('You declared cell type "' + name + '" as a string that is not mapped to a known object.\n                 Cell type must be an object or a string mapped to an object registered by "Handsontable.cellTypes.registerCellType" method');
  }

  return getItem(name);
}

/**
 * Register cell type under specified name.
 *
 * @param {String} name Cell type identification.
 * @param {Object} type An object with contains keys (eq: `editor`, `renderer`, `validator`) which describes specified behaviour of the cell.
 */
function _register(name, type) {
  var editor = type.editor,
      renderer = type.renderer,
      validator = type.validator;


  if (editor) {
    (0, _editors.registerEditor)(name, editor);
  }
  if (renderer) {
    (0, _renderers.registerRenderer)(name, renderer);
  }
  if (validator) {
    (0, _validators.registerValidator)(name, validator);
  }

  register(name, type);
}

exports.registerCellType = _register;
exports.getCellType = _getItem;
exports.hasCellType = hasItem;
exports.getRegisteredCellTypeNames = getNames;
exports.getRegisteredCellTypes = getValues;