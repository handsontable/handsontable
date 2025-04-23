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

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });

    await alter('insert_col_start', null, 1);

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(68);
      main.toBe(68);
      horizon.toBe(64);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(68);
      main.toBe(68);
      horizon.toBe(64);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(68);
      main.toBe(68);
      horizon.toBe(64);
    });
    expect(getColWidth(3)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(66);
      main.toBe(66);
      horizon.toBe(63);
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

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
    });
    expect(getColWidth(3)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
    });
    expect(getColWidth(4)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
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
    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
    });
    expect(getColWidth(3)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
    });
    expect(getColWidth(4)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(54);
      main.toBe(54);
      horizon.toBe(51);
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
