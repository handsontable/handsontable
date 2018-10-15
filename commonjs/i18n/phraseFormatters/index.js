'use strict';

exports.__esModule = true;
exports.getPhraseFormatters = exports.registerPhraseFormatter = undefined;
exports.register = register;
exports.getAll = getAll;

var _staticRegister2 = require('./../../utils/staticRegister');

var _staticRegister3 = _interopRequireDefault(_staticRegister2);

var _pluralize = require('./pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _staticRegister = (0, _staticRegister3.default)('phraseFormatters'),
    registerGloballyPhraseFormatter = _staticRegister.register,
    getGlobalPhraseFormatters = _staticRegister.getValues;

/**
 * Register phrase formatter.
 *
 * @param {String} name Name of formatter.
 * @param {Function} formatterFn Function which will be applied on phrase propositions. It will transform them if it's possible.
 */


function register(name, formatterFn) {
  registerGloballyPhraseFormatter(name, formatterFn);
}

/**
 * Get all registered previously formatters.
 *
 * @returns {Array}
 */
function getAll() {
  return getGlobalPhraseFormatters();
}

exports.registerPhraseFormatter = register;
exports.getPhraseFormatters = getAll;


register('pluralize', _pluralize2.default);