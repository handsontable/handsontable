import {getLanguage, getLanguages, registerLanguage, hasLanguage, DEFAULT_LANGUAGE_CODE} from 'handsontable/i18n/dictionariesManager';
import plPL from 'handsontable/i18n/languages/pl-PL';
import enUS from 'handsontable/i18n/languages/en-US';
import * as constants from 'handsontable/i18n/constants';

describe('i18n dictionariesManager', () => {
  it('should register automatically default language', () => {
    const allLanguages = getLanguages();
    const defaultLanguageIsRegistered = allLanguages.some((dictionary) => dictionary.languageCode === DEFAULT_LANGUAGE_CODE);

    expect(defaultLanguageIsRegistered).toEqual(true);
  });

  it('should not register automatically imported /src languages', () => {
    expect(hasLanguage(plPL.languageCode)).toEqual(false);
  });

  it('should return `null` when trying to get not registered language', () => {
    expect(getLanguage(plPL.languageCode)).toEqual(null);
  });

  it('should register language', () => {
    // Note: please keep in mind that this language will be registered also for next unit tests!
    // It's stored globally for already loaded Handsontable library.

    registerLanguage(plPL);

    expect(getLanguages().length).toEqual(2);
  });

  it('should register language only once', () => {
    registerLanguage(plPL);
    registerLanguage(plPL);
    registerLanguage(enUS);
    registerLanguage(enUS);

    expect(getLanguages().length).toEqual(2);
  });

  it('should return `true` when checking existence of previously registered language', () => {
    expect(hasLanguage(plPL.languageCode)).toEqual(true);
  });

  it('should return `true` when checking existence of default language', () => {
    expect(hasLanguage(DEFAULT_LANGUAGE_CODE)).toEqual(true);
  });

  it('should return object when getting previously registered language', () => {
    expect(getLanguage(plPL.languageCode)).toEqual(plPL);
  });

  it('should extend registered language by default language dictionary', () => {
    const defaultLanguageDictionary = getLanguage(DEFAULT_LANGUAGE_CODE);

    const dictionaryKey1 = constants.CONTEXTMENU_ITEMS_ROW_ABOVE;
    const dictionaryKey2 = constants.CONTEXTMENU_ITEMS_COLUMN_RIGHT;

    const registeredLanguage = registerLanguage({
      languageCode: 'kl-PU',
      [dictionaryKey1]: 'Hello world'
    });

    expect(registeredLanguage[dictionaryKey1]).toEqual('Hello world');
    expect(registeredLanguage[dictionaryKey2]).toEqual(defaultLanguageDictionary[dictionaryKey2]);
  });
});
