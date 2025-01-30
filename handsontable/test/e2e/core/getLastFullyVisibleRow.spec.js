describe('Core.getLastFullyVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it.forTheme('classic')('should return last partially visible row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastFullyVisibleRow()).toBe(7);
  });

  it.forTheme('main')('should return last partially visible row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    expect(getLastFullyVisibleRow()).toBe(7);
  });

  it.forTheme('classic')('should return last partially visible and not hidden row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    render();

    expect(getLastFullyVisibleRow()).toBe(9);
  });

  it.forTheme('main')('should return last partially visible and not hidden row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    render();

    expect(getLastFullyVisibleRow()).toBe(9);
  });

  it.forTheme('classic')('should return last partially visible row index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    setScrollTop(355); // row 23 (A24) is partially visible
    render();

    expect(getLastFullyVisibleRow()).toBe(22);
  });

  it.forTheme('main')('should return last partially visible row index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    setScrollTop(447); // row 23 (A24) is partially visible
    render();

    expect(getLastFullyVisibleRow()).toBe(22);
  });
});
