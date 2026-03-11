describe('StretchColumns', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should stretch the last column to fill the viewport when stretchH is "last"', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      width: 300,
      height: 200,
      stretchH: 'last',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(200);
  });

  it('should respect the defined width of the last column when viewport is too narrow (#11761)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      width: 120,
      height: 200,
      stretchH: 'last',
      columns: [
        { width: 60 },
        { width: 60 },
        { width: 100 },
      ],
    });

    // When the viewport (120px) is narrower than the sum of column widths (220px),
    // the last column should maintain its defined width (100px), not shrink below it
    expect(getColWidth(0)).toBe(60);
    expect(getColWidth(1)).toBe(60);
    expect(getColWidth(2)).toBe(100);
  });

  it('should not allow last column to shrink below its defined width even when viewport changes (#11761)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      width: 300,
      height: 200,
      stretchH: 'last',
      columns: [
        { width: 50 },
        { width: 50 },
        { width: 80 },
      ],
    });

    // Initially, the last column should stretch to fill the viewport
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(200);

    // Resize the container to be narrower than the sum of column widths
    await updateSettings({ width: 150 });

    // The last column should keep its defined width of 80, not shrink below it
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(80);
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
});
