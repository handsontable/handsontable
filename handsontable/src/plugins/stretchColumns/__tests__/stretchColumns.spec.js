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
    handsontable({
      data: createSpreadsheetData(3, 3),
      width: 200,
      height: containerHeightForRows(3, 0),
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);

    await updateSettings({
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(67);
    expect(getColWidth(1)).toBe(67);
    expect(getColWidth(2)).toBe(66);

    await updateSettings({
      stretchH: 'last',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(100);

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
    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: containerHeightForRows(5),
      stretchH: 'all',
    });

    // available = 320 - 50 (rowHeader) = 270; 270 / 3 = 90
    expect(getColWidth(0)).toBe(90);
    expect(getColWidth(1)).toBe(90);
    expect(getColWidth(2)).toBe(90);

    await updateSettings({
      width: 500,
    });

    // available = 500 - 50 = 450; 450 / 3 = 150
    expect(getColWidth(0)).toBe(150);
    expect(getColWidth(1)).toBe(150);
    expect(getColWidth(2)).toBe(150);
  });

  it(`should correctly stretch columns after vertical scroll appears
 (defined table size)`, async() => {
    // Use a height that fits all 5 rows (no scrollbar) and one that fits only 3 (scrollbar appears).
    const heightFull = containerHeightForRows(5);
    const heightWithScroll = containerHeightForRows(3);
    const rowHeaderWidth = getDefaultRowHeaderWidth();
    const scrollbarWidth = Handsontable.dom.getScrollbarWidth(document);
    const availableNoScroll = 320 - rowHeaderWidth;
    const availableWithScroll = availableNoScroll - scrollbarWidth;

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: heightFull,
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(Math.round(availableNoScroll / 3));
    expect(getColWidth(1)).toBe(Math.round(availableNoScroll / 3));
    expect(getColWidth(2)).toBe(availableNoScroll - (2 * Math.round(availableNoScroll / 3)));

    await updateSettings({
      height: heightWithScroll,
    });

    // Scrollbar appeared, stretched widths shrink.
    expect(getColWidth(0)).toBe(Math.round(availableWithScroll / 3));
    expect(getColWidth(1)).toBe(Math.round(availableWithScroll / 3));
    expect(getColWidth(2)).toBe(availableWithScroll - (2 * Math.round(availableWithScroll / 3)));

    await updateSettings({
      height: heightFull,
    });

    expect(getColWidth(0)).toBe(Math.round(availableNoScroll / 3));
    expect(getColWidth(1)).toBe(Math.round(availableNoScroll / 3));
    expect(getColWidth(2)).toBe(availableNoScroll - (2 * Math.round(availableNoScroll / 3)));
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
      height: containerHeightForRows(5, 0),
      stretchH: 'all',
    });

    // The column with multi-line text should be wider, total should equal container width.
    expect(getColWidth(0)).toBeGreaterThan(getColWidth(1));
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
      height: containerHeightForRows(1, 0),
      stretchH: 'all',
    });

    const widthWithLongText = getColWidth(4);

    // The column with long text should get more than equal share (400/5 = 80).
    expect(widthWithLongText).toBeGreaterThan(80);

    await setDataAtCell(0, 4, 'text');

    // After clearing, all columns have equal short text, so equal distribution: 400/5 = 80.
    expect(getColWidth(4)).toBe(80);

    await setDataAtCell(0, 4, 'very long text is here to make the column wider');

    // After restoring, the column should get the same wider width again.
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

  it('should not throw when the ResizeObserver fires while hot.view is not yet available', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      stretchH: 'all',
    });

    await waitForNextAnimationFrames(2);

    const hot = spec();
    const savedView = hot.view;

    // Simulate the race condition where hot.view is undefined when the rAF callback fires
    // (e.g. during initialization or after destruction)
    hot.view = undefined;

    // Trigger a resize to queue a ResizeObserver callback
    document.body.style.overflowY = 'scroll';

    // Wait for the ResizeObserver and requestAnimationFrame to execute
    await waitForNextAnimationFrames(3);

    // Restore for proper cleanup
    hot.view = savedView;
    document.body.style.overflowY = '';
  });
});
