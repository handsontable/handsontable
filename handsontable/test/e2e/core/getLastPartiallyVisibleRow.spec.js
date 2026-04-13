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

  it('should return last partially visible row index', async() => {
    const layout = getThemeLayout();
    const height = layout.e2ePickForDensity({ compact: 200, default: 255, comfortable: 325 });
    const expected = layout.e2ePickForDensity({ compact: 7, default: 8, comfortable: 8 });

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height,
    });

    expect(getLastPartiallyVisibleRow()).toBe(expected);
  });

  it('should return last partially visible and not hidden row index', async() => {
    const layout = getThemeLayout();
    const height = layout.e2ePickForDensity({ compact: 200, default: 255, comfortable: 325 });
    const expected = layout.e2ePickForDensity({ compact: 9, default: 10, comfortable: 10 });

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastPartiallyVisibleRow()).toBe(expected);
  });

  it('should return last partially visible row index (scrolled viewport)', async() => {
    const layout = getThemeLayout();
    const height = layout.e2ePickForDensity({ compact: 200, default: 255, comfortable: 325 });
    const scrollY = layout.e2ePickForDensity({ compact: 355, default: 447, comfortable: 570 });
    const expected = layout.e2ePickForDensity({ compact: 20, default: 23, comfortable: 23 });

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height,
    });

    await scrollViewportVertically(scrollY); // row 23 (A24) is partially visible
    await render();

    expect(getLastPartiallyVisibleRow()).toBe(expected);
  });
});
