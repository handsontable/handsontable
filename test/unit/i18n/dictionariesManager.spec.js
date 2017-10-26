import {getLanguage, getLanguages, registerLanguage, DEFAULT_LANGUAGE_CODE} from 'handsontable/i18n/dictionariesManager';
import plPL from 'handsontable/i18n/languages/pl-PL';

describe('i18n dictionariesManager', () => {
  it('should register automatically default language', () => {
    const allLanguages = getLanguages();
    const defaultLanguageIsRegistered = allLanguages.some((dictionary) => dictionary.languageCode === DEFAULT_LANGUAGE_CODE);

    expect(defaultLanguageIsRegistered).toEqual(true);
  });

  it('should not register automatically imported /src languages', () => {
    expect(getLanguage(plPL.languageCode)).toEqual(null);
  });

  it('should register language', () => {
    // Note: please keep in mind that this language will be registered also for next unit tests!
    // It's stored globally for already loaded Handsontable library.

    registerLanguage(plPL);

    expect(getLanguages().length).toEqual(2);
  });
});
