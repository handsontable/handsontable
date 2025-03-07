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
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 50,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(50);
  });

  it('should return `defaultRowHeight` if `rowHeights` is less than `defaultRowHeight`', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 12,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(getDefaultRowHeight());
  });

  it('should return `defaultRowHeight` if rowHeights is equal to 0', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 0,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(getDefaultRowHeight());
  });
});
