describe('Core.getLastPartiallyVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last partially visible row index', () => {
    // TODO [themes]: Could be potentially improved by per-theme configuration
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastPartiallyVisibleRow()).forThemes(({ classic, main }) => {
      classic.toBe(8);
      main.toBe(6);
    });
  });

  it('should return last partially visible and not hidden row index', () => {
    // TODO [themes]: Could be potentially improved by per-theme configuration
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    render();

    expect(getLastPartiallyVisibleRow()).forThemes(({ classic, main }) => {
      classic.toBe(10);
      main.toBe(8);
    });
  });

  it('should return last partially visible row index (scrolled viewport)', () => {
    // TODO [themes]: Could be potentially improved by per-theme configuration
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    setScrollTop(355); // row 23 (A24) is partially visible
    render();

    expect(getLastPartiallyVisibleRow()).forThemes(({ classic, main }) => {
      classic.toBe(23);
      main.toBe(18);
    });
  });
});
