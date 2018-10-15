'use strict';

exports.__esModule = true;
exports.getRegisteredValidators = exports.getRegisteredValidatorNames = exports.hasValidator = exports.getValidator = exports.registerValidator = undefined;

var _staticRegister2 = require('./../utils/staticRegister');

var _staticRegister3 = _interopRequireDefault(_staticRegister2);

var _autocompleteValidator = require('./autocompleteValidator');

var _autocompleteValidator2 = _interopRequireDefault(_autocompleteValidator);

var _dateValidator = require('./dateValidator');

var _dateValidator2 = _interopRequireDefault(_dateValidator);

var _numericValidator = require('./numericValidator');

var _numericValidator2 = _interopRequireDefault(_numericValidator);

var _timeValidator = require('./timeValidator');

var _timeValidator2 = _interopRequireDefault(_timeValidator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _staticRegister = (0, _staticRegister3.default)('validators'),
    register = _staticRegister.register,
    getItem = _staticRegister.getItem,
    hasItem = _staticRegister.hasItem,
    getNames = _staticRegister.getNames,
    getValues = _staticRegister.getValues;

register('autocomplete', _autocompleteValidator2.default);
register('date', _dateValidator2.default);
register('numeric', _numericValidator2.default);
register('time', _timeValidator2.default);

/**
 * Retrieve validator function.
 *
 * @param {String} name Validator identification.
 * @returns {Function} Returns validator function.
 */
function _getItem(name) {
  if (typeof name === 'function') {
    return name;
  }
  if (!hasItem(name)) {
    throw Error('No registered validator found under "' + name + '" name');
  }

  return getItem(name);
}

exports.registerValidator = register;
exports.getValidator = _getItem;
exports.hasValidator = hasItem;
exports.getRegisteredValidatorNames = getNames;
exports.getRegisteredValidators = getValues;