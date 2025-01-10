describe('Core.getLastRenderedVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last rendered row index', () => {
    // TODO [themes]: Could be potentially improved by per-theme configuration
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastRenderedVisibleRow()).forThemes(({ classic, main }) => {
      classic.toBe(9);
      main.toBe(7);
    });
  });

  it('should return last rendered and not hidden row index', () => {
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

    expect(getLastRenderedVisibleRow()).forThemes(({ classic, main }) => {
      classic.toBe(11);
      main.toBe(9);
    });
  });

  it('should return last rendered row index (scrolled viewport)', () => {
    // TODO [themes]: Could be potentially improved by per-theme configuration
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    setScrollTop(355); // row 23 (A24) is partially visible
    render();

    expect(getLastRenderedVisibleRow()).forThemes(({ classic, main }) => {
      classic.toBe(26);
      main.toBe(21);
    });
  });
});
