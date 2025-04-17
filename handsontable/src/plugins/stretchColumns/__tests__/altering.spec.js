describe('StretchColumns cooperation with columns altering', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should re-stretch all columns after adding a new column', () => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    alter('insert_col_end', null, 1);

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

    alter('insert_col_start', null, 1);

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

  it('should re-stretch all columns after removing a column', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 7),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    alter('remove_col');

    expect(hot.view.hasHorizontalScroll()).toBe(true);

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
    expect(getColWidth(5)).toBe(50);

    alter('remove_col', 1);

    expect(hot.view.hasHorizontalScroll()).toBe(false);

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

  it('should stop stretching the columns when the sum of columns widths is wider than the viewport', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 2),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    alter('insert_col_end', null, 3);

    expect(hot.view.hasHorizontalScroll()).toBe(false);
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

    alter('insert_col_end', null, 1);

    expect(hot.view.hasHorizontalScroll()).toBe(true);
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
    expect(getColWidth(5)).toBe(null);
  });
});
