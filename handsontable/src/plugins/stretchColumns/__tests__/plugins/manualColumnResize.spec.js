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

  it('should work correctly with manual column resize when stretchH is "last" (#11761)', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 3),
      width: 300,
      height: 200,
      stretchH: 'last',
      manualColumnResize: true,
      columns: [
        { width: 50 },
        { width: 50 },
        { width: 80 },
      ],
    });

    // Last column should be stretched
    expect(getColWidth(2)).toBe(200);

    // Manually resize the first column to be wider
    hot.getPlugin('manualColumnResize').setManualSize(0, 120);
    await render();

    // Now the sum of columns (120 + 50 + 80 = 250) is still less than viewport (300),
    // but closer. Last column should adjust accordingly
    expect(getColWidth(0)).toBe(120);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(130);

    // Manually resize the first column to be very wide
    hot.getPlugin('manualColumnResize').setManualSize(0, 200);
    await render();

    // Now the sum exceeds viewport, so no stretching should occur
    expect(getColWidth(0)).toBe(200);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(80);
  });

  it('should skip columns stretching for columns that have defined size', async() => {
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
