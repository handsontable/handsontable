describe('Core.countEmptyRows', () => {
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

  it('should count empty rows properly when using a simple data set', async() => {
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

  it('should count empty rows at the end of the data source properly (optional `ending` parameter)', async() => {
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

  it('should count empty rows properly when using `minSpareRows` option', async() => {
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

  it('should count empty rows properly when translating rows in the viewport', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5)
    });

    rowIndexMapper().setIndexesSequence([2, 3, 4, 5, 6]);

    expect(countEmptyRows()).toBe(2);
  });

  it('should count empty rows properly when translating rows below the viewport', async() => {
    handsontable({
      data: createSpreadsheetData(100, 100)
    });

    rowIndexMapper().setIndexesSequence(new Array(100).fill(0).map((_, index) => index + 5));

    expect(countEmptyRows()).toBe(5);
  });
});
