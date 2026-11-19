import {
  dictionaryKeys,
  getLanguageDictionary,
  getLanguagesDictionaries,
  getTranslatedPhrase,
  getValidLanguageCode,
  hasLanguageDictionary,
  registerLanguageDictionary,
  DEFAULT_LANGUAGE_CODE
} from 'handsontable/i18n';
import plPL from 'handsontable/i18n/languages/pl-PL';
import enUS from 'handsontable/i18n/languages/en-US';
import srLatnRS from 'handsontable/i18n/languages/sr-Latn-RS';
import srSP from 'handsontable/i18n/languages/sr-SP';
import { _resetDeprecationWarnings } from 'handsontable/helpers/console';
import { registerPhraseFormatter } from 'handsontable/i18n/phraseFormatters';
import pluralize from 'handsontable/i18n/phraseFormatters/pluralize';

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

  describe('getTranslatedPhrase', () => {
    const { CONTEXTMENU_ITEMS_ROW_ABOVE, CONTEXTMENU_ITEMS_REMOVE_ROW, PAGINATION_NAV_SECTION } = dictionaryKeys;

    it('should return plain, pluralized, and substituted phrases of the registered dictionary', () => {
      const [singular, plural] = plPL[CONTEXTMENU_ITEMS_REMOVE_ROW];

      expect(getTranslatedPhrase(plPL.languageCode, CONTEXTMENU_ITEMS_ROW_ABOVE, undefined))
        .toBe(plPL[CONTEXTMENU_ITEMS_ROW_ABOVE]);
      expect(getTranslatedPhrase(plPL.languageCode, CONTEXTMENU_ITEMS_REMOVE_ROW, undefined)).toBe(singular);
      expect(getTranslatedPhrase(plPL.languageCode, CONTEXTMENU_ITEMS_REMOVE_ROW, 0)).toBe(singular);
      expect(getTranslatedPhrase(plPL.languageCode, CONTEXTMENU_ITEMS_REMOVE_ROW, 1)).toBe(plural);
      expect(getTranslatedPhrase(DEFAULT_LANGUAGE_CODE, PAGINATION_NAV_SECTION, { currentPage: 3, totalPages: 7 }))
        .toBe('Page 3 of 7');
    });

    it('should return `null` for a language or a key that is not registered', () => {
      expect(getTranslatedPhrase('xx-XX', CONTEXTMENU_ITEMS_ROW_ABOVE, undefined)).toBeNull();
      expect(getTranslatedPhrase(plPL.languageCode, 'Not:a.key', undefined)).toBeNull();
    });

    it('should keep translating from the registry when the copy from `getLanguageDictionary()` is mutated', () => {
      const [singular, plural] = plPL[CONTEXTMENU_ITEMS_REMOVE_ROW];
      const dictionaryCopy = getLanguageDictionary(plPL.languageCode);

      dictionaryCopy[CONTEXTMENU_ITEMS_ROW_ABOVE] = 'changed';
      dictionaryCopy[CONTEXTMENU_ITEMS_REMOVE_ROW][0] = 'changed';
      dictionaryCopy[CONTEXTMENU_ITEMS_REMOVE_ROW].push('changed');

      expect(getTranslatedPhrase(plPL.languageCode, CONTEXTMENU_ITEMS_ROW_ABOVE, undefined))
        .toBe(plPL[CONTEXTMENU_ITEMS_ROW_ABOVE]);
      expect(getTranslatedPhrase(plPL.languageCode, CONTEXTMENU_ITEMS_REMOVE_ROW, 0)).toBe(singular);
      expect(getLanguageDictionary(plPL.languageCode)[CONTEXTMENU_ITEMS_REMOVE_ROW]).toEqual([singular, plural]);
    });

    it('should not let a phrase formatter mutate the registered phrase propositions', () => {
      const [singular, plural] = plPL[CONTEXTMENU_ITEMS_REMOVE_ROW];

      // Replacing a built-in by name keeps its position, so this formatter runs first and gets the raw array.
      registerPhraseFormatter('pluralize', (phrasePropositions: string[]) => {
        phrasePropositions[0] = 'changed';
        phrasePropositions.push('changed');

        return phrasePropositions;
      });

      try {
        getTranslatedPhrase(plPL.languageCode, CONTEXTMENU_ITEMS_REMOVE_ROW, undefined);
      } finally {
        registerPhraseFormatter('pluralize', pluralize);
      }

      expect(getLanguageDictionary(plPL.languageCode)[CONTEXTMENU_ITEMS_REMOVE_ROW]).toEqual([singular, plural]);
      expect(getTranslatedPhrase(plPL.languageCode, CONTEXTMENU_ITEMS_REMOVE_ROW, 0)).toBe(singular);
    });
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

    describe('Serbian language codes', () => {
      beforeAll(() => {
        registerLanguageDictionary(srLatnRS);
        registerLanguageDictionary(srSP);
      });

      beforeEach(() => {
        _resetDeprecationWarnings();
      });

      it('should resolve `sr-Latn-RS` without a warning', () => {
        const spy = spyOn(console, 'warn');

        expect(getValidLanguageCode('sr-Latn-RS')).toEqual('sr-Latn-RS');
        expect(getValidLanguageCode('sr-latn-rs')).toEqual('sr-Latn-RS');
        expect(spy).not.toHaveBeenCalled();
      });

      it('should still resolve the deprecated `sr-SP` code and warn about it only once', () => {
        const spy = spyOn(console, 'warn');

        expect(getValidLanguageCode('sr-SP')).toEqual('sr-SP');
        expect(getValidLanguageCode('sr-sp')).toEqual('sr-SP');

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.argsFor(0)[0]).toMatch(/^Deprecated: .*sr-SP.*sr-Latn-RS/);
      });

      it('should not warn when `sr-SP` is only registered', () => {
        const spy = spyOn(console, 'warn');

        registerLanguageDictionary(srSP);

        expect(spy).not.toHaveBeenCalled();
      });
    });
  });
});
