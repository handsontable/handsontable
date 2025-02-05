describe('Core.getFirstPartiallyVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return first partially visible row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getFirstPartiallyVisibleRow()).toBe(0);
  });

  it('should return first partially visible and not hidden row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    render();

    expect(getFirstPartiallyVisibleRow()).toBe(2);
  });

  it.forTheme('classic')('should return first partially visible row index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    setScrollTop(355); // row 15 (A16) is partially visible
    render();

    expect(getFirstPartiallyVisibleRow()).toBe(15);
  });

  it.forTheme('main')('should return first partially visible row index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 240,
    });

    setScrollTop(447); // row 15 (A16) is partially visible
    render();

    expect(getFirstPartiallyVisibleRow()).toBe(15);
  });
});
