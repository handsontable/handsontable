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
    if (getLoadedTheme() !== 'main') {
      pending();

      return;
    }

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    expect(getLastPartiallyVisibleRow()).toBe(8);
  });

  it('should return last partially visible and not hidden row index', async() => {
    if (getLoadedTheme() !== 'main') {
      pending();

      return;
    }

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastPartiallyVisibleRow()).toBe(10);
  });

  it('should return last partially visible row index (scrolled viewport)', async() => {
    if (getLoadedTheme() !== 'main') {
      pending();

      return;
    }

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    await scrollViewportVertically(447); // row 23 (A24) is partially visible
    await render();

    expect(getLastPartiallyVisibleRow()).toBe(23);
  });
});
