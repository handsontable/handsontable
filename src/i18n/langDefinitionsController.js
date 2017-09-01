import {extendNotExistingKeys} from './utils';

export const DEFAULT_LANGUAGE_CODE = 'en';

class LangDefinitionsController {
  constructor() {
    /**
     * Language definitions. At specified language code we have got a locale dictionary.
     *
     * @type {Map}
     */
    this.langDefinitions = new Map();
  }

  /**
   * Register dictionary for specific language code.
   *
   * @param languageCode Language code for specific locale i.e. 'en', 'pt', 'de'.
   * @param langDefinition Dictionary for specific language.
   */
  registerLangDefinition(languageCode, langDefinition) {
    if (!this.langDefinitions.has(languageCode)) {
      this.extendDefinitionByDefaultLangBase(languageCode, langDefinition);
      this.langDefinitions.set(languageCode, langDefinition);
    }
  }

  /**
   * Dictionary for specific language code.
   *
   * @param languageCode Language code
   * @returns {Object}
   */
  getDefinition(languageCode) {
    if (!this.langDefinitions.has(languageCode)) {
      throw Error(`Locale with "${languageCode}" language code is not defined.`);
    }

    return this.langDefinitions.get(languageCode);
  }

  /**
   * Extend handled dictionary by default language dictionary. As result, if any dictionary key isn't defined
   * for specific language, it will be filled with default language value.
   *
   * @param languageCode Language code
   * @param langDefinition Dictionary which is extended.
   */
  extendDefinitionByDefaultLangBase(languageCode, langDefinition) {
    if (languageCode !== DEFAULT_LANGUAGE_CODE) {
      extendNotExistingKeys(langDefinition, this.langDefinitions.get(DEFAULT_LANGUAGE_CODE));
    }
  }
}

const singleton = new LangDefinitionsController();

export {singleton as langDefinitionsController};
