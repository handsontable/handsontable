describe('Core.getCopyableText', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  it('should return copyable string when `copyable` option is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      copyable: true
    });

    expect(getCopyableText(0, 0)).toBe('A1');
    expect(getCopyableText(0, 0, 1, 2)).toBe('A1\tB1\tC1\nA2\tB2\tC2');
  });

  it('should return empty string as copyable data when `copyable` option is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      copyable: false
    });

    expect(getCopyableText(0, 0)).toBe('');
    expect(getCopyableText(0, 0, 1, 2)).toBe('\t\t\n\t\t');
  });
});
