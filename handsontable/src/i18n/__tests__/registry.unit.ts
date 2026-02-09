import {
  dictionaryKeys,
  getLanguageDictionary,
  getLanguagesDictionaries,
  getValidLanguageCode,
  hasLanguageDictionary,
  registerLanguageDictionary,
  DEFAULT_LANGUAGE_CODE
} from 'handsontable/i18n';
import plPL from 'handsontable/i18n/languages/pl-PL';
import enUS from 'handsontable/i18n/languages/en-US';

describe('i18n registry', () => {
  it('should register automatically default language', () => {
    const allLanguages = getLanguagesDictionaries();
    const defaultLanguageIsRegistered = allLanguages
      .some(dictionary => dictionary.languageCode === DEFAULT_LANGUAGE_CODE);

    expect(defaultLanguageIsRegistered).toEqual(true);
  });

  it('should not register automatically imported /src languages', () => {
    expect(hasLanguageDictionary(plPL.languageCode)).toEqual(false);
  });

  it('should return `null` when trying to get not registered language', () => {
    expect(getLanguageDictionary(plPL.languageCode)).toEqual(null);
  });

  it('should register language', () => {
    // Note: please keep in mind that this language will be registered also for next unit tests (within this file)!
    // It's stored globally for already loaded Handsontable library.

    registerLanguageDictionary(plPL);

    expect(getLanguagesDictionaries().length).toEqual(2);
  });

  it('should register language only once', () => {
    registerLanguageDictionary(plPL);
    registerLanguageDictionary(plPL);
    registerLanguageDictionary(enUS);
    registerLanguageDictionary(enUS);

    expect(getLanguagesDictionaries().length).toEqual(2);
  });

  it('should not give opportunity to change registered language by reference', () => {
    const registeredLanguageDictionary1 = registerLanguageDictionary(plPL);
    const registeredLanguageDictionary2 = registerLanguageDictionary(plPL);

    registeredLanguageDictionary1.newExtraKey1 = 'hello world1';
    registeredLanguageDictionary2.newExtraKey2 = 'hello world2';

    expect(getLanguageDictionary(plPL.languageCode).newExtraKey).toBeUndefined();
    expect(getLanguageDictionary(plPL.languageCode).newExtraKey2).toBeUndefined();
    expect(registeredLanguageDictionary1).not.toBe(plPL);
    expect(registeredLanguageDictionary2).not.toBe(plPL);
    expect(registeredLanguageDictionary1).not.toBe(registeredLanguageDictionary2);

    plPL.newExtraKey3 = 'hello world3';
    expect(getLanguageDictionary(plPL.languageCode).newExtraKey3).toBeUndefined();

    delete plPL.newExtraKey3;
  });

  it('should return `true` when checking existence of previously registered language', () => {
    expect(hasLanguageDictionary(plPL.languageCode)).toEqual(true);
  });

  it('should return `true` when checking existence of default language', () => {
    expect(hasLanguageDictionary(DEFAULT_LANGUAGE_CODE)).toEqual(true);
  });

  it('should return copy of registered dictionary when getting previously registered language', () => {
    expect(getLanguageDictionary(plPL.languageCode)).toEqual(plPL);
    expect(getLanguageDictionary(plPL.languageCode)).not.toBe(plPL);
  });

  it('should extend registered language by default language dictionary', () => {
    const defaultLanguageDictionary = getLanguageDictionary(DEFAULT_LANGUAGE_CODE);

    const dictionaryKey1 = dictionaryKeys.CONTEXTMENU_ITEMS_ROW_ABOVE;
    const dictionaryKey2 = dictionaryKeys.CONTEXTMENU_ITEMS_COLUMN_RIGHT;

    const registeredLanguage = registerLanguageDictionary({
      languageCode: 'kl-PU',
      [dictionaryKey1]: 'Hello world'
    });

    expect(registeredLanguage[dictionaryKey1]).toEqual('Hello world');
    expect(registeredLanguage[dictionaryKey2]).toEqual(defaultLanguageDictionary[dictionaryKey2]);
  });

  describe('getValidLanguageCode', () => {
    beforeAll(() => {
      // Note: please keep in mind that this language will be registered also for next unit tests (within this file)!
      // It's stored globally for already loaded Handsontable library.

      registerLanguageDictionary(plPL);
    });

    it('should returns valid language code', () => {
      expect(getValidLanguageCode(plPL.languageCode)).toEqual(plPL.languageCode);
    });

    it('should returns default language code when provided valid code not exist in the registered languages', () => {
      spyOn(console, 'error');

      expect(getValidLanguageCode('aa-BB')).toEqual(DEFAULT_LANGUAGE_CODE);
    });

    it('should log error when handling not existing language', () => {
      const spy = spyOn(console, 'error');

      getValidLanguageCode('aa-BB');

      expect(spy).toHaveBeenCalled();
    });
  });
});
