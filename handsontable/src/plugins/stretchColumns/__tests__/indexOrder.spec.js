describe('StretchColumns cooperation with reordered indexes', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should follow the columns order when they are moved', async() => {
    handsontable({
      data: createSpreadsheetData(5, 4),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
      beforeStretchingColumnWidth(width, columnVisualIndex) {
        return this.toPhysicalColumn(columnVisualIndex) === 1 ? 33 : width;
      }
    });

    columnIndexMapper().setIndexesSequence([0, 2, 3, 1]);
    await render();

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(79);
      main.toBe(79);
      horizon.toBe(74);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(79);
      main.toBe(79);
      horizon.toBe(74);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(79);
      main.toBe(79);
      horizon.toBe(74);
    });
    expect(getColWidth(3)).toBe(33);

    columnIndexMapper().setIndexesSequence([1, 0, 2, 3]);
    await render();

    expect(getColWidth(0)).toBe(33);
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(79);
      main.toBe(79);
      horizon.toBe(74);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(79);
      main.toBe(79);
      horizon.toBe(74);
    });
    expect(getColWidth(3)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(79);
      main.toBe(79);
      horizon.toBe(74);
    });
  });
});
