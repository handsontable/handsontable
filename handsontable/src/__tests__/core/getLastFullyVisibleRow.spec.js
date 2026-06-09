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
});
