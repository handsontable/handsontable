import {arrayEach} from './../helpers/array';
import {isDefined} from './../helpers/mixed';
import {langDefinitionsController, DEFAULT_LANGUAGE_CODE} from './langDefinitionsController';
import {formattersController} from './formattersController';
import './languages/en';
import './languages/pl';
import './formatters/substituteVariables';
import './formatters/pluralize';

const hotLanguages = new WeakMap();
const hotOnLocaleChangeCallbacks = new WeakMap();

class LanguageController {
  /**
   * Set actual locale.
   *
   * @param {Object} hotInstance Instance of Handsontable for which we set language.
   * @param {string} languageCode Language code.
   */
  static setLocale(hotInstance, languageCode = DEFAULT_LANGUAGE_CODE) {
    const hotLanguage = hotLanguages.get(hotInstance);
    const hotLanguageCode = hotLanguage && hotLanguage.code;

    if (hotLanguageCode !== languageCode) {
      hotLanguages.set(hotInstance, {
        code: languageCode,
        definitions: langDefinitionsController.getDefinitions(languageCode)
      });
    }

    if (isDefined(hotLanguageCode)) {
      arrayEach(hotOnLocaleChangeCallbacks.get(hotInstance) || [], (callback) => {
        callback();
      });
    }
  }

  /**
   * Get formatted phrase from phrases propositions under specified dictionary key.
   *
   * @param {Object} hotInstance Instance of Handsontable for which we get phrase.
   * @param {String} dictionaryKey Constant which is dictionary key.
   * @param {Object} zippedVariableAndValues Object containing variables and corresponding values
   * which will be handled by formatters.
   *
   * @returns {string}
   */
  static getPhrase(hotInstance, dictionaryKey, zippedVariableAndValues) {
    const hotLanguageCode = hotLanguages.get(hotInstance).code;
    let phrasePropositions = hotLanguages.get(hotInstance).definitions[dictionaryKey];

    arrayEach(formattersController.getFormatters(), (formatter) => {
      phrasePropositions = formatter(phrasePropositions, zippedVariableAndValues, hotLanguageCode);
    });

    return phrasePropositions;
  }

  /**
   * Register callback which will be executed after locale change.
   *
   * @param {Object} hotInstance Instance of Handsontable for which we register locale change callback.
   * @param {string} dictionaryKey Constant which is dictionary key.
   * @param {Object} zippedVariableAndValues  Object containing variables and corresponding values
   * @param {Function} callback Function which will be executed after locale change, as parameter gets phrase which is
   * created from `dictionaryKey` and `zippedVariableAndValues` parameters
   */
  static registerLocaleChangeFn(hotInstance, dictionaryKey, zippedVariableAndValues, callback) {
    const callbacks = hotOnLocaleChangeCallbacks.get(hotInstance) || [];

    callbacks.push(() => {
      const phrase = LanguageController.getPhrase(hotInstance, dictionaryKey, zippedVariableAndValues);

      callback.call(hotInstance, phrase);
    });

    hotOnLocaleChangeCallbacks.set(hotInstance, callbacks);
  }
}

export default LanguageController;
