describe('StretchColumns cooperation with ManualColumnResize', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should skip columns stretching for columns that have defined size', () => {
    handsontable({
      data: createSpreadsheetData(5, 9),
      colHeaders: true,
      rowHeaders: true,
      width: 500,
      height: 200,
      stretchH: 'all',
      manualColumnResize: [10, 11, 12, 13, 14],
    });

    expect(getColWidth(0)).toBe(10);
    expect(getColWidth(1)).toBe(11);
    expect(getColWidth(2)).toBe(12);
    expect(getColWidth(3)).toBe(13);
    expect(getColWidth(4)).toBe(14);
    expect(getColWidth(5)).toBe(97);
    expect(getColWidth(6)).toBe(97);
    expect(getColWidth(7)).toBe(97);
    expect(getColWidth(8)).toBe(99);
  });
});
