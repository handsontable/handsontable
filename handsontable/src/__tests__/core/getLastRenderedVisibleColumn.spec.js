describe('Core.getLastRenderedVisibleColumn', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last rendered column index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastRenderedVisibleColumn()).toBe(4);
  });

  it('should return last rendered and not hidden column index', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastRenderedVisibleColumn()).toBe(6);
  });

  it('should return last rendered column index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
      // Disable AutoColumnSize so every column is exactly 50px -- this keeps the
      // scroll/viewport arithmetic deterministic regardless of the theme's font metrics.
      autoColumnSize: false,
    });

    await scrollViewportHorizontally(780); // column 15 (P1) is partially visible
    await render();

    expect(getLastRenderedVisibleColumn()).toBe(20);
  });
});
