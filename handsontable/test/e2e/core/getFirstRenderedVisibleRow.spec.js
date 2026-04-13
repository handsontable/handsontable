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
    const layout = getThemeLayout();
    const height = layout.e2ePickForDensity({ compact: 200, default: 240, comfortable: 306 });
    const scrollY = layout.e2ePickForDensity({ compact: 355, default: 447, comfortable: 570 });
    const expected = layout.e2ePickForDensity({ compact: 12, default: 14, comfortable: 14 });

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height,
    });

    await scrollViewportVertically(scrollY); // row 15 (A16) is partially visible
    await render();

    expect(getFirstRenderedVisibleRow()).toBe(expected);
  });
});
