'use strict';

exports.__esModule = true;
exports.getRegisteredRenderers = exports.getRegisteredRendererNames = exports.hasRenderer = exports.getRenderer = exports.registerRenderer = undefined;

var _staticRegister2 = require('./../utils/staticRegister');

var _staticRegister3 = _interopRequireDefault(_staticRegister2);

var _cellDecorator = require('./_cellDecorator');

var _cellDecorator2 = _interopRequireDefault(_cellDecorator);

var _autocompleteRenderer = require('./autocompleteRenderer');

var _autocompleteRenderer2 = _interopRequireDefault(_autocompleteRenderer);

var _checkboxRenderer = require('./checkboxRenderer');

var _checkboxRenderer2 = _interopRequireDefault(_checkboxRenderer);

var _htmlRenderer = require('./htmlRenderer');

var _htmlRenderer2 = _interopRequireDefault(_htmlRenderer);

var _numericRenderer = require('./numericRenderer');

var _numericRenderer2 = _interopRequireDefault(_numericRenderer);

var _passwordRenderer = require('./passwordRenderer');

var _passwordRenderer2 = _interopRequireDefault(_passwordRenderer);

var _textRenderer = require('./textRenderer');

var _textRenderer2 = _interopRequireDefault(_textRenderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _staticRegister = (0, _staticRegister3.default)('renderers'),
    register = _staticRegister.register,
    getItem = _staticRegister.getItem,
    hasItem = _staticRegister.hasItem,
    getNames = _staticRegister.getNames,
    getValues = _staticRegister.getValues;

register('base', _cellDecorator2.default);
register('autocomplete', _autocompleteRenderer2.default);
register('checkbox', _checkboxRenderer2.default);
register('html', _htmlRenderer2.default);
register('numeric', _numericRenderer2.default);
register('password', _passwordRenderer2.default);
register('text', _textRenderer2.default);

/**
 * Retrieve renderer function.
 *
 * @param {String} name Renderer identification.
 * @returns {Function} Returns renderer function.
 */
function _getItem(name) {
  if (typeof name === 'function') {
    return name;
  }
  if (!hasItem(name)) {
    throw Error('No registered renderer found under "' + name + '" name');
  }

  return getItem(name);
}

exports.registerRenderer = register;
exports.getRenderer = _getItem;
exports.hasRenderer = hasItem;
exports.getRegisteredRendererNames = getNames;
exports.getRegisteredRenderers = getValues;