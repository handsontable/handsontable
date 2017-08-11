import {getDefinition} from './localeRegisterer';
import {deepExtend} from './../helpers/object';
import getNestedObjectKey from './utils';
import {LANGUAGE_CODE as ENG_LANGUAGE_CODE, phraseDefinitions as ENG_PHRASES_DEFINITIONS} from './languages/en';
import './languages/pl';

class LanguageController {
  constructor(languageCode = ENG_LANGUAGE_CODE) {
    /**
     * Language code for current locale.
     * @type {String}
     */
    this.code = null;
    /**
     * Locale phraseDefinitions
     * @type Object
     */
    this.phraseDefinitions = null;

    this.setLocale(languageCode);
  }

  /**
   * Get phrases for current locale.
   */
  getPhrasesFromNamespace(namespace) {
    return getNestedObjectKey(this.phraseDefinitions, namespace);
  }

  /**
   * Set actual locale.
   * @param {String} languageCode Language code.
   */
  setLocale(languageCode) {
    try {
      const phraseDefinitions = getDefinition(languageCode);

      if (phraseDefinitions !== ENG_PHRASES_DEFINITIONS) {
        deepExtend(phraseDefinitions, ENG_PHRASES_DEFINITIONS);
      }

      this.phraseDefinitions = phraseDefinitions;
      this.code = languageCode;

    } catch (error) {
      throw error;
    }
  }

  static getSingleton() {
    return singleton;
  }
}

const singleton = new LanguageController();

export default LanguageController;
