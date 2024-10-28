export interface LanguageDictionary {
  [phraseKey: string]: string | string[];
  languageCode: string;
}

export function registerLanguageDictionary(languageCodeOrDictionary: LanguageDictionary | string,
  dictionary?: LanguageDictionary): LanguageDictionary;
export function getLanguageDictionary(languageCode: string): LanguageDictionary;
export function hasLanguageDictionary(languageCode: string): boolean;
export function getDefaultLanguageDictionary(): LanguageDictionary;
export function getLanguagesDictionaries(): LanguageDictionary[];
export function getTranslatedPhrase(dictionaryKey: string, argumentsForFormatters?: any): string;
export function getValidLanguageCode(languageCode: string): string;
