describe('Pagination `getPaginationData` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return correct pagination state', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
    });
  });
});
