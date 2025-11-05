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

  it('should be synced with the cell row height when the `rowHeights` value is greater than the cell default row height', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 50,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(50);
    expect(getRowHeight(1)).toBe(50);
    expect(getRowHeight(2)).toBe(50);
  });

  it('should be synced with the cell row height when the `rowHeights` value is smaller than the cell default row height', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 10,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(getFirstRenderedRowDefaultHeight());
    expect(getRowHeight(1)).toBe(getDefaultRowHeight());
    expect(getRowHeight(2)).toBe(getDefaultRowHeight());
  });

  it('should be synced with the cell row height when the `rowHeights` value is `0`', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeights: 0,
      rowHeaders: false,
      colHeaders: false,
    });

    expect(getRowHeight(0)).toBe(getFirstRenderedRowDefaultHeight());
    expect(getRowHeight(1)).toBe(getDefaultRowHeight());
    expect(getRowHeight(2)).toBe(getDefaultRowHeight());
  });

  it('should return correct value for the first rendered row when some of them are hidden', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: false,
      colHeaders: false,
      rowHeights: getDefaultRowHeight(),
      hiddenRows: {
        rows: [0, 1],
      },
    });

    expect(getRowHeight(0)).toBe(0);
    expect(getRowHeight(1)).toBe(0);
    expect(getRowHeight(2)).toBe(getFirstRenderedRowDefaultHeight()); // first rendered row
    expect(getRowHeight(3)).toBe(getDefaultRowHeight());
    expect(getRowHeight(4)).toBe(getDefaultRowHeight());
  });
});
