describe('Pagination UI', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function isTopBorderVisible() {
    const {
      borderTopColor,
    } = getComputedStyle(getPaginationContainerElement());

    if (!borderTopColor.startsWith('rgba')) {
      return true;
    }

    return borderTopColor.slice(borderTopColor.lastIndexOf(',') + 1, -1) > 0;
  }

  it('should correctly calculate the width of the pagination container (table has defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(15, 20),
      width: 300,
      height: 300,
      pagination: true,
    });

    expect(getPaginationContainerElement().offsetWidth).toBe(300);
  });

  it('should correctly calculate the width of the pagination container (table has not defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: {
        pageSize: 9,
      },
    });

    expect(getPaginationContainerElement().offsetWidth).toBe(500);
  });

  it('should draw border-top of the pagination container when the workspace height is bigger than tables content height', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      width: 600,
      height: 400,
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(true);
  });

  it('should not draw border-top of the pagination container when the workspace height is the same as tables content height', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      width: 600,
      height: (getDefaultRowHeight() * 10) + 1,
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(false);
  });

  it('should draw border-top of the pagination container when the workspace height is smaller than tables content height', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      width: 600,
      height: 250,
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(true);
  });

  it('should not draw border-top of the pagination container when the last row is fully visible (the viewport is scroll to most-bottom position)', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      width: 600,
      height: getDefaultRowHeight() * 5,
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(true);

    await scrollViewportTo({ row: 8 });

    expect(isTopBorderVisible()).toBe(true);

    await scrollViewportTo({ row: 9 });

    expect(isTopBorderVisible()).toBe(false);
  });

  it('should not draw border-top of the pagination container in any case when table has not defined size', async() => {
    handsontable({
      data: createSpreadsheetData(11, 10),
      pagination: true,
    });

    expect(isTopBorderVisible()).toBe(false);

    getPlugin('pagination').nextPage();

    expect(isTopBorderVisible()).toBe(false);
  });
});
