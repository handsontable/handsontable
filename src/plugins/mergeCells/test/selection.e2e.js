describe('MergeCells Selection', () => {
  let id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should leave the partially selected merged cells white (or any initial color), when selecting entire columns or rows', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        {row: 0, col: 0, rowspan: 3, colspan: 3}
      ]
    });

    const unselectedCell = getCell(4, 4);
    const initialCellBackground = getComputedStyle(unselectedCell, ':before').backgroundColor;

    hot.selectColumns(0, 1);

    let mergedCell = getCell(0, 0);
    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(initialCellBackground);

    hot.selectRows(0, 1);

    mergedCell = getCell(0, 0);
    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(initialCellBackground);
  });

  it('should make the entirely selected merged cells have the same background color as a regular selected area, when selecting entire columns or rows', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 6),
      mergeCells: [
        {row: 0, col: 0, rowspan: 3, colspan: 3}
      ]
    });

    hot.selectCell(4, 4, 5, 5);

    const selectedCell = getCell(4, 4);
    const selectedCellBackground = getComputedStyle(selectedCell, ':before').backgroundColor;

    hot.selectColumns(0, 2);

    let mergedCell = getCell(0, 0);
    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);

    hot.selectRows(0, 2);

    mergedCell = getCell(0, 0);
    expect(getComputedStyle(mergedCell, ':before').backgroundColor).toEqual(selectedCellBackground);
  });
});
