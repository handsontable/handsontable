describe('Core.getFirstPartiallyVisibleColumn', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return first partially visible column index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getFirstPartiallyVisibleColumn()).toBe(0);
  });

  it('should return first partially visible and not hidden column index', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(1, true);
    await render();

    expect(getFirstPartiallyVisibleColumn()).toBe(2);
  });

  it('should return first partially visible column index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    await scrollViewportHorizontally(780); // row 15 (P1) is partially visible
    await render();

    expect(getFirstPartiallyVisibleColumn()).toBe(15);
  });
});
