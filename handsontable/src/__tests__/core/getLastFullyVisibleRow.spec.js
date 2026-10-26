describe('Core.getLastFullyVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last fully visible row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    expect(getLastFullyVisibleRow()).toBe(expectedLastFullyVisibleRow(250, 0));
  });

  it('should return last fully visible and not hidden row index', async() => {
    const hiddenCount = 2;

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastFullyVisibleRow()).toBe(expectedLastFullyVisibleRow(250, 0) + hiddenCount);
  });

  it('should return last fully visible row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    // scroll so that row 15 is at the top of the viewport
    await scrollViewportTo({ row: 15, col: 0, verticalSnap: 'top', horizontalSnap: 'start' });
    await render();

    // last fully visible = start row + number of fully visible rows minus 1
    expect(getLastFullyVisibleRow()).toBe(15 + expectedLastFullyVisibleRow(250, 0));
  });

  it('should count the column header in the last fully visible row on the first draw', async() => {
    const theme = getThemeLayout();
    const rowHeight = theme.defaultDataRowHeight;
    const headerBand = theme.columnHeaderBandHeight(1);
    const scrollbar = Handsontable.dom.getScrollbarWidth(document);
    // The data area lands one pixel short of the next row. A header total that drops the
    // top gridline then reports one row too many, and a total of 0 does too.
    const height = headerBand + scrollbar + (6 * rowHeight) - 1;

    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 200,
      height,
      colHeaders: true,
      // A number keeps every column one width and leaves AutoColumnSize off. That hook is
      // what keeps a default grid off the layout-snapshot path.
      colWidths: 80,
    });

    const holder = spec().$container.find('.ht_master .wtHolder')[0];
    const thead = spec().$container.find('.ht_master table.htCore thead')[0];
    const geometric = Math.floor((holder.clientHeight - thead.offsetHeight) / rowHeight) - 1;
    const afterInit = getLastFullyVisibleRow();

    expect(afterInit).toBe(geometric);

    await render();

    expect(getLastFullyVisibleRow()).toBe(afterInit);
  });
});
