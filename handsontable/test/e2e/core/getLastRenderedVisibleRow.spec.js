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

  it.forTheme('classic')('should return last rendered row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    expect(getLastRenderedVisibleRow()).toBe(9);
  });

  it.forTheme('main')('should return last rendered row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    expect(getLastRenderedVisibleRow()).toBe(9);
  });

  it.forTheme('horizon')('should return last rendered row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 319,
    });

    expect(getLastRenderedVisibleRow()).toBe(9);
  });

  it.forTheme('classic')('should return last rendered and not hidden row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastRenderedVisibleRow()).toBe(11);
  });

  it.forTheme('main')('should return last rendered and not hidden row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastRenderedVisibleRow()).toBe(11);
  });

  it.forTheme('horizon')('should return last rendered and not hidden row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 319,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastRenderedVisibleRow()).toBe(11);
  });

  it.forTheme('classic')('should return last rendered row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 200,
    });

    await scrollViewportVertically(355); // row 23 (A24) is partially visible
    await render();

    expect(getLastRenderedVisibleRow()).toBe(26);
  });

  it.forTheme('main')('should return last rendered row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    await scrollViewportVertically(447); // row 23 (A24) is partially visible
    await render();

    expect(getLastRenderedVisibleRow()).toBe(26);
  });

  it.forTheme('horizon')('should return last rendered row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 319,
    });

    await scrollViewportVertically(570); // row 23 (A24) is partially visible
    await render();

    expect(getLastRenderedVisibleRow()).toBe(26);
  });
});
