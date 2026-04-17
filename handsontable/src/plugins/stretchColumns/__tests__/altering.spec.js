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

    // 3 columns equally stretched
    const width3 = getColWidth(0);

    expect(width3).toBeGreaterThan(50);
    expect(getColWidth(1)).toBe(width3);
    expect(getColWidth(2)).toBe(width3);

    await alter('insert_col_start', null, 1);

    // 4 columns equally stretched (within rounding)
    const width4 = getColWidth(0);

    expect(width4).toBeGreaterThan(50);
    expect(width4).toBeLessThan(width3);
    expect(getColWidth(1)).toBeAroundValue(width4, 2);
    expect(getColWidth(2)).toBeAroundValue(width4, 2);
    expect(getColWidth(3)).toBeAroundValue(width4, 2);
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

    // 6 columns * 50px = 300 > available width, so horizontal scroll appears
    expect(tableView().hasHorizontalScroll()).toBe(true);

    // Too many columns for the viewport -- no stretching, default widths
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
    expect(getColWidth(5)).toBe(50);

    await alter('remove_col', 1);

    expect(tableView().hasHorizontalScroll()).toBe(false);

    // All 5 remaining columns are evenly stretched
    const stretchedWidth = getColWidth(0);

    expect(stretchedWidth).toBeGreaterThan(50);
    expect(getColWidth(1)).toBe(stretchedWidth);
    expect(getColWidth(2)).toBe(stretchedWidth);
    expect(getColWidth(3)).toBe(stretchedWidth);
    expect(getColWidth(4)).toBe(stretchedWidth);
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

    const stretched5 = getColWidth(0);

    expect(stretched5).toBeGreaterThan(50);
    expect(getColWidth(1)).toBe(stretched5);
    expect(getColWidth(2)).toBe(stretched5);
    expect(getColWidth(3)).toBe(stretched5);
    expect(getColWidth(4)).toBe(stretched5);

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
