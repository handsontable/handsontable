import {getLanguageDictionary, getLanguagesDictionaries, registerLanguageDictionary} from 'handsontable/i18n/dictionariesManager';
import {register as registerPhraseFormatter} from 'handsontable/i18n/phraseFormatters';
import plPL from 'handsontable/i18n/languages/pl-PL';
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
});
