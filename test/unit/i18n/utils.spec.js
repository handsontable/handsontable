import {
  extendNotExistingKeys,
  createCellHeadersRange,
  normalizeLanguageCode,
  warnUserAboutLanguageRegistration,
  getValidLanguageCode
} from 'handsontable/i18n/utils';

import { DEFAULT_LANGUAGE_CODE, registerLanguageDictionary } from 'handsontable/i18n/dictionariesManager';
import plPL from 'handsontable/i18n/languages/pl-PL';

describe('i18n helpers', () => {
  describe('extendNotExistingKeys', () => {
    it('should add extra key to object', () => {
      const extendedOject = {
        hello: 'world',
        lorem: 'ipsum'
      };

      const extension = { anotherKey: true };

      extendNotExistingKeys(extendedOject, extension);

      expect(extendedOject.anotherKey).toEqual(true);
    });

    it('should not overwrite existing keys', () => {
      const extendedOject = {
        hello: 'world',
        lorem: 'ipsum'
      };

      const extension = { hello: 'kitty' };

      extendNotExistingKeys(extendedOject, extension);

      expect(extendedOject.hello).toEqual('world');
    });

    it('should return extended object without creating copy of it', () => {
      const extendedOject = {
        hello: 'world',
        lorem: 'ipsum'
      };

      const extension = { anotherKey: true };

      const newReference = extendNotExistingKeys(extendedOject, extension);

      expect(newReference).toBe(extendedOject);
    });
  });

  describe('createCellHeadersRange', () => {
    it('should create range of values basing on cell indexes (index of first cell is lower then index of next cell', () => {
      expect(createCellHeadersRange(2, 7)).toEqual('2-7');
    });

    it('should create range of values basing on cell indexes (index of first cell is higher then index of next cell', () => {
      expect(createCellHeadersRange(7, 2)).toEqual('2-7');
    });

    it('should create range of values basing on cell indexes and corresponding headers (index of first cell is lower then index of next cell', () => {
      expect(createCellHeadersRange(0, 4, 'A', 'D')).toEqual('A-D');
    });

    it('should create range of values basing on cell indexes and corresponding headers (index of first cell is higher then index of next cell', () => {
      expect(createCellHeadersRange(4, 0, 'D', 'A')).toEqual('A-D');
    });
  });

  describe('normalizeLanguageCode', () => {
    it('shoud not change proper language code', () => {
      expect(normalizeLanguageCode('pl-PL')).toEqual('pl-PL');
    });

    it('should return language code not matching to pattern', () => {
      expect(normalizeLanguageCode('too-Long')).toEqual('too-Long');
    });

    it('should normlize properly langage code #1', () => {
      expect(normalizeLanguageCode('pl-pl')).toEqual('pl-PL');
    });

    it('should normlize properly langage code #2', () => {
      expect(normalizeLanguageCode('PL-pl')).toEqual('pl-PL');
    });

    it('should normlize properly langage code #3', () => {
      expect(normalizeLanguageCode('PL-PL')).toEqual('pl-PL');
    });
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

  describe('warnUserAboutLanguageRegistration', () => {
    it('should not log error in console when language code was not passed to function', () => {
      const spy = spyOn(console, 'error');

      warnUserAboutLanguageRegistration();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should log error in console when language code was passed to function', () => {
      const spy = spyOn(console, 'error');

      warnUserAboutLanguageRegistration('pl-PL');

      expect(spy).toHaveBeenCalled();
    });
  });
});
