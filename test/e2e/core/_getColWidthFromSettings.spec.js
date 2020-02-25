describe('Core._getColWidthFromSettings', () => {
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

  it('should return width of the column by reading cell meta object for the first row', () => {
    handsontable({
      cell: [{ row: 0, col: 2, width: 98 }, { row: 1, col: 2, width: 99 }],
    });

    expect(_getColWidthFromSettings(2)).toBe(98);
  });

  it('should return width as number', () => {
    handsontable({
      cell: [{ row: 0, col: 2, width: '98' }, { row: 1, col: 2, width: '99' }],
    });

    expect(_getColWidthFromSettings(2)).toBe(98);
  });

  it('should return width of the column by reading "colWidths" array when there is lack of the width in the cell meta object', () => {
    handsontable({
      colWidths: [101, 102, 103],
      cell: [{ row: 1, col: 2, width: 99 }],
    });

    expect(_getColWidthFromSettings(2)).toBe(103);
  });

  it('should return width of the column by reading "colWidths" function when there is lack of the width in the cell meta object', () => {
    handsontable({
      colWidths: () => 103,
      cell: [{ row: 1, col: 2, width: 99 }],
    });

    expect(_getColWidthFromSettings(2)).toBe(103);
  });

  it('should not try to get cell meta object when negative coordinates are passed', () => {
    const hot = handsontable({
      colWidths: 102,
      cell: [{ row: 1, col: 2, width: 99 }],
    });

    spyOn(hot, 'getCellMeta').and.callThrough();

    expect(_getColWidthFromSettings(-2)).toBe(102);
    expect(hot.getCellMeta).not.toHaveBeenCalled();
  });
});
