describe('Core.getLastFullyVisibleColumn', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last fully visible column index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastFullyVisibleColumn()).toBe(2);
  });

  it('should return last fully visible and not hidden column index', () => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(1, true);
    render();

    expect(getLastFullyVisibleColumn()).toBe(4);
  });

  it('should return last fully visible column index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(10, 100),
      width: 200,
      height: 200,
    });

    setScrollLeft(780); // row 19 (T1) is partially visible
    render();

    expect(getLastFullyVisibleColumn()).toBe(18);
  });
});
