describe('Core.getCopyableText', () => {
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

  it('should honor `copyable: false` driven by the `cells` function', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      cells(row, column) {
        if (column === 1) {
          return { copyable: false };
        }

        return null;
      },
    });

    expect(getCopyableText(0, 0, 0, 2)).toBe('A1\t\tC1');
  });

  it('should not permanently retain a cell meta object for every copied cell', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 10),
      width: 400,
      height: 200,
    });

    const retainedBefore = hot.getCellsMeta().length;

    getCopyableText(0, 0, 199, 9); // walks all 2,000 cells

    expect(hot.getCellsMeta().length).toBe(retainedBefore);
  });
});
