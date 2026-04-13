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

  it('should return last rendered row index', async() => {
    const layout = getThemeLayout();
    const height = layout.e2ePickForDensity({ compact: 200, default: 250, comfortable: 319 });
    const expected = layout.e2ePickForDensity({ compact: 8, default: 9, comfortable: 9 });

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height,
    });

    expect(getLastRenderedVisibleRow()).toBe(expected);
  });

  it('should return last rendered and not hidden row index', async() => {
    const layout = getThemeLayout();
    const height = layout.e2ePickForDensity({ compact: 200, default: 250, comfortable: 319 });
    const expected = layout.e2ePickForDensity({ compact: 10, default: 11, comfortable: 11 });

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastRenderedVisibleRow()).toBe(expected);
  });

  it('should return last rendered row index (scrolled viewport)', async() => {
    const layout = getThemeLayout();
    const height = layout.e2ePickForDensity({ compact: 200, default: 250, comfortable: 319 });
    const scrollY = layout.e2ePickForDensity({ compact: 355, default: 447, comfortable: 570 });
    const expected = layout.e2ePickForDensity({ compact: 21, default: 24, comfortable: 24 });

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height,
    });

    await scrollViewportVertically(scrollY); // row 23 (A24) is partially visible
    await render();

    expect(getLastRenderedVisibleRow()).toBe(expected);
  });
});
