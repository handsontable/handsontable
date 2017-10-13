import staticRegister from '../utils/staticRegister';
import {extendNotExistingKeys} from './utils';
import DEFAULT_DICTIONARY from './languages/en-US';

export const DEFAULT_LANGUAGE_CODE = DEFAULT_DICTIONARY.languageCode;

const {
  register: registerGloballyLanguageDictionary,
  getItem: getGlobalLanguageDictionary,
  hasItem: hasGlobalLanguageDictionary,
  getValues: getGlobalLanguagesDictionaries
} = staticRegister('languagesDictionaries');

/**
 * Register language dictionary for specific language code.
 *
 * @param {string} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @param {Object} dictionary Dictionary for specific language.
 */
export function registerLanguage(languageCode, dictionary) {
  extendLangDictionaryByDefaultLangDictionary(languageCode, dictionary);
  registerGloballyLanguageDictionary(languageCode, dictionary);
};

/**
 * Get language dictionary for specific language code.
 *
 * @param {String} languageCode Language code.
 * @returns {Object} Object with constants representing identifiers for translation (as keys) and corresponding translation phrases (as values).
 */
export function getLanguage(languageCode) {
  if (!hasGlobalLanguageDictionary(languageCode)) {
    throw Error(`Language dictionary with "${languageCode}" language code is not defined. It wasn't previously registered.`);
  }

  return getGlobalLanguageDictionary(languageCode);
}

/**
 * Extend handled dictionary by default language dictionary. As result, if any dictionary key isn't defined for specific language, it will be filled with default language value ("dictionary gaps" are supplemented).
 *
 * @private
 * @param {String} languageCode Language code.
 * @param {Object} dictionary Dictionary which is extended.
 */
function extendLangDictionaryByDefaultLangDictionary(languageCode, dictionary) {
  if (languageCode !== DEFAULT_LANGUAGE_CODE) {
    extendNotExistingKeys(dictionary, getGlobalLanguageDictionary(DEFAULT_LANGUAGE_CODE));
  }
}

/**
 * Get registered language dictionaries.
 *
 * @returns {Array}
 */
export function getLanguages() {
  return getGlobalLanguagesDictionaries();
}

/**
 * Automatically registers default dictionary.
 */
registerLanguage(DEFAULT_LANGUAGE_CODE, DEFAULT_DICTIONARY);
