import { isObject, deepClone } from '../helpers/object';
import { extendNotExistingKeys } from './utils';
import staticRegister from '../utils/staticRegister';
import DEFAULT_DICTIONARY from './languages/en-US';

const DEFAULT_LANGUAGE_CODE = DEFAULT_DICTIONARY.languageCode;

const {
  register: registerGloballyLanguageDictionary,
  getItem: getGlobalLanguageDictionary,
  hasItem: hasGlobalLanguageDictionary,
  getValues: getGlobalLanguagesDictionaries
} = staticRegister('languagesDictionaries');

/**
 * Register language dictionary for specific language code.
 *
 * @param {String|Object} languageCodeOrDictionary Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE' or object representing dictionary.
 * @param {Object} dictionary Dictionary for specific language (optional if first parameter has already dictionary).
 */
function registerLanguage(languageCodeOrDictionary, dictionary) {
  let languageCode = languageCodeOrDictionary;
  let dictionaryObject = dictionary;

  // Dictionary passed as first argument.
  if (isObject(languageCodeOrDictionary)) {
    dictionaryObject = languageCodeOrDictionary;
    languageCode = dictionaryObject.languageCode;
  }

  extendLanguageDictionary(languageCode, dictionaryObject);
  registerGloballyLanguageDictionary(languageCode, deepClone(dictionaryObject));

  // We do not allow user to work with dictionary by reference, it can cause lot of bugs.
  return deepClone(dictionaryObject);
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

  return deepClone(getGlobalLanguageDictionary(languageCode));
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
  return DEFAULT_DICTIONARY;
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
    extendNotExistingKeys(dictionary, getGlobalLanguageDictionary(DEFAULT_LANGUAGE_CODE));
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

export {
  registerLanguage as registerLanguageDictionary,
  getLanguage as getLanguageDictionary,
  hasLanguage as hasLanguageDictionary,
  getDefaultLanguage as getDefaultLanguageDictionary,
  getLanguages as getLanguagesDictionaries,
  DEFAULT_LANGUAGE_CODE
};

/**
 * Automatically registers default dictionary.
 */
registerLanguage(DEFAULT_DICTIONARY);
