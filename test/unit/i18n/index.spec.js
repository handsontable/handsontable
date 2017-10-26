import {getLanguage, getLanguages, registerLanguage} from 'handsontable/i18n/dictionariesManager';
import plPL from 'handsontable/i18n/languages/pl-PL';
import * as constants from 'handsontable/i18n/constants';
import Handsontable from 'handsontable';

describe('i18n', () => {
  beforeAll(() => {
    // Note: please keep in mind that this language will be registered for all unit tests!
    // It's stored globally for already loaded Handsontable library.

    Handsontable.languages.register(plPL);
  });

  it('should extend Handsontable by language keys containing functions and constants for translation', () => {
    expect(Handsontable.languages.get).toBe(getLanguage);
    expect(Handsontable.languages.getAll).toBe(getLanguages);
    expect(Handsontable.languages.register).toBe(registerLanguage);
    expect(Handsontable.languages.constants).toBe(constants);
  });

  it('should get translated phrase by Handsontable `getTranslatedPhrase` function', () => {
    const dictionaryKey = Handsontable.languages.constants.CONTEXTMENU_ITEMS_ROW_ABOVE;

    expect(Handsontable.languages.getTranslatedPhrase(plPL.languageCode, dictionaryKey)).toEqual(plPL[dictionaryKey]);
  });

  it('should get `null` when trying to translate phrase by passing language code of not registered language', () => {
    const dictionaryKey = Handsontable.languages.constants.CONTEXTMENU_ITEMS_ROW_ABOVE;
    const notRegisteredLanguageCode = 'br-Za';

    expect(Handsontable.languages.getTranslatedPhrase(notRegisteredLanguageCode, dictionaryKey)).toEqual(null);
  });
});
