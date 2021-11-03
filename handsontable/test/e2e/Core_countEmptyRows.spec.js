describe('Core_countEmptyRows', () => {
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

  it('should count empty rows properly when using a simple data set', () => {
    handsontable({
      data: [
        [null],
        [4],
        [null],
        [3],
        [1],
        [null],
      ]
    });

    expect(countEmptyRows()).toBe(3);
  });

  it('should count empty rows at the end of the data source properly (optional `ending` parameter)', () => {
    handsontable({
      data: [
        [null],
        [4],
        [null],
        [3],
        [1],
        [null],
        [null],
        [null],
        [null],
        [null],
      ]
    });

    expect(countEmptyRows(true)).toBe(5);
  });

  it('should count empty rows properly when using `minSpareRows` option', () => {
    handsontable({
      data: [
        [null],
        [4],
        [null],
        [3],
        [1],
      ],
      minSpareRows: 2
    });

    expect(countEmptyRows()).toBe(4);
  });

  it('should count empty rows properly when translating rows in the viewport', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5)
    });

    hot.rowIndexMapper.setIndexesSequence([2, 3, 4, 5, 6]);

    expect(countEmptyRows()).toBe(2);
  });

  it('should count empty rows properly when translating rows below the viewport', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(100, 100)
    });

    hot.rowIndexMapper.setIndexesSequence(new Array(100).fill(0).map((_, index) => index + 5));

    expect(countEmptyRows()).toBe(5);
  });
});
