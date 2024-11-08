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

  it('should return last rendered column index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastRenderedVisibleColumn()).toBe(5);
  });

  it('should return last rendered and not hidden column index', () => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(1, true);
    render();

    expect(getLastRenderedVisibleColumn()).toBe(6);
  });

  it('should return last rendered column index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    setScrollLeft(780); // row 19 (T1) is partially visible
    render();

    expect(getLastRenderedVisibleColumn()).toBe(21);
  });
});
