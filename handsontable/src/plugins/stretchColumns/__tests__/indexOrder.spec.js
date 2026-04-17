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
    const rhw = getDefaultRowHeaderWidth();
    const fixedColWidth = 33;

    handsontable({
      data: createSpreadsheetData(5, 4),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: containerHeightForRows(5),
      stretchH: 'all',
      beforeStretchingColumnWidth(width, columnVisualIndex) {
        return this.toPhysicalColumn(columnVisualIndex) === 1 ? fixedColWidth : width;
      }
    });

    columnIndexMapper().setIndexesSequence([0, 2, 3, 1]);
    await render();

    // 3 stretched columns share the space minus the fixed column
    const available = 320 - rhw;
    const expectedStretched = Math.floor((available - fixedColWidth) / 3);

    expect(getColWidth(0)).toBe(expectedStretched);
    expect(getColWidth(1)).toBe(expectedStretched);
    expect(getColWidth(2)).toBe(expectedStretched);
    expect(getColWidth(3)).toBe(fixedColWidth);

    columnIndexMapper().setIndexesSequence([1, 0, 2, 3]);
    await render();

    expect(getColWidth(0)).toBe(fixedColWidth);
    expect(getColWidth(1)).toBe(expectedStretched);
    expect(getColWidth(2)).toBe(expectedStretched);
    expect(getColWidth(3)).toBe(expectedStretched);
  });
});
