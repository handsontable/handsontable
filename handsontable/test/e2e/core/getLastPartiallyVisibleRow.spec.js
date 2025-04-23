describe('Core.getLastPartiallyVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find('#testContainer').remove();
    }
  });

  it.forTheme('classic')('should return last partially visible row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastPartiallyVisibleRow()).toBe(8);
  });

  it.forTheme('main')('should return last partially visible row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    expect(getLastPartiallyVisibleRow()).toBe(8);
  });

  it.forTheme('horizon')('should return last partially visible row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 325,
    });

    expect(getLastPartiallyVisibleRow()).toBe(8);
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

    expect(getLastPartiallyVisibleRow()).toBe(10);
  });

  it.forTheme('main')('should return last partially visible and not hidden row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    render();

    expect(getLastPartiallyVisibleRow()).toBe(10);
  });

  it.forTheme('horizon')('should return last partially visible and not hidden row index', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 325,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    render();

    expect(getLastPartiallyVisibleRow()).toBe(10);
  });

  it.forTheme('classic')('should return last partially visible row index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    setScrollTop(355); // row 23 (A24) is partially visible
    render();

    expect(getLastPartiallyVisibleRow()).toBe(23);
  });

  it.forTheme('main')('should return last partially visible row index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 255,
    });

    setScrollTop(447); // row 23 (A24) is partially visible
    render();

    expect(getLastPartiallyVisibleRow()).toBe(23);
  });

  it.forTheme('horizon')('should return last partially visible row index (scrolled viewport)', () => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 325,
    });

    setScrollTop(570); // row 23 (A24) is partially visible
    render();

    expect(getLastPartiallyVisibleRow()).toBe(23);
  });
});
