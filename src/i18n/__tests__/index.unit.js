import {
  getLanguageDictionary,
  getLanguagesDictionaries,
  registerLanguageDictionary
} from 'handsontable/i18n';
import { register as registerPhraseFormatter } from 'handsontable/i18n/phraseFormatters';
import plPL from 'handsontable/i18n/languages/pl-PL';
import * as allLanguages from 'handsontable/i18n/languages';
import * as constants from 'handsontable/i18n/constants';
import Handsontable from 'handsontable';
import fs from 'fs';

describe('i18n', () => {
  beforeAll(() => {
    // Note: please keep in mind that this language will be registered for all unit tests!
    // It's stored globally for already loaded Handsontable library.

    Handsontable.languages.registerLanguageDictionary(plPL);
  });

  const INSERT_ROW_ABOVE_DICTIONARY_KEY = 'ContextMenu:items.insertRowAbove';
  const INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE = 'Wstaw wiersz powyżej';

  it('should extend Handsontable global by functions and constants for translation', () => {
    expect(Handsontable.languages.getLanguageDictionary).toBe(getLanguageDictionary);
    expect(Handsontable.languages.getLanguagesDictionaries).toBe(getLanguagesDictionaries);
    expect(Handsontable.languages.registerLanguageDictionary).toBe(registerLanguageDictionary);
    expect(Handsontable.languages.dictionaryKeys).toBe(constants);
  });

  it('should get translated phrase by `getTranslatedPhrase` function', () => {
    expect(Handsontable.languages.getTranslatedPhrase(plPL.languageCode, INSERT_ROW_ABOVE_DICTIONARY_KEY))
      .toEqual(plPL[INSERT_ROW_ABOVE_DICTIONARY_KEY]);
    expect(Handsontable.languages.getTranslatedPhrase(plPL.languageCode, INSERT_ROW_ABOVE_DICTIONARY_KEY))
      .toEqual(INSERT_ROW_ABOVE_IN_POLISH_LANGUAGE);
  });

  it('should get `null` when trying to translate phrase by passing language code of not registered language', () => {
    const notRegisteredLanguageCode = 'br-Za';

    expect(Handsontable.languages.getTranslatedPhrase(notRegisteredLanguageCode, INSERT_ROW_ABOVE_DICTIONARY_KEY))
      .toEqual(null);
  });

  it('should call formatters when `getTranslatedPhrase` function is called', () => {
    let formatterWasRun = false;

    registerPhraseFormatter('formatterChangingVariable', () => { formatterWasRun = true; });

    expect(formatterWasRun).toEqual(false);

    Handsontable.languages.getTranslatedPhrase(plPL.languageCode, INSERT_ROW_ABOVE_DICTIONARY_KEY);

    expect(formatterWasRun).toEqual(true);
  });

  describe('Collection of language packs', () => {
    // One of keys can be `__esModule` added by Babel. We separate it.
    const indexFileExportNames = Object.getOwnPropertyNames(allLanguages)
      .filter(exportedKey => exportedKey !== '__esModule');
    const dictionaries = indexFileExportNames.map(exportName => allLanguages[exportName]);
    const languageCodes = dictionaries.map(dictionary => dictionary.languageCode);

    const keysGroupedByDictionary = dictionaries.map(dictionary => Object.keys(dictionary));
    const dictionariesKeys = [].concat([], ...keysGroupedByDictionary).filter(key => key !== 'languageCode');

    const valuesGroupedByDictionary = dictionaries.map(dictionary => Object.values(dictionary));
    const dictionariesValuesWithArrays = [].concat([], ...valuesGroupedByDictionary);
    const dictionariesValuesWithoutArrays = [].concat([], ...dictionariesValuesWithArrays);

    const filesInsideLanguageDictionary = fs.readdirSync('./src/i18n/languages');
    const languagePacks = filesInsideLanguageDictionary.filter(name => name !== 'index.js');

    describe('with every dictionary from `src/i18n/languages` folder', () => {
      // We take all dictionaries from export inside `src/i18n/languages/index.js` file.
      // We do not use dynamic import to take them from particular language files.
      // Workaround to stop next tests when below expectations fail. Without the conditions rest of tests is useless.
      // Jasmine problem described: https://github.com/jasmine/jasmine/issues/414
      expect(indexFileExportNames.length).toBeGreaterThan(0);
      expect(languageCodes.length).toBeGreaterThan(0);
      expect(indexFileExportNames.length).toEqual(languagePacks.length);

      it('should not contain two or more dictionaries with the same language code', () => {
        expect(languageCodes).toEqual(Array.from(new Set(languageCodes).values()));
      });

      describe('File `src/i18n/languages/index.js`', () => {
        it('should provide export names sorted alphabetically', () => {
          // Does ES6 introduce a well-defined order of enumeration for object properties?
          // https://stackoverflow.com/a/30919039
          expect(indexFileExportNames.length).toBeGreaterThan(0);
          expect(indexFileExportNames).toEqual(indexFileExportNames.slice().sort());
        });

        it('should provide export names corresponding to dictionaries file names', () => {
          // two lowercase letters, two uppercase letters, for example: `esPY`.
          expect(indexFileExportNames).toBeListFulfillingCondition(exportName =>
            languagePacks.map(languagePack => languagePack.replace('.js', '').replace('-', '')).includes(exportName));
        });
      });

      describe('Particular dictionary', () => {
        it('should contain language code of proper format', () => {
          // two lowercase letters, hyphen, two uppercase letters, for example: `es-PY`.
          expect(languageCodes)
            .toBeListFulfillingCondition(languageCode => /^([a-z]{2})-([A-Z]{2})$/.test(languageCode));
        });

        it('should have file name corresponding to its language code', () => {
          // two lowercase letters, hyphen, two uppercase letters and JavaScript file extension, for example: `es-PY.js`.
          expect(languagePacks)
            .toBeListFulfillingCondition(languagePack => languageCodes.includes(languagePack.replace('.js', '')));
        });

        it('should contain only predefined keys (checking for typo)', () => {
          // If you would like to extend any dictionary by a custom key, define also corresponding, exported constant
          // for it inside the `src/i18n/constants.js` file.
          const predefinedDictionaryKeys = Object.values(constants);

          expect(dictionariesKeys)
            .toBeListFulfillingCondition(dictionaryKey => predefinedDictionaryKeys.includes(dictionaryKey));
        });

        it('should contain values defined as strings or arrays of strings, without unnecessary whitespace characters', () => {
          expect(dictionariesValuesWithArrays)
            .toBeListFulfillingCondition(value => typeof value === 'string' || Array.isArray(value));
          expect(dictionariesValuesWithoutArrays)
            .toBeListFulfillingCondition(value => typeof value === 'string');
          expect(dictionariesValuesWithoutArrays)
            .toBeListFulfillingCondition(value => value === value.trim());
          expect(dictionariesValuesWithoutArrays)
            .toBeListFulfillingCondition(value => / {2,}/.test(value) === false);
        });
      });
    });
  });
});
