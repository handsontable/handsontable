describe('Core.getFirstRenderedVisibleColumn', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find('#testContainer').remove();
    }
  });

  it('should return first rendered column index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getFirstRenderedVisibleColumn()).toBe(0);
  });

  it('should return first rendered and not hidden column index', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(1, true);
    await render();

    expect(getFirstRenderedVisibleColumn()).toBe(2);
  });

  it('should return first rendered column index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    await scrollViewportHorizontally(780); // row 15 (P1) is partially visible
    await render();

    expect(getFirstRenderedVisibleColumn()).toBe(13);
  });
});
