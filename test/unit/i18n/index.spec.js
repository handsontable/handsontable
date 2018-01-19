import {getLanguageDictionary, getLanguagesDictionaries, registerLanguageDictionary} from 'handsontable/i18n/dictionariesManager';
import {register as registerPhraseFormatter} from 'handsontable/i18n/phraseFormatters';
import plPL from 'handsontable/i18n/languages/pl-PL';
import * as allLanguages from 'handsontable/i18n/languages';
import * as constants from 'handsontable/i18n/constants';
import Handsontable from 'handsontable';

describe('i18n', () => {
  beforeAll(() => {
    // Note: please keep in mind that this language will be registered for all unit tests!
    // It's stored globally for already loaded Handsontable library.

    Handsontable.languages.registerLanguageDictionary(plPL);
  });

  const INSERT_ROW_ABOVE_DICTIONARY_KEY = 'ContextMenu:items.insertRowAbove';
  const INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE = 'Wstaw wiersz powyżej';

  it('should extend Handsontable by language keys containing functions and constants for translation', () => {
    expect(Handsontable.languages.getLanguageDictionary).toBe(getLanguageDictionary);
    expect(Handsontable.languages.getLanguagesDictionaries).toBe(getLanguagesDictionaries);
    expect(Handsontable.languages.registerLanguageDictionary).toBe(registerLanguageDictionary);
    expect(Handsontable.languages.dictionaryKeys).toBe(constants);
  });

  it('should get translated phrase by `getTranslatedPhrase` function', () => {
    expect(Handsontable.languages.getTranslatedPhrase(plPL.languageCode, INSERT_ROW_ABOVE_DICTIONARY_KEY)).toEqual(plPL[INSERT_ROW_ABOVE_DICTIONARY_KEY]);
    expect(Handsontable.languages.getTranslatedPhrase(plPL.languageCode, INSERT_ROW_ABOVE_DICTIONARY_KEY)).toEqual(INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE);
  });

  it('should get `null` when trying to translate phrase by passing language code of not registered language', () => {
    const notRegisteredLanguageCode = 'br-Za';

    expect(Handsontable.languages.getTranslatedPhrase(notRegisteredLanguageCode, INSERT_ROW_ABOVE_DICTIONARY_KEY)).toEqual(null);
  });

  it('should call formatters when `getTranslatedPhrase` function is called', () => {
    let formatterWasRun = false;

    registerPhraseFormatter('formatterChangingVariable', () => { formatterWasRun = true; });

    expect(formatterWasRun).toEqual(false);

    Handsontable.languages.getTranslatedPhrase(plPL.languageCode, INSERT_ROW_ABOVE_DICTIONARY_KEY);

    expect(formatterWasRun).toEqual(true);
  });

  describe('Collection of language packs', () => {
    // One of keys can be `__esModule` added by Babel. We separate out it.
    const dictionariesExportNames = Object.keys(allLanguages).filter(
      (exportedKey) => exportedKey !== '__esModule'
    );
    const dictionaries = dictionariesExportNames.map((exportName) => allLanguages[exportName]);
    const languageCodes = dictionaries.map((dictionary) => dictionary.languageCode);

    const keysGroupedByDictionary = dictionaries.map((dictionary) => Object.keys(dictionary));
    const dictionariesKeys = [].concat([], ...keysGroupedByDictionary);

    const valuesGroupedByDictionary = dictionaries.map((dictionary) => Object.values(dictionary));
    const dictionariesValuesWithArrays = [].concat([], ...valuesGroupedByDictionary);
    const dictionariesValuesWithoutArrays = [].concat([], ...dictionariesValuesWithArrays);

    it('should not contain not matching elements', () => {
      // Checking if only dictionaries was exported.
      expect(dictionaries.every(
        (dictionaryCandidate) => typeof dictionaryCandidate === 'object' &&
          dictionaryCandidate.languageCode !== undefined
      )).toBeTruthy();

      // Checking if collection contains more than one dictionary (not only default language pack).
      expect(dictionaries.length).toBeGreaterThan(1);

      // Checking if keys inside dictionaries are strings
      expect(keysGroupedByDictionary.every((groupOfDictionaryKeys) => Array.isArray(groupOfDictionaryKeys))).toBeTruthy();
      expect(dictionariesKeys.every((key) => typeof key === 'string')).toBeTruthy();

      // Checking if values inside dictionaries are strings or arrays
      expect(valuesGroupedByDictionary.every((groupOfDictionaryValues) =>
        Array.isArray(groupOfDictionaryValues))).toBeTruthy();
      expect(dictionariesValuesWithArrays.every((value) => typeof value === 'string' || Array.isArray(value))).toBeTruthy();
      expect(dictionariesValuesWithoutArrays.every((value) => typeof value === 'string')).toBeTruthy();
    });

    it('should not contain two or more dictionaries with the same language code', () => {
      expect(Array.from(new Set(languageCodes).values())).toEqual(languageCodes);
    });

    it('should contain dictionaries with proper language code and', () => {
      // Every languageCode should have proper format.
      // Name of language code inside separate language file from `src/i18n/languages` folder should match to a pattern:
      // two lowercase letters, hyphen, two uppercase letters, for example: `es-PY`.
      expect(languageCodes.find((languageCode) =>
        /^([a-z]{2})-([A-Z]{2})$/.test(languageCode) === false
      )).not.toBeDefined();
    });

    it('should named properly export of dictionary inside exports object', () => {
      // Every dictionary should have export with name corresponding to it's language code.
      // Name of exports inside `src/i18n/languages/index.js` file should match to a pattern:
      // two lowercase letters, two uppercase letters, for example: `esPY`.
      expect(languageCodes.find((languageCode) =>
        allLanguages[languageCode.replace('-', '')] === undefined
      )).not.toBeDefined();
    });

    it('should contain dictionaries with predefined keys as parts of dictionary (checking for typo)', () => {
      // If you would like to extend any dictionary by a custom key, define also corresponding,
      // exported constant for it inside `src/i18n/constants.js` file.
      const predefinedDictionaryKeys = Object.values(constants);

      expect(dictionariesKeys.find((dictionaryKey) =>
        dictionaryKey !== 'languageCode' && predefinedDictionaryKeys.includes(dictionaryKey) === false
      )).not.toBeDefined();
    });

    it('should contain dictionaries values without unnecessary whitespace characters', () => {
      expect(dictionariesValuesWithoutArrays.find((value) => value !== value.trim())).not.toBeDefined();
      expect(dictionariesValuesWithoutArrays.find((value) => / {2,}/.test(value))).not.toBeDefined();
    });
  });
});
