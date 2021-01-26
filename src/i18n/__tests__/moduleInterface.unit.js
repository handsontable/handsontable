import {
  getDefaultLanguageDictionary,
  getLanguageDictionary,
  getLanguagesDictionaries,
  getTranslatedPhrase,
  getValidLanguageCode,
  hasLanguageDictionary,
  registerLanguageDictionary,
  dictionaryKeys,
  deCH,
  deDE,
  enUS,
  esMX,
  frFR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  zhCN,
  zhTW,
} from 'handsontable/i18n';
import * as constants from 'handsontable/i18n/constants';

describe('i18n', () => {
  it('should be possible to import module API', () => {
    expect(getDefaultLanguageDictionary).toBeFunction();
    expect(getLanguageDictionary).toBeFunction();
    expect(getLanguagesDictionaries).toBeFunction();
    expect(getTranslatedPhrase).toBeFunction();
    expect(getValidLanguageCode).toBeFunction();
    expect(hasLanguageDictionary).toBeFunction();
    expect(registerLanguageDictionary).toBeFunction();
  });

  it('should be possible to import language keys', () => {
    expect(dictionaryKeys).toEqual(constants);
  });

  it('should be possible to import all languages from the module entrypoint', () => {
    expect(deCH.languageCode).toBe('de-CH');
    expect(deDE.languageCode).toBe('de-DE');
    expect(enUS.languageCode).toBe('en-US');
    expect(esMX.languageCode).toBe('es-MX');
    expect(frFR.languageCode).toBe('fr-FR');
    expect(itIT.languageCode).toBe('it-IT');
    expect(jaJP.languageCode).toBe('ja-JP');
    expect(koKR.languageCode).toBe('ko-KR');
    expect(lvLV.languageCode).toBe('lv-LV');
    expect(nbNO.languageCode).toBe('nb-NO');
    expect(nlNL.languageCode).toBe('nl-NL');
    expect(plPL.languageCode).toBe('pl-PL');
    expect(ptBR.languageCode).toBe('pt-BR');
    expect(ruRU.languageCode).toBe('ru-RU');
    expect(zhCN.languageCode).toBe('zh-CN');
    expect(zhTW.languageCode).toBe('zh-TW');
  });
});
