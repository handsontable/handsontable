describe('Core.getLastPartiallyVisibleColumn', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last partially visible column index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastPartiallyVisibleColumn()).toBe(3);
  });

  it('should return last partially visible and not hidden column index', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastPartiallyVisibleColumn()).toBe(5);
  });

  it.forTheme('classic')('should return last partially visible column index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    await scrollViewportHorizontally(780); // row 19 (T1) is partially visible
    await render();

    expect(getLastPartiallyVisibleColumn()).toBe(19);
  });

  it.forTheme('main')('should return last partially visible column index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    await scrollViewportHorizontally(780); // row 19 (T1) is partially visible
    await render();

    expect(getLastPartiallyVisibleColumn()).toBe(19);
  });

  it.forTheme('horizon')('should return last partially visible column index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 255,
    });

    await scrollViewportHorizontally(830); // row 19 (T1) is partially visible
    await render();

    expect(getLastPartiallyVisibleColumn()).toBe(19);
  });
});
