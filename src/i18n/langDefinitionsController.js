import {extendNotExistingKeys} from './utils';

export const DEFAULT_LANGUAGE_CODE = 'en';

class LangDefinitionsController {
  constructor() {
    this.langDefinitions = new Map();
  }

  /**
   * Register dictionary at specific language code.
   *
   * @param languageCode Language code for specific locale i.e. 'en', 'pt', 'de'.
   * @param langDefinition Dictionary for specific language.
   */
  registerLangDefinition(languageCode, langDefinition) {
    this.extendDefinitionByDefaultLangBase(languageCode, langDefinition);
    this.langDefinitions.set(languageCode, langDefinition);
  }

  /**
   * Dictionary for specific language code.
   *
   * @param languageCode Language code for specific locale i.e. 'en', 'pt', 'de'.
   * @returns {Object}
   */
  getDefinition(languageCode) {
    if (!this.langDefinitions.has(languageCode)) {
      throw Error(`Locale with "${languageCode}" language code is not defined.`);
    }

    return this.langDefinitions.get(languageCode);
  }

  /**
   * Extend handled dictionary be default language. As result if any constant isn't defined for specific language
   * default value will be returned.
   *
   * @param languageCode Language code for specific locale i.e. 'en', 'pt', 'de'.
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
