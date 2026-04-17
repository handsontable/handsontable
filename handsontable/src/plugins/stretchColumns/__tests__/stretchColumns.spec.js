describe('StretchColumns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be disabled by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    expect(getSettings().stretchH).toBe('none');
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(0)).toBe(50);
  });

  it('should be possible to change the stretch strategy via `updateSettings`', async() => {
    const containerWidth = 200;

    handsontable({
      data: createSpreadsheetData(3, 3),
      width: containerWidth,
      height: containerHeightForRows(3, 0),
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);

    await updateSettings({
      stretchH: 'all',
    });

    const stretchedAll = Math.floor(containerWidth / 3);

    expect(getColWidth(0)).toBeAroundValue(stretchedAll, 1);
    expect(getColWidth(1)).toBeAroundValue(stretchedAll, 1);
    expect(getColWidth(2)).toBeAroundValue(stretchedAll, 1);
    expect(getColWidth(0) + getColWidth(1) + getColWidth(2)).toBe(containerWidth);

    await updateSettings({
      stretchH: 'last',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(containerWidth - 100);

    await updateSettings({
      stretchH: 'none',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
  });

  it('should not stretch the columns when the "none" is set', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 220,
      height: 200,
      stretchH: 'none',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
  });

  it('should correctly stretch columns after table size change', async() => {
    const rhw = getDefaultRowHeaderWidth();

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: containerHeightForRows(5),
      stretchH: 'all',
    });

    const expected1 = Math.floor((320 - rhw) / 3);

    expect(getColWidth(0)).toBe(expected1);
    expect(getColWidth(1)).toBe(expected1);
    expect(getColWidth(2)).toBe(expected1);

    await updateSettings({
      width: 500,
    });

    const expected2 = Math.floor((500 - rhw) / 3);

    expect(getColWidth(0)).toBe(expected2);
    expect(getColWidth(1)).toBe(expected2);
    expect(getColWidth(2)).toBe(expected2);
  });

  it(`should correctly stretch columns after vertical scroll appears
 (defined table size)`, async() => {
    const rhw = getDefaultRowHeaderWidth();
    // Height that fits all 5 rows without vertical scrollbar
    const heightFull = containerHeightForRows(5) + 5;
    // Height that does NOT fit all 5 rows -- vertical scrollbar appears
    const heightWithScroll = containerHeightForRows(4) + 5;

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: heightFull,
      stretchH: 'all',
    });

    const expectedNoScroll = Math.floor((320 - rhw) / 3);

    expect(getColWidth(0)).toBe(expectedNoScroll);
    expect(getColWidth(1)).toBe(expectedNoScroll);
    expect(getColWidth(2)).toBe(expectedNoScroll);

    await updateSettings({
      height: heightWithScroll,
    });

    // Scrollbar reduces available width by ~15px
    const expectedWithScroll = getColWidth(0);

    expect(expectedWithScroll).toBeLessThan(expectedNoScroll);
    expect(getColWidth(1)).toBe(expectedWithScroll);
    expect(getColWidth(2)).toBe(expectedWithScroll);

    await updateSettings({
      height: heightFull,
    });

    expect(getColWidth(0)).toBe(expectedNoScroll);
    expect(getColWidth(1)).toBe(expectedNoScroll);
    expect(getColWidth(2)).toBe(expectedNoScroll);
  });

  it.flaky('should correctly stretch columns after vertical scroll appears (window as scrollable element)', async() => {
    document.body.style.overflowY = 'hidden';

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: false,
      rowHeaders: false,
      stretchH: 'all',
    });

    {
      const layoutWidth = document.documentElement.clientWidth;
      const columnWidth = layoutWidth / 3;

      expect(getColWidth(0)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(1)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(2)).toBeAroundValue(columnWidth, 1);
      expect(getMaster().find('.wtHider').width()).toBe(layoutWidth);
    }

    await waitForNextAnimationFrames(2);
    document.body.style.overflowY = 'scroll';
    await waitForNextAnimationFrames(2);

    {
      const layoutWidth = document.documentElement.clientWidth;
      const columnWidth = layoutWidth / 3;

      expect(getColWidth(0)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(1)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(2)).toBeAroundValue(columnWidth, 1);
      expect(getMaster().find('.wtHider').width()).toBe(layoutWidth);
    }
  });

  it.flaky('should correctly stretch columns after vertical scroll disappears (window as scrollable element)', async() => {
    document.body.style.overflowY = 'scroll';

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: false,
      rowHeaders: false,
      stretchH: 'all',
    });

    {
      const layoutWidth = document.documentElement.clientWidth;
      const columnWidth = layoutWidth / 3;

      expect(getColWidth(0)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(1)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(2)).toBeAroundValue(columnWidth, 1);
      expect(getMaster().find('.wtHider').width()).toBe(layoutWidth);
    }

    await waitForNextAnimationFrames(2);
    document.body.style.overflowY = 'hidden';
    await waitForNextAnimationFrames(2);

    {
      const layoutWidth = document.documentElement.clientWidth;
      const columnWidth = layoutWidth / 3;

      expect(getColWidth(0)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(1)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(2)).toBeAroundValue(columnWidth, 1);
      expect(getMaster().find('.wtHider').width()).toBe(layoutWidth);
    }

    document.body.style.overflowY = 'scroll';
  });

  it('should correctly stretch columns after window size change', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      stretchH: 'all',
    });

    const approxWidth = Math.floor(window.innerWidth / 3) - 4;

    expect(getColWidth(0)).toBeAroundValue(approxWidth, 1);
    expect(getColWidth(1)).toBeAroundValue(getColWidth(0), 1);
    expect(getColWidth(2)).toBeAroundValue(getColWidth(0), 1);
  });

  it('should correctly stretch columns when there are some rows with multi-line text', async() => {
    const data = createSpreadsheetData(5, 2);

    for (let i = 0; i < data.length; i++) {
      if (i % 2) {
        data[i][0] += ' \nthis is a cell that contains a lot of text, \nwhich will make it multi-line';
      }
    }

    handsontable({
      data,
      width: 500,
      height: 200,
      stretchH: 'all',
    });

    // Column 0 has multi-line text so it should be wider than column 1
    expect(getColWidth(0)).toBeGreaterThan(getColWidth(1));
    // Both columns together should fill the container
    expect(getColWidth(0) + getColWidth(1)).toBe(500);
  });

  it('should not stretch the columns when the sum of columns widths is wider than the viewport (stretch "all")', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 220,
      height: 200,
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
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

  it('should not stretch the columns when the sum of columns widths is wider than the viewport (stretch "last")', async() => {
    handsontable({
      data: createSpreadsheetData(5, 6),
      width: 220,
      height: 200,
      stretchH: 'last',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
  });

  it('should respect the defined width of the last column when stretchH is "last" and viewport is too narrow (#11761)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      width: 120,
      height: 200,
      stretchH: 'last',
      columns: [
        { width: 60 },
        { width: 60 },
        { width: 100 }, // Last column has a defined width of 100
      ],
    });

    // When the viewport (120px) is narrower than the sum of column widths (220px),
    // the last column should maintain its defined width (100px), not shrink below it
    expect(getColWidth(0)).toBe(60);
    expect(getColWidth(1)).toBe(60);
    expect(getColWidth(2)).toBe(100);
  });

  it('should stretch the last column when there is enough space and respect minimum width when not (#11761)', async() => {
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

    // With viewport of 300px and first two columns taking 100px,
    // the last column should stretch to fill the remaining space
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(200);

    // Now make the viewport narrower
    await updateSettings({ width: 150 });

    // The last column should keep its defined width of 80, not shrink below it
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(80);
  });

  it('should correctly stretch the column after changing the cell value (#dev-1727)', async() => {
    const data = createSpreadsheetData(1, 5);

    data[0][4] = 'very long text is here to make the column wider';

    handsontable({
      data,
      width: 400,
      height: 300,
      stretchH: 'all',
    });

    const widthWithLongText = getColWidth(4);

    expect(widthWithLongText).toBeGreaterThan(200);

    await setDataAtCell(0, 4, 'text');

    const widthWithShortText = getColWidth(4);

    expect(widthWithShortText).toBeLessThan(widthWithLongText);

    await setDataAtCell(0, 4, 'very long text is here to make the column wider');

    expect(getColWidth(4)).toBe(widthWithLongText);
  });

  it('should stretch the table to the entirety of the container when autoRowSize is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(1, 5),
      autoRowSize: true,
      width: '680',
      height: 'auto',
      stretchH: 'all',
      contextMenu: true,
      rowHeaders: true,
      colHeaders: true,
    });

    await waitForNextAnimationFrames(2);

    expect($('.handsontable .ht_master table').outerWidth()).toBe(680);
  });
});
