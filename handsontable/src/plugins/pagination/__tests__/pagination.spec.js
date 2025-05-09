describe('Pagination', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should ...', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      width: 500,
      height: 300
    });
  });
});
