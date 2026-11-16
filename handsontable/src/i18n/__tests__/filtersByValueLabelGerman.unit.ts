import deDE from 'handsontable/i18n/languages/de-DE';
import deCH from 'handsontable/i18n/languages/de-CH';
import * as constants from 'handsontable/i18n/constants';

describe('i18n: German label of the filters "by value" section', () => {
  // "Zahlen" means "numbers", but the value list shows values of any type.
  it.each([
    ['de-DE', deDE],
    ['de-CH', deCH],
  ])('should not call the "filter by value" section a filter by numbers in %s', (languageCode, dictionary) => {
    const label = (dictionary as Record<string, string>)[constants.FILTERS_DIVS_FILTER_BY_VALUE];

    expect(label).toBe('Nach Werten filtern');
  });
});
