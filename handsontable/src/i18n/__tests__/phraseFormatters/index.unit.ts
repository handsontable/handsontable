import {
  getAll as getAllFormatters,
  register as registerPhraseFormatter,
} from 'handsontable/i18n/phraseFormatters';

describe('i18n phraseFormatters', () => {
  it('should register formatters at start', () => {

    expect(getAllFormatters().length).toBe(2);
  });

  it('should register formatter by `register` function', () => {
    registerPhraseFormatter('exampleFormatterName', () => {});

    expect(getAllFormatters().length).toBe(3);
  });
});
