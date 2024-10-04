describe('StretchColumns with `beforeStretchingColumnWidth` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // TODO:
  xit('should be triggered once per column', () => {
    handsontable({
      data: createSpreadsheetData(5, 9),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    expect(getColWidth(8)).toBe(50);
  });
});
