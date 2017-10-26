import {getLanguage, getLanguages} from 'handsontable/i18n/dictionariesManager';
import plPL from 'handsontable/i18n/languages/pl-PL';

describe('i18n dictionariesManager', () => {
  it('should be empty at start', () => {
    expect(getLanguages().length).toEqual(0);
  });

  it('should log warn when trying to get not registered language', () => {
    const spy = spyOn(console, 'warn');

    getLanguage(plPL.languageCode);

    expect(spy).toHaveBeenCalled();
  });
});
