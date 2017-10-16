import {arrayEach} from './../helpers/array';
import {getLanguage as getLanguageDictionary} from './dictionariesManager';
import {getAll as getPhraseFormatters} from './phraseFormatters';
import {isUndefined} from '../helpers/mixed';

const hotOnLanguageChangeCallbacks = new WeakMap();

/**
 * Get phrase for specified dictionary key.
 *
 * @param {string} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @param {string} dictionaryKey Constant which is dictionary key.
 * @param {*} argumentsForFormatters Arguments which will be handled by formatters.
 *
 * @returns {string}
*/
export function getTranslatedPhrase(languageCode, dictionaryKey, argumentsForFormatters) {
  const languageDictionary = getLanguageDictionary(languageCode);

  if (languageDictionary === null) {
    return null;
  }

  const phrasePropositions = languageDictionary[dictionaryKey];

  if (isUndefined(phrasePropositions)) {
    return null;
  }

  const formattedPhrase = getFormattedPhrase(phrasePropositions, argumentsForFormatters);

  if (Array.isArray(formattedPhrase)) {
    return formattedPhrase[0];
  }

  return formattedPhrase;
}

/**
 * Get formatted phrase from phrases propositions for specified dictionary key.
 *
 * @private
 * @param {Array|string} phrasePropositions List of phrase propositions.
 * @param {*} argumentsForFormatters Arguments which will be handled by formatters.
 *
 * @returns {Array|string}
 */
function getFormattedPhrase(phrasePropositions, ...args) {
  let formattedPhrasePropositions = phrasePropositions;

  arrayEach(getPhraseFormatters(), (formatter) => {
    formattedPhrasePropositions = formatter(phrasePropositions, ...args);
  });

  return formattedPhrasePropositions;
}

/**
 * Register callback which will be executed after language change.
 *
 * @param {Object} hotInstance Instance of Handsontable for which we register language change callback.
 * @param {string} dictionaryKey Constant which is dictionary key.
 * @param {*} argumentsForFormatters Arguments which will be handled by formatters.
 * @param {Function} callback Function which will be executed after language change, as parameter gets phrase which is
 * created from `dictionaryKey` and `zippedVariableAndValues` parameters
 */
export function registerLanguageChangeFn(hotInstance, dictionaryKey, argumentsForFormatters, callback) {
  const callbacks = hotOnLanguageChangeCallbacks.get(hotInstance) || [];

  callbacks.push(() => {
    const phrase = getPhrase(hotInstance, dictionaryKey, argumentsForFormatters);

    callback.call(hotInstance, phrase);
  });

  hotOnLanguageChangeCallbacks.set(hotInstance, callbacks);
}

/**
 * Run callbacks on language change.
 *
 * @private
 * @param {Object} hotInstance Instance of Handsontable for which we set language.
 */
export function runOnLanguageChangeCallbacks(hotInstance) {
  arrayEach(hotOnLanguageChangeCallbacks.get(hotInstance) || [], (callback) => {
    callback();
  });
}
