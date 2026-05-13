describe('Core.getTableHeight', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return the height of the table container (not defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    expect(getTableHeight()).toBe((getDefaultRowHeight() * 5) + 1);
  });

  it('should return the height of the table container (defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 500,
      height: 500,
    });

    expect(getTableHeight()).toBe(500);
  });
});
