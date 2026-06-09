describe('Core.getFirstRenderedVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return first rendered row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getFirstRenderedVisibleRow()).toBe(0);
  });

  it('should return first rendered and not hidden row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getFirstRenderedVisibleRow()).toBe(2);
  });

  it('should return first rendered row index (scrolled viewport)', async() => {
    const rowHeight = getDefaultRowHeight();
    // scroll partway through row 15 so that it is partially visible
    const scrollAmount = (rowHeight * 15) + Math.ceil(rowHeight / 2);

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 240,
    });

    await scrollViewportVertically(scrollAmount);
    await render();

    // first rendered row is 1 row before the first partially visible row
    expect(getFirstRenderedVisibleRow()).toBe(Math.floor(scrollAmount / rowHeight) - 1);
  });
});
