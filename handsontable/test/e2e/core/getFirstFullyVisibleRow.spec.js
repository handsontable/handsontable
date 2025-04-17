describe('Core.getFirstFullyVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return first fully visible row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getFirstFullyVisibleRow()).toBe(0);
  });

  it('should return first fully visible and not hidden row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getFirstFullyVisibleRow()).toBe(2);
  });

  it.forTheme('classic')('should return first fully visible row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    await scrollViewportVertically(355); // row 15 (A16) is partially visible
    await render();

    expect(getFirstFullyVisibleRow()).toBe(16);
  });

  it.forTheme('main')('should return first fully visible row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 240,
    });

    await scrollViewportVertically(447); // row 15 (A16) is partially visible
    await render();

    expect(getFirstFullyVisibleRow()).toBe(16);
  });

  it.forTheme('horizon')('should return first fully visible row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 306,
    });

    await scrollViewportVertically(570); // row 15 (A16) is partially visible
    await render();

    expect(getFirstFullyVisibleRow()).toBe(16);
  });
});
