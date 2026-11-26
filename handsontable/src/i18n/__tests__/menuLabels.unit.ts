import * as allLanguages from 'handsontable/i18n/languages';
import * as constants from 'handsontable/i18n/constants';

describe('i18n: accessible names of the context menu and the dropdown menu', () => {
  const dictionaries = Object.getOwnPropertyNames(allLanguages)
    .map(exportName => (allLanguages as Record<string, Record<string, string>>)[exportName])
    .filter(dictionary => typeof dictionary?.languageCode === 'string');

  it('should have at least one dictionary to check', () => {
    expect(dictionaries.length).toBeGreaterThan(0);
  });

  it.each(dictionaries.map(dictionary => [dictionary.languageCode, dictionary]))(
    'should name both menus in %s',
    (languageCode, dictionary) => {
      const contextMenuLabel = dictionary[constants.CONTEXTMENU_LABEL];
      const dropdownMenuLabel = dictionary[constants.DROPDOWNMENU_LABEL];

      expect(typeof contextMenuLabel).toBe('string');
      expect(contextMenuLabel.trim()).not.toBe('');
      expect(typeof dropdownMenuLabel).toBe('string');
      expect(dropdownMenuLabel.trim()).not.toBe('');
      // Both menus can be open in one grid, so one name for both would not tell them apart.
      expect(contextMenuLabel).not.toBe(dropdownMenuLabel);
    }
  );
});
