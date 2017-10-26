import Handsontable from 'handsontable';

describe('i18n', () => {
  it('should extend Handsontable by language keys containing functions', () => {
    expect(typeof Handsontable.languages.get).toEqual('function');
    expect(typeof Handsontable.languages.getAll).toEqual('function');
    expect(typeof Handsontable.languages.register).toEqual('function');
  });

  it('should extend Handsontable by language keys containing constants for translation', () => {
    expect(typeof Handsontable.languages.constants).toBe('object');
  });
});
