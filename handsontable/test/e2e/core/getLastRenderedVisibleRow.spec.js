describe('Core.getLastRenderedVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last rendered row index', async() => {
    if (getLoadedTheme() !== 'main') {      return;
    }

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    expect(getLastRenderedVisibleRow()).toBe(9);
  });

  it('should return last rendered and not hidden row index', async() => {
    if (getLoadedTheme() !== 'main') {      return;
    }

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastRenderedVisibleRow()).toBe(11);
  });

  it('should return last rendered row index (scrolled viewport)', async() => {
    if (getLoadedTheme() !== 'main') {      return;
    }

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    await scrollViewportVertically(447); // row 23 (A24) is partially visible
    await render();

    expect(getLastRenderedVisibleRow()).toBe(24);
  });
});
