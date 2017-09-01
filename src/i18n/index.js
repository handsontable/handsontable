import {arrayEach} from './../helpers/array';
import {langDefinitionsController, DEFAULT_LANGUAGE_CODE} from './langDefinitionsController';
import {formattersController} from './formattersController';
import './languages/en';
import './languages/pl';
import './formatters/substituteVariables';
import './formatters/pluralize';

const hotLanguages = new WeakMap();

class LanguageController {
  /**
   * Set actual locale.
   *
   * @param {Object} hotInstance Instance of Handsontable for which we set language.
   * @param {string} languageCode Language code.
   */
  static setLocale(hotInstance, languageCode = DEFAULT_LANGUAGE_CODE) {
    const hotLanguage = hotLanguages.get(hotInstance);
    const hotCode = hotLanguage && hotLanguage.code;

    if (hotCode !== languageCode) {
      hotLanguages.set(hotInstance, {
        code: languageCode,
        definition: langDefinitionsController.getDefinition(languageCode)
      });
    }
  }

  /**
   * Get formatted phrase from phrases propositions under specified dictionary key.
   *
   * @param {Object} hotInstance Instance of Handsontable for which we get phrase.
   * @param dictionaryKey Constant which is dictionary key.
   * @param zippedVariableAndValue Object containing variables and corresponding values
   * which will be handled by formatters.
   *
   * @returns {string}
   */
  static getPhrase(hotInstance, dictionaryKey, zippedVariableAndValue) {
    const hotLanguageCode = hotLanguages.get(hotInstance).code;
    let phrasePropositions = hotLanguages.get(hotInstance).definition[dictionaryKey];

    arrayEach(formattersController.getFormatters(), (formatter) => {
      phrasePropositions = formatter(phrasePropositions, zippedVariableAndValue, hotLanguageCode);
    });

    return phrasePropositions;
  }
}

export default LanguageController;
