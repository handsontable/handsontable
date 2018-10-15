'use strict';

exports.__esModule = true;
exports.DEFAULT_LANGUAGE_CODE = exports.getLanguagesDictionaries = exports.getDefaultLanguageDictionary = exports.hasLanguageDictionary = exports.getLanguageDictionary = exports.registerLanguageDictionary = undefined;

var _object = require('../helpers/object');

var _utils = require('./utils');

var _staticRegister2 = require('../utils/staticRegister');

var _staticRegister3 = _interopRequireDefault(_staticRegister2);

var _enUS = require('./languages/en-US');

var _enUS2 = _interopRequireDefault(_enUS);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_LANGUAGE_CODE = _enUS2.default.languageCode;

var _staticRegister = (0, _staticRegister3.default)('languagesDictionaries'),
    registerGloballyLanguageDictionary = _staticRegister.register,
    getGlobalLanguageDictionary = _staticRegister.getItem,
    hasGlobalLanguageDictionary = _staticRegister.hasItem,
    getGlobalLanguagesDictionaries = _staticRegister.getValues;

/**
 * Register language dictionary for specific language code.
 *
 * @param {String|Object} languageCodeOrDictionary Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE' or object representing dictionary.
 * @param {Object} dictionary Dictionary for specific language (optional if first parameter has already dictionary).
 */


function registerLanguage(languageCodeOrDictionary, dictionary) {
  var languageCode = languageCodeOrDictionary;
  var dictionaryObject = dictionary;

  // Dictionary passed as first argument.
  if ((0, _object.isObject)(languageCodeOrDictionary)) {
    dictionaryObject = languageCodeOrDictionary;
    languageCode = dictionaryObject.languageCode;
  }

  extendLanguageDictionary(languageCode, dictionaryObject);
  registerGloballyLanguageDictionary(languageCode, (0, _object.deepClone)(dictionaryObject));

  // We do not allow user to work with dictionary by reference, it can cause lot of bugs.
  return (0, _object.deepClone)(dictionaryObject);
}

/**
 * Get language dictionary for specific language code.
 *
 * @param {String} languageCode Language code.
 * @returns {Object} Object with constants representing identifiers for translation (as keys) and corresponding translation phrases (as values).
 */
function getLanguage(languageCode) {
  if (!hasLanguage(languageCode)) {
    return null;
  }

  return (0, _object.deepClone)(getGlobalLanguageDictionary(languageCode));
}

/**
 *
 * Get if language with specified language code was registered.
 *
 * @param {String} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @returns {Boolean}
 */
function hasLanguage(languageCode) {
  return hasGlobalLanguageDictionary(languageCode);
}

/**
 * Get default language dictionary.
 *
 * @returns {Object} Object with constants representing identifiers for translation (as keys) and corresponding translation phrases (as values).
 */
function getDefaultLanguage() {
  return _enUS2.default;
}

/**
 * Extend handled dictionary by default language dictionary. As result, if any dictionary key isn't defined for specific language, it will be filled with default language value ("dictionary gaps" are supplemented).
 *
 * @private
 * @param {String} languageCode Language code.
 * @param {Object} dictionary Dictionary which is extended.
 */
function extendLanguageDictionary(languageCode, dictionary) {
  if (languageCode !== DEFAULT_LANGUAGE_CODE) {
    (0, _utils.extendNotExistingKeys)(dictionary, getGlobalLanguageDictionary(DEFAULT_LANGUAGE_CODE));
  }
}

/**
 * Get registered language dictionaries.
 *
 * @returns {Array}
 */
function getLanguages() {
  return getGlobalLanguagesDictionaries();
}

exports.registerLanguageDictionary = registerLanguage;
exports.getLanguageDictionary = getLanguage;
exports.hasLanguageDictionary = hasLanguage;
exports.getDefaultLanguageDictionary = getDefaultLanguage;
exports.getLanguagesDictionaries = getLanguages;
exports.DEFAULT_LANGUAGE_CODE = DEFAULT_LANGUAGE_CODE;

/**
 * Automatically registers default dictionary.
 */

registerLanguage(_enUS2.default);