describe('Core.getLastPartiallyVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last partially visible row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    // last partially visible = last fully visible + 1 (the next row is partially clipped)
    expect(getLastPartiallyVisibleRow()).toBe(expectedLastFullyVisibleRow(255, 0) + 1);
  });

  it('should return last partially visible and not hidden row index', async() => {
    const hiddenCount = 2;

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastPartiallyVisibleRow()).toBe(expectedLastFullyVisibleRow(255, 0) + hiddenCount + 1);
  });

  it('should return last partially visible row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    // scroll so that row 15 is at the top of the viewport
    await scrollViewportTo({ row: 15, col: 0, verticalSnap: 'top', horizontalSnap: 'start' });
    await render();

    expect(getLastPartiallyVisibleRow()).toBe(15 + expectedLastFullyVisibleRow(255, 0) + 1);
  });
});
