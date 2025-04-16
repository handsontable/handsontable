describe('Core.getCopyableData', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return copyable data when `copyable` option is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      copyable: true
    });

    expect(getCopyableData(0, 0)).toBe('A1');
    expect(getCopyableData(1, 1)).toBe('B2');
    expect(getCopyableData(5, 1)).toBe('B6');
    expect(getCopyableData(8, 9)).toBe('J9');
  });

  it('should return empty string as copyable data when `copyable` option is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      copyable: false
    });

    expect(getCopyableData(0, 0)).toBe('');
    expect(getCopyableData(1, 1)).toBe('');
    expect(getCopyableData(5, 1)).toBe('');
    expect(getCopyableData(8, 9)).toBe('');
  });
});
