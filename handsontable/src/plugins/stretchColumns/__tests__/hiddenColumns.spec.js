describe('StretchColumns cooperation with hidden columns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should stretch only visible columns (ignore hidden ones)', async() => {
    const rhw = getDefaultRowHeaderWidth();

    handsontable({
      data: createSpreadsheetData(5, 9),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: containerHeightForRows(5),
      stretchH: 'all',
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(3, true);
    columnMapper.setValueAtIndex(4, true);
    columnMapper.setValueAtIndex(6, true);
    columnMapper.setValueAtIndex(8, true);
    hot().view.adjustElementsSize();
    await render();

    const available = 320 - rhw;
    const visibleCols = 4; // columns 1, 2, 5, 7 are visible
    const expectedStretched = Math.floor(available / visibleCols);

    // Hidden columns report default width (50), visible ones are stretched
    expect(getColWidth(0)).toBe(50); // hidden
    expect(getColWidth(1)).toBeAroundValue(expectedStretched, 2); // visible
    expect(getColWidth(2)).toBeAroundValue(expectedStretched, 2); // visible
    expect(getColWidth(3)).toBe(50); // hidden
    expect(getColWidth(4)).toBe(50); // hidden
    expect(getColWidth(5)).toBeAroundValue(expectedStretched, 2); // visible
    expect(getColWidth(6)).toBe(50); // hidden
    expect(getColWidth(7)).toBeAroundValue(expectedStretched, 2); // visible
    expect(getColWidth(8)).toBe(50); // hidden
  });
});
