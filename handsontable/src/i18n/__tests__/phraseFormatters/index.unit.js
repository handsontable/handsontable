import {
  getAll as getAllFormatters,
  register as registerPhraseFormatter,
} from 'handsontable/i18n/phraseFormatters';

describe('i18n phraseFormatters', () => {
  it('should register formatters at start', () => {

    // Formatter `substituteVariables` isn't registered at the moment.
    expect(getAllFormatters().length).toEqual(1);
  });

  it('should register formatter by `register` function', () => {
    registerPhraseFormatter('exampleFormatterName', () => {});

    expect(getAllFormatters().length).toEqual(2);
  });
});
