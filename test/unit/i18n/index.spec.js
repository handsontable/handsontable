import {getLanguageDictionary, getLanguagesDictionaries, registerLanguageDictionary} from 'handsontable/i18n/dictionariesManager';
import {register as registerPhraseFormatter} from 'handsontable/i18n/phraseFormatters';
import plPL from 'handsontable/i18n/languages/pl-PL';
import * as allLanguages from 'handsontable/i18n/languages';
import * as constants from 'handsontable/i18n/constants';
import {isObject, objectEach} from 'handsontable/helpers/object';
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

  it('should contain dictionaries with predefined keys as parts of dictionary (checking for typo)', () => {
    // If you would like to extend any dictionary by a custom key, define also corresponding,
    // exported constant for it inside `src/i18n/constants.js` file.

    const predefinedDictionaryKeys = Object.values(constants);

    objectEach(allLanguages, (dictionary) => {
      objectEach(dictionary, (value, key) => {
        if (key !== 'languageCode') {
          expect(key).toBeDefined();
          expect(predefinedDictionaryKeys.includes(key)).toEqual(true);
        }
      });
    });
  });

  it('should contain dictionaries with proper language code and be named properly inside exports collection', () => {
    // Connected with:
    // b) name of language code inside separate language file from `src/i18n/languages` folder; it should be defined in format:
    // two lowercase letters, hyphen, two uppercase letters, for example: `es-PY`.
    // a) name of exports inside `src/i18n/languages/index.js` file; it should be defined in format:
    // two lowercase letters, two uppercase letters, for example: `esPY`.
    //
    // For more information check language creation steps from the documentation:
    // https://docs.handsontable.com/tutorial-internationalization.html#custom-languages

    const properLanguageCode = /^([a-z]{2})-([A-Z]{2})$/;

    objectEach(allLanguages, (dictionary, exportName) => {
      if (isObject(dictionary)) {
        const languageCode = dictionary.languageCode;
        const correspondingExportName = languageCode && languageCode.replace('-', '');

        expect(properLanguageCode.test(languageCode)).toEqual(true);
        expect(exportName).toEqual(correspondingExportName);
      }
    });
  });
});
