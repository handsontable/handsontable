describe('Core.getTableWidth', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return the width of the table container (not defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    expect(getTableWidth()).toBe(document.documentElement.clientWidth);
  });

  it('should return the width of the table container (defined size)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 500,
      height: 500,
    });

    expect(getTableWidth()).toBe(500);
  });
});
