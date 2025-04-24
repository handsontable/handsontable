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

  it('should call the `modifyRowHeight` internally', async() => {
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

  it('should return the same value as the `rowHeights` if the value is greater than minimum theme row height', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 50,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(50);
  });

  it('should return the minimum theme row height if the lower value is defined', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 12,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(getDefaultRowHeight());
  });

  it('should return the minimum theme row height if the value is equal to `0`', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 0,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(getDefaultRowHeight());
  });
});
