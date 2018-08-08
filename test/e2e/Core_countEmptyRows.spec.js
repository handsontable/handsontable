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
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      modifyRow(row) {
        return row + 2;
      }
    });

    expect(countEmptyRows()).toBe(2);
  });

  it('should count empty rows properly when translating rows below the viewport', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(100, 100),
      modifyRow(row) {
        return row + 5;
      }
    });

    expect(countEmptyRows()).toBe(5);
  });

  it('should count empty rows properly when rows was trimmed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(10, 10),
      modifyRow(row) {
        if (row === 9 || row === 8) {
          return null;
        }

        if (row >= 2) {
          return row + 2;
        }

        return row;
      }
    });

    expect(countEmptyRows()).toBe(0);
  });
});
