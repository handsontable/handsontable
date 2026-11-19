import * as allLanguages from 'handsontable/i18n/languages';
import * as constants from 'handsontable/i18n/constants';

describe('i18n: labels of the filters value list and action bar', () => {
  const dictionaries = Object.getOwnPropertyNames(allLanguages)
    .map(exportName => (allLanguages as Record<string, Record<string, string>>)[exportName])
    .filter(dictionary => typeof dictionary?.languageCode === 'string');

  it('should have at least one dictionary to check', () => {
    expect(dictionaries.length).toBeGreaterThan(0);
  });

  // A screen reader announces both as buttons, so two identical names cannot be told apart.
  it.each(dictionaries.map(dictionary => [dictionary.languageCode, dictionary]))(
    'should not give the value list link and the action bar button the same label in %s',
    (languageCode, dictionary) => {
      const clearLabel = dictionary[constants.FILTERS_BUTTONS_CLEAR];

      expect(clearLabel).not.toBe(dictionary[constants.FILTERS_BUTTONS_CANCEL]);
      expect(clearLabel).not.toBe(dictionary[constants.FILTERS_BUTTONS_SELECT_ALL]);
      expect(clearLabel).not.toBe(dictionary[constants.FILTERS_BUTTONS_OK]);
    }
  );
});
