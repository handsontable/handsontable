import {extendNotExistingKeys} from './utils';

const langDefinitions = new Map();

export const DEFAULT_LANGUAGE_CODE = 'en';

function extendDefinitionByDefaultLangBase(languageCode, langDefinition) {
  if (languageCode !== DEFAULT_LANGUAGE_CODE) {
    extendNotExistingKeys(langDefinition, langDefinitions.get(DEFAULT_LANGUAGE_CODE));
  }
};

export function register(languageCode, langDefinition) {
  extendDefinitionByDefaultLangBase(languageCode, langDefinition);
  langDefinitions.set(languageCode, langDefinition);
}

export function get(languageCode) {
  if (!langDefinitions.has(languageCode)) {
    throw Error(`Locale with "${languageCode}" language code is not defined.`);
  }

  return langDefinitions.get(languageCode);
}
