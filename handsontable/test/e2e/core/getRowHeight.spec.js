describe('Core.getRowHeight', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call the `modifyRowHeight` internally', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 50,
      rowHeaders: false,
      colHeaders: false,
    });

    const modifyRowHeight = jasmine.createSpy('modifyRowHeight');

    addHook('modifyRowHeight', modifyRowHeight);
    getRowHeight(1);

    expect(modifyRowHeight.calls.count()).toBe(1);
    expect(modifyRowHeight).toHaveBeenCalledWith(50, 1);
  });

  it('should return `rowHeights` if value is greater than `defaultHeight`', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 50,
      rowHeaders: false,
      colHeaders: false,
    });

    // value equal to `rowHeights` - 1px border width
    expect(hot.getCell(0, 0).style.height).toBe('49px');
  });

  it('should return `defaultHeight` if `rowHeights` is less than `defaultHeight`', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 12,
      rowHeaders: false,
      colHeaders: false,
    });

    // value equal to `defaultHeight` - 1px border width
    expect(hot.getCell(0, 0).style.height).toBe('22px');
  });

  it('should return `defaultHeight` if rowHeights is equal to 0', () => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 0,
      rowHeaders: false,
      colHeaders: false,
    });

    // value equal to `defaultHeight` - 1px border width
    expect(hot.getCell(0, 0).style.height).toBe('22px');
  });
});
