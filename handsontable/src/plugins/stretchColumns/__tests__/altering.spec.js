describe('StretchColumns cooperation with columns altering', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should re-stretch all columns after adding a new column', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    await alter('insert_col_end', null, 1);

    [0, 1, 2].forEach((col) => {
      expect(getColWidth(col)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcE2eStretchColumnsWidth320InsertEndThreeColsStretchAll('classic'));
        main.toBe(calcE2eStretchColumnsWidth320InsertEndThreeColsStretchAll('main'));
        horizon.toBe(calcE2eStretchColumnsWidth320InsertEndThreeColsStretchAll('horizon'));
      });
    });

    await alter('insert_col_start', null, 1);

    [0, 1, 2].forEach((col) => {
      expect(getColWidth(col)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcE2eStretchColumnsWidth320InsertStartFourColsStretchBody('classic'));
        main.toBe(calcE2eStretchColumnsWidth320InsertStartFourColsStretchBody('main'));
        horizon.toBe(calcE2eStretchColumnsWidth320InsertStartFourColsStretchBody('horizon'));
      });
    });
    expect(getColWidth(3)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(calcE2eStretchColumnsWidth320InsertStartFourColsStretchLast('classic'));
      main.toBe(calcE2eStretchColumnsWidth320InsertStartFourColsStretchLast('main'));
      horizon.toBe(calcE2eStretchColumnsWidth320InsertStartFourColsStretchLast('horizon'));
    });
  });

  it('should re-stretch all columns after removing a column', async() => {
    handsontable({
      data: createSpreadsheetData(5, 7),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    await alter('remove_col');

    expect(tableView().hasHorizontalScroll()).toBe(true);

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
    expect(getColWidth(5)).toBe(50);

    await alter('remove_col', 1);

    expect(tableView().hasHorizontalScroll()).toBe(false);

    [0, 1, 2, 3, 4].forEach((col) => {
      expect(getColWidth(col)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcE2eStretchColumnsWidth320FiveEqualStretch('classic'));
        main.toBe(calcE2eStretchColumnsWidth320FiveEqualStretch('main'));
        horizon.toBe(calcE2eStretchColumnsWidth320FiveEqualStretch('horizon'));
      });
    });
  });

  it('should stop stretching the columns when the sum of columns widths is wider than the viewport', async() => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    await alter('insert_col_end', null, 3);

    expect(tableView().hasHorizontalScroll()).toBe(false);
    [0, 1, 2, 3, 4].forEach((col) => {
      expect(getColWidth(col)).forThemes(({ classic, main, horizon }) => {
        classic.toBe(calcE2eStretchColumnsWidth320FiveEqualStretch('classic'));
        main.toBe(calcE2eStretchColumnsWidth320FiveEqualStretch('main'));
        horizon.toBe(calcE2eStretchColumnsWidth320FiveEqualStretch('horizon'));
      });
    });

    await alter('insert_col_end', null, 1);

    expect(tableView().hasHorizontalScroll()).toBe(true);
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
    expect(getColWidth(5)).toBe(null);
  });
});
