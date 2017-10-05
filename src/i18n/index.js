import {arrayEach} from './../helpers/array';
import {isDefined} from './../helpers/mixed';
import {getLocaleDictionary, DEFAULT_LANGUAGE_CODE} from './dictionaryManager';
import {getPhraseFormatters} from './phraseFormatters';

const hotLanguages = new WeakMap();
const hotOnLocaleChangeCallbacks = new WeakMap();

/**
 * Set actual locale.
 *
 * @param {Object} hotInstance Instance of Handsontable for which we set language.
 * @param {string} languageCode Language code.
 */
export function setLocale(hotInstance, languageCode = DEFAULT_LANGUAGE_CODE) {
  const hotLanguage = hotLanguages.get(hotInstance);
  const hotLanguageCode = hotLanguage && hotLanguage.code;
  const wasLocalizationInitialized = isDefined(hotLanguageCode);
  const isLanguageChanged = hotLanguageCode !== languageCode;

  if (isLanguageChanged) {
    hotLanguages.set(hotInstance, {
      code: languageCode,
      definitions: getLocaleDictionary(languageCode)
    });
  }

  if (wasLocalizationInitialized) {
    runOnLocaleChangeCallbacks(hotInstance);
  }
}

/**
 * Get formatted phrase from phrases propositions for specified dictionary key.
 *
 * @param {Object} hotInstance Instance of Handsontable for which we get phrase.
 * @param {String} dictionaryKey Constant which is dictionary key.
 * @param {Object} argumentsForFormatters Object containing arguments which will be handled by formatters.
 *
 * @returns {string}
*/
export function getPhrase(hotInstance, dictionaryKey, argumentsForFormatters) {
  const hotLanguageCode = hotLanguages.get(hotInstance).code;
  let phrasePropositions = hotLanguages.get(hotInstance).definitions[dictionaryKey];

  return getFormattedPhrasePropositions(phrasePropositions, argumentsForFormatters, hotLanguageCode);
}

/**
 * Register callback which will be executed after locale change.
 *
 * @param {Object} hotInstance Instance of Handsontable for which we register locale change callback.
 * @param {string} dictionaryKey Constant which is dictionary key.
 * @param {Object} argumentsForFormatters  Object containing arguments which will be handled by formatters.
 * @param {Function} callback Function which will be executed after locale change, as parameter gets phrase which is
 * created from `dictionaryKey` and `zippedVariableAndValues` parameters
 */
export function registerLocaleChangeFn(hotInstance, dictionaryKey, argumentsForFormatters, callback) {
  const callbacks = hotOnLocaleChangeCallbacks.get(hotInstance) || [];

  callbacks.push(() => {
    const phrase = getPhrase(hotInstance, dictionaryKey, zippedVariableAndValues);

    callback.call(hotInstance, phrase);
  });

  hotOnLocaleChangeCallbacks.set(hotInstance, callbacks);
}

/**
 * Run callbacks on locale change.
 *
 * @private
 * @param {Object} hotInstance Instance of Handsontable for which we set language.
 */
function runOnLocaleChangeCallbacks(hotInstance) {
  arrayEach(hotOnLocaleChangeCallbacks.get(hotInstance) || [], (callback) => {
    callback();
  });
}

/**
 * Format phrases propositions.
 *
 * @private
 * @param {Array|string} phrasePropositions List of phrase propositions.
 * @param {...string} args Arguments for formatting.
 *
 * @returns {Array|string}
*/
function getFormattedPhrasePropositions(phrasePropositions, ...args) {
  let formattedPhrasePropositions = phrasePropositions;

  arrayEach(getPhraseFormatters(), (formatter) => {
    formattedPhrasePropositions = formatter(phrasePropositions, ...args);
  });

  return formattedPhrasePropositions;
}
