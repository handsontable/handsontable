import { deepClone } from 'handsontable/helpers/object';
import {
  getLanguageDictionary,
  getTranslatedPhrase,
  DEFAULT_LANGUAGE_CODE,
} from 'handsontable/i18n/registry';
import * as C from 'handsontable/i18n/constants';

jest.mock('handsontable/helpers/object', () => {
  const actual = jest.requireActual('handsontable/helpers/object');

  return {
    ...actual,
    deepClone: jest.fn(actual.deepClone),
  };
});

const deepCloneMock = deepClone as jest.MockedFunction<typeof deepClone>;

describe('i18n registry phrase lookup', () => {
  beforeEach(() => {
    // Registering the default dictionary on module load clones it.
    deepCloneMock.mockClear();
  });

  it('should not copy the language dictionary when translating a phrase', () => {
    expect(getTranslatedPhrase(DEFAULT_LANGUAGE_CODE, C.CONTEXTMENU_ITEMS_ROW_ABOVE, undefined))
      .toBe('Insert row above');
    expect(getTranslatedPhrase(DEFAULT_LANGUAGE_CODE, C.CONTEXTMENU_ITEMS_REMOVE_ROW, 1))
      .toBe('Remove rows');
    expect(getTranslatedPhrase(DEFAULT_LANGUAGE_CODE, C.PAGINATION_NAV_SECTION, { currentPage: 2, totalPages: 5 }))
      .toBe('Page 2 of 5');

    expect(deepCloneMock).not.toHaveBeenCalled();
  });

  it('should still return a copy from `getLanguageDictionary()`', () => {
    getLanguageDictionary(DEFAULT_LANGUAGE_CODE);

    // Proves the mock intercepts the module the registry imports, so the zero above is meaningful.
    expect(deepCloneMock).toHaveBeenCalled();
  });
});
